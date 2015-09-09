var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var config = require('./config.js');

http.listen(config.IO_PORT);

app.use(express.static('public'));

/*app.get('/', function (req, res) {
  res.send('Hello World!');
});*/

var server = app.listen(config.WEB_SERVER_PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Snake MMO web server is now listening at http://%s:%s', host, port);
});

io.on('connection',function(socket){
  /**
   * When a client connects to the server, it will introduce itself shortly after
   * to declare its role (segmentmanager or player). The server will apply the respective
   * role and use the client accordingly.
   */
  socket.on ('introduction', function(role){
    if (role === "player") {
      console.log("A player connected to the server.");
    } else if (role === "segmentmanager") {
      console.log("A new segmentmanager connected to the server.");
    } else {
      socket.disconnect();
    }
  });
});
