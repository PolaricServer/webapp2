 /*
    Map browser based on OpenLayers 5. 
    Control that shows mouse position (latlong, UTM, maidenhad) and scale. 
    
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
 

/**
 * Keep track of mouse positions in terms of geographical coordinates. 
 * Subclass of ol.control.Control
 */

pol.core.MousePos = class extends ol.control.Control {
    
    constructor(opt_options) {
        const options = opt_options || {};
        const elem = document.createElement('div');
        const scale = document.createElement('div');
        const utm = document.createElement('div');
        const latlng = document.createElement('div');
        const maidenhd = document.createElement('div');
       
        elem.className = 'mousepos ol-unselectable ol-control';
        utm.className = 'mouse_utm';
        scale.className = 'scale';
        latlng.className = 'mouse_latlong';
        maidenhd.className = 'mouse_maidenhead';
        
        elem.appendChild(scale);
        elem.appendChild(utm);
        elem.appendChild(latlng)
        elem.appendChild(maidenhd);

        super({
            element: elem,
            target: options.target
        });
    
        this.latlong = latlng;
        this.scale = scale;
        this.maidenhead = maidenhd;
        this.utm = utm;
        this.lastMouseMovePixel_ = null;
    } /* constructor */


    
    /**
     * Set map object. Called from superclass. 
     */
    setMap(map) {
        super.setMap(map);
        const t = this;
        if (map) {
            const viewport = map.getViewport();
            viewport.addEventListener("mousemove", onMouseMove); 
            viewport.addEventListener("mouseout", onMouseOut);
            map.on('moveend', onMapMove);
            t.updatePos(null);
        }
  
        /* Handler for mouse move */
        function onMouseMove(e) {
            const pp = t.getMap().getEventPixel(e);
            t.updatePos(pp);
        }
  
        /* Handler for mouse outside of map view */
        function onMouseOut(e) {
            t.updatePos(null);
        }
  
        /* Hack to find the actual screen resolution in dots per inch */
        function dotsPerInch() {
            const div = document.createElement("div");
            div.style.width="1in";
            const body = document.getElementsByTagName("body")[0];
            body.appendChild(div);
            const ppi = document.defaultView.getComputedStyle(div, null).getPropertyValue('width');
            body.removeChild(div); 
            return parseFloat(ppi);
        }
  
        /* Handler for change of map zoom-level. Compute scale and show it */
        function onMapMove(e) {
            let scale = CONFIG.mb.getScale(); 

            if (scale >= 1000)
                scale = Math.round(scale / 100) * 100;
            if (scale >= 10000)
                scale = Math.round(scale / 1000) * 1000;
            if (scale >= 100000)
                scale = Math.round(scale / 10000) * 10000;
            else
                scale = Math.round(scale);
   
            if (scale >= 1000000) {
                scale = Math.round(scale / 100000) * 100000; 
                scale = scale / 1000000;
                scale = scale + " Million";
            }
            else if (scale >= 10000)
                scale = (Math.round(scale/1000) + " 000");
      
            t.scale.innerHTML = '<span>Scale 1 : ' + scale + '</span>';
        }
    } /* setMap */



    /**
     * Show position in UTM format, latlong format and as maidenhead locator.
     */
    updatePos(x) {
        if (x==null) {
            this.utm.innerHTML = "<span>(utm pos)</span>";
            this.latlong.innerHTML = "<span>(latlong pos)</span>";
            this.maidenhead.innerHTML = "<span>(locator)</span>";
        }
        else {
            const map = this.getMap();
            let c = map.getCoordinateFromPixel(x);
            if (c == null) 
                c = [0,0];
            const coord = ol.proj.toLonLat(c, map.getView().getProjection());    
            this.latlong.innerHTML = '<span>'+pol.mapref.formatDM(coord)+'</span>';
            this.utm.innerHTML = '<span>'+pol.mapref.formatUTM(coord)+'</span>'; 
            this.maidenhead.innerHTML = '<span>'+pol.mapref.formatMaidenhead(coord);
        }
    }

} /* class */
