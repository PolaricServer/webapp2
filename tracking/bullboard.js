
/*
 Map browser based on OpenLayers. Tracking. 
 Bulletin board.  
 
 Copyright (C) 2021-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Bulletin board widget (in a popup window). 
 */

pol.tracking.BullBoard = class extends pol.core.Widget {

    constructor() {
        super();
        
        const t = this;
        this.classname = "tracking.BullBoard"; 
        this.server = CONFIG.server;  
        
        t.groups = [];
        t.messages = [];
        t.selectedGroup = 0;
        t.edit = [[]]; 
        t.showOld = true;
        
        t.sentText = [];
        let addgrp = m.stream("");
        
        
        /* Render a bulletin group */
        const showGroup = {
            view: function(vn) {
                return m("table", vn.attrs.msgs.filter(mx => (t.showOld || !oldSender(mx)) ).map( x => {
                    return m("tr"+(oldSender(x) ? ".oldmsg" : ""), [ m("td", x.sender), m("td", m("table", x.bulls.map( y => {
                        if (y!=null) 
                            return m("tr"+(oldMsg(y) ? ".oldmsg" : ""), 
                              [ m("td" + ( newMsg(y) ? ".newmsg" : 
                                    ( oldMsg(y) ? ".oldmsg" : "" ) ), 
                                y.text), m("td.time", formatAge(y.time)) ] 
                            );
                    })))]);
                }));
            }
        }
    
        const sendBull = {
            view: function(vn) {
                var i=0;
                return m("div.mybulls", [                  
                    m("h4", "My bulletins (send):"),
                    m("div", 
                    t.edit[t.selectedGroup].map( x => {   
                        return m("span.mline", [
                            m("span", ""+ (t.selectedGroup==0 ? String.fromCharCode( 'A'.charCodeAt(0)+i) : ''+i)), 
                            m(textInput, { id:"edit"+(i++), value: x, size: 60, 
                                maxLength:67, regex: /^[^\<\>\'\"]+$/i }), 
                                (i==t.edit[t.selectedGroup].length ? m("span", {onclick: addInpLine}, '+') : "") 
                        ]);
                    })),
                    m("button", { type: "button", onclick: sendMessages }, "Update"),
                    m("button", { type: "button", onclick: clear }, "Clear")
                ]);
                
            }
        }
    
    
        t.widget = {
            view: function() {
                var i=0;
                return m("div#bullboard", [
                    m("h1", "APRS Bulletin Board"),
                    m("div.content", [
                    m("h4", "Bulletin group:"),
                    m("div.bgroups", 
                        t.groups.map( x => {
                            return [m("span", 
                                {"class": (i==t.selectedGroup ? 'selected' :''), onclick:apply(_selectGrp, i++)}, 
                                x ), " " ];
                        }),
                        (t.canSend() ? 
                            m("span", [ m(textInput, {id:"addGrp", value: addgrp, size: 5}),
                                        m("span", {onclick: grpAdd}, nbsp, "[+]") ]) : "" )
                    ),
                    m(showGroup, {msgs: t.messages}),
                    (t.canSend() ? m(sendBull) : "")
                ])]);  
            }
        };

        for (var i=0;i<26;i++)
            t.sentText[i] = false;
        
        setInterval(()=> m.redraw(), 60000);
        
        
        function _selectGrp(x) {
            t.selectGroup(x);
        }
        
        
        
        /* Add group locally */
        function grpAdd() {
            console.log("grpAdd", addgrp());
            if (addgrp() == "")
                return;
            for (i in t.groups)
                if (t.groups[i] == addgrp()) {
                    t.selectGroup(i);
                    m.redraw();
                    return;
                }
            console.log("grpAdd - push");
            t.groups.push(addgrp().toUpperCase());
            t.selectGroup(t.groups.length-1);
            t.messages = [];
            addgrp(""); 
            t.updateScreen();
        }
        
        /* Return true if message is newer than 15 minutes */
        function newMsg(msg) {
            var ltime = new Date(msg.time);
            var now = new Date(); 
            var diff = now - ltime;
            var min = Math.floor(diff/1000/60);
            return (min <= 15);
        }
        
        
        /* Return true if message is older than 24 hours */
        function oldMsg(msg) {
            var ltime = new Date(msg.time);
            var now = new Date(); 
            var diff = now - ltime;
            var min = Math.floor(diff/1000/60);
            if (t.group() == '_A_')
                return (min > 2880)
            else
                return (min > 1440);
        }
        
        
        /* Return true if messages from sender is older thatn 24 hours */
        function oldSender(s) {
            var old = true; 
            for (var x of s.bulls)
                if (x != null && !oldMsg(x))
                    old = false; 
            return old;
        }
        
        
        function oldGroup(g) {
            var old = true; 
            for (s of g.senders) ;
            return old;
        }
        
        
        
        /* Add input line */
        function addInpLine() {
            const lines = t.edit[t.selectedGroup];
            lines.push(m.stream(""));
        }
    
        
        function clear() {
            for (i in t.edit[t.selectedGroup])
                t.edit[t.selectedGroup][i]("");
            t.updateScreen();
            sendMessages();
        }
        
    
        function sendMessages() {
            var msgs = t.edit[t.selectedGroup];
            for (const i in msgs) {
                if (msgs[i]() == "" && sentText[i]==false) 
                    continue;
                t.sentText[i] = (msgs[i]() != "");
                
                var bid = (t.selectedGroup==0 ? String.fromCharCode(Number(i) + ('A'.charCodeAt(0))) : '' + i);
                var msg = { 
                    bullid: bid,
                    groupid: t.group(),  
                    text: msgs[i]()
                }

                /* Perform the REST call to the server */
                t.server.POST("bullboard/"+t.group()+"/messages", JSON.stringify(msg),
                    x => {
                        console.log("Sent bulletin to: "+msg.groupid+": "+msg.text);
                    },
                    x => {
                        console.log("Send bulletin -> "+x.status+": "+x.statusText +
                            " ("+x.responseText+")");
                        alert("Cannot send bulletin:" + 
                            '\n"' + x.responseText + '"');
                    }  
                );
            }
        }
        
        
        /* Format time as age */
        function formatAge(date) {
            var ltime = new Date(date);
            var now = new Date(); 
            var diff = now - ltime;
            var hour = Math.floor(diff/1000/60/60);
            var min = Math.floor((diff-hour*1000*60*60)/1000/60);
            if (hour==0)
                return min+"m";
            else
                return hour+"h"+min+"m";
        }


        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    
    }
    
    
    /* Get set of groups from server */
    getGroups() {
        const t=this;
        t.server.GET("/bullboard/groups", "", x => { 
            t.groups = JSON.parse(x);
            console.log(t.groups);
            t.groups.unshift('APRS');
            t.groups.unshift('Announcements');
        
            CONFIG.get('tracking.BullBoard.selgroup').then( grp=> {     
                t.selectedGroup = t.groupIndex(grp);
                if (!t.selectedGroup)
                    t.selectedGroup = 0;
                t.selectGroup(t.selectedGroup);
            });
        } );
    }
        
             
    /* Get selected bulletin group from server */
    getMessages() {
        this.server.GET("/bullboard/"+this.group()+"/messages", "", x => { 
            this.messages = JSON.parse(x);      
            this.updateScreen();
        } );
    }   
    
        
    /* Get my own (sent) messages from server. */
    getMyMessages() {
        const call = this.server.auth.callsign; 
        if (call==null || call=="")
            return;
        this.server.GET("/bullboard/"+this.group()+"/messages/"+call, "", x => { 
            var msgs = JSON.parse(x);
            for (const i in msgs) 
                if (msgs[i] != null) {
                    this.sentText[i] = true;
                    this.edit[this.selectedGroup][i] = m.stream(msgs[i].text);
                }
        } );  
    }
        
        
    /* Return name of selected group */
    group() {
        var g = this.selectedGroup;
        var gg = this.groups[this.selectedGroup];
        if (g == 0)
            gg = '_A_';
        else if (g == 1)
            gg = '_B_'; 
        return gg;
    }
        
        
    groupIndex(grp) {
        for (var i in this.groups)
            if (grp==this.groups[i]) return i;
        return 0;
    }
    
    
    /* Select the bulletin group to be shown */
    selectGroup(grp) {
        if (grp >= this.groups.length)
            grp = 0;
        if (!this.edit[grp] || this.edit[grp].length == 0) {
            this.edit[grp] = [];
            this.edit[grp].push(m.stream(""));
        }
        this.selectedGroup = grp;
        CONFIG.store('tracking.BullBoard.selgroup', this.groups[grp]);
        this.getMessages();
        if (this.canSend())
            this.getMyMessages(); 
    }
    
        
    /* Return true if we can send bulls */
    canSend() {
        return this.server.isAuth() &&
            this.server.auth.callsign != null &&
            this.server.auth.callsign != "";
    }

        
    /* Re-render and if height extends viewport height, add a scrollbar */
    updateScreen() {   
        m.redraw();
        setTimeout( () => { 
            var ht = $('#map').height() - this.winpos[1] -80; 
            if ($('#bullboard .content').parent().is( "#bullboard .scroll" ) ) 
                $('#bullboard .content').unwrap();
                
            if ($('#bullboard .content').height() < ht) 
                ht = $('#bullboard .content').height()+20;
            else {
                $('#bullboard .content').wrap('<div class="scroll"></div>');
                $('#bullboard .scroll').height(Math.round(ht));
            }
        }, 100);
    } 
        
        
    onActivate() {
        this.getGroups();
        this.getMessages();
        this.psclient = this.server.pubsub.subscribe("bullboard", x => {
            this.getGroups();
            this.getMessages();
        });
    }

    
    onclose() { 
        if (this.psclient != null)
            this.server.pubsub.unsubscribe("bullboard", this.psclient); 
        this.psclient=null;
        super.onclose();
    }
    
    
} /* class */




pol.widget.setFactory( "tracking.BullBoard", {
        create: () => new pol.tracking.BullBoard()
    }); 

