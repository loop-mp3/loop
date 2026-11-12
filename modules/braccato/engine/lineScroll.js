import { getRelativeLayoutBounds } from "../util.js";
import { addElementCurve, removeElementCurves, timelineNow } from "./elementMotion.js";
import { clearScrollVariables, resolveScrollTimings, resolveThemedTranslates, themeOverridesScrollTranslate, writeScrollVariables, } from "./lineScrollStyle.js";
export const SCROLL_PREPARE_LEAD_MS = 120;
export const LINE_SCROLL_WILL_CHANGE_VALUE = "transform, translate";
const SAME_SCROLL_TOLERANCE_PX = 2;
export function commitOrPrepareLineScroll(engine, request) {
    const pending = engine.pendingLineScroll;
    if (pending && pendingScrollMatches(pending, request)) {
        engine.pendingLineScroll = null;
        startLineScroll(engine, pending.plan);
        return;
    }
    dropPendingLineScroll(engine);
    const plan = planLineScroll(engine, request);
    if (plan)
        startLineScroll(engine, plan);
}
export function prepareUpcomingLineScroll(engine, request) {
    const pending = engine.pendingLineScroll;
    if (pending && pendingScrollMatches(pending, request))
        return;
    dropPendingLineScroll(engine);
    const plan = planLineScroll(engine, request);
    if (!plan)
        return;
    const { activeLine, fromScrollTop, toScrollTop } = request;
    engine.pendingLineScroll = { plan, activeLineElement: activeLine.lyricElement, fromScrollTop, toScrollTop };
}
export function dropPendingLineScroll(engine) {
    const pending = engine.pendingLineScroll;
    if (!pending)
        return;
    for (const line of pending.plan)
        releaseLine(engine, line.lineElement, line.token);
    engine.pendingLineScroll = null;
}
function pendingScrollMatches(pending, request) {
    return (pending.activeLineElement === request.activeLine.lyricElement &&
        Math.abs(pending.fromScrollTop - request.fromScrollTop) <= SAME_SCROLL_TOLERANCE_PX &&
        Math.abs(pending.toScrollTop - request.toScrollTop) <= SAME_SCROLL_TOLERANCE_PX);
}
function planLineScroll(engine, request) {
    const { lines, config } = request;
    const activeIndex = lines.findIndex(line => line.lyricElement === request.activeLine.lyricElement);
    if (!config.enabled.scroll || activeIndex < 0)
        return null;
    const deltaPx = request.toScrollTop - request.fromScrollTop;
    const translateThemed = themeOverridesScrollTranslate();
    const targets = [];
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (!isLineVisibleDuringScroll(line, request.fromScrollTop, request.toScrollTop, request.viewportHeight))
            continue;
        const lineElement = line.lyricElement;
        const relativeIndex = index - activeIndex;
        const side = scrollSide(relativeIndex, deltaPx);
        const timingKey = `${side}|${Math.abs(relativeIndex)}`;
        const cachedTiming = engine.cachedLineScrollTiming.get(timingKey);
        targets.push({
            lineElement,
            side,
            heightPx: line.height,
            token: claimLine(engine, lineElement),
            relativeIndex,
            timingKey,
            cachedTiming,
        });
        if (translateThemed || !cachedTiming) {
            writeScrollVariables(lineElement, { index, activeIndex, relativeIndex, side, deltaPx });
        }
    }
    const timings = getOrResolveScrollTimings(engine, targets, config);
    const translates = translateThemed ? resolveThemedTranslates(engine, targets, config) : null;
    const staggerScale = staggerScaleKeepingLinesApart(lines, activeIndex, Math.abs(deltaPx), request.continuesEngineScroll);
    const activeDurationMs = timings[targets.findIndex(target => target.relativeIndex === 0)]?.durationMs;
    return targets.map(({ lineElement, side, token }, index) => {
        const timing = timings[index];
        return {
            lineElement,
            side,
            token,
            durationMs: activeDurationMs === undefined
                ? timing.durationMs
                : activeDurationMs + (timing.durationMs - activeDurationMs) * staggerScale,
            startEasing: timing.startEasing,
            endEasing: timing.endEasing,
            startPx: translates?.start[index] ?? deltaPx,
            endPx: translates?.end[index] ?? 0,
        };
    });
}
function scrollSide(relativeIndex, deltaPx) {
    const scrollsUp = deltaPx < 0;
    if (relativeIndex < 0)
        return scrollsUp ? "below" : "above";
    if (relativeIndex > 0)
        return scrollsUp ? "above" : "below";
    return "active";
}
function getOrResolveScrollTimings(engine, targets, config) {
    const misses = targets.filter(target => target.cachedTiming === undefined);
    const resolved = new Map();
    if (misses.length > 0) {
        resolveScrollTimings(engine, misses, config).forEach((timing, index) => {
            engine.cachedLineScrollTiming.set(misses[index].timingKey, timing);
            resolved.set(misses[index], timing);
        });
    }
    return targets.map(target => target.cachedTiming ?? resolved.get(target));
}
function staggerScaleKeepingLinesApart(lines, activeIndex, distancePx, continuesEngineScroll) {
    if (continuesEngineScroll)
        return 1;
    const active = lines[activeIndex];
    const neighbourSteps = [lines[activeIndex - 1], lines[activeIndex + 1]]
        .filter(neighbour => neighbour !== undefined)
        .map(neighbour => Math.abs(active.position - neighbour.position));
    const stepPx = neighbourSteps.length > 0 ? Math.min(...neighbourSteps) : active.height;
    return Math.min(1, stepPx / distancePx);
}
function startLineScroll(engine, plan) {
    const startMs = timelineNow(engine);
    for (const line of plan) {
        if (!line.lineElement.isConnected || !ownsLine(engine, line.lineElement, line.token))
            continue;
        const scroll = { lineElement: line.lineElement, token: line.token, durationMs: line.durationMs };
        engine.runningLineScrolls.push(scroll);
        addElementCurve(engine, line.lineElement, {
            kind: "scroll",
            startMs,
            durationMs: line.durationMs,
            fromPx: line.startPx,
            toPx: line.endPx,
            easing: line.startEasing,
            endEasing: line.endEasing,
            onEnd: () => endLineScroll(engine, scroll),
        });
    }
}
function claimLine(engine, lineElement) {
    const token = ++engine.lineScrollAnimationToken;
    engine.lineScrollElementTokens.set(lineElement, token);
    return token;
}
function ownsLine(engine, lineElement, token) {
    return engine.lineScrollElementTokens.get(lineElement) === token;
}
function releaseLine(engine, lineElement, token) {
    if (!ownsLine(engine, lineElement, token))
        return;
    clearScrollVariables(lineElement);
    engine.lineScrollElementTokens.delete(lineElement);
}
function endLineScroll(engine, scroll) {
    const index = engine.runningLineScrolls.indexOf(scroll);
    if (index !== -1)
        engine.runningLineScrolls.splice(index, 1);
    releaseLine(engine, scroll.lineElement, scroll.token);
}
export function clearLineScrolls(engine) {
    const scrolledElements = new Set(engine.runningLineScrolls.map(scroll => scroll.lineElement));
    for (const element of scrolledElements)
        removeElementCurves(engine, element, "scroll");
    for (const scroll of [...engine.runningLineScrolls])
        endLineScroll(engine, scroll);
}
export function isLineVisibleDuringScroll(line, fromScrollTop, toScrollTop, viewportHeight) {
    const visibleTop = Math.min(fromScrollTop, toScrollTop);
    const visibleBottom = Math.max(fromScrollTop, toScrollTop) + viewportHeight;
    return line.position + line.height >= visibleTop && line.position <= visibleBottom;
}
// Use relayout-time bounds; measuring here can force synchronous layout after tick style writes.
export function getLineScrollItems(engine, lines) {
    const trailing = [engine.cachedCreditsItem, engine.cachedFooterItem].filter(item => item !== null);
    return trailing.length > 0 ? [...lines, ...trailing] : lines;
}
export function measureTrailingItem(lyricsElement, className) {
    const element = lyricsElement.querySelector(`:scope > .${className}`);
    if (!element)
        return null;
    const bounds = getRelativeLayoutBounds(lyricsElement, element);
    return { lyricElement: element, position: bounds.y, height: bounds.height };
}
