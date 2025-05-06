
/*************************************************************
 * Map browser configuration.
 * Feel free to modify it to meet your needs. 
 * See examples aprs.no.config.js for more examples... 
 * 
 * (c) 2017-2023 LA7ECA, Ø. Hanssen
 *************************************************************/

/* 
 * Backend server base URL. 
 * Uncomment to use aprs.no as a backend. 
 * Default is to use the location of the webapp. 
 */
SERVER("https://kart2.aprs.no");


/*
 * Port number if different from the standard port 80. 
 * Uncomment this if using the backend-server directly on port 8081
 */
// PORT(8081);


/* 
 * If using backend server directly with HTTPS, uncomment this
 */
//SECURE(true);



/* 
 * WSPREFIX is the url prefix for websocket interface
 * AJAXPREFIX is the url prefix used for other webservices/REST-API.
 * ICONPATH is the url prefix used for icons.  
 * aprs.no uses "ws" and "srv" through a proxy. 
 * Uncomment the following two lines to use a backend with a proxy. This should be 
 * in the distribution. 
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
PROJECTION( "EPSG:3857" );
SUPPORTED_PROJ( ["EPSG:3857", "EPSG:900913", "EPSG:32633", "EPSG:25832"] );


/* Default center and scale */
CENTER    ( 14, 66 );
SCALE     ( 20000 );


/* If set to true, a popup window will appear when application is started, 
 * showing the content in 'welcome.html'. 
 */
WELCOME(false);


/* Default filter view selections, per group. 
 */
DEFAULT_FILTER(null,  "track"); // Default - if not set for group


/*
 * We can add projections using Proj4js, using the ADD_PROJECTION function.
 * Here, we need the UTM zone 32 and 33 projections for Scandinavia
 */

const utmproj = ADD_PROJECTION
 (  "EPSG:32633", "+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
     [-2500000, 3500000, 3045984, 9045984]
 );
 
 const utm33euref = ADD_PROJECTION
 (  "EPSG:32633", "+proj=utm +zone=33 +ellps=EUREF89 +datum=EUREF89 +units=m +no_defs",
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
        resolutions: [1354, 677, 338.5, 169.25, 84.625, 42.3125, 21.15625, 10.5781255, 5.2890625, 2.64453125, 1.322265625, 0.6611328]
    });


/* Generate WMTS tilegrids */  
const KV_grid_WMTS = TILEGRID_WMTS(utmproj, 0, 14, "EPSG:32633");
const DAF_grid_WMTS  = TILEGRID_WMTS(utmproj, 0, 14, "EPSG:25832");


   
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
    projection: "EPSG:3857",
},
[
    new ol.layer.Tile({
        name: 'OpenStreetMap',
        source: new ol.source.OSM()
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
    /* This is an example of how we can use mapcache. 
     * See /etc/polaric-webapp2/mapcache.xml 
     */
    createLayer_MapCache( {
        name: "Norgeskart bakgrunn (cache)",
        opacity: 0.65,
        layers: "kv_grunnkart",
        tilegrid: KV_grid_UTM,
        attributions: KV_ATTR, 
        seed_max_res: 30
    }),   

    createLayer_MapCache( {
        name: "Norgeskart bakgrunn gråtone (cache)",
        opacity: 0.65,
        layers: "kv_grunnkart2",
        tilegrid: KV_grid_UTM,
        attributions: KV_ATTR, 
        seed_max_res: 30
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
            url: "https://wms.geonorge.no/skwms1/wms.rutenett",
            params: {'LAYERS':'UTMrutenett', VERSION: "1.1.1"}
        })
    }),
    new ol.layer.Tile({
       name: "Plus codes grid",
       source: new ol.source.XYZ({
          // OpenLayers XYZ layers use WMS tile numbering by default.
          url: 'https://grid.plus.codes/grid/wms/{z}/{x}/{y}.png?col=red'
       }),
    }),

]);



