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

	const SLIDE_DURATION = 5000;
	const BREAKPOINT_DESKTOP = 1200;
	const MOBILE_HEIGHT = 800;

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
				templateLock: 'all', // Prevent direct interaction with image blocks.
			});

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

			const imageBlocks = useSelect(function (select) {
				return select('core/block-editor').getBlocks(clientId);
			}, [clientId]);
			const hasImages = imageBlocks && imageBlocks.length > 0;

			const replaceImages = function (images) {
				if (!images || images.length === 0) {
					return;
				}
				replaceInnerBlocks(clientId, images.map(function (image) {

					// Create image block.
					// Remove WordPress alt anti-pattern placeholder text.
					const alt = (typeof image.alt === 'string' && image.alt.startsWith('This image has an empty alt attribute')) ? '' : image.alt;
					return wp.blocks.createBlock('core/image', {
						id: image.id,
						url: image.url,
						alt: alt,
						caption: image.caption
					});
				}), false);
			};

			const mediaUploadProps = {
				onSelect: replaceImages,
				allowedTypes: ['image'],
				multiple: true,
				gallery: true
			};

			function createMediaUploadButton(ButtonComponent, label, props) {
				return createElement(
					MediaUploadCheck,
					null,
					createElement(
						MediaUpload,
						Object.assign({}, mediaUploadProps, props, {
							render: function (obj) {
								return createElement(ButtonComponent, {
									variant: ButtonComponent === Button ? 'primary' : undefined,
									onClick: obj.open,
								}, label);
							},
						})
					)
				);
			}

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
						createMediaUploadButton(Button, __('Open Media Library'), { value: [] })
					)
				);
			}

			return createElement(
				Fragment,
				null,
				createElement(
					BlockControls,
					{ group: 'other' },
					createMediaUploadButton(ToolbarButton, __('Update Images'), {
						addToGallery: true,
						value: imageBlocks.map(function (block) {
							return block.attributes.id;
						}).filter(Boolean)
					})
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

	function applyStyle(element, styles) {
		if (!element) {
			return;
		}
		Object.keys(styles).forEach(function (prop) {
			element.style[prop] = styles[prop];
		});
	}

	function getBlockWidth(block) {
		return block.offsetWidth || block.clientWidth;
	}

	function getResponsiveStyles(block) {
		const isDesktop = getBlockWidth(block) >= BREAKPOINT_DESKTOP;
		return {
			aspectRatio: isDesktop ? '16 / 9' : 'auto',
			height: isDesktop ? 'auto' : MOBILE_HEIGHT + 'px'
		};
	}

	function applySlideshowStyles(block) {
		applyStyle(block, {
			width: '100%',
			display: 'block'
		});

		applyStyle(block.querySelector('.components-resizable-box__container'), {
			maxWidth: 'none',
			maxHeight: 'none'
		});

		applyStyle(block.querySelector('.block-editor-inner-blocks'), {
			height: '100%'
		});

		applyStyle(block.querySelector('.block-editor-block-list__layout'), {
			height: '100%'
		});

		block.querySelectorAll('.wp-block-image').forEach(function (imgBlock) {
			applyStyle(imgBlock, { pointerEvents: 'none' }); // Prevent interaction in editor.
			applyStyle(imgBlock.querySelector('div'), {
				width: '100%',
				height: '100%'
			});
		});

		applyStyle(block, getResponsiveStyles(block));

		if (block._slideshowResizeObserver) {
			block._slideshowResizeObserver.disconnect();
		}

		const resizeObserver = new ResizeObserver(function () {
			applyStyle(block, getResponsiveStyles(block));
		});
		resizeObserver.observe(block);
		block._slideshowResizeObserver = resizeObserver; // Store for cleanup.

		const images = block.querySelectorAll('img');
		if (images.length >= 2) {
			if (block._slideshowInterval) {
				clearInterval(block._slideshowInterval); // Clean up existing interval.
			}

			let currentIndex = 0;
			images.forEach(function (img, index) {
				applyStyle(img, {
					opacity: index === 0 ? '1' : '0',
					transition: 'opacity 1s ease-in-out'
				});
			});

			block._slideshowInterval = setInterval(function () {

				// Show next image.
				applyStyle(images[currentIndex], { opacity: '0' });
				currentIndex = (currentIndex + 1) % images.length;
				applyStyle(images[currentIndex], { opacity: '1' });
			}, SLIDE_DURATION); // Store for cleanup.
		}
	}

	function init() {
		const blockEditor = document.getElementById('editor');
		if (!blockEditor) {
			return;
		}

		// Two-step observer: first wait for iframe, then observe editor content.
		const iframeObserver = new MutationObserver(function () {
			const iframe = document.querySelector('iframe');
			if (!iframe || !iframe.contentDocument) {
				return;
			}

			const editorContent = iframe.contentDocument.querySelector('.block-editor-block-list__layout');
			if (!editorContent) {
				return;
			}

				const processAllSlideshows = function () {
					iframe.contentDocument.querySelectorAll('[data-type="slideshow-block/slideshow"]').forEach(function (block) {
						if (block.querySelectorAll('img').length === 0) {
							return;
						}

						// Wait for wp to apply styles, then overwrite with our own.
						const container = block.querySelector('.components-resizable-box__container');
						if (!container) {
							return;
						}

						const styleObserver = new MutationObserver(function (mutations) {
							mutations.forEach(function (mutation) {
								if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
									if (container.style.maxHeight) {
										applySlideshowStyles(block);
										styleObserver.disconnect();
									}
								}
							});
						});

						styleObserver.observe(container, {
							attributes: true,
							attributeFilter: ['style']
						});
					});
				};

			// Process existing slideshow blocks.
			processAllSlideshows();

			// Observe editor for new slideshow blocks.
			const editorObserver = new MutationObserver(processAllSlideshows);
			editorObserver.observe(editorContent, { childList: true, subtree: true });
			iframeObserver.disconnect();
		});

		iframeObserver.observe(blockEditor, { childList: true, subtree: true });
	}

	document.addEventListener('DOMContentLoaded', init);
})();
