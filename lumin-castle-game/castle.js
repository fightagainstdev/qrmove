/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict';
import { con } from './setup.js';
const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = 0.5; // Math.sin(Math.PI / 6)
function projectIsoVertex(x, y, z, subpath = 0 /* ShortBool.FALSE */) {
    const xp = (x - y) * COS_30 + 0.5 * 960 /* Settings.SCREEN_WIDTH */;
    const yp = -z + (x + y) * SIN_30 + 0.5 * 540 /* Settings.SCREEN_HEIGHT */;
    subpath === 0 /* ShortBool.FALSE */ ? con.lineTo(xp, yp) : con.moveTo(xp, yp);
}
// function isoHash(x: number, y: number, z: number): number {
//     return (x - y) * Settings.SCREEN_WIDTH + (x + y - z - z)
// }
function renderIsoBlockTop(x, y, z, size) {
    projectIsoVertex(x - size, y - size, z + size, 1 /* ShortBool.TRUE */);
    projectIsoVertex(x + size, y - size, z + size);
    projectIsoVertex(x + size, y + size, z + size);
    projectIsoVertex(x - size, y + size, z + size);
}
function renderIsoBlockRight(x, y, z, size) {
    projectIsoVertex(x + size, y - size, z - size, 1 /* ShortBool.TRUE */);
    projectIsoVertex(x + size, y + size, z - size);
    projectIsoVertex(x + size, y + size, z + size);
    projectIsoVertex(x + size, y - size, z + size);
}
function renderIsoBlockLeft(x, y, z, size) {
    projectIsoVertex(x + size, y + size, z - size, 1 /* ShortBool.TRUE */);
    projectIsoVertex(x - size, y + size, z - size);
    projectIsoVertex(x - size, y + size, z + size);
    projectIsoVertex(x + size, y + size, z + size);
}
const xs = [];
const ys = [];
const zs = [];
const zstrides = [];
function buildCastle() {
    const hashes = new Set;
    for (let x = 7 /* Settings.CASTLE_WIDTH */; x--;) {
        for (let y = 7 /* Settings.CASTLE_LENGTH */; y--;) {
            let count = 0;
            for (let z = 7 /* Settings.CASTLE_HEIGHT */; z--;) {
                // Walls
                if (x > 0 && x < 7 /* Settings.CASTLE_WIDTH */ - 1 && y > 0 && y < 7 /* Settings.CASTLE_LENGTH */ - 1) {
                    continue;
                }
                // Gate
                if (Math.hypot(x - 7, y - 3, z - 1) < 2) {
                    continue;
                }
                // Windows
                if (z > 2 && z < 5 && (x === 2 || x === 4)) {
                    continue;
                }
                // Crenellations
                if (z > 5 && ((x & 1) | (y & 1))) {
                    continue;
                }
                // const hash = /*@__INLINE__*/ isoHash(x, y, z)
                const hash = (x - y) * 960 /* Settings.SCREEN_WIDTH */ + (x + y - z - z);
                if (hashes.has(hash))
                    continue;
                hashes.add(hash);
                xs.unshift(x * 30 /* Settings.CASTLE_BLK_SIZE */);
                ys.unshift(y * 30 /* Settings.CASTLE_BLK_SIZE */);
                zs.unshift(z * 30 /* Settings.CASTLE_BLK_SIZE */);
                ++count;
            }
            if (count)
                zstrides.unshift(count);
        }
    }
}
buildCastle();
export function renderCastle(t) {
    const size = t * 30 /* Settings.CASTLE_BLK_SIZE */ * 0.47 /* Settings.CASTLE_BLK_SCALE */;
    let p = 0;
    for (let n = 0; n < zstrides.length; ++n) {
        const count = zstrides[n];
        const sz = size - (1 - t) * n;
        if (sz <= 0)
            continue;
        con.beginPath();
        for (let q = p; q < p + count; ++q) {
            renderIsoBlockTop(xs[q], ys[q], zs[q], sz);
        }
        con.fillStyle = "#94b0c2" /* Palette.CASTLE */;
        con.fill();
        con.beginPath();
        for (let q = p; q < p + count; ++q) {
            renderIsoBlockRight(xs[q], ys[q], zs[q], sz);
        }
        con.fillStyle = "#566c86" /* Palette.CASTLE_2 */;
        con.fill();
        con.beginPath();
        for (let q = p; q < p + count; ++q) {
            renderIsoBlockLeft(xs[q], ys[q], zs[q], sz);
        }
        con.fillStyle = "#333c57" /* Palette.CASTLE_3 */;
        con.fill();
        p += count;
    }
}
