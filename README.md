# protofit

For setup instructions, see docs/Setup.md.

## Example
Navigate to URL
```
http://localhost:3000/?client=floored&project=test
```

## To Do
- [√] Keep selection after picking a replacement
- [√] Add empty cell to layers
- [√] Add plan background
- [√] Start with first layout selected
- [√] Add headcount data
- [√] Add area data
- Find floor plan
- Fix shell SVG
- Add title to file
- Reception & Cafe (uneditable cells)
- Color coding + legend
- [√] Combine concepts of 'shell' layer and 'empty cell'
- Indicate how many people would be added / removed
- Merge cells
- Crop SVGs properly
- Remove zoom / pan initially
- Once you start clicking cells -> move over to next phase of UI
- Benching types (density)
- Add logo
- Multiple clients
- Add due-north
- Add scale
- Clear canvas
- Use gulp-watch, not gulp.watch
- [Browser events](https://github.com/mudcube/Event.js)
- Add disclaimer (close, not represent)
- Modules
- iPad

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
