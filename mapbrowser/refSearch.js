/*
 Map browser based on OpenLayers 4. 
 Misc. generic application stuff. 
 
 Copyright (C) 2017 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * @classdesc
 * Reference search (in a popup window). 
 * @constructor
 */

pol.core.refSearch = function()
{
   pol.core.Widget.call(this);
   this.classname = "core.refSearch"; 
   
   this.widget = {
     view: function() {
        return m("div", [       
            m("h1", "Show reference on map"),
            m("form.mapref", [  
               m("span.sleftlab", {title: "MGRS 100x100m square"}, "MGRS ref: "), 
               m(mgrsInput),
               m("input#butt_mgrs", {type: "button", value: "Find"}), hr,
              
               m("span.sleftlab", "UTM ref: "),
               m(utmInput), 
               m("input#butt_utm", {type: "button", value: "Find", style: "margin-right:3.5em"}), hr,     
	           m("span.sleftlab", 
                 {title: "Degrees, decimal-minutes (click to change hemisphere)"}, 
                   "Lat Long: "),
	           m(latLngInput),
	           m("input#butt_ll", {type: "button", value: "Find"})
            ])
        ])
      }
   };

   /* Add actions to buttons */
   setTimeout(function() 
   {
      $('#butt_mgrs').click( function() {
              var pos = pol.mapref.parseMGRS(browser, $('#mgrsprefix').val(), $('#locx').val(), $('#locy').val());
              browser.goto_Pos(pos, true);
           });
      
      $('#butt_utm').click( function() {
              var pos = pol.mapref.parseUTM( $('#utmx').val(), $('#utmy').val(), $('#utmnz').val(), $('#utmz').val());
              browser.goto_Pos(pos, true);
           });
      
      $('#butt_ll').click( function() {
              var lat_sign = ( $("#ll_NS").html()=="N" ? "" : "-");
              var lng_sign = ( $("#ll_EW").html()=="E" ? "" : "-");
              var pos = pol.mapref.parseDM(
                  lat_sign+$('#ll_Nd').val(), $('#ll_Nm').val(), 
                  lng_sign+$('#ll_Ed').val(), $('#ll_Em').val());
              browser.goto_Pos(pos, true );
           });
   }, 1000);

   browser.map.on('moveend', function() { m.redraw();});
   
}
ol.inherits(pol.core.refSearch, pol.core.Widget);



pol.widget.setRestoreFunc("core.refSearch", function(id, pos) {
    var x = new pol.core.refSearch(); 
    x.activatePopup(id, pos, true); 
}); 






