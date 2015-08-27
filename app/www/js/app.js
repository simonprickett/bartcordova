var app = {
	// TODO: Get page skeletons out of JS and into HTML
	// TODO: Info tab
	// TODO: Tickets tab
	// TODO: Home page tabs - departures, tickets, anything else (Elevators?)
	// TODO: Font Awesome icons
	// TODO: Cache station list for a while
	// TODO: Scroll to top plugin?
	// TODO: Shake to reload plugin?
	// TODO: Network error handling
	// TODO: Loading mask or spinner
	// TODO: Precompiled Handlebars templates
	// TODO: Proper splash screen
	// TODO: Proper icon
	// TODO: Test Android
	API_BASE_URL: "http://bart.crudworks.org/api/",

	initialize: function() {
		this.registerTemplateHelpers();
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},

	registerTemplateHelpers: function() {
		Handlebars.registerHelper("round", function(numToRound) {
			numToRound = parseFloat(numToRound);
			return(Math.round(numToRound * 10) / 10);
		});

		Handlebars.registerHelper("formatTime", function(timeToFormat) {
			timeComponents = timeToFormat.split(':');
			return(timeComponents[0] + ':' + timeComponents[1]);
		});		

		Handlebars.registerHelper("formatMins", function(minsToFormat) {
			if (minsToFormat === 'Leaving') {
				return minsToFormat;
			} else {
				return minsToFormat + (minsToFormat === '1' ? ' min' : ' mins');
			}
		});

		Handlebars.registerHelper("formatTrainIcon", function(minsToDeparture) {
			return '<i class="fa ' + (minsToDeparture === 'Leaving' ? 'fa-times-circle' : 'fa-subway') + '"></i>';
		});

		Handlebars.registerHelper("formatStationName", function(stationName) {
			if (stationName.indexOf('Airport') > -1) {
				stationName = '<i class="fa fa-plane"></i> ' + stationName;
			}

			return stationName;
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
		var tplSource = $('#stationListHeaderTemplate').html();
		var htmlTemplate = Handlebars.compile(tplSource);

		$('#app').html('<div id="title"></div><div id="systemStatus"></div><div id="closestStation"></div><div id="stationList">');
		$('#title').html(htmlTemplate());

		app.loadStationList();
		app.loadSystemStatus();
		navigator.geolocation.getCurrentPosition(app.onGeolocationSuccess, app.onGeolocationError);		
	},

	showStationDetailPage: function(stationId) {
		$('#app').html('<div id="stationHeader"></div><div id="stationDepartures"></div>');
		app.loadStationDepartures(stationId);
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

				$('#stations li').click(function(e) {
					app.showStationDetailPage($(this).attr('id'));
				});

				$('#reloadButton').click(function(e) {
					app.showStationListPage();
				});
			},
			url: app.API_BASE_URL + 'stations',
		});
	},

	loadStationDepartures: function(stationId) {
		$.ajax({
			cache: false,
			error: function(xhr, status, errrMsg) {
				alert('failed to load depatures for ' + stationId);
			},
			method: 'GET',
			success: function(data, status) {
				var tplSource = $('#stationHeaderTemplate').html();
				var htmlTemplate = Handlebars.compile(tplSource);
				$('#stationHeader').html(htmlTemplate({ stationName: data.name }));

				tplSource = $('#stationDeparturesTemplate').html();
				htmlTemplate = Handlebars.compile(tplSource);

				$('#stationDepartures').html(htmlTemplate({ destinations: data.etd }));

				$('#backButton').click(function() {
					app.showStationListPage();
				});

				$('#reloadButton').click(function(e) {
					app.showStationDetailPage(stationId);
				});

				$('.panel-heading').click(function(e) {
					app.showStationDetailPage($(this).attr('id'));
				});
			},
			url: app.API_BASE_URL + 'departures/' + stationId
		});
	},

	loadSystemStatus: function() {
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to get system status');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				var tplSource;
				var htmlTemplate;

				if (data && data.bsa) {
					if (data.bsa.description === 'No delays reported.') {
						app.loadTrainCount();
					} else {
						tplSource = $('#serviceAnnouncementTemplate').html();
						htmlTemplate = Handlebars.compile(tplSource);
						$('#systemStatus').html(htmlTemplate({ announcement: data }));
					}
				}
			},
			url: app.API_BASE_URL + 'serviceAnnouncements'
		});
	},

	loadTrainCount: function() {
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to get train count');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				var tplSource = $('#trainCountTemplate').html();
				var htmlTemplate = Handlebars.compile(tplSource);
				$('#systemStatus').html(htmlTemplate({ systemStatus: data }));
			},
			url: app.API_BASE_URL + 'status'
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

				$('#nearestStationButton').click(function() {
					app.showStationDetailPage(data.abbr);
				});
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