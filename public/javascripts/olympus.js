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
