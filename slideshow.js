(function () {
	const SLIDE_DURATION = 5000;

	function initSlideshow(slideshowElement) {
		const images = slideshowElement.querySelectorAll('img');
		if (images.length < 2) {
			return;
		}

		let currentIndex = 0;
		const TRANSITION = 'opacity 1s ease-in-out';
		images.forEach(function (img, index) {
			img.style.opacity = index === 0 ? '1' : '0';
			img.style.transition = TRANSITION;
		});

		slideshowElement._slideshowInterval = setInterval(function () {
			images[currentIndex].style.opacity = '0';
			currentIndex = (currentIndex + 1) % images.length;
			images[currentIndex].style.opacity = '1';
		}, SLIDE_DURATION);
	}

	function init() {
		document.querySelectorAll('[class*="wp-block-slideshow-block-slideshow"]').forEach(initSlideshow);
	}

	document.addEventListener('DOMContentLoaded', init);
})();
