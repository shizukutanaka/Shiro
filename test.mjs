// node test.mjs — ShiroLib 純粋ロジックの検証ゲート
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

// rng
{
  const r1 = L.mulberry32(42), r2 = L.mulberry32(42);
  ok(r1() === r2() && r1() === r2(), 'mulberry32 deterministic');
  const r = L.mulberry32(1); for (let i = 0; i < 100; i++) { const v = r(); ok(v >= 0 && v < 1, 'rng range'); }
  ok(L.strSeed('shiro') === L.strSeed('shiro') && L.strSeed('a') !== L.strSeed('b'), 'strSeed');
}

// clampParams
{
  const p = L.clampParams({ height: 5, x: -1, anim: 'bogus', flip: 1, seed: 3.7 });
  ok(p.height === 1 && p.x === 0, 'clamp numeric range');
  ok(p.anim === 'idle', 'invalid anim falls back');
  ok(p.flip === true && p.seed === 3, 'flip/seed normalized');
  const d = L.clampParams(null);
  for (const k of L.NUM_KEYS) ok(d[k] >= 0 && d[k] <= 1, `default ${k} in range`);
  for (const k of L.NUM_KEYS) ok(d[k] === L.defaultParams()[k], `default ${k} matches`);
}

// randomParams
{
  for (let i = 0; i < 30; i++) {
    const p = L.randomParams(L.mulberry32(i));
    for (const k of L.NUM_KEYS) ok(p[k] >= 0 && p[k] <= 1, `random ${k} in range`);
    ok(L.ANIMS.includes(p.anim), 'random anim valid');
  }
}

// presets round-trip
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

// chroma key
{
  ok(L.keyAlpha(255, 255, 255, 0, .5) === 255, 'thresh=0 keeps pure white');
  ok(L.keyAlpha(255, 255, 255, .8, 0) === 0, 'pure white keyed out');
  ok(L.keyAlpha(20, 30, 40, .5, .3) === 255, 'dark pixel opaque');
  const a = L.keyAlpha(150, 160, 170, .5, .8);
  ok(a > 0 && a < 255, 'soft edge partial alpha');
}

// pose determinism
{
  const p = L.defaultParams();
  for (const anim of L.ANIMS) {
    p.anim = anim;
    const a = L.mannequinPose(p, 1.234), b = L.mannequinPose(p, 1.234);
    ok(JSON.stringify(a) === JSON.stringify(b), `pose ${anim} deterministic`);
    for (const v of Object.values(a)) ok(Number.isFinite(v), `pose ${anim} finite`);
  }
}

// skeleton sane
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

// drawMannequin with mock ctx: all coords finite, no throw
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

// bgPreset enum clamp + random validity
{
  ok(L.clampParams({ bgPreset: 'bogus' }).bgPreset === 'gradient', 'bad bgPreset falls back');
  ok(L.BGS.includes(L.clampParams({ bgPreset: 'transparent' }).bgPreset), 'bgPreset survives clamp');
  for (let i = 0; i < 50; i++)
    ok(L.BGS.includes(L.randomParams(L.mulberry32(i)).bgPreset), 'random bgPreset valid');
}

// jump anim: mid-flight bob positive, arms raised, knees tucked
{
  const p = L.defaultParams(); p.anim = 'jump'; p.animSpeed = .5;
  const s = .4 + .5 * 2.2;
  const q = L.mannequinPose(p, 0.5 / s); // tt=0.5 → apex
  ok(q.bob > .1, 'jump apex lifts model');
  ok(q.lKnee > .5 && q.rKnee > .5, 'jump tucks knees');
  ok(q.lArm < -.5 && q.rArm > .5, 'jump raises both arms');
  const q0 = L.mannequinPose(p, 0);
  ok(q0.bob === 0, 'jump lands at t=0');
}

// sticker outline: emits offset draws, no-op at 0
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

// vignette: no-op at 0, draws rect when active
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

// watermark: string clamp + draw behavior
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

// eyeStyle enum clamp + draw across all styles
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
  ok(['dot','wink','closed','heart'].includes(pr.eyeStyle), 'random eyeStyle valid');
}

// blink cycle
{
  ok(L.blinkOpen(1.0) === 1 && L.blinkOpen(1.0) === L.blinkOpen(1.0), 'blink deterministic/open by default');
  ok(L.blinkOpen(.09) < .5, 'blink closes mid-cycle');
  for (let i = 0; i < 200; i++) { const v = L.blinkOpen(i * .07); ok(v >= 0 && v <= 1, 'blink range'); }
  // seed-personalized periods: deterministic per seed, differs across seeds somewhere in 0..8s
  ok(L.blinkOpen(2.5, 42) === L.blinkOpen(2.5, 42), 'blink seed deterministic');
  let differ = false;
  for (let i = 0; i < 200; i++) if (L.blinkOpen(i * .04, 0) !== L.blinkOpen(i * .04, 96)) { differ = true; break; }
  ok(differ, 'blink period varies by seed');
}

// erodeAlpha: opaque island loses its 1px border
{
  const w = 5, h = 5, d = new Uint8Array(w * h * 4);
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) d[(y * w + x) * 4 + 3] = 255;
  L.erodeAlpha(d, w, h);
  ok(d[(2 * w + 2) * 4 + 3] === 255, 'interior survives erosion');
  ok(d[(1 * w + 1) * 4 + 3] === 0, 'edge pixel eroded');
  ok(d[(0 * w + 0) * 4 + 3] === 0, 'transparent stays transparent');
}

// contactShadow: no draw when alpha/radius zero, finite args otherwise
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

// accessories: all variants draw finite geometry
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

// cast shadow: directional only, finite args
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

// mime picker
{
  ok(L.pickMime(() => true).ext === 'mp4', 'mp4 preferred');
  ok(L.pickMime(m => m.includes('webm')).ext === 'webm', 'webm fallback');
  ok(L.pickMime(() => false) === null, 'no support -> null');
}

console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
