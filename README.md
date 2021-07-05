# bifocals-gnome-extension
Gnome extension adding more window management keyboard shortcuts

# Shortcuts
| Name | Description | Default Keybinding |
| ---- | ----------- | ------------------ |
| `toggle-left` | Toggle size while anchored to the left. Toggles through 3 sizes:<ul><li>1/3 width</li> <li>1/2 width</li> <li>2/3 width</li></ul> | &lt;Super&gt;+&lt;Alt&gt;+Left |
| `toggle-right` | Toggle size while anchored to the right. Toggles through 3 sizes:<ul><li>1/3 width</li> <li>1/2 width</li> <li>2/3 width</li></ul> | &lt;Super&gt;+&lt;Alt&gt;+Right |
| `midscreen` | Move the window to the middle of the screen and make the height and width each 1/4th of their respective axis size. | &lt;Super&gt;+&lt;Alt&gt;+m |


# Helpful commands & links
* `gnome-extensions prefs bifocals@shiznatix` Open preferences dialog
* `glib-compile-schemas schemas` Must be run after any changes to gchema.xml
* Typescript Gnome types (incomplete) https://raw.githubusercontent.com/gTile/gTile/master/gnometypes.ts
