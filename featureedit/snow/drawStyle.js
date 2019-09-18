/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

//Sets the current style to the selected color.
snow.setStyleColor = function(colorVal)
{
    snow.currentStyle = snow.getStyle(colorVal)
}
   
//Returns a style with a certain color.
snow.getStyle = function(colorVal)
{
    let st = new Style(
    {
        stroke: new Stroke(
        {
            color: colorVal,
            width: 2.3
        }),
        fill: new Fill(
            { color: colorVal + hexOpacity }),
            
        text: new ol.style.Text(
            { fill: new Fill({color: colorVal}),
              stroke: new Stroke( {width: 2.5, color: "#fff"} ), 
              scale: 1.0
            }
        )
    })
    return st
}


//Initial color settings.
snow.setStyleColor(hexBlack)


//Style for selecting features.
snow.selectStyle = new Style(
{
    stroke: new Stroke(
    {
        color: hexSelectStroke,
        width: '3.1',
        lineDash: [3,3.5]
    }),
    fill: new Fill(
    { color: hexSelectFill + hexOpacity })
})


//Toggles orange border on deleteLayer when clicking and removes it on mouseleave.
snow.deleteHighlightHandler = function() 
{
    $('#deleteLayer').mousedown( () => 
    { $('#deleteLayer').addClass("selectedFunction") }).mouseup( () => 
    { $('#deleteLayer').removeClass("selectedFunction") }).mouseleave( () => 
    { $('#deleteLayer').removeClass("selectedFunction") })
}
