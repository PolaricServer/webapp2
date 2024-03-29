/*
 Map browser based on OpenLayers. Layer editor. 
 WMS layer. 
 
 Copyright (C) 2018-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * WMS layer editor.
 */

pol.layers.Wms = class extends pol.layers.Edit {

    constructor(list) {
        super(list);  
        const t=this;
        t.cap = null;   
        t.layers = [];
        t.sLayers = [];
        t.srs = '';
        

        
        t.selected = this.srs[0];
        t.url = m.stream("");

    
        t.fields = {
            view: function() { 
                return m("div.spec", [ 
                    m("span.sleftlab", "Server: "),   
                    m(textInput, {id:"wmsUrl", size: 40, maxLength:160, value: t.url, regex: /^.+$/i }),
                    m("button", { type: "button", onclick: getCap}, "Get"),
                    br,
                    m("span.sleftlab", "Projection:"),
                    m(select, {id: "sel_srs", onchange: selectSRS, list: t.srs.map( x=> {
                        return {label: x, val: x, obj: null};
                    })}),  
                    br,
                    (t.cap==null ? null : m(t.wfields))
                ]);
            }
        }   
    
        /* Fields representing capabilities of wms service (from GetCapabilities) */
        t.wfields = {
            view: function() { 
                return m("div.wserver", [ 
                    m("span.sleftlab", "Title: "),
                    m("span", {title: t.cap.Service.Abstract}, t.cap.Service.Title), br,    
                    m("span.sleftlab", "Layers:"),
                    m("table", {id: "layerSelect"}, m("tbody", t.sLayers.map( x => {
                        return m("tr", [ 
                            m("td", {cssclass: (x.level2 ? "level2" : null)}, 
                            m(checkBox, {onclick: apply(selLayer, x), checked: x.checked}, x.Title))
                        ])
                    })))
                ]);
            }
        }
 
        restoreSRS();
   
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() {f(id); }};  
   
    
        function getCap() {
            t.getCapabilities(m.redraw);
        }
    
        async function restoreSRS() {
            t.srs = await CONFIG.get('core.supported_proj');
            if (t.srs == null)
                t.srs = await CONFIG.get('core.projection');
        }
        
        function selectSRS() {
            t.selected = $("#sel_srs").val();
            if (t.cap != null)
                t.filterLayers(t.selected);
        }
    
        function selLayer(x) {
            x.checked = !x.checked; 
        }
    
    } /* constructor */



    reset() {
        super.reset();
        this.url("");
    }
    
    /*
     * Get capabilities from WMS server
     */
    getCapabilities(handler) {
        const t = this;
        t.layers=[];
        t.sLayers=[];
    
        const parser = new ol.format.WMSCapabilities();
        fetch(this.url()+'?service=wms&request=GetCapabilities')
            .then( response => response.text() )
            .then( txt => {
                t.cap = parser.read(txt);
                if (t.cap.Capability.Layer.Layer) {
                    for (i in t.cap.Capability.Layer.Layer) {
                        const x = t.cap.Capability.Layer.Layer[i];
                        t.layers.push(x);
                    }
                }
                else if (t.cap.Capability.Layer)
                    t.layers[0] = t.cap.Capability.Layer;

                t.filterLayers(t.selected);
                if (handler)
                    handler();
            });
    }



    filterLayers(crs) {
        const t = this;
        t.sLayers = [];
        for (const i in t.layers)
            for (const j in t.layers[i].CRS)
                if (t.layers[i].CRS[j] == crs) {
                    t.sLayers.push(t.layers[i]);
                    break; 
                }
    }



    /**
     * Return true if add button can be enabled 
     */
    enabled() {
        return  $("#editLayer").attr("ok") && 
                $("#wmsUrl").attr("ok"); 
    }


    /**
     * Get layers for WMS request as comma separated list 
     */
    getReqLayers() {
        let layers = "";
        let first=true;
        for (i in this.sLayers) {
            if (this.sLayers[i].checked) {
                layers += ((first ? "" : ",") + this.sLayers[i].Name);
                first=false; 
            }
        }
        return layers; 
    }



    /**
     * Create a OL layer. 
     */
    createLayer(name) {
        const layers = this.getReqLayers();
        console.log("Create WMS layer: URL="+this.url()+", layers="+layers);
       
        var x = new ol.layer.Image({
            name: name, 
            source: new ol.source.ImageWMS ({
               ratio:  1,
               url:    this.url(),
               params: {'LAYERS':layers, VERSION: "1.1.1"}
            }) 
        });
        x.selSrs = this.selected; 
        x.checkList = [];
        for (i in this.sLayers) 
            x.checkList[i] = {name: this.sLayers[i].Name, checked: this.sLayers[i].checked}; 
        return x;
    }
  
 
 
    /**
     * Move settings to web-form. 
     */  
    edit(layer) {
        super.edit(layer);
   
        /* Specific to WMS layer */
        this.url(layer.getSource().getUrl());
        $("#sel_srs").val(layer.selSrs).trigger("change");
   
        this.getCapabilities( () => {
            for (i in this.sLayers) 
                if (this.sLayers[i].Name == layer.checkList[i].name) 
                    this.sLayers[i].checked = layer.checkList[i].checked; 
            m.redraw();
        });
    }



    /**
     * Stringify settings for a layer to JSON format. 
     */
    layer2obj(layer) { 
        const lx = {
            filter:  layer.filt,
            url:     layer.getSource().getUrl(),
            params:  layer.getSource().getParams(),
            checked: layer.checkList,
            srs:     layer.selSrs
        };
        return lx;
    }



    /**
    * Restore a layer from JSON format (see layer2obj). 
    */
    obj2layer(lx) {
        if (lx == null) {
            console.warn("WmsLayer.obj2layer: Resulting Layer is null");
            return null;
        }  
        const x = new ol.layer.Image({
 //           name: lx.name, 
            source: new ol.source.ImageWMS ({
               ratio:  1,
               url:    lx.url,
               params: lx.params
            }) 
        });   
        x.predicate = this.createFilter(lx.filter);
        x.filt = lx.filter;
        x.selSrs = lx.srs;
        x.checkList = lx.checked;
        return x;
    }

} /* class */

   
   
   
   
   
   
   
