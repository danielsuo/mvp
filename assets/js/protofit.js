// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

// SVG library
var SVG = require('./svg');
require('./ixn/zoom');
require('./ixn/pan');

// Pubsub library
var radio = require('radio');

// Promise library
var Promise = require('promise');

// Application modules
var app = require('./app');
var path = require('./util/path');
var XHR = require('./util/xhr');

// Touch library
var Hammer = require('hammerjs');
var Button = require('./ixn/button');

// Fonts
require('./util/fontdeck');

// Compass
require('./lib/compass');

var isMobile = require('./util/mobile').any;

window.APP_NAME = 'svg-container';

var draw = SVG(APP_NAME);
var data = draw.nested();

// data.parentElement = document.getElementById(draw.node.id);
// data.parentElement.setAttribute('viewBox', [0, 0, data.parentElement.clientWidth, data.parentElement.clientHeight].join(' '));

// Grab URL query parameters into object
data.params = require('./util/getQueryParameters')();
data.dir = ['.', 'data', data.params.client, data.params.project].join('/');

data[APP_NAME] = document.getElementById(APP_NAME);
data.panel = document.getElementById('panel');
data.protofit = document.getElementById('protofit');
data.info = document.getElementById('info');
data.loading = document.getElementById('loading');
data.northArrow = document.getElementById('north-arrow');
data.logo = document.getElementById('project-logo');
data.rsfInput = document.getElementById('rsf-input');
data.appContainer = document.getElementById('app');
data.measurement = document.getElementById('measurement');

// data.enableZoom(data[APP_NAME]);
// data.enablePan(data[APP_NAME]);

data.cells = app.Cells;
data.selected = [];
data.scale = {
  on: false,
  started: false
};

data.modifier = {
  ctrl: false,
  shift: false,
  alt: false
};

