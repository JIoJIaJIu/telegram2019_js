const html = require('./index.html');
const _ = require('../../../utils');
require('./styles.scss');

const yPadding = 30;
const SHIFT = 10;

function Popup () {
  this._container = document.body;
  this._el = this._init();

  this._el.addEventListener('click', (e) => {
    e.preventDefault();
    this._onClick && this._onClick();
  });
}

Popup.prototype = {
  show: function (atX, atY) {
    let el = this._el;

    let y = atY
    let x = this._findBestX(atX);

    this._el.style.left = `${x}px`;
    this._el.style.top = `${y}px`;
    this._el.style.display = 'block';
    //TODO;
    this._w = _.width(this._el);
  },

  hide: function () {
    this._el.style.display = 'none';
  },

  setTitle: function (title, onClick) {
    this._el.querySelector('.popup_title').innerHTML = title || '';
  },

  showTitle: function () {
    if (!this._titleIsHidden) return;
    this._el.querySelector('.popup_title').style.display = 'block';
    this._titleIsHidden = false;
  },

  hideTitle: function () {
    if (this._titleIsHidden) return;
    this._el.querySelector('.popup_title').style.display = 'none';
    this._titleIsHidden = true;
  },

  setOnClick: function (onClick) {
    this._onClick = onClick;
  },

  _findBestX: function (atX) {
    let el = this._el;
    let w = this.width;
    let maxW = el.parentNode.getBoundingClientRect().width;
    let x1 = atX - w - SHIFT;
    if (x1 < 0) {
      let diff1 = x1 * 1
      let x2 = atX + SHIFT * 2;
      if (x2 + w < maxW) return x2;
      let diff2 = x2 + w - maxW;

      console.log(diff2, diff1);
      return (diff2 > diff1) ? 0 : maxW - w;
    }

    return x1;
  },
  /**
   * @param {Array} desc
   *  @item {Object}
   *   @key {String} title
   *   @key {String} color
   *   @key {String} value
   */
  setDescription: function (desc) {
    let node = this._el.querySelector('.popup_description');
    _.erase(node);

    _.forEach(desc, d => {
      let row = document.createElement('div');
      let title = document.createElement('span');
      let v = document.createElement('span');

      row.appendChild(title);
      title.innerHTML = d.title;
      row.appendChild(v);
      v.innerHTML = this._formatValue(d.value);
      v.style.color = d.color;
      node.appendChild(row);
    })
  },

  _formatValue: function (value) {
    if (!value) return 0;
    let v = [];
    while (value) {
      let q = value % 1000;
      value = Math.floor(value / 1000)
      if (value) {
        q = `${q}`;
        if (q.length == 2) {
          q = `0${q}`;
        } else if (q.length == 1) {
          q = `00${q}`;
        }
      }
      v.unshift(q);
    }

    return v.join(' ');
  },

  get el() {
    return this._el;
  },

  get width() {
    return this._w || 100;
  },

  // TODO: rename
  _init: function () {
    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = doc.firstChild;
    this._container.appendChild(el);
    return el;
  },
}

module.exports = {
  Popup: Popup,
  singleton: new Popup()
}
