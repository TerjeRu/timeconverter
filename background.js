// background.js - Service worker for managing per-site content script injection

function getOriginPattern(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return `${u.protocol}//${u.hostname}/*`;
  } catch {
    return null;
  }
}

async function injectContentScripts(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['styles.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['luxon.min.js']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript.js']
    });
  } catch (err) {
    // Tab may have navigated away or be a restricted page
    console.debug('Could not inject into tab', tabId, err.message);
  }
}

// When a permitted tab finishes loading, inject content scripts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const pattern = getOriginPattern(tab.url);
  if (!pattern) return;

  const hasPermission = await chrome.permissions.contains({ origins: [pattern] });
  if (hasPermission) {
    await injectContentScripts(tabId);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'inject') {
    injectContentScripts(message.tabId).then(() => sendResponse({ ok: true }));
    return true; // keep channel open for async response
  }
});
