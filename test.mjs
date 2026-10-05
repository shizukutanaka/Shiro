
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const L = sandbox.ShiroLib;

let pass = 0, fail = 0;
const ok = (cond, name) => { cond ? pass++ : (fail++, console.error('FAIL:', name)); };
const throws = (fn, name) => { try { fn(); fail++; console.error('FAIL:', name); } catch { pass++; } };

{
  const r1 = L.mulberry32(42), r2 = L.mulberry32(42);
  ok(r1() === r2() && r1() === r2(), 'mulberry32 deterministic');
  const r = L.mulberry32(1); for (let i = 0; i < 100; i++) { const v = r(); ok(v >= 0 && v < 1, 'rng range'); }
  ok(L.strSeed('shiro') === L.strSeed('shiro') && L.strSeed('a') !== L.strSeed('b'), 'strSeed');
}

{
  const p = L.clampParams({ height: 5, x: -1, anim: 'bogus', flip: 1, seed: 3.7 });
  ok(p.height === 1 && p.x === 0, 'clamp numeric range');
  ok(p.anim === 'idle', 'invalid anim falls back');
  ok(p.flip === true && p.seed === 3, 'flip/seed normalized');
  const d = L.clampParams(null);
  for (const k of L.NUM_KEYS) ok(d[k] >= 0 && d[k] <= 1, `default ${k} in range`);
  for (const k of L.NUM_KEYS) ok(d[k] === L.defaultParams()[k], `default ${k} matches`);
}

{
  for (let i = 0; i < 30; i++) {
    const p = L.randomParams(L.mulberry32(i));
    for (const k of L.NUM_KEYS) ok(p[k] >= 0 && p[k] <= 1, `random ${k} in range`);
    ok(L.ANIMS.includes(p.anim), 'random anim valid');
  }
}

{
  const p = L.randomParams(L.mulberry32(7));
  const back = L.parsePreset(L.serializePreset('テスト', p));
  ok(back.name === 'テスト' && JSON.stringify(back.params) === JSON.stringify(p), 'preset round-trip');
  throws(() => L.parsePreset('{"v":2}'), 'bad version rejected');
  throws(() => L.parsePreset('not json'), 'garbage rejected');
  const list = L.parseFavList(JSON.stringify([{ name: 'a', params: p }, { bogus: 1 }, { name: 'b', params: { height: 9 } }]));
  ok(list.length === 2 && list[1].params.height === 1, 'fav list filters and clamps');
  throws(() => L.parseFavList('{}'), 'non-array fav list rejected');
}

{
  ok(L.keyAlpha(255, 255, 255, 0, .5) === 255, 'thresh=0 keeps pure white');
  ok(L.keyAlpha(255, 255, 255, .8, 0) === 0, 'pure white keyed out');
  ok(L.keyAlpha(20, 30, 40, .5, .3) === 255, 'dark pixel opaque');
  const a = L.keyAlpha(150, 160, 170, .5, .8);
  ok(a > 0 && a < 255, 'soft edge partial alpha');
}

{
  const p = L.defaultParams();
  for (const anim of L.ANIMS) {
    p.anim = anim;
    const a = L.mannequinPose(p, 1.234), b = L.mannequinPose(p, 1.234);
    ok(JSON.stringify(a) === JSON.stringify(b), `pose ${anim} deterministic`);
    for (const v of Object.values(a)) ok(Number.isFinite(v), `pose ${anim} finite`);
  }
}

{
  const p = L.defaultParams();
  const K = L.skeleton(p, L.mannequinPose(p, 0));
  for (const [key, pt] of Object.entries(K)) {
    if (!Array.isArray(pt)) continue;
    ok(pt.every(Number.isFinite), `skeleton ${key} finite`);
    ok(pt[1] >= -0.01 && pt[1] <= 1.2, `skeleton ${key} y range`);
  }
  ok(K.lAnk[1] > 0 && K.headC[1] > K.lAnk[1], 'head above ankles');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => {
      for (const v of a) if (typeof v === 'number') calls.push(v);
      return { addColorStop() {} };
    },
    set: () => true,
  });
  for (const anim of L.ANIMS) {
    const p = L.defaultParams(); p.anim = anim;
    L.drawMannequin(ctx, p, 2.5, 640, 600, 500);
  }
  ok(calls.length > 100, 'draw emits geometry');
  ok(calls.every(Number.isFinite), 'draw coords finite');
}

