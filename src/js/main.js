require('./util/fontdeck');

var SVG = require('./svg');
var Promise = require('promise');
var radio = require('radio');
var XHR = require('./util/xhr');
var _ = require('lodash');

var Cell = require('./app/cell');

var sortPoints = require('./util/sortPoints');
var isMobile = require('./util/mobile').any;

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

// Get selected cells
data.selected = [];
data.state = [];

// Set current layout
data.currentLayout = 0;

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

.then(function() {
  var $layoutList = $('#layout-list');
  var $editorList = $('#editor-list');

  // Set up layout buttons
  for (var layout in data.config.layouts) {
    (function(layout) {
      var $li = $(document.createElement('li'));
      $li.html(data.config.layouts[layout].name).data('index', layout);
      $li.click(function() {
        radio('layout-change').broadcast(layout);
        radio('selection-clear').broadcast();
      })
      $layoutList.append($li);
    })(layout);
  }

  // Set up cell editor buttons
  for (var layer in data.config.layers) {
    (function(layer){
      var $li = $(document.createElement('li'));
      $li.html(data.config.layers[layer].name).data('index', layer);
      $li.click(function(){
        radio('selection-update').broadcast(layer);
        console.log(layer)
      })
      $editorList.append($li);
    })(layer);
  }

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
      'background-image': 'url(' + layer.file_path + ')',
    });
  });

  // Add background shadow
  $('#svg-bg').css({
    'background-image': 'url(' + data.dir + 'bg.svg)'
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
    return new Cell(cell.children());
  });

  console.log(data.cells)

  // Remove cells from DOM. We will be redrawing them later
  cells.remove();
})

.then(function() {

  // Create cells
  data.cells.map(function(cell) {
    cell.createDrawingPath();
  });
})

.then(function() {

  var transformCellClips = function() {
    var ratio = document.getElementById(data.node.id).clientWidth / data.config.width;
    return data.cells.map(function(cell) {
      cell.createClippingPath(ratio);
    });
  };

  var setClipCSS = function($element, svg) {
    $element.css({
      '-webkit-clip-path': 'url(#' + svg.node.id + ')',
      'clip-path': 'url(#' + svg.node.id + ')'
    });
  };

  var clipLayersWithState = function(state) {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {

      for (var j = 0; j < state.length; j++) {
        if (state[j] == i) {
          if (layers[i].id !== 'shell') {
            layers[i].clip.add(data.cells[j].clippingPath);
          }
          data.cells[j].drawingPath.node.dataset.layer = i;
        }
      }
    }
  };

  var clearClipsFromLayers = function() {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].id !== 'shell') {
        layers[i].clip.remove();
      }
    }
  }

  var createClipsForLayers = function() {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].id !== 'shell') {
        layers[i].clip = data.clip();
        setClipCSS(layers[i].$element, layers[i].clip);
      }
    }
  };

  data.setLayout = function(layoutIndex, update) {
    this.state = this.config.layouts[layoutIndex].state;
    this.currentLayout = layoutIndex;
    this.setLayoutFromState(update);
  };

  data.setLayoutFromState = function(update) {
    if (update) clearClipsFromLayers();
    createClipsForLayers();
    transformCellClips();
    clipLayersWithState(this.state);
    data.info.innerHTML = printInfo();
  }

  data.updateSelected = function(layerIndex) {
    var that = this;
    var layer = this.config.layers[layerIndex];
    this.selected.map(function(cellIndex) {
      that.state[cellIndex] = layerIndex;
    });

    this.setLayoutFromState(true);
  };

  data.setLayout(data.currentLayout);
  $(window).resize(function() {
    data.setLayout(data.currentLayout, true);
  });
})

// At the very end, remove the loading icon
.then(function() {
  data.info.innerHTML = printInfo();
  setTimeout(function() {
    $(data.appContainer).removeClass('loading');
  }, 750);
}, function(error) {
  console.log(error);
});

radio('cell-click').subscribe(function(cell, dragging) {
  var index = data.selected.indexOf(cell.id);

  $('#actions').addClass('show-editor');

  if (dragging) {

  } else {
    data.multiSelectState = index > -1;
  }

  // Unhighlight cell
  // if we mouse down on first cell and already selected
  // if we mouse over other selected cells and first cell was selected to begin with
  if ((!dragging && data.multiSelectState) || (index > -1 && dragging && data.multiSelectState)) {
    data.selected.splice(index, 1);
    // remove class
    var pathElement = document.getElementById(cell.drawingPath.node.id);
    pathElement.dataset.selected = 0;
  }

  // Highlight cell
  // if we mouse down on first cell and not already selected
  // if we mouse over other selected cell and first cell was not selected to begin with
  else if ((!dragging && !data.multiSelectState) || (index == -1 && dragging && !data.multiSelectState)) {
    data.selected.push(cell.id);
    // add class
    var pathElement = document.getElementById(cell.drawingPath.node.id);
    pathElement.dataset.selected = 1;
  }

  // Assume for now that if center of cells are colinear, then cells are in a
  // line and can be merged
  if (data.selected.length > 1 && data.selected.length <= 3) {
    var line = data.selected.reduce(function(a, b) {
      return {
        x: (a.x === data.cells[b].center.x ? a.x : false),
        y: (a.y === data.cells[b].center.y ? a.y : false)
      };
    }, {
      x: data.cells[data.selected[0]].center.x,
      y: data.cells[data.selected[0]].center.y
    });

    if (line.x || line.y) radio('merge-possible').broadcast();
  }
});

