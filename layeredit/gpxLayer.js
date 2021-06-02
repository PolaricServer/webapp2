/*
 Map browser based on OpenLayers 5. Layer editor. 
 GPX file layer. 
 
 Copyright (C) 2018-2021 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * WFS layer editor.
 */

pol.layers.Gpx = class extends pol.layers.Edit {
    
    constructor(list) {
        super(list); 
        this.files = [];
        const t = this;
        t.gpxLab = m.stream("");
       
        this.fields = {
            view: ()=> { 
                return m("div.spec", [ 
                    m("span.sleftlab", "Files: "),
                    m("span.dragdrop", [ t.files.map( x=> {
                        return m("img", {src: "images/32px/file.png", title: x.name}); 
                    }), 
                    (t.files.length > 1 ? "" : "Drop files here...") ]), br, 
                         
                    m("span.sleftlab", "Style: "),
                    m(select, {id: "gpxStyle", list: Object.keys(CONFIG.getStyles("gpx")).map( x => {
                            return {label: x, val: x, obj: CONFIG.styles[x]}; 
                        }) }), br,
	       
                    m("span.sleftlab", "Label attr: "),
                    m(textInput, {id:"gpxLabel", size: 20, maxLength: 60, value: t.gpxLab, regex: /^.+$/i }),br
                ]);
            },
            
            oncreate: ()=> 
                setTimeout( ()=> { dragdrop( $(".dragdrop").get(0), dropFile); }, 1000), 
            
            onremove: ()=> cleanup()
        }  
    

        
    
        /* Handler for when files are dropped */
        function dropFile(e) {
            
            let i = 0;
            let names = []; 

            for (const f of e.files) {
                
                /* Check the type of the file and add it to the list of names*/
                let type = f.type;
                if (type == "" && f.name.substr(f.name.lastIndexOf(".")+1) == "gpx")
                    type = "application/gpx+xml";
                if (type == "application/gpx+xml" || type == "application/x-gpx+xml") 
                    names.push(f.name);
                else {
                    alert("ERROR: Unsupported format: '"+type+"'");
                    continue;
                }
                
                /* Now, read the content of the file and send it to the server */
                let reader = new FileReader();
                reader.readAsText(f);
                reader.onload = (ev) => {
                    CONFIG.server.POST("/objects/"+t.subTag(), ev.target.result, 
                        x => { 
                            t.files.push( {id: x, name: f.name, used: false} );
                            console.log("File '"+f.name+"' uploaded ok: "+x); 
                            m.redraw();
                        },
                        x => alert("File upload error")
                    );
                };
            }
        }
        
        
        
        
        
        /* Cleanup when widget is terminated */
        function cleanup() {
            for (const f of t.files)
                if (!f.used) 
                    CONFIG.server.DELETE("/objects/"+t.subTag()+"/"+f.id, null, null);
                
            t.files = [];
        }
    
    } /* constructor */
    

    subTag(name) {
        return encodeURIComponent("gpx."+ (typeof name === 'undefined' ? this.lName() : name));
    }
    
    
    allowed() 
        { return CONFIG.server.loggedIn; }
        

    /**
     * Return true if add and update button can be enabled 
     */
    enabled() {
        return  ($("#editLayer").attr("ok")==null || $("#editLayer").attr("ok")) &&
                this.lName().length > 0 &&
                this.files.length > 0;
    }
      
      
      
    /**
     * Create a layer. 
     */
    createLayer(name, old) {
        const styleId = $("#gpxStyle").val();
        console.log("Create GPX layer: style="+styleId+", label="+this.gpxLab());
        const x = this._createLayer(name, null, styleId, this.gpxLab(), this.files);
        return x; 
    }  
    
    
    
    // FIXME: Do similar for other layer classes
    _createLayer(name, filt, styleId, label, files) {
        
        let sublayers = [];
        for (const f of files) {
            const sl = createLayer_GPX( {
                url: "/objects/"+this.subTag(name)+"/"+f.id, 
                style: (label && label!=null ? SETLABEL(styleId, label) : GETSTYLE(styleId))
            });
            sublayers.push(sl);
            f.used = true;
        }
        let x = new ol.layer.Group({name: name, layers: sublayers}); 
        
        x.styleId = styleId;
        x.label = label;
        x.files = files.slice(0);
        x.filt = filt;
        x.predicate = this.createFilter(filt);
        return x;
    }

    
    removeLayer(layer, onserver) { 
        const t = this;
        
        /* Delete files on server or mark them as not used */
        for (const f of layer.files) {
            const x = inEditor(f);
            if (x==null && onserver)
                CONFIG.server.DELETE("/objects/"+this.subTag()+"/"+f.id, null, null)
            else
                if (x !=null) x.used = false; 
        }
        
        /* Return true if the file x is in the editor list of files */
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
        this.gpxLab(layer.label);
        this.files = layer.files.slice(0).splice(0); 
        for (let x of this.files)
            x.used = true; 
        m.redraw();
    }

    
    
    /**
     * Prepare for saving a layer to JSON format. 
     */   
    layer2obj(layer) { 
        let lx = {
            name: layer.name,
            filt: layer.filt,
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
        return this._createLayer(lx.name, lx.filt, lx.styleId, lx.label, lx.files);
    }
      
} /* class */

