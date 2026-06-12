import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const ICON_RESET = 'edit-clear-symbolic';

const _small = () => _('Small');
const _medium = () => _('Medium');
const _large = () => _('Large');
const _restoreDefault = () => _('Restore default');
const _neverTriggered = () => _('Value must be larger than previous size');

const getSizes = () => [
	{ suffix: 'small', label: _small() },
	{ suffix: 'medium', label: _medium() },
	{ suffix: 'large', label: _large() },
];

export function addResizeGroup(
	page: Adw.PreferencesPage,
	settings: Gio.Settings,
	keyPrefix: string,
	title: string,
) {
	const isCustomized = (key: string) => {
		if (settings.get_user_value(key) === null) {
			return false;
		}
		const defaultVal = settings.get_default_value(key);
		return defaultVal === null || settings.get_int(key) !== defaultVal.get_int32();
	};
	const group = new Adw.PreferencesGroup({ title });
	const rows: Adw.SpinRow[] = [];

	for (const { suffix, label } of getSizes()) {
		const key = `${keyPrefix}-${suffix}`;
		const row = new Adw.SpinRow({
			title: label,
			digits: 0,
			adjustment: new Gtk.Adjustment({
				lower: 5,
				upper: 95,
				step_increment: 1,
				page_increment: 5,
				value: settings.get_int(key),
			}),
		});
		const percentLabel = new Gtk.Label({ label: '%' });

		const resetBtn = new Gtk.Button({
			valign: Gtk.Align.CENTER,
			opacity: isCustomized(key) ? 1 : 0,
			sensitive: isCustomized(key),
			icon_name: ICON_RESET,
			tooltip_text: _restoreDefault(),
			css_classes: ['flat', 'circular'],
		});

		resetBtn.connect('clicked', () => settings.reset(key));
		settings.connect(`changed::${key}`, () => {
			const customized = isCustomized(key);
			resetBtn.opacity = customized ? 1 : 0;
			resetBtn.sensitive = customized;
		});

		row.add_suffix(percentLabel);
		row.add_suffix(resetBtn);
		settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
		group.add(row);
		rows.push(row);
	}

	const [smallRow, mediumRow, largeRow] = rows;

	const validate = () => {
		const smallVal = smallRow.value;
		const mediumVal = mediumRow.value;
		const largeVal = largeRow.value;

		const mediumError = mediumVal <= smallVal;
		mediumRow.subtitle = mediumError ? _neverTriggered() : '';
		if (mediumError) {
			mediumRow.add_css_class('error');
		} else {
			mediumRow.remove_css_class('error');
		}

		const largeError = largeVal <= mediumVal;
		largeRow.subtitle = largeError ? _neverTriggered() : '';
		if (largeError) {
			largeRow.add_css_class('error');
		} else {
			largeRow.remove_css_class('error');
		}
	};

	for (const row of rows) {
		row.connect('notify::value', validate);
	}
	validate();

	page.add(group);
}
