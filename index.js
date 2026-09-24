function waitForYTM(callback) {
    const check = () => {
        const playerBar = document.querySelector("ytmusic-player-bar");
        if (playerBar) return callback(playerBar);
        requestAnimationFrame(check);
    };
    check();
}

function getCurrentTrackId(playerBar) {
    const playerTrackLink = playerBar?.querySelector(
        'a[href*="watch?v="], a[href*="youtu.be/"]'
    );
    if (playerTrackLink) {
        try {
            const url = new URL(playerTrackLink.href, location.href);
            const trackId = url.searchParams.get("v") || url.pathname.split("/").pop();
            if (trackId) return trackId;
        } catch {
        }
    }
    return new URL(location.href).searchParams.get("v");
}

function getFallbackArtwork() {
    return getExtensionURL("static/fallback-artwork.png");
}

function getVinylArtwork(trackId) {
    return trackId ? `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg` : getFallbackArtwork();
}

function getPlayerBarArtwork(playerBar) {
    const artwork = [...(playerBar?.querySelectorAll("img") || [])].find((image) => {
        const source = image.currentSrc || image.src || "";
        return source && !source.includes("ytmusic-logo") && !source.includes("favicon");
    });
    return artwork?.currentSrc || artwork?.src || "";
}

function getCurrentArtwork(playerBar, trackId) {
    return trackId
        ? getVinylArtwork(trackId)
        : getPlayerBarArtwork(playerBar) || currentArtworkURL || getFallbackArtwork();
}

let lastDiscordUpdate = 0;
let lastDiscordSignature = "";

