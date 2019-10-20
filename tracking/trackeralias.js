/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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

pol.tracking.TrackerAlias = class extends pol.core.Widget {

    constructor() {
        super();
        var t = this;
        t.server = CONFIG.server;
        t.edit = {id:m.stream(""), alias:m.stream(""), icon: "", auto: true};
        t.icons = [];
        t.iconpath = CONFIG.get("iconpath");
        t.dfl = CONFIG.get("default_icon");
        t.ident = m.stream();
        t.alias = m.stream();
        
        this.aliasWidget = {
            view: function() {
                var i=0;
                return  m("form.trackerAlias", [
                    m("span.xsleftlab", "Ident:"),
                    m(textInput, 
                        { id:"trackerId", value: t.edit.id, size: 16, 
                            maxLength:25, regex: /^[^\<\>\'\"]+$/i }), br,
                         
                    m("span.xsleftlab", "Alias:"),
                    m(textInput,
                        { id: "alias", value: t.edit.alias, size: 16,
                            maxLength: 32, regex: /.*/i }), br,
                    
                    m("span.xsleftlab", "Icon:"), 
                        m(iconPick, {value: t.edit.icon, icons: t.icons, default: t.dfl, id: "iconpick"} ),
                    m("span#auto", 
                        m(checkBox, {id: "symbol-auto", onclick: auto, checked: t.edit.auto, 
                            title: "If checked, icon is automatically selected (from aprs symbol)" },
                            "Automatic")
                    )
                ])
            }
        };

        /* Get icons from server */
        t.server.GET("system/icons/default", "", x => {
            t.icons = JSON.parse(x);
            for (const i in t.icons)
               t.icons[i] = t.iconpath + t.icons[i];
            m.redraw();
        });
        
        setTimeout( ()=> t.iconGrey(), 1000); 
        setTimeout( ()=> t.iconGrey(), 3000);
        
  
        /* Automatic checkbox handler */
        function auto() {
            t.edit.auto = (t.edit.auto ? false : true);
            t.iconGrey();
        }
 
    } /* constructor */
    
        
    /* Clear input fields */
    clear() {
        this.edit.auto = true; 
        this.edit.id("");
        this.edit.alias("");
        $("#iconpick>img").attr("src", this.icons[this.dfl]).trigger("change");
        setTimeout( ()=> this.iconGrey(), 1000); 
    }
        
        
    /* Grey out icon if automatic is set */
    iconGrey() {
        if (this.edit.auto) {
            $("#iconpick>img").css("background", "grey");
            $("#iconpick>img").css("opacity", "0.5");
        }
        else {
            $("#iconpick>img").css("background", "");
            $("#iconpick>img").css("opacity", "");
        }
    }
        
    onActivate() {
        setTimeout(()=> this.iconGrey(), 600); 
    }
        
    setIdent(id) {
        t.edit.id(id);
        this.iconGrey();
    }
    
    setIcon(tt, icon) {
        if (icon == null) {
            tt.auto = true; 
            tt.icon = this.icons[this.dfl];
        }
        else 
            tt.icon = this.iconpath+"/icons/"+icon;
    }               
                    
                    
} /* class */


