import * as THREE from 'three';
/* ============================================================
   ORBITBREAKERS — complete arcade space racer (single file)
   Systems: track spline + shortcuts, arcade hover physics,
   5 AI personalities, race/timetrial/freeroam, wormholes,
   storms, mining hazards, alien rings, pickups, breakables,
   events, procedural audio+music, VFX pools, HUD/minimap,
   progression in localStorage.
   ============================================================ */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- save / progression ---------- */
const SAVE_KEY='orbitbreakers_save_v1';
let save={credits:0,shards:[],bestLap:null,wins:0,races:0,unlocked:['v1','v2'],paint:0,discovered:[]};
try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&typeof s==='object')save={...save,...s};}catch(e){}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}

/* ---------- vehicles ---------- */
const VEHICLES=[
 {id:'v1',name:'KESTREL-7',desc:'Balanced interceptor',top:235,acc:52,grip:1.0,boost:1.0,unlock:0},
 {id:'v2',name:'HALCYON DART',desc:'High acceleration',top:222,acc:72,grip:1.05,boost:1.0,unlock:0},
 {id:'v3',name:'VEX LONGSHOT',desc:'Top-speed monster',top:262,acc:44,grip:.92,boost:1.12,unlock:150,price:150},
 {id:'v4',name:'MULE-9 HEAVY',desc:'Tank, smashes debris',top:228,acc:55,grip:1.1,boost:.95,unlock:250,price:250},
 {id:'v5',name:'SERAPH GLIDE',desc:'Grip + drift king',top:230,acc:58,grip:1.28,boost:1.0,unlock:400,price:400},
 {id:'v6',name:'XENO WISP',desc:'Alien tech, wild boost',top:248,acc:62,grip:1.0,boost:1.3,unlock:600,price:600},
];
const PAINTS=[0x19e8ff,0xff7a1a,0xff2e88,0x9dff3e,0xb78bff,0xffd23e];
let selVeh=0, selPaint=save.paint||0, selMode='race';

/* ---------- audio (all procedural) ---------- */
const AudioSys={ctx:null,master:null,engOsc:null,engOsc2:null,engGain:null,engFilter:null,boostGain:null,boostSrc:null,musicGain:null,muted:false,started:false,seqTimer:0,seqStep:0,
 init(){if(this.started)return;this.started=true;try{
  const C=new (window.AudioContext||window.webkitAudioContext)();this.ctx=C;
  this.master=C.createGain();this.master.gain.value=.8;this.master.connect(C.destination);
  this.musicGain=C.createGain();this.musicGain.gain.value=.30;this.musicGain.connect(this.master);
  // engine: saw + square detune through lowpass
  this.engGain=C.createGain();this.engGain.gain.value=0;this.engFilter=C.createBiquadFilter();this.engFilter.type='lowpass';this.engFilter.frequency.value=400;
  this.engOsc=C.createOscillator();this.engOsc.type='sawtooth';this.engOsc.frequency.value=60;
  this.engOsc2=C.createOscillator();this.engOsc2.type='square';this.engOsc2.frequency.value=30;
  const g2=C.createGain();g2.gain.value=.4;this.engOsc.connect(this.engFilter);this.engOsc2.connect(g2);g2.connect(this.engFilter);this.engFilter.connect(this.engGain);this.engGain.connect(this.master);
  this.engOsc.start();this.engOsc2.start();
  // boost noise loop
  const nb=C.createBuffer(1,C.sampleRate*1,C.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  this.boostSrc=C.createBufferSource();this.boostSrc.buffer=nb;this.boostSrc.loop=true;
  const bf=C.createBiquadFilter();bf.type='bandpass';bf.frequency.value=2400;bf.Q.value=.7;
  this.boostGain=C.createGain();this.boostGain.gain.value=0;this.boostSrc.connect(bf);bf.connect(this.boostGain);this.boostGain.connect(this.master);this.boostSrc.start();
  // ambient pad
  const pad=C.createOscillator();pad.type='sine';pad.frequency.value=55;const pg=C.createGain();pg.gain.value=.05;pad.connect(pg);pg.connect(this.master);pad.start();
  const lfo=C.createOscillator();lfo.frequency.value=.07;const lg=C.createGain();lg.gain.value=.025;lfo.connect(lg);lg.connect(pg.gain);lfo.start();
 }catch(e){}},
 engine(speed01,boosting){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;const f=50+speed01*160+(boosting?60:0);
  this.engOsc.frequency.setTargetAtTime(f,t,.06);this.engOsc2.frequency.setTargetAtTime(f*.5,t,.06);this.engFilter.frequency.setTargetAtTime(300+speed01*2600+(boosting?1500:0),t,.08);
  this.engGain.gain.setTargetAtTime(.10+speed01*.12,t,.09);this.boostGain.gain.setTargetAtTime(boosting?.16:0,t,.1);},
 blip(freq=880,dur=.12,type='square',vol=.2){if(!this.ctx||this.muted)return;try{const C=this.ctx,o=C.createOscillator(),g=C.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,C.currentTime);g.gain.exponentialRampToValueAtTime(.001,C.currentTime+dur);o.connect(g);g.connect(this.master);o.start();o.stop(C.currentTime+dur);}catch(e){}},
 checkpoint(){this.blip(660,.12,'square',.25);setTimeout(()=>this.blip(990,.16,'square',.25),90);},
 pickup(){this.blip(1200,.1,'sine',.3);setTimeout(()=>this.blip(1600,.12,'sine',.25),70);},
 count(n){this.blip(n===0?880:440,.18,'square',.3);},
 crash(){if(!this.ctx||this.muted)return;try{const C=this.ctx,b=C.createBuffer(1,C.sampleRate*.25,C.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=C.createBufferSource();s.buffer=b;const g=C.createGain();g.gain.value=.5;const f=C.createBiquadFilter();f.type='lowpass';f.frequency.value=900;s.connect(f);f.connect(g);g.connect(this.master);s.start();}catch(e){}},
 boom(){this.blip(90,.5,'sawtooth',.4);this.blip(55,.7,'sine',.4);},
 hyper(){this.blip(200,.5,'sawtooth',.3);setTimeout(()=>this.blip(400,.4,'sawtooth',.3),120);setTimeout(()=>this.blip(800,.5,'sawtooth',.3),240);},
 zap(){this.blip(rand(1800,3200),.08,'sawtooth',.15);},
 // tiny techno sequencer: bass + hats + lead, intensity 0..1
 music(intensity){if(!this.ctx||this.muted)return;const C=this.ctx;if(C.currentTime-this.seqTimer<.21)return;this.seqTimer=C.currentTime;this.seqStep=(this.seqStep+1)%32;
  const bass=[55,0,55,0,65.4,0,55,0,49,0,49,0,58.3,0,73.4,0,55,0,55,0,65.4,0,55,0,49,0,58.3,0,82.4,73.4,65.4,49];
  const b=bass[this.seqStep];if(b){const o=C.createOscillator(),g=C.createGain();o.type='sawtooth';o.frequency.value=b;const f=C.createBiquadFilter();f.type='lowpass';f.frequency.value=300+intensity*900;g.gain.setValueAtTime(.16,C.currentTime);g.gain.exponentialRampToValueAtTime(.001,C.currentTime+.2);o.connect(f);f.connect(g);g.connect(this.musicGain);o.start();o.stop(C.currentTime+.22);}
  if(this.seqStep%2===0&&intensity>.25){const o=C.createOscillator(),g=C.createGain();o.type='square';o.frequency.value=6000+Math.random()*2000;g.gain.setValueAtTime(.03,C.currentTime);g.gain.exponentialRampToValueAtTime(.001,C.currentTime+.05);o.connect(g);g.connect(this.musicGain);o.start();o.stop(C.currentTime+.06);}
  if(intensity>.55&&(this.seqStep%8===4)){const scale=[220,261.6,293.7,329.6,392,440,523.2];const n=pick(scale);const o=C.createOscillator(),g=C.createGain();o.type='sawtooth';o.frequency.value=n*2;g.gain.setValueAtTime(.05,C.currentTime);g.gain.exponentialRampToValueAtTime(.001,C.currentTime+.3);o.connect(g);g.connect(this.musicGain);o.start();o.stop(C.currentTime+.32);}
 },
 toggleMute(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.8;return this.muted;}
};

/* ---------- input ---------- */
const Input={keys:{},joy:{x:0,rt:0,lt:0,boost:false},padOn:false,
 init(){addEventListener('keydown',e=>{this.keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();handleKey(e.code);});
 addEventListener('keyup',e=>{this.keys[e.code]=false;});
 addEventListener('gamepadconnected',()=>{this.padOn=true;toast('GAMEPAD CONNECTED');});},
 get accel(){return (this.keys['KeyW']||this.keys['ArrowUp']||this.joy.rt>0.15)?1:0;},
 get brake(){return (this.keys['KeyS']||this.keys['ArrowDown']||this.joy.lt>0.15)?1:0;},
 get steer(){let s=0;if(this.keys['KeyA']||this.keys['ArrowLeft'])s-=1;if(this.keys['KeyD']||this.keys['ArrowRight'])s+=1;return clamp(s+this.joy.x,-1,1);},
 get boost(){return !!(this.keys['ShiftLeft']||this.keys['ShiftRight']||this.joy.boost);},
 get drift(){return !!(this.keys['Space']||this.joy.drift);},
 pollPad(){try{const ps=navigator.getGamepads?navigator.getGamepads():[];for(const p of ps){if(!p)continue;const dz=v=>Math.abs(v)>.12?v:0;this.joy.x=dz(p.axes[0]||0);this.joy.rt=p.buttons[7]?p.buttons[7].value:(p.buttons[0]&&p.buttons[0].pressed?1:0);this.joy.lt=p.buttons[6]?p.buttons[6].value:0;this.joy.boost=!!(p.buttons[0]&&p.buttons[0].pressed);this.joy.drift=!!(p.buttons[1]&&p.buttons[1].pressed);if(p.buttons[9]&&p.buttons[9].pressed)handleKey('Enter');break;}}catch(e){}}
};

/* ---------- three setup ---------- */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
addEventListener('resize',()=>renderer.setSize(innerWidth,innerHeight));
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x02030a);
scene.fog=new THREE.FogExp2(0x050818,0.00016);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.5,30000);
camera.position.set(0,60,-120);
const hemi=new THREE.HemisphereLight(0x8fb8ff,0x1a0b2e,.85);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dd,1.6);sun.position.set(1800,1200,-800);scene.add(sun);
const amb=new THREE.AmbientLight(0x334466,.7);scene.add(amb);
const boostLight=new THREE.PointLight(0x19e8ff,0,900);scene.add(boostLight);
let stormLight=new THREE.PointLight(0x9d6bff,0,4000);scene.add(stormLight);

/* ---------- canvas textures ---------- */
function glowTex(inner='#fff',outer='rgba(0,0,0,0)'){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,inner);gr.addColorStop(1,outer);g.fillStyle=gr;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);return t;}
const TEX={glow:glowTex('#fff','rgba(25,232,255,0)'),orange:glowTex('#ffd9a0','rgba(255,122,26,0)'),pink:glowTex('#fff','rgba(255,46,136,0)'),soft:glowTex('rgba(255,255,255,.9)','rgba(255,255,255,0)')};
function planetTexture(base,band,spot){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,base);gr.addColorStop(.5,band);gr.addColorStop(1,base);g.fillStyle=gr;g.fillRect(0,0,256,128);g.fillStyle=spot;for(let i=0;i<40;i++){g.globalAlpha=rand(.05,.25);g.beginPath();g.ellipse(rand(256),rand(128),rand(4,26),rand(2,8),rand(3),0,7);g.fill();}g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

