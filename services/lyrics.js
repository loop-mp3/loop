function clearLyricsRetryTimer() {
    clearTimeout(lyricsRetryTimer);
    lyricsRetryTimer = undefined;
}

function scheduleLyricsRetry(trackId) {
    if (lyricsRetryTimer || !trackId || !loopPreferences.showLyrics) return;
    lyricsRetryTimer = setTimeout(() => {
        lyricsRetryTimer = undefined;
        const currentTrackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
        // A usable render wins over scheduled recovery work. Do not start another provider
        // round just because an older attempt left a timer behind.
        if (
            loopPreferences.showLyrics &&
            currentTrackId === trackId &&
            !currentParsedLyrics.length &&
            lyricsLoadedTrackId !== trackId &&
            lyricsFetchInFlightTrackId !== trackId
        ) {
            fetchLoopLyricsForCurrentTrack(true).catch((error) => {
                console.warn("[loop.mp3] Could not retry lyrics for the current track:", error);
            });
        }
    }, LYRICS_RETRY_INTERVAL_MS);
}

function getCurrentTrackDurationInSeconds() {
    const duration = Number(getCurrentMedia()?.duration);
    return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

async function waitForCurrentTrackDuration(timeoutMs = 3000) {
    const currentDuration = getCurrentTrackDurationInSeconds();
    if (currentDuration !== null) return currentDuration;

    return new Promise((resolve) => {
        const mediaElements = [...document.querySelectorAll("video, audio")];
        let timeoutId;
        let intervalId;

        const finish = () => {
            mediaElements.forEach((media) => {
                media.removeEventListener("loadedmetadata", checkDuration);
                media.removeEventListener("durationchange", checkDuration);
            });
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            resolve(getCurrentTrackDurationInSeconds());
        };
        const checkDuration = () => {
            if (getCurrentTrackDurationInSeconds() !== null) finish();
        };

        mediaElements.forEach((media) => {
            media.addEventListener("loadedmetadata", checkDuration);
            media.addEventListener("durationchange", checkDuration);
        });
        intervalId = setInterval(checkDuration, 100);
        timeoutId = setTimeout(finish, timeoutMs);
        checkDuration();
    });
}

function lyricsDurationExceedsTrack(lyricsResult, lyricsQueryResult, trackDurationInSeconds, syncedLyrics) {
    if (!Number.isFinite(trackDurationInSeconds)) return false;
    const duration = Number(lyricsResult?.duration ?? lyricsQueryResult?.duration);
    const durationExceeds = Number.isFinite(duration) && Math.round(duration + 30) > trackDurationInSeconds;
    if (!durationExceeds) return false;

    const lastNonEmptyLine = String(syncedLyrics || "")
        .split(/\r?\n/)
        .reverse()
        .find((line) => line.replace(/\[\d{1,3}:\d{2}(?:\.\d+)?\]/g, "").trim());
    const lastLyricTimestamp = lastNonEmptyLine?.match(/\[(\d{1,3}):(\d{2})(?:\.(\d+))?\]/);
    if (!lastLyricTimestamp) return durationExceeds;

    const lyricEnd = Number(lastLyricTimestamp[1]) * 60 + Number(lastLyricTimestamp[2]) +
        Number(`0.${lastLyricTimestamp[3] || 0}`);
    return lyricEnd > trackDurationInSeconds;
}
// no longer needed its causing more inaccuracy :sob:
function LyricsTitleMatchesTrack(lyricsResult, lyricsQueryResult, title) {
    const lyricsTitle = String(lyricsResult?.title ?? lyricsQueryResult?.title ?? "").trim().toLowerCase();
    const trackTitle = String(title ?? "").trim().toLowerCase();
    return lyricsTitle && trackTitle && lyricsTitle === trackTitle;
}

function normalizeLyricsResponse(payload, providerId) {
    const candidates = [payload, ...(Array.isArray(payload) ? payload : []), payload?.lyrics, payload?.data, payload?.result, payload?.track]
        .filter((candidate) => candidate && typeof candidate === "object");
    const source = candidates.find((candidate) =>
        candidate.syncedLyrics || candidate.synced_lyrics || candidate.lrc ||
        candidate.plainLyrics || candidate.plain_lyrics || candidate.lyrics || candidate.instrumental === true
    );
    if (!source) return null;
    const nestedLyrics = source.lyrics && typeof source.lyrics === "object" ? source.lyrics : {};
    const syncedLyrics = source.syncedLyrics || source.synced_lyrics || source.lrc ||
        nestedLyrics.syncedLyrics || nestedLyrics.synced_lyrics || nestedLyrics.lrc ||
        (typeof source.lyrics === "string" ? source.lyrics : null);
    const plainLyrics = source.plainLyrics || source.plain_lyrics ||
        nestedLyrics.plainLyrics || nestedLyrics.plain_lyrics;
    if (!syncedLyrics && !plainLyrics && source.instrumental !== true) return null;
    return {
        meta: {
            ...source,
            provider: providerId,
            instrumental: source.instrumental === true,
            duration: source.duration,
            lyricsUnavailable: !syncedLyrics && !plainLyrics && source.instrumental !== true,
        },
        syncedLyrics: source.instrumental && !syncedLyrics && !plainLyrics
            ? "[00:00.00] Instrumental only\n[99:99.99] ♪"
            : syncedLyrics || null,
        plainLyrics: plainLyrics || null,
    };
}

let lyricsProviderService;

async function getLyricsCandidatesForAllProviders(trackId, title, artist, duration, queryOverride = "") {
    return lyricsProviderService.getCandidates(trackId, title, artist, duration, queryOverride);
}

function applyLyricsTimestampOffset(syncedLyrics, offsetSeconds) {
    const offset = Number(offsetSeconds);
    if (!syncedLyrics || !Number.isFinite(offset) || offset === 0) return syncedLyrics || null;

    return String(syncedLyrics).replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, (match, minutes, seconds) => {
        const adjustedSeconds = Math.max(0, Number(minutes) * 60 + Number(seconds) + offset);
        const adjustedMinutes = Math.floor(adjustedSeconds / 60);
        const remainder = (adjustedSeconds - adjustedMinutes * 60).toFixed(2).padStart(5, "0");
        return `[${String(adjustedMinutes).padStart(2, "0")}:${remainder}]`;
    });
}

