/** This file is part of natlib.
 * https://github.com/mvasilkov/natlib
 * @license MIT | Copyright (c) 2022, 2023 Mark Vasilkov
 */
'use strict';
/** 2D vector class */
export class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    /** Set the components of this vector. */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    /** Copy the components of a vector to this vector. */
    copy(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }
    /** Add a vector to this vector. */
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    /** Get the length of this vector. */
    length() {
        return Math.hypot(this.x, this.y);
    }
    /** Get the squared distance between two vectors. */
    distanceSquared(other) {
        return (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
    }
}
// These variables are used to avoid garbage collection of
// short-lived objects at runtime.
export const register0 = /*@__PURE__*/ new Vec2;
export const register1 = /*@__PURE__*/ new Vec2;
export const register2 = /*@__PURE__*/ new Vec2;
export const register3 = /*@__PURE__*/ new Vec2;
