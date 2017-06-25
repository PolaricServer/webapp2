 /*
    Map browser based on OpenLayers 4. 
    Toolbar. 
    
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
 
 
/**
 * Toolbar class.
 * @constructor
 * @param {Object.<string,*>} opt - Options
 * @param {polaric.MapBrowser} br - Map browser instance
 */
polaric.Toolbar = function(opt, br) {

   var options = opt || {};

   var t = this;
   var map = this.getMap();
   
   this.browser = br;
   this.element = document.createElement('div');
   this.element.className = 'toolbar ol-unselectable ol-control';
   this.lastElem = null; 
   
   ol.control.Control.call(this, {
      element: this.element,
      target: options.target
   });
};
ol.inherits(polaric.Toolbar, ol.control.Control);

      

/**
 * Activate default icons and menus on toolbar.
 */
polaric.Toolbar.prototype.setDefaultItems = function() 
{
   /* Default icons */
   this.addIcon("images/menu.png", "toolbar");
   this.addSpacing();
   this.addIcon("images/layers.png", "tb_layers");
   this.addIcon("images/areaselect.png", "tb_area");
         
   polaric.addHandlerId("tb_layers", true,  
        function(e) {
	       var ls = new polaric.LayerSwitcher();
           ls.activatePopup("layerswitcher", [e.iconX, e.iconY]);
	 } );
   
   this.browser.ctxMenu.addMenuId("toolbar", "TOOLBAR", true);
   this.browser.ctxMenu.addMenuId('tb_area', 'AREASELECT', true);
   
   /* Generate menu of predefined areas (defined in mapconfig.js */
   this.browser.ctxMenu.addCallback('AREASELECT', function (m) {
      for (var i in browser.config.aMaps) 
         if (browser.config.aMaps[i] && browser.config.aMaps[i].name && 
              browser.config.aMaps[i].name.length > 1 && 
              !browser.config.aMaps[i].hidden)
            m.add(browser.config.aMaps[i].title, handleSelect(i));
      
      function handleSelect(i) {
         return function() {
           browser.fitExtent(browser.config.aMaps[i].extent);
         } 
      }
    });
   
}




/**
 * Set map object. Called from superclass. 
 */
polaric.Toolbar.prototype.setMap = function(map) {
   ol.control.Control.prototype.setMap.call(this, map);
}



/**
 * Add icon to toolbar. 
 * @param {string} f - Filename/url for icon.
 * @param {String} id - Id for DOM element.
 * @param {function|null} action - Handler function. 
 * @return DOM element for the icon. 
 */
polaric.Toolbar.prototype.addIcon = function(f, id, action) {
    var x = document.createElement('img');
    if (id != null)
       x.setAttribute("id", id);
    x.setAttribute('src', f);
    this.element.appendChild(x, this.element);
    this.lastElem = x; 
    if (action != null) 
        x.onclick = action;
    return x;
}


/**
 * Add spacing betwen icons on toolbar. 
 */
polaric.Toolbar.prototype.addSpacing = function() {
    if (this.lastElem != null) 
        this.lastElem.className += " x-space"; 
}







