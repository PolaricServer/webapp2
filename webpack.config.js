const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    'mapbrowser-min': [
      './mapbrowser/config.js',
      './mapbrowser/secUtils.js',
      './mapbrowser/server.js',
      './mapbrowser/jscoord.js',
      './mapbrowser/mapref.js',
      './mapbrowser/mapbrowser.js',
      './mapbrowser/widget.js',
      './mapbrowser/featureinfo.js',
      './mapbrowser/time.js',
      './mapbrowser/uiSupport.js',
      './mapbrowser/popup.js',
      './mapbrowser/popupmenu.js',
      './mapbrowser/measure.js',
      './mapbrowser/toolbar.js',
      './mapbrowser/areaList.js',
      './mapbrowser/mousepos.js',
      './mapbrowser/layerSwitcher.js',
      './mapbrowser/refSearch.js',
      './mapbrowser/configSupport.js',
      './mapbrowser/docreader.js',
      './mapbrowser/mapInfo.js'
    ],
    'layeredit-min': [
      './layeredit/layerEdit.js',
      './layeredit/layerList.js',
      './layeredit/wmsLayer.js',
      './layeredit/wfsLayer.js',
      './layeredit/gpxLayer.js',
      './layeredit/drawingLayer.js'
    ],
    'tracking-min': [
      './tracking/tracking.js',
      './tracking/polaricserver.js',
      './tracking/pubsub.js',
      './tracking/mapupdate.js',
      './tracking/search.js',
      './tracking/filters.js',
      './tracking/notifier.js',
      './tracking/bullboard.js',
      './tracking/history.js',
      './tracking/timemachine.js',
      './tracking/heardvia.js',
      './tracking/labelStyle.js',
      './tracking/trackeralias.js',
      './tracking/globalsettings.js',
      './tracking/mytrackers.js',
      './tracking/ownobjects.js',
      './tracking/signs.js',
      './tracking/ownpos.js',
      './tracking/trailinfo.js',
      './tracking/tags.js',
      './tracking/bikewheel.js',
      './tracking/mailbox.js',
      './tracking/sharing.js',
      './tracking/aprspackets.js',
      './tracking/pointinfo.js',
      './tracking/telemetry.js',
      './tracking/telhist.js',
      './tracking/login.js',
      './tracking/photodescr.js'
    ],
    'featureedit-min': [
      './featureedit/snow/drawConfig.js',
      './featureedit/snow/drawGlobals.js',
      './featureedit/snow/undoFunctions.js',
      './featureedit/snow/drawStyle.js',
      './featureedit/snow/drawFunctions.js',
      './featureedit/snow/drawTooltipHelper.js',
      './featureedit/snow/drawEvents.js',
      './featureedit/snow/gpxDownload.js',
      './featureedit/snow/drawIcons.js',
      './featureedit/snow/mithrilDrawBox.js',
      './featureedit/snow/mithrilIcons.js',
      './featureedit/snow/measureTooltip.js',
      './featureedit/featureEdit.js',
      './featureedit/properties.js'
    ],
    'psadmin-min': [
      './psadmin/passwd.js',
      './psadmin/statusInfo.js',
      './psadmin/syncnodes.js',
      './psadmin/users.js',
      './psadmin/serverconfig.js',
      './psadmin/ownposconfig.js',
      './psadmin/channels.js',
      './psadmin/testrest.js'
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname)
  },
  optimization: {
    minimize: true,
    concatenateModules: false, // Don't concatenate to preserve namespace order
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false
          },
          compress: {
            defaults: true,
            unused: true
          },
          mangle: {
            reserved: ['window', 'pol', 'CONFIG'] // Don't mangle these names
          },
        },
        extractComments: false
      })
    ]
  }
};
