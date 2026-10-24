// Groove provider adapter.
(function registerGrooveAdapter(global) {
    global.LoopLyricsProviderAdapters ||= {};
    const createGrooveAdapter = ({ getPreferences, normalizeLyricsResponse }) => ({
        async request({ provider, trackId, duration, providerId = provider?.id || "groove", signal }) {
            if (!trackId) throw new Error("Groove requires a track ID");
            const preferences = getPreferences();
            const queryParams = new URLSearchParams();
            if (Number.isFinite(duration)) queryParams.set("duration", String(duration));
            if (preferences.useGrooveOverrides !== false) queryParams.set("overrides", "true");
            const query = queryParams.toString();
            const response = await fetch(`${provider.endpoint}/${encodeURIComponent(trackId)}${query ? `?${query}` : ""}`, {
                cache: "no-store",
                signal,
            });
            if (!response.ok) throw new Error(`${provider.label} returned ${response.status}`);
            const lyrics = normalizeLyricsResponse(await response.json(), providerId);
            if (!lyrics) throw new Error(`${provider.label} returned no usable lyrics`);
            lyrics.meta.override = preferences.useGrooveOverrides !== false;
            return lyrics;
        },
    });
    global.LoopLyricsProviderAdapters.groove = createGrooveAdapter;
    global.LoopLyricsProviderAdapters["groove-dev"] = createGrooveAdapter;
})(globalThis);
