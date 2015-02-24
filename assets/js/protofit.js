// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

var SVG = require('svg.js');
require('./ixn/zoom');
require('./ixn/pan');

var app = require('./app');
var path = require('./util/path');

// Pubsub library
var radio = require('radio');

var draw = SVG('protofit');
var data = draw.nested();

data.enableZoom(document.getElementById('protofit'));
data.enablePan(document.getElementById('protofit'));

// Data of cells
// state: Array of state of each cell
// cells: Array of cells represented by array of points {x: 0, y: 0}
var cells = {};

// Grab URL query parameters into object
var params = require('./util/getQueryParameters')();
var folder = ['.', 'data', params.client, params.project].join('/');
var config;

var dataDiv = document.getElementById('data');

require('./util/xhr').get(folder + '/config.json', function(req) {
  config = JSON.parse(req.target.response);

  for (var i in config.layers) {
    config.layers[i].svg = data.nested();
    config.layers[i].mask = data.path();
    config.layers[i].clipCells = [];
  }

  var numLoaded = 0;
  for (var i in config.layers) {

    // Load svgs
    // require('./svg/load')(config.layers[i].svg, folder + '/' + config.layers[i].name + '.svg', function(svg) {
    //   numLoaded++;
    //   dataDiv.innerHTML = ['Finished loading', parseInt(numLoaded), 'of', config.layers.length, 'files'].join(' ');
    //   console.log(svg)
    // });

    config.layers[i].mask = path.fromRect(config.layers[i].mask, 0, 0, window.innerWidth, window.innerHeight, true);
    config.layers[i].mask = path.fromRect(config.layers[i].mask, 0, 0, window.innerWidth, window.innerHeight, false);

    config.layers[i].svg.clipWith(config.layers[i].mask)
  }

  data.protofit = document.getElementById('protofit');
  data.floorplan = data.nested();

  app.loadCells(data.floorplan, cells, folder + '/cells.svg');

  radio('cell-clicked').subscribe(function(i, cell) {

    cells.state[i] = (cells.state[i] + 1) % (config.layers.length + 1);

    // If state should be blank, delete cell from all clips
    if (cells.state[i] == 0) {
      for (var j in config.layers) {
        var clipCellIndex = config.layers[j].clipCells.indexOf(cell);
        if (clipCellIndex > -1) {
          config.layers[j].clipCells.splice(clipCellIndex, 1);
        }
      }
    } else {
      // Loop through possible states
      for (var j in config.layers) {
        var clipCellIndex = config.layers[j].clipCells.indexOf(cell);
        var found = clipCellIndex > -1;
        var currState = parseInt(j) + 1 == cells.state[i];

        // If we want to expose a cell for a state, we want to add clipping
        if (!found && currState) {
          config.layers[j].clipCells.push(cell);
        }
        // Otherwise, we remove clipCell
        else if (found && !currState) {
          config.layers[j].clipCells.splice(clipCellIndex, 1);
        }
      }
    }

    for (var j in config.layers) {
      config.layers[j].mask = data.path();
      config.layers[j].mask = path.fromRect(config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
      config.layers[j].mask = path.fromRect(config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
      for (var k in config.layers[j].clipCells) {
        config.layers[j].mask = path.fromPoints(config.layers[j].mask, config.layers[j].clipCells[k], true);
      }
      config.layers[j].svg.clipWith(config.layers[j].mask);
    }

    function histogram(x) {
      var hist = Array.apply(null, new Array(config.layers.length + 1)).map(Number.prototype.valueOf, 0);

      for (var i in x) {
        hist[x[i]]++;
      }

      return hist;
    }

    dataDiv.innerHTML = histogram(cells.state).join(', ');
  });
});

data.modifier = {
  shift: false,
  ctrl: false,
  alt: false
};
data.mode = {};
data.mode.scale = {
  on: false,
  started: false
};
data.mode.trace = {
  on: false,
  started: false,
  startSegment: false
};

data.objects = data.nested();

var input = document.getElementById('file');
input.onchange = function() {
  var file = input.files[0];
  var url = window.URL.createObjectURL(file);

  if (file.type.indexOf('svg') > -1) {
    require('./svg/load')(data.floorplan, url);
  } else if (file.type.indexOf('image') > -1) {
    require('./img/load')(data.floorplan, url);
  } else if (file.type.indexOf('pdf') > -1) {
    require('./pdf/load')(data.floorplan, url);
  }

  // TOOD: Remove
  setTimeout(function() {
    console.log(data.floorplan);
  }, 2000);
};

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

var mouse2svg = function(mouse_x, mouse_y, offset_x, offset_y, viewbox) {
  return {
    x: (mouse_x - offset_x) / viewbox.zoom + viewbox.x,
    y: (mouse_y - offset_y) / viewbox.zoom + viewbox.y
  };
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

// Really ghetto convenience function
var m2s = function(event) {
  return mouse2svg(
    event.pageX,
    event.pageY,
    data.protofit.offsetLeft,
    data.protofit.offsetTop,
    data.parent.viewbox());
};

var drawVHLine = function(pivot, point) {
  var coords = {
    x: point.x - pivot.x,
    y: point.y - pivot.y
  };

  var tan = coords.y / coords.x;

  if (coords.y < 0 && Math.abs(tan) > 1) {
    // +y
    point.x = pivot.x;
  } else if (coords.y > 0 && Math.abs(tan) > 1) {
    // -y
    point.x = pivot.x;
  } else if (coords.x > 0 && Math.abs(tan) < 1) {
    // +x
    point.y = pivot.y;
  } else if (coords.x < 0 && Math.abs(tan) < 1) {
    // -x
    point.y = pivot.y;
  }
  return point;
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
  console.log(event.keyCode);
  console.log(event)
});

SVG.on(window, 'click', trace);
// mc.on('tap press', trace)

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
// mc.on('tap press', scale)

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

SVG.on(window, 'keydown', function(event) {
  if (event.shiftKey) {
    data.modifier.shift = true;
  }
});

SVG.on(window, 'keyup', function(event) {
  // TODO: keyup not registered when prompt is open
  if (!event.shiftKey && data.modifier.shift) {
    data.modifier.shift = false;
  }
})
// mc.on("mousewheel", function(ev) {
//   dataDiv.innerHTML = ev.type + " gesture detected.";
//   // create some hammerisch eventData
//   var eventType = 'scroll';
//   var touches = Hammer.event.getTouchList(ev, eventType);
//   var eventData = Hammer.event.collectEventData(this, eventType, touches, ev);

//   // you should calculate the zooming over here, 
//   // should be something like wheelDelta * the current scale level, or something...
//   eventData.scale = ev.wheelDelta;

//   // trigger transform event
//   hammertime.trigger("transform", eventData);

//   // prevent scrolling
//   ev.preventDefault();
// });

var add = function(element) {
  return data.objects.put(element);
};

var group = function(elements) {
  console.log(elements)
  var parent = elements[0].parent

  // make sure elements all have same parent
  for (var i in elements) {
    if (parent.children().indexOf(elements[i]) < 0) {
      return;
    }
  }

  var new_group = parent.group();
  elements.map(function(el) {
    el.select(false);
    new_group.add(el);
  });

  new_group.select(true);

  return new_group;
};

SVG.on(window, 'keypress', function(event) {
  // bindings[event.keyCode](draw.rect(100, 100))
  if (event.keyCode == 97) { // a
    data.objects.rect(100, 100).attr({
      fill: '#f06',
    });
  } else if (event.keyCode == 115) { // s
    data.objects.each(function(i, children) {
      var element = this;
      element.mouseover(function(event) {
        element.attr({
          fill: '#f48'
        });
      });
      element.mouseout(function(event) {
        element.attr({
          fill: '#f06'
        });
      });
      element.mousedown(function(event) {
        if (element.selected || element.parent !== data.objects) {
          element.select(false);
          delete data.selected[data.selected.indexOf(element)];
        } else {
          element.select(true);
          data.selected.push(element);
        }

      });
    });

  } else if (event.keyCode == 103) { // g
    group(data.selected);
  } else if (event.keyCode == 100) { // d
    data.selected.map(function(el) {
      el.select(false);
      el.remove();
    });
  }
})

SVG.on(window, 'keydown', function(event) {
  if (event.shiftKey) {
    data.modifier.shift = true;

    data.disablePan();
    data.disableZoom();

    data.objects.each(function(i, children) {
      this.enablePan();
    });
  }
});

SVG.on(window, 'keyup', function(event) {
  if (!event.shiftKey && data.modifier.shift == true) {
    data.modifier.shift = false;

    data.enablePan(true);
    data.enableZoom(true);

    data.objects.each(function(i, children) {
      this.disablePan();
    });
  }
});