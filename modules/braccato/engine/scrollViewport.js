import { CREDITS_CLASS, FOOTER_CLASS, LINE_CLASS } from "../constants.js";
import { registerThemeSetting } from "../themeSettings.js";
import { clamp, getRelativeLayoutBounds } from "../util.js";
import { getCSSValue } from "./cssValues.js";
import { dropPendingLineScroll } from "./lineScroll.js";
import { hasNoLyricsPlaceholder } from "./passiveScroll.js";
const TARGET_SCROLL_POSITION_RATIO = registerThemeSetting("blyrics-target-scroll-pos-ratio", 0.37);
export const NO_SCROLL_INSETS = { top: 0, bottom: 0 };
export function getTargetScrollRatio(engine, lyricsElement) {
    const themed = Number.parseFloat(getCSSValue(engine, lyricsElement, "--blyrics-target-scroll-pos-ratio", ""));
    return Number.isFinite(themed) ? clamp(themed, 0, 1) : TARGET_SCROLL_POSITION_RATIO.getNumberValue();
}
export function setupTabRendererObserver(engine, element) {
    engine.tabRendererResizeObserver?.disconnect();
    engine.tabRendererResizeObserver = new engine.window.ResizeObserver(() => {
        dropPendingLineScroll(engine);
        if (element.isConnected)
            measureScrollViewport(engine, element);
    });
    engine.tabRendererResizeObserver.observe(element);
    engine.observedTabRenderer = element;
    measureScrollViewport(engine, element);
}
export function measureScrollViewport(engine, element) {
    const height = element.getBoundingClientRect().height;
    const { scrollPaddingTop, scrollPaddingBottom } = engine.window.getComputedStyle(element);
    engine.cachedTabRendererHeight = height;
    engine.cachedScrollInsets = resolveScrollInsets(scrollPaddingTop, scrollPaddingBottom, height);
}
export function resolveScrollInsets(scrollPaddingTop, scrollPaddingBottom, viewportHeight) {
    const top = resolveScrollInset(scrollPaddingTop, viewportHeight);
    const bottom = resolveScrollInset(scrollPaddingBottom, viewportHeight);
    const leavesABand = top + bottom < viewportHeight;
    return leavesABand ? { top, bottom } : NO_SCROLL_INSETS;
}
function resolveScrollInset(value, viewportHeight) {
    const amount = Number.parseFloat(value);
    if (!Number.isFinite(amount) || amount <= 0)
        return 0;
    return value.trim().endsWith("%") ? (viewportHeight * amount) / 100 : amount;
}
export function findScrollAnchor(sungLines, scrollTime) {
    const latestRunning = sungLines.findLast(line => line.time <= scrollTime && scrollTime < line.time + line.duration);
    return latestRunning ?? sungLines.findLast(line => line.time <= scrollTime) ?? sungLines[0];
}
export function computeActiveLinesScrollTop(sungLines, anchor, viewportHeight, insets, targetOffset) {
    const first = sungLines[0];
    const last = sungLines[sungLines.length - 1];
    const visibleBottom = viewportHeight - insets.bottom;
    const clampToLineBounds = (scrollTop, line) => Math.min(Math.max(scrollTop, line.position + line.height - visibleBottom), line.position - insets.top);
    const averageCentre = sungLines.reduce((total, line) => total + line.position + line.height / 2, 0) / sungLines.length;
    const showingLast = clampToLineBounds(averageCentre - targetOffset, last);
    const showingFirstTop = Math.min(showingLast, first.position - insets.top);
    return {
        scrollTop: clampToLineBounds(showingFirstTop, anchor),
        overflowsBand: last.position + last.height - first.position > visibleBottom - insets.top,
    };
}
export function computeScrollPadding(measurements) {
    const { viewportHeight, targetScrollRatio, lastLineCentre } = measurements;
    const contentHeight = measurements.contentHeightWithoutBottomPadding;
    const belowTarget = viewportHeight * (1 - targetScrollRatio);
    const top = Math.max(0, viewportHeight * targetScrollRatio - measurements.firstLineHeight / 2);
    const lastLineAtTarget = (lastLineCentre === null ? viewportHeight : lastLineCentre + belowTarget) - contentHeight;
    const fillsViewport = viewportHeight - contentHeight;
    const unrenderedFloor = belowTarget - (measurements.footerHeight + measurements.lastLineHeight / 2);
    const bottom = Math.max(lastLineAtTarget, fillsViewport, unrenderedFloor, 0);
    return { top, bottom: Math.ceil(bottom) };
}
// These published properties must remain document-scoped for external stylesheets and themes. A second
// renderer in the same document overwrites them.
export function applyScrollPadding(engine) {
    const lyricsElement = engine.lyricsContainer;
    const scroller = engine.host.getScrollElement();
    if (!lyricsElement || !scroller)
        return;
    if (hasNoLyricsPlaceholder(engine)) {
        setScrollPadding(engine, lyricsElement, { top: 0, bottom: 0 });
        return;
    }
    const bounds = (element) => (element ? getRelativeLayoutBounds(lyricsElement, element) : null);
    const child = (className) => lyricsElement.querySelector(`:scope > .${className}`);
    const lines = lyricsElement.querySelectorAll(`:scope > .${LINE_CLASS}`);
    const creditsBounds = bounds(child(CREDITS_CLASS));
    const lastTargetBounds = creditsBounds && creditsBounds.height > 0 ? creditsBounds : bounds(lines[lines.length - 1] ?? null);
    const currentBottomPadding = Number.parseFloat(engine.window.getComputedStyle(lyricsElement).paddingBottom) || 0;
    setScrollPadding(engine, lyricsElement, computeScrollPadding({
        viewportHeight: scroller.getBoundingClientRect().height,
        targetScrollRatio: getTargetScrollRatio(engine, lyricsElement),
        contentHeightWithoutBottomPadding: Math.max(0, lyricsElement.scrollHeight - currentBottomPadding),
        firstLineHeight: bounds(lines[0] ?? null)?.height ?? 0,
        lastLineCentre: lastTargetBounds ? lastTargetBounds.y + lastTargetBounds.height / 2 : null,
        lastLineHeight: lastTargetBounds?.height ?? 0,
        footerHeight: bounds(child(FOOTER_CLASS))?.height ?? 0,
    }));
}
function setScrollPadding(engine, lyricsElement, { top, bottom }) {
    const rootStyle = engine.document.documentElement.style;
    rootStyle.setProperty("--blyrics-padding-top", `${top}px`);
    rootStyle.setProperty("--blyrics-padding-bottom", `${bottom}px`);
    // Inline, because a theme's `.blyrics-container { padding }` comes after the package stylesheet at equal
    // specificity and would otherwise take this room away.
    lyricsElement.style.setProperty("padding-bottom", `${bottom}px`);
}
