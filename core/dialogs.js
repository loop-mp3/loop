function showLoopResetModal() {
    if (document.getElementById("loop-reset-modal")) return;

    const modal = document.createElement("div");
    modal.id = "loop-reset-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-reset-modal-title");
    modal.innerHTML = `
        <div class="loop-reset-modal-card">
            <div class="loop-reset-modal-header">
                <div>
                    <div class="loop-reset-modal-kicker">Reset Loop</div>
                    <h2 id="loop-reset-modal-title">Delete Loop data?</h2>
                </div>
                <button type="button" class="loop-reset-modal-close" aria-label="Cancel reset">&#215;</button>
            </div>
            <p class="loop-reset-modal-description">
                This will delete Loop's stored settings and data. YouTube Music data will not be affected.
            </p>
            <div class="loop-reset-modal-actions">
                <button type="button" class="loop-reset-modal-confirm">
                    <span class="loop-reset-modal-progress" aria-hidden="true"></span>
                    <span class="loop-reset-modal-confirm-content">Hold to reset Loop</span>
                </button>
                <button type="button" class="loop-reset-modal-cancel">Cancel</button>
            </div>
        </div>`;

    (document.getElementById("loop") || document.body).appendChild(modal);

    const close = () => modal.remove();
    const confirm = modal.querySelector(".loop-reset-modal-confirm");

    modal.querySelector(".loop-reset-modal-close").addEventListener("click", close);
    modal.querySelector(".loop-reset-modal-cancel").addEventListener("click", close);
    let resetHoldTimer;
    let resetHolding = false;
    let resetComplete = false;

    const cancelResetHold = () => {
        if (!resetHolding || resetComplete) return;
        resetHolding = false;
        clearTimeout(resetHoldTimer);
        resetHoldTimer = undefined;
        confirm.classList.remove("holding");
        confirm.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to reset Loop";
    };

    confirm.addEventListener("pointerdown", (event) => {
        if (resetHolding || resetComplete) return;
        event.preventDefault();
        resetHolding = true;
        confirm.classList.add("holding");

        resetHoldTimer = setTimeout(async () => {
            if (!resetHolding) return;

            confirm.disabled = true;
            confirm.querySelector(".loop-reset-modal-confirm-content").textContent = "Deleting...";

            try {
                await resetLoopData();
                resetComplete = true;
                resetHolding = false;
                applyLoopPreferences();
                applyKawarpSettings(kawarpSettings);
                close();

                // Clear Cache Storage where the page is allowed to access it,
                // then return to the YT Music root and reload the page.
                try {
                    if ("caches" in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map((name) => caches.delete(name)));
                    }
                } catch (error) {
                    console.warn("[loop.mp3] Could not clear page Cache Storage:", error);
                }

                window.location.replace("/");
            } catch (error) {
                console.error("[loop.mp3] Could not reset Loop data:", error);
                confirm.disabled = false;
                resetHolding = false;
                confirm.classList.remove("holding");
                confirm.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to reset Loop";
                showLoopNotification("Could not reset Loop data.", 3000);
            }
        }, 1200);
    });

    confirm.addEventListener("pointerup", cancelResetHold);
    confirm.addEventListener("pointerleave", cancelResetHold);
    confirm.addEventListener("pointercancel", cancelResetHold);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });

    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });

    confirm.focus();
}

// Expose the reset modal to the DevTools console without relying on the
// extension's isolated-world globals.
document.addEventListener("loop:show-reset-modal", showLoopResetModal);

