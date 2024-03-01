<?php
namespace Jet_Engine\Modules\Maps_Listings\Compatibility;

use Jet_Engine\Modules\Maps_Listings\Module;
use Borlabs\Cookie\System\Language\Language;
use Borlabs\Cookie\System\ContentBlocker\ContentBlockerManager;
use Borlabs\Cookie\System\ContentBlocker\ContentBlockerService;
use Borlabs\Cookie\System\Provider\ProviderService;
use Borlabs\Cookie\System\Service\ServiceService;
use Borlabs\Cookie\System\ScriptBlocker\ScriptBlockerManager;
use Borlabs\Cookie\Model\ScriptBlocker\ScriptBlockerModel;
use Borlabs\Cookie\Repository\ContentBlocker\ContentBlockerRepository;
use Borlabs\Cookie\Repository\ScriptBlocker\ScriptBlockerRepository;
use Borlabs\Cookie\Repository\Provider\ProviderRepository;
use Borlabs\Cookie\Repository\Service\ServiceRepository;
use Borlabs\Cookie\Repository\ServiceGroup\ServiceGroupRepository;
use Borlabs\Cookie\DtoList\System\KeyValueDtoList;
use Borlabs\Cookie\Dto\System\KeyValueDto;

class Borlabs_Cookie_v3 {

	private const CONTENT_BLOCKER_KEY = 'jet-engine-maps-listings';

	private $app_container = null;
	private $language = null;
	private $notices = array();

	public function __construct() {

		if ( ! class_exists( 'Borlabs\Cookie\Container\ApplicationContainer' ) ) {
			return;
		}

		$this->app_container = \Borlabs\Cookie\Container\ApplicationContainer::get();
		$this->language      = $this->app_container->get( Language::class );

		add_action( 'jet-engine/maps-listing/settings/after-controls', array( $this, 'add_settings_fields' ), 99 );
		add_action( 'jet-engine/maps-listing/settings/before-assets',  array( $this, 'add_settings_assets' ) );
		add_action( 'wp_ajax_jet_engine_maps_install_borlabs_package', array( $this, 'install_package' ) );

		add_action( 'update_option_' . Module::instance()->settings->settings_key, array( $this, 'update_blockers' ), 10, 2 );

		add_filter( 'jet-engine/maps-listings/content', array( $this, 'add_handle_content_blocking' ) );

		add_action( 'elementor/preview/enqueue_scripts', array( $this, 'disable_blocking_in_preview' ) );
	}

	public function add_settings_fields() {
		?>
		<jet-engine-borlabs-cookie-settings></jet-engine-borlabs-cookie-settings>
		<?php
	}

	public function add_settings_assets() {

		wp_enqueue_script(
			'jet-engine-maps-borlabs-settings',
			jet_engine()->plugin_url( 'includes/modules/maps-listings/assets/js/admin/settings-borlabs.js' ),
			array( 'cx-vue-ui' ),
			jet_engine()->get_version(),
			true
		);

		add_action( 'admin_footer', array( $this, 'print_settings_template' ) );
	}

	public function print_settings_template() {
		?>
		<script type="text/x-template" id="jet-engine-borlabs-cookie-settings">
			<cx-vui-component-wrapper
				label="<?php _e( 'Borlabs Cookie Compatibility Package', 'jet-engine' ); ?>"
				description="<?php _e( 'Install Borlabs Cookie Compatibility Package for seamless integration and enhanced functionality. This package includes: Content Blocker, Script Blocker, additional providers and services.', 'jet-engine' ); ?>"
				:wrapper-css="[ 'equalwidth' ]"
			>
				<cx-vui-button
					size="mini"
					button-style="accent-border"
					:loading="installation"
					:disabled="installation"
					@click="installPackage"
				>
						<span
							slot="label"
							v-html="'<?php _e( 'Install', 'jet-engine' ); ?>'"
						></span>
				</cx-vui-button>
			</cx-vui-component-wrapper>
		</script>
		<?php
	}

	public function install_package() {

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Access denied', 'jet-engine' ) ) );
		}

		$nonce = ! empty( $_REQUEST['nonce'] ) ? $_REQUEST['nonce'] : false;

		if ( ! $nonce || ! wp_verify_nonce( $nonce, Module::instance()->settings->settings_key ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Nonce validation failed', 'jet-engine' ) ) );
		}

		$this->notices = array();

		$this->install_content_blocker();
		$this->install_script_blocker();

		wp_send_json_success( array( 'notices' => $this->notices ) );
	}

