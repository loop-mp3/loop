// These names are a public contract: marketplace themes select on them and set properties through
// them, so renaming one is a breaking change for every published theme, not a refactor.
// -- Structure --------------------------------------------
export const LYRICS_WRAPPER_ID = "blyrics-wrapper";
export const LYRICS_CLASS = "blyrics-container";
export const LINE_CLASS = "blyrics--line";
export const WORD_CLASS = "blyrics--word";
export const LETTER_CLASS = "blyrics--letter";
export const FOOTER_CLASS = "blyrics-footer";
export const CREDITS_CLASS = "blyrics-credits";
export const CREDITS_TEXT_CLASS = "blyrics-credits__text";
export const CREDITS_NAMES_CLASS = "blyrics-credits__names";
// -- Playback state --------------------------------------------
export const CURRENT_LYRICS_CLASS = "blyrics--active";
export const ANIMATING_CLASS = "blyrics--animating";
export const PAUSED_CLASS = "blyrics--paused";
export const ZERO_DURATION_ANIMATION_CLASS = "blyrics-zero-dur-animate";
export const USER_SCROLLING_CLASS = "blyrics-user-scrolling";
export const WORD_STATE_ATTR = "data-word-state";
export const WORD_STATE_UPCOMING = "upcoming";
export const WORD_STATE_ACTIVE = "active";
export const WORD_STATE_PAST = "past";
// -- Line and word variants --------------------------------------------
export const BACKGROUND_LYRIC_CLASS = "blyrics-background-lyric";
export const EXPLICIT_WORD_CLASS = "blyrics-explicit";
export const RTL_CLASS = "blyrics-rtl";
export const TRANSLATED_LYRICS_CLASS = "blyrics--translated";
export const ROMANIZED_LYRICS_CLASS = "blyrics--romanized";
// -- Line internals --------------------------------------------
export const CONTENT_LINE_CLASS = "blyrics-content-line";
export const LINE_MAIN_CLASS = "blyrics-line-main";
export const BACKGROUND_LINE_CLASS = "blyrics-background-line";
export const WORD_GROUP_CLASS = "blyrics-word-group";
export const LONG_WORD_GROUP_CLASS = "blyrics-word-group-long";
export const WORD_HIGHLIGHT_CLASS = "blyrics-word-highlight";
export const WORD_HIGHLIGHT_LETTERED_CLASS = "blyrics-word-highlight--lettered";
export const HIGHLIGHT_RUN_CLASS = "blyrics-highlight-run";
export const LINE_SYNCED_WORD_CLASS = "blyrics-line-synced-word";
export const BIDI_RUN_CLASS = "blyrics-bidi-run";
export const BIDI_SENSITIVE_CLASS = "blyrics-bidi-sensitive";
// -- Theme --------------------------------------------
// The element a theme handed to `setTheme` is applied through, one per document a renderer builds
// in. Named rather than anonymous because a consumer with a second document to style has to be able
// to find the first one: this extension's floating window mirrors the side panel's by id.
//
// One renderer per document owns it. Two renderers in one document render against one theme
// whatever they are given, because the settings registry is module scope, so this is a constraint
// stated rather than a configuration supported. A renderer that finds the id already in its
// document writes into that element rather than adding a rival, so the id stays unique and a
// consumer reading it by id gets the sheet in force, and `destroy` takes the element away only if
// this renderer is what put it there.
export const CUSTOM_THEME_STYLE_ID = "blyrics-custom-style";
