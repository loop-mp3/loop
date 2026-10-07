chrome.runtime.onInstalled.addListener(() => {
    console.log("[loop.mp3] Firefox mobile extension initialised");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "publish-lyrics") return;

    (async () => {
        try {
            const response = await fetch("https://lrclib.net/api/publish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Publish-Token": message.publishToken,
                },
                body: JSON.stringify(message.submission),
            });
            const text = await response.text();
            sendResponse({
                ok: response.ok,
                status: response.status,
                text,
            });
        } catch (error) {
            sendResponse({
                ok: false,
                status: 0,
                error: error?.message || "Network request failed.",
            });
        }
    })();

    return true;
});
