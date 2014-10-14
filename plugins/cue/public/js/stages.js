var deus = deus || {};
deus.stage = (function($, createjs) {
  "use strict";

  function Stage(quadrants) {
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
    var tie = new createjs.Shape();
    tie.graphics.beginFill(createjs.Graphics.getRGB(50, 100, 150, 0.5));
    tie.graphics.moveTo(50, 150).lineTo(stage.canvas.width - 50,
        stage.canvas.height).lineTo(stage.canvas.width - 50, 150).lineTo(50,
        stage.canvas.height).lineTo(50, 150);
    stage.addChild(tie);

  };
  DualStage.prototype.draw = function(stage) {
    this.parent.draw(stage);
  };

  function QuadStage() {
    Stage.call(this, 4);
  }
  QuadStage.prototype = new QuadStage();
  QuadStage.prototype.constructor = QuadStage;
  QuadStage.prototype.parent = Stage.prototype;
  QuadStage.prototype.add = function(stage) {
    var tie = new createjs.Shape();
    tie.graphics.beginFill(createjs.Graphics.getRGB(50, 100, 150, 0.5));
    tie.graphics.moveTo(50, 150).lineTo(stage.canvas.width - 50,
        stage.canvas.height).lineTo(stage.canvas.width - 50, 150).lineTo(50,
        stage.canvas.height).lineTo(50, 150).endFill();
    tie.graphics.beginFill(createjs.Graphics.getRGB(100, 50, 150, 0.5));
    tie.graphics.moveTo(50, 150).lineTo(stage.canvas.width - 50, 150).lineTo(
        50, stage.canvas.height).lineTo(stage.canvas.width - 50,
        stage.canvas.height).lineTo(50, 150).endFill();
    stage.addChild(tie);
  };
  QuadStage.prototype.draw = function(stage) {
    this.parent.draw(stage);
  };

  return {
    DualStage : DualStage,
    QuadStage : QuadStage
  };
}(jQuery, createjs));
