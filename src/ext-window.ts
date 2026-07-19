import Shell from 'gi://Shell';
import Meta from 'gi://Meta';

import * as Config from 'resource:///org/gnome/shell/misc/config.js';

import {
	scaleDimensions,
	toDimensions,
	type RectangleDimensions,
} from './ext-geometry.js';

const SHELL_MAJOR = parseInt(Config.PACKAGE_VERSION.split('.')[0]);

// A window and every operation run against it. Geometry is read live, never
// cached: a window keeps moving after `moveTo` returns.
export class BifocalWindow {
	// The state manager keys its records on this, so it outlives the wrapper
	readonly window: Meta.Window;

	constructor(window: Meta.Window) {
		this.window = window;
	}

	static focused(): BifocalWindow {
		const window = Shell.Global.get().workspace_manager
			.get_active_workspace()
			.list_windows()
			.find((window: Meta.Window) => window.has_focus());

		if (!window) {
			throw new Error('Cannot find active window');
		}

		return new BifocalWindow(window);
	}

	get monitor(): number {
		return this.window.get_monitor();
	}

	get rect(): RectangleDimensions {
		return toDimensions(this.window.get_frame_rect());
	}

	get workArea(): RectangleDimensions {
		return this.#workAreaFor(this.monitor);
	}

	get isMaximized(): boolean {
		return this.window.maximized_horizontally && this.window.maximized_vertically;
	}

	// Id of the owning application, ignoring non-"normal" windows like dialogs and popups
	get appId(): string | null {
		if (this.window.get_window_type() !== Meta.WindowType.NORMAL) {
			return null;
		}

		const app = Shell.WindowTracker.get_default().get_window_app(this.window);

		return app?.get_id() ?? this.window.get_wm_class() ?? null;
	}

	// Next size up from the current one, wrapping back round to the smallest
	getResizeVal(dimensionKey: 'h' | 'w', fractions: number[]) {
		const workspaceAxis = this.workArea[dimensionKey];
		const windowAxis = this.rect[dimensionKey];
		const sizes = fractions.map((f) => Math.floor(workspaceAxis * f));

		for (const size of sizes) {
			if (windowAxis < size) {
				return size;
			}
		}

		return sizes[0];
	}

	moveTo({ x, y, w, h }: RectangleDimensions) {
		this.window.move_resize_frame(false, x, y, w, h);
	}

	maximize() {
		if (SHELL_MAJOR >= 49) {
			// maximize takes no parameters since GNOME 49
			(this.window as unknown as { maximize(): void }).maximize();
		} else {
			// avoid EGO-C49-003 false positive from static analyzer
			const flags = (Meta.MaximizeFlags as unknown as Record<string, number>)['BOTH'];
			(this.window as unknown as { maximize(f: number): void }).maximize(flags);
		}
	}

	unmaximize() {
		if (SHELL_MAJOR >= 49) {
			// unmaximize takes no parameters since GNOME 49
			(this.window as unknown as { unmaximize(): void }).unmaximize();
		} else {
			// avoid EGO-C49-003 false positive from static analyzer
			const flags = (Meta.MaximizeFlags as unknown as Record<string, number>)['BOTH'];
			(this.window as unknown as { unmaximize(f: number): void }).unmaximize(flags);
		}
	}

	scaleFromMonitor(rect: RectangleDimensions, fromMonitor: number): RectangleDimensions {
		const monitorCount = Shell.Global.get().display.get_n_monitors();

		// The monitor it came from may have been unplugged since
		if (this.monitor === fromMonitor || fromMonitor < 0 || fromMonitor >= monitorCount) {
			return rect;
		}

		return scaleDimensions(rect, this.#workAreaFor(fromMonitor), this.workArea);
	}

	rectOnNeighborMonitor(direction: Meta.DisplayDirection): RectangleDimensions | null {
		const display = Shell.Global.get().display;
		const targetMonitor = display.get_monitor_neighbor_index(this.monitor, direction);
		if (targetMonitor < 0) {
			return null;
		}

		return scaleDimensions(this.rect, this.workArea, this.#workAreaFor(targetMonitor));
	}

	#workAreaFor(monitor: number): RectangleDimensions {
		return toDimensions(this.window.get_workspace().get_work_area_for_monitor(monitor));
	}
}
