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
        switch (key) {
          case 37: // left
            direction = 4;
            break;
          case 38: // up
            direction = 1;
            break;
          case 39: // right
            direction = 2;
            break;
          case 40: // down
            direction = 3;
            break;
          default:
            console.log("Tastencode:"+key)
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
