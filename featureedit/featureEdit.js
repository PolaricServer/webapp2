/*
 Map browser based on OpenLayers 5. 
 Feature editor widget (drawing tool) based on snowcode project.
 
 Copyright (C) 2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * TODO:
 *  - Saving of drawing layer's content. One REST call/database update per feature. DONE.
 *  - Restoring of drawing layer's content. DONE.
 *  - Split this class - DrawableLayer and Editor
 *  - Allow multiple instances of drawable layer. Use layer-editor to create/manage layers. 
 *  - Allow move/copy of features between layers. 
 *  - Show properties of feature on click. 
 *  - Context menu
 *  - Allow set/edit of name/properties (metainfo) of selected feature. Use this editor or separate window?
 *  - Allow exporting of layer or selected features as GeoJSON or GPX. 
 *  - Allow sharing of features with other users. 
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
        
        /* 
         * Handlers to be called when features are added, changed or removed
         * May trigger REST calls to server 
         * FIXME: Maybe snowcode should have its own events
         */
        snow.drawSource.on("removefeature", e=> {
            if (e.feature.remove == true) {
                e.feature.remove = NaN; 
                changeHandler(e.feature, 'rm');
            }
        });
       
        snow.drawSource.on("changefeature", e=> {
            if (e.feature.select==true)
                e.feature.select = NaN;
            else
                changeHandler(e.feature, "chg");
        });
        
        snow.setCallbacks( 
            e=>changeHandler(e.feature, "add") ,
            null 
        );
        
        /* 
         * If the view (projection) is changed, we need to restore features 
         * from server. 
         */
        CONFIG.mb.map.on("change:view", ()=> {t.restoreFeatures()});
        
        /* Features should loaded even if editor is not active */
        setTimeout(()=>t.restoreFeatures(), 1000); 
        
        /* 
         * Updating of server should happend after a delay since 
         * a series of change events may happens in short period. 
         */ 
        let tmr = null;
        function changeHandler(x, op) {
            if (tmr != null)
                clearTimeout(tmr);
            tmr = setTimeout(()=> {
                doUpdate(x, op);
                tmr = null;
            }, 1000); 
        }
        
        /* 
         * Update server. Operations: "add", "chg" (change) and "rm" (remove). 
         * Change is implemented as a remove and put. 
         */ 
        function doUpdate(x, op) {
            const srv = CONFIG.server; 
            if (srv != null && srv.loggedIn && srv.hasDb) {
                if (op=='chg' || op=="rm")
                    srv.removeObj("feature", x.index);
                if (op=='add' || op=='chg') 
                    srv.putObj("feature", t.feature2obj(x), i => {x.index = i;} );
            }
        }
        
    } /* constructor */
    

    /* Restore features from server */
    restoreFeatures() {
        const srv = CONFIG.server; 
        if (srv != null && srv.loggedIn && srv.hasDb) {
            srv.getObj("feature", a => {
                for (const obj of a) 
                    if (obj != null) {
                        let f = this.obj2feature(obj.data);
                        f.index = obj.id;
                        snow.drawSource.addFeature(f);
                    }
            });
        }
    }
    
    
    /* Convert feature to object that can be stringified as JSON */
    feature2obj(f) {
        
        /* First: transform to latlong projection! */
        let geom = f.getGeometry().clone();
        geom.transform(CONFIG.mb.view.getProjection(), 'EPSG:4326');
        
        let obj = {
            type: geom.getType(), 
            style: this.style2obj(f.getStyle()),
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
        else
            console.error("Unknown geom type: "+obj.type);
         
        return obj;
    }
    
    
    /* Convert object to feature (see also feature2obj) */
    obj2feature(obj) {
        let geom = null;
        if ( obj.type == "Circle" )  {
            geom = new ol.geom.Circle(obj.center, obj.radius);
        }
        else if (obj.type == "Polygon") {
            geom = new ol.geom.Polygon(obj.coord);
        }
        else if (obj.type == "LineString") {
            geom = new ol.geom.LineString(obj.coord);
        }
        else
            console.error("Unknown geom type: "+obj.type);
        let feat = new ol.Feature();
        geom.transform('EPSG:4326', CONFIG.mb.view.getProjection());
        feat.setGeometry(geom);
        feat.setStyle(this.obj2style(obj.style));
        return feat;
    }
    
    
    /* Convert style to object that can be stringified as JSON */
    style2obj(st) {
        let obj = {
            stroke: { 
                color:st.getStroke().getColor(), 
                width:st.getStroke().getWidth()
            }, 
            fill: {color: st.getFill().getColor()}
        };
        return obj;
    }
    
    
    /* Convert object to style (se also style2obj */
    obj2style(obj) {
        let st = new ol.style.Style({ 
                stroke: new ol.style.Stroke(obj.stroke),
                fill: new ol.style.Fill(obj.fill)
            }); 
        return st;
    }
    
    
} /* class */





pol.widget.setRestoreFunc("features.Edit", (id, pos) => {
    var x = new pol.features.Edit(); 
    x.activatePopup(id, pos, true);
    x.restoreFeatures();
}); 
