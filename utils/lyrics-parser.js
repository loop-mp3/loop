function getExtensionURL(path) {
    return LoopUtils.getExtensionURL(path);
}

function escapeTTMLText(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function formatTTMLTime(milliseconds) {
    const totalSeconds = Math.max(0, Number(milliseconds) || 0) / 1_000;
    const hours = Math.floor(totalSeconds / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
}

function lyricsPlusToTTML(lines) {
    const body = lines
        .filter((line) => line?.text && Number.isFinite(Number(line.time)))
        .map((line, index, validLines) => {
            const start = Number(line.time);
            const explicitEnd = start + Math.max(0, Number(line.duration) || 0);
            const nextStart = Number(validLines[index + 1]?.time);
            const end = explicitEnd > start ? explicitEnd : Number.isFinite(nextStart) ? nextStart : start + 4_000;
            const syllables = Array.isArray(line.syllabus) ? line.syllabus : [];
            const content = syllables.length
                ? syllables.map((syllable) => `<span begin="${formatTTMLTime(syllable.time)}" dur="${formatTTMLTime(syllable.duration)}">${escapeTTMLText(syllable.text)}</span>`).join("")
                : escapeTTMLText(line.text);
            return `<p begin="${formatTTMLTime(start)}" end="${formatTTMLTime(end)}">${content}</p>`;
        })
        .join("");
    return `<tt xmlns="http://www.w3.org/ns/ttml"><body><div>${body}</div></body></tt>`;
}

function parseTTMLTimestamp(value) {
    const timestamp = String(value || "").trim();
    if (/^\d+(?:\.\d+)?$/.test(timestamp)) return Number(timestamp) * 1_000;
    const clockParts = timestamp.split(":");
    if (clockParts.length >= 2 && clockParts.length <= 3 && clockParts.every((part) => /^\d+(?:\.\d+)?$/.test(part))) {
        const seconds = Number(clockParts.pop());
        const minutes = Number(clockParts.pop() || 0);
        const hours = Number(clockParts.pop() || 0);
        return (hours * 3_600 + minutes * 60 + seconds) * 1_000;
    }
    const offset = timestamp.match(/^(\d+(?:\.\d+)?)(ms|s)$/);
    if (offset) return Number(offset[1]) * (offset[2] === "s" ? 1_000 : 1);
    return NaN;
}

function hasTTMLPreservedWhitespace(node) {
    let current = node?.parentNode;
    while (current) {
        const space = current.getAttribute?.("xml:space") || current.getAttributeNS?.("http://www.w3.org/XML/1998/namespace", "space");
        if (space) return space === "preserve";
        current = current.parentNode;
    }
    return false;
}

function getTTMLTextNodeContent(node) {
    const text = node.nodeValue || "";
    if (/\S/u.test(text) || hasTTMLPreservedWhitespace(node)) return text;
    // A single literal space between inline spans is lyric content. Newlines, tabs,
    // and runs of whitespace without xml:space="preserve" are normally indentation.
    return text === " " ? text : "";
}

function parseTTMLLyrics(ttml, songDurationMs) {
    if (typeof DOMParser !== "function") return [];
    const documentRoot = new DOMParser().parseFromString(String(ttml), "application/xml");
    if (documentRoot.querySelector("parsererror")) return [];
    const paragraphs = [...documentRoot.getElementsByTagNameNS("*", "p")];
    return paragraphs.map((paragraph, index) => {
        const startTimeMs = parseTTMLTimestamp(paragraph.getAttribute("begin"));
        if (!Number.isFinite(startTimeMs)) return null;
        const nextStartTimeMs = parseTTMLTimestamp(paragraphs[index + 1]?.getAttribute("begin"));
        const explicitEndTimeMs = parseTTMLTimestamp(paragraph.getAttribute("end"));
        const durationMs = Math.max(0,
            Number.isFinite(explicitEndTimeMs) ? explicitEndTimeMs - startTimeMs :
                Number.isFinite(nextStartTimeMs) ? nextStartTimeMs - startTimeMs :
                    Number.isFinite(songDurationMs) ? songDurationMs - startTimeMs : 4_000
        );
        const parts = [];
        let pendingText = "";
        let leadingText = "";
        for (const child of paragraph.childNodes || []) {
            if (child.nodeType !== 1 || child.localName !== "span") {
                pendingText += child.nodeType === 3 ? getTTMLTextNodeContent(child) : "";
                continue;
            }
            const partStartTimeMs = parseTTMLTimestamp(child.getAttribute("begin"));
            const explicitEndTimeMs = parseTTMLTimestamp(child.getAttribute("end"));
            const explicitDurationMs = parseTTMLTimestamp(child.getAttribute("dur"));
            const partDurationMs = Number.isFinite(explicitDurationMs)
                ? explicitDurationMs
                : Number.isFinite(explicitEndTimeMs) && Number.isFinite(partStartTimeMs)
                    ? explicitEndTimeMs - partStartTimeMs
                    : NaN;
            if (!Number.isFinite(partStartTimeMs) || !Number.isFinite(partDurationMs) || partDurationMs < 0 || !child.textContent) continue;
            if (pendingText) {
                if (parts.length) parts[parts.length - 1].words += pendingText;
                else leadingText += pendingText;
                pendingText = "";
            }
            parts.push({ startTimeMs: partStartTimeMs, durationMs: partDurationMs, words: child.textContent });
        }
        const trailingText = pendingText;
        const words = `${leadingText}${parts.map((part) => part.words).join("")}${trailingText}`.trim();
        return {
            startTimeMs,
            durationMs,
            words,
            parts: parts.length ? parts : undefined,
        };
    }).filter((line) => line?.words).sort((left, right) => left.startTimeMs - right.startTimeMs);
}

function hasSyncedLyricTimestamps(syncedLyrics) {
    return String(syncedLyrics || "")
        .split(/\r?\n/)
        .some((line) => /^\[\d+:\d+(?:\.\d+)?\]/.test(line));
}
function addLyricsGapNotes(lines, songDurationMs) {
    if (!lines.length || !Number.isFinite(songDurationMs) || songDurationMs <= 0) return lines;

    const note = () => ["♪", "♫", "♪"][Math.floor(Math.random() * 3)];
    const thresholdMs = typeof loopPreferences === "undefined"
        ? 5_000
        : normalizeLyricsGapNoteThreshold(loopPreferences.lyricsGapNoteThreshold) * 1_000;
    const firstLine = lines[0];
    const lastLine = lines[lines.length - 1];
    const openingGapMs = firstLine.startTimeMs;
    const closingStartMs = lastLine.startTimeMs + Math.max(0, lastLine.durationMs || 0);
    const closingGapMs = songDurationMs - closingStartMs;
    const gapNotes = [];

    if (openingGapMs > thresholdMs) {
        gapNotes.push({ startTimeMs: 0, durationMs: openingGapMs, words: note() });
    }
    if (closingGapMs > thresholdMs) {
        gapNotes.push({ startTimeMs: closingStartMs, durationMs: closingGapMs, words: note() });
    }
    return gapNotes.length ? [...gapNotes, ...lines].sort((left, right) => left.startTimeMs - right.startTimeMs) : lines;
}

function parseSyncedLyrics(syncedLyrics, plainLyrics, songDurationMs, instrumental = false) {
    if (/^\s*<tt(?:\s|>)/i.test(String(syncedLyrics || ""))) {
        return addLyricsGapNotes(parseTTMLLyrics(syncedLyrics, songDurationMs), songDurationMs);
    }
    const lines = String(syncedLyrics || "")
        .split(/\r?\n/)
        .map((line) => {
            const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
            if (!match) return null;
            const startTimeMs = Number(match[1]) * 60_000 + Number(match[2]) * 1_000;
            const text = match[3];
            const timedParts = [];
            const wordTimestampPattern = /<(\d+):(\d+(?:\.\d+)?)>/g;
            let timestampMatch;
            while ((timestampMatch = wordTimestampPattern.exec(text)) !== null) {
                timedParts.push({
                    startTimeMs: Number(timestampMatch[1]) * 60_000 + Number(timestampMatch[2]) * 1_000,
                    tagStart: timestampMatch.index,
                    textStart: wordTimestampPattern.lastIndex,
                });
            }
            const parts = timedParts.map((part, index) => {
                const next = timedParts[index + 1];
                const startIndex = part.textStart;
                const endIndex = next ? next.tagStart : text.length;
                return {
                    startTimeMs: part.startTimeMs,
                    // Preserve lrc.red's spaces as non-breaking whitespace so inline timed groups
                    // cannot collapse the gap between two separately rendered words.
                    words: text.slice(startIndex, endIndex).replace(/\s/g, "\u00a0"),
                };
            }).filter((part) => part.words.trim());
            const plainText = text.replace(/<\d+:\d+(?:\.\d+)?\>/g, "").trim();
            return {
                startTimeMs,
                words: plainText || ["♪", "♫", "♪"][Math.floor(Math.random() * 3)],
                timedParts: parts,
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.startTimeMs - right.startTimeMs);

    if (lines.length) {
        return addLyricsGapNotes(lines.map((line, index) => {
            const durationMs = Math.max(750, (lines[index + 1]?.startTimeMs || line.startTimeMs + 4_000) - line.startTimeMs);
            const parts = line.timedParts?.map((part, partIndex) => ({
                startTimeMs: part.startTimeMs,
                durationMs: Math.max(0, (line.timedParts[partIndex + 1]?.startTimeMs || line.startTimeMs + durationMs) - part.startTimeMs),
                words: part.words,
            }));
            return {
                startTimeMs: line.startTimeMs,
                durationMs,
                words: line.words,
                parts: parts?.length ? parts : undefined,
            };
        }), songDurationMs);
    }

    const plainLines = String(plainLyrics || "")
        .split(/\r?\n/)
        .map((words) => words.trim())
        .filter(Boolean);

    if (instrumental && !plainLines.length) {
        return [{
            startTimeMs: 0,
            durationMs: Number.isFinite(songDurationMs) && songDurationMs > 0 ? songDurationMs : 4_000,
            words: `Instrumental only`,
        }];
    }

    const lineDurationMs = Number.isFinite(songDurationMs) && songDurationMs > 0
        ? songDurationMs / plainLines.length
        : 4_000;
    return addLyricsGapNotes(plainLines.map((words, index) => ({
        startTimeMs: index * lineDurationMs,
        durationMs: lineDurationMs,
        words,
    })), songDurationMs);
}

function normalizeWriterCreditText(value) {
    return String(value || "")
        .replace(/^written\s+by\s*/i, "")
        .replace(/&/g, " and ")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .toLocaleLowerCase();
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.getExtensionURL = getExtensionURL;
    global.escapeTTMLText = escapeTTMLText;
    global.formatTTMLTime = formatTTMLTime;
    global.lyricsPlusToTTML = lyricsPlusToTTML;
    global.parseTTMLTimestamp = parseTTMLTimestamp;
    global.hasTTMLPreservedWhitespace = hasTTMLPreservedWhitespace;
    global.getTTMLTextNodeContent = getTTMLTextNodeContent;
    global.parseTTMLLyrics = parseTTMLLyrics;
    global.hasSyncedLyricTimestamps = hasSyncedLyricTimestamps;
    global.addLyricsGapNotes = addLyricsGapNotes;
    global.parseSyncedLyrics = parseSyncedLyrics;
    global.normalizeWriterCreditText = normalizeWriterCreditText;
})(globalThis);
