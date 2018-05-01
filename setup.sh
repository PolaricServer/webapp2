#!/bin/bash

if (( $#<2 )); then
    printf "Usage: setup get|save <directory>\n"
    exit 1
fi


if [ ! -d examples/"$2" ]; then
    printf "Cannot find directory ./examples/%s\n" $2 
    exit 1
fi


if [ "$1" == "get" ]; then 
    cp examples/"$2"/application.js .
    cp examples/"$2"/config.js .
    cp examples/"$2"/index.html .
    cp examples/"$2"/index-dev.html .
    printf "Fetched config files from ./examples/%s\n" $2
    
elif [ "$1" == "save" ]; then
    cp application.js examples/"$2"/
    cp config.js examples/"$2"/
    cp index.html examples/"$2"/
    cp index-dev.html examples/"$2"/
    printf "Saved config files to ./examples/%s\n" $2

else
    echo "Unknown command: '%s'\n" $1
fi
