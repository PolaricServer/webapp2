# webapp2
Re-write of client webapp. It is based on OpenLayers 4+ and it is my hope that this will be more modular and more user- and developer friendly. It is mainly dsesigned as a libarary/application framework that can be instantiated as specific applications. It comes with an example setup as a tracking-application using a Polaric Server backend. Currently, the following modules are being implemented. 

* Core. A basic map-browser that can be set up with map layers and with a framework for popup widgets. 
* Layer Editor. Widgets for letting the user edit his/her own map-layers (currently supporting WFS and WMS). 
* Tracking. Display trackers/objects as features in a map-layer. It uses the Polaric Server backend to get updates wia websocket and JSON. 

Demo on http://test.aprs.no

Old webapp code is in https://github.com/PolaricServer/webapp

  
## Example setup: 
  test.js and index.html is an example application setup with menus, etc.. Feel free to experiment.
  An application can be configured mapconfig.js. Feel free to experiment.
  
  stylesheets in style/ subdirectory. 
  
  
  To run this you will also need external code like OpenLayers (ol.js and ol.css), Jquery (jquery.js), Jquery-ui (jquery-ui/*) and Proj4 (proj4.js), etc. These are placed in a subdirectory called lib.
  
  Use compile-js.sh to minify the javascript code. 
  
  For development use index-dev.html instead of index.html. 
  
## Licence
This is free software. License is GNU Affero General Public License. See <http://www.gnu.org/licenses/>.

