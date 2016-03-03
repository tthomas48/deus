(function () {
  "use strict";
  module.exports = function(db, models, io, emitter, next){
    require('./org')(db, models);
    require('./user')(db, models);
    require('./user_verify')(db, models);
    require('./project')(db, models);
    require('./tree')(db, models);
    require('./cue')(db, models);
    require('./cue_option')(db, models);
    require('./event')(db, models, io, emitter);
    require('./event_option')(db, models);
    next();
  };
})();
