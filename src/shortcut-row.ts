// Slightly modified version of https://github.com/gTile/gTile/blob/master/src/util/gc.ts#L446

import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

interface ShortcutParams extends Partial<Adw.ActionRow.ConstructorProps> {
	settings: Gio.Settings;
	schemaKey: string;
	window: Gtk.Window;
}

interface KeyPressEvent {
	keyval: number;
	modifier: Gdk.ModifierType;
}

const HELP_TEXT = [
	'Note: This dialog only detects shortcuts that are not actively intercepted by Gnome shell, e.g., natively or through another extension.',
	'',
	'Press <b>ESC</b> to close the dialog.',
	'Press <b>BackSpace</b> to unset the keybinding.',
].join('\n');

export const ShortcutRow = GObject.registerClass({
	GTypeName: 'BifocalsShortcutActionRow',
}, class extends Adw.ActionRow {

	#settings: Gio.Settings;
	#schemaKey: string;
	#window: Gtk.Window;

	constructor({ settings, schemaKey, window, ...config }: ShortcutParams) {
		super({
			...config,
			activatable: true,
			title: settings.settings_schema.get_key(schemaKey).get_summary() ?? undefined,
		});

		this.#settings = settings;
		this.#schemaKey = schemaKey;
		this.#window = window;

		const label = new Gtk.Label({
			label: this.#label(),
			use_markup: true,
			xalign: 0,
		});

		const resetBtn = new Gtk.Button({
			valign: Gtk.Align.CENTER,
			visible: this.#isCustomized(),
            icon_name: 'edit-clear-symbolic',
			tooltip_text: 'Reset the shortcut to its default value',
			css_classes: ['flat', 'circular'],
		});

		this.add_suffix(label);
		this.add_suffix(resetBtn);

		this.connect('activated', this.#onRebindKey.bind(this));
		resetBtn.connect('clicked', () => this.#settings.reset(this.#schemaKey));
		this.#settings.connect(`changed::${schemaKey}`, () => {
			label.label = this.#label();
			resetBtn.visible = this.#isCustomized();
		});
	}

	#isCustomized() {
		return this.#settings.get_user_value(this.#schemaKey) !== null;
	}

	#escape(s: string) {
		return s.replace(/(<|>)/g, (c) => ({
			'<': '&lt;',
			'>': '&gt;',
		}[c]!));
	}

	#label() {
		const current = this.#settings.get_strv(this.#schemaKey);
		const shortcuts = current.length > 0
			? this.#escape(current.join(', '))
			: this.#escape('<Unset>');

		return this.#isCustomized() ? `<b>${shortcuts}</b>` : shortcuts;
	}

	#addKeybinding(shortcut: string) {
		const set = new Set([...this.#settings.get_strv(this.#schemaKey), shortcut]);
		this.#settings.set_strv(this.#schemaKey, Array.from(set));
	}

	#replaceKeybinding(shortcut: string) {
		this.#settings.set_strv(this.#schemaKey, [shortcut]);
	}

	#unsetKeybinding() {
		this.#settings.set_strv(this.#schemaKey, []);
	}

	#onRebindKey() {
		// `undefined` resembles the state which awaits user input
		// `null` resembles an unbound/empty shortcut (ε)
		let acceleratorName: string | null | undefined = undefined;

		const eventController = new Gtk.EventControllerKey({
			propagation_phase: Gtk.PropagationPhase.CAPTURE,
		});

		const dialog = new Adw.AlertDialog({
			heading: 'Set shortcut',
			body: `await input…\n\n${HELP_TEXT}`,
			body_use_markup: true,
		});
		dialog.add_controller(eventController);

		dialog.add_response('add', 'Add shortcut');
		dialog.set_response_appearance('add', Adw.ResponseAppearance.SUGGESTED);
		dialog.set_response_enabled('add', false);

		dialog.add_response('replace', 'Replace shortcut(s)');
		dialog.set_response_appearance('replace', Adw.ResponseAppearance.DESTRUCTIVE);
		dialog.set_response_enabled('replace', false);

		dialog.connect('response', (_, response: 'add' | 'replace' | 'close') => {
			if (acceleratorName === null) {
				this.#unsetKeybinding();
			} else if (acceleratorName) {
				if (response === 'add') {
                    this.#addKeybinding(acceleratorName);
                } else if (response === 'replace') {
                    this.#replaceKeybinding(acceleratorName);
                }
			}

			dialog.close();
		});

		eventController.connect('key-pressed', (ctrl, _, code, state) => {
			const event = ctrl.get_current_event() as Gdk.KeyEvent;
			const display = event.get_display()!;
			const { keyval, modifier } = this.#normalizeKeyvalAndMask(display, code, state, ctrl.get_group());

			if (event.is_modifier()) {
				return Gdk.EVENT_STOP;
			}

			switch (keyval) {
				case Gdk.KEY_Escape:
					// triggers 'response' callback
					dialog.close();
					return Gdk.EVENT_STOP;
				case Gdk.KEY_BackSpace:
					acceleratorName = null;
					break;
				case Gdk.KEY_Return:
					if (modifier === 0) {
						// <Enter> may confirm a shortcut, if one was recognized already.
						// But <Enter> may also serve as legitimate shortcut on its own.
						// To differentiate between the two cases, it is checked whether
						// another shortcut had already been provided.
						if (acceleratorName === undefined) {
                            acceleratorName = Gtk.accelerator_name(keyval, modifier);
                            break;
						} else if (acceleratorName === null) {
                            this.#unsetKeybinding();
                            dialog.close();
						} else {
                            this.#replaceKeybinding(acceleratorName);
                            dialog.close();
						}
						return Gdk.EVENT_STOP;
					}
				// intentionally fallthrough
				default:
				  acceleratorName = Gtk.accelerator_name(keyval, modifier)!;
			}

			const name = acceleratorName ?? '<Unset>';
			dialog.body = `${this.#escape(name)}\n\n${HELP_TEXT}`;
			dialog.set_response_enabled('replace', true);
			dialog.set_response_enabled('add', acceleratorName !== null);

			return Gdk.EVENT_STOP;
		});

		dialog.present(this.#window);
	}

	// https://gitlab.gnome.org/GNOME/gnome-control-center/-/blob/a936ac6bc9d5a01dd2c3fcb905189570ecd72753/panels/keyboard/keyboard-shortcuts.c#L388
	#normalizeKeyvalAndMask(
		display: Gdk.Display,
		code: number,
		mask: Gdk.ModifierType,
		keyGroup: number
	): KeyPressEvent {
		// Note that GDK may add internal values to events which include values
		// outside of the Gdk.ModifierType enumeration. Usually the code should
		// preserve and ignore them.
		// That being said, the `Gdk.Display.translate_key` method throws an error
		// when these internal values are preserved. Thus, for the purpose of
		// normalization it is vital to ignore these bits beforehand.
		// https://gitlab.gnome.org/GNOME/gtk/-/blob/69500f356e61e437853f44c992c9bbca2ae5f8f7/gdk/gdkenums.h#L111-113
		mask &= Gdk.MODIFIER_MASK;

		let explicitModifiers = Gtk.accelerator_get_default_mod_mask();

		// We want shift to always be included as explicit modifier for gnome-shell
		// shortcuts. That's because users usually think of shortcuts as including
		// the shift key rather than being defined for the shifted keyval.
		// This helps with num - row keys which have different keyvals on different
		// layouts for example, but also with keys that have explicit key codes at
		// shift level 0, that gnome-shell would prefer over shifted ones, such the
		// DOLLAR key.
		explicitModifiers |= Gdk.ModifierType.SHIFT_MASK;

		// CapsLock isn't supported as a keybinding modifier, so keep it from
		// confusing us.
		// https://gitlab.gnome.org/GNOME/gnome-control-center/-/blob/a936ac6bc9d5a01dd2c3fcb905189570ecd72753/panels/keyboard/cc-keyboard-shortcut-editor.c#L713
		explicitModifiers &= ~Gdk.ModifierType.LOCK_MASK;

		const usedModifiers = mask & explicitModifiers;

		let [, unmodifiedKeyval] = display.translate_key(code, mask & ~explicitModifiers, keyGroup);
		const [, shiftedKeyval] = display.translate_key(code, Gdk.ModifierType.SHIFT_MASK | (mask & ~explicitModifiers), keyGroup);

		if (Gdk.KEY_0 <= shiftedKeyval && shiftedKeyval <= Gdk.KEY_9) {
			unmodifiedKeyval = shiftedKeyval;
		}

		if (unmodifiedKeyval === Gdk.KEY_ISO_Left_Tab) {
			unmodifiedKeyval = Gdk.KEY_Tab;
		}

		if (unmodifiedKeyval === Gdk.KEY_Sys_Req && (usedModifiers & Gdk.ModifierType.ALT_MASK) != 0) {
			unmodifiedKeyval = Gdk.KEY_Print;
		}

		return {
            keyval: unmodifiedKeyval,
            modifier: usedModifiers,
        };
	}
});
