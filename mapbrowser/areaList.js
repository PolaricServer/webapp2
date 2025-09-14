/*
 Map browser based on OpenLayers. 
 
 Copyright (C) 2017-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
                            m("td", [
                                (removable(i) ?
                                    m(removeEdit, { remove: apply(removeArea, i), edit: apply(editArea, i) })
                                    : ""),
                                (sharable(i) ? 
                                    m("img", {src:"images/16px/user.png", title:"Sharing", onclick: apply(sharing, i)} )
                                    : "") 
                                ]),     
                            m("td", 
                                {onclick: apply(gotoExtent, i++), 'class': (x.server ? "onserver" : null) }, 
                                 x.name)
                        ]);
                    }))),
                    m(textInput, {id:"editArea", value: t.currName, size: 16, maxLength:25, 
                        regex: /^[^\<\>\'\"]+$/i }),
                    m("button", {onclick: add, disabled: !canAdd(), title: "Add area to list"}, "Add")
                ])
            }
        }
   
   
        t.getMyAreas(); 
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            t.getMyAreas();
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
   
   
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
   
        
        function sharable(i) {
            return !t.myAreas[i].readonly;
        }

        function removable(i) {
            return !t.myAreas[i].noremove;
        }
        
        function sharing(i) {
            const obj = t.myAreas[i]; 
            const w = getShareWidget(); 
            w.setIdent(obj.index, obj.name, "Area", null)
        }
   
        function canAdd() {
            if (t.currName() == "")
                return false;
            for (const x of t.myAreas) {
                if (t.currName() == x.name)
                    return false; 
            }
            return true;
        }
        
   
        /* Remove area from list */
        function removeArea(id, noconfirm) {
            if (!noconfirm && noconfirm!=true && confirm("Remove - are you sure?") == false)
                return;
            // If server available and logged in, delete on server
            const srv = CONFIG.server; 
            if (srv != null && srv.isAuth() && srv.hasDb && t.myAreas[id].index != "") 
                srv.removeObj("area", t.myAreas[id].index);
            t.myAreas.splice(id, 1);
        }
   
   
        /* Move map area name to editable textInput */
        function editArea(id) {
            gotoExtent(id);
            t.currName(t.myAreas[id].name);
            m.redraw();
        }
   
   
        /* Add map extent to list */
        function add() {
            const ext = CONFIG.mb.getExtent();
            const area = {name: t.currName(), extent: ext};  
            area.baseLayer = CONFIG.mb.getBaseLayer().get("name");
            area.oLayers = getOLayers();

            /* IF server available and logged in, store on server as well */
            const srv = CONFIG.server; 
            if (srv != null && srv.isAuth() && srv.hasDb)
                srv.putObj("area", area, i => { 
                    t.getMyAreas();
                });
            else
                console.warn("Not logged in to server");
        }
   
    
      
        /* Return selected overlay layers */
        function getOLayers() {
            const ol = {};
            for (const x of CONFIG.oLayers) 
                ol[x.get("name")] = x.getVisible(); 
            return ol;
        }
    
    
   
        /* Zoom and move map to extent */
        function gotoExtent(id) {
            const a = t.myAreas[id];
            CONFIG.mb.gotoExtent(a);
        }
   
    } /* constructor */
    
    
    /*
    onClose() {
        super.onClose();
        CONFIG.server.removeAuthCb(this.authCb);
    }
    */
    
    
    getMyAreas() 
    {
        const t = this; 

        /* Get areas stored on server (if logged on) */
        const srv = CONFIG.server; 
        t.myAreas = [];           
        m.redraw();
        if (srv != null && srv.hasDb) {
            srv.getObj("area", a => {     
                for (const obj of a) 
                    if (obj != null) {
                        const x = obj.data;
                        x.index = obj.id;
                        x.server = true;
                        x.readonly = obj.readOnly; 
                        x.noremove = obj.noRemove;
                        t.myAreas.push(x);  
                    }
                t.myAreas.sort((x,y)=> {return  (x.name < y.name ? -1 : 1) });
                m.redraw();
            }); 
        }
        else
            console.warn("Not logged in to server with database plugin");
    }
    
    

    
} /* class */




pol.widget.setFactory( "core.AreaList", {
        create: () => new pol.core.AreaList()
    }); 
