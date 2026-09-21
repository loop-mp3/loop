# Kawarp Configuration Guide

Loop loads its default Kawarp configuration from `config/shader.json`. Presets are stored in `config/presets/` and are listed in `config/presets/manifest.json`.

## Configuration format

The recommended format is:

```json
{
  "version": "2.0",
  "settings": {
    "enabled": true,
    "kawarpOpacity": 0.57,
    "kawarpWarpIntensity": 1,
    "kawarpBlurPasses": 7,
    "kawarpAnimationSpeed": 0.3,
    "kawarpTransitionDuration": 1000,
    "kawarpSaturation": 2,
    "kawarpDithering": 0.004,
    "audioResponsive": true,
    "audioSpeedMultiplier": 4.5,
    "showOnBrowsePages": false,
    "enableAnimatedArt": true
  }
}
```

`version` should be kept at `"2.0"` Its a kwarp library requiremet.
The `settings` object is recommended. Custom files may also contain the settings directly at the top level.

Unknown settings are preserved when the file is loaded, but only settings used by Loop or the Kawarp renderer will affect the player.

## Settings

### General

| Setting | Type | Description |
| --- | --- | --- |
| `enabled` | boolean | Enables or disables the Kawarp background. |
| `kawarpOpacity` | number | Base background opacity. |
| `showOnBrowsePages` | boolean | Shows the animated background on browse pages. |
| `enableAnimatedArt` | boolean | Enables animated artwork processing. |
| `pauseOnInactive` | boolean | Pauses animation while the page is inactive. |
| `showLogs` | boolean | Enables Kawarp diagnostic logging. |

### Animation and image processing

| Setting | Type | Range / Description |
| --- | --- | --- |
| `kawarpWarpIntensity` | number | Warp strength, clamped from `0` to `1`. |
| `kawarpBlurPasses` | integer | Number of blur passes. Higher values cost more GPU time. |
| `kawarpAnimationSpeed` | number | Animation speed, clamped from `0.1` to `5`. |
| `kawarpTransitionDuration` | number | Artwork transition duration in milliseconds, clamped from `0` to `5000`. |
| `kawarpSaturation` | number | Color saturation, clamped from `0` to `3`. `1` is neutral. |
| `kawarpDithering` | number | Dither amount, clamped from `0` to `0.1`. |
| `scale` | number | Background scale. |
| `opacity` | number | Final canvas opacity. When present, this takes precedence over `kawarpOpacity`. |

### Audio response

| Setting | Type | Description |
| --- | --- | --- |
| `audioResponsive` | boolean | Makes the background react to audio. |
| `audioSpeedMultiplier` | number | Multiplier for audio-driven animation speed. |
| `audioBeatThreshold` | number | Sensitivity threshold for beat detection. Lower values react more easily. |
| `kawarpAudioScaleBoost` | number | Boost applied to audio-driven Kawarp scaling. |
| `audioScaleBoost` | number | Boost applied to audio-driven artwork scaling. |

### Advanced shader settings

These settings are used by the shader/artwork effects when the corresponding shader mode is active:

| Setting | Type | Description |
| --- | --- | --- |
| `shaderType` | string | Shader mode identifier, normally `"kawarp"`. |
| `distortion` | number | Distortion strength. |
| `swirl` | number | Swirl strength. |
| `offsetX` | number | Horizontal shader offset. |
| `offsetY` | number | Vertical shader offset. |
| `rotation` | number | Shader rotation. |
| `speed` | number | Advanced shader animation speed. |
| `boostDullColors` | boolean | Boosts colors detected as dull. |
| `vibrantSaturationThreshold` | number | Saturation threshold used to classify vibrant colors. |
| `vibrantRatioThreshold` | number | Ratio threshold used by color boosting. |
| `boostIntensity` | number | Strength of dull-color boosting. |
| `rememberAlbumSettings` | boolean | Keeps advanced artwork settings per album when supported. |

## Creating a preset

1. Create a JSON file inside `config/presets/`.
2. Put the settings inside a `settings` object.
3. Add its display name and filename to `config/presets/manifest.json`.

Example preset entry:

```json
{
  "My Preset": "my-preset.json"
}
```

Example preset file:

```json
{
  "version": "2.0",
  "settings": {
    "enabled": true,
    "kawarpWarpIntensity": 0.8,
    "kawarpAnimationSpeed": 1.2,
    "kawarpSaturation": 1.5,
    "audioResponsive": true
  }
}
```

The manifest key is the name displayed in the config modal. The filename must match the preset file exactly.

## Loading and persistence

- The config modal loads the bundled presets from the manifest.
- Selecting a preset applies it immediately.
- Uploaded custom configs are applied immediately as well.
- The active configuration is saved in browser `localStorage` under `loop.mp3.kawarp-config`.
- Selecting **Reset** removes the saved configuration and restores the default settings.
- Changes may require re-enabling Kawarp if a renderer setting does not update immediately.

Keep JSON valid and use numbers instead of numeric strings. Invalid files are rejected by the config loader.
