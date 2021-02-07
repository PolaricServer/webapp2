/*
 Map browser based on OpenLayers 5. 
 configuration support. 
 
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



pol.uid = "ol4test"; // What is this? Still needed?



/*
 * Convenience functions to be used in config file
 * 
 */
function WELCOME(on)
 { CONFIG.set("welcome_popup", on); }
 
function LOGO(url)
 { CONFIG.set('logo', url); }

function SERVER(url) 
 { CONFIG.set('server', url); }

function WSPREFIX(p)
 { CONFIG.set('wsprefix', p); }
 
function AJAXPREFIX(p)
 { CONFIG.set('ajaxprefix', p); }

function ICONPATH(p)
 { CONFIG.set('iconpath', p); }
 
function DEFAULT_ICON(i)
 { CONFIG.set('default_icon', i) }; 
 
function ll2proj(p)
 { return ol.proj.transform(p, 'EPSG:4326', CONFIG.mb.view.getProjection()); }
 
function proj2ll(p)
 { return ol.proj.transform(p, CONFIG.mb.view.getProjection(), 'EPSG:4326'); }

 
 
var TRUE = function() { return true; }



function ADD_PROJECTION(name, info, extent) 
{
   console.log("ADD_PROJECTION: "+name+", "+info);
   proj4.defs(name, info);
   ol.proj.proj4.register(proj4);
   const x = ol.proj.get(name);
   x.setExtent(extent);
   return x;
}


function PROJECTION(proj) 
   { CONFIG.set('core.projection', proj); }

function SUPPORTED_PROJ( proj )
   { CONFIG.set('core.supported_proj', proj); }
   
function CENTER(lng, lat) 
   { CONFIG.set('core.center', [lng, lat]); }
   
function SCALE(res)
   { CONFIG.set('core.resolution', res); }

   
   
/**
 * Generate a WMTS tilegrid object. 
 * - projection
 * - start matrixId
 * - end matrixId
 * - matrixId prefix 
 * - size (top level resolution) - optional
 * - origin coordinate - optional
 */
function TILEGRID_WMTS(proj, start, end, prefix, siz, origin) {
    const projExtent = proj.getExtent(); 
    const size = (siz ? siz : ol.extent.getWidth(projExtent) / 256); 
    let resolutions = [];
    let matrixIds = []; 
    let i=0;
    for (let z = start; z <= end; z++) {
        resolutions[i] = size / Math.pow(2, z);
        matrixIds[i++] = (prefix && prefix != null ? prefix + ":" + z : z);
    }
    return new ol.tilegrid.WMTS( {
        extent: projExtent,
        origin: (origin ? origin : ol.extent.getTopLeft(utmproj.getExtent())),
        resolutions: resolutions, 
        matrixIds: matrixIds
    });
}   
 

 function createLayer_MapCache(opt) {
     
    /* FIXME: Move this to a function or method */ 
    let host = CONFIG.get('server');
    if (host == null) {
        let hh = window.location.host; 
        let pp = window.location.protocol;
        host = "";
        if (pp)
            host += pp+"//"
        if (hh)
            host +=hh;
        else
            host += "localhost";
    }
    
    const layer = new ol.layer.Tile({
          name: (opt.name ? opt.name : "noname"), 
          preload: 2,
          opacity: (opt.opacity ? opt.opacity : 1),
          max_res: opt.seed_max_res,
          
          source: new ol.source.TileWMS({
              url: (opt.url? opt.url : host + "/mapcache/wms?"),
              projection: utmproj,
              params: {'LAYERS': opt.layers, VERSION: "1.1.1", TRANSPARENT: true},
              tilegrid: opt.tilegrid,
              cacheSize: 4096,
              attributions: opt.attributions
          })
       });
    return layer; 
}

   
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
             x.setVisible(CONFIG.get('core.olayer.'+x.get("name")));
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
        for (let i = 0; i < views.length; i++) {
            const x = views[i];
            CONFIG.aMaps[x.name] = x;
        }
}



/**
 * Define a polygon.
 * Note that POLYGON is defined in standard lat long projection (EPSG:4326)
 */ 
function POLYGON( points ) {
    points.push(points[0]);
    return new ol.geom.Polygon([points]);
}




/** 
 * Returns true if (parts of) the given polygon intersects the current map extent.
 */
function is_visible(polygon)
{
   const extent = CONFIG.mb.getExtent();
   if (extent != null) {
     if (polygon.intersectsExtent(extent)) 
        return true;
   }
   return false; 
} 




/**
 * Returns a function that tests if extent intersects a polygon *
 */
function IN_EXTENT(polygon) {
  return function() 
    {return is_visible(polygon);}
}

    
  
function selectedBase(x)
   { return  CONFIG.mb != null && CONFIG.mb.getBaseLayer().get('name') == x; }
  
  
function SELECTED_BASE(x)
   { return function() {return selectedBase(x); }}

   
