 
/*
 Map browser based on OpenLayers 4. 
 Superclass for widgets in draggable popup windows. 
 
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
 * @classdesc
 * Superclass for widgets in draggable popup windows. 
 * @constructor
 */

polaric.Widget = function() {
   console.log("Widget constructor"); 
   this.pos = null;
}



 /** 
  * Display widget in the given DOM element. 
  * @param {Element} w - DOM element to display the layer switcher.  
  */
 
 polaric.Widget.prototype.activate = function(w) 
 { 
     console.assert(w && w != null, "Assertion failed");
     this.delement = w; 
     m.mount(this.delement, this.widget);
 };
 
 
 
 
 /** 
  * Display widget in a draggable popup window. 
  * @param {Element} w - DOM element to display the layer switcher.  
  */
  
 polaric.Widget.prototype.activatePopup = function(id, pixPos) 
 {
     console.assert(this.widget && id != null 
            && pixPos[0] >= 0 && pixPos[1] >= 0, "Assertion failed");
    
     this.pos = pixPos; 
     return browser.gui.showPopup( {
        vnode: this.widget,
        pixPos: pixPos,
        draggable: true,
        dragStop: dragStop,
        id: id
     });
     
     
     function dragStop( event, ui ) {
       	this.pos = [ui.position.left, ui.position.top];
        console.log("DRAG STOP: "+this.pos);
     }
 }
