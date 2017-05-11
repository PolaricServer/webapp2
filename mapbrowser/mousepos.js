 /*
    Map browser based on OpenLayers 4. 
    Control that shows mouse position (latlong, UTM, maidenhad) and scale. 
    
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
 * @constructor
 */
polaric.MousePos = function(opt_options) {

   var options = opt_options || {};

   var t = this;
   var map = this.getMap();
   var element = document.createElement('div');
   element.className = 'mousepos ol-unselectable ol-control';
  
   this.scale = document.createElement('div');
   this.scale.className = 'scale';
   element.appendChild(this.scale);
  
   this.utm = document.createElement('div');
   this.utm.className = 'mouse_utm';
   element.appendChild(this.utm);
    
   this.latlong = document.createElement('div');
   this.latlong.className = 'mouse_latlong';
   element.appendChild(this.latlong);
  
   this.maidenhead = document.createElement('div');
   this.maidenhead.className = 'mouse_maidenhead';
   element.appendChild(this.maidenhead);
  
   ol.control.Control.call(this, {
      element: element,
      target: options.target
   });

  this.lastMouseMovePixel_ = null;

};
ol.inherits(polaric.MousePos, ol.control.Control);

      


/**
 * Set map object. Called from superclass. 
 */
polaric.MousePos.prototype.setMap = function(map) {
   ol.control.Control.prototype.setMap.call(this, map);
   var t = this;
   if (map) {
      var viewport = map.getViewport();
      viewport.addEventListener("mousemove", onMouseMove); 
      viewport.addEventListener("mouseout", onMouseOut);
      map.on('moveend', onMapMove);
      t.updatePos(null);
   }
  
   /* Handler for mouse move */
   function onMouseMove(e) {
      var pp = t.getMap().getEventPixel(e);
      t.updatePos(pp);
   }
  
   /* Handler for mouse outside of map view */
   function onMouseOut(e) {
      t.updatePos(null);
   }
  
   /* Hack to find the actual screen resolution in dots per inch */
   function dotsPerInch() {
      var div = document.createElement("div");
      div.style.width="1in";
      var body = document.getElementsByTagName("body")[0];
      body.appendChild(div);
      var ppi = document.defaultView.getComputedStyle(div, null).getPropertyValue('width');
      body.removeChild(div); 
      return parseFloat(ppi);
   }
  
   /* Handler for change of map zoom-level. Compute scale and show it */
   function onMapMove(e) {
      var view = t.getMap().getView();
      var mpu = view.getProjection().getMetersPerUnit();
      var res = t.getMap().getView().getResolution();
      var center = view.getCenter();
      var dpm = dotsPerInch()*39.37; 
      
      var scale = ol.proj.getPointResolution(
         view.getProjection(), res, center) * mpu * dpm;
      

      if (scale >= 1000)
            scale = Math.round(scale / 100) * 100;
      if (scale >= 10000)
            scale = Math.round(scale / 1000) * 1000;
      if (scale >= 100000)
            scale = Math.round(scale / 10000) * 10000;
      else
	    scale = Math.round(scale);
   
      if (scale >= 1000000) {
            scale = Math.round(scale / 100000) * 100000; 
            scale = scale / 1000000;
            scale = scale + " Million";
      }
      else if (scale >= 10000)
            scale = (Math.round(scale/1000) + " 000");
      
      t.scale.innerHTML = '<span>Scale 1 : ' + scale + '</span>';
   }
}




/**
 * Show position in UTM format, latlong format and as maidenhead locator.
 */

polaric.MousePos.prototype.updatePos = function(x) {
    if (x==null) {
       this.utm.innerHTML = "<span>(utm pos)</span>";
       this.latlong.innerHTML = "<span>(latlong pos)</span>";
       this.maidenhead.innerHTML = "<span>(locator)</span>";
    }
    else {
       var map = this.getMap();
       var coord = ol.proj.toLonLat(map.getCoordinateFromPixel(x), map.getView().getProjection());
       var llref = new LatLng(coord[1], coord[0]);     
       this.latlong.innerHTML = '<span>'+polaric.formatLL(coord)+'</span>';
       this.utm.innerHTML = '<span>'+llref.toUTMRef()+'</span>'; 
       this.maidenhead.innerHTML = '<span>'+polaric.ll2Maidenhead(coord);
    }
    
}


/* FIXME: Consider moving the following functions to separate file util.js */


/**
 * Format latlong position as degrees+minutes. 
 */

polaric.formatLL = function(llref) {
       latD = Math.floor(Math.abs(llref[1])); 
       lonD = Math.floor(Math.abs(llref[0]));
       return latD+"\u00B0 " + Math.round((Math.abs(llref[1])-latD)*6000)/100+"\' " + (llref[1]<0 ? "S " : "N ") + "&nbsp;" + 
              lonD+"\u00B0 " + Math.round((Math.abs(llref[0])-lonD)*6000)/100+"\' " + (llref[0]<0 ? "W" : "E") ;
}
  
  
  
/**
 * Show position as maidenhead locator
 */

polaric.ll2Maidenhead = function(llref) 
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
