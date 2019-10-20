 /*
    Map browser based on OpenLayers 5. 
    Map reference conversion utilities. 
    
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
 * Format latlong position as degrees+minutes. 
 * @param {ol.Coordinate} ref - Coordinate to be formatted. 
 * @returns {string}
 */
pol.mapref.formatDM = function(ref) {
       const latD = Math.floor(Math.abs(ref[1])); 
       const lonD = Math.floor(Math.abs(ref[0]));
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
pol.mapref.formatMaidenhead = function(ref) 
{
   const z1 = ref[0] + 180;
   const longZone1 = Math.floor( z1 / 20);
   const char1 = chr(65 + longZone1);

   const z2 = ref[1] + 90;
   const latZone1 = Math.floor(z2 / 10);
   const char2 = chr(65 + latZone1);

   const longZone2 = Math.floor((z1 % 20) / 2);
   const char3 = chr(48 + longZone2);

   const latZone4 = Math.floor(z2 % 10);
   const char4 = chr(48 + latZone4);

   const longZone5 = Math.floor(((ref[0] + 180) % 2) * 12);
   const char5 = chr(97 + longZone5);

   const latZone6 = Math.floor(((ref[1] + 90) % 1) * 24);
   const char6 = chr(97 + latZone6);
   
   return char1+char2+char3+char4+char5+char6;
}

 
 
/**
 * Format latlong position as UTM reference. 
 * @param {ol.Coordinate} ref - Coordinate to be formatted. 
 * @returns {string}
 */
pol.mapref.formatUTM = function(ref)
{
   const llref = new LatLng(ref[1], ref[0]);
   const uref = llref.toUTMRef();
   const sref = ""+uref; 
   return sref.substring(0,5)+'<span class="kartref">' + sref.substring(5,8) + '</span>'+
          sref.substring(8,13)+'<span class="kartref">' + sref.substring(13,16) + '</span>'+
          sref.substring(16);
}


pol.mapref.toUTM = function(ref) 
{
    const llref = new LatLng(ref[1], ref[0]);
    const uref = llref.toUTMRef();
    const sref = ""+uref; 
    return {
        lngZone: sref.substring(0,2),
        latZone: sref.substring(2,3),
        lng: sref.substring(4,10),
        lat: sref.substring(11,18)
    }
}

   
pol.mapref.mgrs = pol.mapref.mgrs || {};
pol.mapref.mgrs.latBands = 'CDEFGHJKLMNPQRSTUVWXX'; 
pol.mapref.mgrs.e100kLetters = [ 'ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ' ];
pol.mapref.mgrs.n100kLetters = [ 'ABCDEFGHJKLMNPQRSTUV', 'FGHJKLMNPQRSTUVABCDE' ];

/**
 * Get MGRS prefix, i.e. zone+band+100km grid. 
 * @param {ol.Coordinate} - Long Lat coordinate. 
 * @returns MGRS prefix.
 */
// Adapted from https://github.com/chrisveness/geodesy/blob/master/mgrs.js (MIT Licence).

pol.mapref.MGRSprefix = function(x)
{
    const ref = new LatLng(x[1], x[0]);
    const uref = ref.toUTMRef();
    
    // MGRS zone is same as UTM zone
    const zone = uref.lngZone;

    // grid zones are 8° tall, 0°N is 10th band
    const band = pol.mapref.mgrs.latBands.charAt(Math.floor(ref.lat/8+10)); // latitude band

    // columns in zone 1 are A-H, zone 2 J-R, zone 3 S-Z, then repeating every 3rd zone
    const col = Math.floor(uref.easting / 100e3);
    const e100k = pol.mapref.mgrs.e100kLetters[(zone-1)%3].charAt(col-1); // col-1 since 1*100e3 -> A (index 0), 2*100e3 -> B (index 1), etc.

    // rows in even zones are A-V, in odd zones are F-E
    const row = Math.floor(uref.northing / 100e3) % 20;
    const n100k = pol.mapref.mgrs.n100kLetters[(zone-1)%2].charAt(row);
    return zone+band+e100k+n100k;
}




/**
 * Parse latlong (degrees, minutes) position.
 * @param {string} nd - Latitude degrees
 * @param {string} nm - Latitude decimal minutes
 * @param {string} ed - Longitude degrees
 * @param {string} em - Longitude decimal minutes
 * @returns {ol.Coordinate}
 */
pol.mapref.parseDM = function(nd, nm, ed, em)
{  
   const yd = parseFloat(nd, 10);
   const ym = parseFloat(nm);
   const xd = parseFloat(ed, 10);
   const xm = parseFloat(em);
   if (isNaN(yd) || yd<-90 || yd>90 || isNaN(ym) || ym<0 || ym>60 || isNaN(xd) ||
       isNaN(xm) || xm<0 || xm>60) {
        console.warn("Degrees/minutes out of bounds or input not numeric");
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

pol.mapref.parseUTM = function(ax, ay, nz, zz)
 {
    if (!/^[0-9]{6}$/.test(ax) || !/^[0-9]{7}$/.test(ay) || !/^[0-9]{2}$/.test(zz)) 
        return [0,0];
 
    const x = parseInt(ax, 10);
    const y = parseInt(ay, 10);
    const z = parseInt(zz, 10);
    if (isNaN(x) || isNaN(y) || isNaN(z) ||
        x<0 || x>999999 || y<0 || y>9999999 || z<0 || z>60) {
        console.warn("UTM zone/northing/easting out of bounds or input not numeric");
        return [0,0];
    }
    
    const uref = new UTMRef(x, y, nz, z);
    const ref = uref.toLatLng();
    return ( [ref.lng, ref.lat] );
 }

 
  
/**
 * Parse MGRS grid reference to 100x100m square.
 * @param {pol.core.MapBrowser} browser - Map browser instance
 * @param {string} ax - x coordinate (3 digits)
 * @param {string} ay - y coordinate (3 digits)
 * @returns {ol.Coordinate}
 */

pol.mapref.parseMGRS = function(browser, prefix, ax, ay)
 {   
    let x = parseInt(ax, 10);
    let y = parseInt(ay, 10);
    if (isNaN(x) || x<0 || x>999) {
      console.warn("MGRS: 3-digit X number out of bounds or input not numeric");
      x = 499;
    }  
    if (isNaN(y) || y<0 || y>999) {
      console.warn("MGRS: 3-digit Y number out of bounds or input not numeric");
      y = 499;
    }
    let llref = null; 
    
    if (prefix && prefix != null && prefix.length == 5) 
    {
       prefix = prefix.toUpperCase();
       // Adapted from https://github.com/chrisveness/geodesy/blob/master/mgrs.js (MIT Licence).
       if (prefix.length > 5) 
           prefix = "0"+prefix; 
       const zone = parseInt(prefix.substring(0,2)); 
       
       const col = pol.mapref.mgrs.e100kLetters[(zone-1)%3].indexOf(prefix[3]) + 1; 
       const row = pol.mapref.mgrs.n100kLetters[(zone-1)%2].indexOf(prefix[4]);
       if (col == 0 || row == -1)
           console.warn("Invalid row or column letter in MGRS prefix");
       
       const e100kNum = col * 100e3; // e100k in metres
        /* get northing specified by n100k */
       const n100kNum = row * 100e3; // n100k in metres

        /* get latitude of (bottom of) band */
       const latBand = (pol.mapref.mgrs.latBands.indexOf(prefix[2])-10)*8;
       if (latBand < -80)
           console.warn("Invalid latitude band letter in MGRS prefix");

        /* northing of bottom of band, extended to include entirety of bottommost 100km square
         * (100km square boundaries are aligned with 100km UTM northing intervals) */
       const nBand = Math.floor(new LatLng(latBand, 0).toUTMRef().northing/100e3)*100e3;
       
        /* 100km grid square row letters repeat every 2,000km north; add enough 2,000km blocks to get
         * into required band */
       let n2M = 0; // northing of 2,000km block
       while (n2M + n100kNum + y < nBand) 
           n2M += 2000e3; 
       llref = new UTMRef(e100kNum + x * 100,  n2M + n100kNum + y * 100, 'X', zone).toLatLng(); 
    }
    else {
       console.warn("invalid MGRS prefix. Using center of map as reference");
       /* find center of map */
       const center = browser.getCenter();
       const ref = new LatLng(center[1], center[0]);
       const cref = ref.toUTMRef();
        
       /* Replace part of the UTM reference with arguments */
       const bx = Math.floor(cref.easting  / 100000) * 100000;
       const by = Math.floor(cref.northing / 100000) * 100000; 
       llref = new UTMRef(bx + x * 100,  by + y * 100, cref.latZone, cref.lngZone).toLatLng(); 
    }
    return [llref.lng, llref.lat];
 }
 
