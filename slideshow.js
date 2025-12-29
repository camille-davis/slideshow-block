(function () {
	const SLIDE_DURATION = 5000; // 5 seconds per image

	function initSlideshow(slideshowElement) {
		const images = slideshowElement.querySelectorAll('img');
		if (images.length < 2) {
			return;
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

		setInterval(showNextImage, SLIDE_DURATION);
	}

	function init() {
		const slideshows = document.querySelectorAll('[class*="wp-block-slideshow-block-slideshow"]');
		slideshows.forEach(initSlideshow);
	}

	document.addEventListener('DOMContentLoaded', init);
})();
