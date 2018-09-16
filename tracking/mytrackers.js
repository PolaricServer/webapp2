 
/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 
pol.tracking.db = pol.tracking.db || {};



/**
 * Reference search (in a popup window). 
 */

pol.tracking.db.MyTrackers = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
    
        t.classname = "tracking.db.MyTrackers"; 
        t.server = CONFIG.server;
        t.myTrackers = [];

        this.widget = {
            view: function() {
                var i=0;
                return m("div", [       
                    m("h1", "My trackers"),  
                    m("table.mytrackers", m("tbody", t.myTrackers.map(x => {
                        return m("tr", [
                            m("td", m("img", {src:"images/edit-delete.png", onclick: apply(remove, i) }), 
                                m("img", {src:"images/edit.png", onclick: apply(edit, i) })),
                            m("td", {onclick: apply(goto, x.id)}, x.id),
                            m("td", x.alias),
                            m("td", (x.icon == null ? "" :  m("img", {src:x.icon}))),
                            m("td", (x.active ? m("img", {src:"images/16px/ok.png"}) : "")),
                            m("td", (x.lastHrd==null ? "" : formatTime(x.lastHrd)))
                        ]);
                    }))),
                    m(textInput, 
                        { id:"addTracker", value: t.currName, size: 16, 
                          maxLength:25, regex: /^[^\<\>\'\"]+$/i }),
                    m("button", {onclick: add}, "Add")
                ])
            }
        };
    
        getTrackers();
    
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    
    
        function getTrackers() {
            t.server.GET("/users/"+t.server.auth.userid+ "/trackers", "", function(x) { 
                t.myTrackers = JSON.parse(x);
                m.redraw();
            } );
        }
    
        function add() { /* tbd */ }
        function remove(i) { /* tbd */ }
        function edit(i) { /* tbd */ }
    
        function goto(id) {
            if (CONFIG.tracks)
                CONFIG.tracks.goto_Point(id);
        }
    
        function formatTime(time) {
            var ltime = new Date(time);
            var hour = ltime.getHours();
            var min = ltime.getMinutes();
            return hour+":"+(min<=9 ? '0': '') + min; 
        }
 
    } /* constructor */

} /* class */


 

pol.widget.setRestoreFunc("tracking.db.MyTrackers", function(id, pos) {
    var x = new pol.tracking.db.MyTrackers(); 
    x.activatePopup(id, pos, true); 
}); 
