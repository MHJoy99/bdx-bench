import * as THREE from "three";

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const positiveMod = (n, m) => ((n % m) + m) % m;
const randRange = (rng, a, b) => a + (b - a) * rng();

const renderer = new THREE.WebGLRenderer({
  canvas: $("c"),
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.24;
renderer.setClearColor(0x02040c, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030716, 0.00072);
const camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 2400);
camera.position.set(0, 6, 28);
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight(0x9bdaff, 0x06081c, 1.85));
const keyLight = new THREE.DirectionalLight(0xc5e9ff, 2.2);
keyLight.position.set(-80, 140, 60);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x286cff, 280, 340, 2);
rimLight.position.set(-55, 28, -120);
scene.add(rimLight);
const warmLight = new THREE.PointLight(0xff6c2d, 230, 250, 2);
warmLight.position.set(120, -18, -20);
scene.add(warmLight);

const world = new THREE.Group();
scene.add(world);
const trackWorld = new THREE.Group();
world.add(trackWorld);

function seeded(seed) {
  let value = seed | 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) | 0;
    return (value >>> 0) / 4294967296;
  };
}
const rng = seeded(74017);

const pathPoints = [
  new THREE.Vector3(-4, -1, 142),
  new THREE.Vector3(74, 13, 100),
  new THREE.Vector3(126, -2, 20),
  new THREE.Vector3(105, 24, -75),
  new THREE.Vector3(35, 5, -145),
  new THREE.Vector3(-60, 21, -154),
  new THREE.Vector3(-132, -8, -75),
  new THREE.Vector3(-116, -20, 25),
  new THREE.Vector3(-64, 8, 115),
];
const curve = new THREE.CatmullRomCurve3(pathPoints, true, "centripetal", 0.48);
const TRACK_LENGTH = curve.getLength();
const TRACK_FLOOR = -4.85;
const TRACK_RADIUS = 9.35;
const frameCache = new Map();

function frameAt(tValue) {
  const t = positiveMod(tValue, 1);
  const bucket = Math.floor(t * 420);
  if (frameCache.has(bucket)) return frameCache.get(bucket);
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const reference = Math.abs(tangent.y) > 0.78 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(tangent, reference).normalize();
  const up = new THREE.Vector3().crossVectors(right, tangent).normalize();
  const frame = { point, tangent, right, up };
  frameCache.set(bucket, frame);
  return frame;
}

function placeAlong(group, distance, lateral, vertical, floor = TRACK_FLOOR) {
  const f = frameAt(distance / TRACK_LENGTH);
  const position = f.point.clone()
    .addScaledVector(f.right, lateral || 0)
    .addScaledVector(f.up, floor + (vertical || 0));
  group.position.copy(position);
  group.up.copy(f.up);
  group.lookAt(position.clone().add(f.tangent));
  return f;
}

function placeAtT(group, tValue, lateral, vertical) {
  const f = frameAt(tValue);
  const position = f.point.clone()
    .addScaledVector(f.right, lateral || 0)
    .addScaledVector(f.up, vertical || 0);
  group.position.copy(position);
  group.up.copy(f.up);
  group.lookAt(position.clone().add(f.tangent));
  return f;
}

function addLine(points, color, opacity = 1, linewidth = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.userData.linewidth = linewidth;
  world.add(line);
  return line;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(48, 48, 2, 48, 48, 48);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(.14, "rgba(95,232,255,.9)");
  g.addColorStop(.46, "rgba(45,116,255,.24)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  return new THREE.CanvasTexture(c);
}
const glowMap = glowTexture();

const asteroids = [];
const traffic = [];
const gates = [];
const boostPads = [];
const ramps = [];
const hazards = [];
const collectibles = [];
const pickups = [];
const dynamicWorld = [];
const bursts = [];
const stormArcs = [];
let starField;

function addStars() {
  const count = 2300;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorset = [new THREE.Color(0x8bdfff), new THREE.Color(0xffffff), new THREE.Color(0xffb6e6), new THREE.Color(0x8ba9ff)];
  for (let i = 0; i < count; i += 1) {
    const radius = randRange(rng, 300, 900);
    const theta = randRange(rng, 0, TAU);
    const phi = Math.acos(randRange(rng, -1, 1));
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const color = colorset[Math.floor(rng() * colorset.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 1.25,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: .88,
    depthWrite: false,
  });
  starField = new THREE.Points(geometry, material);
  world.add(starField);
}

function addNebula(position, size, color, opacity) {
  const material = new THREE.SpriteMaterial({
    map: glowMap,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(size, size, 1);
  world.add(sprite);
  dynamicWorld.push({ update: (dt) => { sprite.material.opacity = opacity * (.86 + Math.sin(performance.now() * .00016 + size) * .12); } });
}

function addPlanet(position, radius, color, ringColor, tilt) {
  const group = new THREE.Group();
  group.position.copy(position);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: .84,
    metalness: .08,
    emissive: new THREE.Color(color).multiplyScalar(.07),
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 38, 24), material);
  group.add(body);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.075, 30, 18), new THREE.MeshBasicMaterial({
    color: ringColor || color,
    transparent: true,
    opacity: .17,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  group.add(atmo);
  if (ringColor) {
    const rings = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.46, Math.max(.42, radius * .055), 8, 80), new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: .55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    rings.rotation.x = tilt || 1.1;
    group.add(rings);
  }
  const beacon = new THREE.PointLight(color, radius * 1.5, radius * 8, 2);
  beacon.position.set(radius * .55, radius * .4, radius * .8);
  group.add(beacon);
  world.add(group);
  dynamicWorld.push({ update: (dt) => { body.rotation.y += dt * .012; group.rotation.z += dt * .002; } });
  return group;
}

function createTrack() {
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 440, TRACK_RADIUS, 10, true),
    new THREE.MeshStandardMaterial({
      color: 0x08172a,
      roughness: .42,
      metalness: .84,
      side: THREE.BackSide,
    }),
  );
  trackWorld.add(tube);
  const innerGlow = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 440, TRACK_RADIUS * .93, 10, true),
    new THREE.MeshBasicMaterial({
      color: 0x061124,
      transparent: true,
      opacity: .43,
      side: THREE.BackSide,
    }),
  );
  trackWorld.add(innerGlow);
  const railOffsets = [-7.2, 7.2];
  for (const offset of railOffsets) {
    const points = [];
    for (let i = 0; i <= 440; i += 1) {
      const f = frameAt(i / 440);
      points.push(f.point.clone().addScaledVector(f.right, offset).addScaledVector(f.up, TRACK_FLOOR + .75));
    }
    const rail = addLine(points, offset < 0 ? 0x2de9ff : 0xff793d, .94);
    rail.parent.remove(rail);
    trackWorld.add(rail);
  }
  const centerPoints = [];
  for (let i = 0; i <= 440; i += 1) {
    const f = frameAt(i / 440);
    centerPoints.push(f.point.clone().addScaledVector(f.up, TRACK_FLOOR + .3));
  }
  const centerLine = addLine(centerPoints, 0x5d7aff, .42);
  centerLine.parent.remove(centerLine);
  trackWorld.add(centerLine);
  for (let i = 0; i < 44; i += 1) {
    const t = i / 44;
    const f = frameAt(t);
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(.22, .22, 1.1),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2de9ff : 0xff793d }),
    );
    marker.position.copy(f.point).addScaledVector(f.right, -7.15).addScaledVector(f.up, TRACK_FLOOR + .65);
    marker.up.copy(f.up);
    marker.lookAt(marker.position.clone().add(f.tangent));
    trackWorld.add(marker);
  }
}

function orientObject(object, f) {
  object.position.copy(f.point);
  object.up.copy(f.up);
  object.lookAt(f.point.clone().add(f.tangent));
}

function createGate(tValue, index) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  orientObject(group, f);
  const cyan = new THREE.MeshBasicMaterial({ color: index % 2 ? 0x2de9ff : 0xff7d3f, transparent: true, opacity: .88, blending: THREE.AdditiveBlending });
  const white = new THREE.MeshBasicMaterial({ color: 0xbdf8ff, transparent: true, opacity: .65, blending: THREE.AdditiveBlending });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(10.7, .34, 8, 50), cyan);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(9.65, .11, 6, 50), white);
  const core = new THREE.Mesh(new THREE.TorusGeometry(8.8, .045, 5, 50), cyan);
  group.add(outer, inner, core);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.2, .18, .12), white);
  sign.position.set(0, 9.7, 0);
  group.add(sign);
  trackWorld.add(group);
  gates.push({ t: tValue, group, outer, index });
  dynamicWorld.push({ update: (dt, time) => {
    outer.rotation.z += dt * (index % 2 ? 1.5 : -1.2);
    inner.rotation.z -= dt * .7;
    outer.material.opacity = .68 + Math.sin(time * 4 + index) * .2;
  } });
}

function createBoostPad(tValue, lane, color) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, lane).addScaledVector(f.up, TRACK_FLOOR + .22);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, blending: THREE.AdditiveBlending });
  for (let i = -1; i <= 1; i += 1) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.42, .11, 2.55), mat);
    stripe.position.x = i * 1.05;
    stripe.position.y = .05;
    group.add(stripe);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, .12, 2.8), new THREE.MeshStandardMaterial({ color: 0x091b31, metalness: .7, roughness: .35, emissive: new THREE.Color(color).multiplyScalar(.08) }));
  base.position.y = -.08;
  group.add(base);
  trackWorld.add(group);
  boostPads.push({ t: tValue, lane, group, phase: rng() * TAU });
}

