# Stop on the first failure, including partway through a multi-command recipe or
# a pipeline, where the default `sh` would carry on and report the exit status of
# the last command only.
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:

# `$(shell)` swallows failures, so a missing or malformed metadata.json would
# leave UUID empty and silently name the locale files ".mo".
UUID := $(shell jq -r '.uuid' metadata.json 2>/dev/null)
ifeq (,$(filter-out null,$(UUID)))
$(error Cannot read .uuid from metadata.json)
endif

.DEFAULT_GOAL := build
MAKEFLAGS += --no-print-directory
.PHONY: all deps lint-ts lint-zip tsc metadata locale build package install \
        clean help

deps:
	npm i
	uv venv --clear
	uv sync

tsc:
	node_modules/.bin/tsc

lint-ts:
	node_modules/.bin/eslint src

# shexli always exits 0, even when it reports findings, so the status has to be
# read back out of its JSON to fail the build.
lint-zip:
	.venv/bin/shexli bifocals.zip
	@.venv/bin/shexli --format json bifocals.zip \
	    | jq -e '.summary.status == "clean"' > /dev/null \
	    || { echo "lint-zip: shexli reported findings (see above)"; exit 1; }

metadata:
	@mkdir -p build
	jq --rawfile desc description.txt \
	    '. + { description: ($$desc | gsub("^\\s+|\\s+$$"; "")) }' \
	    metadata.json > build/metadata.json

locale:
	rm -rf build/locale
	while read -r lang; do \
	    mkdir -p build/locale/$$lang/LC_MESSAGES; \
	    msgfmt po/$$lang.po -o build/locale/$$lang/LC_MESSAGES/$(UUID).mo; \
	done < po/LINGUAS

build: clean
	mkdir -p build
	@$(MAKE) -j lint-ts tsc metadata locale
	cp -r LICENSE schemas build/
	@echo "Built $(UUID) to build"

package:
	rm -f bifocals.zip
	cd build && zip -qr ../bifocals.zip .
	@$(MAKE) lint-zip
	@echo "Packaged $(UUID) to bifocals.zip"

install:
	gnome-extensions install --force bifocals.zip
	@echo "Installed $(UUID). Log out and back in to load it."


all:
	@$(MAKE) build package install

clean:
	rm -rf build bifocals.zip

help:
	@echo "Targets:"
	@echo "  build      lint, compile and assemble build/   [default]"
	@echo "  package    zip the build to bifocals.zip"
	@echo "  install    install bifocals.zip into GNOME"
	@echo "  all        build, then package, then install"
	@echo "  lint-ts    eslint the TypeScript sources"
	@echo "  lint-zip   shexli the packaged zip"
	@echo "  clean      remove build/ and bifocals.zip"
