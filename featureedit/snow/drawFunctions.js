/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

//Function to add drawing functionality to map.
snow.addDraw = function()
{
    draw = new Draw(
    {
        source: snow.drawSource,
        type: snow.drawType,
        freehand: snow.toggleFreehand,
    })
    snow.drawMap.addInteraction(draw)
    $('#drawToggle').addClass('selectedFunction')

    //Adds style to drawn feature and adds it to the undo Array.
    draw.on('drawend', function (e)
    { 
         e.feature.setStyle(snow.currentStyle)
         snow.addNewChange(e.feature)
    })
} //End addDraw()

//Function to add modify functionality to map.
snow.addModify = function()
{
    //Defines modify interractions.
    modify = new Modify({source: snow.drawSource})
    snow.drawMap.addInteraction(modify)
    $('#modifyToggle').addClass('selectedFunction')
} //End addModify()

//Function to snap on geometry types.
snow.addSnap = function()
{
    snow.snap = new Snap({source: snow.drawSource})
    snow.drawMap.addInteraction(snow.snap)
    $('#snapToggle').addClass('selectedFunction')
} //End addSnap()

//Function to disable draw functionality.
snow.removeDraw = function()
{ 
    snow.drawMap.removeInteraction(draw) 
    $('#drawToggle').removeClass('selectedFunction')
} //End removeDraw()

//Function to disable Modify functionality from the map.
snow.removeModify = function() 
{ 
    snow.drawMap.removeInteraction(modify)
    $('#modifyToggle').removeClass('selectedFunction')
} //End removeModify()

//Function to disable geometry snapping on draw.
snow.removeSnap = function()
{ 
    snow.drawMap.removeInteraction(snow.snap)
    $('#snapToggle').removeClass('selectedFunction')
} //End removeSnap()

//Function to refresh draw functionality, used to refresh parameters(colors/type/freehand).
snow.refreshDraw = function()
{
    if(snow.toggleDraw)
    {
        snow.removeDraw()
        snow.addDraw()
    }
} //End refreshDraw()