async function getLyricsFromTrackInfo(trackId, title, artist, trackDurationInSeconds = getCurrentTrackDurationInSeconds(), forceRefresh = false, onLyricsResolved = null) {
    trackDurationInSeconds ??= await waitForCurrentTrackDuration();
    const resolutionStartedAt = performance.now();
    const preferredProvider = currentTrackLyricsProvider.trackId === trackId
        ? currentTrackLyricsProvider.providerId
        : null;
    const baseOrder = getLyricsProviderOrder();
    const order = preferredProvider && baseOrder.includes(preferredProvider)
        ? [preferredProvider, ...baseOrder.filter((providerId) => providerId !== preferredProvider)]
        : baseOrder;

    const manuallySelectedLyrics = await getManualCachedLyrics(trackId);
    if (manuallySelectedLyrics) {
        currentTrackLyricsProvider = { trackId, providerId: manuallySelectedLyrics.meta.provider };
        console.log("[loop.mp3] Using manually selected lyrics:", { trackId, provider: manuallySelectedLyrics.meta.provider });
        return manuallySelectedLyrics;
    }

    if (!forceRefresh) {
        const cachedLyrics = loopPreferences.useLyricsCache !== false
            ? restoreCachedLyrics(await getCachedLyrics(trackId))
            : null;
        if (cachedLyrics && (!preferredProvider || cachedLyrics.meta.provider === preferredProvider) &&
            (loopPreferences.useGrooveOverrides !== false || cachedLyrics.meta.override !== true)) {
            currentTrackLyricsProvider = { trackId, providerId: cachedLyrics.meta.provider };
            console.log("[loop.mp3] Using cached lyrics:", { trackId, provider: cachedLyrics.meta.provider });
            return cachedLyrics;
        }
    }

    let resolveFirstLyrics;
    let rejectFirstLyrics;
    let firstLyricsDelivered = false;
    let bestProviderIndex = Infinity;
    const firstLyricsPromise = new Promise((resolve, reject) => {
        resolveFirstLyrics = resolve;
        rejectFirstLyrics = reject;
    });

    const providerRequests = order.map((providerId, providerIndex) => {
        const providerStartedAt = performance.now();
        const controller = new AbortController();
        const request = lyricsProviderService.request(providerId, {
            trackId,
            title,
            artist,
            duration: trackDurationInSeconds,
            signal: controller.signal,
        });

        const promise = request.then((lyrics) => {
            if (!lyrics) throw new Error(`${providerId} returned no usable lyrics`);
            return { lyrics, providerId, controller, elapsedMs: performance.now() - providerStartedAt };
        }).catch((error) => {
            if (error?.name !== "AbortError") {
                console.warn(`[loop.mp3] ${providerId} lyrics provider failed after ${(performance.now() - providerStartedAt).toFixed(1)} ms:`, error);
            }
            throw error;
        });

        promise.then((result) => {
            if (providerIndex >= bestProviderIndex) return;

            // Validate the candidate using the same parser the renderer uses before it is
            // allowed to replace a result already on screen. Providers can return nonempty
            // payloads that still parse to zero usable lines.
            const durationMs = Number.isFinite(trackDurationInSeconds) && trackDurationInSeconds > 0
                ? trackDurationInSeconds * 1_000
                : Number(result.lyrics?.meta?.duration) * 1_000;
            const candidateLines = parseSyncedLyrics(
                result.lyrics?.syncedLyrics,
                result.lyrics?.plainLyrics,
                durationMs,
                result.lyrics?.meta?.instrumental === true
            );
            if (!candidateLines.length) {
                throw new Error(`${providerId} returned lyrics that could not be parsed`);
            }

            bestProviderIndex = providerIndex;
            if (!firstLyricsDelivered) {
                firstLyricsDelivered = true;
                resolveFirstLyrics(result);
                return;
            }

            currentTrackLyricsProvider = { trackId, providerId: result.providerId };
            if (loopPreferences.useLyricsCache !== false) {
                cacheLyrics(trackId, title, artist, trackDurationInSeconds, result.lyrics).catch((error) => {
                    console.warn("[loop.mp3] Could not cache preferred lyrics result:", error);
                });
            }
            onLyricsResolved?.(result.lyrics, result.providerId);
            console.log(`[loop.mp3] Replaced lyrics with higher-priority ${result.providerId} result after ${result.elapsedMs.toFixed(1)} ms:`, { trackId, title, artist });
        }).catch((error) => {
            if (error?.name !== "AbortError") {
                console.warn(`[loop.mp3] Ignoring unusable ${providerId} lyrics result:`, error);
            }
        });

        return promise;
    });

    Promise.allSettled(providerRequests).then((results) => {
        if (results.every((result) => result.status === "rejected")) {
            rejectFirstLyrics(new Error("All lyrics providers failed"));
        }
    });

    try {
        const winner = await firstLyricsPromise;
        currentTrackLyricsProvider = { trackId, providerId: winner.providerId };
        if (loopPreferences.useLyricsCache !== false) {
            await cacheLyrics(trackId, title, artist, trackDurationInSeconds, winner.lyrics);
        }
        console.log(`[loop.mp3] Fetched lyrics from ${winner.providerId} in ${winner.elapsedMs.toFixed(1)} ms (total ${(performance.now() - resolutionStartedAt).toFixed(1)} ms):`, { trackId, title, artist });
        return winner.lyrics;
    } catch (error) {
        console.warn(`[loop.mp3] Lyrics resolution failed after ${(performance.now() - resolutionStartedAt).toFixed(1)} ms.`, { trackId, title, artist, error });
        showLoopNotification("Could not fetch lyrics", 3000);
        return null;
    }
}

