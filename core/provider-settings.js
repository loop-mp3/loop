function normalizeLyricsTranslationLanguage(value) {
    const language = String(value || "en").trim().toLowerCase();
    return supportedLyricsTranslationLanguages.has(language) ? language : "en";
}

function getTranslationCacheKey(trackId, targetLanguage) {
    return `${translationCacheKeyPrefix}${encodeURIComponent(trackId)}_${targetLanguage}`;
}

function isValidTranslationResult(result, lineCount) {
    return Array.isArray(result?.lines) && result.lines.length === lineCount;
}

function getCachedTranslation(trackId, targetLanguage, lineCount) {
    const key = getTranslationCacheKey(trackId, targetLanguage);
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId) return Promise.resolve(null);

    return new Promise((resolve) => {
        storage.get(key, (result) => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not read cached translation:", error.message);
                resolve(null);
                return;
            }
            const cachedTranslation = result?.[key];
            resolve(isValidTranslationResult(cachedTranslation, lineCount) ? cachedTranslation : null);
        });
    });
}

function cacheTranslation(trackId, targetLanguage, result) {
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId || !isValidTranslationResult(result, result.lines.length)) return Promise.resolve();

    const key = getTranslationCacheKey(trackId, targetLanguage);
    return new Promise((resolve) => {
        storage.set({ [key]: { ...result, cachedAt: Date.now() } }, () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) console.warn("[loop.mp3] Could not cache translation:", error.message);
            resolve();
        });
    });
}

function getLyricsProviderDisplayOrder() {
    const storedOrder = Array.isArray(loopPreferences.lyricsProviderOrder)
        ? loopPreferences.lyricsProviderOrder
        : [];
    const knownIds = new Set(lyricsProviders.map((provider) => provider.id));
    const removedIds = new Set(Array.isArray(loopPreferences.lyricsRemovedProviderIds)
        ? loopPreferences.lyricsRemovedProviderIds
        : []);
    return [...new Set([
        ...storedOrder.filter((providerId) => knownIds.has(providerId) && !removedIds.has(providerId)),
        ...defaultLyricsProviderIds.filter((providerId) => !removedIds.has(providerId)),
        ...lyricsProviders.map((provider) => provider.id).filter((providerId) => !removedIds.has(providerId)),
    ])];
}

function getLyricsProviderOrder() {
    const disabledIds = new Set(Array.isArray(loopPreferences.lyricsDisabledProviderIds)
        ? loopPreferences.lyricsDisabledProviderIds
        : []);
    return getLyricsProviderDisplayOrder().filter((providerId) => !disabledIds.has(providerId));
}

function saveLyricsProviderState() {
    loopPreferences.lyricsProviderOrder = getLyricsProviderDisplayOrder();
    saveLoopPreferences();
    applyLoopPreferences();
}

function setLyricsProviderOrder(order) {
    const knownIds = new Set(lyricsProviders.map((provider) => provider.id));
    const removedIds = new Set(loopPreferences.lyricsRemovedProviderIds || []);
    loopPreferences.lyricsProviderOrder = [...new Set(order.filter((providerId) => knownIds.has(providerId) && !removedIds.has(providerId)))];
    saveLyricsProviderState();
}

function setLyricsProviderEnabled(providerId, enabled) {
    const disabledIds = new Set(loopPreferences.lyricsDisabledProviderIds || []);
    if (enabled) disabledIds.delete(providerId);
    else disabledIds.add(providerId);
    loopPreferences.lyricsDisabledProviderIds = [...disabledIds];
    saveLyricsProviderState();
    if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack(true);
}

function removeLyricsProvider(providerId) {
    loopPreferences.lyricsRemovedProviderIds = [...new Set([...(loopPreferences.lyricsRemovedProviderIds || []), providerId])];
    loopPreferences.lyricsDisabledProviderIds = (loopPreferences.lyricsDisabledProviderIds || []).filter((id) => id !== providerId);
    saveLyricsProviderState();
    if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack(true);
}

function restoreLyricsProviders() {
    loopPreferences.lyricsRemovedProviderIds = [];
    saveLyricsProviderState();
}

