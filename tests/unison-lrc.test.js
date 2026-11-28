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

test("pulls the submitter and their stats into the normalized result", async () => {
    const { adapter } = createUnisonAdapter({
        success: true,
        data: {
            videoId: "nbuCy7jS61Y",
            song: "MY JEALOUSY",
            artist: "vivi baby, ovg!",
            duration: 180,
            lyrics: "[00:00.11] one\n[00:06.23] two",
            format: "lrc",
            syncType: "linesync",
            submitter: {
                keyId: "a80b6e29ae6f",
                reputation: 2,
                displayName: "Saaransh_Xd",
                tier: "elite",
                level: 3,
                levelProgress: 0.1,
                badgeCount: 7,
                topBadge: { key: "verified-contributor", name: "Verified Contributor", tier: 2 },
                featured: [
                    { key: "verified-contributor", name: "Verified Contributor", tier: 2 },
                    { key: "early-adopter", name: "Early Adopter" },
                    { key: "flawless", name: "Flawless" },
                    { key: "first-responder", name: "First Responder", tier: 1 },
                    { key: "sharp-ear", name: "Sharp Ear", tier: 1 },
                ],
                avatarUrl: "https://cdn.discordapp.com/avatars/1/avatar.png?size=128",
            },
        },
    });

    const result = await adapter.request({
        provider: { endpoint: "https://unison.example", label: "Unison" },
        trackId: "nbuCy7jS61Y",
        title: "MY JEALOUSY",
        artist: "vivi baby, ovg!",
        duration: 180,
        signal: new AbortController().signal,
    });

    // The adapter runs in a vm realm, so normalize the prototype before the deep comparison.
    assert.deepEqual(JSON.parse(JSON.stringify(result.meta.submitter)), {
        keyId: "a80b6e29ae6f",
        displayName: "Saaransh_Xd",
        avatarUrl: "https://cdn.discordapp.com/avatars/1/avatar.png?size=128",
        tier: "elite",
        level: 3,
        levelProgress: 0.1,
        reputation: 2,
        badgeCount: 7,
        topBadge: { key: "verified-contributor", name: "Verified Contributor", tier: 2 },
        badges: [
            { key: "verified-contributor", name: "Verified Contributor", tier: 2 },
            { key: "early-adopter", name: "Early Adopter", tier: null },
            { key: "flawless", name: "Flawless", tier: null },
            { key: "first-responder", name: "First Responder", tier: 1 },
            { key: "sharp-ear", name: "Sharp Ear", tier: 1 },
        ],
    });
});

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
