# bifocals-gnome-extension
Gnome extension adding more window management keyboard shortcuts

Requires GNOME Shell **46, 47, or 48**.

# Installation
Install from gnome-extensions: https://extensions.gnome.org/extension/4375/bifocals/

# Shortcuts
All shortcuts can be modified in the preferences. See `gnome-tweaks` or `extensions`.

| Name | Description | Default Keybinding |
| ---- | ----------- | ------------------ |
| `toggle-left` | Toggle size while anchored to the left. Toggles through 3 sizes:<ul><li>1/3 width</li> <li>1/2 width</li> <li>2/3 width</li></ul> | &lt;Super&gt;+&lt;Ctrl&gt;+Left |
| `toggle-right` | Toggle size while anchored to the right. Toggles through 3 sizes:<ul><li>1/3 width</li> <li>1/2 width</li> <li>2/3 width</li></ul> | &lt;Super&gt;+&lt;Ctrl&gt;+Right |
| `toggle-top` | Toggle height while anchored to the top. Toggles through 3 sizes:<ul><li>1/3 height</li> <li>1/2 height</li> <li>2/3 height</li></ul> | &lt;Super&gt;+&lt;Ctrl&gt;+Up |
| `toggle-bottom` | Toggle height while anchored to the bottom. Toggles through 3 sizes:<ul><li>1/3 height</li> <li>1/2 height</li> <li>2/3 height</li></ul> | &lt;Super&gt;+&lt;Ctrl&gt;+Down |
| `midscreen` | Move the window to the middle of the screen and make the height and width each 1/4th of their respective axis size. | &lt;Super&gt;+&lt;Ctrl&gt;+c |


# Preferences
Open the preferences dialog via `gnome-extensions prefs bifocals@shiznatix` or through the Extensions app.

### Keybindings
All shortcuts are rebindable. Each row shows the current binding (bold if customised) and a clear button to restore the default.

### Resize sizes
The pixel fractions used for small, medium, and large sizes can be independently configured for each axis (left/right, top/bottom, midscreen). Each size row has a **Restore default** button to reset that individual value. A **Restore All** button at the bottom resets every preference at once.


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
npm run dev:build
```

### Install via symlink (for live development)
```shell
npm run dev:link
```

### Translations
Translatable strings use GNU gettext. The source catalogue is `po/en.po`. To add a new language:
1. Copy `po/en.po` to `po/<lang>.po` and translate the `msgstr` lines.
2. Add `<lang>` to `po/LINGUAS`.
3. Run `npm run build` — `.mo` files are compiled and included automatically.


# Helpful commands & links
* `dbus-run-session -- gnome-shell --nested --wayland` Run Gnome in a nested session
* `journalctl -f -o cat /usr/bin/gnome-shell` Follow logs
* `<Alt>+F2` then `r` - Restart Gnome
* `gnome-extensions prefs bifocals@shiznatix` Open preferences dialog
* `glib-compile-schemas schemas` Must be run after any changes to gchema.xml
* A good project to use as an example: https://github.com/gTile/gTile
