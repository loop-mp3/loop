export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
}
export function roundedMs(value) {
    return Math.round(value * 10) / 10;
}
/**
 * Converts CSS duration value to milliseconds.
 *
 * @returns Duration in milliseconds
 */
export function toMs(cssDuration) {
    if (!cssDuration)
        return 0;
    if (cssDuration.endsWith("ms")) {
        return parseFloat(cssDuration.slice(0, -2));
    }
    else if (cssDuration.endsWith("s")) {
        return parseFloat(cssDuration.slice(0, -1)) * 1000;
    }
    return 0;
}
/**
 * Forces a reflow/repaint of the element by accessing its offsetHeight.
 *
 * @param elt - Element to reflow
 */
export function reflow(elt) {
    void elt.offsetHeight;
}
/**
 * Returns the position and dimensions of a child element relative to its parent.
 *
 * @param parent - The parent element
 * @param child - The child element
 * @returns Rectangle with relative position and dimensions
 */
function getRelativeBounds(parent, child) {
    const parentBound = parent.getBoundingClientRect();
    const childBound = child.getBoundingClientRect();
    return new DOMRect(childBound.x - parentBound.x, childBound.y - parentBound.y, childBound.width, childBound.height);
}
/**
 * Returns layout position/dimensions without including transient CSS transforms.
 * This is important for lyric scroll math because line-scale and per-line scroll
 * animations are transform based.
 */
export function getRelativeLayoutBounds(parent, child) {
    let x = 0;
    let y = 0;
    let element = child;
    while (element && element !== parent) {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    }
    if (element !== parent) {
        return getRelativeBounds(parent, child);
    }
    return new DOMRect(x, y, Math.max(child.offsetWidth, child.scrollWidth), Math.max(child.offsetHeight, child.scrollHeight));
}