function is_proj(x)
   { return (CONFIG.mb.getProjection() === x); }
   
  
function IS_PROJ(x)
   { return function() {return is_proj(x);}}
     
     
function RESOLUTION_LT (res)
   { return function() {return CONFIG.mb.getResolution() < res; }}


function RESOLUTION_GT (res)
   { return function() {return CONFIG.mb.getResolution() > res; }}
   
   
function SCALE_LT (sc)
   { return function() {return CONFIG.mb.getScale() < sc; }}


function SCALE_GT (sc)
   { return function() {return CONFIG.mb.getScale() > sc; }}
   
   
function AND(a, b)
   { return function() {return a() && b();} }
   
   
function OR(a, b)
   { return function() {return a() || b();} }
   
   
function NOT(x)
   { return function() {return !x(); }}
   
   
   
  
  
/************************ Vector Layers and Style config *****************************/


function createLayer_GPX(opts)
{
    const gSource = new ol.source.Vector({
        format: new ol.format.GPX(),  
            
        loader: (extent, resolution, projection) => {
            CONFIG.server.GET(opts.url, null, 
                resp => {
                    var ff = gSource.getFormat().readFeatures(resp, {featureProjection: projection});
                    gSource.addFeatures(ff);
                },
                resp => {
                    console.warn("Get GPX object: "+resp);
                    gSource.removeLoadedExtent(extent);
                } 
            );
        },
    });
    
    const layer = new ol.layer.Vector({
        name: opts.name,
        source: gSource,
        style: opts.style,
        gpxLayer: true
    });
    
    /* 
     * If info-display handler present, register it.
     * If not, use a default setup. 
     */
    if (opts.info)
        layer.displayInfo = opts.info; 
    else 
        layer.displayInfo = FEATUREINFO([
           {val: "$(name)"},
           {val: "$(desc)"}
        ])
    
    return layer;
}



// Options: url, ftype, outputFormat, style

function createLayer_WFS(opts) 
{
   if (!opts.outputFormat)
        opts.outputFormat = "text/xml; subtype=gml/3.1.1";
   if (!opts.wfsVersion)
        opts.wfsVersion = "1.1.0";
   if (opts.cql)
       opts.cql = "&cql_filter="+opts.cql; 
   else 
       opts.cql = "";
        
   const vSource = new ol.source.Vector({
     format: new ol.format.WFS(),  

        
     url: function(extent) {
        let srs = CONFIG.mb.view.getProjection().getCode();
        if (!srs)
            srs=opts.srs;
            
        return opts.url +'?service=WFS&' +
           'version='+opts.wfsVersion+'&request=GetFeature&typename='+opts.ftype+'&' +
           'outputFormat='+opts.outputFormat+'&srsname='+srs+'&' +
           'bbox=' + extent.join(',')+opts.cql;
     },

     strategy: ol.loadingstrategy.bbox
   });
   
   vSource.ftype = opts.ftype;
   vSource.oformat = opts.oformat;
   
   const layer = new ol.layer.Vector({
      name: opts.name,
      source: vSource,
      style: opts.style
   });
   layer.clearOnMove = true;
   // If info-display handler present, register it. 
   if (opts.info)
       layer.displayInfo = opts.info; 
   return layer;
}
   

   
   
function FEATUREINFO(fi) {
    return function(feat) {
        let fi2 = fi.slice(0);
        for (i in fi) {
            feat.values_.get = function(key) {return this[key];}
            fi2[i] = {lbl:fi[i].lbl, val: evalExpr(fi[i].val, feat.values_)};
        }
        return fi2;
    }
}
   
   

function STYLES( st ) {
    for (i in st) {
       let x = st[i];
       const ident = (x.id ? x.id : 'style_'+i);
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
   }
}


function getStyle(id) { 
    let x = CONFIG.styles[id]; 
    if (!x) {
        console.warn("Unknown style id: "+id);
        x = CONFIG.styles[defaultStyle];
    }
    return x;
}

   
   
function GETSTYLE(id) { 
  let gotit = false;
  return function(f,r) {
     if (gotit==false) {
        let ll = "";
        for (x in f.getProperties())
            ll += (x + " ");
        console.log("FEATURE PROPERTIES: "+ll);
        gotit = true;
     }
     return getStyle(id);
  }
}

   
   
function setLabel(id, label) {
   let x = CONFIG.styles[id].clone(); 
   if (label && label != null)
        x.getText().setText(label);
   return x;
}


function SETLABEL(id, label) {
    return function(f,r) {
        return setLabel(id, evalExpr(label,f)); 
    }
}


function evalExpr(expr, f) {
    return expr.replace( /\$\([^\)]+\)/g, 
            x => f.get( x.substring(2, x.length-1)) 
        );
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


function WIDGET(id,pos,pin,f) { pol.widget.start(id,pos,pin,f); }
function getWIDGET(id) { return pol.widget.get(id); }
