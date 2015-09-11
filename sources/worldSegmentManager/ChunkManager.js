var Chunk = require ("../mainServer/prototypes/Chunk.js");
var CHUNK_SIZE = Chunk.CHUNK_SIZE;
Chunk = Chunk.Chunk;

var mainServerSocket;
var chunks = [];

function init(socket) {
  mainServerSocket = socket;

  mainServerSocket.on('chunk', function(chunk) {
    addChunk(chunk);
  });
}

function addChunk (chunk) {
  console.log ("Received a new chunk to manage from mainServer:");
  console.log (" - - - ID: "+chunk.id+" X: "+chunk.x+" Y: "+chunk.y);
  chunks.push(chunk);
}

module.exports = {
  "init" : init,
  "addChunk" : addChunk
};
