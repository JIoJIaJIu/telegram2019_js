let LineGraph = require('./Graph')
let LineInteractive = require('./Graph/Interactive')

function LineDriver() {
  this.name = 'line';
}

LineDriver.prototype = {
  draw: function (container, data, options) {
    let graph = new LineGraph(container, data, options);

    if (options && options.withInteractive) {
      let interactive = new LineInteractive(graph);
    }

    return graph;
  }
}
module.exports = LineDriver
