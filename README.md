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
 * Zoom animation where Leaflet supports it

*Compatible with Leaflet 0.7.x / 1.0.x*

## Demo

* [Simple example: Swiss cities](http://bl.ocks.org/xEviL/4921fff1d70f5601d159)
* [GeoJSON with D3](http://bl.ocks.org/xEviL/0c4f628645c6c21c8b3a)

## Basic usage

Include the dependency libraries:

    <link href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.5/leaflet.css'
               rel='stylesheet' type='text/css'/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.5/leaflet-src.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.4.9/d3.min.js"></script>

Include the D3SvgOverlay library:

    <script src="L.D3SvgOverlay.min.js"></script>

Create a map:

    var map = L.map(...);

Create an overlay:

    var d3Overlay = L.d3SvgOverlay(function(selection, projection){
    
        var updateSelection = selection.selectAll('circle').data(dataset);
        updateSelection.enter()
            .append('circle')
            ...
            .attr("cx", function(d) { return projection.latLngToLayerPoint(d.latLng).x })
            .attr("cy", function(d) { return projection.latLngToLayerPoint(d.latLng).y });
        
    });

Add it to the map:

    d3Overlay.addTo(map);

Note: within the drawing callback function you can and should use the normal [D3 workflow](https://github.com/mbostock/d3/wiki/Selections) with *update*, *.enter()* and *.exit()* selections.

## API

*Factory method*

    L.d3SvgOverlay(<function> drawCallback, <options> options?)

 * `drawCallback`  - callback to draw/update overlay contents, it's called with arguments:
 * `options`  - overlay options object:
 
 
*Drawing callback function*

    drawCallback(selection, projection)
 
 * `selection`   - D3 selection of a parent element for drawing. Put your SVG elements bound to data here
 * `projection`  - projection object. Contains methods to work with layers coordinate system and scaling
  
*Overlay options object*

available fields:

 * `zoomHide`   - (bool) hide the layer while zooming. Default is *false*. Useful when overlay contains a lot of elements and animation is laggy.
 * `zoomDraw`   - (bool) whether to trigger drawCallback on after zooming is done. Default is *true*. Useful e.g. when you want to adjust size or width of the elements depending on zoom.

*Projection object*

available methods/fields:

 * `latLngToLayerPoint(latLng, zoom?)`   - (function) returns `L.Point` projected from `L.LatLng` in the coordinate system of the overlay.
 * `layerPointToLatLng(point, zoom?)`    - (function) returns `L.LatLng` projected back from `L.Point` into the original CRS.
 * `unitsPerMeter`    - (float) this is a number of the overlay coordinate system units in 1 meter. Useful to get dimensions in meters.
 * `scale`  - scale of current zoom compared to the zoom level of overlay coordinate system. Useful if you want to make your elements of a size independent of zoom. Just divide the size by the scale.
 * `map`    - reference to the `L.Map` object, useful to get map state (zoom, viewport bounds, etc), especially when having multiple maps in the page.
 * `layer`  - reference to the `L.D3SvgOverlay` object, useful for extending behavior of the overlay.
 * `pathFromGeojson` - a [d3.geo.path](https://github.com/mbostock/d3/wiki/Geo-Paths#path) path generator object that can generate _SVG Path_ projected into the overlay's coordinate system from any [GeoJSON](http://geojson.org/)

## License

This code is provided under the MIT License (MIT).

## Brought to you by [Teralytics AG](http://teralytics.net/)

Interested in data analysis, big data, mapping and visualizations? Have experience in running big infrastructure? We're hiring!

Find how to apply at [http://teralytics.net/](http://teralytics.net/)