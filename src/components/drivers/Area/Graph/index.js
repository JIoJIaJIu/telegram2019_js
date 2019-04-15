const _ = require('../../../../utils')

const Graph = require('../../../Graph')
const Grid = require('../../../Grid')

const html = require('./graph.html')

const defaultOptions = {
  width: 500,
  height: 100
}

/**
 *
 * options {Object}
 *  @key {Boolean} withGrid
 *  @key {Boolean} scaleY
 */
function AreaGraph(container, data, options) {
  this._container = container;
  this._options = _.extend({}, defaultOptions, options);
  this._canvas = null;
  this._ctx = null;
  this._data = null;
  this._rawData = data;
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

AreaGraphProto.prototype = Object.create(Graph.prototype);
AreaGraph.prototype = new AreaGraphProto();

function AreaGraphProto () {
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
    this._stack = [];

    let areas = []
    _.forIn(this._data, (area, id) => {
      if (!area.enabled) return;
      areas.push(area);
    });

    if (areas.length < 2) // TODO: alert
      return;

    _.forEach(areas, (area, i) => {
      let isLast = areas.length - 1 === i;
      this._drawArea(area, isLast);
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

  this.getRawData = function (i) {
    if (i == undefined) return this._rawData;

    // generate slice
    let s = i - 3;
    let e = i + 3
    let column = this._rawData.columns;
    let x = column[0];

    if (s < 0) {
      let diff = s * -1;
      s += diff;
      e += diff;
    }

    if (e >= x.length - 1) {
      let diff = e - x.length - 1
      s += diff;
      e += diff;
    }

    let data = {
      columns: [],
      colors: {},
      names: {},
      types: {}
    }

    x = x.slice(s, e)
    x.unshift('x');
    data.columns.push(x);
    data.types['x'] = 'x';

    _.forEach(this._rawData.columns, (c) => {
      let id = c[0];
      if (id === 'x') return;
      let y = c.slice(s, e);
      y.unshift(id);

      data.columns.push(y);
      data.types[id] = this._rawData.types[id];
      data.names[id] = this._rawData.names[id];
      data.colors[id] = this._rawData.colors[id];
    })

    return data;
  };

  this._drawArea = function (area, isLast) {
    let x = area.x;
    let y = area.y;
    let accY = this._Y;

    let minXValue = area.minXValue = _.min(x);
    let maxXValue = area.maxXValue = _.max(x);
    let minYValue = area.minYValue = 0;
    let maxYValue = area.maxYValue = 1;

    let xRatio = area.xRatio = this.width / (maxXValue - minXValue);
    let yRatio = area.yRatio = this.height / (maxYValue - minYValue);

    this._ctx.beginPath();
    this._ctx.fillStyle = area.color;
    this._ctx.strokeStyle = area.color;
    this._ctx.lineJoin = 'bevel';
    this._ctx.globalCompositeOperation = 'destination-over';

    for (i = 0; i < x.length; i++) {
        let stackHeight = getStackHeight.call(this, i);
        let yValue = isLast ? stackHeight : y[i] + stackHeight;
        let x1 = this.interpolateXValue(x[i], minXValue, xRatio);
        let y1 = this.interpolateYValue(yValue / accY[i], null, yRatio);
        if (i === 0) {
          this._ctx.moveTo(x1, isLast ? 0 : this.height);
        }
        this._ctx.lineTo(x1, y1);
        if (i === (x.length - 1)) {
          this._ctx.lineTo(x1,  isLast ? 0 : this.height);
        }
    }
    this._ctx.stroke();
    this._ctx.fill();
    this._stack.push(area.id);

    area.visibleMinXValue = this.interpolateX(0, minXValue, xRatio);
    area.visibleMaxXValue = this.interpolateX(this.width, minXValue, xRatio);
    area.visibleMinYValue = 0;
    area.visibleMaxYValue = 100;

    function getStackHeight(i) {
      let value = 0;
      _.forEach(this._stack, id => {
          value += this._data[id].y[i];
      });

      return value;
    }
  };

  //TODO: merge
  // requires x
  this.getValues = function (xPoint) {
    let record;
    for (let k in this._data) {
      record = this._data[k];
      if (record.enabled) break;
    }
    let xValue = this.interpolateX(xPoint, record.minXValue, record.xRatio);
    let i = this.getClosestIndexByXValue(xValue, record.x);

    let values = [];
    _.forIn(this._data, (record, id) => {
      if (!record.enabled) return;

      let x = record.x;
      let y = record.y;
      values.push({
        id: record.id,
        name: record.name,
        x: this.interpolateXValue(x[i], record.minXValue, record.xRatio),
        xValue: x[i],
        yValue: y[i],
        color: record.color,
        i: i
      })
    })
    return values;
  };


  // TODO: move to utils
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

module.exports = AreaGraph;
