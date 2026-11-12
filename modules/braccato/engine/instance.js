import { NO_SCROLL_INSETS } from "./scrollViewport.js";
import { REDUCED_MOTION_QUERY } from "./motionPreference.js";
import { clearStyleCaches } from "./cssValues.js";
import { liveEngines } from "./liveViews.js";
import { stopPassiveScrollLoop } from "./passiveScroll.js";
import { cancelLyricPositionUpdate } from "./tick.js";
export function createAnimationEngineInstance(engineDocument, engineWindow, host, layout = "scroll") {
    const reducedMotionQuery = engineWindow.matchMedia(REDUCED_MOTION_QUERY);
    const handleReducedMotionChange = () => clearStyleCaches(engine);
    const engine = {
        document: engineDocument,
        window: engineWindow,
        host,
        lines: [],
        lyricsContainer: null,
        syncType: "none",
        lyricWidth: 0,
        lyricHeight: 0,
        skipScrolls: 0,
        skipScrollsDecayTimes: [],
        scrollResumeTime: 0,
        scrollPos: -1,
        selectedElementIndex: 0,
        wasUserScrolling: false,
        lastScrollElements: [],
        pinnedScrollLine: null,
        lastScrollDebugContext: {
            activeElms: [],
            centers: [],
            lyricScrollTime: 0,
        },
        passiveScrollAccumulatedTime: 0,
        passiveLastWallTime: 0,
        passiveScrollTop: null,
        cachedTabRendererHeight: null,
        cachedScrollInsets: NO_SCROLL_INSETS,
        cachedFooterItem: null,
        cachedCreditsItem: null,
        creditsFocused: false,
        cachedLineScrollTiming: new Map(),
        tabRendererResizeObserver: null,
        observedTabRenderer: null,
        runningLineScrolls: [],
        elementMotions: new Map(),
        easingTables: new Map(),
        lineScrollAnimationToken: 0,
        pendingLineScroll: null,
        lineScrollElementTokens: new WeakMap(),
        visibleWillChangeElements: new Set(),
        culledLineElements: new Set(),
        waveAnimationPool: [],
        lineCullObserver: null,
        cachedDurations: new Map(),
        cachedCSSValues: new Map(),
        cachedAnimationSettings: null,
        passiveScrollEnabled: false,
        lastTickOptions: null,
        playbackRate: 1,
        passiveRAFId: null,
        pendingLyricsUpdateFrame: null,
        learnedAnimationTimingOffsetMs: 0,
        animationTimingVisibilityLogUntil: 0,
        layout,
        stageKey: "",
        stageRemeasured: false,
        stageHeight: 0,
        stageBox: null,
        stageMetrics: new Map(),
        stageY: new Map(),
        stageMoves: new Map(),
        stageFades: new Map(),
        stageBlurs: new Map(),
        stageFontSize: 16,
        destroy: () => {
            liveEngines.delete(engine);
            reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
            engine.tabRendererResizeObserver?.disconnect();
            engine.tabRendererResizeObserver = null;
            engine.observedTabRenderer = null;
            engine.lineCullObserver?.disconnect();
            engine.lineCullObserver = null;
            stopPassiveScrollLoop(engine);
            cancelLyricPositionUpdate(engine);
        },
    };
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    liveEngines.add(engine);
    return engine;
}
