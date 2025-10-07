/*
 Map browser based on OpenLayers 5. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2018-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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


var pol = window.pol;
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
        t.editMode = false;
        t.psclient = null;
        t.userList = [];
        t.user = m.stream("");

        this.widget = {
            view: function() {
                var i=0;
                return m("div#trackerEdit", [
                    m("h1", "My trackers"),
                    m("table.mytrackers", m("tbody", t.myTrackers.map(x => {
                        return m("tr", [
                            m("td",
                                m(removeEdit, {remove: pol.ui.apply(remove,i), edit: pol.ui.apply(edit, i++)})),
                            m("td", {onclick: pol.ui.apply(goto, x.id)}, x.id),
                            m("td", x.alias),
                            m("td", (x.icon == null || x.auto ? "" :  m("img.icon", {src:x.icon}))),
                            m("td", (x.active ? m("img", {src:"images/16px/ok.png"}) : ""))
                        ]);
                    }))),


                    m("div.field#owner",
                        m("span.xsleftlab", {title: "Optional: Move tracker to another user"}, "Owner:"),
                        m(textInput, {list: "userList", value: t.user}),
                        m("datalist#userList", t.userList.map( x=> {
                            return m("option", x)
                        }))),

                    m(t.aliasWidget),
                    m("div.butt", [
                        m("button", { type: "button", disabled: !addMode(), onclick: add }, "Add"),
                        m("button", { type: "button", disabled: !updateMode(),  onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                        m("button", { type: "button", onclick: ()=> {resetAll();} }, "Reset All"),
                        m("button", { type: "button", onclick: ()=> {tags();} }, "Tags"),
                    ])
                ])
            }
        };

        if (!t.server.hasDb)
            return;


        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });


        getTrackers();
        setInterval( ()=> {
            if (t.isActive())
                t.getTrackers();
        }, 120000);


        t.server.GET("usernames", null,
            x=> {
                t.userList=GETJSON(x);
                t.userList.sort((x,y)=> {return x > y});
                m.redraw()
            },
            ()=> { console.warn("Couldn't get user list"); }
        );


        function addMode() {
            if (t.edit.id() == null || t.edit.id() == "")
                return false;
            return !t.editMode;
        }
        function updateMode() {
            if (t.edit.id() == null || t.edit.id() == "")
                return false;
            return t.editMode;
        }


        /* Get list of trackers from server */
        function getTrackers() {
            const userid = t.server.auth.userid;
            console.assert(userid && userid!=null, "userid="+userid);
            if (userid == null)
                return;

            t.server.GET("trackers", "", x => {
                /* Subscribe to pubsub room */
                if (t.psclient == null)
                    t.psclient = t.server.pubsub.subscribe("trackers:"+userid, x => {
                        getTrackers();
                    });

                /* Parse result */
                t.myTrackers = GETJSON(x);
                for (var tt of t.myTrackers)
                    t.setIcon(tt, tt.icon);

                m.redraw();
            } );
        }



        /* Add a tracker to the list.*/
        function add() {
            let icn = $("#iconpick").get(0).value;
            addItem(t.edit.id().toUpperCase(), t.user(), t.edit.alias(), t.edit.auto, icn);
        }

        /* Update item */
        function update() {
            let icn = $("#iconpick").get(0).value;
            updateItem(t.edit.id().toUpperCase(), t.user(), t.edit.alias(), t.edit.auto, icn);
        }

        /* Reset all items */
        function resetAll() {
            for (const x of t.myTrackers)
                updateItem(x.id, t.user(), "", true, "");
        }

        function tags() {
            WIDGET("tracking.Tags", [150,150], false, x=> x.setIdent("mytrackers"));
        }


        function addItem(id, user, alias, auto, icn) {
            if (id == null || id == "")
                return;
            let data = createItem(id, user, alias, auto, icn);

            t.server.POST("trackers", JSON.stringify(data),
                x => {
                    console.log("Added tracker: "+data.id);
                    updateList(data, auto, icn, x);
                },
                x => {
                    console.log("Add tracker -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot add tracker: " + data.id+
                        '\n"' + x.responseText + '"');
                }
            );
        }


        function updateItem(id, user, alias, auto, icn) {
            if (id == null || id == "")
                return;
            let data = createItem(id, user, alias, auto, icn);
            if (user != "" && user != t.server.auth.userid)
                if (confirm("Transfer '"+id+"' to user '"+user+"' - are you sure?")==false)
                    return;

            t.server.PUT("trackers/"+id, JSON.stringify(data),
                x => {
                    console.log("Updated tracker: "+id);
                    updateList(data, auto, icn, x);
                },
                x => {
                    console.log("Update tracker -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot update tracker: " + id+
                        '\n"' + x.responseText + '"');
                }
            );
        }


        function createItem(id, user, alias, auto, icn) {
            const icn2 = icn.substr(icn.lastIndexOf("/")+1);
            return {
                id: id,
                user: (user != null ? user : t.server.auth.userid),
                alias: (alias=="" ? null: alias),
                icon: (auto ? null : icn2)
            };
        }



        function updateList(data, auto, icn, x) {
            removeDup(data.id);
            data.auto = auto;
            data.icon = (auto ? t.icons[t.dfl] : icn);
            if (x=="OK-ACTIVE")
                data.active=true;
            t.myTrackers.push(data);
            sortList();
            m.redraw();
        }


        function sortList() {
            t.myTrackers.sort((a,b)=> { return (a.id < b.id ? -1 : 1); });
        }



        /* Remove a tracker from the client side list (a duplicate) */
        function removeDup(id) {
            for (const i in t.myTrackers)
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
            t.editMode = true;
            t.iconGrey();
            $("#iconpick>img").attr("src", (tr.auto? t.icons[t.dfl] : tr.icon)).trigger("change");
            m.redraw();
        }


        function goto(id) {
            if (CONFIG.tracks)
                CONFIG.tracks.goto_Point(id);
        }

    } /* constructor */


    onIdEdit() {
        for (const x of this.myTrackers)
            if (this.edit.id() == x.id) {
                this.editMode=true;
                return;
            }
        this.editMode=false;
    }


    onclose() {
        const id = this.server.auth.userid
        if (id != null && this.psclient != null)
            this.server.pubsub.unsubscribe("telemetry:"+id, this.psclient);
        this.psclient = null;
        super.onclose();
    }


    clear() {
        super.clear();
        this.user("");
    }

} /* class */




pol.widget.setFactory( "tracking.db.MyTrackers", {
        create: () => new pol.tracking.db.MyTrackers()
    });