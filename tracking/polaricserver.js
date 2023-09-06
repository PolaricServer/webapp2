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
        t.userid = "_nouser_";
        t.key = null;
        t.authOk = false;
        
        t.restoreCredentials().then( ()=> {
            console.log("Got credentials - starting tracking, etc..");
            
            t.pubsub = new pol.tracking.PubSub(this);
            const mu = new pol.tracking.Tracking(srv, (hires? 1.4 : 1) );  
            const flt = new pol.tracking.Filters(mu);
            CONFIG.tracks = mu;
            CONFIG.filt = flt;
            t.loginStatus();
            
            /* Callback when pubsub websocket is opened for the first time */
            t.pubsub.onopen = function() {
            };    
            /* Callback when pubsub websocket is closed */
            t.pubsub.onclose = function() {
            }
            
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
        return (this.key != null && this.authOk);
    }
    
    
    
    clearAuth() {
        console.log("Clear auth");
        this.removeKey();
        this.loginStatus(); // To confirm and update things... 
                       // We may do this directly... 
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
                if (this.authOk)
                    return;
                this.auth = JSON.parse(x);
                console.log("Authentication succcess (userid="+this.userid+").");
                this.authOk = true;
                
                CONFIG.mb.toolbar.changeIcon
                    ("toolbar_login", "images/unlocked.png", 
                    () => WIDGET("tracking.AuthInfo", [320,30], true),
                    "Logged in as: '"+this.auth.userid+"'. Click to log out");
                
                for (x of this.auth.services)
                    if (x=='database')
                        this.hasDb = true;
                
                /* Close the pubsub channel to get a new which is authenticated 
                 * FIXME: We need to restore the connection after close is finished 
                 */
                this.pubsub.close();
                
                /* Notifier is used only when logged in. 
                 * FIXME: Do this after connection is restored.
                 */
                CONFIG.notifier = this.not = new pol.tracking.Notifier();
            }, 
            
            (xhr, st, err) => {
                // this.removeKey();
                console.log("Authentication failed (not logged in): ", err); 
                CONFIG.mb.toolbar.changeIcon
                    ("toolbar_login", "images/locked.png", () => this.login(), "Click to log in");
         
                /* Stop notifier */
                if (this.not != null) 
                    this.not.stop();
                CONFIG.notifier = this.not = null;
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
