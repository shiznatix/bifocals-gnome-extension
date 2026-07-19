import GLib from 'gi://GLib';
import type Meta from 'gi://Meta';

import { rectsMatch, type RectangleDimensions } from './ext-geometry.js';
import type { BifocalWindow } from './ext-window.js';

interface RestoreState {
	// Where the window was before the first Bifocals action
	baseline: RectangleDimensions;
	// Monitor `baseline` came from, it may be on another now
	baselineMonitor: number;
	// What Bifocals last set, to tell its own moves from the user's
	lastApplied: RectangleDimensions;
	pendingSync: number | null;
}
interface AppRestoreState {
	baseline: RectangleDimensions;
	baselineMonitor: number;
}

// How long to wait before reading the geometry a window "settled" at
const SETTLE_TIMEOUT_MS = 250;

// Remembers where windows came from. Records only, the actions do the moving.
export class BifocalState {
	// Weak, so closed windows are collected on their own
	#restoreStates: WeakMap<Meta.Window, RestoreState> = new WeakMap();
	// Lets a window opened later reach the baseline of an earlier one
	#appRestoreStates: Map<string, AppRestoreState> = new Map();
	#settleTimeouts: Set<number> = new Set();

	// Must run before the window moves. Only re-baselines if the user moved it since.
	remember(window: BifocalWindow) {
		const current = window.rect;
		const state = this.#restoreStates.get(window.window);

		if (state && rectsMatch(current, state.lastApplied)) {
			return;
		}

		const baselineMonitor = window.monitor;
		this.#restoreStates.set(window.window, {
			baseline: current,
			baselineMonitor,
			lastApplied: current,
			pendingSync: null,
		});

		// App default, for new windows of the same app
		const appId = window.appId;
		if (appId) {
			this.#appRestoreStates.set(appId, { baseline: current, baselineMonitor });
		}
	}

	save(window: BifocalWindow, dimensions: RectangleDimensions) {
		const state = this.#restoreStates.get(window.window);
		if (!state) {
			return;
		}

		state.lastApplied = dimensions;
		this.#syncApplied(window, state);
	}

	getPrevious(window: BifocalWindow, wasMaximized: boolean): RectangleDimensions | null {
		const state = this.#restoreStates.get(window.window);
		if (!state) {
			// Nothing for this window, fall back to the app default
			return this.#appRestoreTarget(window);
		}

		this.#dropState(window, state);
		if (!wasMaximized && !rectsMatch(window.rect, state.lastApplied)) {
			// Moved by hand since, so it is already where the user wants it
			return null;
		}

		return window.scaleFromMonitor(state.baseline, state.baselineMonitor);
	}

	destroy() {
		for (const id of this.#settleTimeouts) {
			GLib.source_remove(id);
		}
		this.#settleTimeouts.clear();
		this.#restoreStates = new WeakMap();
		this.#appRestoreStates.clear();
	}

	// Kept, not consumed: every new window of the app can reach it
	#appRestoreTarget(window: BifocalWindow): RectangleDimensions | null {
		const appId = window.appId;
		const state = appId ? this.#appRestoreStates.get(appId) : null;

		if (!state) {
			return null;
		}

		return window.scaleFromMonitor(state.baseline, state.baselineMonitor);
	}

	// Wayland applies moves asynchronously, so re-read once the window settles
	#syncApplied(window: BifocalWindow, state: RestoreState) {
		// Cycling sizes fires actions faster than a window settles
		this.#cancelSync(state);

		const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SETTLE_TIMEOUT_MS, () => {
			state.pendingSync = null;
			this.#settleTimeouts.delete(id);

			// Restored or closed since, so the state is stale
			if (this.#restoreStates.get(window.window) === state) {
				state.lastApplied = window.rect;
			}

			return GLib.SOURCE_REMOVE;
		});

		state.pendingSync = id;
		this.#settleTimeouts.add(id);
	}

	#cancelSync(state: RestoreState) {
		if (state.pendingSync === null) {
			return;
		}

		GLib.source_remove(state.pendingSync);
		this.#settleTimeouts.delete(state.pendingSync);
		state.pendingSync = null;
	}

	#dropState(window: BifocalWindow, state: RestoreState) {
		this.#cancelSync(state);
		this.#restoreStates.delete(window.window);
	}
}
