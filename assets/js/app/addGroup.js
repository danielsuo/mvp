// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

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

    data.disablePan();
    data.disableZoom();

    data.objects.each(function(i, children) {
      this.enablePan();
    });
  }
});

SVG.on(window, 'keyup', function(event) {
  if (!event.shiftKey && data.modifier.shift == true) {
    data.modifier.shift = false;

    data.enablePan(true);
    data.enableZoom(true);

    data.objects.each(function(i, children) {
      this.disablePan();
    });
  }
});