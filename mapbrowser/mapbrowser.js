 /*
    Map browser based on OpenLayers 5. 
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
  * Map browser class. Creates a map browser in the given div element. 
  */
 
 /* Constructor
  * @param {Element|string} targ - target DOM element or id of element
  * @param {pol.core.Config} config - Configuration class instance
  */

pol.core.MapBrowser = class {
     
   /* 
    * Constructor.
    * @param {Element|string} targ - target DOM element or id of element
    * @param {pol.core.Config} config - Configuration class instance
    */
    constructor(targ, config) {
        console.assert(targ && targ != null && config && config != null, "targ="+targ+", config="+config);
     
        const t = this;
        config.mb = this;
        t.config = config; 
        t.toolbar = new pol.core.Toolbar({}, t);
        t.attribution = new ol.control.Attribution({collapsed: false}); 
        t.permaLink = false; 
        
        let counter = t.config.get("_counter_", 0);
        if (counter<=0 || counter > 500) {
            console.log("Clear local storage");
            t.config.clear(); 
            counter = 0;
        }
        counter++;
        t.config.store("_counter_", counter);
        
        
        
        /* Get info about resolution, center of map, etc. from local storage */
        var resolution = t.config.get('core.resolution');
        var center = t.config.get('core.center');
        var rotation = 0;       
        t.config.set('core.baselayer', 0);
        t.baseLayerIdx = t.config.get('core.baselayer');
        
        if (window.location.hash !== '') {
            // try to restore center, zoom-level and rotation from the URL
            var hash = window.location.hash.replace('#map=', '');
            var parts = hash.split('/');
            if (parts.length === 5) {
                t.permaLink = true;
                resolution = parseFloat(parts[0]);
                center = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                ];
                rotation = parseFloat(parts[3]);
                t.baseLayerIdx = parseInt(parts[4], 10);
                console.log("resolution="+resolution);
            }
        }
        
        /* OpenLayers view */
        const proj = t.config.get('core.projection');
        
        console.log("PROJ=", proj);
        
        t.view = new ol.View({   
            projection: proj,                         
            center: ol.proj.fromLonLat(center, proj), 
            zoom: 2
        });

        
        /* Workaround issue with OL */
        if (proj=='EPSG:900913') {
            setTimeout(()=>
                t.view.setCenter(ol.proj.fromLonLat(center, proj)), 50);
            setTimeout(()=>
                t.view.setCenter(ol.proj.fromLonLat(center, proj)), 400);
        }
        
        /* Mouse position indicator */
        t.mousepos = new pol.core.MousePos({}),
        
        /* OpenLayers map */
        t.map = new ol.Map({
            target: targ,
            loadTilesWhileInteracting: true,
            loadTilesWhileAnimating: true,
            controls: [
                new ol.control.ScaleLine({}),
                t.mousepos,
                new ol.control.Zoom({}),
                t.toolbar,
                t.attribution
            ],
            view: t.view
        });

        t.prevGda = 1;
        t.featureInfo = new pol.core.FeatureInfo(this);
        
        // Set up layers, initial scale, etc..
        t.initializeLayers(config);
        t.xLayers = [];
        t.setResolution(resolution);
        
        // Popup windows and context menus */
        t.gui = new pol.core.Popup(t);
        t.ctxMenu = new pol.core.ContextMenu(t.gui);
        t.toolbar.setDefaultItems();
        
        /* Screen pixels per meter */
        t.dpm = dotsPerInch()*39.37;
    
        t.shouldUpdate = true; 
   
        window.addEventListener('popstate', event => {
            if (event.state === null)
                return;
            map.getView().setCenter(ol.proj.fromLonLat
                (event.state.center, t.config.get('core.projection')));
            map.getView().setResolution(event.state.resolution);
            map.getView().setRotation(event.state.rotation);
            shouldUpdate = false;
        });
        
        /* Set up handler for move and zoom. Store new center and scale */
        t.map.on('moveend', onMove);
        t.map.on('moveend', ()=> t.updatePermalink() );
        
        function onMove() {
            t.config.store("core.projection", t.view.getProjection().getCode());
            t.config.store('core.center', 
                ol.proj.toLonLat(t.view.getCenter(), t.view.getProjection())); 
            t.config.store('core.resolution', t.view.getResolution());
        }
      
     
        /* Hack to find the actual screen resolution in dots per inch */
        function dotsPerInch() {
            var div = document.createElement("div");
            div.style.width="1in";
            var body = document.getElementsByTagName("body")[0];
            body.appendChild(div);
            var ppi = document.defaultView.getComputedStyle(div, null).getPropertyValue('width');
            body.removeChild(div); 
            return parseFloat(ppi);
        }
    } /* constructor */

    
    
    reset() {
        t.storage.clear(); 
    }

    /** 
     * Turn permalink mode on/off (the browser url automatically reflects 
     * zoom level, map-selection etc.).
     */
    setPermalink(on) {  
        this.permaLink = on; 
        if (!on) {
            window.location.hash = '';
            var href = window.location.href;
            if (href[href.length-1] == '#')
                window.location.href = href.substr(0, href.length-1);
        }
        else
            this.updatePermalink();
    }
 
 
    getPermalink()
        { return this.permaLink; }
      
       
    /** 
     * Update permalink url. 
     */
    updatePermalink() {
        if (!this.permaLink)
            return;
        if (!this.shouldUpdate) {
            this.shouldUpdate = true;
            return;
        }

        var center =  ol.proj.toLonLat(this.view.getCenter(), this.view.getProjection());
        var hash = '#map=' +
            Math.round(this.view.getResolution() *1000/1000) + '/' +
            Math.round(center[0] * 1000) / 1000 + '/' +
            Math.round(center[1] * 1000) / 1000 + '/' +
            this.view.getRotation() + '/' +
            this.baseLayerIdx;
        var state = {
            resolution: this.view.getResolution(),
            center: center,
            rotation: this.view.getRotation(),
            baselayer: this.baseLayerIdx
        };
        window.history.pushState(state, 'map', hash);
    }
 
 
 
    addContextMenu(name, func) {
        this.ctxMenu.addMenuId("map", name, false, func);
    }
 
 
 
    /**
     * Get base layer
     * @returns The current base layer. 
     */
    getBaseLayer() {
        return this.config.baseLayers[this.baseLayerIdx]; 
    }



    /**
     * Get Long Lat coordinate from pixel position.
     * @param {ol.Pixel} x - pixel position
     */
    pix2LonLat(x) {
        return ol.proj.toLonLat(this.map.getCoordinateFromPixel(x), 
            this.map.getView().getProjection()); 
    }
       
    
    
    /**
     * Get pixel position from Long Lat coordinate.
     * @param {LonLat} x - Long Lat position
     */
    lonLat2Pix(x) {
        return this.map.getPixelFromCoordinate(
            ol.proj.fromLonLat(x, this.map.getView().getProjection()));
    }
    
 
 
    /**
     * Select base layer. 
     * @param {number} idx - index of base layer to select. 
     * 
     */
    changeBaseLayer(idx) {
        console.assert(idx >= 0 && idx <= this.config.baseLayers.length, "idx="+idx);
        const ls = this.config.baseLayers[idx];
        if ( !ls || ls==null)
            return;

        if (this.map.getLayers().getLength() == 0)
            this.map.addLayer(ls);
        else
            this.map.getLayers().setAt(0, ls);
    
        /* Change projection if requested */
        let proj = ls.projection; 
        if (!proj)
            proj = this.config.get('core.projection');
        if (!proj)
            proj = this.view.getProjection();
        if (proj != this.view.getProjection())
            this.changeView(proj)
        
        this.config.store('core.baselayer', this.baseLayerIdx = idx);
    }
 
 
 
 
    /**
    * Add the layers from the config to the OpenLayers map. 
    * @param {pol.core.Config} config - instance of Config class.
    * 
    */
    initializeLayers(config) {
        this.map.getLayers().clear();
  
        /* Base layer */
        this.changeBaseLayer(this.baseLayerIdx);
  
        /* Overlay layers */
        if (config.oLayers.length > 0) 
            for (var i=0; i < config.oLayers.length; i++) {
                const layer = config.oLayers[i]
                this.featureInfo.registerRecursive(layer);
                this.map.addLayer(layer);
            }
    };



    addLayer(layer) {
        this.map.addLayer(layer);
        this.xLayers.push(layer);
    }


    
    removeLayer(layer) {
        this.map.removeLayer(layer);
        for(var i in this.xLayers) {
            if(this.xLayers[i] === layer) 
                this.xLayers.splice(i, 1);
        }
    }


    addVectorLayer(style) {
        const source = new ol.source.Vector({wrapX: false});
        const vector = new ol.layer.Vector({
            source: source,
            style: style
        });
        this.addLayer(vector);
        return vector; 
    }



    addConfiguredLayer(layer, name, v) {
        console.assert(layer != null && name != null, "layer="+layer+", name="+name);
        const i = this.config.addLayer(layer, name);
        let visible = this.config.get('core.olayer.'+name)
         
        if (visible == null) {
            visible = false; 
            if (v)
                visible = v;
            this.config.store('core.olayer.' + name, visible);
        }
        this.config.oLayers[i].setVisible(visible);
   
        /* Remove extra layers to keep the order */
        for (var j in this.xLayers)
            this.map.removeLayer(this.xLayers[j]);
  
        /* Add configured layer */
        this.featureInfo.registerRecursive(layer);
        this.map.addLayer(layer);
   
        /* And put the extra layers back on top of the stack */
        for (const j in this.xLayers)
            this.map.addLayer(this.xLayers[j]);
    }



    removeConfiguredLayer(layer) {
        console.assert(layer != null, "layer=null");
        if (layer==null)
            return;
        this.featureInfo.unregister(layer);
        this.map.removeLayer(layer);   
        this.config.removeLayer(layer);
    }

    

    /**
     * Center the map around given coordinates [longitude, latitude]. 
     * @param {ol.Coordinate} center - Coordinate where map is to be centered (in latlong projection).
     * @param {number|undefined} threshold - minimum move in pixels. 
     * 
     */
    setCenter(center, threshold) {
        if (threshold) {
            const p1 = this.lonLat2Pix(this.getCenter());
            const p2 = this.lonLat2Pix(center);
            if (Math.abs(p1[0] - p2[0]) < threshold &&
                Math.abs(p1[1] - p2[1]) < threshold)
                return;
        }   
        this.view.setCenter(
            ol.proj.fromLonLat(center, this.view.getProjection())
        ); 
        this.mousepos.updatePosGeo(center); 
    };


    /**
     * Get coordinates [longitude, latitude] of center of current map view. 
     * @returns position
     */
    getCenter() {
        return ol.proj.toLonLat(this.view.getCenter(), this.view.getProjection());
    };


    /**
     * Get UTM reference of center of current map view. 
     * @returns position
     */
    getCenterUTM() {    
        const center = this.getCenter();
        const cref = new LatLng(center[1], center[0]);
        return cref.toUTMRef(); 
    }


    /**
     * Return the geographical extent of the map shown on screen. 
     * In some cases it is better to use the limits at the center when transforming between projections. 
     */
    getExtent() {
        const proj = this.view.getProjection();
        const center = this.view.getCenter();
        const ext = this.view.calculateExtent();
        const midTop  =  [center[0], ext[3]];
        const midBot  =  [center[0], ext[1]];
        const midLeft =  [ext[0], center[1]];
        const midRight = [ext[2], center[1]];
    
        const xmTop  = ol.proj.transform(midTop, proj, "EPSG:4326");
        const xmBot  = ol.proj.transform(midBot, proj, "EPSG:4326");
        const xmLeft = ol.proj.transform(midLeft, proj, "EPSG:4326");
        const xmRight = ol.proj.transform(midRight, proj, "EPSG:4326");
    
        return [xmLeft[0], xmBot[1], xmRight[0], xmTop[1]];
    }



    /**
     * Zoom and center map to fit the given extent.  
     * @param {ol.Extent} extent - Extent (in latlong projection)
     */
    fitExtent(extent) {
        this.view.fit(
            ol.proj.transformExtent(extent, "EPSG:4326", this.view.getProjection()),
            {size: this.map.getSize(), nearest: true}
        );
    }
    

    /** 
     * Zoom and move map to extent 
     * @param {Object} a object with extent, baseLayer and oLayers (overlays) attributes 
     */
    gotoExtent(a) {
        const t = this;
        let bl = a.baseLayer;
        let idx = 0;
        if (typeof bl == "string")
            idx = getIndex(bl); 
        else
            idx = bl;
    
        if (!isNaN(idx)) 
            this.changeBaseLayer(idx);
        
        setOLayers(a.oLayers);
        if (a.extent && a.extent != null) 
            this.fitExtent(a.extent); 
    
       
        function getIndex(x) {
            const lrs = CONFIG.baseLayers;
            for (i in lrs) 
                if (x == lrs[i].get("name"))
                    return i;
            return 0;
        }
        
        
        function setOLayers(ol) {
            if (ol && ol != null)
                for (const i in CONFIG.oLayers)
                    CONFIG.oLayers[i].setVisible( ol[CONFIG.oLayers[i].get("name")] );
        }
        
    }
    
    
    
    /**
     * Set/get the resolution of the map. 
     */
    getResolution() {
       return this.view.getResolution(); 
       // this.config.get('core.resolution');
    };
    
    
    
    setResolution(res) {
       this.view.setResolution(res); 
    };
    
    
    /**
     * Get scale of the map (center of map) as it is displayed on the screen.  
     */
    getScale() {
       const res = this.view.getResolution();
       const center = this.view.getCenter();
       const mpu = this.view.getProjection().getMetersPerUnit();
       
       return ol.proj.getPointResolution(
             this.view.getProjection(), res, center) * mpu * this.dpm;
    }
    
    getScaleRounded() {
        let scale = this.getScale(); 
        if (scale >= 1000)
            scale = Math.round(scale / 100) * 100;
        if (scale >= 10000)
            scale = Math.round(scale / 1000) * 1000;
        if (scale >= 100000)
            scale = Math.round(scale / 10000) * 10000;
        else
            scale = Math.round(scale);
        return scale; 
    }
    
    
    
    getProjection() {
        return this.view.getProjection().getCode(); 
    }
    
    


    /**
     * Return a geodetic adjustment for the current view 
     * 
     */
    geodeticAdjustment() {
        if (/EPSG:(900913|3857|4326)/.test(this.view.getProjection().getCode()) 
              && this.view.getCenter() != null) { 
           const center = ol.proj.toLonLat(this.view.getCenter(), this.view.getProjection()); 
           return Math.cos(center[1]/180*Math.PI ); 
        }
        else
           return 1;
    };
    
    
    
    /**
     * Refresh vector layers (used when projection/view is changed. 
     */
    refreshLayers() {
        checkLayers(this.map.getLayers());
	
        function checkLayers(layers) {	
            layers.forEach( (x)=> {
                if (x instanceof ol.layer.Vector) {
                    var s = x.getSource();
                    s.clear();
                    s.refresh();
                    // FIXME: How to reset URL in remote sources? 
                }
                else if (x instanceof ol.layer.Group) 
                checkLayers(x.getLayers());
            });
        }
    }
       
    
    
    /**
     * Change the projection of the map view.
     * @param {ol.ProjectionLike} proj - New projection
     * 
     */
    changeView(proj) {
    
        /* Do nothing if no change of projection? */
        if (proj == this.view.getProjection())
           return; 
        
        const prev = this.view; 
        this.view = new ol.View({
           projection: proj,
           center: ol.proj.transform(this.view.getCenter(), this.view.getProjection(), proj),
           resolution: this.view.getResolution()
        });
        
        /* If the projection is sperical mercator, we do a geodetic adjustment 
         * of the scale. It may be necessary to zoom the map accordingly, if 
         * switching to/from a spherical mercator projection.
         */
        const gda = this.geodeticAdjustment(); 
        
        if (gda < 1 && this.prevGda == 1) 
           this.view.setResolution(this.view.getResolution()/gda);
        else if (this.prevGda < 1 && gda == 1) 
           this.view.setResolution(this.view.getResolution()*this.prevGda);
    
        this.prevProj = this.view.getProjection();
        this.prevGda = gda;
        this.map.setView(this.view);
        this.refreshLayers();
        this.view.changed();
    }
    
    
       
    /**
     * Show map reference on map. 
     * @param {ol.Coordinate} coord - position to be shown (in latlong projection).
     */
    show_Mapref(coord) {
        let h = '<div class="field"><span class="sleftlab">UTM:</span>' + pol.mapref.formatUTM(coord) +'</div>' +
                  '<div class="field"><span class="sleftlab">Latlong:</span>' + pol.mapref.formatDM(coord) +'</div>'  + 
                  '<div class="field"><span class="sleftlab">Loc:</span>' + pol.mapref.formatMaidenhead(coord)+"</div>"; 
        this.gui.removePopup();       
        this.gui.showPopup( 
            {html: h, geoPos: coord, image: true} );
    }




    /**
     * Show map reference on pixel position on map. 
     * @param {ol.Pixel} pix - pixel on current map view where position is. 
     */
    show_MaprefPix(pix)
       { this.show_Mapref(this.pix2LonLat(pix)); }
    
    
    
    /**
     * Go to and mark a given position on map. 
     * @param {ol.Coordinate} ref - position to be shown (in latlong projection).
     * @param {boolean|undefined} showinfo - true if we should show map reference info in a popup as well.
     */
    goto_Pos(ref, showinfo) {
        if (ref[0]<=0 && ref[1]<=0)
            return;
        this.setCenter(ref);
        setTimeout( ()=> {
            if (showinfo)
                this.show_Mapref(ref);
            else
                this.gui.showImageGeo(ref);
        }, 200);
    }

} /* class */






