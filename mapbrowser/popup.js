/*
  Map browser based on OpenLayers 4. 
  Popup windows
  
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


// FIXME 
var isMobile = false;


/**
 * Popup window manager class. 
 * For now, there is only one active popup at a time. 
 *
 * @constructor
 */

polaric.Popup = function(mb) {
   this.mb            = mb;
   this.onDiv         = document.getElementById("map"); 
   this.activepopup   = null;
   this.psubdiv       = null;
   this.allowedPopups = 1; 
   this.onCallback    = null; 
   this.offCallback   = null;
   this.geoPos        = false;
   this.image         = null;
   var t = this;

   this.mb.view.on('change:center', onChangeCenter);
   this.mb.map.on('click', onClick);
   this.mb.map.on('change:view', onChangeView);
   
   function onChangeCenter() {
       if (t.geoPos && t.geoPos != null) t.setPositionGeo(t.geoPos); 
    }

   function onClick() {
       t.removePopup(); 
   }
   
   function onChangeView() {
       t.removePopup();
       t.mb.view.on('change:center', onChangeCenter);
       // FIXME: Unregister handler on previous view? 
   }
}



/**
 * Deactivate popup.
 */ 
polaric.Popup.prototype.removePopup = function()
{
  if (this.activepopup == null)
    return;
  if (this.offCallback != null)
    this.offCallback(); 
  this.isMenu = false;
  this.allowedPopups++;
                   
  this.activepopup.style.display = "none" ;
  this.activepopup.parentNode.removeChild(this.activepopup);
  this.activepopup = null;
  this.geoPos = null;
}



/**
 * Return true if popup is active. 
 */ 

polaric.Popup.prototype.popupActive = function()
   { return (this.activepopup != null); }


   
/**
 * Register callback functions
 * For popup activation (on) and deactivation (off)
 */

polaric.Popup.prototype.onPopup = function(on, off) 
   { this.onCallback = on; this.offCallback = off; }
   


/**
 * Activate popup. 
 */
polaric.Popup.prototype.showPopup = function (props) 
{
    var t = this;
    var x, y; 
    var pdiv = ((props.elem && props.elem!=null)  
        ? props.elem : document.createElement('div'));
    if (props.html)
        pdiv.innerHTML = props.html;
    if (props.id && props.id != null) pdiv.id = props.id;
  
    pdiv.className = 'POPUP' + 
       ((props.cclass && props.cclass != null) ? " "+props.cclass : ""); 
  
    setTimeout( function() {
       if (props.geoPos && props.geoPos != null) {
           t.geoPos = props.geoPos;
           props.pixPos = t.mb.map.getPixelFromCoordinate
             (ol.proj.fromLonLat(props.geoPos, t.mb.view.getProjection()));
       }      
       else
           t.geoPos = null;
       
       if (props.pixPos && props.pixPos != null)
          { x = props.pixPos[0]; y=props.pixPos[1]; }
       t.popup_(pdiv, x, y, props.image);
    }, 200);
    
    if (props.draggable) {
       var pinimage = document.createElement('img');
       pinimage.className = "popup_pin";
       pinimage.src = "images/pin-green.png";
       pdiv.appendChild(pinimage);
 
       pinimage.onclick = function(e) {
          pdiv._pinned = (pdiv._pinned ? false : true); 
          if (pdiv._pinned) {
              pinimage.src = "images/pin-red.png";
              t.activepopup = null;
              t.allowedPopups++;
          } 
          else {
              pinimage.src = "images/pin-green.png";
              t.removePopup();
              t.activepopup = pdiv;
              t.allowedPopups--;
          }
       };
    }
    
    pdiv.onmousedown = function(e) 
       { e = (e)?e:((event)?event:null); e.stopPropagation(); return null; };
    pdiv.onmouseup = function(e) 
       { e = (e)?e:((event)?event:null); return null; };
    pdiv.onclick = function(e)   
       { e = (e)?e:((event)?event:null); e.stopPropagation(); return null; }; 
   
   if (props.resizable) 
       $(pdiv).resizable();
   if (props.draggable) 
       $(pdiv).draggable({ delay: 100, opacity: 0.7 }  );
   return pdiv;
}



/**
 * Activate popup with content from remote server. 
 */

polaric.Popup.prototype.remotePopup = function(url, x, y, id)
{
    var d =  this.showPopup("", x, y, false, id, false);
    call(url, null, function(txt) { d.innerHTML = txt; } );
    return d;
}


/**
 * Activate popup with content from remote server and with 
 * a stylesheet.  
 */

polaric.Popup.prototype.remotePopupCSS = function(url, x, y, css)
{
   call(url, null, function(txt) 
   { var div = this.showPopup(txt, 1, 1, false, null, false); 
     if (css != null) 
          div.className = css;
   } );
}



