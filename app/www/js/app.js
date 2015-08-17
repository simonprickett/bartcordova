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

app.initialize();
