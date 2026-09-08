chrome.runtime.onInstalled.addListener(() => {
  console.log("[loop.mp3] extension initialised");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CHECK_AUTH" && sender.tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN',
      func: () => {
        if (!window.ytcfg || typeof window.ytcfg.get !== 'function') return false;
        const loggedIn = window.ytcfg.get('LOGGED_IN');
        return loggedIn === true || loggedIn === 1 || loggedIn === '1' || loggedIn === 'true';
      }
    })
    .then(([result]) => sendResponse({ isLoggedIn: !!result?.result }))
    .catch(() => sendResponse({ isLoggedIn: false }));
    return true;
  }
});
