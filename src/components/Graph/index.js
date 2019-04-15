const _ = require('../../utils')

function Graph() {
  this._data = null; // required
  this._container = null; // required
  this._el = null; // required;
  this._options = null;
  this._grid = null;

  this._interfaces = [];
}

Graph.prototype = {
  drawGrid: function () {
    if (!this._grid) return;

    let minXValue = Number.POSITIVE_INFINITY;
    let maxXValue = Number.NEGATIVE_INFINITY;
    let minYValue = Number.POSITIVE_INFINITY;
    let maxYValue = Number.NEGATIVE_INFINITY;

    _.forIn(this._data, record => {
      if (!record.enabled) return;
      minXValue = _.min(record.visibleMinXValue, minXValue);
      maxXValue = _.max(record.visibleMaxXValue, maxXValue);
      minYValue = _.min(record.visibleMinYValue, minYValue);
      maxYValue = _.max(record.visibleMaxYValue, maxYValue);
    });

    this._grid.draw(minXValue, maxXValue, minYValue, maxYValue);
  },

  // TODO: move out to data provider
  // TODO: rename
  computeData: function (data, disabled) {
    this._data = {};

    _.forIn(data.types, (v, id) => {
      if (v === 'x') return;

      let enabled = true;
      if (disabled) {
        enabled = disabled.indexOf(id) === -1;
      }
      this._data[id] = {
        id: id,
        enabled: enabled
      };
    })

    let x = data.columns[0].slice(1);

    _.forEach(data.columns, column => {
      if (column[0] === 'x') return;

      let id = column[0]
      let record = this._data[id];
      record.x = x;
      record.y = column.slice(1);
      record.color = data.colors[id];
      record.name = data.names[id];
    });
  },

  enable: function (id) {
    let data = this._data[id];
    if (!data || data.enabled)
      return;

    data.enabled = true;
    this.draw(this._xScale, this._xTranslate, true);
  },

  disable: function (name) {
    let data = this._data[name];
    if (!data || !data.enabled)
      return;

    data.enabled = false;
    this.draw(this._xScale, this._xTranslate, true);
  },

  getAnyEnabledRecord: function () {
    for (let k in this._data) {
      if (this._data[k].enabled) return this._data[k];
    }

    return null;
  },

  getVisibleMinXValue: function () {
    let visibleMinXValue;
    _.forIn(this._data, (record, id) => {
      if (!record.enabled) return;

      visibleMinXValue = record.visibleMinXValue;
    })
    return visibleMinXValue;
  },

  getVisibleMaxXValue: function () {
    let visibleMaxXValue;
    _.forIn(this._data, (record, id) => {
      if (!record.enabled) return;

      visibleMaxXValue = record.visibleMaxXValue;
    })

    return visibleMaxXValue;
  },

  getValues: function (xPoint) {
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
        xValue: x[i],
        yValue: y[i],
        color: record.color,
        i: i
      })
    })
    return values;
  },

  //TODO:
  getMinXValue: function () {
    for (let k in this._data) {
      let record = this._data[k];
      if (!record.enabled) continue;

      return record.minXValue;
    }
  },

  //TODO:
  getMaxXValue: function () {
    for (let k in this._data) {
      let record = this._data[k];
      if (!record.enabled) continue;

      return record.maxXValue;
    }
  },

  interpolateXValue: function (x, minXValue, xRatio) {
    let val = xRatio * (x - minXValue) * this._xScale;
    let p = (this._xTranslate * this.width);

    return _.round(val - p);
  },

  interpolateX: function (x, minXValue, xRatio) {
    let p = (this._xTranslate * this.width);
    x = p + x;

    return minXValue + x / (xRatio * this._xScale);
  },

  interpolateYValue: function (y, empty, yRatio) {
    let y1 = yRatio * y * this._yScale;
    return this.height - y1;
  },

  interpolateY: function (y, minYValue, yRatio) {
    return _.round((this.height - y) / (yRatio * this._yScale));
  },

  getClosestIndexByXValue: function (xValue, x) {
    let s, e;
    for (let i = 0, length = x.length; i < length; i++) {
      e = i;
      s = i == 0 ? 0 : i - 1;
      if (x[i] > xValue) {
        break;
      }
    }
    let i = (x[e] - xValue) > (xValue - x[s]) ? s : e;
    return i;
  },

  //TODO:
  get state() {
    return {
      xTranslate: this._xTranslate,
      xScale: this._xScale,
      isZoomed: this._options.isZoomed
    }
  },

  get container() {
    return this._container;
  },

  get marginTop() {
    let marginTop = parseFloat(getComputedStyle(this._el).marginTop);
    delete this.marginTop;
    Object.defineProperty(this, 'marginTop', { get() { return marginTop; } });
    return marginTop;
  },

  get marginLeft() {
    let marginLeft = parseFloat(getComputedStyle(this._el).marginLeft);
    delete this.marginLeft;
    Object.defineProperty(this, 'marginLeft', { get() { return marginLeft; } });
    return marginLeft;
  },

  get marginBottom() {
    let marginBottom = parseFloat(getComputedStyle(this._el).marginBottom);
    delete this.marginBottom;
    Object.defineProperty(this, 'marginBottom', { get() { return marginBottom; } });
    return marginBottom;
  },

  // static
  get height() {
    let height = _.getHeight(this._ctx.canvas)
    delete this.height;
    Object.defineProperty(this, 'height', { get() { return height; } });
    return height;
  },

  // static
  get width() {
    let width = _.getWidth(this._ctx.canvas)
    delete this.width;
    Object.defineProperty(this, 'width', { get() { return width; } });
    return width;
  },

  get disabled() {
    let d = [];
    _.forIn(this._data, (record, id) => {
      if (record.enabled) return;
      d.push(id);
    });

    return d;
  },

  // TODO: move out
  addInterface: function (i) {
    (!this.supportInterface(i))
      this._interfaces.push(i);
  },

  supportInterface: function (i)  {
    return this._interfaces.indexOf(i) !== -1;
  }
}

module.exports = Graph;
