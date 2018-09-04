/*
 Map browser based on OpenLayers 4. Layer editor. 
 WMS layer. 
 
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




/**
 * @classdesc
 * WFS layer editor.
 */

pol.layers.Wms = function(list) {
    pol.layers.Edit.call(this, list);
      
    this.cap = null;   
    this.layers = [];
    this.srs = CONFIG.get('core.supported_proj');
    this.selected = this.srs[0];
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
    
    this.wfields = {
        view: function() { 
            return m("div.wserver", [ 
                m("span.sleftlab", "Title: "),
                m("span", t.cap.Service.Title), br,    
                m("span.sleftlab", "Layers:"),
                m("table", m("tbody", t.cap.Capability.Layer.Layer.map( function(x) {
                    return m("tr", [ 
                        m("td", m(checkBox, { }, x.Title))
                    ])
                })))
            ]);
        }
        
    }
    
    
    
    function selectSRS() {
        t.selected = $("#sel_srs").val();
        if (t.cap != null)
            filterLayers(t.selected);
    }
    
    
    
    function filterLayers(srs) {
        console.log("Filter layers");
        t.layers = [];
        for (i in t.cap.Capability.Layer.Layer) {
            var layer = t.cap.Capability.Layer.Layer[i]; 
            var found = false;
            if (!layer.CRS && !layer.SRS)
                found = true; 
            else {
                if (layer.CRS) {
                    console.log("Found CRS in layer");
                    for (j in layer.CRS) 
                       if (srs == layer.CRS[j])
                           {found=true; break;}
                }
                else if (layer.SRS) {
                    console.log("Found SRS in layer");
                    for (j in layer.SRS) 
                       if (srs == layer.SRS[j])
                           {found=true; break;}
                }
            }
            if (found)
                t.layers.push(layer)
        }
        m.redraw();
    }
    
    
    
    function getCap() {
        var parser = new ol.format.WMSCapabilities();
        var u = $("#wmsUrl").val(); 
        fetch(u+'?service=wms&request=GetCapabilities').then(
            function(response) {
               return response.text(); 
            }).then( 
                function(txt) {
                    t.cap = parser.read(txt);
                    for (i in t.cap.Capability.Layer.Layer) {
                        layer = t.cap.Capability.Layer.Layer[i];
                    }
                    filterLayers(t.srs[0]);
                    m.redraw();
                });
    }
    
}
ol.inherits(pol.layers.Wms, pol.layers.Edit);







/**
 * Return true if add button can be enabled 
 */

pol.layers.Wms.prototype.enabled = function() {
    return  $("#editLayer").attr("ok") && 
            $("#wmsUrl").attr("ok") && 
            $("#wmsLayers").attr("ok") ; 
}



/**
 * Create a layer. 
 */

pol.layers.Wms.prototype.createLayer = function(name) {
       var url = $("#wmsUrl").val();
       var layers = $("#wmsLayers").val();
       console.log("Create WMS layer: URL="+url+", layers="+layers);
       // FIXME: Sanitize input !!!!!
       
       return new ol.layer.Image({
            name: name, 
            source: new ol.source.ImageWMS ({
               ratio:  1,
               url:    url,
               params: {'LAYERS':layers, VERSION: "1.1.1"}
            }) 
       });
   }
  
 
 
/**
 * Move settings to web-form. 
 */  

pol.layers.Wms.prototype.edit = function(layer) {
   pol.layers.Edit.prototype.edit.call(this, layer);
   
   $("#wmsUrl").val(layer.getSource().getUrl()).trigger("change").attr("ok", true);
   $("#wmsLayers").val(layer.getSource().getParams().LAYERS).trigger("change").attr("ok", true);
}



/**
 * Stringify settings for a layer to JSON format. 
 */

pol.layers.Wms.prototype.layer2json = function(layer) { 
    var lx = {
      name:   layer.get("name"),
      filter: layer.filt,
      url:    layer.getSource().getUrl(),
      params: layer.getSource().getParams()
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
    return x;
}



   
   
   
   
   
   
   
