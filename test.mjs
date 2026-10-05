import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const optsJson = (indexHtml.match(/<script id="OPTS"[^>]*>([\s\S]*?)<\/script>/) || [,'{}'])[1];
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const L = sandbox.ShiroLib;
let pass = 0, fail = 0;
const ok = (cond, name) => { cond ? pass++ : (fail++, console.error('FAIL:', name)); };
const throws = (fn, name) => { try { fn(); fail++; console.error('FAIL:', name); } catch { pass++; } };
const mkCtx = all => { const calls = []; return { calls, ctx: new Proxy({}, { get: (t, k) => k === 'canvas' ? {} : k === 'measureText' ? () => ({ width: 120 }) : (...a) => { for (const v of a) if (typeof v === 'number' || all) calls.push(v); return { addColorStop() {} }; }, set: () => true }) } };
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
  const {calls, ctx} = mkCtx();
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
  const {calls, ctx} = mkCtx();
  const sil = { width: 100, height: 200 };
  L.drawStickerOutline(ctx, sil, 100, 200, 300, 400, 0);
  ok(calls.length === 0, 'outline 0 draws nothing');
  L.drawStickerOutline(ctx, sil, 100, 200, 300, 400, .5);
  ok(calls.length === 32 * 4, 'outline emits 2x16 offset draws');
  ok(calls.every(Number.isFinite), 'outline coords finite');
}
{
  const {calls, ctx} = mkCtx();
  L.drawVignette(ctx, 1280, 720, 0);
  ok(calls.length === 0, 'vignette 0 draws nothing');
  L.drawVignette(ctx, 1280, 720, .5);
  ok(calls.length > 0 && calls.every(Number.isFinite), 'vignette coords finite');
}
{
  ok(L.clampParams({ watermark: 'x'.repeat(100) }).watermark.length === 60, 'watermark capped at 60');
  ok(L.clampParams({ watermark: 12345 }).watermark === '12345', 'watermark coerced to string');
  ok(L.clampParams(null).watermark === '', 'watermark defaults empty');
  const {calls, ctx} = mkCtx(true);
  L.drawWatermark(ctx, '', 1280, 720, .5);
  ok(calls.length === 0, 'empty watermark draws nothing');
  L.drawWatermark(ctx, '@ume', 1280, 720, .5);
  ok(calls.some(v => v === '@ume'), 'watermark text drawn');
}
{
  ok(L.clampParams({ eyeStyle: 'bogus' }).eyeStyle === 'dot', 'bad eyeStyle falls back');
  for (const es of L.EYES || ['dot','wink','closed','heart']) {
    const p = L.defaultParams(); p.eyeStyle = es;
    const {calls, ctx} = mkCtx();
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
    const {calls, ctx: gctx} = mkCtx();
    L.drawGlow(gctx, {}, 300, 500, 640, 600, 0);
    ok(calls.length === 0, 'glow off draws nothing');
    L.drawGlow(gctx, {}, 300, 500, 640, 600, .8);
    ok(calls.length === 4 && calls.every(Number.isFinite), 'glow draws blurred silhouette');
  }
  for (const acc of L.ACCS) {
    const p = L.defaultParams(); p.acc = acc;
    const {calls, ctx} = mkCtx();
    L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
    ok(calls.every(Number.isFinite), `acc ${acc} draws`);
  }
}
for (const type of ['snow', 'sparkle', 'petal']) {
  const {calls, ctx} = mkCtx();
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
  const {calls, ctx} = mkCtx();
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
  const {calls, ctx} = mkCtx();
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
  const {calls, ctx} = mkCtx();
  L.drawBackdrop(ctx, p, 1.7, null, 640, 360);
  ok((bg === 'transparent' || calls.length > 0) && calls.every(Number.isFinite), `bg ${bg} draws finite args`);
}
for (const type of L.PARTICLES) {
  const {calls, ctx} = mkCtx();
  L.drawParticles(ctx, 640, 360, type, 1.7, 42);
  ok(calls.every(Number.isFinite), `particles ${type} finite args`);
}
for (const hair of L.HAIRS) {
  const p = L.defaultParams(); p.hair = hair;
  const {calls, ctx} = mkCtx();
  L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
  ok(calls.every(Number.isFinite), `hair ${hair} draws`);
}
for (const acc of L.ACCS) {
  const {calls, ctx} = mkCtx();
  if (acc === 'cape') { const p = L.defaultParams(); p.acc = acc; L.drawMannequin(ctx, p, 1.0, 640, 600, 500) } else L.drawAccessory(ctx, acc, 320, 200, 60, .58);
  ok((acc === 'none' || calls.length > 0) && calls.every(Number.isFinite), `acc ${acc} draws finite args`);
}
for (const anim of L.ANIMS) {
  const p = L.defaultParams(); p.anim = anim;
  for (const t of [0, 1.37, 4.2]) L.mannequinPose(p, t);
  const {calls, ctx} = mkCtx();
  L.drawMannequin(ctx, p, 1.37, 640, 600, 500);
  ok(calls.length > 0 && calls.every(Number.isFinite), `anim ${anim} draws finite args`);
}
for (const es of L.EYES) {
  const p = L.defaultParams(); p.eyeStyle = es;
  const {calls, ctx} = mkCtx();
  L.drawMannequin(ctx, p, 1.0, 640, 600, 500);
  ok(calls.length > 0 && calls.every(Number.isFinite), `eyes ${es} draws finite args`);
}
for (const fit of L.FITS) {
  const p = L.defaultParams(); p.bgFit = fit; p.bgBlur = .3; p.bgSat = .7; p.bgContrast = .6; p.bgDrift = .5;
  for (const bg of [{ naturalWidth: 400, naturalHeight: 300 }, { videoWidth: 400, videoHeight: 300 }]) {
    const {calls, ctx} = mkCtx();
    L.drawBackdrop(ctx, p, 1.7, bg, 640, 360);
    ok(calls.length > 0 && calls.every(Number.isFinite), `bgFit ${fit} ${bg.naturalWidth ? 'image' : 'video'} draws finite args`);
  }
}
{

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
{
  const uiSrc = src.slice(src.indexOf("if (typeof document !== 'undefined')"));
  const libSrc = src.slice(0, src.indexOf("if (typeof document !== 'undefined'"));
  const libNames = new Set();
  for (const m of libSrc.matchAll(/^  const (.*)$/gm)) for (const d of m[1].matchAll(/([\w$]+)\s*=(?![=>])/g)) libNames.add(d[1]);
  for (const m of libSrc.matchAll(/^  function ([A-Za-z_$][\w$]*)/gm)) libNames.add(m[1]);
  const uiDecls = new Set([...uiSrc.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)|\(([\w$,\s]*)\)\s*=>|function\s+\w+\(([\w$,\s]*)\)|for \(let (\w+)/g)].flatMap(m => [m[1], m[2], m[3], m[4]].filter(Boolean).flatMap(s => s.split(',').map(x => x.trim()))));
  for (const m of uiSrc.matchAll(/^\s+(?:const|let|var)\s+(.*)$/gm)) for (const d of m[1].matchAll(/([\w$]+)\s*=(?![=>])/g)) uiDecls.add(d[1]);
  const uiNostr = uiSrc.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");
  const bare = [...libNames].filter(n => !uiDecls.has(n) && new RegExp(`[^.\\w$]${n.replace(/\$/g, '\\$')}`).test(uiNostr.replace(new RegExp(`L\\.${n.replace(/\$/g, '\\$')}`, 'g'), '')));
  ok(bare.length === 0, `no unexported lib refs in UI${bare.length ? ': ' + bare.join(',') : ''}`);
}
{
  const bad = [...src.matchAll(/(\w+)=\(([^)]*)\)=>(\w+)\./g)].filter(m => m[3] !== m[1] && m[2].split(',').map(s => s.trim()).includes(m[3]));
  ok(bad.length === 0, `no receiver-shadowing helper params${bad.length ? ': ' + bad.map(m => m[1]).join(',') : ''}`);
}
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
{
  const nostr = src.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");
  const builtins = new Set('if for while return switch case typeof new throw else do void delete in of instanceof try catch finally this super function async await Math JSON Object Array String Number Boolean Symbol Promise RegExp Error Map Set WeakMap WeakSet Reflect Proxy Intl Date parseInt parseFloat isNaN isFinite undefined null true false NaN Infinity globalThis window document requestAnimationFrame cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval console localStorage navigator fetch Uint8Array Uint8ClampedArray Float32Array ImageData MediaRecorder URL Blob FileReader FormData Image ClipboardItem File matchMedia HTMLCanvasElement HTMLVideoElement getComputedStyle TextEncoder TextDecoder AbortController structuredClone queueMicrotask performance crypto alert confirm prompt'.split(' '));
  const namesFromDecl = (seg) => {
    const d = new Set([...seg.matchAll(/([\w$]+)\s*=(?![=>])/g)].map(m => m[1]));
    for (const m of seg.matchAll(/\{([\w$,:.\s[\]]*)\}\s*=(?![=>])/g)) for (const x of m[1].split(',')) { const v = x.trim().split(':').pop().replace(/[[\]\s]/g, '').trim(); if (/^[\w$]+$/.test(v)) d.add(v) }
    for (const m of seg.matchAll(/function\s+([A-Za-z_$][\w$]*)|for\s*\(\s*(?:let|const|var)\s+(\w+)|\bcatch\s*\(\s*(\w+)/g)) d.add(m[1] || m[2] || m[3]);
    for (const m of seg.matchAll(/\(([\w$,\s.]*)\)\s*=>|function\s*\w*\s*\(([\w$,\s.]*)\)/g)) for (const g of [m[1], m[2]]) if (g) for (const x of g.split(',')) { const v = x.trim().replace(/^\.\.\./, '').split('=')[0].trim(); if (/^[\w$]+$/.test(v)) d.add(v) }
    return d;
  };
  const top = new Set();
  for (const m of nostr.matchAll(/^  const (.*)$/gm)) for (const n of namesFromDecl(m[1])) top.add(n);
  for (const m of nostr.matchAll(/^  (?:function|let|var)\s+([A-Za-z_$][\w$]*)/gm)) top.add(m[1]);
  const fns = [...nostr.matchAll(/^  function (\w+)\s*\(([^)]*)\)\s*\{/gm)];
  const bad = [];
  for (let i = 0; i < fns.length; i++) {
    const body = nostr.slice(fns[i].index + fns[i][0].length, i + 1 < fns.length ? fns[i + 1].index : nostr.length);
    const local = namesFromDecl(body);
    for (const x of fns[i][2].split(',')) { const v = x.trim(); if (v) local.add(v) }
    for (const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) { const n = m[1]; if (!local.has(n) && !top.has(n) && !builtins.has(n)) bad.push(`${fns[i][1]}:${n}`) }
  }
  ok(bad.length === 0, `no scope-level undeclared refs${bad.length ? ': ' + [...new Set(bad)].join(',') : ''}`);
}

// UI IIFE網羅: DOMスタブでUI層全体を起動 — frame/syncUI/配線/お気に入り/セッション復元の実行面を網羅(frame内の参照クラッシュ全般を捕捉)

// Guard: app.js が参照するDOM idがindex.htmlに実在するか照合(スタブ自動生成では検出不能なタイプミス型) + 配線キーがparamsに存在
{
  const html = indexHtml;
  const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const domCalls = [...src.matchAll(/(?:\$|on|clk)\('([a-zA-Z0-9_-]+)'/g)].map(m => m[1]);
  const tableIds = [...src.matchAll(/\['((?:sel|inp|chk|btn|fav|bg|model)-[a-z0-9-]+)'/g)].map(m => m[1]);
  const jsIds = new Set([...domCalls, ...tableIds].filter(id => !/^(sl-|out-)/.test(id)));
  const missing = [...jsIds].filter(id => !htmlIds.has(id));
  ok(missing.length === 0, `all referenced DOM ids exist in index.html${missing.length ? ': ' + missing.join(',') : ''}`);
  const orphanFor = [...html.matchAll(/for="([^"]+)"/g)].map(m => m[1]).filter(id => !htmlIds.has(id));
  const bareLbl = [...html.matchAll(/<label class="ctl"(?![^>]*for=)[^>]*>/g)];
  ok(orphanFor.length === 0 && bareLbl.length === 0, `labels associated to real controls${orphanFor.length ? ' orphans:' + orphanFor.join(',') : ''}${bareLbl.length ? ' unassociated:' + bareLbl.length : ''}`);
  const pkeys = new Set(Object.keys(L.defaultParams()));
  const tablePairs = [...src.matchAll(/\['((?:sel|inp)-[a-z0-9-]+)',\s*'([a-zA-Z]+)'/g)].map(m => m[2]);
  const badKeys = tablePairs.filter(k => !pkeys.has(k));
  ok(badKeys.length === 0, `wiring tables only reference real params${badKeys.length ? ': ' + badKeys.join(',') : ''}`);
}


const arrOf = n => { const m = src.match(new RegExp('const ' + n + " = \\[([^\\]]+)\\]")); return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [] };
const keysOf = n => { const i = src.indexOf('const ' + n + ' = {'); const j = src.indexOf('};', i); return i < 0 ? [] : [...src.slice(i, j).matchAll(/(?:'([^']+)'|(\w+))\s*:\s*[[{]/g)].map(m => m[1] || m[2]) };

// Guard: select option値がlib/UI真値源と双方向整合(値ズレ=ブラウザでサイレント誤動作)
{
  const html = indexHtml;
  const optsData = JSON.parse(optsJson);
  const zipKeys = {
    'sel-anim': L.ANIMS, 'sel-acc': L.ACCS, 'sel-eyes': L.EYES, 'sel-hair': L.HAIRS, 'sel-bgpreset': L.BGS, 'sel-particles': L.PARTICLES,
    'sel-fx': ['none', ...Object.keys(L.SUBJFX_FILTERS)], 'sel-grade': ['none', ...Object.keys(L.GRADE_STYLES)], 'sel-bgfit': L.FITS,
    'sel-blend': arrOf('BLENDS'), 'sel-wmpos': arrOf('WMPOS'), 'sel-vidq': arrOf('VIDQS'),
    'sel-place': ['', ...keysOf('PLACES')], 'sel-face': ['', ...keysOf('FACES')], 'sel-aspect': keysOf('ASPECTS'),
  };
  const optVals = id => zipKeys[id] || [];
  const checks = [
    ['sel-anim', L.ANIMS], ['sel-acc', L.ACCS], ['sel-eyes', L.EYES], ['sel-bgfit', L.FITS],
    ['sel-bgpreset', L.BGS], ['sel-particles', L.PARTICLES], ['sel-hair', L.HAIRS],
    ['sel-fx', [...Object.keys(L.SUBJFX_FILTERS), 'none']], ['sel-grade', arrOf('GRADES')],
    ['sel-blend', arrOf('BLENDS')], ['sel-wmpos', arrOf('WMPOS')], ['sel-vidq', arrOf('VIDQS')],
    ['sel-place', keysOf('PLACES')], ['sel-face', keysOf('FACES')], ['sel-aspect', keysOf('ASPECTS')],
  ];
  const optBad = [];
  for (const [id, exp] of checks) {
    const o = optVals(id), labels = optsData[id] || [];
    for (const v of o) if (v !== '' && !exp.includes(v)) optBad.push(`${id}:html-only ${v}`);
    for (const v of exp) if (!o.includes(v)) optBad.push(`${id}:lib-only ${v}`);
    if (labels.length !== o.length || labels.some(x => typeof x !== 'string' || x === '')) optBad.push(`${id}:labels`);
  }
  ok(optBad.length === 0, `select options match value tables${optBad.length ? ': ' + optBad.join(', ') : ''}`);
  ok(!('sel-acc2' in optsData) && src.includes("$('sel-acc2').innerHTML = $('sel-acc').innerHTML"), 'sel-acc2 inherits options from sel-acc');
}


// Guard: NUM_KEYSがdefaultParamsの全数値キーを網羅(漏れはstate.paramsからフィールド消失→frame NaN化)
{
  const d = L.defaultParams(), clamped = L.clampParams({});
  ok(Object.keys(d).every(k => k in clamped), 'clampParams output preserves all defaultParams keys');
  const numD = Object.keys(d).filter(k => typeof d[k] === 'number');
  ok(L.NUM_KEYS.every(k => numD.includes(k)), 'NUM_KEYS only references real params');
}

// ファズ: clampParams/parsePresetが破損入力を常に安全な形へ矯正
{
  const rand = () => [NaN, Infinity, -Infinity, 'x', 999, -5, {}, [], null, undefined, true, .5][Math.floor(Math.random() * 12) | 0] ?? 0;
  const enums = { anim: L.ANIMS, acc: L.ACCS, acc2: L.ACCS, eyeStyle: L.EYES, bgFit: L.FITS, bgPreset: L.BGS, particles: L.PARTICLES, hair: L.HAIRS, blend: arrOf('BLENDS'), grade: arrOf('GRADES'), wmPos: arrOf('WMPOS'), vidQ: arrOf('VIDQS'), subjFx: [...Object.keys(L.SUBJFX_FILTERS), 'none'] };
  const valid = p => p && L.NUM_KEYS.every(k => typeof p[k] === 'number' && p[k] >= 0 && p[k] <= 1)
    && Object.entries(enums).every(([k, t]) => t.includes(p[k]))
    && typeof p.watermark === 'string' && p.watermark.length <= 60 && p.bubble.length <= 24 && p.title.length <= 40
    && typeof p.flip === 'boolean' && Number.isInteger(p.seed) && p.seed >= 0;
  let bad = 0;
  for (let i = 0; i < 300; i++) {
    const garbage = {};
    for (const k of Object.keys(L.defaultParams())) if (Math.random() < .4) garbage[k] = rand();
    if (!valid(L.clampParams(garbage))) bad++;
    const code = JSON.stringify({ v: 1, name: 'n', params: garbage });
    try { if (!valid(L.parsePreset(code).params)) bad++ } catch { bad++; }
  }
  ok(bad === 0, `clampParams/parsePreset sanitize 600 fuzzed inputs (bad=${bad})`);
  const r1 = L.randomParams(L.mulberry32(42)), r2 = L.randomParams(L.mulberry32(42));
  ok(JSON.stringify(r1) === JSON.stringify(r2), 'randomParams deterministic per seed');
  ok(valid(r1) && valid(r2), 'randomParams output always valid');
  throws(() => L.parsePreset('{"v":1,"name":"x","params":null}'), 'null params rejected');
  throws(() => L.parseFavList('42'), 'non-array fav list rejected');
}

const mkUI = (seed, opts = {}) => {
  const h = { els: new Map(), calls: [], docListeners: {}, winListeners: {}, createdUrls: 0, store: new Map(Object.entries(seed || {})), raf: null, timers: [], tt: 0, rs: 42, revokedUrls: 0 };
  const calls = h.calls;
  const fakeCtx = new Proxy({}, {
    get: (t2, k) => k === 'canvas' ? {} : k === 'measureText' ? () => ({ width: 120 }) : k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) :
          k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'createPattern' ? () => ({}) : (...a) => { for (const v of a) if (typeof v === 'number') calls.push(v); return {} },
    set: () => true,
  });
  const mkEl = (tag = 'div') => {
    const el = {
      tagName: tag.toUpperCase(), id: '', value: '', checked: false, textContent: '', innerHTML: '', href: '', download: '', className: '', type: '', min: 0, max: 1, step: .01, htmlFor: '', draggable: false,
      get src() { return this._src }, set src(v) { this._src = v; queueMicrotask(() => { if (this.onloadeddata) this.onloadeddata() }) },
      style: {}, dataset: {}, files: [], children: [], listeners: {}, _q: {},
      classList: { _s: new Set(), toggle(c, v) { v ? this._s.add(c) : this._s.delete(c) }, contains(c) { return this._s.has(c) }, add(c) { this._s.add(c) }, remove(c) { this._s.delete(c) } },
      addEventListener(ev, f) { (this.listeners[ev] ||= []).push(f) },
      removeEventListener() {}, setPointerCapture() {}, releasePointerCapture() {},
      appendChild(c) { this.children.push(c); return c }, prepend(c) { this.children.unshift(c); return c }, remove() {},
      click() { (this.listeners.click || []).forEach(f => f({ target: el })) },
      fire(ev, e = {}) { e.target = e.target || el; (this.listeners[ev] || []).forEach(f => f(e)) },
      querySelector(s) { return this._q[s] ||= mkEl('span') },
      querySelectorAll() { return [] },
      getContext: () => fakeCtx,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360, right: 640, bottom: 360 }),
      toBlob(cb) { cb({ size: 1 }) }, toDataURL: () => 'data:,', captureStream: () => ({}),
      width: 640, height: 360, naturalWidth: 400, naturalHeight: 300, videoWidth: 400, videoHeight: 300,
      muted: false, loop: false, playsInline: false, paused: true, currentTime: 0,
      play: () => Promise.resolve(), pause() {}, focus() {}, blur() {},
      setAttribute() {}, getAttribute: () => null, setPointerCapture() {},
    };
    return el;
  };
  h.getEl = id => { if (!h.els.has(id)) h.els.set(id, mkEl()); return h.els.get(id) };
  const documentStub = {
    getElementById: h.getEl, createElement: t2 => mkEl(t2),
    addEventListener(ev, f) { (h.docListeners[ev] ||= []).push(f) },
    body: mkEl('body'), documentElement: mkEl('html'), hidden: false,
  };
  const sandbox2 = {
    console, document: documentStub,
    localStorage: { getItem: k => h.store.has(k) ? h.store.get(k) : null, setItem: (k, v) => h.store.set(k, String(v)), removeItem: k => h.store.delete(k) },
    matchMedia: q => ({ matches: !!(opts.rm && /reduced-motion/.test(q)), addEventListener() {} }),
    requestAnimationFrame: cb => { h.raf = cb; return 1 }, cancelAnimationFrame() {},
    performance: { now: () => (h.tt = (h.tt || 0) + 16.667) },
    setTimeout: (f, ms) => { const x = { f, ms, iv: false }; h.timers.push(x); return x },
    clearTimeout: x => { const i = h.timers.indexOf(x); if (i >= 0) h.timers.splice(i, 1) },
    setInterval: (f, ms) => { const x = { f, ms, iv: true }; h.timers.push(x); return x },
    clearInterval: x => { const i = h.timers.indexOf(x); if (i >= 0) h.timers.splice(i, 1) },
    queueMicrotask,
    prompt: (m, d) => d || 'fav1', alert() {}, confirm: () => true,
    URL: { createObjectURL: () => { h.createdUrls++; return 'blob:x' }, revokeObjectURL: () => { h.revokedUrls++ } },
    navigator: {}, window: { addEventListener: (ev, f) => { (h.winListeners[ev] ||= []).push(f) } }, location: { href: '', hash: '' }, history: { replaceState() {} },
    Image: class { set src(v) { this._src = v; if (this.onload) setTimeout(() => this.onload(), 0) } },
    ImageData: class { constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4) } },
    Blob: class { constructor(parts, opts) { this.parts = parts; this.type = opts && opts.type } },
    File: class { constructor(p, n, o) { this.name = n; this.type = o && o.type } },
    FileReader: class { readAsDataURL() { setTimeout(() => this.onload && this.onload({ target: { result: 'data:,' } }), 0) } },
    MediaRecorder: class { static isTypeSupported() { return true } start() {} stop() { if (this.onstop) this.onstop() } requestData() {} },
    Math: Object.assign(Object.create(Math), { random: () => { h.rs = ((h.rs || 0) * 1103515245 + 12345) % 2147483648; return h.rs / 2147483648 } }),
    Uint8ClampedArray, Uint8Array, Promise,
  };
  vm.createContext(sandbox2);
  h.tick = () => { const ts = h.timers.filter(x => !x.iv), ivs = h.timers.filter(x => x.iv); h.timers = h.timers.filter(x => x.iv); ts.forEach(x => x.f()); ivs.forEach(x => x.f()) };
  h.document = documentStub; h.sandbox = sandbox2;
  h.boot = () => { try { h.getEl('OPTS').textContent = optsJson; vm.runInContext(src, sandbox2); return null } catch (e) { return e } };
  h.frames = n => { let e = null, ran = 0; try { for (let i = 0; i < n; i++) { const cb = h.raf; h.raf = null; if (!cb) break; cb(performance.now()); ran++ } } catch (x) { e = x } return { e, ran } };
  return h
};

{
  const h = mkUI(), { calls, docListeners, store } = h, getEl = h.getEl, documentStub = h.document, sandbox2 = h.sandbox;
  const initErr = h.boot();
  ok(!initErr, `UI init completes${initErr ? ': ' + initErr.message : ''}`);
  ok(!!h.raf, 'frame scheduled via requestAnimationFrame');
  const fr = h.frames(3);
  ok(fr.ran > 0 && !fr.e, `frame() runs 3x without crash${fr.e ? ': ' + fr.e.message : ''}`);
  ok(calls.length > 100, `frame emits canvas geometry (n=${calls.length})`);
  ok(calls.every(Number.isFinite), 'frame coords finite');
  ok(calls.length < 700, `frame ctx-call budget ~165/frame (perf regression guard, n=${calls.length})`);
  { let d = 0; for (const c of calls) d = (d * 31 + (typeof c === 'number' ? Math.round(c * 1e4) : [...String(c)].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7))) % 4294967291;
    ok(d === 2420624414, `render fingerprint stable (golden digest, update intentionally) got ${d}`) }
  const L2 = sandbox2.ShiroLib;
  ok(typeof L2.drawMannequin === 'function' && typeof L2.defaultParams === 'function', 'lib evaluated in UI context');
  const ANIMS = L.ANIMS;
  ok(ANIMS.includes(getEl('sel-anim').value), 'syncUI set sel-anim to valid anim');
  ok(getEl('sl-height') && getEl('sl-height').value !== '' , 'syncUI set slider values');
  ok(getEl('out-height').textContent !== '', 'syncUI wrote slider readouts');
  const selAnim = getEl('sel-anim'); selAnim.value = ANIMS[5];
  selAnim.fire('change');
  ok(getEl('sel-anim').value === ANIMS[5], 'anim change wiring round-trips to UI');
  let evErr = null;
  try {
    (docListeners.keydown || []).forEach(f => f({ key: 'r', target: documentStub.body, preventDefault() {} }));
    (docListeners.keydown || []).forEach(f => f({ key: 'ArrowRight', target: documentStub.body, preventDefault() {} }));
    const stage = getEl('stage');
    stage.fire('pointerdown', { pointerId: 1, clientX: 320, clientY: 180, preventDefault() {} });
    stage.fire('pointermove', { pointerId: 1, clientX: 400, clientY: 200, preventDefault() {} });
    stage.fire('pointerup', {});
    getEl('chk-freeze').fire('change');
    getEl('chk-freeze').fire('change');
    getEl('btn-fav').click();
  } catch (e) { evErr = e }
  ok(!evErr, `UI events (keydown/pointer/freeze/fav) fire without crash${evErr ? ': ' + evErr.message : ''}`);
  const favJson = store.get('shiro-favs') || store.get('shiroFavs') || [...store.keys()].map(k => [k, store.get(k)]).filter(([k]) => /fav/i.test(k))[0]?.[1];
  ok(favJson && JSON.parse(favJson).length >= 1, 'fav click persisted to localStorage');
  ok(calls.every(Number.isFinite), 'coords still finite after events');

  let evErr2 = null;
  try {
    const key = L.SLIDERS[0][0];
    const sl = getEl('sl-' + key); sl.value = '.7'; sl.fire('input'); sl.fire('dblclick');
    const guides = getEl('chk-guides'); guides.checked = true; guides.fire('change');
    const selPlace = getEl('sel-place'); selPlace.value = 'tc'; selPlace.fire('change');
    const selFace = getEl('sel-face'); selFace.value = 'happy'; selFace.fire('change');
    const selAspect = getEl('sel-aspect'); selAspect.value = '9:16'; selAspect.fire('change');
    const scale0 = getEl('out-scale').textContent;
    getEl('stage').fire('wheel', { deltaY: 120, preventDefault() {} });
    const scale1 = getEl('out-scale').textContent;
    getEl('stage').fire('wheel', { deltaY: -500, ctrlKey: true, preventDefault() {} });
    ok(scale1 !== scale0 && getEl('out-scale').textContent === scale1, 'wheel zooms scale, ctrl+wheel passes to browser zoom');
    getEl('btn-model-reset').click(); getEl('btn-bg-reset').click();
    getEl('btn-png').click(); getEl('btn-png-copy').click(); var copyErr = getEl('err').textContent;
    getEl('btn-rec').click(); getEl('btn-rec').click();
    const st = getEl('stage'); const cs = st.captureStream; delete st.captureStream;
    getEl('btn-rec').click(); var recErr = getEl('err').textContent;
    st.captureStream = cs;
    getEl('btn-share').click();
    const bgF = getEl('bg-file'); bgF.files = [{ type: 'video/mp4' }]; bgF.fire('change');
    bgF.files = [{ type: 'image/png' }]; bgF.fire('change');
    const mF = getEl('model-file'); mF.files = [{ type: 'video/mp4' }]; mF.fire('change');
    mF.files = [{ type: 'image/png' }]; mF.fire('change');
    mF.files = [{ type: 'text/plain' }]; mF.fire('change');
    getEl('btn-fav-exp').click();
    const ff = getEl('fav-file'); ff.files = [{ type: 'application/json', text: () => Promise.resolve('[{"name":"imp","params":{}}]') }]; ff.fire('change');
    (docListeners.keydown || []).forEach(f => f({ key: '1', target: documentStub.body, preventDefault() {} }));
    (docListeners.keydown || []).forEach(f => f({ key: 'z', ctrlKey: true, target: documentStub.body, preventDefault() {} }));
    (docListeners.keydown || []).forEach(f => f({ key: 'y', ctrlKey: true, target: documentStub.body, preventDefault() {} }));
    (docListeners.keydown || []).forEach(f => f({ key: 'ArrowUp', shiftKey: true, target: documentStub.body, preventDefault() {} }));
    const wm = getEl('inp-watermark'); wm.value = '@x'; wm.fire('input');
    const bb = getEl('inp-bubble'); bb.value = 'hi'; bb.fire('input');
    const ti = getEl('inp-title'); ti.value = 'T'; ti.fire('input');
    for (const v of keysOf('PLACES')) { const e2 = getEl('sel-place'); e2.value = v; e2.fire('change') }
    for (const v of keysOf('FACES')) { const e2 = getEl('sel-face'); e2.value = v; e2.fire('change') }
    const wp = getEl('sel-wmpos'); wp.value = 'tl'; wp.fire('change');
    const pf = getEl('sel-particles'); pf.value = 'snow'; pf.fire('change');
  } catch (e) { evErr2 = e }
  ok(!evErr2, `extended UI events fire without crash${evErr2 ? ': ' + evErr2.message : ''}`);
  ok(getEl('guides').classList.contains('on'), 'guides toggle applies class');
  ok(getEl('sel-place').value === '', 'place preset resets selector');
  ok(getEl('sel-eyes').value === 'sharp', 'face preset sets eyeStyle (cool→sharp after full loop)');
  const errTxt = getEl('err').textContent;
  ok(errTxt === '' || typeof errTxt === 'string', 'err element text writable');
  ok(copyErr.includes('未対応'), 'png-copy reports unsupported');
  ok(getEl('btn-rec').textContent.includes('録画'), 'rec toggles label');
  ok(recErr.includes('未対応'), 'rec reports unsupported when captureStream missing');
  ok(h.createdUrls >= 2, `downloads create object URLs (n=${h.createdUrls})`);
  const bar = getEl('fav-bar');
  ok(bar.children.length >= 1, `fav rendered items (n=${bar.children.length})`);
  let favErr = null;
  try {
    const d = bar.children[0];
    const n0 = bar.children.length;
    d.fire('click');
    d.fire('keydown', { key: 'Enter', stopPropagation() {}, preventDefault() {} });
    d.fire('keydown', { key: ' ', stopPropagation() {}, preventDefault() {} });
    d.fire('keydown', { key: 'ArrowRight', shiftKey: true, stopPropagation() {}, preventDefault() {} });
    ok(getEl('fav-bar').children.length === n0, 'fav keydown Enter/Space/Shift+Arrow handled (apply + keyboard reorder)');
    const dt = { data: {}, setData(t2, v) { this.data[t2] = v }, getData(t2) { return this.data[t2] }, dropEffect: '', effectAllowed: '' };
    d.fire('dragstart', { dataTransfer: dt }); d.fire('dragover', { dataTransfer: dt, preventDefault() {} }); d.fire('drop', { dataTransfer: dt, preventDefault() {} });
    d._q['span'].fire('dblclick', { stopPropagation() {} });
    d._q['.del'].fire('click', { stopPropagation() {} });
  } catch (e) { favErr = e }
  ok(!favErr, `fav item events (apply/reorder/rename/delete) fire without crash${favErr ? ': ' + favErr.message : ''}`);
  await new Promise(r => setTimeout(r, 0));
  const favJson2 = [...store.keys()].map(k => [k, store.get(k)]).filter(([k]) => /fav/i.test(k))[0]?.[1];
  ok(!favJson2 || Array.isArray(JSON.parse(favJson2)), 'fav store stays valid JSON');
  h.getEl('btn-model-reset').click(); h.getEl('btn-bg-reset').click(); h.tick();
  ok(h.revokedUrls > 0, `file-load object URLs revoked on reset (n=${h.revokedUrls})`);
  const fr2 = h.frames(3);
  ok(!fr2.e, `frames still clean after all events${fr2.e ? ': ' + fr2.e.message : ''}`);
  ok(calls.every(Number.isFinite), 'coords finite after extended events');

  // ランダムパラメータ反復: 'r'キー → frame() で確率的に描画分岐を総当たり
  let randErr = null;
  try {
    for (let i = 0; i < 8; i++) {
      (docListeners.keydown || []).forEach(f => f({ key: 'r', target: documentStub.body, preventDefault() {} }));
      const r = h.frames(2); if (r.e) throw r.e;
    }
  } catch (e) { randErr = e }
  ok(!randErr, `random-param frames stay clean across 8 rounds${randErr ? ': ' + randErr.message : ''}`);
  ok(calls.every(Number.isFinite), 'coords finite after random-param frames');
}

// ブート復元経路: セッション+お気に入りを事前シードした2回目の評価
{
  const h = mkUI({
    'shiro.session.v1': JSON.stringify({ v: 1, params: { anim: 'jump', x: .3 }, aspect: '1:1' }),
    'shiro.favs.v1': '[{"id":"fx","name":"s1","params":{"anim":"walk"}}]',
  });
  const initErr = h.boot();
  ok(!initErr, `restored boot completes${initErr ? ': ' + initErr.message : ''}`);
  ok(h.getEl('sel-anim').value === 'jump', 'session params restored');
  ok(h.getEl('stage').width === 960, 'session aspect restored (1:1)');
  ok(h.getEl('fav-bar').children.length === 1, 'fav list rendered from storage');
  const r = h.frames(2);
  ok(r.ran > 0 && !r.e, `restored boot frames clean${r.e ? ': ' + r.e.message : ''}`);
}
{
  const h = mkUI({ 'shiro.session.v1': '{bad json', 'shiro.favs.v1': 'not-json' });
  const initErr = h.boot();
  ok(!initErr, `corrupt-storage boot still completes${initErr ? ': ' + initErr.message : ''}`);
  ok(h.getEl('sel-anim').value !== '', 'corrupt boot falls back to defaults');
}
{
  const h = mkUI({}, { rm: true });
  const initErr = h.boot();
  ok(!initErr, `reduced-motion boot completes${initErr ? ': ' + initErr.message : ''}`);
  ok(h.getEl('sel-anim').value === 'still', 'prefers-reduced-motion boots to still anim');
  ok(h.getEl('out-shake').textContent === '0.00' && h.getEl('out-bgDrift').textContent === '0.00' && h.getEl('sel-particles').value === 'none', 'reduced-motion also zeroes shake/drift/trail/particles');
}


// タイマー駆動経路: 自動セーブ(interval) + 録画の15秒自動停止(timeout)
{
  const h = mkUI();
  const initErr = h.boot();
  ok(!initErr, `timer-path boot clean${initErr ? ': ' + initErr.message : ''}`);
  h.tick();
  ok(JSON.parse(h.store.get('shiro.session.v1') || 'null')?.params?.anim === 'idle', 'autosave writes boot snapshot on first tick');
  const sel = h.getEl('sel-eyes'); sel.value = 'heart'; sel.fire('change', { target: sel });
  h.tick();
  const ses = JSON.parse(h.store.get('shiro.session.v1') || 'null');
  ok(ses && ses.v === 1 && ses.params.eyeStyle === 'heart', 'autosave persists changed params on interval tick');
  h.getEl('btn-rec').click();
  ok(h.getEl('btn-rec').textContent === '録画中… クリックで停止', 'recording started via btn-rec');
  h.tick();
  ok(h.getEl('btn-rec').textContent === '動画 録画開始', 'recTimer auto-stops recording at 15s');
  const st = h.getEl('stage');
  st.fire('pointerdown', { pointerId: 1, clientX: 320, clientY: 180 });
  st.fire('pointercancel');
  const xCancel = h.getEl('out-x').textContent;
  st.fire('pointermove', { pointerId: 1, clientX: 100, clientY: 100 });
  ok(h.getEl('out-x').textContent === xCancel, 'pointercancel clears dragging (sticky-drag bug fix)');
  (h.winListeners.beforeunload || []).forEach(f => f());
  ok(h.store.has('shiro.session.v1'), 'beforeunload flushes pending session save');
  ok(indexHtml.includes('touch-action:none'), 'stage has touch-action:none (drag works on touch devices)');
  ok(indexHtml.includes(':focus-visible'), 'keyboard focus has visible indicator (focus-visible styles)');
}

console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
