/*
 Map browser based on OpenLayers. Tracking.
 Websocket connection with Polaric Server backend.

 Copyright (C) 2017-2025 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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




var pol = window.pol;
/**
 * Websocket connection to server for updating tracking-info.
 */

pol.tracking.MapUpdate = class {

    constructor(server) {
        const t = this;
        t.suspend = false;
        t.retry = -1;
        t.cretry = 0;
        t.server = server;
        t.kalive = null;
        t.closed = false;

        t.firstopen = true;
        t.onopen = null;
        t.subscriber = null;
        /* Should be a (callback function).
         * We may have an array of subscribers instead?
         */

        t.open();

        setInterval ( ()=> {
            if (t.retry==0)
                t.open();

            else if (t.retry > 0)
                t.retry--;
        }, 5000)
    }



    open() {
        const t = this;
        t.closed = false;
        t.retry = -1;
        let url = t.server.wsurl;

        url += 'jmapdata';
        console.log("Opening Websocket. URL: "+url);
        CONFIG.server.genAuthString(null).then( x => {
            t.websocket = new WebSocket(url
               + (CONFIG.server.phone ? "?_MOBILE_" + (x==null ? "" : "&"+x)
                                      : (x==null ? "" : "?"+x) )
            );


            /* Socket connected handler */
            t.websocket.onopen = function() {
                console.log("Connected to server (for tracking overlay).");
                $("#warnmode").addClass("warn_hidden");
                if (t.onopen != null )
                    t.onopen();
                t.firstopen = false;
                t.retry = -1;  t.cretry = 0;
                if (t.kalive!=null)
                    clearInterval(t.kalive);
                t.reportLayer(CONFIG.mb.baseLayerName);
                t.kalive = setInterval(()=> {
                    t.websocket.send("****");
                }, 120000);
            };


            /** Incoming message on socket */
            t.websocket.onmessage = function(evt) {
                if ((!t.suspend) && t.subscriber != null) {
                    try {
                        t.subscriber(JSON.parse(evt.data));
                    }
                    catch (err) {
                        console.warn("Cannot parse data from server: ", evt.data);
                    }
                }
            };


            /* Socket close handler. Retry connection. */
            t.websocket.onclose = function(evt) {
                clearInterval(t.kalive);
                if (t.closed) {
                    console.log("Connection closed (for tracking overlay)");
                    return;
                }
                else
                    console.log("Lost connection to server (for tracking overlay): ", evt.code);
                closeHandler();
                if (evt.code==1000)
                    normalRetry();
                else
                    errorRetry();
            }


            /** Socket error handler */
            t.websocket.onerror = function(evt) {
                console.log("Server connection error (tracking overlay): ");
                if (t.closed)
                    return;
                clearInterval(t.kalive);
                errorRetry();
                closeHandler();
            };
        });


        function closeHandler() {
            if (t.onclose != null)
                t.onclose();
        }


        function normalRetry() {
            t.retry = 5;
        }


        function errorRetry() {
            t.retry = (t.cretry==0 ? 2 : t.retry * 2);
            if (t.cretry < 10)
                t.cretry++;
            else {
                console.log("Giving up connecting (tracking overlay)");
                t.retry = -1; // GIVE UP after 10 attempts
            }
        }

    }




    /**
    * Suspend the map-updater for a given time
    */
    suspend(time) {
        console.assert(time>0, "(suspend) time<=0");
        this.suspend = true;
        setTimeout( ()=> { this.suspend = false; }, time);
    }


    isConnected() {
        return (this.websocket != null
            && this.websocket.readyState === WebSocket.OPEN);
    }

    /**
     * Close the map-updater
     */
    close() {
        this.closed = true;
        this.websocket.close();
    }



    reportLayer(ly) {
        var msg = 'BASELAYER,'+ly;
        this.websocket.send(msg);
    }



    /**
     * Subscribe to updates from the server
     */
    subscribe(flt, c, tag, keep) {
        console.assert(flt!=null && flt!="", "(subscribe) flt is empty or null");
        console.assert(c!=null, "(subscribe) c is null");
        this.subscriber = c;
        this.suspend = false;
        var ext = CONFIG.mb.getExtent();
        var scale = CONFIG.mb.getScale();

        /* Send a subscribe command to server with filter-profile, map-extent and scale */
        var top = ext[3];
        var bottom = ext[1];

        var msg = 'SUBSCRIBE,' + flt+',' +
            roundDeg(ext[0])+ ',' + roundDeg(bottom)+ ',' + roundDeg(ext[2])+ ',' + roundDeg(top)+ ',' +
            Math.round(scale)  + (keep ? ",true" : ",false") + (tag ? ","+tag : "") ;

        this.websocket.send(msg);


        function roundDeg(x)
            { return Math.round(x*1000)/1000; }
    }

} /* class */