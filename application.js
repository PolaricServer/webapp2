   /* 
    * This is an example of how an application can be constructed using polaric components.  
    * Se also config.js for configuration of the application. 
    */

    var mobplatform = navigator.platform.match(/i(Phone|Pad)|Android/i);
    var ua = window.navigator.userAgent;
    
    var phone = 
        window.matchMedia('screen and (max-device-width: 500px), screen and (max-device-width: 35em),screen and (max-device-height: 500px),screen and (max-device-height: 35em)').matches;
        
    var tablet = 
        window.matchMedia('(min-device-width: 50em) and (-webkit-min-device-pixel-ratio: 2.0)').matches;
    
    var hires = 
        window.matchMedia('screen and (min-resolution: 190dpi) and (-webkit-max-device-pixel-ratio: 2.0), '+
                          'screen and (min-resolution: 300dpi) and (-webkit-max-device-pixel-ratio: 5.0)').matches;
    
    var mobile = mobplatform | phone | tablet;
    
    /* Set to true to incldue REST API testbench in menu */
    var developer_mode = true; 
    
    
    
  
   /*
    * Read the URL GET parameters
    */
    var urlArgs = getParams(window.location.href);

   
    /* 
     * Instantiate the map browser and try to restore widgets from a previous session. 
     */  
    const browser = new pol.core.MapBrowser('map', CONFIG);
    CONFIG.browser = browser;
    CONFIG.get('logo', x=> {
        $('#map').append('<img class="logo" src="'+x+'">"');
    });


    let srv=null;
    setTimeout( ()=> { srv = CONFIG.server = CONFIG.srvManager.instantiate()}, 800 );
    setTimeout(pol.widget.restore, 1500);
    
    
    /* 
     * Instantiation of server - we use the server-manager so we more easily can 
     * replace the instance. 
     */
    let tbar = false; 
    CONFIG.srvManager = new pol.tracking.ServerManager( false, 
                                                        
        (srv)=> {
            srv.onStart( ()=> {
                CONFIG.tracks = new pol.tracking.Tracking(srv, (hires? 1.4 : 1) );  
                CONFIG.filt = new pol.tracking.Filters(CONFIG.tracks);
                
                /* Log base layer selection */ 
                CONFIG.mb.setBaseLayerCb( (x)=> { CONFIG.tracks.reportLayer(x) } ) ;

                /* Add items to toolbar */
                if (!tbar) { 
                    CONFIG.filt.addToolbarMenu();
                    CONFIG.mb.toolbar.addSection(3);
                    CONFIG.mb.toolbar.addIcon(3, "images/locked.png", "toolbar_login", 
                       ()=> WIDGET("tracking.Login", [230,30], true) , "Click to log in");
                    CONFIG.mb.toolbar.addIcon(3, "images/warn.png", "warnmode");
                    tbar = true; 
                }
            });
    
    
            srv.onStop( ()=> {
                CONFIG.tracks.close();
            });
            
            
            srv.onLogin( 
                ()=> {
                    CONFIG.mb.toolbar.changeIcon
                        ("toolbar_login", "images/unlocked.png", 
                        () => WIDGET("tracking.Login", [320,30], true),
                        "Logged in as: '"+srv.auth.userid+"'. Click to log out");      
                
                    CONFIG.filt.getFilters();
                    CONFIG.tracks.reconnect();
                
                    /* Notifier is used only when logged in. 
                    * FIXME: Do this after websocket connection is restored.
                    */
                    CONFIG.notifier = this.not = new pol.tracking.Notifier();
                }, 
                (err)=> {
                    console.log("Logged out or authentication failed: ", err);     
            
                    CONFIG.filt.getFilters();
                    CONFIG.tracks.reconnect();
                    
                    if (CONFIG.notifier != null)
                        CONFIG.notifier.stop();
                    CONFIG.notifier = null;
                    
                    CONFIG.mb.toolbar.changeIcon
                        ("toolbar_login", "images/locked.png", 
                        () => WIDGET("tracking.Login", [230,30], true), "Click to log in");
                }
            );
        });
    
    
    
    
    setTimeout( () => {
        if (urlArgs['track'] != null) 
        	CONFIG.tracks.setTracked(urlArgs['track']);
                
        /* Get updates when sharing of objects are changed */ 
        CONFIG.server.pubsub.subscribe("sharing", x => {
            console.log("Change to object sharing");
            getWIDGET("layers.List").getMyLayers();
            getWIDGET("core.AreaList").getMyAreas();
            getWIDGET("tracking.db.Sharing").getShares();
        });
        
        /* Get updates when objects are changed */ 
        CONFIG.server.pubsub.subscribe("object", x => {
            console.log("Change to object:", x);
            if (x=="area")
                getWIDGET("core.AreaList").getMyAreas();
            else if (x=="layer")
                getWIDGET("layers.List").getMyLayers();
            else if (x=="feature")
                getWIDGET("features.Edit").reload();
        });
        
        /* Get updates when signs are changed */ 
        CONFIG.server.pubsub.subscribe("sign", x => {
            console.log("Change to signs:", x);
            getWIDGET("tracking.db.Signs").getSigns();
        });
        
        /* FIXME: May put init into Edit class constructor */
        pol.features.init(CONFIG.browser.map);
        
        CONFIG.mb.toolbar.addIcon(2, "images/draw.png", "tb_draw", 
            ()=> WIDGET("features.Edit", [50, 70], true), 
            null, "Draw tool");
        
    }, 5000); 
   
    CONFIG.labelStyle = new pol.tracking.LabelStyle();

  
    
    
    /* 
     * Some of the widgets have state that is needed by others so they need to be started. This is slightly 
     * delayed to allow connection to server to be established first. 
     */
    setTimeout(()=> {
        getWIDGET("core.AreaList");
        getWIDGET("layers.List");
    }, 5000);
    
    
    
   /* 
    * Set up application-specific context menus. We may define named contexts. The toolbar 
    * define its own context, 'TOOLBAR'. See below how we define 'MAP' and 'POINT'. 
    * 
    * A callback function is associated with a named context and is called when we need to 
    * activate the menu. Use it to add menu items. Adding null means adding a separator. 
    */ 
   
    setTimeout( () => {
        // FIXME: This should be called when ctxMenu is ready
   
    /*********************************************************
     * Map menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("MAP", (m, ctxt)=> {
        
     m.add('Show map reference', () => browser.show_MaprefPix( [m.x, m.y] ) );  
        if (!phone && (srv.auth.sar || srv.auth.admin)) {
            m.add('Add APRS object', () => 
                WIDGET("tracking.OwnObjects", [50,70], false, x=> x.setPosPix([m.x, m.y]))); 
                        
            if (srv.hasDb)
                m.add('Add sign', () => 
                    WIDGET("tracking.db.Signs", [50,70], false, x=> x.setPosPix([m.x, m.y])));
        }
        
        /* BICYCLE WHEEL */
        if (!phone)
            m.add('Add LKP/IPP with rings', () => 
                WIDGET("tracking.BikeWheel", [50,70], false, x=> x.setPosPix([m.x, m.y]))); 
        
            
        m.add(null);
        m.add('Center point', () =>   
            browser.view.setCenter( browser.map.getCoordinateFromPixel([m.x, m.y])) );
        m.add('Zoom in', () =>        
            browser.view.setZoom(browser.view.getZoom()+1) );
        m.add('Zoom out', () =>     
            browser.view.setZoom(browser.view.getZoom()-1) );
        
        if (!phone && srv.auth.admin) {
            m.add('Set server (own) position', ()=> 
                WIDGET("tracking.OwnPos", [50,70], false, x=> x.setPosPix([m.x, m.y])));
        }
        if (!phone) 
            m.add('Map view info', () => 
                WIDGET("core.MapInfo", [50,70], true ));
    });

    
        
    /*********************************************************
     * System admin context / submenu
     *********************************************************/
    
    browser.ctxMenu.addCallback("SYSADMIN", (m, ctxt)=> {  
        if (srv.auth.admin) {
            m.add("Status info", () => WIDGET("psadmin.StatusInfo", [50, 70], true));
            m.add(null);
            m.add("User admin..", () => WIDGET("psadmin.Users", [50, 70], true));
            m.add("Server config..", () => WIDGET("psadmin.ServerConfig", [50, 70], true));
            m.add("Own pos config..", () => WIDGET("psadmin.OwnposConfig", [50, 70], true));
            m.add("Channels config..", () => WIDGET("psadmin.Channels", [50, 70], false));
            if (srv.hasDb) {
                m.add(null);
                m.add("Synch nodes", () => WIDGET("psadmin.db.SyncNodes", [50,70], false));
            }
        }
    });
        

    
    /*********************************************************
     * Toolbar menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("TOOLBAR", (m, ctxt)=> {   
         
        if (developer_mode) {
            m.add('Test REST API',  () => WIDGET("psadmin.TestRest", [50,70], true));
            m.add(null);
        }
        if (!phone) {
            m.add('Search items',  () => WIDGET("tracking.Search", [50,70], false));
            m.add('Find position', () => WIDGET("core.refSearch",  [50,70], true));
        }
        
        if (!phone && (srv.auth.sar || srv.auth.admin)) {                 
            m.add('Add APRS object', () => 
                WIDGET("tracking.OwnObjects", [50,70], false)); 
        }
        if (!phone) {
            if (srv.isAuth() && srv.hasDb) {
                m.add('Area List',  () => WIDGET("core.AreaList", [50,70], false)); 
                m.add('Layer List', () => WIDGET("layers.List", [50,70], false));
            }    
            if (browser.getPermalink())
                m.add("Permalink OFF", () => browser.setPermalink(false)); 
            else
                m.add("Permalink ON", () => browser.setPermalink(true)); 
        }
        
        m.add("Label font +", () => CONFIG.labelStyle.next());
        m.add("Label font -", () => CONFIG.labelStyle.previous());
        m.add(null);
     
        if (!phone && srv.auth.admin) {
            m.add("System Admin:   ->>", ()=>  
                CONFIG.mb.ctxMenu.showOnPos(
                { name: "SYSADMIN"}, [40,30])); 
        }
        
        if (srv.isAuth()) {
            m.add("Set/change password..", () => WIDGET("psadmin.Passwd", [50,70], false));
            m.add(null);
        }
        
        if (srv.isAuth()) {
            if (!phone && srv.hasDb) 
                m.add("My trackers", () => WIDGET("tracking.db.MyTrackers", [50, 70], false));
        }
        
        if (srv.hasDb) {
            if (!phone) {
                if (srv.auth.sar || srv.auth.admin)
                    m.add("Signs...", () => WIDGET("tracking.db.Signs", [50,70], false));
                m.add("History...", () => WIDGET("tracking.db.History", [50,70], false)); 
                m.add("Heard points via..", () => WIDGET("tracking.db.HeardVia", [50,70], false));
            }    
            m.add("Time machine..", () => WIDGET("tracking.db.Timemachine", [50,70], false)); 
        }
        
        if (!phone && srv.isAuth()) 
            m.add("Bulletin board", () => WIDGET("tracking.BullBoard", [50,70], false));
        if (srv.isAuth())
            m.add('Short messages', () => WIDGET("tracking.Mailbox", (phone ? [0,1] : [50,70]), false));
        
    });


      
    /*********************************************************
     * Point menu
     *********************************************************/
   
    browser.ctxMenu.addCallback("POINT", (m, ctxt)=> { 

        m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );

        m.add('Last movements', () => 
            WIDGET( "tracking.TrailInfo", [50, 70], false,  x=> x.getTrail(ctxt.ident) ) );
        
        if (ctxt.telemetry)
            m.add('Telemetry', () => 
                WIDGET( "tracking.Telemetry", [50, 70], false,  x=> x.getItem(ctxt.ident), ctxt.ident ));
         
        if (srv.auth.sar||srv.auth.admin) { 
            m.add('Global settings', () => 
                WIDGET("tracking.GlobalSettings", [m.x,m.y], false, x=>x.setIdent(ctxt.ident)));

            m.add('Manage tags..', () => WIDGET("tracking.Tags", [m.x,m.y], false, x=>x.setIdent(ctxt.ident))); 

            m.add('Reset info', () => resetInfo(ctxt.ident) );
            m.add('Change trail color', () => chColor(ctxt.ident) );
            
            if (ctxt.own)
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
             
        if ((srv.auth.sar||srv.auth.admin) && srv.hasDb && ctxt.aprs) { 
            m.add('Add to my trackers', () => 
                WIDGET("tracking.db.MyTrackers", [50, 70], false, x=> x.setIdent(ctxt.ident))); 
        }
        if (srv.hasDb && ctxt.aprs) {

            m.add('Raw APRS packets', () => 
                WIDGET( "tracking.AprsPackets", [50, 70], false,  x=> x.getPackets(ctxt.ident, 300) ) );
                        
            m.add("History...", () => 
                WIDGET("tracking.db.History", [50,70], false, x=>x.setCall(ctxt.ident))); 
            
            m.add("Heard points via..", () =>
                WIDGET("tracking.db.HeardVia", [50,70], false, x=>x.setCall(ctxt.ident)));
        }
    });
   
   
      
    /*********************************************************
     * Sign menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("SIGN", (m, ctxt)=> {
        if (srv.hasDb) {
            m.add('Show info', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
            if (srv.auth.sar && /__db/.test(ctxt.ident) ) {
                m.add('Edit object', () => WIDGET('tracking.db.Signs', [50,70], false, x=> x.edit(ctxt.ident))); 
                m.add('Delete object', () => getWIDGET('tracking.db.Signs').remove( ctxt.ident )); 
            }
        }
    });
     
    
    /*********************************************************
     * Photo menu
     *********************************************************/
    
    browser.ctxMenu.addCallback("PHOTO", (m, ctxt)=> {
        console.log(ctxt.point);
        m.add('Show image', () => srv.infoPopup(ctxt.point, [m.x, m.y]) );
 
        m.add('Share photo', () => WIDGET("tracking.db.Sharing", [m.x, m.y], false, 
            x=> x.setIdent( ctxt.ident.replace(/^(__db\.)/, ""), "name", "Photo", "type")));
            
        if (ctxt.point.point.own || srv.auth.admin) {
            m.add('Delete photo', () => rmPhoto(ctxt.ident) );
            m.add('Edit photo title', ()=> WIDGET("tracking.db.PhotoDescr", [m.x, m.y], false, 
                x=> x.setIdent(ctxt.ident, ctxt.point.point.title)));
        }
    });
    

    }, 2000);
    
    
    
    /* 
     * Helper functions used by menus. 
     */
    
    function histList_hout() {}
    function histList_hover() {}


    
    function rmPhoto(ident) {
        ident = ident.replace(/^(__db\.)/, "");
        if (confirm("Remove photo "+ident+" - are you sure?") == false)
            return;
        
        srv.DELETE("/photos/"+ident, 
            () => console.log("Photo removed: "+ident),
            x => console.log("Removing photo failed: "+x)
        );
    }
    
        
    
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

