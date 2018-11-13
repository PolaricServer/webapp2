/*
 Map browser based on OpenLayers 5. Layer editor. 
 GPX file layer. 
 
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


 
// FIXME: Move this function to uisupport.js ? 



/**
 * WFS layer editor.
 */

pol.layers.Gpx = class extends pol.layers.Edit {
    
    constructor(list) {
        super(list); 
        this.files = [];
        const t = this;
        
      
        this.fields = {
            view: ()=> { 
                return m("div.spec", [ 
                    m("span.sleftlab", "Files: "),
                    m("span.dragdrop", [ t.files.map( x=> {
                        return m("img", {src: "images/32px/file.png", title: x.name}); 
                    }), 
                    (t.files.length > 1 ? "" : "Drop files here...") ]), br, 
                         
                    m("span.sleftlab", "Style: "),
                    m(select, {id: "gpxStyle", list: Object.keys(CONFIG.styles).map( x => {
                            return {label: x, val: x, obj: CONFIG.styles[x]}; 
                        }) }), br,
	       
                    m("span.sleftlab", "Label attr: "),
                    m(textInput, {id:"gpxLabel", size: 20, maxLength: 60, regex: /^.+$/i }),br
                ]);
            },
            
            oncreate: ()=> 
                setTimeout( ()=> { dragdrop( $(".dragdrop").get(0), dropFile); }, 1000), 
            
            onremove: ()=> cleanup()
        }  
    
    
    
        /* 
         * Click handler for features. Consider moving this to a separate source file/class 
         */
        browser.map.on("click", e => {
            const pp = CONFIG.mb.map.getFeaturesAtPixel( e.pixel,
                {hitTolerance: 3, layerFilter: x => {
                    return (x.values_.gpxLayer);
                }});
            if (pp && pp != null)
                showList(pp, e.pixel);
        });
            
        function showList(features, pixel) {
            const t = this;
            const widget =  {
                view: function() {
                    return m("div.featurelist", [
                        m("table", features.map( x => { 
                            return m("tr", m("td", x.values_.name)) 
                        }))])
                }
            }
            browser.gui.showPopup( {vnode: widget, geoPos: browser.pix2LonLat(pixel)} );    
        }
        
        
    
        /* Handler for when files are dropped */
        function dropFile(e) {
            let formData = new FormData();
            let i = 0;
            let names = []; 
            for (const f of e.files) {
                if (f.type == "" && f.name.substr(f.name.lastIndexOf(".")+1) == "gpx")
                    f.type = "application/gpx+xml";
		
                if (f.type == "application/gpx+xml" || f.type == "application/x-gpx+xml") {
                    formData.append("file" + i++, f);
                    names.push(f.name);
                }
                else
                    alert("ERROR: Unsupported format: "+f.type);
            }
            if (i>0)
                CONFIG.server.POST("/files/gpx", formData,
                    x => {
                        let res = JSON.parse(x);
                        i=0;
                        for (const id of res) {
                            t.files.push( {id: id, name: names[i], used: false} );
                            console.log("File '"+names[i++]+"' uploaded ok: "+id); 
                            m.redraw();
                        }
                    },
                    x => alert("File upload error")
            );
        }
        
        
        /* Cleanup when widget is terminated */
        function cleanup() {
            for (const f of t.files)
                if (!f.used)
                    CONFIG.server.DELETE("/files/gpx/"+f.id, null, null)
            t.files = [];
        }
    
    } /* constructor */
    

    
    allowed() 
        { return CONFIG.server.loggedIn; }
        

    /**
     * Return true if add button can be enabled 
     */
    enabled() {
        return  $("#editLayer").attr("ok") &&
                this.files.length > 0;
    }
      
      
      
    /**
     * Create a layer. 
     */
    createLayer(name) {
        const styleId = $("#gpxStyle").val();
        const label = $("#gpxLabel").val();
        console.log("Create GPX layer: style="+styleId+", label="+label);
        const x = this._createLayer(name, styleId, label, this.files);
        this.files = []; 
        m.redraw(); 
        return x; 
    }  
    
    
    
    // FIXME: Do similar for other layer classes
    _createLayer(name, styleId, label, files) {
        
        let sublayers = [];
        for (const f of files) {
            const sl = createLayer_GPX( {
                url: CONFIG.server.url+"/files/gpx/"+f.id,
                style: (label && label!=null ? SETLABEL(styleId, label) : GETSTYLE(styleId))
                // FIXME: How to use labels? 
            });
            sublayers.push(sl);
            f.used = true;
        }
        let x = new ol.layer.Group({name: name, layers: sublayers}); 
        
        x.styleId = styleId;
        x.label = label;
        x.files = files.slice(0);
        x.filt = null;
        return x;
    }

    
    removeLayer(layer) { 
        const t = this;
        for (const f of layer.files) {
            const x = inEditor(f);
            if (x==null)
                CONFIG.server.DELETE("/files/gpx/"+f.id, null, null)
            else
                x.used = false; 
        }
        
        function inEditor(x) {
            for (const f of t.files)
                if (x.id==f.id)
                    return f; 
            return null;
        }
    }

    
    
    /**
     * Move settings to web-form. 
     */
    edit(layer) {
        super.edit(layer);
        $("#gpxStyle").val(layer.styleId).trigger("change");
        $("#gpxLabel").val(layer.label).trigger("change");
        this.files = layer.files.splice(0); 
        for (let x of this.files)
            x.used = false; 
        m.redraw();
    }

    
    
    /**
     * Prepare for saving a layer to JSON format. 
     */   
    layer2obj(layer) { 
        let lx = {
            // FIXME: What about name? 
            name: layer.name,
            styleId: layer.styleId,
            label: layer.label,
            files: layer.files
        }
        return lx;
    }

      
      
    /**
     * Restore a layer (see also layer2obj). 
     */
    obj2layer(lx) {
        if (lx == null) {
            console.warn("WfsLayer.json2layer: Resulting Layer is null");
            return null;
        }   
        if (!lx.files)
            lx.files = [];
        return this._createLayer(lx.name, lx.styleId, lx.label, lx.files);
    }
      
} /* class */

