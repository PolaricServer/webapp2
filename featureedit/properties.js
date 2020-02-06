/*
 Map browser based on OpenLayers 5. 
 Feature properties editor widget based on snowcode project.
 
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



/*
 * TODO:
 *  - Saving of drawing layer's content. One REST call/database update per feature. DONE.
 *  - Restoring of drawing layer's content. DONE.
 * 
 *  - Split this class - DrawableLayer and Editor
 *  - Allow multiple instances of drawable layer. Use layer-editor to create/manage layers. 
 *  - Allow move/copy of features between layers. 
 *  - Show properties of feature on click. 
 *  - Context menu
 *  - Allow set/edit of name/properties (metainfo) of selected feature. Use this editor or separate window?
 *  - Allow exporting of layer or selected features as GeoJSON or GPX. 
 *  - Allow sharing of features with other users. 
 */


pol.features.Properties = class extends pol.core.Widget {

    constructor(dt) {
        super();
        const t = this;
        t.classname = "features.Properties";
        const features =  () => snow.drawSource.getFeatures();
        t.selected = null; /* Feature whose metadata are edited by user */
        t.drawTool = (dt ? dt : snow.featureEdit);
        t.label = m.stream("");

        
        /* Show center and radius of circle (Mithril component) */
        t.circle = {
            view: function() {
                return m("div#circleInfo", [
                    m("span.sleftlab", "Center: "),
                    (t.center ? m("span.coord", {onclick: apply(gotoPos,t.center)}, formatPos(t.center)) : "-"), br,
                    m("span.sleftlab", "Radius: "), 
                    m("span", t.radius ? 
                        (t.radius < 1000 ? Math.round(t.radius*100)/100+" m" : 
                        Math.round(t.radius/100)/10+" km") : "-")
                ]);
            }
        }
        
        
        /* Show list of coordinates (Mithril component) */
        t.coord = {
            view: function() {
                return m("div#colist", 
                    t.colist.map( x=> {
                        return [m("span.coord", {onclick: apply(gotoPos,x)}, formatPos(x)), ", "]})); 
            }
        }
        
        /* Main mithril component */
        t.widget = {
            view: function() {
                let i=0;
                return m("div#features", [       
                    m("h1", "Features/properties"),
                    
                    m("table.features", m("tbody", features().map( x => {
                        return m("tr", {class: (x==t.selected ? "selected" : "")}, [
                            m("td", m(removeEdit, 
                                { remove: apply(remove, i), edit: apply(edit, i++) })),
                            m("td", x.getGeometry().getType()),
                            m("td", (x.label ? x.label : ""))
                        ])
                    }))),    
                    hr,

                    m("span.sleftlab", "Label: "),
                    m(textInput, {id:"editLabel", size: 16, maxLength:25, value: t.label, regex: /.*$/i }),
                    m("button", {onclick: set, title: "Update properties"}, "Update"), br,
                    m("span.sleftlab", "Type: "),
                    m("span", (t.selected==null? "---" : t.selected.getGeometry().getType())), 
                    br,
                    (t.radius ? m(t.circle) : (t.colist ? m(t.coord) : ""))
                ])
            }
        };
        
        m.redraw();
        snow.drawSource.on("changefeature", changeHandler);
        
        $(document).on("selectfeature", ()=> {
            _edit(snow.lastSelected); 
            changeHandler();
        } );
        
        snow.addDrawCB( 
            e=> setTimeout(()=>changeHandler(), 100)
        );

        CONFIG.mb.map.on("change:view", ()=> setTimeout(()=> changeHandler(), 100) ); 
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
        
        /* Zoom and show position on map */
        function gotoPos(x) {
            CONFIG.mb.gui.removePopup();
            CONFIG.mb.goto_Pos(x, false);
        }
        
        /* Format position (longitude, latitude) */
        function formatPos(p) {
            return "["+Math.round(p[0]*1000)/1000 + ", " + 
              Math.round(p[1]*1000)/1000+"]"; 
        }
        
        /* Handler for edit icon in feature list */    
        function edit(i) {
            /* Convert geometry to LatLong */
            const geom = features()[i].getGeometry().clone(); 
            geom.transform(CONFIG.mb.view.getProjection(), 'EPSG:4326');
            
            /* Zoom in to feature and allow user to edit it */
            CONFIG.mb.fitExtent(geom.getExtent());
            CONFIG.mb.view.setZoom(CONFIG.mb.view.getZoom()-1)
            _edit(features()[i]);
        }
        
        
        /* Edit it - move it into form below feature list */
        function _edit(f) {
            t.selected = f;
            t.label(t.selected.label);
            showGeom(f);
            m.redraw(); 
        }
        
        
        /* Show geometry of feature */
        function showGeom(f) {
            /* Convert geometry to LatLong */
            const g = f.getGeometry().clone(); 
            const h = g.clone();
            g.transform(CONFIG.mb.view.getProjection(), 'EPSG:4326');
            
            t.type = g.getType(); 
            t.center=NaN; t.radius=NaN; t.colist=NaN;
            
            if (t.type == "Polygon" || t.type == "LineString") 
                t.colist = g.getCoordinates()[0];      
            else if (t.type=="Circle") {
                t.center=g.getCenter();
                t.radius=h.getRadius();
            }
        }
        
        
        /* Remove feature */
        function remove(i) {
            snow.deleteFeature(features()[i]); 
        }
        
        
        
        function set() {
            t.selected.label = t.label();
            t.drawTool.doUpdate(t.selected, "chg");
        }
        
        
        /* FIXME: Move this to a proper place. 
         * use it when we want to show a label on the feature. Do we?  
         * Keep text-style when saving/restoring feature. 
         */
        function setLabel() {
            let st = (t.originalStyle ? t.originalStyle : t.selected.getStyle());
            st.getText().setText(t.selected.label);
        }
        
        
        function changeHandler() {
            m.redraw()
        }

        
    } /* constructor */
} /* class */


    
pol.widget.setFactory("features.Properties", {
    create: () => new pol.features.Properties()
}); 
