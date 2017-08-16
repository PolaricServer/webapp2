#!/bin/bash

#
# combine and minify using the closure compiler
#

cd mapbrowser
closure-compiler --js jscoord.js --js config.js --js mapref.js --js mapbrowser.js --js widget.js --js uiSupport.js --js popup.js --js popupmenu.js --js measure.js --js toolbar.js --js areaList.js --js mousepos.js --js layerSwitcher.js --js app.js --js configSupport.js > ../mapbrowser-min.js

cd ..
cd layeredit
closure-compiler --js layerList.js --js layerEdit.js --js wmsLayer.js --js wfsLayer.js > ../layeredit-min.js

cd ..
cd tracking
closure-compiler --js mapupdate.js --js tracking.js > ../tracking-min.js
