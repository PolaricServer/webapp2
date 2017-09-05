
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


var CONFIG = new pol.core.Config(pol.uid); 
pol.uid = "ol4test"; // What is this? Still needed?



/*
 * Convenience functions to be used in config file
 * 
 */

function SERVER(url) 
 { CONFIG.set('server', url); }



function ll2proj(p)
 { return ol.proj.transform(p, 'EPSG:4326', CONFIG.mb.view.getProjection()); }
 
 
function proj2ll(p)
 { return ol.proj.transform(p, CONFIG.mb.view.getProjection(), 'EPSG:4326'); }

 
 
var TRUE = function() { return true; }



function ADD_PROJECTION(name, info, extent) 
{
   proj4.defs(name, info);
   var x = ol.proj.get(name);
   x.setExtent(extent);
   return x;
}


function PROJECTION(proj) 
   { CONFIG.set('core.projection', proj); }

   
   
function CENTER(lng, lat) 
   { CONFIG.set('core.center', [lng, lat]); }

   
   
function SCALE(res)
   { CONFIG.set('core.resolution', res); }

   
   
   
   
/**
 * Configure some layers. 
 */
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
 * using name as index. 
 */
function VIEWS(views)
{
  if (views != null)
    for (var i = 0; i < views.length; i++) {
      var x = views[i];
      CONFIG.aMaps[x.name] = x;
    }
}



/**
 * Define a polygon.
 * Note that POLYGON is defined in standard lat long projection (EPSG:4326)
 */ 
function POLYGON( points ) {
    var plist = []; 
    for (var i in points)
      plist.push( new ol.geom.Point(points[i].lng, points[i].lat));
    var ring = new ol.geom.LinearRing(plist);
    return new ol.geom.Polygon([ring]);
}




/** 
 * Returns true if (parts of) the given polygon intersects the current map extent.
 */
function is_visible(polygon)
{
   var extent = CONFIG.mb.getExtent();
   if (extent != null) {
     if (polygon.intersectsExtent(extent)) 
        return true;
   }
   return false; 
} 


function IN_EXTENT(polygon) {
  return function() 
    {return is_visible(polygon);}
}
    

function scale() 
  { return (!CONFIG.mb ? -1 : CONFIG.get('resolution')); }

  
function selectedBase(x)
  { return  CONFIG.mb != null && CONFIG.mb.getBaseLayer().get('name') == x; }
  
     
function RESOLUTION_LT (res)
   { return function() {return CONFIG.mb.getResolution() < res; }}


function RESOLUTION_GT (res)
   { return function() {return CONFIG.mb.getResolution() > res; }}

   
function AND(a, b)
   { return function() {return a() && b();} }
   
   
function OR(a, b)
   { return function() {return a() || b();} }
   
   
   
  
  
/************************ WFS Layer and Style config *****************************/



// Options: url, ftype, outputFormat, style

function createLayer_WFS(opts) 
{
   if (!opts.outputFormat)
   opts.outputFormat = "text/xml; subtype\=gml/3.1.1";

   var vSource = new ol.source.Vector({
     format: new ol.format.WFS(),  // Oops! GML version 3.1.1 only! 

     url: function(extent) {
     if (!opts.srs)
        opts.srs = CONFIG.mb.view.getProjection().getCode();

        return opts.url +'?service=WFS&' +
           'version=1.1.0&request=GetFeature&typename='+opts.ftype+'&' +
           'outputFormat='+opts.outputFormat+'&srsname='+opts.srs+'&' +
           'bbox=' + extent.join(',');
     },

     strategy: ol.loadingstrategy.bbox
   });
   
   vSource.url = opts.url;
   vSource.ftype = opts.ftype;
   vSource.oformat = opts.oformat;
   vSource.srs = opts.srs;
   
   return new ol.layer.Vector({
      name: opts.name,
      source: vSource,
      style: opts.style
   });
}
   

function STYLES( st ) {
    for (i in st) {
       var x = st[i];
       var ident = (x.id ? x.id : 'style_'+i);
       delete x.id;
       
       if (x.stroke)
	      x.stroke = new ol.style.Stroke(x.stroke);
       if (x.fill)
	      x.fill = new ol.style.Fill({color: x.fill});
       if (x.text) {
          if (x.text.fill) 
	         x.text.fill = new ol.style.Fill({color: x.text.fill});
	      if (x.text.stroke)
	         x.text.stroke = new ol.style.Stroke(x.text.stroke);
	      x.text = new ol.style.Text(x.text);
       }
       if (x.image) 
	      x.image = x.image;
    
       CONFIG.styles[ident] = new ol.style.Style(x);   
       console.log("Config: Add style: "+ident) 
   }
   var keys = Object.keys(CONFIG.styles);
}


function getStyle(id)
   { return CONFIG.styles[id]; }

   
   
function GETSTYLE(id) { 
  var gotit = false;
  return function(f,r) {
     if (gotit==false) {
         var ll = "";
         for (x in f.getProperties())
	    ll += (x + " ");
	 console.log("FEATURE PROPERTIES: "+ll);
	 gotit = true;
     }
     return getStyle(id);
  }
}

   
   
function setLabel(id, label) {
   var x = CONFIG.styles[id].clone(); 
   if (label && label != null)
         x.getText().setText(label);
   return x;
}


function SETLABEL(id, label) {
   return function(f,r) {
       var lbl = label.replace( /\$\([^\)]+\)/g, function(x) 
         { return f.get( x.substring(2, x.length-1)); });
       return setLabel(id, lbl); 
   }
}


function TESTRES(r, lt, gt) {
    return function(f, res) {
        if (res < r)
           return lt(f,res);
        else
           return gt(f,res);
    }
}



/**
 * Icon style. See
 *    http://openlayers.org/en/latest/apidoc/ol.style.Icon.html
 *  for options. 
 */

function ICON(url, opts) {
  if (!opts) opts = {};
  opts.src = url;
  return new ol.style.Icon(opts);
}


/**
 * Circle style. See
 *    http://openlayers.org/en/latest/apidoc/ol.style.Circle.html
 * for options.
 */

function CIRCLE(radius, opts) {
  if (!opts) opts = {};
  opts.radius = radius; 
  if (opts.fill) 
      opts.fill = new ol.style.Fill({color: opts.fill});
  if (opts.stroke)
      opts.stroke = new ol.style.Stroke(opts.stroke);
  else
      opts.stroke = new ol.style.Stroke({color:'#000', width: 1}); 
     
  return new ol.style.Circle(opts);
}



