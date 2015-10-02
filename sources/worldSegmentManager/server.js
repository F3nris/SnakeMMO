var ioServer = require('socket.io')();
var ioClient = require('socket.io-client')('http://localhost:4000');
var findPort = require('find-port');
var ip = require('my-local-ip');

var config = require('./config.js');
var ChunkManager = require('./ChunkManager.js').ChunkManager;

var address = "";
findPort(config.IO_PORT_MIN, config.IO_PORT_MAX, function(ports) {
  var ipAdr = ip();
  var port = ports[0];
  address = ipAdr + ":" + port;
  console.log("Starting SegmentManager on Port "+port);
  ioServer.listen(port);
  ioClient.emit("introduction", { 'role': 'segmentmanager', 'ip': ipAdr, 'port': port});

  new ChunkManager(ioClient, ioServer, address);
});
