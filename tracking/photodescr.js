/*
 Map browser based on OpenLayers. Tracking.
 Modify description of a photo

 Copyright (C) 2019-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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

pol.tracking.db.PhotoDescr = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.classname = "tracking.db.PhotoDescr";
        t.server = CONFIG.server;
        t.edit = m.stream("");
        t.ident = null;


        this.widget = {
            view: function() {
                const ident = (t.ident==null ? null : t.ident.replace(/^(__db\.)/, ""));
                return m("div", [
                    m("h1", "Photo title"),
                    (t.errmsg != null ? m("div#errmsg", t.errmsg) : null),
                    (t.successmsg != null ? m("div#successmsg", t.successmsg) : null),

                    m("span#objname", "Photo: " + ident),
                    m("form.photoDescr", [

                        m(textInput,
                            { id:"photoDescr", value: t.edit, size: 22,
                                maxLength:25, regex: /^.*$/i }),

                        m("div.butt",
                            m("button", { type: "button", onclick: update }, "Update"),
                            m("button", { type: "button", onclick: clear }, "Clear")
                        )

                    ])
                ])
            }
        };


        function update() {
            const ident = t.ident.replace(/^(__db\.)/, "");
            t.server.PUT("photos/"+ident+"/descr", JSON.stringify(t.edit()),
                ()=> { t.successMsg("Title updated", 10000) },
                x => { t.errMsg("Cannot update: "+x.responseText, 10000) }
            )
        }



        /* Clear input fields */
        function clear() {
            t.edit("");
        }

    } /* constructor */



    setIdent(id, descr) {
        console.log("SET IDENT: ", id, descr);
        this.ident = id;
        this.edit(descr);
        m.redraw();
    }






} /* class */




pol.widget.setFactory( "tracking.db.PhotoDescr", {
        create: () => new pol.tracking.db.PhotoDescr()
    });
