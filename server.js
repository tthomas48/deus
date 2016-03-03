require('newrelic');
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var flash = require('connect-flash');
var jwt      = require('jsonwebtoken');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var config = require('./server/config');
var orm = require('orm');

var _ = require('lodash');

var app = express()
var server = http.createServer(app);
var emitter = new EventEmitter();
var io = socketio.listen(server);

var environment = process.env.NODE_ENV || "development";
var database = require('./server/database')[environment];

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/server/views');
  app.engine('html', require('hogan-express'));
  //app.enable('view cache');
  app.set('view engine', 'html');
  app.set('views', __dirname + '/server/views');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.urlencoded());
  app.use(express.bodyParser());
  //app.use(session({ secret: 'godinthemachine' })); // session secret
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.cookiesecret));
  app.use(orm.express({
        host: database.host,
        database: database.database,
        protocol: database.driver,
        port: database.port,
        user: database.user,
        password: database.password,
        query: {
          debug: database.debug,
          pool: database.pool
        }
      }, {
      define: function (db, models, next) {
        require(__dirname + '/server/models')(db, models, io, emitter, next);
      }
  }));

  if (app.get('env') == 'development') {
    var browserSync = require('browser-sync');
    var bs = browserSync({ logSnippet: false, files: ["public/**/*"]});
    app.use(require('connect-browser-sync')(bs));
  }
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

passport.use(new BasicStrategy({ passReqToCallback: true },
  function(req, username, password, done) {
    "use strict";
    var error = new Error();
    error.status = 401;
    if (_.isEmpty(username) || _.isEmpty(password)) {
      return done(error);
    }
    console.log("Incoming", username, password);

    var decoded;
    try {
      decoded = jwt.verify(password, config.tokensecret);
    } catch(e) {
      return done(error);
    }

    if (decoded.username !== username) {
      return done(error);
    }
    req.models.user.find({id: decoded.id}, function(err, users) {
      if (err) {
        return done(error);
      }
      else if (users.length === 0) {
        done(error);
      }
      else {
        done(null, users[0]);
      }
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  console.log(user);
  done(null, user);
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


var routes = require(__dirname + '/server/routes')(io, plugins, emitter);

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

var controllers = require(__dirname + '/server/controllers')(io, plugins, emitter);
var auth = passport.authenticate('basic', {session: false});
app.post('/api/register', controllers.user.register);
app.put('/api/verify', controllers.user.verify);
app.post('/api/sessions', controllers.user.login);
app.delete('/api/sessions', controllers.user.logout);
app.get('/api/projects', auth, controllers.project.list);
app.post('/api/projects', auth, controllers.project.create);
app.get('/api/projects/:project_id/events', auth, controllers.event.list);
app.post('/api/projects/:project_id/events', auth, controllers.event.save);
app.get('/api/projects/:project_id/events/:id', auth, controllers.event.load);
app.delete('/api/projects/:project_id/events/:id', auth, controllers.event.delete);
app.get('/api/projects/:project_id/tree', auth, controllers.tree.list/*routes.getTreeList*/);
app.post('/api/projects/:project_id/tree', auth, controllers.tree.save/*routes.saveTree*/);
app.get('/api/projects/:project_id/tree/:id', auth, controllers.tree.load/*routes.getTreeById*/);
app.delete('/api/projects/:project_id/tree/:id', auth, controllers.tree.delete/*routes.destroyTree*/);
app.get('/api/show', routes.getShowList);
app.post('/api/show', routes.saveShow);
app.get('/api/show/current', routes.getCurrentShow);
app.post('/api/show/current', routes.saveShow);
app.get('/api/show/:id', routes.getShowById);
app.delete('/api/show/:id', routes.destroyShow);
app.get('/api/voters', routes.getVoterList);
app.post('/api/voters', routes.saveVoter);
app.get('/api/voters/:id', routes.getVoterById);
app.delete('/api/voters/:id', routes.destroyVoter);
app.post('/api/transaction', routes.saveTransaction);

// triggers
app.post('/api/simulator', routes.runSimulator);
app.post('/api/events/:id/timer/:state', routes.startTimer);
