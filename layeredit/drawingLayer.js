/*
 Map browser based on OpenLayers 5. Layer editor. 
 WMS layer. 
 
 Copyright (C) 2020 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * WMS layer editor.
 */

pol.layers.Drawing = class extends pol.layers.Edit {

    constructor(list) {
        super(list);  
        const t=this;

    
        t.fields = {
            view: function() { 
                return m("span");
            }
        }          
    
    } /* constructor */



    /**
     * Return true if add button can be enabled 
     */
    enabled() {
        return  true; 
    }



    /**
     * Create a OL layer. 
     */
    _createLayer(name) {
        const src = new VectorSource();
        const l = new VectorLayer(
            { name: name, source: src }
        );
        l.set("drawing", true, true);
        
        /* Add a handler function to present info about a feature */
        l.displayInfo = function(f) {
                return [{val: f.label}]; 
            }; 
        return l;
    }
    
    createLayer(name) {
        return this._createLayer(name);
    }
    
    
    
    removeLayer(layer) {
        getWIDGET("features.Edit").removeFeatures(layer.get("name"));
    }
    
    

    /**
     * Stringify settings for a layer to JSON format. 
     */
    layer2obj(layer) { 
        const lx = { name: layer.get("name") };
        return lx;
    }



   /**
    * Restore a layer from JSON format (see layer2json). 
    */
    obj2layer(lx) {
        if (lx == null) {
            console.warn("DrawingLayer.obj2layer: Resulting Layer is null");
            return null;
        }  
        const layer = this._createLayer(lx.name);
        
        /* Restore features in layer */
        getWIDGET("features.Edit").restoreFeatures(lx.name);
        return layer;
    }

} /* class */

   
   
   
   
   
   
   