radio('merge-possible').subscribe(function() {
  console.log('merge possible!!!!')
});

radio('cell-mouseover').subscribe(function(cell) {
  cell.drawingPath.node.dataset.hover = 1;
});

radio('cell-mouseout').subscribe(function(cell) {
  cell.drawingPath.node.dataset.hover = 0;
});

radio('layout-change').subscribe(function(layoutIndex) {
  data.setLayout(layoutIndex, true);
});

radio('layout-whitebox').subscribe(function() {
  data.setLayout(data.config.layouts.length - 1, true);
});

radio('selection-update').subscribe(function(layerIndex) {
  data.updateSelected(layerIndex);
});

radio('print-before').subscribe(function(argument) {
  data.setLayoutFromState(true);
  // console.log('before')
});

radio('print-after').subscribe(function(argument) {
  data.setLayoutFromState(true);
  // console.log('after')
});

radio('selection-change').subscribe(function() {
  if (data.selected.length) {
    $('#editor').removeClass('no-selection').addClass('has-selection')
  } else {
    $('#editor').addClass('no-selection').removeClass('has-selection')
  }
});

radio('selection-clear').subscribe(function() {
  data.selected = [];

  data.cells.map(function(cell) {
    document.getElementById(cell.drawingPath.node.id).dataset.selected = 0;
  });
  radio('selection-change').broadcast();
});

var printInfo = function() {
  var info = "<table>";


  for (var i = 0; i < data.config.layers.length; i++) {

    if (data.config.layers[i].id == 'shell') {
      continue;
    }

    info += "<tr class='" + data.config.layers[i].id + "'>";
    info += "<td>" + data.config.layers[i].name + "</td>";

    if (data.config.layers[i].id === 'benching') {
      info += "<td>" + data.getBenchingHeadcount() + "</td>"
    } else {
      var merged = 0;
      if (data.config.merge && data.config.layers[i].id === 'conference' && data.config.merge.merged) {
        merged = 1;
      }
      info += "<td>" + (data.state.filter(function(x) {
        return x == i
      }).length + merged) + "</td>";
    }

    info += "</tr>";
  }

  info += "<tr class='reception'><td>Reception</td><td>1</td></tr>"
  info += "<tr class='pantry'><td>Pantry</td><td>1</td></tr>"

  info += "<tr><td><br/></td><td></td></tr>"

  var headcount = data.getHeadcount();
  info += "<tr class='headcount'>";
  info += "<td>Total headcount</td>";
  info += "<td>" + headcount + "</td>";
  info += "</tr>";

  var area = data.getArea();
  info += "<tr class='sf'>";
  info += "<td>SF per person</td>"
  info += "<td id='sfpp'>" + Math.round(area / headcount) + "</td>";
  info += "</tr>";

  info += "</table>"

  return info;
}

data.getHeadcount = function() {
  var headcount = 0;
  for (var i = 0; i < this.state.length; i++) {
    headcount += this.config.layers[this.state[i]].seats[i];
  }
  return headcount;
};

data.getBenchingHeadcount = function() {
  var headcount = 0;
  for (var i = 0; i < this.state.length; i++) {
    if (this.state[i] === 0) {
      headcount += this.config.layers[this.state[i]].seats[i];
    }
  }
  return headcount;
};

data.getArea = function() {
  return this.config.project.area;
};

data.beforePrint = function() {
  radio('print-before').broadcast();
};

data.afterPrint = function() {
  radio('print-after').broadcast();
};

$('#layout-next-btn').click(function() {
  $('#actions').addClass('show-editor');
});
$('#editor-back-btn').click(function() {
  $('#actions').removeClass('show-editor');
  radio('selection-clear').broadcast();
});
$('#editor-done-btn').click(function() {
  radio('selection-clear').broadcast();
});

// From http://tjvantoll.com/2012/06/15/detecting-print-requests-with-javascript/
if (window.matchMedia) {
  window.matchMedia('print').addListener(function(query) {
      if (query.matches) {
          data.beforePrint()
      } else {
          data.afterPrint();
      }
  });
}

// for old IE, etc
window.onbeforeprint = data.beforePrint; 
window.onafterprint = data.afterPrint;