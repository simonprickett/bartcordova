# BART Cordova

Cordova App for my BART Transit JSON API (API lives at https://github.com/simonprickett/bartnodeapi)

This uses:

* JQuery
* Bootstrap 3
* Handlebars templating
* Splash screen images in their own folder
* Icons in their own folder
* Script to create platforms and plugins folders on first clone from Github
* Platforms and plugins folders not in Github on purpose, trying to keep that so

Requires proper install and setup of:

* XCode including command line tools
* Android SDK
* Apache Cordova CLI

Fresh clone workflow:

* ```cordova -version``` (should yield 5.2.0 or better)
* ```cd scripts```
* ```./post_clone.sh``` (adds iOS and Android platforms, common plugins)
* ```cd ../app```
* ```cordova build ios```
* ```cordova build android```

Then try it out:

* ```cordova emulate ios```
* ```cordova emulate android```
