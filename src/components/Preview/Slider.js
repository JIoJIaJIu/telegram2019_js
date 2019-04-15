let _ = require('../../utils');
let v = require('./variables')
require('./styles.scss')

// classNames
const cn = {
  SLIDER: '.slider',
  LEFT: '.slider_left',
  RIGHT: '.slider_right',
  VIEW: '.slider_view',
  OVERLAY_LEFT: '.overlay_left',
  OVERLAY_RIGHT: '.overlay_right'
}


const defaultConfig = {
  sliderWidth: 100 * _.dpr,
  sliderMinWidth: 20 * _.dpr,
  onChange: null
}

function Slider(el, config) {
  let slider = el.querySelector(cn.SLIDER)
  this._el = slider;
  this._el.style.width = el.getBoundingClientRect().width;

  this.sliderUI = {
    left: slider.querySelector(cn.LEFT),
    right: slider.querySelector(cn.RIGHT),
    view: slider.querySelector(cn.VIEW),
  }

  this.overlayUI = {
    left: slider.querySelector(cn.OVERLAY_LEFT),
    right: slider.querySelector(cn.OVERLAY_RIGHT),
  }

  this.onChange = config.onChange;
  this.config = _.extend({}, defaultConfig, config);
  this.render();
  this._initUI();
}

