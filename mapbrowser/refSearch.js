/*
 Map browser based on OpenLayers 5. 
 Misc. generic application stuff. 
 
 Copyright (C) 2017-2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.core.refSearch = class refSearch extends pol.core.Widget {

    constructor() {
        super();
        const t = this;
        t.classname = "core.refSearch"; 
        t.mgrsVal = [0,0];
        t.utmVal = [0,0];
        t.llVal = [0,0];
        t.llVal2 = [0,0];
        let errmsg = "";
        
        this.widget = {
            view: function() {
                return m("div", [       
                    m("h1", "Show reference on map"),
                    m("div.errmsg", errmsg),
                    m("form.mapref", [  
                        m("div.field", 
                            m("span.sleftlab", {title: "MGRS 100x100m square"}, "MGRS ref: "), 
                            m(mgrsInput, {value: t.mgrsVal}),
                            m("button#butt_mgrs", {type: "button", onclick: ()=> gotoPos(t.mgrsVal, "MGRS") }, "Find") ), hr,
                           
                        m("div.field", 
                            m("span.sleftlab", "UTM ref: "),
                            m(utmInput, {value: t.utmVal}), 
                            m("button#butt_utm", {type: "button", style: "margin-right:3.5em", 
                                onclick: ()=> gotoPos(t.utmVal, "UTM")  }, "Find")), hr,   
                      
                        m("div.field", 
                            m("span.sleftlab", 
                                {title: "Degrees, decimal-minutes (click to change hemisphere)"}, 
                                "Lat Long: "),
                            m(latLngInput, {value: t.llVal}),
                            m("button#butt_ll", {type: "button", onclick: ()=> gotoPos(t.llVal, "LatLong") }, "Find") ), hr,
                      
                        m("div.field", 
                            m("span.sleftlab", {title: "Decimal degrees"}, "Dec. LL: "),
                            m(latLngInputDec, {value: t.llVal2}),
                            m("button#butt_lld", {type: "button", onclick: ()=> gotoPos(t.llVal2, "LatLong") }, "Find") )
                    ])
                ])
            }
        };
        
        function gotoPos(pos, type) {
            const pp = [pos[0], pos[1]];
            if (pp[0]==0 && pp[1]==0) {
                errmsg = "Invalid "+type+" map reference";
                setTimeout(()=> {errmsg="", m.redraw();}, 7000);
            }
            else
                browser.goto_Pos(pp, true);
        }

        browser.map.on('moveend', ()=> { m.redraw();});
    }
    
} /* class */




pol.widget.setFactory( "core.refSearch", {
        create: () => new pol.core.refSearch()
    });



