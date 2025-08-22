 
/*
 Map browser based on OpenLayers. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2020-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        t.ident = m.stream("IPP");
        t.descr = m.stream("");
        t.pos = [0,0];
        t.p25 = m.stream("");
        t.p50 = m.stream("");
        t.p75 = m.stream("");
        t.p95 = m.stream("");
        t.olist = [];
                
        t.classname = "tracking.BikeWheel"; 
        
        CONFIG.get('iconpath').then( x=> {
            t.iconpath = x;
            if (t.iconpath == null)
                t.iconpath = '';
        });

        
        this.widget = {
            view: function() {
                var i=0;
                return m("div#bikeWheel", [       
                    m("h1", "Add LKP/IPP with distance rings"),  
                    
                    m("div.itemList", t.olist.map( x=> {
                        return [ m("span", [ 
                            m("img",  {src: "images/edit-delete.png", onclick: apply(_remove, i)}),
                            m("img",  {src: "images/edit.png", onclick: apply(edit, i++)}), nbsp,      
                            m("span", {onclick: apply(zoomTo, x)}, x.ident), nbsp]
                        ), " "]
                    })),     
                    m("div.errmsg", errmsg),    
                                   
                         
                    m("div.field",
                        m("span.sleftlab", "Ident: "),   
                        m(textInput, {id:"label", value: t.ident, size: 10, maxLength:15, 
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
                            m(textInput, {id: "p25", value: t.p25, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 25%", br,
                            m(textInput, {id: "p50", value: t.p50, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 50%", br,
                            m(textInput, {id: "p75", value: t.p75, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
                                m("span.km"," km"), " - 75%", br,
                            m(textInput, {id: "p95", value: t.p95, size: 5, maxlength: 6, regex: /^[0-9]+(\.[0-9]+)?$/i }),
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
        
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
                
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
        restoreFeatures();
        
        
        function restoreFeatures() {            
            if (srv != null && srv.isAuth()) 
                srv.GET("/sar/ipp", null,
                    (dt)=> {
                        const list = GETJSON(dt);
                        for (const x of list) {
                            if (x!= null) {
                                t.olist.push(x);
                                draw(x);
                            }
                        }
                    },
                    
                    (e)=> {
                        console.log("Cannot get features: "+e);
                      }
                );  
        }
        
        
        
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
            x.features = [];
            if (x.p25 > 0)
                x.features.push(addCircle(x.pos, x.p25*1000, getStyle('bike25') )); 
            if (x.p50 > 0)
                x.features.push(addCircle(x.pos, x.p50*1000, getStyle('bike50') )); 
            if (x.p75 > 0)
                x.features.push(addCircle(x.pos, x.p75*1000, getStyle('bike75') )); 
            if (x.p95 > 0)
                x.features.push(addCircle(x.pos, x.p95*1000, getStyle('bike95') )); 
            x.features.push( addPoint(x.pos, x.ident, x.descr) );   
        }
    
        function createItem() {
            return {
                pos: t.pos, 
                ident: t.ident(),
                descr: t.descr(),
                p25: t.p25()=="" ? 0 : parseFloat(t.p25()),
                p50: t.p50()=="" ? 0 : parseFloat(t.p50()),
                p75: t.p75()=="" ? 0 : parseFloat(t.p75()),
                p95: t.p95()=="" ? 0 : parseFloat(t.p95()),
            }
        }
    
        /*
         * Add a item (a IPP/LKP with distance rings */
        function add() {
            if (t.pos[0]==0 && t.pos[1]==0) {
                error("Invalid position");
                return;
            }
            for (const x of t.olist)
                if (x.ident == t.ident()) {
                    error("Cannot add '"+x.ident+"'. Already added");
                    return;
                }
            const item = createItem(); 
            
            /* Update on server if logged in */
            if (srv != null && srv.isAuth()) 
                srv.POST("sar/ipp", JSON.stringify(item), 
                    ()=> { console.log("Posted IPP/LKP: "+item.ident); },
                    (e)=> { error("Cannot post IPP/LKP: "+e); }
                );
        
            /* Update on client */
            t.olist.push(item);
            draw(item);
            setTimeout(()=> CONFIG.mb.setCenter(item.pos, 100), 200);
        }
        
        
        /*
         * Update a item
         */
        function update() {
            if (t.pos[0]==0 && t.pos[1]==0) {
                error("Invalid position");
                return;
            }

            /* Remove first the existing features on map*/
            let i = 0;
            for (i in t.olist)
                if (t.olist[i].ident == t.ident()) {
                    for (const f of t.olist[i].features)
                        t.src.removeFeature(f);
                    break;
                }
            
            const item = createItem();
            
            /* Update on server if logged in */
            if (srv != null && srv.isAuth()) 
                srv.PUT("sar/ipp/"+item.ident, JSON.stringify(item), 
                    ()=> { console.log("Updated IPP/LKP: "+item.ident); },
                    (e)=> { error("Cannot update IPP/LKP: "+e); }
                );
            
            t.olist[i]=item;
            draw(item);
        }
        
        
        function zoomTo(x) {
            CONFIG.mb.setCenter(x.pos, 60); 
        }
        
                
        /* 
         * Report error 
         */
        function error(txt) {
            console.log(txt);
            errmsg = txt;
            setTimeout(()=>{errmsg="";m.redraw();}, 6000);
            m.redraw();
        }
        
        
        /* Move item i to form for editing */
        function edit(i) {
            const x = t.olist[i]; 
            t.ident(x.ident);
            t.descr(x.descr);
            t.pos = x.pos; 
            t.p25(x.p25);
            t.p50(x.p50);
            t.p75(x.p75);
            t.p95(x.p95);
        }
    
    
        function _remove(i) {
            t.remove(i);
        }
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
        
    } /* constructor */
    

    
    
    /* Clear form fields */
    clear() {
        this.ident("IPP");
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
        /* Remove on server if logged in */
        const item = this.olist[i];
        if (srv != null && srv.isAuth()) 
            srv.DELETE("sar/ipp/"+item.ident, 
                ()=> { console.log("Deleted IPP/LKP: "+item.ident); },
                (e)=> { error("Cannot delete IPP/LKP: "+e); }
            );
        
        /* Remove features on map */
        for (const f of this.olist[i].features)
            this.src.removeFeature(f);
        this.olist.splice(i,1);
        m.redraw();
    }
        
    
} /* class */


pol.widget.setFactory( "tracking.BikeWheel", {
        create: () => new pol.tracking.BikeWheel()
    });

