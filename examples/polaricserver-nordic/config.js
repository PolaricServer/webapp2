
/*************************************************************
 * Map browser configuration for aprs.no. 
 * 
 * (c) 2017-2018 LA7ECA, Ø. Hanssen
 *
 *************************************************************/

/* Backend server base URL */
SERVER("https://aprs.no/");
// SERVER('http://osys.no:8081')
WSPREFIX("ws");
AJAXPREFIX("srv");
ICONPATH("aprsd");

// default icon (index in icon list)
DEFAULT_ICON(61); 

/* Default projection and list of supported projections */
PROJECTION( "EPSG:900913" );
SUPPORTED_PROJ( ["EPSG:900913", "EPSG:32633"] );


/* Default center and scale */
CENTER    ( 14, 66 );
SCALE     ( 20000 );




/*
 * We can add projections using Proj4js, using the ADD_PROJECTION function.
 * Here, we need the UTM zone 32 and 33 projections for Scandinavia
 */

const utmproj = ADD_PROJECTION
 (  "EPSG:32633", "+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
     [-2500000, 3500000, 3045984, 9045984]
 );
    
 const utm32 = ADD_PROJECTION
 (  "EPSG:32632", "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
     [-2500000, 3500000, 3045984, 9045984]
 );
 
/* Sweden uses EPSG:3006 */ 
const sweproj = ADD_PROJECTION
( "EPSG:3006", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
     [-2500000, 3500000, 3045984, 9045984]
);


   
/*
 * WMTS and tiled WMS layers need grid definitions.
 */
const KV_grid = new ol.tilegrid.TileGrid({
        extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
        resolutions: [39135.75848201023, 19567.87924100512, 9783.93962050256, 4891.96981025128,2445.98490512564, 1222.99245256282, 611.49622628141, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879]
    });


const KV_grid_UTM = new ol.tilegrid.TileGrid({
        extent: [-2500000, 3500000, 3045984, 9045984],
        resolutions: [21664, 10832, 5416, 2708, 1354, 677, 338.5, 169.25, 84.625, 42.3125, 21.15625, 10.5781255, 5.2890625, 2.64453125, 1.322265625]
    });


/* Generate WMTS tilegrids */  
const KV_grid_WMTS = TILEGRID_WMTS(utmproj, 0, 14, "EPSG:32633");
const LM_grid      = TILEGRID_WMTS(sweproj, 2, 9, null, 4096, [-1200000.0, 8500000.0]);

   
    
const Norway = POLYGON([
   [11.557, 58.979], [9.725, 58.692],  [7.408, 57.819],  [4.911, 58.911],  [4.428, 62.343],   
   [9.962, 64.567],  [11.675, 67.99],  [16.842, 70.029], [26.154, 71.528], [31.944, 70.39], 
   [29.1, 69.19],    [27.899, 70.05],  [24.854, 68.481], [21.04, 68.979],  [20.021, 68.306], 
   [18.581, 68.349], [13.877, 64.618], [14.363, 64.414], [14.014, 63.957], [12.853, 63.963],
   [12.287, 61.782], [12.971, 61.244] 
]);   
        
const Sweden = POLYGON([
   [11, 59.13],     [12.04, 60.98],   [11.809, 63.3],   [14.228, 65.29],  [14.292, 66.163], 
   [15.02, 66.321], [16.01, 67.117],  [15.836, 67.513], [17.989, 68.6],   [19.54, 68.547],  
   [19.853, 69.06], [20.864, 69.086], [23.969, 68.015], [24.263, 65.783], [21.509, 63.61], 
   [18.55, 62.278], [18.125, 61.37],  [19.233, 60.676], [20.029, 59.446], [19.458, 57.284],
   [14.25, 55.189], [12.788, 55.189], [12.612, 55.408], [10.508, 58.756] 
]);

const Denmark = POLYGON([ 
   [12.177, 54.528], [8.178, 54.453],   [7.861, 56.948],  [10.707, 57.986], 
   [12.450, 56.171], [12.74, 55.868,6], [12.703, 54.951], [11.928, 54.432] 
]);

const Svalbard = POLYGON([
    [19.1602, 74.1161], [15.6885, 76.4346],  [12.9199, 77.8696], [10.3710, 78.3494],
    [9.9316,  79.2207], [10.0635, 79.8743],  [16.6113, 80.2608], [20.3467, 80.8868],
    [37.8369, 80.1862], [26.9824, 77.9157],  [26.0596, 76.383],  [20.6543, 74.5433]
]);




/***********************************************************************************************
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
 ************************************************************************************************/

LAYERS({ 
    base: true,
    predicate: TRUE,
    projection: "EPSG:900913",
    attribution: "Openstreetmap"
},
[
    new ol.layer.Tile({
        name: 'OpenStreetMap',
        source: new ol.source.OSM()
    })
]);


/* Base layers in UTM projection. Norway */

