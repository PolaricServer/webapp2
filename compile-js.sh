#!/bin/bash

#
# The closure compiler that comes with debian is far too old. 
# It cannot be used. 
# If you use npm it is fairly easy: Keep the next line as it is. 

closure_compiler () {
    npx google-closure-compiler "$@"
}


#
# combine and minify using the closure compiler
#

D=mapbrowser
closure_compiler --language_in ECMASCRIPT_2015 --js $D/config.js --js $D/server.js --js $D/jscoord.js --js $D/mapref.js --js $D/mapbrowser.js --js $D/widget.js --js $D/featureinfo.js --js $D/uiSupport.js --js $D/popup.js --js $D/popupmenu.js --js $D/measure.js --js $D/toolbar.js --js $D/areaList.js --js $D/mousepos.js --js $D/layerSwitcher.js --js $D/refSearch.js --js $D/configSupport.js --js $D/docreader.js $D/mapInfo.js > mapbrowser-min.js

D=layeredit
closure_compiler --language_in ECMASCRIPT_2015 --js $D/layerEdit.js --js $D/layerList.js --js $D/wmsLayer.js --js $D/wfsLayer.js --js $D/gpxLayer.js --js $D/drawingLayer.js > layeredit-min.js

D=tracking
closure_compiler --language_in ECMASCRIPT_2015 --js $D/tracking.js --js $D/polaricserver.js --js $D/pubsub.js --js $D/mapupdate.js --js $D/search.js --js $D/filters.js --js $D/notifier.js --js $D/bullboard.js --js $D/history.js --js $D/heardvia.js --js $D/labelStyle.js --js $D/trackeralias.js --js $D/globalsettings.js --js $D/mytrackers.js --js $D/ownobjects.js --js $D/signs.js --js $D/ownpos.js --js $D/sarmode.js --js $D/trailinfo.js --js $D/tags.js  --js $D/users.js --js $D/passwd.js --js $D/bikewheel.js --js $D/mailbox.js > tracking-min.js

D=featureedit
closure_compiler --language_in ECMASCRIPT_2015 --js $D/snow/drawConfig.js --js $D/snow/drawGlobals.js --js $D/snow/undoFunctions.js --js $D/snow/drawStyle.js --js $D/snow/drawFunctions.js --js $D/snow/drawTooltipHelper.js --js $D/snow/drawEvents.js --js $D/snow/gpxDownload.js --js $D/snow/drawIcons.js --js $D/snow/mithrilDrawBox.js --js $D/snow/mithrilIcons.js --js $D/snow/measureTooltip.js --js $D/featureEdit.js --js $D/properties.js > featureedit-min.js


closure_compiler --language_in ECMASCRIPT_2015 --js application.js > application-min.js

#
# combine and minify css
#
cd style
cat polaric.css popup.css tracking.css mobil.css drawStyle.css mobileStyle.css | cleancss -o style-min.css

cd ..
