/*
 Map browser based on OpenLayers.
 configuration support.

 Copyright (C) 2017-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

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


/** @namespace */
var pol = pol || {};
pol.core = pol.core || {};
pol.widget = pol.widget || {};
pol.ui = pol.ui || {};
pol.mapref = pol.mapref || {};

console.assert = console.assert || function() {};


const sleep = ms => new Promise(r => setTimeout(r, ms));


/**
 *  Configuration of map browser application.
 */

pol.core.Config = class extends ol.Object {

   /*
    *  Constructor
    *  @param {string} uid - Identifier of configuration (see also setUid).
    */
    constructor (uid) {
        super();
        this.uid = (uid ? uid : "0");
        this.mb = null;
        this.server = null;
        this.xstorage = null;
        this.storage = window.localStorage;
        this.sstorage = window.sessionStorage;
        this.baseLayers = [];
        this.oLayers = [];
        this.oLayersCount = 0;
        this.aMaps = new Array();
        this.styles = {};
        this.server = null;
        this.widgets = [];

        this.props = {
            projection: "EPSG:3857",
            center: [0,0]
        }
    }





    getStyles(tag) {
        let st = {};
        for (const k in this.styles) {
            if (typeof this.styles[k].tag != "undefined" && this.styles[k].tag.test(tag))
                st[k] = this.styles[k];
        }
        return st;
    }




    /**
     * Get array of configured base layers.
     */
    getBaseLayers()
        { return this.baseLayers; }



    /**
     * Get array of configured overlay layers.
     */
    getOLayers()
        { return this.oLayers; }



    /**
     * Add to the configured list of layers.
     * @param {Layer} layer to be added.
     * @param {String|undefined} Name/decription to be used in layer switcher.
     * @returns Index of new layer.
     */

    addLayer(layer, name) {
        console.assert(layer != null, "layer=null");
        if (name && name != null)
            layer.set("name", name);
        layer.wasOn = false;
        if (!layer.predicate)
            layer.predicate = function() {return true;}
        return this.oLayers.push(layer) - 1;
    }




    removeLayer(layer) {
        console.assert(layer != null, "layer=null");
        if (layer==null)
            return;
        for (const i in this.oLayers)
            if (this.oLayers[i] === layer) {
                this.oLayers.splice(i, 1);
                return;
            }
    }




    /**
     *  Set an id to distinguish between different users or sessions
     *  when using local-storage to store config-values persistently.
     *  @param {string} uid - Identifier.
     *
     */
    setUid (uid)
        { this.uid = uid; }


    /*
     * Set external storage.
     */
    setXStorage(storage) {
        this.xstorage = storage;
    }


    /**
     *  Get a setting. If stored in browser sesson storage, return this, if not try local storage.
     *  If still not found, return the default setting (see set method).
     *  @param {string} id - key of setting.
     *  @returns The value of the setting.
     */
    async get(id) {
        console.assert(id!=null, "id=null");

       /* Look in session-storage first. if not found there,
        * look in local-storage, if not found there,
        * look in in-memory properties.
        */
        let data = this.sstorage["polaric."+id];
        if (data==null) {
            const key = "polaric."+id + ":" + this.uid;
            if (this.xstorage != null)
                data = await this.xstorage.get(key);
            else
                data = this.storage[key];
        }
        const x = (data ? JSON.parse(data) : null );
        if (x==null && this.props[id] != null)
            return this.props[id];
        return x;
    }


    getDefault(id) {
        console.assert(id!=null, "id=null");
        return this.props[id];
    }




    /**
     *  Store value in browser storage. To be used in application.
     *  The value will be persistent and shared across different browser sessions
     *  (saved in local-storage).
     *
     *  @param {string} id - Key of setting.
     *  @param {*} value - Value of setting.
     *
     */
    store(id, value) {
        console.assert(id != null && value != null, "id="+id+", value="+value);
        const val = JSON.stringify(value);
        const key = "polaric." + id + ":" + this.uid;

        if (this.xstorage != null)
            this.xstorage.put(key, val);
        else
            this.storage[key] = val;
    }


    /**
     *  Store value in browser storage. To be used in application.
     *  The scope of this value is within one browser tab and one browser session.
     *  (saved in session-storage).
     *
     *  @param {string} id - Key of setting.
     *  @param {*} value - Value of setting.
     *
     */
    storeSes(id, value) {
        console.assert(id != null && value != null, "id="+id+", value="+value);
        const val = JSON.stringify(value);
        this.sstorage["polaric." + id] = val;
    }



    /**
     *  Remove value from local storage.
     * @param {string} id - Key of setting.
     */
    remove(id) {
        console.assert(id!=null, "id=null");
        this.sstorage.removeItem("polaric."+id);
        const key = "polaric." + id + ":" + this.uid;
        if (this.xstorage != null)
            this.xstorage.remove(key);
        else
            this.storage.removeItem(key);
    }



    /**
     *  Set a config value. Used as default setting. To be used in config file.
     *  @param {string} id - Key of setting.
     *  @param {*} value - Value of setting
     *
     */
    set(id, value) {
        console.assert(id != null && value != null, "id="+id+", value="+value);
        this.props[id] = value;
    }


    /**
     * Clear session storage and persistent storage
     */
    clear() {
        this.sstorage.clear();
        this.storage.clear();
    }



} /* class */



const CONFIG = new pol.core.Config(pol.uid);

