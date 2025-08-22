/*
 Copyright (C) 2022-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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



pol.psadmin = pol.psadmin || {};

/**
 * Reference search (in a popup window). 
 */

pol.psadmin.statusInfo = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        t.classname = "psadmin.StatusInfo"; 
        t.data = {
            runsince:"", version:"", items:0, ownobj:0, clients:0, 
            loggedin:0, usedmem:0, plugins: [], channels: []
        }; 
        t.clients = []; 
        
        
        this.showClients = {
            view: function() {
                let i=0;
                return m("table", m("thead",  
                        m("tr", m("th", "Created"), m("th", "Client"), m("th", "M"), m("th", "In"), m("th", "Out"), m("th", "Userid")),                    
                    ),
                    m("tbody", 
                        t.clients.map( x => {
                            const d = new Date(x.created);
                            return m("tr", {class: (t.editMode && x.name===t.name() ? "selected" : null) }, [
                                m("td", {title: pol.core.Time.formatDate(d)}, pol.core.Time.formatTime(d)),
                                m("td", x.cid),
                                m("td", (x.mobile ? "M" : "")),
                                m("td.n", x.in),     
                                m("td.n", x.out),
                                m("td", x.userid),     
                            ])
                        })
                    )
                )
            }
        }
        
        
        
        
        this.widget = {
            view: function() {
                const d = new Date(t.data.runsince);
                return m("div#statusinfo", [       
                    m("h1", "Status Info"),
                    m("form.status", [  
                        m("div.field", 
                            m("span.wleftlab", "Server run since: "), 
                                pol.core.Time.formatDate(d)+" / "+pol.core.Time.formatTime(d)), 
                        m("div.field", 
                            m("span.wleftlab", "Server address: "), CONFIG.server.host), 
                        m("div.field", 
                            m("span.wleftlab", "Server callsign: "), CONFIG.server.auth.servercall), 
                        m("div.field", 
                            m("span.wleftlab", "Server version: "), t.data.version), 
                        m("div.field", 
                            m("span.wleftlab", "Number of items: "), t.data.items ),
                        m("div.field", 
                            m("span.wleftlab", "Own objects: "), t.data.ownobj ),
                        m("div.field", 
                            m("span.wleftlab", "Clients (logged in): "), t.data.clients+" ("+t.data.loggedin+")" ),    

                        m("div.field", 
                            m("span.wleftlab", "Plugin modules: "), m("div#plugins", t.data.plugins.map( x=> {
                                    return showPlugin(x);
                                }))),     
                        (t.data.remotectl != null && t.data.remotectl != "" ?
                            m("div.field", 
                                m("span.wleftlab", "Remote control: "), t.data.remotectl ):null), 
                    ]),
                    m("div#clientList"),
                    // m(showClients),
                ])
            }
        };
        
        
                
        
        /* 
         * IF user is logged out, popup will be closed
         */
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
        
        
        
        function toKbytes(x) {
            return Math.round(x / 100)/10 + " kB"; 
        }
        
        
        function showPlugin(x) {     
            let y = x;
            if (x.length > 45)
                y = x.substring(0,42)+"...";
            return m("div.plug", {title:x}, y);
        }
        
        function showChannel(x) {
            return m("div.chan", [x.ident+": "+x.name+ (x.active ? " (active)": "") ] ); 
        }
        
        
    }    
        
        
    getInfo() {
        CONFIG.server.GET( "system/adm/status", null, 
            st => {
                this.data = GETJSON(st);
                m.redraw();
            },            
            x=> { 
                console.log("Cannot GET data (se browser log)", x);
            }
        );
    }
    
    getClients() {
        CONFIG.server.GET( "system/adm/clients", null, 
            st => {
                this.clients = GETJSON(st);           
                this.clients.sort( (x,y) => (x.cid < y.cid ? -1 : (x.cid===y.cid ? 0 : 1)));
                if (this.nclients != this.clients.length)
                    setTimeout(()=> this.mountList(), 400);
                else
                    m.redraw();
                this.nclients = this.clients.length;
            },            
            x=> { 
                console.log("Cannot GET data (se browser log)", x);
            }
        );
    }
    
    onclose() {
        if (this.updates != null)
            clearInterval(this.updates);
    }

    
    onActivate() {
        this.resizable = true;
        this.getInfo();
        this.getClients();
        this.updates = setInterval( () => {
            this.getInfo();
            this.getClients();
        }, 5000);
    }

    
    mountList() {
        m.mount($("div#clientList").get(0), this.showClients);
        this.setScrollTable("#statusinfo", "div#clientList");
    }
    
    
    
} /* class */




pol.widget.setFactory( "psadmin.StatusInfo", {
        create: () => new pol.psadmin.statusInfo()
    });



