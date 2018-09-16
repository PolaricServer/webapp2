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
        var t = this;
   
        /* Register types */
        t.addType("dummy", "Select layer type..", new pol.layers.Dummy(this));
        t.addType("wms", "Standard WMS layer", new pol.layers.Wms(this));   
        t.addType("wfs", "Standard WFS layer", new pol.layers.Wfs(this));
   
        var layer = t.typeList["dummy"].obj; 

   
        this.widget = {
            view: function() {
                var i=0;
                return m("div#layerEdit", [       
                    m("h1", "My map layers"),  
                    m("table.mapLayers", m("tbody", t.myLayerNames.map(function(x) {
                        return m("tr", [
                            m("td", m("img", {src:"images/edit-delete.png", onclick: apply(removeLayer, i) })), 
                            m("td", m("img", {src:"images/edit.png", onclick: apply(editLayer, i++) })),
                            m("td", {}, x.name) ] );
                    }))), m("div", [ 
                        m("span.sleftlab", "Type: "), 
                        m(select, { id: "lType", onchange: selectHandler, 
                            list: Object.keys(t.typeList).map( x=> 
                                { return  {label: t.typeList[x].label, val: x, obj: t.typeList[x].obj}; } ) 
                        }), 
                        m(layer.widget) 
                    ] ) ] );
            }
        };
   
   
        /* Get stored layers */
        this.getMyLayers();

   
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() {f(id); }};  
      
   
        /* Handler for select element. Select a type. */
        function selectHandler(e) {
            var tid = $("#lType").val();
            layer = t.typeList[tid].obj;
            m.redraw();
        }
   
   
        /* Remove layer from list */
        function removeLayer(id) {
            console.assert(id >= 0 && id <t.myLayers.length, "Assertion failed");;
            var layer = t.myLayers[id];      
            t.myLayers.splice(id,1);
            t.myLayerNames.splice(id,1);
            CONFIG.store("layers.list", t.myLayerNames, true);
            CONFIG.mb.removeConfiguredLayer(layer);
        }
   
   
        /* Move map layer name to editable textInput */
        function editLayer(idx) {
            var type = t.myLayerNames[idx].type;
            $("#lType").val(type).trigger("change");
            t.typeList[type].obj.edit(t.myLayers[idx]);   
            removeLayer(idx);
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
        var lrs = CONFIG.get("layers.list");
        if (lrs == null)
            return lrs = [];
  
        for (const i in lrs) {
            console.log("Restore Layer: i="+i+", name='"+lrs[i].name+"', type="+lrs[i].type);
            var x = this.myLayers[i] = this.typeList[lrs[i].type].obj.json2layer 
                ( CONFIG.get("layers.layer."+lrs[i].name.replace(/\s/g, "_" )));
            if (x!= null) 
                CONFIG.mb.addConfiguredLayer(x, lrs[i].name);
        }
        return this.myLayerNames = lrs;   
    }
    
} /* class */



pol.widget.setRestoreFunc("layers.List", function(id, pos) {
    var x = new pol.layers.List(); 
    x.activatePopup(id, pos, true); 
}); 

