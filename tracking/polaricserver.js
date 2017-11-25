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
    this.auth = { username: "", admin: false, sar: false }; 
    this.loginStatus();
}

ol.inherits(pol.tracking.PolaricServer, pol.core.Server);


pol.tracking.PolaricServer.prototype.login = function()
  { window.location.href = this.url+"/formLogin?origin="+this.origin; } 
  // FIXME: Get origin url


pol.tracking.PolaricServer.prototype.logout = function()
  { window.location.href = this.url+"/logout?url="+this.origin; } 
  // FIXME: Get origin url





pol.tracking.PolaricServer.prototype.loginStatus = function() {
    var t = this;
    this.GET("/authStatus", "", 
             function(x) { 
                 t.loggedIn = true;
                 t.auth = JSON.parse(x);
                 console.log("Logged in to server (userid="+t.auth.userid+").");
             }, 
             function(xhr, st, err) {
                 t.loggedIn = false; 
                    console.log("Not logged in: "+st); 
             });
}

