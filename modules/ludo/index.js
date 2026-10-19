// ludo the lightweight lyrics rendering engine used by loop
// braccato is still required for setting up the dom, and syncronisation
export function createLudoLyricsRenderer(lines, view) {
    const state = lines.map(() => ({ scale: 0.85, opacity: 0.2, marginTop: 0, marginBottom: 0, y: 0, velocity: {} }));
    let activeIndex = -1;
    let frameId = 0;
    let lastTime = 0;
    let scrollTop = view.scrollTop;
    let scrollVelocity = 0;

    const targetsFor = (index) => {
        const distance = Math.abs(index - activeIndex);
        return distance === 0
            ? { scale: 1, opacity: 1, marginTop: 0.7, marginBottom: 1.4 }
            : distance === 1
                ? { scale: 0.95, opacity: 0.4, marginTop: 0, marginBottom: 0.75 }
                : { scale: 0.85, opacity: 0.2, marginTop: 0, marginBottom: 0.75 };
    };
    const paint = (index) => {
        const line = lines[index]?.lyricElement;
        const item = state[index];
        if (!line || !item) return;
        line.classList.toggle("blyrics--active", index === activeIndex);
        line.style.scale = item.scale.toFixed(4);
        line.style.opacity = Math.max(0, Math.min(1, item.opacity)).toFixed(3);
        line.style.marginTop = `${Math.max(0, item.marginTop * 16).toFixed(1)}px`;
        line.style.marginBottom = `${Math.max(0, item.marginBottom * 16).toFixed(1)}px`;
        line.style.translate = `0 ${item.y.toFixed(1)}px`;
        line.style.willChange = "scale, opacity, translate, margin";
    };
    const scrollTarget = () => {
        const line = lines[activeIndex]?.lyricElement;
        if (!line || !view.clientHeight) return null;
        return Math.max(0, Math.min(view.scrollHeight - view.clientHeight, line.offsetTop - view.clientHeight * 0.28));
    };
    const stop = () => {
        cancelAnimationFrame(frameId);
        frameId = 0;
    };
    const animate = (now) => {
        const delta = Math.min(0.032, lastTime ? (now - lastTime) / 1000 : 0.016);
        lastTime = now;
        let moving = false;
        for (let index = 0; index < state.length; index++) {
            const item = state[index];
            const target = targetsFor(index);
            for (const key of ["scale", "opacity", "marginTop", "marginBottom"]) {
                const velocity = item.velocity[key] || 0;
                const acceleration = 300 * (target[key] - item[key]) - 26 * velocity;
                item.velocity[key] = velocity + acceleration * delta;
                item[key] += item.velocity[key] * delta;
                if (Math.abs(target[key] - item[key]) > 0.001 || Math.abs(item.velocity[key]) > 0.01) moving = true;
            }
            paint(index);
        }
        const targetScroll = scrollTarget();
        if (targetScroll !== null) {
            const acceleration = 300 * (targetScroll - scrollTop) - 26 * scrollVelocity;
            scrollVelocity += acceleration * delta;
            scrollTop += scrollVelocity * delta;
            view.scrollTop = scrollTop;
            if (Math.abs(targetScroll - scrollTop) > 0.4 || Math.abs(scrollVelocity) > 6) moving = true;
        }
        if (moving) frameId = requestAnimationFrame(animate);
        else stop();
    };
    const start = () => {
        if (!frameId) {
            lastTime = 0;
            frameId = requestAnimationFrame(animate);
        }
    };
    return {
        tick(currentTime) {
            let nextActiveIndex = -1;
            lines.forEach((line, index) => {
                if (line.time <= currentTime + 0.05) nextActiveIndex = index;
            });
            if (nextActiveIndex !== activeIndex) {
                activeIndex = nextActiveIndex;
                scrollTop = view.scrollTop;
            }
            start();
        },
        destroy() {
            stop();
            lines.forEach(({ lyricElement }) => {
                lyricElement.classList.remove("blyrics--active");
                lyricElement.style.removeProperty("scale");
                lyricElement.style.removeProperty("opacity");
                lyricElement.style.removeProperty("margin-top");
                lyricElement.style.removeProperty("margin-bottom");
                lyricElement.style.removeProperty("translate");
                lyricElement.style.removeProperty("will-change");
            });
        },
    };
}

export function createLudoLyricsController() {
    let renderer;
    return {
        apply({ enabled, lines, view }) {
            renderer?.destroy();
            renderer = enabled && view ? createLudoLyricsRenderer(lines, view) : undefined;
        },
        tick(currentTime) {
            renderer?.tick(currentTime);
        },
        destroy() {
            renderer?.destroy();
            renderer = undefined;
        },
    };
}
