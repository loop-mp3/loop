# Changelog

All notable changes to Loop are documented here.

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
