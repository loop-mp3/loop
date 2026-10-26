const material3LoaderURL = LoopUtils.getExtensionURL("static/material3-loader.svg");

const braccatoLyricsShadowCSS = `
    :host { display: block; width: 100%; height: 100%; color: #fff; font-family: Satoshi, system-ui, sans-serif; }
    #loop-lyrics-shell { position: relative; display: block; width: 100%; height: 100%; min-height: 0; }
    #loop-lyrics-view { display: block; width: 100%; height: 100%; overflow: auto; scrollbar-width: none; }
    #loop-lyrics-view::-webkit-scrollbar { display: none; }
    #loop-lyrics-view[hidden], #loop-lyrics-loading[hidden], #loop-lyrics-footer[hidden] { display: none; }
    .blyrics--line { opacity: var(--blyrics-line-opacity, 0.3); transition: filter 250ms ease, opacity 250ms ease; }
    .blyrics--line:not(.blyrics--active) { filter: blur(2px); }
    .blyrics--line.blyrics--active { --blyrics-line-opacity: 1; filter: none; }
    #loop-lyrics-view.loop-ludo-progression .blyrics--line { transition: filter 420ms ease, opacity 420ms ease; }
    #loop-lyrics-view.loop-ludo-progression .blyrics--line:not(.blyrics--active) { filter: blur(3px); }
    #loop-lyrics-view.loop-ludo-progression .blyrics--line.blyrics--active { filter: none; }
    #loop-lyrics-loading { position: absolute; top: 50%; left: 50%; display: flex; align-items: center; gap: 12px; transform: translate(-50%, -50%); color: rgba(255,255,255,.7); font-size: 15px; white-space: nowrap; }
    .loop-lyrics-loading-content { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
    #blyrics-loader { --m3-loader-size: 28px; position: relative; display: block; overflow: visible !important; flex: 0 0 var(--m3-loader-size) !important; width: var(--m3-loader-size) !important; height: var(--m3-loader-size) !important; min-width: var(--m3-loader-size) !important; min-height: var(--m3-loader-size) !important; }
    #blyrics-loader::before { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; background-color: var(--m3-loader-color, var(--blyrics-ui-text-color, #fff)); -webkit-mask-image: url("${material3LoaderURL}"); mask-image: url("${material3LoaderURL}"); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: contain; mask-size: contain; filter: drop-shadow(0 2px 6px color-mix(in srgb, var(--m3-loader-color, var(--blyrics-ui-text-color, #fff)) 35%, transparent)); }
    .blyrics-container { --blyrics-font-family: Satoshi, system-ui, sans-serif; --blyrics-font-size: 3rem; --blyrics-line-height: 1.333; --blyrics-padding: 2rem; --blyrics-animate-word-wobble: 0; --blyrics-word-wobble-transform-from: scaleX(1); --blyrics-word-wobble-transform-peak: translateX(0.05em) scaleX(1.025); --blyrics-word-wobble-transform-settle: translateX(0) scaleX(1); --blyrics-word-wobble-transform-to: scaleX(1); }
    #loop-lyrics-view .blyrics-container { display: flex; flex-direction: column; min-height: 100%; }
    .blyrics-container .blyrics-word-highlight:not([data-long-word]) { --blyrics-glow-color: var(--blyrics-highlight-color, color(display-p3 1 1 1 / 0.5)); }
    .loop-track-writers-label { display: block; color: rgba(255,255,255,.72); font: 400 16px/1.2 Satoshi, system-ui, sans-serif; margin-bottom: .45em; }
    .loop-track-writers-names { display: block; color: #fff; font: 400 1.25em/1.25 Satoshi, system-ui, sans-serif; text-wrap: balance; }
    #loop-lyrics-footer { position: absolute; right: 0; bottom: 0; left: 0; z-index: 2; display: flex; align-items: center; justify-content: flex-start; gap: 8px; width: 100%; box-sizing: border-box; margin: 0; padding: 12px 0 16px .25em !important; border-top: 1px solid rgba(255,255,255,.12); visibility: hidden; opacity: 0; pointer-events: none; cursor: default; transform: none !important; transition: opacity 150ms ease; }
    #loop-lyrics-footer.is-visible { visibility: visible; opacity: 1; pointer-events: auto; background: transparent; }
    .loop-lyrics-footer-actions { display: flex; align-items: center; justify-content: flex-start; gap: 8px; }
    #loop-track-writers { position: absolute; right: 0; bottom: 85px; left: 0; z-index: 2; display: block; box-sizing: border-box; width: 100%; margin: 0; padding: 0 0 12px; color: #fff; text-align: center; font-size: 2.5rem; opacity: 0; transform: translateY(.5em); transition: opacity 700ms cubic-bezier(.22,1,.36,1), transform 700ms cubic-bezier(.22,1,.36,1); }
    #loop-track-writers.is-visible { opacity: 1; transform: translateY(0); }
    #loop-lyrics-footer[hidden] { display: none; }
    .loop-lyrics-footer-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; width: auto; height: 34px; min-width: 0; border: 1px solid rgba(255,255,255,.24); border-radius: 10px; padding: 0 13px; color: rgba(255,255,255,.86); background: rgba(255,255,255,.08); font: inherit; font-size: 12px; text-decoration: none; cursor: pointer; transition: border-color 150ms ease, background 150ms ease, color 150ms ease; }
    .loop-lyrics-footer-button .fa-solid { font-family: "Font Awesome 6 Free"; font-weight: 900; }
    .loop-lyrics-footer-button .fa-arrows-rotate::before { content: "\\f021"; }
    .loop-lyrics-footer-button .fa-up-right-from-square::before { content: "\\f35d"; }
    .loop-lyrics-submit-link, .loop-lyrics-instrumental-link { display: inline-block; margin: 0 8px 0 0; color: rgba(255,255,255,.82); text-decoration: underline; cursor: pointer; }
    #loop-lyrics-loading { z-index: 2; pointer-events: auto; }
    .loop-lyrics-manual-selection-link { display: inline-flex; align-items: center; margin-top: 4px; padding: 6px 10px; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; color: rgba(255,255,255,.86); background: rgba(255,255,255,.08); box-shadow: 0 4px 16px rgba(0,0,0,.18); backdrop-filter: blur(10px); cursor: pointer; font: inherit; font-size: 12px; pointer-events: auto; }
    .loop-lyrics-manual-selection-link:hover, .loop-lyrics-manual-selection-link:focus-visible { border-color: rgba(255,255,255,.62); background: rgba(255,255,255,.16); }
    .loop-lyrics-footer-button:hover, .loop-lyrics-footer-button:focus-visible { border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.16); color: #fff; }
    .loop-lyrics-footer-button:disabled { cursor: wait; opacity: .55; }
    .loop-lyrics-footer-provider { height: 34px; max-width: 115px; border: 1px solid rgba(255,255,255,.24); border-radius: 10px; padding: 0 8px; color: rgba(255,255,255,.86); background: rgba(255,255,255,.08); font: inherit; font-size: 12px; cursor: pointer; }
    .loop-lyrics-footer-provider:focus-visible { outline: 2px solid rgba(255,255,255,.8); outline-offset: 1px; }
    .loop-lyrics-footer-provider option { color: #fff; background: #181818; }
    #loop-lyrics-resume { position: absolute; top: 16px; left: 50%; z-index: 3; display: inline-flex; align-items: center; justify-content: center; min-height: 34px; border: 1px solid rgba(255,255,255,.28); border-radius: 999px; padding: 0 14px; color: #fff; background: rgba(12,20,19,.88); box-shadow: 0 8px 24px rgba(0,0,0,.24); backdrop-filter: blur(10px); font: inherit; font-size: 12px; cursor: pointer; transform: translateX(-50%); transition: border-color 150ms ease, background 150ms ease; }
    #loop-lyrics-resume:hover, #loop-lyrics-resume:focus-visible { border-color: rgba(255,255,255,.68); background: rgba(255,255,255,.16); }
    #loop-lyrics-resume[hidden] { display: none; }
`;
lyricsProviderService = LoopLyricsServices.createLyricsProviderService({
    providers: lyricsProviders,
    getEnabledProviderIds: getLyricsProviderOrder,
    dependencies: {
        getPreferences: () => loopPreferences,
        normalizeLyricsResponse,
        lyricsPlusToTTML,
        hasSyncedLyricTimestamps,
        lyricsDurationExceedsTrack,
    },
});

