const wysiwyg = {

	defaultEditorSettings: {
		tinymce: {
			wpautop: true,
			toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,wp_more,spellchecker,wp_adv,dfw',
			toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help'
		},
		quicktags: {
			buttons: 'strong,em,link,block,del,ins,img,ul,ol,li,code,more,close,dfw'
		},
		mediaButtons: true
	},

	editorSettings: false,

	init: function() {

		var self = this;

		$( window ).on( 'load', function() {
			setTimeout( function() {
				$( self.render.bind( self ) );
			} )
		} );

		$( document )
			.on( 'cx-control-init', this.render.bind( this ) );

		$( window )
			.on( 'cx-repeater-sortable-stop', this.reInit.bind( this ) );
	},
	render: function( event ) {
		var self = this,
			target = ( event._target ) ? event._target : $( 'body' ),
			textarea = $( 'textarea.cx-ui-wysiwyg:not([name*="__i__"])', target );

		if ( textarea[0] ) {
			textarea.each( function() {
				var $this = $( this ),
					id    = $this.attr( 'id' );

				if ( $this.data( 'init' ) ) {
					return;
				}

				if ( typeof window.wp.editor.initialize !== 'undefined' ) {
					window.wp.editor.initialize( id, self.getEditorSettings() );
				} else {
					window.wp.oldEditor.initialize( id, self.getEditorSettings() );
				}

				var editor = window.tinymce.get( id );

				if ( editor ) {
					editor.on( 'change', function( event ) {
						$( window ).trigger( {
							type:          'cx-control-change',
							controlName:   $this.attr( 'name' ),
							controlStatus: editor.getContent()
						} );

						$this.trigger( 'change' );
					} );
				}

				self.addSaveTriggerOnEditTagsPage( id );

				$this.data( 'init', true );
			} );
		}
	},
	reInit: function( event ) {
		var self = this,
			target = event._item,
			textarea = $( 'textarea.wp-editor-area', target );

		if ( textarea[0] ) {
			textarea.each( function() {
				var $this = $( this ),
					id    = $this.attr( 'id' );

				if ( typeof window.wp.editor.initialize !== 'undefined' ) {
					window.wp.editor.remove( id );
					window.wp.editor.initialize( id, self.getEditorSettings() );
				} else {
					window.wp.oldEditor.remove( id );
					window.wp.oldEditor.initialize( id, self.getEditorSettings() );
				}
			} );
		}
	},
	getEditorSettings: function() {
		if ( this.editorSettings ) {
			return this.editorSettings;
		}

		this.editorSettings = this.defaultEditorSettings;

		if ( window.tinyMCEPreInit ) {
			if ( window.tinyMCEPreInit.mceInit && window.tinyMCEPreInit.mceInit.cx_wysiwyg ) {
				this.editorSettings.tinymce = window.tinyMCEPreInit.mceInit.cx_wysiwyg;
			}

			if ( window.tinyMCEPreInit.qtInit && window.tinyMCEPreInit.qtInit.cx_wysiwyg ) {
				this.editorSettings.quicktags = window.tinyMCEPreInit.qtInit.cx_wysiwyg;
			}
		}

		return this.editorSettings;
	},
	addSaveTriggerOnEditTagsPage: function( id ) {

		if ( -1 === window.location.href.indexOf( 'edit-tags.php' ) ) {
			return;
		}

		if ( window.tinymce ) {
			var editor = window.tinymce.get( id );

			if ( editor ) {
				editor.on( 'change', function() {
					editor.save();
				} );
			}

			// Reset editor content after added new term.
			$( document ).ajaxComplete( function( event, xhr, settings ) {

				if ( ! settings.data || -1 === settings.data.indexOf( 'action=add-tag' ) ) {
					return;
				}

				if ( -1 !== xhr.responseText.indexOf( 'wp_error' ) ) {
					return;
				}

				editor.setContent( '' );

			} );
		}
	},
};

export default wysiwyg;