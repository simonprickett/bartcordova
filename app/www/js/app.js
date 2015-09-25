/* global cordova Handlebars $ device shake shouldRotateToOrientation */

'use strict';

var app = {
	// TODO: Home page tabs - departures, tickets, anything else (Elevators?)
	// TODO: Cache station list for a while and later reload it
	// TODO: Cache station details for a while and later reload it?
	// TODO: Network error handling
	// TODO: Don't throw the Ajax loader for loading system status and nearest station
	// TODO: Page transitions
	// TODO: Refresh on return from background
	// TODO: Precompiled Handlebars templates?
	// TODO: Look at a CSS linter?

	API_BASE_URL: 'http://bart.crudworks.org/api/',

	status: {
		stationAccess: undefined,
		stationList: undefined,
		isShowingStationList: true,
		isShakeEnabled: false,
		currentStation: undefined
	},

	initialize: function() {
		this.registerTemplateHelpers();
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},

	registerTemplateHelpers: function() {
		Handlebars.registerHelper('round', function(numToRound) {
			numToRound = parseFloat(numToRound);
			return(Math.round(numToRound * 10) / 10);
		});

		Handlebars.registerHelper('formatTime', function(timeToFormat) {
			var timeComponents = timeToFormat.split(':');
			return(timeComponents[0] + ':' + timeComponents[1]);
		});		

		Handlebars.registerHelper('formatMins', function(minsToFormat) {
			if (minsToFormat === 'Leaving') {
				return minsToFormat;
			} else {
				return minsToFormat + (minsToFormat === '1' ? ' min' : ' mins');
			}
		});

		Handlebars.registerHelper('formatTrainIcon', function(minsToDeparture) {
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

		Handlebars.registerHelper('formatStationName', function(stationName) {
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

		$(document).ajaxStop(function() {
			$('#loadMask').hide();
		});

		if (device.platform === 'Android') {
			document.addEventListener('backbutton', app.onBackButton, false);
			document.addEventListener('menubutton', app.onMenuButton, false);
			document.addEventListener('searchbutton', app.onSearchButton, false);
		}

		if (device.platform === 'iOS') {
			window.addEventListener('statusTap', function() {
				$('html, body').animate({ scrollTop: 0 }, 'slow'); 
			});
		}

		navigator.splashscreen.hide();
		
		app.showStationListPage();
		app.loadStationAccess();

		$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', app.onTabChange);
	},

	showStationListPage: function() {
		app.status.isShowingStationList = true;
		app.status.currentStation = undefined;
		app.enableShakeDetection();

		$('#app').html(app.resolveTemplate('stationListPageTemplate'));
		$('#title').html(app.resolveTemplate('stationListHeaderTemplate'));

		app.loadStationList();
		app.loadSystemStatus();

		navigator.geolocation.getCurrentPosition(app.onGeolocationSuccess, app.onGeolocationError);		
	},

	showStationDetailPage: function(stationId) {
		app.status.isShowingStationList = false;
		app.status.currentStation = stationId;
		app.loadStationDepartures(stationId);
	},

	enableShakeDetection: function() {
		if (! app.status.isShakeEnabled) {
			shake.startWatch(app.onShake, 30);
			app.status.isShakeEnabled = true;
		}
	},

	disableShakeDetection: function() {
		shake.stopWatch();
		app.status.isShakeEnabled = false;
	},

	amendLinks : function (selector) {
		$(selector).find('a').each(
			function() {
				var href = $(this).attr('href');
				var iabOptions = (device.platform === 'iOS' ? 'location=no,enableViewportScale=yes,transitionstyle=fliphorizontal' : '');

				if (href.indexOf('http') === 0) {
					$(this).click(function(e) {
						e.preventDefault();
						cordova.InAppBrowser.open(''.concat(this.href), '_blank', iabOptions);
					});
				}
			}
		);      
	},

	loadStationList: function() {
		var updateUI = function() {
			$('#stationList').html(app.resolveTemplate('stationListTemplate', { stations: app.status.stationList.data }));

			$('#stations li').click(function(e) {
				app.showStationDetailPage($(this).attr('id'));
			});

			$('#reloadButton').click(function(e) {
				app.showStationListPage();
			});
		};

		// TODO check for expired last load date...
		if (app.status.stationList && app.status.stationList.data) {
			// Use cache
			console.log('CACHE HIT');
			updateUI();
		} else {
			console.log('NETWORK REQUEST');
			$('#loadMask').show();
			$.ajax({
				cache: false,
				error: function(xhr, status, errorMsg) {
					alert('failed to load stations');
					console.log(status);
					console.log(errorMsg);
				},
				method: 'GET',
				success: function(data, status) {
					app.status.stationList = { 
						data: data,
						lastUpdated: Date.now()
					};

					updateUI();
				},
				url: app.API_BASE_URL + 'stations'
			});
		}	
	},

	getStation: function(stationId) {
		var station = {};
		var n = 0;

		if (app.status.stationList && app.status.stationList.data) {
			for (n = 0; n < app.status.stationList.data.length; n++) {
				if (app.status.stationList.data[n].abbr === stationId) {
					station = app.status.stationList.data[n];
					break;
				}
			}
		}

		return station;
	},

	loadStationAccess: function() {
		$('#loadMask').show();
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to load station info');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				app.status.stationAccess = { 
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

		if (app.status.stationAccess && app.status.stationAccess.data) {
			for (n = 0; n < app.status.stationAccess.data.length; n++) {
				if (app.status.stationAccess.data[n].abbr === stationId) {
					stationAccess = app.status.stationAccess.data[n];
					break;
				}
			}
		}

		return stationAccess;
	},

	loadStationDepartures: function(stationId) {
		$('#loadMask').show();
		$.ajax({
			cache: false,
			error: function(xhr, status, errMsg) {
				alert('failed to load depatures for ' + stationId);
			},
			method: 'GET',
			success: function(data, status) {
				$('#app').html(app.resolveTemplate('stationDetailPageTemplate'));
				$('#stationHeader').html(app.resolveTemplate('stationHeaderTemplate', { stationName: data.name }));
				$('#stationDepartures').html(app.resolveTemplate('stationDeparturesTemplate', { stations: app.status.stationList.data, destinations: data.etd, station: app.getStation(stationId), stationAccess: app.getStationAccess(stationId), isiOS : (device.platform === 'iOS') }));

				$('#backButton').click(function() {
					app.showStationListPage();
				});

				$('#reloadButton').click(function() {
					app.showStationDetailPage(stationId);
				});

				$('.stationDetailLink').click(function() {
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
		});
	},

	onGeolocationError: function(error) {
		console.log(error);
	},

	onTabChange: function(e) {
		var tabName = e.target.getAttribute('href');

		switch(tabName) {
			case '#departures':
				$('#reloadButton').show();
				app.enableShakeDetection();
				break;

			case '#info':
				$('#reloadButton').hide();
				app.disableShakeDetection();
				app.amendLinks('#infoExternalContent');
				break;

			case '#tickets':
				$('#reloadButton').hide();
				app.disableShakeDetection();
				$('#ticketsButton:not(.bound)').addClass('bound').click(function(e) {
					e.preventDefault();
					app.onTicketsButtonPressed();
				});

				$('#swapButton:not(.bound)').addClass('bound').click(function(e) {
					e.preventDefault();
					app.onSwapButtonPressed();
				});

				$('#startingStation > option').each(function() {
					if (app.status.currentStation === this.value) {
						$('#startingStation').val(app.status.currentStation);
						// Break from each loop
						return false;
					}
				});

				$('#destinationStation').val('INVALID');

				$('#ticketResults').hide();
				$('#ticketForm').show();

				break;
		}
	},

	onTicketsButtonPressed: function() {
		var startStation = $('#startingStation').val();
		var destinationStation = $('#destinationStation').val();

		if (startStation === 'INVALID') {
			$('#ticketError').html(app.resolveTemplate('ticketErrorTemplate', { errorMessage: 'Please choose a starting station.'}));
			return;
		}

		if (destinationStation === 'INVALID') {
			$('#ticketError').html(app.resolveTemplate('ticketErrorTemplate', { errorMessage: 'Please choose a destination station.'}));
			return;
		}

		if (startStation === destinationStation) {
			$('#ticketError').html(app.resolveTemplate('ticketErrorTemplate', { errorMessage: 'Starting & destination stations can\'t be the same.'}));
			return;
		}

		$('#ticketError').hide();

		$('#loadMask').show();
		$.ajax({
			cache: false,
			error: function(xhr, status, errorMsg) {
				alert('failed to get ticket / trip information');
				console.log(status);
				console.log(errorMsg);
			},
			method: 'GET',
			success: function(data, status) {
				// do something with the data!
				$('#ticketResults').html(app.resolveTemplate('ticketResultsTemplate', { results: data}));
				app.amendLinks('#ticketResults');
				$('#ticketForm').hide();

				$('#newTicketSearchButton:not(.bound)').addClass('bound').click(function(e) {
					e.preventDefault();
					app.onNewTicketSearch();
				});

				$('#ticketResults').show();
			},
			url: app.API_BASE_URL + 'tickets/' + startStation + '/' + destinationStation
		});
	},

	onSwapButtonPressed: function() {
		var startStation = $('#startingStation').val();
		var destinationStation = $('#destinationStation').val();

		$('#startingStation').val(destinationStation);
		$('#destinationStation').val(startStation);
	},

	onNewTicketSearch: function() {
		$('#ticketResults').hide();
		$('#ticketForm').show();
	},

	onShake: function() {
		if (app.status.isShowingStationList) {
			app.showStationListPage();
		} else {
			app.showStationDetailPage(app.status.currentStation);
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

		if (app.status.isShowingStationList) {
			// Go to launcher
			navigator.app.exitApp();
		} else {
			// Back to station list
			app.showStationListPage();
		}
	},

	onMenuButton: function() {
		console.log('User pressed menu button.');
	},

	onSearchButton: function() {
		console.log('User pressed search button.');
	}
};

/* Stop app rotating outside of right way up portrait. */
function shouldRotateToOrientation(degrees) {
	return (degrees === 0);
}

app.initialize();
