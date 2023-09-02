/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.tracking.Login = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "tracking.Login";
        t.username = m.stream("");
        t.passwd = m.stream("");
        
        
        
        this.widget = {
            view: function() {
                return m("div#login", [       
                    m("h1", "Login"), 
                    m("div.field", 
                        m("span.xsleftlab", "Username:"),
                        m(textInput, { id:"username", value: t.username, size: 16, 
                            maxLength:25, regex: /.*/i })),
                    m("div.field", 
                        m("span.xsleftlab", "Password:"),
                        m(textInput, { id:"passwd", value: t.passwd, size: 16, 
                            maxLength:25, regex: /.*/i, passwd: true })),
        
                    m("div.butt", [
                        m("button", { type: "button", onclick: login }, "Login"), 
                        m("button", { type: "button", onclick: test }, "Test"),
                    ]),
                ]) 
            }
        };
        
 
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
 
        
        function test() {
            t.server.GET("hmacTest", null, 
                x => {
                    alert("authentication was successful");
                },
                x => {
                    alert("authentication failed" +
                        '\n"' + x.responseText + '"');
                } );
        }
        

        
        /* Update a user (on server) */
        function login() {

            const data = "username="+t.username()+"&password="+t.passwd();
            t.server.POSTFORM("directLogin", data, 
                x => {  
                    alert("Login successful.");
                    /*
                     * Here, we set the userid and key in the server object so 
                     * it can do Hmac based authentication. 
                     */
                    CONFIG.server.setCredentials(t.username(), x);
                    setTimeout(()=> {CONFIG.server.loginStatus();}, 1000);
                },
                x => {
                    console.log("Login failed -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Login failed" +
                        '\n"' + x.responseText + '"');
                }
            );
        }
 
    } /* constructor */

 

} /* class */




pol.widget.setFactory( "tracking.Login", {
        create: () => new pol.tracking.Login()
    }); 
