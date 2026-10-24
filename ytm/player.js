function bindLoopRecordEvents() {
    if (loopRecordEventsBound) return;
    loopRecordEventsBound = true;

    document.addEventListener("pointerdown", (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest("#loop-record-button");
        if (!button) return;
        button.dataset.loopPointerActivated = "true";
        returnToLoopUI(event);
    }, true);

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest("#loop-record-button");
        if (!button) return;
        if (button.dataset.loopPointerActivated === "true") {
            delete button.dataset.loopPointerActivated;
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        returnToLoopUI(event);
    }, true);
}

function ensureLoopRecordButton() {
    const castButton = [...document.querySelectorAll("ytmusic-cast-button")].find((button) => {
        const bounds = button.getBoundingClientRect();
        return button.offsetParent !== null && bounds.width > 0 && bounds.height > 0;
    });
    if (!castButton) return;

    let recordButton = document.getElementById("loop-record-button");
    if (!recordButton) {
        recordButton = document.createElement("button");
        recordButton.id = "loop-record-button";
        recordButton.type = "button";
        recordButton.setAttribute("aria-label", "Open Loop");
        recordButton.innerHTML = '<i class="fa-solid fa-record-vinyl" aria-hidden="true"></i>';
    }
    castButton.insertAdjacentElement("beforebegin", recordButton);
}

async function openMiniPlayerLegacy() {
    if (!("documentPictureInPicture" in window)) {
        console.error("[loop.mp3] miniplayer not supported");
        return;
    }

    if (documentPictureInPicture.window) {
        documentPictureInPicture.window.focus();
        return;
    }

    const pipWindow = await documentPictureInPicture.requestWindow({
        width: 520,
        height: 180,
        disallowReturnToOpener: true
    });

    // Basic HTML
    pipWindow.document.body.innerHTML = `
        <div id="mini-player">
            <img id="artwork" src="" />

            <div id="info">
                <div id="title">Loop</div>
                <div id="artist">Nothing playing</div>
            </div>

            <div id="controls">
                <button id="previous">⏮</button>
                <button id="play-pause">▶</button>
                <button id="next">⏭</button>
            </div>
        </div>
    `;

    // CSS
    const style = pipWindow.document.createElement("style");

    style.textContent = `
        html, body {
            margin: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #111;
            color: white;
            font-family: Arial, sans-serif;
        }

        #mini-player {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
        }

        #artwork {
            width: 140px;
            height: 140px;
            object-fit: cover;
            border-radius: 12px;
        }

        #info {
            flex: 1;
            min-width: 0;
        }

        #title {
            font-size: 18px;
            font-weight: 600;
        }

        #artist {
            margin-top: 6px;
            opacity: 0.6;
        }

        #controls {
            display: flex;
            gap: 8px;
        }

        button {
            border: 0;
            background: transparent;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
    `;

    pipWindow.document.head.appendChild(style);

    // Detect when Chrome closes the PiP window
    pipWindow.addEventListener("pagehide", () => {
        console.log("[loop.mp3] closed pip");
        showLoopNotification(`Closed miniplayer`)
    });
}


let miniPlayerBridge;

