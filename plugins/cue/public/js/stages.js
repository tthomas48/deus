var deus = deus || {};
deus.stage = (function($, createjs) {
  "use strict";

  function Stage(quadrants, ouroborus) {
    this.quadrants = quadrants;
  }
  Stage.prototype = {
    constructor : Stage,
    add : function(stage) {
      // noop
    },
    draw : function(stage) {
      // noop
    }
  };

  function DualStage() {
    Stage.call(this, 2);
  }
  DualStage.prototype = new DualStage();
  DualStage.prototype.constructor = DualStage;
  DualStage.prototype.parent = Stage.prototype;
  DualStage.prototype.add = function(stage) {
    /*
    var tie = new createjs.Shape();
    tie.graphics.beginFill(createjs.Graphics.getRGB(50, 100, 150, 0.5));
    tie.graphics.moveTo(50, 150).lineTo(stage.canvas.width - 50,
        stage.canvas.height).lineTo(stage.canvas.width - 50, 150).lineTo(50,
        stage.canvas.height).lineTo(50, 150);    
    stage.addChild(tie);
    */
    /*
    $('.container').append("<div class='choice-num choice-num1'>1<span class='label'>" + voting[0].name + "</span></div>");
    $('.container').append("<div class='choice-num choice-num2'>2<span class='label'>" + voting[1].name + "</span></div>");
    */
  };
  DualStage.prototype.draw = function(stage) {
    this.parent.draw(stage);
  };

  function TriStage() {
    Stage.call(this, 4);
  }
  TriStage.prototype = new TriStage();
  TriStage.prototype.constructor = TriStage;
  TriStage.prototype.parent = Stage.prototype;
  TriStage.prototype.add = function(stage) {
    /*
    var tie = new createjs.Shape();
    tie.graphics.beginFill(createjs.Graphics.getRGB(50, 100, 150, 0.5));
    tie.graphics.moveTo(50, 150).lineTo(stage.canvas.width - 50,
        stage.canvas.height).lineTo(stage.canvas.width - 50, 150).lineTo(50,
        stage.canvas.height).lineTo(50, 150).endFill();
    tie.graphics.beginFill(createjs.Graphics.getRGB(100, 50, 150, 0.5));
    tie.graphics.moveTo(50, 150).lineTo(stage.canvas.width - 50, 150).lineTo(
        50, stage.canvas.height).lineTo(stage.canvas.width - 50,
        stage.canvas.height).lineTo(50, 150).endFill();
        */
    /*
    $('.container').append("<div class='choice-num choice-num1'>1<span class='label'>" + voting[0].name + "</span></div>");
    $('.container').append("<div class='choice-num choice-num2'>2<span class='label'>" + voting[1].name + "</span></div>");
    $('.container').append("<div class='choice-num choice-num3'>3<span class='label'>" + voting[2].name + "</span></div>");
    */

    
    //stage.addChild(tie);
  };
  TriStage.prototype.draw = function(stage) {
    this.parent.draw(stage);
  };

  return {
    DualStage : DualStage,
    TriStage : TriStage
  };
}(jQuery, createjs));