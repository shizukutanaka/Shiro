// node test.mjs — ShiroLib 純粋ロジック＋UI 起動の検証ゲート
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

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

// share link round-trip
{
  const p = L.randomParams(L.mulberry32(11));
  const shader = { id: 'aurora', paletteIdx: 3, params: [2.5, 1.1, 0.7], playing: false, speed: 2 };
  const frag = L.encodeShareLink(p, shader);
  ok(frag.startsWith('s='), 'share fragment prefix');
  ok(/^[A-Za-z0-9_-]+$/.test(frag.slice(2)), 'share fragment is base64url');
  ok(frag.length <= L.SHARE_FRAGMENT_MAX_LENGTH, 'share fragment within limit');
  const back = L.decodeShareLink('#' + frag);
  ok(JSON.stringify(back.params) === JSON.stringify(L.clampParams(p)), 'share params round-trip');
  ok(back.shader.id === 'aurora' && back.shader.paletteIdx === 3 && back.shader.playing === false && back.shader.speed === 2, 'share shader round-trip');
  ok(JSON.stringify(back.shader.params) === JSON.stringify([2.5, 1.1, 0.7]), 'share shader params round-trip');
  ok(L.decodeShareLink('https://example.test/index.html#' + frag).shader.id === 'aurora', 'share decode accepts full URL');
  const plain = L.decodeShareLink('#' + L.encodeShareLink(L.defaultParams(), null));
  ok(plain.shader.id === '' && plain.shader.speed === 1 && plain.shader.playing === true, 'share without shader gives defaults');
  ok(L.decodeShareLink('') === null && L.decodeShareLink('#section') === null && L.decodeShareLink(null) === null, 'non-share hash ignored');
  throws(() => L.decodeShareLink('#s=!!!'), 'share bad charset rejected');
  throws(() => L.decodeShareLink('#s=' + Buffer.from('{"v":2,"name":"","params":{}}').toString('base64url')), 'share bad version rejected');
  throws(() => L.decodeShareLink('#s=' + frag.slice(2, 10)), 'share truncated payload rejected');
  throws(() => L.decodeShareLink('#s=' + 'A'.repeat(L.SHARE_FRAGMENT_MAX_LENGTH)), 'share oversize fragment rejected');
  // リンクは他者からの入力: 許可リスト外と範囲外は decode 側で落とす/収める
  const rawJson = JSON.stringify({ v: 1, name: '', params: p, shader: { id: 'aqua-flow', paletteIdx: 99, params: [999, -5, 'x'], speed: 99, playing: 'yes' } });
  const dec = L.decodeShareLink('#s=' + Buffer.from(rawJson, 'utf8').toString('base64url'));
  ok(dec.shader.paletteIdx === 0 && dec.shader.speed === 3 && dec.shader.playing === true, 'share crafted shader scalars clamped');
  ok(dec.shader.params[0] === 3.0 && dec.shader.params[1] === 1.0, 'share crafted shader params clamped to preset range');
  ok(dec.shader.params[2] === 0.55, 'share non-numeric shader param falls back to default');
  const decBogus = L.decodeShareLink('#s=' + Buffer.from(JSON.stringify({ v: 1, name: '', params: p, shader: { id: 'bogus' } }), 'utf8').toString('base64url'));
  ok(decBogus.shader.id === '', 'share unknown shader id dropped');
  const jp = '#s=' + Buffer.from(JSON.stringify({ v: 1, name: 'テスト作品', params: p }), 'utf8').toString('base64url');
  ok(L.decodeShareLink(jp).name === 'テスト作品', 'share utf-8 payload decodes');
}

