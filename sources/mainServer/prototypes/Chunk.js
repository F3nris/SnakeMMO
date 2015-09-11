/**
 * This prototype represents a chunk, which consists of CHUNK_SIZE x CHUNK_SIZE
 * of tiles. Chunks are managed by segmentManagers. They are the essence of the
 * work balancing that will be tried to achieved. So it is wise to chose an
 * appropriate size for them.
 * segmentManagers are able to manage multiple chunks and exchange chunks to
 * rebalance the map.
 */
 function Chunk (id, x, y) {
   this.segmentManagerID = id;
   this.x = x;
   this.y = y;
   this.tiles = [];
 }

module.exports =  {
  Chunk: Chunk,
  CHUNK_SIZE: 25
} ;
