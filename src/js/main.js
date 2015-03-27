require('./util/fontdeck');

var SVG = require('./svg');
var Promise = require('promise');
var radio = require('radio');
var XHR = require('./util/xhr');
var _ = require('lodash');

var sortPoints = require('./util/sortPoints');

data = SVG('svg');
data.dir = '/data/floored/test/';
data.element = document.getElementById('svg');
data.panel = document.getElementById('panel');
data.protofit = document.getElementById('protofit');
data.info = document.getElementById('info');
data.loading = document.getElementById('loading');
data.northArrow = document.getElementById('north-arrow');
data.logo = document.getElementById('project-logo');
data.rsfInput = document.getElementById('rsf-input');
data.appContainer = document.getElementById('app');
data.measurement = document.getElementById('measurement');

XHR.get(data.dir + '/config.json')

// Parse config file and configure SVG canvas
.then(function(response) {
  data.config = JSON.parse(response);

  // Give the SVG a size
  data.viewbox(0, 0, data.config.width, data.config.height);

  // Make sure we preserve the aspect ratio and hug (0, 0)
  data.attr({
    'preserveAspectRatio': 'xMinYMin'
  });

  data.$element = $('#' + data.element.id);
  data.$element.css({
    // 'position': 'absolute',
    'backface-visibility': 'hidden'
  });

  // Set up UI elements
  data.northArrow.setAttribute('style', 'transform: rotate(' + data.config.north.direction + 'deg)');
  data.logo.setAttribute('style', 'background-image: url("' + data.dir + data.config.client.logo + '")');
  data.rsfInput.value = data.config.project.area;
})

// Create layers
.then(function() {
  data.config.layers.map(function(layer, index) {
    layer.file_path = data.dir + layer.id + '.svg';
    layer.element = document.createElement('div');
    layer.element.id = layer.id;

    document.getElementById('svg').appendChild(layer.element);

    layer.$element = $('#' + layer.id);
    layer.$element.css({
      // 'position': 'absolute',
      // 'width': data.config.width,
      // 'height': data.config.height,
      'background-image': 'url(' + layer.file_path + ')',
    });
  });
})

// Load cell data
.then(function() {
  return XHR.get(data.dir + 'cells.svg');
})

// Process cell data
.then(function(cells) {
  // Grab all cells from cells.svg. We assume they are groups of line segments.
  var cells = data.svg(cells);

  // Extract unique line segment ends to find corners of each cell
  data.cells = cells.roots()[0].children().map(function(cell, index) {

    // Grab all line segment ends
    var corners = cell.children().map(function(line) {
      return [{
        x: line.attr('x1'),
        y: line.attr('y1')
      }, {
        x: line.attr('x2'),
        y: line.attr('y2')
      }];
    });

    // Flatten and remove duplicates
    corners = _(corners).flattenDeep()
      .remove(function(item, pos, self) {
        for (var i = pos + 1; i < self.length; i++)
          if (_.isEqual(item, self[i]))
            return false;
        return true
      }).value();

    // Sort points in clockwise order
    sortPoints(corners);

    return {
      index: index,
      corners: corners
    };
  })

  // Remove cells from DOM. We will be redrawing them later
  cells.remove();
})

.then(function() {

  data.cells.map(function(cell) {
    cell.path = data.path();
    cell.path.attr({
      'fill-opacity': 0.2
    });
    cell.corners.map(function(corner, index) {
      if (index == 0) {
        cell.path.M(corner.x, corner.y);
      } else {
        cell.path.L(corner.x, corner.y);
      }
    });
    cell.path.Z();

    cell.path.click(function(event) {
      radio('cell-click').broadcast(cell);
    });
    cell.path.mouseover(function(event) {
      radio('cell-mouseover').broadcast(cell);
    });
    cell.path.mouseout(function(event) {
      radio('cell-mouseout').broadcast(cell);
    });
  })
})

.then(function() {

  var getCellClips = function() {
    return data.cells.map(function(cell) {
      var ratio = document.getElementById(data.node.id).clientWidth / data.config.width;

      var transformedCorners = cell.corners.map(function(corner) {
        return {
          x: corner.x * ratio,
          y: corner.y * ratio
        };
      });

      cell.clip = data.path();
      transformedCorners.map(function(corner, index) {
        if (index == 0) {
          cell.clip.M(corner.x, corner.y);
        } else {
          cell.clip.L(corner.x, corner.y);
        }
      });
      cell.clip.Z();
      cell.clip.remove();
    });
  };

  var setClipCSS = function($element, svg) {
    $element.css({
      '-webkit-clip-path': 'url(#' + svg.node.id + ')',
      'clip-path': 'url(#' + svg.node.id + ')'
    });
  };

  var setLayout = function(layout) {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {
      for (var j = 0; j < layout.length; j++) {
        if (layout[j] == i) {
          layers[i].clip.add(data.cells[j].clip);
        }
      }
    }
  };

  var clearLayout = function() {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {
      layers[i].clip.remove();
    }
  }

  var createLayerClips = function() {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {
      layers[i].clip = data.clip();
      setClipCSS(layers[i].$element, layers[i].clip);
    }
  };

  createLayerClips();
  getCellClips();
  setLayout(data.config.layouts[0].state);
  $(window).resize(function() {
    clearLayout();
    createLayerClips();
    getCellClips();
    setLayout(data.config.layouts[0].state);
  });
})

// At the very end, remove the loading icon
.then(function() {
  $(data.appContainer).removeClass('loading');
  // $('#loading').remove();
}, function(error) {
  console.log(error);
});

radio('cell-click').subscribe(function(cell) {
  console.log(cell)
});

radio('cell-mouseover').subscribe(function(cell) {
  cell.path.attr({
    'fill-opacity': 0.8
  });
});

radio('cell-mouseout').subscribe(function(cell) {
  cell.path.attr({
    'fill-opacity': 0.2
  });
});


$('#layout-next-btn').click(function(){
  $('#actions').addClass('show-editor');
});
$('#editor-back-btn').click(function(){
  $('#actions').removeClass('show-editor');
});
