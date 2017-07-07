 /*
    Map browser based on OpenLayers 4. 
    Layer manager/layer switcher.
    
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
  * Layer manager/layer switcher.
  * @constructor
  * @param {polaric.MapBrowser} mb - Map browser instance. 
  */
 
 polaric.LayerSwitcher = function() {
   polaric.Widget.call(this);
   this.classname = "polaric.LayerSwitcher";
   
   var t = this;
   this.mb = CONFIG.mb;
   this.storage = null;
   this.delement = null;
   this.mb.map.on('moveend', function() {t.evaluateLayers();});
   this.mb.map.getLayers().on('add', function() {t.evaluateLayers();});
   this.mb.map.getLayers().on('remove', function() {t.evaluateLayers();});
   
   
   
   /* UI component */
   this.widget = {
       view: function() {
         var i=0;
         return m("div#layerSwitcher", [
         
            /* Display list of base layers */
            m("h2", "Base layer"), m("form", 
                t.mb.config.baseLayers.map(function(x) {
                   return (x.predicate() ? 
                      m("span", [ 
                         m("input#blayer"+i, {
                             onclick: handleSelect(i), 
                             type:"radio", name:"layer", value:"layer"+ (i++), 
                             checked: (x== t.mb.map.getLayers().item(0) ? "checked" : null) 
                         }), nbsp,
                         x.get("name"), br])
                      : null) 
                })),
                
            /* Display list of overlays */        
            m("h2", "Overlays"), m("form", 
                t.mb.config.oLayers.map(function(x) {
                   return (x.predicate() ?
                      m("span", [
                         m("input#layer"+i, {
                             onclick: handleToggle(i),
                             type:"checkbox", name:"overlay", value:"layer"+ (i++), 
                             checked: (x.getVisible() ? "checked" : null) 
                         }), nbsp,
                         x.get("name"), br])
                      : null) 
                })) 
          ]);                             
       }
    }
    
    
    /* Handler to use when selecting base layer */
    function handleSelect(arg) {
        return function() {
          t.mb.changeBaseLayer(arg);
          t.evaluateLayers();
       } 
     }
    
    
    /* Handler to use when toggling overlay */  
    function handleToggle(arg) {
       return function() 
          { t.toggleOverlay(arg);} }
       
 };
 ol.inherits(polaric.LayerSwitcher, polaric.Widget);

 
 
 
 /**
  * Turn on/off a given overlay layer.
  * @param {number} i - index of layer.  
  */
 
 polaric.LayerSwitcher.prototype.toggleOverlay = function(i)
 {
     i -= this.mb.config.baseLayers.length;
     console.assert(i >= 0 && i <= this.mb.config.oLayers.length, "Assertion failed");
     
     var prev = this.mb.config.oLayers[i].getVisible(); 
     this.mb.config.oLayers[i].setVisible(!prev);
     this.mb.config.store('olayer.' + i, !prev); 
 };
 

 
 
 /**
  * Re-evaluate what layers to be shown in layer switcher list. 
  */
 
 polaric.LayerSwitcher.prototype.evaluateLayers = function() {

   /* First, check if base layer is still valid. If not, 
    * replace it with first layer in list that is. 
    */
   if (!this.mb.getBaseLayer().predicate()) {
      var layers = this.mb.config.baseLayers; 
      for (var i=0; i < layers.length; i++) {
          if (layers[i].predicate()) {
              this.mb.setBaseLayer(i);
              break;
          }
      }
   }
   m.redraw();
 };

 
 
 widget.setRestoreFunc("polaric.LayerSwitcher", function(id, pos) {
    var x = new polaric.LayerSwitcher(); 
    x.activatePopup(id, pos, true); 
 }); 
 
