const StackedHistogramGraph = require('./Graph')
let HistogramInteractive = require('../Histogram/Graph/Interactive')

function StackedHistogramDriver(container) {
  this.name = 'stackedHistogram';
}

StackedHistogramDriver.prototype = {
  draw: function (container, data, options) {
    let graph = new StackedHistogramGraph(container, data, options);

    if (options && options.withInteractive) {
      let interactive = new HistogramInteractive(graph);
    }
    return graph;
  }
}

module.exports = StackedHistogramDriver;
