(function(exports){

    function Client (id, address, socket) {
      this.id = id;
      this.address = address ;
      this.socket = socket;
    }

   exports.Client = Client;

})(typeof exports === 'undefined'? this['Client']={}: exports);
