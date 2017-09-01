 
   /*
    * Configure filter and filter-menu 
    */
   
   polaric.Filters = function(tr) 
   {
      var tbar = CONFIG.mb.toolbar;
      var t = this;
      var filterViews = CONFIG.get("filters");
      t.tracker = tr; 
            
      tbar.addIcon(1, "images/filter.png", "tb_filter", null, "Filter selector");
      tbar.addDiv(1, "filterChoice", null);
      CONFIG.mb.ctxMenu.addMenuId('tb_filter', 'FILTERSELECT', true);
      
      /* Set default or saved filter selection */   
      var filt = CONFIG.mb.config.get('polaric.filter');
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
       
          function handleSelect(i) {
             return function() {
                $("#filterChoice").html(filterViews[i].title);
                t.tracker.setFilter(filterViews[i].name);
                CONFIG.store('polaric.filter', filterViews[i].name, true);
             } 
          }
      });
   }   
   

   function FILTERS(x) {
       CONFIG.set("filters", x);
   }
