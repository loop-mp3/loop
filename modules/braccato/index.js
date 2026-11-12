// The index publishes the renderer, the leaves publish the standalone pieces. `constants.ts`,
// `text.ts`, `themeSettings.ts` and `util.ts` are the leaves: they import nothing, so a consumer
// that needs only a class name or a pure helper can take one without pulling the engine into its
// bundle.
//
// `createLyricsRenderer` is the way in. The four values beside it are what one instance cannot
// answer for on its own: the song level operations address every live view at once, and the
// injection helpers decorate lines that are already built.
export { resetPlaybackClock, resumeAllAutoscroll } from "./engine.js";
export { injectRomanization, injectTranslation } from "./inject.js";
export { createLyricsRenderer } from "./renderer.js";
