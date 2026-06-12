#!/bin/bash

# Installs the extension from the bifocals.zip build artifact into the GNOME
# Shell extensions directory. Run `npm run build` first to produce the zip.
# After installation, restart GNOME Shell (log out/in on Wayland) to load it.

set -e

SCRIPT_PATH=$(readlink -f "$0")
REPO_PATH=$(dirname "$(dirname "${SCRIPT_PATH}")")
ZIP_PATH="${REPO_PATH}/bifocals.zip"
INSTALL_DIR="${HOME}/.local/share/gnome-shell/extensions/bifocals@shiznatix"

if [ ! -f "${ZIP_PATH}" ]; then
    echo "Error: ${ZIP_PATH} not found. Run 'npm run build' first." >&2
    exit 1
fi

rm -rf "${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}"
unzip -q "${ZIP_PATH}" -d "${INSTALL_DIR}"

echo "Installed to ${INSTALL_DIR}"
echo "Restart GNOME Shell to apply changes."
