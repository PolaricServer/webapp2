 
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
widget =  {};


/**
 * Array of subclasses with functions to restore persistent widgets.. 
 */
widget._restore = {};

/**
 * What widget-instances are actually stored. Maps to class-names (see above).
 */
widget._stored = {};


 /**
  * set restore function.
  * @param {string} id, name of the class. 
  * @param {function} f, function that restore the widget. Should take a element id and pixPos as arguments. 
  */
widget.setRestoreFunc = function(id, f) {
    console.assert(id != null && f != null, "Assertion failed");
    widget._restore[id] = f; 
}


widget.restore = function() {
    console.log("RESTORE widgets");
    widget._stored = CONFIG.get("polaric.widget._stored");
    if (widget._stored == null)
        widget._stored = {};
    
    for (var x in widget._stored) {
        var f = widget._restore[widget._stored[x]];
        var arg = CONFIG.get("polaric.widget."+x);
        if (f != null)
           f(x, arg);
    }
}





/**
 * @classdesc
 * Superclass for widgets in draggable popup windows. 
 * @constructor
 */

polaric.Widget = function() {
   console.log("Widget constructor"); 
   this.pos = null;
   this.pinned = false;
   this.classname = null;
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
  * @param {string} id - Identifier to be used for the DOM element
  * @param pixPos - Where on screen to put it.
  */
  
 polaric.Widget.prototype.activatePopup = function(id, pixPos, pinned) 
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
        id: id
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
        console.log("SAVE POPUP POS: "+t.pos+", id="+id);
        CONFIG.store("polaric.widget."+id, t.pos, true);
        
        if (!widget._stored[id] || widget._stored[id] == null) {
            widget._stored[id] = t.classname;
            CONFIG.store("polaric.widget._stored", widget._stored, true); 
        }
     }
     
     
     function unSave() {
        console.log("UNSAVE POPUP POS: "+t.pos+", id="+id);
        CONFIG.delete("polaric.widget."+id, t.pos);
        
        if (widget._stored[id] && widget._stored[id] != null) {
            widget._stored[id] = null;
            CONFIG.store("polaric.widget._stored", widget._stored, true); 
        }
     }
 }
