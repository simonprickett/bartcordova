var app = {
	initialize: function() {
		this.bindEvents();
	},

	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},

	onDeviceReady: function() {
		$('#app').append('<div class="row"><div class="col-lg-12 text-center"><h2>Device is Ready!</h2></div></div>');
	}
}

/* Stop app rotating outside of right way up portrait. */
function shouldRotateToOrientation(degrees) {
	return (degrees === 0);
};

app.initialize();
