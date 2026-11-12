import { CREDITS_CLASS, CURRENT_LYRICS_CLASS, FOOTER_CLASS } from "../constants.js";
import { getRelativeLayoutBounds } from "../util.js";
import { getAnimationSettings } from "./animationConfig.js";
import { applyPlaybackRateToRunningAnimations, correctedScrollTimeS } from "./animationTiming.js";
import { followFocusedLines, lastSungLine } from "./autoScroll.js";
import { advancePlaybackClock, lyricClockShiftS, NO_PLAYER_SNAPSHOT, playbackClock } from "./clock.js";
import { getCSSDurationInMs } from "./cssValues.js";
import { clearOffscreenLineCulling, clearVisibleLyricWillChange, setupLineCullObserver, updateVisibleLyricWillChange, } from "./culling.js";
import { captureDecorationSlide, lineDecorators } from "./decorationSlides.js";
import { resetLineAnimationState } from "./lineAnimationState.js";
import { driveLineAnimations } from "./lineLifecycle.js";
import { clearLineScrolls, dropPendingLineScroll, measureTrailingItem } from "./lineScroll.js";
import { hasNoLyricsPlaceholder, hasUnsyncedLyrics, startPassiveScrollLoop, stopPassiveScrollLoop, } from "./passiveScroll.js";
import { applyScrollPadding, measureScrollViewport, setupTabRendererObserver } from "./scrollViewport.js";
import { applyStage, measureStage } from "./stageMotion.js";
import { requestRescroll } from "./userScroll.js";
const NO_LYRICS_ELEMENT_LOG = "No lyrics element found on the page, skipping lyrics injection";
const TICK_ERROR_LOG = "Error in lyrics tick:";
export function resolveTickOptions(options) {
    return {
        isPlaying: options.isPlaying,
        eventCreationTime: options.eventCreationTime ?? NO_PLAYER_SNAPSHOT,
        smoothScroll: options.smoothScroll ?? true,
        globalLyricOffset: options.globalLyricOffset ?? 0,
        lyricOffset: options.lyricOffset ?? 0,
        richsyncOffsetTrim: options.richsyncOffsetTrim ?? 0,
        lineOffsetTrim: options.lineOffsetTrim ?? 0,
        passiveScrollEnabled: options.passiveScrollEnabled ?? false,
        playbackRate: usablePlaybackRate(options.playbackRate),
        followPausedSeeks: options.followPausedSeeks ?? false,
        countEveryUserScroll: options.countEveryUserScroll ?? false,
    };
}
function usablePlaybackRate(rate) {
    return rate !== undefined && Number.isFinite(rate) && rate > 0 ? rate : 1;
}
export function tickView(engine, reportedTimeS, options) {
    rememberTickOptions(engine, options);
    if (reportedTimeS === 0 && !options.isPlaying)
        return "ok";
    if (hasNoLyricsPlaceholder(engine)) {
        stopPassiveScrollLoop(engine);
        return "ok";
    }
    if (hasUnsyncedLyrics(engine)) {
        followUnsyncedLyrics(engine, options);
        return "ok";
    }
    const now = Date.now();
    const playhead = advancePlaybackClock(reportedTimeS, options, engine.playbackRate, now);
    if (playhead.jumped)
        dropPendingLineScroll(engine);
    if (!engine.host.isViewVisible()) {
        clearVisibleLyricWillChange(engine);
        return "ok";
    }
    if (engine.host.syncAdState())
        return "ok";
    const lyricsElement = engine.lyricsContainer;
    if (!lyricsElement) {
        engine.host.log(NO_LYRICS_ELEMENT_LOG);
        return "lyrics-missing";
    }
    try {
        renderSyncedLyrics(engine, lyricsElement, playhead, options, now);
    }
    catch (error) {
        if (!isUndefinedAccessError(error))
            engine.host.log(TICK_ERROR_LOG, error);
    }
    return "ok";
}
function rememberTickOptions(engine, options) {
    engine.lastTickOptions = options;
    engine.passiveScrollEnabled = options.passiveScrollEnabled;
    if (engine.playbackRate === options.playbackRate)
        return;
    engine.playbackRate = options.playbackRate;
    applyPlaybackRateToRunningAnimations(engine);
}
function followUnsyncedLyrics(engine, { isPlaying, passiveScrollEnabled }) {
    if (engine.layout === "stage")
        return;
    if (isPlaying && !playbackClock.lastPlayState)
        engine.scrollResumeTime = 0;
    playbackClock.lastPlayState = isPlaying;
    if (passiveScrollEnabled)
        startPassiveScrollLoop(engine);
}
function isUndefinedAccessError(error) {
    return error.message?.includes("undefined") ?? false;
}
function renderSyncedLyrics(engine, lyricsElement, playhead, options, now) {
    const lyricTimeS = playhead.timeS + lyricClockShiftS(engine, lyricsElement, options);
    const scrollTimeS = correctedScrollTimeS(engine, lyricTimeS) +
        getCSSDurationInMs(engine, lyricsElement, "--blyrics-scroll-timing-offset") / 1000;
    const { config, scrollTiming } = getAnimationSettings(engine, lyricsElement);
    const isStage = engine.layout === "stage";
    const scroller = isStage ? null : readScrollerBeforeWrites(engine);
    if (!isStage && !scroller) {
        clearVisibleLyricWillChange(engine);
        return;
    }
    if (scroller && config.enabled.scroll) {
        const pendingScrollTop = engine.pendingLineScroll?.toScrollTop ?? scroller.scrollTop;
        updateVisibleLyricWillChange(engine, engine.lines, scroller.scrollTop, pendingScrollTop, scroller.height);
    }
    else {
        stopLineScrolling(engine);
    }
    const focus = focusLines(engine, scrollTimeS, scrollTiming.earlyScrollConsiderS);
    driveLineAnimations({ engine, lyricTimeS, playhead, config, now });
    const creditsFocusChanged = updateCreditsFocus(engine, lyricsElement, scrollTimeS);
    if (!scroller) {
        applyStage(engine, lyricTimeS, playhead.jumped);
        return;
    }
    followFocusedLines({
        engine,
        lyricsElement,
        scroller,
        focusedLines: focus.lines,
        scrollTimeS,
        config,
        smoothScroll: options.smoothScroll,
        countEveryUserScroll: options.countEveryUserScroll,
        jumped: playhead.jumped,
        focusChanged: playhead.jumped || focus.reachedUncommittedLine || creditsFocusChanged,
        now,
    });
}
function readScrollerBeforeWrites(engine) {
    const element = engine.host.getScrollElement();
    if (!element)
        return null;
    if (element !== engine.observedTabRenderer)
        setupTabRendererObserver(engine, element);
    return {
        element,
        height: engine.cachedTabRendererHeight ?? element.getBoundingClientRect().height,
        scrollTop: element.scrollTop,
        maxScrollTop: Math.max(0, element.scrollHeight - element.clientHeight),
    };
}
function stopLineScrolling(engine) {
    dropPendingLineScroll(engine);
    clearVisibleLyricWillChange(engine);
    clearLineScrolls(engine);
}
function focusLines(engine, scrollTimeS, earlyScrollConsiderS) {
    const lines = engine.lines;
    const focused = [];
    let reachedUncommittedLine = false;
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const nextLineStartS = lines[index + 1]?.time ?? Infinity;
        const inFocus = scrollTimeS >= line.time - earlyScrollConsiderS &&
            (scrollTimeS < nextLineStartS || scrollTimeS < line.time + line.duration);
        setLineCurrent(line, inFocus);
        if (!inFocus)
            continue;
        focused.push(line);
        engine.selectedElementIndex = index;
        if (scrollTimeS >= line.time && !engine.lastScrollElements.includes(line))
            reachedUncommittedLine = true;
    }
    return { lines: focused, reachedUncommittedLine };
}
function setLineCurrent(line, current) {
    if (line.isScrolled === current)
        return;
    line.isScrolled = current;
    line.lyricElement.classList.toggle(CURRENT_LYRICS_CLASS, current);
}
function updateCreditsFocus(engine, lyricsElement, scrollTimeS) {
    const lastLine = lastSungLine(engine);
    const focused = lastLine !== undefined &&
        (engine.cachedCreditsItem?.height ?? 0) > 0 &&
        scrollTimeS >= lastLine.time + lastLine.duration;
    if (focused === engine.creditsFocused)
        return false;
    engine.creditsFocused = focused;
    if (focused)
        lyricsElement.dataset.creditsFocused = "true";
    else
        delete lyricsElement.dataset.creditsFocused;
    return true;
}
/** Returns whether it stopped lines that only a tick starts again; see `restartContextSweeps`. */
export function relayout(engine, linesAreRendered) {
    if (engine.layout === "stage") {
        if (!linesAreRendered || !engine.lyricsContainer)
            return false;
        engine.cachedCreditsItem = measureTrailingItem(engine.lyricsContainer, CREDITS_CLASS);
        measureStage(engine);
        return restartContextSweeps(engine);
    }
    applyScrollPadding(engine);
    const scrollElement = engine.host.getScrollElement();
    if (scrollElement)
        measureScrollViewport(engine, scrollElement);
    if (!linesAreRendered)
        return false;
    const lyricsElement = engine.lyricsContainer;
    if (!lyricsElement)
        return false;
    engine.lyricWidth = lyricsElement.clientWidth;
    engine.lyricHeight = lyricsElement.clientHeight;
    measureLinePositions(engine, lyricsElement);
    const restarted = restartContextSweeps(engine);
    engine.cachedCreditsItem = measureTrailingItem(lyricsElement, CREDITS_CLASS);
    engine.cachedFooterItem = measureTrailingItem(lyricsElement, FOOTER_CLASS);
    setupLineCullObserver(engine);
    requestRescroll(engine);
    engine.host.debug?.resize();
    return restarted;
}
/**
 * A word drawn by sweep cells placed over its boxes needs them placed again once the layout moves.
 * Stopping its line lets the next tick start it over at the same moment, which places them afresh.
 * A paused view gets no next tick on its own, so whoever relayouts has to tick once it returns true.
 */
