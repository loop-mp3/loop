function checkForUpdates() {
  const currentVersion = chrome.runtime.getManifest().version;
  const UpdateServerURL = "https://loop.mizucode.qzz.io/config.json";

  fetch(UpdateServerURL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((config) => {
      if (!config || typeof config !== "object") return;

      const updateRequired = Number(config.is_update_required) === 1 ||
        Number(config.version) > Number(currentVersion);
      if (!updateRequired) return;

      const escapeHTML = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      const popupHTML = `<!doctype html><html><head><meta charset="utf-8">
        <title>Loop update</title><style>
        body{font:16px system-ui,sans-serif;margin:2rem;max-width:32rem;color:#222}
        a{display:inline-block;padding:.7rem 1rem;border-radius:6px;background:#1769e0;color:#fff;text-decoration:none}
        </style></head><body><h2>Loop update available</h2>
        <p>${escapeHTML(config.update_notice || "A new update is available.")}</p>
        <a href="https://loop.mizucode.qzz.io/update" target="_blank" rel="noopener">Download the update</a>
        </body></html>`;

      chrome.windows.create({
        url: `data:text/html;charset=utf-8,${encodeURIComponent(popupHTML)}`,
        type: "popup",
        width: 480,
        height: 320
      });
    })
    .catch((error) => console.warn("[loop.mp3] update check failed", error));
}
chrome.runtime.onInstalled.addListener(() => {
  console.log("[loop.mp3] extension initialised");
  checkForUpdates();
});
// sorry boy we dont need you anymor
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
