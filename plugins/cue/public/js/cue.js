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
    console.log(data);
    var cue = this;
    cue.enabled = data.enabled;
    cue.previous = cue.cue;
    cue.cue = data.cue;
    cue.go = data.go;
    cue.visible = data.visible;
    if (!data.visible) {
      window.console.log("Invisible cue. Don't load it");
      return;
    }
    if (cue.go === 'novote') {
      window.console.log("Stopping voting, don't do any UI updates.");
      return;
    }
    cue.updateUI(data.view, cue.go === 'go');
  };
  Cue.prototype.updateUI = function updateUI(view, forceLoad) {

    if ($('.' + view.screen + '-view').length === 0) {
      console.error("Could not view view " + view-screen + "-view");
      return;
    }
    if ($('.' + view.screen + '-view').html() === '') {
      forceLoad = true;
    }
    
    if(this.previous == this.cue && !forceLoad) {
      window.console.log("Skipping reload of current cue");
      return;
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
    
    window.olympusInstance.clearScreen(view.screen);

    if ($('.' + view.screen + '-view').length == 0) {
      $('.all-view').html('');
      return;
    }
    
    $.get("/plugin/cue/" + view.view, function(responseText, textStatus) {
      var output = Mustache.render(responseText, view);
      $('.' + view.screen + '-view').html($('<span class="' + view.shortname + '">' + output + '</span>'));
    });
  };
  window.Olympus.plugins.push(Cue);
  return Cue;
}(window, document, jQuery));