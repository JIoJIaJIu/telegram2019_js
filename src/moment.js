const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];

const moment = {
  getRoundHours: function (d) {
    let h = d.getUTCHours();
    let m = d.getUTCMinutes();
    if (m >= 30) h += 1;

    h = h === 24 ? 0 : h;
    h = `${h}`;
    h = (h.length === 2) ? h : `0${h}`;

    return `${h}:00`;
  },

  getRoundHoursWithMinutes: function (d) {
    let h = d.getUTCHours();
    let m = d.getUTCMinutes();

    h = h === 24 ? 0 : h;
    h = `${h}`;
    h = (h.length === 2) ? h : `0${h}`;

    m = `${m}`
    m = (m.length === 2) ? m : `0${m}`;

    return `${h}:${m}`;
  },

  getMonth: function (d) {
    let n = d.getUTCMonth();
    return months[n];
  },

  getMon: function (d) {
    let n = d.getUTCMonth();
    return months[n].substr(0, 3);
  },

  getDay: function (d) {
    let n = d.getUTCDay();
    return days[n].substr(0, 3);
  },
}

module.exports = moment;
