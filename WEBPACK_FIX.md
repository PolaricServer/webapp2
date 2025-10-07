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
- `mapbrowser/configSupport.js` - Changed `pol.uid` to `window.pol.uid`
- `webpack.config.js` - Added terser configuration to preserve identifiers

### All Module Files (65 files total)
Added `var pol = window.pol;` declaration to:
- All files in `mapbrowser/`
- All files in `layeredit/`
- All files in `tracking/`
- All files in `featureedit/`
- All files in `psadmin/`

## Verification

After the fix, the global variables are properly accessible:

```javascript
// In browser console or external scripts:
console.log(typeof pol);        // "object"
console.log(typeof CONFIG);      // "object"
console.log(pol.core);          // Object with pol.core namespace
console.log(CONFIG.get);        // Function
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
  - mapbrowser-min.js: 48 KB
  - layeredit-min.js: 19 KB
  - tracking-min.js: 94 KB
  - featureedit-min.js: 36 KB
  - psadmin-min.js: 36 KB
