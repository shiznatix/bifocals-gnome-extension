<p align="center">
  <img src="icon/icon-128.png" width="120" alt="Bifocals icon">
</p>

# bifocals-gnome-extension
Gnome extension adding more window management keyboard shortcuts

Requires GNOME Shell **46, 47, 48, 49, or 50**.

# Installation
Install from gnome-extensions: https://extensions.gnome.org/extension/4375/bifocals/

# Shortcuts
All shortcuts can be modified in the preferences. See `gnome-tweaks` or `extensions`.

| Name | Description | Default Keybinding |
| ---- | ----------- | ------------------ |
| `cycle-left` | Cycle the window's width, anchored to the left and stretched to full screen height. | &lt;Super&gt;+&lt;Ctrl&gt;+Left |
| `cycle-right` | Cycle the window's width, anchored to the right and stretched to full screen height. | &lt;Super&gt;+&lt;Ctrl&gt;+Right |
| `cycle-top` | Cycle the window's height, anchored to the top. Horizontal position and width are preserved. | &lt;Super&gt;+&lt;Ctrl&gt;+Up |
| `cycle-bottom` | Cycle the window's height, anchored to the bottom. Horizontal position and width are preserved. | &lt;Super&gt;+&lt;Ctrl&gt;+Down |
| `cycle-midscreen` | Centre the window and cycle its size on both axes. | &lt;Super&gt;+&lt;Ctrl&gt;+c |
| `increase-size` | Grow the window by one step. See [Growing and shrinking](#growing-and-shrinking). | &lt;Super&gt;+&lt;Ctrl&gt;+= |
| `decrease-size` | Shrink the window by one step. See [Growing and shrinking](#growing-and-shrinking). | &lt;Super&gt;+&lt;Ctrl&gt;+- |
| `move-monitor-left` | Move the window one monitor left. | &lt;Super&gt;+&lt;Ctrl&gt;+Home |
| `move-monitor-right` | Move the window one monitor right. | &lt;Super&gt;+&lt;Ctrl&gt;+End |
| `move-monitor-up` | Move the window one monitor up. | &lt;Super&gt;+&lt;Ctrl&gt;+Page&nbsp;Up |
| `move-monitor-down` | Move the window one monitor down. | &lt;Super&gt;+&lt;Ctrl&gt;+Page&nbsp;Down |
| `toggle-maximize` | Maximize the window, or restore it if it is already maximized. | &lt;Super&gt;+&lt;Ctrl&gt;+Return |
| `restore-window` | Restore the window to the size and position it had before the current run of Bifocals actions. See [Restoring windows](#restoring-windows). | &lt;Super&gt;+&lt;Ctrl&gt;+BackSpace |

The `cycle-*` actions step through three configurable sizes each, any of which can be disabled — see [Preferences](#preferences). The `move-monitor-*` actions scale the window to keep the same relative size and position on the new monitor, and do nothing if there is no monitor in that direction.


# Growing and shrinking
`increase-size` and `decrease-size` change the window by one step — a percentage of the screen, configurable in the [preferences](#preferences) and applied to both axes.

Which sides move depends on where the window already sits. **A side resting on a screen edge stays put**, so whatever the window is anchored to it stays anchored to, and the whole step lands on the opposite side. A side with room on both ends splits the step evenly, keeping the window centred where it is.

- A `cycle-left` window (anchored left, full height) only grows and shrinks on its right edge.
- A `cycle-top` window keeps its top edge, moves its bottom edge by the full step, and grows or shrinks evenly on the left and right.
- A `cycle-midscreen` window is clear of every edge, so it changes on all four sides at once and stays centred.
- A window filling the screen has no free side, so growing does nothing and shrinking pulls it in from all four sides at once.

Growth stops at the work area, and where one side runs out of room first the rest of the step goes to the other side rather than pushing the window off screen. Shrinking stops at 100px on either axis, and at whatever minimum size the window itself insists on.


# Restoring windows
`restore-window` puts a window back where it was **before the current run of Bifocals actions**, not one step back. Bifocals captures a window's geometry the first time an action moves it and keeps that baseline through any number of consecutive actions, so cycling `cycle-left` through all three widths and then restoring returns to where you started. Move or resize the window yourself at any point and that new geometry becomes the baseline — any change counts, since Bifocals compares actual geometry against what it last set rather than watching for specific events.

- If the window has since moved to another monitor, the baseline is scaled to that monitor the same way `move-monitor-*` works. Restore never flings a window back to a monitor it is no longer on.
- Windows that quantise their own size (`gnome-terminal` sizes in whole character cells) are given a 20px tolerance so they are not mistaken for having been resized by hand.
- A window with no baseline of its own falls back to the most recent baseline recorded for any other normal window of the same application. Dialogs, menus and utility windows are excluded. Baselines live in memory for the session only.
- Clearing the `restore-window` shortcut disables tracking entirely and discards what was recorded, effective immediately. Every other shortcut keeps working; `toggle-maximize` falls through to GNOME's own unmaximize geometry.


# Preferences
Open the preferences dialog via `gnome-extensions prefs bifocals@shiznatix` or through the Extensions app.

All shortcuts are rebindable, and clearing one disables that action.

Each cycle group (Left/Right, Top/Bottom, Midscreen) has three size steps — **Small**, **Medium** and **Large** — each a percentage of the relevant screen axis, and each individually toggleable. Disabled steps are skipped while cycling.

- **Left/Right and Top/Bottom defaults:** 33% → 50% → 67%
- **Midscreen defaults:** 20% → 25% → 33% (applied to both axes)

**Increase / Decrease Size** takes a single **Step** percentage, the amount of the screen added or removed per keypress, defaulting to 5%.

Customised values show a reset button, and **Restore All** at the bottom of the page resets every preference at once.


# Development
__NB!__ Just switch over to Xorg for dev. You can restart Xorg without log out/in!

### Tooling
```
node / npm      TypeScript and eslint
make            the build pipeline
jq              assembles metadata.json
zip             packages the extension
gettext         msgfmt, compiles translations
uv              Python package manager, zip linting
```

1. Install dependencies, build, and install from zip:
	```shell
	make deps all
	```
2. Reload Xorg `Alt+F2` → `r` → `Enter`. After it reloads, it should be visible and active in gnome-extensions.
3. Made changes? Save your files and GOTO step 1 to install and activate them.
4. You will be left with a `bifocals.zip` in the root of the repository.

### Logging
* Use the GJS `log()` and `print()` globals.
* Follow logs
	```shell
	journalctl -f -o cat /usr/bin/gnome-shell
	```

### Translations
Translatable strings use GNU gettext. The source catalogue is `po/en.po`.

Currently available languages: **de**, **en**, **es**, **et**, **it**, **sv**.

To add a new language:
1. Copy `po/en.po` to `po/<lang>.po` and translate the `msgstr` lines.
2. Add `<lang>` to `po/LINGUAS`.
3. Run `make locale` to compile the languages
