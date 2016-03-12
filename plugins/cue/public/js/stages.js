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
  };
  TriStage.prototype.draw = function(stage) {
    this.parent.draw(stage);
  };

  return {
    DualStage : DualStage,
    TriStage : TriStage
  };
}(jQuery, createjs));