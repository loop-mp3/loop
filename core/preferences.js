async function resetLoopData() {
    const localStorageArea =
        globalThis.chrome?.storage?.local || globalThis.browser?.storage?.local;

    if (localStorageArea) {
        await new Promise((resolve, reject) => {
            localStorageArea.clear(() => {
                const error = globalThis.chrome?.runtime?.lastError ||
                    globalThis.browser?.runtime?.lastError;
                if (error) {
                    reject(new Error(error.message));
                    return;
                }
                resolve();
            });
        });
    }

    // Loop historically stored a few values in the page's localStorage.
    // Remove only Loop-owned keys, never clear the site's storage wholesale.
    try {
        localStorage.removeItem(loopPreferencesKey);
        localStorage.removeItem(kawarpConfigKey);
        localStorage.removeItem(kawarpCustomPresetsKey);
        localStorage.removeItem(getOnboardingStorageKey());
    } catch (error) {
        console.warn("[loop.mp3] Could not clear Loop's legacy localStorage keys:", error);
    }

    loopPreferences = {
        animatedBackground: true,
        hideVinyl: true,
        hideArtwork: false,
        showNavigationButtons: false,
        autoOpenMiniPlayer: true,
        useLegacyFallbackArtwork: false,
        showAlbum: false,
        showLyrics: true,
        trackPresentationModes: {},
        showWriterCredits: true,
        useLyricsCache: true,
        useGrooveOverrides: true,
        enableLyricsTranslation: false,
        lyricsTranslationLanguage: "en",
        lyricsGapNoteThreshold: defaultLyricsGapNoteThreshold,
        lyricsProviderOrder: ["unison", "lyricsplus", "binilyrics-ttml", "binilyrics-lrc", "lrclib", "groove", "groove-dev"],
        lyricsDisabledProviderIds: [],
        lyricsRemovedProviderIds: [],
        loopUpdateInterval: defaultLoopUpdateInterval,
        kawarpFpsCap: defaultKawarpFpsCap,
        kawarpFpsLogging: false,
        volume: 1,
        theme: "default",
        videoBehaviorEnabled: true,
        videoUiRearrangement: true,
    };

    kawarpSettings = { ...defaultKawarpSettings };
    kawarpEnabled = true;
    lyricsRequestId++;
    startLoopUpdatePolling(loopUpdatePlayerBar);

    return true;
}

