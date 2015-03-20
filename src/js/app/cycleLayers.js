// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

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