// 作品PNG: PNG の tEXt に作品状態を埋め、そこから復元する
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const pngChunkList = buf => {
  const out = []; let i = 8;
  while (i < buf.length) {
    const len = buf.readUInt32BE(i), type = buf.toString('latin1', i + 4, i + 8);
    out.push({ type, data: buf.subarray(i + 8, i + 8 + len), crc: buf.readUInt32BE(i + 8 + len), raw: buf.subarray(i + 4, i + 8 + len) });
    i += 12 + len;
  }
  return out;
};
{
  ok(L.crc32(Buffer.from('123456789')) === 0xCBF43926, 'crc32 check value');
  const p = { ...L.randomParams(L.mulberry32(5)), anim: 'walk' };
  const shader = { id: 'crystal', paletteIdx: 4, params: [1], playing: true, speed: 0.5 };
  const out = Buffer.from(L.embedWorkInPng(new Uint8Array(PNG_1X1), p, shader));
  const chunks = pngChunkList(out);
  ok(out.subarray(0, 8).equals(PNG_1X1.subarray(0, 8)), 'work png keeps the signature');
  ok(chunks.map(c => c.type).join(',') === 'IHDR,IDAT,tEXt,IEND', 'work chunk inserted just before IEND');
  ok(chunks.every(c => c.crc === L.crc32(c.raw)), 'every chunk crc is valid');
  if (zlib.crc32) ok(chunks.every(c => c.crc === zlib.crc32(c.raw)), 'chunk crc matches zlib');
  const t = chunks[2].data.toString('latin1');
  ok(t.startsWith('shiro\0s='), 'tEXt keyword is shiro and payload is the share fragment');
  ok(zlib.inflateSync(chunks[1].data).length === 5, 'image data untouched');
  const back = L.extractWorkFromPng(new Uint8Array(out));
  ok(JSON.stringify(back.params) === JSON.stringify(L.clampParams(p)), 'work png params round-trip');
  ok(back.shader.id === 'crystal' && back.shader.paletteIdx === 4 && back.shader.speed === 0.5, 'work png shader round-trip');
  ok(L.extractWorkFromPng(new Uint8Array(PNG_1X1)) === null, 'plain png has no work');
  ok(L.extractWorkFromPng(new Uint8Array(Buffer.from('GIF89a not a png'))) === null, 'non-png has no work');
  ok(L.extractWorkFromPng(new Uint8Array(0)) === null, 'empty file has no work');
  throws(() => L.extractWorkFromPng(new Uint8Array(out.subarray(0, out.length - 20))), 'truncated work png rejected');
  throws(() => L.embedWorkInPng(new Uint8Array(Buffer.from('nope')), p, shader), 'embedding into non-png rejected');
  const bad = Buffer.from(out); const at = bad.indexOf('shiro\0s=', 0, 'latin1') + 8; bad[at] = 0x21;
  throws(() => L.extractWorkFromPng(new Uint8Array(bad)), 'corrupt work payload rejected');
  const crafted = Buffer.from(L.embedWorkInPng(new Uint8Array(PNG_1X1), { ...p, height: 9 }, { id: 'bogus' }));
  const dec = L.extractWorkFromPng(new Uint8Array(crafted));
  ok(dec.params.height === 1 && dec.shader.id === '', 'work png payload clamped like share links');
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
  const boot = (initial, opts = {}) => {
    const registry = new Map();
    const makeEl = (tag) => {
      const el = {
        tagName: String(tag || 'div').toUpperCase(),
        children: [], listeners: {}, style: {}, _qs: {},
        classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
        value: '', checked: false, title: '', src: '', href: '', download: '',
        type: '', min: '', max: '', step: '', className: '', htmlFor: '',
        width: 640, height: 600, _text: '', _html: '',
        addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
        appendChild(c) { this.children.push(c); return c; },
        querySelector(sel) { return this._qs[sel] ||= makeEl('div'); },
        getContext() { return makeCtx(); },
        toDataURL() { return 'data:image/jpeg;base64,stub'; },
        toBlob(cb) { cb(null); },
        click() {}, focus() {}, select() {},
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
      navigator: opts.navigator !== undefined ? opts.navigator : {},
      location: { hash: opts.hash || '', protocol: opts.protocol || '', href: 'https://example.test/index.html' + (opts.hash || '') },
      history: { replaceState: () => {} },
    };
    const bootRaf = { cb: null };
    // index.html に静的に存在する要素を先に実体化する（実ブラウザでは常時存在するため）
    for (const id of ['stage', 'err', 'sliders', 'sel-anim', 'sel-bgfit', 'chk-flip',
      'btn-random', 'bg-file', 'model-file', 'btn-model-reset', 'btn-bg-reset',
      'btn-png', 'btn-rec', 'btn-share', 'btn-fav', 'btn-fav-exp', 'fav-file', 'fav-bar',
      'btn-share-link', 'share-link-box', 'share-url', 'btn-copy-link', 'share-msg',
      'shared-banner', 'btn-edit-shared',
      'sel-shader', 'shader-ui', 'shader-params', 'shader-palettes', 'shader-speed', 'out-shader-speed', 'btn-shader-play'])
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
    first.registry.get('fav-name').value = 'テスト';
    first.registry.get('fav-form').listeners.submit[0]({ preventDefault() {} });
    await new Promise(r => setTimeout(r, 0));
    ok(first.store.has('shiro.favs.v1') && JSON.parse(first.store.get('shiro.favs.v1'))[0].name === 'テスト', 'favorite is persisted on save');
    const second = boot(Object.fromEntries(first.store));
    ok(second.registry.get('err').textContent === '', 'reboot after save shows no error');
    ok(second.registry.get('fav-bar').children.length === 1, 'saved favorite survives reboot');
  }

  // 共有リンクで開く: パラメーターとシェーダーが復元され、受け手への案内が出る。
  // なお err には共有リンク由来の文言が出ないことだけを見る: スタブの WebGL は
  // シェーダーのコンパイル可否を再現できないため、実機では出ない文言が残り得る。
  {
    const p = { ...L.defaultParams(), height: 0.11, anim: 'dance' };
    const hash = '#' + L.encodeShareLink(p, { id: 'ripple', paletteIdx: 2, params: [20, 2, 3], speed: 1.5 });
    const { registry } = boot({}, { hash });
    ok(!registry.get('err').textContent.includes('共有リンク'), 'share boot has no share-link error');
    ok(Math.abs(+registry.get('sl-height').value - 0.11) < 1e-9, 'share boot restores slider');
    ok(registry.get('sel-anim').value === 'dance', 'share boot restores anim');
    ok(registry.get('sel-shader').value === 'ripple', 'share boot restores shader selection');
    ok(registry.get('shared-banner').style.display === '', 'share boot shows recipient banner');
  }

  // 壊れた共有リンク: エラーは出すが、通常起動して描画できる
  {
    const { registry, raf } = boot({}, { hash: '#s=!!!broken' });
    ok(registry.get('err').textContent.includes('共有リンクを読み込めませんでした'), 'corrupt share link surfaces an error');
    ok(registry.get('shared-banner').style.display !== '', 'corrupt share link shows no banner');
    let frameOk = true;
    try { raf.cb(); } catch { frameOk = false; }
    ok(frameOk, 'corrupt share link still boots and renders');
  }

  // 共有リンク生成: 現在の状態を往復できる URL がその場で手に入る
  {
    const { registry } = boot();
    registry.get('btn-share-link').listeners.click[0]();
    const url = registry.get('share-url').value;
    ok(url.includes('#s='), 'share link generated into the box');
    const back = L.decodeShareLink(url);
    ok(back && JSON.stringify(back.params) === JSON.stringify(L.clampParams(L.defaultParams())), 'generated link restores current params');
    ok(registry.get('share-link-box').style.display === '', 'share link box revealed');
  }

  // 作品PNGを開く: PNG に埋めた状態がスライダー・シェーダー選択へ戻る。情報のない PNG は案内を出す
  {
    const { registry } = boot();
    const p = { ...L.defaultParams(), height: 0.23, anim: 'wave' };
    const png = L.embedWorkInPng(new Uint8Array(PNG_1X1), p, { id: 'aurora', paletteIdx: 1, params: [], speed: 1 });
    const open = async bytes => {
      const e = { target: { files: [{ arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }], value: 'x' } };
      registry.get('work-file').listeners.change[0](e);
      await new Promise(r => setTimeout(r, 0));
      return e;
    };
    const e = await open(png);
    ok(Math.abs(+registry.get('sl-height').value - 0.23) < 1e-9, 'work png restores slider');
    ok(registry.get('sel-anim').value === 'wave', 'work png restores anim');
    ok(registry.get('sel-shader').value === 'aurora', 'work png restores shader selection');
    ok(e.target.value === '', 'work file input is reset');
    await open(new Uint8Array(PNG_1X1));
    ok(registry.get('err').textContent.includes('作品情報が入っていません'), 'plain png explains it has no work');
    ok(Math.abs(+registry.get('sl-height').value - 0.23) < 1e-9, 'plain png leaves the current work alone');
  }

  // PWA: https 配信時の起動では Service Worker が登録され、file:// では登録されない
  {
    const registered = [];
    const nav = { serviceWorker: { register: url => { registered.push(url); return Promise.resolve(); } } };
    const { registry } = boot({}, { navigator: nav, protocol: 'https:' });
    ok(registered.length === 1 && registered[0] === 'sw.js', 'https boot registers sw.js once');
    ok(registry.get('err').textContent === '', 'https boot shows no error');
  }
  {
    const registered = [];
    const nav = { serviceWorker: { register: url => { registered.push(url); return Promise.resolve(); } } };
    boot({}, { navigator: nav, protocol: 'file:' });
    ok(registered.length === 0, 'file boot does not register a service worker');
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

// ---------- PWA: manifest ----------
{
  const manifest = JSON.parse(readFileSync(new URL('./manifest.webmanifest', import.meta.url), 'utf8'));
  ok(typeof manifest.name === 'string' && manifest.name.includes('Shiro') && manifest.short_name === 'Shiro', 'manifest names');
  ok(manifest.display === 'standalone', 'manifest display standalone');
  ok(manifest.start_url === './index.html' && manifest.scope === './', 'manifest start_url and scope are relative');
  ok(manifest.theme_color === '#14151a' && manifest.background_color === '#14151a', 'manifest colors match the app background');
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  ok(html.includes('<link rel="manifest" href="manifest.webmanifest">'), 'index.html links the manifest');
  ok(html.includes('<meta name="theme-color" content="#14151a">'), 'index.html theme-color matches the manifest');
  ok(html.includes('rel="apple-touch-icon"'), 'index.html has an apple-touch-icon');
  const byKey = new Map();
  for (const icon of manifest.icons) for (const s of icon.sizes.split(' ')) byKey.set(`${s}|${icon.purpose || 'any'}`, icon);
  ok(byKey.has('192x192|any') && byKey.has('512x512|any'), 'manifest declares 192 and 512 icons');
  ok(byKey.has('512x512|maskable'), 'manifest declares a maskable icon');
  for (const icon of manifest.icons) {
    const buf = readFileSync(new URL('./' + icon.src, import.meta.url));
    ok(buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), `icon ${icon.src} is a PNG`);
    ok(icon.sizes.split(' ').includes(`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`), `icon ${icon.src} dimensions match the manifest`);
    ok(icon.type === 'image/png', `icon ${icon.src} type is image/png`);
  }
}

// ---------- PWA: 登録ポリシー（http(s) のみ・失敗は本体を妨げない） ----------
{
  const calls = [];
  const navOk = { serviceWorker: { register: u => { calls.push(u); return Promise.resolve(); } } };
  ok(L.registerServiceWorker(navOk, { protocol: 'https:' }) === true && calls[0] === 'sw.js', 'sw registered over https');
  ok(L.registerServiceWorker(navOk, { protocol: 'http:' }) === true, 'sw registered over http');
  ok(L.registerServiceWorker(navOk, { protocol: 'file:' }) === false && calls.length === 2, 'sw not registered on file:');
  ok(L.registerServiceWorker({}, { protocol: 'https:' }) === false, 'sw unsupported browser -> false');
  ok(L.registerServiceWorker(null, null) === false, 'sw missing env -> false');
  ok(L.registerServiceWorker({ serviceWorker: { register: () => { throw new Error('x'); } } }, { protocol: 'https:' }) === false, 'sw register throw is swallowed');
  ok(L.registerServiceWorker({ serviceWorker: { register: () => Promise.reject(new Error('x')) } }, { protocol: 'https:' }) === true, 'sw register rejection is swallowed');
}

// ---------- PWA: Service Worker の振る舞い（vm + フェイク CacheStorage） ----------
{
  const ORIGIN = 'https://example.test';
  const makeRes = body => ({ status: 200, body, clone() { return makeRes(body); } });
  class FakeCache {
    constructor() { this.map = new Map(); }
    async addAll(urls) { for (const u of urls) this.map.set(new URL(u, ORIGIN + '/').href, makeRes('shell:' + u)); }
    async put(req, res) { this.map.set(typeof req === 'string' ? new URL(req, ORIGIN + '/').href : req.url, res); }
    async match(req, opts = {}) {
      const key = typeof req === 'string' ? new URL(req, ORIGIN + '/').href : req.url;
      if (this.map.has(key)) return this.map.get(key);
      if (opts.ignoreSearch) {
        const bare = key.split('?')[0];
        for (const [k, v] of this.map) if (k.split('?')[0] === bare) return v;
      }
      return undefined;
    }
  }
  class FakeCacheStorage {
    constructor() { this.byName = new Map(); }
    async open(name) { if (!this.byName.has(name)) this.byName.set(name, new FakeCache()); return this.byName.get(name); }
    async keys() { return [...this.byName.keys()]; }
    async delete(name) { return this.byName.delete(name); }
  }
  const loadSW = (storage, fetchImpl, versionOverride) => {
    let code = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
    if (versionOverride) code = code.replace(/const SW_VERSION = '[^']+'/, `const SW_VERSION = '${versionOverride}'`);
    const listeners = {};
    const calls = { skipWaiting: 0, claim: 0 };
    const sb = {
      console, URL, module: { exports: {} },
      self: {
        addEventListener: (type, fn) => { listeners[type] = fn; },
        location: { origin: ORIGIN },
        skipWaiting: () => { calls.skipWaiting++; return Promise.resolve(); },
        clients: { claim: () => { calls.claim++; return Promise.resolve(); } },
      },
      caches: storage, fetch: fetchImpl,
    };
    vm.createContext(sb);
    vm.runInContext(code, sb);
    return { listeners, calls, api: sb.module.exports };
  };
  const fireLifecycle = async (sw, type) => {
    let p;
    sw.listeners[type]({ waitUntil: q => { p = q; } });
    await p;
  };
  const fireFetch = async (sw, request) => {
    let p, responded = false;
    sw.listeners.fetch({ request, respondWith: q => { responded = true; p = q; } });
    return responded ? p : undefined;
  };
  const online = async req => makeRes('net:' + req.url);
  const offline = async () => { throw new Error('offline'); };

  const storage = new FakeCacheStorage();
  await storage.open('shiro-shell-0.0.0+0'); // 前版の残骸
  const sw = loadSW(storage, online);
  ok(sw.api.APP_SHELL.includes('./index.html') && sw.api.APP_SHELL.includes('./app.js')
    && sw.api.APP_SHELL.includes('./manifest.webmanifest'), 'app shell covers page, script and manifest');
  ok(sw.api.APP_SHELL.filter(u => u.includes('icon')).length === 3, 'app shell covers the icons');
  ok(sw.api.CACHE_NAME === 'shiro-shell-' + sw.api.SW_VERSION, 'cache name carries the version');

  await fireLifecycle(sw, 'install');
  const shellCache = await storage.open(sw.api.CACHE_NAME);
  ok(shellCache.map.size === sw.api.APP_SHELL.length, 'install precaches the whole shell');
  ok(sw.calls.skipWaiting === 1, 'install skips waiting');

  await fireLifecycle(sw, 'activate');
  ok(!(await storage.keys()).includes('shiro-shell-0.0.0+0'), 'activate deletes the old-version cache');
  ok((await storage.keys()).includes(sw.api.CACHE_NAME), 'activate keeps the current cache');
  ok(sw.calls.claim === 1, 'activate claims clients');

  // 在線時: ネットワーク優先で返し、キャッシュも新しい内容に差し替わる（固着しない）
  const res1 = await fireFetch(sw, { method: 'GET', url: ORIGIN + '/app.js', mode: 'cors' });
  ok(res1 && res1.body === 'net:' + ORIGIN + '/app.js', 'online fetch returns the network response');
  const cached = await shellCache.match({ url: ORIGIN + '/app.js' });
  ok(cached && cached.body === 'net:' + ORIGIN + '/app.js', 'online fetch refreshes the cache');

  // オフライン時: 直近のキャッシュで起動できる
  const swOff = loadSW(storage, offline);
  const res2 = await fireFetch(swOff, { method: 'GET', url: ORIGIN + '/app.js', mode: 'cors' });
  ok(res2 && res2.body === 'net:' + ORIGIN + '/app.js', 'offline fetch falls back to the cache');
  const res3 = await fireFetch(swOff, { method: 'GET', url: ORIGIN + '/opened/from/a/share/link', mode: 'navigate' });
  ok(res3 && res3.body === 'shell:./index.html', 'offline navigation falls back to index.html');

  // 扱わないリクエストは素通し（respondWith しない）
  ok(await fireFetch(sw, { method: 'GET', url: 'https://other.example/x.js', mode: 'cors' }) === undefined, 'cross-origin fetch is left alone');
  ok(await fireFetch(sw, { method: 'POST', url: ORIGIN + '/app.js', mode: 'cors' }) === undefined, 'non-GET fetch is left alone');

  // 版上げ: 新しい SW が有効化されると旧キャッシュは消える
  const sw2 = loadSW(storage, online, '0.1.0+2');
  await fireLifecycle(sw2, 'install');
  await fireLifecycle(sw2, 'activate');
  const names = await storage.keys();
  ok(!names.includes(sw.api.CACHE_NAME) && names.includes(sw2.api.CACHE_NAME), 'version bump purges the previous shell cache');
}

console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
