// load resources
var imageBin = {
    player: null,
    red: null,
    green: null,
    blue: null,
    purple: null,
    orange: null
}
imageBin.player = 'img/ship.png';
imageBin.red = 'img/red.png';
imageBin.green = 'img/green.png';
imageBin.blue = 'img/blue.png';
imageBin.purple = 'img/purple.png';
imageBin.orange = 'img/orange.png';

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
        self.convoyList = [];
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
                    maxX: 5000,
                    minX: -5000,
                    maxY: 5000,
                    minY: -5000
                },
                accel: {
                    x: 500,
                    y: 500,
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
                hitbox: {
                    w: 50,
                    h: 50
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
            this.isPlayer = true;;
        };

        // set up the Cargo unit constructor
        self.Cargo = function () {
            this.position = {
                x: 0,
                y: 0
            };
            this.stats = {
                hp: 20,
                shield: 10,
                color: null,
            };
            this.movement = {
                velocity: {
                    x: 0,
                    y: 0
                }
            }
            this.icon = {
                self: this,
                type: 'image',
                pos: {
                    x: 0,
                    y: 0
                },
                hitbox: {
                    w: 50,
                    h: 50
                },
                image: imageBin.player,
                context: 'fg',
                updateIcon: function(){
                    var self = this;
                    var _parent = self.self
                    self.pos.x = _parent.position.x,
                    self.pos.y = _parent.position.y
                }
            };   // TODO use sprite sheets for monsters, store that info here
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

    GameEngine.prototype.createConvoy = function (length, modifier) {
        var self = this;
        var convoy = [];
        var cargoUnit = null;

        var Xbase = getRandomInteger(0,1) ? 150 : 650;
        var Ybase = getRandomInteger(20, 200);
        var velocityBase = getRandomInteger(1500,2500);

        for (var i = 0; i < length; i++) {
            cargoUnit = new self.Cargo();
            cargoUnit.position.x = Xbase + (i * 50);
            cargoUnit.position.y = Ybase;
            cargoUnit.movement.velocity.x = velocityBase;
            cargoUnit.stats.color = getRandomInteger(0,1) ? (getRandomInteger(0,1) ? 'red' : 'green') : (getRandomInteger(0,1) ? 'blue' : (getRandomInteger(0,1) ? 'orange' : 'purple'));
            cargoUnit.icon.image = imageBin[cargoUnit.stats.color]
            console.log(cargoUnit);
            convoy.push(cargoUnit);
        }
        console.log(convoy);
        self.convoyList.push(convoy);
    }

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

    //set up the movement algorithms
    GameEngine.prototype.move = function(actor, input) {
        var V = actor.movement.velocity;
        var A = actor.movement.accel;
        var applyAccel = function (actor, input) {
            //TODO apply velocity bounds
            var newVx = V.x + A.x * input[0];
            var newVy = V.y + A.y * input[1];
            V.x = newVx;
            V.y = newVy;
        };
        var applyDecel = function (actor, input) {    //TODO program for only releasing one thrust direction
            if (V.x && !input[0]) {
                V.x > 0 ? V.x = Math.floor(V.x * .80) : V.x = Math.ceil(V.x * .80);
            }
            if (V.y && !input[1]) {
                V.y > 0 ? V.y = Math.floor(V.y * .80) : V.y = Math.ceil(V.y * .80);
            }
        };
        var applyVelocity = function (actor) {
            var newPosX = actor.position.x + (V.x/10)/30;
            var newPosY = actor.position.y + (V.y/10)/30;
            if (actor.isPlayer) {
                if (newPosX < 0) {
                    newPosX = 0;
                    V.x = 0;
                } else if (newPosX > 750) {
                    newPosX = 750;
                    V.x = 0;
                }
                if (newPosY < 200) {
                    newPosY = 200;
                    V.y = 0;
                } else if (newPosY > 550) {
                    newPosY = 550;
                    V.y = 0;
                }
            }

            actor.position.x = newPosX;
            actor.position.y = newPosY;
        };
        var clearAccel = function () {
            A.x = 0;
            A.y = 0;
        };

        //if there is x or y input
        //apply acceleration
        //else if there is still velocity on the actor
        //begin to apply deceleration
        if (input[0] || input[1]) {
            applyAccel(actor, input);
            if (V.x && !input[0]) {
                applyDecel(actor, input);
            } else if (V.y && !input[1]) {
                applyDecel(actor, input);
            }
        } else {
            applyDecel(actor, input);
        }

        //if the actor has velocity at the end of the algorithm, apply it to the position
        if (V.x || V.y) {
            applyVelocity(actor);
        };

    };

    GameEngine.prototype.paint = function (thing) {
        var self = this;

        var _lines;

        //is the thing an array of things to paint instead?
        if (Object.prototype.toString.apply(thing) === '[object Array]') {
            for (var i = 0; i < thing.length; i++) {
                thing[i].icon ? self.paint(thing[i].icon) : self.paint(thing[i]);
            }
        } else {
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
        }
    };

    GameEngine.prototype.refreshFGCanvas = function() {
        var self = this;

        // clear the foreground
        self.layersDOM[1].get(0).width = self.layersDOM[1].get(0).width;

        // update the player's location
        var playerInput = self.keys;
        self.move(self.player, playerInput);

        if (self.frameCounter === 10) {
            self.createConvoy(3, 1);
        }

        //process the cargo states
        self.AIHandler(self.frameCounter);

        //update the various icons from their stats
        self.player.icon.updateIcon();
        for (var x = 0; x < self.convoyList.length; x++) {
            var currentConvoy = self.convoyList[x];
            for (var y = 0; y < currentConvoy.length; y++) {
                currentConvoy[y].icon.updateIcon();
            }
        }

        //paint the various icons onto the foreground
        self.paint(self.player.icon);
        self.paint(self.convoyList);

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