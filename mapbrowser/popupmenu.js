 
/*
 Map browser based on OpenLayers 5. 
 popup menus, context menus. 
 
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
 * Popup Menu class.
 */

pol.core.PopupMenu = class {
   
   /**
    * Constructor.
    * @param {pol.core.Popup} popupmgr - Instance of Popup class. 
    * @param {Element|null} heading - Heading on top of menu (null = no heading)
    */
    constructor(popupmgr, heading) {
        this.popupmgr = popupmgr;
        this.lastItem = null;
        this.menudiv = document.createElement('div');
        this.heading = heading;
        this.sections = [];
        this.secNo = 0;
    }


    /**
     * Clear content of menu.
     */
    clear() {  
        this.lastItem = null;
        this.menudiv = document.createElement('div');
        this.secNo = 0;
        this.sections = [];
    }



    /**
    * Add a heading to the menu.
    * @param {Element|null} heading - Heading on top of menu (null = no heading)
    */
    setHeading(hd) {
        this.heading = hd; 
    }



    /**
    * Add a item to the menu (text, function, function-argument). 
    * If text is null, this is meant a section separator. 
    * @param {string|null} txt - Text of menu item 
    * @param {function} func - Function to be executed when item is selected.
    * @param {*} arg - Argument to function.
    */
    add(txt, func, arg)
    {
        if (txt == null) { 
            this.lastItem.className = 'ITEM_sep';
            this.sections[this.secNo++] = this.lastItem;
        }
        else {
            var atxt  = (txt == null ? '' : txt);
            var alink = (func == null ? '' : func);
            this.lastItem = this.createItem_(atxt, alink, arg);
            this.menudiv.appendChild(this.lastItem);
        }
    }



    /**
     * Add a section separator to the menu. 
     */
    addSeparator()
        { this.add(null); }


   
    /**
     * Add a item to a given section in a menu. Sections are numbered 
     * from 0 (first section) and up.
     * @param {number} sect - Section index. 
     * @param {string|null} txt - Text of menu item 
     * @param {function} func - Function to be executed when item is selected.
     * @param {*} arg - Argument to function.
     */
    insert(sect, txt, func, arg)
    {
        assert(sect>=0 && sect<this.sections.length, "Assertion failed");
   
        if (this.secNo == 0) {
            this.add(txt,func,arg);
            return;
        }
        if (sect >= this.secNo)
            sect = this.secNo-1;
        this.sections[sect].className = '';
   
        /* Insert immediately after sectons[sect] */
        var atxt  = (txt == null ? '' : txt);
        var alink = (func == null ? '' : func);
        var newNode = this.createItem_(atxt, alink, arg);
        this.sections[sect].parentNode.insertBefore(newNode, this.sections[sect].nextSibling);
        newNode.className = 'ITEM_sep';
        this.sections[sect] = newNode;
    }



    /**
     * Activate a menu on a specific point on the screen, i.e. show it on the screen.
     * @param {number} x - Pixel position x. 
     * @param {number} y - Pixel position y.
     * @returns {Element} DOM element of menu.
     */
    activate(x, y)
    {
        console.assert(x>0 && y>0, "Assertion failed");
    
        if (this.lastItem != null)
            this.lastItem.className = 'ITEM_last';
       
        var isMenu = true;
        var wrapper = document.createElement('div');
    
        if (this.heading != null) {
            var h = document.createElement("H1");
            var t = document.createTextNode(this.heading); 
            h.appendChild(t);  
            wrapper.appendChild(h);
        }
        wrapper.appendChild(this.menudiv);
        wrapper.style.display = 'none';
        wrapper.className = 'POPUPMENU';
        wrapper.onmousemove = function(e) { e.stopPropagation(); return null; }
        this.popupmgr.popup_(wrapper, x, y, false);  
        return wrapper; 
    }



    /**
     * Create item. 
     * @private
     */
    createItem_(text, actn, arg)
    {
        var t = this;
        var elem = document.createElement('div');
        elem.origCls = '';
        if (isMobile)
            // Tap listener on mobile devices.. (?)
            elem.addEventListener('tap', ()=> { 
                _executeItem(elem, actn, arg);  e.cancelBubble=true; }, false); 
        
        /* Mouse event listeners */
        elem.onmouseup   = function(e) { 
            _executeItem(elem, actn, arg); 
        }
        elem.onmousedown = function(e) { 
            _executeItem(elem, actn, arg);  e.cancelBubble=true;
        }
        elem.onmouseover = function(e) { 
            elem.origCls = elem.className; 
            elem.className += ' ITEM_hover'; 
        }                                
        elem.onmouseout  = function(e) { 
            elem.className = elem.origCls;
        }
        elem.appendChild(document.createTextNode(text));
        return elem;
  
        /* Execute action on menu item */
        function _executeItem(elem, actn, arg) { 
            if (elem.active)
                return;
            elem.className += ' ITEM_selected';
            elem.active=true;
            setTimeout( ()=> { 
                t.popupmgr.removePopup(); 
                actn(arg); 
                elem.active=false; 
            }, 300); 
        }
    }
}

