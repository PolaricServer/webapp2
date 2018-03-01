   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also mapconfig.js for configuration of the application. 
    * 
    * This is as simple version without a polaric-server backend. It is just map-browsing. 
    */


   /* 
    * Instantiate the map browser and try to restore widgets from a previous session. 
    */  
   var browser = new pol.core.MapBrowser('map', CONFIG);
   setTimeout(pol.widget.restore, 1500);
   


    
   /* 
    * Set up application-specific context menus. We may define named contexts. The toolbar 
    * define its own context, 'TOOLBAR'. See below how we define 'MAP. 
    * 
    * A callback function is associated with a named context and is called when we need to 
    * activate the menu. Use it to add menu items. Adding null means adding a separator. 
    */ 

      
    /*********************************************************
     * Map menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("MAP", function(m) {
        m.add('Show map reference', function () 
            { browser.show_MaprefPix( [m.x, m.y] ); });  
     
         m.add(null);
         m.add('Center point', function()   
            { browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])); } );
         m.add('Zoom in', function()        
            { browser.view.setZoom(browser.view.getZoom()+1); } );
         m.add('Zoom out',  function()      
            { browser.view.setZoom(browser.view.getZoom()-1); } );
    });

   
    /*********************************************************
     * Toolbar menu
     *********************************************************/
    browser.addContextMenu("MAP");      
    browser.ctxMenu.addCallback("TOOLBAR", function(m) {

        m.add('Find position', function () 
            { var x = new pol.core.refSearch(); x.activatePopup("refSearch", [50,70]) });
        m.add('Area List', function () 
            { browser.toolbar.arealist.activatePopup("AreaList", [50,70]) });
        m.add('Layer List', function () 
            { var x = new pol.layers.List(); x.activatePopup("LayerList", [50,70]) });
        
    });
    

