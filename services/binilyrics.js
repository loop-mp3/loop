// Binilyrics adapters for both the TTML and LRC endpoints.
(function registerBinilyricsAdapters(global) {
    global.LoopLyricsProviderAdapters ||= {};

    const createAdapter = ({ normalizeLyricsResponse, hasSyncedLyricTimestamps }) => ({
        async request({ provider, title, artist, duration, signal }) {
            const searchQuery = new URLSearchParams({ q: `${title} ${artist}` }).toString();
            const searchResponse = await fetch(`${provider.endpoint}/search.json?${searchQuery}`, { signal });
            if (!searchResponse.ok) throw new Error(`${provider.label} search returned ${searchResponse.status}`);

            const searchPayload = await searchResponse.json();
            const hits = Array.isArray(searchPayload?.hits) ? searchPayload.hits : [];
            if (!hits.length) throw new Error(`${provider.label} returned no matches`);

            const requestedDuration = Number(duration);
            const selectedHit = [...hits].sort((left, right) => {
                const durationDelta = (hit) => Number.isFinite(requestedDuration) && Number.isFinite(Number(hit?.duration))
                    ? Math.abs(Number(hit.duration) - requestedDuration)
                    : Infinity;
                return durationDelta(left) - durationDelta(right);
            })[0];
            const isrc = String(selectedHit?.isrc || "").trim();
            if (!isrc) throw new Error(`${provider.label} returned a match without an ISRC`);

            const lyricsResponse = await fetch(`${provider.endpoint}/s/${encodeURIComponent(isrc)}.${provider.format}`, { signal });
            if (!lyricsResponse.ok) throw new Error(`${provider.label} lyrics returned ${lyricsResponse.status}`);
            const lyricsText = await lyricsResponse.text();
            if (!lyricsText.trim()) throw new Error(`${provider.label} returned empty lyrics`);
            if (provider.format === "ttml" && !/^\s*<tt(?:\s|>)/i.test(lyricsText)) {
                throw new Error(`${provider.label} returned invalid TTML`);
            }
            if (provider.format === "lrc" && !hasSyncedLyricTimestamps(lyricsText)) {
                throw new Error(`${provider.label} returned invalid LRC`);
            }

            const plainLyrics = provider.format === "lrc"
                ? lyricsText
                    .replace(/(?:\[\d{1,3}:\d{2}(?:\.\d{1,3})?\])+\s*/g, "")
                    .split(/\r?\n/)
                    .filter((line) => line.trim() && !/^\[[a-z]{2,}:.*\]$/i.test(line.trim()))
                    .join("\n")
                : null;
            return normalizeLyricsResponse({
                ...selectedHit,
                syncedLyrics: lyricsText,
                plainLyrics,
                duration: selectedHit.duration,
            }, provider.id);
        },
    });

    global.LoopLyricsProviderAdapters["binilyrics-ttml"] = createAdapter;
    global.LoopLyricsProviderAdapters["binilyrics-lrc"] = createAdapter;
})(globalThis);
