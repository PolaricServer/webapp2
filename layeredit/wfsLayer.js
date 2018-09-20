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
      
        this.fields = {
            view: function() { 
                return m("div.spec", [ 
                    m("span.sleftlab", "WFS URL: "),   
                    m(textInput, {id:"wfsUrl", size: 40, maxLength:160, regex: /^.+$/i }),br,
                    m("span.sleftlab", "Feat. type: "),
                    m(textInput, {id:"wfsFtype", size: 40, maxLength:80, regex: /^.+$/i }),br,
                    m("span.sleftlab", "Style: "),
                    m(select, {id: "wfsStyle", list: Object.keys(CONFIG.styles).map( x => {
                            return {label: x, val: x, obj: CONFIG.styles[x]}; 
                        }) }), br,
	       
                    m("span.sleftlab", "Label attr: "),
                    m(textInput, {id:"wfsLabel", size: 20, maxLength: 60, regex: /^.+$/i }),br
                ]);
            }
        }  
      
    } /* constructor */


    /**
    * Return true if add button can be enabled 
    */
    enabled() {
        return  $("#editLayer").attr("ok") && 
                $("#wfsUrl").attr("ok") && 
                $("#wfsFtype").attr("ok"); 
    }
      
      
      
    /**
     * Create a layer. 
     */
    createLayer(name) 
    {
        const url = $("#wfsUrl").val();
        const ftype = $("#wfsFtype").val();
        const styleId = $("#wfsStyle").val();
        const label = $("#wfsLabel").val();
        console.log("Create WFS layer: URL="+url+", ftype="+ftype+", style="+styleId+", label="+label);
        // FIXME: Sanitize input !!!!!
    
        var x = createLayer_WFS( {
            name: name,
            url: url,
            ftype: ftype,
            style: (label && label!=null ? SETLABEL(styleId, label) : GETSTYLE(styleId)),
            outputFormat: "text/xml; subtype\=gml/3.1.1"
        });
    
        x.styleId = styleId;
        x.label = label;
        return x;
    }



    /**
     * Move settings to web-form. 
     */
    edit(layer) {
        super.edit(layer);
   
        $("#wfsUrl").val(layer.getSource().url).trigger("change").attr("ok", true);;
        $("#wfsFtype").val(layer.getSource().ftype).trigger("change").attr("ok", true);;
        $("#wfsStyle").val(layer.styleId).trigger("change");
        $("#wfsLabel").val(layer.label).trigger("change");
    }

    
    
    /**
     * Prepare for saving a layer to JSON format. 
     */   
    layer2obj(layer) { 
        const lx = {
            name:    layer.get("name"),
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
            name:  lx.name, 
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

