module.exports = {
	get: function(url, callback, async, listeners) {
		if (typeof async === "undefined") {
			async = true;
		}

		var xhr = new XMLHttpRequest();

		if (typeof listeners !== "undefined") {
			Object.keys(listeners).map(function(listener) {
				xhr.addEventListener(listener, listeners[listener], false);
			});
		}

		xhr.onload = callback;
		xhr.open('get', url, async);
		xhr.send();
	}
};