# webapp2
Re-write/port of client webapp. Based on OpenLayers 4+ and it is a hope that this will be more modular and more user- and developer friendly. There are some options in designing this: Make a complete application, an extensible application with core map browsing functionality or an application framework. Ideas and contributions are welcome. 

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
  
## Licence
This is free software. License is GNU Affero General Public License. See <http://www.gnu.org/licenses/>.


