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
    restoreYTMSearch();
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
        loop.addEventListener("click", (event) => {
            const searchBar = document.querySelector("ytmusic-search-box");
            const resultsPanel = document.getElementById("loop-search-results");

            if (
                event.target instanceof Node &&
                ((searchBar && searchBar.contains(event.target)) ||
                    (resultsPanel && resultsPanel.contains(event.target)))
            ) {
                return;
            }

            closeLoopSearchPanel();
            hideLoopSearch();
        });
    }
    const artwork = loop.querySelector("#loop-artwork");
    const title = loop.querySelector("#loop-track-title");
    const artist = loop.querySelector("#loop-track-artist");
    const album = loop.querySelector("#loop-track-album");

    // YouTube Music can replace DOM nodes while navigating between tracks.
    // Rebuild the injected UI if one of its required nodes disappeared.
    if (!artwork || !title || !artist || !album) {
        loop.remove();
        return updateLoop(artworkURL, trackInfo);
    }

    artwork.src = artworkURL;
    title.textContent = trackInfo.title;
    artist.textContent = trackInfo.artist;
    album.textContent = trackInfo.album;
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

function restoreYTMSearch() {
    const searchBar = document.querySelector("ytmusic-search-box");

    loopSearchResizeObserver?.disconnect();
    loopSearchResizeObserver = undefined;
    loopSearchMutationObserver?.disconnect();
    loopSearchMutationObserver = undefined;
    loopSearchResultsObserver?.disconnect();
    loopSearchResultsObserver = undefined;

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

    document.getElementById("loop")?.remove();
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

    console.log("[loop.mp3] Search shown");
}

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "m") {
        console.log("[loop.mp3] Search called");
        showLoopSearch();
        return;
    }

    if (event.key === "Enter") {
        const searchBar = document.querySelector("ytmusic-search-box");
        if (searchBar && event.target instanceof Node && searchBar.contains(event.target)) {
            // Let YouTube Music process the query, then mirror its results in the Loop panel.
            setTimeout(() => showLoopSearchResults(searchBar), 0);
        }
    }
});

function init(playerBar) {
    console.log("[loop.mp3] YTM is ready", playerBar);
    updateForCurrentTrack(playerBar);
    setInterval(() => {
        updateForCurrentTrack(playerBar);
        watchPlaybackState();
    }, 100);
}

waitForYTM(init);
