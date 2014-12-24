var deus = deus || {};
deus.sprite = (function($, createjs, undefined) {
  "use strict";

  function Sprite(ouroboros, position, imagePath, soundPath) {
    this.bitmap = undefined;
    
    this.position = position;
    this.imagePath = imagePath;
    this.soundPath = soundPath;
    this.ouroborus = ouroboros;
  }

  Sprite.prototype = {
    constructor : Sprite,
    add : function(stage) {
      
      if (this.soundPath) {
        createjs.Sound.registerSound("/plugin/cue/sounds/" + this.soundPath, this.soundPath);
      }
      
      if (this.imagePath) {
        this.bitmap = new createjs.Bitmap("/plugin/cue/images/" + this.imagePath);
        this.bitmap.scaleX = 1;
        this.bitmap.scaleY = 1;
        stage.addChild(this.bitmap);
      }

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        if (that.position === 1) {
          that.bitmap.x = 0;
        }
        else if (that.position === 2) {
          that.bitmap.x = stage.canvas.width - bounds.width - 50;
        }
        // 150 is the amount from the top, that the stage starts
        //that.bitmap.y = (stage.canvas.height - bounds.height) / 2;
      };
    },
    draw : function(stage) {
      // noop
    }
  };
  
  return {
    Sprite: Sprite
  };
})(jQuery, createjs);