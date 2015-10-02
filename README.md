# BART Cordova

Cordova App for my BART Transit JSON API (API lives at https://github.com/simonprickett/bartnodeapi)

This uses:

* JQuery
* Bootstrap 3
* Handlebars templating
* Splash screen images in their own folder
* Icons in their own folder
* Plugins downloaded using a hook script that runs when a platform is added
* Platforms and plugins folders not in Github on purpose, trying to keep that so
* Build hook script to compile Handlebars templates and put the resulting compiled JS in the www folder
* iOS pre build hook script to alter the Info plist to disable Application Transport Security in iOS 9 so that backend data calls can be made without requiring SSL endpoints (unsure right now if this will be allowed for apps submitted to the App Store)
* Platform independent pre build hook script to run eslint using configuration in package.json for each build

Requires proper install and setup of:

* Xcode including command line tools, recommend Xcode 7.01
* Android SDK, recommend API level 22 (Android 5.1.1)
* Apache Cordova CLI (5.3.3 or better)
* eslint

Fresh clone workflow:

* ```cordova -version``` (should yield 5.3.3 or better)
* ```cd app```
* ```cordova platform add ios```
* ```cordova platform add android```
* ```cordova build ios```
* ```cordova build android```

Then try it out:

* ```cordova emulate ios```
* ```cordova emulate android```
