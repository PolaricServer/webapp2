 
/*
 Map browser based on OpenLayers 5. Tracking. 
 Search historic data on tracker points on server.  
 
 Copyright (C) 2018-2019 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Historic trail search (in a popup window). 
 */

pol.tracking.SarMode = class extends pol.core.Widget {
    
    constructor() {
        super();
        var t = this;
        
        t.sarOn = false; 
        t.hide = true;
        t.classname = "tracking.SarMode"; 
        t.prefix = m.stream("");
        t.descr = m.stream("");
        t.conf = ""; 
        
        this.widget = {
            view: ()=> {
                return m("div", [
                    m("h1", "Search and Rescue mode"),
                    m("form.sar", [ 
                        m("span.sleftlab", "Sar mode: "),
                        m(checkBox, {id: "sar_on", onclick: toggleSar, checked: t.sarOn}, "activated"), br,
                        m("span.sleftlab", "Alias/icon: "),
                        m(checkBox, {id: "sar_hide", onclick: toggleHide, checked: t.hide}, "hidden"), br,
                      
                        m("span.sleftlab", "Hide prefix: "),
                        m(textInput, {id:"sar_prefix", value: t.prefix, size: 20, maxLength:40, 
                            regex: /^[a-zA-Z0-9\-]+$/i }),br,
                        m("span.sleftlab", "Description: "),
                        m(textInput, {id:"sar_descr", value: t.descr, size: 20, maxLength:40, 
                            regex: /^.+$/i }),br,
                      
                        m("div.butt", 
                            m("button", { type: "button", onclick: update }, "Update"),
                            m("button", { type: "button", onclick: clear }, "Clear"),
                            m("span#confirm", t.conf)
                        )
                    ]),
                ]); 
            }
        };
    
    
        CONFIG.server.GET("system/sarmode", null,
            x=> { 
                const sar=JSON.parse(x);
                if (sar != null) {
                    console.log(sar);
                    t.prefix(sar.filt);
                    t.descr(sar.descr);
                    t.hide = sar.hide;
                    t.sarOn = true;
                    m.redraw();
                }
                
            },
            ()=> { console.warn("Couldn't get SAR mode info"); }
        );
        
        
        
        function toggleSar() 
            { t.sarOn = (t.sarOn ? false: true); }
            
        
        
        function toggleHide() 
            { t.hide = (t.hide ? false: true); }
            
        
        
        function update() {
            const sar = (!t.sarOn ? null : {
                filt: t.prefix(),
                descr: t.descr(),
                hide: t.hide
            });

            CONFIG.server.PUT("system/sarmode", JSON.stringify(sar), 
                ()=> {
                    t.conf = "Updated ok"
                    setTimeout(()=> {t.conf = "";m.redraw()}, 30000); 
                },
                ()=> {
                    console.warn("Couldn't update SAR mode info");
                }
            );
        }
        
        
            
        function clear() 
            {t.prefix(""); t.descr(""); t.sarOn=false; t.hide=false;m.redraw();}   
    }
}


pol.widget.setFactory( "tracking.SarMode", {
        create: () => new pol.tracking.SarMode()
    }); 

