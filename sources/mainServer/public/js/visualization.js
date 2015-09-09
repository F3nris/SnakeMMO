var visualization = (function(){
  return {
    tileSize : 25,
    init : function() {
      this.canvas = document.getElementById("content-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.appleImg = document.getElementById("asset-img-apple");
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
    drawMenuBackground : function () {
      this.drawApple(75,75);
      this.drawApple(375,375);
      this.drawApple(675,275);
      this.drawApple(45,375);

      this.drawSnakeHead(100,100,255,0,0,0.5);
      this.drawSnakeBodyPart(100,125,255,0,0,0.5);
      this.drawSnakeBodyPart(125,125,255,0,0,0.5);
      this.drawSnakeBodyPart(125,150,255,0,0,0.5);
      this.drawSnakeBodyPart(125,175,255,0,0,0.5);

      this.drawSnakeHead(650,250,255,255,0,0.5)
      this.drawSnakeBodyPart(600,175,255,255,0,0.5);
      this.drawSnakeBodyPart(600,200,255,255,0,0.5);
      this.drawSnakeBodyPart(600,225,255,255,0,0.5);
      this.drawSnakeBodyPart(600,250,255,255,0,0.5);
      this.drawSnakeBodyPart(625,250,255,255,0,0.5);

      this.drawSnakeHead(600,75,255,0,255,0.5);
      this.drawSnakeBodyPart(625,75,255,0,255,0.5);
      this.drawSnakeBodyPart(650,75,255,0,255,0.5);
      this.drawSnakeBodyPart(675,75,255,0,255,0.5);
      this.drawSnakeBodyPart(675,50,255,0,255,0.5);

      this.drawSnakeHead(100,400,0,0,255,0.5);
      this.drawSnakeBodyPart(125,400,0,0,255,0.5);
      this.drawSnakeBodyPart(150,400,0,0,255,0.5);
      this.drawSnakeBodyPart(175,400,0,0,255,0.5);
      this.drawSnakeBodyPart(200,400,0,0,255,0.5);
      this.drawSnakeBodyPart(225,400,0,0,255,0.5);
      this.drawSnakeBodyPart(250,400,0,0,255,0.5);
      this.drawSnakeBodyPart(275,400,0,0,255,0.5);
    },
    drawSnakeHead : function (x,y,r,g,b,a) {
      var drawColor = "rgba("+r+","+g+","+b+","+a+")";
      this.ctx.fillStyle = drawColor;
      this.ctx.fillRect(x+1,y+1,this.tileSize - 2, this.tileSize - 2);

      this.ctx.fillStyle = "#fff";
      this.ctx.fillRect(x+5, y+5, this.tileSize - 10,this.tileSize - 10);

      this.ctx.fillStyle = drawColor;
      this.ctx.fillRect(x+7,y+7,this.tileSize - 14,this.tileSize - 14);
    },
    drawSnakeBodyPart : function (x,y,r,g,b,a) {
      var drawColor = "rgba("+r+","+g+","+b+","+a+")";
      this.ctx.fillStyle = drawColor;
      this.ctx.fillRect(x+2,y+2,this.tileSize - 4, this.tileSize - 4);
    },
    drawApple : function (x,y) {
      this.ctx.drawImage(this.appleImg, x, y);
    },
    render : function () {
      visualization.ctx.clearRect(0, 0, 800, 480);

      if (logic.inMenu) {
        // Draw menu (button)
        visualization.drawButton(250, 200, 300, 100);
        visualization.ctx.fillStyle = "#000000";
        visualization.ctx.font = "40px Arial";
        visualization.ctx.fillText("Play!",355,265);
        visualization.drawMenuBackground();
      }
      window.requestAnimationFrame(visualization.render);
    }
  }
})();
