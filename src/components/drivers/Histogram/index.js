const HistogramGraph = require('./Graph')
let HistogramInteractive = require('./Graph/Interactive')

function HistogramDriver(container) {
  this.name = 'histogram';
}

HistogramDriver.prototype = {
  draw: function (container, data, options) {
    let graph = new HistogramGraph(container, data, options);

    if (options && options.withInteractive) {
      let interactive = new HistogramInteractive(graph);
    }

    return graph;
  }
}

module.exports = HistogramDriver;
