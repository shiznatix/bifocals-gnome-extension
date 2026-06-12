import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { ShortcutRow } from './prefs-shortcut-row.js';
import { addResizeGroup } from './prefs-resize-group.js';

const shortcuts = [
	'toggle-left',
	'toggle-right',
	'toggle-top',
	'toggle-bottom',
	'midscreen',
] as const;

const resizeKeys = [
	'resize-left-right-small',
	'resize-left-right-medium',
	'resize-left-right-large',
	'resize-top-bottom-small',
	'resize-top-bottom-medium',
	'resize-top-bottom-large',
	'resize-midscreen-small',
	'resize-midscreen-medium',
	'resize-midscreen-large',
] as const;

const _title = () => _('Bifocal Preferences');
const _keybindingsTitle = () => _('Keybindings');
const _keybindingsDesc = () => _('Configure the extension keybindings');
const _leftRightTitle = () => _('Left / Right Sizes (% of screen width)');
const _topBottomTitle = () => _('Top / Bottom Sizes (% of screen height)');
const _midscreenTitle = () => _('Midscreen Sizes (% of screen)');
const _restoreAllTitle = () => _('Restore All Defaults');
const _restoreAllSubtitle = () => _('Reset all preferences to their default values');
const _restoreAllBtnLabel = () => _('Restore All');

export default class BifocalsPrefs extends ExtensionPreferences {
	async fillPreferencesWindow(window: Adw.PreferencesWindow) {
		const settings = this.getSettings();
		const page = new Adw.PreferencesPage({
			title: _title(),
		});
		const keybindingsGroup = new Adw.PreferencesGroup({
			title: _keybindingsTitle(),
			description: _keybindingsDesc(),
		});
		page.add(keybindingsGroup);

		for (const schemaKey of shortcuts) {
			const row = new ShortcutRow({
				settings,
				window,
				schemaKey,
			});
			keybindingsGroup.add(row);
		}

		addResizeGroup(page, settings, 'resize-left-right', _leftRightTitle());
		addResizeGroup(page, settings, 'resize-top-bottom', _topBottomTitle());
		addResizeGroup(page, settings, 'resize-midscreen', _midscreenTitle());

		const resetGroup = new Adw.PreferencesGroup();
		page.add(resetGroup);

		const resetAllRow = new Adw.ActionRow({
			title: _restoreAllTitle(),
			subtitle: _restoreAllSubtitle(),
		});

		const resetAllBtn = new Gtk.Button({
			label: _restoreAllBtnLabel(),
			valign: Gtk.Align.CENTER,
			css_classes: ['destructive-action'],
		});

		resetAllBtn.connect('clicked', () => {
			for (const key of [...shortcuts, ...resizeKeys]) {
				settings.reset(key);
			}
		});

		resetAllRow.add_suffix(resetAllBtn);
		resetGroup.add(resetAllRow);

		window.add(page);
	}
}