function publishDiscordActivity({ force = false } = {}) {
    const loop = document.getElementById("loop");
    const media = getCurrentMedia();
    const title = loop?.querySelector("#loop-track-title")?.textContent.trim() || "";
    const artist = loop?.querySelector("#loop-track-artist")?.textContent.trim() || "";
    const album = loop?.querySelector("#loop-track-album")?.textContent.trim() || "";
    const artwork = loop?.querySelector("#loop-artwork")?.src || "";
    const now = Date.now();

    if (!loop || loop.classList.contains("loop-empty") || !title || !artist || !media) {
        if (!force && now - lastDiscordUpdate < 1000 && lastDiscordSignature === "clear") return;
        lastDiscordUpdate = now;
        lastDiscordSignature = "clear";
        window.postMessage({
            source: "loop.mp3",
            type: "discord-rpc:clear",
        }, "*");
        return;
    }

    const duration = Number(media.duration);
    const position = Number(media.currentTime);
    const signature = `${title}|${artist}|${album}|${artwork}|${media.paused}|${Math.floor(position)}`;
    if (!force && now - lastDiscordUpdate < 1000 && signature === lastDiscordSignature) return;
    lastDiscordUpdate = now;
    lastDiscordSignature = signature;

    const activity = {
        details: "Listening to Loop",
        state: title,
        largeImageKey: artwork,
        largeImageText: artist,
    };
    if (!media.paused && Number.isFinite(duration) && duration > 0) {
        const startTimestamp = now - Math.floor(position * 1000);
        activity.startTimestamp = startTimestamp;
        activity.endTimestamp = startTimestamp + Math.floor(duration * 1000);
    }

    window.postMessage({
        source: "loop.mp3",
        type: "discord-rpc:update",
        activity,
    }, "*");
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

function isUserSignedIn() {
    const signInButton = document.querySelector('button[aria-label="Sign in"]');
    return signInButton ? false : true;
}

async function checkYTMusicAuth() {
    try {
        return isUserSignedIn();
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
    hideVinyl: true,
    hideArtwork: false,
    showNavigationButtons: false,
    theme: "default",
};
let currentArtworkURL = "";
let kawarpRendererClass;
let kawarpRendererPromise;
let kawarpWarningTimer;
let notificationTimer;
let notificationAnimationTimer;
let notificationAnimationFrame;
let authWarningShown = false;
let loopUpdateBlocked = false;
let loopVisible = false;

const loopPreferencesKey = "loop.mp3.preferences";
const kawarpConfigKey = "loop.mp3.kawarp-config";
const kawarpCustomPresetsKey = "loop.mp3.kawarp-custom-presets";
const defaultUpdateURL = "https://loop.mizucode.qzz.io/update";

function getUpdateURL() {
    return defaultUpdateURL;
}

function openUpdateInBrowser(event, updateURL) {
    const isElectron = /Electron/i.test(navigator.userAgent) ||
        Boolean(globalThis.process?.versions?.electron);
    if (!isElectron) return;

    // Electron clients commonly handle window.open as an external browser
    // request. Keep the normal anchor fallback if that handler is absent.
    event.preventDefault();
    const browserWindow = window.open(updateURL, "_blank", "noopener,noreferrer");
    if (!browserWindow) window.location.assign(updateURL);
}

function showUpdateNotice(config) {
    const loopPlayer = document.querySelector("#loop-player");
    if (!loopPlayer || document.getElementById("loop-update-notice")) return;

    const notice = document.createElement("aside");
    notice.id = "loop-update-notice";
    notice.setAttribute("role", "status");

    const message = document.createElement("span");
    message.textContent = config.update_notice || "A new Loop update is available.";
    const link = document.createElement("a");
    const updateURL = getUpdateURL();
    link.href = updateURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Download the update";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "loop-update-notice-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss update notice");
    dismiss.textContent = "×";
    notice.append(message, link, dismiss);
    loopPlayer.prepend(notice);

    link.addEventListener("click", (event) => openUpdateInBrowser(event, updateURL));
    dismiss.addEventListener("click", (event) => {
        event.stopPropagation();
        notice.remove();
    });
}

function showRequiredUpdateBlocker(config) {
    if (document.getElementById("loop-required-update")) return;

    const blocker = document.createElement("div");
    blocker.id = "loop-required-update";
    blocker.setAttribute("role", "alertdialog");
    blocker.setAttribute("aria-modal", "true");

    const title = document.createElement("h1");
    title.textContent = "Loop needs an update";
    const message = document.createElement("p");
    message.textContent = config.update_notice ||
        "This version of Loop is no longer supported. Update to continue.";
    const link = document.createElement("a");
    const updateURL = getUpdateURL();
    link.href = updateURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Download the update";
    blocker.append(title, message, link);
    link.addEventListener("click", (event) => openUpdateInBrowser(event, updateURL));
    (document.body || document.documentElement).appendChild(blocker);
}

function getInstalledVersion() {
    try {
        const runtime = globalThis.chrome?.runtime || globalThis.browser?.runtime;
        return runtime?.getManifest?.().version || "0.0.0";
    } catch {
        return "0.0.0";
    }
}

function compareVersions(left, right) {
    const parse = (version) => String(version).split(".").map((part) => {
        const match = part.match(/^\d+/);
        return match ? Number(match[0]) : 0;
    });
    const leftParts = parse(left);
    const rightParts = parse(right);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
        const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
        if (difference !== 0) return difference > 0 ? 1 : -1;
    }
    return 0;
}

async function checkForUpdates() {
    try {
        const response = await fetch("https://loop.mizucode.qzz.io/config.json", {
            cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const config = await response.json();
        if (!config || typeof config !== "object") return false;

        // A notice is only meaningful when the server advertises a newer
        // version. This prevents arbitrary update_notice text from becoming
        // a false alert while the installed version is already current.
        if (!config.version || compareVersions(config.version, getInstalledVersion()) <= 0) {
            return false;
        }

        const updateRequired = Number(config.is_update_required) === 1;
        if (updateRequired) {
            showRequiredUpdateBlocker(config);
            loopUpdateBlocked = true;
            return true;
        }

        return config;
    } catch (error) {
        console.warn("[loop.mp3] update check failed:", error);
        return null;
    }
}

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
    applyLoopTheme();
    loop.classList.toggle("loop-no-vinyl", loopPreferences.hideVinyl);
    const vinylToggle = loop.querySelector("#loop-vinyl-toggle");
    if (vinylToggle) vinylToggle.checked = loopPreferences.hideVinyl;
    const navigationToggle = loop.querySelector("#loop-navigation-toggle");
    if (navigationToggle) navigationToggle.checked = Boolean(loopPreferences.showNavigationButtons);
    setTrackNavigationButtonsVisible(Boolean(loopPreferences.showNavigationButtons));
    applyArtworkPreference();
}

function applyArtworkPreference() {
    const loop = document.querySelector("#loop");
    const artwork = loop?.querySelector("#loop-artwork");
    if (!artwork) return;

    const displayedArtwork = loopPreferences.hideArtwork || loop.classList.contains("loop-empty")
        ? getFallbackArtwork()
        : currentArtworkURL || getFallbackArtwork();
    artwork.src = displayedArtwork;
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

function returnToLoopUI(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const playerBar = document.querySelector("ytmusic-player-bar");
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
    syncRecordMotion();
}

let loopRecordEventsBound = false;

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
        recordButton.title = "Open Loop";
        recordButton.innerHTML = '<i class="fa-solid fa-record-vinyl" aria-hidden="true"></i>';
    }
    castButton.insertAdjacentElement("beforebegin", recordButton);
}

function DisableScreen() {
    console.warn("[loop.mp3] Screen request send if not acknowledged then the ipc bridge is not avilable meaning you are not using the app")
    window.postMessage({
        source: "loop.mp3",
        type: "loop:screen-off",
    }, "*");
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
        kawarpRendererPromise = import(getExtensionURL("modules/kawarp.js"))
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
        const savedConfig = getStoredKawarpConfig();
        applyKawarpSettings((savedConfig || config).settings || savedConfig || config);
    } catch (error) {
        console.warn("[loop.mp3] Could not load Kawarp settings:", error);
    }
}

