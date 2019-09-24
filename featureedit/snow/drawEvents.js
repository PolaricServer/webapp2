/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

//OnClick handler for drawToggle.
snow.drawToggle_click = function() 
{ 
    if ( !snow.toggleDraw )
    {
        snow.addDraw()
        //Enables snap if snap was previously toggled on.
        if ( snow.toggleSnap )
            { snow.addSnap() }
        //Disable modify while draw is active.
        if ( snow.toggleModify )
        {
            snow.removeModify()
            snow.toggleModify = false
        }
    }
    //Removes snap and draw if draw is active.
    else
    {
        snow.removeSnap()
        snow.removeDraw()
    }
    snow.toggleDraw = !snow.toggleDraw 
}//End drawToggle_click()



//OnClick handler for modifyToggle.
snow.modifyToggle_click = function()
{ 
    snow.removeDraw()
    snow.removeSnap()
    snow.toggleDraw = false;
    
    if ( !snow.toggleModify )
        { snow.addModify() }
    else
        { snow.removeModify() }
    snow.toggleModify = !snow.toggleModify
} //End modifyToggle_click()



//OnClick handler for snapToggle.
snow.snapToggle_click = function()
{
    if( snow.toggleDraw || snow.toggleModify )
    {
        if ( !snow.toggleSnap )
            { snow.addSnap() }
        else
            { snow.removeSnap() }
        snow.toggleSnap = !snow.toggleSnap
    }
} //End snapToggle_click()



//OnClick handler for deleteLayer. 
snow.deleteLayer_click = function()
{
    try
    {
        //Checks if at least one feature is selected.
        if( snow.selectedFeatures[0] )
        {
            //Cycles through the array of selected features and removes them from the source.
            snow.selectedFeatures.forEach((e) => 
            { 
                e.remove = true; 
                snow.drawSource.removeFeature(e) 
                snow.removeSingleMeasureTooltip(e) 
            })
            snow.selectedFeatures = [] 
            snow.addNewChange() //Updates the undo function array.
        }
    }
    catch(error)
    {
        console.log("Unexpected Error Caught:\n" + error)
    }
} //End deleteLayer_click()



snow.deleteFeature = function(f)
{
    f.remove = true; 
    snow.drawSource.removeFeature(f);
}



snow.drawingColor = "selectBlack";


//OnClick handler for changing drawing color.
snow.colorOption_click = function(e) 
{
    //Removes selectedColor class from last drawing color.
    $('#'+snow.drawingColor).removeClass("selectedColor")
    //Gets id from clicked color selector.
    snow.drawingColor = e.target.id
    //Adds selectedColor class to the current drawing color.
    $("#"+snow.drawingColor).addClass("selectedColor")
    
    //Switch to set the current selected color as Style.
    switch( snow.drawingColor )
    {
        case "selectRed":
            snow.setStyleColor(hexRed)  
            break
    
        case "selectOrange":
            snow.setStyleColor(hexOrange) 
            break
                
        case "selectYellow":
            snow.setStyleColor(hexYellow)
            break 
                        
        case "selectGreen":
            snow.setStyleColor(hexGreen)
            break
            
        case "selectBlue":
            snow.setStyleColor(hexBlue)
            break
            
        case "selectPurple":
            snow.setStyleColor(hexPurple)
            break
        
        default:
            snow.setStyleColor(hexBlack)
    }//End of switch
    
    //Changes the color of all selected features.
    snow.updateStyle()
    
} //End colorOption_click()



/* FIXME: Move to proper source file */
snow.updateStyle = function() {
    if( snow.selectedFeatures[0] )
    {
        snow.selectedFeatures.forEach( (e) =>
        {          
            e.chStyle = true; 
            e.setStyle(snow.currentStyle)
            e.originalStyle = NaN; 
        })
        snow.selectedFeatures = [] 
    }
}




snow.tooltipElement = null;

//OnClick handler for printing out leangth/area of feature.
snow.toggleMetric_click = function()
{ 
    if(snow.toggleAreal)
    {
        $('#printMetric').removeClass('selectedFunction')
        snow.removeAllMeasureTooltip()
    }
    else
    {
        $('#printMetric').addClass('selectedFunction')
        snow.addMeasureOverlay()
    }
    snow.toggleAreal = !snow.toggleAreal
} //End toggleMetric_click()