{
  ok(L.clampParams({ bgPreset: 'bogus' }).bgPreset === 'gradient', 'bad bgPreset falls back');
  ok(L.BGS.includes(L.clampParams({ bgPreset: 'transparent' }).bgPreset), 'bgPreset survives clamp');
  for (let i = 0; i < 50; i++)
    ok(L.BGS.includes(L.randomParams(L.mulberry32(i)).bgPreset), 'random bgPreset valid');
}

{
  const p = L.defaultParams(); p.anim = 'jump'; p.animSpeed = .5;
  const s = .4 + .5 * 2.2;
  const q = L.mannequinPose(p, 0.5 / s);
  ok(q.bob > .1, 'jump apex lifts model');
  ok(q.lKnee > .5 && q.rKnee > .5, 'jump tucks knees');
  ok(q.lArm < -.5 && q.rArm > .5, 'jump raises both arms');
  const q0 = L.mannequinPose(p, 0);
  ok(q0.bob === 0, 'jump lands at t=0');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return {}; },
    set: () => true,
  });
  const sil = { width: 100, height: 200 };
  L.drawStickerOutline(ctx, sil, 100, 200, 300, 400, 0);
  ok(calls.length === 0, 'outline 0 draws nothing');
  L.drawStickerOutline(ctx, sil, 100, 200, 300, 400, .5);
  ok(calls.length === 32 * 4, 'outline emits 2x16 offset draws');
  ok(calls.every(Number.isFinite), 'outline coords finite');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawVignette(ctx, 1280, 720, 0);
  ok(calls.length === 0, 'vignette 0 draws nothing');
  L.drawVignette(ctx, 1280, 720, .5);
  ok(calls.length > 0 && calls.every(Number.isFinite), 'vignette coords finite');
}

{
  ok(L.clampParams({ watermark: 'x'.repeat(100) }).watermark.length === 60, 'watermark capped at 60');
  ok(L.clampParams({ watermark: 12345 }).watermark === '12345', 'watermark coerced to string');
  ok(L.clampParams(null).watermark === '', 'watermark defaults empty');
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) calls.push(v); return {}; },
    set: () => true,
  });
  L.drawWatermark(ctx, '', 1280, 720, .5);
  ok(calls.length === 0, 'empty watermark draws nothing');
  L.drawWatermark(ctx, '@ume', 1280, 720, .5);
  ok(calls.some(v => v === '@ume'), 'watermark text drawn');
}

{
  ok(L.clampParams({ eyeStyle: 'bogus' }).eyeStyle === 'dot', 'bad eyeStyle falls back');
  for (const es of L.EYES || ['dot','wink','closed','heart']) {
    const p = L.defaultParams(); p.eyeStyle = es;
    const calls = [];
    const ctx = new Proxy({}, {
      get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
      set: () => true,
    });
    L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
    ok(calls.length > 50 && calls.every(Number.isFinite), `eyeStyle ${es} draws`);
  }
  const pr = L.randomParams(L.mulberry32(7));
  ok(L.EYES.includes(pr.eyeStyle), 'random eyeStyle valid');
  ok(['none','sepia','mono','invert'].includes(pr.subjFx), 'random subjFx valid');
  ok(['none','warm','cool','noir','vivid'].includes(pr.grade), 'random grade valid');
  ok(L.clampParams({ subjFx: 'x', grade: 'y' }).subjFx === 'none' && L.clampParams({ subjFx: 'x', grade: 'y' }).grade === 'none', 'bad fx/grade fall back');
  ok(L.clampParams({ acc: 'crown' }).acc === 'crown' && L.clampParams({ acc: 'phones' }).acc === 'phones', 'new accessories valid');
  ok(L.clampParams({ blend: 'bogus' }).blend === 'none' && L.clampParams({ blend: 'screen' }).blend === 'screen', 'blend clamp');

  {
    const calls = [];
    const gctx = new Proxy({}, {
      get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
      set: () => true,
    });
    L.drawGlow(gctx, {}, 300, 500, 640, 600, 0);
    ok(calls.length === 0, 'glow off draws nothing');
    L.drawGlow(gctx, {}, 300, 500, 640, 600, .8);
    ok(calls.length === 4 && calls.every(Number.isFinite), 'glow draws blurred silhouette');
  }

  for (const acc of L.ACCS) {
    const p = L.defaultParams(); p.acc = acc;
    const calls = [];
    const ctx = new Proxy({}, {
      get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
      set: () => true,
    });
    L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
    ok(calls.every(Number.isFinite), `acc ${acc} draws`);
  }
}

