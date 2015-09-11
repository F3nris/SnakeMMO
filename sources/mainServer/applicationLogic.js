var Client = require('./prototypes/Client.js').Client;

var players = [];
var segmentManagers = [];
var baseID = 0;

function generateID () {
  return baseID ++;
}

function addClient (type, address, socket) {
  if (type === "player") {
    players.push(new Client(generateID(), null, socket));
  } else if (type === "segmentmanager") {
    segmentManagers.push(new Client(generateID(), address, socket));
  }
}

module.exports = {
  addClient : addClient
};