LAYERS({ 
    base: true,
    predicate: AND( SCALE_LT(8000000), OR( IN_EXTENT(Norway), IN_EXTENT(Svalbard) )),
    projection: utmproj,
    attribution: "Statens kartverk"
},
[
    createLayer_MapCache( {
        name: "Norgeskart bakgrunn (cache)",
        opacity: 0.66,
        layers: "bw_grunnkart",
        tilegrid: KV_grid_UTM,
    })
]);
       



LAYERS({ 
    base: true,
    predicate:  AND( SCALE_LT(8000000), IN_EXTENT(Norway)),
    projection: utmproj,
    attribution: "Statens kartverk"
},
[    
    new ol.layer.Tile({
        name: "Norges grunnkart",
        opacity: 0.85,
        source: new ol.source.WMTS({
            url: "http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?",
            layer: 'norges_grunnkart',
            matrixSet: 'EPSG:32633',
            format: 'image/png',
            projection: utmproj,
            style: 'default',
            tileGrid: KV_grid_WMTS,
            cacheSize: 4096
        })
    }),      
    
    new ol.layer.Tile({
        name: "Norges grunnkart gråtone",
        opacity: 1.0,
        source: new ol.source.WMTS({
            url: "http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?",
            layer: 'norges_grunnkart_graatone',
            matrixSet: 'EPSG:32633',
            format: 'image/png',
            projection: utmproj,
            style: 'default',
            tileGrid: KV_grid_WMTS,
            cacheSize: 4096
        })
    }),
]);                    




      
/* Base layers in UTM projection. Sweden */

LAYERS({ 
    base: true,
    predicate: IN_EXTENT(Sweden),
    projection: utmproj,
    attribution: "Lantmäteriet"
},
[     
    new ol.layer.Tile({
        name: "Topografisk webkarta Sverige",
        opacity: 0.7,
        source: new ol.source.WMTS({
            url: "https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/c0d1194b90628694a411f2ee81f4f326/",
            layer: "topowebb",
            projection: "EPSG:3006",
            matrixSet: "3006",
            format: 'image/png',
            style: "default",
            attribution: "Kart: <a href=\"https://lantmateriet.se\">Lantmäteriet</a> - CC/BY", 
            tileGrid: LM_grid,
            cacheSize: 4096
        })
    }),
    new ol.layer.Tile({
        name: "Topografisk webkarta Sverige nedtonad",
        opacity: 1.0,
        source: new ol.source.WMTS({
            url: "https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/c0d1194b90628694a411f2ee81f4f326/",
            layer: "topowebb_nedtonad",
            projection: "EPSG:3006",
            matrixSet: "3006",
            format: 'image/png',
            style: "default",
            attribution: "Kart: <a href=\"https://lantmateriet.se\">Lantmäteriet</a> - CC/BY", 
            tileGrid: LM_grid,
        })
    })
]);




/* 
 * These are for Denmark 
 * Until we get rid of the old webapp, we reproject to UTM zone 32.
 */

LAYERS({ 
    base: true,
    predicate: AND( SCALE_LT(1000000), IN_EXTENT(Denmark)),
    projection: utm32,
},
[
    createLayer_MapCache( {
        name: "Danmark (cache)", 
        opacity: 0.85,
        layers: "danmark",
        projection: "EPSG:32633", // To force reprojection from UTM33 to UTM32
        tilegrid: KV_grid_UTM,
    })
]);


LAYERS({ 
    base: true,
    predicate: AND( SCALE_LT(50000), IN_EXTENT(Denmark)),
    projection: utm32,
}, 
[       
    createLayer_MapCache( {
        name: "Danmark Topo (cache)", 
        opacity: 0.70,
        layers: "danmark_topo",
        projection: "EPSG:32633", // To force reprojection from UTM33 to UTM32
        tilegrid: KV_grid_UTM,
    })
]);






/* Overlays for all projections */

LAYERS ({ 
    base: false,
    predicate: RESOLUTION_LT (3600)
},[
    new ol.layer.Image({
        name: "UTM/MGRS Rutenett",
        source: new ol.source.ImageWMS ({
            ratio: 1,
            url: "http://openwms.statkart.no/skwms1/wms.rutenett",
            params: {'LAYERS':'UTMrutenett', VERSION: "1.1.1"}
        })
    }) 
]);


/* Overlays for Norway */

LAYERS ({ 
    base: false,
    predicate: AND( SCALE_LT (100000), 
                 AND( IN_EXTENT(Norway), 
                    NOT( SELECTED_BASE("Norgeskart bakgrunn (cache)"))))
},
[
    createLayer_GPX({
        name: "GPX lag", 
        url: "oslo.maraton.gpx",
        style: GETSTYLE("Blue")
    }),

    createLayer_MapCache( {
        name: "Dybdedata sjø/kyst (cache2)",
        opacity: 0.9,
        layers: "kv_dybdedata",
        tilegrid: KV_grid_UTM,
    }),
        
    createLayer_MapCache( {
        name: "Navigasjon - Kystverket (cache)",
        opacity: 0.45,
        layers: "kv_navigasjon",
        tilegrid: KV_grid_UTM,
    })
]);


