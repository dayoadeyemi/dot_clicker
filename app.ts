/// <reference path="jquery.d.ts" />
'use strict';
const FPS = 30;

function randomInt(min: number, max: number){
    return Math.random() * (max - min) + min;
}

function bound(num: number, min: number, max: number){
    if (num < min) return min;
    else if (num > max) return max;
    else return num;
}

class GameObject {
    stage: Stage;
    constructor(stage: Stage) {
        this.stage = stage;
        this.stage.children.push(this);
    }
    destroy = false;
    update(dt: number): void { };
    draw(): void { };
    click (): void {};
    isClicked(ev: MouseEvent): boolean { return false };
}

class Vector {
    x: number;
    y: number;
    get angle(): number {
        return Math.atan2(this.y, this.x);
    }
    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        Object.freeze(this);
    }
    get normal(): Vector{
        return this.multiply(1 / this.length);
    }
    add = (v: Vector) => new Vector(v.x + this.x, v.y + this.y);
    sub = (v: Vector) => new Vector(-v.x + this.x, -v.y + this.y);
    multiply = (a: number) => new Vector(a * this.x, a * this.y);
    xform = (m: Matrix) => new Vector(m.x1 * this.x + m.y1 * this.y, m.x2 * this.x + m.y2 * this.y);
}

class Matrix {
    x1: number; y1: number; x2: number; y2: number;
    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        Object.freeze(this);
    }
    static rot = (angle: number) => new Matrix(Math.cos(angle), -Math.sin(angle), Math.sin(angle), Math.cos(angle));
}

class MovableGameObject extends GameObject {
    position = new Vector(0, 0);
    velocity = new Vector(0, 0);
    acceleration = new Vector(0, 0);
    radius: number;
    constructor(stage: Stage, x: number, y: number, r: number) {
        super(stage);
        this.position = new Vector(x, y);
        this.radius = r;
    }
    update(dt: number): void {
        super.update(dt);
        this.position = this.position.add(this.velocity.multiply(dt));
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = new Vector(
            bound(this.position.x, this.radius, this.stage.width - this.radius),
            bound(this.position.y, this.radius, this.stage.height - this.radius)
        );
    }
}

class GameText extends MovableGameObject {
    colour = 'black';
    getText: () => string;
    constructor(stage: Stage, x, y, getText: () => string) {
        super(stage, x, y, 1);
        this.getText = getText;
    }
    draw() {
        this.stage.ctx.font = "48px serif";
        this.stage.ctx.fillStyle = this.colour;
        this.stage.ctx.fillText(this.getText(), this.position.x, this.position.y);
    }
}

class Stage {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    height: number;
    width: number;
    children: Array<GameObject> = [];
    clicks: number = 0;
    time: number = 8;
    mouse: Vector = new Vector(0, 0);
    constructor(el: HTMLElement) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 512;
        this.canvas.height = 480;
        this.width = this.ctx.canvas.width = window.innerWidth;
        this.height = this.ctx.canvas.height = window.innerHeight;
        el.appendChild(this.canvas);
        this.canvas.onmousedown = (ev) => {
            this.clicks++;
            this.time -= 1;
            this.children.forEach(gameObject => {
                if (gameObject.isClicked(ev)) gameObject.click();
            })
        };
        this.canvas.onmousemove = (ev: MouseEvent) => {
            this.mouse = new Vector(ev.pageX, ev.pageY);
        }
        new GameText(this, 10, 50, () =>
            `level: ${this.level.toString()}
             \tclicks: ${this.clicks} \t
             \tTime: ${this.time.toFixed(1)}`);
    }
    run(then: number) {
        var now = Date.now();
        var dt = (now - then)/1000;

        this.width = this.ctx.canvas.width = window.innerWidth;
        this.height = this.ctx.canvas.height = window.innerHeight;

        for (var i = this.children.length; i--;) {
            if (this.children[i].destroy) {
                this.children.splice(i, 1);
            }
        }

        if (this.time > dt) this.time = this.time - dt;
        else if (!this.gameover) {
            this.endGame();
        }

        if (this.dotCount === 0) {
            this.levelup();
        }
        
        this.children.forEach(child => child.update(dt));
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.children.forEach(child => child.draw());
 
        window.requestAnimationFrame(() => this.run(now));
        //setTimeout(() => this.run(now), 0);
    }
    dotCount: number = 0;
    level: number = 0;
    gameover = false;
    endGame() {
        if (!this.gameover) {
            this.time = 0;
            this.gameover = true;
            new GameText(this, 20, 120, () => this.level === 21 ? 'WINNER' : 'GAME OVER');
            this.canvas.onmousedown = () => { }
            this.dotCount = -1;
        }
    }
    levelup() {
        if (this.gameover) return;
        this.level++;
        this.time += 5;
        var n = this.level;
        if (this.level <= 10) {
            //new Dot(this, Green);
            // new Dot(this, Red);
            // new Dot(this, Blue);
            new Dot(this, Black);
        } else {
            this.endGame();
        }
    }
}

