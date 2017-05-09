 
   
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
  SCALE     ( 3000 );
    
  
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
   { base:false, 
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

