var SVG = require('./svg');
var Promise = require('promise');
var radio = require('radio');
var XHR = require('./util/xhr');
var _ = require('lodash');

var sortPoints = require('./util/sortPoints');

data = SVG('clips').nested();
data.dir = '/data/floored/test';
data.cells = require('./app/cells');

XHR.get(data.dir + '/config.json')

// Parse config file
.then(function(response) {
  data.config = JSON.parse(response);
})

// Load cell data
.then(function() {
  // return data.cells.load(data.cells.svg, data.dir + '/cells.svg');
  return XHR.get(data.dir + '/cells.svg');
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
  data.viewbox(0, 0, data.config.width, data.config.height);
  data.attr({
    'preserveAspectRatio': 'xMinYMin'
  })
  // data.size(1000, 500)

  data.cells.map(function(cell) {
    cell.path = data.path();
    cell.path.attr({
      'fill-opacity': 0.2
      // 'stroke': '#f06',
      // 'stroke-weight': 5
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
      radio('cell-clicked').broadcast(cell);
    })
  })
}, function(error) {
  console.log(error);
});

radio('cell-clicked').subscribe(function(cell) {
  console.log(cell)
});



// var clips = SVG('clips');
// var ellipse = clips.ellipse(500, 200).move(100, 100);
// var clip = clips.clip().add(ellipse);
// var clip2 = clips.clip().add(ellipse.clone());

var shell = document.getElementById('shell')

var setClipPath = function($element, path) {
  $element.css({
    '-webkit-clip-path': path,
    'clip-path': path
  });
};

var createClipPath = function(x, y, width, height) {

}

if (shell != null) {
  // setClipPath($('#shell'), 'polygon(0px 0px, 0px 500px, 500px 500px, 500px 0px)');
  // setClipPath($('#conference'), 'polygon(0px 0px, 0px 500px, 500px 500px, 500px 0px)');
  // $('#breakout').css({
  //   '-webkit-clip-path': 'url(#' + clip.node.id + ')'
  // })
  // $('#shell').css({
  //   '-webkit-clip-path': 'url(#' + clip2.node.id + ')'
  // })

  // rect = clips.rect(300, 300);
  // rect.attr({
  //   fill: '#f06'
  // })
  // clip.add(rect)
  // rect.remove()
}