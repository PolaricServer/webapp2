 
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

pol.tracking.HeightInfo = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
                
        t.classname = "tracking.HeightInfo"; 
        t.hinfo = {punkter:[{datakilde: "", terreng: "", x:0, y:0, z:0}]};
        t.dom = {punkter:[{x:0,y:0,z:0}]};
        
        CONFIG.get('iconpath').then( x=> {
            t.iconpath = x;
            if (t.iconpath == null)
                t.iconpath = '';
        });

        
        this.widget = {
            view: function() {
                var i=0;
                const p = t.hinfo.punkter[0];
                const xp = t.dom.punkter[0];
                
                return m("div#heightinfo", [       
                    m("h1", "Terreng/Høyde"),  
                    m("div.field", 
                        m("span.sleftlab", "Datakilde: "), p.datakilde + (p.datakilde=="dtm1" ? "/dom1": "") ),  
                    m("div.field", 
                        m("span.sleftlab", "Terreng: "), p.terreng ),  
                    m("div.field", 
                        m("span.sleftlab", (p.z<0 ? "Dybde: ":"Høyde: ")), 
                            round(p.z), " m", 
                             (round(xp.z) != 0 && round(p.z) != round(xp.z) ? 
                                " -- "+round(xp.z)+" m" : "") )
                ])
            }
        };
        
        
        function round(x) {return Math.round(x*10)/10;}
        
        
    } /* constructor */
    

    
    /* Set position field from pixel location */
    setPosPix(pix) {
        const llpos = CONFIG.mb.pix2LonLat(pix);
        this.pos = llpos;
        this.getInfo(this.pos);
        m.redraw();
    }
    
    getXInfo(pos) {
        pol.core.ajax("GET", "https://ws.geonorge.no/hoydedata/v1/datakilder/dom1/punkt?koordsys=4326&nord="+pos[1]+"&ost="+pos[0], null, 
            x => {        
               this.dom = x;
               m.redraw();
            }, 
            ()=> { console.warn("Couldn't do search on geonorge"); } 
        );
    }
    
    getInfo(pos) {
        pol.core.ajax("GET", "https://ws.geonorge.no/hoydedata/v1/punkt?koordsys=4326&nord="+pos[1]+"&ost="+pos[0], null, 
            x => {        
               this.hinfo = x;
               console.log(this.hinfo);
               if (this.hinfo.punkter[0].datakilde == "dtm1") {
                   this.dom = {punkter:[{x:0,y:0,z:0}]};
                   this.getXInfo(pos);
               }
               m.redraw();
            }, 
            ()=> { console.warn("Couldn't do search on geonorge"); } 
        );
    }
    

    
        
    
} /* class */


pol.widget.setFactory( "tracking.HeightInfo", {
        create: () => new pol.tracking.HeightInfo()
    });

