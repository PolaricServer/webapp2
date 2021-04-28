
/*
 Map browser based on OpenLayers 5. Tracking. 
 Bulletin board.  
 
 Copyright (C) 2021 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        this.classname = "tracking.BullBoard"; 
        this.server = CONFIG.server;  
        var t = this;
        var groups = [];
        var messages = [];
        var selectedGroup = 0;
        
        var edit = [[]]; 
        var sentText = [];
        var addgrp = m.stream("");
        
        
        /* Render a bulletin group */
        var showGroup = {
            view: function(vn) {
                return m("table", vn.attrs.msgs.map( x => {
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
    
        var sendBull = {
            view: function(vn) {
                var i=0;
                return m("div.mybulls", [                  
                    m("h4", "My bulletins (send):"),
                    m("div", 
                    edit[selectedGroup].map( x => {   
                        return m("span.mline", [
                            m("span", ""+ (selectedGroup==0 ? String.fromCharCode( 'A'.charCodeAt(0)+i) : ''+i)), 
                            m(textInput, { id:"edit"+(i++), value: x, size: 60, 
                                maxLength:67, regex: /^[^\<\>\'\"]+$/i }), 
                                (i==edit[selectedGroup].length ? m("span", {onclick: addInpLine}, '+') : "") 
                        ]);
                    })),
                    m("button", { type: "button", onclick: sendMessages }, "Update"),
                    m("button", { type: "button", onclick: clear }, "Clear")
                ]);
                
            }
        }
    
    
        this.widget = {
            view: function() {
                var i=0;
                return m("div#bullboard", [
                    m("h1", "APRS Bulletin Board"),
                    m("div.content", [
                    m("h4", "Bulletin group:"),
                    m("div.bgroups", 
                        groups.map( x => {
                            return [m("span", 
                                {"class": (i==selectedGroup ? 'selected' :''), onclick:apply(selectGroup, i++)}, 
                                x ), " " ];
                        }),
                        (canSend() ? 
                            m("span", [ m(textInput, {id:"addGrp", value: addgrp, size: 5}),
                                        m("span", {onclick: grpAdd}, nbsp, "[+]") ]) : "" )
                    ),
                    m(showGroup, {msgs: messages}),
                    (canSend() ? m(sendBull) : "")
                ])]);  
            }
        };

    
        getGroups();
            
        t.server.pubsub.subscribe("bullboard", x => {
            getGroups();
            getMessages();
        });  
        
        
        for (var i=0;i<26;i++)
            sentText[i] = false;
        
        setInterval(()=> m.redraw(), 60000);
        
        /* Add group locally */
        function grpAdd() {
            if (addgrp() == "")
                return;
            for (i in groups)
                if (groups[i] == addgrp()) {
                    selectGroup(i);
                    return;
                }
            groups.push(addgrp().toUpperCase());
            selectGroup(groups.length-1);
            messages = [];
            addgrp(""); 
            updateScreen();
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
            if (group() == '_A_')
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
        
        
        /* Add input line */
        function addInpLine() {
            const lines = edit[selectedGroup];
            lines.push(m.stream(""));
        }
 
        
 
        /* Re-render and if height extends viewport height, add a scrollbar */
        function updateScreen() {   
            m.redraw();
            setTimeout( () => { 
                var ht = $('#map').height() - t.pos[1] -80; 
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
    
    
        /* Return true if we can send bulls */
        function canSend() {
            return t.server.auth.userid != null &&
                t.server.auth.callsign != null &&
                t.server.auth.callsign != "";
        }

        
        /* Select the bulletin group to be shown */
        function selectGroup(group) {
            if (group >= groups.length)
                group = 0;
            if (!edit[group] || edit[group].length == 0) {
                edit[group] = [];
                edit[group].push(m.stream(""));
            }
            selectedGroup = group;
            CONFIG.store('tracking.BullBoard.selgroup', groups[group], false);
            getMessages();
            if (canSend())
                getMyMessages(); 
        }
    
    
        function groupIndex(grp) {
            for (var i in groups)
                    if (grp==groups[i]) return i;
            return 0;
        }
    
        /* Get set of groups from server */
        function getGroups() {
            t.server.GET("/bullboard/groups", "", x => { 
                groups = JSON.parse(x);
                groups.unshift('APRS');
                groups.unshift('Announcements');
        
                var grp = CONFIG.get('tracking.BullBoard.selgroup');
                selectedGroup = groupIndex(grp);
                        
                if (!selectedGroup)
                    selectedGroup = 0;
                selectGroup(selectedGroup);
            } );
        }
        
    
        /* Return name of selected group */
        function group() {
            var g = selectedGroup;
            var gg = groups[selectedGroup];
            if (g == 0)
                gg = '_A_';
            else if (g == 1)
                gg = '_B_'; 
            return gg;
        }
        
        
        /* Get selected bulletin group from server */
        function getMessages() {
            t.server.GET("/bullboard/"+group()+"/messages", "", x => { 
                messages = JSON.parse(x);      
                updateScreen();
            } );
        }
    
    
        /* Get my own (sent) messages from server. */
        function getMyMessages() {
            const call = t.server.auth.callsign; 
            if (call==null || call=="")
                return;
            t.server.GET("/bullboard/"+group()+"/messages/"+call, "", x => { 
                var msgs = JSON.parse(x);
                for (const i in msgs) 
                    if (msgs[i] != null) {
                        sentText[i] = true;
                        edit[selectedGroup][i] = m.stream(msgs[i].text);
                    }
            } );  
        }
        
        
        function clear() {
            for (i in edit[selectedGroup])
                edit[selectedGroup][i]("");
            updateScreen();
            sendMessages();
        }
        
        
    
        function sendMessages() {

            var msgs = edit[selectedGroup];
            for (const i in msgs) {
                if (msgs[i]() == "" && sentText[i]==false) 
                    continue;
                sentText[i] = (msgs[i]() != "");
                
                var bid = (selectedGroup==0 ? String.fromCharCode(Number(i) + ('A'.charCodeAt(0))) : '' + i);
                var msg = { 
                    bullid: bid,
                    groupid: group(),  
                    text: msgs[i]()
                }

                /* Perform the REST call to the server */
                t.server.PUT("bullboard/"+group()+"/messages", JSON.stringify(msg),
                    x => {
                        console.log("Sent bulletin to: "+msg.groupid+": "+msg.text);
                    },
                    x => {
                        console.log("Send message -> "+x.status+": "+x.statusText +
                            " ("+x.responseText+")");
                        alert("Cannot send message:" + 
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

} /* class */




pol.widget.setFactory( "tracking.BullBoard", {
        create: () => new pol.tracking.BullBoard()
    }); 

