// NOTE: A number of shitty things are happening in this code base

// - We have this global variable 'data' that holds everything
// - Our server-side and client-side data models are completely different
// - We draw cells in two very different ways


require('./util/fontdeck');

var SVG = require('./svg');
var Promise = require('promise');
var radio = require('radio');
var XHR = require('./util/xhr');
var _ = require('./util/lodash');

var Cell = require('./app/cell');
var CellList = require('./app/cellList');

var Layer = require('./app/layer');
var LayoutList = require('./app/layoutList');

data = SVG('svg');

var re = /\/app\/(\w+)\/?/;
data.id = window.location.pathname.match(re)[1];

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
data.$nameInput = $('#protofit input.name');

XHR('/config/' + data.id).get()

// Parse config file and configure SVG canvas
.then(function(response) {
  data.config = JSON.parse(response);

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
  data.logo.setAttribute('style', 'background-image: url("' + data.config.directory + data.config.organizations[0].logo + '")');
  $('#project-title').html('<h3>' + data.config.suite.name + '</h3>');
  $('#project-address').html(data.config.building.address);

  data.rsfInput.value = data.config.suite.area;

  data.layers = data.config.layers.map(function(layer, index) {
    return new Layer(layer, index);
  });
})

// Set up defs for all data objects

.then(function() {

  return Promise.all([
    XHR('/img/conference-16.svg').get().then(function(response) {
      data.conferenceLarge = data.createDef(response);
    }),
    XHR('/img/conference-10.svg').get().then(function(response) {
      data.conferenceSmall = data.createDef(response);
    }),
    XHR('/img/desk.svg').get().then(function(response) {
      data.deskSmall = data.createDef(response);
    }),
    XHR('/img/table.svg').get().then(function(response) {
      data.table = data.createDef(response);
    })
  ]);
})

.then(function() {

  var $viewTestfitList = $('#panel .list');
  var $newTestfitList = $('#panel .new');

  data.layouts = new LayoutList($viewTestfitList, $newTestfitList);
  data.layouts.loadFromPresets(data.config.layouts);
  data.layouts.loadFromUserDefined(data.id);

  var $editorList = $('#panel .editor ul').first();
  var $editorListBig = $('#panel .editor ul').last();

  // Set up cell editor buttons
  data.layers.map(function(layer) {
    layer.createButton($editorList, function() {
      data.cells.splitWithLayer(data.cells.selected, layer.index, true);
    });
  });

  var $li = $('<li>Big Conference Room</li>');
  $li.click(function() {
    radio('merge-initiated').broadcast(2);
  })
  $editorListBig.append($li);

  var $li = $('<li>Executive Office</li>');
  $li.click(function() {
    radio('merge-initiated').broadcast(3);
  })
  $editorListBig.append($li);
})

// Create layers
.then(function() {
  data.layers.map(function(layer) {
    layer.draw();
  });

  // Add background shadow
  $('#svg-bg').css({
    'background-image': 'url(' + data.config.directory + 'bg.svg)'
  });
})

// Create new CellList from cell svg data
.then(function() {
  return CellList.load(data, data.config.directory + 'cells.svg');
})

// Assign CellList to data.cells
.then(function(cells) {
  data.cells = cells;
})

.then(function() {

  data.currentTestfit = data.previousTestfit = data.layouts.initial;

  data.cells.updateClippingPaths(data.getClientToSVGRatio());
  radio('layout-update-from-state').broadcast(data.layouts.get(data.currentTestfit));
  $(window).resize(function() {
    data.cells.updateClippingPaths(data.getClientToSVGRatio());
    radio('layout-update-from-state').broadcast();
  });
})

// At the very end, remove the loading icon
.then(function() {
  setTimeout(function() {
    $('#panel .list li').first().click();
    setTimeout(function() {
      $(data.appContainer).removeClass('loading');
    }, 100)
  }, 750);
}, function(error) {
  console.log(error);
});

radio('merge-possible').subscribe(function() {
  console.log('merge possible!!!!')
});