XHR.get(data.dir + '/config.json').then(function(response) {
  var config = JSON.parse(response);
  data.config = config;
}).then(function() {
  data.bg = {
    url: data.dir + '/bg.svg',
    svg: data.nested()
  };

  data.viewbox(0, 0, data.config.width, data.config.height);

  data.northArrow.setAttribute('style', 'transform: rotate(' + data.config.north.direction + 'deg)');
  data.logo.setAttribute('style', 'background-image: url("' + data.dir + data.config.client.logo + '")');
  data.rsfInput.value = data.config.project.area;

  var disabled = [];
  for (var disabled_type in data.config.cells.disabled) {
    for (var i = 0; i < data.config.cells.disabled[disabled_type].length; i++) {
      disabled.push(data.config.cells.disabled[disabled_type][i]);
    }
  }

  data.config.cells.disabled.total = disabled;

  return SVG.load(data.bg.svg, data.bg.url).then(function(svg) {
    svg.node.setAttribute('class', 'bg');
  });
}).then(function() {
  data.cells.svg = data.nested();
}).then(function() {

  data.config.project.titleDiv = document.getElementById('project-title');
  data.config.project.titleDiv.innerHTML = '<h3>' + data.config.project.name + '</h3>'

  data.config.project.titleDiv = document.getElementById('project-address');
  data.config.project.titleDiv.innerHTML = data.config.project.address;

  for (var i in data.config.layers) {
    var layer = data.config.layers[i];
    layer.url = data.dir + '/' + layer.id + '.svg';
    layer.clipCells = [];

    layer.svg = data.nested();

    layer.mask = data.path();
    layer.mask = path.fromRect(layer.mask, 0, 0, window.innerWidth, window.innerHeight, true);
    layer.mask = path.fromRect(layer.mask, 0, 0, window.innerWidth, window.innerHeight, false);

    if (layer.id !== 'shell') {
      layer.svg.clipWith(layer.mask);
    }
  }

  data.layouts = document.getElementById('layouts');

  var ul = document.getElementById('layout-list');
  for (var i in data.config.layouts) {
    ul.innerHTML += '<li id=layout-' + data.config.layouts[i].id + '>' + data.config.layouts[i].name + '</li>'
  }
}).then(function() {
  var numLoaded = 0;

  return Promise.all(data.config.layers.map(function(layer) {
    return SVG.load(layer.svg, layer.url).then(function(svg) {
      svg.node.setAttribute('class', 'plan-layer ' + 'layer-' + layer.id)

      numLoaded += 1;
      // data.info.innerHTML = [numLoaded, 'of', data.config.layers.length, 'loaded'].join(' ');
    })
  }));

}).then(function() {
  if (data.config.merge) {
    data.config.merge.svg = data.nested();
    return SVG.load(data.config.merge.svg, data.dir + '/merge.svg');
  }
}).then(function() {
  if (data.config.merge) data.config.merge.svg.hide()
    // data.info.innerHTML = 'Loading complete!';
  data.appContainer.className = ''
  setTimeout(function() {
    document.getElementById('loading').className = ''
  }, 1000);

  return data.cells.load(data.cells.svg, data.dir + '/cells.svg')
    // .then(function() {
    //   data.cells.reset(data.cells.state);
    // })
}).then(function() {

  data.editor = document.getElementById('editor');

  var ul = document.getElementById('editor-list');
  for (var i in data.config.layers) {
    ul.innerHTML += '<li id=layer-' + data.config.layers[i].id + '>' + data.config.layers[i].name + '</li>'
  }

  // clear selection on done
  // keep selection, but clear and create new selection on click
  radio('cell-clicked').subscribe(function(i, dragging) {
    console.log('Cell clicked', i);
    console.log('    Cell contents', data.cells.coord[i].reduce(function(x, y) {
      return x + ', ' + y.x + ' ' + y.y
    }, ''));
    if (data.config.cells.disabled.total.indexOf(parseInt(i)) > -1) {
      return;
    }

    if (data.multiSelectClear) {
      data.clearSelection();
      data.multiSelectClear = false;
    }

    var index = data.selected.indexOf(i);

    if (dragging) {
      data.protofit.className = 'dragging';
    } else {
      data.multiSelectState = index > -1;
    }

    document.getElementById('actions').className = 'show-editor';

    // Unhighlight cell
    // if we mouse down on first cell and already selected
    // if we mouse over other selected cells and first cell was selected to begin with
    if ((!dragging && data.multiSelectState) || (index > -1 && dragging && data.multiSelectState)) {
      data.selected.splice(index, 1);
      // remove class
      var pathElement = document.getElementById(data.cells.paths[i].node.id);
      pathElement.dataset.selected = 0;
    }

    // Highlight cell
    // if we mouse down on first cell and not already selected
    // if we mouse over other selected cell and first cell was not selected to begin with
    else if ((!dragging && !data.multiSelectState) || (index == -1 && dragging && !data.multiSelectState)) {
      data.selected.push(i);
      // add class
      var pathElement = document.getElementById(data.cells.paths[i].node.id);
      pathElement.dataset.selected = 1;
    }



    if (data.selected.length > 0) {
      data.editor.className = 'has-selection'

      for (var i in data.config.layers) {
        (function(layerId, layerIndex) {
          var layer = new Button('layer-' + layerId);
          layer.hammer.on('tap', function(event) {
            data.multiSelectClear = true;

            for (var j in data.config.layers) {
              data.config.layers[j].clipCells = [];
              data.config.layers[j].mask.remove();
              data.config.layers[j].mask = data.path();
              data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
              data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
            }

            for (var j in data.selected) {
              data.cells.state[data.selected[j]] = parseInt(layerIndex);
            }

            for (var j in data.cells.state) {
              var layer = data.cells.state[j];
              var cell = data.cells.coord[j];
              data.cells.paths[j].node.dataset.layer = layer;
              data.config.layers[layer].clipCells.push(cell);
            }

            for (var j in data.config.layers) {
              if (data.config.layers[j].id !== 'shell') {
                for (var k in data.config.layers[j].clipCells) {
                  data.config.layers[j].mask = path.fromPoints(data.config.layers[j].mask, data.config.layers[j].clipCells[k], true);
                }
                data.config.layers[j].svg.clipWith(data.config.layers[j].mask);
              }
            }


            data.markDisabledCells();
            data.info.innerHTML = printInfo();

          });
        })(data.config.layers[i].id, i);
      }
    } else {
      data.editor.className = 'no-selection'
    }


  });

  for (var i in data.config.layouts) {
    (function(layoutId, layoutIndex) {
      var layout = new Button('layout-' + layoutId);
      layout.hammer.on('tap', function() {
        setLayout(layoutIndex)
      }, false);
    })(data.config.layouts[i].id, i);
  }

  setLayout(0);

}).catch(function(error) {
  console.log(error)
});

radio('length-change').subscribe(function(e){
  data.measurement.innerHTML = Number(e).toFixed(2) + ' ft';
})

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
      info += "<td>" + data.cells.state.filter(function(x) {
        return x == i
      }).length + "</td>";
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

