/*
 Map browser based on OpenLayers 5. Tracking. 
 Websocket connection with Polaric Server backend. 
 
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



/**
 * Websocket connection to server for updating tracking-info. 
 */

pol.tracking.MapUpdate = class {    
    
    constructor(server) {
        this.suspend = false;
        this.retry = 0;
        this.cretry = 0;
        var t = this;
        t.onopen = null;
        t.subscriber = null;
        /* Should be a (callback function). 
         * We may have an array of subscribers instead? 
         */
        var url = server.wsurl; 
        url += 'jmapdata';
   
        console.log("Opening Websocket. URL: "+url);
        t.websocket = new WebSocket(url);

   
        /** Socket connected handler */
        t.websocket.onopen = function() { 
            console.log("Connected to server (for tracking overlay).");
            if (t.onopen != null) 
                t.onopen();
            else
                console.log("t.onopen is null");
            t.retry = 0;
            setInterval(function() {
                t.websocket.send("****"); // Keepalive 
            }, 120000);
        };
  
  
        /** Incoming message on socket */
        t.websocket.onmessage = function(evt) { 
            if (evt.data == 'RESTART!') {
                console.log("Got RESTART message");
                setTimeout(function() {location.reload();}, 25000);
            }
            else if ((!t.suspend) && t.subscriber != null) {
                t.subscriber(JSON.parse(evt.data));
            }
        };

   
        /** Socket close handler. Retry connection. */
        t.websocket.onclose = function(evt) {
            t.retry++;
            if (t.retry <= 4)
                t._retry(true);
            else {
                t.retry = 0;
                console.log("Lost connection to server (for tracking overlay).");
                alert("ERROR: Lost connection to server");
                cretry = 1;
                t._retry(false);
            }
        }
  
   
        /** Socket error handler */
        t.websocket.onerror = function(evt) { 
            console.log("Failed to connect to server (for tracking overlay).");
            alert("ERROR: Failed to connect to server");
            t._retry(false);
        };
    }

    
    
    _retry(recon) {
        let time = 1000;
        if (recon) { 
            this.retry++; 
            time=15000 + (this.retry*10000); 
        } 
        else {
            this.cretry++; 
            time=30000 * this.cretry; 
            if (time >= 900000) time = 900000; // Max 10 minutes
        }
        
        setTimeout(function() {
            console.log("Attempt to " + (recon?"re":"") + "connect to server (for tracking overlay).");
            this.websocket = new WebSocket(url);
        }, time);
    }
    
    


    /** 
    * Suspend the map-updater for a given time 
    */
    suspend(time) {
        console.assert(time>0, "Assertion failed");
        this.suspend = true; 
        setTimeout( ()=> { this.suspend = false; }, time);
    }


    /** 
     * Close the map-updater 
     */
    close() {
        this.websocket.close();
    }

   
    /** 
     * Subscribe to updates from the server 
     */
    subscribe(flt, c, tag, keep) {
        console.assert(flt!=null && flt!="" && c!=null, "Assertion failed");
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
