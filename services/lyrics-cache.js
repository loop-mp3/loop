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

function normalizeTrackPresentationModes(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, mode]) => mode === "audio" || mode === "video"));
}

function getTrackPresentationMode(trackId) {
    if (!trackId) return "auto";
    return loopPreferences.trackPresentationModes?.[trackId] || "auto";
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

function getLyricsCacheKey(trackId) {
    return `${lyricsCacheKeyPrefix}${trackId}`;
}

function getLyricsCacheStorage() {
    return globalThis.chrome?.storage?.local || globalThis.browser?.storage?.local;
}

function getCachedLyrics(trackId) {
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId) return Promise.resolve(null);

    return new Promise((resolve) => {
        storage.get(getLyricsCacheKey(trackId), (result) => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not read cached lyrics:", error.message);
                resolve(null);
                return;
            }
            resolve(result?.[getLyricsCacheKey(trackId)] || null);
        });
    });
}

function getManualLyricsCacheKey(trackId) {
    return `${manualLyricsCacheKeyPrefix}${trackId}`;
}

function getManualCachedLyrics(trackId) {
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId) return Promise.resolve(null);

    return new Promise((resolve) => {
        storage.get(getManualLyricsCacheKey(trackId), (result) => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not read manually selected lyrics:", error.message);
                resolve(null);
                return;
            }
            resolve(restoreCachedLyrics(result?.[getManualLyricsCacheKey(trackId)] || null));
        });
    });
}

function cacheManuallySelectedLyrics(trackId, title, artist, duration, lyrics) {
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId || !lyrics?.meta?.provider) return Promise.resolve();

    const requestDuration = Number(duration);
    const responseDuration = Number(lyrics.meta.duration);
    const cachedLyrics = {
        meta: { ...lyrics.meta, provider: lyrics.meta.provider },
        provider: lyrics.meta.provider,
        title,
        artist,
        duration: Number.isFinite(requestDuration)
            ? requestDuration
            : Number.isFinite(responseDuration) ? responseDuration : null,
        syncedLyrics: lyrics.syncedLyrics || null,
        plainLyrics: lyrics.plainLyrics || null,
        override: lyrics.meta.override === true,
        manuallySelected: true,
        cachedAt: Date.now(),
    };

    return new Promise((resolve) => {
        storage.set({ [getManualLyricsCacheKey(trackId)]: cachedLyrics }, () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) console.warn("[loop.mp3] Could not cache manually selected lyrics:", error.message);
            resolve();
        });
    });
}

function cacheLyrics(trackId, title, artist, duration, lyrics) {
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId || !lyrics?.meta?.provider) return Promise.resolve();

    const requestDuration = Number(duration);
    const responseDuration = Number(lyrics.meta.duration);
    const cachedLyrics = {
        provider: lyrics.meta.provider,
        title,
        artist,
        duration: Number.isFinite(requestDuration)
            ? requestDuration
            : Number.isFinite(responseDuration) ? responseDuration : null,
        syncedLyrics: lyrics.syncedLyrics || null,
        plainLyrics: lyrics.plainLyrics || null,
        override: lyrics.meta.override === true,
        cachedAt: Date.now(),
    };

    return new Promise((resolve) => {
        storage.set({ [getLyricsCacheKey(trackId)]: cachedLyrics }, () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) console.warn("[loop.mp3] Could not cache lyrics:", error.message);
            resolve();
        });
    });
}

