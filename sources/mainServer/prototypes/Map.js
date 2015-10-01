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
 function Map () {
   this.chunkID=0;
   this.minSize = 1;
   this.chunks = [];
   this.fillLevel;
 }

/**
 * This method gets called upon the first connected segmentmanager. It will generate
 * the minSize of chunks and add them to the segmentManager that is available.
 */
 Map.prototype.init = function (firstSegmentManager) {
   var loopSize = this.minSize / 2;
   for (var i=0; i<loopSize; i++) {
     for (var j=0; j<loopSize; j++) {
       var c = this.addChunk(this.chunkID++, i*CHUNK_SIZE, j*CHUNK_SIZE, firstSegmentManager.id);
       firstSegmentManager.socket.emit('chunk', c);
     }
   }
 }

/**
 * Adds a Chunk at the respective x/y coordinates and assigns the id of
 * the segmentManager to it.
 */
 Map.prototype.addChunk = function (id, x, y, segmentManagerID) {
   var chunk = new Chunk(id, x, y, segmentManagerID);
   // TODO: chunks sortiert einfügen?
   this.chunks.push(chunk);
   chunk.initBorders(this.chunks);

   return chunk;
 }

exports.Map = Map;
