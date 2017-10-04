/*
 Map browser based on OpenLayers 4. 
 
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
 * User defined areas (in a popup window). 
 * @constructor
 */

pol.core.AreaList = function() {
   pol.core.Widget.call(this);
   this.classname = "core.AreaList"; 
   this.myAreas = [];
   var t = this;

   this.widget = {
     view: function() {
        var i=0;
        return m("div", [       
            m("h1", "My map areas"),  
            m("table.mapAreas", m("tbody", t.myAreas.map(function(x) {
                return m("tr", [
                   m("td", m("img", {src:"images/edit-delete.png", onclick: apply(removeArea, i) })), 
                   m("td", m("img", {src:"images/edit.png", onclick: apply(editArea, i) })),
                   m("td", {onclick: apply(gotoExtent, i++) }, x.name) ]);
             }))),
             m(textInput, {id:"editArea", value: t.currName, size: 16, maxLength:25, regex: /^[^\<\>\'\"]+$/i }),
             m("button", {onclick: add}, "Add")
        ])
      }
   };
   
   
   /* Get stored areas */
   this.getMyAreas();
   
   
   /* Apply a function to an argument. Returns a new function */
   function apply(f, id) {return function() {f(id); }};  
   
   
   /* Remove area from list */
   function removeArea(id) {
       t.myAreas.splice(id,1);
       CONFIG.store("core.AreaList", t.myAreas, true);
   }
   
   
   /* Move map area name to editable textInput */
   function editArea(id) {
       gotoExtent(id);
       $("#editArea").val(t.myAreas[id].name);
       $("#editArea").change();
       t.myAreas.splice(id,1);
       m.redraw();
   }
   
   
   /* Add map extent to list */
   function add() {
       var ext = CONFIG.mb.getExtent();
       var name = $("#editArea").val(); 
       
       console.log("Add area: "+name + " = ["+
          ext.map(function(x) {return Math.round(x*1000)/1000;}) +"]");
       t.myAreas.push(
          {name: name, extent: ext});
       CONFIG.store("core.AreaList", t.myAreas, true);
   }
   
   
   /* Zoom and move map to extent */
   function gotoExtent(id) {
       var ext = t.myAreas[id].extent; 
       if (ext && ext != null) 
          CONFIG.mb.fitExtent(ext); 
   }
   
}
ol.inherits(pol.core.AreaList, pol.core.Widget);




pol.core.AreaList.prototype.getMyAreas = function() {
  this.myAreas = CONFIG.get("core.AreaList");
  if (this.myAreas == null)
       this.myAreas = [];
  return this.myAreas;   
}



pol.widget.setRestoreFunc("core.AreaList", function(id, pos) {
    var x = new pol.core.AreaList(); 
    x.activatePopup(id, pos, true); 
}); 
