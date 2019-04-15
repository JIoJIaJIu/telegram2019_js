const _ = require('../../../../utils');

const InteractiveBase = require('../../../Graph/Interactive');
const Popup = require('../../../UI/Popup').singleton;

function PieInteractive(graph) {
  InteractiveBase.call(this, graph);
  this._svg = this._canvas;
}

PieInteractive.prototype = Object.assign({}, InteractiveBase.prototype, {
  wrap: function (graph) {
    let self = this;
    graph.addInterface('IInteractive');

    graph.IInteractive_select = function (x, e) {
      let target = e.target;
      let y = _.offsetTop(target);

      let id = target.getAttribute('path-id'); // TODO: sic
      let values = graph.getValues()
      let desc = []
      _.forEach(values, value => {
        if (id !== value.id) return;
        desc.push({
          title: value.name,
          value: value.yValue,
          color: value.color
        })
      })

      let xValue = 0;
      self.showPopup(x, y, {
        desc: desc,
        // TODO
        isZoomed: graph.state.isZoomed
      })
    }

    graph.IInteractive_deselect = function () {
      self.hidePopup();
    }
  },

  bindHover: function () {
    if (!this._graph.supportInterface('IInteractive')) {
      throw new Error("Graph should support IInteractive");
    }

    let svg = this._graph.svg;
    let paths = svg.querySelectorAll('path');
    _.forEach(paths, path => {
      this._bindHover(path);
    })
  },

  _bindHover: function (node) {
    if (!this._graph.supportInterface('IInteractive')) {
      throw new Error("Graph should support IInteractive");
    }

    node.addEventListener('mousemove', (e) => {
      if (e.target !== node) return;
      let x = e.clientX - this._graph.marginLeft;
      if (x < 0) return;

			this._graph.IInteractive_select(x, e);
    });

    node.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget === Popup.el ||
        _.isChild(e.relatedTarget, Popup.el)) return;

			this._graph.IInteractive_deselect();
    })
  },

  render: function () {
    this._canvas = this._graph.svg;
  }
})

module.exports = PieInteractive;
