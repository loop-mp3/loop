import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

const adapterSource = fs.readFileSync(new URL("../services/betterlyrics.js", import.meta.url), "utf8");
const variableSource = fs.readFileSync(new URL("../variable.js", import.meta.url), "utf8");
const manifestSource = fs.readFileSync(new URL("../manifest.json", import.meta.url), "utf8");

function createBetterLyricsAdapter(payload, status = 200) {
    const requests = [];
    const normalizationCalls = [];
    const context = {
        URLSearchParams,
        fetch: async (url) => {
            requests.push(url);
            return {
                ok: status >= 200 && status < 300,
                status,
                text: async () => JSON.stringify(payload),
            };
        },
        globalThis: {},
    };
    vm.runInNewContext(adapterSource, context);

    const factory = context.globalThis.LoopLyricsProviderAdapters.betterlyrics;
    const adapter = factory({
        normalizeLyricsResponse: (lyrics, provider) => {
            normalizationCalls.push({ lyrics, provider });
            return {
                meta: { ...lyrics, provider },
                syncedLyrics: lyrics.syncedLyrics,
                plainLyrics: lyrics.plainLyrics,
            };
        },
    });
    return { adapter, requests, normalizationCalls };
}

const TTML = `<tt xmlns="http://www.w3.org/ns/ttml"><body><div>` +
    `<p begin="00:00:01.000" end="00:00:03.000">Hello</p>` +
    `</div></body></tt>`;

test("betterlyrics requests TTML with track metadata and normalizes the response", async () => {
    const { adapter, requests, normalizationCalls } = createBetterLyricsAdapter({
        ttml: TTML,
        duration: 210,
        source: "betterlyrics-api",
    });

    const result = await adapter.request({
        provider: { endpoint: "https://api.betterlyrics.org/", label: "BetterLyrics" },
        trackId: "abc123",
        title: "A Song",
        artist: "An Artist",
        album: "An Album",
        duration: 209.4,
        signal: new AbortController().signal,
    });

    assert.equal(requests.length, 1);
    const url = new URL(requests[0]);
    assert.equal(url.origin + url.pathname, "https://api.betterlyrics.org/getLyrics");
    assert.equal(url.searchParams.get("s"), "A Song");
    assert.equal(url.searchParams.get("a"), "An Artist");
    assert.equal(url.searchParams.get("al"), "An Album");
    assert.equal(url.searchParams.get("d"), "209");
    assert.equal(url.searchParams.get("v"), "abc123");

    assert.equal(normalizationCalls.length, 1);
    assert.equal(normalizationCalls[0].provider, "betterlyrics");
    assert.equal(normalizationCalls[0].lyrics.syncedLyrics, TTML);
    assert.equal(normalizationCalls[0].lyrics.plainLyrics, null);
    assert.equal(normalizationCalls[0].lyrics.duration, 210);
    assert.equal(result.meta.provider, "betterlyrics");
    assert.equal(result.syncedLyrics, TTML);
});

test("betterlyrics rejects responses without usable TTML", async () => {
    const { adapter } = createBetterLyricsAdapter({ ttml: "not ttml" });

    await assert.rejects(
        adapter.request({
            provider: { endpoint: "https://api.betterlyrics.org", label: "BetterLyrics" },
            trackId: "abc123",
            title: "A Song",
            artist: "An Artist",
            duration: 210,
            signal: new AbortController().signal,
        }),
        /BetterLyrics returned invalid lyrics/
    );
});

test("betterlyrics is loaded and registered as a default lyrics provider", () => {
    const manifest = JSON.parse(manifestSource);
    const scripts = manifest.content_scripts[0].js;
    const bootstrapIndex = scripts.indexOf("core/app-bootstrap.js");

    assert.ok(scripts.includes("services/betterlyrics.js"));
    assert.ok(scripts.indexOf("services/betterlyrics.js") < bootstrapIndex);

    const context = { globalThis: {} };
    vm.runInNewContext(variableSource, context);
    const variables = context.globalThis.LoopVariables;
    const providerIds = variables.lyricsProviders.map((provider) => provider.id);

    const expectedOrder = [
        "unison",
        "betterlyrics",
        "binilyrics-ttml",
        "lyricsplus",
        "binilyrics-lrc",
        "lrclib",
        "groove",
        "groove-dev",
    ];

    assert.deepEqual([...providerIds], expectedOrder);
    assert.deepEqual([...variables.defaultLyricsProviderIds], expectedOrder);
    assert.deepEqual([...variables.defaultLoopPreferences.lyricsProviderOrder], expectedOrder);

    const provider = variables.lyricsProviders.find((entry) => entry.id === "betterlyrics");
    assert.equal(provider.label, "BetterLyrics");
    assert.equal(provider.endpoint, "https://api.betterlyrics.org");
});
