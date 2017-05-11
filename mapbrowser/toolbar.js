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
 * @constructor
 */
polaric.Toolbar = function(opt_options) {

   var options = opt_options || {};

   var t = this;
   var map = this.getMap();
   this.element = document.createElement('div');
   this.element.className = 'toolbar ol-unselectable ol-control';
   this.lastElem = null; 
   
   ol.control.Control.call(this, {
      element: this.element,
      target: options.target
   });
   this.addIcon("images/menu.png", "toolbar");
   this.addSpacing();
   this.addIcon("images/layers.png");
   this.addIcon("images/filter.png");
};
ol.inherits(polaric.Toolbar, ol.control.Control);

      


/**
 * Set map object. Called from superclass. 
 */
polaric.Toolbar.prototype.setMap = function(map) {
   ol.control.Control.prototype.setMap.call(this, map);
}



polaric.Toolbar.prototype.addIcon = function(f, id, action) {
    var x = document.createElement('img');
    if (id != null)
       x.setAttribute("id", id);
    x.setAttribute('src', f);
    this.element.appendChild(x, this.element);
    this.lastElem = x; 
    if (action != null) 
        x.onclick = action;
}



polaric.Toolbar.prototype.addSpacing = function() {
    if (this.lastElem != null) 
        this.lastElem.className += " x-space"; 
}







