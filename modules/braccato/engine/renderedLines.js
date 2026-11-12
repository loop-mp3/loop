import { ANIMATING_CLASS, CURRENT_LYRICS_CLASS } from "../constants.js";
import { clearOffscreenLineCulling, clearVisibleLyricWillChange } from "./culling.js";
import { DECORATION_MIN_SHIFT_PX, decorationSlideAllowed, slideElementBy } from "./decorationSlides.js";
import { stopAllElementMotion, stopElementMotion } from "./elementMotion.js";
import { resetLineAnimationState, togglePartClass } from "./lineAnimationState.js";
import { dropPendingLineScroll } from "./lineScroll.js";
import { stopPassiveScrollLoop } from "./passiveScroll.js";
import { replaceStageElements, resetStage } from "./stageMotion.js";
import { noteEngineScrollEvent } from "./userScroll.js";
export function clearOnScreenLyrics(engine) {
    if (!engine.lyricsContainer)
        return false;
    engine.lyricsContainer.replaceChildren();
    resetStage(engine);
    return true;
}
export function hasRenderedLines(engine) {
    return engine.lines.length > 0;
}
export function getRenderedLines(engine) {
    return engine.lines;
}
export function getRenderedSyncType(engine) {
    return engine.syncType;
}
export function clearLyrics(engine) {
    engine.scrollPos = -1;
    dropPendingLineScroll(engine);
    stopAllElementMotion(engine);
    clearVisibleLyricWillChange(engine);
    engine.lineCullObserver?.disconnect();
    engine.lineCullObserver = null;
    clearOffscreenLineCulling(engine);
    for (const line of engine.lines) {
        resetLineAnimationState(line);
        line.isSelected = false;
    }
    engine.skipScrollsDecayTimes = [];
    engine.lastScrollElements = [];
    engine.pinnedScrollLine = null;
    engine.lastScrollDebugContext.activeElms = [];
    engine.lastScrollDebugContext.centers = [];
    engine.passiveScrollAccumulatedTime = 0;
    engine.passiveLastWallTime = 0;
    engine.passiveScrollTop = null;
    stopPassiveScrollLoop(engine);
    engine.lines = [];
    engine.cachedFooterItem = null;
    engine.cachedCreditsItem = null;
    engine.creditsFocused = false;
    engine.lyricsContainer = null;
    engine.waveAnimationPool.length = 0;
    resetStage(engine);
}
export function replaceRenderedLines(engine, lines, dropped, previousOf) {
    for (const [line, previous] of previousOf)
        carrySelection(line, previous);
    dropPendingLineScroll(engine);
    const droppedElements = new Set(dropped.map(line => line.lyricElement));
    for (const element of droppedElements)
        stopElementMotion(engine, element);
    for (const line of dropped) {
        resetLineAnimationState(line);
        line.isSelected = false;
        engine.visibleWillChangeElements.delete(line.lyricElement);
        engine.culledLineElements.delete(line.lyricElement);
    }
    const successorOf = new Map();
    for (const [line, previous] of previousOf)
        successorOf.set(previous, line);
    const carry = (line) => successorOf.get(line) ?? (droppedElements.has(line.lyricElement) ? null : line);
    const carryAll = (from) => from.map(carry).filter((line) => line !== null);
    engine.lastScrollElements = carryAll(engine.lastScrollElements);
    engine.lastScrollDebugContext.activeElms = carryAll(engine.lastScrollDebugContext.activeElms);
    engine.pinnedScrollLine = engine.pinnedScrollLine === null ? null : carry(engine.pinnedScrollLine);
    engine.lines = lines;
    if (engine.layout === "stage")
        replaceStageElements(engine, dropped, previousOf);
}
function carrySelection(line, previous) {
    line.isScrolled = previous.isScrolled;
    line.isSelected = previous.isSelected;
    togglePartClass(line, CURRENT_LYRICS_CLASS, previous.lyricElement.classList.contains(CURRENT_LYRICS_CLASS));
    togglePartClass(line, ANIMATING_CLASS, previous.lyricElement.classList.contains(ANIMATING_CLASS));
}
export function settleSwappedLines(engine, before, scrollTopBefore) {
    const container = engine.lyricsContainer;
    const scroller = engine.host.getScrollElement();
    if (container === null || scroller === null || engine.layout === "stage")
        return;
    const now = Date.now();
    const followed = followedLine(engine, before, scrollTopBefore, now);
    const followedWas = followed === undefined ? undefined : before.get(followed)?.position;
    if (followed !== undefined && followedWas !== undefined && isMeasured(followedWas) && isMeasured(followed.position)) {
        const moved = followed.position - followedWas;
        if (Math.abs(moved) >= DECORATION_MIN_SHIFT_PX)
            scroller.scrollTop = scrollTopBefore + moved;
    }
    // Layout or this write may clamp scrolling; count an engine scroll event only when the actual position changed.
    const appliedShift = scroller.scrollTop - scrollTopBefore;
    if (appliedShift !== 0) {
        noteEngineScrollEvent(engine, now);
        if (engine.scrollPos >= 0)
            engine.scrollPos += appliedShift;
    }
    if (!decorationSlideAllowed(engine, container))
        return;
    for (const line of engine.lines) {
        const was = before.get(line);
        if (was === undefined || !isMeasured(was.position) || !isMeasured(line.position))
            continue;
        const onScreenShift = was.position + was.motionOffset - line.position + appliedShift;
        if (Math.abs(onScreenShift) >= DECORATION_MIN_SHIFT_PX)
            slideElementBy(engine, line.lyricElement, onScreenShift);
    }
}
function followedLine(engine, before, scrollTopBefore, now) {
    const readerOwnsScroll = engine.scrollResumeTime > now;
    if (readerOwnsScroll) {
        return engine.lines.find(line => {
            const was = before.get(line);
            return was !== undefined && was.position + was.height > scrollTopBefore;
        });
    }
    return (engine.lastScrollElements.findLast(line => before.has(line)) ??
        engine.lines.find(line => before.has(line) && line.isScrolled));
}
function isMeasured(position) {
    return position >= 0;
}
