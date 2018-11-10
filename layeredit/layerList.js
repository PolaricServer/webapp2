/*
 Map browser based on OpenLayers 5. Layer editor.
 
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
 * User defined layers (in a popup window). 
 */
pol.layers.List = class List extends pol.core.Widget {
    
    constructor() {
        super();
        this.classname = "layers.List"; 
        this.myLayers = [];     // Just the layer. Not to be saved directly. 
        this.myLayerNames = []; // Just the name
        this.typeList = {};
        const t = this;
   
        /* Register types */
        t.addType("dummy", "Select layer type..", new pol.layers.Dummy(this));
        t.addType("wms", "Standard WMS layer", new pol.layers.Wms(this));   
        t.addType("wfs", "Standard WFS layer", new pol.layers.Wfs(this));
        t.addType("gpx", "GPX files upload", new pol.layers.Gpx(this));
   
        this.layer = t.typeList["dummy"].obj; 

   
        this.widget = {
            view: function() {
                let i=0;
                return m("div#layerEdit", [       
                    m("h1", "My map layers"),  
                    m("table.mapLayers", m("tbody", t.myLayerNames.map( x => {
                        return m("tr", [
                            m("td", m("img", {src:"images/edit-delete.png", onclick: apply(x=>t.removeLayer(x), i) })), 
                            m("td", m("img", {src:"images/edit.png", onclick: apply(editLayer, i++) })),
                            m("td", {'class': (x.server ? "onserver" : null)}, x.name) ] );
                    }))), m("div", [ 
                        m("span.sleftlab", "Type: "), 
                        m(select, { id: "lType", 
                            onchange: selectHandler, 
                            list: Object.keys(t.typeList).map( x=> 
                                { return  {label: t.typeList[x].label, val: x, obj: t.typeList[x].obj}; } ) 
                        }), 
                        m(t.layer.widget) 
                    ] ) ] );
            },
        };
   
   
        /* Get stored layers */
        this.getMyLayers();

   
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() {f(id); }};  
      
	
   
        /* Handler for select element. Select a type. */
        function selectHandler(e) {
            const tid = $("#lType").val();
            t.layer = t.typeList[tid].obj;
            m.redraw();
        }
   
   
   
        /* Move map layer name to editable textInput */
        function editLayer(idx) {
            console.assert(idx >= 0 && idx <t.myLayers.length, "idx="+idx);
            const type = t.myLayerNames[idx].type;
            $("#lType").val(type).trigger("change");
            t.typeList[type].obj.edit(t.myLayers[idx]);   
            t.removeLayer(idx);
            m.redraw();
        }
   
    } /* constructor */

    
    
    /**
     * Add a type with a Layer editor.
     */
    addType(id, name, obj) {
        obj.typeid = id;
        this.typeList[id] = {label: name, obj: obj} ;
    }

    

    /**
     * Restore layers from local storage.
     */
    getMyLayers() {
        const t = this;
        let lrs = CONFIG.get("layers.list");
        if (lrs == null)
            lrs = [];
        for (const i in lrs) {
            const x = this.myLayers[i] = this.typeList[lrs[i].type].obj.json2layer 
                ( CONFIG.get("layers.layer."+lrs[i].name.replace(/\s/g, "_" )));
            if (x!= null) 
                CONFIG.mb.addConfiguredLayer(x, lrs[i].name);
            else {
                console.warn("Layer is missing (in local storage) for: "+lrs[i].name+". Removing");
                t.myLayers.splice(i, 1);
                lrs.splice(i, 1);
            }
        }
        CONFIG.store("layers.list", lrs, true);

        for (const x of lrs) {
            x.server = false; 
            x.index = -1; 
        }
        
        /* Get layers stored on server (if logged on) */
        setTimeout( () => {
            const srv = CONFIG.server; 
            if (srv != null && srv.loggedIn) {
                srv.getObj("layer", a => {
                    for (const obj of a) 
                        if (obj != null) {
                            const wr = obj.data;
                            const x = this.typeList[wr.type].obj.obj2layer(wr.data);        
                            removeDup(wr.name);
                            lrs.push({name:wr.name, type:wr.type, server:true, index: obj.id});
                            t.myLayers.push(x);
                            CONFIG.mb.addConfiguredLayer(x, wr.name);
                        }
                    m.redraw();
                });
            }    
        }, 1500);
        
        return this.myLayerNames = lrs;   
        
        /* 
         * 
         * FIXME: Should names be unique? Field in database schema? 
         * Handle situation where two or more layers from *database* have the same name. 
         */
        function removeDup(name) {
            for (const i in lrs) {   
                if (lrs[i].name == name) {
		    t.removeLayer(i);
                    return;
                }
            }
        }
    }
        
 
    
    /**
     * Remove layer from list 
     */
    removeLayer(id) {
        console.assert(id >= 0 && id < this.myLayers.length, "id="+id);
	 
	 /* If server available and logged in, delete on server as well */
        const srv = CONFIG.server; 
        if (srv && srv != null && srv.loggedIn && this.myLayerNames[id].index >= 0)
            srv.removeObj("layer", this.myLayerNames[id].index);

        const lr = this.myLayers[id];      
        this.layer.removeLayer(lr); 
        this.myLayers.splice(id,1);
        this.myLayerNames.splice(id,1);
        CONFIG.store("layers.list", this.myLayerNames, true);
        CONFIG.mb.removeConfiguredLayer(lr);
    }       
        
        
} /* class */



pol.widget.setRestoreFunc("layers.List", function(id, pos) {
    if (!CONFIG.layerlist || CONFIG.layerlist == null)
	CONFIG.layerlist = new pol.layers.List(); 
    CONFIG.layerlist.activatePopup(id, pos, true); 
}); 

