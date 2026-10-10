#!/bin/bash

# Beware since sudo is used here! 

sudo /usr/bin/polaric-newcert
sleep 1
sudo /usr/bin/polaric-restart
