// YouTube Music DOM access lives here so selectors stay isolated from player logic.
(function initializeYtmDom(global) {
    function waitForYTM(callback) {
        const check = () => {
            const playerPage = document.querySelector("ytmusic-player-page");
            const playerBar = playerPage || document.querySelector("ytmusic-player-bar");
            if (playerBar) return callback(playerBar);
            requestAnimationFrame(check);
        };
        check();
    }

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
                // YouTube can briefly expose an incomplete href while navigating.
            }
        }
        return document.querySelector("ytmusic-player-page")?.getAttribute("video-id") ||
            document.querySelector("ytmusic-player-page")?.dataset.videoId;
    }

    function getFallbackArtwork(preferences, getExtensionURL) {
        return getExtensionURL(preferences.useLegacyFallbackArtwork
            ? "static/fallback-legacy.png"
            : "static/fallback-artwork.png");
    }

    function getVinylArtwork(trackId, preferences, getExtensionURL) {
        return trackId
            ? `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg`
            : getFallbackArtwork(preferences, getExtensionURL);
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

    function getCurrentArtwork(playerBar, trackId, preferences, currentArtworkURL, getExtensionURL) {
        return trackId
            ? getVinylArtwork(trackId, preferences, getExtensionURL)
            : getPlayerBarArtwork(playerBar) || currentArtworkURL || getFallbackArtwork(preferences, getExtensionURL);
    }

    function getTrackInfo(playerBar) {
        const root = playerBar || getYTMPlayerRoot();
        if (!root) {
            return { title: "Unknown track", artist: "Unknown artist", album: "Unknown album" };
        }

        const dataRoot = root.matches?.("ytmusic-player-page")
            ? root.querySelector("ytmusic-player-bar") || root
            : root;
        const playerInfoLinks = [...document.querySelectorAll(
            "ytmusic-track-info .ytmusicTrackInfoByline a.ytAttributedStringLink.ytAttributedStringLinkCallToActionColor"
        )];
        const byline = dataRoot.querySelector("yt-formatted-string.byline.ytmusic-player-bar") ||
            dataRoot.querySelector(".subtitle.ytmusic-player-bar yt-formatted-string.byline") ||
            dataRoot.querySelector(".byline, .subtitle, [class*='byline'], [class*='subtitle']");
        const links = byline?.querySelectorAll("a") || [];
        const albumLink = playerInfoLinks[1] || dataRoot.querySelector(
            "a.ytAttributedStringLink.ytAttributedStringLinkCallToActionColor"
        ) || dataRoot.querySelector("a.ytAttributedStringLink");
        const parsedByline = byline?.textContent
            ?.split(/\s*[\u2022\u00b7]\s*/)
            .map((part) => part.trim())
            .filter(Boolean) || [];
        const bylineText = byline?.textContent.split("•").map((part) => part.trim()).filter(Boolean) || [];

        return {
            // The title is resolved canonically by the oEmbed service. DOM title
            // nodes also contain navigation labels on some YTM versions.
            title: "Unknown track",
            artist: links[0]?.textContent.trim() || parsedByline[0] || bylineText[0] || "Unknown artist",
            artistUrl: links[0]?.href || "",
            album: albumLink?.textContent.trim() || (links.length >= 2
                ? links[links.length - 1].textContent.trim()
                : parsedByline[1] || bylineText[1] || "Unknown album"),
            albumUrl: albumLink?.href || (links.length >= 2 ? links[links.length - 1].href : ""),
        };
    }

    global.LoopYtmDom = Object.freeze({
        waitForYTM,
        getYTMPlayerRoot,
        getCurrentTrackId,
        getFallbackArtwork,
        getVinylArtwork,
        getPlayerBarArtwork,
        getCurrentArtwork,
        getTrackInfo,
    });
})(globalThis);
