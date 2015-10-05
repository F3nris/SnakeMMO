var logic = (function(){
  return {
    CHUNK_SIZE : 25,
    inMenu : true,
    lastDirectionChange : Date.now(),
    activeChunk : null,
    playerID : null,
    localMap : {},
    localPosition: {},
    init : function() {
      // Init components
      visualization.init();
      network.init();

      // Start rendering loop
      visualization.render();

      // Setup key listener (for game input) & mouse listener for menu control
      window.onkeydown = logic.keyListener;
      visualization.canvas.addEventListener('mousedown', logic.mouseListener);
    },
    keyListener : function (e) {
      if (!logic.inMenu) {
        var key = e.keyCode ? e.keyCode : e.which;
        var direction = 0; // 0 - still, 1 - up, 2 - right, 3 - down, 4 - left

        if (key == 37 & (logic.lastDirectionChange + 250) < Date.now()) {
          direction = 4;
        } else if (key == 38 & (logic.lastDirectionChange + 250) < Date.now()) {
          direction = 1;
        } else if (key == 39 & (logic.lastDirectionChange + 250) < Date.now()) {
          direction = 2;
        } else if (key == 40 & (logic.lastDirectionChange + 250) < Date.now()) {
          direction = 3;
        } else if (key == 27) {
          network.killSelf();
          logic.inMenu = true;
        } else {
          console.log("Tastencode:"+key);
        }

        if (direction != 0) {
          logic.lastDirectionChange = Date.now();
          network.sendDirection(direction);
        }
      }
    },
    mouseListener : function (e) {
      if (logic.inMenu) {
        var rect = visualization.canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        if (x > 250 & x < 550 & y > 200 & y < 300) {
          console.log("Button clicked");
          logic.inMenu = false;
          network.sendPlay();
        }
      }
    },
    updateLocalPosition : function (coordinates) {
      // Update Position
      logic.localPosition.x = coordinates.x;
      logic.localPosition.y = coordinates.y;

      // calc active chunk
      var x = Math.floor(logic.localPosition.x/logic.CHUNK_SIZE)*logic.CHUNK_SIZE;
      var y = Math.floor(logic.localPosition.y/logic.CHUNK_SIZE)*logic.CHUNK_SIZE;

      var newActiveChunk = network.map.chunks.find(function(el){
        return (el.x === x) && (el.y === y);
      });
      if (!logic.activeChunk || logic.activeChunk.id != newActiveChunk.id) {
          logic.activeChunk = newActiveChunk;
          // Check if new connections are necessary
          logic.calculateRelevantChunks();
      }
    },
    calculateRelevantChunks : function () {
      var x = Math.floor(logic.localPosition.x/logic.CHUNK_SIZE)*logic.CHUNK_SIZE;
      var y = Math.floor(logic.localPosition.y/logic.CHUNK_SIZE)*logic.CHUNK_SIZE;

      var relevantChunks = network.map.chunks.filter(function(el){
        return (el.x === x || el.x === x+logic.CHUNK_SIZE || el.x === x-logic.CHUNK_SIZE)
          && (el.y === y || el.y === y+logic.CHUNK_SIZE || el.y === y-logic.CHUNK_SIZE);
      });

      var chunksSortedBySegmentManager = {};
      for (var i=0; i<relevantChunks.length; i++) {
        var chunk = relevantChunks[i];
        if (chunksSortedBySegmentManager[chunk.segmentManagerID]) {
          chunksSortedBySegmentManager[chunk.segmentManagerID].push(chunk.id);
        } else {
          chunksSortedBySegmentManager[chunk.segmentManagerID] = [];
          chunksSortedBySegmentManager[chunk.segmentManagerID].push(chunk.id);
        }
      }

      network.prepareConnections(chunksSortedBySegmentManager);
    },
    kill: function() {
      logic.inMenu = true;
      logic.direction = 0;
      logic.activeChunk = null;
      logic.localMap = {};
      logic.localPosition = {};
    }
  }
})();
