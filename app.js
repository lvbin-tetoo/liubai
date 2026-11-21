/* 留白 · LIUBAI — 十二个可以发呆的角落 */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const stage = document.getElementById('stage');
const ctx = stage.getContext('2d', { alpha: false });
const sceneEl = document.getElementById('scene');
const gridEl = document.getElementById('grid');
const dotsEl = document.getElementById('dots');
const numEl = document.getElementById('sceneNum');
const nameEl = document.getElementById('sceneName');
const hintEl = document.getElementById('hint');

const view = { w: 0, h: 0 };
let current = null;
let currentIndex = -1;
let running = false;
let rafId = 0;
let lastTime = 0;
let elapsed = 0;
let transitioning = false;

/* ---------------- scene catalogue ---------------- */

const starArt = [
  [12, 22], [24, 64], [33, 15], [42, 44], [51, 28], [58, 66], [64, 18], [71, 52],
  [77, 34], [85, 62], [89, 24], [18, 78], [46, 82], [62, 86], [30, 40], [93, 46]
].map(([l, t], i) =>
  `<i class="a-star${i % 5 === 0 ? ' big' : ''}" style="left:${l}%;top:${t}%;animation-delay:${(i * 0.37).toFixed(1)}s"></i>`
).join('');

const SCENES = [
  {
    key: 'orbs',
    name: '悬浮球',
    desc: '让光点替你把念头转走',
    hint: '按住加速，松手慢下来',
    art: '<i class="a-ring"></i><i class="a-ring"></i><i class="a-orb"></i><i class="a-orb"></i><i class="a-orb"></i><i class="a-orb"></i>',
    build: buildOrbs
  },
  {
    key: 'breathe',
    name: '呼吸',
    desc: '四拍吸气，八拍放下',
    hint: '跟着圆圈的节奏，慢慢呼吸',
    art: '<i class="a-br"></i><i class="a-br"></i><i class="a-br"></i><i class="a-core"></i>',
    build: buildBreathe
  },
  {
    key: 'ripples',
    name: '涟漪',
    desc: '手指落水，一圈圈散开',
    hint: '轻点水面，看涟漪散开',
    art: '<i class="a-rip"></i><i class="a-rip"></i><i class="a-rip"></i><i class="a-rip"></i>',
    build: buildRipples
  },
  {
    key: 'stars',
    name: '星空',
    desc: '把注意力交给很远的地方',
    hint: '拖动视野，等一颗流星',
    art: starArt + '<i class="a-shoot"></i>',
    build: buildStars
  },
  {
    key: 'sand',
    name: '流沙',
    desc: '看着时间落成一座沙丘',
    hint: '点一下，把沙丘推倒',
    art:
      '<i class="a-dune"></i><i class="a-dune b"></i>' +
      [14, 28, 41, 55, 66, 78, 87, 22].map((l, i) =>
        `<i class="a-grain" style="left:${l}%;animation-delay:${(i * 0.41).toFixed(2)}s"></i>`
      ).join(''),
    build: buildSand
  },
  {
    key: 'clouds',
    name: '云层',
    desc: '云不赶路，你也别赶',
    hint: '移动视线，云会跟着你',
    art:
      '<i class="a-moon"></i>' +
      [
        'left:-6%;top:34%;width:44%;height:12%;animation-delay:0s',
        'left:12%;top:52%;width:58%;height:15%;animation-delay:-7s;opacity:.75',
        'left:-14%;top:68%;width:66%;height:18%;animation-delay:-13s;opacity:.55',
        'left:34%;top:24%;width:36%;height:10%;animation-delay:-17s;opacity:.5'
      ].map((s) => `<i class="a-cloud" style="${s}"></i>`).join(''),
    build: buildClouds
  },
  {
    key: 'rain',
    name: '雨窗',
    desc: '有些心事，适合下雨天',
    hint: '轻点玻璃，落下更多雨滴',
    art:
      '<i class="a-streak"></i><i class="a-pane"></i>' +
      [18, 32, 47, 61, 74, 86].map((l, i) =>
        `<i class="a-drop" style="left:${l}%;height:${10 + (i % 3) * 6}cqw;animation-delay:${(i * 0.43).toFixed(2)}s;animation-duration:${2 + (i % 4) * 0.4}s"></i>`
      ).join(''),
    build: buildRain
  },
  {
    key: 'tide',
    name: '潮汐',
    desc: '涨一点，退一点，都可以',
    hint: '上下移动，改变潮位',
    art: '<i class="a-moon"></i><i class="a-wave"></i><i class="a-wave"></i><i class="a-wave"></i>',
    build: buildTide
  },
  {
    key: 'candle',
    name: '烛火',
    desc: '一盏灯，一团会呼吸的火',
    hint: '轻点，拨动火苗',
    art: '<i class="a-halo"></i><i class="a-wax"></i><i class="a-wick"></i><i class="a-flame"></i>',
    build: buildCandle
  },
  {
    key: 'kaleido',
    name: '万花筒',
    desc: '换个角度，世界就对称了',
    hint: '按住拖动，画一朵对称的花',
    art: '<i class="a-kal"></i><i class="a-kal b"></i>',
    build: buildKaleido
  },
  {
    key: 'bubbles',
    name: '气泡',
    desc: '慢慢升起来，轻轻破掉',
    hint: '轻点，把气泡戳破',
    art: [
      'left:18%;width:10cqw;height:10cqw;animation-delay:0s',
      'left:38%;width:16cqw;height:16cqw;animation-delay:-2.4s',
      'left:58%;width:7cqw;height:7cqw;animation-delay:-4.2s',
      'left:72%;width:12cqw;height:12cqw;animation-delay:-1.2s',
      'left:48%;width:5cqw;height:5cqw;animation-delay:-6s',
      'left:86%;width:8cqw;height:8cqw;animation-delay:-3.3s'
    ].map((s) => `<i class="a-bub" style="${s}"></i>`).join(''),
    build: buildBubbles
  },
  {
    key: 'ink',
    name: '一笔',
    desc: '写不好也没关系，反正会散',
    hint: '按住拖动，留下一笔',
    art:
      '<svg viewBox="0 0 100 75" aria-hidden="true">' +
      '<path d="M16 58 C 34 57, 28 26, 49 22 S 73 38, 67 13"></path>' +
      '<path class="thin" d="M20 63 C 39 62, 35 35, 52 30 S 78 42, 72 20"></path>' +
      '</svg><i class="a-dot" style="left:30%;top:60%"></i><i class="a-dot" style="left:71%;top:26%"></i>',
    build: buildInk
  }
];

