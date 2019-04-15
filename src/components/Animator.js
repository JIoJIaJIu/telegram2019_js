const _ = require('../utils');

function Animator() {
}


/**
 * from { Number }
 * to { Number}
 */
function Animation(p, from, to, node, time) {
  let start = null;
  let prev = node.style[p];
  let animation = {
    time: time,
    start: function () {
    },
    //TODO:
    _start: function (timestamp) {
      if (!start) start = timestamp;
      let diff = timestamp - start
      if (diff < time) {
      }
    }
  }

  return animation;
}

function parallel (l) {
  return {
    start: function (cb) {
      let max = 0;
      _.forEach(l, function (l) {
        l.start()
        max = _.max(l.time, max);
      })

      setTimeout(function () {
        cb && cb();
      }, max)
    }
  }
}


module.exports = {
  Animation: Animation,
  parallel: parallel
};
