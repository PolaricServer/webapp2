     
   var browser = new polaric.MapBrowser('map', CONFIG);
   
  // var ls = new polaric.LayerSwitcher(browser);   
  // ls.displayLayers(document.getElementById('layers'));
   
   
   
   /* Popup windows and context menus */
   browser.ctxMenu.addMenuId("map", "MAP");

   browser.ctxMenu.addCallback("MAP", function(m) {
     m.add('Show map reference', function () { show_Mapref( m.x, m.y ); });
     m.add(null);
     m.add('Center point', function()   { browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])); } );
     m.add('Zoom in', function()        { browser.view.setZoom(browser.view.getZoom()+1); } );
     m.add('Zoom out',  function()      { browser.view.setZoom(browser.view.getZoom()-1); } );
   });
   
   
   
   browser.ctxMenu.addMenuId("toolbar", "TOOLBAR", true);
   
   browser.ctxMenu.addCallback("TOOLBAR", function(m) {
     m.add('Blow up all', function () { alert("Boom!"); });
     m.add('Do nothing', function () { alert("What?"); });
   });
   
   
  polaric.addHandlerId("tb_layers", true,  
        function(e) {show_Layers(e.iconX, e.iconY);} );
  
  

  
  browser.ctxMenu.addMenuId('tb_area', 'AREASELECT', true);
  
  browser.ctxMenu.addCallback('AREASELECT', function (m) {

      for (var i in browser.config.aMaps) 
         if (browser.config.aMaps[i] && browser.config.aMaps[i].name && browser.config.aMaps[i].name.length > 1 && 
              !browser.config.aMaps[i].hidden)
            m.add(browser.config.aMaps[i].title, handleSelect(i));
      
      function handleSelect(i) {
         return function() {
           browser.fitExtent(browser.config.aMaps[i].extent);
         } 
      }
    });

 
  
   
/*
   gui.showPopup( { html:   "Bla bla",
                    pixPos: [400, 400],
                    geoPos: [19, 69],
                    image:  true, 
                    id:     "test" } );
*/



var ls = null;
   
function show_Layers(x,y) {
   browser.gui.showPopup( { 
            html:   '<div id="layers_"><H1>LAYERS</H1></div>',
            pixPos: [x, y],
            id:     "layerswitcher" } );
   
   setTimeout(function() {
       ls = new polaric.LayerSwitcher(browser); 
       ls.displayLayers(document.getElementById('layers_'));
   }, 200);
}

   

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
