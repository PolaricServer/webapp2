/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

var snow = window.snow;

snow.measureTooltipElement = null;
snow.measureTooltip = null;



//Adds new measure overlays to the map.
snow.addMeasureOverlay = function(f=null)
{
    let tooltipCoord
    //Adds a tooltip to a feature.
    function createTooltip(f)
    {
        snow.createMeasureTooltip(f)
        //Gets the coordinate of the feature.
        if ( f.getGeometry() instanceof PolygonGeom ) 
        {
            tooltipCoord = f.getGeometry().getInteriorPoint().getCoordinates();
        } 
        else if ( f.getGeometry() instanceof ol.geom.LineString ) 
        {
            tooltipCoord = f.getGeometry().getLastCoordinate();
        } 
        else if(f.getGeometry() instanceof ol.geom.Circle)
        {
            tooltipCoord = f.getGeometry().getCenter()
        }
        //Adds Area measurement to the overlay.
        snow.measureTooltipElement.innerHTML = snow.getAreal(f);
        //Sets the position of the overlay on top of the feature.
        snow.measureTooltip.setPosition(tooltipCoord);
    } //End createTooltip()

    //Checks if input is given.
    if ( f )
    {
        createTooltip(f)
    }
    else if ( snow.selectedFeatures[0] )
    {
        snow.selectedFeatures.forEach( (f) =>
        {
           createTooltip(f)
        })
    }
} //End addMeasureOverlay()


snow.tooltipObjects = []
// Creates a new measure tooltip.
snow.createMeasureTooltip = function(f) 
{
    snow.measureTooltipElement = document.createElement('div');
    snow.measureTooltipElement.className = 'tooltip tooltip-measure'
    snow.measureTooltip = new ol.Overlay({
        element: snow.measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    })
    //Creates an object to keep track of what tooltip belongs to which features.
    let tooltipObj = 
    {
        "ol_uid":f.ol_uid, 
        "overlay": snow.measureTooltip,
        "element": snow.measureTooltipElement 
    }
    
    snow.tooltipObjects.push(tooltipObj)
    snow.drawMap.addOverlay(snow.measureTooltip)
} //End createMeasureTooltip()



//Function to remove a single area overlay, identified by a feature f.
snow.removeSingleMeasureTooltip = function(f)
{
    //Cycles through the list to find the tooltip that belongs to feature f.
    snow.tooltipObjects.forEach( (e) => 
    {
        if( f.ol_uid == e.ol_uid )
        {
            let element = e.element
            element.parentNode.removeChild(element)
            snow.drawMap.removeOverlay(e.overlay)
            let eIndex = snow.tooltipObjects.indexOf(e)
            snow.tooltipObjects.splice(eIndex, 1)
        }
    })
} //End removeSingleMeasureTooltip()




//Function to remove all area overlays.
snow.removeAllMeasureTooltip = function()
{
    //Loops throught all area overlays and removes them.
    snow.tooltipObjects.forEach((e) =>
    {
        let element = e.element
        element.parentNode.removeChild(element)
        snow.drawMap.removeOverlay(e.overlay)
    })
    snow.tooltipObjects = []
} //End removeAllMeasureTooltip()
