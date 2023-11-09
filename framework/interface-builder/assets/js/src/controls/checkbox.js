const checkbox = {
	inputClass: '.cx-checkbox-input[type="hidden"]:not([name*="__i__"])',
	itemClass: '.cx-checkbox-label, .cx-checkbox-item',
	itemWrapClass: '.cx-checkbox-item-wrap',
	addButtonClass: '.cx-checkbox-add-button',
	customValueInputClass: '.cx-checkbox-custom-value',

	init: function() {
		$( 'body' )
			.on( 'click.cxCheckbox', this.itemClass, this.switchState.bind( this ) )
			.on( 'click.cxCheckbox', this.addButtonClass, this.addCustomCheckbox.bind( this ) )
			.on( 'input.cxCheckbox', this.customValueInputClass, this.updateCustomValue.bind( this ) );

		this.resetOnEditTagsPage();
	},

	switchState: function( event ) {
		var $_input           = $( event.currentTarget ).siblings( this.inputClass ),
			$customValueInput = $( event.target ).closest( this.customValueInputClass ),
			status            = cxInterfaceBuilderAPI.utils.filterBoolValue( $_input.val() ),
			$group            = $( event.currentTarget ).closest( '.cx-checkbox-group' ),
			$parent           = $( event.currentTarget ).closest( '.cx-control-checkbox' ),
			name              = $parent[0] ? $parent.data( 'control-name' ) : false,
			statusData        = {};

		if ( $customValueInput[0] ) {
			return;
		}

		$_input
			.val( ! status ? 'true' : 'false' )
			.attr( 'checked', ! status ? true : false )
			.trigger( 'change' );

		if ( !$group[0] ) {
			return;
		}

		statusData = cxInterfaceBuilderAPI.utils.serializeObject( $group );

		$( window ).trigger( {
			type: 'cx-checkbox-change',
			controlName: name,
			controlStatus: statusData
		} );
	},
	addCustomCheckbox: function( event ) {
		var $addButton = $( event.currentTarget ),
			html;

		event.preventDefault();

		html = '<div class="cx-checkbox-item-wrap">';
		html += '<span class="cx-label-content">';
		html += '<input type="hidden" class="cx-checkbox-input" checked value="true">';
		html += '<span class="cx-checkbox-item"><span class="marker dashicons dashicons-yes"></span></span>';
		html += '<label class="cx-checkbox-label"><input type="text" class="cx-checkbox-custom-value cx-ui-text"></label>';
		html += '</span>';
		html += '</div>';

		$addButton.before( html );
	},
	updateCustomValue: function( event ) {
		var $this   = $( event.currentTarget ),
			value   = $this.val(),
			$label  = $this.closest( '.cx-checkbox-label' ),
			$_input = $label.siblings( this.inputClass ),
			$parent = $this.closest( '.cx-control-checkbox' ),
			name    = $parent.data( 'control-name' );

		$_input.attr( 'name', value ? name + '[' + value + ']' : '' );
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
			if ( 'true' !== $( this ).val() ) {
				return;
			}

			defaultCheckInputs.push( $( this ).attr( 'name' ) );
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
				$customFields.closest( self.itemWrapClass ).remove();
			}

			$input.each( function() {
				if ( -1 !== defaultCheckInputs.indexOf( $( this ).attr( 'name' ) ) ) {
					$( this ).val( 'true' ).attr( 'checked', true );
				} else {
					$( this ).val( 'false' ).attr( 'checked', false );
				}
			} );
		} );
	}
}

export default checkbox;