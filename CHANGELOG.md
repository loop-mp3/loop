
All notable changes to Loop are documented here.

## [1.5] - Unreleased

### Highlights

* Improved Like/Dislike compatibility with YouTube Music's new player bar.
* Preserved Like/Dislike support for naturally changed tracks and existing player-bar implementations.
* Removed Anchor links on the loop ui for the album due to them not being exposed on the DOM.
* Implemented artist URL parsing from oEmbed.
* Implemented title loading from oEmbed to prevent UI artifacts being parsed.
* Added an optional album-name setting, disabled by default because YouTube Music does not expose reliable album metadata in every player bar.
* Added a first-run onboarding flow covering the latest changes, Kawarp preferences, mini-player behavior, and navigation-button preferences.
* Added animated transitions between onboarding steps.
* Improved track metadata accuracy by using YouTube Music's player endpoint as an additional metadata source.
* Added an optional lyrics display with dynamically synchronized, theme-aware lyrics, including instrumental-track handling.
* Added randomly selected musical note symbols for timestamp-only lyric lines.
* Added LRCLIB lyrics submission from the unavailable-lyrics view.
* Added volume controls with persisted volume settings.
* Added a fullscreen toggle to the action dock and a Loop-menu shortcut.
* Added a confirmation modal and hold-to-confirm controls for resetting Loop data.

### Fixes

* Fixed liked or disliked status not being detected when the track changed naturally.
* Fixed track liked status detection for the new YouTube Music player bar.
* Fixed track metadata failing to restore when returning to the Loop UI.
* Fixed invalid YouTube Music metadata artifacts being interpreted as track metadata.
* Fixed random strings being injected into the track title by hardcoding `Unknown track` until oEmbed metadata is available.
* Fixed album metadata retrieval for the existing player bar with a legacy player-bar fallback.
* Fixed author metadata fallback when composed artist information is unavailable.
* Fixed disabled album names still being sent to the Electron mini-player.
* Improved lyrics matching and synchronization by retrying missing results, evaluating multiple LRCLIB matches, validating timestamps, and handling instrumental tracks.
* Fixed lyrics lookups for special characters in search queries and improved lookup accuracy with the oEmbed title and resolved artist name.
* Fixed the screen-disable control and reset flow, including global Shift+Delete handling and refreshing the Loop UI after reset.

### Internal and maintenance changes

* Refactored Like/Dislike state parsing to support the new player bar action view model.
* Added additional delayed feedback-state synchronization attempts for asynchronously updated YouTube Music controls.
* Removed the legacy monochrome-theme exclusion from mini-player Kawarp.
* Added a warning notification when oEmbed fails to fetch track metadata.
* Added cached player-endpoint metadata retrieval and prefixed its error messages with the Loop source identifier.
* Normalized oEmbed author URLs to YouTube Music URLs and removed the `- Topic` suffix from oEmbed artist names.
* Synchronized mini-player state when Loop preferences are applied.
* Added a scrollable Loop menu, a Kawarp warning, and an onboarding preference for showing lyrics; adjusted action-dock placement when lyrics are hidden.
* Routed LRCLIB lyric publishing through the extension service worker to handle cross-origin requests.
* Made the reset operation clear only Loop data from local storage and moved hold-to-confirm reset handling into the confirmation modal.
* Closed the search panel when clicking outside it.

## [1.4.0] - 2026-09-29

### Highlights

* Added a native Electron mini-player with playback controls, track metadata, artwork, seeking, window controls, and theme support.
* Added automatic mini-player window handling when the Loop application is minimized or restored.
* Added mini-player state publishing and command handling between the Loop extension and Electron application.
* Added configurable mini-player behavior and a dedicated mini-player event bridge.
* Added Kawarp support to the Electron mini-player with an independent renderer instance and synchronized Kawarp state.
* Added support for retrieving the Kawarp module source from Electron so the mini-player can initialize Kawarp outside the extension page.
* Added support for YouTube Music's new player bar while preserving compatibility with the existing player bar.
* Added oEmbed-based metadata extraction for the new YouTube Music player bar.
* Added album metadata extraction from the correct player element for the new player bar.
* Updated like/dislike handling for the new player bar while restoring like/dislike support for the existing player bar.
* Added new fallback artwork assets and registered them for extension use.
* Added new Dawn gradient text assets.
* Added a browser-use warning to the extension.

