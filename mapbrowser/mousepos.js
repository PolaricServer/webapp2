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
 * @classdesc
 * Control to display map scale and geographical position of mouse pointer.
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
 * @param {ol.Pixel} x - Mouse position on screen [x,y].
 */

polaric.MousePos.prototype.updatePos = function(x) 
{
    if (x==null || x[0]<0 || x[1]<0) {
       this.utm.innerHTML = "<span>(utm pos)</span>";
       this.latlong.innerHTML = "<span>(latlong pos)</span>";
       this.maidenhead.innerHTML = "<span>(locator)</span>";
    }
    else {
       var map = this.getMap();
       var coord = ol.proj.toLonLat(map.getCoordinateFromPixel(x), map.getView().getProjection());    
       this.latlong.innerHTML = '<span>'+polaric.formatDM(coord)+'</span>';
       this.utm.innerHTML = '<span>'+polaric.formatUTM(coord)+'</span>'; 
       this.maidenhead.innerHTML = '<span>'+polaric.formatMaidenhead(coord);
    }
    
}

