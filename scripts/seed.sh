#!/bin/bash

       PROG=mapcache_seed
     CONFIG=/etc/polaric-webapp2/mapcache.xml
        LOG=/var/log/polaric/seeder.log
 ZOOMLEVELS=1,10
 
if [ ! $# -eq 5 ]   # We need 5 arguments
then
    echo "Error: Script expects 5 arguments"
    exit 1
fi

expire=$(date -d "- 12 months" +'%Y/%m/%d %H:%M')
$PROG -c $CONFIG -t $1 -e $2,$3,$4,$5 -z $ZOOMLEVELS -o "$expire" -n 8 >& $LOG
res=$?

[ $res -eq 0 ] && echo "Tile download success!" || echo "Tile download failed!"

exit $res
