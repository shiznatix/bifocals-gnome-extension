#!/bin/sh -e

# Launches a nested GNOME Shell compositor inside a new D-Bus session on a
# virtual 1366x768 display. Useful for testing extension changes without
# affecting the host session. Run `scripts/link.sh` first so the extension is
# symlinked into the nested shell's extension directory.

# Uncomment to enable verbose GLib/GNOME Shell debug logging:
# export G_MESSAGES_DEBUG=all
export MUTTER_DEBUG_DUMMY_MODE_SPECS=1366x768
export SHELL_DEBUG=all

dbus-run-session -- gnome-shell --nested --wayland
