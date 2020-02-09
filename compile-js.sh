#!/bin/bash

#
# combine and minify using the closure compiler
#

cd mapbrowser
closure-compiler --language_in ECMASCRIPT6 --js config.js --js server.js --js jscoord.js --js mapref.js --js mapbrowser.js --js widget.js --js featureinfo.js --js uiSupport.js --js popup.js --js popupmenu.js --js measure.js --js toolbar.js --js areaList.js --js mousepos.js --js layerSwitcher.js --js refSearch.js --js configSupport.js > ../mapbrowser-min.js

cd ..
cd layeredit
closure-compiler --language_in ECMASCRIPT6 --js layerEdit.js --js layerList.js --js wmsLayer.js --js wfsLayer.js --js gpxLayer.js --js drawingLayer.js > ../layeredit-min.js

cd ..
cd tracking
closure-compiler --language_in ECMASCRIPT6 --js tracking.js --js polaricserver.js --js pubsub.js --js mapupdate.js --js search.js --js filters.js --js notifier.js --js bullboard.js --js history.js --js heardvia.js --js labelStyle.js --js trackeralias.js --js globalsettings.js --js mytrackers.js --js ownobjects.js --js ownpos.js --js sarmode.js --js trailinfo.js --js tags.js > ../tracking-min.js

cd ..
cd featureedit
closure-compiler --language_in ECMASCRIPT6 --js snow/drawConfig.js --js snow/drawGlobals.js --js snow/undoFunctions.js --js snow/drawStyle.js --js snow/drawFunctions.js --js snow/drawTooltipHelper.js --js snow/drawEvents.js --js snow/gpxDownload.js --js snow/drawIcons.js --js snow/mithrilDrawBox.js --js snow/mithrilIcons.js --js snow/measureTooltip.js --js featureEdit.js --js properties.js >  ../featureedit-min.js


cd ..
closure-compiler --language_in ECMASCRIPT6 --js application.js > application-min.js

#
# combine and minify css
#
cd style
cat polaric.css popup.css tracking.css mobil.css drawStyle.css mobileStyle.css | cleancss -o style-min.css

cd ..
