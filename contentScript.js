// contentScript.js

// Prevent double-initialization when injected programmatically
if (window.__timeConverterInitialized) {
    // Already running on this page
} else {
window.__timeConverterInitialized = true;

// Import Luxon
const { DateTime } = luxon;

// Refined regex: strictly looks for formats like "10:00 AM EST" or "10:30" or "10 AM" (now supports periods)
const timeRegex = /\b(?:\d{1,2}[:.]\d{2}(?:\s?(?:AM|PM|am|pm))?|\d{1,2}\s?(?:AM|PM|am|pm))(?:\s?(?:ET|EST|EDT|CT|CST|CDT|MT|MST|MDT|PT|PST|PDT|BST|GMT|UTC|CEST|CET|AEST|AEDT))?\b/gi;

let settings = {
    extensionEnabled: true,
    timeFormat: '12h',
    displayMode: 'tooltip',
    targetTimezone: 'local'
};

// Function to convert time to local using Luxon
function convertToLocal(timeString, currentSettings) {
  try {
    // Clean the time string
    timeString = timeString.replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace('.', ':')
    .trim();

    // Regex to capture time components
    const timePattern = /(\d{1,2})(:\d{2})?\s?(AM|PM|am|pm)?\s?(ET|EST|EDT|CT|CST|CDT|MT|MST|MDT|PT|PST|PDT|BST|GMT|UTC|CEST|CET|AEST|AEDT)?/i;
    const match = timeString.match(timePattern);

    if (!match) return "Invalid Date";

    let [_, hour, minutes, period, timezone] = match;

    // Default minutes to ":00" if not present
    minutes = minutes || ":00";

    // Construct a time string
    const formattedTime = `${hour}${minutes} ${period || ''}`.trim();

    // Timezone mapping
    const timeZoneMapping = {
      "ET": "America/New_York", "EST": "America/New_York", "EDT": "America/New_York",
      "CT": "America/Chicago", "CST": "America/Chicago", "CDT": "America/Chicago",
      "MT": "America/Denver", "MST": "America/Denver", "MDT": "America/Denver",
      "PT": "America/Los_Angeles", "PST": "America/Los_Angeles", "PDT": "America/Los_Angeles",
      "BST": "Europe/London", "GMT": "Europe/London", "UTC": "UTC",
      "CEST": "Europe/Berlin", "CET": "Europe/Berlin",
      "AEST": "Australia/Sydney", "AEDT": "Australia/Sydney"
    };

    const ianaTimeZone = timeZoneMapping[timezone?.toUpperCase()] || "UTC";

    let dt;
    if (period) {
      dt = DateTime.fromFormat(formattedTime, "h:mm a", { zone: ianaTimeZone });
    } else {
      dt = DateTime.fromFormat(formattedTime, "H:mm", { zone: ianaTimeZone });
    }

    if (!dt.isValid) return "Invalid Date";

    // Determine target timezone
    let targetZone = currentSettings.targetTimezone === 'local' ? DateTime.local().zoneName : currentSettings.targetTimezone;

    // Output formatting
    let localTime;
    if (currentSettings.timeFormat === '24h') {
        localTime = dt.setZone(targetZone).toFormat('HH:mm');
    } else {
        localTime = dt.setZone(targetZone).toFormat('h:mm a');
    }

    return localTime;
  } catch (error) {
    console.error("Error converting time:", error);
    return "Invalid Date";
  }
}

// Main function to process the page
function processPage() {
  if (!settings.extensionEnabled) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
          const parentMatch = node.parentNode && node.parentNode.nodeName.match(/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i);
          const alreadyProcessed = node.parentNode && node.parentNode.dataset && node.parentNode.dataset.processedTime;
          if (parentMatch || alreadyProcessed || !node.nodeValue.trim()) {
              return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
      }
  });

  const nodesToProcess = [];
  let node;
  while ((node = walker.nextNode())) {
      nodesToProcess.push(node);
  }

  nodesToProcess.forEach(textNode => {
      const content = textNode.nodeValue;
      const regex = new RegExp(timeRegex.source, 'gi');
      
      if (!regex.test(content)) return;
      
      regex.lastIndex = 0;
      
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      let hasMatches = false;
      
      while ((match = regex.exec(content)) !== null) {
          hasMatches = true;
          if (match.index > lastIndex) {
              fragment.appendChild(document.createTextNode(content.slice(lastIndex, match.index)));
          }
          
          const timeStr = match[0];
          const localTime = convertToLocal(timeStr, settings);
          
          if (localTime !== "Invalid Date") {
              const span = document.createElement('span');
              span.dataset.processedTime = "true";
              
              if (settings.displayMode === 'inline') {
                  span.className = 'time-converter-inline';
                  span.textContent = `${timeStr} (${localTime})`;
              } else {
                  span.className = 'time-converter';
                  span.textContent = timeStr;
                  span.setAttribute('data-tooltip', `Local Time: ${localTime}`);
              }
              fragment.appendChild(span);
          } else {
              fragment.appendChild(document.createTextNode(timeStr));
          }
          
          lastIndex = regex.lastIndex;
      }
      
      if (hasMatches) {
          if (lastIndex < content.length) {
              fragment.appendChild(document.createTextNode(content.slice(lastIndex)));
          }
          textNode.parentNode.replaceChild(fragment, textNode);
      }
  });
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

