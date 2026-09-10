function waitForYTM(callback) {
    const check = () => {
        const playerBar = document.querySelector("ytmusic-player-bar");
        if (playerBar) return callback(playerBar);
        requestAnimationFrame(check);
    };
    check();
}

function getCurrentTrackId() {
    return new URL(location.href).searchParams.get("v");
}

function getFallbackArtwork() {
    return getExtensionURL("static/fallback-artwork.png");
}

function getVinylArtwork(trackId) {
    return trackId ? `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg` : getFallbackArtwork();
}

function loadFontAwesome() {
    if (document.querySelector('link[data-loop-font-awesome="true"]')) return;
    const mountPoint = document.head || document.documentElement;
    if (!mountPoint) {
        setTimeout(loadFontAwesome, 0);
        return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css";
    link.dataset.loopFontAwesome = "true";
    mountPoint.appendChild(link);
}

async function checkYTMusicAuth() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "CHECK_AUTH" });
    return !!response?.isLoggedIn;
  } catch {
    return null;
  }
}

const defaultKawarpSettings = {
    enabled: true,
    kawarpOpacity: 0.57,
    kawarpWarpIntensity: 1,
    kawarpBlurPasses: 7,
    kawarpAnimationSpeed: 0.3,
    kawarpTransitionDuration: 1000,
    kawarpSaturation: 2,
    kawarpDithering: 0.004,
    kawarpAudioScaleBoost: 1.1,
    audioResponsive: true,
    audioSpeedMultiplier: 4.5,
    audioBeatThreshold: 0.01,
    pauseOnInactive: true,
    showLogs: true,
    showOnBrowsePages: false,
    enableAnimatedArt: true,
    shaderType: "kawarp",
    distortion: 0.93,
    swirl: 0.97,
    offsetX: 0,
    offsetY: 0,
    scale: 1.25,
    rotation: 0,
    speed: 0.07,
    opacity: 0.33,
    audioScaleBoost: 1.3,
    boostDullColors: true,
    vibrantSaturationThreshold: 30,
    vibrantRatioThreshold: 50,
    boostIntensity: 50,
};

let kawarpSettings = { ...defaultKawarpSettings };
let kawarpBackground;
let kawarpEnabled = true;
let loopPreferences = {
    animatedBackground: true,
    hideVinyl: false,
};
let kawarpRendererClass;
let kawarpRendererPromise;
let authWarningShown = false;

const loopPreferencesKey = "loop.mp3.preferences";

function getStoredLoopPreferences() {
    const storage = globalThis.chrome?.storage?.local || globalThis.browser?.storage?.local;
    if (storage) {
        return new Promise((resolve) => {
            storage.get(loopPreferencesKey, (result) => resolve(result?.[loopPreferencesKey] || {}));
        });
    }

    try {
        return Promise.resolve(JSON.parse(localStorage.getItem(loopPreferencesKey) || "{}"));
    } catch {
        return Promise.resolve({});
    }
}

function saveLoopPreferences() {
    const storage = globalThis.chrome?.storage?.local || globalThis.browser?.storage?.local;
    if (storage) {
        storage.set({ [loopPreferencesKey]: loopPreferences });
        return;
    }

    try {
        localStorage.setItem(loopPreferencesKey, JSON.stringify(loopPreferences));
    } catch {
        // Preferences are optional; continue if storage is unavailable.
    }
}

function applyLoopPreferences() {
    const loop = document.querySelector("#loop");
    if (!loop) return;
    loop.classList.toggle("loop-no-vinyl", loopPreferences.hideVinyl);
    const vinylToggle = loop.querySelector("#loop-vinyl-toggle");
    if (vinylToggle) vinylToggle.checked = loopPreferences.hideVinyl;
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
            <p>You are not signed in with Google. Sign in for the best Loop experience.</p>
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
    const playerBar = document.querySelector("ytmusic-player-bar");
    if (!playerBar) return null;

    const candidates = [...playerBar.querySelectorAll("button, [role=button]")];
    return candidates.find((button) => {
        const label = [
            button.getAttribute("aria-label"),
            button.getAttribute("title"),
            button.textContent,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!label || !label.includes(action)) return false;
        if (action === "like" && label.includes("dislike")) return false;
        return button.offsetParent !== null;
    });
}

function triggerYTMAction(action) {
    const button = findYTMActionButton(action);
    if (button) {
        button.click();
        setTimeout(syncTrackFeedbackState, 100);
        return;
    }
    console.warn(`[loop.mp3] Could not find YouTube Music ${action} button.`);
}