function removeTrailingWriterCreditLines(lines, songwriters) {
    const names = songwriters.filter(Boolean).map((name) => String(name).trim()).filter(Boolean);
    if (!names.length || !lines.length) return lines;

    const fullCredit = normalizeWriterCreditText(names.join(" "));
    const individualCredits = new Set(names.map(normalizeWriterCreditText));
    let end = lines.length;
    while (end > 0) {
        const rawLine = String(lines[end - 1].words || "").trim();
        const line = normalizeWriterCreditText(rawLine);
        if (!line) {
            end--;
            continue;
        }
        if (
            line === fullCredit ||
            line.startsWith(fullCredit + " ") ||
            individualCredits.has(line) ||
            /^written\s+by\b/i.test(rawLine)
        ) {
            end--;
            continue;
        }
        break;
    }
    return end === lines.length ? lines : lines.slice(0, end);
}

function loadBraccatoLyrics() {
    if (!braccatoLyricsPromise) {
        braccatoLyricsPromise = Promise.all([
            import(getExtensionURL("modules/braccato/renderer.js")),
            import(getExtensionURL("modules/braccato/inject.js")),
            import(getExtensionURL("ludo/index.js")),
        ])
            .then(async ([{ createLyricsRenderer }, { injectTranslation }, ludo]) => ({
                createLyricsRenderer,
                injectTranslation,
                createLudoLyricsController: ludo.createLudoLyricsController,
                styles: await Promise.all(["variables.css", "lyrics.css", "instrumental.css"].map(async (file) => {
                    const response = await fetch(getExtensionURL(`modules/braccato/styles/${file}`));
                    if (!response.ok) throw new Error(`Could not load Braccato stylesheet ${file}`);
                    return response.text();
                })),
            }));
    }
    return braccatoLyricsPromise;
}

function getGeniusLyricsURL(title, artist) {
    const slugify = (value) => String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    const artistSlug = slugify(artist);
    const titleSlug = slugify(title);
    return `${geniusURL}/${artistSlug}-${titleSlug}-lyrics`;
}

