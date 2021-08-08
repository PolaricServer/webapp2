/*
 Map browser based on OpenLayers 5. 
 Feature properties editor widget based on snowcode project.
 
 Copyright (C) 2019-2020 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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




pol.features.Properties = class extends pol.core.Widget {

    constructor(dt) {
        super();
        const t = this;
        t.classname = "features.Properties";
        const features = ()=> snow.drawSource.getFeatures();
        t.selected = null; /* Feature whose metadata are edited by user */
        t.drawTool = (dt ? dt : snow.featureEdit);
        t.label = m.stream("");
        t.layerList = getWIDGET("layers.List");
        t.editor = getWIDGET("features.Edit");
        
        
        /* Show center and radius of circle (Mithril component) */
        t.circle = {
            view: function() {
                return m("div#circleInfo", [
                    m("span.field", [
                        m("span.sleftlab", "Center: "),
                        (t.center ? m("span.coord", {onclick: apply(gotoPos,t.center)}, formatPos(t.center)) : "-") ]),
                         
                    m("span.field", [
                        m("span.sleftlab", "Radius: "), 
                        m("span", t.radius ? 
                            (t.radius < 1000 ? Math.round(t.radius*100)/100+" m" : 
                            Math.round(t.radius/100)/10+" km") : "-") ])
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

        
        t.layers = {    
            view: function(vn) {
                return m("select#"+vn.attrs.id, {onchange: ()=>t.changeHandler} , t.layerList.getLayers()
                    .filter( x => x.get("drawing") )
                    .map( x => m("option", {value: x.get("name") }, x.get("name")) ));
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
                    
                    ( selectedLayer() != null && selectedLayer().getSource().getFeatures().length > 0 ? 
                        m("table.lfeatures", [
                          m("caption", "Layer features:"),
                          m("tbody", selectedLayer().getSource().getFeatures().map( x => {
                            return m("tr", 
                                m("td", (x.label ? x.label : "(no label)"))
                            )
                        }))] ) : ""),    
                    
                    hr,
                                        
                    m("span.field", [
                        m("span.sleftlab", "Type: "),
                        m("span", (t.selected==null? "---" : t.selected.getGeometry().getType()))
                    ]),
                                        
                    m("span.field", [
                        m("span.sleftlab", "Label: "),
                        m(textInput, {id:"editLabel", size: 16, maxLength:25, value: t.label, regex: /.*$/i }),
                        m("button", {onclick: set, title: "Update properties"}, "Update")
                    ]),
                    
                    (!t.layerList.isEmpty() ? 
                        m("span.field", [
                            m("span.sleftlab", "Layer: "),
                            m(t.layers, {id:"tolayer"}), 
                            m("button", {onclick: move, title: "Move feature to layer"}, "Move to"),
                            m("button", {onclick: getFrom, title: "Get features from layer for editing"}, "Get from"),
                        ]) : ""),

                    (t.radius ? m(t.circle) : (t.colist ? m(t.coord) : ""))
                ])
            },  
            onupdate: checkHide

        };
        
        
        m.redraw();
        setTimeout(changeHandler, 3300);
        snow.drawSource.on("changefeature", changeHandler);
        
        $(document).on("selectfeature", ()=> {
            _edit(snow.lastSelected); 
            changeHandler();
        } );
        
        snow.addDrawCB( 
            e=> setTimeout(()=>changeHandler(), 100)
        );

        CONFIG.mb.map.on("change:view", ()=> setTimeout(()=> changeHandler(), 100) ); 
        
        setTimeout(checkHide, 500);
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
        
        function checkHide() {
            const val = $("select#tolayer").val();
            if (val && val != null)
                $("span#tolayer").show();
            else
                $("span#tolayer").hide();
        }
        
        
        
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
            
            if (t.type == "Polygon" || t.type == "LineString") { 
                t.colist = g.getCoordinates();    
                if (t.colist.length == 1)
                    t.colist = t.colist[0];
            }
            else if (t.type=="Circle") {
                t.center=g.getCenter();
                t.radius=h.getRadius();
            }
        }
        
        
        /* Remove feature */
        function remove(i) {
            if (confirm("Remove - are you sure?") == false)
                return;
            snow.deleteFeature(features()[i]); 
        }
        
        
        
        function set() {
            t.selected.label = t.label();
            t.drawTool.doUpdate(t.selected, "chg");
        }
        
        
        function selectedLayer() {
            const name = $("select#tolayer").val();
            let x = null;
            for (x of t.layerList.getLayers())
                if (x.get("name") == name) 
                        return x;
            return null;
        }
        
        
        
        /* Move the selected feature to the selected target layer */
        function move() {
            const x = selectedLayer();
            if (t.selected == null) 
                console.warn("No feature selected");
            else if (x == null)
                console.warn("No target layer selected"); 
            else if (snow.drawLayer == x)
                console.warn("Source and target layers is the same")
            else {
                /* Move the feature */
                x.getSource().addFeature(t.selected);
                snow.deleteFeature(t.selected);
                t.selected.layer = x.get("name");
                const s = t.selected;
                setTimeout(()=>t.editor.doUpdate(s, "chg"), 1200);
                t.selected = null;
                t.colist = NaN; 
                t.radius = NaN;
            }
        }
        
        
        /* Get features from selected target layer */
        function getFrom() {
            const x = selectedLayer(); 
            if (x == null)
                console.warn("No target layer selected"); 
            else if (snow.drawLayer == x)
                console.warn("Source and target layers is the same")
            else {
                /* Move the features */
                x.getSource().forEachFeature(
                    (f) => {
                        snow.drawSource.addFeature(f);
                        x.getSource().removeFeature(f);
                        f.layer = "DRAFT";
                        setTimeout(()=>t.editor.doUpdate(f, "chg", x.get("name")), 1200);
                        console.log("Moved feature '"+f.label+"' from '"+f.layer+"'");
                    });
            }           
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
            console.log("CHANGE HANDLER");
            m.redraw()
        }

        
    } /* constructor */
} /* class */