radio('layout-update-from-state').subscribe(function(layout, newTestfit) {
  if (layout !== undefined) {
    data.cells.paintLayoutFromPreset(layout.state, data.layers);
    if (newTestfit === undefined || !newTestfit) data.$nameInput.val(layout.name);
    for (var i in layout.buttons) {
      layout.buttons[i].parent().parent().find('li').removeClass('active');
      layout.buttons[i].addClass('active');
    }
    if (layout.preset) {
      $('#panel .list button.edit').attr('disabled', true)
      // $('#protofit').addClass('no-pointer-events')
    } else {
      $('#panel .list button.edit').removeAttr('disabled')
      // $('#protofit').removeClass('no-pointer-events')
    }
  } else {
    data.cells.paintLayout(data.layers);
  }

  data.info.innerHTML = printInfo();
});

// TODO: refactor this; can't read it at all
radio('request-change').subscribe(function() {
  var mailto = 'mailto:protofitsupport@floored.com?Subject=Change%20Request%20for%20' +
    encodeURIComponent(data.config.suite.name) +
    '&Body=Hello%20Floored%2C%0A%0AI%27d%20like%20to%20request%20the%20following%20change%20for%20' +
    encodeURIComponent(data.config.suite.name) + ' at ' + encodeURIComponent(data.config.building.address) +
    '%3A%0A%0A%0A%0A%0A%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%0A' +
    'Please%20do%20not%20edit%20below%20this%20line.%0A%0AModel%20ID%3A%20' +
    encodeURIComponent(data.config.suite.name)

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
  return document.getElementById(data.node.id).clientWidth / data.viewbox().width;
};

data.getArea = function() {
  return this.config.suite.area;
};

data.beforePrint = function() {
  radio('layout-update-from-state').broadcast();
};

data.afterPrint = function() {
  // radio('layout-update-from-state').broadcast();
};

var beginNewTestFit = function() {
  // show new panel
  $('#panel .new li').removeClass('active')
  $('#panel').addClass('show-new');
  $(data.appContainer).addClass('new-testfit')

  data.previousTestfit = data.currentTestfit;

  // show whitebox
  var layout = data.layouts.draft('Untitled', data.layouts.getPreset(data.layouts.initial).state);
  data.currentTestfit = layout.id;

  radio('layout-update-from-state').broadcast(data.layouts.get(data.currentTestfit));
}

var cancelNewTestFit = function() {
  $('#panel').removeClass('show-new');
  $(data.appContainer).removeClass('new-testfit')

  data.layouts.remove(data.currentTestfit);

  data.currentTestfit = data.previousTestfit;

  radio('layout-update-from-state').broadcast(data.layouts.get(data.currentTestfit));
}

$('#panel .list button.back').click(function() {
  window.location.href = "/home"
});

// Plus button to create new testfit
$('#panel .list button.new').click(function() {
  beginNewTestFit();
});


$('#panel section.list button.edit').click(function() {
  $('#panel').removeClass('show-new');
  $('#panel').addClass('show-editor');
});

$('#panel .new button.close').click(function() {
  cancelNewTestFit();
});

// Create new testfit button on new test fit panel
$('#panel .new button.edit').click(function() {
  // Save new test fit
  data.layouts.commit(data.currentTestfit);

  $(data.appContainer).removeClass('new-testfit')
  data.$nameInput.focus()

  $('#panel').removeClass('show-new');
  $('#panel').addClass('show-editor');
});

$('#panel .editor button.cancel, #panel .editor button.close').click(function() {
  $('#panel').removeClass('show-editor');
  radio('selection-clear').broadcast();
});

$('#panel .editor button.save').click(function() {
  $('#panel').removeClass('show-editor');

  var layout = data.cells.getLayout();
  data.layouts.get(data.currentTestfit).updateLayout(layout);
  radio('selection-clear').broadcast();
});

$('button.deselect').click(function() {
  radio('selection-clear').broadcast();
});

$('#change-btn').click(function() {
  radio('request-change').broadcast();
});

$('#share-btn').click(function() {
  radio('share').broadcast();
});

data.$nameInput.blur(function() {
  data.layouts.get(data.currentTestfit).updateName(this.value)
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
  // document.getElementById('editor').className = 'no-selection';
}, false);

document.getElementById('protofit').addEventListener('touchstart', function(event) {
  data.clearSelection();
  // document.getElementById('editor').className = 'no-selection';
}, false);

data.rsfInput.onchange = function(event) {
  document.getElementById('sfpp').innerHTML = Math.round(event.target.valueAsNumber / data.cells.getHeadcount());
}

data.$nameInput.keyup(function(event) {
  if (event.keyCode === 13 || event.keyCode === 27) { // enter and escape
    this.blur();
  }
});
