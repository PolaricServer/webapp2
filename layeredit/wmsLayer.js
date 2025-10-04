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
        t.token = m.stream("");


        t.fields = {
            view: function() {
                return m("div.spec", [

                    m("div.field",
                        m("span.sleftlab", "Server: "),
                        m(textInput, {id:"wmsUrl", size: 40, maxLength:160, value: t.url, regex: /^.+$/i }),
                        m("button", { type: "button", onclick: getCap}, "Get")),

                    m("div.field",
                        m("span.sleftlab", "Token: "),
                        m(textInput, {id:"wmsParams", size: 32, maxLength:64, value: t.token, regex: /^.+$/i })),

                    m("div.field",
                        m("span.sleftlab", "Projection:"),
                        m(select, {id: "sel_srs", onchange: selectSRS, list: t.srs.map( x=> {
                            return {label: x, val: x, obj: null};
                        })})),

                    (t.cap==null ? null : m(t.wfields))
                ]);
            }
        }


        t.wlayers = {
            view: function() {
                  return  m("div#wlayers", t.sLayers.map( x=> {
                        return m(checkBox, {title: (x.Abstract=="" ? x.Title:x.Abstract), checked: x.checked, id: "layer_"+x.Name,
                            onchange: pol.ui.apply(tagToggle, x)}, limitLen(x.Title,32));
                    }));

            }
        }

        /* Fields representing capabilities of wms service (from GetCapabilities) */
        t.wfields = {
            view: function() {
                return m("div.wserver", [
                    m("div.field",
                        m("span.sleftlab", "Title: "),
                        m("span", {title: t.cap.Service.Abstract}, t.cap.Service.Title)),

                    m("div.field",
                        m("span.sleftlab", "Layers:"),
                        m(t.wlayers))
                ]);
            }
        }

        restoreSRS();

        function tagToggle(x) {
            if (x.checked != null)
                x.checked = !x.checked
            else
                x.checked = true;
        }

        function limitLen(x, len) {
            return x.substring(0,len-1)+(x.length>len? "..":"");
        }

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

                if (t.selected == null)
                    t.selected = $("#sel_srs").val();
                t.filterLayers(t.selected);
                if (handler)
                    handler();
            });
    }



    filterLayers(crs) {
        const t = this;
        t.sLayers = [];
        for (const i in t.layers) {
            for (const j in t.layers[i].CRS) {
                if (t.layers[i].CRS[j] == crs) {
                    t.sLayers.push(t.layers[i]);
                    break;
                }
            }
        }
    }



    /**
     * Return true if add button can be enabled
     */
    enabled() {
        return (this.url().length > 1);
    }


    /**
     * Get layers for WMS request as comma separated list
     */
    getReqLayers() {

        let layers = "";
        let first=true;

        /* FIXME: Make this a recursive function? Make sublayers selectable */
        for (i in this.sLayers) {
            if (this.sLayers[i].checked) {
                let n = this.sLayers[i].Name;
                if (n!=null)
                    add(n)
                else
                    for (const x of this.sLayers[i].Layer)
                        add(x.Name)
            }
        }
        return layers;

        function add(n) {
            if (n != null) {
                layers += (first ? "" : ",") + n;
                first=false;
            }
        }
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
               params: {'LAYERS':layers, VERSION: "1.1.1", token: (this.token()==""? null: this.token())}
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
        console.log("PARAMS", layer.getSource().getParams());
        this.url(layer.getSource().getUrl());
        this.token(layer.getSource().getParams().token);
        $("#sel_srs").val(layer.selSrs).trigger("change");

        this.getCapabilities( () => {
            for (i in this.sLayers) {
                if (this.sLayers[i] == null)
                    continue;
                if (this.sLayers[i].Name == layer.checkList[i].name)
                    this.sLayers[i].checked = layer.checkList[i].checked;
            }
            console.log("EDIT: layers", this.sLayers);
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








