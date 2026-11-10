// Décor 3D du mode arcade : la pièce de Karim, vue de dos, avant de plonger dans l'écran.
// Tout est procédural (aucun modèle ni image à charger). Le ciel suit l'heure du visiteur.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

const PAL = { teal: 0x34e0c4, amber: 0xf2b441, magenta: 0xe0567e, cream: 0xf3ecde, blue: 0x7fb2ff, ink: 0x12101f };
const SCREEN = new THREE.Vector3(0.5, 1.22, -1.7);

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function createScene(container, opts = {}) {
  const onSelect = opts.onSelect || (() => {});
  const lowPower = opts.quality ? opts.quality === 'low' : matchMedia('(pointer: coarse)').matches;
  const FONT = '"Press Start 2P", monospace';

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.fog = new THREE.FogExp2(0x888888, 0.0045);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 400);

  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0 }, o));
  const glow = (color, k = 2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k, roughness: 0.4 });

  function add(mesh, x, y, z, parent) {
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    (parent || scene).add(mesh); return mesh;
  }
  function box(w, h, d, m, x, y, z, r, parent) {
    const rr = r === undefined ? 0.012 : r;
    const g = rr > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(rr, w / 2, h / 2, d / 2) * 0.98) : new THREE.BoxGeometry(w, h, d);
    return add(new THREE.Mesh(g, m), x, y, z, parent);
  }
  function cyl(rt, rb, h, m, x, y, z, parent, seg = 28) { return add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), x, y, z, parent); }
  function ball(r, m, x, y, z, parent) { return add(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), m), x, y, z, parent); }
  function capsule(r, len, m, a, b, parent) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), m);
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    mesh.geometry = new THREE.CapsuleGeometry(r, A.distanceTo(B), 6, 16);
    mesh.position.copy(A).add(B).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    mesh.castShadow = true; mesh.receiveShadow = true; (parent || scene).add(mesh); return mesh;
  }
  function plane(w, h, m, x, y, z, parent) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.receiveShadow = true; (parent || scene).add(p); return p; }

  /* ---------------- textures ---------------- */
  const woodTex = canvasTex(1024, 1024, (g, w, h) => {
    const r = rng(7); const rows = 8, ph = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 300;
      while (x < w) {
        const pw = 260 + r() * 240, l = 30 + r() * 12;
        g.fillStyle = `hsl(${24 + r() * 8},${32 + r() * 10}%,${l}%)`; g.fillRect(x, i * ph, pw, ph);
        g.globalAlpha = 0.08;
        for (let k = 0; k < 26; k++) { g.fillStyle = r() > 0.5 ? '#000' : '#fff'; g.fillRect(x, i * ph + r() * ph, pw, 1 + r() * 2); }
        g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, i * ph, 3, ph);
        x += pw;
      }
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, i * ph, w, 3);
    }
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2.2, 2.2);

  const rugTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#1b1830'; g.fillRect(0, 0, w, h);
    const cols = ['#34e0c4', '#e0567e', '#f2b441'];
    for (let i = 0; i < 3; i++) { g.strokeStyle = cols[i]; g.lineWidth = 10; g.strokeRect(24 + i * 26, 24 + i * 26, w - 48 - i * 52, h - 48 - i * 52); }
    g.fillStyle = '#232043';
    for (let y = 130; y < h - 130; y += 32) for (let x = 130 + ((y / 32) % 2) * 16; x < w - 130; x += 32) g.fillRect(x, y, 16, 16);
  });

  const wallNoise = canvasTex(256, 256, (g, w, h) => {
    const r = rng(3); g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = 110 + r() * 40; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * w, r() * h, 2, 2); }
  });
  wallNoise.colorSpace = THREE.NoColorSpace; wallNoise.wrapS = wallNoise.wrapT = THREE.RepeatWrapping; wallNoise.repeat.set(4, 3);

  /* ---------------- pièce ---------------- */
  const wallM = M(0x3b3760, { roughness: 0.92, bumpMap: wallNoise, bumpScale: 0.6 });
  const trimM = M(0x1a1730, { roughness: 0.6 });
  const floor = plane(5.2, 4.6, M(0xffffff, { map: woodTex, roughness: 0.42, metalness: 0.0 }), 0, 0, 0.1);
  floor.rotation.x = -Math.PI / 2;
  box(5.4, 0.2, 4.8, wallM, 0, 2.8, 0.1, 0);                       // plafond
  box(0.2, 2.8, 4.8, wallM, -2.6, 1.35, 0.1, 0);                   // mur gauche
  box(0.2, 2.8, 4.8, wallM, 2.6, 1.35, 0.1, 0);                    // mur droit
  // mur du fond, percé d'une fenêtre (x -2.1..-0.6, y 0.95..2.25)
  box(0.5, 2.8, 0.2, wallM, -2.35, 1.35, -2.1, 0);
  box(3.2, 2.8, 0.2, wallM, 1.0, 1.35, -2.1, 0);
  box(1.5, 0.95, 0.2, wallM, -1.35, 0.475, -2.1, 0);
  box(1.5, 0.5, 0.2, wallM, -1.35, 2.5, -2.1, 0);
  box(5.0, 0.09, 0.03, trimM, 0, 0.045, -1.985, 0);                // plinthe
  // huisserie
  const frameM = M(0x14122a, { roughness: 0.5 });
  box(1.56, 0.05, 0.14, frameM, -1.35, 2.25, -2.04, 0.005); box(1.62, 0.05, 0.24, frameM, -1.35, 0.95, -2.0, 0.005);
  box(0.05, 1.3, 0.14, frameM, -2.1, 1.6, -2.04, 0.005); box(0.05, 1.3, 0.14, frameM, -0.6, 1.6, -2.04, 0.005);
  box(0.035, 1.3, 0.05, frameM, -1.35, 1.6, -2.06, 0.005); box(1.5, 0.035, 0.05, frameM, -1.35, 1.72, -2.06, 0.005);
  const glass = plane(1.5, 1.3, new THREE.MeshStandardMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.05, roughness: 0.05, metalness: 0, envMapIntensity: 0.15, depthWrite: false }), -1.35, 1.6, -2.07);
  glass.receiveShadow = false;
  // rideaux
  const curtainM = M(0x7a2f47, { roughness: 0.95 });
  for (const sx of [-2.22, -0.48]) for (let i = 0; i < 4; i++) box(0.07, 1.62, 0.07, curtainM, sx + (i - 1.5) * 0.06, 1.55, -1.93 + (i % 2) * 0.03, 0.03);
  box(2.1, 0.03, 0.03, M(0x8a8f9c, { metalness: 0.9, roughness: 0.3 }), -1.35, 2.38, -1.92, 0.01);
  // tapis
  const rug = plane(2.5, 1.9, M(0x9a9a9a, { map: rugTex, roughness: 1 }), 0.45, 0.006, -0.45); rug.rotation.x = -Math.PI / 2;

  /* ---------------- ciel + ville ---------------- */
  const skyU = {
    uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
    uNight: { value: 0 }, uTime: { value: 0 }
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      varying vec3 vDir; uniform vec3 uTop,uHor,uGround,uSunDir,uSunCol,uMoonDir; uniform float uNight,uTime;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        float a=hash(vec3(i,1.0)), b=hash(vec3(i+vec2(1,0),1.0)), c=hash(vec3(i+vec2(0,1),1.0)), d=hash(vec3(i+vec2(1,1),1.0));
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 col = mix(uHor, uTop, pow(clamp(h,0.0,1.0), 0.5));
        col = mix(col, uGround, smoothstep(0.0, -0.12, h));
        float s = max(dot(d, uSunDir), 0.0);
        col += uSunCol * (pow(s, 900.0) * 14.0 + pow(s, 14.0) * 0.45);
        // nuages
        vec2 cp = d.xz / max(h + 0.25, 0.08) * 1.4 + vec2(uTime * 0.004, 0.0);
        float cl = noise(cp) * 0.6 + noise(cp * 2.3) * 0.3 + noise(cp * 5.1) * 0.1;
        cl = smoothstep(0.6, 0.9, cl) * smoothstep(-0.02, 0.2, h);
        vec3 cloudCol = mix(uHor * 1.15 + uSunCol * 0.25, vec3(0.05,0.06,0.11), uNight);
        col = mix(col, cloudCol, cl * 0.75);
        // étoiles + lune
        vec3 g = floor(d * 190.0);
        float st = step(0.9972, hash(g)) * (0.5 + 0.5 * sin(uTime * 2.0 + hash(g + 3.0) * 40.0));
        col += vec3(0.9, 0.95, 1.0) * st * uNight * smoothstep(0.0, 0.25, h) * (1.0 - cl) * 1.6;
        float m = dot(d, uMoonDir);
        col += vec3(0.95, 0.97, 1.0) * smoothstep(0.9993, 0.9996, m) * uNight * 2.2 + vec3(0.3,0.4,0.7) * pow(max(m,0.0), 60.0) * uNight * 0.35;
        gl_FragColor = vec4(col, 1.0);
      }`
  }));
  sky.frustumCulled = false; scene.add(sky);

  const winTex = canvasTex(64, 128, (g, w, h) => {
    const r = rng(11); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 4; y < h - 4; y += 8) for (let x = 4; x < w - 4; x += 8) {
      if (r() > 0.45) { g.fillStyle = r() > 0.8 ? '#9fe8ff' : (r() > 0.5 ? '#ffd58a' : '#ffb35c'); g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(x, y, 5, 5); }
    }
    g.globalAlpha = 1;
  });
  const cityM = M(0x1d2233, { roughness: 0.85, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0 });
  {
    const r = rng(42), N = 90, inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityM, N), d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const z = -45 - r() * 90, x = (r() - 0.5) * 220, hgt = 10 + r() * r() * 38, w = 6 + r() * 9;
      d.position.set(x, -26 + hgt / 2, z); d.scale.set(w, hgt, w); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    }
    inst.frustumCulled = false; scene.add(inst);
    const ground = plane(400, 200, M(0x1c2030, { roughness: 1 }), 0, -26, -80); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = false;
  }

  /* ---------------- lumières ---------------- */
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true; sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
  sun.target.position.set(-0.6, 0.8, -0.8); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2140, 0.3); scene.add(hemi);
  const skyFill = new THREE.PointLight(0xffffff, 0, 6, 1.6); skyFill.position.set(-1.35, 1.7, -1.4); scene.add(skyFill);
  const screenLight = new THREE.PointLight(PAL.teal, 1.2, 3.2, 1.8); screenLight.position.set(0.5, 1.25, -1.35); scene.add(screenLight);
  const lamp = new THREE.SpotLight(0xffc98a, 0, 4, 0.9, 0.6, 1.4); lamp.position.set(-0.12, 1.22, -1.5); lamp.target.position.set(0.25, 0.75, -1.25);
  lamp.castShadow = !lowPower; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.001; scene.add(lamp, lamp.target);
  const ceil = new THREE.PointLight(0xffb070, 0, 7, 1.5); ceil.position.set(0.6, 2.4, 0.3); scene.add(ceil);
  const led = new THREE.PointLight(PAL.magenta, 0.8, 2.6, 1.8); led.position.set(0.5, 0.95, -1.88); scene.add(led);
  const tvLight = new THREE.PointLight(0x8fe0a8, 0.5, 2.2, 1.8); tvLight.position.set(1.95, 0.85, -1.3); scene.add(tvLight);

  /* ---------------- bureau ---------------- */
  const walnut = M(0x4a2f22, { roughness: 0.5 }), blackM = M(0x15141c, { roughness: 0.45, metalness: 0.3 }), plasticM = M(0x1d1c26, { roughness: 0.35 });
  box(1.9, 0.045, 0.8, walnut, 0.5, 0.75, -1.5, 0.012);
  for (const sx of [-0.38, 1.38]) { box(0.05, 0.73, 0.7, blackM, sx, 0.365, -1.5, 0.008); }
  box(1.7, 0.3, 0.02, blackM, 0.5, 0.52, -1.84, 0.005);
  box(1.6, 0.012, 0.012, glow(PAL.magenta, 3), 0.5, 0.74, -1.9, 0);     // ruban LED derrière le bureau
  box(0.9, 0.004, 0.4, M(0x17152a, { roughness: 0.9 }), 0.5, 0.775, -1.33, 0.002); // tapis de souris XL

  // écran principal
  const codeCanvas = document.createElement('canvas'); codeCanvas.width = 512; codeCanvas.height = 288;
  const codeCtx = codeCanvas.getContext('2d');
  const codeTex = new THREE.CanvasTexture(codeCanvas); codeTex.colorSpace = THREE.SRGBColorSpace;
  const codeLines = (() => { const r = rng(5), cols = ['#34e0c4', '#f2b441', '#e0567e', '#f3ecde', '#7fb2ff'], L = [];
    for (let i = 0; i < 60; i++) { const ind = Math.floor(r() * 4), toks = []; let n = 1 + Math.floor(r() * 4);
      if (r() < 0.12) n = 0; for (let k = 0; k < n; k++) toks.push([cols[Math.floor(r() * cols.length)], 18 + r() * 70]); L.push([ind, toks]); } return L; })();
  const monitorMsg = { until: -1, a: '', b: '', color: '#34e0c4' };
  function drawCode(t) {
    const g = codeCtx; g.fillStyle = '#0a1317'; g.fillRect(0, 0, 512, 288);
    g.fillStyle = '#12101f'; g.fillRect(0, 0, 512, 22); g.fillStyle = '#34e0c4'; g.fillRect(10, 7, 60, 8); g.fillStyle = '#34315a'; g.fillRect(80, 7, 50, 8); g.fillRect(140, 7, 50, 8);
    g.fillStyle = '#0e1a20'; g.fillRect(0, 22, 34, 266);
    const off = (t * 9) % (60 * 14), first = Math.floor(off / 14);
    for (let i = 0; i < 21; i++) { const ln = codeLines[(first + i) % 60], y = 30 + i * 14 - (off % 14);
      g.fillStyle = '#34315a'; g.fillRect(10, y, 14, 6); let x = 44 + ln[0] * 18;
      for (const tk of ln[1]) { g.fillStyle = tk[0]; g.fillRect(x, y, tk[1], 6); x += tk[1] + 8; } }
    if (Math.floor(t * 2) % 2) { g.fillStyle = '#f3ecde'; g.fillRect(44, 276, 8, 8); }
    if (t < monitorMsg.until) { g.fillStyle = 'rgba(10,19,23,.92)'; g.fillRect(40, 84, 432, 120); g.strokeStyle = monitorMsg.color; g.lineWidth = 4; g.strokeRect(42, 86, 428, 116); g.textAlign = 'center';
      g.fillStyle = monitorMsg.color; g.font = 'bold 26px monospace'; g.fillText(monitorMsg.a, 256, 136); g.fillStyle = '#f3ecde'; g.font = '18px monospace'; g.fillText(monitorMsg.b, 256, 172); g.textAlign = 'left'; }
    codeTex.needsUpdate = true;
  }
  drawCode(0);
  box(0.9, 0.52, 0.03, plasticM, 0.5, 1.22, -1.72, 0.01);
  const screen = plane(0.86, 0.484, new THREE.MeshBasicMaterial({ map: codeTex, color: new THREE.Color(1.5, 1.5, 1.5) }), SCREEN.x, SCREEN.y, -1.703);
  box(0.06, 0.24, 0.04, plasticM, 0.5, 0.9, -1.76, 0.008); box(0.3, 0.015, 0.2, plasticM, 0.5, 0.78, -1.74, 0.006);
  // enceintes
  for (const sx of [-0.12, 1.12]) { box(0.11, 0.2, 0.12, plasticM, sx, 0.875, -1.74, 0.012); const c = cyl(0.035, 0.035, 0.006, M(0x2a2836, { roughness: 0.3, metalness: 0.5 }), sx, 0.86, -1.678); c.rotation.x = Math.PI / 2; }
  // clavier RGB
  const keyTex = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const cols = ['#34e0c4', '#34e0c4', '#e0567e', '#f2b441'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { g.fillStyle = cols[(r + c) % 4]; g.globalAlpha = 0.85; g.fillRect(6 + c * 16.4, 6 + r * 17.5, 12, 13); } g.globalAlpha = 1; });
  box(0.38, 0.02, 0.135, plasticM, 0.46, 0.787, -1.3, 0.006);
  const keys = plane(0.36, 0.12, new THREE.MeshBasicMaterial({ map: keyTex, color: new THREE.Color(0.9, 0.9, 0.9) }), 0.46, 0.7985, -1.3); keys.rotation.x = -Math.PI / 2;
  const mouse = ball(0.03, plasticM, 0.78, 0.79, -1.3); mouse.scale.set(1, 0.55, 1.6);
  const mouseLed = box(0.006, 0.004, 0.03, glow(PAL.teal, 3), 0.78, 0.806, -1.3, 0);
  // tasse, dé, console portable, plante
  const mug = cyl(0.04, 0.035, 0.09, M(PAL.magenta, { roughness: 0.3 }), 0.13, 0.82, -1.32);
  const d20 = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.028, 0), M(PAL.amber, { roughness: 0.25, metalness: 0.2, flatShading: true })), 0.96, 0.8, -1.5); d20.rotation.set(0.4, 0.6, 0.2);
  const handheld = new THREE.Group(); handheld.position.set(-0.15, 0.785, -1.2); handheld.rotation.y = 0.5; scene.add(handheld);
  box(0.2, 0.016, 0.085, M(PAL.cream, { roughness: 0.4 }), 0, 0, 0, 0.008, handheld);
  const hs = plane(0.1, 0.06, glow(0x66d9a0, 1.2), 0, 0.009, 0, handheld); hs.rotation.x = -Math.PI / 2;
  cyl(0.008, 0.008, 0.006, M(PAL.magenta), 0.075, 0.01, -0.01, handheld, 12); cyl(0.008, 0.008, 0.006, M(PAL.teal), 0.06, 0.01, 0.012, handheld, 12);
  box(0.022, 0.005, 0.008, M(PAL.ink), -0.072, 0.01, 0, 0, handheld); box(0.008, 0.005, 0.022, M(PAL.ink), -0.072, 0.01, 0, 0, handheld);
  cyl(0.055, 0.04, 0.09, M(0xd9d2c2, { roughness: 0.6 }), 1.28, 0.82, -1.25);
  { const leafM = M(0x2f9a5f, { roughness: 0.6 }), r = rng(9);
    for (let i = 0; i < 9; i++) { const a = r() * 6.28, l = capsule(0.012, 0.1, leafM, [1.28, 0.86, -1.25], [1.28 + Math.cos(a) * (0.05 + r() * 0.07), 0.95 + r() * 0.12, -1.25 + Math.sin(a) * (0.05 + r() * 0.07)]); l.scale.x = 2.2; } }
  // téléphone (contact)
  const phone = new THREE.Group(); phone.position.set(0.98, 0.782, -1.26); phone.rotation.y = -0.3; scene.add(phone);
  box(0.075, 0.009, 0.15, plasticM, 0, 0, 0, 0.004, phone);
  const phoneTex = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#12101f'; g.fillRect(0, 0, w, h); g.fillStyle = '#34e0c4'; g.fillRect(8, 16, 48, 10); g.fillStyle = '#f3ecde'; g.fillRect(8, 40, 40, 6); g.fillRect(8, 54, 30, 6); g.fillStyle = '#f2b441'; g.fillRect(8, 96, 48, 16); });
  const ps = plane(0.066, 0.138, new THREE.MeshBasicMaterial({ map: phoneTex, color: new THREE.Color(1.1, 1.1, 1.1) }), 0, 0.0052, 0, phone); ps.rotation.x = -Math.PI / 2;
  // lampe de bureau
  const metalM = M(0xc9ccd6, { metalness: 0.9, roughness: 0.3 });
  cyl(0.07, 0.08, 0.02, metalM, -0.25, 0.782, -1.62);
  capsule(0.01, 0.4, metalM, [-0.25, 0.79, -1.62], [-0.3, 1.2, -1.62]); capsule(0.01, 0.2, metalM, [-0.3, 1.2, -1.62], [-0.14, 1.27, -1.52]);
  const shade = add(new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.1, 24, 1, true), M(PAL.amber, { roughness: 0.4, side: THREE.DoubleSide })), -0.13, 1.25, -1.51); shade.rotation.set(0.5, 0, -0.6);
  const bulb = ball(0.025, glow(0xffd9a0, 0), -0.12, 1.225, -1.5); bulb.castShadow = false;
  // tour PC avec ventilos RGB
  box(0.22, 0.46, 0.44, blackM, 1.24, 1.003, -1.6, 0.012);
  const fans = [];
  [PAL.teal, PAL.magenta, PAL.amber].forEach((c, i) => {
    const f = new THREE.Group(); f.position.set(1.24, 0.87 + i * 0.135, -1.377); scene.add(f); fans.push(f);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 32), glow(c, 2.6)); f.add(ring);
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.002), M(0x2a2836, { roughness: 0.4 })); b.position.set(Math.cos(k * 1.2566) * 0.022, Math.sin(k * 1.2566) * 0.022, 0); b.rotation.z = k * 1.2566 + 0.5; f.add(b); }
  });
  const pcGlass = plane(0.21, 0.44, new THREE.MeshPhysicalMaterial({ color: 0x111118, transparent: true, opacity: 0.25, roughness: 0.05 }), 1.24, 1.003, -1.378); pcGlass.receiveShadow = false;

  /* ---------------- chaise + Karim de dos ---------------- */
  const chair = new THREE.Group(); chair.position.set(0.5, 0, -0.78); chair.rotation.y = 0.12; scene.add(chair);
  const seatM = M(0x1d1b2a, { roughness: 0.75 }), accentM = M(PAL.magenta, { roughness: 0.6 });
  for (let i = 0; i < 5; i++) { const a = i * 1.2566, leg = box(0.3, 0.03, 0.045, blackM, Math.cos(a) * 0.15, 0.07, Math.sin(a) * 0.15, 0.01, chair); leg.rotation.y = -a; ball(0.03, plasticM, Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3, chair); }
  cyl(0.025, 0.03, 0.33, metalM, 0, 0.25, 0, chair);
  box(0.52, 0.1, 0.5, seatM, 0, 0.47, 0, 0.045, chair);
  const back = box(0.5, 0.6, 0.09, seatM, 0, 0.84, 0.26, 0.045, chair); back.rotation.x = 0.1;
  for (const sx of [-0.2, 0.2]) { const st = box(0.05, 0.56, 0.095, accentM, sx, 0.84, 0.262, 0.03, chair); st.rotation.x = 0.1; }
  for (const sx of [-0.3, 0.3]) { box(0.03, 0.2, 0.03, blackM, sx, 0.58, 0.05, 0.008, chair); box(0.07, 0.03, 0.26, plasticM, sx, 0.69, 0.0, 0.012, chair); }

  const me = new THREE.Group(); me.position.set(0.5, 0, -0.8); me.rotation.y = 0.06; scene.add(me);
  const hoodie = M(0xc75d43, { roughness: 0.9 }), skin = M(0xc98b66, { roughness: 0.6 }), hair = M(0x1f1820, { roughness: 0.8 }), jeans = M(0x2a3350, { roughness: 0.85 });
  const torso = capsule(0.175, 0.3, hoodie, [0, 0.62, 0.06], [0, 0.98, -0.02], me); torso.scale.set(1.12, 1, 0.82);
  const hood = ball(0.13, hoodie, 0, 1.05, 0.09, me); hood.scale.set(1.25, 0.75, 0.7);
  cyl(0.05, 0.055, 0.08, skin, 0, 1.1, -0.01, me);
  const head = new THREE.Group(); head.position.set(0, 1.23, -0.03); me.add(head);
  ball(0.108, skin, 0, 0, 0, head);
  const hairMesh = add(new THREE.Mesh(new THREE.SphereGeometry(0.116, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), hair), 0, 0.006, 0.012, head); hairMesh.rotation.x = 0.35;
  for (const sx of [-1, 1]) ball(0.022, skin, sx * 0.108, -0.01, 0, head);
  const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.011, 10, 32, Math.PI), plasticM), 0, 0.01, 0, head);
  for (const sx of [-1, 1]) { const cup = cyl(0.045, 0.045, 0.035, plasticM, sx * 0.125, -0.005, 0, head); cup.rotation.z = Math.PI / 2;
    const ringL = add(new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 24), glow(PAL.teal, 2.6)), sx * 0.144, -0.005, 0, head); ringL.rotation.y = Math.PI / 2; }
  // jambes sous le bureau
  for (const sx of [-1, 1]) {
    capsule(0.075, 0.3, jeans, [sx * 0.1, 0.55, 0.02], [sx * 0.12, 0.53, -0.4], me); capsule(0.06, 0.3, jeans, [sx * 0.12, 0.53, -0.4], [sx * 0.12, 0.1, -0.46], me);
    box(0.1, 0.07, 0.24, M(PAL.cream, { roughness: 0.5 }), sx * 0.12, 0.04, -0.52, 0.03, me);
  }
  // bras articulés : deux segments, les mains suivent des cibles animées (taper, souris, boire, s'étirer)
  const L1 = 0.27, L2 = 0.3, armRig = [], Y = new THREE.Vector3(0, 1, 0);
  for (const sx of [-1, 1]) {
    const up = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, L1, 6, 14), hoodie), 0, 0, 0, me);
    const fo = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.048, L2, 6, 14), hoodie), 0, 0, 0, me);
    const hand = ball(0.04, skin, 0, 0, 0, me);
    armRig.push({ up, fo, hand, S: new THREE.Vector3(sx * 0.21, 0.95, 0), H: new THREE.Vector3(), E: new THREE.Vector3(), pole: new THREE.Vector3(sx * 0.8, -0.6, 0.15).normalize() });
  }
  me.attach(mug); me.attach(mouse); mouse.attach(mouseLed);
  const mugHome = mug.position.clone(), mouseHome = mouse.position.clone();
  const KEY = [new THREE.Vector3(-0.13, 0.83, -0.5), new THREE.Vector3(0.05, 0.83, -0.5)];
  const GRAB = mugHome.clone().add(new THREE.Vector3(0.0, 0.0, 0.07)), MOUTH = new THREE.Vector3(-0.05, 1.15, -0.12), MOUSEH = mouseHome.clone().add(new THREE.Vector3(0, 0.035, 0.02));
  const ik1 = new THREE.Vector3(), ik2 = new THREE.Vector3();
  function limb(mesh, a, b) { mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(Y, ik1.copy(b).sub(a).normalize()); }
  function solveArm(r) {
    ik1.copy(r.H).sub(r.S); const raw = ik1.length(), len = Math.min(Math.max(raw, 0.08), L1 + L2 - 0.005); ik1.multiplyScalar(1 / raw);
    const a = (L1 * L1 - L2 * L2 + len * len) / (2 * len), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    ik2.copy(r.pole).addScaledVector(ik1, -r.pole.dot(ik1)).normalize();
    r.E.copy(r.S).addScaledVector(ik1, a).addScaledVector(ik2, h); r.hand.position.copy(r.S).addScaledVector(ik1, len);
    const hp = r.hand.position.clone(); limb(r.up, r.S, r.E); limb(r.fo, r.E, hp);
  }
  let action = null, nextAction = 5, hp = 2, drinkHealed = false;
  function startAction(name, t) { if (action && action.name === name) return; action = { name, t0: t }; drinkHealed = false; }
  function animateMe(t) {
    if (!action && t > nextAction) { const r = Math.random(); startAction(r < 0.45 ? 'mouse' : r < 0.7 ? 'drink' : r < 0.85 ? 'stretch' : 'look', t); }
    const L = armRig[0], R = armRig[1]; let held = null, headY = Math.sin(t * 0.35) * 0.1, headX = Math.sin(t * 0.5) * 0.03, lean = 0;
    L.H.copy(KEY[0]); R.H.copy(KEY[1]);
    L.H.y += Math.abs(Math.sin(t * 11)) * 0.008; R.H.y += Math.abs(Math.sin(t * 11 + 1.3)) * 0.008; L.H.x += Math.sin(t * 2.3) * 0.015; R.H.x += Math.sin(t * 1.9 + 2) * 0.015;
    mug.position.copy(mugHome); mug.rotation.set(0, 0, 0); mouse.position.copy(mouseHome);
    if (action) {
      const u = action.hold !== undefined ? action.hold : t - action.t0; let dur = 4;
      if (action.name === 'mouse') {
        const k = smooth(0, 0.4, u) * (1 - smooth(3.6, 4, u)), wx = Math.sin(u * 5) * 0.03 * k, wz = Math.cos(u * 3.7) * 0.02 * k;
        R.H.lerp(ik2.copy(MOUSEH).add(ik1.set(wx, 0, wz)), k); mouse.position.x += wx; mouse.position.z += wz; headY *= 0.3;
      } else if (action.name === 'drink') {
        dur = 4.2; const g = smooth(0, 0.6, u) * (1 - smooth(3.5, 4.1, u)), m = smooth(0.7, 1.4, u) * (1 - smooth(2.6, 3.3, u)), sip = smooth(1.3, 1.7, u) * (1 - smooth(2.3, 2.6, u));
        L.H.lerp(GRAB, g).lerp(MOUTH, m);
        if (u > 0.6 && u < 3.5) held = { m, sip };
        headX += sip * 0.32; headY *= 1 - m;
        if (sip > 0.9 && !drinkHealed) { drinkHealed = true; if (hp < 3) { hp = 3; drawHearts(); toast('+HP · ' + '♥'.repeat(hp)); } }
      } else if (action.name === 'stretch') {
        dur = 3.6; const k = smooth(0, 0.9, u) * (1 - smooth(2.6, 3.5, u));
        L.H.lerp(ik1.set(-0.36, 1.4, 0.1), k); R.H.lerp(ik1.set(0.36, 1.4, 0.1), k); lean = k; headX += k * 0.25;
      } else if (action.name === 'look') {
        const k = smooth(0, 0.8, u) * (1 - smooth(3.1, 3.9, u)); headY = lerp(headY, 0.75, k);
      }
      if (u > dur) { action = null; nextAction = t + 5 + Math.random() * 7; }
    }
    head.rotation.set(headX, headY, 0); me.rotation.x = lean * 0.07;
    solveArm(L); solveArm(R);
    if (held) { mug.position.copy(L.hand.position); mug.position.z -= 0.07 * (1 - held.m) + 0.045 * held.m; mug.position.y += 0.02 * held.m; mug.rotation.x = held.sip * 0.9; }
  }

  /* ---------------- coin rétro : télé cathodique, console, cartouches ---------------- */
  box(0.95, 0.5, 0.46, walnut, 1.95, 0.25, -1.74, 0.012);
  box(0.42, 0.2, 0.01, M(0x2e1c14, { roughness: 0.6 }), 1.73, 0.25, -1.508, 0.004); box(0.42, 0.2, 0.01, M(0x2e1c14, { roughness: 0.6 }), 2.17, 0.25, -1.508, 0.004);
  box(0.62, 0.5, 0.44, M(0x2b2a33, { roughness: 0.55 }), 1.95, 0.76, -1.74, 0.03);
  const tvCanvas = document.createElement('canvas'); tvCanvas.width = 160; tvCanvas.height = 120; const tvCtx = tvCanvas.getContext('2d');
  const tvTex = new THREE.CanvasTexture(tvCanvas); tvTex.colorSpace = THREE.SRGBColorSpace; tvTex.magFilter = THREE.NearestFilter;
  let fontOk = false;
  let tvMode = 0;
  function drawTV(t) {
    const g = tvCtx;
    if (tvMode === 1) { g.fillStyle = '#12101f'; g.fillRect(0, 0, 160, 120); const cols = ['#e0567e', '#f2b441', '#34e0c4', '#7fb2ff'];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) if ((r * 9 + c + Math.floor(t / 3)) % 7) { g.fillStyle = cols[r]; g.fillRect(8 + c * 16, 10 + r * 9, 14, 7); }
      const bx = 80 + Math.sin(t * 1.7) * 62, by = 62 + Math.abs(Math.sin(t * 2.3)) * 40; g.fillStyle = '#f3ecde'; g.fillRect(bx - 2, by - 2, 4, 4); g.fillRect(bx - 12, 110, 24, 4); tvTex.needsUpdate = true; return; }
    if (tvMode === 2) { for (let y = 0; y < 120; y += 4) for (let x = 0; x < 160; x += 4) { const v = Math.floor(Math.random() * 200); g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x, y, 4, 4); }
      g.fillStyle = '#12101f'; g.fillRect(40, 50, 80, 20); g.fillStyle = '#f3ecde'; g.textAlign = 'center'; g.font = (fontOk ? '7px ' : 'bold 9px ') + FONT; g.fillText('NO SIGNAL', 80, 64); tvTex.needsUpdate = true; return; } g.fillStyle = '#2f7d4f'; g.fillRect(0, 0, 160, 120);
    g.fillStyle = '#2b6fb0'; g.fillRect(104, 0, 56, 30); g.fillStyle = '#d9c38a'; g.fillRect(0, 62, 160, 10); g.fillRect(76, 0, 10, 86);
    g.fillStyle = '#f3ecde'; g.fillRect(18, 30, 32, 22); g.fillStyle = '#1f9c88'; g.fillRect(18, 22, 32, 10); g.fillStyle = '#12101f'; g.fillRect(30, 40, 8, 12);
    g.fillStyle = '#f3ecde'; g.fillRect(112, 38, 30, 20); g.fillStyle = '#e0567e'; g.fillRect(112, 30, 30, 10);
    g.fillStyle = '#1d5a37'; [[60, 40], [140, 76], [8, 76], [96, 44]].forEach(p => g.fillRect(p[0], p[1], 8, 8));
    const hx = 78 + Math.round(Math.sin(t * 0.8) * 22); g.fillStyle = '#1f1820'; g.fillRect(hx, 58, 6, 3); g.fillStyle = '#c98b66'; g.fillRect(hx, 61, 6, 3); g.fillStyle = '#c75d43'; g.fillRect(hx - 1, 64, 8, 5);
    g.fillStyle = '#12101f'; g.fillRect(0, 88, 160, 32); g.textAlign = 'center';
    g.fillStyle = '#f2b441'; g.font = (fontOk ? '8px ' : 'bold 10px ') + FONT; g.fillText('KARIM QUEST', 80, 102);
    if (Math.floor(t * 1.6) % 2) { g.fillStyle = '#f3ecde'; g.font = (fontOk ? '6px ' : '8px ') + FONT; g.fillText('PRESS START', 80, 114); }
    tvTex.needsUpdate = true;
  }
  drawTV(0);
  const tvScreen = plane(0.46, 0.345, new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(1.2, 1.2, 1.2) }), 1.91, 0.775, -1.517);
  box(0.035, 0.12, 0.01, M(0x15141c), 2.2, 0.82, -1.519, 0.003); ball(0.008, glow(PAL.magenta, 3), 2.2, 0.62, -1.517);
  // console + cartouche insérée + manette
  const cartM = (c) => M(c, { roughness: 0.45 });
  function cartridge(name, color, x, y, z, parent) {
    const g = new THREE.Group(); g.position.set(x, y, z); (parent || scene).add(g);
    box(0.105, 0.125, 0.022, cartM(color), 0, 0, 0, 0.008, g);
    const lt = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#12101f'; c.fillRect(0, 0, w, h); c.fillStyle = '#' + new THREE.Color(color).getHexString(); c.fillRect(0, 0, w, 26); c.fillRect(0, h - 10, w, 10);
      c.fillStyle = '#f3ecde'; c.textAlign = 'center'; c.font = (fontOk ? '13px ' : 'bold 17px ') + FONT; const n = name.length > 8 ? [name.slice(0, 5), name.slice(5)] : [name]; n.forEach((s, i) => c.fillText(s, w / 2, 66 + i * 24 - (n.length - 1) * 10)); });
    const l = plane(0.085, 0.085, M(0xffffff, { map: lt, roughness: 0.5 }), 0, 0.008, 0.0115, g); l.castShadow = false; g.userData.label = { mesh: l, name, color };
    return g;
  }
  const consoleG = new THREE.Group(); consoleG.position.set(1.85, 0, -1.08); consoleG.rotation.y = -0.25; scene.add(consoleG);
  box(0.34, 0.07, 0.24, M(0xcfc7b4, { roughness: 0.5 }), 0, 0.035, 0, 0.015, consoleG); box(0.13, 0.008, 0.035, M(PAL.ink), 0, 0.071, -0.02, 0.002, consoleG);
  box(0.05, 0.012, 0.03, M(PAL.magenta), -0.11, 0.074, 0.07, 0.004, consoleG); ball(0.006, glow(PAL.teal, 3), 0.13, 0.072, 0.09, consoleG);
  const carts = [cartridge('AQUARYS', PAL.teal, 0, 0.115, -0.02, consoleG)];
  const pad = new THREE.Group(); pad.position.set(1.42, 0.02, -0.72); pad.rotation.y = 0.6; scene.add(pad);
  box(0.16, 0.03, 0.075, M(0xcfc7b4, { roughness: 0.5 }), 0, 0, 0, 0.012, pad); box(0.03, 0.006, 0.01, M(PAL.ink), -0.045, 0.017, 0, 0, pad); box(0.01, 0.006, 0.03, M(PAL.ink), -0.045, 0.017, 0, 0, pad);
  cyl(0.009, 0.009, 0.006, M(PAL.magenta), 0.04, 0.017, -0.012, pad, 12); cyl(0.009, 0.009, 0.006, M(PAL.teal), 0.058, 0.017, 0.01, pad, 12);
  { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(1.47, 0.012, -0.76), new THREE.Vector3(1.6, 0.01, -0.9), new THREE.Vector3(1.62, 0.01, -1.02), new THREE.Vector3(1.72, 0.03, -1.0)]);
    add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.004, 6), M(PAL.ink, { roughness: 0.6 })), 0, 0, 0); }
  // étagères : cartouches-projets, boîtes de jeux, mini-borne, cristal
  box(0.95, 0.03, 0.2, walnut, 1.95, 1.5, -1.9, 0.006); box(0.95, 0.03, 0.2, walnut, 1.95, 1.92, -1.9, 0.006);
  [['VIGIE', PAL.magenta], ['CLASSIFILE', PAL.amber], ['SIDEQUEST', PAL.blue], ['LUMEA', PAL.cream], ['AVELYO', 0x5fd08a], ['LIFE OS', 0xff9e5c]].forEach((p, i) => { const c = cartridge(p[0], p[1], 1.58 + i * 0.148, 1.578, -1.88); c.rotation.x = -0.08; carts.push(c); });
  { const r = rng(21), cols = [0x34e0c4, 0xe0567e, 0xf2b441, 0x7fb2ff, 0x5b6cc9, 0xf3ecde, 0x7a2f47]; let x = 1.55;
    for (let i = 0; i < 11; i++) { const w = 0.018 + r() * 0.012; box(w, 0.19, 0.13, M(cols[i % cols.length], { roughness: 0.5 }), x + w / 2, 2.03, -1.9, 0.003); x += w + 0.002; }
    // mini-borne d'arcade
    const mb = new THREE.Group(); mb.position.set(2.17, 1.935, -1.9); scene.add(mb);
    box(0.13, 0.24, 0.12, M(0x232043, { roughness: 0.5 }), 0, 0.12, 0, 0.008, mb); box(0.13, 0.04, 0.125, M(PAL.amber, { roughness: 0.4 }), 0, 0.225, 0, 0.006, mb);
    plane(0.1, 0.075, glow(PAL.teal, 1.6), 0, 0.15, 0.0615, mb); box(0.13, 0.02, 0.05, M(0x34315a), 0, 0.09, 0.075, 0.004, mb);
    cyl(0.004, 0.004, 0.03, M(PAL.ink), -0.03, 0.115, 0.08, mb, 8); ball(0.009, M(PAL.magenta, { roughness: 0.3 }), -0.03, 0.133, 0.08, mb); }
  // néons : « KARIM.EXE » au-dessus de l'écran, cœurs de vie à côté
  const neonTex = canvasTex(512, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = 'bold 54px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('KARIM.EXE', w / 2, h / 2 + 4); });
  const neonM = new THREE.MeshStandardMaterial({ color: 0, emissive: PAL.teal, emissiveMap: neonTex, emissiveIntensity: 2.4, transparent: true, alphaMap: neonTex, depthWrite: false });
  const neon = plane(1.1, 0.2, neonM, 0.5, 1.95, -1.99); neon.receiveShadow = false;
  const neonLight = new THREE.PointLight(PAL.teal, 0.5, 2.5, 1.8); neonLight.position.set(0.5, 1.95, -1.8); scene.add(neonLight);
  const heartTex = canvasTex(96, 32, () => {});
  function drawHearts() { const g = heartTex.image.getContext('2d'); g.clearRect(0, 0, 96, 32); const H = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
    for (let k = 0; k < 3; k++) H.forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') { g.fillStyle = k >= hp ? '#444' : '#fff'; g.fillRect(4 + k * 32 + x * 3.5, 5 + y * 3.5, 3.5, 3.5); } })); heartTex.needsUpdate = true; }
  heartTex.magFilter = THREE.NearestFilter;
  const hearts = plane(0.54, 0.18, new THREE.MeshStandardMaterial({ color: 0, emissive: PAL.magenta, emissiveMap: heartTex, emissiveIntensity: 2.6, transparent: true, alphaMap: heartTex, depthWrite: false }), 1.2, 2.33, -1.99); hearts.receiveShadow = false;
  drawHearts();
  // mur gauche : tableau en liège (parcours) + affiches pixel
  const board = new THREE.Group(); board.position.set(2.49, 1.5, -0.95); board.rotation.y = -Math.PI / 2; scene.add(board);
  box(1.05, 0.72, 0.025, M(0x9a6b45, { roughness: 0.95 }), 0, 0, 0, 0.004, board);
  { const r = rng(17), cols = [0xf3ecde, 0xf2b441, 0x34e0c4, 0xe0567e, 0xf3ecde, 0x7fb2ff];
    for (let i = 0; i < 6; i++) { const n = box(0.2, 0.16, 0.004, M(cols[i], { roughness: 0.8 }), -0.34 + (i % 3) * 0.34, 0.16 - Math.floor(i / 3) * 0.32, 0.016, 0, board); n.rotation.z = (r() - 0.5) * 0.25; ball(0.012, M(PAL.magenta, { roughness: 0.3 }), n.position.x, n.position.y + 0.06, 0.024, board); } }
  function poster(draw, x, y, z, ry, w, h) { const t = canvasTex(64, 80, draw); t.magFilter = THREE.NearestFilter; const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
    box(w + 0.04, h + 0.04, 0.02, M(PAL.ink, { roughness: 0.5 }), 0, 0, 0, 0.003, g); const p = plane(w, h, M(0xffffff, { map: t, roughness: 0.6 }), 0, 0, 0.0105, g); p.castShadow = false; }
  poster((g) => { g.fillStyle = '#1b1830'; g.fillRect(0, 0, 64, 80); g.fillStyle = '#34e0c4'; g.fillRect(30, 10, 4, 40); g.fillStyle = '#f3ecde'; g.fillRect(31, 12, 2, 36); g.fillStyle = '#f2b441'; g.fillRect(22, 50, 20, 4); g.fillStyle = '#7a2f47'; g.fillRect(30, 54, 4, 12); g.fillStyle = '#f2b441'; g.fillRect(29, 66, 6, 4); }, -2.49, 1.6, 0.75, Math.PI / 2, 0.42, 0.52);
  poster((g) => { g.fillStyle = '#3d1626'; g.fillRect(0, 0, 64, 80); g.fillStyle = '#f3ecde'; g.fillRect(26, 14, 12, 8); g.fillRect(28, 22, 8, 8); g.fillStyle = '#e0567e'; g.fillRect(20, 30, 24, 30); g.fillStyle = '#ff9db8'; g.fillRect(24, 36, 6, 10); g.fillStyle = '#f3ecde'; g.fillRect(20, 30, 24, 3); }, -2.49, 1.6, 1.35, Math.PI / 2, 0.42, 0.52);
  // cristal de sauvegarde + pouf
  cyl(0.14, 0.17, 0.5, M(0x2a2740, { roughness: 0.6 }), -2.1, 0.25, -1.45);
  const crystal = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshPhysicalMaterial({ color: 0x0a2a25, emissive: PAL.teal, emissiveIntensity: 1.4, roughness: 0.1, metalness: 0.1, flatShading: true })), -2.1, 0.78, -1.45); crystal.scale.y = 1.5;
  const crystalLight = new THREE.PointLight(PAL.teal, 0.6, 2, 1.8); crystalLight.position.set(-2.1, 0.8, -1.45); scene.add(crystalLight);
  const bean = ball(0.42, M(0x5b6cc9, { roughness: 0.95 }), -1.55, 0.24, 0.15); bean.scale.set(1.1, 0.6, 1);

  // poussière dans la lumière
  const dustN = 160, dustG = new THREE.BufferGeometry(), dustP = new Float32Array(dustN * 3), dr = rng(31);
  for (let i = 0; i < dustN; i++) { dustP[i * 3] = -2.2 + dr() * 2.6; dustP[i * 3 + 1] = 0.2 + dr() * 2.2; dustP[i * 3 + 2] = -1.9 + dr() * 2.2; }
  dustG.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
  const dustM = new THREE.PointsMaterial({ color: 0xffe2b8, size: 0.007, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const dust = new THREE.Points(dustG, dustM); scene.add(dust);

  /* ---------------- heure du système → ciel et éclairage ---------------- */
  const C = (h) => new THREE.Color(h);
  const K = { nTop: C(0x04050f), nHor: C(0x101737), dTop: C(0x1a55c4), dHor: C(0x86bdf5), tTop: C(0x2b2a66), tHor: C(0xff7b45), ground: C(0x1a1d2a) };
  const sunDir = new THREE.Vector3(), moonDir = new THREE.Vector3(), tmpC = new THREE.Color();
  let lastHour = -1, lampBase = 0, lampOverride = null;
  function setLamp() { const on = lampOverride === null ? lampBase : (lampOverride ? 1 : 0); lamp.intensity = 14 * on; bulb.material.emissiveIntensity = 4 * on; }
  function currentHour() { if (typeof opts.hour === 'number') return opts.hour; const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function applyTime(h) {
    lastHour = h;
    const dayT = (h - 6) / 13;                       // 0 au lever (6 h), 1 au coucher (19 h)
    const isDay = dayT >= 0 && dayT <= 1;
    const e = isDay ? Math.sin(Math.PI * dayT) : -Math.sin(Math.PI * (((h - 19 + 24) % 24) / 11));
    const day = smooth(-0.08, 0.3, e), night = 1 - smooth(-0.3, 0.02, e), twi = 1 - smooth(0.0, 0.5, Math.abs(e));
    const az = isDay ? dayT : ((h - 19 + 24) % 24) / 11;
    sunDir.set(-Math.cos(Math.PI * dayT) * 0.6, Math.max(e, -0.2) * 0.9 + 0.1, -0.6).normalize();
    moonDir.set(-Math.cos(Math.PI * az) * 0.8, 0.35 + Math.sin(Math.PI * az) * 0.35, -0.8).normalize();
    skyU.uTop.value.copy(K.nTop).lerp(K.dTop, day).lerp(K.tTop, twi * 0.55);
    skyU.uHor.value.copy(K.nHor).lerp(K.dHor, day).lerp(K.tHor, twi * 0.85);
    skyU.uGround.value.copy(K.ground).lerp(skyU.uHor.value, 0.35);
    skyU.uSunDir.value.copy(sunDir); skyU.uMoonDir.value.copy(moonDir); skyU.uNight.value = night;
    const warm = smooth(0.0, 0.55, e);
    skyU.uSunCol.value.set(0xff7a3a).lerp(tmpC.set(0xfff3e0), warm).multiplyScalar(smooth(-0.12, 0.05, e));
    scene.fog.color.copy(skyU.uHor.value);
    if (e > -0.02) { sun.color.set(0xff8a4a).lerp(tmpC.set(0xfff1dc), warm); sun.intensity = 9 * smooth(-0.02, 0.28, e) + 0.6 * twi * (e > 0 ? 1 : 0); sun.position.copy(sun.target.position).addScaledVector(sunDir, 14); }
    else { sun.color.set(0x8fa8ff); sun.intensity = 0.55 * night; sun.position.copy(sun.target.position).addScaledVector(moonDir, 14); }
    hemi.color.copy(skyU.uTop.value).lerp(skyU.uHor.value, 0.5); hemi.intensity = 0.08 + 0.75 * day + 0.2 * twi;
    skyFill.color.copy(skyU.uHor.value).lerp(skyU.uTop.value, 0.4); skyFill.intensity = 10 * day + 3 * twi + 0.25 * night;
    scene.environmentIntensity = 0.1 + 0.3 * day;
    const L = 1 - smooth(0.1, 0.45, e);               // lampes d'intérieur : allumées dès que le jour baisse
    lampBase = L; setLamp(); ceil.intensity = 2.2 * L;
    screenLight.intensity = 0.7 + 1.1 * L; led.intensity = 0.4 + 0.9 * L; neonLight.intensity = 0.25 + 0.6 * L; tvLight.intensity = 0.3 + 0.5 * L; crystalLight.intensity = 0.3 + 0.6 * L;
    cityM.emissiveIntensity = 2.2 * (1 - smooth(-0.05, 0.3, e));
    dustM.opacity = 0.3 * smooth(0.02, 0.3, e);
    renderer.toneMappingExposure = 0.95 + 0.2 * night;
  }

  /* ---------------- post-traitement ---------------- */
  const size = new THREE.Vector2(1, 1);
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: lowPower ? 2 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (!lowPower && opts.ao !== false) {
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
    gtao.blendIntensity = 0.9; composer.addPass(gtao);
  }
  const bloom = new UnrealBloomPass(size.clone(), 0.42, 0.7, 0.92); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------------- caméra, parallaxe, points d'intérêt ---------------- */
  const pivot = new THREE.Vector3(0.3, 1.1, -1.2), basePos = new THREE.Vector3(-0.05, 1.68, 2.02), look = new THREE.Vector3();
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, portrait = false, diving = null, moved = 0, dragging = false, lx = 0, ly = 0;
  const tags = {}, tagPos = { screen: new THREE.Vector3(0.5, 1.56, -1.7), projects: new THREE.Vector3(1.95, 1.74, -1.86), about: new THREE.Vector3(2.45, 1.95, -0.95), contact: new THREE.Vector3(0.98, 0.9, -1.26) };
  const style = document.createElement('style');
  style.textContent = '.s3-tag{position:absolute;left:0;top:0;transform:translate(-50%,-100%);font-family:' + FONT + ';font-size:9px;line-height:1.5;color:#12101F;background:#F2B441;border:0;padding:8px 10px;cursor:pointer;white-space:nowrap;box-shadow:0 4px 0 #8a5a12;transition:opacity .3s,background .15s;min-height:32px}.s3-tag::after{content:"";position:absolute;left:50%;top:100%;width:2px;height:14px;background:#F2B441;transform:translate(-50%,4px)}.s3-tag:hover,.s3-tag:focus-visible{background:#34E0C4;outline:none}.s3-tag.main{background:#34E0C4;box-shadow:0 4px 0 #15a98f}.s3-tag.main::after{background:#34E0C4}';
  container.appendChild(style); container.style.position = container.style.position || 'absolute';
  let labels = Object.assign({ screen: '▶ PLONGER', projects: 'PROJETS', about: 'PARCOURS', contact: 'CONTACT' }, opts.labels || {});
  Object.keys(tagPos).forEach((k) => { const b = document.createElement('button'); b.type = 'button'; b.className = 's3-tag' + (k === 'screen' ? ' main' : ''); b.textContent = labels[k];
    b.addEventListener('click', (ev) => { ev.stopPropagation(); if (!diving) onSelect(k); }); container.appendChild(b); tags[k] = b; });

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1; size.set(w, h);
    renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
    camera.aspect = w / h; portrait = camera.aspect < 1;
    const hHalf = Math.atan(portrait ? 0.36 : 0.7);    // demi-champ horizontal visé
    camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hHalf) / camera.aspect)), 44, 74);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);

  const el = renderer.domElement;
  function onMove(ev) {
    if (diving) return;
    if (dragging) { const dx = ev.clientX - lx, dy = ev.clientY - ly; lx = ev.clientX; ly = ev.clientY; moved += Math.abs(dx) + Math.abs(dy);
      tYaw = THREE.MathUtils.clamp(tYaw - dx * 0.004, -0.5, 0.5); tPitch = THREE.MathUtils.clamp(tPitch + dy * 0.002, -0.08, 0.12); }
  }
  function onDown(ev) { dragging = true; moved = 0; lx = ev.clientX; ly = ev.clientY; el.style.cursor = 'grabbing'; }
  function onUp() { dragging = false; el.style.cursor = 'grab'; }
  function onClickCapture(ev) { if (moved > 8) { ev.stopPropagation(); ev.preventDefault(); moved = 0; return; } moved = 0;
    if (!diving && ev.target === el) { const o = pick(ev); if (o) { ev.stopPropagation(); ev.preventDefault(); o.userData.fn(); } } }
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  container.addEventListener('click', onClickCapture, true);

  const v = new THREE.Vector3(), q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  function placeCamera(t) {
    yaw += (tYaw - yaw) * 0.06; pitch += (tPitch - pitch) * 0.06;
    v.copy(basePos); if (portrait) v.set(0.25, 1.62, 2.05);
    v.sub(pivot).applyQuaternion(q.setFromAxisAngle(UP, yaw)); v.y += pitch * 3; v.add(pivot);
    v.x = THREE.MathUtils.clamp(v.x, -2.2, 2.2);
    look.set(portrait ? 0.5 : 0.25, portrait ? 1.12 : 1.1, -1.5);
    if (diving) {
      const k = Math.min(1, (t - diving.t0) / diving.dur), s = k * k * (3 - 2 * k), s2 = k * k * k;
      if (!diving.from) { diving.from = v.clone(); diving.fov = camera.fov; diving.look = look.clone(); }
      const a = diving.from, c = diving.ctrl, b = diving.to, u = 1 - s;
      camera.position.set(u * u * a.x + 2 * u * s * c.x + s * s * b.x, u * u * a.y + 2 * u * s * c.y + s * s * b.y, u * u * a.z + 2 * u * s * c.z + s * s * b.z);
      look.copy(diving.look).lerp(SCREEN, Math.min(1, s * 1.6)); camera.lookAt(look);
      camera.fov = lerp(diving.fov, 30, s2); camera.updateProjectionMatrix();
      screen.material.color.setScalar(1.5 + s2 * 2.5); bloom.strength = 0.42 + s2 * 0.45;
      if (k >= 0.8 && !diving.done) { diving.done = true; diving.cb && diving.cb(); } /* le flash part pendant l'approche */
      return;
    }
    camera.position.copy(v); camera.lookAt(look);
  }
  function placeTags() {
    const w = size.x, h = size.y;
    for (const k in tags) { v.copy(tagPos[k]).project(camera); const on = !diving && v.z < 1 && Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.92;
      tags[k].style.opacity = on ? 1 : 0; tags[k].style.pointerEvents = on ? 'auto' : 'none';
      tags[k].style.transform = 'translate(-50%,-100%) translate(' + ((v.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-v.y * 0.5 + 0.5) * h - 16).toFixed(1) + 'px)'; }
  }

  /* ---------------- easter eggs ---------------- */
  const toastEl = document.createElement('div'); toastEl.className = 's3-toast'; toastEl.setAttribute('role', 'status'); container.appendChild(toastEl);
  style.textContent += '.s3-toast{position:absolute;left:50%;top:64px;transform:translateX(-50%);max-width:92%;text-align:center;font-family:' + FONT + ';font-size:10px;line-height:1.7;color:#F3ECDE;background:rgba(12,10,22,.92);border:2px solid #34E0C4;padding:10px 14px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:3}.s3-toast.on{opacity:1}.s3-toast b{color:#F2B441;font-weight:normal;display:block;font-size:8px}';
  const found = new Set(), EGGS = 8; let toastTimer = 0;
  function toast(msg, egg) {
    let sub = ''; if (egg) { const isNew = !found.has(egg); found.add(egg); sub = '<b>' + (isNew ? 'SECRET ' : 'SECRETS ') + found.size + '/' + EGGS + (found.size === EGGS && isNew ? ' · 100% !' : '') + '</b>'; }
    toastEl.textContent = msg; if (sub) toastEl.insertAdjacentHTML('beforeend', sub); toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2600);
  }
  let partyUntil = -1, crystalSpin = 0, crystalPulse = -9, diceRoll = null, starAt = 8, starT0 = -9, now = 0;
  const hits = [];
  function hit(x, y, z, r, fn, parent) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial()); m.position.set(x, y, z); m.visible = false; m.userData.fn = fn; (parent || scene).add(m); hits.push(m); return m; }
  hit(-2.1, 0.8, -1.45, 0.24, () => { crystalPulse = now; toast('GAME SAVED', 'save'); });
  hit(0.96, 0.8, -1.5, 0.07, () => { if (!diceRoll) diceRoll = { t0: now, n: 1 + Math.floor(Math.random() * 20) }; });
  hit(1.2, 2.33, -1.98, 0.2, () => { hp = Math.max(0, hp - 1); drawHearts(); toast(hp ? '-1 HP · ' + '♥'.repeat(hp) : 'GAME OVER · CONTINUE? CLICK THE MUG', 'hearts'); }).scale.set(1.6, 0.6, 0.4);
  hit(-0.13, 1.24, -1.5, 0.11, () => { lampOverride = !(lampOverride === null ? lampBase > 0.5 : lampOverride); setLamp(); toast(lampOverride ? 'LIGHT ON' : 'LIGHT OFF', 'lamp'); });
  hit(1.91, 0.775, -1.5, 0.22, () => { tvMode = (tvMode + 1) % 3; toast('CH ' + (tvMode + 1), 'tv'); });
  hit(0, 0, 0, 0.075, () => { startAction('drink', now); toast('COFFEE BREAK', 'mug'); }, mug);
  hit(2.17, 2.06, -1.9, 0.13, () => { tvMode = 1; toast('INSERT COIN', 'tv'); });
  // mouvements déclenchés au clic : la souris, la fenêtre, et Karim lui-même (il alterne)
  let meCycle = 0;
  hit(0.78, 0.8, -1.3, 0.08, () => startAction('mouse', now));
  hit(-1.35, 1.6, -2.05, 0.62, () => startAction('look', now));
  hit(0.5, 1.18, -0.8, 0.2, () => { action = null; startAction(['stretch', 'drink', 'mouse', 'look'][meCycle++ % 4], now); });
  // étoile filante la nuit
  const star = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 5), fog: false })); star.visible = false; star.rotation.z = -0.35; scene.add(star);
  function animateEggs(t) {
    now = t;
    if (diceRoll) { const u = (t - diceRoll.t0) / 0.9; d20.rotation.set(0.4 + u * 14, 0.6 + u * 9, 0.2); d20.position.y = 0.8 + Math.sin(Math.min(u, 1) * Math.PI) * 0.12;
      if (u >= 1) { d20.position.y = 0.8; toast('D20 → ' + diceRoll.n + (diceRoll.n === 20 ? ' · CRITICAL HIT!' : diceRoll.n === 1 ? ' · CRITICAL FAIL…' : ''), 'd20'); diceRoll = null; } }
    const cp = t - crystalPulse; crystalSpin = cp < 1.2 ? (1 - cp / 1.2) * 12 * cp : 0; crystal.scale.setScalar(1 + (cp < 0.6 ? Math.sin(cp / 0.6 * Math.PI) * 0.35 : 0)); crystal.scale.y *= 1.5;
    if (t < partyUntil) { const h = (t * 0.9) % 1; led.color.setHSL(h, 1, 0.5); neonLight.color.setHSL((h + 0.3) % 1, 1, 0.5); neonM.emissive.setHSL((h + 0.3) % 1, 1, 0.5); screenLight.color.setHSL((h + 0.6) % 1, 1, 0.5); ceil.color.setHSL((h + 0.5) % 1, 1, 0.55); ceil.intensity = 3; partyWas = true; }
    else if (partyWas) { partyWas = false; led.color.set(PAL.magenta); neonLight.color.set(PAL.teal); neonM.emissive.set(PAL.teal); screenLight.color.set(PAL.teal); ceil.color.set(0xffb070); applyTime(currentHour()); }
    if (skyU.uNight.value > 0.6 && t > starAt && !star.visible) { star.visible = true; starT0 = t; star.userData.x = -45 + Math.random() * 30; star.userData.y = 26 + Math.random() * 12; }
    if (star.visible) { const u = (t - starT0) / 0.9; star.position.set(star.userData.x + u * 34, star.userData.y - u * 12, -95); star.scale.x = Math.sin(Math.min(u, 1) * Math.PI) + 0.01; if (u >= 1) { star.visible = false; starAt = t + 9 + Math.random() * 14; } }
  }
  let partyWas = false;
  const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let seqI = 0, typed = '';
  function onKey(ev) {
    if (diving) return; const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    seqI = k === SEQ[seqI] ? seqI + 1 : (k === SEQ[0] ? 1 : 0);
    if (seqI === SEQ.length) { seqI = 0; partyUntil = now + 10; hp = 3; drawHearts(); toast('CHEAT ACTIVATED · PARTY MODE', 'cheat'); }
    if (k.length === 1) { typed = (typed + k).slice(-8);
      if (typed.endsWith('sudo')) { Object.assign(monitorMsg, { until: now + 4, a: 'PERMISSION DENIED', b: 'nice try. least privilege, always.', color: '#e0567e' }); toast('sudo: nope', 'hack'); }
      else if (typed.endsWith('xss')) { Object.assign(monitorMsg, { until: now + 4, a: '<script> BLOCKED', b: 'output encoded + CSP. next?', color: '#34e0c4' }); toast('XSS BLOCKED', 'hack'); }
      else if (typed.endsWith('sqli')) { Object.assign(monitorMsg, { until: now + 4, a: "' OR 1=1 --  REJECTED", b: 'parameterized queries only.', color: '#f2b441' }); toast('SQLi BLOCKED', 'hack'); } }
  }
  window.addEventListener('keydown', onKey);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) { const r = el.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(hits, false); return h.length ? h[0].object : null; }
  let lastHover = 0;
  function onHover(ev) { if (ev.pointerType !== 'mouse' || diving) return; const t = performance.now(); if (t - lastHover < 80) return; lastHover = t; if (!dragging) el.style.cursor = pick(ev) ? 'pointer' : 'grab'; }
  el.addEventListener('pointermove', onHover);

  /* ---------------- boucle ---------------- */
  const clock = new THREE.Clock(); let raf = 0, alive = true, lastCode = -1, lastTimeCheck = -100, frames = 0;
  function frame() {
    if (!alive) return; raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    if (t - lastTimeCheck > 20) { lastTimeCheck = t; const h = currentHour(); if (Math.abs(h - lastHour) > 0.01) applyTime(h); }
    if (t - lastCode > 0.09) { lastCode = t; drawCode(t); drawTV(t); }
    skyU.uTime.value = t;
    crystal.rotation.y = t * 0.8 + crystalSpin; crystal.position.y = 0.8 + Math.sin(t * 1.4) * 0.03;
    fans.forEach((f, i) => { f.rotation.z = t * (5 + i) * (t < partyUntil ? 4 : 1); });
    animateMe(t); animateEggs(t);
    torso.scale.y = 1 + Math.sin(t * 1.1) * 0.008;
    const p = dustG.attributes.position; for (let i = 0; i < dustN; i++) { let y = p.getY(i) + 0.0006; if (y > 2.5) y = 0.2; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * 0.3 + i) * 0.0003); } p.needsUpdate = true;
    placeCamera(t); placeTags();
    composer.render(); frames++;
  }

  // la police pixel arrive après coup : on redessine les textes des textures
  (document.fonts && document.fonts.load ? document.fonts.load('12px "Press Start 2P"') : Promise.reject()).then(() => {
    if (!alive || !document.fonts.check('12px "Press Start 2P"')) return; fontOk = true;
    const g = neonTex.image.getContext('2d'); g.clearRect(0, 0, 512, 96); g.font = '44px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('KARIM.EXE', 256, 52); neonTex.needsUpdate = true;
    carts.forEach((c) => { const L = c.userData.label, cv = L.mesh.material.map.image, x = cv.getContext('2d'); x.fillStyle = '#12101f'; x.fillRect(0, 26, 128, 92); x.fillStyle = '#f3ecde'; x.textAlign = 'center'; x.font = '12px ' + FONT;
      const n = L.name.length > 8 ? [L.name.slice(0, 5), L.name.slice(5)] : [L.name]; n.forEach((s, i) => x.fillText(s, 64, 78 + i * 22 - (n.length - 1) * 11)); L.mesh.material.map.needsUpdate = true; });
  }).catch(() => {});

  resize(); applyTime(currentHour()); frame();

  return {
    canvas: el,
    dive(cb) { if (diving) return; diving = { t0: clock.getElapsedTime(), dur: opts.diveDuration || 1.7, ctrl: new THREE.Vector3(0.45, 2.25, -0.95) /* par-dessus la tête de Karim, jamais à travers */, to: new THREE.Vector3(SCREEN.x, SCREEN.y, -1.36), cb }; },
    setLabels(l) { labels = Object.assign(labels, l); for (const k in tags) tags[k].textContent = labels[k]; },
    setHour(h) { opts.hour = h; applyTime(currentHour()); },
    frames() { return frames; }, _act(n, hold) { action = null; startAction(n, clock.getElapsedTime()); if (hold !== undefined) action.hold = hold; }, _egg(i) { hits[i].userData.fn(); }, _proj(x, y, z) { const q = new THREE.Vector3(x, y, z).project(camera); return [(q.x * 0.5 + 0.5) * size.x, (-q.y * 0.5 + 0.5) * size.y]; }, _state() { return JSON.stringify({ a: action && action.name, t: clock.getElapsedTime().toFixed(2), t0: action && action.t0.toFixed(2), mug: mug.position.toArray().map(v => +v.toFixed(2)), hand: armRig[0].hand.position.toArray().map(v => +v.toFixed(2)), headX: head.rotation.x.toFixed(2) }); },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKey); clearTimeout(toastTimer); toastEl.remove(); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      container.removeEventListener('click', onClickCapture, true); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); } });
      composer.dispose(); target.dispose(); pmrem.dispose(); renderer.dispose(); for (const k in tags) tags[k].remove(); style.remove(); el.remove(); }
  };
}
