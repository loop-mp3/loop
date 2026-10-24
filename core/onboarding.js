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
            <div class="loop-onboarding-step" data-step="0">
                <p class="loop-onboarding-description">Here’s what changed in the latest release.</p>
                <div class="loop-onboarding-changelog" aria-live="polite">Loading changelog...</div>
            </div>
            <div class="loop-onboarding-step" data-step="1" hidden>
                <p class="loop-onboarding-description">Would you like to use Kawarp, Loop’s animated artwork background?</p>
                <div class="loop-onboarding-choice-row">
                    <button type="button" class="loop-onboarding-choice loop-onboarding-kawarp-yes">Yes, use Kawarp</button>
                    <button type="button" class="loop-onboarding-choice loop-onboarding-kawarp-no">No, keep it off</button>
                </div>
                <p class="loop-onboarding-status" role="status" aria-live="polite">Kawarp is currently enabled.</p>
                <button type="button" class="loop-onboarding-secondary loop-onboarding-config">Choose a Kawarp preset or import your own config</button>
            </div>
            <div class="loop-onboarding-step" data-step="2" hidden>
                <p class="loop-onboarding-description">Choose your mini-player preferences. You can change these later from the Loop menu.</p>
                <label class="loop-onboarding-check"><input class="loop-onboarding-mini-player" type="checkbox"> Open the mini-player when the app is minimized</label>
                <label class="loop-onboarding-check"><input class="loop-onboarding-navigation" type="checkbox"> Show previous and next buttons</label>
            </div>
            <div class="loop-onboarding-step" data-step="3" hidden>
                <p class="loop-onboarding-description">Lyrics are always displayed when available. You can choose the rendering engine and provider later from the Loop menu.</p>
                <label class="loop-onboarding-check"><input class="loop-onboarding-writer-credits" type="checkbox"> Show writer credits</label>
            </div>
            <div class="loop-onboarding-footer">
                <span class="loop-onboarding-progress" aria-live="polite">1 / 4</span>
                <div class="loop-onboarding-actions">
                    <button type="button" class="loop-onboarding-prev" disabled>Previous</button>
                    <button type="button" class="loop-onboarding-next">Next</button>
                </div>
            </div>
        </div>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const steps = [...modal.querySelectorAll(".loop-onboarding-step")];
    const progress = modal.querySelector(".loop-onboarding-progress");
    const previous = modal.querySelector(".loop-onboarding-prev");
    const next = modal.querySelector(".loop-onboarding-next");
    let currentStep = 0;

    const finish = ({ save = true } = {}) => {
        if (save) {
            loopPreferences.autoOpenMiniPlayer = modal.querySelector(".loop-onboarding-mini-player").checked;
            loopPreferences.showNavigationButtons = modal.querySelector(".loop-onboarding-navigation").checked;
            loopPreferences.showLyrics = true;
            loopPreferences.showWriterCredits = modal.querySelector(".loop-onboarding-writer-credits").checked;
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
    modal.querySelector(".loop-onboarding-mini-player").checked = loopPreferences.autoOpenMiniPlayer !== false;
    modal.querySelector(".loop-onboarding-navigation").checked = Boolean(loopPreferences.showNavigationButtons);
    modal.querySelector(".loop-onboarding-writer-credits").checked = loopPreferences.showWriterCredits !== false;
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
