let fs = require('fs');
let path = require('path');

let prefix = [
  '2018-04',
  '2018-05',
  '2018-06',
  '2018-07',
  '2018-08',
  '2018-09',
  '2018-10',
  '2018-11',
  '2018-12',
  '2019-01',
  '2019-02',
  '2019-03',
  '2019-04'
]
prefix.forEach(function (prefix) {
  for (let i = 0; i < 31; i++) {
    try {
      let s = `${i}`
      if (s.length == 1) s = `0${i}`;
      let content = fs.readFileSync(`./server/data/5/${prefix}/${s}.json`);
      let j = JSON.parse(content);
      j = convertJSON(j);
      fs.writeFileSync(`./server/data/5/${prefix}/${s}.json`, JSON.stringify(j))
    } catch {}
  }
})

function convertJSON(j) {
  delete j.colors.y6;
  delete j.names.y6;
  delete j.colors.y6;
  delete j.types.y6;

  j.columns = j.columns.slice(0, 7);
  for (let k in j.types) {
    if (j.types[k] === 'x') continue;
    j.types[k] = 'pie';
  }
  return j;
}
