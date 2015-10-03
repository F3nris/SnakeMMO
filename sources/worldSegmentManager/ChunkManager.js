var ioClientLib = require('socket.io-client');

var Chunk = require ("../mainServer/prototypes/Chunk.js");
var CHUNK_SIZE = Chunk.CHUNK_SIZE;
Chunk = Chunk.Chunk;

var BASE_LENGTH = 4;

function ChunkManager (socket, server, address) {
  this.playerServerSocket = server;
  this.playerServerAddress = address;
  this.mainServerSocket = socket;

  this.chunks = [];
  this.players = [];
  this.segmentManagers = [];

  this.initMainServerSocket();
  this.initPlayerServerSocket();
  this.currentUpdateCycle = 0;
}

ChunkManager.prototype.initMainServerSocket = function() {
  var localScope = this;

  this.mainServerSocket.on('chunk', function(chunk) {
    localScope.addChunk(chunk);
    localScope.updateChunkBorders();
  });

  this.mainServerSocket.on('map', function(map) {
    localScope.map = map;
    localScope.updateChunkBorders();
  });

  this.mainServerSocket.on('update', function() {
    localScope.update();
  });

  this.mainServerSocket.on('segment-managers', function(data) {
    console.log(data);
    localScope.segmentManagers = data;
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
      var chunk = localScope.chunks.find(function(el){
        return el.id == chunkID;
      });
      socket.emit('chunk-init', chunk.flatten());
      socket.join(chunkID);
    });

    socket.on('unsubscribe-chunk', function(chunkID) {
      socket.leave(chunkID);
    });

    socket.on('playerID', function(playerID) {
      if (!localScope.players.find(function(el){
        return el.playerID === playerID;
      })) {
          localScope.players.push ({
            'playerID': playerID,
            'socket': socket,
            'direction': 0,
            'length': BASE_LENGTH
          });
      }
    });

    socket.on ("incoming-player", function(playerData) {
      console.log("lalala");
      console.log(playerData);
    });

    socket.on('direction-change', function(data){
      var player = localScope.players.find(function(player){
        return data.playerID === player.playerID;
      });

      if (!player.movementLocked) {
        player.movementLocked = true;

        var newDirection = data.direction;

        if (player.direction === 1 && (newDirection === 2 || newDirection === 4)) {
          player.direction = newDirection;
        } else if (player.direction === 2 && (newDirection === 1 || newDirection === 3)) {
          player.direction = newDirection;
        } else if (player.direction === 3 && (newDirection === 2 || newDirection === 4)) {
          player.direction = newDirection;
        } else if (player.direction === 4 && (newDirection === 1 || newDirection === 3)) {
          player.direction = newDirection;
        } else if (player.direction === 0) {
          player.direction = newDirection;
        }
      }
    });

    socket.on('disconnect', function(){
      localScope.players = localScope.players.filter(function(player){
        return player.socket.id != socket.id;
      });
    });
  });
}

ChunkManager.prototype.update = function () {
  this.currentUpdateCycle ++;
  // Decrement all ttls
  for (var i=0; i<this.chunks.length; i++) {
    this.chunks[i].updatePositionsAndTTLs(this.players);
  }
  // Unlock the movement of all players
  for (var j=0; j<this.players.length; j++) {
    this.players[j].movementLocked = false;
  }
}

ChunkManager.prototype.addChunk = function (chunk) {
  console.log ("Received a new chunk to manage from mainServer:");
  console.log (" - - - X: "+chunk.x+" Y: "+chunk.y);
  var newChunk = new Chunk(chunk.id, chunk.x, chunk.y, chunk.segmentManagerID, this);
  newChunk.copyExistingTiles(chunk.tiles);
  this.chunks.push(newChunk);
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

ChunkManager.prototype.updateChunkBorders = function() {
  if (this.map) {
    var globalChunks = this.map.chunks;
    for (var i=0; i<this.chunks.length; i++) {
      var currentChunk = this.chunks[i];
      var currentX = currentChunk.x;
      var currentY = currentChunk.y;

      // Check Top Border
      var topNeighbor = globalChunks.find (function(el){
        return (el.x === currentX) && (el.y === (currentY - CHUNK_SIZE));
      });
      this.setNeighbor("top", currentChunk,topNeighbor);

      // Check Bot Border
      var botNeighbor = globalChunks.find (function(el){
        return (el.x === currentX) && (el.y === (currentY + CHUNK_SIZE));
      });
      this.setNeighbor("bot",currentChunk,botNeighbor)

      // Check Top Border
      var leftNeighbor = globalChunks.find (function(el){
        return (el.x === (currentX - CHUNK_SIZE)) && (el.y === currentY);
      });
      this.setNeighbor("left",currentChunk,leftNeighbor)

      // Check Top Border
      var rightNeighbor = globalChunks.find (function(el){
        return (el.x === (currentX + CHUNK_SIZE)) && (el.y === currentY);
      });
      this.setNeighbor("right",currentChunk,rightNeighbor)
    }
  }
}

ChunkManager.prototype.setNeighbor = function (direction, currentChunk, neighbor) {
  var currSegmentManager = null;
  if (neighbor) {
    currSegmentManager = this.segmentManagers.find(function(el){
      return neighbor.segmentManagerID === el.id;
    });

    var neighborHandler = null;
    if (currSegmentManager.address != this.playerServerAddress) {
      var socket = ioClientLib(currSegmentManager.address);
      // TODO add handler for remote chunks

    } else {
      var localNeighbor = this.chunks.find (function(el) {
        return el.id === neighbor.id;
      });
    }
  }
  currentChunk.setBorder(direction, neighbor, localNeighbor);
};

ChunkManager.prototype.killPlayer = function (playerID) {
  var localScope = this;
  this.players = this.players.filter(function(el){
    var res = true;
    if (el.playerID !=  playerID) {
      res = true;
    } else {
      for (var j=0; j<localScope.chunks.length; j++) {
          el.socket.leave(localScope.chunks[j].id);
      }
      res = false;
    }
    return res;
  });
}

module.exports = {
  ChunkManager : ChunkManager
};
