const colorpicker = {
	inputClass: 'input.cx-ui-colorpicker:not([name*="__i__"])',

	init: function() {

		$( this.render.bind( this ) );

		$( document )
			//.on( 'ready.cxColorpicker', this.render.bind( this ) )
			.on( 'cx-control-init', this.render.bind( this ) );
	},

	render: function( event ) {
		var target = ( event._target ) ? event._target : $( 'body' ),
			input = $( this.inputClass, target );

		if ( input[0] ) {
			input.wpColorPicker( {
				change: this.changeHandler
			} );
		}
	},

	changeHandler: function( event, ui ) {
		var $this = $( event.target ),
			name  = $this.attr( 'name' );

		if ( ! name ) {
			return;
		}

		setTimeout( function() {
			$( window ).trigger( {
				type:          'cx-control-change',
				controlName:   name,
				controlStatus: $this.val()
			} );
		} );
	}
};

export default colorpicker;