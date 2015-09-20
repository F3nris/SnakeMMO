/**
 * This is the prototype which the main server uses to manage a
 * player client.
 */
function SegmentManager (id, address, socket, parent) {
    this.id = id;
    this.address = address ;
    this.socket = socket;
    this.parent = parent;
    this.init();
  }

  SegmentManager.prototype.init = function () {
    var localScope = this;

    this.socket.join('segment-managers');

    this.socket.on ('disconnect',function(){
      console.log("SegmentManager disconnected");
      localScope.parent.removeClient("segmentmanager",localScope.id);
    });

    this.socket.on('spawn', function(coordinates) {
      localScope.parent.sendSpawnPoint(coordinates);
    });
  };

  SegmentManager.prototype.flatten = function() {
    return {
      id : this.id,
      address : this.address
    };
  }

 exports.SegmentManager = SegmentManager;
