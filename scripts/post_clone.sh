#!/bin/bash

cd ../app
cordova platform add ios
cordova platform add android
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-console
cordova plugin add cordova-plugin-splashscreen
