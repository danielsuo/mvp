# Protofit MVP
[![Build Status](https://travis-ci.org/danielsuo/protofit.svg)](https://travis-ci.org/danielsuo/protofit)

## Set up
- Run ```./install```
- Create ```./config/env.json``` based on the provided example

## TODO
=======
- Fix printinfo
- Add cell for reception
- draw merged cells

-------------------------


- Add doors
- Center to visual center
- Merge to merge
- Figure out real world coordinates
- Add special be able to change it
- Set up routes
- Saving / loading test fits
- List of test fits
- Fix drawing of large merges
- Recursive splitting
- Fix being able to merge multiple tiles

- Multiline addresses
- Move unmoveable cells (e.g., reception, pantry) to own layer
  - Add disabled layers
  - Remove for whitebox
- Users
  - Floored admin: can do everything
  - Org admin: can do everything within organization
  - User: can do everything but add other users within organization (can we kill?)
  - Users belong to organizations; permissions check if in organization and role
- Trailing slash routing problem
- Active demising checkbox
- Set up permissions for different groups
- Google analytics
- Other analytics?
- Set up s3 + authentication
- Migrations
  - [mongodb-migrations](https://github.com/emirotin/mongodb-migrations)
  - [mongo-migrate](https://github.com/afloyd/mongo-migrate)
  - [mongoose-data-migrations](https://github.com/InterNACHI/mongoose-data-migrations)
  - [mongoose-migrate](https://github.com/madhums/mongoose-migrate)
  - [migrate](https://github.com/tj/node-migrate)
  - [mongoose-rolling-migration](https://github.com/kennethklee/mongoose-rolling-migration)
  - [mongoose-lazy-migration](http://cnpmjs.org/package/mongoose-lazy-migration)
- Deploying migrations

## Done
- Show reception / pantry
- fix cells
- Deselect cells
- Disabled cells
- Merge UI
- Print.css
- Request change
- Deploy
- Print.css
- Get/set layout with merged
- Merging
- Merge rules
- Pre-configured merge
- logo
- Name and address
- Deselect cells upon selection after updating cell type
- Print to pdf
- add the badges
- Set up nunjucks
- set up nodemon
- set up gulp + restart on self
- Set up stylus
- Set up browserify
- Set up mongoose
- Set up mongo + add to install / readme
- Set up environment variables
- Set up travis
- Set up heroku
- Set up users
- Drop in protofit
- Relationships
- Create models (orgs, buildings, floors, suite arrangements, suites)
- Deal with window resizing
- Support merging in data structure (not necessarily implement)
- White-box button
- Hook up cell change buttons

## On the radar
- Only chrome works
- Hover cell info
- Fallbacks
- Sharing (e.g., email; printable page)
- Investigate pan/zoom
- Benching types (density)
- Add pop-up when mousing over cell?
- Debug mode that has cell #
- Indicate how many people would be added / removed
- Merge cells
- Undo / redo
- Use gulp-watch, not gulp.watch
- [Browser events](https://github.com/mudcube/Event.js)
- Add disclaimer (close, not represent)
- Modules
- Don't redraw cells on reset; unclip and change color instead
- Add compass [here](http://ai.github.io/compass.js/)
- Share multiple floor plans
- Fix drag out of window, still mousedown bug
- Measure tools for distances and areas

## Ideas that improve file size
- SVG defs to reuse definition of icons
- Minify and optimize svg via svgo
- Turn elements into a single large path
- Gzip SVGs

## Ideas that improve performance
- https://blog.idrsolutions.com/2014/11/6-tips-optimising-svg-files/
- Render SVG icons with icon fonts. Example [here](http://frozeman.de/blog/2013/08/why-is-svg-so-slow/).
  - Cross-browser icon fonts [here](http://www.filamentgroup.com/lab/bulletproof_icon_fonts.html)
  - Pros and cons [here](http://cubicleninjas.com/icon-fonts-explained-benefits-pitfalls/)
  - Image sprites vs icon fonts [here](http://www.jontetzlaff.com/blog/2013/04/29/image-sprites-vs-web-icon-fonts/)
- Reduce number of redraws
- Reusing symbols? Example [here](http://stackoverflow.com/questions/8604999/does-reusing-symbols-improve-svg-performance)
- Use CSS transforms on HTML element holding SVG, not on SVG directly
- Use rounded coordinates. Example [here](https://www.mapbox.com/osmdev/2012/11/20/getting-serious-about-svg/)
- Use rasterized images wherever possible
- http://calendar.perfplanet.com/2014/tips-for-optimising-svg-delivery-for-the-web/
- Don't parse then draw svg; draw directly when possible

## Ideas that improve both performance and file size
- Use CSS to style SVG elements, rather than per-element styling
- Cut up SVG layers into cells and only load what is needed
- Remove unnecessary layers and paths
- Use SVG to represent blocks and floor plan only
- [√] Draw background as image / don't use SVG.js to render -> use browser to render
- Store object locations rather than all data for how an object looks (lends well to using SVG refs)
- Canvas?