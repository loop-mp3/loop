import { registerThemeSetting } from "../themeSettings.js";
import { roundedMs } from "../util.js";
const TIMING_LOGS_ENABLED = registerThemeSetting("blyrics-debug-animation-timing", false);
const VISIBILITY_LOG_WINDOW_MS = 3000;
const PER_LINE_LOG_INTERVAL_MS = 750;
const LOGGED_OFFSET_THRESHOLD_MS = 30;
const lastLogTimes = new WeakMap();
export function shouldLogAnimationTiming(engine, line, sample, now) {
    if (!TIMING_LOGS_ENABLED.getBooleanValue())
        return false;
    const inVisibilityWindow = now < engine.animationTimingVisibilityLogUntil;
    if (!inVisibilityWindow && Math.abs(sample.offsetMs) < LOGGED_OFFSET_THRESHOLD_MS)
        return false;
    if (now - (lastLogTimes.get(line) ?? 0) < PER_LINE_LOG_INTERVAL_MS)
        return false;
    lastLogTimes.set(line, now);
    return true;
}
export function logAnimationTiming(engine, reason, line, lineIndex, sample, lyricTimeS, accumulatedOffsetMs, learnedOffsetMs = engine.learnedAnimationTimingOffsetMs) {
    if (!TIMING_LOGS_ENABLED.getBooleanValue())
        return;
    engine.host.log("WAAPI timing", {
        reason,
        lineIndex,
        lineTimeS: roundedSeconds(line.time),
        mediaTimeS: roundedSeconds(lyricTimeS),
        actualTimeMs: roundedMs(sample.actualTimeMs),
        expectedTimeMs: roundedMs(sample.expectedTimeMs),
        offsetMs: roundedMs(sample.offsetMs),
        learnedOffsetMs: roundedMs(learnedOffsetMs),
        appliedTimingOffsetMs: roundedMs(sample.appliedTimingOffsetMs),
        biasOffsetMs: roundedMs(sample.biasOffsetMs),
        residualOffsetMs: roundedMs(sample.offsetMs),
        accumulatedOffsetMs: roundedMs(accumulatedOffsetMs),
        playState: sample.playState,
        text: linePreview(line),
    });
}
export function logAnimationCleanup(engine, reason, line, lineIndex, lyricTimeS, staleAfterS) {
    if (!TIMING_LOGS_ENABLED.getBooleanValue())
        return;
    engine.host.log("Animation cleanup", {
        reason,
        lineIndex,
        lineTimeS: roundedSeconds(line.time),
        mediaTimeS: roundedSeconds(lyricTimeS),
        staleAnimationEndTimeS: roundedSeconds(staleAfterS),
        runningAnimationCount: countAnimations(line),
        text: linePreview(line),
    });
}
export function noteVisibilityChange(engine) {
    if (!TIMING_LOGS_ENABLED.getBooleanValue() || !engine.lyricsContainer)
        return;
    const visibilityState = engine.document.visibilityState;
    const runningAnimationCount = engine.lines.reduce((count, line) => count + countAnimations(line), 0);
    if (visibilityState !== "visible") {
        engine.host.log("Visibility changed; WAAPI animations left intact", {
            visibilityState,
            runningAnimationCount,
            resetSkipped: true,
        });
        return;
    }
    engine.animationTimingVisibilityLogUntil = Date.now() + VISIBILITY_LOG_WINDOW_MS;
    engine.host.log("Visibility changed; keeping WAAPI animations for timing verification", {
        visibilityState,
        runningAnimationCount,
        resetSkipped: true,
        timingLogWindowMs: VISIBILITY_LOG_WINDOW_MS,
    });
}
function countAnimations(line) {
    return line.parts.reduce((count, part) => count + part.animations.length, line.animations.length);
}
function roundedSeconds(timeS) {
    return roundedMs(timeS * 1000) / 1000;
}
function linePreview(line) {
    return line.lyricElement.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "";
}
