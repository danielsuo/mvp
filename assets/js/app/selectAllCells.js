 // NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

// ctrl-A
  window.addEventListener('keydown', function(event) {
    if (event.which == 65 && event.ctrlKey) { // ctrl+a
      for (var i in data.cells.state) {
        data.selected.push(i);
        data.cells.paths[i].attr({
          stroke: '#f0f'
        });
      }

      if (!data.editor) {
        data.editor = document.createElement('div');
        data.editor.id = 'editor';
        data.panel.appendChild(data.editor);
      }

      data.editor.innerHTML = '';

      if (data.selected.length > 0) {
        data.editor.innerHTML += '<ul>';
        for (var i in data.config.layers) {
          data.editor.innerHTML += '<li id=layer-' + data.config.layers[i].id + '>' + data.config.layers[i].name + '</li>'
        }
        data.editor.innerHTML += '</ul>';

        for (var i in data.config.layers) {
          (function(layerId, layerIndex) {
            var layer = document.getElementById('layer-' + layerId);
            layer.addEventListener('click', function(event) {
              for (var j in data.config.layers) {
                data.config.layers[j].clipCells = [];
                data.config.layers[j].mask.remove();
                data.config.layers[j].mask = data.path();
                data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
                data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
              }

              for (var j in data.selected) {
                data.cells.state[data.selected[j]] = parseInt(layerIndex) + 1;
              }

              for (var j in data.cells.state) {
                var layer = data.cells.state[j] - 1;
                var cell = data.cells.coord[j];

                if (layer > -1) data.config.layers[layer].clipCells.push(cell);
              }

              for (var j in data.config.layers) {
                for (var k in data.config.layers[j].clipCells) {
                  data.config.layers[j].mask = path.fromPoints(data.config.layers[j].mask, data.config.layers[j].clipCells[k], true);
                }
                data.config.layers[j].svg.clipWith(data.config.layers[j].mask);
              }

              data.info.innerHTML = histogram(data.cells.state, data.config.layers.length + 1).join(', ');
              data.selected = [];
              data.cells.reset();
            });
          })(data.config.layers[i].id, i);
        }
      }

      data.info.innerHTML = histogram(data.cells.state, data.config.layers.length + 1).join(', ');
      data.info.innerHTML += '<br><br>';
      data.info.innerHTML += data.selected.join(', ');
    }
  }, false)