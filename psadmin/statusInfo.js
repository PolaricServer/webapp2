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
        
        this.widget = {
            view: function() {
                return m("div", [       
                    m("h1", "Status Info"),
                    m("form.status", [  
                        m("div.field", 
                            m("span.leftlab", "Server run since: "), t.data.runsince), 
                        m("div.field", 
                            m("span.leftlab", "Server version: "), t.data.version), 
                        m("div.field", 
                            m("span.leftlab", "Number of items: "), t.data.items ),
                        m("div.field", 
                            m("span.leftlab", "Own objects: "), t.data.ownobj ),
                        m("div.field", 
                            m("span.leftlab", "Clients (logged in): "), t.data.clients+" ("+t.data.loggedin+")" ),    
                        m("div.field", 
                            m("span.leftlab", "Memory used: "), toKbytes(t.data.usedmem) ),    

                        m("div.field", 
                            m("span.leftlab", "Plugin modules: "), m("div#plugins", t.data.plugins.map( x=> {
                                    return showPlugin(x);
                                }))),    
                        m("div.field", 
                            m("span.leftlab", "Channels: "), m("div#channels", t.data.channels.map( x=> {
                                    return showChannel(x);
                                }))),  
                        m("div.field", 
                            m("span.leftlab", "Remote control: "), t.data.remotectl ), 
                        m("span.errmsg", t.errmsg),
                    ])
                ])
            }
        };
        
        
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
        CONFIG.server.GET( "/system/adm/status", null, 
            st => {
                this.data = JSON.parse(st);
                m.redraw();
            },            
            x=> { 
                this.error("Cannot GET data (se browser log)", x);
            }
        );
    }
    
    onActivate() {
        this.getInfo();
    }

} /* class */




pol.widget.setFactory( "psadmin.StatusInfo", {
        create: () => new pol.psadmin.statusInfo()
    });



