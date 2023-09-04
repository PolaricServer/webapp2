/*
 Map browser based on OpenLayers 5.
 Polaric Server connection.
 
 Copyright (C) 2017-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published 
 by the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
 
 

pol.tracking.PolaricServer = class extends pol.core.Server {
    
    constructor() {
        super();
        this.auth = { userid: "", groupid: "", callsign: "", servercall: "", admin: false, sar: false, services: "" }; 
        this.hasDb = false;
        const t = this;
           
        /* This is for the new Hmac-based authentication scheme */
        this.userid = "_nouser_";
        this.key = null;
        
        this.restoreCredentials().then( ()=> {
            console.log("Got credentials - starting tracking, etc..");
            this.loginStatus();
            this.pubsub = new pol.tracking.PubSub(this);
            const mu = new pol.tracking.Tracking(srv, (hires? 1.4 : 1) );  
            const flt = new pol.tracking.Filters(mu);
            CONFIG.tracks = mu;
            CONFIG.filt = flt;
            
            /* Callback when pubsub websocket is opened */
            this.pubsub.onopen = function() {
                console.log("pubsump.onopen");
                if (t.userid != null) {
                    const not = new pol.tracking.Notifier();
                    CONFIG.notifier = not; 
                }            
            };    
        });
        
        
        /* Add items to toolbar */
        CONFIG.mb.toolbar.addSection(3);
        CONFIG.mb.toolbar.addIcon(3, "images/locked.png", "toolbar_login", null, "Log in");
        CONFIG.mb.toolbar.addIcon(3, "images/sar.png", "sarmode");
        
        /* Get login status. Periodic, interval: 6 minutes */
        setInterval( ()=> {
            this.loginStatus();
        },360000);
                
    }


    login()
        { window.location.href = this.url+"formLogin?origin="+this.origin; } 
        
    logout()
        { window.location.href = this.url+"logout?url="+this.origin; } 
        
        
        
    async genAuthString(message) {
        const nonce = pol.security.getRandom(8);
        if (message==null) 
            message = "";
        const hmac = await this.getHmac(nonce+message);
        if (hmac == null)
            return null;
        return this.userid+';'+nonce+';'+hmac;
    }
    
        
    /*
     * Generate authorization header on requests
     */
    async genHeaders(message) {
        const str = await this.genAuthString(message);
        if (str==null)
            return null;
        return {'Authorization' : 'Arctic-Hmac '+str};
    }
  
  
    /* Generate HMAC. 
     * If the message is non-empty, generate a SHA256 hash from it and use this 
     * in the generation of a HMAC
     */
    async getHmac(message) {
        let msgHash = "";
        if (this.key==null)
            return null;
        if (message != null && message != "")
            msgHash = await pol.security.Sha256_B64(message)
        return await pol.security.hmac_Sha256_B64(this.key, msgHash);
    }
    
    
    /* Set the secret key and save it in datastore */
    async setCredentials(userid, secret) {
        const x = await pol.security.hmac_getKey(secret)
        this.key = x;
        CONFIG.store("api.key", secret, true);
        this.userid = userid;
        CONFIG.store("api.userid", userid, true);
    }
    
    
    /*
     * Restore credentials - username and secret key from
     * local store. 
     */ 
    async restoreCredentials() {
        const ktext = CONFIG.get("api.key");
        const userid = CONFIG.get("api.userid");
        if (userid != null)
            this.userid = userid;

        if (ktext == null || ktext.length != 64)
            this.key = null;
        else
            this.key = await pol.security.hmac_getKey(ktext);;
    }
    
    
    /* Remove the secret key */
    removeKey() {
        CONFIG.remove("api.key");
        this.key = null;
    }
    
    
    
    isAuth() {
        return (this.key != null);
    }
    
    
    
    clearAuth() {
        this.removeKey();
        this.auth = { userid: "", groupid: "", callsign: "", servercall: "", admin: false, sar: false, services: "" }; 
    }
    
    
    /**
     * add object to logged in user.
     */  
    putObj(tag, obj, f) { 
        this.POST("objects/"+tag, 
            JSON.stringify(obj), 
            x => { console.log("Added server object for user: "+this.auth.userid); 
                   if (typeof f == 'function') f(x); 
                 },
            (xhr,stat,err) => { console.log("ERROR: ", err); } );
    }
    
    
    updateObj(tag, ident, obj, f) { 
        this.PUT("objects/"+tag+"/"+ident, 
            JSON.stringify(obj), 
            x => { console.log("Updated server object "+ident+" for user "+this.auth.userid); 
                   if (typeof f == 'function') f(x); 
            },
            (xhr,stat,err) => { console.log("ERROR: ", err); } );
    }


    removeObj(tag, id, f) {
        this.DELETE("objects/"+tag+"/"+id, 
            x => {
                console.log("Server object "+id+" for user "+this.auth.userid+": "+x+" objects removed");
                if (typeof f == 'function') f(x);
            },
            (xhr,stat,err) => { console.log("ERROR: ", err); }
            
        );
    }



    getObj(tag, f) {
        this.GET("objects/"+tag, "", 
                x => f(JSON.parse(x)) );
    }


    
    /* 
     * FIXME: Change to icons on toolbar could be handler-function? 
     * FIXME: What is done here is also done in getting Websocket messages.... 
     */
    loginStatus() {
        this.GET("authStatus", "", 
            x => { 
                this.auth = JSON.parse(x);
                if (this.auth.userid == null || this.auth.userid == 'null') {
                    console.log("Not logged in");
                    this.loggedIn = false;
                    CONFIG.mb.toolbar.changeIcon
                        ("toolbar_login", "images/locked.png", () => this.login(), "Click to log in");
                }
                else {
                    console.log("Logged in to server (userid="+this.auth.userid+").");
                    this.loggedIn = true;
                    CONFIG.mb.toolbar.changeIcon
                        ("toolbar_login", "images/unlocked.png", 
                        () => WIDGET("tracking.AuthInfo", [320,30], true),
                        "Logged in as: '"+this.auth.userid+"'. Click to log out");
                }
                for (x of this.auth.services)
                    if (x=='database')
                        this.hasDb = true;
            }, 
            
            (xhr, st, err) => {
                this.loggedIn = false; 
                console.log("Couldn't get login info: ", err); 
                CONFIG.mb.toolbar.changeIcon
                    ("toolbar_login", "images/locked.png", () => this.login(), "Click to log in");
            });
    }
   

    /** 
     * Get info about point from server and show in popup.  
     * FIXME: Move this somewhere else? 
     */
    infoPopup(p, pixel) {
        console.assert(p!=null, "Assertion failed");
        CONFIG.mb.gui.removePopup();
        if (pol.tracking.isSign(p)) {
            if (p.point.href.indexOf("P:") === 0)
                CONFIG.mb.gui.imagePopup(p.point.title, p.point.href, 
                {id: "imagepopup", geoPos: CONFIG.mb.pix2LonLat(pixel)});
            else
                CONFIG.mb.gui.showPopup({
                    pixPos: pixel, 
                    html: (p.point.href ? '<a href="'+p.point.href+'">'+p.point.title+'</a>' 
                                       : p.point.title)
                });
        }
        else 
            POPUP("tracking.PointInfo", pixel, x=>x.getItem( encodeURIComponent(p.point.ident)))
    }      
     
} /* class */
