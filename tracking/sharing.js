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
 *  
 */

var shareWidget = null;
function getShareWidget() {
    if (shareWidget == null) 
        shareWidget = new pol.tracking.db.Sharing();
    if (!shareWidget.isActive()) 
        shareWidget.activatePopup('tracking.db.Sharing', [50, 70], true);
    return shareWidget;
}



pol.tracking.db.Sharing = class extends pol.core.Widget {  

    constructor() {
        super();
        const t = this;
        const srv = CONFIG.server;
        let errmsg = "";
        
        t.server = CONFIG.server;
        t.ident = 0;
        t.name = "";
        t.tag = "TAG";
        t.user = m.stream("");
        t.shareList = [];
        t.userList = [];
        t.groupList = [];
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
        
        

        srv.GET("usernames", null,
            x=> { 
                t.userList=JSON.parse(x);
                t.userList.sort((x,y)=> {return x > y});
                t.userList.push("#ALL");
                getGroups(); 
                m.redraw() 
            },
            ()=> { console.warn("Couldn't get user list"); }
        );

        function getGroups() {
            t.server.GET("groups", "", x => { 
                t.groupList = JSON.parse(x);    
                t.groupList.sort((x,y)=> {return x > y});
                console.log("groupList", t.groupList);
                for (const xx of t.groupList) 
                    t.userList.push('@'+xx.ident);
            },
            ()=> { console.warn("Couldn't get group list"); }
            );
        }
    
            
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
             
            /* Add sharing to features/sublayers as well */
            if (t.tag=="layer" && (t.type=="drawing" || t.type=="gpx")) {
                const tag = encodeURIComponent(
                    (t.type=="gpx" ? "gpx." : "feature.") + t.name
                );

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
        uid = encodeURIComponent(uid);
        CONFIG.server.DELETE("objects/"+this.tag+"/"+this.ident+"/share/"+uid,
            ()=>  { this.getShares(); }, 
            (x)=> { console.warn("Couldn't delete object: ", x.statusText); })
                    
        /* For drawing-layers remove sharings of features as well */
        if (this.tag=="layer" && (this.type=="drawing" || this.type=="gpx")) {
            const tag = encodeURIComponent(
                (this.type=="gpx" ? "gpx.": "feature.") + this.name
            );
            CONFIG.server.DELETE("objects/"+tag+"/_ALL_/share/"+uid,
                x=> { if (x>0) console.log(x+" features removed"); },
                x=> { console.warn("Couldn't remove user: "+x); }
            );
        }
    }
    
    
    setIdent(id, name, tag, type) {
        this.ident = id;
        this.name = name;
        this.tag = tag;
        this.type = type;
        console.log("setIdent", this.ident, this.tag, this.type);
        this.getShares();
    }
    
    
    /* Get list of shares from backend server */
    getShares() {
        console.log("this.tag/ident: ", this.tag, this.ident);
        CONFIG.server.GET(encodeURI("objects/"+this.tag+"/"+this.ident+"/share"), null,
            x=> { 
                this.shareList=JSON.parse(x);
                this.shareList.sort((x,y)=> {return x.userid > y.userid});
                m.redraw();
            },
            ()=> { console.warn("Couldn't get share-list for object"); }
        )
    }
            
    onActivate() {
       // setTimeout(this.getShares, 1000);
    }
    
} /* class */


// pol.widget.setFactory( "tracking.db.Sharing", {
//         create: () => new pol.tracking.db.Sharing()
//    });

