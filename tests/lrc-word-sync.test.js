import assert from "node:assert/strict";
import test from "node:test";

function parseSyncedLyrics(syncedLyrics, plainLyrics, songDurationMs, instrumental = false) {
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
                return {
                    startTimeMs: part.startTimeMs,
                    words: text.slice(part.textStart, next ? next.tagStart : text.length).replace(/\s/g, "\u00a0"),
                };
            }).filter((part) => part.words.trim());
            const plainText = text.replace(/<\d+:\d+(?:\.\d+)?\>/g, "").trim();
            return { startTimeMs, words: plainText || "♪", timedParts: parts };
        })
        .filter(Boolean)
        .sort((left, right) => left.startTimeMs - right.startTimeMs);
    if (lines.length) {
        return lines.map((line, index) => {
            const durationMs = Math.max(750, (lines[index + 1]?.startTimeMs || line.startTimeMs + 4_000) - line.startTimeMs);
            const parts = line.timedParts?.map((part, partIndex) => ({
                startTimeMs: part.startTimeMs,
                durationMs: Math.max(0, (line.timedParts[partIndex + 1]?.startTimeMs || line.startTimeMs + durationMs) - part.startTimeMs),
                words: part.words,
            }));
            return { startTimeMs: line.startTimeMs, durationMs, words: line.words, parts: parts?.length ? parts : undefined };
        });
    }
    const plainLines = String(plainLyrics || "").split(/\r?\n/).map((words) => words.trim()).filter(Boolean);
    if (instrumental && !plainLines.length) return [{ startTimeMs: 0, durationMs: songDurationMs > 0 ? songDurationMs : 4_000, words: "Instrumental only" }];
    const lineDurationMs = songDurationMs > 0 ? songDurationMs / plainLines.length : 4_000;
    return plainLines.map((words, index) => ({ startTimeMs: index * lineDurationMs, durationMs: lineDurationMs, words }));
}

test("parses inline LRC word timestamps without leaking timestamp markup", () => {
    const [line] = parseSyncedLyrics("[00:21.20]<00:21.20>I'm <00:21.57>down <00:21.89>bad,");
    assert.equal(line.words, "I'm  down  bad,");
    assert.deepEqual(line.parts.map(({ startTimeMs, words }) => ({ startTimeMs, words })), [
        { startTimeMs: 21200, words: "I'm\u00a0" },
        { startTimeMs: 21570, words: "down\u00a0" },
        { startTimeMs: 21890, words: "bad," },
    ]);
});

test("keeps normal LRC lines working", () => {
    const lines = parseSyncedLyrics("[00:01.00]First line\n[00:02.50]Second line");
    assert.equal(lines.length, 2);
    assert.equal(lines[0].words, "First line");
    assert.equal(lines[1].startTimeMs, 2500);
});

test("malformed inputs do not produce lines", () => {
    assert.deepEqual(parseSyncedLyrics("not synced lyrics"), []);
});
