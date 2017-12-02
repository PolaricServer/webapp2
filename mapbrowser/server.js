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
 
 
pol.core.Server = function() {
    var host = CONFIG.get('server');
    
    /* Compute URL base (for ordinary Ajax) */
    var prefix = CONFIG.get('ajaxprefix');
    if (prefix == null)
       prefix = '';
    this.url = host + prefix;
    
    /* Compute Websocket URL base */
    prefix = CONFIG.get('wsprefix');
    if (prefix == null)
       prefix = '';
    var uparts = host.split(/:\/\//);
    this.wsurl = (uparts[0] === 'https' ? 'wss' : 'ws'); 
    this.wsurl = this.wsurl + "://"+ uparts[1] + prefix
   
    this.origin = window.location.href; 
    this.loggedIn = false;
}




pol.core.Server.prototype.popup = function(name, url, width, height) {
  var u = this.url+"/"+url;
  var ctrl = "left=50,top=100,width="+width+",height="+height+"resizable=1,scrollbars=1";
  eval( "this."+name+"=window.open('"+u+"','"+name+"','"+ctrl+"');" );
 // if (window.focus)
 //   setTimeout(function() {eval("if(this."+name+") this."+name+".focus();" );}, 2000);
}




/**
* @param type: String
* @param service: String
* @param data: PlainObject|String|Array
* @param error:  Function( jqXHR jqXHR, String textStatus, String errorThrown )
* @param success: Function( Anything data, String textStatus, jqXHR jqXHR )
*/

pol.core.Server.prototype.ajax = function(type, service, data, success, error) {
    return $.ajax(this.url+service, {
        type: type,
        data: data, 
        success: success,
        error: error,
        crossDomain: true,
        xhrFields: { withCredentials: true }
    });
}



pol.core.Server.prototype.GET = function (service, data, success, error) {
    return this.ajax('GET', service, data, success, error); 
}


pol.core.Server.prototype.POST = function (service, data, success, error) {
    return this.ajax('POST', service, data, success, error); 
}


pol.core.Server.prototype.PUT = function (service, data, success, error) {
    return this.ajax('PUT', service, data, success, error); 
}


pol.core.Server.prototype.DELETE = function (service, success, error) {
    return this.ajax('DELETE', service, null, success, error); 
}
