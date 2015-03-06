# protofit

For setup instructions, see docs/Setup.md.

## Example
Navigate to URL
```
http://localhost:3000/?client=floored&project=test
```

## To Do

### Jake

### Daniel

### Sydney

## On the radar
- Fallbacks
- Custom cell type
- Investigate pan/zoom
- Benching types (density)
- Add pop-up when mousing over cell?
- Debug mode that has cell #
- Indicate how many people would be added / removed
- Merge cells
- Add scale
- Undo / redo
- Use gulp-watch, not gulp.watch
- [Browser events](https://github.com/mudcube/Event.js)
- Add disclaimer (close, not represent)
- Modules
- Don't redraw cells on reset; unclip and change color instead
- Add compass [here](http://ai.github.io/compass.js/)
- Share multiple floor plans
- Measure tools for distances and areas

## Done
- [√] Hover states for cells
- [√] Add dropshadow to esb
- [√] Change model names in depot
- [√] Update models
- [√] Color for reception / pantry
- [√] Style picker
- [√] Remove iframe when we hit start over
- [√] Escape and click outside also make side bar disappear
- [√] Points not sorted correctly on iPad
- [√] Add input for RSF
- [√] Change empty cell color
- [√] Reduce thrash when mode-switching in ui sidebar
- [√] Loading spinner
- [√] Keep iframe alive unless changing model (hit 'd' to force delete)
- [√] Convert mouse gestures to tap gestures (mouse + touch)
- [√] click outside or hit escape to deselect all
- [√] Fix squashed desks (remove two pairs on left) and move the others; update seat in config.json
- [√] Add logo
- [√] iPad
- [√] Crop SVGs properly
- [√] Dynamically resize svg on window
- [√] Reception & Cafe (uneditable cells)
- [√] Legend for different cell types
- [√] Fix selection performance
- [√] Legend for different cell types
- [√] Add due-north
- [√] Make sure multi-select only affects first cell
- [√] Add powered by Floored
- [√] Color coding
- [√] Fill in architectural elements white
- [√] Remove zoom / pan initially
- [√] Fix shell SVG
- [√] Multiselect
- [√] fix config.json seat and layout arrays
- [√] Remove dummy cell from config.json
- [√] Fix merged cell in svg
- [√] Keep selection after picking a replacement
- [√] Add empty cell to layers
- [√] Add plan background
- [√] Start with first layout selected
- [√] Add headcount data
- [√] Add area data
- [√] Find floor plan
- [√] Combine concepts of 'shell' layer and 'empty cell'
- [√] Once you start clicking cells -> move over to next phase of UI
- [√] Add title to file

# Ideas that improve file size
- SVG defs to reuse definition of icons
- Minify and optimize svg via svgo
- Turn elements into a single large path

# Ideas that improve performance
- Render SVG icons with icon fonts. Example [here](http://frozeman.de/blog/2013/08/why-is-svg-so-slow/).
  - Cross-browser icon fonts [here](http://www.filamentgroup.com/lab/bulletproof_icon_fonts.html)
  - Pros and cons [here](http://cubicleninjas.com/icon-fonts-explained-benefits-pitfalls/)
  - Image sprites vs icon fonts [here](http://www.jontetzlaff.com/blog/2013/04/29/image-sprites-vs-web-icon-fonts/)
- Reduce number of redraws
- Use CSS transforms on HTML element holding SVG, not on SVG directly
- Use rounded coordinates. Example [here](https://www.mapbox.com/osmdev/2012/11/20/getting-serious-about-svg/)

# Ideas that improve both performance and file size
- Use CSS to style SVG elements, rather than per-element styling
- Cut up SVG layers into cells and only load what is needed
- Remove unnecessary layers and paths
- Use SVG to represent blocks and floor plan only
