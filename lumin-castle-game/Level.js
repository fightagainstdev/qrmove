/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict';
import { easeInOutQuad, easeOutQuad, lerp } from '../node_modules/natlib/interpolation.js';
import { Board } from './Board.js';
import { Cluster } from './Piece.js';
import { Vec2 } from './Vec2.js';
import { sound, step } from './audio/audio.js';
import { levels } from './levels.js';
import { enterPhase, interpolatePhase } from './natlib_state.js';
import { printCenter } from './print.js';
import { cascadeMove } from './rules.js';
import { COLOR_DUCK_2_B, COLOR_DUCK_2_G, COLOR_DUCK_2_R, COLOR_DUCK_B, COLOR_DUCK_G, COLOR_DUCK_R, COLOR_GOAL_2_B, COLOR_GOAL_2_G, COLOR_GOAL_2_R, COLOR_GOAL_B, COLOR_GOAL_G, COLOR_GOAL_R, con, linearToSrgb, oscillate, wrapAround, } from './setup.js';
import { duckState } from './state.js';
export class Level {
    constructor(width, height, external) {
        this.board = new Board(width, height);
        this.external = external;
        this.active = new Set;
        /*@__MANGLE_PROP__*/
        this.ducksOnGoal = new Set;
        /*@__MANGLE_PROP__*/
        this.ducksOnGoalNext = new Set;
        this.cellSize = Math.min(960 /* Settings.SCREEN_WIDTH */ / width, 540 /* Settings.SCREEN_HEIGHT */ / height);
        this.boardLeft = 0.5 * (960 /* Settings.SCREEN_WIDTH */ - width * this.cellSize);
        this.boardTop = 0.5 * (540 /* Settings.SCREEN_HEIGHT */ - height * this.cellSize);
    }
    /** Move a piece. Return TRUE on failure. */
    tryMove(piece, Δx, Δy) {
        const plan = cascadeMove(this.board, piece, Δx, Δy);
        if (!plan)
            return 1 /* ShortBool.TRUE */;
        let killingMove = 0 /* ShortBool.FALSE */;
        for ([piece, Δx, Δy] of plan) {
            this.board.putPiece(piece, piece.x + Δx, piece.y + Δy);
            if (this.board.positions[piece.y][piece.x].some(p => p.type === 5 /* PieceType.CUTTER */)) {
                killingMove = piece.killed = 1 /* ShortBool.TRUE */;
            }
            this.active.add(piece);
        }
        if (!this.board.pieces[1 /* PieceType.DUCK */]?.filter(d => !d.killed).length) {
            // Don't kill the last duck: undo the changes.
            for ([piece, Δx, Δy] of plan) {
                this.board.putPiece(piece, piece.x - Δx, piece.y - Δy);
                piece.killed = 0 /* ShortBool.FALSE */;
                this.active.delete(piece);
            }
            return 1 /* ShortBool.TRUE */;
        }
        if (killingMove) {
            sound(2 /* SoundEffect.DISCONNECT */);
        }
        this.updateDucksOnGoal(this.ducksOnGoalNext);
        enterPhase(duckState, 3 /* DuckPhase.MOVING */, 10 /* Settings.MOVE_DURATION */);
        step();
        // .DeadCode
        return;
        // .EndDeadCode
    }
    discardPiece(piece) {
        this.board.discardPiece(piece);
        if (piece.type === 1 /* PieceType.DUCK */) {
            this.ducksOnGoal.delete(piece);
            this.ducksOnGoalNext.delete(piece);
        }
    }
    /*@__MANGLE_PROP__*/
    updateDucksOnGoal(collection) {
        this.board.pieces[1 /* PieceType.DUCK */]?.forEach(duck => {
            const onGoal = this.board.positions[duck.y][duck.x].some(p => p.type === 3 /* PieceType.GOAL */);
            if (onGoal)
                collection.add(duck);
            else
                collection.delete(duck);
        });
    }
    connectDucklings(ducks) {
        const clusters = new Set;
        ducks.forEach(duck => {
            this.board.getBorderingPieces(duck, 2 /* PieceType.DUCKLING */)?.forEach(duckling => {
                clusters.add(duckling.cluster);
            });
        });
        if (!clusters.size)
            return;
        clusters.forEach(cluster => {
            cluster.pieces.forEach(duckling => {
                this.discardPiece(duckling);
                const duck = this.board.createPiece(1 /* PieceType.DUCK */, duckling.x, duckling.y);
                this.active.add(duck);
            });
        });
        new Cluster(this.board.pieces[1 /* PieceType.DUCK */]);
        // Pieces just created could've appeared on goal.
        this.updateDucksOnGoal(this.ducksOnGoalNext);
        enterPhase(duckState, 4 /* DuckPhase.CONNECTING */, 20 /* Settings.CONNECT_DURATION */);
        sound(1 /* SoundEffect.CONNECT */);
    }
    splitCluster(cluster) {
        const type = cluster.pieces[0].type;
        const pieces = new Set(cluster.pieces.filter(p => !p.killed));
        const clusters = [];
        for (const piece of pieces) {
            const group = [...this.board.getGroup(piece)].filter(p => pieces.has(p));
            if (!group.length)
                continue;
            group.forEach(p => pieces.delete(p));
            clusters.push(new Cluster(group));
        }
        if (type === 1 /* PieceType.DUCK */ && clusters.length > 1) {
            clusters.sort((a, b) => b.pieces.length - a.pieces.length);
            for (let n = 1; n < clusters.length; ++n) {
                const ducklings = [];
                clusters[n].pieces.forEach(duck => {
                    duck.killed = 1 /* ShortBool.TRUE */;
                    this.discardPiece(duck);
                    const duckling = this.board.createPiece(2 /* PieceType.DUCKLING */, duck.x, duck.y);
                    this.active.add(duckling);
                    ducklings.push(duckling);
                });
                new Cluster(ducklings);
            }
            enterPhase(duckState, 4 /* DuckPhase.CONNECTING */, 20 /* Settings.CONNECT_DURATION */);
        }
    }
    /** Return TRUE if the level is won. */
    checkWin() {
        const duckCount = this.board.pieces[1 /* PieceType.DUCK */]?.length;
        const goalCount = this.board.pieces[3 /* PieceType.GOAL */]?.length;
        if (duckCount === goalCount && duckCount === this.ducksOnGoal.size && duckCount === this.ducksOnGoalNext.size) {
            duckState.clear[duckState.levelIndex] = 1 /* ShortBool.TRUE */;
            enterPhase(duckState, 5 /* DuckPhase.LEAVING */, 64 /* Settings.LEAVE_DURATION */);
            sound(3 /* SoundEffect.WIN */);
            return 1 /* ShortBool.TRUE */;
        }
        // .DeadCode
        return;
        // .EndDeadCode
    }
    render(t, tOscillator) {
        const tDuck = duckState.phase === 3 /* DuckPhase.MOVING */ ?
            easeInOutQuad(interpolatePhase(duckState, 10 /* Settings.MOVE_DURATION */, t)) :
            duckState.phase === 4 /* DuckPhase.CONNECTING */ ?
                easeInOutQuad(interpolatePhase(duckState, 20 /* Settings.CONNECT_DURATION */, t)) : 0;
        const colorDuckEntering = '#' +
            linearToSrgb(lerp(COLOR_GOAL_R, COLOR_DUCK_R, tDuck)) +
            linearToSrgb(lerp(COLOR_GOAL_G, COLOR_DUCK_G, tDuck)) +
            linearToSrgb(lerp(COLOR_GOAL_B, COLOR_DUCK_B, tDuck)); // .Inline(1)
        const secondaryColorDuckEntering = '#' +
            linearToSrgb(lerp(COLOR_GOAL_2_R, COLOR_DUCK_2_R, tDuck)) +
            linearToSrgb(lerp(COLOR_GOAL_2_G, COLOR_DUCK_2_G, tDuck)) +
            linearToSrgb(lerp(COLOR_GOAL_2_B, COLOR_DUCK_2_B, tDuck)); // .Inline(1)
        const colorDuckLeaving = '#' +
            linearToSrgb(lerp(COLOR_DUCK_R, COLOR_GOAL_R, tDuck)) +
            linearToSrgb(lerp(COLOR_DUCK_G, COLOR_GOAL_G, tDuck)) +
            linearToSrgb(lerp(COLOR_DUCK_B, COLOR_GOAL_B, tDuck)); // .Inline(1)
        const secondaryColorDuckLeaving = '#' +
            linearToSrgb(lerp(COLOR_DUCK_2_R, COLOR_GOAL_2_R, tDuck)) +
            linearToSrgb(lerp(COLOR_DUCK_2_G, COLOR_GOAL_2_G, tDuck)) +
            linearToSrgb(lerp(COLOR_DUCK_2_B, COLOR_GOAL_2_B, tDuck)); // .Inline(1)
        const duckColors = ["#ffcd75" /* Palette.DUCK */, colorDuckEntering, colorDuckLeaving, "#a7f070" /* Palette.DUCK_ON_GOAL */];
        const duckSecondaryColors = ["#ef7d57" /* Palette.DUCK_2 */, secondaryColorDuckEntering, secondaryColorDuckLeaving, "#38b764" /* Palette.DUCK_ON_GOAL_2 */];
        con.fillStyle = "#1a1c2c" /* Palette.BOARD */;
        con.fillRect(this.boardLeft, this.boardTop, this.board.width * this.cellSize, this.board.height * this.cellSize);
        // Grid
        con.beginPath();
        const size = Math.max(this.board.width, this.board.height);
        for (let n = 1; n < size; ++n) {
            if (n < this.board.width) {
                con.moveTo(this.boardLeft + n * this.cellSize, this.boardTop);
                con.lineTo(this.boardLeft + n * this.cellSize, this.boardTop + this.board.height * this.cellSize);
            }
            if (n < this.board.height) {
                con.moveTo(this.boardLeft, this.boardTop + n * this.cellSize);
                con.lineTo(this.boardLeft + this.board.width * this.cellSize, this.boardTop + n * this.cellSize);
            }
        }
        con.strokeStyle = "#333c57" /* Palette.GRID */;
        con.stroke();
        // Outline
        if (this.outline) {
            con.strokeStyle = "#41a6f6" /* Palette.OUTLINE */;
            con.stroke(this.outline);
        }
        // Floor tiles
        this.board.pieces[3 /* PieceType.GOAL */]?.forEach(piece => this.renderPiece(piece, piece.x, piece.y, tDuck, 0, duckColors, duckSecondaryColors));
        this.levelText();
        // Blocks
        for (let y = 0; y < this.board.height; ++y) {
            for (let x = 0; x < this.board.width; ++x) {
                const pieces = this.board.positions[y][x]; // .Inline(1)
                const tVibe = wrapAround(tOscillator + 0.1 /* Settings.OSCILLATOR_INCREMENT */ * (x - 0.85 * y));
                pieces.forEach(piece => piece.type !== 3 /* PieceType.GOAL */ && this.renderPiece(piece, x, y, tDuck, tVibe, duckColors, duckSecondaryColors));
            }
        }
    }
    levelText() {
        // For overriding
    }
    renderPiece(piece, x, y, tDuck, tVibe, duckColors, duckSecondaryColors) {
        if (duckState.phase === 3 /* DuckPhase.MOVING */ && this.active.has(piece)) {
            x += lerp(piece.oldPosition.x - piece.x, 0, tDuck);
            y += lerp(piece.oldPosition.y - piece.y, 0, tDuck);
            // if (piece.type === PieceType.DUCK) {
            //     y -= 0.2 * easeOutQuad(oscillate(tDuck))
            // }
        }
        let size = this.cellSize;
        x = x * size + this.boardLeft;
        y = y * size + this.boardTop;
        if (piece.type === 0 /* PieceType.VOID */) {
            con.fillStyle = "#000" /* Palette.NOTHING */;
            con.fillRect(x, y, size, size);
            y += (0.1 * easeInOutQuad(oscillate(tVibe)) - 0.05) * size;
            con.beginPath();
            con.moveTo(x + 0.2 * size, y + 0.2 * size);
            con.lineTo(x + 0.8 * size, y + 0.8 * size);
            con.moveTo(x + 0.2 * size, y + 0.8 * size);
            con.lineTo(x + 0.8 * size, y + 0.2 * size);
            con.strokeStyle = "#566c86" /* Palette.VOID */;
            con.stroke();
            return;
        }
        if (piece.type === 3 /* PieceType.GOAL */) {
            const step = size / 3 /* Settings.HATCHING_AMOUNT */;
            con.beginPath();
            for (let n = 0; n < 3 /* Settings.HATCHING_AMOUNT */; ++n) {
                const sn = step * (n + 0.5);
                con.moveTo(x, y + sn);
                con.lineTo(x + sn, y);
                con.moveTo(x + size, y + size - sn);
                con.lineTo(x + size - sn, y + size);
            }
            con.strokeStyle = "#a7f070" /* Palette.GOAL */;
            con.stroke();
            return;
        }
        x -= 0.25 /* Settings.BLOCK_GROW */;
        y -= 0.25 /* Settings.BLOCK_GROW */;
        size += 2 * 0.25 /* Settings.BLOCK_GROW */;
        if (piece.killed) {
            size = lerp(size, 0, tDuck); // .InlineExp
            const padding = 0.5 * (this.cellSize - size);
            x += padding;
            y += padding;
        }
        const bh = 0.4 /* Settings.BLOCK_HEIGHT */ * size;
        switch (piece.type) {
            case 1 /* PieceType.DUCK */:
                const colorIndex = (this.ducksOnGoal.has(piece) ? 1 : 0) + (this.ducksOnGoalNext.has(piece) ? 2 : 0);
                paintBlock(x, y, size, bh, duckColors[colorIndex], duckSecondaryColors[colorIndex], 0, 20 /* Settings.BLOCK_REFLECTION_OPACITY */);
                if (colorIndex === 3) {
                    con.beginPath();
                    con.moveTo(x + 0.2 * size, y - bh + 0.5 * size);
                    con.lineTo(x + 0.4 * size, y - bh + 0.7 * size);
                    con.lineTo(x + 0.8 * size, y - bh + 0.3 * size);
                    con.strokeStyle = "#38b764" /* Palette.DUCK_ON_GOAL_2 */;
                    con.stroke();
                }
                else if (colorIndex === 0 && this.ducksOnGoal.size && this.ducksOnGoalNext.size) {
                    con.beginPath();
                    con.moveTo(x + 0.2 * size, y - bh + 0.2 * size);
                    con.lineTo(x + 0.8 * size, y - bh + 0.8 * size);
                    con.moveTo(x + 0.2 * size, y - bh + 0.8 * size);
                    con.lineTo(x + 0.8 * size, y - bh + 0.2 * size);
                    con.strokeStyle = "#ef7d57" /* Palette.DUCK_2 */;
                    con.stroke();
                }
                if (duckState.phase === 4 /* DuckPhase.CONNECTING */ && this.active.has(piece)) {
                    const progress = size * tDuck; // .Inline(1)
                    paintBlock(x, y, size, bh, "#94b0c2" /* Palette.DUCKLING */, "#566c86" /* Palette.DUCKLING_2 */, progress);
                }
                break;
            case 2 /* PieceType.DUCKLING */:
                paintBlock(x, y, size, bh, "#94b0c2" /* Palette.DUCKLING */, "#566c86" /* Palette.DUCKLING_2 */, 0, 20 /* Settings.BLOCK_REFLECTION_OPACITY */);
                if (duckState.phase === 4 /* DuckPhase.CONNECTING */ && this.active.has(piece)) {
                    const progress = size * tDuck; // .Inline(1)
                    paintBlock(x, y, size, bh, "#ffcd75" /* Palette.DUCK */, "#ef7d57" /* Palette.DUCK_2 */, progress);
                }
                break;
            case 4 /* PieceType.BOX */:
                paintBlock(x, y, size, bh, "#41a6f6" /* Palette.BOX */, "#3b5dc9" /* Palette.BOX_2 */, 0, 20 /* Settings.BLOCK_REFLECTION_OPACITY */);
                con.beginPath();
                con.arc(x + 0.5 * size, y - bh + 0.5 * size, 0.3 * size, 0, 2 * Math.PI);
                con.strokeStyle = "#3b5dc9" /* Palette.BOX_2 */;
                con.stroke();
                break;
            case 5 /* PieceType.CUTTER */:
                const height = (0.9 * easeOutQuad(oscillate(tVibe)) + 0.1) * bh;
                con.beginPath();
                con.lineTo(x + 0.8 * size, y + 0.5 * size);
                con.arc(x + 0.5 * size, y + height + 0.5 * size, 0.3 * size, 0, Math.PI);
                con.lineTo(x + 0.2 * size, y + 0.5 * size);
                con.fillStyle = "#c42430" /* Palette.CUTTER_2 */ + 20 /* Settings.BLOCK_REFLECTION_OPACITY */;
                con.fill();
                con.beginPath();
                con.lineTo(x + 0.8 * size, y - height + 0.5 * size);
                con.arc(x + 0.5 * size, y + 0.5 * size, 0.3 * size, 0, Math.PI);
                con.lineTo(x + 0.2 * size, y - height + 0.5 * size);
                con.fillStyle = "#c42430" /* Palette.CUTTER_2 */;
                con.fill();
                con.beginPath();
                con.arc(x + 0.5 * size, y - height + 0.5 * size, 0.3 * size, 0, 2 * Math.PI);
                con.fillStyle = "#f5555d" /* Palette.CUTTER */;
                con.fill();
        }
    }
}
function paintBlock(x, y, size, height, color, color2, progress, reflectionOpacity) {
    if (reflectionOpacity) {
        con.fillStyle = color2 + reflectionOpacity;
        con.fillRect(x, y + size - 0.25 /* Settings.BLOCK_GROW */, size, height + 0.25 /* Settings.BLOCK_GROW */);
    }
    con.fillStyle = color2;
    con.fillRect(x + progress, y - height + size - 0.25 /* Settings.BLOCK_GROW */, size - progress, height + 0.25 /* Settings.BLOCK_GROW */);
    con.fillStyle = color;
    con.fillRect(x + progress, y - height, size - progress, size);
}
//#region Level 1
class Level1 extends Level {
    render(t, tOscillator) {
        super.render(t, tOscillator);
        con.save();
        con.shadowColor = "#000" /* Palette.NOTHING */;
        con.shadowOffsetX = con.shadowOffsetY = 3;
        con.beginPath();
        const x = 0.5 * 960 /* Settings.SCREEN_WIDTH */; // .Inline(1)
        const y = this.boardTop + 4.5 * this.cellSize; // .Inline(1)
        printCenter(x, y, 4, 'ARROWS TO MOVE OR TAP ON SCREEN', 1, tOscillator);
        con.fillStyle = "#ffcd75" /* Palette.DUCK */;
        con.fill();
        con.restore();
    }
}
//#endregion Level 1
//#region Level select
class LevelSelect extends Level {
    checkWin() {
        const { x, y } = this.board.pieces[1 /* PieceType.DUCK */][0];
        let goal;
        if (this.board.positions[y][x].some(p => p.type === 3 /* PieceType.GOAL */ && (goal = p))) {
            const x0 = 0.5 * (goal.x - 2); // .Inline(1)
            const y0 = 0.5 * (goal.y - 2); // .Inline(1)
            duckState.levelIndex = 6 * y0 + x0 - 1;
            enterPhase(duckState, 5 /* DuckPhase.LEAVING */, 64 /* Settings.LEAVE_DURATION */);
            sound(3 /* SoundEffect.WIN */);
            return 1 /* ShortBool.TRUE */;
        }
        // .DeadCode
        return;
        // .EndDeadCode
    }
    render(t, tOscillator) {
        super.render(t, tOscillator);
        con.save();
        con.shadowColor = "#000" /* Palette.NOTHING */;
        con.shadowOffsetX = con.shadowOffsetY = 3;
        con.beginPath();
        const x = 0.5 * 960 /* Settings.SCREEN_WIDTH */; // .Inline(1)
        const y = this.boardTop + 8.5 * this.cellSize; // .Inline(1)
        con.fillStyle = "#32CD32" /* 绿色 */;
        printCenter(x, y, 4, 'LUMIN由爱制造', 1, tOscillator);
        con.fill();
        con.restore();
    }
    levelText() {
        con.save();
        con.shadowColor = "#000" /* Palette.NOTHING */;
        con.shadowOffsetX = con.shadowOffsetY = 3;
        // In progress
        con.beginPath();
        for (let n = 1; n < levels.length - 2; ++n) {
            if (duckState.clear[n])
                continue;
            const x0 = this.boardLeft + (2 * (n % 6) + 2) * this.cellSize; // .Inline(1)
            const y0 = this.boardTop + (2 * Math.floor(n / 6) + 2.5) * this.cellSize; // .Inline(1)
            const ch = String(n); // .Inline(1)
            printCenter(x0, y0 + 0.5 * 6 /* Settings.LEVEL_SELECT_FONT_SIZE */, 6 /* Settings.LEVEL_SELECT_FONT_SIZE */, ch, 0, 0);
        }
        con.fillStyle = "#f4f4f4" /* Palette.LEVEL_INCOMPLETE */;
        con.fill();
        // Clear
        con.beginPath();
        for (let n = 1; n < levels.length - 2; ++n) {
            if (!duckState.clear[n])
                continue;
            const x0 = this.boardLeft + (2 * (n % 6) + 2) * this.cellSize; // .Inline(1)
            const y0 = this.boardTop + (2 * Math.floor(n / 6) + 2.5) * this.cellSize; // .Inline(1)
            const ch = String(n); // .Inline(1)
            printCenter(x0, y0 + 0.5 * 6 /* Settings.LEVEL_SELECT_FONT_SIZE */, 6 /* Settings.LEVEL_SELECT_FONT_SIZE */, ch, 0, 0);
        }
        con.fillStyle = "#a7f070" /* Palette.LEVEL_CLEAR */;
        con.fill();
        con.restore();
    }
}
//#endregion Level select
export function loadLevel(string, external) {
    const width = parseInt(string.slice(0, 2), 16);
    const height = parseInt(string.slice(2, 4), 16);
    const bigint = BigInt('0x' + string.slice(4));
    const LevelClass = external ? Level : duckState.levelIndex === 1 ? Level1 : duckState.levelIndex === levels.length - 1 ? LevelSelect : Level;
    const level = new LevelClass(width, height, external);
    level.board.load(bigint);
    const clusterTypes = [1 /* PieceType.DUCK */, 2 /* PieceType.DUCKLING */, 4 /* PieceType.BOX */];
    clusterTypes.forEach(type => level.board.buildClusters(type));
    try {
        level.outline = outline(level);
    }
    catch (err) {
    }
    return level;
}
//#region Level outline
class Edge {
    constructor(x0, y0, x1, y1) {
        this.start = new Vec2(x0, y0);
        this.end = new Vec2(x1, y1);
        this.dir = new Vec2(x1 - x0, y1 - y0);
        this.next = null;
    }
}
function outline({ board, cellSize, boardLeft, boardTop }) {
    const ch = Array.from({ length: board.height + 1 }, (_, y) => Array.from({ length: board.width + 1 }, (_, x) => ({
        edges: [], // Edges starting at these coordinates
        value: board.positions[y]?.[x]?.every(p => p.type !== 0 /* PieceType.VOID */),
    })));
    const edges = new Set;
    const edgesAfterNext = new Set; // Edges pointed to by next
    const path = new Path2D;
    // Debug
    // console.log(ch.map(row => row.map(col => col.value ? '#' : ' ').join('')).join('\n'))
    for (let y = 0; y < board.height; ++y) {
        for (let x = 0; x < board.width; ++x) {
            if (!ch[y][x].value)
                continue;
            const left = x > 0 && ch[y][x - 1].value ? null : new Edge(x, y + 1, x, y);
            const up = y > 0 && ch[y - 1][x].value ? null : new Edge(x, y, x + 1, y);
            const right = ch[y][x + 1].value ? null : new Edge(x + 1, y, x + 1, y + 1);
            const down = ch[y + 1][x].value ? null : new Edge(x + 1, y + 1, x, y + 1);
            if (left && up) {
                left.next = up;
                edgesAfterNext.add(up);
            }
            if (up && right) {
                up.next = right;
                edgesAfterNext.add(right);
            }
            if (right && down) {
                right.next = down;
                edgesAfterNext.add(down);
            }
            if (down && left) {
                down.next = left;
                edgesAfterNext.add(left);
            }
            if (left) {
                ch[left.start.y][left.start.x].edges.push(left);
                edges.add(left);
            }
            if (up) {
                ch[up.start.y][up.start.x].edges.push(up);
                edges.add(up);
            }
            if (right) {
                ch[right.start.y][right.start.x].edges.push(right);
                edges.add(right);
            }
            if (down) {
                ch[down.start.y][down.start.x].edges.push(down);
                edges.add(down);
            }
        }
    }
    function findSubpath(edge) {
        const endPoint = edge.start; // If we've reached this, we're done with the subpath
        path.moveTo(edge.start.x * cellSize + boardLeft, edge.start.y * cellSize + boardTop);
        // console.log('Subpath:')
        while (1 /* ShortBool.TRUE */) {
            // Take this edge
            edges.delete(edge);
            edgesAfterNext.delete(edge);
            const arr = ch[edge.start.y][edge.start.x].edges;
            arr.splice(arr.indexOf(edge), 1);
            // Chain
            while (!edge.next && ch[edge.end.y][edge.end.x].edges.length === 1) {
                const chain = ch[edge.end.y][edge.end.x].edges[0];
                if (chain.dir.x !== edge.dir.x || chain.dir.y !== edge.dir.y)
                    break;
                edge.end.copy(chain.end);
                edge.next = chain.next;
                // Clean up
                edges.delete(chain);
                edgesAfterNext.delete(chain);
                const arr = ch[chain.start.y][chain.start.x].edges;
                arr.splice(arr.indexOf(chain), 1);
            }
            // Save and continue on the path
            if (edge.end.x === endPoint.x && edge.end.y === endPoint.y) {
                // console.log('Close subpath')
                path.closePath();
                break;
            }
            else {
                // console.log(`(${edge.start.x}, ${edge.start.y}) to (${edge.end.x}, ${edge.end.y})`)
                path.lineTo(edge.end.x * cellSize + boardLeft, edge.end.y * cellSize + boardTop);
            }
            if (edge.next)
                edge = edge.next;
            else if (ch[edge.end.y][edge.end.x].edges.length === 1)
                edge = ch[edge.end.y][edge.end.x].edges[0];
            else
                throw Error('Logic error');
        }
    }
    for (let edge of edgesAfterNext) {
        findSubpath(edge);
    }
    for (const edge of edges) {
        // console.log(`Leftover (${edge.start.x}, ${edge.start.y}) to (${edge.end.x}, ${edge.end.y})`)
        findSubpath(edge);
    }
    return path;
}
