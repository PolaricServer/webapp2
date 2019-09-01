/**
 * Copyright (c) 2019, Njaal Dolonen, Nicolay Skjelbred, Jan-Magnus Solheim. 
 * All rights reserved. See LICENSE for more detail.  
 * */ 

/**
 * Icons downloaded from: https://mapicons.mapsmarker.com
 * Icons licenced under Creative Commons 3.0
 * for more information check _readme-license.txt in /images/iconpack/
 */

snow.imageLoc = "images/iconpack/"

// let iconSource = new VectorSource()
// let iconLayer = new VectorLayer({
//   source: iconSource
// })
// map.addLayer(iconLayer)

snow.iconStyle = null
snow.thisID = null


//OnClick hanlder for icon select.
snow.markerIcons_click = function(e)
{
  snow.drawMap.removeInteraction(snow.draw)
  $('#'+snow.thisID).removeClass('selectedIcon')
  if( snow.thisID == e.target.id )
  { 
    snow.thisID=null 
    return null 
  }
  snow.thisID = e.target.id
  $('#'+snow.thisID).addClass('selectedIcon')
  let imgsrc = $('#'+thisID).attr("src")

  //Generates a style with the selected icon to be placed.
  let iconStyle = new Style(
  {
    image: new Icon(
    ({
      anchor: [0.5, 38],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: imgsrc
    }))
  })
 
  //Enables Point drawing.
  let draw = new Draw(
  {
    source: snow.drawSource,
    type: 'Point',
    name: 'POINT NAME TEST' //TODO: Add description?
  })
  snow.drawMap.addInteraction(draw)
  droppingIcon = true
    
  //When the point is drawn, gives it the icon style and disables drawing.
  draw.on('drawend', function (e)
  { 
    e.feature.setStyle(iconStyle)
    addNewChange(e.feature)
    if( !continuousIconDropping )
    { 
      drawMap.removeInteraction(draw)
      //Removes the selected icon class and ID after placement.
      $('#'+snow.thisID).removeClass('selectedIcon')
      snow.thisID = null
    }
  })
}//End of markerIcons_click
