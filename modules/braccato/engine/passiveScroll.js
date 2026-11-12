import { USER_SCROLLING_CLASS } from "../constants.js";
import { registerThemeSetting } from "../themeSettings.js";
import { playbackClock } from "./clock.js";
const PASSIVE_SCROLL_ENABLED = registerThemeSetting("blyrics-passive-scroll-enabled", true);
const SECONDS_PER_LINE = registerThemeSetting("blyrics-passive-scroll-seconds-per-line", 3.5);
const BOTTOM_PAUSE_S = registerThemeSetting("blyrics-passive-scroll-bottom-pause-s", 1.5);
const RESET_DURATION_S = registerThemeSetting("blyrics-passive-scroll-reset-duration-s", 0.6);
const TOP_PAUSE_S = registerThemeSetting("blyrics-passive-scroll-top-pause-s", 0.8);
const MAX_FRAME_STEP_S = 0.5;
const DRIFT_SCROLL_TOLERANCE_PX = 1;
export function hasNoLyricsPlaceholder(engine) {
    return engine.lyricsContainer?.dataset.noLyrics === "true";
}
export function hasUnsyncedLyrics(engine) {
    return engine.lyricsContainer !== null && engine.syncType === "none" && !hasNoLyricsPlaceholder(engine);
}
export function startPassiveScrollLoop(engine) {
    if (engine.passiveRAFId !== null)
        return;
    engine.passiveRAFId = engine.window.requestAnimationFrame(() => passiveScrollFrame(engine));
}
export function stopPassiveScrollLoop(engine) {
    if (engine.passiveRAFId === null)
        return;
    engine.window.cancelAnimationFrame(engine.passiveRAFId);
    engine.passiveRAFId = null;
}
function passiveScrollFrame(engine) {
    engine.passiveRAFId = null;
    if (!engine.passiveScrollEnabled || !PASSIVE_SCROLL_ENABLED.getBooleanValue() || !hasUnsyncedLyrics(engine))
        return;
    advancePassiveScroll(engine, playbackClock.lastPlayState);
    engine.passiveRAFId = engine.window.requestAnimationFrame(() => passiveScrollFrame(engine));
}
function advancePassiveScroll(engine, isPlaying) {
    if (!engine.host.isViewVisible() || engine.host.isLoaderActive())
        return;
    const scroller = engine.host.getScrollElement();
    if (!scroller)
        return;
    const now = Date.now();
    if (engine.passiveLastWallTime > 0 && isPlaying) {
        engine.passiveScrollAccumulatedTime += Math.min((now - engine.passiveLastWallTime) / 1000, MAX_FRAME_STEP_S);
    }
    engine.passiveLastWallTime = now;
    if (engine.scrollResumeTime > now)
        return;
    if (engine.wasUserScrolling)
        resumeFromUserScroll(engine, scroller);
    const scrollDurationS = engine.lines.length * SECONDS_PER_LINE.getNumberValue();
    const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
    if (engine.lines.length === 0 || maxScrollTop <= 0)
        return;
    const scrollTop = passiveCycleScrollTop(engine.passiveScrollAccumulatedTime, scrollDurationS, maxScrollTop);
    scroller.scrollTop = scrollTop;
    engine.passiveScrollTop = scroller.scrollTop;
}
/**
 * The drift writes the scroll every frame, and a browser folds that scroll and the reader's into one
 * event, so the drift's own scrolls are told apart by where they land rather than by counting them.
 */
export function isPassiveDriftScroll(engine) {
    const scrollTop = engine.host.getScrollElement()?.scrollTop;
    return (engine.passiveScrollTop !== null &&
        scrollTop !== undefined &&
        Math.abs(scrollTop - engine.passiveScrollTop) < DRIFT_SCROLL_TOLERANCE_PX);
}
function resumeFromUserScroll(engine, scroller) {
    engine.host.setResumeAffordanceVisible(false);
    engine.lyricsContainer?.classList.remove(USER_SCROLLING_CLASS);
    engine.wasUserScrolling = false;
    const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
    if (maxScrollTop <= 0)
        return;
    const scrollDurationS = engine.lines.length * SECONDS_PER_LINE.getNumberValue();
    engine.passiveScrollAccumulatedTime = (scroller.scrollTop / maxScrollTop) * scrollDurationS;
}
function passiveCycleScrollTop(playedS, scrollDurationS, maxScrollTop) {
    const reachesBottomS = scrollDurationS;
    const leavesBottomS = reachesBottomS + BOTTOM_PAUSE_S.getNumberValue();
    const resetDurationS = RESET_DURATION_S.getNumberValue();
    const reachesTopS = leavesBottomS + resetDurationS;
    const cycleS = playedS % (reachesTopS + TOP_PAUSE_S.getNumberValue());
    if (cycleS < reachesBottomS)
        return (cycleS / scrollDurationS) * maxScrollTop;
    if (cycleS < leavesBottomS)
        return maxScrollTop;
    if (cycleS < reachesTopS) {
        const remaining = 1 - (cycleS - leavesBottomS) / resetDurationS;
        return maxScrollTop * remaining * remaining;
    }
    return 0;
}
