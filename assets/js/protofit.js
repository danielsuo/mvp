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

// Compass
require('./lib/compass');

window.APP_NAME = 'protofit';

var draw = SVG(APP_NAME);
var data = draw.nested();

// Grab URL query parameters into object
data.params = require('./util/getQueryParameters')();
data.dir = ['.', 'data', data.params.client, data.params.project].join('/');

data[APP_NAME] = document.getElementById(APP_NAME);
data.panel = document.getElementById('panel');
data.protofit =  document.getElementById('protofit');
data.info = document.getElementById('info');

// data.enableZoom(data[APP_NAME]);
// data.enablePan(data[APP_NAME]);

data.cells = app.Cells;
data.selected = [];

XHR.get(data.dir + '/config.json').then(function(response) {
  var config = JSON.parse(response);
  data.config = config;
}).then(function() {
  data.bg = {
    url: data.dir + '/bg.svg',
    svg: data.nested()
  };

  data.northArrow = document.getElementById('north-arrow');
  data.northArrow.setAttribute('style', 'transform: rotate(' + data.config.north.direction + 'deg)');

  return SVG.load(data.bg.svg, data.bg.url).then(function(svg) {
    svg.node.setAttribute('class', 'bg');
  });
}).then(function() {
  data.cells.svg = data.nested();

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
      data.info.innerHTML = [numLoaded, 'of', data.config.layers.length, 'loaded'].join(' ');
    })
  }));
}).then(function() {
  data.info.innerHTML = 'Loading complete!';

  return data.cells.load(data.cells.svg, data.dir + '/cells.svg').then(function() {
    data.cells.reset(data.cells.state);
  })
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
    if (data.config.cells.disabled.indexOf(parseInt(i)) > -1) {
      return;
    }

    if (data.multiSelectClear) {
      data.selected = [];
      data.cells.reset(data.cells.state);
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
      pathElement.setAttribute('class', 'cell')
    }

    // Highlight cell
    // if we mouse down on first cell and not already selected
    // if we mouse over other selected cell and first cell was not selected to begin with
    else if ((!dragging && !data.multiSelectState) || (index == -1 && dragging && !data.multiSelectState)) {
      data.selected.push(i);
      // add class
      var pathElement = document.getElementById(data.cells.paths[i].node.id);
      pathElement.setAttribute('class', 'cell selected')
    }



    if (data.selected.length > 0) {
      data.editor.className = 'has-selection'

      for (var i in data.config.layers) {
        (function(layerId, layerIndex) {
          var layer = document.getElementById('layer-' + layerId);
          layer.addEventListener('click', function(event) {
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
      var layout = document.getElementById('layout-' + layoutId);
      layout.addEventListener('click', function() {
        setLayout(layoutIndex)
      }, false);
    })(data.config.layouts[i].id, i);
  }


  setLayout(0);

}).catch(function(error) {
  console.log(error)
});

var printInfo = function() {
  var info = "<table>";


  for (var i = 0; i < data.config.layers.length; i++) {
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

  var headcount = data.getHeadcount();
  info += "<tr class='headcount'>";
  info += "<td>Total headcount</td>";
  info += "<td>" + headcount + "</td>";
  info += "</tr>";

  var area = data.getArea();
  info += "<tr class='sf'>";
  info += "<td>SF per person</td>"
  info += "<td>" + Math.round(area / headcount) + "</td>";
  info += "</tr>";

  info += "</table>"

  return info;
}

var setLayout = function(layoutIndex) {

  document.getElementById('layout-next-btn').removeAttribute('disabled');
  var listItems = document.getElementById('layout-list').childNodes;
  for (var j in listItems) {
    listItems[j].className = j == layoutIndex ? 'active' : '';
  }

  for (var j in data.config.layers) {
    data.config.layers[j].clipCells = [];
    data.config.layers[j].mask.remove();
    data.config.layers[j].mask = data.path();
    data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
    data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
  }

  data.cells.state = data.config.layouts[layoutIndex].state.slice(0);

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

  data.cells.reset(data.cells.state);

  // for (var j in data.cells.state) {
  //   var node = data.cells.paths[j].node.dataset.layer = data.cells.state[j];
  // }

  document.getElementById('info').innerHTML = printInfo();
}

document.getElementById('layout-next-btn').addEventListener('click', function(e) {
  // document.getElementById('actions').className = 'show-benching';
  document.getElementById('actions').className = 'show-editor';
});

// document.getElementById('benching-back-btn').addEventListener('click', function(e) {
//   document.getElementById('actions').className = '';
// });

// document.getElementById('benching-next-btn').addEventListener('click', function(e) {
//   document.getElementById('actions').className = 'show-editor';
// });

document.getElementById('editor-back-btn').addEventListener('click', function(e) {
  data.selected = [];
  data.cells.reset(data.cells.state);
  document.getElementById('editor').className = 'no-selection';
  document.getElementById('actions').className = '';
});

document.getElementById('editor-done-btn').addEventListener('click', function(e) {
  data.selected = [];
  data.cells.reset(data.cells.state);
  document.getElementById('editor').className = 'no-selection';
});

// TODO: should probably have headcount property that gets updated
data.getHeadcount = function() {
  var headcount = 0;
  for (var i = 0; i < this.cells.state.length; i++) {
    headcount += this.config.layers[this.cells.state[i]].seats[i];
  }
  return headcount;
}

data.getBenchingHeadcount = function() {
  var headcount = 0;
  for (var i = 0; i < this.cells.state.length; i++) {
    if (this.cells.state[i] === 0) {
      headcount += this.config.layers[this.cells.state[i]].seats[i];
    }
  }
  return headcount;
}

data.getArea = function() {
  return this.config.project.area;
}

window.addEventListener('mouseup', function(event) {
  delete data.multiSelectState;
  data.protofit.className = '';
}, false);

window.addEventListener('keypress', function(event) {
  console.log(event.charCode);
  switch (event.charCode) {
    case 115: // s: save state
      console.log(data.cells.state);
      break;
    case 105: // i: info
      console.log('No info!');
      break;
  }
}, false);

WebFontConfig = {
  fontdeck: {
    id: '28160'
  }
};

(function() {
  var wf = document.createElement('script');
  wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
    '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();