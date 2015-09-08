var express = require('express');
var app = express();

var config = require('./config.js');

app.use(express.static('public'));

/*app.get('/', function (req, res) {
  res.send('Hello World!');
});*/

var server = app.listen(config.SERVER_PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Snake MMO web server is now listening at http://%s:%s', host, port);
});
