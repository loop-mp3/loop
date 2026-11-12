import { ANIMATING_CLASS, LINE_SYNCED_WORD_CLASS, PAUSED_CLASS, WORD_STATE_ACTIVE, WORD_STATE_ATTR, WORD_STATE_PAST, WORD_STATE_UPCOMING, } from "../constants.js";
import { waveAnimationPools } from "./wavePool.js";
export function releasePart(part) {
    resetPartAnimations(part);
    togglePartClass(part, PAUSED_CLASS, false);
    togglePartClass(part, ANIMATING_CLASS, false);
    part.wordState = WORD_STATE_UPCOMING;
    part.lyricElement.setAttribute(WORD_STATE_ATTR, WORD_STATE_UPCOMING);
    part.highlightElement.setAttribute(WORD_STATE_ATTR, WORD_STATE_UPCOMING);
}
export function resetPartAnimations(part) {
    for (const animation of part.animations) {
        animation.cancel();
        const pool = waveAnimationPools.get(animation);
        if (pool)
            pool.push(animation);
    }
    part.animations = [];
}
function resetLineAnimations(lineData) {
    resetPartAnimations(lineData);
    for (const part of lineData.parts)
        resetPartAnimations(part);
}
export function hasLineAnimations(lineData) {
    return lineData.animations.length > 0 || lineData.parts.some(part => part.animations.length > 0);
}
export function markLineAnimationsStopped(lineData) {
    lineData.isAnimating = false;
    lineData.isAnimationPlayStatePlaying = false;
    lineData.accumulatedOffsetMs = 0;
}
export function resetLineAnimationState(lineData) {
    resetLineAnimations(lineData);
    markLineAnimationsStopped(lineData);
}
export function togglePartClass(part, className, force) {
    part.lyricElement.classList.toggle(className, force);
    if ("highlightElement" in part) {
        part.highlightElement.classList.toggle(className, force);
    }
}
export function setAnimationsPlayState(lineData, isPlaying) {
    const children = [lineData, ...lineData.parts];
    for (const part of children) {
        togglePartClass(part, PAUSED_CLASS, !isPlaying);
        for (const animation of part.animations) {
            if (isPlaying) {
                animation.play();
            }
            else {
                animation.pause();
            }
        }
    }
}
export function clearLineStateClasses(lineData) {
    lineData.lyricElement.classList.remove(ANIMATING_CLASS);
    for (const part of [lineData, ...lineData.parts]) {
        togglePartClass(part, PAUSED_CLASS, false);
    }
}
export function updateWordStates(lineData, currentTime) {
    const parts = lineData.parts;
    const lineEndTime = lineData.time + lineData.duration;
    const isLineSynced = parts.length > 0 && parts.every(part => part.lyricElement.classList.contains(LINE_SYNCED_WORD_CLASS));
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const endTime = isLineSynced
            ? lineEndTime
            : part.duration > 0 ? part.time + part.duration : (parts[i + 1]?.time ?? lineEndTime);
        let state = WORD_STATE_PAST;
        if (currentTime < lineData.time || (!isLineSynced && currentTime < part.time)) {
            state = WORD_STATE_UPCOMING;
        }
        else if (currentTime < endTime) {
            state = WORD_STATE_ACTIVE;
        }
        if (part.wordState === state)
            continue;
        part.wordState = state;
        part.lyricElement.setAttribute(WORD_STATE_ATTR, state);
        part.highlightElement.setAttribute(WORD_STATE_ATTR, state);
    }
}
