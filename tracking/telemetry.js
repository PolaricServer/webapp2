/*
 Map browser based on OpenLayers 5. Tracking.
 Show telemetry data.

 Copyright (C) 2021 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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
 * Telemetry (last transmission)
 */

pol.tracking.Telemetry = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.srv = CONFIG.server;

        t.classname = "tracking.Telemetry";
        t.descr = null;
        t.meta = null;
        t.current = null;
        t.ident = "";
        t.psclient = null;

        const _telnum = {
            view: function() {
                var i=0;
                return m("table.telemetry", t.meta.num.map( x=> {
                    var y = getAnalog(t.current, i++);
                    return m("tr", m("td.lbl",  (x.parm==null ? "Chan-"+i : x.parm) + ": "),
                           m("td.val", y), m("td.unit", x.unit));
                } ) )
            }
        };


        const _telbin = {
            view: function() {
                var i=0;
                return m("div.telbin", t.meta.num.map( x=> {
                    var y = getBinary(t.current, i++);
                    var ym = t.meta.bin[i];
                    return (ym.use ?
                        m("span"+(y ? ".on" : ""), {title: (y ? ym.unit : null)},
                            (ym.parm==null ? "B"+i : ym.parm)) :
                        null);
                } ) )
            }
        };


        this.widget = {
            view: function() {
                return  m("div#Telemetry", [
                    m("h1", (t.descr == null ? "Telemetry" : t.descr)), pol.ui.nbsp,nbsp,
                    m("span", t.ident+(t.current != null ? ", at "+formatTime(t.current.time) : "")),
                    m("button", { type: "button", onclick: ()=>history() }, "Graph") ,
                    (t.meta != null && t.current != null && t.current.num ? m(_telnum) : null),
                    (t.meta != null && t.current != null && t.current.bin ? m(_telbin) : null),

                ] );
            }
        };



        function history() {
             WIDGET( "tracking.TelHist", [50, 70], false,  x=> x.getHist(t.ident, t.meta), t.ident );
        }

        function getAnalog(x, chan) {
            if (x.num[chan] == -1)
                return -1;
            var res = t.meta.num[chan].eqns[0] * x.num[chan] * x.num[chan] +
                   t.meta.num[chan].eqns[1] * x.num[chan] +
                   t.meta.num[chan].eqns[2];
            return Math.round(res*1000)/1000;
        }

        function getBinary(x, chan) {
            return x.bin[chan] == t.meta.bin[chan].bit;
        }


        function formatTime(dt) {
            const d = new Date(dt);
            return "" +
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
        }

    } /* constructor */


    getItem(id) {
        if (id != this.ident) {
            if (this.ident != "" && this.psclient != null)
                this.srv.pubsub.unsubscribe("telemetry:"+this.ident, this.psclient);

            this.psclient = this.srv.pubsub.subscribe("telemetry:"+id, x => {
                this.getItem(id);
            });
        }

        this.ident = id;
        this.srv.GET("telemetry/"+id+"/descr", null,
                x => { this.descr = GETJSON(x); m.redraw(); },
                x => { console.warn(x); }
            );
        this.srv.GET("telemetry/"+id+"/meta", null,
                x => { this.meta = GETJSON(x); m.redraw(); },
                x => { console.warn(x); }
            );
        this.srv.GET("telemetry/"+id+"/current", null,
                x => { this.current = GETJSON(x); m.redraw(); },
                x => { console.warn(x); }
            );
    }



    onclose() {
        if (this.ident!="" && this.psclient != null)
            this.srv.pubsub.unsubscribe("telemetry:"+this.ident, this.psclient);
        this.ident="";
        super.onclose();
    }

} /* class */



pol.widget.setFactory( "tracking.Telemetry", {
        create: () => new pol.tracking.Telemetry()
    });