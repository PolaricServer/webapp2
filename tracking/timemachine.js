 
/*
 Map browser based on OpenLayers. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2018-2022 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Historic trail search (in a popup window). 
 */

pol.tracking.db.Timemachine = class extends pol.core.Widget {
    
    constructor(item) {
        super();
        var t = this;
    
        t.classname = "tracking.db.Timemachine"; 
        t.tdate = formatDate(new Date());
        t.ttime = m.stream( formatTime(new Date()) );
        t.searchmode = false; 
    
        var it = null;
    
    
        t.widget = {
            view: function() {
                return m("div", [
                    m("h1", "Time machine"),
                    m("form.tm", [ 
                       
                        m("span.tm",
                            m(dateTimeInput, {id: "dtinput", dvalue: t.tdate, tvalue: t.ttime})), 
                        
                        m("div.tmbutt", [
                            m("button#tm_b1", {type: "button", 
                                title: "Show trail - search", onclick: search}, "Go to.."),
                          
                            m("button.tm_fw", {type: "button", 
                                title: "Go back 1 hour", onclick: decr_hour}, m("img", {src:"images/fback.png", height: "22px"})),
                          
                            m("button.tm_fw", {type: "button", 
                                title: "Go back 1 minute", onclick: decr_minute}, m("img", {src:"images/back.png", height: "22px"})),
                          
                            m("button.tm_fw", {type: "button", 
                                title: "Go forward 1 minute", onclick: incr_minute}, m("img", {src:"images/forward.png", height: "23px"})),
                          
                            m("button.tm_fw", {type: "button", 
                                title: "Go forward 1 hour", onclick: incr_hour}, m("img", {src:"images/fforward.png", height: "23px"})),
                          
                            m("button#hist_back", {type: "button",  
                                title: "Return to realtime tracking", onclick: goBack}, "Back")
                        ])
                    ]),
                    m("iframe#downloadframe", {style: "display:none"})
                ]);
            }
        };
           
        CONFIG.mb.map.on("change:view", e => {
            search();
        });
            
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    

        function search() {
            _search(true);
        }
        
        
        /* Perform search for editable item - button handler */   
        function _search(reset) {
            CONFIG.tracks.clear();
            showPoints( reset );
        }
        
        let waiting=null;
        function timedSearch() {
            if (waiting != null)
                window.clearTimeout(waiting);
            waiting=setTimeout( ()=> {waiting=null; _search(false) }, 600); 
        }
        
        
        function pad2(number) {
            return (number < 10 ? '0' : '') + number
        }

    
        function decr_minute() {
            let decrhour = false;
            const tm = t.ttime();
            const tc = tm.split(/\s*:\s*/);
            let minutes = parseInt(tc[1]);
            minutes--;
            if (minutes < 0) { minutes = 59; decrhour=true; }
            t.ttime(tc[0]+":"+pad2(minutes));
            if (decrhour)
                decr_hour();
            timedSearch();
        }
    
         function incr_minute() {
            let incrhour = false;
            const tm = t.ttime();
            const tc = tm.split(/\s*:\s*/);
            let minutes = parseInt(tc[1]);
            minutes++;
            if (minutes > 59) { minutes = 0; incrhour=true; }
            t.ttime(tc[0]+":"+pad2(minutes));
            if (incrhour)
                incr_hour();
            timedSearch();
        }
 
        function decr_hour() {
            const tm = t.ttime();
            const tc = tm.split(/\s*:\s*/);
            let hours = parseInt(tc[0]);
            hours--;
            if (hours < 0) hours = 23; 
            t.ttime(pad2(hours) +":"+ tc[1]);
            timedSearch();
        }
         
        function incr_hour() {
            const tm = t.ttime();
            const tc = tm.split(/\s*:\s*/);
            let hours = parseInt(tc[0]);
            hours++;
            if (hours > 23) hours = 0; 
            t.ttime(pad2(hours) +":"+ tc[1]);
            timedSearch();
        }
 
    
        /* Go back to ordinary tracking mode - button handler */
        function goBack() {
            if (!t.searchmode)
                return;
            $('#hist_back').removeClass('searchMode');
            t.searchmode = true;
                CONFIG.tracks.searchMode(false);
        }
        
       
    
        /* Show the trail for a given item */
        function showPoints(reset) {
            t.tdate   = $('#dtinput_date').val();
            var scale = CONFIG.mb.getScale();
            var filt = CONFIG.tracks.filter;
            var qstring = "?tto="+t.tdate+"/"+t.ttime()+"&scale="+roundDeg(scale)+"&filter="+filt;
            if (reset==true) 
                qstring += "&reset";
            var ext = CONFIG.mb.getExtent(); 
            
            CONFIG.server.GET("hist/snapshot/" + roundDeg(ext[0]) + "/"+ roundDeg(ext[1]) +
                          "/"+ roundDeg(ext[2]) + "/" + roundDeg(ext[3]) + qstring, "", 
                x => {
                    $('#hist_back').addClass('searchMode');
                    t.searchmode = true;
                    CONFIG.tracks.searchMode(true);
                    CONFIG.tracks.update(JSON.parse(x), true);
                });
        }
    
    
        
    
            
        function roundDeg(d) {
            return Math.round(d*100000) / 100000;
        }
    
   
 
    } /* constructor */
    
    
    onclose() {
        CONFIG.tracks.searchMode(false);
    }
    
        

} /* class */



/* FIXME: source file? namespace? Module? */

function formatDate(d) {
    return ""+d.getFullYear() + "-" + 
        (d.getMonth()<9 ? "0" : "") + (d.getMonth()+1) + "-" +
        (d.getDate()<10 ? "0" : "")  + d.getDate();
}


function formatTime(d) {
    return "" +
        (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
        (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
}



pol.widget.setFactory( "tracking.db.Timemachine", {
        create: () => new pol.tracking.db.Timemachine()
    }); 

