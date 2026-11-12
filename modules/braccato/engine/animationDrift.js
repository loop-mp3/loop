import { clamp } from "../util.js";
import { largestDriftSample } from "./animationTiming.js";
import { resetLineAnimationState } from "./lineAnimationState.js";
import { logAnimationTiming, shouldLogAnimationTiming } from "./timingLogs.js";
const LEARN_RATE = 0.08;
const LEARN_SAMPLE_LIMIT_MS = 80;
const MAX_LEARNED_OFFSET_MS = 80;
const ACCUMULATION_DECAY = 1.08;
const ACCUMULATION_WEIGHT = 0.4;
const RESET_THRESHOLD_MS = 100;
export function correctLineDrift({ engine, line, lineIndex, lyricTimeS, isPlaying, now }) {
    const sample = largestDriftSample(line, lyricTimeS);
    line.accumulatedOffsetMs /= ACCUMULATION_DECAY;
    if (sample === null)
        return;
    if (!isUsableForDrift(sample, isPlaying)) {
        if (shouldLogAnimationTiming(engine, line, sample, now)) {
            logAnimationTiming(engine, "ignored-sample", line, lineIndex, sample, lyricTimeS, line.accumulatedOffsetMs);
        }
        return;
    }
    const learnedOffsetMs = learnTimingOffset(engine, sample);
    line.accumulatedOffsetMs += sample.offsetMs * ACCUMULATION_WEIGHT;
    if (shouldLogAnimationTiming(engine, line, sample, now)) {
        const accumulatedMs = line.accumulatedOffsetMs;
        logAnimationTiming(engine, "sample", line, lineIndex, sample, lyricTimeS, accumulatedMs, learnedOffsetMs);
    }
    const drifted = Math.abs(line.accumulatedOffsetMs) > RESET_THRESHOLD_MS;
    if (line.isAnimating && isPlaying && drifted) {
        logAnimationTiming(engine, "drift-reset", line, lineIndex, sample, lyricTimeS, line.accumulatedOffsetMs);
        resetLineAnimationState(line);
    }
}
function isUsableForDrift(sample, isPlaying) {
    return isPlaying && (sample.playState === "running" || sample.playState === "finished");
}
function learnTimingOffset(engine, sample) {
    if (Math.abs(sample.biasOffsetMs) > LEARN_SAMPLE_LIMIT_MS)
        return engine.learnedAnimationTimingOffsetMs;
    const learned = engine.learnedAnimationTimingOffsetMs;
    engine.learnedAnimationTimingOffsetMs = clamp(learned + (sample.biasOffsetMs - learned) * LEARN_RATE, -MAX_LEARNED_OFFSET_MS, MAX_LEARNED_OFFSET_MS);
    return engine.learnedAnimationTimingOffsetMs;
}
