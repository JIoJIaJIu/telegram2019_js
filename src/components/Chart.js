const _ = require('../utils')
const DataProvider = require('../data/DataProvider')

const AreaDriver = require('./drivers/Area')
const PieDriver = require('./drivers/Pie')
const LineDriver = require('./drivers/Line')
const HistogramDriver = require('./drivers/Histogram')
const StackedHistogramDriver = require('./drivers/StackedHistogram')

const Plot = require('./Plot')
const Preview = require('./Preview')
const CheckboxGroup = require('./UI/CheckboxGroup')
const Popup = require('./UI/Popup').singleton;

function Chart(s, options) {
  this._container = document.querySelector(s);
  this.setDriver(options && options.driver);

  this._plot = new Plot(this._container);
  this._preview = null;
  this._checkboxGroup = null;
  // TODO:
  this._dataId = null;
  this._title = null;
  this._isZoomed = false;
  this._xScale = null;
  this._xTranslate = null;

  this._container.style.width = `${_.requestWidth()}px`;

  this._container.addEventListener('zoom', (e) => {
    e.stopPropagation();
    this.zoomIn(e.xValue, e.xScale, e.xTranslate);
  })

  this._container.addEventListener('zoomToPie', (e) => {
    e.stopPropagation();
    this.zoomToPie(e.xValue, e.xScale, e.xTranslate, e.data);
  })

  this._container.addEventListener('zoomout', (e) => {
    e.stopPropagation();
    this.zoomOut();
  })
}

Chart.prototype = {
  draw: function (data, options) {
    // TODO:
    this._dataId = data.id;
    this._title = options && options.title;

    this._plot.draw(data, this._driver, options);
    this._preview = new Preview(this._container, {onChange: this._onChange.bind(this)});
    this._preview.draw(data, this._previewDriver);

    this.drawCheckboxes(data);
  },

  drawCheckboxes: function (data, disabled) {
    if (!this._checkboxGroup) {
     this._checkboxGroup = new CheckboxGroup(this._container);
    }
    let minChecked = 1;
    if (this._driver.name === 'pie' || this._driver.name === 'area') minChecked = 2;
    this._checkboxGroup.draw(data, {
      onChange: (k, enabled) => { this._toggleGraph(k, enabled) },
      disabled: disabled,
      minChecked: minChecked
    })
  },

  determineDriver: function (data) {
    let type = data.types.y0; // TODO:

    if (type === 'bar') {
      if (data.stacked) {
        return this.setDriver('stackedHistogram');
      }

      return this.setDriver('histogram');
    }

    if (type === 'area') {
      return this.setDriver('area');
    }

    if (type === 'pie') {
      return this.setDriver('pie');
    }

    return this.setDriver('line');
  },

  setDriver: function (str) {
    if (this._driver && this._driver.name === str) return;

    switch (str) {
      case 'pie':
        this._driver = new PieDriver();
        this._previewDriver = new AreaDriver();
        break;
      case 'histogram':
        this._driver = new HistogramDriver();
        this._previewDriver = this._driver;
        break;
      case 'stackedHistogram':
        this._driver = new StackedHistogramDriver();
        this._previewDriver = this._driver;
        break;
      case 'area':
        this._driver = new AreaDriver();
        this._previewDriver = this._driver;
        break;
      case 'line':
      default:
        this._driver = new LineDriver();
        this._previewDriver = this._driver;
        break;
    }
  },

  zoomIn: function (xValue, xScale, xTranslate)  {
    if (this._isZoomed) {
    // TODO: plot components
      let node = this._plot.container.querySelector('.zoom_out')
      _.shake(node);
      return;
    }

    DataProvider.loadByTimestamp(this._dataId, xValue, (err, data) => {
      if (err) return;
        this._zoomIn(xValue, data);

        this._xScale = xScale;
        this._xTranslate = xTranslate;
    });
  },

  zoomToPie: function (xValue, xScale, xTranslate, data) {
    if (this._isZoomed) return;
    DataProvider.loadByTimestamp(this._dataId, xValue, (err, data) => {
      //TODO: merge with zoomIn
      if (err) return;
        Popup.hide();
        this._plot.disappear();
        this._preview.disappear();
        let disabled = this._plot.graph.disabled;
        this.drawCheckboxes(data, disabled);

        setTimeout(() => {
          this._plot.appear();
          this._preview.appear();
          this.setDriver('pie');

          this._plot.draw(data, this._driver, {isZoomed: true, disabled: disabled});
          this._preview.draw(data, this._previewDriver, {disabled: disabled});
          this._isZoomed = true;

          { // TODO: improve
            let minXValue = this._plot.graph.getMinXValue();
            let maxXValue = this._plot.graph.getMaxXValue();
            let H_DAY = 1000 * 60 * 60 * 24;
            let nextValue = xValue + H_DAY;

            let xScale = (maxXValue - minXValue) / (H_DAY);
            let xTranslate = (xValue - minXValue) / (nextValue - xValue);

            this._preview.update(xScale,  xTranslate);
          }
          this._isZoomed = true;
        }, 200);

        this._xScale = xScale;
        this._xTranslate = xTranslate;
    });
  },

  zoomOut: function () {
    if (!this._isZoomed) return;
    DataProvider.load(this._dataId, (err, data) => {
      if (err) return;

      this._plot.disappear();
      this._preview.disappear();

      let disabled = this._plot.graph.disabled
      if (this._dataId === 4) disabled = []; // TODO: hack
      this.drawCheckboxes(data, disabled);

      setTimeout(() => {
        this._plot.appear();
        this._preview.appear();

        this.determineDriver(data);
        this._plot.draw(data, this._driver, {isZoomed: false, title: this._title, disabled: disabled});
        this._preview.draw(data, this._previewDriver, {disabled: disabled});
        this._preview.update(this._xScale, this._xTranslate);
        this._isZoomed = false;
      }, 200);
    })
    Popup.hide();
  },

  _zoomIn: function (xValue, data) {
    Popup.hide();
    this._plot.disappear();
    this._preview.disappear();
    this.drawCheckboxes(data, this._plot.graph.disabled);

    setTimeout(() => {
      let disabled = this._plot.graph.disabled;

      this._plot.appear();
      this._preview.appear();
      this.determineDriver(data);
      this._plot.draw(data, this._driver, {isZoomed: true, disabled: disabled});
      this._preview.draw(data, this._previewDriver, {disabled: disabled});
      this._isZoomed = true;

      { // TODO: improve
        this._preview.reset();
        // TODO: moveout
        let minXValue = this._plot.graph.getMinXValue();
        let maxXValue = this._plot.graph.getMaxXValue();
        let H_DAY = 1000 * 60 * 60 * 24;
        let nextValue = xValue + H_DAY;

        let xScale = (maxXValue - minXValue) / (nextValue - xValue);
        let xTranslate = (xValue - minXValue) / (nextValue - xValue);
        this._preview.update(xScale,  xTranslate);
      }
    }, 200);
  },

  _toggleGraph: function (id, enabled) {
    if (enabled) {
      this._plot.graph.enable(id);
      this._preview.graph.enable(id);
    } else {
      this._plot.graph.disable(id);
      this._preview.graph.disable(id);
    }
  },

  _onChange: function (xScale, xTranslate) {
    this._plot.update(xScale, xTranslate);
  }
}

module.exports = Chart