function ensureLyricsFooter(shadow) {
    let footer = shadow.querySelector("#loop-lyrics-footer");
    if (footer) return footer;

    footer = document.createElement("div");
    footer.id = "loop-lyrics-footer";
    footer.hidden = true;

    const reloadButton = document.createElement("button");
    reloadButton.className = "loop-lyrics-footer-button";
    reloadButton.type = "button";
    reloadButton.setAttribute("aria-label", "Reload lyrics");
    reloadButton.title = "Reload lyrics";
    reloadButton.innerHTML = '<i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i><span>Reload lyrics</span>';
    reloadButton.addEventListener("click", () => {
        reloadButton.disabled = true;
        fetchLoopLyricsForCurrentTrack(true).finally(() => {
            reloadButton.disabled = false;
        });
    });

    const geniusLink = document.createElement("a");
    geniusLink.className = "loop-lyrics-footer-button loop-lyrics-genius-link";
    geniusLink.target = "_blank";
    geniusLink.rel = "noopener noreferrer";
    geniusLink.setAttribute("aria-label", "Open lyrics in Genius");
    geniusLink.title = "Open lyrics in Genius";
    geniusLink.innerHTML = '<span>Search on Genius</span>';

    const reselectButton = document.createElement("button");
    reselectButton.className = "loop-lyrics-footer-button loop-lyrics-reselect-button";
    reselectButton.type = "button";
    reselectButton.setAttribute("aria-label", "Reselect lyrics");
    reselectButton.title = "Search and reselect lyrics";
    reselectButton.textContent = "Reselect lyrics";
    reselectButton.addEventListener("click", () => {
        const loop = document.querySelector("#loop");
        const trackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
        if (!trackId) return;
        showLyricsCandidateModal(
            trackId,
            loop?.querySelector("#loop-track-title")?.textContent.trim() || "Unknown title",
            loop?.querySelector("#loop-track-artist")?.textContent.trim() || "Unknown artist",
            getCurrentTrackDurationInSeconds()
        );
    });

    const providerSelect = document.createElement("select");
    providerSelect.className = "loop-lyrics-footer-provider";
    providerSelect.setAttribute("aria-label", "Lyrics provider for current track");
    providerSelect.title = "Lyrics provider for current track";
    providerSelect.addEventListener("change", () => {
        const trackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
        currentTrackLyricsProvider = { trackId, providerId: providerSelect.value };
        fetchLoopLyricsForCurrentTrack();
    });

    const actions = document.createElement("div");
    actions.className = "loop-lyrics-footer-actions";
    actions.append(reloadButton, reselectButton, providerSelect, geniusLink);
    footer.append(actions);
    shadow.appendChild(footer);
    return footer;
}

function ensureLyricsResumeButton(shadow) {
    let button = shadow.querySelector("#loop-lyrics-resume");
    if (button) return button;

    const shell = shadow.querySelector("#loop-lyrics-shell");
    if (!shell) return null;

    button = document.createElement("button");
    button.id = "loop-lyrics-resume";
    button.type = "button";
    button.hidden = true;
    button.textContent = "Resume auto scroll";
    button.setAttribute("aria-label", "Resume auto scroll to the active lyric");
    button.addEventListener("click", () => {
        button.hidden = true;
        braccatoLyricsRenderer?.resumeAutoscroll();
        updatePlaybackControls();
    });
    shell.appendChild(button);
    return button;
}

function setLyricsResumeAffordanceVisible(shadow, visible) {
    const button = ensureLyricsResumeButton(shadow);
    if (button) button.hidden = !visible;
}

function syncLyricsFooterVisibility(shadow) {
    const view = shadow.querySelector("#loop-lyrics-view");
    const footer = shadow.querySelector("#loop-lyrics-footer");
    if (!view || !footer || footer.hidden) return;
    const endThreshold = Math.max(footer.offsetHeight + 24, view.clientHeight * 0.08);
    const lyricLines = view.querySelectorAll(".blyrics-container .blyrics--line");
    const lastLyric = lyricLines[lyricLines.length - 1];
    const lastLyricFocused = lastLyric?.classList.contains("blyrics--active") ||
        lastLyric?.getAttribute("aria-current") === "true";
    // The standard renderer marks the current line, while Ludo
    // drives the same scroll view without relying on that marker. Use the scroll
    // position as the shared source of truth and keep the marker as an early signal.
    const reachedEnd = Boolean(lastLyricFocused) ||
        view.scrollTop + view.clientHeight >= view.scrollHeight - endThreshold;
    footer.classList.toggle("is-visible", reachedEnd);
    const writers = shadow.querySelector("#loop-track-writers");
    if (writers) {
        writers.classList.toggle("is-visible", reachedEnd);
        writers.hidden = !reachedEnd;
    }
}

