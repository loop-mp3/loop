function getTrackInfo(playerBar) {
    return LoopYtmDom.getTrackInfo(playerBar);
}

function getMusicAuthorUrl(authorUrl) {
    if (!authorUrl) return "";

    try {
        const url = new URL(authorUrl);
        if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
            url.hostname = "music.youtube.com";
        }
        return url.toString();
    } catch {
        return authorUrl;
    }
}

// using the browse endpoint to get the writers (yes i dug through the ytm network logs manually, what iam i insane? yes fortunately and i have no life i stay in my house i never go outside i fear sunlight once i accidently touched grass and was hospitalised for 3 weeks)
async function getTrackWriterCredits(browseId) {
    if (!browseId) {
        console.error(`[loop.mp3] No browseId provided for track credits retrieval.`);
        return [];
    }
    try {
        const response = await fetch(
            "https://music.youtube.com/youtubei/v1/browse?prettyPrint=false",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            hl: "en",
                            gl: "IN",
                            clientName: "WEB_REMIX",
                            clientVersion: "1.20261006.10.00"
                        }
                    },
                    browseId
                })
            }
        );

        if (!response.ok) {
            console.error(
                "[loop.mp3] Track credits request failed:",
                response.status
            );
            return [];
        }

        const data = await response.json();
        return getTrackWritersFromBrowse(data);
    } catch (error) {
        console.error(
            "[loop.mp3] Track credits retrieval failed:",
            error
        );
        return [];
    }
}

// this is the selector that gets the writers name apparently ytm is wasting our precious ram in saving 100's of lines of useless json even in this ram cris
function getTrackWritersFromBrowse(data) {
    const writers = [];
    const getText = (value) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (Array.isArray(value)) return value.map(getText).join("");
        if (typeof value !== "object") return "";
        if (typeof value.simpleText === "string") return value.simpleText;
        if (typeof value.text === "string") return value.text;
        if (Array.isArray(value.runs)) return value.runs.map(getText).join("");
        return "";
    };
    const visit = (value) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        // YouTube has returned credits through more than one renderer. Do not
        // depend on the parent renderer name; identify the section by its title
        // and read either the old subtitle or the newer text/content field.
        const section = value.dismissableDialogContentSectionRenderer || value;
        const title = getText(section.title).trim().toLowerCase();
        if (title === "written by") {
            const names = getText(section.subtitle) || getText(section.content) || getText(section.description);
            writers.push(...names
                .split(/[\n,]/)
                .map((name) => name.trim())
                .filter(Boolean));
        }
        Object.values(value).forEach(visit);
    };
    visit(data);
    return [...new Set(writers)];
}

const MUSICBRAINZ_API_URL = "https://musicbrainz.org/ws/2";
const MUSICBRAINZ_REQUEST_INTERVAL_MS = 1_100;
const MUSICBRAINZ_REQUEST_TIMEOUT_MS = 10_000;
const musicBrainzWriterCache = new Map();
const musicBrainzWriterRequests = new Map();
let musicBrainzRequestQueue = Promise.resolve();
let musicBrainzLastRequestAt = 0;

