'use strict';
/*
 * Shiro — 白モデルスワップ
 * 内蔵の白モデル(手続きマネキン)またはユーザー素材(画像/動画)を
 * 好きな背景画像に合成するキャラクタークリエイト風アプリ。
 * 依存ゼロ・ビルド不要。純粋ロジックは ShiroLib に集約し test.mjs から検証する。
 */
const ShiroLib = (() => {

  const clamp01 = v => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- RNG ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function strSeed(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ---------- params ----------
  const ANIMS = ['idle', 'wave', 'walk', 'dance', 'still'];
  const FITS = ['cover', 'contain'];
  const NUM_KEYS = ['height', 'headSize', 'shoulder', 'armLen', 'legLen', 'tone',
    'line', 'animSpeed', 'x', 'y', 'scale', 'opacity', 'keyThresh', 'keySoft'];

  const SLIDERS = [
    ['height', 'モデル身長'], ['headSize', '頭の大きさ'], ['shoulder', '肩幅'],
    ['armLen', '腕の長さ'], ['legLen', '脚の長さ'], ['tone', 'モデルトーン'],
    ['line', '輪郭の太さ'], ['animSpeed', '動きの速さ'], ['x', '位置 X'],
    ['y', '位置 Y'], ['scale', 'モデル倍率'], ['opacity', 'モデル不透明度'],
    ['keyThresh', '白抜き強度'], ['keySoft', '白抜きぼかし'],
  ];

  function defaultParams() {
    return {
      seed: 1, height: .5, headSize: .5, shoulder: .5, armLen: .5, legLen: .5,
      tone: .25, line: .4, anim: 'idle', animSpeed: .5, x: .5, y: .84,
      scale: .6, opacity: 1, flip: false, keyThresh: 0, keySoft: .3, bgFit: 'cover',
    };
  }

  function clampParams(p) {
    const d = defaultParams(), o = {};
    for (const k of NUM_KEYS) {
      const v = p ? Number(p[k]) : NaN;
      o[k] = clamp01(Number.isFinite(v) ? v : d[k]);
    }
    o.anim = ANIMS.includes(p && p.anim) ? p.anim : d.anim;
    o.bgFit = FITS.includes(p && p.bgFit) ? p.bgFit : d.bgFit;
    o.flip = !!(p && p.flip);
    const sv = p ? +p.seed : NaN;
    o.seed = (Number.isFinite(sv) ? Math.abs(Math.floor(sv)) : d.seed) >>> 0;
    return o;
  }

  function randomParams(rng) {
    const p = defaultParams();
    for (const k of NUM_KEYS) p[k] = rng();
    p.anim = ANIMS[Math.floor(rng() * ANIMS.length)];
    p.flip = rng() < .35;
    p.x = .3 + rng() * .4; p.y = .6 + rng() * .35;
    p.scale = .4 + rng() * .5; p.opacity = .6 + rng() * .4;
    p.keyThresh = rng() < .5 ? 0 : rng() * .6;
    p.seed = Math.floor(rng() * 4294967295);
    return clampParams(p);
  }

  // ---------- favorites ----------
  function serializePreset(name, params) {
    return JSON.stringify({ v: 1, name: String(name || '').slice(0, 60), params: clampParams(params) });
  }
  function parsePreset(json) {
    const o = JSON.parse(json);
    if (!o || o.v !== 1 || typeof o.name !== 'string' || typeof o.params !== 'object' || !o.params)
      throw new Error('invalid preset');
    return { name: o.name.slice(0, 60), params: clampParams(o.params) };
  }
  function parseFavList(json) {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) throw new Error('invalid favorite list');
    return arr.filter(o => o && typeof o.name === 'string' && o.params)
      .map(o => ({ id: String(o.id || ''), name: o.name.slice(0, 60), params: clampParams(o.params) }));
  }

  // ---------- share link ----------
  // 作品状態（パラメーター＋背景シェーダー）を URL フラグメント (#s=...) に埋める。
  // フラグメントはサーバへ送信されないため、状態は利用者の端末間だけで運ばれる。
  // 直列化は既存のプリセット形式 {v:1, name, params} をそのまま再利用し、
  // シェーダー状態だけを同じ JSON に相乗りさせる（新しい状態形式は作らない）。
  // 状態は数値と列挙値だけの固定サイズ（画像・動画素材は含まない）なので
  // 圧縮なしの base64url で十分短い。長さ上限を超える場合はリンクを作らない。
  const SHARE_FRAGMENT_MAX_LENGTH = 2000; // '#s=' を含むフラグメント全体の上限
  const SHARE_URL_MAX_LENGTH = 8000;      // 完成した URL 全体の上限（UI 側の防御）

  // シェーダー状態を共有リンク用に検証・正規化する。
  // リンクは他者から届く入力なので、localStorage の自己保存値より厳しく扱う:
  // id はプリセットの許可リスト、パラメーターは各プリセットの範囲内に収める。
  function clampShaderState(o) {
    const d = { id: '', paletteIdx: 0, params: [], playing: true, speed: 1 };
    if (!o || typeof o !== 'object') return d;
    const preset = SHADER_PRESETS.find(p => p.id === o.id);
    if (!preset) return d;
    d.id = preset.id;
    if (Number.isInteger(o.paletteIdx) && o.paletteIdx >= 0 && o.paletteIdx < SHADER_PALETTES.length)
      d.paletteIdx = o.paletteIdx;
    if (Array.isArray(o.params)) {
      const defs = parseShaderParams(preset.code);
      d.params = o.params.slice(0, defs.length).map((v, i) => {
        const n = +v;
        return Number.isFinite(n) ? Math.min(defs[i].max, Math.max(defs[i].min, n)) : defs[i].def;
      });
    }
    if (typeof o.playing === 'boolean') d.playing = o.playing;
    if (Number.isFinite(o.speed)) d.speed = Math.min(3, Math.max(0, o.speed));
    return d;
  }

  function buildShareJson(params, shader) {
    const base = JSON.parse(serializePreset('', params));
    base.shader = clampShaderState(shader);
    return JSON.stringify(base);
  }
  function parseShareJson(json) {
    const preset = parsePreset(json); // v / name / params の検証と clamp を既存形式に委ねる
    const raw = JSON.parse(json);
    return { name: preset.name, params: preset.params, shader: clampShaderState(raw.shader) };
  }

  // UTF-8 <-> バイト列と base64url の純粋実装（依存なし・Node でも検証可能にする）
  function utf8Bytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const cp = str.codePointAt(i);
      if (cp > 0xFFFF) i++;
      if (cp < 0x80) bytes.push(cp);
      else if (cp < 0x800) bytes.push(0xC0 | (cp >> 6), 0x80 | (cp & 63));
      else if (cp < 0x10000) bytes.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      else bytes.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }
    return bytes;
  }
  function utf8String(bytes) {
    let out = '', i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      let cp, len;
      if (b < 0x80) { cp = b; len = 1; }
      else if ((b & 0xE0) === 0xC0) { cp = b & 0x1F; len = 2; }
      else if ((b & 0xF0) === 0xE0) { cp = b & 0x0F; len = 3; }
      else if ((b & 0xF8) === 0xF0) { cp = b & 0x07; len = 4; }
      else throw new Error('invalid utf-8 in share payload');
      if (i + len > bytes.length) throw new Error('truncated utf-8 in share payload');
      for (let j = 1; j < len; j++) {
        const c = bytes[i + j];
        if ((c & 0xC0) !== 0x80) throw new Error('invalid utf-8 in share payload');
        cp = (cp << 6) | (c & 63);
      }
      if ((len === 2 && cp < 0x80) || (len === 3 && cp < 0x800) || (len === 4 && cp < 0x10000))
        throw new Error('overlong utf-8 in share payload');
      out += String.fromCodePoint(cp);
      i += len;
    }
    return out;
  }
  const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function bytesToB64Url(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63]
        + (i + 1 < bytes.length ? B64URL[(n >> 6) & 63] : '')
        + (i + 2 < bytes.length ? B64URL[n & 63] : '');
    }
    return out;
  }
  function b64UrlToBytes(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s) || s.length % 4 === 1) throw new Error('invalid share payload');
    const bytes = [];
    let acc = 0, bits = 0;
    for (const ch of s) {
      acc = (acc << 6) | B64URL.indexOf(ch); bits += 6;
      if (bits >= 8) { bits -= 8; bytes.push((acc >> bits) & 0xFF); }
    }
    return bytes;
  }

  // 作品状態からフラグメント文字列 's=...' を作る。上限超過時は例外（黙って切らない）。
  function encodeShareLink(params, shader) {
    const frag = 's=' + bytesToB64Url(utf8Bytes(buildShareJson(params, shader)));
    if (frag.length > SHARE_FRAGMENT_MAX_LENGTH) throw new RangeError('share link too long');
    return frag;
  }
  // フラグメント / ハッシュ / URL 全体を受け取り、共有でない場合は null、
  // 's=' で始まるのに壊れている場合は例外を返す。
  function decodeShareLink(input) {
    if (input == null) return null;
    let s = String(input);
    const h = s.indexOf('#');
    if (h >= 0) s = s.slice(h + 1);
    if (!s.startsWith('s=')) return null;
    if (s.length > SHARE_FRAGMENT_MAX_LENGTH) throw new Error('share link too long');
    return parseShareJson(utf8String(b64UrlToBytes(s.slice(2))));
  }

  // ---------- chroma key (white) ----------
  // thresh>0 のとき白に近い画素を透過。soft で境界をぼかす。
  function keyAlpha(r, g, b, thresh, soft) {
    if (thresh <= 0) return 255;
    const d = 255 - Math.min(r, g, b);
    const T = thresh * 200, S = 1 + soft * 120;
    return Math.round(Math.max(0, Math.min(255, (d - T) / S * 255)));
  }

  // ---------- recorder ----------
  // 通常動画形式を優先: MP4 → WebM の順に isTypeSupported で選ぶ。
  const MIME_CANDIDATES = [
    ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm', 'webm'],
  ];
  function pickMime(supports) {
    for (const [mime, ext] of MIME_CANDIDATES) if (supports(mime)) return { mime, ext };
    return null;
  }

  // ---------- mannequin ----------
  // 正面図の関節人形。y は足元=0・上向き正、全長 1.0 の正規化空間。
  function mannequinPose(p, t) {
    const s = .4 + p.animSpeed * 2.2, tt = t * s;
    const q = {
      bob: 0, sway: 0, lean: 0, headTilt: 0,
      lThigh: 0, rThigh: 0, lKnee: 0, rKnee: 0,
      lArm: .1, rArm: .1, lElb: .15, rElb: .15,
    };
    switch (p.anim) {
      case 'wave':
        q.bob = .012 * Math.sin(tt * 2); q.lean = .04 * Math.sin(tt);
        q.rArm = 2.5; q.rElb = .5 * Math.sin(tt * 6) + .3;
        q.lArm = .12; q.headTilt = .1 * Math.sin(tt * 2);
        break;
      case 'walk': {
        const w = Math.sin(tt * 3);
        q.lThigh = .55 * w; q.rThigh = -.55 * w;
        q.lKnee = Math.max(0, .7 * Math.sin(tt * 3 + Math.PI / 2));
        q.rKnee = Math.max(0, .7 * Math.sin(tt * 3 - Math.PI / 2));
        q.lArm = .1 - .4 * w; q.rArm = .1 + .4 * w;
        q.bob = .02 * Math.abs(Math.cos(tt * 3)); q.sway = .01 * w;
        break;
      }
      case 'dance': {
        const w = Math.sin(tt * 4);
        q.sway = .05 * w; q.bob = .03 * Math.abs(w);
        q.lArm = 1.2 + .9 * Math.sin(tt * 4); q.rArm = 1.2 - .9 * Math.sin(tt * 4);
        q.lElb = .5; q.rElb = .5; q.lean = .06 * w; q.headTilt = .15 * w;
        q.lThigh = .15 * w; q.rThigh = -.15 * w;
        break;
      }
      case 'still': break;
      default: // idle
        q.bob = .012 * Math.sin(tt * 2); q.lean = .02 * Math.sin(tt);
        q.lArm = .1 + .05 * Math.sin(tt * 1.3); q.rArm = .1 - .05 * Math.sin(tt * 1.3);
        q.headTilt = .06 * Math.sin(tt * .7);
    }
    return q;
  }

  function skeleton(p, q) {
    const legFrac = .40 + .13 * p.legLen;
    const headR = .055 + .05 * p.headSize;
    const neck = .03;
    const torsoTop = legFrac + Math.max(.12, 1 - legFrac - 2 * headR - neck);
    const shY = torsoTop - .04;
    const shHalf = .09 + .11 * p.shoulder;
    const armLen = .30 + .16 * p.armLen;
    const hipHalf = shHalf * .55;
    const K = {}; // model-space points (y up, feet y=0)

    // legs: hip -> knee -> ankle
    const legL = legFrac / 2;
    for (const [side, hipX, thA, knA] of [['l', -hipHalf, q.lThigh, q.lKnee], ['r', hipHalf, q.rThigh, q.rKnee]]) {
      const hx = hipX, hy = legFrac;
      const kx = hx + Math.sin(thA) * legL, ky = hy - Math.cos(thA) * legL;
      const shA = thA - knA;
      const ax = kx + Math.sin(shA) * legL, ay = ky - Math.cos(shA) * legL;
      K[side + 'Hip'] = [hx, hy]; K[side + 'Knee'] = [kx, ky]; K[side + 'Ank'] = [ax, Math.max(.015, ay)];
    }
    // arms: shoulder -> elbow -> wrist (angle 0 = down)
    const up = armLen / 2;
    for (const [side, sgn, aA, eA] of [['l', -1, q.lArm, q.lElb], ['r', 1, q.rArm, q.rElb]]) {
      const sx = sgn * shHalf, sy = shY;
      const ex = sx + sgn * Math.sin(aA) * up, ey = sy - Math.cos(aA) * up;
      const fa = aA - eA * sgn;
      const wx = ex + sgn * Math.sin(fa) * up, wy = ey - Math.cos(fa) * up;
      K[side + 'Sh'] = [sx, sy]; K[side + 'Elb'] = [ex, ey]; K[side + 'Wri'] = [wx, wy];
    }
    K.neckB = [0, torsoTop - .01];
    K.neckT = [0, torsoTop + neck * .6];
    K.headC = [Math.sin(q.headTilt) * headR, torsoTop + neck + headR];
    K.pelvis = [0, legFrac + .02];
    K.torsoTop = [0, torsoTop];
    K.headR = headR; K.shHalf = shHalf; K.hipHalf = hipHalf;
    return K;
  }

  function capsule(ctx, x1, y1, x2, y2, w, col, line) {
    ctx.lineCap = 'round';
    if (line > 0) {
      ctx.strokeStyle = 'rgba(40,44,54,0.85)'; ctx.lineWidth = w + line;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // ctx に (cx, baseY) を足元・高さ hPix で描画。q は mannequinPose の結果。
  function drawMannequin(ctx, p, t, cx, baseY, hPix) {
    const q = mannequinPose(p, t);
    const K = skeleton(p, q);
    const g = 1 - p.tone * .55; // tone: 0=白, 1=グレー
    const col = `rgb(${Math.round(255 * g)},${Math.round(255 * g)},${Math.round(255 * g + 8 * (1 - g))})`;
    const shade = `rgb(${Math.round(222 * g)},${Math.round(224 * g)},${Math.round(232 * g)})`;
    const lw = (0.5 + p.line * 4);
    const px = (x, y) => [cx + (x + q.sway) * hPix, baseY - (y + q.bob) * hPix];
    const limbW = hPix * (.045 + .02 * p.shoulder);
    const bodyW = hPix * (.10 + .06 * p.shoulder);

    ctx.save();
    ctx.globalAlpha = p.opacity;
    if (p.flip) { ctx.translate(2 * cx, 0); ctx.scale(-1, 1); }

    // legs
    for (const s of ['l', 'r']) {
      const [h, k, a] = [K[s + 'Hip'], K[s + 'Knee'], K[s + 'Ank']];
      capsule(ctx, ...px(...h), ...px(...k), limbW, shade, lw);
      capsule(ctx, ...px(...k), ...px(...a), limbW * .85, col, lw);
      const [ax, ay] = px(...a);
      capsule(ctx, ax, ay, ax + limbW * .8, ay, limbW * .5, shade, lw); // foot
    }
    // torso
    capsule(ctx, ...px(...K.pelvis), ...px(...K.torsoTop), bodyW, col, lw);
    // arms
    for (const s of ['l', 'r']) {
      const [sh, el, wr] = [K[s + 'Sh'], K[s + 'Elb'], K[s + 'Wri']];
      capsule(ctx, ...px(...sh), ...px(...el), limbW * .8, col, lw);
      capsule(ctx, ...px(...el), ...px(...wr), limbW * .7, shade, lw);
      const [wx, wy] = px(...wr);
      ctx.fillStyle = shade;
      ctx.beginPath(); ctx.arc(wx, wy, limbW * .55, 0, 7); ctx.fill(); // hand
    }
    // neck + head
    capsule(ctx, ...px(...K.neckB), ...px(...K.neckT), limbW * .7, col, lw);
    const [hx, hy] = px(...K.headC), hr = K.headR * hPix;
    ctx.fillStyle = col;
    if (lw > 0) { ctx.strokeStyle = 'rgba(40,44,54,0.85)'; ctx.lineWidth = lw; }
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); ctx.fill();
    if (lw > 0) ctx.stroke();
    // eyes (素朴な2点)
    ctx.fillStyle = 'rgba(60,64,74,0.8)';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(hx + s * hr * .38, hy - hr * .08, Math.max(1, hr * .09), 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- shader backgrounds (from AQUA Shader Studio) ----------
  // フルスクリーンシェーダーを背景に使うための資産と純粋ロジック。
  // シェーダーは Shadertoy 互換の約束で書かれている:
  //   uniform は iTime / iResolution / iMouse / u_color / u_p[8] が自動供給され、
  //   `// @param name [min, max, default]` 注釈が調整スライダーになる。
  const SHADER_PALETTES = [
    [.39, .82, 1.00], // aqua
    [.75, .35, .95], // purple-pink
    [.19, .82, .35], // green-mint
    [1.00, .62, .04], // orange-red
    [1.00, .84, .04], // yellow-green
    [1.00, 1.00, 1.00], // mono
  ];

  const SHADER_PRESETS = [
    {
      id: 'aqua-flow', name: 'Aqua Flow',
      code: `// AQUA — Liquid Flow
// @param flow [0.3, 3.0, 1.2]
// @param detail [1.0, 8.0, 4.0]
// @param hue [0.4, 0.7, 0.55]

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;
  for(int i=0;i<6;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5*iResolution.xy) / min(iResolution.x,iResolution.y);
  float t = iTime * u_p[0];
  vec2 q = uv * u_p[1];
  float n = fbm(q + vec2(t*.15, -t*.1));
  float m = fbm(q*1.7 + n*2.0 + vec2(-t*.2, t*.12));
  vec3 base = u_color;
  vec3 hi = mix(base, vec3(1.), .6);
  vec3 col = mix(base*.15, hi, smoothstep(.35,.85,m));
  col += pow(smoothstep(.6,1.,m), 4.) * vec3(.4,.7,1.) * .6;
  col *= 1.0 - .35*length(uv);
  gl_FragColor = vec4(col, 1.);
}`,
    },
    {
      id: 'aurora', name: 'Aurora',
      code: `// Northern Lights
// @param bands [1.0, 6.0, 3.0]
// @param speed [0.2, 2.0, 0.6]
// @param soft [0.1, 1.0, 0.4]

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}

void main(){
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec3 col = vec3(0.);
  for(float i=0.; i<u_p[0]; i++){
    float y = uv.y + .15*i + noise(vec2(uv.x*2.+i, iTime*u_p[1]))*.3;
    float a = smoothstep(.5, .5+u_p[2], 1.0 - abs(y - .5 - .1*sin(uv.x*3.+iTime)));
    col += u_color * a * (1.0 - i/u_p[0]) * .7;
  }
  col += vec3(.02,.02,.08);
  gl_FragColor = vec4(col, 1.);
}`,
    },
    {
      id: 'plasma', name: 'Chromatic Plasma',
      code: `// Chromatic Plasma
// @param scale [1.0, 10.0, 4.0]
// @param warp [0.0, 3.0, 1.2]
// @param chroma [0.0, 0.1, 0.03]

vec3 pal(float t){return .5 + .5*cos(6.283*(vec3(.0,.33,.67)+t));}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5*iResolution.xy) / min(iResolution.x,iResolution.y);
  uv *= u_p[0];
  float t = iTime*.3;
  for(int i=0;i<4;i++){
    float fi = float(i)+1.0;
    uv += u_p[1]*vec2(sin(uv.y*fi+t), cos(uv.x*fi+t))/fi;
  }
  vec3 c = pal(length(uv)*.2 + t*.1) * u_color * 2.0;
  c.r *= 1. + u_p[2]*sin(iTime*2.);
  c.b *= 1. - u_p[2]*sin(iTime*2.);
  gl_FragColor = vec4(c, 1.);
}`,
    },
    {
      id: 'ripple', name: 'Ripple',
      code: `// Concentric Ripples (move the pointer to move the source)
// @param freq [5.0, 40.0, 18.0]
// @param speed [0.5, 4.0, 1.5]
// @param sharp [0.5, 6.0, 2.0]

void main(){
  vec2 uv = (gl_FragCoord.xy - .5*iResolution.xy) / min(iResolution.x,iResolution.y);
  vec2 mc = (abs(iMouse.xy) / iResolution.xy - .5) * 2.0;
  float d = length(uv - mc);
  float w = sin(d*u_p[0] - iTime*u_p[1]);
  w = pow(abs(w), u_p[2]) * sign(w);
  vec3 c = u_color * (.5 + .5*w) + vec3(.02,.1,.2);
  c *= exp(-d*.8);
  gl_FragColor = vec4(c, 1.);
}`,
    },
    {
      id: 'crystal', name: 'Crystal Voronoi',
      code: `// Voronoi Crystal
// @param cells [2.0, 20.0, 8.0]
// @param edge [0.01, 0.2, 0.04]
// @param glow [0.0, 2.0, 1.0]

vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
  return fract(sin(p)*43758.5453);}

void main(){
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.x *= iResolution.x/iResolution.y;
  uv *= u_p[0];
  vec2 g = floor(uv), f = fract(uv);
  float m = 8., m2 = 8.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 o = vec2(x,y);
    vec2 p = o + hash2(g+o)*(.5+.5*sin(iTime+6.283*hash2(g+o).x));
    float d = length(f-p);
    if(d<m){m2=m; m=d;} else if(d<m2) m2=d;
  }
  float e = smoothstep(0., u_p[1], m2-m);
  vec3 c = u_color * e + u_color * u_p[2] * (1.-e) * .3;
  gl_FragColor = vec4(c, 1.);
}`,
    },
  ];

  // `// @param name [min, max, default]` 注釈をスライダー定義に変換する（最大8個）
  function parseShaderParams(src) {
    const re = /\/\/\s*@param\s+(\w+)\s*\[([\d.\-]+)\s*,\s*([\d.\-]+)\s*,\s*([\d.\-]+)\]/g;
    const out = []; let m;
    while ((m = re.exec(String(src || ''))) && out.length < 8)
      out.push({ name: m[1], min: +m[2], max: +m[3], def: +m[4] });
    return out;
  }

  // ユーザー/プリセットの GLSL を、標準 uniform を自動供給する形に包む。
  // - 標準 uniform の再宣言は除去される（こちらが供給する）
  // - Shadertoy 形式 (void mainImage) は main() で包む
  // 戻り値: { src, headerLines } — headerLines はエラーメッセージの行番号補正用
  function wrapShaderSource(raw, isGL2) {
    let src = String(raw || '').trim();
    const hasMainImage = /void\s+mainImage\s*\(/.test(src);
    const hasMain = /void\s+main\s*\(\s*\)/.test(src);
    const stripUniforms = [
      'u_time', 'u_resolution', 'u_mouse', 'u_color', 'u_p',
      'iTime', 'iResolution', 'iMouse', 'iFrame', 'iTimeDelta', 'iDate',
      'iChannel0', 'iChannel1', 'iBufferA',
    ];
    for (const name of stripUniforms) {
      const arr = name === 'u_p' ? '\\s*\\[\\s*\\d+\\s*\\]' : '';
      src = src.replace(new RegExp(`uniform\\s+\\w+\\s+${name}${arr}\\s*;`, 'g'), '');
    }
    src = src.replace(/precision\s+\w+\s+float\s*;\s*/g, '');
    const header = isGL2 ? `#version 300 es
precision highp float;
out vec4 _outColor;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec3  iResolution;
uniform vec4  iMouse;
uniform vec4  iDate;
uniform vec3  u_color;
uniform float u_p[8];
#define u_time iTime
#define u_resolution (iResolution.xy)
#define u_mouse (iMouse.xy/iResolution.xy)
#define gl_FragColor _outColor
#define texture2D texture
` : `precision highp float;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec3  iResolution;
uniform vec4  iMouse;
uniform vec4  iDate;
uniform vec3  u_color;
uniform float u_p[8];
#define u_time iTime
#define u_resolution (iResolution.xy)
#define u_mouse (iMouse.xy/iResolution.xy)
#define texture(s,uv) texture2D(s,uv)
`;
    let body = src;
    if (hasMainImage && !hasMain) {
      body += `
void main(){
  vec4 _c;
  mainImage(_c, gl_FragCoord.xy);
  ${isGL2 ? '_outColor' : 'gl_FragColor'} = _c;
}`;
    }
    const headerLines = (header.match(/\n/g) || []).length + 1;
    return { src: header + '\n' + body, headerLines };
  }

  return {
    clamp01, lerp, mulberry32, strSeed, ANIMS, FITS, NUM_KEYS, SLIDERS,
    defaultParams, clampParams, randomParams,
    serializePreset, parsePreset, parseFavList,
    SHARE_FRAGMENT_MAX_LENGTH, SHARE_URL_MAX_LENGTH,
    clampShaderState, buildShareJson, parseShareJson, encodeShareLink, decodeShareLink,
    keyAlpha, mannequinPose, skeleton, drawMannequin,
    MIME_CANDIDATES, pickMime,
    SHADER_PALETTES, SHADER_PRESETS, parseShaderParams, wrapShaderSource,
  };
})();
if (typeof globalThis !== 'undefined') globalThis.ShiroLib = ShiroLib;

// ============================== UI ==============================
if (typeof document !== 'undefined') (() => {
  const L = ShiroLib;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), ctx = stage.getContext('2d');
  const W = stage.width, H = stage.height;
  const err = m => { $('err').textContent = m || ''; };

  // お気に入りの保存キー。state の初期化（loadFavs）が参照するため、state より前に宣言する
  const FKEY = 'shiro.favs.v1';
  // 背景シェーダーの保存キー（AQUA 由来の背景設定。お気に入りの params とは独立）
  const SKEY = 'shiro.shader.v1';

  const state = {
    params: L.defaultParams(),
    bg: null,               // HTMLImageElement
    media: null,            // {kind:'image'|'video', el}
    favs: loadFavs(),
    keySrc: null, keyParams: '',
    recorder: null, recTimer: 0,
    shader: loadShaderState(),
  };

  // 共有リンク (#s=...) で開かれた場合は、その作品状態を初期状態にする。
  // フラグメントはサーバへ送られない。共有でないアンカーは無視し、
  // 壊れた共有リンクはエラー表示だけして通常起動する（起動自体は止めない）。
  // シェーダー UI の構築はこの後ろで行われるため、ここで state を差し替えれば
  // パラメーター・シェーダーとも UI へ自然に反映される。
  let sharedApplied = false, sharedFailed = false;
  try {
    const h = typeof location !== 'undefined' ? location.hash : '';
    if (h && h.length > 1) {
      const shared = L.decodeShareLink(h);
      if (shared) {
        state.params = shared.params;
        state.shader = shared.shader;
        saveShaderState(); // 手動でシェーダーを選んだ場合と同じくブラウザへも残す
        sharedApplied = true;
      }
    }
  } catch { sharedFailed = true; }

  function loadShaderState() {
    const d = { id: '', paletteIdx: 0, params: [], playing: true, speed: 1 };
    try {
      const o = JSON.parse(localStorage.getItem(SKEY) || 'null');
      if (!o) return d;
      if (L.SHADER_PRESETS.some(p => p.id === o.id)) d.id = o.id;
      if (Number.isInteger(o.paletteIdx) && o.paletteIdx >= 0 && o.paletteIdx < L.SHADER_PALETTES.length)
        d.paletteIdx = o.paletteIdx;
      if (Array.isArray(o.params)) d.params = o.params.slice(0, 8).map(v => +v || 0);
      if (typeof o.playing === 'boolean') d.playing = o.playing;
      if (Number.isFinite(o.speed)) d.speed = Math.min(3, Math.max(0, o.speed));
    } catch { /* 壊れた保存値は既定に落とす（背景は本体機能ではないため） */ }
    return d;
  }
  function saveShaderState() {
    try { localStorage.setItem(SKEY, JSON.stringify(state.shader)); } catch { /* 保存できなくても動作は続ける */ }
  }

  // ---------- backdrop / model source ----------
  function defaultBackdrop(c) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a3550'); g.addColorStop(.6, '#3b4a6b'); g.addColorStop(1, '#1d2230');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function drawCover(c, img, fit) {
    const iw = img.naturalWidth || img.videoWidth, ih = img.naturalHeight || img.videoHeight;
    if (!iw || !ih) return;
    const s = fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    c.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  // ---------- chroma-keyed media ----------
  const keyCv = document.createElement('canvas'), kctx = keyCv.getContext('2d', { willReadFrequently: true });
  function keyedMediaCanvas() {
    const el = state.media.el;
    const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih || el.readyState < 2) return null;
    const cacheKey = `${iw}x${ih}|${state.params.keyThresh}|${state.params.keySoft}`;
    if (state.media.kind === 'image' && state.keyParams === cacheKey) return keyCv;
    const scale = Math.min(1, 960 / iw);
    const kw = Math.round(iw * scale), kh = Math.round(ih * scale);
    if (keyCv.width !== kw || keyCv.height !== kh) { keyCv.width = kw; keyCv.height = kh; }
    kctx.drawImage(el, 0, 0, kw, kh);
    if (state.params.keyThresh > 0) {
      const im = kctx.getImageData(0, 0, kw, kh), d = im.data;
      for (let i = 0; i < d.length; i += 4)
        d[i + 3] = Math.min(d[i + 3], L.keyAlpha(d[i], d[i + 1], d[i + 2], state.params.keyThresh, state.params.keySoft));
      kctx.putImageData(im, 0, 0);
    }
    if (state.media.kind === 'image') state.keyParams = cacheKey;
    return keyCv;
  }
  function drawMedia(c) {
    const el = state.media.el;
    const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih) return;
    const src = state.params.keyThresh > 0 ? keyedMediaCanvas() : el;
    if (!src) return;
    const sw = src.width || iw, sh = src.height || ih;
    const hPix = H * (0.25 + 0.7 * state.params.scale);
    const wPix = hPix * (sw / sh);
    const cx = state.params.x * W, baseY = state.params.y * H;
    c.save();
    c.globalAlpha = state.params.opacity;
    if (state.params.flip) { c.translate(2 * cx, 0); c.scale(-1, 1); }
    c.drawImage(src, cx - wPix / 2, baseY - hPix, wPix, hPix);
    c.restore();
  }

  // ---------- shader background (AQUA 由来) ----------
  // フルスクリーンシェーダーを stage の背面レイヤー (#glbg) に描く。
  // AQUA Shader Studio の Renderer を背景用途に絞って移植したもの:
  // 標準 uniform の自動供給、コンパイル失敗時は前回成功したプログラムで
  // 描き続ける（背景が突然真っ黒にならない）、WebGL が無い環境では無効化。
  const glbg = $('glbg');
  class ShaderBg {
    constructor(canvas) {
      this.cv = canvas;
      this.gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })
        || canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
      if (!this.gl) throw new Error('WebGL未対応');
      this.isGL2 = typeof WebGL2RenderingContext !== 'undefined' && this.gl instanceof WebGL2RenderingContext;
      this.prog = null; this.lastGoodProg = null; this.uLocs = {};
      this.t = 0; this.tPrev = 0; this.frame = 0;
      this.mouse = [0, 0, 0, 0];
      this.color = L.SHADER_PALETTES[0];
      this.params = new Float32Array(8);
      this.errorCb = null;
      const gl = this.gl;
      const vs = this.isGL2
        ? '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}'
        : 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}';
      const v = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(v, vs); gl.compileShader(v);
      this.vs = v;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    }
    compile(rawSrc) {
      const gl = this.gl;
      const { src, headerLines } = L.wrapShaderSource(rawSrc, this.isGL2);
      const f = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(f, src); gl.compileShader(f);
      if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(f) || 'Unknown';
        gl.deleteShader(f);
        const adjusted = log.replace(/ERROR:\s*(\d+):(\d+):/g,
          (_, a, b) => `ERROR: ${a}:${Math.max(1, +b - headerLines)}:`);
        if (this.errorCb) this.errorCb(adjusted);
        return false;
      }
      const p = gl.createProgram();
      gl.attachShader(p, this.vs); gl.attachShader(p, f);
      gl.bindAttribLocation(p, 0, 'p');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        if (this.errorCb) this.errorCb(gl.getProgramInfoLog(p) || 'link error');
        return false;
      }
      if (this.lastGoodProg && this.lastGoodProg !== this.prog) gl.deleteProgram(this.lastGoodProg);
      this.lastGoodProg = this.prog;
      this.prog = p;
      gl.useProgram(p);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['iTime', 'iTimeDelta', 'iFrame', 'iResolution', 'iMouse', 'iDate', 'u_color'])
        this.uLocs[n] = gl.getUniformLocation(p, n);
      this.uLocs.u_p = gl.getUniformLocation(p, 'u_p[0]') || gl.getUniformLocation(p, 'u_p');
      if (this.errorCb) this.errorCb(null);
      return true;
    }
    render(now, speed, playing) {
      const gl = this.gl;
      const active = this.prog || this.lastGoodProg;
      if (!active) return;
      const dt = this.tPrev ? (now - this.tPrev) / 1000 : 0;
      this.tPrev = now;
      if (playing) this.t += dt * speed;
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.useProgram(active);
      const u = this.uLocs, d = new Date();
      if (u.iTime) gl.uniform1f(u.iTime, this.t);
      if (u.iTimeDelta) gl.uniform1f(u.iTimeDelta, playing ? dt * speed : 0);
      if (u.iFrame) gl.uniform1i(u.iFrame, this.frame);
      if (u.iResolution) gl.uniform3f(u.iResolution, this.cv.width, this.cv.height, 1.0);
      if (u.iMouse) gl.uniform4f(u.iMouse, this.mouse[0], this.mouse[1], this.mouse[2], this.mouse[3]);
      if (u.iDate) gl.uniform4f(u.iDate, d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
      if (u.u_color) gl.uniform3fv(u.u_color, this.color);
      if (u.u_p) gl.uniform1fv(u.u_p, this.params);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (playing) this.frame++;
    }
  }

  let shaderBg = null;
  try {
    shaderBg = new ShaderBg(glbg);
    shaderBg.errorCb = log => { if (log) err('背景シェーダーのコンパイルエラー:\n' + log.split('\n').filter(Boolean).slice(0, 3).join('\n')); };
  } catch {
    shaderBg = null; // WebGL が無い環境ではシェーダー背景なしで通常動作する
  }
  const shaderActive = () => !!(shaderBg && state.shader.id);

  function applyShaderPreset() {
    if (!shaderBg) return;
    const p = L.SHADER_PRESETS.find(x => x.id === state.shader.id);
    glbg.style.display = p ? 'block' : 'none';
    stage.classList.toggle('translucent', !!p);
    if (!p) return;
    shaderBg.color = L.SHADER_PALETTES[state.shader.paletteIdx] || L.SHADER_PALETTES[0];
    const defs = L.parseShaderParams(p.code);
    defs.forEach((d, i) => {
      const saved = state.shader.params[i];
      shaderBg.params[i] = Number.isFinite(saved) && state.shader.params.length ? saved : d.def;
    });
    shaderBg.t = 0; shaderBg.frame = 0;
    if (!shaderBg.compile(p.code) && !shaderBg.lastGoodProg)
      err('背景シェーダーをコンパイルできませんでした');
    buildShaderParamUI(defs);
  }

  function buildShaderParamUI(defs) {
    const box = $('shader-params');
    box.innerHTML = '';
    defs.forEach((d, i) => {
      const lab = document.createElement('label');
      lab.className = 'ctl'; lab.htmlFor = 'shp-' + i;
      lab.innerHTML = `${d.name}<output id="shp-out-${i}"></output>`;
      const inp = document.createElement('input');
      inp.type = 'range'; inp.id = 'shp-' + i;
      inp.min = d.min; inp.max = d.max; inp.step = (d.max - d.min) / 200;
      inp.value = shaderBg.params[i];
      inp.addEventListener('input', () => {
        const v = +inp.value;
        shaderBg.params[i] = v;
        state.shader.params[i] = v;
        $('shp-out-' + i).textContent = v.toFixed(2);
        saveShaderState();
      });
      box.appendChild(lab); box.appendChild(inp);
      lab.querySelector('output').textContent = (+shaderBg.params[i]).toFixed(2);
    });
  }

  // stage 上のポインタをシェーダーの iMouse へ（Ripple の波源など）
  stage.addEventListener('pointermove', e => {
    if (!shaderBg) return;
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    shaderBg.mouse[0] = (e.clientX - r.left) / r.width * glbg.width;
    shaderBg.mouse[1] = glbg.height - (e.clientY - r.top) / r.height * glbg.height;
  });
  stage.addEventListener('pointerdown', () => {
    if (shaderBg) { shaderBg.mouse[2] = Math.abs(shaderBg.mouse[0]); shaderBg.mouse[3] = Math.abs(shaderBg.mouse[1]); }
  });
  stage.addEventListener('pointerup', () => {
    if (shaderBg) { shaderBg.mouse[2] = -Math.abs(shaderBg.mouse[2]); shaderBg.mouse[3] = -Math.abs(shaderBg.mouse[3]); }
  });

  // 書き出し用: 背景シェーダーと stage を合成したキャンバスを返す
  function compositeCanvas() {
    if (!shaderActive()) return stage;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const c2 = c.getContext('2d');
    c2.drawImage(glbg, 0, 0, W, H);
    c2.drawImage(stage, 0, 0);
    return c;
  }

  // ---------- render loop ----------
  const t0 = performance.now();
  function frame(now) {
    const t = (performance.now() - t0) / 1000;
    const p = state.params;
    if (shaderActive()) shaderBg.render(now || 0, state.shader.speed, state.shader.playing);
    ctx.clearRect(0, 0, W, H);
    if (!shaderActive()) {
      if (state.bg) drawCover(ctx, state.bg, p.bgFit); else defaultBackdrop(ctx);
    }
    if (state.media) drawMedia(ctx);
    else L.drawMannequin(ctx, p, t, p.x * W, p.y * H, H * (0.25 + 0.7 * p.scale));
    requestAnimationFrame(frame);
  }

  // ---------- controls ----------
  const sDiv = $('sliders');
  for (const [key, label] of L.SLIDERS) {
    const lab = document.createElement('label');
    lab.className = 'ctl'; lab.htmlFor = 'sl-' + key;
    lab.innerHTML = `${label}<output id="out-${key}"></output>`;
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = .01; inp.id = 'sl-' + key;
    inp.addEventListener('input', () => { state.params[key] = +inp.value; syncUI(false); });
    sDiv.appendChild(lab); sDiv.appendChild(inp);
  }
  function syncUI(fromParams = true) {
    for (const [key] of L.SLIDERS) {
      if (fromParams) $('sl-' + key).value = state.params[key];
      $('out-' + key).textContent = (+state.params[key]).toFixed(2);
    }
    if (fromParams) {
      $('sel-anim').value = state.params.anim;
      $('sel-bgfit').value = state.params.bgFit;
      $('chk-flip').checked = state.params.flip;
    }
  }
  $('sel-anim').addEventListener('change', e => state.params.anim = e.target.value);
  $('sel-bgfit').addEventListener('change', e => state.params.bgFit = e.target.value);
  $('chk-flip').addEventListener('change', e => state.params.flip = e.target.checked);

  $('btn-random').addEventListener('click', () => {
    state.params = L.randomParams(L.mulberry32((Math.random() * 4294967296) >>> 0));
    syncUI();
  });

  // ---------- file inputs ----------
  function readURL(file) { return URL.createObjectURL(file); }
  $('bg-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => { state.bg = img; err(''); };
    img.onerror = () => err('背景画像を読み込めませんでした');
    img.src = readURL(f); e.target.value = '';
  });
  $('model-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.src = readURL(f);
      v.onloadeddata = () => { v.play().catch(() => {}); state.media = { kind: 'video', el: v }; state.keyParams = ''; err(''); };
      v.onerror = () => err('動画を読み込めませんでした(mp4/webm/mov 等を確認)');
    } else if (f.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => { state.media = { kind: 'image', el: img }; state.keyParams = ''; err(''); };
      img.onerror = () => err('画像を読み込めませんでした');
      img.src = readURL(f);
    } else err('対応形式: 画像 / 動画ファイル');
    e.target.value = '';
  });
  $('btn-model-reset').addEventListener('click', () => { state.media = null; });
  $('btn-bg-reset').addEventListener('click', () => { state.bg = null; });

  // ---------- export ----------
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  $('btn-png').addEventListener('click', () =>
    compositeCanvas().toBlob(b => b ? download(b, 'shiro.png') : err('PNG生成に失敗'), 'image/png'));
  $('btn-rec').addEventListener('click', () => {
    if (state.recorder) return;
    const pick = L.pickMime(m => MediaRecorder.isTypeSupported(m));
    if (!pick) return err('このブラウザは動画録画に未対応です');
    // シェーダー背景があるときは合成キャンバスを録る（stage だけでは背景が写らない）
    let srcCanvas = stage, compTimer = 0;
    if (shaderActive()) {
      srcCanvas = document.createElement('canvas');
      srcCanvas.width = W; srcCanvas.height = H;
      const c2 = srcCanvas.getContext('2d');
      const drawComp = () => {
        c2.drawImage(glbg, 0, 0, W, H);
        c2.drawImage(stage, 0, 0);
        if (state.recorder) compTimer = requestAnimationFrame(drawComp);
      };
      drawComp();
    }
    const rec = new MediaRecorder(srcCanvas.captureStream(30), { mimeType: pick.mime });
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      state.recorder = null;
      cancelAnimationFrame(compTimer);
      download(new Blob(chunks, { type: pick.mime }), 'shiro.' + pick.ext);
      $('btn-rec').textContent = '動画を保存（5秒）';
    };
    state.recorder = rec; rec.start();
    $('btn-rec').textContent = '録画中…';
    state.recTimer = setTimeout(() => rec.stop(), 5000);
  });
  $('btn-share').addEventListener('click', async () => {
    try {
      const blob = await new Promise(r => compositeCanvas().toBlob(r, 'image/png'));
      const file = new File([blob], 'shiro.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }))
        await navigator.share({ files: [file], title: 'Shiro' });
      else download(blob, 'shiro.png');
    } catch (e) { if (e.name !== 'AbortError') err('共有に失敗: ' + e.message); }
  });

  // ---------- share link ----------
  // 現在の作品状態をフラグメントに埋めた URL を作り、コピーできる形で提示する。
  // リンクの生成と表示は同期に行い、クリップボード書き込みだけを非同期で試す
  // （file:// 等でクリップボードが使えない環境でもリンク自体は必ず手に入る）。
  function currentShareUrl() {
    const frag = L.encodeShareLink(state.params, state.shader); // 上限超過時は例外
    const base = typeof location !== 'undefined' && location.href ? location.href.split('#')[0] : '';
    const url = base + '#' + frag;
    if (url.length > L.SHARE_URL_MAX_LENGTH) throw new RangeError('share link too long');
    return url;
  }
  function copyText(text, doneMsg) {
    const msg = m => { $('share-msg').textContent = m; };
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => msg(doneMsg), () => msg('コピーできませんでした。リンクを選択して手動でコピーしてください。'));
    } else {
      msg('リンクを表示しました。選択してコピーしてください。');
      const inp = $('share-url');
      if (typeof inp.select === 'function') inp.select();
    }
  }
  $('btn-share-link').addEventListener('click', () => {
    try {
      const url = currentShareUrl();
      $('share-url').value = url;
      $('share-link-box').style.display = '';
      err('');
      copyText(url, '共有リンクをコピーしました。このリンクを開くと、同じ作品をそのまま編集できます。');
    } catch { err('共有リンクを作れませんでした（状態が大きすぎます）'); }
  });
  $('btn-copy-link').addEventListener('click', () => {
    const url = $('share-url').value;
    if (url) copyText(url, '共有リンクをコピーしました。');
  });

  // ---------- favorites ----------
  function loadFavs() {
    try { return L.parseFavList(localStorage.getItem(FKEY) || '[]'); }
    catch { err('保存済みお気に入りを読み込めませんでした（データが壊れている可能性があります）'); return []; }
  }
  function saveFavs() {
    try { localStorage.setItem(FKEY, JSON.stringify(state.favs)); }
    catch { err('お気に入りを保存できませんでした（ブラウザの保存容量が不足している可能性があります）'); }
  }
  function renderFavs() {
    const bar = $('fav-bar'); bar.innerHTML = '';
    for (const f of state.favs) {
      const d = document.createElement('div'); d.className = 'fav';
      d.title = f.name;
      d.innerHTML = `<img alt=""><span></span><button class="del" title="削除">×</button>`;
      d.querySelector('img').src = f.thumb || '';
      d.querySelector('span').textContent = f.name;
      d.addEventListener('click', () => { state.params = L.clampParams(f.params); syncUI(); });
      d.querySelector('.del').addEventListener('click', ev => {
        ev.stopPropagation();
        state.favs = state.favs.filter(x => x.id !== f.id);
        saveFavs(); renderFavs();
      });
      bar.appendChild(d);
    }
  }
  function thumb() {
    const c = document.createElement('canvas'); c.width = 110; c.height = 62;
    c.getContext('2d').drawImage(compositeCanvas(), 0, 0, 110, 62);
    return c.toDataURL('image/jpeg', .7);
  }
  $('btn-fav').addEventListener('click', () => {
    const name = prompt('お気に入りの名前', 'モデル ' + (state.favs.length + 1));
    if (name === null) return;
    state.favs.push({ id: 'f' + Date.now().toString(36), name: name || '無題', params: state.params, thumb: thumb() });
    saveFavs(); renderFavs();
  });
  $('btn-fav-exp').addEventListener('click', () =>
    download(new Blob([JSON.stringify(state.favs, null, 1)], { type: 'application/json' }), 'shiro-favs.json'));
  $('fav-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => {
      const list = L.parseFavList(txt);
      for (const it of list) it.id = it.id || 'f' + Math.random().toString(36).slice(2);
      state.favs = state.favs.concat(list);
      saveFavs(); renderFavs(); err('');
    }).catch(() => err('お気に入りファイルを読み込めませんでした'));
    e.target.value = '';
  });

  // ---------- shader background controls ----------
  {
    const palBox = $('shader-palettes');
    L.SHADER_PALETTES.forEach((rgb, i) => {
      const b = document.createElement('button');
      b.className = 'swatch' + (i === state.shader.paletteIdx ? ' sel' : '');
      b.style.background = `rgb(${rgb.map(v => Math.round(v * 255)).join(',')})`;
      b.title = '基調色 ' + (i + 1);
      b.addEventListener('click', () => {
        state.shader.paletteIdx = i;
        if (shaderBg) shaderBg.color = L.SHADER_PALETTES[i];
        palBox.querySelectorAll('.swatch').forEach((x, j) => x.classList.toggle('sel', j === i));
        saveShaderState();
      });
      palBox.appendChild(b);
    });
    const syncShaderUI = () => {
      $('sel-shader').value = state.shader.id;
      $('shader-ui').style.display = state.shader.id ? '' : 'none';
      $('shader-speed').value = state.shader.speed;
      $('out-shader-speed').textContent = state.shader.speed.toFixed(2) + 'x';
      $('btn-shader-play').textContent = state.shader.playing ? 'シェーダーを一時停止' : 'シェーダーを再生';
    };
    $('sel-shader').addEventListener('change', e => {
      state.shader.id = e.target.value;
      state.shader.params = []; // プリセットが変わったらパラメータは既定に戻す
      applyShaderPreset();
      syncShaderUI();
      saveShaderState();
      if (state.shader.id && !shaderBg) err('このブラウザは WebGL に未対応のため、シェーダー背景は使えません');
      else if (state.shader.id) err('');
    });
    $('shader-speed').addEventListener('input', e => {
      state.shader.speed = +e.target.value;
      $('out-shader-speed').textContent = state.shader.speed.toFixed(2) + 'x';
      saveShaderState();
    });
    $('btn-shader-play').addEventListener('click', () => {
      state.shader.playing = !state.shader.playing;
      syncShaderUI();
      saveShaderState();
    });
    syncShaderUI();
    if (state.shader.id) applyShaderPreset();
  }

  // ---------- init ----------
  // 共有リンクから開いた受け手への導線: 状態は適用済みなので、案内を出し、
  // そのまま編集を始められるようにする。フラグメントは適用後に消す
  // （残すと再読み込みのたびに自分の編集が共有状態で上書きされてしまう）。
  $('btn-edit-shared').addEventListener('click', () => {
    $('shared-banner').style.display = 'none';
    const first = $('sl-height');
    if (first && typeof first.focus === 'function') first.focus();
  });
  if (sharedFailed) err('共有リンクを読み込めませんでした（リンクが壊れている可能性があります）');
  if (sharedApplied) {
    $('shared-banner').style.display = '';
    try {
      if (typeof history !== 'undefined' && history.replaceState && typeof location !== 'undefined' && location.href)
        history.replaceState(null, '', location.href.split('#')[0]);
    } catch { /* 消せなくても編集は続けられる */ }
  }
  syncUI();
  renderFavs();
  requestAnimationFrame(frame);
})();
