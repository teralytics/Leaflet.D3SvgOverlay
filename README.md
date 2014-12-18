Leaflet.D3SvgOverlay
===============

An overlay class for [Leaflet](http://leafletjs.com), a JS 
library for interactive maps.  Allows drawing overlay using SVG
with the help of [D3](http://d3js.org), a JavaScript library
for manipulating documents based on data.

## Features

 * Easy SVG-drawing with D3
 * No limitations to polylines, circles or geoJSON. Draw whatever you want with SVG
 * No need to reproject your geometries on zoom, this is done using SVG scaling
 * Zoom animation in Firefox, Chrome, Android browser and in IE 11
 * Auto-adjusting SVG viewport for both performance and "endless" panning experience

*Tested with Leaflet 0.7.3 and D3 3.4.9*

## Demo

Demo pages are under development. 

## Basic usage

Include the dependency libraries:

    <script src="d3.min.js"></script>
    <script src="leaflet.min.js"></script>

Include the D3SvgOverlay library:

    <script src="L.D3SvgOverlay.min.js"></script>

Create a map:

    var map = L.map(...);

Create an overlay:

    var d3Overlay = L.d3SvgOverlay(function(selection,projection){
    
        var updateSelection = selection.selectAll('circle').data(dataset);
        updateSelection.enter()
            .append('circle')
            ...
            .attr("cx",function(d){return projection.latLngToLayerPoint(d.latLng).x;})
            .attr("cy",function(d){return projection.latLngToLayerPoint(d.latLng).y;});
        
    });
    
Add it to the map:

    d3Overlay.addTo(map);

## API

*Factory method*

    L.d3SvgOverlay( <function> drawCallback, <options> options? )

 * `drawCallback`  - callback to draw/update overlay contents, it's called with arguments:
 * `options`  - overlay options object:
 
 
*Drawing callback function*

    drawCallback( selection, projection )
 
 * `selection`   - D3 selection of a parent element for drawing. Put your SVG elements bound to data here
 * `projection`  - projection object. Contains methods to work with layers coordinate system and scaling
  
*Overlay options object*

available fields: 
 
 * `zoomAnimate`    - (bool) use animation when zooming. Default is true. Leaflet must have animation enabled for this to work
 * `zoomHide`   - (bool) hide the layer while zooming. Default is !zoomAnimate
 * `zoomDraw`   - (bool) whether to trigger drawCallback on after zoom is done. Default is true
 * `jsAnimation`    - (bool) force use of D3 for animation. Default is false. By default it's using SMIL animation where available and D3 animation for IE

*Projection object*

available methods/fields:

 * `latLngToLayerPoint(latLng, zoom?)`   - (function) returns `L.Point` projected from `L.LatLng` in the coordinate system of an overlay
 * `layerPointToLatLng(point, zoom?)`    - (function) returns `L.LatLng` projected back from `L.Point` into the original CRS
 * `unitsPerMeter`    - (float) this is a number of units in the overlay coordinate system. Useful to get dimentions in meters
 * `map`    - reference to the `L.Map` object, useful to get map state (zoom, viewport bounds, etc)
 * `layer`  - reference to the `L.D3SvgOverlay` object, useful for extending behavoir of the overlay

## License

This code is provided under the MIT License (MIT).

## Brought to you by Teralytics AG

Interested in data analysis, big data, mapping and visualizations? Have experience in running big infrastructure? We're hiring!

Find how to apply at http://teralytics.net