function renderLyricsProviderPriorityUI() {
    const loop = document.querySelector("#loop");
    const container = loop?.querySelector("#loop-lyrics-provider-priority-list");
    if (!container) return;

    const disabledIds = new Set(loopPreferences.lyricsDisabledProviderIds || []);
    const order = getLyricsProviderDisplayOrder();
    container.replaceChildren();
    order.forEach((providerId, index) => {
        const provider = lyricsProviders.find((entry) => entry.id === providerId);
        if (!provider) return;
        const row = document.createElement("div");
        row.className = "loop-lyrics-provider-priority-item";
        row.draggable = true;
        row.dataset.providerId = provider.id;
        row.classList.toggle("is-disabled", disabledIds.has(provider.id));

        const rank = document.createElement("span");
        rank.className = "loop-lyrics-provider-priority-rank";
        rank.textContent = String(index + 1);
        const dragHandle = document.createElement("span");
        dragHandle.className = "loop-lyrics-provider-priority-handle";
        dragHandle.textContent = "⠿";
        dragHandle.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "loop-lyrics-provider-priority-label";
        label.textContent = provider.label;
        const toggleLabel = document.createElement("label");
        toggleLabel.className = "loop-lyrics-provider-priority-toggle";
        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.checked = !disabledIds.has(provider.id);
        toggle.setAttribute("aria-label", `Enable ${provider.label}`);
        toggle.addEventListener("change", () => setLyricsProviderEnabled(provider.id, toggle.checked));
        toggleLabel.append(toggle, document.createTextNode("Enabled"));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "loop-lyrics-provider-priority-remove";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => removeLyricsProvider(provider.id));
        row.append(rank, dragHandle, label, toggleLabel, remove);

        row.addEventListener("dragstart", (event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", provider.id);
            row.classList.add("is-dragging");
        });
        row.addEventListener("dragend", () => row.classList.remove("is-dragging"));
        row.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });
        row.addEventListener("drop", (event) => {
            event.preventDefault();
            const draggedId = event.dataTransfer.getData("text/plain");
            if (!draggedId || draggedId === provider.id) return;
            const dragged = container.querySelector(`[data-provider-id="${CSS.escape(draggedId)}"]`);
            if (!dragged) return;
            const rows = [...container.children];
            if (rows.indexOf(dragged) < rows.indexOf(row)) container.insertBefore(dragged, row);
            else container.insertBefore(dragged, row.nextSibling);
            setLyricsProviderOrder([...container.children].map((item) => item.dataset.providerId));
        });
        container.appendChild(row);
    });

    const restore = loop.querySelector("#loop-lyrics-provider-restore");
    if (restore) {
        restore.hidden = !(loopPreferences.lyricsRemovedProviderIds || []).length;
        restore.onclick = restoreLyricsProviders;
    }
}

function normalizeLyricsGapNoteThreshold(value) {
    const threshold = Number(value);
    if (!Number.isFinite(threshold)) return defaultLyricsGapNoteThreshold;
    return Math.min(
        maximumLyricsGapNoteThreshold,
        Math.max(minimumLyricsGapNoteThreshold, Math.round(threshold))
    );
}

function normalizeLoopUpdateInterval(value) {
    const interval = Number(value);
    if (!Number.isFinite(interval)) return defaultLoopUpdateInterval;
    return Math.min(
        maximumLoopUpdateInterval,
        Math.max(minimumLoopUpdateInterval, Math.round(interval / 50) * 50)
    );
}

function getLoopUpdateIntervalWarning(interval) {
    if (interval < defaultLoopUpdateInterval) {
        return "Low intervals can increase CPU usage and cause performance issues.";
    }
    if (interval > defaultLoopUpdateInterval) {
        return "Intervals above 500 ms can make Loop updates feel very slow.";
    }
    return "";
}

function normalizeKawarpFpsCap(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return defaultKawarpFpsCap;
    return kawarpFpsOptions.reduce((closest, option) =>
        Math.abs(option - numericValue) < Math.abs(closest - numericValue) ? option : closest
    );
}

function getKawarpFpsLabel(fpsCap) {
    return fpsCap === 0 ? "Dynamic" : `${fpsCap} FPS`;
}

function getKawarpFpsWarning(fpsCap) {
    if (fpsCap === 0) {
        return "Dynamic follows the display refresh rate and may increase GPU usage and battery drain.";
    }
    if (fpsCap > 60) {
        return "FPS above 60 can increase GPU usage, battery drain, and heat.";
    }
    return "";
}

function updateKawarpFpsPreferenceUI() {
    const loop = document.querySelector("#loop");
    if (!loop) return;

    const fpsCap = normalizeKawarpFpsCap(loopPreferences.kawarpFpsCap);
    loopPreferences.kawarpFpsCap = fpsCap;
    const slider = loop.querySelector("#loop-kawarp-fps-slider");
    if (slider) {
        slider.value = String(kawarpFpsOptions.indexOf(fpsCap));
        slider.setAttribute("aria-valuetext", getKawarpFpsLabel(fpsCap));
    }
    const value = loop.querySelector("#loop-kawarp-fps-value");
    if (value) value.textContent = getKawarpFpsLabel(fpsCap);
    const warning = loop.querySelector("#loop-kawarp-fps-warning");
    if (warning) {
        warning.textContent = getKawarpFpsWarning(fpsCap);
        warning.hidden = !warning.textContent;
    }
}