function normalizeMusicBrainzText(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function escapeMusicBrainzQueryValue(value) {
    return String(value || "").replace(/([\\"])/g, "\\$1");
}

function getMusicBrainzArtistCreditText(recording) {
    return (Array.isArray(recording?.["artist-credit"]) ? recording["artist-credit"] : [])
        .map((credit) => credit?.name || credit?.artist?.name || "")
        .filter(Boolean)
        .join(" ");
}

function isMusicBrainzRecordingMatch(recording, title, artist) {
    const expectedTitle = normalizeMusicBrainzText(title);
    const expectedArtist = normalizeMusicBrainzText(artist);
    const recordingTitle = normalizeMusicBrainzText(recording?.title);
    const recordingArtist = normalizeMusicBrainzText(getMusicBrainzArtistCreditText(recording));
    if (!expectedTitle || !expectedArtist || !recordingTitle || !recordingArtist) return false;

    const titleMatches = recordingTitle === expectedTitle;
    const artistMatches = recordingArtist === expectedArtist ||
        recordingArtist.includes(expectedArtist) ||
        expectedArtist.includes(recordingArtist);
    return titleMatches && artistMatches;
}

function requestMusicBrainzJSON(path) {
    const request = musicBrainzRequestQueue.then(async () => {
        const wait = Math.max(
            0,
            MUSICBRAINZ_REQUEST_INTERVAL_MS - (Date.now() - musicBrainzLastRequestAt)
        );
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        musicBrainzLastRequestAt = Date.now();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), MUSICBRAINZ_REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(`${MUSICBRAINZ_API_URL}${path}`, {
                headers: { Accept: "application/json" },
                signal: controller.signal,
            });
            if (!response.ok) throw new Error(`MusicBrainz returned ${response.status}`);
            return response.json();
        } finally {
            clearTimeout(timeout);
        }
    });
    musicBrainzRequestQueue = request.catch(() => undefined);
    return request;
}

function getMusicBrainzWriterNames(recording) {
    const writerTypes = new Set(["composer", "lyricist", "writer"]);
    const writers = (Array.isArray(recording?.relations) ? recording.relations : [])
        .filter((relation) => writerTypes.has(String(relation?.type || "").toLowerCase()))
        .map((relation) => relation?.artist?.name || "")
        .map((name) => String(name).trim())
        .filter(Boolean);
    return [...new Set(writers)];
}

function getMusicBrainzWorkIds(recording) {
    return [...new Set((Array.isArray(recording?.relations) ? recording.relations : [])
        .map((relation) => relation?.work?.id || "")
        .filter(Boolean))];
}

async function resolveMusicBrainzWriterCredits(title, artist) {
    const query = `recording:"${escapeMusicBrainzQueryValue(title)}" AND artist:"${escapeMusicBrainzQueryValue(artist)}"`;
    const searchParams = new URLSearchParams({ query, fmt: "json", limit: "5" });
    const search = await requestMusicBrainzJSON(`/recording?${searchParams}`);
    const recordings = Array.isArray(search?.recordings) ? search.recordings : [];
    const match = recordings.find((recording) => isMusicBrainzRecordingMatch(recording, title, artist));
    if (!match?.id) return [];

    const lookupParams = new URLSearchParams({ inc: "artist-rels+work-rels", fmt: "json" });
    const recording = await requestMusicBrainzJSON(
        `/recording/${encodeURIComponent(match.id)}?${lookupParams}`
    );
    const writers = getMusicBrainzWriterNames(recording);
    const workIds = getMusicBrainzWorkIds(recording).slice(0, 3);
    for (const workId of workIds) {
        const workParams = new URLSearchParams({ inc: "artist-rels", fmt: "json" });
        const work = await requestMusicBrainzJSON(
            `/work/${encodeURIComponent(workId)}?${workParams}`
        );
        writers.push(...getMusicBrainzWriterNames(work));
    }
    return [...new Set(writers)];
}
async function getMusicBrainzWriterCredits(title, artist) {
    const normalizedTitle = normalizeMusicBrainzText(title);
    const normalizedArtist = normalizeMusicBrainzText(artist);
    if (!normalizedTitle || !normalizedArtist) return [];
    const cacheKey = `${normalizedTitle}|${normalizedArtist}`;
    if (musicBrainzWriterCache.has(cacheKey)) return musicBrainzWriterCache.get(cacheKey);
    if (musicBrainzWriterRequests.has(cacheKey)) return musicBrainzWriterRequests.get(cacheKey);

    const request = resolveMusicBrainzWriterCredits(title, artist)
        .then((writers) => {
            musicBrainzWriterCache.set(cacheKey, writers);
            return writers;
        })
        .catch((error) => {
            console.warn("[loop.mp3] MusicBrainz writer lookup failed:", error);
            return [];
        })
        .finally(() => musicBrainzWriterRequests.delete(cacheKey));
    musicBrainzWriterRequests.set(cacheKey, request);
    return request;
}


// Use the player endpoint to retrieve more accurate track metadata.
const prettyPrintMetaCache = new Map();

async function getPlayerMetadataPrettyPrint(trackId) {
    if (!trackId) return null;
    if (prettyPrintMetaCache.has(trackId)) {
        return prettyPrintMetaCache.get(trackId);
    }

    try {
        const response = await fetch(
            "https://music.youtube.com/youtubei/v1/player?prettyPrint=false",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    videoId: trackId,
                    context: {
                        client: {
                            hl: "en-GB",
                            gl: "IN",
                            clientName: "WEB_REMIX",
                            clientVersion: "1.20260928.13.00"
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            console.error("[loop.mp3] Pretty print metadata request failed:", response.status);
            showLoopNotification("Pretty print metadata retrieval failed Track information might not load correctly or might not be accurate press F5 to try again", 4000);
            return null;
        }

        const data = await response.json();

        const metadata = {
            title: data.videoDetails?.title ?? null,
            artist: data.videoDetails?.author ?? null,
            musicVideoType: data.videoDetails?.musicVideoType ?? null,
        };

        prettyPrintMetaCache.set(trackId, metadata);

        return metadata;
    } catch (error) {
        console.error("[loop.mp3] Pretty print metadata retrieval failed:", error);
        showLoopNotification("Pretty print metadata retrieval failed Track information might not load correctly or might not be accurate press F5 to try again", 4000);
        return null;
    }
}

// oEmbed resolves the canonical title and artist from the track ID. Album is
// read from the linked album entry in YouTube Music's player bar.
async function getTrackInfoFromTrackId(trackId, playerBar) {
    const domInfo = getTrackInfo(playerBar);
    if (!trackId) return domInfo;

    try {
        const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://youtube.com/watch?v=${trackId}`)}&format=json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`YouTube oEmbed returned ${response.status}`);
        const details = await response.json();
        const prettyPrintMeta = await getPlayerMetadataPrettyPrint(trackId);
        const liveInfo = getTrackInfo(playerBar);
        // a desperate attempt to get the album name from the blessed souls who are still stuck on the old player bar
        const oldPlayerBarAlbumName =
            playerBar
                ?.querySelector('a.yt-simple-endpoint[href^="browse/"]')
                ?.textContent.trim();
        const AuthorNameComposed =
            details.author_name.replace(/\s*[-–—]\s*Topic$/i, '').trim();
        // Use the canonical title so collaborations remain intact.
        const title =
            details.title ||
            prettyPrintMeta?.title
        const artist =
            prettyPrintMeta?.artist ||
            AuthorNameComposed ||
            details.author_name ||
            domInfo.artist;
            // its an array just fetching them to test
            // this is the browseId ytm uses for some reason its just appending the trackId to the prefix MPTC for some fucking reason
        const browseId = `MPTC${trackId}`;
        const TrackWriters = await getTrackWriterCredits(browseId);
        const musicBrainzWriterPromise = TrackWriters.length
            ? null
            : getMusicBrainzWriterCredits(title, artist);
        console.log(`[loop.mp3] Track Writers:`, TrackWriters);
        const artistUrl =
            getMusicAuthorUrl(details.author_url) ||
            liveInfo.artistUrl ||
            domInfo.artistUrl;

        const album =
            details.album ||
            oldPlayerBarAlbumName ||
            liveInfo.album ||
            domInfo.album;

        const albumUrl =
            details.album_url ||
            liveInfo.albumUrl ||
            domInfo.albumUrl;
        return {
            title,
            artist,
            artistUrl,
            album,
            albumUrl,
            TrackWriters,
            musicBrainzWriterPromise,
            // YouTube Music identifies art/audio tracks as ATV and video
            // content as OMV, UGC, or OFFICIAL_SOURCE_MUSIC. Thumbnail
            // dimensions are not reliable because both kinds use rectangular
            // thumbnails.
            isVideo: prettyPrintMeta?.musicVideoType === "MUSIC_VIDEO_TYPE_OMV" ||
                prettyPrintMeta?.musicVideoType === "MUSIC_VIDEO_TYPE_UGC" ||
                prettyPrintMeta?.musicVideoType === "MUSIC_VIDEO_TYPE_OFFICIAL_SOURCE_MUSIC",
        };
    } catch (error) {
        showLoopNotification("Could not fetch track metadata. Information might not load correctly press F5 to try again", 4000);
        console.warn("[loop.mp3] Could not fetch track metadata:", error);
        return domInfo;
    }
}

function getRecommendationText(node) {
    return node?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function getEmptyStateRecommendationShelves() {
    const shelfSelectors = [
        "ytmusic-carousel-shelf-renderer",
        "ytmusic-rich-section-renderer",
        "ytmusic-rich-shelf-renderer",
        "ytmusic-shelf-renderer",
    ];
    const shelfNames = /new releases?|quick picks?|quickplay|listen again/i;
    return [...document.querySelectorAll(shelfSelectors.join(","))]
        .filter((shelf) => !shelf.closest("#loop"))
        .map((shelf) => {
            const heading = [...shelf.querySelectorAll(
                "h2, h3, yt-formatted-string, .title, [id*=title]"
            )]
                .map(getRecommendationText)
                .find((text) => shelfNames.test(text));
            return heading ? { shelf, heading } : null;
        })
        .filter(Boolean);
}

function isRecommendationWatchUrl(url) {
    try {
        const parsedURL = new URL(url, location.href);
        return parsedURL.pathname === "/watch" || parsedURL.pathname === "/watch/";
    } catch {
        return false;
    }
}

function getRecommendationVideoId(url) {
    try {
        const parsedURL = new URL(url, location.href);
        return parsedURL.searchParams.get("v") ||
            parsedURL.pathname.match(/(?:\/watch\/|\/embed\/|\/shorts\/|\/v\/)([^/?#]+)/)?.[1] ||
            "";
    } catch {
        return "";
    }
}

function getRecommendationArtwork(url, fallback) {
    const videoId = getRecommendationVideoId(url);
    return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg` : fallback;
}

function getRecommendationCardData(shelf) {
    const cardSelectors = [
        "ytmusic-two-row-item-renderer",
        "ytmusic-responsive-list-item-renderer",
        "ytmusic-rich-item-renderer",
        "ytmusic-video-renderer",
    ];
    const cards = [...shelf.querySelectorAll(cardSelectors.join(","))];
    return cards.map((sourceCard) => {
        const link = [...sourceCard.querySelectorAll("a[href]")]
            .find((candidate) => isRecommendationWatchUrl(candidate.href));
        const image = sourceCard.querySelector("img");
        const title = [...sourceCard.querySelectorAll(
            "yt-formatted-string, .title, [id*=title]"
        )]
            .map(getRecommendationText)
            .find((text) => text && !/^(play|pause|more)$/i.test(text));
        const artist = [...sourceCard.querySelectorAll(
            ".subtitle, .byline, [class*=subtitle], [class*=byline]"
        )].map(getRecommendationText).find(Boolean);
        if (!link || !title || !image?.src) return null;
        return {
            sourceCard,
            action: sourceCard.querySelector('button[aria-label*="play" i]') || link,
            href: link.href,
            image: getRecommendationArtwork(link.href, image.currentSrc || image.src),
            fallbackImage: image.currentSrc || image.src,
            title,
            artist: artist || "",
        };
    }).filter(Boolean);
}

function renderEmptyStateRecommendations(loop) {
    const container = loop?.querySelector("#loop-empty-recommendations");
    if (!container) return;

    const shelves = getEmptyStateRecommendationShelves();
    const signature = shelves.map(({ shelf, heading }) =>
        `${heading}:${getRecommendationCardData(shelf).map((card) => card.href).join(",")}`
    ).join("|");
    if (container.dataset.signature === signature) return;
    container.dataset.signature = signature;
    container.replaceChildren();

    shelves.forEach(({ shelf, heading }) => {
        const cards = getRecommendationCardData(shelf);
        if (!cards.length) return;
        const section = document.createElement("section");
        section.className = "loop-empty-recommendation-section";
        const title = document.createElement("h2");
        title.textContent = heading;
        section.appendChild(title);
        const list = document.createElement("div");
        list.className = "loop-empty-recommendation-list";
        cards.forEach((card) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "loop-empty-recommendation-card";
            button.title = card.artist ? `${card.title} — ${card.artist}` : card.title;
            const artwork = document.createElement("img");
            artwork.src = card.image;
            artwork.alt = "";
            artwork.addEventListener("error", () => {
                if (artwork.src !== card.fallbackImage) artwork.src = card.fallbackImage;
            }, { once: true });
            const cardTitle = document.createElement("span");
            cardTitle.className = "loop-empty-recommendation-title";
            cardTitle.textContent = card.title;
            const cardArtist = document.createElement("span");
            cardArtist.className = "loop-empty-recommendation-artist";
            cardArtist.textContent = card.artist;
            button.append(artwork, cardTitle, cardArtist);
            button.addEventListener("click", () => {
                card.action.click();
            });
            list.appendChild(button);
        });
        section.appendChild(list);
        container.appendChild(section);
    });
    container.hidden = !container.children.length;
}

function rerenderLyricsForSelectedEngine() {
    if (!braccatoLyricsRenderer || !currentParsedLyrics.length) return;
    braccatoLyricsRenderer.setLyrics(
        getLyricsForRenderingEngine(currentParsedLyrics),
        currentLyricsRenderOptions
    );
    applyLyricsRenderingEngine();
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.getTrackInfo = getTrackInfo;
    global.getMusicAuthorUrl = getMusicAuthorUrl;
    global.getTrackWriterCredits = getTrackWriterCredits;
    global.getTrackWritersFromBrowse = getTrackWritersFromBrowse;
    global.getMusicBrainzWriterCredits = getMusicBrainzWriterCredits;
    global.getMusicBrainzWriterNames = getMusicBrainzWriterNames;
    global.getPlayerMetadataPrettyPrint = getPlayerMetadataPrettyPrint;
    global.getTrackInfoFromTrackId = getTrackInfoFromTrackId;
    global.getRecommendationText = getRecommendationText;
    global.getEmptyStateRecommendationShelves = getEmptyStateRecommendationShelves;
    global.isRecommendationWatchUrl = isRecommendationWatchUrl;
    global.getRecommendationVideoId = getRecommendationVideoId;
    global.getRecommendationArtwork = getRecommendationArtwork;
    global.getRecommendationCardData = getRecommendationCardData;
    global.renderEmptyStateRecommendations = renderEmptyStateRecommendations;
    global.rerenderLyricsForSelectedEngine = rerenderLyricsForSelectedEngine;
    Object.defineProperty(global, 'prettyPrintMetaCache', { configurable: true, get: () => prettyPrintMetaCache, set: (value) => { prettyPrintMetaCache = value; } });
})(globalThis);
