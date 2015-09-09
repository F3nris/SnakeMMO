var logic = (function(){
  return {
    inMenu : true,
    direction : 0, // 0 - still, 1 - up, 2 - right, 3 - down, 4 - left
    init : function() {
      // Init components
      visualization.init();
      network.init();

      // Start rendering loop
      visualization.render();

      // Setup key listener (for game input) & mouse listener for menu control
      window.onkeydown = logic.keyListener;
      visualization.canvas.addEventListener('mousedown', logic.mouseListener);
    },
    keyListener : function (e) {
      if (!logic.inMenu) {
        var key = e.keyCode ? e.keyCode : e.which;
        if (key == 37 & direction != 4 & direction != 2) {
          direction = 4;
        } else if (key == 38 & direction != 1 & direction != 3) {
          direction = 1;
        } else if (key == 39 & direction != 2 & direction != 4) {
          direction = 2;
        } else if (key == 40 & direction != 3 & direction != 1) {
          direction = 3;
        } else {
          console.log("Tastencode:"+key);
        }
      }
    },
    mouseListener : function (e) {
      if (logic.inMenu) {
        var rect = visualization.canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        if (x > 250 & x < 550 & y > 200 & y < 300) {
          console.log("Button clicked");
        }
      }
    }
  }
})();