function showLyricsSubmissionModal() {
    if (document.getElementById("loop-lyrics-submit-modal")) return;

    const loop = document.getElementById("loop");
    const modal = document.createElement("div");
    modal.id = "loop-lyrics-submit-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "loop-lyrics-submit-title");
    modal.innerHTML = `
        <section class="loop-lyrics-submit-card">
            <header class="loop-lyrics-submit-header">
                <div>
                    <div class="loop-lyrics-submit-kicker">LRCLIB contribution</div>
                    <h2 id="loop-lyrics-submit-title">Submit lyrics</h2>
                </div>
                <button type="button" class="loop-lyrics-submit-close" aria-label="Close lyrics submission">&#215;</button>
            </header>
            <p class="loop-lyrics-submit-warning">
                LRCLIB submissions are public and cannot be deleted or replaced. Check every detail before publishing.
            </p>
            <p class="loop-lyrics-submit-pow-note">
                Publishing also requires solving a proof-of-work challenge, which may take several minutes.
            </p>
            <form class="loop-lyrics-submit-form">
                <div class="loop-lyrics-submit-fields">
                    <label>Track Name <span>*</span>
                        <input name="trackName" type="text" required maxlength="200" autocomplete="off">
                    </label>
                    <label>Artist Name <span>*</span>
                        <input name="artistName" type="text" required maxlength="200" autocomplete="off">
                    </label>
                    <label>Album Name
                        <input name="albumName" type="text" maxlength="200" autocomplete="off">
                    </label>
                    <label>Duration (seconds)
                        <input name="duration" type="number" min="0" step="1" inputmode="numeric">
                    </label>
                </div>
                <section class="loop-lyrics-submit-input" aria-labelledby="loop-lyrics-submit-input-title">
                    <div class="loop-lyrics-submit-input-header">
                        <h3 id="loop-lyrics-submit-input-title">Lyrics input</h3>
                        <label class="loop-lyrics-submit-upload">
                            Upload .lrc file
                            <input class="loop-lyrics-submit-file" type="file" accept=".lrc,text/plain">
                        </label>
                    </div>
                    <label>Plain Lyrics
                        <textarea name="plainLyrics" rows="5" spellcheck="true"></textarea>
                    </label>
                    <label>Synced Lyrics
                        <textarea name="syncedLyrics" rows="6" spellcheck="false" placeholder="[mm:ss.xx] Lyrics line"></textarea>
                    </label>
                    <p class="loop-lyrics-submit-help">Leave both lyrics fields empty for instrumental tracks.</p>
                </section>
                <div class="loop-lyrics-submit-status" role="status" aria-live="polite" hidden></div>
                <div class="loop-reset-modal-actions loop-lyrics-submit-actions">
                    <button type="submit" class="loop-reset-modal-confirm loop-lyrics-submit-review-button">Review submission</button>
                    <button type="button" class="loop-reset-modal-cancel loop-lyrics-submit-cancel">Cancel</button>
                </div>
            </form>
            <section class="loop-lyrics-submit-review" hidden>
                <h3>Quality check</h3>
                <p class="loop-lyrics-submit-warning">
                    Verify the track metadata and lyric text. LRCLIB does not support deleting or replacing a published entry.
                </p>
                <dl class="loop-lyrics-submit-summary"></dl>
                <pre class="loop-lyrics-submit-preview" hidden></pre>
                <label class="loop-lyrics-submit-acknowledgement">
                    <input type="checkbox">
                    <span></span>
                </label>
                <div class="loop-lyrics-submit-status" role="status" aria-live="polite" hidden></div>
                <div class="loop-reset-modal-actions loop-lyrics-submit-actions">
                    <button type="button" class="loop-reset-modal-confirm loop-lyrics-submit-publish" disabled>
                        <span class="loop-reset-modal-progress" aria-hidden="true"></span>
                        <span class="loop-reset-modal-confirm-content">Hold to publish</span>
                    </button>
                    <button type="button" class="loop-reset-modal-cancel loop-lyrics-submit-back">Back to edit</button>
                </div>
            </section>
            <section class="loop-lyrics-submit-success" hidden>
                <h3>Submission published</h3>
                <p class="loop-lyrics-submit-success-message"></p>
                <div class="loop-reset-modal-actions loop-lyrics-submit-actions">
                    <button type="button" class="loop-reset-modal-cancel loop-lyrics-submit-done">Done</button>
                </div>
            </section>
        </section>`;

    (loop || document.body).appendChild(modal);

    const form = modal.querySelector(".loop-lyrics-submit-form");
    const review = modal.querySelector(".loop-lyrics-submit-review");
    const publishButton = modal.querySelector(".loop-lyrics-submit-publish");
    const closeButton = modal.querySelector(".loop-lyrics-submit-close");
    const cancelButton = modal.querySelector(".loop-lyrics-submit-cancel");
    const formStatus = modal.querySelector(".loop-lyrics-submit-form .loop-lyrics-submit-status");
    const reviewStatus = modal.querySelector(".loop-lyrics-submit-review .loop-lyrics-submit-status");
    const acknowledgement = modal.querySelector(".loop-lyrics-submit-acknowledgement input");
    let publishing = false;
    let publishRequestStarted = false;
    let cancelRequested = false;
    let challengeAbortController;
    let publishHoldTimer;
    let publishHolding = false;

    const close = () => {
        if (publishRequestStarted) return;
        clearTimeout(publishHoldTimer);
        publishHolding = false;
        if (publishing) {
            cancelRequested = true;
            challengeAbortController?.abort();
        }
        modal.remove();
    };
    const setStatus = (status, message, isError = false) => {
        status.textContent = message;
        status.hidden = !message;
        status.classList.toggle("is-error", isError);
    };
    const getSubmission = () => {
        const data = new FormData(form);
        const durationText = String(data.get("duration") || "").trim();
        const duration = durationText ? Number(durationText) : null;
        if (durationText && (!Number.isFinite(duration) || duration < 0)) {
            throw new Error("Duration must be a non-negative number.");
        }
        return {
            trackName: String(data.get("trackName") || "").trim(),
            artistName: String(data.get("artistName") || "").trim(),
            albumName: String(data.get("albumName") || "").trim(),
            duration: duration === null ? null : Math.round(duration),
            plainLyrics: String(data.get("plainLyrics") || "").trim() || null,
            syncedLyrics: String(data.get("syncedLyrics") || "").trim() || null,
        };
    };

    const trackInfo = {
        trackName: loop?.querySelector("#loop-track-title")?.textContent.trim() || "",
        artistName: loop?.querySelector("#loop-track-artist")?.textContent.trim() || "",
        albumName: loop?.querySelector("#loop-track-album")?.textContent.trim() || "",
    };
    const mediaDuration = getCurrentMedia()?.duration;
    for (const [field, value] of Object.entries(trackInfo)) {
        const input = form.elements.namedItem(field);
        if (value && !/^unknown (track|artist|album)$/i.test(value)) input.value = value;
    }
    if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
        form.elements.namedItem("duration").value = String(Math.round(mediaDuration));
    }

    const loadLrcFile = async (file) => {
        if (!file) return;
        try {
            const lyrics = await file.text();
            form.elements.namedItem("syncedLyrics").value = lyrics;
            form.elements.namedItem("plainLyrics").value = lyrics
                .replace(/(?:\[\d{1,3}:\d{2}(?:\.\d{1,3})?\])+/g, "")
                .split(/\r?\n/)
                .filter((line) => line.trim() && !/^\[[a-z]{2,}:.+\]$/i.test(line.trim()))
                .join("\n");
            setStatus(formStatus, "");
        } catch (error) {
            console.error("[loop.mp3] Could not read the LRC file:", error);
            setStatus(formStatus, "Could not read that .lrc file.", true);
        }
    };
    const fileInput = modal.querySelector(".loop-lyrics-submit-file");
    fileInput.addEventListener("change", () => loadLrcFile(fileInput.files?.[0]));
    const uploadLabel = modal.querySelector(".loop-lyrics-submit-upload");
    uploadLabel.addEventListener("dragover", (event) => event.preventDefault());
    uploadLabel.addEventListener("drop", (event) => {
        event.preventDefault();
        loadLrcFile(event.dataTransfer?.files?.[0]);
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        setStatus(formStatus, "");
        if (!form.reportValidity()) return;

        let submission;
        try {
            submission = getSubmission();
        } catch (error) {
            setStatus(formStatus, error.message, true);
            return;
        }

        const isInstrumental = !submission.plainLyrics && !submission.syncedLyrics;
        const summary = modal.querySelector(".loop-lyrics-submit-summary");
        summary.replaceChildren();
        [
            ["Track", submission.trackName],
            ["Artist", submission.artistName],
            ["Album", submission.albumName || "Not provided"],
            ["Duration", submission.duration === null ? "Not provided" : `${submission.duration} seconds`],
            ["Lyrics", isInstrumental ? "Instrumental (both fields empty)" : [
                submission.plainLyrics ? "Plain" : "",
                submission.syncedLyrics ? "Synced" : "",
            ].filter(Boolean).join(" + ")],
        ].forEach(([label, value]) => {
            const term = document.createElement("dt");
            const detail = document.createElement("dd");
            term.textContent = label;
            detail.textContent = value;
            summary.append(term, detail);
        });

        const preview = modal.querySelector(".loop-lyrics-submit-preview");
        const previewText = submission.syncedLyrics || submission.plainLyrics;
        preview.hidden = !previewText;
        preview.textContent = previewText || "";
        const acknowledgementText = modal.querySelector(".loop-lyrics-submit-acknowledgement span");
        acknowledgementText.textContent = isInstrumental
            ? "I confirm this track is instrumental and both lyrics fields are intentionally empty. I have checked the metadata and understand this submission cannot be removed."
            : "I have checked the metadata, lyric text, and any timestamps for accuracy. I understand this submission cannot be removed.";
        acknowledgement.checked = false;
        publishButton.disabled = true;
        form.hidden = true;
        review.hidden = false;
        setStatus(reviewStatus, "");
        acknowledgement.focus();
    });

    acknowledgement.addEventListener("change", () => {
        publishButton.disabled = !acknowledgement.checked || publishing;
    });
    modal.querySelector(".loop-lyrics-submit-back").addEventListener("click", () => {
        if (publishing) return;
        review.hidden = true;
        form.hidden = false;
        setStatus(reviewStatus, "");
        modal.querySelector(".loop-lyrics-submit-review-button").focus();
    });

    const solvePublishChallenge = async (status) => {
        if (!crypto.subtle) throw new Error("This browser cannot run LRCLIB's secure publish challenge.");

        challengeAbortController = new AbortController();
        const challengeResponse = await fetch("https://lrclib.net/api/request-challenge", {
            method: "POST",
            signal: challengeAbortController.signal,
        });
        if (!challengeResponse.ok) {
            throw new Error(`LRCLIB challenge request failed (${challengeResponse.status}).`);
        }
        const challenge = await challengeResponse.json();
        const { prefix, target } = challenge || {};
        if (typeof prefix !== "string" || typeof target !== "string" || !/^[0-9a-f]+$/i.test(target)) {
            throw new Error("LRCLIB returned an invalid publish challenge.");
        }

        const encoder = new TextEncoder();
        const targetValue = BigInt(`0x${target}`);
        if (targetValue === 0n) throw new Error("LRCLIB returned an unsolvable publish challenge.");
        let nonce = 0;
        while (true) {
            if (cancelRequested) return null;
            const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${prefix}${nonce}`));
            const hash = [...new Uint8Array(digest)]
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join("");
            if (BigInt(`0x${hash}`) < targetValue) return `${prefix}:${nonce}`;
            nonce += 1;
            if (nonce % 256 === 0) {
                if (nonce % 4096 === 0) {
                    status.textContent = `Solving LRCLIB's publish challenge (${nonce.toLocaleString()} attempts)…`;
                }
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }
    };

    const resetPublishHold = () => {
        if (!publishHolding) return;
        publishHolding = false;
        clearTimeout(publishHoldTimer);
        publishHoldTimer = undefined;
        publishButton.classList.remove("holding");
        publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to publish";
    };
    const startPublishHold = (event) => {
        if (!acknowledgement.checked || publishing || publishHolding || event.repeat) return;
        event.preventDefault();
        publishHolding = true;
        publishButton.classList.add("holding");
        publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Keep holding…";
        publishHoldTimer = setTimeout(() => {
            publishHolding = false;
            publishHoldTimer = undefined;
            publishButton.classList.remove("holding");
            publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Preparing…";
            publishLyrics();
        }, 1200);
    };

    const publishLyrics = async () => {
        if (!acknowledgement.checked || publishing) return;
        publishing = true;
        publishButton.disabled = true;
        modal.querySelector(".loop-lyrics-submit-back").disabled = true;
        setStatus(reviewStatus, "Requesting LRCLIB's publish challenge…");

        try {
            const submission = getSubmission();
            const publishToken = await solvePublishChallenge(reviewStatus);
            if (!publishToken || cancelRequested) return;
            setStatus(reviewStatus, "Publishing lyrics to LRCLIB…");
            publishRequestStarted = true;
            modal.querySelector(".loop-lyrics-submit-back").disabled = true;
            closeButton.disabled = true;
            cancelButton.disabled = true;
            const response = await chrome.runtime.sendMessage({
                type: "publish-lyrics",
                publishToken,
                submission,
            });
            if (!response?.ok) {
                if (response?.status) {
                    const details = (response.text || "").trim();
                    throw new Error(`LRCLIB rejected the submission (${response.status})${details ? `: ${details}` : "."}`);
                }
                throw new Error(response?.error || "Could not reach LRCLIB.");
            }

            let resultMessage = "Your lyrics were published to LRCLIB.";
            const responseText = (response.text || "").trim();
            if (responseText) {
                try {
                    const result = JSON.parse(responseText);
                    if (typeof result.message === "string" && result.message) resultMessage = result.message;
                } catch {
                    resultMessage = responseText;
                }
            }
            publishRequestStarted = false;
            publishing = false;
            review.hidden = true;
            modal.querySelector(".loop-lyrics-submit-success-message").textContent = resultMessage;
            modal.querySelector(".loop-lyrics-submit-success").hidden = false;
            modal.querySelector(".loop-lyrics-submit-done").focus();
            showLoopNotification("Lyrics submitted to LRCLIB.", 3000);
        } catch (error) {
            if (cancelRequested) return;
            console.error("[loop.mp3] Could not submit lyrics to LRCLIB:", error);
            setStatus(reviewStatus, error.message || "Could not submit lyrics to LRCLIB.", true);
            publishing = false;
            publishRequestStarted = false;
            publishButton.disabled = !acknowledgement.checked;
            publishButton.querySelector(".loop-reset-modal-confirm-content").textContent = "Hold to publish";
            modal.querySelector(".loop-lyrics-submit-back").disabled = false;
            closeButton.disabled = false;
            cancelButton.disabled = false;
        }
    };

    publishButton.addEventListener("pointerdown", startPublishHold);
    publishButton.addEventListener("pointerup", resetPublishHold);
    publishButton.addEventListener("pointerleave", resetPublishHold);
    publishButton.addEventListener("pointercancel", resetPublishHold);
    publishButton.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") startPublishHold(event);
    });
    publishButton.addEventListener("keyup", (event) => {
        if (event.key === " " || event.key === "Enter") resetPublishHold();
    });

    closeButton.addEventListener("click", close);
    cancelButton.addEventListener("click", close);
    modal.querySelector(".loop-lyrics-submit-done").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });

    modal.querySelector('[name="trackName"]').focus();
}

// Explicit cross-file API: MV3 classic content scripts do not share lexical bindings.
(function publishLoopModule(global) {
    global.showLoopResetModal = showLoopResetModal;
    global.showLyricsSubmissionModal = showLyricsSubmissionModal;
})(globalThis);
