/**
 * This is the prototype for a tile, the smallest entity in the game, which
 * can be either empty, an apple, a players head or a players body part.
 * This prototype is designed to save the respective information.
 *
 * Type: "body" | "apple" | "head"
 */
function Tile (type, id, ttl) {
  this.type = type;
  this.playerID = id;
  this.ttl = ttl || -1;
}

exports.Tile = Tile;
