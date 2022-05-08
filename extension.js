const { Gio, Shell, Meta } = imports.gi;
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Phi = 1.618033988749895;
const Fourth = 1.0/4.0;
const Third = 1.0/3.0;
const Half = 1.0/2.0;
const Pad = 20;

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
		target: {
			h: monitorWorkArea.height * (Phi - 1),
			w: monitorWorkArea.width * (2 - Phi),
		},
	};
}

function getResizeWidth(workspaceWidth, windowWidth) {
	const size1 = workspaceWidth * Fourth;
	const size2 = workspaceWidth * Third;
	const size3 = workspaceWidth * (2 - Phi);
	const size4 = workspaceWidth * Half;
	const size5 = workspaceWidth * (Phi - 1);

	if (windowWidth + 1 < size1) {
		return size1;
	}
	if (windowWidth + 1 < size2) {
		return size2;
	}
	if (windowWidth + 1 < size3) {
		return size3;
	}
	if (windowWidth + 1 < size4) {
		return size4;
	}
	if (windowWidth + 1 < size5) {
		return size5;
	}

	return size1;
}

function centerWindow(window, workspace, height, width) {
	const x = workspace.x + (workspace.w - width) / 2;
	const y = (workspace.h - height) / 2;
	window.unmaximize(Meta.MaximizeFlags.BOTH);
	window.move_frame(false, x, y);
	window.move_resize_frame(false, x, y, width, height);
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
		if (rects.target.h < rects.window.h + 1) {
			centerWindow(window, rects.workspace, rects.target.h, rects.target.w);
		} else {
			centerWindow(window, rects.workspace, rects.window.h, rects.window.w);
		}
	});

	Main.wm.addKeybinding('toggle-left', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		if (rects.target.h < rects.window.h + 1 || rects.target.w < rects.window.w + 1) {
		  const newWidth = getResizeWidth(rects.workspace.w, rects.window.w);
			window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
			window.move_frame(false, rects.workspace.x, 0);
			window.move_resize_frame(false, rects.workspace.x, 0, newWidth, rects.window.h);
			window.maximize(Meta.MaximizeFlags.VERTICAL);
		} else {
			var w = rects.workspace.w/2 - 3*rects.window.w/2 - Pad;
			if (w<1) { w = 1; }
			var h = rects.workspace.h/2 - rects.window.h/2;
			if (h<1) { h = 1; }
			window.move_frame(false, w, h);
		}
	});

	Main.wm.addKeybinding('toggle-right', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		if (rects.target.h < rects.window.h + 1) {
		  const newWidth = getResizeWidth(rects.workspace.w, rects.window.w);
		  const xStart = rects.workspace.x + rects.workspace.w - newWidth;
		  window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
		  window.move_frame(false, xStart, 0);
		  window.move_resize_frame(false, xStart, 0, newWidth, rects.window.h);
		  window.maximize(Meta.MaximizeFlags.VERTICAL);
		}else{
			var w = rects.workspace.w/2 + rects.window.w/2 + Pad;
			if (w<1) { w = 1; }
			var h = rects.workspace.h/2 - rects.window.h/2;
			if (h<1) { h = 1; }
			window.move_frame(false, w, h);
		}
	});
}

// eslint-disable-next-line no-unused-vars
function disable() {
	Main.wm.removeKeybinding('midscreen');
	Main.wm.removeKeybinding('toggle-left');
	Main.wm.removeKeybinding('toggle-right');
}
