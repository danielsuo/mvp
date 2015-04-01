require('./util/fontdeck');

var SVG = require('./svg');
var Promise = require('promise');
var radio = require('radio');
var XHR = require('./util/xhr');
var _ = require('lodash');

var Cell = require('./app/cell');
var CellList = require('./app/cellList');

data = SVG('svg');
data.dir = '/data/floored/beacon/';
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
data.state = [];

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
        radio('layout-update-from-preset').broadcast(layout);
        radio('selection-clear').broadcast();
      })
      $layoutList.append($li);
    })(layout);
  }

  // Set up cell editor buttons
  for (var layer in data.config.layers) {
    (function(layer) {
      var $li = $(document.createElement('li'));
      $li.html(data.config.layers[layer].name).data('index', layer);
      $li.click(function() {
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

// Create new CellList from cell svg data
.then(function() {
  return CellList.load(data, data.dir + 'cells.svg');
})

// Assign CellList to data.cells
.then(function(cells) {
  data.cells = cells;
})

.then(function() {

  var setClipCSS = function($element, svg) {
    $element.css({
      '-webkit-clip-path': 'url(#' + svg.node.id + ')',
      'clip-path': 'url(#' + svg.node.id + ')'
    });
  };

  var clipLayersWithState = function(state) {
    var layers = data.config.layers;
    for (var i = 0; i < layers.length; i++) {

      _.forOwn(state, function(cell, id) {
        id = parseInt(id);
        if (cell.layer == i) {
          if (layers[i].id !== 'shell') {
            layers[i].clip.add(data.cells.get(id).clippingPath);
          }
          data.cells.get(id).setLayer(i);
        }
      });
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
    this.cells.setLayout(this.config.layouts[layoutIndex].state);
    this.setLayoutFromState(update);
  };

  data.setLayoutFromState = function(update) {
    if (update) clearClipsFromLayers();
    createClipsForLayers();
    this.cells.updateClippingPaths(data.getClientToSVGRatio());
    clipLayersWithState(this.cells.getLayout());
    // data.info.innerHTML = printInfo();
  }

  data.setLayout(0);
  $(window).resize(function() {
    data.setLayoutFromState(true);
  });
})

// At the very end, remove the loading icon
.then(function() {
  // data.info.innerHTML = printInfo();
  setTimeout(function() {
    $(data.appContainer).removeClass('loading');
  }, 750);
}, function(error) {
  console.log(error);
});

radio('merge-possible').subscribe(function() {
  console.log('merge possible!!!!')
});

radio('layout-update-from-preset').subscribe(function(layoutIndex) {
  data.setLayout(layoutIndex, true);
});

radio('layout-whitebox').subscribe(function() {
  data.setLayout(data.config.layouts.length - 1, true);
});

radio('layout-update-from-state').subscribe(function() {
  data.setLayoutFromState(true);
});

radio('selection-update').subscribe(function(layerIndex) {
  data.cells.updateSelected(layerIndex);
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

data.getClientToSVGRatio = function() {
  return document.getElementById(data.node.id).clientWidth / data.config.width;
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
  radio('layout-update-from-state').broadcast();
};

data.afterPrint = function() {
  radio('layout-update-from-state').broadcast();
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
$('#merge-btn').click(function() {
  radio('merge-initiated').broadcast();
});
$('#split-btn').click(function() {
  radio('split-initiated').broadcast();
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