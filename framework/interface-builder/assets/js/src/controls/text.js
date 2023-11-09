const text = {
	inputClass: '.cx-ui-text:not([name*="__i__"]), .cx-ui-textarea:not([name*="__i__"])',

	init: function() {
		$( 'body' )
			.on( 'input.cxText, change.cxText', this.inputClass, this.changeHandler.bind( this ) );
	},

	changeHandler: function( event ) {
		var $this = $( event.currentTarget ),
			name  = $this.attr( 'name' );

		if ( ! name ) {
			return;
		}

		$( window ).trigger( {
			type: 'cx-control-change',
			controlName: name,
			controlStatus: $this.val()
		} );
	}
};

export default text;