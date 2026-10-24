// Bridges Loop state to the Electron shell and Discord integration without
// coupling those transports to the player/rendering code.
(function initializeLoopBridge(global) {
    function createBridge({ getKawarpState, getCurrentMedia, getFallbackArtwork, getPreferences }) {
        let lastDiscordUpdate = 0;
        let lastDiscordSignature = "";
        let lastElectronMiniPlayerSignature = "";

        function publishElectronKawarpState() {
            global.window.postMessage({
                source: "loop.mp3",
                type: "loop:electron-kawarp-state",
                state: getKawarpState(),
            }, "*");
        }

        function publishElectronMiniPlayerState({ force = false } = {}) {
            const loop = document.getElementById("loop");
            const media = getCurrentMedia();
            const preferences = getPreferences();
            const state = {
                title: loop?.querySelector("#loop-track-title")?.textContent.trim() || "Nothing playing",
                artist: loop?.querySelector("#loop-track-artist")?.textContent.trim() || "Search something to play",
                album: preferences.showAlbum
                    ? loop?.querySelector("#loop-track-album")?.textContent.trim() || ""
                    : undefined,
                artwork: loop?.querySelector("#loop-artwork")?.src || getFallbackArtwork(),
                currentTime: media && Number.isFinite(media.currentTime) ? media.currentTime : 0,
                duration: media && Number.isFinite(media.duration) ? media.duration : 0,
                paused: !media || media.paused,
                theme: loop?.dataset.theme || preferences.theme || "default",
            };
            const signature = JSON.stringify({ ...state, currentTime: Math.floor(state.currentTime) });
            if (!force && signature === lastElectronMiniPlayerSignature) return;
            lastElectronMiniPlayerSignature = signature;
            global.window.postMessage({
                source: "loop.mp3",
                type: "loop:electron-mini-player-state",
                state,
            }, "*");
        }

        function publishElectronMiniPlayerCommand(type) {
            global.window.postMessage({ source: "loop.mp3", type }, "*");
        }

        function publishDiscordActivity({ force = false } = {}) {
            const loop = document.getElementById("loop");
            const media = getCurrentMedia();
            if (!media) return;

            const title = loop?.querySelector("#loop-track-title")?.textContent.trim() || "";
            const artist = media.paused ? "Paused" : loop?.querySelector("#loop-track-artist")?.textContent.trim() || "";
            const album = loop?.querySelector("#loop-track-album")?.textContent.trim() || "";
            const artwork = loop?.querySelector("#loop-artwork")?.src || "";
            const now = Date.now();

            if (!loop || loop.classList.contains("loop-empty") || !title || !artist) {
                if (!force && now - lastDiscordUpdate < 1000 && lastDiscordSignature === "clear") return;
                lastDiscordUpdate = now;
                lastDiscordSignature = "clear";
                global.window.postMessage({ source: "loop.mp3", type: "discord-rpc:clear" }, "*");
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
            global.window.postMessage({ source: "loop.mp3", type: "discord-rpc:update", activity }, "*");
        }

        return Object.freeze({
            publishElectronKawarpState,
            publishElectronMiniPlayerState,
            publishElectronMiniPlayerCommand,
            publishDiscordActivity,
        });
    }

    global.LoopCore = Object.freeze({ createBridge });
})(globalThis);
