const select = {
	selectWrapClass: '.cx-ui-select-wrapper',
	selectClass: '.cx-ui-select[data-filter="false"]:not([name*="__i__"])',
	select2Class: '.cx-ui-select[data-filter="true"]:not([name*="__i__"]), .cx-ui-select[multiple]:not([name*="__i__"])',
	selectClearClass: '.cx-ui-select-clear',

	init: function() {

		$( this.selectRender.bind( this ) );

		$( document )
			//.on( 'ready.cxSelect', this.selectRender.bind( this ) )
			.on( 'cx-control-init', this.selectRender.bind( this ) )
			.on( 'click.cxSelect', this.selectClearClass, this.clearSelect );

	},

	clearSelect: function( event ) {
		event.preventDefault();
		var $select = $( this ).siblings( 'select' );
		$select.find( ':selected' ).removeAttr( 'selected' );
		$select.val( null ).trigger( 'change' );
	},

	selectRender: function( event ) {
		var $target = ( event._target ) ? event._target : $( 'body' );

		$( this.selectClass, $target ).each( this.selectInit.bind( this ) );
		$( this.select2Class, $target ).each( this.select2Init.bind( this ) );
	},

	selectInit: function ( index, element ) {
		var $this = $( element ),
			name  = $this.attr( 'name' );

		$this.change( function( event ) {
			$( window ).trigger( {
				type: 'cx-select-change',
				controlName: name,
				controlStatus: $( event.target ).val()
			} );
		});
	},

	select2Init: function ( index, element ) {
		var $this    = $( element ),
			$wrapper = $this.closest( this.selectWrapClass ),
			name     = $this.attr( 'name' ),
			settings = { placeholder: $this.data( 'placeholder' ), dropdownCssClass: 'cx-ui-select2-dropdown' },
			postType = $this.data( 'post-type' ),
			exclude  = $this.data( 'exclude' ),
			action   = $this.data( 'action' );

		if ( action && postType ) {

			settings.ajax = {
				url: function() {
					return ajaxurl + '?action=' + action + '&post_type=' + $this.data( 'post-type' ) + '&exclude=' + exclude;
				},
				dataType: 'json'
			};

			settings.minimumInputLength = 3;

		}

		$this.select2( settings ).on( 'change.cxSelect2', function( event ) {
			$( window ).trigger( {
				type: 'cx-select2-change',
				controlName: name,
				controlStatus: $( event.target ).val()
			} );
		} );
	}
};

export default select;