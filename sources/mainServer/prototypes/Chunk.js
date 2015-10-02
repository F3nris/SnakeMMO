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

 Chunk.prototype.checkBorders = function (chunks) {
   // TODO: check for neighbours
   this.setBorder("top",true);
   this.setBorder("bot",true);
   this.setBorder("left",true);
   this.setBorder("right",true);
 }

 Chunk.prototype.setBorder = function (key, isWall) {
   var sqChunkSize = CHUNK_SIZE * CHUNK_SIZE;

   switch (key) {
    case "top":
      if (isWall || isWall == undefined) {
        for (var i=0; i<sqChunkSize; i+=CHUNK_SIZE) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        // TODO: synchronized top border
      }
      break;
    case "left":
      if (isWall || isWall == undefined) {
        for (var i=0; i<CHUNK_SIZE; i++) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        // TODO: synchronized top border
      }
      break;
    case "bot":
      if (isWall || isWall == undefined) {
        for (var i=CHUNK_SIZE-1; i<sqChunkSize; i+=CHUNK_SIZE) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        // TODO: synchronized top border
      }
      break;
    case "right":
      if (isWall || isWall == undefined) {
        for (var i=sqChunkSize - CHUNK_SIZE; i<sqChunkSize; i++) {
          this.tiles[i] = new Tile("wall",null);
        }
      } else {
        // TODO: synchronized top border
      }
      break;

   }
 }

 Chunk.prototype.copyExistingTiles = function (existingTiles) {
   this.tiles = existingTiles;
 }

 Chunk.prototype.spawnPlayerAtFreeSpot = function(playerID, length) {
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
     if (!this.checkCollision(currentPlayer, currentX, currentY)) {
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
   var collision = false;
   var tileKey = (currentX * CHUNK_SIZE) + currentY;
   // TODO check Neighbors if x > CHUNK_SIZE oder x < 0
   // TODO check Neighbors if y > CHUNK_SIZE oder y < 0
   var affectedTile = this.tiles[tileKey];
   if (affectedTile) {
     console.log(affectedTile);
     // Collectable, no real collsion
     if (affectedTile.type === "apple") {
       currentPlayer.length ++;
       this.appleCount--;
     } else { // Bad news, you hit something
       // TODO: Kill, Callback needed!
       collision = true;
       this.parent.mainServerSocket.emit('kill', currentPlayer.playerID);
     }
   }
   return collision;
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
