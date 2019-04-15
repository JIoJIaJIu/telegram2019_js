const _ = require('../../utils')

const Checkbox = require('./Checkbox')

function CheckboxGroup(container) {
  this._container = container;
  this._checked = 0;
  this._options = { minChecked: 1 };
  this._el = null;
  this.render();
}

CheckboxGroup.prototype = {
  draw: function (data, options) {
    _.erase(this._el)
    this._checked = 0;
    _.extend(this._options, options)

    let disabled = options && options.disabled;
    _.forIn(data.types, (type, k) => {
      if (k == 'x') return;
      let checked = true;
      if (disabled && disabled.indexOf(k) !== -1) checked = false;
      if (checked) {
        this._checked++;
      }

      let c = new Checkbox(this._el, {
        checked: checked,
        id: k,
        label: data.names[k],
        color: data.colors[k],
        onChange: this._onChange.bind(this, k)
      });
    })
  },

  _onChange: function (k, enabled) {
    enabled ? this._checked++ : this._checked--;
    this._options.onChange(k, enabled);
  },

  render: function () {
    let controls = document.createElement('div');
    this._container.appendChild(controls);
    this._el = controls;

    this._el.addEventListener('click', (e) => {
      let t = e.target;
      let c = this._getCheckboxNode(t);
      if (!c) return;

      if (c.getAttribute('checked') === 'true') {
        if (this._checked === this._options.minChecked) {
          _.shake(c);
          e.stopPropagation();
          return;
        }
      }

    }, true)
  },

  _getCheckboxNode: function (node) {
    while (node && node != this._el) {
      if (_.hasClass(node, 'custom_checkbox')) return node;
      node = node.parentNode;
    }

    return null;
  }
}

module.exports = CheckboxGroup;
