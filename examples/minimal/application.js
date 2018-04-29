   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also config.js for configuration of the application. 
    * 
    * This is minimal version. It is just map-browsing and two menu items.
    */


   /* 
    * Instantiate the map browser. 
    */  
   var browser = new pol.core.MapBrowser('map', CONFIG);
 
   
    
   /* 
    * Set up application-specific context menus. We may define named contexts. The toolbar 
    * define its own context, 'TOOLBAR'. 
    * 
    * A callback function is associated with a named context and is called when we need to 
    * activate the menu. Use it to add menu items. Adding null means adding a separator. 
    */ 
   
    /*********************************************************
     * Toolbar menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("TOOLBAR", function(m, ctxt) {
        m.add('Find position', function () 
            { var x = new pol.core.refSearch(); x.activatePopup("refSearch", [50,70]) });
        m.add('Area List', function () 
            { browser.toolbar.arealist.activatePopup("AreaList", [50,70]) });
    });
    

