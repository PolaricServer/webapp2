 
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


/** @namespace */
pol.widget =  {};


/**
 * Array of subclasses with functions to restore persistent widgets.. 
 */
pol.widget._restore = {};

/**
 * What widget-instances are actually stored. Maps to class-names (see above).
 */
pol.widget._stored = {};




 /**
  * set restore function.
  * @param {string} id, name of the class. 
  * @param {function} f, function that restore the widget. Should take a element id and pixPos as arguments. 
  */
pol.widget.setRestoreFunc = function(id, f) {
    console.assert(id != null && f != null, "Assertion failed");
    pol.widget._restore[id] = f; 
}




/**
 * Restore. 
 */
pol.widget.restore = function() {
    pol.widget._stored = CONFIG.get("core.widget._stored");
    if (pol.widget._stored == null)
        pol.widget._stored = {};
    
    for (var x in pol.widget._stored) {
        var f = pol.widget._restore[pol.widget._stored[x]];
        var arg = CONFIG.get("core.widget."+x);
        if (f != null)
           f(x, arg);
    }
}





/**
 * @classdesc
 * Superclass for widgets in draggable popup windows. 
 * @constructor
 */

pol.core.Widget = function() {
   this.pos = null;
   this.pinned = false;
   this.classname = null;
}


 
 /** 
  * Display widget in the given DOM element. 
  * @param {Element} w - DOM element to display the layer switcher.  
  */
 
 pol.core.Widget.prototype.activate = function(w) 
 { 
     console.assert(w && w != null, "Assertion failed");
     this.delement = w; 
     m.mount(this.delement, this.widget);
 };
 
 
 
 
 /** 
  * Display widget in a draggable popup window. 
  * @param {string} id - Identifier to be used for the DOM element
  * @param pixPos - Where on screen to put it.
  */
  
 pol.core.Widget.prototype.activatePopup = function(id, pixPos, pinned) 
 {
     console.assert(this.widget && id != null 
            && pixPos[0] >= 0 && pixPos[1] >= 0, "Assertion failed");

     this.pos = pixPos;
     var t = this; 
     if (!pinned)
         pinned = false;
     t.pinned = pinned;
     
     return this.popup = browser.gui.showPopup( {
        vnode: this.widget,
        pixPos: pixPos,
        draggable: true,
        dragStop: dragStop,
	    pin: pinCb,
        pinned: pinned,
        id: id,
        cclass: "widget"
     });
     
     
     function pinCb(p) {
        t.pinned = p;
        if (p) 
            save();
        else
            unSave();
     }
     
     
     function dragStop( event, ui ) {
       	t.pos = [ui.position.left, ui.position.top];
        if (t.pinned)
            save();
     }
     
     
     function save() {
        CONFIG.store("core.widget."+id, t.pos, true);
        
        if (!pol.widget._stored[id] || pol.widget._stored[id] == null) {
            pol.widget._stored[id] = t.classname;
            CONFIG.store("core.widget._stored", pol.widget._stored, true); 
        }
     }
     
     
     function unSave() {
        CONFIG.remove("core.widget."+id, t.pos);
        
        if (pol.widget._stored[id] && pol.widget._stored[id] != null) {
            pol.widget._stored[id] = null;
            CONFIG.store("core.widget._stored", pol.widget._stored, true); 
        }
     }
 }
