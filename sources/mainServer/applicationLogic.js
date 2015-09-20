var gameloop = require('node-gameloop');

var Player = require('./prototypes/Player.js').Player;
var SegmentManager = require('./prototypes/SegmentManager.js').SegmentManager;
var Map = require('./prototypes/Map.js').Map;
var config = require('./config.js');

function ApplicationLogic(io) {
  this.map= {};
  this.io = io;

  this.players = [];
  this.segmentManagers = [];
  this.flattenedSegmentManagers = [];

  this.baseID = 0;
  this.gameLoopID = null;

  this.init();
}

ApplicationLogic.prototype.init = function () {
  var localScope = this;

  this.io.on('connection',function(socket){
    socket.on ('introduction', function(data){
      if (data.role === "player") {
        console.log("A player connected to the server.");
        localScope.addClient("player", null, socket);
      } else if (data.role === "segmentmanager") {
        console.log("A new segmentmanager connected to the server.");
        localScope.addClient("segmentmanager", data.ip + ':' + data.port, socket);
      } else {
        socket.disconnect();
      }
    });
  });

  this.gameLoopID = gameloop.setGameLoop(function(delta) {
    for (var i=0; i<localScope.segmentManagers.length; i++) {
      localScope.segmentManagers[i].socket.emit('update');
    }
  }, config.HEARTBEAT);
};

ApplicationLogic.prototype.generateID = function () {
  return this.baseID ++;
};

ApplicationLogic.prototype.addClient = function (type, address, socket) {
  if (type === "player") {
    var newPlayer = new Player(this.generateID(), socket, this);

    // send map and segmentManagers
    socket.emit('map', this.map);
    socket.emit('segment-managers',this.flattenedSegmentManagers);

    this.players.push(newPlayer);
    console.log("Now "+this.players.length+" player(s) are connected");
  } else if (type === "segmentmanager") {
    var newSegmentmanager = new SegmentManager(this.generateID(), address, socket, this);
    this.segmentManagers.push(newSegmentmanager);
    this.flattenedSegmentManagers.push(newSegmentmanager.flatten());

    if (this.segmentManagers.length === 1) {
      // First segmentmanager, init map
      this.map = new Map();
      this.map.init(this.segmentManagers[0]);
    } else {
      // Rearrange chunks, new work power is available
      // TODO: Add functionality
    }
    console.log("Now "+this.segmentManagers.length+" segmentManager(s) are connected");
  }
};

ApplicationLogic.prototype.removeClient = function (role, id) {
  if (role === "player") {
    this.players = this.filterById(this.players, id);
    console.log("Now "+this.players.length+" player(s) are connected");
  } else if (role === "segmentmanager") {
    this.segmentManagers = this.filterById(this.segmentManagers, id);
    this.flattenedSegmentManagers = this.filterById(this.flattenedSegmentManagers, id);
    console.log("Now "+this.segmentManagers.length+" segmentManager(s) are connected");
  }
};

ApplicationLogic.prototype.spawnPlayer = function (playerID) {
  var sIndex = Math.round((Math.random() * (this.segmentManagers.length-1)));
  this.segmentManagers[sIndex].socket.emit('spawn', playerID);
};

ApplicationLogic.prototype.sendSpawnPoint = function (coordinates) {
  var player = this.players.filter(function(el){
    return el.id === coordinates.playerID;
  });

  if (player.length) {
    player[0].socket.emit('spawn', coordinates);
  }
};

ApplicationLogic.prototype.filterById = function (array, id) {
    return array.filter(function( obj ) {
        return obj.id != id;
    });
};

ApplicationLogic.prototype.killPlayer = function (playerID) {
  this.io.to('segment-managers').emit('kill', playerID);

  this.players.find(function(el){
    return el.id = playerID;
  }).socket.emit('kill');
};

exports.ApplicationLogic = ApplicationLogic;
