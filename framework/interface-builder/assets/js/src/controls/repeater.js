const repeater = {
	repeaterControlClass: '.cx-control-repeater',
	repeaterContainerClass: '.cx-ui-repeater-container',
	repeaterListClass: '.cx-ui-repeater-list',
	repeaterItemClass: '.cx-ui-repeater-item',
	repeaterItemHandleClass: '.cx-ui-repeater-actions-box',
	repeaterTitleClass: '.cx-ui-repeater-title',
	addItemButtonClass: '.cx-ui-repeater-add',
	removeItemButtonClass: '.cx-ui-repeater-remove',
	removeConfirmItemButtonClass: '.cx-ui-repeater-remove__confirm',
	removeCancelItemButtonClass: '.cx-ui-repeater-remove__cancel',
	copyItemButtonClass: '.cx-ui-repeater-copy',
	toggleItemButtonClass: '.cx-ui-repeater-toggle',
	minItemClass: 'cx-ui-repeater-min',
	sortablePlaceholderClass: 'sortable-placeholder',

	init: function() {

		$( this.addEvents.bind( this ) );
		//$( document ).on( 'ready.cxRepeat', this.addEvents.bind( this ) );
	},

	addEvents: function() {
		$( 'body' )
			.on( 'click', this.addItemButtonClass, { 'self': this }, this.addItem )
			.on( 'click', this.removeItemButtonClass, { 'self': this }, this.showRemoveItemTooltip )
			.on( 'click', this.removeConfirmItemButtonClass, { 'self': this }, this.removeItem )
			.on( 'click', this.removeCancelItemButtonClass, { 'self': this }, this.hideRemoveItemTooltip )
			.on( 'click', this.copyItemButtonClass, { 'self': this }, this.copyItem )
			.on( 'click', this.toggleItemButtonClass, { 'self': this }, this.toggleItem )
			.on( 'change', this.repeaterListClass + ' input, ' + this.repeaterListClass + ' textarea, ' + this.repeaterListClass + ' select', { 'self': this }, this.changeWrapperLable )
			.on( 'sortable-init', { 'self': this }, this.sortableItem );

		$( document )
			.on( 'cx-control-init', { 'self': this }, this.sortableItem );

		this.triggers();
	},

	triggers: function( $target ) {
		$( 'body' ).trigger( 'sortable-init' );

		if ( $target ) {
			$( document ).trigger( 'cx-control-init', { 'target': $target } );
		}

		return this;
	},

	addItem: function( event ) {
		var self        = event.data.self,
			$list       = $( this ).prev( self.repeaterListClass ),
			index       = $list.data( 'index' ),
			tmplName    = $list.data( 'name' ),
			rowTemplate = wp.template( tmplName ),
			widgetId    = $list.data( 'widget-id' ),
			data        = { index: index },
			$parent     = $list.parent().closest( self.repeaterListClass );

		widgetId = '__i__' !== widgetId ? widgetId : $list.attr( 'id' ) ;

		if ( widgetId ) {
			data.widgetId = widgetId;
		}

		if ( $parent.length ) {
			data.parentIndex = parseInt( $parent.data( 'index' ), 10 ) - 1;
		}

		$list.append( rowTemplate( data ) );

		index++;
		$list.data( 'index', index );

		self.triggers( $( self.repeaterItemClass + ':last', $list ) ).stopDefaultEvent( event );

		var $control = $list.closest( self.repeaterControlClass );

		$( window ).trigger( {
			type: 'cx-repeater-change',
			action: 'add',
			controlName: $control.data( 'control-name' ),
			controlStatus: cxInterfaceBuilderAPI.utils.serializeObject( $control )
		} );
	},

	copyItem: function( event ) {
		var self        = event.data.self,
			$item       = $( this ).closest( self.repeaterItemClass ),
			$list       = $( this ).closest( self.repeaterListClass ),
			$parent     = $list.parent().closest( self.repeaterListClass ),
			itemIndex   = $item.data( 'item-index' ),
			newIndex    = $list.data( 'index' ),
			tmplName    = $list.data( 'name' ),
			widgetId    = $list.data( 'widget-id' ),
			rowTemplate = wp.template( tmplName ),
			data        = { index: newIndex },
			newItemHtml,
			$newItem;

		widgetId = '__i__' !== widgetId ? widgetId : $list.attr( 'id' ) ;

		if ( widgetId ) {
			data.widgetId = widgetId;
		}

		if ( $parent.length ) {
			data.parentIndex = parseInt( $parent.data( 'index' ), 10 ) - 1;
		}

		$newItem = $( rowTemplate( data ) );

		// Set values.
		$item.find( '.cx-ui-repeater-item-control' ).each( function() {
			var controlName = $( this ).data( 'repeater-control-name' ),
				$field      = $( this ).find( '[name^="' + widgetId + '\[item-' + itemIndex + '\]\[' + controlName + '\]"]' );

			// Set value for checkbox, radio, switcher fields.
			if ( $field.filter( '.cx-checkbox-input, .cx-radio-input, .cx-input-switcher' ).length ) {

				$field.each( function() {
					var $this       = $( this ),
						checked     = $this.prop( 'checked' ),
						value       = $this.val(),
						nameAttr    = $this.attr( 'name' ),
						newNameAttr = nameAttr.replace( '[item-' + itemIndex + ']', '[item-' + newIndex + ']' );

					if ( $this.hasClass( 'cx-checkbox-input' ) ) {
						$newItem.find( '[name="' + newNameAttr + '"]' ).val( value ).attr( 'checked', checked );
					} else {
						$newItem.find( '[name="' + newNameAttr + '"][value="' + value + '"]' ).prop( 'checked', checked );
					}
				} );

				// Set value for select fields.
			} else if ( $field.filter( '.cx-ui-select' ).length ) {
				var hasFilter  = $field.data( 'filter' );

				if ( hasFilter ) {
					$newItem
						.find( '.cx-ui-select[name^="' + widgetId + '\[item-' + newIndex + '\]\[' + controlName + '\]"]' )
						.html( $field.html() );
				} else {
					$newItem
						.find( '.cx-ui-select[name^="' + widgetId + '\[item-' + newIndex + '\]\[' + controlName + '\]"]' )
						.val( $field.val() );
				}

			} else {
				$newItem
					.find( '[name="' + widgetId + '\[item-' + newIndex + '\]\[' + controlName + '\]"]' )
					.val( $field.val() );
			}

			// Add media preview.
			var $mediaWrap = $( this ).find( '.cx-ui-media-wrap' );

			if ( $mediaWrap.length ) {
				var previewHtml = $mediaWrap.find( '.cx-upload-preview' ).html();

				$newItem
					.find( '.cx-ui-repeater-item-control[data-repeater-control-name="' + controlName + '"] .cx-upload-preview' )
					.html( previewHtml );
			}
		} );

		// Add repeater title.
		$newItem.find( '.cx-ui-repeater-title' ).html( $item.find( '.cx-ui-repeater-title' ).html() );

		$item.after( $newItem );

		newIndex++;
		$list.data( 'index', newIndex );

		self.triggers( $newItem )
			.stopDefaultEvent( event );

		var $control = $list.closest( self.repeaterControlClass );

		$( window ).trigger( {
			type: 'cx-repeater-change',
			action: 'add',
			controlName: $control.data( 'control-name' ),
			controlStatus: cxInterfaceBuilderAPI.utils.serializeObject( $control )
		} );
	},

	showRemoveItemTooltip: function( event ) {
		var self = event.data.self;

		$( this ).find( '.cx-tooltip' ).addClass( 'cx-tooltip--show' );

		self.stopDefaultEvent( event );
	},

	hideRemoveItemTooltip: function( event ) {
		var self = event.data.self;

		$( this ).closest( '.cx-tooltip' ).removeClass( 'cx-tooltip--show' );

		self.stopDefaultEvent( event );
	},

	removeItem: function( event ) {
		var self  = event.data.self,
			$list = $( this ).closest( self.repeaterListClass );

		self.applyChanges( $list );

		$( this ).closest( self.repeaterItemClass ).remove();

		self
			.triggers()
			.stopDefaultEvent( event );

		var $control = $list.closest( self.repeaterControlClass );

		$( window ).trigger( {
			type: 'cx-repeater-change',
			action: 'remove',
			controlName: $control.data( 'control-name' ),
			controlStatus: cxInterfaceBuilderAPI.utils.serializeObject( $control )
		} );
	},

	toggleItem: function( event ) {
		var self = event.data.self,
			$container = $( this ).closest( self.repeaterItemClass );

		$container.toggleClass( self.minItemClass );

		self.stopDefaultEvent( event );
	},

	sortableItem: function( event ) {
		var self  = event.data.self,
			$list = $( self.repeaterListClass ),
			$this,
			initFlag;

		$list.each( function( indx, element ) {
			$this    = $( element );
			initFlag = $( element ).data( 'sortable-init' );

			if ( ! initFlag ) {
				$this.sortable( {
					items: self.repeaterItemClass,
					handle: self.repeaterItemHandleClass,
					cursor: 'move',
					scrollSensitivity: 40,
					forcePlaceholderSize: true,
					forceHelperSize: false,
					distance: 2,
					tolerance: 'pointer',
					helper: function( event, element ) {
						return element.clone()
							.find( ':input' )
							.attr( 'name', function( i, currentName ) {
								return 'sort_' + parseInt( Math.random() * 100000, 10 ).toString() + '_' + currentName;
							} )
							.end();
					},
					start:function( event, ui ){
						$( window ).trigger( {
							type: 'cx-repeater-sortable-start',
							_item: ui.item
						} );
					},
					stop:function( event, ui ){
						$( window ).trigger( {
							type: 'cx-repeater-sortable-stop',
							_item: ui.item
						} );
					},
					opacity: 0.65,
					placeholder: self.sortablePlaceholderClass,
					create: function() {
						$this.data( 'sortable-init', true );
					},
					update: function( event, ui ) {
						var target = $( event.target );

						self.applyChanges( target );
					}
				} );
			} else {
				$this.sortable( 'refresh' );
			}
		} );
	},

	changeWrapperLable: function( event ) {
		var self        = event.data.self,
			$list       = $( self.repeaterListClass ),
			titleField  = $list.data( 'title-field' ),
			$this       = $( this ),
			value,
			parentItem;

		if ( titleField && $this.closest( '.' + titleField + '-wrap' )[0] ) {
			parentItem  = $this.closest( self.repeaterItemClass );

			if ( 'SELECT' === $this[0].nodeName ) {
				var selectedLabels = [];

				$this.find( 'option:selected' ).each( function() {
					selectedLabels.push( $( this ).html() );
				} );

				value = selectedLabels.join( ', ' );

			} else {
				value = $this.val();
			}

			$( self.repeaterTitleClass, parentItem ).html( value );
		}

		//self.stopDefaultEvent( event );
	},

	applyChanges: function( target ) {
		if ( undefined !== wp.customize ) {
			$( 'input[name]:first, select[name]:first', target ).change();
		}

		return this;
	},

	stopDefaultEvent: function( event ) {
		event.preventDefault();
		event.stopImmediatePropagation();
		event.stopPropagation();

		return this;
	}

};

export default repeater;