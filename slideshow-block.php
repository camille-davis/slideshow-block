<?php
/**
 * Plugin Name: Slideshow Block
 * Description: A simple Slideshow block for Gutenberg with automatic image transitions.
 * Version: 1.0.0
 * Author: Carnaval SF
 * License: GPL-2.0-or-later
 * Text Domain: slideshow-block
 *
 * @package SlideshowBlock
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ============================================================================
// Constants
// ============================================================================

const SLIDESHOW_BLOCK_VERSION = '1.0.0';

// ============================================================================
// Block Registration
// ============================================================================

// Load the render callback.
require_once __DIR__ . '/render.php';

function slideshow_block_register_block() {
	register_block_type( __DIR__, array( 'render_callback' => 'slideshow_block_render' ) );
}
add_action( 'init', 'slideshow_block_register_block' );

// ============================================================================
// Script Enqueuing
// ============================================================================

function slideshow_block_enqueue_view_script() {
	wp_enqueue_script(
		'slideshow-block-view',
		plugin_dir_url( __FILE__ ) . 'slideshow.js',
		array(),
		SLIDESHOW_BLOCK_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'slideshow_block_enqueue_view_script' );

function slideshow_block_enqueue_editor_assets() {
	wp_enqueue_script(
		'slideshow-block-editor',
		plugin_dir_url( __FILE__ ) . 'index.js',
		array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n', 'wp-data' ),
		SLIDESHOW_BLOCK_VERSION,
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'slideshow_block_enqueue_editor_assets' );

// ============================================================================
// Development Helpers
// ============================================================================

function slideshow_block_remove_version_script( $src ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG && strpos( $src, 'slideshow-block' ) !== false && strpos( $src, 'ver=' ) !== false ) {
		$src = remove_query_arg( 'ver', $src );
	}
	return $src;
}
add_filter( 'script_loader_src', 'slideshow_block_remove_version_script', 9999 );

