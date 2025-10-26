/*
 Copyright (C) 2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 


var pol = window.pol;


/**
 * Reference search (in a popup window). 
 */

pol.psadmin.Clients = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        
        t.classname = "psadmin.Clients"; 
        t.tlist = [];
        t.serverid = "";
        
        this.showList = {
            view: function() {
                return m("table",
                    m("thead", m("tr", [ 
                        m("th", "Userid"), m("th", "Ipaddr"), m("th", "Software"), m("th", "Verified"), 
                                 m("th", "TX"), m("th", "RX"),m("th", "Filter")])),
                    m("tbody",t.tlist.map( x => { 
                        return m("tr", [
                            m("td", x.userid),
                            m("td", x.addr),
                            m("td", x.software),
                            m("td", (x.verified ? "Yes" : "No")),
                            m("td", number(x.txpackets)), 
                            m("td", number(x.rxpackets)),
                            m("td", x.filter), 
                        ])
                    }))
                )
            }
        };
        
        
        this.widget = {
            view: function() {
                return m("div#clients", [       
                    m("h1", "APRS-IS clients"),
                    m("span","Server channel: "+t.serverid), br,
                    m("div#clientresult")    
                ])
            }
        };
        
        function number(x) {
            if (x >= 1000000)
                return Math.round(x/1000000)+"M";
            else if (x >= 10000)
                return Math.round(x/1000)+"k";
            else
                return x;
        }
        
        setInterval(()=> {if (this.serverid!=null) this.getClients(this.serverid);}, 15000);
        
    } /* constructor */
    
        

    getClients(ident) {
        console.assert(ident && ident != null, "Assertion failed");
        this.serverid=ident;
        m.redraw();
        if (!ident || ident==null)
            return;

        CONFIG.server.GET("system/adm/channels/"+ident+"/clients", null,
            x=> { 
                this.tlist = GETJSON(x); 
                /* 
                 * Mount mithril component for resulting table to #ttable div
                 * make table scrollable. 
                 */
                m.mount($("div#clientresult").get(0), this.showList);
                this.setScrollTable("div#clients", "div#clientresult");
            },
            ()=> { console.warn("Couldn't get client-list"); }
        )
    }
    
} /* class */


pol.widget.setFactory( "psadmin.Clients", {
        create:   () => new pol.psadmin.Clients(), // Instantiate 
        onRestore: null /* To be called when automatic restore */
    });

 