for (const type of ['snow', 'sparkle', 'petal']) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawParticles(ctx, 640, 360, type, 1.7, 42);
  ok(calls.length > 20 && calls.every(Number.isFinite), `particles ${type} draws finite args`);
}
ok(L.clampParams({ particles: 'bogus' }).particles === 'none', 'particles invalid falls back to none');
ok(L.clampParams({ particles: 'snow' }).particles === 'snow', 'particles snow kept');
ok(L.clampParams({ acc: 'cape' }).acc === 'cape', 'cape accessory kept');
ok(L.clampParams({ brow: 2 }).brow === 1 && L.clampParams({ brow: -1 }).brow === 0, 'brow clamped');
ok(L.clampParams({ wmPos: 'xx' }).wmPos === 'br' && L.clampParams({ wmPos: 'tl' }).wmPos === 'tl', 'wmPos enum');

{
  const p = { ...L.defaultParams(), anim: 'bow' };
  let maxTilt = 0;
  for (let t = 0; t < 3; t += .05) maxTilt = Math.max(maxTilt, L.mannequinPose(p, t).headTilt);
  ok(maxTilt > .3, 'bow pose tilts head deeply');
}

{
  const d = new Uint8Array([255, 200, 200, 128,  100, 50, 200, 255,  10, 20, 30, 0]);
  L.despill(d, 1);
  ok(d[0] === d[1] && d[1] === d[2], 'semi-alpha pixel desaturated');
  ok(d[4] === 100 && d[5] === 50 && d[6] === 200, 'opaque pixel untouched');
  ok(d[8] === 10 && d[9] === 20 && d[10] === 30, 'transparent pixel untouched');
  const d2 = new Uint8Array([255, 200, 200, 128]);
  L.despill(d2, 0);
  ok(d2[0] === 255, 'despill 0 no-op');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawReflection(ctx, {}, 640, 600, 300, 500, 0);
  ok(calls.length === 0, 'reflection off draws nothing');
  L.drawReflection(ctx, {}, 640, 600, 300, 500, .8);
  ok(calls.length === 8 && calls.every(Number.isFinite), 'reflection draws flipped image');
}

{
  ok(L.blinkOpen(1.0) === 1 && L.blinkOpen(1.0) === L.blinkOpen(1.0), 'blink deterministic/open by default');
  ok(L.blinkOpen(.09) < .5, 'blink closes mid-cycle');
  for (let i = 0; i < 200; i++) { const v = L.blinkOpen(i * .07); ok(v >= 0 && v <= 1, 'blink range'); }

  ok(L.blinkOpen(2.5, 42) === L.blinkOpen(2.5, 42), 'blink seed deterministic');
  let differ = false;
  for (let i = 0; i < 200; i++) if (L.blinkOpen(i * .04, 0) !== L.blinkOpen(i * .04, 96)) { differ = true; break; }
  ok(differ, 'blink period varies by seed');
}

