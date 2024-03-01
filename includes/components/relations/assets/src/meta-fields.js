import FieldsList from 'fields-list';

const {
	Button,
	TextControl,
} = wp.components;

const {
	Component,
	Fragment
} = wp.element;

const {
	assign,
	isEmpty
} = window.lodash;

class MetaFields extends Component {

	constructor( props ) {

		super( props );

		let value = this.props.value || {};

		let defaultValues = {};

		for ( const field of this.props.metaFields ) {
			if ( undefined !== field.value && undefined !== field.name ) {
				let defaultValue = field.value;

				if ( 'checkbox' === field.type ) {
					defaultValue = Object.keys( field.value );
				}

				defaultValues[field.name] = defaultValue;
			}
		}

		this.state = {
			metaData: assign( {}, defaultValues, value ),
			isBusy: false,
			done: false,
			error: false,
			errorMessage: '',
		}

		this.savedTimeout = null;
		this.errorTimeout = null;

	}

	saveMeta() {
		window.wp.ajax.send(
			'jet_engine_relations_save_relation_meta',
			{
				type: 'POST',
				data: {
					_nonce: window.JetEngineRelationsCommon._nonce,
					relID: this.props.relID,
					relatedObjectID: this.props.relatedObjectID,
					relatedObjectType: this.props.controlObjectType,
					relatedObjectName: this.props.controlObjectName,
					currentObjectID: this.props.currentObjectID,
					isParentProcessed: this.props.isParentProcessed,
					meta: this.state.metaData,
				},
				success: ( response ) => {

					this.setState( {
						isBusy: false,
						done: true,
					} );

					this.savedTimeout = setTimeout( () => {
						this.setState( {
							done: false,
						} );
					}, 2000 );


					this.props.onUpdate();

				},
				error: ( response, errorCode, errorText ) => {

					if ( response ) {
						alert( response );
					} else {
						alert( errorText );
					}

					this.setState( {
						isBusy: false,
						done: false,
					} );

				}
			}
		);
	}

	checkRequiredFields() {

		let emptyFields = [];

		for ( const field of this.props.metaFields ) {
			if ( field.required ) {
				let fieldEmpty = false;

				if ( undefined === this.state.metaData[ field.name ] ) {
					fieldEmpty = true;
				} else {
					fieldEmpty = isEmpty( this.state.metaData[ field.name ] );
				}

				if ( fieldEmpty ) {
					emptyFields.push( field.title );
				}
			}
		}

		if ( this.errorTimeout ) {
			clearTimeout( this.errorTimeout );
			this.errorTimeout = null;
		}

		if ( emptyFields.length ) {

			this.setState( {
				error: true,
				errorMessage: 'Empty required fields: ' + emptyFields.join( ', ' ),
			} );

			this.errorTimeout = setTimeout( () => {
				this.setState( {
					error: false,
					errorMessage: '',
				} );
			}, 3000 );

		} else {
			this.setState( {
				error: false,
				errorMessage: '',
			} );
		}

		return emptyFields.length > 0;
	}

	render() {
		
		return ( <Fragment>
			<FieldsList
				fields={ this.props.metaFields }
				values={ this.state.metaData }
				onChange={ ( newData ) => {
					this.setState( {
						metaData: assign( {}, newData )
					} );
				} }
			/>
			<div className="jet-engine-rels-popup__footer">
				<Button
					isPrimary
					isBusy={ this.state.isBusy }
					onClick={ () => {

						const hasEmptyRequiredFields = this.checkRequiredFields();

						if ( hasEmptyRequiredFields ) {
							return;
						}

						this.setState( {
							isBusy: true,
						} );

						if ( this.savedTimeout ) {
							clearTimeout( this.savedTimeout );
							this.savedTimeout = null;
						}

						this.saveMeta();
					} }
				>{ 'Save Meta Data' }</Button>
				{ this.state.error && <span style={ { marginLeft: '10px', color: 'red' } }>{ this.state.errorMessage }</span> }
				{ this.state.isBusy && <span style={ { marginLeft: '10px' } }>Saving...</span> }
				{ ! this.state.isBusy && this.state.done && <span style={ { marginLeft: '10px', color: 'green' } }>Saved!</span> }
			</div>
		</Fragment> );
	}

}

export default MetaFields;
