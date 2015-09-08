var visualization = (function(){
  return {
    init : function() {
      this.canvas = document.getElementById("content-canvas");
      this.ctx = this.canvas.getContext("2d");
    },
    draw : function () {
      this.ctx.fillRect(25,25,100,100);
      this.ctx.clearRect(45,45,60,60);
      this.ctx.strokeRect(50,50,50,50);
    }
  }
})();
