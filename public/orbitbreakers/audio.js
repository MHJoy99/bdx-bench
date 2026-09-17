// audio.js — Web Audio synthesizer for Orbitbreakers (zero external files required)
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.boostGain = null;
    this.boostNoise = null;
    this.boostFilter = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.step = 0;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);

      // Engine Synth
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 400;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.001;

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.value = 65;

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.value = 130;

      const engineSub = this.ctx.createOscillator();
      engineSub.type = 'sine';
      engineSub.frequency.value = 32.5;

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      engineSub.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.master);

      this.engineOsc1.start();
      this.engineOsc2.start();
      engineSub.start();
      this.engineSub = engineSub;

      // Boost White Noise + Resonant bandpass
      const bufLen = this.ctx.sampleRate * 2;
      const noiseBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const out = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) out[i] = Math.random() * 2 - 1;

      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      noiseSrc.loop = true;

      this.boostFilter = this.ctx.createBiquadFilter();
      this.boostFilter.type = 'bandpass';
      this.boostFilter.frequency.value = 850;
      this.boostFilter.Q.value = 2.0;

      this.boostGain = this.ctx.createGain();
      this.boostGain.gain.value = 0.0001;

      noiseSrc.connect(this.boostFilter);
      this.boostFilter.connect(this.boostGain);
      this.boostGain.connect(this.master);
      noiseSrc.start();

      // Music Master Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.master);

      this.initialized = true;
      this.startMusic();
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateEngine(speedRatio, isBoosting) {
    if (!this.initialized || !this.enabled) return;
    const now = this.ctx.currentTime;
    const baseFreq = 55 + speedRatio * 180 + (isBoosting ? 90 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
    this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(300 + speedRatio * 2200 + (isBoosting ? 2500 : 0), now, 0.08);

    const targetGain = 0.08 + speedRatio * 0.22 + (isBoosting ? 0.15 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

    const boostTarget = isBoosting ? (0.28 + speedRatio * 0.15) : 0.0001;
    this.boostGain.gain.setTargetAtTime(boostTarget, now, 0.04);
    if (isBoosting) {
      this.boostFilter.frequency.setTargetAtTime(900 + speedRatio * 1800, now, 0.04);
    }
  }

  playBeep(freq = 440, duration = 0.12, type = 'sine', gain = 0.3) {
    if (!this.initialized || !this.enabled) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(gain, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(g);
      g.connect(this.master);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  playCountdown(step) {
    // step: 3, 2, 1, 'GO'
    if (step === 'GO') {
      this.playChord([523.25, 659.25, 783.99, 1046.5], 0.6, 'sawtooth', 0.25);
    } else {
      this.playBeep(440, 0.2, 'square', 0.22);
    }
  }

  playChord(notes, duration = 0.4, type = 'triangle', gain = 0.15) {
    if (!this.initialized || !this.enabled) return;
    try {
      notes.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(g);
        g.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      });
    } catch (_) {}
  }

  playBoostPad() {
    if (!this.initialized || !this.enabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (_) {}
  }

  playCheckpoint() {
    this.playChord([659.25, 830.61, 987.77], 0.3, 'sine', 0.25);
  }

  playPickup(type = 'energy') {
    if (!this.initialized || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    if (type === 'shield') {
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    } else if (type === 'hyper') {
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
    } else {
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    }
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playCollision(impact = 1) {
    if (!this.initialized || !this.enabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120 * Math.max(0.5, impact), now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      g.gain.setValueAtTime(Math.min(0.45, 0.2 * impact), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (_) {}
  }

  playWormhole() {
    if (!this.initialized || !this.enabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.4);
      osc.frequency.linearRampToValueAtTime(200, now + 0.8);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (_) {}
  }

  playNearMiss() {
    this.playBeep(920, 0.14, 'sine', 0.22);
  }

  // Procedural Cyber/Space Synth Track (Driving Bassline + Arpeggio)
  startMusic() {
    if (this.musicTimer) return;
    // 138 BPM synthwave bassline
    const bpm = 138;
    const stepDuration = 60 / bpm / 4; // 16th notes
    const bassline = [
      48, 48, 48, 48,  48, 48, 51, 53,
      44, 44, 44, 44,  44, 44, 46, 48,
      41, 41, 41, 41,  41, 41, 43, 44,
      46, 46, 46, 46,  46, 48, 50, 51
    ];
    const mToF = m => 440 * Math.pow(2, (m - 69) / 12);

    this.musicTimer = setInterval(() => {
      if (!this.initialized || !this.enabled || !this.ctx) return;
      if (this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const note = bassline[this.step % bassline.length];
      const isKick = this.step % 4 === 0;
      const isSnare = this.step % 8 === 4;
      const isHiHat = this.step % 2 === 1;

      // Bass synth
      try {
        const osc = this.ctx.createOscillator();
        const f = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(mToF(note), now);

        f.type = 'lowpass';
        f.frequency.setValueAtTime(600, now);
        f.frequency.exponentialRampToValueAtTime(180, now + 0.12);

        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(f);
        f.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.16);
      } catch (_) {}

      // Kick drum
      if (isKick) {
        try {
          const kOsc = this.ctx.createOscillator();
          const kG = this.ctx.createGain();
          kOsc.frequency.setValueAtTime(140, now);
          kOsc.frequency.exponentialRampToValueAtTime(38, now + 0.1);
          kG.gain.setValueAtTime(0.35, now);
          kG.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          kOsc.connect(kG);
          kG.connect(this.musicGain);
          kOsc.start(now);
          kOsc.stop(now + 0.13);
        } catch (_) {}
      }

      // Synth Arp on offbeat
      if (this.step % 2 === 0 && Math.random() > 0.3) {
        try {
          const arpNotes = [60, 63, 67, 70, 72, 75];
          const aNote = arpNotes[Math.floor(Math.random() * arpNotes.length)];
          const aOsc = this.ctx.createOscillator();
          const aG = this.ctx.createGain();
          aOsc.type = 'triangle';
          aOsc.frequency.setValueAtTime(mToF(aNote), now);
          aG.gain.setValueAtTime(0.09, now);
          aG.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
          aOsc.connect(aG);
          aG.connect(this.musicGain);
          aOsc.start(now);
          aOsc.stop(now + 0.2);
        } catch (_) {}
      }

      this.step++;
    }, stepDuration * 1000);
  }

  setMute(mute) {
    this.enabled = !mute;
    if (this.master) {
      this.master.gain.value = mute ? 0 : 0.85;
    }
  }

  toggleMute() {
    this.setMute(this.enabled);
    return !this.enabled;
  }
}
