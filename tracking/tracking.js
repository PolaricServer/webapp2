/*
 Map browser based on OpenLayers 5. Tracking.
 Present tracking data from Polaric Server backend as a map-layer.

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


pol.tracking = pol.tracking || {};


 
pol.tracking.isSign = function(p) {
    return (p.getId().indexOf("__") === 0);
}
     
     
     
/**
 * Tracking layer class.
 */

pol.tracking.Tracking = class {
    
    /* Constructor takes a server as an argument */
    constructor(srv) {
        const t = this;

        t.filter = null;
        t.ready = false;
        t.server = srv;
        t.srch = false; 
	
        t.iconpath = CONFIG.get('iconpath');
        if (t.iconpath == null)
            t.iconpath = '';

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


        /*
         * Define the 'MAP' context as the default context used when right-clicking on the map.
         * We check if there are any tracking-points at the clicked positions and if this
         * is the case, we create a context with name 'POINT'.
         */
        browser.addContextMenu("MAP", e => {
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
                        name: (pol.tracking.isSign(pts[0]) ? "SIGN" : "POINT"), 
                        ident: pts[0].getId(),
                        point: pts[0]
                    };
            }
            else return null;
        });

   
        /* Add click handler for tracking-features. Click on icons and pop up some info... */
        browser.map.on("click", e => {
            const points = t.getPointsAt(e.pixel);
            if (points != null && points.length > 0) {
                if (points.length == 1)
                    t.server.infoPopup(points[0], e.pixel);
                else
                    t.showList(points, e.pixel);
            }
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
                t.producer.subscribe(t.filter, x => t.update(x) );
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
                t.producer.subscribe(t.filter, x => t.update(x) );
            }
        }

    } /* constructor */





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
                                {t.redrawFeature(x.getId()); showContext(e, x); },
                            title: x.getId()
                        }, x.alias), m("td", m.trust(x.point.title)) ] ); }))
                ])
            }
        }
        browser.gui.showPopup( {vnode: widget, geoPos: browser.pix2LonLat(pixel)} );

        function showContext(e, x) {
            if (cmenu) {
                CONFIG.mb.gui.removePopup();
                CONFIG.mb.ctxMenu.showOnPos( { 
                    name: (pol.tracking.isSign(x) ? "SIGN" : "POINT"), 
                    point: x,
                    ident: x.getId()
                }, pixel )
            }    
            else
                t.server.infoPopup(x, pixel)
        }
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
            this.producer.subscribe(this.filter, x => this.update(x) );
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
        if (p.label != null) 
            feature.alias = p.label.id;
        feature.point = p;

        /* Update style (icon) */
        const style = new ol.style.Style({
            image:
                new ol.style.Icon( ({
                    anchor: [0.5, 0.5],
                    src: this.iconpath + p.icon
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




    /**
     * Create a label. Use overlay.
     */
    createLabel(pos, ident, label) {
        const t = this;
        console.assert(pos!=null && label != null, "Assertion failed");
        let element = document.createElement('div');
        element.className = label.style;
        element.innerHTML = label.id;
   
        let lbl = new ol.Overlay({
            element: element,
            offset: [14, 0],
            insertFirst: false,
            positioning: 'center-left'
        });
        lbl.setPosition(pos);
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
                ident: ident}, [e.clientX, e.clientY]); }
    
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
            if (tpoints !=null)
               this.source.removeFeature(tpoints);	    
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
                    color: "#"+p.trail.style[0], width: 2.0
                }))
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
    addTrailPoints(p) {
        console.assert(p!=null, "p is null");
        let feature = this.source.getFeatureById(p.ident+'.trailpoints');
        if (feature !=null)
            this.source.removeFeature(feature);

        feature = new ol.Feature(new ol.geom.MultiPoint([]));
        feature.setId(p.ident+'.trailpoints');

        /* update position */
        for (i in p.trail.linestring)
            feature.getGeometry().appendPoint(
                new ol.geom.Point( ll2proj(p.trail.linestring[i].pos)));

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

        this.server.GET("/finditem", {ajax:true, id:ident}, info => {
            if (info == null) {
                console.log("Goto point: Not found on server");
                return;
            }
            
           /*
            * The returned info should be three tokens delimited by commas:
            * an id (string) and x and y coordinates (number)
            */
            const args = info.split(/\s*,\s*/g);
            if (args == null || args.length < 3)
                return;
            const x = parseFloat(args[1]);
            const y = parseFloat(args[2]);
            if (isNaN(x) || isNaN(y))
                return;
            CONFIG.mb.gui.removePopup();
            CONFIG.mb.goto_Pos([x,y], false);
        });
    }



    /**
     * Update using JSON data from Polaric Server backend
     */
    update(ov, srch) {
        if (ov == null)
            return;
	
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

        for (i in ov["delete"])
            this.removePoint(ov["delete"][i]);

        CONFIG.mb.map.render();
        if (CONFIG.labelStyle)
            CONFIG.labelStyle.setFont();
    }
    
} /* class */
