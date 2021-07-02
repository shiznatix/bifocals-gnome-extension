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
	const [displayWidth, displayHeight] = window.get_display().get_size();

	return {
		window: {
			h: rect.height,
			w: rect.width,
		},
		display: {
			h: displayHeight,
			w: displayWidth,
		},
	};
}

function getResizeWidth(displayWidth, windowWidth) {
	const size1 = displayWidth / 3;
	const size2 = displayWidth / 2;
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

	Main.wm.addKeybinding('fullscreen', settings, flag, mode, () => {
		const window = getActiveWindow();

		window.maximize(Meta.MaximizeFlags.BOTH);
	});

	Main.wm.addKeybinding('midscreen', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		const fourthWidth = rects.display.w / 4;
		const fourthHeight = rects.display.h / 4;
		const xStart = (rects.display.w - (rects.display.w - fourthWidth)) / 2;
		const yStart = (rects.display.h - (rects.display.h - fourthHeight)) / 2;
		const newWidth = rects.display.w - fourthWidth;
		const newHeight = rects.display.h - fourthHeight;

		window.unmaximize(Meta.MaximizeFlags.BOTH);
		window.move_frame(false, xStart, yStart);
		window.move_resize_frame(false, xStart, yStart, newWidth, newHeight);
	});

	Main.wm.addKeybinding('toggle-left', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		const newWidth = getResizeWidth(rects.display.w, rects.window.w);

		window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
		window.move_frame(false, 0, 0);
		window.move_resize_frame(false, 0, 0, newWidth, rects.window.h);
		window.maximize(Meta.MaximizeFlags.VERTICAL);
	});

	Main.wm.addKeybinding('toggle-right', settings, flag, mode, () => {
		const window = getActiveWindow();
		const rects = getRectangles(window);
		const newWidth = getResizeWidth(rects.display.w, rects.window.w);
		const xStart = rects.display.w - newWidth;

		window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
		window.move_frame(false, xStart, 0);
		window.move_resize_frame(false, xStart, 0, newWidth, rects.window.h);
		window.maximize(Meta.MaximizeFlags.VERTICAL);
	});
}

// eslint-disable-next-line no-unused-vars
function disable() {
	Main.wm.removeKeybinding('fullscreen');
	Main.wm.removeKeybinding('midscreen');
	Main.wm.removeKeybinding('toggle-left');
	Main.wm.removeKeybinding('toggle-right');
}