function createRamp(tValue, lane) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, lane).addScaledVector(f.up, TRACK_FLOOR + .45);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const ramp = new THREE.Mesh(new THREE.ConeGeometry(2.9, 6.4, 4), new THREE.MeshStandardMaterial({ color: 0x1c3351, roughness: .38, metalness: .72, emissive: 0x062e55 }));
  ramp.rotation.x = Math.PI / 2;
  ramp.rotation.z = Math.PI / 4;
  ramp.scale.y = .35;
  group.add(ramp);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffbf5a, blending: THREE.AdditiveBlending });
  for (let i = -1; i <= 1; i += 1) {
    const arrow = new THREE.Mesh(new THREE.BoxGeometry(.28, .12, 1.5), arrowMat);
    arrow.position.set(i * 1.05, .58, -.2);
    group.add(arrow);
  }
  trackWorld.add(group);
  ramps.push({ t: tValue, lane, group, phase: rng() * TAU });
}

function createLaser(tValue, lane, color) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.up, TRACK_FLOOR + 1.8);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, 14.2, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .88, blending: THREE.AdditiveBlending }));
  beam.rotation.z = Math.PI / 2;
  group.add(beam);
  for (const x of [-6.6, 6.6]) {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(.27, .44, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x17273d, metalness: .78, roughness: .35, emissive: new THREE.Color(color).multiplyScalar(.12) }));
    pylon.position.set(x, -1.1, 0);
    group.add(pylon);
  }
  trackWorld.add(group);
  hazards.push({ t: tValue, lane, group, beam, phase: rng() * TAU, hitLap: -99, type: "LASER" });
}

function createTurbine(tValue, lateral, color) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, lateral).addScaledVector(f.up, 6);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.4, .5, 8, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .64, blending: THREE.AdditiveBlending }));
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 10), new THREE.MeshBasicMaterial({ color: 0xbffaff, blending: THREE.AdditiveBlending }));
  group.add(ring, hub);
  for (let i = 0; i < 8; i += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.35, 5.8, .28), new THREE.MeshStandardMaterial({ color: 0x2b4965, metalness: .8, roughness: .3 }));
    blade.rotation.z = i * TAU / 8;
    group.add(blade);
  }
  world.add(group);
  dynamicWorld.push({ update: (dt) => { ring.rotation.z += dt * 1.8; group.rotation.y += dt * .14; } });
}

function createStation(tValue, lateral, scale = 1) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, lateral).addScaledVector(f.up, 11);
  group.scale.setScalar(scale);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const shell = new THREE.MeshStandardMaterial({ color: 0x18263a, metalness: .88, roughness: .3 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x2de9ff, blending: THREE.AdditiveBlending });
  const orange = new THREE.MeshBasicMaterial({ color: 0xff7a3d, blending: THREE.AdditiveBlending });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 1.25, 12, 64), shell);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(15, .22, 8, 64), cyan);
  ring.rotation.x = Math.PI / 2;
  glowRing.rotation.x = Math.PI / 2;
  group.add(ring, glowRing);
  for (let i = 0; i < 12; i += 1) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.25, 5), shell);
    const a = i * TAU / 12;
    pod.position.set(Math.cos(a) * 15, Math.sin(a) * 15, 0);
    pod.rotation.z = a;
    group.add(pod);
    const light = new THREE.Mesh(new THREE.BoxGeometry(1.3, .08, .12), i % 3 ? cyan : orange);
    light.position.copy(pod.position).multiplyScalar(.98);
    light.rotation.z = a;
    group.add(light);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 32, 16), shell);
  spine.rotation.x = Math.PI / 2;
  group.add(spine);
  world.add(group);
  dynamicWorld.push({ update: (dt) => { ring.rotation.z += dt * .16; glowRing.rotation.z -= dt * .24; } });
}

function createMiningColony(tValue) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, -29).addScaledVector(f.up, 4);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const steel = new THREE.MeshStandardMaterial({ color: 0x27364a, metalness: .87, roughness: .32 });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffb24c, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 9; i += 1) {
    const h = 4 + rng() * 16;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2 + rng() * 2, h, 2.2 + rng() * 2), steel);
    tower.position.set(randRange(rng, -18, 18), h / 2, randRange(rng, -9, 9));
    group.add(tower);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), amber);
    lamp.position.set(tower.position.x, h + .35, tower.position.z);
    group.add(lamp);
  }
  const scaffold = new THREE.Mesh(new THREE.TorusGeometry(16, .42, 8, 48), steel);
  scaffold.rotation.x = Math.PI / 2;
  scaffold.position.y = 9;
  group.add(scaffold);
  world.add(group);
  dynamicWorld.push({ update: (dt) => { scaffold.rotation.z += dt * .48; } });
}

function createAlienStructure(tValue) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, 26).addScaledVector(f.up, 15);
  group.up.copy(f.up);
  group.lookAt(group.position.clone().add(f.tangent));
  const purple = new THREE.MeshBasicMaterial({ color: 0xff55e6, transparent: true, opacity: .82, blending: THREE.AdditiveBlending });
  const dark = new THREE.MeshStandardMaterial({ color: 0x241d40, metalness: .75, roughness: .3, emissive: 0x32125a });
  const core = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 14), purple);
  group.add(core);
  for (let i = 0; i < 4; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7 + i * 3, .35 + i * .08, 8, 52), i % 2 ? dark : purple);
    ring.rotation.x = i * .4;
    ring.rotation.y = i * .7;
    group.add(ring);
  }
  for (let i = 0; i < 6; i += 1) {
    const pylon = new THREE.Mesh(new THREE.ConeGeometry(.7, 11, 6), dark);
    const a = i * TAU / 6;
    pylon.position.set(Math.cos(a) * 13, 0, Math.sin(a) * 13);
    group.add(pylon);
  }
  world.add(group);
  dynamicWorld.push({ update: (dt, time) => {
    group.rotation.z += dt * .14;
    core.scale.setScalar(1 + Math.sin(time * 5) * .1);
  } });
}

function createWreck(tValue) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, -25).addScaledVector(f.up, 12);
  group.rotation.set(.2, .3, -.4);
  const hull = new THREE.MeshStandardMaterial({ color: 0x273444, metalness: .74, roughness: .62 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x7d493b, metalness: .4, roughness: .8 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x2de9ff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending });
  const body = new THREE.Mesh(new THREE.BoxGeometry(20, 3.2, 5), hull);
  group.add(body);
  for (let i = 0; i < 5; i += 1) {
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(randRange(rng, 2, 8), randRange(rng, 1, 4), randRange(rng, 1, 5)), i % 2 ? rust : hull);
    chunk.position.set(randRange(rng, -11, 11), randRange(rng, -4, 4), randRange(rng, -3, 3));
    chunk.rotation.set(rng(), rng(), rng());
    group.add(chunk);
  }
  const leak = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), cyan);
  leak.position.set(8, 2, 0);
  group.add(leak);
  world.add(group);
  dynamicWorld.push({ update: (dt, time) => { leak.scale.setScalar(.8 + Math.sin(time * 3.4) * .2); } });
}

function createFloatingCity(tValue) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  group.position.copy(f.point).addScaledVector(f.right, 32).addScaledVector(f.up, -3);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(17, 9, 4, 6), new THREE.MeshStandardMaterial({ color: 0x111e36, metalness: .8, roughness: .35 }));
  group.add(base);
  const lights = new THREE.MeshBasicMaterial({ color: 0xff4fbb, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 18; i += 1) {
    const h = 3 + rng() * 16;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.5 + rng() * 2.5, h, 1.5 + rng() * 2.5), new THREE.MeshStandardMaterial({ color: 0x1b2c4c, metalness: .72, roughness: .33 }));
    const a = i * TAU / 18;
    tower.position.set(Math.cos(a) * randRange(rng, 5, 14), h / 2 + 2.2, Math.sin(a) * randRange(rng, 5, 14));
    group.add(tower);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.3, .1, .3), lights);
    lamp.position.set(tower.position.x, h + 2.35, tower.position.z);
    group.add(lamp);
  }
  world.add(group);
}

function makeTrafficShip(color) {
  const root = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color, metalness: .82, roughness: .28, emissive: new THREE.Color(color).multiplyScalar(.13) });
  const dark = new THREE.MeshStandardMaterial({ color: 0x071325, metalness: .9, roughness: .25 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x9af7ff, blending: THREE.AdditiveBlending });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.7, .6, 5.6), shell);
  root.add(hull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.8, 2.7, 6), shell);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -3.2;
  root.add(nose);
  for (const x of [-2.5, 2.5]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.7, .18, 1.6), dark);
    wing.position.set(x * .65, 0, .8);
    wing.rotation.y = x < 0 ? -.18 : .18;
    root.add(wing);
  }
  for (const x of [-.58, .58]) {
    const engine = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 7), glow);
    engine.position.set(x, .1, 2.85);
    root.add(engine);
  }
  return root;
}

function createTraffic() {
  const colors = [0xff4f7d, 0x77cfff, 0xffc657, 0xb184ff, 0x9cff7a, 0xff8a43, 0x6b9dff, 0xff6cf0];
  for (let i = 0; i < 11; i += 1) {
    const root = makeTrafficShip(colors[i % colors.length]);
    world.add(root);
    traffic.push({
      root,
      t: randRange(rng, 0, 1),
      height: randRange(rng, 14, 42),
      lateral: randRange(rng, -55, 55),
      speed: randRange(rng, .001, .004),
      phase: rng() * TAU,
    });
  }
}

