// Unison provider adapter.
(function registerUnisonAdapter(global) {
    global.LoopLyricsProviderAdapters ||= {};
    global.LoopLyricsProviderAdapters.unison = ({ normalizeLyricsResponse }) => ({
        async request({ provider, trackId, title, artist, duration, signal }) {
            const normalizeUnisonLyrics = (payload, fallbackMetadata = {}) => {
                const lyricsText = String(payload?.data?.lyrics || "").trim();
                if (!/^\s*<tt(?:\s|>)/i.test(lyricsText)) return null;
                return normalizeLyricsResponse({
                    ...fallbackMetadata,
                    ...payload.data,
                    syncedLyrics: lyricsText,
                    plainLyrics: null,
                    duration: payload.data?.duration ?? fallbackMetadata.duration,
                }, "unison");
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
            const lyrics = normalizeUnisonLyrics(await lyricsResponse.json(), selectedResult);
            if (!lyrics) throw new Error(`${provider.label} returned invalid TTML`);
            return lyrics;
        },
    });
})(globalThis);
