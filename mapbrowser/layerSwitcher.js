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
  * 
  * @constructor
  */
 
 polaric.LayerSwitcher = function(mb) {
   var t = this;
   this.mb = mb;
   this.storage = null;
   this.delement = null;
   this.mb.map.on('moveend', onMove);
   
   function onMove() {
       t.evaluateLayers();
   }
 };
 

 /**
  * Turn on/off a given overlay. 
  */
 polaric.LayerSwitcher.prototype.toggleOverlay = function(i)
 {
     var prev = this.mb.config.oLayers[i].getVisible(); 
     this.mb.config.oLayers[i].setVisible(!prev);
     this.mb.config.store('olayer.' + i, !prev); 
 }
 

 
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
   this.displayLayers(this.delement);
 };
 
 
 
 /** 
  * Display layers in the given DOM element 
  */
 
 polaric.LayerSwitcher.prototype.displayLayers = function(w) 
 { 
     var t = this;
     if (w) t.delement = w; 
     w.innerHTML = generateForm();
     addHandlers();
     
     
     /* Handler to use when selecting base layer */
     function handleSelect(arg) {
       return function() {
          t.mb.changeBaseLayer(arg);
          t.evaluateLayers();
       } 
     }

     
     /* Handler to use when toggling overlay */  
     function handleToggle(arg) {return function() 
       { t.toggleOverlay(arg);} }
     
     
     /* Generate list of layers as HTML forms */
     function generateForm() {  
        var html = '<div id="layerSwitcher">';
        
        /* Base layers */
        html+='<h2>'+'Base layer'+'</h2><form>';
        for (var i=0; i < t.mb.config.baseLayers.length; i++) 
        { 
          /* Display radio button and text for base layer */
          var x = t.mb.config.baseLayers[i];
          if (x.predicate()) {
             html += '<input id="blayer'+i+'" type="radio" name="layer" value="layer'+i+'"';
             if (x == t.mb.map.getLayers().item(0)) 
               html += ' checked';
             html += '> <span>'+x.get('name')+'</span><br>';
          }
        }
 
        /* Overlays */
        html+='</form><h2>'+'Overlays'+'</h2><form>';
        for (var i=0; i < t.mb.config.oLayers.length; i++)  
        {  
          /* Display tick button for overlay layer */
          var x = t.mb.config.oLayers[i];
          if (x.predicate()) {
             html += '<input id="layer'+i+'" type="checkbox" name="overlay" value="layer'+i+'"';
             if (x.getVisible()) 
                html += ' checked';
             html += '> <span>'+x.get('name')+'</span><br>';
          }
        }
         
        html += '</form></div>';
        return html;
     }
     
     
     /* Add click-handlers for each layer in list */
     function addHandlers() {
       /* Base layers */
       for (var i=0; i < t.mb.config.baseLayers.length; i++) 
          $('#blayer'+i).click( handleSelect(i) );
       
       /* Overlays */
       for (var i=0; i < t.mb.config.oLayers.length; i++)
          $('#layer'+i).click( handleToggle(i) );
     }
     
 };
 
 