function updateLoopPollingPreferenceUI() {
    const loop = document.querySelector("#loop");
    if (!loop) return;

    const lyricsGapNoteThreshold = normalizeLyricsGapNoteThreshold(loopPreferences.lyricsGapNoteThreshold);
    loopPreferences.lyricsGapNoteThreshold = lyricsGapNoteThreshold;
    const lyricsGapNoteSlider = loop.querySelector("#loop-lyrics-gap-note-threshold-slider");
    if (lyricsGapNoteSlider) lyricsGapNoteSlider.value = String(lyricsGapNoteThreshold);
    const lyricsGapNoteValue = loop.querySelector("#loop-lyrics-gap-note-threshold-value");
    if (lyricsGapNoteValue) lyricsGapNoteValue.textContent = `${lyricsGapNoteThreshold} sec`;

    const interval = normalizeLoopUpdateInterval(loopPreferences.loopUpdateInterval);
    loopPreferences.loopUpdateInterval = interval;
    const slider = loop.querySelector("#loop-update-interval-slider");
    if (slider) slider.value = String(interval);
    const value = loop.querySelector("#loop-update-interval-value");
    if (value) value.textContent = `${interval} ms`;
    const warning = loop.querySelector("#loop-update-interval-warning");
    if (warning) {
        warning.textContent = getLoopUpdateIntervalWarning(interval);
        warning.hidden = !warning.textContent;
    }
    updateKawarpFpsPreferenceUI();
}

function applyLyricsAnimationPreferences() {
    const lyricsContainer = braccatoLyricsMount?.querySelector(".blyrics-container");
    if (!lyricsContainer) return;
    lyricsContainer.style.setProperty(
        "--blyrics-animate-word-wobble",
        loopPreferences.animateWordWobble === true ? "1" : "0"
    );
}

function normalizeLyricsRenderingEngine(value) {
    return value === "ludo" || value === "diff" ? "ludo" : "standard";
}

function getLyricsForRenderingEngine(lines) {
    // Ludo animates the line shell while Braccato keeps the timed parts inside each line alive.
    // Keeping these parts is what allows Lyrics+ TTML syllables to progress in Ludo too.
    return lines;
}

function applyLyricsRenderingEngine() {
    if (!createLudoLyricsController) return;
    ludoLyricsController ??= createLudoLyricsController();
    ludoLyricsController.apply({
        enabled: loopPreferences.lyricsRenderingEngine === "ludo",
        lines: braccatoLyricsRenderer?.lines || [],
        view: braccatoLyricsMount,
    });
}

function startLoopUpdatePolling(playerBar) {
    loopUpdatePlayerBar = playerBar || loopUpdatePlayerBar;
    if (!loopUpdatePlayerBar) return;
    window.clearInterval(loopUpdateIntervalId);
    loopUpdateIntervalId = window.setInterval(() => {
        if (loopUpdateBlocked) return;
        ensureLoopRecordButton();
        updateForCurrentTrack(loopUpdatePlayerBar);
        watchPlaybackState();
    }, normalizeLoopUpdateInterval(loopPreferences.loopUpdateInterval));
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.normalizeLyricsTranslationLanguage = normalizeLyricsTranslationLanguage;
    global.getTranslationCacheKey = getTranslationCacheKey;
    global.isValidTranslationResult = isValidTranslationResult;
    global.getCachedTranslation = getCachedTranslation;
    global.cacheTranslation = cacheTranslation;
    global.getLyricsProviderDisplayOrder = getLyricsProviderDisplayOrder;
    global.getLyricsProviderOrder = getLyricsProviderOrder;
    global.saveLyricsProviderState = saveLyricsProviderState;
    global.setLyricsProviderOrder = setLyricsProviderOrder;
    global.setLyricsProviderEnabled = setLyricsProviderEnabled;
    global.removeLyricsProvider = removeLyricsProvider;
    global.restoreLyricsProviders = restoreLyricsProviders;
    global.renderLyricsProviderPriorityUI = renderLyricsProviderPriorityUI;
    global.normalizeLyricsGapNoteThreshold = normalizeLyricsGapNoteThreshold;
    global.normalizeLoopUpdateInterval = normalizeLoopUpdateInterval;
    global.getLoopUpdateIntervalWarning = getLoopUpdateIntervalWarning;
    global.normalizeKawarpFpsCap = normalizeKawarpFpsCap;
    global.getKawarpFpsLabel = getKawarpFpsLabel;
    global.getKawarpFpsWarning = getKawarpFpsWarning;
    global.updateKawarpFpsPreferenceUI = updateKawarpFpsPreferenceUI;
    global.updateLoopPollingPreferenceUI = updateLoopPollingPreferenceUI;
    global.applyLyricsAnimationPreferences = applyLyricsAnimationPreferences;
    global.normalizeLyricsRenderingEngine = normalizeLyricsRenderingEngine;
    global.getLyricsForRenderingEngine = getLyricsForRenderingEngine;
    global.applyLyricsRenderingEngine = applyLyricsRenderingEngine;
    global.startLoopUpdatePolling = startLoopUpdatePolling;
})(globalThis);
