import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const ICON_RESET = 'edit-clear-symbolic';

const _step = () => _('Step');
const _restoreDefault = () => _('Restore default');

interface StepGroupParams extends Partial<Adw.PreferencesGroup.ConstructorProps> {
	settings: Gio.Settings;
	key: string;
}

// A single percentage, without the cycling sizes' ordering and enable toggles
export const StepGroup = GObject.registerClass({
	GTypeName: 'BifocalsStepGroup',
}, class extends Adw.PreferencesGroup {

	constructor({ settings, key, ...config }: StepGroupParams) {
		super(config);

		const isCustomized = () => {
			if (settings.get_user_value(key) === null) {
				return false;
			}
			const defaultVal = settings.get_default_value(key);
			return defaultVal === null || settings.get_int(key) !== defaultVal.get_int32();
		};

		const adjustment = new Gtk.Adjustment({
			lower: 1,
			upper: 50,
			step_increment: 1,
			page_increment: 5,
			value: settings.get_int(key),
		});
		const spinButton = new Gtk.SpinButton({
			adjustment,
			digits: 0,
			valign: Gtk.Align.CENTER,
			width_chars: 3,
		});
		const resetBtn = new Gtk.Button({
			valign: Gtk.Align.CENTER,
			opacity: isCustomized() ? 1 : 0,
			sensitive: isCustomized(),
			icon_name: ICON_RESET,
			tooltip_text: _restoreDefault(),
			css_classes: ['flat', 'circular'],
		});

		spinButton.connect('value-changed', () => {
			const intVal = spinButton.get_value_as_int();
			if (settings.get_int(key) !== intVal) {
				settings.set_int(key, intVal);
			}
		});
		resetBtn.connect('clicked', () => settings.reset(key));
		settings.connect(`changed::${key}`, () => {
			resetBtn.opacity = isCustomized() ? 1 : 0;
			resetBtn.sensitive = isCustomized();
			if (adjustment.value !== settings.get_int(key)) {
				adjustment.value = settings.get_int(key);
			}
		});

		const row = new Adw.ActionRow({ title: _step() });
		row.add_suffix(spinButton);
		row.add_suffix(new Gtk.Label({ label: '%', valign: Gtk.Align.CENTER }));
		row.add_suffix(resetBtn);

		this.add(row);
	}
});