async function openMiniPlayer() {
    if (!("documentPictureInPicture" in window)) {
        console.error("[loop.mp3] miniplayer not supported");
        return;
    }
    if (documentPictureInPicture.window) {
        documentPictureInPicture.window.focus();
        return;
    }

    const pipWindow = await documentPictureInPicture.requestWindow({
        width: 520,
        height: 210,
        disallowReturnToOpener: true,
    });
    const theme = loopPreferences.theme || "default";
    pipWindow.document.documentElement.dataset.theme = theme;
    pipWindow.document.body.innerHTML = `
        <div id="mini-player">
            <canvas id="mini-kawarp-background" aria-hidden="true"></canvas>
            <img id="artwork" src="${getFallbackArtwork()}" alt="Track artwork">
            <div id="info">
                <div id="title">Nothing playing</div>
                <div id="artist">Search something to play</div>
                <div id="album"></div>
                <div id="timeline">
                    <span id="current-time">0:00</span>
                    <input id="seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Seek through track" disabled>
                    <span id="duration">0:00</span>
                </div>
                <div id="controls">
                    <button id="previous" type="button" aria-label="Previous track" title="Previous track">&#9198;</button>
                    <button id="play-pause" type="button" aria-label="Play" title="Play">&#9654;</button>
                    <button id="next" type="button" aria-label="Next track" title="Next track">&#9197;</button>
                </div>
            </div>
        </div>`;

    const loopStylesheet = pipWindow.document.createElement("link");
    loopStylesheet.rel = "stylesheet";
    loopStylesheet.href = getExtensionURL("static/loop.css");
    loopStylesheet.dataset.loopStylesheet = "true";
    pipWindow.document.head.appendChild(loopStylesheet);

    const style = pipWindow.document.createElement("style");
    style.textContent = `
        :root { color-scheme: dark; --mini-bg: #000; --mini-text: #fff; --mini-muted: rgba(255,255,255,.6); --mini-control: rgba(255,255,255,.12); --mini-accent: #fff; --mini-border: rgba(255,255,255,.18); }
        html[data-theme="sharp"] { color-scheme: light; --mini-bg: #000; --mini-text: #fff; --mini-muted: #fff; --mini-control: #000; --mini-accent: #fff; --mini-border: #fff; }
        html[data-theme="catppuccin"] { --mini-bg: #1e1e2e; --mini-text: #cdd6f4; --mini-muted: #a6adc8; --mini-control: #313244; --mini-accent: #cba6f7; --mini-border: #45475a; }
        html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: var(--mini-bg); color: var(--mini-text); font-family: system-ui, sans-serif; }
        #mini-player { position: relative; box-sizing: border-box; width: 100%; height: 100%; display: flex; align-items: center; gap: 14px; padding: 12px 14px; animation: mini-player-fade-in 220ms ease-out both; }
        #mini-kawarp-background { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; opacity: .57; pointer-events: none; }
        #mini-player > :not(#mini-kawarp-background) { position: relative; z-index: 1; }
        @keyframes mini-player-fade-in { from { opacity: 0; transform: translateY(6px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { #mini-player { animation: none; } }
        #artwork { flex: 0 0 136px; width: 136px; height: 136px; object-fit: cover; border: 1px solid var(--mini-border); border-radius: 10px; background: var(--mini-control); }
        #info { flex: 1; min-width: 0; }
        #title, #artist, #album { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #title { font-size: 17px; font-weight: 600; }
        #artist, #album { margin-top: 4px; color: var(--mini-muted); font-size: 13px; }
        #album:empty { display: none; }
        #timeline { display: flex; align-items: center; gap: 7px; margin-top: 11px; color: var(--mini-muted); font-size: 11px; }
        #seek { flex: 1; min-width: 80px; accent-color: var(--mini-accent); }
        #controls { display: flex; align-items: center; gap: 12px; margin-top: 5px; }
        button { width: 32px; height: 32px; border: 1px solid var(--mini-border); border-radius: 50%; background: var(--mini-control); color: var(--mini-text); font-size: 20px; cursor: pointer; }
        button:hover:not(:disabled) { background: var(--mini-accent); color: var(--mini-bg); }
        button:disabled { opacity: .35; cursor: default; }
        #play-pause { background: var(--mini-accent); color: var(--mini-bg); font-size: 16px; }
        html[data-theme="sharp"] button { border-radius: 0; border-width: 2px; }
        html[data-theme="sharp"] #play-pause { background: #fff; color: #000; }
        html[data-theme="catppuccin"] button { border-radius: 10px; }
        @media (max-width: 390px) { #artwork { flex-basis: 104px; width: 104px; height: 104px; } #mini-player { gap: 10px; padding: 10px; } }
    `;
    pipWindow.document.head.appendChild(style);

    const doc = pipWindow.document;
    const nodes = {
        artwork: doc.getElementById("artwork"), title: doc.getElementById("title"),
        artist: doc.getElementById("artist"), album: doc.getElementById("album"),
        seek: doc.getElementById("seek"), currentTime: doc.getElementById("current-time"),
        duration: doc.getElementById("duration"), play: doc.getElementById("play-pause"),
        previous: doc.getElementById("previous"), next: doc.getElementById("next"),
    };
    const miniKawarpCanvas = doc.getElementById("mini-kawarp-background");
    let miniKawarpBackground;
    let miniKawarpArtwork = "";
    const updateMiniKawarp = async (artworkURL) => {
        const shouldRun = kawarpEnabled && loopPreferences.animatedBackground;
        if (!shouldRun) {
            miniKawarpCanvas.style.display = "none";
            miniKawarpBackground?.dispose();
            miniKawarpBackground = undefined;
            return;
        }
        miniKawarpCanvas.style.display = "block";
        try {
            const Renderer = await loadKawarpRenderer();
            if (!miniKawarpBackground) {
                miniKawarpBackground = new Renderer(miniKawarpCanvas, {
                    warpIntensity: kawarpSettings.kawarpWarpIntensity,
                    blurPasses: kawarpSettings.kawarpBlurPasses,
                    animationSpeed: kawarpSettings.kawarpAnimationSpeed,
                    transitionDuration: kawarpSettings.kawarpTransitionDuration,
                    saturation: kawarpSettings.kawarpSaturation,
                    dithering: kawarpSettings.kawarpDithering,
                    scale: kawarpSettings.scale,
                    fpsCap: loopPreferences.kawarpFpsCap,
                    fpsLogging: loopPreferences.kawarpFpsLogging,
                });
                miniKawarpBackground.start();
            } else {
                miniKawarpBackground.setOptions({
                    warpIntensity: kawarpSettings.kawarpWarpIntensity,
                    blurPasses: kawarpSettings.kawarpBlurPasses,
                    animationSpeed: kawarpSettings.kawarpAnimationSpeed,
                    transitionDuration: kawarpSettings.kawarpTransitionDuration,
                    saturation: kawarpSettings.kawarpSaturation,
                    dithering: kawarpSettings.kawarpDithering,
                    scale: kawarpSettings.scale,
                    fpsCap: loopPreferences.kawarpFpsCap,
                    fpsLogging: loopPreferences.kawarpFpsLogging,
                });
            }
            if (artworkURL && artworkURL !== miniKawarpArtwork) {
                miniKawarpArtwork = artworkURL;
                await miniKawarpBackground.loadImage(artworkURL);
            }
        } catch (error) {
            console.warn("[loop.mp3] Could not initialize PiP Kawarp:", error);
            miniKawarpCanvas.style.display = "none";
        }
    };
    const mediaListeners = new Map();
    let connectedMedia;
    const sync = (media = getCurrentMedia()) => {
        const loop = document.querySelector("#loop");
        const empty = !loop || loop.classList.contains("loop-empty");
        const artworkURL = loop?.querySelector("#loop-artwork")?.src || getFallbackArtwork();
        nodes.artwork.src = artworkURL;
        updateMiniKawarp(artworkURL);
        nodes.title.textContent = empty ? "Nothing playing" : loop.querySelector("#loop-track-title")?.textContent.trim() || "Unknown track";
        nodes.artist.textContent = empty ? "Search something to play" : loop.querySelector("#loop-track-artist")?.textContent.trim() || "Unknown artist";
        const album = !empty && loopPreferences.showAlbum
            ? loop.querySelector("#loop-track-album")?.textContent.trim() || ""
            : undefined;
        nodes.album.textContent = album ?? "";
        nodes.play.disabled = !media;
        nodes.seek.disabled = !media;
        nodes.play.innerHTML = media && !media.paused ? "&#9208;" : "&#9654;";
        nodes.play.setAttribute("aria-label", media && !media.paused ? "Pause" : "Play");
        nodes.play.title = media && !media.paused ? "Pause" : "Play";
        nodes.seek.max = media && Number.isFinite(media.duration) ? String(media.duration) : "0";
        nodes.seek.value = media && Number.isFinite(media.currentTime) ? String(media.currentTime) : "0";
        nodes.currentTime.textContent = formatTime(media?.currentTime);
        nodes.duration.textContent = formatTime(media?.duration);
    };
    const connectMedia = (media) => {
        if (connectedMedia === media) return;
        if (connectedMedia) (mediaListeners.get(connectedMedia) || []).forEach(([name, fn]) => connectedMedia.removeEventListener(name, fn));
        connectedMedia = media;
        if (!media) return;
        const fn = () => sync(media);
        const listeners = ["timeupdate", "durationchange", "loadedmetadata", "play", "pause", "ended"].map((name) => {
            media.addEventListener(name, fn);
            return [name, fn];
        });
        mediaListeners.set(media, listeners);
    };
    miniPlayerBridge = {
        sync(media) { connectMedia(media); sync(media); },
        setTheme(nextTheme) { pipWindow.document.documentElement.dataset.theme = nextTheme || "default"; },
        syncEffects() { updateMiniKawarp(miniKawarpArtwork); },
        destroy() {
            connectMedia(null);
            miniKawarpBackground?.dispose();
            miniKawarpBackground = undefined;
            miniPlayerBridge = undefined;
        },
    };
    nodes.play.addEventListener("click", () => { togglePlayback(); sync(); });
    nodes.previous.addEventListener("click", () => { playPreviousTrack(); window.setTimeout(sync, 150); });
    nodes.next.addEventListener("click", () => { playNextTrack(); window.setTimeout(sync, 150); });
    nodes.seek.addEventListener("input", seekTrack);
    sync();
    pipWindow.addEventListener("pagehide", () => {
        miniPlayerBridge?.destroy();
        console.log("[loop.mp3] closed pip");
        showLoopNotification("Closed miniplayer");
    });
}