function syncTrackFeedbackState() {
    const likeButton = document.querySelector("#loop-like-button");
    const dislikeButton = document.querySelector("#loop-dislike-button");
    if (!likeButton || !dislikeButton) return;

    for (const [action, dockButton] of [["like", likeButton], ["dislike", dislikeButton]]) {
        const ytmButton = findYTMActionButton(action);
        const label = [
            ytmButton?.getAttribute("aria-label"),
            ytmButton?.getAttribute("title"),
        ].filter(Boolean).join(" ").toLowerCase();
        const isActive = ytmButton?.getAttribute("aria-pressed") === "true" ||
            label.includes(`un${action}`) ||
            label.includes(`remove ${action}`);
        dockButton.classList.toggle("loop-action-active", Boolean(isActive));
        dockButton.setAttribute("aria-pressed", String(Boolean(isActive)));
        dockButton.title = `${isActive ? "Remove" : action === "like" ? "Like" : "Dislike"} current track`;
    }
}

async function warnIfNotSignedIn() {
    try {
        const isSignedIn = await checkYTMusicAuth();
        if (isSignedIn === false && !authWarningShown) {
            authWarningShown = true;
            console.warn("[loop.mp3] YouTube Music is not signed in with Google.");
            showAuthWarningPopup();
        }
    } catch (error) {
        console.warn("[loop.mp3] Could not determine YouTube Music sign-in status:", error);
    }
}

function getExtensionURL(path) {
    const runtime = globalThis.chrome?.runtime || globalThis.browser?.runtime;
    try {
        return runtime?.getURL(path) || path;
    } catch (error) {
        console.warn("[loop.mp3] Extension context unavailable while resolving asset:", error);
        return path;
    }
}

function loadKawarpRenderer() {
    if (!kawarpRendererPromise) {
        kawarpRendererPromise = import(getExtensionURL("static/kawarp.js"))
            .then(({ Kawarp }) => {
                kawarpRendererClass = Kawarp;
                return Kawarp;
            });
    }
    return kawarpRendererPromise;
}

function setKawarpCanvasVisibility(enabled) {
    const canvas = document.querySelector("#loop-kawarp-background");
    if (canvas) canvas.style.display = enabled ? "block" : "none";
}

function applyKawarpSettings(settings) {
    kawarpSettings = { ...defaultKawarpSettings, ...settings };
    kawarpEnabled = loopPreferences.animatedBackground && kawarpSettings.enabled !== false;
    kawarpBackground?.setOptions({
        warpIntensity: kawarpSettings.kawarpWarpIntensity,
        blurPasses: kawarpSettings.kawarpBlurPasses,
        animationSpeed: kawarpSettings.kawarpAnimationSpeed,
        transitionDuration: kawarpSettings.kawarpTransitionDuration,
        saturation: kawarpSettings.kawarpSaturation,
        dithering: kawarpSettings.kawarpDithering,
        scale: kawarpSettings.scale,
    });
    const canvas = document.querySelector("#loop-kawarp-background");
    if (canvas) {
        canvas.style.opacity = String(kawarpSettings.opacity ?? kawarpSettings.kawarpOpacity);
        canvas.style.display = kawarpEnabled ? "block" : "none";
    }
    const backgroundToggle = document.querySelector("#loop-background-toggle");
    if (backgroundToggle) backgroundToggle.checked = kawarpEnabled;
}

async function loadKawarpSettings() {
    try {
        const response = await fetch(getExtensionURL("config/shader.json"));
        if (!response.ok) throw new Error(`shader.json returned ${response.status}`);
        const config = await response.json();
        applyKawarpSettings(config.settings || config);
    } catch (error) {
        console.warn("[loop.mp3] Could not load Kawarp settings:", error);
    }
}

async function loadLoopPreferences() {
    loopPreferences = { ...loopPreferences, ...(await getStoredLoopPreferences()) };
    applyKawarpSettings(kawarpSettings);
    applyLoopPreferences();
}

function setKawarpEnabled(enabled) {
    kawarpEnabled = enabled;
    loopPreferences.animatedBackground = enabled;
    saveLoopPreferences();
    setKawarpCanvasVisibility(enabled);
}

function disposeKawarpBackground() {
    kawarpBackground?.dispose();
    kawarpBackground = undefined;
}

