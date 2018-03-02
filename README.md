# webapp2
Re-write of client webapp. It is based on OpenLayers 4+ and it is my hope that this will be more modular and more user- and developer friendly. It is mainly dsesigned as a libarary/application framework that can be instantiated as specific applications. It comes with an example setup as a tracking-application using a Polaric Server backend. Currently, the following modules are being implemented. 

* Core. A basic map-browser that can be set up with map layers and with a framework for popup widgets. 
* Layer Editor. Widgets for letting the user edit his/her own map-layers (currently supporting WFS and WMS). 
* Tracking. Display trackers/objects as features in a map-layer. It uses the Polaric Server backend to get updates wia websocket and JSON. 

Demo on http://test.aprs.no

Old webapp code is in https://github.com/PolaricServer/webapp


## Example applications/setups

In the subdirectory 'examples' you find example setups. 'application.js' is used to compose a running application. 'config.js' is used to configure it with map layers, etc.. 'index.html' is a starting-point for a minified version. Use 'index-dev.html' for development-mode (and include the source code). 

* The 'minimal' directory is a minimal setup with OSM only. 
* The 'basic' directory is a basic setup with just map browsing. OSM + norwegian map. 
* The 'polaricserver-nordic' uses a polaric server backend, OSM and norwegian maps. 

Feel free to experiment with setups.. 
  
  
## Running 

Use compile-js.sh to minify the javascript code. 

To run it, copy the content of this directory to a directory that can be accessed through a web-server. Copy the files in one of the example directories to the root web-directory and edit 'config.js' and possibly 'application.js' to suit your needs.  


  
## Licence
This is free software. License is GNU Affero General Public License. See <http://www.gnu.org/licenses/>.

