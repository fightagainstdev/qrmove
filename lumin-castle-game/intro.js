/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict';
import { easeInOutQuad, easeOutQuad, lerp } from '../node_modules/natlib/interpolation.js';
import { renderCastle } from './castle.js';
import { interpolatePhase } from './natlib_state.js';
import { printCenter } from './print.js';
import { con } from './setup.js';
import { duckState } from './state.js';
export function renderIntro(t, tOscillator) {
    const t0 = interpolatePhase(duckState, duckState.phase === 1 /* DuckPhase.TITLE_SCREEN */ ? 96 /* Settings.TITLE_ENTER_DURATION */ : 64 /* Settings.LEAVE_DURATION */, t);
    t = easeInOutQuad(t0);
    con.fillStyle = "#ef7d57" /* Palette.INTRO_2 */;
    con.fillRect(0, 0.5 * (1 - t) * 540 /* Settings.SCREEN_HEIGHT */, 960 /* Settings.SCREEN_WIDTH */, t * 540 /* Settings.SCREEN_HEIGHT */);
    renderCastle(t);
    con.beginPath();
    printCenter(0.5 * 960 /* Settings.SCREEN_WIDTH */, lerp(-20, 0.25 * 540 /* Settings.SCREEN_HEIGHT */, easeOutQuad(t0)), 6, 'LUMIN城堡', 1.5, tOscillator);
    // con.lineWidth = 3
    // con.strokeStyle = Palette.NOTHING
    // con.stroke()
    con.shadowColor = "#1a1c2c" /* Palette.BOARD */;
    con.shadowOffsetX = con.shadowOffsetY = 3;
    con.fillStyle = "#ffcd75" /* Palette.INTRO */;
    con.fill();
    if (duckState.phase === 1 /* DuckPhase.TITLE_SCREEN */) {
        const top = lerp(540 /* Settings.SCREEN_HEIGHT */ + 90, 0.75 * 540 /* Settings.SCREEN_HEIGHT */, easeOutQuad(t0));
        const left = 210; // .Inline(2)
        const right = 960 /* Settings.SCREEN_WIDTH */ - 210; // .Inline(3)
        con.beginPath();
        con.rect(left - 150, top - 80, 300, 160);
        con.rect(right - 150, top - 80, 300, 160);
        con.fillStyle = "#ffcd75" /* Palette.BUTTON */;
        con.fill();
        con.beginPath();
        printCenter(left, top, 6, 'START', 1, tOscillator);
        printCenter(right, top - 0.05 * 540 /* Settings.SCREEN_HEIGHT */, 6, 'START', 1, tOscillator);
        printCenter(right, top + 0.05 * 540 /* Settings.SCREEN_HEIGHT */, 4, 'MUSIC OFF', 1, tOscillator);
        con.shadowColor = "#c42430" /* Palette.BUTTON_3 */;
        con.fillStyle = "#f5555d" /* Palette.BUTTON_2 */;
        con.fill();
    }
    con.shadowColor = '#0000';
    con.shadowOffsetX = con.shadowOffsetY = 0;
}
export function renderIntroEnd(t, tOscillator) {
    t = easeInOutQuad(interpolatePhase(duckState, 64 /* Settings.ENTER_DURATION */, t));
    con.save();
    con.beginPath();
    con.rect(0.5 * t * 960 /* Settings.SCREEN_WIDTH */, 0, (1 - t) * 960 /* Settings.SCREEN_WIDTH */, 540 /* Settings.SCREEN_HEIGHT */);
    con.fillStyle = "#ef7d57" /* Palette.INTRO_2 */;
    con.fill();
    con.clip();
    renderCastle(1);
    con.beginPath();
    printCenter(0.5 * 960 /* Settings.SCREEN_WIDTH */, 0.25 * 540 /* Settings.SCREEN_HEIGHT */, 6, 'LUMIN城堡', 1.5, tOscillator);
    // con.lineWidth = 3
    // con.strokeStyle = Palette.NOTHING
    // con.stroke()
    con.shadowColor = "#000" /* Palette.NOTHING */;
    con.shadowOffsetX = con.shadowOffsetY = 3;
    con.fillStyle = "#ffcd75" /* Palette.INTRO */;
    con.fill();
    con.restore();
}
