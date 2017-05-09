     
   var browser = new polaric.MapBrowser('map', CONFIG);
   
   var ls = new polaric.LayerSwitcher(browser);   
   ls.displayLayers(document.getElementById('layers'));
   
   /* Popup windows and context menus */
   browser.ctxMenu.addMenuId("map", "MAP");

   browser.ctxMenu.addCallback("MAP", function(m) {
     m.add('Show map reference', function () { alert("BERT("+m.x+", "+m.y+")"); });
     m.add(null);
     m.add('Center point', function(e)  { browser.view.setCenter(); } );
     m.add('Zoom in', function()       { browser.view.setZoom(browser.view.getZoom()+1); } );
     m.add('Zoom out',  function()     { browser.view.setZoom(browser.view.getZoom()-1); } );
   });
   
   
/*
   gui.showPopup( { html:   "Bla bla",
                    pixPos: [400, 400],
                    geoPos: [19, 69],
                    image:  true, 
                    id:     "test" } );
*/
   


