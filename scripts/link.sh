#!/bin/bash

# Symlinks the dist/ build output into the GNOME Shell extensions directory so
# the extension can be loaded without installing it from a zip. Run this once
# after the initial build, then `npm run build` rebuilds are picked up
# automatically. Restart GNOME Shell (or log out/in) after running.

SCRIPT_PATH=$(readlink -f $0)
REPO_PATH=$(dirname "$(dirname "${SCRIPT_PATH}")")
DIST_PATH="${REPO_PATH}/dist"

rm -rf ~/.local/share/gnome-shell/extensions/bifocals@shiznatix
ln -s $DIST_PATH ~/.local/share/gnome-shell/extensions/bifocals@shiznatix
