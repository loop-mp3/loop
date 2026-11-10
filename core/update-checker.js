const LOOP_REPOSITORY = "loop-mp3/loop";
const LOOP_RELEASES_URL = `https://api.github.com/repos/${LOOP_REPOSITORY}/releases/latest`;
const LOOP_UPDATE_CHECK_INTERVAL_MS = 20 * 60 * 1000;

let loopUpdateCheckIntervalId;
let loopUpdateNoticeDismissed = false;

function getInstalledVersion() {
    try {
        return String(chrome.runtime.getManifest().version || "0.0.0").trim();
    } catch {
        return "0.0.0";
    }
}

function getReleaseURL(release) {
    const releaseURL = String(release?.html_url || "").trim();
    return releaseURL.startsWith(`https://github.com/${LOOP_REPOSITORY}/releases/`)
        ? releaseURL
        : `https://github.com/${LOOP_REPOSITORY}/releases/latest`;
}

function openUpdateInBrowser(event, updateURL) {
    const isElectron = /Electron/i.test(navigator.userAgent) ||
        Boolean(globalThis.process?.versions?.electron);
    if (!isElectron) return;

    event.preventDefault();
    const browserWindow = window.open(updateURL, "_blank", "noopener,noreferrer");
    if (!browserWindow) window.location.assign(updateURL);
}

function showUpdateNotice(release) {
    const loopPlayer = document.querySelector("#loop-player");
    if (!loopPlayer || loopUpdateNoticeDismissed || document.getElementById("loop-update-notice")) return;

    const releaseTag = String(release?.tag_name || "").trim();
    if (!releaseTag) return;

    const notice = document.createElement("aside");
    notice.id = "loop-update-notice";
    notice.setAttribute("role", "status");

    const message = document.createElement("span");
    message.textContent = `Loop ${releaseTag} is available.`;

    const link = document.createElement("a");
    const updateURL = getReleaseURL(release);
    link.href = updateURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Update now";

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
        loopUpdateNoticeDismissed = true;
        notice.remove();
    });
}

function showUpdateNoticeWhenReady(release) {
    if (loopUpdateNoticeDismissed || document.getElementById("loop-update-notice")) return;
    if (!document.querySelector("#loop-player")) {
        requestAnimationFrame(() => showUpdateNoticeWhenReady(release));
        return;
    }
    showUpdateNotice(release);
}

async function checkForUpdates() {
    try {
        const response = await fetch(LOOP_RELEASES_URL, {
            cache: "no-store",
            headers: {
                Accept: "application/vnd.github+json",
            },
        });
        if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);

        const release = await response.json();
        const releaseTag = String(release?.tag_name || "").trim();
        const installedReleaseTag = `v${getInstalledVersion()}`;

        if (!releaseTag || releaseTag === installedReleaseTag) return false;

        showUpdateNoticeWhenReady(release);
        return release;
    } catch (error) {
        console.warn("[loop.mp3] update check failed:", error);
        return null;
    }
}

function startLoopUpdateChecking() {
    window.clearInterval(loopUpdateCheckIntervalId);
    checkForUpdates();
    loopUpdateCheckIntervalId = window.setInterval(checkForUpdates, LOOP_UPDATE_CHECK_INTERVAL_MS);
}

(function publishLoopModule(global) {
    global.getInstalledVersion = getInstalledVersion;
    global.getReleaseURL = getReleaseURL;
    global.openUpdateInBrowser = openUpdateInBrowser;
    global.showUpdateNotice = showUpdateNotice;
    global.checkForUpdates = checkForUpdates;
    global.startLoopUpdateChecking = startLoopUpdateChecking;
})(globalThis);