function showLyricsCandidateModal(trackId, title, artist, duration) {
    document.getElementById("loop-lyrics-candidate-modal")?.remove();

    const modal = document.createElement("div");
    modal.id = "loop-lyrics-candidate-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-lyrics-candidate-title");

    const card = document.createElement("section");
    card.className = "loop-lyrics-candidate-card";
    const header = document.createElement("header");
    header.className = "loop-lyrics-candidate-header";
    const heading = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "loop-lyrics-candidate-kicker";
    kicker.textContent = "Manual lyrics selection";
    const titleElement = document.createElement("h2");
    titleElement.id = "loop-lyrics-candidate-title";
    titleElement.textContent = "Choose the correct lyrics";
    heading.append(kicker, titleElement);
    const closeButton = document.createElement("button");
    closeButton.className = "loop-lyrics-candidate-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close lyrics candidates");
    closeButton.textContent = "×";
    header.append(heading, closeButton);

    const trackLabel = document.createElement("p");
    trackLabel.className = "loop-lyrics-candidate-track";
    const queryControls = document.createElement("div");
    queryControls.className = "loop-lyrics-candidate-query";
    const queryInput = document.createElement("input");
    queryInput.type = "search";
    queryInput.className = "loop-lyrics-candidate-query-input";
    queryInput.setAttribute("aria-label", "Lyrics search query");
    queryInput.value = `${title} ${artist}`.trim();
    queryInput.placeholder = "Search title, artist, or alternate wording";
    const searchButton = document.createElement("button");
    searchButton.type = "button";
    searchButton.className = "loop-lyrics-candidate-search";
    searchButton.textContent = "Search again";
    queryControls.append(queryInput, searchButton);
    trackLabel.textContent = `${title} · ${artist}`;
    const status = document.createElement("p");
    status.className = "loop-lyrics-candidate-status";
    status.textContent = "Searching all lyrics providers…";
    const list = document.createElement("div");
    list.className = "loop-lyrics-candidate-list";
    list.setAttribute("role", "list");
    card.append(header, trackLabel, queryControls, status, list);
    modal.appendChild(card);
    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    closeButton.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
    closeButton.focus();

    const runSearch = () => {
        searchButton.disabled = true;
        status.textContent = "Searching all lyrics providersâ€¦";
        list.replaceChildren();
        getLyricsCandidatesForAllProviders(trackId, title, artist, duration, queryInput.value.trim()).then((candidates) => {
        if (!modal.isConnected) return;
        status.textContent = candidates.length
            ? `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} found`
            : "No candidates were returned. Try a different query.";
        searchButton.disabled = false;
        if (!candidates.length) return;

        candidates.forEach((candidate, candidateIndex) => {
            const lyrics = candidate.lyrics;
            const meta = lyrics.meta || {};
            const row = document.createElement("article");
            row.className = "loop-lyrics-candidate-row";
            row.setAttribute("role", "listitem");

            const provider = document.createElement("div");
            provider.className = "loop-lyrics-candidate-provider";
            provider.textContent = candidate.provider.label;
            const details = document.createElement("div");
            details.className = "loop-lyrics-candidate-details";
            const candidateTitle = document.createElement("strong");
            candidateTitle.textContent = meta.trackName || meta.title || meta.name || "Untitled result";
            const candidateArtist = document.createElement("span");
            candidateArtist.textContent = meta.artistName || meta.artist || meta.albumName || "Unknown artist";
            const candidateMeta = document.createElement("small");
            const durationText = Number.isFinite(Number(meta.duration)) ? `${Number(meta.duration).toFixed(1)}s` : "duration unknown";
            const syncText = lyrics.syncedLyrics ? "synced" : lyrics.plainLyrics ? "plain text" : "instrumental";
            candidateMeta.textContent = `#${candidateIndex + 1} · ${durationText} · ${syncText}${meta.id ? ` · ID ${meta.id}` : ""}`;
            details.append(candidateTitle, candidateArtist, candidateMeta);

            const metaDetails = document.createElement("details");
            const metaSummary = document.createElement("summary");
            metaSummary.textContent = "Metadata";
            const metaPre = document.createElement("pre");
            metaPre.textContent = JSON.stringify(meta, null, 2);
            metaDetails.append(metaSummary, metaPre);
            const lyricsDetails = document.createElement("details");
            const lyricsSummary = document.createElement("summary");
            lyricsSummary.textContent = "View / edit lyrics";
            const syncedLabel = document.createElement("label");
            syncedLabel.className = "loop-lyrics-candidate-editor-label";
            syncedLabel.textContent = "Synced lyrics (LRC)";
            const syncedEditor = document.createElement("textarea");
            syncedEditor.className = "loop-lyrics-candidate-editor";
            syncedEditor.value = lyrics.syncedLyrics || "";
            syncedEditor.rows = 7;
            syncedEditor.spellcheck = false;
            syncedLabel.appendChild(syncedEditor);
            const plainLabel = document.createElement("label");
            plainLabel.className = "loop-lyrics-candidate-editor-label";
            plainLabel.textContent = "Plain lyrics fallback";
            const plainEditor = document.createElement("textarea");
            plainEditor.className = "loop-lyrics-candidate-editor";
            plainEditor.value = lyrics.plainLyrics || "";
            plainEditor.rows = 4;
            plainEditor.spellcheck = false;
            plainLabel.appendChild(plainEditor);
            const offsetLabel = document.createElement("label");
            offsetLabel.className = "loop-lyrics-candidate-editor-label loop-lyrics-candidate-offset-label";
            const offsetHeader = document.createElement("span");
            offsetHeader.textContent = "Sync offset";
            const offsetValue = document.createElement("output");
            offsetValue.textContent = "0.00s";
            offsetHeader.append(" ", offsetValue);
            const offsetSlider = document.createElement("input");
            offsetSlider.className = "loop-lyrics-candidate-offset";
            offsetSlider.type = "range";
            offsetSlider.min = "-10";
            offsetSlider.max = "10";
            offsetSlider.step = "0.05";
            offsetSlider.value = "0";
            offsetSlider.setAttribute("aria-label", "Adjust lyric synchronization offset in seconds");
            const offsetInput = document.createElement("input");
            offsetInput.className = "loop-lyrics-candidate-offset-value";
            offsetInput.type = "number";
            offsetInput.min = "-10";
            offsetInput.max = "10";
            offsetInput.step = "0.05";
            offsetInput.value = "0";
            offsetInput.setAttribute("aria-label", "Exact lyric synchronization offset in seconds");
            offsetSlider.addEventListener("input", () => {
                const value = Number(offsetSlider.value);
                offsetInput.value = value.toFixed(2);
                offsetValue.textContent = `${value >= 0 ? "+" : ""}${value.toFixed(2)}s`;
            });
            offsetInput.addEventListener("input", () => {
                const value = Math.max(-10, Math.min(10, Number(offsetInput.value) || 0));
                offsetSlider.value = String(value);
                offsetValue.textContent = `${value >= 0 ? "+" : ""}${value.toFixed(2)}s`;
            });
            offsetLabel.append(offsetHeader, offsetInput, offsetSlider);
            lyricsDetails.append(lyricsSummary, syncedLabel, plainLabel, offsetLabel);
            const selectButton = document.createElement("button");
            selectButton.className = "loop-lyrics-candidate-select";
            selectButton.type = "button";
            selectButton.textContent = "Use this";
            selectButton.addEventListener("click", () => {
                const activeTrackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
                if (activeTrackId !== trackId) {
                    status.textContent = "This track has changed; search again for its candidates.";
                    return;
                }
                const editedLyrics = {
                    ...lyrics,
                    meta: {
                        ...lyrics.meta,
                        manualOffsetSeconds: Number(offsetSlider.value),
                        manuallyEdited: syncedEditor.value !== (lyrics.syncedLyrics || "") ||
                            plainEditor.value !== (lyrics.plainLyrics || "") ||
                            Number(offsetSlider.value) !== 0,
                    },
                    syncedLyrics: applyLyricsTimestampOffset(syncedEditor.value.trim(), Number(offsetSlider.value)),
                    plainLyrics: plainEditor.value.trim() || null,
                };
                if (!editedLyrics.syncedLyrics && !editedLyrics.plainLyrics && !editedLyrics.meta.instrumental) {
                    status.textContent = "Add synced or plain lyrics before selecting this candidate.";
                    lyricsDetails.open = true;
                    return;
                }
                lyricsRequestId++;
                clearLyricsRetryTimer();
                currentTrackLyricsProvider = { trackId, providerId: candidate.provider.id };
                Promise.all([
                    cacheManuallySelectedLyrics(trackId, title, artist, duration, editedLyrics),
                    cacheLyrics(trackId, title, artist, duration, editedLyrics),
                ]).catch((error) => {
                    console.warn("[loop.mp3] Could not store adjusted lyrics caches:", error);
                }).finally(() => {
                    const activeTrackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
                    if (activeTrackId === trackId) {
                        fetchLoopLyricsForCurrentTrack(false);
                    }
                });
                close();
                showLoopNotification(`Using ${candidate.provider.label} lyrics`, 2500);
            });
            row.append(provider, details, metaDetails, lyricsDetails, selectButton);
            list.appendChild(row);
        });
        }).catch((error) => {
            if (!modal.isConnected) return;
            searchButton.disabled = false;
            status.textContent = "Could not search the lyrics providers. Try a different query.";
            console.warn("[loop.mp3] Could not load lyrics candidates:", error);
        });
    };
    searchButton.addEventListener("click", runSearch);
    queryInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") runSearch();
    });
    runSearch();
}

