
/*
 Map browser based on OpenLayers 5. Core. 
 
 Copyright (C) 2017-2020 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 


pol.core.DocReader = class extends pol.core.Widget {

    constructor ()
    {
        super();
        this.classname = "core.DocReader"; 
       
        var t = this;
        t.heading = "Info";
        
        
        t.widget = {
            view: function() {
                return m("div#docreader", [
                    m("h1", t.heading),
                    m("div#dcontent", "...")]);  
            }
        };
        
        t.resizeObserve( ()=>t.setScrollTable2("div#docreader", "div#dcontent", "", false) );
    } /* constructor */
        
        
    
    setContent(hd, file) {
        $.ajax(file, { success: txt=> {;
            if (hd != null)
                this.heading = hd;
            $('div#dcontent').html(txt);
            m.redraw();
            this.setScrollTable2("div#docreader", "div#dcontent", "", false); 
        }} ); 
    }
    
} /* class */





pol.widget.setFactory( "core.DocReader", {
        create: () => new pol.core.DocReader()
    }); 

