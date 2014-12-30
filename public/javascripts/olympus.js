(function(window, document, $, undefined) {
        
    var hostname = document.location.hostname ? document.location.hostname : "localhost";

    var Olympus = function Olympus() {

        this.socket = io.connect();
        this.loadPlugins();

        // Fullscreen on doubleclick
        $("#glasspane").dblclick(function(ev) {
            ev.preventDefault();
            $(document).toggleFullScreen();
            return false;
        });

        // Basic socket messages
        this.socket.on('/message', function(data) {
            $.notifyBar({
                html     : JSON.stringify(data)
              });
        });
        this.socket.on('/success', function(data) {
            $.notifyBar({
                cssClass : "success",
                html     : 'Success : ' + JSON.stringify(data)
              });
        });
        this.socket.on('/warning', function(data) {
            $.notifyBar({
                cssClass : "warning",
                html     : JSON.stringify(data)
              });
        });
        this.socket.on('/error', function(e) {
            $.notifyBar({
                cssClass : "error",
                html     : 'Error : ' + JSON.stringify(e)
              });
        });
      window.console.log("Adding olympus clear handler");
        this.socket.on('clearOlympus', function(view) {
          window.console.log("Clearing");
          $('.' + view + '-view').html('');
          if (typeof stage !== 'undefined') {
            stage.removeAllChildren();
            stage.update();      
          }
        });
        if($('.hud-view').length) {
          //window.console.log("adding environmental controls handlers");
          this.socket.on('/environmentControlsThreshold', function(deity_name) {
            // trigger the event for the specified deity
            window.console.log('* received threshhold trigger for '+JSON.stringify(deity_name));
            if($('#'+deity_name+'-icon').length) {
              //window.console.log('changing display...');
              $('#'+deity_name+'-icon .overlay').fadeIn(1500, function() {
                $(this).fadeOut(1500);
              });
            }
          });
          this.socket.on('/environmentControlsUpdate', function(prayerCounts) {
            // update the counter displays
            window.console.log("* received update trigger with data: "+JSON.stringify(prayerCounts));
            for(var deity_name in prayerCounts) {
              //window.console.log('updating count for '+deity_name+' with data: '+prayerCounts[deity_name]);
              if($('#'+deity_name+'-count').length) {
                $('#'+deity_name+'-count').html(prayerCounts[deity_name]);
              }
            }
          });
        }
    };

    Olympus.prototype.loadPlugins = function loadPlugins() {
        var olympus = this;
        Olympus.plugins.forEach(function(plugin) {
            new plugin(olympus);
        });
    };

    // Static array containing all plugins to load
    Olympus.plugins = [];

    window.Olympus = Olympus;
}(window, document, jQuery));
