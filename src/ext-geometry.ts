import type Mtk from 'gi://Mtk';

// Geometry within this many pixels of the requested rect counts as unchanged
const RECT_TOLERANCE_PX = 20;

// A window edge this close to the work area edge counts as sitting on it. Windows
// that quantise their own size never land exactly on it.
const PIN_TOLERANCE_PX = 20;

// A resize never takes a window below this on either axis
const MIN_WINDOW_PX = 100;

export type Anchor = 'left' | 'right' | 'top' | 'bottom';

export interface RectangleDimensions {
	h: number;
	w: number;
	x: number;
	y: number;
}

// A window and its work area along one axis, plus which of its two edges hold
interface ResizeAxis {
	areaPos: number;
	areaSize: number;
	endPinned: boolean;
	pos: number;
	size: number;
	startPinned: boolean;
}

export const makeDimensions = (x: number, y: number, w: number, h: number): RectangleDimensions => ({
	h, w, x, y,
});

export const toDimensions = (rect: Mtk.Rectangle): RectangleDimensions =>
	makeDimensions(rect.x, rect.y, rect.width, rect.height);

export const rectsMatch = (a: RectangleDimensions, b: RectangleDimensions) =>
	Math.abs(a.x - b.x) <= RECT_TOLERANCE_PX
	&& Math.abs(a.y - b.y) <= RECT_TOLERANCE_PX
	&& Math.abs(a.w - b.w) <= RECT_TOLERANCE_PX
	&& Math.abs(a.h - b.h) <= RECT_TOLERANCE_PX;

// Scale a rect between work areas, keeping its relative size and position
export const scaleDimensions = (
	rect: RectangleDimensions,
	from: RectangleDimensions,
	to: RectangleDimensions,
): RectangleDimensions => {
	const relX = (rect.x - from.x) / from.w;
	const relY = (rect.y - from.y) / from.h;
	const relWidth = rect.w / from.w;
	const relHeight = rect.h / from.h;

	const w = Math.min(Math.round(relWidth * to.w), to.w);
	const h = Math.min(Math.round(relHeight * to.h), to.h);
	const x = Math.min(Math.max(to.x + Math.round(relX * to.w), to.x), to.x + to.w - w);
	const y = Math.min(Math.max(to.y + Math.round(relY * to.h), to.y), to.y + to.h - h);

	return makeDimensions(x, y, w, h);
};

export const rectsEqual = (a: RectangleDimensions, b: RectangleDimensions) =>
	a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

// `a` sits on, or past, `b`
const isPinned = (a: number, b: number) => a - b <= PIN_TOLERANCE_PX;

// One axis of a resize. A pinned edge holds, so the whole change lands on the
// free one; with both free the change is split and the centre holds.
const resizeAxis = (axis: ResizeAxis, step: number): [pos: number, size: number] => {
	const { pos, size, areaPos, areaSize, startPinned, endPinned } = axis;

	// Boxed in on both sides, so there is nothing to give
	if (startPinned && endPinned) {
		return [pos, size];
	}

	const areaEnd = areaPos + areaSize;
	const room = (startPinned ? 0 : Math.max(pos - areaPos, 0))
		+ (endPinned ? 0 : Math.max(areaEnd - pos - size, 0));
	// A window already under the minimum is left at its size rather than grown up to it
	const newSize = step > 0
		? Math.min(size + step, size + room)
		: Math.max(size + step, Math.min(size, MIN_WINDOW_PX));

	if (newSize === size) {
		return [pos, size];
	}

	if (startPinned) {
		return [pos, newSize];
	}

	if (endPinned) {
		return [pos + size - newSize, newSize];
	}

	// Clamped, so a window with more room on one side than the other spills the
	// rest of the step onto that side instead of growing off the work area
	const centred = pos + Math.floor((size - newSize) / 2);

	return [Math.min(Math.max(centred, areaPos), areaEnd - newSize), newSize];
};

// Grow (positive steps) or shrink (negative) a window within its work area. Edges
// sitting on the work area hold, so an anchored window keeps its anchor and only
// its free sides move.
export const resizeDimensions = (
	rect: RectangleDimensions,
	workArea: RectangleDimensions,
	stepW: number,
	stepH: number,
): RectangleDimensions => {
	const left = isPinned(rect.x, workArea.x);
	const right = isPinned(workArea.x + workArea.w, rect.x + rect.w);
	const top = isPinned(rect.y, workArea.y);
	const bottom = isPinned(workArea.y + workArea.h, rect.y + rect.h);
	// A window filling the work area has no free side to work from, so none of its
	// sides hold and it comes in from all four at once
	const filled = left && right && top && bottom;
	const held = (edge: boolean) => !filled && edge;

	const [x, w] = resizeAxis({
		pos: rect.x,
		size: rect.w,
		areaPos: workArea.x,
		areaSize: workArea.w,
		startPinned: held(left),
		endPinned: held(right),
	}, stepW);
	const [y, h] = resizeAxis({
		pos: rect.y,
		size: rect.h,
		areaPos: workArea.y,
		areaSize: workArea.h,
		startPinned: held(top),
		endPinned: held(bottom),
	}, stepH);

	return makeDimensions(x, y, w, h);
};
