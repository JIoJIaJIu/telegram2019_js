const html = require('./interactive.html');
const _ = require('../../utils');
const moment = require('../../moment');
const Popup = require('../UI/Popup').singleton;

// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
let supportsPassive = false;
try {
  let opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("testPassive", null, opts);
  window.removeEventListener("testPassive", null, opts);
} catch (e) {}

function GraphInteractive (graph) {
  this._graph = graph;
  this._el = null;
  this._canvas = null;

  this.wrap(graph);
  this.render();
  this.bindHover(this._canvas);
}

GraphInteractive.prototype = {
  wrap: function () {
    throw new Error("Implement wrap function");
  },

  bindHover: function (node) {
    if (!this._graph.supportInterface('IInteractive')) {
      throw new Error("Graph should support IInteractive");
    }

    let selected = null;
    let touching = false;

    // TODO:
    node.addEventListener('mouseenter', (e) => {
      this.bindKeyboard && this.bindKeyboard();
    });

    node.addEventListener('mousemove', (e) => {
      if (touching) return;
      if (e.target !== node) return;
      let x = e.offsetX - this._graph.marginLeft;
      if (x < 0) return;
      if (x > this._graph.width) return;

      this._graph.IInteractive_select(x, e);
      selected = true;
    });

    node.addEventListener('touchstart', (e) => {
      if (e.target !== node) return;
      touching = true;
      console.log('touchstart');

      let touch = e.touches[0];
      let x = touch.clientX - this._graph.marginLeft;
      if (x < 0) return;
      x -= _.offsetLeft(node);
      if (x > this._graph.width) return;

      this._graph.IInteractive_select(x, e);
      selected = true;
    }, supportsPassive ? {passive: false} : false);

    node.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget === Popup.el ||
        _.isChild(e.relatedTarget, Popup.el)) return;


      requestAnimationFrame(() => {
        this._graph.IInteractive_deselect();
        selected = false;
      });
    })

    node.addEventListener('click', (e) => {
      if (touching) return;
      if (selected) this._graph.IInteractive_click();
    })
  },

  render: function () {
    let container = this._graph.container;

    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = this._el = doc.firstChild;
    container.appendChild(el);
    let svg = el.querySelector('svg');
    this._canvas = svg;
  },

  showPopup: function (x, y, options) {
    // TODO
    if (options.xValue !== undefined) {
      Popup.setTitle(this._formatTimestamp(options.xValue, options.isZoomed, options.xValueStep));
      Popup.showTitle();
    } else {
      Popup.hideTitle();
    }
    Popup.setOnClick(options.onClick);
    Popup.setDescription(options.desc);
    Popup.show(x, y);
  },

  hidePopup: function () {
    Popup.hide();
  },

  // Sat, 20 Apr 2019
  // 01:00
  // 01:15
  _formatTimestamp: function (t, isZoomed, xValueStep) {
    let d = new Date(t);
    const HOUR = 1000 * 60 * 60;

    //TODO:
    if (!isZoomed) {
      return `${moment.getDay(d)}, ${d.getUTCDate()} ${moment.getMon(d)} ${d.getUTCFullYear()}`;
    } else {
      if (xValueStep < HOUR) {
        return moment.getRoundHoursWithMinutes(d);
      } else {
        return moment.getRoundHours(d);
      }
    }
  },

}

module.exports = GraphInteractive;
