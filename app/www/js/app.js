var app = {
	API_BASE_URL: "http://bart.crudworks.org/api/",

	initialize: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);

		Handlebars.registerHelper("round", function(numToRound) {
			numToRound = parseFloat(numToRound);
			return (Math.round(numToRound * 10) / 10);
		});
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
		
		app.showStationListPage();

	},

	showStationListPage: function() {
		$('#app').html('<div id="closestStation"></div><div id="stationList">');

		app.loadStationList();
		navigator.geolocation.getCurrentPosition(app.onGeolocationSuccess, app.onGeolocationError);		
	},

	loadStationList: function() {
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to load stations');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				var tplSource = $('#stationListTemplate').html();
				var htmlTemplate = Handlebars.compile(tplSource);

				$('#stationList').html(htmlTemplate({ stations: data }));
			},
			url: app.API_BASE_URL + 'stations',
		});
	},

	onGeolocationSuccess: function(position) {
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to get closest station');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				var tplSource = $('#closestStationTemplate').html();
				var htmlTemplate = Handlebars.compile(tplSource);

				$('#closestStation').html(htmlTemplate({ station: data}));
			},
			url: app.API_BASE_URL + 'station/' + position.coords.latitude + '/' + position.coords.longitude
		})
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