### Fixes

* Fixed mini-player positioning so it opens in the bottom-right corner of the appropriate display.
* Fixed mini-player fallback artwork handling by retrieving extension fallback assets through the Electron side when direct extension-resource loading is unavailable.
* Fixed metadata handling for the new YouTube Music player bar.
* Fixed album metadata being read from an incorrect element.
* Fixed like/dislike functionality compatibility between the new and existing YouTube Music player bars.
* Preserved existing player-bar functionality while adding support for the new player-bar implementation.
* Added the required application-side IPC handling for mini-player commands and state updates.

### Internal and maintenance changes

* Added a dedicated mini-player HTML renderer and preload bridge.
* Added Electron IPC channels for opening, closing, updating, and controlling the mini-player.
* Added Electron-side Kawarp state retrieval and module-source retrieval.
* Added an independent mini-player Kawarp lifecycle so its renderer can be controlled separately from the main Loop instance.
* Added cached fallback-artwork resolution and Blob URL handling in the mini-player renderer.
* Added additional fallback artwork resources and manifest entries.
* Added Dawn gradient SVG assets.
* Updated README documentation and corrected README wording.
* Bumped the Loop extension and application versions to `1.4.0`.


## [1.3.0] - 2026-09-24

### Highlights

- Cross-platformed the Loop desktop app to macOS and Linux, with new CI build files for each platform.
- Added screen sleep support with platform capability checks that verify sleep support before toggling the screen off and notify the user when it is unavailable.
- Added platform exposure to the Loop client, including platform retrieval via preload message events, so the extension can detect the host platform.
- Added a new configuration preset.

### Fixes

- Fixed a missing semi-colon that obstructed the execution of the sleep support check.
- Fixed an invalid top-level async statement by wrapping the sleep check into a function.
- Fixed missing author information in `package.json`.

### Internal and maintenance changes

- Streamlined the screen sleep support check and tooltip handling with improved user feedback.
- Refactored the sleep capability check and simplified the `isSleepSupported` function and its IPC handler.
- Enhanced message handling in the preload script.
- Updated the configuration documentation.

## [1.2.0] - 2026-09-21

### Highlights

- Added a Kawarp configuration editor with bundled shader presets, custom config uploads, persistent settings, and reset support.
- Added custom preset naming and author attribution, local persistence, deletion controls, and theme-aware preset styling.
- Added screen power controls and a Loop visibility toggle with updated keyboard shortcuts.
- Added shortcuts for reloading Loop and its resources, plus persisted previous/next navigation preferences.
- Added a warning notification when Kawarp is enabled and close protection when music is playing to help prevent accidental app closure.
- Implemented muting of active playback when a close is attempted, with a notification asking the user to pause before closing Loop.
- Added a configuration guide and Kawarp source references.

### Fixes

- Fixed Kawarp module loading after moving the renderer from `static/` to `modules/`.
- Fixed artwork fallback behavior when a playing track's artwork URL changes without a video ID.
- Fixed track synchronization edge cases and corrected inverted track-navigation shortcuts.
- Fixed screen-disable shortcut bindings and improved feedback in Electron environments.
- Styled toast notifications for the Default, Monochrome, and Catppuccin themes.

### Internal and maintenance changes

- Bumped the extension version to `1.1.2`.
- Updated the config editor reference link to the new configuration guide.
- Added bundled Kawarp preset manifests and configuration documentation.

## [1.1.1] - 2026-9-15

### Fixes


- Fixed the google account authentication status checks
- Fixed manifest version mismatches which caused update popups in updated clients
- Fixed inverted shortcuts for track navigation

