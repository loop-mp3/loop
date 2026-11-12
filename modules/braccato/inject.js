// Builds what goes inside a lyric line: the main and background content lines, the bidi runs inside
// them, the word groups and the timed word spans the sweep animates, and the two decorators that
// hang a translation or a romanization off a line that is already built. `view.ts` builds the line
// and the container around it.
//
// The structure emitted here is as much published contract as the names written into it.
// `constants.ts` says why a class name cannot be renamed; the nesting is under the same rule,
// because a marketplace theme selects on the shape as well as on the names.
//
// A part is not a word. Providers hand over parts that run to several words, and the unit the sweep
// animates is one word, so every part is split on whitespace with its timing pro-rated across the
// split by character count. A line that arrives with no timed parts at all is rebuilt the same way
// into zero duration words, so line synced lyrics reach the DOM the sweep already knows.
import { releasePart } from "./engine/lineAnimationState.js";
import { normalizeLanguage } from "./language.js";
import { BACKGROUND_LINE_CLASS, BACKGROUND_LYRIC_CLASS, BIDI_RUN_CLASS, BIDI_SENSITIVE_CLASS, CONTENT_LINE_CLASS, EXPLICIT_WORD_CLASS, HIGHLIGHT_RUN_CLASS, LETTER_CLASS, LINE_MAIN_CLASS, LINE_SYNCED_WORD_CLASS, LONG_WORD_GROUP_CLASS, ROMANIZED_LYRICS_CLASS, RTL_CLASS, SWEEP_CELL_CLASS, SWEEP_GLOW_CLASS, SWEEP_MASK_CLASS, SWEEP_TEXT_CLASS, TRANSLATED_LYRICS_CLASS, WORD_CLASS, WORD_GROUP_CLASS, WORD_HIGHLIGHT_CLASS, WORD_HIGHLIGHT_CONTEXT_CLASS, WORD_HIGHLIGHT_LETTERED_CLASS, WORD_HIGHLIGHT_SWEEP_CLASS, WORD_STATE_ATTR, WORD_STATE_UPCOMING, ZERO_DURATION_ANIMATION_CLASS, } from "./constants.js";
import { letterClusters } from "./letters.js";
import { getSeekTimeFromClick } from "./seek.js";
import { isSameText, testJoiningScript, testRtl } from "./text.js";
import { registerThemeSetting } from "./themeSettings.js";
export let disableRichsync = registerThemeSetting("blyrics-disable-richsync", false, true);
let longWordThreshold = registerThemeSetting("blyrics-long-word-threshold", 1500, true);
let longWordWrapThreshold = registerThemeSetting("blyrics-long-word-wrap-threshold", 10, true);
let letterWave = registerThemeSetting("blyrics-letter-wave", true, true);
export const hideCredits = registerThemeSetting("blyrics-hide-credits", false, true);
const LTR_SCRIPT_REGEX = /[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const SPACE_REGEX = /^\s+$/u;
export function findNearestAgent(lyrics, fromIndex) {
    // Look in the downwards direction first
    for (let i = fromIndex + 1; i < lyrics.length; i++) {
        if (!lyrics[i].isInstrumental && lyrics[i].agent) {
            return lyrics[i].agent;
        }
    }
    for (let i = fromIndex - 1; i >= 0; i--) {
        if (!lyrics[i].isInstrumental && lyrics[i].agent) {
            return lyrics[i].agent;
        }
    }
    return undefined;
}
export function isNearestLyricRtl(lyrics, fromIndex) {
    // Look in the downwards direction first
    for (let i = fromIndex + 1; i < lyrics.length; i++) {
        if (!lyrics[i].isInstrumental && lyrics[i].words?.trim()) {
            return testRtl(lyrics[i].words);
        }
    }
    for (let i = fromIndex - 1; i >= 0; i--) {
        if (!lyrics[i].isInstrumental && lyrics[i].words?.trim()) {
            return testRtl(lyrics[i].words);
        }
    }
    return false;
}
// -- Lyric shape --------------------------------------------
// A line whose parts are missing, empty or overridden by the theme is rebuilt as line synced words,
// which carry no duration, so only pre-existing timed parts count as rich sync.
export function deriveSyncType(lyrics) {
    const hasTimedParts = !disableRichsync.getBooleanValue() &&
        lyrics.some(item => !item.isInstrumental && item.parts?.some(part => part.durationMs !== 0) === true);
    if (hasTimedParts)
        return "richsync";
    return lyrics.every(item => item.startTimeMs === 0) ? "none" : "synced";
}
function newPartData(part, span, highlight, wobbleElements, letterElements, highlightLetterElements, sweep) {
    return {
        time: part.startTimeMs / 1000,
        duration: part.durationMs / 1000,
        lyricElement: span,
        highlightElement: highlight,
        sweep,
        sweepContext: highlight.classList.contains(WORD_HIGHLIGHT_CONTEXT_CLASS) ? {} : undefined,
        letterElements,
        highlightLetterElements,
        wobbleElements,
        animations: [],
        wordState: WORD_STATE_UPCOMING,
    };
}
export function newLineData(lyricElement, startTimeMs, durationMs) {
    return {
        lyricElement,
        time: startTimeMs / 1000,
        duration: durationMs / 1000,
        parts: [],
        isScrolled: false,
        isAnimationPlayStatePlaying: false,
        accumulatedOffsetMs: 0,
        isAnimating: false,
        lastAnimSetupAt: 0,
        isSelected: false,
        height: -1,
        position: -1,
        decorations: new Map(),
        animations: [],
    };
}
function detectDirection(text) {
    for (const char of text) {
        if (testRtl(char))
            return "rtl";
        if (LTR_SCRIPT_REGEX.test(char))
            return "ltr";
    }
    return "auto";
}
export function applyDirection(element, text) {
    const direction = detectDirection(text);
    element.dir = "auto";
    if (direction === "rtl") {
        element.classList.add(RTL_CLASS);
        element.dataset.direction = "rtl";
    }
    else if (direction === "ltr") {
        element.dataset.direction = "ltr";
    }
}
function applyBidiSensitivity(element, text) {
    if (testRtl(text)) {
        element.classList.add(BIDI_SENSITIVE_CLASS);
    }
}
function splitPartIntoTokens(part) {
    const chunks = part.words.match(/\s+|\S+/gu) ?? [];
    if (chunks.length === 0)
        return [];
    const tokens = [];
    let spaceChars = 0;
    for (const chunk of chunks) {
        if (SPACE_REGEX.test(chunk)) {
            tokens.push({ kind: "space", text: chunk });
            spaceChars += chunk.length;
            continue;
        }
        tokens.push({
            kind: "part",
            text: chunk,
            part: {
                words: chunk,
                isBackground: part.isBackground,
                backgroundGroup: part.backgroundGroup,
                explicit: part.explicit,
            },
        });
    }
    const nonWhiteSpaceChars = part.words.length - spaceChars;
    let cursor = 0;
    return tokens.map(t => {
        if (t.kind === "part") {
            const startTimeMs = part.startTimeMs + Math.round((part.durationMs * cursor) / nonWhiteSpaceChars);
            const endTimeMs = part.startTimeMs + Math.round((part.durationMs * (cursor + t.text.length)) / nonWhiteSpaceChars);
            cursor += t.text.length;
            return {
                ...t,
                part: {
                    ...t.part,
                    startTimeMs,
                    durationMs: endTimeMs - startTimeMs,
                },
            };
        }
        return t;
    });
}
function normalizeParts(parts) {
    return parts.flatMap(splitPartIntoTokens);
}
function groupTokensByWord(tokens, splitBackgroundGroups) {
    const groups = [];
    let current = null;
    const flush = () => {
        if (current && current.tokens.length > 0) {
            groups.push(current);
        }
        current = null;
    };
    for (const token of tokens) {
        if (token.kind === "space") {
            flush();
            groups.push(token);
            continue;
        }
        const isBackground = token.part?.isBackground === true;
        const backgroundGroup = splitBackgroundGroups ? token.part?.backgroundGroup : undefined;
        if (!current || current.isBackground !== isBackground || current.backgroundGroup !== backgroundGroup) {
            flush();
            current = { text: "", isBackground, backgroundGroup, tokens: [] };
        }
        current.text += token.text;
        current.tokens.push(token);
    }
    flush();
    return groups;
}
function appendLongWordBreaks(doc, span, clusters, threshold) {
    if (clusters.length <= threshold) {
        span.textContent = clusters.join("");
        return false;
    }
    for (let i = 0; i < clusters.length; i += threshold) {
        span.appendChild(doc.createTextNode(clusters.slice(i, i + threshold).join("")));
        if (i + threshold < clusters.length) {
            span.appendChild(doc.createElement("wbr"));
        }
    }
    return true;
}
function appendLetters(doc, wordElement, chars) {
    wordElement.style.setProperty("--letters", String(chars.length));
    return chars.map(char => {
        const letter = doc.createElement("span");
        letter.classList.add(LETTER_CLASS);
        letter.textContent = char;
        wordElement.appendChild(letter);
        return letter;
    });
}
function fillWordText(doc, host, clusters, wrapThreshold, perLetter, preserveJoining) {
    if (perLetter)
        return appendLetters(doc, host, clusters);
    if (preserveJoining)
        host.textContent = clusters.join("");
    else
        appendLongWordBreaks(doc, host, clusters, wrapThreshold);
    return undefined;
}
const SWEEP_GLOW_RADII = ["wide", "tight"];
export function createSweepCell(doc, host, fill) {
    const mask = doc.createElement("span");
    mask.classList.add(SWEEP_MASK_CLASS);
    const text = doc.createElement("span");
    text.classList.add(SWEEP_TEXT_CLASS);
    mask.appendChild(text);
    const letters = fill(text);
    const glows = SWEEP_GLOW_RADII.map(radius => {
        const glow = doc.createElement("span");
        glow.classList.add(SWEEP_GLOW_CLASS, `${SWEEP_GLOW_CLASS}--${radius}`);
        const glowLetters = fill(glow);
        text.appendChild(glow);
        return { glow, letters: glowLetters };
    });
    host.classList.add(SWEEP_CELL_CLASS);
    host.appendChild(mask);
    return { mask, text, letters, glows };
}
/** Makes each letter of a word that flows inline its own sweep cell, holding the letter's text. */
function createLetterSweepCells(doc, letters) {
    return letters.map(letter => {
        const text = letter.textContent ?? "";
        letter.textContent = "";
        return createSweepCell(doc, letter, into => {
            into.appendChild(doc.createTextNode(text));
            return undefined;
        });
    });
}
function createTimedWordSpan(doc, part, wrapThreshold, perLetter, preserveJoining, atomic) {
    const span = doc.createElement("span");
    const highlight = doc.createElement("span");
    highlight.classList.add(WORD_HIGHLIGHT_CLASS);
    let sweep;
    let letters;
    let highlightLetters;
    const clusters = perLetter || (!preserveJoining && part.words.length > wrapThreshold) ? letterClusters(part.words) : [part.words];
    for (const wordElement of [span, highlight]) {
        wordElement.classList.add(WORD_CLASS);
        wordElement.dir = "auto";
        if (part.durationMs === 0) {
            wordElement.classList.add(ZERO_DURATION_ANIMATION_CLASS);
            wordElement.classList.add(LINE_SYNCED_WORD_CLASS);
        }
        if (testRtl(part.words))
            wordElement.classList.add(RTL_CLASS);
        if (part.durationMs > longWordThreshold.getNumberValue())
            wordElement.dataset.longWord = "true";
        if (part.isBackground)
            wordElement.classList.add(BACKGROUND_LYRIC_CLASS);
        if (part.explicit)
            wordElement.classList.add(EXPLICIT_WORD_CLASS);
        if (perLetter) {
            wordElement.classList.add("blyrics-word--lettered");
            if (wordElement === highlight)
                wordElement.classList.add(WORD_HIGHLIGHT_LETTERED_CLASS);
        }
        if (wordElement === highlight && atomic) {
            const cell = createSweepCell(doc, highlight, into => fillWordText(doc, into, clusters, wrapThreshold, perLetter, preserveJoining));
            sweep = [cell];
            highlightLetters = cell.letters;
        }
        else {
            const collected = fillWordText(doc, wordElement, clusters, wrapThreshold, perLetter, preserveJoining);
            if (wordElement === span)
                letters = collected;
            else
                highlightLetters = collected;
            if (wordElement === highlight && collected)
                sweep = createLetterSweepCells(doc, collected);
        }
        if (wordElement === highlight && sweep)
            highlight.classList.add(WORD_HIGHLIGHT_SWEEP_CLASS);
        else if (wordElement === highlight)
            highlight.classList.add(WORD_HIGHLIGHT_CONTEXT_CLASS);
        wordElement.dataset.time = String(part.startTimeMs / 1000);
        wordElement.dataset.duration = String(part.durationMs / 1000);
        wordElement.dataset.content = part.words;
        wordElement.setAttribute(WORD_STATE_ATTR, WORD_STATE_UPCOMING);
        wordElement.style.setProperty("--blyrics-duration", part.durationMs + "ms");
    }
    return { span, highlight, letters, highlightLetters, sweep };
}
function createWordGroup(doc, group, lineData, wordsFlowInline) {
    const wrapThreshold = Math.max(1, longWordWrapThreshold.getNumberValue());
    // Atomic grapheme spans disrupt the browser's bidi ordering inside a mixed word.
    const mixedDirection = testRtl(group.text) && [...group.text].some(char => /[\p{Letter}\p{Number}]/u.test(char) && !testRtl(char));
    const preserveJoining = testJoiningScript(group.text);
    const perLetter = letterWave.getBooleanValue() && !preserveJoining && !mixedDirection;
    const isLongGroup = group.text.length > wrapThreshold * 2 && letterClusters(group.text).length > wrapThreshold * 2;
    const lyricGroup = doc.createElement("span");
    const highlightGroup = doc.createElement("span");
    // A word that is its own inline-block box can hold the sweep's block layers. Long groups and
    // bidi-sensitive rows lay their words out inline, where a word can break across lines.
    const atomic = !wordsFlowInline && !isLongGroup;
    for (const groupElement of [lyricGroup, highlightGroup]) {
        groupElement.classList.add(WORD_GROUP_CLASS);
        groupElement.dir = "auto";
        groupElement.dataset.content = group.text;
        if (isLongGroup) {
            groupElement.classList.add(LONG_WORD_GROUP_CLASS);
        }
        if (group.isBackground) {
            groupElement.classList.add(BACKGROUND_LYRIC_CLASS);
        }
    }
    for (const token of group.tokens) {
        if (token.kind === "space")
            continue;
        const { span, highlight, letters, highlightLetters, sweep } = createTimedWordSpan(doc, token.part, wrapThreshold, perLetter, preserveJoining, atomic);
        const wobbleElements = lyricGroup.childNodes.length === 0 ? [lyricGroup, highlightGroup] : [];
        lineData.parts.push(newPartData(token.part, span, highlight, wobbleElements, letters, highlightLetters, sweep));
        lyricGroup.appendChild(span);
        highlightGroup.appendChild(highlight);
    }
    return { lyricGroup, highlightGroup };
}
function createContentLine(doc, className, text) {
    const line = doc.createElement("div");
    line.classList.add(className);
    applyDirection(line, text);
    applyBidiSensitivity(line, text);
    return line;
}
function createBidiRun(doc, text) {
    const run = doc.createElement("span");
    run.classList.add(BIDI_RUN_CLASS);
    applyDirection(run, text);
    return run;
}
function createHighlightRun(doc, text) {
    const run = createBidiRun(doc, text);
    run.classList.add(HIGHLIGHT_RUN_CLASS);
    run.setAttribute("aria-hidden", "true");
    return run;
}
// A background gap must carry the background size too, or it renders full-size and the gap looks oversized.
function createSpaceNode(doc, text, isBackground) {
    if (!isBackground)
        return doc.createTextNode(text);
    const span = doc.createElement("span");
    span.classList.add(BACKGROUND_LYRIC_CLASS);
    span.textContent = text;
    return span;
}
export function createLyricsLine(doc, parts, line, lyricElement, options = { splitBackgroundLine: true }) {
    const lineText = parts.map(part => part.words).join("");
    const mainText = options.splitBackgroundLine
        ? parts
            .filter(part => part.isBackground !== true)
            .map(part => part.words)
            .join("")
        : lineText;
    const backgroundTextOf = (group) => parts
        .filter(part => part.isBackground === true && (part.backgroundGroup ?? 0) === group)
        .map(part => part.words)
        .join("");
    const main = createContentLine(doc, LINE_MAIN_CLASS, mainText);
    const mainRun = createBidiRun(doc, mainText);
    const mainHighlightRun = createHighlightRun(doc, mainText);
    const groupedTokens = groupTokensByWord(normalizeParts(parts), options.splitBackgroundLine);
    const backgroundRows = new Map();
    const backgroundRowOf = (group) => {
        let row = backgroundRows.get(group);
        if (!row) {
            const text = backgroundTextOf(group);
            row = {
                line: createContentLine(doc, BACKGROUND_LINE_CLASS, text),
                run: createBidiRun(doc, text),
                highlightRun: createHighlightRun(doc, text),
                used: false,
            };
            row.line.appendChild(row.highlightRun);
            row.line.appendChild(row.run);
            backgroundRows.set(group, row);
        }
        return row;
    };
    backgroundRowOf(0);
    let pendingForegroundSpace = "";
    let pendingBackgroundSpace = "";
    main.appendChild(mainHighlightRun);
    main.appendChild(mainRun);
    for (const item of groupedTokens) {
        if ("kind" in item) {
            // Is a RenderToken, not a WordGroup, only whitespace should enter this path
            pendingForegroundSpace += item.text;
            pendingBackgroundSpace += item.text;
        }
        else {
            const shouldUseBackgroundLine = options.splitBackgroundLine && item.isBackground;
            const backgroundRow = shouldUseBackgroundLine ? backgroundRowOf(item.backgroundGroup ?? 0) : null;
            const target = backgroundRow ? backgroundRow.run : mainRun;
            const highlightRun = backgroundRow ? backgroundRow.highlightRun : mainHighlightRun;
            const pendingSpace = shouldUseBackgroundLine ? pendingBackgroundSpace : pendingForegroundSpace;
            if (target.childNodes.length > 0 && pendingSpace.length > 0) {
                target.appendChild(createSpaceNode(doc, pendingSpace, shouldUseBackgroundLine));
                highlightRun.appendChild(createSpaceNode(doc, pendingSpace, shouldUseBackgroundLine));
            }
            const contentLine = backgroundRow ? backgroundRow.line : main;
            const { lyricGroup, highlightGroup } = createWordGroup(doc, item, line, contentLine.classList.contains(BIDI_SENSITIVE_CLASS));
            target.appendChild(lyricGroup);
            highlightRun.appendChild(highlightGroup);
            if (backgroundRow) {
                backgroundRow.used = true;
                pendingBackgroundSpace = "";
            }
            else {
                pendingForegroundSpace = "";
            }
        }
    }
    const usedBackgroundRows = [...backgroundRows]
        .filter(([, row]) => row.used)
        .sort(([a], [b]) => a - b)
        .map(([, row]) => row);
    lyricElement.appendChild(main);
    for (const row of usedBackgroundRows)
        lyricElement.appendChild(row.line);
    return main;
}
export function buildLineSyncedParts(item) {
    const parts = [];
    const tokens = item.words.match(/\s+|\S+/gu) ?? [];
    for (const token of tokens) {
        parts.push({
            startTimeMs: item.startTimeMs,
            words: token,
            durationMs: 0,
        });
    }
    return parts;
}
export function addSeekHandler(seek, lyricElement, allZero) {
    if (allZero) {
        lyricElement.style.cursor = "unset";
        return;
    }
    lyricElement.addEventListener("click", event => {
        const seekTime = getSeekTimeFromClick(event, lyricElement);
        if (seekTime === null)
            return;
        seek(seekTime);
    });
}
function repeatsLine(lyricElement, text) {
    const mainRun = [
        ...(lyricElement.querySelector(`:scope > .${LINE_MAIN_CLASS}`)?.querySelectorAll(`:scope > .${BIDI_RUN_CLASS}`) ??
            []),
    ].find(run => !run.classList.contains(HIGHLIGHT_RUN_CLASS));
    return mainRun?.textContent != null && isSameText(mainRun.textContent, text);
}
/**
 * What each injected decoration was made from. A line a swap kept still carries what was hung on it,
 * so injecting the same again is nothing to do and injecting something else replaces it.
 */
const decorationSources = new WeakMap();
/**
 * Has the next tick set a line's animations up again, the parts just added to it included. A line
 * already being sung sets its parts up once, so parts added after that would stay still until the
 * line came round again. Its running animations are left alone: the setup replaces each one, so
 * nothing on the line goes still in between.
 */
function rearmLineAnimations(lineData) {
    lineData.isAnimating = false;
}
/** Takes a decoration off its line, along with any timed parts it brought, and stops their animations. */
function removeDecoration(lineData, decoration) {
    lineData.parts = lineData.parts.filter(part => {
        if (!decoration.contains(part.lyricElement))
            return true;
        releasePart(part);
        return false;
    });
    decoration.remove();
}
/**
 * Takes the romanization off a line, along with any timed parts it brought. A line a swap kept goes on
 * carrying what was hung on it, so this is how a consumer drops one it no longer wants. Answers
 * whether there was one to take off.
 */
export function removeRomanization(lyricElement, lineData) {
    const existing = lyricElement.querySelector(`:scope > .${ROMANIZED_LYRICS_CLASS}`);
    if (existing === null)
        return false;
    removeDecoration(lineData, existing);
    return true;
}
/**
 * Takes the translation off a line. A line a swap kept goes on carrying what was hung on it, so this is
 * how a consumer drops one it no longer wants. Answers whether there was one to take off.
 */
export function removeTranslation(lyricElement) {
    const existing = lyricElement.querySelector(`:scope > .${TRANSLATED_LYRICS_CLASS}`);
    if (existing === null)
        return false;
    existing.remove();
    return true;
}
/**
 * Moves the translation and romanization hung on one line onto the line built in its place, with any
 * timed parts they brought, so a line rebuilt for its timing keeps what the consumer hung on it. The
 * parts are let go of whatever the old line was showing; the new line sets them up again with its own.
 */
export function moveDecorations(from, to) {
    const decorations = Array.from(from.lyricElement.childNodes).filter((node) => node.classList?.contains(ROMANIZED_LYRICS_CLASS) === true ||
        node.classList?.contains(TRANSLATED_LYRICS_CLASS) === true);
    for (const decoration of decorations) {
        from.parts = from.parts.filter(part => {
            if (!decoration.contains(part.lyricElement))
                return true;
            releasePart(part);
            to.parts.push(part);
            return false;
        });
        to.lyricElement.appendChild(decoration);
    }
}
export function injectRomanization(doc, lyricElement, lineData, text, timedRomanization = null) {
    const source = JSON.stringify([text, timedRomanization ?? null]);
    const existing = lyricElement.querySelector(`:scope > .${ROMANIZED_LYRICS_CLASS}`);
    if (existing !== null) {
        if (decorationSources.get(existing) === source)
            return;
        removeDecoration(lineData, existing);
    }
    if (repeatsLine(lyricElement, text))
        return;
    const romanizedLine = doc.createElement("div");
    romanizedLine.classList.add(ROMANIZED_LYRICS_CLASS, CONTENT_LINE_CLASS);
    romanizedLine.dir = "auto";
    const language = normalizeLanguage(lyricElement.lang);
    romanizedLine.lang = `${language ? new Intl.Locale(language).language : "und"}-Latn`;
    applyDirection(romanizedLine, text);
    if (timedRomanization && timedRomanization.length > 0 && !disableRichsync.getBooleanValue()) {
        createLyricsLine(doc, timedRomanization, lineData, romanizedLine, { splitBackgroundLine: false });
        rearmLineAnimations(lineData);
    }
    else {
        romanizedLine.textContent = text;
    }
    decorationSources.set(romanizedLine, source);
    const translation = lyricElement.querySelector(`.${TRANSLATED_LYRICS_CLASS}`);
    lyricElement.insertBefore(romanizedLine, translation);
}
export function injectTranslation(doc, lyricElement, text, language) {
    const source = JSON.stringify([text, normalizeLanguage(language)]);
    const existing = lyricElement.querySelector(`:scope > .${TRANSLATED_LYRICS_CLASS}`);
    if (existing !== null) {
        if (decorationSources.get(existing) === source)
            return;
        existing.remove();
    }
    if (repeatsLine(lyricElement, text))
        return;
    const translatedText = text.startsWith("(") && text.endsWith(")") ? text : `(${text})`;
    const translatedLine = doc.createElement("div");
    translatedLine.classList.add(TRANSLATED_LYRICS_CLASS, CONTENT_LINE_CLASS);
    translatedLine.dir = "auto";
    translatedLine.lang = normalizeLanguage(language);
    applyDirection(translatedLine, translatedText);
    translatedLine.textContent = translatedText;
    decorationSources.set(translatedLine, source);
    lyricElement.appendChild(translatedLine);
}
