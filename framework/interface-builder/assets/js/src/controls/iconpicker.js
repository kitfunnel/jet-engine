const iconpicker = {
	iconSets: {},
	iconSetsKey: 'cx-icon-sets',

	init: function() {

		$( this.setIconsSets.bind( this, window.CxIconSets ) );
		$( this.render.bind( this ) );

		$( document )
			//.on( 'ready.cxIconpicker', this.setIconsSets.bind( this, window.CxIconSets ) )
			//.on( 'ready.cxIconpicker', this.render.bind( this ) )
			.on( 'cx-control-init', this.render.bind( this ) );
	},

	setIconsSets: function( iconSets ) {
		var icons,
			_this = this;

		if ( iconSets ) {
			icons  = ( iconSets.response ) ? iconSets.response.CxIconSets : iconSets;

			$.each( icons, function( name, data ) {
				_this.iconSets[name] = data;
			} );

			_this.setState( _this.iconSetsKey, _this.iconSets );
		}
	},

	getIconsSets: function() {
		var iconSets = this.getState( this.iconSetsKey );

		if ( iconSets ) {
			this.iconSets = iconSets;
		}
	},

	render: function( event ) {
		var target = ( event._target ) ? event._target : $( 'body' ),
			$picker = $( '.cx-ui-iconpicker:not([name*="__i__"])', target ),
			$this,
			set,
			setData,
			_this = this;

		if ( $picker[0] ) {
			this.getIconsSets();

			$picker.each( function() {
				$this   = $( this );
				set     = $this.data( 'set' );
				setData = _this.iconSets[set];

				if ( $this.length && setData.icons ) {
					$this.iconpicker({
						icons: setData.icons,
						iconBaseClass: setData.iconBase,
						iconClassPrefix: setData.iconPrefix,
						animation: false,
						fullClassFormatter: function( val ) {
							return setData.iconBase + ' ' + setData.iconPrefix + val;
						}
					}).on( 'iconpickerUpdated', function() {
						$( this ).trigger( 'change' );

						$( window ).trigger( {
							type: 'cx-control-change',
							controlName: $( this ).attr( 'name' ),
							controlStatus: $( this ).val()
						} );
					});
				}

				if ( setData ) {
					$( 'head' ).append( '<link rel="stylesheet" type="text/css" href="' + setData.iconCSS + '"">' );
				}
			} );
		}
	},

	getState: function( key ) {
		try {
			return JSON.parse( window.sessionStorage.getItem( key ) );
		} catch ( e ) {
			return false;
		}
	},

	setState: function( key, data ) {
		try {
			window.sessionStorage.setItem( key, JSON.stringify( data ) );
		} catch ( e ) {
			return false;
		}
	}
};

export default iconpicker;