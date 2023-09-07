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
        const t = this;
        t.server = server;
        t.suspend = false;
        t.retry = -1;
        t.cretry = 0;
        t.firstopen = true;

        t.onopen = null;
        t.onclose = null;
        t.subscriptions = [];
        t.rooms = {};
            /* Each room is an array of subscribers (callback functions) */

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
        t.retry = -1;    
        let url = t.server.wsurl; 
        url += 'notify';  
        console.log("Opening Websocket. URL: "+url);
        CONFIG.server.genAuthString(null).then( x => {
            t.websocket = new WebSocket(url+(x==null ? "" : "?"+x));

            /* Socket connected handler */
            t.websocket.onopen = function() { 
                console.log("Connected to server (for notify service).");
                if (t.onopen != null && t.firstopen) 
                    t.onopen();
                t.firstopen = false;
                t.restoreSubs();
                t.retry = -1;  t.cretry = 0;
            };
            
            
            /* Incoming message on socket */
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
        
            
            /* Socket close handler. Retry connection. */
            t.websocket.onclose = function(evt) {
                console.log("Lost connection to server (pubsub): ", evt.code, evt.reason);
                closeHandler();
                if (evt.code==1000)
                    normalRetry();
                else
                    errorRetry();
            }
  
   
            /** Socket error handler */
            t.websocket.onerror = function(evt) { 
                console.log("Server connection error (pubsub)");
                errorRetry();
                closeHandler();
            };
        });
        
        
        function closeHandler() {
            if (t.onclose != null)
                t.onclose();
        }
        
        
        function normalRetry() { 
            retry=4;
        }
        
        
        function errorRetry() {
            t.retry = 6 + t.cretry * 3;
            if (t.cretry < 10) 
                t.cretry++;
            else {
                console.log("Giving up connecting (pubsub)");
                t.retry = -1; // GIVE UP after 10 attempts
            }
        }
        
    } 

        
    

    /** 
     * Suspend the updater for a given time 
     */
    suspend(time) {
        console.assert(time>0, "Assertion failed");
        this.suspend = true; 
        setTimeout( () => {this.suspend = false; }, time);
    }

       
    isConnected() {
        return (this.websocket != null 
            && this.websocket.readyState === Websocket.OPEN);
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


   
    restoreSubs() {
        for (const rm of Object.keys(this.rooms))
            this.websocket.send('SUBSCRIBE,' + rm);
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


