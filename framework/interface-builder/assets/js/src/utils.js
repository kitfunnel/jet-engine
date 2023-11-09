const Utils = {
	/**
	 * Serialize form into
	 *
	 * @return {Object}
	 */
	serializeObject: function( selector ) {

		var self = this,
			json = {},
			pushCounters = {},
			patterns = {
				'validate': /^[a-zA-Z_][a-zA-Z0-9_-]*(?:\[(?:\d*|[a-zA-Z0-9\s_-]+)\])*$/,
				'key':      /[a-zA-Z0-9\s_-]+|(?=\[\])/g,
				'push':     /^$/,
				'fixed':    /^\d+$/,
				'named':    /^[a-zA-Z0-9\s_-]+$/
			},
			serialized;

		this.build = function( base, key, value ) {
			base[ key ] = value;

			return base;
		};

		this.push_counter = function( key ) {
			if ( undefined === pushCounters[ key ] ) {
				pushCounters[ key ] = 0;
			}

			return pushCounters[ key ]++;
		};

		if ( 'FORM' === selector[0].tagName ) {
			serialized = selector.serializeArray();
		} else {
			serialized = selector.find( 'input, textarea, select' ).serializeArray();
		}

		$.each( serialized, function() {
			var k, keys, merge, reverseKey;

			// Skip invalid keys
			if ( ! patterns.validate.test( this.name ) ) {
				return;
			}

			keys = this.name.match( patterns.key );
			merge = this.value;
			reverseKey = this.name;

			while ( undefined !== ( k = keys.pop() ) ) {

				// Adjust reverseKey
				reverseKey = reverseKey.replace( new RegExp( '\\[' + k + '\\]$' ), '' );

				// Push
				if ( k.match( patterns.push ) ) {
					merge = self.build( [], self.push_counter( reverseKey ), merge );
				} else if ( k.match( patterns.fixed ) ) {
					merge = self.build( {}, k, merge );
				} else if ( k.match( patterns.named ) ) {
					merge = self.build( {}, k, merge );
				}
			}

			json = $.extend( true, json, merge );
		});

		return json;
	},

	/**
	 * Boolean value check
	 *
	 * @return {Boolean}
	 */
	filterBoolValue: function( value ) {
		var num = +value;

		return ! isNaN( num ) ? !! num : !! String( value ).toLowerCase().replace( !!0, '' );
	}
};

export default Utils;