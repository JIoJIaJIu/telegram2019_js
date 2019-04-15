const PieGraph = require('./Graph')
let PieInteractive = require('./Graph/Interactive')

function PieDriver(container) {
  this.name = 'pie';
}

PieDriver.prototype = {
  draw: function (container, data, options) {
    let graph = new PieGraph(container, data, options);

    if (options && options.withInteractive) {
      let interactive = new PieInteractive(graph);
      graph.interactive = interactive; // TODO: hack
    }

    return graph;
  }
}

module.exports = PieDriver;
