// Lots of this code is taken from
// http://www.html5rocks.com/en/tutorials/doodles/gamepad/

(function(window, document) {
  var Gamepad = function(cockpit) {
    console.log("Loading gamepad plugin.");
    this.cockpit = cockpit;
    this.ticking = false;
    this.recording = false;
    this.gamepads = [];
    this.prevRawGamepadTypes = [];
    this.prevTimestamps = [];
    this.axis = {
      digitalVertical : 5,
      digitalHorizontal : 4,
      leftAnalogVertical : 1,
      leftAnalogHorizontal : 0,
      rightAnalogVertical : 3,
      rightAnalogHorizontal : 2
    };
    this.buttonMap = {
      x : 2,
      circle : 1,
      square : 3,
      triangle : 0,
      select : 8,
      start : 9,
      l1 : 4,
      l2 : 6,
      r1 : 5,
      r2 : 7
    };
    this.keyMap = {
      x : 88, // x
      circle : 67, // c
      square : 90, // z
      triangle : 83, // s
      select : 77, // n
      start : 13, // enter key
      l1 : 37, // left
      l2 : -1,
      r1 : 39, // right
      r2 : -1
    };

    var gamepadSupportAvailable = (!!navigator.webkitGetGamepads
        || !!navigator.webkitGamepads || (navigator.userAgent
        .indexOf('Firefox/') != -1));
    if (!gamepadSupportAvailable) {
      console.log('Gamepad not supported.');
    } else {
      console.log('Gamepad supported.')
      window.addEventListener('MozGamepadConnected', this.onGamepadConnect
          .bind(this), false);
      window.addEventListener('MozGamepadDisconnected',
          this.onGamepadDisconnect.bind(this), false);
      if (!!navigator.webkitGamepads || !!navigator.webkitGetGamepads) {
        this.startPolling();
      }
    }

    var gp = this;
    // reset the cueing system
    this.cockpit.socket.emit('/cue/reset', {});

    // setup keyboard handlers
    $(document).keyup(function(ev) {
      var keycode = ev.keyCode;
      if (keycode === gp.keyMap.triangle) {
        gp.cockpit.socket.emit('/cue/toggle', {});
        return;
      }

      gp.handleCue({
        clearScreen : (keycode == gp.keyMap.circle ? 1 : 0),
        go : (keycode == gp.keyMap.x ? 1 : 0),
        backward : (keycode == gp.keyMap.l1 ? 1 : 0),
        forward : (keycode == gp.keyMap.r1 ? 1 : 0),
        start : (keycode == gp.keyMap.start ? 1 : 0),
      });
    });

  };

  Gamepad.prototype.onGamepadConnect = function(event) {
    this.gamepads.push(event.gamepad);
    this.startPolling();
  };

  Gamepad.prototype.onGamepadDisconnect = function(event) {
    for ( var i in this.gamepads) {
      if (this.gamepads[i].index == event.gamepad.index) {
        this.gamepads.splice(i, 1);
        break;
      }
    }
    if (this.gamepads.length == 0) {
      this.stopPolling();
    }
  };

  Gamepad.prototype.clearScreen = function() {
    $('#cue-view').toggle();
  };

  Gamepad.prototype.startPolling = function() {
    if (!this.ticking) {
      this.ticking = true;
      this.tick();
    }
  };

  Gamepad.prototype.stopPolling = function() {
    this.ticking = false;
  };

  Gamepad.prototype.tick = function() {
    this.pollStatus();
    this.scheduleNextTick();
  };

  Gamepad.prototype.scheduleNextTick = function() {
    if (this.ticking) {
      requestAnimationFrame(this.tick.bind(this));
    }
  };

  Gamepad.prototype.pollStatus = function() {
    this.pollGamepads();
    for ( var i in this.gamepads) {
      var gamepad = this.gamepads[i];
      if (gamepad.timestamp && (gamepad.timestamp == this.prevTimestamps[i])) {
        continue;
      }
      this.prevTimestamps[i] = gamepad.timestamp;
      this.updateDisplay(i);
    }
  };

  Gamepad.prototype.pollGamepads = function() {
    var rawGamepads = ((navigator.webkitGetGamepads && navigator
        .webkitGetGamepads()) || navigator.webkitGamepads);
    if (rawGamepads) {
      this.gamepads = [];
      var gamepadsChanged = false;
      for (var i = 0; i < rawGamepads.length; i++) {
        if (typeof rawGamepads[i] != this.prevRawGamepadTypes[i]) {
          gamepadsChanged = true;
          this.prevRawGamepadTypes[i] = typeof rawGamepads[i];
        }
        if (rawGamepads[i]) {
          this.gamepads.push(rawGamepads[i]);
        }
      }
      if (gamepadsChanged) {
        // tester.updateGamepads(gamepadSupport.gamepads);
      }
    }
  };

  Gamepad.prototype.handleCue = function handleCue(cmd) {
    if (cmd.go === 1) {
      this.cockpit.socket.emit('/cue/go', {});
    }
    if (cmd.backward === 1) {
      this.cockpit.socket.emit('/cue/backward', {});
    }
    if (cmd.forward === 1) {
      this.cockpit.socket.emit('/cue/forward', {});
    }
    if (cmd.clearScreen === 1) {
      this.clearScreen();
    }
    if (cmd.start === 1) {
      if(window.startTimer) {
        startTimer();
      }
    }
  };

  Gamepad.prototype.updateDisplay = function(gamepadId) {
    var gamepad = this.gamepads[gamepadId];

    var modeToggle = gamepad.buttons[this.buttonMap.triangle];
    if (modeToggle === 1) {
      this.cockpit.socket.emit('/cue/toggle', {});
      return;
    }

    this.handleCue({
      clearScreen : gamepad.buttons[this.buttonMap.circle],
      go : gamepad.buttons[this.buttonMap.x],
      backward : gamepad.buttons[this.buttonMap.l1],
      forward : gamepad.buttons[this.buttonMap.r1],
      start : gamepad.buttons[this.buttonMap.start]
    });
    return;
  };

  window.Olympus.plugins.push(Gamepad);

}(window, document));