	public function install_content_blocker() {
		$content_blocker_repository = $this->app_container->get( ContentBlockerRepository::class );
		$map_content_blocker        = $content_blocker_repository->getByKey( self::CONTENT_BLOCKER_KEY );

		if ( $map_content_blocker ) {
			$this->notices[] = array(
				'type'    => 'info',
				'message' => esc_html__( 'Map Listing content blocker already exists.', 'jet-engine' ),
			);
			return;
		}

		$content_blocker_service = $this->app_container->get( ContentBlockerService::class );

		$provider_id = $this->get_provider_id();
		$service_id  = $this->get_service_id();

		$content_blocker_service->save( -1,
			$this->language->getSelectedLanguageCode(),
			array(
				'id'                       => '-1',
				'key'                      => self::CONTENT_BLOCKER_KEY,
				'name'                     => esc_html__( 'JetEngine - Map Listing', 'jet-engine' ),
				'status'                   => true,
				'undeletable'              => false,
				'javaScriptGlobal'         => $this->get_global_js(),
				'javaScriptInitialization' => $this->get_init_js(),
				'previewHtml'              => $this->get_preview_html(),
				'previewImage'             => jet_engine()->modules->modules_url( 'maps-listings/assets/images/dummy-map-2.png' ),
				'providerId'               => $provider_id,
				'serviceId'                => $service_id,
				'languageStrings'          => $this->get_language_strings(),
				'settingsFields'           => array(
					'default' => array(
						'execute-global-code-before-unblocking' => true,
					)
				),
			)
		);

		$this->notices[] = array(
			'type'    => 'success',
			'message' => esc_html__( 'Map Listing content blocker installed.', 'jet-engine' ),
		);
	}

	public function get_global_js() {
		$global_js = '
window.BorlabsCookie.ScriptBlocker.allocateScriptBlockerToContentBlocker( contentBlockerData.id, "' . self::CONTENT_BLOCKER_KEY . '", "scriptBlockerId" );
window.BorlabsCookie.Unblock.unblockScriptBlockerId( "' . self::CONTENT_BLOCKER_KEY . '" );

jQuery( window ).on( "jet-engine/frontend-maps/loaded", function() {
	window.JetEngineMaps.init();
} );';

		return $global_js;
	}

	public function get_init_js() {
		$init_js = '
if ( undefined === window.JetEngineMaps ) {
	jQuery( window ).on( "jet-engine/frontend-maps/loaded", function() {
		window.JetEngineMaps.customInitMapBySelector( jQuery(el) );
	} );
} else {
	window.JetEngineMaps.customInitMapBySelector( jQuery(el) );
}';

		return $init_js;
	}

	public function get_language_strings() {
		return array(
			array(
				'key' => 'acceptServiceUnblockContent',
				'value' => esc_html__( 'Accept required service and unblock content', 'jet-engine' )
			),
			array(
				'key' => 'description',
				'value' => sprintf(
					esc_html__( 'You are currently viewing a placeholder content from %s. To access the actual content, click the button below. Please note that doing so will share data with third-party providers.', 'jet-engine' ),
					'<strong>' . esc_html__( 'Map Listing', 'jet-engine' ) .  '</strong>'
				),
			),
			array(
				'key' => 'moreInformation',
				'value' => esc_html__( 'More Information', 'jet-engine' )
			),
			array(
				'key' => 'unblockButton',
				'value' => esc_html__( 'Unblock content', 'jet-engine' )
			),
		);
	}

	public function get_preview_html(){
		ob_start();
		?>
		<div class="brlbs-cmpnt-cb-preset-b">
			<div class="brlbs-cmpnt-cb-thumbnail" style="background-image: url('{{ previewImage }}')"></div>
			<div class="brlbs-cmpnt-cb-main">
				<div class="brlbs-cmpnt-cb-content">
					<p class="brlbs-cmpnt-cb-description">{{ description }}</p>
					<a class="brlbs-cmpnt-cb-provider-toggle" href="#" data-borlabs-cookie-show-provider-information role="button">{{ moreInformation }}</a>
				</div>
				<div class="brlbs-cmpnt-cb-buttons">
					<a class="brlbs-cmpnt-cb-btn" href="#" data-borlabs-cookie-unblock role="button">{{ unblockButton }}</a>
					<a class="brlbs-cmpnt-cb-btn" href="#" data-borlabs-cookie-accept-service role="button" style="display: {{ serviceConsentButtonDisplayValue }}">{{ acceptServiceUnblockContent }}</a>
				</div>
			</div>
		</div>
		<?php

		return ob_get_clean();
	}

