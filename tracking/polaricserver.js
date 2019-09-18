/*
 Map browser based on OpenLayers 5.
 Polaric Server connection.
 
 Copyright (C) 2017-2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        this.auth = { userid: "", admin: false, sar: false, services: "" }; 
        this.hasDb = false;
        CONFIG.mb.toolbar.addSection(3);
        CONFIG.mb.toolbar.addIcon(3, "images/locked.png", "toolbar_login", null, "Log in");
        this.loginStatus();
        this.pubsub = new pol.tracking.PubSub(this);
        CONFIG.mb.toolbar.addIcon(3, "images/sar.png", "sarmode");
    }


    login()
        { window.location.href = this.url+"formLogin?origin="+this.origin; } 
        
    logout()
        { window.location.href = this.url+"logout?url="+this.origin; } 
        
        
  
    /**
     * add area to logged in user. FIXME: Should this be here???
     */  
    putObj(tag, obj, f) { 
        this.POST("users/"+this.auth.userid+"/"+tag, 
            JSON.stringify(obj), 
            x => { console.log("Added server object for user: "+this.auth.userid); f(x); },
            x => { console.log("ERROR: " + x); } );
    }



    removeObj(tag, id) {
        this.DELETE("users/"+this.auth.userid+"/"+tag+"/"+id, 
            () => console.log("Removed server object "+id+" for user: "+this.auth.userid) );
    }



    getObj(tag, f) {
        this.GET("users/"+this.auth.userid+"/"+tag, "", 
                x => f(JSON.parse(x)) );
    }


    

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
                        () => this.logout(), 
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
     */
    infoPopup(p, pixel) {
        console.assert(p!=null, "Assertion failed");
        browser.gui.removePopup();
        if (pol.tracking.isSign(p)) {
            if (p.point.href.indexOf("P:") === 0)
                browser.gui.imagePopup(p.point.title, p.point.href, 
                {id: "imagepopup", geoPos: browser.pix2LonLat(pixel)});
            else
                browser.gui.showPopup({
                    pixPos: pixel, 
                    html: (p.point.href ? '<a href="'+p.point.href+'">'+p.point.title+'</a>' 
                                       : p.point.title)
                });
        }
        else 
            browser.gui.remotePopup(
                /* FIXME: This is a call to the old polaric-aprsd webservice that return a HTML fragment.
                 * In the future we may define a REST service that returns a JSON object that is
                 * rendered by the client
                 */
                this, "station",
                {ajax: true, simple:true, id: p.getId()},
                {id: "infopopup", geoPos: browser.pix2LonLat(pixel)});
    }      
     
} /* class */
