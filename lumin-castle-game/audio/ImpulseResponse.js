/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict';
import { getPCM } from '../../node_modules/natlib/audio/audio.js';
import { convertDecibelsToPowerRatio } from '../../node_modules/natlib/audio/decibels.js';
import { randomClosedUnit1Ball } from '../../node_modules/natlib/prng/sampling.js';
/** Impulse response class */
export class ImpulseResponse {
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
export function applyGradualLowpass(done, buf, startFrequency, endFrequency, duration) {
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
