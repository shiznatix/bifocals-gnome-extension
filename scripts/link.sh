#!/bin/bash

# Symlinks the dist/ build output into the GNOME Shell extensions directory so
# the extension can be loaded without installing it from a zip. Run this once
# after the initial build, then `npm run build:watch` rebuilds are picked up
# automatically. Reload the extension after running (e.g.
# `gnome-extensions disable bifocals-dev@shiznatix && gnome-extensions enable
# bifocals-dev@shiznatix`, no logout required on GNOME 45+).
#
# Uses a distinct UUID (bifocals-dev@shiznatix) rather than the published
# bifocals@shiznatix. gnome-shell periodically polls extensions.gnome.org for
# updates by UUID and silently overwrites an out-of-date install at next
# login -- with the real UUID that clobbers this dev symlink with the
# published release. A UUID unknown to extensions.gnome.org is never flagged
# as out of date. Since gnome-shell requires the extension directory name to
# match the `uuid` field inside its own metadata.json, this patches that
# field in the built dist/metadata.json rather than the committed
# src/metadata.json (which must keep the real UUID for the published
# release). A full `npm run build` regenerates dist/metadata.json from
# scratch, so rerun this script after one; incremental `build:watch` compiles
# don't touch metadata.json, so the patched UUID survives those.

set -e

SCRIPT_PATH=$(readlink -f $0)
REPO_PATH=$(dirname "$(dirname "${SCRIPT_PATH}")")
DIST_PATH="${REPO_PATH}/dist"
DEV_UUID="bifocals-dev@shiznatix"

sed -i "s/\"uuid\": \"bifocals@shiznatix\"/\"uuid\": \"${DEV_UUID}\"/" "${DIST_PATH}/metadata.json"

rm -rf ~/.local/share/gnome-shell/extensions/${DEV_UUID}
ln -s $DIST_PATH ~/.local/share/gnome-shell/extensions/${DEV_UUID}
