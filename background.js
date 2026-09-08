chrome.runtime.onInstalled.addListener(() => {
  console.log("[loop.mp3] extension initialised");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CHECK_AUTH" && sender.tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN',
      func: () => !!(window.ytcfg && typeof window.ytcfg.get === 'function' && window.ytcfg.get('LOGGED_IN'))
    })
    .then(([result]) => sendResponse({ isLoggedIn: !!result?.result }))
    .catch(() => sendResponse({ isLoggedIn: false }));
    return true;
  }
});