/**
 * This is the prototype which the main server uses to manage a
 * player client.
 */
function Player (id, socket, parent) {
    this.id = id;
    this.socket = socket;
    this.parent = parent;
    this.init();
  }

  Player.prototype.init = function () {
    var localScope = this;

    this.socket.join('players');
    this.socket.emit('id', this.id);

    this.socket.on('play', function(){
      localScope.parent.spawnPlayer(localScope.id);
    });

    this.socket.on ('disconnect',function(){
      console.log("Player disconnected");
      localScope.parent.removeClient("player",localScope.id);
    });

    this.socket.on('kill', function (playerID) {
      localScope.parent.killPlayer (playerID);
    })
  };

  Player.prototype.flatten = function() {
    return {
      id : this.id
    };
  }

 exports.Player = Player;
