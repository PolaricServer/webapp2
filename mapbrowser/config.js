 
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


var polaric = polaric || {};



/** 
 *  @classdesc 
 *  Configuration of map browser application.
 * 
 *  @constructor 
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
 */

polaric.Config.prototype.getBaseLayers = function()
   { return this.baseLayers; }
   
   

/**
 *  Config class: set an id to distinguish between different 
 *   users or sessions when using local-storage to store
 *   config-values persistently.
 * 
 */

polaric.Config.prototype.setUid = function(uid)
   { this.uid = uid; }

   
   
   
/**
 *  Config class: get a setting. 
 *   If stored in browser local storage (store method) return this. 
 *   If not, return the default setting (set method). 
 * 
 */

polaric.Config.prototype.get = function(id)
{
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
 *  Config class: store value in browser session storage. 
 *    To be used in application.
 *    If save=true, value will be persistent between browser sessions
 *    (saved in local-storage). 
 * 
 */

polaric.Config.prototype.store = function(id, value, save)
{ 
    var val = JSON.stringify(value);
    this.sstorage[id] = val; 
    if (save)
       this.storage[this.uid+'.'+id] = val;
}


   
   
/**
 *  Config class: set a config value. Used as default settings.
 *    To be used in config file. 
 * 
 */

polaric.Config.prototype.set = function(id, value)
   { this.props[id] = value; }


   
 
