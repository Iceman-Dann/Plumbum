/**
 * Plumbum Browser Extension — Background Service Worker (MV3)
 * Handles cache cleanup and cross-tab messaging.
 */

// Clean up expired cache entries periodically
chrome.alarms.create("pb-cache-cleanup", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "pb-cache-cleanup") return;

  chrome.storage.local.get(null, (items) => {
    const keysToDelete = [];
    const now = Date.now();
    for (const [key, value] of Object.entries(items)) {
      if (key.startsWith("pb_cache_") && value?.expiresAt && now > value.expiresAt) {
        keysToDelete.push(key);
      }
    }
    if (keysToDelete.length > 0) {
      chrome.storage.local.remove(keysToDelete);
    }
  });
});

// Listen for messages from popup (e.g. manual address lookup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_RISK") {
    const { address } = message;
    fetch(`https://plumbummap.org/api/v1/risk?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // keep message channel open for async response
  }
});
