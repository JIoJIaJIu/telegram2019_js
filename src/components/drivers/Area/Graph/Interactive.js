const _ = require('../../../../utils');

const InteractiveBase = require('../../../Graph/Interactive');
const Popup = require('../../../UI/Popup').singleton;

function AreaInteractive(graph) {
  InteractiveBase.call(this, graph);
  this._svg = this._canvas;
  this._line = null;

  this._onClick = this._onClick.bind(this);
}

AreaInteractive.prototype = Object.assign({}, InteractiveBase.prototype, {

  wrap: function (graph) {
    graph.addInterface('IInteractive');
    let self = this;

    graph.IInteractive_select = function (x) {
      let values = graph.getValues(x);
      let xValue;
      let desc = [];
      _.forEach(values, value => {
        desc.push({
          title: value.name,
          value: value.yValue,
          color: value.color
        })

        x = value.x;
        xValue = value.xValue;
        let y = _.offsetTop(self._svg); // TODO
        let atX = x + _.offsetLeft(self._svg);
        self.showPopup(atX, y, {
          xValue: xValue,
          desc: desc,
          onClick: self._onClick.bind(self, i),
          //TODO
          isZoomed: graph.state.isZoomed
        })
      })
      self._xValue = xValue;
      self._showLine(x)
    }

    graph.IInteractive_deselect = function () {
      self._hideLine();
      Popup.hide();
    }

    graph.IInteractive_click = function () {
      self._onClick();
    }
  },

  _onClick: function (i) {
    let event = document.createEvent('Event');
    event.initEvent('zoomToPie', true, true);
    /*
    let data = this._graph.getRawData(i);

    // TODO:
    for (let k in data.types) {
      if (data.types[k] === 'x') continue;
      data.types[k] = 'pie';
    }
    */

    event.data = {};
    event.xValue = this._xValue;
    let state = this._graph.state;
    event.xScale = state.xScale;
    event.xTranslate = state.xTranslate;

    this._canvas.dispatchEvent(event);
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

  _hideLine: function () {
    let l = this._line;
    if (!l) return;

    l.style.display = 'none';
  },
});

module.exports = AreaInteractive;
