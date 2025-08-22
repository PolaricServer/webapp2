/*
 Map browser based on OpenLayers. Tracking. 
 Configure filters and filter-menu. 
 
 Copyright (C) 2017-2024 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
 * Filters and filter menu setup.
 */
   
pol.tracking.Filters = class {
    
    constructor(tr) { 
        var t = this;
        var group = CONFIG.server.auth.groupid;
        if (group == null || group == "")
            group = "NOLOGIN";
        t.filterViews = [];
        t.tracker = tr; 
        t.tbar = CONFIG.mb.toolbar;
   
        /* Add callback to generate filter-menu */
        CONFIG.mb.ctxMenu.addCallback('FILTERSELECT', m => {
            m.clear();
            for (const i in t.filterViews) {
                m.add(t.filterViews[i][1], handleSelect(i));
            }
       
            /* Generate handler function for menu items */
            function handleSelect(i) {
                return function() {
                    $("#filterChoice").html(t.filterViews[i][1]);
                    t.tracker.setFilter(t.filterViews[i][0]);
                    CONFIG.storeSes('tracking.selectedfilt.'+group, t.filterViews[i][0]);
                    CONFIG.store('tracking.selectedfilt.'+group, t.filterViews[i][0]);
                } 
            }
        });
        
        t.getFilters();
        initFilt();
        
        async function initFilt() {
            t.filt = await CONFIG.get('tracking.selectedfilt.' + group);
            if (t.filt == null || t.filt == "")
                t.filt = await CONFIG.get('default_filter.' + group);
            if (t.filt == null || t.filt == "")
                t.filt = await CONFIG.get('default_filter');
        }
        
        
    }    

    
    
    addToolbarMenu() {
        this.tbar.addIcon(1, "images/filter.png", "tb_filter", null, "Filter selector");
        this.tbar.addDiv(1, "filterChoice", null);
        CONFIG.mb.ctxMenu.addMenuId('tb_filter', 'FILTERSELECT', true);
    }
    
    
    setDisabled(dis) {
        if (dis==true && t.tbar != null) 
            this.tbar.changeIcon("tb_filter", "images/filter.gray.png", null, "Too many points - overlay disabled");
        else
            this.tbar.changeIcon("tb_filter", "images/filter.png", null, "Filter selector");
    }
        
        
        
    /* Get list of filter profiles from server */
    getFilters() {
        const uri=(CONFIG.server.isAuth() ? "myfilters" : "filters");
        CONFIG.server.GET(uri, "", x => { 
            this.filterViews = GETJSON(x);   
            
            /* Find index of default selection */
            var i=0;
            if (this.filterViews.length == 0) 
                this.filterViews.push(["Null", "No filters found"]);

            for (var j in this.filterViews)
                if (this.filterViews[j][0] === this.filt)
                    { i=j; break; }
            if (i >= this.filterViews.length)
                i = 0;
            
            $("#filterChoice").html(this.filterViews[i][1]);
            this.tracker.setFilter(this.filterViews[i][0]);
        
        } );
    }

}    


    
/**
 * Convenience function for use in mapconfig file
 */

function FILTERS(x) {
    console.info("FILTERS in config file is now ignored");
}