function createAsteroids() {
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x26354b, roughness: .92, metalness: .28 }),
    new THREE.MeshStandardMaterial({ color: 0x39425d, roughness: .86, metalness: .18 }),
    new THREE.MeshStandardMaterial({ color: 0x463d55, roughness: .9, metalness: .18 }),
    new THREE.MeshStandardMaterial({ color: 0x1d4058, roughness: .78, metalness: .38 }),
  ];
  for (let i = 0; i < 78; i += 1) {
    const size = randRange(rng, 1.2, 7.4);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), materials[i % materials.length]);
    const t = randRange(rng, 0, 1);
    const f = frameAt(t);
    let lateral = randRange(rng, -59, 59);
    let vertical = randRange(rng, -4, 48);
    if (Math.abs(lateral) < 17 && vertical < 18) lateral += lateral < 0 ? -22 : 22;
    mesh.position.copy(f.point).addScaledVector(f.right, lateral).addScaledVector(f.up, vertical);
    mesh.rotation.set(rng() * TAU, rng() * TAU, rng() * TAU);
    world.add(mesh);
    asteroids.push({ mesh, t, lateral, vertical, spin: randRange(rng, -.42, .42), phase: rng() * TAU });
  }
}

function createStorm() {
  const f = frameAt(.625);
  for (let i = 0; i < 25; i += 1) {
    const start = f.point.clone().addScaledVector(f.right, randRange(rng, -35, 35)).addScaledVector(f.up, randRange(rng, -2, 34));
    const points = [start];
    for (let j = 0; j < 4; j += 1) {
      points.push(points[points.length - 1].clone()
        .addScaledVector(f.tangent, randRange(rng, 3, 7))
        .addScaledVector(f.right, randRange(rng, -5, 5))
        .addScaledVector(f.up, randRange(rng, -5, 5)));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: i % 3 ? 0x6cc7ff : 0xffe67c, transparent: true, opacity: .48, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geometry, material);
    world.add(line);
    stormArcs.push({ line, phase: rng() * TAU });
  }
  const stormGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: 0x317dff, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false }));
  stormGlow.position.copy(f.point).addScaledVector(f.up, 15);
  stormGlow.scale.set(100, 70, 1);
  world.add(stormGlow);
}

function createWormhole(tValue) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  orientObject(group, f);
  for (let i = 0; i < 8; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8.3 + i * .9, .19 + i * .035, 8, 48), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff50d9 : 0x6e7dff, transparent: true, opacity: .72, blending: THREE.AdditiveBlending }));
    ring.position.z = -i * 3.3;
    group.add(ring);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(7.5, 20, 12), new THREE.MeshBasicMaterial({ color: 0x271250, transparent: true, opacity: .34, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
  group.add(core);
  world.add(group);
  dynamicWorld.push({ update: (dt, time) => { group.rotation.z += dt * .42; core.scale.setScalar(1 + Math.sin(time * 4) * .08); } });
}

function createSpeedTunnel(tValue) {
  const f = frameAt(tValue);
  const group = new THREE.Group();
  orientObject(group, f);
  for (let i = 0; i < 9; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(10.4, .16, 6, 44), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2de9ff : 0xff9c4b, transparent: true, opacity: .7, blending: THREE.AdditiveBlending }));
    ring.position.z = -i * 5;
    group.add(ring);
  }
  world.add(group);
  dynamicWorld.push({ update: (dt, time) => { group.children.forEach((child, i) => { child.rotation.z += dt * (i % 2 ? -1 : 1) * 1.1; }); } });
}

function createCollectibles() {
  for (let i = 0; i < 24; i += 1) {
    const t = positiveMod(.025 + i * .041 + (i % 3) * .008, 1);
    const lane = [-4.8, 0, 4.8][i % 3];
    const vertical = TRACK_FLOOR + 1.6 + (i % 4) * 1.1;
    const group = new THREE.Group();
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.85, 0), new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0xff5ee5 : 0x76f7ff, transparent: true, opacity: .94, blending: THREE.AdditiveBlending }));
    group.add(gem);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.35, .06, 6, 22), new THREE.MeshBasicMaterial({ color: 0xc7fbff, transparent: true, opacity: .62, blending: THREE.AdditiveBlending }));
    group.add(halo);
    placeAtT(group, t, lane, vertical);
    trackWorld.add(group);
    collectibles.push({ t, lane, vertical, group, gem, collected: false, secret: i % 5 === 0 });
  }
}

function createPickups() {
  const specs = [
    { t: .19, lane: -4.8, kind: "HYPERBOOST", color: 0xff963e },
    { t: .48, lane: 4.8, kind: "SHIELD", color: 0x9cff7a },
    { t: .66, lane: 0, kind: "EMP", color: 0xd47bff },
    { t: .86, lane: -4.8, kind: "SHIELD", color: 0x9cff7a },
  ];
  for (const spec of specs) {
    const group = new THREE.Group();
    const gem = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 0), new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: .94, blending: THREE.AdditiveBlending }));
    group.add(gem);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, .08, 7, 24), new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: .7, blending: THREE.AdditiveBlending }));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    placeAtT(group, spec.t, spec.lane, TRACK_FLOOR + 2.7);
    trackWorld.add(group);
    pickups.push({ ...spec, group, gem, ring, collected: false });
  }
}

function createMeteorShower() {
  for (let i = 0; i < 16; i += 1) {
    const root = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.SphereGeometry(randRange(rng, .28, .8), 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb65c, blending: THREE.AdditiveBlending }));
    const tail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 8)]), new THREE.LineBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: .7, blending: THREE.AdditiveBlending }));
    root.add(rock, tail);
    root.position.set(randRange(rng, -190, 190), randRange(rng, -80, 120), randRange(rng, -210, 120));
    world.add(root);
    dynamicWorld.push({ update: (dt) => {
      root.position.x -= dt * (25 + i * 2);
      root.position.y -= dt * (11 + i);
      root.position.z += dt * 17;
      if (root.position.x < -240 || root.position.y < -120) {
        root.position.set(190, randRange(rng, 30, 130), randRange(rng, -200, 100));
      }
    } });
  }
}

function createWorld() {
  addStars();
  addNebula(new THREE.Vector3(-190, 80, -250), 280, 0x283dff, .11);
  addNebula(new THREE.Vector3(200, -70, -240), 220, 0xff3ca8, .08);
  addNebula(new THREE.Vector3(20, 130, 120), 180, 0x1be8ff, .08);
  addPlanet(new THREE.Vector3(-105, 36, -180), 44, 0x64384f, 0xffae5d, .72);
  addPlanet(new THREE.Vector3(152, -22, -82), 28, 0x194c72, 0x43d4ff, 1.18);
  addPlanet(new THREE.Vector3(88, 54, 128), 17, 0x9b4e35, 0xffd35f, .92);
  addPlanet(new THREE.Vector3(-158, -40, 90), 12, 0x314d75, 0x7d9dff, 1.4);
  createTrack();
  for (let i = 0; i < 8; i += 1) createGate(i / 8, i);
  [
    [.035, -4.8, 0x2de9ff], [.11, 0, 0xff8a3d], [.175, 4.8, 0x2de9ff],
    [.245, -4.8, 0xff8a3d], [.335, 0, 0x2de9ff], [.41, 4.8, 0xff8a3d],
    [.535, -4.8, 0x2de9ff], [.695, 4.8, 0xff8a3d], [.795, 0, 0x2de9ff],
    [.92, -4.8, 0xff8a3d],
  ].forEach((item) => createBoostPad(item[0], item[1], item[2]));
  createRamp(.145, 0);
  createRamp(.365, -4.8);
  createRamp(.575, 4.8);
  createRamp(.825, 0);
  createLaser(.285, 0, 0xff5e8b);
  createLaser(.505, 4.8, 0xffd25e);
  createLaser(.655, -4.8, 0xff5eec);
  createLaser(.905, 0, 0xff5e8b);
  createTurbine(.26, 22, 0x2de9ff);
  createTurbine(.73, -23, 0xff7b4d);
  createStation(.075, 29, 1.05);
  createStation(.43, -31, .82);
  createMiningColony(.31);
  createAlienStructure(.57);
  createWreck(.77);
  createFloatingCity(.875);
  createWormhole(.455);
  createSpeedTunnel(.215);
  createStorm();
  createCollectibles();
  createPickups();
  createAsteroids();
  createTraffic();
  createMeteorShower();
}

const vehicleSpecs = [
  { id: "comet", name: "COMET // Mk-I", desc: "Balanced frame. Forgives bad lines.", speed: 82, accel: 80, handling: 76, boost: 70, color: 0x27dcff },
  { id: "vector", name: "VECTOR // S9", desc: "Needle nose. Top speed specialist.", speed: 95, accel: 66, handling: 58, boost: 84, color: 0xff7a45 },
  { id: "pulse", name: "PULSE // R-4", desc: "Launch monster. Explodes off pads.", speed: 78, accel: 96, handling: 72, boost: 75, color: 0xff55c8 },
  { id: "wisp", name: "WISP // ALIEN", desc: "Strange tech. Handles like a dream.", speed: 80, accel: 76, handling: 98, boost: 67, color: 0xb4ff6c },
  { id: "titan", name: "TITAN // HEAVY", desc: "Massive grip. Bully the shortcut.", speed: 74, accel: 62, handling: 68, boost: 92, color: 0xffc451 },
];
const paintColors = [0x27dcff, 0xff7a45, 0xff55c8, 0xb4ff6c, 0xffc451, 0x9b7dff];
const paintNames = ["ION BLUE", "SOLAR ORANGE", "NOVA PINK", "LUNA LIME", "REACTOR GOLD", "VOID VIOLET"];

let selectedVehicle = "comet";
let selectedPaint = 0;
let playerVehicle = null;
let aiRacers = [];
let mode = "race";
let state = null;
let lastFrame = performance.now();
let worldTime = 0;
let minimapTimer = 0;
let audio = null;

