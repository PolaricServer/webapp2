 
/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2018-2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        t.list = []; 
        t.searchmode = false; 
    
        var it = null;
    
        var showList = {
            view: function() {
                var i=0;
                return m("div.histt", m("table", t.list.map( x => {
                    return m("tr", 
                        m("td", 
                            m(removeEdit, {remove: apply(deleteItem, i), edit: apply(editItem, i)})),
                        m("td", {onclick:apply(showItem, i++)}, x.call), 
                        m("td", x.fromdate+"/"+x.fromtime),
                        m("td", x.todate+"/"+x.totime)
                    );
                })))
            }
        }
    
    
    
        t.widget = {
            view: function() {
                return m("div", [
                    m("h1", "Historical tracks"),
                    m(showList),    
                    m("form.hist", [ 
                        m("div.field", 
                            m("span.sleftlab", "Callsign: "),
                            m(textInput, {id:"hist_call", value: t.item.call, size: 10, maxLength:20, 
                                regex: /^.+$/i })),
                      
                        m("div.field", 
                            m("span.sleftlab", "Start: "),
                            m(dateTimeInput, {id: "hist_start", dvalue: t.item.fromdate, tvalue: t.item.fromtime})),
                      
                        m("div.field", 
                            m("span.sleftlab", "End: "),
                            m(dateTimeInput, {id: "hist_end", dvalue: t.item.todate, tvalue: t.item.totime}), 
                            m(checkBox, {id: "hist_open", onclick: hOpen, checked: t.item.open, 
                                title: "If checked, end-time is now" }, "Open end")),
                        
                        m("div.histbutt", [
                            m("button#hist_b1", {type: "button", onclick: search}, "Search"),
                            m("button#hist_b2", {type: "button", 
                                title: "Add search to list", onclick: add}, "Add"),
                            m("button#hist_b3", {type: "button", 
                                title: "Show all trails in list", onclick: showAll}, "Show all"),
                            m("button#hist_b4", {type: "button", 
                                title: "Export to GPX file", onclick: exportGpx}, "Export"),
                            m("button#hist_back", {type: "button",  
                                title: "Return to realtime tracking", onclick: goBack}, "Back")
                        ])
                    ]),
                    m("iframe#downloadframe", {style: "display:none"})
                ]);
            }
        };
    
    
    
        t.list = JSON.parse(CONFIG.get('tracking.db.hist'));
        if (t.list==null)
            t.list=[];
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
    
    
        /* Edit item (move it to search form) */
        function editItem (i) {
            
            let x = Object.assign({}, t.list[i]);
            x.call = m.stream(x.call);
            x.totime = m.stream(x.totime);
            x.fromtime = m.stream(x.fromtime);
            t.item = x; 

            $('#hist_start_date').val(x.fromdate).trigger("change");
            if (x.open) 
                $('#hist_end_date').val(formatDate(new Date())).trigger("change");
            else 
                $('#hist_end_date').val(x.todate).trigger("change");
            
            $('#hist_end_date, #hist_end_time').prop('disabled', x.open);
            m.redraw();
            deleteItem(i);
        }
    
        
        /* Show trail for item */
        function showItem(i) {
            CONFIG.tracks.clear();
            showTrail(t.list[i]);
        }
    
    
        /* Perform search for editable item - button handler */   
        function search() {
            getSearch();
            CONFIG.tracks.clear();
            showTrail(copyItem());
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
            else 
                $('#hist_end_date, #hist_end_time').prop('disabled',false);

            t.item.open = !t.item.open;
            $('#hist_open').prop('checked', t.item.open);
        }
       
    
        /* Show the trail for a given item */
        function showTrail(x) {
            var qstring = "?tfrom="+x.fromdate+"/"+x.fromtime+"&tto="+x.todate+"/"+x.totime;
            CONFIG.server.GET("/hist/"+x.call+"/trail"+qstring, "", 
                x => {
                    $('#hist_back').addClass('searchMode');
		    t.searchmode = true;
                    CONFIG.tracks.searchMode(true);
                    CONFIG.tracks.update(JSON.parse(x), true);
                });
        }
    
        
        /* Export as GPX file - button handler */
        function exportGpx() {
            let parms = 'ntracks=' + t.list.length;
            for (i=0; i < t.list.length; i++)
                parms += '&station' + i + '=' + t.list[i].call + '&tfrom' + i + '=' + t.list[i].fromdate+"/" + 
                    t.list[i].fromtime + '&tto' + i + '=' +  t.list[i].todate + "/" + t.list[i].totime;
 
            document.getElementById("downloadframe").src = CONFIG.server.url + '/gpx?' + parms; 
        }
   
   
   
        /* Get search parameters. Save them to localstorage as well */   
        function getSearch() {
            t.item.call(t.item.call().toUpperCase());
            t.item.fromdate = $('#hist_start_date').val();
            if (t.item.open) {
                t.item.totime('-');
                t.item.todate = '-';
            }
            else 
                t.item.todate   = $('#hist_end_date').val();
            
            CONFIG.store('tracking.db.hist.item', JSON.stringify(t.item), false);
        }
    
    
        /* Make a copy of the editable item. Convert stream-values */
        function copyItem() {
            let x = Object.assign({}, t.item);
            x.fromtime = x.fromtime();
            x.totime = x.totime();
            x.call = x.call();
            return x;
        }
        
        
        
    
        /* Add search to list */
        function add() {
            getSearch();
            let x = copyItem();
            t.list.push(x);
            saveList();
        }
    
    
        /* Save list to local storage */
        function saveList() { 
            CONFIG.store('tracking.db.hist', JSON.stringify(t.list), false);
        }
 
    } /* constructor */
    
    
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
            fromdate: null, todate: null,
            fromtime: m.stream(""),
            totime: m.stream("")
        };
    }
    
    
    
    /* Initialize fields of editable item */
    setItem(item) {
        const t = this;
      	if (item) {
            t.item = newItem(item);
            CONFIG.store('tracking.db.hist.item', JSON.stringify(t.item), false);
            m.redraw();
        }
        else {
            t.item = JSON.parse(CONFIG.get('tracking.db.hist.item'));
            if (t.item != null) {
                t.item.call = m.stream(t.item.call);
                t.item.fromtime = m.stream(t.item.fromtime);
                t.item.totime = m.stream(t.item.totime);
            }
        }
        if (t.item==null) 
            t.item = t.newItem();
        
        
        if (t.item.fromdate == null)
            t.item.fromdate = formatDate(new Date());
        if (t.item.todate == null || t.item.todate == '-')
            t.item.todate = formatDate(new Date());
        if (t.item.fromtime() == '')
            t.item.fromtime(formatTime(new Date()));
        if (t.item.totime() == '' || t.item.totime() == '-')
            t.item.totime(formatTime(new Date()));  
        return t;
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



pol.widget.setFactory( "tracking.db.History", {
        create: () => new pol.tracking.db.History()
    }); 