async function DisableScreen() {
    const supported = await Promise.race([
        isSleepSupported(),
        new Promise((resolve) => window.setTimeout(() => resolve(false), 1000)),
    ]);

    if (!supported) {
        showLoopNotification(
            "Sleep not supported on your platform",
            3000
        );
        return;
    }

    window.postMessage({
        source: "loop.mp3",
        type: "loop:screen-off",
    }, "*");
    showLoopNotification(
        "Screen put to sleep",
        3000
    );
}

function isSleepSupported() {
    return new Promise((resolve) => {
        function handler(event) {
            if (
                event.source !== window ||
                event.data?.source !== "loop.mp3" ||
                event.data?.type !== "loop:is-screen-off-supported-response"
            ) {
                return;
            }

            window.removeEventListener("message", handler);
            resolve(event.data.supported);
        }

        window.addEventListener("message", handler);

        window.postMessage({
            source: "loop.mp3",
            type: "loop:is-screen-off-supported"
        }, "*");
    });
}

function triggerYTMAction(action) {
    const button = findYTMActionButton(action);
    if (button) {
        button.click();
        scheduleTrackFeedbackSync();
        return;
    }
    console.warn(`[loop.mp3] Could not find YouTube Music ${action} button.`);
}

let feedbackSyncTimers = [];

