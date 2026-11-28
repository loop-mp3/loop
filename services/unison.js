// Unison provider adapter.
function normalizeUnisonBadge(badge) {
    if (!badge || typeof badge !== "object") return null;
    const key = String(badge.key || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) return null;
    const tier = Number(badge.tier);
    return {
        key,
        name: String(badge.name || key).trim() || key,
        tier: Number.isFinite(tier) && tier > 0 ? Math.trunc(tier) : null,
    };
}

function normalizeUnisonSubmitter(submitter) {
    if (!submitter || typeof submitter !== "object") return null;
    const displayName = String(submitter.displayName || "").trim();
    const keyId = String(submitter.keyId || "").trim();
    if (!displayName && !keyId) return null;

    const featured = Array.isArray(submitter.featured)
        ? submitter.featured
        : Array.isArray(submitter.badges) ? submitter.badges : [];
    const badges = [];
    for (const badge of [...featured, submitter.topBadge]) {
        const normalized = normalizeUnisonBadge(badge);
        if (normalized && !badges.some((existing) => existing.key === normalized.key)) badges.push(normalized);
    }

    const avatarUrl = String(submitter.avatarUrl || "").trim();
    const tier = String(submitter.tier || "").trim();
    const level = Number(submitter.level);
    const levelProgress = Number(submitter.levelProgress);
    const reputation = Number(submitter.reputation);
    const badgeCount = Number(submitter.badgeCount);
    return {
        keyId: keyId || null,
        displayName: displayName || keyId,
        avatarUrl: /^https?:\/\//i.test(avatarUrl) ? avatarUrl : null,
        tier: tier || null,
        level: Number.isFinite(level) && level > 0 ? Math.trunc(level) : null,
        levelProgress: Number.isFinite(levelProgress) ? Math.min(Math.max(levelProgress, 0), 1) : null,
        reputation: Number.isFinite(reputation) && reputation >= 0 ? reputation : null,
        badgeCount: Number.isFinite(badgeCount) && badgeCount >= 0 ? Math.trunc(badgeCount) : badges.length,
        topBadge: normalizeUnisonBadge(submitter.topBadge),
        badges,
    };
}

(function registerUnisonAdapter(global) {
    global.LoopLyricsProviderAdapters ||= {};
    global.LoopLyricsProviderAdapters.unison = ({ normalizeLyricsResponse, hasSyncedLyricTimestamps }) => ({
        async request({ provider, trackId, title, artist, duration, signal }) {
            const normalizeUnisonLyrics = (payload, fallbackMetadata = {}) => {
                const entries = Array.isArray(payload?.data)
                    ? payload.data
                    : [payload?.data && typeof payload.data === "object" ? payload.data : payload];
                const matchingEntries = fallbackMetadata.videoId
                    ? [...entries].sort((left, right) =>
                        Number(String(right?.videoId || "") === String(fallbackMetadata.videoId)) -
                        Number(String(left?.videoId || "") === String(fallbackMetadata.videoId))
                    )
                    : entries;

                for (const entry of matchingEntries) {
                    if (!entry || typeof entry !== "object") continue;
                    const lyricsText = String(entry.lyrics || entry.syncedLyrics || entry.lrc || "").trim();
                    const isTTML = /^\s*<tt(?:\s|>)/i.test(lyricsText);
                    const isLrc = String(entry.format || "").toLowerCase() === "lrc" &&
                        (typeof hasSyncedLyricTimestamps !== "function" || hasSyncedLyricTimestamps(lyricsText));
                    if (!isTTML && !isLrc) continue;

                    return normalizeLyricsResponse({
                        ...fallbackMetadata,
                        ...entry,
                        submitter: normalizeUnisonSubmitter(entry.submitter),
                        syncedLyrics: lyricsText,
                        plainLyrics: null,
                        duration: entry.duration ?? fallbackMetadata.duration,
                    }, "unison");
                }
                return null;
            };

            const videoId = String(trackId || "").trim();
            if (videoId) {
                const videoResponse = await fetch(`${provider.endpoint}/lyrics?v=${encodeURIComponent(videoId)}`, { signal });
                if (videoResponse.ok) {
                    const videoLyrics = normalizeUnisonLyrics(await videoResponse.json(), { videoId });
                    if (videoLyrics) return videoLyrics;
                }
            }

            const searchQuery = new URLSearchParams({ song: title, artist }).toString();
            const searchResponse = await fetch(`${provider.endpoint}/lyrics/search?${searchQuery}`, { signal });
            if (!searchResponse.ok) throw new Error(`${provider.label} search returned ${searchResponse.status}`);

            const searchPayload = await searchResponse.json();
            const results = Array.isArray(searchPayload?.data) ? searchPayload.data : [];
            if (!results.length) throw new Error(`${provider.label} returned no matches`);

            const requestedDuration = Number(duration);
            const selectedResult = [...results].sort((left, right) => {
                const durationDelta = (result) => Number.isFinite(requestedDuration) && Number.isFinite(Number(result?.duration))
                    ? Math.abs(Number(result.duration) - requestedDuration)
                    : Infinity;
                return durationDelta(left) - durationDelta(right) ||
                    Number(right?.matchScore || 0) - Number(left?.matchScore || 0);
            })[0];
            const matchedVideoId = String(selectedResult?.videoId || "").trim();
            if (!matchedVideoId) throw new Error(`${provider.label} returned a match without a video ID`);

            const lyricsResponse = await fetch(`${provider.endpoint}/lyrics/variants/${encodeURIComponent(matchedVideoId)}`, { signal });
            if (!lyricsResponse.ok) throw new Error(`${provider.label} lyrics returned ${lyricsResponse.status}`);
            // checks if the lyircs vid title matches the song's cuz sometimes we hit slowed ones and it just shits itself
            const unisonResponseJson = await lyricsResponse.json()
            const unisonLyricsTrackTitle = unisonResponseJson.data[0]?.song;
            if (unisonLyricsTrackTitle.toLowerCase() !== title.toLowerCase()) {
              throw new Error(`${provider.label} returned invalid lyrics (the title didnt matched)`);
            }
            const lyrics = normalizeUnisonLyrics(await lyricsResponse.json(), selectedResult);
            if (!lyrics) throw new Error(`${provider.label} returned invalid lyrics`);
            return lyrics;
        },
    });
})(globalThis);
