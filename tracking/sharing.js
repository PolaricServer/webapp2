/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2021 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.tracking.db.Sharing = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        
        t.server = CONFIG.server;
        t.ident = 430;
        t.name = "";
        t.tag = "TAG";
        t.user = m.stream("");
        t.shareList = [];
        t.userList = [];
        t.readonly = true; 
        t.classname = "tracking.db.Sharing"; 
        
        
        this.widget = {
            view: function() {
                var i=0;
                return m("div#sharing", [       
                    m("h1", "User access/sharing"), 
                    (t.name!=null && t.name!="" ? m("span#objname", t.tag+": "+t.name) : ""),
                    m("div.tagList", t.shareList.map( x=> {
                        return [ m("span.box", [ 
                            m("img",  {src: "images/edit-delete.png", onclick: apply((x)=>t.remove(x), x.userid)}),
                                (x.readOnly ? m("span.ulistro", x.userid) : m("span.ulistitem", x.userid)) 
                            ])]
                    })), 
                    m(textInput, {list: "userList", value: t.user}),
                    m("datalist#userList", t.userList.map( x=> {
                        return m("option", x)
                    })), 
                    m("span#ro", 
                        m(checkBox, { id:"full", onclick: toggleRo, checked: t.readonly }, "Read-only ")), nbsp,
                    m("button", { type: "button", onclick: add }, "Add")
                ])
            }
        };
        
        

        this.server.GET("usernames", null,
            x=> { 
                t.userList=JSON.parse(x);
                t.userList.sort((x,y)=> {return x > y});
                m.redraw() 
            },
            ()=> { console.warn("Couldn't get user list"); }
        );
            
        t.getShares();
        
            
        function toggleRo() {
            t.readonly = !t.readonly; 
        }
            
            
        function add() {
            if (!isUser(t.user())) {
                alert("Unknown user: "+t.user());
                return;
            }

            let arg = {userid: t.user(), readOnly: t.readonly}; 
            t.server.POST("objects/"+t.tag+"/"+t.ident+"/share", JSON.stringify(arg),
                ()=> { t.getShares(); },
                (x)=> { console.warn("Couldn't add user: "+x); }
            );
             
            /* If drawing layer add sharing to features as well */
            if (t.tag=="Layer" && t.type=="drawing") {
                const tag = encodeURIComponent("feature."+t.name);
                t.server.POST("objects/"+tag+"/_ALL_/share", JSON.stringify(arg),
                    ()=> {},
                    (x)=> { console.warn("Couldn't add user: "+x); }
                );
            }
        }
        
        
        function isUser(u) {
            for (const x of t.userList) {
                if (x==u)
                    return true;
            }
            return false;
        }
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        
    } /* constructor */
    
    
    
    remove(uid) {
        this.server.DELETE("objects/"+this.tag+"/"+this.ident+"/share/"+uid,
            ()=>  { this.getShares(); }, 
            (x)=> { console.warn("Couldn't delete object: ", x.statusText); })
                    
        /* For drawing-layers remove sharings of features as well */
        if (this.tag=="Layer" && this.type=="drawing") {
            const tag = encodeURIComponent("feature."+this.name);
            this.server.DELETE("objects/"+tag+"/_ALL_/share/"+uid,
                ()=> {},
                (x)=> { console.warn("Couldn't add user: "+x); }
            );
        }
    }
    
    
    setIdent(id, name, tag, type) {
        this.ident = id;
        this.name = name;
        this.tag = tag;
        this.type = type;
        this.getShares();
    }
    
    
    /* Get list of shares from backend server */
    getShares() {
        this.server.GET("objects/"+this.tag+"/"+this.ident+"/share", null,
            x=> { 
                this.shareList=JSON.parse(x);
                this.shareList.sort((x,y)=> {return x.userid > y.userid});
                m.redraw();
            },
            ()=> { console.warn("Couldn't get share-list for object"); }
        )
    }
            
    onActivate() {
        this.getShares();
    }
    
} /* class */


// pol.widget.setFactory( "tracking.db.Sharing", {
//         create: () => new pol.tracking.db.Sharing()
//    });
