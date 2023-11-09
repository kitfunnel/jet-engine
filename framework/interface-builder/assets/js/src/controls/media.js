import textControl from './text.js';

const media = {
	inputClass: 'input.cx-upload-input:not([name*="__i__"])',

	init: function() {

		$( this.mediaRender.bind( this ) );

		$( document )
			//.on( 'ready.cxMedia', this.mediaRender.bind( this ) )
			.on( 'cx-control-init', this.mediaRender.bind( this ) );

		$( 'body' )
			.on( 'change.cxMedia', this.inputClass, textControl.changeHandler.bind( this ) );
	},

	mediaRender: function( event ) {
		var target   = ( event._target ) ? event._target : $( 'body' ),
			$buttons = $( '.cx-upload-button', target ),
			prepareInputValue = function( input_value, settings ) {

				if ( !input_value.length ) {
					return '';
				}

				if ( 'both' === settings.value_format ) {
					if ( !settings.multiple ) {
						input_value = input_value[0];
					}

					input_value = JSON.stringify( input_value );
				} else {
					input_value = input_value.join( ',' );
				}

				return input_value;
			};

		var $postId = $( '#post_ID' );

		// Added for attach a media file to post.
		if ( $postId.length && wp.media.view && wp.media.view.settings && wp.media.view.settings.post && ! wp.media.view.settings.post.id ) {
			wp.media.view.settings.post.id = $postId.val();
		}

		$buttons.each( function() {
			var button = $( this ),
				buttonParent = button.closest('.cx-ui-media-wrap'),
				settings = {
					input: $( '.cx-upload-input', buttonParent ),
					img_holder: $( '.cx-upload-preview', buttonParent ),
					title_text: button.data('title'),
					multiple: button.data('multi-upload'),
					library_type: button.data('library-type'),
					value_format: button.data('value-format') || 'id',
				},
				cx_uploader = wp.media.frames.file_frame = wp.media({
					title: settings.title_text,
					button: { text: settings.title_text },
					multiple: settings.multiple,
					library : { type : settings.library_type }
				});

			if ( ! buttonParent.has('input[name*="__i__"]')[ 0 ] ) {

				button.off( 'click.cx-media' ).on( 'click.cx-media', function() {
					cx_uploader.open();
					return !1;
				} ); // end click

				if ( button.data( 'multi-upload' ) ) {
					cx_uploader.on( 'open', function() {

						var selection = cx_uploader.state().get( 'selection' );
						var selected  = settings.input.attr( 'data-ids-attr' );

						if ( selected ) {
							selected = selected.split(',');
							selected.forEach( function( imgID ) {
								selection.add( wp.media.attachment( imgID ) );
							} );
						}
					});
				}

				cx_uploader.on('select', function() {
					var attachment       = cx_uploader.state().get( 'selection' ).toJSON(),
						count            = 0,
						input_value      = [],
						input_ids        = [],
						new_img_object   = $( '.cx-all-images-wrap', settings.img_holder ),
						new_img          = '',
						fetchAttachments = [];

					attachment.forEach( function( attachmentData, index ) {

						if ( !attachmentData.url && attachmentData.id ) {
							fetchAttachments.push(
								wp.media.attachment( attachmentData.id ).fetch().then( function( data ) {
									attachment[index] = data;
								} )
							);
						}
					} );

					Promise.all( fetchAttachments ).then( function() {
						while ( attachment[count] ) {
							var attachment_data = attachment[count],
								attachment_id   = attachment_data.id,
								attachment_url  = attachment_data.url,
								mimeType        = attachment_data.mime,
								return_data     = '',
								img_src         = '',
								thumb           = '',
								thumb_type      = 'icon';

							if ( 'both' === settings.value_format ) {
								return_data = {
									id:  attachment_id,
									url: attachment_url,
								}
							} else {
								return_data = attachment_data[settings.value_format];
							}

							switch ( mimeType ) {
								case 'image/jpeg':
								case 'image/png':
								case 'image/gif':
								case 'image/svg+xml':
								case 'image/webp':
									if ( attachment_data.sizes !== undefined ) {
										img_src = attachment_data.sizes.thumbnail ? attachment_data.sizes.thumbnail.url : attachment_data.sizes.full.url;
									} else {
										img_src = attachment_url;
									}

									thumb = '<img  src="' + img_src + '" alt="" data-img-attr="' + attachment_id + '">';
									thumb_type = 'image';
									break;
								case 'application/pdf':
									thumb = '<span class="dashicons dashicons-media-document"></span>';
									break;
								case 'image/x-icon':
									thumb = '<span class="dashicons dashicons-format-image"></span>';
									break;
								case 'video/mpeg':
								case 'video/mp4':
								case 'video/quicktime':
								case 'video/webm':
								case 'video/ogg':
									thumb = '<span class="dashicons dashicons-format-video"></span>';
									break;
								case 'audio/mpeg':
								case 'audio/wav':
								case 'audio/ogg':
									thumb = '<span class="dashicons dashicons-format-audio"></span>';
									break;
							}

							new_img += '<div class="cx-image-wrap cx-image-wrap--' + thumb_type + '">' +
								'<div class="inner">' +
								'<div class="preview-holder" data-id-attr="' + attachment_id + '" data-url-attr="' + attachment_url + '"><div class="centered">' + thumb + '</div></div>' +
								'<a class="cx-remove-image" href="#"><i class="dashicons dashicons-no"></i></a>' +
								'<span class="title">' + attachment_data.title + '</span>' +
								'</div>' +
								'</div>';

							input_value.push( return_data );
							input_ids.push( attachment_id );
							count++;
						}

						settings.input.val( prepareInputValue( input_value, settings ) ).attr( 'data-ids-attr', input_ids.join( ',' ) ).trigger( 'change' );
						new_img_object.html( new_img );
					} );
				} );

				var removeMediaPreview = function( item ) {
					var buttonParent = item.closest( '.cx-ui-media-wrap' ),
						input         = $( '.cx-upload-input', buttonParent ),
						img_holder    = item.parent().parent( '.cx-image-wrap' ),
						img_attr      = $( '.preview-holder', img_holder ).data( 'id-attr' ),
						input_value   = input.attr( 'value' ),
						input_ids     = [];

					if ( ! input_value ) {
						return;
					}

					img_holder.remove();
					input_value = [];

					buttonParent.find( '.cx-image-wrap' ).each( function() {
						var attachment_id  = $( '.preview-holder', this ).data( 'id-attr' ),
							attachment_url = $( '.preview-holder', this ).data( 'url-attr' );

						input_ids.push( attachment_id );

						switch ( settings.value_format ) {
							case 'id':
								input_value.push( attachment_id );
								break;

							case 'url':
								input_value.push( attachment_url );
								break;

							case 'both':
								input_value.push( {
									id:  attachment_id,
									url: attachment_url,
								} );
								break;
						}
					} );

					input.attr( {
						'value': prepareInputValue( input_value, settings ),
						'data-ids-attr': input_ids.join( ',' ),
					} ).trigger( 'change' );
				};

				// This function remove upload image
				buttonParent.on( 'click', '.cx-remove-image', function () {
					removeMediaPreview( $( this ) );
					return !1;
				});
			}
		} ); // end each

		// Image ordering
		if ( $buttons[0] ) {
			$('.cx-all-images-wrap', target).sortable( {
				items: 'div.cx-image-wrap',
				cursor: 'move',
				scrollSensitivity: 40,
				forcePlaceholderSize: true,
				forceHelperSize: false,
				helper: 'clone',
				opacity: 0.65,
				placeholder: 'cx-media-thumb-sortable-placeholder',
				start:function(){},
				stop:function(){},
				update: function() {
					var input_value = [],
						input_ids = [],
						input = $( this ).parent().siblings( '.cx-element-wrap' ).find( 'input.cx-upload-input' ),
						button = $( this ).parent().siblings( '.cx-element-wrap' ).find( 'button.cx-upload-button' ),
						settings = {
							multiple:     button.data( 'multi-upload' ),
							value_format: button.data( 'value-format' ),
						};

					$( '.cx-image-wrap', this ).each( function() {
						var attachment_id  = $( '.preview-holder', this ).data( 'id-attr' ),
							attachment_url = $( '.preview-holder', this ).data( 'url-attr' );

						input_ids.push( attachment_id );

						switch ( settings.value_format ) {
							case 'id':
								input_value.push( attachment_id );
								break;

							case 'url':
								input_value.push( attachment_url );
								break;

							case 'both':
								input_value.push( {
									id:  attachment_id,
									url: attachment_url,
								} );
								break;
						}
					} );

					input.val( prepareInputValue( input_value, settings ) ).attr( 'data-ids-attr', input_ids.join( ',' ) ).trigger( 'change' );
				}
			} );
		}
	}
};

export default media;