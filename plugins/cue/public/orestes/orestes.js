var deus = deus || {};
deus.one = (function($, createjs, undefined) {
  "use strict";

  function Pillow(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Pillow.prototype = {
    constructor : Pillow,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/2/ooh.mp3", "ooh");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/orestes/placeholder.svg");
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
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 2) {
          that.ouroborus.moveRelative(1, 0);
//          var instance = createjs.Sound.play("ooh");
//          instance.setPan(1);
//          instance.volume = 0.09;
        }
      });
    },
    draw : function(stage) {
      // noop
    }
  };


  function Dagger(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Dagger.prototype = {
    constructor : Dagger,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/2/ooh.mp3", "ooh");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/orestes/placeholder.svg");
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
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 2) {
          that.ouroborus.moveRelative(1, 0);
//          var instance = createjs.Sound.play("ooh");
//          instance.setPan(1);
//          instance.volume = 0.09;
        }
      });
    },
    draw : function(stage) {
      // noop
    }
  };

  function BurlapSack(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  BurlapSack.prototype = {
    constructor : BurlapSack,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/orestes/placeholder.svg");
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
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 1) {
//          var instance = createjs.Sound.play("aah");
//          instance.setPan(-1);
//          instance.volume = 0.15;          
          that.ouroborus.moveRelative(-1, 0);
          
        }
      });      
    },
    draw : function(stage) {
      // noop
    }
  };

  function Crown(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Crown.prototype = {
    constructor : Crown,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/orestes/placeholder.svg");
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
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 1) {
//          var instance = createjs.Sound.play("aah");
//          instance.setPan(-1);
//          instance.volume = 0.15;          
          that.ouroborus.moveRelative(-1, 0);
          
        }
      });      
    },
    draw : function(stage) {
      // noop
    }
  };

  function Medal(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Medal.prototype = {
    constructor : Medal,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/orestes/placeholder.svg");
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
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 1) {
//          var instance = createjs.Sound.play("aah");
//          instance.setPan(-1);
//          instance.volume = 0.15;          
          that.ouroborus.moveRelative(-1, 0);
          
        }
      });      
    },
    draw : function(stage) {
      // noop
    }
  };

  function Shroud(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Shroud.prototype = {
    constructor : Shroud,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/orestes/placeholder.svg");
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
      
      var socket = io.connect();
      socket.on('vote', function(data) {
        if (data === 1) {
//          var instance = createjs.Sound.play("aah");
//          instance.setPan(-1);
//          instance.volume = 0.15;          
          that.ouroborus.moveRelative(-1, 0);
          
        }
      });      
    },
    draw : function(stage) {
      // noop
    }
  };




  return {
    Pillow: Pillow,
    Dagger : Dagger,
    BurlapSack: BurlapSack,
    Crown: Crown,
    Medal: Medal,
    Shroud: Shroud
  };
})(jQuery, createjs);