var setLayout = function(layoutIndex) {

  if (layoutIndex > -1) {
    document.getElementById('layout-next-btn').removeAttribute('disabled');
    var listItems = document.getElementById('layout-list').childNodes;
    for (var j in listItems) {
      listItems[j].className = j == layoutIndex ? 'active' : '';
    }

    data.cells.state = data.config.layouts[layoutIndex].state.slice(0);
  }

  for (var j in data.config.layers) {
    data.config.layers[j].clipCells = [];
    data.config.layers[j].mask.remove();
    data.config.layers[j].mask = data.path();
    data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
    data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
  }

  data.cells.reset(data.cells.state);

  for (var j in data.cells.state) {
    var layer = data.cells.state[j];
    var cell = data.cells.coord[j];
    var node = data.cells.paths[j].node;
    data.config.layers[layer].clipCells.push(cell);
  }

  for (var j in data.config.layers) {
    if (data.config.layers[j].id !== 'shell') {
      for (var k in data.config.layers[j].clipCells) {
        data.config.layers[j].mask = path.fromPoints(data.config.layers[j].mask, data.config.layers[j].clipCells[k], true);
      }
      data.config.layers[j].svg.clipWith(data.config.layers[j].mask);
    }
  }

  data.markDisabledCells()

  document.getElementById('info').innerHTML = printInfo();
}

data.btn = {};
var btns = ['layout-next-btn', 'editor-back-btn', 'editor-done-btn', 'model-view-btn', 'merge-btn', 'measure-btn'];
for (var i = 0; i < btns.length; i++) {
  data.btn[btns[i]] = new Button(btns[i]);
}

data.btn['layout-next-btn'].hammer.on('tap', function(event) {
  console.log('layout-next-btn')
  document.getElementById('actions').className = 'show-editor';
});

data.btn['editor-back-btn'].hammer.on('tap', function(event) {
  data.clearSelection();
  document.getElementById('editor').className = 'no-selection';
  document.getElementById('actions').className = '';
  data.scale.on = false;
  data.btn['measure-btn'].node.dataset.measuring = 0;
  delete data.scaleObj;
  if (data.iframe) {
    document.getElementById('model-viewer').remove()
    data.iframe = false;
    data.btn['model-view-btn'].node.innerHTML = 'View in 3D';
    data.appContainer.className = '';
  }
});

data.btn['editor-done-btn'].hammer.on('tap', function(event) {
  data.clearSelection();
  document.getElementById('editor').className = 'no-selection';
});

data.btn['model-view-btn'].hammer.on('tap', function(event) {
  if (!data.iframe) {
    data.iframe = true;
    data.appContainer.className = 'three-d';
    data.btn['model-view-btn'].node.innerHTML = 'Close 3D view';
    if (document.getElementById('model-viewer') == null) {
      var iframe = document.createElement('iframe');
      iframe.src = data.config.models[0].url;
      iframe.id = 'model-viewer';
      data.protofit.appendChild(iframe);
    }
    document.getElementById('model-viewer').style.display = 'block';
  } else {
    document.getElementById('model-viewer').style.display = 'none';
    data.iframe = false;
    data.btn['model-view-btn'].node.innerHTML = 'View in 3D';
    data.appContainer.className = '';
  }
});

data.btn['merge-btn'].hammer.on('tap', function(event) {
  if (!data.config.merge.merged) {
    data.config.merge.merged = true;
    data.config.merge.svg.show();
    data.config.merge.state = [];
    for (var i = 0; i < data.config.merge.cells.length; i++) {
      data.config.merge.state.push(data.cells.state[data.config.merge.cells[i]]);
      data.cells.state[data.config.merge.cells[i]] = data.config.layers.length - 1;

      if (i === 0) {
        data.cells.state[data.config.merge.cells[i]] = 2; // +1 conference room
      }

      var selectIndex = data.selected.indexOf('' + data.config.merge.cells[i]);
      if (selectIndex > -1) {
        data.selected.splice(selectIndex, 1);
      }
    }
    setLayout(-1);
    for (var i = 0; i < data.config.merge.cells.length; i++) {
      data.cells.paths[data.config.merge.cells[i]].node.dataset.merged = 1;
    }
    data.btn['merge-btn'].node.innerHTML = 'Unmerge';
  } else {
    data.config.merge.merged = false;
    data.config.merge.svg.hide();
    for (var i = 0; i < data.config.merge.cells.length; i++) {
      data.cells.state[data.config.merge.cells[i]] = data.config.merge.state[i];
      // data.selected.push(data.config.merge.cells[i]);
    }
    data.config.merge.state = [];
    setLayout(-1);
    for (var i = 0; i < data.config.merge.cells.length; i++) {
      data.cells.paths[data.config.merge.cells[i]].node.dataset.merged = 0;
    }
    data.btn['merge-btn'].node.innerHTML = 'Merge';
  }
});

data.btn['measure-btn'].hammer.on('tap', function(event) {
  data.scale.on = !data.scale.on;
  if (data.scale.on) {
    data.btn['measure-btn'].node.dataset.measuring = 1;    
  } else {
    data.btn['measure-btn'].node.dataset.measuring = 0;
    delete data.scaleObj;
    // delete data.scale.firstClick;
  }
});


// document.getElementById('benching-back-btn').addEventListener('click', function(e) {
//   document.getElementById('actions').className = '';
// });

// document.getElementById('benching-next-btn').addEventListener('click', function(e) {
//   document.getElementById('actions').className = 'show-editor';
// });

