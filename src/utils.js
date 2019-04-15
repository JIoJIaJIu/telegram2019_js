const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];

const MAX_WIDTH = 500;

const utils = {
  min: function (val) {
    if (Array.isArray(val)) return Math.min.apply(null, val);
    return Math.min.apply(null, arguments);
  },

  max: function (val) {
    if (Array.isArray(val)) return Math.max.apply(null, val);
    return Math.max.apply(null, arguments);
  },

  getWidth: function (el) {
    return el.getBoundingClientRect().width;
  },

  getHeight: function (el) {
    return el.getBoundingClientRect().height;
  },

  width: function (el) {
    return el.getBoundingClientRect().width;
  },

  height: function (el) {
    return el.getBoundingClientRect().height;
  },

  extend: function () {
    return Object.assign.apply(null, arguments);
  },

  last: function (arr) {
    if (!Array.isArray(arr)) return null;
    return arr[arr.length - 1];
  },

  forIn: function (obj, cb) {
    if (!cb) return;

    for (let k in obj) {
      cb(obj[k], k);
    }
  },

  forEach: function (arr, cb) {
    if (!cb || !arr) return;

    for (let i = 0, length = arr.length; i < length; i++) {
      cb(arr[i], i);
    }
  },

  round: function (val, precision) {
    precision = precision || 0;
    let mult = Math.pow(10, precision);
    return Math.round(val * mult) / mult;
  },

  get SVG_NS() {
    return 'http://www.w3.org/2000/svg';
  },

  erase: function (node) {
    while (node.childNodes.length) {
      node.removeChild(node.firstChild);
    }
  },

  // requires classList support
  addClass: function (node, className) {
    node.classList.add(className);
  },

  // requires classList support
  removeClass: function (node, className) {
    node.classList.remove(className);
  },

  hasClass: function (node, className) {
    return node.classList.contains(className);
  },

  offsetTop: function (node) {
    let rect = node.getBoundingClientRect();
    let t = rect.top;
    let x = t + (pageYOffset || document.documentElement.scrollTop);
    return x;
  },

  offsetLeft: function (node) {
    let rect = node.getBoundingClientRect();
    let l = rect.left;
    let x = l + (pageXOffset || document.documentElement.scrollLeft);
    return x;
  },

  isChild: function (a, b) {
    while (a && a !== document.documentElement) {
      a = a.parentNode;

      if (a === b)
        return true;
    }

    return false;
  },

  requestWidth: function () {
    let _ = utils;

    let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    if (width > MAX_WIDTH * _.dpr) width = MAX_WIDTH * _.dpr;
    return width;
  },

  get dpr() {
    return 1;
  },

  get yRatio() {
    MAX_WIDTH / screen.width;
  },

  get hRatio() {
    MAX_HEIGHT / screen.height;
  },

  shake(node) {
    const _ = utils;
    const SHAKE_MS = 820;
    if (_.hasClass(node, 'shaked')) return;

    _.addClass(node, 'shaked');
    setTimeout(() => {
      _.removeClass(node, 'shaked')
    }, SHAKE_MS)
  }
}

module.exports = utils
