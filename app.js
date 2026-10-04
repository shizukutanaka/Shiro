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
  const ANIMS = ['idle', 'wave', 'walk', 'dance', 'jump', 'still'];
  const FITS = ['cover', 'contain'];
  const ACCS = ['none', 'ribbon', 'hat', 'glasses'];
  const BGS = ['gradient', 'green', 'white', 'transparent'];
  const NUM_KEYS = ['height', 'headSize', 'shoulder', 'armLen', 'legLen', 'tone',
    'line', 'animSpeed', 'x', 'y', 'scale', 'opacity', 'keyThresh', 'keySoft', 'shadow',
    'smile', 'bgDim', 'bgBlur', 'castDir', 'rim', 'eyeHue', 'clothHue', 'outline', 'vignette', 'wmOpacity',
    'accHue', 'vidSpeed'];

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
  ];

  function defaultParams() {
    return {
      seed: 1, height: .5, headSize: .5, shoulder: .5, armLen: .5, legLen: .5,
      tone: .25, line: .4, anim: 'idle', animSpeed: .5, x: .5, y: .84,
      scale: .6, opacity: 1, flip: false, keyThresh: 0, keySoft: .3, shadow: .5,
      smile: .6, bgDim: 0, bgBlur: 0, castDir: .5, rim: 0, eyeHue: .62, clothHue: 0,
      outline: 0, vignette: 0, wmOpacity: .4, watermark: '',
      accHue: .58, vidSpeed: .5, acc: 'none', bgFit: 'cover', bgPreset: 'gradient',
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
    o.bgPreset = BGS.includes(p && p.bgPreset) ? p.bgPreset : d.bgPreset;
    o.watermark = String(p && p.watermark || '').slice(0, 60);
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
    p.flip = rng() < .35;
    p.bgPreset = rng() < .75 ? 'gradient' : BGS[1 + Math.floor(rng() * 3)];
    p.x = .3 + rng() * .4; p.y = .6 + rng() * .35;
    p.scale = .4 + rng() * .5; p.opacity = .6 + rng() * .4;
    p.keyThresh = rng() < .5 ? 0 : rng() * .6;
    p.bgDim = rng() * .5; p.bgBlur = rng() < .6 ? 0 : rng() * .6;
    p.castDir = rng(); p.rim = rng() * .7; p.eyeHue = rng(); p.clothHue = rng() < .4 ? 0 : rng(); p.outline = rng() < .5 ? 0 : rng() * .7; p.vignette = rng() < .6 ? 0 : rng() * .6; p.watermark = ''; p.wmOpacity = .4; p.vidSpeed = .5;
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
  function drawCastShadow(c, silCanvas, wPix, hPix, cx, baseY, dir, alpha) {
    const skew = (dir - .5) * 1.6;
    if (Math.abs(skew) < .05 || alpha <= 0) return;
    c.save();
    c.filter = `blur(${Math.max(1, wPix * .04)}px)`;
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
  function drawWatermark(c, text, w, h, opacity) {
    if (!text || opacity <= 0) return;
    const fs = Math.max(12, Math.round(h * .032));
    c.save();
    c.font = `600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`;
    c.textAlign = 'right'; c.textBaseline = 'bottom';
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = fs * .3; c.shadowOffsetY = 1;
    c.fillStyle = `rgba(255,255,255,${opacity})`;
    c.fillText(text, w - fs * .6, h - fs * .5);
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

  // 接地影: キャラクターを背景に「着地」させる最重要の合成要素。
  function contactShadow(ctx, cx, baseY, rx, alpha) {
    if (alpha <= 0 || rx <= 0) return;
    const g = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, rx);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.translate(cx, baseY); ctx.scale(1, .24); ctx.translate(-cx, -baseY);
    ctx.beginPath(); ctx.arc(cx, baseY, rx, 0, 7); ctx.fill();
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

    contactShadow(ctx, cx, baseY, hPix * (.16 + .07 * p.shoulder), p.shadow * .5);

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
    // eyes (素朴な2点、まばたきで縦につぶれる)
    const eo = Math.max(.12, blinkOpen(t, p.seed));
    ctx.fillStyle = `hsla(${Math.round(p.eyeHue * 360)},65%,42%,0.9)`;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + s * hr * .38, hy - hr * .08, Math.max(1, hr * .09), Math.max(.5, hr * .09 * eo), 0, 0, 7);
      ctx.fill();
    }
    // mouth: smile .5=直線、>で笑顔・<でしかめ面
    const mw = hr * .32, my = hy + hr * .38, curv = (p.smile - .5) * hr * .8;
    if (Math.abs(curv) > hr * .03) {
      ctx.strokeStyle = 'rgba(60,64,74,0.7)'; ctx.lineWidth = Math.max(1, hr * .07);
      ctx.beginPath(); ctx.moveTo(hx - mw, my);
      ctx.quadraticCurveTo(hx, my + curv * 2, hx + mw, my); ctx.stroke();
    }
    drawAccessory(ctx, p.acc, hx, hy, hr, p.accHue);
    ctx.restore();
  }

  // アクセサリ: キャラクリ定番の頭部装飾を手続き描画。accHue でアクセント色を着色
  function drawAccessory(ctx, acc, hx, hy, hr, hue) {
    const dk = 'rgba(52,56,68,0.95)', acc2 = `hsla(${Math.round((hue == null ? .58 : hue) * 360)},80%,64%,0.92)`;
    ctx.save();
    switch (acc) {
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
      case 'glasses': {
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .07);
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.arc(hx + s * hr * .38, hy - hr * .08, hr * .26, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.lineTo(hx + s * hr * .95, hy - hr * .18); ctx.stroke(); // temple
        }
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .1); ctx.lineTo(hx + hr * .12, hy - hr * .1); ctx.stroke(); // bridge
        break;
      }
    }
    ctx.restore();
  }

  return {
    clamp01, lerp, mulberry32, strSeed, ANIMS, FITS, ACCS, BGS, NUM_KEYS, SLIDERS,
    defaultParams, clampParams, randomParams,
    serializePreset, parsePreset, parseFavList,
    keyAlpha, erodeAlpha, blinkOpen, contactShadow, drawCastShadow, drawRimLight, drawStickerOutline, drawVignette, drawWatermark, mannequinPose, skeleton, drawMannequin, drawAccessory,
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
  function drawCover(c, img, fit, blurPx) {
    const iw = img.naturalWidth || img.videoWidth, ih = img.naturalHeight || img.videoHeight;
    if (!iw || !ih) return;
    const s = fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    if (blurPx > 0) c.filter = `blur(${blurPx}px)`;
    c.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    if (blurPx > 0) c.filter = 'none';
  }

  // 背景グレーディング: 被写体を際立たせるため背景をぼかし・減光する(合成定番)
  // 画像なし時はプリセット背景: gradient=内蔵/green=グリーンスクリーン/white=白/transparent=透過PNG用
  function drawBackdrop(c, p) {
    if (state.bg) {
      drawCover(c, state.bg, p.bgFit, p.bgBlur * 10);
      if (p.bgDim > 0) { c.fillStyle = `rgba(8,10,16,${p.bgDim * .55})`; c.fillRect(0, 0, W, H); }
      return;
    }
    const pr = p.bgPreset || 'gradient';
    if (pr === 'transparent') return; // アルファを残す(ディムもかけない)
    if (p.bgBlur > 0) c.filter = `blur(${p.bgBlur * 10}px)`;
    if (pr === 'green') { c.fillStyle = '#00b140'; c.fillRect(0, 0, W, H); }
    else if (pr === 'white') { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); }
    else defaultBackdrop(c);
    c.filter = 'none';
    if (p.bgDim > 0) { c.fillStyle = `rgba(8,10,16,${p.bgDim * .55})`; c.fillRect(0, 0, W, H); }
  }

  // ---------- silhouettes for cast shadows ----------
  const shCv = document.createElement('canvas'), shCtx = shCv.getContext('2d');
  const modCv = document.createElement('canvas'), mctx = modCv.getContext('2d');
  const rimCv = document.createElement('canvas'), rimCtx = rimCv.getContext('2d');
  const outCv = document.createElement('canvas'), outCtx = outCv.getContext('2d');
  function silhouetteOf(src, w, h, color, cv, cctx) {
    cv = cv || shCv; cctx = cctx || shCtx;
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
      L.erodeAlpha(d, kw, kh); // 白フリンジ残りを1px削る
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
    L.contactShadow(c, cx, baseY, wPix * .55, state.params.shadow * .5);
    L.drawCastShadow(c, silhouetteOf(src, sw, sh), wPix, hPix, cx, baseY, state.params.castDir, state.params.shadow * .4);
    L.drawRimLight(c, silhouetteOf(src, sw, sh, '#dfe8ff', rimCv, rimCtx), wPix, hPix, cx, baseY, state.params.castDir, state.params.rim);
    L.drawStickerOutline(c, silhouetteOf(src, sw, sh, '#ffffff', outCv, outCtx), wPix, hPix, cx, baseY, state.params.outline);
    if (state.media.kind === 'video') el.playbackRate = .25 + state.params.vidSpeed * 1.5;
    c.save();
    c.globalAlpha = state.params.opacity;
    if (state.params.flip) { c.translate(2 * cx, 0); c.scale(-1, 1); }
    c.drawImage(src, cx - wPix / 2, baseY - hPix, wPix, hPix);
    c.restore();
  }

  // ---------- render loop ----------
  const t0 = performance.now();
  function frame() {
    const liveT = (performance.now() - t0) / 1000;
    const t = state.frozenT !== null ? state.frozenT : liveT;
    const p = state.params;
    ctx.clearRect(0, 0, W, H);
    drawBackdrop(ctx, p);
    if (state.media) drawMedia(ctx);
    else {
      const hPix = H * (0.25 + 0.7 * p.scale), wPix = hPix * .55;
      // 歩行アニメはステージを横断してループ(反転で歩行方向を変える)
      let cx = p.x * W;
      if (p.anim === 'walk') {
        const ph = (t * .10 * (0.5 + p.animSpeed) + .125) % 1.25;
        cx = (p.flip ? 1.125 - ph : -.125 + ph) * W;
      }
      const baseY = p.y * H;
      // マネキンをオフスクリーンに描き、シルエット化して影/リムに利用
      if ((Math.abs(p.castDir - .5) >= .03 && p.shadow > 0) || p.rim > 0 || p.outline > 0) {
        modCv.width = Math.ceil(wPix); modCv.height = Math.ceil(hPix);
        mctx.clearRect(0, 0, modCv.width, modCv.height);
        L.drawMannequin(mctx, p, t, modCv.width / 2, modCv.height, modCv.height);
        L.drawCastShadow(ctx, silhouetteOf(modCv, modCv.width, modCv.height), wPix, hPix, cx, baseY, p.castDir, p.shadow * .4);
        L.drawRimLight(ctx, silhouetteOf(modCv, modCv.width, modCv.height, '#dfe8ff', rimCv, rimCtx), wPix, hPix, cx, baseY, p.castDir, p.rim);
        L.drawStickerOutline(ctx, silhouetteOf(modCv, modCv.width, modCv.height, '#ffffff', outCv, outCtx), wPix, hPix, cx, baseY, p.outline);
      }
      L.drawMannequin(ctx, p, t, cx, baseY, hPix);
    }
    L.drawVignette(ctx, W, H, p.vignette);
    L.drawWatermark(ctx, p.watermark, W, H, p.wmOpacity);
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
    touch();
    for (const [key] of L.SLIDERS) {
      if (fromParams) $('sl-' + key).value = state.params[key];
      $('out-' + key).textContent = (+state.params[key]).toFixed(2);
    }
    if (fromParams) {
      $('sel-anim').value = state.params.anim;
      $('sel-acc').value = state.params.acc;
      $('sel-bgfit').value = state.params.bgFit;
      $('sel-bgpreset').value = state.params.bgPreset;
      $('chk-flip').checked = state.params.flip;
      $('inp-watermark').value = state.params.watermark;
    }
  }
  $('sel-anim').addEventListener('change', e => { state.params.anim = e.target.value; touch(); });
  $('sel-acc').addEventListener('change', e => { state.params.acc = e.target.value; touch(); });
  $('sel-bgfit').addEventListener('change', e => { state.params.bgFit = e.target.value; touch(); });
  $('sel-bgpreset').addEventListener('change', e => { state.params.bgPreset = e.target.value; touch(); });
  $('chk-flip').addEventListener('change', e => { state.params.flip = e.target.checked; touch(); });
  $('chk-guides').addEventListener('change', e => $('guides').classList.toggle('on', e.target.checked));
  $('inp-watermark').addEventListener('input', e => { state.params.watermark = e.target.value.slice(0, 60); touch(); });
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
  $('chk-freeze').addEventListener('change', e => {
    // 撮影用ポーズ固定: アニメーション時間を現在値で止める(動画素材も一時停止)
    state.frozenT = e.target.checked ? (performance.now() - t0) / 1000 : null;
    const v = state.media && state.media.kind === 'video' ? state.media.el : null;
    if (v) e.target.checked ? v.pause() : v.play().catch(() => {});
  });

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
    stage.toBlob(b => b ? download(b, 'shiro.png') : err('PNG生成に失敗'), 'image/png'));
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
    const rec = new MediaRecorder(stage.captureStream(30), { mimeType: pick.mime });
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
      d.innerHTML = `<img alt=""><span></span><button class="del" title="削除">×</button>`;
      d.querySelector('img').src = f.thumb || '';
      d.querySelector('span').textContent = f.name;
      d.addEventListener('click', () => { state.params = L.clampParams(f.params); syncUI(); });
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
  });

  // ---------- init ----------
  const restored = restoreSession();
  // 過度なモーションを避ける設定ではアニメを静止化(アクセシビリティ)。復元セッションがある場合は尊重する
  if (!restored && matchMedia('(prefers-reduced-motion: reduce)').matches) state.params.anim = 'still';
  syncUI();
  renderFavs();
  requestAnimationFrame(frame);
})();
