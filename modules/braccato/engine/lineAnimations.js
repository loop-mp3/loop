import { correctedAnimationTimeMs, followSongClock } from "./animationTiming.js";
import { placeContextSweeps } from "./contextSweep.js";
import { suppressInvisibleWordGlows } from "./glow.js";
import { startInstrumentalAnimations, startInstrumentalExitAnimations } from "./instrumentalAnimations.js";
import { resetPartAnimations } from "./lineAnimationState.js";
import { startWordAnimations, startWordExitAnimation } from "./wordAnimations.js";
export function startLineAnimations(engine, line, config, lyricTimeS) {
    const appliedTimingOffsetMs = engine.learnedAnimationTimingOffsetMs;
    if (!isInstrumental(line))
        placeContextSweeps(line, config);
    startLineEntrance(engine, line, config, lyricTimeS, appliedTimingOffsetMs);
    if (isInstrumental(line)) {
        startInstrumentalAnimations(engine, line, config, lyricTimeS, appliedTimingOffsetMs);
        return;
    }
    suppressInvisibleWordGlows(engine, line, config);
    for (const part of line.parts)
        startWordAnimations(engine, part, config, lyricTimeS, appliedTimingOffsetMs);
}
export function startLineExitAnimations(line, config, lyricTimeS) {
    startLineExit(line, config);
    if (isInstrumental(line)) {
        startInstrumentalExitAnimations(line, config, lyricTimeS);
        return;
    }
    for (const part of line.parts) {
        if (lyricTimeS >= part.time)
            startWordExitAnimation(part, config);
        else
            resetPartAnimations(part);
    }
}
function isInstrumental(line) {
    return line.lyricElement.dataset.instrumental === "true";
}
function startLineEntrance(engine, line, config, lyricTimeS, appliedTimingOffsetMs) {
    resetPartAnimations(line);
    if (!config.enabled.lineScale)
        return;
    const { enterFrom, enterTo, enterEasing, durationMs } = config.line;
    const entrance = line.lyricElement.animate([{ transform: enterFrom }, { transform: enterTo }], {
        duration: durationMs,
        easing: enterEasing,
        fill: "forwards",
    });
    followSongClock(engine, entrance, { appliedTimingOffsetMs, offsetMs: 0 });
    const elapsedMs = (lyricTimeS - line.time) * 1000;
    entrance.currentTime = correctedAnimationTimeMs(elapsedMs, appliedTimingOffsetMs, durationMs);
    line.animations = [entrance];
}
function startLineExit(line, config) {
    resetPartAnimations(line);
    if (!config.enabled.lineScale)
        return;
    const { exitFrom, exitTo, exitEasing, durationMs } = config.line;
    const exit = line.lyricElement.animate([{ transform: exitFrom }, { transform: exitTo }], {
        duration: durationMs,
        easing: exitEasing,
        fill: "none",
    });
    line.animations = [exit];
    exit.addEventListener("finish", () => resetPartAnimations(line), { once: true });
}
