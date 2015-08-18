# bartcordova
Cordova App for my BART Transit JSON API

Right now this is a decent shell for a Cordova 5 start point:

* JQuery
* Bootstrap 3
* Splash screen images in their own folder
* Icons in their own folder
* Script to create platforms and plugins folders on first clone from Github
* Platforms and plugins folders not in Github on purpose, trying to keep that so

Fresh clone workflow:

* cordova -version (should yield 5.2.0 or better)
* cd scripts
* ./post_clone.sh (adds iOS and Android platforms, common plugins)
* cd ../app
* cordova build ios
* cordova build android