/* ============================================================
   TRACK — closed loop through Sector 7
   ============================================================ */
const TRACK_HALF=20;
const ctrlPts=[
 [0,0,-1500],[420,20,-1420],[760,60,-1180],[900,140,-820],[820,220,-460],[560,260,-260],[700,180,80],[1050,120,300],[1250,60,650],[1180,-40,1000],[900,-60,1250],[520,-20,1380],[180,60,1250],[40,140,950],[-160,200,700],[-520,240,780],[-820,200,560],[-980,120,220],[-880,40,-120],[-980,-20,-480],[-760,-40,-820],[-420,-10,-1050],[-160,10,-1280],
].map(p=>new THREE.Vector3(p[0],p[1],p[2]));
const curve=new THREE.CatmullRomCurve3(ctrlPts,true,'catmullrom',0.6);
const SAMPLES=1400;
const sPts=curve.getSpacedPoints(SAMPLES);sPts.pop();
const sTan=[];for(let i=0;i<SAMPLES;i++){const t=i/SAMPLES;const tn=curve.getTangentAt((t+0.0005)%1).normalize();sTan.push(tn);}
const trackLen=curve.getLength();
// roll profile: 0 default, wall-ride ~0.30-0.38 (90deg), ceiling ~0.55-0.60 (180deg)
function rollAt(t){let r=0;
 const wall=smoothBand(t,0.30,0.335,0.365,0.40)*Math.PI/2;
 const ceil=smoothBand(t,0.55,0.565,0.60,0.62)*Math.PI;
 const bank=Math.sin(t*TAU*3)*0.12+Math.sin(t*TAU*7)*0.06;
 return wall+ceil+bank;}
function smoothBand(t,a,b,c,d){const s=(x,y)=>{const u=clamp((t-x)/(y-x),0,1);return u*u*(3-2*u);};return s(a,b)*(1-s(c,d));}
function frameAt(t){const i=((Math.floor(t*SAMPLES)%SAMPLES)+SAMPLES)%SAMPLES;const tan=sTan[i];
 const up0=new THREE.Vector3(0,1,0);let side=new THREE.Vector3().crossVectors(tan,up0);if(side.lengthSq()<1e-4)side.set(1,0,0);side.normalize();
 const up=new THREE.Vector3().crossVectors(side,tan).normalize();
 const roll=rollAt(t);const side2=side.clone().multiplyScalar(Math.cos(roll)).add(up.clone().multiplyScalar(Math.sin(roll)));
 const up2=up.clone().multiplyScalar(Math.cos(roll)).add(side.clone().multiplyScalar(-Math.sin(roll)));
 return {pos:sPts[i].clone(),tan:tan.clone(),side:side2,up:up2,idx:i};}
function nearestT(pos,lastT){let best=lastT,bd=1e18;const c=Math.floor(lastT*SAMPLES);
 for(let k=-46;k<=46;k++){const i=((c+k)%SAMPLES+SAMPLES)%SAMPLES;const d=sPts[i].distanceToSquared(pos);if(d<bd){bd=d;best=i/SAMPLES;}}
 // global fallback if very far
 if(bd>220*220){for(let i=0;i<SAMPLES;i+=8){const d=sPts[i].distanceToSquared(pos);if(d<bd){bd=d;best=i/SAMPLES;}}}
 return {t:best,dist:Math.sqrt(bd)};}
const zeroGAt=t=>(t>0.18&&t<0.24)||(t>0.62&&t<0.68); // jump void + wormhole approach

/* track meshes */
const trackGroup=new THREE.Group();scene.add(trackGroup);
function buildTrackMesh(){
 const verts=[],norms=[],cols=[],idx=[],uvs=[];
 const cA=new THREE.Color(0x141c33),cB=new THREE.Color(0x1d2745),cEdge=new THREE.Color(0x19e8ff),cOr=new THREE.Color(0xff7a1a);
 for(let i=0;i<=SAMPLES;i+=2){const t=(i%SAMPLES)/SAMPLES;const f=frameAt(t);
  const w=TRACK_HALF,rows=[-1,-0.55,0,0.55,1];
  for(let r=0;r<rows.length;r++){const p=f.pos.clone().add(f.side.clone().multiplyScalar(rows[r]*w)).add(f.up.clone().multiplyScalar(Math.abs(rows[r])>0.9?1.4:0));
   verts.push(p.x,p.y,p.z);norms.push(f.up.x,f.up.y,f.up.z);uvs.push(t*220,r/4);
   let col=(Math.floor(t*220)%2===0)?cA:cB;if(Math.abs(rows[r])>0.9)col=(Math.floor(t*60)%2===0)?cEdge:cOr;
   cols.push(col.r,col.g,col.b);}
 }
 const W=5;const rowsN=Math.floor(SAMPLES/2)+1;
 for(let i=0;i<rowsN-1;i++)for(let r=0;r<W-1;r++){const a=i*W+r,b=a+1,c=a+W,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(idx);
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.75,emissive:0x0a1428,emissiveIntensity:.7,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(g,m);trackGroup.add(mesh);
 // under-glow ribbon
 const g2=new THREE.BufferGeometry();const v2=[];for(let i=0;i<=SAMPLES;i+=4){const t=(i%SAMPLES)/SAMPLES;const f=frameAt(t);const p=f.pos.clone().add(f.up.clone().multiplyScalar(-2.5));v2.push(p.x,p.y,p.z);}
 g2.setAttribute('position',new THREE.Float32BufferAttribute(v2,3));
 const glow=new THREE.Line(g2,new THREE.LineBasicMaterial({color:0x19e8ff,transparent:true,opacity:.5}));trackGroup.add(glow);
 // edge rails
 for(const s of [-1,1]){const pts=[];for(let i=0;i<SAMPLES;i+=6){const t=i/SAMPLES;const f=frameAt(t);pts.push(f.pos.clone().add(f.side.clone().multiplyScalar(s*(TRACK_HALF+1))).add(f.up.clone().multiplyScalar(2.6)));}
  const rg=new THREE.BufferGeometry().setFromPoints(pts);const rl=new THREE.LineLoop(rg,new THREE.LineBasicMaterial({color:s<0?0x19e8ff:0xff7a1a,transparent:true,opacity:.85}));trackGroup.add(rl);}
}
buildTrackMesh();
// start gantry
function buildGantry(){const f=frameAt(0);const g=new THREE.Group();
 const mat=new THREE.MeshStandardMaterial({color:0x2a3a5f,metalness:.8,roughness:.4,emissive:0x0a2038,emissiveIntensity:.8});
 for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(8,90,8),mat);p.position.copy(f.pos).add(f.side.clone().multiplyScalar(s*30)).add(f.up.clone().multiplyScalar(40));p.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),f.up);g.add(p);}
 const top=new THREE.Mesh(new THREE.BoxGeometry(76,10,14),mat);top.position.copy(f.pos).add(f.up.clone().multiplyScalar(86));top.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));g.add(top);
 const holo=new THREE.Mesh(new THREE.PlaneGeometry(60,12),new THREE.MeshBasicMaterial({color:0x19e8ff,transparent:true,opacity:.8,side:THREE.DoubleSide}));
 holo.position.copy(top.position).add(f.up.clone().multiplyScalar(-8));holo.quaternion.copy(top.quaternion);g.add(holo);g.userData.holo=holo;
 // floodlight cones
 for(let i=0;i<6;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(6,60,10,1,true),new THREE.MeshBasicMaterial({color:0x9df2ff,transparent:true,opacity:.10,side:THREE.DoubleSide,depthWrite:false}));cone.position.copy(f.pos).add(f.side.clone().multiplyScalar(rand(-24,24))).add(f.up.clone().multiplyScalar(30));cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),f.up.clone().negate());g.add(cone);}
 scene.add(g);return g;}
const gantry=buildGantry();

/* boost pads, gates, ramps, pickups data */
const pads=[];const gates=[];const pickups=[];const breakables=[];const lasers=[];const turbines=[];const closers=[];const shards=[];
function addPad(t,lane){const f=frameAt(t);const m=new THREE.Mesh(new THREE.PlaneGeometry(10,16),new THREE.MeshBasicMaterial({color:0x27e9ff,transparent:true,opacity:.95,side:THREE.DoubleSide}));
 m.position.copy(f.pos).add(f.side.clone().multiplyScalar(lane)).add(f.up.clone().multiplyScalar(.5));m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));m.rotateX(-Math.PI/2);
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(16,24),new THREE.MeshBasicMaterial({map:TEX.glow,color:0x19e8ff,transparent:true,opacity:.5,depthWrite:false}));glow.position.copy(m.position);glow.quaternion.copy(m.quaternion);scene.add(glow);
 scene.add(m);pads.push({t,lane,mesh:m,glow,cd:0});}
for(let i=0;i<26;i++){const t=(i/26+0.012)%1;addPad(t,(i%3-1)*9);}
addPad(0.02,0);addPad(0.025,0); // launch pads: instant action
function addGate(t,big=false){const f=frameAt(t);const R=big?46:30;
 const g=new THREE.Mesh(new THREE.TorusGeometry(R,1.6,big?12:8,40),new THREE.MeshBasicMaterial({color:big?0xffd23e:0x19e8ff}));
 g.position.copy(f.pos).add(f.up.clone().multiplyScalar(10));g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));scene.add(g);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(R-4,.5,6,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7}));inner.position.copy(g.position);inner.quaternion.copy(g.quaternion);scene.add(inner);
 gates.push({t,mesh:g,inner,R});return g;}
const GATE_N=14;for(let i=0;i<GATE_N;i++)addGate(i/GATE_N,i===0);
function addPickup(t,lane,kind){const f=frameAt(t);const colors={energy:0x19e8ff,shield:0x7dffd4,hyper:0xff7a1a,emp:0xff2e88,credit:0xffd23e,shard:0xb78bff};
 const geo=kind==='shard'?new THREE.OctahedronGeometry(2.6):kind==='credit'?new THREE.IcosahedronGeometry(2):new THREE.OctahedronGeometry(3.2);
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:colors[kind]||0xffffff,emissive:colors[kind]||0xffffff,emissiveIntensity:1.6,metalness:.2,roughness:.2}));
 m.position.copy(f.pos).add(f.side.clone().multiplyScalar(lane)).add(f.up.clone().multiplyScalar(7));scene.add(m);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.glow,color:colors[kind],transparent:true,opacity:.7,depthWrite:false}));halo.scale.set(14,14,1);halo.position.copy(m.position);scene.add(halo);
 const p={t,lane,kind,mesh:m,halo,taken:false,respawn:0,baseY:m.position.y};pickups.push(p);if(kind==='shard')shards.push(p);return p;}
