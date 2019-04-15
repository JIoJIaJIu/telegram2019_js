const _ = require('../../../../utils')
const Graph = require('../../../Graph')

const html = require('./graph.html')

const defaultOptions = {
  width: 500,
  height: 100
}

/**
 *
 * options {Object}
 *  @key {Boolean} disabled
 */
function PieGraph (container, data, options) {
  this._container = container;
  this._options = _.extend({}, defaultOptions, options);
  this._svg = null;
  this._data = null;

  //TODO:
  this._interfaces = [];
  this._Y = null;

  this.render();
  this.computeData(data, this._options.disabled);
  this.draw();
}

PieGraphProto.prototype = Object.create(Graph.prototype);
PieGraph.prototype = new PieGraphProto();

function PieGraphProto () {
  Graph.call(this);

  // TODO: support render single circle
  this.draw = function (xScale, xTranslate) {
    this._xScale = xScale || this._xScale;
    this._xTranslate = xTranslate === undefined ? this._xTranslate : xTranslate;

    if (this.supportInterface('IInteractive')) {
      this.IInteractive_deselect();
    }
    this._clearRect();

    let record = this.getAnyEnabledRecord();
    if (!record) return;

    let x = record.x;
    let minXValue = x[0];
    let maxXValue = _.last(x);

    let xRatio = this.width / (maxXValue - minXValue);
    minXValue = this.interpolateX(0, minXValue, xRatio);
    // TODO:
    maxXValue = interpolateX.call(this, this.width, minXValue, xRatio);
    function interpolateX (x, minXValue, xRatio) {
      return minXValue + x / (xRatio * this._xScale);
    }

    let minI = 0;
    for (let i = 0; i < x.length; i++) {
      if (x[i] >= minXValue) {
        minI = i;
        break;
      }
    }

    let maxI = x.length - 1;
    for (let i = minI; i < x.length; i++) {
      if (x[i] >= maxXValue) {
        maxI = i - 1;
        break;
      }
    }
    if (maxI < 0) maxI = 0;

    this._computeY(minI, maxI);
    this._minI = minI;
    this._maxI = maxI;

    this._amount = {};
    let rotate = 0;
    _.forIn(this._data, pie => {
      if (!pie.enabled) return;

      let id = pie.id;
      let angle = this._drawPie(pie, minI, maxI, this._Y, { rotate: rotate });
      rotate += angle;
    })

    // TODO: hack
    if (this.interactive) this.interactive.bindHover();
  };

  this.getVisibleMinXValue = function () {
    let record = this.getAnyEnabledRecord();
    if (!record) return 0;

    return record.x[this._minI];
  };

  this.getMinXValue = function () {
    let record = this.getAnyEnabledRecord();
    if (!record) return 0;

    return record.x[this._minI];
  },

  this.getMaxXValue = function () {
    let record = this.getAnyEnabledRecord();
    if (!record) return 0;

    return record.x[this._maxI];
  },

  this.getVisibleMaxXValue = function () {
    let record = this.getAnyEnabledRecord();
    if (!record) return 0;

    return record.x[this._maxI];
  };

  this.render = function () {
    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = this._el = doc.firstChild;
    this._container.appendChild(el);

    this._svg = el.querySelector('svg');
    this._svg.setAttribute('width', this._options.width);
    this._svg.setAttribute('height', this._options.height);
  }

  Object.defineProperty(this, 'radius', {
    get() { return this.height / 2; }
  });
  Object.defineProperty(this, 'width', {
    get() {
      let width = _.width(this._svg)
      delete this.width;
      Object.defineProperty(this, 'width', { get() { return width; } });
      return width;
    }
  });

  Object.defineProperty(this, 'height', {
    get() {
      let height = _.height(this._svg)
      delete this.height;
      Object.defineProperty(this, 'height', { get() { return height; } });
      return height;
    }
  });

  Object.defineProperty(this, 'svg', {
    get() { return this._svg; }
  });

  // https://danielpataki.com/svg-pie-chart-javascript/
  this._drawPie = function (pie, minI, maxI, total, options) {
    let x = pie.x;
    let y = pie.y;

    let amount = 0;
    for (let i = minI; i <= maxI; i++) {
      amount += y[i];
    }
    this._amount[pie.id] = amount;

    let r = this.radius;
    let vC = r; // vertical center
    let hC = this.width / 2; // horizontal center
    let percent = amount / total;
    let angle = 360 * percent;

    let zAngle = (angle > 180) ? 360 - angle : angle;
    let zRad = degToRad(zAngle);
    let zSide = Math.sqrt(2 * r * r - ( 2 * r * r * Math.cos(zRad) ) );
    let xSide;
    if (zAngle <= 90) {
      xSide = r * Math.sin(zRad);
    } else {
      zRad = degToRad(180 - zAngle);
      xSide = r * Math.sin(zRad);
    }

    let ySide = Math.sqrt(zSide * zSide - xSide * xSide);
    let Y = ySide;
    let X;
    let largeArcFlag = 0;

    if (angle <= 180) {
      X = hC + xSide;
    } else {
      X = hC - xSide;
      largeArcFlag = 1;
    }

    let path = document.createElementNS(_.SVG_NS, 'path')
    this._svg.appendChild(path);

    let d = `M${hC} ${vC}`;
    d += ` L${hC} 0`;
    d += ` A${r} ${r} 1 ${largeArcFlag} 1 ${X} ${Y} z`;
    let rotate = `rotate(${options.rotate} ${hC} ${vC})`;
    path.setAttribute('d', d);
    path.setAttribute('transform', rotate);
    path.setAttribute('fill', pie.color);
    path.setAttribute('path-id', pie.id); //TODO sic

    function degToRad(angle) {
      return _.round(angle * (Math.PI / 180), 3);
    }

    return angle;
  };

  this._computeY = function (minI, maxI) {
    let ids = [];
    _.forIn(this._data, (record, id)  => {
      if (!record.enabled) return;
      ids.push(id);
    });

    if (ids.length === 0) {
      this._Y = 0;
      return;
    }

    let Y = 0;
    for (let i = minI; i <= maxI; i++) {
      let value = 0;
      _.forEach(ids, id =>  {
        let record = this._data[id];
        value += record.y[i];
      })
      Y += value;
    }

    this._Y = Y;
  };

  this._clearRect = function () {
    _.erase(this._svg);
  };

  this.getValues = function () {
    let values = [];
    _.forIn(this._data, (record, id) => {
      if (!record.enabled) return;

      let x = record.x;
      let y = record.y;
      values.push({
        id: record.id,
        name: record.name,
        yValue: this._amount[id],
        color: record.color,
      })
    })
    return values;
  };
}

module.exports = PieGraph;
