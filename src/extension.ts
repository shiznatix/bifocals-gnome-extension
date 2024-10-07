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

class Resizable {
	window: Meta.Window;
	rectangles: Rectangles;

	constructor() {
		const window = global.workspace_manager
			.get_active_workspace()
			.list_windows()
			.find(window => window.has_focus());
		
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

	getResizeVal(dimensionKey: keyof RectangleDimensions) {
		const workspaceAxis = this.rectangles.workspace[dimensionKey];
		const windowAxis = this.rectangles.window[dimensionKey];
		const size1 = workspaceAxis / 3;
		const size2 = workspaceAxis / 2;
		const size3 = size1 * 2;

		if (windowAxis < size1) {
			return size1;
		}
		if (windowAxis < size2) {
			return size2;
		}
		if (windowAxis < size3) {
			return size3;
		}

		return size1;
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
			const fourthWidth = rectangles.workspace.w / 4;
			const fourthHeight = rectangles.workspace.h / 4;
			const xStart = rectangles.workspace.x + (rectangles.workspace.w - (rectangles.workspace.w - fourthWidth)) / 2;
			const yStart = (rectangles.workspace.h - (rectangles.workspace.h - fourthHeight)) / 2;
			const newWidth = rectangles.workspace.w - fourthWidth;
			const newHeight = rectangles.workspace.h - fourthHeight;

			window.unmaximize(Meta.MaximizeFlags.BOTH);
			window.move_frame(false, xStart, yStart);
			window.move_resize_frame(false, xStart, yStart, newWidth, newHeight);
		});

		this.#addKeybinding('toggle-left', (resizable) => {
			const { rectangles, window } = resizable;
			const newWidth = resizable.getResizeVal('w');

			window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
			// window.unmaximize(Meta.MaximizeFlags.VERTICAL);
			window.move_frame(false, rectangles.workspace.x, 0);
			window.move_resize_frame(false, rectangles.workspace.x, 0, newWidth, rectangles.window.h);
			window.maximize(Meta.MaximizeFlags.VERTICAL);
		});

		this.#addKeybinding('toggle-right', (resizable) => {
			const { rectangles, window } = resizable;
			const newWidth = resizable.getResizeVal('w');
			const xStart = rectangles.workspace.x + rectangles.workspace.w - newWidth;

			window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
			// window.unmaximize(Meta.MaximizeFlags.VERTICAL);
			window.move_frame(false, xStart, 0);
			window.move_resize_frame(false, xStart, 0, newWidth, rectangles.window.h);
			window.maximize(Meta.MaximizeFlags.VERTICAL);
		});

		this.#addKeybinding('toggle-top', (resizable) => {
			const { rectangles, window } = resizable;
			const newHeight = resizable.getResizeVal('h');

			window.unmaximize(Meta.MaximizeFlags.VERTICAL);
			window.move_frame(false, rectangles.window.x, 0);
			window.move_resize_frame(false, rectangles.window.x, 0, rectangles.window.w, newHeight);
		});

		this.#addKeybinding('toggle-bottom', (resizable) => {
			const { rectangles, window } = resizable;
			const newHeight = resizable.getResizeVal('h');
			const yStart = rectangles.workspace.h - newHeight + 100;

			window.unmaximize(Meta.MaximizeFlags.VERTICAL);
			window.move_frame(false, rectangles.window.x, yStart);
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
