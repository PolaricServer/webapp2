/*
 Map browser based on OpenLayers 5. 
 Misc. generic application stuff. 
 
 Copyright (C) 2017-2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        this.classname = "core.refSearch"; 
   
        this.widget = {
            view: function() {
                return m("div", [       
                    m("h1", "Show reference on map"),
                    m("form.mapref", [  
                        m("span.sleftlab", {title: "MGRS 100x100m square"}, "MGRS ref: "), 
                        m(mgrsInput),
                        m("button#butt_mgrs", {type: "button"}, "Find"), hr,
              
                        m("span.sleftlab", "UTM ref: "),
                        m(utmInput), 
                        m("button#butt_utm", {type: "button", style: "margin-right:3.5em"}, "Find"), hr,     
                        m("span.sleftlab", 
                            {title: "Degrees, decimal-minutes (click to change hemisphere)"}, 
                            "Lat Long: "),
                            m(latLngInput),
                            m("button#butt_ll", {type: "button"}, "Find")
                    ])
                ])
            }
        };

        /* Add actions to buttons */
        setTimeout(function() {
            $('#butt_mgrs').click( ()=> {
                const pos = pol.mapref.parseMGRS(browser, $('#mgrsprefix').val(), $('#locx').val(), 
                    $('#locy').val());
                browser.goto_Pos(pos, true);
            });
      
            $('#butt_utm').click( ()=> {
                const pos = pol.mapref.parseUTM( $('#utmx').val(), $('#utmy').val(), $('#utmnz').val(), 
                    $('#utmz').val());
                browser.goto_Pos(pos, true);
            });
      
            $('#butt_ll').click( () => {
                const lat_sign = ( $("#ll_NS").html()=="N" ? "" : "-");
                const lng_sign = ( $("#ll_EW").html()=="E" ? "" : "-");
                const pos = pol.mapref.parseDM(
                    lat_sign+$('#ll_Nd').val(), $('#ll_Nm').val(), 
                    lng_sign+$('#ll_Ed').val(), $('#ll_Em').val());
                browser.goto_Pos(pos, true );
            });
        }, 1000);

        browser.map.on('moveend', ()=> { m.redraw();});
    }
    
} /* class */



pol.widget.setRestoreFunc("core.refSearch", (id, pos)=> {
    const x = new pol.core.refSearch(); 
    x.activatePopup(id, pos, true); 
}); 






