// Ludo: the lightweight lyrics rendering engine used by Loop.
// Braccato remains responsible for creating the DOM and synchronisation data.
export function createLudoLyricsRenderer(lines, view) {
    const elements = lines.map(({ lyricElement }) => lyricElement);
    const count = elements.length;
    const scale = new Float32Array(count).fill(0.85);
    const opacity = new Float32Array(count).fill(0.2);
    const scaleVelocity = new Float32Array(count);
    const opacityVelocity = new Float32Array(count);
    const frameWindow = view.ownerDocument?.defaultView || globalThis;
    const requestFrame = frameWindow.requestAnimationFrame.bind(frameWindow);
    const cancelFrame = frameWindow.cancelAnimationFrame.bind(frameWindow);
    const marginInactiveTop = "0px";
    const marginInactiveBottom = "12px";
    const marginActiveTop = "11.2px";
    const marginActiveBottom = "22.4px";

    let activeIndex = -1;
    let frameId = 0;
    let lastTime = 0;
    let scrollTop = view.scrollTop;
    let scrollVelocity = 0;
    let targetScroll = null;
    let destroyed = false;
    const animatedIndices = new Set();

    const markAnimated = (index) => {
        if (index >= 0 && index < count) animatedIndices.add(index);
    };

    const markActiveNeighborhood = (index) => {
        markAnimated(index - 1);
        markAnimated(index);
        markAnimated(index + 1);
    };


    // Margins are applied only when the active line changes. Animating margins forces layout on
    // every frame, while scale and opacity remain compositor-friendly.
    for (const line of elements) {
        if (!line) continue;
        line.style.marginTop = marginInactiveTop;
        line.style.marginBottom = marginInactiveBottom;
        line.style.willChange = "transform, opacity";
    }

    const paint = (index) => {
        const line = elements[index];
        if (!line) return;
        // Scale and opacity are compositor-friendly properties.
        line.style.scale = scale[index].toFixed(4);
        line.style.opacity = opacity[index].toFixed(3);
    };

    const updateActiveSpacing = (previousIndex, nextIndex) => {
        if (elements[previousIndex]) {
            elements[previousIndex].style.marginTop = marginInactiveTop;
            elements[previousIndex].style.marginBottom = marginInactiveBottom;
        }
        if (elements[nextIndex]) {
            elements[nextIndex].style.marginTop = marginActiveTop;
            elements[nextIndex].style.marginBottom = marginActiveBottom;
        }
        targetScroll = null;
    };

    const getScrollTarget = () => {
        if (targetScroll !== null) return targetScroll;
        const line = elements[activeIndex];
        if (!line || !view.clientHeight) return null;
        targetScroll = Math.max(
            0,
            Math.min(view.scrollHeight - view.clientHeight, line.offsetTop - view.clientHeight * 0.28),
        );
        return targetScroll;
    };

    const stop = () => {
        if (frameId) cancelFrame(frameId);
        frameId = 0;
        lastTime = 0;
    };

    const animate = (now) => {
        frameId = 0;
        if (destroyed) return;

        const delta = Math.min(0.032, lastTime ? (now - lastTime) / 1000 : 0.016);
        lastTime = now;
        let moving = animatedIndices.size > 0;

        for (const index of animatedIndices) {
            const distance = Math.abs(index - activeIndex);
            const targetScale = distance === 0 ? 1 : distance === 1 ? 0.95 : 0.85;
            const targetOpacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.2;
            let velocity = scaleVelocity[index];
            velocity += (300 * (targetScale - scale[index]) - 26 * velocity) * delta;
            scaleVelocity[index] = velocity;
            scale[index] += velocity * delta;

            velocity = opacityVelocity[index];
            velocity += (300 * (targetOpacity - opacity[index]) - 26 * velocity) * delta;
            opacityVelocity[index] = velocity;
            opacity[index] += velocity * delta;
            const settled = Math.abs(targetScale - scale[index]) <= 0.001 &&
                Math.abs(scaleVelocity[index]) <= 0.01 &&
                Math.abs(targetOpacity - opacity[index]) <= 0.001 &&
                Math.abs(opacityVelocity[index]) <= 0.01;
            if (settled) animatedIndices.delete(index);
            else moving = true;
            paint(index);
        }

        const nextScrollTarget = getScrollTarget();
        if (nextScrollTarget !== null) {
            const acceleration = 300 * (nextScrollTarget - scrollTop) - 26 * scrollVelocity;
            scrollVelocity += acceleration * delta;
            scrollTop += scrollVelocity * delta;
            if (Math.abs(view.scrollTop - scrollTop) > 0.1) view.scrollTop = scrollTop;
            if (Math.abs(nextScrollTarget - scrollTop) > 0.4 || Math.abs(scrollVelocity) > 6) moving = true;
        }

        if (moving) frameId = requestFrame(animate);
        else stop();
    };

    const start = () => {
        if (!frameId && !destroyed) {
            lastTime = 0;
            frameId = requestFrame(animate);
        }
    };

    return {
        tick(currentTime) {
            if (destroyed) return;
            let nextActiveIndex = -1;
            // Lines are ordered by time, so stop at the first future line instead of scanning the
            // entire lyric list on every playback update.
            for (let index = 0; index < lines.length; index++) {
                if (lines[index].time > currentTime + 0.05) break;
                nextActiveIndex = index;
            }
            if (nextActiveIndex !== activeIndex) {
                const previousIndex = activeIndex;
                activeIndex = nextActiveIndex;
                scrollTop = view.scrollTop;
                scrollVelocity = 0;
                updateActiveSpacing(previousIndex, activeIndex);
                markActiveNeighborhood(previousIndex);
                markActiveNeighborhood(activeIndex);
                if (elements[previousIndex]) elements[previousIndex].classList.remove("blyrics--active");
                if (elements[activeIndex]) elements[activeIndex].classList.add("blyrics--active");
            }
            // Layout can change when translations arrive, so refresh the scroll target at each
            // playback update, but never force a layout read on every animation frame.
            targetScroll = null;
            start();
        },
        destroy() {
            destroyed = true;
            stop();
            for (const line of elements) {
                if (!line) continue;
                line.classList.remove("blyrics--active");
                line.style.removeProperty("scale");
                line.style.removeProperty("opacity");
                line.style.removeProperty("margin-top");
                line.style.removeProperty("margin-bottom");
                line.style.removeProperty("will-change");
            }
        },
    };
}

export function createLudoLyricsController() {
    let renderer;
    let appliedLines;
    let appliedView;
    let appliedEnabled = false;
    return {
        apply({ enabled, lines, view }) {
            if (renderer && enabled === appliedEnabled && lines === appliedLines && view === appliedView) return;
            renderer?.destroy();
            appliedEnabled = enabled;
            appliedLines = lines;
            appliedView = view;
            renderer = enabled && view ? createLudoLyricsRenderer(lines, view) : undefined;
        },
        tick(currentTime) {
            renderer?.tick(currentTime);
        },
        destroy() {
            renderer?.destroy();
            renderer = undefined;
            appliedLines = undefined;
            appliedView = undefined;
            appliedEnabled = false;
        },
    };
}
