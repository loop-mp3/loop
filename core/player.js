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
                    <label class="loop-polling-setting">
                        Lyric gap notes <output id="loop-lyrics-gap-note-threshold-value" for="loop-lyrics-gap-note-threshold-slider">5 sec</output>
                        <input id="loop-lyrics-gap-note-threshold-slider" type="range" min="0" max="30" step="1" value="5" aria-label="Lyric gap note threshold in seconds">
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
                    <div class="loop-lyrics-provider-setting">
                        <div class="loop-lyrics-provider-heading">Lyrics provider priority</div>
                        <div id="loop-lyrics-provider-priority-list" role="list" aria-label="Lyrics provider priority list"></div>
                        <button id="loop-lyrics-provider-restore" class="loop-lyrics-provider-restore" type="button" hidden>Restore removed providers</button>
                    </div>
                    <button id="loop-lyrics-submit-button" class="loop-menu-action" type="button">
                        Submit lyrics to Unison
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
        loop.querySelector("#loop-lyrics-gap-note-threshold-slider").addEventListener("input", (event) => {
            loopPreferences.lyricsGapNoteThreshold = normalizeLyricsGapNoteThreshold(event.target.value);
            saveLoopPreferences();
            updateLoopPollingPreferenceUI();
            if (loopPreferences.showLyrics) fetchLoopLyricsForCurrentTrack(true);
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

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.syncWindowTitle = syncWindowTitle;
    global.goBackToNormal = goBackToNormal;
    global.updateLoop = updateLoop;
})(globalThis);
