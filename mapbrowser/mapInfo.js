/*
 Map browser based on OpenLayers 5.

 Copyright (C) 2017-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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



/**
 * User defined areas (in a popup window).
 */

pol.core.MapInfo = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        t.classname = "core.MapInfo";
        t.baselayer = CONFIG.mb.getBaseLayer();

        this.widget = {
            view: function() {
                let i=0;
                return m("div", [
                    m("h1", "Map view info"),
                    m("div.field",
                        m("span.sleftlab", "Base layer:"),
                        m("span", CONFIG.mb.getBaseLayer().values_.name)
                    ),
                    m("div.field",
                        m("span.sleftlab", "Projection:"),
                        m("span", CONFIG.mb.getProjection())
                    ),
                    m("div.field",
                        m("span.sleftlab", "Resolution:"),
                        m("span", round3d(CONFIG.mb.getResolution())), nbsp,
                        m("span", "(zoom "+ Math.round(CONFIG.mb.view.getZoom()*1000)/1000+")" )
                    ),
                    m("div.field",
                        m("span.sleftlab", "Scale:"),
                        m("span", Math.round(CONFIG.mb.getScale()))
                    ),
                    m("div.field",
                        m("span.sleftlab", "Extent:"),
                        m("span", showExtent(CONFIG.mb.getExtent()))
                    ),
                    m("div.field",
                        m("span.sleftlab", "Center:"),
                        m("span", showCenter(CONFIG.mb.getCenter()))
                    ),

                    ( CONFIG.mb.getResolution() < res_limit() &&  srv.auth.admin ?
                        m("div.butt",
                          m("button", {onclick: seed, title: "Download map tiles for this area"}, "Download Tiles"), "to server"
                        )
                        : ""
                    )
                ])
            }
        }



        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};


        function seed() {
            const res = CONFIG.mb.getResolution();
            if (!res_limit())
                alert("Seeding not supported for this map");
            else if (res > res_limit())
                alert("Seeding not supported in this zoom level");
            else {
                const layers = CONFIG.mb.getBaseLayer().getSource().params_.LAYERS;
                const ext = CONFIG.mb.getExtent();
                const uext = ol.proj.transformExtent(ext, "EPSG:4326",
                    CONFIG.mb.getBaseLayer().getSource().getProjection());

                let x = {args: [
                    layers,
                    ""+Math.round(uext[0]), ""+Math.round(uext[1]), ""+Math.round(uext[2]), ""+Math.round(uext[3])
                ]};
                srv.POST("scripts/seeder", JSON.stringify(x),
                         ()=> alert("Tile downloading started.."),
                         ()=> alert("Couldn't start tile downloading on server") );
            }
        }

        getWIDGET("core.LayerSwitcher");

        function res_limit() {
            return CONFIG.mb.getBaseLayer().values_.max_res;
               // FIXME
        }

        function round3d(x) {
            return Math.round(x * 1000)/1000;
        }

        function showExtent(x) {
            return "["+round3d(x[0])+", "+round3d(x[1])+", "+round3d(x[2])+", "+round3d(x[3])+"]";
        }

        function showCenter(x) {
            return "["+round3d(x[0])+", "+round3d(x[1])+"]";
        }
    } /* constructor */
} /* class */




pol.widget.setFactory( "core.MapInfo", {
        create: () => new pol.core.MapInfo()
    });
