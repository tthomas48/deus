
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , socketio = require('socket.io')
  , fs = require('fs')  
  , EventEmitter = require('events').EventEmitter
  , config = require('./config');

var app = express()
  , server = http.createServer(app)
  , io = socketio.listen(server);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.engine('html', require('hogan-express'));
  //app.enable('view cache');
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.urlencoded());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.cookiesecret));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


io.configure('production', function(){
  io.enable('browser client etag');
  io.set('log level', 1);
  io.set('reconnection', true);
  io.set('reconnectionDelay', 250);
  io.set('reconnectionDelayMax', 1000);
  io.set('timeout', 345600000);
});

io.configure('development', function(){
  io.set('log level', 1);
  io.set('reconnection', true);
  io.set('reconnectionDelay', 250);
  io.set('reconnectionDelayMax', 1000);
  io.set('timeout', 345600000);  
});

io.sockets.on('connection', function(socket) {
    socket.on('/clear', function(data) {
      console.log("Messaging to clear olympus");
      io.sockets.emit('clearOlympus', data);
    });
  
    socket.on('/leaderboard', function(data) {
      console.log("Messaging to show leaderboard");
      io.sockets.emit('/cue/leaderboard', data);
    });
  
    socket.on('/dimmer', function(data) {
      console.log("Messaging to dimmer");
      io.sockets.emit('/cue/dimmer', data);
    });
  
  
  
    socket.on('event', function(event) {
        socket.join(event);
    });
});

var emitter = new EventEmitter();
// load plugins

// Keep track of plugins js and css to load them in the view

var plugins = {
  scripts: [],
  styles: []
}

var deps = {
    server: server
  , app: app
  , io: io
  , config: config
  , emitter: emitter
};


// Load the plugins
var dir = path.join(__dirname, 'plugins');
function getFilter(ext) {
    return function(filename) {
        return filename.match(new RegExp('\\.' + ext + '$', 'i'));
    };
}

config.plugins.forEach(function (plugin) {
    console.log("Loading " + plugin + " plugin.");

    // Load the backend code
    require(path.join(dir, plugin))(plugin, deps);

    // Add the public assets to a static route
    if (fs.existsSync(assets = path.join(dir, plugin, 'public'))) {
      app.use("/plugin/" + plugin, express.static(assets));
    }

    //if (fs.existsSync(assets = path.join(dir, plugin, 'public', 'images'))) {
    //  app.use("/plugin/" + plugin + "/images", express.static(assets));
    //}

    // Add the js to the view
    if (fs.existsSync(js = path.join(assets, 'js'))) {
        fs.readdirSync(js).filter(getFilter('js')).forEach(function(script) {
            plugins.scripts.push("/plugin/" + plugin + "/js/" + script);
        });
    }

    // Add the css to the view
    if (fs.existsSync(css = path.join(assets, 'css'))) {
        fs.readdirSync(css).filter(getFilter('css')).forEach(function(style) {
            plugins.styles.push("/plugin/" + plugin + "/css/" + style);
        });
    }
});


var routes = require('./routes')(io, plugins, emitter);

app.get ('/sound-test',    routes.getSoundTest);
app.get ('/hud',    routes.getHud);
app.get ('/oracle',    routes.getOracle);
app.get ('/leaderboard',    routes.getLeaderboard);

app.get ('/events/:shortname',    routes.getEvent);
app.get ('/e/:shortname',    routes.getEventSnippet);
app.post('/vote/sms',             routes.voteSMS);
app.post('/vote/voice',           routes.voteVoice);
app.post('/vote/voice/selection', routes.voiceSelection);

app.get('/admin/', function(req, res) {
  if(process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.get('Host') + req.url);
  }
  else {
    routes.admin(req, res);
  }
});

app.post  ('/api/sessions',   routes.login);
app.delete('/api/sessions',   routes.logout);
app.get   ('/api/events',     routes.getEventList);
app.post  ('/api/events',     routes.saveEvent);
app.get   ('/api/events/:id', routes.getEventById);
app.delete('/api/events/:id', routes.destroyEvent);
app.get   ('/api/tree',     routes.getTreeList);
app.post  ('/api/tree',     routes.saveTree);
app.get   ('/api/tree/:id', routes.getTreeById);
app.delete('/api/tree/:id', routes.destroyTree);
app.get   ('/api/show',     routes.getShowList);
app.post  ('/api/show',     routes.saveShow);
app.get   ('/api/show/current', routes.getCurrentShow);
app.post   ('/api/show/current', routes.saveShow);
app.get   ('/api/show/:id', routes.getShowById);
app.delete('/api/show/:id', routes.destroyShow);
app.get   ('/api/voters',     routes.getVoterList);
app.post  ('/api/voters',     routes.saveVoter);
app.get   ('/api/voters/:id', routes.getVoterById);
app.delete('/api/voters/:id', routes.destroyVoter);
app.post  ('/api/transaction', routes.saveTransaction);

// triggers
app.post   ('/api/simulator',  routes.runSimulator);
app.post  ('/api/events/:id/timer/:state', routes.startTimer);
