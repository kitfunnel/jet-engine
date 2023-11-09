const slider = {
	init: function() {
		$( 'body' ).on( 'input.cxSlider change.cxSlider', '.cx-slider-unit, .cx-ui-stepper-input', this.changeHandler.bind( this ) );
	},

	changeHandler: function( event ) {
		var $this            = $( event.currentTarget ),
			$thisVal         = $this.val(),
			$sliderWrapper   = $this.closest( '.cx-slider-wrap' ),
			$sliderContainer = $this.closest( '.cx-ui-container' ),
			$sliderSettings  = $sliderContainer.data( 'settings' ) || {},
			$stepperInput    = $( '.cx-ui-stepper-input', $sliderContainer ),
			controlName      = $stepperInput.attr( 'name' ),
			rangeLabel       = $sliderSettings['range_label'] || false,
			targetClass      = ( ! $this.hasClass( 'cx-slider-unit' ) ) ? '.cx-slider-unit' : '.cx-ui-stepper-input';

		$( targetClass, $sliderWrapper ).val( $thisVal );

		if ( controlName ) {
			$( window ).trigger( {
				type: 'cx-control-change',
				controlName: controlName,
				controlStatus: $thisVal
			} );
		}

		if ( rangeLabel ) {
			var $rangeLabel = $( '.cx-slider-range-label', $sliderWrapper ),
				rangeLabels = $sliderSettings['range_labels'];

			if ( 0 === +$thisVal ) {
				$rangeLabel.html( rangeLabels[+$thisVal]['label'] );
				$rangeLabel.css( 'color', rangeLabels[+$thisVal]['color'] );

				return false;
			}

			Object.keys(rangeLabels).reduce( function( prev, current, index, array ) {

				if ( ( +$thisVal > +prev && +$thisVal <= +current ) ) {
					$rangeLabel.html( rangeLabels[+current]['label'] );
					$rangeLabel.css( 'color', rangeLabels[+current]['color'] );
				}

				return current;
			} );
		}
	}
};

export default slider;