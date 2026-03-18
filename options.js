// Default settings
const DEFAULT_SETTINGS = {
    extensionEnabled: true,
    timeFormat: '12h',
    displayMode: 'tooltip',
    targetTimezone: 'local'
};

// DOM Elements
const inputs = {
    extensionEnabled: document.getElementById('extensionEnabled'),
    timeFormat: document.getElementById('timeFormat'),
    displayMode: document.getElementById('displayMode'),
    targetTimezone: document.getElementById('targetTimezone')
};
const statusMessage = document.getElementById('statusMessage');
const siteListEl = document.getElementById('siteList');
const noSitesEl = document.getElementById('noSites');

let statusTimeout;

// Load settings on startup
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        inputs.extensionEnabled.checked = settings.extensionEnabled;
        inputs.timeFormat.value = settings.timeFormat;
        inputs.displayMode.value = settings.displayMode;
        inputs.targetTimezone.value = settings.targetTimezone;
    });

    // Add event listeners setup for live auto-saving
    Object.keys(inputs).forEach(key => {
        inputs[key].addEventListener('change', saveSettings);
    });

    loadPermittedSites();
});

// Save settings when changed
function saveSettings() {
    const newSettings = {
        extensionEnabled: inputs.extensionEnabled.checked,
        timeFormat: inputs.timeFormat.value,
        displayMode: inputs.displayMode.value,
        targetTimezone: inputs.targetTimezone.value
    };

    chrome.storage.sync.set(newSettings, () => {
        showStatus();
    });
}

// Show a small animated saving confirmation status
function showStatus() {
    statusMessage.classList.add('show');
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 2000);
}

// Permitted Sites management
function loadPermittedSites() {
    chrome.permissions.getAll((permissions) => {
        const origins = (permissions.origins || []).filter(
            o => o !== '<all_urls>'
        );
        renderSiteList(origins);
    });
}

function renderSiteList(origins) {
    siteListEl.innerHTML = '';

    if (origins.length === 0) {
        noSitesEl.style.display = 'block';
        return;
    }

    noSitesEl.style.display = 'none';

    origins.sort().forEach(origin => {
        const item = document.createElement('div');
        item.className = 'site-item';

        const host = document.createElement('span');
        host.className = 'site-item-host';
        // Show a cleaner display: "example.com" instead of "*://example.com/*"
        host.textContent = origin.replace(/^\*?:\/\//, '').replace(/\/\*$/, '');

        const btn = document.createElement('button');
        btn.className = 'site-remove-btn';
        btn.textContent = 'Remove';
        btn.addEventListener('click', () => {
            chrome.permissions.remove({ origins: [origin] }, (removed) => {
                if (removed) loadPermittedSites();
            });
        });

        item.appendChild(host);
        item.appendChild(btn);
        siteListEl.appendChild(item);
    });
}
