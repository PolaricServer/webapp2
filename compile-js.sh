#!/bin/bash


BABEL="babeljs --minified --compact=true --no-comments"

#
# combine and minify using the babel compiler
#

D=mapbrowser
$BABEL $D/config.js $D/server.js $D/jscoord.js $D/mapref.js $D/mapbrowser.js $D/widget.js $D/featureinfo.js $D/time.js $D/uiSupport.js $D/popup.js $D/popupmenu.js $D/measure.js $D/toolbar.js $D/areaList.js $D/mousepos.js $D/layerSwitcher.js $D/refSearch.js $D/configSupport.js $D/docreader.js $D/mapInfo.js > mapbrowser-min.js

D=layeredit
$BABEL $D/layerEdit.js $D/layerList.js $D/wmsLayer.js $D/wfsLayer.js $D/gpxLayer.js $D/drawingLayer.js > layeredit-min.js

D=tracking
$BABEL $D/tracking.js $D/polaricserver.js $D/pubsub.js $D/mapupdate.js $D/search.js $D/filters.js $D/notifier.js $D/bullboard.js $D/history.js $D/timemachine.js $D/heardvia.js $D/labelStyle.js $D/trackeralias.js $D/globalsettings.js $D/mytrackers.js $D/ownobjects.js $D/signs.js $D/ownpos.js $D/sarmode.js $D/trailinfo.js $D/tags.js $D/users.js $D/passwd.js $D/bikewheel.js $D/mailbox.js $D/sharing.js $D/aprspackets.js $D/pointinfo.js $D/telemetry.js $D/telhist.js $D/authinfo.js $D/syncnodes.js > tracking-min.js

D=featureedit
$BABEL $D/snow/drawConfig.js $D/snow/drawGlobals.js $D/snow/undoFunctions.js $D/snow/drawStyle.js $D/snow/drawFunctions.js $D/snow/drawTooltipHelper.js $D/snow/drawEvents.js $D/snow/gpxDownload.js $D/snow/drawIcons.js $D/snow/mithrilDrawBox.js $D/snow/mithrilIcons.js $D/snow/measureTooltip.js $D/featureEdit.js $D/properties.js > featureedit-min.js



#
# combine and minify css
#
cd style
cat polaric.css widget.css popup.css tracking.css mobil.css drawStyle.css mobileStyle.css | cleancss -o style-min.css

cd ..