// energy line in first 10s, hyper at 30s, shield before storm, shards hidden
for(let i=0;i<10;i++)addPickup(0.03+i*0.012,(i%2?6:-6),'energy');
addPickup(0.16,0,'energy');addPickup(0.20,8,'credit');addPickup(0.26,-8,'energy');
addPickup(0.33,0,'hyper');addPickup(0.44,6,'energy');addPickup(0.47,-6,'emp');
addPickup(0.55,0,'shield');addPickup(0.60,8,'energy');addPickup(0.66,0,'hyper');
addPickup(0.70,-8,'shield');addPickup(0.78,6,'energy');addPickup(0.82,0,'credit');
addPickup(0.88,-6,'emp');addPickup(0.93,8,'energy');addPickup(0.97,0,'energy');
for(let i=0;i<24;i++){const t=(i*0.041+0.017)%1;const hide=i%3===0;addPickup(t,hide?rand(-26,26):rand(-12,12),'shard');}
// free-roam shards far from track
const roamShards=[];for(let i=0;i<10;i++){const a=rand(TAU),r=rand(900,2200);const m=new THREE.Mesh(new THREE.OctahedronGeometry(3),new THREE.MeshStandardMaterial({color:0xb78bff,emissive:0xb78bff,emissiveIntensity:2}));m.position.set(Math.cos(a)*r,rand(-150,450),Math.sin(a)*r-100);scene.add(m);roamShards.push({mesh:m,taken:false});}

/* breakable crates/debris on track edges */
function addBreakable(t,lane){const f=frameAt(t);const m=new THREE.Mesh(new THREE.BoxGeometry(5,5,5),new THREE.MeshStandardMaterial({color:0x8a5a2a,metalness:.6,roughness:.5,emissive:0x431e00,emissiveIntensity:.6}));
 m.position.copy(f.pos).add(f.side.clone().multiplyScalar(lane)).add(f.up.clone().multiplyScalar(4));m.rotation.set(rand(3),rand(3),rand(3));scene.add(m);
 breakables.push({mesh:m,taken:false,spin:rand(-2,2)});}
for(let i=0;i<40;i++)addBreakable(rand(1),pick([-16,-13,13,16]));

/* mining lasers (t .40-.46), closing gates, turbines */
function buildHazards(){
 for(let i=0;i<5;i++){const t=0.40+i*0.014;const f=frameAt(t);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(60,1.2,1.2),new THREE.MeshBasicMaterial({color:0xff2244}));
  beam.position.copy(f.pos).add(f.up.clone().multiplyScalar(6));beam.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));scene.add(beam);
  const src=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),new THREE.MeshStandardMaterial({color:0x333844,emissive:0xff2244,emissiveIntensity:1}));src.position.copy(f.pos).add(f.side.clone().multiplyScalar(-32)).add(f.up.clone().multiplyScalar(6));scene.add(src);
  const src2=src.clone();src2.position.copy(f.pos).add(f.side.clone().multiplyScalar(32)).add(f.up.clone().multiplyScalar(6));scene.add(src2);
  lasers.push({t,mesh:beam,phase:rand(TAU),f});}
 for(let i=0;i<3;i++){const t=0.50+i*0.02;const f=frameAt(t);const g=new THREE.Group();
  for(const s of [-1,1]){const jaw=new THREE.Mesh(new THREE.BoxGeometry(4,26,6),new THREE.MeshStandardMaterial({color:0x55607a,metalness:.8,roughness:.4,emissive:0xff7a1a,emissiveIntensity:.5}));jaw.position.set(s*14,13,0);g.add(jaw);}
  g.position.copy(f.pos);g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));scene.add(g);closers.push({t,g,phase:rand(TAU)});}
 for(let i=0;i<2;i++){const t=0.52+i*0.05;const f=frameAt(t);const tur=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(24,2.5,8,24),new THREE.MeshStandardMaterial({color:0x39415c,metalness:.85,roughness:.35}));tur.add(ring);
  const blades=new THREE.Group();for(let b=0;b<4;b++){const bl=new THREE.Mesh(new THREE.BoxGeometry(2,20,4),new THREE.MeshStandardMaterial({color:0x777f99,metalness:.7,roughness:.4}));bl.rotation.z=b*Math.PI/4;blades.add(bl);}tur.add(blades);
  tur.position.copy(f.pos).add(f.up.clone().multiplyScalar(4));tur.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));scene.add(tur);turbines.push({tur,blades,t});}
}
buildHazards();

/* shortcuts: two chord ribbons */
const shortcuts=[];
function buildShortcut(t0,t1,lift=30){const a=frameAt(t0).pos,b=frameAt(t1).pos;const mid=a.clone().add(b).multiplyScalar(.5);mid.y+=lift;mid.add(new THREE.Vector3(rand(-80,80),0,rand(-80,80)));
 const c=new THREE.CatmullRomCurve3([a,mid,b]);const pts=c.getSpacedPoints(40);
 const g=new THREE.BufferGeometry().setFromPoints(pts);
 // ribbon visual: two edge lines + translucent deck
 const deck=[];for(let i=0;i<pts.length;i++){const tan=c.getTangent(i/(pts.length-1));const side=new THREE.Vector3().crossVectors(tan,new THREE.Vector3(0,1,0)).normalize().multiplyScalar(TRACK_HALF*0.6);
  deck.push(pts[i].clone().add(side),pts[i].clone().sub(side));}
 const dg=new THREE.BufferGeometry();const dv=[];deck.forEach(p=>dv.push(p.x,p.y,p.z));dg.setAttribute('position',new THREE.Float32BufferAttribute(dv,3));
 const di=[];for(let i=0;i<pts.length-1;i++){const a2=i*2;di.push(a2,a2+2,a2+1,a2+1,a2+2,a2+3);}dg.setIndex(di);dg.computeVertexNormals();
 const mesh=new THREE.Mesh(dg,new THREE.MeshStandardMaterial({color:0x3a2a55,metalness:.7,roughness:.5,emissive:0xff2e88,emissiveIntensity:.25,side:THREE.DoubleSide,transparent:true,opacity:.92}));scene.add(mesh);
 const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xff2e88}));scene.add(line);
 // entry sign
 const f=frameAt(t0);const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.pink,color:0xff2e88,transparent:true,opacity:.9,depthWrite:false}));sign.scale.set(26,26,1);sign.position.copy(f.pos).add(f.up.clone().multiplyScalar(26));scene.add(sign);
 shortcuts.push({t0,t1,curve:c,sign});}
buildShortcut(0.24,0.29,60);buildShortcut(0.46,0.52,40);buildShortcut(0.80,0.86,50);

/* wormholes */
const wormholes=[];
function buildWormhole(pos,R,color=0xb78bff){const g=new THREE.Group();
 const ring=new THREE.Mesh(new THREE.TorusGeometry(R,3,12,48),new THREE.MeshBasicMaterial({color}));g.add(ring);
 const disc=new THREE.Mesh(new THREE.CircleGeometry(R-2,40),new THREE.MeshBasicMaterial({color:0x0a0618,transparent:true,opacity:.85,side:THREE.DoubleSide}));g.add(disc);
 const swirl=new THREE.Mesh(new THREE.RingGeometry(R*0.2,R-3,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide}));g.add(swirl);g.userData.swirl=swirl;
 g.position.copy(pos);scene.add(g);wormholes.push({g,R,swirl});return g;}
{const f1=frameAt(0.63);buildWormhole(f1.pos.clone().add(f1.up.clone().multiplyScalar(12)),34).lookAt(f1.pos.clone().add(f1.tan.clone().multiplyScalar(100)));
 const w2=buildWormhole(new THREE.Vector3(1600,300,1800),40);const w3=buildWormhole(new THREE.Vector3(-1700,200,-1400),40);w2.userData.link=w3;w3.userData.link=w2;}

/* ============================================================
   WORLD — planets, rings, stations, ships, asteroids, city…
   ============================================================ */
const worldUpdaters=[];
function addPlanet(pos,R,base,band,spot,ring=false){const m=new THREE.Mesh(new THREE.SphereGeometry(R,48,32),new THREE.MeshStandardMaterial({map:planetTexture(base,band,spot),roughness:1,metalness:0}));m.position.copy(pos);scene.add(m);
 if(ring){const rg=new THREE.Mesh(new THREE.RingGeometry(R*1.25,R*2.1,72),new THREE.MeshBasicMaterial({color:0xcfe6ff,transparent:true,opacity:.35,side:THREE.DoubleSide}));rg.position.copy(pos);rg.rotation.x=Math.PI/2.4;scene.add(rg);}
 worldUpdaters.push({u:(t)=>{m.rotation.y=t*0.004;}});return m;}
addPlanet(new THREE.Vector3(-2600,900,-4200),1500,'#1a2f7a','#4d7dd1','#0a1030',false); // blue giant backdrop
addPlanet(new THREE.Vector3(3400,500,-1800),900,'#7a3a1a','#d18a4d','#2a0f00',true);      // saturn-like (rings!)
addPlanet(new THREE.Vector3(800,-2200,600),1100,'#123a2a','#3fae7a','#04140c');          // green below (planet rise at finish)
addPlanet(new THREE.Vector3(-800,600,3200),260,'#555566','#9999aa','#22222a');           // moon
addPlanet(new THREE.Vector3(2200,-300,2400),180,'#6a1a2a','#c14d5d','#1a050a');          // red moon
// sun disc + eclipse shadow vibe
{const s=new THREE.Mesh(new THREE.SphereGeometry(400,24,16),new THREE.MeshBasicMaterial({color:0xfff3d0}));s.position.set(6000,2500,-7000);scene.add(s);
 const h=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.orange,color:0xffcc88,transparent:true,opacity:.9,depthWrite:false}));h.scale.set(2600,2600,1);h.position.copy(s.position);scene.add(h);}
// stars
{const n=3500,pos=new Float32Array(n*3),col=new Float32Array(n*3);const c=new THREE.Color();
 for(let i=0;i<n;i++){const r=14000,a=rand(TAU),b=Math.acos(rand(-1,1));pos[i*3]=r*Math.sin(b)*Math.cos(a);pos[i*3+1]=r*Math.cos(b);pos[i*3+2]=r*Math.sin(b)*Math.sin(a);
  c.setHSL(rand(1),rand(.2,.8),rand(.55,1));col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:22,vertexColors:true,sizeAttenuation:true,transparent:true,opacity:.95,map:TEX.soft,depthWrite:false,blending:THREE.AdditiveBlending})));}
// asteroids (instanced) + movers
let astMesh;{const geo=new THREE.DodecahedronGeometry(1,0);const mat=new THREE.MeshStandardMaterial({color:0x6a6f82,roughness:.9,metalness:.25});
 astMesh=new THREE.InstancedMesh(geo,mat,340);const d=new THREE.Object3D();const data=[];
 for(let i=0;i<340;i++){const a=rand(TAU),r=i<120?rand(250,700):rand(800,3200);const p=new THREE.Vector3(Math.cos(a)*r,rand(-500,700),Math.sin(a)*r-200);const s=i<40?rand(18,60):rand(4,26);
  d.position.copy(p);d.rotation.set(rand(3),rand(3),rand(3));d.scale.setScalar(s);d.updateMatrix();astMesh.setMatrixAt(i,d.matrix);data.push({p,s,rot:rand(.1,.8),move:i<50});}
 scene.add(astMesh);worldUpdaters.push({u:(t,dt)=>{let dirty=false;for(let i=0;i<50;i++){const A=data[i];A.p.x+=Math.sin(t*.1+i)*dt*4;A.p.y+=Math.cos(t*.13+i*2)*dt*3;d.position.copy(A.p);d.rotation.set(t*A.rot,t*A.rot*.7,0);d.scale.setScalar(A.s);d.updateMatrix();astMesh.setMatrixAt(i,d.matrix);dirty=true;}if(dirty)astMesh.instanceMatrix.needsUpdate=true;}});}
