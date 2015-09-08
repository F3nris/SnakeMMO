var visualization = (function(){
  return {
    init : function() {
      this.canvas = document.getElementById("content-canvas");
      this.ctx = this.canvas.getContext("2d");
    },
    drawButton : function (x, y, w, h, r) {
      r = r | 5 ;
      // Setup stroke style and width
      this.ctx.strokeStyle="#000000";
      this.ctx.lineWidth=2;

      this.ctx.beginPath();
      this.ctx.moveTo(x+r,y);
      this.ctx.lineTo(x+w-r,y);
      this.ctx.arc(x+w-r,y+r,r,1.5*Math.PI,2*Math.PI);
      this.ctx.moveTo(x+w,y+r);
      this.ctx.lineTo(x+w,y+h-r);
      this.ctx.arc(x+w-r,y+h-r,r,0*Math.PI,0.5*Math.PI);
      this.ctx.moveTo(x+w-r,y+h);
      this.ctx.lineTo(x+r,y+h);
      this.ctx.arc(x+r,y+h-r,r,0.5*Math.PI,1*Math.PI);
      this.ctx.moveTo(x,y+h-r);
      this.ctx.lineTo(x,y+r);
      this.ctx.arc(x+r,y+r,r,1*Math.PI,1.5*Math.PI);
      this.ctx.stroke();
    },
    render : function () {
      visualization.ctx.clearRect(0, 0, 800, 480);

      if (logic.inMenu) {
        visualization.drawButton(250, 200, 300,100);
      }
      window.requestAnimationFrame(visualization.render);
    }
  }
})();