function ensureManualLyricsSelectionLink(loading, trackId) {
    let link = loading.querySelector(".loop-lyrics-manual-selection-link");
    if (link) return link;
    link = document.createElement("button");
    link.className = "loop-lyrics-manual-selection-link";
    link.type = "button";
    link.textContent = "Select lyrics manually";
    let openedByPointer = false;
    const openManualSelection = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        // Once the user chooses manual selection, stale provider responses must
        // not replace the loading view or steal the interaction from the modal.
        lyricsRequestId++;
        clearLyricsRetryTimer();
        const loop = document.querySelector("#loop");
        const currentTrackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId || trackId;
        if (!currentTrackId) return;
        showLyricsCandidateModal(
            currentTrackId,
            loop?.querySelector("#loop-track-title")?.textContent.trim() || "Unknown title",
            loop?.querySelector("#loop-track-artist")?.textContent.trim() || "Unknown artist",
            getCurrentTrackDurationInSeconds()
        );
    };
    link.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        openedByPointer = true;
        openManualSelection(event);
    });
    link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (openedByPointer) {
            openedByPointer = false;
            return;
        }
        openManualSelection(event);
    });
    loading.querySelector(".loop-lyrics-loading-content")?.append(link);
    return link;
}

function bindLyricsFooterScroll(shadow) {
    const view = shadow.querySelector("#loop-lyrics-view");
    if (!view || view.dataset.loopLyricsFooterScrollBound) return;
    view.dataset.loopLyricsFooterScrollBound = "true";
    view.addEventListener("scroll", () => syncLyricsFooterVisibility(shadow), { passive: true });
    const lyricsContainer = view.querySelector(".blyrics-container");
    if (lyricsContainer) {
        const observer = new MutationObserver(() => syncLyricsFooterVisibility(shadow));
        observer.observe(lyricsContainer, { subtree: true, attributes: true, attributeFilter: ["class", "aria-current"] });
    }
}

