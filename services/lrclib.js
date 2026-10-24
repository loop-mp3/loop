// LRCLIB search and candidate adapters.
(function registerLrclibAdapter(global) {
    global.LoopLyricsProviderAdapters ||= {};

    global.LoopLyricsProviderAdapters.lrclib = ({
        normalizeLyricsResponse,
        hasSyncedLyricTimestamps,
        lyricsDurationExceedsTrack,
    }) => {
        const search = async (provider, searchText, signal) => {
            const query = new URLSearchParams({ q: searchText }).toString();
            const response = await fetch(`${provider.endpoint}?${query}`, { signal });
            if (!response.ok) throw new Error(`LRCLIB search returned ${response.status}`);
            return response.json();
        };

        async function getResults({ provider, trackId, title, artist, signal, queryOverride = "" }) {
            const searches = [queryOverride || `${title} ${artist}`];
            try {
                const oEmbedResponse = await fetch(
                    `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`,
                    { signal }
                );
                if (oEmbedResponse.ok) {
                    const oEmbed = await oEmbedResponse.json();
                    const oEmbedArtist = String(oEmbed.author_name || "")
                        .replace(/\s*[-–—]\s*Topic$/i, "")
                        .trim();
                    if (oEmbedArtist) searches.push(`${title} ${oEmbedArtist}`);
                }
            } catch {
                // The title/artist search below is sufficient when oEmbed is unavailable.
            }
            searches.push(title);

            const seen = new Set();
            const results = [];
            for (const searchText of [...new Set(searches)]) {
                const data = await search(provider, searchText, signal);
                for (const result of Array.isArray(data) ? data : []) {
                    const key = String(result?.id ?? `${result?.trackName}|${result?.artistName}|${result?.duration}`);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    results.push(normalizeLyricsResponse(result, "lrclib") || {
                        meta: { ...result, provider: "lrclib", lyricsUnavailable: true },
                        syncedLyrics: null,
                        plainLyrics: null,
                    });
                }
                if (results.length) break;
            }
            return results;
        }

        return {
            async request({ provider, trackId, title, artist, duration, signal }) {
                const data = await search(provider, `${title} ${artist}`, signal);
                let results = Array.isArray(data) ? data : [];
                if (!results[0] && trackId) {
                    try {
                        const oEmbedResponse = await fetch(
                            `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`,
                            { signal }
                        );
                        if (oEmbedResponse.ok) {
                            const oEmbed = await oEmbedResponse.json();
                            const oEmbedArtist = String(oEmbed.author_name || "")
                                .replace(/\s*[-–—]\s*Topic$/i, "")
                                .trim();
                            if (oEmbedArtist) results = await search(provider, `${title} ${oEmbedArtist}`, signal);
                        }
                    } catch (error) {
                        console.warn("[loop.mp3] LRCLIB oEmbed artist retry failed; trying title only:", error);
                    }
                }
                if (!results[0]) results = await search(provider, title, signal);
                const requestedDuration = duration;
                let firstResultLyrics = null;
                for (const [resultIndex, result] of results.entries()) {
                    const syncedLyrics = result?.syncedLyrics || null;
                    const plainLyrics = result?.plainLyrics || null;
                    if (lyricsDurationExceedsTrack(result, result, requestedDuration, syncedLyrics)) {
                        console.log(`[loop.mp3] Skipping LRCLIB search result ${resultIndex + 1} because its duration exceeds the track duration.`, {
                            trackDurationInSeconds: requestedDuration,
                            lyricsDuration: Number(result.duration),
                        });
                        continue;
                    }
                    const resultLyrics = {
                        meta: {
                            ...result,
                            provider: "lrclib",
                            lyricsUnavailable: !syncedLyrics && !plainLyrics && !result?.instrumental,
                        },
                        syncedLyrics: result?.instrumental && !syncedLyrics && !plainLyrics
                            ? "[00:00.00] Instrumental only\n[99:99.99] ♪"
                            : syncedLyrics,
                        plainLyrics,
                    };
                    firstResultLyrics ||= resultLyrics;
                    if (hasSyncedLyricTimestamps(resultLyrics.syncedLyrics) || result?.instrumental) return resultLyrics;
                    if (result?.hasWordSync === false) continue;
                }
                return firstResultLyrics;
            },
            candidates: (context) => getResults(context),
        };
    };
})(globalThis);
