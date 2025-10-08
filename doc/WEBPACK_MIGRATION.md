# Webpack Migration

This document describes the migration from the bash-based build system to webpack.

## What Changed

The project previously used a bash script (`compile-js.sh`) that concatenated and minified JavaScript files using Babel. The project has now been migrated to use webpack for bundling.

## Modules

The webapp is now bundled into 5 separate modules:

1. **mapbrowser-min.js** (47 KB) - Core map browser functionality
   - Configuration, security utilities, server communication
   - Map browser, widgets, feature info, time utilities
   - UI support, popup, context menu, measure tools
   - Toolbar, area list, mouse position, layer switcher
   - Reference search, documentation reader, map info

2. **layeredit-min.js** (19 KB) - Layer editing widgets
   - Layer editor and list
   - WMS, WFS, GPX, and drawing layer support

3. **tracking-min.js** (93 KB) - Tracking and object features
   - Tracking functionality and Polaric server integration
   - Map updates, search, filters, notifications
   - Bulletin board, history, time machine
   - Tracker management, own objects, signs
   - Trail info, tags, sharing, APRS packets
   - Point info, telemetry, login, photo descriptions

4. **featureedit-min.js** (36 KB) - Feature drawing tools
   - Drawing configuration and globals
   - Drawing styles, functions, tooltips
   - Icon tools and drawing events
   - GPX download, measure tooltips
   - Feature editor and properties

5. **psadmin-min.js** (36 KB) - System admin utilities
   - Password management
   - Status information
   - Sync nodes
   - User management
   - Server configuration
   - Own position configuration
   - Channel management
   - REST API test bench

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

- The code continues to use namespace-based JavaScript (ES5/ES6 with namespaces like `pol.core`, `pol.tracking`, etc.)
- Webpack is configured to preserve these namespaces in the output
- The bundles are designed to be loaded in order in HTML files
- Each bundle depends on previous bundles being loaded
