var deus = deus || {};
deus.ouroboros = (function($, createjs, undefined) {
  "use strict";

  function Ouroboros(cues, sound) {
    this.sound = sound;
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
    this.transitionInstance = undefined;
    this.cues = cues;
    this.enbiggened = false;
  }

  Ouroboros.prototype = {
    constructor : Ouroboros,
    add : function(stage) {

      $('header').show();
      $('#cue-view').show();
      $('canvas').show();
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/images/OuroborosGold.png");
      this.bitmap.scaleX = this.cues.length == 3 ? 0.5 : 0.75;
      this.bitmap.scaleY = this.cues.length == 3 ? 0.5 : 0.75;
      stage.addChild(this.bitmap);
      
      var that = this;
      this.bitmap.image.onload = function () { 
        var bounds = that.bitmap.getTransformedBounds();
        that.bitmap.x = (stage.canvas.width) / 2;
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - 150) / 2;
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
      socket.on('timer', that.setTime.bind(that));
      socket.on('vote', that.moveRelative.bind(that));

      socket.on('cue.status', function(data) {
        if (data.go === 'go') {
          socket.removeListener('timer', that.setTime.bind(that));
          socket.removeListener('vote', that.moveRelative.bind(that));
          if (that.transitionInstance) {

            that.transitionInstance.stop();
            that.transitionInstance = undefined;
          }
        }
        else if (data.go === 'novote') {
          console.log("Stop voting");
          that.setTime(0);
        }
      });

    },
    enbiggen: function() {
      this.enbiggened = true;
      this.bitmap.scaleX = 1.15;
      this.bitmap.scaleY = 1.15;
      this.bitmap.y = 150;
    },
    spinBig: function() {
      this.spinning = true;
      this.enbiggen();
    },
    fadeOut: function(callback) {
      if (this.transitionInstance) {
        if (this.transitionInstance.volume > 0) { 
          this.transitionInstance.volume -= 0.05;
          var that = this;
          setTimeout(function() {
            that.fadeOut(callback);
          }, 100);
          return;
        }
        this.transitionInstance.stop();
        this.transitionInstance = undefined;
        callback.call(this);
      }
    },
    draw : function(stage) {
      this.timer++;
      if (!this.loaded) {
        return;
      }
      if (this.time > 5 || this.spinning) {
        if (!this.transitionInstance && this.time > 5) {
            this.transitionInstance = createjs.Sound.play(this.sound, {interrupt: createjs.Sound.INTERRUPT_ANY, loop:1, volume: 1});
          window.console.log(this.transitionInstance);
        }
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
        if (this.transitionInstance) {
          this.fadeOut(function () {
            if (this.enbiggened) {
              if (this.oneVotes > this.twoVotes) {
                ouroborus.filter([
		              new createjs.ColorFilter(5,0,0,1, 0,0,255,0)
	              ]);
	              var instance = createjs.Sound.play("yes");
	              instance.volume = 1;
 	              return;
              } else {
	              ouroborus.filter([
	                new createjs.ColorFilter(1,5,1,1, 0,0,255,0)
                ]);
                var instance = createjs.Sound.play("no");
                instance.volume = 1;
              }
            }
          });
        }
        this.cuedWinner = true;
        if (this.enbiggened) {
          return;
        }

         
        if (this.oneVotes == Math.max(this.oneVotes, this.twoVotes, this.threeVotes)) {
          $('.choice-num1').css('color', 'red');
        }
        else if (this.threeVotes == Math.max(this.oneVotes, this.twoVotes, this.threeVotes)) {
          $('.choice-num3').css('color', 'red');
        } 
        else {
          $('.choice-num2').css('color', 'red');
        }
 
//        }
      }
      if (this.enbiggened) {
        // we don't move the enbiggened
        return;
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
    setTime: function(data) {
      this.time = data;
    },
    moveRelative: function(vote) {
      this.saveVotes(vote);
      
      this.xTarget = (this.stageWidth * (this.twoVotes - this.oneVotes)) / this.totalVotes;
      this.yTarget = - ((this.stageHeight * this.threeVotes) / this.totalVotes);
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
