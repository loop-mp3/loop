function waitForYTM(callback) {
    const check = () => {
        const playerPage = document.querySelector("ytmusic-player-page");
        const playerBar = playerPage || document.querySelector("ytmusic-player-bar");
        if (playerBar) return callback(playerBar);
        requestAnimationFrame(check);
    };
    check();
}

// YouTube Music moved the live player data under ytmusic-player-page. Keep the
// old bar as a fallback because older clients still expose it directly.
function getYTMPlayerRoot() {
    return document.querySelector("ytmusic-player-page") ||
        document.querySelector("ytmusic-player-bar");
}

function getCurrentTrackId(playerBar) {
    const urlTrackId = new URL(location.href).searchParams.get("v");
    if (urlTrackId) return urlTrackId;

    const dataRoot = playerBar?.matches?.("ytmusic-player-page")
        ? playerBar.querySelector("ytmusic-player-bar") || playerBar
        : playerBar;
    const playerTrackLink = dataRoot?.querySelector(
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
    return document.querySelector("ytmusic-player-page")?.getAttribute("video-id") ||
        document.querySelector("ytmusic-player-page")?.dataset.videoId;
}

function getFallbackArtwork() {
    return getExtensionURL(loopPreferences.useLegacyFallbackArtwork
        ? "static/fallback-legacy.png"
        : "static/fallback-artwork.png");
}

function getVinylArtwork(trackId) {
    return trackId ? `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg` : getFallbackArtwork();
}

function getPlayerBarArtwork(playerBar) {
    const nestedPlayerBar = playerBar?.querySelector("ytmusic-player-bar");
    const roots = [nestedPlayerBar, playerBar, document.querySelector("ytmusic-player-bar")]
        .filter((root, index, all) => root && all.indexOf(root) === index);
    const artwork = roots.flatMap((root) => [...root.querySelectorAll("img")]).find((image) => {
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
let lastElectronMiniPlayerSignature = "";

function getKawarpState() {
    return {
        // `enabled` is the effective state: it also includes the Loop animated
        // background preference, not just the value in the Kawarp config.
        enabled: kawarpEnabled,
        settings: { ...kawarpSettings },
        preferences: {
            animatedBackground: loopPreferences.animatedBackground,
        },
    };
}

function publishElectronKawarpState() {
    window.postMessage({
        source: "loop.mp3",
        type: "loop:electron-kawarp-state",
        state: getKawarpState(),
    }, "*");
}

function publishElectronMiniPlayerState({ force = false } = {}) {
    const loop = document.getElementById("loop");
    const media = getCurrentMedia();
    const state = {
        title: loop?.querySelector("#loop-track-title")?.textContent.trim() || "Nothing playing",
        artist: loop?.querySelector("#loop-track-artist")?.textContent.trim() || "Search something to play",
        album: loopPreferences.showAlbum
            ? loop?.querySelector("#loop-track-album")?.textContent.trim() || ""
            : undefined,
        artwork: loop?.querySelector("#loop-artwork")?.src || getFallbackArtwork(),
        currentTime: media && Number.isFinite(media.currentTime) ? media.currentTime : 0,
        duration: media && Number.isFinite(media.duration) ? media.duration : 0,
        paused: !media || media.paused,
        theme: loop?.dataset.theme || loopPreferences.theme || "default",
    };
    const signature = JSON.stringify({ ...state, currentTime: Math.floor(state.currentTime) });
    if (!force && signature === lastElectronMiniPlayerSignature) return;
    lastElectronMiniPlayerSignature = signature;
    window.postMessage({
        source: "loop.mp3",
        type: "loop:electron-mini-player-state",
        state,
    }, "*");
}

function publishElectronMiniPlayerCommand(type) {
    window.postMessage({ source: "loop.mp3", type }, "*");
}

function publishDiscordActivity({ force = false } = {}) {
    const loop = document.getElementById("loop");
    const media = getCurrentMedia();
    if (!media) {
      return;
    }
    const title = loop?.querySelector("#loop-track-title")?.textContent.trim() || "";
    const artist = media.paused ? `Paused` : loop?.querySelector("#loop-track-artist")?.textContent.trim() || "";
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
let videoBackgroundTrackId;
let videoBackgroundSyncFrame;
let videoBackgroundLastSyncedTime;
let videoBackgroundLastPaused;
let videoUiHideTimer;
let loopPreferences = {
    animatedBackground: true,
    hideVinyl: true,
    hideArtwork: false,
    showNavigationButtons: false,
    autoOpenMiniPlayer: true,
    useLegacyFallbackArtwork: false,
    showAlbum: false,
    showLyrics: false,
    trackPresentationModes: {},
    lyricsRenderingEngine: "standard",
    animateWordWobble: false,
    showWriterCredits: true,
    useLyricsCache: true,
    useGrooveOverrides: true,
    enableLyricsTranslation: false,
    lyricsTranslationLanguage: "en",
    lyricsProviderOrder: ["lyricsplus", "binilyrics-ttml", "binilyrics-lrc", "lrclib", "groove", "groove-dev"],
    loopUpdateInterval: 500,
    kawarpFpsCap: 60,
    kawarpFpsLogging: false,
    volume: 1,
    theme: "default",
    videoBehaviorEnabled: true,
    videoUiRearrangement: true,
};
let currentArtworkURL = "";
let forcedVideoMode = false;
let forcedArtworkMode = false;
let kawarpRendererClass;
let kawarpRendererPromise;
let kawarpWarningTimer;
let braccatoLyricsPromise;
let braccatoLyricsRenderer;
let braccatoLyricsMount;
let ludoLyricsController;
let createLudoLyricsController;
let lyricsRequestId = 0;
let lyricsRetryTimer;
let lyricsFetchInFlightTrackId = null;
let lyricsLoadedTrackId = null;
let currentTrackLyricsProvider = { trackId: null, providerId: null };
let currentParsedLyrics = [];
let currentLyricsRenderOptions = {};

let currentTrackWriters = [];
let notificationTimer;
let notificationAnimationTimer;
let notificationAnimationFrame;
let authWarningShown = false;
let loopUpdateBlocked = false;
let loopVisible = false;
let loopUpdateIntervalId;
let loopUpdatePlayerBar;

const loopPreferencesKey = "loop.mp3.preferences";
const defaultLoopUpdateInterval = 500;
const defaultKawarpFpsCap = 60;
const kawarpFpsOptions = [15, 30, 60, 120, 144, 0];
const LYRICS_RETRY_INTERVAL_MS = 5000;
const minimumLoopUpdateInterval = 100;
const maximumLoopUpdateInterval = 1000;
const kawarpConfigKey = "loop.mp3.kawarp-config";
const kawarpCustomPresetsKey = "loop.mp3.kawarp-custom-presets";
const lyricsCacheKeyPrefix = "lyrics_";
const manualLyricsCacheKeyPrefix = "lyrics_manual_";
const translationCacheKeyPrefix = "translation_";
const defaultUpdateURL = "https://loop.mizucode.qzz.io/update";
const lyricsTranslationEndpoint = "https://unison.boidu.dev/translate";
const unisonTranslationRetryDelaysMs = [3_000, 5_000, 10_000, 15_000];
const grooveEditorURL = "https://loop.mizucode.qzz.io/groove/";
const geniusURL = "https://genius.com";
const unisonURL = "https://unison.prjktla.my.id/submit";
const onboardingChangelogURL = "https://raw.githubusercontent.com/loop-mp3/loop/refs/heads/main/CHANGELOG.md";
const lyricsProviders = [
    { id: "lyricsplus", label: "LyricsPlus", endpoint: "https://lyricsplus.prjktla.my.id/v2/lyrics/get" },
    { id: "binilyrics-ttml", label: "Binilyrics (lrc.red TTML)", endpoint: "https://lrc.red", format: "ttml" },
    { id: "binilyrics-lrc", label: "Binilyrics (lrc.red LRC)", endpoint: "https://lrc.red", format: "lrc" },
    { id: "lrclib", label: "LRCLIB", endpoint: "https://lrclib.net/api/search" },
    { id: "groove", label: "Groove", endpoint: "https://groove.mizucode.qzz.io/api/v1/track" },
    { id: "groove-dev", label: "Groove (dev)", endpoint: "http://127.0.0.1:8787/api/v1/track" },
];
const defaultLyricsProviderIds = ["lyricsplus", "binilyrics-ttml", "binilyrics-lrc", "lrclib", "groove", "groove-dev"];
const supportedLyricsTranslationLanguages = new Set([
    "ar", "bn", "de", "en", "es", "fr", "hi", "id", "it", "ja", "ko", "pt", "ru", "tr", "vi", "zh",
]);
const translationRequestCache = new Map();

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

function getLyricsProviderOrder() {
    const storedOrder = Array.isArray(loopPreferences.lyricsProviderOrder)
        ? loopPreferences.lyricsProviderOrder
        : [];
    const knownIds = new Set(lyricsProviders.map((provider) => provider.id));
    return [...new Set([
        ...storedOrder.filter((providerId) => knownIds.has(providerId)),
        ...defaultLyricsProviderIds,
    ])];
}

function setLyricsProviderOrder(providerId) {
    const order = getLyricsProviderOrder();
    if (!lyricsProviders.some((provider) => provider.id === providerId)) return;
    loopPreferences.lyricsProviderOrder = [providerId, ...order.filter((id) => id !== providerId)];
    saveLoopPreferences();
    applyLoopPreferences();
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
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
                <p class="loop-onboarding-description">Would you like to enable experimental lyrics? Lyrics are fetched from LRCLIB. You can change this later from the Loop menu.</p>
                <label class="loop-onboarding-check"><input class="loop-onboarding-lyrics" type="checkbox"> Enable lyrics (experimental)</label>
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
            loopPreferences.showLyrics = modal.querySelector(".loop-onboarding-lyrics").checked;
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
    modal.querySelector(".loop-onboarding-lyrics").checked = Boolean(loopPreferences.showLyrics);
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
                .filter(([key, value]) => key.startsWith(lyricsCacheKeyPrefix) && value?.provider)
                .map(([key, value]) => ({ trackId: key.slice(lyricsCacheKeyPrefix.length), ...value }))
                .sort((a, b) => Number(b.cachedAt || 0) - Number(a.cachedAt || 0)));
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
                <button type="button" class="loop-lyrics-cache-close" aria-label="Close cached lyrics">&#215;</button>
            </header>
            <div class="loop-lyrics-cache-layout">
                <div class="loop-lyrics-cache-list" role="listbox" aria-label="Cached lyrics tracks">
                    <div class="loop-lyrics-cache-status">Loading cached lyrics…</div>
                </div>
                <div class="loop-lyrics-cache-details" aria-live="polite">
                    <div class="loop-lyrics-cache-empty">Select a cached track to view its metadata.</div>
                </div>
            </div>
        </section>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    const list = modal.querySelector(".loop-lyrics-cache-list");
    const details = modal.querySelector(".loop-lyrics-cache-details");

    const showDetails = (entry, button) => {
        list.querySelectorAll("[aria-selected='true']").forEach((item) => item.setAttribute("aria-selected", "false"));
        button.setAttribute("aria-selected", "true");
        details.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = entry.title || "Untitled track";
        const artist = document.createElement("p");
        artist.className = "loop-lyrics-cache-detail-artist";
        artist.textContent = entry.artist || "Unknown artist";

        const metadata = document.createElement("dl");
        const fields = [
            ["Track ID", entry.trackId],
            ["Provider", entry.provider],
            ["Duration", Number.isFinite(Number(entry.duration)) ? `${Math.floor(entry.duration / 60)}:${String(Math.round(entry.duration % 60)).padStart(2, "0")}` : "Unknown"],
            ["Cached", entry.cachedAt ? new Date(entry.cachedAt).toLocaleString() : "Unknown"],
        ];
        fields.forEach(([label, value]) => {
            const term = document.createElement("dt");
            term.textContent = label;
            const valueElement = document.createElement("dd");
            valueElement.textContent = value;
            metadata.append(term, valueElement);
        });

        const lyrics = document.createElement("pre");
        lyrics.className = "loop-lyrics-cache-content";
        lyrics.textContent = entry.syncedLyrics || entry.plainLyrics || "No lyric text stored.";
        const actions = document.createElement("div");
        actions.className = "loop-lyrics-cache-actions";
        const refresh = document.createElement("button");
        refresh.type = "button";
        refresh.className = "loop-lyrics-cache-refresh";
        refresh.textContent = "Refresh lyrics";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "loop-lyrics-cache-delete";
        remove.textContent = "Delete cache";
        const status = document.createElement("span");
        status.className = "loop-lyrics-cache-action-status";
        status.setAttribute("role", "status");
        actions.append(refresh, remove, status);
        details.append(heading, artist, metadata, lyrics, actions);

        refresh.addEventListener("click", async () => {
            refresh.disabled = true;
            remove.disabled = true;
            status.textContent = "Refreshing…";
            try {
                const refreshedLyrics = await getLyricsFromTrackInfo(entry.trackId, entry.title, entry.artist, entry.duration, true);
                if (!refreshedLyrics) throw new Error("No lyrics were returned.");
                const refreshedEntry = (await getAllCachedLyrics()).find((item) => item.trackId === entry.trackId);
                if (!refreshedEntry) throw new Error("No lyrics were returned.");
                showDetails(refreshedEntry, button);
            } catch (error) {
                console.warn("[loop.mp3] Could not refresh cached lyrics:", error);
                status.textContent = "Refresh failed.";
                refresh.disabled = false;
                remove.disabled = false;
            }
        });

        remove.addEventListener("click", async () => {
            if (!window.confirm(`Delete cached lyrics for “${entry.title || "this track"}”?`)) return;
            refresh.disabled = true;
            remove.disabled = true;
            status.textContent = "Deleting…";
            if (!await removeCachedLyrics(entry.trackId)) {
                status.textContent = "Delete failed.";
                refresh.disabled = false;
                remove.disabled = false;
                return;
            }
            const entries = await getAllCachedLyrics();
            renderEntries(entries);
        });
    };

    const renderEntries = (entries, selectedTrackId = entries[0]?.trackId) => {
        list.replaceChildren();
        if (!entries.length) {
            const empty = document.createElement("div");
            empty.className = "loop-lyrics-cache-status";
            empty.textContent = "No cached lyrics yet.";
            list.appendChild(empty);
            details.replaceChildren(empty.cloneNode(true));
            return;
        }

        entries.forEach((entry) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "loop-lyrics-cache-item";
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", entry.trackId === selectedTrackId ? "true" : "false");
            const title = document.createElement("strong");
            title.textContent = entry.title || "Untitled track";
            const subtitle = document.createElement("span");
            subtitle.textContent = `${entry.artist || "Unknown artist"} · ${entry.provider}`;
            button.append(title, subtitle);
            button.addEventListener("click", () => showDetails(entry, button));
            list.appendChild(button);
            if (entry.trackId === selectedTrackId) showDetails(entry, button);
        });
    };

    getAllCachedLyrics().then((entries) => renderEntries(entries));

    modal.querySelector(".loop-lyrics-cache-close").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
    modal.querySelector(".loop-lyrics-cache-close").focus();
}

function showLoopResetModal() {
    if (document.getElementById("loop-reset-modal")) return;

    const modal = document.createElement("div");
    modal.id = "loop-reset-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-reset-modal-title");
    modal.innerHTML = `
        <div class="loop-reset-modal-card">
            <div class="loop-reset-modal-header">
                <div>
                    <div class="loop-reset-modal-kicker">Reset Loop</div>
                    <h2 id="loop-reset-modal-title">Delete Loop data?</h2>
                </div>
                <button type="button" class="loop-reset-modal-close" aria-label="Cancel reset">&#215;</button>
            </div>
            <p class="loop-reset-modal-description">
                This will delete Loop's stored settings and data. YouTube Music data will not be affected.
            </p>
            <div class="loop-reset-modal-actions">
                <button type="button" class="loop-reset-modal-confirm">
                    <span class="loop-reset-modal-progress" aria-hidden="true"></span>
                    <span class="loop-reset-modal-confirm-content">Hold to reset Loop</span>
                </button>
                <button type="button" class="loop-reset-modal-cancel">Cancel</button>
            </div>
        </div>`;

    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    const confirm = modal.querySelector(".loop-reset-modal-confirm");

    modal.querySelector(".loop-reset-modal-close").addEventListener("click", close);
    modal.querySelector(".loop-reset-modal-cancel").addEventListener("click", close);
    let resetHoldTimer;
    let resetHolding = false;
    let resetComplete = false;

    const cancelResetHold = () => {
        if (!resetHolding || resetComplete) return;
        resetHolding = false;
        clearTimeout(resetHoldTimer);
        resetHoldTimer = undefined;
        confirm.classList.remove("holding");
        confirm.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to reset Loop";
    };

    confirm.addEventListener("pointerdown", (event) => {
        if (resetHolding || resetComplete) return;
        event.preventDefault();
        resetHolding = true;
        confirm.classList.add("holding");

        resetHoldTimer = setTimeout(async () => {
            if (!resetHolding) return;

            confirm.disabled = true;
            confirm.querySelector(".loop-reset-modal-confirm-content").textContent = "Deleting...";

            try {
                await resetLoopData();
                resetComplete = true;
                resetHolding = false;
                applyLoopPreferences();
                applyKawarpSettings(kawarpSettings);
                close();

                // Clear Cache Storage where the page is allowed to access it,
                // then return to the YT Music root and reload the page.
                try {
                    if ("caches" in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map((name) => caches.delete(name)));
                    }
                } catch (error) {
                    console.warn("[loop.mp3] Could not clear page Cache Storage:", error);
                }

                window.location.replace("/");
            } catch (error) {
                console.error("[loop.mp3] Could not reset Loop data:", error);
                confirm.disabled = false;
                resetHolding = false;
                confirm.classList.remove("holding");
                confirm.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to reset Loop";
                showLoopNotification("Could not reset Loop data.", 3000);
            }
        }, 1200);
    });

    confirm.addEventListener("pointerup", cancelResetHold);
    confirm.addEventListener("pointerleave", cancelResetHold);
    confirm.addEventListener("pointercancel", cancelResetHold);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });

    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });

    confirm.focus();
}

