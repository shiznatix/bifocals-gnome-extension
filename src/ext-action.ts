import type Meta from 'gi://Meta';

import {
	Anchor,
	makeDimensions,
	rectsEqual,
	resizeDimensions,
	type RectangleDimensions,
} from './ext-geometry.js';
import { BifocalState } from './ext-state.js';
import { BifocalWindow } from './ext-window.js';

// Every action a keybinding can run. Owns the state manager, which is optional.
export class BifocalAction {
	#stateMngr: BifocalState | null = null;

	stateEnabled(): boolean {
		return this.#stateMngr !== null;
	}

	setStateEnabled(enabled: boolean) {
		if (enabled === this.stateEnabled()) {
			return;
		}

		if (enabled) {
			this.#stateMngr = new BifocalState();
			return;
		}

		this.#stateMngr?.destroy();
		this.#stateMngr = null;
	}

	midscreen(fractions: number[]) {
		const window = BifocalWindow.focused();
		const workArea = window.workArea;
		const w = window.getResizeVal('w', fractions);
		const h = window.getResizeVal('h', fractions);

		this.#apply(window, makeDimensions(
			workArea.x + Math.floor((workArea.w - w) / 2),
			workArea.y + Math.floor((workArea.h - h) / 2),
			w, h,
		));
	}

	anchored(anchor: Anchor, fractions: number[]) {
		const window = BifocalWindow.focused();
		const { rect, workArea } = window;
		const key = ['left', 'right'].includes(anchor) ? 'w' : 'h';
		const value = window.getResizeVal(key, fractions);
		const dimensions = { ...(key === 'w' ? workArea : rect), [key]: value };
		if (anchor === 'right') {
			dimensions.x = workArea.x + workArea.w - value;
		} else if (anchor === 'top') {
			dimensions.y = workArea.y;
		} else if (anchor === 'bottom') {
			dimensions.y = workArea.y + workArea.h - value;
		}

		this.#apply(window, dimensions);
	}

	// A positive fraction of the work area grows the window, a negative one shrinks it
	resizeBy(fraction: number) {
		const window = BifocalWindow.focused();
		const { rect, workArea } = window;
		const dimensions = resizeDimensions(
			rect,
			workArea,
			Math.round(workArea.w * fraction),
			Math.round(workArea.h * fraction),
		);

		// Already as big or as small as it goes, so leave the restore state alone
		if (rectsEqual(dimensions, rect)) {
			return;
		}

		this.#apply(window, dimensions);
	}

	moveToMonitor(direction: Meta.DisplayDirection) {
		const window = BifocalWindow.focused();
		// `move_to_monitor` only shifts position, so big windows overlay on screens and get snapped back.
		const target = window.rectOnNeighborMonitor(direction);

		if (target) {
			this.#apply(window, target);
		}
	}

	toggleMaximize() {
		const window = BifocalWindow.focused();
		this.#stateMngr?.remember(window);

		if (window.isMaximized) {
			window.unmaximize();
		} else {
			window.maximize();
		}

		// Unlike a move, the shell picks the geometry here, so record what the
		// window actually got rather than what was asked for
		this.#stateMngr?.save(window, window.rect);
	}

	restore() {
		this.#restore(BifocalWindow.focused());
	}

	destroy() {
		this.#stateMngr?.destroy();
		this.#stateMngr = null;
	}

	#apply(window: BifocalWindow, dimens: RectangleDimensions) {
		this.#stateMngr?.remember(window);
		window.unmaximize();
		window.moveTo(dimens);
		this.#stateMngr?.save(window, dimens);
	}

	#restore(window: BifocalWindow) {
		if (!this.stateEnabled()) {
			return;
		}

		const wasMaximized = window.isMaximized;
		const dimens = this.#stateMngr?.getPrevious(window, wasMaximized);
		if (!dimens) {
			return;
		}

		if (wasMaximized) {
			window.unmaximize();
		}

		window.moveTo(dimens);
	}
}
