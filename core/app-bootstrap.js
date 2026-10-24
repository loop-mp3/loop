// The DOM boundary is kept in ytm/dom.js; these small adapters preserve the
// existing local API used by the player code below.
function waitForYTM(callback) {
    return LoopYtmDom.waitForYTM(callback);
}

function getYTMPlayerRoot() {
    return LoopYtmDom.getYTMPlayerRoot();
}

function getCurrentTrackId(playerBar) {
    return LoopYtmDom.getCurrentTrackId(playerBar);
}

function getFallbackArtwork() {
    return LoopYtmDom.getFallbackArtwork(loopPreferences, getExtensionURL);
}

function getVinylArtwork(trackId) {
    return LoopYtmDom.getVinylArtwork(trackId, loopPreferences, getExtensionURL);
}

function getPlayerBarArtwork(playerBar) {
    return LoopYtmDom.getPlayerBarArtwork(playerBar);
}

function getCurrentArtwork(playerBar, trackId) {
    return LoopYtmDom.getCurrentArtwork(
        playerBar,
        trackId,
        loopPreferences,
        currentArtworkURL,
        getExtensionURL,
    );
}

let loopBridge;

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
    loopBridge?.publishElectronKawarpState();
}

function publishElectronMiniPlayerState(options) {
    loopBridge?.publishElectronMiniPlayerState(options);
}

function publishElectronMiniPlayerCommand(type) {
    loopBridge?.publishElectronMiniPlayerCommand(type);
}

function publishDiscordActivity(options) {
    loopBridge?.publishDiscordActivity(options);
}

loopBridge = LoopCore.createBridge({
    getKawarpState,
    getCurrentMedia: (...args) => globalThis.getCurrentMedia?.(...args),
    getFallbackArtwork,
    getPreferences: () => loopPreferences,
});

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

const {
    defaultKawarpSettings,
    defaultLoopPreferences,
    loopPreferencesKey,
    defaultLoopUpdateInterval,
    defaultKawarpFpsCap,
    defaultLyricsGapNoteThreshold,
    minimumLyricsGapNoteThreshold,
    maximumLyricsGapNoteThreshold,
    kawarpFpsOptions,
    lyricsRetryIntervalMs: LYRICS_RETRY_INTERVAL_MS,
    minimumLoopUpdateInterval,
    maximumLoopUpdateInterval,
    kawarpConfigKey,
    kawarpCustomPresetsKey,
    lyricsCacheKeyPrefix,
    manualLyricsCacheKeyPrefix,
    translationCacheKeyPrefix,
    defaultUpdateURL,
    lyricsTranslationEndpoint,
    unisonTranslationRetryDelaysMs,
    grooveEditorURL,
    geniusURL,
    unisonURL,
    onboardingChangelogURL,
    lyricsProviders,
    defaultLyricsProviderIds,
    supportedLyricsTranslationLanguages,
} = globalThis.LoopVariables;

let kawarpSettings = { ...defaultKawarpSettings };
let kawarpBackground;
let kawarpEnabled = true;
let videoBackgroundTrackId;
let videoBackgroundSyncFrame;
let videoBackgroundLastSyncedTime;
let videoBackgroundLastPaused;
let videoUiHideTimer;
let loopPreferences = { ...defaultLoopPreferences, trackPresentationModes: {} };
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
const translationRequestCache = new Map();


// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.waitForYTM = waitForYTM;
    global.getYTMPlayerRoot = getYTMPlayerRoot;
    global.getCurrentTrackId = getCurrentTrackId;
    global.getFallbackArtwork = getFallbackArtwork;
    global.getVinylArtwork = getVinylArtwork;
    global.getPlayerBarArtwork = getPlayerBarArtwork;
    global.getCurrentArtwork = getCurrentArtwork;
    global.getKawarpState = getKawarpState;
    global.publishElectronKawarpState = publishElectronKawarpState;
    global.publishElectronMiniPlayerState = publishElectronMiniPlayerState;
    global.publishElectronMiniPlayerCommand = publishElectronMiniPlayerCommand;
    global.publishDiscordActivity = publishDiscordActivity;
    global.loadFontAwesome = loadFontAwesome;
    global.isUserSignedIn = isUserSignedIn;
    global.checkYTMusicAuth = checkYTMusicAuth;
    Object.defineProperty(global, 'loopBridge', { configurable: true, get: () => loopBridge, set: (value) => { loopBridge = value; } });
    Object.defineProperty(global, 'kawarpSettings', { configurable: true, get: () => kawarpSettings, set: (value) => { kawarpSettings = value; } });
    Object.defineProperty(global, 'kawarpBackground', { configurable: true, get: () => kawarpBackground, set: (value) => { kawarpBackground = value; } });
    Object.defineProperty(global, 'kawarpEnabled', { configurable: true, get: () => kawarpEnabled, set: (value) => { kawarpEnabled = value; } });
    Object.defineProperty(global, 'videoBackgroundTrackId', { configurable: true, get: () => videoBackgroundTrackId, set: (value) => { videoBackgroundTrackId = value; } });
    Object.defineProperty(global, 'videoBackgroundSyncFrame', { configurable: true, get: () => videoBackgroundSyncFrame, set: (value) => { videoBackgroundSyncFrame = value; } });
    Object.defineProperty(global, 'videoBackgroundLastSyncedTime', { configurable: true, get: () => videoBackgroundLastSyncedTime, set: (value) => { videoBackgroundLastSyncedTime = value; } });
    Object.defineProperty(global, 'videoBackgroundLastPaused', { configurable: true, get: () => videoBackgroundLastPaused, set: (value) => { videoBackgroundLastPaused = value; } });
    Object.defineProperty(global, 'videoUiHideTimer', { configurable: true, get: () => videoUiHideTimer, set: (value) => { videoUiHideTimer = value; } });
    Object.defineProperty(global, 'loopPreferences', { configurable: true, get: () => loopPreferences, set: (value) => { loopPreferences = value; } });
    Object.defineProperty(global, 'currentArtworkURL', { configurable: true, get: () => currentArtworkURL, set: (value) => { currentArtworkURL = value; } });
    Object.defineProperty(global, 'forcedVideoMode', { configurable: true, get: () => forcedVideoMode, set: (value) => { forcedVideoMode = value; } });
    Object.defineProperty(global, 'forcedArtworkMode', { configurable: true, get: () => forcedArtworkMode, set: (value) => { forcedArtworkMode = value; } });
    Object.defineProperty(global, 'kawarpRendererClass', { configurable: true, get: () => kawarpRendererClass, set: (value) => { kawarpRendererClass = value; } });
    Object.defineProperty(global, 'kawarpRendererPromise', { configurable: true, get: () => kawarpRendererPromise, set: (value) => { kawarpRendererPromise = value; } });
    Object.defineProperty(global, 'kawarpWarningTimer', { configurable: true, get: () => kawarpWarningTimer, set: (value) => { kawarpWarningTimer = value; } });
    Object.defineProperty(global, 'braccatoLyricsPromise', { configurable: true, get: () => braccatoLyricsPromise, set: (value) => { braccatoLyricsPromise = value; } });
    Object.defineProperty(global, 'braccatoLyricsRenderer', { configurable: true, get: () => braccatoLyricsRenderer, set: (value) => { braccatoLyricsRenderer = value; } });
    Object.defineProperty(global, 'braccatoLyricsMount', { configurable: true, get: () => braccatoLyricsMount, set: (value) => { braccatoLyricsMount = value; } });
    Object.defineProperty(global, 'ludoLyricsController', { configurable: true, get: () => ludoLyricsController, set: (value) => { ludoLyricsController = value; } });
    Object.defineProperty(global, 'createLudoLyricsController', { configurable: true, get: () => createLudoLyricsController, set: (value) => { createLudoLyricsController = value; } });
    Object.defineProperty(global, 'lyricsRequestId', { configurable: true, get: () => lyricsRequestId, set: (value) => { lyricsRequestId = value; } });
    Object.defineProperty(global, 'lyricsRetryTimer', { configurable: true, get: () => lyricsRetryTimer, set: (value) => { lyricsRetryTimer = value; } });
    Object.defineProperty(global, 'lyricsFetchInFlightTrackId', { configurable: true, get: () => lyricsFetchInFlightTrackId, set: (value) => { lyricsFetchInFlightTrackId = value; } });
    Object.defineProperty(global, 'lyricsLoadedTrackId', { configurable: true, get: () => lyricsLoadedTrackId, set: (value) => { lyricsLoadedTrackId = value; } });
    Object.defineProperty(global, 'currentTrackLyricsProvider', { configurable: true, get: () => currentTrackLyricsProvider, set: (value) => { currentTrackLyricsProvider = value; } });
    Object.defineProperty(global, 'currentParsedLyrics', { configurable: true, get: () => currentParsedLyrics, set: (value) => { currentParsedLyrics = value; } });
    Object.defineProperty(global, 'currentLyricsRenderOptions', { configurable: true, get: () => currentLyricsRenderOptions, set: (value) => { currentLyricsRenderOptions = value; } });
    Object.defineProperty(global, 'currentTrackWriters', { configurable: true, get: () => currentTrackWriters, set: (value) => { currentTrackWriters = value; } });
    Object.defineProperty(global, 'notificationTimer', { configurable: true, get: () => notificationTimer, set: (value) => { notificationTimer = value; } });
    Object.defineProperty(global, 'notificationAnimationTimer', { configurable: true, get: () => notificationAnimationTimer, set: (value) => { notificationAnimationTimer = value; } });
    Object.defineProperty(global, 'notificationAnimationFrame', { configurable: true, get: () => notificationAnimationFrame, set: (value) => { notificationAnimationFrame = value; } });
    Object.defineProperty(global, 'authWarningShown', { configurable: true, get: () => authWarningShown, set: (value) => { authWarningShown = value; } });
    Object.defineProperty(global, 'loopUpdateBlocked', { configurable: true, get: () => loopUpdateBlocked, set: (value) => { loopUpdateBlocked = value; } });
    Object.defineProperty(global, 'loopVisible', { configurable: true, get: () => loopVisible, set: (value) => { loopVisible = value; } });
    Object.defineProperty(global, 'loopUpdateIntervalId', { configurable: true, get: () => loopUpdateIntervalId, set: (value) => { loopUpdateIntervalId = value; } });
    Object.defineProperty(global, 'loopUpdatePlayerBar', { configurable: true, get: () => loopUpdatePlayerBar, set: (value) => { loopUpdatePlayerBar = value; } });
    Object.defineProperty(global, 'translationRequestCache', { configurable: true, get: () => translationRequestCache, set: (value) => { translationRequestCache = value; } });
    Object.defineProperty(global, 'defaultKawarpSettings', { configurable: true, get: () => defaultKawarpSettings, set: (value) => { defaultKawarpSettings = value; } });
    Object.defineProperty(global, 'defaultLoopPreferences', { configurable: true, get: () => defaultLoopPreferences, set: (value) => { defaultLoopPreferences = value; } });
    Object.defineProperty(global, 'loopPreferencesKey', { configurable: true, get: () => loopPreferencesKey, set: (value) => { loopPreferencesKey = value; } });
    Object.defineProperty(global, 'defaultLoopUpdateInterval', { configurable: true, get: () => defaultLoopUpdateInterval, set: (value) => { defaultLoopUpdateInterval = value; } });
    Object.defineProperty(global, 'defaultKawarpFpsCap', { configurable: true, get: () => defaultKawarpFpsCap, set: (value) => { defaultKawarpFpsCap = value; } });
    Object.defineProperty(global, 'defaultLyricsGapNoteThreshold', { configurable: true, get: () => defaultLyricsGapNoteThreshold, set: (value) => { defaultLyricsGapNoteThreshold = value; } });
    Object.defineProperty(global, 'minimumLyricsGapNoteThreshold', { configurable: true, get: () => minimumLyricsGapNoteThreshold, set: (value) => { minimumLyricsGapNoteThreshold = value; } });
    Object.defineProperty(global, 'maximumLyricsGapNoteThreshold', { configurable: true, get: () => maximumLyricsGapNoteThreshold, set: (value) => { maximumLyricsGapNoteThreshold = value; } });
    Object.defineProperty(global, 'kawarpFpsOptions', { configurable: true, get: () => kawarpFpsOptions, set: (value) => { kawarpFpsOptions = value; } });
    Object.defineProperty(global, 'LYRICS_RETRY_INTERVAL_MS', { configurable: true, get: () => LYRICS_RETRY_INTERVAL_MS, set: (value) => { LYRICS_RETRY_INTERVAL_MS = value; } });
    Object.defineProperty(global, 'minimumLoopUpdateInterval', { configurable: true, get: () => minimumLoopUpdateInterval, set: (value) => { minimumLoopUpdateInterval = value; } });
    Object.defineProperty(global, 'maximumLoopUpdateInterval', { configurable: true, get: () => maximumLoopUpdateInterval, set: (value) => { maximumLoopUpdateInterval = value; } });
    Object.defineProperty(global, 'kawarpConfigKey', { configurable: true, get: () => kawarpConfigKey, set: (value) => { kawarpConfigKey = value; } });
    Object.defineProperty(global, 'kawarpCustomPresetsKey', { configurable: true, get: () => kawarpCustomPresetsKey, set: (value) => { kawarpCustomPresetsKey = value; } });
    Object.defineProperty(global, 'lyricsCacheKeyPrefix', { configurable: true, get: () => lyricsCacheKeyPrefix, set: (value) => { lyricsCacheKeyPrefix = value; } });
    Object.defineProperty(global, 'manualLyricsCacheKeyPrefix', { configurable: true, get: () => manualLyricsCacheKeyPrefix, set: (value) => { manualLyricsCacheKeyPrefix = value; } });
    Object.defineProperty(global, 'translationCacheKeyPrefix', { configurable: true, get: () => translationCacheKeyPrefix, set: (value) => { translationCacheKeyPrefix = value; } });
    Object.defineProperty(global, 'defaultUpdateURL', { configurable: true, get: () => defaultUpdateURL, set: (value) => { defaultUpdateURL = value; } });
    Object.defineProperty(global, 'lyricsTranslationEndpoint', { configurable: true, get: () => lyricsTranslationEndpoint, set: (value) => { lyricsTranslationEndpoint = value; } });
    Object.defineProperty(global, 'unisonTranslationRetryDelaysMs', { configurable: true, get: () => unisonTranslationRetryDelaysMs, set: (value) => { unisonTranslationRetryDelaysMs = value; } });
    Object.defineProperty(global, 'grooveEditorURL', { configurable: true, get: () => grooveEditorURL, set: (value) => { grooveEditorURL = value; } });
    Object.defineProperty(global, 'geniusURL', { configurable: true, get: () => geniusURL, set: (value) => { geniusURL = value; } });
    Object.defineProperty(global, 'unisonURL', { configurable: true, get: () => unisonURL, set: (value) => { unisonURL = value; } });
    Object.defineProperty(global, 'onboardingChangelogURL', { configurable: true, get: () => onboardingChangelogURL, set: (value) => { onboardingChangelogURL = value; } });
    Object.defineProperty(global, 'lyricsProviders', { configurable: true, get: () => lyricsProviders, set: (value) => { lyricsProviders = value; } });
    Object.defineProperty(global, 'defaultLyricsProviderIds', { configurable: true, get: () => defaultLyricsProviderIds, set: (value) => { defaultLyricsProviderIds = value; } });
    Object.defineProperty(global, 'supportedLyricsTranslationLanguages', { configurable: true, get: () => supportedLyricsTranslationLanguages, set: (value) => { supportedLyricsTranslationLanguages = value; } });
})(globalThis);
