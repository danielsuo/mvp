// svg.pan.js 0.1.0 - Copyright (c) 2015 Daniel Suo
;
(function() {

  SVG.extend(SVG.Element, {
    // Enable pan on element
    // Constraint might be a object (as described in readme.md) or a function in the form "function (x, y)" that gets called before every move.
    // The function can return a boolean or a object of the form {x, y}, to which the element will be moved. "False" skips moving, true moves to raw x, y.
    // enablePan: function(panElement, constraint) {
    enablePan: function(panElement) {
      var element = this;

      element.panElement = panElement || element.node;

      var parent = this.parent._parent(SVG.Nested) || this._parent(SVG.Doc)
      parent.viewbox(0, 0, parent.viewbox().width, parent.viewbox().height)

      /* disable pan if already present */
      if (typeof this.disablePan === 'function')
        this.disablePan()

      /* start panning */
      element.start = function(event) {
        event = event || window.event

        /* store event */
        element.startEvent = event

        /* store start position */
        element.startPosition = parent.viewbox();

        /* add while and end events to window */
        SVG.on(window, 'mousemove', element.pan)
        SVG.on(window, 'mouseup', element.end)

        /* prevent selection panning */
        event.preventDefault ? event.preventDefault() : event.returnValue = false
      }

      /* while panning */
      element.pan = function(event) {
        event = event || window.event

        if (element.startEvent) {
          /* calculate move position */
          var x, y,
            delta = {
              x: event.clientX - element.startEvent.clientX,
              y: event.clientY - element.startEvent.clientY,
              zoom: element.startPosition.zoom
            }

          /* caculate new position */
          x = -element.startPosition.x + delta.x / element.startPosition.zoom
          y = -element.startPosition.y + delta.y / element.startPosition.zoom

          // var viewbox = parent.viewbox();
          parent.viewbox(-x, -y, element.startPosition.width, element.startPosition.height);
        }
      }

      /* when panning ends */
      element.end = function(event) {
        event = event || window.event

        /* reset store */
        element.startEvent = null
        element.startPosition = null

        /* remove while and end events to window */
        SVG.off(window, 'mousemove', element.pan)
        SVG.off(window, 'mouseup', element.end)
      }

      /* bind mousedown event */
      element.panElement.addEventListener('mousedown', element.start, false);

      /* disable pan */
      element.disablePan = function() {
        element.panElement.removeEventListener('mousedown', element.start, false);

        SVG.off(window, 'mousemove', element.pan)
        SVG.off(window, 'mouseup', element.end)

        return element
      }

      return this
    }

  })

}).call(this);