function applyLoopPreferences() {
    const loop = document.querySelector("#loop");
    if (!loop) return;
    const media = getCurrentMedia();
    const preferredVolume = getPreferredVolume();
    if (media) media.volume = preferredVolume;
    applyLoopTheme();
    miniPlayerBridge?.setTheme(loopPreferences.theme);
    loop.classList.toggle("loop-no-vinyl", loopPreferences.hideVinyl);
    loop.classList.toggle("loop-hide-album", !loopPreferences.showAlbum);
    loopPreferences.showLyrics = true;
    applyVideoPresentationPreferences();
    const vinylToggle = loop.querySelector("#loop-vinyl-toggle");
    if (vinylToggle) vinylToggle.checked = loopPreferences.hideVinyl;
    const navigationToggle = loop.querySelector("#loop-navigation-toggle");
    if (navigationToggle) navigationToggle.checked = Boolean(loopPreferences.showNavigationButtons);
    const miniPlayerToggle = loop.querySelector("#loop-mini-player-toggle");
    if (miniPlayerToggle) miniPlayerToggle.checked = loopPreferences.autoOpenMiniPlayer !== false;
    const legacyFallbackToggle = loop.querySelector("#loop-legacy-fallback-toggle");
    if (legacyFallbackToggle) legacyFallbackToggle.checked = Boolean(loopPreferences.useLegacyFallbackArtwork);
    const albumToggle = loop.querySelector("#loop-album-toggle");
    if (albumToggle) albumToggle.checked = Boolean(loopPreferences.showAlbum);
    const lyricsRenderingEngine = loop.querySelector("#loop-lyrics-rendering-engine");
    if (lyricsRenderingEngine) lyricsRenderingEngine.value = normalizeLyricsRenderingEngine(loopPreferences.lyricsRenderingEngine);
    const lyricsRenderingWarning = loop.querySelector("#loop-lyrics-rendering-warning");
    if (lyricsRenderingWarning) lyricsRenderingWarning.hidden = loopPreferences.lyricsRenderingEngine !== "ludo";
    const wordWobbleToggle = loop.querySelector("#loop-lyrics-word-wobble-toggle");
    if (wordWobbleToggle) wordWobbleToggle.checked = loopPreferences.animateWordWobble === true;
    applyLyricsAnimationPreferences();
    const writerCreditsToggle = loop.querySelector("#loop-writer-credits-toggle");
    if (writerCreditsToggle) writerCreditsToggle.checked = loopPreferences.showWriterCredits !== false;
    const lyricsCacheToggle = loop.querySelector("#loop-lyrics-cache-toggle");
    if (lyricsCacheToggle) lyricsCacheToggle.checked = loopPreferences.useLyricsCache !== false;
    const grooveOverridesToggle = loop.querySelector("#loop-groove-overrides-toggle");
    if (grooveOverridesToggle) grooveOverridesToggle.checked = loopPreferences.useGrooveOverrides !== false;
    const translationToggle = loop.querySelector("#loop-lyrics-translation-toggle");
    if (translationToggle) translationToggle.checked = loopPreferences.enableLyricsTranslation === true;
    const translationLanguage = loop.querySelector("#loop-lyrics-translation-language");
    if (translationLanguage) translationLanguage.value = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
    updateLoopPollingPreferenceUI();
    kawarpBackground?.setOptions({
        fpsCap: loopPreferences.kawarpFpsCap,
        fpsLogging: loopPreferences.kawarpFpsLogging,
    });
    const kawarpFpsLoggingToggle = loop.querySelector("#loop-kawarp-fps-logging-toggle");
    if (kawarpFpsLoggingToggle) kawarpFpsLoggingToggle.checked = loopPreferences.kawarpFpsLogging;
    miniPlayerBridge?.syncEffects();
    renderLyricsProviderPriorityUI();
    const volumeSlider = loop.querySelector("#loop-volume-slider");
    if (volumeSlider) volumeSlider.value = String(preferredVolume);
    const lyricsPanel = loop.querySelector("#loop-lyrics-panel");
    if (lyricsPanel) lyricsPanel.hidden = false;
    setTrackNavigationButtonsVisible(Boolean(loopPreferences.showNavigationButtons));
    applyArtworkPreference();
    miniPlayerBridge?.sync(getCurrentMedia());
    publishElectronMiniPlayerState({ force: true });
}

function applyVideoPresentationPreferences() {
    const loop = document.querySelector("#loop");
    if (!loop) return;

    const isVideo = loop.dataset.videoBackground === "true";
    const behaviorEnabled = forcedVideoMode || loopPreferences.videoBehaviorEnabled !== false;
    const rearrangementEnabled = behaviorEnabled && loopPreferences.videoUiRearrangement === true;
    loop.classList.toggle("loop-video-mode", isVideo && behaviorEnabled);
    loop.classList.toggle("loop-video-ui-rearranged", isVideo && rearrangementEnabled);
    updateArtworkVideoToggle();

    if (!isVideo || !behaviorEnabled) {
        window.clearTimeout(videoUiHideTimer);
        loop.classList.remove("loop-video-ui-hidden");
    }

    const behaviorToggle = loop.querySelector("#loop-video-behavior-toggle");
    const rearrangementToggle = loop.querySelector("#loop-video-ui-rearrangement-toggle");
    if (behaviorToggle) behaviorToggle.checked = behaviorEnabled;
    if (rearrangementToggle) {
        rearrangementToggle.checked = loopPreferences.videoUiRearrangement === true;
        rearrangementToggle.disabled = !behaviorEnabled;
    }
}

function updateArtworkVideoToggle() {
    const loop = document.querySelector("#loop");
    const toggle = loop?.querySelector("#loop-artwork-video-toggle");
    if (!toggle) return;

    const videoActive = loop.dataset.videoBackground === "true";
    const mode = getTrackPresentationMode(lastTrackId);
    toggle.dataset.mode = videoActive ? "video" : "artwork";
    toggle.dataset.override = mode;
    toggle.setAttribute("aria-pressed", String(videoActive));
    toggle.querySelectorAll("[data-loop-view-mode]").forEach((button) => {
        const buttonMode = button.dataset.loopViewMode;
        button.classList.toggle("is-active", buttonMode === mode);
        button.setAttribute("aria-pressed", String(buttonMode === mode));
    });
}

