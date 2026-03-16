// popup.js

const siteHostEl = document.getElementById('siteHost');
const statusEl = document.getElementById('status');
const toggleBtn = document.getElementById('toggleBtn');
const contentEl = document.getElementById('content');
const unsupportedEl = document.getElementById('unsupported');
const settingsLink = document.getElementById('settingsLink');

settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

function getOriginPattern(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return `${u.protocol}//${u.hostname}/*`;
  } catch {
    return null;
  }
}

function render(hostname, permitted) {
  siteHostEl.textContent = hostname;

  if (permitted) {
    statusEl.innerHTML = '<span class="status-dot active"></span> Active on this site';
    toggleBtn.textContent = 'Disable on this site';
    toggleBtn.className = 'btn btn-danger';
  } else {
    statusEl.innerHTML = '<span class="status-dot inactive"></span> Not active on this site';
    toggleBtn.textContent = 'Enable on this site';
    toggleBtn.className = 'btn btn-primary';
  }
  toggleBtn.style.display = 'block';
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    contentEl.style.display = 'none';
    unsupportedEl.style.display = 'block';
    return;
  }

  const pattern = getOriginPattern(tab.url);
  if (!pattern) {
    contentEl.style.display = 'none';
    unsupportedEl.style.display = 'block';
    return;
  }

  const hostname = new URL(tab.url).hostname;
  const permitted = await chrome.permissions.contains({ origins: [pattern] });
  render(hostname, permitted);

  toggleBtn.addEventListener('click', async () => {
    if (permitted) {
      const removed = await chrome.permissions.remove({ origins: [pattern] });
      if (removed) {
        render(hostname, false);
        // Reload tab so content scripts are removed
        chrome.tabs.reload(tab.id);
      }
    } else {
      const granted = await chrome.permissions.request({ origins: [pattern] });
      if (granted) {
        render(hostname, true);
        // Inject content scripts immediately
        chrome.runtime.sendMessage({ action: 'inject', tabId: tab.id });
      }
    }
  });
}

init();
