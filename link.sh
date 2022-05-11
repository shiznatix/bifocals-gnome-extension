#!/bin/bash

SCRIPT=$(readlink -f $0)
SCRIPT_PATH=`dirname $SCRIPT`

rm -rf ~/.local/share/gnome-shell/extensions/bifocals@shiznatix
ln -s $SCRIPT_PATH ~/.local/share/gnome-shell/extensions/bifocals@shiznatix
