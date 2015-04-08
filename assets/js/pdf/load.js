require('pdfjs-dist/build/pdf.combined.js');

module.exports = function(svg, url, callback) {
	PDFJS.getDocument(url)
		.then(function(pdf) {
			// Assume one page for now
			return pdf.getPage(1);
		})
		.then(function(page) {
			var scale = 1.5;
			var viewport = page.getViewport(scale);

			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			page.render({
				canvasContext: context,
				viewport: viewport
			}).promise.then(function() {
				svg.image(canvas.toDataURL()).loaded(function(loader) {
					svg.size(loader.width, loader.height);
					svg.parent.size(loader.width, loader.height);
				});
				if (callback) callback(svg)
			})
		});
};