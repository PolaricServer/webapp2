/*
 Map browser based on OpenLayers. Tracking.
 Present tracking data from Polaric Server backend as a map-layer.

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


pol.tracking = pol.tracking || {};


 
pol.tracking.isSign = function(p) {
    return (p.getId().indexOf("__") === 0);
}


     
/**
 * Tracking layer class.
 */

pol.tracking.Tracking = class {
    
    /* Constructor takes a server as an argument */
    constructor(srv, scale) {
        const t = this;

        t.zoom = 0;
        t.filter = null;
        t.tag = null;
        t.ready = false;
        t.server = srv;
        t.srch = false; 
        t.tracked = CONFIG.get("tracking.tracked");
        if (t.tracked == "null")
            t.tracked = null;
	
        t.iconpath = CONFIG.get('iconpath');
        if (t.iconpath == null)
            t.iconpath = '';
        
        t.iconscale = scale;
        if (t.iconscale == null)
            t.iconscale = 1;
        
        var init = true;
        t.producer = new pol.tracking.MapUpdate(t.server);

        /* Show label for point or not */
        t.showLabel = CONFIG.get("tracking.showlabel");
        if (t.showLabel == null)
            t.showLabel = {};
	
        /* Show trail for point or not */
        t.showTrail = CONFIG.get("tracking.showtrail");
        if (t.showTrail == null)
            t.showTrail = {};
	
        /* Set up vector layer and source */
        t.layer = CONFIG.mb.addVectorLayer(
            /* 
             * Default style.
             */
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#d11',
                    width: 2
                })
            })
        );

        t.source = this.layer.getSource();;

        const urlParams = new URLSearchParams(window.location.search);
        t.tag = urlParams.get('tag');

        /*
         * Define the 'MAP' context as the default context used when right-clicking on the map.
         * We check if there are any tracking-points at the clicked positions and if this
         * is the case, we create a context with name 'POINT'.
         */
        CONFIG.mb.addContextMenu("MAP", e => {
            const pts = t.getPointsAt([e.clientX, e.clientY]);
            if (pts && pts != null) {
                if (pts.length > 1) {
                    /* More than one point. Show a list */
                    t.showList(pts, [e.clientX, e.clientY], true);
                    return {name: "_STOP_"};
                }
                if (pts.length > 0) 
                    /* Just one point */
                    return { 
                        name:  (pol.tracking.isSign(pts[0]) ? "SIGN" : "POINT"), 
                        ident: pts[0].getId(),
                        aprs:  pts[0].point.aprs,
                        own:   pts[0].point.own,
                        telemetry: pts[0].point.telemetry,
                        point: pts[0]
                    };
            }
            else return null;
        });

   
        /* Add click handler for tracking-features. Click on icons and pop up some info... */
        CONFIG.mb.map.on("click", e => {
            const points = t.getPointsAt(e.pixel);
            if (points != null && points.length > 0) {
                if (points.length == 1)
                    t.server.infoPopup(points[0], e.pixel);
                else
                    t.showList(points, e.pixel);
            }
        });
        
        
        CONFIG.mb.map.on("change:view", e => {
            t.clear();
            const ovr = CONFIG.mb.map.getOverlays(); 
            setTimeout(()=>ovr.clear(), 10);
            t.producer.subscribe(t.filter, x => t.update(x), t.tag, false );
        });
        
        
        t.source.on("clear", ()=> {
            t.clear(); 
        });
        

        /* Called when (Web socket) connection to server is opened. */
        t.producer.onopen = function() {
            t.ready = true;
            CONFIG.mb.map.on('movestart', onMoveStart);
            CONFIG.mb.map.on('moveend', onMoveEnd);

            /* Subscribe to updates from server */
            if (t.filter != null) 
                t.producer.subscribe(t.filter, x => t.update(x), t.tag, false );
        }


        
        
        /* Called when move of map starts */
        function onMoveStart() {
            if (t.srch)
                return;
        }
        

        /* Called when move of map ends */
        function onMoveEnd() {
            let z = Math.round(CONFIG.mb.getScale()/1000);
            if  (z > 999)
                z = Math.round(z/100);
            else if (z > 99)
                z = Math.round(z/10);
            
            const zoomed = (z != t.zoom);
            t.zoom = z; 
            
            if (t.srch)
                return;
            if (init)
                init = false;
            else {
                /* Re-subscribe */
                t.layer.setVisible(true);
                if (zoomed) 
                    t.clear();
                t.producer.subscribe(t.filter, x => t.update(x), t.tag, (zoomed != true) );
                
            }
        }

    } /* constructor */

    
    
    isConnected() {
        return this.producer.isConnected();
    }
    
    
    reconnect() {
        this.producer.close(); 
        setTimeout(()=>this.producer.open(), 1500);
    }

    
    
    /**
     * Show list of points. Clickable to show info about each.
     */
    showList(points, pixel, cmenu) {
        const t = this;
        
        const widget =  {
            view: function() {
                return m("div", [
                    m("table.items", points.map( x => { 
                        return m("tr", [ m("td", { 
                            onclick: function(e) 
                                {t.redrawFeature(x.getId()); showContext(e, x); }
                        }, x.alias), m("td", m.trust(x.point.title)) ] ); }))
                ])
            }
        }
        CONFIG.mb.gui.showPopup( {vnode: widget, geoPos: CONFIG.mb.pix2LonLat(pixel)} );

        function showContext(e, x) {
            if (cmenu) {
                CONFIG.mb.gui.removePopup();
                CONFIG.mb.ctxMenu.showOnPos( { 
                    sarAuth: x.point.sarAuth,
                    name: (pol.tracking.isSign(x) ? "SIGN" : "POINT"), 
                    point: x,
                    ident: x.getId()
                }, pixel )
            }    
            else
                t.server.infoPopup(x, pixel)
        }
    }
 
 
 
    getLayerSource() {
        return this.source; 
    }
 
 
    /* Redraw feature to put it on top of the stack */
    redrawFeature(id) {
        const t = this;
        const feature = t.source.getFeatureById(id);
        console.assert(feature != null, "feature=null");
        if (feature==null)
            return; 
        const pt = feature.point;
        pt.redraw = true;
        t.addPoint(pt);
    }
   
       
    /**
     * Remove all features from map.
     */
    clear() {
        const ft = this.source.getFeatures()
        for (const x of ft) 
            /* For some strange reason, removing feature directly doesn't work */
            this.removePoint(x.getId());
    }



    /**
     * Set filter and re-subscribe.
     */
    setFilter(flt) {
        console.assert(flt!=null && flt!="", "flt="+flt);
        this.filter = flt;
        if (this.ready) {
            this.clear();
            this.producer.subscribe(this.filter, x => this.update(x), this.tag );
        }
    }



    /**
    * Add a feature (tracking point) or update it if it is already there.
    */
    addPoint(p) {
        console.assert(p!=null, "Assertion failed");
        const c = ll2proj(p.pos);

        if (p.redraw)
            this.removePoint(p.ident);


        /* Draw the trail first. */
        if (!this._trailHidden(p.ident, false))
            this.addTrail(p);

        let feature = this.source.getFeatureById(p.ident);
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
        if (this.tracked != null && this.tracked == p.ident)
            CONFIG.mb.setCenter(p.pos, 70);
            
        if (p.label != null) 
            feature.alias = p.label.id;
        feature.point = p;
        
        /* Update style (icon) */
        const style = new ol.style.Style({
            image:
                new ol.style.Icon( ({
                    scale: this.iconscale,
                    anchor: [0.5, 0.5],
                    src: this.iconpath + p.icon, 
                    opacity: ((p.label != null && p.label.style.includes("lstill")) 
                        ? 0.8 : 1)
                }))
        });
        feature.setStyle(style);

        /* Update label. Just replace it. */
        if (p.label != null && !this._labelHidden(p.ident, p.label.hidden)) {
            if (feature.label)
                CONFIG.mb.map.removeOverlay(feature.label);
            feature.label = this.createLabel(c, p.ident, p.label);
        }
        else if (feature.label)
            CONFIG.mb.map.removeOverlay(feature.label);
    } /* AddPoint */


    
    createPopupLabel(pos, text, xtext) {
        const t = this;
        let element = document.createElement('div');
        element.className = "popuplabel";
        let lbl = new ol.Overlay({
            element: element,
            offset: [-7, -1],
            insertFirst: false,
            positioning: 'center-left'
        });
        lbl.setPosition(pos);
        CONFIG.mb.map.addOverlay(lbl);
        
        /* Mouse event handlers */
        element.onclick = function(e) {
            CONFIG.mb.gui.removePopup();
            element._clicked = true;
            CONFIG.mb.gui.showPopup({
                geoPos: proj2ll(pos), html: text+"<br>"+xtext});
            e.stopPropagation();
        }       
        
        return lbl;
    }


    /**
     * Create a label. Use overlay.
     */
    createLabel(pos, ident, label) {
        const t = this;
        console.assert(pos!=null && label != null, "Assertion failed");
        let element = document.createElement('div');
        element.className = label.style;
        element.innerHTML = label.id;
        if (ident == this.tracked)
            $(element).addClass("tracked");
   
        let lbl = new ol.Overlay({
            element: element,
            offset: [14, 0],
            insertFirst: false,
            positioning: 'center-left'
        });
        lbl.setPosition(pos);
        lbl.tracklabel=true;
        CONFIG.mb.map.addOverlay(lbl);
    
        /* Mouse event handlers */
        element.onclick = function(e) {
            t.server.infoPopup(t.source.getFeatureById(ident), [e.clientX, e.clientY]);
            e.stopPropagation();
        }
        element.onmouseenter = function(e) { 
            element._cancel = false;
            setTimeout(() => {
                if (!element._cancel) 
                    t.redrawFeature(ident);
                if (CONFIG.labelStyle)
                    CONFIG.labelStyle.setFont();
            }, 800);
        }
        element.onmouseleave = function(e) {
            element._cancel = true; 
        }         
        element.oncontextmenu = function(e) { 
            const f = t.source.getFeatureById(ident);
            CONFIG.mb.ctxMenu.showOnPos(
              { name: "POINT", 
                point: f,
                sarAuth: f.point.sarAuth,
                ident: ident}, [e.clientX, e.clientY]); 
        }
    
        return lbl;
    }


    /**
     * Return true if label is hidden.
     */
    _labelHidden(id, dfl) {
        if (this.showLabel[id] != null)
            return this.showLabel[id]==false;
        return dfl;
    }


    /**
     * Return true if label is hidden.
     */
    labelHidden(id) {
        const feature = this.source.getFeatureById(id);
        if (feature == null)
            return false;
        return this._labelHidden(id, !feature.label || feature.label == null);
    }


    /**
     * Hide label.
     */
    hideLabel(id, hide) {
        this.showLabel[id] = !hide;
        const feature = this.source.getFeatureById(id);
        if (feature == null)
            return;
        if (hide) {
            CONFIG.mb.map.removeOverlay(feature.label);
            feature.label = null;
        }
        else
            feature.label = this.createLabel(
                feature.getGeometry().getCoordinates(), id, feature.point.label);
        CONFIG.mb.map.render();
        CONFIG.store("tracking.showlabel", this.showLabel);
    }

    
    
    /**
     * Return true if label is hidden.
     */
    _trailHidden(id, dfl) {
        if (this.showTrail[id] != null)
            return this.showTrail[id]==false;
        return dfl;
    }


    /**
     * Return true if label is hidden.
     */
    trailHidden(id) {
        const feature = this.source.getFeatureById(id);
        const trail = this.source.getFeatureById(id +'.trail');
        if (feature == null)
            return false;
        const x = this._trailHidden(id, false);
        return x;
    }

    
    /**
     * Hide trail.
     */
    hideTrail(id, hide) {
        this.showTrail[id] = !hide;
        const feature = this.source.getFeatureById(id);
        const trail = this.source.getFeatureById(id +'.trail');
        const tpoints = this.source.getFeatureById(id+'.trailpoints');
	
        if (hide) {      
            if (trail !=null)
               this.source.removeFeature(trail);
            if (tpoints !=null) {
                this.source.removeFeature(tpoints);	
                this.removeTrailPoints(feature.point);
            }
        }
        else
            if (feature.point != null)
                this.addTrail(feature.point);
	    
        CONFIG.mb.map.render();
        CONFIG.store("tracking.showtrail", this.showTrail);
    }
    
    
    
    /**
     * Add a trail.
     */
    addTrail(p) {
        let i=0;
        
        console.assert(p!=null, "p is null");
        let feature = this.source.getFeatureById(p.ident+'.trail');
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
        const style = new ol.style.Style({
            stroke:
                new ol.style.Stroke( ({
                    color: "#"+p.trail.style[0], width: 2.0 * this.iconscale
                }))
        });
        feature.setStyle(style);

        if (CONFIG.mb.getResolution() < 90)
            this.addTrailPoints(p);
    } /* addTrail */


    formatTime(dt) {
        const days = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const d = new Date(dt);
        return "" +
            (d.getDate() + " "+days[d.getMonth()]+" ")+
            (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
            (d.getMinutes()<10 ? "0" : "") + d.getMinutes() +":"+
            (d.getSeconds()<10 ? "0" : "") + d.getSeconds();
    }
        
        
    /**
     * Add points to a trail.
     * TODO: Should there be a method to enable/disable this?
     */
    addTrailPoints(p) {
        console.assert(p!=null, "p is null");
        let feature = this.source.getFeatureById(p.ident+'.trailpoints');
        if (feature !=null)
            this.source.removeFeature(feature);

        feature = new ol.Feature(new ol.geom.MultiPoint([]));
        feature.setId(p.ident+'.trailpoints');
        p.trail.labels = [];

        /* update position */
        for (const x of p.trail.linestring) {
            p.trail.labels.push(
                this.createPopupLabel( ll2proj(x.pos), 
                    this.formatTime(x.time), 
                    p.ident +
                    (x.path!=null ? "<br>Via: "+x.path : ""))
            );
            
            if ((CONFIG.mb.getResolution() < 30) && x.path != null && x.path != "(ext)" && x.path != "(int)" && x.path != "AIS")
                feature.getGeometry().appendPoint(
                    new ol.geom.Point( ll2proj(x.pos) ) 
                );
        }

        /* Update style */
        const style = new ol.style.Style({
            image: new ol.style.Circle({
                fill:  new ol.style.Fill({ color: "#"+p.trail.style[1]}),
                radius: 2.1
            })
        });
        feature.setStyle(style);
        this.source.addFeature(feature);
    }


    
    
    removeTrailPoints(p) {
        let feature = this.source.getFeatureById(p.ident+'.trailpoints');
        this.source.removeFeature(feature);
        if (!p.trail || !p.trail.labels)
            return;
        for (const x of p.trail.labels) 
            CONFIG.mb.map.removeOverlay(x);
        p.trail.labels = [];
    }
    
    
    
    
    
    addCoveragePoints(p, ident, color) {
        const style = new ol.style.Style({
            image: new ol.style.Circle({
                fill:  new ol.style.Fill({ color: "#"+color}),
                radius: 5
            })
        });
        const feature = new ol.Feature(new ol.geom.MultiPoint([]));
        feature.setId(ident+'.coveragepoints');
        for (const x of p)
            feature.getGeometry().appendPoint(
                new ol.geom.Point( ll2proj(x.pos)));        
        feature.setStyle(style);
        this.source.addFeature(feature);
    }
    

    /**
     * Add a line (representing a path between nodes)
     */
    addLine(line) {
        let feature = new ol.Feature(new ol.geom.LineString([ll2proj(line.from), ll2proj(line.to)]) );
    
        /* Update style 
         * FIXME: Use style repository or styles from config 
         */
        const style = new ol.style.Style({
            stroke:
                new ol.style.Stroke( (
                    (line.type === "prim" ? 
                        { color: "#a00", width: 1.6} :
                        { color: "#00c", width: 1.5, lineDash: [3,3]} )))
        });
        feature.setStyle(style);
        feature.setId("line."+line.ident);
        this.source.addFeature(feature);
    }


    
    /**
     * Remove a feature from map.
     */
    removePoint(x) {
        if (x==null || x == "")
            return;
        const feature = this.source.getFeatureById(x);
        if (feature != null) {
            if (feature.label)
                CONFIG.mb.map.removeOverlay(feature.label);
            this.source.removeFeature(feature);
            if (feature.point) 
                this.removeTrailPoints(feature.point);
        }
    }




    /**
     * Get points at a specific pixel position on map.
     * @returns Array of point identifiers
     */
    getPointsAt(pix) {
        console.assert(pix!=null && pix[0]>=0 && pix[1]>=null, "Assertion failed");
        const pp = CONFIG.mb.map.getFeaturesAtPixel( pix,
            {hitTolerance: 3, layerFilter: x => {return (x == this.layer)}});
        if (pp == null)
            return null;
        else return pp.filter(x => x.point);
    }




    /**
     * Move the map to a given point. Since the point may not be a feature on client yet,
     * we need to fetch it from the server.
     */
    goto_Point(ident) {
        console.assert(ident!=null && ident!="", "ident="+ident);
        const svc = (CONFIG.server.isAuth() ? "xpos" : "pos");
        this.server.GET("item/"+ident+"/"+svc, null, info => {
            if (info == null) {
                console.log("Goto point: Not found on server");
                return;
            }
            const pos = JSON.parse(info);
            CONFIG.mb.gui.removePopup();
            CONFIG.mb.goto_Pos(pos, false);
        });
    }

    
    searchMode(on) {
        if (!this.srch && on)
            this.clear();
        if (this.srch && !on) {
            this.clear();
            this.producer.subscribe(this.filter, x => this.update(x), this.tag );
        }
        this.srch = on;
    }
    
    
    setTracked(ident) {
        this.tracked = ident; 
        this.clear();
        this.producer.subscribe(this.filter, x => this.update(x), this.tag );
        CONFIG.store("tracking.tracked", (ident==null? "null" : ident));
    }
    
    
    isTracked(ident) {
        if (this.tracked == null)
            return false; 
        return (this.tracked == ident);
    }
    
    

    /**
     * Update using JSON data from Polaric Server backend
     */
    update(ov, srch) {
        let i = 0;
        
        if (this.srch && !srch)
            return
        if (ov == null)
            return;
        
        if (ov.overload) {
            console.log("Overload (too many points in overlay generation)");
            CONFIG.filt.setDisabled(true);
            return;
        }
        else
            CONFIG.filt.setDisabled(false);
        
        if (ov.sarmode)
            $("#sarmode").removeClass("sar_hidden");
        else
            $("#sarmode").addClass("sar_hidden");

        if (!srch && this.srch)
            this.clear();
        this.srch = srch;
	
        for (i in ov.points)
            this.addPoint(ov.points[i]);
   
        for (i in ov.lines)
            this.addLine(ov.lines[i]);
        
        if (ov.pcloud != null)
            this.addCoveragePoints(ov.pcloud, ov.ident, ov.color);

        for (i in ov["delete"])
            this.removePoint(ov["delete"][i]);

        CONFIG.mb.map.render();
        if (CONFIG.labelStyle)
            CONFIG.labelStyle.setFont();
    }
    
} /* class */
