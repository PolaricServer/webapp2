# Webpack Migration

This document describes the migration from bash-based concatenation to webpack bundling, and the subsequent migration to ES6 modules.

## What Changed

The project previously used a bash script (`compile-js.sh`) that concatenated and minified JavaScript files using Babel. The project has now been migrated to:
1. Use webpack for bundling (first migration)
2. Output ES6 modules instead of global scripts (current migration)

## Build System

The project now uses webpack 5 to bundle the JavaScript files into ES6 modules. The build process is defined in `webpack.config.js` and can be triggered using npm scripts.

## Modules

The webapp is now bundled into 5 separate ES6 modules:

1. **mapbrowser-min.js** (51 KB) - Core map browser functionality (ES6 module)
   - Configuration, security utilities, server communication
   - Map browser, widgets, feature info, time utilities
   - UI support, popup, context menu, measure tools
   - Toolbar, area list, mouse position, layer switcher
   - Reference search, documentation reader, map info
   - **Exports**: `pol`, `CONFIG`

2. **layeredit-min.js** (19 KB) - Layer editing widgets (ES6 module)
   - Layer editor and list
   - WMS, WFS, GPX, and drawing layer support

3. **tracking-min.js** (94 KB) - Tracking and object features (ES6 module)
   - Tracking functionality and Polaric server integration
   - Map updates, search, filters, notifications
   - Bulletin board, history, time machine
   - Tracker management, own objects, signs
   - Trail info, tags, sharing, APRS packets
   - Point info, telemetry, login, photo descriptions

4. **featureedit-min.js** (36 KB) - Feature drawing tools (ES6 module)
   - Drawing configuration and globals
   - Drawing styles, functions, tooltips
   - Icon tools and drawing events
   - GPX download, measure tooltips
   - Feature editor and properties

5. **psadmin-min.js** (36 KB) - System admin utilities (ES6 module)
   - Password management
   - Status information
   - Sync nodes
   - User management
   - Server configuration
   - Own position configuration
   - Channel management
   - REST API test bench

All modules contribute to the global `pol` namespace for backward compatibility with existing code.

## ES6 Module Structure

The application now uses ES6 modules. Each module bundle has an entry point file (`index.js`) that imports all the component files in the correct order. The bundles are loaded as ES6 modules in `application.js`.

### Module Loading

The main `index.html` loads:
1. External libraries (jQuery, OpenLayers, Mithril, etc.) as regular scripts
2. `config.js` as a regular script (sets up configuration)
3. `application.js` as an ES6 module (imports all bundles)

In `application.js`, the modules are imported:
```javascript
import { pol, CONFIG } from './mapbrowser-min.js';
import './layeredit-min.js';
import './tracking-min.js';
import './featureedit-min.js';
import './psadmin-min.js';
```

### Entry Points

Each module directory now contains an `index.js` file that serves as the entry point:
- `mapbrowser/index.js` - Exports `pol` and `CONFIG` from the global scope
- `layeredit/index.js` - Imports layeredit components
- `tracking/index.js` - Imports tracking components
- `featureedit/index.js` - Imports feature editing components
- `psadmin/index.js` - Imports admin components

The entry points import the individual source files which populate the global `pol` namespace. The mapbrowser entry point exports the global `pol` and `CONFIG` objects so they can be imported by `application.js`.

## Build Commands

### Production Build
```bash
npm run build
```
This creates minified bundles for production use.

### Development Build
```bash
npm run dev
```
This creates unminified bundles with source maps for development.

### Watch Mode
```bash
npm run watch
```
Automatically rebuilds when source files change.

### Using Make
```bash
make compile
```
Runs `npm install` and `npm run build`.

## CSS Compilation

CSS files are also concatenated and minified during the build process:
- Input: `polaric.css`, `widget.css`, `popup.css`, `tracking.css`, `mobil.css`, `drawStyle.css`, `mobileStyle.css`
- Output: `style/style-min.css` (29 KB)

## Files to Ignore

The following generated files are excluded from version control via `.gitignore`:
- `node_modules/` - npm dependencies
- `*-min.js` - Generated JavaScript bundles
- `*-min.js.LICENSE.txt` - License information extracted by webpack
- `style/style-min.css` - Generated CSS bundle
- `*.log` - Log files

## Old Build System

The old `compile-js.sh` script has been marked as deprecated but is kept for reference. It is no longer used in the build process.

## Dependencies

The build system requires:
- Node.js and npm
- webpack 5.x
- webpack-cli 5.x
- clean-css-cli 5.x

These are automatically installed when running `npm install`.

## Notes

- The code continues to use namespace-based JavaScript (ES5/ES6 with namespaces like `pol.core`, `pol.tracking`, etc.) for internal organization
- The individual source files remain unchanged and contribute to global namespaces
- Webpack bundles these files and outputs them as ES6 modules
- The mapbrowser module exports `pol` and `CONFIG` which can be imported by application.js
- Each bundle is now an ES6 module, loaded using `import` statements in application.js
- The `config.js` file is still loaded as a regular script before application.js to set up configuration
- For development, `index-dev.html` can be used which loads individual source files without bundling
