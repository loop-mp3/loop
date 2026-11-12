export const liveEngines = new Set();
export function forEveryLiveView(runOperation) {
    for (const engine of liveEngines)
        runOperation(engine);
}
