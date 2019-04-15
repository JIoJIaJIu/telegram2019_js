const _ = require('../../../../../utils')
const html = require('./index.html');
require('./styles.scss')

const InteractiveBase = require('../../../../Graph/Interactive');
const Popup = require('../../../../UI/Popup').singleton;

function HistogramInteractive(graph) {
  InteractiveBase.call(this, graph);

  this._xValue = null;
  this._onClick = this._onClick.bind(this);
}

HistogramInteractive.prototype = Object.assign({}, InteractiveBase.prototype, {
  wrap: function () {
    let graph = this._graph;
    let self = this;
    graph.addInterface('IInteractive');

    graph.IInteractive_select = function (x) {
      graph.select(x);
      let values = graph.getValues(x);
      let xValue;
      let desc = [];
      _.forEach(values, value => {
        desc.push({
          title: value.name,
          value: value.yValue,
          color: value.color
        })

        xValue = value.xValue;
      })

      self._xValue = xValue;
      let y = _.offsetTop(self._el);
      x += _.offsetLeft(self._el);
      self.showPopup(x, y, {
        xValue: xValue,
        onClick: self._onClick,
        desc: desc,
        // TODO
        isZoomed: graph.state.isZoomed
      })
    }

    graph.IInteractive_deselect = function () {
      graph.deselect();
      self.hidePopup();
    }

    graph.IInteractive_click = function () {
      self._onClick();
    }
  },

  render: function () {
    let container = this._graph.container;

    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = this._el = doc.firstChild;
    this._canvas = this._el // TODO:
    container.appendChild(el);
  },

  _onClick: function (e) {
    let event = document.createEvent('Event');
    event.initEvent('zoom', true, true);

    event.xValue = this._xValue;
    event.xTranslate = this._graph.state.xTranslate;
    event.xScale = this._graph.state.xScale;

    this._canvas.dispatchEvent(event);
  },
})

module.exports = HistogramInteractive;
