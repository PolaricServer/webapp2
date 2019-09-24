/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 
//Import and create predefined calls for functions.
const Draw = ol.interaction.Draw 
const Modify = ol.interaction.Modify 
const Snap = ol.interaction.Snap 
const DrawSelect= ol.interaction.Select 
const getActive = ol.interaction.getActive 
const VectorLayer = ol.layer.Vector
const VectorSource = ol.source.Vector
const CircleStyle = ol.style.Circle 
const Fill = ol.style.Fill 
const Stroke = ol.style.Stroke 
const Style = ol.style.Style 
const Icon = ol.style.Icon
const FromLonLat = ol.proj.fromLonLat
const Sphere = ol.sphere 
const PolygonGeom = ol.geom.Polygon 
const Point = ol.geom.Point
const Feature = ol.Feature
const jsonFormat = ol.format.GeoJSON
const gpxFormat = ol.format.GPX


var snow = snow || {};


snow.draw = false; 
snow.snap = false;
snow.drawSelect = false;
snow.feature = false;
snow.drawSelect = false;
snow.toggleDraw = false;
snow.toggleModify = false;
snow.toggleSnap = false;
snow.toggleFreeHand = false;
snow.toggleTooltip = false; 
snow.droppingIcon = false;
snow.toggleAreal = false; 
snow.drodownShown = false;

//Decides if icons has to be toggled on/off or is disabled after drop.
snow.continuousIconDropping = false; 

//Contains the currently selected style.
snow.currentStyle = null;

//originalStyles Contains the original ol_uid of a feature and the style.
//selectedFeatures Contains the currently selected Features.
snow.originalStyles = [];
snow.selectedFeatures = [];
snow.lastSelected = null;

//Default draw type: "Polygon", Options: "LineString", "Polygon", "Circle".
snow.drawType = "Polygon"

//test to figure out of config options given by user is a valid hex value
snow.testHex = function(color)
{
    if( !color )
        { return false }
    //regex of hex with 3 or 6 letters
    else if ( color.search(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) == 0 )
        { return true }
    else
        { return false }
}

//Global opacity declaration.
const hexOpacity = "20"
//Global color declarations.
var hexBlack = "#1f1f1f"
if( snow.testHex(color1) )
    { hexBlack = color1 }

var hexRed = "#e60000"
if( snow.testHex(color2) )
    { hexRed = color2 }
    
var hexOrange = "#ff9a28"
if( snow.testHex(color3) )
    { hexOrange = color3 }

var hexYellow = "#ffff00"
if( snow.testHex(color4) )
    { hexYellow = color4 }

var hexGreen = "#01b301"
if( snow.testHex(color5) )
    { hexGreen = color5 }

var hexBlue = "#33ccff"
if( snow.testHex(color6) )
    { hexBlue = color6 }

var hexPurple = "#a300a3"
if( snow.testHex(color7) )
    { hexPurple = color7 }

const hexSelectStroke = "#0569ff"
const hexSelectFill = "#9ebbff"

//Sets the color of the colorselectors. 
//Represents the colors of the hex variables used to draw.
snow.cssColors = () => {
    $('#selectBlack').css('background-color', hexBlack)
    $('#selectRed').css('background-color', hexRed)
    $('#selectOrange').css('background-color', hexOrange)
    $('#selectYellow').css('background-color', hexYellow)
    $('#selectGreen').css('background-color', hexGreen)
    $('#selectBlue').css('background-color', hexBlue)
    $('#selectPurple').css('background-color', hexPurple)
} //End cssColors


//Default source for drawing.
snow.drawSource = new VectorSource()

snow.drawLayer = new VectorLayer(
    { source: snow.drawSource }
)


snow.drawMap = null; 



snow.init = function(map) {
    snow.drawMap = map;
    snow.drawMap.addLayer(snow.drawLayer)

    //handle different upper/lowercase variations
    snow.activateFreedraw.toUpperCase()
    //check for answer, always false if not a YES variation
    if ( snow.activateFreedraw == "Y" || snow.activateFreedraw == "YES" 
         || snow.activateFreedraw == "JA")
        { snow.toggleFreehand = true }   
    else 
        { snow.toggleFreehand = false }
}

snow.handleClick = function(e) {
    snow.manualSelect(e.pixel)
}

snow.activate = function() {
    //OnClick handler for selecting features.
    snow.drawMap.on('click', snow.handleClick)
    setTimeout( ()=> { 
        $("#filledstyle").addClass("selectedFunction")
        $('#straight').addClass('selectedFunction')
    }, 500);
}


snow.deactivate = function() {
    // Remove OnClick handler for selecting features.
    snow.drawMap.un('click', snow.handleClick)
}