/* ---------------- page shell ---------------- */

function renderGrid() {
  SCENES.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card';
    btn.dataset.key = s.key;
    btn.style.setProperty('--d', `${(i % 4) * 70}ms`);
    btn.setAttribute('aria-label', `${s.name}：${s.desc}`);
    btn.innerHTML =
      `<div class="card__art art-${s.key}">${s.art}` +
      `<span class="card__num">${String(i + 1).padStart(2, '0')}</span></div>` +
      `<div class="card__meta"><div><h3>${s.name}</h3><p>${s.desc}</p></div>` +
      `<span class="card__arrow" aria-hidden="true">↗</span></div>`;
    btn.addEventListener('click', () => openScene(i));
    gridEl.appendChild(btn);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  gridEl.querySelectorAll('.card').forEach((c) => io.observe(c));
}

function renderDots() {
  SCENES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `前往：${s.name}`);
    b.addEventListener('click', () => openScene(i));
    dotsEl.appendChild(b);
  });
}

function setActiveDot(i) {
  [...dotsEl.children].forEach((b, k) => b.classList.toggle('active', k === i));
}

/* ---------------- canvas lifecycle ---------------- */

function measure() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (stage.width !== pw || stage.height !== ph) {
    stage.width = pw;
    stage.height = ph;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  view.w = w;
  view.h = h;
}

function loop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  elapsed += dt;
  if (current) {
    if (!current.trail) ctx.clearRect(0, 0, view.w, view.h);
    current.tick(dt, elapsed);
  }
  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (running) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  running = false;
  cancelAnimationFrame(rafId);
}

function disposeScene() {
  stopLoop();
  if (current && current.destroy) current.destroy();
  current = null;
}

function openScene(index) {
  if (transitioning) return;
  const next = ((index % SCENES.length) + SCENES.length) % SCENES.length;

  disposeScene();
  currentIndex = next;
  const s = SCENES[next];

  sceneEl.classList.add('is-open');
  sceneEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');

  numEl.textContent = `${String(next + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`;
  nameEl.textContent = s.name;
  hintEl.textContent = s.hint;
  hintEl.classList.remove('is-fading');
  void hintEl.offsetWidth;
  hintEl.classList.add('is-fading');
  setActiveDot(next);

  if (window.Sound) window.Sound.track(s.key);

  measure();
  current = s.build();
  if (current.resize) current.resize(view.w, view.h);
  elapsed = 0;
  startLoop();
}

function closeScene() {
  if (!sceneEl.classList.contains('is-open')) return;
  transitioning = true;
  sceneEl.classList.remove('is-open');
  sceneEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('locked');
  disposeScene();
  currentIndex = -1;
  if (window.Sound) window.Sound.track('home');
  setTimeout(() => { transitioning = false; }, 560);
}

function step(dir) {
  if (currentIndex < 0) return;
  openScene(currentIndex + dir);
}

/* ---------------- input ---------------- */

function localPoint(e) {
  const r = stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

let pointerDown = false;

stage.addEventListener('pointerdown', (e) => {
  if (!current) return;
  e.preventDefault();
  pointerDown = true;
  if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
  const p = localPoint(e);
  if (current.down) current.down(p.x, p.y);
});

stage.addEventListener('pointermove', (e) => {
  if (!current) return;
  const p = localPoint(e);
  if (current.move) current.move(p.x, p.y, pointerDown);
});

function endPointer() {
  pointerDown = false;
  if (current && current.up) current.up();
}

stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);

document.getElementById('back').addEventListener('click', closeScene);
document.getElementById('randomScene').addEventListener('click', () => {
  if (SCENES.length < 2) return;
  let i = currentIndex;
  while (i === currentIndex) i = Math.floor(Math.random() * SCENES.length);
  openScene(i);
});
document.getElementById('prev').addEventListener('click', () => step(-1));
document.getElementById('next').addEventListener('click', () => step(1));

document.getElementById('random').addEventListener('click', () => {
  openScene(Math.floor(Math.random() * SCENES.length));
});

document.addEventListener('keydown', (e) => {
  if (!sceneEl.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeScene();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!sceneEl.classList.contains('is-open')) return;
    measure();
    if (current && current.resize) current.resize(view.w, view.h);
  }, 140);
});

renderGrid();
renderDots();

/* ---------------- 01. 悬浮球 ---------------- */

