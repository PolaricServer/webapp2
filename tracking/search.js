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
        t.result = [];
   
        /* Show result of search in a table */
        t.showRes = {
            view: ()=> {
                return m("table", m("thead", m("tr", 
                   [ m("th", "Ident"), m("th", "Updated"), m("th", "Dir"), m("th", "Description") ])),
                   m("tbody", t.result.map( x=> {
                       return m("tr", [ 
                         m("td.ident", {onclick: apply(gotoPos, x), title: idTitle(x)}, 
                         m("span."+idClass(x), formatIdent(x))),
                         m("td", formatTime(x.updated)), 
                         m("td", formatDir(x.course)), 
                         m("td", formatDescr(x.descr)) ]); 
                   })))
            }
        }
        
        /* Main widget */
        this.widget = {
            view: ()=> {
                return m("div#search", [       
                    m("h1", "Search stations/objects"),
                    m("div#searchform", [
                        m("form", [ 
                            "Keywords (tags): ", br, 
                                m("div#tags", t.tags.filter(x=> prefixSel(x)).map( x=> {
                                    return m(checkBox, {checked: t.selected[x], id: "tag_"+x, onchange: apply(tagToggle, x)}, x)
                                })),
                            
                            
                            "Free text search: ", m(textInput, 
                                {id: "search", size: 10, maxLength: 40,value: t.search, regex: /^.*$/i}),
                            m("button#searchbutton", 
                                {onclick: searchHandler, type: "button"}, "Search" ), nbsp,
                            m("span#found", "")
                        ])], 
                        br, 
                        m("div#searchresult")
                    )
                ]);
            }
        };
   
        getTags();
   
   
        
        function apply(f, x) {
            return () => { return f(x); } 
        }
    
    
        function searchHandler(e) {
            searchItems(t.search(), getTagArgs())                  
        }
    
    
        function gotoPos(x) {
            if (x.pos==null)
                return;
            CONFIG.mb.gui.removePopup();
            CONFIG.mb.goto_Pos(x.pos, false);
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
            if (!tagUsed(c[0]))
                return true; 
            for (i in t.selected)
                if (c[0] == i.split('.')[0])
                    return true;
            return false;
        }

        function tagUsed(x) {
            for (i in t.tags)
                if (x==t.tags[i])
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
        function searchItems(filt, tags) {
            t.server.GET("items"+
                '?srch='+(filt==null ? "*":filt)  + (tags!=null ? '&tags='+tags : ''), null, 
                x => {
                    t.result = JSON.parse(x);
                   /* 
                    * Mount mithril component for resulting table to #ttable div
                    * make table scrollable. 
                    */
                    m.mount($("div#searchresult").get(0), t.showRes);
                    t.setScrollTable("div#search", "div#searchresult");
                    /* Report number if items found */
                    $("span#found").text(t.result.length+" items found"); 
                }
            );
        }
        
        
        function idTitle(x) {
            const ii = x.ident.indexOf('@'); 
            if (ii<=0 && x.alias==null)
                return null;
            return x.ident + (x.alias==null? "": " | Alias='"+x.alias+"'"); 
        }
        
        
        
        function idClass(x) {
            const ii = x.ident.indexOf('@'); 
            let cl="";
            if (x.alias != null)
                cl="alias "; 
            if (ii>0)
                return cl+"obj";
            else 
                return cl;
        }
        
        
        function formatIdent(x) {
            const ii = x.ident.indexOf('@'); 
            if (x.alias != null)
                return x.alias; 
            else if (ii>0)
                return x.ident.substring(0, ii);
            else
                return x.ident;
        }
        
        
        function formatDescr(x) {
            if (x.length > 60) 
                return x.substring(0, 60)+" [..]";
            return x;
        }
        
        
        // FIXME: move to uiSupport. See trailInfo.js
        function formatDir(x) {
            if (x<0) return " ";
            else if (x < 22.5) return "N"; 
            else if (x < 67.5) return "NE";
            else if (x < 112.5) return "E";
            else if (x < 157.5) return "SE";
            else if (x < 202.5) return "S";
            else if (x < 247.5) return "SW"; 
            else if (x < 292.5) return "W"; 
            else if (x < 337.5) return "NW";
            else return "N";
        }
        
   
        // FIXME Move to uiSupport.js 
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        function formatTime(dt) {
            const d = new Date(dt);
            return "" +
                d.getDate()+ " "+months[d.getMonth()]+ " " +
                (d.getHours()<10 ? "0" : "") + d.getHours() + ":" +
                (d.getMinutes()<10 ? "0" : "") + d.getMinutes();
        }
    
    } /* constructor */
    
    
    /* Deselect all tags when opening window */
    onActivate() {
        this.selected = {};
        m.redraw();
    }
    
    
} /* class */







pol.widget.setFactory( "tracking.Search", {
        create: () => new pol.tracking.Search()
    });
 
