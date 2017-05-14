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
  * Map browser class.
  * 
  * @constructor
  */
 
 polaric.MapBrowser = function(targ, config) 
 {
     var t = this;
     config.mb = this;
     t.config = config; 

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
            new polaric.Toolbar({})
        ],
        view: t.view
     });

     t.prevGda = 1;
     t.baseLayerIdx = t.config.get('baselayer', 0);
     
     // Set up layers, initial scale, etc..
     t.addLayers(config);
     t.setResolution(t.config.get('resolution'));
     
     // Set up map-areas
     // Set up controls, etc..
     
     // Popup windows and context menus */
     t.gui = new polaric.Popup(t);
     t.ctxMenu = new polaric.ContextMenu(t.gui);
     
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
 */

polaric.MapBrowser.prototype.getBaseLayer = function() {
    return this.config.baseLayers[this.baseLayerIdx]; 
}



/**
 * Get Long Lat coordinate from pixel
 */

polaric.MapBrowser.prototype.pix2LonLat = function(x)
   { return ol.proj.toLonLat(this.map.getCoordinateFromPixel(x), this.map.getView().getProjection()); }
   
   
 
/**
 * Select base layer
 * 
 */
 
 polaric.MapBrowser.prototype.changeBaseLayer = function(idx) {
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
 * Add the layers from the config to the OpenLayers map 
 * 
 */

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
 * 
 */

polaric.MapBrowser.prototype.setCenter = function(center) {
   this.view.setCenter(
      ol.proj.fromLonLat(center, this.view.getProjection())
   ); 
};


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
 * Change the projection of the map
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
