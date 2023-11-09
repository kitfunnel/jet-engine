/**
 * Interface Builder
 */

"use strict";

import Component from './component';
import Control from './control';
import Utils from './utils';
import ControlValidation from './control-validation';

var cxInterfaceBuilder = {

	init: function() {
		// Component Init
		this.component.init();
		$( document ).on( 'cxFramework:interfaceBuilder:component', this.component.init.bind( this.component ) );

		// Control Init
		this.control.init();
		$( document ).on( 'cxFramework:interfaceBuilder:control', this.control.init.bind( this.control ) );

		// Control Validation
		this.controlValidation.init();
	},

	component: Component,
	control: Control,
	utils: Utils,
	controlValidation: ControlValidation,

	filters: ( function() {

		var callbacks = {};

		return {

			addFilter: function( name, callback ) {

				if ( ! callbacks.hasOwnProperty( name ) ) {
					callbacks[name] = [];
				}

				callbacks[name].push(callback);

			},

			applyFilters: function( name, value, args ) {

				if ( ! callbacks.hasOwnProperty( name ) ) {
					return value;
				}

				if ( args === undefined ) {
					args = [];
				}

				var container = callbacks[ name ];
				var cbLen     = container.length;

				for (var i = 0; i < cbLen; i++) {
					if (typeof container[i] === 'function') {
						value = container[i](value, args);
					}
				}

				return value;
			}
		};

	})(),

};

window.cxInterfaceBuilderAPI = cxInterfaceBuilder;

cxInterfaceBuilderAPI.init();