function updateKawarpArtwork(artworkURL) {
    const canvas = document.querySelector("#loop-kawarp-background");
    if (!canvas) return;

    if (!kawarpRendererClass) {
        loadKawarpRenderer()
            .then(() => updateKawarpArtwork(artworkURL))
            .catch((error) => console.warn("[loop.mp3] Could not load @kawarp/core:", error));
        return;
    }

    try {
        if (!kawarpBackground) {
            kawarpBackground = new kawarpRendererClass(canvas, {
                warpIntensity: kawarpSettings.kawarpWarpIntensity,
                blurPasses: kawarpSettings.kawarpBlurPasses,
                animationSpeed: kawarpSettings.kawarpAnimationSpeed,
                transitionDuration: kawarpSettings.kawarpTransitionDuration,
                saturation: kawarpSettings.kawarpSaturation,
                dithering: kawarpSettings.kawarpDithering,
                scale: kawarpSettings.scale,
            });
            canvas.style.opacity = String(kawarpSettings.opacity ?? kawarpSettings.kawarpOpacity);
            setKawarpCanvasVisibility(kawarpEnabled);
            window.addEventListener("resize", () => kawarpBackground?.resize(), { passive: true });
            kawarpBackground.start();
        }
        kawarpBackground.loadImage(artworkURL).catch((error) => {
            console.warn("[loop.mp3] Could not load artwork into Kawarp:", error);
        });
    } catch (error) {
        console.warn("[loop.mp3] Could not initialize Kawarp:", error);
    }
}

function getTrackInfo(playerBar) {
    const title = playerBar.querySelector(".title")?.textContent.trim() || "Unknown title";
    const byline = playerBar.querySelector("yt-formatted-string.byline.ytmusic-player-bar") ||
        playerBar.querySelector(".subtitle.ytmusic-player-bar yt-formatted-string.byline") ||
        playerBar.querySelector(".byline");
    const links = byline?.querySelectorAll("a") || [];
    return {
        title,
        artist: links[0]?.textContent.trim() || "Unknown artist",
        album: links.length >= 2 ? links[links.length - 1].textContent.trim() : "Unknown album",
    };
}

// oEmbed resolves the canonical title and artist from the track ID. Album is
// read from the linked album entry in YouTube Music's player bar.
async function getTrackInfoFromTrackId(trackId, playerBar) {
    const domInfo = getTrackInfo(playerBar);
    if (!trackId) return domInfo;

    try {
        const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`YouTube oEmbed returned ${response.status}`);
        const details = await response.json();
        const liveInfo = getTrackInfo(playerBar);
        return {
            title: details.title || liveInfo.title || domInfo.title,
            artist: details.author_name || liveInfo.artist || domInfo.artist,
            album: liveInfo.album || domInfo.album,
        };
    } catch (error) {
        console.warn("[loop.mp3] Could not fetch track metadata:", error);
        return domInfo;
    }
}

function syncWindowTitle() {
    const loop = document.getElementById("loop");
    if (!loop || loop.classList.contains("loop-empty")) {
        document.title = "loop";
        return;
    }

    const title = loop.querySelector("#loop-track-title")?.textContent.trim();
    const artist = loop.querySelector("#loop-track-artist")?.textContent.trim();
    document.title = title && artist ? `Loop | ${title} by ${artist}` : "loop";
}

function goBackToNormal() {
    if (!getCurrentTrackId()) emptyScreenDismissed = true;
    restoreYTMSearch();
    document.title = "loop";
    console.log("[loop.mp3] Loop removed, back to normal YTM");
}

