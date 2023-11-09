<?php
/**
 * JetMenu compatibility package
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Menu_Package' ) ) {

	/**
	 * Define Jet_Engine_Menu_Package class
	 */
	class Jet_Engine_Menu_Package {

		public function __construct() {
			add_action( 'jet_plugins/frontend/register_scripts', array( $this, 'reset_printed_dynamic_css' ) );
		}

		public function reset_printed_dynamic_css() {

			if ( ! jet_engine()->dynamic_tags ) {
				return;
			}

			if ( ! method_exists( jet_engine()->dynamic_tags, 'reset_printed_css' ) ) {
				return;
			}

			jet_engine()->dynamic_tags->reset_printed_css();
		}

	}

}

new Jet_Engine_Menu_Package();
