const ControlValidation = {

	errorMessages: {
		required: window.cxInterfaceBuilder.i18n.requiredError,
		min:      window.cxInterfaceBuilder.i18n.minError,
		max:      window.cxInterfaceBuilder.i18n.maxError,
		step:     window.cxInterfaceBuilder.i18n.stepError,
	},

	init: function() {

		if ( this.isBlockEditor() ) {
			this.onBlockEditorSavePost();
		} else {
			$( '#post, #edittag, #your-profile, .cx-form' ).on( 'submit', this.onSubmitForm.bind( this ) );
		}

		cxInterfaceBuilderAPI.filters.addFilter( 'cxInterfaceBuilder/form/validation', this.requiredValidation.bind( this ) );
		cxInterfaceBuilderAPI.filters.addFilter( 'cxInterfaceBuilder/form/validation', this.numberValidation.bind( this ) );

		$( document ).on(
			'input change',
			'.cx-control input, .cx-control textarea, .cx-control select',
			this.removeFieldErrorOnChange.bind( this )
		);

		$( '.cx-control-repeater' ).on( 'focusin', this.removeRepeaterErrorOnChange.bind( this ) );

		// woocommerce tabs compatibility
		this.wooTabsCompatibility();
	},

	isBlockEditor: function() {
		return $( 'body' ).hasClass( 'block-editor-page' );
	},

	onBlockEditorSavePost: function() {
		var self     = this,
			editor   = wp.data.dispatch( 'core/editor' ),
			savePost = editor.savePost;

		editor.savePost = function( options ) {
			options = options || {};

			if ( options.isAutosave || options.isPreview ) {
				savePost( options );
				return;
			}

			self.beforeValidation();

			var validation = cxInterfaceBuilderAPI.filters.applyFilters( 'cxInterfaceBuilder/form/validation', true, $( '#editor' ) );

			if ( validation ) {
				savePost( options );
			} else {
				self.scrollToFirstErrorField();
			}
		};
	},

	onSubmitForm: function( event ) {

		this.beforeValidation();

		var validation = cxInterfaceBuilderAPI.filters.applyFilters( 'cxInterfaceBuilder/form/validation', true, $( event.target ) );

		if ( ! validation ) {
			this.scrollToFirstErrorField();
			event.preventDefault();
		}
	},

	beforeValidation: function() {
		this.removeAllFieldsErrors();

		if ( 'undefined' !== typeof window.tinyMCE ) {
			window.tinyMCE.triggerSave();
		}
	},

	requiredValidation: function( validation, $form ) {

		if ( ! validation ) {
			return validation;
		}

		var self            = this,
			$requiredFields = $form.find( '.cx-control-required:not(.cx-control-hidden)' ),
			hasEmptyFields  = false;

		if ( ! $requiredFields.length ) {
			return validation;
		}

		$requiredFields = $requiredFields.filter( function() {
			return ! $( this ).closest( '.cx-control-hidden, .cx-controls-novalidate' ).length;
		} );

		if ( ! $requiredFields.length ) {
			return validation;
		}

		$requiredFields.each( function() {
			var $field      = $( this ),
				controlName = $field.data( 'control-name' ),
				controlVal  = false;

			if ( $field.hasClass( 'cx-control-checkbox' ) || $field.hasClass( 'cx-control-radio' ) ) {
				controlVal = !! $field.find( '[name^="' + controlName + '"]' ).filter( ':checked' ).length;
			} else if ( $field.hasClass( 'cx-control-repeater' ) ) {
				controlVal = !! $field.find( '.cx-ui-repeater-item' ).length;
			} else {
				controlVal = $field.find( '[name^="' + controlName +'"]' ).val();
			}

			if ( Array.isArray( controlVal ) ) {
				controlVal = !! controlVal.length;
			}

			if ( ! controlVal ) {
				self.addFieldError( $field, self.errorMessages.required );
				hasEmptyFields = true;
			}
		} );

		if ( hasEmptyFields ) {
			return false;
		}

		return validation;
	},

	numberValidation: function( validation, $form ) {

		if ( ! validation ) {
			return validation;
		}

		var self             = this,
			$numberFields    = $form.find( '.cx-control-stepper:not(.cx-control-hidden), .cx-repeater-item-control-stepper:not(.cx-control-hidden)' ),
			hasInValidFields = false;

		if ( ! $numberFields.length ) {
			return validation;
		}

		$numberFields = $numberFields.filter( function() {
			return ! $( this ).closest( '.cx-control-hidden, .cx-controls-novalidate' ).length;
		} );

		if ( ! $numberFields.length ) {
			return validation;
		}

		$numberFields.each( function() {
			var $field   = $( this ),
				$input   = $field.find( 'input.cx-ui-stepper-input' ),
				minAttr  = $input.data( 'min' ),
				maxAttr  = $input.data( 'max' ),
				stepAttr = $input.data( 'step' ),
				value    = $input.val();

			if ( '' !== minAttr && value && Number( value ) < Number( minAttr ) ) {
				self.addFieldError( $field, self.errorMessages.min.replace( '%s', minAttr ) );
				hasInValidFields = true;
			} else if ( '' !== maxAttr && value && Number( value ) > Number( maxAttr ) ) {
				self.addFieldError( $field, self.errorMessages.max.replace( '%s', maxAttr ) );
				hasInValidFields = true;
			} else if ( '' !== stepAttr && value ) {
				var decimalPlaces = function( num ) {
						var match = ( "" + num ).match( /(?:\.(\d+))?$/ );

						if ( !match ) {
							return 0;
						}

						return match[ 1 ] ? match[ 1 ].length : 0;
					},
					valueDecimalCount = decimalPlaces( value ),
					stepDecimalCount = decimalPlaces( stepAttr ),
					decimalCount = valueDecimalCount > stepDecimalCount ? valueDecimalCount : stepDecimalCount,
					remainder = Math.round( value * Math.pow( 10, decimalCount ) ) % Math.round( stepAttr * Math.pow( 10, decimalCount ) );

				if ( 0 !== remainder ) {
					self.addFieldError( $field, self.errorMessages.step.replace( '%s', stepAttr ) );
					hasInValidFields = true;
				}
			}
		} );

		if ( hasInValidFields ) {
			return false;
		}

		return validation;
	},

	addFieldError: function( $field, message ) {
		var $error = $field.find( '.cx-control__error' );

		if ( $error.length ) {
			$error.html( message );
		} else {
			var containerClass = $field.hasClass( 'cx-ui-repeater-item-control' ) ? '.cx-ui-container' : '.cx-control__content';
			$field.find( containerClass ).append( '<div class="cx-control__error">' + message + '</div>' );
		}

		$field.addClass( 'cx-control--error' );
	},

	removeFieldError: function( $field ) {
		$field.find( '.cx-control__error' ).remove();
		$field.removeClass( 'cx-control--error' );
	},

	removeFieldErrorOnChange: function( event ) {

		var $field = $( event.target ).closest( '.cx-ui-repeater-item-control, .cx-control' );

		if ( ! $field.hasClass( 'cx-control--error' ) ) {
			return;
		}

		this.removeFieldError( $field );
	},

	removeRepeaterErrorOnChange: function( event ) {
		var $field = $( event.currentTarget ).closest( '.cx-control' );

		if ( ! $field.hasClass( 'cx-control--error' ) ) {
			return;
		}

		this.removeFieldError( $field );
	},

	removeAllFieldsErrors: function() {
		var self = this,
			$errorFields = $( '.cx-control--error' );

		if ( $errorFields.length ) {
			$errorFields.each( function() {
				self.removeFieldError( $( this ) );
			} );
		}
	},

	scrollToFirstErrorField: function() {
		var $field = $( '.cx-control--error' ).first();

		if ( ! $field.is( ':visible' ) ) {

			// Field inside hidden component.
			var $parentComponent = $field.closest( '.cx-component' );

			if ( $parentComponent.length ) {
				var componentID = $field.closest( '.cx-settings__content' ).attr( 'id' );
				$parentComponent.find( '[data-content-id="#' + componentID + '"]' ).trigger( 'click' );
			}

			// Field inside repeater item.
			var $repeaterItem = $field.closest( '.cx-ui-repeater-item.cx-ui-repeater-min' );

			if ( $repeaterItem.length ) {
				$repeaterItem.find( '.cx-ui-repeater-toggle' ).trigger( 'click' );
			}

			// Field inside woocommerce tab panel.
			var $tabPanel = $field.closest( '.panel.woocommerce_options_panel' );

			if ( $tabPanel.length ) {
				$( 'a[href="#' + $tabPanel.attr( 'id' ) + '"]' ).trigger( 'click' );
			}

			// Field inside hidden postbox.
			var $postbox = $field.closest( '.postbox.closed' );

			if ( $postbox.length ) {
				$postbox.find( 'button.handlediv' ).trigger( 'click' );
			}
		}

		var $scrollSelector = $( 'html, body' ),
			scrollTop = $field.offset().top,
			offset = 40;

		if ( this.isBlockEditor() ) {

			if ( $( 'body' ).hasClass( 'is-fullscreen-mode' ) ) {
				offset += 20;
			} else {
				offset += 60;
			}

			if ( $field.closest( '.interface-interface-skeleton__sidebar' ).length ) {
				$scrollSelector = $( '#editor .interface-interface-skeleton__sidebar' );
				offset += 50;
			} else {
				$scrollSelector = $( '#editor .interface-interface-skeleton__content' );
			}

			scrollTop += $scrollSelector.scrollTop();
		}

		$scrollSelector.stop().animate( { scrollTop: scrollTop - offset }, 500 );
	},

	wooTabsCompatibility: function() {
		var $wcProductData = $( '#woocommerce-product-data' );

		if ( ! $wcProductData.length ) {
			return;
		}

		$( '#woocommerce-product-data .panel.woocommerce_options_panel' ).on(
			'woocommerce_tab_shown',
			function( event ) {
				var $panel = $( event.target ),
					$otherPanels = $panel.parent().find( '.panel.woocommerce_options_panel' ).not( $panel );

				if ( $otherPanels.length ) {
					$otherPanels.each( function() {
						var $_panel = $( this ),
							panelIsHidden = $( '.wc-tabs li.' + $_panel.attr( 'id' ) + '_tab[style*="display: none"]' ).length;

						if ( panelIsHidden ) {
							$_panel.addClass( 'cx-controls-novalidate' );
						} else {
							$_panel.removeClass( 'cx-controls-novalidate' );
						}
					} );
				}

				$panel.removeClass( 'cx-controls-novalidate' );
			}
		);
	},
};

export default ControlValidation;