function updateLoop(artworkURL, trackInfo) {
    let loop = document.getElementById("loop");
    if (!loop) {
        loop = document.createElement("div");
        loop.id = "loop";
        loop.innerHTML = `
            <div id="loop-player">
                <button id="loop-back-button" type="button" aria-label="Return to YouTube Music">&#215;</button>
                <button id="loop-shortcuts-button" type="button" aria-label="Show keyboard shortcuts">?</button>
                <canvas id="loop-kawarp-background" aria-hidden="true"></canvas>
                <div id="loop-shortcuts-panel" hidden>
                    <div class="loop-shortcuts-title">Loop shortcuts</div>
                    <div><kbd>M</kbd> Mute / unmute</div>
                    <div><kbd>K</kbd> Previous track</div>
                    <div><kbd>J</kbd> Next track</div>
                    <div><kbd>Ctrl + K</kbd> Search</div>
                    <div><kbd>Ctrl + Q</kbd> See queue</div>
                    <div><kbd>Ctrl + P</kbd> Select playlists <span>(not implemented)</span></div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-navigation-toggle" type="checkbox">
                        Show previous/next buttons
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-background-toggle" type="checkbox" checked>
                        Animated artwork background
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-vinyl-toggle" type="checkbox">
                        Don’t show vinyl
                    </label>
                </div>
                <div id="loop-empty-state" hidden>
                    <div class="loop-empty-title">Nothing is playing</div>
                    <div class="loop-empty-subtitle">Search something to play</div>
                    <kbd>Ctrl + K</kbd>
                </div>
                <div id="loop-inline-buttons" aria-label="Playback controls">
                    <button id="loop-previous-button" type="button" aria-label="Previous track" hidden>&#9198;</button>
                    <button id="loop-play-button" type="button" aria-label="Play">&#9654;</button>
                    <button id="loop-next-button" type="button" aria-label="Next track" hidden>&#9197;</button>
                    <button id="loop-mute-button" type="button" aria-label="Mute">&#128266;</button>
                    <button id="loop-queue-button" type="button" aria-label="Show queue">&#9776;</button>
                    <button id="loop-search-button" type="button" aria-label="Search">
                        <svg class="loop-icon" viewBox="0 0 512 512" aria-hidden="true">
                            <path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.1-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                        </svg>
                    </button>
                </div>
                <img id="loop-artwork" alt="Album artwork" onerror="this.onerror=null; this.src='${getFallbackArtwork()}';">
                <div id="loop-track-info">
                    <div id="loop-track-title"></div>
                    <div id="loop-track-artist"></div>
                    <div id="loop-track-album"></div>
                </div>
                <div id="loop-controls" aria-label="Playback controls">
                    <div id="loop-seek-row">
                        <span id="loop-current-time">0:00</span>
                        <input id="loop-seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Seek through track">
                        <span id="loop-duration">0:00</span>
                    </div>
                </div>
                <div id="loop-action-dock" aria-label="Track actions">
                    <button id="loop-like-button" type="button" aria-label="Like current track" title="Like current track">
                        <i class="fa-solid fa-thumbs-up" aria-hidden="true"></i>
                    </button>
                    <button id="loop-dislike-button" type="button" aria-label="Dislike current track" title="Dislike current track">
                        <i class="fa-solid fa-thumbs-down" aria-hidden="true"></i>
                    </button>
                </div>
            </div>`;
        document.body.appendChild(loop);
        applyLoopPreferences();
        loop.querySelector("#loop-back-button").addEventListener("click", goBackToNormal);
        loop.querySelector("#loop-play-button").addEventListener("click", togglePlayback);
        loop.querySelector("#loop-mute-button").addEventListener("click", toggleMute);
        loop.querySelector("#loop-previous-button").addEventListener("click", playPreviousTrack);
        loop.querySelector("#loop-next-button").addEventListener("click", playNextTrack);
        loop.querySelector("#loop-seek").addEventListener("input", seekTrack);
        loop.querySelector("#loop-like-button").addEventListener("click", () => triggerYTMAction("like"));
        loop.querySelector("#loop-dislike-button").addEventListener("click", () => triggerYTMAction("dislike"));
        loop.querySelector("#loop-navigation-toggle").addEventListener("change", (event) => {
            setTrackNavigationButtonsVisible(event.target.checked);
        });
        loop.querySelector("#loop-background-toggle").addEventListener("change", (event) => {
            setKawarpEnabled(event.target.checked);
        });
        loop.querySelector("#loop-queue-button").addEventListener("click", () => {
            sendLoopShortcut("q", { ctrlKey: true });
        });
        loop.querySelector("#loop-search-button").addEventListener("click", () => {
            sendLoopShortcut("k", { ctrlKey: true });
        });
        loop.querySelector("#loop-vinyl-toggle").addEventListener("change", (event) => {
            loopPreferences.hideVinyl = event.target.checked;
            saveLoopPreferences();
            applyLoopPreferences();
        });
        loop.querySelector("#loop-shortcuts-button").addEventListener("click", (event) => {
            event.stopPropagation();
            const panel = loop.querySelector("#loop-shortcuts-panel");
            panel.hidden = !panel.hidden;
        });
        loop.addEventListener("click", (event) => {
            const searchBar = document.querySelector("ytmusic-search-box");
            const resultsPanel = document.getElementById("loop-search-results");
            const queuePanel = document.getElementById("loop-queue-panel");
            const shortcutsPanel = document.getElementById("loop-shortcuts-panel");
            const shortcutsButton = document.getElementById("loop-shortcuts-button");
            const queueButton = document.getElementById("loop-queue-button");
            const searchButton = document.getElementById("loop-search-button");

            if (
                resultsPanel &&
                event.target instanceof Element &&
                resultsPanel.contains(event.target) &&
                event.target.closest(
                    "a[href*='/watch'], ytmusic-responsive-list-item-renderer, " +
                    "ytmusic-two-row-item-renderer, ytmusic-item-renderer, " +
                    "ytmusic-playlist-panel-video-renderer, ytmusic-video-renderer, " +
                    "ytmusic-music-video-renderer"
                )
            ) {
                setTimeout(() => {
                    closeLoopSearchPanel();
                    hideLoopSearch();
                }, 0);
                return;
            }

            if (
                event.target instanceof Node &&
                ((searchBar && searchBar.contains(event.target)) ||
                    (resultsPanel && resultsPanel.contains(event.target)) ||
                    (queuePanel && queuePanel.contains(event.target)) ||
                    (shortcutsPanel && shortcutsPanel.contains(event.target)) ||
                    (shortcutsButton && shortcutsButton.contains(event.target)) ||
                    (queueButton && queueButton.contains(event.target)) ||
                    (searchButton && searchButton.contains(event.target)))
            ) {
                return;
            }

            closeLoopSearchPanel();
            restoreLoopQueue();
            hideLoopSearch();
        });
    }
    const artwork = loop.querySelector("#loop-artwork");
    const title = loop.querySelector("#loop-track-title");
    const artist = loop.querySelector("#loop-track-artist");
    const album = loop.querySelector("#loop-track-album");
    const emptyState = loop.querySelector("#loop-empty-state");

    // YouTube Music can replace DOM nodes while navigating between tracks.
    // Rebuild the injected UI if one of its required nodes disappeared.
    if (!artwork || !title || !artist || !album || !emptyState) {
        loop.remove();
        return updateLoop(artworkURL, trackInfo);
    }

    artwork.src = trackInfo.empty ? getFallbackArtwork() : artworkURL;
    title.textContent = trackInfo.title;
    artist.textContent = trackInfo.artist;
    album.textContent = trackInfo.album;
    loop.classList.toggle("loop-empty", Boolean(trackInfo.empty));
    emptyState.hidden = !trackInfo.empty;
    syncWindowTitle();
    syncTrackFeedbackState();
    updateKawarpArtwork(artwork.src);
    updatePlaybackControls(getCurrentMedia());
}

