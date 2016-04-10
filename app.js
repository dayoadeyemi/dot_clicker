/// <reference path="jquery.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FPS = 30;
var GameObject = (function () {
    function GameObject(stage) {
        this.destroy = false;
        this.stage = stage;
        this.stage.children.push(this);
    }
    GameObject.prototype.update = function (dt) { };
    ;
    GameObject.prototype.draw = function () { };
    ;
    GameObject.prototype.click = function () { };
    ;
    GameObject.prototype.isClicked = function (ev) { return false; };
    ;
    return GameObject;
}());
var Vector = (function () {
    function Vector(x, y) {
        var _this = this;
        this.add = function (v) { return new Vector(v.x + _this.x, v.y + _this.y); };
        this.multiply = function (a) { return new Vector(a * _this.x, a * _this.y); };
        this.xform = function (m) { return new Vector(m.x1 * _this.x + m.y1 * _this.y, m.x2 * _this.x + m.y2 * _this.y); };
        this.x = x;
        this.y = y;
        Object.freeze(this);
    }
    Object.defineProperty(Vector.prototype, "angle", {
        get: function () {
            return Math.atan2(this.y, this.x);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector.prototype, "length", {
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        enumerable: true,
        configurable: true
    });
    return Vector;
}());
var Matrix = (function () {
    function Matrix(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        Object.freeze(this);
    }
    Matrix.rot = function (angle) { return new Matrix(Math.cos(angle), -Math.sin(angle), Math.sin(angle), Math.cos(angle)); };
    return Matrix;
}());
var MovableGameObject = (function (_super) {
    __extends(MovableGameObject, _super);
    function MovableGameObject(stage, x, y, r) {
        _super.call(this, stage);
        this.position = new Vector(0, 0);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.position = new Vector(x, y);
        this.radius = r;
    }
    MovableGameObject.prototype.update = function (dt) {
        _super.prototype.update.call(this, dt);
        this.position = this.position.add(this.velocity.multiply(dt));
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = new Vector((this.position.x + this.stage.width) % this.stage.width, (this.position.y + this.stage.height) % this.stage.height);
    };
    return MovableGameObject;
}(GameObject));
var GameText = (function (_super) {
    __extends(GameText, _super);
    function GameText(stage, x, y, getText) {
        _super.call(this, stage, x, y, 1);
        this.colour = 'black';
        this.getText = getText;
    }
    GameText.prototype.draw = function () {
        this.stage.ctx.font = "48px serif";
        this.stage.ctx.fillStyle = this.colour;
        this.stage.ctx.fillText(this.getText(), this.position.x, this.position.y);
    };
    return GameText;
}(MovableGameObject));
var Stage = (function () {
    function Stage(el) {
        var _this = this;
        this.children = [];
        this.clicks = 0;
        this.time = 8;
        this.dotCount = 0;
        this.level = 0;
        this.gameover = false;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 512;
        this.canvas.height = 480;
        el.appendChild(this.canvas);
        this.canvas.onmousedown = function (ev) {
            _this.clicks++;
            _this.time -= 1;
            _this.children.forEach(function (gameObject) {
                if (gameObject.isClicked(ev))
                    gameObject.click();
            });
        };
        new GameText(this, 10, 50, function () {
            return ("level: " + _this.level.toString() + "\n             \tclicks: " + _this.clicks + " \t\n             \tTime: " + _this.time.toFixed(1));
        });
    }
    Stage.prototype.run = function (then) {
        var _this = this;
        var now = Date.now();
        var dt = (now - then) / 1000;
        this.width = this.ctx.canvas.width = window.innerWidth;
        this.height = this.ctx.canvas.height = window.innerHeight;
        for (var i = this.children.length; i--;) {
            if (this.children[i].destroy) {
                this.children.splice(i, 1);
            }
        }
        if (this.time > dt)
            this.time = this.time - dt;
        else if (!this.gameover) {
            this.endGame();
        }
        if (this.dotCount === 0) {
            this.levelup();
        }
        this.children.forEach(function (child) { return child.update(dt); });
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.children.forEach(function (child) { return child.draw(); });
        window.requestAnimationFrame(function () { return _this.run(now); });
        //setTimeout(() => this.run(now), 0);
    };
    Stage.prototype.endGame = function () {
        var _this = this;
        if (!this.gameover) {
            this.time = 0;
            this.gameover = true;
            new GameText(this, 20, 120, function () { return _this.level === 21 ? 'WINNER' : 'GAME OVER'; });
            this.canvas.onmousedown = function () { };
            this.dotCount = -1;
        }
    };
    Stage.prototype.levelup = function () {
        if (this.gameover)
            return;
        this.level++;
        this.time += 5;
        var n = this.level;
        if (this.level <= 10) {
            new Dot(this, 500, 500, 70 / n + 10);
        }
        else if (this.level <= 15) {
            n -= 10;
            new Dot(this, 100, 500, 70 / n + 10);
            new Dot(this, 300, 500, 40);
        }
        else if (this.level <= 20) {
            n -= 15;
            new Dot(this, 100, 500, 25).velocity = new Vector(100 + n * 70, 0);
            new Dot(this, 300, 500, 25).velocity = new Vector(100 + n * 70, 0);
            new Dot(this, 500, 500, 25).velocity = new Vector(100 + n * 70, 0);
        }
        else {
            this.endGame();
        }
    };
    return Stage;
}());
var Dot = (function (_super) {
    __extends(Dot, _super);
    function Dot(stage, x, y, r) {
        _super.call(this, stage, x, y, r);
        this.colour = 'green';
        stage.dotCount++;
        this.velocity = new Vector(150, 0);
    }
    Dot.prototype.isClicked = function (ev) {
        return this.position.add(new Vector(-ev.pageX, -ev.pageY)).length < this.radius;
    };
    Dot.prototype.click = function () {
        this.stage.dotCount--;
        this.destroy = true;
        ;
    };
    Dot.prototype.update = function (dt) {
        var rotate = Matrix.rot((Math.random() - 0.5) * 0.9);
        this.velocity = this.velocity.xform(rotate);
        _super.prototype.update.call(this, dt);
    };
    Dot.prototype.draw = function () {
        this.stage.ctx.beginPath();
        this.stage.ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
        this.stage.ctx.fillStyle = this.colour;
        this.stage.ctx.fill();
    };
    return Dot;
}(MovableGameObject));
var RandomDot = (function (_super) {
    __extends(RandomDot, _super);
    function RandomDot() {
        _super.apply(this, arguments);
    }
    return RandomDot;
}(MovableGameObject));
window.onload = function () {
    var stage = new Stage(document.body);
    document.body.appendChild(stage.canvas);
    stage.levelup();
    stage.run(Date.now());
};
//# sourceMappingURL=app.js.map