// ice particles in ring zone + dust everywhere
function makePoints(n,size,color,op){const g=new THREE.BufferGeometry();const p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=rand(-3000,3000);p[i*3+1]=rand(-600,900);p[i*3+2]=rand(-3000,3000);}g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const m=new THREE.Points(g,new THREE.PointsMaterial({size,map:TEX.soft,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(m);return m;}
const dust=makePoints(900,3,0x88bbff,.5),ice=makePoints(700,2.4,0xcfefff,.8);
// orbital station (start) + mining facility + floating city + alien structure + wrecks + satellites + turbines distant
function box(w,h,d,color,em=0){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,metalness:.75,roughness:.4,emissive:em,emissiveIntensity:.6}));}
{ // big station ring near start
 const f=frameAt(0.995);const st=new THREE.Group();const ringM=new THREE.Mesh(new THREE.TorusGeometry(220,26,12,48),new THREE.MeshStandardMaterial({color:0x3a4a6a,metalness:.85,roughness:.35,emissive:0x0a2038,emissiveIntensity:.7}));st.add(ringM);
 for(let i=0;i<12;i++){const w=box(30,10,50,0x2a3a5f,0x19e8ff);const a=i/12*TAU;w.position.set(Math.cos(a)*220,Math.sin(a)*220,0);w.rotation.z=a;st.add(w);}
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(40,40,160,16),new THREE.MeshStandardMaterial({color:0x4a5a7a,metalness:.8,roughness:.4}));hub.rotation.x=Math.PI/2;st.add(hub);
 st.position.copy(f.pos).add(new THREE.Vector3(0,420,-500));scene.add(st);worldUpdaters.push({u:t=>{st.rotation.z=t*.02;}});}
{ // mining facility t~0.43
 const f=frameAt(0.43);const g=new THREE.Group();for(let i=0;i<8;i++){const b=box(rand(20,60),rand(20,60),rand(20,60),0x4a3a2a,0xff7a1a);b.position.set(rand(-160,160),rand(-60,120),rand(-160,160));g.add(b);}
 const drill=new THREE.Mesh(new THREE.CylinderGeometry(8,20,120,10),new THREE.MeshStandardMaterial({color:0x888899,metalness:.9,roughness:.3}));g.add(drill);g.userData.drill=drill;
 g.position.copy(f.pos).add(f.side.clone().multiplyScalar(220)).add(f.up.clone().multiplyScalar(40));scene.add(g);worldUpdaters.push({u:t=>{drill.rotation.y=t*2;}});}
{ // floating city t~0.2
 const f=frameAt(0.2);const city=new THREE.Group();for(let i=0;i<26;i++){const h=rand(30,140);const b=box(rand(14,30),h,rand(14,30),0x2a3f5f,pick([0x19e8ff,0xffd23e,0xff2e88]));b.position.set(rand(-220,220),h/2+rand(-40,40),rand(-220,220));city.add(b);}
 city.position.copy(f.pos).add(f.side.clone().multiplyScalar(-380)).add(f.up.clone().multiplyScalar(-60));scene.add(city);}
{ // alien structure t~0.85: awakening rings
 const f=frameAt(0.85);const al=new THREE.Group();const core=new THREE.Mesh(new THREE.OctahedronGeometry(60),new THREE.MeshStandardMaterial({color:0x1a0f2e,emissive:0xb78bff,emissiveIntensity:1.2,metalness:.6,roughness:.3}));al.add(core);
 const rings=[];for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(110+i*30,4,8,48),new THREE.MeshStandardMaterial({color:0x2a1a4a,emissive:0xb78bff,emissiveIntensity:.9,metalness:.7,roughness:.3}));al.add(r);rings.push(r);}
 const shardM=new THREE.Mesh(new THREE.OctahedronGeometry(4),new THREE.MeshStandardMaterial({color:0xb78bff,emissive:0xffffff,emissiveIntensity:2}));shardM.position.set(110,20,0);al.add(shardM);
 al.position.copy(f.pos).add(f.up.clone().multiplyScalar(160));scene.add(al);worldUpdaters.push({u:t=>{rings[0].rotation.x=t*.4;rings[1].rotation.y=t*.3;rings[2].rotation.z=t*.25;core.rotation.y=t*.2;}});}
 // ship graveyard + wrecks
 const wrecks=[];
 for(let i=0;i<14;i++){const t=rand(1);const f=frameAt(t);const w=new THREE.Group();
  const hull=box(rand(20,50),rand(6,12),rand(10,20),0x3a3f4a,0x331111);w.add(hull);const wing=box(rand(30,60),2,rand(8,16),0x2f3540);w.add(wing);
  w.position.copy(f.pos).add(f.side.clone().multiplyScalar(pick([-1,1])*rand(90,260))).add(f.up.clone().multiplyScalar(rand(-60,80)));w.rotation.set(rand(3),rand(3),rand(3));scene.add(w);wrecks.push(w);}
 // satellites
 const sats=[];for(let i=0;i<8;i++){const t=rand(1);const f=frameAt(t);const s=new THREE.Group();s.add(box(6,6,8,0x9aa4bb));const p1=box(20,1,6,0x1a3a8a,0x19e8ff);s.add(p1);s.position.copy(f.pos).add(f.up.clone().multiplyScalar(rand(60,160))).add(f.side.clone().multiplyScalar(rand(-120,120)));scene.add(s);sats.push({s,ph:rand(TAU)});worldUpdaters.push({u:t=>{s.rotation.y=t*.3;}});}
 // cargo + fighter traffic
 const traffic=[];
 function shipMesh(scale,color){const g=new THREE.Group();const hull=new THREE.Mesh(new THREE.ConeGeometry(4*scale,18*scale,6),new THREE.MeshStandardMaterial({color,metalness:.8,roughness:.35,emissive:color,emissiveIntensity:.25}));hull.rotation.x=Math.PI/2;g.add(hull);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.orange,color:0xffaa55,transparent:true,opacity:.9,depthWrite:false}));gl.scale.set(10*scale,10*scale,1);gl.position.z=-10*scale;g.add(gl);return g;}
 for(let i=0;i<4;i++){const m=shipMesh(3,0x8a97ad);scene.add(m);traffic.push({m,t:rand(1),speed:rand(.004,.009),lane:rand(-90,90),h:rand(60,160)});}
 for(let i=0;i<6;i++){const m=shipMesh(.9,0xff7a1a);scene.add(m);traffic.push({m,t:rand(1),speed:rand(.02,.035),lane:rand(-40,40),h:rand(20,70),fighter:true});}
 worldUpdaters.push({u:(t,dt)=>{for(const s of traffic){s.t=(s.t+s.speed*dt)%1;const f=frameAt(s.t);s.m.position.copy(f.pos).add(f.side.clone().multiplyScalar(s.lane+(s.fighter?Math.sin(t*2+s.t*40)*14:0))).add(f.up.clone().multiplyScalar(s.h));const ahead=frameAt((s.t+.004)%1).pos;s.m.lookAt(ahead);}}});
 // turret projectiles near wall-ride (harmless visuals)
 const shots=[];{const f=frameAt(0.35);for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1.2,8,6),new THREE.MeshBasicMaterial({color:0xff5577}));m.position.copy(f.pos).add(new THREE.Vector3(rand(-80,80),rand(-20,60),rand(-80,80)));scene.add(m);shots.push({m,ph:rand(TAU),base:m.position.clone()});}
  worldUpdaters.push({u:t=>{for(const s of shots){s.m.position.copy(s.base);s.m.position.x+=Math.sin(t*1.4+s.ph)*60;s.m.position.z+=Math.cos(t*1.1+s.ph)*60;}}});}
 // speed tunnel t~0.58
 {const f=frameAt(0.58);const tun=new THREE.Group();for(let i=0;i<7;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(30,1.4,8,32),new THREE.MeshBasicMaterial({color:i%2?0xff7a1a:0x19e8ff}));r.position.z=i*26-78;tun.add(r);}
  tun.position.copy(f.pos);tun.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));scene.add(tun);}
 // glass observation tunnel deco on wall section
 {const f=frameAt(0.345);const gl=new THREE.Mesh(new THREE.CylinderGeometry(34,34,180,18,1,true),new THREE.MeshBasicMaterial({color:0x9df2ff,transparent:true,opacity:.14,side:THREE.DoubleSide}));gl.position.copy(f.pos).add(f.side.clone().multiplyScalar(60));gl.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.side,f.up,f.tan));gl.rotateX(Math.PI/2);scene.add(gl);}
 // lightning arcs pool (storm zone)
 const arcs=[];for(let i=0;i<6;i++){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xbfa8ff,transparent:true,opacity:0}));scene.add(l);arcs.push(l);}
 window.__arcs=arcs;

/* ============================================================
   PARTICLES (pooled)
   ============================================================ */
function makePool(n,size,color,op=1){const g=new THREE.BufferGeometry();const p=new Float32Array(n*3);g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const m=new THREE.Points(g,new THREE.PointsMaterial({size,map:TEX.soft,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));m.frustumCulled=false;scene.add(m);
 return {m,p,vel:new Float32Array(n*3),life:new Float32Array(n),n,head:0,
  spawn(x,y,z,vx,vy,vz,life){const i=this.head;this.head=(this.head+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.vel[i*3]=vx;this.vel[i*3+1]=vy;this.vel[i*3+2]=vz;this.life[i]=life;},
  update(dt){for(let i=0;i<this.n;i++){if(this.life[i]>0){this.life[i]-=dt;this.p[i*3]+=this.vel[i*3]*dt;this.p[i*3+1]+=this.vel[i*3+1]*dt;this.p[i*3+2]+=this.vel[i*3+2]*dt;if(this.life[i]<=0){this.p[i*3+1]=-99999;}}}this.m.geometry.attributes.position.needsUpdate=true;}};}
const sparks=makePool(400,2.6,0xffcc66),blasts=makePool(500,6,0xff8844),trailP=makePool(900,3.2,0x33e8ff,.9),iceP=makePool(300,2,0xcfefff,.8);

/* ============================================================
   SHIP MESH BUILDER
   ============================================================ */
function buildShip(color){const g=new THREE.Group();
 const bodyMat=new THREE.MeshStandardMaterial({color:0x1c2438,metalness:.9,roughness:.3});
 const glowMat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.4});
 const nose=new THREE.Mesh(new THREE.ConeGeometry(2.2,7,6),bodyMat);nose.rotation.x=Math.PI/2;nose.position.z=4.5;g.add(nose);
 const cab=new THREE.Mesh(new THREE.SphereGeometry(1.4,12,10),new THREE.MeshStandardMaterial({color:0x0a1428,metalness:.9,roughness:.15,emissive:0x19e8ff,emissiveIntensity:.4}));cab.position.set(0,1.2,1);cab.scale.set(1,.7,1.6);g.add(cab);
 const hull=new THREE.Mesh(new THREE.BoxGeometry(4.4,1.2,7),bodyMat);hull.position.z=-1;g.add(hull);
 for(const s of [-1,1]){const wing=new THREE.Mesh(new THREE.BoxGeometry(3.4,.5,3.4),bodyMat);wing.position.set(s*3.4,.1,-2);wing.rotation.z=s*-.25;g.add(wing);
  const tip=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,3),glowMat);tip.position.set(s*5,.4,-2);g.add(tip);
  const eng=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.2,2.4,10),glowMat);eng.rotation.x=Math.PI/2;eng.position.set(s*1.6,.2,-4.4);g.add(eng);
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.glow,color,transparent:true,opacity:.9,depthWrite:false}));fl.scale.set(4,4,1);fl.position.set(s*1.6,.2,-5.8);g.add(fl);g.userData['fl'+s]=fl;}
 const strip=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,6.5),glowMat);strip.position.set(0,-.4,0);g.add(strip);
 // brake light
 const brake=new THREE.Mesh(new THREE.BoxGeometry(3,.5,.4),new THREE.MeshStandardMaterial({color:0xff2233,emissive:0xff2233,emissiveIntensity:0}));brake.position.set(0,.6,-4.9);g.add(brake);g.userData.brake=brake;
 // blob shadow
 const sh=new THREE.Mesh(new THREE.CircleGeometry(3.4,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35}));sh.rotation.x=-Math.PI/2;sh.position.y=-2.4;g.add(sh);
 g.userData.color=color;return g;}