function getStoredKawarpConfig() {
    try {
        const storedConfig = JSON.parse(localStorage.getItem(kawarpConfigKey) || "null");
        return storedConfig && typeof storedConfig === "object" ? storedConfig : null;
    } catch {
        return null;
    }
}

function getStoredKawarpPresets() {
    try {
        const storedPresets = JSON.parse(localStorage.getItem(kawarpCustomPresetsKey) || "{}");
        return storedPresets && typeof storedPresets === "object" && !Array.isArray(storedPresets)
            ? storedPresets
            : {};
    } catch {
        return {};
    }
}

function saveStoredKawarpPresets(presets) {
    localStorage.setItem(kawarpCustomPresetsKey, JSON.stringify(presets));
}

async function deleteKawarpPreset(presetName, modal, status) {
    const customPresets = getStoredKawarpPresets();
    if (!Object.prototype.hasOwnProperty.call(customPresets, presetName)) return;
    delete customPresets[presetName];
    saveStoredKawarpPresets(customPresets);
    status.textContent = `${presetName} deleted.`;
    await loadKawarpPresets(modal, status);
}

function requestKawarpPresetDetails(defaultName) {
    return new Promise((resolve) => {
        const modal = document.createElement("div");
        modal.className = "loop-kawarp-preset-details-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "loop-kawarp-preset-details-title");
        modal.innerHTML = `
            <form class="loop-kawarp-preset-details-card">
                <div class="loop-kawarp-preset-details-header">
                    <div>
                        <h2 id="loop-kawarp-preset-details-title">Save custom preset</h2>
                        <p>Give this config a name and credit its author.</p>
                    </div>
                    <button type="button" class="loop-kawarp-preset-details-close" aria-label="Close">&#215;</button>
                </div>
                <label class="loop-kawarp-preset-details-field">
                    <span>Preset name</span>
                    <input class="loop-kawarp-preset-name" type="text" maxlength="80" required>
                </label>
                <label class="loop-kawarp-preset-details-field">
                    <span>Author</span>
                    <input class="loop-kawarp-preset-author" type="text" maxlength="80" value="Custom" required>
                </label>
                <div class="loop-kawarp-preset-details-error" role="alert" aria-live="polite"></div>
                <div class="loop-kawarp-preset-details-actions">
                    <button type="button" class="loop-kawarp-preset-details-cancel">Cancel</button>
                    <button type="submit" class="loop-kawarp-preset-details-save">Save and apply</button>
                </div>
            </form>`;
        (document.getElementById("loop") || document.body).appendChild(modal);

        const form = modal.querySelector(".loop-kawarp-preset-details-card");
        const nameInput = modal.querySelector(".loop-kawarp-preset-name");
        const authorInput = modal.querySelector(".loop-kawarp-preset-author");
        const error = modal.querySelector(".loop-kawarp-preset-details-error");
        nameInput.value = defaultName;

        const close = (details = null) => {
            modal.remove();
            resolve(details);
        };
        modal.querySelector(".loop-kawarp-preset-details-close").addEventListener("click", () => close());
        modal.querySelector(".loop-kawarp-preset-details-cancel").addEventListener("click", () => close());
        modal.addEventListener("click", (event) => {
            if (event.target === modal) close();
        });
        modal.addEventListener("keydown", (event) => {
            if (event.key === "Escape") close();
        });
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const name = nameInput.value.trim();
            const author = authorInput.value.trim();
            if (!name || !author) {
                error.textContent = "Enter both a preset name and an author.";
                return;
            }
            close({ name, author });
        });
        nameInput.focus();
        nameInput.select();
    });
}

