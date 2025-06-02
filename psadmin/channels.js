/*
 Map browser based on OpenLayers. System admin. 
 Channel management.  
 
 Copyright (C) 2023-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.psadmin.Channels = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        
        t.editMode = false; 
        t.clist = [];  // Channel list
        t.rclist = []; // Channels under a router
        t.rcfilter = m.stream("");
        t.chanSelect = "";
        
        t.classname = "psadmin.Channels"; 
        t.type = "APRSIS";
        t.clearAllVars();
        t.typelist = [
            {label: "APRSIS"},
            {label: "APRSIS-SRV"},
            {label: "KISS"},
            {label: "TCPKISS"},
            {label: "TNC2"},
            {label: "ROUTER"}
        ];
        
        
        /* Select Channel type */
        const typeSelect = {
            view: function() {
                if (t.editMode && t.ch != null) 
                    return m("span", t.ch.specific.type); 
                else
                    return m("span.ctypeselect", [
                    m(select, {
                        id: "ctypeSelect", 
                        onchange: onTypeSelect, 
                        list: t.typelist
                    })
                ])
            }
        }
        
        const chanSelect = {
            view: function() {
                let lst = [];
                let x;
                for (x of t.clist)
                    if (x.specific.type == 'APRSIS' || x.specific.type == 'APRSIS-SRV') 
                        lst.push({label: x.name});
                return m(select, {
                    id: "chanSelect", 
                    list: lst
                })
            }
        }
        
        
        
        
        /* Show list of channels */
        const chanList = {
            view: function() {
                let i=0;
                return m("table.myChannels", m("tbody", t.clist.map( x=> {
                        return m("tr", {class: (t.editMode && x.name===t.name() ? "selected" : null) }, [
                            m("td", 
                              m(removeEdit, {remove: apply(remove,i), edit: apply(edit, i++)})),
                            m("td.flags", flags(x)),
                            m("td", (x.generic.inRouter ? m("img",{src:"images/16px/router.png", title: "Via router"}) 
                                            : (x.specific.type==="ROUTER" ? m("img",{src:"images/16px/router2.png"}) : null)) ),
                            m("td", x.specific.type),
                            m("td.name", x.name), 
                            m("td", ( x.generic.state != 'OFF' ? 
                                    ( x.generic.state === 'RUNNING' ? m("img", {src:"images/16px/ok.png"}) 
                                        :  ( x.generic.state === 'FAILED' ? m("img", {src:"images/16px/warn.png", title: "Failed"}) 
                                                  : m("img", {src:"images/16px/maybe.png", title: "trying..."} ) )) : null )), 
                        ])
                    })
                ))
            }
        }
        
        /* Statistics */
        const stats_aprs = {
            view: function() {
                return m("div#stats", [
                    m("div.field", 
                        m("span.lleftlab", "Traffic in:"),
                        m("span", t.ch.specific.heardpackets )), 
                    m("div.field", 
                        m("span.lleftlab", "Traffic out:"),
                        m("span", t.ch.specific.sentpackets )), 
                    (t.type === "APRSIS-SRV" ? 
                        m("div.field", 
                          m("span.lleftlab", "Clients:"),
                          m("span", t.ch.specific.nclients ),nbsp, nbsp,
                          m("span.link_id", {onclick: showClients}, "(show)")) : null),
                ])
            }
        }
        
        
        const stats_ais = {
            view: function() {
                return m("div#stats", [
                    m("div.field", 
                    m("span.lleftlab", "AIS packets:"),
                        m("span", t.ch.specific.messages )), 
                    m("div.field", 
                        m("span.lleftlab", "Vessels:"),
                        m("span", t.ch.specific.vessels )), 
                ])
            }
        }
        
        
        const stats = {
            view: function() {
                return (t.type === "AIS-TCP" ? m(stats_ais) : m(stats_aprs));
            }
        }
        
        
        /* Show router connected channels each with a text input field for the filter spec. */
        const routerChannels = {
            view: function() {
                return m("div.rChannels", [t.rclist.map( x=> {
                        return m("div.field", 
                            m("span.lleftlab", "Filter '"+x.name+"' :"), 
                            m(textInput, { id:"filt"+x.name, value: x.filter, size: 29, 
                                maxLength:64, regex: /.*/i }));
                    }), 
                    
                    m("div.field", 
                        m("span.lleftlab", "Connect chan:"),                                
                        m(chanSelect), 
                        m("span.add", {title: "Add connected channel", onclick: addRouterChan}, "+")
                    )
                ])
            }
        }
        
        
        
        /* Config specific to chennel type */
        const config = {
            view: function() {
                if (t.type === 'KISS' || t.type === 'TNC2')
                    return m("div#config", [ 
                    m("div.field", 
                        m("span.lleftlab", "Channel:"),
                        m(checkBox, {id: "activated", onclick: toggleAct, checked: t.activated}, 
                            "Activate"), 
                        m(checkBox, {id: "activated", onclick: togglePrim, checked: t.primary}, 
                            "Primary"), 
                      
                    ),
                    m("div.field", 
                        m("span.lleftlab", "Serial port:"),
                        m(textInput, { id:"serport", value: t.serport, size: 15, 
                            maxLength:32, regex: /[a-zA-Z0-9\-\.\/]*/i })), 
                    m("div.field", 
                        m("span.lleftlab", "Baud:"),
                        m(textInput, { id:"baud", value: t.baud, size: 8, 
                            maxLength:10, regex: /[0-9]*/i })),  
                    (t.type === 'KISS' ? 
                        m("div.field", 
                        m("span.lleftlab", "KISS port:"),
                        m(textInput, { id:"kissport", value: t.kissport, size: 3, 
                            maxLength:3, regex: /[0-9]*/i })) : null), 
                    ]);
                    
                else if (t.type === 'TCPKISS' || t.type === 'AIS-TCP')
                    return m("div#config", [ 
                    m("div.field", 
                        m("span.lleftlab", "Channel:"),
                        m(checkBox, {id: "activated", onclick: toggleAct, checked: t.activated}, 
                            "Activate"),            
                        m(checkBox, {id: "activated", onclick: togglePrim, checked: t.primary}, 
                            "Primary"), ),
                    m("div.field", 
                        m("span.lleftlab", "Server addr:"),
                        m(textInput, { id:"host", value: t.host, size: 15, 
                            maxLength:32, regex: /[a-zA-Z0-9\-\.]*/i })), 
                    m("div.field", 
                        m("span.lleftlab", "Server port:"),
                        m(textInput, { id:"port", value: t.port, size: 6, 
                            maxLength:6, regex: /[0-9]*/i })),  
                    (t.type !== 'AIS-TCP' ? 
                        m("div.field", 
                            m("span.lleftlab", "KISS port:"),
                            m(textInput, { id:"kissport", value: t.kissport, size: 3, 
                                maxLength:3, regex: /[0-9]*/i })) : null), 
                    ]);
                
                
                else if (t.type === 'APRSIS-SRV')
                    return m("div#config", [ 
                    m("div.field", 
                        m("span.lleftlab", "Channel:"),
                        m(checkBox, {id: "activated", onclick: toggleAct, checked: t.activated}, 
                            "Activate"),                 
                        m(checkBox, {id: "activated", onclick: togglePrim, checked: t.primary}, 
                            "Primary"), ),
                    m("div.field", 
                        m("span.lleftlab", "Listen port:"),
                        m(textInput, { id:"port", value: t.port, size: 6, 
                            maxLength:6, regex: /[0-9]*/i })),  
                    m("div.field", 
                            m("span.lleftlab", "Input filter:"),
                            m(textInput, { id:"filter", value: t.filter, size: 30, 
                                maxLength:64, regex: /.*/i })), 
                    m("div.field", 
                            m("span.lleftlab", "Default filter:"),
                            m(textInput, { id:"dfilter", value: t.dfilter, size: 30, 
                                maxLength:64, regex: /.*/i })), 
                    ]);
                    
                    
                else if (t.type === 'ROUTER')
                    return m("div#config", [ 
                    m("div.field", 
                        m("span.lleftlab", "Channel:"),
                        m(checkBox, {id: "activated", onclick: toggleAct, checked: t.activated}, 
                            "Activate"),                 
                        m(checkBox, {id: "activated", onclick: togglePrim, checked: t.primary}, 
                            "Primary"), ),
                        m(routerChannels)
                    ]);
                
                
                else  // APRSIS    
                    return m("div#config", [ 
                        m("div.field", 
                            m("span.lleftlab", "Channel:"),
                            m(checkBox, {id: "activated", onclick: toggleAct, checked: t.activated}, 
                                "Activate"),                 
                            m(checkBox, {id: "activated", onclick: togglePrim, checked: t.primary}, 
                                "Primary"), ),
                        m("div.field", 
                            m("span.lleftlab", "Server addr:"),
                            m(textInput, { id:"host", value: t.host, size: 15, 
                                maxLength:32, regex: /[a-zA-Z0-9\-\.]*/i })), 
                        m("div.field", 
                            m("span.lleftlab", "Server port:"),
                            m(textInput, { id:"port", value: t.port, size: 6, 
                                maxLength:6, regex: /[0-9]*/i })),  
                        m("div.field", 
                            m("span.lleftlab", "Passcode:"),
                            m(textInput, { id:"passcode", value: t.passcode, size: 6, 
                                maxLength:6, regex: /[0-9]*/i })),    
                        m("div.field", 
                            m("span.lleftlab", "Filter:"),
                            m(textInput, { id:"filter", value: t.filter, size: 29, 
                                maxLength:64, regex: /.*/i })), 
                    ])
            }
        }
        
        
        this.widget = {
            view: function() {
                var i=0;
                return m("div#channels", [       
                    m("h1", "Data Channels Config"),  
                    m("div#chanList", m(chanList)),
                                        
                    (t.errmsg != null ? m("div#errmsg", t.errmsg) : null),
                    (t.successmsg != null ? m("div#successmsg", t.successmsg) : null),
                         
                    m("div.field", 
                        m("span.lleftlab", "Name:"),
                        (!t.editMode || t.ch == null ? m(textInput, { id:"name", value: t.name, size: 15, 
                                         maxLength:32, regex: /[a-zA-Z0-9\-\.]*/i }) : m("span", t.ch.name))), 
                    
                    m("div.field", 
                        m("span.lleftlab", "Type:"),
                        m(typeSelect) ), 
                         
                    (t.ch != null ? 
                        m("div.field", 
                            m("span.lleftlab", "State:"),
                            m("span", t.ch.generic.state ) ) : null), 
                         
                    (t.editMode && t.ch != null? 
                        m(stats) : null), 
                    
                    m(config),
                    
                    (t.type != 'ROUTER' ? 
                        m("div.field", 
                            m("span.lleftlab", "Visibility:"),
                            m(checkBox, {id: "loggedinonly", onclick: toggleVis, checked: t.loggedinonly}, 
                                "Only for logged in users")) : null),
                    (t.type != 'ROUTER' ? 
                        m("div.field", 
                            m("span.lleftlab", "Tag:"),
                            m(textInput, { id:"tag", value: t.tag, size: 15, 
                                maxLength:32, regex: /[a-zA-Z0-9\-\.]*/i })) : null), 
                         
                    m("div.butt", [
                        m("button", { type: "button", disabled: !addMode(), onclick: add }, "Add"),
                        m("button", { type: "button", disabled: !updateMode(),  onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "New"),
                    ])
                ])
            }
        };
        

        if (CONFIG.server.hasService('ais'))
            t.typelist.push( {label: "AIS-TCP"});
        
        
        /* 
         * IF user is logged out, popup will be closed
         */
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
        
        
        function flags(ch) {
            let flags=""; 
            if (ch.isaprs) flags+="a"; else flags+="-";
            if (ch.isrf) flags+="r"; else flags+="-";
            if (ch.rfchan || ch.inetchan) flags+='P'; else flags+="-";
            return flags;
        }
        
        
        function toggleAct() {
            t.activated = (t.activated ? false : true);
        }
        
        
        function toggleVis() {
            t.loggedinonly = (t.loggedinonly ? false : true);
        }
        
        
        function togglePrim() {
            t.primary = (t.primary ? false : true);
        }
        
        
        
        function onTypeSelect() {
            const typ = $('#ctypeSelect').val();
            t.type = typ; 
            m.redraw();
        }
        

        
        function addRouterChan() {
            const sel = $('#chanSelect').val();
            t.rclist.push({name: sel, filter: m.stream("*")});
        }

        
        
        /* Load info about channel and enter edit mode */
        function edit(i) {
           const ch = t.clist[i];
           t.name("");
           t.name(ch.name);
           m.redraw();
           
           /* At this point the type is set and we can load rest of the
            * information */
           t.getChannel(ch.name);
           t.editMode = true;
           
           if (t.chanUpd != null)
               clearInterval(t.chanUpd);
           t.chanUpd = setInterval(()=> t.getChannel(ch.name, true), 10000);
        }
                
        
        /* Add a channel (to server) */
        function add() {
            let ch = {
                active: t.activated,
                name: t.name(),
                generic: {
                    restricted: t.loggedinonly,
                    state: "OFF",
                    tag: ""
                }
            };
            if (t.type==='KISS')
                ch.specific = { port: t.serport(), baud: parseInt(t.baud()), kissport: parseInt(t.kissport()) };
            else if (t.type==='TCPKISS')
                ch.specific = { host: t.host(), port: parseInt(t.port()), kissport: parseInt(t.kissport()) };
            else if (t.type==='TNC2')
                ch.specific = { port: t.serport(), baud: parseInt(t.baud()) };
            else if (t.type==='APRSIS')
                ch.specific = { host: t.host(), port: parseInt(t.port()), 
                                pass: parseInt(t.passcode()), filter: t.filter() };
            else if (t.type==='APRSIS-SRV')
                ch.specific = { port: parseInt(t.port()), defaultfilt: t.dfilter() };
            else if (t.type==='AIS-TCP')
                ch.specific = { host: t.host(), port: parseInt(t.port()) };
            else if (t.type==='ROUTER')
                ch.specific = { channels: getRouterChannels() };  
            
            ch.specific.type = t.type;
            
            /* Add it to server */
            srv.POST("system/adm/channels", JSON.stringify(ch), 
                    ()=> {
                        console.log("Channel added: "+t.name());
                        t.successMsg("Channel added", 10000);
                        t.getObjects() 
                    }, 
                    (xhr, st, err) => { 
                        console.warn("Couldn't add channel: ", t.name(), errmsg);
                        t.errMsg("Couldn't add channel", 10000); 
                    }
                ); 
            
        }
                 
                 
                 
        function remove(i) {
             const ch = t.clist[i];
             t.remove(ch.name);
        }

        
        function addMode() {
            return !t.editMode;
        }
        
        
        function updateMode() {
            return t.editMode;
        }
        
        
        /* Update object on backend (on server) */
        function update() {
            t.ch.active = t.activated;
            t.ch.generic.restricted = t.loggedinonly;
            t.ch.generic.tag = t.tag();
            
            /* Selection of primary channels for RF and internet */
            if (t.ch.isaprs) {
                if (t.ch.isrf)
                    t.ch.rfchan = t.primary;
                else 
                    t.ch.inetchan = t.primary; 
            }
            
            /* Type specific settings */
            if (t.type === 'TCPKISS' || t.type === 'APRSIS' || t.type === 'AIS-TCP') {
                t.ch.specific.host = t.host();
                t.ch.specific.port = parseInt(t.port());
            }
            if (t.type === 'TCPKISS' || t.type === 'KISS')
                t.ch.specific.kissport = parseInt(t.kissport());
            if (t.type === 'KISS' || t.type === 'TNC2') {
                t.ch.specific.port = t.serport();
                t.ch.specific.baud = parseInt(t.baud());
            }
            if (t.type === 'APRSIS') {
                t.ch.specific.pass = parseInt(t.passcode());
                t.ch.specific.filter = t.filter();
            }   
            if (t.type === 'ROUTER') {
                t.ch.specific.channels = getRouterChannels(); // t.channels() 
            }
            if (t.type === 'APRSIS-SRV') {
                t.ch.specific.port = parseInt(t.port());
                t.ch.specific.filter = t.filter();
                t.ch.specific.defaultfilt = t.dfilter();
            }
            srv.PUT("system/adm/channels/"+t.name(), JSON.stringify(t.ch), 
                    ()=> {
                        console.log("Channel updated: "+t.name());
                        t.successMsg("Channel updated", 10000);
                        t.getObjects() 
                    }, 
                    (xhr, st, err) => { 
                        console.warn("Couldn't update channel: "+err);
                        t.errMsg("Couldn't update channel", 10000);
                    }
                ); 
        }

        
        function getRouterChannels() {
            let chlist = [];
            for (const x of t.rclist) {
                chlist.push({name: x.name, filter: x.filter()});
            }
            return chlist;
        }
        

        function showClients() {
            if (!t.clients) 
                t.clients = new pol.psadmin.Clients();
            if (!t.clients.isActive())
                t.clients.activatePopup('features.Properties', [60, 60], true);
            t.clients.getClients(t.ch.name); 
        }
        
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
    } /* constructor */
    
    
            
    putRouterChannels(chlist) {
        this.rclist = [];
        if (chlist != null)
            for (const x of chlist)
                this.rclist.push({name: x.name, filter: m.stream(x.filter)});
    }
    
    
    onclose() {
        clearInterval(this.listUpd);       
        if (this.chanUpd != null)
            clearInterval(this.chanUpd);
    }
    
    
    onActivate() {
        this.getObjects();        
        this.listUpd = setInterval( () => 
            this.getObjects(), 10000)
    }
    
    
    /* Clear form fields */
    clear() {
        this.editMode = false; 
        this.clearAllVars();   
        if (this.chanUpd != null)
            clearInterval(this.chanUpd);
    }
    
    
    clearAllVars() {
        const t = this;
        t.tag = m.stream("");
        t.name = m.stream("");
        t.ch = null;
        t.activated = false;
        t.primary = false; 
        t.host = m.stream("");
        t.port = m.stream("");
        t.serport = m.stream("");
        t.baud = m.stream("");
        t.kissport = m.stream("");
        t.passcode = m.stream("");
        t.filter = m.stream("");
        t.dfilter = m.stream("");
        t.channels = m.stream("");
        t.rclist = []; 
    }
    
    
    /* Get list of channels from backend server */
    getObjects() {
        CONFIG.server.GET("system/adm/channels", null,
            x=> { 
                this.clist = JSON.parse(x); 
                this.clist.sort( (a,b) => {
                    if (a.specific.type > b.specific.type) return 1; 
                    else if (a.specific.type < b.specific.type) return -1;
                    else if (a.name > b.name) return 1;
                    else if (a.name < b.name) return -1; 
                    else return 0;
                  } );
                m.redraw() 
            },
            (xhr, st, err)=> { 
                console.warn("Couldn't get channel-list: ", err); 
                this.errMsg("Couldn't get channel-list", 10000);
            }
        )
    }
    
    
    /* Get a specific channel from server */
    getChannel(name, timed) {
        CONFIG.server.GET("system/adm/channels/"+name, null,
            x=> { 
                this.ch=JSON.parse(x); 
                if (timed)
                    return;
                this.type = this.ch.specific.type;
                this.host(this.ch.specific.host);
                this.port(""+this.ch.specific.port);
                this.kissport(""+this.ch.specific.kissport);
                this.passcode(""+this.ch.specific.pass);
                this.filter(this.ch.specific.filter==null ? "*" : this.ch.specific.filter);
                this.dfilter(this.ch.specific.defaultfilt==null ? "" : this.ch.specific.defaultfilt);
                this.activated = this.ch.active;
                this.primary = this.ch.rfchan || this.ch.inetchan;
                this.loggedinonly = this.ch.generic.restricted;
                this.tag(this.ch.generic.tag);
                this.putRouterChannels(this.ch.specific.channels);  
                m.redraw(); 
            },
            (xhr, st, err) => { 
                console.warn("Couldn't get channel-information: ", name, err); 
                this.errMsg("Couldn't get channel-information: "+name, 10000);
            }
        )
    } 
    
            
        
    removeRouterChan(ch) {
        for (i in this.rclist)
            if (ch == this.rclist[i].name == ch)
                break
        if (i==this.rclist.length && this.rclist[i].name != ch)
            return;
        this.rclist.splice(i,1);
    }
        
        
        
    /* Remove channel on server */
    remove(x) {
        if (!x || x==null)
            return;
        if (confirm("Remove - are you sure?") == false)
                return;
        
        
        srv.DELETE("system/adm/channels/"+x,
                ()=> { 
                    console.log("Removed channel: "+x);
                    this.successMsg("Channel deleted", 10000)
                    this.getObjects() 
                    this.removeRouterChan(x);
                    if (this.name() === x)
                        this.clear();
                }, 
                (xhr, st, err) => { 
                    console.warn("Couldn't delete channel: ", x, err); 
                    this.errMsg("Couldn't delete channel: "+x, 10000);
                }
            );
    }
        
    
} /* class */


pol.widget.setFactory( "psadmin.Channels", {
        create: () => new pol.psadmin.Channels()
    });

