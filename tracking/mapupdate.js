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
 * Websocket connection to server for updating tracking-info. 
 * @constructor
 */

polaric.MapUpdate = function(url) {
   this.suspend = false;
   this.retry = 0;
   var t = this;
   t.onopen = null;
   t.subscriber = null;
     /* Should be a (callback function). 
      * We may have an array of subscribers instead? */
     
   var uparts = url.split(/:\/\//);
   url = (uparts[0] === 'https' ? 'wss' : 'ws'); 
   url = url + "://"+ uparts[1] + '/ws/jmapdata';
   console.log("URL: "+url);
   t.websocket = new WebSocket(url);

   
   /** Socket connected handler */
   t.websocket.onopen = function() { 
      console.log("Connected to server (for tracking overlay).");
      if (t.onopen != null) 
            t.onopen();
      else
          console.log("t.onopen is null");
      t.retry = 0;
   };
  
  
   /** Incoming message on socket */
   t.websocket.onmessage = function(evt) { 
      if ((!t.suspend) && t.subscriber != null)
         t.subscriber(JSON.parse(evt.data));
   };
  
   
   /** Socket close handler. Retry connection. */
   t.websocket.onclose = function(evt) {
      t.retry++;
      if (t.retry <= 3)
         setTimeout(function() {
            console.log("Attempt reconnect to server (for tracking overlay).");
            t.websocket = new WebSocket(url);
         }, 16000);
      else {
         t.retry = 0;
         console.log("Lost connection to server (for tracking overlay).");
         alert("ERROR: Lost connection to server");
      }
   }
  
   
   /** Socket error handler */
   t.websocket.onerror = function(evt) { 
      console.log("Failed to connect to server (for tracking overlay).");
      alert("ERROR: Failed to connect to server");
   };
}



/** Suspend the map-updater for a given time */
polaric.MapUpdate.prototype.suspend = function(time) {
   this.suspend = true; 
   setTimeout( function() {this.suspend = false; }, time);
}


/** Close the map-updater */
polaric.MapUpdate.prototype.close = function() {
   this.websocket.close();
}


function roundDeg(x)
   { return Math.round(x*1000)/1000; }
   
   
   
/** Subscribe to updates from the server */
polaric.MapUpdate.prototype.subscribe = function(flt, c) 
{
  this.subscriber = c;  
  this.suspend = false; 
  var ext = CONFIG.mb.getExtent(); 
  var scale = CONFIG.mb.getScale();
  
  /* Send a subscribe command to server with filter-profile, map-extent and scale */
  var top = ext[3]; 
  var bottom = ext[1]; 
  
  var msg = 'SUBSCRIBE,' + flt+',' + 
     roundDeg(ext[0])+ ',' + roundDeg(bottom)+ ',' + roundDeg(ext[2])+ ',' + roundDeg(top)+ ',' + Math.round(scale);
  console.log(msg);
  this.websocket.send(msg);
}

