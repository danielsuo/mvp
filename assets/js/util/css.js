module.exports = {
	outerHeight = function(el, margin) {
		var height = el.offsetHeight;
		var style = getComputedStyle(el);

		if (margin) {
			height += parseInt(style.marginTop) + parseInt(style.marginBottom);
		}

		return height;
	}, outerWidth = function(el, margin) {
		var width = el.offsetWidth;
		var style = getComputedStyle(el);

		if (margin) {
			width += parseInt(style.marginLeft) + parseInt(style.marginRight);
		}

		return width;
	}
};