/* Legacy single-provider implementation retained below for reference during updates. */
async function getLegacyLyricsFromTrackInfo(trackId, title, artist) {
    try {
        const query = new URLSearchParams({
            q: `${title} ${artist}`,
        }).toString();
        const res = await fetch(`https://lrclib.net/api/search?${query}`);
        let data = await res.json();
        // Retry with the title alone when searching with the artist finds no match.
        if (!data?.[0] && artist.trim()) {
            // Give the first search a moment to settle before retrying without the artist.
            await new Promise((resolve) => setTimeout(resolve, 150));
            const titleOnlyQuery = new URLSearchParams({ q: title }).toString();
            const titleOnlyResponse = await fetch(`https://lrclib.net/api/search?${titleOnlyQuery}`);
            data = await titleOnlyResponse.json();
        }
        const lyricsQueryResults = data?.filter((result) => result?.id) || [];
        if (!lyricsQueryResults.length) {
            console.warn("[loop.mp3] No lyrics found for track:", { trackId, title, artist });
            return { meta: null, syncedLyrics: null, plainLyrics: null };
        }

        let firstResultLyrics = null;
        for (const [resultIndex, lyricsQueryResult] of lyricsQueryResults.entries()) {
            const syncedLyrics = lyricsQueryResult?.syncedLyrics || null;
            const plainLyrics = lyricsQueryResult?.plainLyrics || null;
            const resultLyrics = {
                meta: lyricsQueryResult,
                syncedLyrics: lyricsQueryResult?.instrumental && !syncedLyrics && !plainLyrics
                    ? `[00:00.00] Instrumental only
[99:99.99] ${["♪", "♫", "♪"][Math.floor(Math.random() * 3)]}`
                    : syncedLyrics,
                plainLyrics,
            };

            firstResultLyrics ||= resultLyrics;
            const hasWordSync = lyricsQueryResult?.hasWordSync;
            if (hasSyncedLyricTimestamps(resultLyrics.syncedLyrics) || lyricsQueryResult?.instrumental) {
                if (resultIndex > 0) {
                    console.log(`[loop.mp3] Using lyrics search result ${resultIndex + 1} because earlier results had no usable sync:`, {
                        trackId,
                        title,
                        artist,
                    });
                }
                console.log("[loop.mp3] Fetched lyrics for track:", { trackId, title, artist, data });
                return resultLyrics;
            }

            if (hasWordSync === false) continue;
        }

        showLoopNotification("Synced lyrics unavailable", 3000);
        console.log("[loop.mp3] Fetched lyrics without synced timestamps:", { trackId, title, artist, data });
        return firstResultLyrics;
    } catch (error) {
        console.warn("[loop.mp3] Could not fetch lyrics:", error);
        showLoopNotification("Could not fetch lyrics", 3000);
        return null;
    }
}

