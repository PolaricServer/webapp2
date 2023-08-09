/*
 Map browser based on OpenLayers 5.
 Polaric Server connection.
 
 Copyright (C) 2017-2021 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        
        /* Add items to toolbar */
        CONFIG.mb.toolbar.addSection(3);
        CONFIG.mb.toolbar.addIcon(3, "images/locked.png", "toolbar_login", null, "Log in");
        this.pubsub = new pol.tracking.PubSub(this);
        CONFIG.mb.toolbar.addIcon(3, "images/sar.png", "sarmode");
        
        /* Get login status. Periodic, interval: 6 minutes */
        this.loginStatus();
        setInterval( ()=> {
            if (this.auth.userid != "")
                this.loginStatus();
        }, 360000);
                
    }


    login()
        { window.location.href = this.url+"formLogin?origin="+this.origin; } 
        
    logout()
        { window.location.href = this.url+"logout?url="+this.origin; } 
        
        
  
    /**
     * add object to logged in user.
     */  
    putObj(tag, obj, f) { 
        this.POST("objects/"+tag, 
            JSON.stringify(obj), 
            x => { console.log("Added server object for user: "+this.auth.userid); 
                   if (typeof f == 'function') f(x); 
                 },
            x => { console.log("ERROR: " + x); } );
    }
    
    
    updateObj(tag, ident, obj, f) { 
        this.PUT("objects/"+tag+"/"+ident, 
            JSON.stringify(obj), 
            x => { console.log("Updated server object "+ident+" for user "+this.auth.userid); 
                   if (typeof f == 'function') f(x); 
            },
            x => { console.log("ERROR: " + x); } );
    }


    removeObj(tag, id, f) {
        this.DELETE("objects/"+tag+"/"+id, 
            x => {
                console.log("Server object "+id+" for user "+this.auth.userid+": "+x+" objects removed");
                if (typeof f == 'function') f(x);
            },
            x => { console.log("ERROR: " + x); }
            
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
                console.log("Couldn't get login info: "+st); 
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
