
/*
 Map browser based on OpenLayers 5. Tracking. 
 Bulletin board.  
 
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
        var announcements = [];
        var selectedGroup = 'APRS'; // FIXME: Save in sessionStorage

   
        /* Render a bulletin group */
        var showGroup = {
            view: function(vn) {
                return m("table", vn.attrs.msgs.map( x => {
                    return m("tr", [ m("td", x.sender), m("td", m("table", x.bulls.map( y => {
                        if (y!=null) return m("tr", 
                            [m("td", y.text), m("td.time", formatAge(y.time))] );
                    })))]);
                }));
            }
        }
    
    
        this.widget = {
            view: function() {
                var i=0;
                return m("div#bullboard", [
                    m("h1", "APRS Bulletin Board"),
                    m("div.content", [
                    m("h4", "Groups:"),
                    groups.map( x => {
                        return [m("span", 
                            {"class": (x==selectedGroup ? 'selected' :''), onclick:apply(selectGroup, x)}, 
                            x ), " " ];
                    }),
                    m("h4", "Bulletins ("+selectedGroup+"):"),
                    m(showGroup, {msgs: messages}),
               
                    m("h4", "Announcements:"),
                    m(showGroup, {msgs: announcements}) ])
                ]);  
            }
        };

        selectedGroup = CONFIG.get('tracking.BullBoard.group');
        if (!selectedGroup)
            selectedGroup = 'APRS';
    
        getGroups();
        getMessages();
        getAnn();
        
    
        t.server.pubsub.subscribe("bullboard", x => {
            getGroups();
            getMessages();
            getAnn();
        });  
    
    
        /* Re-render and if height extends viewport height, add a scrollbar */
        function updateScreen() {   
            m.redraw();
            var ht = $('#map').height() - t.pos[1] - 90; 
            setTimeout( () => { 
                if ($('#bullboard .content').parent().is( "#bullboard .scroll" ) ) 
                    $('#bullboard .content').unwrap();
                
                if ($('#bullboard .content').height() < ht) 
                    ht = $('#bullboard .content').height()+20;
                else {
                    $('#bullboard .content').wrap('<div class="scroll"></div>');
                    $('#bullboard .scroll').height(Math.round(ht));
                }
            }, 220);
        }   
    

        /* Select the bulletin group to be shown */
        function selectGroup(group) {
            selectedGroup = group;
            CONFIG.store('tracking.BullBoard.group', selectedGroup, false);
            console.log("selectGroup: "+group);
            getMessages();
        }
    
    
        /* Get set of groups from server */
        function getGroups() {
            t.server.GET("/bullboard/groups", "", x => { 
                groups = JSON.parse(x);
                groups.unshift('APRS');
                m.redraw();
            } );
        }
    
        /* Get selected bulletin group from server */
        function getMessages() {
            var g = selectedGroup; 
            if (g == 'APRS')
                g = '_B_'; 
            t.server.GET("/bullboard/"+g+"/messages", "", x => { 
                messages = JSON.parse(x);      
                updateScreen();
            } );
        }
    
        /* Get announcements from server */
        function getAnn() {
            t.server.GET("/bullboard/_A_/messages", "", x => { 
                announcements = JSON.parse(x);      
                updateScreen();
            } );
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