// TODO: should probably have headcount property that gets updated
data.getHeadcount = function() {
  var headcount = 0;
  for (var i = 0; i < this.cells.state.length; i++) {
    headcount += this.config.layers[this.cells.state[i]].seats[i];
  }
  return headcount;
};

data.getBenchingHeadcount = function() {
  var headcount = 0;
  for (var i = 0; i < this.cells.state.length; i++) {
    if (this.cells.state[i] === 0) {
      headcount += this.config.layers[this.cells.state[i]].seats[i];
    }
  }
  return headcount;
};


data.clearSelection = function() {
  data.selected = [];
  data.cells.reset(data.cells.state);
  data.markDisabledCells();
};

data.markDisabledCells = function() {
  for (var i in data.config.cells.disabled) {
    for (var j in data.config.cells.disabled[i]) {
      var cell = data.config.cells.disabled[i][j];
      data.cells.paths[cell].node.dataset.layer = 6;
    }
  }
}

data.getArea = function() {
  return this.config.project.area;
};

data.mousedown(function(event) {
  event.stopPropagation();
});

data.touchstart(function(event) {
  event.stopPropagation();
});

document.getElementById('rsf-input').onchange = function(event) {
  document.getElementById('sfpp').innerHTML = Math.round(event.target.valueAsNumber / data.getHeadcount());
}

document.getElementById('protofit').addEventListener('mousedown', function(event) {
  data.clearSelection();
  document.getElementById('editor').className = 'no-selection';
}, false);

document.getElementById('protofit').addEventListener('touchstart', function(event) {
  data.clearSelection();
  document.getElementById('editor').className = 'no-selection';
}, false);

window.addEventListener('mouseup', function(event) {
  delete data.multiSelectState;
  data.protofit.className = data.protofit.className.replace(/(?:^|\s)dragging(?!\S)/, '')
}, false);

window.addEventListener('touchend', function(event) {
  delete data.multiSelectState;
  data.protofit.className = data.protofit.className.replace(/(?:^|\s)dragging(?!\S)/, '')
}, false);

var mouse2svg = function(mouse_x, mouse_y, offset_x, offset_y, viewbox) {
  return {
    // x: (mouse_x - offset_x) / viewbox.zoom + viewbox.x,
    // y: (mouse_y - offset_y) / viewbox.zoom + viewbox.y
    x: mouse_x - offset_x,
    y: mouse_y - offset_y
  };
};

var m2s = function(event) {  
  var point = data.node.createSVGPoint();
  point.x = event.pageX;
  point.y = event.pageY;

  return point.matrixTransform(data.node.getScreenCTM().inverse());
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

var scale = function(event) {
  if (data.scale.on) {
    data.scale.started = !data.scale.started;
    if (data.scale.started) {
      data.scale.pivot = m2s(event);
      if (data.scaleObj) data.scaleObj.remove();
    } else {
      if (data.scaleObj && data.scaleObj.getSegmentCount() == 2) {
        var p1 = data.scaleObj.getSegment(0).coords;
        var p2 = data.scaleObj.getSegment(1).coords;

        var length = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

        radio('length-done').broadcast(length);
        data.scale.on = false;
        data.btn['measure-btn'].node.dataset.measuring = 0;
        // var actual = prompt('What is the length?');
        // data.scale = parseInt(actual) / length;
      }
    }
    // }
    // data.scale.firstClick = true;
  }
};

SVG.on(data.protofit, 'click', scale);

SVG.on(window, 'mousemove', function(event) {
  if (data.scale.started) {
    if (data.scaleObj) data.scaleObj.remove();
    data.scaleObj = data.path();
    data.scaleObj.attr({
      'fill-opacity': 0,
      'stroke-width': 2.5,
      stroke: '#7270B1'
    });
    data.scaleObj.M(data.scale.pivot.x, data.scale.pivot.y);

    var s = m2s(event);
    if (!data.modifier.shift) {
      s = drawVHLine(data.scale.pivot, s);
    }

    var length = Math.sqrt(Math.pow(s.x - data.scale.pivot.x, 2) + Math.pow(s.y - data.scale.pivot.y, 2));

    radio('length-change').broadcast(length);

    data.scaleObj.L(s.x, s.y);
  }
});

window.addEventListener('keydown', function(event) {
  if (event.shiftKey) {
    data.modifier.shift = true;
  }
});

window.addEventListener('keyup', function(event) {
  if (data.modifier.shift == true && !event.shiftKey) {
    data.modifier.shift = false;
  }
  console.log(event.which);
  switch (event.which) {
    case 27: // esc
      data.clearSelection();
      document.getElementById('editor').className = 'no-selection';
      data.rsfInput.blur();
      break;
    case 83: // s: save state
      console.log(data.cells.state);
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