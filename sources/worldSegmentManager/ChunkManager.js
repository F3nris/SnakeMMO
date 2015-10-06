var RemoteNeighbor = require ("../mainServer/prototypes/RemoteNeighbor.js").RemoteNeighbor;
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
      var player = localScope.players.find(function(el){
        return el.playerID === playerID;
      });
      if (player) {
        player.socket = socket;
      } else {
        localScope.players.push ({
          'playerID': playerID,
          'socket': socket,
          'direction': 0,
          'length': BASE_LENGTH
        });
      }
    });

    socket.on ("incoming-player", function(playerData) {
      var affectedChunk = localScope.chunks.find(function(el){
        return el.id === playerData.chunkID
      });
      var incomingPlayer = localScope.players.find(function(el){
        return el.playerID === playerData.playerID;
      });

      if (incomingPlayer) {
        incomingPlayer.length = playerData.playerLength;
        incomingPlayer.direction = playerData.direction;
      } else {
        incomingPlayer = {
          'playerID': playerData.playerID,
          'direction': playerData.direction,
          'length': playerData.playerLength
        };
        localScope.players.push(incomingPlayer);
      }
      affectedChunk.handleIncomingPlayer(
        playerData.playerID,
        playerData.playerLength,
        playerData.x,
        playerData.y
      );
    });

    socket.on("sync-border", function(data){
      var affectedChunk = localScope.chunks.find(function(el){
        return el.id === data.chunkID;
      });
      affectedChunk.neighborHandler("sync-border",data)
    });

    socket.on('direction-change', function(data){
      var player = localScope.players.find(function(player){
        return data.playerID === player.playerID;
      });

      if (player && !player.movementLocked) {
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

    socket.on('', function(){

    });

    socket.on('disconnect', function(){
      localScope.players = localScope.players.filter(function(player){
        if (player.socket) {
            return player.socket.id != socket.id;
        }
        return false;
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
  //newChunk.copyExistingTiles(chunk.tiles);
  this.chunks.push(newChunk);
}

ChunkManager.prototype.spawnPlayer = function (playerID) {
  var index = Math.floor(Math.random()*this.chunks.length);
  var chunk = this.chunks[index];
  if (chunk) {
    var coordinates = chunk.spawnPlayerAtFreeSpot(playerID, BASE_LENGTH);

    var player = this.players.find (function(el){
      return el.playerID === playerID;
    });
    if (!player) {
      this.players.push({
        'playerID': playerID,
        'direction': 0,
        'length': BASE_LENGTH
      });
    }

    this.mainServerSocket.emit('spawn', {
      'playerID':playerID,
      'x' : coordinates.x,
      'y' : coordinates.y
    });
    var updatedChunk = {
      'id': chunk.id,
      'tiles': {}
    };
    var affectedTileKey = ((coordinates.x-chunk.x)*CHUNK_SIZE) + coordinates.y -chunk.y;
    updatedChunk.tiles[affectedTileKey] = chunk.tiles[affectedTileKey];
    this.playerServerSocket.to(chunk.id.toString()).emit('chunk-update', updatedChunk);
  }
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
  if (neighbor) {
    var neighborID = neighbor.id;
    var currSegmentManager = this.segmentManagers.find(function(el){
      return neighbor.segmentManagerID === el.id;
    });

    if (currSegmentManager.address != this.playerServerAddress) {
      neighbor = new RemoteNeighbor(neighborID, currSegmentManager.address);
    } else {
      neighbor = this.chunks.find (function(el) {
        return el.id === neighborID;
      });
    }
  }
  currentChunk.setBorder(direction, neighbor);
};

ChunkManager.prototype.killPlayer = function (playerID) {
  var localScope = this;
  this.players = this.players.filter(function(el){
    var res = true;
    if (el.playerID !=  playerID) {
      res = true;
    } else {
      for (var j=0; j<localScope.chunks.length; j++) {
        if (el.socket) {
            el.socket.leave(localScope.chunks[j].id);
        }
      }
      res = false;
    }
    return res;
  });
}

module.exports = {
  ChunkManager : ChunkManager
};
