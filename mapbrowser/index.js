/*
 * Entry point for mapbrowser module
 * This file imports all mapbrowser components in order and exports the pol namespace
 */

import './config.js';
import './secUtils.js';
import './server.js';
import './jscoord.js';
import './mapref.js';
import './mapbrowser.js';
import './widget.js';
import './featureinfo.js';
import './time.js';
import './uiSupport.js';
import './popup.js';
import './popupmenu.js';
import './measure.js';
import './toolbar.js';
import './areaList.js';
import './mousepos.js';
import './layerSwitcher.js';
import './refSearch.js';
import './configSupport.js';
import './docreader.js';
import './mapInfo.js';

// Export the pol namespace that was populated by the imports above
export const pol = window.pol;
export const CONFIG = window.CONFIG;
