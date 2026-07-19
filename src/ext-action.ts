import type Meta from 'gi://Meta';

import { Anchor, makeDimensions, type RectangleDimensions } from './ext-geometry.js';
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
			// Vertical anchors spread `rect`, which carries the window's own y
			dimensions.y = workArea.y;
		} else if (anchor === 'bottom') {
			dimensions.y = workArea.y + workArea.h - value;
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
		this.#stateMngr?.save(window, window.workArea);
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
		if (wasMaximized) {
			window.unmaximize();
		}

		const dimens = this.#stateMngr?.getPrevious(window, wasMaximized);
		if (dimens) {
			window.moveTo(dimens);
		}
	}
}
