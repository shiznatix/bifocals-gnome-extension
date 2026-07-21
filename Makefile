SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := build
MAKEFLAGS += --no-print-directory
.PHONY: all deps lint-ts lint-zip tsc metadata locale icons build package install \
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
# read back out of its JSON to fail the build. The report is captured rather than
# streamed so the findings can still be shown when it is not clean.
lint-zip:
	@[[ -f bifocals.zip ]] || { echo "lint-zip: no bifocals.zip, run 'make package' first"; exit 1; }
	@report=$$(.venv/bin/shexli --format json bifocals.zip); \
	    jq -e '.summary.status == "clean"' > /dev/null <<< "$$report" \
	    || { jq '.findings' <<< "$$report"; \
	         echo "lint-zip: shexli reported findings (see above)"; exit 1; }

metadata:
	@mkdir -p build
	jq --rawfile desc description.txt \
	    '. + { description: ($$desc | gsub("^\\s+|\\s+$$"; "")) }' \
	    metadata.json > build/metadata.json

locale:
	@rm -rf build/locale
	while read -r lang; do \
	    mkdir -p build/locale/$$lang/LC_MESSAGES; \
	    msgfmt po/$$lang.po -o build/locale/$$lang/LC_MESSAGES/bifocals@shiznatix.mo; \
	done < po/LINGUAS

# Rasterises icon/icon.svg to the committed icon/icon-*.png sizes. Not part of the
# build; run it after editing icon.svg. uv pulls cairosvg into an ephemeral env, so
# nothing is added to the project venv.
icons:
	uv run --with cairosvg python -c "import cairosvg; [cairosvg.svg2png(url='icon/icon.svg', write_to='icon/icon-%d.png' % s, output_width=s, output_height=s) for s in (16, 32, 48, 64, 128, 256)]"
	@echo "icons: wrote icon/icon-{16,32,48,64,128,256}.png"

build: clean
	mkdir -p build
	@$(MAKE) -j lint-ts tsc metadata locale
	cp -r LICENSE schemas build/

package:
	@[[ -d build ]] || { echo "package: no build/ directory, run 'make build' first"; exit 1; }
	@rm -f bifocals.zip
	cd build && zip -qr ../bifocals.zip .
	@$(MAKE) lint-zip

install:
	gnome-extensions install --force bifocals.zip
	@echo "Installed bifocals@shiznatix. Log out and back in to load it."

all:
	@$(MAKE) build package install

clean:
	rm -rf build bifocals.zip

help:
	@echo "Targets:"
	@echo "  deps       install npm and uv dependencies"
	@echo "  build      lint, compile and assemble build/   [default]"
	@echo "  package    zip the build to bifocals.zip"
	@echo "  install    install bifocals.zip into GNOME"
	@echo "  all        build, then package, then install"
	@echo "  lint-ts    eslint the TypeScript sources"
	@echo "  lint-zip   shexli the packaged zip"
	@echo "  icons      re-render icon/icon-*.png from icon.svg"
	@echo "  clean      remove build/ and bifocals.zip"
