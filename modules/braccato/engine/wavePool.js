export const waveAnimationPools = new WeakMap();
const pooledWaveKeyframeSignatures = new WeakMap();
export function acquireWaveAnimation(engine, letterElement, keyframes, keyframeSignature, timing) {
    const pool = engine.waveAnimationPool;
    const pooled = pool[pool.length - 1];
    const effect = pooled?.effect;
    if (pooled && effect && typeof effect.setKeyframes === "function") {
        pool.pop();
        effect.target = letterElement;
        if (pooledWaveKeyframeSignatures.get(pooled) !== keyframeSignature) {
            effect.setKeyframes(keyframes);
            pooledWaveKeyframeSignatures.set(pooled, keyframeSignature);
        }
        effect.updateTiming(timing);
        pooled.play();
        return pooled;
    }
    const animation = letterElement.animate(keyframes, timing);
    waveAnimationPools.set(animation, pool);
    pooledWaveKeyframeSignatures.set(animation, keyframeSignature);
    return animation;
}
