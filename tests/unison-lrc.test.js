import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = fs.readFileSync(new URL("../services/unison.js", import.meta.url), "utf8");

function createUnisonAdapter(payload) {
    const requests = [];
    const context = {
        fetch: async (url) => {
            requests.push(url);
            return {
                ok: true,
                json: async () => payload,
            };
        },
        globalThis: {},
    };
    vm.runInNewContext(source, context);

    const factory = context.globalThis.LoopLyricsProviderAdapters.unison;
    const adapter = factory({
        hasSyncedLyricTimestamps: (lyrics) => /^\s*\[\d+:\d+(?:\.\d+)?\]/m.test(lyrics),
        normalizeLyricsResponse: (lyrics, provider) => ({
            meta: { ...lyrics, provider },
            syncedLyrics: lyrics.syncedLyrics,
            plainLyrics: lyrics.plainLyrics,
        }),
    });
    return { adapter, requests };
}

test("accepts Unison line-synced LRC responses in a data array", async () => {
    const { adapter, requests } = createUnisonAdapter({
        success: true,
        data: [{
            videoId: "5C2FtWrHzbg",
            song: "butterflies",
            artist: "JVKE",
            duration: 154,
            lyrics: "[00:00.11] One, two, one, two, three, ah\n[00:06.23] Yeah, ah, ah",
            format: "lrc",
            syncType: "linesync",
            language: "en",
        }],
    });

    const result = await adapter.request({
        provider: { endpoint: "https://unison.example", label: "Unison" },
        trackId: "5C2FtWrHzbg",
        title: "butterflies",
        artist: "JVKE",
        duration: 154,
        signal: new AbortController().signal,
    });

    assert.equal(requests.length, 1);
    assert.match(requests[0], /\/lyrics\?v=5C2FtWrHzbg$/);
    assert.equal(result.meta.provider, "unison");
    assert.equal(result.meta.format, "lrc");
    assert.equal(result.meta.syncType, "linesync");
    assert.equal(result.syncedLyrics, "[00:00.11] One, two, one, two, three, ah\n[00:06.23] Yeah, ah, ah");
});
