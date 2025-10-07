# Webpack Global Variables Fix

## Problem

After migrating from the bash-based build system to webpack, global variables including the `pol` namespace and `CONFIG` were not accessible in the browser. This was because webpack wraps each module in an IIFE (Immediately Invoked Function Expression), creating a local scope that prevents variables from being accessible globally.

## Root Cause

When webpack bundles JavaScript files, it wraps each module in an IIFE like this:

```javascript
(() => {
  var pol = pol || {};  // This creates a LOCAL variable
  pol.core = pol.core || {};
  // ... rest of the code
})();
```

Inside the IIFE, `pol` is a local variable that doesn't exist in the global scope, making it inaccessible from `config.js`, `application.js`, or browser developer tools.

## Solution

The fix involved modifying the source files to explicitly attach the `pol` namespace and `CONFIG` to the `window` object, then creating local aliases within each module for convenience:

### 1. Global Namespace Setup (config.js)

```javascript
// Explicitly attach to window object
window.pol = window.pol || {};
window.pol.core = window.pol.core || {};
window.pol.widget = window.pol.widget || {};
window.pol.ui = window.pol.ui || {};
window.pol.mapref = window.pol.mapref || {};
var pol = window.pol;  // Local alias for convenience within this module

// ... later in the file ...
window.CONFIG = new pol.core.Config(pol.uid);
```

### 2. Local Aliases in Other Modules

All other JavaScript files now include at the top:

```javascript
var pol = window.pol;
```

This creates a local reference to the global `window.pol` object, allowing the existing code to continue working without modification while ensuring the global namespace remains accessible.

### 3. Webpack Configuration

Updated `webpack.config.js` to preserve critical identifiers during minification:

```javascript
optimization: {
  minimize: true,
  concatenateModules: false,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        mangle: {
          reserved: ['window', 'pol', 'CONFIG']
        }
      }
    })
  ]
}
```

## Files Modified

### Core Configuration
- `mapbrowser/config.js` - Changed namespace and CONFIG declarations to use `window`
- `mapbrowser/configSupport.js` - Changed `pol.uid` to `window.pol.uid` and exported all configuration functions to `window` object
- `webpack.config.js` - Added terser configuration to preserve identifiers

### All Module Files (65 files total)
Added `var pol = window.pol;` declaration to:
- All files in `mapbrowser/`
- All files in `layeredit/`
- All files in `tracking/`
- All files in `featureedit/`
- All files in `psadmin/`

### Additional Fix: snow namespace (featureedit/snow subdirectory)
The `snow` global variable in the `featureedit/snow/` subdirectory was fixed using the same pattern:
- `featureedit/snow/drawConfig.js` - Changed to use `window.snow = window.snow || {}; var snow = window.snow;`
- All other files in `featureedit/snow/` - Added `var snow = window.snow;`
- `webpack.config.js` - Added 'snow' to reserved names: `reserved: ['window', 'pol', 'CONFIG', 'snow']`

### Configuration Functions Export (configSupport.js)
To make configuration functions available for the root `config.js` file (which is loaded after the webpack bundle), all configuration helper functions are explicitly exported to the `window` object at the end of `mapbrowser/configSupport.js`. This includes 53+ functions such as:
- Server configuration: `WELCOME`, `LOGO`, `SECURE`, `SERVER`, `PORT`, `WSPREFIX`, `AJAXPREFIX`, etc.
- Map setup: `ADD_PROJECTION`, `PROJECTION`, `CENTER`, `SCALE`, `TILEGRID_WMTS`, etc.
- Layer creation: `LAYERS`, `createLayer_MapCache`, `createLayer_WFS`, `createLayer_GPX`, etc.
- Styling: `STYLES`, `GETSTYLE`, `SETLABEL`, `CIRCLE`, `ICON`, `FEATUREINFO`, etc.
- Predicates: `TRUE`, `AND`, `OR`, `NOT`, `IN_EXTENT`, `POLYGON`, `RESOLUTION_LT`, `SCALE_LT`, etc.
- Views and utilities: `VIEWS`, `WIDGET`, `POPUP`, `GETJSON`, etc.

This allows the root `config.js` to use these functions directly after the minified bundle is loaded.

## Verification

After the fix, the global variables are properly accessible:

```javascript
// In browser console or external scripts:
console.log(typeof pol);        // "object"
console.log(typeof CONFIG);      // "object"
console.log(pol.core);          // Object with pol.core namespace
console.log(CONFIG.get);        // Function
console.log(typeof snow);       // "object" (snow namespace)
console.log(snow.drawMap);      // Object or null

// Configuration functions from configSupport.js:
console.log(typeof WELCOME);    // "function"
console.log(typeof SERVER);     // "function"
console.log(typeof LAYERS);     // "function"
console.log(typeof AND);        // "function"
// ... and 50+ more configuration functions
```

## Benefits

1. **Maintains backward compatibility**: Existing `config.js` and `application.js` files continue to work without modification
2. **Preserves webpack benefits**: Still gets minification, bundling, and build optimization
3. **Minimal code changes**: Only added namespace setup code, didn't restructure the codebase
4. **Debuggable**: Global variables remain accessible in browser developer tools

## Technical Details

- Webpack version: 5.102.0
- Build tool: webpack with terser-webpack-plugin
- Minified bundle sizes:
  - mapbrowser-min.js: 55 KB
  - layeredit-min.js: 19 KB
  - tracking-min.js: 94 KB
  - featureedit-min.js: 37 KB
  - psadmin-min.js: 36 KB
