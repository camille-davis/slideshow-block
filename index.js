(function () {
	const { registerBlockType } = wp.blocks;
	const { useBlockProps, InnerBlocks, MediaUpload, MediaUploadCheck, BlockControls, useInnerBlocksProps } = wp.blockEditor;
	const { Button, Placeholder, ToolbarButton } = wp.components;
	const { createElement, Fragment, useEffect } = wp.element;
	const { __ } = wp.i18n;
	const { useSelect, useDispatch } = wp.data;
	const { SVG, Path } = wp.primitives;

	// ============================================================================
	// Constants
	// ============================================================================

	const SLIDE_DURATION = 5000; // 5 seconds per image
	const BREAKPOINT_DESKTOP = 1200;
	const MOBILE_HEIGHT = 800;
	const MIN_HEIGHT = 400;

	// Gallery icon from WP icons library (same as lightbox gallery).
	const slideshowIcon = createElement(SVG, {
		viewBox: '0 0 24 24',
		xmlns: 'http://www.w3.org/2000/svg',
	}, createElement(Path, {
		d: 'M16.375 4.5H4.625a.125.125 0 0 0-.125.125v8.254l2.859-1.54a.75.75 0 0 1 .68-.016l2.384 1.142 2.89-2.074a.75.75 0 0 1 .874 0l2.313 1.66V4.625a.125.125 0 0 0-.125-.125Zm.125 9.398-2.75-1.975-2.813 2.02a.75.75 0 0 1-.76.067l-2.444-1.17L4.5 14.583v1.792c0 .069.056.125.125.125h11.75a.125.125 0 0 0 .125-.125v-2.477ZM4.625 3C3.728 3 3 3.728 3 4.625v11.75C3 17.273 3.728 18 4.625 18h11.75c.898 0 1.625-.727 1.625-1.625V4.625C18 3.728 17.273 3 16.375 3H4.625ZM20 8v11c0 .69-.31 1-.999 1H6v1.5h13.001c1.52 0 2.499-.982 2.499-2.5V8H20Z',
		fillRule: 'evenodd',
	}));

	// ============================================================================
	// Block Registration
	// ============================================================================

	registerBlockType('slideshow-block/slideshow', {
		icon: slideshowIcon,

		edit: function Edit(props) {
			const { clientId, attributes, setAttributes } = props;
			const { replaceInnerBlocks } = useDispatch('core/block-editor');
			const innerBlocksProps = useInnerBlocksProps(useBlockProps(), {
				templateLock: 'all',
			});

			// Set layout attribute (to enable native drag and drop).
			useEffect(function () {
				if (!attributes.layout) {
					setAttributes({
						layout: {
							type: 'flex',
							orientation: 'horizontal',
						},
					});
				}
			}, [attributes.layout]);

			// Get image blocks.
			const imageBlocks = useSelect(function (select) {
				return select('core/block-editor').getBlocks(clientId);
			}, [clientId]);
			const hasImages = imageBlocks && imageBlocks.length > 0;

			// Handle media selection from Media Library.
			const replaceImages = function (images) {
				if (!images || images.length === 0) {
					return;
				}

				const imageBlocksToInsert = images.map(function (image) {
					const alt = (typeof image.alt === 'string' && image.alt.indexOf('This image has an empty alt attribute') === 0) ? '' : image.alt;
					return wp.blocks.createBlock('core/image', {
						id: image.id,
						url: image.url,
						alt: alt,
						caption: image.caption
					});
				});
				replaceInnerBlocks(clientId, imageBlocksToInsert, false);
			};

			if (!hasImages) {
				return createElement(
					'div',
					innerBlocksProps,
					createElement(
						Placeholder,
						{
							icon: slideshowIcon,
							label: __('Slideshow'),
							instructions: __('Add images to your slideshow.')
						},
						createElement(
							MediaUploadCheck,
							null,
							createElement(
								MediaUpload,
								{
									onSelect: replaceImages,
									allowedTypes: ['image'],
									multiple: true,
									gallery: true,
									value: [],
									render: function (obj) {
										return createElement(Button, {
											variant: 'primary',
											onClick: obj.open,
										}, __('Open Media Library'));
									},
								}
							)
						)
					)
				);
			}

			return createElement(
				Fragment,
				null,
				createElement(
					BlockControls,
					{ group: 'other' },
					createElement(
						MediaUploadCheck,
						null,
						createElement(
							MediaUpload,
							{
								onSelect: replaceImages,
								allowedTypes: ['image'],
								multiple: true,
								gallery: true,
								addToGallery: true,
								value: imageBlocks.map(function (block) {
									return block.attributes.id;
								}).filter(Boolean),
								render: function (obj) {
									return createElement(ToolbarButton, {
										onClick: obj.open,
									}, __('Update Images'));
								},
							}
						)
					)
				),
				createElement('div', innerBlocksProps,
					createElement(InnerBlocks, null)
				)
			);
		},

		save: function Save() {
			const blockProps = useBlockProps.save();
			return createElement(
				'div',
				blockProps,
				createElement(InnerBlocks.Content, null)
			);
		},
	});

	// ============================================================================
	// Editor Slideshow Functionality
	// ============================================================================

	function initSlideshow(block) {
		const images = block.querySelectorAll('img');
		if (images.length < 2) {
			return;
		}

		if (block._slideshowInterval) {
			clearInterval(block._slideshowInterval);
		}

		let currentIndex = 0;
		images.forEach(function (img, index) {
			img.style.opacity = index === 0 ? '1' : '0';
			img.style.transition = 'opacity 1s ease-in-out';
		});

		function showNextImage() {
			images[currentIndex].style.opacity = '0';
			currentIndex = (currentIndex + 1) % images.length;
			images[currentIndex].style.opacity = '1';
		}

		block._slideshowInterval = setInterval(showNextImage, SLIDE_DURATION);
	}

	function applyImageBlockStyles(imgBlock) {
		imgBlock.style.position = 'absolute';
		imgBlock.style.top = '0';
		imgBlock.style.left = '0';
		imgBlock.style.width = '100%';
		imgBlock.style.height = '100%';
		imgBlock.style.margin = '0';
		imgBlock.style.display = 'block';
		imgBlock.style.pointerEvents = 'none';

		const imgWrapper = imgBlock.querySelector('div');
		if (imgWrapper) {
			imgWrapper.style.width = '100%';
			imgWrapper.style.height = '100%';
			imgWrapper.style.position = 'relative';
			imgWrapper.style.pointerEvents = 'none';
		}

		const img = imgBlock.querySelector('img');
		if (img) {
			img.style.width = '100%';
			img.style.height = '100%';
			img.style.objectFit = 'cover';
			img.style.display = 'block';
			img.style.position = 'absolute';
			img.style.top = '0';
			img.style.left = '0';
			img.style.pointerEvents = 'none';
		}
	}

	function applyContainerStyles(block) {
		block.style.position = 'relative';
		block.style.overflow = 'hidden';
		block.style.width = '100%';
		block.style.minHeight = MIN_HEIGHT + 'px';
		block.style.display = 'block';

		const innerBlocks = block.querySelector('.block-editor-inner-blocks');
		if (innerBlocks) {
			innerBlocks.style.width = '100%';
			innerBlocks.style.height = '100%';
			innerBlocks.style.position = 'relative';
			innerBlocks.style.minHeight = MIN_HEIGHT + 'px';
			innerBlocks.style.display = 'block';
		}

		const layoutContainer = block.querySelector('.block-editor-block-list__layout');
		if (layoutContainer) {
			layoutContainer.style.position = 'relative';
			layoutContainer.style.width = '100%';
			layoutContainer.style.height = '100%';
			layoutContainer.style.minHeight = MIN_HEIGHT + 'px';
			layoutContainer.style.display = 'block';
		}
	}

	function updateResponsiveStyles(block) {
		const blockWidth = block.offsetWidth || block.clientWidth;
		const isDesktop = blockWidth >= BREAKPOINT_DESKTOP;
		block.style.aspectRatio = isDesktop ? '16 / 9' : 'auto';
		block.style.height = isDesktop ? 'auto' : MOBILE_HEIGHT + 'px';
		block.style.minHeight = '0';
	}

	function applySlideshowStyles(block) {
		applyContainerStyles(block);

		const imageBlocks = block.querySelectorAll('.wp-block-image');
		imageBlocks.forEach(applyImageBlockStyles);

		updateResponsiveStyles(block);

		// Clean up existing resize observer.
		if (block._slideshowResizeObserver) {
			block._slideshowResizeObserver.disconnect();
		}

		// Update on resize.
		const resizeObserver = new ResizeObserver(function () {
			updateResponsiveStyles(block);
		});
		resizeObserver.observe(block);
		block._slideshowResizeObserver = resizeObserver;

		initSlideshow(block);
	}

	function processSlideshowBlock(block) {
		if (block.querySelectorAll('img').length === 0) {
			return;
		}
		requestAnimationFrame(function () {
			applySlideshowStyles(block);
		});
	}

	function initEditorSlideshow() {
		const blockEditor = document.getElementById('editor');
		if (!blockEditor) {
			return;
		}

		const iframeObserver = new MutationObserver(function () {
			const iframe = document.querySelector('iframe');
			if (!iframe || !iframe.contentDocument) {
				return;
			}

			const editorContent = iframe.contentDocument.querySelector('.block-editor-block-list__layout');
			if (!editorContent) {
				return;
			}

			const existingBlocks = iframe.contentDocument.querySelectorAll('[data-type="slideshow-block/slideshow"]');
			existingBlocks.forEach(processSlideshowBlock);

			const editorObserver = new MutationObserver(function () {
				iframe.contentDocument.querySelectorAll('[data-type="slideshow-block/slideshow"]').forEach(processSlideshowBlock);
			});

			editorObserver.observe(editorContent, { childList: true, subtree: true });
			iframeObserver.disconnect();
		});

		iframeObserver.observe(blockEditor, { childList: true, subtree: true });
	}

	document.addEventListener('DOMContentLoaded', initEditorSlideshow);
})();