	public function get_provider_id( $map_provider = null ) {
		$provider_id   = 1; // default provider id
		$map_provider  = ! empty( $map_provider ) ? $map_provider : Module::instance()->settings->get( 'map_provider' );
		$provider_info = $this->get_provider_info( $map_provider );

		$provider_repository = $this->app_container->get( ProviderRepository::class );

		if ( empty( $provider_info ) || empty( $provider_info['key'] ) ) {

			$unknown_provider = $provider_repository->getByKey( 'unknown' );

			if ( $unknown_provider ) {
				return $unknown_provider->id;
			}

			return $provider_id;
		}

		$provider = $provider_repository->getByKey( $provider_info['key'] );

		if ( $provider ) {
			return $provider->id;
		}

		$provider_service = $this->app_container->get( ProviderService::class );

		$provider_id = $provider_service->save( -1,
			$this->language->getSelectedLanguageCode(),
			array_merge(
				$provider_info,
				array(
					'id'          => '-1',
					'undeletable' => false,
				)
			),
		);

		return $provider_id;
	}

	public function get_provider_info( $map_provider ) {

		switch ( $map_provider ) {
			case 'google':
				$info = array(
					'key'         => 'google',
					'name'        => esc_html__( 'Google', 'jet-engine' ),
					'address'     => esc_html__( 'Gordon House, Barrow Street, Dublin 4, Ireland', 'jet-engine' ),
					'description' => esc_html__( 'Google LLC, the umbrella company of all Google services, is a technology company that provides various services and engages in the development of hardware and software.', 'jet-engine' ),
					'cookieUrl'   => 'https://policies.google.com/technologies/cookies?hl=en',
					'privacyUrl'  => 'https://policies.google.com/privacy?hl=en',
					'optOutUrl'   => '',
					'partners'    => array(),
				);
				break;

			case 'leaflet':
			case 'mapbox':
				$info = array(
					'key'         => 'open-street-map',
					'name'        => esc_html__( 'OpenStreetMap', 'jet-engine' ),
					'address'     => esc_html__( 'OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, United Kingdom', 'jet-engine' ),
					'description' => esc_html__( 'OpenStreetMap is a free and open geographic database.', 'jet-engine' ),
					'cookieUrl'   => '',
					'privacyUrl'  => 'https://wiki.osmfoundation.org/wiki/Privacy_Policy',
					'optOutUrl'   => '',
					'partners'    => array(),
				);
				break;

			default:
				$info = array();
		}

		return $info;
	}

	public function get_service_id( $map_provider = null ) {
		$service_id   = 0; // default service id
		$map_provider = ! empty( $map_provider ) ? $map_provider : Module::instance()->settings->get( 'map_provider' );
		$service_info = $this->get_service_info( $map_provider );

		$service_repository = $this->app_container->get( ServiceRepository::class );

		if ( empty( $service_info ) || empty( $service_info['key'] ) ) {
			return $service_id;
		}

		$service = $service_repository->getByKey( $service_info['key'] );

		if ( $service ) {
			return $service->id;
		}

		$service = $this->app_container->get( ServiceService::class );

		$service_group_id = 0; // default service group id

		$service_group_repository = $this->app_container->get( ServiceGroupRepository::class );
		$external_media_group     = $service_group_repository->getByKey( 'external-media' );

		if ( $external_media_group ) {
			$service_group_id = $external_media_group->id;
		}

		if ( ! $service_group_id ) {
			$essential_group = $service_group_repository->getByKey( 'essential' );

			if ( $essential_group ) {
				$service_group_id = $essential_group->id;
			}
		}

		$provider_id = $this->get_provider_id( $map_provider );

		$service_id = $service->save( -1,
			$this->language->getSelectedLanguageCode(),
			array_merge(
				$service_info,
				array(
					'id'             => '-1',
					'status'         => true,
					'position'       => 1,
					'providerId'     => $provider_id,
					'serviceGroupId' => $service_group_id,
					'optInCode'      => '',
					'optOutCode'     => '',
					'fallbackCode'   => '',
					'undeletable'    => false,
					'settingsFields' => array(
						'default' => array(
							'prioritize'                   => false,
							'disable-code-execution'       => false,
							'block-cookies-before-consent' => false,
							'asynchronous-opt-out-code'    => false,
						),
					),
				)
			),
		);

		return $service_id;
	}

