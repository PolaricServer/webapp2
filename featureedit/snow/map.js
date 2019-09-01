/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

//map imports
const TileLayer = ol.layer.Tile
const OSM = ol.source.OSM
const Map = ol.Map
const View = ol.View

/**
 * Script to create the map layer.
 */
let raster = new TileLayer(
{ source: new OSM() })
var browser = 
{
    map: new Map(
    {
        layers: [raster],
        target: 'map',
        view: new View(
        {
            center: ol.proj.fromLonLat([10.757933, 59.911491]),
            zoom: 6
        })
    })
}


snowmarker_init(browser.map);