function updateLyricsFooter(shadow, lyrics, songwriters = [], hasSungLyrics = true) {
    const footer = ensureLyricsFooter(shadow);
    const lyricsContainer = shadow.querySelector(".blyrics-container");
    if (lyricsContainer) {
        let writers = shadow.querySelector("#loop-track-writers");
        if (!writers) {
            writers = document.createElement("div");
            writers.id = "loop-track-writers";
            footer.parentElement.insertBefore(writers, footer);
        }
        const availableSongwriters = songwriters.length > 0 ? songwriters : currentTrackWriters;
        const safeNames = loopPreferences.showWriterCredits !== false && !lyrics?.meta?.instrumental && hasSungLyrics
            ? availableSongwriters
            .filter(Boolean)
            .map((name) => String(name).replace(/[&<>"']/g, (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[character])))
            .join(", ")
            : "";
        writers.innerHTML = safeNames
            ? '<span class="loop-track-writers-label">Written by</span><span class="loop-track-writers-names">' + safeNames + "</span>"
            : "";
        writers.dataset.hasCredits = String(Boolean(safeNames));
        writers.hidden = !safeNames;
    }
    bindLyricsFooterScroll(shadow);
    const providerSelect = footer.querySelector("select");
    if (providerSelect) {
        const selectedProvider = lyrics?.meta?.provider || getLyricsProviderOrder()[0];
        providerSelect.replaceChildren(...lyricsProviders.map((provider) => {
            const option = new Option(provider.label, provider.id);
            option.selected = provider.id === selectedProvider;
            return option;
        }));
        providerSelect.value = selectedProvider;
    }
    const loop = document.querySelector("#loop");
    const title = loop?.querySelector("#loop-track-title")?.textContent.trim();
    const artist = loop?.querySelector("#loop-track-artist")?.textContent.trim();
    const geniusLink = footer.querySelector(".loop-lyrics-genius-link");
    if (geniusLink && title && artist) geniusLink.href = getGeniusLyricsURL(title, artist);
    footer.hidden = false;
    syncLyricsFooterVisibility(shadow);
}

async function translateLyricsLines(parsedLyrics, trackId) {
    const targetLanguage = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
    const lines = parsedLyrics.map((line) => String(line.words || ""));
    if (!lines.some((line) => line.trim()) || lines.length > 200) return null;

    const cacheKey = getTranslationCacheKey(trackId, targetLanguage);
    if (loopPreferences.useLyricsCache !== false) {
        const cachedTranslation = await getCachedTranslation(trackId, targetLanguage, lines.length);
        if (cachedTranslation) {
            console.log("[loop.mp3] Using cached translation:", { trackId, targetLanguage });
            return cachedTranslation;
        }
    }

    const pendingRequest = translationRequestCache.get(cacheKey);
    if (pendingRequest) return pendingRequest;

    const translationRequest = (async () => {
        const response = await fetch(lyricsTranslationEndpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ lines, to: targetLanguage }),
        });
        if (!response.ok) {
            const error = new Error(`Unison returned ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const result = await response.json();
        if (!isValidTranslationResult(result, parsedLyrics.length)) {
            throw new Error("Unison returned an invalid line mapping");
        }
        if (loopPreferences.useLyricsCache !== false) {
            await cacheTranslation(trackId, targetLanguage, result);
        }
        return result;
    })();

    translationRequestCache.set(cacheKey, translationRequest);
    try {
        return await translationRequest;
    } finally {
        if (translationRequestCache.get(cacheKey) === translationRequest) {
            translationRequestCache.delete(cacheKey);
        }
    }
}

function waitForUnisonTranslationRetry(delayMs) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function translateLyricsLinesWithRetry(
    parsedLyrics,
    trackId,
    shouldContinue = () => true,
    onRetry = () => {}
) {
    for (let attempt = 0; ; attempt += 1) {
        if (!shouldContinue()) return null;
        try {
            return await translateLyricsLines(parsedLyrics, trackId);
        } catch (error) {
            const retryDelayMs = error?.status !== 200
                ? unisonTranslationRetryDelaysMs[attempt]
                : undefined;
            if (retryDelayMs === undefined) throw error;
            if (!shouldContinue()) return null;
            onRetry(attempt);
            console.warn(
                `[loop.mp3] Unison is unavailable; retrying translation in ${retryDelayMs / 1_000} seconds.`
            );
            await waitForUnisonTranslationRetry(retryDelayMs);
        }
    }
}

function applyTranslatedLyrics(shadow, parsedLyrics, result, injectTranslation) {
    const renderedLines = braccatoLyricsRenderer?.lines || [];
    const targetLanguage = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
    result.lines.forEach((translated, index) => {
        const line = renderedLines[index];
        if (!line?.lyricElement || !translated || !translated.needsTranslation) return;
        const sourceLanguage = result.detectedLang || "und";
        line.lyricElement.lang = sourceLanguage;
        const translation = translated.needsTranslation && typeof translated.translation === "string"
            ? translated.translation.trim()
            : "";
        if (translation) injectTranslation(document, line.lyricElement, translation, targetLanguage);
        line.lyricElement.dataset.translationSource = sourceLanguage;
    });
    braccatoLyricsRenderer?.scheduleLyricPositionUpdate(
        () => true,
        () => updatePlaybackControls()
    );
}

function updateLoopLyrics(lyrics, empty = false, songwriters = currentTrackWriters) {
    const panel = document.querySelector("#loop-lyrics-panel");
    const host = panel?.querySelector("#loop-lyrics-host");
    if (!panel || !host) return;
    if (!loopPreferences.showLyrics) {
        clearLyricsRetryTimer();
        panel.hidden = true;
        ludoLyricsController?.destroy();
        ludoLyricsController = null;
        braccatoLyricsRenderer?.clear();
        return;
    }
    const requestId = lyricsRequestId;
    const trackId = getCurrentTrackId(getYTMPlayerRoot()) ||
        (getCurrentMedia() ? lastTrackId : undefined);
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    if (!shadow.querySelector("#loop-lyrics-loading")) {
        const style = document.createElement("style");
        style.textContent = braccatoLyricsShadowCSS;
        shadow.appendChild(style);
        const loading = document.createElement("div");
        loading.id = "loop-lyrics-loading";
        loading.setAttribute("role", "status");
        const spinner = document.createElement("span");
        spinner.id = "blyrics-loader";
        spinner.className = "loop-lyrics-spinner";
        spinner.setAttribute("aria-hidden", "true");
        const loadingLabel = document.createElement("span");
        loadingLabel.className = "loop-lyrics-loading-label";
        loadingLabel.textContent = "Resolving lyrics";
        const loadingContent = document.createElement("div");
        loadingContent.className = "loop-lyrics-loading-content";
        loadingContent.appendChild(loadingLabel);
        loading.append(spinner, loadingContent);
        shadow.appendChild(loading);
    }
    const loading = shadow.querySelector("#loop-lyrics-loading");
    const footer = ensureLyricsFooter(shadow);

    if (empty) {
        clearLyricsRetryTimer();
        panel.hidden = true;
        footer.hidden = true;
        setLyricsResumeAffordanceVisible(shadow, false);
        currentParsedLyrics = [];
        currentLyricsRenderOptions = {};
        braccatoLyricsRenderer?.clear();
        return;
    }

    const hasExistingRenderedLyrics = currentParsedLyrics.length > 0 && lyricsLoadedTrackId === trackId;
    panel.hidden = false;
    if (!hasExistingRenderedLyrics) {
        loading.hidden = false;
        footer.hidden = true;
        setLyricsResumeAffordanceVisible(shadow, false);
        shadow.querySelector("#loop-lyrics-view")?.setAttribute("hidden", "");
        loading.querySelector(".loop-lyrics-submit-link")?.remove();
        loading.querySelector(".loop-lyrics-instrumental-link")?.remove();
        loading.querySelector(".loop-lyrics-manual-selection-link")?.remove();
    }
    if (lyrics === undefined) {
        if (!hasExistingRenderedLyrics) {
            loading.querySelector(".loop-lyrics-loading-label").textContent = "Resolving lyrics";
            ensureManualLyricsSelectionLink(loading, trackId);
        }
        return;
    }

    const mediaDuration = getCurrentMedia()?.duration;
    const metadataDuration = Number(lyrics?.meta?.duration);
    const mediaDurationMs = Number.isFinite(mediaDuration) && mediaDuration > 0
        ? mediaDuration * 1_000
        : 0;
    const metadataDurationMs = Number.isFinite(metadataDuration) && metadataDuration > 0
        ? metadataDuration * 1_000
        : 0;
    const parsedLyrics = removeTrailingWriterCreditLines(parseSyncedLyrics(
        lyrics?.syncedLyrics,
        lyrics?.plainLyrics,
        mediaDurationMs > 0 ? mediaDurationMs : metadataDurationMs,
        lyrics?.meta?.instrumental === true
    ), songwriters);
    if (!parsedLyrics.length) {
        // A late provider miss or malformed response must not erase lyrics already
        // rendered for this track. The caller can continue resolution without flashing blank.
        if (currentParsedLyrics.length && lyricsLoadedTrackId === trackId) {
            console.warn("[loop.mp3] Ignoring empty lyrics replacement for an already-rendered track:", {
                trackId,
                provider: lyrics?.meta?.provider || null,
            });
            return;
        }
        currentParsedLyrics = [];
        currentLyricsRenderOptions = {};
        braccatoLyricsRenderer?.clear();
        loading.querySelector(".loop-lyrics-loading-label").textContent = "Hmm.. we arent quite there still searching for them";
        ensureManualLyricsSelectionLink(loading, trackId);
        const instrumentalLink = document.createElement("a");
        instrumentalLink.className = "loop-lyrics-instrumental-link";
        instrumentalLink.href = grooveEditorURL;
        instrumentalLink.target = "_blank";
        instrumentalLink.rel = "noopener noreferrer";
        instrumentalLink.textContent = "Know the correct lyrics?";
        loading.querySelector(".loop-lyrics-loading-content")?.append(instrumentalLink);
        if (lyrics?.meta?.lyricsUnavailable !== true) {
            scheduleLyricsRetry(trackId);
        }
        showLoopNotification("Lyrics unavailable", 3000);
        return;
    }

    clearLyricsRetryTimer();
    loading.querySelector(".loop-lyrics-loading-label").textContent = "Resolving lyrics";
    loadBraccatoLyrics().then(({ createLyricsRenderer, createLudoLyricsController: ludoFactory, injectTranslation, styles }) => {
        createLudoLyricsController = ludoFactory;
        if (
            requestId !== lyricsRequestId ||
            !loopPreferences.showLyrics ||
            trackId !== (getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId)
        ) return;
        let view = shadow.querySelector("#loop-lyrics-view");
        if (!view) {
            const style = document.createElement("style");
            style.textContent = styles.join("\n");
            shadow.appendChild(style);
            const themeStyle = document.createElement("style");
            themeStyle.textContent = getBraccatoLyricsTheme();
            shadow.appendChild(themeStyle);
            view = document.createElement("div");
            view.id = "loop-lyrics-view";
            view.hidden = true;
            const shell = document.createElement("div");
            shell.id = "loop-lyrics-shell";
            shell.appendChild(view);
            shell.appendChild(footer);
            shadow.appendChild(shell);
        }
        ensureLyricsResumeButton(shadow);
        if (braccatoLyricsMount !== view) {
            braccatoLyricsRenderer?.destroy();
            braccatoLyricsRenderer = createLyricsRenderer({
                document,
                window,
                mount: view,
                layout: "scroll",
                host: {
                    setResumeAffordanceVisible(visible) {
                        setLyricsResumeAffordanceVisible(shadow, visible);
                    },
                    seek(timeS) {
                        const media = getCurrentMedia();
                        if (!media) {
                            console.warn("[loop.mp3] Cannot seek lyrics because no playable media element is available.");
                            return;
                        }
                        media.currentTime = Math.max(0, Math.min(timeS, media.duration));
                        updatePlaybackControls(media);
                    },
                },
            });
            braccatoLyricsMount = view;
        }
        braccatoLyricsRenderer.setTheme(getBraccatoLyricsTheme());
        currentParsedLyrics = parsedLyrics;
        lyricsLoadedTrackId = trackId;
        currentLyricsRenderOptions = {
            noLyrics: false,
            songwriters,
            // Songwriter credits belong to the shell footer, not the scrollable lyric content.
            showCredits: false,
        };
        braccatoLyricsRenderer.setLyrics(
            getLyricsForRenderingEngine(currentParsedLyrics),
            currentLyricsRenderOptions
        );
        applyLyricsAnimationPreferences();
        applyLyricsRenderingEngine();

        if (requestId !== lyricsRequestId || !loopPreferences.showLyrics) return;
        loading.hidden = true;
        view.hidden = false;
        updateLyricsFooter(
            shadow,
            lyrics,
            songwriters,
            parsedLyrics.some((line) => !line.isInstrumental && line.words?.trim())
        );
        updatePlaybackControls();

        if (loopPreferences.enableLyricsTranslation === true && lyrics?.meta?.instrumental !== true) {
            loading.querySelector(".loop-lyrics-loading-label").textContent = "Translating lyrics";
            const isCurrentLyricsRequest = () => requestId === lyricsRequestId &&
                loopPreferences.showLyrics &&
                trackId === (getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId);
            let translationRetried = false;
            translateLyricsLinesWithRetry(parsedLyrics, trackId, isCurrentLyricsRequest, () => {
                if (translationRetried) return;
                translationRetried = true;
                showLoopNotification("Hmm… not quite there, still finding the translation.", 4000);
            }).then((translated) => {
                if (translated && isCurrentLyricsRequest()) {
                    applyTranslatedLyrics(shadow, parsedLyrics, translated, injectTranslation);
                    if (translationRetried) showLoopNotification("Translation found.", 3000);
                }
            }).catch((error) => {
                console.warn("[loop.mp3] Could not translate lyrics; showing originals:", error);
            });
        }
    }).catch((error) => {
        console.warn("[loop.mp3] Could not load Braccato lyrics renderer:", error);
        loading.querySelector(".loop-lyrics-loading-label").textContent = "Lyrics could not load";
    });
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.removeTrailingWriterCreditLines = removeTrailingWriterCreditLines;
    global.loadBraccatoLyrics = loadBraccatoLyrics;
    global.getGeniusLyricsURL = getGeniusLyricsURL;
    global.ensureLyricsFooter = ensureLyricsFooter;
    global.ensureLyricsResumeButton = ensureLyricsResumeButton;
    global.setLyricsResumeAffordanceVisible = setLyricsResumeAffordanceVisible;
    global.syncLyricsFooterVisibility = syncLyricsFooterVisibility;
    global.showLyricsCandidateModal = showLyricsCandidateModal;
    global.ensureManualLyricsSelectionLink = ensureManualLyricsSelectionLink;
    global.bindLyricsFooterScroll = bindLyricsFooterScroll;
    global.updateLyricsFooter = updateLyricsFooter;
    global.translateLyricsLines = translateLyricsLines;
    global.waitForUnisonTranslationRetry = waitForUnisonTranslationRetry;
    global.translateLyricsLinesWithRetry = translateLyricsLinesWithRetry;
    global.applyTranslatedLyrics = applyTranslatedLyrics;
    global.updateLoopLyrics = updateLoopLyrics;
    Object.defineProperty(global, 'braccatoLyricsShadowCSS', { configurable: true, get: () => braccatoLyricsShadowCSS, set: (value) => { braccatoLyricsShadowCSS = value; } });
})(globalThis);
