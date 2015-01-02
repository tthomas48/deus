var deus = deus || {};
deus.sprite = (function($, createjs, undefined) {
  "use strict";

  function Sprite(ouroboros, position, totalOptions, imagePath, soundPath) {
    this.bitmap = undefined;
    
    this.position = position;
    this.totalOptions = totalOptions;
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
        this.bitmap.scaleX = this.totalOptions == 3 ? 0.75 : 0.7;
        this.bitmap.scaleY = this.totalOptions == 3 ? 0.75 : 0.7;
        stage.addChild(this.bitmap);
      }

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        if (that.position === 1) {
          that.bitmap.x = 0;
          that.bitmap.y = 250; 
        }
        else if (that.position === 2) {
          that.bitmap.x = stage.canvas.width - bounds.width - 50;
          that.bitmap.y = 250; 
        }
        else if (that.position === 3) {
          that.bitmap.x = (stage.canvas.width - bounds.width) / 2;
          that.bitmap.y = 0;
        }
        // 150 is the amount from the top, that the stage starts
        // 
//         if (that.totalOptions == 3 && (that.position == 1 || that.position == 2)) {
//           that.bitmap.y = (stage.canvas.height - bounds.height) / 2; 
//         }
//         else {
//           that.bitmap.y = 250; 
//         }

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