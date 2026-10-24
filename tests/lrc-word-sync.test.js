import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

// Exercise the actual parser module instead of maintaining a copied test implementation.
const source = fs.readFileSync(new URL("../utils/lyrics-parser.js", import.meta.url), "utf8");
const start = 0;
const end = source.length;
assert.notEqual(source.indexOf("function parseSyncedLyrics("), -1, "parseSyncedLyrics must exist in utils/lyrics-parser.js");
function decodeXmlText(value) {
    return value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}

function createTTMLParser() {
    class TextNode {
        constructor(value, parentNode) {
            this.nodeType = 3;
            this.nodeValue = value;
            this.parentNode = parentNode;
        }
    }

    class ElementNode {
        constructor(name, attributes, parentNode) {
            this.nodeType = 1;
            this.localName = name.includes(":") ? name.split(":").pop() : name;
            this.attributes = attributes;
            this.parentNode = parentNode;
            this.childNodes = [];
            this.children = [];
        }

        getAttribute(name) {
            return this.attributes[name] ?? null;
        }

        getAttributeNS(namespace, name) {
            return namespace === "http://www.w3.org/XML/1998/namespace"
                ? this.getAttribute(`xml:${name}`)
                : null;
        }

        get textContent() {
            return this.childNodes.map((child) => child.nodeType === 3 ? child.nodeValue : child.textContent).join("");
        }
    }

    class DocumentNode {
        constructor(root) {
            this.root = root;
        }

        querySelector() {
            return null;
        }

        getElementsByTagNameNS(namespace, localName) {
            const matches = [];
            const visit = (node) => {
                if (node.nodeType === 1 && node.localName === localName) matches.push(node);
                for (const child of node.childNodes || []) visit(child);
            };
            visit(this.root);
            return matches;
        }
    }

    return class DOMParser {
        parseFromString(input) {
            const documentRoot = { nodeType: 9, childNodes: [] };
            const stack = [documentRoot];
            const tokens = String(input).match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [];
            for (const token of tokens) {
                if (token.startsWith("<!--") || token.startsWith("<?") || token.startsWith("<!DOCTYPE")) continue;
                if (token.startsWith("</")) {
                    stack.pop();
                    continue;
                }
                if (token.startsWith("<")) {
                    const selfClosing = /\/\s*>$/.test(token);
                    const match = token.match(/^<\s*([^\s/>]+)((?:\s+[^=\s]+\s*=\s*"[^"]*")*)\s*\/?\s*>$/);
                    if (!match) continue;
                    const attributes = {};
                    for (const attribute of match[2].matchAll(/([^=\s]+)\s*=\s*"([^"]*)"/g)) {
                        attributes[attribute[1]] = decodeXmlText(attribute[2]);
                    }
                    const parent = stack.at(-1);
                    const element = new ElementNode(match[1], attributes, parent);
                    parent.childNodes.push(element);
                    parent.children?.push(element);
                    if (!selfClosing) stack.push(element);
                    continue;
                }
                const parent = stack.at(-1);
                parent.childNodes.push(new TextNode(decodeXmlText(token), parent));
            }
            return new DocumentNode(documentRoot.childNodes[0]);
        }
    };
}

const parserContext = { globalThis: {}, DOMParser: createTTMLParser() };
vm.runInNewContext(
    `${source.slice(start, end)}\nglobalThis.parseSyncedLyrics = parseSyncedLyrics;`,
    parserContext
);
const parseSyncedLyrics = parserContext.globalThis.parseSyncedLyrics;

test("parses inline LRC word timestamps without leaking timestamp markup", () => {
    const [line] = parseSyncedLyrics("[00:21.20]<00:21.20>I'm <00:21.57>down <00:21.89>bad,");
    assert.equal(line.words, "I'm down bad,");
    assert.deepEqual(
        JSON.parse(JSON.stringify(line.parts.map(({ startTimeMs, words }) => ({ startTimeMs, words })))),
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
    assert.equal(lines[1].startTimeMs, 2500);
});

test("adds musical notes for opening and closing lyric gaps", () => {
    const lines = parseSyncedLyrics("[00:06.00]First line\n[00:10.00]Last line", null, 20_000);
    assert.equal(lines.length, 4);
    assert.deepEqual(
        JSON.parse(JSON.stringify(lines.map(({ startTimeMs, durationMs }) => ({ startTimeMs, durationMs })))),
        [
            { startTimeMs: 0, durationMs: 6_000 },
            { startTimeMs: 6_000, durationMs: 4_000 },
            { startTimeMs: 10_000, durationMs: 4_000 },
            { startTimeMs: 14_000, durationMs: 6_000 },
        ]
    );
    assert.ok(["♪", "♫", "♪"].includes(lines[0].words));
    assert.ok(["♪", "♫", "♪"].includes(lines[3].words));
    assert.equal(lines[1].words, "First line");
    assert.equal(lines[2].words, "Last line");
});

test("malformed inputs do not produce lines", () => {
    assert.deepEqual(JSON.parse(JSON.stringify(parseSyncedLyrics("not synced lyrics"))), []);
});

test("preserves TTML syllable boundaries, lyric spaces, punctuation, and timing", () => {
    const ttml = `<tt xmlns="http://www.w3.org/ns/ttml"><body><div><p begin="0s" end="4s">
        <span begin="0s" dur="0.2s">dream</span><span begin="0.2s" dur="0.2s">ing</span> <span begin="0.4s" dur="0.2s">I've</span> <span begin="0.6s" dur="0.2s">been</span> <span begin="0.8s" dur="0.2s">there,</span>
    </p></div></body></tt>`;
    const [line] = parseSyncedLyrics(ttml);

    assert.equal(line.words, "dreaming I've been there,");
    assert.deepEqual(JSON.parse(JSON.stringify(line.parts)), [
        { startTimeMs: 0, durationMs: 200, words: "dream" },
        { startTimeMs: 200, durationMs: 200, words: "ing " },
        { startTimeMs: 400, durationMs: 200, words: "I've " },
        { startTimeMs: 600, durationMs: 200, words: "been " },
        { startTimeMs: 800, durationMs: 200, words: "there," },
    ]);
});

test("honors xml:space preserve while ignoring formatted indentation", () => {
    const ttml = `<tt xmlns="http://www.w3.org/ns/ttml"><body><div><p begin="0s" end="2s" xml:space="preserve">
        <span begin="0s" dur="0.5s">one</span>  <span begin="0.5s" dur="0.5s">two</span>
    </p></div></body></tt>`;
    const [line] = parseSyncedLyrics(ttml);

    assert.equal(line.words, "one  two");
    assert.equal(line.parts[0].words, "one  ");
    assert.equal(line.parts[1].words, "two");
});