function removeCachedLyrics(trackId) {
    const storage = getLyricsCacheStorage();
    if (!storage || !trackId) return Promise.resolve(false);

    return new Promise((resolve) => {
        storage.remove(getLyricsCacheKey(trackId), () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not remove cached lyrics:", error.message);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

function restoreCachedLyrics(cachedLyrics) {
    if (!cachedLyrics?.provider) return null;
    if (!cachedLyrics.syncedLyrics && !cachedLyrics.plainLyrics) return null;
    return {
        meta: {
            ...(cachedLyrics.meta || {}),
            provider: cachedLyrics.provider,
            title: cachedLyrics.title,
            artist: cachedLyrics.artist,
            duration: cachedLyrics.duration,
            override: cachedLyrics.override === true,
            cachedAt: cachedLyrics.cachedAt,
        },
        syncedLyrics: cachedLyrics.syncedLyrics || null,
        plainLyrics: cachedLyrics.plainLyrics || null,
    };
}

function getAllCachedLyrics() {
    const storage = getLyricsCacheStorage();
    if (!storage) return Promise.resolve([]);

    return new Promise((resolve) => {
        storage.get(null, (result) => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not read lyrics cache:", error.message);
                resolve([]);
                return;
            }

            resolve(Object.entries(result || {})
                .filter(([key, value]) => key.startsWith(lyricsCacheKeyPrefix) && !key.startsWith(manualLyricsCacheKeyPrefix) && value?.provider)
                .map(([key, value]) => ({ trackId: key.slice(lyricsCacheKeyPrefix.length), ...value }))
                .sort((a, b) => Number(b.cachedAt || 0) - Number(a.cachedAt || 0)));
        });
    });
}

function getAllLyricsCacheEntries() {
    const storage = getLyricsCacheStorage();
    if (!storage) return Promise.resolve([]);

    return new Promise((resolve) => {
        storage.get(null, (result) => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not read lyrics cache entries:", error.message);
                resolve([]);
                return;
            }

            const values = result || {};
            const lyricEntries = Object.entries(values)
                .filter(([key, value]) => key.startsWith(lyricsCacheKeyPrefix) && !key.startsWith(manualLyricsCacheKeyPrefix) && value?.provider)
                .map(([key, value]) => ({
                    cacheType: "lyrics",
                    cacheKey: key,
                    trackId: key.slice(lyricsCacheKeyPrefix.length),
                    ...value,
                }));
            const manualEntries = Object.entries(values)
                .filter(([key, value]) => key.startsWith(manualLyricsCacheKeyPrefix) && value?.provider)
                .map(([key, value]) => ({
                    cacheType: "manual",
                    cacheKey: key,
                    trackId: key.slice(manualLyricsCacheKeyPrefix.length),
                    ...value,
                }));
            const metadataByTrackId = new Map([...lyricEntries, ...manualEntries].map((entry) => [entry.trackId, entry]));
            const translationEntries = Object.entries(values)
                .filter(([key, value]) => key.startsWith(translationCacheKeyPrefix) && Array.isArray(value?.lines))
                .map(([key, value]) => {
                    const match = key.match(/^translation_(.+)_([a-z-]+)$/i);
                    const trackId = match ? decodeURIComponent(match[1]) : key.slice(translationCacheKeyPrefix.length);
                    const metadata = metadataByTrackId.get(trackId) || {};
                    return {
                        cacheType: "translation",
                        cacheKey: key,
                        trackId,
                        title: metadata.title || "Untitled track",
                        artist: metadata.artist || "Unknown artist",
                        provider: "Unison translation",
                        language: match?.[2] || "unknown",
                        ...value,
                    };
                });

            const lyricEntriesWithTranslations = [...lyricEntries, ...manualEntries];
            const unmatchedTranslations = [];
            translationEntries.forEach((translation) => {
                const matchingEntries = lyricEntriesWithTranslations.filter((entry) => entry.trackId === translation.trackId);
                if (matchingEntries.length) {
                    matchingEntries.forEach((entry) => {
                        entry.translations = [...(entry.translations || []), translation];
                    });
                } else {
                    unmatchedTranslations.push(translation);
                }
            });

            resolve([...lyricEntriesWithTranslations, ...unmatchedTranslations]
                .sort((left, right) => Number(right.cachedAt || 0) - Number(left.cachedAt || 0)));
        });
    });
}

