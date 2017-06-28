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
  * @param {polaric.Config} config - Configuration class instance
  */
 
 polaric.MapBrowser = function(targ, config) 
 {
     console.assert(targ && targ != null && config && config != null, "Assertion failed");
     
     var t = this;
     config.mb = this;
     t.config = config; 
     t.toolbar = new polaric.Toolbar({}, t);
     
     t.view = new ol.View({   
          projection: t.config.get('projection'),                         
          center: ol.proj.fromLonLat(t.config.get('center'), t.config.get('projection')), 
          zoom: 2
        });
  
     t.map = new ol.Map({
        target: targ,
        loadTilesWhileInteracting: true,
        loadTilesWhileAnimating: true,
        controls: [
            new ol.control.ScaleLine({}),
            new polaric.MousePos({}),
            t.toolbar
        ],
        view: t.view
     });

     t.prevGda = 1;
     t.config.set('baselayer', 0);
     t.baseLayerIdx = t.config.get('baselayer');
     
     // Set up layers, initial scale, etc..
     t.addLayers(config);
     t.setResolution(t.config.get('resolution'));
     
     // Popup windows and context menus */
     t.gui = new polaric.Popup(t);
     t.ctxMenu = new polaric.ContextMenu(t.gui);
     t.toolbar.setDefaultItems();
     t.ctxMenu.addMenuId("map", "MAP");
   
     /* Set up handler for move and zoom. Store new center and scale */
     t.map.on('moveend', onMove);
     
     function onMove() {
         t.config.store('center', 
            ol.proj.toLonLat(t.view.getCenter(), t.view.getProjection()), true); 
    	 t.config.store('resolution', t.view.getResolution(), true);
     }
     
 }

 
 
/**
 * Get base layer
 * @returns The current base layer. 
 */
polaric.MapBrowser.prototype.getBaseLayer = function() {
    return this.config.baseLayers[this.baseLayerIdx]; 
}



/**
 * Get Long Lat coordinate from pixel.
 * @param {ol.Pixel} x - pixel position
 */
polaric.MapBrowser.prototype.pix2LonLat = function(x)
   { return ol.proj.toLonLat(this.map.getCoordinateFromPixel(x), 
           this.map.getView().getProjection()); }
   
   
 
/**
 * Select base layer. 
 * @param {number} idx - index of base layer to select. 
 * 
 */
 polaric.MapBrowser.prototype.changeBaseLayer = function(idx) {
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
        proj = this.config.get('projection');
    if (!proj)
        proj = this.view.getProjection();
    if (proj != this.view.getProjection())
        this.changeView(proj)
        
    this.config.store('baselayer', this.baseLayerIdx = idx, true);
 }
 
 
 
 
/**
 * Add the layers from the config to the OpenLayers map. 
 * @param {polaric.Config} config - instance of Config class.
 * 
 */
// FIXME: Move this to constructor or make it private?  

polaric.MapBrowser.prototype.addLayers = function(config) {
  
  this.map.getLayers().clear();
  
  /* Base layer */
  this.changeBaseLayer(this.baseLayerIdx);
  
  /* Overlay layers */
  if (config.oLayers.length > 0) 
    for (var i=0; i < config.oLayers.length; i++) 
        this.map.addLayer(config.oLayers[i]);
};



/**
 * Center the map around given coordinates [longitude, latitude]. 
 * @param {ol.Coordinate} center - Coordinate where map is to be centered (in latlong projection).
 * 
 */
polaric.MapBrowser.prototype.setCenter = function(center) {
   this.view.setCenter(
      ol.proj.fromLonLat(center, this.view.getProjection())
   ); 
};


/**
 * Get coordinates [longitude, latitude] of center of current map view. 
 * @returns position
 */
polaric.MapBrowser.prototype.getCenter = function() {
   return ol.proj.toLonLat(this.view.getCenter(), this.view.getProjection());
};

polaric.MapBrowser.prototype.getCenterUTM = function() {    
    var center = browser.getCenter();
    var cref = new LatLng(center[1], center[0]);
    return cref.toUTMRef(); 
}


polaric.MapBrowser.prototype.getExtent = function() {
    return ol.proj.transformExtent(
        this.view.calculateExtent(), this.view.getProjection(), "EPSG:4326"); 
}


/**
 * Zoom and center map to fit the given extent.  
 * @param {ol.Extent} extent - Extent (in latlong projection)
 */
polaric.MapBrowser.prototype.fitExtent = function(extent) {
    this.view.fit(
        ol.proj.transformExtent(extent, "EPSG:4326", this.view.getProjection()),
        {size: this.map.getSize(), nearest: true}
    );
}



/**
 * Set/get the resolution of the map. 
 * 
 */
polaric.MapBrowser.prototype.getResolution = function() {
   this.config.get('resolution');
};

polaric.MapBrowser.prototype.setResolution = function(res) {
   this.view.setResolution(res); 
};



/**
 * Return a geodetic adjustment for the current view 
 * 
 */
polaric.MapBrowser.prototype.geodeticAdjustment = function() {
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
polaric.MapBrowser.prototype.changeView = function(proj) {
    
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
polaric.MapBrowser.prototype.show_Mapref = function(coord) 
{
     var h = '<span class="sleftlab">UTM:</span>' + polaric.formatUTM(coord) +'<br>' +
             '<nobr><span class="sleftlab">Latlong:</span>' + polaric.formatDM(coord) +'<br>'  + 
             '</nobr><span class="sleftlab">Loc:</span>' + polaric.formatMaidenhead(coord);    
     this.gui.removePopup();       
     this.gui.showPopup( 
        {html: h, geoPos: coord, image: true} );
}




/**
 * Show map reference on pixel position on map. 
 * @param {ol.Pixel} pix - pixel on current map view where position is. 
 */
polaric.MapBrowser.prototype.show_MaprefPix = function(pix)
   { this.show_Mapref(browser.pix2LonLat(pix)); }



/**
 * Go to and mark a given position on map. 
 * @param {ol.Coordinate} ref - position to be shown (in latlong projection).
 * @param {boolean|undefined} showinfo - true if we should show map reference info in a popup as well.
 */
polaric.MapBrowser.prototype.goto_Pos = function(ref, showinfo) 
{
   this.setCenter(ref);
   if (showinfo)
      this.show_Mapref(ref);
   else
      this.gui.showImageGeo(ref);
}







