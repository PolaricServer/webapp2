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
 * @param {ol.Coordinate} ref - Coordinate to be formatted. 
 * @returns {string}
 */
polaric.formatDM = function(ref) {
       latD = Math.floor(Math.abs(ref[1])); 
       lonD = Math.floor(Math.abs(ref[0]));
       return latD+"\u00B0 " + Math.round((Math.abs(ref[1])-latD)*6000)/100+"\' " + 
                (ref[1]<0 ? "S " : "N ") + "&nbsp;" + 
              lonD+"\u00B0 " + Math.round((Math.abs(ref[0])-lonD)*6000)/100+"\' " + 
                (ref[0]<0 ? "W" : "E") ;
}
  
  
  
/**
 * Format latlong position as maidenhead locator.
 * @param {ol.Coordinate} ref - Coordinate to be formatted. 
 * @returns {string}
 */
polaric.formatMaidenhead = function(ref) 
{
   var z1 = ref[0] + 180;
   var longZone1 = Math.floor( z1 / 20);
   var char1 = chr(65 + longZone1);

   var z2 = ref[1] + 90;
   var latZone1 = Math.floor(z2 / 10);
   var char2 = chr(65 + latZone1);

   var longZone2 = Math.floor((z1 % 20) / 2);
   var char3 = chr(48 + longZone2);

   var latZone4 = Math.floor(z2 % 10);
   var char4 = chr(48 + latZone4);

   var longZone5 = Math.floor(((ref[0] + 180) % 2) * 12);
   var char5 = chr(97 + longZone5);

   var latZone6 = Math.floor(((ref[1] + 90) % 1) * 24);
   var char6 = chr(97 + latZone6);
   
   return char1+char2+char3+char4+char5+char6;
}

 
 
/**
 * Format latlong position as UTM reference. 
 * @param {ol.Coordinate} ref - Coordinate to be formatted. 
 * @returns {string}
 */
polaric.formatUTM = function(ref)
{
   var ref = new LatLng(ref[1], ref[0]);
   var uref = ref.toUTMRef();
   var sref = ""+uref; 
   return sref.substring(0,5)+'<span class="kartref">' + sref.substring(5,8) + '</span>'+
          sref.substring(8,13)+'<span class="kartref">' + sref.substring(13,16) + '</span>'+
          sref.substring(16);
}



/**
 * Parse latlong (degrees, minutes) position.
 * @param {string} nd - Latitude degrees
 * @param {string} nm - Latitude decimal minutes
 * @param {string} ed - Longitude degrees
 * @param {string} em - Longitude decimal minutes
 * @returns {ol.Coordinate}
 */
polaric.parseDM = function(nd, nm, ed, em)
{  
   var yd = parseInt(nd, 10);
   var ym = parseFloat(nm);
   var xd = parseInt(ed, 10);
   var xm = parseFloat(em);
   if (yd || yd<-90 || yd>90 || ym || ym<0 || ym>60 || xd ||
       xm || xm<0 || xm>60) {
        console.log("ERROR: degrees/minutes out of bounds or input not numeric");
        return [0,0];
   }
   return [xd+xm/60, yd+ym/60];
}



/**
 * Parse UTM position.  
 * @param {string} ax - UTM x coordinate 
 * @param {string} ay - UTM y coordinate
 * @param {string} nz - UTM zone letter 
 * @param {string} zz - UTM zone number
 * @returns {ol.Coordinate}
 */

polaric.parseUTM = function(ax, ay, nz, zz)
 {
   var x = parseInt(ax, 10);
   var y = parseInt(ay, 10);
   var z = parseInt(zz, 10);
   if (isNaN(x) || isNaN(y) || isNaN(z) ||
       x<0 || x>999999 || y<0 || y>9999999 || z<0 || z>60) {
      console.log("ERROR: UTM zone/northing/easting out of bounds or input not numeric");
      return [0,0];
   }
    
   var uref = new UTMRef(x, y, nz, z);
   var ref = uref.toLatLng();
   return ( [ref.lng, ref.lat] );
 }

 
  
/**
 * Parse reference to 100x100m square relative to map center.
 * (c.f. MGRS)
 * @param {polaric.MapBrowser} browser - Map browser instance
 * @param {string} ax - x coordinate (3 digits)
 * @param {string} ay - y coordinate (3 digits)
 * @returns {ol.Coordinate}
 */
polaric.parseLocal = function(browser, ax, ay)
 {   
    var x = parseInt(ax, 10);
    var y = parseInt(ay, 10);
    if (isNaN(x) || isNaN(y) || x<0 || x>999 || y<0 || y>999) {
      console.log("ERROR: 3-digit number out of bounds or input not numeric");
      return [0,0];
    }
    
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
 