{
  const w = 5, h = 5, d = new Uint8Array(w * h * 4);
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) d[(y * w + x) * 4 + 3] = 255;
  L.erodeAlpha(d, w, h);
  ok(d[(2 * w + 2) * 4 + 3] === 255, 'interior survives erosion');
  ok(d[(1 * w + 1) * 4 + 3] === 0, 'edge pixel eroded');
  ok(d[(0 * w + 0) * 4 + 3] === 0, 'transparent stays transparent');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => (...a) => { calls.push([k, ...a]); return { addColorStop() {} }; },
    set: () => true,
  });
  L.contactShadow(ctx, 100, 200, 50, .5);
  ok(calls.some(c => c[0] === 'createRadialGradient'), 'shadow gradient emitted');
  const before = calls.length;
  L.contactShadow(ctx, 100, 200, 50, 0);
  ok(calls.length === before, 'zero alpha shadow skipped');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: () => (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return {}; },
    set: () => true,
  });
  for (const acc of L.ACCS) L.drawAccessory(ctx, acc, 100, 100, 20);
  ok(calls.length > 20, 'accessory draws geometry');
  ok(calls.every(Number.isFinite), 'accessory coords finite');
  const p = L.randomParams(L.mulberry32(3));
  ok(L.ACCS.includes(p.acc) && L.clampParams({ acc: 'x' }).acc === 'none', 'acc clamped/valid');
}

{
  const calls = [];
  const ctx = new Proxy({}, {
    get: () => (...a) => { calls.push([...a]); return {}; },
    set: () => true,
  });
  L.drawCastShadow(ctx, { width: 10, height: 10 }, 100, 200, 320, 600, 0, .4);
  ok(calls.length > 0, 'cast shadow emitted when dir off-center');
  const before = calls.length;
  L.drawCastShadow(ctx, { width: 10, height: 10 }, 100, 200, 320, 600, .5, .4);
  ok(calls.length === before, 'cast shadow skipped at center dir');
}

{
  ok(L.pickMime(() => true).ext === 'mp4', 'mp4 preferred');
  ok(L.pickMime(m => m.includes('webm')).ext === 'webm', 'webm fallback');
  ok(L.pickMime(() => false) === null, 'no support -> null');
}

for (const bg of L.BGS) {
  const p = L.defaultParams(); p.bgPreset = bg;
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawBackdrop(ctx, p, 1.7, null, 640, 360);
  ok((bg === 'transparent' || calls.length > 0) && calls.every(Number.isFinite), `bg ${bg} draws finite args`);
}

for (const type of L.PARTICLES) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawParticles(ctx, 640, 360, type, 1.7, 42);
  ok(calls.every(Number.isFinite), `particles ${type} finite args`);
}

for (const hair of L.HAIRS) {
  const p = L.defaultParams(); p.hair = hair;
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
  ok(calls.every(Number.isFinite), `hair ${hair} draws`);
}

for (const acc of L.ACCS) {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  if (acc === 'cape') { const p = L.defaultParams(); p.acc = acc; L.drawMannequin(ctx, p, 1.0, 640, 600, 500) } else L.drawAccessory(ctx, acc, 320, 200, 60, .58);
  ok((acc === 'none' || calls.length > 0) && calls.every(Number.isFinite), `acc ${acc} draws finite args`);
}

for (const anim of L.ANIMS) {
  const p = L.defaultParams(); p.anim = anim;
  for (const t of [0, 1.37, 4.2]) L.mannequinPose(p, t);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawMannequin(ctx, p, 1.37, 640, 600, 500);
  ok(calls.length > 0 && calls.every(Number.isFinite), `anim ${anim} draws finite args`);
}

for (const es of L.EYES) {
  const p = L.defaultParams(); p.eyeStyle = es;
  const calls = [];
  const ctx = new Proxy({}, {
    get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
    set: () => true,
  });
  L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
  ok(calls.length > 0 && calls.every(Number.isFinite), `eyes ${es} draws finite args`);
}

for (const fit of L.FITS) {
  const p = L.defaultParams(); p.bgFit = fit; p.bgBlur = .3; p.bgSat = .7; p.bgContrast = .6; p.bgDrift = .5;
  for (const bg of [{ naturalWidth: 400, naturalHeight: 300 }, { videoWidth: 400, videoHeight: 300 }]) {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (t, k) => k === 'canvas' ? {} : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; },
      set: () => true,
    });
    L.drawBackdrop(ctx, p, 1.7, bg, 640, 360);
    ok(calls.length > 0 && calls.every(Number.isFinite), `bgFit ${fit} ${bg.naturalWidth ? 'image' : 'video'} draws finite args`);
  }
}

