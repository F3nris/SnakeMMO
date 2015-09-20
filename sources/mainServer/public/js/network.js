var network = (function(){
  return {
    mainServerSocket : null,
    map : null,
    segmentManagers : [],
    init : function() {
      network.mainServerSocket = io.connect('http://192.168.0.107:4000');

      // Introduce yourself to the mainServer
      network.mainServerSocket.emit ('introduction', {'role' : 'player'});

      // Receive the map
      network.mainServerSocket.on ('map', function(mapUpdate){
        network.map = mapUpdate;
        //logic.generateLocalMap();
        // TODO network.manageConnections();
      });

      // Receive segmentManagers
      network.mainServerSocket.on ('segment-managers', function(remoteSegmentManagers){
        network.segmentManagers = remoteSegmentManagers;
      });

      network.mainServerSocket.on ('id', function(id) {
        logic.playerID = id;
      });

      network.mainServerSocket.on ('spawn', function(coordinates){
        logic.updateLocalPosition(coordinates);
      });


      network.mainServerSocket.on ('kill', function(){
        logic.kill();
      });

      // Inform player on disconnect
      network.mainServerSocket.on ('disconnect', function(){
        //alert("Disconnected from the server. Maybe reloading the page will help.");
      });
    },
    sendPlay : function (){
      network.mainServerSocket.emit('play');
    },
    sendDirection : function () {
      // send direction change to active chunk
      var segmentManager = network.segmentManagers.find (function(el){
        console.log("EL-ID: "+el.id+" activeChunk-ID: "+logic.activeChunk.segmentManagerID);
        return el.id === logic.activeChunk.segmentManagerID;
      }).socket.emit('direction-change',{
        'playerID':logic.playerID,
        'direction':logic.direction
      });
    },
    prepareConnections : function (sortedChunks) {
      var segmentManagerIDs = Object.keys(sortedChunks);

      for (var i=0; i<segmentManagerIDs.length; i++) {
        var currentSegmentManager = network.segmentManagers.find(function(el){
          return el.id == segmentManagerIDs[i];
        });

        if (!currentSegmentManager.socket) {
          currentSegmentManager.socket = io.connect(currentSegmentManager.address);
        }
        currentSegmentManager.socket.emit('playerID', logic.playerID);
        currentSegmentManager.socket.on('chunk-update', network.receiveChunkUpdate);
        currentSegmentManager.socket.on('position-update', logic.updateLocalPosition);

        for (j in sortedChunks[segmentManagerIDs[i]]){
          currentSegmentManager.socket.emit('subscribe-chunk', j);
        }
      }
    },
    receiveChunkUpdate : function (chunk) {
      logic.localMap[chunk.id] = chunk;
    }
  }
})();
