#!/bin/bash

#
# combine and minify using the closure compiler
#

cd mapbrowser
closure-compiler --js config.js --js server.js --js jscoord.js --js mapref.js --js mapbrowser.js --js widget.js --js uiSupport.js --js popup.js --js popupmenu.js --js measure.js --js toolbar.js --js areaList.js --js mousepos.js --js layerSwitcher.js --js refSearch.js --js configSupport.js > ../mapbrowser-min.js

cd ..
cd layeredit
closure-compiler --js layerEdit.js --js layerList.js --js wmsLayer.js --js wfsLayer.js > ../layeredit-min.js

cd ..
cd tracking
closure-compiler --js tracking.js --js polaricserver.js --js mapupdate.js --js search.js --js filters.js > ../tracking-min.js
