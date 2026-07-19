ifneq (,$(filter dev,$(MAKECMDGOALS)))
DEV := 1
endif
export DEV

META_SELECT := $(if $(DEV),(.default + .dev),.default)
ZIP := dist/bifocals$(if $(DEV),-dev).zip
UUID := $(shell jq -r '$(META_SELECT).uuid' metadata.tmpl.json)

.DEFAULT_GOAL := build
MAKEFLAGS += --no-print-directory
.PHONY: all dev lint-ts lint-zip tsc metadata locale build package install \
        clean clean-all help

dev:
	@:

deps:
	npm i
	uv venv --clear
	uv sync

tsc:
	node_modules/.bin/tsc --outDir build

lint-ts:
	node_modules/.bin/eslint src

# shexli always exits 0, even when it reports findings, so the status has to be
# read back out of its JSON to fail the build.
lint-zip:
	.venv/bin/shexli $(ZIP)
	@.venv/bin/shexli --format json $(ZIP) \
	    | jq -e '.summary.status == "clean"' > /dev/null \
	    || { echo "lint-zip: shexli reported findings (see above)"; exit 1; }

metadata:
	@mkdir -p build
	jq --rawfile desc description.txt \
	    '($(META_SELECT)) + { description: ($$desc | gsub("^\\s+|\\s+$$"; "")) }' \
	    metadata.tmpl.json > build/metadata.json

locale:
	rm -rf build/locale
	while read -r lang; do \
	    mkdir -p build/locale/$$lang/LC_MESSAGES; \
	    msgfmt po/$$lang.po -o build/locale/$$lang/LC_MESSAGES/$(UUID).mo || exit 1; \
	done < po/LINGUAS

build: clean
	mkdir -p build
	@$(MAKE) -j lint-ts tsc metadata locale
	cp -r LICENSE schemas build/
	@echo "Built $(UUID) to build"

package:
	mkdir -p dist
	rm -f $(ZIP)
	cd build && zip -qr ../$(ZIP) .
	@$(MAKE) lint-zip
	@echo "Packaged $(UUID) to $(ZIP)"

install:
	gnome-extensions install --force $(ZIP)
	@echo "Installed $(UUID). Log out and back in to load it."


all:
	@$(MAKE) build package install

clean:
	rm -rf build $(ZIP)

clean-all:
	rm -rf build dist

help:
	@echo "Targets:"
	@echo "  dev        flag all following goals as DEV"
	@echo "  build      lint, compile and assemble build/   [default]"
	@echo "  package    zip the build to $(ZIP)"
	@echo "  install    install $(ZIP) into GNOME"
	@echo "  all        build, then package, then install"
	@echo "  lint-ts    eslint the TypeScript sources"
	@echo "  lint-zip   shexli the packaged zip"
	@echo "  clean      remove build/ and $(ZIP)"
	@echo "  clean-all  remove build/ and dist/ entirely"
