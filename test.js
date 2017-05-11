     
   var browser = new polaric.MapBrowser('map', CONFIG);
   
   var ls = new polaric.LayerSwitcher(browser);   
   ls.displayLayers(document.getElementById('layers'));
   
   
   
   /* Popup windows and context menus */
   browser.ctxMenu.addMenuId("map", "MAP");

   browser.ctxMenu.addCallback("MAP", function(m) {
     m.add('Show map reference', function () { show_Mapref( m.x, m.y ); });
     m.add(null);
     m.add('Center point', function(e)  { browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])); } );
     m.add('Zoom in', function()        { browser.view.setZoom(browser.view.getZoom()+1); } );
     m.add('Zoom out',  function()      { browser.view.setZoom(browser.view.getZoom()-1); } );
   });
   
   
   
   browser.ctxMenu.addMenuId("toolbar", "TOOLBAR", true);
   
   browser.ctxMenu.addCallback("TOOLBAR", function(m) {
     m.add('Blow up all', function () { alert("Boom!"); });
     m.add('Do nothing', function () { alert("What?"); });
   });
   
   
/*
   gui.showPopup( { html:   "Bla bla",
                    pixPos: [400, 400],
                    geoPos: [19, 69],
                    image:  true, 
                    id:     "test" } );
*/
   
function show_Mapref(x,y) 
{
     var coord = browser.pix2LonLat([x,y]);
     var llref = new LatLng(coord[1], coord[0]);
     var utmref = llref.toUTMRef();
    
     var h = '<span class="sleftlab">UTM:</span>' + showUTMstring(""+utmref) +'<br>' +
             '<nobr><span class="sleftlab">Latlong:</span>' + polaric.formatLL(coord) +'<br>'  + 
             '</nobr><span class="sleftlab">Loc:</span>' + polaric.ll2Maidenhead(coord);       
     browser.gui.showPopup( 
        {html: h, geoPos: coord, image: true} );
}


function showUTMstring(sref)
{
   return sref.substring(0,5)+'<span class="kartref">' + sref.substring(5,8) + '</span>'+
          sref.substring(8,13)+'<span class="kartref">' + sref.substring(13,16) + '</span>'+
          sref.substring(16);
}
