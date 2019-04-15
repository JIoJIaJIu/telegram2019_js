const html = require('./index.html');
const _ = require('../../../utils');

require('./styles.scss');

const defaultOptions = {
  label: null,
  onChange: function () {},
  checked: false
}

function Checkbox(container, options) {
  this._container = container;
  this._el = this._init(); // TODO;
  this._options = _.extend({}, defaultOptions, options);

  this._input = this._el.querySelector('input[type="checkbox"]');
  this._label = this._el.querySelector('label');

  let rnd = Math.ceil(Math.random() * 100);
  let id = this._options.id

  this._input.setAttribute('id', `${id}-checkbox-${rnd}`);
  this._label.innerHTML = this._options.label;
  this._label.setAttribute('for', `${id}-checkbox-${rnd}`);

  this._input.checked = !!options.checked;
  this._el.setAttribute('checked', !!options.checked)
  _.addClass(this._el, 'active')

  this._el.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    this.toggle();
  })

  if (this._input.checked) {
    _.addClass(this._el, 'checked')
    //TODO: with classes
    this._el.style.background = this._options.color;
    this._el.style.color = 'white';
  } else {
    _.removeClass(this._el, 'checked')
    //TODO: with classes
    this._el.style.color = this._options.color;
    this._el.style.background = 'none';
  }
  this._el.style.borderColor = this._options.color;
}

Checkbox.prototype = {
  toggle: function () {
    this._input.checked = !this._input.checked;
    this._el.setAttribute('checked', this._input.checked)
    if (this._input.checked) {
      _.addClass(this._el, 'checked')
      //TODO: with classes
      this._el.style.color = 'white';
      this._el.style.background = this._options.color;
    } else {
      _.removeClass(this._el, 'checked')
      //TODO: with classes
      this._el.style.color = this._options.color;
      this._el.style.background = 'none';
    }
    this._options.onChange(this._input.checked);
  },

  _init: function () {
    let doc = document.createElement('div');
    doc.innerHTML = html;
    let el = doc.firstChild;
    this._container.appendChild(el);
    return el;
  }
}

module.exports = Checkbox;
