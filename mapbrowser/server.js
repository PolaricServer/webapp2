/*
 Map browser based on OpenLayers.

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
        this.origin = window.location.href;
        this.host = null;
    }


    async _init(alt) {
        let host   = await CONFIG.get('server');
        let port   = await CONFIG.get('port');
        let secure = await CONFIG.get('secure');

        if (alt==true) {
            const ahost   = await CONFIG.get('alt_server');
            const aport   = await CONFIG.get('alt_port');
            const asecure = await CONFIG.get('alt_secure');
            console.log("ALT SERVER: ", ahost);
            if (ahost != null)
                host = ahost;
            if (aport != null)
                port = aport;
            if (asecure != null)
                secure = asecure;
        }


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
            if (port != null && port != "" && port != 80)
                host +=":" + port ;
        }
        if (! /.+\:\/\//.test(host) )
            host = (secure ? "https": "http") + "://" + host;
        if (host.charAt(host.length) != '/')
            host += '/';

        /* Compute URL base (for ordinary Ajax/REST) */
        let prefix = await CONFIG.get('ajaxprefix');
        if (prefix == null)
            prefix = '';
        if (prefix.charAt(prefix.length != '/'))
            prefix += '/';
        this.url = host + prefix;

        /* Compute Websocket URL base */
        prefix = await CONFIG.get('wsprefix');
        if (prefix == null)
            prefix = '';
        if (prefix.charAt(prefix.length != '/'))
            prefix += '/';
        const uparts = host.split(/:\/\//);

        this.wsurl = (uparts[0] === 'https' ? 'wss' : 'ws');
        this.wsurl = this.wsurl + "://"+ uparts[1] + prefix;
        this.host = host;
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
     * @param success: Function( Anything data, String textStatus, jqXHR jqXHR )
     * @param error:  Function( jqXHR jqXHR, String textStatus, String errorThrown )
     */
    ajax(type, service, data, success, error, content, hdrs) {
        this.genHeaders(data).then( (genhdrs) => {
            return $.ajax(this.url+service,  {
                type: type,
                data: data,
                success: success,
                error: error,
                contentType: (content!=null ? content : false),
                processData: (type!="POST"),
                crossDomain: true,
                xhrFields: { withCredentials: true },
                headers: this.mergeHdrs(genhdrs, hdrs)
            });
        }).catch( (e)=> {} );
    }


    mergeHdrs(x, y) {
        let z = {};
        if (x!= null)
            for (const key in x)
                z[key] = x[key];
        if (y!= null)
            for (const key in y)
                z[key] = y[key];
        return z;
    }


    /*
     * This can be redefined in a subclass to the Authorization header or other headers
     * that is to be used on GET, PUT, POST and DELETE (not on POSTFORM)
     */
    async genHeaders(x) {
        return null;
    }


    GET(service, data, success, error, cnt, hdrs) {
        return this.ajax('GET', service, data, success, error, cnt, hdrs);
    }


    POST(service, data, success, error, cnt, hdrs) {
        return this.ajax('POST', service, data, success, error, cnt, hdrs);
    }


    POSTFORM(service, data, success, error, cnt, hdrs) {
        return this.ajax('POST', service, data, success, error, "application/x-www-form-urlencoded", hdrs);
    }


    PUT(service, data, success, error, cnt, hdrs) {
        return this.ajax('PUT', service, data, success, error, cnt, hdrs);
    }


    DELETE(service, success, error, cnt, hdrs) {
        return this.ajax('DELETE', service, null, success, error, cnt, hdrs);
    }

} /* class */
