/*
 Map browser based on OpenLayers.
 Polaric Server connection.

 Copyright (C) 2017-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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


 /** @namespace */
var pol = window.pol;
window.pol.core = window.pol.core || {};
window.pol.tracking = window.pol.tracking || {};


pol.tracking.ServerManager = class {

    constructor(mobile, cb) {
        const t = this;
        t.mobile = mobile;
        t.callback = cb;
    }

    instantiate() {
        const srv = new pol.tracking.PolaricServer(this.mobile);
        if (this.callback != null)
            this.callback(srv);
        return srv;
    }

}



pol.tracking.PolaricServer = class extends pol.core.Server {

    constructor(mobile) {
        super();
        this.auth = { userid: "", groupid: "", callsign: "", servercall: "", admin: false, sar: false, nclients: 0, services: "" };
        this.hasDb = false;
        const t = this;

        /* This is for the new Hmac-based authentication scheme */
        t.userid = "_NONE_";
        t.temp_role = null;
        t.key = null;
        t.authOk = false;
        t.authCallbacks =  [];
        t.startcb = null;
        t.stopcb = null;
        t.cbId = 0;
        t.mobile = mobile;
        t.init();

        /* Get login status. Periodic, interval: 6 minutes */
        setInterval( ()=> {
            this.loginStatus();
        },360000);

    }



    async init(alt) {
        const t = this;
        await sleep(2000);
        await super._init(alt);
        await t.restoreCredentials();

        t.pubsub = new pol.tracking.PubSub(this);

        if (t.startcb != null)
            t.startcb();

        t.loginStatus();

        /* Callback when pubsub websocket is opened for the first time */
        t.pubsub.onopen = function() {
        };
        /* Callback when pubsub websocket is closed */
        t.pubsub.onclose = function() {
        }
    }


    stop() {
        this.key = null;
        if (this.stopcb != null)
            this.stopcb();
    }


    getRole() {
        if (this.temp_role != null)
            return this.temp_role;
        return this.auth.groupid;
    }


    /*
     * Generate authentication string (HMAC based) for use in REST API
     * requests (see also genHeaders function below).
     */
    async genAuthString(message) {
        const nonce = pol.security.getRandom(8);
        const hmac = await this.getHmac(nonce, message);
        if (hmac == null)
            return null;

        let xfield = "";
        if (this.temp_role != null)
            xfield = ";" + this.temp_role;
        return this.userid+';'+nonce+';'+hmac + xfield;
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
    async getHmac(nonce, message) {
        let msgHash = "";
        if (this.key==null)
            return null;
        if (message != null && message != "")
            msgHash = await pol.security.Sha256_B64(message)
        return await pol.security.hmac_Sha256_B64(this.key, nonce+msgHash);
    }


    /* Set the secret key and save it in datastore */
    async setCredentials(userid, secret) {
        const x = await pol.security.hmac_getKey(secret)
        this.key = x;
        /* FIXME: How can we store the key in a more secure way?
         * This is still somewhat vulnerable to CSS attacks
         */
        await CONFIG.remove("api.key");
        if (this.mobile) {
            await CONFIG.store("api.key", secret);
            await CONFIG.store("api.userid", userid);
        }
        else {
            CONFIG.storeSes("api.key", secret);
            CONFIG.storeSes("api.userid", userid);
        }
        this.userid = userid;
    }


    /*
     * Restore credentials - username and secret key from
     * local store.
     */
    async restoreCredentials() {
        const ktext = await CONFIG.get("api.key");
        const userid = await CONFIG.get("api.userid");

        if (userid != null)
            this.userid = userid;

        if (ktext == null || ktext.length != 64)
            this.key = null;
        else
            this.key = await pol.security.hmac_getKey(ktext);;
    }


    /*
     * Register callback function for startup
     */
    onStart(f) {
        this.startcb = f;
    }

    onStop(f) {
        this.stopcb = f;
    }


    /*
     * Register callback functions for login and logout
     */
    onLogin(login, logout) {
        this.logincb = login;
        this.logoutcb = logout;
    }


    /* Remove the secret key */
    removeKey() {
        CONFIG.remove("api.key");
        this.key = null;
    }



    isAuth() {
        return (this.key != null && this.authOk);
    }


    /*
     * Clear authentication (remove secret key).
     * Corresponds to logout
     */
    clearAuth() {
        this.removeKey();
        this.loginStatus(); // To confirm and update things...
                            // We may do this directly...
    }

    /* Add callback - to be called when logout happens */
    addAuthCb(f) {
        this.cbId++;
        this.authCallbacks.push({cbid:this.cbId, func: f});
        return this.cbId;
    }


    /* Remove logout callback. Use id returned from addAuthCb */
    removeAuthCb(cbid) {
        for (const i in this.authCallbacks)
            if (this.authCallbacks[i].cbid==cbid)
                this.authCallbacks.slice(i);
    }

    /**
     * add object on server (to logged in user).
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
                if (typeof f == 'function') f(GETJSON(x));
            },
            (xhr,stat,err) => { console.log("ERROR: ", err); }

        );
    }



    getObj(tag, f) {
        this.GET((!this.isAuth() ? "open/" : "") + "objects/"+tag, "",
                x => f(GETJSON(x)) );
    }


    /*
     * Return true if server supports the given service.
     * Services can be provided by plugins.
     */
    hasService(service) {
        for (const x of this.auth.services)
            if (x===service) return true;
        return false;
    }


    async setAltServer() {
        const ahost = await CONFIG.get('alt_server');
        if (ahost == null)
            return;
        this.pubsub.close();
        CONFIG.tracks.close();
        this.stop();
        this.init(true);
    }


    async checkLoad() {
        const maxcli = await CONFIG.get('max_clients');

        if (maxcli != null && this.auth.nclients > maxcli)
            this.setAltServer();
    }



    /*
     * FIXME: Change to icons on toolbar could be handler-function?
     * FIXME: What is done here is also done in getting Websocket messages....
     */
    loginStatus() {
        this.GET("authStatus", "",
            x => {
                if (this.authOk && this.temp_role == null)
                    return;
                this.auth = GETJSON(x);
                this.checkLoad();
                this.authOk = true;
                this.hasDb = this.hasService('database');

                /* Close the pubsub channel to get a new which is authenticated
                 */
                this.pubsub.close();
                this.doAuthCb();
                if (this.logincb != null)
                    this.logincb();
            },

            (xhr, st, err) => {
                if (this.authOk) {
                    this.pubsub.close();
                    this.authOk = false;
                    this.doAuthCb();
                    if (this.logoutcb != null)
                        this.logoutcb(err);
                }
                this.loginStatus2();
            });
    }



    /*
     * If authentication fails, we can call this to get the auth status anyway, since it
     * contains info about capabilities of the server. Maybe we should separate this out.
     */
    loginStatus2() {
        this.GET("authStatus2", "",
            x => {
                this.auth = GETJSON(x);
                this.checkLoad();
                this.hasDb = this.hasService('database');
            },
            null
        );
    }




    /* Callback functions to be notified of logout or login*/
    doAuthCb() {
        for (const x of this.authCallbacks)
            x.func();
    }




    getPhoto(ident, func) {
        this.GET((this.isAuth() ? "" : "open/") + "photos/"+ident, "", x => {
            const photo = GETJSON(x);
            func(photo);
        } );
    }



    /**
     * Get info about point from server and show in popup.
     * FIXME: Move this somewhere else?
     */
    infoPopup(p, pixel) {
        console.assert(p!=null, "(infopopup) p==null");
        CONFIG.mb.gui.removePopup();

        if (pol.tracking.isSign(p)) {
            if (p.point.href.indexOf("P:") === 0)
                /* Show image */
                CONFIG.mb.gui.imagePopup(p.point.title, p.point.href,
                {draggable: true, id: "imagepopup",  pixPos: (this.mobile ? [0,0] : pixel)  });

            else if (p.point.type === "photo") {
                /* Show user uploaded image */
                this.getPhoto(p.point.ident.substring(5), (ph) => {
                    CONFIG.mb.gui.imagePopup(ph.descr+" - "+formatDTG(ph.time) +
                      (!this.isAuth() || this.userid !== ph.userid ? " (by "+ph.userid+")" : "") ,
                      "  data:image/jpeg;base64, "+ph.image,
                      {draggable: true,  id: "imagepopup",  pixPos: (this.mobile ? [0,0] : pixel)  } );
                });
            }
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
