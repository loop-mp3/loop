import { clamp, toMs } from "../util.js";
import { dropPendingLineScroll } from "./lineScroll.js";
export function clearStyleCaches(engine) {
    dropPendingLineScroll(engine);
    engine.cachedDurations.clear();
    engine.cachedCSSValues.clear();
    engine.cachedAnimationSettings = null;
    engine.cachedLineScrollTiming.clear();
}
// Property-only caching assumes every lookup for this engine uses its lyrics container.
export function getCSSValue(engine, lyricsElement, property, fallback) {
    let value = engine.cachedCSSValues.get(property);
    if (value === undefined) {
        value = engine.window.getComputedStyle(lyricsElement).getPropertyValue(property).trim() || fallback;
        engine.cachedCSSValues.set(property, value);
    }
    return value;
}
export function getCSSDurationInMs(engine, lyricsElement, property) {
    let duration = engine.cachedDurations.get(property);
    if (duration === undefined) {
        duration = toMs(getCSSValue(engine, lyricsElement, property, "0ms"));
        engine.cachedDurations.set(property, duration);
    }
    return duration;
}
export function getCSSNumber(engine, lyricsElement, property, fallback) {
    const value = Number.parseFloat(getCSSValue(engine, lyricsElement, property, `${fallback}`));
    return Number.isFinite(value) ? value : fallback;
}
export function createThemeReader(engine, lyricsElement) {
    const string = (property, fallback) => getCSSValue(engine, lyricsElement, property, fallback);
    const number = (property, fallback) => getCSSNumber(engine, lyricsElement, property, fallback);
    return {
        string,
        number,
        durationMs: (property, fallback) => Math.max(toMs(string(property, fallback)), 1),
        fraction: (property, fallback) => clamp(number(property, fallback), 0, 1),
        flag: (property, fallback) => {
            const value = string(property, fallback ? "1" : "0").toLowerCase();
            if (value === "false" || value === "off" || value === "none")
                return false;
            const numeric = Number.parseFloat(value);
            return Number.isFinite(numeric) ? numeric > 0 : fallback;
        },
    };
}
