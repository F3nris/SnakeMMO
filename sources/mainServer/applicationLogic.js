var Client = require('./prototypes/Client.js').Client;
var Map = require('./prototypes/Map.js').Map;

var map;
var players = [];
var segmentManagers = [];
var baseID = 0;

function generateID () {
  return baseID ++;
}

function addClient (type, address, socket) {
  if (type === "player") {
    players.push(new Client("player", generateID(), null, socket, removeClient));
    console.log("Now "+players.length+" player(s) are connected");
  } else if (type === "segmentmanager") {
    segmentManagers.push(new Client("segmentmanager", generateID(), address, socket, removeClient));
    if (segmentManagers.length === 1) {
      // First segmentmanager, init map
      map = new Map();
      map.init(segmentManagers[0]);
    } else {
      // Rearrange chunks, new work power is available
      // TODO: Add functionality
    }
    console.log("Now "+segmentManagers.length+" segmentManager(s) are connected");
  }
}

function removeClient (role, id) {
  if (role === "player") {
    players = filterById(players, id);
    console.log("Now "+players.length+" player(s) are connected");
  } else if (role === "segmentmanager") {
    segmentManagers = filterById(segmentManagers, id);
    console.log("Now "+segmentManagers.length+" segmentManager(s) are connected");
  }
}

function filterById(array, id) {
    return array.filter(function( obj ) {
        return obj.id != id;
    });
}

module.exports = {
  addClient : addClient,
  removeClient : removeClient
};
