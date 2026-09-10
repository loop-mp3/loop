chrome.runtime.onInstalled.addListener(() => {
  console.log("[loop.mp3] extension initialised");
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