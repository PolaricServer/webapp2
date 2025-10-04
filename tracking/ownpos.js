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





/**
 * Reference search (in a popup window).
 */

pol.tracking.OwnPos = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";

        t.classname = "tracking.OwnPos";
        t.symtab = m.stream("/");
        t.sym = m.stream("c");
        t.posx = [0,0];

        this.widget = {
            view: function() {
                var i=0;
                return m("div#ownPos", [
                    m("h1", "Position of this server"),

                    m("div.errmsg", errmsg),
                    m("span.sleftlab", "Symbol: "),
                    m(textInput, {id:"symtab", size: 1, maxLength:1, value: t.symtab, regex: /[\/\\a-zA-Z]/i }),
                    m(textInput, {id:"symbol", size: 1, maxLength:1, value: t.sym, regex: /./i }), br,
                    m("span.sleftlab", "Pos (UTM): "),
                    m(utmInput, {value: t.posx}), br,

                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                        m("span#confirm")
                    ])
                ])
            }
        };


        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });


        /* Update object on backend (through REST call */
        function update() {
            if (t.posx[0]==0 && t.posx[1]==0) {
                error("Invalid position");
                return;
            }
            const info = {symtab: t.symtab(), sym: t.sym, pos: t.posx};
            srv.PUT("system/ownpos", JSON.stringify(info),
                    ()=> {
                        console.log("Own position updated ok");
                        $("#confirm").text("Updated");
                        setTimeout(()=> $("#confirm").text(""), 5000);
                    },
                    x=> {
                        error(x.responseText);
                        console.warn("Server: "+errmsg);
                    }
                );
        }


        function error(txt) {
            errmsg = txt;
            setTimeout(()=>{errmsg="";m.redraw();}, 10000);
            m.redraw();
        }


        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};

    } /* constructor */



    /* Clear form fields */
    clear() {
        this.posx = [0,0];
        this.sym("c");
        this.symtab("/");
        m.redraw();
    }


    /* Set position field from pixel location */
    setPosPix(pix) {
        const llpos = CONFIG.mb.pix2LonLat(pix)
        this.posx = llpos;
        m.redraw();
    }



} /* class */



pol.widget.setFactory( "tracking.OwnPos", {
        create: () => new pol.tracking.OwnPos()
    });

