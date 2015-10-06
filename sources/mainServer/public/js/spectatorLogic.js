var spectator = (function(){
  return {
    CHUNK_SIZE : 25,
    TILE_SIZE : 5,
    localMap : {},
    refMap : {},
    segmentManagers : [],
    init : function() {
      spectator.segmentManagerList = document.getElementById("spectator-legend-content");
      spectator.canvas = document.getElementById("content-canvas");
      spectator.ctx = spectator.canvas.getContext("2d");
      spectator.appleImg = document.getElementById("asset-img-apple");

      spectator.mainServerSocket = io.connect('http://141.45.203.131:4000');
      spectator.mainServerSocket.emit ('introduction', {'role' : 'spectator'});

      spectator.mainServerSocket.on ('segment-managers', function(managers){
        spectator.segmentManagers = managers;
      });

      spectator.mainServerSocket.on ('map', function(map){
        spectator.refMap = map;
        spectator.localMap = {};
        spectator.manageConnections();
      });

      // Start rendering loop
      spectator.render();
    },
    manageConnections : function () {
      spectator.emptySegmentManagerList();

      var chunksSortedBySegmentManager = {};
      var chunks = spectator.refMap.chunks;
      for (var i=0; i<chunks.length; i++) {
        var chunk = chunks[i];
        if (chunksSortedBySegmentManager[chunk.segmentManagerID]) {
          chunksSortedBySegmentManager[chunk.segmentManagerID].push(chunk.id);
        } else {
          chunksSortedBySegmentManager[chunk.segmentManagerID] = [];
          chunksSortedBySegmentManager[chunk.segmentManagerID].push(chunk.id);
        }
      }

      var segmentManagerIDs = Object.keys(chunksSortedBySegmentManager);
      for (var i=0; i<segmentManagerIDs.length; i++) {
        var currentSegmentManager = spectator.segmentManagers.find(function(el){
          return el.id == segmentManagerIDs[i];
        });

        spectator.updateSegmentManagerList(currentSegmentManager.id);

        if (!currentSegmentManager.socket) {
          currentSegmentManager.socket = io.connect(currentSegmentManager.address);
        }
        currentSegmentManager.socket.on('chunk-init', spectator.receiveChunkInit);
        currentSegmentManager.socket.on('chunk-update', spectator.receiveChunkUpdate);

        var currChunks = chunksSortedBySegmentManager[segmentManagerIDs[i]];
        for (var j=0; j<currChunks.length; j++){
          currentSegmentManager.socket.emit('subscribe-chunk', currChunks[j]);
        }
      }
    },
    receiveChunkInit : function (chunk) {
      spectator.localMap[chunk.id] = chunk;
    },
    receiveChunkUpdate : function (chunk) {
      var localTiles = spectator.localMap[chunk.id].tiles;
      var updatedTiles = chunk.tiles;
      var tileKeys = Object.keys(updatedTiles);

      for (var i=0; i<tileKeys.length; i++) {
        var currKey = tileKeys[i];
        if (updatedTiles[currKey]) {
          localTiles[currKey] = updatedTiles[currKey];
        } else {
          delete localTiles[currKey];
        }
      }
    },
    emptySegmentManagerList : function () {
      while (spectator.segmentManagerList.firstChild) {
          spectator.segmentManagerList.removeChild(spectator.segmentManagerList.firstChild);
      }
    },
    updateSegmentManagerList : function (segmentManagerID) {
      var color = visualization.getOrGenerateColor(segmentManagerID);
      var segmentManagerEntry = document.createElement('span');
      segmentManagerEntry.style.color = color;
      segmentManagerEntry.innerHTML = "&#x25A9; SegmentManager "+segmentManagerID;
      spectator.segmentManagerList.appendChild(segmentManagerEntry);
    },
    drawChunk : function (x,y,c) {
      spectator.ctx.save();
      spectator.ctx.globalAlpha = 0.5;
      spectator.ctx.fillStyle = c;
      spectator.ctx.fillRect(x,y,spectator.CHUNK_SIZE, spectator.CHUNK_SIZE);
      spectator.ctx.restore();
    },
    drawSnakeHead : function (x,y,c) {
      spectator.ctx.fillStyle = c;
      spectator.ctx.fillRect(x+0.04,y+0.04,0.92, 0.92);

      spectator.ctx.fillStyle = "#fff";
      spectator.ctx.fillRect(x+0.2, y+0.2, 0.6,0.6);

      spectator.ctx.fillStyle = c;
      spectator.ctx.fillRect(x+0.28,y+0.28,0.44,0.44);
    },
    drawSnakeBodyPart : function (x,y,c) {
      spectator.ctx.fillStyle = c;
      spectator.ctx.fillRect(x+0.08,y+0.08,0.84,0.84);
    },
    drawApple : function (x,y) {
      spectator.ctx.drawImage(this.appleImg, x, y,1,1);
    },
    drawWall : function (x,y) {
      spectator.ctx.fillStyle = "#3f3f3f";
      spectator.ctx.fillRect(x,y,1,1);
    },
    render : function () {
      var keyArray = Object.keys(spectator.localMap);

      spectator.ctx.clearRect(0, 0, 800, 480);
      spectator.ctx.save();
      //spectator.TILE_SIZE = (480 / (keyArray.length/2))/spectator.CHUNK_SIZE;
      spectator.ctx.scale(spectator.TILE_SIZE,spectator.TILE_SIZE);

      for (var i=0; i<keyArray.length; i++) {
        var chunk = spectator.localMap[keyArray[i]];
        var chunkOffsetX = chunk.x;
        var chunkOffsetY = chunk.y;

        var chunkColor = visualization.getOrGenerateColor(chunk.segmentManagerID);
        spectator.drawChunk(chunkOffsetX,chunkOffsetY,chunkColor);

        var tiles = chunk.tiles;
        var tilesKeyArray = Object.keys(tiles);
        for (var j=0; j<tilesKeyArray.length; j++) {
          var currentTile = tiles[tilesKeyArray[j]];
          var currentTileKey = tilesKeyArray[j];

          // calculate coordinates
          var currentX = (chunkOffsetX + Math.floor(currentTileKey / spectator.CHUNK_SIZE));
          var currentY = (chunkOffsetY + (currentTileKey % spectator.CHUNK_SIZE));

          var color = visualization.getOrGenerateColor(currentTile.playerID);

          if (currentTile.type === "body") {
            spectator.drawSnakeBodyPart(currentX, currentY, color);
          } else if (currentTile.type === "head") {
            spectator.drawSnakeHead(currentX, currentY, color);
          } else if (currentTile.type === "apple") {
            spectator.drawApple(currentX, currentY);
          } else if (currentTile.type === "wall") {
            spectator.drawWall(currentX,currentY);
          }
        }
      }

      spectator.ctx.restore();
      window.requestAnimationFrame(spectator.render);
    }
  }
})();
