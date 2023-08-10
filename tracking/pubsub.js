/*
 Map browser based on OpenLayers 5. Tracking. 
 Publish/subscribe service. Based on websocket connection with Polaric Server backend. 
 
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
 * Websocket connection to server for generic publish/subscribe service 
 */

pol.tracking.PubSub = class {
    
    constructor (server) {
        this.suspend = false;
        this.retry = 0;
        this.cretry = 0;
        const t = this;
        t.onopen = null;
        t.rooms = {};
            /* Each room is an array of subscribers (callback functions) */
   
        let url = server.wsurl; 
        url += 'notify';   
        console.log("Opening Websocket. URL: "+url);
        t.websocket = new WebSocket(url);

        /** Socket connected handler */
        t.websocket.onopen = function() { 
            console.log("Connected to server (for notify service).");
            if (t.onopen != null) 
                t.onopen();
            t.retry = 0;
            setInterval(function() {
                t.websocket.send("****"); // Keepalive 
            }, 120000);
        };
  
        /** Incoming message on socket */
        t.websocket.onmessage = function(evt) { 
            const slc = evt.data.indexOf(",");
            const txt1 = evt.data.slice(0,slc);
            const txt2 = evt.data.slice(slc+1);
            const room = t.rooms[txt1];

            if ((!t.suspend) && room != null)
                for (const i in room)
                    if (room[i].json) room[i].cb( JSON.parse(txt2));
                    else room[i].cb(txt2);
        };
        
        /** Socket close handler. Retry connection. */
        t.websocket.onclose = function(evt) {
            t.retry++;
            if (t.retry <= 4)
                t._retry(true);
            else {
                t.retry = 0;
                console.log("Lost connection to server (for notify service).");
                cretry = 1;
                t._retry(false);
            }
        }
  
   
        /** Socket error handler */
        t.websocket.onerror = function(evt) { 
            console.log("Failed to connect to server (for notify service).");
            t._retry(false);
        };
        
        
    } /* constructor */

        
    
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
            console.log("Attempt to " + (recon?"re":"") + "connect to server (for notify service).");
            t.websocket = new WebSocket(url);
        }, time);
    }
    

    /** 
     * Suspend the map-updater for a given time 
     */
    suspend(time) {
        console.assert(time>0, "Assertion failed");
        this.suspend = true; 
        setTimeout( () => {this.suspend = false; }, time);
    }



    /** 
     * Close it 
     */
    close() {
        this.websocket.close();
    }



    /**
     * Send a raw text to a room (through the websocket connection)
     */
    putText(room, txt) {
        this.websocket.send('PUT,' + room + ","+ txt);
    }



    /**
     * Send a object to a room (through the websocket connection)
     */
    put(room, obj) {
        this.putText(room, JSON.stringify(obj));
    }   


   
    /** 
     * Subscribe to updates from the server in a given room. 
     * A subscriber is a callback function to be called when notifications arrive. 
     * it is returned to allow unsubscribing. 
     * Allow multiple subscribers to a room.  
     */
    subscribe(room, c, text) {
        console.assert(room!=null && room!="" && c!=null, "Assertion failed");
        if (!this.rooms[room] || this.rooms[room] == null) {
            this.rooms[room] = new Array();
            this.websocket.send('SUBSCRIBE,' + room);
        }
        this.rooms[room].push({cb:c, json:!text});
        this.suspend = false; 
        return c;
    }


    /** 
     * Unsubscribe all subscribers to a room 
     */
    unsubscribeAll(room) {
        console.assert(room!=null && room!="" && this.rooms[room] 
            && this.rooms[room] != null, "Assertion failed");
        this.rooms[room] = null;
    }


    /**
     * Unsubscribe from a room. 
     */ 
    unsubscribe(room, c) {
        console.assert(room!=null && room!="" && this.rooms[room] 
            && this.rooms[room] != null && c!=null, "Assertion failed");
        var clients = this.rooms[room];
        if (clients == null || clients.length == 0)
            return; 
    
        /* if only one subscriber, set list to null and unsubscribe on server */
        if (clients.length == 1) {
            this.rooms[room] = null;
            this.websocket.send('UNSUBSCRIBE,' + room);
        }
        else for (i in clients) 
            if (clients[i].cb == c)
                clients.splice(i, 1);
    }

} /* class */


