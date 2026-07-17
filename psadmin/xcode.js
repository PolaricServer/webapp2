/*
 Map browser based on OpenLayers. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2020-2026 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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
window.pol.psadmin = window.pol.psadmin || {};

/**
 * Generate extended verification code
 */

pol.psadmin.XCode = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.classname = "psadmin.XCode";
        t.callsign = m.stream("");
        t.passcode = "--";


        this.widget = {
            view: function() {
                return m("div#xcode", [
                    m("h1", "Extended verification code  "),
                    m("span.pwintro", "Please enter a callsign (or username). It is case-sensitive"),
                    m("div.field",
                        m("span.sleftlab", "Callsign:"),
                        m(textInput, { id:"callsign", value: t.callsign, size: 16,
                            maxLength:32, regex: /.*/i })),
                         
                    m("div.field", 
                        m("span.sleftlab", "Passcode:"),
                        m("span.passcode", t.passcode)
                    ), 
                          
                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Generate"),
                    ]),
                ])
            }
        };



        /* Update a user (on server) */
        function update() {
            
            t.server.GET("system/xcode/"+t.callsign(), "", 
                x => {
                    t.passcode = x;
                    m.redraw();
                },
                x => {
                    alert("Cannot get passcode." +
                        '\n"' + x.responseText + '"');
                }
            );
        }

    } /* constructor */


    onActivate() {
        m.redraw();
    }

} /* class */




pol.widget.setFactory( "psadmin.XCode", {
        create: () => new pol.psadmin.XCode()
    });
