/* ============================================================
   EMBER DEAD — procedural audio (no external assets)
   ============================================================ */
var Audio = (function () {
  var ac = null, master, sfxBus, musicBus, comp, noiseBuf;
  var fireSrc, fireGain, fireFilter, ready = false;
  var muted = false, musicOn = true, noiseAmt = 0;
  var step = 0, nextTime = 0, BPM = 142, stepDur = 0;

  var BASS = [110.00, 110.00, 87.31, 98.00, 110.00, 110.00, 130.81, 98.00];
  var LEAD = [440, 523.25, 659.25, 523.25, 587.33, 440, 493.88, 392];

  function makeNoise(sec) {
    var len = Math.floor(ac.sampleRate * sec);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;   // brown-ish noise = warmer fire
      d[i] = last * 3.2;
    }
    return buf;
  }

  function init() {
    if (ready) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 22; comp.ratio.value = 9;
    comp.attack.value = 0.004; comp.release.value = 0.22;
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85;
    sfxBus = ac.createGain(); sfxBus.gain.value = 1;
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? 0.32 : 0;
    sfxBus.connect(comp); musicBus.connect(comp);
    comp.connect(master); master.connect(ac.destination);
    noiseBuf = makeNoise(2.2);
    stepDur = 60 / BPM / 4;                 // 16th notes
    nextTime = ac.currentTime + 0.1;

    // continuous flame bed
    fireSrc = ac.createBufferSource();
    fireSrc.buffer = noiseBuf; fireSrc.loop = true;
    fireFilter = ac.createBiquadFilter();
    fireFilter.type = 'bandpass'; fireFilter.frequency.value = 780; fireFilter.Q.value = 0.7;
    fireGain = ac.createGain(); fireGain.gain.value = 0;
    fireSrc.connect(fireFilter); fireFilter.connect(fireGain); fireGain.connect(sfxBus);
    fireSrc.start();
    ready = true;
    return true;
  }

  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }

  /* ---------- primitives ---------- */
  function env(node, t0, a, d, peak) {
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g);
    return g;
  }

  function noiseHit(t0, dur, freq, q, peak, type) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 0.7 + Math.random() * 0.7;
    var f = ac.createBiquadFilter();
    f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    s.connect(f);
    var g = env(f, t0, 0.006, dur, peak);
    g.connect(sfxBus);
    s.start(t0); s.stop(t0 + dur + 0.06);
    return f;
  }

  function tone(t0, dur, f0, f1, peak, type, dest) {
    var o = ac.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    var g = env(o, t0, 0.008, dur, peak);
    g.connect(dest || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  /* ---------- sfx ---------- */
  var S = {
    flameTick: function () {
      if (!ready || muted) return;
      noiseHit(ac.currentTime, 0.055 + Math.random() * 0.04, 1500 + Math.random() * 2200, 1.1, 0.05);
    },
    fireball: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      var f = noiseHit(t, 0.5, 1800, 0.8, 0.4);
      f.frequency.exponentialRampToValueAtTime(180, t + 0.5);
      tone(t, 0.42, 320, 70, 0.3, 'sawtooth');
    },
    boom: function (size) {
      if (!ready || muted) return;
      var t = ac.currentTime, s = size || 1;
      var f = noiseHit(t, 0.55 * s, 900, 0.5, 0.5, 'lowpass');
      f.frequency.exponentialRampToValueAtTime(90, t + 0.5 * s);
      tone(t, 0.6 * s, 120 * s, 34, 0.45, 'sine');
      tone(t, 0.3 * s, 300, 60, 0.18, 'square');
    },
    hit: function () {
      if (!ready || muted) return;
      noiseHit(ac.currentTime, 0.05, 2400, 2, 0.14);
    },
    crit: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      noiseHit(t, 0.08, 3200, 3, 0.2);
      tone(t, 0.1, 1500, 500, 0.12, 'square');
    },
    growl: function (p) {
      if (!ready || muted) return;
      var t = ac.currentTime, f0 = (150 + Math.random() * 60) * (p || 1);
      var o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 0.45);
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      o.connect(lp);
      var g = env(lp, t, 0.03, 0.45, 0.13);
      g.connect(sfxBus);
      o.start(t); o.stop(t + 0.55);
      noiseHit(t, 0.3, 320, 1.2, 0.06);
    },
    die: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      noiseHit(t, 0.28, 600, 0.8, 0.22, 'lowpass');
      tone(t, 0.3, 220, 55, 0.2, 'triangle');
    },
    hurt: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      tone(t, 0.3, 180, 55, 0.42, 'sawtooth');
      noiseHit(t, 0.22, 500, 0.6, 0.3, 'lowpass');
    },
    pickup: function (good) {
      if (!ready || muted) return;
      var t = ac.currentTime;
      tone(t, 0.1, good ? 660 : 880, good ? 990 : 660, 0.2, 'triangle');
      tone(t + 0.08, 0.14, good ? 990 : 660, good ? 1320 : 880, 0.16, 'triangle');
    },
    glass: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      noiseHit(t, 0.14, 5200, 4, 0.2);
      tone(t, 0.18, 2400, 900, 0.1, 'triangle');
    },
    dash: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      var f = noiseHit(t, 0.3, 2600, 0.9, 0.22);
      f.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    },
    wave: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      tone(t, 0.9, 90, 260, 0.3, 'sawtooth');
      tone(t + 0.1, 0.7, 180, 520, 0.14, 'square');
      noiseHit(t, 0.8, 300, 0.5, 0.2, 'lowpass');
    },
    boss: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      tone(t, 2.2, 55, 32, 0.5, 'sawtooth');
      tone(t + 0.15, 1.8, 82, 40, 0.3, 'square');
      noiseHit(t, 1.6, 180, 0.4, 0.35, 'lowpass');
    },
    ui: function () {
      if (!ready || muted) return;
      tone(ac.currentTime, 0.07, 900, 1400, 0.14, 'triangle');
    },
    nuke: function () {
      if (!ready || muted) return;
      var t = ac.currentTime;
      var f = noiseHit(t, 2.2, 3000, 0.4, 0.6, 'lowpass');
      f.frequency.exponentialRampToValueAtTime(60, t + 2.0);
      tone(t, 2.0, 90, 28, 0.55, 'sawtooth');
    }
  };

  /* ---------- flame bed intensity ---------- */
  function setFire(v) {
    if (!ready) return;
    var target = muted ? 0 : Math.min(0.30, v * 0.30);
    fireGain.gain.setTargetAtTime(target, ac.currentTime, 0.06);
    fireFilter.frequency.setTargetAtTime(600 + v * 1500, ac.currentTime, 0.1);
  }

  /* ---------- music ---------- */
  function musicTick() {
    if (!ready || !musicOn || muted) return;
    var horizon = ac.currentTime + 0.25;
    var guard = 0;
    while (nextTime < horizon && guard++ < 32) {
      var t = nextTime, s = step % 16;
      // kick
      if (s % 8 === 0) { tone(t, 0.22, 130, 42, 0.5, 'sine', musicBus); }
      if (s === 6 || s === 14) { noiseHit(t, 0.09, 260, 1, 0.18, 'lowpass'); }
      // hats
      if (s % 2 === 1) { noiseHit(t, 0.035, 7000 + Math.random() * 2500, 2.4, 0.05); }
      // bass
      var b = BASS[(step >> 1) % 8];
      var bo = ac.createOscillator(); bo.type = 'sawtooth';
      bo.frequency.value = b;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1200, t);
      lp.frequency.exponentialRampToValueAtTime(240, t + 0.2);
      bo.connect(lp);
      var bg = env(lp, t, 0.01, 0.19, 0.34);
      bg.connect(musicBus);
      bo.start(t); bo.stop(t + 0.26);
      // lead stabs
      if (s === 4 || s === 12) {
        var l = LEAD[(step >> 2) % 8];
        var lo = ac.createOscillator(); lo.type = 'square'; lo.frequency.value = l;
        var ld = ac.createGain(); ld.gain.setValueAtTime(0.0001, t);
        ld.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
        ld.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        lo.connect(ld); ld.connect(musicBus);
        lo.start(t); lo.stop(t + 0.3);
      }
      nextTime += stepDur; step++;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.85, ac.currentTime, 0.05);
    return muted;
  }
  function toggleMusic() {
    musicOn = !musicOn;
    if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 0.32 : 0, ac.currentTime, 0.08);
    return musicOn;
  }

  return {
    init: init, resume: resume, setFire: setFire, musicTick: musicTick,
    toggleMute: toggleMute, toggleMusic: toggleMusic,
    isMuted: function () { return muted; },
    S: S
  };
})();
