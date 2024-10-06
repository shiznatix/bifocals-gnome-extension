#!/bin/bash

SCRIPT_PATH=$(readlink -f $0)
REPO_PATH=$(dirname "$(dirname "${SCRIPT_PATH}")")
DIST_PATH="${REPO_PATH}/dist"

rm -rf ~/.local/share/gnome-shell/extensions/bifocals@shiznatix
ln -s $DIST_PATH ~/.local/share/gnome-shell/extensions/bifocals@shiznatix
