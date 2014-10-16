var deus = deus || {};
deus.one = (function($, createjs, undefined) {
  "use strict";

  function BallGag(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  BallGag.prototype = {
    constructor : BallGag,
    add : function(stage) {
      createjs.Sound.registerSound("/plugin/cue/1/ooh.mp3", "ooh");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/1/ball-gag.svg");
      this.bitmap.scaleX = 1;
      this.bitmap.scaleY = 1;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        that.bitmap.x = stage.canvas.width - bounds.width - 50;
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 2) {
          that.ouroborus.moveRelative(1, 0);
          var instance = createjs.Sound.play("ooh");
          instance.setPan(1);
          instance.volume = 0.09;
        }
      });
      socket.on('/cue/winner', function(data) {
        if (data.x > 0) {
          window.console.log("ball gag wins!" + voting_string[1].name);
        }
      });
    },
    draw : function(stage) {
      // noop
    }
  };

  function Duster(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Duster.prototype = {
    constructor : Duster,
    add : function(stage) {
      createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/1/duster.svg");
      this.bitmap.scaleX = 1.5;
      this.bitmap.scaleY = 1.5;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        window.console.log(bounds);
        that.bitmap.x = 0;        
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 1) {
          var instance = createjs.Sound.play("aah");
          instance.setPan(-1);
          instance.volume = 0.15;          
          that.ouroborus.moveRelative(-1, 0);
          
        }
      });      
      socket.on('/cue/winner', function(data) {
        window.console.log(data);
        if (data.x <= 0) {
          window.console.log("feather duster wins!" + voting_string[0].name);
        }
      });
      
    },
    draw : function(stage) {
      // noop
    }
  };

  return {
    BallGag : BallGag,
    Duster : Duster
  };
})(jQuery, createjs);
