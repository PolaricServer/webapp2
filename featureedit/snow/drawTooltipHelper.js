/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

var snow = window.snow;

//Helper class for tooltips.
$( function()  
{ $( document ).tooltip() })
//TODO: Check if that is allready exsistent in Polaric-Server.




//OnClick handler for tooltip.
snow.tooltip_click = function()
{
    if ( snow.toggleTooltip )
    { 
        $('#tooltip').removeClass('selectedFunction') 

        //drawStyle
        $('#straight').removeAttr("title")
        $('#freehand').removeAttr("title")
        
        //geometry
        $('#type').removeAttr("title")
        $('#optLine').removeAttr("title")
        $('#optPolygon').removeAttr("title")
        $('#optCircle').removeAttr("title")

        //colors
        $('#selectBlack').removeAttr("title")
        $('#selectRed').removeAttr("title")
        $('#selectOrange').removeAttr("title")
        $('#selectYellow').removeAttr("title")
        $('#selectGreen').removeAttr("title")
        $('#selectBlue').removeAttr("title")
        $('#selectPurple').removeAttr("title")
        
        //functions
        $('#drawToggle').removeAttr("title")
        $('#deleteLayer').removeAttr("title")
        $('#modifyToggle').removeAttr("title")
        $('#snapToggle').removeAttr("title")
    }
    else
    { 
        $('#tooltip').addClass('selectedFunction') 
        
        //drawStyle
        $('#straight').attr("title", "Enables drawing with a point to point type line")
        $('#freehand').attr("title", "Enables freehand drawing. Note: freehand is hard to modify on later")
        
        //geometry type
        $('#type').attr("title", "Selects Geometry type")
        $('#optLine').attr("title", "Draws a line, useful for making paths")
        $('#optPolygon').attr("title", "Draws a polygon, useful for marking areas")        
        $('#optCircle').attr("title", "Draws a circle on map, useful for encapsulating an area")

        //colors
        // $('.colorOption').attr("title", "Select a color")
        $('#selectBlack').attr("title", "Sets the marking color as Black and changes color of selected areas.")
        $('#selectRed').attr("title", "Sets the marking color as Red and changes color of selected areas.")
        $('#selectOrange').attr("title", "Sets the marking color as Orange and changes color of selected areas.")
        $('#selectYellow').attr("title", "Sets the marking color as Yellow and changes color of selected areas.")
        $('#selectGreen').attr("title", "Sets the marking color as Green and changes color of selected areas.")
        $('#selectBlue').attr("title", "Sets the marking color as Blue and changes color of selected areas.")
        $('#selectPurple').attr("title", "Sets the marking color as Purpleg and changes color of selected areas.")
        
        //functions
        $('#drawToggle').attr("title", "Enables drawing")
        $('#deleteLayer').attr("title", "Deletes the selected feature from the map")
        $('#modifyToggle').attr("title", "Toggles modify on/off for drawn areas")
        $('#snapToggle').attr("title", "Toggles snap on/off while drawing")
    }
    snow.toggleTooltip = !snow.toggleTooltip
}//End of tooltip_click
