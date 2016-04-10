/// <reference path="jquery.d.ts" />

const FPS = 30;
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
    add = (v: Vector) => new Vector(v.x + this.x, v.y + this.y);
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
        this.position = new Vector((this.position.x + this.stage.width) % this.stage.width,
            (this.position.y + this.stage.height) % this.stage.height);
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
    constructor(el: HTMLElement) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 512;
        this.canvas.height = 480;
        el.appendChild(this.canvas);
        this.canvas.onmousedown = (ev) => {
            this.clicks++;
            this.time -= 1;
            this.children.forEach(gameObject => {
                if (gameObject.isClicked(ev)) gameObject.click();
            })
        };
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
            new Dot(this, 500, 500, 70 / n + 10);
        } else if (this.level <= 15) {
            n -= 10;
            new Dot(this, 100, 500, 70 / n + 10);
            new Dot(this, 300, 500, 40);
        } else if (this.level <= 20) {
            n -= 15;
            new Dot(this, 100, 500, 25).velocity = new Vector(100 + n * 70, 0);
            new Dot(this, 300, 500, 25).velocity = new Vector(100 + n * 70, 0);
            new Dot(this, 500, 500, 25).velocity = new Vector(100 + n * 70, 0);
        } else {
            this.endGame();
        }
    }
}

class Dot extends MovableGameObject {
    colour = 'green';
    constructor(stage: Stage, x: number, y: number, r: number) {
        super(stage, x, y, r);
        stage.dotCount++;
        this.velocity = new Vector(150, 0);
    }
    isClicked(ev: MouseEvent) {
        return this.position.add(new Vector(-ev.pageX, -ev.pageY)).length < this.radius;
    }
    click() {
        this.stage.dotCount--;
        this.destroy = true;;
    }
    update(dt) {
        let rotate = Matrix.rot((Math.random() - 0.5)*0.9);
        this.velocity = this.velocity.xform(rotate);
        super.update(dt);
    }
    draw() {
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