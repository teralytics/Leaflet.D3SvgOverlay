/**
 * Copyright 2014 Teralytics AG
 *
 * @author Kirill Zhuravlev <kirill.zhuravlev@teralytics.ch>
 *
 */

// Check requirements
if (typeof d3 == "undefined") {
    throw "D3 SVG Overlay for Leaflet requires D3 library loaded first";
}
if (typeof L == "undefined") {
    throw "D3 SVG Overlay for Leaflet requires Leaflet library loaded first";
}

// Tiny stylesheet bundled here instead of a separate file
d3.select("head")
    .append("style")
    .attr("type", "text/css")
    .text("svg.d3-overlay{pointer-events:none;position:absolute;}svg.d3-overlay>g.origin *{pointer-events:visiblePainted;}");

// Class definition
L.D3SvgOverlay = (L.version < "1.0" ? L.Class : L.Layer).extend({
    includes: (L.version < "1.0" ? L.Mixin.Events : []),

    _isDef: function(a){ return typeof a != "undefined" },

    _options: function (options) {
        if (!this._isDef(options)) {
            return this.options;
        }
        options.zoomHide = !this._isDef(options.zoomHide) ? false : options.zoomHide;
        options.zoomDraw = !this._isDef(options.zoomDraw) ? true : options.zoomDraw;

        return this.options = options;
    },

    draw: function () {
        this._drawCallback(this.selection, this.projection, this.map.getZoom());
    },

    initialize: function (drawCallback, options) { // (Function(selection, projection)), (Object)options
        this._options(options || {});
        this._drawCallback = drawCallback;
    },

    // Handler for "viewreset"-like events, updates scale and shift after the animation
    _zoomChange: function (evt) {
        var newZoom = this._isDef(evt.zoom) ? evt.zoom : this.map._zoom; // "viewreset" event in Leaflet has not zoom/center parameters like zoomanim
        this._zoomDiff = newZoom - this._zoom;
        this._scale = Math.pow(2, this._zoomDiff);
        this._shift = this.map._latLngToNewLayerPoint(this._origin, newZoom,
            (evt.center || this.map._initialCenter || this.map.getCenter()));

        var shift = ["translate(", this._shift.x, ",", this._shift.y, ") "];
        var scale = ["scale(", this._scale, ",", this._scale,") "];
        this._rootGroup.attr("transform", shift.concat(scale).join(""));

        if (this.options.zoomDraw) { this.draw() }
    },

    onAdd: function (map) {
        this.map = map;
        var _layer = this;

        // SVG element
        if (L.version < "1.0") {
            map._initPathRoot();
            this._svg = d3.select(map._panes.overlayPane)
                .select("svg");
            this._rootGroup = this._svg.append("g");
        } else {
            this._svg = L.svg();
            map.addLayer(this._svg);
            this._rootGroup = d3.select(this._svg._rootGroup);
        }
        this._rootGroup.classed("leaflet-zoom-hide", this.options.zoomHide);
        this.selection = this._rootGroup;
        
        // Init shift/scale invariance helper values
        this._origin = this.map.layerPointToLatLng([0, 0]);
        this._zoom = this.map.getZoom();
        this._shift = L.point(0, 0);
        this._scale = 1;

        // Create projection object
        this.projection = {
            latLngToLayerPoint: function (latLng, zoom) {
                zoom = _layer._isDef(zoom) ? zoom : _layer._zoom;
                var projectedPoint = _layer.map.project(L.latLng(latLng), zoom),
                    projectedOrigin = _layer.map.project(_layer._origin, zoom);
                return projectedPoint._subtract(projectedOrigin);
            },
            layerPointToLatLng: function (point, zoom) {
                zoom = _layer._isDef(zoom) ? zoom : _layer._zoom;
                var projectedOrigin = _layer.map.project(_layer._origin, zoom);
                return _layer.map.unproject(point.add(projectedOrigin), zoom);
            },
            unitsPerMeter: 256 * Math.pow(2, _layer._zoom) / 40075017,
            map: _layer.map,
            layer: _layer
        };

        // Compatibility with v.1
        this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint;
        this.projection.getZoom = this.map.getZoom.bind(this.map);
        this.projection.getBounds = this.map.getBounds.bind(this.map);
        this.selection = this._rootGroup;

        if (L.version < "1.0") map.on("viewreset", this._zoomChange, this);

        // Initial draw
        this.draw();
    },

    // Leaf
    getEvents: function(){return {zoomend: this._zoomChange}},

    onRemove: function (map) {
        if (L.version < "1.0"){
            map.off("viewreset", this._zoomChange, this);
            this._rootGroup.remove();
        } else {
            this._svg.remove();
        }
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    }

});

L.D3SvgOverlay.version = "2.1";

// Factory method
L.d3SvgOverlay = function (drawCallback, options) {
    return new L.D3SvgOverlay(drawCallback, options);
};