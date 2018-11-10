   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also config.js for configuration of the application. 
    */


   /* 
    * Instantiate the map browser and try to restore widgets from a previous session. 
    */  
   const browser = new pol.core.MapBrowser('map', CONFIG);
   setTimeout(pol.widget.restore, 1500);
   
   
    /*
     * Add a tracking-layer using a polaric server backend.
     */  
    const srv = new pol.tracking.PolaricServer();
    CONFIG.server = srv;
    setTimeout( () => {
        const mu = new pol.tracking.Tracking(srv);
        const flt = new pol.tracking.Filters(mu);
        CONFIG.tracks = mu;
        CONFIG.trackers = new pol.tracking.db.MyTrackers(); 
            
        if (srv.auth.userid != null) {
            const not = new pol.tracking.Notifier();
            CONFIG.notifier = not; 
        }
    }, 1000); 
   
    CONFIG.labelStyle = new pol.tracking.LabelStyle();
    CONFIG.layerlist = new pol.layers.List(); 
    CONFIG.history = new pol.tracking.db.History();

    
    
   /* 
    * Set up application-specific context menus. We may define named contexts. The toolbar 
    * define its own context, 'TOOLBAR'. See below how we define 'MAP' and 'POINT'. 
    * 
    * A callback function is associated with a named context and is called when we need to 
    * activate the menu. Use it to add menu items. Adding null means adding a separator. 
    */ 
   
      
    /*********************************************************
     * Map menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("MAP", (m, ctxt)=> {
        m.add('Show map reference', () => browser.show_MaprefPix( [m.x, m.y] ) );  
        if (srv.auth.sar) {
	        m.add('Add object', () => editObject(m.x, m.y) );
            m.add('Add sign', () => editSign(m.x, m.y) );
        }
        m.add(null);
        m.add('Center point', () =>   
            browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])) );
        m.add('Zoom in', () =>        
            browser.view.setZoom(browser.view.getZoom()+1) );
        m.add('Zoom out', () =>     
            browser.view.setZoom(browser.view.getZoom()-1) );
    });

   
    /*********************************************************
     * Toolbar menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("TOOLBAR", (m, ctxt)=> {
        

        m.add('Search items', () => 
            { const x = new pol.tracking.Search(); 
                x.activatePopup("trackerSearch", [50,70]) }); 
        m.add('Find position', () => 
            { const x = new pol.core.refSearch(); 
                x.activatePopup("refSearch", [50,70]) });
        if (srv.auth.sar) {                 
            m.add('Add object', () => editObject(null, null) );
            m.add('Remove object', () => deleteObject(null) );
        }
        m.add('Area List', () => 
            browser.toolbar.arealist.activatePopup("AreaList", [50,70]) );
        m.add('Layer List', () => 
            CONFIG.layerlist.activatePopup("LayerList", [50,70]) );

        m.add(null);
        
        m.add("Label font +", () => CONFIG.labelStyle.next());
        m.add("Label font -", () => CONFIG.labelStyle.previous());
        m.add(null);
     
        if (srv.auth.sar) {
            m.add("SAR mode..", () => sarMode()); 
            m.add(null);
        }
        if (srv.auth.admin) {
            m.add("Admin/configuration..", webConfig);
            m.add("Set/change password..", setPasswd);
        }
        m.add(null);
        
        if (srv.loggedIn)
            m.add('Log out', () => srv.logout() );
        else
            m.add('Log in', () => srv.login() );
        m.add(null);
        
        
        if (srv.loggedIn) {
            m.add("My trackers", () =>
                { CONFIG.trackers.activatePopup("mytrackers", [50, 70]) }); 
            m.add("Notification", () =>
                { const x = new pol.tracking.NotifyList();
                    x.activatePopup("notifications", [50, 70]) });
        }
        m.add("History...", () =>
            { CONFIG.history.activatePopup("history", [50, 70]) });
        m.add("Bulletin board", () =>
            { const x = new pol.tracking.BullBoard();
                x.activatePopup("bullboard", [50,70]) });
    });
   
   
      
    /*********************************************************
     * Point menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("POINT", (m, ctxt)=> {
        m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
        m.add('Last movements', () => historyPopup(ctxt.ident, [m.x, m.y]) );

        if (srv.auth.sar) { 
            m.add('Global settings', () => globalSettings(ctxt.ident) );
            m.add('Manage tags..', () => setTags(ctxt.ident) );
            m.add('Reset info', () => resetInfo(ctxt.ident) );
        }
        m.add(null);
        
        if (CONFIG.tracks.labelHidden(ctxt.ident))
            m.add('Show label', () => CONFIG.tracks.hideLabel(ctxt.ident, false) );
        else
            m.add('Hide label', () => CONFIG.tracks.hideLabel(ctxt.ident, true) );
        
        if (CONFIG.tracks.trailHidden(ctxt.ident))
            m.add('Show trail', () => CONFIG.tracks.hideTrail(ctxt.ident, false) );
        else
            m.add('Hide trail', () => CONFIG.tracks.hideTrail(ctxt.ident, true) );
        m.add(null);
        
        if (srv.auth.sar) { 
            m.add('Add to my trackers', () => 
                {  CONFIG.trackers.activatePopup("mytrackers", [50, 70]); 
                   setTimeout(()=> CONFIG.trackers.setIdent(ctxt.ident), 500); 
                }); 
        }
        m.add("History...", () =>
            { CONFIG.history.activatePopup("history", [50, 70]);       
              CONFIG.history.setCall(ctxt.ident); } );
        
    });
   
   
      
    /*********************************************************
     * Sign menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("SIGN", (m, ctxt)=> {
        m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
        m.add('Do funny things', () => alert("What?") );
    });
     
    
    


    /* 
     * Helper functions used by menus. 
     */
    
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
     
    function sarMode()
        { srv.popup('SarMode', 'sarmode', 500, 320); }

    function globalSettings(ident)
        { srv.popup('PointEdit', 'station_sec?id=' + ident + '&edit=true', 780, 600); }

    function setPasswd()
        { srv.popup('Password', 'passwd', 430, 250); }
  
    function webConfig()
        { srv.popup('Config', 'config_menu'+'?inapp=true', 900, 700); }
 
    function setTags(ident)
        { srv.popup('editTags', 'addtag?objid='+ident, 560, 300); }

    function resetInfo(ident) {
         srv.popup('Station', 'resetinfo'+ '?' + (ident==null ? "" : '&objid='+ident), 360, 180);
    }

    function editObject(x, y) {
        var coord = browser.pix2LonLat([x, y]);
        srv.popup('editObject', 'addobject' +
            (x==null ? "" : '?x=' + coord[0] + '&y='+ coord[1] ), 560, 300);
    }
    
    function editSign(x, y) {
        var coord = browser.pix2LonLat([x, y]);
        srv.popup('editSign', 'addSign' +
            (x==null ? "" : '?x=' + coord[0] + '&y='+ coord[1] ), 570, 390);
    }
    
    function deleteObject(ident) {
        srv.popup('delObject', 'deleteobject' + 
            (ident==null ? "" : '?objid='+ident), 350, 180);
    }
   
    function findItem(x) 
        { CONFIG.tracks.goto_Point(x); }
