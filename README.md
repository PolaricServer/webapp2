# webapp2
Re-write of client webapp for Polaric Server. It is my hope that this will be more modular and more user- and developer friendly. It is mainly dsesigned as a library/application framework that can be instantiated as specific applications, not necessarily only with a "Polaric" backend server. It comes with an example setup as a tracking-application using a Polaric Server backend. Currently, the following modules are being implemented. 

* Core (mapbrowser). A basic map-browser that can be set up with map layers and with a framework for popup widgets. 
* Layer Editor. Widgets for letting the user edit his/her own map-layers (currently supporting WFS, WMS and GPX file upload). 
* Feature Editor (work in progress). Drawing polygons, lines and circles. Icon markings. This uses code from https://github.com/Menthelice/SnowMarkerModule. 
* Tracking. Display trackers/objects as features in a map-layer. It uses the Polaric Server backend to get updates wia websocket and JSON. 

This software is currently running on http://aprs.no. New features may be tested on http://test.aprs.no. 


## Example applications/setups

In the subdirectory 'examples' you find example setups. 'application.js' is used to compose a running application. 'config.js' is used to configure it with map layers, etc.. 'index.html' is a starting-point for a minified version. Use 'index-dev.html' for development-mode (and include the source code). 

* The 'minimal' directory is a minimal setup with OSM only. 
* The 'basic' directory is a basic setup with just map browsing. OSM + norwegian map. 
* The 'polaricserver-nordic' uses a polaric server backend, OSM and norwegian maps. This is rather close to the setup on aprs.no. 

Feel free to experiment with setups.. You may use the script setup.sh to copy files to/from the example directories. 

    ./setup.sh save minimal 
will save the current application setup in root directory to examples/minimal
  
  
## Running 

To run it, copy the content of this directory to a directory that can be accessed through a web-server. Copy the files in one of the example directories to the root web-directory (or use the script setup.sh) and edit 'config.js' and possibly 'application.js' to suit your needs.

For testing and development, point your browser at index-dev.html instead of index.html or replace the file. It runs the source code directly.

Softlink featureedit/images/drawIcons to images/drawIcons 
Softlink featureedit/images/iconpack to images/iconpack

Make sure that the webserver will follow links in this directory. 

For production installations you may use compile-js.sh to minify the javascript code (and the provided index.html). To compile you need to have installed a recent version of the Google Closure compiler. This can also "transpile" the code to ES4 or ES5 versions of Javascript to support somewhat older browsers. To use a minified version of application.js, you will need to edit index.html. 



## Hacking

Contributions and hacks are welcome. Or fell free to tell us what you think. It is based on OpenLayers 5 and Ecmascript 6 (2015) version of Javascript and uses namespaces. We hope to migrate to ES6 modules at a later stage. 
  
## Licence
This is free software. License is GNU Affero General Public License. See <http://www.gnu.org/licenses/>.

