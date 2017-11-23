
   /* 
    * Instantiate the map browser and restore widgets from a previous session. 
    */  
   var browser = new pol.core.MapBrowser('map', CONFIG);
   setTimeout(pol.widget.restore, 500);
   
   
   /*
    * Add a tracking-layer using a polaric server backend.
    */  
   var srv = new pol.tracking.PolaricServer();
   var mu, flt; 
   setTimeout(function() {
      mu = new pol.tracking.Tracking(srv);
      flt = new pol.tracking.Filters(mu);
   }, 1000); 
   

   /* Set up application-specific context menus. We may define named contexts. The toolbar 
    * define its own context, 'TOOLBAR'. See below how we define 'MAP' and 'POINT'. 
    * 
    * A callback function is associated with a named context and is called when we need to 
    * activate the menu. Use it to add menu items. Adding null means adding a separator. 
    */ 
   browser.ctxMenu.addCallback("MAP", function(m) {
     m.add('Show map reference', function () { browser.show_MaprefPix( [m.x, m.y] ); });
     m.add(null);
     m.add('Center point', function()   { browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])); } );
     m.add('Zoom in', function()        { browser.view.setZoom(browser.view.getZoom()+1); } );
     m.add('Zoom out',  function()      { browser.view.setZoom(browser.view.getZoom()-1); } );
   });

   
   browser.ctxMenu.addCallback("TOOLBAR", function(m) {
   
     m.add('Log in', function () {
        srv.login();
     });
     m.add('Log out', function() {
        srv.logout(); 
     });
     
     
     m.add('Auth info', function () {
         srv.loginStatus(); 
     });
     
     m.add('Search items', function () 
       { var x = new pol.tracking.Search(); 
         x.activatePopup("trackerSearch", [50,70]) }); 
     
     m.add('Find position', function () { var x = new pol.core.refSearch(); x.activatePopup("refSearch", [50,70]) });
     m.add('Area List', function () { browser.toolbar.arealist.activatePopup("AreaList", [50,70]) });
     m.add('Layer List', function () { var x = new pol.layers.List(); x.activatePopup("LayerList", [50,70]) });
   });
   
   browser.ctxMenu.addCallback("POINT", function(m) {
       
       m.add('Remove it', function() {mu.removePoint(m.ctxt.ident);}); 
      if (mu.labelHidden(m.ctxt.ident))
          m.add('Show label', function() { mu.hideLabel(m.ctxt.ident, false); });
      else
          m.add('Hide label', function() { mu.hideLabel(m.ctxt.ident, true); });
          
      m.add('Last movements', function () { historyPopup(m.ctxt.ident, [m.x, m.y]); });
      m.add('Do nothing', function () { alert("What?"); });
   });
   

     
   function historyPopup(id, pix) {
       console.assert(id!=null && id != "" && pix != null, "Assertion failed"); 
       browser.gui.removePopup();
       browser.gui.remotePopup(
          srv, "/history", 
          {ajax: true, simple:true, id: id}, 
          {id: "historypopup", geoPos: browser.pix2LonLat(pix)});
   }
   function histList_hout() {}
   function histList_hover() {}
       
       
       
   function findItem(x) 
      { mu.goto_Point(x); }