function setTrackPresentationMode(mode) {
    const loop = document.querySelector("#loop");
    const trackId = lastTrackId || getCurrentTrackId(getYTMPlayerRoot());
    if (!loop || !trackId || !["auto", "audio", "video"].includes(mode)) return;

    loopPreferences.trackPresentationModes = normalizeTrackPresentationModes(loopPreferences.trackPresentationModes);
    if (mode === "auto") {
        delete loopPreferences.trackPresentationModes[trackId];
    } else {
        loopPreferences.trackPresentationModes[trackId] = mode;
    }
    saveLoopPreferences();

    forcedVideoMode = mode === "video";
    forcedArtworkMode = mode === "audio";
    const trackHasVideo = loop.dataset.trackVideo === "true";
    const videoActive = mode === "video" || (mode === "auto" && trackHasVideo);
    loop.dataset.videoForced = String(mode === "video");
    loop.dataset.videoBackground = String(videoActive);
    applyVideoPresentationPreferences();
    updateVideoBackground(trackId, videoActive);
    if (videoActive) showVideoUi();
}

function applyArtworkPreference() {
    const loop = document.querySelector("#loop");
    const artwork = loop?.querySelector("#loop-artwork");
    if (!artwork) return;

    const fallback = getFallbackArtwork();
    const displayedArtwork = loopPreferences.hideArtwork || loop.classList.contains("loop-empty")
        ? fallback
        : currentArtworkURL || fallback;
    artwork.src = displayedArtwork;
    artwork.setAttribute("onerror", `this.onerror=null; this.src='${fallback}';`);
    updateKawarpArtwork(displayedArtwork);

    const artworkToggle = loop.querySelector("#loop-artwork-toggle");
    if (artworkToggle) {
        artworkToggle.setAttribute("aria-pressed", String(loopPreferences.hideArtwork));
        artworkToggle.setAttribute("aria-label", loopPreferences.hideArtwork ? "Show artwork" : "Hide artwork");
        artworkToggle.title = loopPreferences.hideArtwork ? "Show artwork" : "Hide artwork";
        artworkToggle.classList.toggle("loop-action-active", loopPreferences.hideArtwork);
    }
}

function applyLoopTheme() {
    const loop = document.querySelector("#loop");
    if (!loop) return;

    const supportedThemes = new Set(["default", "sharp", "catppuccin"]);
    const theme = supportedThemes.has(loopPreferences.theme) ? loopPreferences.theme : "default";
    loopPreferences.theme = theme;
    loop.dataset.theme = theme;

    const themeSelect = loop.querySelector("#loop-theme-select");
    if (themeSelect) themeSelect.value = theme;
}

function updateLoopMenuOverflow(panel = document.getElementById("loop-shortcuts-panel")) {
    if (!panel) return;

    const expandButton = panel.querySelector("#loop-shortcuts-expand-button");
    if (!expandButton) return;

    const isScrollable = panel.scrollHeight > panel.clientHeight + 1;
    const isExpanded = panel.classList.contains("loop-shortcuts-expanded");
    expandButton.hidden = !isScrollable && !isExpanded;
    expandButton.textContent = isExpanded ? "Collapse menu" : "Expand menu";
    expandButton.setAttribute("aria-expanded", String(isExpanded));
}

function showAuthWarningPopup() {
    if (document.getElementById("loop-auth-warning")) return;

    const popup = document.createElement("div");
    popup.id = "loop-auth-warning";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.innerHTML = `
        <div class="loop-auth-warning-card">
            <div class="loop-auth-warning-title">Sign in to YouTube Music</div>
            <p>You are not signed in with Google. Sign in for the AD blocker to work</p>
            <div class="loop-auth-warning-actions">
                <a
                    class="loop-auth-warning-signin"
                    href="https://accounts.google.com/ServiceLogin?ltmpl=music&service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den%26next%3Dhttps%253A%252F%252Fmusic.youtube.com%252F%26feature%3D__FEATURE__&hl=en"
                >Sign in with Google</a>
                <button type="button" class="loop-auth-warning-dismiss">Got it</button>
            </div>
        </div>`;
    (document.getElementById("loop") || document.body).appendChild(popup);
    popup.querySelector(".loop-auth-warning-dismiss").addEventListener("click", () => popup.remove());
}

