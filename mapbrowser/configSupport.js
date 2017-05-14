 
/*
 Map browser based on OpenLayers 4. 
 configuration support. 
 
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


var CONFIG = new polaric.Config(uid); 
var uid = "ol4test"; // What is this? Still needed?



/*
 * Convenience functions to be used in config file
 * 
 */


var TRUE = function() { return true; }



function ADD_PROJECTION(name, info, extent) 
{
   proj4.defs(name, info);
   var x = ol.proj.get(name);
   x.setExtent(extent);
   return x;
}


function PROJECTION(proj) 
   { CONFIG.set('projection', proj); }

   
   
function CENTER(lng, lat) 
   { CONFIG.set('center', [lng, lat]); }

   
   
function SCALE(res)
   { CONFIG.set('resolution', res); }

   

function LAYERS (attrs, layers) 
{
   if (layers != null && layers.length > 0) 
   {
      for (var i=0; i < layers.length; i++) 
      {     	 
  	     var x = layers[i];
	 
         if ( !x.attribution && attrs.attribution) 
             x.attribution = attrs.attribution;     
 	     if (!x.predicate && attrs.predicate)
	         x.predicate = attrs.predicate;
	     if (!x.projection && attrs.projection)
             x.projection = attrs.projection;
         
         if (attrs.base) 
	         CONFIG.baseLayers.push( x );
	     else {
             x.setVisible(CONFIG.get('olayer.'+CONFIG.oLayersCount++));
	         CONFIG.oLayers.push( x ); 
         }
      } 
   }  
}

 
 
 
/**
 * Map views (pre-selected areas). Initialize a dictionary 
 * using name as index 
 */
function VIEWS(views)
{
  if (views != null)
    for (var i = 0; i < views.length; i++) {
      var x = views[i];
      CONFIG.aMaps[x.name] = x;
    }
}



/* Note that POLYGON is defined in standard lat long projection (EPSG:4326)
 */ 
function POLYGON( points ) {
    var plist = []; 
    for (var i=0; i < points.length; i++)
      plist.push( new ol.geom.Point(points[i].lng, points[i].lat));
    var ring = new ol.geom.LinearRing(plist);
    return new ol.geom.Polygon([ring]);
}




/* 
 * Returns true if (parts of) the given polygon intersects the selected map extent.
 *
function is_visible(polygon)
{
   var extent = CONFIG.mb.calculateExtent(CONFIG.mb.map.getSize()); 
   if (extent != null) {
     var ex = ol.proj.transformExtent(extent, CONFIG.mb.view.getMapProjection() ,"EPSG:4326");  
     if (polygon.intersectsExtent(ex)) 
        return true;
   }
   return false; 
} 
*/



function scale() 
  { return (!CONFIG.mb ? -1 : CONFIG.get('resolution')); }



  
function selectedBase(x)
  { return  CONFIG.mb != null && CONFIG.mb.getBaseLayer().get('name') == x; }
  
  