function restartContextSweeps(engine) {
    let restarted = false;
    for (const line of engine.lines) {
        if (line.isAnimating && line.parts.some(part => part.sweepContext)) {
            resetLineAnimationState(line);
            restarted = true;
        }
    }
    return restarted;
}
function measureLinePositions(engine, lyricsElement) {
    clearOffscreenLineCulling(engine);
    for (const line of engine.lines) {
        const bounds = getRelativeLayoutBounds(lyricsElement, line.lyricElement);
        line.position = bounds.y;
        line.height = bounds.height;
        line.decorations = new Map(lineDecorators(line.lyricElement).map(element => [element, getRelativeLayoutBounds(lyricsElement, element).y]));
    }
}
export function cancelLyricPositionUpdate(engine) {
    if (engine.pendingLyricsUpdateFrame === null)
        return;
    engine.window.cancelAnimationFrame(engine.pendingLyricsUpdateFrame);
    engine.pendingLyricsUpdateFrame = null;
}
export function retickFromPlaybackClock(engine, buildTickOptions) {
    const options = buildTickOptions(playbackClock.lastEventCreationTime, playbackClock.lastPlayState);
    return tickView(engine, playbackClock.lastTime, resolveTickOptions(options));
}
/** Ticks again at the time and with the options of the last tick, for a view that is not ticking itself. */
export function retickAtLastTime(engine) {
    if (engine.lastTickOptions)
        tickView(engine, playbackClock.lastTime, engine.lastTickOptions);
}
export function scheduleLyricPositionUpdate(engine, isViewRendering, retick) {
    if (engine.pendingLyricsUpdateFrame !== null)
        return;
    dropPendingLineScroll(engine);
    engine.pendingLyricsUpdateFrame = engine.window.requestAnimationFrame(() => {
        engine.pendingLyricsUpdateFrame = null;
        const isRendering = isViewRendering();
        const playSlide = isRendering ? captureDecorationSlide(engine) : null;
        relayout(engine, isRendering);
        playSlide?.();
        if (isRendering)
            retick();
    });
}
