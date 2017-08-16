/*
 Map browser based on OpenLayers 4. Tracking. 
 Present tracking data from Polaric Server backend as a map-layer. 
 
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
 * Tracking layer.
 * @constructor
 */
 
polaric.Tracking = function(url) 
{
   var t = this; 
   t.producer = new polaric.MapUpdate(url);
   t.filter = "track";
   t.url = url;
   t.zIndex = 1000;
   var init = true;
   
   
   /* Set up vector layer and source */
   t.layer = CONFIG.mb.addVectorLayer(
       new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new ol.style.Stroke({
            color: '#d11',
            width: 2
          })
        }));
   
   t.source = this.layer.getSource();;     
   
   
   /* Called when (Web socket) connection to server is opened. */
   t.producer.onopen = function() {   
      CONFIG.mb.map.on('movestart', onMoveStart);
      CONFIG.mb.map.on('moveend', onMoveEnd);
      /* Subscribe to updates from server */
      t.producer.subscribe(t.filter, function(x) {t.update(x);} );
   }

   
   /* Called when move of map starts */
   function onMoveStart() {
      if (!init) {
         /* Clear the layer while moving */
         t.layer.setVisible(false);
         var ft = t.source.getFeatures()
         for (i in ft) 
            /* For some strange reason, removing feature directly doesn't work */
            t.removePoint(ft[i].getId());
      }
   }
   
   /* Called when move of map ends */
   function onMoveEnd() {
      if (init) 
          init = false;
      else {
          /* Re-subscribe */
          t.layer.setVisible(true);
          t.producer.subscribe(t.filter, function(x) {t.update(x);} );
      }
   }
   
}



/** 
 * Add a feature (tracking point) or update it if it is already there. 
 */

polaric.Tracking.prototype.addPoint = function(p) {
    var t = this;
    var c = ll2proj(p.pos);
    var feature = this.source.getFeatureById(p.ident);
    if (feature == null) {
       feature = new ol.Feature(new ol.geom.Point(c));
       feature.setId(p.ident);
       this.source.addFeature(feature);
    }
    /* If feature exists and redraw flag is false. Just return */
    else if (!p.redraw) 
        return;
    
    /* update position */
    feature.getGeometry().setCoordinates(c);
    
    /* Update style (icon) */
    var style = new ol.style.Style({
      image:
        new ol.style.Icon( ({
          anchor: [0.5, 0.5],
          src: t.url + "/" + p.icon
        }))
      });   
    feature.setStyle(style);


    /* Update label. Just replace it. */
    if (p.label != null) {
       if (feature.label) 
           CONFIG.mb.map.removeOverlay(feature.label);
       feature.label = createLabel(c, p);
    }
    else if (feature.label)
       CONFIG.mb.map.removeOverlay(feature.label);

   
    /** Create label using a OL overlay. */
    function createLabel(pos, p) {
       element = document.createElement('div');
       element.className = p.label.style;
       element.innerHTML = p.label.id;
       
       lbl = new ol.Overlay({
           element: element,
           offset: [14, 0],
           positioning: 'center-left'
       });
       lbl.setPosition(pos);
       CONFIG.mb.map.addOverlay(lbl);
       return lbl;
    }
    
} /* AddPoint */


 
polaric.Tracking.prototype.addTrail = function(p) {
    var t = this;
    var feature = this.source.getFeatureById(p.ident+'.trail');    
    /* If feature exists and redraw flag is false. Just return */
    if (feature != null && !p.redraw) 
        return;
    
    /* Just replace it with a new one */
    if (feature !=null) 
        this.source.removeFeature(feature);
    feature = new ol.Feature(new ol.geom.LineString([ll2proj(p.pos)]));
    feature.setId(p.ident+'.trail');
    this.source.addFeature(feature);
    
    /* update position */   
    for (i in p.trail.linestring) 
        feature.getGeometry().appendCoordinate(ll2proj(p.trail.linestring[i].pos));
    
    /* Update style (icon) */
    var style = new ol.style.Style({
      stroke:
        new ol.style.Stroke( ({
          color: "#00c", width: 2.1}))
      });   
    feature.setStyle(style);
    
} /* addTrail */




/**
 * Remove a feature from map.
 */   
polaric.Tracking.prototype.removePoint = function(x) {
    var feature = this.source.getFeatureById(x);
    if (feature != null) {
        CONFIG.mb.map.removeOverlay(feature.label);
        this.source.removeFeature(feature);
    }
}




/**
 * Get points at a specific pixel position on map.
 * @returns Array of point identifiers
 */
polaric.Tracking.prototype.getPointsAt = function(pix) {
   var t=this;
   var pp = CONFIG.mb.map.getFeaturesAtPixel(pix, 
      {hitTolerance: 3, layerFilter: function(x) {return (x == t.layer)}});
   
   if (pp == null) 
      return null;
   else return pp.map(
      function(x) {return x.getId();});
}




/** 
 * Update using JSON data from Polaric server backend 
 */
polaric.Tracking.prototype.update = function(ov) {
   console.log("Tracking.update: view="+ov.view+", sesId="+ov.sesId);
   for (i in ov.points) {
      this.addPoint(ov.points[i]);
      if (ov.points[i].trail != null) 
         this.addTrail(ov.points[i]);
   }
   for (i in ov["delete"])
      this.removePoint(ov["delete"][i]); 
       
   CONFIG.mb.map.render();
}
