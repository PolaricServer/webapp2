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
 * Login (in a popup window).
 * If logged in (a valid key is received from the server), it will show login information.  
 */

pol.tracking.Login = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this; 
        t.classname = "tracking.Login";
        t.username = m.stream("");
        t.passwd = m.stream("");
        t.errmsg = ""; 
        
        /* Authinfo stuff */
        t.info = {};
        t.groupList = [];  
        t.group = "DEFAULT";
        t.selGroup = "";
        t.psclient = null; 
        
        
        
        const loginWidget = {
            view: function() {
                return m("div#login", [
                    m("h1", "Login"), 
                    (t.errmsg != "" ? m("div#errmsg", t.errmsg) : null),
                    m("div.field", 
                        m("span.sleftlab", "Username:"),
                        m(textInput, { id:"username", value: t.username, size: 16, 
                            maxLength:25, regex: /.*/i })),
                    m("div.field", 
                        m("span.sleftlab", "Password:"),
                        m(textInput, { id:"passwd", value: t.passwd, size: 16, 
                            maxLength:25, regex: /.*/i, passwd: true })),
        
                    m("div.butt", [
                        m("button", { type: "button", onclick: login }, "Login"), 
                    ]),
                ]) 
            }
        };
        
        
        const groups = {    
            view: function() {
                return m("select#group", {onchange: selectHandler }, t.groupList
                    .map( x => m("option", {value: x.ident }, x.ident) ));
            }
        }
        
        
        const authInfo = {
            view: function() {
                let i=0;
                return m("div", [       
                    m("h1", "Logged in"), 
                        
                    m("div.field", 
                        m("span.sleftlab", "Server:"),
                        m("span", t.info.servercall)
                    ),
                    
                    m("div.field", 
                        m("span.sleftlab", "User id:"),
                        m("span", (t.info.userid != null ? t.info.userid : "(not logged in)"))
                    ),
                    (t.lvl != "" ? 
                        m("div.field", 
                            m("span.sleftlab", "Auth level:"),
                            m("span", t.lvl)
                        ) : null),
                    ( t.info.callsign != null && t.info.callsign != "" ? 
                        m("div.field", 
                            m("span.sleftlab", "Callsign:"),
                            m("span", t.info.callsign)
                        ) : null ),               
                         
                    ( t.info.userid != null ? 
                        m("div.field", 
                            m("span.sleftlab", "Role:"),
                            m(groups), m("span#selGroup", ""+t.selGroup), nbsp, 
                        ) : null ),    
                         
                    ( t.info.userid != null ?
                        m("div.butt", [
                            m("button", { disabled: !enabled(), type: "button", onclick: update }, "Change"),
                            m("button", { type: "button", onclick: ()=> {logout();} }, "Logout"),
                        ]) : null ),
                ])
            }
        }
        
        
        t.widget = {
            view: function() {
                return (isLoggedIn() ? m(authInfo) : m(loginWidget) );
            }
        }
        
        
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
 


        function isLoggedIn() {
            return CONFIG.server.isAuth();
        }

        
        /* 
         * Attempt a login. Send username and password to server (from login form)
         * and if successful, get the secret key in return.
         * 
         * Remember: Always use HTTPS when using this!!. 
         */
        function login() {

            const data = "username="+t.username()+"&password="+t.passwd();
            CONFIG.server.POSTFORM("directLogin", data, 
                x => {  
                    /*
                     * Here, we set the userid and key in the server object so 
                     * it can do Hmac based authentication. 
                     */
                    CONFIG.server.setCredentials(t.username(), x)
                        .then( ()=> {
                            CONFIG.server.loginStatus();
                            getAuth();         
                            getGroups();
                            // FIXME: This will generate two requests to /authStatus
                        });
                },
                (xhr, st, err) => {
                    console.log("Login failed -> "+st+" ("+err+")");
                    errmsg("Login failed (check username/password)");
                }
            );
        }
    
        
        
        function enabled() {
            return (t.groupList!=null && t.groupList.length > 1)
        }
        
        
        /*
         * Show login error message for 10 seconds
         */
        function errmsg(x) {
            t.errmsg = x; 
            setTimeout(()=> { t.errmsg = ""; m.redraw(); }, 10000);
            m.redraw();
        }
        
        
        /* 
         * Get authorization level. (SAR or ADMIN)
         */
        function getLevel() {
            t.lvl = "";
            if (t.info.sar) t.lvl = "SAR";
            if (t.info.admin) {
                if (t.lvl != "")
                    t.lvl += ", ";
                t.lvl += "ADMIN";
            }
        }
        
        
        /*
         * Get authorization information from server
         */
        function getAuth() {
            CONFIG.server.GET("/authStatus" , "", 
                x => {
                    t.info = JSON.parse(x);
                    getLevel(); 
                    m.redraw();
                    setTimeout(()=>$("select#group").val(t.info.groupid).trigger("change"), 300);
                    m.redraw();
                });
        }
        
        
        /*
         * Hanler that is called when a group is selected by user
         */
        function selectHandler() {
            t.info.groupid = $("select#group").val();
            for (const x of t.groupList)
                if (x.ident==t.info.groupid)
                    t.selGroup = x.name;
            m.redraw();
        }
        
        
        /*
         * Get available groups (possible roles) from server. 
         */
        function getGroups() {
            CONFIG.server.GET("/groups" , "", 
                x => {
                    let grps = JSON.parse(x);
                    for (x of grps)
                        if (x.avail)
                            t.groupList.push(x);
                    m.redraw();

                    if (t.psclient == null) 
                        t.psclient = CONFIG.server.pubsub.subscribe("auth:"+t.info.userid, x => {
                            CONFIG.filt.getFilters();
                        }); 
                });
        }
        
        
        /* 
         * Update the role (group). 
         * FIXME: We need a different approach to this since we don't store this on the server session 
         * anymore. We must send info about role with each request (if a temporary role is set). 
         */
        function update() {
            const data = {group: t.info.groupid};
            CONFIG.server.PUT("/mygroup", JSON.stringify(data), 
                x => {
                    alert("Role changed to: "+t.info.groupid);
                    console.log("Role changed to: ", t.info.groupid);
                    CONFIG.filt.getFilters();
                },
                x => {
                    console.log("Change role -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot change role: " + t.info.groupid+
                        '\n"' + x.responseText + '"');
                }
            );
            
            
        }
        
        
        function logout() 
            { CONFIG.server.clearAuth(); m.redraw(); }
            
            
        getAuth();
        getGroups();
        
    } /* constructor */

    
    onclose() { 
        if (this.psclient != null)
            CONFIG.server.pubsub.unsubscribe("auth:"+this.info.userid, this.psclient); 
        this.psclient = null;
        super.onclose();
    }

} /* class */




pol.widget.setFactory( "tracking.Login", {
        create: () => new pol.tracking.Login()
    }); 