/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2019-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.tracking.GlobalSettings = class extends pol.tracking.TrackerAlias {

    constructor() {
        super();
        var t = this;
    
        t.classname = "tracking.GlobalSettings"; 

        this.widget = {
            view: function() {
                var i=0;
                return m("div#globalSettings", [       
                    m("h1", "Global Settings"),  
                    m(t.aliasWidget),
                    m("div.butt", [
                        m("button", { type: "button", onclick: update }, "Update"),
                        m("button", { type: "button", onclick: ()=> {t.clear();} }, "Clear"),
                        m("span#confirm")
                    ])
                ])
            }
        };
            
                
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
        

        function update() {
            let icn = $("#iconpick").get(0).value; 
            if (!icn) 
                console.warn("Icon picker didn't work");
            let icn2 = icn.substr(icn.lastIndexOf("/")+1);
            let id =  $("#trackerId").val();
            if (!id.match(/^.+\@.+$/g))
                id = id.toUpperCase(); 
            
            if (id == "")
                return; 
            const data = {
                alias: $("#alias").val(), 
                icon: (t.edit.auto ? null : icn2)
            };
            if (data.alias=="")
                data.alias=null;
            t.server.PUT("item/"+id+"/alias", JSON.stringify(data), 
                x => {
                    console.log("Updated global settings: "+id);
                    $("#confirm").text("Updated");
                    setTimeout(()=> $("#confirm").text(""), 5000);
                },
                x => {
                    console.log("Update glob. settings -> "+x.status+": "+x.statusText +
                        " ("+x.responseText+")");
                    alert("Cannot update global settings." +
                        '\n"' + x.responseText + '"');
                }
            );
                            
        }
        
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });
        
    } /* constructor */
    
    
    setIdent(id) {
        super.setIdent(id); 
        this.server.GET("item/"+id+"/alias", "", x => {
            const info = GETJSON(x);
            if (info.alias!=null)
                this.edit.alias(info.alias);
            this.setIcon(this.edit, info.icon);
            m.redraw();
        });
    }
    

} /* class */



pol.widget.setFactory( "tracking.GlobalSettings", {
        create: () => new pol.tracking.GlobalSettings()
    });  
