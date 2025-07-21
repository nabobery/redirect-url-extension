# URL Redirect Extension

A Chrome extension that automatically redirects URLs based on configurable rules, such as adding prefixes to specific patterns. Built with React, TypeScript, and Webpack.

## Features

- **Configurable Redirect Rules**: Create rules with patterns (simple or regex) and prefixes to automatically redirect matching URLs.
- **Enable/Disable Rules**: Toggle individual rules or the entire extension.
- **Redirect Logging**: View a history of redirects with details like original/redirected URLs and timestamps.
- **Notifications**: Optional notifications for each redirect.
- **Popup UI**: Manage rules, view logs, and configure settings from the extension popup.
- **Content Script Monitoring**: Handles dynamic URL changes in single-page applications (SPAs).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/url-redirect-extension.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `dist/` folder.

## Usage

1. Click the extension icon to open the popup.
2. In the "Rules" tab, add new rules by specifying a name, pattern (e.g., `*.example.com`), replacement (e.g., `proxy.` or a regex template like `$1ss$2`), and whether it's a regex pattern.
3. Enable/disable the extension or individual rules in the "Settings" tab.
4. View redirect history in the "Logs" tab.
5. When visiting a matching URL, the extension will automatically redirect and (optionally) notify you.

## Example Rules

Here are some practical examples of redirect rules you can set up in the extension. These demonstrate both simple and regex-based transformations.

### Example 1: Insert 'ss' into YouTube URLs (for Downloaders)

- **Rule Name**: YouTube Saver
- **URL Pattern**: `^(https?://(?:www\.)?)youtube\.com(.*)$` (matches YouTube URLs, making 'www.' optional)
- **Replacement**: `$1ssyoutube.com$2` (inserts 'ss' into the domain while preserving the protocol and path)
- **Use Regular Expression**: Checked

This transforms `https://www.youtube.com/watch?v=JUaOFaI2UnY` to `https://www.ssyoutube.com/watch?v=JUaOFaI2UnY` (a common downloader site).

### Example 2: Prepend a Service to Medium URLs (e.g., for Bypass)

- **Rule Name**: Medium Bypass
- **URL Pattern**: `^(https?://(?:www\.)?medium\.com/.*)$` (matches full Medium article URLs)
- **Replacement**: `https://freedium.cfd/$1` (prepends the service URL to the original)
- **Use Regular Expression**: Checked

This transforms `https://medium.com/some-article` to `https://freedium.cfd/https://medium.com/some-article`.

Tips: Use tools like regex101.com to test patterns. For non-regex rules, the replacement acts as a simple prefix (e.g., adding a domain or path).

## Configuration

- **Settings**: Toggle extension, logging, and notifications via the popup.
- **Rules**: Patterns can be simple (with `*` wildcards) or regex. Prefixes can be domains, paths, or full URLs.
- Storage: All settings and logs are stored in Chrome's sync storage.

## Development

- **Scripts**:
  - `npm run dev`: Build in development mode with watch.
  - `npm run build`: Production build.
  - `npm run clean`: Remove `dist/` folder.
  - `npm run typecheck`: Run TypeScript type checking.
- **Tech Stack**:
  - Frontend: React + TypeScript
  - Build: Webpack + ts-loader
  - Linting: ESLint
- To test: After building, reload the extension in Chrome.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Developed by Avinash Changrani.
