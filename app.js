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
  const ANIMS = ['idle', 'wave', 'walk', 'dance', 'jump', 'nod', 'run', 'talk', 'bow', 'spin', 'stretch', 'sleep', 'flip', 'still'];
  const VIDQS = ['low', 'std', 'high'];
  const FITS = ['cover', 'contain'];
  const ACCS = ['none', 'ribbon', 'hat', 'glasses', 'shades', 'crown', 'phones', 'cape', 'beard', 'mask', 'halo', 'flower'];
  const PARTICLES = ['none', 'snow', 'sparkle', 'petal', 'rain', 'leaf', 'ember', 'bubble', 'confetti', 'firefly', 'bokeh'];
  const WMPOS = ['br', 'bl', 'tr', 'tl'];
  const BGS = ['gradient', 'green', 'white', 'transparent', 'sunset', 'night', 'spot', 'sky'];
  const EYES = ['dot', 'wink', 'closed', 'heart', 'sharp', 'star', 'crying'];
  const HAIRS = ['none', 'short', 'bob', 'twin', 'long', 'ahoge', 'mohawk'];
  const SUBJFX = ['none', 'sepia', 'mono', 'invert'];
  const SUBJFX_FILTERS = { sepia: 'sepia(0.9)', mono: 'grayscale(1)', invert: 'invert(1) hue-rotate(180deg)' };
  const GRADES = ['none', 'warm', 'cool', 'noir', 'vivid'];
  const BLENDS = ['none', 'multiply', 'screen', 'overlay', 'soft-light', 'difference', 'hue'];
  const GRADE_STYLES = {
    warm: ['overlay', 'rgba(255,150,50,0.16)'],
    cool: ['overlay', 'rgba(70,130,255,0.16)'],
    noir: ['saturation', '#808080'],
    vivid: ['saturation', 'hsl(0,100%,50%)'],
  };
  const NUM_KEYS = ['height', 'headSize', 'shoulder', 'armLen', 'legLen', 'tone',
    'line', 'animSpeed', 'x', 'y', 'scale', 'opacity', 'keyThresh', 'keySoft', 'shadow',
    'smile', 'bgDim', 'bgBlur', 'castDir', 'rim', 'eyeHue', 'clothHue', 'outline', 'vignette', 'wmOpacity',
    'accHue', 'vidSpeed', 'blush', 'headTilt', 'bgSat', 'bgContrast',
    'rimHue', 'reflect', 'tOffset', 'grain', 'trail', 'subjHue', 'pixel', 'shake',
    'glow', 'glowHue', 'eyeSize', 'bgX', 'bgY', 'despill', 'temp', 'shadowSoft', 'brow', 'bgDrift',
    'rot', 'eyeGap', 'duo', 'hairHue', 'squash', 'frame', 'frameHue',
    'subjSat', 'subjBright', 'titleSize', 'camZoom', 'shine', 'shadowHue',
    'outlineHue', 'bubbleHue', 'titleHue', 'gaze'];

  const SLIDERS = [
    ['height', 'モデル身長'], ['headSize', '頭の大きさ'], ['shoulder', '肩幅'],
    ['armLen', '腕の長さ'], ['legLen', '脚の長さ'], ['tone', 'モデルトーン'],
    ['line', '輪郭の太さ'], ['animSpeed', '動きの速さ'], ['x', '位置 X'],
    ['y', '位置 Y'], ['scale', 'モデル倍率'], ['opacity', 'モデル不透明度'],
    ['keyThresh', '白抜き強度'], ['keySoft', '白抜きぼかし'], ['shadow', 'モデルの影'],
    ['smile', '表情（笑顔）'], ['bgDim', '背景を暗く'], ['bgBlur', '背景ぼかし'],
    ['castDir', '影の向き'], ['rim', 'リムライト'], ['eyeHue', '目の色'],
    ['clothHue', '衣装色'], ['outline', '縁取り（ステッカー）'], ['vignette', 'ビネット'],
    ['wmOpacity', '透かしの濃さ'], ['accHue', 'アクセサリ色'], ['vidSpeed', '動画の速さ'],
    ['blush', '頬の赤み'], ['headTilt', '頭の傾き'], ['bgSat', '背景の彩度'], ['bgContrast', '背景コントラスト'],
    ['rimHue', 'リムライト色'], ['reflect', '床の反射'], ['tOffset', 'ポーズ位置（停止時）'],
    ['grain', 'フィルムグレイン'], ['trail', '残像（トレイル）'], ['subjHue', 'モデル色相'], ['pixel', 'ピクセル化'], ['shake', '手持ちカメラ'],
    ['glow', '発光'], ['glowHue', '発光色'], ['eyeSize', '目の大きさ'],
    ['bgX', '背景位置 X'], ['bgY', '背景位置 Y'],
    ['despill', 'スピル除去'], ['temp', '色温度'], ['shadowSoft', '影の柔らかさ'], ['brow', '眉毛の角度'],
    ['bgDrift', '背景のゆっくりズーム'], ['rot', 'モデルの傾き'], ['eyeGap', '目の間隔'],
    ['duo', '相方（2体目）'], ['hairHue', '髪色'], ['squash', 'つぶし・伸び'],
    ['frame', '額縁の太さ'], ['frameHue', '額縁の色'],
    ['subjSat', 'モデル彩度'], ['subjBright', 'モデル明度'], ['titleSize', 'タイトル大きさ'],
    ['camZoom', 'シーンズーム'],
    ['shine', '光沢（テカリ）'], ['shadowHue', '影の色'],
    ['outlineHue', '縁取り色'], ['bubbleHue', 'ふきだし色'], ['titleHue', 'タイトル色'],
    ['gaze', '目線（左右）'],
  ];

  function defaultParams() {
    return {
      seed: 1, height: .5, headSize: .5, shoulder: .5, armLen: .5, legLen: .5,
      tone: .25, line: .4, anim: 'idle', animSpeed: .5, x: .5, y: .84,
      scale: .6, opacity: 1, flip: false, keyThresh: 0, keySoft: .3, shadow: .5,
      smile: .6, bgDim: 0, bgBlur: 0, castDir: .5, rim: 0, eyeHue: .62, clothHue: 0,
      outline: 0, vignette: 0, wmOpacity: .4, watermark: '', bubble: '',
      accHue: .58, vidSpeed: .5, blush: 0, headTilt: .5, bgSat: .5, bgContrast: .5,
      rimHue: .62, reflect: 0, tOffset: .5, grain: 0, trail: 0, subjHue: .5, pixel: 0,
      shake: 0, glow: 0, glowHue: .55, eyeSize: .5, bgX: .5, bgY: .5,
      despill: .5, temp: .5, shadowSoft: .4, brow: .5, bgDrift: 0,
      rot: .5, eyeGap: .5, duo: 0, hairHue: .07, squash: 0,
      frame: 0, frameHue: .12,
      subjSat: .5, subjBright: .5, titleSize: .5, title: '', camZoom: 0,
      shine: 0, shadowHue: .62,
      outlineHue: .12, bubbleHue: .12, titleHue: .08, gaze: .5,
      subjFx: 'none', grade: 'none', blend: 'none', particles: 'none', wmPos: 'br', vidQ: 'std',
      eyeStyle: 'dot', acc: 'none', acc2: 'none', hair: 'none', bgFit: 'cover', bgPreset: 'gradient',
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
    o.acc = ACCS.includes(p && p.acc) ? p.acc : d.acc;
    o.acc2 = ACCS.includes(p && p.acc2) ? p.acc2 : d.acc2;
    o.bgPreset = BGS.includes(p && p.bgPreset) ? p.bgPreset : d.bgPreset;
    o.watermark = String(p && p.watermark || '').slice(0, 60);
    o.bubble = String(p && p.bubble || '').slice(0, 24);
    o.title = String(p && p.title || '').slice(0, 40);
    o.eyeStyle = EYES.includes(p && p.eyeStyle) ? p.eyeStyle : d.eyeStyle;
    o.subjFx = SUBJFX.includes(p && p.subjFx) ? p.subjFx : d.subjFx;
    o.grade = GRADES.includes(p && p.grade) ? p.grade : d.grade;
    o.blend = BLENDS.includes(p && p.blend) ? p.blend : d.blend;
    o.particles = PARTICLES.includes(p && p.particles) ? p.particles : d.particles;
    o.wmPos = WMPOS.includes(p && p.wmPos) ? p.wmPos : d.wmPos;
    o.hair = HAIRS.includes(p && p.hair) ? p.hair : d.hair;
    o.vidQ = VIDQS.includes(p && p.vidQ) ? p.vidQ : d.vidQ;
    o.flip = !!(p && p.flip);
    const sv = p ? +p.seed : NaN;
    o.seed = (Number.isFinite(sv) ? Math.abs(Math.floor(sv)) : d.seed) >>> 0;
    return o;
  }

  function randomParams(rng) {
    const p = defaultParams();
    for (const k of NUM_KEYS) p[k] = rng();
    p.anim = ANIMS[Math.floor(rng() * ANIMS.length)];
    p.acc = ACCS[Math.floor(rng() * ACCS.length)];
    p.acc2 = rng() < .7 ? 'none' : ACCS[Math.floor(rng() * ACCS.length)];
    p.eyeStyle = EYES[Math.floor(rng() * EYES.length)];
    p.hair = HAIRS[Math.floor(rng() * HAIRS.length)];
    p.hairHue = rng();
    p.subjFx = rng() < .75 ? 'none' : SUBJFX[1 + Math.floor(rng() * 3)];
    p.grade = rng() < .6 ? 'none' : GRADES[1 + Math.floor(rng() * 4)];
    p.blend = rng() < .75 ? 'none' : BLENDS[1 + Math.floor(rng() * 3)];
    p.flip = rng() < .35;
    p.bgPreset = rng() < .7 ? 'gradient' : BGS[1 + Math.floor(rng() * (BGS.length - 1))];
    p.x = .3 + rng() * .4; p.y = .6 + rng() * .35;
    p.scale = .4 + rng() * .5; p.opacity = .6 + rng() * .4;
    p.keyThresh = rng() < .5 ? 0 : rng() * .6;
    p.bgDim = rng() * .5; p.bgBlur = rng() < .6 ? 0 : rng() * .6;
    p.castDir = rng(); p.rim = rng() * .7; p.eyeHue = rng(); p.clothHue = rng() < .4 ? 0 : rng(); p.outline = rng() < .5 ? 0 : rng() * .7; p.vignette = rng() < .6 ? 0 : rng() * .6; p.watermark = ''; p.wmOpacity = .4; p.vidSpeed = .5; p.blush = rng() * .6; p.headTilt = .35 + rng() * .3;
    p.bgSat = .3 + rng() * .7; p.bgContrast = .35 + rng() * .5;
    p.reflect = rng() < .6 ? 0 : rng() * .8; p.tOffset = .5;
    p.grain = rng() < .7 ? 0 : rng() * .5; p.trail = rng() < .7 ? 0 : rng() * .7; p.subjHue = .4 + rng() * .2;
    p.pixel = rng() < .75 ? 0 : rng() * .7; p.shake = rng() < .7 ? 0 : rng() * .5;
    p.glow = rng() < .7 ? 0 : rng() * .8; p.eyeSize = .3 + rng() * .5;
    p.duo = rng() < .7 ? 0 : rng() * .7; p.rot = .35 + rng() * .3;
    p.bgX = .5; p.bgY = .5; // 背景オフセットはランダムにしない(構図崩壊防止)
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

  // ---------- chroma key (white) ----------
  // thresh>0 のとき白に近い画素を透過。soft で境界をぼかす。
  function keyAlpha(r, g, b, thresh, soft) {
    if (thresh <= 0) return 255;
    const d = 255 - Math.min(r, g, b);
    const T = thresh * 200, S = 1 + soft * 120;
    return Math.round(Math.max(0, Math.min(255, (d - T) / S * 255)));
  }

  // スピル除去: 半透明エッジ画素の彩度を輝度へ寄せ、白背景の色反射残りを消す。
  // strength 0..1。d = ImageData.data（破壊的）
  function despill(d, strength) {
    if (strength <= 0) return;
    const k = Math.min(1, strength * 1.4);
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      if (a === 0 || a === 255) continue;
      const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11);
      d[i] += (l - d[i]) * k; d[i + 1] += (l - d[i + 1]) * k; d[i + 2] += (l - d[i + 2]) * k;
    }
  }

  // 1px 4近傍アルファ縮小: 透過境界の白フリンジ残りを除去する。
  // d = ImageData.data（破壊的）
  function erodeAlpha(d, w, h) {
    const a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!a[i]) continue;
      const m = Math.min(
        x > 0 ? a[i - 1] : 0, x < w - 1 ? a[i + 1] : 0,
        y > 0 ? a[i - w] : 0, y < h - 1 ? a[i + w] : 0);
      d[i * 4 + 3] = Math.min(d[i * 4 + 3], m);
    }
  }

  // 瞬き: animSpeed に連動しない周期的なまばたき。1=開, 0=閉。
  // seed で個体差のある周期(3.2〜4.6秒)を作る — 同じシードは常に同じリズム。
  function blinkOpen(t, seed) {
    const ph = t % (3.2 + ((seed || 0) % 97) / 97 * 1.4);
    if (ph >= .18) return 1;
    const s = Math.abs(ph - .09) / .09; // 0..1..0 の三角形
    return Math.min(1, s * 1.4);
  }

  // キャストシャドウ: モデルのシルエットを傾斜・押し潰して落とし影にする。
  // silCanvas は濃色シルエット済みキャンバス(下部=足元)。castDir .5=真下(省略可)
  function drawCastShadow(c, silCanvas, wPix, hPix, cx, baseY, dir, alpha, soft) {
    const skew = (dir - .5) * 1.6;
    if (Math.abs(skew) < .05 || alpha <= 0) return;
    c.save();
    c.filter = `blur(${Math.max(1, wPix * (.02 + (soft == null ? .4 : soft) * .08))}px)`;
    c.globalAlpha = alpha;
    c.translate(cx, baseY);
    c.transform(1, 0, -skew, .32, 0, 0);
    c.drawImage(silCanvas, -wPix / 2, -hPix, wPix, hPix);
    c.restore();
  }

  // リムライト(ライトラップ): 光源側エッジに薄い光をまとわせ被写体を背景に馴染ませる。
  // 影の向き(castDir)と逆側が光方向。モデル描画の直前に呼ぶ。
  function drawRimLight(c, silCanvas, wPix, hPix, cx, baseY, dir, strength) {
    if (strength <= 0) return;
    const dx = (dir - .5) * -wPix * .08; // 影と逆方向
    const g = 1.06;
    c.save();
    c.filter = `blur(${Math.max(1, wPix * .05)}px)`;
    c.globalAlpha = strength * .55;
    c.drawImage(silCanvas, cx - wPix / 2 + dx - (wPix * g - wPix) / 2, baseY - hPix * g - hPix * .015, wPix * g, hPix * g);
    c.restore();
  }

  // ステッカー縁取り: 白色シルエットを全方向にずらして重ね、被写体の周りに輪郭を作る。
  // silCanvas は #ffffff 着色済みのシルエット。2重リングで隙間なく塗る。
  function drawStickerOutline(c, silCanvas, wPix, hPix, cx, baseY, strength) {
    if (strength <= 0) return;
    const r = Math.max(1, Math.round(strength * wPix * .045));
    c.save();
    c.globalAlpha = Math.min(1, strength * 1.5);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      c.drawImage(silCanvas, cx - wPix / 2 + dx, baseY - hPix + dy, wPix, hPix);
      c.drawImage(silCanvas, cx - wPix / 2 + dx * .55, baseY - hPix + dy * .55, wPix, hPix);
    }
    c.restore();
  }

  // ビネット: 画面端を落とすレンズ効果。最後にフレーム全体へ重ねる。
  function drawVignette(c, w, h, strength) {
    if (strength <= 0) return;
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength * .45})`);
    c.save(); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
  }

  // 透かし(ウォーターマーク): クリエイターが作品に入れる署名テキスト。右下・影付き白文字。
  function drawWatermark(c, text, w, h, opacity, pos = 'br') {
    if (!text || opacity <= 0) return;
    const fs = Math.max(12, Math.round(h * .032));
    c.save();
    c.font = `600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`;
    c.textAlign = pos[1] === 'r' ? 'right' : 'left';
    c.textBaseline = pos[0] === 't' ? 'top' : 'bottom';
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = fs * .3; c.shadowOffsetY = 1;
    c.fillStyle = `rgba(255,255,255,${opacity})`;
    c.fillText(text, pos[1] === 'r' ? w - fs * .6 : fs * .6, pos[0] === 't' ? fs * .5 : h - fs * .5);
    c.restore();
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
      case 'jump': {
        const air = Math.sin((tt % 1) * Math.PI); // 0→1→0 の放物線で1秒周期の跳躍
        q.bob = .13 * air;
        q.lThigh = q.rThigh = -.1 * air; q.lKnee = q.rKnee = .9 * air;
        q.lArm = .1 - 1.9 * air; q.rArm = .1 + 1.9 * air; // 両腕を上げる
        q.lElb = .3; q.rElb = .3; q.lean = .03 * Math.sin(tt * 4);
        break;
      }
      case 'nod': {
        // うなずき: 頭を周期的に前後に傾けるあいづち動作
        const n = Math.sin(tt * 2.4);
        q.headTilt = .22 * n; q.bob = .008 * Math.abs(n);
        q.lean = .02 * n; q.lArm = .1; q.rArm = .1;
        break;
      }
      case 'run': {
        // 走る: 歩行の2倍弱の脚回転 + 前傾 + 肘を畳む
        const w = Math.sin(tt * 5);
        q.lThigh = .8 * w; q.rThigh = -.8 * w;
        q.lKnee = Math.max(0, 1.1 * Math.sin(tt * 5 + Math.PI / 2));
        q.rKnee = Math.max(0, 1.1 * Math.sin(tt * 5 - Math.PI / 2));
        q.lArm = .3 - .7 * w; q.rArm = .3 + .7 * w;
        q.lElb = 1.1; q.rElb = 1.1;
        q.bob = .04 * Math.abs(Math.cos(tt * 5)); q.lean = .12;
        break;
      }
      case 'talk': {
        // おしゃべり: ゆるい待機 + 会話っぽい小さな頭の動き(口の開閉は描画側で処理)
        q.bob = .008 * Math.sin(tt * 2); q.lean = .015 * Math.sin(tt * 1.1);
        q.headTilt = .05 * Math.sin(tt * 2.7);
        q.lArm = .08; q.rArm = .08;
        break;
      }
      case 'spin': {
        // 回転: X方向スケールは描画側の座標変換で行う。体は腕を広げた軽いバウンス
        q.bob = .02 * Math.abs(Math.sin(tt * 2.5));
        q.lArm = .35; q.rArm = .35; q.lElb = .2; q.rElb = .2;
        break;
      }
      case 'bow': {
        // おじぎ: 頭を深く垂れて体ごと少し沈む敬礼動作(1.4s弱周期で往復)
        const b = Math.pow(Math.max(0, Math.sin(tt * 1.4)), .7);
        q.headTilt = b * .55; q.bob = -b * .05;
        q.lArm = .05; q.rArm = .05; q.lElb = 0; q.rElb = 0;
        break;
      }
      case 'stretch': {
        // 背伸び: 両腕を頭上に伸ばしてゆっくり持ち上がる(顔も上向き)
        const u = .5 + .5 * Math.sin(tt * 1.6 - Math.PI / 2); // 0→1→0 ゆったり
        q.bob = .05 * u;
        q.lArm = -(.1 + 2.5 * u); q.rArm = .1 + 2.5 * u;
        q.lElb = .05; q.rElb = .05;
        q.lean = -.05 * u; q.headTilt = -.12 * u;
        q.lKnee = q.rKnee = .06 * u; // 爪先立ちぎみ
        break;
      }
      case 'sleep': {
        // 居眠り: 3秒周期で頭がゆっくり落ちてハッと戻る
        const cyc = (tt % 3) / 3;
        const d = cyc < .7 ? Math.pow(cyc / .7, 2) : Math.max(0, 1 - (cyc - .7) / .3);
        q.headTilt = d * .4; q.bob = -d * .02; q.lean = d * .06;
        q.lArm = .06; q.rArm = .06; q.lElb = .1; q.rElb = .1;
        break;
      }
      case 'flip': {
        // 宙返り: Y反転は描画側の座標変換(cos(t*2.5))で行う。体は浮き上がり+脚タック
        const u = .5 + .5 * Math.sin(tt * 2.5);
        q.bob = .08 * u;
        q.lKnee = q.rKnee = .7 * u; q.lThigh = q.rThigh = -.15 * u;
        q.lArm = .5; q.rArm = .5; q.lElb = .4; q.rElb = .4;
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
    K.headC = [Math.sin(q.headTilt + (p.headTilt - .5) * .5) * headR, torsoTop + neck + headR];
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

  // 接地影: キャラクターを背景に「着地」させる最重要の合成要素。
  function contactShadow(ctx, cx, baseY, rx, alpha, col) {
    if (alpha <= 0 || rx <= 0) return;
    const g = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, rx);
    g.addColorStop(0, col || `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.translate(cx, baseY); ctx.scale(1, .24); ctx.translate(-cx, -baseY);
    ctx.beginPath(); ctx.arc(cx, baseY, rx, 0, 7); ctx.fill();
    ctx.restore();
  }

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * .6);
    ctx.bezierCurveTo(x - s * 1.1, y - s * .3, x - s * .55, y - s * 1.05, x, y - s * .35);
    ctx.bezierCurveTo(x + s * .55, y - s * 1.05, x + s * 1.1, y - s * .3, x, y + s * .6);
    ctx.closePath();
  }

  // 発光グロー: 色付きシルエットをぼかして背後に描く(全方位リムライト)
  function drawGlow(ctx, silCanvas, wPix, hPix, cx, baseY, strength) {
    if (strength <= 0) return;
    ctx.save();
    ctx.globalAlpha = strength * .55;
    ctx.filter = `blur(${Math.round(4 + strength * 14)}px)`;
    ctx.drawImage(silCanvas, cx - wPix * .56, baseY - hPix * 1.06, wPix * 1.12, hPix * 1.12);
    ctx.restore();
  }

  // 床の鏡面反射: 被写体を上下反転して足元の下に薄く描く。src はimg/canvas/video何でも可
  function drawReflection(ctx, src, cx, baseY, wPix, hPix, strength) {
    if (strength <= 0) return;
    ctx.save();
    ctx.globalAlpha = strength * .38;
    ctx.translate(cx, baseY);
    ctx.scale(1, -1);
    ctx.drawImage(src, -wPix / 2, -hPix, wPix, hPix);
    ctx.restore();
  }

  // ctx に (cx, baseY) を足元・高さ hPix で描画。q は mannequinPose の結果。
  function drawMannequin(ctx, p, t, cx, baseY, hPix) {
    const q = mannequinPose(p, t);
    const K = skeleton(p, q);
    const g = 1 - p.tone * .55; // tone: 0=白, 1=グレー
    // clothHue 0付近は無彩色(白モデル)のまま、上げると衣装色として着色
    const hue = Math.round(p.clothHue * 360), sat = p.clothHue < .03 ? 0 : 55;
    const col = `hsl(${hue},${sat}%,${Math.round(96 * g)}%)`;
    const shade = `hsl(${hue},${sat}%,${Math.round(85 * g)}%)`;
    const lw = (0.5 + p.line * 4);
    const px = (x, y) => [cx + (x + q.sway) * hPix, baseY - (y + q.bob) * hPix];
    const limbW = hPix * (.045 + .02 * p.shoulder);
    const bodyW = hPix * (.10 + .06 * p.shoulder);

    contactShadow(ctx, cx, baseY, hPix * (.16 + .07 * p.shoulder), p.shadow * .5, `hsla(${Math.round((p.shadowHue == null ? .62 : p.shadowHue) * 360)},45%,12%,${p.shadow * .5})`);

    ctx.save();
    ctx.globalAlpha = p.opacity;
    if (p.flip) { ctx.translate(2 * cx, 0); ctx.scale(-1, 1); }

    // ケープ: 肩から背後へなびく布(衣装色を濃くして継承)
    if (p.acc === 'cape') {
      const cs = `hsla(${hue},${Math.max(sat, 45)}%,${Math.round(38 + 12 * g)}%,0.95)`;
      const sw = (q.lean * 2 + Math.sin(t * 1.8) * .05) * hPix;
      const [lShx, lShy] = px(...K.lSh), [rShx, rShy] = px(...K.rSh), [pelx, pely] = px(...K.pelvis);
      ctx.fillStyle = cs;
      ctx.beginPath();
      ctx.moveTo(lShx, lShy);
      ctx.quadraticCurveTo(lShx - bodyW + sw, pely + hPix * .06, pelx + sw * 1.5, pely + hPix * .3);
      ctx.quadraticCurveTo(rShx + bodyW + sw, pely + hPix * .06, rShx, rShy);
      ctx.closePath(); ctx.fill();
    }

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
    // 髪: キャラクリの顔。hairHueで着色、hair形状は手続き描画
    const hs = p.hair || 'none';
    const hairC = `hsl(${Math.round(p.hairHue * 360)},50%,${Math.round(26 + 16 * g)}%)`;
    if (hs === 'long' || hs === 'twin' || hs === 'bob') {
      // 後ろ髪: 頭の背面へ垂れる髪を顔より先に描く
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.ellipse(hx, hy + hr * .5, hr * 1.22, hr * (hs === 'long' ? 1.55 : hs === 'bob' ? .95 : .75), 0, 0, 7);
      ctx.fill();
      if (hs === 'twin') for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(hx + s * hr * 1.18, hy + hr * .75, hr * .3, hr * .8, s * .4, 0, 7);
        ctx.fill();
      }
    }
    ctx.fillStyle = col;
    if (lw > 0) { ctx.strokeStyle = 'rgba(40,44,54,0.85)'; ctx.lineWidth = lw; }
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); ctx.fill();
    if (lw > 0) ctx.stroke();
    if (hs === 'ahoge') {
      // アホ毛: 頭頂から一本だけ跳ねた毛束
      ctx.strokeStyle = hairC; ctx.lineWidth = Math.max(1.5, hr * .09); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx + hr * .08, hy - hr * 1.02);
      ctx.quadraticCurveTo(hx + hr * .55, hy - hr * 1.9, hx + hr * .85, hy - hr * 1.35);
      ctx.stroke();
    }
    if (hs === 'mohawk') {
      // モヒカン: 頭頂の縦帯(前髪キャップは描かず剥ぎ感を出す)
      ctx.fillStyle = hairC;
      ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.05, hr * .24, hr * .5, 0, 0, 7); ctx.fill();
    }
    if (hs !== 'none' && hs !== 'mohawk') {
      // 前髪+キャップ: 頭の上半分を覆い、ギザギザ前髪で顔を残す
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.arc(hx, hy, hr * 1.1, Math.PI * 1.02, Math.PI * 1.98);
      ctx.lineTo(hx + hr * .95, hy - hr * .18);
      ctx.lineTo(hx + hr * .6, hy - hr * .38);
      ctx.lineTo(hx + hr * .22, hy - hr * .12);
      ctx.lineTo(hx - hr * .18, hy - hr * .38);
      ctx.lineTo(hx - hr * .55, hy - hr * .12);
      ctx.lineTo(hx - hr * .95, hy - hr * .38);
      ctx.closePath(); ctx.fill();
    }
    // eyes (素朴な2点、まばたきで縦につぶれる)
    // eyes: スタイル別(ふつう2点/ウィンク/うっとり^^/ハート)。dotのみ瞬きでつぶれる
    const eo = Math.max(.12, blinkOpen(t, p.seed));
    const eyeCol = `hsla(${Math.round(p.eyeHue * 360)},65%,42%,0.9)`;
    const es = p.eyeStyle || 'dot';
    const esz = .6 + p.eyeSize * .8; // 目の大きさスケール(0.6-1.4)
    for (const s of [-1, 1]) {
      const ex = hx + s * hr * (.26 + .24 * (p.eyeGap == null ? .5 : p.eyeGap)), ey = hy - hr * .08;
      if (es === 'closed' || (es === 'wink' && s === 1)) {
        ctx.strokeStyle = 'rgba(60,64,74,0.85)'; ctx.lineWidth = Math.max(1, hr * .08 * esz);
        ctx.beginPath(); ctx.arc(ex, ey, hr * .13 * esz, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
      } else if (es === 'sharp') {
        // キリッ目: 外側が上がった鋭角ライン(怒り/決意の表情)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = Math.max(1, hr * .07 * esz);
        ctx.beginPath();
        ctx.moveTo(ex + s * hr * .16 * esz, ey - hr * .05 * esz);
        ctx.lineTo(ex - s * hr * .16 * esz, ey + hr * .09 * esz);
        ctx.stroke();
      } else if (es === 'heart') {
        ctx.fillStyle = eyeCol; heartPath(ctx, ex, ey, hr * .15 * esz); ctx.fill();
      } else if (es === 'star') {
        // 星目: 5点スター(アイドル/魔法少女系の定番)
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        const sr = hr * .17 * esz;
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? sr * .45 : sr;
          const mx = ex + Math.cos(a) * rr, my2 = ey + Math.sin(a) * rr;
          k ? ctx.lineTo(mx, my2) : ctx.moveTo(mx, my2);
        }
        ctx.closePath(); ctx.fill();
      } else if (es === 'crying') {
        // 泣き目: ふつうの瞳 + 目尻側に涙滴(瞬きにも連動)
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        ctx.ellipse(ex, ey, Math.max(1, hr * .09 * esz), Math.max(.5, hr * .09 * esz * eo), 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = 'rgba(130,175,255,0.85)';
        const tx2 = ex + s * hr * .14, ty2 = ey + hr * .16;
        ctx.beginPath();
        ctx.moveTo(tx2, ty2 - hr * .05);
        ctx.quadraticCurveTo(tx2 + hr * .07, ty2 + hr * .02, tx2, ty2 + hr * .09);
        ctx.quadraticCurveTo(tx2 - hr * .07, ty2 + hr * .02, tx2, ty2 - hr * .05);
        ctx.fill();
      } else {
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        // gaze: 瞳を左右にずらす(目線)
        const gx = ex + ((p.gaze == null ? .5 : p.gaze) - .5) * hr * .3;
        ctx.ellipse(gx, ey, Math.max(1, hr * .09 * esz), Math.max(.5, hr * .09 * esz * eo), 0, 0, 7);
        ctx.fill();
        // 瞳のハイライト(キャッチライト): 生き生きした目にする白点
        if (eo > .4) {
          ctx.fillStyle = `rgba(255,255,255,${.85 * eo})`;
          ctx.beginPath();
          ctx.arc(gx - hr * .03 * esz, ey - hr * .035 * esz * eo, Math.max(.6, hr * .028 * esz), 0, 7);
          ctx.fill();
        }
      }
    }
    // 眉毛: brow<.5 で垂れ眉(困り) / >.5 で内側が下がるきりっと眉
    const bt = (p.brow - .5) * hr * .3;
    if (Math.abs(bt) > hr * .02) {
      ctx.strokeStyle = 'rgba(60,64,74,0.8)'; ctx.lineWidth = Math.max(1, hr * .07);
      for (const s of [-1, 1]) {
        const by = hy - hr * .36;
        ctx.beginPath();
        ctx.moveTo(hx + s * hr * .18, by + bt);
        ctx.lineTo(hx + s * hr * .56, by - bt * .3);
        ctx.stroke();
      }
    }
    // 頬の赤み
    if (p.blush > .02) {
      ctx.fillStyle = `rgba(255,120,140,${p.blush * .4})`;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(hx + s * hr * .55, hy + hr * .18, hr * .16, hr * .09, 0, 0, 7);
        ctx.fill();
      }
    }
    // mouth: smile .5=直線、>で笑顔・<でしかめ面
    const mw = hr * .32, my = hy + hr * .38, curv = (p.smile - .5) * hr * .8;
    if (Math.abs(curv) > hr * .03) {
      ctx.strokeStyle = 'rgba(60,64,74,0.7)'; ctx.lineWidth = Math.max(1, hr * .07);
      ctx.beginPath(); ctx.moveTo(hx - mw, my);
      ctx.quadraticCurveTo(hx, my + curv * 2, hx + mw, my); ctx.stroke();
    }
    // おしゃべり: 口が周期的に開閉(話している表情)
    if (p.anim === 'talk') {
      const mo = Math.abs(Math.sin(t * 5.5));
      ctx.fillStyle = `rgba(120,40,45,${.55 * mo})`;
      ctx.beginPath();
      ctx.ellipse(hx, my + curv * 1.1, mw * .45, Math.max(1, hr * .11 * mo), 0, 0, 7);
      ctx.fill();
    } else if (p.smile > .78) {
      // 大きな笑顔(smile>.78)では口を開いて赤味を見せる表情に
      const op = (p.smile - .78) / .22;
      ctx.fillStyle = `rgba(120,40,45,${.55 * op})`;
      ctx.beginPath();
      ctx.ellipse(hx, my + curv * 1.1, mw * .5, Math.max(1, hr * .1 * op), 0, 0, 7);
      ctx.fill();
    }
    drawAccessory(ctx, p.acc, hx, hy, hr, p.accHue);
    if (p.acc2 && p.acc2 !== 'none' && p.acc2 !== p.acc) drawAccessory(ctx, p.acc2, hx, hy, hr, p.accHue);
    ctx.restore();
  }

  // ふきだし: モデルの頭の上にセリフの吹き出しを描く(丸角矩形+尾)
  function drawBubble(c, text, x, topY, W, H, hue) {
    if (!text) return;
    const fs = Math.max(13, Math.round(H * .03));
    c.save();
    c.font = `600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`;
    const tw = Math.min(c.measureText(text).width, W * .6);
    const bw = tw + fs * 1.4, bh = fs * 2;
    const bx = Math.min(Math.max(x - bw / 2, 6), W - bw - 6);
    const by = Math.max(6, topY - bh - fs * 1.2);
    const r = fs * .5;
    c.fillStyle = `hsla(${Math.round((hue == null ? 0 : hue) * 360)},60%,96%,0.94)`;
    c.strokeStyle = 'rgba(40,44,54,0.8)'; c.lineWidth = Math.max(1, fs * .08);
    c.beginPath();
    c.moveTo(bx + r, by);
    c.lineTo(bx + bw - r, by); c.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    c.lineTo(bx + bw, by + bh - r); c.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    c.lineTo(bx + r, by + bh); c.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
    c.lineTo(bx, by + r); c.quadraticCurveTo(bx, by, bx + r, by);
    c.closePath();
    // 尾(モデル方向へ三角)
    const tx = Math.min(Math.max(x, bx + fs), bx + bw - fs);
    c.moveTo(tx - fs * .3, by + bh - 1);
    c.lineTo(tx + fs * .3, by + bh - 1);
    c.lineTo(x, topY - fs * .2);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#22252e';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, bx + bw / 2, by + bh / 2, tw + fs);
    c.restore();
  }

  // パーティクル: シーン全体の空気感エフェクト(雪/キラキラ/花びら)。seed決定論
  // 光沢: 白い帯が被写体を左→右にテカテカとスイープ(source-atopでシルエット内のみ)
  function shined(src, sctx, cv, t, amt) {
    cv.width = Math.max(2, src.width); cv.height = Math.max(2, src.height);
    sctx.clearRect(0, 0, cv.width, cv.height);
    sctx.drawImage(src, 0, 0, cv.width, cv.height);
    sctx.globalCompositeOperation = 'source-atop';
    const ph = ((t * .45) % 2) - .5;
    const gr = sctx.createLinearGradient(cv.width * (ph - .28), 0, cv.width * ph, cv.height * .65);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.5, `rgba(255,255,255,${.6 * amt})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = gr; sctx.fillRect(0, 0, cv.width, cv.height);
    sctx.globalCompositeOperation = 'source-over';
    return cv;
  }

  function drawParticles(ctx, W, H, type, t, seed) {
    const h = (i, k) => mulberry32((seed | 0) * 7919 + i * 131 + k)();
    const N = type === 'snow' ? 70 : type === 'petal' ? 34 : type === 'rain' ? 110 : type === 'leaf' ? 30 : type === 'ember' ? 38 : type === 'bubble' ? 28 : type === 'confetti' ? 70 : type === 'firefly' ? 26 : type === 'bokeh' ? 16 : 42;
    ctx.save();
    for (let i = 0; i < N; i++) {
      if (type === 'snow') {
        const x = h(i, 0) * W + Math.sin(t * .8 + h(i, 1) * 7) * W * .02;
        const y = ((h(i, 1) + t * (.04 + .06 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `rgba(255,255,255,${.4 + .5 * h(i, 4)})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + 2.5 * h(i, 3), 0, 7); ctx.fill();
      } else if (type === 'sparkle') {
        const a = .25 + .75 * Math.abs(Math.sin(t * (.8 + h(i, 2) * 2.2) + h(i, 3) * 7));
        const x = h(i, 0) * W, y = h(i, 1) * H, r = 2 + 4 * h(i, 4);
        ctx.strokeStyle = `rgba(255,230,140,${a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
      } else if (type === 'rain') {
        // 雨: 斜めの速いストリーク
        const x = (h(i, 0) + t * .3) % 1 * W;
        const y = ((h(i, 1) + t * (.5 + .3 * h(i, 2))) % 1) * H;
        ctx.strokeStyle = `rgba(160,190,235,${.3 + .35 * h(i, 4)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9 + 6 * h(i, 3)); ctx.stroke();
      } else if (type === 'leaf') {
        // 落ち葉: 揺れながら回転して舞い落ちる
        const x = h(i, 0) * W + Math.sin(t * .7 + h(i, 1) * 8) * W * .06;
        const y = ((h(i, 1) + t * (.04 + .03 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `hsla(${30 + 40 * h(i, 3)},60%,${35 + 25 * h(i, 4)}%,.8)`;
        ctx.beginPath();
        ctx.ellipse(x, y, 2.5 + 2.5 * h(i, 3), 1.2 + 1.2 * h(i, 3), Math.sin(t * 1.6 + i * 2) * 1.4, 0, 7);
        ctx.fill();
      } else if (type === 'ember') {
        // 火の粉: 揺らめきながら上昇
        const x = h(i, 0) * W + Math.sin(t * 1.4 + h(i, 1) * 9) * W * .04;
        const y = (1 - ((h(i, 1) + t * (.05 + .05 * h(i, 2))) % 1)) * H;
        const fl = .4 + .6 * Math.abs(Math.sin(t * 3 + i));
        ctx.fillStyle = `rgba(255,${120 + 80 * h(i, 3) | 0},60,${fl * .85})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + 1.8 * h(i, 3), 0, 7); ctx.fill();
      } else if (type === 'bubble') {
        // 泡: ゆらゆら上昇する泡(輪郭線)
        const x = h(i, 0) * W + Math.sin(t * .9 + h(i, 1) * 8) * W * .05;
        const y = (1 - ((h(i, 1) + t * (.04 + .04 * h(i, 2))) % 1)) * H;
        ctx.strokeStyle = `rgba(170,215,255,${.35 + .35 * h(i, 4)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 2 + 4 * h(i, 3), 0, 7); ctx.stroke();
      } else if (type === 'confetti') {
        // 紙吹雪: カラフルな長方形がひらひら回転しながら舞い落ちる
        const x = h(i, 0) * W + Math.sin(t * (1 + h(i, 2)) + h(i, 1) * 9) * W * .06;
        const y = ((h(i, 1) + t * (.1 + .09 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `hsla(${Math.round(h(i, 3) * 360)},85%,62%,${.6 + .3 * h(i, 4)})`;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3 + i * 2.7) * 2.4);
        ctx.fillRect(-2.5 - 2.5 * h(i, 4), -1.4, 5 + 5 * h(i, 4), 2.8);
        ctx.restore();
      } else if (type === 'firefly') {
        // ホタル: ぼんやり光りながら漂う(夜空・夕焼けと相性)
        const x = h(i, 0) * W + Math.sin(t * .5 + i * 1.7) * W * .07;
        const y = h(i, 1) * H * .85 + Math.cos(t * .4 + i * 2.3) * H * .05;
        const a = Math.max(0, .15 + .8 * Math.sin(t * (1.2 + h(i, 2)) + h(i, 3) * 9));
        ctx.fillStyle = `rgba(200,255,120,${a})`;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + 1.4 * h(i, 3), 0, 7); ctx.fill();
      } else if (type === 'bokeh') {
        // 光ボケ: 大きな柔らかい光玉がゆっくり昇る(写真のボケ表現)
        const x = h(i, 0) * W + Math.sin(t * .3 + i) * W * .03;
        const y = (1 - ((h(i, 1) + t * (.02 + .02 * h(i, 2))) % 1)) * H;
        ctx.fillStyle = `hsla(${Math.round(h(i, 3) * 360)},80%,75%,${.1 + .12 * h(i, 4)})`;
        ctx.beginPath(); ctx.arc(x, y, 8 + 22 * h(i, 3), 0, 7); ctx.fill();
      } else { // petal
        const x = h(i, 0) * W + Math.sin(t * .6 + h(i, 1) * 9) * W * .05;
        const y = ((h(i, 1) + t * (.03 + .03 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `rgba(255,170,190,${.55 + .3 * h(i, 4)})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + 3 * h(i, 3), 1.5 + 1.5 * h(i, 3), Math.sin(t * 2 + i) * 1.2, 0, 7);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // アクセサリ: キャラクリ定番の頭部装飾を手続き描画。accHue でアクセント色を着色
  function drawAccessory(ctx, acc, hx, hy, hr, hue) {
    const dk = 'rgba(52,56,68,0.95)', acc2 = `hsla(${Math.round((hue == null ? .58 : hue) * 360)},80%,64%,0.92)`;
    ctx.save();
    switch (acc) {
      case 'halo': {
        // 天使の輪: 頭上に浮く発光リング(accHueで着色、わずかに傾ける)
        ctx.strokeStyle = `hsla(${Math.round((hue == null ? .13 : hue) * 360)},85%,65%,0.95)`;
        ctx.lineWidth = Math.max(2, hr * .13);
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.5, hr * .62, hr * .17, -.06, 0, 7); ctx.stroke();
        break;
      }
      case 'ribbon': {
        ctx.fillStyle = acc2;
        const bx = hx - hr * .7, by = hy - hr * .75, s = hr * .42;
        for (const d of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + d * s, by - s * .6);
          ctx.lineTo(bx + d * s, by + s * .6);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(bx, by, s * .3, 0, 7); ctx.fill();
        break;
      }
      case 'hat': {
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * 1.25, hr * .22, 0, 0, 7); ctx.fill(); // brim
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .85, hr * .72, hr * .5, 0, Math.PI, 0); ctx.fill(); // dome
        ctx.fillStyle = acc2;
        ctx.fillRect(hx - hr * .72, hy - hr * .85, hr * 1.44, hr * .12); // band
        break;
      }
      case 'shades': {
        ctx.fillStyle = 'rgba(20,20,24,0.88)';
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.arc(hx + s * hr * .38, hy - hr * .08, hr * .26, 0, 7); ctx.fill();
          ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .07);
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.lineTo(hx + s * hr * .95, hy - hr * .18); ctx.stroke();
        }
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .07);
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .1); ctx.lineTo(hx + hr * .12, hy - hr * .1); ctx.stroke();
        break;
      }
      case 'glasses': {
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .07);
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.arc(hx + s * hr * .38, hy - hr * .08, hr * .26, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.lineTo(hx + s * hr * .95, hy - hr * .18); ctx.stroke(); // temple
        }
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .1); ctx.lineTo(hx + hr * .12, hy - hr * .1); ctx.stroke(); // bridge
        break;
      }
      case 'crown': {
        ctx.fillStyle = acc2;
        const cy = hy - hr * .62, cw = hr * .9;
        ctx.beginPath();
        ctx.moveTo(hx - cw, cy);
        for (let i = 0; i < 3; i++) {
          const px = hx - cw + (i * 2 + 1) * cw / 3;
          ctx.lineTo(px - cw / 3, cy - hr * .5);
          ctx.lineTo(px + cw / 3, cy);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = dk;
        ctx.fillRect(hx - cw, cy, cw * 2, hr * .14); // base band
        break;
      }
      case 'phones': {
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .1);
        ctx.beginPath(); ctx.arc(hx, hy - hr * .35, hr * .95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); // headband
        ctx.fillStyle = acc2;
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.ellipse(hx + s * hr * .95, hy - hr * .1, hr * .16, hr * .28, 0, 0, 7); ctx.fill(); // ear cups
        }
        break;
      }
      case 'beard': {
        ctx.fillStyle = 'rgba(70,60,52,0.88)';
        ctx.beginPath(); ctx.ellipse(hx, hy + hr * .55, hr * .62, hr * .5, 0, 0, 7); ctx.fill(); // 顎周り
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(hx, hy + hr * .38, hr * .28, hr * .12, 0, 0, 7); ctx.fill(); // 口元の隙間
        break;
      }
      case 'mask': {
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .12, hr * .92, hr * .34, 0, 0, 7); ctx.fill(); // 眼帯バンド
        ctx.fillStyle = '#fdfdfd';
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.ellipse(hx + s * hr * .4, hy - hr * .1, hr * .22, hr * .16, 0, 0, 7); ctx.fill(); // 目穴
        }
        break;
      }
      case 'flower': {
        // 花飾り: 頭の側面に5弁の花(accHueで花弁着色)
        const fx2 = hx + hr * .62, fy2 = hy - hr * .55, pr3 = hr * .16;
        ctx.fillStyle = acc2;
        for (let k = 0; k < 5; k++) {
          const a2 = k * Math.PI * 2 / 5;
          ctx.beginPath();
          ctx.ellipse(fx2 + Math.cos(a2) * pr3 * 1.15, fy2 + Math.sin(a2) * pr3 * 1.15, pr3, pr3 * .58, a2, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = 'hsla(50,90%,60%,0.95)';
        ctx.beginPath(); ctx.arc(fx2, fy2, pr3 * .45, 0, 7); ctx.fill(); // しべ
        break;
      }
    }
    ctx.restore();
  }

  return {
    clamp01, lerp, mulberry32, strSeed, ANIMS, FITS, ACCS, BGS, EYES, NUM_KEYS, SLIDERS,
    defaultParams, clampParams, randomParams, drawBubble,
    serializePreset, parsePreset, parseFavList,
    keyAlpha, erodeAlpha, despill, blinkOpen, drawParticles, contactShadow, drawCastShadow, drawRimLight, drawStickerOutline, drawVignette, drawWatermark, drawReflection, drawGlow, mannequinPose, skeleton, drawMannequin, drawAccessory, shined,
    MIME_CANDIDATES, pickMime,
  };
})();
if (typeof globalThis !== 'undefined') globalThis.ShiroLib = ShiroLib;

// ============================== UI ==============================
if (typeof document !== 'undefined') (() => {
  const L = ShiroLib;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), ctx = stage.getContext('2d');
  let W = stage.width, H = stage.height;
  const err = m => { $('err').textContent = m || ''; };

  const state = {
    params: L.defaultParams(),
    bg: null,               // HTMLImageElement
    media: null,            // {kind:'image'|'video', el}
    favs: loadFavs(),
    keySrc: null, keyParams: '',
    recorder: null, recTimer: 0,
    frozenT: null,           // アニメ一時停止時の固定時刻(null=再生中)
  };

  // ---------- backdrop / model source ----------
  function defaultBackdrop(c) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a3550'); g.addColorStop(.6, '#3b4a6b'); g.addColorStop(1, '#1d2230');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function drawCover(c, img, fit, blurPx, sat, con, offX, offY, zoom = 0) {
    const iw = img.naturalWidth || img.videoWidth, ih = img.naturalHeight || img.videoHeight;
    if (!iw || !ih) return;
    const s = (fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih)) * (1 + zoom);
    const dw = iw * s, dh = ih * s;
    const f = `blur(${blurPx}px) saturate(${sat}) contrast(${con})`;
    if (f !== 'blur(0px) saturate(1) contrast(1)') c.filter = f;
    // 背景位置オフセット: 被写体に合わせて構図をずらす
    c.drawImage(img, (W - dw) / 2 + (offX - .5) * W, (H - dh) / 2 + (offY - .5) * H, dw, dh);
    c.filter = 'none';
  }

  // 背景グレーディング: 被写体を際立たせるため背景をぼかし・減光する(合成定番)
  // 画像なし時はプリセット背景: gradient=内蔵/green=グリーンスクリーン/white=白/transparent=透過PNG用
  function drawBackdrop(c, p, t) {
    if (state.bg) {
      // 背景のゆっくりズーム(Ken Burns): 1→1+bgDrift*.15 をゆるく往復
      const z = p.bgDrift * .15 * (.5 + .5 * Math.sin(t * .12));
      drawCover(c, state.bg, p.bgFit, p.bgBlur * 10, p.bgSat * 2, .5 + p.bgContrast, p.bgX, p.bgY, z);
      if (p.bgDim > 0) { c.fillStyle = `rgba(8,10,16,${p.bgDim * .55})`; c.fillRect(0, 0, W, H); }
      return;
    }
    const pr = p.bgPreset || 'gradient';
    if (pr === 'transparent') return; // アルファを残す(ディムもかけない)
    if (p.bgBlur > 0) c.filter = `blur(${p.bgBlur * 10}px)`;
    if (pr === 'green') { c.fillStyle = '#00b140'; c.fillRect(0, 0, W, H); }
    else if (pr === 'white') { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); }
    else if (pr === 'sunset') {
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2b2f6e'); gr.addColorStop(.55, '#c9526a'); gr.addColorStop(1, '#ffb56b');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,190,90,0.92)';
      c.beginPath(); c.arc(W * .5, H * .6, H * .15, 0, 7); c.fill(); // 夕日
    } else if (pr === 'night') {
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0a0d24'); gr.addColorStop(1, '#1c2347');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(999);
      for (let i = 0; i < 90; i++) {
        const sx = rng() * W, sy = rng() * H * .85, sr = rng() * 1.4 + .4;
        const tw = .3 + .65 * Math.abs(Math.sin(t * (.4 + rng() * 1.6) + rng() * 9));
        c.fillStyle = `rgba(255,255,255,${tw})`;
        c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(240,240,220,0.95)';
      c.beginPath(); c.arc(W * .8, H * .18, H * .07, 0, 7); c.fill(); // 月
    } else if (pr === 'spot') {
      c.fillStyle = '#0b0c10'; c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(W * .5, H * .86, 10, W * .5, H * .86, W * .5);
      g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(W * .44, 0); c.lineTo(W * .56, 0); c.lineTo(W * .9, H * .95); c.lineTo(W * .1, H * .95);
      c.closePath(); c.fill();
      c.beginPath(); c.ellipse(W * .5, H * .88, W * .28, H * .07, 0, 0, 7); c.fill(); // 床の光り輪
    } else if (pr === 'sky') {
      // 青空: 晴れの空 + ゆっくり流れる雲(手続き描画)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2e7bd6'); gr.addColorStop(1, '#a8d4f0');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(77);
      for (let i = 0; i < 5; i++) {
        const bx = rng(), sp = .008 + .01 * rng(), cy = H * (.05 + rng() * .45);
        const cxx = ((bx + t * sp) % 1) * W;
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (let k = -1; k <= 1; k++) {
          c.beginPath();
          c.ellipse(cxx + k * W * .05, cy + (k === 0 ? -H * .014 : 0), W * (.045 + .018 * rng()), H * .028, 0, 0, 7);
          c.fill();
        }
      }
    } else defaultBackdrop(c);
    c.filter = 'none';
    if (p.bgDim > 0) { c.fillStyle = `rgba(8,10,16,${p.bgDim * .55})`; c.fillRect(0, 0, W, H); }
  }

  // ---------- silhouettes for cast shadows ----------
  const shCv = document.createElement('canvas'), shCtx = shCv.getContext('2d');
  const modCv = document.createElement('canvas'), mctx = modCv.getContext('2d');
  const rimCv = document.createElement('canvas'), rimCtx = rimCv.getContext('2d');
  const outCv = document.createElement('canvas'), outCtx = outCv.getContext('2d');
  const pixCv = document.createElement('canvas'), pctx = pixCv.getContext('2d');
  const glowCv = document.createElement('canvas'), glowCtx = glowCv.getContext('2d');
  // cacheable=true で (src,サイズ,色) 不変なら再描画をスキップ — 静止画の3回シルエット生成を1回に
  function silhouetteOf(src, w, h, color, cv, cctx, cacheable) {
    cv = cv || shCv; cctx = cctx || shCtx;
    const col = color || '#0a0a0e';
    if (cacheable && cv._src === src && cv._srcv === (src._v || null) && cv._col === col && cv.width === w && cv.height === h) return cv;
    cv._src = cacheable ? src : null; cv._srcv = cacheable ? (src._v || null) : null; cv._col = cacheable ? col : null;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cctx.clearRect(0, 0, w, h);
    cctx.globalCompositeOperation = 'source-over';
    cctx.drawImage(src, 0, 0, w, h);
    cctx.globalCompositeOperation = 'source-in';
    cctx.fillStyle = color || '#0a0a0e'; cctx.fillRect(0, 0, w, h);
    cctx.globalCompositeOperation = 'source-over';
    return cv;
  }

  // ---------- chroma-keyed media ----------
  const keyCv = document.createElement('canvas'), kctx = keyCv.getContext('2d', { willReadFrequently: true });
  function keyedMediaCanvas() {
    const el = state.media.el;
    const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih || el.readyState < 2) return null;
    const cacheKey = `${iw}x${ih}|${state.params.keyThresh}|${state.params.keySoft}|${state.params.despill}`;
    if (state.media.kind === 'image' && state.keyParams === cacheKey) return keyCv;
    const scale = Math.min(1, 960 / iw);
    const kw = Math.round(iw * scale), kh = Math.round(ih * scale);
    if (keyCv.width !== kw || keyCv.height !== kh) { keyCv.width = kw; keyCv.height = kh; }
    kctx.drawImage(el, 0, 0, kw, kh);
    if (state.params.keyThresh > 0) {
      const im = kctx.getImageData(0, 0, kw, kh), d = im.data;
      for (let i = 0; i < d.length; i += 4)
        d[i + 3] = Math.min(d[i + 3], L.keyAlpha(d[i], d[i + 1], d[i + 2], state.params.keyThresh, state.params.keySoft));
      L.erodeAlpha(d, kw, kh); // 白フリンジ残りを1px削る
      L.despill(d, state.params.despill); // エッジの白混じり彩度を落とす
      kctx.putImageData(im, 0, 0);
    }
    keyCv._v = cacheKey; // silhouetteOfキャッシュの内容版
    if (state.media.kind === 'image') state.keyParams = cacheKey;
    return keyCv;
  }
  const shnCv = document.createElement('canvas'), snc = shnCv.getContext('2d');
  function drawMedia(c, t) {
    const el = state.media.el;
    const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih) return;
    const src = state.params.keyThresh > 0 ? keyedMediaCanvas() : el;
    if (!src) return;
    const sw = src.width || iw, sh = src.height || ih;
    const hPix = H * (0.25 + 0.7 * state.params.scale);
    const wPix = hPix * (sw / sh);
    const cx = state.params.x * W, baseY = state.params.y * H;
    L.contactShadow(c, cx, baseY, wPix * .55, state.params.shadow * .5, `hsla(${Math.round(state.params.shadowHue * 360)},45%,12%,${state.params.shadow * .5})`);
    const silCache = state.media.kind === 'image';
    const glowCol = `hsla(${Math.round(state.params.glowHue * 360)},90%,70%,1)`;
    L.drawGlow(c, silhouetteOf(src, sw, sh, glowCol, glowCv, glowCtx, silCache), wPix, hPix, cx, baseY, state.params.glow);
    L.drawCastShadow(c, silhouetteOf(src, sw, sh, `hsla(${Math.round(state.params.shadowHue * 360)},45%,12%,1)`, null, null, silCache), wPix, hPix, cx, baseY, state.params.castDir, state.params.shadow * .4, state.params.shadowSoft);
    L.drawRimLight(c, silhouetteOf(src, sw, sh, `hsla(${Math.round(state.params.rimHue * 360)},75%,72%,1)`, rimCv, rimCtx, silCache), wPix, hPix, cx, baseY, state.params.castDir, state.params.rim);
    L.drawStickerOutline(c, silhouetteOf(src, sw, sh, `hsla(${Math.round(state.params.outlineHue * 360)},70%,80%,1)`, outCv, outCtx, silCache), wPix, hPix, cx, baseY, state.params.outline);
    L.drawReflection(c, src, cx, baseY, wPix, hPix, state.params.reflect);
    if (state.media.kind === 'video') el.playbackRate = .25 + state.params.vidSpeed * 1.5;
    c.save();
    c.globalAlpha = state.params.opacity;
    const fParts = [];
    if (state.params.subjHue !== .5) fParts.push(`hue-rotate(${Math.round((state.params.subjHue - .5) * 360)}deg)`);
    if (state.params.subjSat !== .5) fParts.push(`saturate(${(state.params.subjSat * 2).toFixed(2)})`);
    if (state.params.subjBright !== .5) fParts.push(`brightness(${(0.7 + state.params.subjBright * .6).toFixed(2)})`);
    if (state.params.temp !== .5) fParts.push(`sepia(${Math.abs(state.params.temp - .5) * .8}) hue-rotate(${(state.params.temp - .5) * -40}deg)`);
    if (state.params.subjFx !== 'none') fParts.push(SUBJFX_FILTERS[state.params.subjFx]);
    if (fParts.length) c.filter = fParts.join(' ');
    if (state.params.blend !== 'none') c.globalCompositeOperation = state.params.blend;
    if (state.params.flip) { c.translate(2 * cx, 0); c.scale(-1, 1); }
    // ピクセル化: 小さく引き延ばしてからスムージングなしで拡大
    let drawSrc = src;
    if (state.params.pixel > .05) {
      const cell = 1 + state.params.pixel * 24;
      const pw = Math.max(2, Math.round(wPix / cell)), ph2 = Math.max(2, Math.round(hPix / cell));
      pixCv.width = pw; pixCv.height = ph2;
      pctx.imageSmoothingEnabled = true;
      pctx.clearRect(0, 0, pw, ph2);
      pctx.drawImage(src, 0, 0, pw, ph2);
      c.imageSmoothingEnabled = false;
      drawSrc = pixCv;
    }
    c.drawImage(state.params.shine > .02 ? L.shined(drawSrc, snc, shnCv, t, state.params.shine) : drawSrc, cx - wPix / 2, baseY - hPix, wPix, hPix);
    c.restore();
  }

  // ---------- film grain ----------
  let _grainCv = null;
  function grainCv() {
    if (_grainCv) return _grainCv;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d'), im = x.createImageData(128, 128), d = im.data;
    const rng = L.mulberry32(12345);
    for (let i = 0; i < d.length; i += 4) {
      const v = 110 + rng() * 90;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return _grainCv = cv;
  }

  // ---------- render loop ----------
  const t0 = performance.now();
  function frame() {
    const liveT = (performance.now() - t0) / 1000;
    const p = state.params;
    // ポーズ固定中は tOffset で前後4秒のフレームをスクラブできる
    const t = state.frozenT !== null ? state.frozenT + (p.tOffset - .5) * 4 : liveT;
    ctx.clearRect(0, 0, W, H);
    // 手持ちカメラ: シーン全体を微小ランダム平行移動(少し拡大して端の空白を隠す)
    const shaking = p.shake > 0 || p.camZoom > .02;
    if (shaking) {
      // シーンズーム: ゆっくり呼吸するような拡縮(動画映え演出)
      const os = 1 + p.shake * .04 + Math.sin(t * .6) * p.camZoom * .22;
      ctx.save();
      ctx.translate(W / 2 + (Math.random() - .5) * p.shake * 16, H / 2 + (Math.random() - .5) * p.shake * 16);
      ctx.scale(os, os);
      ctx.translate(-W / 2, -H / 2);
    }
    drawBackdrop(ctx, p, t);
    // モデルの傾き + 回転(spin) + つぶし・伸び(squash): 被写体を足元支点に変形(影等も一体)
    const rotA = (p.rot - .5) * .6;
    const spinX = p.anim === 'spin' ? Math.cos(t * 2.5) : 1;
    const flipY = p.anim === 'flip' ? Math.cos(t * 2.5) : 1; // 宙返り: 負になると上下反転=バク転
    const sq = p.squash > .02 ? Math.sin(t * 3) * p.squash : 0;
    const sxx = (1 + sq * .18) * spinX, syy = (1 - sq * .22) * flipY;
    const xformed = Math.abs(rotA) > .001 || Math.abs(sxx - 1) > .001 || Math.abs(syy - 1) > .001;
    if (state.media && xformed) {
      ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(rotA); ctx.scale(sxx, syy); ctx.translate(-p.x * W, -p.y * H);
    }
    if (state.media) drawMedia(ctx, t);
    else {
      const hPix = H * (0.25 + 0.7 * p.scale), wPix = hPix * .55;
      // 歩行アニメはステージを横断してループ(反転で歩行方向を変える)
      let cx = p.x * W;
      if (p.anim === 'walk' || p.anim === 'run') {
        const spd = p.anim === 'run' ? .2 : .10;
        const ph = (t * spd * (0.5 + p.animSpeed) + .125) % 1.25;
        cx = (p.flip ? 1.125 - ph : -.125 + ph) * W;
      }
      const baseY = p.y * H;
      if (xformed) {
        ctx.save(); ctx.translate(cx, baseY); ctx.rotate(rotA); ctx.scale(sxx, syy); ctx.translate(-cx, -baseY);
      }
      // 相方(duo): 後ろに小さく反転した2体目を描いてから本体
      if (p.duo > .05) {
        const p2 = { ...p, opacity: p.opacity * .7, flip: !p.flip };
        ctx.save();
        L.drawMannequin(ctx, p2, t * .9 + 2.3, cx + wPix * .55 * (p.flip ? -1 : 1), baseY, hPix * (.55 + p.duo * .35));
        ctx.restore();
      }
      // マネキンをオフスクリーンに描き、シルエット化して影/リムに利用
      if ((Math.abs(p.castDir - .5) >= .03 && p.shadow > 0) || p.rim > 0 || p.outline > 0 || p.reflect > 0 || p.glow > 0 || p.shine > .02) {
        modCv.width = Math.ceil(wPix); modCv.height = Math.ceil(hPix);
        mctx.clearRect(0, 0, modCv.width, modCv.height);
        L.drawMannequin(mctx, p, t, modCv.width / 2, modCv.height, modCv.height);
        L.drawGlow(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.glowHue * 360)},90%,70%,1)`, glowCv, glowCtx), wPix, hPix, cx, baseY, p.glow);
        L.drawCastShadow(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.shadowHue * 360)},45%,12%,1)`), wPix, hPix, cx, baseY, p.castDir, p.shadow * .4, p.shadowSoft);
        L.drawRimLight(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.rimHue * 360)},75%,72%,1)`, rimCv, rimCtx), wPix, hPix, cx, baseY, p.castDir, p.rim);
        L.drawStickerOutline(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.outlineHue * 360)},70%,80%,1)`, outCv, outCtx), wPix, hPix, cx, baseY, p.outline);
        L.drawReflection(ctx, modCv, cx, baseY, wPix, hPix, p.reflect);
      }
      if (p.pixel > .05) {
        // ピクセル化: 手続きモデルを小さく描いてスムージングなしで拡大
        const cell = 1 + p.pixel * 24;
        const pw = Math.max(2, Math.round(wPix / cell)), ph2 = Math.max(2, Math.round(hPix / cell));
        pixCv.width = pw; pixCv.height = ph2;
        pctx.clearRect(0, 0, pw, ph2);
        L.drawMannequin(pctx, p, t, pw / 2, ph2, ph2);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pixCv, cx - wPix / 2, baseY - hPix, wPix, hPix);
        ctx.restore();
      } else {
        // 残像トレイル: 過去フレームのポーズを薄く残す(マネキンのみ・手続き描画なので安い)
        const fxParts = [];
        if (p.subjSat !== .5) fxParts.push(`saturate(${(p.subjSat * 2).toFixed(2)})`);
        if (p.subjBright !== .5) fxParts.push(`brightness(${(0.7 + p.subjBright * .6).toFixed(2)})`);
        if (p.temp !== .5) fxParts.push(`sepia(${Math.abs(p.temp - .5) * .8}) hue-rotate(${(p.temp - .5) * -40}deg)`);
        if (p.subjFx !== 'none') fxParts.push(SUBJFX_FILTERS[p.subjFx]);
        const fx = fxParts.join(' ');
        if (fx) ctx.filter = fx;
        if (p.blend !== 'none') ctx.globalCompositeOperation = p.blend;
        if (p.trail > 0) {
          for (let i = 2; i >= 1; i--) {
            ctx.globalAlpha = p.trail * .45 * (3 - i) / 3;
            L.drawMannequin(ctx, p, t - i * .09, cx, baseY, hPix);
          }
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = p.opacity;
        if (p.shine > .02) {
          ctx.drawImage(L.shined(modCv, snc, shnCv, t, p.shine), cx - wPix / 2, baseY - hPix, wPix, hPix);
        } else {
          L.drawMannequin(ctx, p, t, cx, baseY, hPix);
        }
        ctx.globalAlpha = 1;
        if (p.blend !== 'none') ctx.globalCompositeOperation = 'source-over';
        if (fx) ctx.filter = 'none';
      }
      // ふきだし: 頭頂の少し上に表示(回転の内側・本体と一緒に傾く)
      if (p.bubble) L.drawBubble(ctx, p.bubble, cx, baseY - hPix * 1.02, W, H, p.bubbleHue);
      if (xformed) ctx.restore();
    }
    if (state.media && xformed) ctx.restore();
    if (p.particles !== 'none') L.drawParticles(ctx, W, H, p.particles, t, p.seed);
    // シーン全体の色調(グレード)。ウォーターマークより下に適用して文字は鮮明に残す
    const gs = GRADE_STYLES[p.grade];
    if (gs) {
      ctx.globalCompositeOperation = gs[0];
      ctx.fillStyle = gs[1];
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (shaking) ctx.restore();
    if (p.grain > 0) {
      ctx.save();
      ctx.globalAlpha = p.grain * .15;
      // オフセットをフレーム毎にずらして動くグレインに
      ctx.drawImage(grainCv(), -Math.random() * 64, -Math.random() * 64, W + 128, H + 128);
      ctx.restore();
    }
    if (p.title) { // サムネイル向け大見出し(上部中央・白抜き太字)
      const fs = 18 + p.titleSize * 66;
      ctx.save();
      ctx.font = `700 ${Math.round(fs)}px 'Hiragino Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(2, fs * .14); ctx.strokeStyle = 'rgba(0,0,0,.78)';
      ctx.lineJoin = 'round';
      ctx.strokeText(p.title, W / 2, H * .12);
      ctx.fillStyle = `hsl(${Math.round(p.titleHue * 360)},75%,85%)`;
      ctx.fillText(p.title, W / 2, H * .12);
      ctx.restore();
    }
    L.drawVignette(ctx, W, H, p.vignette);
    if (p.frame > .02) { // 額縁: ポラロイド/ポストカード風の枠線を最前面に
      const b = 4 + p.frame * 44;
      ctx.fillStyle = `hsla(${Math.round(p.frameHue * 360)},45%,${p.frameHue < .08 ? 14 : 90}%,0.96)`;
      ctx.beginPath();
      ctx.rect(0, 0, W, H); ctx.rect(b, b, W - 2 * b, H - 2 * b);
      ctx.fill('evenodd');
    }
    L.drawWatermark(ctx, p.watermark, W, H, p.wmOpacity, p.wmPos);
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
    // ダブルクリックでその項目だけ初期値に戻す(キャラクリ系UIの定番)
    inp.addEventListener('dblclick', () => { state.params[key] = L.defaultParams()[key]; syncUI(false); });
    sDiv.appendChild(lab); sDiv.appendChild(inp);
  }
  function syncUI(fromParams = true) {
    touch();
    for (const [key] of L.SLIDERS) {
      if (fromParams) $('sl-' + key).value = state.params[key];
      $('out-' + key).textContent = (+state.params[key]).toFixed(2);
    }
    if (fromParams) {
      $('sel-anim').value = state.params.anim;
      $('sel-acc').value = state.params.acc;
      $('sel-eyes').value = state.params.eyeStyle;
      $('sel-fx').value = state.params.subjFx;
      $('sel-grade').value = state.params.grade;
      $('sel-blend').value = state.params.blend;
      $('sel-bgfit').value = state.params.bgFit;
      $('sel-bgpreset').value = state.params.bgPreset;
      $('sel-particles').value = state.params.particles;
      $('sel-wmpos').value = state.params.wmPos;
      $('sel-hair').value = state.params.hair;
      $('sel-vidq').value = state.params.vidQ;
      $('sel-acc2').value = state.params.acc2;
      $('chk-flip').checked = state.params.flip;
      $('inp-watermark').value = state.params.watermark;
      $('inp-bubble').value = state.params.bubble;
      $('inp-title').value = state.params.title;
    }
  }
  $('sel-anim').addEventListener('change', e => { state.params.anim = e.target.value; touch(); });
  $('sel-acc').addEventListener('change', e => { state.params.acc = e.target.value; touch(); });
  $('sel-acc2').addEventListener('change', e => { state.params.acc2 = e.target.value; touch(); });
  $('sel-eyes').addEventListener('change', e => { state.params.eyeStyle = e.target.value; touch(); });
  $('sel-fx').addEventListener('change', e => { state.params.subjFx = e.target.value; touch(); });
  $('sel-grade').addEventListener('change', e => { state.params.grade = e.target.value; touch(); });
  $('sel-blend').addEventListener('change', e => { state.params.blend = e.target.value; touch(); });
  $('sel-bgfit').addEventListener('change', e => { state.params.bgFit = e.target.value; touch(); });
  $('sel-bgpreset').addEventListener('change', e => { state.params.bgPreset = e.target.value; touch(); });
  $('sel-particles').addEventListener('change', e => { state.params.particles = e.target.value; touch(); });
  $('sel-wmpos').addEventListener('change', e => { state.params.wmPos = e.target.value; touch(); });
  $('sel-hair').addEventListener('change', e => { state.params.hair = e.target.value; touch(); });
  $('sel-vidq').addEventListener('change', e => { state.params.vidQ = e.target.value; touch(); });
  $('chk-flip').addEventListener('change', e => { state.params.flip = e.target.checked; touch(); });
  $('chk-guides').addEventListener('change', e => $('guides').classList.toggle('on', e.target.checked));
  $('inp-watermark').addEventListener('input', e => { state.params.watermark = e.target.value.slice(0, 60); touch(); });
  $('inp-bubble').addEventListener('input', e => { state.params.bubble = e.target.value.slice(0, 24); touch(); });
  $('inp-title').addEventListener('input', e => { state.params.title = e.target.value.slice(0, 40); touch(); });
  // 配置プリセット: モデルを9アンカーへ一発移動
  const PLACES = {
    tl: [.2, .62], tc: [.5, .62], tr: [.8, .62],
    ml: [.2, .84], center: [.5, .84], mr: [.8, .84],
    bl: [.2, .97], bc: [.5, .97], br: [.8, .97],
  };
  $('sel-place').addEventListener('change', e => {
    const pt = PLACES[e.target.value]; e.target.value = '';
    if (!pt) return;
    state.params.x = pt[0]; state.params.y = pt[1]; syncUI();
  });
  // 表情プリセット: 目+口+眉を一発切替(配置プリセット同様非保持)
  const FACES = {
    happy: { eyeStyle: 'closed', smile: .95, brow: .7 },
    surprise: { eyeStyle: 'dot', smile: .9, brow: .9 },
    angry: { eyeStyle: 'sharp', smile: .15, brow: .15 },
    sleepy: { eyeStyle: 'closed', smile: .45, brow: .5 },
    wink: { eyeStyle: 'wink', smile: .8, brow: .6 },
    cry: { eyeStyle: 'crying', smile: .15, brow: .1 },
  };
  $('sel-face').addEventListener('change', e => {
    const f = FACES[e.target.value]; e.target.value = '';
    if (!f) return;
    Object.assign(state.params, f); syncUI();
  });
  $('chk-freeze').addEventListener('change', e => {
    // 撮影用ポーズ固定: アニメーション時間を現在値で止める(動画素材も一時停止)
    state.frozenT = e.target.checked ? (performance.now() - t0) / 1000 : null;
    const v = state.media && state.media.kind === 'video' ? state.media.el : null;
    if (v) e.target.checked ? v.pause() : v.play().catch(() => {});
    const bv = state.bg && state.bg.tagName === 'VIDEO' ? state.bg : null;
    if (bv) e.target.checked ? bv.pause() : bv.play().catch(() => {});
  });

  $('btn-random').addEventListener('click', () => {
    state.params = L.randomParams(L.mulberry32((Math.random() * 4294967296) >>> 0));
    syncUI();
  });
  $('btn-reset').addEventListener('click', () => { state.params = L.defaultParams(); syncUI(); });

  // ---------- file inputs ----------
  function readURL(file) { return URL.createObjectURL(file); }
  $('bg-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.src = readURL(f);
      v.onloadeddata = () => { v.play().catch(() => {}); state.bg = v; err(''); };
      v.onerror = () => err('背景動画を読み込めませんでした(mp4/webm/mov 等を確認)');
    } else {
      const img = new Image();
      img.onload = () => { state.bg = img; err(''); };
      img.onerror = () => err('背景画像を読み込めませんでした');
      img.src = readURL(f);
    }
    e.target.value = '';
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
    stage.toBlob(b => b ? download(b, `shiro-s${state.params.seed}.png`) : err('PNG生成に失敗'), 'image/png'));
  $('btn-png-copy').addEventListener('click', () => {
    if (!navigator.clipboard || !window.ClipboardItem) return err('このブラウザはコピーに未対応です');
    stage.toBlob(async b => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
        const t = $('btn-png-copy'); t.textContent = 'コピーしました'; setTimeout(() => t.textContent = 'PNGをコピー', 1500);
      } catch (e) { err('コピーに失敗しました(ブラウザ権限を確認)'); }
    }, 'image/png');
  });
  // 録画はトグル式: クリックで開始、再クリックまたは15秒で停止
  $('btn-rec').addEventListener('click', () => {
    if (state.recorder) { state.recorder.stop(); return; }
    const pick = L.pickMime(m => MediaRecorder.isTypeSupported(m));
    if (!pick) return err('このブラウザは動画録画に未対応です');
    const bits = { low: 1500000, std: 4000000, high: 8000000 }[state.params.vidQ] || 4000000;
    const rec = new MediaRecorder(stage.captureStream(30), { mimeType: pick.mime, videoBitsPerSecond: bits });
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      state.recorder = null;
      clearTimeout(state.recTimer);
      download(new Blob(chunks, { type: pick.mime }), 'shiro.' + pick.ext);
      $('btn-rec').textContent = '動画 録画開始';
    };
    state.recorder = rec; rec.start();
    $('btn-rec').textContent = '録画中… クリックで停止';
    state.recTimer = setTimeout(() => state.recorder && state.recorder.stop(), 15000);
  });
  $('btn-share').addEventListener('click', async () => {
    try {
      const blob = await new Promise(r => stage.toBlob(r, 'image/png'));
      const file = new File([blob], 'shiro.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }))
        await navigator.share({ files: [file], title: 'Shiro' });
      else download(blob, 'shiro.png');
    } catch (e) { if (e.name !== 'AbortError') err('共有に失敗: ' + e.message); }
  });

  // ---------- favorites ----------
  const FKEY = 'shiro.favs.v1';
  function loadFavs() {
    try { return L.parseFavList(localStorage.getItem(FKEY) || '[]'); }
    catch { return []; }
  }
  function saveFavs() { localStorage.setItem(FKEY, JSON.stringify(state.favs)); }
  function renderFavs() {
    const bar = $('fav-bar'); bar.innerHTML = '';
    for (const f of state.favs) {
      const d = document.createElement('div'); d.className = 'fav';
      d.title = f.name;
      d.draggable = true;
      d.innerHTML = `<img alt=""><span></span><button class="del" title="削除">×</button>`;
      d.querySelector('img').src = f.thumb || '';
      d.querySelector('span').textContent = f.name;
      d.addEventListener('click', () => { state.params = L.clampParams(f.params); syncUI(); });
      // ドラッグで並べ替え
      d.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', f.id); ev.dataTransfer.effectAllowed = 'move'; });
      d.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
      d.addEventListener('drop', ev => {
        ev.preventDefault();
        const id = ev.dataTransfer.getData('text/plain');
        if (!id || id === f.id) return;
        const from = state.favs.findIndex(x => x.id === id), to = state.favs.findIndex(x => x.id === f.id);
        if (from < 0 || to < 0) return;
        const [mv] = state.favs.splice(from, 1);
        state.favs.splice(to, 0, mv);
        saveFavs(); renderFavs();
      });
      d.querySelector('span').addEventListener('dblclick', ev => {
        ev.stopPropagation();
        const n = prompt('新しい名前', f.name);
        if (n !== null) { f.name = n || f.name; saveFavs(); renderFavs(); }
      });
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
    c.getContext('2d').drawImage(stage, 0, 0, 110, 62);
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

  // ---------- canvas direct manipulation ----------
  // キャンバス上のドラッグでモデル位置、ホイールで倍率を直接操作する。
  let dragging = false;
  const stageXY = e => {
    const r = stage.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  stage.addEventListener('pointerdown', e => {
    dragging = true; stage.setPointerCapture(e.pointerId);
    const [nx, ny] = stageXY(e);
    state.params.x = L.clamp01(nx); state.params.y = L.clamp01(ny); syncUI();
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const [nx, ny] = stageXY(e);
    state.params.x = L.clamp01(nx); state.params.y = L.clamp01(ny); syncUI();
  });
  stage.addEventListener('pointerup', () => dragging = false);
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    state.params.scale = L.clamp01(state.params.scale - e.deltaY * .0008);
    syncUI();
  }, { passive: false });

  // ---------- share code ----------
  $('btn-code-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(L.serializePreset('shared', state.params)); err(''); }
    catch { err('コピーに失敗しました(ブラウザのクリップボード権限を確認)'); }
  });
  $('btn-code-load').addEventListener('click', () => {
    const txt = prompt('パラメータコードを貼り付け');
    if (txt === null) return;
    try { state.params = L.parsePreset(txt).params; syncUI(); err(''); }
    catch { err('コードを読み込めませんでした'); }
  });

  // ---------- aspect presets ----------
  const ASPECTS = { '16:9': [1280, 720], '1:1': [960, 960], '9:16': [720, 1280] };
  function applyAspect(v) {
    const [w, h] = ASPECTS[v] || ASPECTS['16:9'];
    stage.width = w; stage.height = h; W = w; H = h;
  }
  $('sel-aspect').addEventListener('change', e => { applyAspect(e.target.value); touch(); });

  // ---------- session persistence ----------
  // リロードで作業を失わないよう、パラメータとアスペクトを localStorage に自動保存する
  // ---------- undo / redo ----------
  // パラメータ変更を700ms単位でスナップショット化。Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y。
  let undoStack = [], redoStack = [], lastSnap = '', lastT = 0, suppressHist = false;
  function histTouch() {
    if (lastSnap === '') lastSnap = JSON.stringify(state.params);
    const now = performance.now();
    if (now - lastT > 700) {
      const cur = JSON.stringify(state.params);
      if (cur !== lastSnap) { undoStack.push(lastSnap); if (undoStack.length > 60) undoStack.shift(); }
      redoStack = [];
    }
    lastT = now; lastSnap = JSON.stringify(state.params);
  }
  function applySnap(s) {
    suppressHist = true;
    state.params = L.clampParams(JSON.parse(s));
    syncUI();
    suppressHist = false;
    lastSnap = s; lastT = 0;
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(state.params));
    applySnap(undoStack.pop());
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(state.params));
    applySnap(redoStack.pop());
  }

  const SES_KEY = 'shiro.session.v1';
  let dirty = false;
  function touch() { dirty = true; if (!suppressHist) histTouch(); }
  setInterval(() => {
    if (!dirty) return; dirty = false;
    try {
      localStorage.setItem(SES_KEY, JSON.stringify({ v: 1, params: state.params, aspect: $('sel-aspect').value }));
    } catch (e) {}
  }, 1200);
  function restoreSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SES_KEY) || 'null');
      if (!s || s.v !== 1 || !s.params) return false;
      state.params = L.clampParams(s.params);
      if (s.aspect) { $('sel-aspect').value = s.aspect; applyAspect(s.aspect); }
      return true;
    } catch (e) { return false; }
  }

  // ---------- shortcuts ----------
  document.addEventListener('keydown', e => {
    if (/^(input|select|textarea)$/i.test(e.target.tagName)) return;
    if (e.key === 'r' || e.key === 'R') $('btn-random').click();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (/^[1-9]$/.test(e.key) && state.favs[+e.key - 1]) {
      state.params = L.clampParams(state.favs[+e.key - 1].params); syncUI();
    }
    // 矢印キーでモデル位置を微調整(Shiftで10倍)
    const nud = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1] }[e.key];
    if (nud) {
      e.preventDefault();
      state.params[nud[0]] = L.clamp01(state.params[nud[0]] + nud[1] * .01 * (e.shiftKey ? 10 : 1));
      syncUI(false);
    }
  });

  // ---------- init ----------
  const restored = restoreSession();
  // 過度なモーションを避ける設定ではアニメを静止化(アクセシビリティ)。復元セッションがある場合は尊重する
  if (!restored && matchMedia('(prefers-reduced-motion: reduce)').matches) state.params.anim = 'still';
  syncUI();
  renderFavs();
  requestAnimationFrame(frame);
})();
