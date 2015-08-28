#!/bin/bash

cd ../app
cordova platform add ios
cordova platform add android
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-console
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-shake
