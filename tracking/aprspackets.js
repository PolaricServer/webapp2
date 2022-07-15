/*
 Map browser based on OpenLayers. Tracking. 
 Search historic data on APRS packets on server.  
 
 Copyright (C) 2019-2022 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.tracking.AprsPackets = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        
        t.classname = "tracking.AprsPackets"; 
        t.tlist = [];
        t.callsign = "";
        t.n = 200;
        
        this.showList = {
            view: function() {
                return m("table",
                    m("thead", m("tr", [ 
                        m("th", "Channel"), m("th", "Time"), m("th", "Dest"), m("th", "Path"), m("th", "Report")])),
                    m("tbody",t.tlist.map( x => { 
                        return m("tr", [
                            m("td", x.source),
                            m("td", {title: x.time}, formatTime(x.time)),
                            m("td", x.to),
                            m("td", fixPath(x.via)),
                            m("td", x.report),
                                 
                        ])
                    }))
                )
            }
        };
        
        
        this.widget = {
            view: function() {
                var tsearch = "";
                if (t.tfrom)
                    tsearch += " From: "+t.tfrom;
                if (t.at)
                    tsearch += " To: "+t.at;
                if (!t.tfrom && !t.at)
                    tsearch = " Last "+t.n+" packets";
                
                return m("div#rawpackets", [       
                    m("h1", "APRS packets"),
                    m("span",t.callsign+" -"+tsearch),br,
                    m("div#packetresult")    
                ])
            }
        };
  
        
        t.days = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        
        
        function formatTime(dt) {
            const d = new Date(dt);
            return "" +
                (d.getDate()+1 + " "+t.days[d.getMonth()]+" ")+
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes() +":"+
                (d.getSeconds()<10 ? "0" : "") + d.getSeconds();
        }
        
        
        function fixPath(pt) {
            const pp = pt.split(/qA/);
            const pp1 = pp[0].split("*");
            const ipath = m("span.ipath", "qA"+pp[1]);
            
            if (pp1.length == 2)
                return m("span", [m("span.usedpath", pp1[0]+'*'), pp1[1], ipath]);
            else
                return m("span", [pp[0]+" ", ipath]);
        }
        
        
    } /* constructor */
    
    
    getPackets(ident, n, at, tfrom) {
        console.assert(ident && ident != null, "Assertion failed");
        this.callsign=ident;
        if (!n) this.n = 500; else this.n = n;
        this.at = at;
        this.tfrom = tfrom;
        var tsearch = ""; 
        if (this.at) tsearch += "&tto="+this.at;
        if (this.tfrom) tsearch += "&tfrom="+this.tfrom;
        m.redraw();
        if (!ident || ident==null)
            return;

        CONFIG.server.GET("hist/"+ident+"/aprs?n="+this.n+tsearch, null,
            x=> { 
                this.tlist = JSON.parse(x); 
                /* 
                 * Mount mithril component for resulting table to #ttable div
                 * make table scrollable. 
                 */
                m.mount($("div#packetresult").get(0), this.showList);
                this.setScrollTable("div#rawpackets", "div#packetresult");
            },
            ()=> { console.warn("Couldn't get packet-list"); }
        )
    }
    
} /* class */


pol.widget.setFactory( "tracking.AprsPackets", {
        create:   () => new pol.tracking.AprsPackets(), // Instantiate 
        onRestore: NaN /* To be called when automatic restore */
    });

 

