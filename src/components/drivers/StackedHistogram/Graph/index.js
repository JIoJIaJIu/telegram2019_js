const _ = require('../../../../utils')
const html = require('./graph.html')

const Graph = require('../../../Graph')
const HistogramGraph = require('../../Histogram/Graph')
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
function StackedHistogramGraph(container, data, options) {
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

  this._Y = null; // y accumulator
  this._stack = [];
  this._drawn = false;

  this.computeData(data, this._options.disabled);
  this.render();
  this.draw();
}

StackedHistogramProto.prototype = Object.create(HistogramGraph.prototype);
StackedHistogramGraph.prototype = new StackedHistogramProto();

function StackedHistogramProto() {
  Graph.call(this);

  this.draw = function (xScale, xTranslate, force, highlightX) {
    if (force || !this._drawn) {
      this._computeY()
      this._drawn = true;
    }
    this._xScale = xScale || this._xScale;
    this._xTranslate = xTranslate === undefined ? this._xTranslate : xTranslate;

    this._ctx.clearRect(0, 0, this.width, this.height);
    this._stack = [];

    _.forIn(this._data, (bar, id) => {
      if (!bar.enabled) return;
      this._drawBar(bar, highlightX);
    })

    // TODO:
    if (this._grid) this.drawGrid();
  };

  this.select = function (x) {
    this.draw(this._xScale, this._xTranslate, false, x);
  };

  this.deselect = function () {
    this.draw(this._xScale, this._xTranslate);
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

  this._drawBar = function (bar, highlightX) {
    let x = bar.x;
    let y = bar.y;
    let Y = this._Y;

    let minXValue = bar.minXValue = x[0];
    let maxXValue = bar.maxXValue = _.last(x);
    let xRatio = bar.xRatio = this.width / (maxXValue - minXValue);

    if (this._options.scaleY) {
      let minXValue = this.interpolateX(0, bar.minXValue, bar.xRatio);
      let maxXValue = this.interpolateX(this.width, bar.minXValue, bar.xRatio);
      let minI = this.getClosestIndexByXValue(minXValue, bar.x)
      let maxI = this.getClosestIndexByXValue(maxXValue, bar.x)
      Y = Y.slice(minI, maxI);
    }
    let minYValue = bar.minYValue = 0;
    let maxYValue = bar.maxYValue = _.max(Y);

    let yRatio = bar.yRatio = this.height / (maxYValue - minYValue);

    let xStep = (this.width / x.length) * this._xScale;
    this._ctx.fillStyle = bar.color;
    if (highlightX) {
      this._ctx.globalAlpha = 0.5;
      let highlightXValue = this.interpolateX(highlightX, bar.minXValue, bar.xRatio);
      let j = this.getClosestIndexByXValue(highlightXValue, bar.x);
      for (let i = 0, length = x.length; i < length; i++) {
        let stackHeight = getStackHeight.call(this, i);
        let height = this.interpolateYValue(stackHeight, null, yRatio);
        let x1 = this.interpolateXValue(x[i], minXValue, xRatio);
        let y1 = this.interpolateYValue(stackHeight + y[i], null, yRatio);
        let x2 = i < length - 1 ? this.interpolateXValue(x[i + 1], minXValue, xRatio) : xStep + x1;
        this._ctx.globalAlpha = (i === j) ? 1 : 0.5;

        this._ctx.fillRect(x1, y1, x2 - x1, height - y1);
      }
    } else {
      this._ctx.globalAlpha = 1;
      for (let i = 0, length = x.length; i < length; i++) {
        let stackHeight = getStackHeight.call(this, i);
        let height = this.interpolateYValue(stackHeight, null, yRatio);
        let x1 = this.interpolateXValue(x[i], minXValue, xRatio);
        let y1 = this.interpolateYValue(stackHeight + y[i], null, yRatio);
        let x2 = i < length - 1 ? this.interpolateXValue(x[i + 1], minXValue, xRatio) : xStep + x1;

        this._ctx.fillRect(x1, y1, x2 - x1, height - y1);
      }
    }

    this._stack.push(bar.id);
    bar.visibleMinXValue = this.interpolateX(0, minXValue, xRatio);
    bar.visibleMaxXValue = this.interpolateX(this.width, minXValue, xRatio);
    bar.visibleMinYValue = this.interpolateY(this.height, minYValue, yRatio);
    bar.visibleMaxYValue = this.interpolateY(0, minYValue, yRatio);

    function getStackHeight(i) {
      let value = 0;
      _.forEach(this._stack, id => {
          value += this._data[id].y[i];
      });

      return value;
    }
  };

  this._computeY = function () {
    let ids =[];
    _.forIn(this._data, (record, id) => {
      if (!record.enabled) return;
      ids.push(id);
    });

    if (ids.length === 0) {
      this._Y = [];
      return;
    }

    let Y = [];
    let x = this._data[ids[0]].x;
    for (let i = 0, l = x.length; i < l; i++) {
      let value = 0;
      _.forEach(ids, id => {
        let record = this._data[id];
        value += record.y[i];
      });
      Y.push(value);
    }

    this._Y = Y;
  };
}


module.exports = StackedHistogramGraph;
