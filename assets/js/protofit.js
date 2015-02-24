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

var cells = {};

// Grab URL query parameters into object
var params = require('./util/getQueryParameters')();
var folder = ['.', 'data', params.client, params.project].join('/');
var config;

data.protofit = document.getElementById('protofit');
data.panel = document.getElementById('panel');
data.info = document.getElementById('info');

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
    require('./svg/load')(config.layers[i].svg, folder + '/' + config.layers[i].name + '.svg', function(svg) {
      numLoaded++;
      data.info.innerHTML = ['Finished loading', parseInt(numLoaded), 'of', config.layers.length, 'files'].join(' ');
      console.log(svg)
    });

    config.layers[i].mask = path.fromRect(config.layers[i].mask, 0, 0, window.innerWidth, window.innerHeight, true);
    config.layers[i].mask = path.fromRect(config.layers[i].mask, 0, 0, window.innerWidth, window.innerHeight, false);

    config.layers[i].svg.clipWith(config.layers[i].mask)
  }

  data.floorplan = data.nested();

  app.loadCells(data.floorplan, config, folder + '/cells.svg');

  data.layouts = document.createElement('div');
  data.layouts.id = 'layouts';
  data.panel.appendChild(data.layouts);

  data.layouts.innerHTML += '<ul>';
  for (var i in config.layouts) {
    data.layouts.innerHTML += '<li id=layout-' + config.layouts[i].id + '>' + config.layouts[i].name + '</li>'
  }
  data.layouts.innerHTML += '</ul>';

  for (var i in config.layouts) {
    var layout = document.getElementById('layout-' + config.layouts[i].id);
    (function(layoutId, layoutIndex) {
      layout.addEventListener('click', function(event) {
        console.log(layoutId)
        for (var j in config.layers) {
          config.layers[j].clipCells = [];
          config.layers[j].mask = data.path();
          config.layers[j].mask = path.fromRect(config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
          config.layers[j].mask = path.fromRect(config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
        }

        config.state = config.layouts[layoutIndex].state;

        for (var j in config.state) {
          var layer = config.state[j] - 1;
          var cell = config.cells[j];

          if (layer > -1) config.layers[layer].clipCells.push(cell);
        }

        console.log(config.layers.map(function(x) { return x.clipCells }));

        for (var j in config.layers) {
          for (var k in config.layers[j].clipCells) {
            config.layers[j].mask = path.fromPoints(config.layers[j].mask, config.layers[j].clipCells[k], true);
          }
          config.layers[j].svg.clipWith(config.layers[j].mask);
        }
      }, false);
    })(layout.innerHTML, i);
  }

  radio('cell-clicked').subscribe(function(i, cell) {

    config.state[i] = (config.state[i] + 1) % (config.layers.length + 1);

    // If state should be blank, delete cell from all clips
    if (config.state[i] == 0) {
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
        var currState = parseInt(j) + 1 == config.state[i];

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

    data.info.innerHTML = histogram(config.state).join(', ');
  });
});