LAYERS ({ 
    base: false,
    predicate: AND( SCALE_LT (2000000), IN_EXTENT(Norway) )
},[  
    createLayer_WFS({
        name : "Brannstasjoner (DSB)",
        description: "Lokale brannstasjoner. Kilde: DSB.",
        url  : "https://ogc.dsb.no/wfs.ashx", 
        ftype: "layer_183",
        newVersion: false,
        
        style: GETSTYLE("Fireicon"),
        info : FEATUREINFO([
            {val: "$(brannstasj)"},
            {val: "$(brannvesen)"},
            {val: "Type $(stasjonsty)"}
        ])
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

var defaultStyle = 'Red + blue';
STYLES ([
    { id: "Red + blue",
        tag : /gpx|wfs/, 
        stroke: {color: 'rgba(200,0,0,1)', width: 1.5},
	    fill  : 'rgba(255,240,220,0.3)',
	    text  : {scale: 0.9,  offsetY: 14, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#55ea'})
    },
    { id: "Red dashed",
        tag : /gpx|wfs/, 
        stroke: {color: 'rgba(200,0,0,1)', width: 2.2, lineDash: [3,3.5]},
	    fill  : 'rgba(255,240,220,0.3)',
	    text  : {scale: 0.9,  offsetY: 14, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#55ea'})
    },  
    { id: "Red (no fill)",
        tag : /gpx|wfs/, 
        stroke: {color: 'rgba(200,0,0,1)', width: 1.5},
	    text  : {scale: 0.9,  offsetY: 14, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#55ea'})
    },
    { id: "Green + red",
        tag: /gpx|wfs/,
        stroke: {color: 'rgba(0,100,0,1)', width: 1.5},
	    fill  : 'rgba(220,255,220,0.3)',
	    text  : {scale: 0.9,  offsetY: 14, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#f448'})
    }, 
    { id: "Green (no fill)",
        tag: /gpx|wfs/,
        stroke: {color: 'rgba(0,100,0,1)', width: 1.5},
	    text  : {scale: 0.9,  offsetY: 14, fill: '#300', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#f448'})
    },
    { id: "Blue dashed",
        tag: /gpx|wfs/,
        stroke: {color: 'rgba(0,80,200,1)', width: 2.2, lineDash: [3,3]},
	    fill  : 'rgba(200,220,253,0.3)',
	    text  : {scale: 0.9,  offsetY: 14, fill: '#003', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#55ff'})
    },
    { id: "Blue (No fill)",
        tag: /gpx|wfs/,
        stroke: {color: 'rgba(0,0,200,1)', width: 1.5},
	    text  : {scale: 0.9, offsetY: 14, fill: '#003', stroke: {color: '#fff', width: 3} },
	    image : CIRCLE(4, {fill: '#55f8'})
    },
    
    
    { id: "Fireicon",
        tag   : /wfs/,
        text  : {baseline: 'Bottom', offsetY: 14, scale: 0.9, fill: '#003', stroke: {color: '#fff', width: 3} },
	    image : ICON("aprsd/icons/car-fire.png", {})
    },
    
    /* styles for bicycle wheel model: Circles and labels */
    { id: "bike25", 
       stroke: {color: 'rgba(200,0,0,1)', width: 1.4},
       fill  : 'rgba(255,220, 100, 0.15)',
       text  : {scale: 1.1, fill: '#003', stroke: {color: '#fff', width: 3}, text: '25%' }
    },
    { id: "bike50", 
       stroke: {color: 'rgba(0,150,10,1)', width: 1.4, lineDash: [3,3]},
       text  : {scale: 1.1, fill: '#003', stroke: {color: '#fff', width: 3}, text: '50%' }
    },
    { id: "bike75", 
       stroke: {color: 'rgba(0,10,200,1)', width: 1.4, lineDash: [3,3]},
       text  : {scale: 1.1, fill: '#003', stroke: {color: '#fff', width: 3}, text: '75%' }
    },
    { id: "bike95", 
       stroke: {color: 'rgba(0,0,0,1)', width: 1.1},
       text  : {scale: 1.1, fill: '#003', stroke: {color: '#fff', width: 3}, text: '95%' }
    }
]);




/***************************************************************************************
 * Menu of predefined map-extents.
 *
 * Extents are upper left corner (1) and lower right corner (2) in decimal degrees
 * [longitude-1, latitude-1, longitude-2, latitude-2]
 * 
 * This is an example with 3 areas in Scandinavia
 ***************************************************************************************/

var defaultView = 'default';
VIEWS ([
   { name: 'oslo',       title: 'Oslo',       extent: [ 9.3833, 59.3858, 12.161,  60.1985] },
   { name: 'stockholm',  title: 'Stockholm',  extent: [15.181, 58.599, 19.942, 59.956]},
   { name: 'copenhagen', title: 'Copenhagen', extent: [11.321, 55.349, 13.379, 55.996] }
]);


