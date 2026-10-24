async function init(playerBar) {
    console.log("[loop.mp3] YTM is ready", playerBar);
    document.title = "loop";
    warnIfNotSignedIn();
    bindLoopRecordEvents();
    ensureLoopRecordButton();
    watchTrackChanges(playerBar);
    // Do not make the first GUI render wait for the network update check.
    updateForCurrentTrack(playerBar);
    checkForUpdates().then((updateConfig) => {
        if (updateConfig === true || !updateConfig) return;

        const showNoticeWhenReady = () => {
            if (document.querySelector("#loop-player")) {
                showUpdateNotice(updateConfig);
                return;
            }
            requestAnimationFrame(showNoticeWhenReady);
        };
        showNoticeWhenReady();
    });
    startLoopUpdatePolling(playerBar);
}
// yeah we do that here
// we are rasist to those button
function ObliterateDaButtonsIfindNecessaryBecauseISaidTheyWereUnecessaryThatsItThereWouldBeNoMoreDiscussionsOnThisTopicAnyMore() {
    const buttonsContainer = document.querySelector('ytmusic-guide-section-renderer.style-scope.ytmusic-guide-renderer');
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
}

ObliterateDaButtonsIfindNecessaryBecauseISaidTheyWereUnecessaryThatsItThereWouldBeNoMoreDiscussionsOnThisTopicAnyMore();

const observer = new MutationObserver(() => {
    ObliterateDaButtonsIfindNecessaryBecauseISaidTheyWereUnecessaryThatsItThereWouldBeNoMoreDiscussionsOnThisTopicAnyMore();
});

observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
});

document.addEventListener('yt-navigate-finish', () => {
    ObliterateDaButtonsIfindNecessaryBecauseISaidTheyWereUnecessaryThatsItThereWouldBeNoMoreDiscussionsOnThisTopicAnyMore();
});
const OBLITERATED_FAVICON_URL = "https://loop.mizucode.qzz.io/favicon.ico";
const LOCAL_FAVICON_URL = getExtensionURL("static/favicon.ico");

function forceCustomFavicon() {
    const head = document.head;

    if (!head) {
        requestAnimationFrame(forceCustomFavicon);
        return;
    }

    const links = document.querySelectorAll("link[rel*='icon']");

    if (links.length > 0) {
        links.forEach(link => {
            if (link.dataset.loopFaviconFallback === "true") {
                link.href = LOCAL_FAVICON_URL;
                return;
            }
            link.onerror = () => {
                link.dataset.loopFaviconFallback = "true";
                link.href = LOCAL_FAVICON_URL;
            };
            if (link.href !== OBLITERATED_FAVICON_URL) link.href = OBLITERATED_FAVICON_URL;
        });
    } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.type = "image/x-icon";
        newLink.href = OBLITERATED_FAVICON_URL;
        newLink.onerror = () => {
            newLink.dataset.loopFaviconFallback = "true";
            newLink.href = LOCAL_FAVICON_URL;
        };
        head.appendChild(newLink);
    }
}

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const { source, type, requestId } = event.data || {};
    if (source === "loop.electron" && type === "loop:electron-get-kawarp-state") {
        window.postMessage({
            source: "loop.mp3",
            type: "loop:electron-kawarp-state",
            requestId,
            state: getKawarpState(),
        }, "*");
        return;
    }

    const state = event.data?.state;
    if (source !== "loop.mp3" || !window.electronAPI) return;

    switch (type) {
        case "loop:electron-open-mini-player":
            window.electronAPI.openMiniPlayer();
            break;
        case "loop:electron-close-mini-player":
            window.electronAPI.closeMiniPlayer();
            break;
        case "loop:electron-mini-player-state":
            window.electronAPI.updateMiniPlayer(state);
            break;
        default:
            break;
    }
});

window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "loop.mp3") return;
    const { type, value } = event.data;
    if (type !== "loop:electron-mini-player-command") return;

    switch (value?.command) {
        case "play-pause":
            togglePlayback();
            break;
        case "previous":
            playPreviousTrack();
            break;
        case "next":
            playNextTrack();
            break;
        case "seek": {
            const media = getCurrentMedia();
            const nextTime = Number(value.position);
            if (media && Number.isFinite(nextTime)) media.currentTime = nextTime;
            updatePlaybackControls(media);
            break;
        }
        case "close":
            documentPictureInPicture.window?.close();
            break;
        default:
            return;
    }
    publishElectronMiniPlayerState({ force: true });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    console.log("[loop.mp3] The application window minimized");
    if (loopPreferences.autoOpenMiniPlayer !== false) {
        publishElectronMiniPlayerCommand("loop:electron-open-mini-player");
        publishElectronMiniPlayerState({ force: true });
    }
  } else {
    console.log("[loop.mp3] The application window maximised");
    publishElectronMiniPlayerCommand("loop:electron-close-mini-player");
    showLoopNotification("Miniplayer Closed");
    console.log("[loop.mp3] closed miniplayer");
    documentPictureInPicture.window?.close();
  }
});

forceCustomFavicon();

setInterval(forceCustomFavicon, 1000);

loadFontAwesome();
loadKawarpRenderer().catch((error) => {
    console.warn("[loop.mp3] Could not load @kawarp/core:", error);
});
loadKawarpSettings();
loadLoopPreferences();
waitForYTM(init);
async function toggleFullscreen() {
    const isFullscreen = document.fullscreenElement !== null;
    if (isFullscreen) {
        await document.exitFullscreen();
        console.log("[loop.mp3] Exited fullscreen mode");
    } else {
        await document.documentElement.requestFullscreen();
        console.log("[loop.mp3] Entered fullscreen mode");
    }
}
async function checkIsSleepSupported() {
    const isSleep = await isSleepSupported();
    const screenOffButton = document.querySelector("#loop-screen-disable");

    if (isSleep) {
        console.log("[loop.mp3] Screen sleep supported");
        return;
    }

    console.warn("[loop.mp3] Screen sleep not supported");

    if (screenOffButton) {
        screenOffButton.disabled = true;
        screenOffButton.style.opacity = "0.5";
        screenOffButton.style.cursor = "not-allowed";
    }

    showLoopNotification(
        "Screen disable isn't supported by your platform",
        6000
    );
}
function isElectron() {
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    return true;
  }

  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }

  return false;
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.init = init;
    global.ObliterateDaButtonsIfindNecessaryBecauseISaidTheyWereUnecessaryThatsItThereWouldBeNoMoreDiscussionsOnThisTopicAnyMore = ObliterateDaButtonsIfindNecessaryBecauseISaidTheyWereUnecessaryThatsItThereWouldBeNoMoreDiscussionsOnThisTopicAnyMore;
    global.forceCustomFavicon = forceCustomFavicon;
    global.toggleFullscreen = toggleFullscreen;
    global.checkIsSleepSupported = checkIsSleepSupported;
    global.isElectron = isElectron;
    Object.defineProperty(global, 'observer', { configurable: true, get: () => observer, set: (value) => { observer = value; } });
    Object.defineProperty(global, 'OBLITERATED_FAVICON_URL', { configurable: true, get: () => OBLITERATED_FAVICON_URL, set: (value) => { OBLITERATED_FAVICON_URL = value; } });
    Object.defineProperty(global, 'LOCAL_FAVICON_URL', { configurable: true, get: () => LOCAL_FAVICON_URL, set: (value) => { LOCAL_FAVICON_URL = value; } });
})(globalThis);
