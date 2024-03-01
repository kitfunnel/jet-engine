(function() {
	'use strict';

	Vue.component( 'jet-engine-borlabs-cookie-settings', {
		template: '#jet-engine-borlabs-cookie-settings',

		data: function() {
			return {
				installation: false,
				nonce: window.JetEngineMapsSettings._nonce,
			};
		},
		methods: {
			installPackage: function() {
				const self = this;

				this.installation = true;

				jQuery.ajax( {
					url: window.ajaxurl,
					type: 'POST',
					dataType: 'json',
					data: {
						action: 'jet_engine_maps_install_borlabs_package',
						nonce: self.nonce,
					},
				} ).done( function( response ) {

					if ( response.success ) {

						response.data.notices.forEach( function( notice ) {
							self.$CXNotice.add( {
								message: notice.message,
								type: notice.type,
								duration: 7000,
							} );
						} );

					} else {
						self.$CXNotice.add( {
							message: response.data.message,
							type: 'error',
							duration: 15000,
						} );
					}

					self.installation = false;

				} ).fail( function( jqXHR, textStatus, errorThrown ) {
					self.$CXNotice.add( {
						message: errorThrown,
						type: 'error',
						duration: 15000,
					} );

					self.installation = false;
				} );
			}
		}
	} );

})();