{
  const mkCtx = () => { const calls = []; return { calls, ctx: new Proxy({}, { get: (t, k) => k === 'canvas' ? {} : k === 'measureText' ? () => ({ width: 120 }) : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return { addColorStop() {} }; }, set: () => true }) } };
  const sil = {};
  const fin = (name, c) => ok(c.length > 0 && c.every(Number.isFinite), `${name} finite args`);
  let m;
  m = mkCtx(); L.drawCastShadow(m.ctx, sil, 200, 400, 320, 600, .1, .5, .4); fin('castShadow', m.calls);
  m = mkCtx(); L.drawCastShadow(m.ctx, sil, 200, 400, 320, 600, .9, .5, .4); fin('castShadow dir2', m.calls);
  m = mkCtx(); L.drawRimLight(m.ctx, sil, 200, 400, 320, 600, .3, .5); fin('rimLight', m.calls);
  m = mkCtx(); L.drawStickerOutline(m.ctx, sil, 200, 400, 320, 600, .8); fin('stickerOutline', m.calls);
  m = mkCtx(); L.drawVignette(m.ctx, 640, 360, .5); fin('vignette', m.calls);
  for (const pos of ['tl', 'tr', 'bl', 'br']) { m = mkCtx(); L.drawWatermark(m.ctx, 'テスト', 640, 360, .5, pos); fin(`watermark ${pos}`, m.calls); }
  m = mkCtx(); L.drawGlow(m.ctx, sil, 200, 400, 320, 600, .5); fin('glow', m.calls);
  m = mkCtx(); L.drawReflection(m.ctx, sil, 320, 600, 200, 400, .5); fin('reflection', m.calls);
  m = mkCtx(); L.contactShadow(m.ctx, 320, 600, 80, .5); fin('contactShadow', m.calls);
  m = mkCtx(); L.drawBubble(m.ctx, 'こんにちは', 320, 200, 640, 360, .5); fin('bubble', m.calls);
  m = mkCtx(); L.drawParticles(m.ctx, 640, 360, 'snow', 1.7, 42); fin('particles(単独)', m.calls);
  ok(L.keyAlpha(255, 255, 255, .5, .3) === 0 && L.keyAlpha(0, 0, 0, .5, .3) === 255 && L.keyAlpha(255, 255, 255, 0, .3) === 255, 'keyAlpha keys out white');
  { const d = new Uint8ClampedArray(4 * 4 * 4).fill(255); L.erodeAlpha(d, 4, 4); ok(d.every(v => v >= 0), 'erodeAlpha runs'); }
  { const d = new Uint8ClampedArray([10, 200, 30, 128]); L.despill(d, .5); ok(Number.isFinite(d[0] + d[1] + d[2]), 'despill finite'); }
  ok(Number.isFinite(L.blinkOpen(1.7, 42)), 'blinkOpen finite');
  ok(L.pickMime(() => true).ext === 'mp4' && L.pickMime(() => false) === null, 'pickMime');
  m = mkCtx(); const cv = {}; ok(L.shined({ width: 100, height: 100 }, m.ctx, cv, 1.7, .5) === cv && m.calls.every(Number.isFinite), 'shined finite args');
}

// 静的ガード: UIスコープからlib内部constへの裸参照(未エクスポート)を検出 — GRADE_STYLES/SUBJFX_FILTERS型クラッシュの再発防止
{
  const uiSrc = src.slice(src.indexOf("if (typeof document !== 'undefined')"));
  const libSrc = src.slice(0, src.indexOf("if (typeof document !== 'undefined'"));
  const libNames = new Set([...libSrc.matchAll(/^  const ([A-Za-z_$][\w$]*) =/gm)].map(m => m[1]).filter(n => /^[A-Z]/.test(n)));
  const uiDecls = new Set([...uiSrc.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)|\(([\w$,\s]*)\)\s*=>|function\s+\w+\(([\w$,\s]*)\)|for \(let (\w+)/g)].flatMap(m => [m[1], m[2], m[3], m[4]].filter(Boolean).flatMap(s => s.split(',').map(x => x.trim()))));
  const bare = [...libNames].filter(n => !uiDecls.has(n) && new RegExp(`[^.\\w$]${n.replace(/\$/g, '\\$')}`).test(uiSrc.replace(new RegExp(`L\\.${n.replace(/\$/g, '\\$')}`, 'g'), '')));
  ok(bare.length === 0, `no unexported lib refs in UI${bare.length ? ': ' + bare.join(',') : ''}`);
}