function getBraccatoLyricsTheme() {
    return `
    @import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap");

    /* blyrics-target-scroll-pos-ratio = 0.5; */
    /* blyrics-letter-wave = ${loopPreferences.animateWordWobble === true ? "true" : "false"}; */

    .blyrics-container {
        --blyrics-font-size: 3rem;
        --blyrics-line-height: 1.333;
        --blyrics-padding: 1.4rem;
        --blyrics-active-opacity: 1;
        --blyrics-inactive-opacity: 0.3;
        --blyrics-animate-word-wobble: 0;
        --blyrics-word-wobble-transform-from: scaleX(1);
        --blyrics-word-wobble-transform-peak: translateX(0.05em) scaleX(1.025);
        --blyrics-word-wobble-transform-settle: translateX(0) scaleX(1);
        --blyrics-word-wobble-transform-to: scaleX(1);
    }

    .blyrics-container .blyrics-word-highlight:not([data-long-word]) {
        --blyrics-glow-color: var(--blyrics-highlight-color, color(display-p3 1 1 1 / 0.5));
    }
`;
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.clearLyricsRetryTimer = clearLyricsRetryTimer;
    global.scheduleLyricsRetry = scheduleLyricsRetry;
    global.getCurrentTrackDurationInSeconds = getCurrentTrackDurationInSeconds;
    global.waitForCurrentTrackDuration = waitForCurrentTrackDuration;
    global.lyricsDurationExceedsTrack = lyricsDurationExceedsTrack;
    global.LyricsTitleMatchesTrack = LyricsTitleMatchesTrack;
    global.normalizeLyricsResponse = normalizeLyricsResponse;
    global.getLyricsCandidatesForAllProviders = getLyricsCandidatesForAllProviders;
    global.applyLyricsTimestampOffset = applyLyricsTimestampOffset;
    global.getLyricsFromTrackInfo = getLyricsFromTrackInfo;
    global.getLegacyLyricsFromTrackInfo = getLegacyLyricsFromTrackInfo;
    global.getBraccatoLyricsTheme = getBraccatoLyricsTheme;
    Object.defineProperty(global, 'lyricsProviderService', { configurable: true, get: () => lyricsProviderService, set: (value) => { lyricsProviderService = value; } });
})(globalThis);
