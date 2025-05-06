 
/*
 Map browser based on OpenLayers. Tracking. 
 Search historic data on heard tracker points on server.  
 
 Copyright (C) 2018-24 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.tracking.db.HeardVia = class extends pol.core.Widget {
    
    constructor(item) {
        super();
        var t = this;
    
        t.classname = "tracking.db.HeardVia"; 
        t.item = {call:m.stream(item), fromdate:null, todate:null};
        t.list = []; 
        t.colors = ["c008", "00c8", "a0a8", "0a08", "0008"];
        t.color = 0;
        t.searchmode = false; 
    
        var it = null;
    
        var showList = {
            view: function() {
                var i=0;
                return m("div.hrdvia", m("table", t.list.map( x => {
                    return m("tr", 
                        m("td", 
                            m(removeEdit, {remove: apply(deleteItem, i), edit: apply(editItem, i)})),
                        m("td", {onclick:apply(showItem, i++)}, x.call), 
                        m("td", x.fromdate),
                        m("td", x.todate),
                        m("td", {style: 'background: #'+x.color})
                    );
                })))
            }
        }
    
    
        t.color = 0;
        t.widget = {
            view: function() {
                return m("div", [
                    m("h1", "Heard points via"),
                    m(showList),    
                    m("form.hrd", [ 
                        m("div.field", 
                            m("span.sleftlab", "Callsign: "),
                            m(textInput, {id:"hrd_call", value: t.item.call, size: 10, maxLength:20, 
                                regex: /^.+$/i })),
                        
                        m("div.field", 
                            m("span.sleftlab", "Start: "),
                            m(Datepick, {id: "hrd_start", value: t.item.fromdate})),
                      
                        m("div.field", 
                            m("span.sleftlab", "End: "),
                            m(Datepick, {id: "hrd_end", value: t.item.todate}), 
                            m(checkBox, {id: "hrd_open", onclick: hOpen, checked: t.item.open, 
                                title: "If checked, end-date is today" }, "Open end")), 
                        
                        m("div.hrdbutt", [
                            m("button#hrd_b1", {type: "button", onclick: search}, "Search"),
                            m("button#hrd_b2", {type: "button", 
                                title: "Add search to list", onclick: add}, "Add"),
                            m("button#hrd_b3", {type: "button", 
                                title: "Show coverage for all stns in list", onclick: showAll}, "Show all"),
                            m("button#hrd_back", {type: "button",  
                                title: "Return to realtime tracking", onclick: goBack}, "Back")
                        ])
                    ])
                ]);
            }
        };
    
    
        CONFIG.get('tracking.db.hrd').then( x=> { 
            t.list = JSON.parse(x);
            if (t.list == null)
                t.list = []; 
        });
        
        CONFIG.get('tracking.db.hrd.color').then( x=> {
            t.color = JSON.parse(x);
            if (!t.color || t.color==null)
                t.color = 0;
        });

        t.setItem(item);
        
        setTimeout( 
            () => $('#hrd_end').prop('disabled', t.item.open), 
            300 );
    
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    	    t.color = 0;
        
            
        function toIsoString(d, t) {
            const dt = new Date(d+" "+t);
            return dt.toISOString();
        }
        
        
        /* Delete item from list */
        function deleteItem (i) {
            t.list.splice(i, 1);
            saveList();
        }
    
    
        /* Edit item (move it to search form) */
        function editItem (i) {
            let x = Object.assign({}, t.list[i]);
            x.call = m.stream(x.call);
            t.item = x;

            $('#hrd_start').val(x.fromdate).trigger("change");
            if (x.open) {
                $('#hrd_end').val(formatDate(new Date())).trigger("change");
            }
            else {
                $('#hrd_end').val(x.todate).trigger("change");
            }
            $('#hrd_open').prop('checked', x.open).trigger("change");
            $('#hrd_end').prop('disabled', x.open);
            m.redraw();
            deleteItem(i);
        }
    
    
        /* Search button handler */   
        function search() {
            getSearch();
            CONFIG.tracks.clear();
            showCloud(copyItem(t.item));
        }
        
        
        function showItem(i) {
            CONFIG.tracks.clear();
            showCloud(t.list[i]);
        }
        
   
        /* Show all items button handler */
        function showAll() {
            CONFIG.tracks.clear();
            for (const x of t.list)
                setTimeout(() => showCloud(x, x.color), 100);
        }
    
        /* Return to realtime tracking mode */
        function goBack() {
            if (!t.searchmode)
                return;
            t.searchmode = false;
            $('#hrd_back').removeClass('searchMode');
            CONFIG.tracks.searchMode(false);
        }
        
    
        /* Toggle the open end checkbox */
        function hOpen() {
            if (!t.item.open) 
                $('#hrd_end').prop('disabled',true);
            else 
                $('#hrd_end').prop('disabled',false);

            t.item.open = !t.item.open;
            $('#hrd_open').prop('checked', t.item.open);
        }
       
    
        /* Show the cloud for a given item */
        function showCloud(c, color) {
            var qstring = "?tfrom=" + toIsoString(c.fromdate,"00:00") + "&tto="
                + (c.todate=='-' ? '-/-' : toIsoString(c.todate,"23:59") );
                
            CONFIG.server.GET("/hist/"+c.call+"/hrdvia"+qstring, "", 
                x => {
                    $('#hrd_back').addClass('searchMode');
                    t.searchmode = true;
                    CONFIG.tracks.searchMode(true);
                    const pc = JSON.parse(x);
                    pc.ident=c.call;
                    pc.color = (color ? color : t.colors[0]); 
                    CONFIG.tracks.update(pc, true);
                });
        }

   
        /* Get search parameters. */   
        function getSearch() {
            t.item.call(t.item.call().toUpperCase());
            t.item.fromdate = $('#hrd_start').val();
            t.item.open = $('#hrd_open').prop('checked');
            if (t.item.open) 
                t.item.todate = '-';
            else 
                t.item.todate   = $('#hrd_end').val();    
            
            CONFIG.storeSes('tracking.db.hrd.item', JSON.stringify(t.item));
        }
        
    
        function copyItem() {
            let x = Object.assign({}, t.item);
            x.call = t.item.call();
            return x; 
        }
            
    
        /* Add search to list */
        function add() {
            getSearch();
            let x = copyItem();
            x.color = t.colors[t.color];
            t.color = (t.color+1) % 5;
            t.list.push(x);
            saveList();
        }
         
    
        /* Save list to local storage */
        function saveList() { 
            CONFIG.store('tracking.db.hrd', JSON.stringify(t.list));
            CONFIG.store('tracking.db.hrd.color', JSON.stringify(t.color)); 
        }
 
    } /* constructor */
    
    
    
    onclose() {
        if (this.searchmode)
            CONFIG.tracks.searchMode(false);
    }

    
    setCall(call) {
        this.item.call(call); 
        m.redraw();
    }
    
    
    async setItem(item) {
        const t = this;
      	if (item) {
            t.item = {call:m.stream(item), fromdate:null, todate:null};
            CONFIG.storeSes('tracking.db.hrd.item', JSON.stringify(t.item));
            m.redraw();
        }
        else {
            t.item = JSON.parse(await CONFIG.get('tracking.db.hrd.item'));
            if (t.item != null)
                t.item.call = m.stream(item);
        }
        if (t.item==null)
            t.item = {call:m.stream(''), fromdate:null, todate:null};
 
        if (t.item.fromdate == null)
            t.item.fromdate = formatDate(new Date());
        if (t.item.todate == null || t.item.todate == '-')
            t.item.todate = formatDate(new Date());
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




pol.widget.setFactory( "tracking.db.HeardVia", {
        create: () => new pol.tracking.db.HeardVia()
    }); 


