 
/*
 Map browser based on OpenLayers 4. 
 configuration support. 
 
 Copyright (C) 2017 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published 
 by the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

/** @namespace */
var polaric = polaric || {};

console.assert = console.assert || function() {};




/** 
 *  @classdesc 
 *  Configuration of map browser application.
 *  @constructor 
 *  @param {string} uid - Identifier of configuration (see also setUid).
 */

polaric.Config = function(uid) {
   this.uid = uid;
   this.mb = null;
   this.storage = window.localStorage;
   this.sstorage = window.sessionStorage;
   this.baseLayers = [];
   this.oLayers = []
   this.oLayersCount = 0;
   this.aMaps = new Array(); 
   
   this.props = {
      projection: "EPSG:900913",
      center: [0,0]
   }
}
ol.inherits(polaric.Config, ol.Object);



/**  
 * Get array of configured based layers. 
 */

polaric.Config.prototype.getBaseLayers = function()
   { return this.baseLayers; }
   
   

/**
 *  Set an id to distinguish between different users or sessions 
 *  when using local-storage to store config-values persistently.
 *  @param {string} uid - Identifier. 
 * 
 */
polaric.Config.prototype.setUid = function(uid)
   { this.uid = uid; }

   
   
   
/**
 *  Get a setting. If stored in browser local storage (store method) return this. 
 *  If not, return the default setting (see set method). 
 *  @param {string} id - key of setting. 
 *  @returns The value of the setting.
 */
polaric.Config.prototype.get = function(id)
{ 
    console.assert(id!=null, "Assertion failed");
    
    /* Look in session-storage first, if not found there, 
     * look in local-storage. 
     */
    var data = this.sstorage[id]; 
    if (data == null)
       data = this.storage[this.uid+'.'+id];
    
    var x = (data ? JSON.parse(data) : null );
    if (x==null && this.props[id] != null) 
        return this.props[id]; 
    return x;
}



/**
 *  Store value in browser session storage. To be used in application.
 *  If save=true, value will be persistent between browser sessions
 *  (saved in local-storage). 
 *  @param {string} id - Key of setting.
 *  @param {*} value - Value of setting. 
 *  @param {boolean|undefined} save - Set to true to make setting persistent.
 * 
 */
polaric.Config.prototype.store = function(id, value, save)
{ 
    console.assert(id != null && value != null, "Assertion failed"); 
    var val = JSON.stringify(value);
    this.sstorage[id] = val; 
    if (save)
       this.storage[this.uid+'.'+id] = val;
}

/** 
 *  Remove value from session/local storage. 
 * @param {string} id - Key of setting. 
 */

polaric.Config.prototype.remove = function(id)
{
    this.sstorage.removeItem(id);
    this.storage.removeItem(id);
}

   
   
/**
 *  Set a config value. Used as default setting. To be used in config file. 
 *  @param {string} id - Key of setting. 
 *  @param {*} value - Value of setting 
 * 
 */
polaric.Config.prototype.set = function(id, value)
{ 
    console.assert(id != null && value != null, "Assertion failed");
    this.props[id] = value; 
}


   
 
