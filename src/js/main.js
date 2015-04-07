require('./util/fontdeck');

var SVG = require('./svg');
var Promise = require('promise');
var radio = require('radio');
var XHR = require('./util/xhr');
var _ = require('./util/lodash');

var Cell = require('./app/cell');
var CellList = require('./app/cellList');

var Layer = require('./app/layer');

data = SVG('svg');

var re = /\/app\/(\w+)\/?/;
data.id = window.location.pathname.match(re)[1];
console.log(data.id)

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
  $('#project-title').html('<h3>' + data.config.project.name + '</h3>');
  $('#project-address').html(data.config.project.address);

  data.rsfInput.value = data.config.project.area;

  data.layers = data.config.layers.map(function(layer, index) {
    return new Layer(layer, index);
  });
})

// Set up defs for all data objects

.then(function() {

  return Promise.all([
    XHR.get('/img/conference-large.svg').then(function(response) {
      data.conferenceLarge = data.createDef(response);
    }),
    XHR.get('/img/conference-small.svg').then(function(response) {
      data.conferenceSmall = data.createDef(response);
    }),
    XHR.get('/img/desk-cluster-small.svg').then(function(response) {
      data.deskSmall = data.createDef(response);
    }),
    XHR.get('/img/desk-cluster-large.svg').then(function(response) {
      data.deskLarge = data.createDef(response);
    }),
    XHR.get('/img/table-cluster.svg').then(function(response) {
      data.table = data.createDef(response);
    })
  ]);
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
        radio('layout-update-from-state').broadcast(layout);
        radio('selection-clear').broadcast();
      })
      $layoutList.append($li);
    })(layout);
  }

  // Set up cell editor buttons
  data.layers.map(function(layer) {
    layer.createButton($editorList, function() {
      data.cells.splitWithLayer(data.cells.selected, layer.index, true);
    });
  });

  var $editorListMedium = $('#editor-list-medium');

  var $li = $('<li>Big Conference Room</li>');
  $li.click(function() {
    radio('merge-initiated').broadcast(2);
  })
  $editorListMedium.append($li);

  var $li = $('<li>Executive Office</li>');
  $li.click(function() {
    radio('merge-initiated').broadcast(3);
  })
  $editorListMedium.append($li);
})

// Create layers
.then(function() {
  data.layers.map(function(layer) {
    layer.draw();
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
  data.cells.updateClippingPaths(data.getClientToSVGRatio());
  radio('layout-update-from-state').broadcast(0);
  $(window).resize(function() {
    data.cells.updateClippingPaths(data.getClientToSVGRatio());
    radio('layout-update-from-state').broadcast();
  });
})

// At the very end, remove the loading icon
.then(function() {
  setTimeout(function() {
    $(data.appContainer).removeClass('loading');
  }, 750);
}, function(error) {
  console.log(error);
});

radio('merge-possible').subscribe(function() {
  console.log('merge possible!!!!')
});

radio('layout-whitebox').subscribe(function() {
  data.cells.paintLayoutFromPreset(data.config.layouts[data.config.layouts.length - 1].state, data.layers);
});

radio('layout-update-from-state').subscribe(function(layoutIndex) {
  if (layoutIndex !== undefined) {
    data.cells.paintLayoutFromPreset(data.config.layouts[layoutIndex].state, data.layers);
  } else {
    data.cells.paintLayout(data.layers);
  }

  data.info.innerHTML = printInfo();
});

// TODO: refactor this; can't read it at all
radio('request-change').subscribe(function() {
  var mailto = 'mailto:protofitsupport@floored.com?Subject=Change%20Request%20for%20' +
    encodeURIComponent(data.config.project.name) +
    '&Body=Hello%20Floored%2C%0A%0AI%27d%20like%20to%20request%20the%20following%20change%20for%20' +
    encodeURIComponent(data.config.project.name) + ' at ' + encodeURIComponent(data.config.project.address) +
    '%3A%0A%0A%0A%0A%0A%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%0A' +
    'Please%20do%20not%20edit%20below%20this%20line.%0A%0AModel%20ID%3A%20' +
    encodeURIComponent(data.config.project.name)

  window.location.href = mailto;
});

radio('share').subscribe(function() {
  window.print();
});


var printInfo = function() {
  var info = "<table>";


  for (var i = 0; i < data.config.layers.length; i++) {

    if (['shell', 'static'].indexOf(data.config.layers[i].id) > -1) {
      continue;
    }

    info += "<tr class='" + data.config.layers[i].id + "'>";
    info += "<td>" + data.config.layers[i].name + "</td>";

    if (data.config.layers[i].id === 'benching') {
      info += "<td>" + data.cells.getBenchingHeadcount() + "</td>"
    } else {
      info += "<td>" + data.cells.getNumCellsByLayer(i) + "</td>";
    }

    info += "</tr>";
  }

  info += "<tr class='reception'><td>Reception</td><td>1</td></tr>"
  info += "<tr class='pantry'><td>Pantry</td><td>1</td></tr>"

  info += "<tr><td><br/></td><td></td></tr>"

  var headcount = data.cells.getHeadcount();
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

data.createDef = function(response) {
  var def = this.defs().svg(response).roots()[0].children()[0];
  def.width(def.bbox().width)
  def.height(def.bbox().height);

  return def;
};

data.getClientToSVGRatio = function() {
  return document.getElementById(data.node.id).clientWidth / data.config.width;
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
$('#change-btn').click(function() {
  radio('request-change').broadcast();
});
$('#share-btn').click(function() {
  radio('share').broadcast();
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

// Keyboard commands
window.addEventListener('keyup', function(event) {
  // if (data.modifier.shift == true && !event.shiftKey) {
  //   data.modifier.shift = false;
  // }
  console.log(event.which);
  switch (event.which) {
    case 27: // esc
      data.cells.deselectAll();
      document.getElementById('editor').className = 'no-selection';
      data.rsfInput.blur();
      break;
    case 83: // s: save state
      console.log(JSON.stringify(data.cells.getLayout()));
      break;
    case 77: // m: measure tool
      data.scale.on = !data.scale.on;
      if (data.scale.on) {
        data.btn['measure-btn'].node.dataset.measuring = 1;
      } else {
        data.btn['measure-btn'].node.dataset.measuring = 0;
        delete data.scaleObj;
        // delete data.scale.firstClick;
      }
      break;
    case 68: // d: delete iframe
      data.protofit.removeChild(document.getElementById('model-viewer'));
      data.protofit.className = '';
      break;
    case 73: // i: info
      console.log('No info!');
      break;
    case 13: // enter: unfocus input
      data.rsfInput.blur();
      break;
  }
}, false);

data.mousedown(function(event) {
  event.stopPropagation();
});

data.touchstart(function(event) {
  event.stopPropagation();
});

document.getElementById('protofit').addEventListener('mousedown', function(event) {
  data.cells.deselectAll();
  document.getElementById('editor').className = 'no-selection';
}, false);

document.getElementById('protofit').addEventListener('touchstart', function(event) {
  data.clearSelection();
  document.getElementById('editor').className = 'no-selection';
}, false);

data.rsfInput.onchange = function(event) {
  document.getElementById('sfpp').innerHTML = Math.round(event.target.valueAsNumber / data.cells.getHeadcount());
}