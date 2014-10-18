var deus = deus || {};
deus.one = (function($, createjs, undefined) {
  "use strict";

  function Dagger(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Dagger.prototype = {
    constructor : Dagger,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/2/ooh.mp3", "ooh");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/electra/placeholder.svg");
      this.bitmap.scaleX = 0.5;
      this.bitmap.scaleY = 0.5;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        that.bitmap.x = 0;
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
    },
    draw : function(stage) {
      // noop
    }
  };

  function Rope(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Rope.prototype = {
    constructor : Rope,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/electra/placeholder.svg");
      this.bitmap.scaleX = 0.5;
      this.bitmap.scaleY = 0.5;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        window.console.log(bounds);
        that.bitmap.x = stage.canvas.width - bounds.width - 50;
                
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
    },
    draw : function(stage) {
      // noop
    }
  };

  function Tiara(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Tiara.prototype = {
    constructor : Tiara,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/electra/placeholder.svg");
      this.bitmap.scaleX = 0.5;
      this.bitmap.scaleY = 0.5;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        window.console.log(bounds);
        that.bitmap.x = stage.canvas.width - bounds.width - 50;
                
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
    },
    draw : function(stage) {
      // noop
    }
  };


  return {
    Tiara: Tiara,
    Rope : Rope,
    Dagger : Dagger
  };
})(jQuery, createjs);
