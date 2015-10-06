var gameloop = require('node-gameloop');

var Player = require('./prototypes/Player.js').Player;
var SegmentManager = require('./prototypes/SegmentManager.js').SegmentManager;
var BotManager = require('./prototypes/BotManager.js').BotManager;
var Map = require('./prototypes/Map.js').Map;
var config = require('./config.js');

function ApplicationLogic(io) {
  this.map = null;
  this.io = io;

  this.players = [];
  this.segmentManagers = [];
  this.flattenedSegmentManagers = [];
  this.botManager = null;

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
      } else if (data.role === "spectator") {
        socket.emit('segment-managers',localScope.flattenedSegmentManagers);
        socket.emit('map', localScope.map.flatten());
      } else if (data.role === "bot-manager" && !localScope.botManager) {
        console.log("A bot-manager connected!");
        localScope.addClient("bot-manager", null, socket);
      } else {
        socket.disconnect();
      }
    });
  });

  var botsTurn = false;
  this.gameLoopID = gameloop.setGameLoop(function(delta) {
    if (localScope.map){
      if (localScope.map.checkFillness()){
        localScope.io.sockets.emit('map', localScope.map.flatten());
      }
    }
    if (!botsTurn) {
      for (var i=0; i<localScope.segmentManagers.length; i++) {
        localScope.segmentManagers[i].socket.emit('update');
      }
    } else {
      if (localScope.botManager) {
        localScope.botManager.sendUpdate();
      }
    }
    botsTurn = !botsTurn;
  }, config.HEARTBEAT);
};

ApplicationLogic.prototype.generateID = function () {
  return this.baseID ++;
};

ApplicationLogic.prototype.addClient = function (type, address, socket) {
  if (type === "player") {
    var newPlayer = new Player(this.generateID(), socket, this);

    // send map and segmentManagers
    socket.emit('segment-managers',this.flattenedSegmentManagers);
    socket.emit('map', this.map.flatten());

    this.players.push(newPlayer);
    console.log("Now "+this.players.length+" player(s) are connected");
  } else if (type === "segmentmanager") {
    var newSegmentmanager = new SegmentManager(this.generateID(), address, socket, this);
    this.segmentManagers.push(newSegmentmanager);
    this.flattenedSegmentManagers.push(newSegmentmanager.flatten());

    this.io.sockets.emit('segment-managers', this.flattenedSegmentManagers);

    if (this.segmentManagers.length === 1) {
      // First segmentmanager, init map
      this.map = new Map(this);
      this.map.init(this.segmentManagers[0]);
    } else {
      this.map.rearrangeChunks();
    }

    // Send new map to all clients
    this.io.sockets.emit('map', this.map.flatten());

    console.log("Now "+this.segmentManagers.length+" segmentManager(s) are connected");
  } else if (type === "bot-manager") {
    this.botManager = new BotManager(this.generateID(), socket, this);
    socket.emit('segment-managers',this.flattenedSegmentManagers);
    socket.emit('map', this.map.flatten());
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
  } else if (role === "bot-manager") {
    this.botManager = null;
    console.log("The botManager disconnected.");
  }
};

ApplicationLogic.prototype.spawnBotPlayer = function() {
  var playerID = this.generateID();
  this.spawnPlayer(playerID);
  return playerID;
};

ApplicationLogic.prototype.spawnPlayer = function (playerID) {
  var sIndex = Math.round((Math.random() * (this.segmentManagers.length-1)));
  this.segmentManagers[sIndex].socket.emit('spawn', playerID);
};

ApplicationLogic.prototype.sendSpawnPoint = function (coordinates) {
  var player = this.players.find(function(el){
    return el.id === coordinates.playerID;
  });

  if (player) {
    player.socket.emit('spawn', coordinates);
  } else { // Try botmanager
    if (this.botManager) {
      this.botManager.checkSpawnedPlayer(coordinates);
    }
  }
};

ApplicationLogic.prototype.filterById = function (array, id) {
  return array.filter(function( obj ) {
      return obj.id != id;
  });
};

ApplicationLogic.prototype.updateMapFillLevel = function(chunkID, fillLevel){
  var chunk = this.map.chunks.find(function(el){
    return el.id === chunkID;
  });
  chunk.fillLevel = fillLevel;
};

ApplicationLogic.prototype.killPlayer = function (playerID) {
  this.io.to('segment-managers').emit('kill', playerID);

  var player = this.players.find(function(el){
    return el.id === playerID;
  });
  if (player){
    player.socket.emit('kill');
  } else {
    this.botManager.checkKilledPlayer(playerID);
  }
};

exports.ApplicationLogic = ApplicationLogic;