function buildOrbs() {
  let W = 0, H = 0, cx = 0, cy = 0, R = 0;
  let boost = 0, tx = 0.5, ty = 0.5, px = 0.5, py = 0.5;
  const splashes = [];
  const defs = [
    { rad: 0.30, size: 0.062, speed: 0.20, hex: '244,231,207' },
    { rad: 0.46, size: 0.042, speed: -0.135, hex: '219,230,227' },
    { rad: 0.60, size: 0.026, speed: 0.09, hex: '231,205,182' },
    { rad: 0.72, size: 0.016, speed: -0.055, hex: '253,250,243' }
  ];
  const orbs = defs.map((d, i) => ({ ...d, ang: i * 1.7 }));

  function resize(w, h) {
    W = w; H = h; cx = w / 2; cy = h / 2;
    R = Math.min(w, h) * 0.46;
  }

  function tick(dt, t) {
    px = lerp(px, tx, 0.045);
    py = lerp(py, ty, 0.045);
    boost *= Math.pow(0.12, dt);

    const ox = cx + (px - 0.5) * 34;
    const oy = cy + (py - 0.5) * 22;

    const bg = ctx.createRadialGradient(ox, oy - R * 0.15, 0, ox, oy, Math.max(W, H) * 0.82);
    bg.addColorStop(0, '#161418');
    bg.addColorStop(0.45, '#0e0d10');
    bg.addColorStop(1, '#070708');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(233,228,216,.055)';
    ctx.lineWidth = 1;
    orbs.forEach((o) => {
      ctx.beginPath();
      ctx.ellipse(ox, oy, R * o.rad, R * o.rad * 0.78, 0, 0, TAU);
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'lighter';
    orbs.forEach((o) => {
      o.ang += o.speed * dt * (1 + boost * 2.2);
      const rr = R * o.rad;
      const x = ox + Math.cos(o.ang) * rr;
      const y = oy + Math.sin(o.ang) * rr * 0.78;
      const cr = Math.min(W, H) * o.size;

      for (let k = 1; k <= 16; k++) {
        const a2 = o.ang - Math.sign(o.speed) * k * 0.032;
        const fade = (1 - k / 17) * 0.16;
        ctx.beginPath();
        ctx.arc(
          ox + Math.cos(a2) * rr,
          oy + Math.sin(a2) * rr * 0.78,
          cr * (1 - k / 22),
          0, TAU
        );
        ctx.fillStyle = `rgba(${o.hex},${fade})`;
        ctx.fill();
      }

      const glow = ctx.createRadialGradient(x, y, 0, x, y, cr * 5.2);
      glow.addColorStop(0, `rgba(${o.hex},.30)`);
      glow.addColorStop(0.4, `rgba(${o.hex},.08)`);
      glow.addColorStop(1, `rgba(${o.hex},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, cr * 5.2, 0, TAU);
      ctx.fill();

      const body = ctx.createRadialGradient(x - cr * 0.34, y - cr * 0.38, cr * 0.08, x, y, cr);
      body.addColorStop(0, '#fffdf6');
      body.addColorStop(0.42, `rgb(${o.hex})`);
      body.addColorStop(1, 'rgba(60,52,42,.9)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x, y, cr, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x - cr * 0.3, y - cr * 0.34, cr * 0.2, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fill();
    });

    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.r += s.v * dt;
      s.a -= dt * 0.5;
      if (s.a <= 0) { splashes.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.strokeStyle = `rgba(240,231,214,${s.a * 0.32})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return {
    resize,
    tick,
    down(x, y) {
      boost = 1;
      splashes.push({ x, y, r: 6, v: Math.min(W, H) * 0.22, a: 1 });
    },
    move(x, y) {
      tx = clamp(x / W, 0, 1);
      ty = clamp(y / H, 0, 1);
    }
  };
}

/* ---------------- 02. 呼吸 ---------------- */

function buildBreathe() {
  let W = 0, H = 0, cx = 0, cy = 0;
  let motes = [];

  function resize(w, h) {
    W = w; H = h; cx = w / 2; cy = h * 0.49;
    motes = Array.from({ length: 36 }, () => ({
      x: rand(0, w), y: rand(0, h), r: rand(0.6, 1.8),
      vy: rand(-6, -1.5), a: rand(0.05, 0.24), ph: rand(0, TAU)
    }));
  }

  function tick(dt, t) {
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0f1413');
    bg.addColorStop(0.5, '#0a0d0d');
    bg.addColorStop(1, '#060707');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    motes.forEach((m) => {
      m.y += m.vy * dt;
      m.x += Math.sin(t * 0.3 + m.ph) * 4 * dt;
      if (m.y < -10) { m.y = H + 10; m.x = rand(0, W); }
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fillStyle = `rgba(220,232,226,${m.a})`;
      ctx.fill();
    });

    const cycle = 19;
    const p = t % cycle;
    let label, k, phaseLen, phasePass;
    if (p < 4) {
      label = '吸 气'; k = ease(p / 4); phaseLen = 4; phasePass = p;
    } else if (p < 11) {
      label = '屏 息'; k = 1; phaseLen = 7; phasePass = p - 4;
    } else {
      label = '呼 气'; k = 1 - ease((p - 11) / 8); phaseLen = 8; phasePass = p - 11;
    }

    const minR = Math.min(W, H) * 0.105;
    const maxR = Math.min(W, H) * 0.265;
    const r = lerp(minR, maxR, k);

    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    core.addColorStop(0, `rgba(213,228,220,${0.10 + k * 0.10})`);
    core.addColorStop(0.7, `rgba(190,212,204,${0.03 + k * 0.04})`);
    core.addColorStop(1, 'rgba(190,212,204,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();

    [1.28, 1.62, 2.05].forEach((f, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * f, 0, TAU);
      ctx.strokeStyle = `rgba(206,224,217,${0.1 - i * 0.026})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = 'rgba(222,236,229,.62)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const pr = r + Math.min(W, H) * 0.055;
    ctx.beginPath();
    ctx.arc(cx, cy, pr, -Math.PI / 2, -Math.PI / 2 + TAU * (phasePass / phaseLen));
    ctx.strokeStyle = 'rgba(205,176,138,.38)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const fs = clamp(Math.min(W, H) * 0.024, 12, 20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(235,240,235,.82)';
    ctx.font = `300 ${fs}px "Songti SC","STSong","Noto Serif SC",serif`;
    ctx.fillText(label, cx, cy - fs * 0.1);

    ctx.fillStyle = 'rgba(233,228,216,.3)';
    ctx.font = `300 ${Math.max(9, fs * 0.55)}px "SF Mono",ui-monospace,monospace`;
    ctx.fillText('4 · 7 · 8', cx, cy + fs * 1.5);
  }

  return { resize, tick };
}

/* ---------------- 03. 涟漪 ---------------- */

function buildRipples() {
  let W = 0, H = 0, lastAdd = 0, ambient = 0;
  const rings = [];

  function resize(w, h) {
    W = w; H = h;
    rings.length = 0;
  }

  function add(x, y, power) {
    rings.push({
      x, y, r: 2, max: Math.min(W, H) * rand(0.22, 0.34) * power,
      age: 0, life: rand(3.4, 5.2)
    });
  }

  function tick(dt, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1418');
    bg.addColorStop(0.55, '#081013');
    bg.addColorStop(1, '#05090b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const halo = ctx.createRadialGradient(W * 0.5, H * 0.12, 0, W * 0.5, H * 0.12, Math.max(W, H) * 0.7);
    halo.addColorStop(0, 'rgba(126,170,182,.09)');
    halo.addColorStop(1, 'rgba(126,170,182,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 7; i++) {
      const y = H * (0.18 + i * 0.12) + Math.sin(t * 0.35 + i * 1.2) * 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(W * 0.3, y - 8, W * 0.7, y + 8, W, y);
      ctx.strokeStyle = `rgba(150,190,200,${0.045 - i * 0.003})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ambient += dt;
    if (ambient > rand(1.4, 2.6)) {
      ambient = 0;
      add(rand(W * 0.15, W * 0.85), rand(H * 0.3, H * 0.86), 0.7);
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.age += dt;
      const p = r.age / r.life;
      if (p >= 1) { rings.splice(i, 1); continue; }
      const rad = r.max * (1 - Math.pow(1 - p, 3));
      const a = Math.pow(1 - p, 1.4);

      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad, rad * 0.32, 0, 0, TAU);
      ctx.strokeStyle = `rgba(176,216,224,${a * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad * 0.86, rad * 0.86 * 0.32, 0, 0, TAU);
      ctx.strokeStyle = `rgba(222,240,242,${a * 0.14})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad * 0.12, rad * 0.12 * 0.32, 0, 0, TAU);
      ctx.fillStyle = `rgba(200,230,234,${a * 0.16})`;
      ctx.fill();
    }
  }

  return {
    resize,
    tick,
    down(x, y) {
      const now = performance.now();
      if (now - lastAdd < 90) return;
      lastAdd = now;
      add(x, y, 1.25);
    },
    move(x, y, isDown) {
      if (!isDown) return;
      const now = performance.now();
      if (now - lastAdd < 130) return;
      lastAdd = now;
      add(x, y, 0.7);
    }
  };
}

/* ---------------- 04. 星空 ---------------- */

function buildStars() {
  let W = 0, H = 0, stars = [], shoot = null, shootTimer = rand(2, 5);
  let tx = 0.5, ty = 0.5, px = 0.5, py = 0.5;

  function resize(w, h) {
    W = w; H = h;
    const count = Math.round(clamp((w * h) / 5200, 90, 260));
    stars = Array.from({ length: count }, () => ({
      x: rand(0, w), y: rand(0, h),
      z: rand(0.25, 1), r: rand(0.3, 1.4), ph: rand(0, TAU),
      tw: rand(0.6, 2.2)
    }));
    shoot = null;
  }

  function tick(dt, t) {
    px = lerp(px, tx, 0.03);
    py = lerp(py, ty, 0.03);
    const offX = (px - 0.5) * 44;
    const offY = (py - 0.5) * 30;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070a13');
    bg.addColorStop(0.6, '#05070e');
    bg.addColorStop(1, '#030408');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const neb1 = ctx.createRadialGradient(W * 0.66, H * 0.26, 0, W * 0.66, H * 0.26, Math.max(W, H) * 0.5);
    neb1.addColorStop(0, 'rgba(66,88,138,.16)');
    neb1.addColorStop(1, 'rgba(66,88,138,0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, W, H);

    const neb2 = ctx.createRadialGradient(W * 0.2, H * 0.76, 0, W * 0.2, H * 0.76, Math.max(W, H) * 0.45);
    neb2.addColorStop(0, 'rgba(96,68,110,.13)');
    neb2.addColorStop(1, 'rgba(96,68,110,0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    stars.forEach((s) => {
      s.x -= s.z * 2.2 * dt * 10;
      if (s.x < -4) { s.x = W + 4; s.y = rand(0, H); }
      const a = 0.28 + 0.72 * Math.abs(Math.sin(t * s.tw * 0.6 + s.ph));
      const x = s.x + offX * s.z;
      const y = s.y + offY * s.z;

      if (s.r > 1.1) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 6);
        g.addColorStop(0, `rgba(226,236,255,${a * 0.5})`);
        g.addColorStop(1, 'rgba(226,236,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 6, 0, TAU);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, TAU);
      ctx.fillStyle = `rgba(235,242,255,${a})`;
      ctx.fill();
    });

    shootTimer -= dt;
    if (!shoot && shootTimer <= 0) {
      shoot = {
        x: rand(W * 0.3, W * 0.95), y: rand(H * 0.05, H * 0.4),
        vx: -rand(320, 480), vy: rand(130, 200), life: 1
      };
      shootTimer = rand(5, 11);
    }

    if (shoot) {
      shoot.x += shoot.vx * dt;
      shoot.y += shoot.vy * dt;
      shoot.life -= dt * 0.9;
      if (shoot.life <= 0) {
        shoot = null;
      } else {
        const len = 120;
        const nx = shoot.vx / Math.hypot(shoot.vx, shoot.vy);
        const ny = shoot.vy / Math.hypot(shoot.vx, shoot.vy);
        const grad = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - nx * len, shoot.y - ny * len);
        grad.addColorStop(0, `rgba(240,245,255,${shoot.life})`);
        grad.addColorStop(1, 'rgba(240,245,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(shoot.x, shoot.y);
        ctx.lineTo(shoot.x - nx * len, shoot.y - ny * len);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return {
    resize,
    tick,
    move(x, y) {
      tx = clamp(x / W, 0, 1);
      ty = clamp(y / H, 0, 1);
    }
  };
}

/* ---------------- 05. 流沙 ---------------- */

function buildSand() {
  let W = 0, H = 0, floorY = 0, colW = 5, cols = [], grains = [], spawnAcc = 0;
  let collapsing = 0;

  function resize(w, h) {
    W = w; H = h;
    floorY = h * 0.84;
    colW = Math.max(3, w / 240);
    cols = new Array(Math.ceil(w / colW) + 2).fill(0);
    grains = [];
  }

  function tick(dt, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#12100e');
    bg.addColorStop(0.6, '#0b0a09');
    bg.addColorStop(1, '#070606');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, floorY, 0, W * 0.5, floorY, Math.max(W, H) * 0.7);
    glow.addColorStop(0, 'rgba(150,116,78,.13)');
    glow.addColorStop(1, 'rgba(150,116,78,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    if (collapsing > 0) {
      collapsing -= dt;
      for (let i = 0; i < cols.length; i++) cols[i] *= Math.pow(0.02, dt);
    }

    spawnAcc += dt * 42;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      grains.push({
        x: rand(0, W), y: rand(-40, -8),
        vy: rand(50, 140), vx: rand(-12, 12),
        len: rand(3, 9)
      });
    }

    ctx.lineCap = 'round';
    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i];
      g.vy += 180 * dt;
      g.y += g.vy * dt;
      g.x += g.vx * dt;

      if (g.y < -320 || g.y > H + 320 || g.x < -160 || g.x > W + 160) {
        grains.splice(i, 1);
        continue;
      }

      const idx = clamp(Math.round(g.x / colW), 0, cols.length - 1);
      const ground = floorY - cols[idx];

      if (g.y >= ground) {
        if (cols[idx] < H * 0.36) cols[idx] += 1.1;
        else {
          const l = cols[idx - 1] || 0;
          const r = cols[idx + 1] || 0;
          cols[l < r ? idx - 1 : idx + 1] = Math.min((l < r ? l : r) + 1, H * 0.36);
        }
        grains.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(g.x, g.y - g.len);
      ctx.lineTo(g.x, g.y);
      ctx.strokeStyle = 'rgba(232,204,166,.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, floorY - cols[0]);
    for (let i = 1; i < cols.length; i++) {
      const x = i * colW;
      const y = floorY - cols[i];
      const px = (i - 1) * colW;
      const py = floorY - cols[i - 1];
      ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();

    const dune = ctx.createLinearGradient(0, floorY - H * 0.36, 0, H);
    dune.addColorStop(0, 'rgba(214,181,138,.34)');
    dune.addColorStop(0.45, 'rgba(150,118,82,.2)');
    dune.addColorStop(1, 'rgba(58,44,30,.05)');
    ctx.fillStyle = dune;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < cols.length; i++) {
      const x = i * colW;
      const y = floorY - cols[i];
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(240,216,178,.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  return {
    resize,
    tick,
    down(x, y) {
      collapsing = 1.2;
      for (let i = 0; i < 20; i++) {
        grains.push({
          x: x + rand(-70, 70), y: y + rand(-20, 20),
          vy: rand(-90, -20), vx: rand(-70, 70), len: rand(2, 6)
        });
      }
    }
  };
}

/* ---------------- 06. 云层 ---------------- */

function buildClouds() {
  let W = 0, H = 0, clouds = [];
  let tx = 0.5, px = 0.5;

  function makeClouds() {
    clouds = Array.from({ length: 16 }, (_, i) => ({
      x: rand(-W * 0.2, W * 1.2),
      y: H * rand(0.16, 0.74),
      s: rand(0.5, 1.7) * (Math.min(W, H) / 700),
      speed: rand(3, 11),
      a: rand(0.035, 0.09),
      depth: rand(0.4, 1)
    })).sort((a, b) => a.depth - b.depth);
  }

  function resize(w, h) {
    W = w; H = h;
    makeClouds();
  }

  function puff(x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(203,215,226,${a})`);
    g.addColorStop(0.55, `rgba(190,204,216,${a * 0.55})`);
    g.addColorStop(1, 'rgba(185,198,210,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function tick(dt, t) {
    px = lerp(px, tx, 0.03);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#080b10');
    bg.addColorStop(0.55, '#0f141d');
    bg.addColorStop(1, '#191a1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const horizon = ctx.createRadialGradient(W * 0.5, H * 1.02, 0, W * 0.5, H * 1.02, W * 0.8);
    horizon.addColorStop(0, 'rgba(190,170,140,.14)');
    horizon.addColorStop(1, 'rgba(190,170,140,0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, W, H);

    const moonX = W * 0.74;
    const moonY = H * 0.2;
    const moonR = Math.min(W, H) * 0.038;
    const halo = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 8);
    halo.addColorStop(0, 'rgba(240,235,220,.16)');
    halo.addColorStop(1, 'rgba(240,235,220,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 8, 0, TAU);
    ctx.fill();

    const moon = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 0, moonX, moonY, moonR);
    moon.addColorStop(0, '#f6f1e2');
    moon.addColorStop(0.7, '#d9d3c2');
    moon.addColorStop(1, '#a9a292');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, TAU);
    ctx.fill();

    const parallax = (px - 0.5) * 60;
    clouds.forEach((c) => {
      c.x += c.speed * dt * (1 + c.depth * 0.4);
      if (c.x > W + 320 * c.s) c.x = -320 * c.s;
      const x = c.x + parallax * c.depth;
      const y = c.y + Math.sin(t * 0.12 + c.depth * 5) * 4;
      const s = c.s;
      puff(x, y, 130 * s, c.a);
      puff(x - 150 * s, y + 26 * s, 96 * s, c.a * 0.9);
      puff(x + 150 * s, y + 22 * s, 104 * s, c.a * 0.85);
      puff(x + 40 * s, y - 48 * s, 84 * s, c.a * 0.8);
    });

    const mist = ctx.createLinearGradient(0, H * 0.62, 0, H);
    mist.addColorStop(0, 'rgba(10,12,16,0)');
    mist.addColorStop(1, 'rgba(8,9,12,.85)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
  }

  return {
    resize,
    tick,
    move(x) { tx = clamp(x / W, 0, 1); }
  };
}

/* ---------------- 07. 雨窗 ---------------- */

function buildRain() {
  let W = 0, H = 0;
  let drops = [], specks = [], bokeh = [];
  let ambient = 0;

  function makeBokeh() {
    bokeh = Array.from({ length: 11 }, () => ({
      x: rand(0, W), y: rand(H * 0.45, H * 1.05),
      r: rand(20, 90), a: rand(0.025, 0.075),
      warm: Math.random() > 0.45, drift: rand(0.4, 1)
    }));
  }

  function resize(w, h) {
    W = w; H = h;
    drops = [];
    specks = Array.from({ length: 110 }, () => ({
      x: rand(0, w), y: rand(0, h), r: rand(0.4, 1.5), a: rand(0.04, 0.16)
    }));
    makeBokeh();
    for (let i = 0; i < 8; i++) addDrop(rand(0, w), rand(0, h * 0.8));
  }

  function addDrop(x, y) {
    drops.push({
      x, y, r: rand(1.6, 4.6), vy: rand(14, 46),
      wob: rand(0, TAU), trail: rand(20, 80)
    });
    if (drops.length > 90) drops.shift();
  }

  function tick(dt, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1015');
    bg.addColorStop(0.55, '#121a20');
    bg.addColorStop(1, '#0a0d10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    bokeh.forEach((b) => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      const col = b.warm ? '214,178,132' : '132,168,196';
      g.addColorStop(0, `rgba(${col},${b.a})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();
      b.y -= b.drift * dt * 2;
      if (b.y < -b.r) b.y = H + b.r;
    });

    ctx.fillStyle = 'rgba(200,222,238,.1)';
    specks.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    });

    ctx.strokeStyle = 'rgba(168,194,216,.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x = (W * (i + 0.5)) / 5 + Math.sin(t * 0.2 + i) * 20;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 26, H);
      ctx.stroke();
    }

    ambient += dt;
    if (ambient > 0.32) {
      ambient = 0;
      addDrop(rand(0, W), rand(-20, H * 0.25));
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += 9 * dt;
      d.y += d.vy * dt;
      d.x += Math.sin(t * 1.4 + d.wob) * 5 * dt;

      if (d.y > H + 30) {
        drops.splice(i, 1);
        continue;
      }

      const tg = ctx.createLinearGradient(d.x, d.y - d.trail, d.x, d.y);
      tg.addColorStop(0, 'rgba(196,220,238,0)');
      tg.addColorStop(1, `rgba(196,220,238,${0.10 + d.r * 0.02})`);
      ctx.strokeStyle = tg;
      ctx.lineWidth = d.r * 0.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.trail);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
      ctx.lineCap = 'butt';

      const g = ctx.createRadialGradient(
        d.x - d.r * 0.3, d.y - d.r * 0.4, 0,
        d.x, d.y, d.r
      );
      g.addColorStop(0, 'rgba(240,250,255,.75)');
      g.addColorStop(0.45, 'rgba(180,208,226,.32)');
      g.addColorStop(1, 'rgba(150,180,200,.06)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.28, d.y - d.r * 0.34, d.r * 0.24, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fill();
    }
  }

  return {
    resize,
    tick,
    down(x, y) {
      for (let i = 0; i < 9; i++) {
        addDrop(x + rand(-46, 46), y + rand(-30, 30));
      }
    }
  };
}

/* ---------------- 08. 潮汐 ---------------- */

function buildTide() {
  let W = 0, H = 0, level = 0.7, targetLevel = 0.7;
  let stars = [];

  const waves = [
    { base: 0.58, amp: 0.012, len: 0.9, speed: 0.22, color: '92,138,146', a: 0.10 },
    { base: 0.66, amp: 0.016, len: 1.3, speed: 0.30, color: '76,124,132', a: 0.13 },
    { base: 0.74, amp: 0.020, len: 1.7, speed: 0.38, color: '62,110,118', a: 0.17 },
    { base: 0.83, amp: 0.026, len: 2.2, speed: 0.46, color: '48,96,104', a: 0.24 },
    { base: 0.92, amp: 0.032, len: 2.8, speed: 0.54, color: '36,82,90', a: 0.32 }
  ];

  function resize(w, h) {
    W = w; H = h;
    stars = Array.from({ length: 40 }, () => ({
      x: rand(0, w), y: rand(0, h * 0.5),
      r: rand(0.4, 1.4), a: rand(0.1, 0.55), ph: rand(0, TAU)
    }));
  }

  function tick(dt, t) {
    level = lerp(level, targetLevel, 0.035);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#080d11');
    bg.addColorStop(0.5, '#0a1216');
    bg.addColorStop(1, '#050809');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const mx = W * 0.72, my = H * 0.17, mr = Math.min(W, H) * 0.05;
    const halo = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 9);
    halo.addColorStop(0, 'rgba(222,232,226,.14)');
    halo.addColorStop(1, 'rgba(222,232,226,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 9, 0, TAU);
    ctx.fill();

    const moon = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr);
    moon.addColorStop(0, '#f3f4ec');
    moon.addColorStop(1, '#c6cbc0');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(226,236,232,.5)';
    stars.forEach((s) => {
      const a = s.a * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + s.ph)));
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const shift = (level - 0.7) * H * 0.35;

    waves.forEach((wv, i) => {
      const baseY = H * wv.base + shift;
      const amp = Math.min(W, H) * wv.amp;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        const y = baseY
          + Math.sin((x / W) * TAU * wv.len + t * wv.speed + i * 1.4) * amp
          + Math.sin((x / W) * TAU * wv.len * 0.45 - t * wv.speed * 0.6) * amp * 0.55;
        if (x === 0) ctx.lineTo(0, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();

      const g = ctx.createLinearGradient(0, baseY - amp * 2, 0, H);
      g.addColorStop(0, `rgba(${wv.color},${wv.a})`);
      g.addColorStop(1, `rgba(${wv.color},${wv.a * 0.15})`);
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = baseY
          + Math.sin((x / W) * TAU * wv.len + t * wv.speed + i * 1.4) * amp
          + Math.sin((x / W) * TAU * wv.len * 0.45 - t * wv.speed * 0.6) * amp * 0.55;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${wv.color},${wv.a * 1.6})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const refl = ctx.createLinearGradient(mx, my, mx, H);
    refl.addColorStop(0, 'rgba(232,238,230,.09)');
    refl.addColorStop(1, 'rgba(232,238,230,0)');
    ctx.fillStyle = refl;
    ctx.beginPath();
    ctx.moveTo(mx - mr * 0.6, my);
    for (let y = my; y < H; y += 12) {
      const wob = Math.sin(y * 0.06 + t * 1.6) * (6 + (y - my) * 0.05);
      ctx.lineTo(mx + wob, y);
    }
    for (let y = H; y > my; y -= 12) {
      const wob = Math.sin(y * 0.06 + t * 1.6) * (6 + (y - my) * 0.05);
      ctx.lineTo(mx + wob + mr * 1.2, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  return {
    resize,
    tick,
    move(x, y) { targetLevel = clamp(y / H, 0.42, 0.9); }
  };
}

/* ---------------- 09. 烛火 ---------------- */

function buildCandle() {
  let W = 0, H = 0, cx = 0, cy = 0, waxW = 40, waxH = 150, flameH = 60;
  let blow = 0, blowDir = 1;
  const embers = [];
  const seed = Math.random() * 100;

  function resize(w, h) {
    W = w; H = h;
    cx = w / 2;
    cy = h * 0.58;
    waxH = Math.min(h * 0.19, 180);
    waxW = Math.min(w * 0.05, 44);
    flameH = Math.min(w, h) * 0.095;
    embers.length = 0;
  }

  function tick(dt, t) {
    blow *= Math.pow(0.15, dt);

    const bg = ctx.createRadialGradient(cx, cy - waxH * 0.6, 0, cx, cy, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#171008');
    bg.addColorStop(0.4, '#0d0a08');
    bg.addColorStop(1, '#060505');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const baseY = cy - waxH * 0.04;
    const flick = 0.85 + 0.15 * Math.sin(t * 9.1 + seed) * Math.sin(t * 3.7);
    const sway = Math.sin(t * 3.3 + seed) * flameH * 0.05
      + Math.sin(t * 7.9 + seed * 2) * flameH * 0.022
      + blowDir * blow * flameH * 0.9;

    const glowR = flameH * (6 + Math.sin(t * 2.3) * 0.25);
    const glow = ctx.createRadialGradient(cx + sway * 0.3, baseY - flameH * 0.6, 0, cx, baseY, glowR);
    glow.addColorStop(0, `rgba(246,180,104,${0.20 * flick})`);
    glow.addColorStop(0.35, `rgba(226,140,66,${0.09 * flick})`);
    glow.addColorStop(1, 'rgba(220,130,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    const fh = flameH * (1 - blow * 0.4);
    const fw = flameH * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.bezierCurveTo(cx - fw * 0.95, baseY - fh * 0.34, cx - fw * 0.55 + sway * 0.4, baseY - fh * 0.78, cx + sway, baseY - fh);
    ctx.bezierCurveTo(cx + fw * 0.4 + sway * 0.55, baseY - fh * 0.7, cx + fw * 0.95, baseY - fh * 0.3, cx, baseY);
    const fg = ctx.createRadialGradient(cx, baseY - fh * 0.34, 0, cx, baseY - fh * 0.34, fh * 0.9);
    fg.addColorStop(0, 'rgba(255,250,224,.95)');
    fg.addColorStop(0.35, 'rgba(255,214,140,.9)');
    fg.addColorStop(0.7, 'rgba(238,144,58,.75)');
    fg.addColorStop(1, 'rgba(214,104,34,0)');
    ctx.fillStyle = fg;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, baseY - fh * 0.08);
    ctx.bezierCurveTo(cx - fw * 0.3, baseY - fh * 0.32, cx - fw * 0.16 + sway * 0.3, baseY - fh * 0.56, cx + sway * 0.8, baseY - fh * 0.66);
    ctx.bezierCurveTo(cx + fw * 0.2 + sway * 0.4, baseY - fh * 0.5, cx + fw * 0.34, baseY - fh * 0.24, cx, baseY - fh * 0.08);
    ctx.fillStyle = 'rgba(255,252,238,.85)';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = 'rgba(24,18,13,.9)';
    ctx.fillRect(cx - 1, baseY - 12, 2, 14);

    const wx = cx - waxW / 2;
    const wax = ctx.createLinearGradient(wx, 0, wx + waxW, 0);
    wax.addColorStop(0, '#6f5a45');
    wax.addColorStop(0.35, '#c9ab86');
    wax.addColorStop(0.62, '#e3cba9');
    wax.addColorStop(1, '#816852');
    ctx.fillStyle = wax;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(wx, baseY, waxW, waxH, [3, 3, 4, 4]) : ctx.rect(wx, baseY, waxW, waxH);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx, baseY, waxW / 2, waxW * 0.16, 0, 0, TAU);
    ctx.fillStyle = 'rgba(245,225,196,.35)';
    ctx.fill();

    if (Math.random() < dt * 2.2) {
      embers.push({
        x: cx + rand(-4, 4), y: baseY - fh * 0.7,
        vx: rand(-14, 14), vy: rand(-34, -12),
        life: 1, r: rand(0.8, 2)
      });
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 8 * dt;
      e.life -= dt * 0.35;
      if (e.life <= 0) { embers.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.fillStyle = `rgba(255,186,110,${e.life * 0.8})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return {
    resize,
    tick,
    down(x, y) {
      blow = 1;
      blowDir = Math.sign(x - cx) || 1;
      for (let i = 0; i < 10; i++) {
        embers.push({
          x: cx + rand(-6, 6), y: cy - waxH * 0.1 - flameH * 0.5,
          vx: rand(-26, 26), vy: rand(-60, -20), life: 1, r: rand(0.6, 1.8)
        });
      }
    }
  };
}

/* ---------------- 10. 万花筒 ---------------- */

function buildKaleido() {
  let W = 0, H = 0, cx = 0, cy = 0;
  let ang = 0, tx = 0.5, ty = 0.5, px = 0.5, py = 0.5;
  let active = false, pointer = { x: 0, y: 0 };
  let ready = false;

  function resize(w, h) {
    W = w; H = h; cx = w / 2; cy = h / 2;
    ready = false;
  }

  function tick(dt, t) {
    if (!ready) {
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, W, H);
      ready = true;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(8,8,10,.052)';
    ctx.fillRect(0, 0, W, H);

    px = lerp(px, tx, 0.05);
    py = lerp(py, ty, 0.05);
    ang += dt * 0.07;

    const R = Math.min(W, H) * 0.46;
    const autoX = Math.cos(t * 0.31) * 0.6;
    const autoY = Math.sin(t * 0.23) * 0.6;
    const ax = active ? (px - 0.5) * 2 : autoX;
    const ay = active ? (py - 0.5) * 2 : autoY;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';

    const N = 12;
    for (let i = 0; i < N; i++) {
      ctx.save();
      ctx.rotate(ang + (i * TAU) / N);
      if (i % 2 === 1) ctx.scale(1, -1);

      const sway = Math.sin(t * 0.5 + i * 0.4) * 0.12;
      const reach = R * (0.55 + 0.3 * Math.abs(Math.sin(t * 0.2 + i)));

      const grad = ctx.createLinearGradient(0, 0, 0, reach);
      const hue = (t * 14 + i * 26) % 360;
      grad.addColorStop(0, `hsla(${hue}, 32%, 78%, .16)`);
      grad.addColorStop(0.6, `hsla(${(hue + 40) % 360}, 30%, 66%, .1)`);
      grad.addColorStop(1, 'hsla(40, 30%, 80%, 0)');

      ctx.beginPath();
      ctx.moveTo(0, R * 0.05);
      ctx.bezierCurveTo(
        R * (0.3 + ax * 0.16), reach * 0.34,
        R * (-0.26 + ay * 0.18), reach * 0.68,
        ax * R * 0.22, reach * 0.96
      );
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.1 + (active ? 0.5 : 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, R * 0.12);
      ctx.bezierCurveTo(
        R * (-0.18 + ay * 0.14), reach * 0.4,
        R * (0.22 + ax * 0.2), reach * 0.7,
        -ay * R * 0.16, reach * 0.9
      );
      ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 26%, 74%, .08)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, R * (0.42 + Math.abs(sway)), -0.35, 0.35);
      ctx.strokeStyle = `hsla(${hue}, 34%, 76%, .07)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  return {
    trail: true,
    resize,
    tick,
    down(x, y) {
      active = true;
      pointer.x = x; pointer.y = y;
      tx = clamp(x / W, 0, 1); ty = clamp(y / H, 0, 1);
    },
    move(x, y, isDown) {
      active = true;
      tx = clamp(x / W, 0, 1);
      ty = clamp(y / H, 0, 1);
    }
  };
}

/* ---------------- 11. 气泡 ---------------- */

function buildBubbles() {
  let W = 0, H = 0;
  let bubbles = [], pops = [];

  function makeBubble(x, y) {
    return {
      x: x !== undefined ? x : rand(0, W),
      y: y !== undefined ? y : rand(0, H),
      r: rand(6, 26),
      vy: rand(14, 42),
      ph: rand(0, TAU),
      drift: rand(6, 22)
    };
  }

  function resize(w, h) {
    W = w; H = h;
    bubbles = Array.from({ length: 24 }, () => makeBubble());
    pops = [];
  }

  function tick(dt, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a1414');
    bg.addColorStop(0.6, '#071011');
    bg.addColorStop(1, '#04090a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const ray = ctx.createRadialGradient(W * 0.3, H * 0.1, 0, W * 0.3, H * 0.1, Math.max(W, H) * 0.7);
    ray.addColorStop(0, 'rgba(120,180,168,.10)');
    ray.addColorStop(1, 'rgba(120,180,168,0)');
    ctx.fillStyle = ray;
    ctx.fillRect(0, 0, W, H);

    bubbles.forEach((b) => {
      b.y -= b.vy * dt;
      b.x += Math.sin(t * 0.9 + b.ph) * b.drift * dt;
      if (b.y < -b.r - 20) {
        b.y = H + b.r + rand(10, 80);
        b.x = rand(0, W);
      }

      const g = ctx.createRadialGradient(
        b.x - b.r * 0.32, b.y - b.r * 0.36, b.r * 0.08,
        b.x, b.y, b.r
      );
      g.addColorStop(0, 'rgba(226,246,240,.16)');
      g.addColorStop(0.62, 'rgba(168,208,200,.03)');
      g.addColorStop(0.88, 'rgba(196,228,222,.12)');
      g.addColorStop(1, 'rgba(214,240,234,.02)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.strokeStyle = 'rgba(196,228,222,.28)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.34, b.r * 0.16, 0, TAU);
      ctx.fillStyle = 'rgba(240,252,248,.65)';
      ctx.fill();
    });

    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) { pops.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + k * 1.6), 0, TAU);
      ctx.strokeStyle = `rgba(206,238,232,${(1 - k) * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let d = 0; d < p.drops.length; d++) {
        const dr = p.drops[d];
        const dx = p.x + Math.cos(dr.a) * p.r * 1.4 * k;
        const dy = p.y + Math.sin(dr.a) * p.r * 1.4 * k + k * k * 14;
        ctx.beginPath();
        ctx.arc(dx, dy, dr.r * (1 - k), 0, TAU);
        ctx.fillStyle = `rgba(214,242,236,${(1 - k) * 0.55})`;
        ctx.fill();
      }
    }
  }

  return {
    resize,
    tick,
    down(x, y) {
      let hit = false;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(b.x - x, b.y - y);
        if (dist < b.r + 16) {
          pops.push({
            x: b.x, y: b.y, r: b.r, age: 0, life: 0.9,
            drops: Array.from({ length: 7 }, () => ({
              a: rand(0, TAU), r: rand(1, 2.6)
            }))
          });
          bubbles[i] = makeBubble(rand(0, W), H + rand(10, 90));
          hit = true;
          break;
        }
      }
      if (!hit) bubbles.push(makeBubble(x, y));
    }
  };
}

/* ---------------- 12. 一笔 ---------------- */

function buildInk() {
  let W = 0, H = 0;
  let drawing = false, last = null;
  let autoPrev = null, autoT = 0, ready = false;

  function resize(w, h) {
    W = w; H = h;
    ready = false;
    autoPrev = null;
    last = null;
  }

  function paintFade() {
    if (!ready) {
      const wash = ctx.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, Math.max(W, H) * 0.85);
      wash.addColorStop(0, '#15140f');
      wash.addColorStop(0.55, '#0e0e0f');
      wash.addColorStop(1, '#08080a');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, W, H);
      ready = true;
      return;
    }
    ctx.fillStyle = 'rgba(10,10,11,.022)';
    ctx.fillRect(0, 0, W, H);
  }

  function autoPoint(t) {
    autoT += 1;
    const scale = Math.min(W, H);
    const a = Math.sin(t * 0.31) * 1.4 + Math.sin(t * 0.47) * 0.9 + t * 0.05;
    const r = scale * (0.24 + Math.sin(t * 0.19) * 0.1);
    return {
      x: W / 2 + Math.cos(a) * r * 1.3 + Math.sin(t * 0.11) * scale * 0.07,
      y: H / 2 + Math.sin(a * 1.3) * r * 0.92 + Math.cos(t * 0.17) * scale * 0.05
    };
  }

  function brush(x0, y0, x1, y1) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgba(226,214,188,.16)';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(238,229,210,.42)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,252,244,.7)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }

  function tick(dt, t) {
    paintFade();

    const p = autoPoint(t);
    if (autoPrev) {
      const d = Math.hypot(p.x - autoPrev.x, p.y - autoPrev.y);
      if (d < 90) brush(autoPrev.x, autoPrev.y, p.x, p.y);
    }
    autoPrev = p;

    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 34);
    halo.addColorStop(0, 'rgba(244,234,210,.16)');
    halo.addColorStop(1, 'rgba(244,234,210,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, TAU);
    ctx.fillStyle = 'rgba(255,252,242,.78)';
    ctx.fill();

    if (Math.random() < dt * 0.7) {
      ctx.beginPath();
      ctx.arc(p.x + rand(-30, 30), p.y + rand(-20, 20), rand(0.6, 2.4), 0, TAU);
      ctx.fillStyle = 'rgba(232,223,204,.22)';
      ctx.fill();
    }
  }

  return {
    trail: true,
    resize,
    tick,
    down(x, y) {
      drawing = true;
      last = { x, y };
      const dab = ctx.createRadialGradient(x, y, 0, x, y, 40);
      dab.addColorStop(0, 'rgba(240,230,208,.18)');
      dab.addColorStop(1, 'rgba(240,230,208,0)');
      ctx.fillStyle = dab;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(x + rand(-26, 26), y + rand(-26, 26), rand(0.7, 3), 0, TAU);
        ctx.fillStyle = `rgba(238,231,214,${rand(0.2, 0.55)})`;
        ctx.fill();
      }
    },
    move(x, y, isDown) {
      if (!isDown || !drawing || !last) return;
      const d = Math.hypot(x - last.x, y - last.y);
      if (d < 1.6) return;
      const w = clamp(16 - d * 0.22, 3, 16);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(228,219,199,.18)';
      ctx.lineWidth = w * 2.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(242,235,219,.62)';
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,252,244,.34)';
      ctx.lineWidth = Math.max(0.8, w * 0.35);
      ctx.stroke();

      last = { x, y };
    },
    up() {
      drawing = false;
      last = null;
    }
  };
}



