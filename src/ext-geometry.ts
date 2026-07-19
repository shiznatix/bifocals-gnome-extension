import type Mtk from 'gi://Mtk';

// Geometry within this many pixels of the requested rect counts as unchanged
const RECT_TOLERANCE_PX = 20;

export type Anchor = 'left' | 'right' | 'top' | 'bottom';

export interface RectangleDimensions {
	h: number;
	w: number;
	x: number;
	y: number;
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