function saveData() {
  try {
    return JSON.parse(localStorage.getItem("orbitbreakers-luna-save-v1") || "{}");
  } catch {
    return {};
  }
}
let pilotRecord = saveData();

function persistRecord() {
  try {
    localStorage.setItem("orbitbreakers-luna-save-v1", JSON.stringify(pilotRecord));
  } catch {}
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--.-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return String(mins).padStart(1, "0") + ":" + String(secs).padStart(2, "0") + "." + tenths;
}

function renderMenu() {
  const vehicleGrid = $("vehicleGrid");
  vehicleGrid.innerHTML = "";
  for (const spec of vehicleSpecs) {
    const card = document.createElement("div");
    card.className = "vehicle" + (spec.id === selectedVehicle ? " selected" : "");
    card.dataset.vehicle = spec.id;
    card.innerHTML =
      "<h4>" + spec.name + "</h4>" +
      "<p>" + spec.desc + "</p>" +
      "<div class=\"stat\">TOP SPEED<div class=\"stat-line\"><i style=\"width:" + spec.speed + "%\"></i></div></div>" +
      "<div class=\"stat\">ACCELERATION<div class=\"stat-line\"><i style=\"width:" + spec.accel + "%\"></i></div></div>" +
      "<div class=\"stat\">HANDLING<div class=\"stat-line\"><i style=\"width:" + spec.handling + "%\"></i></div></div>";
    card.addEventListener("click", () => {
      selectedVehicle = spec.id;
      renderMenu();
    });
    vehicleGrid.appendChild(card);
  }
  const swatches = $("swatches");
  swatches.innerHTML = "";
  paintColors.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.className = "swatch" + (index === selectedPaint ? " selected" : "");
    swatch.title = paintNames[index];
    swatch.style.background = "#" + color.toString(16).padStart(6, "0");
    swatch.style.color = swatch.style.background;
    swatch.addEventListener("click", () => { selectedPaint = index; renderMenu(); });
    swatches.appendChild(swatch);
  });
  const best = Number(pilotRecord.bestLap);
  const wins = Number(pilotRecord.wins || 0);
  const shards = Number(pilotRecord.data || 0);
  $("record").innerHTML =
    "<div class=\"big\">" + (best ? formatTime(best) : "--:--.-") + "</div>" +
    "<div class=\"kv\"><span>BEST LAP</span><b>" + (best ? "LUNA RECORD" : "NO RECORD") + "</b></div>" +
    "<div class=\"kv\"><span>GRAND PRIX WINS</span><b>" + wins + "</b></div>" +
    "<div class=\"kv\"><span>DATA SHARDS FOUND</span><b>" + shards + " / 24</b></div>";
  document.querySelectorAll(".mode").forEach((card) => card.classList.toggle("selected", card.dataset.mode === mode));
}

function freshState(nextMode) {
  const free = nextMode === "freeroam";
  return {
    mode: nextMode,
    phase: "countdown",
    paused: false,
    countdown: free ? 1.7 : 3.4,
    raceTime: 0,
    distance: free ? TRACK_LENGTH * .12 : 0,
    speed: 0,
    lateral: 0,
    vertical: 0,
    verticalVelocity: 0,
    airborne: false,
    gravity: 1,
    boost: .62,
    shield: 0,
    hyper: 0,
    credits: 0,
    data: 0,
    lap: 1,
    position: nextMode === "timetrial" ? "TT" : 1,
    nextGate: 0,
    eventText: "",
    eventTimer: 0,
    callout: "",
    calloutSub: "",
    calloutTimer: 0,
    toast: "",
    toastTimer: 0,
    nearTimer: 0,
    cameraShake: 0,
    cameraFar: false,
    roaming: free,
    lastDistance: free ? TRACK_LENGTH * .12 : 0,
    eventCursor: 0,
    gravityLabel: "MAG-RAIL",
    route: "MAINLINE",
    lapStart: 0,
    lapBest: null,
    lastLap: 0,
    finishShown: false,
    muted: false,
    stuckTimer: 0,
    lastBoostPadLap: {},
    lastPickupLap: {},
    lastTriggerLap: {},
  };
}

function makeVehicle(color, scale = 1) {
  const root = new THREE.Group();
  root.scale.setScalar(scale);
  const paint = new THREE.Color(color);
  const shell = new THREE.MeshStandardMaterial({ color: paint, metalness: .9, roughness: .24, emissive: paint.clone().multiplyScalar(.14) });
  const dark = new THREE.MeshStandardMaterial({ color: 0x061225, metalness: .96, roughness: .2 });
  const trim = new THREE.MeshBasicMaterial({ color: paint, transparent: true, opacity: .9, blending: THREE.AdditiveBlending });
  const white = new THREE.MeshBasicMaterial({ color: 0xe7fdff, blending: THREE.AdditiveBlending });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, .48, 3.8), shell);
  body.position.y = .3;
  root.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.88, 2.5, 6), shell);
  nose.position.set(0, .3, -2.75);
  nose.rotation.x = -Math.PI / 2;
  root.add(nose);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(.78, 18, 10), dark);
  cockpit.scale.set(.78, .43, 1.32);
  cockpit.position.set(0, .72, -.35);
  root.add(cockpit);
  const canopyLine = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 1.9), white);
  canopyLine.position.set(0, .9, -.26);
  canopyLine.rotation.x = .15;
  root.add(canopyLine);
  for (const x of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, .14, 1.45), shell);
    wing.position.set(x * 1.15, .19, .35);
    wing.rotation.y = x * -.13;
    root.add(wing);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(.16, .65, 1.18), dark);
    fin.position.set(x * 1.65, .43, .75);
    fin.rotation.z = x * -.2;
    root.add(fin);
    const engine = new THREE.Mesh(new THREE.SphereGeometry(.26, 12, 8), trim);
    engine.position.set(x * .58, .25, 2.16);
    root.add(engine);
  }
  const noseLight = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 6), white);
  noseLight.position.set(0, .35, -3.9);
  root.add(noseLight);
  const trailA = new THREE.Mesh(new THREE.CylinderGeometry(.22, .42, 2.9, 8), trim);
  const trailB = trailA.clone();
  trailA.rotation.x = Math.PI / 2;
  trailB.rotation.x = Math.PI / 2;
  trailA.position.set(-.58, .25, 3.35);
  trailB.position.set(.58, .25, 3.35);
  root.add(trailA, trailB);
  const light = new THREE.PointLight(color, 3.8, 13, 2);
  light.position.set(0, .2, 2.1);
  root.add(light);
  root.userData = { engines: [trailA, trailB], engineLights: [light], baseColor: color };
  return root;
}

const aiProfiles = [
  { name: "VANTA", color: 0xff5b78, speed: .94, aggression: .86, lane: -4.3, phase: .4 },
  { name: "ORACLE", color: 0x8d72ff, speed: .98, aggression: .58, lane: 4.2, phase: 1.8 },
  { name: "KITE", color: 0xffc857, speed: .91, aggression: .72, lane: 0, phase: 3.1 },
  { name: "MIRAGE", color: 0x6cf2d5, speed: .96, aggression: .68, lane: 5.1, phase: 4.3 },
  { name: "GRIT", color: 0xaab7c8, speed: .9, aggression: .92, lane: -5.1, phase: 5.6 },
];

function resetCollectibles() {
  collectibles.forEach((item) => { item.collected = false; item.group.visible = true; });
  pickups.forEach((item) => { item.collected = false; item.group.visible = true; });
}

function startSession(nextMode) {
  mode = nextMode;
  state = freshState(nextMode);
  resetCollectibles();
  const spec = vehicleSpecs.find((item) => item.id === selectedVehicle) || vehicleSpecs[0];
  if (playerVehicle) world.remove(playerVehicle);
  playerVehicle = makeVehicle(paintColors[selectedPaint] || spec.color, 1.05);
  world.add(playerVehicle);
  aiRacers = [];
  if (nextMode === "race") {
    aiProfiles.forEach((profile, index) => {
      const root = makeVehicle(profile.color, .86);
      world.add(root);
      aiRacers.push({ ...profile, root, distance: -(index + 1) * 28 + (index % 2 ? 12 : 0), speed: 0, lane: profile.lane, finished: false, boostTimer: 0 });
    });
  }
  $("mainmenu").classList.add("hidden");
  $("pausemenu").classList.add("hidden");
  $("finishmenu").classList.add("hidden");
  $("hud").classList.add("active");
  $("loading").classList.add("hidden");
  $("callout").textContent = "";
  $("callout-sub").textContent = "";
  $("countdown").textContent = "";
  initAudio();
  showEvent(nextMode === "freeroam" ? "LUNA FREE ROAM // SYSTEMS UNLOCKED" : "ORBITAL GRID LOCKED // RIVALS DETECTED", "THE FIRST GATE IS ALREADY MOVING");
}

function quitToMenu() {
  if (playerVehicle) playerVehicle.visible = false;
  aiRacers.forEach((racer) => { racer.root.visible = false; });
  if (state) state.paused = false;
  $("hud").classList.remove("active");
  $("pausemenu").classList.add("hidden");
  $("finishmenu").classList.add("hidden");
  $("mainmenu").classList.remove("hidden");
  renderMenu();
}

function showEvent(text, sub = "") {
  if (!state) return;
  state.eventText = text;
  state.eventTimer = 4.2;
  state.callout = text;
  state.calloutSub = sub;
  state.calloutTimer = 2.2;
  $("event").textContent = text;
}

function showToast(text) {
  if (!state) return;
  state.toast = text;
  state.toastTimer = 2.8;
  $("toast").textContent = text;
}

