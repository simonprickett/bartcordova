var app = {
	API_BASE_URL: "http://bart.crudworks.org/api/",

	initialize: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},

	onDeviceReady: function() {
		document.addEventListener('pause', app.onDevicePause, false);
		document.addEventListener('resume', app.onDeviceResume, false);
		document.addEventListener('offline', app.onOffline, false);
		document.addEventListener('online', app.onOnline, false);

		if (device.platform === 'Android') {
			document.addEventListener('backbutton', app.onBackButton, false);
			document.addEventListener('menubutton', app.onMenuButton, false);
			document.addEventListener('searchbutton', app.onSearchButton, false);
		}

		navigator.splashscreen.hide();
		app.loadStationList();
		//navigator.geolocation.getCurrentPosition(app.onGeolocationSuccess, app.onGeolocationError);
	},

	loadStationList: function() {
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {

			},
			method: 'GET',
			success: function(data, status) {

			},
			url: app.API_BASE_URL + 'stations',
		});
	}

	onGeolocationSuccess: function(position) {
		console.log(position);
	},

	onGeolocationError: function(error) {
		console.log(error);
	},

	onDevicePause: function() {
		console.log('App went into the background.');
	},

	onDeviceResume: function() {
		console.log('App was brought back to the foreground.');
	},

	onOnline: function() {
		console.log('Device got a network connection.');
	},

	onOffline: function() {
		console.log('Device lost network connection.');
	},

	onBackButton: function() {
		console.log('User pressed back button.');
	},

	onMenuButton: function() {
		console.log('User pressed menu button.');
	},

	onSearchButton: function() {
		console.log('User pressed search button.');
	}
}

/* Stop app rotating outside of right way up portrait. */
function shouldRotateToOrientation(degrees) {
	return (degrees === 0);
};

app.initialize();