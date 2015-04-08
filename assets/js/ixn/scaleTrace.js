// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

var scaleButton = document.getElementById('scale');
scaleButton.onclick = function() {
  // TODO: Change 'on' to whether or not the object exists
  data.mode.scale.on = !data.mode.scale.on;
  if (data.mode.scale.on) {
    data.disablePan();
    scaleButton.style.backgroundColor = '#f06';
  } else {
    scaleButton.style.backgroundColor = '#fff';
    data.enablePan(true);
    delete data.scaleObj;
    delete data.mode.scale.firstClick;
  }
};


var traceButton = document.getElementById('trace');
traceButton.onclick = function() {
  // TODO: Change 'on' to whether or not the object exists
  data.mode.trace.on = !data.mode.trace.on;
  if (data.mode.trace.on) {
    data.disablePan();
    traceButton.style.backgroundColor = '#f06';
  } else {
    traceButton.style.backgroundColor = '#fff';
    data.enablePan(true);
    delete data.traceObj;
    delete data.trace;
    delete data.mode.trace.firstClick;
  }
};

// Assume path is closed and forms irregular polyon
var area = function(path) {

  var numPoints = path.getSegmentCount() - 1;

  // Need at least 3 points
  if (numPoints > 2) {
    // If first point and last point are not equal, close the polygon.
    // This could have bad results, but whatever for now.
    // var firstPoint = path.getSegment(0).coords;
    // var lastPoint = path.getSegment(numPoints).coords;
    // if (!(firstPoint[0] == lastPoint[0] && firstPoint[1] == lastPoint[1])) {
    //   path.L(firstPoint[0], firstPoint[1]);
    // }

    var area = 0;
    var j = numPoints;
    for (var i = 0; i < numPoints; i++) {
      var prevPoint = path.getSegment(j).coords;
      var currPoint = path.getSegment(i).coords;
      area += prevPoint[0] * currPoint[1] - prevPoint[1] * currPoint[0];
      // (prevPoint[0] + currPoint[0]) * (prevPoint[1] - currPoint[1]);
      j = i;
    }

    return Math.abs(area / 2);
  }
}

// TRACE

var trace = function(event) {
  if (data.mode.trace.on) {
    if (data.mode.trace.firstClick) {
      data.mode.trace.started = true;
      if (data.mode.trace.started) {
        if (data.traceObj) data.traceObj.remove();

        var s = data.mode.trace.pivot;
        data.mode.trace.pivot = m2s(event);


        if (!data.modifier.shift) {
          data.mode.trace.pivot = drawVHLine(s, data.mode.trace.pivot);
        }

        if (typeof data.trace != 'undefined') {
          data.trace.L(data.mode.trace.pivot.x, data.mode.trace.pivot.y)
        } else {
          console.log('test')
          data.trace = draw.path();
          data.trace.attr({
            'fill-opacity': 0,
            'stroke-width': 4,
            stroke: '#0f0'
          });
          data.trace.M(data.mode.trace.pivot.x, data.mode.trace.pivot.y);
        }
      } else {
        // DO STUFF ONCE DONE
        // delete data.trace;
      }
    }

    data.mode.trace.firstClick = true;
  }
}

SVG.on(window, 'keypress', function(event) {
  if (event.charCode == 115) { // s
    console.log(config.state)
  }

});

SVG.on(window, 'click', trace);

SVG.on(window, 'keypress', function(event) {
  if (event.keyCode == 99 && data.mode.trace.started && typeof data.trace != 'undefined' && data.trace.getSegmentCount() > 2) { // escape
    data.mode.trace.started = false;
    var firstPoint = data.trace.getSegment(0);
    data.trace.L(firstPoint.coords[0], firstPoint.coords[1]);
    if (data.traceObj) data.traceObj.remove();
    console.log(area(data.trace));
    if (data.scale) {
      console.log(area(data.trace) * data.scale * data.scale);
    }
  }
})

SVG.on(window, 'mousemove', function(event) {
  if (data.mode.trace.started) {
    if (data.traceObj) data.traceObj.remove();
    data.traceObj = draw.path();
    data.traceObj.attr({
      'fill-opacity': 0,
      'stroke-width': 4,
      stroke: '#f06'
    });
    data.traceObj.M(data.mode.trace.pivot.x, data.mode.trace.pivot.y);

    var s = m2s(event);
    if (!data.modifier.shift) {
      s = drawVHLine(data.mode.trace.pivot, s);
    }

    data.traceObj.L(s.x, s.y);
  }
});

// SCALE

var scale = function(event) {
  if (data.mode.scale.on) {
    if (data.mode.scale.firstClick) {
      console.log('on')
      data.mode.scale.started = !data.mode.scale.started;
      if (data.mode.scale.started) {
        console.log('started')
        data.mode.scale.pivot = m2s(event);
      } else {
        if (data.scaleObj && data.scaleObj.getSegmentCount() == 2) {
          var p1 = data.scaleObj.getSegment(0).coords;
          var p2 = data.scaleObj.getSegment(1).coords;

          var length = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
          console.log(length)
          var actual = prompt('What is the length?');
          data.scale = parseInt(actual) / length;
          console.log(data.scale)
        }
      }
    }
    data.mode.scale.firstClick = true;
  }
};

SVG.on(window, 'click', scale);

SVG.on(window, 'mousemove', function(event) {
  if (data.mode.scale.started) {
    if (data.scaleObj) data.scaleObj.remove();
    data.scaleObj = draw.path();
    data.scaleObj.attr({
      'fill-opacity': 0,
      'stroke-width': 4,
      stroke: '#f06'
    });
    data.scaleObj.M(data.mode.scale.pivot.x, data.mode.scale.pivot.y);

    var s = m2s(event);
    if (!data.modifier.shift) {
      s = drawVHLine(data.mode.scale.pivot, s);
    }

    data.scaleObj.L(s.x, s.y);
  }
});