function triggerBurst(position, color, amount = 28, power = 12) {
  const positions = new Float32Array(amount * 3);
  const velocities = [];
  for (let i = 0; i < amount; i += 1) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;
    velocities.push(new THREE.Vector3(randRange(rng, -1, 1), randRange(rng, -1, 1), randRange(rng, -1, 1)).normalize().multiplyScalar(randRange(rng, power * .35, power)));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color, size: .42, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  world.add(points);
  bursts.push({ points, velocities, positions, life: 1.05, maxLife: 1.05 });
}

function crossedBetween(previous, current, targetT, callback) {
  if (current <= previous) return;
  const startLap = Math.floor(previous / TRACK_LENGTH);
  const endLap = Math.floor(current / TRACK_LENGTH);
  for (let lap = startLap; lap <= endLap; lap += 1) {
    const target = lap * TRACK_LENGTH + targetT * TRACK_LENGTH;
    if (target > previous && target <= current) callback(lap);
  }
}

function triggerOnce(key, lap, callback) {
  if (state.lastTriggerLap[key] === lap) return;
  state.lastTriggerLap[key] = lap;
  callback();
}

function currentSpec() {
  return vehicleSpecs.find((item) => item.id === selectedVehicle) || vehicleSpecs[0];
}

const keys = Object.create(null);
let steerValue = 0;

function readControls() {
  let throttle = keys.w || keys.ArrowUp ? 1 : 0;
  let brake = keys.s || keys.ArrowDown ? 1 : 0;
  let steer = (keys.a || keys.ArrowLeft ? -1 : 0) + (keys.d || keys.ArrowRight ? 1 : 0);
  let boost = !!keys.Shift;
  const drift = !!keys[" "] || !!keys.Space;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads && pads[0];
  if (pad) {
    const axis = Number(pad.axes[0] || 0);
    if (Math.abs(axis) > .12) steer = axis;
    const gas = pad.buttons[7] ? pad.buttons[7].value : 0;
    const stop = pad.buttons[6] ? pad.buttons[6].value : 0;
    if (gas > .12) throttle = gas;
    if (stop > .12) brake = stop;
    boost = boost || !!(pad.buttons[0] && pad.buttons[0].pressed);
  }
  return { throttle, brake, steer: clamp(steer, -1, 1), boost, drift };
}

function recoverPlayer() {
  if (!state) return;
  state.distance = Math.max(0, state.distance - 6);
  state.lateral = clamp(state.lateral, -3.2, 3.2);
  state.vertical = 0;
  state.verticalVelocity = 0;
  state.airborne = false;
  state.speed = Math.min(state.speed, 32);
  state.stuckTimer = 0;
  state.cameraShake = .3;
  showToast("RECOVERY VECTOR // MAG-RAIL REACQUIRED");
  triggerBurst(playerVehicle.position, 0x2de9ff, 14, 5);
}

function handleTrackTriggers(previous, current) {
  for (const pad of boostPads) {
    crossedBetween(previous, current, pad.t, (lap) => {
      if (Math.abs(state.lateral - pad.lane) < 3.05 && state.lastBoostPadLap[pad.t] !== lap) {
        state.lastBoostPadLap[pad.t] = lap;
        state.boost = clamp(state.boost + .17, 0, 1);
        state.speed += 12;
        state.cameraShake = Math.max(state.cameraShake, .16);
        showToast("BOOST PAD // ENERGY ROUTED");
        triggerBurst(playerVehicle.position, 0x2de9ff, 18, 8);
        soundPulse(280, .1, "square", .045);
      }
    });
  }
  for (const ramp of ramps) {
    crossedBetween(previous, current, ramp.t, (lap) => {
      if (Math.abs(state.lateral - ramp.lane) < 3.2 && !state.airborne && state.lastTriggerLap["r" + ramp.t] !== lap) {
        state.lastTriggerLap["r" + ramp.t] = lap;
        state.verticalVelocity = 17 + Math.min(7, state.speed * .05);
        state.airborne = true;
        state.vertical = .2;
        state.cameraShake = Math.max(state.cameraShake, .12);
        showEvent("JUMP GATE // AIR CONTROL LIVE", "ROLL INTO THE NEXT CHECKPOINT");
        triggerBurst(playerVehicle.position, 0xffc25a, 20, 9);
        soundPulse(170, .18, "sawtooth", .065);
      }
    });
  }
  crossedBetween(previous, current, .455, (lap) => {
    triggerOnce("wormhole", lap, () => {
      state.distance += TRACK_LENGTH * .065;
      state.boost = clamp(state.boost + .2, 0, 1);
      state.cameraShake = .35;
      showEvent("WORMHOLE ONLINE // SLINGSHOT", "SECTOR 7B HAS A DIFFERENT SKY");
      triggerBurst(playerVehicle.position, 0xff55dd, 50, 20);
      $("flash").animate([{ opacity: .7 }, { opacity: 0 }], { duration: 460, easing: "ease-out" });
      soundPulse(80, .42, "sine", .1);
    });
  });
  crossedBetween(previous, current, .575, (lap) => {
    triggerOnce("gravity", lap, () => {
      state.gravity = -1;
      state.gravityLabel = "GRAVITY FLIP";
      showEvent("ALIEN GRAVITY FLIP // MAGNETIC CEILING", "THE TRACK IS STILL THE TRACK");
      triggerBurst(playerVehicle.position, 0xc45cff, 24, 9);
      soundPulse(420, .22, "triangle", .06);
    });
  });
  crossedBetween(previous, current, .625, (lap) => {
    triggerOnce("storm", lap, () => {
      state.gravity = 1;
      state.gravityLabel = "ION STORM";
      showEvent("ION STORM // SHIELD OR DODGE", "LIGHTNING IS A VERY LOUD SUGGESTION");
      state.cameraShake = .25;
      soundPulse(92, .4, "sawtooth", .08);
    });
  });
  crossedBetween(previous, current, .72, (lap) => {
    triggerOnce("roam-exit", lap, () => {
      state.route = "EXPLORATION EXIT";
      showEvent("FREE-ROAM EXIT // PRESS E TO DETACH", "RACE ROUTE CONTINUES WITHOUT YOU");
    });
  });
  crossedBetween(previous, current, .81, (lap) => {
    triggerOnce("secret", lap, () => {
      state.route = "SECRET RING";
      showEvent("SECRET RING // HIDDEN LINE FOUND", "A CLEAN JUMP CAN CUT THE LOOP");
    });
  });
  for (let i = 0; i < gates.length; i += 1) {
    crossedBetween(previous, current, gates[i].t, (lap) => {
      state.nextGate = (i + 1) % gates.length;
      state.gravityLabel = i >= 4 && i <= 5 ? "MAG-RAIL" : state.gravityLabel;
      if (i === 0 && lap > 0) {
        const lapTime = state.raceTime - state.lapStart;
        state.lapBest = state.lapBest === null ? lapTime : Math.min(state.lapBest, lapTime);
        state.lapStart = state.raceTime;
        state.lastLap = lapTime;
        if (!state.bestLap || lapTime < state.bestLap) state.bestLap = lapTime;
      }
      showToast("CHECKPOINT " + String(i + 1).padStart(2, "0") + " // LINE LOCKED");
      soundPulse(640 + i * 40, .1, "sine", .045);
    });
  }
}

