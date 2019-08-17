   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also config.js for configuration of the application. 
    */
   
    /* 
     * Display a warning if MSIE is used. 
     * Note that to display this for IE browser and to be able to use IE11
     * and other old browser be sure to use the compiled/minified javascript code, 
     * including this file.
     */
    var mobile = navigator.platform.match(/i(Phone|Pad)|Android/i);
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    var trident = ua.indexOf('Trident/');
    if (msie > 0 || trident > 0)
       alert("Note that MSIE is not supported. A more recent browser is recommended");
   
      
   /* 
    * Instantiate the map browser and try to restore widgets from a previous session. 
    */  
   const browser = new pol.core.MapBrowser('map', CONFIG);
   setTimeout(pol.widget.restore, 1500);
    $('#map').append('<img class="logo" src="'+CONFIG.get('logo')+'">"');


   
    /*
     * Add a tracking-layer using a polaric server backend.
     */  
    const srv = new pol.tracking.PolaricServer();
    CONFIG.server = srv;
    setTimeout( () => {
        const mu = new pol.tracking.Tracking(srv);
        const flt = new pol.tracking.Filters(mu);
        CONFIG.tracks = mu;
        CONFIG.trackers = (srv.loggedIn ? new pol.tracking.db.MyTrackers() : null); 
            
        if (srv.auth.userid != null) {
            const not = new pol.tracking.Notifier();
            CONFIG.notifier = not; 
        }
    }, 1000); 
   
    CONFIG.labelStyle = new pol.tracking.LabelStyle();
    CONFIG.layerlist = new pol.layers.List(); 
    CONFIG.history = new pol.tracking.db.History();
    CONFIG.heard = new pol.tracking.db.HeardVia();
    CONFIG.gSettings = new pol.tracking.GlobalSettings(); 
    
    /* Welcome text */
    if (!mobile && CONFIG.get("welcome_popup") && !CONFIG.get("skip_welcome")) 
      setTimeout(()=> {
       let d = browser.gui.showPopup( {
           pixPos: [5,30], 
           draggable: true, 
           pinned: true, 
           onclose: ()=> {CONFIG.store("skip_welcome", true);}
        });
       $.ajax("welcome.html", {success: txt=> {d.innerHTML = txt}} ); 
    },2000);
    
    
    
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
            if (srv.hasDb)
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
        }
        m.add('Area List', () => 
            browser.toolbar.arealist.activatePopup("AreaList", [50,70]) );
        m.add('Layer List', () => 
            CONFIG.layerlist.activatePopup("LayerList", [50,70]) );

        m.add(null);
        if (browser.getPermalink())
            m.add("Permalink OFF", () => browser.setPermalink(false)); 
        else
            m.add("Permalink ON", () => browser.setPermalink(true)); 
        
        m.add("Label font +", () => CONFIG.labelStyle.next());
        m.add("Label font -", () => CONFIG.labelStyle.previous());
        m.add(null);
     
        if (srv.auth.sar) {
            m.add("SAR mode..", () => sarMode()); 
            m.add(null);
            m.add("Set/change password..", setPasswd);
        }
        if (srv.auth.admin) {
            m.add("Admin/configuration..", webConfig);
        }
        m.add(null);
        
        if (srv.loggedIn)
            m.add('Log out', () => srv.logout() );
        else
            m.add('Log in', () => srv.login() );
        m.add(null);
        
        
        if (srv.loggedIn) {
            if (srv.hasDb) 
                m.add("My trackers", () =>
                    { CONFIG.trackers.activatePopup("mytrackers", [50, 70]) }); 
            m.add("Notification", () =>
                { const x = new pol.tracking.NotifyList();
                    x.activatePopup("notifications", [50, 70]) });
        }
        
        if (srv.hasDb) {
            m.add("History...", () =>
                { CONFIG.history.activatePopup("history", [50, 70]) });
            m.add("Heard points via..", () => {
                CONFIG.heard.activatePopup("heard", [50, 70]); 
            });
        }
        
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
            m.add('Global settings', () => {
                CONFIG.gSettings.activatePopup("globalsettings", [m.x, m.y]);
                setTimeout(()=> {CONFIG.gSettings.setIdent(ctxt.ident);}, 1000);
            });
            m.add('Manage tags..', () => setTags(ctxt.ident) );
            m.add('Reset info', () => resetInfo(ctxt.ident) );
            if (ctxt.point.point.own)
                m.add('Remove object', () => deleteObject(ctxt.ident) );
        }
        m.add(null);
        if (CONFIG.tracks.isTracked(ctxt.ident))
            m.add("Auto tracking OFF", () => CONFIG.tracks.setTracked(null) );
        else
            m.add("Auto tracking ON", () => CONFIG.tracks.setTracked(ctxt.ident) );
            
        if (CONFIG.tracks.labelHidden(ctxt.ident))
            m.add('Show label', () => CONFIG.tracks.hideLabel(ctxt.ident, false) );
        else
            m.add('Hide label', () => CONFIG.tracks.hideLabel(ctxt.ident, true) );
        
        if (CONFIG.tracks.trailHidden(ctxt.ident))
            m.add('Show trail', () => CONFIG.tracks.hideTrail(ctxt.ident, false) );
        else
            m.add('Hide trail', () => CONFIG.tracks.hideTrail(ctxt.ident, true) );
        m.add(null);
        
        if (srv.auth.sar && srv.hasDb) { 
            m.add('Add to my trackers', () => 
                {  CONFIG.trackers.activatePopup("mytrackers", [50, 70]); 
                   setTimeout(()=> CONFIG.trackers.setIdent(ctxt.ident), 500); 
                }); 
        }
        if (srv.hasDb) {
            m.add("Raw APRS packets", () => {
                rawAprsPackets(ctxt.ident, [m.x, m.y]);
            } );
            m.add("History...", () => { 
                CONFIG.history.activatePopup("history", [50, 70]);       
                CONFIG.history.setCall(ctxt.ident); 
            } );
            m.add("Heard points via..", () => {
                CONFIG.heard.setCall(ctxt.ident);
                CONFIG.heard.activatePopup("heard", [50, 70]); 
            });
        }
    });
   
   
      
    /*********************************************************
     * Sign menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("SIGN", (m, ctxt)=> {
        m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
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
     
    function rawAprsPackets(ident, pix) { 
        browser.gui.remotePopup(
            srv, "/rawAprsPackets", 
            {ident: ident}, 
            {id: "rawAprs", geoPos: browser.pix2LonLat(pix)});
    }
    