/************************************************************************/


  
 /**
  * Add handler for mouse event.
  * @param {Element} element - DOM element. 
  * @param {boolean} icon - True if element is a icon that can react on left mouse click.
  * @param {function} func - Handler function to be invoked on click. 
  */
 
pol.core.addHandler = function (element, icon, func)
{
    var t = this;
    var rect = null; 
    if (icon) {      
        var rect = element.getBoundingClientRect();
        element.onclick = _handler;
    }
    element.oncontextmenu = _handler;
    
    function _handler(e) {
        if (rect != null) {
            e.iconX = rect.right-10;
            e.iconY = rect.bottom-6;
        }
        func(e);
        e.cancelBubble = true;   
        return false;
    }
}

 
 
 /**
  * Add handler for mouse event.
  * @param {String} domId - Id of DOM element 
  * @param {boolean} icon - True if element is a icon that can react on left mouse click.
  * @param {function} func - Handler function to be invoked on click. 
  */
  
pol.core.addHandlerId = function (domId, icon, func)
{    
    var element = document.getElementById(domId);
    pol.core.addHandler(element,icon,func);
} 


 
 /**
  * CONTEXT MENU CLASS.
  */

pol.core.ContextMenu = class {
    
   /**
    * Constructor.
    * @param {pol.core.Popup} mgr - Popup manager.
    */
    constructor(mgr) {
        this.callbacks = new Array(); 
        this.txt = new pol.core.PopupMenu(mgr, null);
    }
 
 
 
    /** 
     * Register a callback function that dynamically adds menu-items 
     * to some context. Can be called by plugin code.
     * If context exists, the function will typically add to existing menu items. 
     * 
     * Builtin contexts are 'MAP' and 'TOOLBAR'. More context can be added. 
     * 
     * @param {string} context - Name of the context. 
     * @param {function} func - Callback function.
     */
    addCallback(context, func)
    {
        if (!this.callbacks[context])
            this.callbacks[context] = new Array();
        this.callbacks[context].push(func);
    }
  
  
 
    /**
     * Show the menu for a context.
     * @param {string} ctxt - Context identifier
     * @param {number} x - Pixel position x. 
     * @param {number} y - Pixel position y.
     */ 
    show(ctxt, x, y)  {
        console.assert(ctxt != null && ctxt.name && x>0 && y>0, "Assertion failed");
        var t = this; 
        t.txt.clear();
        t.txt.x = x; 
        t.txt.y = y;
   
        /* Try to find the context. By default it is the id of the 
         * element we clicked on. 
         */
        var cname = ctxt.name, ident = ctxt.name;
        if (ident == null)    
            cname = 'MAP';
        else if (ident === "_STOP_")
            return;
        _doCallback(cname);         
   
        /* Activate menu and add the context-name as a CSS class */
        this.txt.activate(x, y).className += ' ctxt_'+cname;
   
   
        /*
         * Internal function that executes plugin callbacks
         */
        function _doCallback(cname)
        {
            const lst = t.callbacks[cname]; 
            if (lst)
            for (i=0; i<lst.length; i++) {
                const f = lst[i]; 
                if (f != null) 
                f(t.txt, ctxt); 
            }    
        }
    } 
 
 
 
    /**
     * Associate a popup menu with a DOM element. 
     * @param {Element} element - DOM element. 
     * @param {string} name - Name of menu context.
     * @param {boolean} icon - True if element is a icon that can react on left mouse click.
     * @param {Function|undefined} contextfunc - Function that return a context. If null the default 
     * name will be used.
     */
    addMenu(element, name, icon, func) {
        var t = this;
        pol.core.addHandler(element, icon, e => 
            {   var n = null;
                if (func) n = func(e);
                if (n == null)
                    t.showHandler(element, e, {name:name}, icon); 
                else
                    t.showHandler(element, e, n, icon); 
            } );
    }
 
 
  
    /**
     * Associate a popup menu with a DOM element. 
     * @param {string} domId - Id of DOM element. 
     * @param {string} name - Name of menu context.
     * @param {boolean} icon - True if element is a icon that can react on left mouse click.
     * @param {Function|undefined} contextfunc - Function that return a context. If null the default 
     * name will  be used.
     */
    addMenuId(domId, name, icon, func) {
        var element = document.getElementById(domId);
        this.addMenu(element, name, icon, func);
    }
 
 
    showOnPos(ctxt, pix) {
        this.show(ctxt, pix[0]+3, pix[1]);
    }
 
 
    showHandler(element, e, ctxt, icon)
    {
        e = (e)?e:((event)?event:null);
   
        /* If icon, use position relative to icon instead of mouse pos */
        if (icon) { 
            this.show(ctxt, e.iconX, e.iconY);
        }
        this.show(ctxt, e.clientX+3, e.clientY); 
    }
 
 
} 
 /******************** End of Context menu class  **********************/
 
