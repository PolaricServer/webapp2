/*
 Map browser based on OpenLayers 4. 
 
 Copyright (C) 2017 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 
 
pol.tracking.PolaricServer = function() {
    pol.core.Server.call(this);
    this.auth = { userid: "", admin: false, sar: false }; 
    CONFIG.mb.toolbar.addIcon(2, "images/locked.png", "toolbar_login", null, "Log in");
    this.loginStatus();
    this.pubsub = new pol.tracking.PubSub(this);
}

ol.inherits(pol.tracking.PolaricServer, pol.core.Server);


pol.tracking.PolaricServer.prototype.login = function()
  { window.location.href = this.url+"/formLogin?origin="+this.origin; } 
  // FIXME: Get origin url


pol.tracking.PolaricServer.prototype.logout = function()
  { window.location.href = this.url+"/logout?url="+this.origin; } 
  // FIXME: Get origin url


  
  
  
/**
 * add area to logged in user. FIXME: Should this be here???
 */  
pol.tracking.PolaricServer.prototype.putArea = function(a, f) { 
    var t = this;
    this.POST("/users/"+this.auth.userid+"/areas", 
        JSON.stringify(a), 
        function(x) {var i=parseInt(x); console.log("Added area "+i+" for user: "+t.auth.userid); f(i); },
        function(x) {console.log("ERROR: " + x); } );
}



pol.tracking.PolaricServer.prototype.removeArea = function(id) {
    var t = this;
    this.DELETE("/users/"+this.auth.userid+"/areas/"+id, 
        function() {console.log("Removed area "+id+" for user: "+t.auth.userid); });
}



pol.tracking.PolaricServer.prototype.getAreas = function(f) {
    this.GET("/users/"+this.auth.userid+"/areas", "", function(x) { f(JSON.parse(x));} );
}




pol.tracking.PolaricServer.prototype.loginStatus = function() {
    var t = this;
    this.GET("/authStatus", "", 
            function(x) { 
                t.loggedIn = true;
                t.auth = JSON.parse(x);
                console.log("Logged in to server (userid="+t.auth.userid+").");
                CONFIG.mb.toolbar.changeIcon
                    ("toolbar_login", "images/unlocked.png", 
                     function() {t.logout()}, 
                     "Logged in as: '"+t.auth.userid+"'. Click to log out");
            }, 
            function(xhr, st, err) {
                t.loggedIn = false; 
                console.log("Not logged in: "+st); 
                CONFIG.mb.toolbar.changeIcon
                    ("toolbar_login", "images/locked.png", function() {t.login()}, "Click to log in");
            });
}

   

  

/** 
 * Get info about point from server and show in popup.  
 */
pol.tracking.PolaricServer.prototype.infoPopup = function(p, pixel) {
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
        this, "/station",
        {ajax: true, simple:true, id: p.getId()},
        {id: "infopopup", geoPos: browser.pix2LonLat(pixel)});
}      
     
