const html = require('./index.html');
const _ = require('../../utils');
const moment = require('../../moment');

require('./styles.scss')

let width = _.requestWidth();
let horMargin = 5;
const CANVAS_WIDTH = width - horMargin * 2; //TODO?
const CANVAS_HEIGHT = width * 0.7;

function Plot(parentNode, options) {
  let doc = document.createElement('div');
  doc.innerHTML = html;
  let el = this._el = doc.firstChild;
  parentNode.appendChild(el);
  this._container = el;

  el.querySelector('.zoom_out').addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    let event = document.createEvent('Event');
    event.initEvent('zoomout', true, true);
    el.dispatchEvent(event);
  })
}

Plot.prototype = {
  /**
   * options {Object}
   *  title {String}
   *  isZoomed {Boolean}
   *  disabled {Array}
   */
  draw: function (data, driver, options) {
    let dualY = !!data.y_scaled;

    this.clean();
    if (options && options.isZoomed) {
      _.addClass(this._el, 'is_zoomed');
    } else {
      _.removeClass(this._el, 'is_zoomed');
      this.setTitle(options && options.title);
    }
    this._graph = driver.draw(this._container.querySelector('.plot_internal'), data, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      withGrid: true,
      withInteractive: true,
      scaleY: true,
      dualY: dualY,
      disabled: options && options.disabled,
      //TODO:
      isZoomed: !!(options && options.isZoomed)
    });
  },

  appear: function () {
    _.removeClass(this._container, 'disappear');
  },

  disappear: function () {
    _.addClass(this._container, 'disappear');
  },

  clean: function () {
    let plot = this._container.querySelector('.plot_internal');
    _.erase(plot);
  },

  reset: function () {
    this._slider.reset()
  },

  update: function (xScale, xTranslate) {
    this._graph.draw(xScale, xTranslate);
    let minXValue = this._graph.getVisibleMinXValue();
    let maxXValue = this._graph.getVisibleMaxXValue();

    let s = new Date(minXValue);
    let e = new Date(maxXValue);
    const DAY = 1000 * 60 * 60 * 24;

    if (e - s <= DAY * 1.3) {
      s = new Date((maxXValue + minXValue) / 2)
      let ss = `${s.getUTCDate()} ${moment.getMonth(s)} ${s.getUTCFullYear()}`;
      this.setDescription(`${ss}`);
    } else {
      let ss = `${s.getUTCDate()} ${moment.getMonth(s)} ${s.getUTCFullYear()}`;
      let es = `${e.getUTCDate()} ${moment.getMonth(e)} ${e.getUTCFullYear()}`;
      this.setDescription(`${ss} - ${es}`);
    }
  },

  setTitle: function (title) {
    this._container
      .querySelector('.plot_title')
      .innerHTML = title || '';
  },

  setDescription: function (text) {
    this._container
      .querySelector('.plot_range')
      .innerHTML = text || '';
  },

  get container() {
    return this._container;
  },

  get graph() {
    return this._graph;
  }
}

module.exports = Plot;
