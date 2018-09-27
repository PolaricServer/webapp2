 
/*
 Map browser based on OpenLayers 5. 
 Superclass for widgets in draggable popup windows. 
 
 Copyright (C) 2017-2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
    console.assert(id != null && f != null, "id="+id+", f="+f);
    pol.widget._restore[id] = f; 
}




/**
 * Restore. 
 */
pol.widget.restore = function() {
    pol.widget._stored = CONFIG.get("core.widget._stored");
    if (pol.widget._stored == null)
        pol.widget._stored = {};
    
    for (const x in pol.widget._stored) {
        const f = pol.widget._restore[pol.widget._stored[x]];
        const arg = CONFIG.get("core.widget."+x);
        if (f != null)
           f(x, arg);
    }
}





/**
 * Superclass for widgets in draggable popup windows. 
 */

pol.core.Widget = class {
    
    constructor() {
        this.pos = null;
        this.pinned = true;
        this.classname = null;
    }


 
    /** 
     * Display widget in the given DOM element. 
     * @param {Element} w - DOM element to display the layer switcher.  
     */
    activate(w) 
    { 
        console.assert(w && w != null, "w="+w);
        this.delement = w; 
        m.mount(this.delement, this.widget);
    }
 
 
 
 
    /** 
     * Display widget in a draggable popup window. 
     * @param {string} id - Identifier to be used for the DOM element
     * @param pixPos - Where on screen to put it.
     */
    activatePopup(id, pixPos, pinned) 
    {
        console.assert(id != null && pixPos != null 
            && pixPos[0] >= 0 && pixPos[1] >= 0, "id="+id+", pixPos="+pixPos);
        
        if (pixPos == null)
            pixPos = [20, 20];
            
        const t = this; 
        this.pos = pixPos;        
        if (!pinned)
            pinned = true;
        t.pinned = pinned;
        
        console.log("activatePopup: pinned="+t.pinned);
     
        return this.popup = browser.gui.showPopup( {
            vnode: this.widget,
            pixPos: pixPos,
            draggable: true,
            dragStop: dragStop,
            pin: pinCb,
            pinned: t.pinned,
            id: id,
            cclass: "widget"
        });
     
     
        function pinCb(p) {
            t.pinned = p;
            console.log("PinCb: "+p);
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
} /* class */
