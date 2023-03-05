/*
 Map browser based on OpenLayers 5. Layer editor. 
 WFS layer. 
 
 Copyright (C) 2017-2020 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
        t.wlabel = m.stream("");
        t.version = false;
        t.ftypes = []; 
        t.ftype = null;
        
        t.fields = {
            view: function() { 
                return m("div.spec", [ 
                    m("div.field", 
                        m("span.sleftlab", "WFS URL: "),   
                        m(textInput, {id:"wfsUrl", size: 40, maxLength:160, value: t.wurl, regex: /^.+$/i })
                    ),
 
                    m("div.field", 
                        m("span.sleftlab", "Feat. type: "),
                          m(select, {id: "wfsFtype", list: t.ftypes.map( x => {
                             return {label: x, val: x, obj: x}; 
                          }) }),
                          m("button#addButton", 
                            { type: "button", onclick: getFT, 
                              title: "Get feature-types from server"}, "Get" )
                    ),
                    
                    m("div.field", 
                        m("span.sleftlab", 
                          {title: "Label text. Use $(attr) to include feature attributes"}, 
                          "Label: "),
                        m(textInput, {id:"wfsLabel", size: 20, maxLength: 60, value: t.wlabel, regex: /^.+$/i })
                    ),     
                    
                    m("div.field", 
                        m("span.sleftlab", "Style: "),
                        m(select, {id: "wfsStyle", list: Object.keys(CONFIG.getStyles("wfs")).map( x => {
                            return {label: x, val: x, obj: CONFIG.styles[x]}; 
                        }) })
                    ),

                    m("div.field", 
                        m("span.sleftlab", "Std version: "),
                        m(checkBox, {id:"stdver", onclick: setVer, checked: t.version, 
                            title: "Check to use old standards version (wfs 1.1.0 / gml 3.1.1)" },
                            "Use old version"))
                ]);
            }
        }  
        
        function setVer() {
            t.version = !t.version;
            console.log("t.version=",t.version);
        }
      
        function getFT() {
            if (t.wurl() != "")
                t.getFeatureTypes()}
        
    } /* constructor */


    
    /**
     * Get Feature types through GetCapabilities call
     */
    getFeatureTypes() {
        fetch(this.wurl()+'?service=WFS&request=GetCapabilities')
            .then( response => response.text() )
            .then( txt => {
                this.ftypes = [];
                const xmlDoc = $.parseXML( txt );
                const $xml = $( xmlDoc ); 
                $xml.find("FeatureType").each( (index, elem) => {
                    this.ftypes.push($(elem).find("Name").text());
                });
                
                console.log(this.ftypes); 
                if (this.ftype != null)
                    setTimeout(()=> $("#wfsFtype").val(this.ftype).trigger("change"), 100);
                m.redraw();
            });
    }
    
    
    
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
        const styleId = $("#wfsStyle").val(); 
        const ftype = $("#wfsFtype").val();
        
        console.log("Create WFS layer: URL="+this.wurl()+", ftype="+ftype+
            ", style="+styleId+", label="+this.wlabel());
    
        const x = createLayer_WFS( {
            name: name,
            url: this.wurl(),
            ftype: ftype,
            style: (this.wlabel() != "" ? SETLABEL(styleId, this.wlabel()) : GETSTYLE(styleId)),
            newVersion: !this.version
        });
        x.styleId = styleId;
        x.label = this.wlabel();
        x.version = this.version;     

        return x;
    }



    /**
     * Move settings to web-form. 
     */
    edit(layer) {
        super.edit(layer);
        this.wurl(layer.getSource().baseurl);
        this.ftype = layer.getSource().ftype;
        this.wlabel(layer.label);
        this.version = layer.version;
        setTimeout(()=> $("#wfsStyle").val(layer.styleId).trigger("change"), 100);
        this.getFeatureTypes();
        
        // FIXME: This will not work since list of types is not loaded yet
        //setTimeout(()=> $("#wfsFtype").val(this.ftype).trigger("change"), 100);
    }

    
    reset() {
        super.reset(); 
        this.wurl("");
        this.ftype("");
        this.wlabel("");
        this.ftypes = [];
        this.version = false;
    }
    
    
    /**
     * Prepare for saving a layer to JSON format. 
     */   
    layer2obj(layer) { 
        const lx = {
            filter:  layer.filt,
            url:     layer.getSource().baseurl,
            ftype:   layer.getSource().ftype,
            oformat: layer.getSource().oformat,
            styleId: layer.styleId,
            label:   layer.label, 
            verison: layer.version
        };
        return lx;
    }

      
      
    /**
     * Restore a layer (see also layer2obj). 
     */
    obj2layer(lx) {
        if (lx == null) {
            console.warn("WfsLayer.obj2layer: Layer to be restored is null");
            return null;
        }   
        const x = createLayer_WFS( {
            url:   lx.url,
            ftype: lx.ftype,
            style: (lx.label && lx.label!=null ? SETLABEL(lx.styleId, lx.label) : GETSTYLE(lx.styleId)),
            outputFormat: lx.oformat,
            newVersion: !lx.version
        });
        x.predicate = this.createFilter(lx.filter);
        x.filt = lx.filter;
        x.styleId = lx.styleId;
        x.label = lx.label;
        x.version = lx.version;
        return x;
    }
      
} /* class */