const throttledProcessPage = throttle(processPage, 1000);

// Floating Tooltip setup
let tooltipContainer = null;
function setupTooltip() {
    if (document.getElementById('time-converter-tooltip')) return;
    
    tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'time-converter-tooltip';
    tooltipContainer.style.cssText = `
      position: absolute; pointer-events: none; background: #1e293b; color: #fff;
      padding: 6px 10px; border-radius: 6px; font-size: 13px; font-family: inherit;
      font-weight: 500; white-space: nowrap; opacity: 0; visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      z-index: 2147483647;
    `;
    document.body.appendChild(tooltipContainer);

    document.addEventListener('mouseover', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('time-converter')) {
            const text = e.target.getAttribute('data-tooltip');
            if (text && tooltipContainer) {
                tooltipContainer.textContent = text;
                tooltipContainer.style.display = 'block';
                const rect = e.target.getBoundingClientRect();
                const tooltipRect = tooltipContainer.getBoundingClientRect();
                
                let topPosition = rect.top + window.scrollY - tooltipRect.height - 8;
                let leftPosition = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
                
                if (topPosition < window.scrollY) topPosition = rect.bottom + window.scrollY + 8;
                if (leftPosition < 0) leftPosition = 8;
                else if (leftPosition + tooltipRect.width > document.documentElement.clientWidth) {
                    leftPosition = document.documentElement.clientWidth - tooltipRect.width - 8;
                }

                tooltipContainer.style.top = topPosition + 'px';
                tooltipContainer.style.left = leftPosition + 'px';
                tooltipContainer.style.opacity = '1';
                tooltipContainer.style.visibility = 'visible';
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('time-converter')) {
            if (tooltipContainer) {
                tooltipContainer.style.opacity = '0';
                tooltipContainer.style.visibility = 'hidden';
            }
        }
    });
}

// Initialize
chrome.storage.sync.get(settings, (loadedSettings) => {
    settings = loadedSettings;
    if (settings.extensionEnabled) {
        setupTooltip();
        processPage();
        
        // Only observe after first manual process to avoid double firing
        const observer = new MutationObserver(throttledProcessPage);
        observer.observe(document.body, { childList: true, subtree: true });
    }
});

// Update on settings change dynamically
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        let reloadRequired = false;

        for (let [key, { newValue }] of Object.entries(changes)) {
            settings[key] = newValue !== undefined ? newValue : settings[key];
            if (key !== 'extensionEnabled') reloadRequired = true;
        }

        if (changes.extensionEnabled && changes.extensionEnabled.newValue === true) {
             processPage();
        }
    }
});

} // end of double-init guard
