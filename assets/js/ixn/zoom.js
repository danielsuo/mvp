// svg.zoom.js 0.0.1 - Daniel Suo
require('../util/addWheelListener');

;
(function() {

  SVG.extend(SVG.Element, {
    // Enable zoom on window or element
    enableZoom: function(documentElement) {
      var zoom, element = this;

      element.zoomElement = documentElement || element.node;

      var parent = this.parent._parent(SVG.Nested) || this._parent(SVG.Doc)

      if (typeof element.disableZoom !== 'undefined') {
        return;
      }

      /* Zoom in and out relative to cursor */
      zoom = function(event) {
        var elRect = element.zoomElement.getBoundingClientRect();
        event.preventDefault();

        var x = event.clientX - elRect.left;
        var y = event.clientY - elRect.top;

        /* get element bounding box */
        var prev = parent.viewbox();
        var curr = {};

        curr.direction = event.wheelDeltaY > 0 ? -1 : 1
        curr.magnitude = Math.pow(1.03, curr.direction);

        curr.width = prev.width * curr.magnitude;
        curr.height = prev.height * curr.magnitude;

        curr.x = prev.x - x / prev.zoom * (1 - 1 / curr.magnitude);
        curr.y = prev.y - y / prev.zoom * (1 - 1 / curr.magnitude);

        parent.viewbox(curr);
      };

      /* Listen on entire window for now */
      addWheelListener(element.zoomElement, zoom, false);

      /* disable zoom */
      element.disableZoom = function() {
        // TODO: should use polyfill here
        element.zoomElement.removeEventListener('wheel', zoom, false);

        delete element.enableZoom;
        delete element.disableZoom;
      };

      return this;
    }
  });
}).call(this);