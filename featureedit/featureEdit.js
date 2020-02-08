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
 *  - Allow set/edit of label/properties (metainfo) of selected feature. Use this 
 *    editor or separate window?. DONE (label).
 *  - Turn off select of features if this tool is not active. DONE. 
 *  - Allow style without fill. Dashed line? Revise colour choices. DONE. 
 * 
 *  - Show properties of feature on click. DONE? 
 *  - Context menu
 *  - Split this class - DrawableLayer and Editor? 
 *  - Allow default drawing layer to be hidden (when tool not active). When tool is not active OR show in layer-list? 
 *  - Allow multiple instances of drawable layer. Use layer-editor to create/manage layers. 
 *  - Allow move/copy of features between layers.
 *  - Display label on map if user activates this..  
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
                setTimeout(snow.cssColors, 500)
                return m("div", [       
                    m("h1", "Feature draw tool"),
                    m(tool), 
                    m("div.link_id", {onclick: propsHandler}, "Feature properties...")
                ])
            }
        };
   

        snow.deleteHighlightHandler() 
        
        /* 
         * Handlers to be called when features are added, changed or removed
         * May trigger REST calls to server 
         */
        snow.drawSource.on("removefeature", e=> {
            if (e.feature.remove == true) {
                e.feature.remove = NaN; 
                changeHandler(e.feature, 'rm');
            }
        });
       
        snow.drawSource.on("changefeature", e=> {
            console.log("changefeature:", e);
            changeHandler(e.feature, "chg");
        });
        
        
        snow.addDrawCB( 
            e=> changeHandler(e.feature, "add")
        );
        
        /* 
         * If the view (projection) is changed, we need to restore features 
         * from server. 
         */
        CONFIG.mb.map.on("change:view", ()=> {t.restoreFeatures()});
        
        /* Features should loaded even if editor is not active */
        setTimeout(()=>t.restoreFeatures(), 1000); 
        
        /* 
         * Updating of server should happen after a delay since 
         * a series of change events may happens in short period. 
         */ 
        let tmr = null;
        function changeHandler(x, op) {
            if (tmr != null && op == "chg")
                clearTimeout(tmr);
            tmr = setTimeout(()=> {
                t.doUpdate(x, op);
                tmr = null;
            }, 1000); 
        }
        
        
        function propsHandler() {
            if (!t.props) 
                t.props = new pol.features.Properties(t);
            if (!t.props.isActive())
                t.props.activatePopup('features.Properties', [60, 60], true);
        }

        
    } /* constructor */
    

    onActivate() {
        snow.activate();
        snow.featureEdit = this; 
        snow.draftLayer.setVisible(true);
    }
    
    onclose() {
        snow.deselectAll();
        snow.deactivate();
        snow.removeDraw();
        snow.removeModify();
        snow.draftLayer.setVisible(false);
        if (this.props && this.props.isActive()) 
            this.props.close();
    }
    
    
    
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
   
   
   /* 
    * Update server. Operations: "add", "chg" (change) and "rm" (remove). 
    * Change is implemented as a remove and put. 
    */ 
    doUpdate(x, op) {
        const srv = CONFIG.server; 
        if (srv != null && srv.loggedIn && srv.hasDb) {
            if (op=='chg' || op=="rm")
                srv.removeObj("feature", x.index);
            if (op=='add' || op=='chg') 
                srv.putObj("feature", this.feature2obj(x), i => {x.index = i;} );
        }
    }
        
        
    /* Convert feature to object that can be stringified as JSON */
    feature2obj(f) {
        
        /* First: transform to latlong projection! */
        let geom = f.getGeometry().clone();
        let st = (f.originalStyle ? f.originalStyle : f.getStyle()); 
        geom.transform(CONFIG.mb.view.getProjection(), 'EPSG:4326');
        
        let obj = {
            type: geom.getType(), 
            style: this.style2obj(st),
            label: f.label
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
        feat.label = obj.label;
        return feat;
    }
    
    
    /* Convert style to object that can be stringified as JSON */
    style2obj(st) {
        let obj = {
            stroke: { 
                color:st.getStroke().getColor(), 
                width:st.getStroke().getWidth(),
                lineDash: st.getStroke().getLineDash()
            }, 
            fill: (st.getFill() ? {color: st.getFill().getColor()} : null)
        };
        return obj;
    }
    
    
    /* Convert object to style (se also style2obj */
    obj2style(obj) {
        let st = snow.getStyle(); 
        st.setStroke(new ol.style.Stroke(obj.stroke)),
        st.setFill(obj.fill==null ? null : new ol.style.Fill(obj.fill)); 
        return st;
    }
    
    
} /* class */




pol.widget.setFactory( "features.Edit", {
        create: () => new pol.features.Edit()
    }); 

