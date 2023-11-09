class ControlConditions {
	constructor( id, args, siblingsControls ) {
		this.id = id;
		this.args = args;
		this.conditions = this.args.conditions;
		this.siblingsControls = siblingsControls;

		this.$selector = this.getSelector();
		this.$selector.data( 'condition-id', this.id );

		this.checked = false;
	}

	getIdParts() {
		return this.id.split( '::' );
	}

	getSelector() {

		let selector;

		if ( 'settings' === this.args.type ) {

			selector = '.cx-settings.' + this.args.name + ', [data-content-id="#' + this.args.name + '"]';

		} else {
			const idParts = this.getIdParts();
			const repeaterItemPattern = /^item-\d+$/;

			selector = '.cx-control[data-control-name="' + idParts[0] + '"]';

			if ( idParts.length > 1 ) {

				for ( let i = 1; i < idParts.length; i++ ) {

					if ( repeaterItemPattern.test( idParts[i] ) ) {
						selector = selector + ' [data-item-index="' + idParts[ i ].replace( 'item-', '' ) + '"]';
					} else {
						selector = selector + ' [data-repeater-control-name="' + idParts[ i ] + '"]';
					}
				}
			}
		}

		return $( selector );
	}

	getSiblingsValues( state ) {
		let idParts = this.getIdParts();

		if ( idParts.length > 1 ) {

			// Remove last key.
			idParts.splice( -1, 1 );

			let isNestingExist = true;

			for ( let key of idParts ) {

				if ( ! state[key] ) {
					isNestingExist = false;
					break;
				}

				state = state[key];
			}

			return isNestingExist ? state : false;
		}

		return state;
	}
}

