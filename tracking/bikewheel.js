 
/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
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
 * Reference search (in a popup window). 
 */

pol.tracking.BikeWheel = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        t.label = m.stream("IPP");
        t.descr = m.stream("");
        t.pos = [0,0];
        t.p25 = m.stream("");
        t.p50 = m.stream("");
        t.p75 = m.stream("");
        t.p95 = m.stream("");
        t.olist = [];
                
        t.classname = "tracking.BikeWheel"; 
        
        t.iconpath = CONFIG.get('iconpath');
        if (t.iconpath == null)
            t.iconpath = '';

        
        this.widget = {
            view: function() {
                var i=0;
                return m("div#bikeWheel", [       
                    m("h1", "Add LKP/IPP with distance rings"),  
                    
                    m("div.itemList", t.olist.map( x=> {
                        return [ m("span", [ 
                            m("img",  {src: "images/edit-delete.png", onclick: apply((x)=>t.remove(i++), x)}),
                            m("span", {onclick: apply(zoomTo, x)}, x.label), nbsp]
                        ), " "]
                    })),     
                    m("div.errmsg", errmsg),    
                                   
                         
                    m("div.field",
                        m("span.sleftlab", "Ident: "),   
                        m(textInput, {id:"label", value: t.label, size: 10, maxLength:15, 
                            regex: /^[a-zA-Z0-9\_\-\.\#\/]+$/i })) ,   
                         
                    m("div.field", 
                        m("span.sleftlab", "Description: "), 
                        m(textInput, {id:"descr", value: t.descr, size: 32, maxLength:64, regex: /^.+$/i })),
                   
                    m("div.field", 
                        m("span.sleftlab", "Pos (UTM): "), 
                        m(utmInput, {value: t.pos})),    
                         
                    m("div.field", 
                        m("span.sleftlab", "Rings: "), 
                        m("div#rings", [
                            m(textInput, {value: t.p25, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 25%", br,
                            m(textInput, {value: t.p50, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 50%", br,
                            m(textInput, {value: t.p75, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 75%", br,
                            m(textInput, {value: t.p95, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 95%", 
                         ]), 
                         m("div#alternatives", [ 
                            m("span", "To find suitable distances for a subject, see ISRID Database / Lost Person Behavior by Koester")
                        ])
                     ),
                         
                    m("div.butt", [
                        m("button", { type: "button", onclick: add }, "Add"),
                        m("button", { type: "button", onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                        m("span#confirm")
                    ])
                ])
            }
        };
        
        
        setTimeout(()=>t.clear(), 500);
        
        //Default source for drawing.
        t.src = new VectorSource()
    
        const layer = new VectorLayer(
            { name: "BIKEWHEEL", source: t.src }
        );
        CONFIG.mb.addLayer(layer);
       
        CONFIG.mb.featureInfo.register(layer, (x)=> {
           return [
                { val: x.getId() }, 
                { val: x.description }
           ];
            
        });
        
        
        
        /*
         * Add the center point (IPP or LKP)
         */
        function addPoint(pos, ident, descr) {
            const c = ll2proj(pos);
            let feat = new ol.Feature(new ol.geom.Point(c));
            feat.setId(ident);
            feat.getGeometry().setCoordinates(c);
            const style = new ol.style.Style({
                image:
                    new ol.style.Icon( ({
                        anchor: [0.5, 0.5],
                        src: t.iconpath + "/icons/sym06.png"
                    }))
                });
            feat.setStyle(style);
            feat.description = descr;
            t.src.addFeature(feat);
            return feat;
        }
        
        
        /*
         * Add a circle
         */
        function addCircle(center, radius, style) {
            let geom = new ol.geom.Circle(center);
            let feat = new ol.Feature();
            let proj = CONFIG.mb.view.getProjection();
            geom.transform('EPSG:4326', CONFIG.mb.view.getProjection());
            geom.setRadius(radius/proj.getMetersPerUnit());
            feat.setGeometry(geom);
            feat.hide=true;
            
            feat.setStyle( ()=> {
                let pixoff = radius/CONFIG.mb.getResolution(); 
                let st = style.clone();
                if (pixoff < 10)
                    st.setStroke(null);
                if (pixoff < 35) 
                    st.setText(null); 
                else
                    st.getText().setOffsetY(pixoff); 
                return st;
            });
            
            t.src.addFeature(feat)
            return feat;
        }
        
        
        /* 
         * Draw point with rings on map
         */
        function draw(x) {           
            if (x.p25 > 0)
                x.features.push(addCircle(x.pos, x.p25*1000, getStyle('bike25') )); 
            if (x.p50 > 0)
                x.features.push(addCircle(x.pos, x.p50*1000, getStyle('bike50') )); 
            if (x.p75 > 0)
                x.features.push(addCircle(x.pos, x.p75*1000, getStyle('bike75') )); 
            if (x.p95 > 0)
                x.features.push(addCircle(x.pos, x.p95*1000, getStyle('bike95') )); 
            x.features.push( addPoint(x.pos, x.label, x.descr) );
            setTimeout(()=> CONFIG.mb.setCenter(x.pos, 100), 200);
        }
    
    
        function add() {
            if (t.pos[0]==0 && t.pos[1]==0) {
                error("Invalid position");
                return;
            }
            for (const x of t.olist)
                if (x.label == t.label()) {
                    error("Cannot add '"+x.label+"'. Already added");
                    return;
                }
            const item = {
                pos: t.pos, 
                label: t.label(),
                descr: t.descr(),
                p25: t.p25()=="" ? 0 : parseFloat(t.p25()),
                p50: t.p50()=="" ? 0 : parseFloat(t.p50()),
                p75: t.p75()=="" ? 0 : parseFloat(t.p75()),
                p95: t.p95()=="" ? 0 : parseFloat(t.p95()),
                features: []
            }
            t.olist.push(item);
            draw(item);
        }
        
        
        function update() {
            if (t.pos[0]==0 && t.pos[1]==0) {
                error("Invalid position");
                return;
            }
            /* Remove first the existing features */
            for (const i in t.olist)
                if (t.olist[i].label == t.label()) {
                    t.remove(i);
                    break;
                }
            /* Then add */
            add();
        }
        
        
        function zoomTo(x) {
            CONFIG.mb.setCenter(x.pos, 60); 
        }
        
                
        function error(txt) {
            errmsg = txt;
            setTimeout(()=>{errmsg="";m.redraw();}, 6000);
            m.redraw();
        }
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
        
        
    } /* constructor */
    
    
    
    /* Clear form fields */
    clear() {
        this.label("IPP");
        this.descr("");
        this.p25("");
        this.p50("");
        this.p75("");
        this.p95("");
        this.pos = [0,0];
        m.redraw();
    }
    
    
    /* Set position field from pixel location */
    setPosPix(pix) {
        const llpos = CONFIG.mb.pix2LonLat(pix);
        this.pos = llpos;
        m.redraw();
    }
    
    
        
    /* Remove object on map and on backend server */
    remove(i) {
        for (const f of this.olist[i].features)
            this.src.removeFeature(f);
        this.olist.splice(i,1);
        m.redraw();
    }
        
    
} /* class */


pol.widget.setFactory( "tracking.BikeWheel", {
        create: () => new pol.tracking.BikeWheel()
    });

