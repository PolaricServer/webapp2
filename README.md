# webapp2
Re-write of client app. Based on OpenLayers 4+

Demo on http://test.aprs.no

Old webapp code is in https://github.com/PolaricServer/webapp

mapbrowser:
  Map browser javascript code. Can be instantiated and configured to an application. 
  
## Example setup: 
  test.js and index.html is a test webapp that instantiate a map browser.
  Map layer config is in mapconfig.js
  
  stylesheets polaric.css and popup.css
  
  
  To run this you will also need OpenLayers (ol.js and ol.css), Jquery (jquery.js), Jquery-ui (jquery-ui/*) and Proj4 (proj4.js) placed in a subdirectory called lib.
  
  Use compile-js.sh to minify the javascript code. 
  
  For development use index-debug.html instead of index.html. 


