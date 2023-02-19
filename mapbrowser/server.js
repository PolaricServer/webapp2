/*
 Map browser based on OpenLayers 5. 
 
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
    


pol.core.ajax = (type, service, data, success, error) => {
    return $.ajax( service, {
        type: type,
        data: data, 
        success: success,
        error: error,  
        contentType: false,
        processData: (type!="POST"),
        crossDomain: true,
        xhrFields: { withCredentials: false }
    });
}
    
    

/**
 * Abstract class for server backends. Supports REST style webservices. 
 */
pol.core.Server = class {
    
    /**
     * Constructor.
     */
    constructor() {
        let host = CONFIG.get('server');
        let secure = CONFIG.get('secure');
        
        /* Default is to use window.location as host, and port 8081 */
        if (host == null) {
            let hh = window.location.host; 
            let pp = window.location.protocol;

            if (pp=='http:' && secure)
                pp='https:';
            
            host = "";
            if (pp)
                host += pp+"//"
            if (hh)
                host +=hh;
            else
                host += "localhost";
            host +=":8081"
        }
        if (! /.+\:\/\//.test(host) )
            host = (secure ? "https": "http") + "://" + host;
        if (host.charAt(host.length) != '/')
            host += '/';
    
        /* Compute URL base (for ordinary Ajax/REST) */
        let prefix = CONFIG.get('ajaxprefix');
        if (prefix == null)
            prefix = '';
        if (prefix.charAt(prefix.length != '/'))
            prefix += '/';
        this.url = host + prefix;
    
        /* Compute Websocket URL base */
        prefix = CONFIG.get('wsprefix');
        if (prefix == null)
            prefix = '';
        if (prefix.charAt(prefix.length != '/'))
            prefix += '/';
        const uparts = host.split(/:\/\//);
        this.wsurl = (uparts[0] === 'https' ? 'wss' : 'ws'); 
        this.wsurl = this.wsurl + "://"+ uparts[1] + prefix
   
        this.origin = window.location.href; 
        this.loggedIn = false;
    }



    /** Full (browser) popup window */
    popup(name, url, width, height) {
        const u = this.url+"/"+url;
        const ctrl = "left=50,top=100,width="+width+",height="+height+"resizable=1,scrollbars=1";
        eval( "this."+name+"=window.open('"+u+"','"+name+"','"+ctrl+"');" );
    }

    
    /* Store/retrieve JSON objects on server. To be defined in subclass */
    getObj(tag, f)                { /* Dummy */ }
    putObj(tag, obj, f)           { /* Dummy */ }
    removeObj(tag, id)            { /* Dummy */ }
    updateObj(tag, ident, obj, f) { /* Dummy */ }


    /**
     * Call webservice on server. 
     * @param type: String - HTTP method
     * @param service: String - Service url. 
     * @param data: PlainObject|String|Array
     * @param error:  Function( jqXHR jqXHR, String textStatus, String errorThrown )
     * @param success: Function( Anything data, String textStatus, jqXHR jqXHR )
     */
    ajax(type, service, data, success, error) {
        return $.ajax(this.url+service,  {
            type: type,
            data: data, 
            success: success,
            error: error,  
            contentType: false,
            processData: (type!="POST"),
            crossDomain: true,
            xhrFields: { withCredentials: true }
        });
    }



    GET(service, data, success, error) {
        return this.ajax('GET', service, data, success, error); 
    }


    POST(service, data, success, error) {
        return this.ajax('POST', service, data, success, error); 
    }


    PUT(service, data, success, error) {
        return this.ajax('PUT', service, data, success, error); 
    }


    DELETE(service, success, error) {
        return this.ajax('DELETE', service, null, success, error); 
    }

} /* class */
