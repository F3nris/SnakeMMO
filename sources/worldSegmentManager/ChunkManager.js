var Chunk = require ("../mainServer/prototypes/Chunk.js");
var CHUNK_SIZE = Chunk.CHUNK_SIZE;
Chunk = Chunk.Chunk;

var BASE_LENGTH = 4;

function ChunkManager (socket, server) {
  this.playerServerSocket = server;
  this.mainServerSocket = socket;

  this.chunks = [];
  this.players = [];

  this.initMainServerSocket();
  this.initPlayerServerSocket();
}

ChunkManager.prototype.initMainServerSocket = function() {
  var localScope = this;

  this.mainServerSocket.on('chunk', function(chunk) {
    localScope.addChunk(chunk);
  });

  this.mainServerSocket.on('update', function() {
    localScope.update();
  });

  this.mainServerSocket.on('spawn', function(playerID){
    localScope.spawnPlayer(playerID);
  });

  this.mainServerSocket.on('kill', function(playerID) {
    localScope.killPlayer(playerID);
  });
}

ChunkManager.prototype.initPlayerServerSocket = function() {
  var localScope = this;
  // Initialize its own server
  this.playerServerSocket.on('connection',function(socket){
    console.log("A player connected");

    socket.on('subscribe-chunk', function(chunkID) {
      socket.join(chunkID);
    });

    socket.on('unsubscribe-chunk', function(chunkID) {
      socket.leave(chunkID);
    });

    socket.on('playerID', function(playerID) {
      if (!localScope.players.find(function(el){
        return el.playerID === playerID;
      })) {
          localScope.players.push ({'playerID': playerID, 'socket': socket, 'direction': 0, 'length': BASE_LENGTH});
      }
    });

    socket.on('direction-change', function(data){
      var player = localScope.players.find(function(player){
        return data.playerID === player.playerID;
      });

      var newDirection = data.direction;
      if (player.direction === 1 && (newDirection === 2 || newDirection === 4)) {
        player.direction = newDirection;
      } else if (player.direction === 2 && (newDirection === 1 || newDirection === 3)) {
        player.direction = newDirection;
      } else if (player.direction === 3 && (newDirection === 2 || newDirection === 4)) {
        player.direction = newDirection;
      } else if (player.direction === 4 && (newDirection === 1 || newDirection === 3)) {
        player.direction = newDirection;
      }
    });

    socket.on('disconnect', function(){
      console.log("SocketID: "+socket.id);
      localScope.players = localScope.players.filter(function(player){
        return player.socket.id != socket.id;
      });
    });
  });
}

ChunkManager.prototype.update = function () {
  // Decrement all ttls
  for (var i=0; i<this.chunks.length; i++) {
    this.chunks[i].updatePositionsAndTTLs(this.players);
  }

  // Send updated Chunks to clients
  for (var i=0; i<this.chunks.length; i++){
    this.playerServerSocket.to(this.chunks[i].id.toString()).emit('chunk-update', this.chunks[i].flatten());
  }
}

ChunkManager.prototype.addChunk = function (chunk) {
  console.log ("Received a new chunk to manage from mainServer:");
  console.log (" - - - X: "+chunk.x+" Y: "+chunk.y);
  this.chunks.push(new Chunk(chunk.id, chunk.x, chunk.y, chunk.segmentManagerID, this));
}

ChunkManager.prototype.spawnPlayer = function (playerID) {
  var index = Math.floor(Math.random()*this.chunks.length);
  var chunk = this.chunks[index];
  var coordinates = chunk.spawnPlayerAtFreeSpot(playerID, BASE_LENGTH);

  this.mainServerSocket.emit('spawn', {
    'playerID':playerID,
    'x' : coordinates.x,
    'y' : coordinates.y
  });
}

ChunkManager.prototype.killPlayer = function (playerID) {
  this.players = this.players.filter(function(el){
    return el.playerID !=  playerID;
  });
}

module.exports = {
  ChunkManager : ChunkManager
};
