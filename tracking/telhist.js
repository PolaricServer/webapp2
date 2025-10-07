/*
 Map browser based on OpenLayers 5. Tracking.
 Telemetry history graph.

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
 * Telemetry as a graph.
 */

pol.tracking.TelHist = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.srv = CONFIG.server;

        t.classname = "tracking.TelHist";
        t.meta = null;
        t.ident = "";
        t.index = 0;
        t.prevIndex = 0;
        t.chart = null;
       // setTimeout( ()=>{ t.resetChart(); }, 500);

        t.option = {
              color: [
                '#c23531',
                '#2f4554',
                '#61a0a8',
                '#d48265',
                '#91c7ae',
                '#749f83',
                '#ca8622',
                '#bda29a',
                '#6e7074'
            ],
            tooltip: { trigger: 'axis' },
            legend: {data: [] },
            xAxis: {
                type: 'time'
            },
            yAxis: {
            },
            series: [{
                showSymbol: false,
                data: [],
                type: 'line'
            }]
        };

        this.widget = {
            view: function() {
                return  m("div#TelHist", [
                    m("h1", "Telemetry graph - "+t.ident),
                    m("div.graph", {id: "graph_"+t.ident}),
                    m("button", { type: "button", onclick: ()=>t.getHist(t.ident, t.meta) }, "Next"), nbsp,
                    m(checkBox, {onclick: selDay,  checked: t.period=="day"}, "Day"), nbsp,
                    m(checkBox, {onclick: selWeek, checked: t.period=="week" },"Week"),

                ] );
            }
        };


        function selDay() {
            if (t.period=="day")
                t.period = "";
            else
                t.period = "day";
            t.getHist(t.ident, t.meta, true);
        }

        function selWeek() {
            if (t.period=="week")
                t.period = "";
            else
                t.period = "week";
            t.getHist(t.ident, t.meta, true);
        }





    } /* constructor */




    getAnalog(x, chan) {
        if (x.num[chan] == -1)
            return -1;
        var res = this.meta.num[chan].eqns[0] * x.num[chan] * x.num[chan] +
                this.meta.num[chan].eqns[1] * x.num[chan] +
                this.meta.num[chan].eqns[2];
        return Math.round(res*1000)/1000;
    }



    getHist(id, meta, keep) {
        if (id != this.ident) {
            if (this.ident != "" && this.psclient != null)
                this.srv.pubsub.unsubscribe("telemetry:"+this.ident, this.psclient);

            this.psclient = this.srv.pubsub.subscribe("telemetry:"+id, x => {
                this.getHist(id, meta, true);
                // FIXME: Maybe metainfo should be updated from server?
            });
        }

        this.meta = meta
        this.ident = id;
        let param = "";
        if (this.period == "day")
            param="?hours=24";
        else if (this.period =="week")
            param="?hours=168";

        m.redraw();
        this.srv.GET("telemetry/"+id+"/history"+param, null,
            x => {
                if (keep==true)
                    this.index = this.prevIndex;
                this.prevIndex = this.index;

                if (this.chart == null || this.index < 0)
                    this.index = 0;
               // if (keep!=true)
                    this.resetChart();
                var hist = GETJSON(x);
                var opt = Object.assign( {}, this.option);
                opt.series = [];
                opt.legend.data = [];

                for (let i=this.index; i<5; i++) {
                    var s = {
                        type: 'line',
                        name: meta.num[i].parm,
                        showSymbol: false,
                        data: []
                    };
                    if (s.name == null || s.name == '')
                        s.name = "Chan-"+i;
                    opt.legend.data.push(s.name);
                    for (x of hist)
                        s.data.push( [x.time, this.getAnalog(x, i)] );
                    opt.series.push(s);
                    if (i>=4 || meta.num[i].unit != meta.num[i+1].unit) {
                        this.index = i;
                        break;
                    }
                }
                this.chart.setOption(opt);
                this.index++;
                if (this.index >= 5)
                    this.index = -1;
            },

            x => { console.warn(x); }
        );
    }



    resetChart() {
        if (this.chart != null)
            this.chart.dispose();
        let elem = document.getElementById('graph_'+this.ident);
        this.chart = echarts.init(elem, 'vintage');
    }


    onclose() {
        this.index = 0;
        if (this.chart != null)
            this.chart.dispose();
        this.chart = null;
        if (this.ident != "" && this.psclient != null)
            this.srv.pubsub.unsubscribe("telemetry:"+this.ident, this.psclient);
        this.ident="";
        super.onclose();
    }

} /* class */



pol.widget.setFactory( "tracking.TelHist", {
        create: () => new pol.tracking.TelHist()
    });