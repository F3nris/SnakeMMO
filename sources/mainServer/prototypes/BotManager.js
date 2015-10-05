/**
 * This is the prototype which the main server uses to manage a
 * player client.
 */
function BotManager (id, socket, parent) {
    this.id = id;
    this.socket = socket;
    this.parent = parent;
    this.init();
  }

  BotManager.prototype.init = function () {
    var localScope = this;

    this.socket.join('bot-managers');

    this.socket.on ('disconnect',function(){
      console.log("BotManager disconnected");
      localScope.parent.removeClient("bot-manager",localScope.id);
    });

    this.socket.on('spawn-bot', function() {
      var playerID = localScope.parent.spawnBotPlayer();
      localScope.socket.emit('bot-id', playerID);
    });

    this.socket.on('kill', function (playerID) {
      localScope.parent.killPlayer (playerID);
    });
  };

  BotManager.prototype.checkSpawnedPlayer = function (coordinates) {
    this.socket.emit('possible-bot-spawn', coordinates);
  };

  BotManager.prototype.checkKilledPlayer = function (id) {
    this.socket.emit('possible-bot-death', id);
  };

  BotManager.prototype.sendUpdate = function () {
    this.socket.emit('update');
  };

 exports.BotManager = BotManager;
