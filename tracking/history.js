 
/*
 Map browser based on OpenLayers 4. Tracking. 
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
 * @classdesc
 * Reference search (in a popup window). 
 * @constructor
 */

pol.tracking.db.History = function()
{
    pol.core.Widget.call(this);
    var t = this;
    
    t.classname = "tracking.db.History"; 
    t.server = CONFIG.server;
    t.item = null;
    t.list = []; 
    
    var it = null;
    
    var showList = {
        view: function() {
            var i=0;
            return m("div.histt", m("table", t.list.map(function(x) {
                return m("tr", 
                    m("td", [ 
                        m("img", { src:"images/edit-delete.png", onclick:apply(deleteItem, i) }),
                        m("img", { src:"images/edit.png", onclick:apply(editItem, i) }) 
                    ]),
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
                m("form.hist", [ 
                    m("span.sleftlab", "Callsign: "),
                    m(textInput, {id:"hist_call", value: t.item.call, size: 10, maxLength:20, 
                        regex: /^.+$/i }),br,
                    m("span.sleftlab", "Start: "),
                    m(dateTimeInput, {id: "hist_start", dvalue: t.item.fromdate, tvalue: t.item.fromtime}), br,
                    m("span.sleftlab", "End: "),
                    m(dateTimeInput, {id: "hist_end", dvalue: t.item.todate, tvalue: t.item.totime}), 
                    m(checkBox, {id: "hist_open", onclick: hOpen, checked: t.item.open}, "Open end"), br,
                  
                    m(showList),
                  
                    m("input#hist_b1", {type: "button", value: "Search", onclick: search}),
                    m("input#hist_b2", {type: "button", value: "Add", onclick: add}),
                    m("input#hist_b3", {type: "button", value: "Show all", onclick: showAll}),
                    m("input#hist_b4", {type: "button", value: "Export", onclick: exportGpx}),
                    m("input#hist_b5", {type: "button", value: "Reset"})
                ]),
                m("iframe#downloadframe", {style: "display:none"})
            ]);
        }
    };
    
    
    
    t.list = JSON.parse(CONFIG.get('tracking.db.hist'));
    t.item = JSON.parse(CONFIG.get('tracking.db.hist.item'));
    if (t.list==null)
        t.list=[];
    if (t.item==null)
        t.item = {call:'',fromdate:null,fromtime:null,todate:null,totime:null};
    it = Object.assign({},t.item);
    
//    if (t.item.todate == '-' && t.item.totime == '-')
//        setTimeout(hOpen, 500);
    
    if (t.item.fromdate == null)
        t.item.fromdate = formatDate(new Date());
    if (t.item.todate == null || t.item.todate == '-')
        t.item.todate = formatDate(new Date());
    if (t.item.fromtime == null)
        t.item.fromtime = formatTime(new Date());
    if (t.item.totime == null || t.totime == '-')
        t.item.totime = formatTime(new Date());   
    
    console.log("t.item.open="+t.item.open);
    setTimeout(function() {
       $('#hist_end_date, #hist_end_time').prop('disabled', t.item.open);
    }, 300);
    
    /* Apply a function to an argument. Returns a new function */
    function apply(f, id) {return function() { f(id); }};  
    
    
    /* Delete item from list */
    function deleteItem (i) {
        t.list.splice(i, 1);
        saveList();
    }
    
    
    /* Edit item (move it to search form) */
    function editItem (i) {
        var x = t.list[i];
        t.item = x; 

        $("#hist_call").val(x.call).trigger("change");
        $('#hist_start_date').val(x.fromdate).trigger("change");
        $('#hist_start_time').val(x.fromtime).trigger("change");
	if (x.open) {
	   $('#hist_end_date').val(formatDate(new Date())).trigger("change");
	   $('#hist_end_time').val(formatTime(new Date())).trigger("change");
	}
	else {
           $('#hist_end_date').val(x.todate).trigger("change");
	   $('#hist_end_time').val(x.totime).trigger("change");
	}
        $('#hist_open').prop('checked', x.open).trigger("change");
        $('#hist_end_date, #hist_end_time').prop('disabled', x.open);
	m.redraw();
        deleteItem(i);
    }
    
        
    /* Show trail for item */
    function showItem(i) {
        CONFIG.tracks.clear();
        showTrail(t.list[i]);
    }
    
    
    
    /* Search button handler */   
    function search() {
        getSearch();
        CONFIG.tracks.clear();
        showTrail(t.item);
    }

    
   
    /* Show all items button handler */
    function showAll() {
        getSearch();
        CONFIG.tracks.clear();
        for (i in t.list) {
            var x = t.list[i];
            showTrail(x);
        }
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
        t.server.GET("/hist/"+x.call+"/trail"+qstring, "", function(x) { 
            CONFIG.tracks.update(JSON.parse(x));
        });
    }
    
     
    function exportGpx() {
        parms = 'ntracks=' + t.list.length;
        for (i=0; i < t.list.length; i++)
            parms += '&station' + i + '=' + t.list[i].call + '&tfrom' + i + '=' + t.list[i].fromdate+"/" + 
                t.list[i].fromtime + '&tto' + i + '=' +  t.list[i].todate + "/" + t.list[i].totime;
 
        document.getElementById("downloadframe").src = t.server.url + '/gpx?' + parms; 
    }
   
   
   
    /* Get search parameters. Save them to localstorage as well */   
    function getSearch() {
        t.item.call     = $('#hist_call').val().toUpperCase();
        t.item.fromdate = $('#hist_start_date').val();
        t.item.fromtime = $('#hist_start_time').val();
	t.item.open = $('#hist_open').prop('checked');
        if (t.item.open) 
            t.item.todate = t.item.totime = '-';
        else {
            t.item.todate   = $('#hist_end_date').val();    
            t.item.totime   = $('#hist_end_time').val();
        } 
        CONFIG.store('tracking.db.hist.item', JSON.stringify(t.item), false);
    }
    
    
    /* Add search to list */
    function add() {
        getSearch();
        t.list.push(Object.assign({},t.item));
        saveList();
    }
    
    
    /* Save list to local storage */
    function saveList() { 
        CONFIG.store('tracking.db.hist', JSON.stringify(t.list), false);
    }

     
    function formatDate(d)
    {
        return ""+d.getFullYear() + "-" + 
            (d.getMonth()<9 ? "0" : "") + (d.getMonth()+1) + "-" +
            (d.getDate()<10 ? "0" : "")  + d.getDate();
    }
 
 
    function formatTime(d)
    {
        return "" +
            (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
            (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
    }
 
}
ol.inherits(pol.tracking.db.History, pol.core.Widget);




 

pol.widget.setRestoreFunc("tracking.db.History", function(id, pos) {
    var x = new pol.tracking.db.History(); 
    x.activatePopup(id, pos, true); 
}); 
