

   /*
    * We can add projections using Proj4js, using the ADD_PROJECTION function.
    * Here, we test with the UTM zone 33 projection. Which is used in Norway.
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
            name: "Kartverket Topo 4 (Norway)",
            preload: 2,
            opacity: 0.66,

            source: new ol.source.TileWMS({
               url: "http://opencache.statkart.no/gatekeeper/gk/gk.open?",
               projection: utmproj,
               params: {'LAYERS': 'topo4', VERSION: "1.1.1"},
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
   { name: 'oslofj',    title: 'Oslo area',       extent: [ 7.8612, 58.8272, 13.3971, 60.4553] },
   { name: 'default',   title: 'Default',         extent: [ -16.0421, 56.929, 43.2233, 67.989], hidden: true }
]);

