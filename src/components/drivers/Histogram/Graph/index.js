const _ = require('../../../../utils')
const html = require('./graph.html')
require('./styles.scss');

const Graph = require('../../../Graph');
const Grid = require('../../../Grid')


const defaultOptions = {
  width: 500,
  height: 100
}

/**
 *
 * options {Object}
 *  @key {Boolean} withGrid
 *  @key {Boolean} scaleY
 *  @key {Boolean} disabled
 */
function HistogramGraph(container, data, options) {
  this._container = container;
  this._options = _.extend({}, defaultOptions, options);
  this._canvas = null;
  this._el = null;
  this._ctx = null;
  this._data = null;
  this._grid = options.withGrid ? new Grid(this) : null;
  //TODO:
  this._interfaces = [];

  this._xScale = 1;
  this._yScale = 1;
  this._xTranslate = 0;

  this._stack = [];

  this.computeData(data, this._options.disabled);
  this.render();
  this.draw();
}

HistogramGraphProto.prototype = Object.create(Graph.prototype);
HistogramGraph.prototype = new HistogramGraphProto();

function HistogramGraphProto () {
  Graph.call(this);

  this.draw = function (xScale, xTranslate, highlightX) {
    this._xScale = xScale || this._xScale;
    this._xTranslate = xTranslate === undefined ? this._xTranslate : xTranslate;

    this._ctx.clearRect(0, 0, this.width, this.height);
    this._stack = [];

    _.forIn(this._data, (bar, id) => {
      if (!bar.enabled) return;
      this._drawBar(bar.x, bar.y, bar, highlightX)
    })

    // TODO:
    if (this._grid) this.drawGrid();
  };

  this.render = function () {
    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = this._el = doc.firstChild;
    this._container.appendChild(el);

    this._canvas = el.querySelector('canvas');
    this._canvas.setAttribute('width', this._options.width);
    this._canvas.setAttribute('height', this._options.height);
    this._ctx = this._canvas.getContext('2d');
  };

  this.select = function (x) {
    this.draw(this._xScale, this._xTranslate, x);
  };

  this.deselect = function () {
    this.draw(this._xScale, this._xTranslate);
  };

  this._drawBar = function (x, y, bar, highlightX) {
    let minXValue = bar.minXValue = x[0];
    let maxXValue = bar.maxXValue = _.last(x);
    let xRatio = bar.xRatio = this.width / (maxXValue - minXValue);

    let minYValue = bar.minYValue = 0;
    let Y = y;
    if (this._options.scaleY) {
      let minXValue = this.interpolateX(0, bar.minXValue, bar.xRatio);
      let maxXValue = this.interpolateX(this.width, bar.minXValue, bar.xRatio);
      let minI = this.getClosestIndexByXValue(minXValue, bar.x)
      let maxI = this.getClosestIndexByXValue(maxXValue, bar.x)
      Y = Y.slice(minI, maxI);
    }
    let maxYValue = bar.maxYValue = _.max(Y);
    let yRatio = bar.yRatio = this.height / (maxYValue - minYValue);

    let xStep = (this.width / x.length) * this._xScale;
    this._ctx.fillStyle = bar.color;

    if (highlightX) {
      //this._ctx.globalAlpha = 0.5;
      let highlightXValue = this.interpolateX(highlightX, bar.minXValue, bar.xRatio);
      let j = this.getClosestIndexByXValue(highlightXValue, bar.x);
      let x1 = this.interpolateXValue(x[0], minXValue, xRatio);
      let y1;
      for (i = 0; i < x.length - 1; i++) {
        y1 = this.interpolateYValue(y[i], null, yRatio);
        let x2 = this.interpolateXValue(x[i + 1], minXValue, xRatio)
        this._ctx.globalAlpha = (i === j) ? 1 : 0.5;

        this._ctx.fillRect(x1, y1, x2 - x1, this.height - y1);
        x1 = x2;
      }
      this._ctx.globalAlpha = (i === j) ? 1 : 0.5;
      this._ctx.fillRect(x1, y1, x1, this.height - y1);
    } else {
      this._ctx.globalAlpha = 1;
      let x1 = this.interpolateXValue(x[0], minXValue, xRatio);
      let y1;
      for (i = 0; i < x.length - 1; i++) {
        y1 = this.interpolateYValue(y[i], null, yRatio);
        let x2 = this.interpolateXValue(x[i + 1], minXValue, xRatio)

        this._ctx.fillRect(x1, y1, x2 - x1, this.height - y1);
        x1 = x2;
      }
      this._ctx.fillRect(x1, y1, xStep, this.height - y1);
    }

    bar.visibleMinXValue = this.interpolateX(0, minXValue, xRatio);
    bar.visibleMaxXValue = this.interpolateX(this.width, minXValue, xRatio);
    bar.visibleMinYValue = this.interpolateY(this.height, minYValue, yRatio);
    bar.visibleMaxYValue = this.interpolateY(0, minYValue, yRatio);
  };

  this.getClosestIndexByXValue = function (xValue, x) {
    let i = 1;
    for (let length = x.length; i < length; i++) {
      if (x[i] > xValue) {
        return i - 1;
      }
    }
    return i - 1;
  }
}

module.exports = HistogramGraph;
