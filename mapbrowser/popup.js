/*
  Map browser based on OpenLayers 5. 
  Popup windows
  
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


var isMobile = false;


/**
 * @classdesc
 * Popup window manager class.  
 *
 * @constructor
 * @param {pol.core.MapBrowser} mb - Map browser instance.
 */

pol.core.Popup = class {
    
    constructor(mb) {
        this.mb            = mb;
        this.onDiv         = document.getElementById("map"); 
        this.activepopup   = null;
        this.psubdiv       = null;
        this.allowedPopups = 1; 
        this.onCallback    = null; 
        this.offCallback   = null;
        this.geoPos        = false;
        this.image         = null;
        const t = this;
    
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
    } /* constructor */
    
    

    /**
     * Deactivate popup.
     */ 
    removePopup() {
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
     * @returns {boolean}
     */     
    popupActive()
       { return (this.activepopup != null); }
    

   
    /**
     * Register callback functions
     * For popup activation (on) and deactivation (off)
     * @param {function} on - Callback to be invoked when popup is activated.
     * @param {function} off - Callback to be invoked when popup is deactivated.
     */
    onPopup(on, off) 
       { this.onCallback = on; this.offCallback = off; }
   


    /**
     * Activate popup. 
     * @param {Object.<string,*>} props - Options
     * @param {string|undefined} props.html - HTML code to render inside the popup.
     * @param {ol.Pixel|undefined} props.pixPos - Pixel position of upper left corner of popup.
     * @param {ol.Coordinate|undefined} props.geoPos - LatLong position of upper left corner of popup.
     * @param {boolean|undefined} props.image - true if we want a cross to be displayed at the position.
     * @param {boolean|undefined} props.draggable - true if we want the popup to be draggable and pinnable.
     * @param {string|undefined} props.id - unique identifier (used as id of element).
     * 
     */
    showPopup(props) 
    {
        const t = this;
        let x, y; 
        if (props.id && props.id != null && document.getElementById(props.id) != null) {
            $('#'+props.id).effect('bounce');
            return null;
        }
        
        let pdiv = ((props.elem && props.elem!=null)  
            ? props.elem : document.createElement('div'));
        if (props.html)
            pdiv.innerHTML = props.html;
        if (props.vnode)
            m.mount(pdiv, props.vnode);
        
        if (props.id && props.id != null) pdiv.id = props.id;
      
        pdiv.className = 'POPUP' + 
           ((props.cclass && props.cclass != null) ? " "+props.cclass : ""); 
  
        setTimeout( () => {
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
    
            if (props.label)
                t.allowedPopups++;
           

            if (props.draggable) {
                if (props.pinned) 
                    pdiv._pinned = true;
                
                if (pdiv._pinned) { 
                    t.allowedPopups++;
                    t.activepopup = null;
                    if (props.pin)
                        props.pin(pdiv._pinned); // Pin callback
                
                
                    /* Close icon */
                    const closeimage = document.createElement('img');
                    closeimage.className = "popup_close";
                    closeimage.src = "images/16px/close.png";
                    pdiv.appendChild(closeimage);
                
                    /* close click handler */
                    closeimage.onclick = function(e) {
                        pdiv._pinned = false; 
                        t.activepopup = pdiv;
                        t.allowedPopups--;
                        t.removePopup();
                        if (props.pin)
                            props.pin(pdiv._pinned); // Pin callback
                    }
                }
            }  }, 300);
        
        pdiv.onmousedown = function(e) 
            { e = (e)?e:((event)?event:null); e.stopPropagation(); return null; };
        pdiv.onmouseup = function(e) 
            { e = (e)?e:((event)?event:null); return null; };
        pdiv.onclick = function(e)   
            { e = (e)?e:((event)?event:null); e.stopPropagation(); return null; }; 
       
        if (props.resizable) 
            $(pdiv).resizable();
        if (props.draggable) 
            $(pdiv).draggable(
                { handle: "h1,h2,.handle", delay: 100, opacity: 0.7, 
                    start: props.dragStart, stop: props.dragStop }  );
        return pdiv;
    }
    
    
    /**
     * Activate popup with image content
     * @param {string} title - heading text. 
     * @param {string} href - URL of image
     */
    imagePopup(title, href, props) 
    {
        const d =  this.showPopup(props);
        d.innerHTML = '<h1 class="popupimg">'+title+'</h1>' +
                      '<img class="popupimg" src="'+href.substring(2)+'"/>';
        return d;
    }
    


    /**
     * Activate popup with content from remote server. 
     * @param {string} url - URL of remote content. 
     * @param {Object.<string,*>} props - Options, see showPopup()
     */
    remotePopup(srv, service, data, props)
    {
        const d =  this.showPopup(props);
        srv.GET(service, data, 
            txt => {d.innerHTML = txt;});
        return d;
    }
    
    
    
    /**
     * Activate popup with content from remote server and with 
     * a stylesheet.  
     * @param {string} url - URL of remote content.
     * @param {string} css - CSS-class to add to the popup. 
     * @param {Object.<string,*>} props - Options, see showPopup()
     * 
     */
    remotePopupCSS(url, css, props)
    {
        const d = this.remotePopup(url, props);
        if (css != null) 
            setTimeout( () => {
                div.className = css;
            }, 900); 
    }



    /**
     * Show a cross at a given map position. 
     * @param {ol.Coordinate} geoPos - LatLong position of where to put upper left corner of popup.
     */
    showImageGeo(geoPos) {
        setTimeout( () => {
            this.geoPos = geoPos;
            var pixPos = this.mb.map.getPixelFromCoordinate
                (ol.proj.fromLonLat(geoPos, this.mb.view.getProjection()));
            this.popup_(null, pixPos[0], pixPos[1], true);
        }, 900);
    }



    /**
     * Change the position of a popup or image. 
     * @param {ol.Coordinate} geoPos - LatLong position of upper left corner of popup.
     */
    setPositionGeo(geoPos) {
        if (this.activepopup && this.activepopup != null) {
            var pixPos = this.mb.map.getPixelFromCoordinate
                (ol.proj.fromLonLat(geoPos, this.mb.view.getProjection()));
            this.setPosition_(pixPos[0], pixPos[1]);
        }
    }



    /**
     * Change the position of a popup or image. Pixel position on screen. 
     * @param {ol.Coordinate} pixPos - Pixel position of upper left corner of popup.
     */
    setPositionPix(pixPos) {
        if (this.activepopup && this.activepopup != null)
            this.setPosition_(pixPos[0], pixPos[1]);
    }



    /**
     * Set the position of a popup or image. Pixel position on screen. 
     * @private
     */

    setPosition_(x, y)
    {   
        let xoff=0;
        let yoff=0;
        let xoffs = false, yoffs = false;
        
        if (this.image != null) {
            this.image.style.left= -9+'px';
            this.image.style.top= -9+'px';
        } 
        else {
           if (x<0) x=0;
           if (y<0) y=0;
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
                this.image.style.top =(yoff-9)+'px';
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
    popup_(elem, x, y, img)
    {
        if (this.allowedPopups <= 0)
            return;
     
        if (elem == null) 
            elem = document.createElement('div');
     
        this.psubdiv = this.activepopup = elem;  
        if (img != null && img) {
            this.image = document.createElement('img');
            this.activepopup.appendChild(this.image);
            this.image.src='images/cross.png';
            this.image.style.position='absolute';
            this.image.className="marker";
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
        if (this.onDiv.clientWidth < 500 && elem.clientWidth > this.onDiv.clientWidth)
            this.activepopup.style.minWidth = this.onDiv.clientWidth+'px'; 
     
        /* Is the height of the content more than the available height?
         * Then we need a scroller 
         */
        if (elem.clientHeight+10 > this.onDiv.clientHeight) {
            this.activepopup.style.maxHeight = this.onDiv.clientHeight-5 + "px";
            elem.id = 'wrapper'; // FIXME?
            this.activepopup.style.overflowY  = 'scroll';
        }
        else
            this.activepopup.style.overflowY = 'visible';
     
        this.setPosition_(x, y);
     
        this.allowedPopups--;
        if (this.onCallback != null)
            this.onCallback(); 
    }

} /* class */
