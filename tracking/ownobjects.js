/*
 Map browser based on OpenLayers 5. Tracking.
 Search historic data on tracker points on server.

 Copyright (C) 2019-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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

pol.tracking.OwnObjects = class extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";

        t.obj = {
            ident: m.stream(""),
            pos: [0,0],
            sym: m.stream("c"),
            symtab: m.stream("/"),
            comment: m.stream(""),
            perm: false
        }

        t.olist = [];
        t.classname = "tracking.OwnObjects";

        this.widget = {
            view: function() {
                var i=0;
                return m("div#aprsObject", [
                    m("h1", "Add APRS object"),

                    m("div.itemList", t.olist.map( x=> {
                        return [ m("span", [
                            m("img",  {src: "images/edit-delete.png", onclick: pol.ui.apply((x)=>t.remove(x), x)}),
                            m("span", {onclick: pol.ui.apply(zoomTo, x)}, x), nbsp]
                        ), " "]
                    })),
                    m("div.errmsg", errmsg),

                    m("div.field",
                        m("span.sleftlab", "Object ID: "),
                        m(textInput, {id:"objid", value: t.obj.ident, size: 10, maxLength:9,
                            regex: /^[a-zA-Z0-9\_\-\.\#]{1,9}$/i })) ,

                    m("div.field",
                        m("span.sleftlab", "Symbol: "),
                        m(textInput, {id:"symtab", size: 1, maxLength:1, value: t.obj.symtab, regex: /[\/\\a-zA-Z]/i }),
                        m(textInput, {id:"symbol", size: 1, maxLength:1, value: t.obj.sym, regex: /[a-zA-Z]/i }),
                        m(select, {
                            id: "symSelect",
                            onchange: onSymSelect,
                                list: [
                                    {label: "Post", val: '/c'},
                                    {label: "Sign", val: '\\m'},
                                    {label: "Cross", val: '\\.'},
                                    {label: "Triangle", val: '\\n'},
                                    {label: "Red Cross", val: '/+'},
                                    {label: "OPS/EOS", val: '/o'},
                                    {label: "Radio Station", val: '/r'}
                                ]})),

                    m("div.field",
                        m("span.sleftlab", "Description: "),
                        m(textInput, {id:"descr", value: t.obj.comment, size: 32, maxLength:64, regex: /^.+$/i })),

                    m("div.field",
                        m("span.sleftlab", "Pos (UTM): "),
                        m(utmInput, {value: t.obj.pos})),

                    m("div.field",
                        m("span.sleftlab", "Settings:"),
                        m(checkBox, {id:"perm", onclick: toggleTimeless, checked: (t.obj.perm) },
                            "Timeless (permanent)" )),

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

        /* Handler for when user selects symbol */
        function onSymSelect () {
            const sym = $('#symSelect').val();
            t.obj.symtab(sym[0]);
            t.obj.sym(sym[1]);
            m.redraw();
        }

        /* Handler for toggle of timeless */
        function toggleTimeless()
            {t.obj.perm = (t.obj.perm ? false: true); }


        /* Update object on backend (through REST call */
        function update() {
            if (t.obj.pos[0]==0 && t.obj.pos[1]==0) {
                error("Invalid position");
                return;
            }
            srv.POST("aprs/objects", JSON.stringify(t.obj),
                    ()=> { t.getObjects() },
                    x=> {
                        error(x.responseText);
                        console.warn("Server: "+errmsg);
                    }
                );
        }


        function error(txt) {
            errmsg = txt;
            setTimeout(()=>{errmsg="";m.redraw();}, 6000);
            m.redraw();
        }


        /* Zoom to object's location on map */
        function zoomTo(x) {
            CONFIG.tracks.goto_Point(x+"@"+srv.auth.servercall);
        }

    } /* constructor */




    onActivate() {
        this.getObjects();
    }


    /* Clear form fields */
    clear() {
        this.obj.ident("");
        this.obj.comment("");
        this.obj.pos = [0,0];
        this.obj.sym("c");
        this.obj.symtab("/");
        this.obj.perm = false;
        m.redraw();
    }


    /* Set position field from pixel location */
    setPosPix(pix) {
        const llpos = CONFIG.mb.pix2LonLat(pix);
        this.obj.pos = llpos;
        m.redraw();
    }


    /* Get list of objects from backend server */
    getObjects() {
        CONFIG.server.GET("aprs/objects", null,
            x=> { this.olist=GETJSON(x); m.redraw() },
            ()=> { console.warn("Couldn't get object-list"); }
        )
    }


    /* Remove object on backend server */
    remove(x) {
        if (!x || x==null)
            return;
        srv.DELETE("aprs/objects/"+x,
                ()=> { this.getObjects() },
                ()=> { console.warn("Couldn't delete object: "+x); }
            );
    }


} /* class */


pol.widget.setFactory( "tracking.OwnObjects", {
        create: () => new pol.tracking.OwnObjects()
    });
