function waitForYTM(callback) {
    const check = () => {
        const playerBar = document.querySelector("ytmusic-player-bar");
        if (playerBar) return callback(playerBar);
        requestAnimationFrame(check);
    };
    check();
}

function getCurrentTrackId() {
    return new URL(location.href).searchParams.get("v");
}

function getFallbackArtwork() {
    return "https://res.cloudinary.com/djvsr0z4i/image/upload/v1787306926/NO_COVERART_AVAILABLE_ARTWORK2_m8hlzz.png";
}

function getVinylArtwork(trackId) {
    return trackId ? `https://img.youtube.com/vi/${trackId}/maxresdefault.jpg` : getFallbackArtwork();
}

function getTrackInfo(playerBar) {
    const title = playerBar.querySelector(".title")?.textContent.trim() || "Unknown title";
    const byline = playerBar.querySelector("yt-formatted-string.byline.ytmusic-player-bar") ||
        playerBar.querySelector(".subtitle.ytmusic-player-bar yt-formatted-string.byline") ||
        playerBar.querySelector(".byline");
    const links = byline?.querySelectorAll("a") || [];
    return {
        title,
        artist: links[0]?.textContent.trim() || "Unknown artist",
        album: links.length >= 2 ? links[links.length - 1].textContent.trim() : "Unknown album",
    };
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
        const liveInfo = getTrackInfo(playerBar);
        return {
            title: details.title || liveInfo.title || domInfo.title,
            artist: details.author_name || liveInfo.artist || domInfo.artist,
            album: liveInfo.album || domInfo.album,
        };
    } catch (error) {
        console.warn("[loop.mp3] Could not fetch track metadata:", error);
        return domInfo;
    }
}

function goBackToNormal() {
    document.getElementById("loop")?.remove();
    console.log("[loop.mp3] Loop removed, back to normal YTM");
}

function updateLoop(artworkURL, trackInfo) {
    let loop = document.getElementById("loop");
    if (!loop) {
        loop = document.createElement("div");
        loop.id = "loop";
        loop.innerHTML = `
            <div id="loop-player">
                <button id="loop-back-button" type="button" aria-label="Return to YouTube Music">&#215;</button>
                <img id="loop-artwork" alt="Album artwork" onerror="this.onerror=null; this.src='${getFallbackArtwork()}';">
                <div id="loop-track-info">
                    <div id="loop-track-title"></div>
                    <div id="loop-track-artist"></div>
                    <div id="loop-track-album"></div>
                </div>
            </div>`;
        document.body.appendChild(loop);
        loop.querySelector("#loop-back-button").addEventListener("click", goBackToNormal);
    }
    loop.querySelector("#loop-artwork").src = artworkURL;
    loop.querySelector("#loop-track-title").textContent = trackInfo.title;
    loop.querySelector("#loop-track-artist").textContent = trackInfo.artist;
    loop.querySelector("#loop-track-album").textContent = trackInfo.album;
}

let recordFrame;

function getCurrentMedia() {
    const media = [...document.querySelectorAll("video, audio")]
        .filter((element) => Number.isFinite(element.duration) && element.duration > 0);
    return media.find((element) => !element.paused && !element.ended) || media[0];
}

function syncRecordMotion() {
    const artwork = document.querySelector("#loop-artwork");
    const media = getCurrentMedia();

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
    if (media && !media.paused && recordFrame === undefined) syncRecordMotion();
}

let lastTrackId;
let metadataRequest = 0;

async function updateForCurrentTrack(playerBar) {
    const trackId = getCurrentTrackId();
    if (!trackId) return;
    if (trackId === lastTrackId) {
        const liveInfo = getTrackInfo(playerBar);
        const albumNode = document.querySelector("#loop-track-album");
        if (albumNode && albumNode.textContent === "Unknown album" && liveInfo.album !== "Unknown album") {
            albumNode.textContent = liveInfo.album;
        }
        return;
    }

    lastTrackId = trackId;
    const requestId = ++metadataRequest;
    updateLoop(getVinylArtwork(trackId), getTrackInfo(playerBar));
    syncRecordMotion();
    const trackInfo = await getTrackInfoFromTrackId(trackId, playerBar);
    if (requestId !== metadataRequest || trackId !== getCurrentTrackId()) return;
    updateLoop(getVinylArtwork(trackId), trackInfo);
    syncRecordMotion();
    console.log("[loop.mp3] Current track metadata:", trackInfo);
}

function init(playerBar) {
    console.log("[loop.mp3] YTM is ready", playerBar);
    updateForCurrentTrack(playerBar);
    setInterval(() => {
        updateForCurrentTrack(playerBar);
        watchPlaybackState();
    }, 100);
}

waitForYTM(init);
