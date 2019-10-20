/*
 Map browser based on OpenLayers 5. Layer editor. 
 WFS layer. 
 
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



/**
 * WFS layer editor.
 */

pol.layers.Wfs = class extends pol.layers.Edit {
    
    constructor(list) {
        super(list); 
        const t=this;
        t.wurl = m.stream("");
        t.ftype = m.stream("");
        t.wlabel = m.stream("");
        
        
        t.fields = {
            view: function() { 
                return m("div.spec", [ 
                    m("span.sleftlab", "WFS URL: "),   
                    m(textInput, {id:"wfsUrl", size: 40, maxLength:160, value: t.wurl, regex: /^.+$/i }),br,
                    m("span.sleftlab", "Feat. type: "),
                    m(textInput, {id:"wfsFtype", size: 40, maxLength:80, value: t.ftype, regex: /^.+$/i }),br,
                    m("span.sleftlab", "Style: "),
                    m(select, {id: "wfsStyle", list: Object.keys(CONFIG.styles).map( x => {
                            return {label: x, val: x, obj: CONFIG.styles[x]}; 
                        }) }), br,
	       
                    m("span.sleftlab", "Label attr: "),
                    m(textInput, {id:"wfsLabel", size: 20, maxLength: 60, value: t.wlabel, regex: /^.+$/i }),br
                ]);
            }
        }  
      
    } /* constructor */


    /**
    * Return true if add button can be enabled 
    */
    enabled() {
        return  this.lName && 
                this.wurl() && this.ftype; 
    }
      
      
      
    /**
     * Create a layer. 
     */
    createLayer(name) 
    {
        console.log("Create WFS layer: URL="+this.wurl()+", ftype="+this.ftype()+
            ", style="+styleId+", label="+this.wlabel());
    
        const x = createLayer_WFS( {
            name: name,
            url: this.wurl(),
            ftype: this.ftype(),
            style: (this.wlabel() != "" ? SETLABEL(styleId, this.wlabel()) : GETSTYLE(styleId)),
            outputFormat: "text/xml; subtype=gml/3.2.1",
            wfsVersion: "1.1.0"
        });
    
        x.styleId = styleId;
        x.label = this.wlabel();
        return x;
    }



    /**
     * Move settings to web-form. 
     */
    edit(layer) {
        super.edit(layer);
        this.wurl(layer.getSource().url);
        this.ftype(layer.getSource().ftype);
        this.wlabel(layer.label);
        $("#wfsStyle").val(layer.styleId).trigger("change");
    }

    
    reset() {
        super.reset(); 
        this.wurl("");
        this.ftype("");
        this.wlabel("");
    }
    
    
    /**
     * Prepare for saving a layer to JSON format. 
     */   
    layer2obj(layer) { 
        const lx = {
            filter:  layer.filt,
            url:     layer.getSource().url,
            ftype:   layer.getSource().ftype,
            oformat: layer.getSource().oformat,
            styleId: layer.styleId,
            label:   layer.label 
        };
        return lx;
    }

      
      
    /**
     * Restore a layer (see also layer2json). 
     */
    obj2layer(lx) {
        if (lx == null) {
            console.warn("WfsLayer.json2layer: Resulting Layer is null");
            return null;
        }   
        const x = createLayer_WFS( {
            url:   lx.url,
            ftype: lx.ftype,
            style: (lx.label && lx.label!=null ? SETLABEL(lx.styleId, lx.label) : GETSTYLE(lx.styleId)),
            outputFormat: lx.oformat
        });
        x.predicate = this.createFilter(lx.filter);
        x.filt = lx.filter;
        x.styleId = lx.styleId;
        x.label = lx.label;
        return x;
    }
      
} /* class */

