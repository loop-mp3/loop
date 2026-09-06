function waitForYTM(callback) {
    const check = () => {
        const playerBar = document.querySelector("ytmusic-player-bar");

        if (playerBar) {
            callback(playerBar);
            return;
        }

        requestAnimationFrame(check);
    };

    check();
}

function getCurrentTrackId() {
    const url = new URL(location.href);
    return url.searchParams.get("v");
}

function getVinylArtwork(trackId) {
    if (!trackId) {
        return null;
    }

    const trackArtworkURL = `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg`;
    return trackArtworkURL;
}

function init(playerBar) {
    console.log("[loop.mp3] YTM is ready", playerBar);

    const trackId = getCurrentTrackId();
    const artworkURL = getVinylArtwork(trackId);

    console.log("[loop.mp3] Current track ID:", trackId);
    console.log("[loop.mp3] Artwork URL:", artworkURL);
}

waitForYTM(init);

