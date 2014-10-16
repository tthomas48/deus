var deus = deus || {};
deus.ouroboros = (function($, createjs, undefined) {
  "use strict";

  function Ouroboros() {
    this.timer = 0;
    this.bitmap = undefined;
    this.time = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.xTarget = 0;
    this.yTarget = 0;
    this.totalVotes = 0;
    this.xVotes = 0;
    this.yVotes = 0;
    this.stageWidth = 0;
    this.stageHeight = 0;
  }

  Ouroboros.prototype = {
    constructor : Ouroboros,
    add : function(stage) {
      createjs.Sound.registerSound("/plugin/cue/tick.mp3", "tick");
      createjs.Sound.registerSound("/plugin/cue/tock.mp3", "tock");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/snake-ring.svg");
      this.bitmap.scaleX = 0.25;
      this.bitmap.scaleY = 0.25;
      stage.addChild(this.bitmap);
      
      var that = this;
      this.bitmap.image.onload = function () { 
        var bounds = that.bitmap.getTransformedBounds();
        window.console.log(bounds);
        that.bitmap.x = (stage.canvas.width) / 2;
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height + 150) / 2;
        that.bitmap.regX = that.bitmap.image.width / 2;
        that.bitmap.regY = that.bitmap.image.height / 2;
        that.initialX = that.bitmap.x;
        that.initialY = that.bitmap.y;
        that.stageWidth = (stage.canvas.width - that.bitmap.regX - 150) / 2;
        that.stageHeight = (stage.canvas.height - that.bitmap.regY - 150) / 2;
        //that.bitmap.regY = stage.canvas.height / 2;
      };
      
      var socket = io.connect();
      socket.on('timer', function(data) {
        // play a ticking sound
        // spin the thing?
        that.time = data;
      });
    },
    draw : function(stage) {
      this.timer++;
      
      if (this.time > 0) {
        this.bitmap.rotation = this.bitmap.rotation - 3;
        if (this.timer % 40 == 0) {
          var instance = createjs.Sound.play("tock");
          instance.volume = 1 / this.time;
        }
        else if (this.timer % 20 == 0) {
          var instance = createjs.Sound.play("tick");
          instance.volume = 1 / this.time;
        }
      }
      if (this.bitmap.x > this.initialX + this.xTarget) {
        this.bitmap.x -= 2;
      }
      if (this.bitmap.x < this.initialX + this.xTarget) {
        this.bitmap.x += 2;
      }
      if (this.bitmap.y > this.initialY + this.yTarget) {
        this.bitmap.y -= 2;
      }
      if (this.bitmap.y < this.initialY + this.yTarget) {
        this.bitmap.y += 2;
      }
    },
    moveRelative: function(x, y) {
      
      this.totalVotes++;
      this.xVotes += x;
      this.yVotes += y;
      
      
      this.xTarget = (this.stageWidth * this.xVotes) / this.totalVotes;
      this.yTarget = (this.stageHeight * this.yVotes) / this.totalVotes;
      window.console.log("X Votes: " + this.xVotes);
    }
  };
  
  return {
    Ouroboros : Ouroboros
  };  
})(jQuery, createjs);
