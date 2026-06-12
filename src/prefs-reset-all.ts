import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const _restoreAllTitle = () => _('Restore All Defaults');
const _restoreAllSubtitle = () => _('Reset all preferences to their default values');
const _restoreAllBtnLabel = () => _('Restore All');
const _restoreAllConfirmHeading = () => _('Restore All Defaults?');
const _restoreAllConfirmBody = () => _('All preferences will be reset to their default values. This cannot be undone.');
const _restoreAllConfirmBtn = () => _('Restore All');
const _cancelBtn = () => _('Cancel');

function anyDiffersFromDefault(settings: Gio.Settings, keys: readonly string[]): boolean {
	return keys.some((key) => {
		const defaultValue = settings.get_default_value(key);
		if (defaultValue === null) {
			return false;
		}
		return !settings.get_value(key).equal(defaultValue);
	});
}

export function addResetAllGroup(
	page: Adw.PreferencesPage,
	settings: Gio.Settings,
	keys: readonly string[],
	window: Adw.PreferencesWindow,
) {
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

	const updateSensitivity = () => {
		resetAllBtn.sensitive = anyDiffersFromDefault(settings, keys);
	};
	updateSensitivity();

	const handlerIds = keys.map((key) => settings.connect(`changed::${key}`, updateSensitivity));
	resetAllBtn.connect('destroy', () => {
		for (const id of handlerIds) {
			settings.disconnect(id);
		}
	});

	resetAllBtn.connect('clicked', () => {
		const dialog = new Adw.AlertDialog({
			heading: _restoreAllConfirmHeading(),
			body: _restoreAllConfirmBody(),
		});
		dialog.add_response('cancel', _cancelBtn());
		dialog.add_response('reset', _restoreAllConfirmBtn());
		dialog.set_response_appearance('reset', Adw.ResponseAppearance.DESTRUCTIVE);
		dialog.set_default_response('cancel');
		dialog.connect('response', (_dialog: Adw.AlertDialog, response: string) => {
			if (response === 'reset') {
				for (const key of keys) {
					settings.reset(key);
				}
			}
		});
		dialog.present(window);
	});

	resetAllRow.add_suffix(resetAllBtn);
	resetGroup.add(resetAllRow);
}
