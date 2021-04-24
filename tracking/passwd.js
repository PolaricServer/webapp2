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

pol.tracking.Passwd = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "tracking.Passwd"; 
        t.passwd = m.stream("");
        t.passwd2 = m.stream("");
        
        
        
        this.widget = {
            view: function() {
                return m("div#pwdEdit", [       
                    m("h1", "Change your password"), 
                    m("div.field", 
                        m("span.xsleftlab", "Password:"),
                        m(textInput, { id:"passwd", value: t.passwd, size: 16, 
                            maxLength:25, regex: /.*/i, passwd: true })),
                    
                    m("div.field", 
                        m("span.xsleftlab", "Repeat it:"),
                        m(textInput, { id: "passwd2", value: t.passwd2, size: 16,
                            maxLength: 32, regex: /.*/i, passwd: true })),
        
                         
                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                    ]),
                ]) 
            }
        };
        
 
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
 
        
        
        /* Update a user (on server) */
        function update() {
            if (t.passwd() != t.passwd2()) {
                alert("Passwords do not match.");
                return; 
            }
            const data = {
                passwd: t.passwd()
            };

            t.server.PUT("mypasswd", JSON.stringify(data), 
                x => {  
                    alert("Password updated ok.");
                },
                x => {
                    console.log("Update passwd -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot update password." +
                        '\n"' + x.responseText + '"');
                }
            );
        }
 
    } /* constructor */

 

} /* class */




pol.widget.setFactory( "tracking.Passwd", {
        create: () => new pol.tracking.Passwd()
    }); 
