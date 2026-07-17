# bifocals-gnome-extension
Gnome extension adding more window management keyboard shortcuts

Requires GNOME Shell **46, 47, 48, 49, or 50**.

# Installation
Install from gnome-extensions: https://extensions.gnome.org/extension/4375/bifocals/

# Shortcuts
All shortcuts can be modified in the preferences. See `gnome-tweaks` or `extensions`.

**__NB!__ GNOME / Ubuntu took the best shortcuts for their window management things. I use those same shortcuts as the default config for Bifocals. You should probably disable the GNOME ones.**

| Name | Description | Default Keybinding |
| ---- | ----------- | ------------------ |
| `toggle-left` | Toggle size while anchored to the left. Cycles through up to 3 configurable widths (default: 33%, 50%, 67% of screen width). The window is stretched to the full screen height. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Left |
| `toggle-right` | Toggle size while anchored to the right. Cycles through up to 3 configurable widths (default: 33%, 50%, 67% of screen width). The window is stretched to the full screen height. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Right |
| `toggle-top` | Toggle height while anchored to the top. Cycles through up to 3 configurable heights (default: 33%, 50%, 67% of screen height). The window's horizontal position and width are preserved. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Up |
| `toggle-bottom` | Toggle height while anchored to the bottom. Cycles through up to 3 configurable heights (default: 33%, 50%, 67% of screen height). The window's horizontal position and width are preserved. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Down |
| `midscreen` | Move the window to the centre of the screen. Cycles through up to 3 configurable sizes (default: 20%, 25%, 33% of each screen axis). Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+c |
| `move-monitor-left` | Move the window to the monitor to the left, preserving its relative position. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Shift&gt;+Left |
| `move-monitor-right` | Move the window to the monitor to the right, preserving its relative position. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Shift&gt;+Right |
| `move-monitor-up` | Move the window to the monitor above, preserving its relative position. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Shift&gt;+Up |
| `move-monitor-down` | Move the window to the monitor below, preserving its relative position. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Shift&gt;+Down |


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

__NB!__ Just switch over to Xorg for dev. You can do `Alt+F2` → `r` → `Enter` to reload the extension changes without logging in / out.

### Prerequisites
```
node / npm
```

### Setup Environment

Install dependencies, build the files (with compiled schemas), and symlink it
```shell
npm install
npm run test:build
npm run dev:link
```

This symlinks `dist/` into `~/.local/share/gnome-shell/extensions/` under a distinct UUID, `bifocals-dev@shiznatix`, rather than the published `bifocals@shiznatix`, so GNOME doesn't fight you trying to install the published version every 5 seconds.

Since this is a brand new extension, you have to enable it one time:
```shell
gnome-extensions enable bifocals-dev@shiznatix
```

If that errors with `Extension "bifocals-dev@shiznatix" does not exist`, log out and log back in and try again.
Once its enabled, log out / in again (__To Xorg!__) and now you can dev (hopefully).

### Do the Dev

1. Watch code changes and rebuild on save:
	```shell
	npm run build:watch
	```

2. Make changes and save the files

3. Reload Xorg to load the changes into your running extensions: `Alt+F2` → `r` → `Enter`

### Logging

`console.log()` from an extension may not reach the journal. The legacy GJS `log()` global is more reliable, and `Main.notify('title', 'body')` puts a message on screen regardless. To follow logs:
```shell
journalctl -f -o cat /usr/bin/gnome-shell
```
`Alt+F2` → `lg` opens Looking Glass, whose **Errors** tab shows extension exceptions.

### Translations
Translatable strings use GNU gettext. The source catalogue is `po/en.po`.

Currently available languages: **de**, **en**, **es**, **et**, **it**, **sv**.

To add a new language:
1. Copy `po/en.po` to `po/<lang>.po` and translate the `msgstr` lines.
2. Add `<lang>` to `po/LINGUAS`.
3. Run `npm run build` — `.mo` files are compiled and included automatically.

# Package for Distribution
Compiles TypeScript, compiles translations, and packages a `bifocals.zip` ready for installation:
```shell
npm run build
```

# Helpful commands & links
* `dbus-run-session -- gnome-shell --nested --wayland` Run Gnome in a nested session
* `journalctl -f -o cat /usr/bin/gnome-shell` Follow logs
* `<Alt>+F2` then `r` - Restart Gnome, picking up extension code changes (Xorg only; Wayland requires logging out and back in instead)
* `gnome-extensions prefs bifocals-dev@shiznatix` Open the dev build's preferences dialog (`bifocals@shiznatix` for the published one)
* `glib-compile-schemas schemas` Must be run after any changes to gschema.xml
* A good project to use as an example: https://github.com/gTile/gTile
