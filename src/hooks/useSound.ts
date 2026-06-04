/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom hook / helper to play retro cyber synthesizer feedback noises using HTML5 Web Audio API.
// Avoids external assets and works completely offline/locally in the browser sandbox.

export function playCyberBlip() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Quick rising synth laser sweep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    // Web Audio API was skipped silently to keep the console clean and warning-free
  }
}

export function playBuzzer() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Retro alarm dual pitch sweep (cyber alert)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.25);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (err) {
    // Web Audio API was skipped silently to keep the console clean and warning-free
  }
}

export function playSuccessTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Nice double tone chime
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, now); // G5
    osc2.frequency.setValueAtTime(987.77, now + 0.1); // B2
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now);
    osc2.stop(now + 0.3);
  } catch (err) {
    // Web Audio API was skipped silently to keep the console clean and warning-free
  }
}