/* ============================================================
   GAME STATE
   ============================================================ */
const G={mode:'race',state:'menu', // menu|countdown|racing|paused|finished
 laps:3,time:0,countT:0,gateIdx:1,lapStart:0,lastLap:null,bestLap:null,position:1,
 credits:0,runShards:0,speedTraps:[],jumpBest:0,empUntil:0,hyperUntil:0,shieldUntil:0,
 slowUntil:0,eventT:8,stormOn:false,revealShown:false,finished:false,freeT:0};
let player,ais=[];
const FWD=new THREE.Vector3();

function resetRun(mode,vehIdx){
 G.mode=mode;G.state='countdown';G.countT=3.6;G.time=0;G.gateIdx=1;G.lapStart=0;G.lastLap=null;G.bestLap=null;G.position=1;
 G.credits=0;G.runShards=0;G.empUntil=0;G.hyperUntil=0;G.shieldUntil=0;G.slowUntil=0;G.eventT=9;G.stormOn=false;G.finished=false;G.freeT=0;G.jumpBest=0;G.speedTraps=[];
 for(const p of pickups){p.taken=false;p.respawn=0;p.mesh.visible=true;p.halo.visible=true;}
 for(const b of breakables){b.taken=false;b.mesh.visible=true;}
 for(const s of roamShards)s.taken=false,s.mesh.visible=true;
 // player
 const V=VEHICLES[vehIdx];const f=frameAt(mode==='freeroam'?0.1:0);
 if(player)scene.remove(player.mesh);
 const mesh=buildShip(PAINTS[selPaint]);scene.add(mesh);
 player={mesh,t:mode==='freeroam'?0.1:0.9992,lane:0,pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,vy:0,speed:0,boost:65,grounded:true,air:0,driftAmt:0,spin:0,lastTrap:0,veh:V,scrape:0,nearCd:0,resetCd:0,wrongWay:0};
 player.pos.copy(f.pos).add(f.up.clone().multiplyScalar(2.4));
 player.yaw=Math.atan2(f.tan.x,f.tan.z);
 // AI
 for(const a of ais)scene.remove(a.mesh);ais=[];
 if(mode!=='freeroam'&&mode!=='timetrial'||mode==='race'){
  const defs=[{n:'VEXX',top:.97,agg:.9,col:0xff2e88},{n:'JUNO',top:.94,agg:.4,col:0x9dff3e},{n:'KORVAC',top:1.0,agg:.7,col:0xff7a1a},{n:'MIRA',top:.92,agg:.5,col:0xb78bff},{n:'DRAX',top:.96,agg:.8,col:0xffd23e}];
  if(mode==='timetrial')defs.length=0;
  defs.forEach((d,i)=>{const m=buildShip(d.col);scene.add(m);ais.push({mesh:m,t:0.9992-(i+1)*0.0012,lane:(i%2?1:-1)*8,top:d.top,agg:d.agg,name:d.n,speed:0,mistake:0,lap:1,total:0,offset:rand(TAU)});});
 }
 $('hud').classList.add('on');$('pausemenu').classList.add('hidden');$('finishmenu').classList.add('hidden');$('mainmenu').classList.add('hidden');
 bigmsg('');submsg('');showCount('3');
 updateObjective();
 toast(mode==='freeroam'?'FREE ROAM — explore! Follow ◈ beacons, find 24+10 shards':mode==='timetrial'?'TIME TRIAL — 3 laps, chase your best':'GRAND PRIX — 3 LAPS • 6 RACERS');
}
function updateObjective(){$('objective').textContent=G.mode==='freeroam'?'⬡ EXPLORE — wormholes link regions • find shards':`FOLLOW THE GATES ▸ GATE ${G.gateIdx}/${GATE_N} • LAP ${Math.min(player?curLap():1,G.laps)}/${G.laps}`;}
function curLap(){return clamp(Math.floor(progress().laps)+1,1,G.laps);}
function progress(){ // player total progress in laps.t
 let base=player.t;if(G.gateIdx>1){/* fine */}
 return {laps:(G.lapCount||0)+player.t};}
function fmt(t){if(t==null)return '--:--.-';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(1);}

/* ---------- UI helpers ---------- */
function bigmsg(s){$('bigmsg').textContent=s;}function submsg(s){$('submsg').textContent=s;}function showCount(s){$('count').textContent=s;}
function toast(s,ms=2600){const e=$('toast');e.textContent=s;clearTimeout(e._t);e._t=setTimeout(()=>e.textContent='',ms);}
function banner(s,sub='',ms=2200){bigmsg(s);submsg(sub);clearTimeout(banner._t);banner._t=setTimeout(()=>{bigmsg('');submsg('');},ms);}
function flash(op=.7){const f=$('flash');f.style.transition='none';f.style.opacity=op;requestAnimationFrame(()=>{f.style.transition='opacity .5s';f.style.opacity=0;});}

/* ---------- menus ---------- */
function buildMenus(){const vg=$('vehgrid');vg.innerHTML='';
 VEHICLES.forEach((v,i)=>{const locked=v.unlock&&!save.unlocked.includes(v.id);const d=document.createElement('div');d.className='veh'+(i===selVeh?' sel':'');
  d.innerHTML=`<h4>${v.name}${locked?' 🔒':''}</h4><div style="font-size:11px;opacity:.75">${v.desc}${locked?` • unlock ${v.unlock}⬡`:''}</div>
  <div class="stats">SPD<div class="bar"><i style="width:${v.top/262*100}%"></i></div>ACC<div class="bar"><i style="width:${v.acc/72*100}%"></i></div>GRP<div class="bar"><i style="width:${v.grip/1.28*100}%"></i></div>BST<div class="bar"><i style="width:${v.boost/1.3*100}%"></i></div></div>`;
  d.onclick=()=>{if(locked){if(save.credits>=v.price){save.credits-=v.price;save.unlocked.push(v.id);persist();AudioSys.pickup();buildMenus();toast(v.name+' UNLOCKED');}else{toast(`NEED ${v.unlock}⬡ — race & smash crates!`);AudioSys.zap();return;}}
   selVeh=i;AudioSys.init();AudioSys.blip(700+i*80,.08);buildMenus();};
  vg.appendChild(d);});
 const sw=$('swatches');sw.innerHTML='';PAINTS.forEach((c,i)=>{const s=document.createElement('div');s.className='sw'+(i===selPaint?' sel':'');s.style.background='#'+c.toString(16).padStart(6,'0');s.onclick=()=>{selPaint=i;save.paint=i;persist();buildMenus();};sw.appendChild(s);});
 document.querySelectorAll('.modecard').forEach(m=>{m.classList.toggle('sel',m.dataset.mode===selMode);m.onclick=()=>{selMode=m.dataset.mode;AudioSys.init();buildMenus();};});
 $('saveinfo').textContent=`• ${save.credits}⬡ • best ${fmt(save.bestLap)} • wins ${save.wins}/${save.races}`;
 $('record').innerHTML=`<div class="kv"><span>Credits ⬡</span><b>${save.credits}</b></div><div class="kv"><span>Data shards</span><b>${save.shards.length}/34</b></div><div class="kv"><span>Best lap</span><b>${fmt(save.bestLap)}</b></div><div class="kv"><span>Wins</span><b>${save.wins} / ${save.races}</b></div><div class="kv"><span>Zones found</span><b>${save.discovered.length}</b></div>`;
}
buildMenus();
$('btnHow').onclick=()=>{const b=$('howbox');b.style.display=b.style.display==='none'?'block':'none';};
$('btnLaunch').onclick=()=>{AudioSys.init();if(AudioSys.ctx&&AudioSys.ctx.state==='suspended')AudioSys.ctx.resume();resetRun(selMode,selVeh);};
$('btnResume').onclick=()=>{G.state='racing';$('pausemenu').classList.add('hidden');};
$('btnRestart').onclick=()=>{resetRun(selMode,selVeh);};
$('btnQuit').onclick=()=>{G.state='menu';$('pausemenu').classList.add('hidden');$('mainmenu').classList.remove('hidden');$('hud').classList.remove('on');};
$('btnAgain').onclick=()=>resetRun(selMode,selVeh);
$('btnRoam').onclick=()=>{selMode='freeroam';resetRun('freeroam',selVeh);};
$('btnMenu2').onclick=()=>{G.state='menu';$('finishmenu').classList.add('hidden');$('mainmenu').classList.remove('hidden');$('hud').classList.remove('on');buildMenus();};
function handleKey(code){
 if(code==='Escape'||code==='KeyP'){if(G.state==='racing'){G.state='paused';$('pausemenu').classList.remove('hidden');}else if(G.state==='paused'){G.state='racing';$('pausemenu').classList.add('hidden');}}
 if(code==='KeyR'&&G.state==='racing')resetToTrack();
 if(code==='KeyM'){const m=AudioSys.toggleMute();toast(m?'MUTED':'SOUND ON');}
 if(code==='KeyC'){camFar=!camFar;toast(camFar?'CAM: CHASE FAR':'CAM: CHASE NEAR');}
 if(code==='Enter'&&G.state==='menu')$('btnLaunch').click();
}
Input.init();

/* ---------- reset / events ---------- */
function resetToTrack(){if(!player||player.resetCd>0)return;player.resetCd=1;const f=frameAt(player.t);
 player.pos.copy(f.pos).add(f.up.clone().multiplyScalar(3));player.vel.multiplyScalar(.2);player.vy=0;player.yaw=Math.atan2(f.tan.x,f.tan.z);player.spin=0;AudioSys.zap();flash(.25);toast('RESET');}
const EVENTS=[
 {n:'METEOR SHOWER',f(){meteorShower();}},
 {n:'CARGO FLYBY — HOLD LINE',f(){cargoScare();}},
 {n:'ASTEROID DETONATION',f(){asteroidBoom();}},
 {n:'STATION ALARM',f(){stationAlarm();}},
 {n:'GRAVITY FLUCTUATION',f(){G.slowUntil=0;player.vy+=26;banner('ZERO-G SURGE','THROTTLE CONTROLS ALTITUDE');AudioSys.hyper();}},
 {n:'SOLAR FLARE',f(){flash(.8);sun.intensity=4;setTimeout(()=>sun.intensity=1.6,900);AudioSys.boom();}},
 {n:'WORMHOLE SURGE — STORM INBOUND',f(){G.stormOn=true;setTimeout(()=>G.stormOn=false,14000);}},
 {n:'SATELLITE DOWN — DEBRIS!',f(){debrisBurst();}},
];
function fireEvent(){const e=pick(EVENTS);$('event').textContent='⚠ '+e.n;AudioSys.zap();e.f();clearTimeout(fireEvent._t);fireEvent._t=setTimeout(()=>$('event').textContent='',5000);}
function meteorShower(){for(let i=0;i<26;i++){const a=player.pos.clone().add(new THREE.Vector3(rand(-400,400),rand(100,400),rand(-400,400)));
  blasts.spawn(a.x,a.y,a.z,rand(-60,60),rand(-120,-40),rand(-60,60),rand(.8,1.6));}AudioSys.boom();shake(.7);banner('METEOR SHOWER','DEBRIS ON THE LINE');}
