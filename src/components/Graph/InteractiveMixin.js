module.exports = {
  bindKeyboard: function () {
    if (this.__keyboardIsBinded) return;
    this.__keyboardIsBinded = true;
    window.addEventListener('keydown', this.__keyDown);
  },

  unbindKeyboard: function () {
    this.__keyboardIsBinded = false;
    window.removeEventListener('keydown', this.__keyDown);
  },

  __keyDown: function (e) {
    switch (e.keyCode) {
      case 37: // left
        this._graph.selectPrev(this._x);
        break;
      case 39: //right
        this._graph.selectNext(this._x);
        break;
      default:
        break;
    }
  }
};
