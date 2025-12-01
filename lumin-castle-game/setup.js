/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict';
import { CanvasHandle } from '../node_modules/natlib/canvas/CanvasHandle.js';
import { Pointer } from '../node_modules/natlib/controls/Pointer.js';
import { AutoScaleWrapper } from '../node_modules/natlib/viewport/AutoScaleWrapper.js';
import { Keyboard } from './Keyboard.js';
// Output
export const canvas = new CanvasHandle(document.querySelector('#c'), 960 /* Settings.SCREEN_WIDTH */, 540 /* Settings.SCREEN_HEIGHT */);
export const con = canvas.con;
con.lineWidth = 1.5;
export const autoscale = new AutoScaleWrapper(document.querySelector('#a'), 960 /* Settings.SCREEN_WIDTH */, 540 /* Settings.SCREEN_HEIGHT */);
autoscale.addEventListeners();
// Input
export const keyboard = new Keyboard;
keyboard.addEventListeners(document);
class XPointer extends Pointer {
    setPosition(event) {
        super.setPosition(event);
        autoscale.documentToViewport(this);
    }
}
export const pointer = new XPointer(canvas.canvas);
pointer.addEventListeners(document);
// Disable the context menu
document.addEventListener('contextmenu', event => {
    event.preventDefault();
});
// Helper functions
export function oscillate(t) {
    return t < 0.5 ? 2 * t : 2 - 2 * t;
}
export function wrapAround(t) {
    return t - Math.floor(t);
}
export function srgbToLinear(n) {
    n /= 255;
    return n <= 0.0404482362771082 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}
export function linearToSrgb(n) {
    return Math.floor(255 * (n <= 0.00313066844250063 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - 0.055)).toString(16);
}
// Colors for transitions
// Palette.DUCK = '#ffcd75'
export const COLOR_DUCK_R = srgbToLinear(0xff);
export const COLOR_DUCK_G = srgbToLinear(0xcd);
export const COLOR_DUCK_B = srgbToLinear(0x75);
// Palette.DUCK_2 = '#ef7d57'
export const COLOR_DUCK_2_R = srgbToLinear(0xef);
export const COLOR_DUCK_2_G = srgbToLinear(0x7d);
export const COLOR_DUCK_2_B = srgbToLinear(0x57);
// Palette.DUCK_ON_GOAL = '#a7f070'
export const COLOR_GOAL_R = srgbToLinear(0xa7);
export const COLOR_GOAL_G = srgbToLinear(0xf0);
export const COLOR_GOAL_B = srgbToLinear(0x70);
// Palette.DUCK_ON_GOAL_2 = '#38b764'
export const COLOR_GOAL_2_R = srgbToLinear(0x38);
export const COLOR_GOAL_2_G = srgbToLinear(0xb7);
export const COLOR_GOAL_2_B = srgbToLinear(0x64);
