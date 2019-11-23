   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also mapconfig.js for configuration of the application. 
    * 
    * This is as simple version without a polaric-server backend. It is just map-browsing and 
    * basic layer editing.. 
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
    
    browser.addContextMenu("MAP");  
    browser.ctxMenu.addCallback("MAP", function(m, ctxt) {
        m.add('Show map reference', ()=> 
            { browser.show_MaprefPix( [m.x, m.y] ); });  
     
         m.add(null);
         m.add('Center point', ()=>   
            { browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])); } );
         m.add('Zoom in', ()=>        
            { browser.view.setZoom(browser.view.getZoom()+1); } );
         m.add('Zoom out', ()=>      
            { browser.view.setZoom(browser.view.getZoom()-1); } );
    });

   
    /*********************************************************
     * Toolbar menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("TOOLBAR", function(m, ctxt) {

        m.add('Find position', ()=> 
            WIDGET("core.refSearch", [50,70], true));
        m.add('Area List', ()=> 
            WIDGET("core.AreaList", [50,70], true));
        m.add('Layer List', ()=>
            WIDGET("layers.List", [50,70], true));
    });
    