function cargoScare(){banner('⚠ CAPITAL HAULER','CLOSE OVERHEAD PASS');AudioSys.boom();shake(.5);}
function asteroidBoom(){const f=frameAt((player.t+.02)%1);const p=f.pos.clone().add(f.side.clone().multiplyScalar(rand(-140,140))).add(f.up.clone().multiplyScalar(rand(20,120)));
 for(let i=0;i<40;i++)blasts.spawn(p.x,p.y,p.z,rand(-90,90),rand(-60,90),rand(-90,90),rand(.6,1.4));AudioSys.boom();flash(.35);shake(.6);}
function stationAlarm(){banner('STATION ALARM','TRAFFIC need'.toUpperCase()+' — TURRET DRILL');for(let i=0;i<5;i++)setTimeout(()=>AudioSys.blip(520,.15,'square',.3),i*220);}
function debrisBurst(){for(let i=0;i<20;i++){const p=player.pos.clone().add(new THREE.Vector3(rand(-150,150),rand(-30,120),rand(-150,150)));blasts.spawn(p.x,p.y,p.z,rand(-50,50),rand(-40,40),rand(-50,50),1);}AudioSys.crash();shake(.4);}

/* ---------- camera / shake ---------- */
let camFar=true,shakeAmt=0;function shake(a){shakeAmt=Math.min(1.6,shakeAmt+a);}
const camPos=new THREE.Vector3(0,80,-160),camLook=new THREE.Vector3();

/* ---------- minimap ---------- */
const mm=$('minimap').getContext('2d');
function drawMinimap(){mm.clearRect(0,0,190,190);mm.save();mm.translate(95,95);mm.scale(.032,.032);mm.translate(100,100);
 mm.strokeStyle='rgba(25,232,255,.7)';mm.lineWidth=8;mm.beginPath();
 for(let i=0;i<=120;i++){const t=i/120;const p=sPts[Math.floor(t*SAMPLES)%SAMPLES];i?mm.lineTo(p.x,p.z):mm.moveTo(p.x,p.z);}mm.closePath();mm.stroke();
 mm.fillStyle='#ffd23e';for(const g of gates){if(g.t*1%1===0){}const p=sPts[Math.floor(g.t*SAMPLES)%SAMPLES];mm.fillRect(p.x-14,p.z-14,28,28);}
 const dot=(p,c,r=16)=>{mm.fillStyle=c;mm.beginPath();mm.arc(p.x,p.z,r,0,7);mm.fill();};
 if(player)dot(player.pos,'#fff',20);
 for(const a of ais)dot(a.mesh.position,'#ff5f8a',13);
 mm.restore();}

/* ============================================================
   MAIN LOOP
   ============================================================ */
const clock=new THREE.Clock();
let elapsed=0,musicInt=0;
const tmpV=new THREE.Vector3(),tmpV2=new THREE.Vector3(),tmpV3=new THREE.Vector3();

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 Input.pollPad();
 // idle menu orbit
 if(G.state==='menu'){const t=elapsed*.05;const f=frameAt(t%1);camera.position.lerp(tmpV.copy(f.pos).add(f.up.clone().multiplyScalar(60)).add(f.side.clone().multiplyScalar(120)),.03);camera.lookAt(f.pos);camera.fov=60;camera.updateProjectionMatrix();
  for(const w of worldUpdaters)w.u(elapsed,dt);animateWorld(dt);renderer.render(scene,camera);return;}
 if(G.state==='paused'){renderer.render(scene,camera);return;}
 if(G.state==='finished'){updateFinished(dt);renderer.render(scene,camera);return;}
 // countdown
 if(G.state==='countdown'){G.countT-=dt;const n=Math.ceil(G.countT-0.6);showCount(G.countT<=0.6?'GO!':String(Math.max(1,n)));
  const last=animate._l;if(G.countT<=0.6&&last!=='GO'){AudioSys.count(0);banner('GO!','BOOST PADS AHEAD');flash(.3);}else if(n!==last&&n>=1&&n<=3){AudioSys.count(n);}
  animate._l=G.countT<=0.6?'GO!':n;
  if(G.countT<=0){G.state='racing';showCount('');G.time=0;G.lapStart=0;G.lapCount=0;}
  updatePlayer(dt,true);updateAI(dt,true);updateCamera(dt);animateWorld(dt);renderer.render(scene,camera);return;}
 // racing
 G.time+=dt;
 updatePlayer(dt,false);
 updateAI(dt,false);
 updateRace(dt);
 updateCamera(dt);
 animateWorld(dt);
 updateHUD(dt);
 AudioSys.engine(player?clamp(player.speed/300,0,1):0,player&&player.boosting);
 AudioSys.music(musicInt);
 renderer.render(scene,camera);
}

function animateWorld(dt){
 for(const w of worldUpdaters)w.u(elapsed,dt);
 sparks.update(dt);blasts.update(dt);trailP.update(dt);iceP.update(dt);
 // pads pulse
 for(const p of pads){p.mesh.material.opacity=.65+Math.sin(elapsed*5+p.t*40)*.3;p.glow.material.opacity=.35+Math.sin(elapsed*5+p.t*40)*.2;}
 // gates spin
 for(const g of gates){g.inner.rotation.z+=dt*1.2;}
 // pickups bob
 for(const p of pickups){if(p.taken){p.respawn-=dt;if(p.respawn<=0&&G.state==='racing'){p.taken=false;p.mesh.visible=true;p.halo.visible=true;}continue;}
  p.mesh.rotation.y+=dt*2;p.mesh.position.y=p.baseY+Math.sin(elapsed*2+p.t*50)*1.4;p.halo.position.copy(p.mesh.position);}
 for(const s of roamShards){if(!s.taken){s.mesh.rotation.y+=dt;}}
 // lasers oscillate
 for(const L of lasers){L.mesh.position.y+=Math.sin(elapsed*2.4+L.phase)*dt*22;}
 for(const c of closers){const o=(Math.sin(elapsed*1.6+c.phase)*.5+.5)*11;c.g.children[0].position.x=-14+o*.6;c.g.children[1].position.x=14-o*.6;}
 for(const t of turbines)t.blades.rotation.z+=dt*6;
 for(const w of wormholes){w.swirl.rotation.z+=dt*1.5;w.g.rotation.z+=dt*.2;}
 // asteroids dust drift
 dust.rotation.y+=dt*.002;ice.rotation.y-=dt*.0015;
 // storm arcs
 if(G.stormOn||(player&&player.t>0.70&&player.t<0.82)){stormLight.intensity=rand(0,60);stormLight.position.copy(player.pos).add(tmpV.set(rand(-300,300),rand(100,400),rand(-300,300)));
  if(Math.random()<.12){const a=pick(window.__arcs);const p0=player.pos.clone().add(new THREE.Vector3(rand(-250,250),rand(150,400),rand(-250,250)));const p1=p0.clone().add(new THREE.Vector3(rand(-60,60),rand(-260,-120),rand(-60,60)));
   a.geometry.setFromPoints([p0,p1]);a.material.opacity=.9;setTimeout(()=>a.material.opacity=0,130);AudioSys.zap();
   if(!isShielded()&&p0.distanceTo(player.pos)<190){hitHazard('LIGHTNING STRIKE');}}}
 // ambient particles around player
 if(player&&Math.random()<.6){trailP.spawn(player.pos.x+rand(-4,4),player.pos.y+rand(-2,3),player.pos.z+rand(-4,4),rand(-6,6),rand(-4,8),rand(-6,6),rand(.4,.9));}
 if(player&&player.t>0.10&&player.t<0.17&&Math.random()<.5){iceP.spawn(player.pos.x+rand(-40,40),player.pos.y+rand(-10,30),player.pos.z+rand(-40,40),rand(-20,20),rand(-10,10),rand(-20,20),rand(.5,1));}
 // distant traffic hum visuals done in updaters
}

