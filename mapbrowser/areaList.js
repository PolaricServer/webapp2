/*
 Map browser based on OpenLayers 5. 
 
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



/**
 * User defined areas (in a popup window). 
 */

pol.core.AreaList = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        t.classname = "core.AreaList"; 
        t.myAreas = [];
        t.currName = m.stream("");
        
        
        this.widget = {
            view: function() {
                let i=0;
                return m("div", [       
                    m("h1", "My map areas"),  
                    m("table.mapAreas", m("tbody", t.myAreas.map( x => {
                        return m("tr", [
                            m("td", m(removeEdit, 
                                { remove: apply(removeArea, i), edit: apply(editArea, i) })),
                            m("td", 
                                {onclick: apply(gotoExtent, i++), 'class': (x.server ? "onserver" : null) }, 
                                 x.name)
                        ]);
                    }))),
                    m(textInput, {id:"editArea", value: t.currName, size: 16, maxLength:25, 
                        regex: /^[^\<\>\'\"]+$/i }),
                    m("button", {onclick: add, title: "Add area to list"}, "Add")
                ])
            }
        }
   
   
        /* Get stored areas */
        t.myAreas = CONFIG.get("core.AreaList");
        if (t.myAreas == null)
            t.myAreas = [];
    
        for (const x of t.myAreas) {
            x.server = false; 
            x.index = -1; 
        }
	
        /* Get areas stored on server (if logged on) */
        setTimeout( () => {
            const srv = CONFIG.server; 
            if (srv != null && srv.loggedIn && srv.hasDb) {
                srv.getObj("area", a => {
                    for (const obj of a) 
                        if (obj != null) {
                            const x = obj.data;
                            x.index = obj.id;
                            removeDup(x.name);
                            x.server = true;
                            t.myAreas.push(x);  
                        }
                    m.redraw();
                });
            }    
        }, 1500);

   
   
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
   
   
        function removeDup(name) {
            for (const i in t.myAreas)
                if (t.myAreas[i].name == name) {
                    /* Remove duplicate entries. Is this right? */
                    t.myAreas.splice(i, 1);
                    return;
                }
        }
   
   
        /* Remove area from list */
        function removeArea(id) {
            // If server available and logged in, delete on server as well
            const srv = CONFIG.server; 
            if (srv && srv != null && srv.loggedIn && srv.hasDb && t.myAreas[id].index >= 0) 
                srv.removeObj("area", t.myAreas[id].index);
            t.myAreas.splice(id, 1);
            CONFIG.store("core.AreaList", t.myAreas, true);
        }
   
   
        /* Move map area name to editable textInput */
        function editArea(id) {
            gotoExtent(id);
            t.currName(t.myAreas[id].name);
            removeArea(id);
            m.redraw();
        }
   
   
        /* Add map extent to list */
        function add() {
            const ext = CONFIG.mb.getExtent();
            const area = {name: t.currName(), extent: ext};
            area.baseLayer = CONFIG.mb.baseLayerIdx;
            area.oLayers = getOLayers();
            t.myAreas.push(area);
            CONFIG.store("core.AreaList", t.myAreas, true);

            /* IF server available and logged in, store on server as well */
            const srv = CONFIG.server; 
            if (srv && srv != null && srv.loggedIn && srv.hasDb)
                srv.putObj("area", area, i => { 
                    area.index = i;
                    area.server = true;
                    m.redraw();
                });
        }
   
    
      
        /* Return selected overlay layers */
        function getOLayers() {
            const ol = new Array();
            for (const x of CONFIG.oLayers)
                ol.push(x.getVisible())
            return ol;
        }
    
    
   
        /* Zoom and move map to extent */
        function gotoExtent(id) {
            const a = t.myAreas[id];
            CONFIG.mb.gotoExtent(a);
        }
   
    } /* constructor */
} /* class */





pol.widget.setRestoreFunc("core.AreaList", (id, pos) => {
    var x = new pol.core.AreaList(); 
    x.activatePopup(id, pos, true); 
}); 
