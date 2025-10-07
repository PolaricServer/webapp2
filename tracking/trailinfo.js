/*
 Map browser based on OpenLayers 5. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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
/**
 * Reference search (in a popup window).
 */

pol.tracking.TrailInfo = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";

        t.classname = "tracking.TrailInfo";
        t.tlist = [];
        t.callsign = "";

        this.showList = {
            view: function() {
                return m("table",
                    m("thead", m("tr", [
                        m("th", "Time"), m("th", "Km/h"), m("th", "Dir"), m("th", "Dist"), m("th", "Path")])),
                    m("tbody",t.tlist.map( x => {
                        return m("tr", [
                            m("td", formatTime(x.time)),
                            m("td", x.speed),
                            m("td", formatDir(x.course)),
                            m("td", formatDist(x.dist)),
                            m("td", x.path)
                        ])
                    }))
                )
            }
        };


        this.widget = {
            view: function() {
                return m("div#trail", [
                    m("h1", "Last movements"),
                    m("span", t.callsign),br,
                    m("div#trailresult")
                ])
            }
        };


        function formatDist(x) {
            if (x > 1000)
                return Math.round(x/100)/10 + " km";
            else
                return x + " m";
        }


        function formatDir(x) {
            if (x < 0) return "-";
            else if (x < 22.5) return "N";
            else if (x < 67.5) return "NE";
            else if (x < 112.5) return "E";
            else if (x < 157.5) return "SE";
            else if (x < 202.5) return "S";
            else if (x < 247.5) return "SW";
            else if (x < 292.5) return "W";
            else if (x < 337.5) return "NW";
            else return "N";
        }


        function formatTime(dt) {
            const d = new Date(dt);
            return "" +
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
        }

    } /* constructor */


    getTrail(ident) {
        console.assert(ident && ident != null, "Assertion failed");
        this.callsign=ident;
        m.redraw();
        if (!ident || ident==null)
            return;
        CONFIG.server.GET("item/"+ident+"/trail", null,
            x=> {
                this.tlist = GETJSON(x);
                /*
                 * Mount mithril component for resulting table to #ttable div
                 * make table scrollable.
                 */
                m.mount($("div#trailresult").get(0), this.showList);
                this.setScrollTable("div#trail", "div#trailresult");
            },
            ()=> { console.warn("Couldn't get object-list"); }
        )
    }

} /* class */


pol.widget.setFactory( "tracking.TrailInfo", {
        create:   () => new pol.tracking.TrailInfo(), // Instantiate
        onRestore: NaN /* To be called when automatic restore */
    });


