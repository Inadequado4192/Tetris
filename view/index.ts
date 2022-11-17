import { Prototypes } from "inadequado/dist/Tools";
Prototypes.Array();

const c = document.querySelector("#c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;
















namespace AreaSpace {
    export const width = 15;
    export const height = 20;

    export const allBlock = new Set<Block>();
    export let targetTetramino: Tetramino | null = null;

    export function clearTarget() {
        if (!targetTetramino) return;
        clearInterval(targetTetramino.fallInterval);
        targetTetramino.createBlocks().forEach(allBlock.add.bind(allBlock));
    }
    export function newTarget() {
        clearTarget();


        targetTetramino = getRandomTetramin();
        targetTetramino.fallLoop();
        targetTetramino.pos.x += Math.floor(width / 2) - 1;

        if (targetTetramino.checkCollisionWithBlock()) {
            clearTarget();
            gameOver();
        }


        AreaSpace.checkLines();
    }



    export function checkLines() {
        let array = [...allBlock];

        let lines = 0;
        for (let y = 0; y < height; y++) {
            let blcs = array.filter(b => b.pos.y == y);
            if (blcs.length == width) {
                lines++;
                blcs.filter(allBlock.delete.bind(allBlock));
                array.filter(b => b.pos.y < y).forEach(b => b.pos.y++);
            }
        }
        if (lines < 1) return;


        GameData.dropInter = Math.max(GameData.dropInter - 10, 50);

        if (lines == 1) GameData.score += 100;
        if (lines == 2) GameData.score += 300;
        if (lines == 3) GameData.score += 700;
        if (lines >= 4) GameData.score += 1500;
    }
}

const getBlockSize = () => Math.min(innerHeight, innerWidth) / (Math.min(AreaSpace.height, AreaSpace.width)) / 1.5;

window.addEventListener("resize", (function resize() {
    let s = getBlockSize();
    c.width = AreaSpace.width * s;
    c.height = AreaSpace.height * s + s;
    return resize;
})());



























namespace Loop {
    function loop(a: DOMHighResTimeStamp) {
        GameData.timeWithStart = a / 1000;
        Draw.Clear();

        Draw.Blocks();
        UI.display();

        frame = requestAnimationFrame(loop);
    }






    let frame: number;
    export function start() {
        GameData.reset();

        frame = requestAnimationFrame(loop);
        document.addEventListener("keydown", control);
        AreaSpace.newTarget();
    }
    export function stop() {
        cancelAnimationFrame(frame);
        document.removeEventListener("keydown", control);
    }
}











namespace Draw {
    export function Clear() {
        ctx.clearRect(0, 0, c.width, c.height);
    }
    export function Blocks() {
        let array: (Tetramino | Block)[] = [...AreaSpace.allBlock];
        AreaSpace.targetTetramino && array.push(AreaSpace.targetTetramino);

        for (let obj of array) {
            if (!obj) return;

            const BS = getBlockSize();
            ctx.beginPath();

            function draw(x: number, y: number) {
                ctx.rect(
                    (obj.pos.x * BS) + (x * BS),
                    (obj.pos.y * BS) + (y * BS) + BS,
                    BS, BS
                )
            }

            if (obj instanceof Tetramino) {
                for (let y = 0; y < obj.struct[obj.rotateIndex].length; y++) {
                    for (let x = 0; x < obj.struct[obj.rotateIndex][y].length; x++) {
                        if (obj.struct[obj.rotateIndex][y][x]) draw(x, y);
                    }
                }
            } else draw(0, 0);

            ctx.fillStyle = obj.color;
            ctx.fill();
            ctx.stroke();

            ctx.closePath();
        }
    }

}

function gameOver() {
    alert("GAMEOVER");

    let bestScoreTmp = +String(localStorage.getItem("bestScore"));
    localStorage.setItem("bestScore", String(Math.max(GameData.score, isNaN(bestScoreTmp) ? 0 : bestScoreTmp)))

    Loop.stop();
    AreaSpace.clearTarget();
}















namespace GameData {
    export function reset() {
        score = 0;
        timeWithStart = 0;
        dropInter = 1000;
    }
    export let score: number;
    export let timeWithStart: number;
    export let dropInter: number;

    let bestScoreTmp = +String(localStorage.getItem("bestScore"));
    export let bestScore: number = isNaN(bestScoreTmp) ? 0 : bestScoreTmp;
}
namespace UI {
    let scoreElem = document.querySelector("#score > span") as HTMLElement;
    let bestScoreElem = document.querySelector("#bestScore > span") as HTMLElement;
    let timeElem = document.querySelector("#time > span") as HTMLElement;
    export function display() {
        scoreElem.textContent = String(GameData.score);
        bestScoreElem.textContent = String(GameData.bestScore);


        timeElem.textContent = String((() => {
            let s = (GameData.timeWithStart % 60).toFixed(0);
            return `${Math.floor(GameData.timeWithStart / 60).toFixed(0)}:${s.length > 1 ? s : `0${s}`}`;
        })());
    }
}























enum CollisionType {
    Null, LWall, RWall, Floor, Block
}

type AccessChars = 0 | 1; // ■
type Scruct = [AccessChars[][], AccessChars[][], AccessChars[][], AccessChars[][]];
type Point = { x: number, y: number }


class Block {
    public constructor(
        public tetramino: Tetramino,
        public pos: Point,
        public color: typeof Tetramino.accessColors[number],
    ) { }
}
class Tetramino {
    static accessColors = ["red", "yellow", "blue", "green"] as const;
    public color: typeof Tetramino.accessColors[number] = Tetramino.accessColors.randomElements();

    public createBlocks() {
        let blocks: Block[] = [];
        this.structForEach((c, y, x) => blocks.push(new Block(this, { x: x + this.pos.x, y: y + this.pos.y }, this.color)));
        return blocks;
    }

    public struct: Scruct;
    public rotateIndex = 0;

    public constructor(struct: Scruct) {
        this.struct = struct;

        let marginTop: number = 0;
        this.structForEach((c, y, x) => { if (!marginTop) marginTop = y; });
        this.pos.y -= marginTop;

        this.tmp = Math.random();
    }
    public tmp: any;


    public pos: Point = { y: 0, x: 0 }

    public clone() { return new Tetramino(this.struct); }


    public structForEach(callback: (c: 1, y: number, x: number) => void) {
        for (let y = 0; y < this.struct[this.rotateIndex].length; y++) {
            for (let x = 0; x < this.struct[this.rotateIndex][y].length; x++) {
                let char = this.struct[this.rotateIndex][y][x];
                if (char == 1) callback(char, y, x);
            }
        }
    }

    public checkCollisionWithBlock() {
        for (let y = 0; y < this.struct[this.rotateIndex].length; y++) {
            for (let x = 0; x < this.struct[this.rotateIndex][y].length; x++) {
                if (!this.struct[this.rotateIndex][y][x]) continue;

                let posX = this.pos.x + x,
                    posY = this.pos.y + y;

                if (posX < 0) return CollisionType.LWall;
                if (posX > AreaSpace.width - 1) return CollisionType.RWall;

                if (posY > AreaSpace.height - 1) return CollisionType.Floor;


                for (let _b of AreaSpace.allBlock)
                    if (_b.pos.x == posX && _b.pos.y == posY) return CollisionType.Block;
            }
        }

        return CollisionType.Null;
    }

    public rotateL(checkCollision = true) {
        this.rotateIndex = (this.rotateIndex -= 1) < 0 ? this.struct.length - 1 : this.rotateIndex;

        if (!checkCollision) return;
        switch (this.checkCollisionWithBlock()) {
            case CollisionType.LWall: this.moveR(this.rotateR.bind(this)); break;
            case CollisionType.RWall: this.moveL(this.rotateR.bind(this)); break;
            case CollisionType.Block: this.rotateR(); break;
        }
    }
    public rotateR(checkCollision = true) {
        this.rotateIndex = (this.rotateIndex + 1) % this.struct.length;

        if (!checkCollision) return;
        switch (this.checkCollisionWithBlock()) {
            case CollisionType.LWall: this.moveR(this.rotateL.bind(this)); break;
            case CollisionType.RWall: this.moveL(this.rotateL.bind(this)); break;
            case CollisionType.Block: this.rotateL(); break;
        }
    }

    public moveT() {
        this.pos.y--;
    }
    public moveB() {
        this.pos.y++;

        if (this.checkCollisionWithBlock()) {
            this.moveT();
            AreaSpace.newTarget();
            return false;
        }
        return true;
    }
    public moveL(pushCallback?: (checkCollision?: boolean) => void) {
        this.pos.x--;

        if (this.checkCollisionWithBlock()) {
            if (pushCallback) pushCallback(false);
            this.moveR();
        }
    }
    public moveR(pushCallback?: (checkCollision?: boolean) => void) {
        this.pos.x++;

        if (this.checkCollisionWithBlock()) {
            if (pushCallback) pushCallback(false);
            this.moveL();
        }
    }





    public fallInterval!: NodeJS.Timeout;
    public fallLoop() {
        this.fallInterval = setInterval(this.moveB.bind(this), GameData.dropInter);
        return this;
    }
}
function getRandomTetramin() {
    return templates.randomElements().clone();
}
const templates: Tetramino[] = [
    new Tetramino([
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ], [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
        ], [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
        ], [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ]
    ]),
    new Tetramino([
        [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ], [
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 0],
        ], [
            [0, 0, 0],
            [1, 1, 1],
            [0, 0, 1],
        ], [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0],
        ]
    ]),
    new Tetramino([
        [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ], [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1],
        ], [
            [0, 0, 0],
            [1, 1, 1],
            [1, 0, 0],
        ], [
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
        ]
    ]),
    new Tetramino([
        [
            [1, 1],
            [1, 1],
        ], [
            [1, 1],
            [1, 1],
        ], [
            [1, 1],
            [1, 1],
        ], [
            [1, 1],
            [1, 1],
        ]
    ]),
    new Tetramino([
        [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ], [
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 1],
        ], [
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0],
        ], [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0],
        ]
    ]),
    new Tetramino([
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ], [
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0],
        ], [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ], [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0],
        ]
    ]),
    new Tetramino([
        [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ], [
            [0, 0, 1],
            [0, 1, 1],
            [0, 1, 0],
        ], [
            [0, 0, 0],
            [1, 1, 0],
            [0, 1, 1],
        ], [
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0],
        ]
    ]),
]


function control(e: KeyboardEvent) {
    switch (e.code) {
        case "KeyE": AreaSpace.targetTetramino?.rotateR(); break;
        case "KeyQ": AreaSpace.targetTetramino?.rotateL(); break;

        case "KeyA": AreaSpace.targetTetramino?.moveL(); break;
        case "KeyD": AreaSpace.targetTetramino?.moveR(); break;
        case "KeyS": AreaSpace.targetTetramino?.moveB(); break;
    }
}














Loop.start();