 
   
   /* 
    * We can add projections using Proj4js, using the ADD_PROJECTION function. 
    * Here, we need the UTM zone 33 projection 
    */
   
   var utmproj = ADD_PROJECTION
    (  "EPSG:32633", "+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs", 
       [-2500000, 3500000, 3045984, 9045984] 
    );


    
   /* 
    * The tiled WMS layers need a grid definition. 
    * See http://openlayers.org/en/latest/apidoc/ol.tilegrid.TileGrid.html
    */ 
   
   var KV_grid = new ol.tilegrid.TileGrid({
                  extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34], 
                  resolutions: [39135.75848201023, 19567.87924100512, 9783.93962050256, 4891.96981025128,2445.98490512564, 1222.99245256282, 611.49622628141, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879]
               });
   
   
   var KV_grid_UTM = new ol.tilegrid.TileGrid({
                  extent: [-2500000, 3500000, 3045984, 9045984], 
                  resolutions: [21664, 10832, 5416, 2708, 1354, 677, 338.5, 169.25, 84.625, 42.3125, 21.15625, 10.5781255, 5.2890625, 2.64453125, 1.322265625]
               });
  
   
   
   
   
  /*
   * Map browser configuration
   * 
   */
   
  /* Backend server base URL */
  SERVER("http://localhost/aprs");
  
  
  /* Default projection */
  PROJECTION( "EPSG:900913" );
  
  /* Default center and scale */
  CENTER    ( 14, 66 );
  SCALE     ( 20000 );
    
  
  /* 
   * Layers. 
   * 
   * Use the LAYERS function to define map layers. This function takes some options and an array 
   * of layers as arguments. Use options to tell if layers are base-layers, and to set a 
   * predicate (a function that returns a boolean to say if layers should be displayed or not. 
   * You can also use these options to set projection or the attribution. 
   * 
   * Use OpenLayers to define layers:  http://openlayers.org/en/latest/apidoc/ol.layer.html
   * An option 'name' should be set on all layers to identify each of them in the layer 
   * switcher list. 
   * 
   * The createLayer_WFS is a convenience function to simplify creation of WFS layer 
   * (see example below).
   */
  
  LAYERS( 
     { base: true, 
       predicate: TRUE, 
       projection: "EPSG:900913",
       attribution: "Openstreetmap" 
     }, 
     [
        new ol.layer.Tile({
          name: 'OpenStreetMap',
          source: new ol.source.OSM()
         })
     ]
  );
  
  
  /* Base layers in UTM projection */
  
  LAYERS( 
     { base: true, 
       predicate: TRUE, 
       projection: utmproj,
       attribution: "Statens kartverk" 
     },
     [
      /* This will be a reprojection of OSM. Just to demonstrate */
      new ol.layer.Tile({
          name: 'OpenStreetMap - UTM',
          source: new ol.source.OSM()
         }),
     
      new ol.layer.Tile({
            name: "SK Topo Raster 3",
            opacity: 0.8,
            
            source: new ol.source.TileWMS({
               url: "http://opencache.statkart.no/gatekeeper/gk/gk.open?",
               projection: utmproj,
               params: {'LAYERS': 'toporaster3', VERSION: "1.1.1"},               
               tilegrid: KV_grid
            })
          }),
     
      new ol.layer.Tile({
            name: "SK Topo 2",
            preload: 2,
            opacity: 0.66,
            
            source: new ol.source.TileWMS({
               url: "http://opencache.statkart.no/gatekeeper/gk/gk.open?",
               projection: utmproj,
               params: {'LAYERS': 'topo2', VERSION: "1.1.1"},               
               tilegrid: KV_grid_UTM, 
               cacheSize: 4096
               
            })
          })

  ]);
  

/* Overlays for all projections */
LAYERS ( 
   { base: false, 
     predicate: RESOLUTION_LT (3600)  
   },
   [  
      new ol.layer.Image({
            name: "Naturvernområder (DN)", 
            source: new ol.source.ImageWMS ({
                ratio: 1,
                url: "http://arcgisproxy.dirnat.no/arcgis/services/vern/MapServer/WmsServer",
                params: {'LAYERS':'naturvern_klasser_omrade', VERSION: "1.1.1"}
            })
      }),
      new ol.layer.Image({
            name: "UTM/MGRS Rutenett", 
            source: new ol.source.ImageWMS ({
               ratio: 1,
               url: "http://openwms.statkart.no/skwms1/wms.rutenett",
               params: {'LAYERS':'UTMrutenett', VERSION: "1.1.1"}
            }) 
      }),
      createLayer_WFS({
          name : "O-kart dekning",
          url  : "http://gis.umb.no/nof/o_kart_wfs",
          ftype: "okart:o-kart_nof",
          style: TESTRES( 50, SETLABEL("Blue", "$(id): $(kartnavn)"), GETSTYLE("Red"))
      })
      
       /* TESTRES, SETLABEL and GETSTYLE return functions that return styles. 
        * TESTRES returns the second argument if resolution is less than 50, and
        * the third argument if it is greater. 
        * 
        * GETSTYLE just return the named style (see STYLES below). 
        * SETLABEL return the named style and adds text for labels, using named attributes 
        * of each feature. Any $(attr) is replaced with the value of the attribute. 
	    * In this example, 'id' is such an attribute. 
        */
    
   ]);




