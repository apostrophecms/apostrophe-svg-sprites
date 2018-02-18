# apostrophe-svg-sprites

`apostrophe-images` for SVGs in external sprite maps!

This bundle provides a piece subclass that manages and renders SVG sprites referenced from external maps and an accompanying widget for display.

This bundle assumes you are compiling/managing the SVG maps on your own (Gulp, Webpack, manual) and leaving them in a publicly accessible place (`/public` for example).

This module is *not* an interface for uploading SVG files or pasting SVG markup.

Bundle consists of 

* `apostrophe-svg-sprites` as a piece subclass for managing SVGs, similar to `apostrophe-images`
* `apostrophe-svg-sprites-widgets` as a way to render the SVG on a page

`apostrophe-svg-sprites` supports multiple source maps for multiple sets of SVGs.

## Example configuration

```javascript
// in app.js
// We must declare the bundle!
bundles: [ 'apostrophe-svg-sprites' ],
modules: {
  'apostrophe-svg-sprites': {
    maps: [
      {
        label: 'Social Media Icons',
        name: 'social',
        file: 'svg/social.svg'
      },
      {
        label: 'Places Icons',
        name: 'places',
        file: 'svg/places.svg'
      }
    ]
  },
  'apostrophe-svg-sprites-widgets': {},
}


```
## Example markup

```HTML
  <svg>
    <use xlink:href="{{ svg.map }}#{{ svg.id }}"></use>
  </svg>
```

## Why use external SVG maps?

SVGs
- Resolution independent
- Small footprint
- Can be manipulated via CSS and JS

`<use>` tag
- External file is cached
- Network friendly (a single resource serves many scenarios)
- No browser penalty for multiple uses of the same SVG on a single page

## Browser Support
SVG sprite maps are supported in Chrome, Safari 7.1+, Firefox, Edge 13+, Opera. Pair this module with something like [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) to get support Safari 6, IE 6+, and Edge 12.