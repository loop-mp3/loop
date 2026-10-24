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




// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.hideLoopSearch = hideLoopSearch;
    global.restoreYTMSearch = restoreYTMSearch;
    global.restoreLoopSearchResults = restoreLoopSearchResults;
    global.restoreLoopQueue = restoreLoopQueue;
    global.closeLoopSearchPanel = closeLoopSearchPanel;
    global.getLoopQueuePanel = getLoopQueuePanel;
    global.renderLoopQueue = renderLoopQueue;
    global.showLoopQueue = showLoopQueue;
    global.getLoopSearchResultsPanel = getLoopSearchResultsPanel;
    global.renderLoopSearchResults = renderLoopSearchResults;
    global.showLoopSearchResults = showLoopSearchResults;
    global.positionLoopSearch = positionLoopSearch;
    global.showLoopSuggestions = showLoopSuggestions;
    global.showLoopSearch = showLoopSearch;
    Object.defineProperty(global, 'loopSearchResizeObserver', { configurable: true, get: () => loopSearchResizeObserver, set: (value) => { loopSearchResizeObserver = value; } });
    Object.defineProperty(global, 'loopSearchMutationObserver', { configurable: true, get: () => loopSearchMutationObserver, set: (value) => { loopSearchMutationObserver = value; } });
    Object.defineProperty(global, 'loopSearchResultsObserver', { configurable: true, get: () => loopSearchResultsObserver, set: (value) => { loopSearchResultsObserver = value; } });
    Object.defineProperty(global, 'originalSearchResultsParent', { configurable: true, get: () => originalSearchResultsParent, set: (value) => { originalSearchResultsParent = value; } });
    Object.defineProperty(global, 'originalSearchResultsNextSibling', { configurable: true, get: () => originalSearchResultsNextSibling, set: (value) => { originalSearchResultsNextSibling = value; } });
    Object.defineProperty(global, 'originalSearchParent', { configurable: true, get: () => originalSearchParent, set: (value) => { originalSearchParent = value; } });
    Object.defineProperty(global, 'originalSearchNextSibling', { configurable: true, get: () => originalSearchNextSibling, set: (value) => { originalSearchNextSibling = value; } });
    Object.defineProperty(global, 'loopQueueObserver', { configurable: true, get: () => loopQueueObserver, set: (value) => { loopQueueObserver = value; } });
    Object.defineProperty(global, 'originalQueueRenderer', { configurable: true, get: () => originalQueueRenderer, set: (value) => { originalQueueRenderer = value; } });
    Object.defineProperty(global, 'originalQueueParent', { configurable: true, get: () => originalQueueParent, set: (value) => { originalQueueParent = value; } });
    Object.defineProperty(global, 'originalQueueNextSibling', { configurable: true, get: () => originalQueueNextSibling, set: (value) => { originalQueueNextSibling = value; } });
    Object.defineProperty(global, 'originalQueueStyle', { configurable: true, get: () => originalQueueStyle, set: (value) => { originalQueueStyle = value; } });
    Object.defineProperty(global, 'originalQueueHidden', { configurable: true, get: () => originalQueueHidden, set: (value) => { originalQueueHidden = value; } });
})(globalThis);
