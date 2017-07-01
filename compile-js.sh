#!/bin/bash

#
# combine and minify using the closure compiler
#

cd mapbrowser
closure-compiler --js jscoord.js --js config.js --js mapref.js --js mapbrowser.js --js widget.js --js uiSupport.js --js popup.js --js popupmenu.js --js toolbar.js --js areaList.js --js mousepos.js --js layerSwitcher.js --js app.js --js configSupport.js > ../mapbrowser-min.js

cd ..
