// load resources
var imageBin = {
    player: null,
    red: null,
    green: null,
    blue: null
}
imageBin.player = 'img/ship.png';
imageBin.red = 'img/red.png';
imageBin.green = 'img/green.png';
imageBin.blue = 'img/blue.png';

for (_img in imageBin) {
    var _$imageDOM = $('<img/>')[0]
    _$imageDOM.src = imageBin[_img];
    imageBin[_img] =  _$imageDOM
}

(function($) {
    function GameEngine (config) {
        var self = this;

        // options, defaults and the merging thereof
        var defaults = {
            display: {
                height: 600,
                width: 800,
                refreshRate: 60
            },
            controls: {
                up: 87,    // w
                down: 83,  // s
                left: 65,  // a
                right: 68  // d
            }
        };

        self.options = $.extend({}, defaults, config);
        self.keys = [0,0];

        // set some common variables
        self.$game = $('#game');
        self.layersArray = ['ui', 'fg', 'bg'];
        self.layersDOM = [];
        self.frameCounter = 0;

        // the actors, and lists of actor and other entities
        self.player = null;
        self.monsterList = [];
        self.sceneryList = [];
        self.walls = [];

        // codify the canvas settings from options n stuff and prep the object for the canvas contexts
        self.canvas = {
            height: self.options.display.height,
            width: self.options.display.width
        };

        self.canvasLayers = {
            ui: null,
            fg: null,
            bg: null
        };


        // set up the Player constructor
        self.Player = function () {
            this.position = {
                x: 350,
                y: 400
            };
            this.movement = {
                self: this,
                velocity: {
                    x: 0,
                    y: 0,
                    max: 150
                },
                accel: {
                    x: 300,
                    y: 300,
                    lastTick: 0
                },
                applyAccel: function (input) {
                    var self = this;
                    self.velocity.x += self.accel.x * input[0];
                    self.velocity.y += self.accel.y * input[1];
                },
                applyDecel: function () {
                    var self = this;
                    if (self.velocity.x) {
                        self.velocity.x > 0 ? self.velocity.x = Math.floor(self.velocity.x * .9) : self.velocity.x = Math.ceil(self.velocity.x * .9);
                    }
                    if (self.velocity.y) {
                        self.velocity.y > 0 ? self.velocity.y = Math.floor(self.velocity.y * .9) : self.velocity.y = Math.ceil(self.velocity.y * .9);
                    }
                    console.log(self.velocity.x + " " + self.velocity.y);
                },
                applyVelocity: function () {
                    var self = this;
                    var _player = self.self;
                    _player.position.x += (self.velocity.x/10)/30;
                    _player.position.y += (self.velocity.y/10)/30;
                },
                clearAccel: function () {
                    var self = this;
                    self.accel.x = 0;
                    self.accel.y = 0;
                }
            }
            this.stats = {
                hp: 0,
                mp: 0,
                xp: 0,
                level: 0,
            };
            this.icon = {
                self: this,
                type: 'image',
                pos: {
                    x: 300,
                    y: 100
                },
                image: imageBin.player,
                context: 'fg',
                updateIcon: function(){
                    var self = this;
                    var _player = self.self
                    self.pos.x = _player.position.x,
                    self.pos.y = _player.position.y
                }
            };
            this.isOOB = false;
        };

        // set up the Monster constructor
        self.Foe = function () {
            this.position = {
                x: 0,
                y: 0
            };
            this.stats = {
                hp: 0,
                mp: 0,
                xpValue: 0,
                moveSpeed: 0
            };
            this.icon = {};   // TODO use sprite sheets for monsters, store that info here
        };

        // set up the art constructor
        self.Art = function (oX,oY,w,h,color,context) {
            this.origin = {
                x: oX,
                y: oY
            };
            this.dim = {
                w: w,
                h: h
            };
            this.color = color;
            this.context = context;
        };

        self.icon = {

        };
    }


    // build game engine out of the three canvas layers
    GameEngine.prototype.createGameWindow = function () {
        var self = this;
        var _layerIndex, _$el, _layer;

        // create each canvas layer DOM object
        for (_layerIndex = 0; _layerIndex < self.layersArray.length; _layerIndex += 1) {
            _layer = self.layersArray[_layerIndex];
            _$el = $('<canvas></canvas>');
            _$el.attr({
                id: _layer,
                height: self.canvas.height,
                width: self.canvas.width
            });

            // add it the game section
            self.$game.append(_$el);

            // build the array of canvas DOM objects
            self.layersDOM.push($('#'+ _layer));

            // bind the canvas element with the appropriate object
            self.canvasLayers[_layer] = self.layersDOM[_layerIndex].get(0).getContext('2d');
        }
    };

    // create the initial player state
    GameEngine.prototype.createPlayer = function () {
        var self = this;
        self.player = new self.Player();
    };

    GameEngine.prototype.createPlayfield = function () {
        var self = this;

        var _background = {
            origin: {
                x: 0, 
                y: 0
            },
            dim: {
                w: 800,
                h: 600
            },
            color: 'black',
            context: 'bg',
            type: 'shape'
        };

        var _frame = {
            lines: [
                {
                    start: {
                        x: 0,
                        y: 0
                    },
                    point2: {
                        x: 0,
                        y: 600,
                    },
                    point3: {
                        x: 800,
                        y: 600
                    },
                    point4: {
                        x: 800,
                        y: 0
                    },
                    end: {
                        x: 0,
                        y: 0
                    }
                },
            ],
            type: 'line',
            context: 'bg',
            color: 'white',
            lineWidth: 3
        };
        self.paint(_background);
        self.paint(_frame);

        for (var _stars = 0; _stars < 500; _stars += 1) {
            _thisStar = {
                origin: {
                    x: getRandomInteger(0,800),
                    y: getRandomInteger(0,600),
                },
                dim: {
                    w: 2,
                    h: 2,
                },
                type: 'shape',
                context: 'bg',
                color: getRandomInteger(0,12) ? 'white' : (getRandomInteger(0,1) ? 'aqua' : 'salmon')
            };
            self.paint(_thisStar);
        }

    };

    GameEngine.prototype.paint = function (thing) {
        var self = this;

        var _lines;

        var _context = self.canvasLayers[thing.context];

        // line drawing algorithm
        if (thing.type === 'line') {

            // set properties of the line
            _context.lineWidth = thing.lineWidth;
            _context.strokeStyle = thing.color;

            // start parsing the lines
            for (var _i in thing.lines) {
                var _line = thing.lines[_i];
                var _start = [_line.start.x, _line.start.y];
                var _end = [_line.end.x, _line.end.y];

                // begin line
                _context.moveTo(_start[0], _start[1]);

                // if the line consists of multiple segments, iterate through those
                if (_line.point2) {
                    var _point = 2;
                    while (_line['point'+_point]) {
                        _thisPoint = _line['point'+_point];
                        _context.lineTo(_thisPoint.x, _thisPoint.y);
                        _point += 1;
                    }
                }
                // end the line
                _context.lineTo(_end[0], _end[1]);
            }

            // stroke that line
            _context.stroke();
        }

        // rectangle algorithm
        else if (thing.type === 'shape') {
            _context.fillStyle = thing.color;
            _context.fillRect(
                thing.origin.x, thing.origin.y,
                thing.dim.w, thing.dim.h
            )
        }

        // text algorithm
        else if (thing.type === 'text') {
            _context.fillStyle = thing.color;
            _context.font = thing.font;

            _context.fillText(
                thing.content,
                thing.pos.x, thing.pos.y
            );
        }

        // image algorithm
        else if (thing.type === 'image') {
            var _image = thing.image;

            _context.drawImage(
                _image,
                thing.pos.x, thing.pos.y
            );
        }

    };

    GameEngine.prototype.refreshFGCanvas = function() {
        var self = this;
        var _playerMove = self.player.movement

        // clear the foreground
        self.layersDOM[1].get(0).width = self.layersDOM[1].get(0).width;

        //check if player has moved out-of-bounds
        console.log(self.player.position.x + " " + self.player.position.y)
        if ((self.player.position.x < 40 || self.player.position.x > 600) || (self.player.position.y < 200 || self.player.position.x > 500)) {
            self.player.isOOB = true;
        } else {
            self.player.isOOB = false;
        }

        // update the player's location
        // if a directional key is held down, apply 1/30 the acceleration to the velocity
        // else begin deceleration
        if ((self.keys[0] || self.keys[1])) {
            _playerMove.applyAccel(self.keys);
        } else {
            _playerMove.applyDecel();
        }
        // apply 1/30 the velocity to the player's position
        _playerMove.applyVelocity();
        self.player.icon.updateIcon();
        self.paint(self.player.icon);

        // fps counter
        var fps = {
            type: 'text',
            content: 'frame: ' + self.frameCounter,
            font: '12px Courier',
            color: 'yellow',
            pos: {
                x: 10,
                y: 590
            },
            context: 'fg'
        };
        self.paint(fps);
        self.frameCounter += 1;
    };

    GameEngine.prototype.updateObject = function () {

    }

    GameEngine.prototype.boot = function () {
        var self = this;

        self.createGameWindow();
        self.createPlayer();
        self.createPlayfield();

        $(window).on('keydown', function(event){
            var _event = event;
            self.processInput(_event);
        });
        $(window).on('keyup', function(event){
            var _event = event;
            self.processInput(_event);
        });

        window.setInterval(function() {
            // var that = self;
            self.refreshFGCanvas();
        }, 1000/30);
    };

    GameEngine.prototype.processInput = function (event) {
        var self = this;
        var _controls = self.options.controls;
        if (event.type === 'keydown') {
            switch (event.which) {
                case _controls.left:
                    event.preventDefault();
                    self.keys[0] = -1;
                    break;
                case _controls.right:
                    event.preventDefault();
                    self.keys[0] = 1;
                    break;
                case _controls.up:
                    event.preventDefault();
                    self.keys[1] = -1;
                    break;
                case _controls.down:
                    event.preventDefault();
                    self.keys[1] = 1;
                    break;
                case _controls.wait:
                    event.preventDefault();
                    break;
                default:
                    return;
            }
            
        } 
        else if (event.type === 'keyup') {
            switch (event.which) {
                case _controls.left:
                    event.preventDefault();
                    self.keys[0] = 0;
                    break;
                case _controls.right:
                    event.preventDefault();
                    self.keys[0] = 0;
                    break;
                case _controls.up:
                    event.preventDefault();
                    self.keys[1] = 0;
                    break;
                case _controls.down:
                    event.preventDefault();
                    self.keys[1] = 0;
                    break;
                case _controls.wait:
                    event.preventDefault();
                    break;
                default:
                    return;
            }
            
        }
    }

    $(document).ready(function() {
        var game = new GameEngine();
        game.boot();

    });
})(jQuery);