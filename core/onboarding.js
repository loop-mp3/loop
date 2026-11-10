function getOnboardingStorageKey() {
    return `${getInstalledVersion()}IsOnboarded`;
}

function isOnboardingComplete() {
    try {
        return JSON.parse(localStorage.getItem(getOnboardingStorageKey()) || "false") === true;
    } catch {
        return false;
    }
}

function completeOnboarding() {
    try {
        // localStorage stores strings, so JSON preserves the requested boolean value.
        localStorage.setItem(getOnboardingStorageKey(), JSON.stringify(true));
    } catch {
        // The onboarding is still useful if storage is unavailable for this page.
    }
}

function escapeHTML(value) {
    return LoopUtils.escapeHTML(value);
}

function renderChangelogMarkdown(markdown) {
    const inline = (value) => escapeHTML(value)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    const output = [];
    let listItems = [];
    const flushList = () => {
        if (!listItems.length) return;
        output.push(`<ul>${listItems.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
        listItems = [];
    };

    String(markdown).split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList();
            return;
        }
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        const listItem = trimmed.match(/^[-*+]\s+(.+)$/);
        if (heading) {
            flushList();
            const level = Math.min(heading[1].length + 1, 4);
            output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
        } else if (listItem) {
            listItems.push(listItem[1]);
        } else {
            flushList();
            output.push(`<p>${inline(trimmed)}</p>`);
        }
    });
    flushList();
    return output.join("");
}

function showOnboarding() {
    if (isOnboardingComplete() || document.getElementById("loop-onboarding-modal")) return;

    const modal = document.createElement("div");
    modal.id = "loop-onboarding-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-onboarding-title");
    modal.innerHTML = `
        <div class="loop-onboarding-card">
            <div class="loop-onboarding-header">
                <div>
                    <div class="loop-onboarding-kicker">Welcome to Loop</div>
                    <h2 id="loop-onboarding-title">What’s new</h2>
                </div>
                <button type="button" class="loop-onboarding-close" aria-label="Skip onboarding">&#215;</button>
            </div>
            <div class="loop-onboarding-step" data-step="0" data-title="What’s new">
                <p class="loop-onboarding-description">Here’s what changed in the latest release.</p>
                <div class="loop-onboarding-changelog" aria-live="polite">Loading changelog...</div>
            </div>
            <div class="loop-onboarding-step" data-step="1" data-title="Set up Kawarp" hidden>
                <p class="loop-onboarding-description">Would you like to use Kawarp, Loop’s animated artwork background?</p>
                <div class="loop-onboarding-choice-row">
                    <button type="button" class="loop-onboarding-choice loop-onboarding-kawarp-yes">Yes, use Kawarp</button>
                    <button type="button" class="loop-onboarding-choice loop-onboarding-kawarp-no">No, keep it off</button>
                </div>
                <p class="loop-onboarding-status" role="status" aria-live="polite">Kawarp is currently enabled.</p>
                <button type="button" class="loop-onboarding-secondary loop-onboarding-config">Choose a Kawarp preset or import your own config</button>
            </div>
            <div class="loop-onboarding-step" data-step="2" data-title="Configure Loop" hidden>
                <p class="loop-onboarding-description">Choose the everyday settings you want to start with. You can change any of these from the Loop menu later.</p>
                <div class="loop-onboarding-settings-list">
                    <label class="loop-onboarding-setting-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Update interval</strong>
                            <small>How often Loop checks playback and the current track.</small>
                        </span>
                        <span class="loop-onboarding-setting-control loop-onboarding-range-control">
                            <output class="loop-onboarding-update-interval-value">500 ms</output>
                            <input class="loop-onboarding-update-interval-slider" type="range" min="100" max="1000" step="50" value="500" aria-label="Loop update interval in milliseconds">
                        </span>
                    </label>
                    <label class="loop-onboarding-setting-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Kawarp FPS cap</strong>
                            <small>Limit animated artwork rendering to reduce GPU usage.</small>
                        </span>
                        <span class="loop-onboarding-setting-control loop-onboarding-range-control">
                            <output class="loop-onboarding-kawarp-fps-value">60 FPS</output>
                            <input class="loop-onboarding-kawarp-fps-slider" type="range" min="0" max="5" step="1" value="2" list="loop-onboarding-kawarp-fps-options" aria-label="Kawarp frames per second cap">
                            <datalist id="loop-onboarding-kawarp-fps-options">
                                <option value="0" label="15"></option>
                                <option value="1" label="30"></option>
                                <option value="2" label="60"></option>
                                <option value="3" label="120"></option>
                                <option value="4" label="144"></option>
                                <option value="5" label="Dynamic"></option>
                            </datalist>
                        </span>
                    </label>
                    <label class="loop-onboarding-setting-row loop-onboarding-check-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Translate lyrics</strong>
                            <small>Show an optional translation alongside available lyrics.</small>
                        </span>
                        <input class="loop-onboarding-translation-toggle" type="checkbox">
                    </label>
                    <label class="loop-onboarding-setting-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Translation language</strong>
                            <small>Choose the language used for lyric translations.</small>
                        </span>
                        <select class="loop-onboarding-translation-language" aria-label="Lyrics translation language">
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="ja">Japanese</option>
                            <option value="ko">Korean</option>
                            <option value="zh">Chinese</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="pt">Portuguese</option>
                            <option value="ru">Russian</option>
                            <option value="ar">Arabic</option>
                            <option value="bn">Bengali</option>
                            <option value="id">Indonesian</option>
                            <option value="it">Italian</option>
                            <option value="tr">Turkish</option>
                            <option value="vi">Vietnamese</option>
                        </select>
                    </label>
                    <label class="loop-onboarding-setting-row loop-onboarding-check-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Show writer names</strong>
                            <small>Display songwriter and writer credits below the lyrics.</small>
                        </span>
                        <input class="loop-onboarding-writer-credits" type="checkbox">
                    </label>
                    <label class="loop-onboarding-setting-row loop-onboarding-check-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Animate lyric letter wave</strong>
                            <small>Add the letter-wave animation to lyric lines.</small>
                        </span>
                        <input class="loop-onboarding-letter-wave-toggle" type="checkbox">
                    </label>
                    <label class="loop-onboarding-setting-row loop-onboarding-check-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Enable video behavior</strong>
                            <small>Let Loop manage the video background and video-specific layout.</small>
                        </span>
                        <input class="loop-onboarding-video-behavior-toggle" type="checkbox">
                    </label>
                    <label class="loop-onboarding-setting-row loop-onboarding-check-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Avoid music videos</strong>
                            <small>Prefer the artwork view instead of switching to music videos.</small>
                        </span>
                        <input class="loop-onboarding-video-avoidance-toggle" type="checkbox">
                    </label>
                    <label class="loop-onboarding-setting-row loop-onboarding-check-row">
                        <span class="loop-onboarding-setting-copy">
                            <strong>Rearrange video UI</strong>
                            <small>Move video controls into Loop’s layout when video behavior is enabled.</small>
                        </span>
                        <input class="loop-onboarding-video-ui-toggle" type="checkbox">
                    </label>
                </div>
            </div>
            <div class="loop-onboarding-step" data-step="3" data-title="Choose lyric providers" hidden>
                <p class="loop-onboarding-description">Set the order Loop uses when looking for lyrics. Drag providers to reorder them, toggle providers off, or remove ones you never use.</p>
                <div class="loop-lyrics-provider-setting loop-onboarding-provider-setting">
                    <div class="loop-lyrics-provider-heading">Lyrics provider priority</div>
                    <div id="loop-onboarding-lyrics-provider-priority-list" role="list" aria-label="Lyrics provider priority list"></div>
                    <button id="loop-onboarding-lyrics-provider-restore" class="loop-lyrics-provider-restore" type="button" hidden>Restore removed providers</button>
                </div>
            </div>
            <div class="loop-onboarding-step" data-step="4" data-title="Learn shortcuts" hidden>
                <p class="loop-onboarding-description">Keep this quick reference handy. These are the same shortcuts shown in the Loop menu.</p>
                <div class="loop-onboarding-shortcuts-list" aria-label="Loop keyboard shortcuts">
                    <div><kbd>M</kbd> Mute / unmute</div>
                    <div><kbd>Shift + P / K</kbd> Previous track</div>
                    <div><kbd>Shift + N / J</kbd> Next track</div>
                    <div><kbd>H / Shift + ←</kbd> 10 second backward</div>
                    <div><kbd>L / Shift + →</kbd> 10 second forward</div>
                    <div><kbd>Ctrl + K</kbd> Search</div>
                    <div><kbd>Ctrl + Q</kbd> See queue</div>
                    <div><kbd>Alt + L</kbd> Turn off screen <span>(with Loop running)</span></div>
                    <div><kbd>~</kbd> Toggle Loop</div>
                    <div><kbd>Ctrl + F5</kbd> Reload Loop session</div>
                    <div><kbd>F5</kbd> Reload resources</div>
                    <div><kbd>Ctrl + P</kbd> Select playlists <span>(not implemented)</span></div>
                </div>
            </div>
            <div class="loop-onboarding-step" data-step="5" data-title="Helpful tips" hidden>
                <p class="loop-onboarding-description">A few layout tips can make Loop feel much better on a wide display.</p>
                <div class="loop-onboarding-tips">
                    <article class="loop-onboarding-tip">
                        <strong>Try 80% page scale</strong>
                        <span>Use your browser’s zoom controls and set the YouTube Music page scale to 80% for more room.</span>
                    </article>
                    <article class="loop-onboarding-tip">
                        <strong>Try a 16:4 window ratio</strong>
                        <span>A very wide 16:4 window gives the player and lyrics space to breathe side by side.</span>
                    </article>
                    <article class="loop-onboarding-tip">
                        <strong>Open the Loop menu anytime</strong>
                        <span>Select the ? button in the top corner to revisit settings and shortcuts.</span>
                    </article>
                </div>
            </div>
            <div class="loop-onboarding-footer">
                <span class="loop-onboarding-progress" aria-live="polite">1 / 6</span>
                <div class="loop-onboarding-actions">
                    <button type="button" class="loop-onboarding-prev" disabled>Previous</button>
                    <button type="button" class="loop-onboarding-next">Next</button>
                </div>
            </div>
        </div>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const steps = [...modal.querySelectorAll(".loop-onboarding-step")];
    const progress = modal.querySelector(".loop-onboarding-progress");
    const title = modal.querySelector("#loop-onboarding-title");
    const previous = modal.querySelector(".loop-onboarding-prev");
    const next = modal.querySelector(".loop-onboarding-next");
    let currentStep = 0;

    const finish = ({ save = true } = {}) => {
        if (save) {
            loopPreferences.showLyrics = true;
            loopPreferences.showWriterCredits = modal.querySelector(".loop-onboarding-writer-credits").checked;
            loopPreferences.enableLyricsTranslation = modal.querySelector(".loop-onboarding-translation-toggle").checked;
            loopPreferences.lyricsTranslationLanguage = normalizeLyricsTranslationLanguage(
                modal.querySelector(".loop-onboarding-translation-language").value
            );
            loopPreferences.loopUpdateInterval = normalizeLoopUpdateInterval(
                modal.querySelector(".loop-onboarding-update-interval-slider").value
            );
            const kawarpFpsIndex = Math.min(
                kawarpFpsOptions.length - 1,
                Math.max(0, Number(modal.querySelector(".loop-onboarding-kawarp-fps-slider").value))
            );
            loopPreferences.kawarpFpsCap = normalizeKawarpFpsCap(kawarpFpsOptions[kawarpFpsIndex]);
            loopPreferences.animateWordWobble = modal.querySelector(".loop-onboarding-letter-wave-toggle").checked;
            loopPreferences.videoBehaviorEnabled = modal.querySelector(".loop-onboarding-video-behavior-toggle").checked;
            loopPreferences.videoAvoidance = modal.querySelector(".loop-onboarding-video-avoidance-toggle").checked;
            loopPreferences.videoUiRearrangement = modal.querySelector(".loop-onboarding-video-ui-toggle").checked;
            saveLoopPreferences();
            applyLoopPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        }
        completeOnboarding();
        modal.remove();
    };
    const renderStep = (direction = "next") => {
        modal.dataset.transition = direction;
        steps.forEach((step, index) => {
            step.classList.remove("loop-onboarding-step-active");
            step.hidden = index !== currentStep;
        });
        const activeStep = steps[currentStep];
        // Force a layout pass so the same step animates every time it is shown.
        void activeStep.offsetWidth;
        activeStep.classList.add("loop-onboarding-step-active");
        title.textContent = activeStep.dataset.title || "Welcome to Loop";
        progress.textContent = `${currentStep + 1} / ${steps.length}`;
        previous.disabled = currentStep === 0;
        next.textContent = currentStep === steps.length - 1 ? "Finish" : "Next";
    };

    previous.addEventListener("click", () => {
        if (currentStep > 0) { currentStep -= 1; renderStep("previous"); }
    });
    next.addEventListener("click", () => {
        if (currentStep === steps.length - 1) { finish(); return; }
        currentStep += 1;
        renderStep("next");
    });
    modal.querySelector(".loop-onboarding-close").addEventListener("click", () => finish({ save: false }));
    modal.querySelector(".loop-onboarding-kawarp-yes").addEventListener("click", () => {
        setKawarpEnabled(true);
        modal.querySelector(".loop-onboarding-status").textContent = "Kawarp is enabled.";
    });
    modal.querySelector(".loop-onboarding-kawarp-no").addEventListener("click", () => {
        setKawarpEnabled(false);
        modal.querySelector(".loop-onboarding-status").textContent = "Kawarp is disabled.";
    });
    modal.querySelector(".loop-onboarding-config").addEventListener("click", showKawarpConfigEditor);

    const writerCredits = modal.querySelector(".loop-onboarding-writer-credits");
    const translationToggle = modal.querySelector(".loop-onboarding-translation-toggle");
    const translationLanguage = modal.querySelector(".loop-onboarding-translation-language");
    const updateIntervalSlider = modal.querySelector(".loop-onboarding-update-interval-slider");
    const updateIntervalValue = modal.querySelector(".loop-onboarding-update-interval-value");
    const kawarpFpsSlider = modal.querySelector(".loop-onboarding-kawarp-fps-slider");
    const kawarpFpsValue = modal.querySelector(".loop-onboarding-kawarp-fps-value");
    const letterWaveToggle = modal.querySelector(".loop-onboarding-letter-wave-toggle");
    const videoBehaviorToggle = modal.querySelector(".loop-onboarding-video-behavior-toggle");
    const videoAvoidanceToggle = modal.querySelector(".loop-onboarding-video-avoidance-toggle");
    const videoUiToggle = modal.querySelector(".loop-onboarding-video-ui-toggle");
    const getKawarpFpsIndex = () => Math.min(
        kawarpFpsOptions.length - 1,
        Math.max(0, Number(kawarpFpsSlider.value))
    );
    const syncOnboardingSettings = () => {
        const interval = normalizeLoopUpdateInterval(updateIntervalSlider.value);
        const fpsIndex = getKawarpFpsIndex();
        updateIntervalSlider.value = String(interval);
        kawarpFpsSlider.value = String(fpsIndex);
        updateIntervalValue.textContent = `${interval} ms`;
        kawarpFpsValue.textContent = getKawarpFpsLabel(kawarpFpsOptions[fpsIndex]);
        translationLanguage.value = normalizeLyricsTranslationLanguage(translationLanguage.value);
        translationLanguage.disabled = !translationToggle.checked;
        videoUiToggle.disabled = !videoBehaviorToggle.checked;
    };
    writerCredits.checked = loopPreferences.showWriterCredits !== false;
    translationToggle.checked = loopPreferences.enableLyricsTranslation === true;
    translationLanguage.value = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
    updateIntervalSlider.value = String(normalizeLoopUpdateInterval(loopPreferences.loopUpdateInterval));
    kawarpFpsSlider.value = String(Math.max(0, kawarpFpsOptions.indexOf(normalizeKawarpFpsCap(loopPreferences.kawarpFpsCap))));
    letterWaveToggle.checked = loopPreferences.animateWordWobble === true;
    videoBehaviorToggle.checked = loopPreferences.videoBehaviorEnabled !== false;
    videoAvoidanceToggle.checked = loopPreferences.videoAvoidance === true;
    videoUiToggle.checked = loopPreferences.videoUiRearrangement === true;
    updateIntervalSlider.addEventListener("input", () => {
        loopPreferences.loopUpdateInterval = normalizeLoopUpdateInterval(updateIntervalSlider.value);
        saveLoopPreferences();
        startLoopUpdatePolling();
        syncOnboardingSettings();
    });
    kawarpFpsSlider.addEventListener("input", () => {
        loopPreferences.kawarpFpsCap = kawarpFpsOptions[getKawarpFpsIndex()];
        saveLoopPreferences();
        kawarpBackground?.setOptions({ fpsCap: loopPreferences.kawarpFpsCap });
        updateKawarpFpsPreferenceUI();
        syncOnboardingSettings();
    });
    translationToggle.addEventListener("change", () => {
        loopPreferences.enableLyricsTranslation = translationToggle.checked;
        saveLoopPreferences();
        syncOnboardingSettings();
    });
    translationLanguage.addEventListener("change", () => {
        loopPreferences.lyricsTranslationLanguage = normalizeLyricsTranslationLanguage(translationLanguage.value);
        saveLoopPreferences();
        syncOnboardingSettings();
    });
    writerCredits.addEventListener("change", () => {
        loopPreferences.showWriterCredits = writerCredits.checked;
        saveLoopPreferences();
    });
    letterWaveToggle.addEventListener("change", () => {
        loopPreferences.animateWordWobble = letterWaveToggle.checked;
        saveLoopPreferences();
        applyLyricsAnimationPreferences();
    });
    videoBehaviorToggle.addEventListener("change", () => {
        loopPreferences.videoBehaviorEnabled = videoBehaviorToggle.checked;
        saveLoopPreferences();
        applyVideoPresentationPreferences();
        syncOnboardingSettings();
    });
    videoAvoidanceToggle.addEventListener("change", () => {
        loopPreferences.videoAvoidance = videoAvoidanceToggle.checked;
        saveLoopPreferences();
        applyVideoPresentationPreferences();
        if (videoAvoidanceToggle.checked && document.querySelector("#loop")?.dataset.trackVideo === "true") {
            avoidMusicVideo();
        }
    });
    videoUiToggle.addEventListener("change", () => {
        if (videoUiToggle.disabled) return;
        loopPreferences.videoUiRearrangement = videoUiToggle.checked;
        saveLoopPreferences();
        applyVideoPresentationPreferences();
    });
    syncOnboardingSettings();

    renderLyricsProviderPriorityUI(modal, () => renderLyricsProviderPriorityUI(modal));
    modal.addEventListener("keydown", (event) => { if (event.key === "Escape") finish({ save: false }); });
    renderStep();

    fetch(onboardingChangelogURL, { cache: "no-store" })
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then((changelog) => { modal.querySelector(".loop-onboarding-changelog").innerHTML = renderChangelogMarkdown(changelog); })
        .catch(() => {
            modal.querySelector(".loop-onboarding-changelog").textContent = "Could not load the changelog. You can read it on GitHub after onboarding.";
        });
    modal.querySelector(".loop-onboarding-next").focus();
}

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

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.getOnboardingStorageKey = getOnboardingStorageKey;
    global.isOnboardingComplete = isOnboardingComplete;
    global.completeOnboarding = completeOnboarding;
    global.escapeHTML = escapeHTML;
    global.renderChangelogMarkdown = renderChangelogMarkdown;
    global.showOnboarding = showOnboarding;
    global.getUpdateURL = getUpdateURL;
    global.openUpdateInBrowser = openUpdateInBrowser;
    global.showUpdateNotice = showUpdateNotice;
    global.showRequiredUpdateBlocker = showRequiredUpdateBlocker;
    global.getInstalledVersion = getInstalledVersion;
    global.compareVersions = compareVersions;
    global.checkForUpdates = checkForUpdates;
})(globalThis);
