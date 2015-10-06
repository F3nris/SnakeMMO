var Chunk = require ("./Chunk.js");
var CHUNK_SIZE = Chunk.CHUNK_SIZE;

Chunk = Chunk.Chunk;

/**
 * This prototype represents the map. There will always be only one map at the
 * time (atleast this is the current idea). The map holds a list of all active
 * chunks and their ids, so that it can be used to look up the segment manager
 * that has the information you are interested in. It also knows the current
 * size of the map.
 * It is also responsible for saving the state of "full- or emptyness" the map is
 * in. This value will be used to determine whether the map's size should be in-
 * creased or decreased (or kept).
 */
 function Map (parent) {
   this.nextChunkID=0;
   this.chunks = [];
   this.fillLevel = 0;
   this.width = 1;
   this.height = 1;
   this.parent = parent;
 }

/**
 * This method gets called upon the first connected segmentmanager. It will generate
 * the minSize of chunks and add them to the segmentManager that is available.
 */
 Map.prototype.init = function () {
   this.addChunk();
};

Map.prototype.rearrangeChunks = function () {
  var segmentManagers = this.parent.segmentManagers;
  var numOfChunks = this.chunks.length;
  var numOfSegmentManagers = segmentManagers.length;
  var numOfAssignedChunks = 0;

  var maxChunksPerSM = Math.ceil(numOfChunks/numOfSegmentManagers);
  console.log("chunks: "+numOfChunks);
  console.log("sms: "+numOfSegmentManagers);
  console.log("MAX: "+maxChunksPerSM);

  for (var i=0; i< numOfSegmentManagers; i++) {
    var currSegmentManager = segmentManagers[i];
    var assignedHere = currSegmentManager.assignedChunks;
    numOfAssignedChunks += assignedHere;
    if (assignedHere < maxChunksPerSM){
      var diff = maxChunksPerSM - assignedHere;
      console.log(numOfAssignedChunks);
      console.log(diff);
      while (diff > 0 && numOfAssignedChunks < numOfChunks){
        console.log("lalal");
        console.log("ID:"+currSegmentManager.id)
        diff--; numOfAssignedChunks++;
        var unassignedChunk = this.chunks.find(function(el){
          return el.segmentManagerID == null;
        });
        if (unassignedChunk) {
          unassignedChunk.segmentManagerID = currSegmentManager.id;
          currSegmentManager.assignedChunks ++;
          currSegmentManager.socket.emit('chunk', unassignedChunk.flatten());
        }
      }
    }
    // TODO Too little

    // TODO Too much
    //for (var j=0; j<)
  }
};

Map.prototype.checkFillness = function() {
  var mapChange = false;
  this.fillLevel = 0;
  for (var i=0; i<this.chunks.length; i++){
    this.fillLevel += this.chunks[i].fillLevel;
  }
  this.fillLevel /= this.chunks.length;
  if (this.fillLevel > 0.05) {
    this.addChunk();
    mapChange = true;
  }
  return mapChange;
};

/**
 * Adds a Chunk at the respective x/y coordinates and assigns the id of
 * the segmentManager to it.
 */
 Map.prototype.addChunk = function () {
   var chunkID = this.nextChunkID++;
   var newChunk = null;
   // Find a free spot in the current dimension
   for (var i=0; i<this.width; i++) {
     for (var j=0; j<this.height; j++) {
       var x = i * CHUNK_SIZE;
       var y = j * CHUNK_SIZE;
       var currentSpotTaken = this.chunks.find(function(el){
         return (el.x === x) && (el.y === y);
       });
       if (!currentSpotTaken) {
         newChunk = new Chunk(chunkID, x, y, null);
       }
     }
   }
   // Current dimension had no free spot, increased dimension
   if (!newChunk) {
     var x = 0;
     var y = 0;
     if (this.width === this.height) {
       this.width ++;
       x = (this.width-1) * CHUNK_SIZE;
     } else {
       this.height ++;
       y = (this.height-1) * CHUNK_SIZE;
     }
     newChunk = new Chunk(chunkID, x, y, null);
   }
   this.chunks.push(newChunk);
   this.rearrangeChunks();
   return newChunk;
 }

Map.prototype.flatten = function () {
  return {
    "nextChunkID" : this.nextChunkID,
    "chunks" : this.chunks,
  };
}

exports.Map = Map;
