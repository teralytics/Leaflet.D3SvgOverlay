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
L.D3SvgOverlay = L.Class.extend({
    includes: L.Mixin.Events,

    _isDef: function(a){ return typeof a != "undefined" },

    options: function (options) {
        if (!this._isDef(options)) {
            return this._options;
        }
        options.zoomAnimate = !this._isDef(options.zoomAnimate) ? true : options.zoomAnimate;
        options.zoomHide = !this._isDef(options.zoomHide) ? !options.zoomAnimate : options.zoomHide;
        options.zoomDraw = !this._isDef(options.zoomDraw) ? true : options.zoomDraw;
        options.jsAnimation = options.jsAnimation || false;

        return this._options = options;
    },

    draw: function () {
        this._drawCallback(this.selection, this.projection, this.map.getZoom());
    },

    initialize: function (drawCallback, options) { // (Function(selection, projection)), (Object)options
        this.options(options || {});
        this._drawCallback = drawCallback;
    },

    // Viewport-like behaviour for SVG element
    updSvg: function () {
        var pixelSize = this.map.getSize();
        var pixelBounds = this.map.getPixelBounds();
        var pixelOrigin = this.map.getPixelOrigin();
        this._svg
            .attr("width", pixelSize.x * 3)
            .attr("height", pixelSize.y * 3)
            .attr("viewBox", [0, 0, pixelSize.x * 3, pixelSize.y * 3].join(" "))
            .style("left", (pixelBounds.min.x - pixelOrigin.x - pixelSize.x) + "px")
            .style("top", (pixelBounds.min.y - pixelOrigin.y - pixelSize.y) + "px");
        this._svg.select("g.origin")
            .attr("transform", ["translate(", pixelSize.x - (pixelBounds.min.x - pixelOrigin.x), ",", pixelSize.y - (pixelBounds.min.y - pixelOrigin.y), ")"].join(""));
    },

    // "zoomanim"/"viewreset" event handler: calculate shift/scale values
    _zoomCalc: function (evt) {
        // Compute and store coordinates to animate to
        var newZoom = this._isDef(evt.zoom) ? evt.zoom : this.map._zoom; // "viewreset" event in Leaflet has not zoom/center parameters like zoomanim
        this._zoomDiff = newZoom - this._zoom;
        this._scale = Math.pow(2, this._zoomDiff);
        this._shift = this.map._latLngToNewLayerPoint(this._origin, newZoom, (evt.center || this.map._initialCenter ));
    },

    // "zoomstart" event handler: stop running animation
    _zoomStart: function () {
        !this.translateAnim || this.translateAnim.remove();
        !this.scaleAnim || this.scaleAnim.remove();
    },

    // "zoomanim" event handler: perform animation
    _zoomAnimate: function (evt) {
        if (L.Browser.ie || this._options.jsAnimation) {
            // For IE use JS-based animation
            this._gTranslate
                .transition()
                .duration(250)
                .attr("transform", "translate(" + this._shift.x + "," + this._shift.y + ")")
                .ease(d3.ease("cubic-out"));
            this._gScale
                .transition()
                .duration(250)
                .attr("transform", "scale(" + this._scale + ")")
                .ease(d3.ease("cubic-out"));
        }
        else {
            // For compatible browsers use SMIL-animations
            this.translateAnim = this._svg.append("animateTransform")
                .attr("xlink:href", this._gTranslateXRef)
                .attr("attributeName", "transform")
                .attr("attributeType", "XML")
                .attr("type", "translate")
                .attr("to", this._shift.x + "," + this._shift.y)
                .attr("dur", "0.25s")
                .attr("calcMode", "spline")
                .attr("keyTimes", "0; 1")
                .attr("keySplines", "0 0 0.25 1")
                .attr("begin", "indefinite")
                .attr("fill", "freeze");
            this.scaleAnim = this._svg.append("animateTransform")
                .attr("xlink:href", this._gScaleXRef)
                .attr("attributeName", "transform")
                .attr("attributeType", "XML")
                .attr("type", "scale")
                .attr("to", this._scale + "," + this._scale)
                .attr("dur", "0.25s")
                .attr("calcMode", "spline")
                .attr("keyTimes", "0; 1")
                .attr("keySplines", "0 0 0.25 1")
                .attr("begin", "indefinite")
                .attr("fill", "freeze");
            this.translateAnim.node().beginElement();
            this.scaleAnim.node().beginElement();
        }
    },

    // "zoomend" event handler: cleanup after animation
    _zoomEnd: function () {
        this._gTranslate.attr("transform", "translate(" + this._shift.x + "," + this._shift.y + ")");
        this._gScale.attr("transform", "scale(" + this._scale + "," + this._scale + ")");
        !this.translateAnim || this.translateAnim.remove();
        !this.scaleAnim || this.scaleAnim.remove();
        if (this._options.zoomDraw) {
            this.draw();
        }
    },

    // Handler for "viewreset"-like events, used for non-animated zoom
    _zoomChange: function () {
        this._gTranslate.attr("transform", "translate(" + this._shift.x + "," + this._shift.y + ")");
        this._gScale.attr("transform", "scale(" + this._scale + "," + this._scale + ")");
        if (this._options.zoomDraw) {
            this.draw();
        }
    },

    onAdd: function (map) {
        this.map = map;
        this._zoomAnimated = this._options.zoomAnimate && map._zoomAnimated;
        var _layer = this;

        // SVG element, defaults to 3x3 screen size
        this._svg = d3.select(map._panes.overlayPane)
            .append("svg")
            .classed({
                "d3-overlay": true,
                "leaflet-zoom-hide": this._options.zoomHide
            });

        // Origin <g> element to be shifted to align with Leaflet (0,0) pixel coordinates
        this._gOrigin = this._svg
            .append("g")
            .classed("origin", true);

        // Making svg element endless
        this.map.on("moveend", this.updSvg, this);

        // Init shift/scale invariance helper values
        this._origin = this.map.layerPointToLatLng([0, 0]);
        this._zoom = this.map.getZoom();
        this._shift = L.point(0, 0);
        this._scale = 1;

        // Create projection object
        _this = this;
        this.projection = {
            latLngToLayerPoint: function (latLng, zoom) {
                zoom = _this._isDef(zoom) ? zoom : _layer._zoom;
                var projectedPoint = _layer.map.project(L.latLng(latLng), zoom),
                    projectedOrigin = _layer.map.project(_layer._origin, zoom);
                return projectedPoint._subtract(projectedOrigin);
            },
            layerPointToLatLng: function (point, zoom) {
                zoom = _this._isDef(zoom) ? zoom : _layer._zoom;
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

        // Two <g> elements, one for scale and one for translation
        var uniqueId = "id" + Math.random().toString(26).slice(2, 7);
        this._gTranslateXRef = "#" + uniqueId;
        this._gTranslate = this._gOrigin
            .append("g")
            .classed("translate-anim", true)
            .attr("transform", "translate(0,0)")
            .attr("id", uniqueId);
        uniqueId = "id" + Math.random().toString(26).slice(2, 7);
        this._gScaleXRef = "#" + uniqueId;
        this.selection = this._gScale = this._gTranslate
            .append("g")
            .classed("scale-anim", true)
            .attr("transform", "scale(1,1)")
            .attr("id", uniqueId);

        // Zoom adjustments and animation
        if (this._zoomAnimated) {
            this.map.on("zoomanim", this._zoomCalc, this);
            this.map.on("zoomstart", this._zoomStart, this);
            this.map.on("zoomanim", this._zoomAnimate, this);
            this.map.on("zoomend", this._zoomEnd, this);
        }
        else {
            this.map.on("viewreset", this._zoomCalc, this);
            this.map.on("viewreset", this._zoomChange, this);
        }

        // Initial draw
        this.updSvg();
        this.draw();
    },

    onRemove: function (map) {
        this._svg.remove();
        this.map.off(this._options.updateOn, this.draw, this);
        this.map.off("moveend", this.updSvg, this);
        if (this._zoomAnimated) {
            this.map.off("zoomanim", this._zoomCalc, this);
            this.map.off("zoomstart", this._zoomStart, this);
            this.map.off("zoomanim", this._zoomAnimate, this);
            this.map.off("zoomend", this._zoomEnd, this);
        }
        else {
            this.map.off("viewreset", this._zoomCalc, this);
            this.map.off("viewreset", this._zoomChange, this);
        }
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    }

});

L.D3SvgOverlay.version = "2.0";

// Factory method
L.d3SvgOverlay = function (drawCallback, options) {
    return new L.D3SvgOverlay(drawCallback, options);
};