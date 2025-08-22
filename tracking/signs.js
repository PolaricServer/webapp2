/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2020-2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 
pol.tracking.db = pol.tracking.db || {};



/**
 * Reference search (in a popup window). 
 */
pol.tracking.db.Signs = class extends pol.core.Widget { 

    constructor() {
        super();       
        let errmsg = "";
        const t = this;        
        t.server = CONFIG.server;

        t.classname = "tracking.db.Signs"; 
        t.mySigns = [];
        t.myTypes = [];
        t.descr = m.stream("");
        t.url = m.stream("");
        t.scale = m.stream("");
        t.pos = [0,0];
        t.ident = "";
        t.type = 0;
        t.icon = "";
        t.typeSel = false; 
        t.userSel = true; 
        t.inProgr = false;
 
        this.signsList = {
            view: function() {
                var i=0;
                return m("table", m("tbody", t.mySigns.map(x => {
                        return m("tr", [
                            m(removeEdit, {remove: apply(remove, i), edit: apply(editObj, i++)}),
                                                           
                            m("td", {onclick: apply(gotoPos, x)},  x.descr),
                            m("td", x.tname),   
                            m("td", x.scale)
                        ]);
                    })));
            }
        };
        
        
        this.widget = {
            view: function() {
                return m("div#signsEdit", [       
                    m("h1", "Signs (simple points)"), 
                    
                    m("div.errmsg", errmsg),
                         
                    m("div.field", 
                        m("span.sleftlab",{title: "Description of item"}, "Description:"),
                        m(textInput, { id: "name", value: t.descr, size: 36,
                            maxLength: 40, regex: /.*/i })),
                         
                    m("div.field",
                        m("span.sleftlab", {title: "URL for webpage or picture to link to"}, "URL:"),
                        m(textInput, { id: "url", value: t.url, size: 36,
                            maxLength: 40, regex: /.*/i })), 
                    
                    m("div.field", 
                        m("span.sleftlab", "Pos (UTM): "), 
                        m(utmInput, {value: t.pos})),
                         
                    m("div.field",
                        m("span.sleftlab", {title: "Max scale in which item is shown on map"}, "Scale:"),
                        m(textInput, { id: "scale", value: t.scale, size: 12,
                            maxLength: 16, regex: /^[1-9][0-9]{4,16}$/i })), 
                         
                    m("div.field",
                        m("span.sleftlab", {title: "Type or category of item"}, "Type:"),
                        m(select, {
                            id: "typeSelect", 
                            onchange: typeSelect, 
                            list: t.myTypes,
                        }), nbsp, 
                        m("img", {src: "aprsd/icons/"+t.icon})), 
                         
                    m("div.field", 
                        m("span.sleftlab", {title: "What objects to show in list"}, "Search:"),
                        m(checkBox, {id: "srch_type", checked: t.typeSel, onclick: toggleTypeSel,
                            title: "Limit list to selected type" }, "Type selection"),
                        m(checkBox, {id: "srch_user", checked: t.userSel, onclick: toggleUserSel,
                            title: "Limit list to my own objects" }, "My objects only")),
                         
                    m("div.butt", [
                        m("button", { id: "ubutt", type: "button", onclick: update }, "Update"),
                        m("button", { id: "abutt", type: "button", onclick: add }, "Add"),
                        m("button", { type: "button", onclick: clr }, "Clear"),
                    ]),
                    
                    m("div#signsList"),
                ]) 
            }
        };
        
        
                
        if (!t.server.hasDb || !t.server.isAuth()) {
            t.allowPopup(false);
            return;
        }
        
        t.authCb = CONFIG.server.addAuthCb( ()=> {
            if (!CONFIG.server.isAuth())
                t.closePopup();
        });

        this.setEditMode(false);
        
        function clr() {t.clearFields();}
        
        
        function error(txt) {
            errmsg = txt;
            setTimeout(()=>{errmsg="";m.redraw();}, 6000);
            console.log(errmsg);
            m.redraw();
        }
        
        
        /* Handler for when user selects type */
        function typeSelect () {
            const sym = $('#typeSelect').val();
            t.type = sym;
            for (const x of t.myTypes)
                if (x.val == t.type)
                    t.icon = x.icon;
            if (t.typeSel)
                t.getSigns();
        }
        
        
        function toggleTypeSel() {
            t.typeSel = (t.typeSel ? false : true); 
            t.getSigns();
        }
        
        
        function toggleUserSel() {
            t.userSel = (t.userSel ? false : true); 
            t.getSigns();
        }
        
        
        function getObject() {
            return {
                id: -1, url: t.url(), descr: t.descr(), scale: parseInt(t.scale(),10),  
                pos: t.pos, icon: null, type: parseInt(t.type,10), tname: ""
            };
        }
        
        
        /* Update object in database */
        function update() {
            if (t.ident == "")
                return; 
            if (t.pos[0]==0 && t.pos[1]==0) {
                error("Invalid position");
                return;
            }
            t.server.PUT("signs/"+t.ident, JSON.stringify(getObject()), 
               ()=> { setTimeout(()=>t.getSigns(), 500);  }, 
                x=> { error("Cannot update on server: "+x.responseText) }
            ); 
        }
        
        
        /* Add object to database */
        function add() {
            if (t.pos[0]==0 && t.pos[1]==0) {
                error("Invalid position");
                return;
            }
            t.server.POST("signs", JSON.stringify(getObject()), 
               ()=> { }, 
                x=> { error("Cannot add to server: "+x.responseText) }
            );
        }
        
        
        /* Edit object */
        function editObj(i) {
            const s = t.mySigns[i];
            t._edit(s);
            t.setEditMode(true);
        }
        
        
        function remove(i) {
            t._remove(i, true);
        }
        
        
        /* Apply a function to an argument. Returns a new function */
        function apply(f, id) {return function() { f(id); }};  
    
        
        function gotoPos(x) {
            if (x.pos==null)
                return;
            CONFIG.mb.goto_Pos(x.pos, false);
        }

        
    } /* constructor */
    
    
    
    remove (ii, noconfirm) {
        if (!noconfirm && noconfirm!=true && confirm("Remove - are you sure?") == false)
            return;
        var i = this.getIdent(ii);
        if (this.isActive()) {
            for (const ix in this.mySigns) 
                if (this.mySigns[ix].id == i) 
                    this._remove(ix, true);
        }
        else
            this._remove(i, false);
    }
    
    
    
    /* Remove object */
    _remove(i, index) {
        if (i==null)
            return;
        const ident = (index ? this.mySigns[i].id : ""+i);
        this.server.DELETE("signs/"+ident, x => {
            console.log("Removed sign: "+ident);
            if (index) { 
                this.mySigns.splice(i, 1);
                m.redraw();
            }
        } );
    }
        
        
    getIdent(i) {
        let ii; 
        if (!/__db/.test(i))
            return null;
        ii = i.substring(5);
        return ii;
    }
        
    
    /* Load fields of an existing object into edit form */
    _edit(s) {
        this.ident = s.id;
        this.descr(s.descr);
        this.url(s.url);
        this.scale(s.scale);
        this.pos = s.pos;  
        this.type = s.type;
        this.icon = s.icon;
        $('#typeSelect').val(s.type);
        this.setEditMode(true);
        m.redraw();
    }
    
    
    /* Get object from server - in order to edit it */
    edit(ii) {
        var i = this.getIdent(ii);
        if (i==null)
            return;
        this.server.GET("signs/"+i, "", x => {
            var obj = GETJSON(x);
            this._edit(obj);
        });
        
    }
    
    
    /* Set edit/add mode */
    setEditMode(em) {
        setTimeout( ()=> {
            $("#ubutt").prop("disabled",!em);
            $("#abutt").prop("disabled",em);
        }, 200);
    }
        
    
    /* Get categories (types) from server */
    getTypes() {
        this.server.GET("signs/types", "", x => {
            this.myTypes = [];
            var list = GETJSON(x);
            for (x of list) 
                this.myTypes.push({label:x.name, val:x.id, icon: x.icon });
            
            if (this.myTypes.length > 0) {
                this.type = this.myTypes[0].val;
                this.icon = this.myTypes[0].icon; 
            } else 
                console.warn("No sign types found in database");
            
            m.redraw();
        });
    }
    
    
    /* Get list of signs from server */
    getSigns() {
       if (this.inProgr)
            return;
        this.inProgr = true;
        const userid = this.server.auth.userid;
        console.assert(userid && userid!=null, "userid="+userid);
        if (userid == null)
            return;
        var query = (this.typeSel ? "?type="+$('#typeSelect').val() : "");
        if (this.userSel) 
            query += (this.typeSel ? "&" : "?") + "user=true"; 
        
        this.server.GET("signs"+query, "", x => { 
            this.mySigns = GETJSON(x);
            this.sortList();
            setTimeout(()=> this.mountList(), 1000);
            this.inProgr = false;
        } );
    }
    
    
    /* Set position field from pixel location */
    setPosPix(pix) {
        const llpos = CONFIG.mb.pix2LonLat(pix);
        this.clearFields();
        this.scale(""+CONFIG.mb.getScaleRounded());
        this.pos = llpos;
        m.redraw();
    }
    
    
    /* Clear all fields */
    clearFields() {
        this.pos = [0,0];
        this.ident = "";  
        this.descr("");
        this.url("");
        this.scale("");
        if (this.mTypes != null && this.mTypes.length == 0) {
            this.type = this.myTypes[0].val; 
            this.icon = this.myTypes[0].icon;
        } 
 
        $('#typeSelect').val(this.type);
        this.setEditMode(false);
    }
    
    
    /* Mount or remout the table that represents the list of users 
     * make it scrollable. 
     */        
    mountList() {
        if (!this.isActive())
            return;
        m.mount($("div#signsList").get(0), this.signsList);
        this.setScrollTable("#signsEdit", "div#signsList");
    }
                
                
    /* Sort signs list */        
    sortList() {
        this.mySigns = this.mySigns.sort((a,b) => { 
            if (a.tname == b.tname)
                return (a.descr < b.descr ? -1 : 1)
            else
                return (a.tname < b.tname ? -1 : 1) 
        });
    }
    
    onActivate() {
        this.getTypes();
        this.getSigns();
    }


} /* class */




pol.widget.setFactory( "tracking.db.Signs", {
        create: () => new pol.tracking.db.Signs()
    }); 