function scheduleTrackFeedbackSync() {
    if (feedbackSyncTimers.length) return;

    const delays = [100, 300, 800, 1500, 2500];

    feedbackSyncTimers = delays.map((delay, index) =>
        window.setTimeout(() => {
            syncTrackFeedbackState();

            if (index === delays.length - 1) {
                feedbackSyncTimers = [];
            }
        }, delay)
    );
}

function syncTrackFeedbackState() {
    const likeButton = document.querySelector("#loop-like-button");
    const dislikeButton = document.querySelector("#loop-dislike-button");
    if (!likeButton || !dislikeButton) return;

    for (const [action, dockButton] of [["like", likeButton], ["dislike", dislikeButton]]) {
        const ytmButton = findYTMActionButton(action);
        const likeRenderer = ytmButton?.closest("ytmusic-like-button-renderer");
        const playerPage = document.querySelector("ytmusic-player-page");
        const playerBar = playerPage?.querySelector("ytmusic-player-bar") ||
            document.querySelector("ytmusic-player-bar");
        const statusSources = [likeRenderer, playerBar, playerPage, ytmButton].filter(Boolean);
        const rendererStatus = statusSources
            .map((source) => source.getAttribute("like-status") ||
                source.getAttribute("data-like-status") ||
                source.getAttribute("data-status"))
            .find(Boolean)?.toLowerCase();
        const actionContainer = ytmButton?.closest(
            "#button-shape-like, #button-shape-dislike, .like, .dislike"
        );
        const buttonPressed = [ytmButton, actionContainer, likeRenderer]
            .some((source) => source?.getAttribute("aria-pressed") === "true");
        const label = [
            ytmButton?.getAttribute("aria-label"),
            ytmButton?.getAttribute("title"),
        ].filter(Boolean).join(" ").toLowerCase();
        const isActive = rendererStatus === action ||
            buttonPressed ||
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

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.bindLoopRecordEvents = bindLoopRecordEvents;
    global.ensureLoopRecordButton = ensureLoopRecordButton;
    global.openMiniPlayerLegacy = openMiniPlayerLegacy;
    global.openMiniPlayer = openMiniPlayer;
    global.DisableScreen = DisableScreen;
    global.isSleepSupported = isSleepSupported;
    global.triggerYTMAction = triggerYTMAction;
    global.scheduleTrackFeedbackSync = scheduleTrackFeedbackSync;
    global.syncTrackFeedbackState = syncTrackFeedbackState;
    global.warnIfNotSignedIn = warnIfNotSignedIn;
    Object.defineProperty(global, 'miniPlayerBridge', { configurable: true, get: () => miniPlayerBridge, set: (value) => { miniPlayerBridge = value; } });
    Object.defineProperty(global, 'feedbackSyncTimers', { configurable: true, get: () => feedbackSyncTimers, set: (value) => { feedbackSyncTimers = value; } });
})(globalThis);