/**
 * Show a image at a given map position. 
 */

polaric.Popup.prototype.showImageGeo = function(geoPos) {
   var t = this;
   setTimeout( function() {
      t.geoPos = geoPos;
      var pixPos = t.mb.map.getPixelFromCoordinate
         (ol.proj.fromLonLat(geoPos, t.mb.view.getProjection()));
      t.popup_(null, pixPos[0], pixPos[1], true);
   }, 900);
}



/**
 * Change the position of a popup or image. 
 */

polaric.Popup.prototype.setPositionGeo = function(geoPos) {
    if (this.activepopup && this.activepopup != null) {
        var pixPos = this.mb.map.getPixelFromCoordinate
             (ol.proj.fromLonLat(geoPos, this.mb.view.getProjection()));
        this.setPosition_(pixPos[0], pixPos[1]);
    }
}



/**
 * Change the position of a popup or image. Pixel position on screen. 
 */

polaric.Popup.prototype.setPositionPix = function(pixPos) {
    if (this.activepopup && this.activepopup != null)
        this.setPosition_(pixPos[0], pixPos[1]);
}



/**
 * Set the position of a popup or image. Pixel position on screen. 
 * @private
 */

polaric.Popup.prototype.setPosition_ = function(x, y)
    {   
      var xoff=0;
      var yoff=0;
      var xoffs = yoffs = false;
        
      if (this.image != null) {
         this.image.style.left= -9+'px';
         this.image.style.top= -12+'px';
      }
      
     /* 
      * If part if window is outside the viewport, we may adjust the 
      * position of the window. It may be easier to just move the map, but
      * sometimes it is desirable not to.. 
      */
      xoff = x + 4 + this.psubdiv.clientWidth - this.onDiv.clientWidth;
      if (xoff > 0) {
        xoffs = true;
        x -= xoff;
        if (x < 1) x=1;
        if (this.image!=null)
          this.image.style.left = (xoff-9)+'px';
      }

      yoff = y + 4 + this.psubdiv.clientHeight - this.onDiv.clientHeight;
      if (yoff > 0) {
	    yoffs = true;
        y -= yoff;
        if (y < 1) y=1;
        if (this.image!=null)
          this.image.style.top =(yoff-12)+'px';
      }
      
      this.activepopup.style.left = x-3+"px";
      this.activepopup.style.top  = y-3+"px";

      if (xoffs && yoffs && this.image != null) 
         this.image.style.display = "none";
     }
     
     
     
/**
 * Activate a popup - show it on the screen. 
 * @private
 */
     
polaric.Popup.prototype.popup_ = function(elem, x, y, img)
{
     var t = this;
     if (this.allowedPopups <= 0)
         return;
     ;
     
     if (elem == null) 
         elem = document.createElement('div');
     
     this.psubdiv = this.activepopup = elem;  
     if (img != null && img) {
         this.image = document.createElement('img');
         this.activepopup.appendChild(this.image);
      	 this.image.src='images/cross.png';
    	 this.image.style.position='absolute';
         this.image.style.zIndex = 1001;
     }

     /* Add the popup window div to the viewport */
     this.onDiv.appendChild(this.activepopup);

  
     this.activepopup.style.position   = 'absolute';
     this.activepopup.style.display    = 'block';
     this.activepopup.style.padding    = '2px';
     this.activepopup.style.cursor     = 'default';
     
     /* If viewport is less than 500 pixels wide and content is 
      * wider than the viewport, let popup be as wide as the viewport 
      */
     if (this.onDiv.clientWidth < 500 && this.elem.clientWidth > this.onDiv.clientWidth)
        this.activepopup.style.minWidth = this.onDiv.clientWidth+'px'; 
     
     /* Is the height of the content more than the available height?
      * Then we need a scroller 
      */
     if (elem.clientHeight+10 > this.onDiv.clientHeight) {
         this.activepopup.style.maxHeight = this.onDiv.clientHeight-5 + "px";
         elem.id = 'wrapper'; // FIXME?
         
         /* Activate scroller */
         /* FIXME: Special treatment of mobile devices? */
         if (isMobile) 
            setTimeout(function () {
              myScroll = new IScroll(activepopup, {
                    scrollbars : true, 
                    tap : true
                 });
            }, 1000);
         else
            this.activepopup.style.overflowY  = 'scroll';
     }
     else
        this.activepopup.style.overflowY = 'visible';
     
     this.setPosition_(x, y);
     this.activepopup.style.zIndex  = 1301;
     
     this.allowedPopups--;
     if (this.onCallback != null)
        this.onCallback(); 
}