async function loadKawarpPreset(presetName, presetPath, status) {
    try {
        let config = presetPath;
        if (typeof presetPath === "string") {
            const response = await fetch(getExtensionURL(`config/presets/${presetPath}`));
            if (!response.ok) throw new Error(`${presetPath} returned ${response.status}`);
            config = await response.json();
        }
        const settings = config.settings && typeof config.settings === "object"
            ? config.settings
            : config;
        if (!settings || Array.isArray(settings)) {
            throw new Error("The preset must contain a settings object.");
        }
        applyKawarpSettings(settings);
        localStorage.setItem(kawarpConfigKey, JSON.stringify({
            version: config.version || "2.0",
            settings,
        }));
        status.textContent = `${presetName} preset loaded and applied.`;
    } catch (error) {
        status.textContent = `Could not load ${presetName}: ${error.message}`;
    }
}

async function loadKawarpPresets(modal, status) {
    const presetList = modal.querySelector(".loop-kawarp-config-presets");
    try {
        const response = await fetch(getExtensionURL("config/presets/manifest.json"));
        if (!response.ok) throw new Error(`manifest.json returned ${response.status}`);
        const presets = await response.json();
        if (!presets || typeof presets !== "object" || Array.isArray(presets)) {
            throw new Error("The preset manifest must be an object.");
        }
        const customPresets = getStoredKawarpPresets();
        const allPresets = { ...presets, ...customPresets };

        presetList.replaceChildren(...Object.entries(allPresets).map(([name, path]) => {
            const row = document.createElement("div");
            row.className = "loop-kawarp-config-preset-row";

            const loadButton = document.createElement("button");
            loadButton.type = "button";
            loadButton.className = "loop-kawarp-config-preset-load";
            loadButton.textContent = name;
            loadButton.addEventListener("click", () => loadKawarpPreset(name, path, status));
            row.appendChild(loadButton);

            if (Object.prototype.hasOwnProperty.call(customPresets, name)) {
                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "loop-kawarp-config-preset-delete";
                deleteButton.setAttribute("aria-label", `Delete ${name}`);
                deleteButton.title = "Delete preset";
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => deleteKawarpPreset(name, modal, status));
                row.appendChild(deleteButton);
            }
            return row;
        }));
    } catch (error) {
        presetList.textContent = `Could not load presets: ${error.message}`;
    }
}

