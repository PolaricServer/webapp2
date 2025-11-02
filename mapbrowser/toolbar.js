 /*
    Map browser based on OpenLayers 5.
    Toolbar.

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



var pol = window.pol;
/**
 * Toolbar class.
 * @constructor
 * @param {Object.<string,*>} opt - Options
 * @param {pol.core.MapBrowser} br - Map browser instance
 */
pol.core.Toolbar = class extends ol.control.Control  {

    constructor(opt, brs) {
        const options = opt || {};
        const elem = document.createElement('div');
        elem.className = 'toolbar ol-unselectable ol-control';

        super({
            element: elem,
            target: options.target
        });

        this.browser = brs;
        this.lastElem = null;
        this.sections = [];
        this.nextSect = 0;
    } /* constructor */



    addSection() {
        const sx = document.createElement('div');
        this.element.appendChild(sx);
        this.sections[this.nextSect++] = sx;
    }


    /**
     * Activate default icons and menus on toolbar.
     */
    setDefaultItems()
    {
        /* Default icons */
        this.addSection();
        this.addIcon(0, "images/menu.png", "toolbar", null, "Main menu");
        this.addSection();

        this.addIcon(1, "images/layers.png",  "tb_layers", null, "Layer selector");
        this.addIcon(1, "images/areaselect.png", "tb_area", null, "Area menu");
        this.addSection();
        this.addIcon(2, "images/ruler1.png", "tb_measure", null, "Measure distance");
        const t = this;

        /* Layer selection menu */
        pol.core.addHandlerId("tb_layers", true,
            (e)=> WIDGET("core.LayerSwitcher", [e.iconX, e.iconY], true));

        /* Distance measurement */
        let measure_on = false;
        let measure = null;
        pol.core.addHandlerId("tb_measure", true,
            (e)=> {
                measure_on = (measure_on ? false : true);
                if (measure_on){
                    measure = new pol.core.Measure();
                    $("#tb_measure").attr("class", "selected");
                }
                else {
                    $("#tb_measure").attr("class", "");
                    if (measure!=null)
                        measure.deactivate();
                }
            } );


        this.browser.ctxMenu.addMenuId("toolbar", "TOOLBAR", true);
        this.browser.ctxMenu.addMenuId('tb_area', 'AREASELECT', true);


        /* Generate menu of predefined areas (defined in mapconfig.js */
        this.browser.ctxMenu.addCallback('AREASELECT',
            (m)=> {
                let w = getWIDGET("core.AreaList");
                for (const i in w.myAreas) {
                    const area = w.myAreas[i];
                    if (area && area != null)
                        m.add(area.name, handleSelect(w.myAreas, i));
                }

                if (w.myAreas.length > 0)
                    m.add(null);
                if (CONFIG.server!=null && CONFIG.server.isAuth() && CONFIG.server.hasDb) {
                    m.add("Edit YOUR areas..", ()=> WIDGET("core.AreaList", [90,70], true));
                    m.add(null);
                }

                for (const i in this.browser.config.aMaps) {
                    const aMap = this.browser.config.aMaps[i];
                    if (aMap && aMap.name && aMap.name.length > 1 && !aMap.hidden )
                        m.add(aMap.title, handleSelect(this.browser.config.aMaps, i));
                }


                function handleSelect(a, i) {
                    return function() {
                        CONFIG.browser.gotoExtent(a[i]);
                    }
                }
            });
    }


    /*
     * Set map object. Called from superclass.
     */
    setMap(map) {
        super.setMap(map);
    }


    /**
    * Add icon to toolbar.
    * @param {string} f - Filename/url for icon.
    * @param {String} id - Id for DOM element.
    * @param {function|null} action - Handler function.
    * @param {string|undefined} title
    * @return DOM element for the icon.
    */
    addIcon(i, f, id, action, title) {
        const x = document.createElement('img');
        if (id != null)
            x.setAttribute("id", id);
        x.setAttribute('src', f);
        if (title)
            x.setAttribute('title', title);

        this.sections[i].appendChild(x); // FIXME: Legal index?
        this.lastElem = x;
        if (action && action != null)
            x.onclick = action;
        return x;
    }


    /**
     * Change image, action and/or title of an icon
     */
    changeIcon(id, f, action, title) {
        const x = document.getElementById(id);
        if (x==null)
            return
        x.setAttribute('src', f);
        if (action && action != null)
            x.onclick = action;
        if (title)
            x.setAttribute('title', title);
    }


    /**
     * Add a div to toolbar
     */
    addDiv(i, id, title, cls) {
        const x = document.createElement('div');
        if (id != null)
            x.setAttribute("id", id);
        if (title)
            x.setAttribute("title", title);
        if (cls)
            x.className = cls;

        this.sections[i].appendChild(x);
        this.lastElem = x;
        return x;
    }


    /**
     * Change title and/or css class on div
     */
    changeDiv(id, title, cls) {
        const x = document.getElementById(id);
        if (x==null)
            return false;
        if (title != null)
            x.setAttribute("title", title);
        if (cls != null)
            x.className = cls;
        return true;
    }

    hideDiv(id, hide) {
        const x = document.getElementById(id);
        if (x==null)
            console.warn("Toolbar.hidediv()", "Element not found: "+id);
        else {
            x.style.visibility = (hide ? 'hidden' : 'visible');
            x.style.width = (hide ? '0' : 'unset');
        }
    }

    divExists(id) {
        return document.getElementById(id) != null;
    }

    /**
     * Add spacing betwen icons on toolbar.
     */
    ddSpacing() {
        if (this.lastElem != null)
            this.lastElem.className += " x-space";
    }

} /* class */


