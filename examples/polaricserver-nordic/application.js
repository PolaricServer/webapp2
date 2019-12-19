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
   CONFIG.browser = browser;
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
        
        if (srv.auth.userid != null) {
            const not = new pol.tracking.Notifier();
            CONFIG.notifier = not; 
        }
        
    }, 1000); 
   
    CONFIG.labelStyle = new pol.tracking.LabelStyle();

    
    
    /* Welcome text */
    if (!mobile && !srv.loggedIn && CONFIG.get("welcome_popup") && !CONFIG.get("skip_welcome") ) 
      setTimeout(()=> {
       let d = browser.gui.showPopup( {
           pixPos: [5,30], 
           draggable: true, 
           resizable: true,
           pinned: true, 
           onclose: ()=> {CONFIG.store("skip_welcome", true);}
        });
       setTimeout(()=>d.close(), 30000);
       $.ajax("welcome.html", {success: txt=> {d.innerHTML = txt}} ); 
    },2000);
      
    
    /* FIXME: May put init into Edit class constructor */
    pol.features.init(CONFIG.browser.map);
    
    CONFIG.mb.toolbar.addIcon(2, "images/draw.png", "tb_draw", 
        ()=> WIDGET("features.Edit", [50, 70], true), 
        null, "Draw tool");
    
    
    
    
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
            m.add('Add APRS object', () => 
                WIDGET("tracking.OwnObjects", [50,70], true, x=> x.setPosPix([m.x, m.y]))); 
            
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
        
        if (srv.auth.admin) {
            m.add('Set server (own) position', ()=> 
                WIDGET("tracking.OwnPos", [50,70], true, x=> x.setPosPix([m.x, m.y])));
        }
        
    });

   
    /*********************************************************
     * Toolbar menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("TOOLBAR", (m, ctxt)=> {   
                
        m.add('Search items',  () => WIDGET("tracking.Search", [50,70], true));
        m.add('Find position', () => WIDGET("core.refSearch",  [50,70], true));

        if (srv.auth.sar) {                 
            m.add('Add APRS object', () => 
                WIDGET("tracking.OwnObjects", [50,70], true)); 
        }
        
        m.add('Area List',  () => WIDGET("core.AreaList", [50,70], true)); 
        m.add('Layer List', () => WIDGET("layers.List", [50,70], true));

        m.add(null);
        if (browser.getPermalink())
            m.add("Permalink OFF", () => browser.setPermalink(false)); 
        else
            m.add("Permalink ON", () => browser.setPermalink(true)); 
        
        m.add("Label font +", () => CONFIG.labelStyle.next());
        m.add("Label font -", () => CONFIG.labelStyle.previous());
        m.add(null);
     
        if (srv.auth.sar) {
            m.add("SAR mode..", () => WIDGET("tracking.SarMode", [50,70], true)); 
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
                m.add("My trackers", () => WIDGET("tracking.db.myTrackers", [50, 70], true));
            m.add("Notification", () => WIDGET("tracking.NotifyList", [50, 70], true));
        }
        
        if (srv.hasDb) {
            m.add("History...", () => WIDGET("tracking.db.History", [50,70], true)); 
            m.add("Heard points via..", () => WIDGET("tracking.db.HeardVia", [50,70], true));
        }
        
        m.add("Bulletin board", () => WIDGET("tracking.BullBoard", [50,70], true));
    });
   
   
      
    /*********************************************************
     * Point menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("POINT", (m, ctxt)=> {
        m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
        m.add('Last movements', () => 
            WIDGET( "tracking.TrailInfo", [50, 70], true,  x=> x.getTrail(ctxt.ident) ) );
        
        
        if (srv.auth.sar) { 
            m.add('Global settings', () => 
                WIDGET("tracking.GlobalSettings", [m.x,m.y], true, x=>x.setIdent(ctxt.ident)));

            m.add('Manage tags..', () => setTags(ctxt.ident) );
            m.add('Reset info', () => resetInfo(ctxt.ident) );
            if (ctxt.point.point.own)
                m.add('Remove object', () => 
                    CONFIG.ownObj.remove( ctxt.ident.substring(0, ctxt.ident.indexOf('@') ) ) );
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
                WIDGET("tracking.db.myTrackers", [50, 70], true, x=> x.setIdent(ctxt.ident))); 
        }
        if (srv.hasDb) {
            m.add("Raw APRS packets", () => 
                rawAprsPackets(ctxt.ident, [m.x, m.y]));
                
            m.add("History...", () => 
                WIDGET("tracking.db.History", [50,70], true, x=>x.setCall(ctxt.ident))); 
            
            m.add("Heard points via..", () =>
                WIDGET("tracking.db.HeardVia", [50,70], true, x=>x.setCall(ctxt.ident)));
        }
    });
   
   
      
    /*********************************************************
     * Sign menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("SIGN", (m, ctxt)=> {
        if (srv.hasDb) {
            m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
        }
    });
     
    
    


    /* 
     * Helper functions used by menus. 
     */
    
    function histList_hout() {}
    function histList_hover() {}


    function setPasswd()
        { srv.popup('Password', 'passwd', 430, 250); }
  
    function webConfig()
        { srv.popup('Config', 'config_menu'+'?inapp=true', 900, 700); }
 
    function setTags(ident)
        { srv.popup('editTags', 'addtag?objid='+ident, 560, 300); }

        
    // FIXME: maybe an "are you sure" dialog?     
    function resetInfo(ident) {
        srv.PUT("/item/"+ident+"/reset", null,
                () => console.log("Reset info for: "+ident),
                x  => console.log("Reset info failed: "+x)
            );
    }
        
        
    function editSign(x, y) {
        var coord = browser.pix2LonLat([x, y]);
        srv.popup('editSign', 'addSign' +
            (x==null ? "" : '?x=' + coord[0] + '&y='+ coord[1] ), 570, 390);
    }
   
    function findItem(x) 
        { CONFIG.tracks.goto_Point(x); }
     
    function rawAprsPackets(ident, pix) { 
        browser.gui.remotePopup(
            srv, "/rawAprsPackets", 
            {ident: ident}, 
            {id: "rawAprs", geoPos: browser.pix2LonLat(pix)});
    }
    
