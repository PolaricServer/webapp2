# Configuration Functions Export Solution

## Problem Statement

The `config.js` file in the root directory depends on global functions defined in `mapbrowser/configSupport.js` (such as `WELCOME()`, `LOGO()`, `SERVER()`, etc.). When webpack bundles the application, these functions become module-scoped and are not accessible globally for the root `config.js` to use.

## Solution

To make these functions available with minimal effort, all configuration helper functions are explicitly exported to the `window` object at the end of `mapbrowser/configSupport.js`.

### Implementation

At the end of `mapbrowser/configSupport.js`, add the following export statements:

```javascript
/*
 * Export all configuration functions to window object so they are available
 * globally for use in config.js (which is loaded after the webpack bundle)
 */
window.WELCOME = WELCOME;
window.LOGO = LOGO;
window.SERVER = SERVER;
// ... (all other functions)
```

This approach:
1. ✅ Requires minimal code changes (just export statements)
2. ✅ Maintains backward compatibility
3. ✅ Preserves webpack's minification and bundling benefits
4. ✅ Makes functions accessible in both development and production modes

## Usage

The root `config.js` can now use these functions directly:

```javascript
// Server configuration
WSPREFIX("ws");
AJAXPREFIX("srv");
SERVER("https://example.com");
PORT(8081);

// Map configuration
PROJECTION("EPSG:3857");
CENTER(14, 66);
SCALE(20000);

// Layers
LAYERS({
    base: true,
    predicate: TRUE,
    projection: "EPSG:3857",
}, [
    new ol.layer.Tile({
        name: 'OpenStreetMap',
        source: new ol.source.OSM()
    })
]);
```

## Exported Functions

All 53+ configuration functions are now globally accessible:

### Server Configuration
- `WELCOME`, `LOGO`, `SECURE`, `SERVER`, `PORT`, `WSPREFIX`, `AJAXPREFIX`
- `ICONPATH`, `DEFAULT_ICON`, `MAX_CLIENTS`
- `ALT_SECURE`, `ALT_SERVER`, `ALT_PORT`

### Map Setup
- `ADD_PROJECTION`, `PROJECTION`, `SUPPORTED_PROJ`
- `CENTER`, `SCALE`, `TILEGRID_WMTS`

### Layer Configuration
- `LAYERS`, `createLayer_MapCache`, `createLayer_WFS`, `createLayer_GPX`

### Styling
- `STYLES`, `GETSTYLE`, `SETLABEL`, `CIRCLE`, `ICON`, `TESTRES`, `FEATUREINFO`

### Predicates
- `TRUE`, `AND`, `OR`, `NOT`
- `IN_EXTENT`, `POLYGON`, `SELECTED_BASE`, `IS_PROJ`
- `RESOLUTION_LT`, `RESOLUTION_GT`, `SCALE_LT`, `SCALE_GT`, `LOGIN`

### Views & Utilities
- `VIEWS`, `WIDGET`, `POPUP`
- `GETJSON`, `getWIDGET`, `ll2proj`, `proj2ll`
- `DEFAULT_FILTER`

## Build Process

The webpack build process:
1. Bundles all modules into minified files
2. Preserves the `window.*` export statements
3. Makes functions available globally after bundle loads
4. `config.js` (loaded after bundle) can use functions directly

```bash
npm run build
# Creates mapbrowser-min.js with all exported functions
```

## Verification

After building, you can verify in the browser console:

```javascript
// All functions are available globally
console.log(typeof WELCOME);    // "function"
console.log(typeof SERVER);     // "function"
console.log(typeof LAYERS);     // "function"
console.log(typeof CONFIG);     // "object"
```

## Benefits

1. **Minimal Effort**: Single file modification with straightforward exports
2. **Backward Compatible**: Existing config.js files work without changes
3. **Development & Production**: Works in both index-dev.html and index.html
4. **Maintainable**: Clear pattern for adding new configuration functions
5. **Webpack Compatible**: Preserves all webpack optimization benefits

## See Also

- `WEBPACK_FIX.md` - Documentation of the webpack migration and global namespace fixes
- `mapbrowser/configSupport.js` - Source file with function definitions and exports
- `config.js` - Example configuration file using these functions
