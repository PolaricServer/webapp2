 
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

pol.tracking.db.History = class extends pol.core.Widget {
    
    constructor(item) {
        super();
        var t = this;
    
        t.classname = "tracking.db.History"; 
        t.item = null;
        t.srch = null;
        t.list = []; 
        t.searchmode = false; 
    
        var it = null;
    
        var showList = {
            view: function() {
                var i=0;
                return m("div.histt", m("table", t.list.map( x => {
                    return m("tr", 
                        m("td", [ 
                            m(removeEdit, {remove: apply(deleteItem, i), edit: apply(editItem, i)}), nbsp,
                            m("span.removeEdit", 
                              m("img", {src: "images/time.png", title: "Set time (from form)", onclick: apply(setTime, i)})) ]
                        ),
                             
                        m("td", {onclick:apply(showItem, i++)}, x.call()),         
                        m("td", x.from.tdate+" / "+x.from.ttime()),
                        m("td", x.to.tdate+" / "+x.to.ttime())
                    );
                })))
            }
        }
    
    
    
        t.widget = {
            view: function() {
                return m("div", [
                    m("h1", "Historical data search"),
                    m(showList),    
                    m("form.hist", [ 
                        m("div.field", 
                            m("span.sleftlab", "Callsign: "),
                            m(textInput, {id:"hist_call", value: t.item.call, size: 10, maxLength:20, 
                                regex: /^.+$/i })),
                      
                        m("div.field", 
                            m("span.sleftlab", "Start: "),
                            m(dateTime, {id: "hist_start", tval: t.item.from}),
                            m(timeButt, {tval: t.item.from})
                        ),
                      
                        m("div.field", 
                            m("span.sleftlab", "End: "),
                            m(dateTime, {id: "hist_end", tval: t.item.to}), 
                            m(timeButt, {tval: t.item.to}),
                            m(checkBox, {id: "hist_open", onclick: hOpen, checked: t.item.open, 
                                title: "If checked, end-time is now" }, "Open end")),
                        
                        m("div.histbutt", [
                            m("button#hist_b1", {type: "button", 
                                title: "Show trail - search", onclick: search}, "Trail"),
                            m("button#hist_pkts", {type: "button", 
                                title: "Raw APRS packets - search", onclick: packets}, "Pkts"),
                          
                            m("button#hist_b2", {type: "button", 
                                title: "Clear all", onclick: clear}, "Clear"),
                            m("button#hist_b3", {type: "button", 
                                title: "Add search to list", onclick: add}, "Add"), 
                            m("button#hist_b4", {type: "button", 
                                title: "Get from My Trackers", onclick: getMT}, "Get MT"),
                            m("button#hist_b5", {type: "button", 
                                title: "Show all trails in list", onclick: showAll}, "Show all"),
                            m("button#hist_b6", {type: "button", 
                                title: "Export trails to GPX file", onclick: exportGpx}, "Export"),
                            m("button#hist_back", {type: "button",  
                                title: "Return to realtime tracking", onclick: goBack}, "Back")
                        ])
                    ]),
                    m("iframe#downloadframe", {style: "display:none"})
                ]);
            }
        };
    
    

        restoreList();
        t.setItem(item);
    
        setTimeout( 
            () => $('#hist_end_date, #hist_end_time').prop('disabled', t.item.open), 
            300 );
    
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    

        
        /* Delete item from list */
        function deleteItem (i) {
            t.list.splice(i, 1);
            saveList();
        }
        
        
        function toIsoString(d, t) {
            if (d=="-" || t=="-")
                return "-/-";
            const dt = new Date(d+" "+t);
            return dt.toISOString();
        }
        
    
        /* Edit item (move it to search form) */
        function editItem (i) {
            
            let x = Object.assign({}, t.list[i]);
            t.item = x; 

            $('#hist_start_date').val(x.from.tdate).trigger("change");
            if (x.open) 
                $('#hist_end_date').val(formatDate(new Date())).trigger("change");
            else 
                $('#hist_end_date').val(x.to.tdate).trigger("change");
            
            $('#hist_end_date, #hist_end_time').prop('disabled', x.open);
            m.redraw();
            deleteItem(i);
        }
    
        
        /* Show trail for item */
        function showItem(i) {
            CONFIG.tracks.clear();
            showTrail(t.list[i]);
        }
    
    
        function setTime(i) {
            let x = t.list[i];
            x.to.ttime(t.item.to.ttime());
            x.from.ttime(t.item.from.ttime());
            x.from.tdate = $('#hist_start_date').val();
            
            if (t.item.open) {
                x.to.ttime('-');
                x.to.tdate = '-';
            }
            else 
                x.to.tdate   = $('#hist_end_date').val();
            saveList();
            m.redraw();
        }
    
        /* Perform search for editable item - button handler */   
        function search() {
            getSearch();
            CONFIG.tracks.clear();
            showTrail(t.srch);
        }

        function packets() {
            getSearch();
            var it = copyItem();
            WIDGET( "tracking.AprsPackets", [50, 70], false, 
                x=> x.getPackets(it.call(), 500,  toIsoString(it.to.tdate, it.to.ttime()), 
                        toIsoString(it.from.tdate, it.from.ttime() ) ) );
            
        }
        
   
        /* Show all items in list - button handler */
        function showAll() {
            CONFIG.tracks.clear();
            for (const x of t.list) 
                setTimeout(() => showTrail(x), 100);
        }
    
        
        /* Go back to ordinary tracking mode - button handler */
        function goBack() {
            if (!t.searchmode)
	        return;
	    $('#hist_back').removeClass('searchMode');
	    t.searchmode = true;
            CONFIG.tracks.searchMode(false);
        }
        
    
        /* Toggle the open end checkbox */
        function hOpen() {
            if (!t.item.open) 
                $('#hist_end_date, #hist_end_time').prop('disabled',true);
            else {
                $('#hist_end_date, #hist_end_time').prop('disabled',false);
                t.item.to.setNow();
            }

            t.item.open = !t.item.open;
            $('#hist_open').prop('checked', t.item.open);
        }
       
    
        /* Show the trail for a given item */
        function showTrail(x) {
            var qstring = "?tfrom=" + toIsoString(x.from.tdate, x.from.ttime()) 
              + "&tto=" + toIsoString(x.to.tdate, x.to.ttime());
            
            CONFIG.server.GET("/hist/"+x.call()+"/trail"+qstring, "", 
                x => {
                    $('#hist_back').addClass('searchMode');
                    t.searchmode = true;
                    CONFIG.tracks.searchMode(true);
                    CONFIG.tracks.update(JSON.parse(x), true);
                });
        }
    
    
        function exportGpx() {
            let trails = [];
            let result = 
            '<gpx creator="Polaric Webapp2" version="1.7.3" \n'+ 
            '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" \n' +
            '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" > \n' +
            '<metadata> \n'+
            '   <name>Polaric Server Tracks</name> \n'+
            '   <time>'+new Date().toISOString()+'</time> \n' +
            '</metadata> \n';
            
            for (const x of t.list) 
                trails.push( 
                    gpxTrail(x).then((res) => { result += res; })
                );
            Promise.allSettled(trails)
                .then( ()=> {
                    result += "\n</gpx>";
                
                    const url = window.URL.createObjectURL(new Blob([result]));
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'trails.gpx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                });
        }

    
        /* Generate gpx trail for a given item */
        function gpxTrail(x) {
            return new Promise((resolve, reject) => {
                
                var qstring = "?tfrom=" + toIsoString(x.from.tdate,x.from.ttime()) 
                   + "&tto=" + toIsoString(x.to.tdate, x.to.ttime());
                
                CONFIG.server.GET("/hist/"+x.call()+"/trail"+qstring, "", 
                    x => {
                        const data = JSON.parse(x).points[0];
                        if (data.trail == null) {
                            resolve("");
                            return;
                        }
                        let result = '<trk>'
                        result += '<name>'+data.ident+'</name>\n';
                        result += '<trkseg>\n';
                        result += data.trail.linestring.reduce((accum, pt) => {
                            let seg = '<trkpt lat="'+roundDeg(pt.pos[1]) + '" lon="'+roundDeg(pt.pos[0]) + '">';
                            seg += '<time>'+pt.time+'</time>';
                            seg += '</trkpt>\n';
                            return accum + seg;
                        }, '');
                        result += '</trkseg></trk>\n';
                        resolve(result);
                    },
                    ()=> {reject()}
                );
            });
        }
    
            
        function roundDeg(d) {
            return Math.round(d*100000) / 100000;
        }
    
   
   
        /* Get search parameters. Save them to localstorage as well */   
        function getSearch() {
            t.item.call(t.item.call().toUpperCase());
            t.item.from.tdate = $('#hist_start_date').val();
            t.item.to.tdate   = $('#hist_end_date').val();
            
            t.srch = copyItem();
            if (t.srch.open) {
                t.srch.to.ttime('-');
                t.srch.to.tdate = '-';
            }
            t.saveItem();
            return t.srch;
        }
    
    
        /* Make a copy of the editable item. Convert stream-values */
        function copyItem() {
            let x = Object.assign({}, t.item);
            x.call = m.stream(t.item.call());
            x.from = Object.assign({}, t.item.from);
            x.to = Object.assign({}, t.item.to);
            x.from.ttime = m.stream(t.item.from.ttime());
            x.to.ttime = m.stream(t.item.to.ttime());
            return x;
        }
        
        
        
    
        /* Add search to list */
        function add() {
            const x = getSearch();
            t.list.push(x);
            saveList();
        }
    
    
        function getMT() {
            const userid = CONFIG.server.auth.userid;
            console.assert(userid && userid!=null, "userid="+userid);
            if (userid == null)
                return;
            CONFIG.server.GET("trackers", "", x => { 
                let mtr = JSON.parse(x);
                for (var tt of mtr) { 
                   let tr = {
                       call: m.stream(tt.id), 
                       from: t.item.from, 
                       to: t.item.to
                   };
                   t.list.push(tr);
                }
                saveList();
                m.redraw();
            } );
            
        }
        
        function clear() {
            t.item.call("");
            t.item.from.setNow();
            t.item.to.setNow();
            t.list = []; 
            t.saveItem();
            saveList();
        }
    
       
        /* Save list to local storage */
        function saveList() { 
              const list = [];
              for (it of t.list)
                  list.push(t._saveItem(it));
              CONFIG.store('tracking.db.hist', JSON.stringify(list));
        }
        
        
        async function restoreList() {
            let list = JSON.parse(await CONFIG.get('tracking.db.hist'));
            if (Array.isArray(list)==false)
                list = [];
            if (list==null || list==[])
                t.list=[];    
            for (it of list)
                t.list.push(t._restoreItem(it));
        }
        
 
    } /* constructor */
    
    
    _saveItem(x) {        
        return {
            call: x.call(), todate: x.to.tdate, totime: x.to.ttime(),
            fromdate: x.from.tdate, fromtime: x.from.ttime(), open:x.open 
        }
    }
    
        
    _restoreItem(it) {
        const to = new pol.core.Time();
        if (it == null)
            return {call: m.stream(""), to: to, from: new pol.core.Time(), open:false};
        to.tdate = it.todate;
        to.ttime(it.totime);
        const frm = new pol.core.Time();
        frm.tdate = it.fromdate;
        frm.ttime(it.fromtime);
        return {call: m.stream(it.call), to: to, from: frm, open:it.open};
    }
    
    
    saveItem() {
        CONFIG.storeSes('tracking.db.hist.item', JSON.stringify(this._saveItem(this.item)));
    }
       
       
    async restoreItem() {
        const it = JSON.parse(await CONFIG.get('tracking.db.hist.item'));
        this.item = this._restoreItem(it); 
    }
    
    
    onclose() {
        CONFIG.tracks.searchMode(false);
    }
    
    
    setCall(call) {
        this.item.call(call); 
        m.redraw();
    }
    
    
    newItem(item) {
        return {
            call: m.stream((item? item: "")),
            from: new pol.core.Time(),
            to: new pol.core.Time()
        };
    }
    
    
    
    /* Initialize fields of editable item */
    setItem(item) {
        const t = this;
      	if (item != null) {
            t.item = t.newItem(item);
            t.saveItem();
            m.redraw();
        }
        else {
            t.restoreItem();
        }
        if (t.item==null) 
            t.item = t.newItem();
        if (t.item.from==null)
            t.item.from = new pol.core.Time();
        if (t.item.to==null)
            t.item.to = new pol.core.Time();

        if (!t.item.to.timeIsSet())
            t.item.to.setNow();
        if (!t.item.from.timeIsSet())
            t.item.from.setNow();
        return t;
    }
    
} /* class */



pol.widget.setFactory( "tracking.db.History", {
        create: () => new pol.tracking.db.History()
    }); 

