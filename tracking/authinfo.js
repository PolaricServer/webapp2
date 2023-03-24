/*
 Map browser based on OpenLayers 5. 
 
 Copyright (C) 2017-2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * User defined areas (in a popup window). 
 */

pol.tracking.AuthInfo = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        t.classname = "tracking.AuthInfo"; 
        t.info = {};
        t.groupList = [];  
        t.group = "DEFAULT";
        t.selGroup = "";
        t.psclient = null; 
        
        
        t.groups = {    
            view: function() {
                return m("select#group", {onchange: selectHandler }, t.groupList
                    .map( x => m("option", {value: x.ident }, x.ident) ));
            }
        }
        
        this.widget = {
            view: function() {
                let i=0;
                return m("div", [       
                    m("h1", "Authorization info"), 
                        
                    
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
                            m(t.groups), m("span#selGroup", ""+t.selGroup), nbsp, 
                        ) : null ),    
                         
                    ( t.info.userid != null ?
                        m("div.butt", [
                            m("button", { disabled: !enabled(), type: "button", onclick: update }, "Change"),
                            m("button", { type: "button", onclick: ()=> {logout();} }, "Logout"),
                        ]) : null ),
                ])
            }
        }
   

        getAuth();
        getGroups();
        
        
           
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  

        
        function enabled() {
            return (t.groupList!=null && t.groupList.length > 1)
        }
        
        
        
        function getLevel() {
            t.lvl = "";
            if (t.info.sar) t.lvl = "SAR";
            if (t.info.admin) {
                if (t.lvl != "")
                    t.lvl += ", ";
                t.lvl += "ADMIN";
            }
        }
        
        
        function getAuth() {
            CONFIG.server.GET("/authStatus" , "", 
                x => {
                    t.info = JSON.parse(x);
                    getLevel(); 
                    m.redraw();
                    setTimeout(()=>$("select#group").val(t.info.groupid).trigger("change"), 200);
                });
        }
        
        
        function selectHandler() {
            t.info.groupid = $("select#group").val();
            for (const x of t.groupList)
                if (x.ident==t.info.groupid)
                    t.selGroup = x.name;
            m.redraw();
        }
        
        
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
                            getAuth();
                            CONFIG.filt.getFilters();
                        }); 
                });
        }
        
        
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
            { t.closePopup(); CONFIG.server.logout(); }

    } /* constructor */


    onclose() { 
        if (this.psclient != null)
            CONFIG.server.pubsub.unsubscribe("auth:"+this.info.userid, this.psclient); 
        this.psclient = null;
        super.onclose();
    }

} /* class */



pol.widget.setFactory( "tracking.AuthInfo", {
        create: () => new pol.tracking.AuthInfo()
    }); 