	public function get_service_info( $map_provider ) {

		switch ( $map_provider ) {
			case 'google':
				$info = array(
					'key'         => 'maps',
					'name'        => esc_html__( 'Google Maps', 'jet-engine' ),
					'description' => esc_html__( 'Google LLC, the umbrella company of all Google services, is a technology company that provides various services and engages in the development of hardware and software.', 'jet-engine' ),
				);
				break;

			case 'leaflet':
			case 'mapbox':
				$info = array(
					'key'         => 'open-street-map',
					'name'        => esc_html__( 'OpenStreetMap', 'jet-engine' ),
					'description' => esc_html__( 'Open Street Map is a web mapping platform that provides detailed geographical information. If you consent to this service, content from this platform will be displayed on this website.', 'jet-engine' ),
				);
				break;

			default:
				$info = array();
		}

		return $info;
	}

	public function install_script_blocker() {
		$script_blocker_repository = $this->app_container->get( ScriptBlockerRepository::class );
		$map_script_blocker        = $script_blocker_repository->getByKey( self::CONTENT_BLOCKER_KEY );

		if ( $map_script_blocker ) {
			$this->notices[] = array(
				'type'    => 'info',
				'message' => esc_html__( 'Map Listing script blocker already exists.', 'jet-engine' ),
			);
			return;
		}

		$handles = new KeyValueDtoList();

		foreach ( $this->get_scripts_handles() as $handle ) {
			$handles->add( new KeyValueDto( $handle, '' ) );
		}

		$model = new ScriptBlockerModel();
		$model->handles = $handles;
		$model->key = self::CONTENT_BLOCKER_KEY;
		$model->name = esc_html__( 'JetEngine - Map Listing', 'jet-engine' );
		$model->onExist = new KeyValueDtoList();
		$model->phrases = new KeyValueDtoList();
		$model->status = true;
		$model->undeletable = false;

		$script_blocker_repository->insert( $model );

		$this->notices[] = array(
			'type'    => 'success',
			'message' => esc_html__( 'Map Listing script blocker installed.', 'jet-engine' ),
		);
	}

	public function get_scripts_handles( $provider_id = null ) {

		$main_handles = array(
			'jet-maps-listings',
		);

		if ( $provider_id ) {
			$provider = Module::instance()->providers->get_providers( 'map', $provider_id );
		} else {
			$provider = Module::instance()->providers->get_active_map_provider();
		}

		return array_merge( $main_handles, $provider->get_script_handles() );
	}

	public function update_blockers( $old_settings, $new_settings ) {

		$old_provider = ! empty( $old_settings['map_provider'] ) ? $old_settings['map_provider'] : false;
		$new_provider = ! empty( $new_settings['map_provider'] ) ? $new_settings['map_provider'] : false;

		if ( empty( $new_provider ) || $old_provider === $new_provider ) {
			return;
		}

		// Update content blocker
		$content_blocker_repository = $this->app_container->get( ContentBlockerRepository::class );
		$map_content_blocker        = $content_blocker_repository->getByKey( self::CONTENT_BLOCKER_KEY );

		if ( $map_content_blocker ) {
			$map_content_blocker->providerId = (int) $this->get_provider_id( $new_provider );
			$map_content_blocker->serviceId = (int) $this->get_service_id( $new_provider );

			$content_blocker_repository->update( $map_content_blocker );
		}

		// Update script blocker
		$script_blocker_repository = $this->app_container->get( ScriptBlockerRepository::class );
		$map_script_blocker        = $script_blocker_repository->getByKey( self::CONTENT_BLOCKER_KEY );

		if ( $map_script_blocker ) {
			$handles = new KeyValueDtoList();

			foreach ( $this->get_scripts_handles( $new_provider ) as $handle ) {
				$handles->add( new KeyValueDto( $handle, '' ) );
			}

			$map_script_blocker->handles = $handles;
			$script_blocker_repository->update( $map_script_blocker );
		}
	}

	public function add_handle_content_blocking( $html ) {

		if ( is_admin() ) {
			return $html;
		}

		$content_blocker     = $this->app_container->get( ContentBlockerManager::class );
		$map_content_blocker = $content_blocker->getContentBlockerByKey( self::CONTENT_BLOCKER_KEY );

		if ( $map_content_blocker ) {
			$html = $content_blocker->handleContentBlocking( $html, '', self::CONTENT_BLOCKER_KEY );
		}

		return $html;
	}

	public function disable_blocking_in_preview() {
		remove_filter(
			'script_loader_tag',
			array( $this->app_container->get( ScriptBlockerManager::class ), 'blockHandle' ),
			999
		);

		remove_filter(
			'style_loader_tag',
			array( $this->app_container->get( ScriptBlockerManager::class ), 'blockHandle' ),
			999
		);
	}

}
