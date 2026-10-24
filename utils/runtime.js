// Small browser/runtime helpers shared by the content script.
(function initializeLoopRuntimeUtils(global) {
    function getExtensionURL(path) {
        const runtime = global.chrome?.runtime || global.browser?.runtime;
        try {
            return runtime?.getURL(path) || path;
        } catch (error) {
            console.warn("[loop.mp3] Extension context unavailable while resolving asset:", error);
            return path;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    }

    global.LoopUtils = Object.freeze({ getExtensionURL, escapeHTML, formatTime });
})(globalThis);
