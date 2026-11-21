/* 留白 · 声音引擎
   全部由 Web Audio 实时合成，不加载任何音频文件。
   首页一段，十二个场景各一段，切换时交叉淡入淡出。 */

(function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  /* ---------- 音阶 ---------- */
  const PENTA = [0, 2, 4, 7, 9];
  const MINOR = [0, 2, 3, 5, 7, 8, 10];
  const DORIAN = [0, 2, 3, 5, 7, 9, 10];
  const YO = [0, 2, 5, 7, 9]; // 日本都节音阶，留白感强

  /* ---------- 音色配置 ---------- */
  const TRACKS = {
    home: {
      root: 57, scale: PENTA, octave: 2, wave: 'sine',
      pad: [0, 7, 12], padGain: 0.13, noteGain: 0.1,
      density: [5, 9], dur: 3.4, filter: 900, reverb: 0.55,
      noise: { color: 'brown', hz: 320, q: 0.7, gain: 0.05 },
      lfo: { rate: 0.05, depth: 0.35 }
    },
    orbs: {
      root: 60, scale: PENTA, octave: 2, wave: 'sine',
      pad: [0, 12, 19], padGain: 0.1, noteGain: 0.13,
      density: [0.9, 2.2], dur: 2.2, filter: 2200, reverb: 0.5,
      noise: { color: 'pink', hz: 1200, q: 0.6, gain: 0.018 },
      lfo: { rate: 0.08, depth: 0.5 }
    },
    breathe: {
      root: 55, scale: MINOR, octave: 1, wave: 'sine',
      pad: [0, 7, 12, 19], padGain: 0.16, noteGain: 0.0,
      density: [9, 14], dur: 4, filter: 700, reverb: 0.6,
      noise: { color: 'brown', hz: 260, q: 0.5, gain: 0.06 },
      lfo: { rate: 1 / 19, depth: 0.9 } // 与 4-7-8 呼吸同步
    },
    ripples: {
      root: 62, scale: YO, octave: 2, wave: 'sine',
      pad: [0, 7], padGain: 0.07, noteGain: 0.11,
      density: [1.6, 4.5], dur: 4.2, filter: 1600, reverb: 0.72,
      noise: { color: 'pink', hz: 800, q: 0.8, gain: 0.03 },
      lfo: { rate: 0.04, depth: 0.4 }
    },
    stars: {
      root: 67, scale: PENTA, octave: 3, wave: 'sine',
      pad: [0, 12, 24], padGain: 0.05, noteGain: 0.09,
      density: [2.5, 7], dur: 3.6, filter: 4200, reverb: 0.85,
      noise: { color: 'white', hz: 5200, q: 1.2, gain: 0.008 },
      lfo: { rate: 0.03, depth: 0.3 }
    },
    sand: {
      root: 48, scale: MINOR, octave: 1, wave: 'triangle',
      pad: [0, 7], padGain: 0.12, noteGain: 0.05,
      density: [4, 9], dur: 2.6, filter: 600, reverb: 0.45,
      noise: { color: 'white', hz: 2600, q: 0.4, gain: 0.028 },
      lfo: { rate: 0.06, depth: 0.45 }
    },
    clouds: {
      root: 53, scale: DORIAN, octave: 1, wave: 'sine',
      pad: [0, 5, 7, 12], padGain: 0.17, noteGain: 0.06,
      density: [5, 10], dur: 5, filter: 620, reverb: 0.7,
      noise: { color: 'brown', hz: 240, q: 0.5, gain: 0.04 },
      lfo: { rate: 0.035, depth: 0.6 }
    },
    rain: {
      root: 57, scale: MINOR, octave: 1, wave: 'sine',
      pad: [0, 3, 10], padGain: 0.08, noteGain: 0.07,
      density: [3, 7], dur: 3.2, filter: 900, reverb: 0.6,
      noise: { color: 'white', hz: 3200, q: 0.5, gain: 0.05 },
      lfo: { rate: 0.07, depth: 0.3 }
    },
    tide: {
      root: 50, scale: PENTA, octave: 1, wave: 'sine',
      pad: [0, 7, 12], padGain: 0.13, noteGain: 0.05,
      density: [4, 8], dur: 4, filter: 520, reverb: 0.65,
      noise: { color: 'brown', hz: 420, q: 0.9, gain: 0.09 },
      lfo: { rate: 1 / 11, depth: 0.85 } // 约 11 秒一次潮起潮落
    },
    candle: {
      root: 45, scale: MINOR, octave: 1, wave: 'sine',
      pad: [0, 7, 12], padGain: 0.1, noteGain: 0.04,
      density: [6, 12], dur: 3, filter: 800, reverb: 0.5,
      noise: { color: 'brown', hz: 600, q: 0.6, gain: 0.05 },
      crackle: true,
      lfo: { rate: 0.09, depth: 0.3 }
    },
    kaleido: {
      root: 59, scale: DORIAN, octave: 2, wave: 'triangle',
      pad: [0, 7, 14], padGain: 0.09, noteGain: 0.1,
      density: [0.7, 1.8], dur: 1.8, filter: 2800, reverb: 0.55,
      noise: { color: 'pink', hz: 1800, q: 0.7, gain: 0.014 },
      lfo: { rate: 0.12, depth: 0.55 }
    },
    bubbles: {
      root: 64, scale: PENTA, octave: 2, wave: 'sine',
      pad: [0, 12], padGain: 0.05, noteGain: 0.12,
      density: [1.1, 3], dur: 0.9, filter: 2600, reverb: 0.4,
      noise: { color: 'pink', hz: 1400, q: 0.8, gain: 0.02 },
      lfo: { rate: 0.1, depth: 0.4 }
    },
    ink: {
      root: 43, scale: YO, octave: 1, wave: 'sine',
      pad: [0, 7, 12], padGain: 0.11, noteGain: 0.07,
      density: [3.5, 8], dur: 4.5, filter: 700, reverb: 0.75,
      noise: { color: 'white', hz: 1100, q: 0.35, gain: 0.02 },
      lfo: { rate: 0.045, depth: 0.5 }
    }
  };

  let ctx = null, master = null, wet = null, dry = null, comp = null;
  let bus = null, busKey = null, noiseBufs = {};
  let enabled = localStorage.getItem('liubai.sound') !== 'off';
  let started = false;
  let timers = [];

  const btn = document.getElementById('soundBtn');

  function midiToSemis(track, i) {
    const sc = track.scale;
    const oct = Math.floor(i / sc.length);
    return track.root + sc[i % sc.length] + oct * 12;
  }

  function makeImpulse(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function noiseBuffer(color, seconds) {
    const key = color + seconds;
    if (noiseBufs[key]) return noiseBufs[key];
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
      else if (color === 'pink') { last = 0.97 * last + 0.03 * w; d[i] = (w * 0.35 + last) * 0.9; }
      else d[i] = w * 0.7;
    }
    noiseBufs[key] = buf;
    return buf;
  }

  function init() {
    if (ctx) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.1;
    comp.release.value = 0.6;

    master = ctx.createGain();
    master.gain.value = 0;

    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(3.2, 2.6);
    wet = ctx.createGain();
    wet.gain.value = 0.5;
    dry = ctx.createGain();
    dry.gain.value = 0.85;

    dry.connect(master);
    wet.connect(conv);
    conv.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);
  }

  function route(node, reverbAmt, toDry) {
    if (toDry) node.connect(dry);
    if (reverbAmt > 0) {
      const s = ctx.createGain();
      s.gain.value = reverbAmt;
      node.connect(s);
      s.connect(wet);
    }
  }

  /* ---------- 单音 ---------- */
  function playNote(track, freq, time, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = track.filter;
    f.Q.value = 0.6;

    o.type = track.wave;
    o.frequency.value = freq;
    const peak = (gain != null ? gain : track.noteGain);
    const dur = track.dur;

    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(peak, time + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, time + dur);

    o.connect(f); f.connect(g);
    route(g, track.reverb, true);
    o.start(time);
    o.stop(time + dur + 0.1);

    // 轻微的五度泛音，让声音更"空"
    if (track.wave === 'sine' && Math.random() < 0.45) {
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = 'sine';
      o2.frequency.value = freq * 2.005;
      g2.gain.setValueAtTime(0, time);
      g2.gain.linearRampToValueAtTime(peak * 0.25, time + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.0005, time + dur * 0.7);
      o2.connect(g2);
      route(g2, track.reverb, true);
      o2.start(time);
      o2.stop(time + dur);
    }
  }

  function crackle(time) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('white', 0.2);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1600 + Math.random() * 2200;
    f.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05 + Math.random() * 0.05, time);
    g.gain.exponentialRampToValueAtTime(0.0005, time + 0.06);
    src.connect(f); f.connect(g);
    route(g, 0.3, true);
    src.start(time);
    src.stop(time + 0.1);
  }

  /* ---------- 建立一条音轨 ---------- */
  function buildBus(key) {
    const track = TRACKS[key] || TRACKS.home;
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(1, t0 + 1.8);
    out.connect(master);

    const nodes = { gain: out, oscs: [], lfoNodes: [], stop: null };
    const oscList = [];

    // 铺底
    (track.pad || []).forEach((semi, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = hz(track.root + semi + (i === 2 ? 12 : 0));
      o.detune.value = (i - 1) * 4;
      f.type = 'lowpass';
      f.frequency.value = track.filter;
      f.Q.value = 0.4;
      g.gain.value = track.padGain / (i + 1.2);
      o.connect(f); f.connect(g); g.connect(out);
      route(g, track.reverb * 0.8, false);
      o.start();
      oscList.push(o);
      nodes.oscs.push(o);

      // 缓慢的音量起伏
      if (track.lfo) {
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = track.lfo.rate * (1 + i * 0.13);
        lg.gain.value = track.padGain * track.lfo.depth * 0.5;
        lfo.connect(lg);
        lg.connect(g.gain);
        lfo.start();
        nodes.lfoNodes.push(lfo);
      }
    });

    // 噪声层
    if (track.noise) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(track.noise.color, 4);
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = track.noise.hz;
      f.Q.value = track.noise.q;
      const g = ctx.createGain();
      g.gain.value = track.noise.gain;
      src.connect(f); f.connect(g); g.connect(out);
      if (track.lfo) {
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = track.lfo.rate;
        lg.gain.value = track.noise.gain * 0.6;
        lfo.connect(lg);
        lg.connect(g.gain);
        lfo.start();
        nodes.lfoNodes.push(lfo);
      }
      src.start();
      nodes.oscs.push(src);
    }

    nodes.stop = () => {
      oscList.forEach((o) => { try { o.stop(); } catch (e) {} });
      nodes.lfoNodes.forEach((o) => { try { o.stop(); } catch (e) {} });
      try { out.disconnect(); } catch (e) {}
    };

    // 音符调度
    const step = () => {
      if (bus !== nodes) return;
      const [min, max] = track.density;
      const wait = (min + Math.random() * (max - min)) * 1000;
      const when = ctx.currentTime + 0.05;
      const idx = Math.floor(Math.random() * track.scale.length * (track.octave || 2));
      if (track.noteGain > 0) playNote(track, hz(midiToSemis(track, idx)), when);
      if (track.crackle && Math.random() < 0.55) crackle(when + Math.random() * 0.3);
      timers.push(setTimeout(step, wait));
    };
    timers.push(setTimeout(step, 400 + Math.random() * 1600));

    return nodes;
  }

  function killBus(nodes, fade) {
    const t = ctx.currentTime;
    try {
      nodes.gain.gain.cancelScheduledValues(t);
      nodes.gain.gain.setValueAtTime(Math.max(nodes.gain.gain.value, 0.0001), t);
      nodes.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    } catch (e) {}
    setTimeout(() => nodes.stop(), fade * 1000 + 120);
  }

  function switchTo(key) {
    if (!ctx || busKey === key) return;
    timers.forEach(clearTimeout);
    timers = [];
    if (bus) killBus(bus, 1.2);
    busKey = key;
    bus = buildBus(key);
  }

  function resume() {
    init();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function applyMaster(on) {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(on ? 0.5 : 0.0001, t + (on ? 1.6 : 0.5));
  }

  function syncBtn() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(enabled));
    btn.classList.toggle('is-off', !enabled);
    btn.setAttribute('aria-label', enabled ? '关闭声音' : '打开声音');
  }

  function start() {
    if (started) return;
    started = true;
    resume();
    if (enabled) {
      applyMaster(true);
      switchTo(currentKey());
    }
    syncBtn();
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem('liubai.sound', enabled ? 'on' : 'off');
    if (!started) { start(); syncBtn(); return; }
    resume();
    if (enabled) {
      applyMaster(true);
      switchTo(currentKey());
    } else {
      applyMaster(false);
      // 关声时释放振荡器与调度，避免后台空跑
      timers.forEach(clearTimeout);
      timers = [];
      const dying = bus;
      bus = null;
      busKey = null;
      if (dying) killBus(dying, 0.5);
    }
    syncBtn();
  }

  let stateKey = 'home';
  function currentKey() { return stateKey; }

  window.Sound = {
    track(key) {
      stateKey = key || 'home';
      if (!ctx) { syncBtn(); return; }
      if (enabled) switchTo(stateKey);
    },
    toggle,
    start,
    get enabled() { return enabled; }
  };

  // 首次交互后自动开始
  const kick = () => {
    start();
    window.removeEventListener('pointerdown', kick);
    window.removeEventListener('keydown', kick);
    window.removeEventListener('touchstart', kick);
  };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('keydown', kick, { once: true });
  window.addEventListener('touchstart', kick, { once: true });

  if (btn) {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    syncBtn();
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });
})();
