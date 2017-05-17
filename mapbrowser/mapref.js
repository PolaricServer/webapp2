 /*
    Map browser based on OpenLayers 4. 
    Map reference conversion utilities. 
    
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
 * Format latlong position as degrees+minutes. 
 */
polaric.formatDM = function(llref) {
       latD = Math.floor(Math.abs(llref[1])); 
       lonD = Math.floor(Math.abs(llref[0]));
       return latD+"\u00B0 " + Math.round((Math.abs(llref[1])-latD)*6000)/100+"\' " + 
                (llref[1]<0 ? "S " : "N ") + "&nbsp;" + 
              lonD+"\u00B0 " + Math.round((Math.abs(llref[0])-lonD)*6000)/100+"\' " + 
                (llref[0]<0 ? "W" : "E") ;
}
  
  
  
/**
 * Show position as maidenhead locator
 */
polaric.formatMaidenhead = function(llref) 
{
   var z1 = llref[0] + 180;
   var longZone1 = Math.floor( z1 / 20);
   var char1 = chr(65 + longZone1);

   var z2 = llref[1] + 90;
   var latZone1 = Math.floor(z2 / 10);
   var char2 = chr(65 + latZone1);

   var longZone2 = Math.floor((z1 % 20) / 2);
   var char3 = chr(48 + longZone2);

   var latZone4 = Math.floor(z2 % 10);
   var char4 = chr(48 + latZone4);

   var longZone5 = Math.floor(((llref[0] + 180) % 2) * 12);
   var char5 = chr(97 + longZone5);

   var latZone6 = Math.floor(((llref[1] + 90) % 1) * 24);
   var char6 = chr(97 + latZone6);
   
   return char1+char2+char3+char4+char5+char6;
}

 

polaric.formatUTM = function(llref)
{
   var ref = new LatLng(llref[1], llref[0]);
   var uref = ref.toUTMRef();
   var sref = ""+uref; 
   return sref.substring(0,5)+'<span class="kartref">' + sref.substring(5,8) + '</span>'+
          sref.substring(8,13)+'<span class="kartref">' + sref.substring(13,16) + '</span>'+
          sref.substring(16);
}


/**
 * Parse latlong (degrees, minutes) position.
 */
polaric.parseDM = function(nd, nm, ed, em)
{  
   var yd = parseInt(nd, 10);
   var ym = parseFloat(nm);
   var xd = parseInt(ed, 10);
   var xm = parseFloat(em);
   return [xd+xm/60, yd+ym/60];
}


/**
 * Parse UTM position.  
 *   ax, ay - coordinates in UTM projection
 *   nz, zz - UTM zone (letter, number)
 */

polaric.parseUTM = function(ax, ay, nz, zz)
 {
   var x = parseInt(ax, 10);
   var y = parseInt(ay, 10);
   var z = parseInt(zz, 10);
   if (isNaN(x) || isNaN(y) || isNaN(z))
     return;
   var uref = new UTMRef(x, y, nz, z);
   var ref = uref.toLatLng();
   return ( [ref.lng, ref.lat] );
 }

 
  
/**
 * Parse reference to 100x100m square relative to map center.
 * (c.f. MGRS)
 */
polaric.parseLocal = function(browser, ax, ay)
 {   
    var x = parseInt(ax, 10);
    var y = parseInt(ay, 10);
    if (isNaN(x) || isNaN(y))
      return;
    
    /* find center of map */
    var center = browser.getCenter();
    var ref = new LatLng(center[1], center[0]);
    var cref = ref.toUTMRef();
        
    /* Replace part of the UTM reference with arguments */
    var bx = Math.floor(cref.easting  / 100000) * 100000;
    var by = Math.floor(cref.northing / 100000) * 100000; 
    var llref = new UTMRef(bx + x * 100,  by + y * 100, cref.latZone, cref.lngZone).toLatLng(); 
    return [llref.lng, llref.lat];
 }
 