Slider.prototype = {
  pos: function (x, width) {
    if (x < 0) x = 0;
    if (width < this.config.sliderMinWidth) width = this.config.sliderMinWidth;

    const { left, right, view } = this.sliderUI;

    view.style.width = `${width}px`;
    if (x < v.SLIDER_LEFT_WIDTH) {
      x = v.SLIDER_LEFT_WIDTH;
    }
    this.overlayUI.left.style.width = `${x}px`

    let leftWidth = left.getBoundingClientRect().width;
    let rightWidth = this.width - width - x
    this.overlayUI.right.style.width = `${rightWidth}px`

    this._onChange();
  },

  posByScale: function (xScale, xTranslate) {
    let { left, right, view } = this.sliderUI;

    let leftWidth = _.width(left);
    let rightWidth = _.width(right);
    let width = this.width - leftWidth - rightWidth;

    let viewWidth = width / xScale;
    //TODO: bug
    if (viewWidth >= width) {
      viewWidth = width;
    }

    let x = _.round(xTranslate * viewWidth + leftWidth);
    this.pos(x, _.round(viewWidth));
  },

  reset: function () {
    this.pos(0, this.config.sliderWidth);
  },

  _initUI: function (config) {
    this._el.style.display = "block";
    this.pos(0, this.config.sliderWidth);

    this._bindUI();
  },

  getXScale() {
    let { left, right, view } = this.sliderUI;

    let viewWidth = _.width(view);
    let leftWidth = _.width(left);
    let rightWidth = _.width(right);
    let width = this.width - leftWidth - rightWidth;

    //console.log('getXScale', width/viewWidth);
    return width / viewWidth;
  },

  getXTranslate() {
    let { left, view } = this.sliderUI;
    let viewWidth = _.width(view);
    let leftWidth = _.width(left);
    //console.log('getXTranslate', (view.offsetLeft - leftWidth) / viewWidth);
    return (view.offsetLeft - leftWidth) / viewWidth;
  },

  // TODO
  // - refactor
  getVisibleCoords() {
    let { left, view } = this.sliderUI;
    let width = view.getBoundingClientRect().width;
    let leftWidth = left.getBoundingClientRect().width;
    let offsetX = view.offsetLeft;

    return [ offsetX - leftWidth, offsetX + width ];
  },

  // TODO: event?
  _onChange() {
    if (this.onChange) {
      this.onChange(this.getXScale(), this.getXTranslate());
    }
  },

  // TODO:
  // - refactor
  // - speed improvement
  _bindUI: function () {
    const config = this.config;
    const { left, right, view } = this.sliderUI;
    const width = this.width;
    const leftWidth = v.SLIDER_LEFT_WIDTH;
    const rightWidth = v.SLIDER_RIGHT_WIDTH;

    let pOffsetLeft = this._el.getBoundingClientRect().left;

    this._bindSlider(left, (e) => {
      let x = e.clientX - leftWidth - pOffsetLeft;
      if (e.changedTouches) { // TouchedEvent
        let touch = e.changedTouches[0];
        x = touch.clientX - leftWidth - pOffsetLeft;
      }
      if (x < 0) x = 0;

      let overlayLeftWidth = x + leftWidth;
      let diff = this.overlayUI.left.getBoundingClientRect().width - overlayLeftWidth;
      let viewWidth = view.getBoundingClientRect().width + diff;

      if (viewWidth <= config.sliderMinWidth) {
        overlayLeftWidth += (viewWidth - config.sliderMinWidth);
        viewWidth = config.sliderMinWidth;
      }

      this.overlayUI.left.style.width = `${overlayLeftWidth}px`;
      view.style.width = `${viewWidth}px`;

      this._onChange();
    });

    this._bindSlider(right, (e) => {
      let diff = e.movementX;
      let prevMidWidth = view.getBoundingClientRect().width;
      if (e.changedTouches) { // TouchedEvent
        let touch = e.changedTouches[0];
        let overlayLeftWidth = this.overlayUI.left.getBoundingClientRect().width;
        let x = touch.clientX - leftWidth;
        diff = x - prevMidWidth - overlayLeftWidth - pOffsetLeft;
      }
      let midWidth =  prevMidWidth + diff;
      if (midWidth < config.sliderMinWidth) {
        diff = config.sliderMinWidth - prevMidWidth;
        midWidth = prevMidWidth + diff;
      }

      let overlayRightWidth = this.overlayUI.right.getBoundingClientRect().width - diff;
      if (overlayRightWidth < rightWidth) {
        midWidth += overlayRightWidth - rightWidth;
        overlayRightWidth = rightWidth;
      }

      this.overlayUI.right.style.width = `${overlayRightWidth}px`;
      view.style.width = `${midWidth}px`;

      this._onChange();
    });

    this._bindSlider(view, (e) => {
      let diff = e.movementX;
      if (e.changedTouches) { // TouchedEvent
        let touch = e.changedTouches[0];
        if (!this._sliderClientX) {
          this._sliderClientX = touch.clientX;
          return;
        }
        diff = touch.clientX - this._sliderClientX;
        this._sliderClientX = touch.clientX;
      }

      let overflowLeftWidth = this.overlayUI.left.getBoundingClientRect().width + diff;
      if (overflowLeftWidth < leftWidth) {
        diff += leftWidth - overflowLeftWidth;
        overflowLeftWidth = leftWidth;
      }

      let overflowRightWidth = this.overlayUI.right.getBoundingClientRect().width - diff;
      if (overflowRightWidth < rightWidth) {
        diff -= rightWidth - overflowRightWidth;
        overflowRightWidth = rightWidth;
        overflowLeftWidth = this.overlayUI.left.getBoundingClientRect().width + diff;
      }

      this.overlayUI.left.style.width = `${overflowLeftWidth}px`;
      this.overlayUI.right.style.width = `${overflowRightWidth}px`;

      this._onChange();
    });
  },

  _bindSlider(UI, cb) {
    let self = this;
    const doc = UI.ownerDocument;

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

    UI.addEventListener('mousedown', initDrag);
    UI.addEventListener('touchstart', initDrag, supportsPassive ? {passive: true} : false);
    function initDrag() {
      _.addClass(self._el, 'grabbing');
      doc.addEventListener('mouseup', stopDrag)
      doc.addEventListener('touchend', stopDrag)
      subscribeOnMove();
    }

    function stopDrag() {
      _.removeClass(self._el, 'grabbing');
      unsubscribeOnMove();
      self._sliderClientX = null;
      doc.removeEventListener('mouseup', stopDrag);
      doc.removeEventListener('touchend', stopDrag);
    }

    function subscribeOnMove() {
      self._el.addEventListener('mousemove', moveListener);
      self._el.addEventListener('touchmove', moveListener, supportsPassive ? {passive: true} : false);
    }

    function unsubscribeOnMove() {
      self._el.removeEventListener('mousemove', moveListener);
      self._el.removeEventListener('touchmove', moveListener, supportsPassive ? {passive: true} : false);
    }

    function moveListener(e) { cb(e); }
  },

  get width() {
    return _.width(this._el);
  },

  get height() {
    return _.height(this._el);
  },

  render: function () {
    this._el.style.height = `${v.CANVAS_HEIGHT}px`

    let { left, right, view } = this.sliderUI;
    left.style.width = `${v.SLIDER_LEFT_WIDTH}px`
    left.style.height = `${v.SLIDER_HEIGHT - v.SLIDER_BORDER}px`
    left.style.marginTop = `-${v.SLIDER_BORDER}px`
    right.style.width = `${v.SLIDER_RIGHT_WIDTH}px`
    right.style.height = `${v.SLIDER_HEIGHT - v.SLIDER_BORDER}px`
    right.style.marginTop = `-${v.SLIDER_BORDER}px`

    view.style.height = `${v.SLIDER_HEIGHT - v.SLIDER_BORDER}px`
    view.style.marginTop = `-${v.SLIDER_BORDER}px`
    view.style.borderTopWidth = `${v.SLIDER_BORDER}px`
    view.style.borderBottomWidth = `${v.SLIDER_BORDER}px`

    this.overlayUI.left.style.height = `${v.CANVAS_HEIGHT}px`;
    this.overlayUI.right.style.height = `${v.CANVAS_HEIGHT}px`;
  },
}

module.exports = Slider
