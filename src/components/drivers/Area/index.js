const _ = require('../../../utils')
let AreaInteractive = require('../Area/Graph/Interactive')

let AreaGraph = require('./Graph')

function AreaDriver() {
  this.name = 'area';
}

AreaDriver.prototype = {
  draw: function (container, data, options) {
    let graph = new AreaGraph(container, data, options);

    if (options && options.withInteractive) {
      let interactive = new AreaInteractive(graph);
    }
    return graph;
  },

  clean: function () {
  }
}
module.exports = AreaDriver