let recordFrame;

function getCurrentMedia() {
    const media = [...document.querySelectorAll("video, audio")]
        .filter((element) => Number.isFinite(element.duration) && element.duration > 0);
    return media.find((element) => !element.paused && !element.ended) || media[0];
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
}

function updatePlaybackControls(media = getCurrentMedia()) {
    const playButton = document.querySelector("#loop-play-button");
    const muteButton = document.querySelector("#loop-mute-button");
    const seek = document.querySelector("#loop-seek");
    const currentTime = document.querySelector("#loop-current-time");
    const duration = document.querySelector("#loop-duration");

    if (!playButton || !muteButton || !seek || !currentTime || !duration) return;

    if (!media) {
        playButton.textContent = "▶";
        playButton.setAttribute("aria-label", "Play");
        muteButton.textContent = "🔊";
        muteButton.setAttribute("aria-label", "Mute");
        seek.value = "0";
        seek.max = "0";
        currentTime.textContent = "0:00";
        duration.textContent = "0:00";
        return;
    }

    playButton.textContent = media.paused ? "▶" : "⏸";
    playButton.setAttribute("aria-label", media.paused ? "Play" : "Pause");
    muteButton.textContent = media.muted ? "♩" : "♪";
    muteButton.setAttribute("aria-label", media.muted ? "Unmute" : "Mute");
    seek.max = Number.isFinite(media.duration) ? String(media.duration) : "0";
    seek.value = Number.isFinite(media.currentTime) ? String(media.currentTime) : "0";
    currentTime.textContent = formatTime(media.currentTime);
    duration.textContent = formatTime(media.duration);
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

function seekTrack(event) {
    const media = getCurrentMedia();
    if (!media) return;

    const nextTime = Number(event.target.value);
    if (Number.isFinite(nextTime)) media.currentTime = nextTime;
    updatePlaybackControls(media);
}

function sendYTMShortcut(key) {
    const keyCode = key.toUpperCase().charCodeAt(0);
    const eventOptions = {
        key,
        code: `Key${key.toUpperCase()}`,
        keyCode,
        which: keyCode,
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
    sendYTMShortcut("j");
}

function playNextTrack() {
    sendYTMShortcut("k");
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
let metadataRequest = 0;
let emptyScreenDismissed = false;

async function updateForCurrentTrack(playerBar) {
    const trackId = getCurrentTrackId();
    if (!trackId) {
        const media = getCurrentMedia();
        const loop = document.getElementById("loop");
        if (media && !emptyScreenDismissed) {
            if (!loop || loop.classList.contains("loop-empty")) {
                updateLoop(
                    lastTrackId ? getVinylArtwork(lastTrackId) : getFallbackArtwork(),
                    getTrackInfo(playerBar)
                );
            }
            return;
        }
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
    if (trackId === lastTrackId) {
        const liveInfo = getTrackInfo(playerBar);
        const albumNode = document.querySelector("#loop-track-album");
        if (albumNode && albumNode.textContent === "Unknown album" && liveInfo.album !== "Unknown album") {
            albumNode.textContent = liveInfo.album;
        }
        syncWindowTitle();

        // YouTube Music updates its feedback controls asynchronously after a
        // track change. Keep retrying while the track is current so the dock
        // does not remain stuck with the previous track's liked state.
        syncTrackFeedbackState();
        return;
    }

    lastTrackId = trackId;
    const requestId = ++metadataRequest;
    updateLoop(getVinylArtwork(trackId), getTrackInfo(playerBar));
    syncRecordMotion();
    const trackInfo = await getTrackInfoFromTrackId(trackId, playerBar);
    if (requestId !== metadataRequest || trackId !== getCurrentTrackId()) return;
    updateLoop(getVinylArtwork(trackId), trackInfo);
    syncRecordMotion();
    console.log("[loop.mp3] Current track metadata:", trackInfo);
}

function hideLoopSearch() {
    const searchBar = document.querySelector("ytmusic-search-box");

    if (!searchBar) return;

    loopSearchResizeObserver?.disconnect();
    loopSearchResizeObserver = undefined;
    loopSearchMutationObserver?.disconnect();
    loopSearchMutationObserver = undefined;
    searchBar.style.setProperty("display", "none", "important");
    searchBar.style.setProperty("top", "50%", "important");

    console.log("[loop.mp3] Search hidden");
}

let loopSearchResizeObserver;
let loopSearchMutationObserver;
let loopSearchResultsObserver;
let originalSearchResultsParent;
let originalSearchResultsNextSibling;
let originalSearchParent;
let originalSearchNextSibling;
let loopQueueObserver;
let originalQueueRenderer;
let originalQueueParent;
let originalQueueNextSibling;
let originalQueueStyle;
let originalQueueHidden;

function restoreYTMSearch() {
    const searchBar = document.querySelector("ytmusic-search-box");

    loopSearchResizeObserver?.disconnect();
    loopSearchResizeObserver = undefined;
    loopSearchMutationObserver?.disconnect();
    loopSearchMutationObserver = undefined;
    loopSearchResultsObserver?.disconnect();
    loopSearchResultsObserver = undefined;
    loopQueueObserver?.disconnect();
    loopQueueObserver = undefined;
    disposeKawarpBackground();

    if (searchBar) {
        searchBar.style.removeProperty("display");
        searchBar.style.removeProperty("position");
        searchBar.style.removeProperty("top");
        searchBar.style.removeProperty("left");
        searchBar.style.removeProperty("right");
        searchBar.style.removeProperty("bottom");
        searchBar.style.removeProperty("transform");
        searchBar.style.removeProperty("z-index");
        searchBar.style.removeProperty("overflow");

        if (originalSearchParent?.isConnected) {
            originalSearchParent.insertBefore(
                searchBar,
                originalSearchNextSibling?.parentNode === originalSearchParent
                    ? originalSearchNextSibling
                    : null
            );
        }
    }

    restoreLoopSearchResults();
    restoreLoopQueue();

    document.getElementById("loop")?.remove();
    document.title = "loop";
    originalSearchParent = undefined;
    originalSearchNextSibling = undefined;
    originalSearchResultsParent = undefined;
    originalSearchResultsNextSibling = undefined;
}

function restoreLoopSearchResults() {
    const searchResults = document.querySelector("ytmusic-tabbed-search-results-renderer") ||
        document.getElementById("loop-search-results")?.querySelector("ytmusic-tabbed-search-results-renderer");

    if (searchResults && originalSearchResultsParent?.isConnected) {
        originalSearchResultsParent.insertBefore(
            searchResults,
            originalSearchResultsNextSibling?.parentNode === originalSearchResultsParent
                ? originalSearchResultsNextSibling
                : null
        );
    }

    originalSearchResultsParent = undefined;
    originalSearchResultsNextSibling = undefined;
}

function restoreLoopQueue() {
    loopQueueObserver?.disconnect();
    loopQueueObserver = undefined;

    if (originalQueueRenderer && originalQueueParent?.isConnected) {
        originalQueueParent.insertBefore(
            originalQueueRenderer,
            originalQueueNextSibling?.parentNode === originalQueueParent
                ? originalQueueNextSibling
                : null
        );
    }

    if (originalQueueRenderer) {
        if (originalQueueStyle === null || originalQueueStyle === undefined) {
            originalQueueRenderer.removeAttribute("style");
        } else {
            originalQueueRenderer.setAttribute("style", originalQueueStyle);
        }
        if (originalQueueHidden) {
            originalQueueRenderer.setAttribute("hidden", "");
        } else {
            originalQueueRenderer.removeAttribute("hidden");
        }
    }

    document.getElementById("loop-queue-panel")?.remove();
    originalQueueRenderer = undefined;
    originalQueueParent = undefined;
    originalQueueNextSibling = undefined;
    originalQueueStyle = undefined;
    originalQueueHidden = undefined;
}

function closeLoopSearchPanel() {
    loopSearchResultsObserver?.disconnect();
    loopSearchResultsObserver = undefined;
    restoreLoopSearchResults();
    document.getElementById("loop-search-results")?.remove();

    const searchBar = document.querySelector("ytmusic-search-box");
    searchBar?.style.setProperty("top", "50%", "important");
    const suggestionList = searchBar?.querySelector("#suggestion-list") ||
        document.querySelector("#suggestion-list");
    if (suggestionList) suggestionList.hidden = false;
}

function getLoopQueuePanel() {
    let panel = document.getElementById("loop-queue-panel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "loop-queue-panel";
        document.getElementById("loop")?.appendChild(panel);
    }
    return panel;
}

function renderLoopQueue() {
    const panel = getLoopQueuePanel();
    const source = originalQueueRenderer ||
        document.querySelector("ytmusic-tab-renderer#tab-renderer") ||
        document.querySelector("ytmusic-player-page ytmusic-tab-renderer#tab-renderer");

    if (!source || !panel) return false;

    if (!originalQueueRenderer) {
        originalQueueRenderer = source;
        originalQueueParent = source.parentNode;
        originalQueueNextSibling = source.nextSibling;
        originalQueueStyle = source.getAttribute("style");
        originalQueueHidden = source.hasAttribute("hidden");
    }

    panel.replaceChildren(source);
    source.removeAttribute("hidden");
    source.style.setProperty("display", "block", "important");
    source.style.setProperty("visibility", "visible", "important");
    source.style.setProperty("opacity", "1", "important");
    source.style.setProperty("position", "relative", "important");
    source.style.setProperty("width", "100%", "important");
    source.style.setProperty("height", "auto", "important");
    source.style.setProperty("min-height", "180px", "important");
    source.style.setProperty("max-height", "none", "important");
    source.style.setProperty("overflow", "visible", "important");
    return true;
}

function showLoopQueue() {
    const loop = document.getElementById("loop");
    if (!loop) return;

    const panel = document.getElementById("loop-queue-panel");
    if (panel && originalQueueRenderer && panel.contains(originalQueueRenderer)) {
        restoreLoopQueue();
        return;
    }

    if (renderLoopQueue()) return;

    loopQueueObserver?.disconnect();
    loopQueueObserver = new MutationObserver(() => {
        if (renderLoopQueue()) {
            loopQueueObserver?.disconnect();
            loopQueueObserver = undefined;
        }
    });
    loopQueueObserver.observe(document.body, { childList: true, subtree: true });
}

function getLoopSearchResultsPanel() {
    let panel = document.getElementById("loop-search-results");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "loop-search-results";
        document.getElementById("loop")?.appendChild(panel);
    }
    return panel;
}

function renderLoopSearchResults(searchBar) {
    const source = document.querySelector("ytmusic-tabbed-search-results-renderer");
    const panel = getLoopSearchResultsPanel();

    if (!source || !panel) return false;

    if (!originalSearchResultsParent) {
        originalSearchResultsParent = source.parentNode;
        originalSearchResultsNextSibling = source.nextSibling;
    }
    panel.replaceChildren(source);

    const panelHeight = panel.getBoundingClientRect().height;
    if (panelHeight > 0) {
        const gap = 8;
        searchBar.style.setProperty(
            "top",
            `calc(50% - ${(panelHeight + gap) / 2}px)`,
            "important"
        );
    }

    const searchBounds = searchBar.getBoundingClientRect();
    panel.style.setProperty("top", `${searchBounds.bottom + 8}px`, "important");
    panel.style.setProperty("left", `${searchBounds.left}px`, "important");
    panel.style.setProperty("width", `${searchBounds.width}px`, "important");
    return true;
}

function showLoopSearchResults(searchBar) {
    const suggestionList = searchBar.querySelector("#suggestion-list") ||
        document.querySelector("#suggestion-list");
    if (suggestionList) suggestionList.hidden = true;

    const render = () => {
        const rendered = renderLoopSearchResults(searchBar);
        if (rendered) {
            loopSearchResultsObserver?.disconnect();
            loopSearchResultsObserver = undefined;
        }
        return rendered;
    };
    if (render()) return;

    loopSearchResultsObserver?.disconnect();
    loopSearchResultsObserver = new MutationObserver(render);
    loopSearchResultsObserver.observe(document.body, { childList: true, subtree: true });
}

function positionLoopSearch(searchBar, suggestionList) {
    if (!suggestionList || suggestionList.getBoundingClientRect().height === 0) {
        searchBar.style.setProperty("top", "50%", "important");
        return;
    }

    const suggestionHeight = suggestionList.getBoundingClientRect().height;
    const gap = 8;
    searchBar.style.setProperty(
        "top",
        `calc(50% - ${(suggestionHeight + gap) / 2}px)`,
        "important"
    );

}

function showLoopSuggestions(searchBar) {
    const suggestionList = searchBar.querySelector("#suggestion-list") ||
        document.querySelector("#suggestion-list");

    if (!suggestionList) return;

    searchBar.style.setProperty("top", "50%", "important");

    if (!suggestionList.textContent.trim()) {
        return;
    }

    suggestionList.style.setProperty("z-index", "999999999999999", "important");
    suggestionList.style.setProperty("padding", "8px 0", "important");
}

function showLoopSearch() {
    const searchBar = document.querySelector("ytmusic-search-box");
    const loop = document.getElementById("loop");

    if (!searchBar || !loop) {
        console.log("[loop.mp3] Search bar or Loop not found");
        return;
    }

    if (searchBar.parentNode !== loop) {
        originalSearchParent = searchBar.parentNode;
        originalSearchNextSibling = searchBar.nextSibling;
    }
    loop.appendChild(searchBar);

    searchBar.style.setProperty("display", "block", "important");
    searchBar.style.setProperty("position", "fixed", "important");
    searchBar.style.setProperty("top", "50%", "important");
    searchBar.style.setProperty("left", "50%", "important");
    searchBar.style.setProperty("right", "auto", "important");
    searchBar.style.setProperty("bottom", "auto", "important");
    searchBar.style.setProperty("transform", "translate(-50%, -50%)", "important");
    searchBar.style.setProperty("z-index", "999999999999999", "important");
    searchBar.style.setProperty("overflow", "visible", "important");

    showLoopSuggestions(searchBar);
    loopSearchMutationObserver?.disconnect();
    loopSearchMutationObserver = new MutationObserver(() => {
        showLoopSuggestions(searchBar);
    });
    loopSearchMutationObserver.observe(searchBar, { childList: true, subtree: true });

    requestAnimationFrame(() => {
        const input = searchBar.querySelector("#input") || searchBar.querySelector("input");
        input?.focus();
    });

    console.log("[loop.mp3] Search shown");
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.getElementById("loop")) {
        event.preventDefault();
        closeLoopSearchPanel();
        restoreLoopQueue();
        hideLoopSearch();
        return;
    }

    if (event.ctrlKey && event.key === "m") {
        console.log("[loop.mp3] Search called");
        showLoopSearch();
        return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        showLoopQueue();
        return;
    }

    // Ignore the synthetic J/K events generated for YouTube Music itself.
    if (!event.isTrusted) return;

    const target = event.target;
    const isTyping = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
    if (
        document.getElementById("loop") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.repeat &&
        !isTyping
    ) {
        if (event.key.toLowerCase() === "m") {
            toggleMute();
            return;
        }
        if (event.key.toLowerCase() === "j") {
            playPreviousTrack();
            return;
        }
        if (event.key.toLowerCase() === "k") {
            playNextTrack();
            return;
        }
    }

    if (event.key === "Enter") {
        const searchBar = document.querySelector("ytmusic-search-box");
        if (searchBar && event.target instanceof Node && searchBar.contains(event.target)) {
            // Let YouTube Music process the query, then mirror its results in the Loop panel.
            setTimeout(() => showLoopSearchResults(searchBar), 0);
        }
    }
});

function init(playerBar) {
    console.log("[loop.mp3] YTM is ready", playerBar);
    document.title = "loop";
    warnIfNotSignedIn();
    updateForCurrentTrack(playerBar);
    setInterval(() => {
        updateForCurrentTrack(playerBar);
        watchPlaybackState();
    }, 100);
}

loadFontAwesome();
loadKawarpRenderer().catch((error) => {
    console.warn("[loop.mp3] Could not load @kawarp/core:", error);
});
loadKawarpSettings();
loadLoopPreferences();
waitForYTM(init);
