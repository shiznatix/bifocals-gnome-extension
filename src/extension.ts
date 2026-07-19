import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { BifocalAction } from './ext-action.js';

const RESTORE_KEY = 'restore-window';

export default class BifocalsExtension extends Extension {
	#settings: Gio.Settings | null = null;
	#boundKeys: string[] = []; // Only the keys actually added
	#action: BifocalAction = new BifocalAction();
	#stateEnabledId: number | null = null;

	enable() {
		const settings = this.getSettings();
		this.#settings = settings;

		this.#syncStateEnabled(settings);
		this.#stateEnabledId = settings.connect(
			`changed::${RESTORE_KEY}`,
			() => this.#syncStateEnabled(settings),
		);

		this.#addResizeKeybinding('midscreen', 'resize-midscreen',
			(fractions) => this.#action.midscreen(fractions));
		this.#addResizeKeybinding('toggle-left', 'resize-left-right',
			(fractions) => this.#action.anchored('left', fractions));
		this.#addResizeKeybinding('toggle-right', 'resize-left-right',
			(fractions) => this.#action.anchored('right', fractions));
		this.#addResizeKeybinding('toggle-top', 'resize-top-bottom',
			(fractions) => this.#action.anchored('top', fractions));
		this.#addResizeKeybinding('toggle-bottom', 'resize-top-bottom',
			(fractions) => this.#action.anchored('bottom', fractions));

		this.#addKeybinding('move-monitor-left',
			() => this.#action.moveToMonitor(Meta.DisplayDirection.LEFT));
		this.#addKeybinding('move-monitor-right',
			() => this.#action.moveToMonitor(Meta.DisplayDirection.RIGHT));
		this.#addKeybinding('move-monitor-up',
			() => this.#action.moveToMonitor(Meta.DisplayDirection.UP));
		this.#addKeybinding('move-monitor-down',
			() => this.#action.moveToMonitor(Meta.DisplayDirection.DOWN));

		this.#addKeybinding('toggle-maximize', () => this.#action.toggleMaximize());
		this.#addKeybinding('restore-window', () => this.#action.restore());
	}

	disable() {
		for (const name of this.#boundKeys) {
			Main.wm.removeKeybinding(name);
		}
		this.#boundKeys.length = 0;

		if (this.#stateEnabledId !== null) {
			this.#settings?.disconnect(this.#stateEnabledId);
			this.#stateEnabledId = null;
		}

		this.#action.destroy();
		this.#settings = null;
	}

	#syncStateEnabled(settings: Gio.Settings) {
		this.#action.setStateEnabled(settings.get_strv(RESTORE_KEY).length > 0);
	}

	#getFractions(key: string): number[] {
		const settings = this.#settings;
		if (!settings) {
			return [];
		}

		return (['small', 'medium', 'large'] as const)
			.filter((size) => settings.get_boolean(`${key}-${size}-enabled`))
			.map((size) => settings.get_int(`${key}-${size}`) / 100);
	}

	#addResizeKeybinding(name: string, fractionKey: string, action: (fractions: number[]) => void) {
		this.#addKeybinding(name, () => {
			const fractions = this.#getFractions(fractionKey);
			if (!fractions.length) {
				return;
			}

			action(fractions);
		});
	}

	#addKeybinding(name: string, handler: () => void) {
		if (!this.#settings) {
			printerr('Cannot bind key, `settings` is not initialized');
			return;
		}

		Main.wm.addKeybinding(
			name,
			this.#settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL,
			() => {
				try {
					return handler();
				} catch (error) {
					printerr(`Keybinding ${name} callback error`, error);
				}
			},
		);

		this.#boundKeys.push(name);
	}
}
