var network = (function(){
  return {
    init : function() {
      var socket = io.connect('http://localhost:4000');
      socket.emit ('introduction', 'player');
      socket.on ('disconnect', function(){
        console.log("Disconnected from the server. Maybe reloading the page will help.");
      });
    }
  }
})();
