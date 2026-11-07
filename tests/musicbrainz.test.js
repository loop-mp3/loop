import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = fs.readFileSync(new URL("../services/metadata.js", import.meta.url), "utf8");

function createMetadataModule(responses) {
    const requests = [];
    const context = {
        AbortController,
        URLSearchParams,
        fetch: async (url) => {
            requests.push(String(url));
            const payload = responses.shift();
            return {
                ok: true,
                json: async () => payload,
            };
        },
        globalThis: {},
        setTimeout,
        clearTimeout,
        console,
    };
    vm.runInNewContext(source, context);
    return { module: context.globalThis, requests };
}

test("uses MusicBrainz composer and lyricist relationships for writer credits", async () => {
    const { module, requests } = createMetadataModule([
        {
            recordings: [{
                id: "recording-id",
                title: "Example Song",
                "artist-credit": [{ name: "Example Artist" }],
            }],
        },
        {
            relations: [
                { type: "composer", artist: { name: "Composer Name" } },
                { type: "lyricist", artist: { name: "Lyricist Name" } },
                { type: "performer", artist: { name: "Performer Name" } },
                { type: "writer", artist: { name: "Composer Name" } },
                { type: "performance", work: { id: "work-id" } },
            ],
        },
        {
            relations: [
                { type: "composer", artist: { name: "Work Composer" } },
            ],
        },
    ]);

    const writers = await module.getMusicBrainzWriterCredits("Example Song", "Example Artist");

    assert.deepEqual(Array.from(writers), ["Composer Name", "Lyricist Name", "Work Composer"]);
    assert.equal(requests.length, 3);
    assert.match(requests[0], /musicbrainz\.org\/ws\/2\/recording\?/);
    assert.match(requests[0], /recording%3A%22Example\+Song%22/);
    assert.match(requests[1], /\/recording\/recording-id\?/);
    assert.match(requests[1], /inc=artist-rels%2Bwork-rels/);
    assert.match(requests[2], /\/work\/work-id\?/);
    assert.match(requests[2], /inc=artist-rels/);

    const cachedWriters = await module.getMusicBrainzWriterCredits("Example Song", "Example Artist");
    assert.deepEqual(Array.from(cachedWriters), Array.from(writers));
    assert.equal(requests.length, 3);
});

test("returns YouTube metadata before MusicBrainz fallback resolves", async () => {
    const requests = [];
    let resolveMusicBrainz;
    const musicBrainzPayload = new Promise((resolve) => {
        resolveMusicBrainz = resolve;
    });
    const context = {
        AbortController,
        URLSearchParams,
        LoopYtmDom: {
            getTrackInfo: () => ({
                title: "Unknown track",
                artist: "Example Artist",
                album: "Unknown album",
            }),
        },
        getCachedTrackWriters: async () => null,
        cacheTrackWriters: async () => true,
        fetch: async (url) => {
            const requestURL = String(url);
            requests.push(requestURL);
            if (requestURL.includes("youtube.com/oembed")) {
                return {
                    ok: true,
                    json: async () => ({
                        title: "Example Song",
                        author_name: "Example Artist",
                        author_url: "https://www.youtube.com/@example",
                    }),
                };
            }
            if (requestURL.includes("youtubei/v1/player")) {
                return {
                    ok: true,
                    json: async () => ({
                        videoDetails: {
                            title: "Example Song",
                            author: "Example Artist - Topic",
                            musicVideoType: "MUSIC_VIDEO_TYPE_ATV",
                        },
                    }),
                };
            }
            if (requestURL.includes("youtubei/v1/browse")) {
                return { ok: true, json: async () => ({}) };
            }
            return { ok: true, json: async () => musicBrainzPayload };
        },
        globalThis: {},
        setTimeout,
        clearTimeout,
        console,
    };
    vm.runInNewContext(source, context);

    const info = await context.globalThis.getTrackInfoFromTrackId("track-id", null);

    assert.equal(info.title, "Example Song");
    assert.equal(info.artist, "Example Artist - Topic");
    assert.deepEqual(Array.from(info.TrackWriters), []);
    assert.equal(typeof info.musicBrainzWriterPromise?.then, "function");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(requests.some((url) => url.includes("musicbrainz.org/ws/2")), true);

    resolveMusicBrainz({ recordings: [] });
    assert.deepEqual(Array.from(await info.musicBrainzWriterPromise), []);
});

test("does not query MusicBrainz without a complete track identity", async () => {
    const { module, requests } = createMetadataModule([]);

    assert.deepEqual(Array.from(await module.getMusicBrainzWriterCredits("", "Example Artist")), []);
    assert.deepEqual(Array.from(await module.getMusicBrainzWriterCredits("Example Song", "")), []);
    assert.equal(requests.length, 0);
});