function updatePlayer(dt, controls) {
  const spec = currentSpec();
  const boosting = controls.boost && state.boost > .012 && state.speed > 17;
  const drift = controls.drift;
  const speedLimit = spec.speed * .95;
  const boostLimit = speedLimit * (state.hyper > 0 ? 1.92 : 1.62);
  let targetSpeed = controls.throttle ? (boosting ? boostLimit : speedLimit) : 0;
  if (controls.brake) targetSpeed = state.speed > 2 ? 0 : -25;
  const accel = (spec.accel / 100) * (boosting ? 5.4 : 3.5);
  state.speed = lerp(state.speed, targetSpeed, clamp(dt * accel, 0, 1));
  if (Math.abs(state.speed) < .25 && !controls.throttle && !controls.brake) state.speed = 0;
  if (boosting) {
    state.boost = clamp(state.boost - dt * (state.hyper > 0 ? .16 : .24), 0, 1);
    state.cameraShake = Math.max(state.cameraShake, .045);
  } else {
    state.boost = clamp(state.boost + dt * (drift ? .018 : .048), 0, 1);
  }
  if (state.hyper > 0) state.hyper = Math.max(0, state.hyper - dt);
  const handling = spec.handling / 100;
  const steerRate = (drift ? 25 : 15) * (0.62 + Math.min(1, Math.abs(state.speed) / Math.max(1, speedLimit)) * .42) * handling;
  const steerDamp = state.airborne ? 1.1 : 1;
  state.lateral += controls.steer * steerRate * dt * steerDamp;
  if (!controls.steer && !drift) state.lateral *= Math.pow(.54, dt);
  if (drift) {
    state.lateral += controls.steer * dt * 4.5;
    state.speed = lerp(state.speed, state.speed * .91, clamp(dt * 1.8, 0, 1));
  }
  steerValue = lerp(steerValue, controls.steer, clamp(dt * 8, 0, 1));
  if (state.roaming) {
    state.lateral = clamp(state.lateral, -48, 48);
  } else {
    if (Math.abs(state.lateral) > 9.4) {
      state.lateral = clamp(state.lateral, -10.8, 10.8);
      state.speed = lerp(state.speed, state.speed * .72, clamp(dt * 2, 0, 1));
      state.cameraShake = Math.max(state.cameraShake, .04);
    }
  }
  if (state.airborne || state.roaming && state.vertical !== 0) {
    const gravity = state.gravity < 0 ? 8.5 : state.gravityLabel === "ION STORM" ? 17 : 25;
    state.verticalVelocity -= gravity * dt;
    state.vertical += state.verticalVelocity * dt;
    if (!state.roaming && state.vertical <= 0) {
      state.vertical = 0;
      state.verticalVelocity = 0;
      if (state.airborne) {
        state.airborne = false;
        state.cameraShake = Math.max(state.cameraShake, .28);
        triggerBurst(playerVehicle.position, 0x8ceeff, 18, 6);
        showToast("LANDING IMPACT // TRACTION RESTORED");
        soundPulse(75, .15, "triangle", .09);
      }
    }
  }
  if (state.roaming) {
    state.vertical = clamp(state.vertical, -3, 36);
  }
  const previous = state.distance;
  state.distance += state.speed * dt;
  if (!state.roaming && state.distance > previous) handleTrackTriggers(previous, state.distance);
  if (state.roaming) {
    state.distance = positiveMod(state.distance, TRACK_LENGTH);
    state.lastDistance = state.distance;
  }
  if (state.mode !== "freeroam") {
    state.lap = clamp(Math.floor(state.distance / TRACK_LENGTH) + 1, 1, 3);
    if (state.distance >= TRACK_LENGTH * 3 && !state.finishShown) finishRace();
  }
  state.stuckTimer = state.speed < 1 && !controls.throttle ? state.stuckTimer + dt : 0;
  if (state.stuckTimer > 7) recoverPlayer();
  const playerLap = Math.floor(state.distance / TRACK_LENGTH);
  for (const hazard of hazards) {
    const hazardDistance = hazard.t * TRACK_LENGTH;
    const rawDelta = state.distance - hazardDistance;
    const delta = Math.abs(((rawDelta + TRACK_LENGTH / 2) % TRACK_LENGTH) - TRACK_LENGTH / 2);
    const wobble = Math.sin(worldTime * 2.4 + hazard.phase) * 4.7;
    const movingLane = hazard.lane + wobble * .16;
    const laneGap = Math.abs(state.lateral - movingLane);
    if (delta < 3.3 && laneGap < 2.55 && hazard.hitLap !== playerLap) {
      hazard.hitLap = playerLap;
      if (state.shield > 0) {
        state.shield = 0;
        showEvent("SHIELD IMPACT // HULL STABLE", "THAT LASER LOOKED EXPENSIVE");
      } else {
        state.speed *= .44;
        state.boost = clamp(state.boost - .17, 0, 1);
        state.cameraShake = .62;
        showEvent("HULL SCRAPE // REACTOR STABLE", "KEEP IT CLEAN THROUGH THE NEXT GATE");
        $("damage").style.boxShadow = "inset 0 0 140px 36px rgba(255,35,78,.8)";
        setTimeout(() => { $("damage").style.boxShadow = "inset 0 0 140px 36px rgba(255,35,78,0)"; }, 140);
        triggerBurst(playerVehicle.position, 0xff5c62, 28, 13);
        soundPulse(45, .25, "sawtooth", .1);
      }
    } else if (delta < 5.5 && laneGap > 2.7 && laneGap < 5.7 && state.speed > 45) {
      state.nearTimer = .72;
      state.boost = clamp(state.boost + dt * .3, 0, 1);
    }
  }
  for (const item of collectibles) {
    if (item.collected) continue;
    const rawDelta = state.distance - item.t * TRACK_LENGTH;
    const delta = Math.abs(((rawDelta + TRACK_LENGTH / 2) % TRACK_LENGTH) - TRACK_LENGTH / 2);
    if (delta < 3.6 && Math.abs(state.lateral - item.lane) < 2.55 && Math.abs(state.vertical - (item.vertical - TRACK_FLOOR)) < 5.2) {
      item.collected = true;
      item.group.visible = false;
      state.data += 1;
      state.credits += item.secret ? 75 : 25;
      state.boost = clamp(state.boost + (item.secret ? .14 : .06), 0, 1);
      showToast(item.secret ? "SECRET DATA SHARD // +75 ENERGY" : "ENERGY SHARD // +25");
      triggerBurst(playerVehicle.position, item.secret ? 0xff5ce8 : 0x6ceeff, 22, 9);
      soundPulse(item.secret ? 980 : 760, .13, "sine", .06);
    }
  }
  for (const item of pickups) {
    if (item.collected) continue;
    const rawDelta = state.distance - item.t * TRACK_LENGTH;
    const delta = Math.abs(((rawDelta + TRACK_LENGTH / 2) % TRACK_LENGTH) - TRACK_LENGTH / 2);
    if (delta < 3.5 && Math.abs(state.lateral - item.lane) < 2.7) {
      item.collected = true;
      item.group.visible = false;
      if (item.kind === "SHIELD") {
        state.shield = 1;
        showEvent("SHIELD ONLINE // ARC RESISTANT", "TAKE THE STORM LINE");
      } else if (item.kind === "HYPERBOOST") {
        state.hyper = 7;
        state.boost = 1;
        showEvent("HYPERBOOST // 7 SECOND BURN", "THE CAMERA IS ABOUT TO GET SMALLER");
      } else {
        aiRacers.forEach((racer) => { racer.speed *= .76; racer.boostTimer = 0; });
        showEvent("EMP BURST // RIVALS SCRAMBLED", "OVERTAKE WHILE THEIR NAVS ARE DARK");
      }
      triggerBurst(playerVehicle.position, item.color, 35, 14);
      soundPulse(520, .24, "square", .07);
    }
  }
  if (state.mode === "race" && state.route === "EXPLORATION EXIT" && Math.abs(positiveMod(state.distance, TRACK_LENGTH) - TRACK_LENGTH * .72) < 5 && keys.e) detachToRoam();
}

function updateAI(dt) {
  const playerTotal = state.distance;
  for (const racer of aiRacers) {
    const target = currentSpec().speed * racer.speed * (0.92 + Math.sin(worldTime * .4 + racer.phase) * .035);
    racer.speed = lerp(racer.speed, target, clamp(dt * 2.4, 0, 1));
    const localT = positiveMod(racer.distance / TRACK_LENGTH, 1);
    if (Math.sin(worldTime * .8 + racer.phase) > .92) racer.boostTimer = .8;
    if (racer.boostTimer > 0) {
      racer.speed = lerp(racer.speed, target * 1.32, clamp(dt * 4, 0, 1));
      racer.boostTimer -= dt;
    }
    if (state.mode === "race" && localT > .34 && localT < .41 && racer.aggression > .75) racer.lane = Math.sin(worldTime * .9 + racer.phase) > 0 ? 5.1 : -5.1;
    else racer.lane = lerp(racer.lane, racer.lane > 0 ? 4.4 : -4.4, dt * .35);
    if (Math.sin(worldTime * .7 + racer.phase) > .975) racer.speed *= .96;
    racer.distance += racer.speed * dt;
    if (racer.distance >= TRACK_LENGTH * 3) racer.finished = true;
    const f = placeAlong(racer.root, racer.distance, racer.lane + Math.sin(worldTime * 1.1 + racer.phase) * .55, Math.sin(worldTime * 1.5 + racer.phase) * .18);
    racer.root.rotateZ(-Math.sin(worldTime * 1.1 + racer.phase) * .075);
    const engineScale = clamp(.7 + racer.speed / 100, .7, 2);
    racer.root.userData.engines.forEach((engine) => { engine.scale.set(1, 1, engineScale); });
    racer.root.userData.engineLights.forEach((light) => { light.intensity = 2.5 + racer.speed * .08; });
    if (!racer.noticed && racer.distance > playerTotal + 36) {
      racer.noticed = true;
      showToast(racer.name + " // AGGRESSIVE OVERTAKE");
    }
    void f;
  }
  if (state.mode === "race") {
    const standings = [{ distance: state.distance, isPlayer: true }].concat(aiRacers.map((racer) => ({ distance: racer.distance, isPlayer: false }))).sort((a, b) => b.distance - a.distance);
    state.position = standings.findIndex((entry) => entry.isPlayer) + 1;
  }
}

function updatePlayerVisual(dt, controls) {
  if (!playerVehicle) return;
  const f = placeAlong(playerVehicle, state.distance, state.lateral, state.vertical);
  const banking = -steerValue * (state.airborne ? .18 : .11) - (controls.drift ? steerValue * .08 : 0);
  playerVehicle.rotateZ(banking);
  const speedRatio = clamp(Math.abs(state.speed) / 100, 0, 1.8);
  const boosting = controls.boost && state.boost > .01 && state.speed > 17;
  playerVehicle.userData.engines.forEach((engine, index) => {
    const stretch = .72 + speedRatio * 1.05 + (boosting ? 1.25 : 0) + (state.hyper > 0 ? .6 : 0);
    engine.scale.set(1, 1, stretch);
    engine.material.opacity = boosting ? .98 : .67 + speedRatio * .22;
  });
  playerVehicle.userData.engineLights.forEach((light) => {
    light.intensity = 3.8 + speedRatio * 4.4 + (boosting ? 7 : 0);
    light.distance = 11 + speedRatio * 8;
  });
  const distanceBack = state.cameraFar ? 19 : 13.5 + speedRatio * 4.5;
  const height = state.cameraFar ? 7.6 : 5.2 + speedRatio * 1.9;
  const desired = playerVehicle.position.clone()
    .addScaledVector(f.tangent, -distanceBack)
    .addScaledVector(f.up, height)
    .addScaledVector(f.right, steerValue * 1.6);
  const target = playerVehicle.position.clone()
    .addScaledVector(f.tangent, 6 + speedRatio * 5)
    .addScaledVector(f.up, 1.4);
  camera.position.lerp(desired, 1 - Math.pow(.00012, dt));
  camera.up.lerp(f.up, clamp(dt * 5, 0, 1)).normalize();
  camera.lookAt(target);
  camera.rotation.z += -steerValue * .018;
  const targetFov = boosting ? 85 + Math.min(8, state.hyper) : 67 + speedRatio * 5;
  camera.fov = lerp(camera.fov, targetFov, clamp(dt * 4, 0, 1));
  camera.updateProjectionMatrix();
  const shake = state.cameraShake;
  if (shake > .001) {
    camera.position.x += (rng() - .5) * shake;
    camera.position.y += (rng() - .5) * shake;
    state.cameraShake = Math.max(0, state.cameraShake - dt * 1.8);
  }
  $("speedlines").style.opacity = String(clamp((speedRatio - .46) * .65 + (boosting ? .28 : 0), 0, .86));
  void f;
}

