var Chunk = require ("../mainServer/prototypes/Chunk.js");
var CHUNK_SIZE = Chunk.CHUNK_SIZE;
Chunk = Chunk.Chunk;

var BASE_LENGTH = 3;

var mainServerSocket;
var playerServerSocket;

var chunks = [];
var players = [];

function init(socket, server) {
  playerServerSocket = server;
  mainServerSocket = socket;

  initMainServerSocket();
  initPlayerServerSocket();
}

function initMainServerSocket () {
  mainServerSocket.on('chunk', function(chunk) {
    //console.log(chunk);
    addChunk(chunk);
  });

  mainServerSocket.on('update', function() {
    update();
  });

  // Spawn a player
  mainServerSocket.on('spawn', function(playerID){
    spawnPlayer(playerID);
  });
}

function initPlayerServerSocket() {
  // Initialize its own server
  playerServerSocket.on('connection',function(socket){
    console.log("A player connected");

    socket.on('subscribe-chunk', function(chunkID) {
      socket.join(chunkID);
    });

    socket.on('unsubscribe-chunk', function(chunkID) {
      socket.leave(chunkID);
    });

    socket.on('playerID', function(playerID) {
      players.push ({'playerID': playerID, 'socket': socket, 'direction': 0, 'length': BASE_LENGTH});
    });

    socket.on('direction-change', function(data){
      players.find(function(player){
        return data.playerID === player.playerID;
      }).direction = data.direction;
    });

    socket.on('disconnect', function(){
      console.log("SocketID: "+socket.id);
      players = players.filter(function(player){
        return player.socket.id != socket.id;
      });
    });
  });
}

function update () {
  // Decrement all ttls
  for (var i=0; i<chunks.length; i++) {
    chunks[i].updatePositionsAndTTLs(players);
  }

  // Send updated Chunks to clients
  for (var i=0; i<chunks.length; i++){
    playerServerSocket.to(chunks[i].id.toString()).emit('chunk-update', chunks[i]);
  }
}

function addChunk (chunk) {
  console.log ("Received a new chunk to manage from mainServer:");
  console.log (" - - - X: "+chunk.x+" Y: "+chunk.y);
  chunks.push(new Chunk(chunk.id, chunk.x, chunk.y, chunk.segmentManagerID));
}

function spawnPlayer(playerID) {
  var index = Math.floor(Math.random()*chunks.length);
  console.log("index: "+index+" length:"+chunks.length);
  var chunk = chunks[index];
  var coordinates = chunk.spawnPlayerAtFreeSpot(playerID, BASE_LENGTH);
  mainServerSocket.emit('spawn', {
    'playerID':playerID,
    'x' : coordinates.x,
    'y' : coordinates.y
  });
}

module.exports = {
  "init" : init,
  "addChunk" : addChunk
};
