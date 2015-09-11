var io = require('socket.io')();
var ioClient = require('socket.io-client')('http://localhost:4000');
var findPort = require('find-port');
var ip = require('my-local-ip');

var config = require('./config.js');
var chunkmanager = require('./ChunkManager.js');

findPort(config.IO_PORT_MIN, config.IO_PORT_MAX, function(ports) {
  console.log("Starting SegmentManager on Port "+ports[0]);
  io.listen(ports[0]);
  ioClient.emit("introduction", { 'role': 'segmentmanager', 'ip': ip(), 'port': ports[0]});
});

chunkmanager.init(ioClient);

// Initialize its own server
io.on('connection',function(socket){
  console.log("XD");
});
