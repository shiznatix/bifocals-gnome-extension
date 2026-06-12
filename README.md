# bifocals-gnome-extension
Gnome extension adding more window management keyboard shortcuts

Requires GNOME Shell **46, 47, or 48**.

# Installation
Install from gnome-extensions: https://extensions.gnome.org/extension/4375/bifocals/

# Shortcuts
All shortcuts can be modified in the preferences. See `gnome-tweaks` or `extensions`.

| Name | Description | Default Keybinding |
| ---- | ----------- | ------------------ |
| `toggle-left` | Toggle size while anchored to the left. Cycles through up to 3 configurable widths (default: 33%, 50%, 67% of screen width). The window is stretched to the full screen height. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Left |
| `toggle-right` | Toggle size while anchored to the right. Cycles through up to 3 configurable widths (default: 33%, 50%, 67% of screen width). The window is stretched to the full screen height. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Right |
| `toggle-top` | Toggle height while anchored to the top. Cycles through up to 3 configurable heights (default: 33%, 50%, 67% of screen height). The window's horizontal position and width are preserved. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Up |
| `toggle-bottom` | Toggle height while anchored to the bottom. Cycles through up to 3 configurable heights (default: 33%, 50%, 67% of screen height). The window's horizontal position and width are preserved. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Down |
| `midscreen` | Move the window to the centre of the screen. Cycles through up to 3 configurable sizes (default: 20%, 25%, 33% of each screen axis). Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+c |


# Preferences
Open the preferences dialog via `gnome-extensions prefs bifocals@shiznatix` or through the Extensions app.

### Keybindings
All shortcuts are rebindable. Each row shows the current binding (bold if customised) and a clear button to restore the default.

### Resize sizes
Each action group (Left/Right, Top/Bottom, Midscreen) has three independently configurable size steps: **Small**, **Medium**, and **Large**. Sizes are expressed as a percentage of the relevant screen axis.

- **Default Left/Right and Top/Bottom sizes:** 33% → 50% → 67%
- **Default Midscreen sizes:** 20% → 25% → 33% (applied to both width and height)

Each size has:
- A **spinner** to set the percentage value.
- A **toggle** to enable or disable that step — disabled steps are skipped during cycling.
- A **Restore default** button (shown only when the value has been customised) to reset that individual size.

A **Restore All** button at the bottom of the page resets every preference (keybindings and sizes) at once.


# Development

### Prerequisites
```
node / npm
```

### Install dependencies
```shell
npm install
```

### Build
Compiles TypeScript, compiles GSettings schemas, compiles translations, and packages a `bifocals.zip` ready for installation:
```shell
npm run build
```

### Watch mode (rebuild on save)
```shell
npm run build:watch
```

### Install via symlink (for live development)
```shell
npm run dev:link
```

### Translations
Translatable strings use GNU gettext. The source catalogue is `po/en.po`.

Currently available languages: **de**, **en**, **es**, **et**, **it**, **sv**.

To add a new language:
1. Copy `po/en.po` to `po/<lang>.po` and translate the `msgstr` lines.
2. Add `<lang>` to `po/LINGUAS`.
3. Run `npm run build` — `.mo` files are compiled and included automatically.


# Helpful commands & links
* `dbus-run-session -- gnome-shell --nested --wayland` Run Gnome in a nested session
* `journalctl -f -o cat /usr/bin/gnome-shell` Follow logs
* `<Alt>+F2` then `r` - Restart Gnome
* `gnome-extensions prefs bifocals@shiznatix` Open preferences dialog
* `glib-compile-schemas schemas` Must be run after any changes to gschema.xml
* A good project to use as an example: https://github.com/gTile/gTile
