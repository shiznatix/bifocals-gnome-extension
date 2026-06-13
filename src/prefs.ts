import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { ShortcutsGroup } from './prefs-shortcuts.js';
import { ResizeGroup } from './prefs-resize-group.js';
import { addResetAllGroup } from './prefs-reset-all.js';

const shortcuts = [
	'toggle-left',
	'toggle-right',
	'toggle-top',
	'toggle-bottom',
	'midscreen',
] as const;

const resizeKeys = [
	'resize-left-right-small',
	'resize-left-right-small-enabled',
	'resize-left-right-medium',
	'resize-left-right-medium-enabled',
	'resize-left-right-large',
	'resize-left-right-large-enabled',
	'resize-top-bottom-small',
	'resize-top-bottom-small-enabled',
	'resize-top-bottom-medium',
	'resize-top-bottom-medium-enabled',
	'resize-top-bottom-large',
	'resize-top-bottom-large-enabled',
	'resize-midscreen-small',
	'resize-midscreen-small-enabled',
	'resize-midscreen-medium',
	'resize-midscreen-medium-enabled',
	'resize-midscreen-large',
	'resize-midscreen-large-enabled',
] as const;

const _title = () => _('Bifocal Preferences');
const _keybindingsTitle = () => _('Keybindings');
const _keybindingsDesc = () => _('Configure the extension keybindings');
const _leftRightTitle = () => _('Left / Right Sizes');
const _leftRightDesc = () => _('% of screen width');
const _topBottomTitle = () => _('Top / Bottom Sizes');
const _topButtonDesc = () => _('% of screen height')
const _midscreenTitle = () => _('Midscreen Sizes');
const _midscreenDesc = () => _('% of screen');

export default class BifocalsPrefs extends ExtensionPreferences {
	async fillPreferencesWindow(window: Adw.PreferencesWindow) {
		const settings = this.getSettings();
		const page = new Adw.PreferencesPage({
			title: _title(),
		});
		page.add(new ShortcutsGroup({
			settings,
			window,
			schemaKeys: shortcuts,
			title: _keybindingsTitle(),
			description: _keybindingsDesc(),
		}));

		page.add(new ResizeGroup({
			settings,
			keyPrefix: 'resize-left-right',
			title: _leftRightTitle(),
			description: _leftRightDesc(),
		}));
		page.add(new ResizeGroup({
			settings,
			keyPrefix: 'resize-top-bottom',
			title: _topBottomTitle(),
			description: _topButtonDesc(),
		}));
		page.add(new ResizeGroup({
			settings,
			keyPrefix: 'resize-midscreen',
			title: _midscreenTitle(),
			description: _midscreenDesc(),
		}));

		addResetAllGroup(page, settings, [...shortcuts, ...resizeKeys], window);

		window.add(page);
	}
}
