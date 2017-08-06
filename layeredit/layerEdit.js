
/*
 Map browser based on OpenLayers 4. 
 
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
 * Base class for layer editors
 * @constructor
 */

polaric.LayerEdit = function(list) {
   var t = this;
   t.list = list;
   t.filt = {ext: null, zoom: null, proj: null};
   
   
   this.widget = {
     view: function() {
        var i=0;
        return m("form", [    
             m("span.sleftlab", "Name: "),   
             m(textInput, {id:"editLayer", size: 16, maxLength:25, regex: /^[^\<\>\'\"]+$/i }), br,  
             m("span.sleftlab", "Visibility: "),
             m(checkBox, {id:"vis.extent", onclick: filterExtent, checked: (t.filt.ext != null) }, 
                "Map extent", nbsp, nbsp),
             m(checkBox, {id:"vis.zoom", onclick: filterZoom, checked: (t.filt.zoom != null) },
                "Zoom level+", nbsp, nbsp),
             m(checkBox, {id:"vis.proj", onclick: filterProj, checked: (t.filt.proj != null) },
                "Projection", br),
             m(t.fields),
             
             m("div.buttons", [
                m("input#addButton", { disabled: !t.enabled(), type: "button", onclick: add, value: "Add" } ),
                m("input", { type: "reset", onclick: reset, value: "Reset" } )
             ])
        ]);
      }
   };
   
   
   
   /* To be redefined in subclass */
   this.fields = {
       view: function() { return null; }
   }
   

   /* Handler for checkbox. Extent filter on/off */
   function filterExtent() {
      t.filt.ext = (t.filt.ext == null ? 
        CONFIG.mb.getExtent().map(function(x) {return Math.round(x*1000)/1000;}) : null);
      console.log("Set extent filter: "+t.filt.ext);
   }
   
   
   /* Handler for checkbox. Zoom level filter on/off */
   function filterZoom() {
       t.filt.zoom = (t.filt.zoom == null ? CONFIG.mb.getResolution() : null);
       console.log("Set zoom filter: "+t.filt.zoom);
   }
   
   
   /* Handler for checkbox. Projection filter on/off */
   function filterProj() {
       t.filt.proj = (t.filt.proj == null ? CONFIG.mb.view.getProjection() : null);
       console.log("Set projection filter: " + (t.filt.proj==null ? "null" : t.filt.proj.getCode()));
   }
   
   
   function reset() {
   }
   
   
   
   /** 
    * Add a map layer to list 
    */
   function add() 
   {  
       var name = $("#editLayer").val(); 
       var layer = t.createLayer(name);
       
       if (layer != null) {
          layer.predicate = t.createFilter(t.filt);
          layer.filt = t.filt;
          CONFIG.mb.addConfiguredLayer(layer, name);
       }

       list.myLayerNames.push( {name: name, type: t.typeid} );
       list.myLayers.push( layer );

        // Save the layer name list. 
       CONFIG.store("polaric.LayerList", list.myLayerNames, true);
        // Save the layer using the concrete subclass
       CONFIG.store("polaric.Layer."+name.replace(/\s/g, "_"), t.layer2json(layer), true);       
       
       return false;
   }
   
}



polaric.LayerEdit.prototype.enabled = function()
   { return false; }


/**
 * Create a filter function (a predicate) with the parameters 
 * (extent, zoom-level, projection) set by user
 */
polaric.LayerEdit.prototype.createFilter = function (f) {
    var filt = f;
    
    if (!filt)
        return null;

    /* Returns a closure with the chosen parameter values */
    return function() {
       return ( 
          (filt.ext == null  || ol.extent.intersects(ext, CONFIG.mb.getExtent())) &&
          (filt.zoom == null || filt.zoom >= CONFIG.mb.getResolution()) &&
          (filt.proj == null || filt.proj === CONFIG.mb.view.getProjection())  
        );
    }
}



/**
 * Move settings to web-form. 
 * To be extended in subclass. 
 */
polaric.LayerEdit.prototype.edit = function(layer) {
    $("#editLayer").val(layer.get("name")).trigger("change").attr("ok", true);
    this.filt = layer.filt;
    $("#vis.extent").prop("checked", (this.filt.ext != null));
    $("#vis.zoom").prop("checked", (this.filt.zoom != null));
    $("#vis.proj").prop("checked", (this.filt.proj != null));
}



 /**
  * Create a layer. 
  * To be defined in subclass 
  */
polaric.LayerEdit.prototype.createLayer = function(n) {
    return null; 
}


/**
 * Stringify settings for a layer to JSON format. 
 * To be defined in subclass. 
 */
polaric.LayerEdit.prototype.layer2json = function(layer) { 
    return "dummy";
}


/**
 * Restore a layer from JSON format (see layer2json). 
 * To be defined in subclass. 
 */
polaric.LayerEdit.prototype.json2layer = function(js) {
    return null; 
}




polaric.DummyLayer = function(list) {
   polaric.LayerEdit.call(this, list);
}
ol.inherits(polaric.DummyLayer, polaric.LayerEdit);






