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
 
polaric.Tracking = function() 
{
   var t = this; 
   t.producer = new polaric.MapUpdate();
   t.filter = null;
   t.ready = false;
   t.url = CONFIG.get('server');
   var init = true;
   
   t.showLabel = CONFIG.get("tracking.showlabel");
   if (t.showLabel == null)
     t.showLabel = {};
   
   
   
   /* Set up vector layer and source */
   t.layer = CONFIG.mb.addVectorLayer(
       
       /* Default style. 
        */
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
   
   
   /*
    * Define the 'MAP' context as the default context used when right-clicking on the map. 
    * We check if there are any tracking-points at the clicked positions and if this 
    * is the case, we create a context with name 'POINT'. 
    */
   browser.addContextMenu("MAP", function(e) {  
       if ((pts = t.getPointsAt([e.clientX, e.clientY])) != null) 
           return {name: "POINT", ident: pts[0].getId()};
       else return null;
   }); 
  
   
   /* Add click handler for tracking-features. Click on icons and pop up some info... */
   browser.map.on("click", function(e) { 
       var points = mu.getPointsAt(e.pixel);
       var txt = "";
       if (points != null && points.length > 0) {
          if (points.length == 1)
              infoPopup(points[0].getId());
          else 
              showList(points);
       }
       
       /* Show list of points. Clickable to show info about each. */
       function showList(points) {
          var widget =  {
            view: function() {
              return m("div", [       
                 m("table.items", points.map(function(x) 
                    { return m("tr", [ m("td", 
                        { onclick: function() {infoPopup(x.getId())}, 
                          title: x.getId()}, x.alias), m("td", x.title) ] ); }))
               ])
            }
          }
          browser.gui.showPopup( {vnode: widget, geoPos: browser.pix2LonLat(e.pixel)} );
       }
       
       
       /* Get info about point from server */
       function infoPopup(id) {
           console.assert(id!=null && id != "", "Assertion failed"); 
           browser.gui.removePopup();
           browser.gui.remotePopup(
               /* FIXME: This is a call to the old polaric-aprsd webservice that return a HTML document.
                * In the future we may define a REST service that returns a JSON object that is
                * rendered by the client 
                */
              t.url+"/srv/station?ajax=true&simple=true&id="+id,
                {id: "infopopup", geoPos: browser.pix2LonLat(e.pixel)});
       }
       
    });
   
   
   
   /* Called when (Web socket) connection to server is opened. */
   t.producer.onopen = function() {   
      t.ready = true;
      CONFIG.mb.map.on('movestart', onMoveStart);
      CONFIG.mb.map.on('moveend', onMoveEnd);
      
      /* Subscribe to updates from server */
      if (t.filter != null)
          t.producer.subscribe(t.filter, function(x) {t.update(x);} );
   }

   
   
   
   /* Called when move of map starts */
   function onMoveStart() {
      if (!init) {
         /* Clear the layer while moving the map */
         t.layer.setVisible(false);
         t.clear();
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
 * Remove all features from map. 
 */
polaric.Tracking.prototype.clear = function() {
    var ft = this.source.getFeatures()
    for (i in ft) 
       /* For some strange reason, removing feature directly doesn't work */
       this.removePoint(ft[i].getId());
}



/**
 * Set filter and re-subscribe. 
 */
polaric.Tracking.prototype.setFilter = function(flt) {
   console.assert(flt!=null && flt!="", "Assertion failed");
   var t = this;
   t.filter = flt;
   if (t.ready) {
      t.clear();
      t.producer.subscribe(t.filter, function(x) {t.update(x);} );
   }
}




/** 
 * Add a feature (tracking point) or update it if it is already there. 
 */

polaric.Tracking.prototype.addPoint = function(p) {
    console.assert(p!=null, "Assertion failed");
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
    
    /* update position, etc. */
    feature.getGeometry().setCoordinates(c);
    feature.title = p.title; 
    feature.alias = p.label.id;
    feature.lblinfo = p.label; 
    
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
    if (!this._labelHidden(p.ident, p.label.hidden)) {
       if (feature.label) 
           CONFIG.mb.map.removeOverlay(feature.label);
       feature.label = this.createLabel(c, p.label);
    }
    else if (feature.label)
       CONFIG.mb.map.removeOverlay(feature.label);

    /* Trail */
    this.addTrail(p);
} /* AddPoint */



/**
 * Create a label. Use overlay.
 */
polaric.Tracking.prototype.createLabel = function(pos, label) {
   console.assert(pos!=null && label != null, "Assertion failed");
   var element = document.createElement('div');
   element.className = label.style;
   element.innerHTML = label.id;
   
   var lbl = new ol.Overlay({
       element: element,
       offset: [14, 0],
       positioning: 'center-left'
   });
   lbl.setPosition(pos);
   CONFIG.mb.map.addOverlay(lbl);
   return lbl;
}


/**
 * Return true if label is hidden. 
 */
polaric.Tracking.prototype._labelHidden = function(id, dfl) {
    if (this.showLabel[id] != null) 
        return this.showLabel[id]==false; 
    return dfl;
}


/**
 * Return true if label is hidden.
 */
polaric.Tracking.prototype.labelHidden = function(id) {
    var feature = this.source.getFeatureById(id);
    if (feature == null)
        return false;
    return this._labelHidden(id, !feature.label || feature.label == null); 
}


/**
 * Hide label.
 */
polaric.Tracking.prototype.hideLabel = function(id, hide) {
    this.showLabel[id] = !hide;  
    var feature = this.source.getFeatureById(id);
    if (feature == null)
        return;
    if (hide) {
        CONFIG.mb.map.removeOverlay(feature.label);
        feature.label = null;
    }
    else
        feature.label = this.createLabel(
            feature.getGeometry().getCoordinates(), feature.lblinfo);    
    CONFIG.mb.map.render();
    CONFIG.store("tracking.showlabel", this.showLabel);
}


/**
 * Add a trail. 
 * TODO: Add some method to disable/enable this for a point?
 */

polaric.Tracking.prototype.addTrail = function(p) {
    console.assert(p!=null, "Assertion failed");
    var t = this;
    var feature = this.source.getFeatureById(p.ident+'.trail');    
    /* If feature exists and redraw flag is false. Just return */
    if (feature != null && !p.redraw) 
        return;
    
    /* Just replace it with a new one. Remove the old one. */
    if (feature !=null) 
        this.source.removeFeature(feature);
    
    /* If no new trail, just return */
    if (p.trail == null)
        return;
        
    
    feature = new ol.Feature(new ol.geom.LineString([ll2proj(p.pos)]));
    feature.setId(p.ident+'.trail');
    this.source.addFeature(feature);
    
    /* update position */   
    for (i in p.trail.linestring) 
        feature.getGeometry().appendCoordinate(ll2proj(p.trail.linestring[i].pos));

    /* Update style */
    var style = new ol.style.Style({
      stroke:
        new ol.style.Stroke( ({
          color: "#"+p.trail.style[0], width: 2.0}))
      });   
    feature.setStyle(style);
    
    if (CONFIG.mb.getResolution() < 20)
       this.addTrailPoints(p);
} /* addTrail */




/**
 * Add points to a trail. 
 * TODO: Should there be a method to enable/disable this?
 * TODO: Should points be clickable, to pop up some info? 
 */

polaric.Tracking.prototype.addTrailPoints = function(p) {
    console.assert(p!=null, "Assertion failed");
    feature = new ol.Feature(new ol.geom.MultiPoint([]));
    feature.setId(p.ident+'.trailpoints');
    
    /* update position */   
    for (i in p.trail.linestring) 
        feature.getGeometry().appendPoint(
            new ol.geom.Point( ll2proj(p.trail.linestring[i].pos)));
    
    /* Update style */
    var style = new ol.style.Style({
        image: new ol.style.Circle({
          fill:  new ol.style.Fill({ color: "#"+p.trail.style[1]}),
          radius: 2.1
        })
      });   
    feature.setStyle(style);  
    this.source.addFeature(feature);
}




/**
 * Remove a feature from map.
 */   
polaric.Tracking.prototype.removePoint = function(x) {
    console.assert(x!=null && x!="", "Assertion failed");
    var feature = this.source.getFeatureById(x);
    var trail = this.source.getFeatureById(x + ".trail");
    
    if (feature != null) {
        CONFIG.mb.map.removeOverlay(feature.label);
        this.source.removeFeature(feature);
        if (trail != null)
            this.source.removeFeature(trail);
    }
}




/**
 * Get points at a specific pixel position on map.
 * @returns Array of point identifiers
 */
polaric.Tracking.prototype.getPointsAt = function(pix) {
   console.assert(pix!=null && pix[0]>=0 && pix[1]>=null, "Assertion failed");
   var t=this;
   var pp = CONFIG.mb.map.getFeaturesAtPixel(pix, 
      {hitTolerance: 3, layerFilter: function(x) {return (x == t.layer)}});
   
   if (pp == null) 
      return null;
   else return pp.filter(function(x) {return x.alias}); 
}




/**
 * Move the map to a given point. Since the point may not be a feature on client yet, 
 * we need to fetch it from the server. 
 */
polaric.Tracking.prototype.goto_Point = function(ident) {
   console.assert(ident!=null && ident!="", "Assertion failed");
   
   $.get(this.url + "/srv/finditem?ajax=true&id="+ident, function(info) {
       if (info == null) {
          console.log("Goto point: Not found on server");
          return; 
       }  
       /* The returned info should be three tokens delimited by commas: 
        * an id (string) and x and y coordinates (number)
        */
       var args = info.split(/\s*,\s*/g);
       if (args == null || args.length < 3)
          return;
       var x = parseFloat(args[1]);
       var y = parseFloat(args[2]);
       if (isNaN(x) || isNaN(y))
          return;
      CONFIG.mb.gui.removePopup();
      CONFIG.mb.goto_Pos([x,y], false);
   });
}



/** 
 * Update using JSON data from Polaric Server backend 
 */
polaric.Tracking.prototype.update = function(ov) {
   console.log("Tracking.update: view="+ov.view+", sesId="+ov.sesId);
   for (i in ov.points) 
      this.addPoint(ov.points[i]);
   
   for (i in ov["delete"])
      this.removePoint(ov["delete"][i]); 
       
   CONFIG.mb.map.render();
}
