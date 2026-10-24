let recordFrame;

function getCurrentMedia() {
    const media = [...document.querySelectorAll("video, audio")]
        .filter((element) => Number.isFinite(element.duration) && element.duration > 0);
    return media.find((element) => !element.paused && !element.ended) || media[0];
}

function showCloseProtectionModal(media) {
    const existingModal = document.getElementById("loop-close-protection-modal");
    if (existingModal) {
        existingModal.querySelector(".loop-close-protection-continue")?.focus();
        return;
    }

    const modal = document.createElement("div");
    modal.id = "loop-close-protection-modal";
    modal.setAttribute("role", "alertdialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-close-protection-title");
    modal.innerHTML = `
        <div class="loop-close-protection-card">
            <div class="loop-close-protection-kicker">Playback protection</div>
            <h2 id="loop-close-protection-title">Music is still playing</h2>
            <p class="loop-close-protection-description">
                Playback was paused because this tab is being closed. Confirm closing, or keep the music playing.
            </p>
            <div class="loop-close-protection-actions">
                <button type="button" class="loop-close-protection-close">Confirm closing</button>
                <button type="button" class="loop-close-protection-continue">Keep listening</button>
            </div>
        </div>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector(".loop-close-protection-close").addEventListener("click", () => {
        close();
        const sendMessage = globalThis.chrome?.runtime?.sendMessage;
        if (typeof sendMessage !== "function") {
            window.close();
            return;
        }
        sendMessage.call(globalThis.chrome.runtime, { type: "close-current-tab" })
            .catch(() => showLoopNotification("Could not close this tab automatically."));
    });
    modal.querySelector(".loop-close-protection-continue").addEventListener("click", () => {
        media.play().catch((error) => console.warn("[loop.mp3] Could not resume media:", error));
        updatePlaybackControls(media);
        close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        media.play().catch((error) => console.warn("[loop.mp3] Could not resume media:", error));
        updatePlaybackControls(media);
        close();
    });
    modal.querySelector(".loop-close-protection-close").focus();
}

window.addEventListener("beforeunload", (event) => {
    const media = getCurrentMedia();
    if (!media || media.paused || media.ended) return;

    media.pause();
    updatePlaybackControls(media);
    showCloseProtectionModal(media);
    event.preventDefault();
    event.returnValue = "";
});

function formatTime(seconds) {
    return LoopUtils.formatTime(seconds);
}

function updatePlaybackControls(media = getCurrentMedia()) {
    const playButton = document.querySelector("#loop-play-button");
    const muteButton = document.querySelector("#loop-mute-button");
    const volumeSlider = document.querySelector("#loop-volume-slider");
    const seek = document.querySelector("#loop-seek");
    const currentTime = document.querySelector("#loop-current-time");
    const duration = document.querySelector("#loop-duration");

    if (playButton && muteButton && seek && currentTime && duration && !media) {
        playButton.textContent = "▶";
        playButton.setAttribute("aria-label", "Play");
        muteButton.textContent = "♪";
        muteButton.setAttribute("aria-label", "Mute");
        seek.value = "0";
        seek.max = "0";
        currentTime.textContent = "0:00";
        duration.textContent = "0:00";
        if (volumeSlider) volumeSlider.value = String(getPreferredVolume());
    } else if (playButton && muteButton && seek && currentTime && duration && media) {
        playButton.textContent = media.paused ? "▶" : "⏸";
        playButton.setAttribute("aria-label", media.paused ? "Play" : "Pause");
        muteButton.textContent = media.muted ? "♩" : "♪";
        muteButton.setAttribute("aria-label", media.muted ? "Unmute" : "Mute");
        seek.max = Number.isFinite(media.duration) ? String(media.duration) : "0";
        seek.value = Number.isFinite(media.currentTime) ? String(media.currentTime) : "0";
        currentTime.textContent = formatTime(media.currentTime);
        duration.textContent = formatTime(media.duration);
        if (volumeSlider) volumeSlider.value = String(media.volume);
    }
    braccatoLyricsRenderer?.tick(media ? media.currentTime : 0, {
        isPlaying: Boolean(media && !media.paused && !media.ended),
        playbackRate: media?.playbackRate,
    });
    if (loopPreferences.lyricsRenderingEngine === "ludo") {
        ludoLyricsController?.tick(media ? media.currentTime : 0);
    }
    const lyricsShadow = document.querySelector("#loop-lyrics-host")?.shadowRoot;
    if (lyricsShadow) syncLyricsFooterVisibility(lyricsShadow);
    syncVideoBackgroundPlayback();
    miniPlayerBridge?.sync(media);
    publishElectronMiniPlayerState();
    publishDiscordActivity();
}

function togglePlayback() {
    const media = getCurrentMedia();
    if (!media) return;

    if (media.paused) {
        media.play().catch((error) => console.warn("[loop.mp3] Could not play media:", error));
    } else {
        media.pause();
    }
    updatePlaybackControls(media);
}

function toggleMute() {
    const media = getCurrentMedia();
    if (!media) return;

    media.muted = !media.muted;
    updatePlaybackControls(media);
}

function getPreferredVolume() {
    const volume = Number(loopPreferences.volume);
    return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
}

function setVolume(event) {
    const media = getCurrentMedia();
    if (!media) return;

    const volume = Number(event.target.value);
    if (!Number.isFinite(volume)) return;
    media.volume = Math.min(1, Math.max(0, volume));
    loopPreferences.volume = media.volume;
    saveLoopPreferences();
    if (media.volume > 0 && media.muted) media.muted = false;
    updatePlaybackControls(media);
}

function seekTrack(event) {
    const media = getCurrentMedia();
    if (!media) return;

    const nextTime = Number(event.target.value);
    if (Number.isFinite(nextTime)) media.currentTime = nextTime;
    updatePlaybackControls(media);
}

function sendYTMShortcut(key, shift = false) {
    const upperKey = key.toUpperCase();
    const keyCode = upperKey.charCodeAt(0);

    const eventOptions = {
        key: upperKey,
        code: `Key${upperKey}`,
        keyCode,
        which: keyCode,
        shiftKey: shift,
        bubbles: true,
        cancelable: true,
    };

    document.dispatchEvent(new KeyboardEvent("keydown", eventOptions));
    document.dispatchEvent(new KeyboardEvent("keyup", eventOptions));
}

function sendLoopShortcut(key, modifiers = {}) {
    const keyCode = key.toUpperCase().charCodeAt(0);
    const eventOptions = {
        key,
        code: `Key${key.toUpperCase()}`,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
        ...modifiers,
    };

    document.dispatchEvent(new KeyboardEvent("keydown", eventOptions));
    document.dispatchEvent(new KeyboardEvent("keyup", eventOptions));
}

function playPreviousTrack() {
    sendYTMShortcut("P", true);
}

function playNextTrack() {
    sendYTMShortcut("N", true);
}

function setTrackNavigationButtonsVisible(visible) {
    document.querySelector("#loop-previous-button")?.toggleAttribute("hidden", !visible);
    document.querySelector("#loop-next-button")?.toggleAttribute("hidden", !visible);
}

function syncRecordMotion() {
    const artwork = document.querySelector("#loop-artwork");
    const media = getCurrentMedia();
    updatePlaybackControls(media);

    if (!artwork || !media) {
        recordFrame = undefined;
        return;
    }

    // Use multiple rotations per track: shorter tracks spin faster and longer
    // tracks spin slower, without making one rotation equal the whole song.
    const rotationsPerTrack = 30;
    const rotation = (media.currentTime / media.duration) * rotationsPerTrack * 360;
    artwork.style.setProperty("--loop-rotation", `${rotation}deg`);

    if (!media.paused && !media.ended) {
        recordFrame = requestAnimationFrame(syncRecordMotion);
    } else {
        recordFrame = undefined;
    }
}

function watchPlaybackState() {
    const media = getCurrentMedia();
    updatePlaybackControls(media);
    if (media && !media.paused && recordFrame === undefined) syncRecordMotion();
}

let lastTrackId;
let lastTrackKey = "";
let metadataRequest = 0;
let emptyScreenDismissed = false;
let trackSyncTimer;
let trackSyncObserver;
let trackSyncHostObserver;
let observedMedia = new Set();

function scheduleTrackSync(playerBar, delay = 0) {
    window.clearTimeout(trackSyncTimer);
    trackSyncTimer = window.setTimeout(() => {
        trackSyncTimer = undefined;
        updateForCurrentTrack(playerBar);
    }, delay);
}

function changeMusicLogo() {
    const logo = document.querySelector("img.ytmusic-logo");
    if (!logo) return;

    const remoteLogoURL = "https://loop.mizucode.qzz.io/logo-client.svg";
    const localLogoURL = getExtensionURL("static/logo-client.svg");
    if (logo.dataset.loopLogoFallback === "true") {
        logo.src = localLogoURL;
        return;
    }
    logo.onerror = () => {
        logo.dataset.loopLogoFallback = "true";
        logo.src = localLogoURL;
    };
    logo.src = remoteLogoURL;
}

function initMusicLogo() {
    changeMusicLogo();

    const observer = new MutationObserver(changeMusicLogo);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusicLogo);
} else {
    initMusicLogo();
}

function observeMediaTrackChanges(playerBar) {
    const mediaElements = document.querySelectorAll("video, audio");
    for (const media of mediaElements) {
        if (observedMedia.has(media)) continue;
        observedMedia.add(media);
        // YouTube Music normally reuses the same media element for the next
        // song. These events still fire when the tab is hidden, unlike a
        // background-throttled polling loop.
        ["loadedmetadata", "durationchange", "canplay", "play", "playing", "emptied", "loadstart"].forEach((eventName) => {
            media.addEventListener(eventName, () => scheduleTrackSync(playerBar));
        });
        media.volume = getPreferredVolume();
        ["timeupdate", "play", "playing", "pause", "seeking", "seeked", "ratechange", "volumechange"].forEach((eventName) => {
            media.addEventListener(eventName, () => updatePlaybackControls());
        });
        const mediaObserver = new MutationObserver(() => scheduleTrackSync(playerBar));
        mediaObserver.observe(media, { attributes: true, attributeFilter: ["src"] });
    }
}

function watchTrackChanges(playerBar) {
    observeMediaTrackChanges(playerBar);
    trackSyncObserver?.disconnect();
    trackSyncObserver = new MutationObserver(() => {
        observeMediaTrackChanges(playerBar);
        scheduleTrackSync(playerBar);
    });
    trackSyncObserver.observe(playerBar, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["src", "href", "content", "aria-label"],
    });

    trackSyncHostObserver?.disconnect();
    trackSyncHostObserver = new MutationObserver(() => {
        const currentPlayerBar = getYTMPlayerRoot();
        if (currentPlayerBar && currentPlayerBar !== playerBar) {
            watchTrackChanges(currentPlayerBar);
            scheduleTrackSync(currentPlayerBar);
        }
    });
    trackSyncHostObserver.observe(document.body, { childList: true, subtree: true });

    // Navigation and visibility events cover transitions where YouTube Music
    // changes the URL/player state without changing the DOM immediately.
    [
        "yt-navigate-finish",
        "yt-page-data-updated",
        "yt-player-state-change",
        "ytmusic-player-state-change",
        "ytmusic-song-changed",
        "popstate",
        "hashchange",
        "pageshow",
    ].forEach((eventName) => {
        document.addEventListener(eventName, () => scheduleTrackSync(playerBar), { passive: true });
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") scheduleTrackSync(playerBar);
    }, { passive: true });
}

async function updateForCurrentTrack(playerBar) {
    const currentPlayerBar = getYTMPlayerRoot() || playerBar;
    const trackId = getCurrentTrackId(currentPlayerBar) || lastTrackId;
    const liveTrackInfo = getTrackInfo(currentPlayerBar);
    const artworkURL = getCurrentArtwork(currentPlayerBar, trackId);
    const trackSignature = [
        trackId || "",
        liveTrackInfo.title,
        liveTrackInfo.artist,
        liveTrackInfo.album,
        artworkURL,
    ].join("|");
    if (!trackId && !getCurrentMedia()) {
        clearLyricsRetryTimer();
        lyricsRequestId += 1;
        const loop = document.getElementById("loop");
        if (!emptyScreenDismissed) {
            updateLoop(getFallbackArtwork(), {
                title: "Nothing is playing",
                artist: "Search something to play",
                album: "",
                empty: true,
            });
        }
        return;
    }
    emptyScreenDismissed = false;
    if (trackSignature === lastTrackKey) {
        const albumNode = document.querySelector("#loop-track-album");
        if (albumNode && albumNode.textContent === "Unknown album" && liveTrackInfo.album !== "Unknown album") {
            albumNode.textContent = liveTrackInfo.album;
        }
        syncWindowTitle();

        // YouTube Music updates its feedback controls asynchronously after a
        // track change. Keep retrying while the track is current so the dock
        // does not remain stuck with the previous track's liked state.
        syncTrackFeedbackState();
        scheduleTrackFeedbackSync();
        return;
    }

    const searchBar = document.querySelector("ytmusic-search-box");
    if (searchBar && searchBar.style.display !== "none") {
        closeLoopSearchPanel();
        hideLoopSearch();
    }

    lastTrackId = trackId;
    lastTrackKey = trackSignature;
    const requestId = ++metadataRequest;
    clearLyricsRetryTimer();
    lyricsRequestId += 1;
    updateLoop(artworkURL, liveTrackInfo);
    syncRecordMotion();
    const trackInfo = await getTrackInfoFromTrackId(trackId, currentPlayerBar);
    const activePlayerBar = getYTMPlayerRoot() || playerBar;
    const activeTrackId = getCurrentTrackId(activePlayerBar) || lastTrackId;
    const currentInfo = getTrackInfo(activePlayerBar);
    const currentSignature = [
        activeTrackId || "",
        currentInfo.title,
        currentInfo.artist,
        currentInfo.album,
        getCurrentArtwork(activePlayerBar, activeTrackId),
    ].join("|");
    if (requestId !== metadataRequest || trackSignature !== currentSignature) return;
    updateLoop(artworkURL, trackInfo);
    syncRecordMotion();
    if (loopPreferences.showLyrics) {
        // Metadata should not wait for a potentially slow lyrics provider. The
        // lyrics request has its own request id and will update the panel when
        // it completes, as long as this is still the active track.
        fetchLoopLyricsForCurrentTrack().catch((error) => {
            console.warn("[loop.mp3] Could not fetch lyrics for the current track:", error);
        });
    }
    console.log("[loop.mp3] Current track metadata:", trackInfo);
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.getCurrentMedia = getCurrentMedia;
    global.showCloseProtectionModal = showCloseProtectionModal;
    global.formatTime = formatTime;
    global.updatePlaybackControls = updatePlaybackControls;
    global.togglePlayback = togglePlayback;
    global.toggleMute = toggleMute;
    global.getPreferredVolume = getPreferredVolume;
    global.setVolume = setVolume;
    global.seekTrack = seekTrack;
    global.sendYTMShortcut = sendYTMShortcut;
    global.sendLoopShortcut = sendLoopShortcut;
    global.playPreviousTrack = playPreviousTrack;
    global.playNextTrack = playNextTrack;
    global.setTrackNavigationButtonsVisible = setTrackNavigationButtonsVisible;
    global.syncRecordMotion = syncRecordMotion;
    global.watchPlaybackState = watchPlaybackState;
    global.scheduleTrackSync = scheduleTrackSync;
    global.changeMusicLogo = changeMusicLogo;
    global.initMusicLogo = initMusicLogo;
    global.observeMediaTrackChanges = observeMediaTrackChanges;
    global.watchTrackChanges = watchTrackChanges;
    global.updateForCurrentTrack = updateForCurrentTrack;
    Object.defineProperty(global, 'recordFrame', { configurable: true, get: () => recordFrame, set: (value) => { recordFrame = value; } });
    Object.defineProperty(global, 'lastTrackId', { configurable: true, get: () => lastTrackId, set: (value) => { lastTrackId = value; } });
    Object.defineProperty(global, 'lastTrackKey', { configurable: true, get: () => lastTrackKey, set: (value) => { lastTrackKey = value; } });
    Object.defineProperty(global, 'metadataRequest', { configurable: true, get: () => metadataRequest, set: (value) => { metadataRequest = value; } });
    Object.defineProperty(global, 'emptyScreenDismissed', { configurable: true, get: () => emptyScreenDismissed, set: (value) => { emptyScreenDismissed = value; } });
    Object.defineProperty(global, 'trackSyncTimer', { configurable: true, get: () => trackSyncTimer, set: (value) => { trackSyncTimer = value; } });
    Object.defineProperty(global, 'trackSyncObserver', { configurable: true, get: () => trackSyncObserver, set: (value) => { trackSyncObserver = value; } });
    Object.defineProperty(global, 'trackSyncHostObserver', { configurable: true, get: () => trackSyncHostObserver, set: (value) => { trackSyncHostObserver = value; } });
    Object.defineProperty(global, 'observedMedia', { configurable: true, get: () => observedMedia, set: (value) => { observedMedia = value; } });
})(globalThis);