function updateFreeRoam(dt, controls) {
  updatePlayer(dt, controls);
  if (state.roaming && state.raceTime > 0 && Math.floor(state.raceTime) % 13 === 0 && state.calloutTimer <= 0) {
    const notices = ["WRECK BELT // DATA SIGNAL", "MINING CAVE // HIDDEN BEACON", "ALIEN RUINS // UNKNOWN LANGUAGE", "SPEED TRAP // FULL THROTTLE"];
    showEvent(notices[Math.floor(state.raceTime / 13) % notices.length], "PRESS R TO RECOVER // KEEP EXPLORING");
  }
}

const schedule = [
  { time: 1.4, text: "ORBITAL LAUNCH // TRAFFIC GRID OPEN", sub: "CARGO SHIPS ARE NOT SLOWING DOWN" },
  { time: 5.2, text: "BOOST PAD CHAIN // CATCH THE BLUE LINE", sub: "ENERGY ROUTED // ENGINE TRAILS LIVE" },
  { time: 9.2, text: "RING OF KESSLER // ICE PARTICLES", sub: "MOVING ASTEROIDS // THREE LANES" },
  { time: 14.2, text: "ZERO-G DROP // JUMP GATE", sub: "MID-AIR STEERING ENABLED" },
  { time: 19.2, text: "MAG-RAIL LOCK // WALLRIDE SECTOR", sub: "THE TRACK TURNS SIDEWAYS" },
  { time: 24.2, text: "MINING LASERS // SHADOW ROUTE", sub: "DANGER IS A SHORTCUT" },
  { time: 29.2, text: "HYPERBOOST WINDOW // BURN IT", sub: "FOV EXPANSION // RIVALS INCOMING" },
  { time: 34.2, text: "THREE-WAY SPLIT // CHOOSE A LINE", sub: "SAFE // FAST // UNKNOWN" },
  { time: 39.2, text: "WORMHOLE ONLINE // SECTOR 7B", sub: "LIGHTING SIGNATURE CHANGED" },
  { time: 44.2, text: "ION STORM // SHIELD READY", sub: "LIGHTNING IS A VERY LOUD SUGGESTION" },
  { time: 49.2, text: "ALIEN STRUCTURE AWAKENED", sub: "GRAVITY FLIP // HIDDEN RING" },
  { time: 55.2, text: "ORBITAL CHECKPOINT // FIRST CLIMAX", sub: "THE PLAYGROUND DOES NOT END HERE" },
];

function updateSchedule() {
  while (state.eventCursor < schedule.length && state.raceTime >= schedule[state.eventCursor].time) {
    const item = schedule[state.eventCursor];
    showEvent(item.text, item.sub);
    if (state.eventCursor === 6) {
      state.hyper = Math.max(state.hyper, 7);
      state.boost = 1;
    }
    if (state.eventCursor === 9) state.shield = 1;
    state.eventCursor += 1;
  }
}

function finishRace() {
  if (!state || state.finishShown) return;
  state.finishShown = true;
  state.phase = "finished";
  state.speed = Math.max(0, state.speed * .35);
  const finalPosition = state.position === "TT" ? 1 : state.position;
  const lapTime = state.lapBest || state.raceTime;
  if (!pilotRecord.bestLap || lapTime < pilotRecord.bestLap) pilotRecord.bestLap = lapTime;
  if (finalPosition === 1 && mode === "race") pilotRecord.wins = Number(pilotRecord.wins || 0) + 1;
  pilotRecord.data = Number(pilotRecord.data || 0) + state.data;
  pilotRecord.credits = Number(pilotRecord.credits || 0) + state.credits;
  persistRecord();
  $("finishTitle").textContent = finalPosition === 1 ? "ORBITBROKEN" : "FINISH";
  $("finishSub").textContent = finalPosition === 1 ? "PILOT RECORD // LUNA SECTOR CLAIMED" : "RACE COMPLETE // HULL IN ONE PIECE";
  $("finishStats").innerHTML =
    "<div class=\"big\">" + (state.position === "TT" ? formatTime(state.raceTime) : "P" + state.position) + "</div>" +
    "<div class=\"kv\"><span>RACE TIME</span><b>" + formatTime(state.raceTime) + "</b></div>" +
    "<div class=\"kv\"><span>BEST LAP</span><b>" + formatTime(state.lapBest || state.raceTime) + "</b></div>" +
    "<div class=\"kv\"><span>ENERGY / DATA</span><b>" + state.credits + " / " + state.data + "</b></div>";
  $("finishmenu").classList.remove("hidden");
  $("hud").classList.remove("active");
}

function togglePause(force) {
  if (!state || state.phase === "finished" || state.phase === "menu") return;
  state.paused = force === undefined ? !state.paused : force;
  $("pausemenu").classList.toggle("hidden", !state.paused);
}

function detachToRoam() {
  if (!state || state.roaming) return;
  state.roaming = true;
  state.mode = "freeroam";
  state.route = "FREE ROAM";
  state.phase = "roam";
  state.lateral = clamp(state.lateral, -36, 36);
  state.vertical = Math.max(state.vertical, 2);
  state.verticalVelocity = 0;
  state.airborne = true;
  showEvent("DETACHED // LUNA FREE ROAM", "WRECKS, CAVES, RUINS AND SECRET SPEED TRAPS AHEAD");
  triggerBurst(playerVehicle.position, 0x5deeff, 44, 18);
  soundPulse(115, .5, "sine", .1);
}

function updateHUD() {
  if (!state) return;
  const speedKmh = Math.max(0, Math.round(Math.abs(state.speed) * 2.05));
  const placeText = state.mode === "freeroam" ? "ROAM" : state.position === "TT" ? "TT" : "P" + state.position;
  $("place").innerHTML = placeText + (state.mode === "freeroam" ? "" : "<small>/6</small>");
  $("lap").textContent = state.mode === "freeroam" ? "FREE ROAM // OPEN SPACE" : "LAP " + state.lap + "/3";
  $("timer").textContent = formatTime(state.raceTime);
  $("best").textContent = "BEST " + formatTime(state.lapBest || pilotRecord.bestLap);
  $("speed").innerHTML = speedKmh + " <small>KM/H</small>";
  $("boostfill").style.width = Math.round(state.boost * 100) + "%";
  $("boostpct").textContent = Math.round(state.boost * 100) + "%";
  $("sector").textContent = state.gravityLabel + " // " + state.route;
  $("objective").textContent = state.mode === "freeroam" ? "EXPLORE THE LUNA BELT ▸" : state.route === "EXPLORATION EXIT" ? "PRESS E // DETACH FROM ROUTE" : "FOLLOW GATE " + String(state.nextGate + 1).padStart(2, "0") + " ▸";
  $("loot").textContent = "ENERGY " + state.credits + " ◇  •  DATA " + state.data + "/24 ◆";
  $("shield").style.display = state.shield ? "block" : "none";
  $("nextgate").textContent = state.mode === "freeroam" ? "◉ ROAM RADAR // 360°" : "◉ NEXT GATE " + Math.max(0, Math.round((positiveMod((state.nextGate / gates.length) * TRACK_LENGTH - positiveMod(state.distance, TRACK_LENGTH), TRACK_LENGTH)) / 1.0)) + "m";
  $("event").textContent = state.eventTimer > 0 ? state.eventText : "";
  $("toast").textContent = state.toastTimer > 0 ? state.toast : "";
  $("near").style.opacity = state.nearTimer > 0 ? String(clamp(state.nearTimer * 2, 0, 1)) : "0";
  $("callout").textContent = state.calloutTimer > 0 ? state.callout : "";
  $("callout-sub").textContent = state.calloutTimer > 0 ? state.calloutSub : "";
  const count = state.phase === "countdown" ? Math.ceil(state.countdown) : "";
  $("countdown").textContent = count > 0 ? count : state.phase === "countdown" ? "GO" : "";
}

