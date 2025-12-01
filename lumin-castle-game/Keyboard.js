/** This file is part of natlib.
 * https://github.com/mvasilkov/natlib
 * @license MIT | Copyright (c) 2022, 2023 Mark Vasilkov
 */
'use strict';
const indices = {
    AoL: 1 /* Input.LEFT */,
    AoU: 2 /* Input.UP */,
    AoR: 3 /* Input.RIGHT */,
    AoD: 4 /* Input.DOWN */,
    KA: 5 /* Input.LEFT_A */,
    KW: 6 /* Input.UP_W */,
    KD: 7 /* Input.RIGHT_D */,
    KS: 8 /* Input.DOWN_S */,
    KR: 9 /* Input.R */,
    Sc: 10 /* Input.SPACE */,
};
function hash(code) {
    return (code[0] ?? '') + (code[3] ?? '') + (code[5] ?? '');
}
/** Keyboard controls class */
export class Keyboard {
    constructor() {
        this.state = [];
    }
    /** Update the keyboard state. */
    setState(event, pressed) {
        if (pressed && (event.altKey || event.ctrlKey || event.metaKey)) {
            // Don't respond to keyboard shortcuts.
            return;
        }
        const input = indices[hash(event.code)];
        if (input) {
            // Repeating keys don't change the state,
            // but still prevent the default action.
            if (!event.repeat)
                this.state[input] = pressed;
            event.preventDefault();
        }
    }
    /** Initialize the event handlers. */
    addEventListeners(target) {
        target.addEventListener('keydown', event => this.setState(event, 1 /* ShortBool.TRUE */));
        target.addEventListener('keyup', event => this.setState(event));
    }
}
