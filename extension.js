const { Gio, Shell, Meta } = imports.gi;
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();

function getSettings() {
	const GioSSS = Gio.SettingsSchemaSource;
	const schemaSource = GioSSS.new_from_directory(
		Me.dir.get_child('schemas').get_path(),
		GioSSS.get_default(),
		false,
	);
	const schemaObj = schemaSource.lookup('org.gnome.shell.extensions.bifocals', true);

	if (!schemaObj) {
		throw new Error('cannot find schemas');
	}

	return new Gio.Settings({ settings_schema: schemaObj });
}

function getActiveWindow() {
	return global.workspace_manager.get_active_workspace().list_windows().find(window => window.has_focus());
}

function getRectangles(window) {
	const rect = window.get_frame_rect();
	const monitor = window.get_monitor();
	const workspace = window.get_workspace();
	const monitorWorkArea = workspace.get_work_area_for_monitor(monitor);

	return {
		window: {
			h: rect.height,
			w: rect.width,
		},
		workspace: {
			x: monitorWorkArea.x,
			h: monitorWorkArea.height,
			w: monitorWorkArea.width,
		},
	};
}

function getResizeWidth(workspaceWidth, windowWidth) {
	const size1 = workspaceWidth / 3;
	const size2 = workspaceWidth / 2;
	const size3 = size1 * 2;
	const c = 10;

	if (windowWidth < size1 - c) {
		return size1;
	}
	if (windowWidth < size2 - c) {
		return size2;
	}
	if (windowWidth < size3 - c) {
		return size3;
	}

	return size1;
}

// eslint-disable-next-line no-unused-vars
function init() {
}

// eslint-disable-next-line no-unused-vars
function enable() {
	const mode = Shell.ActionMode.NORMAL;
	const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;
	const settings = getSettings();

	Main.wm.addKeybinding('midscreen', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		const fourthWidth = rects.workspace.w / 4;
		const fourthHeight = rects.workspace.h / 4;
		const xStart = rects.workspace.x + (rects.workspace.w - (rects.workspace.w - fourthWidth)) / 2;
		const yStart = (rects.workspace.h - (rects.workspace.h - fourthHeight)) / 2;
		const newWidth = rects.workspace.w - fourthWidth;
		const newHeight = rects.workspace.h - fourthHeight;

		window.unmaximize(Meta.MaximizeFlags.BOTH);
		window.move_frame(false, xStart, yStart);
		window.move_resize_frame(false, xStart, yStart, newWidth, newHeight);
	});

	Main.wm.addKeybinding('toggle-left', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		const newWidth = getResizeWidth(rects.workspace.w, rects.window.w);

		window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
		window.move_frame(false, rects.workspace.x, 0);
		window.move_resize_frame(false, rects.workspace.x, 0, newWidth, rects.window.h);
		window.maximize(Meta.MaximizeFlags.VERTICAL);
	});

	Main.wm.addKeybinding('toggle-right', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		const newWidth = getResizeWidth(rects.workspace.w, rects.window.w);
		const xStart = rects.workspace.x + rects.workspace.w - newWidth;

		window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
		window.move_frame(false, xStart, 0);
		window.move_resize_frame(false, xStart, 0, newWidth, rects.window.h);
		window.maximize(Meta.MaximizeFlags.VERTICAL);
	});
}

// eslint-disable-next-line no-unused-vars
function disable() {
	Main.wm.removeKeybinding('midscreen');
	Main.wm.removeKeybinding('toggle-left');
	Main.wm.removeKeybinding('toggle-right');
}
