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


//Set the desired colors underneat with Hex Variables.
//must contain a string like #fff with values between 0-9 and a-f and 3 or 6 hex decimals
//Defaults back to default hex if providing wrong values
//default color: black, default hex: #1f1f1f

snow.color = [
    {fill: "#1f1f1f", stroke: null}, // Default Black
    {fill: "#e60505", stroke: "#d00505"}, // Default Red
    {fill: "#ff9a28", stroke: "#d07000"}, // Default Orange
    {fill: "#ffff00", stroke: "#a06000"}, // Default Yellow
    {fill: "#01b301", stroke: "#01a001"}, // default Green
    {fill: "#05a0d0", stroke: "#0285c0"}, // default Blue
    {fill: "#a300a3", stroke: null}  // default Purple
];


//Activate Freehand drawing? Y/N
snow.activateFreedraw = "N"


snow.draw = null; 
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
    if( !color || color==null )
        { return false }
    //regex of hex with 3 or 6 letters
    else if ( color.fill.search(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) == 0 )
        { return true }
    else
        { return false }
}

//Global opacity declaration.
const hexOpacity = "20"
   
var hexColor = [ 
    {fill:"#1f1f1f", stroke: null},
    {fill:"#e60000", stroke: null}, 
    {fill:"#ff9a28", stroke: null}, 
    {fill:"#ffff00", stroke: null}, 
    {fill:"#01b301", stroke: null}, 
    {fill:"#33ccff", stroke: null},
    {fill:"#a300a3", stroke: null} 
];

for (let i=0; i<7; i++) {
    if (snow.testHex(snow.color[i]))
        hexColor[i] = snow.color[i];
}

const hexSelectStroke = "#0569ff"
const hexSelectFill = "#9ebbff"

//Sets the color of the colorselectors. 
//Represents the colors of the hex variables used to draw.
snow.cssColors = () => {
    $('#selectBlack').css('background-color',  hexColor[0].fill)
    $('#selectRed').css('background-color',    hexColor[1].fill)
    $('#selectOrange').css('background-color', hexColor[2].fill)
    $('#selectYellow').css('background-color', hexColor[3].fill)
    $('#selectGreen').css('background-color',  hexColor[4].fill)
    $('#selectBlue').css('background-color',   hexColor[5].fill)
    $('#selectPurple').css('background-color', hexColor[6].fill)
} //End cssColors


//Default source for drawing.
snow.drawSource = new VectorSource()

snow.drawLayer = snow.draftLayer = new VectorLayer(
    { name: "DRAFT", source: snow.drawSource }
);



snow.drawMap = null; 



snow.changeLayer = function(layer) {
    const ly = snow.drawLayer; 
    snow.drawSource = layer.getSource(); 
    snow.drawLayer = layer; 
    return ly;
}


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


