/*
 Map browser based on OpenLayers 4. Tracking. 
 Websocket connection with Polaric Server backend. 
 
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



/**
 * @classdesc
 * Websocket connection to server for generic publish/subscribe service 
 * @constructor
 */

pol.tracking.PubSub = function(server) {
    this.suspend = false;
    this.retry = 0;
    var t = this;
    t.onopen = null;
    t.rooms = {};
      /* Each room is an array of subscribers (callback functions) */
   
    var url = server.wsurl; 
    url += '/notify';
   
    console.log("Opening Websocket. URL: "+url);
    t.websocket = new WebSocket(url);

   
    /** Socket connected handler */
    t.websocket.onopen = function() { 
        console.log("Connected to server (for notify service).");
        if (t.onopen != null) 
            t.onopen();
        else
            console.log("t.onopen is null");
        t.retry = 0;
    };
  
  
    /** Incoming message on socket */
    t.websocket.onmessage = function(evt) { 
        var txt = evt.data.split(",", 2);
        var room = t.rooms[txt[0]];
        console.log("NOTIFY: room="+txt[0]+", msg="+txt[1]);
        
        if ((!t.suspend) && room != null)
            for (i in room)
                if (room[i].json) room[i].cb( JSON.parse(txt[1]));
                else room[i].cb(txt[1]);
    };

   
    /** Socket close handler. Retry connection. */
    t.websocket.onclose = function(evt) {
        t.retry++;
        if (t.retry <= 3)
            setTimeout(function() {
                console.log("Attempt reconnect to server (for notify service).");
                t.websocket = new WebSocket(url);
            }, 16000);
        else {
            t.retry = 0;
            console.log("Lost connection to server (for notify service).");
            alert("ERROR: Lost connection to server");
        }
    }
  
   
    /** Socket error handler */
    t.websocket.onerror = function(evt) { 
        console.log("Failed to connect to server (for notify service).");
        alert("ERROR: Failed to connect to server");
    };
}



/** 
 * Suspend the map-updater for a given time 
 */
pol.tracking.PubSub.prototype.suspend = function(time) {
    console.assert(time>0, "Assertion failed");
    this.suspend = true; 
    setTimeout( function() {this.suspend = false; }, time);
}


/** 
 * Close it 
 */
pol.tracking.PubSub.prototype.close = function() {
    this.websocket.close();
}



pol.tracking.PubSub.prototype.putText = function(room, txt) {
    this.websocket.send('PUT,' + room + ","+ txt);
}


pol.tracking.PubSub.prototype.put = function(room, obj) {
    this.putText(room, JSON.stringify(obj));
}



   
/** 
 * Subscribe to updates from the server in a given room. 
 * A subscriber is a callback function to be called when notifications arrive. 
 * Allow multiple subscribers to a room.  
 */
pol.tracking.PubSub.prototype.subscribe = function(room, c, text) {
    console.assert(room!=null && room!="" && c!=null, "Assertion failed");
    if (!this.rooms[room] || this.rooms[room] == null) {
        this.rooms[room] = new Array();
        this.websocket.send('SUBSCRIBE,' + room);
    }
    this.rooms[room].push({cb:c, json:!text});
    this.suspend = false; 
}


/** 
 * Unsubscribe all subscribers to a room 
 */
pol.tracking.PubSub.prototype.unsubscribeAll = function(room) {
    console.assert(room!=null && room!="" && this.rooms[room] 
        && this.rooms[room] != null, "Assertion failed");
    this.rooms[room] = null;
}



/**
 * Unsubscribe from a room. 
 */ 
pol.tracking.PubSub.prototype.unsubscribe = function(room, c) {
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
       if (clients[i] == c)
  	  client.splice(i,1);
}




