/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

snow.drawCB = null; 
snow.modifyCB = null;


/* Set callbacks for draw-end and modify-end */
snow.setCallbacks = function(draw, modify) {
    snow.drawCB = draw;
    snow.modifyCB = modify; 
}



//Function to add drawing functionality to map.
snow.addDraw = function()
{
    snow.draw = new Draw(
    {
        source: snow.drawSource,
        type: snow.drawType,
        freehand: snow.toggleFreehand,
    })
    snow.drawMap.addInteraction(snow.draw)
    $('#drawToggle').addClass('selectedFunction')

    //Adds style to drawn feature and adds it to the undo Array.
    snow.draw.on('drawend', e=>{ 
         e.feature.setStyle(snow.currentStyle)
         snow.addNewChange(e.feature)
         
         if (e.feature.getGeometry().getType() == "Circle")
            setTimeout(()=>snow.selectMarkedArea(e.feature), 100);
    })
    if (snow.drawCB)
        snow.draw.on('drawend', snow.drawCB);
    
} //End addDraw()


//Function to add modify functionality to map.
snow.addModify = function()
{
    //Defines modify interractions.
    snow.modify = new Modify({source: snow.drawSource})
    snow.drawMap.addInteraction(snow.modify)
    $('#modifyToggle').addClass('selectedFunction')
    if (snow.modifyCB)
        snow.modify.on("modifyend", snow.modifyCB); 
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
    snow.drawMap.removeInteraction(snow.draw) 
    $('#drawToggle').removeClass('selectedFunction')
} //End removeDraw()


//Function to disable Modify functionality from the map.
snow.removeModify = function() 
{ 
    snow.drawMap.removeInteraction(snow.modify)
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
