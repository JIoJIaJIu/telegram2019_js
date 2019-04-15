process.env.NODE_ENV = 'development'
let express = require('express');
let webpackDevMiddleware = require('webpack-dev-middleware')
let webpack = require('webpack');

let app = express();
let config = require('../webpack.config.js')

const PORT = 8080;

let compiler = webpack(config);

let middleware = webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
});
app.use(middleware);

app.get('/:graph_id/overview.json', function (req, res) {
  let graphId = req.params.graph_id;
  let json;
  try {
    json = require(`./data/${graphId}/overview.json`)
  } catch (e) {
    return res.status(404).end()
  }

  res.send(json);
})

app.get('/:graph_id/:date/:day.json$', function (req, res) {
  let graphId = req.params.graph_id;
  let date = req.params.date;
  let day = req.params.day;
  let json;
  try {
    json = require(`./data/${graphId}/${date}/${day}.json`)
  } catch (e) {
    return res.status(404).end()
  }

  res.send(json);
})

app.listen(PORT, function () {
  console.log(`Server has been started at ${PORT}`);
})
