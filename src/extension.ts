import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { BifocalAction } from './ext-action.js';

const RESTORE_KEY = 'restore-window';
const STEP_KEY = 'resize-step';

// Shortcuts renamed in 5.0, as [old, new]
const RENAMED_KEYS: [string, string][] = [
	['midscreen', 'cycle-midscreen'],
	['toggle-left', 'cycle-left'],
	['toggle-right', 'cycle-right'],
	['toggle-top', 'cycle-top'],
	['toggle-bottom', 'cycle-bottom'],
];

export default class BifocalsExtension extends Extension {
	#settings: Gio.Settings | null = null;
	#action: BifocalAction | null = null;
	#boundKeys: string[] = []; // Only the keys actually added

	enable() {
		const settings = this.getSettings();
		const action = new BifocalAction();
		this.#settings = settings;
		this.#action = action;

		// Before the keybindings, so they bind the migrated values
		this.#migrateRenamedKeys(settings);
		this.#syncStateEnabled(settings, action);
		settings.connectObject(
			`changed::${RESTORE_KEY}`,
			() => this.#syncStateEnabled(settings, action),
			this,
		);

		this.#addResizeKeybinding(settings, 'cycle-midscreen', 'resize-midscreen',
			(fractions) => action.midscreen(fractions));
		this.#addResizeKeybinding(settings, 'cycle-left', 'resize-left-right',
			(fractions) => action.anchored('left', fractions));
		this.#addResizeKeybinding(settings, 'cycle-right', 'resize-left-right',
			(fractions) => action.anchored('right', fractions));
		this.#addResizeKeybinding(settings, 'cycle-top', 'resize-top-bottom',
			(fractions) => action.anchored('top', fractions));
		this.#addResizeKeybinding(settings, 'cycle-bottom', 'resize-top-bottom',
			(fractions) => action.anchored('bottom', fractions));

		this.#addKeybinding(settings, 'increase-size',
			() => action.resizeBy(this.#getStep(settings)));
		this.#addKeybinding(settings, 'decrease-size',
			() => action.resizeBy(-this.#getStep(settings)));

		this.#addKeybinding(settings, 'move-monitor-left',
			() => action.moveToMonitor(Meta.DisplayDirection.LEFT));
		this.#addKeybinding(settings, 'move-monitor-right',
			() => action.moveToMonitor(Meta.DisplayDirection.RIGHT));
		this.#addKeybinding(settings, 'move-monitor-up',
			() => action.moveToMonitor(Meta.DisplayDirection.UP));
		this.#addKeybinding(settings, 'move-monitor-down',
			() => action.moveToMonitor(Meta.DisplayDirection.DOWN));

		this.#addKeybinding(settings, 'toggle-maximize', () => action.toggleMaximize());
		this.#addKeybinding(settings, 'restore-window', () => action.restore());
	}

	disable() {
		for (const name of this.#boundKeys) {
			Main.wm.removeKeybinding(name);
		}
		this.#boundKeys.length = 0;

		// Drop the pending settle timeouts before
		// the signal and the objects go
		this.#action?.destroy();
		this.#action = null;

		this.#settings?.disconnectObject(this);
		this.#settings = null;
	}

	#migrateRenamedKeys(settings: Gio.Settings) {
		for (const [from, to] of RENAMED_KEYS) {
			const oldValue = settings.get_user_value(from);

			if (!oldValue) {
				continue;
			}

			if (!settings.get_user_value(to)) {
				settings.set_value(to, oldValue);
				settings.reset(from);
			}
		}
	}

	#syncStateEnabled(settings: Gio.Settings, action: BifocalAction) {
		action.setStateEnabled(settings.get_strv(RESTORE_KEY).length > 0);
	}

	#getFractions(settings: Gio.Settings, key: string): number[] {
		return (['small', 'medium', 'large'] as const)
			.filter((size) => settings.get_boolean(`${key}-${size}-enabled`))
			.map((size) => settings.get_int(`${key}-${size}`) / 100);
	}

	#getStep(settings: Gio.Settings): number {
		return settings.get_int(STEP_KEY) / 100;
	}

	#addResizeKeybinding(
		settings: Gio.Settings,
		name: string,
		fractionKey: string,
		action: (fractions: number[]) => void,
	) {
		this.#addKeybinding(settings, name, () => {
			const fractions = this.#getFractions(settings, fractionKey);
			if (!fractions.length) {
				return;
			}

			action(fractions);
		});
	}

	#addKeybinding(settings: Gio.Settings, name: string, handler: () => void) {
		Main.wm.addKeybinding(
			name,
			settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL,
			() => {
				try {
					return handler();
				} catch (error) {
					// `BifocalWindow.focused()` throws when nothing is focused
					console.error(`Keybinding ${name} callback error`, error);
				}
			},
		);

		this.#boundKeys.push(name);
	}
}