LAYERS ({ 
    base: false,
    predicate: AND( SCALE_LT (2000000), IN_EXTENT(Norway) )
},[  
    new ol.layer.Image({
        name: "Naturvernområder (DN)",
        source: new ol.source.ImageWMS ({
            ratio: 1,
            url: "http://arcgisproxy.dirnat.no/arcgis/services/vern/MapServer/WmsServer",
            params: {'LAYERS':'naturvern_klasser_omrade', VERSION: "1.1.1"}
        })
    }),

    createLayer_WFS({
        name : "O-kart dekning (UMB)",
        url  : "http://gis.umb.no/nof/o_kart_wfs",
        ftype: "okart:o-kart_nof",
        style: TESTRES( 50, SETLABEL("Blue", "$(id): $(kartnavn)"), GETSTYLE("Red"))
    }), 
      
    createLayer_WFS({
        name : "Brannstasjoner (DSB)",
        url  : "https://ogc.dsb.no/wfs.ashx", 
        ftype: "layer_183",
        style: GETSTYLE("Fireicon")
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




/*********************************************************************************
 * Predefined styles, mainly for vector layers.
 *
 * STYLES takes an array of style-definitions each with an identifier and
 * values for the options in the OpenLayers style class.
 * See http://openlayers.org/en/latest/apidoc/ol.style.Style.html
 *
 * Note that we simplify a bit: we just need to give the values for the options
 * given to ol.style Stroke, ol.style.Fill and ol.style.Text. We also offer
 * convenience functions CIRCLE and ICON to define image properties.
 * 
 * Maybe styles could be defined in a separate config file?
 * Maybe styles could be grouped. 
 *********************************************************************************/

STYLES ([
   { id: "Red",
        stroke: {color: 'rgba(200,0,0,1)', width: 1.5},
	    fill  : 'rgba(255,240,220,0.3)',
	    text  : {scale: 1.2, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(5, {fill: '#f448'})
   },
   { id: "Green+red",
        stroke: {color: 'rgba(0,100,0,1)', width: 1.5},
	    fill  : 'rgba(220,255,220,0.3)',
	    text  : {scale: 1.2, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(5, {fill: '#f448'})
   },
   { id: "Blue",
        stroke: {color: 'rgba(0,0,200,1)', width: 1.5, lineDash: [3,3]},
	    fill  : 'rgba(200,220,253,0.3)',
	    text  : {scale: 1.2, fill: '#003', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(5, {fill: '#55f8'})
   },
   { id: "Blue - No fill",
        stroke: {color: 'rgba(0,0,200,1)', width: 1.5},
	    text  : {scale: 1.2, fill: '#003', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(5, {fill: '#55f8'})
   },
   { id: "Fireicon",
        text  : {baseline: 'Bottom', scale: 1.2, fill: '#003', stroke: {color: '#fff', width: 3} },
	    image : ICON("aprsd/icons/car-fire.png", {})
   },
]);




/***************************************************************************************
 * Menu of predefined map-extents.
 *
 * Extents are upper left corner (1) and lower right corner (2) in decimal degrees
 * [longitude-1, latitude-1, longitude-2, latitude-2]
 ***************************************************************************************/

var defaultView = 'default';
VIEWS ([
   { name: 'finnm',     title: 'Finnmark',        extent: [19.006, 68.064, 33.848, 71.662] },
   { name: 'troms',     title: 'Troms',           extent: [15.549, 68.641, 22.454, 70.196]  },
   { name: 'nordl',     title: 'Nordland',        extent: [8.242, 65.462, 20.91, 68.301] },
   { name: 'ntrond',    title: 'Trøndelag',       extent: [ 9.0436, 62.1, 15.3995, 64.8541] },
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



/****************************************************************************************
 * Menu of predefined tracking filters
 * The actual filters are defined by aprsd in
 * /etc/polaric-aprsd/view.profiles. The name attribute refers to a profile-name.
 * For non-public profiles, add attribute: restricted: 'true'
 ****************************************************************************************/

var defaultFilter = 'track';
FILTERS ([
   { name: 'alle',   title: 'All APRS (amatør)' },
   { name: 'track',  title: 'Sporing 1' },
   { name: 'FORFtrack', title: 'FORF sporing', restricted: true },
   { name: 'le',    title: 'Kun LE kall' },
   { name: 'winlink', title: 'WINLINK' },
   { name: 'infra',  title: 'APRS infrastruktur'},
   { name: 'ainfra', title: 'APRS aktiv Infrastr'},
   { name: 'ainfra_mob', title: 'APRS aktiv Infrastr MOB', restricted: true },
   { name: 'RKH_ainfra', title: 'Aktiv Infrastr RKH', restricted: true },
   { name: 'moving', title: 'APRS Bevegelige'},
   { name: 'all_radio', title: 'APRS Kun radio' },
   { name: 'ais',    title: 'AIS (Kystverket)', restricted: true }
]);
