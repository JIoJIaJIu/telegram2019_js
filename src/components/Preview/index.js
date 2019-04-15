const _ = require('../../utils')
const v = require('./variables')
const Slider = require('./Slider')

const html = require('./index.html')
require('./styles.scss')


function Preview(container, options) {
  this._container = container;
  this.render();

  this._slider = new Slider(this._el, options);
  this._graph = null;
}

Preview.prototype = {
  draw: function (data, driver, options) {
    let canvas = this._el.querySelector('.canvas');
    let cs = getComputedStyle(this._el.parentNode);

    this.clean();
    let dualY = !!data.y_scaled;
    this._graph = driver.draw(canvas, data, {
      width: parseFloat(cs.width) - v.SLIDER_LEFT_WIDTH - v.SLIDER_RIGHT_WIDTH,
      height: v.CANVAS_HEIGHT,
      dualY: dualY,
      disabled: options && options.disabled
    });
  },

  appear: function () {
    _.removeClass(this._el, 'disappear');
  },

  disappear: function () {
    _.addClass(this._el, 'disappear');
  },

  update(xScale, xTranslate) {
    this._slider.posByScale(xScale, xTranslate);
  },

  reset: function () {
    this._slider.reset();
  },

  clean: function () {
    let canvas = this._el.querySelector('.canvas');
    _.erase(canvas);
  },

  get width() {
    return this._el.getBoundingClientRect().width;
  },

  get height() {
    return this._el.getBoundingClientRect().height;
  },

  get graph() {
    return this._graph;
  },

  render: function () {
      let doc = document.createElement('div');
      doc.innerHTML = html;
      this._el = doc.firstChild;
      this._container.appendChild(this._el);

      let w = _.requestWidth();
      this._el.style.width = `${w}px`;
      this._el.style.height = `${v.PREVIEW_HEIGHT - v.SLIDER_BORDER * 2 }px`

      let canvas = this._el.querySelector('.canvas');
      canvas.style.marginLeft = `${v.SLIDER_LEFT_WIDTH}px`;
      canvas.style.marginRight = `${v.SLIDER_RIGHT_WIDTH}px`;
      canvas.style.width = `${w - v.SLIDER_LEFT_WIDTH - v.SLIDER_RIGHT_WIDTH}px`
      canvas.style.height = `${v.CANVAS_HEIGHT}px`
  }
}

module.exports = Preview