/* ---------- player physics ---------- */
function isShielded(){return elapsed<G.shieldUntil;}
function updatePlayer(dt,held){
 if(!player)return;const P=player,V=P.veh;
 const near=nearestT(P.pos,P.t);P.t=near.t;P.dist=near.dist;
 const f=frameAt(P.t);P.frame=f;
 const onTrack=P.dist<TRACK_HALF+26;
 const inZeroG=zeroGAt(P.t)||!onTrack;
 // steering
 const spd01=clamp(Math.abs(P.speed)/280,0,1);
 const steerMax=lerp(2.4,1.05,spd01)*(V.grip)*(P.driftAmt>0?1.5:1);
 P.yaw-=Input.steer*steerMax*dt*(P.speed<-5?-1:1)*(P.grounded||inZeroG?1:.55);
 // drift
 const wantDrift=Input.drift&&Math.abs(P.speed)>60&&P.grounded;
 P.driftAmt=lerp(P.driftAmt,wantDrift?1:0,dt*(wantDrift?5:3));
 // boost
 P.boost=clamp(P.boost+dt*(wantDrift?9:P.speed>40?4.5:7)+(onTrack?dt*1.5:0),0,100);
 const wantBoost=Input.boost&&P.boost>1&&P.speed>10;
 P.boosting=wantBoost||elapsed<G.hyperUntil;
 if(wantBoost)P.boost-=dt*30;
 const hyper=elapsed<G.hyperUntil?1.55:1;
 const empSlow=elapsed<G.empUntil?0.55:1;
 const top=(70+V.top*(P.boosting?1.45*V.boost*hyper:1))*empSlow*(G.slowUntil>elapsed?.6:1);
 const acc=V.acc*(P.boosting?2.1:1)*(wantDrift?.7:1);
 if(!held){
  if(Input.accel)P.speed+=acc*dt*3.2;
  else if(Input.brake){P.speed-= (P.speed>5?150:60)*dt;}
  else P.speed-=P.speed*0.35*dt; // drag
  if(!Input.accel&&!Input.brake&&Math.abs(P.speed)<4)P.speed=0;
  P.speed=clamp(P.speed,-90,top);
 } else {P.speed=0;}
 // pads
 if(onTrack&&!held)for(const pd of pads){if(Math.abs(pd.t-P.t)<0.0016&&Math.abs(pd.lane-P.lane)<11&&pd.cd<=0){pd.cd=2;P.boost=clamp(P.boost+22,0,100);P.speed=Math.min(top+40,P.speed+70);AudioSys.blip(300,.25,'sawtooth',.3);flash(.12);shake(.25);
   for(let i=0;i<10;i++)trailP.spawn(P.pos.x,1+P.pos.y,P.pos.z,rand(-30,30),rand(10,60),rand(-30,30),.6);toast('BOOST PAD +');}pd.cd-=dt;}
 FWD.set(Math.sin(P.yaw),0,Math.cos(P.yaw));
 // lateral velocity with grip (drift keeps slide)
 const fwdSpd=P.vel.dot(FWD);
 const lat=tmpV.copy(P.vel).addScaledVector(FWD,-fwdSpd);
 const gripK=P.grounded?lerp(9,2.2,P.driftAmt)*(V.grip):2.2;
 lat.multiplyScalar(Math.max(0,1-gripK*dt));
 // forward follows speed
 tmpV2.copy(FWD).multiplyScalar(P.speed);
 P.vel.copy(tmpV2).add(lat);
 // lane estimate for pads
 P.lane=clamp(tmpV3.copy(P.pos).sub(f.pos).dot(f.side),-30,30);
 // vertical
 const targetY=f.pos.y+2.6;
 if(onTrack&&!inZeroG){
  // magnetic snap
  const k=P.grounded?10:4;
  P.vy=lerp(P.vy,(targetY-P.pos.y)*k,clamp(dt*6,0,1));
  if(Math.abs(P.pos.y-targetY)<1.2&&P.vy<8){P.grounded=true;P.air=0;}
  // ramps: track curvature kick
  const ahead=frameAt((P.t+.002)%1);
  const slope=(ahead.pos.y-f.pos.y)/Math.max(1,f.pos.distanceTo(ahead.pos));
  if(slope>.12&&P.speed>150){P.vy+=slope*P.speed*.55*dt*8;P.grounded=false;P.air+=dt;}
  if(!P.grounded){P.vy-=34*dt;P.air+=dt;} // gravity
  // wall/ceiling align handled visually
 } else {
  // free flight / zero-g: W/S pitch altitude, gentle auto-level
  P.grounded=false;P.air+=dt;
  if(Input.accel)P.vy+=8*dt;if(Input.brake)P.vy-=14*dt;
  P.vy-= (zeroGAt(P.t)?0:9)*dt;P.vy=clamp(P.vy,-60,80);
 }
 P.pos.addScaledVector(P.vel,dt);P.pos.y+=P.vy*dt;
 // floor: never fall through planet
 if(P.pos.y<-600){P.pos.y=-600;P.vy=Math.abs(P.vy)*.3;}
 if(P.pos.y>1400){P.pos.y=1400;P.vy=Math.min(0,P.vy);}
 // world bounds bubble
 const r=Math.hypot(P.pos.x,P.pos.z-0);
 if(r>5200){tmpV.copy(P.pos).setY(0).normalize().multiplyScalar(5200);P.pos.x=tmpV.x;P.pos.z=tmpV.z;P.vel.multiplyScalar(.6);toast('EDGE OF SECTOR — TURN BACK ◈');}
 // collisions: breakables
 for(const b of breakables){if(b.taken||b.mesh.position.distanceToSquared(P.pos)>90)continue;
  b.taken=true;b.mesh.visible=false;G.credits+=5;save.credits+=5;AudioSys.crash();
  for(let i=0;i<16;i++)blasts.spawn(b.mesh.position.x,b.mesh.position.y,b.mesh.position.z,rand(-70,70),rand(-20,90),rand(-70,70),rand(.5,1));
  P.speed*= (V.id==='v4'?0.97:0.88);shake(.35);toast('+5⬡ DEBRIS SMASHED');}
 // pickups
 for(const p of pickups){if(p.taken)continue;if(p.mesh.position.distanceToSquared(P.pos)>150)continue;
  collectPickup(p);}
 for(const s of roamShards){if(s.taken)continue;if(s.mesh.position.distanceToSquared(P.pos)>220)continue;s.taken=true;s.mesh.visible=false;G.runShards++;save.credits+=10;persist();AudioSys.pickup();toast('⬢ DEEP-SPACE SHARD +10⬡');}
 // lasers hit
 for(const L of lasers){if(Math.abs(L.t-P.t)>0.0012)continue;const off=L.mesh.position.y-(P.pos.y);if(Math.abs((elapsed*2.4+L.phase)%6-3)<1.4&&Math.abs(off)<7&&onTrack){hitHazard('MINING LASER');}}
 // closers hit
 for(const c of closers){if(Math.abs(c.t-P.t)>0.001)continue;const o=(Math.sin(elapsed*1.6+c.phase)*.5+.5)*11;if(Math.abs(P.lane)<o*.6&&onTrack){/*open*/}else if(onTrack){hitHazard('CRUSH GATE');}}
 // wormhole teleport (main)
 {const wf=frameAt(0.63);if(P.pos.distanceTo(wf.pos)<46){P.t=0.685;const nf=frameAt(P.t);P.pos.copy(nf.pos).add(nf.up.clone().multiplyScalar(4));P.yaw=Math.atan2(nf.tan.x,nf.tan.z);P.speed=Math.max(P.speed,260);G.hyperUntil=elapsed+2;flash(.9);AudioSys.hyper();banner('WORMHOLE TRANSIT','SECTOR 7 → HELIOS VERGE');shake(.8);musicInt=1;}}
 // free-roam wormhole links
 for(const w of wormholes){if(!w.g.userData.link)continue;if(P.pos.distanceTo(w.g.position)<48){const dest=w.g.userData.link.position.clone();P.pos.copy(dest).add(new THREE.Vector3(0,10,60));P.vel.multiplyScalar(.7);flash(.9);AudioSys.hyper();banner('WORMHOLE JUMP','NEW REGION DISCOVERED');discover('wormhole-'+Math.round(dest.x));}}
 // scraping sparks
 P.scrape=0;
 if(onTrack&&Math.abs(P.lane)>TRACK_HALF-3&&P.speed>80){P.scrape=1;if(Math.random()<.7){sparks.spawn(P.pos.x+rand(-3,3),P.pos.y,P.pos.z+rand(-3,3),rand(-40,40),rand(0,60),rand(-40,40),.4);}P.speed-=20*dt;if(!P.scrapeSnd||elapsed>P.scrapeSnd){AudioSys.zap();P.scrapeSnd=elapsed+.4;}}
 // near-miss vs AI/traffic
 if(P.nearCd>0)P.nearCd-=dt;
 for(const a of ais){const d=a.mesh.position.distanceTo(P.pos);if(d<16&&d>6&&P.nearCd<=0&&P.speed>170){P.nearCd=3;P.boost=clamp(P.boost+14,0,100);nearMiss();}}
 // jump landing
 if(!P.grounded&&P.air>0.4&&Math.abs(P.pos.y-targetY)<2&&onTrack&&P.vy<0){P.grounded=true;AudioSys.crash();shake(clamp(-P.vy*.012,0.15,.6));G.jumpBest=Math.max(G.jumpBest,P.air);
  for(let i=0;i<12;i++)sparks.spawn(P.pos.x, P.pos.y-2,P.pos.z,rand(-60,60),rand(0,80),rand(-60,60),.5);
  if(P.air>1.1){banner('AIR +'+P.air.toFixed(1)+'s','STYLE BONUS +BOOST');P.boost=clamp(P.boost+18,0,100);}P.air=0;}
 // speed trap
 if(Math.abs(P.speed)>250&&elapsed-P.lastTrap>6){P.lastTrap=elapsed;G.speedTraps.push(Math.round(P.speed*1.6));toast(`SPEED TRAP ${Math.round(P.speed*1.6)} KM/H`);AudioSys.pickup();P.boost=clamp(P.boost+8,0,100);}
 // mesh transform
 P.mesh.position.copy(P.pos);
 const targetRoll=-Input.steer*.5-P.driftAmt*Math.sign(Input.steer||1)*.5;
 P.mesh.rotation.set(0,P.yaw,targetRoll);
 // align up to track when magnetic
 if(onTrack&&!inZeroG){const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),f.up);const e=new THREE.Euler().setFromQuaternion(q);P.mesh.rotation.x+=e.x*.6;P.mesh.rotation.z+=targetRoll+e.z*.4;}
 else{P.mesh.rotation.x=lerp(P.mesh.rotation.x,clamp(-P.vy*.004,-.4,.4),dt*3);}
 // thruster visuals
 const s01=clamp(Math.abs(P.speed)/300,0,1);
 P.mesh.userData['fl-1'].scale.setScalar(3+s01*5+(P.boosting?5:0));P.mesh.userData['fl1'].scale.setScalar(3+s01*5+(P.boosting?5:0));
 P.mesh.userData.brake.material.emissiveIntensity=Input.brake?3:0;
 // engine trail emission
 if(P.speed>60){for(let i=0;i<(P.boosting?4:1);i++){trailP.spawn(P.pos.x-FWD.x*6+rand(-1,1),P.pos.y+rand(0,1),P.pos.z-FWD.z*6+rand(-1,1),-FWD.x*40+rand(-8,8),rand(-4,6),-FWD.z*40+rand(-8,8),rand(.3,.7));}}
 boostLight.position.copy(P.pos);boostLight.intensity=P.boosting?60:8;boostLight.color.set(P.boosting?0xff9a2a:0x19e8ff);
 if(P.resetCd>0)P.resetCd-=dt;
 // discovery zones
 const zones=[[0.2,'RING OF KESSLER'],[0.35,'WALL OF EREBUS'],[0.43,'KESSLER MINES'],[0.63,'HELIOS WORMHOLE'],[0.76,'STORMVEIL'],[0.85,'ALIEN RELIQUARY']];
 for(const [zt,zn] of zones){if(Math.abs(P.t-zt)<.004)discover(zn);}
 musicInt=lerp(musicInt,clamp(.3+spd01*.7+(P.boosting?.3:0),0,1),dt);
}
function nearMiss(){const e=$('nearmiss');e.style.transition='none';e.style.opacity=1;e.style.transform='scale(1.15)';requestAnimationFrame(()=>{e.style.transition='all .7s';e.style.opacity=0;e.style.transform='scale(1)';});AudioSys.blip(1500,.15,'sine',.3);$('pickupmsg').textContent='NEAR MISS! +BOOST';}
function hitHazard(name){if(isShielded()){toast('SHIELD ABSORBED '+name);return;}if(elapsed<(hitHazard._c||0))return;hitHazard._c=elapsed+1.2;
 player.speed*=.55;player.spin=rand(-4,4);G.slowUntil=elapsed+.8;AudioSys.crash();shake(.8);flash(.25);
 $('dmg').style.boxShadow='inset 0 0 140px 40px rgba(255,30,60,.55)';setTimeout(()=>$('dmg').style.boxShadow='inset 0 0 140px 40px rgba(255,30,60,0)',300);
 toast('⚠ '+name+' — SHIELD HELPS');}
function collectPickup(p){p.taken=true;p.respawn=20;p.mesh.visible=false;p.halo.visible=false;AudioSys.pickup();
 if(p.kind==='energy'){player.boost=clamp(player.boost+26,0,100);player.speed+=24;toast('⚡ ENERGY +BOOST');}
 if(p.kind==='credit'){G.credits+=10;save.credits+=10;persist();toast('+10⬡ CREDITS');}
 if(p.kind==='shield'){G.shieldUntil=elapsed+12;$('shieldind').style.display='block';toast('◈ SHIELD 12s');}
 if(p.kind==='hyper'){G.hyperUntil=elapsed+5;AudioSys.hyper();banner('HYPERBOOST','FOV + THRUST MAX');flash(.4);}
 if(p.kind==='emp'){toast('◉ EMP BURST — RIVALS SLOWED');AudioSys.boom();for(const a of ais)a.slowUntil=elapsed+4;for(let i=0;i<20;i++)blasts.spawn(player.pos.x,player.pos.y,player.pos.z,rand(-120,120),rand(-40,120),rand(-120,120),.8);}
 if(p.kind==='shard'){G.runShards++;const id='shard-'+Math.round(p.t*1000);if(!save.shards.includes(id)){save.shards.push(id);save.credits+=15;}persist();AudioSys.checkpoint();toast(`⬢ DATA SHARD ${save.shards.length}/34  +15⬡`);}}
