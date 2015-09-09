var io = require('socket.io')();
var ioClient = require('socket.io-client')('http://localhost:4000');
var findPort = require('find-port');

var config = require('./config.js');

findPort(config.IO_PORT_MIN, config.IO_PORT_MAX, function(ports) {
  console.log("Starting SegmentManager on Port "+ports[0]);
  io.listen(ports[0]);
});

ioClient.emit("introduction", "segmentmanager");

// Initialize its own server
io.on('connection',function(socket){
  console.log("XD");
});
