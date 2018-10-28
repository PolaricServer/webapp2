 
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
        t.edit = {id:"", alias:"", icon: "", auto: true};
        t.icons = [];
        t.iconpath = CONFIG.get("iconpath");
        t.dfl = CONFIG.get("default_icon");

        this.widget = {
            view: function() {
                var i=0;
                return m("div#trackerEdit", [       
                    m("h1", "My trackers"),  
                    m("table.mytrackers", m("tbody", t.myTrackers.map(x => {
                        return m("tr", [
                            m("td", m("img", {src:"images/edit-delete.png", onclick: apply(remove, i) }), 
                                m("img", {src:"images/edit.png", onclick: apply(edit, i++) })),
                            m("td", {onclick: apply(goto, x.id)}, x.id),
                            m("td", x.alias),
                            m("td", (x.icon == null ? "" :  m("img", {src:x.icon}))),
                            m("td", (x.active ? m("img", {src:"images/16px/ok.png"}) : ""))
                        ]);
                    }))),
                    m("div", [
                        m("span.xsleftlab", "Ident:"),
                        m(textInput, 
                            { id:"addTracker", value: t.edit.id, size: 16, 
                                maxLength:25, regex: /^[^\<\>\'\"]+$/i }), br,
                         
                        m("span.xsleftlab", "Alias:"),
                        m(textInput,
                            { id: "alias", value: t.edit.alias, size: 16,
                                maxLength: 32, regex: /.*/i }), br,
                    
                        m("span.xsleftlab", "Icon:"), 
                            m(iconPick, {value: t.edit.icon, icons: t.icons, default: t.dfl, id: "iconpick"} ),
                        m("span#auto", 
                            m(checkBox, {id: "symbol-auto", onclick: auto, checked: t.edit.auto}, "Automatic")
                        ),br,
                        m("span#butt", [
                            m("button", { onclick: add }, "Update"),
                            m("button", { onclick: clear }, "Clear")
                        ])
                    ])
                ])
            }
        };
    

        /* Get icons from server */
        t.server.GET("/system/icons/default", "", x => {
            t.icons = JSON.parse(x);
            for (i in t.icons)
               t.icons[i] = t.iconpath + t.icons[i];
            sortList();
            m.redraw();
        });
        getTrackers();
        setTimeout( iconGrey, 500); 
        
        setInterval(getTrackers, 120000);
        // FIXME: Use pubsub service? 
        
    
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    
    
        /* Get list of trackers from server */
        function getTrackers() {
            t.server.GET("/users/"+t.server.auth.userid+ "/trackers", "", x => { 
                t.myTrackers = JSON.parse(x);
                for (var tt of t.myTrackers)
                    tt.icon = t.iconpath+"/icons/"+tt.icon; 
                m.redraw();
            } );
        }
        
        
        function clear() {
            t.edit.auto = true; 
            $("#alias").val("").trigger("change");
            $("#iconpick>img").attr("src", t.icons[t.dfl]).trigger("change");
            add();
        }
  
  
        /* Add a tracker to the list. Update if it already exists */
        function add() {
            let icn = $("#iconpick").get(0).value; 
            let icn2 = icn.substr(icn.lastIndexOf("/")+1);

            const data = {
                id: $("#addTracker").val().toUpperCase(), 
                user: t.server.auth.userid, 
                alias: $("#alias").val(), 
                icon: (t.edit.auto ? null : icn2)
            };
            if (data.alias=="") 
                data.alias = null;
            if (data.id == null || data.id == "")
                return; 
            
            t.server.POST("/users/"+t.server.auth.userid+ "/trackers", 
                JSON.stringify(data), 
                x => {
                    console.log("Added/updated tracker: "+data.id);
                    removeDup(data.id);
                    data.icon = (t.edit.auto ? null : icn);
                    if (x=="OK-ACTIVE")
                        data.active=true;
                    t.myTrackers.push(data);
                    sortList();
                    m.redraw();
                },
                x => {
                    console.log("Update tracker -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot add/update tracker: " + data.id+
                        '\n"' + x.responseText + '"');
                }
            );
        }
  
  
        /* Automatic checkbox handler */
        function auto() {
            t.edit.auto = (t.edit.auto ? false : true);
            iconGrey();
        }
        
        
        /* Grey out icon if automatic is set */
        function iconGrey() {
            if (t.edit.auto) {
                $("#iconpick>img").css("background", "grey");
                $("#iconpick>img").css("opacity", "0.5");
            }
            else {
                $("#iconpick>img").css("background", "");
                $("#iconpick>img").css("opacity", "");
            }
        }
        
        
  
        function sortList() {
            t.myTrackers.sort((a,b)=> { return (a.id < b.id ? -1 : 1); });
        }
	
  
  
        /* Remove a tracker from the client side list (a duplicate) */
        function removeDup(id) {
            for (i in t.myTrackers) 
                if (id==t.myTrackers[i].id)
                    t.myTrackers.splice(i, 1);
        }
        
        
  
        /* Delete a tracker from the list */
        function remove(i) {
	      const tr = t.myTrackers[i]; 
	      t.server.DELETE("/users/"+t.server.auth.userid+ "/trackers/"+tr.id, 
		  x => {
		     console.log("Removed tracker: "+tr.id);
		     t.myTrackers.splice(i, 1);
		     m.redraw();
		  } );
        }
        
        
        function edit(i) { 
            const tr = t.myTrackers[i]; 
            t.edit = tr;
            tr.auto = (tr.icon == null);
            iconGrey();
            $("#addTracker").val(tr.id).trigger("change");
            $("#alias").val(tr.alias).trigger("change");
            $("#iconpick>img").attr("src", (tr.auto? t.icons[t.dfl] : tr.icon)).trigger("change");
            m.redraw();
        } 
    
    
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
    
    
    setIdent(id) {
        $("#addTracker").val(id).trigger("change");
    }

} /* class */


 

pol.widget.setRestoreFunc("tracking.db.MyTrackers", function(id, pos) {
    if (!CONFIG.server.loggedIn)
        return;
    var x = new pol.tracking.db.MyTrackers(); 
    x.activatePopup(id, pos, true); 
}); 
