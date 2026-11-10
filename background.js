chrome.runtime.onInstalled.addListener(() => {
  console.log("[loop.mp3] extension initialised");
});
/*
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CHECK_AUTH" && sender.tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN',
      func: () => document.getElementById('channel-handle') !== null
    })
    .then(([result]) => sendResponse({ isLoggedIn: !!result?.result }))
    .catch(() => sendResponse({ isLoggedIn: false }));
    return true;
  }
});
*/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "close-current-tab" && sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id).catch((error) => {
            console.warn("[loop.mp3] Could not close the current tab:", error);
        });
        return;
    }

    if (message.type === "publish-lyrics") {
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
                sendResponse({ ok: response.ok, status: response.status, text });
            } catch (error) {
                sendResponse({ ok: false, status: 0, error: error?.message || "Network request failed." });
            }
        })();
        return true;
    }

    if (message.type === "open-mini-player" && sender.tab?.id) {
        chrome.scripting.executeScript({
            target: {
                tabId: sender.tab.id
            },
            func: () => {
                const video = document.querySelector("video");

                if (video) {
                    video.requestPictureInPicture();
                }
            }
        });
    }
});