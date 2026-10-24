// LyricsPlus provider adapter.
(function registerLyricsPlusAdapter(global) {
    global.LoopLyricsProviderAdapters ||= {};
    global.LoopLyricsProviderAdapters.lyricsplus = ({ normalizeLyricsResponse, lyricsPlusToTTML }) => ({
        async request({ provider, trackId, title, artist, signal }) {
            const fetchLyrics = (searchArtist) => {
                const query = new URLSearchParams({ title, artist: searchArtist }).toString();
                return fetch(`${provider.endpoint}?${query}`, { signal });
            };

            let response = await fetchLyrics(artist);
            if (response.status === 404 && trackId) {
                try {
                    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`;
                    const oEmbedResponse = await fetch(oEmbedUrl, { signal });
                    if (oEmbedResponse.ok) {
                        const oEmbed = await oEmbedResponse.json();
                        const oEmbedArtist = String(oEmbed.author_name || "")
                            .replace(/\s*[-–—]\s*Topic$/i, "")
                            .trim();
                        if (oEmbedArtist && oEmbedArtist.toLowerCase() !== String(artist || "").trim().toLowerCase()) {
                            console.log("[loop.mp3] LyricsPlus artist retry using the track author:", {
                                title,
                                artist,
                                trackAuthor: oEmbedArtist,
                            });
                            response = await fetchLyrics(oEmbedArtist);
                        }
                    }
                } catch (error) {
                    if (error?.name === "AbortError") throw error;
                    console.warn("[loop.mp3] LyricsPlus track-author retry failed:", error);
                }
            }
            if (!response.ok) throw new Error(`LyricsPlus returned ${response.status}`);

            const payload = await response.json();
            const lines = Array.isArray(payload?.lyrics) ? payload.lyrics : [];
            const syncedLyrics = lyricsPlusToTTML(lines);
            if (!syncedLyrics || !lines.some((line) => line?.text)) {
                throw new Error("LyricsPlus returned no usable lyrics");
            }

            return normalizeLyricsResponse({
                ...payload,
                syncedLyrics,
                plainLyrics: lines.filter((line) => line.text).map((line) => line.text).join("\n"),
                duration: payload?.metadata?.totalDuration || payload?.duration,
                songWriters: payload?.metadata?.songWriters || [],
            }, "lyricsplus");
        },
    });
})(globalThis);
