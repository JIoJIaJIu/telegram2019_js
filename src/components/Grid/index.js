const _ = require('../../utils');
const html = require('./index.html');
const moment = require('../../moment');
require('./styles.scss');


const defaultOptions = {
  xStep: 100 * _.dpr,
  yStep: 60 * _.dpr,
  minXStep: 50 * _.dpr,
  maxXStep: 130 * _.dpr
}

function Grid(graph, options) {
  this._graph = graph;
  this._container = graph.container;
  this._svg = null;
  this._options = _.extend({}, defaultOptions, options);
  this._drawn = false;
  this._xStep = this._options.xStep;

  this._xAxisNode = null;
  this._yAxisNode = null;

  this.render();
}

Grid.prototype = {
  draw: function (minXValue, maxXValue, minYValue, maxYValue) {
    if (!this._drawn) {
      this._drawXAxis(minXValue, maxXValue);
      this._drawYAxis(minYValue, maxYValue);
      this._drawn = true;
    } else {
      this._redrawXAxis(minXValue, maxXValue);
      this._drawYAxis(minYValue, maxYValue);
    }
  },

  drawDualY: function (minValues, maxValues, colors) {
    if (minValues.length > 2 || maxValues.length > 2)
      throw new Error("Not supported");

    if (!this._drawn) {
      this._drawXAxis(minValues[0][0], maxValues[0][0]);
      this._drawn = true;
    } else {
      this._redrawXAxis(minValues[0][0], maxValues[0][0]);
    }

    this._drawYAxis(minValues[0][1], maxValues[0][1], colors[0], false);
    minValues.length == 2 && this._drawYTitles(minValues[1][1], maxValues[1][1], colors[1], true);
  },

  render: function() {
    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = doc.firstChild;
    this._container.appendChild(el);
    this._svg = el.querySelector('svg');
  },

  _clearRect: function () {
    while (this._svg.childNodes.length) {
      this._svg.removeChild(this._svg.firstChild);
    }
  },

  _drawXAxis: function (minXValue, maxXValue) {
    let self = this;
    let g = document.createElementNS(_.SVG_NS, 'g')
    let l = document.createElementNS(_.SVG_NS, 'line');
    g.appendChild(l);
    this._svg.appendChild(g);

    let graph = this._graph;
    let x1 = graph.marginLeft;
    let x2 = x1 + graph.width;
    let y = graph.marginTop + graph.height;
    l.setAttribute('x1', x1);
    l.setAttribute('y1', y);
    l.setAttribute('x2', x2);
    l.setAttribute('y2', y);

    this._xAxisNode = document.createElementNS(_.SVG_NS, 'g');
    g.appendChild(this._xAxisNode);

    let steps = graph.width / this._xStep;
    this._xValueStep = (maxXValue - minXValue) / steps;
    this._drawXTitles(minXValue, maxXValue);
  },

  _redrawXAxis: function (minXValue, maxXValue) {
    let steps = (maxXValue - minXValue) / this._xValueStep;
    this._xStep = this._graph.width / steps;
    this._clearNode(this._xAxisNode);

    if ((this._xStep < this._options.minXStep) ||
        (this._xStep > this._options.maxXStep)) {

      this._xStep = this._options.xStep;
      steps = this._graph.width / this._xStep;
      this._xValueStep = (maxXValue - minXValue) / steps;
    }

    this._drawXTitles(minXValue, maxXValue);
  },

  _drawXTitles: function (minXValue, maxXValue) {
    let graph = this._graph;
    let x1 = graph.marginLeft;
    let y = graph.marginTop + graph.height;
    let self = this;
    let steps = graph.width / this._xStep;

    //TODO: hardcode for timestamp
    //min step
    {
      const H_HOUR = 1000 *  60 * 60;
      const M20 = 1000 * 60 * 20;
      const M5 = 1000 * 60 * 5;
      if (this._xValueStep < M5 * 4) {
        this._xValueStep = M5;
        steps = (maxXValue - minXValue) / this._xValueStep;
        this._xStep = this._graph.width / steps;
     } else if (this._xValueStep < M20 * 3) {
        this._xValueStep = M20;
        steps = (maxXValue - minXValue) / this._xValueStep;
        this._xStep = this._graph.width / steps;
      } else if (this._xValueStep < H_HOUR * 2) {
        this._xValueStep = H_HOUR;
        steps = (maxXValue - minXValue) / this._xValueStep;
        this._xStep = this._graph.width / steps;
      }
    }

    let xConvertor = this._getXConvertor('timestamp', minXValue, minXValue + this._xValueStep);
    for (let i = 0; i <= steps; i++) {
      let xValue = i === 0 ? minXValue : minXValue + this._xValueStep * i;
      drawTitle(x1 + i * this._xStep, y + graph.marginBottom / 2, xValue, i === steps);
    }

    function drawTitle(x, y, xValue, isLast) {
      let text = document.createElementNS(_.SVG_NS, 'text');
      self._xAxisNode.appendChild(text);
      text.setAttribute('x', x)
      text.setAttribute('y', y)
      text.innerHTML = xConvertor(xValue);
      isLast ? text.setAttribute('text-anchor', 'end') : null;
    }
  },

  _drawYAxis: function (minYValue, maxYValue, color, right) {
    if (!this._yAxisNode) {
      this._yAxisNode = document.createElementNS(_.SVG_NS, 'g')
      this._svg.appendChild(this._yAxisNode);
    } else {
      this._clearNode(this._yAxisNode);
    }

    let self = this;
    let graph = this._graph;
    let steps = graph.height / this._options.yStep;
    let yValueStep = (maxYValue - minYValue) / steps;

    for (i = 0; i <= steps; i++) {
      let yValue = i * yValueStep;
      drawLine(graph.height - i * this._options.yStep, yValue, i === 0);
    }

    this._drawYTitles(minYValue, maxYValue, color, right);

    function drawLine(height, yValue, isFirst) {
      let x1 = graph.marginLeft;
      let x2 = x1 + graph.width;
      let y = graph.marginTop + height;
      if (!isFirst) {
        let l = document.createElementNS(_.SVG_NS, 'line');
        self._yAxisNode.appendChild(l);
        l.setAttribute('x1', x1);
        l.setAttribute('y1', y);
        l.setAttribute('x2', x2);
        l.setAttribute('y2', y);
      }
    }
  },

  _drawYTitles(minYValue, maxYValue, color, right) {
    let self = this;
    let graph = this._graph;
    let steps = graph.height / this._options.yStep;
    let yValueStep = (maxYValue - minYValue) / steps;
    let yConvertor = this._getYConvertor('number');

    let x1 = right ? graph.width + graph.marginLeft : graph.marginLeft;
    for (i = 0; i <= steps; i++) {
      let yValue = i * yValueStep;
      let y = graph.height - i * this._options.yStep + graph.marginTop;
      drawTitle(this._yAxisNode, x1, y, yValue);
    }

    function drawTitle(node, x, y, yValue) {
      let text = document.createElementNS(_.SVG_NS, 'text');
      node.appendChild(text);
      text.setAttribute('x', x)
      text.setAttribute('y', y - 5) // TODO: 5?
      color && text.setAttribute('fill', color)
      right && text.setAttribute('text-anchor', 'end');
      text.innerHTML = yConvertor(yValue);
    }
  },

  _getYConvertor: function (type) {
    if (type !== 'number')
      throw new Error(`The type ${type} is not supported`);

    let M = Math.pow(10, 6);
    let K = Math.pow(10, 3);
    return function (yValue) {
      if (yValue > M) {
        return `${_.round(yValue / M)}M`
      } else if (yValue > K * 10) {
        return `${_.round(yValue / K)}K`
      } else {
        return _.round(yValue);
      }
    }
  },


  _getXConvertor: function (type, firstXValue, secondXValue) {
    if (type !== 'timestamp')
      throw new Error(`The type ${type} is not supported`);

    const DAY = 1000 * 60 * 60 * 24;
    const Q_DAY = 1000 * 60 * 60 * 24 / 4;
    //TODO
    const H_HOUR = 1000 *  60 * 60;
    let diff = secondXValue - firstXValue;

    if (diff > DAY) {
      return function (value) {
        let d = new Date(value);
        return `${d.getDate()} ${moment.getMon(d)}`;
      }
    } else if (diff > Q_DAY && diff < H_HOUR * 2) {
      return function (value) {
        let d = new Date(value);
        return `${moment.getRoundHours(d)} ${d.getDate()} ${moment.getMon(d)}`;
      }
    } else if (diff < H_HOUR * 2) {
      //TODO
      return function (value) {
        let d = new Date(value);
        return `${moment.getRoundHoursWithMinutes(d)}`;
      }
    } else {
      return function (value) {
        let d = new Date(value);
        return moment.getRoundHours(d);
      }
    }
  },

  _clearNode: function (node) {
    while (node.childNodes.length) {
      node.removeChild(node.firstChild);
    }
  }
}

module.exports = Grid
