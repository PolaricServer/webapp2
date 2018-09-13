/*
 Map browser based on OpenLayers 4. Layer editor. 
 WMS layer. 
 
 Copyright (C) 2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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


/* 
 * TODO: 
 *  Re-edit layer: Restore editable fields. DONE.
 *  Allow selection of projection or just use base-projection? 
 *  Editing other fields resets layer-selection checkboxes. Fix. DONE.
 *  Sublayer support. NOT NOW! 
 *  Restore layer-lists from localstorage (they are restored in layer selector widget). 
 */

/**
 * @classdesc
 * WMS layer editor.
 */

pol.layers.Wms = function(list) {
    pol.layers.Edit.call(this, list);
      
    this.cap = null;   
    this.layers = [];
    this.sLayers = [];
    this.srs = CONFIG.get('core.supported_proj');
    this.selected = this.srs[0];
    this.url = "";
    var t=this;
    
    this.fields = {
        view: function() { 
            return m("div.spec", [ 
                m("span.sleftlab", "Server: "),   
                m(textInput, {id:"wmsUrl", size: 40, maxLength:160, regex: /^.+$/i }),
                m("input", { type: "button", onclick: getCap, value: "Get" } ),
                br,
                m("span.sleftlab", "Projection:"),
                m(select, {id: "sel_srs", onchange: selectSRS, list: t.srs.map( function(x) {
                    return {label: x, val: x, obj: null};
                })}),  
                br,
                (t.cap==null ? null : m(t.wfields))
            ]);
        }
    }  
    
    /* Fields representing capabilities of wms service (from GetCapabilities) */
    this.wfields = {
        view: function() { 
            return m("div.wserver", [ 
                m("span.sleftlab", "Title: "),
                m("span", {title: t.cap.Service.Abstract}, t.cap.Service.Title), br,    
                m("span.sleftlab", "Layers:"),
                m("table", {id: "layerSelect"}, m("tbody", t.sLayers.map( function(x) {
                    return m("tr", [ 
                        m("td", {class: (x.level2 ? "level2" : null)}, 
                          m(checkBox, {onclick: apply(selLayer, x), checked: x.checked}, x.Title))
                    ])
                })))
            ]);
        }
    }
       
   
    /* Apply a function to an argument. Returns a new function */
    function apply(f, id) {return function() {f(id); }};  
   
    
    function getCap() {
        t.getCapabilities();
    }
    
    
    function selectSRS() {
        t.selected = $("#sel_srs").val();
        if (t.cap != null)
            t.filterLayers(t.selected);
    }
    
    function selLayer(x) {
       x.checked = !x.checked; 
    }
    
}
ol.inherits(pol.layers.Wms, pol.layers.Edit);



/*
 * Get capabilities from WMS server
 */
pol.layers.Wms.prototype.getCapabilities = function() {
    var t = this;
    t.layers=[];
    t.sLayers=[];
    
    var parser = new ol.format.WMSCapabilities();
    var u = $("#wmsUrl").val(); 
    fetch(u+'?service=wms&request=GetCapabilities').then(
        function(response) {
            return response.text(); 
        }).then( 
            function(txt) {
                var idx = 0;
                t.cap = parser.read(txt);
                if (t.cap.Capability.Layer.Layer) {
                    for (i in t.cap.Capability.Layer.Layer) {
                        var x = t.cap.Capability.Layer.Layer[i];
                        t.layers.push(x);
                    }
                }
                else if (t.cap.Capability.Layer)
                    t.layers[0] = t.cap.Capability.Layer;

                t.filterLayers(t.selected);
                m.redraw();
            });
}




pol.layers.Wms.prototype.filterLayers = function(crs) {
    console.log("filterLayers");
    var t = this;
    t.sLayers = [];
    for (i in t.layers)
        for (j in t.layers[i].CRS)
            if (t.layers[i].CRS[j] == crs) {
                t.sLayers.push(t.layers[i]);
                break; 
            }
}



/**
 * Return true if add button can be enabled 
 */

pol.layers.Wms.prototype.enabled = function() {
    return  $("#editLayer").attr("ok") && 
            $("#wmsUrl").attr("ok"); 
}



pol.layers.Wms.prototype.getReqLayers = function() {
    var layers = "";
    var first=true;
    for (i in this.sLayers) {
        if (this.sLayers[i].checked) {
            layers += ((first ? "" : ",") + this.sLayers[i].Name);
            first=false; 
        }
    }
    return layers; 
}




/**
 * Create a layer. 
 */

pol.layers.Wms.prototype.createLayer = function(name) {
       var url = $("#wmsUrl").val();
       var layers = this.getReqLayers();
       console.log("Create WMS layer: URL="+url+", layers="+layers);
       
       var x = new ol.layer.Image({
            name: name, 
            source: new ol.source.ImageWMS ({
               ratio:  1,
               url:    url,
               params: {'LAYERS':layers, VERSION: "1.1.1"}
            }) 
       });
       x.selSrs = this.selected; 
       x.selLayers = JSON.parse(JSON.stringify(this.sLayers))
       return x;
   }
  
 
 
/**
 * Move settings to web-form. 
 */  

pol.layers.Wms.prototype.edit = function(layer) {
   /* Call method in superclass */
   pol.layers.Edit.prototype.edit.call(this, layer);
   
   /* Specific to WMS layer */
   this.url = layer.getSource().getUrl();
   $("#wmsUrl").val(this.url).trigger("change").attr("ok", true);
   $("#sel_srs").val(layer.selSrs).trigger("change");
   this.getCapabilities();
   this.sLayers = layer.selLayers;
   console.log(this.sLayers);
   m.redraw();
}



/**
 * Stringify settings for a layer to JSON format. 
 */

pol.layers.Wms.prototype.layer2json = function(layer) { 
    var lx = {
      name:    layer.get("name"),
      filter:  layer.filt,
      url:     layer.getSource().getUrl(),
      params:  layer.getSource().getParams(),
      sLayers: layer.selLayers,
      srs:     layer.selSrs
    };
    return JSON.stringify(lx);
}



/**
 * Restore a layer from JSON format (see layer2json). 
 */

pol.layers.Wms.prototype.json2layer = function(js) {
    var lx = JSON.parse(js);
    if (lx == null) {
        console.warn("WmsLayer.json2layer: Resulting Layer is null");
        return null;
    }  
    var x = new ol.layer.Image({
            name: lx.name, 
            source: new ol.source.ImageWMS ({
               ratio:  1,
               url:    lx.url,
               params: lx.params
            }) 
       });   
    x.predicate = this.createFilter(lx.filter);
    x.filt = lx.filter;
    x.selSrs = lx.srs;
    x.selLayers = lx.sLayers;
    return x;
}



   
   
   
   
   
   
   
