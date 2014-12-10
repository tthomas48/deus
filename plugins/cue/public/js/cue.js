var intervals = [];

function addInterval(callback, timer) {
  var interval = setInterval(callback, timer);
  intervals.push(interval);
  return interval;
}
(function(window, document, $, undefined) {
  'use strict';
  var Cue = function Cue(cockpit) {
    console.log("Loading Cue plugin.");
    this.cockpit = cockpit;
    this.cue = 0;
    this.enabled = false;
    this.go = undefined;
    // Add the buttons to the control area
    $('#controls').append('<span class="cue">1</span>');
    // Register the various event handlers
    this.listen();
  };
  Cue.prototype.clearScreen = function() {
    $('#nofeed').remove();
  };
  /*
   * Register event listener
   */
  Cue.prototype.listen = function listen() {
    var cue = this;
    this.cockpit.socket.on('cue.status', function(data) {
      window.console.log(data);
      cue.enabled = data.enabled;
      cue.cue = data.cue;
      cue.go = data.go;
      cue.updateUI(data.view);
    });
    $(document).keyup(function(ev) {
      if(ev.keyCode == 32) {
        var pausables = $(".pausable");
        if(pausables.length == 1) {
          var pausable = pausables[0];
          if(pausable.paused) {
            pausable.play();
          } else {
            pausable.pause();
          }
        }
      }
    });
  };
  Cue.prototype.updateUI = function updateUI(view) {
    if(this.cue.enabled === false) {
      $('#cue-view').remove();
      return;
    }
    if(this.go === 'go') {
      this.clearScreen();
    }
    $.ajaxSetup({
      // Disable caching of AJAX responses
      cache: false
    });
    $('span.cue').html(this.cue);
    /*
    if($('#cue-view').length == 0) {
      $('#glasspane').append($('<div id="cue-view"></div>'));
      $('#cue-view').on('toggle', function(ev, data) {
        if(data === 'show') {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    }
    */
    var i = 0;
    for(i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }
    
    window.console.log(view);
    $.get("/plugin/cue/" + view.view, {}, function(responseText, textStatus) {
      var output = Mustache.render(responseText, view);      
      $('.' + view.screen + '-view').html($(output));
    });
  };
  window.Olympus.plugins.push(Cue);
}(window, document, jQuery));