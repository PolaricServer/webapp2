/*
 Map browser based on OpenLayers. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2020-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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


pol.psadmin = pol.psadmin || {};

/**
 * Reference search (in a popup window).
 */

pol.psadmin.Passwd = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "psadmin.Passwd";
        t.passwd1 = m.stream("");
        t.passwd2 = m.stream("");



        this.widget = {
            view: function() {
                return m("div#pwdEdit", [
                    m("h1", "Change your password"),
                    m("div.field",
                        m("span.xsleftlab", "Password:"),
                        m(textInput, { id:"passwd1", value: t.passwd1, size: 16,
                            maxLength:32, regex: /.*/i, passwd: true })),

                    m("div.field",
                        m("span.xsleftlab", "Repeat it:"),
                        m(textInput, { id: "passwd2", value: t.passwd2, size: 16,
                            maxLength: 32, regex: /.*/i, passwd: false })),


                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                    ]),
                ])
            }
        };



        /* Update a user (on server) */
        function update() {
            if (t.passwd1() != t.passwd2()) {
                alert("Passwords do not match.");
                return;
            }
            const data = {
                passwd: t.passwd1()
            };

            t.server.PUT("mypasswd", JSON.stringify(data),
                x => {
                    alert("Password updated ok.");
                },
                x => {
                    console.log("Update passwd -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot update password." +
                        '\n"' + x.responseText + '"');
                }
            );
        }

    } /* constructor */


    onActivate() {
        this.passwd1("");
        this.passwd2("");
        setTimeout(()=>$("#passwd1").val(""), 100);
        // Strange bug workaround
        m.redraw();
    }

} /* class */




pol.widget.setFactory( "psadmin.Passwd", {
        create: () => new pol.psadmin.Passwd()
    });