// 静的ガード: ヘルパー宣言の引数名がレシーバーをシャドウしていないか — qT=(a,b,c,d)=>c.型クラッシュの再発防止
{
  const bad = [...src.matchAll(/(\w+)=\(([^)]*)\)=>(\w+)\./g)].filter(m => m[3] !== m[1] && m[2].split(',').map(s => s.trim()).includes(m[3]));
  ok(bad.length === 0, `no receiver-shadowing helper params${bad.length ? ': ' + bad.map(m => m[1]).join(',') : ''}`);
}

// 静的ガード: 宣言のない関数呼び出しを検出 — shined内sfR型クラッシュ(語彙変換が宣言を残して参照だけ移動した型)の再発防止
{
  const nostr = src.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");
  const decls = new Set([...nostr.matchAll(/([\w$]+)\s*=(?![=>])/g)].map(m => m[1]));
  for (const m of nostr.matchAll(/\{([\w$,:.\s[\]]*)\}\s*=(?![=>])/g)) for (const x of m[1].split(',')) { const v = x.trim().split(':').pop().replace(/[[\]\s]/g, '').trim(); if (/^[\w$]+$/.test(v)) decls.add(v) }
  for (const m of nostr.matchAll(/function\s+([A-Za-z_$][\w$]*)|for\s*\(\s*(?:let|const|var)\s+(\w+)|\bcatch\s*\(\s*(\w+)/g)) decls.add(m[1] || m[2] || m[3]);
  for (const m of nostr.matchAll(/\(([\w$,\s.]*)\)\s*=>|function\s*\w*\s*\(([\w$,\s.]*)\)/g)) for (const g of [m[1], m[2]]) if (g) for (const x of g.split(',')) { const v = x.trim().replace(/^\.\.\./, '').split('=')[0].trim(); if (/^[\w$]+$/.test(v)) decls.add(v) }
  const builtins = new Set('if for while return switch case typeof new throw else do void delete in of instanceof try catch finally this super function async await Math JSON Object Array String Number Boolean Symbol Promise RegExp Error Map Set WeakMap WeakSet Reflect Proxy Intl Date parseInt parseFloat isNaN isFinite undefined null true false NaN Infinity globalThis window document requestAnimationFrame cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval console localStorage navigator fetch Uint8Array Uint8ClampedArray Float32Array ImageData MediaRecorder URL Blob FileReader FormData Image ClipboardItem File matchMedia HTMLCanvasElement HTMLVideoElement getComputedStyle TextEncoder TextDecoder AbortController structuredClone queueMicrotask performance crypto alert confirm prompt'.split(' '));
  const bad = new Set();
  for (const m of nostr.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) if (!decls.has(m[1]) && !builtins.has(m[1])) bad.add(m[1]);
  ok(bad.size === 0, `no undeclared function calls${bad.size ? ': ' + [...bad].join(',') : ''}`);
}

// 静的ガード: rng()を使う背景ケースで const rng 宣言が存在するか — scat変換が宣言を飲み込む型の再発防止
{
  const marks = [...src.matchAll(/pr === '(\w+)'/g)];
  const bad = [];
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].index : src.indexOf('function silhouetteOf', marks[i].index);
    const blk = src.slice(marks[i].index, end);
    const usesRng = [...blk.matchAll(/\brng\(\)/g)].length > 0;
    const declRng = /(?:const|let)\s+rng\s*=/.test(blk) || /scat\(\d+, \d+, \(rng/.test(blk);
    if (usesRng && !declRng) {
      const usesOutsideScat = /(?<![(,\s])rng\(\)/.test(blk.replace(/scat\(\d+, \d+, \(rng, i\) => \{[^}]*\}/g, ''));
      if (usesOutsideScat) bad.push(marks[i][1]);
    }
  }
  ok(bad.length === 0, `all rng-using bg cases declare rng${bad.length ? ': ' + bad.join(',') : ''}`);
}

console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
