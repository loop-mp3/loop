// The renderer declares the theme settings its own code reads, so a setting and the code that
// consumes it stay together. Applying settings reports whether the lyrics need reloading; the host
// decides what to do about it.
//
// What arrives here is compiled CSS rather than theme source. Better Lyrics themes are written in
// RICS and compiled with the `rics` package first, which is the consumer's dependency and not this
// module's: nothing under this directory ships with any.
let keyToSettingMap = new Map();
// -- Setting --------------------------------------------
// `registerThemeSetting` returns one of these, so a consumer of this leaf has to be able to spell
// it. `@public` keeps knip off an export this repo only ever names through inference.
/** @public */
export class Setting {
    type;
    value;
    defaultValue;
    requiresLyricReload;
    manuallySet = false;
    constructor(type, value, defaultValue, requiresLyricReload) {
        this.type = type;
        this.value = value;
        this.defaultValue = defaultValue;
        this.requiresLyricReload = requiresLyricReload;
    }
    getNumberValue() {
        return this.value;
    }
    getBooleanValue() {
        return this.value;
    }
    getStringValue() {
        return this.value;
    }
    isManuallySet() {
        return this.manuallySet;
    }
    setManuallySet(manuallySet) {
        this.manuallySet = manuallySet;
    }
}
// -- Parsing a theme --------------------------------------------
// A theme is a stylesheet, and it configures the renderer through comments inside it, in the form
// `blyrics-some-key = value;`. Only inside comments: everything outside one is CSS the browser is
// going to read, and a stylesheet must not be able to configure the module by accident.
const THEME_COMMENT_PATTERN = /\/\*([\s\S]*?)\*\//g;
const THEME_SETTING_PATTERN = /(blyrics-[\w-]+)\s*=\s*([^;]+);/g;
/**
 * The `blyrics-*` configuration a compiled stylesheet declares, in declaration order, last one
 * winning. Lives here rather than beside the renderer because it depends on nothing and its only
 * consumer is `setThemeSettings`: a consumer that compiles a theme somewhere the renderer does not
 * run can read the settings out of it without pulling the engine in.
 */
export function parseThemeConfig(css) {
    const config = new Map();
    // `matchAll` works off a copy of the pattern, so neither of the two shared at module scope can
    // carry a `lastIndex` out of one stylesheet and into the next however these loops are nested.
    // Driving them with `exec` is correct too, as long as every loop is left running to exhaustion:
    // this is written not to depend on that.
    for (const [, comment] of css.matchAll(THEME_COMMENT_PATTERN)) {
        for (const [, key, value] of comment.matchAll(THEME_SETTING_PATTERN)) {
            config.set(key, value.trim());
        }
    }
    return config;
}
// -- Registry --------------------------------------------
// Registration runs at module scope, which evaluates once per bundle however many views that bundle
// is rendering, so a setting's value is shared by all of them rather than held per instance. The
// unit is a bundle rather than a document: this extension bundles the module into the isolated world
// and the page world separately, and each of those registries needs its own theme applied to it or
// one view renders against defaults while the other renders against the theme.
export function registerThemeSetting(key, defaultValue, requiresLyricReload = false) {
    let type = typeof defaultValue;
    if (type !== "number" && type !== "boolean" && type !== "string") {
        throw new Error("Invalid type for theme setting");
    }
    let setting = new Setting(type, defaultValue, defaultValue, requiresLyricReload);
    keyToSettingMap.set(key, setting);
    return setting;
}
// Returns whether a setting flagged requiresLyricReload changed, so the caller can reload.
export function setThemeSettings(map) {
    let needsLyricReload = false;
    map.forEach((value, key) => {
        let setting = keyToSettingMap.get(key);
        if (setting) {
            let lastValue = setting.value;
            if (setting.type === "number") {
                const parsed = parseFloat(value);
                if (isNaN(parsed)) {
                    setting.value = setting.defaultValue;
                    setting.setManuallySet(false);
                }
                else {
                    setting.value = parsed;
                    setting.setManuallySet(true);
                }
            }
            else if (setting.type === "boolean") {
                setting.value = value.toLowerCase() === "true";
                setting.setManuallySet(true);
            }
            else {
                setting.value = value;
                setting.setManuallySet(true);
            }
            if (setting.requiresLyricReload && lastValue !== setting.value) {
                needsLyricReload = true;
            }
        }
    });
    // second pass reset undefined values to their default values
    for (const [key, setting] of keyToSettingMap.entries()) {
        if (!map.has(key) && setting.value !== setting.defaultValue) {
            setting.value = setting.defaultValue;
            setting.setManuallySet(false);
            if (setting.requiresLyricReload) {
                needsLyricReload = true;
            }
        }
        else if (!map.has(key)) {
            setting.setManuallySet(false);
        }
    }
    return needsLyricReload;
}
