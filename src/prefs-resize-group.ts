import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
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

interface ResizeGroupParams extends Partial<Adw.PreferencesGroup.ConstructorProps> {
	settings: Gio.Settings;
	keyPrefix: string;
}

interface ResizeRowParams extends Partial<Adw.ActionRow.ConstructorProps> {
	settings: Gio.Settings;
	key: string;
	enabledKey: string;
}

const ResizeRow = GObject.registerClass({
	GTypeName: 'BifocalsResizeActionRow',
}, class extends Adw.ActionRow {

	#key: string;
	#enabledKey: string;
	#settings: Gio.Settings;
	#spinButton!: Gtk.SpinButton;
	#adjustment!: Gtk.Adjustment;
	#percentLabel!: Gtk.Label;
	#resetBtn!: Gtk.Button;
	#toggle!: Gtk.Switch;

	constructor({ settings, key, enabledKey, ...config }: ResizeRowParams) {
		super(config);

		this.#key = key;
		this.#settings = settings;
		this.#enabledKey = enabledKey;

		this.#createAdjustment();
		this.#createSpinButton();
		this.#createPercentLabel();
		this.#createResetBtn();
		this.#createToggle();

		this.activatable_widget = this.#toggle;

		this.#settings.connect(`changed::${this.#key}`, () => {
			const customized = this.#isCustomized();
			this.#resetBtn.opacity = customized ? 1 : 0;
			this.#resetBtn.sensitive = customized && this.#settings.get_boolean(this.#enabledKey);
			if (this.#adjustment.value !== this.#settings.get_int(this.#key)) {
				this.#adjustment.value = this.#settings.get_int(this.#key);
			}
		});

		this.#settings.connect(`changed::${this.#enabledKey}`, () => {
			if (this.#toggle.active !== this.#settings.get_boolean(this.#enabledKey)) {
				this.#toggle.active = this.#settings.get_boolean(this.#enabledKey);
			}
			this.#updateSensitivity();
		});

		this.add_suffix(this.#spinButton);
		this.add_suffix(this.#percentLabel);
		this.add_suffix(this.#resetBtn);
		this.add_suffix(this.#toggle);

		this.#updateSensitivity();
	}

	#isCustomized() {
		if (this.#settings.get_user_value(this.#key) === null) {
			return false;
		}
		const defaultVal = this.#settings.get_default_value(this.#key);
		return defaultVal === null || this.#settings.get_int(this.#key) !== defaultVal.get_int32();
	}

	#updateSensitivity() {
		const enabled = this.#settings.get_boolean(this.#enabledKey);
		this.#spinButton.sensitive = enabled;
		this.#percentLabel.sensitive = enabled;
		this.#resetBtn.sensitive = enabled && this.#isCustomized();
	}

	#createAdjustment() {
		this.#adjustment = new Gtk.Adjustment({
			lower: 5,
			upper: 100,
			step_increment: 1,
			page_increment: 5,
			value: this.#settings.get_int(this.#key),
		});
	}

	#createSpinButton() {
		this.#spinButton = new Gtk.SpinButton({
			adjustment: this.#adjustment,
			digits: 0,
			valign: Gtk.Align.CENTER,
			width_chars: 3,
		});
		this.#spinButton.connect('value-changed', () => {
			const intVal = this.#spinButton.get_value_as_int();
			if (this.#settings.get_int(this.#key) !== intVal) {
				this.#settings.set_int(this.#key, intVal);
			}
		});
	}

	get value() {
		return this.#spinButton.get_value_as_int();
	}

	onValueChanged(callback: () => void) {
		this.#spinButton.connect('value-changed', callback);
	}

	#createPercentLabel() {
		this.#percentLabel = new Gtk.Label({ label: '%', valign: Gtk.Align.CENTER });
	}

	#createResetBtn() {
		this.#resetBtn = new Gtk.Button({
			valign: Gtk.Align.CENTER,
			opacity: this.#isCustomized() ? 1 : 0,
			icon_name: ICON_RESET,
			tooltip_text: _restoreDefault(),
			css_classes: ['flat', 'circular'],
		});
		this.#resetBtn.connect('clicked', () => this.#settings.reset(this.#key));
	}

	#createToggle() {
		this.#toggle = new Gtk.Switch({
			valign: Gtk.Align.CENTER,
			active: this.#settings.get_boolean(this.#enabledKey),
		});
		this.#toggle.connect('notify::active', () => {
			this.#settings.set_boolean(this.#enabledKey, this.#toggle.active);
		});
	}
});

export const ResizeGroup = GObject.registerClass({
	GTypeName: 'BifocalsResizeGroup',
}, class extends Adw.PreferencesGroup {

	#settings: Gio.Settings;
	#keyPrefix: string;
	#smallRow!: InstanceType<typeof ResizeRow>;
	#mediumRow!: InstanceType<typeof ResizeRow>;
	#largeRow!: InstanceType<typeof ResizeRow>;

	constructor({ settings, keyPrefix, ...config }: ResizeGroupParams) {
		super(config);

		this.#settings = settings;
		this.#keyPrefix = keyPrefix;

		const rowData: Array<{ row: InstanceType<typeof ResizeRow>; suffix: string }> = [];

		for (const { suffix, label } of getSizes()) {
			const key = `${keyPrefix}-${suffix}`;
			const enabledKey = `${keyPrefix}-${suffix}-enabled`;

			const row = new ResizeRow({ settings, key, enabledKey, title: label });
			this.add(row);
			rowData.push({ row, suffix });
		}

		[{ row: this.#smallRow }, { row: this.#mediumRow }, { row: this.#largeRow }] = rowData;

		for (const { row, suffix } of rowData) {
			row.onValueChanged(() => this.#validate());
			settings.connect(`changed::${keyPrefix}-${suffix}-enabled`, () => this.#validate());
		}
		this.#validate();
	}

	#validate() {
		const smallVal = this.#smallRow.value;
		const mediumVal = this.#mediumRow.value;
		const largeVal = this.#largeRow.value;

		const smallEnabled = this.#settings.get_boolean(`${this.#keyPrefix}-small-enabled`);
		const mediumEnabled = this.#settings.get_boolean(`${this.#keyPrefix}-medium-enabled`);
		const largeEnabled = this.#settings.get_boolean(`${this.#keyPrefix}-large-enabled`);

		const mediumError = smallEnabled && mediumEnabled && mediumVal <= smallVal;
		this.#mediumRow.subtitle = mediumError ? _neverTriggered() : '';
		if (mediumError) {
			this.#mediumRow.add_css_class('error');
		} else {
			this.#mediumRow.remove_css_class('error');
		}

		const prevForLarge = mediumEnabled ? mediumVal : (smallEnabled ? smallVal : null);
		const largeError = largeEnabled && prevForLarge !== null && largeVal <= prevForLarge;
		this.#largeRow.subtitle = largeError ? _neverTriggered() : '';
		if (largeError) {
			this.#largeRow.add_css_class('error');
		} else {
			this.#largeRow.remove_css_class('error');
		}
	}
});
