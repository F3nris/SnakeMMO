var logic = (function(){
  return {
    inMenu : true,
    direction : 0, // 0 - still, 1 - up, 2 - right, 3 - down, 4 - left
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
        var moved = true;

        if (key == 37 & logic.direction != 4 & logic.direction != 2) {
          logic.direction = 4;
        } else if (key == 38 & logic.direction != 1 & logic.direction != 3) {
          logic.direction = 1;
        } else if (key == 39 & logic.direction != 2 & logic.direction != 4) {
          logic.direction = 2;
        } else if (key == 40 & logic.direction != 3 & logic.direction != 1) {
          logic.direction = 3;
        } else if (key == 27) {
          // TODO: Send kill to server
          logic.inMenu = true;
        } else {
          moved = false;
          console.log("Tastencode:"+key);
        }

        if (moved) {
          network.sendDirection();
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
      console.log(logic.localPosition);
      // Update Position
      logic.localPosition.x = coordinates.x;
      logic.localPosition.y = coordinates.y;

      // calc active chunk
      var x = Math.floor(logic.localPosition.x/25)*25;
      var y = Math.floor(logic.localPosition.y/25)*25;

      var newActiveChunk = network.map.chunks.filter(function(el){
        return (el.x === x) && (el.y === y);
      })[0];
      console.log(newActiveChunk);
      if (!logic.activeChunk || logic.activeChunk.id != newActiveChunk.id) {
          logic.activeChunk = newActiveChunk;
          // Check if new connections are necessary
          logic.calculateRelevantChunks();
      }
    },
    calculateRelevantChunks : function () {
      var x = Math.floor(logic.localPosition.x/25)*25;
      var y = Math.floor(logic.localPosition.y/25)*25;

      var relevantChunks = network.map.chunks.filter(function(el){
        return (el.x === x || el.x === x+25 || el.x === x-25)
          && (el.y === y || el.y === y+25 || el.y === y-25);
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
    }

  }
})();