// Expose the reset modal to the DevTools console without relying on the
// extension's isolated-world globals.
document.addEventListener("loop:show-reset-modal", showLoopResetModal);

function showLyricsSubmissionModal() {
    if (document.getElementById("loop-lyrics-submit-modal")) return;

    const loop = document.getElementById("loop");
    const modal = document.createElement("div");
    modal.id = "loop-lyrics-submit-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-lyrics-submit-title");
    modal.innerHTML = `
        <section class="loop-lyrics-submit-card">
            <header class="loop-lyrics-submit-header">
                <div>
                    <div class="loop-lyrics-submit-kicker">LRCLIB contribution</div>
                    <h2 id="loop-lyrics-submit-title">Submit lyrics</h2>
                </div>
                <button type="button" class="loop-lyrics-submit-close" aria-label="Close lyrics submission">&#215;</button>
            </header>
            <p class="loop-lyrics-submit-warning">
                LRCLIB submissions are public and cannot be deleted or replaced. Check every detail before publishing.
            </p>
            <p class="loop-lyrics-submit-pow-note">
                Publishing also requires solving a proof-of-work challenge, which may take several minutes.
            </p>
            <form class="loop-lyrics-submit-form">
                <div class="loop-lyrics-submit-fields">
                    <label>Track Name <span>*</span>
                        <input name="trackName" type="text" required maxlength="200" autocomplete="off">
                    </label>
                    <label>Artist Name <span>*</span>
                        <input name="artistName" type="text" required maxlength="200" autocomplete="off">
                    </label>
                    <label>Album Name
                        <input name="albumName" type="text" maxlength="200" autocomplete="off">
                    </label>
                    <label>Duration (seconds)
                        <input name="duration" type="number" min="0" step="1" inputmode="numeric">
                    </label>
                </div>
                <section class="loop-lyrics-submit-input" aria-labelledby="loop-lyrics-submit-input-title">
                    <div class="loop-lyrics-submit-input-header">
                        <h3 id="loop-lyrics-submit-input-title">Lyrics input</h3>
                        <label class="loop-lyrics-submit-upload">
                            Upload .lrc file
                            <input class="loop-lyrics-submit-file" type="file" accept=".lrc,text/plain">
                        </label>
                    </div>
                    <label>Plain Lyrics
                        <textarea name="plainLyrics" rows="5" spellcheck="true"></textarea>
                    </label>
                    <label>Synced Lyrics
                        <textarea name="syncedLyrics" rows="6" spellcheck="false" placeholder="[mm:ss.xx] Lyrics line"></textarea>
                    </label>
                    <p class="loop-lyrics-submit-help">Leave both lyrics fields empty for instrumental tracks.</p>
                </section>
                <div class="loop-lyrics-submit-status" role="status" aria-live="polite" hidden></div>
                <div class="loop-reset-modal-actions loop-lyrics-submit-actions">
                    <button type="submit" class="loop-reset-modal-confirm loop-lyrics-submit-review-button">Review submission</button>
                    <button type="button" class="loop-reset-modal-cancel loop-lyrics-submit-cancel">Cancel</button>
                </div>
            </form>
            <section class="loop-lyrics-submit-review" hidden>
                <h3>Quality check</h3>
                <p class="loop-lyrics-submit-warning">
                    Verify the track metadata and lyric text. LRCLIB does not support deleting or replacing a published entry.
                </p>
                <dl class="loop-lyrics-submit-summary"></dl>
                <pre class="loop-lyrics-submit-preview" hidden></pre>
                <label class="loop-lyrics-submit-acknowledgement">
                    <input type="checkbox">
                    <span></span>
                </label>
                <div class="loop-lyrics-submit-status" role="status" aria-live="polite" hidden></div>
                <div class="loop-reset-modal-actions loop-lyrics-submit-actions">
                    <button type="button" class="loop-reset-modal-confirm loop-lyrics-submit-publish" disabled>
                        <span class="loop-reset-modal-progress" aria-hidden="true"></span>
                        <span class="loop-reset-modal-confirm-content">Hold to publish</span>
                    </button>
                    <button type="button" class="loop-reset-modal-cancel loop-lyrics-submit-back">Back to edit</button>
                </div>
            </section>
            <section class="loop-lyrics-submit-success" hidden>
                <h3>Submission published</h3>
                <p class="loop-lyrics-submit-success-message"></p>
                <div class="loop-reset-modal-actions loop-lyrics-submit-actions">
                    <button type="button" class="loop-reset-modal-cancel loop-lyrics-submit-done">Done</button>
                </div>
            </section>
        </section>`;

    (loop || document.body).appendChild(modal);

    const form = modal.querySelector(".loop-lyrics-submit-form");
    const review = modal.querySelector(".loop-lyrics-submit-review");
    const publishButton = modal.querySelector(".loop-lyrics-submit-publish");
    const closeButton = modal.querySelector(".loop-lyrics-submit-close");
    const cancelButton = modal.querySelector(".loop-lyrics-submit-cancel");
    const formStatus = modal.querySelector(".loop-lyrics-submit-form .loop-lyrics-submit-status");
    const reviewStatus = modal.querySelector(".loop-lyrics-submit-review .loop-lyrics-submit-status");
    const acknowledgement = modal.querySelector(".loop-lyrics-submit-acknowledgement input");
    let publishing = false;
    let publishRequestStarted = false;
    let cancelRequested = false;
    let challengeAbortController;
    let publishHoldTimer;
    let publishHolding = false;

    const close = () => {
        if (publishRequestStarted) return;
        clearTimeout(publishHoldTimer);
        publishHolding = false;
        if (publishing) {
            cancelRequested = true;
            challengeAbortController?.abort();
        }
        modal.remove();
    };
    const setStatus = (status, message, isError = false) => {
        status.textContent = message;
        status.hidden = !message;
        status.classList.toggle("is-error", isError);
    };
    const getSubmission = () => {
        const data = new FormData(form);
        const durationText = String(data.get("duration") || "").trim();
        const duration = durationText ? Number(durationText) : null;
        if (durationText && (!Number.isFinite(duration) || duration < 0)) {
            throw new Error("Duration must be a non-negative number.");
        }
        return {
            trackName: String(data.get("trackName") || "").trim(),
            artistName: String(data.get("artistName") || "").trim(),
            albumName: String(data.get("albumName") || "").trim(),
            duration: duration === null ? null : Math.round(duration),
            plainLyrics: String(data.get("plainLyrics") || "").trim() || null,
            syncedLyrics: String(data.get("syncedLyrics") || "").trim() || null,
        };
    };

    const trackInfo = {
        trackName: loop?.querySelector("#loop-track-title")?.textContent.trim() || "",
        artistName: loop?.querySelector("#loop-track-artist")?.textContent.trim() || "",
        albumName: loop?.querySelector("#loop-track-album")?.textContent.trim() || "",
    };
    const mediaDuration = getCurrentMedia()?.duration;
    for (const [field, value] of Object.entries(trackInfo)) {
        const input = form.elements.namedItem(field);
        if (value && !/^unknown (track|artist|album)$/i.test(value)) input.value = value;
    }
    if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
        form.elements.namedItem("duration").value = String(Math.round(mediaDuration));
    }

    const loadLrcFile = async (file) => {
        if (!file) return;
        try {
            const lyrics = await file.text();
            form.elements.namedItem("syncedLyrics").value = lyrics;
            form.elements.namedItem("plainLyrics").value = lyrics
                .replace(/(?:\[\d{1,3}:\d{2}(?:\.\d{1,3})?\])+/g, "")
                .split(/\r?\n/)
                .filter((line) => line.trim() && !/^\[[a-z]{2,}:.+\]$/i.test(line.trim()))
                .join("\n");
            setStatus(formStatus, "");
        } catch (error) {
            console.error("[loop.mp3] Could not read the LRC file:", error);
            setStatus(formStatus, "Could not read that .lrc file.", true);
        }
    };
    const fileInput = modal.querySelector(".loop-lyrics-submit-file");
    fileInput.addEventListener("change", () => loadLrcFile(fileInput.files?.[0]));
    const uploadLabel = modal.querySelector(".loop-lyrics-submit-upload");
    uploadLabel.addEventListener("dragover", (event) => event.preventDefault());
    uploadLabel.addEventListener("drop", (event) => {
        event.preventDefault();
        loadLrcFile(event.dataTransfer?.files?.[0]);
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        setStatus(formStatus, "");
        if (!form.reportValidity()) return;

        let submission;
        try {
            submission = getSubmission();
        } catch (error) {
            setStatus(formStatus, error.message, true);
            return;
        }

        const isInstrumental = !submission.plainLyrics && !submission.syncedLyrics;
        const summary = modal.querySelector(".loop-lyrics-submit-summary");
        summary.replaceChildren();
        [
            ["Track", submission.trackName],
            ["Artist", submission.artistName],
            ["Album", submission.albumName || "Not provided"],
            ["Duration", submission.duration === null ? "Not provided" : `${submission.duration} seconds`],
            ["Lyrics", isInstrumental ? "Instrumental (both fields empty)" : [
                submission.plainLyrics ? "Plain" : "",
                submission.syncedLyrics ? "Synced" : "",
            ].filter(Boolean).join(" + ")],
        ].forEach(([label, value]) => {
            const term = document.createElement("dt");
            const detail = document.createElement("dd");
            term.textContent = label;
            detail.textContent = value;
            summary.append(term, detail);
        });

        const preview = modal.querySelector(".loop-lyrics-submit-preview");
        const previewText = submission.syncedLyrics || submission.plainLyrics;
        preview.hidden = !previewText;
        preview.textContent = previewText || "";
        const acknowledgementText = modal.querySelector(".loop-lyrics-submit-acknowledgement span");
        acknowledgementText.textContent = isInstrumental
            ? "I confirm this track is instrumental and both lyrics fields are intentionally empty. I have checked the metadata and understand this submission cannot be removed."
            : "I have checked the metadata, lyric text, and any timestamps for accuracy. I understand this submission cannot be removed.";
        acknowledgement.checked = false;
        publishButton.disabled = true;
        form.hidden = true;
        review.hidden = false;
        setStatus(reviewStatus, "");
        acknowledgement.focus();
    });

    acknowledgement.addEventListener("change", () => {
        publishButton.disabled = !acknowledgement.checked || publishing;
    });
    modal.querySelector(".loop-lyrics-submit-back").addEventListener("click", () => {
        if (publishing) return;
        review.hidden = true;
        form.hidden = false;
        setStatus(reviewStatus, "");
        modal.querySelector(".loop-lyrics-submit-review-button").focus();
    });

    const solvePublishChallenge = async (status) => {
        if (!crypto.subtle) throw new Error("This browser cannot run LRCLIB's secure publish challenge.");

        challengeAbortController = new AbortController();
        const challengeResponse = await fetch("https://lrclib.net/api/request-challenge", {
            method: "POST",
            signal: challengeAbortController.signal,
        });
        if (!challengeResponse.ok) {
            throw new Error(`LRCLIB challenge request failed (${challengeResponse.status}).`);
        }
        const challenge = await challengeResponse.json();
        const { prefix, target } = challenge || {};
        if (typeof prefix !== "string" || typeof target !== "string" || !/^[0-9a-f]+$/i.test(target)) {
            throw new Error("LRCLIB returned an invalid publish challenge.");
        }

        const encoder = new TextEncoder();
        const targetValue = BigInt(`0x${target}`);
        if (targetValue === 0n) throw new Error("LRCLIB returned an unsolvable publish challenge.");
        let nonce = 0;
        while (true) {
            if (cancelRequested) return null;
            const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${prefix}${nonce}`));
            const hash = [...new Uint8Array(digest)]
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join("");
            if (BigInt(`0x${hash}`) < targetValue) return `${prefix}:${nonce}`;
            nonce += 1;
            if (nonce % 256 === 0) {
                if (nonce % 4096 === 0) {
                    status.textContent = `Solving LRCLIB's publish challenge (${nonce.toLocaleString()} attempts)…`;
                }
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }
    };

    const resetPublishHold = () => {
        if (!publishHolding) return;
        publishHolding = false;
        clearTimeout(publishHoldTimer);
        publishHoldTimer = undefined;
        publishButton.classList.remove("holding");
        publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to publish";
    };
    const startPublishHold = (event) => {
        if (!acknowledgement.checked || publishing || publishHolding || event.repeat) return;
        event.preventDefault();
        publishHolding = true;
        publishButton.classList.add("holding");
        publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Keep holding…";
        publishHoldTimer = setTimeout(() => {
            publishHolding = false;
            publishHoldTimer = undefined;
            publishButton.classList.remove("holding");
            publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Preparing…";
            publishLyrics();
        }, 1200);
    };

    const publishLyrics = async () => {
        if (!acknowledgement.checked || publishing) return;
        publishing = true;
        publishButton.disabled = true;
        modal.querySelector(".loop-lyrics-submit-back").disabled = true;
        setStatus(reviewStatus, "Requesting LRCLIB's publish challenge…");

        try {
            const submission = getSubmission();
            const publishToken = await solvePublishChallenge(reviewStatus);
            if (!publishToken || cancelRequested) return;
            setStatus(reviewStatus, "Publishing lyrics to LRCLIB…");
            publishRequestStarted = true;
            modal.querySelector(".loop-lyrics-submit-back").disabled = true;
            closeButton.disabled = true;
            cancelButton.disabled = true;
            const response = await chrome.runtime.sendMessage({
                type: "publish-lyrics",
                publishToken,
                submission,
            });
            if (!response?.ok) {
                if (response?.status) {
                    const details = (response.text || "").trim();
                    throw new Error(`LRCLIB rejected the submission (${response.status})${details ? `: ${details}` : "."}`);
                }
                throw new Error(response?.error || "Could not reach LRCLIB.");
            }

            let resultMessage = "Your lyrics were published to LRCLIB.";
            const responseText = (response.text || "").trim();
            if (responseText) {
                try {
                    const result = JSON.parse(responseText);
                    if (typeof result.message === "string" && result.message) resultMessage = result.message;
                } catch {
                    resultMessage = responseText;
                }
            }
            publishRequestStarted = false;
            publishing = false;
            review.hidden = true;
            modal.querySelector(".loop-lyrics-submit-success-message").textContent = resultMessage;
            modal.querySelector(".loop-lyrics-submit-success").hidden = false;
            modal.querySelector(".loop-lyrics-submit-done").focus();
            showLoopNotification("Lyrics submitted to LRCLIB.", 3000);
        } catch (error) {
            if (cancelRequested) return;
            console.error("[loop.mp3] Could not submit lyrics to LRCLIB:", error);
            setStatus(reviewStatus, error.message || "Could not submit lyrics to LRCLIB.", true);
            publishing = false;
            publishRequestStarted = false;
            publishButton.disabled = !acknowledgement.checked;
            publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to publish";
            modal.querySelector(".loop-lyrics-submit-back").disabled = false;
            closeButton.disabled = false;
            cancelButton.disabled = false;
        }
    };

    publishButton.addEventListener("pointerdown", startPublishHold);
    publishButton.addEventListener("pointerup", resetPublishHold);
    publishButton.addEventListener("pointerleave", resetPublishHold);
    publishButton.addEventListener("pointercancel", resetPublishHold);
    publishButton.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") startPublishHold(event);
    });
    publishButton.addEventListener("keyup", (event) => {
        if (event.key === " " || event.key === "Enter") resetPublishHold();
    });

    closeButton.addEventListener("click", close);
    cancelButton.addEventListener("click", close);
    modal.querySelector(".loop-lyrics-submit-done").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });

    modal.querySelector('[name="trackName"]').focus();
}

