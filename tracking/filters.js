/*
 Map browser based on OpenLayers 4. Tracking. 
 Configure filters and filter-menu. 
 
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
 * @classdesc
 * Filters and filter menu setup.
 * @constructor
 */
   
pol.tracking.Filters = function(tr) 
{
   var tbar = CONFIG.mb.toolbar;
   var t = this;
   var filterViews = CONFIG.get("tracking.filters");
   t.tracker = tr; 
         
   tbar.addIcon(1, "images/filter.png", "tb_filter", null, "Filter selector");
   tbar.addDiv(1, "filterChoice", null);
   CONFIG.mb.ctxMenu.addMenuId('tb_filter', 'FILTERSELECT', true);
   
   /* Set default or saved filter selection */   
   var filt = CONFIG.mb.config.get('tracking.selectedfilt');
   if (filt == null) 
      filt = defaultFilter;

   /* Find index of default selection */
   for (i in filterViews)
       if (filterViews[i].name === filt)
           break;

   $("#filterChoice").html(filterViews[i].title);
   t.tracker.setFilter(filterViews[i].name);



   /* Add callback to generate filter-menu */
   CONFIG.mb.ctxMenu.addCallback('FILTERSELECT', function (m) {
       for (i in filterViews) 
          m.add(filterViews[i].title, handleSelect(i));
    
       /* Generate handler function for menu items */
       function handleSelect(i) {
          return function() {
             $("#filterChoice").html(filterViews[i].title);
             t.tracker.setFilter(filterViews[i].name);
             CONFIG.store('tracking.selectedfilt', filterViews[i].name, true);
          } 
       }
   });
}   



/**
 * Convenience function for use in mapconfig file
 */

function FILTERS(x) {
    CONFIG.set("tracking.filters", x);
}