function showKawarpConfigEditor() {
    const existingModal = document.getElementById("loop-kawarp-config-modal");
    if (existingModal) return;

    const modal = document.createElement("div");
    modal.id = "loop-kawarp-config-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-kawarp-config-title");
    modal.innerHTML = `
        <div class="loop-kawarp-config-card">
            <div class="loop-kawarp-config-header">
                <div>
                    <h2 id="loop-kawarp-config-title">Kawarp config Settings</h2>
                    <p>Load any kawarp json config to customise the look of your kwarp baground</p>
                </div>
                <button type="button" class="loop-kawarp-config-close" aria-label="Close config editor">&#215;</button>
            </div>
            <input class="loop-kawarp-config-file" type="file" accept=".json,application/json" hidden>
            <div class="loop-kawarp-config-presets-heading">Presets</div>
            <div class="loop-kawarp-config-presets" aria-label="Kawarp presets">
                <span class="loop-kawarp-config-presets-loading">Loading presets...</span>
            </div>
            <div class="loop-kawarp-config-status" role="status" aria-live="polite"></div>
            <div class="loop-kawarp-config-actions">
                <a href="https://github.com/loop-mp3/loop/blob/main/config/config.md" target="_blank" rel="noopener noreferrer">How do i make my own config?</a>
                <span class="loop-kawarp-config-spacer"></span>
                <button type="button" class="loop-kawarp-config-reset">Reset</button>
                <button type="button" class="loop-kawarp-config-upload">Add Custom Config File</button>
                <button type="button" class="loop-kawarp-config-cancel">Cancel</button>
            </div>
        </div>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const status = modal.querySelector(".loop-kawarp-config-status");
    const fileInput = modal.querySelector(".loop-kawarp-config-file");
    loadKawarpPresets(modal, status);

    const close = () => modal.remove();
    modal.querySelector(".loop-kawarp-config-close").addEventListener("click", close);
    modal.querySelector(".loop-kawarp-config-cancel").addEventListener("click", close);
    modal.querySelector(".loop-kawarp-config-reset").addEventListener("click", () => {
        applyKawarpSettings({ ...defaultKawarpSettings });
        localStorage.removeItem(kawarpConfigKey);
        status.textContent = "Default config restored.";
    });
    modal.querySelector(".loop-kawarp-config-upload").addEventListener("click", () => fileInput.click());
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
            const config = JSON.parse(await file.text());
            if (!config || typeof config !== "object" || Array.isArray(config)) {
                throw new Error("The config must be a JSON object.");
            }
            const details = await requestKawarpPresetDetails(
                file.name.replace(/\.json$/i, "").trim()
            );
            if (!details) {
                status.textContent = "Upload cancelled.";
                return;
            }
            const settings = config.settings && typeof config.settings === "object"
                ? config.settings
                : config;
            if (!settings || Array.isArray(settings)) {
                throw new Error("The config must contain a settings object.");
            }
            const displayName = `${details.name} by ${details.author}`;
            const customPresets = getStoredKawarpPresets();
            customPresets[displayName] = {
                version: config.version || "2.0",
                settings,
            };
            saveStoredKawarpPresets(customPresets);
            applyKawarpSettings(settings);
            localStorage.setItem(kawarpConfigKey, JSON.stringify({
                version: config.version || "2.0",
                settings,
            }));
            status.textContent = `${displayName} saved and applied.`;
            await loadKawarpPresets(modal, status);
        } catch (error) {
            status.textContent = error instanceof SyntaxError
                ? "Invalid JSON. Check the selected file."
                : error.message;
        }
    });
    modal.querySelector(".loop-kawarp-config-upload").focus();
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
    if (enabled) showKawarpWarning();
}

function showKawarpWarning() {
    const warning = document.querySelector("#loop-kawarp-warning");
    if (!warning) return;

    window.clearTimeout(kawarpWarningTimer);
    warning.hidden = false;
    kawarpWarningTimer = window.setTimeout(() => {
        warning.hidden = true;
    }, 6000);
    showLoopNotification(
        "Kawarp enabled: higher GPU usage may reduce battery life.",
        6000
    );
}

function showLoopNotification(message, duration = 6000) {
    const toast = document.querySelector("#loop-kawarp-toast");
    const messageNode = toast?.querySelector(".loop-notification-message");
    const progress = toast?.querySelector(".loop-notification-progress");
    const closeButton = toast?.querySelector(".loop-notification-close");
    if (!toast || !messageNode || !progress || !closeButton) return;

    window.clearTimeout(notificationTimer);
    window.clearTimeout(notificationAnimationTimer);
    window.cancelAnimationFrame(notificationAnimationFrame);
    messageNode.textContent = message;
    toast.style.setProperty("--loop-notification-duration", `${duration}ms`);
    toast.hidden = false;
    toast.classList.remove("loop-notification-visible");
    progress.style.animation = "none";
    closeButton.onclick = () => dismissLoopNotification();

    notificationAnimationFrame = requestAnimationFrame(() => {
        notificationAnimationFrame = undefined;
        toast.classList.add("loop-notification-visible");
        progress.style.animation = "loop-notification-timer var(--loop-notification-duration) linear forwards";
    });
    notificationTimer = window.setTimeout(dismissLoopNotification, duration);
}

function dismissLoopNotification() {
    const toast = document.querySelector("#loop-kawarp-toast");
    if (!toast) return;

    window.clearTimeout(notificationTimer);
    window.cancelAnimationFrame(notificationAnimationFrame);
    notificationAnimationFrame = undefined;
    toast.classList.remove("loop-notification-visible");
    notificationAnimationTimer = window.setTimeout(() => {
        toast.hidden = true;
    }, 220);
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
        artistUrl: links[0]?.href || "",
        album: links.length >= 2 ? links[links.length - 1].textContent.trim() : "Unknown album",
        albumUrl: links.length >= 2 ? links[links.length - 1].href : "",
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
            title: liveInfo.title !== "Unknown title" ? liveInfo.title : details.title || domInfo.title,
            artist: liveInfo.artist !== "Unknown artist" ? liveInfo.artist : details.author_name || domInfo.artist,
            artistUrl: liveInfo.artistUrl || domInfo.artistUrl,
            album: liveInfo.album || domInfo.album,
            albumUrl: liveInfo.albumUrl || domInfo.albumUrl,
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
    loopVisible = false;
    if (!getCurrentTrackId()) emptyScreenDismissed = true;
    restoreYTMSearch();
    document.title = "loop";
    console.log("[loop.mp3] Loop removed, back to normal YTM");
}

function updateLoop(artworkURL, trackInfo) {
    loopVisible = true;
    let loop = document.getElementById("loop");
    if (!loop) {
        loop = document.createElement("div");
        loop.id = "loop";
        loop.innerHTML = `
            <div id="loop-player">
                <button id="loop-back-button" type="button" aria-label="Return to YouTube Music">&#215;</button>
                <button id="loop-shortcuts-button" type="button" aria-label="Open Loop menu" title="Loop menu">?</button>
                <canvas id="loop-kawarp-background" aria-hidden="true"></canvas>
                <div id="loop-kawarp-toast" role="status" hidden>
                    <span class="loop-notification-message"></span>
                    <button class="loop-notification-close" type="button" aria-label="Dismiss notification">&#215;</button>
                    <div class="loop-notification-progress" aria-hidden="true"></div>
                </div>
                <div id="loop-shortcuts-panel" hidden>
                    <div class="loop-shortcuts-title">Loop menu</div>
                    <label class="loop-theme-picker">
                        <span>Theme</span>
                        <select id="loop-theme-select" aria-label="Choose a Loop theme">
                            <option value="default">Default</option>
                            <option value="sharp">Monochrome</option>
                            <option value="catppuccin">Catppuccin</option>
                        </select>
                    </label>
                    <div class="loop-shortcuts-heading">Shortcuts</div>
                    <div><kbd>M</kbd> Mute / unmute</div>
                    <div><kbd>Shift + P / K</kbd> Previous track</div>
                    <div><kbd>Shift + N / J</kbd> Next track</div>
                    <div><kbd>H / Shift + ←</kbd> 10 Second backward</div>
                    <div><kbd>L / Shift + →</kbd> 10 Second forward</div>
                    <div><kbd>Ctrl + K</kbd> Search</div>
                    <div><kbd>Ctrl + Q</kbd> See queue</div>
                    <div><kbd>Alt + L</kbd> Turn off screen <span>(with loop running)</span></div>
                    <div><kbd>~</kbd> Toggle Loop</div>
                    <div><kbd>Ctrl + F5</kbd> Reload Loop Session</div>
                    <div><kbd>F5</kbd> Reload Resources</div>
                    <div><kbd>Ctrl + P</kbd> Select playlists <span>(not implemented)</span></div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-navigation-toggle" type="checkbox">
                        Show previous/next buttons
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-background-toggle" type="checkbox" checked>
                        Animated artwork background <span>(re-enable)</span>
                    </label>
                    <div id="loop-kawarp-warning" class="loop-kawarp-warning" role="status" hidden>
                        Kawarp may increase GPU usage and battery drain.
                    </div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-vinyl-toggle" type="checkbox">
                        Don’t show vinyl
                    </label>
                    <button id="loop-kawarp-config-button" class="loop-menu-action" type="button">
                        Edit Kawarp shader config
                    </button>
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
                    <a id="loop-track-artist"></a>
                    <a id="loop-track-album"></a>
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
                    <button id="loop-artwork-toggle" type="button" aria-label="Hide artwork" aria-pressed="false" title="Hide artwork">
                        <i class="fa-solid fa-image" aria-hidden="true"></i>
                    </button>
                    <button id="loop-screen-disable" type="button" aria-label="power off the screen while music playing" title="Turn off screen">
                    <i class="fa-solid fa-power-off" aria-hidden="true"></i>
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
        loop.querySelector("#loop-artwork-toggle").addEventListener("click", () => {
            loopPreferences.hideArtwork = !loopPreferences.hideArtwork;
            saveLoopPreferences();
            applyLoopPreferences();
        });
        loop.querySelector("#loop-screen-disable").addEventListener("click", () => DisableScreen())
        loop.querySelector("#loop-navigation-toggle").addEventListener("change", (event) => {
            loopPreferences.showNavigationButtons = event.target.checked;
            saveLoopPreferences();
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
        loop.querySelector("#loop-theme-select").addEventListener("change", (event) => {
            loopPreferences.theme = event.target.value;
            saveLoopPreferences();
            applyLoopTheme();
        });
        loop.querySelector("#loop-kawarp-config-button").addEventListener("click", showKawarpConfigEditor);
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

    if (!trackInfo.empty && artworkURL) currentArtworkURL = artworkURL;
    artwork.src = trackInfo.empty || loopPreferences.hideArtwork
        ? getFallbackArtwork()
        : currentArtworkURL || getFallbackArtwork();
    title.textContent = trackInfo.title;
    artist.textContent = trackInfo.artist;
    artist.toggleAttribute("href", Boolean(trackInfo.artistUrl));
    if (trackInfo.artistUrl) artist.href = trackInfo.artistUrl;
    album.textContent = trackInfo.album;
    album.toggleAttribute("href", Boolean(trackInfo.albumUrl));
    if (trackInfo.albumUrl) album.href = trackInfo.albumUrl;
    loop.classList.toggle("loop-empty", Boolean(trackInfo.empty));
    emptyState.hidden = !trackInfo.empty;
    syncWindowTitle();
    syncTrackFeedbackState();
    updateKawarpArtwork(artwork.src);
    updatePlaybackControls(getCurrentMedia());
    publishDiscordActivity({ force: true });
}

let recordFrame;

function getCurrentMedia() {
    const media = [...document.querySelectorAll("video, audio")]
        .filter((element) => Number.isFinite(element.duration) && element.duration > 0);
    return media.find((element) => !element.paused && !element.ended) || media[0];
}

window.addEventListener("beforeunload", (event) => {
    const media = getCurrentMedia();
    if (!media || media.paused || media.ended) return;

    media.muted = true;
    updatePlaybackControls(media);
    showLoopNotification("Music muted. Pause playback to close Loop.");
    event.preventDefault();
    event.returnValue = "";
});

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

    if (playButton && muteButton && seek && currentTime && duration && !media) {
        playButton.textContent = "▶";
        playButton.setAttribute("aria-label", "Play");
        muteButton.textContent = "♪";
        muteButton.setAttribute("aria-label", "Mute");
        seek.value = "0";
        seek.max = "0";
        currentTime.textContent = "0:00";
        duration.textContent = "0:00";
    } else if (playButton && muteButton && seek && currentTime && duration && media) {
        playButton.textContent = media.paused ? "▶" : "⏸";
        playButton.setAttribute("aria-label", media.paused ? "Play" : "Pause");
        muteButton.textContent = media.muted ? "♩" : "♪";
        muteButton.setAttribute("aria-label", media.muted ? "Unmute" : "Mute");
        seek.max = Number.isFinite(media.duration) ? String(media.duration) : "0";
        seek.value = Number.isFinite(media.currentTime) ? String(media.currentTime) : "0";
        currentTime.textContent = formatTime(media.currentTime);
        duration.textContent = formatTime(media.duration);
    }
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
    sendYTMShortcut("N", true);
}

