/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2020 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Reference search (in a popup window). 
 */

pol.tracking.Tags = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        
        t.server = CONFIG.server;
        t.ident = m.stream("");
        t.tag = m.stream("");
        t.tagsOn = [];
        t.usedTags = [];
        t.classname = "tracking.Tags"; 

        this.widget = {
            view: function() {
                var i=0;
                return m("div#itemtags", [       
                    m("h1", "Tags for "+t.ident()), 
                    
                    m("div.tagList", t.tagsOn.map( x=> {
                        return [ m("span.box", [ 
                            m("img",  {src: "images/edit-delete.png", onclick: apply((x)=>t.remove(x), x)}),
                            m("span", x), nbsp]
                        ), " "]
                    })), 
                    m(textInput, {list: "usedTags", value: t.tag}),
                    m("datalist#usedTags", t.usedTags.map( x=> {
                        return m("option", x)
                    })), 
                    
                    m("button", { type: "button", onclick: add }, "Add")
                ])
            }
        };
        
        
        function add() {
            let arg = [t.tag];
            t.server.POST("item/"+t.ident()+"/tags", JSON.stringify(arg),
                ()=> { t.getTags(); },
                (x)=> { console.warn("Couldn't add tag: "+x); }
            );
        }
        
        
    
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
    } /* constructor */
    
    
    remove(x) {
        this.server.DELETE("item/"+this.ident()+"/tags/"+x,
            ()=> { this.getTags(); m.redraw();  }, 
            (x)=> { console.warn("Couldn't delete object: "+x); })
    }
    
    onActivate() {
        setTimeout(()=>{this.getTags()}, 1000);
    }

    
    setIdent(id) {
        this.ident(id);
        m.redraw();
    }
    
    
    /* Get list of tags from backend server */
    getTags() {
        this.server.GET("system/tags", null,
            x=> { 
                this.usedTags=JSON.parse(x); 
                this.usedTags.sort((x,y)=> {return x>y}); 
                m.redraw();
            },
            ()=> { console.warn("Couldn't get tag list"); }
        )
        
        this.server.GET("item/"+this.ident()+"/tags", null,
            x=> { 
                this.tagsOn=JSON.parse(x);
                this.tagsOn.sort((x,y)=> {return x>y});
                m.redraw() 
            },
            ()=> { console.warn("Couldn't get tag-list for item"); }
        )
    }
        
    
} /* class */


pol.widget.setFactory( "tracking.Tags", {
        create: () => new pol.tracking.Tags()
    });

