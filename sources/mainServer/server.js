var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var config = require('./config.js');

http.listen(config.IO_PORT);

app.use(express.static('public'));
app.listen(config.WEB_SERVER_PORT);
console.log('Snake MMO web server is now listening at Port '+ config.WEB_SERVER_PORT);

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