/*
 * Predefined styles, mainly for vector layers. 
 * 
 * STYLES takes an array of style-definitions each with an identifier and 
 * values for the options in the OpenLayers style class. 
 * See http://openlayers.org/en/latest/apidoc/ol.style.Style.html
 * 
 * Note that we simplify a bit: we just need to give the values for the options
 * given to ol.style Stroke, ol.style.Fill and ol.style.Text. We also offer 
 * convenience functions CIRCLE and ICON to define image properties. 
 */

STYLES ([
   { id: "Red",
        stroke: {color: 'rgba(200,0,0,1)', width: 1.5}, 
	    fill  : 'rgba(255,240,220,0.3)', 
	    text  : {scale: 1.2, fill: '#300', stroke: {color: '#fff', width: 3} }, 
	    image : CIRCLE(7, {fill: '#f66'})
   }, 
   { id: "Green",
        stroke: {color: 'rgba(0,100,0,1)', width: 1.5}, 
	    fill  : 'rgba(220,255,220,0.3)', 
	    text  : {scale: 1.2, fill: '#300', stroke: {color: '#fff', width: 3} }, 
	    image : CIRCLE(7, {fill: '#f66'})
   }, 
   { id: "Blue",
        stroke: {color: 'rgba(0,0,200,1)', width: 1.5, lineDash: [3,3]}, 
	    fill  : 'rgba(200,220,253,0.3)', 
	    text  : {scale: 1.2, fill: '#003', stroke: {color: '#fff', width: 3} }, 
	    image : CIRCLE(7, {fill: '#66f'})
   },
   { id: "Blue - No fill",
        stroke: {color: 'rgba(0,0,200,1)', width: 1.5}, 
	    text  : {scale: 1.2, fill: '#003', stroke: {color: '#fff', width: 3} }, 
	    image : CIRCLE(7, {fill: '#66f'})
   }
]);
	       



/*
 * Menu of predefined map-extents.  
 * 
 * Extents are upper left corner (1) and lower right corner (2) in decimal degrees
 * [longitude-1, latitude-1, longitude-2, latitude-2] 
 */

var defaultView = 'default';
VIEWS ([
   { name: 'finnm',     title: 'Finnmark',        extent: [19.006, 68.064, 33.848, 71.662] },
   { name: 'troms',     title: 'Troms',           extent: [15.549, 68.641, 22.454, 70.196]  },
   { name: 'nordl',     title: 'Nordland',        extent: [8.242, 65.462, 20.91, 68.301] },
   { name: 'ntrond',    title: 'Nord-Trøndelag',  extent: [ 9.0436, 63.2859, 15.3995, 64.8541] },
   { name: 'strond',    title: 'Sør-Trøndelag',   extent: [ 7.3903, 62.0338, 13.5351, 63.6724] },
   { name: 'moreroms',  title: 'Møre og Romsdal', extent: [ 3.5993, 61.5234,  9.7916, 63.3084] },
   { name: 'sognf',     title: 'Sogn og fjordane',extent: [ 2.8448, 60.4411,  8.8474, 62.2549] },
   { name: 'hordal',    title: 'Hordaland',       extent: [ 3.1295, 59.3777,  8.9257, 61.1814] },
   { name: 'agrog',     title: 'Agder/Rogaland',  extent: [4.508,57.965,9.311,59.645]},
   { name: 'tele',      title: 'Telemark',        extent: [ 7.4777, 58.7404, 10.2363, 59.5893] },
   { name: 'hardanger', title: 'Hardangervidda/Buskerud', extent: [ 6.4033, 59.3222, 12.0772, 61.0049] },
   { name: 'oslofj',    title: 'Østfold/Vestfold',extent: [ 7.8612, 58.8272, 13.3971, 60.4553] },
   { name: 'osloaker',  title: 'Oslo/Akershus',   extent: [ 9.3833, 59.3858, 12.161,  60.1985] },
   { name: 'hedopp',    title: 'Hedmark/Oppland', extent: [ 8.2261, 59.8479, 13.9201, 61.4599] },
   { name: 'default',   title: 'Utgangspunkt',    extent: [ -16.0421, 56.929, 43.2233, 67.989], hidden: true }
]);





