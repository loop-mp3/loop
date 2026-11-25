// BetterLyrics provider adapter.
(function registerBetterLyricsAdapter(global) {
    global.LoopLyricsProviderAdapters ||= {};

    global.LoopLyricsProviderAdapters.betterlyrics = ({
        normalizeLyricsResponse,
        getMusicBrainzAlbum,
    }) => ({
        async request({ provider, trackId, title, artist, album, duration, signal }) {
            const usableAlbumName = (value) => {
                const name = String(value || "").trim();
                return name && !/^unknown(?:\s+album)?$/i.test(name) ? name : "";
            };

            const resolveAlbumName = async () => {
                const providedAlbum = usableAlbumName(album);
                if (providedAlbum) return providedAlbum;
                if (typeof getMusicBrainzAlbum !== "function") return "";
                try {
                    return usableAlbumName(await getMusicBrainzAlbum(title, artist));
                } catch {
                    return "";
                }
            };

            const resolvedAlbum = await resolveAlbumName();
            if (!resolvedAlbum) {
                throw new Error(`${provider.label} skipped: no album name available`);
            }

            const normalizeBetterLyrics = (payload, fallbackMetadata = {}) => {
                const ttml = String(payload?.ttml || "").trim();

                if (!ttml || !/^\s*<tt(?:\s|>)/i.test(ttml)) {
                    return null;
                }

                return normalizeLyricsResponse({
                    ...fallbackMetadata,
                    ...payload,
                    syncedLyrics: ttml,
                    plainLyrics: null,
                    duration: payload.duration ?? fallbackMetadata.duration,
                }, "betterlyrics");
            };

            const endpoint = String(
                provider.endpoint || "https://api.betterlyrics.org"
            ).replace(/\/+$/, "");

            const videoId = String(trackId || "").trim();
            const requestedDuration = Number(duration);

            const params = new URLSearchParams({
                s: String(title || ""),
                a: String(artist || ""),
                al: resolvedAlbum,
                d: String(
                    Number.isFinite(requestedDuration)
                        ? Math.max(0, Math.round(requestedDuration))
                        : 0
                ),
            });

            if (videoId) {
                params.set("v", videoId);
            }

            const response = await fetch(
                `${endpoint}/getLyrics?${params}`,
                { signal }
            );

            const responseText = await response.text();
            let payload;

            try {
                payload = JSON.parse(responseText);
            } catch {
                throw new Error(
                    `${provider.label} returned an invalid response (${response.status})`
                );
            }

            if (!response.ok) {
                const message = payload?.message || payload?.error;
                throw new Error(
                    `${provider.label} returned ${response.status}` +
                    (message ? `: ${message}` : "")
                );
            }

            const lyrics = normalizeBetterLyrics(payload, {
                title,
                artist,
                album: resolvedAlbum,
                duration,
                videoId,
            });

            if (!lyrics) {
                throw new Error(`${provider.label} returned invalid lyrics`);
            }

            return lyrics;
        },
    });
})(globalThis);