function saveLyricsCacheEntry(entry) {
    const storage = getLyricsCacheStorage();
    if (!storage || !entry?.cacheKey) return Promise.resolve(false);
    const value = { ...entry };
    delete value.cacheType;
    delete value.cacheKey;
    delete value.trackId;
    return new Promise((resolve) => {
        storage.set({ [entry.cacheKey]: { ...value, cachedAt: Date.now() } }, () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                console.warn("[loop.mp3] Could not save cache entry:", error.message);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

function removeLyricsCacheEntry(entry) {
    const storage = getLyricsCacheStorage();
    if (!storage || !entry?.cacheKey) return Promise.resolve(false);
    return new Promise((resolve) => {
        storage.remove(entry.cacheKey, () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            resolve(!error);
        });
    });
}

function isLyricsCacheStorageKey(key) {
    return key.startsWith(lyricsCacheKeyPrefix) ||
        key.startsWith(manualLyricsCacheKeyPrefix) ||
        key.startsWith(translationCacheKeyPrefix);
}

function getLyricsCacheExport() {
    const storage = getLyricsCacheStorage();
    if (!storage) return Promise.reject(new Error("Cache storage is unavailable."));
    return new Promise((resolve, reject) => {
        storage.get(null, (result) => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) {
                reject(new Error(error.message || "Could not read cache storage."));
                return;
            }
            const entries = Object.fromEntries(Object.entries(result || {})
                .filter(([key, value]) => isLyricsCacheStorageKey(key) && value && typeof value === "object"));
            resolve({
                format: "loop-lyrics-cache",
                version: 1,
                exportedAt: new Date().toISOString(),
                entries,
            });
        });
    });
}

function importLyricsCacheExport(payload) {
    const storage = getLyricsCacheStorage();
    if (!storage || payload?.format !== "loop-lyrics-cache" || payload?.version !== 1 ||
        !payload.entries || typeof payload.entries !== "object" || Array.isArray(payload.entries)) {
        return Promise.reject(new Error("That file is not a valid Loop lyrics cache export."));
    }
    const entries = Object.fromEntries(Object.entries(payload.entries)
        .filter(([key, value]) => isLyricsCacheStorageKey(key) && value && typeof value === "object" && !Array.isArray(value)));
    if (!Object.keys(entries).length) return Promise.reject(new Error("The cache export contains no usable entries."));
    return new Promise((resolve, reject) => {
        storage.set(entries, () => {
            const error = globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError;
            if (error) reject(new Error(error.message || "Could not import cache entries."));
            else resolve(Object.keys(entries).length);
        });
    });
}

function showCachedLyricsModal() {
    if (document.getElementById("loop-lyrics-cache-modal")) return;

    const modal = document.createElement("div");
    modal.id = "loop-lyrics-cache-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-lyrics-cache-title");
    modal.innerHTML = `
        <section class="loop-lyrics-cache-card">
            <header class="loop-lyrics-cache-header">
                <div>
                    <div class="loop-lyrics-cache-kicker">Loop storage</div>
                    <h2 id="loop-lyrics-cache-title">Cached lyrics</h2>
                </div>
                <div class="loop-lyrics-cache-header-actions">
                    <button type="button" class="loop-lyrics-cache-export">Export</button>
                    <button type="button" class="loop-lyrics-cache-import">Import</button>
                    <input class="loop-lyrics-cache-import-input" type="file" accept="application/json,.json" hidden>
                    <button type="button" class="loop-lyrics-cache-close" aria-label="Close cached lyrics">&#215;</button>
                </div>
            </header>
            <div class="loop-lyrics-cache-layout">
                <div class="loop-lyrics-cache-list-panel">
                    <input class="loop-lyrics-cache-search" type="search" placeholder="Search cached lyrics…" aria-label="Search cached lyrics">
                    <div class="loop-lyrics-cache-list" role="listbox" aria-label="Cached lyrics tracks">
                        <div class="loop-lyrics-cache-status">Loading cached lyrics…</div>
                    </div>
                </div>
                <div class="loop-lyrics-cache-details" aria-live="polite">
                    <div class="loop-lyrics-cache-empty">Select a cached track to view or edit it.</div>
                </div>
            </div>
        </section>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    const list = modal.querySelector(".loop-lyrics-cache-list");
    const details = modal.querySelector(".loop-lyrics-cache-details");
    const search = modal.querySelector(".loop-lyrics-cache-search");
    const exportButton = modal.querySelector(".loop-lyrics-cache-export");
    const importButton = modal.querySelector(".loop-lyrics-cache-import");
    const importInput = modal.querySelector(".loop-lyrics-cache-import-input");
    let allEntries = [];
    let selectedCacheKey = null;

    const renderEntries = (entries) => {
        const query = search.value.trim().toLocaleLowerCase();
        const filteredEntries = entries.filter((entry) =>
            !query || [entry.title, entry.artist, entry.trackId, entry.provider, entry.language, entry.cacheType,
                ...(entry.translations || []).flatMap((translation) => [translation.language, ...((translation.lines || []).map((line) => line?.translation || ""))])]
                .some((value) => String(value || "").toLocaleLowerCase().includes(query))
        );
        list.replaceChildren();
        if (!filteredEntries.length) {
            const empty = document.createElement("div");
            empty.className = "loop-lyrics-cache-status";
            empty.textContent = query ? "No matching cache entries." : "No cached lyrics yet.";
            list.appendChild(empty);
            if (!query) details.replaceChildren(empty.cloneNode(true));
            return;
        }

        filteredEntries.forEach((entry) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "loop-lyrics-cache-item";
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", entry.cacheKey === selectedCacheKey ? "true" : "false");
            const title = document.createElement("strong");
            title.textContent = entry.title || "Untitled track";
            const subtitle = document.createElement("span");
            const type = entry.cacheType === "translation" ? `Translation · ${entry.language}` :
                entry.cacheType === "manual" ? "Manually selected lyrics" : entry.provider;
            const translationCount = entry.translations?.length || 0;
            subtitle.textContent = `${entry.artist || "Unknown artist"} · ${type}${translationCount ? ` · ${translationCount} translation${translationCount === 1 ? "" : "s"}` : ""}`;
            button.append(title, subtitle);
            button.addEventListener("click", () => showDetails(entry));
            list.appendChild(button);
        });
    };

    const showDetails = (entry) => {
        selectedCacheKey = entry.cacheKey;
        renderEntries(allEntries);
        details.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = entry.title || "Untitled track";
        const artist = document.createElement("p");
        artist.className = "loop-lyrics-cache-detail-artist";
        artist.textContent = entry.artist || "Unknown artist";
        const metadata = document.createElement("dl");
        [
            ["Track ID", entry.trackId],
            ["Type", entry.cacheType === "translation" ? `Translation (${entry.language})` : entry.cacheType === "manual" ? "Manually selected lyrics" : "Lyrics"],
            ["Provider", entry.provider],
            ["Translations", entry.translations?.map((translation) => translation.language).join(", ") || "None"],
            ["Cached", entry.cachedAt ? new Date(entry.cachedAt).toLocaleString() : "Unknown"],
        ].forEach(([label, value]) => {
            const term = document.createElement("dt");
            term.textContent = label;
            const valueElement = document.createElement("dd");
            valueElement.textContent = value || "Unknown";
            metadata.append(term, valueElement);
        });

        const editor = document.createElement("div");
        editor.className = "loop-lyrics-cache-editor";
        const fields = [];
        if (entry.cacheType !== "translation") {
            fields.push(["Title", "title", entry.title || "", "input"]);
            fields.push(["Artist", "artist", entry.artist || "", "input"]);
            fields.push(["Synced lyrics (TTML/LRC)", "syncedLyrics", entry.syncedLyrics || "", "textarea"]);
            fields.push(["Plain lyrics", "plainLyrics", entry.plainLyrics || "", "textarea"]);
        }
        const translationEntries = entry.cacheType === "translation" ? [entry] : (entry.translations || []);
        translationEntries.forEach((translation, index) => {
            fields.push([`Translation · ${translation.language}`, `translationLines:${index}`, JSON.stringify(translation.lines || [], null, 2), "textarea"]);
        });
        const controls = {};
        fields.forEach(([label, key, value, tagName]) => {
            const labelElement = document.createElement("label");
            labelElement.className = "loop-lyrics-cache-editor-field";
            labelElement.textContent = label;
            const input = document.createElement(tagName);
            input.value = value;
            input.name = key;
            if (tagName === "textarea") input.rows = key === "translationLines" ? 8 : 6;
            labelElement.appendChild(input);
            editor.appendChild(labelElement);
            controls[key] = input;
        });

        const actions = document.createElement("div");
        actions.className = "loop-lyrics-cache-actions";
        const save = document.createElement("button");
        save.type = "button";
        save.textContent = "Save changes";
        const refresh = document.createElement("button");
        refresh.type = "button";
        refresh.textContent = "Refresh lyrics";
        refresh.hidden = entry.cacheType !== "lyrics";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete cache";
        const status = document.createElement("span");
        status.className = "loop-lyrics-cache-action-status";
        status.setAttribute("role", "status");
        actions.append(save, refresh, remove, status);
        details.append(heading, artist, metadata, editor, actions);

        save.addEventListener("click", async () => {
            const edited = { ...entry };
            const entriesToSave = [];
            if (entry.cacheType === "translation") {
                try {
                    const lines = JSON.parse(controls["translationLines:0"].value);
                    if (!Array.isArray(lines)) throw new Error("Translation lines must be a JSON array.");
                    edited.lines = lines;
                    entriesToSave.push(edited);
                } catch (error) {
                    status.textContent = error.message;
                    return;
                }
            } else {
                edited.title = controls.title.value.trim();
                edited.artist = controls.artist.value.trim();
                edited.syncedLyrics = controls.syncedLyrics.value;
                edited.plainLyrics = controls.plainLyrics.value;
                if (!edited.syncedLyrics && !edited.plainLyrics) {
                    status.textContent = "Add synced or plain lyrics before saving.";
                    return;
                }
                entriesToSave.push(edited);
                try {
                    translationEntries.forEach((translation, index) => {
                        const lines = JSON.parse(controls[`translationLines:${index}`].value);
                        if (!Array.isArray(lines)) throw new Error("Translation lines must be a JSON array.");
                        entriesToSave.push({ ...translation, lines });
                    });
                } catch (error) {
                    status.textContent = error.message;
                    return;
                }
            }
            save.disabled = true;
            if ((await Promise.all(entriesToSave.map((item) => saveLyricsCacheEntry(item)))).every(Boolean)) {
                status.textContent = "Saved.";
                allEntries = await getAllLyricsCacheEntries();
                if (getCurrentTrackId(getYTMPlayerRoot()) === edited.trackId && loopPreferences.showLyrics) {
                    fetchLoopLyricsForCurrentTrack(true);
                }
                showDetails(allEntries.find((item) => item.cacheKey === entry.cacheKey) || edited);
            } else {
                status.textContent = "Save failed.";
                save.disabled = false;
            }
        });

        refresh.addEventListener("click", async () => {
            refresh.disabled = true;
            remove.disabled = true;
            status.textContent = "Refreshing…";
            try {
                await getLyricsFromTrackInfo(entry.trackId, entry.title, entry.artist, entry.duration, true);
                allEntries = await getAllLyricsCacheEntries();
                const refreshedEntry = allEntries.find((item) => item.cacheKey === entry.cacheKey);
                if (!refreshedEntry) throw new Error("No lyrics were returned.");
                showDetails(refreshedEntry);
            } catch (error) {
                console.warn("[loop.mp3] Could not refresh cached lyrics:", error);
                status.textContent = "Refresh failed.";
                refresh.disabled = false;
                remove.disabled = false;
            }
        });

        remove.addEventListener("click", async () => {
            if (!window.confirm(`Delete this cached entry for “${entry.title || "this track"}”?`)) return;
            save.disabled = true;
            refresh.disabled = true;
            remove.disabled = true;
            status.textContent = "Deleting…";
            const entriesToRemove = [entry, ...(entry.cacheType !== "translation" ? (entry.translations || []) : [])];
            const removed = (await Promise.all(entriesToRemove.map((item) => removeLyricsCacheEntry(item)))).every(Boolean);
            if (!removed) {
                status.textContent = "Delete failed.";
                save.disabled = false;
                refresh.disabled = entry.cacheType !== "lyrics";
                remove.disabled = false;
                return;
            }
            selectedCacheKey = null;
            allEntries = await getAllLyricsCacheEntries();
            renderEntries(allEntries);
            details.replaceChildren();
            details.appendChild(Object.assign(document.createElement("div"), {
                className: "loop-lyrics-cache-empty",
                textContent: "Select a cached track to view or edit it.",
            }));
        });
    };

    search.addEventListener("input", () => renderEntries(allEntries));
    exportButton.addEventListener("click", async () => {
        exportButton.disabled = true;
        try {
            const payload = await getLyricsCacheExport();
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `loop-lyrics-cache-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.warn("[loop.mp3] Could not export lyrics cache:", error);
            showLoopNotification(error.message || "Could not export lyrics cache", 3000);
        } finally {
            exportButton.disabled = false;
        }
    });
    importButton.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", async () => {
        const file = importInput.files?.[0];
        importInput.value = "";
        if (!file) return;
        try {
            const imported = await importLyricsCacheExport(JSON.parse(await file.text()));
            allEntries = await getAllLyricsCacheEntries();
            selectedCacheKey = null;
            renderEntries(allEntries);
            if (allEntries[0]) showDetails(allEntries[0]);
            showLoopNotification(`Imported ${imported} cache entr${imported === 1 ? "y" : "ies"}.`, 3000);
        } catch (error) {
            console.warn("[loop.mp3] Could not import lyrics cache:", error);
            showLoopNotification(error.message || "Could not import lyrics cache", 3000);
        }
    });
    getAllLyricsCacheEntries().then((entries) => {
        allEntries = entries;
        renderEntries(allEntries);
        if (entries[0]) showDetails(entries[0]);
    });

    modal.querySelector(".loop-lyrics-cache-close").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
    modal.querySelector(".loop-lyrics-cache-close").focus();
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.getStoredLoopPreferences = getStoredLoopPreferences;
    global.normalizeTrackPresentationModes = normalizeTrackPresentationModes;
    global.getTrackPresentationMode = getTrackPresentationMode;
    global.saveLoopPreferences = saveLoopPreferences;
    global.getLyricsCacheKey = getLyricsCacheKey;
    global.getLyricsCacheStorage = getLyricsCacheStorage;
    global.getCachedLyrics = getCachedLyrics;
    global.getManualLyricsCacheKey = getManualLyricsCacheKey;
    global.getManualCachedLyrics = getManualCachedLyrics;
    global.cacheManuallySelectedLyrics = cacheManuallySelectedLyrics;
    global.cacheLyrics = cacheLyrics;
    global.removeCachedLyrics = removeCachedLyrics;
    global.restoreCachedLyrics = restoreCachedLyrics;
    global.getAllCachedLyrics = getAllCachedLyrics;
    global.getAllLyricsCacheEntries = getAllLyricsCacheEntries;
    global.saveLyricsCacheEntry = saveLyricsCacheEntry;
    global.removeLyricsCacheEntry = removeLyricsCacheEntry;
    global.isLyricsCacheStorageKey = isLyricsCacheStorageKey;
    global.getLyricsCacheExport = getLyricsCacheExport;
    global.importLyricsCacheExport = importLyricsCacheExport;
    global.showCachedLyricsModal = showCachedLyricsModal;
})(globalThis);
