(function () {
  'use strict';

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Main loop using a fixed step of `T` milliseconds.
   * `render()` receives `t` in the range (0, 1] for interpolation. */
  const startMainloop = (update, render, T = 20) => {
    let before;
    let t = 0;
    const loop = current => {
      requestAnimationFrame(loop);
      t += current - before;
      before = current;
      // Most updates per render
      let n = 4;
      while (t > 0) {
        t -= T;
        if (--n >= 0) update(T);
      }
      render(t / T + 1);
    };
    requestAnimationFrame(current => {
      requestAnimationFrame(loop);
      before = current;
    });
  };

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Linear interpolation */
  const lerp = (a, b, t) => a * (1 - t) + b * t;
  /** Quadratic ease-out function */
  const easeOutQuad = t => t * (2 - t);
  /** Quadratic ease-in-out function */
  const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 2 * t * (2 - t) - 1;

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */
  /** Decode a bitmap stored as a BigInt value. */
  const decodeBitmapBigInt = (value, width, height, cardinality, readFunction) => {
    cardinality = BigInt(cardinality);
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        readFunction(x, y, Number(value % cardinality));
        value /= cardinality;
      }
    }
  };

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023 Mark Vasilkov
   */
  /** 2D vector class */
  class Vec2 {
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
  const register0 = /*@__PURE__*/ new Vec2;
  const register1 = /*@__PURE__*/ new Vec2;

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  class Piece extends Vec2 {
      constructor(type, x, y) {
          super(x, y);
          this.type = type;
          this.oldPosition = new Vec2(x, y);
      }
  }
  class Cluster {
      constructor(pieces) {
          (this.pieces = pieces).forEach(p => p.cluster = this);
      }
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  class Board {
      constructor(width, height) {
          this.width = width;
          this.height = height;
          this.pieces = {};
          this.positions = Array.from({ length: height }, () => Array.from({ length: width }, () => []));
      }
      createPiece(type, x, y) {
          const piece = new Piece(type, x, y);
          this.pieces[type] ??= []; // .InlineExp
          this.pieces[type].push(piece);
          this.positions[y][x].push(piece);
          return piece;
      }
      discardPiece(piece) {
          let stack = this.pieces[piece.type];
          stack.splice(stack.indexOf(piece), 1);
          stack = this.positions[piece.y][piece.x];
          stack.splice(stack.indexOf(piece), 1);
      }
      /** Move a piece to a position on the board. */
      putPiece(piece, x, y) {
          const stack = this.positions[piece.y][piece.x];
          stack.splice(stack.indexOf(piece), 1);
          this.positions[y][x].push(piece.set(x, y));
      }
      getBorderingPieces(piece, type) {
          return this.pieces[type]?.filter(p => p.distanceSquared(piece) === 1);
      }
      /*
      hasBorderingPieces(piece: Readonly<Piece>, type: PieceType): boolean | undefined {
          return this.pieces[type]?.some(p => p.distanceSquared(piece) === 1)
      }
      */
      /** Get a group of adjacent pieces of identical type. */
      getGroup(piece) {
          const group = new Set([piece]);
          const stack = [piece];
          while (stack.length) {
              const piece = stack.pop();
              this.getBorderingPieces(piece, piece.type).forEach(other => {
                  if (group.has(other))
                      return;
                  group.add(other);
                  stack.push(other);
              });
          }
          return group;
      }
      buildClusters(type) {
          const pieces = new Set(this.pieces[type]);
          for (const piece of pieces) {
              const cluster = new Cluster([...this.getGroup(piece)]);
              cluster.pieces.forEach(p => pieces.delete(p));
          }
      }
      load(value) {
          decodeBitmapBigInt(value, this.width, this.height, 7 /* Settings.LEVEL_CARDINALITY */, (x, y, type) => {
              if (type === 1)
                  return;
              if (type !== 0)
                  --type;
              this.createPiece(type, x, y);
          });
      }
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Get the PCM data associated with the AudioBuffer. */
  const getPCM = buf => {
    const channels = [];
    for (let n = 0; n < buf.numberOfChannels; ++n) {
      channels[n] = buf.getChannelData(n);
    }
    return channels;
  };
  /** Convert MIDI note to frequency. */
  const convertMidiToFrequency = n => 440 * 2 ** ((n - 69) / 12);

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Audio handle class */
  class AudioHandle {
    /** Initialize the audio context.
     * See https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event */
    async initialize(ini) {
      if (this.initialized) return;
      this.con ??= new AudioContext();
      if (this.con.state !== 'running') {
        try {
          await this.con.resume();
        } catch (err) {
          return;
        }
        // Multiple initialize() calls can eventually get here.
        if (this.initialized) return;
      }
      ini?.(this.con); // Can't be async
      this.initialized = 1 /* ShortBool.TRUE */;
    }
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */
  const UINT32_MAX = 4294967295;

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */
  /** Mulberry32 PRNG class */
  class Mulberry32 {
    constructor(seed) {
      this.state = seed | 0;
    }
    /** Return a pseudorandom uint32. */
    randomUint32() {
      let z = this.state = this.state + 0x6D2B79F5 | 0;
      z = Math.imul(z ^ z >>> 15, z | 1);
      z ^= z + Math.imul(z ^ z >>> 7, z | 61);
      return (z ^ z >>> 14) >>> 0;
    }
    /** Return a pseudorandom number in the range [0, 1). */
    random() {
      return this.randomUint32() / (UINT32_MAX + 1);
    }
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */
  /** Return a pseudorandom uint32 in the range [0, n). */
  const randomUint32LessThan = (prng, n) => {
    const discard = UINT32_MAX - UINT32_MAX % n;
    while (true) {
      const a = prng.randomUint32();
      if (a < discard) return a % n;
    }
  };

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Convert decibels to power ratio. */
  const convertDecibelsToPowerRatio = decibels => 10 ** (0.1 * decibels);

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */
  /** Return a pseudorandom number in the range [-1, 1]. */
  const randomClosedUnit1Ball = prng => (2 * prng.randomUint32() - UINT32_MAX) / UINT32_MAX;

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  /** Impulse response class */
  class ImpulseResponse {
      constructor(channels, sampleRate, prng) {
          this.channels = channels;
          this.sampleRate = sampleRate;
          this.prng = prng;
      }
      /** Get a reverb impulse response. */
      generateReverb(done, startFrequency, endFrequency, duration, fadeIn = 0, decayThreshold = -60) {
          const length = Math.round(duration * this.sampleRate);
          const fadeInLength = Math.round(fadeIn * this.sampleRate);
          const decay = convertDecibelsToPowerRatio(decayThreshold) ** (1 / (length - 1));
          const fade = 1 / (fadeInLength - 1);
          const buf = new AudioBuffer({
              length,
              numberOfChannels: this.channels,
              sampleRate: this.sampleRate,
          });
          for (const ch of getPCM(buf)) {
              for (let n = 0; n < length; ++n) {
                  ch[n] = randomClosedUnit1Ball(this.prng) * decay ** n;
              }
              for (let n = 0; n < fadeInLength; ++n) {
                  ch[n] *= fade * n;
              }
          }
          applyGradualLowpass(done, buf, startFrequency, endFrequency, duration);
      }
  }
  /** Apply a lowpass filter to the AudioBuffer. */
  function applyGradualLowpass(done, buf, startFrequency, endFrequency, duration) {
      const audioContext = new OfflineAudioContext(buf.numberOfChannels, buf.length, buf.sampleRate);
      const filter = new BiquadFilterNode(audioContext, {
          type: 'lowpass',
          Q: 0.0001,
          frequency: startFrequency,
      });
      filter.connect(audioContext.destination);
      filter.frequency.exponentialRampToValueAtTime(endFrequency, duration);
      const player = new AudioBufferSourceNode(audioContext, {
          buffer: buf,
      });
      player.connect(filter);
      player.start();
      audioContext.oncomplete = event => {
          done(event.renderedBuffer);
      };
      audioContext.startRendering();
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  /* Magical Power of the Mallet by ZUN
   * Transcribed by MTSranger (released under CC BY 4.0)
   * Edited by Mark Vasilkov
   */
  const MUSIC = [
      [64, 0.0, 0.5, 40, 0.0, 0.25, 67, 0.04, 0.5, 71, 0.08, 0.5, 76, 0.12, 0.5, 47, 0.25, 0.5, 71, 0.5, 1.25, 52, 0.5, 0.75, 55, 0.75, 1.0],
      [59, 0.0, 0.25, 76, 0.25, 0.5, 55, 0.25, 0.5, 78, 0.5, 0.75, 52, 0.5, 0.75, 79, 0.75, 1.0, 47, 0.75, 1.0],
      [69, 0.0, 0.5, 45, 0.0, 0.25, 72, 0.04, 0.5, 76, 0.08, 0.5, 81, 0.12, 0.5, 52, 0.25, 0.5, 76, 0.5, 1.25, 57, 0.5, 0.75, 60, 0.75, 1.0],
      [64, 0.0, 0.25, 81, 0.25, 0.5, 60, 0.25, 0.5, 83, 0.5, 0.75, 57, 0.5, 0.75, 86, 0.75, 1.0, 52, 0.75, 1.0],
      [69, 0.0, 0.75, 50, 0.0, 0.25, 74, 0.04, 0.75, 78, 0.08, 0.75, 81, 0.12, 0.75, 57, 0.25, 0.5, 62, 0.5, 0.75, 79, 0.75, 1.0, 66, 0.75, 1.0],
      [78, 0.0, 0.25, 69, 0.0, 0.25, 79, 0.25, 0.375, 66, 0.25, 0.5, 78, 0.375, 0.625, 62, 0.5, 0.75, 74, 0.625, 1.0, 57, 0.75, 1.0],
      [59, 0.0, 1.0, 35, 0.0, 0.25, 63, 0.04, 1.0, 66, 0.08, 1.0, 71, 0.12, 1.0, 42, 0.25, 0.5, 47, 0.5, 0.75, 51, 0.75, 1.0],
      [63, 0.0, 1.0, 54, 0.0, 0.25, 66, 0.04, 1.0, 71, 0.08, 1.0, 75, 0.12, 1.0, 51, 0.25, 0.5, 47, 0.5, 0.75, 42, 0.75, 1.0],
      0,
      1,
      2,
      3,
      4,
      5,
      [64, 0.0, 2.0, 40, 0.0, 0.25, 67, 0.04, 2.0, 71, 0.08, 2.0, 76, 0.12, 2.0, 47, 0.25, 0.5, 52, 0.5, 0.75, 55, 0.75, 1.0],
      [64, 0.0, 0.25, 59, 0.25, 0.5, 55, 0.5, 0.75, 52, 0.75, 1.0],
      [64, 0.0, 0.125, 40, 0.0, 0.25, 71, 0.125, 0.25, 69, 0.25, 0.375, 47, 0.25, 0.5, 71, 0.375, 0.5, 74, 0.5, 0.625, 52, 0.5, 0.75, 71, 0.625, 0.75, 69, 0.75, 0.875, 55, 0.75, 1.0, 71, 0.875, 1.0],
      [64, 0.0, 0.125, 59, 0.0, 0.25, 71, 0.125, 0.25, 69, 0.25, 0.375, 55, 0.25, 0.5, 71, 0.375, 0.5, 74, 0.5, 0.625, 52, 0.5, 0.75, 71, 0.625, 0.75, 69, 0.75, 0.875, 47, 0.75, 1.0, 71, 0.875, 1.0],
      [66, 0.0, 0.125, 36, 0.0, 0.25, 67, 0.125, 0.25, 66, 0.25, 0.375, 43, 0.25, 0.5, 67, 0.375, 0.5, 71, 0.5, 0.625, 48, 0.5, 0.75, 67, 0.625, 0.75, 66, 0.75, 0.875, 52, 0.75, 1.0, 67, 0.875, 1.0],
      [66, 0.0, 0.125, 55, 0.0, 0.25, 67, 0.125, 0.25, 66, 0.25, 0.375, 52, 0.25, 0.5, 67, 0.375, 0.5, 71, 0.5, 0.625, 48, 0.5, 0.75, 67, 0.625, 0.75, 66, 0.75, 0.875, 43, 0.75, 1.0, 67, 0.875, 1.0],
      [62, 0.0, 0.125, 38, 0.0, 0.25, 69, 0.125, 0.25, 67, 0.25, 0.375, 45, 0.25, 0.5, 69, 0.375, 0.5, 74, 0.5, 0.625, 50, 0.5, 0.75, 69, 0.625, 0.75, 67, 0.75, 0.875, 54, 0.75, 1.0, 69, 0.875, 1.0],
      [62, 0.0, 0.125, 57, 0.0, 0.25, 69, 0.125, 0.25, 67, 0.25, 0.375, 54, 0.25, 0.5, 69, 0.375, 0.5, 74, 0.5, 0.625, 50, 0.5, 0.75, 69, 0.625, 0.75, 67, 0.75, 0.875, 45, 0.75, 1.0, 69, 0.875, 1.0],
      [63, 0.0, 0.125, 35, 0.0, 0.25, 71, 0.125, 0.25, 69, 0.25, 0.375, 42, 0.25, 0.5, 71, 0.375, 0.5, 75, 0.5, 0.625, 47, 0.5, 0.75, 71, 0.625, 0.75, 69, 0.75, 0.875, 51, 0.75, 1.0, 71, 0.875, 1.0],
      [63, 0.0, 0.125, 54, 0.0, 0.25, 71, 0.125, 0.25, 69, 0.25, 0.375, 51, 0.25, 0.5, 71, 0.375, 0.5, 75, 0.5, 0.625, 47, 0.5, 0.75, 71, 0.625, 0.75, 69, 0.75, 0.875, 42, 0.75, 1.0, 71, 0.875, 1.0],
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      [63, 0.0, 0.125, 47, 0.0, 0.25, 71, 0.125, 0.25, 69, 0.25, 0.375, 51, 0.25, 0.5, 71, 0.375, 0.5, 75, 0.5, 0.625, 54, 0.5, 0.75, 71, 0.625, 0.75, 75, 0.75, 0.875, 59, 0.75, 1.0, 78, 0.875, 1.0],
      [64, 0.0, 0.5, 40, 0.0, 0.125, 67, 0.04, 0.5, 71, 0.08, 0.5, 76, 0.12, 0.5, 47, 0.125, 0.25, 52, 0.25, 0.375, 55, 0.375, 0.5, 71, 0.5, 1.25, 67, 0.5, 1.25, 59, 0.5, 0.625, 55, 0.625, 0.75, 52, 0.75, 0.875, 47, 0.875, 1.0],
      [40, 0.0, 0.125, 52, 0.125, 0.25, 76, 0.25, 0.5, 71, 0.25, 0.5, 55, 0.25, 0.375, 59, 0.375, 0.5, 78, 0.5, 0.75, 71, 0.5, 0.75, 64, 0.5, 0.625, 59, 0.625, 0.75, 79, 0.75, 1.0, 71, 0.75, 1.0, 55, 0.75, 0.875, 52, 0.875, 1.0],
      [69, 0.0, 0.5, 45, 0.0, 0.125, 72, 0.04, 0.5, 76, 0.08, 0.5, 81, 0.12, 0.5, 52, 0.125, 0.25, 57, 0.25, 0.375, 60, 0.375, 0.5, 76, 0.5, 1.25, 72, 0.5, 1.25, 64, 0.5, 0.625, 60, 0.625, 0.75, 57, 0.75, 0.875, 52, 0.875, 1.0],
      [45, 0.0, 0.125, 57, 0.125, 0.25, 81, 0.25, 0.5, 76, 0.25, 0.5, 60, 0.25, 0.375, 64, 0.375, 0.5, 83, 0.5, 0.75, 76, 0.5, 0.75, 69, 0.5, 0.625, 64, 0.625, 0.75, 86, 0.75, 1.0, 78, 0.75, 1.0, 60, 0.75, 0.875, 57, 0.875, 1.0],
      [69, 0.0, 0.75, 50, 0.0, 0.125, 74, 0.04, 0.75, 78, 0.08, 0.75, 81, 0.12, 0.75, 54, 0.125, 0.25, 57, 0.25, 0.375, 62, 0.375, 0.5, 66, 0.5, 0.625, 62, 0.625, 0.75, 79, 0.75, 1.0, 57, 0.75, 0.875, 50, 0.875, 1.0],
      [78, 0.0, 0.25, 74, 0.0, 0.25, 38, 0.0, 0.125, 45, 0.125, 0.25, 79, 0.25, 0.375, 50, 0.25, 0.375, 78, 0.375, 0.625, 54, 0.375, 0.5, 57, 0.5, 0.625, 74, 0.625, 1.0, 54, 0.625, 0.75, 50, 0.75, 0.875, 45, 0.875, 1.0],
      [59, 0.0, 1.0, 35, 0.0, 0.125, 63, 0.04, 1.0, 66, 0.08, 1.0, 71, 0.12, 1.0, 42, 0.125, 0.25, 47, 0.25, 0.375, 51, 0.375, 0.5, 54, 0.5, 0.625, 51, 0.625, 0.75, 47, 0.75, 0.875, 42, 0.875, 1.0],
      [63, 0.0, 1.0, 47, 0.0, 0.125, 66, 0.04, 1.0, 71, 0.08, 1.0, 75, 0.12, 1.0, 51, 0.125, 0.25, 54, 0.25, 0.375, 59, 0.375, 0.5, 63, 0.5, 0.625, 59, 0.625, 0.75, 54, 0.75, 0.875, 51, 0.875, 1.0],
      32,
      33,
      34,
      35,
      36,
      37,
      [64, 0.0, 2.0, 40, 0.0, 0.125, 67, 0.04, 2.0, 71, 0.08, 2.0, 76, 0.12, 2.0, 47, 0.125, 0.25, 52, 0.25, 0.375, 55, 0.375, 0.5, 59, 0.5, 0.625, 55, 0.625, 0.75, 52, 0.75, 0.875, 47, 0.875, 1.0],
      [40, 0.0, 0.125, 52, 0.125, 0.25, 55, 0.25, 0.375, 59, 0.375, 0.5, 64, 0.5, 0.625, 67, 0.625, 0.75, 71, 0.75, 0.875, 76, 0.875, 1.0],
      [79, 0.0, 1.0, 76, 0.0, 1.0, 64, 0.0, 0.125, 67, 0.125, 0.25, 71, 0.25, 0.375, 67, 0.375, 0.5, 71, 0.5, 1.0],
      [78, 0.0, 0.5, 74, 0.0, 0.5, 62, 0.0, 0.25, 69, 0.25, 0.5, 81, 0.5, 0.75, 74, 0.5, 1.0, 86, 0.75, 1.0],
      [88, 0.0, 2.0, 84, 0.0, 2.0, 67, 0.0, 1.5, 60, 0.0, 1.5],
      [60, 0.5, 0.75, 67, 0.75, 1.0],
      [91, 0.0, 1.0, 88, 0.0, 1.0, 83, 0.0, 1.0, 79, 0.0, 0.25, 76, 0.25, 0.5, 71, 0.5, 0.75, 67, 0.75, 1.0],
      [81, 0.0, 0.3125, 62, 0.0, 1.0, 86, 0.04, 0.3125, 90, 0.08, 0.3125, 86, 0.3125, 0.625, 81, 0.625, 0.9375, 86, 0.9375, 1.25],
      [64, 0.25, 2.0, 71, 0.29, 2.0, 76, 0.33, 2.0, 79, 0.37, 2.0, 83, 0.41, 2.0, 88, 0.45, 2.0],
  ];
  function play(note, bar) {
      if (bar > 54)
          return;
      const part = (MUSIC[bar].push ? MUSIC[bar] : MUSIC[MUSIC[bar]]);
      for (let n = 0; n < part.length; n += 3) {
          note(part[n], part[n + 1], part[n + 2]);
      }
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const TEMPO_MUL = 120 / 70;
  const audioHandle = new AudioHandle;
  const prng = new Mulberry32(960 /* Settings.SCREEN_WIDTH */);
  let audioOut;
  let songStart;
  const initializeAudio = (startMusic) => (con) => {
      audioOut = new GainNode(con, { gain: 0.3333 });
      // Reverb
      const convolver = new ConvolverNode(con);
      const reverbDry = new GainNode(con, { gain: 0.5 });
      const reverbWet = new GainNode(con, { gain: 0.3333 });
      audioOut.connect(convolver);
      audioOut.connect(reverbDry);
      convolver.connect(reverbWet);
      reverbDry.connect(con.destination);
      reverbWet.connect(con.destination);
      const ir = new ImpulseResponse(2, con.sampleRate, prng);
      ir.generateReverb(buf => {
          convolver.buffer = buf;
          if (!startMusic) {
              sound(0 /* SoundEffect.BUTTON_CLICK */);
              return;
          }
          songStart = con.currentTime + 0.05;
          enqueue();
          setInterval(enqueue, 999);
      }, 16000, 1000, 2 * TEMPO_MUL, 0.00001, -90);
  };
  function toggleAudio(off) {
      if (audioOut) {
          audioOut.gain.value = off ? 0 : 0.3333;
      }
  }
  function decay(osc, start) {
      const envelope = new GainNode(audioHandle.con, { gain: 0.5 });
      envelope.gain.setValueAtTime(0.5, songStart + start);
      envelope.gain.exponentialRampToValueAtTime(0.00001, songStart + start + 2 * TEMPO_MUL);
      osc.connect(envelope);
      return envelope;
  }
  function playNote(n, start, end) {
      start *= TEMPO_MUL;
      end *= TEMPO_MUL;
      const osc = new OscillatorNode(audioHandle.con, {
          type: 'square',
          frequency: convertMidiToFrequency(n),
      });
      decay(osc, start).connect(audioOut);
      osc.start(songStart + start);
      osc.stop(songStart + end);
  }
  let prevPart = -1;
  function enqueue() {
      let bufferWanted = audioHandle.con.currentTime - songStart + 4;
      let queued = (prevPart + 1) * TEMPO_MUL;
      if (queued > bufferWanted)
          return;
      bufferWanted += 4;
      while (queued < bufferWanted) {
          const n = ++prevPart;
          play((index, start, end) => playNote(index, start + n, end + n), n % 57);
          queued += TEMPO_MUL;
      }
  }
  function sound(effect) {
      if (!audioOut)
          return;
      switch (effect) {
          case 0 /* SoundEffect.BUTTON_CLICK */:
              playNote2(91, 0, 0.04); // G6
              break;
          case 1 /* SoundEffect.CONNECT */:
              playNote2(76, 0, 0.05); // E5
              playNote2(79, 0.05, 0.05); // G5
              playNote2(83, 0.1, 0.1); // B5
              break;
          case 2 /* SoundEffect.DISCONNECT */:
              playNote2(83, 0, 0.05); // B5
              playNote2(79, 0.05, 0.05); // G5
              playNote2(76, 0.1, 0.1); // E5
              break;
          case 3 /* SoundEffect.WIN */:
              playNote2(74, 0, 0.05); // D5
              playNote2(76, 0.05, 0.05); // E5
              playNote2(79, 0.1, 0.05); // G5
              playNote2(83, 0.15, 0.05); // B5
              playNote2(86, 0.2, 0.05); // D6
              playNote2(88, 0.25, 0.1); // E6
              break;
          /*
          case SoundEffect.LEVEL_END:
              playNote2(92, 0, 0.1) // Ab6
              playNote2(87, 0.1, 0.1) // Eb6
              playNote2(80, 0.2, 0.1) // Ab5
              playNote2(82, 0.3, 0.1) // Bb5
              break
          */
      }
  }
  // playNote() but for sound effects
  function playNote2(n, start, duration) {
      start += audioHandle.con.currentTime;
      const osc = new OscillatorNode(audioHandle.con, {
          type: 'square',
          frequency: convertMidiToFrequency(n),
      });
      // decay(osc, start).connect(audioOut)
      osc.connect(audioOut);
      osc.start(start);
      osc.stop(start + duration);
  }
  // B, C, D, D#, E, F#, G, A
  const stepNotes = [35, 36, 38, 39, 40, 42, 43, 45];
  function step() {
      if (!audioOut)
          return;
      const con = audioHandle.con;
      const start = con.currentTime;
      const duration = 0.2;
      const frequency = convertMidiToFrequency(stepNotes[randomUint32LessThan(prng, stepNotes.length)]);
      const osc = new OscillatorNode(con, {
          type: 'square',
          frequency: frequency,
      });
      const gain = new GainNode(con);
      osc.connect(gain);
      gain.connect(audioOut);
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(1, start);
      osc.frequency.exponentialRampToValueAtTime(0.5 * frequency, start + duration);
      gain.gain.exponentialRampToValueAtTime(0.00001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$i = "0a05773e0b74b0371f02a6eb5dea9e6";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$h = "07057ffaad6f2661fea04ea";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$g = "0805ab78ef52943bf9d44806c";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$f = "0c05291e93482750939b387a1cf227159cfb5";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$e = "070812c8d3595b377e96ef4aaaf849f7c7ac2a";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$d = "0b054c3346f46f60b6eb689cf5911db8c7";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$c = "09052c0a0c3a11e2df55b5b4a46d1";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$b = "0a0a9a3d348ebb91b3fdd5392989e6e48280b767f7abd16628394fd76dca5f3a5f";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$a = "0a088b588dbd8b8d12a6b6cf115e3616491f022796b1c5531ed9";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$9 = "0b0626c342fa69752fe1444f1eb4a23e4f81ad9c";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$8 = "0d08146eed2200f8076ba28e6790f3a49381687d319acf2d2c396dd39189a032";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$7 = "0e0755f2fd57b0666d3b250d1085faf6786f89fe1236509251103d1eec583b";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$6 = "0a09820ef83d1bfe8c558601a28a2edb322fbc288148a11ba997cf0";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$5 = "0c0d74b4615140b03be5ac9dc1e9ceca9f2e47a7408c85a25d406180ce4f33969ef77152c649f51ecf2f7146a986bceb938b45d4";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$4 = "0c0bb3cb3b721d397d7bb165728c74eb52e34eaace95545b2eccf34ff567bd7852b3e4dc45f3d2b07ed3bbc";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$3 = "120d48f5340829c0054829f082c37235cf198a27499414652d486f7667a38fe5180101bbf4c5295abe775669b1b0d0bbcff235c3588d8bd242522ad99cb5b95a06e1dc254739d9f8b73a582a4c";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$2 = "110c1b657fe7d222eb4ae2a9873b36084d7e192d41c422acd2df1cce8a24ee15c983a4fe25d297b60a8cfa4b697255004e436d2398ef23ca5e1d303c871c4f71a539ef";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value$1 = "2210bb93abd355457213a83d4c3ccd6ecc6e9edc0f417c14e83fc99b589799e7f6a63b7bc350856c052eb27687ec04acb0d316cb09e9ebfbf9fce826e581013886de146c8a2bc3da08adb1012b698f23a2028d938e73732382eef6053b82f4c22265bb97c2985b27a8681686f76f01244ab0ea7aad7660c1ccc686b33c0203a9f303201f298a93c4ae25709da98e984cf38788e4e2e85697dffa5c53611b18aef86d00443542c8e0c6c63fb0de1ba18a66e0fd32";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const value = "0f09b3cd90ef3c126095fe29bd6f411d6bfa0433c5c188d98e721e934991fd4fab1dbdaf66c7c3a36c279cd";

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const levels = [
      ,
      value$i,
      value$h,
      value$g,
      value$f,
      value$e,
      value$d,
      value$c,
      value$b,
      value$a,
      value$9,
      value$8,
      value$7,
      value$6,
      value$5,
      value$4,
      value$3,
      value$2,
      value$1,
      value,
  ];

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023 Mark Vasilkov
   */
  /** Set the current phase and TTL. */
  function enterPhase(state, phase, ttl = 0) {
      state.phase = phase;
      state.phaseTtl = (state.oldTtl = ttl) - 1;
  }
  /** Update the current phase and TTL.
   * If the phase has changed, return the previous phase. */
  function updatePhase(state, nextPhaseMap) {
      state.oldTtl = state.phaseTtl;
      if (state.phaseTtl > 0) {
          --state.phaseTtl;
          return;
      }
      const n = state.phase << 1;
      const nextPhase = nextPhaseMap[n];
      if (!nextPhase)
          return;
      const oldPhase = state.phase;
      enterPhase(state, nextPhase, nextPhaseMap[n | 1]);
      return oldPhase;
  }
  /** Interpolate the current phase progress. */
  function interpolatePhase(state, ttl, t) {
      return 1 - lerp(state.oldTtl, state.phaseTtl, t) / ttl;
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Canvas handle class */
  class CanvasHandle {
    constructor(canvas, width, height, supersampling = 2, ini) {
      canvas ??= document.createElement('canvas');
      this.canvas = canvas;
      this.con = canvas.getContext('2d');
      this.height = height;
      this.width = width;
      canvas.height = supersampling * height;
      canvas.width = supersampling * width;
      this.con.scale(supersampling, supersampling);
      ini?.(this.con, width, height);
    }
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Pointer controls class */
  class Pointer {
    constructor(plane) {
      this.x = this.y = 0;
      this.plane = plane;
    }
    /** Set the pointer position relative to the plane. */
    setPosition(event) {
      const r = this.plane.getBoundingClientRect();
      this.x = event.clientX - r.left;
      this.y = event.clientY - r.top;
    }
    /** Initialize the event handlers. */
    addEventListeners(target) {
      // Mouse events
      target.addEventListener('mousedown', event => {
        event.preventDefault();
        this.held = 1 /* ShortBool.TRUE */;
        this.setPosition(event);
      });
      target.addEventListener('mousemove', event => {
        event.preventDefault();
        this.setPosition(event);
      });
      target.addEventListener('mouseup', event => {
        event.preventDefault();
        this.held = 0 /* ShortBool.FALSE */;
      });
      target.addEventListener('mouseleave', _event => {
        // Default action is none, so no event.preventDefault()
        this.held = 0 /* ShortBool.FALSE */;
      });
      // Touch events
      target.addEventListener('touchstart', event => {
        event.preventDefault();
        this.held = 1 /* ShortBool.TRUE */;
        this.setPosition(event.targetTouches[0]);
      });
      target.addEventListener('touchmove', event => {
        event.preventDefault();
        this.setPosition(event.targetTouches[0]);
      });
      target.addEventListener('touchend', event => {
        event.preventDefault();
        this.held = 0 /* ShortBool.FALSE */;
      });
      target.addEventListener('touchcancel', _event => {
        // Default action is none, so no event.preventDefault()
        this.held = 0 /* ShortBool.FALSE */;
      });
    }
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023, 2024 Mark Vasilkov
   */

  /** Wrapper class that fills the viewport by scaling its contents. */
  class AutoScaleWrapper {
    constructor(wrapper, width, height) {
      /** Update wrapper to fill the viewport. */
      this.updateWrapper = () => {
        const viewportWidth = visualViewport.width;
        const viewportHeight = visualViewport.height;
        const viewportAspectRatio = viewportWidth / viewportHeight;
        const wrapperAspectRatio = this.width / this.height;
        let left = visualViewport.offsetLeft;
        let top = visualViewport.offsetTop;
        if (wrapperAspectRatio < viewportAspectRatio) {
          // Fit height
          this.scale = viewportHeight / this.height;
          left += 0.5 * (viewportWidth - this.scale * this.width);
        } else {
          // Fit width
          this.scale = viewportWidth / this.width;
          top += 0.5 * (viewportHeight - this.scale * this.height);
        }
        this.wrapper.style.transform = `translate(${left}px, ${top}px) scale(${this.scale})`;
      };
      this.wrapper = wrapper;
      this.width = width;
      this.height = height;
      this.scale = 1;
    }
    /** Initialize the event handlers. Return TRUE on failure. */
    addEventListeners() {
      /*
      Sadly, visualViewport is nullable:
       > If the associated document is fully active, return the VisualViewport object
      > associated with the window. Otherwise, return null.
      > https://wicg.github.io/visual-viewport/#dom-window-visualviewport
       The workaround (not included) is to retry after an arbitrary short delay.
      */
      if (!visualViewport) return 1 /* ShortBool.TRUE */;
      addEventListener('resize', this.updateWrapper);
      visualViewport.addEventListener('resize', this.updateWrapper);
      visualViewport.addEventListener('scroll', this.updateWrapper);
      this.updateWrapper();
    }
    /** Translate a point from document coordinates to viewport coordinates. */
    documentToViewport(point) {
      point.x /= this.scale;
      point.y /= this.scale;
    }
  }

  /** This file is part of natlib.
   * https://github.com/mvasilkov/natlib
   * @license MIT | Copyright (c) 2022, 2023 Mark Vasilkov
   */
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
  class Keyboard {
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

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  // Output
  const canvas = new CanvasHandle(document.querySelector('#c'), 960 /* Settings.SCREEN_WIDTH */, 540 /* Settings.SCREEN_HEIGHT */);
  const con = canvas.con;
  con.lineWidth = 1.5;
  const autoscale = new AutoScaleWrapper(document.querySelector('#a'), 960 /* Settings.SCREEN_WIDTH */, 540 /* Settings.SCREEN_HEIGHT */);
  autoscale.addEventListeners();
  // Input
  const keyboard = new Keyboard;
  keyboard.addEventListeners(document);
  class XPointer extends Pointer {
      setPosition(event) {
          super.setPosition(event);
          autoscale.documentToViewport(this);
      }
  }
  const pointer = new XPointer(canvas.canvas);
  pointer.addEventListeners(document);
  // Disable the context menu
  document.addEventListener('contextmenu', event => {
      event.preventDefault();
  });
  // Helper functions
  function oscillate(t) {
      return t < 0.5 ? 2 * t : 2 - 2 * t;
  }
  function wrapAround(t) {
      return t - Math.floor(t);
  }
  function srgbToLinear(n) {
      n /= 255;
      return n <= 0.0404482362771082 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  }
  function linearToSrgb(n) {
      return Math.floor(255 * (n <= 0.00313066844250063 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - 0.055)).toString(16);
  }
  // Colors for transitions
  // Palette.DUCK = '#ffcd75'
  const COLOR_DUCK_R = srgbToLinear(0xff);
  const COLOR_DUCK_G = srgbToLinear(0xcd);
  const COLOR_DUCK_B = srgbToLinear(0x75);
  // Palette.DUCK_2 = '#ef7d57'
  const COLOR_DUCK_2_R = srgbToLinear(0xef);
  const COLOR_DUCK_2_G = srgbToLinear(0x7d);
  const COLOR_DUCK_2_B = srgbToLinear(0x57);
  // Palette.DUCK_ON_GOAL = '#a7f070'
  const COLOR_GOAL_R = srgbToLinear(0xa7);
  const COLOR_GOAL_G = srgbToLinear(0xf0);
  const COLOR_GOAL_B = srgbToLinear(0x70);
  // Palette.DUCK_ON_GOAL_2 = '#38b764'
  const COLOR_GOAL_2_R = srgbToLinear(0x38);
  const COLOR_GOAL_2_G = srgbToLinear(0xb7);
  const COLOR_GOAL_2_B = srgbToLinear(0x64);

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  function printCenter(x0, y0, scale, text, effectStrength = 0, t = 0) {
      // Modern font rendering using Canvas text
      con.save();
      // Set font properties for bright, theme-appropriate typography
      const fontSize = Math.floor(scale * 24); // Scale up from default size
      con.font = `bold ${fontSize}px 'Microsoft YaHei', 'SimHei', Arial, sans-serif`;
      con.textAlign = 'center';
      con.textBaseline = 'middle';
      // Add subtle animation effect for titles
      const Δy = effectStrength ? effectStrength * 10 * easeInOutQuad(oscillate(wrapAround(t))) : 0;
      // Drop shadow for better visibility and theme enhancement
      con.shadowColor = '#000000';
      con.shadowBlur = 8;
      con.shadowOffsetX = 2;
      con.shadowOffsetY = 2;
      // Render the text
      con.fillText(text, x0, y0 + Δy);
      con.restore();
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const collide = new Set([0 /* PieceType.VOID */]);
  const push = new Set([2 /* PieceType.DUCKLING */, 4 /* PieceType.BOX */]);
  function cascadeMove(board, piece, Δx, Δy, cause) {
      const x = piece.x + Δx;
      const y = piece.y + Δy;
      if (x < 0 || y < 0 || x >= board.width || y >= board.height)
          // Out of bounds, stop
          return;
      if (board.positions[y][x].some(p => collide.has(p.type) && (!p.cluster || p.cluster !== piece.cluster)))
          // Collision, stop
          return;
      // Moving a piece bound to a cluster pushes the entire cluster,
      // except if caused by another piece in that cluster.
      const cluster = (piece.cluster && piece.cluster !== cause?.cluster) ?
          piece.cluster.pieces.filter(p => p !== piece) : []; // .Inline(1)
      // Find pieces that'll be pushed this turn.
      // Pieces sharing a cluster with the current piece can't be pushed.
      const active = cluster.concat(board.positions[y][x]
          .filter(p => push.has(p.type) && (!p.cluster || p.cluster !== piece.cluster)));
      const cascade = [[piece, Δx, Δy]];
      //#region Mutate the board (disabled)
      /*
      // Change the board state for the recursive calls.
      board.putPiece(piece, x, y)

      try {
      */
      //#endregion
      for (const other of active) {
          const dependencies = cascadeMove(board, other, Δx, Δy, piece);
          if (!dependencies)
              // Can't resolve, stop
              return;
          cascade.push(...dependencies);
      }
      //#region Mutate the board (disabled)
      /*
      }
      finally {
          // Restore the board state.
          board.putPiece(piece, piece.x - Δx, piece.y - Δy)
      }
      */
      //#endregion
      // The direction doesn't change, so just dedup the pieces.
      const dedup = new Set;
      return cascade.filter(([piece, ,]) => dedup.has(piece) ? 0 /* ShortBool.FALSE */ : dedup.add(piece));
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const duckPhaseMap = [
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
  const duckState = {
      // IState
      phase: 0 /* DuckPhase.INITIAL */,
      phaseTtl: 0,
      oldTtl: 0,
      // IDuckState
      levelIndex: 1,
      clear: {},
  };
  const oscillatorPhaseMap = [
      1 /* OscillatorPhase.CYCLE */, 64 /* Settings.OSCILLATOR_DURATION */,
      1 /* OscillatorPhase.CYCLE */, 64 /* Settings.OSCILLATOR_DURATION */,
  ];
  const oscillatorState = {
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

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  class Level {
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
          con.fillStyle = '#32CD32'; // 绿色
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
  function loadLevel(string, external) {
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

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const result = register0;
  function getGamepadDirection() {
      try {
          for (const gamepad of navigator.getGamepads()) {
              if (gamepad) {
                  result.b = gamepad.buttons[1].pressed;
                  return result.set(gamepad.axes[0] < -0.25 /* Settings.GAMEPAD_DEAD_ZONE */ ? -1 :
                      gamepad.axes[0] > 0.25 /* Settings.GAMEPAD_DEAD_ZONE */ ? 1 : 0, gamepad.axes[1] < -0.25 /* Settings.GAMEPAD_DEAD_ZONE */ ? -1 :
                      gamepad.axes[1] > 0.25 /* Settings.GAMEPAD_DEAD_ZONE */ ? 1 : 0);
              }
          }
      }
      catch (err) {
      }
      // .DeadCode
      return;
      // .EndDeadCode
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  const SVG_MUSIC = new Path2D('M20.18 23.93l18.55-6.67v11.08a7.65 7.65 0 0 0-3.82-1c-3.92 0-7.09 2.85-7.09 6.37 0 3.52 3.17 6.37 7.09 6.37 3.92 0 7.09-2.85 7.09-6.37V14.98c0-2.24 0-4.12-0.18-5.61a13.45 13.45 0 0 0-0.08-0.62c-0.17-1.02-0.47-1.98-1.05-2.77a4.49 4.49 0 0 0-1.35-1.24l-0.02-0.01c-1.54-0.92-3.28-0.86-5.06-0.44-1.73 0.4-3.87 1.2-6.5 2.19l-4.57 1.71c-1.23 0.46-2.27 0.85-3.09 1.26-0.87 0.43-1.62 0.94-2.19 1.71-0.56 0.76-0.8 1.58-0.9 2.46-0.1 0.84-0.1 1.85-0.1 3.05v15.59a7.65 7.65 0 0 0-3.82-1C9.17 31.26 6 34.11 6 37.63 6 41.15 9.17 44 13.09 44c3.92 0 7.09-2.85 7.09-6.37v-13.7Z');
  const SVG_RESET = new Path2D('M6.93 6.93C4 9.86 4 14.57 4 24c0 9.43 0 14.14 2.93 17.07C9.86 44 14.57 44 24 44c9.43 0 14.14 0 17.07-2.93C44 38.14 44 33.43 44 24c0-9.43 0-14.14-2.93-17.07C38.14 4 33.43 4 24 4S9.86 4 6.93 6.93Zm11.59 9.02A1.5 1.5 0 1 0 16.48 13.74L11.98 17.9a1.5 1.5 0 0 0 0 2.2l4.5 4.16a1.5 1.5 0 1 0 2.04-2.21l-1.68-1.55h11.24a5.42 5.42 0 0 1 0 10.85H19a1.5 1.5 0 1 0 0 3h9.08a8.42 8.42 0 0 0 0-16.85h-11.24l1.68-1.55Z');
  const SVG_BACK = new Path2D('M13.74 39c1.86 1 4.09 1 8.54 1h5.28c7.75 0 11.63 0 14.03-2.34C44 35.31 44 31.54 44 24c0-7.54 0-11.31-2.41-13.66C39.18 8 35.31 8 27.56 8h-5.27c-4.45 0-6.68 0-8.54 1-1.86 1-3.04 2.84-5.41 6.52L6.98 17.64C4.99 20.73 4 22.28 4 24c0 1.72 0.99 3.27 2.98 6.36l1.36 2.12c2.36 3.68 3.54 5.51 5.4 6.52Zm8.32-21.06A1.5 1.5 0 0 0 19.94 20.06L23.88 24l-3.94 3.94a1.5 1.5 0 1 0 2.12 2.12L26 26.12l3.94 3.94a1.5 1.5 0 0 0 2.12-2.12L28.12 24l3.94-3.94a1.5 1.5 0 0 0-2.12-2.12L26 21.88l-3.94-3.94Z');
  function renderIcons() {
      con.save();
      con.translate(960 /* Settings.SCREEN_WIDTH */ - 3 * 48 /* Settings.ICON_SIZE */ - 2 * 8 /* Settings.ICON_SPACING */, 0);
      con.fillStyle = duckState.audioMuted ? "#ffcd7580" /* Palette.ICON_INACTIVE */ : "#ffcd75" /* Palette.ICON */;
      con.fill(SVG_MUSIC);
      con.translate(48 /* Settings.ICON_SIZE */ + 8 /* Settings.ICON_SPACING */, 0);
      con.fillStyle = "#ffcd75" /* Palette.ICON */;
      con.fill(SVG_RESET, 'evenodd');
      con.translate(48 /* Settings.ICON_SIZE */ + 8 /* Settings.ICON_SPACING */, 0);
      con.fill(SVG_BACK, 'evenodd');
      con.restore();
  }

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
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
  function renderCastle(t) {
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

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  function renderIntro(t, tOscillator) {
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
          printCenter(left, top, 4, '开始', 1, tOscillator);
          printCenter(right, top - 0.05 * 540 /* Settings.SCREEN_HEIGHT */, 4, '开始', 1, tOscillator);
          printCenter(right, top + 0.05 * 540 /* Settings.SCREEN_HEIGHT */, 3, '音乐关闭', 1, tOscillator);
          con.shadowColor = "#c42430" /* Palette.BUTTON_3 */;
          con.fillStyle = "#f5555d" /* Palette.BUTTON_2 */;
          con.fill();
      }
      con.shadowColor = '#0000';
      con.shadowOffsetX = con.shadowOffsetY = 0;
  }
  function renderIntroEnd(t, tOscillator) {
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

  /** This file is part of Super Castle Game.
   * https://github.com/mvasilkov/super2023
   * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
   */
  let level;
  try {
      level = loadLevel(location.hash.slice(1), 1 /* ShortBool.TRUE */);
      duckState.levelIndex = levels.length - 2;
  }
  catch (err) {
      level = loadLevel(levels[duckState.levelIndex]);
  }
  function resetLevel() {
      if (level.external) {
          try {
              level = loadLevel(location.hash.slice(1), 1 /* ShortBool.TRUE */);
              duckState.levelIndex = levels.length - 2;
          }
          catch (err) {
              level = loadLevel(levels[duckState.levelIndex]);
          }
      }
      else {
          level = loadLevel(levels[duckState.levelIndex]);
      }
  }
  function updateControls() {
      if (keyboard.state[9 /* Input.R */]) {
          // Reset
          return resetLevel();
      }
      const left = keyboard.state[1 /* Input.LEFT */] || keyboard.state[5 /* Input.LEFT_A */];
      const up = keyboard.state[2 /* Input.UP */] || keyboard.state[6 /* Input.UP_W */];
      const right = keyboard.state[3 /* Input.RIGHT */] || keyboard.state[7 /* Input.RIGHT_D */];
      const down = keyboard.state[4 /* Input.DOWN */] || keyboard.state[8 /* Input.DOWN_S */];
      // Left XOR right || up XOR down
      if ((left ? !right : right) || (up ? !down : down)) {
          const ducks = level.board.pieces[1 /* PieceType.DUCK */] ?? [];
          if (!ducks.length)
              return;
          const Δx = (right ? 1 : 0) - (left ? 1 : 0);
          const Δy = (down ? 1 : 0) - (up ? 1 : 0);
          if (Δx) {
              ducks.sort((a, b) => Δx * (b.x - a.x));
              if (!level.tryMove(ducks[0], Δx, 0))
                  return;
          }
          if (Δy) {
              ducks.sort((a, b) => Δy * (b.y - a.y));
              if (!level.tryMove(ducks[0], 0, Δy))
                  return;
          }
      }
      if (pointer.held) {
          // Click in the icons area
          const iconsAreaWidth3 = 3 * 48 /* Settings.ICON_SIZE */ + 2.5 * 8 /* Settings.ICON_SPACING */; // .Inline(1)
          const iconsAreaWidth2 = 2 * 48 /* Settings.ICON_SIZE */ + 1.5 * 8 /* Settings.ICON_SPACING */; // .Inline(1)
          const iconsAreaWidth1 = 1 * 48 /* Settings.ICON_SIZE */ + 0.5 * 8 /* Settings.ICON_SPACING */; // .Inline(1)
          if (pointer.x >= 960 /* Settings.SCREEN_WIDTH */ - iconsAreaWidth3 && pointer.x < 960 /* Settings.SCREEN_WIDTH */ && pointer.y < 48 /* Settings.ICON_SIZE */) {
              if (!duckState.pointerHeld) {
                  duckState.pointerHeld = 1 /* ShortBool.TRUE */;
                  if (pointer.x >= 960 /* Settings.SCREEN_WIDTH */ - iconsAreaWidth1) {
                      // Level select
                      if (duckState.levelIndex === levels.length - 1 && !level.external) {
                          // Reset (since we're in the level select screen)
                          resetLevel();
                      }
                      else {
                          duckState.levelIndex = levels.length - 2;
                          enterPhase(duckState, 5 /* DuckPhase.LEAVING */, 64 /* Settings.LEAVE_DURATION */);
                          sound(3 /* SoundEffect.WIN */);
                          return;
                      }
                  }
                  else if (pointer.x >= 960 /* Settings.SCREEN_WIDTH */ - iconsAreaWidth2) {
                      // Reset
                      resetLevel();
                  }
                  else {
                      // Toggle audio
                      toggleAudio(duckState.audioMuted = !duckState.audioMuted);
                  }
                  sound(0 /* SoundEffect.BUTTON_CLICK */);
              }
              return;
          }
          // Level select 'Click here' thing
          if (duckState.levelIndex === levels.length - 1 &&
              pointer.x >= level.boardLeft + 2 * level.cellSize &&
              pointer.x < 960 /* Settings.SCREEN_WIDTH */ - (level.boardLeft + 2 * level.cellSize) &&
              pointer.y >= level.boardTop + 8 * level.cellSize) {
              if (!duckState.pointerHeld) {
                  duckState.pointerHeld = 1 /* ShortBool.TRUE */;
                  pointer.held = 0 /* ShortBool.FALSE */; // Since we're opening a new tab
                  toggleAudio(duckState.audioMuted = 1 /* ShortBool.TRUE */);
                  open("https://github.com/mvasilkov/super2023/tree/master/levels#levels" /* Settings.COMMUNITY_LEVELS_URL */, 'levels');
              }
              return;
          }
          const ducks = level.board.pieces[1 /* PieceType.DUCK */] ?? [];
          if (!ducks.length)
              return;
          // Pointer position in board coordinates
          register0.set((pointer.x - level.boardLeft) / level.cellSize - 0.5, (pointer.y - level.boardTop) / level.cellSize - 0.5);
          // Centroid of ducks
          register1.set(ducks.reduce((xs, duck) => xs + duck.x, 0) / ducks.length, ducks.reduce((ys, duck) => ys + duck.y, 0) / ducks.length);
          let Δx, Δy;
          const x = Math.abs(Δx = register0.x - register1.x);
          const y = Math.abs(Δy = register0.y - register1.y);
          if (x < y) {
              if (y < 0.5 /* Settings.POINTER_DEAD_ZONE */)
                  return;
              Δy = Δy < 0 ? -1 : 1;
              ducks.sort((a, b) => Δy * (b.y - a.y));
              level.tryMove(ducks[0], 0, Δy);
          }
          else {
              if (x < 0.5 /* Settings.POINTER_DEAD_ZONE */)
                  return;
              Δx = Δx < 0 ? -1 : 1;
              ducks.sort((a, b) => Δx * (b.x - a.x));
              level.tryMove(ducks[0], Δx, 0);
          }
      }
      else
          duckState.pointerHeld = 0 /* ShortBool.FALSE */;
      const direction = getGamepadDirection();
      if (direction) {
          if (direction.b) {
              // Reset
              return resetLevel();
          }
          const ducks = level.board.pieces[1 /* PieceType.DUCK */] ?? [];
          if (!ducks.length)
              return;
          if (direction.x) {
              ducks.sort((a, b) => direction.x * (b.x - a.x));
              if (!level.tryMove(ducks[0], direction.x, 0))
                  return;
          }
          if (direction.y) {
              ducks.sort((a, b) => direction.y * (b.y - a.y));
              if (!level.tryMove(ducks[0], 0, direction.y))
                  return;
          }
      }
  }
  function update() {
      const oldPhase = updatePhase(duckState, duckPhaseMap);
      switch (duckState.phase) {
          case 2 /* DuckPhase.INTERACTIVE */:
              if (oldPhase === 3 /* DuckPhase.MOVING */ || oldPhase === 4 /* DuckPhase.CONNECTING */) {
                  const ducks = [];
                  const updateClusters = new Set;
                  for (const piece of level.active) {
                      if (piece.killed) {
                          level.discardPiece(piece);
                          if (piece.cluster) {
                              // new Cluster(piece.cluster.pieces.filter(p => p !== piece))
                              updateClusters.add(piece.cluster);
                          }
                          continue;
                      }
                      // Does nothing if oldPhase === DuckPhase.CONNECTING
                      piece.oldPosition.copy(piece);
                      if (piece.type === 1 /* PieceType.DUCK */) {
                          ducks.push(piece);
                      }
                  }
                  level.active.clear();
                  // Split clusters
                  updateClusters.forEach(cluster => {
                      level.splitCluster(cluster);
                  });
                  level.updateDucksOnGoal(level.ducksOnGoal);
                  level.connectDucklings(ducks.filter(duck => !duck.killed));
              }
              // Could've changed in connectDucklings() or splitCluster()
              if (duckState.phase === 2 /* DuckPhase.INTERACTIVE */) {
                  level.checkWin() || updateControls();
              }
              break;
          case 6 /* DuckPhase.ENTERING */:
              if (oldPhase === 5 /* DuckPhase.LEAVING */) {
                  level = loadLevel(levels[++duckState.levelIndex]);
                  // Save state
                  localStorage.superCastleIndex = duckState.levelIndex;
                  localStorage.superCastleClear = JSON.stringify(duckState.clear);
              }
      }
      updatePhase(oscillatorState, oscillatorPhaseMap);
  }
  function render(t) {
      const tOscillator = interpolatePhase(oscillatorState, 64 /* Settings.OSCILLATOR_DURATION */, t);
      con.fillStyle = "#000" /* Palette.NOTHING */;
      con.fillRect(0, 0, 960 /* Settings.SCREEN_WIDTH */, 540 /* Settings.SCREEN_HEIGHT */);
      if (duckState.phase === 1 /* DuckPhase.TITLE_SCREEN */) {
          renderIntro(t, tOscillator);
          return;
      }
      level.render(t, tOscillator);
      renderIcons();
      if (duckState.phase === 5 /* DuckPhase.LEAVING */) {
          renderIntro(t, tOscillator);
      }
      else if (duckState.phase === 6 /* DuckPhase.ENTERING */) {
          renderIntroEnd(t, tOscillator);
      }
  }
  startMainloop(update, render);
  // https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event
  document.addEventListener('mousedown', () => {
      if (audioHandle.initialized)
          return;
      audioHandle.initialize(initializeAudio(pointer.x < 0.5 * 960 /* Settings.SCREEN_WIDTH */));
      enterPhase(duckState, 6 /* DuckPhase.ENTERING */, 64 /* Settings.ENTER_DURATION */);
  }, { once: true });
  document.addEventListener('touchend', () => {
      if (audioHandle.initialized)
          return;
      audioHandle.initialize(initializeAudio(pointer.x < 0.5 * 960 /* Settings.SCREEN_WIDTH */));
      enterPhase(duckState, 6 /* DuckPhase.ENTERING */, 64 /* Settings.ENTER_DURATION */);
  }, { once: true });

})();