function findYTMActionButton(action) {
    const actionBar = document.querySelector("yt-video-action-bar-view-model.ytMusicMiniPlayerActionBar") ||
        document.querySelector("yt-video-action-bar-view-model");
    const playerPage = document.querySelector("ytmusic-player-page");
    const playerBar = playerPage?.querySelector("ytmusic-player-bar") ||
        document.querySelector("ytmusic-player-bar");
    const roots = [
        actionBar,
        document.querySelector("ytmusic-miniplayer-slot#player-bar"),
        playerBar,
        document.querySelector("ytmusic-track-info"),
        playerPage || getYTMPlayerRoot(),
        document,
    ].filter((root, index, all) => root && all.indexOf(root) === index);

    // The current player bar groups both feedback controls in this renderer.
    // Prefer its action-specific button so a Like control elsewhere in the
    // page cannot be mistaken for the current track's feedback button.
    const rendererButtonSelector = action === "like"
        ? "like-button-view-model button, #button-shape-like button, #button-shape-like, .like button, .like"
        : "dislike-button-view-model button, #button-shape-dislike button, #button-shape-dislike, .dislike button, .dislike";
    const rendererButton = roots
        .flatMap((root) => [...root.querySelectorAll(
            "ytmusic-like-button-renderer, segmented-like-dislike-button-view-model"
        )])
        .map((renderer) => renderer.querySelector(rendererButtonSelector))
        .find((button) => button && !button.closest("#loop") && (
            button.offsetParent !== null || button.getClientRects().length > 0
        ));
    if (rendererButton) return rendererButton;

    // The newer player bar uses native buttons, but the legacy bar uses
    // `tp-yt-paper-icon-button`/`yt-icon-button` custom elements. Search by
    // label as well as tag name so both versions remain actionable.
    const exactSelector = action === "like"
        ? '[aria-label^="like this video" i]'
        : '[aria-label^="dislike this video" i]';
    const exactCandidates = roots.flatMap((root) => [...root.querySelectorAll(exactSelector)]);
    const candidates = [
        ...exactCandidates,
        ...roots.flatMap((root) => [...root.querySelectorAll(
            "button, [role=button], tp-yt-paper-icon-button, yt-icon-button, [aria-label], [title]"
        )]),
    ].filter((button, index, all) => all.indexOf(button) === index);
    return candidates.find((button) => {
        if (button.closest("#loop")) return false;
        const label = [
            button.getAttribute("aria-label"),
            button.getAttribute("title"),
            button.textContent,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!label || !label.includes(action)) return false;
        if (action === "like" && label.includes("dislike")) return false;
        return button.offsetParent !== null || button.getClientRects().length > 0;
    });
}

function returnToLoopUI(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const playerBar = getYTMPlayerRoot();
    const trackId = getCurrentTrackId(playerBar) || lastTrackId;
    console.log("[loop.mp3] Open Loop button activated", {
        hasPlayerBar: Boolean(playerBar),
        trackId: trackId || null,
    });
    const trackInfo = playerBar ? getTrackInfo(playerBar) : {
        title: "Nothing is playing",
        artist: "Search something to play",
        album: "",
        empty: true,
    };
    hideLoopSearch();
    updateLoop(getCurrentArtwork(playerBar, trackId), trackInfo);
    // The player page can briefly expose its queue/context labels ("Autoplay")
    // instead of the live track metadata after returning from normal YTM.
    // Force the normal sync path to run again so oEmbed/live player metadata
    // replaces that transient placeholder instead of being skipped by the
    // previous track signature.
    lastTrackKey = "";
    updateForCurrentTrack(playerBar);
    syncRecordMotion();
}

let loopRecordEventsBound = false;

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.resetLoopData = resetLoopData;
    global.applyLoopPreferences = applyLoopPreferences;
    global.applyVideoPresentationPreferences = applyVideoPresentationPreferences;
    global.updateArtworkVideoToggle = updateArtworkVideoToggle;
    global.setTrackPresentationMode = setTrackPresentationMode;
    global.applyArtworkPreference = applyArtworkPreference;
    global.applyLoopTheme = applyLoopTheme;
    global.updateLoopMenuOverflow = updateLoopMenuOverflow;
    global.showAuthWarningPopup = showAuthWarningPopup;
    global.findYTMActionButton = findYTMActionButton;
    global.returnToLoopUI = returnToLoopUI;
    Object.defineProperty(global, 'loopRecordEventsBound', { configurable: true, get: () => loopRecordEventsBound, set: (value) => { loopRecordEventsBound = value; } });
})(globalThis);
