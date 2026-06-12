import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

interface RectangleDimensions {
	h: number;
	w: number;
	x: number;
	y: number;
}
interface Rectangles {
	window: RectangleDimensions;
	workspace: RectangleDimensions;
}
type Fractions = [number, number, number];

class Resizable {
	window: Meta.Window;
	rectangles: Rectangles;

	constructor() {
		const window = Shell.Global.get().workspace_manager
			.get_active_workspace()
			.list_windows()
			.find((window: Meta.Window) => window.has_focus());

		if (!window) {
			throw new Error('Cannot find active window');
		}

		this.window = window;

		const rect = this.window.get_frame_rect();
		const monitor = this.window.get_monitor();
		const workspace = this.window.get_workspace();
		const monitorWorkArea = workspace.get_work_area_for_monitor(monitor);

		this.rectangles = {
			window: {
				h: rect.height,
				w: rect.width,
				x: rect.x,
				y: rect.y,
			},
			workspace: {
				h: monitorWorkArea.height,
				w: monitorWorkArea.width,
				x: monitorWorkArea.x,
				y: monitorWorkArea.y,
			},
		};
	}

	getResizeVal(dimensionKey: keyof RectangleDimensions, fractions: Fractions) {
		const workspaceAxis = this.rectangles.workspace[dimensionKey];
		const windowAxis = this.rectangles.window[dimensionKey];
		const [s1, s2, s3] = fractions.map(f => Math.floor(workspaceAxis * f)) as Fractions;

		if (windowAxis < s1) {
			return s1;
		}
		if (windowAxis < s2) {
			return s2;
		}
		if (windowAxis < s3) {
			return s3;
		}

		return s1;
	}
}

export default class BifocalsExtension extends Extension {
	static KEYBINDING_MODE = Shell.ActionMode.NORMAL;
	static KEYBINDING_FLAG = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;

	#settings!: Gio.Settings | null;

	enable() {
		this.#settings = this.getSettings();

		this.#addKeybinding('midscreen', (resizable) => {
			const { rectangles, window } = resizable;
			const fractions = this.#getFractions('resize-midscreen');
			const newWidth = resizable.getResizeVal('w', fractions);
			const newHeight = resizable.getResizeVal('h', fractions);
			const xStart = rectangles.workspace.x + Math.floor((rectangles.workspace.w - newWidth) / 2);
			const yStart = rectangles.workspace.y + Math.floor((rectangles.workspace.h - newHeight) / 2);

			window.unmaximize(Meta.MaximizeFlags.BOTH);
			window.move_resize_frame(false, xStart, yStart, newWidth, newHeight);
		});

		this.#addKeybinding('toggle-left', (resizable) => {
			const { rectangles, window } = resizable;
			const fractions = this.#getFractions('resize-left-right');
			const newWidth = resizable.getResizeVal('w', fractions);

			window.unmaximize(Meta.MaximizeFlags.BOTH);
			window.move_resize_frame(false, rectangles.workspace.x, rectangles.workspace.y, newWidth, rectangles.workspace.h);
		});

		this.#addKeybinding('toggle-right', (resizable) => {
			const { rectangles, window } = resizable;
			const fractions = this.#getFractions('resize-left-right');
			const newWidth = resizable.getResizeVal('w', fractions);
			const xStart = rectangles.workspace.x + rectangles.workspace.w - newWidth;

			window.unmaximize(Meta.MaximizeFlags.BOTH);
			window.move_resize_frame(false, xStart, rectangles.workspace.y, newWidth, rectangles.workspace.h);
		});

		this.#addKeybinding('toggle-top', (resizable) => {
			const { rectangles, window } = resizable;
			const fractions = this.#getFractions('resize-top-bottom');
			const newHeight = resizable.getResizeVal('h', fractions);

			window.unmaximize(Meta.MaximizeFlags.BOTH);
			window.move_resize_frame(false, rectangles.window.x, rectangles.workspace.y, rectangles.window.w, newHeight);
		});

		this.#addKeybinding('toggle-bottom', (resizable) => {
			const { rectangles, window } = resizable;
			const fractions = this.#getFractions('resize-top-bottom');
			const newHeight = resizable.getResizeVal('h', fractions);
			const yStart = rectangles.workspace.y + rectangles.workspace.h - newHeight;

			window.unmaximize(Meta.MaximizeFlags.BOTH);
			window.move_resize_frame(false, rectangles.window.x, yStart, rectangles.window.w, newHeight);
		});
	}

	disable() {
		this.#removeKeybinding('midscreen');
		this.#removeKeybinding('toggle-left');
		this.#removeKeybinding('toggle-right');
		this.#removeKeybinding('toggle-top');
		this.#removeKeybinding('toggle-bottom');
		this.#settings = null;
	}

	#getFractions(key: string): Fractions {
		return [
			this.#settings!.get_int(`${key}-small`) / 100,
			this.#settings!.get_int(`${key}-medium`) / 100,
			this.#settings!.get_int(`${key}-large`) / 100,
		];
	}

	#addKeybinding(name: string, handler: (resizable: Resizable) => void) {
		if (!this.#settings) {
			console.error('Cannot bind key, `settings` is not initialized');
			return;
		}

		Main.wm.addKeybinding(
			name,
			this.#settings,
			BifocalsExtension.KEYBINDING_FLAG,
			BifocalsExtension.KEYBINDING_MODE,
			() => {
				try {
					return handler(new Resizable());
				} catch (error) {
					console.error(`Keybinding ${name} callback error`, error);
				}
			},
		);
	}

	#removeKeybinding(name: string) {
		Main.wm.removeKeybinding(name);
	}
}
