/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict';
import { levels } from './levels.js';
export const duckPhaseMap = [
    1 /* DuckPhase.TITLE_SCREEN */, 96 /* Settings.TITLE_ENTER_DURATION */,
    ,
    ,
    ,
    ,
    2 /* DuckPhase.INTERACTIVE */, ,
    2 /* DuckPhase.INTERACTIVE */, ,
    6 /* DuckPhase.ENTERING */, 64 /* Settings.ENTER_DURATION */,
    2 /* DuckPhase.INTERACTIVE */, ,
];
export const duckState = {
    // IState
    phase: 0 /* DuckPhase.INITIAL */,
    phaseTtl: 0,
    oldTtl: 0,
    // IDuckState
    levelIndex: 1,
    clear: {},
};
export const oscillatorPhaseMap = [
    1 /* OscillatorPhase.CYCLE */, 64 /* Settings.OSCILLATOR_DURATION */,
    1 /* OscillatorPhase.CYCLE */, 64 /* Settings.OSCILLATOR_DURATION */,
];
export const oscillatorState = {
    phase: 0 /* OscillatorPhase.INITIAL */,
    phaseTtl: 0,
    oldTtl: 0,
};
// Load state
try {
    if (localStorage.superCastleIndex && localStorage.superCastleClear) {
        const loadedIndex = +localStorage.superCastleIndex;
        const loadedClear = JSON.parse(localStorage.superCastleClear);
        if (loadedIndex && loadedIndex < levels.length && levels[loadedIndex] && loadedClear[1] === 1 /* ShortBool.TRUE */) {
            duckState.levelIndex = loadedIndex;
            Object.assign(duckState.clear, loadedClear);
        }
    }
}
catch (err) {
}
