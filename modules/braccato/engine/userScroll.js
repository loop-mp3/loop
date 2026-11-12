import { USER_SCROLLING_CLASS } from "../constants.js";
import { dropPendingLineScroll } from "./lineScroll.js";
import { forEveryLiveView } from "./liveViews.js";
import { isPassiveDriftScroll } from "./passiveScroll.js";
const PAUSING_LYRICS_SCROLL_LOG = "Pausing Lyrics Autoscroll Due to User Scroll";
const USER_SCROLL_RESUME_DELAY_MS = 25000;
const UNSYNCED_USER_SCROLL_RESUME_DELAY_MS = 5000;
const ENGINE_SCROLL_EVENT_WINDOW_MS = 2000;
export function resetScrollResume(engine) {
    engine.scrollResumeTime = 0;
}
/**
 * Resume autoscroll immediately for every live view.
 */
export function resumeAllAutoscroll() {
    forEveryLiveView(resetScrollResume);
}
export function noteUserScroll(engine, lyricsAreUnsynced) {
    if (lyricsAreUnsynced) {
        if (isPassiveDriftScroll(engine))
            return;
    }
    else if (engine.skipScrolls > 0) {
        engine.skipScrolls--;
        engine.skipScrollsDecayTimes.shift();
        return;
    }
    dropPendingLineScroll(engine);
    if (engine.host.isLoaderActive())
        return;
    const now = Date.now();
    if (engine.scrollResumeTime < now)
        engine.host.log(PAUSING_LYRICS_SCROLL_LOG);
    engine.scrollResumeTime =
        now + (lyricsAreUnsynced ? UNSYNCED_USER_SCROLL_RESUME_DELAY_MS : USER_SCROLL_RESUME_DELAY_MS);
    engine.wasUserScrolling = true;
    engine.host.setResumeAffordanceVisible(true);
    engine.lyricsContainer?.classList.add(USER_SCROLLING_CLASS);
}
export function hasContainerResized(engine, width, height) {
    return width !== engine.lyricWidth || height !== engine.lyricHeight;
}
export function writeEngineScrollTop(engine, scroller, scrollTop, now) {
    engine.scrollPos = scrollTop;
    const scrollTopBeforeWrite = scroller.scrollTop;
    scroller.scrollTop = scrollTop;
    if (scroller.scrollTop !== scrollTopBeforeWrite)
        noteEngineScrollEvent(engine, now);
}
export function noteEngineScrollEvent(engine, now) {
    engine.skipScrolls += 1;
    engine.skipScrollsDecayTimes.push(now + ENGINE_SCROLL_EVENT_WINDOW_MS);
}
export function requestRescroll(engine) {
    engine.wasUserScrolling = true;
}
export function decaySkipScrolls(engine, now, keepsReserve) {
    const firstLive = engine.skipScrollsDecayTimes.findIndex(time => time > now);
    const expiredCount = firstLive === -1 ? engine.skipScrollsDecayTimes.length : firstLive;
    engine.skipScrollsDecayTimes = engine.skipScrollsDecayTimes.slice(expiredCount);
    engine.skipScrolls = Math.max(keepsReserve ? 1 : 0, engine.skipScrolls - expiredCount);
}
