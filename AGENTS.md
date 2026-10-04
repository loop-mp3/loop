# Repository Guidelines

## Project Structure & Module Organization

Loop is a Manifest V3 browser extension for YouTube Music. The main content-script behavior lives in `index.js`; `background.js` is the service worker. Reusable runtime code is under `modules/` (including Kawarp integration). `config/` contains renderer configuration and JSON presets, with preset registration in `config/presets/manifest.json`. Images, SVGs, icons, and extension CSS are in `static/`. `manifest.json` defines the extension entry points, permissions, and web-accessible resources. There is currently no dedicated test directory.

## Build, Test, and Development Commands

Install the sole npm dependency with:

```sh
npm install
```

There is no build or automated test script. For local development, open the browser’s extensions page, enable developer mode, choose **Load unpacked**, and select the repository root. After changes, reload the extension and refresh a `music.youtube.com` tab. Validate content-script behavior, background-service-worker errors, configuration loading, and console output manually.

## Coding Style & Naming Conventions

Use modern ES modules and preserve the existing browser-compatible JavaScript style. Keep indentation consistent with surrounding code (typically four spaces in `index.js`), use descriptive camelCase names for variables and functions, and use uppercase-style constants only for true fixed values. Keep user-facing strings and DOM selectors easy to locate. Use `kebab-case` for preset filenames, valid JSON for configuration, and update `config/presets/manifest.json` whenever adding a bundled preset. Avoid introducing a build step unless the manifest and development workflow are updated with it.

## Testing Guidelines

Automated coverage is not configured. For each change, manually exercise the affected YouTube Music view and playback states, then check the browser console and service-worker console for errors. Configuration changes should be tested by loading the preset, switching presets, resetting, and reloading the page. Keep JSON syntactically valid and use numeric values rather than numeric strings.

## Commit & Pull Request Guidelines

Recent commits use short imperative-style prefixes such as `feat:`, `refactor:`, and `docs:` (for example, `feat: add ...`). Follow that convention and keep each commit focused. Pull requests should explain the behavior change, identify affected files or configuration, include manual verification steps, link any relevant issue, and attach screenshots or recordings for visible UI changes.

## Security & Configuration Tips

Treat YouTube Music DOM assumptions and extension permissions as sensitive integration points. Do not commit secrets or personal data. When changing `manifest.json`, review host permissions and web-accessible resources for least privilege, and test the extension from a clean reload.
