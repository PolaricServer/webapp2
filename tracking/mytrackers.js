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

pol.tracking.db.MyTrackers = class extends pol.tracking.TrackerAlias {

    constructor() {
        super();
        var t = this;
    
        t.classname = "tracking.db.MyTrackers"; 
        t.myTrackers = [];

        this.widget = {
            view: function() {
                var i=0;
                return m("div#trackerEdit", [       
                    m("h1", "My trackers"),  
                    m("table.mytrackers", m("tbody", t.myTrackers.map(x => {
                        return m("tr", [
                            m("td",
                                m(removeEdit, {remove: apply(remove,i), edit: apply(edit, i++)})),
                            m("td", {onclick: apply(goto, x.id)}, x.id),
                            m("td", x.alias),
                            m("td", (x.icon == null || x.auto ? "" :  m("img.icon", {src:x.icon}))),
                            m("td", (x.active ? m("img", {src:"images/16px/ok.png"}) : ""))
                        ]);
                    }))),
                    m(t.aliasWidget),
                    m("div.butt", [
                        m("button", { type: "button", onclick: add }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear")
                    ])
                ])
            }
        };
    
        if (!t.server.hasDb)
            return;


        getTrackers();        
        setInterval(getTrackers, 120000);
        // FIXME: Use pubsub service? 
        
    
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    
    
        /* Get list of trackers from server */
        function getTrackers() {
            const userid = t.server.auth.userid;
            console.assert(userid && userid!=null, "userid="+userid);
            if (userid == null)
                return;
            t.server.GET("trackers", "", x => { 
                t.myTrackers = JSON.parse(x);
                for (var tt of t.myTrackers) 
                    t.setIcon(tt, tt.icon); 
                
                m.redraw();
            } );
        }
        
  
  
        /* Add a tracker to the list. Update if it already exists */
        function add() {
            let icn = $("#iconpick").get(0).value; 
            let icn2 = icn.substr(icn.lastIndexOf("/")+1);
            console.log("id=", t.edit.id());
            
            const data = {
                id: t.edit.id().toUpperCase(), 
                user: t.server.auth.userid, 
                alias: t.edit.alias(),
                icon: (t.edit.auto ? null : icn2)
            };
            
            if (data.alias=="") 
                data.alias = null;
            if (data.id == null || data.id == "")
                return; 
            
            t.server.POST("trackers", JSON.stringify(data), 
                x => {
                    console.log("Added/updated tracker: "+data.id);
                    removeDup(data.id);
                    data.auto = t.edit.auto; 
                    data.icon = (t.edit.auto ? t.icons[t.dfl] : icn);
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
	      t.server.DELETE("trackers/"+tr.id, 
		  x => {
		     console.log("Removed tracker: "+tr.id);
		     t.myTrackers.splice(i, 1);
		     m.redraw();
		  } );
        }
        
        
        function edit(i) { 
            const tr = t.myTrackers[i]; 
            t.edit.id(tr.id);
            t.edit.alias(tr.alias);
            t.edit.icon = tr.icon; 
            t.edit.user = tr.user; 
            t.iconGrey();
            $("#iconpick>img").attr("src", (tr.auto? t.icons[t.dfl] : tr.icon)).trigger("change");
            m.redraw();
        } 
    
    
        function goto(id) {
            if (CONFIG.tracks)
                CONFIG.tracks.goto_Point(id);
        }
 
    } /* constructor */


} /* class */




pol.widget.setFactory( "tracking.db.MyTrackers", {
        create: () => new pol.tracking.db.MyTrackers()
    }); 
