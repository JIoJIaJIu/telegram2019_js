require('./base.scss')

const _ = require('./utils')
const Chart = require('./components/Chart');
const dataProvider = require('./data/DataProvider');

let mode = 0
const modes = ['light', 'dark'];


window.addEventListener('load', () => {
  let chart1 = new Chart('.g1');
  dataProvider.load(1, function (err, data) {
    if (err) return;
    chart1.draw(data, { title: 'Followers' });
  })

  let chart2 = new Chart('.g2');
  dataProvider.load(2, function (err, data) {
    if (err) return;
    chart2.draw(data, { title: 'Interactions' });
  })


  let chart3 = new Chart('.g3');
  dataProvider.load(3, function (err, data) {
    if (err) return;

    chart3.determineDriver(data);
    chart3.draw(data, { title: 'Messages' });
  })

  let chart4 = new Chart('.g4');
  dataProvider.load(4, function (err, data) {
    if (err) return;

    chart4.determineDriver(data);
    chart4.draw(dataProvider.getData(4), { title: 'Views' });
  })

  let chart5 = new Chart('.g5');
  dataProvider.load(5, function (err, data) {
    if (err) return;

    chart5.determineDriver(data);
    chart5.draw(dataProvider.getData(5), { title: 'Apps' });
  })

  let modeSwitcher = document.querySelector('#mode-switcher');
  setModeSwitcherText();
  modeSwitcher.addEventListener('click', function (e) {
    e.preventDefault();
    if (mode  === 0) {
      _.addClass(document.body, 'dark');
      mode = 1;
    } else {
      _.removeClass(document.body, 'dark');
      mode = 0;
    }
    setModeSwitcherText();
  })
  function setModeSwitcherText() {
    let text = 'Switch to';
    text += mode === 0 ? ' Night Mode' : ' Day Mode';
    modeSwitcher.innerHTML = text;
  }
});
