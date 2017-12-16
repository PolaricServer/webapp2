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
 * @param {pol.core.MapBrowser} br - Map browser instance
 */
pol.core.Toolbar = function(opt, br) {

   var options = opt || {};

   var t = this;
   var map = this.getMap();
   
   this.browser = br;
   this.element = document.createElement('div');
   this.element.className = 'toolbar ol-unselectable ol-control';
   this.lastElem = null; 
   this.arealist = new pol.core.AreaList();
   this.sections = [];
   this.nextSect = 0;
   
   ol.control.Control.call(this, {
      element: this.element,
      target: options.target
   });
};
ol.inherits(pol.core.Toolbar, ol.control.Control);



pol.core.Toolbar.prototype.addSection = function() 
{
    var sx = document.createElement('div');
    this.element.appendChild(sx);
    this.sections[this.nextSect++] = sx;
}



/**
 * Activate default icons and menus on toolbar.
 */
pol.core.Toolbar.prototype.setDefaultItems = function() 
{
   /* Default icons */
   this.addSection();
   this.addIcon(0, "images/menu.png", "toolbar", null, "Main menu");
   
   this.addSection();
   this.addIcon(1, "images/layers.png", "tb_layers", null, "Layer selector");
   this.addIcon(1, "images/areaselect.png", "tb_area", null, "Area menu");
   
   this.addSection();
   this.addIcon(2, "images/ruler1.png", "tb_measure", null, "Measure distance");
   
   
   var t = this; 
   
   pol.core.addHandlerId("tb_layers", true,  
        function(e) {
	       var ls = new pol.core.LayerSwitcher();
           ls.activatePopup("layerswitcher", [e.iconX, e.iconY]);
	 } );
   
   
   var measure_on = false; 
   pol.core.addHandlerId("tb_measure", true, 
	function(e) {
	   measure_on = (measure_on ? false : true);
	   if (measure_on){
            measure = new pol.core.Measure();
	        $("#tb_measure").attr("class", "selected");
       }
	   else {
	        $("#tb_measure").attr("class", "");
	        measure.deactivate();
       }
	} );
   
   
   this.browser.ctxMenu.addMenuId("toolbar", "TOOLBAR", true);
   this.browser.ctxMenu.addMenuId('tb_area', 'AREASELECT', true);
   
   
   /* Generate menu of predefined areas (defined in mapconfig.js */
   this.browser.ctxMenu.addCallback('AREASELECT', function (m) {
      var areas = t.arealist.myAreas; 
      for (var i in areas) {
         var area = areas[i];   
         if (area && area != null)
             m.add(area.name, handleSelect(areas, i)); 
      }
      
      if (areas.length > 0)
         m.add(null);
      m.add("Edit YOUR areas..", 
         function() {t.arealist.activatePopup("AreaList", [90,70])});
      m.add(null);
      
      for (var i in browser.config.aMaps) {
         var aMap = browser.config.aMaps[i]; 
         if (aMap && aMap.name && 
              aMap.name.length > 1 && 
              !aMap.hidden)
            m.add(aMap.title, handleSelect(browser.config.aMaps, i));
      }

      
      function handleSelect(a, i) {
         return function() {
           browser.fitExtent(a[i].extent);
         } 
      }
    });
   
}




/**
 * Set map object. Called from superclass. 
 */
pol.core.Toolbar.prototype.setMap = function(map) {
   ol.control.Control.prototype.setMap.call(this, map);
}



/**
 * Add icon to toolbar. 
 * @param {string} f - Filename/url for icon.
 * @param {String} id - Id for DOM element.
 * @param {function|null} action - Handler function. 
 * @param {string|undefined} title
 * @return DOM element for the icon. 
 */
pol.core.Toolbar.prototype.addIcon = function(i, f, id, action, title) {
    var x = document.createElement('img');
    if (id != null)
       x.setAttribute("id", id);
    x.setAttribute('src', f);
    if (title)
        x.setAttribute('title', title);
    
    this.sections[i].appendChild(x); // FIXME: Legal index? 
    this.lastElem = x; 
    if (action && action != null) 
        x.onclick = action;
    return x;
}


pol.core.Toolbar.prototype.changeIcon = function(id, f, action, title) {
    var x = document.getElementById(id);
    if (x==null) 
        return 
    x.setAttribute('src', f);
    if (action && action != null)
        x.onclick = action;
    if (title)
        x.setAttribute('title', title);
}



pol.core.Toolbar.prototype.addDiv = function(i, id, title) {
    var x = document.createElement('div');
    if (id != null)
       x.setAttribute("id", id);
    if (title)
       x.setAttribute("title", title);
    this.sections[i].appendChild(x);
    this.lastElem = x;
    return x;
}


/**
 * Add spacing betwen icons on toolbar. 
 */
pol.core.Toolbar.prototype.addSpacing = function() {
    if (this.lastElem != null) 
        this.lastElem.className += " x-space"; 
}







