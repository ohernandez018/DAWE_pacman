// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;
var puntosFantasma = 100;
var puntosPildora = 10;

Math.trunc = Math.trunc || function(x) {
    return x - x % 1;
}

// GAME FRAMEWORK 
var GF = function() {

    // variables para contar frames/s, usadas por measureFPS
    var frameCount = 0;
    var lastTime;
    var fpsContainer;
    var fps;

    //  variable global temporalmente para poder testear el ejercicio
    inputStates = {
        left: false,
        right: false,
        up: false,
        down: false,
        space: false
    };

    const TILE_WIDTH = 24,
        TILE_HEIGHT = 24;

    var numGhosts = 4;
    var ghostcolor = {};
    ghostcolor[0] = "rgba(255, 0, 0, 255)";
    ghostcolor[1] = "rgba(255, 128, 255, 255)";
    ghostcolor[2] = "rgba(128, 255, 255, 255)";
    ghostcolor[3] = "rgba(255, 128, 0,   255)";
    ghostcolor[4] = "rgba(50, 50, 255,   255)"; // blue, fantasma vulnerable
    ghostcolor[5] = "rgba(255, 255, 255, 255)"; // white, parpadeo de fantasma


    // contenedor de fantasmas
    var ghosts = {};

    var Ghost = function(id, ctx) {

        this.x = 0;
        this.y = 0;
        this.velX = 0;
        this.velY = 0;
        this.speed = 1;
        this.nearestRow = 0;
        this.nearestCol = 0;
        this.ctx = ctx;
        this.id = id;
        this.homeX = 0;
        this.homeY = 0;

        // array de sprites
        this.sprites = [
            new Sprite('../res/img/sprites.png', [456, 16 * this.id + 65], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [585, 64], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [616, 64], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [585, 82], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [488, 16 * this.id + 65], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [520, 16 * this.id + 65], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [552, 16 * this.id + 65], [16, 16], 0.005, [0, 1])
        ];

        this.sprite = 0;

        this.draw = function() {
            if (this.state != 3) {
                if (this.state == 1) {
                    this.sprite.render(ctx, this.x - thisGame.TILE_WIDTH / 2, this.y - thisGame.TILE_HEIGHT / 2);
                } else if (this.state == 2) {
                    if (thisGame.ghostTimer > 100) {
                        this.sprites[1].render(ctx, this.x - thisGame.TILE_WIDTH / 2, this.y - thisGame.TILE_HEIGHT / 2);
                    } else {
                        if (thisGame.ghostTimer >= 75 || (thisGame.ghostTimer >= 25 && thisGame.ghostTimer < 50)) {
                            this.sprites[1].render(ctx, this.x - thisGame.TILE_WIDTH / 2, this.y - thisGame.TILE_HEIGHT / 2);
                        } else if ((thisGame.ghostTimer >= 0 && thisGame.ghostTimer < 25) || (thisGame.ghostTimer >= 50 && thisGame.ghostTimer < 75)) {
                            this.sprites[2].render(ctx, this.x - thisGame.TILE_WIDTH / 2, this.y - thisGame.TILE_HEIGHT / 2);
                        }
                    }
                }
            } else {
                this.sprites[3].render(ctx, this.x - thisGame.TILE_WIDTH / 2, this.y - thisGame.TILE_HEIGHT / 2);
            }
        };

        this.move = function() {

            for (var i = 0; i < 4; i++) {
                this.sprites[i].update(delta);
            }

            if (this.state != 3) {
                var posiblesMovimientos = [
                    [0, -1],
                    [1, 0],
                    [0, 1],
                    [-1, 0]
                ];
                var soluciones = [];

                if (this.x % (TILE_WIDTH / 2) == 0 && this.x % TILE_WIDTH != 0 && this.y % (TILE_HEIGHT / 2) == 0 && this.y % TILE_HEIGHT != 0) {
                    var fila = Math.trunc(this.y / TILE_HEIGHT);
                    var colum = Math.trunc(this.x / TILE_WIDTH);

                    for (var i = 0; i < posiblesMovimientos.length; i++) {
                        if (!thisLevel.isWall(fila + posiblesMovimientos[i][0], colum + posiblesMovimientos[i][1])) {
                            soluciones.push(new Array(posiblesMovimientos[i][0], posiblesMovimientos[i][1]));
                        }
                    }

                    //Compruebo si hemos llegado a una pared
                    var pared = "false";
                    if (this.velX > 0) {
                        if (thisLevel.isWall(fila, colum + 1)) {
                            pared = "true";
                        }
                    } else if (this.velX < 0) {
                        if (thisLevel.isWall(fila, colum - 1)) {
                            pared = "true";
                        }
                    } else if (this.velY > 0) {
                        if (thisLevel.isWall(fila + 1, colum)) {
                            pared = "true";
                        }
                    } else if (this.velY < 0) {
                        if (thisLevel.isWall(fila - 1, colum)) {
                            pared = "true";
                        }
                    }


                    //Si hemos llegado a una pared o estamos en bifurcacion
                    if (soluciones.length > 2 || pared == "true") {
                        var movimientoElegido = soluciones[Math.floor(Math.random() * soluciones.length) + 0];
                        this.velX = movimientoElegido[1] * this.speed;
                        this.velY = movimientoElegido[0] * this.speed;
                        this.x = this.x + this.velX;
                        this.y = this.y + this.velY;

                    } else {
                        this.x = this.x + this.velX;
                        this.y = this.y + this.velY;
                    }

                } else {
                    this.x = this.x + this.velX;
                    this.y = this.y + this.velY;
                }

                if (this.velX < 0) {
                    this.sprite = this.sprites[4];
                } else if (this.velX > 0) {
                    this.sprite = this.sprites[0];
                } else if (this.velY < 0) {
                    this.sprite = this.sprites[5];
                } else if (this.velY > 0) {
                    this.sprite = this.sprites[6];
                }

            } else {

                // Si esl estado del fantasma es Ghost.SPECTACLES
                // Mover el fantasma lo más recto posible hacia la casilla de salida
                var fila = Math.trunc(this.y / thisGame.TILE_HEIGHT);
                var colum = Math.trunc(this.x / thisGame.TILE_WIDTH);
                var colH = Math.trunc(this.homeX / thisGame.TILE_HEIGHT);
                var filaH = Math.trunc(this.homeY / thisGame.TILE_WIDTH);

                if (fila == filaH && colum == colH) {

                    this.state = 1;
                    this.velX = 0;
                    this.velY = 0;
                    this.x = this.homeX;
                    this.y = this.homeY;
                } else {

                    if (fila != filaH && colum != colH) {
                        this.y = this.y + this.velY;
                        this.x = this.x + this.velX;
                    } else if (colum != colH) {
                        this.x = this.x + this.velX;
                    } else {
                        this.y = this.y + this.velY;
                    }

                }

            }
        };

    }; // fin clase Ghost

    // static variables
    Ghost.NORMAL = 1;
    Ghost.VULNERABLE = 2;
    Ghost.SPECTACLES = 3;

    var Level = function(ctx) {
        this.ctx = ctx;
        this.lvlWidth = 0;
        this.lvlHeight = 0;

        this.map = [];

        this.pellets = 0;
        this.powerPelletBlinkTimer = 0;


        this.setMapTile = function(row, col, newValue) {
            if (newValue == 2 || newValue == 3) {
                this.pellets++;
            }
            this.map[(row * this.lvlWidth) + col] = newValue;
        };

        this.getMapTile = function(row, col) {
            return this.map[(row * this.lvlWidth) + col];
        };

        this.printMap = function() {
            console.log(this.map);
        };

        this.loadLevel = function() {
            $.ajaxSetup({ async: false });

            $.get("../res/levels/1.txt", (data) => {
                var trozos = data.split("#");

                //cojo el ancho
                var valores = trozos[1].split(" ");
                this.lvlWidth = valores[2];

                //cojo la altura
                valores = trozos[2].split(" ");
                this.lvlHeight = valores[2];

                //cojo los valores
                valores = trozos[3].split("\n");

                var filas = valores.slice(1, valores.length - 1);

                $.each(filas, (n, elem1) => {
                    var nums = elem1.split(" ");
                    $.each(nums, (m, elem2) => {
                        this.setMapTile(n, m, elem2);
                    });

                });
            });

            var puntos = localStorage.getItem("highscorepacman");
            if (puntos != null) {
                thisGame.highscore = puntos;
            } else {
                localStorage.setItem("highscorepacman", 0);
                thisGame.highscore = 0;
            }

            //this.printMap();
        };

        this.drawMap = function() {

            var TILE_WIDTH = thisGame.TILE_WIDTH;
            var TILE_HEIGHT = thisGame.TILE_HEIGHT;

            var tileID = {
                'door-h': 20,
                'door-v': 21,
                'pellet-power': 3
            };


            if (this.powerPelletBlinkTimer < 60) {
                this.powerPelletBlinkTimer = this.powerPelletBlinkTimer + 1;
            } else {
                this.powerPelletBlinkTimer = 0;
            }

            for (var fila = 0; fila <= thisGame.screenTileSize[0]; fila++) {
                for (var colum = 0; colum < thisGame.screenTileSize[1]; colum++) {
                    var act = this.getMapTile(fila, colum);
                    if (act == 4) {
                        //Pacman
                    } else if (act == 2) {
                        //Pildora
                        ctx.beginPath();
                        ctx.arc(colum * TILE_WIDTH + (TILE_WIDTH / 2), fila * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fill();
                    } else if (act == 3) {
                        //Pildora de poder
                        if (this.powerPelletBlinkTimer < 30) {
                            ctx.beginPath();
                            ctx.arc(colum * TILE_WIDTH + (TILE_WIDTH / 2), fila * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
                            ctx.fillStyle = "#FF0000";
                            ctx.fill();
                        }
                    } else if (act >= 100 && act < 200) {
                        //Pared
                        ctx.fillStyle = '#0000FF';
                        ctx.fillRect(colum * TILE_WIDTH, fila * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
                    } else if (act >= 10 && act < 14) {
                        //Fantasmas
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(colum * TILE_WIDTH, fila * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
                    }
                }
            }

            displayScore();
        };


        this.isWall = function(row, col) {
            var act = this.getMapTile(row, col);
            return (100 <= act && act <= 199);
        };


        this.checkIfHitWall = function(possiblePlayerX, possiblePlayerY, row, col) {
            if ((possiblePlayerX % (thisGame.TILE_WIDTH / 2) == 0 || possiblePlayerY % (thisGame.TILE_HEIGHT / 2) == 0)) {
                var fila = Math.trunc(possiblePlayerY / thisGame.TILE_HEIGHT);
                var colum = Math.trunc(possiblePlayerX / thisGame.TILE_WIDTH);
                return this.isWall(fila, colum);

            } else {
                return true;
            }
        };

        this.checkIfHit = function(playerX, playerY, x, y, holgura) {
            return (!(Math.abs(playerX - x) > holgura || Math.abs(playerY - y) > holgura));
        };


        this.checkIfHitSomething = function(playerX, playerY, row, col) {
            var tileID = {
                'door-h': 20,
                'door-v': 21,
                'pellet-power': 3,
                'pellet': 2
            };

            var fila = Math.trunc(playerY / thisGame.TILE_HEIGHT);
            var colum = Math.trunc(playerX / thisGame.TILE_WIDTH);
            var valor = this.getMapTile(fila, colum);
            if (valor == 2) {

                this.setMapTile(row, col, 0);
                this.pellets--;
                eating.play();
                thisGame.addToScore(puntosPildora);
            }

    
            //  Gestiona las puertas teletransportadoras
            //  Realizo los cambios segun las puertas
            else if (valor == 21) {
                if (row == 0) {
                    player.y = thisGame.screenTileSize[0] * thisGame.TILE_HEIGHT - (thisGame.TILE_HEIGHT / 2);
                } else {
                    player.y = thisGame.TILE_HEIGHT + (thisGame.TILE_HEIGHT / 2);
                }
            } else if (valor == 20) {
                if (col == 0) {
                    player.x = (thisGame.screenTileSize[1] - 1) * thisGame.TILE_WIDTH - (thisGame.TILE_WIDTH / 2);
                } else {
                    player.x = thisGame.TILE_WIDTH + (thisGame.TILE_WIDTH / 2);
                }
            }

            
            // Gestiona la recogida de píldoras de poder
            else if (valor == 3) {
                this.setMapTile(row, col, 0);
                this.pellets--;
                eatpill.play();
                for (var i = 0; i < numGhosts; i++) {
                    ghosts[i].state = 2;
                }
                thisGame.ghostTimer = 360;
            }

            if (this.pellets == 0) {
                thisGame.setMode(thisGame.WIN);
                actualizarPuntuacion();
            }

        };

    }; // end Level 

    var actualizarPuntuacion = function() {
        var puntos = localStorage.getItem("highscorepacman");
        if (puntos < thisGame.points) {
            localStorage.setItem("highscorepacman", thisGame.points);
        }
    }

    var displayScore = function() {
        ctx.beginPath();
        ctx.fillStyle = '#FF0000';
        ctx.font = "bold 20px arial";
        ctx.fillText("1UP", 24, 22);
        ctx.fillText("HIGH SCORE", 290, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(thisGame.points, 75, 22);
        ctx.fillText(thisGame.highscore, 450, 22);
        ctx.fillText("Lifes:", 5, 595);

        for (var i = 0; i < thisGame.lifes; i++) {
            ctx.beginPath();
            ctx.arc(72 + 20 * i, 590, 8, 0.25 * Math.PI, 1.75 * Math.PI);
            ctx.lineTo(72 + 20 * i, 590);
            ctx.fillStyle = "#FFFF00";
            ctx.fill();
            ctx.strokeStyle = "#000000"
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        if (thisGame.mode == thisGame.GAME_OVER) {
            ctx.fillStyle = '#FFFF00';
            ctx.font = "bold italic 75px arial";
            ctx.fillText("GAME OVER", 20, 325);
        }

        if (thisGame.mode == thisGame.WIN) {
            ctx.fillStyle = '#FFFF00';
            ctx.font = "bold italic 75px arial";
            ctx.fillText("HAS GANADO", 10, 325);
        }

    }

    var Pacman = function() {
        this.radius = 10;
        this.x = 0;
        this.y = 0;
        this.speed = 3;
        this.angle1 = 0.25;
        this.angle2 = 1.75;

        this.sprites = [
            new Sprite('../res/img/sprites.png', [455, 0], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [455, 16], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [455, 32], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [455, 48], [16, 16], 0.005, [0, 1]),
            new Sprite('../res/img/sprites.png', [488, 0], [16, 16], 0.005, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        ];

        this.sprite = 0;
    };

    Pacman.prototype.move = function() {
        if (this.velX < 0) {
            this.sprite = this.sprites[1];
        } else if (this.velX > 0) {
            this.sprite = this.sprites[0];
        } else if (this.velY < 0) {
            this.sprite = this.sprites[2];
        } else if (this.velY > 0) {
            this.sprite = this.sprites[3];
        }
        this.sprite.update(delta);
        if (this.radius <= this.x && this.x <= w - this.radius) {

            var i = 0;
            var salir = false;
            var comido = false;
            while (i < numGhosts && !salir) {
                if (thisLevel.checkIfHit(this.x, this.y, ghosts[i].x, ghosts[i].y, TILE_WIDTH / 2)) {
                    salir = true;
                } else {
                    i++;
                }
            }

            //Si se han chocado y el fantasma era vulnerable
            if (salir && ghosts[i].state == 2) {
                salir = false;
                eatghost.play();
                ghosts[i].state = 3;
                var velocidadX = ghosts[i].homeX - ghosts[i].x;
                var velocidadY = ghosts[i].homeY - ghosts[i].y;
                ghosts[i].velX = velocidadX * ghosts[i].speed / Math.abs(Math.max(velocidadX, velocidadY));
                ghosts[i].velY = velocidadY * ghosts[i].speed / Math.abs(Math.max(velocidadX, velocidadY));
                thisGame.addToScore(puntosFantasma);
            } else if (salir && ghosts[i].state == 1) {
                //Si se han chocado y el fantasma estaba en estado normal
                comido = true;

            }

            if (!salir) {
                this.x = this.x + this.velX;
            }

        } else if (this.radius > this.x) {
            this.x = this.radius;
        } else if (this.x > w - this.radius) {
            this.x = w - this.radius;
        }

        if (this.radius <= this.y && this.y <= h - this.radius) {
            var i = 0;
            var salir = false;
            while (i < numGhosts && !salir) {
                if (thisLevel.checkIfHit(this.x, this.y, ghosts[i].x, ghosts[i].y, TILE_WIDTH / 2)) {
                    salir = true;
                } else {
                    i++;
                }
            }

            //Si se han chocado y el fantasma era vulnerable
            if (salir && ghosts[i].state == 2) {
                salir = false;
                eatghost.play();
                ghosts[i].state = 3;
                var velocidadX = ghosts[i].homeX - ghosts[i].x;
                var velocidadY = ghosts[i].homeY - ghosts[i].y;
                ghosts[i].velX = velocidadX * ghosts[i].speed / Math.abs(Math.max(velocidadX, velocidadY));
                ghosts[i].velY = velocidadY * ghosts[i].speed / Math.abs(Math.max(velocidadX, velocidadY));
                thisGame.addToScore(puntosFantasma);
            } else if (salir && ghosts[i].state == 1) {
                //Si se han chocado y el fantasma estaba en estado normal
                comido = true;
            }

            if (!salir) {
                this.y = this.y + this.velY;
            }
        } else if (this.radius > this.y) {
            this.y = this.radius;
        } else if (this.y > h - this.radius) {
            this.y = h - this.radius;
        }

        if (comido) {
            thisGame.lifes--;
            die.play();
            if (thisGame.lifes > 0) {
                thisGame.setMode(thisGame.HIT_GHOST);
            } else {

                thisGame.lifes = 0;
                thisGame.setMode(thisGame.GAME_OVER);
            }
        }

        thisLevel.checkIfHitSomething(this.x, this.y, Math.trunc(this.y / thisGame.TILE_HEIGHT), Math.trunc(this.x / thisGame.TILE_WIDTH));
    };

    // pintar el Pacman
    Pacman.prototype.draw = function(x, y) {

        this.sprite.render(ctx, this.x - thisGame.TILE_WIDTH / 2, this.y - thisGame.TILE_HEIGHT / 2);

    };

    var player = new Pacman();
    for (var i = 0; i < numGhosts; i++) {
        ghosts[i] = new Ghost(i, canvas.getContext("2d"));
    }


    var thisGame = {
        getLevelNum: function() {
            return 0;
        },
        setMode: function(mode) {
            this.mode = mode;
            this.modeTimer = 0;
        },

        addToScore: function(puntos) {
            this.points = this.points + puntos;
        },

        screenTileSize: [24, 21],
        TILE_WIDTH: 24,
        TILE_HEIGHT: 24,
        ghostTimer: 0,
        NORMAL: 1,
        HIT_GHOST: 2,
        GAME_OVER: 3,
        WAIT_TO_START: 4,
        WIN: 5,
        PAUSE: 6,
        modeTimer: 0,
        lifes: 3,
        points: 0,
        highscore: 0
    };

    var thisLevel = new Level(canvas.getContext("2d"));
    thisLevel.loadLevel(thisGame.getLevelNum());
    // thisLevel.printMap(); 

    var measureFPS = function(newTime) {
        // la primera ejecución tiene una condición especial

        if (lastTime === undefined) {
            lastTime = newTime;
            return;
        }

        // calcular el delta entre el frame actual y el anterior
        var diffTime = newTime - lastTime;

        if (diffTime >= 1000) {

            fps = frameCount;
            frameCount = 0;
            lastTime = newTime;
        }

        // mostrar los FPS en una capa del documento
        // que hemos construído en la función start()
        fpsContainer.innerHTML = 'FPS: ' + fps;
        frameCount++;
    };

    // clears the canvas content
    var clearCanvas = function() {
        ctx.clearRect(0, 0, w, h);
    };

    var oldDir; // variable global usada para guardar la direccion que llevaba el pacman
    var oldMode;

    var recuperarDir = function(oldDir) {
        if (oldDir == "left") {
            inputStates.left = true;
        } else if (oldDir == "right") {
            inputStates.right = true;
        } else if (oldDir == "up") {
            inputStates.up = true;
        } else if (oldDir == "down") {
            inputStates.down = true;
        }
    }

    var resetearVelocidades = function() {
        player.velX = 0;
        player.velY = 0;
    }

    var checkInputs = function() {

        var fila = Math.trunc(player.y / thisGame.TILE_HEIGHT);
        var colum = Math.trunc(player.x / thisGame.TILE_WIDTH);
        if ((player.x % (thisGame.TILE_WIDTH / 2) == 0 && player.y % (thisGame.TILE_HEIGHT / 2) == 0) && (player.x % (thisGame.TILE_WIDTH) != 0 && player.y % (thisGame.TILE_HEIGHT) != 0) && !inputStates.space && thisGame.mode != thisGame.PAUSE) {
            if (inputStates.left) {
                if (!thisLevel.checkIfHitWall(player.x - (thisGame.TILE_WIDTH / 2) - 1, player.y, fila, colum)) {
                    oldDir = "left";
                    player.velX = -player.speed;
                    player.velY = 0;
                } else {
                    resetearVelocidades();
                    inputStates.left = false;
                    recuperarDir(oldDir);
                }

            } else if (inputStates.right) {
                if (!thisLevel.checkIfHitWall(player.x + (thisGame.TILE_WIDTH / 2), player.y, fila, colum)) {
                    oldDir = "right";
                    player.velX = player.speed;
                    player.velY = 0;
                } else {
                    resetearVelocidades();
                    inputStates.right = false;
                    recuperarDir(oldDir);
                }

            } else if (inputStates.up) {
                if (!thisLevel.checkIfHitWall(player.x, player.y - (thisGame.TILE_HEIGHT / 2) - 1, fila, colum)) {
                    oldDir = "up";
                    player.velY = -player.speed;
                    player.velX = 0;
                } else {
                    resetearVelocidades();
                    inputStates.up = false;
                    recuperarDir(oldDir);
                }

            } else if (inputStates.down) {
                if (!thisLevel.checkIfHitWall(player.x, player.y + (thisGame.TILE_HEIGHT / 2), fila, colum)) {
                    oldDir = "down";
                    player.velY = player.speed;
                    player.velX = 0;
                } else {
                    resetearVelocidades();
                    inputStates.down = false;
                    recuperarDir(oldDir);
                }

            } else if (!inputStates.space && thisGame.mode != thisGame.PAUSE) {
                if (!thisLevel.checkIfHitWall(player.x + (thisGame.TILE_WIDTH / 2), player.y, fila, colum)) {
                    oldDir = "right";
                    player.velX = player.speed;
                    player.velY = 0;
                } else {
                    resetearVelocidades();
                }
            }
        } else if (inputStates.space || thisGame.mode == thisGame.PAUSE) {
            if (thisGame.mode != thisGame.PAUSE) {
                oldMode = thisGame.mode;
                thisGame.setMode(thisGame.PAUSE);
                inputStates.space = false;
            } else if (inputStates.space) {
                thisGame.setMode(oldMode);
                inputStates.space = false;
                recuperarDir(oldDir);
            }


        }
    };


    var updateTimers = function() {
        // Actualizar thisGame.ghostTimer y el estado de los fantasmas
        if (thisGame.ghostTimer > 0) {
            thisGame.ghostTimer--;
        } else if (thisGame.ghostTimer == 0) {
            for (var i = 0; i < numGhosts; i++) {
                ghosts[i].state = 1;
            }
        }

        // actualiza modeTimer...
        thisGame.modeTimer++;
    };

    var mainLoop = function(time) {

        // solo en modo NORMAL
        if (thisGame.mode != thisGame.GAME_OVER && thisGame.mode != thisGame.WIN && thisGame.mode != thisGame.PAUSE) {

            //main function, called each frame 
            measureFPS(time);

            // number of ms since last frame draw
            delta = timer(time);

            if (thisGame.mode == thisGame.NORMAL) {
                checkInputs();

                // Mover fantasmas
                for (var i = 0; i < numGhosts; i++) {
                    ghosts[i].move();
                }

                player.move();
            }

            // en modo HIT_GHOST
            if (thisGame.mode == thisGame.HIT_GHOST) {
                if (thisGame.modeTimer == 90) {
                    thisGame.mode = thisGame.WAIT_TO_START;
                }
            }

            // en modo WAIT_TO_START
            if (thisGame.mode == thisGame.WAIT_TO_START) {
                reset();
                if (thisGame.modeTimer == 30) {
                    requestAnimationFrame(mainLoop);
                }
            }

            // Clear the canvas
            clearCanvas();

            thisLevel.drawMap();

            // Pintar fantasmas
            for (var i = 0; i < numGhosts; i++) {
                ghosts[i].draw();
            }

            player.draw();

            updateTimers();
            // call the animation loop every 1/60th of second
            requestAnimationFrame(mainLoop);

        } else if (thisGame.mode == thisGame.GAME_OVER || thisGame.mode == thisGame.WIN) {

            // Clear the canvas
            clearCanvas();

            thisLevel.drawMap();

            // Pintar fantasmas
            for (var i = 0; i < numGhosts; i++) {
                ghosts[i].draw();
            }

            player.draw();

        } else if (thisGame.mode == thisGame.PAUSE) {
            //main function, called each frame 
            measureFPS(time);

            // number of ms since last frame draw
            delta = timer(time);
            checkInputs();

            clearCanvas();

            thisLevel.drawMap();

            // Pintar fantasmas
            for (var i = 0; i < numGhosts; i++) {
                ghosts[i].draw();
            }

            player.draw();

            updateTimers();

            // call the animation loop every 1/60th of second
            requestAnimationFrame(mainLoop);
        }


    };

    var oldTime = 0;
    var timer = function(currentTime) {
        var aux = currentTime - oldTime;
        oldTime = currentTime;
        return aux;
    };

    var addListeners = function() {
        window.addEventListener("keydown", function(evento) {
            tecla = evento.keyCode;
            if (tecla == 37) {
                inputStates.left = true;
                inputStates.right = false;
                inputStates.up = false;
                inputStates.down = false;
                inputStates.space = false;
            } else if (tecla == 39) {
                inputStates.left = false;
                inputStates.right = true;
                inputStates.up = false;
                inputStates.down = false;
                inputStates.space = false;
            } else if (tecla == 38) {
                inputStates.left = false;
                inputStates.right = false;
                inputStates.up = true;
                inputStates.down = false;
                inputStates.space = false;
            } else if (tecla == 40) {
                inputStates.left = false;
                inputStates.right = false;
                inputStates.up = false;
                inputStates.down = true;
                inputStates.space = false;
            } else if (tecla == 80) {
                inputStates.left = false;
                inputStates.right = false;
                inputStates.up = false;
                inputStates.down = false;
                inputStates.space = true;
            }

        }, false);
    };

    var inicializarGestorTeclado = function() {
        addListeners();
    };

    var reset = function() {

        var salir = false;
        var i = 0;
        var j = 0;
        while (i <= thisGame.screenTileSize[0] && !salir) {
            while (j < thisGame.screenTileSize[1] && !salir) {
                var act = thisLevel.getMapTile(i, j);
                if (act == 4) {
                    player.x = j * thisGame.TILE_WIDTH + (thisGame.TILE_WIDTH / 2);
                    player.y = i * thisGame.TILE_HEIGHT + (thisGame.TILE_HEIGHT / 2);
                    player.velX = player.speed;
                    player.velY = 0;
                    salir = true;
                }
                j++;
            }
            j = 0;
            i++;
        }

        //cargo la posicion incicial de los fantasmas
        for (var i = 0; i < numGhosts; i++) {
            ghosts[i].x = player.x;
            ghosts[i].y = player.y - (TILE_HEIGHT * 4);
            ghosts[i].homeX = ghosts[i].x;
            ghosts[i].homeY = ghosts[i].y;
            ghosts[i].velX = 0;
            ghosts[i].velY = 0;
            ghosts[i].state = 1;
        }

        thisGame.setMode(thisGame.NORMAL);
        //Reseteo los input
        inputStates.left = false;
        inputStates.right = true; //porque al comienzo va a la derecha
        inputStates.up = false;
        inputStates.down = false;
        inputStates.space = false;
    };

    function init() {
        // comenzar la animación
        loadAssets();
    }

    // Gestion de la musica
    var loadAssets = function() {
        eatpill = new Howl({
            src: ['../res/sounds/eat-pill.mp3'],
            volume: 1,
            onload: function() {
                eating = new Howl({
                    src: ['../res/sounds/eating.mp3'],
                    volume: 1,
                    onload: function() {
                        eatghost = new Howl({
                            src: ['../res/sounds/eat-ghost.mp3'],
                            volume: 1,
                            onload: function() {
                                die = new Howl({
                                    src: ['../res/sounds/die.mp3'],
                                    volume: 1,
                                    onload: function() {
                                        requestAnimationFrame(mainLoop); // comenzar animación
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

    }


    var start = function() {
        // adds a div for displaying the fps value
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);

        inicializarGestorTeclado();

        reset();

        resources.load(['../res/img/sprites.png']);
        resources.onReady(init);
    };

    //our GameFramework returns a public API visible from outside its scope
    return {
        start: start,
        thisGame: thisGame
    };
};


var game = new GF();
game.start();
