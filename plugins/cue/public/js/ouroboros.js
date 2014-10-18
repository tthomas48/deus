var deus = deus || {};
deus.ouroboros = (function($, createjs, undefined) {
  "use strict";

  function Ouroboros(cues) {
    this.timer = 0;
    this.bitmap = undefined;
    this.time = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.xTarget = 0;
    this.yTarget = 0;
    this.totalVotes = 0;
    this.oneVotes = 0;
    this.twoVotes = 0;
    this.threeVotes = 0;
    this.stageWidth = 0;
    this.stageHeight = 0;
    this.cuedWinner = undefined;
    this.spinning = false;
    this.loaded = false;
    this.cues = cues;
  }

  Ouroboros.prototype = {
    constructor : Ouroboros,
    add : function(stage) {
//      createjs.Sound.registerSound("/plugin/cue/tick.mp3", "tick");
//      createjs.Sound.registerSound("/plugin/cue/tock.mp3", "tock");
      
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
        that.bitmap.cache(0, 0, that.bitmap.image.width, that.bitmap.image.height);
        that.loaded = true;
      };
      
      var socket = io.connect();
      socket.on('timer', function(data) {
        // play a ticking sound
        // spin the thing?
        that.time = data;
      });

      socket.on('vote', function(vote) {
        this.moveRelative(vote);
      });

    },
    enbiggen: function() {
      this.bitmap.scaleX = 1.05;
      this.bitmap.scaleY = 1.05;
    },
    spinBig: function() {
      this.spinning = true;
      this.enbiggen();
    },
    draw : function(stage) {
      this.timer++;
      if (!this.loaded) {
        return;
      }
      
      if (this.time > 0 || this.spinning) {
        this.cuedWinner = false;
        this.bitmap.rotation = this.bitmap.rotation - 3;
        if (this.timer % 40 == 0) {
//          var instance = createjs.Sound.play("tock");
//          instance.volume = 1 / this.time;
        }
        else if (this.timer % 20 == 0) {
//          var instance = createjs.Sound.play("tick");
//          instance.volume = 1 / this.time;
        }
      }
      if (this.spinning === false && this.cuedWinner === false && this.time == 0) {
        this.cuedWinner = true;
        window.console.log("Cue the winner");
        //var socket = io.connect();
        //socket.emit('/cue/winner', { x: this.xVotes, y: this.yVotes});

        if (this.xVotes < this.yVotes) {
          this.setNext(this.cues[0]);
          $('.choice-num1').css('color', 'red');
        }
        else if(false) {
          this.setNext(this.cues[2]);
          $('.choice-num3').css('color', 'red');
        } 
        else {
          this.setNext(this.cues[1]);
          $('.choice-num2').css('color', 'red');
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
      this.bitmap.updateCache(this.bitmap.x, this.bitmap.y, this.bitmap.image.width, this.bitmap.image.height);

      //this.bitmap.updateCache();

    },
    moveRelative: function(vote) {
      this.saveVotes(vote);
      
      this.xTarget = (this.stageWidth * (this.twoVotes - this.oneVotes) / this.totalVotes;
      this.yTarget = (this.stageHeight * this.threeVotes) / this.totalVotes;
    },
    saveVotes: function(vote) {
      this.totalVotes++;
    
      if (vote === 1) {
        this.oneVotes += 1;
      }
      else if(vote === 2) {
        this.twoVotes += 1;
      }
      else if(vote === 3) {
        this.threeVotes += 1;
      }
    },
    setNext: function(next) {
      var socket = io.connect();
      socket.emit('/cue/set', { cue: next});
    },
    filter: function(filters) {
      this.bitmap.filters = filters;
      if (!this.loaded) {
        return;
      }
      this.bitmap.updateCache(this.bitmap.x, this.bitmap.y, this.bitmap.image.width, this.bitmap.image.height);
    }
  };
  
  return {
    Ouroboros : Ouroboros
  };  
})(jQuery, createjs);
