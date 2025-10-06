const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'mapbrowser-min': './mapbrowser/index.js',
    'layeredit-min': './layeredit/index.js',
    'tracking-min': './tracking/index.js',
    'featureedit-min': './featureedit/index.js',
    'psadmin-min': './psadmin/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname),
    library: {
      type: 'module'
    }
  },
  experiments: {
    outputModule: true
  },
  optimization: {
    minimize: true,
    concatenateModules: false // Don't concatenate to preserve namespace order
  }
};
