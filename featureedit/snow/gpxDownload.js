/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

var snow = window.snow | {};

//Makes download prompt for the user.
snow.download = function(filename, text) 
{
    //var newlonLat = new OpenLayers.LonLat(lon, lat).transform(map.getProjectionObject() , new OpenLayers.Projection("EPSG:4326"))
    //http://epsg.io/map#srs=3857&x=5635549.221409&y=5948635.289266&z=2&layer=streets
    var element = document.createElement('a')
    element.setAttribute('href', 'data:text/gpx;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)
  
    element.style.display = 'none'
    document.body.appendChild(element)
  
    element.click()
  
    document.body.removeChild(element)
}



//TODO: FIX LAT LON COORDINATES
//Returns OSM based values
//Outputs the selected array as GPX format
snow.gpxFromFeature = function()
{
    if( selectedFeatures[0] )
    {
        //write Features to gpxFormat
        let gpxForm = gpxFormat.writeFeatures(selectedFeatures)
        return gpxForm
    }
}



//TODO: Implement button for download
snow.downloadGpx_click = function()
{ 
    let gpx = gpxFromFeature()
    let filename = "gpxDownload.gpx" //change to own input if its gonna be changable
    download(filename, gpx)
}