class DotConfig {
    colour: string;
    randomDir: number;
    speed: number = 150;
    radius: number = 40;
    runAway: number;
    hideIn: number;
    teleportIn: number;
    constructor(options: Object){
        for (let option in options) this[option] = options[option];
    }
}

const Green = new DotConfig({ colour: 'green', randomDir: 1.4, speed: 250 });
const Red = new DotConfig({ colour: 'red', speed: 0, runAway: 100 });
const Blue = new DotConfig({ colour: 'blue', speed: 0, hideIn: 0.8 });
const Black = new DotConfig({ colour: 'black', speed: 0, teleportIn: 2.2, radius: 30 });


class Dot extends MovableGameObject {
    config: DotConfig;
    hideIn: number;
    teleportIn: number;
    colour;
    constructor(stage: Stage, config: DotConfig) {
        super(
            stage, 
            randomInt(config.radius, stage.width),
            randomInt(config.radius, stage.height),
            config.radius
        );
        this.config = config;
        this.hideIn = config.hideIn;
        this.teleportIn = config.teleportIn;
        this.colour = config.colour;
        this.velocity = new Vector(config.speed, 0);
        stage.dotCount++;
    }
    isClicked(ev: MouseEvent) {
        return this.position.add(new Vector(-ev.pageX, -ev.pageY)).length < this.radius;
    }
    click() {
        this.stage.dotCount--;
        this.destroy = true;;
    }
    update(dt) {
        let config = this.config;
        if (config.randomDir){
            this.velocity = this.velocity.xform(Matrix.rot((Math.random() - 0.5) * config.randomDir));
        }
        if (config.runAway) {
            let mouseDiff = this.position.sub(this.stage.mouse);
            let speed = config.runAway / (this.radius/4 + mouseDiff.length)
            this.velocity = mouseDiff.normal.multiply(speed * config.runAway);
        }
        if (config.hideIn) {
            if (this.hideIn > 0) {
                this.hideIn -= dt;
                if (Math.random() < 0.75) {
                    this.radius++
                } else {
                    this.radius--
                }
                this.radius = bound(this.radius, config.radius, 2 * config.radius);
            }
            else {
                this.colour = 'white';
            }
        }
        if (config.teleportIn) {
            if (this.teleportIn > 0) {
                this.teleportIn -= dt;
            }
            else {
                this.teleportIn = this.config.teleportIn;
                this.position = new Vector(
                    randomInt(this.radius, this.stage.width),
                    randomInt(this.radius, this.stage.height)
                );
            }
        }
        super.update(dt);
    }
    draw() {
        let config = this.config;      
        this.stage.ctx.beginPath();
        this.stage.ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
        this.stage.ctx.fillStyle = this.colour;
        this.stage.ctx.fill();
    }
}

class RandomDot extends MovableGameObject {

}

window.onload = () => {
    var stage = new Stage(document.body);
    document.body.appendChild(stage.canvas);
    stage.levelup();
    stage.run(Date.now());
};