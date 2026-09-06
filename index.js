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
        return getFallbackArtwork();
    }

    const trackArtworkURL = `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg`;
    return trackArtworkURL;
}

function getFallbackArtwork() {
    return "https://res.cloudinary.com/djvsr0z4i/image/upload/v1787306926/NO_COVERART_AVAILABLE_ARTWORK2_m8hlzz.png";
}

function initLoopBase(artworkURL) {
    const loop = document.createElement("div");
    loop.id = "loop";

    loop.innerHTML = `
        <div id="loop-player">
            <img
                id="loop-artwork"
                src="${artworkURL}"
                alt="Album artwork"
                onerror="this.onerror=null; this.src='${getFallbackArtwork()}';"
            >
        </div>
    `;

    document.body.appendChild(loop);
}

function init(playerBar) {
    console.log("[loop.mp3] YTM is ready", playerBar);

    const trackId = getCurrentTrackId();
    const artworkURL = getVinylArtwork(trackId);

    initLoopBase(artworkURL);

    console.log("[loop.mp3] Current track ID:", trackId);
    console.log(
        "[loop.mp3] Artwork URL:",
        artworkURL,
        "while current:",
        location.href
    );
}

waitForYTM(init);