## [1.1.0] - 2026-09-14

### Highlights

- Added selectable visual themes, including Default, Monochrome, and Catppuccin, with persistent theme preferences.
- Added custom CSS presets and restored the animated artwork background toggle label.
- Improved track synchronization with media and navigation observers so the player bar, artwork, and metadata update reliably when songs change.
- Made artist and album metadata clickable links to their corresponding YouTube Music pages.
- Updated previous/next track shortcuts to `Shift+N` and `Shift+P`.
- Replaced YouTube Music branding with Loop branding, including a custom logo and favicon.
- Added local fallback assets for the custom logo and favicon when remote assets are unavailable.

### Fixes

- Fixed artwork and track information updates that could remain stale after a song change.
- Fixed update-check false positives by comparing the advertised version with the installed version.
- Fixed the monochrome action bar state so active controls are visually distinguishable.
- Fixed queue and search panel flashing and improved their theme-aware styling.
- Hid unnecessary YouTube Music interface buttons and restored the behavior across dynamically rendered content.

### Internal and maintenance changes

- Added dynamic observation for media elements, player state changes, navigation events, and YouTube Music DOM updates.
- Added bundled fallback artwork, logo, and favicon resources for more resilient extension rendering.

## [1.0.0] - 2026-09-10

Loop v1 is the first complete release of the keyboard-first YouTube Music player extension.

### Highlights

- A focused player experience layered over YouTube Music, with responsive sizing and a minimal visual system.
- Track artwork parsing with metadata-aware display, local fallback artwork, playback-aware artwork rotation, and a spinning artwork treatment.
- Search and queue panels with improved layering, visibility, and track navigation.
- A configurable keyboard-first workflow, including search (`Ctrl+K`), playback controls, previous/next track navigation, seeking, and timeline controls.
- Kawarp-powered animated backgrounds with shader configuration.
- Persistent settings storage.
- YouTube Music account detection with sign-in warnings and authenticated action controls.
- An action dock for like, dislike, and subscribe actions on the current track.
- Window title synchronization with the currently playing track.
- Update checking and notification support for the extension.
- Discord activity publishing with current playback context and corrected activity text/image formatting.

### Fixes

- Corrected track metadata parsing so valid metadata is used instead of falling back to `unknown`.
- Fixed artwork URL parsing and improved fallback behavior when artwork is unavailable.
- Fixed like/dislike state synchronization for the current track, including stale state updates.
- Prevented the action dock from appearing when nothing is playing.
- Reduced false-positive YouTube Music sign-in detection by using the player configuration and more reliable account signals.
- Avoided authentication warnings when account status is temporarily unavailable.
- Handled invalidated extension contexts more safely.
- Hid scrollbars for intentionally scroll-free UI elements.
- Corrected the search shortcut implementation so `Ctrl+K` is actually wired to search.
- Fixed Discord activity state and large-image text formatting.

### Internal and maintenance changes

- Extracted update URL retrieval into a dedicated function.
- Simplified authentication status handling.
- Removed action-dock dragging for a more predictable layout.
- Disabled the default visual effect that was not ready for the default experience.
- Added extension-host permissions, service-worker update handling, bundled fallback assets, and Kawarp resources required by the v1 package.

### Installation

Load the extension directory as an unpacked Manifest V3 extension, then open YouTube Music. The extension targets `https://music.youtube.com/*`.

[1.0.0]: https://github.com/loop-mp3/loop/releases/tag/v1.0.0
[1.1.0]: https://github.com/loop-mp3/loop/releases/tag/v1.1.0
[1.1.1]: https://github.com/loop-mp3/loop/releases/tag/v1.1.1
[1.1.2]: https://github.com/loop-mp3/loop/releases/tag/v1.2.0
[1.3.0]: https://github.com/loop-mp3/loop/releases/tag/v1.3.0
[1.4.0]: https://github.com/loop-mp3/loop/releases/tag/v1.4.0
[1.5.0]: https://github.com/loop-mp3/loop/releases/tag/v1.5.0
