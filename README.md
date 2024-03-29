# webapp2
A client webapp for Polaric Server. It mainly designed as a library/application framework that can be instantiated as specific applications, though it is mainly configured as a tracking-application using a Polaric Server backend. Currently, the following modules are being implemented. 

* Core (mapbrowser). A basic map-browser that can be set up with map layers and with a framework for popup widgets. 
* Layer Editor. Widgets for letting the user edit his/her own map-layers (currently supporting WFS, WMS and GPX file upload). 
* Feature Editor. Drawing polygons, lines and circles. Icon markings. Uses aprsd w/database-plugin to store features.
* Trackers/objects as features in a map-layer. It uses the Polaric-aprsd backend to get updates wia websocket and JSON.
* System-admin utilities for the Polaric-aprsd backend. 

This software is currently running on http://aprs.no. A mobile-app 'Arctic Mapper' is based on the webapp2 code and available on Goggle Play.

## Example application setup

The Javscript code in 'application.js' is used to compose a running application. 'config.js' is used to configure it with map layers, etc. 'index.html' is a starting-point for a minified version. Use 'index-dev.html' for development-mode (and include the source code). 

Feel free to experiment with setups. The directory 'examples' may contain alternative application configurations. Currently very simple ones without using the Polaric-Server backend. Feel free to contribute.
  
  
## Installing and running 

### Deb package
A binary deb package (built on Debian bookworm) is available. It installs the software assuming that a Polaric-aprsd backend is installed on the same machine. The config files for the webapp and mapcache are placed in /etc/polaric-webapp2. See https://polaricserver.readthedocs.io/en/latest/install.html

### Makefile
The Makefile is used in building Debian packages, but could be used to install the software directly on your system for use with a Polaric Server backend. Modify the Makefile too your needs first, then type 'make' and 'sudo make install'.

### Manual
To run it, copy or move the content of this directory to a directory that can be accessed through a web-server. Copy the files in one of the example directories to the root web-directory (or use the script setup.sh) and edit 'config.js' and possibly 'application.js' to suit your needs.

For testing and development, point your browser at index-dev.html. It runs the source code directly. 

For production installations you may use compile-js.sh to minify the javascript code (and point the browser to index.html). To use a minified version of application.js, you will need to edit index.html. 

### Configuration
Edit the file 'config.js' to suit your needs. Here you can set up various map sources, backends, etc.. I am sorry little documentation at the moment but some explanations in the file. The config for aprs.no is provided as an example. 


## Hacking

Contributions and hacks are welcome. Or fell free to tell us what you think. It is based on OpenLayers 7 and Ecmascript 6 (2015) version of Javascript and uses namespaces. We hope to migrate to ES6 modules in not too long time. 
  
## Licence
This is free software. License is GNU Affero General Public License. See <http://www.gnu.org/licenses/>.