async function resetLoopData() {
    const localStorageArea =
        globalThis.chrome?.storage?.local || globalThis.browser?.storage?.local;

    if (localStorageArea) {
        await new Promise((resolve, reject) => {
            localStorageArea.clear(() => {
                const error = globalThis.chrome?.runtime?.lastError ||
                    globalThis.browser?.runtime?.lastError;
                if (error) {
                    reject(new Error(error.message));
                    return;
                }
                resolve();
            });
        });
    }

    // Loop historically stored a few values in the page's localStorage.
    // Remove only Loop-owned keys, never clear the site's storage wholesale.
    try {
        localStorage.removeItem(loopPreferencesKey);
        localStorage.removeItem(kawarpConfigKey);
        localStorage.removeItem(kawarpCustomPresetsKey);
        localStorage.removeItem(getOnboardingStorageKey());
    } catch (error) {
        console.warn("[loop.mp3] Could not clear Loop's legacy localStorage keys:", error);
    }

    loopPreferences = {
        animatedBackground: true,
        hideVinyl: true,
        hideArtwork: false,
        showNavigationButtons: false,
        autoOpenMiniPlayer: true,
        useLegacyFallbackArtwork: false,
        showAlbum: false,
        showLyrics: false,
        trackPresentationModes: {},
        showWriterCredits: true,
        useLyricsCache: true,
        useGrooveOverrides: true,
        enableLyricsTranslation: false,
        lyricsTranslationLanguage: "en",
        lyricsProviderOrder: ["lyricsplus", "binilyrics-ttml", "binilyrics-lrc", "lrclib", "groove", "groove-dev"],
        loopUpdateInterval: defaultLoopUpdateInterval,
        kawarpFpsCap: defaultKawarpFpsCap,
        kawarpFpsLogging: false,
        volume: 1,
        theme: "default",
        videoBehaviorEnabled: true,
        videoUiRearrangement: true,
    };

    kawarpSettings = { ...defaultKawarpSettings };
    kawarpEnabled = true;
    lyricsRequestId++;
    startLoopUpdatePolling(loopUpdatePlayerBar);

    return true;
}

function applyLoopPreferences() {
    const loop = document.querySelector("#loop");
    if (!loop) return;
    const media = getCurrentMedia();
    const preferredVolume = getPreferredVolume();
    if (media) media.volume = preferredVolume;
    applyLoopTheme();
    miniPlayerBridge?.setTheme(loopPreferences.theme);
    loop.classList.toggle("loop-no-vinyl", loopPreferences.hideVinyl);
    loop.classList.toggle("loop-hide-album", !loopPreferences.showAlbum);
    loop.classList.toggle("loop-lyrics-disabled", !loopPreferences.showLyrics);
    applyVideoPresentationPreferences();
    const vinylToggle = loop.querySelector("#loop-vinyl-toggle");
    if (vinylToggle) vinylToggle.checked = loopPreferences.hideVinyl;
    const navigationToggle = loop.querySelector("#loop-navigation-toggle");
    if (navigationToggle) navigationToggle.checked = Boolean(loopPreferences.showNavigationButtons);
    const miniPlayerToggle = loop.querySelector("#loop-mini-player-toggle");
    if (miniPlayerToggle) miniPlayerToggle.checked = loopPreferences.autoOpenMiniPlayer !== false;
    const legacyFallbackToggle = loop.querySelector("#loop-legacy-fallback-toggle");
    if (legacyFallbackToggle) legacyFallbackToggle.checked = Boolean(loopPreferences.useLegacyFallbackArtwork);
    const albumToggle = loop.querySelector("#loop-album-toggle");
    if (albumToggle) albumToggle.checked = Boolean(loopPreferences.showAlbum);
    const lyricsToggle = loop.querySelector("#loop-lyrics-toggle");
    if (lyricsToggle) lyricsToggle.checked = Boolean(loopPreferences.showLyrics);
    const lyricsRenderingEngine = loop.querySelector("#loop-lyrics-rendering-engine");
    if (lyricsRenderingEngine) lyricsRenderingEngine.value = normalizeLyricsRenderingEngine(loopPreferences.lyricsRenderingEngine);
    const lyricsRenderingWarning = loop.querySelector("#loop-lyrics-rendering-warning");
    if (lyricsRenderingWarning) lyricsRenderingWarning.hidden = loopPreferences.lyricsRenderingEngine !== "ludo";
    const wordWobbleToggle = loop.querySelector("#loop-lyrics-word-wobble-toggle");
    if (wordWobbleToggle) wordWobbleToggle.checked = loopPreferences.animateWordWobble === true;
    applyLyricsAnimationPreferences();
    const writerCreditsToggle = loop.querySelector("#loop-writer-credits-toggle");
    if (writerCreditsToggle) writerCreditsToggle.checked = loopPreferences.showWriterCredits !== false;
    const lyricsCacheToggle = loop.querySelector("#loop-lyrics-cache-toggle");
    if (lyricsCacheToggle) lyricsCacheToggle.checked = loopPreferences.useLyricsCache !== false;
    const grooveOverridesToggle = loop.querySelector("#loop-groove-overrides-toggle");
    if (grooveOverridesToggle) grooveOverridesToggle.checked = loopPreferences.useGrooveOverrides !== false;
    const translationToggle = loop.querySelector("#loop-lyrics-translation-toggle");
    if (translationToggle) translationToggle.checked = loopPreferences.enableLyricsTranslation === true;
    const translationLanguage = loop.querySelector("#loop-lyrics-translation-language");
    if (translationLanguage) translationLanguage.value = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
    updateLoopPollingPreferenceUI();
    kawarpBackground?.setOptions({
        fpsCap: loopPreferences.kawarpFpsCap,
        fpsLogging: loopPreferences.kawarpFpsLogging,
    });
    const kawarpFpsLoggingToggle = loop.querySelector("#loop-kawarp-fps-logging-toggle");
    if (kawarpFpsLoggingToggle) kawarpFpsLoggingToggle.checked = loopPreferences.kawarpFpsLogging;
    miniPlayerBridge?.syncEffects();
    const lyricsProviderSelect = loop.querySelector("#loop-lyrics-provider-select");
    if (lyricsProviderSelect) {
        const order = getLyricsProviderOrder();
        const displayOrder = [...order, ...lyricsProviders
            .map((provider) => provider.id)
            .filter((providerId) => !order.includes(providerId))];
        lyricsProviderSelect.replaceChildren(...displayOrder.map((providerId, index) => {
            const provider = lyricsProviders.find((entry) => entry.id === providerId);
            const option = new Option(`${provider.label} (priority ${index + 1})`, provider.id);
            return option;
        }));
        lyricsProviderSelect.value = order[0];
    }
    const volumeSlider = loop.querySelector("#loop-volume-slider");
    if (volumeSlider) volumeSlider.value = String(preferredVolume);
    const lyricsPanel = loop.querySelector("#loop-lyrics-panel");
    if (lyricsPanel && !loopPreferences.showLyrics) {
        lyricsPanel.hidden = true;
        braccatoLyricsRenderer?.clear();
    }
    setTrackNavigationButtonsVisible(Boolean(loopPreferences.showNavigationButtons));
    applyArtworkPreference();
    miniPlayerBridge?.sync(getCurrentMedia());
    publishElectronMiniPlayerState({ force: true });
}

function applyVideoPresentationPreferences() {
    const loop = document.querySelector("#loop");
    if (!loop) return;

    const isVideo = loop.dataset.videoBackground === "true";
    const behaviorEnabled = forcedVideoMode || loopPreferences.videoBehaviorEnabled !== false;
    const rearrangementEnabled = behaviorEnabled && loopPreferences.videoUiRearrangement === true;
    loop.classList.toggle("loop-video-mode", isVideo && behaviorEnabled);
    loop.classList.toggle("loop-video-ui-rearranged", isVideo && rearrangementEnabled);
    updateArtworkVideoToggle();

    if (!isVideo || !behaviorEnabled) {
        window.clearTimeout(videoUiHideTimer);
        loop.classList.remove("loop-video-ui-hidden");
    }

    const behaviorToggle = loop.querySelector("#loop-video-behavior-toggle");
    const rearrangementToggle = loop.querySelector("#loop-video-ui-rearrangement-toggle");
    if (behaviorToggle) behaviorToggle.checked = behaviorEnabled;
    if (rearrangementToggle) {
        rearrangementToggle.checked = loopPreferences.videoUiRearrangement === true;
        rearrangementToggle.disabled = !behaviorEnabled;
    }
}

function updateArtworkVideoToggle() {
    const loop = document.querySelector("#loop");
    const toggle = loop?.querySelector("#loop-artwork-video-toggle");
    if (!toggle) return;

    const videoActive = loop.dataset.videoBackground === "true";
    const mode = getTrackPresentationMode(lastTrackId);
    toggle.dataset.mode = videoActive ? "video" : "artwork";
    toggle.dataset.override = mode;
    toggle.setAttribute("aria-pressed", String(videoActive));
    toggle.querySelectorAll("[data-loop-view-mode]").forEach((button) => {
        const buttonMode = button.dataset.loopViewMode;
        button.classList.toggle("is-active", buttonMode === mode);
        button.setAttribute("aria-pressed", String(buttonMode === mode));
    });
}

function setTrackPresentationMode(mode) {
    const loop = document.querySelector("#loop");
    const trackId = lastTrackId || getCurrentTrackId(getYTMPlayerRoot());
    if (!loop || !trackId || !["auto", "audio", "video"].includes(mode)) return;

    loopPreferences.trackPresentationModes = normalizeTrackPresentationModes(loopPreferences.trackPresentationModes);
    if (mode === "auto") {
        delete loopPreferences.trackPresentationModes[trackId];
    } else {
        loopPreferences.trackPresentationModes[trackId] = mode;
    }
    saveLoopPreferences();

    forcedVideoMode = mode === "video";
    forcedArtworkMode = mode === "audio";
    const trackHasVideo = loop.dataset.trackVideo === "true";
    const videoActive = mode === "video" || (mode === "auto" && trackHasVideo);
    loop.dataset.videoForced = String(mode === "video");
    loop.dataset.videoBackground = String(videoActive);
    applyVideoPresentationPreferences();
    updateVideoBackground(trackId, videoActive);
    if (videoActive) showVideoUi();
}

