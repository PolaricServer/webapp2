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

polaric.WmsLayer = function(list) {
   polaric.LayerEdit.call(this, list);
      
       
   this.fields = {
       view: function() { 
          return m("div.spec", [ 
             m("span.sleftlab", "WMS URL: "),   
             m(textInput, {id:"wmsUrl", size: 40, maxLength:160, regex: /^.+$/i }),br,
             m("span.sleftlab", "Layers: "),
             m(textInput, {id:"wmsLayers", size: 20, maxLength:80, regex: /^.+$/i }),br
           ]);
       }
   }  
   
}
ol.inherits(polaric.WmsLayer, polaric.LayerEdit);



/**
 * Return true if add button can be enabled 
 */

polaric.WmsLayer.prototype.enabled = function() {
    return  $("#editLayer").attr("ok") && 
            $("#wmsUrl").attr("ok") && 
            $("#wmsLayers").attr("ok") ; 
}



/**
 * Create a layer. 
 */

polaric.WmsLayer.prototype.createLayer = function(name) {
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

polaric.WmsLayer.prototype.edit = function(layer) {
   polaric.LayerEdit.prototype.edit.call(this, layer);
   
   $("#wmsUrl").val(layer.getSource().getUrl()).trigger("change").attr("ok", true);
   $("#wmsLayers").val(layer.getSource().getParams().LAYERS).trigger("change").attr("ok", true);
}



/**
 * Stringify settings for a layer to JSON format. 
 */

polaric.WmsLayer.prototype.layer2json = function(layer) { 
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

polaric.WmsLayer.prototype.json2layer = function(js) {
    var lx = JSON.parse(js);

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



   
   
   
   
   
   
   
