var botManager = (function(){
  return {
    DIRECTION : {
      "1" : "top",
      "2" : "right",
      "3" : "bot",
      "4" : "left",
      "0" : null
    },
    CHUNK_SIZE : 25,
    botsRunning : false,
    localMap : {},
    refMap : {},
    segmentManagers : [],
    bots : [],
    init : function() {
      botManager.console = document.getElementById("bot-console");
      botManager.autoRespawnInput = document.getElementById("input-auto-respawn");
      botManager.numOfBotsInput = document.getElementById("input-num-of-bots");
      botManager.button = document.getElementById("btn-spawn-kill");

      botManager.mainServerSocket = io.connect('http://192.168.0.102:4000');
      botManager.mainServerSocket.emit ('introduction', {'role' : 'bot-manager'});

      botManager.mainServerSocket.on ('segment-managers', function(managers){
        botManager.segmentManagers = managers;
      });

      botManager.mainServerSocket.on ('map', function(map){
        botManager.refMap = map;
        botManager.manageConnections();
      });

      botManager.mainServerSocket.on ('bot-id', function(botID){
        botManager.bots.push({
            'botID': botID,
            'direction': 0
        });
        for (var j=0; j<botManager.segmentManagers.length; j++) {
          botManager.segmentManagers[j].socket.emit('playerID', botID);
        }
      });

      botManager.mainServerSocket.on('possible-bot-spawn', function(coordinates){
        var bot = botManager.bots.find(function(el){
          return el.botID === coordinates.playerID;
        });
        if (bot) {
          bot.x = coordinates.x;
          bot.y = coordinates.y;
        }
      });

      botManager.mainServerSocket.on('possible-bot-death', function(id){
        botManager.bots = botManager.bots.filter(function(el){
          return el.botID != id;
        });
      });

      botManager.mainServerSocket.on('update', function(){
        botManager.updateBots();
      });
    },
    updateBots : function () {
      var loopSize = botManager.bots.length;
      for (var i=0; i<loopSize; i++) {
        var currBot = botManager.bots[i];

        var x = Math.floor(currBot.x/botManager.CHUNK_SIZE)*botManager.CHUNK_SIZE;
        var y = Math.floor(currBot.y/botManager.CHUNK_SIZE)*botManager.CHUNK_SIZE;

        var currRefChunk = botManager.refMap.chunks.find(function(el){
          return (el.x === x) && (el.y === y);
        });
        var currChunk = botManager.localMap[currRefChunk.id];

        var newDirection = null;
        var collider = botManager.checkCollsion(currChunk,currBot);

        // Needs to change direction or chooses to by chance
        var rollTheDice = (Math.random() < 0.4);
        var tmpDirection = botManager.DIRECTION[currBot.direction];

        if ((tmpDirection && collider[tmpDirection]) || rollTheDice) {
          var directions = [1,2,3,4];
          for (var j=0; j<4; j++) {
            var rngDir = directions.splice(Math.floor(Math.random()*directions.length),1)[0];
            tmpDirection = collider[botManager.DIRECTION[rngDir]];
            var secondCriterium = currBot.direction + 2;
            if (secondCriterium>4) {
              secondCriterium = secondCriterium % 4;
            }
            if (!tmpDirection && currBot.direction != rngDir && rngDir != secondCriterium) {
              currBot.direction = rngDir;
              newDirection = rngDir;
              break;
            }
          }
        }


        if (newDirection != null) {
          var responsibleSM = botManager.segmentManagers.find(function(el){
            return el.id === currChunk.segmentManagerID;
          });
          responsibleSM.socket.emit('direction-change', {
            'playerID':currBot.botID,
            'direction':newDirection
          });
        }


      }
      //setTimeout(botManager.updateBots,225);
    },
    checkCollsion : function (currChunk, currBot) {
      var collider = {
        "top" : true,
        "bot" : true,
        "left" : true,
        "right": true
      };
      var x = currBot.x - currChunk.x;
      var y = currBot.y - currChunk.y;

      var tmpY = y-1;
      // Top
      if (tmpY >= 0 && (!currChunk.tiles[x*botManager.CHUNK_SIZE+tmpY] || currChunk.tiles[x*botManager.CHUNK_SIZE+tmpY].type==="apple")) {
        collider.top = false;
      } else if (tmpY < 0 && (!currChunk.top[x] || currChunk.top[x].type === "apple")) {
        collider.top = false;
      }

      tmpY = y+1;
      // Bot
      if (tmpY < botManager.CHUNK_SIZE && (!currChunk.tiles[x*botManager.CHUNK_SIZE+tmpY] || currChunk.tiles[x*botManager.CHUNK_SIZE+tmpY].type==="apple")) {
        collider.bot = false;
      } else if (tmpY >= botManager.CHUNK_SIZE && (!currChunk.bot[x] || currChunk.bot[x].type === "apple")) {
        collider.bot = false;
      }

      var tmpX = x+1;
      // right
      if (tmpX < botManager.CHUNK_SIZE && (!currChunk.tiles[tmpX*botManager.CHUNK_SIZE+y] || currChunk.tiles[tmpX*botManager.CHUNK_SIZE+y].type==="apple")) {
        collider.right = false;
      } else if (tmpX >= botManager.CHUNK_SIZE && (!currChunk.right[y] || currChunk.right[y].type === "apple")) {
        collider.right = false;
      }

      tmpX = x-1;
      // left
      if (tmpX >= 0 && (!currChunk.tiles[tmpX*botManager.CHUNK_SIZE+y] || currChunk.tiles[tmpX*botManager.CHUNK_SIZE+y].type==="apple")) {
        collider.left = false;
      } else if (tmpX < 0 && (!currChunk.left[y] || currChunk.left[y].type === "apple")) {
        collider.left = false;
      }

      return collider;
    },
    manageConnections : function () {
      var chunksSortedBySegmentManager = {};
      var chunks = botManager.refMap.chunks;
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
        var currentSegmentManager = botManager.segmentManagers.find(function(el){
          return el.id == segmentManagerIDs[i];
        });

        if (!currentSegmentManager.socket) {
          currentSegmentManager.socket = io.connect(currentSegmentManager.address);
        }
        currentSegmentManager.socket.on('chunk-init', botManager.receiveChunkInit);
        currentSegmentManager.socket.on('chunk-update', botManager.receiveChunkUpdate);
        currentSegmentManager.socket.on('position-update', botManager.updateLocalPosition);

        var currChunks = chunksSortedBySegmentManager[segmentManagerIDs[i]];
        for (var j=0; j<currChunks.length; j++){
          currentSegmentManager.socket.emit('subscribe-chunk', currChunks[j]);
        }
      }
    },
    receiveChunkInit : function (chunk) {
      botManager.localMap[chunk.id] = chunk;
    },
    receiveChunkUpdate : function (chunk) {
      var localTiles = botManager.localMap[chunk.id].tiles;
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
    buttonHandler : function () {
      if (botManager.botsRunning) {
        botManager.button.innerHTML = "Spawn Bots";
        var bots = botManager.bots;
        for (var i=0; i<bots.length; i++) {
          botManager.mainServerSocket.emit("kill",bots[i].botID);
        }
        botManager.bots = [];
      } else {
        botManager.button.innerHTML = "Kill running Bots";
        var numOfBots = botManager.numOfBotsInput.value || 5;
        botManager.spawnBots(numOfBots);
      }
      botManager.botsRunning = !botManager.botsRunning;
    },
    spawnBots : function (numOfBots) {
      var autoRespawn = botManager.autoRespawnInput.checked;

      if (numOfBots > 0) {
        botManager.mainServerSocket.emit('spawn-bot');
        numOfBots--;
        setTimeout(function(){
          botManager.spawnBots(numOfBots);
        }, 50);
      }
    },
    updateLocalPosition : function (coordinates) {
      var bot = botManager.bots.find(function(el){
        return coordinates.playerID === el.botID;
      });
      if (bot) {
        bot.x = coordinates.x;
        bot.y = coordinates.y;
      }
    }
  }
})();
