##########################################################################
## Change macros below according to your environment and your needs
##
##########################################################################

# DESTDIR = /tmp/test

# Review (and if necessary) change these if you are going to 
# install directly by using this makefile

   INSTALL_BIN = $(DESTDIR)/usr/bin
INSTALL_CONFIG = $(DESTDIR)/etc/polaric-webapp2
   INSTALL_WEB = $(DESTDIR)/var/lib/polaric/webapp2
 INSTALL_DATA  = $(DESTDIR)/var/lib/polaric
 
# Even if we don't require polaric-aprsd to be installed, 
# we expect it to be in most cases. We may install script
# to be run by the aprsd. 

INSTALL_DCONFIG = $(DESTDIR)/etc/polaric-aprsd
INSTALL_SCPLUG  = $(INSTALL_DCONFIG)/script-conf.d
 INSTALL_SCDIR  = $(INSTALL_DCONFIG)/scripts
 
 
##################################################
##  things below should not be changed
##
##################################################


all: compile

install: mapbrowser-min.js
	install -d $(INSTALL_CONFIG)
	install -d $(INSTALL_BIN)
	install -d $(INSTALL_DATA)
	install -d $(INSTALL_DATA)/mapcache

	install -d $(INSTALL_SCPLUG)
	install -d $(INSTALL_SCDIR)
	install -m 755 scripts/seed.sh $(INSTALL_SCDIR)
	install -m 644 scripts/webapp.conf $(INSTALL_SCPLUG)
	
	install -d $(INSTALL_WEB)/images $(INSTALL_WEB)/images/16px  $(INSTALL_WEB)/images/32px \
		$(INSTALL_WEB)/images/iconpack $(INSTALL_WEB)/images/drawIcons \
		$(INSTALL_WEB)/aprsd $(INSTALL_WEB)/aprsd/icons $(INSTALL_WEB)/aprsd/icons/signs \
		$(INSTALL_WEB)/aprsd/icons/alt $(INSTALL_WEB)/aprsd/images \
		$(INSTALL_WEB)/lib $(INSTALL_WEB)/style $(INSTALL_WEB)/sound
	
	chown www-data.www-data $(INSTALL_DATA)/mapcache
	
	install -m 755 debian/misc/polaric-offline $(INSTALL_BIN)
	install -m 755 debian/misc/polaric-online $(INSTALL_BIN)
	
	install -m 644 images/*.png $(INSTALL_WEB)/images
	install -m 644 images/16px/*.png $(INSTALL_WEB)/images/16px
	install -m 644 images/32px/*.png $(INSTALL_WEB)/images/32px
	install -m 644 images/iconpack/*.png $(INSTALL_WEB)/images/iconpack
	install -m 644 images/drawIcons/*.png $(INSTALL_WEB)/images/drawIcons
	install -m 644 aprsd/icons/*.png $(INSTALL_WEB)/aprsd/icons
	install -m 644 aprsd/icons/signs/*.png $(INSTALL_WEB)/aprsd/icons/signs
	install -m 644 aprsd/icons/alt/*.png $(INSTALL_WEB)/aprsd/icons/alt
	install -m 644 aprsd/images/*.png $(INSTALL_WEB)/aprsd/images
	
	install -m 644 style/style-min.css style/xstyle.css $(INSTALL_WEB)/style
	install -m 644 lib/ol.js lib/ol.js.map lib/ol.css $(INSTALL_WEB)/lib
	install -m 644 lib/jquery.ui.table.min.js lib/jquery.ui.touch-punch.min.js $(INSTALL_WEB)/lib
	install -m 644 lib/flatpickr.min.js lib/flatpickr.min.css lib/material_green.css $(INSTALL_WEB)/lib
	install -m 644 lib/mithril.min.js lib/mithril-stream.js $(INSTALL_WEB)/lib
	install -m 644 lib/proj4.js $(INSTALL_WEB)/lib
	install -m 644 lib/echarts.min.js $(INSTALL_WEB)/lib
	
	install -m 644 sound/*.wav $(INSTALL_WEB)/sound
	
	install -m 644 	mapbrowser-min.js layeredit-min.js featureedit-min.js \
			tracking-min.js psadmin-min.js application.js $(INSTALL_WEB)
	install -m 644 index.html $(INSTALL_WEB)
	
        # Config files are placed in /etc and should be symlinked from the webapp directory     
	install -m 644 config.js  $(INSTALL_CONFIG)/config.js
	install -m 644 debian/misc/mapcache.xml $(INSTALL_CONFIG)/mapcache.xml


	
compile: 
	npm install
	npm run build
	


clean:


