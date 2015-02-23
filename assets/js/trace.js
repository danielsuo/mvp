// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

var Hammer = require('hammerjs');
var SVG = require('svg.js');
require('./ixn/zoom');
require('./ixn/drag');
require('./ixn/select');
require('./ixn/resize');
require('./svg/path');
require('./svg/topath')

var Interactions = require('./ixn/inputManager.js');

var draw = SVG('protofit');
var data = draw.nested();
data.protofit = document.getElementById('protofit');

data.modifier = {
    shift: false,
    ctrl: false,
    alt: false
};
data.mode = {};
data.mode.scale = {
    on: false,
    started: false
};
data.mode.trace = {
    on: false,
    started: false,
    startSegment: false
};

data.floorplan = data.nested();
data.objects = data.nested();

var main = draw.rect(1000, 1000).attr({
    fill: '#f06'
})

// var clip = draw.rect(1000, 1000).attr({
//     fill: '#6f0'
// })

// var ellipse = draw.ellipse(100, 100).move(100, 100);

var rectPath = function(path, x, y, width, height, ccw) {
    height = height || width;
    console.log(ccw)

    return path.M({
        x: x,
        y: y
    }).L({
        x: x + (ccw ? 0 : width),
        y: y + (ccw ? height : 0)
    }).L({
        x: x + width,
        y: y + height
    }).L({
        x: x + (ccw ? width : 0),
        y: y + (ccw ? 0 : height)
    }).L({
        x: x,
        y: y
    })
}

var path = draw.path();
// var path = main.toPath(true);
// path.M({
//     x: 75,
//     y: 75
// }).L({
//     x: 75,
//     y: 275
// }).L({
//     x: 275,
//     y: 275
// }).L({
//     x: 275,
//     y: 75
// }).L({
//     x: 75,
//     y: 75
// }).M({
//     x: 150,
//     y: 150
// }).L({
//     x: 200,
//     y: 150
// }).L({
//     x: 200,
//     y: 200
// }).L({
//     x: 150,
//     y: 200
// }).L({
//     x: 150,
//     y: 150
// })

path = rectPath(path, 0, 0, 1000, 1000, true);
path = rectPath(path, 150, 150, 50, 50, false);
path = rectPath(path, 200, 200, 50, 50, false);

console.log(path.array)

// <path id="SvgjsPath1010" d="M75 75  L75 275 275 275 275 75 75 75 M150 150 L200 150 200 200 150 200 150 150"></path>
// <path id="SvgjsPath1010" d="M75 75  L75 275 275 275 275 75 75 75 M150 150 L150 200 200 200 200 150 150 150"></path>

var mask = main.clipWith(path)

// clip.clipWith(mask)

// Converts Paths to SVG path string
// and scales down the coordinates
function paths2string(paths, scale) {
    var svgpath = "",
        i, j;
    if (!scale) scale = 1;
    for (i = 0; i < paths.length; i++) {
        for (j = 0; j < paths[i].length; j++) {
            if (!j) svgpath += "M";
            else svgpath += "L";
            svgpath += (paths[i][j].X / scale) + ", " + (paths[i][j].Y / scale);
        }
        svgpath += "Z";
    }
    if (svgpath == "") svgpath = "M0,0";
    return svgpath;
}


data.enableDrag(true);
data.enableZoom(true);

var dataDiv = document.getElementById('data');

var mc = new Hammer.Manager(document.getElementById('protofit'));
mc.add(new Hammer.Pinch());
mc.add(new Hammer.Pan({
    direction: Hammer.DIRECTION_ALL,
    threshold: 0
}));
mc.add(new Hammer.Tap());
mc.add(new Hammer.Press());

mc.on("panleft panright panup pandown tap press pinch", function(ev) {
    dataDiv.innerHTML = ev.type + " gesture detected.";
});


var input = document.getElementById('file');
input.onchange = function() {
    var file = input.files[0];
    var url = window.URL.createObjectURL(file);

    if (file.type.indexOf('svg') > -1) {
        require('./svg/load')(data.floorplan, url);
    } else if (file.type.indexOf('image') > -1) {
        require('./img/load')(data.floorplan, url);
    } else if (file.type.indexOf('pdf') > -1) {
        require('./pdf/load')(data.floorplan, url);
    }

    // TOOD: Remove
    setTimeout(function() {
        console.log(data.floorplan);
    }, 2000);
};

var scaleButton = document.getElementById('scale');
scaleButton.onclick = function() {
    // TODO: Change 'on' to whether or not the object exists
    data.mode.scale.on = !data.mode.scale.on;
    if (data.mode.scale.on) {
        data.disableDrag();
        scaleButton.style.backgroundColor = '#f06';
    } else {
        scaleButton.style.backgroundColor = '#fff';
        data.enableDrag(true);
        delete data.scaleObj;
        delete data.mode.scale.firstClick;
    }
};

var traceButton = document.getElementById('trace');
traceButton.onclick = function() {
    // TODO: Change 'on' to whether or not the object exists
    data.mode.trace.on = !data.mode.trace.on;
    if (data.mode.trace.on) {
        data.disableDrag();
        traceButton.style.backgroundColor = '#f06';
    } else {
        traceButton.style.backgroundColor = '#fff';
        data.enableDrag(true);
        delete data.traceObj;
        delete data.trace;
        delete data.mode.trace.firstClick;
    }
};

var mouse2svg = function(mouse_x, mouse_y, offset_x, offset_y, viewbox) {
    return {
        x: (mouse_x - offset_x) / viewbox.zoom + viewbox.x,
        y: (mouse_y - offset_y) / viewbox.zoom + viewbox.y
    };
};

// Assume path is closed and forms irregular polyon
var area = function(path) {

    var numPoints = path.getSegmentCount() - 1;

    // Need at least 3 points
    if (numPoints > 2) {
        // If first point and last point are not equal, close the polygon.
        // This could have bad results, but whatever for now.
        // var firstPoint = path.getSegment(0).coords;
        // var lastPoint = path.getSegment(numPoints).coords;
        // if (!(firstPoint[0] == lastPoint[0] && firstPoint[1] == lastPoint[1])) {
        //   path.L(firstPoint[0], firstPoint[1]);
        // }

        var area = 0;
        var j = numPoints;
        for (var i = 0; i < numPoints; i++) {
            var prevPoint = path.getSegment(j).coords;
            var currPoint = path.getSegment(i).coords;
            area += prevPoint[0] * currPoint[1] - prevPoint[1] * currPoint[0];
            // (prevPoint[0] + currPoint[0]) * (prevPoint[1] - currPoint[1]);
            j = i;
        }

        return Math.abs(area / 2);
    }
}

