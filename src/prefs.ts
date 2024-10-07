import Adw from 'gi://Adw';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { ShortcutRow } from './shortcut-row.js';

const shortcuts = [
	'toggle-left',
	'toggle-right',
	'toggle-top',
	'toggle-bottom',
	'midscreen',
];

export default class BifocalsPrefs extends ExtensionPreferences {
	async fillPreferencesWindow(window: Adw.PreferencesWindow) {
		const settings = this.getSettings();

		const page = new Adw.PreferencesPage({
			title: 'Bifocal Preferences',
		});
		window.add(page);

		const group = new Adw.PreferencesGroup({
			title: 'Keybindings',
			description: 'Configure the appearance of the extension',
		});
		page.add(group);

		for (const schemaKey of shortcuts) {
			const row = new ShortcutRow({
				settings,
				window,
				schemaKey,
			});
			group.add(row);
		}
	}
}
