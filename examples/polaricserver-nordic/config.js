
/*************************************************************
 * Map browser configuration.
 * Feel free to modify it to meet your needs. 
 * See examples aprs.no.config.js for more examples... 
 * 
 * (c) 2017-2019 LA7ECA, Ø. Hanssen
 *************************************************************/

/* 
 * Backend server base URL. 
 * Uncomment to use aprs.no as a backend. 
 * Default is to use the location of the webapp. 
 */
SERVER("https://aprs.no");


/* 
 * WSPREFIX is the url prefix for websocket interface
 * AJAXPREFIX is the url prefix used for other webservices/REST-API.
 * ICONPATH is the url prefix used for icons.  
 * aprs.no uses "ws" and "srv" through a proxy. Default is to use a separate port: 8081. 
 * Uncomment the following two lines to use a backend with a proxy. 
 */
WSPREFIX("ws");
AJAXPREFIX("srv");


/* Location of aprsd icons */
ICONPATH("aprsd");


/* Logo to be placed in lower left corner of the map */
LOGO("images/nrrl.png");


/* default icon (index in icon list) */
DEFAULT_ICON(61); 


/* Default projection and list of supported projections */
PROJECTION( "EPSG:900913" );
SUPPORTED_PROJ( ["EPSG:900913", "EPSG:32633"] );


/* Default center and scale */
CENTER    ( 14, 66 );
SCALE     ( 20000 );


/* If set to true, a popup window will appear when application is started, 
 * showing the content in 'welcome.html'. 
 */
WELCOME(false);


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


   
/***************************************************************************************
 * WMTS and tiled WMS layers need grid definitions.
 * 
 ***************************************************************************************/

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



   
/*********************************************************************************************
 * We may define polygons to test against map extents. 
 * The layer-definitions below uses this to show layers only if extent includes 
 * Norway or Svalbard. See IN_EXTENT(..) function
 * 
 *********************************************************************************************/

const Norway = POLYGON([
   [11.557, 58.979], [9.725, 58.692],  [7.408, 57.819],  [4.911, 58.911],  [4.428, 62.343],   
   [9.962, 64.567],  [11.675, 67.99],  [16.842, 70.029], [26.154, 71.528], [31.944, 70.39], 
   [29.1, 69.19],    [27.899, 70.05],  [24.854, 68.481], [21.04, 68.979],  [20.021, 68.306], 
   [18.581, 68.349], [13.877, 64.618], [14.363, 64.414], [14.014, 63.957], [12.853, 63.963],
   [12.287, 61.782], [12.971, 61.244] 
]);   
        
const Svalbard = POLYGON([
    [19.1602, 74.1161], [15.6885, 76.4346],  [12.9199, 77.8696], [10.3710, 78.3494],
    [9.9316,  79.2207], [10.0635, 79.8743],  [16.6113, 80.2608], [20.3467, 80.8868],
    [37.8369, 80.1862], [26.9824, 77.9157],  [26.0596, 76.383],  [20.6543, 74.5433]
]);

const KV_ATTR = "Maps: © <a href=\"kartverket.no\">Kartverket</a>"



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
 * The createLayer_MapCache is a convenience function to simplify creation of alayer
 * using a mapcache (see example below).
 * 
 ************************************************************************************************/

LAYERS({ 
    base: true,
    predicate: TRUE,
    projection: "EPSG:900913",
},
[
    new ol.layer.Tile({
        name: 'OpenStreetMap',
        source: new ol.source.OSM()
    })
]);




/* 
 * Base layers in UTM projection. Norway or Svalbard and scale > 8000000. 
 * Layers are shown if predicate evaluates to true
 */

LAYERS({ 
    base: true,
    predicate: AND( SCALE_LT(8000000), OR( IN_EXTENT(Norway), IN_EXTENT(Svalbard) )),
    projection: utmproj,
},
[
    /* Use mapcache running on the server */
    createLayer_MapCache( {
        name: "Norgeskart bakgrunn (cache)",
        opacity: 0.65,
        layers: "kv_grunnkart",
        tilegrid: KV_grid_UTM,
        attributions: KV_ATTR
    })
]);
       


/* Base layers in UTM projection. Norway and scale > 8000000 
 * Layers are shown if predicate evaluates to true
 */

LAYERS({ 
    base: true,
    predicate: AND( SCALE_LT(8000000), IN_EXTENT(Norway)),
    projection: utmproj,
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
            cacheSize: 4096, 
            attributions: KV_ATTR
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
            cacheSize: 4096, 
            attributions: KV_ATTR
        })
    }),
]);                    




/* Overlays for all projections. Show only for resolution < 3600 */

LAYERS ({ 
    base: false,
    predicate: RESOLUTION_LT (3600)
},[

    /* UTM Grid lines */
    new ol.layer.Image({
        name: "UTM/MGRS Rutenett",
        source: new ol.source.ImageWMS ({
            ratio: 1,
            url: "https://openwms.statkart.no/skwms1/wms.rutenett",
            params: {'LAYERS':'UTMrutenett', VERSION: "1.1.1"}
        })
    }) 
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

var defaultStyle = 'Red';
STYLES ([
   { id: "Red",
        stroke: {color: 'rgba(200,0,0,1)', width: 1.5},
	    fill  : 'rgba(255,240,220,0.3)',
	    text  : {scale: 1.2, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(5, {fill: '#f448'})
   },
   { id: "Green + red",
        stroke: {color: 'rgba(0,100,0,1)', width: 1.5},
	    fill  : 'rgba(220,255,220,0.3)',
	    text  : {scale: 1.2, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(5, {fill: '#f448'})
   },
   { id: "Blue dashed",
        stroke: {color: 'rgba(0,80,200,1)', width: 2.3, lineDash: [3,3]},
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
 * 
 * This example lists the norwegian counties. Change to satisfy your own need.
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
   { name: 'default',   title: 'Default',         extent: [ -16.0421, 56.929, 43.2233, 67.989], hidden: true }
]);



/****************************************************************************************
 * Menu of predefined tracking filters
 * The actual filters are defined by aprsd in
 * /etc/polaric-aprsd/view.profiles. The name attribute refers to a profile-name.
 * For non-public profiles, add attribute: restricted: 'true'
 ****************************************************************************************/

var defaultFilter = 'track';
FILTERS ([
   { name: 'alle',      title: 'All APRS (HAM)' },
   { name: 'track',     title: 'Tracking' },
   { name: 'infra',     title: 'APRS infrastructure'},
   { name: 'ainfra',    title: 'APRS aktiv Infrastr'},
   { name: 'moving',    title: 'APRS Moving'},
   { name: 'all_radio', title: 'APRS radio only' },
]);