function applyArtworkPreference() {
    const loop = document.querySelector("#loop");
    const artwork = loop?.querySelector("#loop-artwork");
    if (!artwork) return;

    const fallback = getFallbackArtwork();
    const displayedArtwork = loopPreferences.hideArtwork || loop.classList.contains("loop-empty")
        ? fallback
        : currentArtworkURL || fallback;
    artwork.src = displayedArtwork;
    artwork.setAttribute("onerror", `this.onerror=null; this.src='${fallback}';`);
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

function updateLoopMenuOverflow(panel = document.getElementById("loop-shortcuts-panel")) {
    if (!panel) return;

    const expandButton = panel.querySelector("#loop-shortcuts-expand-button");
    if (!expandButton) return;

    const isScrollable = panel.scrollHeight > panel.clientHeight + 1;
    const isExpanded = panel.classList.contains("loop-shortcuts-expanded");
    expandButton.hidden = !isScrollable && !isExpanded;
    expandButton.textContent = isExpanded ? "Collapse menu" : "Expand menu";
    expandButton.setAttribute("aria-expanded", String(isExpanded));
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
    const actionBar = document.querySelector("yt-video-action-bar-view-model.ytMusicMiniPlayerActionBar") ||
        document.querySelector("yt-video-action-bar-view-model");
    const playerPage = document.querySelector("ytmusic-player-page");
    const playerBar = playerPage?.querySelector("ytmusic-player-bar") ||
        document.querySelector("ytmusic-player-bar");
    const roots = [
        actionBar,
        document.querySelector("ytmusic-miniplayer-slot#player-bar"),
        playerBar,
        document.querySelector("ytmusic-track-info"),
        playerPage || getYTMPlayerRoot(),
        document,
    ].filter((root, index, all) => root && all.indexOf(root) === index);

    // The current player bar groups both feedback controls in this renderer.
    // Prefer its action-specific button so a Like control elsewhere in the
    // page cannot be mistaken for the current track's feedback button.
    const rendererButtonSelector = action === "like"
        ? "like-button-view-model button, #button-shape-like button, #button-shape-like, .like button, .like"
        : "dislike-button-view-model button, #button-shape-dislike button, #button-shape-dislike, .dislike button, .dislike";
    const rendererButton = roots
        .flatMap((root) => [...root.querySelectorAll(
            "ytmusic-like-button-renderer, segmented-like-dislike-button-view-model"
        )])
        .map((renderer) => renderer.querySelector(rendererButtonSelector))
        .find((button) => button && !button.closest("#loop") && (
            button.offsetParent !== null || button.getClientRects().length > 0
        ));
    if (rendererButton) return rendererButton;

    // The newer player bar uses native buttons, but the legacy bar uses
    // `tp-yt-paper-icon-button`/`yt-icon-button` custom elements. Search by
    // label as well as tag name so both versions remain actionable.
    const exactSelector = action === "like"
        ? '[aria-label^="like this video" i]'
        : '[aria-label^="dislike this video" i]';
    const exactCandidates = roots.flatMap((root) => [...root.querySelectorAll(exactSelector)]);
    const candidates = [
        ...exactCandidates,
        ...roots.flatMap((root) => [...root.querySelectorAll(
            "button, [role=button], tp-yt-paper-icon-button, yt-icon-button, [aria-label], [title]"
        )]),
    ].filter((button, index, all) => all.indexOf(button) === index);
    return candidates.find((button) => {
        if (button.closest("#loop")) return false;
        const label = [
            button.getAttribute("aria-label"),
            button.getAttribute("title"),
            button.textContent,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!label || !label.includes(action)) return false;
        if (action === "like" && label.includes("dislike")) return false;
        return button.offsetParent !== null || button.getClientRects().length > 0;
    });
}

function returnToLoopUI(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const playerBar = getYTMPlayerRoot();
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
    // The player page can briefly expose its queue/context labels ("Autoplay")
    // instead of the live track metadata after returning from normal YTM.
    // Force the normal sync path to run again so oEmbed/live player metadata
    // replaces that transient placeholder instead of being skipped by the
    // previous track signature.
    lastTrackKey = "";
    updateForCurrentTrack(playerBar);
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

function getExtensionURL(path) {
    const runtime = globalThis.chrome?.runtime || globalThis.browser?.runtime;
    try {
        return runtime?.getURL(path) || path;
    } catch (error) {
        console.warn("[loop.mp3] Extension context unavailable while resolving asset:", error);
        return path;
    }
}

function escapeTTMLText(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function formatTTMLTime(milliseconds) {
    const totalSeconds = Math.max(0, Number(milliseconds) || 0) / 1_000;
    const hours = Math.floor(totalSeconds / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
}

function lyricsPlusToTTML(lines) {
    const body = lines
        .filter((line) => line?.text && Number.isFinite(Number(line.time)))
        .map((line, index, validLines) => {
            const start = Number(line.time);
            const explicitEnd = start + Math.max(0, Number(line.duration) || 0);
            const nextStart = Number(validLines[index + 1]?.time);
            const end = explicitEnd > start ? explicitEnd : Number.isFinite(nextStart) ? nextStart : start + 4_000;
            const syllables = Array.isArray(line.syllabus) ? line.syllabus : [];
            const content = syllables.length
                ? syllables.map((syllable) => `<span begin="${formatTTMLTime(syllable.time)}" dur="${formatTTMLTime(syllable.duration)}">${escapeTTMLText(syllable.text)}</span>`).join("")
                : escapeTTMLText(line.text);
            return `<p begin="${formatTTMLTime(start)}" end="${formatTTMLTime(end)}">${content}</p>`;
        })
        .join("");
    return `<tt xmlns="http://www.w3.org/ns/ttml"><body><div>${body}</div></body></tt>`;
}

function parseTTMLTimestamp(value) {
    const timestamp = String(value || "").trim();
    if (/^\d+(?:\.\d+)?$/.test(timestamp)) return Number(timestamp) * 1_000;
    const clockParts = timestamp.split(":");
    if (clockParts.length >= 2 && clockParts.length <= 3 && clockParts.every((part) => /^\d+(?:\.\d+)?$/.test(part))) {
        const seconds = Number(clockParts.pop());
        const minutes = Number(clockParts.pop() || 0);
        const hours = Number(clockParts.pop() || 0);
        return (hours * 3_600 + minutes * 60 + seconds) * 1_000;
    }
    const offset = timestamp.match(/^(\d+(?:\.\d+)?)(ms|s)$/);
    if (offset) return Number(offset[1]) * (offset[2] === "s" ? 1_000 : 1);
    return NaN;
}

function hasTTMLPreservedWhitespace(node) {
    let current = node?.parentNode;
    while (current) {
        const space = current.getAttribute?.("xml:space") || current.getAttributeNS?.("http://www.w3.org/XML/1998/namespace", "space");
        if (space) return space === "preserve";
        current = current.parentNode;
    }
    return false;
}

function getTTMLTextNodeContent(node) {
    const text = node.nodeValue || "";
    if (/\S/u.test(text) || hasTTMLPreservedWhitespace(node)) return text;
    // A single literal space between inline spans is lyric content. Newlines, tabs,
    // and runs of whitespace without xml:space="preserve" are normally indentation.
    return text === " " ? text : "";
}

function parseTTMLLyrics(ttml, songDurationMs) {
    if (typeof DOMParser !== "function") return [];
    const documentRoot = new DOMParser().parseFromString(String(ttml), "application/xml");
    if (documentRoot.querySelector("parsererror")) return [];
    const paragraphs = [...documentRoot.getElementsByTagNameNS("*", "p")];
    return paragraphs.map((paragraph, index) => {
        const startTimeMs = parseTTMLTimestamp(paragraph.getAttribute("begin"));
        if (!Number.isFinite(startTimeMs)) return null;
        const nextStartTimeMs = parseTTMLTimestamp(paragraphs[index + 1]?.getAttribute("begin"));
        const explicitEndTimeMs = parseTTMLTimestamp(paragraph.getAttribute("end"));
        const durationMs = Math.max(0,
            Number.isFinite(explicitEndTimeMs) ? explicitEndTimeMs - startTimeMs :
                Number.isFinite(nextStartTimeMs) ? nextStartTimeMs - startTimeMs :
                    Number.isFinite(songDurationMs) ? songDurationMs - startTimeMs : 4_000
        );
        const parts = [];
        let pendingText = "";
        let leadingText = "";
        for (const child of paragraph.childNodes || []) {
            if (child.nodeType !== 1 || child.localName !== "span") {
                pendingText += child.nodeType === 3 ? getTTMLTextNodeContent(child) : "";
                continue;
            }
            const partStartTimeMs = parseTTMLTimestamp(child.getAttribute("begin"));
            const explicitEndTimeMs = parseTTMLTimestamp(child.getAttribute("end"));
            const explicitDurationMs = parseTTMLTimestamp(child.getAttribute("dur"));
            const partDurationMs = Number.isFinite(explicitDurationMs)
                ? explicitDurationMs
                : Number.isFinite(explicitEndTimeMs) && Number.isFinite(partStartTimeMs)
                    ? explicitEndTimeMs - partStartTimeMs
                    : NaN;
            if (!Number.isFinite(partStartTimeMs) || !Number.isFinite(partDurationMs) || partDurationMs < 0 || !child.textContent) continue;
            if (pendingText) {
                if (parts.length) parts[parts.length - 1].words += pendingText;
                else leadingText += pendingText;
                pendingText = "";
            }
            parts.push({ startTimeMs: partStartTimeMs, durationMs: partDurationMs, words: child.textContent });
        }
        const trailingText = pendingText;
        const words = `${leadingText}${parts.map((part) => part.words).join("")}${trailingText}`.trim();
        return {
            startTimeMs,
            durationMs,
            words,
            parts: parts.length ? parts : undefined,
        };
    }).filter((line) => line?.words).sort((left, right) => left.startTimeMs - right.startTimeMs);
}

function hasSyncedLyricTimestamps(syncedLyrics) {
    return String(syncedLyrics || "")
        .split(/\r?\n/)
        .some((line) => /^\[\d+:\d+(?:\.\d+)?\]/.test(line));
}

function clearLyricsRetryTimer() {
    clearTimeout(lyricsRetryTimer);
    lyricsRetryTimer = undefined;
}

function scheduleLyricsRetry(trackId) {
    if (lyricsRetryTimer || !trackId || !loopPreferences.showLyrics) return;
    lyricsRetryTimer = setTimeout(() => {
        lyricsRetryTimer = undefined;
        const currentTrackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
        // A usable render wins over scheduled recovery work. Do not start another provider
        // round just because an older attempt left a timer behind.
        if (
            loopPreferences.showLyrics &&
            currentTrackId === trackId &&
            !currentParsedLyrics.length &&
            lyricsLoadedTrackId !== trackId &&
            lyricsFetchInFlightTrackId !== trackId
        ) {
            fetchLoopLyricsForCurrentTrack(true).catch((error) => {
                console.warn("[loop.mp3] Could not retry lyrics for the current track:", error);
            });
        }
    }, LYRICS_RETRY_INTERVAL_MS);
}

function getCurrentTrackDurationInSeconds() {
    const duration = Number(getCurrentMedia()?.duration);
    return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

async function waitForCurrentTrackDuration(timeoutMs = 3000) {
    const currentDuration = getCurrentTrackDurationInSeconds();
    if (currentDuration !== null) return currentDuration;

    return new Promise((resolve) => {
        const mediaElements = [...document.querySelectorAll("video, audio")];
        let timeoutId;
        let intervalId;

        const finish = () => {
            mediaElements.forEach((media) => {
                media.removeEventListener("loadedmetadata", checkDuration);
                media.removeEventListener("durationchange", checkDuration);
            });
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            resolve(getCurrentTrackDurationInSeconds());
        };
        const checkDuration = () => {
            if (getCurrentTrackDurationInSeconds() !== null) finish();
        };

        mediaElements.forEach((media) => {
            media.addEventListener("loadedmetadata", checkDuration);
            media.addEventListener("durationchange", checkDuration);
        });
        intervalId = setInterval(checkDuration, 100);
        timeoutId = setTimeout(finish, timeoutMs);
        checkDuration();
    });
}

function lyricsDurationExceedsTrack(lyricsResult, lyricsQueryResult, trackDurationInSeconds, syncedLyrics) {
    if (!Number.isFinite(trackDurationInSeconds)) return false;
    const duration = Number(lyricsResult?.duration ?? lyricsQueryResult?.duration);
    const durationExceeds = Number.isFinite(duration) && Math.round(duration + 30) > trackDurationInSeconds;
    if (!durationExceeds) return false;

    const lastNonEmptyLine = String(syncedLyrics || "")
        .split(/\r?\n/)
        .reverse()
        .find((line) => line.replace(/\[\d{1,3}:\d{2}(?:\.\d+)?\]/g, "").trim());
    const lastLyricTimestamp = lastNonEmptyLine?.match(/\[(\d{1,3}):(\d{2})(?:\.(\d+))?\]/);
    if (!lastLyricTimestamp) return durationExceeds;

    const lyricEnd = Number(lastLyricTimestamp[1]) * 60 + Number(lastLyricTimestamp[2]) +
        Number(`0.${lastLyricTimestamp[3] || 0}`);
    return lyricEnd > trackDurationInSeconds;
}
// no longer needed its causing more inaccuracy :sob:
function LyricsTitleMatchesTrack(lyricsResult, lyricsQueryResult, title) {
    const lyricsTitle = String(lyricsResult?.title ?? lyricsQueryResult?.title ?? "").trim().toLowerCase();
    const trackTitle = String(title ?? "").trim().toLowerCase();
    return lyricsTitle && trackTitle && lyricsTitle === trackTitle;
}

function normalizeLyricsResponse(payload, providerId) {
    const candidates = [payload, ...(Array.isArray(payload) ? payload : []), payload?.lyrics, payload?.data, payload?.result, payload?.track]
        .filter((candidate) => candidate && typeof candidate === "object");
    const source = candidates.find((candidate) =>
        candidate.syncedLyrics || candidate.synced_lyrics || candidate.lrc ||
        candidate.plainLyrics || candidate.plain_lyrics || candidate.lyrics || candidate.instrumental === true
    );
    if (!source) return null;
    const nestedLyrics = source.lyrics && typeof source.lyrics === "object" ? source.lyrics : {};
    const syncedLyrics = source.syncedLyrics || source.synced_lyrics || source.lrc ||
        nestedLyrics.syncedLyrics || nestedLyrics.synced_lyrics || nestedLyrics.lrc ||
        (typeof source.lyrics === "string" ? source.lyrics : null);
    const plainLyrics = source.plainLyrics || source.plain_lyrics ||
        nestedLyrics.plainLyrics || nestedLyrics.plain_lyrics;
    if (!syncedLyrics && !plainLyrics && source.instrumental !== true) return null;
    return {
        meta: {
            ...source,
            provider: providerId,
            instrumental: source.instrumental === true,
            duration: source.duration,
            lyricsUnavailable: !syncedLyrics && !plainLyrics && source.instrumental !== true,
        },
        syncedLyrics: source.instrumental && !syncedLyrics && !plainLyrics
            ? "[00:00.00] Instrumental only\n[99:99.99] ♪"
            : syncedLyrics || null,
        plainLyrics: plainLyrics || null,
    };
}

async function getLyricsFromGroove(trackId, title, artist, trackDurationInSeconds, providerId = "groove", signal) {
    if (!trackId) throw new Error("Groove requires a track ID");
    const provider = lyricsProviders.find((entry) => entry.id === providerId) || lyricsProviders[0];
    const queryParams = new URLSearchParams();
    if (Number.isFinite(trackDurationInSeconds)) {
        queryParams.set("duration", String(trackDurationInSeconds));
    }
    if (loopPreferences.useGrooveOverrides !== false) {
        queryParams.set("overrides", "true");
    }
    const query = queryParams.toString();
    const response = await fetch(`${provider.endpoint}/${encodeURIComponent(trackId)}${query ? `?${query}` : ""}`, {
        cache: "no-store",
        signal,
    });
    if (!response.ok) throw new Error(`${provider.label} returned ${response.status}`);
    const lyrics = normalizeLyricsResponse(await response.json(), providerId);
    if (!lyrics) throw new Error(`${provider.label} returned no usable lyrics`);
    // Keep override-enabled and override-disabled cache entries distinguishable.
    lyrics.meta.override = loopPreferences.useGrooveOverrides !== false;
    return lyrics;
}

async function getLyricsFromLyricsPlus(trackId, title, artist, signal) {
    const provider = lyricsProviders.find((entry) => entry.id === "lyricsplus");
    const fetchLyrics = (searchArtist) => {
        const query = new URLSearchParams({ title, artist: searchArtist }).toString();
        return fetch(`${provider.endpoint}?${query}`, { signal });
    };

    let response = await fetchLyrics(artist);
    if (response.status === 404 && trackId) {
        try {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`;
            const oEmbedResponse = await fetch(oEmbedUrl, { signal });
            if (oEmbedResponse.ok) {
                const oEmbed = await oEmbedResponse.json();
                const oEmbedArtist = String(oEmbed.author_name || "")
                    .replace(/\s*[-–—]\s*Topic$/i, "")
                    .trim();
                if (oEmbedArtist && oEmbedArtist.toLowerCase() !== String(artist || "").trim().toLowerCase()) {
                    console.log("[loop.mp3] LyricsPlus artist retry using the track author:", {
                        title,
                        artist,
                        trackAuthor: oEmbedArtist,
                    });
                    response = await fetchLyrics(oEmbedArtist);
                }
            }
        } catch (error) {
            if (error?.name === "AbortError") throw error;
            console.warn("[loop.mp3] LyricsPlus track-author retry failed:", error);
        }
    }
    if (!response.ok) throw new Error(`LyricsPlus returned ${response.status}`);

    const payload = await response.json();
    const lines = Array.isArray(payload?.lyrics) ? payload.lyrics : [];
    const syncedLyrics = lyricsPlusToTTML(lines);
    if (!syncedLyrics || !lines.some((line) => line?.text)) throw new Error("LyricsPlus returned no usable lyrics");

    return normalizeLyricsResponse({
        ...payload,
        syncedLyrics,
        plainLyrics: lines
            .filter((line) => line.text)
            .map((line) => line.text)
            .join("\n"),
        duration: payload?.metadata?.totalDuration || payload?.duration,
        songWriters: payload?.metadata?.songWriters || [],
    }, "lyricsplus");
}

async function getLyricsFromBinilyrics(title, artist, trackDurationInSeconds, providerId, signal) {
    const provider = lyricsProviders.find((entry) => entry.id === providerId);
    const searchQuery = new URLSearchParams({ q: `${title} ${artist}` }).toString();
    const searchResponse = await fetch(`${provider.endpoint}/search.json?${searchQuery}`, { signal });
    if (!searchResponse.ok) throw new Error(`${provider.label} search returned ${searchResponse.status}`);

    const searchPayload = await searchResponse.json();
    const hits = Array.isArray(searchPayload?.hits) ? searchPayload.hits : [];
    if (!hits.length) throw new Error(`${provider.label} returned no matches`);

    const requestedDuration = Number(trackDurationInSeconds);
    const selectedHit = [...hits].sort((left, right) => {
        const durationDelta = (hit) => Number.isFinite(requestedDuration) && Number.isFinite(Number(hit?.duration))
            ? Math.abs(Number(hit.duration) - requestedDuration)
            : Infinity;
        return durationDelta(left) - durationDelta(right);
    })[0];
    const isrc = String(selectedHit?.isrc || "").trim();
    if (!isrc) throw new Error(`${provider.label} returned a match without an ISRC`);

    const lyricsResponse = await fetch(`${provider.endpoint}/s/${encodeURIComponent(isrc)}.${provider.format}`, { signal });
    if (!lyricsResponse.ok) throw new Error(`${provider.label} lyrics returned ${lyricsResponse.status}`);
    const lyricsText = await lyricsResponse.text();
    if (!lyricsText.trim()) throw new Error(`${provider.label} returned empty lyrics`);
    if (provider.format === "ttml" && !/^\s*<tt(?:\s|>)/i.test(lyricsText)) {
        throw new Error(`${provider.label} returned invalid TTML`);
    }
    if (provider.format === "lrc" && !hasSyncedLyricTimestamps(lyricsText)) {
        throw new Error(`${provider.label} returned invalid LRC`);
    }

    const plainLyrics = provider.format === "lrc"
        ? lyricsText
            .replace(/(?:\[\d{1,3}:\d{2}(?:\.\d{1,3})?\])+\s*/g, "")
            .split(/\r?\n/)
            .filter((line) => line.trim() && !/^\[[a-z]{2,}:.*\]$/i.test(line.trim()))
            .join("\n")
        : null;
    return normalizeLyricsResponse({
        ...selectedHit,
        syncedLyrics: lyricsText,
        plainLyrics,
        duration: selectedHit.duration,
    }, providerId);
}

async function getLyricsFromLrclib(trackId, title, artist, trackDurationInSeconds, signal) {
    const searchLrclib = async (searchText) => {
        const query = new URLSearchParams({ q: searchText }).toString();
        const response = await fetch(`${lyricsProviders.find((provider) => provider.id === "lrclib").endpoint}?${query}`, { signal });
        if (!response.ok) throw new Error(`LRCLIB search returned ${response.status}`);
        return response.json();
    };

    // Try the displayed artist first, then the canonical YouTube oEmbed author.
    // Topic channels append "- Topic", which LRCLIB generally does not index.
    let data = await searchLrclib(`${title} ${artist}`);
    if (!data?.[0] && trackId) {
        try {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`;
            const oEmbedResponse = await fetch(oEmbedUrl, { signal });
            if (oEmbedResponse.ok) {
                const oEmbed = await oEmbedResponse.json();
                const oEmbedArtist = String(oEmbed.author_name || "")
                    .replace(/\s*[-–—]\s*Topic$/i, "")
                    .trim();
                if (oEmbedArtist) {
                    data = await searchLrclib(`${title} ${oEmbedArtist}`);
                }
            }
        } catch (error) {
            console.warn("[loop.mp3] LRCLIB oEmbed artist retry failed; trying title only:", error);
        }
    }
    if (!data?.[0]) {
        data = await searchLrclib(title);
    }
    const lyricsQueryResults = data?.filter((result) => result && typeof result === "object") || [];
    if (!lyricsQueryResults.length) return null;

    let firstResultLyrics = null;
    for (const [resultIndex, lyricsQueryResult] of lyricsQueryResults.entries()) {
        const syncedLyrics = lyricsQueryResult.syncedLyrics || null;
        const plainLyrics = lyricsQueryResult.plainLyrics || null;
        if (lyricsDurationExceedsTrack(lyricsQueryResult, lyricsQueryResult, trackDurationInSeconds, syncedLyrics)) {
            console.log(`[loop.mp3] Skipping LRCLIB search result ${resultIndex + 1} because its duration exceeds the track duration.`, {
                trackDurationInSeconds,
                lyricsDuration: Number(lyricsQueryResult.duration),
            });
            continue;
        }
        const resultLyrics = {
            meta: {
                ...lyricsQueryResult,
                provider: "lrclib",
                lyricsUnavailable: !syncedLyrics && !plainLyrics && !lyricsQueryResult?.instrumental,
            },
            syncedLyrics: lyricsQueryResult?.instrumental && !syncedLyrics && !plainLyrics
                ? "[00:00.00] Instrumental only\n[99:99.99] ♪"
                : syncedLyrics,
            plainLyrics,
        };
        firstResultLyrics ||= resultLyrics;
        if (hasSyncedLyricTimestamps(resultLyrics.syncedLyrics) || lyricsQueryResult?.instrumental) {
            if (resultIndex > 0) console.log(`[loop.mp3] Using LRCLIB search result ${resultIndex + 1} because earlier results had no usable sync.`);
            return resultLyrics;
        }
        if (lyricsQueryResult?.hasWordSync === false) continue;
    }
    return firstResultLyrics;
}

async function getLrclibCandidateResults(trackId, title, artist, signal, queryOverride = "") {
    const searchLrclib = async (searchText) => {
        const query = new URLSearchParams({ q: searchText }).toString();
        const response = await fetch(`${lyricsProviders.find((provider) => provider.id === "lrclib").endpoint}?${query}`, { signal });
        if (!response.ok) throw new Error(`LRCLIB search returned ${response.status}`);
        return response.json();
    };

    const searches = [queryOverride || `${title} ${artist}`];
    try {
        const oEmbedResponse = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`,
            { signal }
        );
        if (oEmbedResponse.ok) {
            const oEmbed = await oEmbedResponse.json();
            const oEmbedArtist = String(oEmbed.author_name || "")
                .replace(/\s*[-â€“â€”]\s*Topic$/i, "")
                .trim();
            if (oEmbedArtist) searches.push(`${title} ${oEmbedArtist}`);
        }
    } catch {
        // The title/artist search below is sufficient when oEmbed is unavailable.
    }
    searches.push(title);

    const seen = new Set();
    const results = [];
    for (const searchText of [...new Set(searches)]) {
        const data = await searchLrclib(searchText);
        for (const result of Array.isArray(data) ? data : []) {
            const key = String(result?.id ?? `${result?.trackName}|${result?.artistName}|${result?.duration}`);
            if (seen.has(key)) continue;
            seen.add(key);
            const lyrics = normalizeLyricsResponse(result, "lrclib") || {
                meta: {
                    ...result,
                    provider: "lrclib",
                    lyricsUnavailable: true,
                },
                syncedLyrics: null,
                plainLyrics: null,
            };
            results.push(lyrics);
        }
        if (results.length) break;
    }
    return results;
}

async function getLyricsCandidatesForAllProviders(trackId, title, artist, duration, queryOverride = "") {
    const providerResults = await Promise.all(lyricsProviders.map(async (provider) => {
        try {
            const candidates = provider.id === "lrclib"
                ? await getLrclibCandidateResults(trackId, title, artist, undefined, queryOverride)
                : provider.id === "lyricsplus"
                    ? [await getLyricsFromLyricsPlus(trackId, title, artist)]
                    : provider.id.startsWith("binilyrics-")
                        ? [await getLyricsFromBinilyrics(title, artist, duration, provider.id)]
                        : [await getLyricsFromGroove(trackId, title, artist, duration, provider.id)];
            return { provider, candidates };
        } catch (error) {
            console.warn(`[loop.mp3] ${provider.label} candidate search failed:`, error);
            return { provider, candidates: [], error };
        }
    }));

    return providerResults.flatMap(({ provider, candidates }) => candidates.map((lyrics, index) => ({
        lyrics,
        provider,
        index,
    })));
}

function applyLyricsTimestampOffset(syncedLyrics, offsetSeconds) {
    const offset = Number(offsetSeconds);
    if (!syncedLyrics || !Number.isFinite(offset) || offset === 0) return syncedLyrics || null;

    return String(syncedLyrics).replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, (match, minutes, seconds) => {
        const adjustedSeconds = Math.max(0, Number(minutes) * 60 + Number(seconds) + offset);
        const adjustedMinutes = Math.floor(adjustedSeconds / 60);
        const remainder = (adjustedSeconds - adjustedMinutes * 60).toFixed(2).padStart(5, "0");
        return `[${String(adjustedMinutes).padStart(2, "0")}:${remainder}]`;
    });
}

async function getLyricsFromTrackInfo(trackId, title, artist, trackDurationInSeconds = getCurrentTrackDurationInSeconds(), forceRefresh = false, onLyricsResolved = null) {
    trackDurationInSeconds ??= await waitForCurrentTrackDuration();
    const resolutionStartedAt = performance.now();
    const preferredProvider = currentTrackLyricsProvider.trackId === trackId
        ? currentTrackLyricsProvider.providerId
        : null;
    const baseOrder = getLyricsProviderOrder();
    const order = preferredProvider && baseOrder.includes(preferredProvider)
        ? [preferredProvider, ...baseOrder.filter((providerId) => providerId !== preferredProvider)]
        : baseOrder;

    const manuallySelectedLyrics = await getManualCachedLyrics(trackId);
    if (manuallySelectedLyrics) {
        currentTrackLyricsProvider = { trackId, providerId: manuallySelectedLyrics.meta.provider };
        console.log("[loop.mp3] Using manually selected lyrics:", { trackId, provider: manuallySelectedLyrics.meta.provider });
        return manuallySelectedLyrics;
    }

    if (!forceRefresh) {
        const cachedLyrics = loopPreferences.useLyricsCache !== false
            ? restoreCachedLyrics(await getCachedLyrics(trackId))
            : null;
        if (cachedLyrics && (!preferredProvider || cachedLyrics.meta.provider === preferredProvider) &&
            (loopPreferences.useGrooveOverrides !== false || cachedLyrics.meta.override !== true)) {
            currentTrackLyricsProvider = { trackId, providerId: cachedLyrics.meta.provider };
            console.log("[loop.mp3] Using cached lyrics:", { trackId, provider: cachedLyrics.meta.provider });
            return cachedLyrics;
        }
    }

    let resolveFirstLyrics;
    let rejectFirstLyrics;
    let firstLyricsDelivered = false;
    let bestProviderIndex = Infinity;
    const firstLyricsPromise = new Promise((resolve, reject) => {
        resolveFirstLyrics = resolve;
        rejectFirstLyrics = reject;
    });

    const providerRequests = order.map((providerId, providerIndex) => {
        const providerStartedAt = performance.now();
        const controller = new AbortController();
        const request = providerId === "lrclib"
            ? getLyricsFromLrclib(trackId, title, artist, trackDurationInSeconds, controller.signal)
            : providerId === "lyricsplus"
                ? getLyricsFromLyricsPlus(trackId, title, artist, controller.signal)
                : providerId.startsWith("binilyrics-")
                    ? getLyricsFromBinilyrics(title, artist, trackDurationInSeconds, providerId, controller.signal)
                    : getLyricsFromGroove(trackId, title, artist, trackDurationInSeconds, providerId, controller.signal);

        const promise = request.then((lyrics) => {
            if (!lyrics) throw new Error(`${providerId} returned no usable lyrics`);
            return { lyrics, providerId, controller, elapsedMs: performance.now() - providerStartedAt };
        }).catch((error) => {
            if (error?.name !== "AbortError") {
                console.warn(`[loop.mp3] ${providerId} lyrics provider failed after ${(performance.now() - providerStartedAt).toFixed(1)} ms:`, error);
            }
            throw error;
        });

        promise.then((result) => {
            if (providerIndex >= bestProviderIndex) return;

            // Validate the candidate using the same parser the renderer uses before it is
            // allowed to replace a result already on screen. Providers can return nonempty
            // payloads that still parse to zero usable lines.
            const durationMs = Number.isFinite(trackDurationInSeconds) && trackDurationInSeconds > 0
                ? trackDurationInSeconds * 1_000
                : Number(result.lyrics?.meta?.duration) * 1_000;
            const candidateLines = parseSyncedLyrics(
                result.lyrics?.syncedLyrics,
                result.lyrics?.plainLyrics,
                durationMs,
                result.lyrics?.meta?.instrumental === true
            );
            if (!candidateLines.length) {
                throw new Error(`${providerId} returned lyrics that could not be parsed`);
            }

            bestProviderIndex = providerIndex;
            if (!firstLyricsDelivered) {
                firstLyricsDelivered = true;
                resolveFirstLyrics(result);
                return;
            }

            currentTrackLyricsProvider = { trackId, providerId: result.providerId };
            if (loopPreferences.useLyricsCache !== false) {
                cacheLyrics(trackId, title, artist, trackDurationInSeconds, result.lyrics).catch((error) => {
                    console.warn("[loop.mp3] Could not cache preferred lyrics result:", error);
                });
            }
            onLyricsResolved?.(result.lyrics, result.providerId);
            console.log(`[loop.mp3] Replaced lyrics with higher-priority ${result.providerId} result after ${result.elapsedMs.toFixed(1)} ms:`, { trackId, title, artist });
        }).catch((error) => {
            if (error?.name !== "AbortError") {
                console.warn(`[loop.mp3] Ignoring unusable ${providerId} lyrics result:`, error);
            }
        });

        return promise;
    });

    Promise.allSettled(providerRequests).then((results) => {
        if (results.every((result) => result.status === "rejected")) {
            rejectFirstLyrics(new Error("All lyrics providers failed"));
        }
    });

    try {
        const winner = await firstLyricsPromise;
        currentTrackLyricsProvider = { trackId, providerId: winner.providerId };
        if (loopPreferences.useLyricsCache !== false) {
            await cacheLyrics(trackId, title, artist, trackDurationInSeconds, winner.lyrics);
        }
        console.log(`[loop.mp3] Fetched lyrics from ${winner.providerId} in ${winner.elapsedMs.toFixed(1)} ms (total ${(performance.now() - resolutionStartedAt).toFixed(1)} ms):`, { trackId, title, artist });
        return winner.lyrics;
    } catch (error) {
        console.warn(`[loop.mp3] Lyrics resolution failed after ${(performance.now() - resolutionStartedAt).toFixed(1)} ms.`, { trackId, title, artist, error });
        showLoopNotification("Could not fetch lyrics", 3000);
        return null;
    }
}

/* Legacy single-provider implementation retained below for reference during updates. */
async function getLegacyLyricsFromTrackInfo(trackId, title, artist) {
    try {
        const query = new URLSearchParams({
            q: `${title} ${artist}`,
        }).toString();
        const res = await fetch(`https://lrclib.net/api/search?${query}`);
        let data = await res.json();
        // Retry with the title alone when searching with the artist finds no match.
        if (!data?.[0] && artist.trim()) {
            // Give the first search a moment to settle before retrying without the artist.
            await new Promise((resolve) => setTimeout(resolve, 150));
            const titleOnlyQuery = new URLSearchParams({ q: title }).toString();
            const titleOnlyResponse = await fetch(`https://lrclib.net/api/search?${titleOnlyQuery}`);
            data = await titleOnlyResponse.json();
        }
        const lyricsQueryResults = data?.filter((result) => result?.id) || [];
        if (!lyricsQueryResults.length) {
            console.warn("[loop.mp3] No lyrics found for track:", { trackId, title, artist });
            return { meta: null, syncedLyrics: null, plainLyrics: null };
        }

        let firstResultLyrics = null;
        for (const [resultIndex, lyricsQueryResult] of lyricsQueryResults.entries()) {
            const syncedLyrics = lyricsQueryResult?.syncedLyrics || null;
            const plainLyrics = lyricsQueryResult?.plainLyrics || null;
            const resultLyrics = {
                meta: lyricsQueryResult,
                syncedLyrics: lyricsQueryResult?.instrumental && !syncedLyrics && !plainLyrics
                    ? `[00:00.00] Instrumental only
[99:99.99] ${["♪", "♫", "♪"][Math.floor(Math.random() * 3)]}`
                    : syncedLyrics,
                plainLyrics,
            };

            firstResultLyrics ||= resultLyrics;
            const hasWordSync = lyricsQueryResult?.hasWordSync;
            if (hasSyncedLyricTimestamps(resultLyrics.syncedLyrics) || lyricsQueryResult?.instrumental) {
                if (resultIndex > 0) {
                    console.log(`[loop.mp3] Using lyrics search result ${resultIndex + 1} because earlier results had no usable sync:`, {
                        trackId,
                        title,
                        artist,
                    });
                }
                console.log("[loop.mp3] Fetched lyrics for track:", { trackId, title, artist, data });
                return resultLyrics;
            }

            if (hasWordSync === false) continue;
        }

        showLoopNotification("Synced lyrics unavailable", 3000);
        console.log("[loop.mp3] Fetched lyrics without synced timestamps:", { trackId, title, artist, data });
        return firstResultLyrics;
    } catch (error) {
        console.warn("[loop.mp3] Could not fetch lyrics:", error);
        showLoopNotification("Could not fetch lyrics", 3000);
        return null;
    }
}

function getBraccatoLyricsTheme() {
    return `
    @import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap");

    /* blyrics-target-scroll-pos-ratio = 0.5; */
    /* blyrics-letter-wave = ${loopPreferences.animateWordWobble === true ? "true" : "false"}; */

    .blyrics-container {
        --blyrics-font-size: 3rem;
        --blyrics-line-height: 1.333;
        --blyrics-padding: 1.4rem;
        --blyrics-active-opacity: 1;
        --blyrics-inactive-opacity: 0.3;
        --blyrics-animate-word-wobble: 0;
        --blyrics-word-wobble-transform-from: scaleX(1);
        --blyrics-word-wobble-transform-peak: translateX(0.05em) scaleX(1.025);
        --blyrics-word-wobble-transform-settle: translateX(0) scaleX(1);
        --blyrics-word-wobble-transform-to: scaleX(1);
    }

    .blyrics-container .blyrics-word-highlight:not([data-long-word]) {
        --blyrics-glow-color: var(--blyrics-highlight-color, color(display-p3 1 1 1 / 0.5));
    }
`;
}

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
    .loop-lyrics-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.22); border-top-color: #fff; border-radius: 50%; animation: loop-lyrics-spin 800ms linear infinite; }
    @keyframes loop-lyrics-spin { to { transform: rotate(360deg); } }
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

function parseSyncedLyrics(syncedLyrics, plainLyrics, songDurationMs, instrumental = false) {
    if (/^\s*<tt(?:\s|>)/i.test(String(syncedLyrics || ""))) {
        return parseTTMLLyrics(syncedLyrics, songDurationMs);
    }
    const lines = String(syncedLyrics || "")
        .split(/\r?\n/)
        .map((line) => {
            const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
            if (!match) return null;
            const startTimeMs = Number(match[1]) * 60_000 + Number(match[2]) * 1_000;
            const text = match[3];
            const timedParts = [];
            const wordTimestampPattern = /<(\d+):(\d+(?:\.\d+)?)>/g;
            let timestampMatch;
            while ((timestampMatch = wordTimestampPattern.exec(text)) !== null) {
                timedParts.push({
                    startTimeMs: Number(timestampMatch[1]) * 60_000 + Number(timestampMatch[2]) * 1_000,
                    tagStart: timestampMatch.index,
                    textStart: wordTimestampPattern.lastIndex,
                });
            }
            const parts = timedParts.map((part, index) => {
                const next = timedParts[index + 1];
                const startIndex = part.textStart;
                const endIndex = next ? next.tagStart : text.length;
                return {
                    startTimeMs: part.startTimeMs,
                    // Preserve lrc.red's spaces as non-breaking whitespace so inline timed groups
                    // cannot collapse the gap between two separately rendered words.
                    words: text.slice(startIndex, endIndex).replace(/\s/g, "\u00a0"),
                };
            }).filter((part) => part.words.trim());
            const plainText = text.replace(/<\d+:\d+(?:\.\d+)?\>/g, "").trim();
            return {
                startTimeMs,
                words: plainText || ["♪", "♫", "♪"][Math.floor(Math.random() * 3)],
                timedParts: parts,
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.startTimeMs - right.startTimeMs);

    if (lines.length) {
        return lines.map((line, index) => {
            const durationMs = Math.max(750, (lines[index + 1]?.startTimeMs || line.startTimeMs + 4_000) - line.startTimeMs);
            const parts = line.timedParts?.map((part, partIndex) => ({
                startTimeMs: part.startTimeMs,
                durationMs: Math.max(0, (line.timedParts[partIndex + 1]?.startTimeMs || line.startTimeMs + durationMs) - part.startTimeMs),
                words: part.words,
            }));
            return {
                startTimeMs: line.startTimeMs,
                durationMs,
                words: line.words,
                parts: parts?.length ? parts : undefined,
            };
        });
    }

    const plainLines = String(plainLyrics || "")
        .split(/\r?\n/)
        .map((words) => words.trim())
        .filter(Boolean);

    if (instrumental && !plainLines.length) {
        return [{
            startTimeMs: 0,
            durationMs: Number.isFinite(songDurationMs) && songDurationMs > 0 ? songDurationMs : 4_000,
            words: `Instrumental only`,
        }];
    }

    const lineDurationMs = Number.isFinite(songDurationMs) && songDurationMs > 0
        ? songDurationMs / plainLines.length
        : 4_000;
    return plainLines.map((words, index) => ({
        startTimeMs: index * lineDurationMs,
        durationMs: lineDurationMs,
        words,
    }));
}

function normalizeWriterCreditText(value) {
    return String(value || "")
        .replace(/^written\s+by\s*/i, "")
        .replace(/&/g, " and ")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .toLocaleLowerCase();
}

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

async function fetchLoopLyricsForCurrentTrack(forceRefresh = false) {
    clearLyricsRetryTimer();
    const trackId = getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId;
    const loop = document.querySelector("#loop");
    const title = loop?.querySelector("#loop-track-title")?.textContent.trim();
    const artist = loop?.querySelector("#loop-track-artist")?.textContent.trim();
    if (!trackId || !title || !artist) {
        updateLoopLyrics(null);
        return;
    }

    if (currentTrackLyricsProvider.trackId !== trackId) {
        currentTrackLyricsProvider = { trackId, providerId: null };
        lyricsLoadedTrackId = null;
    }

    if (lyricsFetchInFlightTrackId === trackId) return;
    if (!forceRefresh && lyricsLoadedTrackId === trackId && currentParsedLyrics.length) return;

    // Only a new request may invalidate previous callbacks. Polling the same track while
    // a request is already running must not invalidate the request that is about to finish.
    const requestId = ++lyricsRequestId;
    lyricsFetchInFlightTrackId = trackId;
    // During a forced refresh keep the current valid render on screen. The new result
    // should only replace it after it has been parsed successfully.
    if (!currentParsedLyrics.length || lyricsLoadedTrackId !== trackId) updateLoopLyrics(undefined);
    const lyrics = await getLyricsFromTrackInfo(
        trackId,
        title,
        artist,
        getCurrentTrackDurationInSeconds(),
        forceRefresh,
        (replacement) => {
            if (
                requestId === lyricsRequestId &&
                loopPreferences.showLyrics &&
                trackId === (getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId)
            ) {
                const replacementLines = parseSyncedLyrics(
                    replacement?.syncedLyrics,
                    replacement?.plainLyrics,
                    Number(replacement?.meta?.duration) * 1_000,
                    replacement?.meta?.instrumental === true
                );
                if (replacementLines.length) {
                    updateLoopLyrics(replacement);
                }
            }
        }
    );
    if (
        requestId !== lyricsRequestId ||
        !loopPreferences.showLyrics ||
        trackId !== (getCurrentTrackId(getYTMPlayerRoot()) || lastTrackId)
    ) {
        if (lyricsFetchInFlightTrackId === trackId) lyricsFetchInFlightTrackId = null;
        return;
    }
    // Do not clear a successful intermediate provider result if every later provider failed.
    if (lyrics) {
        const resolvedLines = parseSyncedLyrics(
            lyrics.syncedLyrics,
            lyrics.plainLyrics,
            Number(lyrics?.meta?.duration) * 1_000,
            lyrics?.meta?.instrumental === true
        );
        if (resolvedLines.length || !currentParsedLyrics.length) updateLoopLyrics(lyrics);
    } else if (!currentParsedLyrics.length) {
        updateLoopLyrics({
            meta: null,
            syncedLyrics: null,
            plainLyrics: null,
        });
    }
    if (lyricsFetchInFlightTrackId === trackId) lyricsFetchInFlightTrackId = null;
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
    loopPreferences.trackPresentationModes = normalizeTrackPresentationModes(loopPreferences.trackPresentationModes);
    loopPreferences.lyricsRenderingEngine = normalizeLyricsRenderingEngine(loopPreferences.lyricsRenderingEngine);
    loopPreferences.enableLyricsTranslation = loopPreferences.enableLyricsTranslation === true;
    loopPreferences.lyricsTranslationLanguage = normalizeLyricsTranslationLanguage(loopPreferences.lyricsTranslationLanguage);
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

function getTrackInfo(playerBar) {
    const root = playerBar || getYTMPlayerRoot();
    if (!root) {
        return { title: "Unknown track", artist: "Unknown artist", album: "Unknown album" };
    }

    // ytmusic-player-page also contains the queue/context UI. Its first
    // `.title` can be labels such as "Playing from", so prefer the actual
    // nested player bar whenever YouTube still exposes one.
    const dataRoot = root.matches?.("ytmusic-player-page")
        ? root.querySelector("ytmusic-player-bar") || root
        : root;

    const titleRoots = [dataRoot, root, document].filter((node, index, all) => node && all.indexOf(node) === index);
    // Yo sir we no longer require you cuz we are hard coding the shi we cannot afford random strings leaking due to THIS STUPID FUCKING DOM FETCHING I CAN JUST FETCH THE FUCKING TITLE FORM THE OEMBED AND PLACE A PLACEHOLDER HERE
    /*
    const title = titleRoots
        .flatMap((node) => [...node.querySelectorAll(
            "span.ytAttributedStringHost, .title, #title, yt-formatted-string.title, [class~='title']"
        )])
        .map((node) => node.textContent.trim())
        .find((text) => text && !/^(playing from|auto-?play(?:\s+is\s+on)?)(?:\s*[•·-].*)?$/i.test(text)) || "Unknown track";
        */
    const title = "Unknown track";
    const byline = dataRoot.querySelector("yt-formatted-string.byline.ytmusic-player-bar") ||
        dataRoot.querySelector(".subtitle.ytmusic-player-bar yt-formatted-string.byline") ||
        dataRoot.querySelector(".byline, .subtitle, [class*='byline'], [class*='subtitle']");
    const links = byline?.querySelectorAll("a") || [];
    const playerInfoLinks = [...document.querySelectorAll(
        "ytmusic-track-info .ytmusicTrackInfoByline a.ytAttributedStringLink.ytAttributedStringLinkCallToActionColor"
    )];
    const albumLink = playerInfoLinks[1] || dataRoot.querySelector(
        "a.ytAttributedStringLink.ytAttributedStringLinkCallToActionColor"
    ) || dataRoot.querySelector("a.ytAttributedStringLink");
    const parsedByline = byline?.textContent
        ?.split(/\s*[\u2022\u00b7]\s*/)
        .map((part) => part.trim())
        .filter(Boolean) || [];
    const bylineText = byline?.textContent.split("•").map((part) => part.trim()).filter(Boolean) || [];
    return {
        title,
        artist: links[0]?.textContent.trim() || parsedByline[0] || bylineText[0] || "Unknown artist",
        artistUrl: links[0]?.href || "",
        album: albumLink?.textContent.trim() || (links.length >= 2
            ? links[links.length - 1].textContent.trim()
            : parsedByline[1] || bylineText[1] || "Unknown album"),
        albumUrl: albumLink?.href || (links.length >= 2 ? links[links.length - 1].href : ""),
    };
}

function getMusicAuthorUrl(authorUrl) {
    if (!authorUrl) return "";

    try {
        const url = new URL(authorUrl);
        if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
            url.hostname = "music.youtube.com";
        }
        return url.toString();
    } catch {
        return authorUrl;
    }
}

// using the browse endpoint to get the writers (yes i dug through the ytm network logs manually, what iam i insane? yes fortunately and i have no life i stay in my house i never go outside i fear sunlight once i accidently touched grass and was hospitalised for 3 weeks)
async function getTrackWriterCredits(browseId) {
    if (!browseId) {
        console.error(`[loop.mp3] No browseId provided for track credits retrieval.`);
        return [];
    }
    try {
        const response = await fetch(
            "https://music.youtube.com/youtubei/v1/browse?prettyPrint=false",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            hl: "en",
                            gl: "IN",
                            clientName: "WEB_REMIX",
                            clientVersion: "1.20261006.10.00"
                        }
                    },
                    browseId
                })
            }
        );

        if (!response.ok) {
            console.error(
                "[loop.mp3] Track credits request failed:",
                response.status
            );
            return [];
        }

        const data = await response.json();
        return getTrackWritersFromBrowse(data);
    } catch (error) {
        console.error(
            "[loop.mp3] Track credits retrieval failed:",
            error
        );
        return [];
    }
}

// this is the selector that gets the writers name apparently ytm is wasting our precious ram in saving 100's of lines of useless json even in this ram cris
function getTrackWritersFromBrowse(data) {
    const writers = [];
    const getText = (value) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (Array.isArray(value)) return value.map(getText).join("");
        if (typeof value !== "object") return "";
        if (typeof value.simpleText === "string") return value.simpleText;
        if (typeof value.text === "string") return value.text;
        if (Array.isArray(value.runs)) return value.runs.map(getText).join("");
        return "";
    };
    const visit = (value) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        // YouTube has returned credits through more than one renderer. Do not
        // depend on the parent renderer name; identify the section by its title
        // and read either the old subtitle or the newer text/content field.
        const section = value.dismissableDialogContentSectionRenderer || value;
        const title = getText(section.title).trim().toLowerCase();
        if (title === "written by") {
            const names = getText(section.subtitle) || getText(section.content) || getText(section.description);
            writers.push(...names
                .split(/[\n,]/)
                .map((name) => name.trim())
                .filter(Boolean));
        }
        Object.values(value).forEach(visit);
    };
    visit(data);
    return [...new Set(writers)];
}


