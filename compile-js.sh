#!/bin/bash

#
# combine and minify using the closure compiler
#

cd mapbrowser
closure-compiler --js jscoord.js --js config.js --js mapbrowser.js --js popup.js --js popupmenu.js --js toolbar.js --js mousepos.js --js layerSwitcher.js --js configSupport.js > ../mapbrowser-min.js

cd ..
