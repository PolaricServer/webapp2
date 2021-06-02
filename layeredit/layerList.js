/*
 Map browser based on OpenLayers 5. Layer editor.
 
 Copyright (C) 2017-2021 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        this.myLayerNames = []; // Just the name and the type
        this.typeList = {};
        const t = this;
   
        /* Register types */
        t.addType("dummy", "Select layer type..", new pol.layers.Dummy(this));
        if (CONFIG.server!=null && CONFIG.server.hasDb) {
            t.addType("drawing", "Drawing layer", new pol.layers.Drawing(this));
            t.addType("gpx", "GPX files upload", new pol.layers.Gpx(this));
        }
        t.addType("wms", "Standard WMS layer", new pol.layers.Wms(this));   
        t.addType("wfs", "Standard WFS layer", new pol.layers.Wfs(this));

   
        this.layer = t.typeList["dummy"].obj; 

   
        this.widget = {
            view: function() {
                let i=0;
                return m("div#layerEdit", [       
                    m("h1", "My map layers"),  
                    m("table.mapLayers", m("tbody", t.myLayerNames.map( x => {
                        return m("tr", [
                            m(removeEdit, {remove: apply(x=>t.removeLayer(x), i), edit: apply(editLayer, i++) }),
                            (sharable(i) ? 
                                m("img", {src:"images/16px/user.png", title:"Sharing", onclick: apply(sharing, i)} )
                                : ""),
                            m("td", {'class': (x.server ? "onserver" : null)}, x.name) ] );
                    }))), 
                    
                    m("div", [ 
                        m("div.field", 
                            m("span.sleftlab", "Type: "), 
                            m(select, { id: "lType", 
                                onchange: selectHandler, 
                                    list: Object.keys(t.typeList)
                                        .filter( x=> {return (t.typeList[x].obj.allowed());} )
                                        .map( x=> 
                                            {return {label: t.typeList[x].label, val: x, obj: t.typeList[x].obj};})
                            })
                        ), 
                        m(t.layer.widget) 
                    ] ) ] );
            },
        };
   
        /* Get stored layers */
        this.getMyLayers();

        function sharable(i) {
            return !t.myLayerNames[i-1].readonly;
        }
   
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() {f(id); }};  
      
	
        function sharing(i) {
            const obj = t.myLayerNames[i-1]; 
            const w = getShareWidget(); 
            w.setIdent(obj.index, obj.name, "layer", obj.type)
        }
        
        
        /* Handler for select element. Select a type. */
        function selectHandler(e) {
            const tid = $("#lType").val();
            const lname = t.layer.lName();
            t.layer = t.typeList[tid].obj;
            t.layer.lName(lname);
            m.redraw();
        }
   
   
   
        /* Move map layer name to editable textInput */
        function editLayer(idx) {
            console.assert(idx >= 0 && idx <t.myLayers.length, "idx="+idx);
            const name = t.myLayerNames[idx].name;
            const type = t.myLayerNames[idx].type;
            t.layer = t.typeList[type].obj;
            t.layer.index = t.myLayerNames[idx].index;
            t.layer.readonly = t.myLayerNames[idx].readonly;
            t.layer.origName = name;
            t.layer.edit(t.myLayers[idx]);
            $("#lType").val(type).trigger("change");   
            t.layer.lName(name);
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

    
    
    getLayer(name) {
        let x; 
        for (x of this.myLayers) {
            if (x.get("name") == name)
                return x;
        }
        return null;
    }
    
    
    
    getLayers() {
        return this.myLayers; 
    }
    
    
    isEmpty() {
        return this.myLayers.length == 0;
    }
    
    
    _clearMyLayers() {
        for (const x of this.myLayers) {
            CONFIG.mb.removeConfiguredLayer(x)
        }
        this.myLayers=[];
        this.myLayerNames=[];
    }
    
    
    /**
     * Restore layers from local storage and from server.
     */
    getMyLayers() {
        const t = this;
        t._clearMyLayers();
        
        /* lrs is a list of name,type pairs */
        let lrs = CONFIG.get("layers.list");
        if (lrs == null)
            lrs = [];
        
        /* Go through layers from local storage and add them if valid */
        for (const i in lrs) {
            const editor = this.typeList[lrs[i].type];
            
            const x = editor.obj.json2layer 
                ( CONFIG.get("layers.layer."+lrs[i].name.replace(/\s/g, "_" )));
                
            if (x!= null && editor.obj.allowed()) {
                t.myLayers.push(x);
                CONFIG.mb.addConfiguredLayer(x, lrs[i].name);
            }
            else 
                lrs.splice(i, 1);
        }
        CONFIG.store("layers.list", lrs, true);

        for (const x of lrs) {
            x.server = false; 
            x.index = -1; 
        }
        
        /* 
        * If logged in, get layers stored on server.
        * Duplicates from local storage are removed.
        */
        setTimeout( () => {
            const srv = CONFIG.server; 
            if (srv != null && srv.loggedIn && srv.hasDb) {
                srv.getObj("layer", a => {
                    for (const obj of a) 
                        if (obj != null) {
                            const wr = obj.data;
                            wr.data.name = wr.name;
                            const x = this.typeList[wr.type].obj.obj2layer(wr.data);        
                            removeDup(wr.name);
                            lrs.push({name:wr.name, type:wr.type, server:true, readonly:obj.readOnly, index: obj.id});
                            t.myLayers.push(x);
                            CONFIG.mb.addConfiguredLayer(x, wr.name);
                        }
                    m.redraw();
                });
            }    
        }, 800);
        
        
        return this.myLayerNames = lrs;   
        
        
        /* 
         * 
         * FIXME: Should names be unique? Field in database schema? 
         * Handle situation where two or more layers from *database* have the same name. 
         */
        function removeDup(name) {
            for (const i in lrs) {   
                if (lrs[i].name == name) {
                    t._removeLayer(i);
                        return;
                }
            }
        }
    }
        
 
    
    /**
     * Remove layer from list 
     */
    removeLayer(id, noconfirm) {
        if (!noconfirm && noconfirm!=true && confirm("Remove - are you sure?") == false)
                return;
        console.assert(id >= 0 && id < this.myLayers.length, "id="+id+", length="+this.myLayers.length);
        const srv = CONFIG.server; 
        const lr = this.myLayers[id];
        const typespecific = this.typeList[this.myLayerNames[id].type].obj
        
        /* If server available and logged in, delete on server as well */
        if (srv && srv != null && srv.loggedIn && srv.hasDb && this.myLayerNames[id].index >= 0) {
            srv.removeObj("layer", this.myLayerNames[id].index, 
                /* n is number of objects actually deleted from database. 0 if there are 
                 * still users that have links to it */
                n => typespecific.removeLayer(lr, n>0)
            );
        }
        else
            typespecific.removeLayer(lr, false);
        this._removeLayer(id, lr);
    }       
        
        
    /* Remove layer from list and local storage */
    _removeLayer(id, lr) {
        if (!lr)
            lr = this.myLayers[id];
        if (this.myLayerNames[id].id)
            CONFIG.remove("layers.layer."+this.myLayerNames[id].id.replace(/\s/g, "_" ));
        this.myLayers.splice(id,1);
        this.myLayerNames.splice(id,1);
        CONFIG.store("layers.list", this.myLayerNames, true);
        CONFIG.mb.removeConfiguredLayer(lr);
        
    }
    
        
} /* class */



pol.widget.setFactory( "layers.List", {
        create: () => new pol.layers.List()
    }); 

