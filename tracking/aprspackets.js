/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
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
                            m("td", x.via),
                            m("td", x.report),
                                 
                        ])
                    }))
                )
            }
        };
        
        
        this.widget = {
            view: function() {
                return m("div#rawpackets", [       
                    m("h1", "APRS packets"),
                    m("span",t.callsign+" (last 200 packets)"),br,
                    m("div#packetresult")    
                ])
            }
        };
  
        
        function formatTime(dt) {
            const d = new Date(dt);
            return "" +
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes() +":"+
                (d.getSeconds()<10 ? "0" : "") + d.getSeconds();
        }
        
    } /* constructor */
    
    
    getPackets(ident) {
        console.assert(ident && ident != null, "Assertion failed");
        this.callsign=ident;
        m.redraw();
        if (!ident || ident==null)
            return;
        CONFIG.server.GET("hist/"+ident+"/aprs?n=200", null,
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

 

