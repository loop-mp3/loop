// Provider adapters are loaded as separate classic scripts before index.js.
// This registry only owns lookup, request dispatch, and candidate fan-out.
(function initializeLyricsProviders(global) {
    global.LoopLyricsProviderAdapters ||= {};

    function createLyricsProviderService({
        providers,
        adapters = global.LoopLyricsProviderAdapters,
        getEnabledProviderIds,
        dependencies = {},
    }) {
        const providerById = new Map(providers.map((provider) => [provider.id, provider]));
        const adapterById = new Map(Object.entries(adapters).map(([providerId, factory]) => [
            providerId,
            typeof factory === "function" ? factory({ providers, ...dependencies }) : factory,
        ]));

        function getProvider(providerId) {
            return providerById.get(providerId) || null;
        }

        function getAdapter(providerId) {
            const adapter = adapterById.get(providerId);
            if (!adapter || (typeof adapter !== "function" && typeof adapter.request !== "function")) {
                throw new Error(`No lyric adapter registered for ${providerId}`);
            }
            return adapter;
        }

        function request(providerId, context = {}) {
            const adapter = getAdapter(providerId);
            const requestHandler = typeof adapter === "function" ? adapter : adapter.request;
            return requestHandler({ provider: getProvider(providerId), ...context });
        }

        function getProviderCandidates(providerId, context = {}) {
            const adapter = getAdapter(providerId);
            const candidatesHandler = typeof adapter === "function"
                ? adapter
                : adapter.candidates || adapter.request;
            return candidatesHandler({ provider: getProvider(providerId), ...context });
        }

        async function getCandidates(trackId, title, artist, duration, queryOverride = "") {
            const enabledIds = new Set(getEnabledProviderIds());
            const providerResults = await Promise.all(providers
                .filter((provider) => enabledIds.has(provider.id))
                .map(async (provider) => {
                    try {
                        const candidates = await getProviderCandidates(provider.id, {
                            trackId,
                            title,
                            artist,
                            duration,
                            queryOverride,
                        });
                        return { provider, candidates: Array.isArray(candidates) ? candidates : [candidates] };
                    } catch (error) {
                        console.warn(`[loop.mp3] ${provider.label} candidate search failed:`, error);
                        return { provider, candidates: [], error };
                    }
                }));

            return providerResults.flatMap(({ provider, candidates }) => candidates
                .filter(Boolean)
                .map((lyrics, index) => ({ lyrics, provider, index })));
        }

        return Object.freeze({ getProvider, getAdapter, request, getProviderCandidates, getCandidates });
    }

    global.LoopLyricsServices = Object.freeze({ createLyricsProviderService });
})(globalThis);
