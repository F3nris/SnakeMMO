var Tile = require('./Tile.js').Tile;
/**
 * This prototype represents a chunk, which consists of CHUNK_SIZE x CHUNK_SIZE
 * of tiles. Chunks are managed by segmentManagers. They are the essence of the
 * work balancing that will be tried to achieved. So it is wise to chose an
 * appropriate size for them.
 * segmentManagers are able to manage multiple chunks and exchange chunks to
 * rebalance the map.
 */
 function Chunk (id, x, y, segmentManagerID, parent) {
   this.id = id;
   this.segmentManagerID = segmentManagerID;
   this.x = x;
   this.y = y;
   this.tiles = {};
   this.appleCount = 0;
   this.parent = parent;
 }

 var CHUNK_SIZE = 25;

 Chunk.prototype.setBorder = function (key, neighbor, localNeighbor) {
   var localScope = this;
   var sqChunkSize = CHUNK_SIZE * CHUNK_SIZE;

   var socket = null;
   var isWall = false;
   if (neighbor == undefined) {
     isWall = true;
   }

   switch (key) {
    case "top":
      if (isWall) {
        for (var i=0; i<sqChunkSize; i+=CHUNK_SIZE) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        this.top = {};
        this.topNeighbor = localNeighbor;
      }
      break;
    case "left":
      if (isWall) {
        for (var i=0; i<CHUNK_SIZE; i++) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        this.left = {};
        this.leftNeighbor = localNeighbor;
      }
      break;
    case "bot":
      if (isWall) {
        for (var i=CHUNK_SIZE-1; i<sqChunkSize; i+=CHUNK_SIZE) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        this.bot = {};
        this.botNeighbor = localNeighbor;
      }
      break;
    case "right":
      if (isWall) {
        for (var i=sqChunkSize - CHUNK_SIZE; i<sqChunkSize; i++) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        this.right = {};
        this.rightNeighbor = localNeighbor;
      }
      break;
   }
 }

 Chunk.prototype.copyExistingTiles = function (existingTiles) {
   this.tiles = existingTiles;
 }

 Chunk.prototype.spawnPlayerAtFreeSpot = function(playerID, length) {
   //console.log(this.chunks);
   var coordinates = { 'x' : null, 'y' : null };
   var sqChunkSize = CHUNK_SIZE * CHUNK_SIZE;

   if (Object.keys(this.tiles).length < sqChunkSize) {
     // A spot is free, try to find it
     for (var i=0; i<sqChunkSize; i++) {
       if (!this.tiles[i]) {
         this.tiles[i] = new Tile("head",playerID,length);

         var x = Math.floor(i/CHUNK_SIZE);
         var y = i % CHUNK_SIZE;

         coordinates.x = x+this.x; coordinates.y = y+this.y;
         return coordinates;
       }
     }
   }
   return coordinates;
 };

 Chunk.prototype.updatePositionsAndTTLs = function (players) {
   var tileKeys = Object.keys(this.tiles);

   var updatedChunk = {
     'id': this.id,
     'tiles': {}
   };

   if (players.length > (this.appleCount * 0.5)) {
     this.spawnApple(updatedChunk);
   }

   for (var i=0; i<tileKeys.length; i++) {
     var currentTileKey = tileKeys[i];
     var currentTile = this.tiles[currentTileKey];
     var currentPlayerID = currentTile.playerID;

     var currentPlayer = players.find(function(player){
       return currentPlayerID === player.playerID;
     });

     if (currentTile.type === "body") {
       if (this.decreaseTTL(currentTile) || !currentPlayer) {
         updatedChunk.tiles[currentTileKey] = null;
         delete this.tiles[currentTileKey];
       }
     } else if (currentTile.type === "head") {
       if (!currentPlayer) {
         updatedChunk.tiles[currentTileKey] = null;
         delete this.tiles[currentTileKey];
       } else {
         // Update Position
         this.updateSnakeHead(currentPlayer, currentTile, currentTileKey, updatedChunk);
       }
     }
   }

   this.parent.playerServerSocket.to(this.id.toString()).emit('chunk-update', updatedChunk);
 };

 Chunk.prototype.updateSnakeHead = function (currentPlayer, currentTile, currentTileKey, updatedChunk) {
   var moved = true;
   var currentX = Math.floor(currentTileKey/CHUNK_SIZE);
   var currentY = currentTileKey % CHUNK_SIZE;

   switch (currentPlayer.direction) {
     case 0:
      moved = false;
      break;
     case 1:
      currentY--;
      break;
     case 2:
      currentX++;
      break;
     case 3:
      currentY++;
      break;
     case 4:
      currentX--;
      break;
   }

   if (moved) {
     var affectedTile = this.checkCollision(currentPlayer, currentX, currentY);
     if (!affectedTile.collision) {
       if (!affectedTile.foreignOrigin) {
         var newKey = (currentX*CHUNK_SIZE)+currentY ;
         var t = new Tile(
           "head",
           currentPlayer.playerID,
           currentPlayer.length
         );
         updatedChunk.tiles[newKey] = t;
         this.tiles[newKey] = t;

         currentPlayer.socket.emit('position-update', {
           'playerID': currentPlayer.playerID,
           'x': currentX + this.x,
           'y': currentY + this.y
         });
       } else {
         var foreignX = (currentX + CHUNK_SIZE) % CHUNK_SIZE;
         var foreignY = (currentY + CHUNK_SIZE) % CHUNK_SIZE;
         console.log("FX: "+foreignX+" FY: "+foreignY)

         console.log("Outgoing ID: "+this.id);
         this[affectedTile.foreignOrigin+"Neighbor"].neighborHandler("incoming-player", {
           'playerID': currentPlayer.playerID,
           'playerLength': currentPlayer.length,
           'x': foreignX,
           'y': foreignY
         });
       }
     }

     // Make a body where the head was
     if (this.decreaseTTL(currentTile)) {
       updatedChunk.tiles[currentTileKey] = null;
       delete this.tiles[currentTileKey];
     } else {
       currentTile.type = "body";
       updatedChunk.tiles[currentTileKey] = currentTile;
     }
   }
 }

 Chunk.prototype.neighborHandler = function (method, data) {
   switch (method) {
     case "incoming-player":
      this.handleIncomingPlayer(data.playerID, data.playerLength, data.x, data.y);
      break;
   }
 }

 Chunk.prototype.handleIncomingPlayer = function (playerID, playerLength, x, y) {
   var affectedTileKey = x * CHUNK_SIZE + y;
   if (this.tiles[affectedTileKey] && this.tiles[affectedTileKey].type === "apple") {
     this.appleCount --;
   }
   console.log ("Incomin id: "+this.id);
   this.tiles[affectedTileKey] = new Tile("head",playerID,playerLength);
 }

 Chunk.prototype.decreaseTTL = function (tile) {
   var deleteTile = false;
   if (tile.ttl > 0) {
     tile.ttl --;
     if (tile.ttl === 0) {
       deleteTile = true;
     }
   }
   return deleteTile;
 }

 Chunk.prototype.checkCollision = function (currentPlayer, currentX, currentY) {
   var affectedTile = this.getCollidingTile(currentX, currentY);
   affectedTile.collision = false;

   if (affectedTile.tile) {
     // Collectable, no real collsion
     if (affectedTile.tile.type === "apple") {
       currentPlayer.length ++;
       if (!affectedTile.foreignOrigin) {
          this.appleCount--;
       }
     } else { // Bad news, you hit something
       affectedTile.collision = true;
       this.parent.mainServerSocket.emit('kill', currentPlayer.playerID);
     }
   }

   return affectedTile;
 }

 Chunk.prototype.getCollidingTile = function (currentX, currentY) {
   var affectedTile = {};
   if (currentX >=0 && currentX < CHUNK_SIZE && currentY >=0 && currentY < CHUNK_SIZE) {
     // Affected Tile is within Chunk
     var tileKey = (currentX * CHUNK_SIZE) + currentY;
     affectedTile.tile = this.tiles[tileKey];
     affectedTile.foreignOrigin = false;
   } else {
     console.log("X:"+currentX);
     console.log("Y:"+currentY);
     if (currentX >= 0 && currentX < CHUNK_SIZE && currentY < 0) { // Top
        affectedTile.tile = this.top[currentX];
        affectedTile.foreignOrigin = "top";
     } else if (currentX >= 0 && currentX < CHUNK_SIZE && currentY >= CHUNK_SIZE) { // bot
        affectedTile.tile = this.bot[currentX];
        affectedTile.foreignOrigin = "bot";
     } else if (currentX < 0 && currentY >= 0 && currentY < CHUNK_SIZE) { // left
        affectedTile.tile = this.left[currentY];
        affectedTile.foreignOrigin = "left";
     } else if (currentX >= CHUNK_SIZE && currentY >= 0 && currentY < CHUNK_SIZE) { // right
        affectedTile.tile = this.right[currentY];
        affectedTile.foreignOrigin = "right";
     }
   }
   return affectedTile;
 }

 Chunk.prototype.spawnApple = function (updatedChunk) {
   var index = Math.floor(Math.random() * CHUNK_SIZE * CHUNK_SIZE);
   if (!this.tiles[index]) {
     var apple = new Tile("apple",null, -1);
     this.tiles[index] = apple;
     updatedChunk.tiles[index] = apple;
     this.appleCount ++;
   }
 }

 Chunk.prototype.flatten = function () {
   return {
     id : this.id,
     segmentManagerID : this.segmentManagerID,
     x : this.x,
     y : this.y,
     tiles: this.tiles
   }
 }

module.exports =  {
  Chunk: Chunk,
  CHUNK_SIZE: CHUNK_SIZE
} ;
