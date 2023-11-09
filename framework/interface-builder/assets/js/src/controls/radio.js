const radio = {
	inputClass: '.cx-radio-input:not([name*="__i__"])',
	customValueInputClass: '.cx-radio-custom-value',

	init: function() {
		$( 'body' )
			.on( 'click.cxRadio', this.inputClass, this.switchState.bind( this ) )
			.on( 'input.cxRadio', this.customValueInputClass, this.updateCustomValue.bind( this ) );

		this.resetOnEditTagsPage();
	},

	switchState: function( event ) {
		var $this             = $( event.currentTarget ),
			$customValueInput = $( event.currentTarget ).siblings( this.customValueInputClass ),
			name              = $this.attr( 'name' );

		if ( $customValueInput[0] ) {
			$customValueInput.focus();
		}

		$( window ).trigger( {
			type: 'cx-radio-change',
			controlName: name,
			controlStatus: $( $this ).val()
		} );
	},

	updateCustomValue: function( event ) {
		var $this   = $( event.currentTarget ),
			value   = $this.val(),
			$_input = $this.siblings( this.inputClass );

		$_input.attr( 'value', value );
	},
	resetOnEditTagsPage: function() {
		var self = this;

		if ( -1 === window.location.href.indexOf( 'edit-tags.php' ) ) {
			return;
		}

		var $input = $( self.inputClass ),
			defaultCheckInputs = [];

		if ( !$input[0] ) {
			return;
		}

		$input.each( function() {
			if ( ! $( this ).prop( 'checked' ) ) {
				return;
			}

			defaultCheckInputs.push( $( this ).attr( 'name' ) + '[' + $( this ).val() + ']' );
		} );

		$( document ).ajaxComplete( function( event, xhr, settings ) {

			if ( ! settings.data || -1 === settings.data.indexOf( 'action=add-tag' ) ) {
				return;
			}

			if ( -1 !== xhr.responseText.indexOf( 'wp_error' ) ) {
				return;
			}

			var $customFields = $( self.customValueInputClass );

			if ( $customFields[0] ) {
				$customFields.siblings( self.inputClass ).val( '' );
			}

			$input.each( function() {
				if ( -1 !== defaultCheckInputs.indexOf( $( this ).attr( 'name' ) + '[' + $( this ).val() + ']' ) ) {
					$( this ).prop( 'checked', true );
				} else {
					$( this ).prop( 'checked', false );
				}
			} );
		} );
	}
}

export default radio;