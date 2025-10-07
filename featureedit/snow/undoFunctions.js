/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

var snow = window.snow | {};


// FIXME: This could easily be converted to a class

//initiates the array with all existing features
snow.undoArr = null;  // Will be lazily initialized
snow.undoCount = 0
//sets the maximum ammount of changes kept
snow.undoMaxCount = 20
snow.undoMaxArr = snow.undoMaxCount -1

// Lazy initialization function for undoArr
snow.initUndo = function() {
    if (snow.undoArr === null && snow.drawSource) {
        snow.undoArr = [snow.drawSource.getFeatures()];
    }
}



//Adds a new change so its possible to revert
snow.addNewChange = function( feature )
{
    snow.initUndo();
    if ( snow.undoArr.length >= snow.undoMaxCount )
    {
        snow.undoArr.shift()
    }
    let features = snow.drawSource.getFeatures()
    if ( feature )
    {
        features = features.concat(feature)
    }
    snow.undoArr.push(features)
    snow.undoCount = snow.undoArr.length -1
}


//undo's a change
snow.undoChange = function ()
{
    snow.initUndo();
    if ( snow.undoCount > 0 )
    { 
        snow.undoCount--    
        console.log(snow.undoCount)
    }
    else 
    {
        snow.undoCount = 0
    }
    snow.drawSource.clear()
    snow.drawSource.addFeatures(snow.undoArr[snow.undoCount])
}

//redo's a change
snow.redoChange = function()
{
    snow.initUndo();
    if ( snow.undoCount <= snow.undoMaxArr && snow.undoCount+1 < snow.undoArr.length )
    { 
        snow.undoCount++
    }
    if( snow.undoCount < snow.undoArr.length )
    {
        snow.drawSource.clear()
        snow.drawSource.addFeatures(snow.undoArr[snow.undoCount])
    }
}

snow.redoChange_click = function()
{ snow.redoChange() }

snow.undoChange_click = function()
{ snow.undoChange() }