function drawMinimap() {
  const canvas = $("minimap");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(3,8,20,.74)";
  ctx.fillRect(0, 0, w, h);
  const pts = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < 160; i += 1) {
    const p = curve.getPointAt(i / 160);
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    pts.push(p);
  }
  const sx = (w - 26) / (maxX - minX);
  const sz = (h - 26) / (maxZ - minZ);
  const scale = Math.min(sx, sz);
  const mapPoint = (p) => ({ x: 13 + (p.x - minX) * scale + (w - 26 - (maxX - minX) * scale) / 2, y: 13 + (p.z - minZ) * scale + (h - 26 - (maxZ - minZ) * scale) / 2 });
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(9,25,49,.95)";
  ctx.beginPath();
  pts.forEach((p, i) => { const q = mapPoint(p); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#2de9ff";
  ctx.beginPath();
  pts.forEach((p, i) => { const q = mapPoint(p); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
  ctx.closePath();
  ctx.stroke();
  for (const racer of aiRacers) {
    const q = mapPoint(curve.getPointAt(positiveMod(racer.distance / TRACK_LENGTH, 1)));
    ctx.fillStyle = "#" + racer.color.toString(16).padStart(6, "0");
    ctx.fillRect(q.x - 2, q.y - 2, 4, 4);
  }
  if (state) {
    const q = mapPoint(curve.getPointAt(positiveMod(state.distance / TRACK_LENGTH, 1)));
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#2de9ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 4, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.font = "9px Segoe UI";
  ctx.fillText("LUNA // RADAR", 10, h - 8);
}

function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const item = bursts[i];
    item.life -= dt;
    for (let j = 0; j < item.velocities.length; j += 1) {
      item.velocities[j].y -= dt * 5;
      item.positions[j * 3] += item.velocities[j].x * dt;
      item.positions[j * 3 + 1] += item.velocities[j].y * dt;
      item.positions[j * 3 + 2] += item.velocities[j].z * dt;
    }
    item.points.geometry.attributes.position.needsUpdate = true;
    item.points.material.opacity = clamp(item.life / item.maxLife, 0, 1);
    if (item.life <= 0) {
      world.remove(item.points);
      item.points.geometry.dispose();
      item.points.material.dispose();
      bursts.splice(i, 1);
    }
  }
}

function updateWorld(dt) {
  worldTime += dt;
  if (starField) {
    starField.rotation.y += dt * .0018;
    starField.rotation.x = Math.sin(worldTime * .018) * .025;
  }
  dynamicWorld.forEach((item) => item.update(dt, worldTime));
  asteroids.forEach((item) => {
    item.mesh.rotation.x += dt * item.spin;
    item.mesh.rotation.y += dt * item.spin * .7;
    item.mesh.position.y += Math.sin(worldTime * .35 + item.phase) * dt * .12;
  });
  traffic.forEach((item) => {
    item.t = positiveMod(item.t + dt * item.speed, 1);
    const f = frameAt(item.t);
    const position = f.point.clone().addScaledVector(f.right, item.lateral + Math.sin(worldTime * .4 + item.phase) * 8).addScaledVector(f.up, item.height + Math.sin(worldTime * .9 + item.phase) * 6);
    item.root.position.copy(position);
    item.root.up.copy(f.up);
    item.root.lookAt(position.clone().add(f.tangent));
  });
  stormArcs.forEach((item) => {
    item.line.material.opacity = .24 + Math.max(0, Math.sin(worldTime * 8 + item.phase)) * .72;
  });
  boostPads.forEach((pad) => {
    const s = 1 + Math.sin(worldTime * 5 + pad.phase) * .08;
    pad.group.children[0].scale.y = s;
  });
  ramps.forEach((ramp) => {
    ramp.group.children.slice(1).forEach((arrow, i) => { arrow.material.opacity = .48 + Math.max(0, Math.sin(worldTime * 4 + ramp.phase + i)) * .5; });
  });
  collectibles.forEach((item, i) => {
    if (!item.collected) {
      item.group.rotation.y += dt * (1.6 + i * .02);
      item.group.position.y += Math.sin(worldTime * 2.3 + i) * dt * .06;
    }
  });
  pickups.forEach((item) => {
    if (!item.collected) {
      item.group.rotation.y -= dt * 1.1;
      item.ring.rotation.z += dt * 1.8;
    }
  });
  updateBursts(dt);
}

function updateSimulation(dt) {
  if (!state || state.paused || state.phase === "finished") return;
  if (state.phase === "countdown") {
    state.countdown -= dt;
    if (state.countdown <= 0) {
      state.phase = state.roaming ? "roam" : "race";
      state.raceTime = 0;
      showEvent(state.roaming ? "FREE ROAM // THRUSTERS LIVE" : "GO // MAKE THE TRACK SMALL", "BOOST, DRIFT, JUMP, DISCOVER");
      soundPulse(190, .34, "sawtooth", .08);
    }
    updatePlayerVisual(dt, readControls());
    return;
  }
  state.raceTime += dt;
  const controls = readControls();
  if (state.mode === "freeroam" || state.roaming) updateFreeRoam(dt, controls);
  else updatePlayer(dt, controls);
  updateAI(dt);
  updatePlayerVisual(dt, controls);
  state.eventTimer = Math.max(0, state.eventTimer - dt);
  state.calloutTimer = Math.max(0, state.calloutTimer - dt);
  state.toastTimer = Math.max(0, state.toastTimer - dt);
  state.nearTimer = Math.max(0, state.nearTimer - dt);
  updateSchedule();
  updateHUD();
  minimapTimer -= dt;
  if (minimapTimer <= 0) {
    minimapTimer = .12;
    drawMinimap();
  }
  updateAudio();
}

function soundPulse(frequency, duration, type, volume) {
  if (!audio || !audio.ctx || audio.muted) return;
  const now = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(25, frequency * .42), now + duration);
  gain.gain.setValueAtTime(volume || .04, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + duration);
  osc.connect(gain).connect(audio.master);
  osc.start(now);
  osc.stop(now + duration + .03);
}

function initAudio() {
  if (!audio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.value = .22;
    master.connect(ctx.destination);
    const engine = ctx.createOscillator();
    const engineGain = ctx.createGain();
    engine.type = "sawtooth";
    engine.frequency.value = 55;
    engineGain.gain.value = 0;
    engine.connect(engineGain).connect(master);
    engine.start();
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "triangle";
    sub.frequency.value = 37;
    subGain.gain.value = 0;
    sub.connect(subGain).connect(master);
    sub.start();
    const boost = ctx.createOscillator();
    const boostGain = ctx.createGain();
    boost.type = "square";
    boost.frequency.value = 130;
    boostGain.gain.value = 0;
    boost.connect(boostGain).connect(master);
    boost.start();
    audio = { ctx, master, engine, engineGain, sub, subGain, boost, boostGain, muted: false, note: 0 };
    audio.musicTimer = setInterval(() => {
      if (!audio || audio.muted || !state || state.paused) return;
      const notes = [110, 138.59, 164.81, 220, 184.99, 146.83];
      soundPulse(notes[audio.note % notes.length], .24, "triangle", .026);
      audio.note += 1;
    }, 540);
  }
  if (audio.ctx.state === "suspended") audio.ctx.resume();
}

function updateAudio() {
  if (!audio || !state) return;
  const speed = Math.abs(state.speed);
  const boostOn = keys.Shift && state.boost > .01 && speed > 17;
  const now = audio.ctx.currentTime;
  audio.engine.frequency.setTargetAtTime(42 + speed * 2.3, now, .04);
  audio.sub.frequency.setTargetAtTime(28 + speed * 1.16, now, .05);
  audio.engineGain.gain.setTargetAtTime(audio.muted ? 0 : .018 + speed * .00055, now, .08);
  audio.subGain.gain.setTargetAtTime(audio.muted ? 0 : .012 + speed * .00028, now, .08);
  audio.boost.frequency.setTargetAtTime(120 + speed * 3.8, now, .04);
  audio.boostGain.gain.setTargetAtTime(audio.muted || !boostOn ? 0 : .03 + speed * .0005, now, .06);
}

function toggleMute() {
  if (!audio) initAudio();
  if (!audio) return;
  audio.muted = !audio.muted;
  audio.master.gain.setTargetAtTime(audio.muted ? 0 : .22, audio.ctx.currentTime, .05);
  showToast(audio.muted ? "AUDIO MUTED" : "AUDIO ONLINE // ENGINE PITCH LIVE");
}

function bindUI() {
  document.querySelectorAll(".mode").forEach((card) => {
    card.addEventListener("click", () => { mode = card.dataset.mode; renderMenu(); });
  });
  $("launch").addEventListener("click", () => startSession(mode));
  $("how").addEventListener("click", () => { const box = $("howBox"); box.hidden = !box.hidden; });
  $("resume").addEventListener("click", () => togglePause(false));
  $("restart").addEventListener("click", () => startSession(mode));
  $("quit").addEventListener("click", quitToMenu);
  $("again").addEventListener("click", () => startSession("race"));
  $("roam").addEventListener("click", () => startSession("freeroam"));
  $("menu").addEventListener("click", quitToMenu);
  window.addEventListener("keydown", (event) => {
    const key = event.key === " " ? " " : event.key;
    keys[key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) event.preventDefault();
    if (event.repeat) return;
    if (key === "Escape" || key.toLowerCase() === "p") togglePause();
    if (key.toLowerCase() === "r" && state && state.phase !== "finished") recoverPlayer();
    if (key.toLowerCase() === "c" && state) { state.cameraFar = !state.cameraFar; showToast(state.cameraFar ? "CHASE CAM // FAR" : "CHASE CAM // CLOSE"); }
    if (key.toLowerCase() === "m") toggleMute();
    if (key.toLowerCase() === "e" && state && state.route === "EXPLORATION EXIT") detachToRoam();
  });
  window.addEventListener("keyup", (event) => {
    const key = event.key === " " ? " " : event.key;
    keys[key] = false;
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state && state.phase !== "finished") togglePause(true); });
  window.addEventListener("resize", () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  const now = performance.now();
  const dt = Math.min(.05, Math.max(.001, (now - lastFrame) / 1000));
  lastFrame = now;
  updateWorld(dt);
  updateSimulation(dt);
  if (state) {
    updateHUD();
    if (!state.paused && state.phase !== "finished") updateAudio();
  }
  renderer.render(scene, camera);
}

createWorld();
bindUI();
renderMenu();
renderFrame();
