   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also config.js for configuration of the application. 
    * Version 1.5
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
    * Read the URL GET parameters
    */
   var urlArgs = getParams(window.location.href);
   if (urlArgs['car'] != null) 
	CONFIG.store('display.in-car', true);
      
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
        if (urlArgs['track'] != null) 
        	CONFIG.tracks.setTracked(urlArgs['track']);
        
        if (srv.auth.userid != null) {
            const not = new pol.tracking.Notifier();
            CONFIG.notifier = not; 
        }
        
        /* Get updates when sharing of objects are changed */ 
        srv.pubsub.subscribe("sharing", x => {
            console.log("Change to object sharing");
            getWIDGET("layers.List").getMyLayers();
            getWIDGET("core.AreaList").getMyAreas();
        });
        
        
    }, 1000); 
   
    CONFIG.labelStyle = new pol.tracking.LabelStyle();

      
    
    /* FIXME: May put init into Edit class constructor */
    pol.features.init(CONFIG.browser.map);
    
    CONFIG.mb.toolbar.addIcon(2, "images/draw.png", "tb_draw", 
        ()=> WIDGET("features.Edit", [50, 70], true), 
        null, "Draw tool");
    
    
    
    /* 
     * Some of the widgets have state that is needed by others so they need to be started. This is slightly 
     * delayed to allow connection to server to be established first. 
     */
    setTimeout(()=> {
        console.log("Server config: ", CONFIG.server);
        getWIDGET("core.AreaList");
        getWIDGET("layers.List");
    }, 1000);
    
    
    
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
                m.add('Add sign', () => 
                    WIDGET("tracking.db.Signs", [50,70], true, x=> x.setPosPix([m.x, m.y])));
        }
        
        /* BICYCLE WHEEL */
        m.add('Add LKP/IPP with rings', () => 
            WIDGET("tracking.BikeWheel", [50,70], true, x=> x.setPosPix([m.x, m.y]))); 
        
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
        m.add('Map view info', () => 
            WIDGET("core.MapInfo", [50,70], true ));
        
    });

   
    /*********************************************************
     * Toolbar menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("TOOLBAR", (m, ctxt)=> {   
         
        if (!srv.loggedIn)       
        m.add('Om karttjenesten...', ()=> 
            WIDGET("core.DocReader", [50, 70], false,  
                x=> x.setContent("Velkommen til NRRL karttjenesten", "welcome.html") ) );
        
        m.add('Search items',  () => WIDGET("tracking.Search", [50,70], true));
        m.add('Find position', () => WIDGET("core.refSearch",  [50,70], true));

        if (srv.auth.sar) {                 
            m.add('Add APRS object', () => 
                WIDGET("tracking.OwnObjects", [50,70], true)); 
        }
        
        m.add('Area List',  () => WIDGET("core.AreaList", [50,70], true)); 
        m.add('Layer List', () => WIDGET("layers.List", [50,70], true));
        
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
            if (srv.auth.admin) {
                m.add("Admin/configuration..", webConfig);
                m.add("User admin..", () => WIDGET("tracking.Users", [50, 70], true));
            }
        }
        m.add(null);
        if (srv.loggedIn) {
            m.add('Log out', () => srv.logout() );
            m.add("Set/change password..", () => WIDGET("tracking.Passwd", [50,70], true));
        }
        else
            m.add('Log in', () => srv.login() );
        m.add(null);
        
        
        if (srv.loggedIn) {
            if (srv.hasDb) 
                m.add("My trackers", () => WIDGET("tracking.db.MyTrackers", [50, 70], true));
            m.add("Notification", () => WIDGET("tracking.NotifyList", [50, 70], true));
        }
        
        if (srv.hasDb) {
            m.add("Signs...", () => WIDGET("tracking.db.Signs", [50,70], true));
            m.add("History...", () => WIDGET("tracking.db.History", [50,70], true)); 
            m.add("Heard points via..", () => WIDGET("tracking.db.HeardVia", [50,70], true));
        }
        
        m.add("Bulletin board", () => WIDGET("tracking.BullBoard", [50,70], true));
        if (srv.loggedIn)
            m.add('Short messages', () => WIDGET("tracking.Mailbox",[50,70], true));
        
        if (CONFIG.get('display.in-car') != null) {
            m.add("Kodi", startKodi);
            m.add(null);
            m.add("Exit", chromeExit);
        }
    });

    /*
     * Using a Raspberry pi display in a car it can be useful to dim the display
     */
    if (CONFIG.get('display.in-car') != null) 
      	    CONFIG.mb.toolbar.addIcon(3, "images/brightness.ico", null, adjustBacklight, "Change backlight level");
   
   
      
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

            m.add('Manage tags..', () => WIDGET("tracking.Tags", [m.x,m.y], true, x=>x.setIdent(ctxt.ident))); 

            m.add('Reset info', () => resetInfo(ctxt.ident) );
            m.add('Change trail color', () => chColor(ctxt.ident) );
            
            if (ctxt.point.point.own)
                m.add('Remove object', () => 
                    getWIDGET("tracking.OwnObjects").remove( ctxt.ident.substring(0, ctxt.ident.indexOf('@') ) ) );
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
        
        if (srv.auth.sar && srv.hasDb && ctxt.point.point.aprs) { 
            m.add('Add to my trackers', () => 
                WIDGET("tracking.db.MyTrackers", [50, 70], true, x=> x.setIdent(ctxt.ident))); 
        }
        if (srv.hasDb && ctxt.point.point.aprs) {
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
            if (srv.auth.sar && /__db/.test(ctxt.ident) ) {
                m.add('Edit object', () => WIDGET('tracking.db.Signs', [50,70], true, x=> x.edit(ctxt.ident))); 
                m.add('Delete object', () => getWIDGET('tracking.db.Signs').remove( ctxt.ident )); 
            }
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

    function chColor(ident) {
        srv.PUT("/item/"+ident+"/chcolor", null,
                () => console.log("Change trail color for: "+ident),
                x  => console.log("Change trail color failed: "+x)
            );
    }
    
   
    function findItem(x) 
        { CONFIG.tracks.goto_Point(x); }
     
     
    function rawAprsPackets(ident, pix) { 
        browser.gui.remotePopup(
            srv, "/rawAprsPackets", 
            {ident: ident}, 
            {id: "rawAprs", geoPos: browser.pix2LonLat(pix)});
    }

    
    
    function getMapInfo() {
        var x = browser.getBaseLayer();
        console.log(x.values_.name);
        console.log("Resolution: ", browser.getResolution());
        console.log(x.projection.defaultTileGrid_.resolutions_);
    }
    
    
/**
 * Get the URL parameters
 * source: https://css-tricks.com/snippets/javascript/get-url-variables/
 * @param  {String} url The URL
 * @return {Object}     The URL parameters
 */
    function getParams(url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
    };

    function startKodi() { fetch('/cgi-bin/kodi'); }
    function chromeExit() { fetch('/cgi-bin/exit'); }
    function adjustBacklight() { fetch('/cgi-bin/backlight'); }
    