//Function to get area calculation from a feature.
snow.getAreal = function(f)
{
    let output = "none selected"
     //Gets the geometry of a feature.
    const geom = f.getGeometry()
     //Gets the type of geometry.
    const geomType = geom.getType()
    if ( geomType == "Polygon" ) 
    {
        const area = Sphere.getArea(geom)
        output = getMetrics("1", area)
    }
    else if ( geomType == "Circle" ) 
    {  
        //Converts the circle to a polygon so that we can calculate. 
        //the area with the correct values, regardless of EPSG projection.
        const area = Sphere.getArea(PolygonGeom.fromCircle(geom))
        output = getMetrics("1", area)
    }
    else if ( geomType == "LineString" )
    {
        const length = Sphere.getLength(geom)
        output = getMetrics("2", length)
    }//End if

    return output
    
    //Function for calculation and formats of metric and print out.
    function getMetrics( type, metric )
    {
        let output
        //Calculates and formats Area of Polygon/Circle.
        if( type == "1" )
        {
            if ( metric > 10000 ) 
            { output = (Math.round(metric / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>' } 
            else 
            { output = (Math.round(metric * 100) / 100) + ' ' + 'm<sup>2</sup>' }
            return output
        }
        //Calculates and formats length of LineString.
        else if( type == "2" ) 
        {
            if ( metric > 100 ) 
            { output = (Math.round(metric / 1000 * 100) / 100) + ' ' + 'km' } 
            else 
            { output = (Math.round(metric * 100) / 100) + ' ' + 'm' }
            return output
        }
    } //End getMetrics()
} //End getAreal()




//OnClick handler to set draw to Freehand style.
snow.freehand_click = function()
{
    if( snow.toggleFreehand == false )
    {
        snow.toggleFreehand = true;
        $('#freehand').addClass('selectedFunction')
        $('#straight').removeClass('selectedFunction')
        snow.refreshDraw()
    }
} // End freehand_click()



//OnClick handler to set draw to Point-to-Point style.
snow.straight_click = function()
{
    if( snow.toggleFreehand == true )
    {
        snow.toggleFreehand = false;
        $('#straight').addClass('selectedFunction')
        $('#freehand').removeClass('selectedFunction')
        snow.refreshDraw()
    }
}//End straight_click()
 
 
 
snow.dashedstyle = false; 
snow.filledstyle = true;

        
snow.dashedstyle_click = function()
{
    if (snow.dashedstyle == true) {
        snow.dashedstyle = false; 
        $("#dashedstyle").removeClass("selectedFunction")
    }
    else {
        snow.dashedstyle = true
        $("#dashedstyle").addClass("selectedFunction")
    }
    snow.setStyleDashed(snow.dashedstyle);
    snow.updateStyle();
    snow.refreshDraw();
}



snow.filledstyle_click = function()
{
    if (snow.filledstyle == true) {
        snow.filledstyle = false; 
        $("#filledstyle").removeClass("selectedFunction")
    }
    else {
        snow.filledstyle = true
        $("#filledstyle").addClass("selectedFunction")
    }
    snow.setStyleFilled(snow.filledstyle);
    snow.updateStyle();
    snow.refreshDraw();
}
 
 
 
//Boolean to check if clicked location contains a feature.
snow.featureCheck = false //True = feature on pixel/location.
//Function for manually selecting a feature.
//Created cause of problems with ol.Select being global and causing unintended issues.
snow.manualSelect = function(pixel) 
{
    if (snow.toggleDraw)
        return; 
    snow.featureCheck = false
    //Checks for features at pixel and toggles Select on them.
    snow.drawMap.forEachFeatureAtPixel(pixel, function(f) 
    { 
        //Gets the type of the feature.
        let fType = f.getGeometry().getType()
        //If type = Point it's an icon.
        if( fType == 'Point' && !snow.toggleDraw )
        {
            snow.selectIcons(f)
        }
        //If type is a Polygon, Circle or LineString it's a drawn object/feature.
        else if ( fType == 'Circle' || fType == 'Polygon' 
            || fType == 'LineString' )
        {
            snow.selectMarkedArea(f)
        }
    }) //End map.forEachFeatureAtPixel()

    //Deselects all features when clicking somewhere without a feature.
    if( !snow.featureCheck )
        snow.deselectAll();
} //End manualSelect()



snow.deselectAll = function() 
{
    //Loops throught all selected features and returns their original style.
    snow.selectedFeatures.forEach( f =>
    {
        /* Deselect */
        f.setStyle(f.originalStyle); 
        f.originalStyle = NaN; 
    }) //End selectedFeatures.forEach()
     
    //removes all metrics from map
    if( snow.toggleAreal )
        snow.removeAllMeasureTooltip()
    snow.selectedFeatures = []
}




//Function for selecting marked areas. 
snow.selectMarkedArea = function(f)
{
    if ( snow.drawSource.getFeatures().includes(f) && !snow.selectedFeatures.includes(f) )
    {
        /* Select */
        f.originalStyle = f.getStyle();
        f.setStyle(snow.selectStyle)
        snow.selectedFeatures.push(f)
        snow.lastSelected = f;
        //adds area for the selected feature to the map
        if ( snow.toggleAreal )
            snow.addMeasureOverlay(f)

        $(document).trigger("selectfeature"); 
    }

    
    //Deselects the clicked feature if it was already selected.
    else if( snow.selectedFeatures.includes(f) )
    {
        /* Deselect */
        f.setStyle(f.originalStyle);
        f.originalStyle = NaN;
        let fIndex = snow.selectedFeatures.indexOf(f)
        snow.selectedFeatures.splice(fIndex, 1)
        
        if ( snow.toggleAreal )
            snow.removeSingleMeasureTooltip(f)
    }

    //Sets the featureCheck to true to prevent the deselect all.
    if( !snow.featureCheck )
        snow.featureCheck = true

} //End selectMarkedArea()




//Function for selecting icons in icon tab. 
snow.selectIcons = function(f)
{
    if( !snow.droppingIcon )
    { 
        // DO SELECT STUFF FOR ICONS HERE
        // TODO: Write out information about Icon
        console.log("Icon")
    } 
    else 
        snow.droppingIcon = false
} //End selectIcons()



//OnClick handler for selecting geometry type.
snow.setCurrentType = function(selectedID)
{
    //Checks geometry type and refreshes draw.
    if ( selectedID == "optPolygon" )
        snow.drawType = "Polygon"
    else if ( selectedID == "optLine" )
        snow.drawType = "LineString"
    else if ( selectedID == "optCircle")
        snow.drawType = "Circle"
    else //error happened selecting type.
        console.log("Unexpected error while selecting geometry type")
    snow.refreshDraw()
} //End setCurrentType_click()   


