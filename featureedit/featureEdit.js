/*
 Map browser based on OpenLayers 5. 
 
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


pol.features = pol.features || {};



pol.features.init = function(map) {
    snow.init(map);
}

/*
 * This class should support
 *  - Setting the name of the drawing layer. If so, it will be added to "My Layers" as well. 
 *  - Setting name/properties (metainfo) of selected feature. 
 *  - Change of drawing layer. 
 *  - Saving of drawing layer's content. One REST call/database update per feature. 
 *  - Restoring of drawing layer's content. Whole layer (or single feature to update other clients) 
 *  - Exporting layer or selected features as GeoJSON or GPX. 
 */

pol.features.Edit = class extends pol.core.Widget {

    constructor() {
        super();
        this.classname = "features.Edit"; 
        const t = this;
        let tool = snow.drawTools;
        let timer = null;
        
        this.widget = {
            view: function() {
                return m("div", [       
                    m("h1", "Feature editor"),
                    m(tool),
                ])
            }
        };
   
        setTimeout(snow.cssColors, 500)
        snow.deleteHighlightHandler() 
        
        /* Handlers to be called when features are changed */
        /* May trigger saving of features to server */
        snow.drawSource.on("addfeature",    (e)=> fHandler(e) );
        snow.drawSource.on("changefeature", (e)=> fHandler(e) );
        snow.drawSource.on("removefeature", (e)=> fHandler(e) );
   
        /* 
         * Handler for feature changes. Triggers
         * saving of features if changes has happened and paused
         * for 2 seconds.
         */  
        function fHandler(e) {
            let x = e.feature;
            if (timer)
                clearTimeout(timer);
            
            timer = setTimeout(()=> { 
                console.log("*** SAVE FEATURE *** "); 
                t.feature2obj(x);
                timer=null;
            }, 500);
        }
        
        
        
        
        
    } /* constructor */
    

    feature2obj(f) {
        const geom = f.getGeometry();
        let obj = {
            type: geom.getType(), 
            style: f.getStyle()
        };
        if ( obj.type == "Circle" )  {
            obj.center = geom.getCenter(), 
            obj.radius = geom.getRadius()
        }
        else if (obj.type == "Polygon") {
            obj.coord = geom.getCoordinates();
        }
        else if (obj.type == "LineString") {           
            obj.coord = geom.getCoordinates();
        }
        
        console.log(obj);
    }
    
    
    
    obj2feature(obj) {
        if ( obj.type == "Circle" )  {
        }
        else if (obj.type == "Polygon") {
        }
        else if (obj.type == "LineString") {           
        }
    }
    
    
} /* class */





pol.widget.setRestoreFunc("features.Edit", (id, pos) => {
    var x = new pol.features.Edit(); 
    x.activatePopup(id, pos, true); 
}); 
