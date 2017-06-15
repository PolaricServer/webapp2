/*
 Map browser based on OpenLayers 4. 
 Misc. common functions and mithril modules for UI via DOM. 
 
 
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
 * Autojump between two fields.
 * @param {string} fieldId - Id of DOM field elelent to jump from.
 * @param {string} nextFieldId - Id of DOM field element to jump to.
 */

polaric.autojump = function(fieldId, nextFieldId)
{
   if (fieldId==null || nextFieldId==null) {
       console.error("Field id is null");
       return;
   }
   var downStrokeField;
   var myField=document.getElementById(fieldId);             
   myField.nextField=document.getElementById(nextFieldId); 
   myField.onkeydown=autojump_keyDown;
   myField.onkeyup=autojump_keyUp;


   function autojump_keyDown()
   {
      this.beforeLength=this.value.length;
      downStrokeField=this;
   }


   function autojump_keyUp()
   {
      if (
       (this == downStrokeField) && 
       (this.value.length > this.beforeLength) && 
       (this.value.length >= this.maxLength)
      )
         this.nextField.focus();
      downStrokeField=null;
   }
}
/* End of autojump stuff */



/* Some simple DOM elements */
var br = m("br");
var hr = m("hr");
var nbsp = m.trust("&nbsp;");


/** 
 * MGRS input fields. 
 */
var mgrsInput = {
    view: function() {
        var center = CONFIG.mb.getCenter();
        return m("span", 
               {onclick: function() { polaric.autojump("locx", "locy"); }},
            m("input#mgrsprefix", {type: "text", size: "5", maxlength: "5", value: polaric.MGRSprefix(center)}), nbsp,
            m("input#locx", {type: "text", size: "3", maxlength: "3"}),
            m("input#locy", {type: "text", size: "3", maxlength: "3"}), nbsp )
    }
 }
 
 
/**
 * UTM input fields.
 */ 
var utmInput = {
    view: function() {
        var uref = CONFIG.mb.getCenterUTM();
        return m("span", 
                 { onclick: function() {     
                     polaric.autojump('utmz', 'utmnz');
                     polaric.autojump('utmnz', 'utmx');
                     polaric.autojump('utmx', 'utmy');
                 }},
            m("input#utmz",  {type: "text", size: "2", maxlength: "2", value: uref.lngZone}), 
            m("input#utmnz", {type: "text", size: "1", maxlength: "1", value: uref.latZone}), nbsp, nbsp,
            m("input#utmx",  {type: "text", size: "6", maxlength: "6"}),
            m("input#utmy",  {type: "text", size: "7", maxlength: "7"}), nbsp)
    }
 }
 

 /**
  * Lat long input fields.
  */
var latLngInput = {
    view: function() {
        var center = CONFIG.mb.getCenter();
        return m("span",                 
                 { onclick: function() {     
                     polaric.autojump('ll_Nd', 'll_Nm');
                     polaric.autojump('ll_Nm', 'll_Ed');
                     polaric.autojump('ll_Ed', 'll_Em'); 
                 }},
            m("input#ll_Nd",  {type: "text", size: "2", maxlength: "2"}), "°", nbsp,
            m("input#ll_Nm",  {type: "text", size: "6", maxlength: "6"}), "\'", nbsp, 
            m("span#ll_NS",   {onclick:this.clickNS}, (center[1] < 0 ? "S":"N")), nbsp, nbsp,
            m("input#ll_Ed",  {type: "text", size: "2", maxlength: "2"}), "°", nbsp,
            m("input#ll_Em",  {type: "text", size: "6", maxlength: "6"}), "\'", nbsp,  
            m("span#ll_EW",   {onclick:this.clickEW}, (center[0] < 0 ? "W":"E")), nbsp, nbsp)
    },
    
    /* Change betwen E and W by clicking on the letter */
    clickNS: function() {    
       var val = $("#ll_NS").html();
          $("#ll_NS").html( (val=="N" ? "S" : "N"));
    },
    
    /* Change between N and S by clicking on the letter */
    clickEW: function() {
       var val = $("#ll_EW").html();
          $("#ll_EW").html( (val=="E" ? "W" : "E"));
    }
 }
 
