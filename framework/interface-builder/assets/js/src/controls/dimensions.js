const dimensions = {
	container: '.cx-ui-dimensions',
	isLinked: '.cx-ui-dimensions__is-linked',
	units: '.cx-ui-dimensions__unit',
	unitsInput: 'input[name*="[units]"]',
	linkedInput: 'input[name*="[is_linked]"]',
	valuesInput: '.cx-ui-dimensions__val',

	init: function() {
		$( 'body' )
			.on( 'click', this.isLinked, { 'self': this }, this.switchLinked )
			.on( 'click', this.units, { 'self': this }, this.switchUnits )
			.on( 'input', this.valuesInput + '.is-linked', { 'self': this }, this.changeLinked );
	},

	render: function( event ) {},

	switchLinked: function( event ) {

		var self       = event.data.self,
			$this      = $( this ),
			$container = $this.closest( self.container ),
			$input     = $container.find( self.linkedInput ),
			$values    = $container.find( self.valuesInput ),
			isLinked   = $input.val();

		if ( 0 === parseInt( isLinked ) ) {
			$input.val(1);
			$this.addClass( 'is-linked' );
			$values.addClass( 'is-linked' );
		} else {
			$input.val(0);
			$this.removeClass( 'is-linked' );
			$values.removeClass( 'is-linked' );
		}

	},

	switchUnits: function( event ) {
		var self       = event.data.self,
			$this      = $( this ),
			unit       = $this.data( 'unit' ),
			$container = $this.closest( self.container ),
			$input     = $container.find( self.unitsInput ),
			$values    = $container.find( self.valuesInput ),
			range      = $container.data( 'range' );

		if ( $this.hasClass( 'is-active' ) ) {
			return;
		}

		$this.addClass( 'is-active' ).siblings( self.units ).removeClass( 'is-active' );
		$input.val( unit );
		$values.attr({
			min: range[ unit ].min,
			max: range[ unit ].max,
			step: range[ unit ].step
		});

	},

	changeLinked: function( event ) {
		var self  = event.data.self,
			$this = $( this ),
			$container = $this.closest( '.cx-ui-dimensions__values' );

		$( self.valuesInput, $container ).val( $this.val() )
	}
};

export default dimensions;