import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

// Exercise the actual parser in index.js instead of maintaining a copied test implementation.
const source = fs.readFileSync(new URL("../index.js", import.meta.url), "utf8");
const start = source.indexOf("function parseSyncedLyrics(");
const end = source.indexOf("\nfunction normalizeWriterCreditText(", start);
assert.notEqual(start, -1, "parseSyncedLyrics must exist in index.js");
assert.notEqual(end, -1, "could not find end of parseSyncedLyrics");
const parserContext = { globalThis: {} };
vm.runInNewContext(
    `${source.slice(start, end)}\nglobalThis.parseSyncedLyrics = parseSyncedLyrics;`,
    parserContext
);
const parseSyncedLyrics = parserContext.globalThis.parseSyncedLyrics;

test("parses inline LRC word timestamps without leaking timestamp markup", () => {
    const [line] = parseSyncedLyrics("[00:21.20]<00:21.20>I'm <00:21.57>down <00:21.89>bad,");
    assert.equal(line.words, "I'm down bad,");
    assert.deepEqual(
        line.parts.map(({ startTimeMs, words }) => ({ startTimeMs, words })),
        [
            { startTimeMs: 21200, words: "I'm\u00a0" },
            { startTimeMs: 21570, words: "down\u00a0" },
            { startTimeMs: 21890, words: "bad," },
        ]
    );
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
