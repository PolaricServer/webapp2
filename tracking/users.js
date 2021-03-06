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

pol.tracking.Users = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "tracking.Users"; 
        t.users = [];
        t.ident = m.stream("");
        t.name = m.stream("");
        t.callsign = m.stream("");
        t.passwd = m.stream("");
        t.sar = false; 
        t.admin = false;
        
        
        /* List of users (table) */
        this.userList = {
            view: function() {
                var i=0;
                return m("table", 
                        m("tbody", t.users.map(x => {
                            return m("tr", [
                                m("td",
                                    m(removeEdit, {remove: apply(remove,i), edit: apply(edit, i++)})),
                                m("td", x.ident),   
                                m("td", (x.admin? "A": (x.sar? "S" : "")) + 
                                    (x.callsign!=null && x.callsign.length > 1 ? "H":"") ), 
                                m("td", formatTime(x.lastused)),
                                m("td", x.name ),

                            ]);
                        })
                    ));
            }
        }
        
        
        this.widget = {
            view: function() {
                return m("div#userEdit", [       
                    m("h1", "User Management"), 
                    m("div.field", 
                        m("span.xsleftlab", "Ident:"),
                        m(textInput, { id:"userId", value: t.ident, size: 16, 
                            maxLength:25, regex: /.*/i })),
                    
                    m("div.field", 
                        m("span.xsleftlab", {title: "HAM radio (APRS) callsign"}, "Callsign:"),
                        m(textInput, { id: "callsign", value: t.callsign, size: 16,
                            maxLength: 32, regex: /[A-Z0-9\-]*/i })),
                         
                    m("div.field", 
                        m("span.xsleftlab", "Name:"),
                        m(textInput, { id: "name", value: t.name, size: 25,
                            maxLength: 32, regex: /.*/i })),
                         
                    m("div.field",
                        m("span.xsleftlab", "Passwd:"),
                        m(textInput, { id: "passwd", value: t.passwd, size: 25,
                            maxLength: 32, regex: /.*/i })), 
                         
                    m("div.field", 
                        m("span.xsleftlab", "Access:"),
                        m(checkBox, {id: "acc_sar", onclick: toggleSar, checked: t.sar, 
                            title: "SAR (operator level)" }, "SAR"), nbsp, 
                        m(checkBox, {id: "acc_admin", onclick: toggleAdmin, checked: t.admin, 
                            title: "Administrator (super user level)" }, "Admin"), nbsp,  
                        m("span#hamop", 
                          (t.callsign() != null && t.callsign().length > 1  ? "(HAM radio op)" : ""))),
                         
                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                        m("button", { type: "button", onclick: add }, "Add"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                    ]),
                    
                    m("div#userList"),
                ]) 
            }
        };
        
 
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
 
        
        /* Automatic checkbox handler */
        function toggleSar() {
            t.sar = (t.sar ? false : true);
        }
        
        
        function toggleAdmin() {
            t.admin = (t.admin ? false : true);
        }
 
 
        /* Add a user (on server) */
        function add() {
            const data = {
                ident: t.ident(),
                name: t.name(),
                callsign: (t.callsign()=="" || t.callsign()==" " ? "" : t.callsign().toUpperCase()),
                passwd: (t.passwd()=="" || t.passwd()==" " ? null : t.passwd()),
                sar: t.sar,
                admin: t.admin
            };
            t.server.POST("users", JSON.stringify(data), 
                x => {
                    data.passwd = NaN;
                    t.users.push(data);
                    t.sortList();
                    t.mountList();
                },
                x => {
                    console.log("Add user -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot add user: " + t.ident()+
                        '\n"' + x.responseText + '"');
                }
            );
        }
        
        
        /* Update a user (on server) */
        function update() {
            const data = {
                name: t.name(),
                passwd: (t.passwd()=="" || t.passwd()==" " ? null : t.passwd()),
                callsign: (t.callsign()=="" || t.callsign()==" " ? "" : t.callsign().toUpperCase()),
                sar: t.sar,
                admin: t.admin
            };

            t.server.PUT("users/"+t.ident(), JSON.stringify(data), 
                x => {
                    for (i in t.users)
                        if (t.users[i].ident==t.ident()) {
                            t.users[i].name = data.name; 
                            t.users[i].callsign = data.callsign;
                            t.users[i].sar = data.sar;
                            t.users[i].admin = data.admin;
                            break;
                        }
                    t.mountList();
                },
                x => {
                    console.log("Update user -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot update user: " + t.ident()+
                        '\n"' + x.responseText + '"');
                }
            );
        }
        
        
        /* Remove a user (on server) */
        function remove(i) {
            t.server.DELETE("users/"+t.users[i].ident, x => {
                console.log("Removed user: "+t.users[i].ident);
                t.users.splice(i, 1);
                t.mountList();
            } );
        }
    

        /* Copy user attributes to form for editing */
        function edit(i) { 
            const u = t.users[i]; 
            t.ident(u.ident);
            t.name(u.name);
            t.callsign(u.callsign);
            t.passwd("");
            t.sar = u.sar;
            t.admin = u.admin;
            m.redraw();
        }
    
        
        
        // FIXME Move to uiSupport.js 
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        function formatTime(dt) {
            if (dt==null)
                return "";
            const d = new Date(dt);
            return "" +
                d.getDate()+ " "+months[d.getMonth()]+ " " +
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
        }
 
    } /* constructor */

    
    /* Clear form */
    clear() {
        this.ident("");
        this.name("");
        this.passwd("");
        this.sar = false; 
        this.admin = false;
        m.redraw();
    }
    
        
    /* Get list of users from server */
    getUsers() {
        CONFIG.server.GET("users", "", x => { 
            this.users = JSON.parse(x);    
            this.sortList();
            setTimeout(()=> this.mountList(), 500);
        } );
    }
            
    /* Mount or remout the table that represents the list of users 
     * make it scrollable. 
     */        
    mountList() {
        m.mount($("div#userList").get(0), this.userList);
        this.setScrollTable("#userEdit", "div#userList");
    }
    
            
            
    /* Sort user list */        
    sortList() {
        this.users.sort((a,b)=> { return (a.ident < b.ident ? -1 : 1); });
    }
        
    
    onActivate() {
        this.getUsers();
    }
    

} /* class */




pol.widget.setFactory( "tracking.Users", {
        create: () => new pol.tracking.Users()
    }); 
