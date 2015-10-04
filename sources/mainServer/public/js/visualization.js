var visualization = (function(){
  return {
    tileSize : 25,
    colorMap : {},
    init : function() {
      this.canvas = document.getElementById("content-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.appleImg = document.getElementById("asset-img-apple");
    },
    getOrGenerateColor : function (id) {
      var color;
      if (this.colorMap[id]) {
        color = this.colorMap[id];
      } else {
        color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
        while (color.length < 7) {
          color += "0";
        }
        this.colorMap[id] = color;
      }
      return color;
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
      this.ctx.moveTo(x+r,y);
      this.ctx.closePath();

      this.ctx.stroke();
    },
    drawMenuBackground : function () {
      this.ctx.save();
      this.ctx.scale(visualization.tileSize,visualization.tileSize);

      this.drawApple(3,3);
      this.drawApple(15,15);
      this.drawApple(27,11);
      this.drawApple(2,15);

      this.drawSnakeHead(4,4,'#dd2341');
      this.drawSnakeBodyPart(4,5,'#dd2341');
      this.drawSnakeBodyPart(5,5,'#dd2341');
      this.drawSnakeBodyPart(5,6,'#dd2341');
      this.drawSnakeBodyPart(5,7,'#dd2341');

      this.drawSnakeHead(26,10,'#dd23dd')
      this.drawSnakeBodyPart(24,7,'#dd23dd');
      this.drawSnakeBodyPart(24,8,'#dd23dd');
      this.drawSnakeBodyPart(24,9,'#dd23dd');
      this.drawSnakeBodyPart(24,10,'#dd23dd');
      this.drawSnakeBodyPart(25,10,'#dd23dd');

      this.drawSnakeHead(24,3,'#12ee41');
      this.drawSnakeBodyPart(25,3,'#12ee41');
      this.drawSnakeBodyPart(26,3,'#12ee41');
      this.drawSnakeBodyPart(27,3,'#12ee41');
      this.drawSnakeBodyPart(27,2,'#12ee41');

      this.drawSnakeHead(4,16,'#45a73b');
      this.drawSnakeBodyPart(5,16,'#45a73b');
      this.drawSnakeBodyPart(6,16,'#45a73b');
      this.drawSnakeBodyPart(7,16,'#45a73b');
      this.drawSnakeBodyPart(8,16,'#45a73b');
      this.drawSnakeBodyPart(9,16,'#45a73b');
      this.drawSnakeBodyPart(10,16,'#45a73b');
      this.drawSnakeBodyPart(11,16,'#45a73b');
      this.ctx.restore();
    },
    drawSnakeHead : function (x,y,c) {
      this.ctx.fillStyle = c;
      this.ctx.fillRect(x+0.04,y+0.04,0.92, 0.92);

      this.ctx.fillStyle = "#fff";
      this.ctx.fillRect(x+0.2, y+0.2, 0.6,0.6);

      this.ctx.fillStyle = c;
      this.ctx.fillRect(x+0.28,y+0.28,0.44,0.44);
    },
    drawSnakeBodyPart : function (x,y,c) {
      this.ctx.fillStyle = c;
      this.ctx.fillRect(x+0.08,y+0.08,0.84,0.84);
    },
    drawApple : function (x,y) {
      this.ctx.drawImage(this.appleImg, x, y,1,1);
    },
    drawWall : function (x,y) {
      this.ctx.fillStyle = "#3f3f3f";
      this.ctx.fillRect(x,y,1,1);
    },
    drawMap : function () {
      this.ctx.save();
      this.ctx.scale(this.tileSize,this.tileSize);
      this.ctx.translate(16,9);

      var offsetX = logic.localPosition.x;
      var offsetY = logic.localPosition.y;

      var keyArray = Object.keys(logic.localMap);
      for (var i=0; i<keyArray.length; i++) {
        var chunk = logic.localMap[keyArray[i]];
        var chunkOffsetX = chunk.x; var chunkOffsetY = chunk.y;

        var tiles = chunk.tiles;
        var tilesKeyArray = Object.keys(tiles);
        for (var j=0; j<tilesKeyArray.length; j++) {
          var currentTile = tiles[tilesKeyArray[j]];
          var currentTileKey = tilesKeyArray[j];

          // calculate coordinates
          var currentX = (chunkOffsetX + Math.floor(currentTileKey / logic.CHUNK_SIZE)) - offsetX;
          var currentY = (chunkOffsetY + (currentTileKey % logic.CHUNK_SIZE)) - offsetY;

          var color = visualization.getOrGenerateColor(currentTile.playerID);

          if (currentTile.type === "body") {
            this.drawSnakeBodyPart(currentX, currentY, color);
          } else if (currentTile.type === "head") {
            this.drawSnakeHead(currentX, currentY, color);
          } else if (currentTile.type === "apple") {
            this.drawApple(currentX, currentY);
          } else if (currentTile.type === "wall") {
            this.drawWall(currentX,currentY);
          }
        }
      }

      this.ctx.restore();
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
      } else {
        visualization.drawMap();
      }
      window.requestAnimationFrame(visualization.render);
    }
  }
})();
