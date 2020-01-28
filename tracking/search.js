/*
 Map browser based on OpenLayers 4. Tracking. 
 Search active tracker points on server.  
 
 Copyright (C) 2017 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Item search using tags (keywords) and free text. 
 */

pol.tracking.Search = class extends pol.core.Widget {
    
    constructor() 
    {
        super();
        this.classname = "tracking.Search"; 
        this.server = CONFIG.server; 
        this.tags = [];
        this.selected = {};
        const t = this;
        t.search = m.stream("*");
   
        this.widget = {
            view: function() {
                return m("div#search", [       
                    m("h1", "Search stations/objects"),
                    m("div#searchform", [
                        m("form", [ 
                            "Keywords (tags): ", br, 
                                m("div#tags", t.tags.filter(x=> prefixSel(x)).map( x=> {
                                    return m(checkBox, {id: "tag_"+x, onclick: apply(tagToggle, x)}, x)
                                })),
                            
                            
                            "Free text search: ", m(textInput, 
                                {id: "search", size: 10, maxLength: 40,value: t.search, regex: /^.*$/i}),
                            m("button#searchbutton", 
                                {onclick: searchHandler, type: "button"}, "Search" )
                        ])], 
                    br, m("div#searchresult"))]);
            }
        };
   
        getTags();
   
   
        
        function apply(f, x) {
            return () => { return f(x); } 
        }
        
        function searchHandler(e) {
            searchItems(t.search(), getTagArgs(), searchItemsCallback)                  
        }
                
        
        function tagToggle(x) {
            if (!t.selected[x])
                t.selected[x]=true;
            else
                delete t.selected[x]; 
        }
        

        
        /* Return true if prefix of x is among selected tags */
        function prefixSel(x) {
            const c = x.split('.');
            if (c.length == 1)
                return true
            for (i in t.selected)
                if (c[0] == i.split('.')[0])
                    return true;
            return false;
        }

   
        /* Get tags from server. Server API */
        function getTags() {
            t.server.GET("system/tags", null, 
                x=> {
                      t.tags = JSON.parse(x); 
                      m.redraw();
                    }
            );
        }
   

   
        /* Return tags that user has checked, as a comma separated list */
        function getTagArgs() {
            let tags = "";
            for (i in t.selected)
                tags = tags + (tags=="" ? "" : ",") + i;
            return tags;
        }
    
    
       
        /* Search using server API. Server returns HTML table (old API) */ 
        function searchItems(filt, tags, cb) {
            t.server.GET("/search", "ajax=true&lang="+
                (filt!=null && filt != '' ? '&srch='+filt : '') + 
                (tags!=null && filt != '' ? '&tags='+tags : ''), cb );
        }
   
   
    
        /* Process item-list (html table format) from server */
        /* FIXME: Consider using REST service with result in JSON format, rendered on client instead */
    
        function searchItemsCallback(info) {  
            if (info == null) 
                return; 
            let x = document.getElementById('searchresult');
            if (x != null) {
                x.innerHTML = info;                   
                t.setScrollTable("div#search", "div#searchresult");
            }    
        }
    
    } /* constructor */
} /* class */





pol.widget.setFactory( "tracking.Search", {
        create: () => new pol.tracking.Search()
    });
 
