/*
 Map browser based on OpenLayers 5. Tracking. 
 Server config (igate, etc..)
 
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
 

pol.psadmin = pol.psadmin || {};

/**
 * Reference search (in a popup window). 
 */

pol.psadmin.ServerConfig = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "psadmin.ServerConfig"; 
        t.mycall = m.stream("");
        t.igate_range = m.stream("");
        t.igate_path = m.stream("");
        t.msg_path = m.stream("");
        t.obj_path = m.stream("");
        t.msg_alwaysrf = m.stream("");
        t.rctl_range = m.stream("");
        t.rctl_server = m.stream("");
        t.rctl_key = m.stream("");
        
        t.igate_on = false;
        t.rfgate_allow = false;
        t.obj_rfgate = false;
        t.remotectl_on = false;
        
        
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
                
        
        
        this.widget = {
            view: function() {
                return m("div#serverConfig", [       
                    m("h1", "Polaric-APRSD Server Config"), 
                    
                    (t.errmsg != null ? m("div#errmsg", t.errmsg) : null),
                    (t.successmsg != null ? m("div#successmsg", t.successmsg) : null),
                         
                    m("div.field", 
                        m("span.wleftlab", "Callsign:"), 
                        m(textInput, { id:"mycall", value: t.mycall, size: 10, 
                            maxLength:16, regex: /[A-Z0-9\-]*/i })), br, 
                         
                    m("div.field", 
                        m("span.wleftlab", "Igate:"),
                        m(checkBox, {id: "rfgate_allow", onclick: toggleIgate, checked: t.rfgate_on, 
                            title: "RF/Internet gateway (igate)" }, "Activate") ),    
                                        
                    m("div.field", 
                        m("span.wleftlab", "Igating to RF:"),
                        m(checkBox, {id: "rfgate_allow", onclick: toggleRfgate, checked: t.rfgate_allow, 
                            title: "Allow igating to RF" }, "Activate"), nbsp,  
                        m(checkBox, {id: "obj_rfgate", onclick: toggleObjRfgate, checked: t.obj_rfgate, 
                            title: "Allow igating to RF for objects" }, "RF igating for object") ),     
                         
                     m("div.field", 
                        m("span.wleftlab", "Range objects:"),
                        m(textInput, { id:"igate_range", value: t.igate_range, size: 6, 
                            maxLength:6, regex: /0-9]*/i })),      
                    
                    m("div.field", 
                        m("span.wleftlab", "Igate digi path:"),
                        m(textInput, { id:"ig_digipath", value: t.igate_path, size: 25, 
                            maxLength:32, regex: /a-zA-Z0-9\,\-]*/i })),   
                    m("div.field", 
                        m("span.wleftlab", "Messages digi path:"),
                        m(textInput, { id:"ig_msgpath", value: t.msg_path, size: 25, 
                            maxLength:32, regex: /a-zA-Z0-9\,\-]*/i })),  
                    m("div.field", 
                        m("span.wleftlab", "Objects digi path:"),
                        m(textInput, { id:"ig_objpath", value: t.obj_path, size: 25, 
                            maxLength:32, regex: /a-zA-Z0-9\,\-]*/i })), 
                    m("div.field", 
                        m("span.wleftlab", 
                            {title: "Messages with DEST matching this expression will be sent on RF"},
                            "Always send on RF:"),
                        m(textInput, { id:"ig_alwaysrf", value: t.msg_alwaysrf, size: 25, 
                            maxLength:32, regex: /.*/i })), br, 
                         
                    m("div.field", 
                        m("span.wleftlab", "Remote control:"),
                        m(checkBox, {id: "remotectl_on", onclick: toggleRemotectl, checked: t.remotectl_on, 
                            title: "Coordinate with other server-instances over APRS" }, "Activated") ),         
                    m("div.field", 
                        m("span.wleftlab", 
                           {title: "Radius (km) in which we want to receive item-updates"}, 
                           "Range updates:"),
                        m(textInput, { id:"rctl_range", value: t.rctl_range, size: 6, 
                            maxLength:6, regex: /0-9]*/i })),  
                    m("div.field", 
                        m("span.wleftlab", 
                           { title: "Callsign of another Polaric Server instance" }, "RC server:"), 
                        m(textInput, { id:"rctl_server", value: t.rctl_server, size: 10, 
                            maxLength:16, regex: /a-zA-Z0-9\-]*/i })),   
                    m("div.field", 
                        m("span.wleftlab", "Authentication key:"),
                        m(textInput, { id:"rctl_key", value: t.rctl_key, size: 25, 
                            maxLength:64, regex: /.*/i })),  
                         
                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                    ]),
                ]) 
            }
        };
        

        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
 
        
        /* Automatic checkbox handler */
        function toggleIgate() {
            t.igate_on = (t.igate_on ? false : true);
        }
        
        
        function toggleRfgate() {
            t.rfgate_allow = (t.rfgate_allow ? false : true);
        }
 
        
        function toggleObjRfgate() {
            t.obj_rfgate = (t.obj_rfgate ? false : true);
        }
                
        function toggleRemotectl() {
            t.remotectl_on = (t.remotectl_on ? false : true);
        }
        
        
        
        /* Update a user (on server) */
        function update() {
            const data = {
                mycall: t.mycall(),
                always_rf: t.msg_alwaysrf(),
                authkey: t.rctl_key(),
                igate: t.igate_on,
                objigate: t.obj_rfgate,
                path_igate: t.igate_path(),
                path_messages: t.msg_path(),
                path_objects: t.obj_path(),
                radius: parseInt(t.igate_range()),
                rc_server: t.rctl_server(),
                remote_radius: parseInt(t.rctl_range()),
                remotectl: t.remotectl_on,
                rfigate: t.rfgate_allow
            };

            t.server.PUT("system/adm/server", JSON.stringify(data), 
                x => {
                    console.log("Update succeeded");
                    t.successMsg("Update succeeded. Restart of aprsd may be necessary", 10000);
                    m.redraw();
                    
                },
                (xhr, st, err) => {
                    console.log("Server update failed: ", st, err);
                    t.errMsg("Server update failed: "+err, 10000);
                }
            );
        }
    } /* constructor */

    
    /* Clear form */
    clear() {
    }
    
        
    /* Get list of users from server */
    getConfig() {
        CONFIG.server.GET("system/adm/server", "", x => { 
            const conf = JSON.parse(x);
            const t = this;
            t.mycall(conf.mycall); 
            t.igate_range(""+conf.radius);
            t.igate_path(conf.path_igate);
            t.msg_path(conf.path_messages);
            t.obj_path(conf.path_objects);
            t.msg_alwaysrf(conf.always_rf);
            t.rctl_range(""+conf.remote_radius);
            t.rctl_server(conf.rc_server);
            t.rctl_key(conf.authkey);
            t.igate_on = conf.igate;
            t.rfgate_allow = conf.rfigate;
            t.obj_rfgate = conf.objigate;
            t.remotectl_on = conf.remotectl; 
            m.redraw();
        } );
    }
            

        
    
    onActivate() {
       this.getConfig();
    }
    

} /* class */




pol.widget.setFactory( "psadmin.ServerConfig", {
        create: () => new pol.psadmin.ServerConfig()
    }); 
