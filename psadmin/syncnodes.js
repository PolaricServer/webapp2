/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 
pol.psadmin.db = pol.psadmin.db || {};



/**
 * Reference search (in a popup window). 
 */
pol.psadmin.db.SyncNodes = class extends pol.core.Widget { 

    constructor() {
        super();       
        let errmsg = "";
        const t = this;        
        t.server = CONFIG.server;

        t.classname = "psadmin.db.SyncNodes"; 
        t.parents = [];
        t.children = [];
        t.items = m.stream("");
        t.url = m.stream("");
        
        t.parentList = {
            view: function() {
                var i=0;
                return m("table", m("tbody", t.parents.map(x => {
                        return m("tr", [
                            m(removeEdit, {remove: apply(remove, i), edit: apply(editObj, i++)}),
                            m("td", x.nodeid),
                            m("td", x.url),
                            m("td", x.items.substring(0,12)+"..."),   
                            (x.active ? m("img", {src: "images/16px/ok.png"}) : null),
                        ]);
                    })));
            }
        };
         
        t.childList = {
            view: function() {
                var i=0;
                return m("table", m("tbody", t.children.map(x => {
                        return m("tr", [
                            m(removeEdit, {remove: apply(removeChild, i++), edit: null}),
                            m("td", x.nodeid),
                            m("td", x.items),  
                            (x.active ? m("img", {src: "images/16px/ok.png"}) : null),
                        ]);
                    })));
            }
        };
        
        
        
        t.widget = {
            view: function() {
                return m("div#syncNodes", [       
                    m("h1", "Synch nodes"), 
                    m("h3", "Parent nodes:"),
                    m(t.parentList),
                    m("h3", "Child nodes:"),
                    m(t.childList),
                    hr,        
                    m("div.field", 
                        m("span.xsleftlab", "Srv URL:"),
                        m(textInput, { id:"nodeUrl", value: t.url, size: 30, 
                            maxLength:64, regex: /.*/i })),
                    m("div.field", 
                        m("span.xsleftlab", "Items:"),
                        m(textInput, { id:"nodeItems", value: t.items, size: 30, 
                            maxLength:64, regex: /.*/i })),     
                    m("div.butt", [
                        m("button", { id: "abutt", type: "button", onclick: add }, "Add"),
                        m("button", { type: "button", onclick: clr }, "Clear"),
                    ]),
                    
                ]) 
            }
        };
        
        
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
        
        
        setInterval(()=> t.getNodes(), 60000);
        
        function removeChild(i) {remove(i, true); };
        
        function remove(i, child) {
            const list = (child ? t.children: t.parents);
            const node = list[i]; 
            if (confirm("Remove sync node "+node.nodeid+" - are you sure?") == false)
                return;
            if (child && confirm("Warning: Manual removal of child node - are you sure?") == false)
                return;
            
            t.server.DELETE("sync/nodes/"+node.nodeid, 
                x => {
                    list.splice(i);
                    m.redraw();
                },
                x => {
                    console.log("Cannot remove parent node -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot remove parent node: " + node.nodeid+
                        '\n"' + x.responseText + '"');
                }
            );
            
            
            
        }

        
        function add() {
            const data = {
                nodeid: "",
                items: t.items(),
                url: t.url()
            };
            t.server.POST("sync/nodes", JSON.stringify(data), 
                x => {
                    data.nodeid = x;
                    t.parents.push(data);
                    m.redraw();
                },
                x => {
                    console.log("Add node -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot add node: " + t.url()+
                        '\n"' + x.responseText + '"');
                }
            );
        }
        
        
        function clr() {
            t.items("");
            t.url("");
            m.redraw();
        }
        
        
        function editObj(i) {
            t.items(t.parents[i].items);
            t.url(t.parents[i].url);
            m.redraw();
        }
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  

        
    } /* constructor */
    
    
    
    /* Get categories (types) from server */
    getNodes() {
        this.children = [];
        this.parents = [];
        
        this.server.GET("sync/nodes", "", x => {
            var list = JSON.parse(x);
            for (x of list) 
                if (x.url == null || x.url == "")
                    this.children.push(x);
                else    
                    this.parents.push(x);
            
            m.redraw();
        });
    }
    

    
    onActivate() {
        this.getNodes();
    }


} /* class */




pol.widget.setFactory( "psadmin.db.SyncNodes", {
        create: () => new pol.psadmin.db.SyncNodes()
    }); 
