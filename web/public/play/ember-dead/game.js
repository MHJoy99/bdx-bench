/* ============================================================
   EMBER DEAD — fire zombie survival
   Single-file canvas game engine. No assets, no network.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     0. CANVAS / VIEWPORT
     --------------------------------------------------------- */
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d', { alpha: false });
  let vw = 0, vh = 0, dpr = 1, S = 1, floor = null;

  function buildFloor() {
    floor = document.createElement('canvas');
    const scale = 0.6;
    floor.width = Math.max(1, Math.floor(vw * scale));
    floor.height = Math.max(1, Math.floor(vh * scale));
    const g = floor.getContext('2d');
    const w = floor.width, h = floor.height;
    g.clearRect(0, 0, w, h);
    // ash scatter
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = Math.random() * 1.6 + 0.2;
      g.fillStyle = 'rgba(' + (30 + Math.random() * 40 | 0) + ',' + (22 + Math.random() * 20 | 0) + ',20,' + (0.05 + Math.random() * 0.12) + ')';
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    // glowing cracks
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      let x = Math.random() * w, y = Math.random() * h;
      let a = Math.random() * 6.2832;
      const segs = 4 + (Math.random() * 9 | 0);
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < segs; s++) {
        a += (Math.random() - 0.5) * 1.1;
        const len = 6 + Math.random() * 26;
        x += Math.cos(a) * len; y += Math.sin(a) * len;
        g.lineTo(x, y);
      }
      g.strokeStyle = 'rgba(255,110,30,0.10)';
      g.lineWidth = 1.6 + Math.random();
      g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.5)';
      g.lineWidth = 0.7;
      g.stroke();
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = Math.max(320, window.innerWidth);
    vh = Math.max(320, window.innerHeight);
    cvs.width = Math.floor(vw * dpr);
    cvs.height = Math.floor(vh * dpr);
    cvs.style.width = vw + 'px';
    cvs.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.max(0.7, Math.min(1.3, Math.min(vw, vh) / 860));
    buildFloor();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------------------------------------------------------
     1. PRERENDERED SPRITES
     --------------------------------------------------------- */
  function makeSprite(size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const s of stops) grd.addColorStop(s[0], s[1]);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const SPR = {
    flame: makeSprite(96, [
      [0, 'rgba(255,255,235,1)'],
      [0.16, 'rgba(255,226,140,0.95)'],
      [0.36, 'rgba(255,150,40,0.72)'],
      [0.62, 'rgba(220,60,10,0.34)'],
      [1, 'rgba(80,10,0,0)']
    ]),
    ember: makeSprite(48, [
      [0, 'rgba(255,240,200,1)'],
      [0.3, 'rgba(255,150,50,0.8)'],
      [0.7, 'rgba(200,50,0,0.25)'],
      [1, 'rgba(0,0,0,0)']
    ]),
    smoke: makeSprite(96, [
      [0, 'rgba(58,48,52,0.55)'],
      [0.55, 'rgba(38,30,34,0.26)'],
      [1, 'rgba(20,14,18,0)']
    ]),
    spark: makeSprite(32, [
      [0, 'rgba(255,255,255,1)'],
      [0.35, 'rgba(255,210,130,0.8)'],
      [1, 'rgba(255,90,10,0)']
    ])
  };

  /* ---------------------------------------------------------
     2. PARTICLE POOL
     --------------------------------------------------------- */
  const PN = 1500;
  const PA = [];
  let pHead = 0;
  for (let i = 0; i < PN; i++) {
    PA.push({ live: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4, size1: 0, type: 0, drag: 1.6, grav: 0, rot: 0, rotV: 0, add: true, tint: 0 });
  }
  function fx(x, y, vx, vy, life, size, type, o) {
    const p = PA[pHead];
    pHead = (pHead + 1) % PN;
    o = o || {};
    p.live = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.max = life; p.size = size; p.type = type;
    p.size1 = o.size1 !== undefined ? o.size1 : 0;
    p.drag = o.drag !== undefined ? o.drag : 1.7;
    p.grav = o.grav !== undefined ? o.grav : 0;
    p.rot = Math.random() * 6.2832;
    p.rotV = (Math.random() - 0.5) * 7;
    p.add = o.add !== undefined ? o.add : true;
    p.tint = o.tint || 0;
  }
  function updateParticles(dt) {
    for (let i = 0; i < PN; i++) {
      const p = PA[i];
      if (!p.live) continue;
      p.life -= dt;
      if (p.life <= 0) { p.live = false; continue; }
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy *= d;
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.rotV * dt;
    }
  }
  function drawParticles() {
    ctx.save();
    for (let pass = 0; pass < 2; pass++) {
      ctx.globalCompositeOperation = pass === 0 ? 'lighter' : 'source-over';
      for (let i = 0; i < PN; i++) {
        const p = PA[i];
        if (!p.live) continue;
        const add = p.add;
        if ((pass === 0) !== add) continue;
        const t = p.life / p.max;
        let s = p.size + (p.size1 - p.size) * (1 - t);
        if (p.type === 1) s = p.size + (p.size1 - p.size) * (1 - t);
        if (s <= 0.2) continue;
        let a = t * t;
        if (p.type === 3) { a = Math.min(1, t * 2.2); }
        ctx.globalAlpha = a;
        if (p.type === 3) {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.tint ? '#7a2a12' : '#2a1a18';
          ctx.fillRect(-s, -s * 0.6, s * 2, s * 1.2);
          ctx.restore();
        } else if (p.type === 2) {
          ctx.drawImage(SPR.spark, p.x - s, p.y - s, s * 2, s * 2);
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = '#ffcf7a'; ctx.lineWidth = Math.max(0.6, s * 0.25);
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
          ctx.stroke();
        } else if (p.type === 1) {
          ctx.drawImage(SPR.smoke, p.x - s, p.y - s, s * 2, s * 2);
        } else {
          ctx.drawImage(p.type === 4 ? SPR.ember : SPR.flame, p.x - s, p.y - s, s * 2, s * 2);
        }
      }
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------
     3. FLOATING TEXT
     --------------------------------------------------------- */
  const pops = [];
  function pop(x, y, txt, col, size, vy) {
    pops.push({ x: x, y: y, t: txt, c: col || '#ffd07a', s: size || 15, life: 0.9, max: 0.9, vy: vy || -46 });
  }

  /* ---------------------------------------------------------
     4. ENEMY TYPES
     --------------------------------------------------------- */
  const ZT = {
    walker:  { hp: 34,   spd: 54,  r: 16, dmg: 11, atk: 1.0, kb: 1,    score: 100,  col: '#6d7f46', label: 'WALKER' },
    runner:  { hp: 22,   spd: 136, r: 13, dmg: 9,  atk: 0.75, kb: 1.4, score: 170,  col: '#cfc25c', label: 'RUNNER' },
    brute:   { hp: 165,  spd: 42,  r: 28, dmg: 27, atk: 1.5, kb: 0.22, score: 360,  col: '#7d5c92', label: 'BRUTE' },
    spitter: { hp: 32,   spd: 50,  r: 15, dmg: 0,  atk: 2.5, kb: 1,    score: 230,  col: '#4a93ad', label: 'SPITTER', ranged: true },
    emberz:  { hp: 55,   spd: 76,  r: 17, dmg: 0,  atk: 1,   kb: 1,    score: 270,  col: '#d9662a', label: 'EMBER', bomb: true },
    boss:    { hp: 1250, spd: 40,  r: 54, dmg: 34, atk: 1.9, kb: 0,    score: 6500, col: '#93301c', label: 'INFERNO BEHEMOTH', boss: true }
  };

  /* ---------------------------------------------------------
     5. GAME STATE
     --------------------------------------------------------- */
  const G = {
    state: 'menu',        // menu | play | pause | over
    wave: 0, waveTimer: 0, inWave: false,
    score: 0, kills: 0, best: 0, bestCombo: 0,
    combo: 0, comboT: 0, comboGrace: 2.6,
    slowmo: 0, hitStop: 0, shake: 0, flash: 0,
    time: 0, killsThisWave: 0
  };
  try { G.best = parseInt(localStorage.getItem('emberdead.best') || '0', 10) || 0; } catch (e) { }

  const zombies = [], shots = [], ebolts = [], pools = [], pickups = [], decals = [];

  const P = {
    x: 0, y: 0, vx: 0, vy: 0, r: 15, speed: 258,
    hp: 100, maxHp: 100, shield: 40, maxShield: 40, shieldT: 0,
    angle: -Math.PI / 2, cdFire: 0, cdMolo: 0, cdDash: 0, cdNuke: 0,
    dashT: 0, dx: 0, dy: 0, inv: 0, hurtT: 0, burning: 0,
    power: 0, powerT: 0, nuke: 0, alive: true, hasMouse: false
  };

  /* ---------------------------------------------------------
     6. INPUT
     --------------------------------------------------------- */
  const keys = {};
  let mouse = { x: vw / 2, y: vh / 2, down: false, rdown: false };
  const touch = { active: false, mx: 0, my: 0, ox: 0, oy: 0, id: -1 };

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (keys[k]) return;
    keys[k] = true;
    if (k === 'p' || k === 'escape') togglePause();
    if (k === 'm') { const m = Audio.toggleMute(); soundBtn.classList.toggle('off', m); }
    if (k === 'e') throwMolo();
    if (k === 'f') fireball();
    if (k === 'q') useNuke();
    if (k === ' ') dash();
    if (k === 'r' && G.state === 'over') startGame();
    if (k === 'enter' && G.state === 'menu') startGame();
  });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { if (G.state === 'play') togglePause(true); });

  cvs.addEventListener('contextmenu', e => e.preventDefault());
  cvs.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY; P.hasMouse = true;
  });
  cvs.addEventListener('mousedown', e => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) { mouse.rdown = true; fireball(); }
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rdown = false;
  });

  /* touch */
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) {
    document.getElementById('touch').classList.remove('hidden');
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    const R = 46;
    cvs.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.hypot(t.clientX - cx, t.clientY - cy) < 90) {
        touch.active = true; touch.id = t.identifier; touch.ox = cx; touch.oy = cy;
        moveKnob(t.clientX - cx, t.clientY - cy);
      } else { mouse.down = true; }
    }, { passive: true });
    cvs.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (touch.active && t.identifier === touch.id) moveKnob(t.clientX - touch.ox, t.clientY - touch.oy);
      }
    }, { passive: true });
    cvs.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === touch.id) { touch.active = false; touch.mx = touch.my = 0; knob.style.transform = ''; }
      }
    }, { passive: true });
    function moveKnob(dx, dy) {
      const d = Math.hypot(dx, dy) || 1;
      const c = Math.min(1, d / R);
      const ux = dx / d, uy = dy / d;
      touch.mx = ux * c; touch.my = uy * c;
      knob.style.transform = 'translate(' + (ux * c * R) + 'px,' + (uy * c * R) + 'px)';
    }
    document.getElementById('tFire').addEventListener('touchstart', e => { e.preventDefault(); fireball(); }, { passive: false });
    document.getElementById('tMolo').addEventListener('touchstart', e => { e.preventDefault(); throwMolo(); }, { passive: false });
    document.getElementById('tDash').addEventListener('touchstart', e => { e.preventDefault(); dash(); }, { passive: false });
  }

  /* ---------------------------------------------------------
     7. UI WIRING
     --------------------------------------------------------- */
  const $ = id => document.getElementById(id);
  const el = {
    hud: $('hud'), menu: $('menu'), pause: $('pause'), over: $('over'),
    hpFill: $('hpFill'), hpGhost: $('hpGhost'), hpText: $('hpText'), auraFill: $('auraFill'),
    waveText: $('waveText'), scoreText: $('scoreText'), bestText: $('bestText'),
    comboWrap: $('comboWrap'), comboX: $('comboX'), comboFill: $('comboFill'),
    waveInfo: $('waveInfo'), threat: $('threatText'), flash: $('flash'),
    abFire: $('abFire'), abMolo: $('abMolo'), abDash: $('abDash'), abNuke: $('abNuke'),
    fScore: $('fScore'), fWave: $('fWave'), fKills: $('fKills'), fCombo: $('fCombo'), newBest: $('newBest')
  };
  const soundBtn = $('soundToggle');
  soundBtn.addEventListener('click', () => { const m = Audio.toggleMute(); soundBtn.classList.toggle('off', m); });
  $('startBtn').addEventListener('click', e => { e.stopPropagation(); startGame(); });
  $('againBtn').addEventListener('click', e => { e.stopPropagation(); startGame(); });
  $('resumeBtn').addEventListener('click', e => { e.stopPropagation(); togglePause(false); });
  $('quitBtn').addEventListener('click', e => { e.stopPropagation(); toMenu(); });
  [el.menu, el.pause, el.over].forEach(o => o.addEventListener('click', () => { if (G.state === 'menu') startGame(); }));

  function show(node, on) { node.classList.toggle('hidden', !on); }

  /* ---------------------------------------------------------
     8. FLOW
     --------------------------------------------------------- */
  function toMenu() {
    G.state = 'menu';
    show(el.menu, true); show(el.over, false); show(el.pause, false); show(el.hud, false);
    Audio.setFire(0);
  }

  function startGame() {
    Audio.init(); Audio.resume(); Audio.S.ui();
    zombies.length = 0; shots.length = 0; ebolts.length = 0;
    pools.length = 0; pickups.length = 0; decals.length = 0; pops.length = 0;
    G.wave = 0; G.score = 0; G.kills = 0; G.bestCombo = 0;
    G.combo = 0; G.comboT = 0; G.slowmo = 0; G.hitStop = 0; G.shake = 0; G.flash = 0;
    G.inWave = false; G.waveTimer = 2.0;
    P.x = vw / 2; P.y = vh / 2; P.vx = P.vy = 0;
    P.hp = P.maxHp; P.shield = P.maxShield; P.shieldT = 0;
    P.cdFire = P.cdMolo = P.cdDash = P.cdNuke = 0;
    P.dashT = 0; P.inv = 0; P.hurtT = 0; P.power = 0; P.powerT = 0; P.nuke = 0; P.alive = true;
    P.hasMouse = false;
    for (let i = PA.length - 1; i >= 0; i--) PA[i].live = false;
    G.state = 'play';
    show(el.menu, false); show(el.over, false); show(el.pause, false); show(el.hud, true);
    el.bestText.textContent = G.best;
    // optional: ?wave=7 jumps straight to a wave (boss every 5th)
    let jump = 0;
    try { jump = parseInt(new URLSearchParams(location.search).get('wave') || '0', 10) || 0; } catch (e) { }
    if (jump > 0) { G.wave = Math.max(0, jump - 1); G.waveTimer = 0.35; }
  }

  function togglePause(force) {
    if (G.state === 'play') {
      G.state = 'pause'; show(el.pause, true); Audio.setFire(0);
    } else if (G.state === 'pause' && force !== true) {
      G.state = 'play'; show(el.pause, false);
    }
  }

  function gameOver() {
    G.state = 'over';
    P.alive = false;
    G.slowmo = 1.6; G.shake = 26; G.flash = 0.9;
    Audio.S.nuke(); Audio.setFire(0);
    for (let i = 0; i < 60; i++) {
      fx(P.x, P.y, (Math.random() - 0.5) * 520, (Math.random() - 0.5) * 520,
        0.6 + Math.random() * 0.9, 16 + Math.random() * 30, Math.random() < 0.7 ? 0 : 1,
        { drag: 1.1, grav: -40, size1: 2 });
    }
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem('emberdead.best', String(G.best)); } catch (e) { }
      el.newBest.classList.remove('hidden');
    } else el.newBest.classList.add('hidden');
    el.fScore.textContent = G.score;
    el.fWave.textContent = G.wave;
    el.fKills.textContent = G.kills;
    el.fCombo.textContent = 'x' + G.bestCombo;
    setTimeout(() => { if (G.state === 'over') show(el.over, true); }, 850);
  }

  /* ---------------------------------------------------------
     9. WAVES
     --------------------------------------------------------- */
  function waveComp(w) {
    const list = [];
    if (w % 5 === 0) list.push('boss');
    const n = Math.min(72, 5 + Math.round(w * 2.7));
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      if (w >= 4 && r < 0.13) list.push('brute');
      else if (w >= 3 && r < 0.27) list.push('emberz');
      else if (w >= 2 && r < 0.46) list.push('runner');
      else if (w >= 3 && r < 0.55) list.push('spitter');
      else list.push('walker');
    }
    return list;
  }

  let queue = [], spawnT = 0, burst = 0;
  function startWave() {
    G.wave++;
    G.inWave = true;
    G.killsThisWave = 0;
    queue = waveComp(G.wave);
    spawnT = 0; burst = 3;
    const boss = G.wave % 5 === 0;
    if (boss) { Audio.S.boss(); G.shake = 16; }
    else Audio.S.wave();
    pop(vw / 2, vh * 0.24, boss ? 'WAVE ' + G.wave + ' — INFERNO BEHEMOTH' : 'WAVE ' + G.wave, boss ? '#ff5530' : '#ffd07a', boss ? 34 : 26, -14);
  }

  function spawnZombie(type) {
    const t = ZT[type];
    const m = 46;
    let x, y;
    const side = Math.random();
    if (side < 0.25) { x = -m; y = Math.random() * vh; }
    else if (side < 0.5) { x = vw + m; y = Math.random() * vh; }
    else if (side < 0.75) { x = Math.random() * vw; y = -m; }
    else { x = Math.random() * vw; y = vh + m; }
    const w = G.wave;
    const hpM = 1 + (w - 1) * 0.17;
    const spM = Math.min(1.7, 1 + (w - 1) * 0.035);
    const dmM = 1 + (w - 1) * 0.07;
    const z = {
      type: type, t: t, x: x, y: y, vx: 0, vy: 0,
      r: t.r * S, hp: t.hp * hpM * (type === 'boss' ? 1 + (w / 5 - 1) * 0.55 : 1),
      maxHp: 0, spd: t.spd * spM * S, dmg: t.dmg * dmM,
      atkCd: Math.random() * 0.6, flash: 0, burnT: 0, burnDps: 0,
      kbx: 0, kby: 0, stun: 0, bob: Math.random() * 6.28, wob: Math.random() * 6.28,
      slamT: t.boss ? 4 : 0, wave: t.boss ? 0 : 0, dead: false, grow: 0
    };
    z.maxHp = z.hp;
    z.grow = t.boss ? 0.4 : 1;
    zombies.push(z);
    return z;
  }

  /* ---------------------------------------------------------
     10. PLAYER ACTIONS
     --------------------------------------------------------- */
  function fireball() {
    if (G.state !== 'play' || P.cdFire > 0 || !P.alive) return;
    P.cdFire = 0.72;
    const a = P.angle;
    shots.push({
      x: P.x + Math.cos(a) * (P.r + 8), y: P.y + Math.sin(a) * (P.r + 8),
      vx: Math.cos(a) * 690, vy: Math.sin(a) * 690, r: 9 * S, life: 1.5, dmg: 40 * (1 + P.power * 0.4)
    });
    Audio.S.fireball();
    P.vx -= Math.cos(a) * 90; P.vy -= Math.sin(a) * 90;
    G.shake = Math.max(G.shake, 4);
    for (let i = 0; i < 14; i++) {
      const sa = a + (Math.random() - 0.5) * 0.9;
      const sp = 90 + Math.random() * 240;
      fx(P.x + Math.cos(a) * 16, P.y + Math.sin(a) * 16, Math.cos(sa) * sp, Math.sin(sa) * sp,
        0.22 + Math.random() * 0.2, 6 + Math.random() * 8, 0, { drag: 3 });
    }
  }

  function throwMolo() {
    if (G.state !== 'play' || P.cdMolo > 0 || !P.alive) return;
    P.cdMolo = 7.5;
    const a = P.angle;
    const d = Math.min(430, Math.max(150, 150 + 260 * (mouse.down ? 0.9 : 0.5)));
    const tx = P.x + Math.cos(a) * d, ty = P.y + Math.sin(a) * d;
    shots.push({ molotov: true, x: P.x, y: P.y, sx: P.x, sy: P.y, tx: tx, ty: ty, t: 0, dur: 0.5, life: 1, r: 6 * S, vx: 0, vy: 0, dmg: 0, spin: Math.random() * 6 });
    Audio.S.glass();
  }

  function dash() {
    if (G.state !== 'play' || P.cdDash > 0 || !P.alive) return;
    P.cdDash = 2.1; P.dashT = 0.19; P.inv = Math.max(P.inv, 0.3);
    let dx, dy;
    if (touch.active) { dx = touch.mx; dy = touch.my; }
    else {
      dx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
      dy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
    }
    if (!dx && !dy) { dx = Math.cos(P.angle); dy = Math.sin(P.angle); }
    const m = Math.hypot(dx, dy) || 1;
    P.dx = dx / m; P.dy = dy / m;
    Audio.S.dash();
  }

  function useNuke() {
    if (G.state !== 'play' || P.nuke <= 0 || P.cdNuke > 0 || !P.alive) return;
    P.nuke--; P.cdNuke = 26; P.inv = Math.max(P.inv, 1.6);
    Audio.S.nuke(); G.shake = 34; G.flash = 1; G.hitStop = 0.1;
    for (const z of zombies) {
      const d = Math.hypot(z.x - P.x, z.y - P.y);
      explosion(z.x, z.y, 1.5, 200, z);
    }
    for (let i = 0; i < 130; i++) {
      const a = Math.random() * 6.2832, sp = 200 + Math.random() * 800;
      fx(P.x, P.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.5 + Math.random(), 14 + Math.random() * 26, Math.random() < 0.8 ? 0 : 1,
        { drag: 1.2, size1: 2 });
    }
    pop(P.x, P.y - 40, 'INFERNO', '#ffe9a8', 40, -30);
  }

  /* ---------------------------------------------------------
     11. DAMAGE HELPERS
     --------------------------------------------------------- */
  function ignite(z, t, dps) {
    if (z.t.boss && z.burnT > 0) { z.burnT = Math.min(z.burnT + t, 2.2); return; }
    if (t > z.burnT) z.burnT = t;
    if (dps > z.burnDps) z.burnDps = dps;
  }

  function damageZ(z, amt, src, kb) {
    if (z.dead) return;
    let a = amt;
    if (z.burnT > 0) a *= 1.12;
    z.hp -= a;
    z.flash = 0.13;
    if (src === 'fire') { z.stun = Math.max(z.stun, 0.05); }
    if (kb) { z.kbx += kb; z.kby += kb; }
    if (z.hp <= 0) killZombie(z, src);
  }

  function killZombie(z, src) {
    if (z.dead) return;
    z.dead = true;
    G.kills++; G.killsThisWave++;
    const base = z.t.score * (1 + (G.wave - 1) * 0.08);
    const gained = Math.round(base * (1 + (G.combo - 1) * 0.12));
    G.score += gained;
    addCombo();

    const big = z.t.boss || z.type === 'brute';
    pop(z.x, z.y - z.r, '+' + gained, z.t.boss ? '#ffe9a8' : '#ffcf8f', big ? 24 : 15);

    Audio.S.die();
    if (z.t.boss) { Audio.S.nuke(); G.shake = 30; G.hitStop = 0.12; G.flash = 0.6; }
    else if (big) G.shake = Math.max(G.shake, 9);

    const n = z.t.boss ? 90 : big ? 34 : 16;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832, sp = (60 + Math.random() * (big ? 460 : 260));
      fx(z.x, z.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.35 + Math.random() * 0.5, 5 + Math.random() * 11,
        Math.random() < 0.72 ? 0 : 3, { drag: 2.2, size1: 1 });
    }
    for (let i = 0; i < 6; i++) {
      fx(z.x + (Math.random() - 0.5) * z.r, z.y + (Math.random() - 0.5) * z.r,
        (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40 - 20, 0.7 + Math.random() * 0.6,
        8 + Math.random() * 14, 1, { drag: 1.1, add: false, size1: 40 });
    }
    // scorch decal
    if (decals.length < 90) decals.push({ x: z.x, y: z.y, r: z.r * (1.5 + Math.random()), a: 0.32 });

    if (z.t.bomb) {
      explosion(z.x, z.y, 1.05, 130, null);
    }
    if (z.burnT > 0 || src === 'fire') {
      if (Math.random() < (big ? 0.9 : 0.42)) {
        pools.push(mkPool(z.x, z.y, 30 * S, 2.2, 14));
      }
    }
    // drops
    const r = Math.random();
    if (z.t.boss) { dropPickup(z.x, z.y, 'nuke'); dropPickup(z.x - 40, z.y, 'health'); dropPickup(z.x + 40, z.y, 'power'); }
    else if (r < 0.085) dropPickup(z.x, z.y, 'health');
    else if (r < 0.13) dropPickup(z.x, z.y, 'power');
    else if (r < 0.136 && G.wave >= 3) dropPickup(z.x, z.y, 'nuke');
  }

  function mkPool(x, y, r, life, dps) {
    return { x: x, y: y, r: r, life: life, max: life, dps: dps, tick: 0 };
  }

  function explosion(x, y, size, dmg, direct) {
    Audio.S.boom(size);
    G.shake = Math.max(G.shake, 8 * size);
    for (let i = 0; i < 26 * size; i++) {
      const a = Math.random() * 6.2832, sp = 70 + Math.random() * 420 * size;
      fx(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.28 + Math.random() * 0.45,
        8 + Math.random() * 20 * size, Math.random() < 0.78 ? 0 : 1, { drag: 2.4, size1: 2 });
    }
    for (let i = 0; i < 5; i++) {
      fx(x, y, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, 0.8, 14 + Math.random() * 20, 1, { drag: 1, add: false, size1: 70 });
    }
    for (const z of zombies) {
      if (z.dead) continue;
      const d = Math.hypot(z.x - x, z.y - y);
      if (d < 110 * size) {
        const f = 1 - d / (110 * size);
        damageZ(z, dmg * (0.45 + 0.55 * f), 'fire', (z === direct ? 340 : 190) * f / Math.max(0.4, z.t.kb));
        ignite(z, 1.6, 26);
      }
    }
    for (const p of pools) { if (Math.hypot(p.x - x, p.y - y) < 90) p.life = Math.min(p.max, p.life + 0.6); }
    const pd = Math.hypot(P.x - x, P.y - y);
    if (pd < 62 * size && P.inv <= 0) hurtPlayer(dmg * 0.32, x, y);
  }

  function addCombo() {
    G.combo++;
    G.comboT = G.comboGrace;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    if (G.combo >= 6 && !G.slowmo) { G.slowmo = 1.1; G.flash = Math.max(G.flash, 0.28); }
    if (G.combo % 5 === 0) pop(P.x, P.y - 46, 'x' + G.combo + ' INFERNO', '#ffd166', 22, -30);
    el.comboX.style.transform = 'scale(' + (1 + Math.min(0.5, G.combo * 0.035)) + ')';
  }

  function hurtPlayer(amt, fromX, fromY) {
    if (P.inv > 0 || !P.alive || G.state !== 'play') return;
    let a = amt;
    if (P.shield > 0) {
      const used = Math.min(P.shield, a);
      P.shield -= used; a -= used;
      P.shieldT = 0;
    }
    P.hp -= a;
    P.inv = 0.42; P.hurtT = 0.35;
    G.shake = Math.max(G.shake, 11); G.flash = Math.max(G.flash, 0.5);
    Audio.S.hurt();
    const a2 = Math.atan2(P.y - fromY, P.x - fromX);
    P.vx += Math.cos(a2) * 220; P.vy += Math.sin(a2) * 220;
    pop(P.x, P.y - 34, '-' + Math.round(amt), '#ff6a5a', 17);
    if (P.hp <= 0) { P.hp = 0; gameOver(); }
  }

  function dropPickup(x, y, kind) {
    pickups.push({ x: x, y: y, kind: kind, life: 16, t: Math.random() * 6.28, vy: -20 });
    Audio.S.pickup(kind !== 'health');
  }

  /* ---------------------------------------------------------
     12. UPDATE
     --------------------------------------------------------- */
  function nearestZombie(x, y) {
    let best = null, bd = 1e9;
    for (const z of zombies) {
      if (z.dead) continue;
      const d = (z.x - x) * (z.x - x) + (z.y - y) * (z.y - y);
      if (d < bd) { bd = d; best = z; }
    }
    return best;
  }

  function updatePlayer(dt) {
    // aim
    if (isTouch || !P.hasMouse) {
      const n = nearestZombie(P.x, P.y);
      if (n) P.angle = Math.atan2(n.y - P.y, n.x - P.x);
    } else {
      P.angle = Math.atan2(mouse.y - P.y, mouse.x - P.x);
    }

    // move
    let dx = 0, dy = 0;
    if (touch.active) { dx = touch.mx; dy = touch.my; }
    else {
      dx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
      dy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
    }
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    if (P.dashT > 0) {
      P.dashT -= dt;
      P.vx = P.dx * 900; P.vy = P.dy * 900;
      // dash fire trail
      if (Math.random() < 0.9) {
        fx(P.x, P.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 0.34, 12 + Math.random() * 14, 0, { drag: 2, size1: 1 });
      }
      for (const z of zombies) {
        if (z.dead) continue;
        if (Math.hypot(z.x - P.x, z.y - P.y) < z.r + P.r + 16) damageZ(z, 70 * dt, 'fire', 0);
      }
      if (G.shake < 3) G.shake = 3;
    } else {
      const acc = 12;
      P.vx += (dx * P.speed - P.vx) * Math.min(1, acc * dt);
      P.vy += (dy * P.speed - P.vy) * Math.min(1, acc * dt);
    }
    P.x += P.vx * dt; P.y += P.vy * dt;
    const mrg = P.r;
    if (P.x < mrg) { P.x = mrg; P.vx *= 0.4; }
    if (P.x > vw - mrg) { P.x = vw - mrg; P.vx *= 0.4; }
    if (P.y < mrg) { P.y = mrg; P.vy *= 0.4; }
    if (P.y > vh - mrg) { P.y = vh - mrg; P.vy *= 0.4; }

    // timers
    P.cdFire = Math.max(0, P.cdFire - dt);
    P.cdMolo = Math.max(0, P.cdMolo - dt);
    P.cdDash = Math.max(0, P.cdDash - dt);
    P.cdNuke = Math.max(0, P.cdNuke - dt);
    P.inv = Math.max(0, P.inv - dt);
    P.hurtT = Math.max(0, P.hurtT - dt);
    if (P.powerT > 0) { P.powerT -= dt; if (P.powerT <= 0) P.power = 0; }

    // shield regen
    if (P.shield < P.maxShield) {
      P.shieldT += dt;
      if (P.shieldT > 4.2) P.shield = Math.min(P.maxShield, P.shield + 22 * dt);
    } else P.shieldT = 0;

    // out-of-combat regen
    if (G.comboT <= 0 && P.hp < P.maxHp && P.shield >= P.maxShield) {
      P.hp = Math.min(P.maxHp, P.hp + 2.6 * dt);
    }

    // passive ember aura
    const auraR = 76 * S;
    for (const z of zombies) {
      if (z.dead) continue;
      if (Math.hypot(z.x - P.x, z.y - P.y) < auraR + z.r) {
        damageZ(z, 11 * dt, 'fire', 0);
        ignite(z, 0.7, 20);
      }
    }
    if (Math.random() < 0.16 + (m > 0.2 ? 0.2 : 0)) {
      const a = Math.random() * 6.2832, r = 20 + Math.random() * 14;
      fx(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, Math.cos(a) * 18, Math.sin(a) * 18 - 20,
        0.45, 5 + Math.random() * 6, 0, { drag: 1.2, size1: 0 });
    }

    // FLAMETHROWER
    const firing = mouse.down || (isTouch && mouse.down);
    if (firing && P.alive) {
      const range = 186 * S, half = 0.44, dps = 108 * (1 + P.power);
      let hittable = 0;
      for (const z of zombies) {
        if (z.dead) continue;
        const dx2 = z.x - P.x, dy2 = z.y - P.y;
        const dd = Math.hypot(dx2, dy2);
        if (dd > range + z.r || dd < 1) continue;
        let da = Math.atan2(dy2, dx2) - P.angle;
        while (da > Math.PI) da -= 6.2832;
        while (da < -Math.PI) da += 6.2832;
        if (Math.abs(da) > half) continue;
        hittable++;
        damageZ(z, dps * dt, 'fire', 26 * dt / z.t.kb);
        ignite(z, 1.3, 24);
        if (Math.random() < 0.35) {
          const t2 = Math.random();
          fx(z.x + (Math.random() - 0.5) * z.r, z.y + (Math.random() - 0.5) * z.r,
            (Math.random() - 0.5) * 40, -30 - Math.random() * 40, 0.3 + Math.random() * 0.3, 5 + Math.random() * 7, 0, { drag: 1.4 });
        }
      }
      // flame cone particles
      const cnt = (hittable > 0 ? 4 : 2);
      for (let i = 0; i < cnt; i++) {
        const a = P.angle + (Math.random() - 0.5) * (half * 1.9);
        const sp = 260 + Math.random() * 420;
        const life = range / sp * (0.55 + Math.random() * 0.5);
        fx(P.x + Math.cos(a) * (P.r + 4), P.y + Math.sin(a) * (P.r + 4),
          Math.cos(a) * sp, Math.sin(a) * sp, life, 16 + Math.random() * 16, 0,
          { drag: 0.6, size1: 3 });
      }
      if (Math.random() < 0.35) {
        const a = P.angle + (Math.random() - 0.5) * half;
        fx(P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60, (Math.random() - 0.5) * 30, -60, 0.6, 8, 1, { drag: 1, add: false, size1: 34 });
      }
      Audio.setFire(1);
    } else Audio.setFire(0);
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      if (s.molotov) {
        s.t += dt;
        const k = Math.min(1, s.t / s.dur);
        s.x = s.sx + (s.tx - s.sx) * k;
        s.y = s.sy + (s.ty - s.sy) * k;
      } else {
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.life -= dt;
        if (Math.random() < 0.85) {
          fx(s.x - s.vx * dt * 0.4, s.y - s.vy * dt * 0.4, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40,
            0.22, 9 + Math.random() * 9, 0, { drag: 2, size1: 0 });
        }
      }
      if (s.molotov) {
        if (Math.random() < 0.7) fx(s.x, s.y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.25, 4, 4, { drag: 1 });
        if (s.t >= s.dur) {
          const p = mkPool(s.x, s.y, 84 * S, 4.6, 30);
          pools.push(p);
          for (let k = 0; k < 26; k++) {
            const a = Math.random() * 6.2832, sp = 60 + Math.random() * 300;
            fx(s.x, s.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.4 + Math.random() * 0.4, 8 + Math.random() * 14, Math.random() < 0.5 ? 0 : 3, { drag: 2.4 });
          }
          explosion(s.x, s.y, 0.55, 26, null);
          shots.splice(i, 1);
        }
        continue;
      }
      // fireball collision
      let done = false;
      for (const z of zombies) {
        if (z.dead) continue;
        if (Math.hypot(z.x - s.x, z.y - s.y) < z.r + s.r) {
          explodeShot(s, z);
          done = true;
          break;
        }
      }
      if (done || s.life <= 0 || s.x < -60 || s.x > vw + 60 || s.y < -60 || s.y > vh + 60) {
        if (!done) explodeShot(s, null);
        shots.splice(i, 1);
      }
    }

    function explodeShot(s, direct) {
      explosion(s.x, s.y, 0.62, s.dmg, direct);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * 6.2832, sp = 60 + Math.random() * 300;
        fx(s.x, s.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.2 + Math.random() * 0.2, 7 + Math.random() * 10, 0, { drag: 2, size1: 1 });
      }
    }
  }

  function updateEbolts(dt) {
    for (let i = ebolts.length - 1; i >= 0; i--) {
      const b = ebolts[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (Math.random() < 0.5) fx(b.x, b.y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.25, 6, 0, { drag: 2 });
      if (Math.hypot(b.x - P.x, b.y - P.y) < P.r + b.r) {
        hurtPlayer(b.dmg, b.x, b.y);
        explosion(b.x, b.y, 0.4, 0, null);
        ebolts.splice(i, 1);
        continue;
      }
      if (b.life <= 0 || b.x < -40 || b.x > vw + 40 || b.y < -40 || b.y > vh + 40) ebolts.splice(i, 1);
    }
  }

  function updatePools(dt) {
    for (let i = pools.length - 1; i >= 0; i--) {
      const p = pools[i];
      p.life -= dt;
      p.tick -= dt;
      if (p.tick <= 0) {
        p.tick = 0.045;
        for (let k = 0; k < 2; k++) {
          const a = Math.random() * 6.2832, r = Math.random() * p.r;
          fx(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.62, (Math.random() - 0.5) * 20, -50 - Math.random() * 60,
            0.45 + Math.random() * 0.4, 9 + Math.random() * 12, 0, { drag: 1.1, size1: 2 });
        }
        if (Math.random() < 0.25) {
          fx(p.x + (Math.random() - 0.5) * p.r, p.y + (Math.random() - 0.5) * p.r * 0.6,
            (Math.random() - 0.5) * 20, -30, 0.9, 12, 1, { drag: 1, add: false, size1: 40 });
        }
      }
      for (const z of zombies) {
        if (z.dead) continue;
        const dx2 = (z.x - p.x) / p.r, dy2 = (z.y - p.y) / (p.r * 0.72);
        if (dx2 * dx2 + dy2 * dy2 < 1) {
          damageZ(z, p.dps * dt, 'fire', 8 * dt);
          ignite(z, 0.5, 16);
        }
      }
      if (p.life <= 0) pools.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const u = pickups[i];
      u.life -= dt; u.t += dt;
      const dx = P.x - u.x, dy = P.y - u.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 130) { u.x += dx / d * 190 * dt; u.y += dy / d * 190 * dt; }
      u.y += Math.sin(u.t * 3) * 12 * dt;
      if (d < P.r + 16) {
        if (u.kind === 'health') {
          if (P.hp < P.maxHp) { P.hp = Math.min(P.maxHp, P.hp + 32); pop(P.x, P.y - 30, '+32', '#7dffa0', 18); }
          else { P.shield = P.maxShield; pop(P.x, P.y - 30, 'SHIELD', '#9ef0ff', 15); }
        } else if (u.kind === 'power') {
          P.power = 1; P.powerT = 9; pop(P.x, P.y - 30, 'OVERBURN', '#ff9adf', 16);
        } else {
          P.nuke = Math.min(3, P.nuke + 1); P.cdNuke = 0;
          pop(P.x, P.y - 30, 'INFERNO READY [Q]', '#ffe9a8', 16);
        }
        Audio.S.pickup(u.kind !== 'health');
        pickups.splice(i, 1);
        continue;
      }
      if (u.life <= 0) pickups.splice(i, 1);
    }
  }

  function updateZombies(dt) {
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (z.dead) { zombies.splice(i, 1); continue; }
      z.bob += dt * (z.t.boss ? 4 : 7);
      z.wob += dt * 2;
      z.flash = Math.max(0, z.flash - dt);
      z.stun = Math.max(0, z.stun - dt);

      // burn
      if (z.burnT > 0) {
        z.burnT -= dt;
        z.hp -= z.burnDps * dt;
        if (Math.random() < (z.t.boss ? 0.25 : 0.6)) {
          fx(z.x + (Math.random() - 0.5) * z.r * 1.6, z.y + (Math.random() - 0.5) * z.r * 1.6 - z.r * 0.3,
            (Math.random() - 0.5) * 30, -70 - Math.random() * 50, 0.3 + Math.random() * 0.3, 6 + Math.random() * 10, 0, { drag: 1.3 });
        }
        if (z.hp <= 0) { killZombie(z, 'fire'); continue; }
      }
      if (z.burnT <= 0) z.burnDps = 0;

      const dx = P.x - z.x, dy = P.y - z.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;

      // separation from other zombies
      let sx = 0, sy = 0;
      for (let j = 0; j < zombies.length; j++) {
        if (j === i) continue;
        const o = zombies[j];
        const ox = z.x - o.x, oy = z.y - o.y;
        const od = Math.hypot(ox, oy);
        const want = (z.r + o.r) * 0.86;
        if (od < want && od > 0.01) {
          const f = (want - od) / want;
          sx += ox / od * f; sy += oy / od * f;
        }
      }

      const atkRange = z.r + P.r - 4;
      let mv = z.stun > 0 ? 0.1 : 1;
      if (z.t.ranged) {
        // spitter: keep distance then shoot
        if (d < 220) mv = -0.55;
        else if (d < 330) mv = 0.1;
        z.atkCd -= dt;
        if (z.atkCd <= 0 && d < 430) {
          z.atkCd = z.t.atk / (1 + (G.wave - 1) * 0.03);
          const a = Math.atan2(dy, dx);
          ebolts.push({ x: z.x + ux * z.r, y: z.y + uy * z.r, vx: ux * 250, vy: uy * 250, r: 7 * S, life: 3.4, dmg: 11 * (1 + (G.wave - 1) * 0.07) });
          Audio.S.growl(1.4);
        }
      } else if (d > atkRange) {
        mv = 1;
      } else {
        z.atkCd -= dt;
        if (z.atkCd <= 0) {
          z.atkCd = z.t.atk;
          hurtPlayer(z.dmg, z.x, z.y);
          if (z.type !== 'boss') Audio.S.growl(0.7);
        }
        mv = 0.12;
      }

      if (z.t.boss) updateBoss(z, dt, d, ux, uy);

      const sp = z.spd * mv;
      z.vx = ux * sp + sx * 190;
      z.vy = uy * sp + sy * 190;
      z.x += (z.vx + z.kbx) * dt;
      z.y += (z.vy + z.kby) * dt;
      const kf = Math.max(0, 1 - 9 * dt);
      z.kbx *= kf; z.kby *= kf;
    }
  }

  function updateBoss(z, dt, d, ux, uy) {
    z.wave -= dt;
    if (z.wave <= 0) {
      z.wave = 5.5;
      // radial fire nova
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.2832 + Math.random() * 0.1;
        ebolts.push({ x: z.x + Math.cos(a) * z.r, y: z.y + Math.sin(a) * z.r, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, r: 9 * S, life: 3, dmg: 14, nova: true });
      }
      Audio.S.boom(1.3);
      G.shake = Math.max(G.shake, 14);
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * 6.2832, sp = 100 + Math.random() * 320;
        fx(z.x, z.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.4 + Math.random() * 0.4, 12 + Math.random() * 18, 0, { drag: 2.2 });
      }
      // summons
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * 6.2832;
        const nz = spawnZombie(i === 3 ? 'brute' : 'runner');
        nz.x = z.x + Math.cos(a) * 90; nz.y = z.y + Math.sin(a) * 90;
      }
      pop(z.x, z.y - z.r - 10, 'NOVA', '#ff5530', 20);
    }
    z.slamT -= dt;
    if (z.slamT <= 0 && d < z.r + P.r + 40) {
      z.slamT = z.t.atk;
      G.shake = Math.max(G.shake, 12);
      explosion(z.x, z.y, 1.25, 0, null);
      pop(z.x, z.y - z.r - 20, 'SLAM', '#ff8a4a', 22);
    }
  }

  function updateWave(dt) {
    if (!G.inWave) {
      G.waveTimer -= dt;
      el.waveInfo.textContent = 'NEXT WAVE ' + Math.max(0, G.waveTimer).toFixed(1) + 's';
      el.waveInfo.className = 'wave-info calm';
      if (G.waveTimer <= 0) startWave();
      return;
    }
    el.waveInfo.className = 'wave-info';
    el.waveInfo.textContent = 'KURNED ' + G.killsThisWave + '/' + (G.killsThisWave + queue.length);
    if (queue.length === 0 && zombies.length === 0) {
      G.inWave = false;
      G.waveTimer = 6.5;
      const bonus = 250 * G.wave;
      G.score += bonus;
      pop(vw / 2, vh * 0.3, 'WAVE CLEAR  +' + bonus, '#8bff9e', 24, -18);
      Audio.S.wave();
    }
  }

  function updateCombo(dt) {
    if (G.combo > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) { G.combo = 0; el.comboWrap.classList.add('hidden'); }
      else {
        el.comboFill.style.transform = 'scaleX(' + (G.comboT / G.comboGrace) + ')';
      }
    }
  }

  /* ---------------------------------------------------------
     13. RENDER
     --------------------------------------------------------- */
  function bg() {
    const g = ctx.createRadialGradient(vw / 2, vh / 2, 40, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
    g.addColorStop(0, '#1b0d10');
    g.addColorStop(0.55, '#100709');
    g.addColorStop(1, '#060406');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);
    if (floor) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(floor, 0, 0, vw, vh);
      ctx.globalAlpha = 1;
    }
  }

  function drawPools() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of pools) {
      const t = p.life / p.max;
      const a = Math.min(1, t * 2.4) * 0.55;
      const r = p.r * (0.9 + 0.1 * Math.sin(G.time * 6));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, 'rgba(255,220,140,' + (a * 0.9) + ')');
      g.addColorStop(0.4, 'rgba(255,120,30,' + (a * 0.55) + ')');
      g.addColorStop(1, 'rgba(180,40,0,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.72);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawDecals() {
    ctx.save();
    for (const dcl of decals) {
      const g = ctx.createRadialGradient(dcl.x, dcl.y, 0, dcl.x, dcl.y, dcl.r);
      g.addColorStop(0, 'rgba(20,10,8,' + dcl.a + ')');
      g.addColorStop(1, 'rgba(20,10,8,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(dcl.x, dcl.y, dcl.r, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  function drawPickups() {
    for (const u of pickups) {
      const t = u.t;
      const y = u.y + Math.sin(t * 3) * 4;
      const fade = u.life < 3 ? (Math.sin(u.life * 14) > -0.2 ? 1 : 0.25) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      const col = u.kind === 'health' ? '#5cff8a' : u.kind === 'power' ? '#ff6ad5' : '#ffd166';
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(u.x, y, 0, u.x, y, 26);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = fade * 0.5;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(u.x, y, 26, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#12080a';
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      const s = 9;
      ctx.save();
      ctx.translate(u.x, y);
      ctx.rotate(Math.sin(t * 2) * 0.15);
      if (u.kind === 'health') {
        ctx.fillRect(-s, -3, s * 2, 6); ctx.fillRect(-3, -s, 6, s * 2);
      } else if (u.kind === 'power') {
        ctx.beginPath();
        ctx.moveTo(1, -11); ctx.lineTo(-6, 2); ctx.lineTo(-1, 2); ctx.lineTo(-2, 11); ctx.lineTo(6, -2); ctx.lineTo(1, -2);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, 6.2832); ctx.fill();
        ctx.fillStyle = col; ctx.fillRect(-1.5, -5, 3, 7); ctx.fillRect(-4, 3, 8, 3);
      }
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.restore();
      ctx.restore();
    }
  }

  function drawZombie(z) {
    const t = z.t;
    const burn = z.burnT > 0;
    const sq = 1 + Math.sin(z.bob) * 0.045;
    ctx.save();
    ctx.translate(z.x, z.y);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.ellipse(0, z.r * 0.55, z.r * 0.95, z.r * 0.4, 0, 0, 6.2832); ctx.fill();

    ctx.rotate(Math.atan2(P.y - z.y, P.x - z.x));
    // body
    ctx.scale(sq, 1 / sq);
    const base = t.col;
    ctx.fillStyle = z.flash > 0 ? '#ffffff' : base;
    ctx.beginPath();
    ctx.arc(0, 0, z.r, 0, 6.2832);
    ctx.fill();
    // darker rim
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(1.5, z.r * 0.12);
    ctx.stroke();
    // inner shading
    const gg = ctx.createRadialGradient(-z.r * 0.3, -z.r * 0.35, z.r * 0.1, 0, 0, z.r);
    gg.addColorStop(0, 'rgba(255,255,255,0.22)');
    gg.addColorStop(0.6, 'rgba(0,0,0,0)');
    gg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(0, 0, z.r, 0, 6.2832); ctx.fill();
    // arms
    ctx.strokeStyle = z.flash > 0 ? '#fff' : base;
    ctx.lineWidth = Math.max(2.5, z.r * 0.22);
    ctx.lineCap = 'round';
    const sw = Math.sin(z.bob * 1.3) * 0.3;
    ctx.beginPath();
    ctx.moveTo(z.r * 0.1, -z.r * 0.7); ctx.lineTo(z.r * 0.85 + z.r * 0.2 * sw, -z.r * 0.95);
    ctx.moveTo(z.r * 0.1, z.r * 0.7); ctx.lineTo(z.r * 0.85 - z.r * 0.2 * sw, z.r * 0.95);
    ctx.stroke();
    // eyes
    const ec = burn ? '#fff2c0' : '#ff2d2d';
    ctx.fillStyle = ec;
    const er = Math.max(1.6, z.r * 0.14);
    ctx.shadowColor = ec; ctx.shadowBlur = burn ? 14 : 8;
    ctx.beginPath();
    ctx.arc(z.r * 0.34, -z.r * 0.28, er, 0, 6.2832);
    ctx.arc(z.r * 0.34, z.r * 0.28, er, 0, 6.2832);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    if (burn) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g2 = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r * 1.5);
      g2.addColorStop(0, 'rgba(255,160,50,0.35)');
      g2.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 1.5, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    // hp bar
    if (t.boss) {
      const w = 200, h = 9, x = z.x - w / 2, y = z.y - z.r - 30;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      const f = Math.max(0, z.hp / z.maxHp);
      const g3 = ctx.createLinearGradient(x, 0, x + w, 0);
      g3.addColorStop(0, '#ff2d0a'); g3.addColorStop(0.6, '#ff8a1f'); g3.addColorStop(1, '#ffe08a');
      ctx.fillStyle = g3;
      ctx.fillRect(x, y, w * f, h);
      ctx.fillStyle = '#fff';
      ctx.font = '700 11px Segoe UI, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.label, z.x, y - 6);
    } else if (t.brute || z.hp < z.maxHp) {
      const w = z.r * 1.8, f = Math.max(0, z.hp / z.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(z.x - w / 2, z.y - z.r - 10, w, 4);
      ctx.fillStyle = f > 0.5 ? '#ff6a2a' : '#ff2d2d';
      ctx.fillRect(z.x - w / 2, z.y - z.r - 10, w * f, 4);
    }
  }

  function drawPlayer() {
    const a = P.angle;
    ctx.save();
    ctx.translate(P.x, P.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(0, P.r * 0.6, P.r * 1.05, P.r * 0.42, 0, 0, 6.2832); ctx.fill();
    // ground ring marker
    ctx.strokeStyle = 'rgba(255,150,60,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, P.r * 0.45, P.r * 1.5, P.r * 0.6, 0, 0, 6.2832); ctx.stroke();
    // aura glow
    ctx.globalCompositeOperation = 'lighter';
    const ar = 76 * S;
    const g = ctx.createRadialGradient(0, 0, ar * 0.35, 0, 0, ar);
    g.addColorStop(0, 'rgba(255,150,50,0.16)');
    g.addColorStop(0.7, 'rgba(255,90,20,0.08)');
    g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, ar, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.rotate(a);
    // body
    const hurt = P.hurtT > 0;
    ctx.fillStyle = hurt ? '#ffd9c0' : '#160c10';
    ctx.beginPath(); ctx.arc(0, 0, P.r, 0, 6.2832); ctx.fill();
    // shoulder tanks (behind body outline)
    ctx.fillStyle = hurt ? '#fff' : '#4a2c30';
    ctx.fillRect(-P.r * 0.45, -P.r * 1.02, P.r * 0.55, P.r * 0.36);
    ctx.fillRect(-P.r * 0.45, P.r * 0.66, P.r * 0.55, P.r * 0.36);
    // strong rim so the silhouette always reads
    ctx.strokeStyle = hurt ? '#ffffff' : '#ffb04a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6a10'; ctx.shadowBlur = P.hurtT > 0 ? 28 : 16;
    ctx.beginPath(); ctx.arc(0, 0, P.r, 0, 6.2832); ctx.stroke();
    ctx.shadowBlur = 0;
    // inner ember core
    const cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, P.r);
    cg.addColorStop(0, 'rgba(255,240,200,0.95)');
    cg.addColorStop(0.3, 'rgba(255,150,40,0.62)');
    cg.addColorStop(1, 'rgba(90,20,0,0.25)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(0, 0, P.r * 0.9, 0, 6.2832); ctx.fill();
    // visor / nozzle
    ctx.fillStyle = '#0b0708';
    ctx.fillRect(P.r * 0.22, -P.r * 0.44, P.r * 0.7, P.r * 0.88);
    ctx.strokeStyle = 'rgba(255,190,120,0.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(P.r * 0.22, -P.r * 0.44, P.r * 0.7, P.r * 0.88);
    ctx.fillStyle = P.cdFire > 0.2 ? '#7a3a10' : '#ffe08a';
    ctx.beginPath(); ctx.arc(P.r * 0.8, 0, 3.6, 0, 6.2832); ctx.fill();
    ctx.restore();

    // flame cone preview
    if (mouse.down) {
      const range = 186 * S, half = 0.44;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(P.x, P.y); ctx.rotate(a);
      const cg2 = ctx.createRadialGradient(0, 0, P.r * 0.5, 0, 0, range);
      cg2.addColorStop(0, 'rgba(255,235,180,0.42)');
      cg2.addColorStop(0.35, 'rgba(255,140,30,0.26)');
      cg2.addColorStop(1, 'rgba(200,40,0,0)');
      ctx.fillStyle = cg2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, range, -half, half);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (P.inv > 0 && !P.hurtT) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(G.time * 40) * 0.2;
      ctx.strokeStyle = '#9ef0ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(P.x, P.y, P.r + 6, 0, 6.2832); ctx.stroke();
      ctx.restore();
    }
  }

  function drawShots() {
    for (const s of shots) {
      if (s.molotov) {
        const k = s.t / s.dur;
        const lift = Math.sin(k * Math.PI) * 46;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 7, 3, 0, 0, 6.2832); ctx.fill();
        ctx.translate(s.x, s.y - lift);
        ctx.rotate(s.spin + k * 9);
        ctx.fillStyle = '#4a7a2a';
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,180,80,0.9)';
        ctx.fillRect(-2.5, -8, 5, 4);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(s.vy, s.vx));
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
        g.addColorStop(0, 'rgba(255,255,235,1)');
        g.addColorStop(0.28, 'rgba(255,180,60,0.85)');
        g.addColorStop(0.6, 'rgba(255,70,10,0.35)');
        g.addColorStop(1, 'rgba(180,20,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 26, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,210,0.9)';
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
      }
    }
    for (const b of ebolts) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = b.nova ? '255,90,20' : '120,220,255';
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 20);
      g.addColorStop(0, 'rgba(' + col + ',0.95)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, 20, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
  }

  function drawPops() {
    ctx.save();
    ctx.textAlign = 'center';
    for (const p of pops) {
      const t = p.life / p.max;
      ctx.globalAlpha = Math.min(1, t * 2.5);
      ctx.font = '900 ' + p.s * (0.85 + t * 0.15) + 'px Segoe UI, system-ui, sans-serif';
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = 'rgba(20,6,4,0.85)';
      ctx.strokeText(p.t, p.x, p.y);
      ctx.fillStyle = p.c;
      ctx.fillText(p.t, p.x, p.y);
    }
    ctx.restore();
  }

  function ambient(dt) {
    // drifting embers
    if (Math.random() < dt * 42) {
      fx(Math.random() * vw, vh + 10, (Math.random() - 0.5) * 22, -(20 + Math.random() * 60),
        2.4 + Math.random() * 3.2, 1.6 + Math.random() * 3.4, 4, { drag: 0.25, size1: 0.4 });
    }
  }

  /* ---------------------------------------------------------
     14. HUD SYNC
     --------------------------------------------------------- */
  let lastWave = -1;
  function syncHUD() {
    const hf = Math.max(0, P.hp / P.maxHp);
    el.hpFill.style.transform = 'scaleX(' + hf + ')';
    el.hpGhost.style.transform = 'scaleX(' + hf + ')';
    el.hpText.textContent = Math.ceil(P.hp) + (P.shield > 1 ? ' +' + Math.ceil(P.shield) : '');
    el.auraFill.style.transform = 'scaleX(' + Math.max(0, P.shield / P.maxShield) + ')';
    el.scoreText.textContent = G.score;
    el.waveText.textContent = G.wave;
    if (G.combo > 1) {
      el.comboWrap.classList.remove('hidden');
      el.comboX.textContent = 'x' + G.combo;
    } else el.comboWrap.classList.add('hidden');
    ab(el.abFire, P.cdFire, 0.72);
    ab(el.abMolo, P.cdMolo, 7.5);
    ab(el.abDash, P.cdDash, 2.1);
    abNuke();
    el.flash.style.opacity = Math.min(0.9, G.flash);
    if (G.wave !== lastWave) {
      lastWave = G.wave;
      el.threat.textContent = G.wave === 0 ? '' :
        (G.wave % 5 === 0 ? 'BEHEMOTH INBOUND' : G.wave >= 4 ? 'THREAT: ELEVATED' : G.wave >= 2 ? 'THREAT: RISING' : 'THREAT: LOW');
    }
  }
  function ab(node, cd, max) {
    const f = cd / max;
    node.querySelector('.ab-cd').style.transform = 'scaleY(' + f.toFixed(3) + ')';
    node.classList.toggle('ready', cd <= 0.001);
  }
  function abNuke() {
    const node = el.abNuke;
    const has = P.nuke > 0;
    const f = has ? 0 : (P.cdNuke / 26);
    node.querySelector('.ab-cd').style.transform = 'scaleY(' + Math.min(1, f).toFixed(3) + ')';
    node.classList.toggle('ready', has);
    node.querySelector('.ab-name').textContent = has ? 'INFERNO x' + P.nuke : 'INFERNO';
    node.querySelector('.ab-key').textContent = has ? 'Q' : '—';
  }

  /* ---------------------------------------------------------
     15. MAIN LOOP
     --------------------------------------------------------- */
  let last = performance.now();
  function frame(now) {
    let rdt = (now - last) / 1000;
    last = now;
    if (rdt > 0.05) rdt = 0.05;

    G.time += rdt;
    Audio.musicTick();

    if (G.state === 'play') {
      // spawning
      if (G.inWave) {
        spawnT -= rdt;
        while (queue.length && burst > 0) { spawnZombie(queue.shift()); burst--; }
        if (queue.length && spawnT <= 0) {
          spawnZombie(queue.shift());
          const every = Math.max(0.24, 0.95 - G.wave * 0.035);
          spawnT = every * (0.6 + Math.random() * 0.8);
        }
      }
    }

    // time dilation
    let ts = 1;
    if (G.slowmo > 0) { G.slowmo -= rdt; ts = 0.42; }
    if (G.hitStop > 0) { G.hitStop -= rdt; ts = 0.05; }
    const dt = rdt * ts;

    if (G.state === 'play' || G.state === 'over') {
      if (G.state === 'play') {
        updatePlayer(dt);
        updateWave(dt);
        updateCombo(dt);
      }
      updateZombies(dt);
      updateShots(dt);
      updateEbolts(dt);
      updatePools(dt);
      updatePickups(dt);
      updateParticles(dt);
      ambient(rdt);
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.life -= rdt;
        p.y += p.vy * rdt;
        p.vy *= 0.94;
        if (p.life <= 0) pops.splice(i, 1);
      }
    } else {
      // menu / pause background life
      ambient(rdt * 0.6);
      updateParticles(rdt);
    }

    G.shake = Math.max(0, G.shake - rdt * 42);
    G.flash = Math.max(0, G.flash - rdt * 2.4);

    /* ---- draw ---- */
    ctx.save();
    if (G.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    bg();
    drawDecals();
    drawPools();
    drawPickups();
    for (const z of zombies) drawZombie(z);
    drawShots();
    drawParticles();
    if (P.alive) drawPlayer();
    drawPops();
    ctx.restore();

    if (G.state === 'play' || G.state === 'pause' || G.state === 'over') syncHUD();
    else el.flash.style.opacity = 0;

    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     16. GO
     --------------------------------------------------------- */
  el.bestText.textContent = G.best;
  show(el.menu, true);
  requestAnimationFrame(frame);
})();
