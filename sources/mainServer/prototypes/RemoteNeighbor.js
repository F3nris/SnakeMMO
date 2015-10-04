var ioClientLib = require('socket.io-client');

function RemoteNeighbor (neighborID, address) {
  this.neighborID = neighborID;
  this.address = address;
  this.socket = ioClientLib("http://"+this.address);
}

RemoteNeighbor.prototype.neighborHandler = function(method, data) {
  data.chunkID = this.neighborID;
  if (this.socket.sendBuffer.length > 5) {
    console.log("Komme nicht hinterher!");
  }
  this.socket.emit(method, data);
}

module.exports =  {
  "RemoteNeighbor": RemoteNeighbor
};