function playNextTrack() {
    sendYTMShortcut("P", true);
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
        const currentPlayerBar = document.querySelector("ytmusic-player-bar");
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
    const currentPlayerBar = document.querySelector("ytmusic-player-bar") || playerBar;
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
        return;
    }

    lastTrackId = trackId;
    lastTrackKey = trackSignature;
    const requestId = ++metadataRequest;
    updateLoop(artworkURL, liveTrackInfo);
    syncRecordMotion();
    const trackInfo = await getTrackInfoFromTrackId(trackId, currentPlayerBar);
    const activePlayerBar = document.querySelector("ytmusic-player-bar") || playerBar;
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

    if (event.ctrlKey && event.key === "k") {
        console.log("[loop.mp3] Search called");
        showLoopSearch();
        return;
    }

    if (event.altKey && event.key === "l") {
        console.log("[loop.mp3] triggered screen disable")
        DisableScreen()
    }

    if (event.ctrlKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        showLoopQueue();
        return;
    }

    // replace the fucking thing without keeping anything that is freaking playing currently
    if (event.ctrlKey && (
        event.key.toLowerCase() === "5" ||
        /^F([1-9]|1[0-2])$/.test(event.key)
    )) {
        window.location.replace("https://music.youtube.com");
    }

    // Ignore the synthetic J/K events generated for YouTube Music itself.
    if (!event.isTrusted) return;

    if (event.key === "~" || (event.code === "Backquote" && event.shiftKey)) {
        event.preventDefault();
        if (loopVisible && document.getElementById("loop")) {
            goBackToNormal();
        } else {
            returnToLoopUI(event);
        }
        return;
    }

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
        // reload the currentpage
    if (event.key === "F5") {
        window.location.reload();
    }

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
    setInterval(() => {
        if (loopUpdateBlocked) return;
        ensureLoopRecordButton();
        updateForCurrentTrack(playerBar);
        watchPlaybackState();
    }, 100);
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

forceCustomFavicon();

setInterval(forceCustomFavicon, 1000);

loadFontAwesome();
loadKawarpRenderer().catch((error) => {
    console.warn("[loop.mp3] Could not load @kawarp/core:", error);
});
loadKawarpSettings();
loadLoopPreferences();
waitForYTM(init);
async function checkIsSleepSupported() {
    const isSleep = await isSleepSupported();

    if (isSleep) {
        console.log("[loop.mp3] Screen sleep supported");
    } else {
        console.warn("[loop.mp3] Screen sleep not supported");
    }
}

checkIsSleepSupported()