const _ = require('../../../../utils');
require('./styles.scss');

const InteractiveBase = require('../../../Graph/Interactive');
const InteractiveMixin = require('../../../Graph/InteractiveMixin');
let Popup = require('../../../UI/Popup').singleton;

function LineInteractive(graph) {
  InteractiveBase.call(this, graph);
  this._points = {};
  this._svg = this._canvas;

  this._line = null;
  this._xValue = null;

  this._onClick = this._onClick.bind(this);
}

LineInteractive.prototype = Object.assign({}, InteractiveBase.prototype, InteractiveMixin, {
  wrap: function (graph) {
    graph.addInterface('IInteractive');
    let self = this;

    graph.IInteractive_select = function (x) {
      let points = this.getPoints(x);
      if (!points.length) return;

      let xValue;
      let desc = [];
      points.forEach(point => {
        self._showPoint(point);

        xValue = point.xValue;
        x = point.x;

        desc.push({
          title: point.name,
          value: point.yValue,
          color: point.color
        })
      });

      self._xValue = xValue;
      self._showLine(x);

      let y = _.offsetTop(self._svg) // TODO:
      x += _.offsetLeft(self._svg)
      self.showPopup(x, y, {
        xValue: xValue,
        desc: desc,
        onClick: self._onClick,
        //TODO
        isZoomed: graph.state.isZoomed,
        // TODO
        xValueStep: graph.xValueStep
      })
    }

    graph.IInteractive_deselect = function () {
      self._hideLine();
      self._hidePoints();
      self.hidePopup();

      self.unbindKeyboard();
      self._xValue = null;
    }

    graph.IInteractive_click = function () {
      self._onClick();
    }
  },

  _onClick: function (e) {
    let event = document.createEvent('Event');
    event.initEvent('zoom', true, true);
    event.xValue = this._xValue;
    event.xTranslate = this._graph.state.xTranslate;
    event.xScale = this._graph.state.xScale;

    this._svg.dispatchEvent(event);
  },

  _showLine: function(x) {
    let l = this._line;
    if (!l) {
      l = document.createElementNS(_.SVG_NS, 'line');
      this._svg.insertBefore(l, this._svg.firstChild);
      this._line = l;
    }

    l.setAttribute('x1', x + this._graph.marginLeft);
    l.setAttribute('y1', this._graph.marginTop);
    l.setAttribute('x2', x + this._graph.marginLeft);
    l.setAttribute('y2', this._graph.height + this._graph.marginTop);
    l.style.display = 'block';
  },

  _showPoint: function (point) {
    let p = this._points[point.name];
    if (!p) {
      p = document.createElementNS(_.SVG_NS, 'circle');
      this._svg.appendChild(p);
      this._points[point.name] = p;
    }

    // TODO:
    p.setAttribute('cx', this._graph.marginLeft + point.x);
    p.setAttribute('cy', this._graph.marginTop + point.y);
    p.setAttribute('stroke', point.color);
    p.setAttribute('stroke-width', 1  * _.dpr);
    p.setAttribute('r', 4 * _.dpr);
    p.style.display = 'block';
  },

  _hideLine: function () {
    let l = this._line;
    if (!l) return;

    l.style.display = 'none';
  },

  _hidePoints: function () {
    _.forIn(this._points, point => {
      point.style.display = 'none';
    })
  }
})

module.exports = LineInteractive;