const ConditionsManager = {

	controlConditions: {},
	controls:          window.cxInterfaceBuilder.controls || {},
	conditionState:    window.cxInterfaceBuilder.fields || {},

	init: function() {
		const self = this;

		$( window ).on( 'cx-switcher-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;

			self.updateConditionRules( controlName, controlStatus );
			self.renderConditionRules();
		});

		$( window ).on( 'cx-select-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;

			self.updateConditionRules( controlName, controlStatus );
			self.renderConditionRules();
		});

		$( window ).on( 'cx-select2-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;

			self.updateConditionRules( controlName, controlStatus );
			self.renderConditionRules();
		});

		$( window ).on( 'cx-radio-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;

			self.updateConditionRules( controlName, controlStatus );
			self.renderConditionRules();
		});

		$( window ).on( 'cx-checkbox-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;

			self.updateConditionRules( false, controlStatus );
			self.renderConditionRules();
		});

		$( window ).on( 'cx-control-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;

			self.updateConditionRules( controlName, controlStatus );
			self.renderConditionRules();
		});

		$( window ).on( 'cx-repeater-change', function( event ) {
			const controlName   = event.controlName;
			const controlStatus = event.controlStatus;
			const action        = event.action;

			self.updateConditionRules( controlName, controlStatus[ controlName ] || {} );

			if ( 'add' === action ) {
				self.generateConditionRules( { [ controlName ]: self.controls[ controlName ] }, controlStatus );
			}

			self.renderConditionRules();
		});

		self.generateConditionRules( self.controls, self.conditionState );
		self.renderConditionRules();

	},

	getControlNameParts: function( controlName ) {
		return controlName.match(/[a-zA-Z0-9_-]+|(?=\[\])/g);
	},

	generateConditionRules: function( controls, values, parentId ) {
		const self = this;

		$.each( controls, function( control, args ) {

			if ( 'repeater' === args.type && values.hasOwnProperty( control ) ) {

				$.each( values[ control ], function( itemKey, itemValues ) {

					let repeaterId = control + '::' + itemKey;

					if ( undefined !== parentId ) {
						repeaterId = parentId + '::' + repeaterId;
					}

					self.generateConditionRules( args.fields, itemValues, repeaterId );
				} );
			}

			if ( undefined === args.conditions ) {
				return;
			}

			// Convert conditions to new format.
			if ( undefined === args.conditions.__terms__ ) {
				args.conditions = self.convertConditions( args.conditions );
			}

			let id = args.name ? args.name : control;

			if ( undefined !== parentId ) {
				id = parentId + '::' + id;
			}

			if ( self.controlConditions[ id ] ) {
				return;
			}

			self.controlConditions[ id ] = new ControlConditions( id, args, controls );
		} );

	},

	convertConditions: function( conditions ) {
		const self = this;
		let terms = [];

		$.each( conditions, function( control, conditionValue ) {
			const controlNameParts    = control.match(/([a-zA-Z0-9_-]+)?(!?)$/i);
			const controlName         = controlNameParts[1];
			const isNegativeCondition = !!controlNameParts[2];

			if ( undefined === self.controls[ controlName ] ) {
				return;
			}

			const currentValue = self.getCurrentValue( controlName );

			terms.push( {
				name:     controlName,
				operator: self.getOperator( conditionValue, isNegativeCondition, currentValue ),
				value:    conditionValue,
			} );
		} )

		return {
			__relation__: 'AND',
			__terms__:    terms,
		};
	},

	getCurrentValue: function( controlName, allControls, allValues, isHidden ) {

		allControls = undefined !== allControls ? allControls : this.controls;
		allValues = undefined !== allValues ? allValues : this.conditionState;
		isHidden = undefined !== isHidden ? isHidden : false;

		let currentValue = '';

		const controlArgs = allControls[ controlName ];

		if ( undefined === controlArgs ) {
			return undefined;
		}

		const isMultiSelect = 'select' === controlArgs.type && controlArgs.multiple;
		const isCheckbox    = 'checkbox' === controlArgs.type;
		const isSwitcher    = 'switcher' === controlArgs.type;

		if ( isHidden ) {

			if ( isMultiSelect || isCheckbox ) {
				currentValue = [];
			}

			if ( isSwitcher ) {
				currentValue = false;
			}

			return currentValue;
		}

		if ( allValues.hasOwnProperty( controlName ) ) {
			currentValue = allValues[ controlName ];
		}

		if ( isCheckbox && 'object' === typeof currentValue ) {

			let _currentValue = [];

			$.each( currentValue, function( key, value ) {

				if ( true === value || 'true' === value ) {
					_currentValue.push( key );
				}

			} );

			currentValue = _currentValue;
		}

		if ( ( isMultiSelect || isCheckbox ) && ! Array.isArray( currentValue ) ) {
			currentValue = [];
		} else if ( isSwitcher && 'boolean' !== typeof currentValue ) {
			currentValue = cxInterfaceBuilderAPI.utils.filterBoolValue( currentValue );
		}

		return currentValue;
	},

	updateConditionRules: function( name, status ) {

		if ( false === name ) {
			this.conditionState = $.extend( true, this.conditionState, status );
			return;
		}

		let nameParts = this.getControlNameParts( name );

		// Remove empty strings.
		nameParts = nameParts.filter( ( item ) => {
			return undefined !== item && '' !== item;
		} );

		if ( 1 < nameParts.length ) {
			let key;

			while ( undefined !== ( key = nameParts.pop() ) ) {
				status = { [key]: status };
			}

			this.conditionState = $.extend( true, this.conditionState, status );
		} else {
			this.conditionState[ nameParts[0] ] = status;
		}
	},

	renderConditionRules: function() {
		const self = this;

		// Reset the `checked` prop of condition instance.
		$.each( this.controlConditions, function( id, instance ) {
			instance.checked = false;
		} );

		$.each( this.controlConditions, function( id, instance ) {

			if ( ! $( document ).find( instance.$selector ).length ) {
				delete self.controlConditions[ id ];
				return;
			}

			if ( instance.checked ) {
				return;
			}

			self.checkConditions( instance.$selector, instance.conditions, instance.siblingsControls, instance.getSiblingsValues( self.conditionState ) );
			instance.checked = true;
		} );
	},

	checkConditions: function( $selector, conditions, allControls, allValues ) {
		const self = this;
		const conditionsTerms = conditions.__terms__;
		const conditionsLength = conditionsTerms.length;
		const relation = conditions.__relation__ ? conditions.__relation__ : 'AND';
		const isRepeater = $selector.hasClass( 'cx-ui-repeater-item-control' );
		const hiddenClass = 'cx-control-hidden';

		let conditionsMet = [];
		let isVisible = false;

		$.each( conditionsTerms, function( i, condition ) {

			const $conditionSelector = isRepeater
				? $selector.siblings( '[data-repeater-control-name="' + condition.name + '"]' )
				: $( '.cx-control[data-control-name="' + condition.name + '"]' );

			const conditionId = $conditionSelector.data( 'condition-id' );

			let isHidden = false;

			if ( conditionId ) {
				const conditionInstance = self.controlConditions[ conditionId ];

				if ( ! conditionInstance.checked ) {
					self.checkConditions( conditionInstance.$selector, conditionInstance.conditions, conditionInstance.siblingsControls, conditionInstance.getSiblingsValues( self.conditionState ) );
					conditionInstance.checked = true;
				}

				if ( $conditionSelector.hasClass( hiddenClass ) ) {
					isHidden = true;
				}
			}

			const currentValue = self.getCurrentValue( condition.name, allControls, allValues, isHidden );
			const check        = self.compare( currentValue, condition.operator, condition.value );

			if ( check ) {
				conditionsMet.push( true );
			}
		} );

		switch ( relation ) {
			case 'AND':
			case 'and':
				isVisible = conditionsMet.length === conditionsLength;
				break;
			case 'OR':
			case 'or':
				isVisible = !! conditionsMet.length;
				break;
		}

		if ( ! isVisible ) {
			$selector.addClass( hiddenClass );
		} else {
			$selector.removeClass( hiddenClass );
		}
	},

	compare: function( leftValue, operator, rightValue ) {
		switch ( operator ) {
			case '==':
				return leftValue == rightValue;
			case '!=':
				return leftValue != rightValue;
			case '!==':
				return leftValue !== rightValue;
			case 'in':
				return -1 !== rightValue.indexOf( leftValue );
			case '!in':
				return -1 === rightValue.indexOf( leftValue );
			case 'contains':
				return -1 !== leftValue.indexOf( rightValue );
			case '!contains':
				return -1 === leftValue.indexOf( rightValue );
			case 'intersect':
				const intersect = leftValue.filter( item => rightValue.includes( item ) );
				return !! intersect.length;
			case '!intersect':
				const intersection = leftValue.filter( item => rightValue.includes( item ) );
				return ! intersection.length;
			case '<':
				return Number( leftValue ) < Number( rightValue );
			case '<=':
				return Number( leftValue ) <= Number( rightValue );
			case '>':
				return Number( leftValue ) > Number( rightValue );
			case '>=':
				return Number( leftValue ) >= Number( rightValue );
			case 'length_less':
				return this.compare( leftValue.length, '<', rightValue )
			case 'length_greater':
				return this.compare( leftValue.length, '>', rightValue )
			case 'empty':

				if ( 'object' === typeof leftValue ) {
					return $.isEmptyObject( leftValue );
				}

				if ( Array.isArray( leftValue ) ) {
					return ! leftValue.length;
				}

				return ! leftValue;
			case '!empty':
				return ! this.compare( leftValue, 'empty', null );
			case 'regexp':
				const regex = new RegExp( rightValue, 'mi' );
				return regex.test( leftValue );
			case '!regexp':
				return ! this.compare( leftValue, 'regexp', rightValue );
			default:
				return leftValue === rightValue;
		}
	},

	getOperator: function( conditionValue, isNegativeCondition, currentValue ) {
		let operator = '==';

		if ( Array.isArray( conditionValue ) && Array.isArray( currentValue ) ) {
			operator = isNegativeCondition ? '!intersect' : 'intersect';
		} else if ( Array.isArray( conditionValue ) ) {
			operator = isNegativeCondition ? '!in' : 'in';
		} else if ( Array.isArray( currentValue ) ) {
			operator = isNegativeCondition ? '!contains' : 'contains';
		} else if ( isNegativeCondition ) {
			operator = '!=';
		}

		return operator;
	}

};

export default ConditionsManager;