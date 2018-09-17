# webapp2
Re-write of client webapp for Polaric Server. It is based on OpenLayers 4+ and it is my hope that this will be more modular and more user- and developer friendly. It is mainly dsesigned as a libarary/application framework that can be instantiated as specific applications, not necessarily only with a "Polaric" backend server. It comes with an example setup as a tracking-application using a Polaric Server backend. Currently, the following modules are being implemented. 

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

Feel free to experiment with setups.. You may use the script setup.sh to copy files to/from the example directories. 

    ./setup.sh save minimal 
will save the current application setup in root directory to examples/minimal
  
  
## Running 

Use compile-js.sh to minify the javascript code. To do this you need to have installed a recent version of the Google Closure compiler. This can also "transpile" the code to ES4 or ES5 versions of Javascript to support somewhat older browsers. 

To run it, copy the content of this directory to a directory that can be accessed through a web-server. Copy the files in one of the example directories to the root web-directory (or use the script setup.sh) and edit 'config.js' and possibly 'application.js' to suit your needs.

Run the minified (and possibly transpiled) version by pointing the browser at index.html
A developer version (runs source code directly). 

## Hacking

Contributions and hacks are welcome. Or fell free to tell us what you think. It is based on OpenLayers 5 and Ecmascript 6 (2015) version of Javascript and uses namespaces. We hope to migrate to ES6 modules soon. 
  
## Licence
This is free software. License is GNU Affero General Public License. See <http://www.gnu.org/licenses/>.

