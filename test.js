     
   var browser = new polaric.MapBrowser('map', CONFIG);
   setTimeout(widget.restore, 500);

   /* Set up app specific context menus */
   browser.ctxMenu.addCallback("MAP", function(m) {
     m.add('Show map reference', function () { browser.show_MaprefPix( [m.x, m.y] ); });
     m.add(null);
     m.add('Center point', function()   { browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])); } );
     m.add('Zoom in', function()        { browser.view.setZoom(browser.view.getZoom()+1); } );
     m.add('Zoom out',  function()      { browser.view.setZoom(browser.view.getZoom()-1); } );
   });

   browser.ctxMenu.addCallback("TOOLBAR", function(m) {
     m.add('Find position', function () { var x = new polaric.refSearch(); x.activatePopup("refSearch", [50,70]) });
     m.add('Blow up all', function () { alert("Boom!"); });
     m.add('Do nothing', function () { alert("What?"); });
   });
   

/*
   gui.showPopup( { html:      "Bla bla",
                    pixPos:    [400, 400],
                    geoPos:    [19, 69],
                    image:     true, 
                    draggable: true,
                    id:        "test" } );
*/

