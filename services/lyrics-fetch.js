async function fetchLoopLyricsForCurrentTrack(forceRefresh = false) {
    clearLyricsRetryTimer();
    const trackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
    const loop = document.querySelector("#loop");
    const title = loop?.querySelector("#loop-track-title")?.textContent.trim();
    const artist = loop?.querySelector("#loop-track-artist")?.textContent.trim();
    if (!trackId || !title || !artist) {
        updateLoopLyrics(null);
        return;
    }

    if (currentTrackLyricsProvider.trackId !== trackId) {
        currentTrackLyricsProvider = { trackId, providerId: null };
        lyricsLoadedTrackId = null;
    }

    if (lyricsFetchInFlightTrackId === trackId) return;
    if (!forceRefresh && lyricsLoadedTrackId === trackId && currentParsedLyrics.length) return;

    // Only a new request may invalidate previous callbacks. Polling the same track while
    // a request is already running must not invalidate the request that is about to finish.
    const requestId = ++lyricsRequestId;
    lyricsFetchInFlightTrackId = trackId;
    // During a forced refresh keep the current valid render on screen. The new result
    // should only replace it after it has been parsed successfully.
    if (!currentParsedLyrics.length || lyricsLoadedTrackId !== trackId) updateLoopLyrics(undefined);
    const lyrics = await getLyricsFromTrackInfo(
        trackId,
        title,
        artist,
        getCurrentTrackDurationInSeconds(),
        forceRefresh,
        (replacement) => {
            if (
                requestId === lyricsRequestId &&
                loopPreferences.showLyrics &&
                trackId === (getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId)
            ) {
                const replacementLines = parseSyncedLyrics(
                    replacement?.syncedLyrics,
                    replacement?.plainLyrics,
                    Number(replacement?.meta?.duration) * 1_000,
                    replacement?.meta?.instrumental === true
                );
                if (replacementLines.length) {
                    updateLoopLyrics(replacement);
                }
            }
        }
    );
    if (
        requestId !== lyricsRequestId ||
        !loopPreferences.showLyrics ||
        trackId !== (getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId)
    ) {
        if (lyricsFetchInFlightTrackId === trackId) lyricsFetchInFlightTrackId = null;
        return;
    }
    // Do not clear a successful intermediate provider result if every later provider failed.
    if (lyrics) {
        const resolvedLines = parseSyncedLyrics(
            lyrics.syncedLyrics,
            lyrics.plainLyrics,
            Number(lyrics?.meta?.duration) * 1_000,
            lyrics?.meta?.instrumental === true
        );
        if (resolvedLines.length || !currentParsedLyrics.length) updateLoopLyrics(lyrics);
    } else if (!currentParsedLyrics.length) {
        updateLoopLyrics({
            meta: null,
            syncedLyrics: null,
            plainLyrics: null,
        });
    }
    if (lyricsFetchInFlightTrackId === trackId) lyricsFetchInFlightTrackId = null;
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.fetchLoopLyricsForCurrentTrack = fetchLoopLyricsForCurrentTrack;
})(globalThis);
