// node test.mjs — ShiroLib 純粋ロジック＋UI 起動の検証ゲート
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

// mime picker
{
  ok(L.pickMime(() => true).ext === 'mp4', 'mp4 preferred');
  ok(L.pickMime(m => m.includes('webm')).ext === 'webm', 'webm fallback');
  ok(L.pickMime(() => false) === null, 'no support -> null');
}

// ---------- UI boot (DOM stub): 初回起動で誤った「読み込めませんでした」を出さない ----------
// UI 部は document がある場合のみ動くため、最小の DOM スタブで起動そのものを再現する。
// お気に入り読み込みの宣言順ミス（TDZ）で毎回データ破損エラーに見えた回帰の固定。
{
  const makeCtx = () => new Proxy({}, {
    get: (t, k) => {
      if (k === 'canvas') return {};
      if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => {};
    },
    set: () => true,
  });
  const boot = (initial) => {
    const registry = new Map();
    const makeEl = (tag) => {
      const el = {
        tagName: String(tag || 'div').toUpperCase(),
        children: [], listeners: {}, style: {}, _qs: {},
        value: '', checked: false, title: '', src: '', href: '', download: '',
        type: '', min: '', max: '', step: '', className: '', htmlFor: '',
        width: 640, height: 600, _text: '', _html: '',
        addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
        appendChild(c) { this.children.push(c); return c; },
        querySelector(sel) { return this._qs[sel] ||= makeEl('div'); },
        getContext() { return makeCtx(); },
        toDataURL() { return 'data:image/jpeg;base64,stub'; },
        toBlob(cb) { cb(null); },
        click() {},
      };
      Object.defineProperty(el, 'id', {
        get() { return this._id || ''; },
        set(v) { this._id = v; registry.set(v, this); },
      });
      Object.defineProperty(el, 'textContent', {
        get() { return this._text; },
        set(v) { this._text = String(v); },
      });
      Object.defineProperty(el, 'innerHTML', {
        get() { return this._html; },
        set(v) { this._html = String(v); if (v === '') this.children.length = 0; },
      });
      return el;
    };
    const store = new Map(Object.entries(initial || {}));
    const sb = {
      console,
      document: {
        getElementById: id => registry.get(id) || (() => { const e = makeEl('div'); e.id = id; return e; })(),
        createElement: tag => makeEl(tag),
      },
      localStorage: {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: k => store.delete(k),
      },
      performance: { now: () => 0 },
      requestAnimationFrame: cb => { bootRaf.cb = cb; return 1; },
      setTimeout: () => 0,
      prompt: () => 'テスト',
      navigator: {},
    };
    const bootRaf = { cb: null };
    // index.html に静的に存在する要素を先に実体化する（実ブラウザでは常時存在するため）
    for (const id of ['stage', 'err', 'sliders', 'sel-anim', 'sel-bgfit', 'chk-flip',
      'btn-random', 'bg-file', 'model-file', 'btn-model-reset', 'btn-bg-reset',
      'btn-png', 'btn-rec', 'btn-share', 'btn-fav', 'btn-fav-exp', 'fav-file', 'fav-bar'])
      sb.document.getElementById(id);
    vm.createContext(sb);
    vm.runInContext(src, sb);
    return { registry, store, raf: bootRaf };
  };

  // 新規プロファイル（保存データなし）: エラーを出さず起動し、1フレーム描画できる
  {
    const { registry, raf } = boot();
    ok(registry.get('err').textContent === '', 'fresh boot shows no favorites error');
    ok(registry.get('fav-bar').children.length === 0, 'fresh boot renders empty fav bar');
    let frameOk = true;
    try { raf.cb(); } catch { frameOk = false; }
    ok(frameOk, 'first frame renders');
  }

  // 保存済みお気に入りがある場合: 読み込めてエラーなしで表示される
  {
    const saved = JSON.stringify([{ id: 'f1', name: '保存済み', params: L.defaultParams(), thumb: '' }]);
    const { registry } = boot({ 'shiro.favs.v1': saved });
    ok(registry.get('err').textContent === '', 'saved favs boot shows no error');
    ok(registry.get('fav-bar').children.length === 1, 'saved favs are rendered');
  }

  // 本当に壊れたデータ: エラー表示は残る（握りつぶして直したことにしない）
  {
    const { registry } = boot({ 'shiro.favs.v1': '{{{broken' });
    ok(registry.get('err').textContent.includes('読み込めませんでした'), 'corrupt favs still surface an error');
  }

  // 保存→再起動の往復: 保存したお気に入りが次の起動で読み込める
  {
    const first = boot();
    first.registry.get('btn-fav').listeners.click[0]();
    ok(first.store.has('shiro.favs.v1'), 'favorite is persisted on save');
    const second = boot(Object.fromEntries(first.store));
    ok(second.registry.get('err').textContent === '', 'reboot after save shows no error');
    ok(second.registry.get('fav-bar').children.length === 1, 'saved favorite survives reboot');
  }
}

// shader backgrounds (AQUA 由来の純粋ロジック)
{
  ok(Array.isArray(L.SHADER_PRESETS) && L.SHADER_PRESETS.length >= 4, 'shader presets exist');
  ok(L.SHADER_PALETTES.length === 6 && L.SHADER_PALETTES.every(c => c.length === 3), 'palettes are rgb triples');
  for (const p of L.SHADER_PRESETS) {
    ok(typeof p.id === 'string' && typeof p.code === 'string' && p.code.includes('void main()'), `preset ${p.id} has main`);
    const defs = L.parseShaderParams(p.code);
    ok(defs.length >= 1 && defs.length <= 8, `preset ${p.id} params in 1..8`);
    for (const d of defs) ok(d.min < d.max && d.def >= d.min && d.def <= d.max, `preset ${p.id} param ${d.name} sane`);
  }
  ok(L.parseShaderParams('void main(){}').length === 0, 'no annotations -> no params');
  const many = Array.from({ length: 12 }, (_, i) => `// @param p${i} [0, 1, 0.5]`).join('\n');
  ok(L.parseShaderParams(many).length === 8, 'params capped at 8');

  const w1 = L.wrapShaderSource('uniform float iTime;\nvoid main(){ gl_FragColor = vec4(1.); }', false);
  ok((w1.src.match(/uniform float iTime;/g) || []).length === 1, 'user redeclaration stripped, header supplies it once');
  ok(w1.src.includes('uniform float u_p[8];'), 'header supplies u_p');
  const w2 = L.wrapShaderSource('void mainImage(out vec4 c, in vec2 fc){ c = vec4(1.); }', false);
  ok(w2.src.includes('void main()') && w2.src.includes('mainImage(_c, gl_FragCoord.xy)'), 'mainImage wrapped');
  const w3 = L.wrapShaderSource('void main(){ gl_FragColor = vec4(1.); }', true);
  ok(w3.src.startsWith('#version 300 es'), 'GL2 header starts with version');
  ok(w3.src.includes('#define gl_FragColor _outColor'), 'GL2 maps gl_FragColor');
  ok(w3.headerLines > 10, 'header line count tracked');
}

console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