function discover(name){if(save.discovered.includes(name))return;save.discovered.push(name);save.credits+=20;persist();toast(`◈ DISCOVERED: ${name}  +20⬡`);AudioSys.checkpoint();}

/* ---------- AI ---------- */
function updateAI(dt,held){
 for(const a of ais){
  if(held){const f=frameAt(a.t);a.mesh.position.copy(f.pos).add(f.side.clone().multiplyScalar(a.lane)).add(f.up.clone().multiplyScalar(2.6));continue;}
  // mistake timer
  a.mistake-=dt;if(a.mistake<-rand(6,14)){a.mistake=rand(1,2.5);}
  const mistaking=a.mistake>0;
  // rubber band
  let rubber=1;const gap=a.t-player.t;let d=gap;if(d>.5)d-=1;if(d<-.5)d+=1;
  if(d<-.02)rubber=1.09;else if(d>.03)rubber=.94;
  const slow=(a.slowUntil&&elapsed<a.slowUntil)?.6:1;
  const empd=(elapsed<G.empUntil)?.85:1; // player EMP slows AI (G.empUntil unused for AI? use a.slowUntil)
  const spd=(150+90*a.top)*(mistaking?.72:1)*rubber*slow;
  a.t=(a.t+spd*dt/trackLen)%1;
  // lane AI: weave + defend + avoid lasers
  let want=Math.sin(elapsed*.5+a.offset)*10;
  if(player&&Math.abs(d)<.01){ // battle: defend/block or draft
   if(a.agg>.6)want=player.lane*.7; // block
   else want=player.lane+ (a.lane>player.lane?6:-6);
  }
  for(const L of lasers)if(Math.abs(L.t-a.t)<.002)want*=-.6;
  a.lane=lerp(a.lane,clamp(want,-14,14),dt*1.4);
  const f=frameAt(a.t);
  tmpV.copy(f.pos).add(f.side.clone().multiplyScalar(a.lane)).add(f.up.clone().multiplyScalar(2.6+Math.sin(elapsed*3+a.offset)*.3));
  a.mesh.position.lerp(tmpV,clamp(dt*8,0,1));
  const ahead=frameAt((a.t+.002)%1);
  tmpV2.copy(ahead.pos).sub(a.mesh.position);a.mesh.rotation.y=Math.atan2(tmpV2.x,tmpV2.z);
  a.mesh.rotation.z=lerp(a.mesh.rotation.z,-(a.lane-want)*.02,dt*3);
  const fl=3+clamp(spd/300,0,1)*5;a.mesh.userData['fl-1'].scale.setScalar(fl);a.mesh.userData['fl1'].scale.setScalar(fl);
  if(Math.random()<dt*2)trailP.spawn(a.mesh.position.x,a.mesh.position.y,a.mesh.position.z,rand(-10,10),rand(0,10),rand(-10,10),.5);
  a.total=a.t+(G['aiLap'+a.name]||0);
 }
}

/* ---------- race logic ---------- */
function updateRace(dt){
 if(!player)return;
 // gates
 const g=gates[G.gateIdx%GATE_N];
 const gd=g.mesh.position.distanceTo(player.pos);
 $('checkarrow').textContent=`◉ NEXT GATE ${Math.round(gd)}m ${gd<120?'▸▸':G.gateIdx%GATE_N===0?'— FINISH LINE':''}`;
 if(gd<g.R+14){
  AudioSys.checkpoint();flash(.15);
  for(let i=0;i<8;i++)trailP.spawn(g.mesh.position.x,g.mesh.position.y,g.mesh.position.z,rand(-40,40),rand(-20,40),rand(-40,40),.6);
  const isFinish=(G.gateIdx%GATE_N===0);
  if(G.mode!=='freeroam'){
   if(isFinish){const lapT=G.time-G.lapStart;G.lastLap=lapT;G.lapStart=G.time;G.lapCount=(G.lapCount||0)+1;
    if(!G.bestLap||lapT<G.bestLap)G.bestLap=lapT;
    if(save.bestLap==null||lapT<save.bestLap){save.bestLap=lapT;persist();}
    if(G.lapCount>=G.laps){finishRace();return;}
    else{banner(`LAP ${G.lapCount+1}/${G.laps}`,`LAST ${fmt(lapT)} • BEST ${fmt(G.bestLap)}`);G.credits+=25;save.credits+=25;persist();}
   } else toast(`GATE ${G.gateIdx%GATE_N}/${GATE_N-1} ✓`);
  } else {G.credits+=2;save.credits+=2;}
  G.gateIdx++;
  updateObjective();
 }
 // wrong way
 const fwdDot=tmpV.copy(player.vel).normalize().dot(player.frame.tan);
 if(player.speed>40)player.wrongWay=fwdDot<-0.3?(player.wrongWay||0)+dt:0;else player.wrongWay=0;
 if(player.wrongWay>1.2&&G.mode!=='freeroam')$('checkarrow').textContent='⚠ WRONG WAY — TURN AROUND';
 // position
 if(G.mode==='race'){
  let pos=1;const pt=(G.lapCount||0)+player.t;
  for(const a of ais){const at=(G['aiLap'+a.name]||0)+a.t;let dd=at-pt;if(dd>.5)dd-=1;if(dd<-.5)dd+=1;if(dd>0)pos++;}
  G.position=pos;
 }
 // events
 G.eventT-=dt;if(G.eventT<=0){G.eventT=rand(11,20);fireEvent();}
 // free roam timer
 if(G.mode==='freeroam'){G.freeT+=dt;if(G.freeT>1&&!G.revealShown){G.revealShown=true;banner('SECTOR 7 OPEN','LEAVE THE GATES — FIND WORMHOLES');}}
 // shield expiry UI
 if(elapsed>G.shieldUntil)$('shieldind').style.display='none';
 // fell too far -> auto reset
 if(player.dist>600&&player.resetCd<=0){resetToTrack();}
}
function finishRace(){
 G.state='finished';G.finished=true;AudioSys.hyper();flash(.6);
 save.races++;let won=false;
 if(G.mode==='race'){won=G.position===1;if(won){save.wins++;G.credits+=150;}else G.credits+=40+Math.max(0,6-G.position)*15;}
 else{G.credits+=60;}
 if(G.mode==='timetrial'){G.credits+=50;}
 save.credits+=G.credits;persist();
 // unlock check
 for(const v of VEHICLES)if(v.unlock&&save.credits>=v.unlock&&!save.unlocked.includes(v.id)){save.unlocked.push(v.id);persist();}
 $('finishmenu').classList.remove('hidden');
 $('finishtitle').textContent=G.mode==='freeroam'?'ROAM COMPLETE':G.position===1?'🏆 VICTORY!':`P${G.position} FINISH`;
 $('finishesub').textContent=`TIME ${fmt(G.time)} • BEST LAP ${fmt(G.bestLap)} • +${G.credits}⬡`;
 $('finishstats').innerHTML=`<div class="kv"><span>Total time</span><b>${fmt(G.time)}</b></div><div class="kv"><span>Best lap</span><b>${fmt(G.bestLap)}</b></div><div class="kv"><span>Top speed trap</span><b>${G.speedTraps.length?Math.max(...G.speedTraps)+' KM/H':'—'}</b></div><div class="kv"><span>Best air</span><b>${G.jumpBest.toFixed(1)}s</b></div><div class="kv"><span>Shards this run</span><b>${G.runShards}</b></div><div class="kv"><span>Wallet</span><b>${save.credits}⬡</b></div>`;
 banner('','');
}
function updateFinished(dt){ // slow orbit around player
 if(!player)return;elapsed+=0;for(const w of worldUpdaters)w.u(elapsed,dt);animateWorld(dt);
 const t=elapsed*.2;camera.position.lerp(tmpV.copy(player.pos).add(new THREE.Vector3(Math.cos(t)*60,24,Math.sin(t)*60)),dt*2);camera.lookAt(player.pos);}

/* ---------- camera ---------- */
const camTmp=new THREE.Vector3(),camUp=new THREE.Vector3(0,1,0);
function updateCamera(dt){
 if(!player)return;const P=player;
 const s01=clamp(Math.abs(P.speed)/300,0,1);
 const dist=camFar?26+s01*10:18+s01*6, h=camFar?10+s01*3:7.5;
 FWD.set(Math.sin(P.yaw),0,Math.cos(P.yaw));
 camTmp.copy(P.pos).addScaledVector(FWD,-dist);camTmp.y+=h;
 // keep above track a bit
 camPos.lerp(camTmp,1-Math.pow(.0015,dt));
 // shake
 shakeAmt=Math.max(0,shakeAmt-dt*2.2);
 const sh=shakeAmt+(P.boosting?.9:0)+s01*.35;
 camPos.x+=rand(-1,1)*sh*.7;camPos.y+=rand(-1,1)*sh*.5;
 camera.position.copy(camPos);
 camLook.copy(P.pos).addScaledVector(FWD,26);camLook.y+=4;
 camera.lookAt(camLook);
 // banking
 camera.rotation.z+=-Input.steer*.06-P.driftAmt*Math.sign(Input.steer||0)*.05;
 const wantFov=68+s01*12+(P.boosting?16:0);
 camera.fov=lerp(camera.fov,wantFov,dt*4);camera.updateProjectionMatrix();
 $('speedlines').style.opacity=P.boosting?.95:clamp((s01-.55)*2,0,.7);
}

/* ---------- HUD ---------- */
function updateHUD(dt){
 $('speed').innerHTML=`${Math.round(Math.abs(player.speed)*1.6)}<small> KM/H</small>`;
 $('boostfill').style.width=player.boost+'%';$('boostpct').textContent=Math.round(player.boost)+'%';
 $('boostfill').style.filter=player.boosting?'brightness(1.6)':'none';
 $('pos').innerHTML=(G.mode==='race'?('P'+G.position):G.mode==='timetrial'?'TT':'ROAM')+`<small>/${G.mode==='race'?'6':G.mode==='timetrial'?'SOLO':'∞'}</small>`;
 $('lap').textContent=G.mode==='freeroam'?`ROAM ${fmt(G.time)}`:`LAP ${Math.min((G.lapCount||0)+1,G.laps)}/${G.laps}`;
 $('timer').textContent=fmt(G.time);$('best').textContent='BEST '+fmt(G.bestLap||save.bestLap);
 $('pickupmsg').textContent=`CREDITS ${save.credits}⬡ (+${G.credits}) • DATA ${save.shards.length}/34 ⬢`;
 $('fps').textContent=Math.round(1/Math.max(dt,1e-4))+' fps';
 drawMinimap();
}

/* ---------- boot ---------- */
$('loading').classList.remove('hidden');
setTimeout(()=>{$('loading').classList.add('hidden');},400);
animate();
setTimeout(()=>{try{const h=$('finishtitle');}catch(e){}},1000);
// global error surface
addEventListener('error',e=>{const t=$('toast');if(t&&G.state!=='menu')t.textContent='⚠ '+(e.message||'error').slice(0,120);});
