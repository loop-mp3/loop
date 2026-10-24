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
    miniPlayerBridge?.syncEffects();
    publishElectronKawarpState();
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
    loopPreferences.showLyrics = true;
    loopPreferences.lyricsDisabledProviderIds = [...new Set((Array.isArray(loopPreferences.lyricsDisabledProviderIds) ? loopPreferences.lyricsDisabledProviderIds : []).filter((id) => lyricsProviders.some((provider) => provider.id === id)))];
    loopPreferences.lyricsRemovedProviderIds = [...new Set((Array.isArray(loopPreferences.lyricsRemovedProviderIds) ? loopPreferences.lyricsRemovedProviderIds : []).filter((id) => lyricsProviders.some((provider) => provider.id === id)))];
    loopPreferences.trackPresentationModes = normalizeTrackPresentationModes(loopPreferences.trackPresentationModes);
    loopPreferences.lyricsRenderingEngine = normalizeLyricsRenderingEngine(loopPreferences.lyricsRenderingEngine);
    loopPreferences.enableLyricsTranslation = loopPreferences.enableLyricsTranslation === true;
    loopPreferences.lyricsTranslationLanguage = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
    loopPreferences.lyricsGapNoteThreshold = normalizeLyricsGapNoteThreshold(loopPreferences.lyricsGapNoteThreshold);
    loopPreferences.loopUpdateInterval = normalizeLoopUpdateInterval(loopPreferences.loopUpdateInterval);
    loopPreferences.kawarpFpsCap = normalizeKawarpFpsCap(loopPreferences.kawarpFpsCap);
    loopPreferences.kawarpFpsLogging = loopPreferences.kawarpFpsLogging === true;
    applyKawarpSettings(kawarpSettings);
    applyLoopPreferences();
    startLoopUpdatePolling(loopUpdatePlayerBar);
}

function setKawarpEnabled(enabled) {
    kawarpEnabled = enabled;
    loopPreferences.animatedBackground = enabled;
    saveLoopPreferences();
    setKawarpCanvasVisibility(enabled);
    if (enabled) showKawarpWarning();
    publishElectronKawarpState();
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

function syncVideoBackgroundPlayback() {
    const iframe = document.querySelector("#loop-video-background iframe");
    const media = getCurrentMedia();
    if (!iframe?.contentWindow || !media) return;

    const send = (func, args = []) => iframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func,
        args,
    }), "https://www.youtube.com");

    send("mute");
    send("unloadModule", ["captions"]);
    send("unloadModule", ["cc"]);
    if (Number.isFinite(media.currentTime) &&
        (!Number.isFinite(videoBackgroundLastSyncedTime) ||
            Math.abs(media.currentTime - videoBackgroundLastSyncedTime) > 0.75)) {
        send("seekTo", [media.currentTime, true]);
        videoBackgroundLastSyncedTime = media.currentTime;
    }
    const paused = media.paused || media.ended;
    if (paused !== videoBackgroundLastPaused) {
        send(paused ? "pauseVideo" : "playVideo");
        videoBackgroundLastPaused = paused;
    }
}

function updateVideoBackground(trackId, isVideo) {
    const canvas = document.querySelector("#loop-kawarp-background");
    const player = document.querySelector("#loop-player");
    if (!canvas || !player) return;

    let wrapper = document.querySelector("#loop-video-background");
    if (!isVideo || !trackId) {
        videoBackgroundTrackId = undefined;
        videoBackgroundLastSyncedTime = undefined;
        videoBackgroundLastPaused = undefined;
        wrapper?.remove();
        if (canvas) canvas.style.display = kawarpEnabled ? "block" : "none";
        return;
    }

    if (videoBackgroundTrackId === trackId && wrapper) {
        syncVideoBackgroundPlayback();
        return;
    }

    videoBackgroundTrackId = trackId;
    videoBackgroundLastSyncedTime = undefined;
    videoBackgroundLastPaused = undefined;
    disposeKawarpBackground();
    canvas.style.display = "none";
    wrapper?.remove();
    wrapper = document.createElement("div");
    wrapper.id = "loop-video-background";
    wrapper.innerHTML = `<iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(trackId)}?rel=0&enablejsapi=1&cc_load_policy=0"
        title="Track video"
        allowfullscreen
        scrolling="no"
        allow="autoplay; accelerometer *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *;"
        referrerpolicy="strict-origin"
    ></iframe><div class="loop-video-background-overlay" aria-hidden="true"></div>`;
    player.insertBefore(wrapper, player.firstChild);
    wrapper.querySelector("iframe").addEventListener("load", () => {
        window.clearTimeout(videoBackgroundSyncFrame);
        videoBackgroundSyncFrame = window.setTimeout(syncVideoBackgroundPlayback, 100);
    }, { once: true });
}

function showVideoUi() {
    const loop = document.getElementById("loop");
    if (!loop?.classList.contains("loop-video-mode")) return;

    loop.classList.remove("loop-video-ui-hidden");
    window.clearTimeout(videoUiHideTimer);
    videoUiHideTimer = window.setTimeout(() => {
        loop.classList.add("loop-video-ui-hidden");
    }, 1600);
}

function updateKawarpArtwork(artworkURL) {
    const canvas = document.querySelector("#loop-kawarp-background");
    if (!canvas) return;

    if (videoBackgroundTrackId) {
        disposeKawarpBackground();
        canvas.style.display = "none";
        return;
    }

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
                fpsCap: loopPreferences.kawarpFpsCap,
                fpsLogging: loopPreferences.kawarpFpsLogging,
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

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.loadKawarpRenderer = loadKawarpRenderer;
    global.setKawarpCanvasVisibility = setKawarpCanvasVisibility;
    global.applyKawarpSettings = applyKawarpSettings;
    global.loadKawarpSettings = loadKawarpSettings;
    global.getStoredKawarpConfig = getStoredKawarpConfig;
    global.getStoredKawarpPresets = getStoredKawarpPresets;
    global.saveStoredKawarpPresets = saveStoredKawarpPresets;
    global.deleteKawarpPreset = deleteKawarpPreset;
    global.requestKawarpPresetDetails = requestKawarpPresetDetails;
    global.loadKawarpPreset = loadKawarpPreset;
    global.loadKawarpPresets = loadKawarpPresets;
    global.showKawarpConfigEditor = showKawarpConfigEditor;
    global.loadLoopPreferences = loadLoopPreferences;
    global.setKawarpEnabled = setKawarpEnabled;
    global.showKawarpWarning = showKawarpWarning;
    global.showLoopNotification = showLoopNotification;
    global.dismissLoopNotification = dismissLoopNotification;
    global.disposeKawarpBackground = disposeKawarpBackground;
    global.syncVideoBackgroundPlayback = syncVideoBackgroundPlayback;
    global.updateVideoBackground = updateVideoBackground;
    global.showVideoUi = showVideoUi;
    global.updateKawarpArtwork = updateKawarpArtwork;
})(globalThis);
