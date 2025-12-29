<?php
/**
 * Render `slideshow-block/slideshow` block for display.
 *
 * @package SlideshowBlock
 */

/**
 * Render callback for the `slideshow-block/slideshow` block.
 *
 * @param array $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 * @return string The content of the block being rendered.
 */
function slideshow_block_render( $attributes, $content ) {
	$unique_slideshow_classname = wp_unique_id( 'wp-block-slideshow-block-slideshow-' );
	$processed_content = new WP_HTML_Tag_Processor( $content );
	$processed_content->next_tag();
	$processed_content->add_class( $unique_slideshow_classname );
	return $processed_content->get_updated_html();
}

