export const STAGE_LEAD_S = 0.5;
export const STAGE_HANDOFF_S = 0.12;
export const STAGE_OVERLAP_S = 0.15;
export function overlapsPrevious(items, index) {
    const previous = items[index - 1];
    return (previous !== undefined &&
        previous.kind === "line" &&
        items[index].kind !== "blank" &&
        items[index].start < previous.end - STAGE_OVERLAP_S);
}
export function stageEnterTimes(items) {
    return items.map((item, index) => {
        const early = item.start - STAGE_LEAD_S;
        const previous = items[index - 1];
        // An outro note would otherwise keep the credits off stage until the song ends.
        if (item.kind === "credits" && previous?.kind === "instrumental")
            return (previous.start + previous.end) / 2;
        if (previous?.kind !== "line" || overlapsPrevious(items, index))
            return early;
        return Math.max(early, Math.min(previous.end, item.start) - STAGE_HANDOFF_S);
    });
}
export function planStage(items, timeS) {
    const enterTimes = stageEnterTimes(items);
    let current = -1;
    enterTimes.forEach((enterTime, index) => {
        if (enterTime <= timeS)
            current = index;
    });
    const roles = items.map((_, index) => index < current ? "gone" : index > current ? "queued" : "current");
    if (current < 0)
        return roles;
    const previous = items[current - 1];
    if (previous?.kind === "line" && overlapsPrevious(items, current) && timeS < previous.end) {
        roles[current - 1] = "previous";
    }
    return roles;
}
/**
 * A wrapped `fit-content` box fills the width offered, so the plate follows the text instead. The rects
 * miss printed `::before` labels, so the span is widened to what the alignment guarantees.
 */
export function stageTextSpan(offsetLeft, offsetWidth, box, textRects, padding, originX) {
    const whole = { left: offsetLeft, width: offsetWidth };
    if (box.width <= 0 || offsetWidth <= 0 || originX === 1)
        return whole;
    const scale = box.width / offsetWidth;
    let start = Number.POSITIVE_INFINITY;
    let end = Number.NEGATIVE_INFINITY;
    for (const rect of textRects) {
        if (rect.width <= 0)
            continue;
        start = Math.min(start, (rect.x - box.x) / scale);
        end = Math.max(end, (rect.x + rect.width - box.x) / scale);
    }
    if (start > end)
        return whole;
    const contentLeft = padding.left;
    const contentRight = offsetWidth - padding.right;
    if (originX === 0) {
        start = contentLeft;
    }
    else {
        const centre = (contentLeft + contentRight) / 2;
        const half = Math.max(end - centre, centre - start);
        start = centre - half;
        end = centre + half;
    }
    const left = Math.max(0, start - padding.left);
    const right = Math.min(offsetWidth, end + padding.right);
    return { left: offsetLeft + left, width: right - left };
}
function unionBox(box, next) {
    if (box === null)
        return next;
    const x = Math.min(box.x, next.x);
    const y = Math.min(box.y, next.y);
    return {
        x,
        y,
        width: Math.max(box.x + box.width, next.x + next.width) - x,
        height: Math.max(box.y + box.height, next.y + next.height) - y,
    };
}
/** Where a line waits below the floor, and where it rises from as it enters. */
export function queuedStageY(stageHeight, height, gap) {
    return stageHeight - height + gap;
}
export function layoutStage(roles, items, metrics, previousY, geometry) {
    const { stageHeight, gap } = geometry;
    const current = roles.indexOf("current");
    const currentY = current >= 0 ? stageHeight - metrics[current].height : stageHeight;
    const placements = roles.map((role, index) => {
        const { height } = metrics[index];
        switch (role) {
            case "current":
                return { y: currentY, visible: true };
            case "previous":
                return { y: currentY - gap - height, visible: true };
            case "queued":
                return { y: queuedStageY(stageHeight, height, gap), visible: false };
            case "gone":
                return { y: previousY[index] ?? currentY, visible: false };
        }
    });
    let box = null;
    roles.forEach((role, index) => {
        const { kind } = items[index];
        if ((role !== "current" && role !== "previous") || kind === "instrumental" || kind === "blank")
            return;
        const { height, left, width, originX } = metrics[index];
        const scale = geometry.activeScale;
        box = unionBox(box, {
            x: left + width * originX * (1 - scale),
            y: placements[index].y + (height * (1 - scale)) / 2,
            width: width * scale,
            height: height * scale,
        });
    });
    return { placements, box };
}
