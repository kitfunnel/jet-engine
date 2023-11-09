const switcher = {
	switcherClass: '.cx-switcher-wrap',
	trueClass: '.cx-input-switcher-true',
	falseClass: '.cx-input-switcher-false',

	init: function() {
		$( 'body' ).on( 'click.cxSwitcher', this.switcherClass, this.switchState.bind( this ) );
	},

	switchState: function( event ) {
		var $this       = $( event.currentTarget ),
			$inputTrue  = $( this.trueClass, $this ),
			$inputFalse = $( this.falseClass, $this ),
			status      = $inputTrue[0].checked,
			name        = $inputTrue.attr( 'name' );

		$inputTrue.prop( 'checked', ( status ) ? false : true );
		$inputFalse.prop( 'checked', ( ! status ) ? false : true );

		status = $inputTrue[0].checked;

		$( window ).trigger( {
			type: 'cx-switcher-change',
			controlName: name,
			controlStatus: status
		} );
	}
};

export default switcher;