
const HOST = ''

function DataProvider() {
  this._data = {}
  this._dataByDays = {}
}

DataProvider.prototype = {
  load: function (id, cb) {
    if (this._data[id])
      return cb && cb(null, this._data[id]);

    let xhr = new XMLHttpRequest();
    let self = this;
    xhr.addEventListener('load', function (e) {
      if (xhr.status !== 200) {
        return cb && cb(xhr.status);
      }

      let data = xhr.response;
      data.id = id;
      self._data[id] = data;
      cb && cb(null, data);
    })

    xhr.open('GET', this._getPath(`${id}/overview.json`));
    xhr.responseType = 'json';
    xhr.send();
  },

  loadByTimestamp: function(id, timestamp, cb) {
    let data = this._dataByDays[id];
    if (!data) {
      data = this._dataByDays[id] = {}
    }

    let date = new Date(timestamp);
    let m = `${date.getMonth() + 1}`;
    m = (m.length === 2) ? m : `0${m}`;
    let prefix = `${date.getFullYear()}-${m}`
    let month = data[prefix];

    if (!month) {
      month = data[prefix] = {}
    }
    let d = `${date.getDate()}`;
    d = (d.length === 2) ? d : `0${d}`;

    data = month[d];
    if (data) {
      return cb(null, data);
    }

    let xhr = new XMLHttpRequest();
    let self = this;
    xhr.addEventListener('load', function (e) {
      if (xhr.status !== 200) {
        return cb && cb(xhr.status);
      }

      let data = xhr.response;
      data.id = id;
      month[d] = data;
      cb && cb(null, data);
    })

    xhr.open('GET', this._getPath(`${id}/${prefix}/${d}.json`));
    xhr.responseType = 'json';
    xhr.send();
  },

  getData: function (id) {
    let data = this._data[id]
    if (!data) {
      throw new Error('Load first data before usage');
    }

    return data
  },

  _getPath: function (path) {
    return `${HOST}${path}`;
  }
}

module.exports = new DataProvider();
