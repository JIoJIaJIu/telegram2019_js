const _ = require('../../../../utils')
const html = require('./graph.html')
const Grid = require('../../../Grid')
const Graph = require('../../../Graph');

const defaultOptions = {
  width: 500,
  height: 100
}

/**
 * draw()
 * getPoints()
 *
 * options {Object}
 *  @key {Boolean} withGrid
 *  @key {Boolean} scaleY
 *  @key {Boolean} dualY
 *  @key {Array} disabled
 *  @key {Options} isZoomed
 */
function LineGraph(container, data, options) {
  this._container = container;
  this._options = _.extend({}, defaultOptions, options);
  this._canvas = null;
  this._el = null;
  this._ctx = null;
  this._data = {};
  this._grid = options.withGrid ? new Grid(this) : null;
  //TODO:
  this._interfaces = [];

  this._xScale = 1;
  this._yScale = 1;
  this._xTranslate = 0;

  this._Y = null; // y accumulator
  this._drawn = false;
  this._xValueStep = null;

  this.computeData(data, this._options.disabled);
  this.render();
  this.draw();
}

LineGraphProto.prototype = Object.create(Graph.prototype);
LineGraph.prototype = new LineGraphProto();

function LineGraphProto () {
  Graph.call(this);

  this.draw = function (xScale, xTranslate, force) {
    if (force || !this._drawn) {
      this._computeY()
      this._drawn = true;
    }
    if (this.supportInterface('IInteractive')) {
      this.IInteractive_deselect();
    }
    this._xScale = xScale || this._xScale;
    this._xTranslate = xTranslate === undefined ? this._xTranslate : xTranslate;

    this._ctx.clearRect(0, 0, this.width, this.height);

    _.forIn(this._data, (record, id) => {
      if (!record.enabled) return;
      this._drawLine(record);
    })

    if (this._grid) this.drawGrid();
  };

  // move out
  this.drawGrid = function () {
    if (!this._grid) return;

    if (!this._options.dualY) {
      let minXValue = Number.POSITIVE_INFINITY;
      let maxXValue = Number.NEGATIVE_INFINITY;
      let minYValue = Number.POSITIVE_INFINITY;
      let maxYValue = Number.NEGATIVE_INFINITY;

      let c = 0;
      _.forIn(this._data, (line, k) => {
        if (!line.enabled) return;
        c++;
        minXValue = _.min(line.visibleMinXValue, minXValue);
        maxXValue = _.max(line.visibleMaxXValue, minXValue);
        minYValue = _.min(line.visibleMinYValue, minYValue);
        maxYValue = _.max(line.visibleMaxYValue, maxYValue);
      });
      if (!c) return;

      this._grid.draw(minXValue, maxXValue, minYValue, maxYValue);
    } else {
      let minValues = [];
      let maxValues = [];
      let colors = [];
      let c = 0;
      _.forIn(this._data, (line, k) => {
        if (!line.enabled) return;
        c++;
        let min = [];
        min.push(line.visibleMinXValue)
        min.push(line.visibleMinYValue)
        minValues.push(min);

        let max = [];
        max.push(line.visibleMaxXValue);
        max.push(line.visibleMaxYValue);
        maxValues.push(max);

        colors.push(line.color);
      });
      if (!c) return;
      this._grid.drawDualY(minValues, maxValues, colors);
    }
  };

  //TODO: merge with getValues();
  this.getPoints = function (x) {
    let points = [];
    _.forIn(this._data, ({enabled}, k) => {
      if (!enabled) return;

      points.push(this._getPoint(k, x));
    });

    return points;
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

  this._computeY = function () {
    let ids =[];
    _.forIn(this._data, (line, id) => {
      if (!line.enabled) return;
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
        value = _.max(record.y[i], value);
      });
      Y.push(value);
    }
    //TODO:
    let xValueStep = x[1] - x[0];

    this._xValueStep = xValueStep;
    this._Y = Y;
  };

  this._getPoint = function (id, xPoint) {
    let line = this._data[id];
    let x = line.x;
    let y = line.y;

    let xValue = this.interpolateX(xPoint, line.minXValue, line.xRatio);
    let i = this.getClosestIndexByXValue(xValue, line.x);

    return {
      id: id,
      name: line.name,
      x: this.interpolateXValue(x[i], line.minXValue, line.xRatio),
      y: this.interpolateYValue(y[i], line.minYValue, line.yRatio),
      xValue: x[i],
      yValue: y[i],
      color: line.color,
      i: i
    }
  };

  this._drawLine = function (line) {
    let x = line.x;
    let y = line.y;
    let Y = this._Y;

    let minXValue = line.minXValue = x[0];
    let maxXValue = line.maxXValue = _.last(x);
    let xRatio = line.xRatio = this.width / (maxXValue - minXValue);

    if (this._options.dualY) {
      Y = line.y;
    } else if (this._options.scaleY) {
      Y = this._Y;
    }
    if (this._options.scaleY) {
      let minXValue = this.interpolateX(0, line.minXValue, line.xRatio);
      let maxXValue = this.interpolateX(this.width, line.minXValue, line.xRatio);
      let minI = this.getClosestIndexByXValue(minXValue, line.x)
      let maxI = this.getClosestIndexByXValue(maxXValue, line.x)  // TODO: performance
      Y = Y.slice(minI, maxI); // TODO: performance
    }
    let minYValue = line.minYValue = 0;
    let maxYValue = line.maxYValue = _.max(Y);
    let yRatio = line.yRatio = this.height / (maxYValue - minYValue);

    this._ctx.beginPath();
    this._ctx.strokeStyle = line.color;
    this._ctx.lineWidth = this._getLineWidth();
    this._ctx.lineJoin = 'bevel';
    for (i = 0; i < x.length; i++) {
      let x1 = this.interpolateXValue(x[i], minXValue, xRatio);
      let y1 = this.interpolateYValue(y[i], minYValue, yRatio);
      (i == 0) ? this._ctx.moveTo(x1, y1) : this._ctx.lineTo(x1, y1);
    }

    this._ctx.stroke();

    line.visibleMinXValue = this.interpolateX(0, minXValue, xRatio);
    line.visibleMaxXValue = this.interpolateX(this.width, minXValue, xRatio);
    line.visibleMinYValue = this.interpolateY(this.height, minYValue, yRatio);
    line.visibleMaxYValue = this.interpolateY(0, minYValue, yRatio);
  };

  // TODO: find better function
  this._getLineWidth = function () {
    return 1 * _.dpr;
  };

  Object.defineProperty(this, 'xValueStep', { get() { return this._xValueStep; } });
}

module.exports = LineGraph
