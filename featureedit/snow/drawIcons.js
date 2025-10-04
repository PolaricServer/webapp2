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

snow.iconStyle = null
snow.thisID = null

snow.getIconStyle = function(imgsrc) {
    return new Icon( {
        anchor: [0.5, 38],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: imgsrc
    })
}



//OnClick hanlder for icon select.
snow.markerIcons_click = function(e)
{
  console.log("SNOW.DRAW", snow.draw);
  snow.drawMap.removeInteraction(snow.draw)
  $('#'+snow.thisID).removeClass('selectedIcon')
  console.log("snow.thisID", snow.thisID, "e.target.id", e.target.id);
  if( snow.thisID == e.target.id )
  {  
    snow.thisID=null 
    return null 
  }
  
  snow.thisID = e.target.id
  $('#'+snow.thisID).addClass('selectedIcon')
  let imgsrc = $('#'+snow.thisID).attr("src")
  let imglbl = snow.thisID.split("-", 2)[1];
  
  
  //Generates a style with the selected icon to be placed.
  let iconStyle = new Style( {
      image: snow.getIconStyle(imgsrc)
  });
 
  //Enables Point drawing.
  snow.draw = new Draw (
  {
    source: snow.drawSource,
    type: 'Point',
    name: 'POINT' 
  })
  
  snow.drawMap.addInteraction(snow.draw)
  droppingIcon = true
  
  
  //When the point is drawn, gives it the icon style and disables drawing.
  snow.draw.on('drawend', function (e)
  { 
    e.feature.setStyle(iconStyle)
    e.feature.label = imglbl;
    snow.addNewChange(e.feature)
    if( !snow.continuousIconDropping )
    { 
      snow.drawMap.removeInteraction(snow.draw)
      //Removes the selected icon class and ID after placement.
      $('#'+snow.thisID).removeClass('selectedIcon')
      snow.thisID = null
    }
  })
  
  for (f of snow.drawCB)
        snow.draw.on('drawend', f);
  
  
}//End of markerIcons_click

