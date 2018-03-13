 /*
    Map browser based on OpenLayers 4. 
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
  * Map browser class. Creates a map browser in the given div element. 
  * 
  * @constructor
  * @param {Element|string} targ - target DOM element or id of element
  * @param {pol.core.Config} config - Configuration class instance
  */
 
 pol.core.MapBrowser = function(targ, config) 
 {
     console.assert(targ && targ != null && config && config != null, "Assertion failed");
     
     var t = this;
     config.mb = this;
     t.config = config; 
     t.toolbar = new pol.core.Toolbar({}, t);
     
     t.view = new ol.View({   
          projection: t.config.get('core.projection'),                         
          center: ol.proj.fromLonLat(t.config.get('core.center'), t.config.get('core.projection')), 
          zoom: 2
        });
  
     t.map = new ol.Map({
        target: targ,
        loadTilesWhileInteracting: true,
        loadTilesWhileAnimating: true,
        controls: [
            new ol.control.ScaleLine({}),
            new pol.core.MousePos({}),
            t.toolbar
        ],
        view: t.view
     });

     t.prevGda = 1;
     t.config.set('core.baselayer', 0);
     t.baseLayerIdx = t.config.get('core.baselayer');
     
     // Set up layers, initial scale, etc..
     t.initializeLayers(config);
     t.setResolution(t.config.get('core.resolution'));
     t.xLayers = [];
     
     // Popup windows and context menus */
     t.gui = new pol.core.Popup(t);
     t.ctxMenu = new pol.core.ContextMenu(t.gui);
     t.toolbar.setDefaultItems();
   
     
     /* Set up handler for move and zoom. Store new center and scale */
     t.map.on('moveend', onMove);
   
     /* Screen pixels per meter */
     t.dpm = dotsPerInch()*39.37;
     
     function onMove() {
         t.config.store('core.center', 
            ol.proj.toLonLat(t.view.getCenter(), t.view.getProjection()), true); 
    	 t.config.store('core.resolution', t.view.getResolution(), true);
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
 }

 
 
pol.core.MapBrowser.prototype.addContextMenu = function(name, func) {
   this.ctxMenu.addMenuId("map", "MAP", false, func);
}
 
 
 
 
/**
 * Get base layer
 * @returns The current base layer. 
 */
pol.core.MapBrowser.prototype.getBaseLayer = function() {
    return this.config.baseLayers[this.baseLayerIdx]; 
}



/**
 * Get Long Lat coordinate from pixel.
 * @param {ol.Pixel} x - pixel position
 */
pol.core.MapBrowser.prototype.pix2LonLat = function(x)
   { return ol.proj.toLonLat(this.map.getCoordinateFromPixel(x), 
           this.map.getView().getProjection()); }
   
   
 
/**
 * Select base layer. 
 * @param {number} idx - index of base layer to select. 
 * 
 */
 pol.core.MapBrowser.prototype.changeBaseLayer = function(idx) {
    console.assert(idx >= 0 && idx <= this.config.baseLayers.length, "Assertion failed");
    
    var ls = this.config.baseLayers[idx];
    if ( !ls || ls==null)
        return;

    if (this.map.getLayers().getLength() == 0)
       this.map.addLayer(ls);
    else
       this.map.getLayers().setAt(0, ls);
    
    /* Change projection if requested */
    var proj = ls.projection; 
    if (!proj)
        proj = this.config.get('core.projection');
    if (!proj)
        proj = this.view.getProjection();
    if (proj != this.view.getProjection())
        this.changeView(proj)
        
    this.config.store('core.baselayer', this.baseLayerIdx = idx, true);
 }
 
 
 
 
/**
 * Add the layers from the config to the OpenLayers map. 
 * @param {pol.core.Config} config - instance of Config class.
 * 
 */

pol.core.MapBrowser.prototype.initializeLayers = function(config) {
  
  this.map.getLayers().clear();
  
  /* Base layer */
  this.changeBaseLayer(this.baseLayerIdx);
  
  /* Overlay layers */
  if (config.oLayers.length > 0) 
    for (var i=0; i < config.oLayers.length; i++) 
        this.map.addLayer(config.oLayers[i]);
   
};



pol.core.MapBrowser.prototype.addLayer = function(layer) {
   this.map.addLayer(layer);
   this.xLayers.push(layer);
}


pol.core.MapBrowser.prototype.removeLayer = function(layer) {
   this.map.removeLayer(layer);
   for(var i in this.xLayers) {
      if(this.xLayers[i] === layer) 
         this.xLayers.splice(i, 1);
   }
}



pol.core.MapBrowser.prototype.addVectorLayer = function(style) {
   var source = new ol.source.Vector({wrapX: false});
   var vector = new ol.layer.Vector({
       source: source,
       style: style
    });
   this.addLayer(vector);
   return vector; 
}



pol.core.MapBrowser.prototype.addConfiguredLayer = function(layer, name) {
   console.assert(layer != null && name != null, "Assertion failed");
   var i = this.config.addLayer(layer, name);
   var visible = this.config.get('core.olayer.'+i);
   if (visible == null)
      this.config.store('core.olayer.' + i, true); 
   else
      this.config.oLayers[i].setVisible(visible);
   
   /* Remove extra layers to keep the order */
   for (var i in this.xLayers)
     this.map.removeLayer(this.xLayers[i]);
  
   /* Add configured layer */
   this.map.addLayer(layer);
   
   /* And put the extra layers back on top of the stack */
   for (var i in this.xLayers)
     this.map.addLayer(this.xLayers[i]);
}



pol.core.MapBrowser.prototype.removeConfiguredLayer = function(layer) {
   console.assert(layer != null, "Assertion failed");
   this.map.removeLayer(layer);   
   this.config.removeLayer(layer);
}



/**
 * Center the map around given coordinates [longitude, latitude]. 
 * @param {ol.Coordinate} center - Coordinate where map is to be centered (in latlong projection).
 * 
 */
pol.core.MapBrowser.prototype.setCenter = function(center) {
   this.view.setCenter(
      ol.proj.fromLonLat(center, this.view.getProjection())
   ); 
};


/**
 * Get coordinates [longitude, latitude] of center of current map view. 
 * @returns position
 */
pol.core.MapBrowser.prototype.getCenter = function() {
   return ol.proj.toLonLat(this.view.getCenter(), this.view.getProjection());
};


/**
 * Get UTM reference of center of current map view. 
 * @returns position
 */
pol.core.MapBrowser.prototype.getCenterUTM = function() {    
    var center = browser.getCenter();
    var cref = new LatLng(center[1], center[0]);
    return cref.toUTMRef(); 
}


/**
 * Return the geographical extent of the map shown on screen. 
 * In some cases it is better to use the limits at the center when transforming between projections. 
 */
pol.core.MapBrowser.prototype.getExtent = function() {
    var proj = this.view.getProjection();
    var center = this.view.getCenter();
    var ext = this.view.calculateExtent();
    var midTop  =  [center[0], ext[3]];
    var midBot  =  [center[0], ext[1]];
    var midLeft =  [ext[0], center[1]];
    var midRight = [ext[2], center[1]];
    
    xmTop  = ol.proj.transform(midTop, proj, "EPSG:4326");
    xmBot  = ol.proj.transform(midBot, proj, "EPSG:4326");
    xmLeft = ol.proj.transform(midLeft, proj, "EPSG:4326");
    xmRight = ol.proj.transform(midRight, proj, "EPSG:4326");
    
    return [xmLeft[0], xmBot[1], xmRight[0], xmTop[1]];
}



/**
 * Zoom and center map to fit the given extent.  
 * @param {ol.Extent} extent - Extent (in latlong projection)
 */
pol.core.MapBrowser.prototype.fitExtent = function(extent) {
    this.view.fit(
        ol.proj.transformExtent(extent, "EPSG:4326", this.view.getProjection()),
        {size: this.map.getSize(), nearest: true}
    );
}


/** 
 * Zoom and move map to extent 
 * @param {Object} a object with extent, baseLayer and oLayers (overlays) attributes 
 */
pol.core.MapBrowser.prototype.gotoExtent = function(a) {
    if (!isNaN(a.baseLayer))
        this.changeBaseLayer(a.baseLayer);
    setOLayers(a.oLayers);
    console.log("extent="+a.extent);
    if (a.extent && a.extent != null) 
        this.fitExtent(a.extent); 
    
       
    function setOLayers(ol) {
        if (ol && ol != null)
            for (i in ol)
                if (CONFIG.oLayers[i])
                    CONFIG.oLayers[i].setVisible(ol[i]);
    }
}



/**
 * Set/get the resolution of the map. 
 * 
 */
pol.core.MapBrowser.prototype.getResolution = function() {
   return this.config.get('core.resolution');
};



pol.core.MapBrowser.prototype.setResolution = function(res) {
   this.view.setResolution(res); 
};


/**
 * Get scale of the map (center of map) as it is displayed on the screen.  
 */
pol.core.MapBrowser.prototype.getScale = function() {
   var res = this.view.getResolution();
   var center = this.view.getCenter();
   var mpu = this.view.getProjection().getMetersPerUnit();
   
   return ol.proj.getPointResolution(
         this.view.getProjection(), res, center) * mpu * this.dpm;
}



pol.core.MapBrowser.prototype.getProjection = function() {
    return this.view.getProjection().getCode(); 
}




/**
 * Return a geodetic adjustment for the current view 
 * 
 */
pol.core.MapBrowser.prototype.geodeticAdjustment = function() {
    if (/EPSG:(900913|3857|4326)/.test(this.view.getProjection().getCode()) && this.view.getCenter() != null) { 
       var center = ol.proj.toLonLat(this.view.getCenter(), this.view.getProjection()); 
       return Math.cos(center[1]/180*Math.PI ); 
    }
    else
       return 1;
};




/**
 * Change the projection of the map view.
 * @param {ol.ProjectionLike} proj - New projection
 * 
 */
pol.core.MapBrowser.prototype.changeView = function(proj) {
    
    /* Do nothing if no change of projection? */
    if (proj == this.view.getProjection())
       return; 
    
    var prev = this.view; 
    this.view = new ol.View({
       projection: proj,
       center: ol.proj.transform(this.view.getCenter(), this.view.getProjection(), proj),
       resolution: this.view.getResolution()
    });
    
    /* If the projection is sperical mercator, we do a geodetic adjustment 
     * of the scale. It may be necessary to zoom the map accordingly, if 
     * switching to/from a spherical mercator projection.
     */
    var gda = this.geodeticAdjustment(); 
    
    if (gda < 1 && this.prevGda == 1) 
       this.view.setResolution(this.view.getResolution()/gda);
    else if (this.prevGda < 1 && gda == 1) 
       this.view.setResolution(this.view.getResolution()*this.prevGda);

    this.prevProj = this.view.getProjection();
    this.prevGda = gda;
   
    this.map.setView(this.view);
    this.view.changed();
}


   
/**
 * Show map reference on map. 
 * @param {ol.Coordinate} coord - position to be shown (in latlong projection).
 */
pol.core.MapBrowser.prototype.show_Mapref = function(coord) 
{
     var h = '<span class="sleftlab">UTM:</span>' + pol.mapref.formatUTM(coord) +'<br>' +
             '<nobr><span class="sleftlab">Latlong:</span>' + pol.mapref.formatDM(coord) +'<br>'  + 
             '</nobr><span class="sleftlab">Loc:</span>' + pol.mapref.formatMaidenhead(coord);    
     this.gui.removePopup();       
     this.gui.showPopup( 
        {html: h, geoPos: coord, image: true} );
}




/**
 * Show map reference on pixel position on map. 
 * @param {ol.Pixel} pix - pixel on current map view where position is. 
 */
pol.core.MapBrowser.prototype.show_MaprefPix = function(pix)
   { this.show_Mapref(browser.pix2LonLat(pix)); }



/**
 * Go to and mark a given position on map. 
 * @param {ol.Coordinate} ref - position to be shown (in latlong projection).
 * @param {boolean|undefined} showinfo - true if we should show map reference info in a popup as well.
 */
pol.core.MapBrowser.prototype.goto_Pos = function(ref, showinfo) 
{
   this.setCenter(ref);
   if (showinfo)
      this.show_Mapref(ref);
   else
      this.gui.showImageGeo(ref);
}