// Really ghetto convenience function
var m2s = function(event) {
    return mouse2svg(
        event.pageX,
        event.pageY,
        data.protofit.offsetLeft,
        data.protofit.offsetTop,
        data.parent.viewbox());
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

// TRACE

var trace = function(event) {
    if (data.mode.trace.on) {
        if (data.mode.trace.firstClick) {
            data.mode.trace.started = true;
            if (data.mode.trace.started) {
                if (data.traceObj) data.traceObj.remove();

                var s = data.mode.trace.pivot;
                data.mode.trace.pivot = m2s(event);


                if (!data.modifier.shift) {
                    data.mode.trace.pivot = drawVHLine(s, data.mode.trace.pivot);
                }

                if (typeof data.trace != 'undefined') {
                    data.trace.L(data.mode.trace.pivot.x, data.mode.trace.pivot.y)
                } else {
                    console.log('test')
                    data.trace = draw.path();
                    data.trace.attr({
                        'fill-opacity': 0,
                        'stroke-width': 4,
                        stroke: '#0f0'
                    });
                    data.trace.M(data.mode.trace.pivot.x, data.mode.trace.pivot.y);
                }
            } else {
                // DO STUFF ONCE DONE
                // delete data.trace;
            }
        }

        data.mode.trace.firstClick = true;
    }
}

SVG.on(window, 'click', trace);
// mc.on('tap press', trace)

SVG.on(window, 'keypress', function(event) {
    if (event.keyCode == 99 && data.mode.trace.started && typeof data.trace != 'undefined' && data.trace.getSegmentCount() > 2) { // escape
        data.mode.trace.started = false;
        var firstPoint = data.trace.getSegment(0);
        data.trace.L(firstPoint.coords[0], firstPoint.coords[1]);
        if (data.traceObj) data.traceObj.remove();
        console.log(area(data.trace));
        if (data.scale) {
            console.log(area(data.trace) * data.scale * data.scale);
        }
    }
})

SVG.on(window, 'mousemove', function(event) {
    if (data.mode.trace.started) {
        if (data.traceObj) data.traceObj.remove();
        data.traceObj = draw.path();
        data.traceObj.attr({
            'fill-opacity': 0,
            'stroke-width': 4,
            stroke: '#f06'
        });
        data.traceObj.M(data.mode.trace.pivot.x, data.mode.trace.pivot.y);

        var s = m2s(event);
        if (!data.modifier.shift) {
            s = drawVHLine(data.mode.trace.pivot, s);
        }

        data.traceObj.L(s.x, s.y);
    }
});

// SCALE

var scale = function(event) {
    if (data.mode.scale.on) {
        if (data.mode.scale.firstClick) {
            console.log('on')
            data.mode.scale.started = !data.mode.scale.started;
            if (data.mode.scale.started) {
                console.log('started')
                data.mode.scale.pivot = m2s(event);
            } else {
                if (data.scaleObj && data.scaleObj.getSegmentCount() == 2) {
                    var p1 = data.scaleObj.getSegment(0).coords;
                    var p2 = data.scaleObj.getSegment(1).coords;

                    var length = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                    console.log(length)
                    var actual = prompt('What is the length?');
                    data.scale = parseInt(actual) / length;
                    console.log(data.scale)
                }
            }
        }
        data.mode.scale.firstClick = true;
    }
};

SVG.on(window, 'click', scale);
// mc.on('tap press', scale)

SVG.on(window, 'mousemove', function(event) {
    if (data.mode.scale.started) {
        if (data.scaleObj) data.scaleObj.remove();
        data.scaleObj = draw.path();
        data.scaleObj.attr({
            'fill-opacity': 0,
            'stroke-width': 4,
            stroke: '#f06'
        });
        data.scaleObj.M(data.mode.scale.pivot.x, data.mode.scale.pivot.y);

        var s = m2s(event);
        if (!data.modifier.shift) {
            s = drawVHLine(data.mode.scale.pivot, s);
        }

        data.scaleObj.L(s.x, s.y);
    }
});

SVG.on(window, 'keydown', function(event) {
    if (event.shiftKey) {
        data.modifier.shift = true;
    }
});

SVG.on(window, 'keyup', function(event) {
    // TODO: keyup not registered when prompt is open
    if (!event.shiftKey && data.modifier.shift) {
        data.modifier.shift = false;
    }
})
// mc.on("mousewheel", function(ev) {
//   dataDiv.innerHTML = ev.type + " gesture detected.";
//   // create some hammerisch eventData
//   var eventType = 'scroll';
//   var touches = Hammer.event.getTouchList(ev, eventType);
//   var eventData = Hammer.event.collectEventData(this, eventType, touches, ev);

//   // you should calculate the zooming over here, 
//   // should be something like wheelDelta * the current scale level, or something...
//   eventData.scale = ev.wheelDelta;

//   // trigger transform event
//   hammertime.trigger("transform", eventData);

//   // prevent scrolling
//   ev.preventDefault();
// });

var add = function(element) {
    return data.objects.put(element);
};

var group = function(elements) {
    console.log(elements)
    var parent = elements[0].parent

    // make sure elements all have same parent
    for (var i in elements) {
        if (parent.children().indexOf(elements[i]) < 0) {
            return;
        }
    }

    var new_group = parent.group();
    elements.map(function(el) {
        el.select(false);
        new_group.add(el);
    });

    new_group.select(true);

    return new_group;
};

SVG.on(window, 'keypress', function(event) {
    // bindings[event.keyCode](draw.rect(100, 100))
    if (event.keyCode == 97) { // a
        data.objects.rect(100, 100).attr({
            fill: '#f06',
        });
    } else if (event.keyCode == 115) { // s
        data.objects.each(function(i, children) {
            var element = this;
            element.mouseover(function(event) {
                element.attr({
                    fill: '#f48'
                });
            });
            element.mouseout(function(event) {
                element.attr({
                    fill: '#f06'
                });
            });
            element.mousedown(function(event) {
                if (element.selected || element.parent !== data.objects) {
                    element.select(false);
                    delete data.selected[data.selected.indexOf(element)];
                } else {
                    element.select(true);
                    data.selected.push(element);
                }

            });
        });

    } else if (event.keyCode == 103) { // g
        group(data.selected);
    } else if (event.keyCode == 100) { // d
        data.selected.map(function(el) {
            el.select(false);
            el.remove();
        });
    }
})

SVG.on(window, 'keydown', function(event) {
    if (event.shiftKey) {
        data.modifier.shift = true;

        data.disableDrag();
        data.disableZoom();

        data.objects.each(function(i, children) {
            this.enableDrag();
        });
    }
});

SVG.on(window, 'keyup', function(event) {
    if (!event.shiftKey && data.modifier.shift == true) {
        data.modifier.shift = false;

        data.enableDrag(true);
        data.enableZoom(true);

        data.objects.each(function(i, children) {
            this.disableDrag();
        });
    }
});