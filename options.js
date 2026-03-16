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
