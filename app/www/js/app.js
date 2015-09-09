var app = {
	// TODO: Make links in info tab go to in app browser
	// TODO: Tickets tab
	// TODO: Home page tabs - departures, tickets, anything else (Elevators?)
	// TODO: Cache station list for a while and later reload it
	// TODO: Shake to reload disable when on tickets or station info
	// TODO: Network error handling
	// TODO: Loading mask or spinner
	// TODO: Precompiled Handlebars templates
	// TODO: Proper icon
	// TODO: Android hardware back button

	API_BASE_URL: "http://bart.crudworks.org/api/",

	stationAccess: undefined,
	stationList: undefined,
	isShowingStationList: true,
	currentStation: undefined,

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
			var trainIcon = '<i class="fa ';
			if (minsToDeparture === 'Leaving') {
				trainIcon += 'fa-times-circle';
			} else if (parseInt(minsToDeparture, 10) < 5) {
				trainIcon += 'fa-clock-o';
			} else {
				trainIcon += 'fa-subway';
			}

			return trainIcon + '"></i>';
		});

		Handlebars.registerHelper("formatStationName", function(stationName) {
			if (stationName.indexOf('Airport') > -1) {
				stationName = '<i class="fa fa-plane"></i> ' + stationName;
			}

			return stationName;
		});
	},

	resolveTemplate: function(templateName, templateData) {
		var tplSource = $('#' + templateName).html();
		var compiledTemplate = Handlebars.compile(tplSource);
		
		return compiledTemplate(templateData);
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

		if (device.platform === 'iOS') {
			window.addEventListener("statusTap", function() {
		    	$('html, body').animate({scrollTop:0}, 'slow'); 
			});
		}

		navigator.splashscreen.hide();
		
		app.showStationListPage();
		app.loadStationAccess();

		shake.startWatch(app.onShake, 30);
	},

	showStationListPage: function() {
		app.isShowingStationList = true;
		app.currentStation = undefined;

		$('#app').html(app.resolveTemplate('stationListPageTemplate'));
		$('#title').html(app.resolveTemplate('stationListHeaderTemplate'));

		app.loadStationList();
		app.loadSystemStatus();
		navigator.geolocation.getCurrentPosition(app.onGeolocationSuccess, app.onGeolocationError);		
	},

	showStationDetailPage: function(stationId) {
		app.isShowingStationList = false;
		app.currentStation = stationId;

		$('#app').html(app.resolveTemplate('stationDetailPageTemplate'));
		app.loadStationDepartures(stationId);
	},

	loadStationList: function() {
		var updateUI = function() {
			$('#stationList').html(app.resolveTemplate('stationListTemplate', { stations: app.stationList.data }));

			$('#stations li').click(function(e) {
				app.showStationDetailPage($(this).attr('id'));
			});

			$('#reloadButton').click(function(e) {
				app.showStationListPage();
			});
		};

		// TODO check for expired last load date...
		if (app.stationList && app.stationList.data) {
			// Use cache
			console.log('CACHE HIT');
			updateUI();
		} else {
			console.log('NETWORK REQUEST');
			$.ajax({
				cache: false,
				error: function(xhr, status, errorMsg) {
					alert('failed to load stations');
					console.log(status);
					console.log(errorMsg);
				},
				method: 'GET',
				success: function(data, status) {
					app.stationList = { 
						data: data,
						lastUpdated: Date.now()
					};

					updateUI();
				},
				url: app.API_BASE_URL + 'stations',
			});
		}	
	},

	getStation: function(stationId) {
		var station = {};
		var n = 0;

		if (app.stationList && app.stationList.data) {
			for (n = 0; n < app.stationList.data.length; n++) {
				if (app.stationList.data[n].abbr === stationId) {
					station = app.stationList.data[n];
					break;
				}
			}
		}

		return station;
	},

	loadStationAccess: function() {
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to load station info');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				app.stationAccess = { 
					data: data,
					lastUpdated: Date.now()
				};
			},
			url: app.API_BASE_URL + 'stationAccess'
		});
	},

	getStationAccess: function(stationId) {
		var stationAccess = {};
		var n = 0;

		if (app.stationAccess && app.stationAccess.data) {
			for (n = 0; n < app.stationAccess.data.length; n++) {
				if (app.stationAccess.data[n].abbr === stationId) {
					stationAccess = app.stationAccess.data[n];
					break;
				}
			}
		}

		return stationAccess;
	},

	loadStationDepartures: function(stationId) {
		$.ajax({
			cache: false,
			error: function(xhr, status, errrMsg) {
				alert('failed to load depatures for ' + stationId);
			},
			method: 'GET',
			success: function(data, status) {
				$('#stationHeader').html(app.resolveTemplate('stationHeaderTemplate', { stationName: data.name }));
				$('#stationDepartures').html(app.resolveTemplate('stationDeparturesTemplate', { destinations: data.etd, station: app.getStation(stationId), stationAccess: app.getStationAccess(stationId), isiOS : (device.platform === 'iOS') }));

				$('#backButton').click(function() {
					app.showStationListPage();
				});

				$('#reloadButton').click(function(e) {
					app.showStationDetailPage(stationId);
				});

				$('.stationDetailLink').click(function(e) {
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
				if (data && data.bsa) {
					if (data.bsa.description === 'No delays reported.') {
						app.loadTrainCount();
					} else {
						$('#systemStatus').html(app.resolveTemplate('serviceAnnouncementTemplate', { announcement: data }));
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
				$('#systemStatus').html(app.resolveTemplate('trainCountTemplate', { systemStatus: data }));
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
				$('#closestStation').html(app.resolveTemplate('closestStationTemplate', { station: data}));

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

	onShake: function() {
		console.log('SHAKE DETECTED');
		if (app.isShowingStationList) {
			app.showStationListPage();
		} else {
			app.showStationDetailPage(app.currentStation);
		}
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
