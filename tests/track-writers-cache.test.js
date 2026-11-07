import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = fs.readFileSync(new URL("../services/lyrics-cache.js", import.meta.url), "utf8");

function createCacheModule() {
    const values = {};
    const storage = {
        get(keys, callback) {
            if (keys === null) {
                callback({ ...values });
                return;
            }
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            callback(Object.fromEntries(requestedKeys
                .filter((key) => Object.hasOwn(values, key))
                .map((key) => [key, values[key]])));
        },
        set(entries, callback) {
            Object.assign(values, entries);
            callback();
        },
        remove(key, callback) {
            delete values[key];
            callback();
        },
    };
    const globalObject = {
        chrome: { storage: { local: storage }, runtime: {} },
        browser: {},
    };
    const context = {
        globalThis: globalObject,
        lyricsCacheKeyPrefix: "lyrics_",
        manualLyricsCacheKeyPrefix: "lyrics_manual_",
        translationCacheKeyPrefix: "translation_",
        trackWritersCacheKeyPrefix: "track_writers_",
        setTimeout,
        clearTimeout,
        console,
    };
    vm.runInNewContext(source, context);
    return { module: globalObject, values };
}

test("stores YouTube and MusicBrainz writer credits in one cache entry", async () => {
    const { module, values } = createCacheModule();

    assert.equal(await module.cacheTrackWriters("track-id", "Example Song", "Example Artist", "youtube", ["YouTube Writer"]), true);
    assert.equal(await module.cacheTrackWriters("track-id", "Example Song", "Example Artist", "musicbrainz", ["MusicBrainz Writer"]), true);

    const cached = await module.getCachedTrackWriters("track-id");
    assert.deepEqual(Array.from(cached.youtubeWriters), ["YouTube Writer"]);
    assert.deepEqual(Array.from(cached.musicBrainzWriters), ["MusicBrainz Writer"]);

    const entries = await module.getAllLyricsCacheEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].cacheType, "writers");
    assert.deepEqual(Array.from(entries[0].youtubeWriters), ["YouTube Writer"]);
    assert.deepEqual(Array.from(entries[0].musicBrainzWriters), ["MusicBrainz Writer"]);
    assert.ok(values["track_writers_track-id"]);
});
