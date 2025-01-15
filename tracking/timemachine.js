 
/*
 Map browser based on OpenLayers. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2018-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        t.time = new pol.core.Time(timedSearch);
        
        t.searchmode = false; 
        t.message = null;
        
    
        var it = null;
    
    
        t.widget = {
            view: function() {
                return m("div", [
                    m("h1", "Time machine"),
                    m("form.tm", [ 
                       
                        m("span.tm",
                            m(dateTime, {id: "dtinput", tval: t.time})), 
        
                        m("div.statusmsg", t.message),
                         
                        
                        m("div.tmbutt", [
                            m("button#tm_b1", {type: "button", 
                                title: "Show trail - search", onclick: search}, "Go to.."),
                            m(timeButt, {tval: t.time, hour: true}),
                            m("button#tm_back", {type: "button",  
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
            showPoints( reset );
        }
        
        let waiting=null;
        function timedSearch() {
            if (waiting != null)
                window.clearTimeout(waiting);
            waiting=setTimeout( ()=> {waiting=null; _search(false) }, 700); 
        }
   
    
        /* Go back to ordinary tracking mode - button handler */
        function goBack() {
            if (!t.searchmode)
                return;
            $('#tm_back').removeClass('searchMode');
            t.searchmode = false;
            CONFIG.tracks.searchMode(false); 
            t.message = null;
            m.redraw();
        }
        
        
        function toIsoString(d, t) {
            const dt = new Date(d+" "+t);
            return dt.toISOString();
        }
        


    
        /* Show the trail for a given item */
        function showPoints(reset) {
            t.time.tdate   = $('#dtinput_date').val();
            var done = false;
            var scale = CONFIG.mb.getScale();
            var filt = CONFIG.tracks.filter;
            var qstring = "?tto="+toIsoString(t.time.tdate, t.time.ttime()) + "&scale=" + roundDeg(scale) + "&filter="+filt;
            if (reset==true) 
                qstring += "&reset";
            var ext = CONFIG.mb.getExtent(); 
            setTimeout(()=> {if (!done) t.message = "Searching, please wait...";m.redraw(); }, 200);
            CONFIG.tracks.clear();
            
            CONFIG.server.GET("hist/snapshot/" + roundDeg(ext[0]) + "/"+ roundDeg(ext[1]) +
                          "/"+ roundDeg(ext[2]) + "/" + roundDeg(ext[3]) + qstring, "", 
                x => {
                    $('#tm_back').addClass('searchMode');
                    t.searchmode = true;
                    CONFIG.tracks.searchMode(true);
                    CONFIG.tracks.update(JSON.parse(x), true);
                    t.message = null;
                    done = true;
                    m.redraw();
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





pol.widget.setFactory( "tracking.db.Timemachine", {
        create: () => new pol.tracking.db.Timemachine()
    }); 

