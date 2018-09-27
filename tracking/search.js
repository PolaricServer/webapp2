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
 * Reference search (in a popup window). 
 */

pol.tracking.Search = class extends pol.core.Widget {
    
    constructor() 
    {
        super();
        this.classname = "tracking.Search"; 
        this.server = CONFIG.server; 
        this.tags = "";
        const t = this;
   
        this.widget = {
            view: function() {
                return m("div", [       
                    m("h1", "Search stations/objects"),
                    m("div#searchform", [
                        m("form", [ 
                            "Keywords (tags): ", br, m("div#tags", m.trust(t.tags)),
                            "Free text search: ", m(textInput, 
                                {id: "search", size: 10, maxLength: 40, value:"*",regex: /^.*$/i}),
                            m("input#searchbutton", 
                                {onclick: searchHandler, type: "button", value: "Search"})
                        ])], 
                    br, m("div#searchresult"))]);
            }
        };
   
        getTags(null, null, tagListCallback);
   
   
        function searchHandler(e) {
            searchItems( $('#search').val(), getTagArgs(), searchItemsCallback)                  
        };

   
        /* Get tags from server. Server API (see old code) */
        function getTags(item, tags, cb) {
            t.server.GET("/tags", {ajax:true, tags: tags }, cb );
        }
   
   
        /* Server API (see old code) */ 
        function searchItems(filt, tags, cb) {
            t.server.GET("/search", "ajax=true&lang="+
                (filt!=null && filt != '' ? '&srch='+filt : '') + 
                (tags!=null && filt != '' ? '&tags='+tags : ''), cb );
        }
   
   
        /* Return tags that user has checked, as a comma-separated list */
        function getTagArgs() {
            let tags = "";
            $('div.taglist>input').each( (i,x) => {
                if (x.checked==true) {
                    tags = tags + (tags=="" ? "" : ",") + x.id.substring(4);
                }
            });
            console.log("TAGS: "+tags);
            return tags;
        }
    
    
        /* Process tags from server */
        function tagListCallback(info) {
            if (info == null)
                return;
        
            t.tags = info;
            m.redraw();
        
            setTimeout(() => {
                $('div.taglist>input').change( e => {
                    setTimeout(() => getTags(null, getTagArgs(), tagListCallback), 200 );
                });}, 300);
        }
    
    
        /* Process item-list (html table format) from server */
        /* FIXME: Consider using REST service with result in JSON format, rendered on client instead */
    
        function searchItemsCallback(info) {  
            if (info == null) 
                return; 
            let x = document.getElementById('searchresult');
            if (x != null) {
                let ht = $('#map').height() - 
                    ( $('#trackerSearch').height() - $('#searchresult').height()) - t.pos[1] - 8 ;     
            
                x.innerHTML = info;    
                setTimeout( () => {
                    if ($('#searchresult').height() < ht) 
                        ht = $('#searchresult').height();
                    $('#searchresult table').table({height: Math.round(ht)}); 
                }, 200);
            }    
        }
    
    } /* constructor */
} /* class */





 

pol.widget.setRestoreFunc("tracking.Search", function(id, pos) {
    var x = new pol.tracking.Search(); 
    x.activatePopup(id, pos, true); 
}); 
