import { ANIMATING_CLASS } from "../constants.js";
import { correctLineDrift } from "./animationDrift.js";
import { startLineAnimations, startLineExitAnimations } from "./lineAnimations.js";
import { clearLineStateClasses, hasLineAnimations, markLineAnimationsStopped, resetLineAnimationState, setAnimationsPlayState, updateWordStates, } from "./lineAnimationState.js";
import { logAnimationCleanup } from "./timingLogs.js";
const ANIMATION_PREPARE_AHEAD_S = 2;
const LINE_END_GRACE_S = 0.05;
const STALE_ANIMATION_GRACE_S = 0.05;
export function driveLineAnimations(tick) {
    const { engine, lyricTimeS, playhead } = tick;
    const lines = engine.lines;
    const prepareAheadS = playhead.isPlaying ? ANIMATION_PREPARE_AHEAD_S : 0;
    const linesToStart = [];
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const nextLineStartS = lines[index + 1]?.time ?? Infinity;
        const animationEndS = Math.max(nextLineStartS, line.time + line.duration + LINE_END_GRACE_S);
        if (lyricTimeS + prepareAheadS >= line.time && lyricTimeS < animationEndS) {
            updateLineAnimationState(tick, line, index);
            if (!line.isAnimating)
                linesToStart.push(line);
        }
        else {
            retireLine(tick, line, index, animationEndS);
        }
    }
    for (const line of linesToStart)
        startLine(tick, line);
}
function updateLineAnimationState(tick, line, index) {
    const { lyricTimeS, playhead } = tick;
    if (!line.isSelected) {
        line.isSelected = true;
        line.lyricElement.classList.add(ANIMATING_CLASS);
    }
    if (line.isAnimationPlayStatePlaying !== playhead.isPlaying) {
        line.isAnimationPlayStatePlaying = playhead.isPlaying;
        setAnimationsPlayState(line, playhead.isPlaying);
        if (playhead.isPlaying)
            line.isAnimating = false;
    }
    const playbackDiscontinuity = (playhead.jumped && playhead.isPlaying) || playhead.mediaClockRanBackwards || playhead.seekedWhilePaused;
    if (playbackDiscontinuity && line.isAnimating)
        resetLineAnimationState(line);
    updateWordStates(line, lyricTimeS);
    correctLineDrift({
        engine: tick.engine,
        line,
        lineIndex: index,
        lyricTimeS,
        isPlaying: playhead.isPlaying,
        now: tick.now,
    });
}
function retireLine({ engine, lyricTimeS, playhead, config }, line, index, animationEndS) {
    const staleAfterS = animationEndS + config.highlight.fadeOutDurationMs / 1000 + STALE_ANIMATION_GRACE_S;
    const isStale = lyricTimeS > staleAfterS;
    const wasSelected = line.isSelected;
    if (wasSelected) {
        if (playhead.isPlaying || playhead.jumped || playhead.seekedWhilePaused) {
            if (isStale) {
                logAnimationCleanup(engine, "selected-stale-reset", line, index, lyricTimeS, staleAfterS);
                resetLineAnimationState(line);
            }
            else {
                startLineExitAnimations(line, config, lyricTimeS);
                markLineAnimationsStopped(line);
            }
        }
        else {
            setAnimationsPlayState(line, false);
            line.isAnimationPlayStatePlaying = false;
        }
        line.isSelected = false;
        clearLineStateClasses(line);
    }
    else if (hasLineAnimations(line) && (playhead.jumped || isStale)) {
        logAnimationCleanup(engine, playhead.jumped ? "time-jump-reset" : "stale-reset", line, index, lyricTimeS, staleAfterS);
        resetLineAnimationState(line);
    }
    if (wasSelected || playhead.jumped)
        updateWordStates(line, lyricTimeS);
}
function startLine({ engine, lyricTimeS, playhead, config, now }, line) {
    startLineAnimations(engine, line, config, lyricTimeS);
    line.isAnimating = true;
    line.lastAnimSetupAt = now;
    line.isAnimationPlayStatePlaying = playhead.isPlaying;
    line.accumulatedOffsetMs = 0;
    if (!playhead.isPlaying)
        setAnimationsPlayState(line, false);
}
