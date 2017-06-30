 
   
   /* UTM zone 33 projection */
   
   var utmproj = ADD_PROJECTION
    (  "EPSG:32633", "+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs", 
       [-2500000, 3500000, 3045984, 9045984] 
    );

   
   var KV_grid = new ol.tilegrid.TileGrid({
                  extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34], 
                  resolutions: [39135.75848201023, 19567.87924100512, 9783.93962050256, 4891.96981025128,2445.98490512564, 1222.99245256282, 611.49622628141, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879]
               });
   
   
   var KV_grid_UTM = new ol.tilegrid.TileGrid({
                  extent: [-2500000, 3500000, 3045984, 9045984], 
                  resolutions: [21664, 10832, 5416, 2708, 1354, 677, 338.5, 169.25, 84.625, 42.3125, 21.15625, 10.5781255, 5.2890625, 2.64453125, 1.322265625]
               });
  
   
   
  /********************************************************
   * Map browser configuration
   * 
   ********************************************************/
   
  /* Default projection */
  PROJECTION( "EPSG:900913" );
  
  /* Default center and scale */
  CENTER    ( 14, 66 );
  SCALE     ( 20000 );
    
  
  /* Layers */
  
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
  
  
  LAYERS( 
     { base: true, 
       predicate: TRUE, 
       projection: utmproj,
       attribution: "Statens kartverk" 
     },
     [
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
  

/* Overlay for all projections */
LAYERS ( 
   { base: false, 
     predicate: function() { return scale() < 800; }
   },
   [  
      new ol.layer.Image({
            name: "Naturvernområder (DN)", 
            source: new ol.source.ImageWMS ({
                ratio: 1,
                url: "http://arcgisproxy.dirnat.no/arcgis/services/vern/MapServer/WmsServer",
                params: {'LAYERS':'naturvern_klasser_omrade', VERSION: "1.1.1"},
            })
      }),
      new ol.layer.Image({
            name: "UTM/MGRS Rutenett", 
            source: new ol.source.ImageWMS ({
               ratio: 1,
               url: "http://openwms.statkart.no/skwms1/wms.rutenett",
               params: {'LAYERS':'UTMrutenett', VERSION: "1.1.1"},
            }) 
      })

      
   ]);



/*
 * Menu of predefined map-extents.  
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