// Use the player endpoint to retrieve more accurate track metadata.
const prettyPrintMetaCache = new Map();

async function getPlayerMetadataPrettyPrint(trackId) {
    if (!trackId) return null;
    if (prettyPrintMetaCache.has(trackId)) {
        return prettyPrintMetaCache.get(trackId);
    }

    try {
        const response = await fetch(
            "https://music.youtube.com/youtubei/v1/player?prettyPrint=false",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    videoId: trackId,
                    context: {
                        client: {
                            hl: "en-GB",
                            gl: "IN",
                            clientName: "WEB_REMIX",
                            clientVersion: "1.20260928.13.00"
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            console.error("[loop.mp3] Pretty print metadata request failed:", response.status);
            showLoopNotification("Pretty print metadata retrieval failed Track information might not load correctly or might not be accurate press F5 to try again", 4000);
            return null;
        }

        const data = await response.json();

        const metadata = {
            title: data.videoDetails?.title ?? null,
            artist: data.videoDetails?.author ?? null
        };

        prettyPrintMetaCache.set(trackId, metadata);

        return metadata;
    } catch (error) {
        console.error("[loop.mp3] Pretty print metadata retrieval failed:", error);
        showLoopNotification("Pretty print metadata retrieval failed Track information might not load correctly or might not be accurate press F5 to try again", 4000);
        return null;
    }
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
        const prettyPrintMeta = await getPlayerMetadataPrettyPrint(trackId);
        const liveInfo = getTrackInfo(playerBar);
        // a desperate attempt to get the album name from the blessed souls who are still stuck on the old player bar
        const oldPlayerBarAlbumName =
            playerBar
                ?.querySelector('a.yt-simple-endpoint[href^="browse/"]')
                ?.textContent.trim();
        const AuthorNameComposed =
            details.author_name.replace(/\s*[-–—]\s*Topic$/i, '').trim();
        // Use the canonical title so collaborations remain intact.
        const title =
            details.title ||
            prettyPrintMeta?.title
        const artist =
            prettyPrintMeta?.artist ||
            AuthorNameComposed ||
            details.author_name ||
            domInfo.artist;
            // its an array just fetching them to test
            // this is the browseId ytm uses for some reason its just appending the trackId to the prefix MPTC for some fucking reason
        const browseId = `MPTC${trackId}`;
        const TrackWriters = await getTrackWriterCredits(browseId);
        console.log(`[loop.mp3] Track Writers:`, TrackWriters);
        const artistUrl =
            getMusicAuthorUrl(details.author_url) ||
            liveInfo.artistUrl ||
            domInfo.artistUrl;

        const album =
            details.album ||
            oldPlayerBarAlbumName ||
            liveInfo.album ||
            domInfo.album;

        const albumUrl =
            details.album_url ||
            liveInfo.albumUrl ||
            domInfo.albumUrl;
        return {
            title,
            artist,
            artistUrl,
            album,
            albumUrl,
            TrackWriters,
            isVideo: Number(details.width ?? details.thumbnail_width) !== 200 ||
                Number(details.height ?? details.thumbnail_height) !== 150,
        };
    } catch (error) {
        showLoopNotification("Could not fetch track metadata. Information might not load correctly press F5 to try again", 4000);
        console.warn("[loop.mp3] Could not fetch track metadata:", error);
        return domInfo;
    }
}

function getRecommendationText(node) {
    return node?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function getEmptyStateRecommendationShelves() {
    const shelfSelectors = [
        "ytmusic-carousel-shelf-renderer",
        "ytmusic-rich-section-renderer",
        "ytmusic-rich-shelf-renderer",
        "ytmusic-shelf-renderer",
    ];
    const shelfNames = /new releases?|quick picks?|quickplay|listen again/i;
    return [...document.querySelectorAll(shelfSelectors.join(","))]
        .filter((shelf) => !shelf.closest("#loop"))
        .map((shelf) => {
            const heading = [...shelf.querySelectorAll(
                "h2, h3, yt-formatted-string, .title, [id*=title]"
            )]
                .map(getRecommendationText)
                .find((text) => shelfNames.test(text));
            return heading ? { shelf, heading } : null;
        })
        .filter(Boolean);
}

function getRecommendationVideoId(url) {
    try {
        const parsedURL = new URL(url, location.href);
        return parsedURL.searchParams.get("v") ||
            parsedURL.pathname.match(/(?:\/watch\/|\/embed\/|\/shorts\/|\/v\/)([^/?#]+)/)?.[1] ||
            "";
    } catch {
        return "";
    }
}

function getRecommendationArtwork(url, fallback) {
    const videoId = getRecommendationVideoId(url);
    return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg` : fallback;
}

function getRecommendationCardData(shelf) {
    const cardSelectors = [
        "ytmusic-two-row-item-renderer",
        "ytmusic-responsive-list-item-renderer",
        "ytmusic-rich-item-renderer",
        "ytmusic-video-renderer",
    ];
    const cards = [...shelf.querySelectorAll(cardSelectors.join(","))];
    return cards.map((sourceCard) => {
        const link = sourceCard.querySelector(
            'a[href*="watch"], a[href*="browse"], a[href*="playlist"]'
        );
        const image = sourceCard.querySelector("img");
        const title = [...sourceCard.querySelectorAll(
            "yt-formatted-string, .title, [id*=title]"
        )]
            .map(getRecommendationText)
            .find((text) => text && !/^(play|pause|more)$/i.test(text));
        const artist = [...sourceCard.querySelectorAll(
            ".subtitle, .byline, [class*=subtitle], [class*=byline]"
        )].map(getRecommendationText).find(Boolean);
        if (!link || !title || !image?.src) return null;
        return {
            sourceCard,
            action: sourceCard.querySelector(
                'button[aria-label*="play" i], a[href*="watch"], a[href*="browse"], a[href*="playlist"]'
            ) || sourceCard,
            href: link.href,
            image: getRecommendationArtwork(link.href, image.currentSrc || image.src),
            fallbackImage: image.currentSrc || image.src,
            title,
            artist: artist || "",
        };
    }).filter(Boolean);
}

function renderEmptyStateRecommendations(loop) {
    const container = loop?.querySelector("#loop-empty-recommendations");
    if (!container) return;

    const shelves = getEmptyStateRecommendationShelves();
    const signature = shelves.map(({ shelf, heading }) =>
        `${heading}:${getRecommendationCardData(shelf).map((card) => card.href).join(",")}`
    ).join("|");
    if (container.dataset.signature === signature) return;
    container.dataset.signature = signature;
    container.replaceChildren();

    shelves.forEach(({ shelf, heading }) => {
        const cards = getRecommendationCardData(shelf).slice(0, 8);
        if (!cards.length) return;
        const section = document.createElement("section");
        section.className = "loop-empty-recommendation-section";
        const title = document.createElement("h2");
        title.textContent = heading;
        section.appendChild(title);
        const list = document.createElement("div");
        list.className = "loop-empty-recommendation-list";
        cards.forEach((card) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "loop-empty-recommendation-card";
            button.title = card.artist ? `${card.title} — ${card.artist}` : card.title;
            const artwork = document.createElement("img");
            artwork.src = card.image;
            artwork.alt = "";
            artwork.addEventListener("error", () => {
                if (artwork.src !== card.fallbackImage) artwork.src = card.fallbackImage;
            }, { once: true });
            const cardTitle = document.createElement("span");
            cardTitle.className = "loop-empty-recommendation-title";
            cardTitle.textContent = card.title;
            const cardArtist = document.createElement("span");
            cardArtist.className = "loop-empty-recommendation-artist";
            cardArtist.textContent = card.artist;
            button.append(artwork, cardTitle, cardArtist);
            button.addEventListener("click", () => {
                card.action.click();
            });
            list.appendChild(button);
        });
        section.appendChild(list);
        container.appendChild(section);
    });
    container.hidden = !container.children.length;
}

function rerenderLyricsForSelectedEngine() {
    if (!braccatoLyricsRenderer || !currentParsedLyrics.length) return;
    braccatoLyricsRenderer.setLyrics(
        getLyricsForRenderingEngine(currentParsedLyrics),
        currentLyricsRenderOptions
    );
    applyLyricsRenderingEngine();
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
    currentTrackWriters = Array.isArray(trackInfo.TrackWriters) ? trackInfo.TrackWriters : [];
    if (trackInfo.empty) currentTrackWriters = [];
    let loop = document.getElementById("loop");
    if (!loop) {
        loop = document.createElement("div");
        loop.id = "loop";
        loop.innerHTML = `
            <div id="loop-player">
                <button id="loop-back-button" type="button" aria-label="Return to YouTube Music">&#215;</button>
                <button id="loop-shortcuts-button" type="button" aria-label="Open Loop menu" title="Loop menu">?</button>
                <canvas id="loop-kawarp-background" aria-hidden="true"></canvas>
                <svg id="loop-glass-filter-definition" aria-hidden="true" focusable="false">
                    <defs>
                        <filter id="loop-glass-filter" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
                            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7" result="loop-glass-map"></feTurbulence>
                            <feDisplacementMap in="SourceGraphic" in2="loop-glass-map" scale="8" xChannelSelector="R" yChannelSelector="G" result="loop-glass-displaced"></feDisplacementMap>
                            <feGaussianBlur in="loop-glass-displaced" stdDeviation="3" result="loop-glass-blurred"></feGaussianBlur>
                            <feColorMatrix in="loop-glass-blurred" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix>
                        </filter>
                    </defs>
                </svg>
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
                    <div><kbd>F</kbd> Fullscreen <span>(press esc to close)</span></div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-navigation-toggle" type="checkbox">
                        Show previous/next buttons
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-background-toggle" type="checkbox" checked>
                        Enable Kwarp <span>(re-enable)</span>
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-video-behavior-toggle" type="checkbox" checked>
                        Enable video behavior
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-video-ui-rearrangement-toggle" type="checkbox" checked>
                        Rearrange video UI
                    </label>
                    <div id="loop-kawarp-warning" class="loop-kawarp-warning" role="status" >
                        Kawarp may increase GPU usage and battery drain.
                    </div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-vinyl-toggle" type="checkbox">
                        Don’t show vinyl
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-album-toggle" type="checkbox">
                        Show album name
                    </label>
                    <div class="loop-setting-warning" role="note">
                        Album names might not be accurate in some scenario
                    </div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-legacy-fallback-toggle" type="checkbox">
                        Use legacy fallback artwork
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-lyrics-toggle" type="checkbox">
                        Show lyrics <span>(experimental)</span>
                    </label>
                    <label class="loop-navigation-toggle loop-lyrics-rendering-setting">
                        Lyrics rendering engine
                        <select id="loop-lyrics-rendering-engine" aria-label="Lyrics rendering engine">
                            <option value="standard">Braccato</option>
                            <option value="ludo">Ludo</option>
                        </select>
                    </label>
                    <div id="loop-lyrics-rendering-warning" class="loop-setting-warning" role="note" hidden>
                        Warning: Ludo is experimental; Lyrics+ syllable sync is supported through Braccato.
                    </div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-lyrics-word-wobble-toggle" type="checkbox">
                        Animate lyric letter wave
                    </label>
                    <div class="loop-setting-warning" role="note">
                        Warning: enabling the lyric letter wave can significantly impact performance.
                    </div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-writer-credits-toggle" type="checkbox">
                        Show writer credits
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-lyrics-cache-toggle" type="checkbox">
                        Use lyrics cache
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-groove-overrides-toggle" type="checkbox" checked>
                        Use Groove lyric overrides
                    </label>
                    <label class="loop-navigation-toggle">
                        <input id="loop-lyrics-translation-toggle" type="checkbox">
                        Translate lyrics
                    </label>
                    <label class="loop-navigation-toggle loop-lyrics-translation-setting">
                        Translation language
                        <select id="loop-lyrics-translation-language" aria-label="Lyrics translation language">
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
                    <div class="loop-setting-warning" role="note">
                        Lyrics try providers in priority order and fall back when one fails. Translation uses Unison and is optional.
                    </div>
                    <label class="loop-polling-setting">
                        <span>Kawarp FPS cap <output id="loop-kawarp-fps-value" for="loop-kawarp-fps-slider">60 FPS</output></span>
                        <input id="loop-kawarp-fps-slider" type="range" min="0" max="5" step="1" value="2" list="loop-kawarp-fps-options" aria-label="Kawarp frames per second cap">
                        <datalist id="loop-kawarp-fps-options">
                            <option value="0" label="15"></option>
                            <option value="1" label="30"></option>
                            <option value="2" label="60"></option>
                            <option value="3" label="120"></option>
                            <option value="4" label="144"></option>
                            <option value="5" label="Dynamic"></option>
                        </datalist>
                    </label>
                    <div id="loop-kawarp-fps-warning" class="loop-setting-warning" role="note" hidden></div>
                    <label class="loop-navigation-toggle">
                        <input id="loop-kawarp-fps-logging-toggle" type="checkbox">
                        Log Kawarp FPS to console
                    </label>
                    <label class="loop-polling-setting">
                        <span>Update interval <output id="loop-update-interval-value" for="loop-update-interval-slider">500 ms</output></span>
                        <input id="loop-update-interval-slider" type="range" min="100" max="1000" step="50" value="500" aria-label="Loop update interval in milliseconds">
                    </label>
                    <div id="loop-update-interval-warning" class="loop-setting-warning" role="note" hidden></div>
                    <label class="loop-navigation-toggle loop-lyrics-provider-setting">
                        Lyrics provider
                        <select id="loop-lyrics-provider-select" aria-label="Preferred lyrics provider"></select>
                    </label>
                    <button id="loop-lyrics-submit-button" class="loop-menu-action" type="button">
                        Submit lyrics to Unison (lyrics+ source)
                    </button>
                    <button id="loop-lyrics-cache-button" class="loop-menu-action" type="button">
                        View cached lyrics
                    </button>
                    <button id="loop-kawarp-config-button" class="loop-menu-action" type="button">
                        Edit Kawarp shader config
                    </button>
                    <button id="loop-mini-player-button" class="loop-menu-action" type="button">
                        Open mini player
                    </button>
                    <label class="loop-navigation-toggle">
                        <input id="loop-mini-player-toggle" type="checkbox" checked>
                        Open mini player when minimized
                    </label>
                </div>

                <div id="loop-inline-buttons" aria-label="Playback controls">
                    <button id="loop-previous-button" type="button" aria-label="Previous track" hidden>&#9198;</button>
                    <button id="loop-play-button" type="button" aria-label="Play">&#9654;</button>
                    <button id="loop-next-button" type="button" aria-label="Next track" hidden>&#9197;</button>
                    <div id="loop-volume-control">
                        <button id="loop-mute-button" type="button" aria-label="Mute">&#128266;</button>
                        <div id="loop-volume-popover">
                            <span>Volume</span>
                            <input id="loop-volume-slider" type="range" min="0" max="1" step="0.01" value="1"
                                aria-label="Volume">
                        </div>
                    </div>
                    <button id="loop-queue-button" type="button" aria-label="Show queue">&#9776;</button>
                    <button id="loop-search-button" type="button" aria-label="Search">
                        <svg class="loop-icon" viewBox="0 0 512 512" aria-hidden="true">
                            <path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.1-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                        </svg>
                    </button>
                </div>
                <div id="loop-artwork-video-toggle" role="group" aria-label="Choose automatic, audio, or video mode">
                    <button type="button" data-loop-view-mode="auto" aria-label="Use automatic mode">Auto</button>
                    <button type="button" data-loop-view-mode="audio" aria-label="Force audio mode">Audio</button>
                    <button type="button" data-loop-view-mode="video" aria-label="Force video mode">Video</button>
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
                <section id="loop-lyrics-panel" aria-label="Synchronized lyrics" hidden>
                    <div id="loop-empty-recommendations" hidden aria-label="YouTube Music recommendations"></div>
                    <div id="loop-lyrics-host"></div>
                </section>
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
                    <button id="loop-toggle-fullscreen" type="button" aria-label="Toggle Fullscreen" title="Toggle Fullscreen">
                    <i class="fa-solid fa-expand" aria-hidden="true"></i>
                    </button>
                </div>
            </div>`;
        document.body.appendChild(loop);
        const loopPlayer = loop.querySelector("#loop-player");
        ["pointermove", "pointerdown", "focusin"].forEach((eventName) => {
            loopPlayer.addEventListener(eventName, showVideoUi, { passive: true });
        });
        applyLoopPreferences();
        loop.querySelector("#loop-back-button").addEventListener("click", goBackToNormal);
        loop.querySelector("#loop-play-button").addEventListener("click", togglePlayback);
        loop.querySelector("#loop-mute-button").addEventListener("click", toggleMute);
        loop.querySelector("#loop-volume-slider").addEventListener("input", setVolume);
        loop.querySelector("#loop-previous-button").addEventListener("click", playPreviousTrack);
        loop.querySelector("#loop-next-button").addEventListener("click", playNextTrack);
        loop.querySelector("#loop-seek").addEventListener("input", seekTrack);
        loop.querySelector("#loop-like-button").addEventListener("click", () => triggerYTMAction("like"));
        loop.querySelector("#loop-dislike-button").addEventListener("click", () => triggerYTMAction("dislike"));
        loop.querySelector("#loop-artwork-toggle").addEventListener("click", () => {
            loopPreferences.hideArtwork = !loopPreferences.hideArtwork;
            saveLoopPreferences();
            applyArtworkPreference();
        });
        loop.querySelectorAll("#loop-artwork-video-toggle [data-loop-view-mode]").forEach((button) => {
            button.addEventListener("click", () => {
                setTrackPresentationMode(button.dataset.loopViewMode);
            });
        });
        loop.querySelector("#loop-screen-disable").addEventListener("click", () => {
            DisableScreen().catch((error) => {
                console.error("[loop.mp3] Could not put screen to sleep:", error);
                showLoopNotification("Could not put screen to sleep", 3000);
            });
        });
        loop.querySelector("#loop-toggle-fullscreen").addEventListener("click", () => {
            toggleFullscreen().catch((error) => {
                console.error("[loop.mp3] Could not toggle fullscreen:", error);
                showLoopNotification("Could not toggle fullscreen", 3000);
            });
        });
        loop.querySelector("#loop-mini-player-button").addEventListener("click", () => {
            openMiniPlayer().catch((error) => {
                console.warn("[loop.mp3] Could not open miniplayer:", error);
                showLoopNotification("Could not open miniplayer");
            });
        });
        loop.querySelector("#loop-mini-player-toggle").addEventListener("change", (event) => {
            loopPreferences.autoOpenMiniPlayer = event.target.checked;
            saveLoopPreferences();
        });
        loop.querySelector("#loop-navigation-toggle").addEventListener("change", (event) => {
            loopPreferences.showNavigationButtons = event.target.checked;
            saveLoopPreferences();
            setTrackNavigationButtonsVisible(event.target.checked);
        });
        loop.querySelector("#loop-background-toggle").addEventListener("change", (event) => {
            setKawarpEnabled(event.target.checked);
        });
        loop.querySelector("#loop-video-behavior-toggle").addEventListener("change", (event) => {
            loopPreferences.videoBehaviorEnabled = event.target.checked;
            saveLoopPreferences();
            applyVideoPresentationPreferences();
        });
        loop.querySelector("#loop-video-ui-rearrangement-toggle").addEventListener("change", (event) => {
            if (loopPreferences.videoBehaviorEnabled === false) {
                event.target.checked = false;
                return;
            }
            loopPreferences.videoUiRearrangement = event.target.checked;
            saveLoopPreferences();
            applyVideoPresentationPreferences();
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
        loop.querySelector("#loop-album-toggle").addEventListener("change", (event) => {
            loopPreferences.showAlbum = event.target.checked;
            saveLoopPreferences();
            applyLoopPreferences();
        });
        loop.querySelector("#loop-legacy-fallback-toggle").addEventListener("change", (event) => {
            loopPreferences.useLegacyFallbackArtwork = event.target.checked;
            saveLoopPreferences();
            applyLoopPreferences();
        });
        loop.querySelector("#loop-lyrics-toggle").addEventListener("change", (event) => {
            loopPreferences.showLyrics = event.target.checked;
            saveLoopPreferences();
            applyLoopPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-lyrics-rendering-engine").addEventListener("change", (event) => {
            loopPreferences.lyricsRenderingEngine = normalizeLyricsRenderingEngine(event.target.value);
            saveLoopPreferences();
            applyLoopPreferences();
            rerenderLyricsForSelectedEngine();
        });
        loop.querySelector("#loop-lyrics-word-wobble-toggle").addEventListener("change", (event) => {
            loopPreferences.animateWordWobble = event.target.checked;
            saveLoopPreferences();
            applyLyricsAnimationPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-writer-credits-toggle").addEventListener("change", (event) => {
            loopPreferences.showWriterCredits = event.target.checked;
            saveLoopPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-lyrics-cache-toggle").addEventListener("change", (event) => {
            loopPreferences.useLyricsCache = event.target.checked;
            saveLoopPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-groove-overrides-toggle").addEventListener("change", (event) => {
            loopPreferences.useGrooveOverrides = event.target.checked;
            saveLoopPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack(true);
        });
        loop.querySelector("#loop-lyrics-translation-toggle").addEventListener("change", (event) => {
            loopPreferences.enableLyricsTranslation = event.target.checked;
            saveLoopPreferences();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-lyrics-translation-language").addEventListener("change", (event) => {
            loopPreferences.lyricsTranslationLanguage = normalizeLyricsTranslationLanguage(event.target.value);
            saveLoopPreferences();
            if (loopPreferences.showLyrics && loopPreferences.enableLyricsTranslation) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-update-interval-slider").addEventListener("input", (event) => {
            loopPreferences.loopUpdateInterval = normalizeLoopUpdateInterval(event.target.value);
            saveLoopPreferences();
            updateLoopPollingPreferenceUI();
            startLoopUpdatePolling(playerBar);
        });
        loop.querySelector("#loop-kawarp-fps-slider").addEventListener("input", (event) => {
            const optionIndex = Math.min(kawarpFpsOptions.length - 1, Math.max(0, Number(event.target.value)));
            loopPreferences.kawarpFpsCap = kawarpFpsOptions[optionIndex];
            saveLoopPreferences();
            updateKawarpFpsPreferenceUI();
            kawarpBackground?.setOptions({
                fpsCap: loopPreferences.kawarpFpsCap,
                fpsLogging: loopPreferences.kawarpFpsLogging,
            });
            miniPlayerBridge?.syncEffects();
        });
        loop.querySelector("#loop-kawarp-fps-logging-toggle").addEventListener("change", (event) => {
            loopPreferences.kawarpFpsLogging = event.target.checked;
            saveLoopPreferences();
            kawarpBackground?.setOptions({ fpsLogging: loopPreferences.kawarpFpsLogging });
            miniPlayerBridge?.syncEffects();
        });
        loop.querySelector("#loop-lyrics-provider-select").addEventListener("change", (event) => {
            setLyricsProviderOrder(event.target.value);
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack();
        });
        loop.querySelector("#loop-theme-select").addEventListener("change", (event) => {
            loopPreferences.theme = event.target.value;
            saveLoopPreferences();
            applyLoopTheme();
        });
        loop.querySelector("#loop-lyrics-submit-button").addEventListener("click", () => {
            loop.querySelector("#loop-shortcuts-panel").hidden = true;
            // we no longer support lrc lib sumission the never worked either btw
            //showLyricsSubmissionModal();
          window.open(unisonURL, "_blank");

        });
        loop.querySelector("#loop-lyrics-cache-button").addEventListener("click", () => {
            loop.querySelector("#loop-shortcuts-panel").hidden = true;
            showCachedLyricsModal();
        });
        loop.querySelector("#loop-kawarp-config-button").addEventListener("click", showKawarpConfigEditor);
        loop.querySelector("#loop-shortcuts-button").addEventListener("click", (event) => {
            event.stopPropagation();
            const panel = loop.querySelector("#loop-shortcuts-panel");
            panel.hidden = !panel.hidden;
            if (!panel.hidden) requestAnimationFrame(() => updateLoopMenuOverflow(panel));
        });
        loop.querySelector("#loop-shortcuts-expand-button")?.addEventListener("click", (event) => {
            event.stopPropagation();
            const panel = loop.querySelector("#loop-shortcuts-panel");
            panel.classList.toggle("loop-shortcuts-expanded");
            updateLoopMenuOverflow(panel);
        });
        window.addEventListener("resize", () => updateLoopMenuOverflow(
            loop.querySelector("#loop-shortcuts-panel")
        ));
        // Shift+Delete is registered globally below so it works even before
        // Loop's UI is mounted. Do not register a second handler here.

        showOnboarding();
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
        document.addEventListener("pointerdown", (event) => {
            const searchBar = document.querySelector("ytmusic-search-box");
            const resultsPanel = document.getElementById("loop-search-results");
            const searchButton = document.getElementById("loop-search-button");

            if (!searchBar || searchBar.style.display === "none") return;
            if (!(event.target instanceof Node)) return;
            if (
                searchBar.contains(event.target) ||
                (resultsPanel && resultsPanel.contains(event.target)) ||
                (searchButton && searchButton.contains(event.target))
            ) {
                return;
            }

            document.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Escape",
                code: "Escape",
                bubbles: true,
                cancelable: true,
            }));
        }, true);
    }
    const artwork = loop.querySelector("#loop-artwork");
    const title = loop.querySelector("#loop-track-title");
    const artist = loop.querySelector("#loop-track-artist");
    const album = loop.querySelector("#loop-track-album");
    const emptyRecommendations = loop.querySelector("#loop-empty-recommendations");
    const lyricsHost = loop.querySelector("#loop-lyrics-host");

    // YouTube Music can replace DOM nodes while navigating between tracks.
    // Rebuild the injected UI if one of its required nodes disappeared.
    if (!artwork || !title || !artist || !album || !emptyRecommendations || !lyricsHost) {
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
    const presentationMode = getTrackPresentationMode(lastTrackId);
    forcedVideoMode = presentationMode === "video";
    forcedArtworkMode = presentationMode === "audio";
    loop.dataset.trackVideo = !trackInfo.empty && trackInfo.isVideo === true ? "true" : "false";
    loop.dataset.videoBackground = String(presentationMode === "video" ||
        (presentationMode === "auto" && loop.dataset.trackVideo === "true"));
    applyVideoPresentationPreferences();
    if (trackInfo.isVideo === true && loopPreferences.videoBehaviorEnabled !== false) showVideoUi();
    emptyRecommendations.hidden = !trackInfo.empty;
    lyricsHost.hidden = Boolean(trackInfo.empty);
    if (trackInfo.empty) renderEmptyStateRecommendations(loop);
    updateVideoBackground(lastTrackId, loop.dataset.videoBackground === "true");
    syncWindowTitle();
    syncTrackFeedbackState();
    scheduleTrackFeedbackSync();
    updateKawarpArtwork(artwork.src);
    updateLoopLyrics(trackInfo.lyrics, Boolean(trackInfo.empty), currentTrackWriters);
    if (trackInfo.empty) {
        const lyricsPanel = loop.querySelector("#loop-lyrics-panel");
        lyricsPanel.hidden = false;
        emptyRecommendations.hidden = false;
    }
    updatePlaybackControls(getCurrentMedia());
    syncVideoBackgroundPlayback();
    publishDiscordActivity({ force: true });
}

let recordFrame;

function getCurrentMedia() {
    const media = [...document.querySelectorAll("video, audio")]
        .filter((element) => Number.isFinite(element.duration) && element.duration > 0);
    return media.find((element) => !element.paused && !element.ended) || media[0];
}

function showCloseProtectionModal(media) {
    const existingModal = document.getElementById("loop-close-protection-modal");
    if (existingModal) {
        existingModal.querySelector(".loop-close-protection-continue")?.focus();
        return;
    }

    const modal = document.createElement("div");
    modal.id = "loop-close-protection-modal";
    modal.setAttribute("role", "alertdialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-close-protection-title");
    modal.innerHTML = `
        <div class="loop-close-protection-card">
            <div class="loop-close-protection-kicker">Playback protection</div>
            <h2 id="loop-close-protection-title">Music is still playing</h2>
            <p class="loop-close-protection-description">
                Playback was paused because this tab is being closed. Confirm closing, or keep the music playing.
            </p>
            <div class="loop-close-protection-actions">
                <button type="button" class="loop-close-protection-close">Confirm closing</button>
                <button type="button" class="loop-close-protection-continue">Keep listening</button>
            </div>
        </div>`;
    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector(".loop-close-protection-close").addEventListener("click", () => {
        close();
        const sendMessage = globalThis.chrome?.runtime?.sendMessage;
        if (typeof sendMessage !== "function") {
            window.close();
            return;
        }
        sendMessage.call(globalThis.chrome.runtime, { type: "close-current-tab" })
            .catch(() => showLoopNotification("Could not close this tab automatically."));
    });
    modal.querySelector(".loop-close-protection-continue").addEventListener("click", () => {
        media.play().catch((error) => console.warn("[loop.mp3] Could not resume media:", error));
        updatePlaybackControls(media);
        close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        media.play().catch((error) => console.warn("[loop.mp3] Could not resume media:", error));
        updatePlaybackControls(media);
        close();
    });
    modal.querySelector(".loop-close-protection-close").focus();
}

window.addEventListener("beforeunload", (event) => {
    const media = getCurrentMedia();
    if (!media || media.paused || media.ended) return;

    media.pause();
    updatePlaybackControls(media);
    showCloseProtectionModal(media);
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
    const volumeSlider = document.querySelector("#loop-volume-slider");
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
        if (volumeSlider) volumeSlider.value = String(getPreferredVolume());
    } else if (playButton && muteButton && seek && currentTime && duration && media) {
        playButton.textContent = media.paused ? "▶" : "⏸";
        playButton.setAttribute("aria-label", media.paused ? "Play" : "Pause");
        muteButton.textContent = media.muted ? "♩" : "♪";
        muteButton.setAttribute("aria-label", media.muted ? "Unmute" : "Mute");
        seek.max = Number.isFinite(media.duration) ? String(media.duration) : "0";
        seek.value = Number.isFinite(media.currentTime) ? String(media.currentTime) : "0";
        currentTime.textContent = formatTime(media.currentTime);
        duration.textContent = formatTime(media.duration);
        if (volumeSlider) volumeSlider.value = String(media.volume);
    }
    braccatoLyricsRenderer?.tick(media ? media.currentTime : 0, {
        isPlaying: Boolean(media && !media.paused && !media.ended),
        playbackRate: media?.playbackRate,
    });
    if (loopPreferences.lyricsRenderingEngine === "ludo") {
        ludoLyricsController?.tick(media ? media.currentTime : 0);
    }
    const lyricsShadow = document.querySelector("#loop-lyrics-host")?.shadowRoot;
    if (lyricsShadow) syncLyricsFooterVisibility(lyricsShadow);
    syncVideoBackgroundPlayback();
    miniPlayerBridge?.sync(media);
    publishElectronMiniPlayerState();
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

function getPreferredVolume() {
    const volume = Number(loopPreferences.volume);
    return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
}

function setVolume(event) {
    const media = getCurrentMedia();
    if (!media) return;

    const volume = Number(event.target.value);
    if (!Number.isFinite(volume)) return;
    media.volume = Math.min(1, Math.max(0, volume));
    loopPreferences.volume = media.volume;
    saveLoopPreferences();
    if (media.volume > 0 && media.muted) media.muted = false;
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
    sendYTMShortcut("P", true);
}

function playNextTrack() {
    sendYTMShortcut("N", true);
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
        media.volume = getPreferredVolume();
        ["timeupdate", "play", "playing", "pause", "seeking", "seeked", "ratechange", "volumechange"].forEach((eventName) => {
            media.addEventListener(eventName, () => updatePlaybackControls());
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
        const currentPlayerBar = getYTMPlayerRoot();
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
    const currentPlayerBar = getYTMPlayerRoot() || playerBar;
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
        clearLyricsRetryTimer();
        lyricsRequestId += 1;
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
        scheduleTrackFeedbackSync();
        return;
    }

    const searchBar = document.querySelector("ytmusic-search-box");
    if (searchBar && searchBar.style.display !== "none") {
        closeLoopSearchPanel();
        hideLoopSearch();
    }

    lastTrackId = trackId;
    lastTrackKey = trackSignature;
    const requestId = ++metadataRequest;
    clearLyricsRetryTimer();
    lyricsRequestId += 1;
    updateLoop(artworkURL, liveTrackInfo);
    syncRecordMotion();
    const trackInfo = await getTrackInfoFromTrackId(trackId, currentPlayerBar);
    const activePlayerBar = getYTMPlayerRoot() || playerBar;
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
    if (loopPreferences.showLyrics) {
        // Metadata should not wait for a potentially slow lyrics provider. The
        // lyrics request has its own request id and will update the panel when
        // it completes, as long as this is still the active track.
        fetchLoopLyricsForCurrentTrack().catch((error) => {
            console.warn("[loop.mp3] Could not fetch lyrics for the current track:", error);
        });
    }
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

    if (
        event.key === "Delete" &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.repeat &&
        document.getElementById("loop")
    ) {
        event.preventDefault();
        event.stopPropagation();
        showLoopResetModal();
        return;
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

if(!isElectron) {
    showLoopNotification("No application shell detected some function might not work");
}

checkIsSleepSupported();
