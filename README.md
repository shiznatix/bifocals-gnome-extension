# bifocals-gnome-extension
Gnome extension adding more window management keyboard shortcuts

Requires GNOME Shell **46, 47, 48, 49, or 50**.

# Installation
Install from gnome-extensions: https://extensions.gnome.org/extension/4375/bifocals/

# Shortcuts
All shortcuts can be modified in the preferences. See `gnome-tweaks` or `extensions`.

**__NB!__ The default shortcuts are all chosen to avoid clashing with GNOME / Ubuntu's own window-management bindings, so they should work out of the box. If you rebind an action to a shortcut GNOME already uses, disable the GNOME one first, otherwise the two conflict and which one wins is unpredictable.**

| Name | Description | Default Keybinding |
| ---- | ----------- | ------------------ |
| `toggle-left` | Toggle size while anchored to the left. Cycles through up to 3 configurable widths (default: 33%, 50%, 67% of screen width). The window is stretched to the full screen height. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Left |
| `toggle-right` | Toggle size while anchored to the right. Cycles through up to 3 configurable widths (default: 33%, 50%, 67% of screen width). The window is stretched to the full screen height. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Right |
| `toggle-top` | Toggle height while anchored to the top. Cycles through up to 3 configurable heights (default: 33%, 50%, 67% of screen height). The window's horizontal position and width are preserved. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Up |
| `toggle-bottom` | Toggle height while anchored to the bottom. Cycles through up to 3 configurable heights (default: 33%, 50%, 67% of screen height). The window's horizontal position and width are preserved. Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+Down |
| `midscreen` | Move the window to the centre of the screen. Cycles through up to 3 configurable sizes (default: 20%, 25%, 33% of each screen axis). Individual sizes can be disabled. | &lt;Super&gt;+&lt;Ctrl&gt;+c |
| `move-monitor-left` | Move the window to the monitor to the left, scaling it to keep the same relative size and position on the new monitor. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Ctrl&gt;+Home |
| `move-monitor-right` | Move the window to the monitor to the right, scaling it to keep the same relative size and position on the new monitor. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Ctrl&gt;+End |
| `move-monitor-up` | Move the window to the monitor above, scaling it to keep the same relative size and position on the new monitor. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Ctrl&gt;+Page&nbsp;Up |
| `move-monitor-down` | Move the window to the monitor below, scaling it to keep the same relative size and position on the new monitor. No-op if there is no monitor in that direction. | &lt;Super&gt;+&lt;Ctrl&gt;+Page&nbsp;Down |
| `toggle-maximize` | Maximize the window, or restore it if it is already maximized. | &lt;Super&gt;+&lt;Ctrl&gt;+Return |
| `restore-window` | Restore the window to the size and position it had before the current run of Bifocals actions. Leaving this shortcut unset disables restore tracking altogether. See [Restoring windows](#restoring-windows). | &lt;Super&gt;+&lt;Ctrl&gt;+BackSpace |


# Restoring windows
`restore-window` puts a window back where it was **before the current run of Bifocals actions**, not merely one step back.

Bifocals remembers a window's geometry the first time an action moves it, and keeps that same baseline through any number of consecutive actions. So cycling `toggle-left` through all three of its sizes and then restoring returns the window to where it started, not to the previous size step.

If you move or resize a window yourself in between, that new geometry becomes the baseline instead:

1. Drag a window somewhere and size it how you like — call that **A**.
2. `toggle-left`, then `toggle-left` again to cycle its width.
3. `restore-window` puts the window back at **A**.
4. Now drag it somewhere else, to **B**. The next `restore-window` targets **B**.

This works for any change you make, not just mouse drags — keyboard resizing and moves made by other extensions are all picked up, because Bifocals compares the window's actual geometry against what it last set rather than watching for specific events.

Two details worth knowing:

- If a window is on a different monitor than when the baseline was captured, the baseline is scaled to the new monitor, keeping its relative size and position (the same way `move-monitor-*` works). Restoring never flings a window back to a monitor it is no longer on.
- Windows that quantise their own size — `gnome-terminal` sizes itself in whole character cells, for example — never land exactly on the requested rectangle. Bifocals treats geometry within 20px as unchanged so these windows are not mistaken for having been resized by hand.

### Per-application fallback

A window Bifocals has never touched has no baseline of its own, so `restore-window` falls back to the most recent baseline recorded for **any window of the same application**. Open a fresh Nautilus and restore it, and it goes where the previous Nautilus came from.

- A window's own baseline always wins; the fallback only applies when there is none.
- The application entry is not consumed, so every new window of that application can use it.
- Only normal top level windows take part. Dialogs, menus and utility windows share their application's id but are not representative of its usual geometry, so they neither record nor restore through this fallback.
- Entries live in memory for the session and are dropped when the extension is disabled or GNOME Shell restarts.

### Turning it off

Clearing the `restore-window` shortcut turns restore tracking off entirely. Since the shortcut is the only way to reach a recorded baseline, an unset shortcut means there is nothing worth recording: Bifocals stops tracking and discards everything already recorded.

Every other shortcut keeps working, it just moves windows without keeping a history. `toggle-maximize` still toggles — unmaximizing falls through to the geometry GNOME itself keeps for a maximized window, rather than to a Bifocals baseline.

This takes effect immediately, no reload needed. Setting a shortcut again starts tracking from scratch.


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

__NB!__ Just switch over to Xorg for dev. You can restart Xorg without log out/in!

### Tooling
```
node / npm      TypeScript and eslint
make            the build pipeline
jq              assembles metadata.json
zip             packages the extension
gettext         msgfmt, compiles translations
```
`make lint-zip` additionally needs `shexli` in a `.venv/`; it is optional and not part of a normal build.

## Install and Dev
1. Install dependencies and install dev extension
	```shell
	make dev deps all
	```

2. Reload Xorg `Alt+F2` → `r` → `Enter`. After it reloads, it should be visibile and active in gnome-extensions

3. Make changes and save the files. Reload Xorg every time you want to load your changes into the desktop.

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
3. Run `make locale` to compile the languages

# Package for Distribution
Lints, compiles TypeScript, compiles translations, assembles `metadata.json`, then packages `dist/bifocals.zip` ready for installation:
```shell
make build package
```
`package` only zips whatever is in `build/`, so it needs `build` ahead of it. Leave `dev` off for the published variant — `make dev build package` produces `dist/bifocals-dev.zip` under the dev UUID instead.
