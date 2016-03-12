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
    this.x = undefined;
    this.y = undefined;
  }



  Sprite.prototype = {
    constructor : Sprite,
    initPos: function(stage, bounds) {
      var x, y;
      if (this.position === 1) {
        x = 50;
        y = 250;
      }
      else if (this.position === 2) {
        x = stage.canvas.width - bounds.width - 50;
        y = 250;
      }
      else if (this.position === 3) {
        x = (stage.canvas.width - bounds.width) / 2;
        y = 0;
      }

      console.log(this, x, y);
      if (!this.x) {
        this.x = x;
      }

      if (!this.y) {
        this.y = y;
      }

      this.bitmap.x = this.x;
      this.bitmap.y = this.y;
    },
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
        that.bounds = that.bitmap.getTransformedBounds();
        that.initPos(stage, that.bounds);
      };
    },
    draw : function(stage) {
      // noop
    },
    doVideoFade: function(stage) {
      
      this.videoFadeParams.skipSteps -= 1;
      if (this.videoFadeParams.skipSteps > 0) {
        return;
      }
      if (this.videoFadeParams.alpha < 0) {
        this.videoFade = false;
        this.videoFadeParams = {};
        return;
      }
      this.videoFadeParams.alpha -= 0.05;
      this.bitmap.set({alpha: this.videoFadeParams.alpha});
    },
  };
  
  return {
    Sprite: Sprite
  };
})(jQuery, createjs);