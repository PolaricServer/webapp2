/*
 Map browser based on OpenLayers. Tracking.
 Manage own position and tracking

 Copyright (C) 2023-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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
 * Reference search (in a popup window).
 */

pol.psadmin.OwnposConfig = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.classname = "psadmin.OwnposConfig";
        t.txon = false;
        t.allowrf = false;
        t.compress = false;
        t.symbol = m.stream("/.");
        t.digipath = m.stream("");
        t.descr = m.stream("");
        t.pos = [0,0];
        t.gpson = false;
        t.adjustclock = false;
        t.gpsport = m.stream("");
        t.gpsbaud = m.stream("");
        t.minpause = m.stream("");
        t.maxpause = m.stream("");
        t.mindist = m.stream("");
        t.maxturn = m.stream("");

        t.sym = m.stream("c");
        t.symtab = m.stream("/");


        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });


        const symSelect = {
            view: function() {
                return m("span.symselect", [
                    m(pol.ui.textInput, {id:"symtab", size: 1, maxLength:1, value: t.symtab, regex: /[\/\\a-zA-Z]/i }),
                    m(pol.ui.textInput, {id:"symbol", size: 1, maxLength:1, value: t.sym, regex: /[a-zA-Z]/i }),
                    m(pol.ui.select, {
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
                        ]
                    })
                ])
            }
        }



        this.widget = {
            view: function() {
                return m("div#ownposConfig", [
                    m("h1", "Tracking of own position"),

                    (t.errmsg != null ? m("div#errmsg", t.errmsg) : null),
                    (t.successmsg != null ? m("div#successmsg", t.successmsg) : null),

                    m("div.field",
                        m("span.wleftlab", "Position report:"),
                        m(pol.ui.checkBox, {id: "ownpos_txon", onclick: toggleTxon, checked: t.txon},
                            "Activate"),
                        m(pol.ui.checkBox, {id: "ownpos_rf", onclick: toggleRf, checked: t.allowrf},
                            "Allow transmission on RF")),
                    m("div.field",
                        m("span.wleftlab", ""),
                        m(pol.ui.checkBox, {id: "ownpos_compress", onclick: toggleCompress, checked: t.compress},
                            "Compress") ), pol.ui.br,
                    m("div.field",
                        m("span.wleftlab", "Symbol:"),
                        m(symSelect) ),
                    m("div.field",
                        m("span.wleftlab", "Digipeater path:"),
                        m(pol.ui.textInput, { id:"ownpos_digipath", value: t.digipath, size: 28,
                            maxLength:32, regex: /[a-zA-Z0-9\,\-]*/i })),
                    m("div.field",
                        m("span.wleftlab", "Description:"),
                        m(pol.ui.textInput, { id:"ownpos_descr", value: t.descr, size: 28,
                            maxLength:32, regex: /.*/i })), pol.ui.br,
                    m("div.field",
                        m("span.wleftlab", "Default position: "),
                        m(pol.ui.latLngInput, {value: t.pos})), pol.ui.br,

                    m("div.field",
                        m("span.wleftlab", "Tracking with GPS:"),
                        m(pol.ui.checkBox, {id: "ownpos_gpson", onclick: toggleGpsOn, checked: t.gpson},
                            "Activate"),
                        m(pol.ui.checkBox, {id: "ownpos_adjustclk", onclick: toggleAdjClock, checked: t.adjustclock},
                            "Adjust clock from GPS")),

                    m("div.field",
                        m("span.wleftlab", "GPS Port:"),
                        m(pol.ui.textInput, { id:"ownpos_gpsport", value: t.gpsport, size: 15,
                            maxLength:32, regex: /[a-zA-Z0-9\/\-]*/i })),
                    m("div.field",
                        m("span.wleftlab", "GPS Baud:"),
                        m(pol.ui.textInput, { id:"ownpos_gpsbaud", value: t.gpsbaud, size: 8,
                            maxLength:10, regex: /[0-9]*/i })), pol.ui.br,

                    m("div.field",
                        m("span.wleftlab", "Min pause:"),
                        m(pol.ui.textInput, { id:"ownpos_minpause", value: t.minpause, size: 5,
                            maxLength:8, regex: /[0-9]*/i })),
                    m("div.field",
                        m("span.wleftlab", "Max pause:"),
                        m(pol.ui.textInput, { id:"ownpos_maxpause", value: t.maxpause, size: 5,
                            maxLength:8, regex: /[0-9]*/i })),
                    m("div.field",
                        m("span.wleftlab", "Min distance:"),
                        m(pol.ui.textInput, { id:"ownpos_mindist", value: t.mindist, size: 5,
                            maxLength:8, regex: /[0-9]*/i })),
                    m("div.field",
                        m("span.wleftlab", "Max turn:"),
                        m(pol.ui.textInput, { id:"ownpos_maxturn", value: t.maxturn, size: 5,
                            maxLength:8, regex: /[0-9]*/i })),

                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                    ]),
                ])
            }
        };


        /* Automatic checkbox handler */
        function toggleTxon() {
            t.txon = (t.txon ? false : true);
        }

        function toggleRf() {
            t.allowrf = (t.allowrf ? false : true);
        }

        function toggleCompress() {
            t.compress = (t.compress ? false : true);
        }

        function toggleGpsOn() {
            t.gpson = (t.gpson ? false : true);
        }

        function toggleAdjClock() {
            t.adjustclock = (t.adjustclock ? false : true);
        }

        /* Handler for when user selects symbol */
        function onSymSelect () {
            const sym = $('#symSelect').val();
            t.symtab(sym[0]);
            t.sym(sym[1]);
            m.redraw();
        }

        /* Update a user (on server) */
        function update() {
            console.log("sym", t.symtab(), t.sym());
            const data = {
                txon: t.txon,
                allowrf: t.allowrf,
                compress: t.compress,
                symbol: "" + t.symtab().charAt(0) + t.sym().charAt(0),
                rfpath: t.digipath(),
                comment: t.descr(),
                pos: t.pos,
                gpson: t.gpson,
                adjustclock: t.adjustclock,
                gpsport: t.gpsport(),
                baud: parseInt(t.gpsbaud()),
                minpause: parseInt(t.minpause()),
                maxpause: parseInt(t.maxpause()),
                mindist: parseInt(t.mindist()),
                maxturn: parseInt(t.maxturn())
            };

            CONFIG.server.PUT("system/adm/ownpos", JSON.stringify(data),
                x => {
                    console.log("Update succeeded");
                    t.successMsg("Update succeeded. Reboot may be necessary", 10000);
                },
                (xhr, st, err) => {
                    console.log("Server update failed", st, err);
                    t.errMsg("Server update failed: "+err, 10000);
                }
            );
        }


    } /* constructor */


    /* Clear form */
    clear() {
    }


    /* Get list of users from server */
    getConfig() {
        const t = this;
        CONFIG.server.GET("system/adm/ownpos", "", x => {
            const conf = GETJSON(x);
            const t = this;
            t.txon = conf.txon;
            t.allowrf = conf.allowrf;
            t.compress = conf.compress;
            t.sym(conf.symbol.charAt(1));
            t.symtab(conf.symbol.charAt(0));
            t.digipath(conf.rfpath);
            t.descr(conf.comment);
            t.pos = conf.pos;
            t.gpson = conf.gpson;
            t.adjustclock = conf.adjustclock;
            t.gpsport(conf.gpsport);
            t.gpsbaud(""+(conf.baud>0 ? conf.baud : ""));
            t.minpause(""+(conf.minpause>0 ? conf.minpause : ""));
            t.maxpause(""+(conf.maxpause>0 ? conf.maxpause : ""));
            t.mindist(""+(conf.mindist>0 ? conf.mindist : ""));
            t.maxturn(""+(conf.maxturn>0 ? conf.maxturn : ""));
            m.redraw();
        },
        (xhr, st, err) => {
            console.log("Failed to fetch data from server:", st, err);
            this.errMsg("Failed to fetch data from server: "+err, 10000);
        });
    }




    onActivate() {
       this.getConfig();
    }


} /* class */




pol.widget.setFactory( "psadmin.OwnposConfig", {
        create: () => new pol.psadmin.OwnposConfig()
    });