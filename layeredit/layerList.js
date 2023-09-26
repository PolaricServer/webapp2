/*
 Map browser based on OpenLayers. Layer editor.
 
 Copyright (C) 2017-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        this.suspendGet = false; 
        const t = this;
   
        /* Register types */
        t.addType("_any_", "Select layer type..", new pol.layers.Dummy(this));
        if (CONFIG.server!=null && CONFIG.server.hasDb) {
            t.addType("drawing", "Drawing layer", new pol.layers.Drawing(this));
            t.addType("gpx", "GPX/GeoJSON files upload", new pol.layers.Gpx(this));
        }
        t.addType("wms", "Standard WMS layer", new pol.layers.Wms(this));   
        t.addType("wfs", "Standard WFS layer", new pol.layers.Wfs(this));
               
        t.addType("_any_", "Select layer type..", new pol.layers.Dummy(this));
        this.layer = t.typeList["_any_"].obj; 

   
        this.widget = {
            view: function() {
                return m("div#layerEdit", [       
                    m("h1", "My map layers"),  
                    m("table.mapLayers", m("tbody", t.myLayerNames
                        .filter( x => { const t = $("#lType").val(); return !t || t=="_any_" || x.type == t} )
                        .map( x => {
                            const i = indexOf(x.name);
                            return m("tr", [ m("td", 
                                (removable(i) ? 
                                    m(removeEdit, {remove: apply(x=>t.removeLayer(x), i), edit: apply(editLayer, i) })
                                    : ""),
                                (sharable(i) ? 
                                    m("img", {src:"images/16px/user.png", title:"Sharing", onclick: apply(sharing, i)} )
                                    : "") 
                                ),
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

        setTimeout( ()=>this.getMyLayers(), 100);
        
        /* Get stored layers */

        t.authCb = CONFIG.server.addAuthCb( ()=> {
            t.getMyLayers();
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
        
        
        
        
        function indexOf(n) {
            for (var i in t.myLayerNames) 
                if (n === t.myLayerNames[i].name)
                    return i;
            i=-1;
        }
        
        function sharable(i) {
            return !t.myLayerNames[i].readonly;
        }
        
        function removable(i) {
            return !t.myLayerNames[i].noremove;
        }
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() {f(id); }};  
      
	
        function sharing(i) {
            const obj = t.myLayerNames[i]; 
            const w = getShareWidget(); 
            w.setIdent(obj.index, obj.name, "layer", obj.type)
        }
        
        
        /* Handler for select element. Select a type. */
        function selectHandler(e) {
            const tid = $("#lType").val();
            const lname = t.layer.lName();
            t.layer = t.typeList[tid].obj;
            t.layer.lName(lname);
            setTimeout(()=> m.redraw(), 100);
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

    
    onActivate() {
        this.getMyLayers();
    }
    
    selectType(lname) {
        $("#lType").val(lname).trigger("change"); 
        this.layer = this.typeList[lname].obj;
        this.layer.lName("");
        m.redraw();
    }
        
        
    suspend() {
        const t = this;
        t.suspendGet = true; 
        setTimeout(()=>{t.suspendGet=false;}, 2000);
    }
    
    
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
     * Restore layers from server.
     */
    getMyLayers() {
        const t = this;
        if (t.suspendGet) 
            return;
                   
        /* lrs is a list of name,type pairs */
        let lrs = []; 
        t._clearMyLayers(); 
        const srv = CONFIG.server;
        if (srv.isAuth() && srv.hasDb) {
           /* 
            * If logged in, get layers stored on server.
            */
            srv.getObj("layer", a => {
                for (const obj of a) 
                    if (obj != null) {
                        const wr = obj.data;
                        wr.data.name = wr.name;
                        const x = this.typeList[wr.type].obj.obj2layer(wr.data);        
                        lrs.push({
                            name:wr.name, type:wr.type, server:true, readonly:obj.readOnly, 
                            noremove: obj.noRemove, index: obj.id
                        });
                        t.myLayers.push(x);
                        CONFIG.mb.addConfiguredLayer(x, wr.name);
                        this.myLayerNames = lrs;
                    }
                m.redraw();
            });
        }
        return this.myLayerNames = lrs;   
        
    }
        
 
    
    /**
     * Remove layer from list and from server
     */
    removeLayer(id, noconfirm) {
        if (!noconfirm && noconfirm!=true && confirm("Remove - are you sure?") == false)
                return;
        console.assert(id >= 0 && id < this.myLayers.length, "id="+id+", length="+this.myLayers.length);
        const s = CONFIG.server; 
        const lr = this.myLayers[id];
        const typespecific = this.typeList[this.myLayerNames[id].type].obj
        this.suspend();
        
        /* If server available and logged in, delete on server as well */
        if (s && s != null && s.isAuth() && s.hasDb && this.myLayerNames[id].index != "") {
            s.removeObj("layer", this.myLayerNames[id].index, 
                /* n is number of objects actually deleted from database. 0 if there are 
                 * still users that have links to it */
                n => {
                    this._removeLayer(id, lr, false);
                    typespecific.removeLayer(lr, n>0);
                }
            );
        }
    }       
        
    
        
} /* class */



pol.widget.setFactory( "layers.List", {
        create: () => new pol.layers.List()
    }); 

