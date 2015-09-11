/**
 * This is the prototype which the main server uses to manage a
 * player client.
 */
function Client (role, id, address, socket, disconnectCallback) {
    this.id = id;
    this.role = role;
    this.address = address ;
    this.socket = socket;
    this.disconnectCallback = disconnectCallback;
    this.init();
  }

  Client.prototype.init = function () {
    var playerScope = this;

    this.socket.on ('disconnect',function(){
      console.log("Client disconnected (Role: "+playerScope.role+")");
      playerScope.disconnectCallback("player",playerScope.id);
    });
  };

 exports.Client = Client;
