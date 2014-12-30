var deus = deus || {};
var intervals = [];

function addInterval(callback, timer) {
  var interval = setInterval(callback, timer);
  intervals.push(interval);
  return interval;
}
deus.cue = (function(window, document, $, undefined) {
  'use strict';
  var Cue = function Cue(cockpit) {
    console.log("Loading Cue plugin.");
    this.cockpit = cockpit;
    //this.cue = 0;
    this.enabled = false;
    this.go = undefined;
    // Add the buttons to the control area
    $('#controls').append('<span class="cue">0</span>');
    // Register the various event handlers
    this.listen();
  };
  Cue.prototype.clearScreen = function() {
    window.console.log("Emitting clear");
    this.cockpit.socket.emit('/clear', 'all');
  };
  /*
   * Register event listener
   */
  Cue.prototype.listen = function listen() {
    var cue = this;
    this.cockpit.socket.on('cue.status', function(data) {
      cue.updateCue(data);
    });
  };
  Cue.prototype.updateCue = function(data) {
    var cue = this;
    cue.enabled = data.enabled;
    cue.previous = cue.cue;
    cue.cue = data.cue;
    cue.go = data.go;
    cue.updateUI(data.view);
  };
  Cue.prototype.updateUI = function updateUI(view) {
    if(this.cue.enabled === false) {
      $('#cue-view').remove();
      return;
    }
    if(this.previous == this.cue) {
      window.console.log("Skipping reload of current cue");
      return;
    }
    if(this.go === 'go') {
      this.clearScreen();
    }
    window.console.log("Loading...");
    $.ajaxSetup({
      // Disable caching of AJAX responses
      cache: false
    });
    $('span.cue').html(this.cue);
    var i = 0;
    for(i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }
    $.get("/plugin/cue/" + view.view, {}, function(responseText, textStatus) {
      var output = Mustache.render(responseText, view);
      $('.' + view.screen + '-view').html($(output));
    });
  };
  window.Olympus.plugins.push(Cue);
  return Cue;
}(window, document, jQuery));