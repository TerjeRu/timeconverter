# Time Converter Extension

Automatically detect and convert timezones on the fly right in your browser.

## Features
- **Smart Time Detection**: Detects common formats (`10:00 AM EST`, `14:30`, `10.30 BST`) accurately without highlighting standalone numbers out of context.
- **Hover & Inline Modes**: View converted times instantly via a sleek, CSS-injected hover tooltip or have them injected directly next to the original text.
- **Customizable Experience**: A modern, responsive settings page lets you toggle the extension globally, choose between 12-hour/24-hour formats, and manually override target timezones.
- **Layout Safe**: Built with the `TreeWalker` API and absolute-positioned JS tooltips to ensure website layouts and CSS `overflow` properties are never broken.

## Installation
1. Clone or download this repository.
2. Navigate to `chrome://extensions` in Chromium/Chrome.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing the extension files.

## Built With
- **Vanilla JavaScript & CSS** for lightweight, blazing fast execution without bulky frameworks.
- **[Luxon](https://moment.github.io/luxon/)** for robust time parsing and accurate timezone resolution.

## License
This project is licensed under the MIT License.
