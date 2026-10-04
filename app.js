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
  const ANIMS = ['idle', 'wave', 'walk', 'dance', 'jump', 'nod', 'run', 'talk', 'bow', 'spin', 'stretch', 'sleep', 'flip', 'clap', 'peek', 'cheer', 'sad', 'sit', 'point', 'shake', 'sneeze', 'kick', 'float', 'skip', 'moonwalk', 'salute', 'balance', 'guard', 'surf', 'march', 'zombie', 'robot', 'hula', 'yoga', 'punch', 'shuffle', 'lunge', 'cossack', 'hop', 'dab', 'side', 'twist', 'swim', 'bodyroll', 'charleston', 'vogue', 'stomp', 'krump', 'waltz', 'tarantella', 'capoeira', 'belly', 'flamenco', 'samba', 'tango', 'swing', 'polka', 'foxtrot', 'chacha', 'pasodoble', 'cancan', 'mazurka', 'minuet', 'bolero', 'sirtaki', 'reel', 'hora', 'gavotte', 'czardas', 'morris', 'jig', 'bourree', 'sarabande', 'pavane', 'allemande', 'courante', 'rigaudon', 'passepied', 'hambo', 'galliard', 'saltarello', 'bransle', 'farandole', 'canarie', 'volta', 'jota', 'fandango', 'zapateado', 'korobushka', 'trepak', 'legenyes', 'kalamatianos', 'kolo', 'dabke', 'sardana', 'zeybek', 'tsamiko', 'seguidilla', 'sevillanas', 'forro', 'schuhplattler', 'halay', 'polska', 'cumbia', 'landler', 'hopak', 'kalbelia', 'bhangra', 'kathak', 'still'];
  const VIDQS = ['low', 'std', 'high'];
  const FITS = ['cover', 'contain'];
  const ACCS = ['none', 'ribbon', 'hat', 'glasses', 'shades', 'crown', 'phones', 'cape', 'beard', 'mask', 'halo', 'flower', 'scarf', 'beret', 'tie', 'monocle', 'bunny', 'cat-ear', 'bandana', 'goggles', 'horns', 'straw', 'earmuff', 'wizard', 'cap', 'chef', 'top', 'santa', 'headband', 'antler', 'bowtie', 'viking', 'fez', 'sombrero', 'ushanka', 'laurel', 'nightcap', 'jester', 'tiara', 'flowercrown', 'bowler', 'fedora', 'newsboy', 'tricorne', 'turban', 'matador', 'plume', 'veil', 'cloche', 'boater', 'deerstalker', 'bonnet', 'mobcap', 'sunvisor', 'keffiyeh', 'porkpie', 'sailor', 'tam', 'shako', 'pickelhaube', 'bicorne', 'mortar', 'beanie', 'crown2', 'kasa', 'mantilla', 'coif', 'kippah', 'topknot', 'eboshi', 'cowboy', 'mitre', 'snood', 'phrygian', 'calot', 'biretta', 'kokoshnik', 'hennin', 'chaperon', 'kettle', 'attifet', 'barbette', 'fontange', 'coonskin', 'wimple', 'busby', 'petasos', 'souwester', 'caubeen', 'tagelmust', 'kalpak', 'doppa', 'capirote', 'capotain', 'vueltiao', 'pamela', 'kepi', 'pith', 'chullo', 'cordobes', 'bandeau', 'karakul', 'tikka', 'pagri', 'mukut'];
  const PARTICLES = ['none', 'snow', 'sparkle', 'petal', 'rain', 'leaf', 'ember', 'bubble', 'confetti', 'firefly', 'bokeh', 'notes', 'hearts', 'spark', 'wind'];
  const WMPOS = ['br', 'bl', 'tr', 'tl'];
  const BGS = ['gradient', 'green', 'white', 'transparent', 'sunset', 'night', 'spot', 'sky', 'city', 'pastel', 'grid', 'beach', 'forest', 'aurora', 'desert', 'sea', 'space', 'mtn', 'rainbow', 'volcano', 'meadow', 'snowfield', 'shrine', 'lake', 'cloudsea', 'fireworks', 'cave', 'castle', 'canyon', 'bamboo', 'savanna', 'oasis', 'falls', 'autumn', 'fjord', 'glacier', 'ruins', 'sakura', 'moon', 'harbor', 'terraces', 'bridge', 'wheatfield', 'pagoda', 'geyser', 'coral', 'vineyard', 'lavender', 'rainforest', 'mesa', 'alps', 'bayou', 'cliff', 'lagoon', 'prairie', 'observatory', 'storm', 'zen', 'wisteria', 'sunflowers', 'cosmos', 'orchard', 'onsen', 'moor', 'brook', 'grove', 'tide', 'pond', 'badlands', 'taiga', 'mangrove', 'delta', 'highland', 'saltflat', 'wadi', 'tundra', 'quarry', 'dune', 'cirque', 'fen', 'cove', 'glen', 'steppe', 'meseta', 'hamada', 'kelp', 'cenote', 'loch', 'karst', 'polder', 'bazaar', 'seastack', 'billabong', 'glade', 'tea', 'pampas', 'canal', 'grotto', 'cloudforest', 'iceberg', 'rapids', 'meteora', 'dojo', 'stupa', 'taj', 'ghat', 'himalaya'];
  const EYES = ['dot', 'wink', 'closed', 'heart', 'sharp', 'star', 'crying', 'dizzy', 'xx', 'cat', 'wide'];
  const HAIRS = ['none', 'short', 'bob', 'twin', 'long', 'ahoge', 'mohawk', 'odango', 'pony', 'mush', 'curly', 'pomp', 'braid'];
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
      case 'clap': {
        // 拍手: 両腕を胸の前で交互に合わせる(2.5Hzの往復)
        const c = Math.sin(tt * 8);
        q.lArm = -.55 + .3 * c; q.rArm = .55 + .3 * c;
        q.lElb = .85; q.rElb = .85;
        q.bob = .015 * Math.abs(c); q.headTilt = .08 * Math.sin(tt * 2);
        break;
      }
      case 'peek': {
        // のぞき: 4秒周期で体を左右に大きく傾けて交互に覗き込む
        const ph = (tt % 4) / 4;
        const d = Math.sin(ph * Math.PI * 2);           // -1..1 で左右往復
        const e = Math.min(1, Math.abs(d) * 2.4);        // 端で急ぐ滑らかさ
        q.lean = .3 * Math.sign(d) * e; q.sway = .09 * d;
        q.headTilt = -.4 * Math.sign(d) * e;             // 首は逆に傾げてこちらを覗く
        q.lArm = .14; q.rArm = .14;
        break;
      }
      case 'cheer': {
        // バンザイ: 両手を頭上に振り上げながら小刻みに跳ねる
        const j = Math.abs(Math.sin(tt * 4));
        q.bob = .09 * j;
        q.lArm = -.25 - .6 * j; q.rArm = .25 + .6 * j;   // 腕は跳ねに合わせて上げ下げ
        q.lElb = .25; q.rElb = .25;
        q.lThigh = -.15 * j; q.rThigh = -.15 * j; q.lKnee = q.rKnee = .5 * j;
        q.headTilt = .12 * Math.sin(tt * 2);
        break;
      }
      case 'sad': {
        // しょんぼり: うなだれ + 時々ため息(肩が落ちて戻る)
        const sigh = Math.max(0, Math.sin(tt * .9)) ** 3;      // 長い周期で0→1
        q.headTilt = .38 + .1 * sigh; q.lean = .12; q.bob = -.03 - .02 * sigh;
        q.lArm = .16; q.rArm = .16; q.lElb = .12; q.rElb = .12;
        break;
      }
      case 'sit': {
        // おすわり: 体育座り(膝を抱えてゆらゆら)
        q.lThigh = q.rThigh = -1.1; q.lKnee = q.rKnee = 1.15;
        q.lArm = -.9; q.rArm = .9; q.lElb = .7; q.rElb = .7;
        q.bob = -.05 + .012 * Math.sin(tt * 1.6);
        q.lean = .08 + .02 * Math.sin(tt * 1.1);
        q.headTilt = .1 * Math.sin(tt * .8);
        break;
      }
      case 'point': {
        // 指差し: 右腕を前へ突き出してキメる(2秒ごとに左右交互)
        const alt = Math.sin(tt * Math.PI) > 0 ? 1 : -1;
        if (alt > 0) { q.rArm = .95; q.rElb = .05; q.lArm = .12; }
        else { q.lArm = -.95; q.lElb = .05; q.rArm = .12; }
        q.lean = .06 * alt; q.headTilt = .1 * alt;
        q.bob = .015 * Math.sin(tt * 3);
        break;
      }
      case 'shake': {
        // 首振り: 「いやいや」と頭を左右に速く振る
        const w2 = Math.sin(tt * 7);
        q.headTilt = .32 * w2; q.sway = .02 * w2;
        q.lArm = .12; q.rArm = .12;
        break;
      }
      case 'sneeze': {
        // くしゃみ: 4秒周期 — ゆっくり身構え→急激な前のめり→戻る
        const cyc = (tt % 4) / 4;
        const wind = cyc < .55 ? cyc / .55 : 0;            // 0→1 ゆっくり
        const snap = cyc >= .55 && cyc < .68 ? (cyc - .55) / .13 : cyc >= .68 ? Math.max(0, 1 - (cyc - .68) / .32) : 0;
        q.lean = -.06 * wind + .3 * snap; q.headTilt = -.12 * wind + .5 * snap;
        q.bob = -.01 * wind - .05 * snap;
        q.lArm = .12 + .15 * snap; q.rArm = .12 + .15 * snap;
        break;
      }
      case 'kick': {
        // キック: 右脚をパルスで突き出す(バランスのため後傾)
        const kk = Math.pow(Math.abs(Math.sin(tt * 3)), 3);
        q.rThigh = -1.3 * kk; q.rKnee = .3; q.lean = -.12 * kk;
        q.lArm = -.3 * kk; q.rArm = .3 * kk; q.headTilt = -.08 * kk;
        break;
      }
      case 'float': {
        // 浮遊: 大きく上下にホバー、脚はだらんと垂れる
        q.bob = -.09 * Math.sin(tt * 2);
        q.sway = .03 * Math.sin(tt * .9);
        q.lean = .05 * Math.sin(tt * 1.4);
        q.lArm = .45 + .1 * Math.sin(tt * 2); q.rArm = .45 - .1 * Math.sin(tt * 2);
        q.lThigh = .15; q.rThigh = .18; q.lKnee = .5; q.rKnee = .55;
        break;
      }
      case 'skip': {
        // スキップ: 交互に膝を上げて小刻みに跳ねる
        const ph2 = Math.sin(tt * 6);
        q.bob = -.04 * Math.abs(Math.sin(tt * 6));
        q.lThigh = -.7 * Math.max(0, ph2); q.lKnee = .9 * Math.max(0, ph2);
        q.rThigh = -.7 * Math.max(0, -ph2); q.rKnee = .9 * Math.max(0, -ph2);
        q.lArm = -.35 * ph2; q.rArm = .35 * ph2;
        break;
      }
      case 'moonwalk': {
        // ムーンウォーク: 低い膝の交互スライド+後傾で後ろに滑る
        const w = Math.sin(tt * 4);
        q.lThigh = .3 * w; q.rThigh = -.3 * w;
        q.lKnee = Math.max(0, .35 * Math.sin(tt * 4 + Math.PI / 2));
        q.rKnee = Math.max(0, .35 * Math.sin(tt * 4 - Math.PI / 2));
        q.lean = -.08; q.sway = .02 * w;
        q.lArm = .25 - .3 * w; q.rArm = .25 + .3 * w; q.lElb = .8; q.rElb = .8;
        q.bob = .015 * Math.abs(Math.cos(tt * 4));
        break;
      }
      case 'salute': {
        // 敬礼: 右腕を額へ(4秒周期で挙げ→保持→下げ)
        const ph2 = (tt % 4) / 4;
        const k = ph2 < .15 ? ph2 / .15 : ph2 < .75 ? 1 : Math.max(0, 1 - (ph2 - .75) / .25);
        q.rArm = .1 - 1.9 * k; q.rElb = 2.0 * k;
        q.headTilt = -.06 * k; q.lean = .03 * k;
        q.lArm = .12; q.lThigh = .05; q.rThigh = -.05;
        break;
      }
      case 'balance': {
        // 片足バランス: 右脚を横に上げ、両腕を広げてフラつく
        const wb = Math.sin(tt * 3.2);
        q.rThigh = -1.1; q.rKnee = -.4;                 // 右膝を外側に折る
        q.lArm = 1.35 + .12 * wb; q.rArm = 1.35 - .12 * wb; // 水平に広げる
        q.lElb = .1; q.rElb = .1;
        q.lean = .09 * wb; q.sway = .04 * wb; q.headTilt = -.08 * wb;
        break;
      }
      case 'guard': {
        // 構え: ボクシングのガード(両拳を顔の前、小刻みに踏む)
        const st = Math.abs(Math.sin(tt * 5));
        q.lArm = .95; q.rArm = .95; q.lElb = 1.8; q.rElb = 1.8;
        q.lean = .06; q.sway = .03 * Math.sin(tt * 5);
        q.lThigh = .15; q.rThigh = -.15; q.lKnee = .3; q.rKnee = .3;
        q.bob = .015 * st; q.headTilt = .04 * Math.sin(tt * 2.5);
        break;
      }
      case 'surf': {
        // サーフィン: 膝を落として横乗り、両腕でバランス(波に揺れる)
        const wv = Math.sin(tt * 2.4);
        q.lean = .18 + .08 * wv; q.sway = .05 * Math.sin(tt * 1.6);
        q.lThigh = .3; q.rThigh = -.2; q.lKnee = .55; q.rKnee = .5;
        q.lArm = 1.1 + .15 * wv; q.rArm = .6 - .15 * wv; q.lElb = .3; q.rElb = .4;
        q.headTilt = -.1 * wv; q.bob = .015 * Math.abs(wv);
        break;
      }
      case 'march': {
        // マーチング: 膝を高く交互に上げて腕を大きく振る
        const ph2 = tt * 3.4;
        const lp = Math.max(0, Math.sin(ph2)), rp = Math.max(0, -Math.sin(ph2));
        q.lThigh = .55 * lp; q.rThigh = -.55 * rp; q.lKnee = .9 * lp; q.rKnee = -.9 * rp;
        q.lArm = .7 * lp; q.rArm = -.7 * rp; q.lElb = .3; q.rElb = -.3;
        q.bob = .02 * Math.abs(Math.sin(ph2)); q.lean = .06;
        break;
      }
      case 'zombie': {
        // ゾンビ: 両腕を前に突き出して左右に揺れながら引き摺る
        const zw = Math.sin(tt * 1.8);
        q.lean = .1 + .05 * zw; q.sway = .12 * zw; q.headTilt = .2 * zw;
        q.lArm = .9; q.rArm = .9; q.lElb = .15; q.rElb = .15;
        q.lThigh = .15 * Math.max(0, zw); q.rThigh = -.15 * Math.max(0, -zw);
        q.lKnee = .3; q.rKnee = -.3; q.bob = .01;
        break;
      }
      case 'robot': {
        // ロボット: 階段状の値でカクカク動く(量子化サイン)
        const rq = (v, s) => Math.round(v * s) / s;
        const ph3 = tt * 2.2;
        q.lArm = .5 + .5 * rq(Math.sin(ph3), 2);
        q.rArm = .5 + .5 * rq(Math.sin(ph3 + Math.PI / 2), 2);
        q.lElb = .8 * rq(Math.sin(ph3 + 1), 2); q.rElb = .8 * rq(Math.cos(ph3), 2);
        q.headTilt = .3 * rq(Math.sin(ph3 * .5), 2);
        q.lean = .1 * rq(Math.cos(ph3 * .7), 2);
        q.lKnee = .2 * Math.max(0, rq(Math.sin(ph3), 2)); q.rKnee = -.2 * Math.max(0, -rq(Math.sin(ph3), 2));
        break;
      }
      case 'hula': {
        // フラダンス: 腰を円く揺らし、両腕を左右に大きく波打たせる
        const hw = tt * 2.6;
        q.sway = .14 * Math.sin(hw); q.lean = .1 * Math.sin(hw + .5);
        q.lArm = .8 + .35 * Math.sin(hw); q.rArm = .8 - .35 * Math.sin(hw);
        q.lElb = .9; q.rElb = .9;
        q.headTilt = .08 * Math.sin(hw + 1);
        q.lKnee = .15; q.rKnee = -.15; q.bob = .012 * Math.abs(Math.sin(hw * 2));
        break;
      }
      case 'yoga': {
        // ヨガ(木のポーズ): 片足立ち+合掌+呼吸する上下
        const br = Math.sin(tt * 1.4);
        q.rThigh = -.9; q.rKnee = -.9;
        q.lArm = 1.5; q.rArm = 1.5; q.lElb = 1.4; q.rElb = 1.4;
        q.lean = .04 * br; q.sway = .05 * Math.sin(tt * .9);
        q.bob = .02 * br; q.headTilt = .04 * br;
        break;
      }
      case 'punch': {
        // パンチ: 交互に前方へジャブ(腕が伸びて戻る)
        const ph4 = tt * 3.2;
        const lj = Math.max(0, Math.sin(ph4)) ** 3, rj = Math.max(0, -Math.sin(ph4)) ** 3;
        q.lArm = .9 + .7 * lj; q.rArm = .9 + .7 * rj;
        q.lElb = 1.6 * (1 - lj); q.rElb = 1.6 * (1 - rj);
        q.lean = .08 + .06 * (lj - rj); q.headTilt = .05 * (rj - lj);
        q.bob = .01 * Math.abs(Math.sin(ph4));
        break;
      }
      case 'shuffle': {
        // シャッフル: 高速で膝を交互に上げる走り幅跳び系ステップ
        const ph5 = tt * 9;
        const ls = Math.sin(ph5) > 0 ? 1 : 0, rs = 1 - ls;
        q.lThigh = .5 * ls; q.rThigh = -.5 * rs;
        q.lKnee = .8 * ls; q.rKnee = -.8 * rs;
        q.lArm = .4 * rs; q.rArm = .4 * ls; q.lElb = .6; q.rElb = .6;
        q.lean = .08; q.bob = .025 * Math.abs(Math.sin(ph5));
        break;
      }
      case 'lunge': {
        // ランジ: 交互に深く沈み込む前後の脚開き
        const ph6 = tt * 2.2;
        const ld = Math.max(0, Math.sin(ph6)), rd = Math.max(0, -Math.sin(ph6));
        q.lThigh = .8 * ld; q.rThigh = -.8 * rd;
        q.lKnee = 1.1 * ld; q.rKnee = -1.1 * rd;
        q.bob = -.06 * (ld + rd); q.lean = .1;
        q.lArm = .3; q.rArm = .3; q.lElb = .5; q.rElb = .5;
        break;
      }
      case 'cossack': {
        // コサック: 腕を組んで脚を交互に前へ蹴り出す
        const ph7 = tt * 4;
        const lc = Math.sin(ph7) > 0 ? 1 : 0, rc = 1 - lc;
        q.lThigh = .7 * lc; q.rThigh = -.7 * rc;
        q.lKnee = .1; q.rKnee = -.1;
        q.lArm = .55; q.rArm = .55; q.lElb = 1.5; q.rElb = 1.5;
        q.bob = -.05 + .02 * Math.sin(ph7 * 2); q.lean = .06;
        break;
      }
      case 'hop': {
        // ぴょんぴょん: 両足で小刻みに跳ねる(膝を揃えて曲げ伸ばし)
        const hp = Math.abs(Math.sin(tt * 5));
        q.bob = .05 * hp;
        q.lKnee = .5 * hp; q.rKnee = -.5 * hp;
        q.lThigh = .2 * hp; q.rThigh = -.2 * hp;
        q.lArm = .25 * hp; q.rArm = .25 * hp; q.lElb = .4; q.rElb = .4;
        q.lean = .04;
        break;
      }
      case 'dab': {
        // ダブ: 右腕を斜め上へ、頭を左肘にうずめる決めポーズ(微振動)
        const db = Math.sin(tt * 4) * .03;
        q.rArm = 1.3 + db; q.rElb = .3;
        q.lArm = .9; q.lElb = 1.7;
        q.headTilt = .5 + db; q.lean = .12;
        q.bob = .015 * Math.abs(Math.sin(tt * 4));
        break;
      }
      case 'side': {
        // サイドステップ: 左右へ交互にステップ、腰を横に揺らす
        const sd = Math.sin(tt * 3.2);
        q.sway = .12 * sd;
        q.lean = .08 * sd;
        q.lThigh = Math.max(0, sd) * .35; q.rThigh = -Math.max(0, -sd) * .35;
        q.lKnee = Math.max(0, sd) * .25; q.rKnee = -Math.max(0, -sd) * .25;
        q.lArm = .4 + .2 * sd; q.rArm = .4 - .2 * sd; q.lElb = .5; q.rElb = .5;
        break;
      }
      case 'twist': {
        // ツイスト: 腰を交互にひねるダンス(膝を交互に)
        const tw = Math.sin(tt * 6);
        q.sway = .05 * tw;
        q.lThigh = Math.max(0, tw) * .3; q.rThigh = -Math.max(0, -tw) * .3;
        q.lKnee = Math.max(0, tw) * .35; q.rKnee = -Math.max(0, -tw) * .35;
        q.lArm = .5 - .15 * tw; q.rArm = .5 + .15 * tw; q.lElb = .8; q.rElb = .8;
        q.lean = .04 * tw;
        q.bob = .02 * Math.abs(tw);
        break;
      }
      case 'swim': {
        // 泳ぎ(クロール): 交互に回る腕+キックする脚+上下に波打つ体
        const sw = tt * 3;
        q.rArm = 1.4 + .9 * Math.sin(sw); q.rElb = .4;
        q.lArm = 1.4 + .9 * Math.sin(sw + Math.PI); q.lElb = .4;
        q.lKnee = .3 * Math.abs(Math.sin(sw)); q.rKnee = -.3 * Math.abs(Math.sin(sw + Math.PI));
        q.lean = .15;
        q.bob = .03 * Math.sin(sw);
        q.headTilt = .2;
        break;
      }
      case 'bodyroll': {
        // ボディロール: 頭→腰へ波が伝わる蛇行ダンス
        const br2 = tt * 2.6;
        q.lean = .14 * Math.sin(br2);
        q.sway = .1 * Math.sin(br2 - .8);
        q.headTilt = .25 * Math.sin(br2 - 1.6);
        q.lArm = .45 + .1 * Math.sin(br2 - 1.2);
        q.rArm = .45 + .1 * Math.sin(br2 - 1.2);
        q.lElb = .6; q.rElb = .6;
        q.bob = .02 * Math.sin(br2 - .5);
        break;
      }
      case 'charleston': {
        // チャールストン: 膝を内↔外交互に、腕を左右に振る
        const ch = Math.sin(tt * 5);
        q.lKnee = .3 + .3 * ch; q.rKnee = -(.3 - .3 * ch);
        q.lThigh = .15 * ch; q.rThigh = -.15 * ch;
        q.lArm = .5 - .3 * ch; q.rArm = .5 + .3 * ch; q.lElb = .7; q.rElb = .7;
        q.lean = .06 * ch;
        q.bob = .02 * Math.abs(ch);
        break;
      }
      case 'vogue': {
        // ヴォーグ: 角張った腕のポーズをパキッと切り替える
        const vg = Math.floor(tt * 2.4) % 4;
        const ease = Math.min(1, (tt * 2.4 % 1) * 6); // 速い遷移
        const poses = [[1.4, .3, .3, 1.5], [.3, 1.4, 1.5, .3], [1.0, 1.0, .9, .9], [.6, .6, 1.6, 1.6]];
        const [ra, la, re, le] = poses[vg];
        q.rArm = ra * ease; q.lArm = la * ease;
        q.rElb = re; q.lElb = le;
        q.headTilt = (vg % 2 ? .2 : -.2) * ease;
        q.lean = (vg % 2 ? .05 : -.05) * ease;
        break;
      }
      case 'stomp': {
        // ストンプ: 交互に足を強く踏み下ろす(体ごと沈む)
        const st = tt * 3.4;
        const lSt = Math.max(0, Math.sin(st)) ** 2;
        const rSt = Math.max(0, Math.sin(st + Math.PI)) ** 2;
        q.lThigh = .5 * lSt; q.rThigh = -.5 * rSt;
        q.lKnee = .6 * lSt; q.rKnee = -.6 * rSt;
        q.bob = -.03 * (lSt + rSt);
        q.lean = .06 * Math.sin(st);
        q.lArm = .6 - .3 * lSt; q.rArm = .6 - .3 * rSt; q.lElb = .8; q.rElb = .8;
        break;
      }
      case 'krump': {
        // クランプ: 胸を弾く爆発的な動き+腕を大きく振る
        const kp = Math.sin(tt * 7);
        const pop = Math.max(0, Math.sin(tt * 3.5)) ** 3;
        q.bob = -.04 * pop;
        q.lean = .1 * kp;
        q.lArm = .8 + .4 * kp; q.rArm = .8 - .4 * kp;
        q.lElb = 1.1; q.rElb = 1.1;
        q.lThigh = .2 * pop; q.rThigh = -.2 * pop;
        q.headTilt = .15 * kp;
        break;
      }
      case 'waltz': {
        // ワルツ: 3拍子のゆったりした起伏+左右ステップ+優雅な腕
        const wz = tt * 2.1;
        const beat = Math.sin(wz * 3);
        q.bob = .03 * beat;
        q.sway = .08 * Math.sin(wz);
        q.lean = .07 * Math.sin(wz + .5);
        q.lArm = .7 + .15 * Math.sin(wz); q.rArm = .7 - .15 * Math.sin(wz);
        q.lElb = .5; q.rElb = .5;
        q.lKnee = .2 * Math.max(0, Math.sin(wz * 3)); q.rKnee = -.2 * Math.max(0, Math.sin(wz * 3 + Math.PI));
        q.headTilt = .1 * Math.sin(wz);
        break;
      }
      case 'tarantella': {
        // タランテラ: 両腕を頭上で振りながら速い足捌き+回るような揺れ
        const ta = tt * 4.5;
        q.lArm = 1.3 + .25 * Math.sin(ta); q.rArm = 1.3 - .25 * Math.sin(ta);
        q.lElb = .5; q.rElb = .5;
        const lp2 = Math.max(0, Math.sin(ta * 1.5)), rp2 = Math.max(0, Math.sin(ta * 1.5 + Math.PI));
        q.lKnee = .4 * lp2; q.rKnee = -.4 * rp2;
        q.sway = .09 * Math.sin(ta * .5);
        q.lean = .06 * Math.sin(ta * .5 + 1);
        q.bob = .025 * Math.abs(Math.sin(ta));
        break;
      }
      case 'capoeira': {
        // カポエイラ: ジンガ(低い構えで左右に体重移動)+脚の振り
        const cp = tt * 2.8;
        const gd = Math.sin(cp);
        q.sway = .16 * gd;
        q.lean = .1 * gd;
        q.bob = .05 + .02 * Math.abs(gd);
        q.lArm = .5 + .3 * Math.max(0, gd); q.rArm = .5 + .3 * Math.max(0, -gd);
        q.lElb = .6; q.rElb = .6;
        // 交互に脚を前へ振る
        q.lThigh = .4 * Math.max(0, -gd); q.rThigh = -.4 * Math.max(0, gd);
        q.lKnee = .3 * Math.max(0, -gd); q.rKnee = -.3 * Math.max(0, gd);
        q.headTilt = -.06 * gd;
        break;
      }
      case 'belly': {
        // ベリーダンス: 腰の8の字+蛇行する腕
        const bd = tt * 3.4;
        q.sway = .1 * Math.sin(bd);
        q.bob = .02 * Math.abs(Math.sin(bd * 2));
        q.lArm = .9 + .35 * Math.sin(bd * .8); q.rArm = .9 - .35 * Math.sin(bd * .8);
        q.lElb = .4 + .3 * Math.sin(bd * .8 + 1); q.rElb = .4 - .3 * Math.sin(bd * .8 + 1);
        q.lKnee = .15 * Math.max(0, Math.sin(bd)); q.rKnee = -.15 * Math.max(0, -Math.sin(bd));
        q.headTilt = .06 * Math.sin(bd * .5);
        break;
      }
      case 'flamenco': {
        // フラメンコ: 片腕を頭上に掲げて誇らしげ+リズムに合わせ踏み鳴らす
        const fm = tt * 3.8;
        const st = Math.max(0, Math.sin(fm * 2)) ** 2;
        q.rArm = 1.45; q.rElb = .3;
        q.lArm = .55; q.lElb = 1.1;
        q.lean = -.04;
        q.rKnee = -.4 * st; q.lKnee = .1;
        q.bob = -.025 * st;
        q.headTilt = -.06;
        q.sway = .03 * Math.sin(fm * .7);
        break;
      }
      case 'samba': {
        // サンバ: 高速の腰バウンス+交互に前後する腕
        const sb = tt * 6;
        q.bob = .035 * Math.abs(Math.sin(sb));
        q.sway = .05 * Math.sin(sb * .5);
        q.lArm = .6 + .5 * Math.sin(sb * .5); q.rArm = .6 - .5 * Math.sin(sb * .5);
        q.lElb = .7; q.rElb = .7;
        q.lKnee = .25 * Math.max(0, Math.sin(sb)); q.rKnee = -.25 * Math.max(0, -Math.sin(sb));
        q.headTilt = .05 * Math.sin(sb * .5);
        break;
      }
      case 'tango': {
        // タンゴ: スタッカートのステップ+鋭い頭の切り替えし
        const tg = tt * 3.2;
        const snap = Math.floor(tg / Math.PI) % 2 ? 1 : -1; // 半周期ごとに反転
        const ease = Math.min(1, (tg % Math.PI) * 4); // 始めに速く止まる
        q.headTilt = .25 * snap * ease;
        q.sway = .08 * snap;
        q.lean = .05 * snap;
        q.lArm = .5 + .2 * snap; q.rArm = .5 - .2 * snap;
        q.lElb = .9; q.rElb = .9;
        // 断続的な脚の運び
        q.lThigh = .3 * Math.max(0, snap * Math.sin(tg * 2));
        q.rThigh = -.3 * Math.max(0, -snap * Math.sin(tg * 2));
        q.bob = .015 * Math.abs(Math.sin(tg * 2));
        break;
      }
      case 'swing': {
        // スウィング(リンディ): 弾むキックステップ+全身のバウンス
        const sw = tt * 4.2;
        const k = Math.sin(sw);
        q.bob = .04 * Math.abs(Math.sin(sw * .5));
        q.sway = .07 * k;
        q.lKnee = .35 * Math.max(0, k); q.rKnee = -.35 * Math.max(0, -k);
        q.lThigh = .2 * Math.max(0, k); q.rThigh = -.2 * Math.max(0, -k);
        q.lArm = .55 + .3 * k; q.rArm = .55 - .3 * k;
        q.lElb = .6; q.rElb = .6;
        q.lean = .04 * k;
        break;
      }
      case 'polka': {
        // ポルカ: 3歩+ホップの弾むリズム
        const pk = tt * 3.6;
        const ph = pk % (Math.PI * 2);
        const hop2 = ph > Math.PI * 1.5 ? Math.sin((ph - Math.PI * 1.5) * 4) : 0;
        q.bob = .04 * Math.abs(hop2) + .015 * Math.abs(Math.sin(pk));
        const st2 = Math.sin(pk);
        q.lKnee = .35 * Math.max(0, st2); q.rKnee = -.35 * Math.max(0, -st2);
        q.sway = .08 * st2;
        q.lArm = .5 + .25 * st2; q.rArm = .5 - .25 * st2;
        q.lElb = .5; q.rElb = .5;
        q.lean = .05 * st2;
        q.headTilt = .06 * st2;
        break;
      }
      case 'foxtrot': {
        // フォックストロット: 滑らかなスローステップ+わずかな昇降
        const fx = tt * 2.4;
        const rise = Math.sin(fx);
        q.bob = .02 * rise;
        q.sway = .1 * Math.sin(fx * .5);
        q.lean = .06 * Math.sin(fx * .5 + .7);
        q.lArm = .65 + .1 * Math.sin(fx * .5); q.rArm = .65 - .1 * Math.sin(fx * .5);
        q.lElb = .4; q.rElb = .4;
        q.lThigh = .15 * Math.max(0, Math.sin(fx)); q.rThigh = -.15 * Math.max(0, -Math.sin(fx));
        q.lKnee = .1 * Math.max(0, Math.sin(fx)); q.rKnee = -.1 * Math.max(0, -Math.sin(fx));
        q.headTilt = .05 * Math.sin(fx * .5);
        break;
      }
      case 'chacha': {
        // チャチャ: 速い横ステップ(チャチャチャ)+腰の切れ
        const cc = tt * 4.4;
        const step = Math.sin(cc);
        const trip = Math.sign(Math.sin(cc * 1.5)) * Math.min(1, Math.abs(Math.sin(cc * 1.5)) * 3); // 3連ステップ感
        q.sway = .1 * trip;
        q.bob = .02 * Math.abs(step);
        q.lKnee = .3 * Math.max(0, step); q.rKnee = -.3 * Math.max(0, -step);
        q.lArm = .55 + .35 * step; q.rArm = .55 - .35 * step;
        q.lElb = .6; q.rElb = .6;
        q.lean = .04 * trip;
        break;
      }
      case 'pasodoble': {
        // パソドブレ: 両腕を頭上に構えて力強く踏み回る
        const pd = tt * 2.2;
        const stamp = Math.max(0, Math.sin(pd * 2)) ** .5;
        q.lArm = -.9 + .1 * Math.sin(pd); q.rArm = .9 - .1 * Math.sin(pd);
        q.lElb = -.4; q.rElb = -.4; // 腕を頭上で湾曲
        q.lKnee = .3 * stamp; q.rKnee = -.3 * stamp;
        q.bob = .03 * stamp;
        q.lean = .08 * Math.sin(pd);
        q.spin = .15 * Math.sin(pd * .5); // ゆるい旋回
        q.headTilt = .1 * Math.sin(pd * .5 + 1); // 誇らしげな顔上げ
        break;
      }
      case 'cancan': {
        // カンカン: 交互に高く蹴り上げる+腕を横に広げる
        const cn = tt * 5;
        const kick = Math.max(0, Math.sin(cn));
        q.lThigh = -.1 - 1.1 * Math.max(0, Math.sin(cn)); // 左脚キック
        q.rThigh = -.1 - 1.1 * Math.max(0, -Math.sin(cn));
        q.lKnee = .4; q.rKnee = .4;
        q.lArm = -1.2; q.rArm = 1.2; // 腕を横にピンと広げる
        q.lElb = -.15; q.rElb = -.15;
        q.bob = .04 * kick;
        q.lean = .06 * Math.sin(cn);
        break;
      }
      case 'mazurka': {
        // マズルカ: ホップ+かかと打ち+優雅な腕
        const mz = tt * 3;
        const beat = Math.sin(mz * 3); // 3拍子
        const hop = Math.max(0, Math.sin(mz));
        q.bob = .05 * hop;
        q.lThigh = -.15 + .25 * Math.sin(mz * 1.5);
        q.rThigh = -.15 - .25 * Math.sin(mz * 1.5);
        q.lKnee = .5 * Math.max(0, Math.sin(mz * 1.5));
        q.rKnee = .5 * Math.max(0, -Math.sin(mz * 1.5));
        q.lArm = -.6 - .3 * Math.sin(mz); q.rArm = .6 - .3 * Math.sin(mz);
        q.lElb = -.5; q.rElb = -.5;
        q.lean = .06 * beat;
        q.headTilt = .08 * beat;
        break;
      }
      case 'minuet': {
        // メヌエット: ゆったり3拍子の淑やかなステップ+カーテシー気味の膝曲げ
        const mn = tt * 1.8;
        const step = Math.sin(mn);
        const curtsey = Math.max(0, Math.sin(mn * .5 + Math.PI / 4)) ** 2; // 周期末に深くお辞儀
        q.bob = .015 * Math.abs(step) - .06 * curtsey;
        q.lThigh = -.1 - .18 * Math.max(0, step);
        q.rThigh = -.1 - .18 * Math.max(0, -step);
        q.lKnee = .25 + .4 * curtsey; q.rKnee = .25 + .4 * curtsey;
        q.lArm = -.35 - .2 * step; q.rArm = .35 - .2 * step;
        q.lElb = -.65; q.rElb = -.65; // 腕を優雅に円く保持
        q.lean = .03 * step;
        q.headTilt = .06 * Math.sin(mn * .5); // 淑やかな首
        break;
      }
      case 'bolero': {
        // ボレロ: ゆったりした旋回+片腕を頭上に掲げる優雅な動き
        const bo = tt * 1.4;
        const rise = Math.sin(bo * .5);
        q.lArm = -.4 - .9 * Math.max(0, rise); // 左腕がゆっくり上がる
        q.rArm = .4 + .2 * Math.sin(bo);
        q.lElb = -.5 - .3 * Math.max(0, rise); q.rElb = -.4;
        q.spin = .2 * Math.sin(bo * .5); // ゆるい旋回
        q.sway = .06 * Math.sin(bo);
        q.bob = .02 * Math.abs(Math.sin(bo * 1.5));
        q.lKnee = .15; q.rKnee = .15;
        q.headTilt = -.08 * Math.max(0, rise); // 掲げた腕を仰ぐ
        q.lean = .04 * Math.sin(bo * .5);
        break;
      }
      case 'sirtaki': {
        // シルタキ: ゆっくり始まり加速する横ステップ+腕を伸ばす
        const sk = tt * (1.6 + Math.min(1, tt % 8 / 6) * 2.4); // 段々速く
        const st = Math.sin(sk);
        q.sway = .14 * st;
        q.bob = .035 * Math.abs(st);
        q.lThigh = -.12 - .22 * Math.max(0, st);
        q.rThigh = -.12 - .22 * Math.max(0, -st);
        q.lKnee = .35 * Math.max(0, st); q.rKnee = .35 * Math.max(0, -st);
        q.lArm = -.95; q.rArm = .95; // 両腕を横に伸ばして肩を組む
        q.lElb = -.1; q.rElb = -.1;
        q.lean = .05 * st;
        break;
      }
      case 'reel': {
        // リール: 速い足捌き+回り込み+腰に手(スコットランド舞踏)
        const rl = tt * 5.2;
        const st = Math.sin(rl);
        q.lThigh = -.1 - .3 * Math.max(0, st);
        q.rThigh = -.1 - .3 * Math.max(0, -st);
        q.lKnee = .5 * Math.max(0, st); q.rKnee = .5 * Math.max(0, -st);
        q.bob = .045 * Math.abs(st);
        q.sway = .1 * Math.sin(rl * .5); // 輪を描いて回り込む
        q.spin = .3 * Math.sin(rl * .25); // ゆるい旋回
        q.lArm = -.35; q.rArm = .35; // 腰に手
        q.lElb = -.9; q.rElb = -.9;
        break;
      }
      case 'hora': {
        // ホラ: 輪になり横ステップを繰り返す+跳ねる膝
        const hr2 = tt * 3.4;
        const st = Math.sin(hr2);
        q.sway = .16 * Math.sin(hr2 * .5); // 輪を周る移動
        q.lThigh = -.1 - .35 * Math.max(0, st);
        q.rThigh = -.1 - .35 * Math.max(0, -st);
        q.lKnee = .55 * Math.max(0, st); q.rKnee = .55 * Math.max(0, -st);
        q.bob = .05 * Math.abs(st);
        q.lArm = -.85; q.rArm = .85; // 隣と肩を組む腕
        q.lElb = -.2; q.rElb = -.2;
        q.spin = .25 * Math.sin(hr2 * .5);
        break;
      }
      case 'gavotte': {
        // ガヴォット: 4拍子の跳ねる歩み+片脚を上げて回る
        const gv = tt * 3.2;
        const hop = Math.max(0, Math.sin(gv * 2));
        q.bob = .06 * hop;
        q.lThigh = -.1 - .5 * Math.max(0, Math.sin(gv * 2 - 1)); // 脚を高く
        q.rThigh = -.1 - .3 * Math.max(0, -Math.sin(gv * 2));
        q.lKnee = .6 * Math.max(0, Math.sin(gv * 2 - 1));
        q.rKnee = .4;
        q.lArm = -.5 - .4 * Math.sin(gv * .5); q.rArm = .5 - .4 * Math.sin(gv * .5);
        q.lElb = -.6; q.rElb = -.6;
        q.lean = .07 * Math.sin(gv);
        q.headTilt = .08 * Math.sin(gv + 1);
        break;
      }
      case 'czardas': {
        // チャルダッシュ: 前半ラッサン(緩)→後半フリス(速)の脚捌き
        const slow = (tt % 10) < 5;
        const cz = tt * (slow ? 1.8 : 4.6);
        const st = Math.sin(cz);
        q.lThigh = -.12 - .35 * Math.max(0, st);
        q.rThigh = -.12 - .35 * Math.max(0, -st);
        q.lKnee = .5 * Math.max(0, st); q.rKnee = .5 * Math.max(0, -st);
        q.bob = .04 * Math.abs(st);
        q.sway = .1 * st;
        q.lArm = slow ? -.4 : -.7; q.rArm = slow ? .4 : .7;
        q.lElb = slow ? -.8 : -.4; q.rElb = slow ? -.8 : -.4; // 腰手→胸上げ
        q.lean = .06 * st;
        break;
      }
      case 'morris': {
        // モリスダンス: ホップ+手ぬぐいを振る両腕の交互上げ
        const mr = tt * 3.6;
        const hop = Math.max(0, Math.sin(mr));
        const arm = Math.floor(mr / Math.PI) % 2 ? 1 : -1;
        q.bob = .05 * hop;
        q.lThigh = -.08 - .3 * Math.max(0, Math.sin(mr - .8));
        q.rThigh = -.08 - .3 * Math.max(0, Math.sin(mr + .8));
        q.lKnee = .5 * Math.max(0, Math.sin(mr - .8));
        q.rKnee = .5 * Math.max(0, Math.sin(mr + .8));
        q.lArm = -.5 - .9 * Math.max(0, arm); // 手ぬぐいを高く
        q.rArm = -.5 - .9 * Math.max(0, -arm);
        q.lElb = -.3; q.rElb = -.3;
        q.sway = .08 * Math.sin(mr * .5);
        q.headTilt = .07 * Math.sin(mr);
        break;
      }
      case 'jig': {
        // ジグ: 上体は硬く直立、足だけ高速で交互に蹴る
        const jg = tt * 7;
        const st = Math.sin(jg);
        q.lThigh = -.15 - .5 * Math.max(0, st);
        q.rThigh = -.15 - .5 * Math.max(0, -st);
        q.lKnee = .8 * Math.max(0, st);
        q.rKnee = .8 * Math.max(0, -st);
        q.bob = .03 * Math.abs(st);
        q.lArm = -.35; q.rArm = -.35; // 腰に手
        q.lElb = -1; q.rElb = -1;
        q.lean = 0; q.sway = 0; // 上体固定
        q.headTilt = .03 * Math.sin(jg * .25);
        break;
      }
      case 'bourree': {
        // ブーレ: つま先で刻む小さな横ステップ+腕を流れるように
        const br = tt * 4.4;
        const st = Math.sin(br);
        const drift = Math.sin(tt * .8) * .12;
        q.sway = .1 * st; // 横への流れ
        q.bob = .025 * Math.abs(st);
        q.lThigh = -.15 - .2 * Math.max(0, st);
        q.rThigh = -.15 - .2 * Math.max(0, -st);
        q.lKnee = .25 + .15 * Math.max(0, st); // つま先立ち気味(膝小さめ)
        q.rKnee = .25 + .15 * Math.max(0, -st);
        q.lArm = -.9 - .3 * Math.sin(br * .5); // 優雅な流れる腕
        q.rArm = -.9 - .3 * Math.sin(br * .5 + 1.5);
        q.lElb = -.5; q.rElb = -.5;
        q.lean = .05 * st + drift * .3;
        q.headTilt = .06 * Math.sin(br * .5);
        break;
      }
      case 'sarabande': {
        // サラバンド: 緩やかで威厳ある3拍子、意図的な体重移動+ゆっくり回る腕
        const sb = tt * 1.6;
        const st = Math.sin(sb);
        const shift = Math.sin(sb * .5); // 左右に大きく重心移動
        q.sway = .14 * shift;
        q.lean = .09 * shift;
        q.bob = .03 * Math.abs(st);
        q.lThigh = -.12 - .25 * Math.max(0, st);
        q.rThigh = -.12 - .25 * Math.max(0, -st);
        q.lKnee = .35 * Math.max(0, st);
        q.rKnee = .35 * Math.max(0, -st);
        q.lArm = -.7 - .5 * Math.sin(sb * .5 + .6); // ゆっくり回る腕
        q.rArm = -.7 - .5 * Math.sin(sb * .5 + 2);
        q.lElb = -.4; q.rElb = -.4;
        q.headTilt = .08 * shift;
        break;
      }
      case 'pavane': {
        // パヴァーヌ: 滑るような行進歩み+緩やかな昇降+格式ある姿勢
        const pv = tt * 1.4;
        const st = Math.sin(pv);
        const rise = Math.sin(pv * .5); // 2拍に1回の昇降
        q.bob = .035 * Math.abs(rise);
        q.sway = .06 * st;
        q.lThigh = -.1 - .18 * Math.max(0, st);
        q.rThigh = -.1 - .18 * Math.max(0, -st);
        q.lKnee = .2 * Math.max(0, st); // 膝を控えめに(滑る歩み)
        q.rKnee = .2 * Math.max(0, -st);
        q.lArm = -.55 - .15 * st; // 前に伸ばした儀礼的な腕
        q.rArm = -.55 - .15 * st;
        q.lElb = -.2; q.rElb = -.2;
        q.lean = .04 * st;
        q.headTilt = .04 * Math.sin(pv * .5);
        break;
      }
      case 'allemande': {
        // アルマンド: 優美な歩み+頭上で組んだ腕の円弧+軽い揺れ
        const al = tt * 2;
        const st = Math.sin(al);
        q.lThigh = -.15 - .25 * Math.max(0, st);
        q.rThigh = -.15 - .25 * Math.max(0, -st);
        q.lKnee = .4 * Math.max(0, st);
        q.rKnee = .4 * Math.max(0, -st);
        q.bob = .03 * Math.abs(st);
        q.sway = .09 * st;
        q.lArm = -1.6 - .15 * Math.sin(al * .5); // 頭上の円弧
        q.rArm = -1.6 - .15 * Math.sin(al * .5 + .8);
        q.lElb = -.9; q.rElb = -.9; // 肘を深く曲げて組む
        q.lean = .05 * st;
        q.headTilt = .07 * Math.sin(al * .5 + .4);
        break;
      }
      case 'courante': {
        // クーラント: 軽やかな小走りの歩み+小さな跳躍(バロック舞曲)
        const cr = tt * 3.4;
        const st = Math.sin(cr);
        const jump = Math.max(0, Math.sin(cr * .5)); // 2拍に1回の小跳躍
        q.bob = .07 * jump;
        q.lThigh = -.15 - .4 * Math.max(0, st);
        q.rThigh = -.15 - .4 * Math.max(0, -st);
        q.lKnee = .55 * Math.max(0, st);
        q.rKnee = .55 * Math.max(0, -st);
        q.sway = .07 * st;
        q.lArm = -.6 - .3 * st; // 軽く振れる腕
        q.rArm = -.6 - .3 * st;
        q.lElb = -.35; q.rElb = -.35;
        q.lean = .05 * st;
        q.headTilt = .06 * Math.sin(cr * .5);
        break;
      }
      case 'rigaudon': {
        // リゴドン: 陽気なホップ+交互に踵を突き出す
        const rg = tt * 4;
        const st = Math.sin(rg);
        const hop = Math.abs(Math.sin(rg * .5));
        q.bob = .06 * hop;
        q.lThigh = -.2 - .35 * Math.max(0, st);
        q.rThigh = -.2 - .35 * Math.max(0, -st);
        q.lKnee = .15 * Math.max(0, st); // 踵を前に突き出す(膝を伸ばし気味)
        q.rKnee = .15 * Math.max(0, -st);
        q.sway = .08 * st;
        q.lArm = -.5 - .4 * Math.sin(rg * .5);
        q.rArm = -.5 - .4 * Math.sin(rg * .5 + 1);
        q.lElb = -.5; q.rElb = -.5;
        q.lean = .06 * st;
        q.headTilt = .08 * Math.sin(rg * .5);
        break;
      }
      case 'passepied': {
        // パスピエ: 3/8拍子の速い小ステップ+頭上に挙げた腕
        const ps = tt * 4.8;
        const st = Math.sin(ps);
        q.lThigh = -.15 - .3 * Math.max(0, st);
        q.rThigh = -.15 - .3 * Math.max(0, -st);
        q.lKnee = .4 * Math.max(0, st);
        q.rKnee = .4 * Math.max(0, -st);
        q.bob = .035 * Math.abs(st);
        q.sway = .08 * st;
        q.lArm = -1.3 - .25 * Math.sin(ps * .5); // 頭上に優雅に
        q.rArm = -1.3 - .25 * Math.sin(ps * .5 + 1.2);
        q.lElb = -.6; q.rElb = -.6;
        q.lean = .05 * st;
        q.headTilt = .06 * Math.sin(ps * .33);
        break;
      }
      case 'hambo': {
        // ハンボ: 3/4拍子+1拍目の深い沈み+旋回(スウェーデンの民俗ダンス)
        const hb = tt * 3.4;
        const beat = Math.floor(hb) % 3;
        const dip = beat === 0 ? .06 : .02; // 1拍目に深く沈む
        const st = Math.sin(hb * Math.PI * 2 / 3);
        q.bob = dip * (0.5 + 0.5 * Math.sin(hb));
        q.lean = .12 * Math.sin(hb * .66);
        q.spin = .35 * Math.sin(hb * .22); // ゆっくり旋回
        q.lArm = -.9 - .3 * Math.sin(hb * .5);
        q.rArm = -.9 - .3 * Math.sin(hb * .5 + .8);
        q.lElb = -.45; q.rElb = -.45;
        q.lThigh = -.1 - .2 * Math.max(0, st);
        q.rThigh = -.1 - .2 * Math.max(0, -st);
        q.sway = .07 * st;
        q.headTilt = .05 * Math.sin(hb * .4);
        break;
      }
      case 'galliard': {
        // ガリアード: サンクパス(4回の交互キック+最後の跳躍)
        const gl = tt * 4.4;
        const step = gl % 5;
        const kick = Math.sin(step * Math.PI);
        const side = Math.floor(gl / 5) % 2 === 0 ? 1 : -1; // 左右交互
        const leap = step > 4 ? 1 : 0;
        q.lThigh = side > 0 ? -.3 - .5 * Math.max(0, kick) : -.15;
        q.rThigh = side < 0 ? -.3 - .5 * Math.max(0, kick) : -.15;
        q.lKnee = .5 * Math.max(0, kick);
        q.rKnee = .5 * Math.max(0, kick);
        q.bob = .1 * leap * Math.sin((step - 4) * Math.PI);
        q.sway = .1 * side;
        q.lArm = -.7 - .5 * side * kick;
        q.rArm = -.7 - .5 * -side * kick;
        q.lElb = -.4; q.rElb = -.4;
        q.headTilt = .06 * side;
        q.spin = .1 * side * leap;
        break;
      }
      case 'saltarello': {
        // サルタレッロ: 連続する小跳躍+交互に後ろへ蹴り上げる脚
        const sa = tt * 5.2;
        const hop = Math.abs(Math.sin(sa));
        const st = Math.sin(sa);
        q.bob = .07 * hop;
        q.lKnee = .55 * Math.max(0, st);   // 左膝を後ろへ折る
        q.rKnee = .55 * Math.max(0, -st);
        q.lThigh = -.1 - .15 * Math.max(0, st);
        q.rThigh = -.1 - .15 * Math.max(0, -st);
        q.sway = .09 * st;
        q.lArm = -.6 - .45 * Math.sin(sa * .5);
        q.rArm = -.6 - .45 * Math.sin(sa * .5 + Math.PI);
        q.lElb = -.5; q.rElb = -.5;
        q.lean = .06 * st;
        q.headTilt = .05 * Math.sin(sa * .7);
        break;
      }
      case 'bransle': {
        // ブランル: 連なって左右に揺れる横ステップ+小さなキック
        const br = tt * 3.6;
        const st = Math.sin(br);
        q.sway = .16 * st; // 大きく左右に揺れる
        q.lean = .1 * st;
        q.lThigh = -.1 - .2 * Math.max(0, st);
        q.rThigh = -.1 - .2 * Math.max(0, -st);
        q.lKnee = .3 * Math.max(0, -st); // 揺れと逆側に小キック
        q.rKnee = .3 * Math.max(0, st);
        q.bob = .03 * Math.abs(st);
        q.lArm = -.4 - .25 * st;
        q.rArm = -.4 - .25 * -st;
        q.lElb = -.3; q.rElb = -.3;
        q.headTilt = .08 * st;
        break;
      }
      case 'farandole': {
        // ファランドール: 手を繋いで連なり弾む走りステップ
        const fa = tt * 5.5;
        const st = Math.sin(fa);
        q.bob = .06 * Math.abs(st); // 小さく弾む
        q.lThigh = -.2 - .35 * Math.max(0, st);
        q.rThigh = -.2 - .35 * Math.max(0, -st);
        q.lKnee = .45 * Math.max(0, -st);
        q.rKnee = .45 * Math.max(0, st);
        q.sway = .11 * st;
        q.lArm = -.9; q.rArm = -.9; // 両側の手を繋ぐように伸ばす
        q.lElb = -.2; q.rElb = -.2;
        q.lean = .08 * st;
        q.spin = .12 * Math.sin(fa * .3); // 列が蛇行する感じ
        q.headTilt = .05 * st;
        break;
      }
      case 'canarie': {
        // カナリー: 速い足踏み+小跳躍(カナリア諸島発の宮廷舞踊)
        const cn = tt * 6.4;
        const st = Math.sin(cn);
        q.lThigh = -.25 - .4 * Math.max(0, st);
        q.rThigh = -.25 - .4 * Math.max(0, -st);
        q.lKnee = .5 * Math.max(0, st);
        q.rKnee = .5 * Math.max(0, -st);
        q.bob = .05 * Math.abs(st) + .04 * Math.max(0, Math.sin(cn * .5)); // 踏み+跳ね
        q.sway = .07 * st;
        q.lArm = -.5 - .5 * Math.sin(cn * .5);
        q.rArm = -.5 - .5 * Math.sin(cn * .5 + Math.PI);
        q.lElb = -.55; q.rElb = -.55;
        q.lean = .05 * st;
        q.headTilt = .04 * Math.sin(cn * .8);
        break;
      }
      case 'volta': {
        // ヴォルタ(ラ・ヴォルタ): 回りながら跳ねるエリザベス朝の舞踊
        const vo = tt * 4.2;
        const st = Math.sin(vo);
        q.spin = .9 * Math.sin(vo * .25); // 大きく旋回
        q.bob = .08 * Math.abs(st);
        q.lThigh = -.3 - .3 * Math.max(0, st);
        q.rThigh = -.3 - .3 * Math.max(0, -st);
        q.lKnee = .4 * Math.max(0, -st);
        q.rKnee = .4 * Math.max(0, st);
        q.lArm = -1.1 - .3 * st; // 相手を抱えるように高い腕
        q.rArm = -1.1 - .3 * -st;
        q.lElb = -.5; q.rElb = -.5;
        q.lean = .1 * st;
        q.headTilt = .07 * Math.sin(vo * .5);
        break;
      }
      case 'jota': {
        // ホタ: カスタネットを鳴らす頭上の腕+小さな跳躍ステップ(アラゴン)
        const jo = tt * 5.8;
        const st = Math.sin(jo);
        q.bob = .055 * Math.abs(st);
        q.lThigh = -.2 - .3 * Math.max(0, st);
        q.rThigh = -.2 - .3 * Math.max(0, -st);
        q.lKnee = .4 * Math.max(0, -st);
        q.rKnee = .4 * Math.max(0, st);
        q.lArm = -2.3 + .25 * Math.sin(jo * 2); // 頭上でカスタネット
        q.rArm = -2.3 - .25 * Math.sin(jo * 2);
        q.lElb = -.9; q.rElb = -.9;
        q.sway = .08 * st;
        q.spin = .2 * Math.sin(jo * .3);
        q.headTilt = .06 * Math.sin(jo * .6);
        break;
      }
      case 'fandango': {
        // ファンダンゴ: カスタネットの腕を大きく回す求愛の踊り+回転
        const fd = tt * 4.6;
        const st = Math.sin(fd);
        q.spin = .5 * Math.sin(fd * .35); // 近づいたり離れたり
        q.bob = .05 * Math.abs(st);
        q.lThigh = -.15 - .3 * Math.max(0, st);
        q.rThigh = -.15 - .3 * Math.max(0, -st);
        q.lKnee = .35 * Math.max(0, -st);
        q.rKnee = .35 * Math.max(0, st);
        q.lArm = -1.8 - .5 * Math.sin(fd); // 頭上で大きく回る
        q.rArm = -1.8 - .5 * Math.sin(fd + Math.PI);
        q.lElb = -.7; q.rElb = -.7;
        q.sway = .1 * st;
        q.lean = .07 * st;
        q.headTilt = .08 * Math.sin(fd * .5);
        break;
      }
      case 'zapateado': {
        // サパテアド: 打楽器的な速い足踏み+腰を据えた姿勢
        const zp = tt * 7.2;
        const st = Math.sin(zp);
        q.lThigh = -.28 - .35 * Math.max(0, st);   // 踵を打ち鳴らす
        q.rThigh = -.28 - .35 * Math.max(0, -st);
        q.lKnee = .3 * Math.max(0, st);
        q.rKnee = .3 * Math.max(0, -st);
        q.bob = .025 * Math.abs(st); // 上体は安定
        q.lArm = -.35 - .15 * st; // 腰の近くで押さえる
        q.rArm = -.35 - .15 * -st;
        q.lElb = -.25; q.rElb = -.25;
        q.sway = .05 * st;
        q.lean = .04 * st;
        q.headTilt = .03 * Math.sin(zp * .5);
        break;
      }
      case 'korobushka': {
        // コロブーシュカ: ロシア民謡の購けやかな足踏み+胸の前で組む手
        const kb = tt * 5.5;
        const st = Math.sin(kb);
        q.lThigh = -.55 * Math.max(0, st);
        q.rThigh = -.55 * Math.max(0, -st);
        q.lKnee = .4 * Math.max(0, -st);
        q.rKnee = .4 * Math.max(0, st);
        q.lArm = -.7 - .25 * st; // 前腕を上げる
        q.rArm = -.7 - .25 * -st;
        q.lElb = -.8; q.rElb = -.8; // 胸前で組む
        q.bob = .03 * Math.abs(st);
        q.sway = .08 * st;
        q.lean = .05 * st;
        q.spin = .15 * Math.sin(kb * .4);
        q.headTilt = .05 * Math.sin(kb * .5);
        break;
      }
      case 'trepak': {
        // トレパク: 組み腕+交互に脚を蹴り出すロシア踊り
        const tp = tt * 5.8;
        const st = Math.sin(tp);
        q.lThigh = -.5 * Math.max(0, st) - .15;
        q.rThigh = -.5 * Math.max(0, -st) - .15;
        q.lKnee = .1;  // 蹴り出し脚は伸びる
        q.rKnee = .1;
        q.lArm = -.55; // 腰/胸の前で組む
        q.rArm = -.55;
        q.lElb = -.9; q.rElb = -.9;
        q.bob = .02 + .04 * Math.abs(st); // キックに合わせて沈む
        q.sway = .07 * st;
        q.lean = .06 * st;
        q.spin = .1 * Math.sin(tp * .5); // 徐々に回る
        q.headTilt = .04 * st;
        break;
      }
      case 'legenyes': {
        // レゲーニェシュ: ルーマニアの男性踊り — 踵を打ち合わせ+脚を弾く
        const lg = tt * 6.0;
        const st = Math.sin(lg);
        const click = Math.max(0, Math.sin(lg * 2)); // 踵打ちフェーズ
        q.lThigh = -.4 * Math.max(0, st) - .1;
        q.rThigh = -.4 * Math.max(0, -st) - .1;
        q.lKnee = .35 * Math.max(0, -st);
        q.rKnee = .35 * Math.max(0, st);
        q.bob = .05 * click; // ジャンプして踵を合わせる
        q.lArm = -.6 - .2 * st; // 腰に手+時々上げる
        q.rArm = -.6 - .2 * -st;
        q.lElb = -.55; q.rElb = -.55;
        q.sway = .08 * st;
        q.lean = .04 * st;
        q.spin = .12 * Math.sin(lg * .33);
        q.headTilt = .05 * st;
        break;
      }
      case 'kalamatianos': {
        // カラマティアノス: ギリシャの7/8輪踊り — 連なって横に流れる
        const kl = tt * 4.6;
        const st = Math.sin(kl);
        const ph = tt * 2.2; // 周回位相
        q.lThigh = -.35 * Math.max(0, st) - .05;
        q.rThigh = -.35 * Math.max(0, -st) - .05;
        q.lKnee = .3 * Math.max(0, -st);
        q.rKnee = .3 * Math.max(0, st);
        q.lArm = -.9; // 両腕を広げて隣と繋ぐ
        q.rArm = -.9;
        q.lElb = -.25; q.rElb = -.25;
        q.bob = .03 * Math.abs(st);
        q.sway = .12 * st; // 連れて大きく揺れる
        q.lean = .06 * st;
        q.spin = .3 * Math.sin(ph); // 輪を周る向きの変化
        q.headTilt = .06 * Math.sin(kl * .5);
        break;
      }
      case 'kolo': {
        // コロ: セルビアの輪踊り — 小刻みな横ステップ+膝の弾み
        const ko = tt * 5.2;
        const st = Math.sin(ko);
        q.lThigh = -.3 * Math.max(0, st);
        q.rThigh = -.3 * Math.max(0, -st);
        q.lKnee = .35 * Math.abs(st); // 膝の弾み
        q.rKnee = .35 * Math.abs(st);
        q.lArm = -.75; // 腰に繋ぐ腕
        q.rArm = -.75;
        q.lElb = -.5; q.rElb = -.5;
        q.bob = .04 * Math.abs(Math.sin(ko * 1.5));
        q.sway = .1 * st;
        q.lean = .05 * st;
        q.spin = .25 * Math.sin(tt * 2.0);
        q.headTilt = .05 * Math.sin(ko * .5);
        break;
      }
      case 'dabke': {
        // ダブケ: レバントの連踊り — 強い踏み込み+跳ね上げる脚
        const dk2 = tt * 5.0;
        const st = Math.sin(dk2);
        q.lThigh = -.5 * Math.max(0, st);
        q.rThigh = -.5 * Math.max(0, -st);
        q.lKnee = .5 * Math.max(0, -st);
        q.rKnee = .5 * Math.max(0, st);
        q.bob = .045 * Math.abs(st); // 踏み込みの沈み
        q.lArm = -.85; // 肩を組む腕
        q.rArm = -.85;
        q.lElb = -.35; q.rElb = -.35;
        q.sway = .09 * st;
        q.lean = .07 * st;
        q.spin = .2 * Math.sin(tt * 1.8);
        q.headTilt = .05 * st;
        break;
      }
      case 'sardana': {
        // サルダナ: カタルーニャの輪踊り — 挙げた腕+軽やかな足運び
        const sd = tt * 4.0;
        const st = Math.sin(sd);
        q.lThigh = -.3 * Math.max(0, st);
        q.rThigh = -.3 * Math.max(0, -st);
        q.lKnee = .3 * Math.max(0, -st);
        q.rKnee = .3 * Math.max(0, st);
        q.lArm = -1.5 - .2 * st; // 肩より高く円を作る腕
        q.rArm = -1.5 - .2 * -st;
        q.lElb = -.2; q.rElb = -.2;
        q.bob = .025 * Math.abs(st);
        q.sway = .1 * st;
        q.lean = .04 * st;
        q.spin = .35 * Math.sin(tt * 1.6); // 輪の周回
        q.headTilt = .04 * Math.sin(sd * .5);
        break;
      }
      case 'zeybek': {
        // ゼイベク: トルコの勇士踊り — 鷹のように横に張った腕+ゆっくり膝を深く
        const zb = tt * 3.6;
        const st = Math.sin(zb);
        q.lArm = -1.15; // 水平に張る腕
        q.rArm = -1.15;
        q.lElb = -.1; q.rElb = -.1;
        q.lThigh = -.45 * Math.max(0, st);
        q.rThigh = -.45 * Math.max(0, -st);
        q.lKnee = .55 * Math.abs(st); // 片膝を深く
        q.rKnee = .55 * Math.abs(st);
        q.bob = .05 * Math.abs(st); // 深く沈む
        q.sway = .12 * st;
        q.lean = .1 * st; // 左右に大きく寄せる
        q.spin = .18 * Math.sin(tt * 1.4);
        q.headTilt = .06 * st;
        break;
      }
      case 'tsamiko': {
        // ツァーミコ: ギリシャの男踊り — 高い跳躍+ゆっくり脚を振り上げる
        const ts = tt * 4.2;
        const st = Math.sin(ts);
        const leap = Math.max(0, Math.sin(ts * .5)); // 緩急
        q.lThigh = -.7 * Math.max(0, st);
        q.rThigh = -.7 * Math.max(0, -st);
        q.lKnee = .2 * Math.max(0, st);
        q.rKnee = .2 * Math.max(0, -st);
        q.bob = -.06 * leap; // 高く跳ぶ
        q.lArm = -1.3 - .3 * st;
        q.rArm = -1.3 - .3 * -st;
        q.lElb = -.15; q.rElb = -.15;
        q.sway = .1 * st;
        q.lean = .08 * st;
        q.spin = .4 * leap * Math.sin(ts * .25); // 跳躍で旋回
        q.headTilt = .05 * st;
        break;
      }
      case 'seguidilla': {
        // セギディーリャ: スペインのカスタネット踊り — 速い3拍子の足捌き+頭上の腕
        const sg = tt * 6;
        const st = Math.sin(sg);
        const beat = Math.sin(sg * 1.5);
        q.lArm = -1.5 + .2 * st;   // 頭上に組む腕
        q.rArm = -1.5 + .2 * -st;
        q.lElb = -.5; q.rElb = -.5;
        q.lThigh = -.2 * Math.max(0, beat);
        q.rThigh = -.2 * Math.max(0, -beat);
        q.lKnee = .15 * Math.abs(beat);
        q.rKnee = .15 * Math.abs(beat);
        q.bob = -.015 * Math.abs(st);
        q.sway = .06 * st;
        q.lean = .06 * beat;
        q.headTilt = .07 * st;
        q.spin = .25 * Math.sin(sg * .33); // ペアの回り込み
        break;
      }
      case 'sevillanas': {
        // セビジャーナス: セビーリャの祭り踊り — 腕を大きく回す+優雅な足捌き
        const sv = tt * 4.6;
        const st = Math.sin(sv);
        const arm = Math.sin(sv * .8);
        q.lArm = -1.1 + .6 * arm;          // 大きく回す腕
        q.rArm = -1.1 - .6 * arm;
        q.lElb = -.3 + .2 * arm; q.rElb = -.3 - .2 * arm;
        q.lThigh = -.18 * Math.max(0, st);
        q.rThigh = -.18 * Math.max(0, -st);
        q.lKnee = .12 * Math.abs(st);
        q.rKnee = .12 * Math.abs(st);
        q.bob = -.012 * Math.abs(st);
        q.sway = .08 * st;
        q.lean = .07 * st;
        q.headTilt = .08 * arm; // 腕に合わせて頭も
        q.spin = .3 * Math.sin(sv * .4);
        break;
      }
      case 'forro': {
        // フォホー: ブラジルの密着ペアダンス — 小刻みな左右ステップ+揺れる腰
        const fr = tt * 5;
        const st = Math.sin(fr);
        const side = Math.sin(fr * .5); // 2拍で左右
        q.sway = .12 * side;
        q.lean = .06 * side;
        q.bob = -.015 * Math.abs(st);
        q.lThigh = -.15 * Math.max(0, side);
        q.rThigh = -.15 * Math.max(0, -side);
        q.lKnee = .2 * Math.max(0, -side);
        q.rKnee = .2 * Math.max(0, side);
        q.lArm = -.9 + .15 * st;   // 相手を抱くように前へ
        q.rArm = -.9 - .15 * st;
        q.lElb = -.6; q.rElb = -.6;
        q.headTilt = .09 * side;
        q.spin = .15 * Math.sin(fr * .25);
        break;
      }
      case 'schuhplattler': {
        // シュープラットラー: バイエルンの叩き踊り — 太腿/靴を叩く動作+ホップ
        const sp = tt * 5.5;
        const st = Math.sin(sp);
        const slap = Math.max(0, Math.sin(sp * 2)); // 叩く瞬間
        q.bob = -.02 * Math.abs(st);
        q.lKnee = .5 * slap; // 脚を上げて叩く
        q.rKnee = .15;
        q.lThigh = -.55 * slap;
        q.rThigh = -.1;
        q.lArm = -.5 - .4 * slap;  // 太腿へ手を伸ばす
        q.rArm = -.6 + .3 * st;
        q.lElb = -.5; q.rElb = -.3;
        q.lean = .1 * st;
        q.sway = .06 * st;
        q.spin = .35 * Math.sin(sp * .5); // ゆっくり回る
        q.headTilt = .06 * st;
        break;
      }
      case 'halay': {
        // ハライ: トルコ/クルドの連踊り — 肩を組んで小刻みに踏む+揺れる列
        const hl = tt * 5;
        const st = Math.sin(hl);
        const step = Math.sin(hl * 2);
        q.sway = .05 * st;
        q.bob = -.012 * Math.abs(step);
        q.lThigh = -.12 * Math.max(0, step);
        q.rThigh = -.12 * Math.max(0, -step);
        q.lKnee = .18 * Math.abs(step);
        q.rKnee = .18 * Math.abs(step);
        q.lArm = -.35; q.rArm = -.35; // 隣の肩に手
        q.lElb = -.9; q.rElb = -.9;
        q.lean = .05 * st;
        q.headTilt = .05 * st;
        q.spin = .12 * Math.sin(hl * .3);
        break;
      }
      case 'polska': {
        // ポルスカ: 北欧の旋回ペアダンス — 3拍子の深い起伏+連続旋回
        const pk = tt * 3.4;
        const st = Math.sin(pk);
        q.bob = -.04 * Math.max(0, -st); // 1拍目の沈み
        q.spin = 1.2 * st;               // 連続して回る
        q.sway = .07 * st;
        q.lean = .09 * st;
        q.lArm = -1.0 + .15 * st;        // 組む腕
        q.rArm = -1.0 - .15 * st;
        q.lElb = -.5; q.rElb = -.5;
        q.lThigh = -.15 * Math.max(0, st);
        q.rThigh = -.15 * Math.max(0, -st);
        q.lKnee = .12 * Math.abs(st);
        q.rKnee = .12 * Math.abs(st);
        q.headTilt = .06 * st;
        break;
      }
      case 'cumbia': {
        // クンビア: コロンビアの輪踊り — 小さな後退ステップ+回る腰+ろうそくを抱く腕
        const cb = tt * 4.4;
        const st = Math.sin(cb);
        const hip = Math.sin(cb * 2);
        q.sway = .1 * st;
        q.lean = .05 * hip;
        q.bob = -.012 * Math.abs(st);
        q.lThigh = -.15 * Math.max(0, -st);
        q.rThigh = -.15 * Math.max(0, st);
        q.lKnee = .15 * Math.abs(st);
        q.rKnee = .15 * Math.abs(st);
        q.lArm = -.7 - .2 * st;   // 片腕はろうそくを掲げる
        q.rArm = -.4 + .15 * hip; // もう片腕はスカートを持つ
        q.lElb = -.3; q.rElb = -.5;
        q.headTilt = .06 * st;
        q.spin = .35 * Math.sin(cb * .33); // 輪を周る
        break;
      }
      case 'landler': {
        // レントラー: オーストリアのゆったり円舞 — 手を打つ+ホップ+旋回
        const ld = tt * 3.6;
        const st = Math.sin(ld);
        const clap = Math.max(0, Math.sin(ld * 3)); // 手拍子
        q.bob = -.03 * Math.abs(st);
        q.spin = .8 * st;          // 大きく旋回
        q.sway = .06 * st;
        q.lArm = -.6 - .5 * clap;  // 手を打つために前方へ
        q.rArm = -.6 - .5 * clap;
        q.lElb = -.4; q.rElb = -.4;
        q.lThigh = -.2 * Math.max(0, st);
        q.rThigh = -.2 * Math.max(0, -st);
        q.lKnee = .15 * Math.abs(st);
        q.rKnee = .15 * Math.abs(st);
        q.lean = .06 * st;
        q.headTilt = .07 * st;
        break;
      }
      case 'hopak': {
        // ホパーク: ウクライナの祝祭踊り — 大きな跳躍+屈伸の脚捌き+誇らしげな腕
        const hp = tt * 5;
        const st = Math.sin(hp);
        const jump = Math.max(0, Math.sin(hp * .5));
        q.bob = -.05 * jump;      // 高い跳躍
        q.lThigh = -.6 * jump;
        q.rThigh = -.25 * Math.max(0, -st);
        q.lKnee = .7 * jump;
        q.rKnee = .3 * Math.max(0, -st);
        q.lArm = -1.5 - .2 * st;  // 誇らしげに頭上へ
        q.rArm = -.4 + .3 * st;
        q.lElb = -.2; q.rElb = -.4;
        q.sway = .07 * st;
        q.lean = .08 * st;
        q.spin = .5 * Math.sin(hp * .25);
        q.headTilt = .05 * st;
        break;
      }
      case 'kalbelia': {
        // カルベリア: ラジャスタンの蛇踊り — 渦巻く旋回+後ろへそる上体+腕を波立たせる
        const kb = tt * 4.4;
        const st = Math.sin(kb);
        q.spin = .6 * Math.sin(kb * .5);   // 渦巻き旋回
        q.sway = .12 * st;
        q.lean = -.15 * Math.abs(Math.sin(kb * .5)); // 後ろへそる
        q.bob = -.03 * Math.abs(st);
        q.lArm = -.9 - .5 * st;            // 蛇のようにうねる腕
        q.rArm = -.9 + .5 * st;
        q.lElb = -.4 - .3 * st; q.rElb = -.4 + .3 * st;
        q.lThigh = -.1 * st; q.rThigh = .1 * st;
        q.lKnee = .15; q.rKnee = .15;
        q.headTilt = .1 * Math.sin(kb * .5);
        break;
      }
      case 'bhangra': {
        // バングラ: パンジャブの豊作踊り — 弾む肩+高く挙げる両腕+キック
        const bh = tt * 5.4;
        const st = Math.sin(bh);
        const beat = Math.sin(bh * 2);
        q.bob = -.04 * Math.abs(st);       // 弾む
        q.lArm = -1.8 - .2 * beat;         // 両腕を頭上に突き上げる
        q.rArm = -1.8 + .2 * beat;
        q.lElb = -.5 - .3 * st; q.rElb = -.5 + .3 * st; // 指を鳴らすように
        q.lThigh = -.35 * Math.max(0, st);
        q.rThigh = -.35 * Math.max(0, -st);
        q.lKnee = .4 * Math.max(0, st);
        q.rKnee = .4 * Math.max(0, -st);
        q.sway = .1 * st;                  // 肩を上下する
        q.lean = .06 * st;
        q.spin = .3 * Math.sin(bh * .25);
        q.headTilt = .07 * st;
        break;
      }
      case 'kathak': {
        // カタック: 北インドの古典舞踊 — 速いピルエット+足を打ち鳴らす+優美な手
        const kt = tt * 4.8;
        const st = Math.sin(kt);
        q.spin = .9 * Math.sin(kt * .4);   // ピルエット
        q.bob = -.02 * Math.abs(st);
        q.lThigh = -.35 * Math.max(0, st); // 交互に足を打つ
        q.rThigh = -.1;
        q.lKnee = .5 * Math.max(0, st);
        q.rKnee = .15;
        q.lArm = -1.1 - .4 * st;           // 優美に広げる腕
        q.rArm = -.7 + .5 * st;
        q.lElb = -.35; q.rElb = -.6;       // ムドラーの手の形
        q.sway = .06 * st;
        q.lean = .05 * Math.sin(kt * .5);
        q.headTilt = .1 * Math.sin(kt * .5);
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
    if (hs === 'pony') {
      // ポニーテール: 頭の右後ろから流れる髪束
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.moveTo(hx + hr * .55, hy - hr * .95);
      ctx.quadraticCurveTo(hx + hr * 1.55, hy - hr * .55, hx + hr * 1.35, hy + hr * .95);
      ctx.quadraticCurveTo(hx + hr * .9, hy + hr * .45, hx + hr * .75, hy - hr * .5);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + hr * .52, hy - hr * .82, hr * .16, 0, 7); ctx.fill(); // 結び目
    }
    if (hs === 'mush') {
      // マッシュルーム: 頭全体を覆う丸いキノコ頭(顔の下半分だけ残す)
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.arc(hx, hy - hr * .18, hr * 1.14, Math.PI, Math.PI * 2);
      ctx.quadraticCurveTo(hx + hr * 1.14, hy + hr * .28, hx + hr * .9, hy + hr * .3);
      ctx.lineTo(hx - hr * .9, hy + hr * .3);
      ctx.quadraticCurveTo(hx - hr * 1.14, hy + hr * .28, hx - hr * 1.14, hy - hr * .18);
      ctx.closePath(); ctx.fill();
    }
    if (hs === 'curly') {
      // パーマ: 頭全体を覆うモコモコの縮れ毛(重なる小円)
      ctx.fillStyle = hairC;
      const rng2 = mulberry32(31);
      for (let i = 0; i < 14; i++) {
        const a = Math.PI + (i / 13) * Math.PI;             // 上半周に配置
        const rr = hr * (1.02 + rng2() * .18);
        ctx.beginPath();
        ctx.arc(hx + Math.cos(a) * rr, hy - hr * .05 + Math.sin(a) * rr, hr * (.3 + rng2() * .14), 0, 7);
        ctx.fill();
      }
    }
    if (hs === 'braid') {
      // 三つ編み: 側頭部から垂れる玉髪(交互ずれの連続円+先の結び目)
      ctx.fillStyle = hairC;
      const bx = hx + hr * .8, by = hy - hr * .1;
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.ellipse(bx + ((k % 2) ? .07 : -.07) * hr, by + k * hr * .32, hr * .19, hr * .22, 0, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(52,56,68,0.95)';
      ctx.fillRect(bx - hr * .1, by + 6 * hr * .32 - hr * .06, hr * .2, hr * .1);
    }
    if (hs === 'pomp') {
      // ポンパドール: 前髪を高く盛り上げたリーゼント風
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.moveTo(hx - hr * .85, hy - hr * .45);
      ctx.quadraticCurveTo(hx - hr * .7, hy - hr * 1.7, hx + hr * .25, hy - hr * 1.5);
      ctx.quadraticCurveTo(hx + hr * .95, hy - hr * 1.3, hx + hr * .9, hy - hr * .4);
      ctx.lineTo(hx + hr * .5, hy - hr * .55);
      ctx.lineTo(hx - hr * .4, hy - hr * .5);
      ctx.closePath(); ctx.fill();
    }
    if (hs === 'odango') {
      // お団子: 頭頂両サイドの丸いお団子
      ctx.fillStyle = hairC;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.arc(hx + s * hr * .8, hy - hr * .85, hr * .34, 0, 7); ctx.fill();
      }
    }
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
      } else if (es === 'wide') {
      // 見開き目: 大きな白目+小さい瞳(驚き・キラキラ)
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(ex - eo, ey, esz * .62 * eo, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + eo, ey, esz * .62 * eo, 0, 7); ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath(); ctx.arc(ex - eo, ey, esz * .3 * eo, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + eo, ey, esz * .3 * eo, 0, 7); ctx.fill();
    } else if (es === 'cat') {
        // 猫目: 縦長の縦孔瞳孔(瞬きと連動)
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        ctx.ellipse(ex, ey, Math.max(.8, hr * .045 * esz), Math.max(1, hr * .15 * esz * Math.max(.15, eo)), 0, 0, 7);
        ctx.fill();
      } else if (es === 'xx') {
        // バツ目: ✕✕(気絶・KO系の定番記号)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = Math.max(1.2, hr * .05 * esz);
        const rr = hr * .13 * esz;
        ctx.beginPath();
        ctx.moveTo(ex - rr, ey - rr); ctx.lineTo(ex + rr, ey + rr);
        ctx.moveTo(ex + rr, ey - rr); ctx.lineTo(ex - rr, ey + rr);
        ctx.stroke();
      } else if (es === 'dizzy') {
        // ぐるぐる目: 渦巻き(旋回する小円弧の連鎖で近似)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = Math.max(1, hr * .06 * esz);
        ctx.beginPath();
        const dr = hr * .16 * esz;
        for (let k = 0; k < 8; k++) {
          const a = k * 1.05, r2 = dr * (1 - k / 10);
          const mx = ex + Math.cos(a) * r2, my2 = ey + Math.sin(a) * r2;
          k ? ctx.lineTo(mx, my2) : ctx.moveTo(mx, my2);
        }
        ctx.stroke();
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
    const N = type === 'snow' ? 70 : type === 'petal' ? 34 : type === 'rain' ? 110 : type === 'leaf' ? 30 : type === 'ember' ? 38 : type === 'bubble' ? 28 : type === 'confetti' ? 70 : type === 'firefly' ? 26 : type === 'bokeh' ? 16 : type === 'notes' ? 18 : type === 'hearts' ? 20 : type === 'spark' ? 46 : type === 'wind' ? 14 : 42;
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
      } else if (type === 'spark') {
        // 火花: 一点から放射状に飛ぶ短い光条(火縄・スパーク演出)
        const ox = W * (.2 + h(i, 0) * .6), oy = H * (.25 + h(i, 1) * .5);
        const life = (h(i, 2) + t * (1.5 + h(i, 3))) % 1;          // 0→1 の短い生涯
        const ang = h(i, 4) * 6.283 + i * .7;
        const dist = life * (14 + 26 * h(i, 1));
        const sx = ox + Math.cos(ang) * dist, sy = oy + Math.sin(ang) * dist + life * life * 10;
        ctx.strokeStyle = `rgba(255,${200 - Math.round(life * 120)},90,${(1 - life) * .9})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - Math.cos(ang) * 5, sy - Math.sin(ang) * 5);
        ctx.stroke();
      } else if (type === 'wind') {
        // 風: 右へ流れる長い弧の流線(途切れて再出現)
        const life = (h(i, 0) + t * (.12 + .1 * h(i, 1))) % 1;
        const x = (life * 1.3 - .15) * W;
        const y = h(i, 2) * H + Math.sin(life * 6 + i) * H * .02;
        const len = W * (.06 + .08 * h(i, 3));
        const a = Math.sin(life * Math.PI) * (.25 + .3 * h(i, 4));
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1.2 + h(i, 3);
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.quadraticCurveTo(x - len * .5, y - len * .22, x, y);
        ctx.quadraticCurveTo(x + len * .18, y + len * .12, x + len * .3, y + len * .05);
        ctx.stroke();
      } else if (type === 'hearts') {
        // ハート: ♥マークがふわふわ昇る
        const x = h(i, 0) * W + Math.sin(t * .7 + i * 2.1) * W * .045;
        const y = (1 - ((h(i, 1) + t * (.05 + .035 * h(i, 2))) % 1)) * H;
        ctx.fillStyle = `hsla(${330 + Math.round(h(i, 3) * 30)},85%,${62 + Math.round(h(i, 4) * 12)}%,${.5 + .35 * h(i, 4)})`;
        ctx.font = `${Math.round(12 + 14 * h(i, 3))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('♥', x, y);
      } else if (type === 'notes') {
        // 音符: ♪♫ がゆらゆら昇る(ダンス・おしゃべりと相性)
        const x = h(i, 0) * W + Math.sin(t * .8 + i * 1.7) * W * .04;
        const y = (1 - ((h(i, 1) + t * (.06 + .04 * h(i, 2))) % 1)) * H;
        ctx.fillStyle = `hsla(${Math.round(h(i, 3) * 360)},70%,68%,${.55 + .3 * h(i, 4)})`;
        ctx.font = `${Math.round(14 + 12 * h(i, 3))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(h(i, 2) < .5 ? '♪' : '♫', x, y);
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
      case 'scarf': {
        // マフラー: 首の帯 + 風に揺れる垂れ端
        ctx.fillStyle = acc2;
        ctx.beginPath(); ctx.ellipse(hx, hy + hr * .75, hr * .78, hr * .22, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx + hr * .42, hy + hr * 1.02, hr * .2, hr * .42, .5, 0, 7); ctx.fill();
        break;
      }
      case 'beret': {
        // ベレー帽: 頭頂に斜め被せた円盤 + 茎
        ctx.fillStyle = acc2;
        ctx.save();
        ctx.translate(hx - hr * .12, hy - hr * .92); ctx.rotate(-.22);
        ctx.beginPath(); ctx.ellipse(0, 0, hr * .95, hr * .4, 0, 0, 7); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1.5, hr * .06); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * 1.28); ctx.lineTo(hx - hr * .12, hy - hr * 1.05); ctx.stroke();
        break;
      }
      case 'tie': {
        // ネクタイ: 首元の結び目 + 胸へ下がる帯(accHueで着色)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .22, hy + hr * .82); ctx.lineTo(hx + hr * .22, hy + hr * .82);
        ctx.lineTo(hx, hy + hr * 1.06); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx - hr * .16, hy + hr * 1.06); ctx.lineTo(hx + hr * .16, hy + hr * 1.06);
        ctx.lineTo(hx + hr * .1, hy + hr * 2.1); ctx.lineTo(hx - hr * .1, hy + hr * 2.1);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'monocle': {
        // モノクル: 右眼の円レンズ + 顎下へ下がるチェーン
        ctx.strokeStyle = `hsla(${Math.round((hue == null ? .12 : hue) * 360)},75%,60%,0.95)`;
        ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.beginPath(); ctx.arc(hx + hr * .38, hy - hr * .12, hr * .26, 0, 7); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + hr * .38, hy + hr * .14);
        ctx.quadraticCurveTo(hx + hr * .75, hy + hr * .6, hx + hr * .5, hy + hr * 1.05);
        ctx.stroke();
        break;
      }
      case 'bandana': {
        // バンダナ: 頭頂を覆う三角頭巾+結び目
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * 1.02, hy - hr * .55);
        ctx.lineTo(hx + hr * 1.02, hy - hr * .55);
        ctx.lineTo(hx + hr * .75, hy - hr * 1.5);
        ctx.lineTo(hx - hr * .75, hy - hr * 1.5);
        ctx.closePath(); ctx.fill();
        // 結び目の垂れ端(右側)
        ctx.beginPath();
        ctx.moveTo(hx + hr * .95, hy - hr * .6);
        ctx.lineTo(hx + hr * 1.25, hy - hr * .95);
        ctx.lineTo(hx + hr * 1.1, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx + hr * .95, hy - hr * .62, hr * .09, 0, 7); ctx.fill();
        break;
      }
      case 'coonskin': {
        // クーンスキン帽: 毛皮のドーム+後ろに垂れる縞尻尾
        // 尻尾(先に描く)
        ctx.fillStyle = '#8a7050';
        ctx.beginPath();
        ctx.ellipse(hx + hr * .75, hy + hr * .3, hr * .18, hr * .55, .3, 0, 7);
        ctx.fill();
        // 尻尾の縞
        ctx.fillStyle = '#4a3a28';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(hx + hr * (.68 + i * .06), hy + hr * (0 + i * .28), hr * .14, hr * .09, .3, 0, 7);
          ctx.fill();
        }
        // 毛皮ドーム
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .78, hr * .55, 0, Math.PI, Math.PI * 2);
        ctx.closePath(); ctx.fill();
        // 縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .08);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .78, hr * .55, 0, Math.PI * .05, Math.PI * .95);
        ctx.stroke();
        break;
      }
      case 'wimple': {
        // ウィンプル: 頭・顎・首を包む中世の頭布(顔だけ開口)
        ctx.beginPath();
        ctx.ellipse(hx, hy + hr * .35, hr * .82, hr * 1.05, 0, 0, 7); // 頭+首の覆い
        ctx.ellipse(hx, hy + hr * .1, hr * .55, hr * .62, 0, 0, 7);   // 顔の開口
        ctx.fillStyle = acc2;
        ctx.fill('evenodd');
        // 布の縁取り
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .06);
        ctx.beginPath();
        ctx.ellipse(hx, hy + hr * .1, hr * .55, hr * .62, 0, Math.PI * .7, Math.PI * 1.3);
        ctx.stroke();
        // 顎下の巻き縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .08);
        ctx.beginPath();
        ctx.ellipse(hx, hy + hr * .5, hr * .68, hr * .35, 0, Math.PI * .15, Math.PI * .85);
        ctx.stroke();
        break;
      }
      case 'mukut': {
        // ムクット: ヒンドゥーの神冠 — 高い尖塔型の冠+宝珠+垂れる飾り
        ctx.fillStyle = acc2;
        // 冠の土台(帯)
        ctx.fillRect(hx - hr * .5, hy - hr * .75, hr, hr * .25);
        // 高い尖塔の冠(3段に細くなる)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .45, hy - hr * .75);
        ctx.quadraticCurveTo(hx - hr * .3, hy - hr * 1.1, hx - hr * .15, hy - hr * 1.3);
        ctx.quadraticCurveTo(hx, hy - hr * 1.65, hx + hr * .15, hy - hr * 1.3);
        ctx.quadraticCurveTo(hx + hr * .3, hy - hr * 1.1, hx + hr * .45, hy - hr * .75);
        ctx.closePath(); ctx.fill();
        // 段の筋
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .04);
        for (const yy of [.95, 1.15, 1.35]) {
          const ww = hr * (.42 - (yy - .95) * .7);
          ctx.beginPath();
          ctx.moveTo(hx - ww, hy - hr * yy);
          ctx.lineTo(hx + ww, hy - hr * yy);
          ctx.stroke();
        }
        // 頂の宝珠
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.62, hr * .08, 0, 7); ctx.fill();
        // 帯の中央飾り
        ctx.beginPath(); ctx.arc(hx, hy - hr * .62, hr * .11, 0, 7); ctx.fill();
        break;
      }
      case 'pagri': {
        // パグリ: シク教のターバン — 層を重ねた巻き布+前のタカ(房)+宝冠珠
        ctx.fillStyle = acc2;
        // 大きな前盛り(ファン型の折りたたみ)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .5);
        ctx.quadraticCurveTo(hx - hr * .5, hy - hr * 1.35, hx + hr * .25, hy - hr * 1.3);
        ctx.quadraticCurveTo(hx + hr * .75, hy - hr * 1.2, hx + hr * .62, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        // 巻き布の層の筋(斜めの織り目)
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .04);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.moveTo(hx - hr * .55, hy - hr * (.55 + i * .16));
          ctx.quadraticCurveTo(hx, hy - hr * (.68 + i * .18), hx + hr * .58, hy - hr * (.52 + i * .16));
        }
        ctx.stroke();
        // 中央の立つ折り目(タカ)
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .1);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .1, hy - hr * .75);
        ctx.quadraticCurveTo(hx + hr * .05, hy - hr * 1.45, hx + hr * .2, hy - hr * 1.5);
        ctx.stroke();
        // 飾り珠
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx + hr * .15, hy - hr * .85, hr * .09, 0, 7); ctx.fill();
        break;
      }
      case 'tikka': {
        // ティッカ(マーング・ティッカ): インドの額飾り — 髪生え際への鎖+垂れる宝石+珠
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.05);   // 髪の生え際から
        ctx.lineTo(hx, hy - hr * .68);    // 額の中央へ鎖
        ctx.stroke();
        // 鎖の珠(3粒)
        ctx.fillStyle = acc2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(hx, hy - hr * (1.0 - i * .12), hr * .045, 0, 7);
          ctx.fill();
        }
        // 垂れる宝石(涙型)
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * .72);
        ctx.quadraticCurveTo(hx - hr * .14, hy - hr * .55, hx, hy - hr * .42);
        ctx.quadraticCurveTo(hx + hr * .14, hy - hr * .55, hx, hy - hr * .72);
        ctx.closePath(); ctx.fill();
        // 宝石の輝き
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx - hr * .03, hy - hr * .57, hr * .04, 0, 7); ctx.fill();
        // 両脇の小珠
        ctx.fillStyle = acc2;
        ctx.beginPath(); ctx.arc(hx - hr * .35, hy - hr * .78, hr * .04, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + hr * .35, hy - hr * .78, hr * .04, 0, 7); ctx.fill();
        break;
      }
      case 'karakul': {
        // カラクル帽(ジンナー帽): ペルシャ羊毛の wedge 帽 — 丸みのある楔型+起毛の質感
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .5);
        ctx.quadraticCurveTo(hx - hr * .55, hy - hr * 1.15, hx, hy - hr * 1.2);
        ctx.quadraticCurveTo(hx + hr * .55, hy - hr * 1.15, hx + hr * .6, hy - hr * .5);
        ctx.quadraticCurveTo(hx, hy - hr * .72, hx - hr * .6, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        // 起毛の縁(短い筋)
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .035);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const fx = hx - hr * .5 + i * hr * .11;
          const fy = hy - hr * (.5 + .04 * Math.sin(i * 3));
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + hr * .04, fy - hr * .07);
        }
        ctx.stroke();
        // 前の縫い目
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.18);
        ctx.quadraticCurveTo(hx + hr * .05, hy - hr * .85, hx, hy - hr * .68);
        ctx.stroke();
        break;
      }
      case 'bandeau': {
        // バンドゥ: 1920年代の額帯 — 額を巻く帯+羽根飾り+宝石
        ctx.strokeStyle = acc2; ctx.lineWidth = hr * .22;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .28, hr * .95, hr * .8, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
        // 側面の結び目
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.arc(hx + hr * .82, hy - hr * .32, hr * .12, 0, 7);
        ctx.fill();
        // 立つ羽根
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx + hr * .85, hy - hr * .35);
        ctx.quadraticCurveTo(hx + hr * .75, hy - hr * 1.1, hx + hr * .95, hy - hr * 1.35);
        ctx.quadraticCurveTo(hx + hr * .95, hy - hr * .9, hx + hr * .9, hy - hr * .35);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .03);
        ctx.beginPath();
        ctx.moveTo(hx + hr * .87, hy - hr * .35);
        ctx.lineTo(hx + hr * .92, hy - hr * 1.3);
        ctx.stroke();
        // 中央の宝石
        ctx.fillStyle = '#e0c040';
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * .5);
        ctx.lineTo(hx + hr * .09, hy - hr * .32);
        ctx.lineTo(hx, hy - hr * .14);
        ctx.lineTo(hx - hr * .09, hy - hr * .32);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'cordobes': {
        // コルドベス帽: スペインの平天広つば帽 — まっすぐな円筒+水平つば+帯
        ctx.fillStyle = acc2;
        // 平らな円筒クラウン
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .5);
        ctx.lineTo(hx - hr * .5, hy - hr * 1.0);
        ctx.lineTo(hx + hr * .5, hy - hr * 1.0);
        ctx.lineTo(hx + hr * .5, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        // 水平の広つば(楕円)
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .95, hr * .17, 0, 0, 7);
        ctx.fill();
        // 帯
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .5, hy - hr * .66, hr, hr * .13);
        // つばの縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .04);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .95, hr * .17, 0, 0, 7);
        ctx.stroke();
        break;
      }
      case 'chullo': {
        // チューロ帽: アンデスの編み帽 — 耳あて+房ひも+幾何学模様
        ctx.fillStyle = acc2;
        // 尖ったクラウン
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .45);
        ctx.quadraticCurveTo(hx - hr * .4, hy - hr * 1.3, hx, hy - hr * 1.35);
        ctx.quadraticCurveTo(hx + hr * .4, hy - hr * 1.3, hx + hr * .55, hy - hr * .45);
        ctx.closePath(); ctx.fill();
        // 耳あて(両側に垂れる)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .45);
        ctx.lineTo(hx - hr * .6, hy + hr * .3);
        ctx.lineTo(hx - hr * .45, hy + hr * .35);
        ctx.lineTo(hx - hr * .4, hy - hr * .45);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + hr * .55, hy - hr * .45);
        ctx.lineTo(hx + hr * .6, hy + hr * .3);
        ctx.lineTo(hx + hr * .45, hy + hr * .35);
        ctx.lineTo(hx + hr * .4, hy - hr * .45);
        ctx.closePath(); ctx.fill();
        // 幾何学の縞(ダイヤ模様)
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .45, hy - hr * .7); ctx.lineTo(hx + hr * .45, hy - hr * .7);
        ctx.moveTo(hx - hr * .35, hy - hr * .9); ctx.lineTo(hx + hr * .35, hy - hr * .9);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const dx = hx - hr * .36 + i * hr * .18;
          ctx.moveTo(dx, hy - hr * .85); ctx.lineTo(dx + hr * .08, hy - hr * .75);
          ctx.lineTo(dx + hr * .16, hy - hr * .85);
        }
        ctx.stroke();
        // 房ひも
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1.5, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .52, hy + hr * .32);
        ctx.lineTo(hx - hr * .55, hy + hr * .6);
        ctx.moveTo(hx + hr * .52, hy + hr * .32);
        ctx.lineTo(hx + hr * .55, hy + hr * .6);
        ctx.stroke();
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.arc(hx - hr * .55, hy + hr * .62, hr * .07, 0, 7);
        ctx.arc(hx + hr * .55, hy + hr * .62, hr * .07, 0, 7);
        ctx.fill();
        break;
      }
      case 'pith': {
        // 探検帽(コルク帽): 半球ドーム+水平の広つば+帯
        ctx.fillStyle = acc2;
        // ドーム
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .55, hr * .5, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 広い平つば
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .95, hr * .18, 0, 0, 7);
        ctx.fill();
        // つばの縁(やや下がり)
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .04);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .95, hr * .18, 0, 0, 7);
        ctx.stroke();
        // 帯
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .55, hy - hr * .62, hr * 1.1, hr * .14);
        // ドーム頂のボタン
        ctx.beginPath();
        ctx.arc(hx, hy - hr * 1.0, hr * .06, 0, 7);
        ctx.fill();
        break;
      }
      case 'kepi': {
        // ケピ帽: フランス軍帽 — 平らな円筒+水平の短いつば+額の帯
        // 前傾した円筒
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .45);
        ctx.lineTo(hx - hr * .45, hy - hr * 1.05);
        ctx.lineTo(hx + hr * .55, hy - hr * 1.05);
        ctx.lineTo(hx + hr * .62, hy - hr * .45);
        ctx.closePath(); ctx.fill();
        // 平らな天辺
        ctx.beginPath();
        ctx.ellipse(hx + hr * .05, hy - hr * 1.05, hr * .5, hr * .12, 0, 0, 7);
        ctx.fill();
        // 水平のつば
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .4, hr * .68, hr * .11, 0, 0, 7);
        ctx.fill();
        // 額の帯+側面の筋
        ctx.fillRect(hx - hr * .58, hy - hr * .62, hr * 1.18, hr * .14);
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .04);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .5); ctx.lineTo(hx - hr * .44, hy - hr * .95);
        ctx.moveTo(hx + hr * .58, hy - hr * .5); ctx.lineTo(hx + hr * .52, hy - hr * .95);
        ctx.stroke();
        break;
      }
      case 'pamela': {
        // パメラ: 広々とした女優帽 — 波打つ大きなつば+リボン
        // 波型の大つば
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * 1.3, hy - hr * .45);
        for (let i = 0; i <= 8; i++) {
          const px = hx - hr * 1.3 + i * hr * .325;
          ctx.quadraticCurveTo(
            px - hr * .16, hy - hr * (.45 + .1 * Math.sin(i * 2.4)),
            px, hy - hr * (.45 + .1 * Math.sin((i + 1) * 2.4)));
        }
        ctx.quadraticCurveTo(hx, hy - hr * .2, hx - hr * 1.3, hy - hr * .45);
        ctx.closePath(); ctx.fill();
        // 丸いクラウン
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .6, hr * .55, hr * .45, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // リボン帯
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .55, hy - hr * .62, hr * 1.1, hr * .12);
        // リボンの結び目(片側)
        ctx.beginPath();
        ctx.moveTo(hx + hr * .5, hy - hr * .6);
        ctx.lineTo(hx + hr * .72, hy - hr * .72);
        ctx.lineTo(hx + hr * .72, hy - hr * .48);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'vueltiao': {
        // ソンブレロ・ヴェルティアオ: コロンビアの編み帽 — 黒白の帯+広つば
        // 高いドーム
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .5, hr * .5, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 広いつば(わずかに上反り)
        ctx.beginPath();
        ctx.moveTo(hx - hr, hy - hr * .52);
        ctx.quadraticCurveTo(hx, hy - hr * .7, hx + hr, hy - hr * .52);
        ctx.quadraticCurveTo(hx, hy - hr * .45, hx - hr, hy - hr * .52);
        ctx.closePath();
        ctx.fillStyle = acc2; ctx.fill();
        // 黒い編み帯(つばとドームの境)
        ctx.strokeStyle = dk; ctx.lineWidth = hr * .1;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .52);
        ctx.lineTo(hx + hr * .55, hy - hr * .52);
        ctx.stroke();
        // ジグザグ編み模様
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .045);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const zx = hx - hr * .42 + i * hr * .15;
          ctx.moveTo(zx, hy - hr * .95);
          ctx.lineTo(zx + hr * .08, hy - hr * .7);
        }
        ctx.stroke();
        // つばの編み文様
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const zx = hx - hr * .85 + i * hr * .24;
          ctx.moveTo(zx, hy - hr * .55);
          ctx.lineTo(zx + hr * .12, hy - hr * .6);
        }
        ctx.stroke();
        break;
      }
      case 'capotain': {
        // カポテイン: 清教徒の高い平頂帽+バックルの帯
        ctx.fillStyle = acc2;
        // 高い台形クラウン
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .5);
        ctx.lineTo(hx - hr * .4, hy - hr * 1.35);
        ctx.lineTo(hx + hr * .4, hy - hr * 1.35);
        ctx.lineTo(hx + hr * .5, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        // 広いつば
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .9, hr * .16, 0, 0, 7);
        ctx.fill();
        // 帯+バックル
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .47, hy - hr * .75, hr * .94, hr * .16);
        ctx.strokeStyle = '#d0a030'; ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.strokeRect(hx - hr * .09, hy - hr * .78, hr * .18, hr * .22);
        break;
      }
      case 'capirote': {
        // カピロテ: スペインの尖り頭巾 — 顔を覆う布+高い円錐+目の孔
        ctx.fillStyle = acc2;
        // 顔/肩を覆う布
        ctx.beginPath();
        ctx.moveTo(hx - hr * .7, hy + hr * 1.1);
        ctx.quadraticCurveTo(hx - hr * .75, hy - hr * .3, hx, hy - hr * .35);
        ctx.quadraticCurveTo(hx + hr * .75, hy - hr * .3, hx + hr * .7, hy + hr * 1.1);
        ctx.closePath(); ctx.fill();
        // 高い円錐
        ctx.beginPath();
        ctx.moveTo(hx - hr * .45, hy - hr * .3);
        ctx.lineTo(hx, hy - hr * 1.9);
        ctx.lineTo(hx + hr * .45, hy - hr * .3);
        ctx.closePath(); ctx.fill();
        // 円錐の縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .45, hy - hr * .3);
        ctx.lineTo(hx, hy - hr * 1.9);
        ctx.lineTo(hx + hr * .45, hy - hr * .3);
        ctx.stroke();
        // 目の孔
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(hx - hr * .22, hy - hr * .05, hr * .09, hr * .12, 0, 0, 7);
        ctx.ellipse(hx + hr * .22, hy - hr * .05, hr * .09, hr * .12, 0, 0, 7);
        ctx.fill();
        break;
      }
      case 'doppa': {
        // ドッパ: ウズベクの四角い刺繍 skullcap — 台形の冠+縁の文様
        ctx.fillStyle = acc2;
        // やや四角い冠
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .15);
        ctx.lineTo(hx - hr * .48, hy - hr * .75);
        ctx.quadraticCurveTo(hx, hy - hr * .85, hx + hr * .48, hy - hr * .75);
        ctx.lineTo(hx + hr * .55, hy - hr * .15);
        ctx.quadraticCurveTo(hx, hy - hr * .02, hx - hr * .55, hy - hr * .15);
        ctx.closePath(); ctx.fill();
        // 縁帯
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .12, hr * .58, hr * .12, 0, 0, 7);
        ctx.fill();
        // 頂の十字文様
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .06);
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * .7); ctx.lineTo(hx, hy - hr * .5);
        ctx.moveTo(hx - hr * .12, hy - hr * .6); ctx.lineTo(hx + hr * .12, hy - hr * .6);
        ctx.stroke();
        // 四隅の点文様
        ctx.fillStyle = dk;
        for (const [ox, oy] of [[-.3, -.62], [.3, -.62], [-.35, -.35], [.35, -.35]]) {
          ctx.beginPath();
          ctx.arc(hx + hr * ox, hy + hr * oy, hr * .045, 0, 7);
          ctx.fill();
        }
        break;
      }
      case 'kalpak': {
        // カルパク: 中央アジアの高いフェルト帽 — 立ち上がる円筒+翻った縁
        ctx.fillStyle = acc2;
        // 高い冠
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .3);
        ctx.lineTo(hx - hr * .42, hy - hr * 1.25);
        ctx.quadraticCurveTo(hx, hy - hr * 1.35, hx + hr * .42, hy - hr * 1.25);
        ctx.lineTo(hx + hr * .5, hy - hr * .3);
        ctx.closePath(); ctx.fill();
        // 翻った縁帯
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .32, hr * .62, hr * .16, 0, 0, 7);
        ctx.fill();
        // 冠の装飾縫い筋
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * .5); ctx.lineTo(hx, hy - hr * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx - hr * .2, hy - hr * .48); ctx.lineTo(hx - hr * .15, hy - hr * 1.18);
        ctx.moveTo(hx + hr * .2, hy - hr * .48); ctx.lineTo(hx + hr * .15, hy - hr * 1.18);
        ctx.stroke();
        break;
      }
      case 'tagelmust': {
        // タゲルムスト: トゥアレグの藍色覆い — 頭を巻く布+顔の下半分を隠す
        ctx.fillStyle = acc2;
        // 頭の巻き布
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .35, hr * .72, hr * .62, 0, 0, 7);
        ctx.fill();
        // 目の横スリット(暗い帯の中に肌色の隙間)
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .05, hr * .6, hr * .38, 0, 0, 7);
        ctx.fill();
        // 目の開口
        ctx.fillStyle = '#e8c8a8';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .12, hr * .5, hr * .1, 0, 0, 7);
        ctx.fill();
        // 巻き筋
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .4, hr * .72, hr * .5, 0, Math.PI * .9, Math.PI * 1.5);
        ctx.stroke();
        break;
      }
      case 'caubeen': {
        // コービーン: アイルランドの帽 — 片側に傾く緑のベレー+羽根飾り
        ctx.save();
        ctx.translate(hx, hy - hr * .55);
        ctx.rotate(-.18); // 左に傾ける
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(0, 0, hr * .72, hr * .42, 0, Math.PI, Math.PI * 2);
        ctx.lineTo(hr * .72, 0);
        ctx.quadraticCurveTo(0, hr * .18, -hr * .72, 0);
        ctx.closePath(); ctx.fill();
        // 中央の茎
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .07);
        ctx.beginPath();
        ctx.moveTo(0, -hr * .4); ctx.lineTo(0, -hr * .58);
        ctx.stroke();
        ctx.restore();
        // 左側の羽根飾り
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx - hr * .55, hy - hr * .75, hr * .09, hr * .38, .35, 0, 7);
        ctx.fill();
        break;
      }
      case 'souwester': {
        // サウウェスター: 漁師の防水帽 — 冠+後ろに長く垂れるつば
        ctx.fillStyle = acc2;
        // 冠(わずかに傾いた円筒)
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .55, hr * .6, hr * .5, 0, Math.PI, Math.PI * 2);
        ctx.closePath(); ctx.fill();
        // 前のつば
        ctx.beginPath();
        ctx.ellipse(hx + hr * .25, hy - hr * .25, hr * .85, hr * .18, -.08, 0, 7);
        ctx.fill();
        // 後ろの長い垂れ(首を覆う)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .3);
        ctx.quadraticCurveTo(hx - hr * .95, hy + hr * .3, hx - hr * .5, hy + hr * .8);
        ctx.lineTo(hx - hr * .15, hy + hr * .7);
        ctx.quadraticCurveTo(hx - hr * .5, hy + hr * .25, hx - hr * .25, hy - hr * .28);
        ctx.closePath(); ctx.fill();
        // 縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .06);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .55, hr * .6, hr * .5, 0, Math.PI * .05, Math.PI * .95);
        ctx.stroke();
        break;
      }
      case 'petasos': {
        // ペタソス: 古代ギリシャの旅人帽 — 広いつば+低い円錐冠+顎紐
        ctx.fillStyle = acc2;
        // 広つば
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .3, hr * 1.15, hr * .25, 0, 0, 7);
        ctx.fill();
        // 低い円錐冠
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .32);
        ctx.lineTo(hx, hy - hr * 1.1);
        ctx.lineTo(hx + hr * .5, hy - hr * .32);
        ctx.closePath(); ctx.fill();
        // 縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .08);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .3, hr * 1.15, hr * .25, 0, Math.PI * .05, Math.PI * .95);
        ctx.stroke();
        // 顎紐
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .3);
        ctx.quadraticCurveTo(hx, hy + hr * 1.0, hx + hr * .5, hy - hr * .3);
        ctx.stroke();
        break;
      }
      case 'busby': {
        // バスビー帽: 高い毛皮の円柱帽(近衛兵)+側面の羽根飾り
        // 本体: 頭より高い円柱
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .7, hr * .55, hr * .95, 0, Math.PI, Math.PI * 2);
        ctx.lineTo(hx + hr * .55, hy - hr * .2);
        ctx.quadraticCurveTo(hx, hy, hx - hr * .55, hy - hr * .2);
        ctx.closePath(); ctx.fill();
        // 裾の縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .08);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .2, hr * .55, hr * .1, 0, Math.PI * .05, Math.PI * .95);
        ctx.stroke();
        // 右側の羽根飾り
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx + hr * .62, hy - hr * .6, hr * .12, hr * .4, -.15, 0, 7);
        ctx.fill();
        break;
      }
      case 'fontange': {
        // フォンタンジュ: 針金で立たせた高いレースの頭飾り(17世紀末フランス)
        // 後ろの立ちレース2段
        ctx.fillStyle = 'rgba(245,240,230,0.85)';
        for (const [ox, oy, s] of [[0, -1.6, 1], [0, -1.3, .8]]) {
          ctx.beginPath();
          ctx.ellipse(hx + ox, hy + hr * oy, hr * .55 * s, hr * .4 * s, 0, Math.PI, Math.PI * 2);
          ctx.closePath(); ctx.fill();
        }
        // 前立てのドーム
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .6, hr * .7, hr * .45, 0, Math.PI, Math.PI * 2);
        ctx.closePath(); ctx.fill();
        // レースの縁飾り(点線)
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .035);
        for (const s of [1, .8]) {
          ctx.beginPath();
          ctx.ellipse(hx, hy - hr * (s === 1 ? 1.6 : 1.3), hr * .55 * s, hr * .4 * s, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
        // 前面のリボン
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.15);
        ctx.lineTo(hx - hr * .15, hy - hr * 1.0);
        ctx.lineTo(hx, hy - hr * .85);
        ctx.lineTo(hx + hr * .15, hy - hr * 1.0);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'barbette': {
        // バルベット: 顎を包む白い帯+頭頂の輪(中世の婦人装身具)
        // 顎の帯
        ctx.fillStyle = '#f0ece0';
        ctx.beginPath();
        ctx.moveTo(hx - hr * .62, hy - hr * .3);
        ctx.quadraticCurveTo(hx - hr * .65, hy + hr * .6, hx, hy + hr * .75);
        ctx.quadraticCurveTo(hx + hr * .65, hy + hr * .6, hx + hr * .62, hy - hr * .3);
        ctx.lineTo(hx + hr * .5, hy - hr * .28);
        ctx.quadraticCurveTo(hx + hr * .52, hy + hr * .5, hx, hy + hr * .62);
        ctx.quadraticCurveTo(hx - hr * .52, hy + hr * .5, hx - hr * .5, hy - hr * .28);
        ctx.closePath(); ctx.fill();
        // 頭頂の輪(フィレット)
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .14);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * .7, hr * .25, 0, 0, 7);
        ctx.stroke();
        // 輪の飾り石
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, hy - hr * .85, hr * .06, 0, 7); ctx.fill();
        break;
      }
      case 'attifet': {
        // アティフェ: ハート型にへこむ前立ての頭飾り(未亡人帽)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .3);
        ctx.quadraticCurveTo(hx - hr * .7, hy - hr * 1.3, hx - hr * .3, hy - hr * 1.45); // 左の峰
        ctx.quadraticCurveTo(hx, hy - hr * 1.0, hx + hr * .3, hy - hr * 1.45); // 中央の谷(ハート型)
        ctx.quadraticCurveTo(hx + hr * .7, hy - hr * 1.3, hx + hr * .6, hy - hr * .3); // 右の峰
        ctx.quadraticCurveTo(hx, hy - hr * .55, hx - hr * .6, hy - hr * .3);
        ctx.closePath(); ctx.fill();
        // 縁の飾り筋
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .38);
        ctx.quadraticCurveTo(hx, hy - hr * .62, hx + hr * .55, hy - hr * .38);
        ctx.stroke();
        // 谷の頂に小さな宝玉
        ctx.fillStyle = '#e8d8a0';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.05, hr * .06, 0, 7); ctx.fill();
        break;
      }
      case 'kettle': {
        // ケトル帽(シャペル・ド・フェ): 広い平つば+低い鉄のドーム
        // つば
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * 1.15, hr * .28, 0, 0, 7);
        ctx.fill();
        // ドーム
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .55, hr * .68, hr * .6, 0, Math.PI, Math.PI * 2);
        ctx.closePath(); ctx.fill();
        // ドームの頂の小突起
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .03, hy - hr * 1.18, hr * .06, hr * .1);
        // つばの縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .05);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * 1.15, hr * .28, 0, 0, 7);
        ctx.stroke();
        break;
      }
      case 'chaperon': {
        // シャプロン: 頭を覆うフード+長いリリパイプ(垂れ紐)
        // 顔の開口は evenodd で抜く
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .4, hr * .85, hr * .95, 0, Math.PI, Math.PI * 2);
        ctx.quadraticCurveTo(hx + hr * .7, hy + hr * .3, hx + hr * .4, hy + hr * .5);
        ctx.quadraticCurveTo(hx, hy + hr * .35, hx - hr * .4, hy + hr * .5);
        ctx.quadraticCurveTo(hx - hr * .7, hy + hr * .3, hx - hr * .85, hy - hr * .4);
        ctx.closePath();
        ctx.ellipse(hx, hy + hr * .1, hr * .58, hr * .5, 0, 0, 7);
        ctx.fill('evenodd');
        // リリパイプ(肩に垂れる長い紐)
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .12);
        ctx.beginPath();
        ctx.moveTo(hx + hr * .55, hy - hr * .1);
        ctx.quadraticCurveTo(hx + hr * .85, hy + hr * .6, hx + hr * .6, hy + hr * 1.3);
        ctx.stroke();
        break;
      }
      case 'hennin': {
        // エナン: 高い円錐の尖塔帽+後ろに垂れるベール(中世貴婦人)
        // ベール(先に描いて後ろに見せる)
        ctx.fillStyle = 'rgba(240,240,255,0.45)';
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.7);
        ctx.quadraticCurveTo(hx + hr * 1.1, hy - hr * .8, hx + hr * .9, hy + hr * .9);
        ctx.quadraticCurveTo(hx + hr * .3, hy + hr * .5, hx, hy - hr * 1.7);
        ctx.closePath(); ctx.fill();
        // 円錐
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .55);
        ctx.lineTo(hx, hy - hr * 1.95);
        ctx.lineTo(hx + hr * .5, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 縁の帯
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .09);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .51, hy - hr * .56);
        ctx.lineTo(hx + hr * .51, hy - hr * .56);
        ctx.stroke();
        // 先端の飾り
        ctx.fillStyle = '#e8d8a0';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.95, hr * .06, 0, 7); ctx.fill();
        break;
      }
      case 'kokoshnik': {
        // ココーシニク: 扇形に広がる高い頭飾り(ロシア)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .75, hy - hr * .5);
        ctx.quadraticCurveTo(hx - hr * .9, hy - hr * 1.9, hx, hy - hr * 2.0);
        ctx.quadraticCurveTo(hx + hr * .9, hy - hr * 1.9, hx + hr * .75, hy - hr * .5);
        ctx.quadraticCurveTo(hx, hy - hr * .95, hx - hr * .75, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        // 縁の装飾線
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .68, hy - hr * .62);
        ctx.quadraticCurveTo(hx, hy - hr * .98, hx + hr * .68, hy - hr * .62);
        ctx.stroke();
        // 珠の列
        ctx.fillStyle = '#e8d8a0';
        for (let i = -3; i <= 3; i++) {
          const bx = hx + i * hr * .2;
          const by = hy - hr * (1.55 - Math.abs(i) * .18);
          ctx.beginPath(); ctx.arc(bx, by, hr * .045, 0, 7); ctx.fill();
        }
        break;
      }
      case 'biretta': {
        // ビレッタ帽: 四角い天辺+3つの稜線+頂の房(聖職者帽)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .55); // 縁
        ctx.lineTo(hx - hr * .45, hy - hr * 1.05); // 左上
        ctx.lineTo(hx + hr * .45, hy - hr * 1.05); // 右上
        ctx.lineTo(hx + hr * .55, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 3つの稜線(立体的な峰)
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .045);
        for (let i = -1; i <= 1; i++) {
          const rx = hx + i * hr * .35;
          ctx.beginPath();
          ctx.moveTo(rx, hy - hr * 1.05);
          ctx.lineTo(rx + i * hr * .08, hy - hr * 1.3);
          ctx.stroke();
        }
        // 頂の房
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.34, hr * .07, 0, 7); ctx.fill();
        // 縁の帯
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1.5, hr * .1);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .56, hy - hr * .58);
        ctx.lineTo(hx + hr * .56, hy - hr * .58);
        ctx.stroke();
        break;
      }
      case 'calot': {
        // カロット帽(船形帽): 片側に傾けた兵隊の室内帽
        ctx.save();
        ctx.translate(hx, hy - hr * .85);
        ctx.rotate(-.28); // 右に傾ける
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(0, 0, hr * .78, hr * .32, 0, 0, 7);
        ctx.fill();
        // 折り返しの縁
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, hr * .07);
        ctx.beginPath();
        ctx.ellipse(0, 0, hr * .78, hr * .32, 0, Math.PI * .05, Math.PI * .95);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'phrygian': {
        // フリジア帽: 前方に垂れる柔らかい円錐+帯(自由の帽)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .7, hy - hr * .55);
        ctx.quadraticCurveTo(hx - hr * .55, hy - hr * 1.6, hx + hr * .2, hy - hr * 1.7);
        ctx.quadraticCurveTo(hx + hr * .9, hy - hr * 1.75, hx + hr * .95, hy - hr * 1.15); // 先端が前に垂れる
        ctx.quadraticCurveTo(hx + hr * .7, hy - hr * 1.35, hx + hr * .4, hy - hr * 1.15);
        ctx.quadraticCurveTo(hx + hr * .75, hy - hr * .95, hx + hr * .7, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 帯
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .09);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .71, hy - hr * .6);
        ctx.lineTo(hx + hr * .71, hy - hr * .6);
        ctx.stroke();
        // 帽章(小さな円)
        ctx.fillStyle = '#e8c860';
        ctx.beginPath(); ctx.arc(hx + hr * .3, hy - hr * .85, hr * .08, 0, 7); ctx.fill();
        break;
      }
      case 'snood': {
        // スヌード: 後頭部を包む網袋+頭の帯
        // 網袋(後頭部の膨らみ)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx + hr * .5, hy - hr * .35, hr * .5, hr * .55, -.5, 0, 7);
        ctx.fill();
        // 網目(十字筋)
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(hx + hr * .5 + i * hr * .2, hy - hr * .9);
          ctx.lineTo(hx + hr * .5 + i * hr * .2, hy + hr * .1);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(hx, hy - hr * .35 + i * hr * .18);
          ctx.lineTo(hx + hr, hy - hr * .35 + i * hr * .18);
          ctx.stroke();
        }
        // 頭の帯
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1.5, hr * .1);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .9, hy - hr * .45);
        ctx.quadraticCurveTo(hx, hy - hr * 1.15, hx + hr * .9, hy - hr * .45);
        ctx.stroke();
        break;
      }
      case 'mitre': {
        // 司教冠: 高い双頭の冠+帯+垂れるリボン(ラペット)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .55);
        ctx.lineTo(hx - hr * .55, hy - hr * 1.1);
        ctx.quadraticCurveTo(hx - hr * .5, hy - hr * 1.75, hx, hy - hr * 1.85);
        ctx.quadraticCurveTo(hx + hr * .5, hy - hr * 1.75, hx + hr * .55, hy - hr * 1.1);
        ctx.lineTo(hx + hr * .55, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 冠の割れ目
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.82);
        ctx.lineTo(hx, hy - hr * 1.1);
        ctx.stroke();
        // 帯
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .1);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .62);
        ctx.lineTo(hx + hr * .55, hy - hr * .62);
        ctx.stroke();
        // 帯の宝石
        ctx.fillStyle = '#e8c860';
        ctx.beginPath(); ctx.arc(hx, hy - hr * .62, hr * .07, 0, 7); ctx.fill();
        // ラペット(後ろに垂れる2本)
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1.5, hr * .09);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .2, hy - hr * 1.6);
        ctx.quadraticCurveTo(hx - hr * .35, hy - hr * .4, hx - hr * .3, hy + hr * .2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + hr * .2, hy - hr * 1.6);
        ctx.quadraticCurveTo(hx + hr * .35, hy - hr * .4, hx + hr * .3, hy + hr * .2);
        ctx.stroke();
        break;
      }
      case 'cowboy': {
        // カウボーイハット: 中央をへこませた冠+両端が跳ね上がる広つば+帯
        // つば(両端カール)
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * 1.45, hy - hr * .55);
        ctx.quadraticCurveTo(hx - hr * .7, hy - hr * .95, hx, hy - hr * .9);
        ctx.quadraticCurveTo(hx + hr * .7, hy - hr * .95, hx + hr * 1.45, hy - hr * .55);
        ctx.quadraticCurveTo(hx + hr * .9, hy - hr * .65, hx, hy - hr * .6);
        ctx.quadraticCurveTo(hx - hr * .9, hy - hr * .65, hx - hr * 1.45, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 冠(中央のへこみ)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .75);
        ctx.quadraticCurveTo(hx - hr * .45, hy - hr * 1.5, hx, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx + hr * .45, hy - hr * 1.5, hx + hr * .55, hy - hr * .75);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .15, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx, hy - hr * 1.6, hx + hr * .15, hy - hr * 1.5);
        ctx.stroke(); // へこみ筋
        // 帯
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.5, hr * .09);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .56, hy - hr * .82);
        ctx.lineTo(hx + hr * .56, hy - hr * .82);
        ctx.stroke();
        break;
      }
      case 'eboshi': {
        // 烏帽子: 高い冠+後ろに突き出た尾+結び紐
        ctx.fillStyle = '#181a20';
        // 冠本体(前高く後ろ低い)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .6);
        ctx.quadraticCurveTo(hx - hr * .4, hy - hr * 1.85, hx + hr * .15, hy - hr * 1.8);
        ctx.quadraticCurveTo(hx + hr * .55, hy - hr * 1.6, hx + hr * .6, hy - hr * .9);
        ctx.closePath(); ctx.fill();
        // 尾(後ろへ水平に突き出す)
        ctx.beginPath();
        ctx.moveTo(hx + hr * .5, hy - hr * 1.6);
        ctx.quadraticCurveTo(hx + hr * 1.5, hy - hr * 1.55, hx + hr * 1.7, hy - hr * 1.2);
        ctx.quadraticCurveTo(hx + hr * 1.2, hy - hr * 1.25, hx + hr * .58, hy - hr * 1.05);
        ctx.closePath(); ctx.fill();
        // 顎紐
        ctx.strokeStyle = '#181a20'; ctx.lineWidth = Math.max(1, hr * .04);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .55);
        ctx.quadraticCurveTo(hx, hy + hr * .9, hx + hr * .5, hy - hr * .55);
        ctx.stroke();
        break;
      }
      case 'topknot': {
        // ちょんまげ: 黒い髪+頭頂の髷+剃り跡の青味
        // 髪(側頭部)
        ctx.fillStyle = '#22252a';
        ctx.beginPath();
        ctx.moveTo(hx - hr * .9, hy - hr * .3);
        ctx.quadraticCurveTo(hx - hr * .95, hy - hr * 1.4, hx, hy - hr * 1.45);
        ctx.quadraticCurveTo(hx + hr * .95, hy - hr * 1.4, hx + hr * .9, hy - hr * .3);
        ctx.lineTo(hx + hr * .75, hy - hr * .3);
        ctx.quadraticCurveTo(hx + hr * .8, hy - hr * 1.15, hx, hy - hr * 1.2);
        ctx.quadraticCurveTo(hx - hr * .8, hy - hr * 1.15, hx - hr * .75, hy - hr * .3);
        ctx.closePath(); ctx.fill();
        // 月代(剃り跡の青い部分)
        ctx.fillStyle = 'rgba(120,140,160,0.35)';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.05, hr * .5, hr * .28, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // 髷(前方に折れた結び)
        ctx.fillStyle = '#22252a';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.55, hr * .34, hr * .13, -.35, 0, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hx + hr * .1, hy - hr * 1.62, hr * .2, hr * .08, -.5, 0, 7);
        ctx.fill();
        break;
      }
      case 'kippah': {
        // キッパ: 頭頂に乗る小さな半円帽+縁取り
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .72);
        ctx.quadraticCurveTo(hx, hy - hr * 1.45, hx + hr * .55, hy - hr * .72);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .72);
        ctx.quadraticCurveTo(hx, hy - hr * 1.45, hx + hr * .55, hy - hr * .72);
        ctx.stroke();
        // 縁の帯
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .07);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .56, hy - hr * .73);
        ctx.lineTo(hx + hr * .56, hy - hr * .73);
        ctx.stroke();
        break;
      }
      case 'coif': {
        // コイフ: 頭をすっぽり覆う頭巾+顎下の結び紐
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .95, hy - hr * .2);
        ctx.quadraticCurveTo(hx - hr, hy - hr * 1.5, hx, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx + hr, hy - hr * 1.5, hx + hr * .95, hy - hr * .2);
        ctx.lineTo(hx + hr * .9, hy + hr * .9); // 側面を垂らす
        ctx.quadraticCurveTo(hx + hr * .45, hy + hr * .55, hx, hy + hr * .6);
        ctx.quadraticCurveTo(hx - hr * .45, hy + hr * .55, hx - hr * .9, hy + hr * .9);
        ctx.closePath();
        // 顔の開口部(偶奇規則で抜く)
        ctx.ellipse(hx, hy + hr * .15, hr * .62, hr * .68, 0, 0, 7);
        ctx.fill('evenodd');
        // 顎下の結び紐
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1, hr * .06);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy + hr * .8);
        ctx.quadraticCurveTo(hx, hy + hr * 1.05, hx + hr * .55, hy + hr * .8);
        ctx.stroke();
        break;
      }
      case 'mantilla': {
        // マンティリャ: 高い櫛+レースのベール(額の毛飾り)
        ctx.fillStyle = acc2;
        // 櫛(扇形の骨組み)
        ctx.beginPath();
        for (let i = -3; i <= 3; i++) {
          ctx.moveTo(hx + i * hr * .16, hy - hr * .9);
          ctx.lineTo(hx + i * hr * .28, hy - hr * 1.55);
        }
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(1, hr * .05); ctx.stroke();
        // 櫛の上縁アーチ
        ctx.beginPath();
        ctx.moveTo(hx - hr * .9, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx, hy - hr * 2, hx + hr * .9, hy - hr * 1.5);
        ctx.stroke();
        // レースのベール(顔の後ろに垂れる)
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.moveTo(hx - hr * .85, hy - hr * 1.45);
        ctx.quadraticCurveTo(hx - hr * 1.5, hy + hr * .9, hx - hr * .8, hy + hr * 1.7);
        ctx.lineTo(hx + hr * .8, hy + hr * 1.7);
        ctx.quadraticCurveTo(hx + hr * 1.5, hy + hr * .9, hx + hr * .85, hy - hr * 1.45);
        ctx.closePath(); ctx.fill();
        // 額の花飾り
        ctx.fillStyle = acc2;
        ctx.beginPath(); ctx.arc(hx, hy - hr * .85, hr * .12, 0, 7); ctx.fill();
        break;
      }
      case 'kasa': {
        // 菅笠: 円錐の編み笠+顎紐
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * 1.15, hy - hr * .55);
        ctx.lineTo(hx, hy - hr * 1.6);
        ctx.lineTo(hx + hr * 1.15, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 放射状の編み筋
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = Math.max(1, hr * .035);
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo(hx, hy - hr * 1.6);
          ctx.lineTo(hx + i * hr * .28, hy - hr * .55);
          ctx.stroke();
        }
        // 同心の輪筋
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.ellipse(hx, hy - hr * (1.6 - i * .3), hr * .95 * i / 3.5, hr * .08, 0, Math.PI * 1.05, Math.PI * 1.95);
          ctx.stroke();
        }
        // 顎紐
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .05);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .5);
        ctx.quadraticCurveTo(hx, hy + hr * 1.1, hx + hr * .6, hy - hr * .5);
        ctx.stroke();
        break;
      }
      case 'crown2': {
        // 後冠(王妃冠): 帯+後ろへ聳えるアーチの輪+宝石
        ctx.fillStyle = acc2;
        // 帯(額に沿う)
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .78, hr * .68, hr * .16, 0, Math.PI, 0); ctx.fill();
        // 2本のアーチ(頭の後ろで交差)
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .09); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .75);
        ctx.quadraticCurveTo(hx - hr * .3, hy - hr * 1.8, hx, hy - hr * 1.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + hr * .55, hy - hr * .75);
        ctx.quadraticCurveTo(hx + hr * .3, hy - hr * 1.8, hx, hy - hr * 1.85);
        ctx.stroke();
        // 頂の玉+帯の宝石
        ctx.fillStyle = '#d8c050';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.85, hr * .1, 0, 7); ctx.fill();
        ctx.fillStyle = '#c04060';
        ctx.beginPath(); ctx.arc(hx, hy - hr * .78, hr * .09, 0, 7); ctx.fill();
        break;
      }
      case 'beanie': {
        // ビーニー: 頭にフィットするニット帽+折り返し+房
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .75, hr * .72, hr * .55, 0, Math.PI, 0); ctx.fill(); // ドーム
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .75, hr * .72, hr * .12, 0, 0, 7); ctx.fill(); // 底辺ふくらみ
        // 折り返し(帯)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * .74, hr * .16, 0, 0, 7); ctx.fill();
        // 編み目の縦筋
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = Math.max(1, hr * .03);
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(hx + i * hr * .18, hy - hr * 1.25);
          ctx.quadraticCurveTo(hx + i * hr * .2, hy - hr * .95, hx + i * hr * .2, hy - hr * .68);
          ctx.stroke();
        }
        // 頂の房
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.32, hr * .13, 0, 7); ctx.fill();
        break;
      }
      case 'mortar': {
        // 角帽(卒業帽): 頭の冠+平らな四角い板+垂れる房
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .7, hr * .6, hr * .35, 0, 0, 7); ctx.fill(); // 頭の冠
        // 四角い板(斜めに置いた正方形)
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.55);
        ctx.lineTo(hx + hr * 1.05, hy - hr * 1.05);
        ctx.lineTo(hx, hy - hr * .55);
        ctx.lineTo(hx - hr * 1.05, hy - hr * 1.05);
        ctx.closePath(); ctx.fill();
        // 房(右上から垂れる)
        ctx.strokeStyle = '#d8b040'; ctx.lineWidth = Math.max(1.5, hr * .06); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx + hr * .5, hy - hr * 1.05);
        ctx.quadraticCurveTo(hx + hr * .85, hy - hr * .5, hx + hr * .8, hy - hr * .1);
        ctx.stroke();
        ctx.fillStyle = '#d8b040';
        ctx.beginPath(); ctx.arc(hx + hr * .8, hy - hr * .05, hr * .1, 0, 7); ctx.fill();
        break;
      }
      case 'bicorne': {
        // 二角帽: 左右に広がる角+中央の結び房(ナポレオン帽)
        ctx.fillStyle = acc2;
        ctx.save();
        ctx.translate(hx, hy - hr * .9);
        // 左右の角(湾曲した大きな2峰)
        ctx.beginPath();
        ctx.moveTo(-hr * 1.15, -hr * .1);
        ctx.quadraticCurveTo(-hr * .9, -hr * .75, 0, -hr * .45);
        ctx.quadraticCurveTo(hr * .9, -hr * .75, hr * 1.15, -hr * .1);
        ctx.quadraticCurveTo(hr * .6, hr * .2, 0, hr * .1);
        ctx.quadraticCurveTo(-hr * .6, hr * .2, -hr * 1.15, -hr * .1);
        ctx.closePath(); ctx.fill();
        // 中央の帽章リボン
        ctx.fillStyle = '#d85040';
        ctx.beginPath(); ctx.arc(0, -hr * .15, hr * .12, 0, 7); ctx.fill();
        ctx.restore();
        break;
      }
      case 'pickelhaube': {
        // ピッケルハウベ: 革の兜+頭頂の槍スパイク+前板
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .75, hr * .78, hr * .5, 0, Math.PI, 0); ctx.fill(); // ドーム
        // 前後のつば(下向き三角形)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .78, hy - hr * .68);
        ctx.lineTo(hx - hr * .1, hy - hr * .55);
        ctx.lineTo(hx - hr * .78, hy - hr * .4);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + hr * .78, hy - hr * .68);
        ctx.lineTo(hx + hr * .1, hy - hr * .55);
        ctx.lineTo(hx + hr * .78, hy - hr * .4);
        ctx.closePath(); ctx.fill();
        // スパイクの台座+尖り
        ctx.fillStyle = '#c8a840';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.22, hr * .14, hr * .06, 0, 0, 7); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx - hr * .09, hy - hr * 1.22);
        ctx.lineTo(hx, hy - hr * 1.72);
        ctx.lineTo(hx + hr * .09, hy - hr * 1.22);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'shako': {
        // シャコー帽: 高い円筒+前つば+帽章
        ctx.fillStyle = acc2;
        // 円筒(前へ少し広がる)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .5);
        ctx.lineTo(hx - hr * .72, hy - hr * 1.75);
        ctx.lineTo(hx + hr * .72, hy - hr * 1.75);
        ctx.lineTo(hx + hr * .6, hy - hr * .5);
        ctx.closePath(); ctx.fill();
        // 前つば(下へ反った半楕円)
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .62, hr * .18, 0, 0, Math.PI); ctx.fill();
        // 帯
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(hx - hr * .66, hy - hr * .72, hr * 1.32, hr * .14);
        // 帽章(前面中央の円)
        ctx.fillStyle = '#d8c060';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.15, hr * .16, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.15, hr * .07, 0, 7); ctx.fill();
        break;
      }
      case 'tam': {
        // タム帽(タム・オー・シャンター): ぺったり丸い帽+房
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .85, hr * .95, hr * .38, .06, 0, 7); ctx.fill(); // ぺったり円盤
        // 縁の帯
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .7, hr * .9, hr * .12, .06, 0, Math.PI); ctx.fill();
        // 中央の房
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.25, hr * .12, 0, 7); ctx.fill();
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, hr * .04); ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const a = i * 1.256;
          ctx.beginPath();
          ctx.moveTo(hx, hy - hr * 1.25);
          ctx.lineTo(hx + Math.cos(a) * hr * .18, hy - hr * 1.25 + Math.sin(a) * hr * .18);
          ctx.stroke();
        }
        break;
      }
      case 'sailor': {
        // 水兵帽: 白い浅い冠+黒い帯+短いリボン
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .9, hr * .72, hr * .42, 0, 0, 7); ctx.fill(); // 白い冠
        ctx.fillStyle = 'rgba(30,40,60,0.85)';
        ctx.fillRect(hx - hr * .72, hy - hr * .95, hr * 1.44, hr * .18); // 黒帯
        // 短いリボン(後ろへ)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .2, hy - hr * .82);
        ctx.lineTo(hx - hr * .05, hy - hr * .5);
        ctx.lineTo(hx + hr * .08, hy - hr * .8);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'porkpie': {
        // ポークパイ: 平天の低いクラウン+狭いつば+帯
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .52, hr * .95, hr * .14, 0, 0, 7); ctx.fill(); // 狭つば
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .88, hr * .58, hr * .5, 0, 0, 7); ctx.fill(); // 低いクラウン
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(hx - hr * .58, hy - hr * .78, hr * 1.16, hr * .14); // 帯
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.36, hr * .56, hr * .1, 0, 0, 7); ctx.fill(); // 平天
        break;
      }
      case 'keffiyeh': {
        // クーフィーヤ: 頭を覆う布+黒いアガール(輪)
        ctx.fillStyle = '#f0ece0';
        ctx.beginPath();
        ctx.moveTo(hx - hr * .85, hy - hr * .4);
        ctx.quadraticCurveTo(hx, hy - hr * 1.5, hx + hr * .85, hy - hr * .4);
        ctx.lineTo(hx + hr * .9, hy + hr * .5); // 右裾が垂れる
        ctx.lineTo(hx + hr * .6, hy + hr * .45);
        ctx.quadraticCurveTo(hx + hr * .7, hy - hr * .3, hx, hy - hr * .25);
        ctx.quadraticCurveTo(hx - hr * .7, hy - hr * .3, hx - hr * .6, hy + hr * .45);
        ctx.lineTo(hx - hr * .9, hy + hr * .5);
        ctx.closePath(); ctx.fill();
        // 格子筋(薄いチェック)
        ctx.strokeStyle = 'rgba(160,60,60,0.5)'; ctx.lineWidth = 1.5;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(hx + i * hr * .3, hy - hr * 1.1);
          ctx.lineTo(hx + i * hr * .3, hy - hr * .3);
          ctx.stroke();
        }
        // アガール(2重の黒い輪)
        ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = Math.max(2, hr * .07);
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .72, hr * .68, hr * .22, 0, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .7, hr * .22, 0, Math.PI, 0); ctx.stroke();
        break;
      }
      case 'sunvisor': {
        // サンバイザー: 頭の帯+前の透明つば
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .6, hr * .72, hr * .3, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.lineTo(hx + hr * .6, hy - hr * .55);
        ctx.lineTo(hx - hr * .6, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 透明つば(前に張り出し、半透明)
        ctx.fillStyle = acc2.replace(/,[\d.]+\)$/, ',0.4)');
        ctx.beginPath();
        ctx.moveTo(hx - hr * .75, hy - hr * .6);
        ctx.quadraticCurveTo(hx, hy - hr * .95, hx + hr * .95, hy - hr * .55);
        ctx.quadraticCurveTo(hx + hr * .8, hy - hr * .4, hx, hy - hr * .5);
        ctx.quadraticCurveTo(hx - hr * .6, hy - hr * .45, hx - hr * .75, hy - hr * .6);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'mobcap': {
        // フリル帽: 頭頂のフリル縁+ふっくら冠+リボン
        ctx.fillStyle = '#f0ece2';
        // ふっくら冠
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .68, hr * .62, hr * .4, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // フリル縁(連なる半円)
        for (let i = 0; i < 9; i++) {
          const fa = Math.PI + (i / 8) * Math.PI;
          const fx = hx + Math.cos(fa) * hr * .68;
          const fy = hy - hr * .68 + Math.sin(fa) * hr * .42;
          ctx.beginPath(); ctx.arc(fx, fy, hr * .11, 0, 7); ctx.fill();
        }
        // 後ろのリボン
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .06);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .5, hy - hr * .5);
        ctx.quadraticCurveTo(hx - hr * .8, hy - hr * .2, hx - hr * .7, hy + hr * .2);
        ctx.stroke();
        break;
      }
      case 'bonnet': {
        // ボンネット: 深い日除けつば+頭頂の膨らみ+顎下リボン
        ctx.fillStyle = acc2;
        // 頭頂の膨らみ
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .7, hr * .6, hr * .42, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 深い日除けつば(前に大きく張り出す)
        ctx.beginPath();
        ctx.ellipse(hx + hr * .15, hy - hr * .55, hr * 1.05, hr * .4, -.15, Math.PI * .95, Math.PI * 1.95);
        ctx.lineTo(hx - hr * .55, hy - hr * .45);
        ctx.closePath(); ctx.fill();
        // 顎下のリボン
        ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .06);
        ctx.beginPath();
        ctx.moveTo(hx - hr * .6, hy - hr * .4);
        ctx.quadraticCurveTo(hx, hy + hr * .6, hx + hr * .6, hy - hr * .4);
        ctx.stroke();
        // リボン結び目
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, hy + hr * .55, hr * .09, 0, 7); ctx.fill();
        break;
      }
      case 'deerstalker': {
        // 鹿撃ち帽(シャーロック帽): 前後のつば+頭頂の結び目
        ctx.fillStyle = '#8a7a5a';
        // ドーム
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .65, hr * .72, hr * .42, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 前後のつば
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(hx + s * hr * .55, hy - hr * .52, hr * .35, hr * .12, s * .3, 0, 7);
          ctx.fill();
        }
        // 頭頂の結び目
        ctx.fillStyle = '#6a5a42';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.02, hr * .16, hr * .09, 0, 0, 7);
        ctx.fill();
        ctx.beginPath(); ctx.arc(hx, hy - hr * .98, hr * .06, 0, 7); ctx.fill();
        // 側面の耳当て筋
        ctx.strokeStyle = '#6a5a42'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx - hr * .7, hy - hr * .55); ctx.lineTo(hx - hr * .55, hy - hr * .75); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hx + hr * .7, hy - hr * .55); ctx.lineTo(hx + hr * .55, hy - hr * .75); ctx.stroke();
        break;
      }
      case 'boater': {
        // カンカン帽: 平らな天辺+平らなつば+リボン帯
        ctx.fillStyle = '#d8bc78';
        // つば(平らな楕円)
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * 1.15, hr * .18, 0, 0, 7);
        ctx.fill();
        // 冠(円筒+平らな頂)
        ctx.fillRect(hx - hr * .6, hy - hr * .95, hr * 1.2, hr * .35);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .95, hr * .6, hr * .1, 0, 0, 7);
        ctx.fill();
        // リボン帯
        ctx.fillStyle = acc2;
        ctx.fillRect(hx - hr * .6, hy - hr * .72, hr * 1.2, hr * .12);
        break;
      }
      case 'cloche': {
        // クロッシェ帽: 深く被る鐘形+リボン帯+小さな飾り
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .55, hr * .78, hr * .55, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // すその折り返し
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .5, hr * .82, hr * .12, 0, 0, 7);
        ctx.fill();
        // リボン帯
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .8, hy - hr * .62, hr * 1.6, hr * .1);
        // 側面の飾り(小さな花)
        ctx.fillStyle = '#e8d058';
        ctx.beginPath(); ctx.arc(hx + hr * .55, hy - hr * .55, hr * .07, 0, 7); ctx.fill();
        break;
      }
      case 'veil': {
        // ベール: 頭頂の小さな冠+両側に垂れる透ける布
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .88, hr * .4, hr * .18, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 布(半透明、左右に垂れる)
        ctx.fillStyle = acc2.replace(/,[\d.]+\)$/, ',0.35)');
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .1, hy - hr * .8);
          ctx.quadraticCurveTo(hx + s * hr * .95, hy - hr * .3,
            hx + s * hr * .75, hy + hr * 1.2);
          ctx.lineTo(hx + s * hr * .45, hy + hr * 1.2);
          ctx.quadraticCurveTo(hx + s * hr * .55, hy - hr * .3, hx, hy - hr * .7);
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'plume': {
        // 羽飾り: 帯+立つ羽根2本(羽軸と羽枝)
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .8, hy - hr * .8, hr * 1.6, hr * .16);
        for (const s of [-1, 1]) {
          const fbx = hx + s * hr * .15, fby = hy - hr * .8;
          // 羽軸
          ctx.strokeStyle = acc2; ctx.lineWidth = Math.max(2, hr * .05);
          ctx.beginPath();
          ctx.moveTo(fbx, fby);
          ctx.quadraticCurveTo(fbx + s * hr * .3, fby - hr * .8, fbx + s * hr * .5, fby - hr * 1.05);
          ctx.stroke();
          // 羽枝(楕円の塊)
          ctx.fillStyle = acc2;
          ctx.beginPath();
          ctx.ellipse(fbx + s * hr * .35, fby - hr * .7, hr * .14, hr * .42, s * .4, 0, 7);
          ctx.fill();
          // 先端の色違い
          ctx.fillStyle = '#e8d058';
          ctx.beginPath();
          ctx.ellipse(fbx + s * hr * .48, fby - hr * 1.0, hr * .09, hr * .14, s * .4, 0, 7);
          ctx.fill();
        }
        break;
      }
      case 'matador': {
        // 闘牛士帽(モンテラ): 黒い帽子+両サイドの膨らみ
        ctx.fillStyle = '#241f26';
        // 両サイドの耳状の膨らみ
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(hx + s * hr * .75, hy - hr * .75, hr * .32, hr * .38, s * .25, 0, 7);
          ctx.fill();
        }
        // 中央の冠部
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .85, hr * .5, hr * .28, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 縁取り(銀の筋)
        ctx.strokeStyle = '#b8b8c8'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .88, hr * .5, hr * .26, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        break;
      }
      case 'turban': {
        // ターバン: 巻いた布(重なる帯)+前の宝石
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .68, hr * .82, hr * .5, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 巻き筋(斜めの帯)
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(2, hr * .07);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(hx - hr * .75, hy - hr * (.55 + i * .18));
          ctx.quadraticCurveTo(hx, hy - hr * (.8 + i * .18), hx + hr * .75, hy - hr * (.6 + i * .18));
          ctx.stroke();
        }
        // 前の宝石(縦長+枠)
        ctx.fillStyle = '#e8d058';
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * .95); ctx.lineTo(hx + hr * .1, hy - hr * .75);
        ctx.lineTo(hx, hy - hr * .6); ctx.lineTo(hx - hr * .1, hy - hr * .75);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d04060';
        ctx.beginPath(); ctx.arc(hx, hy - hr * .78, hr * .06, 0, 7); ctx.fill();
        break;
      }
      case 'tricorne': {
        // 三角帽: 3方向に折れたつば(海賊帽)
        ctx.fillStyle = dk;
        // 中央の帽体
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .55, hr * .55, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 3つの折れたつば
        for (const [dx, rot] of [[-.7, -.35], [0, 0], [.7, .35]]) {
          ctx.save(); ctx.translate(hx + dx * hr, hy - hr * .65); ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, hr * .45, hr * .22, 0, 0, 7);
          ctx.fill();
          ctx.restore();
        }
        // 前立ての縁
        ctx.strokeStyle = '#c8a848'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .55, hr * .55, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        break;
      }
      case 'newsboy': {
        // キャスケット: ふっくら丸い帽+前つば+頂ボタン
        ctx.fillStyle = '#6a5a48';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * .8, hr * .48, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // パネル線
        ctx.strokeStyle = '#554838'; ctx.lineWidth = 2;
        for (const dx of [-.4, 0, .4]) {
          ctx.beginPath();
          ctx.moveTo(hx + dx * hr, hy - hr * .95);
          ctx.quadraticCurveTo(hx + dx * hr * 1.3, hy - hr * .75, hx + dx * hr * 1.6, hy - hr * .62);
          ctx.stroke();
        }
        // つば
        ctx.fillStyle = '#554838';
        ctx.beginPath();
        ctx.ellipse(hx + hr * .15, hy - hr * .58, hr * .7, hr * .14, .08, 0, 7);
        ctx.fill();
        // 頂ボタン
        ctx.fillStyle = '#554838';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.08, hr * .09, 0, 7); ctx.fill();
        break;
      }
      case 'fedora': {
        // フェドラ: くぼみのあるクラウン+中つば+帯
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .55, hr * .95, hr * .2, 0, 0, 7);
        ctx.fill();
        // クラウン(くぼみつき)
        ctx.beginPath();
        ctx.moveTo(hx - hr * .65, hy - hr * .55);
        ctx.quadraticCurveTo(hx - hr * .7, hy - hr * 1.35, hx - hr * .25, hy - hr * 1.35);
        ctx.lineTo(hx + hr * .25, hy - hr * 1.35);
        ctx.quadraticCurveTo(hx + hr * .7, hy - hr * 1.35, hx + hr * .65, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 中央のくぼみ
        ctx.fillStyle = '#4a3c30';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.32, hr * .28, hr * .1, 0, 0, 7);
        ctx.fill();
        // 帯
        ctx.fillStyle = '#2a241e';
        ctx.fillRect(hx - hr * .64, hy - hr * .78, hr * 1.28, hr * .18);
        break;
      }
      case 'bowler': {
        // 山高帽: 丸いドーム+小さなつば+帯
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .55, hr * .7, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // つば
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .55, hr * .95, hr * .16, 0, 0, 7);
        ctx.fill();
        // 帯
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * .72, hr * .12, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'flowercrown': {
        // 花冠: 頭を取り巻く小さな花の輪+緑の葉
        for (let i = 0; i < 9; i++) {
          const a = Math.PI * (1.08 + i * .105);
          const fx = hx + Math.cos(a) * hr * .82;
          const fy = hy - hr * .5 + Math.sin(a) * hr * .42;
          // 葉
          ctx.fillStyle = '#5a8a4a';
          ctx.beginPath(); ctx.ellipse(fx + hr * .06, fy + hr * .05, hr * .07, hr * .03, .5, 0, 7); ctx.fill();
          // 花(5弁+中心)
          ctx.fillStyle = ['#f090a8', '#f5c8d5', '#e8e0a0'][i % 3];
          for (let p = 0; p < 5; p++) {
            const pa = p / 5 * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(fx + Math.cos(pa) * hr * .05, fy + Math.sin(pa) * hr * .05, hr * .045, hr * .028, pa, 0, 7);
            ctx.fill();
          }
          ctx.fillStyle = '#e8c840';
          ctx.beginPath(); ctx.arc(fx, fy, hr * .03, 0, 7); ctx.fill();
        }
        break;
      }
      case 'tiara': {
        // ティアラ: 額の細い帯+3つの尖り+中央の宝石
        ctx.strokeStyle = '#e8d058'; ctx.lineWidth = Math.max(2, hr * .06);
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .5, hr * .75, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        for (const [dx, s] of [[-hr * .45, .7], [0, 1], [hr * .45, .7]]) {
          ctx.fillStyle = '#e8d058';
          ctx.beginPath();
          ctx.moveTo(hx + dx - hr * .09, hy - hr * .62);
          ctx.lineTo(hx + dx, hy - hr * (.62 + .3 * s));
          ctx.lineTo(hx + dx + hr * .09, hy - hr * .62);
          ctx.closePath(); ctx.fill();
        }
        // 中央の宝石
        ctx.fillStyle = '#e05070';
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * .95); ctx.lineTo(hx + hr * .08, hy - hr * .82);
        ctx.lineTo(hx, hy - hr * .72); ctx.lineTo(hx - hr * .08, hy - hr * .82);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'jester': {
        // 道化師帽: 3本の垂れた尖り+先端の鈴
        ctx.fillStyle = acc2;
        // 帽子本体(前半円)
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .55, hr * .8, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 3本の尖り
        for (const dx of [-hr * .75, 0, hr * .75]) {
          const tipX = hx + dx * 1.6, tipY = hy - hr * (dx === 0 ? 1.5 : 1.1);
          ctx.beginPath();
          ctx.moveTo(hx + dx * .9, hy - hr * .6);
          ctx.quadraticCurveTo(hx + dx * 1.2, hy - hr * 1.1, tipX, tipY);
          ctx.quadraticCurveTo(hx + dx * .7, hy - hr * 1.0, hx + dx * .5, hy - hr * .55);
          ctx.closePath(); ctx.fill();
          // 鈴
          ctx.fillStyle = '#e8d058';
          ctx.beginPath(); ctx.arc(tipX, tipY, hr * .09, 0, 7); ctx.fill();
          ctx.fillStyle = acc2;
        }
        // 帯
        ctx.fillStyle = dk;
        ctx.fillRect(hx - hr * .8, hy - hr * .65, hr * 1.6, hr * .16);
        break;
      }
      case 'nightcap': {
        // ナイトキャップ: 垂れる三角帽+房(眠そうな帽子)
        ctx.fillStyle = `hsla(${hue},50%,60%,1)`;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .8, hy - hr * .6);
        ctx.quadraticCurveTo(hx - hr * .2, hy - hr * 1.7, hx + hr * 1.1, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx + hr * .5, hy - hr * 1.1, hx + hr * .7, hy - hr * .55);
        ctx.closePath(); ctx.fill();
        // 房
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath(); ctx.arc(hx + hr * 1.08, hy - hr * 1.5, hr * .14, 0, 7); ctx.fill();
        // 帯
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * .82, hr * .18, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'laurel': {
        // 月桂冠: 左右から頭を囲む葉の輪
        ctx.fillStyle = '#4a7a3a';
        for (const s of [-1, 1]) {
          for (let i = 0; i < 6; i++) {
            const a = Math.PI * (1.15 + i * .14);
            const lx = hx + Math.cos(a) * hr * .95 * s;
            const ly = hy - Math.abs(Math.sin(a)) * hr * 1.05 + hr * .1;
            ctx.save(); ctx.translate(lx, ly); ctx.rotate(s * (.5 - i * .15));
            ctx.beginPath(); ctx.ellipse(0, 0, hr * .14, hr * .05, 0, 0, 7); ctx.fill();
            ctx.restore();
          }
        }
        break;
      }
      case 'ushanka': {
        // 耳当て帽: 毛皮のドーム+耳の垂れ+前立て
        ctx.fillStyle = '#8a7a68';
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .65, hr * .85, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 前立て(折り上げた毛皮)
        ctx.fillStyle = '#a8988a';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .68, hr * .9, hr * .28, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 耳の垂れ(両サイド)
        ctx.fillStyle = '#8a7a68';
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(hx + s * hr * .82, hy - hr * .1, hr * .22, hr * .5, 0, 0, 7);
          ctx.fill();
        }
        break;
      }
      case 'sombrero': {
        // ソンブレロ: 巨大なつば+丸い頂+縁の帯
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .62, hr * 1.6, hr * .32, 0, 0, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .85, hr * .6, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 縁の帯(三角模様風の刻み)
        ctx.strokeStyle = dk; ctx.lineWidth = hr * .05;
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * 1.6, hr * .32, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = hr * .08;
        ctx.beginPath(); ctx.arc(hx, hy - hr * .85, hr * .62, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        break;
      }
      case 'fez': {
        // フェズ帽: 赤い円台+黒い房
        ctx.fillStyle = '#b02830';
        ctx.beginPath();
        ctx.moveTo(hx - hr * .55, hy - hr * .65);
        ctx.lineTo(hx + hr * .55, hy - hr * .65);
        ctx.lineTo(hx + hr * .4, hy - hr * 1.5);
        ctx.lineTo(hx - hr * .4, hy - hr * 1.5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dk; ctx.lineWidth = hr * .05;
        ctx.stroke();
        // 房(頭頂から垂れる黒い紐)
        ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = hr * .06; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx + hr * .3, hy - hr * 1.4, hx + hr * .45, hy - hr * .8);
        ctx.stroke();
        ctx.fillStyle = '#2a2a32';
        ctx.beginPath(); ctx.arc(hx + hr * .45, hy - hr * .75, hr * .1, 0, 7); ctx.fill();
        break;
      }
      case 'viking': {
        // ヴァイキング兜: ドーム+中央の帯+左右の湾曲角
        ctx.fillStyle = '#6a7080';
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .6, hr * .85, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8a92a2';
        ctx.fillRect(hx - hr * .12, hy - hr * 1.45, hr * .24, hr * .9);
        // 角(外へ湾曲)
        ctx.fillStyle = 'rgba(235,225,200,0.95)';
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .8, hy - hr * .75);
          ctx.quadraticCurveTo(hx + s * hr * 1.6, hy - hr * 1.1, hx + s * hr * 1.45, hy - hr * 1.8);
          ctx.quadraticCurveTo(hx + s * hr * 1.15, hy - hr * 1.15, hx + s * hr * .65, hy - hr * .95);
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'bowtie': {
        // 蝶ネクタイ: あご下の左右三角+中央結び目
        const by = hy + hr * 1.15;
        ctx.fillStyle = acc2;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx, by);
          ctx.lineTo(hx + s * hr * .55, by - hr * .28);
          ctx.lineTo(hx + s * hr * .55, by + hr * .28);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = dk;
        ctx.beginPath(); ctx.arc(hx, by, hr * .12, 0, 7); ctx.fill();
        break;
      }
      case 'antler': {
        // トナカイの角: 左右に分岐する枝角
        ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = hr * .12; ctx.lineCap = 'round';
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .4, hy - hr * .7);
          ctx.quadraticCurveTo(hx + s * hr * .7, hy - hr * 1.3, hx + s * hr * 1.1, hy - hr * 1.7);
          ctx.stroke();
          ctx.lineWidth = hr * .08;
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .62, hy - hr * 1.15);
          ctx.lineTo(hx + s * hr * .5, hy - hr * 1.55);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .9, hy - hr * 1.45);
          ctx.lineTo(hx + s * hr * 1.05, hy - hr * 1.9);
          ctx.stroke();
          ctx.lineWidth = hr * .12;
        }
        break;
      }
      case 'headband': {
        // ヘアバンド: 頭を取り巻く帯+側面の結び目
        ctx.strokeStyle = acc2; ctx.lineWidth = hr * .22; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hx, hy, hr * .95, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.ellipse(hx + hr * .88, hy - hr * .3, hr * .16, hr * .1, .5, 0, 7);
        ctx.fill();
        break;
      }
      case 'santa': {
        // サンタ帽: 赤い三角帽+白い房+白い縁
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .85, hy - hr * .7);
        ctx.quadraticCurveTo(hx - hr * .1, hy - hr * 2.3, hx + hr * .75, hy - hr * 1.5);
        ctx.quadraticCurveTo(hx + hr * .5, hy - hr * .9, hx + hr * .85, hy - hr * .7);
        ctx.closePath(); ctx.fill();
        // 白い縁
        ctx.fillStyle = 'rgba(245,248,252,0.97)';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .72, hr * .9, hr * .18, 0, 0, 7);
        ctx.fill();
        // 房(垂れた先端の玉)
        ctx.beginPath();
        ctx.arc(hx + hr * .78, hy - hr * 1.52, hr * .18, 0, 7);
        ctx.fill();
        break;
      }
      case 'top': {
        // シルクハット: 高い筒+広つば+帯
        ctx.fillStyle = dk;
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * .7, hr * 1.15, hr * .16, 0, 0, 7);
        ctx.fill();
        ctx.fillRect(hx - hr * .72, hy - hr * 2.1, hr * 1.44, hr * 1.45);
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 2.1, hr * .72, hr * .12, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = acc2;
        ctx.fillRect(hx - hr * .72, hy - hr * .85, hr * 1.44, hr * .22);
        break;
      }
      case 'chef': {
        // コック帽: ふくらんだ白い頭頂+帯
        ctx.fillStyle = 'rgba(240,242,246,0.97)';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr * 1.25, hr * .78, hr * .55, 0, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        // 頭頂の3つの膨らみ
        for (const dx of [-.45, 0, .45]) {
          ctx.beginPath();
          ctx.arc(hx + hr * dx, hy - hr * 1.55, hr * .3, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(215,220,228,0.95)';
        ctx.fillRect(hx - hr * .78, hy - hr * .92, hr * 1.56, hr * .2);
        ctx.strokeStyle = dk; ctx.lineWidth = hr * .05;
        ctx.strokeRect(hx - hr * .78, hy - hr * .92, hr * 1.56, hr * .2);
        break;
      }
      case 'cap': {
        // 野球帽: ドーム+前方の平つば+ボタン
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.arc(hx, hy - hr * .75, hr * .92, Math.PI, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(hx - hr * .92, hy - hr * .78, hr * 1.84, hr * .12);
        // つば(右前方)
        ctx.beginPath();
        ctx.ellipse(hx + hr * 1.05, hy - hr * .62, hr * .55, hr * .16, .12, 0, 7);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(hx, hy - hr * 1.68, hr * .09, 0, 7); ctx.fill();
        break;
      }
      case 'wizard': {
        // とんがり帽: 長い円錐+広いつば+先端の折れ
        ctx.fillStyle = acc2;
        ctx.beginPath();
        ctx.moveTo(hx - hr * .7, hy - hr * .85);
        ctx.quadraticCurveTo(hx - hr * .35, hy - hr * 1.9, hx + hr * .35, hy - hr * 2.35);
        ctx.quadraticCurveTo(hx + hr * .5, hy - hr * 2.15, hx + hr * .62, hy - hr * 2.25);
        ctx.quadraticCurveTo(hx + hr * .4, hy - hr * 1.75, hx + hr * .7, hy - hr * .85);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .82, hr * 1.25, hr * .3, 0, 0, 7); ctx.fill();
        break;
      }
      case 'earmuff': {
        // イヤーマフ: 頭頂の帯+両耳の丸いカップ
        ctx.strokeStyle = acc2; ctx.lineWidth = hr * .14;
        ctx.beginPath(); ctx.arc(hx, hy - hr * .15, hr * 1.08, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.fillStyle = acc2;
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.arc(hx + s * hr * 1.05, hy - hr * .05, hr * .38, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath(); ctx.arc(hx + s * hr * 1.05, hy - hr * .05, hr * .22, 0, 7); ctx.fill();
          ctx.fillStyle = acc2;
        }
        break;
      }
      case 'straw': {
        // 麦わら帽子: 広い楕円つば+丸い天辺+リボン帯
        ctx.fillStyle = 'hsl(45,60%,72%)';
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .85, hr * 1.5, hr * .38, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.1, hr * .78, hr * .55, 0, 0, 7); ctx.fill();
        ctx.fillStyle = acc2;
        ctx.fillRect(hx - hr * .78, hy - hr * 1.02, hr * 1.56, hr * .18);
        break;
      }
      case 'horns': {
        // ツノ: 頭頂両端から外へ湾曲する小さな角
        ctx.fillStyle = acc2;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .45, hy - hr * .85);
          ctx.quadraticCurveTo(hx + s * hr * 1.05, hy - hr * 1.05, hx + s * hr * .95, hy - hr * 1.55);
          ctx.quadraticCurveTo(hx + s * hr * .8, hy - hr * 1.15, hx + s * hr * .62, hy - hr * .82);
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'goggles': {
        // ゴーグル: 額の帯+2つのレンズ
        ctx.strokeStyle = dk; ctx.lineWidth = hr * .1;
        ctx.beginPath(); ctx.moveTo(hx - hr * 1.02, hy - hr * .62); ctx.lineTo(hx + hr * 1.02, hy - hr * .62); ctx.stroke();
        ctx.lineWidth = hr * .07; ctx.strokeStyle = acc2; ctx.fillStyle = 'rgba(160,220,255,0.55)';
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.arc(hx + s * hr * .42, hy - hr * .62, hr * .3, 0, 7);
          ctx.fill(); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .62); ctx.lineTo(hx + hr * .12, hy - hr * .62); ctx.stroke();
        break;
      }
      case 'cat-ear': {
        // 猫耳: 頭頂両端の三角形(内側は淡ピンク)
        for (const s of [-1, 1]) {
          ctx.fillStyle = acc2;
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .3, hy - hr * .95);
          ctx.lineTo(hx + s * hr * .78, hy - hr * .85);
          ctx.lineTo(hx + s * hr * .6, hy - hr * 1.45);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,190,205,0.85)';
          ctx.beginPath();
          ctx.moveTo(hx + s * hr * .42, hy - hr * .95);
          ctx.lineTo(hx + s * hr * .68, hy - hr * .9);
          ctx.lineTo(hx + s * hr * .58, hy - hr * 1.28);
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'bunny': {
        // うさ耳: 頭頂から2本の長い耳(内側は淡色)
        for (const s of [-1, 1]) {
          ctx.fillStyle = acc2;
          ctx.beginPath();
          ctx.ellipse(hx + s * hr * .42, hy - hr * 1.62, hr * .2, hr * .75, s * .12, 0, 7);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,190,205,0.85)';
          ctx.beginPath();
          ctx.ellipse(hx + s * hr * .42, hy - hr * 1.6, hr * .1, hr * .5, s * .12, 0, 7);
          ctx.fill();
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
    } else if (pr === 'pastel') {
      // パステル虹: ふんわりした虹色グラデーション + 白い光斑
      const gr = c.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, '#ffd9e8'); gr.addColorStop(.35, '#ffe9c9');
      gr.addColorStop(.65, '#d9f2e3'); gr.addColorStop(1, '#c9e3ff');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(4242);
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 24; i++) {
        c.beginPath();
        c.arc(rng() * W, rng() * H, 3 + rng() * 9, 0, 7);
        c.fill();
      }
    } else if (pr === 'himalaya') {
      // ヒマラヤ: 連なる大雪山峰+山腹の僧院+翻る祈祷旗
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#c8d8f0'); gr.addColorStop(.5, '#8098b8'); gr.addColorStop(1, '#40505e');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 高峰の列(雪を頂く鋭い山)
      const rng = L.mulberry32(331);
      for (let i = 0; i < 5; i++) {
        const px = W * (i * .22 + .05);
        const ph = H * (.35 + rng() * .3);
        const pw = W * (.2 + rng() * .1);
        c.fillStyle = i % 2 ? '#5a6a78' : '#4a5a68';
        c.beginPath();
        c.moveTo(px - pw / 2, H * .75);
        c.lineTo(px, H * .75 - ph);
        c.lineTo(px + pw / 2, H * .75);
        c.closePath(); c.fill();
        // 頂の雪
        c.fillStyle = '#e8f0f8';
        c.beginPath();
        c.moveTo(px - pw * .12, H * .75 - ph * .78);
        c.lineTo(px, H * .75 - ph);
        c.lineTo(px + pw * .12, H * .75 - ph * .78);
        c.lineTo(px + pw * .06, H * .75 - ph * .72);
        c.lineTo(px - pw * .04, H * .75 - ph * .74);
        c.closePath(); c.fill();
      }
      // 山腹の僧院(白い建物+金の屋根)
      const mx = W * .62, my = H * .68;
      c.fillStyle = '#e0dcd0';
      c.fillRect(mx - W * .05, my - H * .05, W * .1, H * .05);
      c.fillStyle = '#c89030';
      c.beginPath();
      c.moveTo(mx - W * .06, my - H * .05);
      c.lineTo(mx, my - H * .09);
      c.lineTo(mx + W * .06, my - H * .05);
      c.closePath(); c.fill();
      // 前景の斜面
      c.fillStyle = '#384850';
      c.beginPath();
      c.moveTo(0, H * .78);
      c.quadraticCurveTo(W * .4, H * .7, W, H * .8);
      c.lineTo(W, H); c.lineTo(0, H);
      c.closePath(); c.fill();
      // 祈祷旗の列(紐に連なる色旗)
      const flagCols = ['#2858b0', '#e8e8e8', '#c03030', '#287030', '#e8c020'];
      for (let s = 0; s < 2; s++) {
        const y0 = H * (.58 + s * .08);
        c.strokeStyle = 'rgba(60,60,60,0.5)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(W * .05, y0 - H * .04);
        c.quadraticCurveTo(W * .3, y0 + H * .02, W * (.5 + s * .1), y0);
        c.stroke();
        for (let i = 0; i < 6; i++) {
          const fp = i / 6;
          const fx = W * (.05 + fp * (.45 + s * .1));
          const fy = (1 - fp) * (1 - fp) * (y0 - H * .04) + 2 * (1 - fp) * fp * (y0 + H * .02) + fp * fp * y0;
          c.fillStyle = flagCols[(i + s) % 5];
          c.fillRect(fx, fy, W * .018, H * .022);
        }
      }
      // 飛ぶ大鷲
      c.strokeStyle = 'rgba(40,45,55,0.8)'; c.lineWidth = 1.6;
      const ex = W * .3 + Math.sin(t * .3) * W * .04, ey = H * .3 + Math.cos(t * .4) * H * .02;
      c.beginPath();
      c.moveTo(ex - 9, ey); c.quadraticCurveTo(ex, ey - 6, ex + 9, ey);
      c.stroke();
    } else if (pr === 'ghat') {
      // ガート(ヴァラナシ): 川へ下る石段+寺院群+浮かぶ小舟+朝靄
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#f0c8a0'); gr.addColorStop(.5, '#d89878'); gr.addColorStop(1, '#48606a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 朝日と光筋
      c.fillStyle = '#f8d8a0';
      c.beginPath(); c.arc(W * .2, H * .22, H * .06, 0, 7); c.fill();
      // 寺院群(上部: ドームと尖塔の連なり)
      const rng = L.mulberry32(209);
      for (let i = 0; i < 8; i++) {
        const tx = W * .05 + i * W * .13;
        const th = H * (.08 + rng() * .14);
        const tw = W * (.05 + rng() * .03);
        c.fillStyle = i % 2 ? '#a05840' : '#b06850';
        c.fillRect(tx, H * .45 - th, tw, th);
        if (i % 3 === 0) { // シカラ尖塔
          c.fillStyle = '#8a4830';
          c.beginPath();
          c.moveTo(tx - tw * .1, H * .45 - th);
          c.lineTo(tx + tw * .5, H * .45 - th - H * .06);
          c.lineTo(tx + tw * 1.1, H * .45 - th);
          c.closePath(); c.fill();
        } else if (i % 3 === 1) { // ドーム
          c.beginPath(); c.arc(tx + tw * .5, H * .45 - th, tw * .5, Math.PI, 0); c.fill();
        }
      }
      // 石段(ガート: 幅の広がる階段)
      for (let s = 0; s < 6; s++) {
        c.fillStyle = s % 2 ? '#c09070' : '#b08060';
        const w = W * (.75 + s * .04);
        c.fillRect(W * .5 - w / 2, H * (.45 + s * .055), w, H * .055);
      }
      // 川面
      c.fillStyle = '#3a5560';
      c.fillRect(0, H * .8, W, H * .2);
      // 光の反射
      c.fillStyle = 'rgba(248,200,140,0.35)';
      c.fillRect(W * .05, H * .8, W * .3, H * .2);
      // 小舟
      for (let i = 0; i < 3; i++) {
        const bx = W * (.2 + i * .3) + Math.sin(t * .5 + i * 2) * W * .01;
        const by = H * (.85 + (i % 2) * .07);
        c.fillStyle = '#4a3028';
        c.beginPath();
        c.moveTo(bx - W * .05, by);
        c.quadraticCurveTo(bx, by + H * .035, bx + W * .05, by);
        c.closePath(); c.fill();
        // 漕ぎ手の影
        c.beginPath(); c.arc(bx, by - H * .02, H * .015, 0, 7); c.fill();
      }
      // 朝靄の帯
      c.fillStyle = 'rgba(240,210,180,0.28)';
      c.beginPath();
      c.ellipse(W * .5 + Math.sin(t * .2) * W * .04, H * .47, W * .5, H * .06, 0, 0, 7);
      c.fill();
    } else if (pr === 'taj') {
      // タージマハル: 白亜の霊廟 — 玉ねぎドーム+ミナレット4本+映る水鏡
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#f0e0d0'); gr.addColorStop(.45, '#d8b0a0'); gr.addColorStop(1, '#305060');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 朝日
      c.fillStyle = '#f8d8b0';
      c.beginPath(); c.arc(W * .8, H * .2, H * .05, 0, 7); c.fill();
      // 中央の建物本体
      const bx = W * .5, by = H * .55;
      c.fillStyle = '#f0ece4';
      c.fillRect(bx - W * .12, by - H * .16, W * .24, H * .16);
      // 玉ねぎドーム
      c.beginPath();
      c.moveTo(bx - W * .07, by - H * .16);
      c.quadraticCurveTo(bx - W * .08, by - H * .3, bx, by - H * .33);
      c.quadraticCurveTo(bx + W * .08, by - H * .3, bx + W * .07, by - H * .16);
      c.closePath(); c.fill();
      // 尖塔
      c.fillRect(bx - 2, by - H * .38, 4, H * .06);
      // 脇の小ドーム
      for (const s of [-1, 1]) {
        c.beginPath();
        c.arc(bx + s * W * .09, by - H * .17, W * .028, Math.PI, 0);
        c.fill();
        c.fillRect(bx + s * W * .09 - 1, by - H * .22, 2, H * .05);
      }
      // 中央アーチ入口
      c.fillStyle = '#3a3038';
      c.beginPath();
      c.moveTo(bx - W * .035, by);
      c.lineTo(bx - W * .035, by - H * .1);
      c.quadraticCurveTo(bx, by - H * .15, bx + W * .035, by - H * .1);
      c.lineTo(bx + W * .035, by);
      c.closePath(); c.fill();
      // ミナレット4本
      c.fillStyle = '#e0dcd2';
      for (const s of [-1.6, -1.25, 1.25, 1.6]) {
        const mx = bx + s * W * .12;
        c.fillRect(mx - W * .008, by - H * .26, W * .016, H * .26);
        c.beginPath(); c.arc(mx, by - H * .27, W * .012, Math.PI, 0); c.fill();
      }
      // 水面の映り込み
      c.fillStyle = 'rgba(240,236,228,0.4)';
      c.beginPath();
      c.moveTo(bx - W * .1, H);
      c.lineTo(bx - W * .05, by + H * .05);
      c.lineTo(bx + W * .05, by + H * .05);
      c.lineTo(bx + W * .1, H);
      c.closePath(); c.fill();
      // 両脇の木々
      c.fillStyle = '#3a5040';
      for (let i = 0; i < 4; i++) {
        for (const s of [-1, 1]) {
          const tx = bx + s * W * (.2 + i * .08);
          c.fillRect(tx - 2, by + H * .02 - H * .06, 4, H * .06);
          c.beginPath(); c.arc(tx, by + H * .02 - H * .07, W * .02, 0, 7); c.fill();
        }
      }
    } else if (pr === 'stupa') {
      // 仏塔(ボロブドゥール): 段々の基壇+鐘形の仏塔+朝霧+ジャングル
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8c890'); gr.addColorStop(.5, '#c8a878'); gr.addColorStop(1, '#4a5a48');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 朝日
      c.fillStyle = '#f0d8a0';
      c.beginPath(); c.arc(W * .7, H * .25, H * .06, 0, 7); c.fill();
      // 遠くのジャングルの影
      c.fillStyle = '#4a5a45';
      c.beginPath();
      c.moveTo(0, H * .5);
      for (let i = 0; i <= 10; i++) {
        c.lineTo(W * i / 10, H * .5 - H * .04 * Math.abs(Math.sin(i * 2.3)));
      }
      c.lineTo(W, H); c.lineTo(0, H);
      c.closePath(); c.fill();
      // 段々の基壇(3段)
      c.fillStyle = '#8a7058';
      c.fillRect(W * .1, H * .62, W * .8, H * .38);
      c.fillStyle = '#7a6048';
      c.fillRect(W * .15, H * .54, W * .7, H * .08);
      c.fillStyle = '#6a5040';
      c.fillRect(W * .2, H * .48, W * .6, H * .06);
      // 鐘形の仏塔の列(透かし格子)
      const rng = L.mulberry32(187);
      for (let row = 0; row < 2; row++) {
        const n = 6 - row * 2;
        for (let i = 0; i < n; i++) {
          const sx = W * (.24 + i * .1 + row * .05);
          const sy = H * (.5 - row * .07);
          const sr = W * .028;
          c.fillStyle = '#5a4438';
          c.beginPath();
          c.moveTo(sx - sr, sy);
          c.quadraticCurveTo(sx - sr, sy - sr * 1.4, sx, sy - sr * 1.5);
          c.quadraticCurveTo(sx + sr, sy - sr * 1.4, sx + sr, sy);
          c.closePath(); c.fill();
          // 尖塔
          c.fillRect(sx - 1.5, sy - sr * 1.8, 3, sr * .4);
        }
      }
      // 中央の大仏塔
      c.fillStyle = '#4a382e';
      c.beginPath();
      c.moveTo(W * .44, H * .5);
      c.quadraticCurveTo(W * .44, H * .32, W * .5, H * .3);
      c.quadraticCurveTo(W * .56, H * .32, W * .56, H * .5);
      c.closePath(); c.fill();
      c.fillRect(W * .492, H * .22, W * .016, H * .1);
      // 朝霧の帯
      c.fillStyle = 'rgba(240,230,210,0.3)';
      c.beginPath();
      c.ellipse(W * .5 + Math.sin(t * .25) * W * .05, H * .52, W * .45, H * .05, 0, 0, 7);
      c.fill();
      // 飛ぶ鳥
      c.strokeStyle = 'rgba(60,50,40,0.7)'; c.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) {
        const bx = W * (.15 + i * .2 + Math.sin(t * .4 + i) * .03);
        const by = H * (.15 + (i % 2) * .08);
        c.beginPath();
        c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by);
        c.stroke();
      }
    } else if (pr === 'dojo') {
      // 道場: 板張りの床+障子の窓+掛け軸+木刀
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8a7458'); gr.addColorStop(.55, '#b8956a'); gr.addColorStop(1, '#7a5f42');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 壁と床の境
      c.fillStyle = '#9a7a54';
      c.fillRect(0, H * .55, W, H * .45);
      // 床の板目(遠近感)
      c.strokeStyle = 'rgba(90,65,40,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const fx = W * i / 9;
        c.beginPath();
        c.moveTo(W * .5 + (fx - W * .5) * .4, H * .55);
        c.lineTo(fx, H);
        c.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const fy = H * (.6 + i * .1);
        c.beginPath();
        c.moveTo(0, fy); c.lineTo(W, fy);
        c.stroke();
      }
      // 障子窓(両側に光)
      for (let s = 0; s < 2; s++) {
        const wx = s === 0 ? W * .05 : W * .78;
        c.fillStyle = '#f0e8d0';
        c.fillRect(wx, H * .12, W * .17, H * .38);
        c.strokeStyle = '#6a5238'; c.lineWidth = 2;
        c.strokeRect(wx, H * .12, W * .17, H * .38);
        // 格子
        c.beginPath();
        for (let i = 1; i < 4; i++) {
          c.moveTo(wx + W * .17 * i / 4, H * .12);
          c.lineTo(wx + W * .17 * i / 4, H * .5);
        }
        for (let i = 1; i < 3; i++) {
          c.moveTo(wx, H * .12 + H * .38 * i / 3);
          c.lineTo(wx + W * .17, H * .12 + H * .38 * i / 3);
        }
        c.stroke();
      }
      // 掛け軸(中央の書)
      c.fillStyle = '#f5efe0';
      c.fillRect(W * .45, H * .08, W * .1, H * .3);
      c.fillStyle = '#4a3a28';
      c.fillRect(W * .43, H * .08, W * .14, H * .02);
      c.fillRect(W * .43, H * .36, W * .14, H * .02);
      // 大きな一文字
      c.strokeStyle = '#1a1a1a'; c.lineWidth = 5;
      c.beginPath();
      c.moveTo(W * .47, H * .15); c.lineTo(W * .53, H * .15);
      c.moveTo(W * .5, H * .13); c.lineTo(W * .5, H * .28);
      c.moveTo(W * .475, H * .22); c.quadraticCurveTo(W * .5, H * .26, W * .525, H * .22);
      c.stroke();
      // 木刀(壁に立てかけ)
      c.strokeStyle = '#5a4228'; c.lineWidth = 4;
      c.beginPath();
      c.moveTo(W * .32, H * .52);
      c.lineTo(W * .35, H * .3);
      c.stroke();
      c.strokeStyle = '#3a2a18'; c.lineWidth = 5;
      c.beginPath();
      c.moveTo(W * .335, H * .42); c.lineTo(W * .365, H * .415);
      c.stroke();
    } else if (pr === 'meteora') {
      // メテオラ: 天空の岩柱+頂の僧院+夕空+鳶
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8a870'); gr.addColorStop(.5, '#c87860'); gr.addColorStop(1, '#5a4a50');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 夕日
      c.fillStyle = '#f0d090';
      c.beginPath(); c.arc(W * .25, H * .35, H * .06, 0, 7); c.fill();
      // 遠くの岩柱(薄い)
      c.fillStyle = 'rgba(110,80,80,0.5)';
      const rng = L.mulberry32(257);
      for (let i = 0; i < 4; i++) {
        const px = W * (.08 + i * .24);
        const ph = H * (.3 + rng() * .2);
        c.beginPath();
        c.moveTo(px, H);
        c.lineTo(px + W * .015, H - ph);
        c.lineTo(px + W * .05, H - ph - H * .02);
        c.lineTo(px + W * .065, H);
        c.closePath(); c.fill();
      }
      // 手前の大岩柱
      c.fillStyle = '#6a5048';
      c.beginPath();
      c.moveTo(W * .55, H);
      c.lineTo(W * .58, H * .42);
      c.quadraticCurveTo(W * .62, H * .36, W * .68, H * .38);
      c.lineTo(W * .74, H * .42);
      c.lineTo(W * .77, H);
      c.closePath(); c.fill();
      // 岩の縞
      c.strokeStyle = 'rgba(60,45,42,0.5)'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const sy = H * (.5 + i * .12);
        c.beginPath();
        c.moveTo(W * (.57 + i * .005), sy);
        c.quadraticCurveTo(W * .66, sy + H * .015, W * .76, sy);
        c.stroke();
      }
      // 頂の僧院(赤い屋根)
      c.fillStyle = '#e8dcc8';
      c.fillRect(W * .62, H * .34, W * .09, H * .06);
      c.fillStyle = '#a04030';
      c.beginPath();
      c.moveTo(W * .6, H * .345);
      c.lineTo(W * .665, H * .31);
      c.lineTo(W * .73, H * .345);
      c.closePath(); c.fill();
      c.fillStyle = '#3a4a55';
      for (let i = 0; i < 3; i++) {
        c.fillRect(W * .63 + i * W * .026, H * .355, W * .012, H * .025);
      }
      // 小さな岩柱+僧院(左)
      c.fillStyle = '#5a463e';
      c.beginPath();
      c.moveTo(W * .15, H);
      c.lineTo(W * .17, H * .6);
      c.lineTo(W * .21, H * .58);
      c.lineTo(W * .23, H);
      c.closePath(); c.fill();
      c.fillStyle = '#e8dcc8';
      c.fillRect(W * .175, H * .555, W * .035, H * .03);
      c.fillStyle = '#a04030';
      c.beginPath();
      c.moveTo(W * .172, H * .558); c.lineTo(W * .192, H * .54); c.lineTo(W * .212, H * .558);
      c.closePath(); c.fill();
      // 鳶(8の字に回る)
      c.strokeStyle = 'rgba(50,40,35,0.8)'; c.lineWidth = 1.5;
      const bx = W * (.4 + .15 * Math.sin(t * .5));
      const by = H * (.25 + .08 * Math.sin(t));
      c.beginPath();
      c.moveTo(bx - 8, by);
      c.quadraticCurveTo(bx - 3, by - 5 - 2 * Math.sin(t * 6), bx, by);
      c.quadraticCurveTo(bx + 3, by - 5 - 2 * Math.sin(t * 6), bx + 8, by);
      c.stroke();
    } else if (pr === 'rapids') {
      // 急流: 白く弾ける水+転がる岩+両岸の断崖
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#7a9a90'); gr.addColorStop(.45, '#4a6a60'); gr.addColorStop(1, '#2a4a5a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 両岸の断崖
      c.fillStyle = '#3a4a42';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .3, 0);
      c.quadraticCurveTo(W * .35, H * .3, W * .28, H * .55);
      c.lineTo(W * .18, H); c.lineTo(0, H);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .72, 0);
      c.quadraticCurveTo(W * .66, H * .3, W * .74, H * .55);
      c.lineTo(W * .84, H); c.lineTo(W, H);
      c.closePath(); c.fill();
      // 崖の緑
      c.fillStyle = '#4a6a52';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .3, 0); c.lineTo(W * .28, H * .1); c.lineTo(0, H * .15);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .72, 0); c.lineTo(W * .74, H * .1); c.lineTo(W, H * .15);
      c.closePath(); c.fill();
      // 川の水(深い緑青)
      const wat = c.createLinearGradient(0, H * .4, 0, H);
      wat.addColorStop(0, '#3a7a80'); wat.addColorStop(1, '#1a4a58');
      c.fillStyle = wat;
      c.beginPath();
      c.moveTo(W * .28, H * .55); c.lineTo(W * .18, H);
      c.lineTo(W * .84, H); c.lineTo(W * .74, H * .55);
      c.closePath(); c.fill();
      // 転がる岩+白い水しぶき
      const rng = L.mulberry32(941);
      for (let i = 0; i < 7; i++) {
        const rx = W * (.28 + rng() * .45);
        const ry = H * (.58 + rng() * .35);
        const rr = W * (.02 + rng() * .03);
        // 岩
        c.fillStyle = '#5a5a55';
        c.beginPath(); c.ellipse(rx, ry, rr, rr * .7, 0, 0, 7); c.fill();
        // 水しぶき(ゆらぐ)
        c.strokeStyle = 'rgba(230,245,250,0.75)';
        c.lineWidth = 1.5;
        const fl = Math.sin(t * 5 + i * 2);
        c.beginPath();
        c.moveTo(rx - rr * 1.4, ry);
        c.quadraticCurveTo(rx - rr * .5, ry - rr * (0.8 + fl * .3), rx, ry - rr * .2);
        c.moveTo(rx + rr * .3, ry - rr * .15);
        c.quadraticCurveTo(rx + rr, ry - rr * (0.6 - fl * .3), rx + rr * 1.5, ry + 2);
        c.stroke();
      }
      // 流れの筋(速い)
      c.strokeStyle = 'rgba(200,235,240,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const sy = H * (.58 + i * .05);
        const off = (t * .3 + i * .13) % 1;
        c.beginPath();
        c.moveTo(W * (.22 + off * .1), sy);
        c.lineTo(W * (.5 + off * .1), sy + H * .04);
        c.stroke();
      }
      // 飛沫の点
      c.fillStyle = 'rgba(240,250,255,0.6)';
      for (let i = 0; i < 15; i++) {
        const px = W * (.3 + rng() * .4);
        const py = H * (.6 + rng() * .3);
        const tw = .5 + .5 * Math.sin(t * 4 + i);
        c.beginPath(); c.arc(px, py, 1.5 * tw, 0, 7); c.fill();
      }
    } else if (pr === 'iceberg') {
      // 氷山: 輝く巨大な氷山+冷たい海+流氷+アザラシ
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#4a6a8a'); gr.addColorStop(.5, '#7a9ab5'); gr.addColorStop(1, '#3a5a75');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 低い太陽
      c.fillStyle = 'rgba(240,230,200,0.8)';
      c.beginPath(); c.arc(W * .2, H * .22, H * .05, 0, 7); c.fill();
      // 氷山本体(水上)
      c.fillStyle = '#dceef5';
      c.beginPath();
      c.moveTo(W * .3, H * .58);
      c.lineTo(W * .38, H * .3);
      c.lineTo(W * .46, H * .42);
      c.lineTo(W * .55, H * .22);
      c.lineTo(W * .63, H * .4);
      c.lineTo(W * .72, H * .58);
      c.closePath(); c.fill();
      // 氷山の影面
      c.fillStyle = '#a8c8dc';
      c.beginPath();
      c.moveTo(W * .55, H * .22);
      c.lineTo(W * .63, H * .4);
      c.lineTo(W * .72, H * .58);
      c.lineTo(W * .55, H * .58);
      c.closePath(); c.fill();
      c.fillStyle = '#c0dcea';
      c.beginPath();
      c.moveTo(W * .46, H * .42);
      c.lineTo(W * .55, H * .22);
      c.lineTo(W * .55, H * .58);
      c.lineTo(W * .4, H * .58);
      c.closePath(); c.fill();
      // 海
      const sea = c.createLinearGradient(0, H * .58, 0, H);
      sea.addColorStop(0, '#2a4a62'); sea.addColorStop(1, '#16283a');
      c.fillStyle = sea;
      c.fillRect(0, H * .58, W, H * .42);
      // 氷山の映り込み
      c.fillStyle = 'rgba(190,220,235,0.25)';
      c.beginPath();
      c.moveTo(W * .35, H * .58);
      c.lineTo(W * .5, H * .72);
      c.lineTo(W * .68, H * .58);
      c.closePath(); c.fill();
      // 流氷の欠片
      c.fillStyle = 'rgba(220,235,245,0.8)';
      const rng = L.mulberry32(761);
      for (let i = 0; i < 10; i++) {
        const fx = rng() * W;
        const fy = H * (.62 + rng() * .32);
        const fw = W * (.02 + rng() * .05);
        const dy = Math.sin(t * .8 + i) * 2;
        c.beginPath();
        c.moveTo(fx, fy + dy);
        c.lineTo(fx + fw * .4, fy - H * .012 + dy);
        c.lineTo(fx + fw, fy + dy);
        c.lineTo(fx + fw * .8, fy + H * .008 + dy);
        c.lineTo(fx + fw * .15, fy + H * .01 + dy);
        c.closePath(); c.fill();
      }
      // アザラシ(丸い頭だけ出す)
      const sx = W * (.15 + .1 * Math.sin(t * .2));
      const sy = H * (.78 + .01 * Math.sin(t * 1.5));
      c.fillStyle = '#4a5a64';
      c.beginPath(); c.ellipse(sx, sy, W * .018, H * .018, 0, 0, 7); c.fill();
      c.fillStyle = '#222';
      c.beginPath(); c.arc(sx - W * .005, sy - 2, 1.5, 0, 7); c.arc(sx + W * .005, sy - 2, 1.5, 0, 7); c.fill();
      // 波の筋
      c.strokeStyle = 'rgba(160,200,220,0.3)'; c.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const wy = H * (.6 + i * .07);
        c.beginPath();
        c.moveTo(0, wy);
        for (let x = 0; x <= 8; x++) {
          c.lineTo(W * x / 8, wy + Math.sin(x * 1.8 + i * 2.5 + t * .9) * H * .008);
        }
        c.stroke();
      }
    } else if (pr === 'cloudforest') {
      // 雲霧林: 霧に沈む巨大な樹+垂れ下がる苔+羽ばたく鳥
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8aa098'); gr.addColorStop(.5, '#5a7a68'); gr.addColorStop(1, '#2a4438');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 奥の樹(霧で薄い)
      c.fillStyle = 'rgba(60,90,75,0.5)';
      for (let i = 0; i < 5; i++) {
        const tx = W * (.1 + i * .2);
        c.fillRect(tx, H * .15, W * .015, H * .7);
        c.beginPath();
        c.ellipse(tx + W * .008, H * .15, W * .06, H * .1, 0, 0, 7);
        c.fill();
      }
      // 流れる霧の帯(2層)
      for (let i = 0; i < 2; i++) {
        const my = H * (.3 + i * .25);
        const mx = Math.sin(t * .3 + i * 2) * W * .08;
        c.fillStyle = `rgba(200,220,210,${.25 - i * .08})`;
        c.beginPath();
        c.ellipse(W * .5 + mx, my, W * .55, H * .07, 0, 0, 7);
        c.fill();
      }
      // 手前の巨木
      c.fillStyle = '#1e3228';
      c.fillRect(W * .08, 0, W * .05, H);
      c.fillRect(W * .85, 0, W * .06, H);
      // 枝
      c.beginPath();
      c.moveTo(W * .13, H * .2); c.lineTo(W * .35, H * .12);
      c.lineTo(W * .35, H * .16); c.lineTo(W * .13, H * .27);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W * .85, H * .28); c.lineTo(W * .65, H * .2);
      c.lineTo(W * .65, H * .24); c.lineTo(W * .85, H * .35);
      c.closePath(); c.fill();
      // 垂れ下がる苔(ゆれる)
      c.strokeStyle = 'rgba(120,160,110,0.8)'; c.lineWidth = 2;
      const rng = L.mulberry32(433);
      for (let i = 0; i < 14; i++) {
        const bx = W * (.14 + rng() * .2);
        const by = H * (.13 + rng() * .08);
        const bl = H * (.06 + rng() * .12);
        const sw = Math.sin(t + i) * 3;
        c.beginPath();
        c.moveTo(bx, by);
        c.quadraticCurveTo(bx + sw, by + bl * .6, bx + sw * .6, by + bl);
        c.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const bx = W * (.66 + rng() * .18);
        const by = H * (.21 + rng() * .08);
        const bl = H * (.05 + rng() * .1);
        const sw = Math.sin(t * 1.2 + i) * 3;
        c.beginPath();
        c.moveTo(bx, by);
        c.quadraticCurveTo(bx + sw, by + bl * .6, bx + sw * .6, by + bl);
        c.stroke();
      }
      // 下草
      c.fillStyle = '#24392e';
      c.fillRect(0, H * .82, W, H * .18);
      c.strokeStyle = '#3a5a48'; c.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const gx = rng() * W;
        c.beginPath();
        c.moveTo(gx, H);
        c.quadraticCurveTo(gx + 4, H * .9, gx + Math.sin(t + i) * 5, H * .84);
        c.stroke();
      }
      // 鳥(ケツァール風: 緑の影)
      c.fillStyle = 'rgba(60,140,100,0.85)';
      const bx2 = W * (.3 + .2 * Math.sin(t * .4));
      const by2 = H * (.45 + .06 * Math.sin(t * 1.3));
      const flap = Math.sin(t * 8);
      c.beginPath(); c.ellipse(bx2, by2, 8, 5, 0, 0, 7); c.fill();
      c.beginPath();
      c.moveTo(bx2 - 4, by2);
      c.quadraticCurveTo(bx2 - 14, by2 - 8 * flap, bx2 - 18, by2 - 2);
      c.stroke();
    } else if (pr === 'grotto') {
      // 青の洞窟: 輝く青い水+鍾乳石+水面の反射+入口の光
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0a1520'); gr.addColorStop(.55, '#10283a'); gr.addColorStop(1, '#0a3a50');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 入口の白光(奥)
      const glow = c.createRadialGradient(W * .5, H * .38, 0, W * .5, H * .38, W * .25);
      glow.addColorStop(0, 'rgba(180,220,255,0.7)');
      glow.addColorStop(1, 'rgba(180,220,255,0)');
      c.fillStyle = glow;
      c.fillRect(0, 0, W, H * .7);
      // 鍾乳石
      c.fillStyle = '#1a2a35';
      const rng = L.mulberry32(887);
      for (let i = 0; i < 12; i++) {
        const sx = rng() * W;
        const sh = H * (.08 + rng() * .22);
        const sw = W * (.01 + rng() * .03);
        c.beginPath();
        c.moveTo(sx - sw, 0);
        c.lineTo(sx, sh);
        c.lineTo(sx + sw, 0);
        c.closePath(); c.fill();
      }
      // 側壁の岩
      c.fillStyle = '#16242e';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .12, 0);
      c.quadraticCurveTo(W * .16, H * .4, W * .1, H * .6);
      c.lineTo(0, H * .75); c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .88, 0);
      c.quadraticCurveTo(W * .84, H * .4, W * .9, H * .6);
      c.lineTo(W, H * .75); c.closePath(); c.fill();
      // 輝く青い水面
      const water = c.createLinearGradient(0, H * .62, 0, H);
      water.addColorStop(0, '#1a6a8a'); water.addColorStop(1, '#0a4a6a');
      c.fillStyle = water;
      c.fillRect(0, H * .62, W, H * .38);
      // 水面の光の反射(ゆらぐ)
      c.fillStyle = 'rgba(150,220,255,0.3)';
      for (let i = 0; i < 10; i++) {
        const rx = W * (.3 + i * .045);
        const ry = H * (.64 + i * .03);
        const rw = W * (.02 + .012 * Math.sin(t * 1.5 + i));
        c.fillRect(rx - rw / 2, ry, rw, 2);
      }
      // 光の筋(入口から水へ)
      c.fillStyle = 'rgba(170,210,255,0.1)';
      c.beginPath();
      c.moveTo(W * .44, H * .35); c.lineTo(W * .36, H);
      c.lineTo(W * .52, H); c.lineTo(W * .52, H * .35);
      c.closePath(); c.fill();
      // 水滴のきらめき
      c.fillStyle = 'rgba(200,240,255,0.7)';
      for (let i = 0; i < 8; i++) {
        const sx = rng() * W;
        const sy = H * (.3 + rng() * .3);
        const tw = .5 + .5 * Math.sin(t * 3 + i * 2);
        c.beginPath(); c.arc(sx, sy, 1.5 * tw, 0, 7); c.fill();
      }
    } else if (pr === 'canal') {
      // 運河の街: 両岸の彩色建物+アーチ橋+水面に揺れるゴンドラ
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a0c0d8'); gr.addColorStop(.6, '#c8b8a0'); gr.addColorStop(1, '#6a8090');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 両岸の建物(左)
      const rng = L.mulberry32(613);
      const hues = ['#c07050', '#d0a060', '#a08060', '#b06050', '#c09070'];
      for (let i = 0; i < 4; i++) {
        const bx = W * i * .13;
        const bh = H * (.2 + rng() * .15);
        c.fillStyle = hues[i % hues.length];
        c.fillRect(bx, H * .45 - bh, W * .12, bh);
        // 窓
        c.fillStyle = '#4a5a6a';
        for (let w = 0; w < 3; w++) {
          c.fillRect(bx + W * .02 + w * W * .035, H * .45 - bh * .7, W * .018, bh * .25);
        }
      }
      // 右側
      for (let i = 0; i < 4; i++) {
        const bx = W * (.6 + i * .11);
        const bh = H * (.18 + rng() * .16);
        c.fillStyle = hues[(i + 2) % hues.length];
        c.fillRect(bx, H * .45 - bh, W * .1, bh);
        c.fillStyle = '#4a5a6a';
        for (let w = 0; w < 2; w++) {
          c.fillRect(bx + W * .015 + w * W * .04, H * .45 - bh * .65, W * .02, bh * .3);
        }
      }
      // 遠くのアーチ橋
      c.fillStyle = '#8a7058';
      c.beginPath();
      c.moveTo(W * .32, H * .52);
      c.quadraticCurveTo(W * .5, H * .38, W * .68, H * .52);
      c.lineTo(W * .68, H * .56); c.lineTo(W * .32, H * .56);
      c.closePath(); c.fill();
      // 運河の水面
      c.fillStyle = '#4a6a7a';
      c.fillRect(0, H * .56, W, H * .44);
      // 水の揺らめき
      c.strokeStyle = 'rgba(200,220,230,0.35)'; c.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        const wy = H * (.6 + i * .045);
        c.beginPath();
        c.moveTo(0, wy);
        for (let x = 0; x <= 8; x++) {
          c.lineTo(W * x / 8, wy + Math.sin(x * 2 + i * 3 + t * .8) * H * .006);
        }
        c.stroke();
      }
      // ゴンドラ(ゆっくり横切る)
      const gx = W * (.75 - ((t * .04) % 1) * .5);
      c.fillStyle = '#20242a';
      c.beginPath();
      c.moveTo(gx - W * .06, H * .7);
      c.quadraticCurveTo(gx, H * .75, gx + W * .06, H * .7);
      c.quadraticCurveTo(gx + W * .07, H * .66, gx + W * .06, H * .69);
      c.lineTo(gx - W * .06, H * .69);
      c.quadraticCurveTo(gx - W * .07, H * .66, gx - W * .06, H * .7);
      c.closePath(); c.fill();
      // 船頭
      c.fillRect(gx + W * .02, H * .64, W * .008, H * .05);
      c.beginPath(); c.arc(gx + W * .024, H * .63, H * .008, 0, 7); c.fill();
      // 橋の欄干
      c.strokeStyle = '#6a5038'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(W * .32, H * .5);
      c.quadraticCurveTo(W * .5, H * .36, W * .68, H * .5);
      c.stroke();
    } else if (pr === 'pampas') {
      // パンパス: 銀色の穂の草原+大空+遠くのガウチョの影
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8ab8e0'); gr.addColorStop(.55, '#c8d8c0'); gr.addColorStop(1, '#9aa86a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 大きな太陽
      c.fillStyle = '#f0e0a0';
      c.beginPath(); c.arc(W * .78, H * .18, H * .07, 0, 7); c.fill();
      // 遠くの地平の丘
      c.fillStyle = '#a8b87a';
      c.beginPath();
      c.moveTo(0, H * .58);
      c.quadraticCurveTo(W * .3, H * .52, W * .65, H * .56);
      c.quadraticCurveTo(W * .85, H * .6, W, H * .55);
      c.lineTo(W, H); c.lineTo(0, H);
      c.closePath(); c.fill();
      // パンパスグラスの穂(白銀の揺れる房)
      const rng = L.mulberry32(509);
      for (let i = 0; i < 40; i++) {
        const px = rng() * W;
        const py = H * (.6 + rng() * .38);
        const ph = H * (.08 + rng() * .1);
        const sw = Math.sin(t * 1.2 + px * .05) * ph * .12;
        // 茎
        c.strokeStyle = 'rgba(120,130,80,0.7)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(px, py);
        c.quadraticCurveTo(px + sw * .5, py - ph * .6, px + sw, py - ph);
        c.stroke();
        // 銀色の穂
        c.fillStyle = 'rgba(225,222,205,0.85)';
        c.beginPath();
        c.ellipse(px + sw, py - ph, 2.5, ph * .28, sw * .02, 0, 7);
        c.fill();
      }
      // ガウチョの影(小さな騎馬のシルエット)
      const gx = W * (.1 + .05 * Math.sin(t * .1));
      c.fillStyle = 'rgba(40,35,30,0.8)';
      c.fillRect(gx, H * .55, W * .025, H * .015); // 馬の体
      c.fillRect(gx + W * .003, H * .535, W * .008, H * .018); // 人
      // 鳥の群れ
      c.strokeStyle = 'rgba(60,60,60,0.7)'; c.lineWidth = 1.3;
      for (let i = 0; i < 5; i++) {
        const bx = W * (.15 + i * .13 + Math.sin(t * .3 + i) * .02);
        const by = H * (.12 + (i % 3) * .05);
        c.beginPath();
        c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by);
        c.stroke();
      }
    } else if (pr === 'tea') {
      // 茶畑: 等高線に沿って曲がる茶の列+霧の山+摘み手の笠
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8d8'); gr.addColorStop(.45, '#c8d8b8'); gr.addColorStop(1, '#5a8a50');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 霧の立つ山
      c.fillStyle = '#8a9a90';
      c.beginPath();
      c.moveTo(0, H * .45);
      c.quadraticCurveTo(W * .3, H * .28, W * .6, H * .4);
      c.quadraticCurveTo(W * .8, H * .48, W, H * .42);
      c.lineTo(W, H * .55); c.lineTo(0, H * .55);
      c.closePath(); c.fill();
      // 山の霧
      c.fillStyle = 'rgba(230,235,230,0.35)';
      c.beginPath();
      c.ellipse(W * .5 + Math.sin(t * .2) * W * .03, H * .42, W * .35, H * .04, 0, 0, 7);
      c.fill();
      // 等高線に沿う茶の列(うねる暗緑の帯)
      for (let i = 0; i < 6; i++) {
        const ry = H * (.56 + i * .07);
        const amp = .015 + i * .008; // 下ほど波が大きい
        c.strokeStyle = `rgba(45,${90 + i * 8},50,${.85 - i * .06})`;
        c.lineWidth = H * .028;
        c.beginPath();
        c.moveTo(0, ry);
        for (let x = 0; x <= 8; x++) {
          c.lineTo(W * x / 8, ry + Math.sin(x * 1.5 + i * 2 + t * .15) * H * amp);
        }
        c.stroke();
      }
      // 列間の畦道
      c.strokeStyle = 'rgba(160,150,110,0.5)'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const px = W * (.15 + i * .22);
        c.beginPath();
        c.moveTo(px, H * .55);
        c.lineTo(px + W * .05, H);
        c.stroke();
      }
      // 摘み手の菅笠(点々)
      const rng = L.mulberry32(359);
      for (let i = 0; i < 4; i++) {
        const px = W * (.2 + rng() * .6);
        const py = H * (.68 + rng() * .2);
        c.fillStyle = '#c8b060';
        c.beginPath();
        c.moveTo(px - W * .012, py); c.lineTo(px, py - H * .018); c.lineTo(px + W * .012, py);
        c.closePath(); c.fill();
      }
    } else if (pr === 'glade') {
      // 林間の広場: 周囲を囲む高木+木漏れ日の光柱+花の咲く草地+舞う蝶
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#4a7a5a'); gr.addColorStop(.5, '#6a9a68'); gr.addColorStop(1, '#4a7a48');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(347);
      // 周囲の高木(左右に縁取る)
      for (const side of [0, 1]) {
        for (let i = 0; i < 4; i++) {
          const tx = W * (side ? .72 + i * .08 : .02 + i * .08);
          const th = H * (.5 + rng() * .15);
          c.fillStyle = '#4a3a28';
          c.fillRect(tx, H * .55 - th * .3, W * .012, th * .3 + H * .1);
          c.fillStyle = '#3a6a40';
          c.beginPath();
          c.ellipse(tx + W * .006, H * .55 - th * .35, W * .07, H * .14, 0, 0, 7);
          c.fill();
        }
      }
      // 中央の草地
      c.fillStyle = '#5a8a48';
      c.fillRect(0, H * .55, W, H * .45);
      // 木漏れ日の光柱
      for (let i = 0; i < 3; i++) {
        const gx = W * (.35 + i * .12) + Math.sin(t * .3 + i) * W * .01;
        c.fillStyle = 'rgba(255,240,180,0.12)';
        c.beginPath();
        c.moveTo(gx, H * .1); c.lineTo(gx + W * .05, H * .1);
        c.lineTo(gx + W * .09, H * .7); c.lineTo(gx + W * .04, H * .7);
        c.closePath(); c.fill();
      }
      // 草の筋
      c.strokeStyle = 'rgba(40,80,35,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const px = W * (.28 + rng() * .44);
        const py = H * (.62 + rng() * .3);
        c.beginPath();
        c.moveTo(px, py); c.lineTo(px + W * .004, py - H * .025);
        c.stroke();
      }
      // 咲く花
      for (let i = 0; i < 12; i++) {
        const px = W * (.26 + rng() * .48);
        const py = H * (.6 + rng() * .32);
        c.fillStyle = ['#e8e0f0', '#f0d8e8', '#f8e8a8', '#e8f0d8'][Math.floor(rng() * 4)];
        c.beginPath();
        c.arc(px, py, W * .005, 0, 7);
        c.fill();
      }
      // 舞う蝶
      for (let i = 0; i < 3; i++) {
        const bx = W * .5 + Math.sin(t * .5 + i * 2.2) * W * (.1 + i * .06);
        const by = H * .55 + Math.sin(t * .9 + i * 1.3) * H * .08;
        const flap = Math.sin(t * 12 + i) * .6;
        c.fillStyle = ['#f0c8e0', '#f0e0b0', '#c8e0f0'][i];
        c.beginPath();
        c.ellipse(bx - W * .006, by, W * .007, H * .004 * Math.abs(flap) + H * .002, -.3, 0, 7);
        c.ellipse(bx + W * .006, by, W * .007, H * .004 * Math.abs(flap) + H * .002, .3, 0, 7);
        c.fill();
      }
      // 浮かぶ花粉
      c.fillStyle = 'rgba(255,250,210,0.5)';
      for (let i = 0; i < 6; i++) {
        const px = W * (.3 + rng() * .4) + Math.sin(t * .6 + i) * W * .015;
        const py = H * (.3 + rng() * .3) + Math.cos(t * .5 + i) * H * .015;
        c.beginPath();
        c.arc(px, py, 1.5, 0, 7);
        c.fill();
      }
    } else if (pr === 'billabong') {
      // ビラボン: 乾いた大地の静かな水溜り+ガムの木+映り込み+水鳥
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8c88a'); gr.addColorStop(.5, '#d8a860'); gr.addColorStop(1, '#a87848');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 低い太陽
      c.fillStyle = '#f0e0b0';
      c.beginPath();
      c.arc(W * .8, H * .2, H * .09, 0, 7);
      c.fill();
      // 乾いた大地(遠景)
      c.fillStyle = '#b08a58';
      c.fillRect(0, H * .5, W, H * .5);
      // 地平の低い丘
      c.fillStyle = '#9a7850';
      c.beginPath();
      c.moveTo(0, H * .5);
      c.quadraticCurveTo(W * .3, H * .44, W * .6, H * .5);
      c.quadraticCurveTo(W * .8, H * .54, W, H * .5);
      c.lineTo(W, H * .55); c.lineTo(0, H * .55);
      c.closePath(); c.fill();
      // ガムの木(白っぽい幹+頭の雲状の葉)
      const rng = L.mulberry32(337);
      for (let i = 0; i < 3; i++) {
        const tx = W * (.12 + i * .15 + rng() * .04);
        const th = H * (.22 + rng() * .08);
        c.fillStyle = '#c8b8a0'; // 白い幹
        c.fillRect(tx, H * .55 - th, W * .008, th);
        c.fillStyle = '#6a8a58';
        for (let j = 0; j < 4; j++) {
          c.beginPath();
          c.ellipse(tx + W * (rng() - .4) * .05, H * .55 - th - H * (rng() * .06), W * .035, H * .022, 0, 0, 7);
          c.fill();
        }
      }
      // 水溜り(三日月状の水域)
      const wg = c.createLinearGradient(0, H * .62, 0, H * .85);
      wg.addColorStop(0, '#5a8a9a'); wg.addColorStop(1, '#3a6a7a');
      c.fillStyle = wg;
      c.beginPath();
      c.ellipse(W * .55, H * .72, W * .32, H * .11, 0, 0, 7);
      c.fill();
      // 木の映り込み
      c.fillStyle = 'rgba(90,120,90,0.3)';
      for (let i = 0; i < 3; i++) {
        const tx = W * (.12 + i * .15);
        c.beginPath();
        c.ellipse(tx, H * .68, W * .03, H * .02, 0, 0, 7);
        c.fill();
      }
      // 水面の輝き+さざ波
      c.strokeStyle = 'rgba(200,235,245,0.4)'; c.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const py = H * (.66 + i * .03);
        c.beginPath();
        c.moveTo(W * .35 + Math.sin(t * .7 + i) * W * .02, py);
        c.lineTo(W * .7 + Math.sin(t * .7 + i) * W * .02, py);
        c.stroke();
      }
      // 水鳥(佇むシギ)
      c.strokeStyle = '#3a3028'; c.lineWidth = 1.5;
      const bx = W * .32, by = H * .66;
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + H * .025); c.stroke(); // 脚
      c.fillStyle = '#3a3028';
      c.beginPath(); c.ellipse(bx + W * .004, by - H * .004, W * .008, H * .006, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(bx + W * .012, by - H * .012, W * .004, 0, 7); c.fill(); // 頭
      // 岸の草叢
      c.strokeStyle = '#7a8a50'; c.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) {
        const px = W * (.25 + rng() * .5);
        const py = H * (.8 + rng() * .1);
        c.beginPath();
        c.moveTo(px, py);
        c.quadraticCurveTo(px + W * .006, py - H * .03, px + W * .002, py - H * .045);
        c.stroke();
      }
    } else if (pr === 'seastack') {
      // 海食柱: 切り立つ岩柱+砕ける波+飛ぶ海鳥+曇り空
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8a9aa8'); gr.addColorStop(.5, '#4a6a80'); gr.addColorStop(1, '#2a4a60');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 曇り空の雲
      c.fillStyle = 'rgba(220,225,230,0.3)';
      for (let i = 0; i < 3; i++) {
        const px = ((W * (.1 + i * .4) + t * W * .01) % (W * 1.2)) - W * .1;
        c.beginPath();
        c.ellipse(px, H * (.1 + i * .06), W * .12, H * .025, 0, 0, 7);
        c.fill();
      }
      // 海食柱(海面から立つ岩塔)
      const rng = L.mulberry32(313);
      const stacks = [[.2, .35, .05], [.38, .28, .04], [.68, .4, .06], [.88, .3, .035]];
      for (const [sx, sh, sw] of stacks) {
        c.fillStyle = '#3a4a52';
        c.beginPath();
        c.moveTo(W * (sx - sw), H * .7);
        c.lineTo(W * (sx - sw * .7), H * (.7 - sh));
        c.quadraticCurveTo(W * sx, H * (.7 - sh) - H * .02, W * (sx + sw * .7), H * (.7 - sh));
        c.lineTo(W * (sx + sw), H * .7);
        c.closePath(); c.fill();
        // 頂の草
        c.fillStyle = '#4a6a4a';
        c.beginPath();
        c.ellipse(W * sx, H * (.7 - sh) - H * .008, W * sw * .8, H * .012, 0, 0, 7);
        c.fill();
        c.fillStyle = '#3a4a52';
      }
      // 海面
      const wg = c.createLinearGradient(0, H * .7, 0, H);
      wg.addColorStop(0, '#3a6a85'); wg.addColorStop(1, '#1e4a60');
      c.fillStyle = wg;
      c.fillRect(0, H * .7, W, H * .3);
      // 岩柱の根元に砕ける白波
      c.fillStyle = 'rgba(240,250,255,0.6)';
      for (const [sx] of stacks) {
        const wob = Math.sin(t * 2 + sx * 10) * W * .008;
        c.beginPath();
        c.ellipse(W * sx + wob, H * .705, W * .035, H * .008, 0, 0, 7);
        c.fill();
      }
      // 波の輝き
      c.fillStyle = 'rgba(200,230,245,0.35)';
      for (let i = 0; i < 8; i++) {
        const px = W * rng(), py = H * (.73 + rng() * .22);
        c.beginPath();
        c.ellipse(px + Math.sin(t + i) * W * .006, py, W * .012, H * .002, 0, 0, 7);
        c.fill();
      }
      // 海鳥
      c.strokeStyle = '#202830'; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const bx = W * (.15 + i * .3) + Math.sin(t * .5 + i) * W * .03;
        const by = H * (.25 + i * .08) + Math.sin(t * .9 + i * 2) * H * .02;
        c.beginPath();
        c.arc(bx - W * .005, by, W * .005, Math.PI * 1.1, Math.PI * 1.9);
        c.arc(bx + W * .005, by, W * .005, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      }
    } else if (pr === 'bazaar') {
      // バザール: 市場の屋台+色とりどりの天幕+吊るす提灯+石畳
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8a860'); gr.addColorStop(.55, '#c88858'); gr.addColorStop(1, '#8a5a40');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠景の建物シルエット(ドーム+ミナレット)
      c.fillStyle = '#a06a48';
      c.fillRect(0, H * .35, W, H * .18);
      c.beginPath();
      c.arc(W * .2, H * .35, W * .05, Math.PI, Math.PI * 2); c.fill();
      c.beginPath();
      c.arc(W * .62, H * .35, W * .07, Math.PI, Math.PI * 2); c.fill();
      c.fillRect(W * .85, H * .22, W * .015, H * .3); // ミナレット
      c.beginPath();
      c.arc(W * .857, H * .22, W * .012, Math.PI, Math.PI * 2); c.fill();
      // 市場の天幕(縞のタープ)
      const rng = L.mulberry32(293);
      for (let i = 0; i < 3; i++) {
        const ax = W * (.08 + i * .32);
        const aw = W * .26;
        for (let s = 0; s < 6; s++) {
          c.fillStyle = s % 2 ? '#c84838' : '#e8d8b8';
          c.beginPath();
          c.moveTo(ax + aw * s / 6, H * .5);
          c.lineTo(ax + aw * (s + 1) / 6, H * .5);
          c.lineTo(ax + aw * (s + .5) / 6, H * .56);
          c.closePath(); c.fill();
        }
      }
      // 屋台(箱+商品の塊)
      for (let i = 0; i < 3; i++) {
        const sx = W * (.1 + i * .32);
        c.fillStyle = '#7a5a3a';
        c.fillRect(sx, H * .62, W * .2, H * .12);
        c.fillStyle = ['#c84a3a', '#3a7a5a', '#c8a83a'][i];
        for (let j = 0; j < 5; j++) {
          c.beginPath();
          c.arc(sx + W * .02 + j * W * .035, H * .6, W * .012, 0, 7);
          c.fill();
        }
      }
      // 吊るす提灯
      for (let i = 0; i < 5; i++) {
        const lx = W * (.12 + i * .19);
        const ly = H * .18 + Math.sin(t * .8 + i) * H * .008;
        c.strokeStyle = 'rgba(60,40,30,0.6)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(lx, H * .08); c.lineTo(lx, ly); c.stroke();
        c.fillStyle = 'rgba(255,190,90,0.9)';
        c.beginPath(); c.ellipse(lx, ly + H * .015, W * .011, H * .018, 0, 0, 7); c.fill();
      }
      // 石畳
      c.fillStyle = '#6a5040';
      c.fillRect(0, H * .86, W, H * .14);
      c.strokeStyle = 'rgba(40,30,22,0.4)'; c.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const px = W * rng();
        c.beginPath(); c.moveTo(px, H * .88); c.lineTo(px + W * .03, H * .98); c.stroke();
      }
    } else if (pr === 'polder') {
      // ポルダー: 干拓地の水平線+運河+風車+低い雲+放牧地
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8e0'); gr.addColorStop(.5, '#c8d8c0'); gr.addColorStop(1, '#7aa868');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 低い流れ雲
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 3; i++) {
        const px = ((W * (.15 + i * .35) + t * W * .015) % (W * 1.2)) - W * .1;
        c.beginPath();
        c.ellipse(px, H * (.12 + i * .07), W * .09, H * .02, 0, 0, 7);
        c.fill();
      }
      // 地平の風車
      const wx = W * .75, wy = H * .42;
      c.fillStyle = '#6a5a4a';
      c.beginPath();
      c.moveTo(wx - W * .012, wy + H * .12); c.lineTo(wx + W * .012, wy + H * .12);
      c.lineTo(wx + W * .008, wy); c.lineTo(wx - W * .008, wy);
      c.closePath(); c.fill();
      // 回る翼
      c.strokeStyle = '#5a4a3a'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = t * .8 + i * Math.PI / 2;
        c.beginPath();
        c.moveTo(wx, wy + H * .01);
        c.lineTo(wx + Math.cos(a) * W * .045, wy + H * .01 + Math.sin(a) * W * .045);
        c.stroke();
      }
      // 運河(地平に向かって収束)
      c.fillStyle = '#4a7a95';
      c.beginPath();
      c.moveTo(W * .42, H); c.lineTo(W * .47, H * .5);
      c.lineTo(W * .53, H * .5); c.lineTo(W * .62, H);
      c.closePath(); c.fill();
      // 運河の輝き
      c.fillStyle = 'rgba(180,220,235,0.3)';
      c.beginPath();
      c.moveTo(W * .48, H); c.lineTo(W * .5, H * .55); c.lineTo(W * .51, H * .55); c.lineTo(W * .5, H);
      c.closePath(); c.fill();
      // 牧草地の区割り線(畝/畦)
      c.strokeStyle = 'rgba(60,90,50,0.35)'; c.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(W * (i * .08), H * .58);
        c.lineTo(W * (i * .16 - .02), H);
        c.stroke();
      }
      // 牛の点
      const rng = L.mulberry32(277);
      c.fillStyle = '#3a3a32';
      for (let i = 0; i < 4; i++) {
        const px = W * (.08 + rng() * .3);
        const py = H * (.7 + rng() * .2);
        c.beginPath();
        c.ellipse(px, py, W * .009, H * .008, 0, 0, 7);
        c.fill();
        c.beginPath();
        c.arc(px + W * .01, py - H * .004, W * .004, 0, 7);
        c.fill();
      }
    } else if (pr === 'karst') {
      // カルスト: 石灰岩の割れ目大地+鍾乳石の森+青い空+低い丘
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8e8'); gr.addColorStop(.55, '#c8bfa0'); gr.addColorStop(1, '#9a8a6a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠景の低い丘
      c.fillStyle = '#8a9a80';
      c.beginPath();
      c.moveTo(0, H * .45);
      c.quadraticCurveTo(W * .25, H * .34, W * .5, H * .42);
      c.quadraticCurveTo(W * .75, H * .5, W, H * .44);
      c.lineTo(W, H * .55); c.lineTo(0, H * .55);
      c.closePath(); c.fill();
      const rng = L.mulberry32(263);
      // 石灰岩の柱林(鍾乳石の塔)
      for (let i = 0; i < 9; i++) {
        const px = W * (.05 + i * .11) + rng() * W * .03;
        const ph = H * (.18 + rng() * .25);
        const pw = W * (.02 + rng() * .018);
        c.fillStyle = ['#b8ac8e', '#a89a7c', '#c4b89e'][Math.floor(rng() * 3)];
        c.beginPath();
        c.moveTo(px - pw, H * .85);
        c.lineTo(px - pw * .7, H * .85 - ph);
        c.quadraticCurveTo(px, H * .85 - ph - H * .02, px + pw * .7, H * .85 - ph);
        c.lineTo(px + pw, H * .85);
        c.closePath(); c.fill();
        // 縦筋
        c.strokeStyle = 'rgba(90,80,60,0.4)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(px - pw * .3, H * .82);
        c.lineTo(px - pw * .3, H * .85 - ph * .8);
        c.stroke();
      }
      // 前景: ひび割れた石灰岩の地表
      c.fillStyle = '#8a7a5c';
      c.fillRect(0, H * .82, W, H * .18);
      c.strokeStyle = 'rgba(60,50,35,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) {
        const px = W * rng(), py = H * (.84 + rng() * .13);
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + W * (rng() - .5) * .06, py + H * .04);
        c.lineTo(px + W * (rng() - .5) * .08, py + H * .08);
        c.stroke();
      }
      // 隙間の草
      c.strokeStyle = '#6a8a50'; c.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const px = W * rng();
        c.beginPath();
        c.moveTo(px, H * .85);
        c.quadraticCurveTo(px + W * .008, H * .82, px + W * .004, H * .8);
        c.stroke();
      }
    } else if (pr === 'loch') {
      // ロッホ: 霧の立つ深い湖+両岸の丘+陰が差す水面+遠くの城跡
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#7a8a95'); gr.addColorStop(.5, '#4a5a68'); gr.addColorStop(1, '#2a3a48');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠くの丘
      c.fillStyle = '#3a4a52';
      c.beginPath();
      c.moveTo(0, H * .45);
      c.quadraticCurveTo(W * .3, H * .25, W * .55, H * .42);
      c.quadraticCurveTo(W * .8, H * .52, W, H * .44);
      c.lineTo(W, H * .6); c.lineTo(0, H * .6);
      c.closePath(); c.fill();
      // 丘の上の小さな城跡
      c.fillStyle = '#2a3a40';
      const cx = W * .52, cy = H * .34;
      c.fillRect(cx, cy, W * .015, H * .06);
      c.fillRect(cx + W * .02, cy - H * .01, W * .012, H * .07);
      // 湖面
      const wg = c.createLinearGradient(0, H * .58, 0, H);
      wg.addColorStop(0, '#1a3a50'); wg.addColorStop(1, '#0e2a3a');
      c.fillStyle = wg;
      c.fillRect(0, H * .58, W, H * .42);
      // 反射の丘影
      c.fillStyle = 'rgba(50,70,80,0.35)';
      c.beginPath();
      c.moveTo(W * .3, H * .58);
      c.quadraticCurveTo(W * .45, H * .7, W * .55, H * .58);
      c.closePath(); c.fill();
      // 漂う霧の帯
      for (let i = 0; i < 3; i++) {
        const my = H * (.5 + i * .07) + Math.sin(t * .3 + i) * H * .01;
        c.fillStyle = `rgba(200,215,220,${.1 + i * .05})`;
        c.beginPath();
        c.ellipse(W * .5 + Math.sin(t * .15 + i) * W * .05, my, W * (.3 + i * .1), H * .02, 0, 0, 7);
        c.fill();
      }
      // 水面の輝き
      c.fillStyle = 'rgba(160,200,220,0.3)';
      const rng = L.mulberry32(251);
      for (let i = 0; i < 10; i++) {
        const px = W * rng(), py = H * (.62 + rng() * .32);
        c.beginPath();
        c.ellipse(px + Math.sin(t + i) * W * .008, py, W * .015, H * .002, 0, 0, 7);
        c.fill();
      }
      // 飛び交う水鳥
      c.strokeStyle = '#202830'; c.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const bx = W * (.3 + i * .35) + Math.sin(t * .4 + i) * W * .04;
        const by = H * .3 + Math.sin(t * .8 + i * 2) * H * .02;
        c.beginPath();
        c.arc(bx - W * .006, by, W * .006, Math.PI * 1.1, Math.PI * 1.9);
        c.arc(bx + W * .006, by, W * .006, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      }
    } else if (pr === 'cenote') {
      // セノーテ: 石灰岩の窪み+差し込む光柱+青い湧水+垂れ下がる根
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2a3a30'); gr.addColorStop(.45, '#1a4a55'); gr.addColorStop(1, '#0d3540');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 天井の開口(光が差す)
      c.fillStyle = '#bfe8f0';
      c.beginPath();
      c.ellipse(W * .5, 0, W * .18, H * .05, 0, 0, 7);
      c.fill();
      // 光柱
      c.fillStyle = 'rgba(160,230,240,0.12)';
      c.beginPath();
      c.moveTo(W * .42, H * .02); c.lineTo(W * .58, H * .02);
      c.lineTo(W * .65, H * .75); c.lineTo(W * .35, H * .75);
      c.closePath(); c.fill();
      // 周囲の岩壁
      c.fillStyle = '#3d4a3a';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .22, 0);
      c.quadraticCurveTo(W * .18, H * .3, W * .2, H * .55);
      c.lineTo(W * .18, H); c.lineTo(0, H);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .78, 0);
      c.quadraticCurveTo(W * .82, H * .3, W * .8, H * .55);
      c.lineTo(W * .82, H); c.lineTo(W, H);
      c.closePath(); c.fill();
      // 垂れる根
      const rng = L.mulberry32(237);
      c.strokeStyle = '#4a5a40'; c.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const px = W * (.3 + rng() * .4);
        const len = H * (.08 + rng() * .15);
        c.beginPath();
        c.moveTo(px, H * .04);
        c.quadraticCurveTo(px + Math.sin(i) * W * .01, H * .04 + len * .5, px + Math.sin(i * 1.7) * W * .015, H * .04 + len);
        c.stroke();
      }
      // 湧水面
      c.fillStyle = '#2a8a9a';
      c.fillRect(0, H * .72, W, H * .28);
      c.fillStyle = 'rgba(180,240,250,0.25)';
      for (let i = 0; i < 4; i++) {
        const wx = (W * (.1 + i * .25) + Math.sin(t * .6 + i) * W * .04);
        c.beginPath();
        c.ellipse(wx, H * .74, W * .05, H * .006, 0, 0, 7);
        c.fill();
      }
      // 揺れる小魚
      c.fillStyle = 'rgba(200,230,220,0.6)';
      for (let i = 0; i < 3; i++) {
        const fx = W * .5 + Math.sin(t * .5 + i * 2.1) * W * (.08 + i * .04);
        const fy = H * (.8 + i * .05) + Math.cos(t * .8 + i) * H * .015;
        c.beginPath();
        c.ellipse(fx, fy, W * .011, H * .0045, 0, 0, 7);
        c.fill();
      }
    } else if (pr === 'kelp') {
      // 昆布の森: 水中の光筋+ゆらめく昆布の列+魚群+岩礁の底
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2a5a70'); gr.addColorStop(.5, '#1a4a58'); gr.addColorStop(1, '#0e3540');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 差し込む光筋
      for (let i = 0; i < 4; i++) {
        const gx = W * (.15 + i * .22) + Math.sin(t * .2 + i) * W * .02;
        c.fillStyle = 'rgba(150,220,230,0.07)';
        c.beginPath();
        c.moveTo(gx, 0); c.lineTo(gx + W * .1, 0);
        c.lineTo(gx + W * .16, H); c.lineTo(gx + W * .06, H);
        c.closePath(); c.fill();
      }
      const rng = L.mulberry32(223);
      // 揺れる昆布(根元から伸びる縦の葉体)
      for (let i = 0; i < 14; i++) {
        const px = W * (.04 + rng() * .92);
        const kh = H * (.3 + rng() * .45); // 高さ
        const sway = Math.sin(t * .8 + i) * W * .012;
        c.strokeStyle = ['#2a6a3a', '#3a7a45', '#1f5a35'][Math.floor(rng() * 3)];
        c.lineWidth = 2 + rng() * 3;
        c.beginPath();
        c.moveTo(px, H);
        c.quadraticCurveTo(px + sway * .4, H - kh * .6, px + sway, H - kh);
        c.stroke();
        // 先端の葉
        c.fillStyle = '#3a8a50';
        c.beginPath();
        c.ellipse(px + sway, H - kh, W * .008, H * .02, sway * 2, 0, 7);
        c.fill();
      }
      // 魚群
      c.fillStyle = 'rgba(180,220,230,0.7)';
      for (let i = 0; i < 8; i++) {
        const fx = (W * (.1 + i * .11) + t * W * .03) % (W * 1.1);
        const fy = H * (.2 + (i % 3) * .12) + Math.sin(t * 1.5 + i) * H * .02;
        c.beginPath();
        c.ellipse(fx, fy, W * .012, H * .005, 0, 0, 7);
        c.fill();
        c.beginPath();
        c.moveTo(fx - W * .012, fy); c.lineTo(fx - W * .018, fy - H * .006); c.lineTo(fx - W * .018, fy + H * .006);
        c.closePath(); c.fill();
      }
      // 底の岩礁
      c.fillStyle = '#153038';
      for (let i = 0; i < 6; i++) {
        const px = W * (i / 6) + rng() * W * .08;
        c.beginPath();
        c.ellipse(px, H * .98, W * (.04 + rng() * .04), H * (.02 + rng() * .015), 0, 0, 7);
        c.fill();
      }
    } else if (pr === 'hamada') {
      // ハマダ: 岩盤むき出しの平坦な砂漠+疎らな礫+砂塵+遠い低山
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#d8a878'); gr.addColorStop(.4, '#c08858'); gr.addColorStop(1, '#98704a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 眩しい太陽
      c.fillStyle = '#f8e0a8';
      c.beginPath(); c.arc(W * .3, H * .16, H * .08, 0, 7); c.fill();
      const rng = L.mulberry32(211);
      // 遠い低い山並み
      c.fillStyle = '#a07850';
      c.beginPath();
      c.moveTo(0, H * .42);
      for (let x = 0; x <= 10; x++) {
        c.lineTo(W * x / 10, H * (.42 - (x % 3 === 0 ? .04 : .01) - Math.sin(x * 1.3) * .015));
      }
      c.lineTo(W, H * .42); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 岩盤の平坦な地表+ひび筋
      c.fillStyle = '#a88058';
      c.fillRect(0, H * .42, W, H * .58);
      c.strokeStyle = 'rgba(90,60,40,0.35)'; c.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const px = W * rng(), py = H * (.5 + rng() * .48);
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + (rng() - .5) * W * .08, py + rng() * H * .03);
        c.stroke();
      }
      // 疎らな礫
      for (let i = 0; i < 30; i++) {
        const px = W * rng(), py = H * (.45 + rng() * .52);
        const s = rng();
        c.fillStyle = ['#7a5a3a', '#8a6a48', '#6a4a30'][Math.floor(rng() * 3)];
        c.beginPath();
        c.ellipse(px, py, W * (.004 + s * .01), H * (.002 + s * .005), rng() * .5, 0, 7);
        c.fill();
      }
      // 漂う砂塵
      c.fillStyle = 'rgba(230,200,160,0.2)';
      for (let i = 0; i < 4; i++) {
        const y = H * (.55 + i * .12) + Math.sin(t * .5 + i * 2) * H * .01;
        c.beginPath();
        c.ellipse(W * .5, y, W * .45, H * .025, 0, 0, 7);
        c.fill();
      }
      // 蜃気楼の揺らぎ筋
      c.strokeStyle = 'rgba(255,240,210,0.3)'; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const y = H * (.44 + i * .015);
        c.beginPath();
        c.moveTo(W * .2, y);
        c.quadraticCurveTo(W * .5, y + Math.sin(t * .8 + i) * H * .006, W * .8, y);
        c.stroke();
      }
    } else if (pr === 'meseta') {
      // メセタ高原: 乾いた黄土の高原+孤立した樫の木+回る猛禽+遠い丘陵
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#d8c090'); gr.addColorStop(.45, '#c8a870'); gr.addColorStop(1, '#a88558');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 照りつける太陽
      c.fillStyle = '#f8e8b0';
      c.beginPath(); c.arc(W * .75, H * .14, H * .07, 0, 7); c.fill();
      const rng = L.mulberry32(199);
      // 遠い丘陵(平たい連なり)
      c.fillStyle = '#b08a5f';
      c.beginPath();
      c.moveTo(0, H * .42);
      for (let x = 0; x <= 8; x++) {
        c.lineTo(W * x / 8, H * (.42 - Math.sin(x * .9) * .025));
      }
      c.lineTo(W, H * .42); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 乾いた草の点描
      for (let i = 0; i < 80; i++) {
        const px = W * rng(), py = H * (.45 + rng() * .52);
        c.fillStyle = ['#8a7040', '#9a8050', '#7a6038'][Math.floor(rng() * 3)];
        c.globalAlpha = .4 + rng() * .4;
        c.beginPath();
        c.ellipse(px, py, W * .006, H * .003, rng() * .6, 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;
      // 孤立した樫の木(丸い樹冠)
      c.fillStyle = '#4a3a28';
      c.fillRect(W * .24, H * .5, W * .008, H * .09); // 幹
      c.fillStyle = '#4a5a2e';
      c.beginPath(); c.ellipse(W * .244, H * .48, W * .035, H * .028, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(W * .228, H * .5, W * .02, H * .02, 0, 0, 7); c.fill();
      // 空を回る猛禽
      c.strokeStyle = '#4a4038'; c.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const ang = t * .4 + i * Math.PI;
        const bx = W * (.55 + Math.cos(ang) * .12);
        const by = H * (.2 + Math.sin(ang) * .04);
        c.beginPath();
        c.moveTo(bx - W * .015, by);
        c.quadraticCurveTo(bx, by - H * .012, bx + W * .015, by);
        c.stroke();
      }
      // 石の散在
      for (let i = 0; i < 12; i++) {
        const px = W * rng(), py = H * (.85 + rng() * .13);
        c.fillStyle = '#8a7a60';
        c.beginPath();
        c.ellipse(px, py, W * (.008 + rng() * .01), H * (.004 + rng() * .005), rng() * .4, 0, 7);
        c.fill();
      }
    } else if (pr === 'steppe') {
      // ステップ草原: 果てしない平坦な地平+羽毛草の波+巨大な積雲
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#90b0d0'); gr.addColorStop(.4, '#c8c8a0'); gr.addColorStop(1, '#a0986a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(191);
      // 巨大な積雲2つ
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [cx, cy, s] of [[.25, .18, 1], [.68, .12, .7]]) {
        c.beginPath();
        c.ellipse(W * cx, H * cy, W * .12 * s, H * .05 * s, 0, 0, 7); c.fill();
        c.beginPath();
        c.ellipse(W * (cx + .05 * s), H * (cy - .03 * s), W * .08 * s, H * .045 * s, 0, 0, 7); c.fill();
      }
      // 平坦な地平線
      c.fillStyle = '#98905f';
      c.fillRect(0, H * .42, W, H * .58);
      // 羽毛草(スティパ)の穂の波 — 風で揺れる
      for (let i = 0; i < 70; i++) {
        const px = W * rng(), py = H * (.45 + rng() * .52);
        const dep = (py / H - .45) / .55; // 遠近: 小さいほど遠く
        const sway = Math.sin(t * 1.2 + px * .01) * W * .004 * (0.5 + dep);
        c.strokeStyle = ['#b8a870', '#c8b880', '#a89860'][Math.floor(rng() * 3)];
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(px, py);
        c.quadraticCurveTo(px + sway * .5, py - H * .03, px + sway, py - H * (.035 + dep * .02));
        c.stroke();
      }
      // 遠くの騎馬シルエット
      c.fillStyle = '#5a5040';
      for (let i = 0; i < 3; i++) {
        const hx2 = W * (.3 + i * .18 + rng() * .06);
        const hy2 = H * .43;
        c.beginPath(); c.ellipse(hx2, hy2, W * .012, H * .005, 0, 0, 7); c.fill(); // 馬体
        c.fillRect(hx2 - W * .002, hy2 - H * .018, W * .004, H * .014); // 騎手
      }
      // 孤立した一樹
      c.fillStyle = '#4a5a38';
      c.fillRect(W * .82, H * .38, W * .005, H * .045);
      c.beginPath(); c.ellipse(W * .822, H * .37, W * .02, H * .02, 0, 0, 7); c.fill();
    } else if (pr === 'glen') {
      // グレン: 狭い谷+急な緑の斜面+霧+谷底の渓流+岩
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#98a8b8'); gr.addColorStop(.4, '#889888'); gr.addColorStop(1, '#586848');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(181);
      // 左右の急な緑の斜面
      c.fillStyle = '#4a6038';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .3, 0);
      c.quadraticCurveTo(W * .38, H * .35, W * .28, H);
      c.lineTo(0, H); c.closePath(); c.fill();
      c.fillStyle = '#42562e';
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .7, 0);
      c.quadraticCurveTo(W * .62, H * .35, W * .72, H);
      c.lineTo(W, H); c.closePath(); c.fill();
      // 斜面の木々(小さな点々)
      c.fillStyle = '#3a5028';
      for (let i = 0; i < 26; i++) {
        const side = rng() < .5 ? 0 : 1;
        const px = side ? W * (.72 + rng() * .26) : W * (rng() * .28);
        const py = H * (.15 + rng() * .7);
        c.beginPath(); c.ellipse(px, py, W * .008, H * .01, 0, 0, 7); c.fill();
      }
      // 霧の帯
      c.fillStyle = 'rgba(220,228,235,0.25)';
      for (let i = 0; i < 3; i++) {
        const y = H * (.3 + i * .18) + Math.sin(t * .3 + i) * H * .01;
        c.beginPath();
        c.ellipse(W * .5, y, W * .35, H * .04, 0, 0, 7);
        c.fill();
      }
      // 谷底の渓流
      c.strokeStyle = '#a8c8d8'; c.lineWidth = 5;
      c.beginPath();
      c.moveTo(W * .48, H);
      c.quadraticCurveTo(W * (.52 + Math.sin(t * .4) * .01), H * .75, W * .5, H * .55);
      c.quadraticCurveTo(W * .48, H * .4, W * .5, H * .3);
      c.stroke();
      c.strokeStyle = 'rgba(230,245,255,0.6)'; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(W * .48, H);
      c.quadraticCurveTo(W * (.52 + Math.sin(t * .4) * .01), H * .75, W * .5, H * .55);
      c.stroke();
      // 渓流の岩
      for (let i = 0; i < 8; i++) {
        const px = W * (.42 + rng() * .16), py = H * (.6 + rng() * .38);
        c.fillStyle = '#6a6a60';
        c.beginPath();
        c.ellipse(px, py, W * .012, H * .006, rng() * .5, 0, 7);
        c.fill();
      }
    } else if (pr === 'cove') {
      // 入り江: 両側の断崖+穏やかな湾内の水+小さなボート+砂浜
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8e0'); gr.addColorStop(.4, '#b8d0e0'); gr.addColorStop(1, '#d8c8a0');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(173);
      // 左右の断崖(岬)
      c.fillStyle = '#7a7058';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .18, 0);
      c.quadraticCurveTo(W * .3, H * .3, W * .22, H * .55);
      c.lineTo(0, H * .7); c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .82, 0);
      c.quadraticCurveTo(W * .72, H * .35, W * .78, H * .6);
      c.lineTo(W, H * .75); c.closePath(); c.fill();
      // 崖の緑(樹冠)
      c.fillStyle = '#5a7048';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .18, 0); c.lineTo(W * .22, H * .08); c.lineTo(0, H * .1); c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .82, 0); c.lineTo(W * .78, H * .09); c.lineTo(W, H * .12); c.closePath(); c.fill();
      // 湾内の水
      c.fillStyle = '#5a8aa8';
      c.beginPath();
      c.moveTo(0, H * .7);
      c.quadraticCurveTo(W * .5, H * .5, W, H * .75);
      c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 波の光
      c.strokeStyle = 'rgba(230,245,255,0.5)'; c.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const y = H * (.62 + i * .035);
        c.beginPath();
        c.moveTo(W * (.25 + rng() * .2), y);
        c.lineTo(W * (.45 + rng() * .25), y);
        c.stroke();
      }
      // 小さなボート
      const bx = W * (.45 + Math.sin(t * .2) * .03), by = H * .62;
      c.fillStyle = '#8a5a38';
      c.beginPath();
      c.moveTo(bx - W * .03, by);
      c.quadraticCurveTo(bx, by + H * .02, bx + W * .03, by);
      c.lineTo(bx + W * .025, by - H * .008);
      c.lineTo(bx - W * .025, by - H * .008);
      c.closePath(); c.fill();
      c.strokeStyle = '#6a4a30'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(bx, by - H * .008); c.lineTo(bx, by - H * .055); c.stroke(); // マスト
      // 砂浜
      c.fillStyle = '#d8c098';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .92);
      c.quadraticCurveTo(W * .3, H * .85, W * .6, H * .95);
      c.lineTo(W, H * .98); c.lineTo(W, H); c.closePath(); c.fill();
      // 砂の貝殻点
      for (let i = 0; i < 14; i++) {
        c.fillStyle = ['#b09070', '#c8a880', '#a88868'][Math.floor(rng() * 3)];
        c.beginPath();
        c.arc(W * rng(), H * (.9 + rng() * .09), W * .003, 0, 7);
        c.fill();
      }
    } else if (pr === 'fen') {
      // フェン: 平坦な水湿地+葦の茂み+開いた水路+低い空
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#b8c8d8'); gr.addColorStop(.45, '#a8b898'); gr.addColorStop(1, '#788868');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(163);
      // 開いた水面(蛇行する水路)
      c.fillStyle = '#8aa0b0';
      c.beginPath();
      c.moveTo(W * .35, H);
      c.quadraticCurveTo(W * .3, H * .8, W * .42, H * .62);
      c.quadraticCurveTo(W * .55, H * .45, W * .48, H * .3);
      c.lineTo(W * .56, H * .3);
      c.quadraticCurveTo(W * .62, H * .5, W * .5, H * .65);
      c.quadraticCurveTo(W * .38, H * .82, W * .45, H);
      c.closePath(); c.fill();
      // 水面の光の筋
      c.strokeStyle = 'rgba(220,235,245,0.4)'; c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const y = H * (.55 + i * .05);
        c.beginPath();
        c.moveTo(W * (.3 + rng() * .15), y);
        c.lineTo(W * (.42 + rng() * .12), y);
        c.stroke();
      }
      // 葦の茂み(縦の細い穂)
      for (let i = 0; i < 40; i++) {
        const px = W * rng();
        if (px > W * .33 && px < W * .58) continue; // 水路の上は避ける
        const py = H * (.42 + rng() * .55);
        const hgt = H * (.04 + rng() * .06);
        c.strokeStyle = ['#5a7048', '#6a8058', '#7a8858'][Math.floor(rng() * 3)];
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(px, py);
        c.quadraticCurveTo(px + W * .002, py - hgt * .6, px + (rng() - .5) * W * .008, py - hgt);
        c.stroke();
        // 穂先
        c.fillStyle = '#8a7a50';
        c.beginPath();
        c.ellipse(px + (rng() - .5) * W * .008, py - hgt, W * .003, H * .012, 0, 0, 7);
        c.fill();
      }
      // 遠くの地平の樹列
      c.fillStyle = '#5a6a58';
      for (let i = 0; i < 9; i++) {
        const px = W * (i / 9) + rng() * W * .03;
        c.fillRect(px, H * .36 - H * (.01 + rng() * .015), W * .008, H * .04);
      }
      // 飛ぶ鳥
      c.strokeStyle = '#4a5560'; c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const bx = W * (.15 + i * .2 + rng() * .1), by = H * (.12 + rng() * .1);
        c.beginPath();
        c.moveTo(bx - W * .012, by);
        c.quadraticCurveTo(bx, by - H * .01, bx + W * .012, by);
        c.stroke();
      }
    } else if (pr === 'cirque') {
      // 圏谷: すり鉢状の岩壁+吊るされた滝+小さな湖(氷河湖)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8b8d0'); gr.addColorStop(.4, '#9098a8'); gr.addColorStop(1, '#687078');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(151);
      // 左右にせり出す岩壁(すり鉢)
      c.fillStyle = '#7a7f88';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .22, 0);
      c.quadraticCurveTo(W * .32, H * .4, W * .2, H);
      c.lineTo(0, H); c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, 0); c.lineTo(W * .78, 0);
      c.quadraticCurveTo(W * .68, H * .4, W * .8, H);
      c.lineTo(W, H); c.closePath(); c.fill();
      // 岩壁の筋
      c.strokeStyle = 'rgba(50,55,65,0.4)'; c.lineWidth = 1.2;
      for (let i = 0; i < 10; i++) {
        const y = H * (.1 + i * .09);
        c.beginPath();
        c.moveTo(W * (.1 + rng() * .12), y);
        c.quadraticCurveTo(W * .25, y + H * .02, W * (.18 + rng() * .1), y + H * .06);
        c.stroke();
        c.beginPath();
        c.moveTo(W * (.78 + rng() * .1), y);
        c.quadraticCurveTo(W * .75, y + H * .02, W * (.72 + rng() * .1), y + H * .06);
        c.stroke();
      }
      // 中央奥の氷河雪渓
      c.fillStyle = '#e0e8f0';
      c.beginPath();
      c.moveTo(W * .38, H * .1);
      c.quadraticCurveTo(W * .5, H * .05, W * .62, H * .1);
      c.quadraticCurveTo(W * .58, H * .22, W * .5, H * .26);
      c.quadraticCurveTo(W * .42, H * .22, W * .38, H * .1);
      c.closePath(); c.fill();
      // 吊るされた滝
      c.strokeStyle = 'rgba(230,240,255,0.85)'; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(W * .5, H * .26);
      c.quadraticCurveTo(W * (.5 + Math.sin(t * .6) * .008), H * .5, W * .5, H * .74);
      c.stroke();
      // 小さな湖(ターン)
      c.fillStyle = '#5a7a9a';
      c.beginPath();
      c.ellipse(W * .5, H * .78, W * .18, H * .05, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(220,235,255,0.5)';
      c.beginPath();
      c.ellipse(W * .5, H * .76, W * .1, H * .015, 0, 0, 7); c.fill(); // 滝の映り込み
      // 下部の氷堆石
      for (let i = 0; i < 12; i++) {
        const px = W * (.2 + rng() * .6), py = H * (.82 + rng() * .16);
        c.fillStyle = '#6a7078';
        c.beginPath();
        c.ellipse(px, py, W * (.008 + rng() * .012), H * (.004 + rng() * .006), rng() * .5, 0, 7);
        c.fill();
      }
    } else if (pr === 'dune') {
      // 砂丘: 風紋の砂の曲線+丘稜+遠くの海+マレーグラス
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#c8d8e8'); gr.addColorStop(.35, '#e8d8b0'); gr.addColorStop(1, '#c8a878');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠くの海
      c.fillStyle = '#7a9ab8';
      c.fillRect(0, H * .38, W, H * .07);
      // 大きな砂丘3つ
      c.fillStyle = '#d8b888';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .55);
      c.quadraticCurveTo(W * .25, H * .42, W * .5, H * .58);
      c.quadraticCurveTo(W * .75, H * .7, W, H * .55);
      c.lineTo(W, H); c.closePath(); c.fill();
      c.fillStyle = '#c8a070';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .72);
      c.quadraticCurveTo(W * .3, H * .6, W * .65, H * .78);
      c.quadraticCurveTo(W * .85, H * .9, W, H * .82);
      c.lineTo(W, H); c.closePath(); c.fill();
      // 風紋の筋
      c.strokeStyle = 'rgba(160,120,70,0.4)'; c.lineWidth = 1.2;
      for (let i = 0; i < 22; i++) {
        const y = H * (.55 + i * .02);
        c.beginPath();
        c.moveTo(W * .05, y);
        c.quadraticCurveTo(W * (.3 + Math.sin(i * .8) * .1), y - H * .01, W * .7, y);
        c.stroke();
      }
      // 丘稜のハイライト
      c.strokeStyle = 'rgba(255,230,180,0.6)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, H * .55);
      c.quadraticCurveTo(W * .25, H * .42, W * .5, H * .58);
      c.stroke();
      // マレーグラスの穂
      const rng = L.mulberry32(139);
      for (let i = 0; i < 18; i++) {
        const px = W * (.05 + rng() * .9), py = H * (.6 + rng() * .38);
        c.strokeStyle = '#8a7a50'; c.lineWidth = 1;
        for (let j = 0; j < 4; j++) {
          c.beginPath();
          c.moveTo(px, py);
          c.quadraticCurveTo(px + (j - 1.5) * W * .004, py - H * .025, px + (j - 1.5) * W * .006, py - H * .04);
          c.stroke();
        }
      }
    } else if (pr === 'quarry') {
      // 採石場: 切り出した岩壁+階段状の段+岩石クレーン
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#b8a890'); gr.addColorStop(.4, '#a09070'); gr.addColorStop(1, '#806f55');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(131);
      // 岩壁の段（上から下へ3段）
      const bench = [0.52, 0.68, 0.84];
      for (let s = 0; s < bench.length; s++) {
        const y = H * bench[s];
        c.fillStyle = ['#8a7a60', '#7a6a50', '#6a5a44'][s];
        c.fillRect(0, y, W, H * .16);
        // 段の垂直面の陰影筋
        c.strokeStyle = 'rgba(60,50,35,0.35)'; c.lineWidth = 1;
        for (let x = 0; x < 20; x++) {
          const sx = W * (x / 20) + rng() * W * .03;
          c.beginPath(); c.moveTo(sx, y); c.lineTo(sx - rng() * W * .01, y + H * .14); c.stroke();
        }
      }
      // 石のクレーン(鉄柱+アーム)
      c.strokeStyle = '#4a4038'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(W * .15, H * .52); c.lineTo(W * .15, H * .15); c.stroke();
      c.beginPath(); c.moveTo(W * .15, H * .15); c.lineTo(W * .45, H * .12); c.stroke();
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(W * .45, H * .12); c.lineTo(W * .45, H * .28); c.stroke(); // 吊り下げケーブル
      c.fillStyle = '#5a5048';
      c.fillRect(W * .43, H * .28, W * .04, H * .05); // 吊り岩
      // 散在する岩石
      for (let i = 0; i < 14; i++) {
        const px = W * rng(), py = H * (.86 + rng() * .12);
        c.fillStyle = '#6a5a48';
        c.beginPath();
        c.ellipse(px, py, W * (.01 + rng() * .015), H * (.005 + rng() * .008), rng() * .4, 0, 7);
        c.fill();
      }
    } else if (pr === 'tundra') {
      // ツンドラ: 平坦な地衣の大地+低い太陽+遠くのカリブー+疎らな岩
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#c8b8a0'); gr.addColorStop(.45, '#a89878'); gr.addColorStop(1, '#8a8068');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 低い太陽(地平線近く)
      c.fillStyle = 'rgba(255,220,170,0.9)';
      c.beginPath(); c.arc(W * .7, H * .38, H * .05, 0, 7); c.fill();
      const rng = L.mulberry32(118);
      // 平坦な大地(微妙な起伏)
      c.fillStyle = '#94866a';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .48);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.48 + Math.sin(x * .7) * .015));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 地衣・苔の斑点
      for (let i = 0; i < 60; i++) {
        const px = W * rng(), py = H * (.5 + rng() * .47);
        const cols = ['#7a8a58', '#8a7a50', '#a08858', '#6a7a50'];
        c.fillStyle = cols[Math.floor(rng() * 4)];
        c.globalAlpha = .3 + rng() * .4;
        c.beginPath();
        c.ellipse(px, py, W * .015 * (1 + rng()), H * .006 * (1 + rng()), 0, 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;
      // 疎らな岩
      for (let i = 0; i < 5; i++) {
        const px = W * (.1 + rng() * .8), py = H * (.55 + rng() * .35);
        c.fillStyle = '#7a7468';
        c.beginPath();
        c.ellipse(px, py, W * (.015 + rng() * .02), H * (.008 + rng() * .006), rng() * .5, 0, 7);
        c.fill();
      }
      // 遠くのカリブーの群れ(シルエット)
      c.fillStyle = '#4a4038';
      c.strokeStyle = '#4a4038'; c.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const cx = W * (.12 + i * .14 + rng() * .05);
        const cy = H * (.5 + rng() * .04);
        c.beginPath(); c.ellipse(cx, cy, W * .008, H * .004, 0, 0, 7); c.fill(); // 体
        c.beginPath(); c.moveTo(cx + W * .006, cy - H * .003); c.lineTo(cx + W * .01, cy - H * .01); c.lineTo(cx + W * .013, cy - H * .006); c.stroke(); // 角/首
      }
    } else if (pr === 'wadi') {
      // 涸れ川: 丸石の河床+両岸の崖+遠い砂漠+流木
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e0b880'); gr.addColorStop(.5, '#c89868'); gr.addColorStop(1, '#a88058');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(111);
      // 遠い台地の影
      c.fillStyle = '#b08858';
      c.beginPath();
      c.moveTo(0, H * .38);
      for (let x = 0; x <= 10; x++) {
        c.lineTo(W * x / 10, H * (.38 - Math.sin(x * 1.2) * .05));
      }
      c.lineTo(W, H * .38); c.lineTo(W, H * .44); c.lineTo(0, H * .44);
      c.closePath(); c.fill();
      // 両岸の崖(左右からせり出す)
      c.fillStyle = '#986c44';
      c.beginPath(); // 左岸
      c.moveTo(0, H); c.lineTo(0, H * .5);
      for (let x = 0; x <= 4; x++) {
        c.lineTo(W * x * .06, H * (.5 + x * .02) + Math.sin(x * 2) * H * .02);
      }
      c.lineTo(0, H); c.closePath(); c.fill();
      c.beginPath(); // 右岸
      c.moveTo(W, H); c.lineTo(W, H * .45);
      for (let x = 0; x <= 4; x++) {
        c.lineTo(W - W * x * .07, H * (.45 + x * .03) + Math.sin(x * 1.8) * H * .02);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 河床(中央の窪み)
      c.fillStyle = '#c0a070';
      c.beginPath();
      c.moveTo(0, H);
      c.lineTo(W * .1, H * .55);
      c.quadraticCurveTo(W * .5, H * .5, W * .9, H * .58);
      c.lineTo(W, H);
      c.closePath(); c.fill();
      // 丸石(大小の楕円)
      for (let i = 0; i < 26; i++) {
        const px = W * (.1 + rng() * .8);
        const py = H * (.58 + rng() * .38);
        const s = (.5 + rng()) * (py - H * .5) / (H * .5) + .3;
        c.fillStyle = `rgba(${140 + Math.floor(rng() * 60)},${110 + Math.floor(rng() * 40)},${80 + Math.floor(rng() * 30)},0.85)`;
        c.beginPath();
        c.ellipse(px, py, W * .02 * s, H * .01 * s, rng(), 0, 7);
        c.fill();
      }
      // 流木
      c.strokeStyle = '#6a4a30'; c.lineWidth = 4;
      c.beginPath();
      c.moveTo(W * .55, H * .82);
      c.quadraticCurveTo(W * .65, H * .78, W * .78, H * .84);
      c.stroke();
      c.beginPath(); // 枝
      c.moveTo(W * .66, H * .8);
      c.lineTo(W * .7, H * .75);
      c.stroke();
    } else if (pr === 'saltflat') {
      // 塩原: 亀裂の白い大地+浅い水鏡+遠い山脈+白い空
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8ecf0'); gr.addColorStop(.5, '#d8dde0'); gr.addColorStop(1, '#f0ece4');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(104);
      // 遠い山脈
      c.fillStyle = '#b8c0c8';
      c.beginPath();
      c.moveTo(0, H * .42);
      for (let x = 0; x <= 10; x++) {
        c.lineTo(W * x / 10, H * (.42 - Math.sin(x * 1.4 + 1) * .08));
      }
      c.lineTo(W, H * .42); c.lineTo(W, H * .45); c.lineTo(0, H * .45);
      c.closePath(); c.fill();
      // 白い大地
      c.fillStyle = '#f4f2ea';
      c.fillRect(0, H * .45, W, H * .55);
      // 六角の亀裂パターン
      c.strokeStyle = 'rgba(160,155,140,0.5)'; c.lineWidth = 1;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
          const cx = W * (col / 6 + (row % 2 ? .08 : 0)) + W * .02;
          const cy = H * (.5 + row * .1);
          const s = W * .045 * (1 - row * .08);
          c.beginPath();
          for (let v = 0; v < 6; v++) {
            const va = v * Math.PI / 3 + .5;
            const px = cx + Math.cos(va) * s, py = cy + Math.sin(va) * s * .4;
            v ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.closePath(); c.stroke();
        }
      }
      // 浅い水鏡(空を映す帯)
      for (let i = 0; i < 3; i++) {
        const py = H * (.5 + i * .12);
        c.fillStyle = 'rgba(180,205,220,0.5)';
        c.beginPath();
        c.ellipse(W * (.25 + i * .3), py, W * .12, H * .015, 0, 0, 7);
        c.fill();
        // 山の映り込み
        c.fillStyle = 'rgba(160,170,180,0.35)';
        c.beginPath();
        c.ellipse(W * (.25 + i * .3), py + H * .005, W * .06, H * .005, 0, 0, 7);
        c.fill();
      }
      // 眩しさの光斑
      c.fillStyle = `rgba(255,255,255,${.3 + Math.sin(t * 1.5) * .15})`;
      c.beginPath();
      c.ellipse(W * .6, H * .52, W * .15, H * .03, 0, 0, 7);
      c.fill();
    } else if (pr === 'highland') {
      // 高地牧場: うねる緑の丘+石積みの垣根+点々の羊+大きな空
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8dc'); gr.addColorStop(.55, '#c8d8b8'); gr.addColorStop(1, '#7aa05a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(97);
      // 丘3層
      const hills = ['#88a868', '#6f9450', '#5c8044'];
      for (let h = 0; h < 3; h++) {
        c.fillStyle = hills[h];
        c.beginPath();
        c.moveTo(0, H);
        c.lineTo(0, H * (.48 + h * .12));
        for (let x = 0; x <= 12; x++) {
          c.lineTo(W * x / 12, H * (.48 + h * .12) + Math.sin(x * .9 + h * 2.1) * H * .05);
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
      // 石積みの垣根(丘を越えて蛇行)
      c.strokeStyle = '#8a8a80'; c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, H * .6);
      for (let x = 0; x <= 14; x++) {
        c.lineTo(W * x / 14, H * (.6 + x * .012) + Math.sin(x * .7) * H * .02);
      }
      c.stroke();
      // 石の継ぎ目
      c.strokeStyle = 'rgba(60,60,55,0.4)'; c.lineWidth = 1;
      for (let x = 0; x <= 14; x++) {
        const sx = W * x / 14;
        const sy = H * (.6 + x * .012) + Math.sin(x * .7) * H * .02;
        c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx, sy + 4); c.stroke();
      }
      // 羊(白い点と頭)
      for (let i = 0; i < 8; i++) {
        const sx = W * (.08 + rng() * .85);
        const sy = H * (.55 + rng() * .35);
        c.fillStyle = '#f0f0e8';
        c.beginPath(); c.ellipse(sx, sy, W * .008, H * .005, 0, 0, 7); c.fill();
        c.fillStyle = '#3a3a34';
        c.beginPath(); c.ellipse(sx + W * .008, sy - H * .002, W * .0025, H * .002, 0, 0, 7); c.fill();
      }
      // 流れる雲
      for (let i = 0; i < 3; i++) {
        const cx2 = ((t * .02 + i * .35) % 1.3 - .15) * W;
        c.fillStyle = 'rgba(255,255,255,0.5)';
        c.beginPath();
        c.ellipse(cx2, H * (.1 + i * .08), W * .07, H * .018, 0, 0, 7);
        c.fill();
      }
    } else if (pr === 'delta') {
      // 三角州: 三つ編み状の水路+緑の砂州+飛ぶ鳥+遠い海
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8d0e0'); gr.addColorStop(.5, '#88b8b0'); gr.addColorStop(1, '#c8d0a8');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(91);
      // 緑の大地
      c.fillStyle = '#8aa868';
      c.fillRect(0, H * .4, W, H * .6);
      // 遠い海
      c.fillStyle = '#6a9ab0';
      c.fillRect(0, H * .36, W, H * .05);
      // 三つ編み状の水路(複数の蛇行する流れ)
      c.strokeStyle = '#5a8a98';
      for (let ch = 0; ch < 4; ch++) {
        const lw = 6 + ch * 4;
        c.lineWidth = lw;
        c.beginPath();
        let cx = W * (.15 + ch * .22);
        c.moveTo(cx, H * .4);
        for (let seg = 0; seg < 6; seg++) {
          const ny = H * (.4 + (seg + 1) * .1);
          cx += (rng() - .5) * W * .06 + (seg > 2 ? (ch - 1.5) * W * .02 : 0);
          c.lineTo(cx, Math.min(ny, H * .98));
        }
        c.stroke();
      }
      // 砂州のハイライト
      c.strokeStyle = 'rgba(220,220,180,0.4)'; c.lineWidth = 2;
      for (let ch = 0; ch < 3; ch++) {
        c.beginPath();
        let cx = W * (.2 + ch * .25);
        c.moveTo(cx, H * .5);
        for (let seg = 0; seg < 5; seg++) {
          cx += (rng() - .5) * W * .05;
          c.lineTo(cx, H * (.5 + (seg + 1) * .1));
        }
        c.stroke();
      }
      // 葦の集まり
      for (let i = 0; i < 20; i++) {
        const rx = W * rng(), ry = H * (.55 + rng() * .4);
        c.strokeStyle = '#4a6a3a'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 1, ry - H * (.02 + rng() * .015)); c.stroke();
      }
      // 飛ぶ鳥
      c.strokeStyle = '#3a4a44'; c.lineWidth = 1.5;
      for (let b = 0; b < 3; b++) {
        const bx = W * (.15 + b * .3 + Math.sin(t * .3 + b) * .05);
        const by = H * (.15 + b * .07);
        c.beginPath();
        c.moveTo(bx - W * .012, by);
        c.quadraticCurveTo(bx, by - H * .008 - Math.sin(t * 6 + b) * 3, bx + W * .012, by);
        c.stroke();
      }
    } else if (pr === 'mangrove') {
      // マングローブ: 高根(支柱根)+濁った水+葉の天蓋+水鳥
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#b8d0a8'); gr.addColorStop(.45, '#7a9a78'); gr.addColorStop(1, '#4a6a58');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(84);
      // 天蓋(上部の葉影)
      for (let i = 0; i < 8; i++) {
        c.fillStyle = `rgba(50,90,60,${.5 + rng() * .3})`;
        c.beginPath();
        c.ellipse(W * rng(), H * rng() * .18, W * (.08 + rng() * .06), H * (.05 + rng() * .03), 0, 0, 7);
        c.fill();
      }
      // 濁った水面
      c.fillStyle = '#5a7a68';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .62);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.62 + Math.sin(x * 1.1 + t * .5) * .008));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 水面の反射筋
      c.strokeStyle = 'rgba(200,230,200,0.25)'; c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const wy = H * (.65 + i * .04);
        c.beginPath();
        c.moveTo(W * rng() * .3, wy);
        c.lineTo(W * (.5 + rng() * .5), wy);
        c.stroke();
      }
      // 支柱根(放射状に水に降りる根)
      c.strokeStyle = '#4a3a2a'; c.lineWidth = 3;
      for (let tr = 0; tr < 4; tr++) {
        const tx = W * (.12 + tr * .25 + rng() * .06);
        const ty = H * (.35 + rng() * .1);
        // 幹
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - H * .15); c.stroke();
        for (let r = -3; r <= 3; r++) {
          c.beginPath();
          c.moveTo(tx, ty);
          c.lineTo(tx + r * W * .02, H * .75);
          c.stroke();
        }
        // 根元の葉
        c.fillStyle = '#3a6a44';
        for (let lf = 0; lf < 4; lf++) {
          c.beginPath();
          c.ellipse(tx + rng() * W * .04 - W * .02, ty - H * (.14 + rng() * .1), W * .02, H * .012, rng() * 3, 0, 7);
          c.fill();
        }
      }
      // 水鳥(立っている)
      c.fillStyle = '#e8e8e0';
      const bx = W * .75, by = H * .68;
      c.beginPath(); c.ellipse(bx, by, W * .012, H * .008, 0, 0, 7); c.fill();
      c.strokeStyle = '#e8e8e0'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + H * .02); c.stroke();
      c.strokeStyle = '#e8e8e0';
      c.beginPath(); c.moveTo(bx + W * .008, by - H * .006); c.lineTo(bx + W * .015, by - H * .014); c.stroke(); // 首
    } else if (pr === 'taiga') {
      // タイガ: 遠くの雪峰+針葉樹の林2層+低い太陽+残雪の地面
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#d8e4f0'); gr.addColorStop(.5, '#a8bcd4'); gr.addColorStop(1, '#d0dcd8');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 低い太陽
      c.fillStyle = 'rgba(255,235,190,0.9)';
      c.beginPath(); c.arc(W * .2, H * .3, H * .055, 0, 7); c.fill();
      const rng = L.mulberry32(77);
      // 遠くの雪峰
      c.fillStyle = '#e8ecf0';
      for (let m = 0; m < 3; m++) {
        const mx = W * (m * .35 + .05);
        c.beginPath();
        c.moveTo(mx, H * .45);
        c.lineTo(mx + W * .12, H * (.22 + rng() * .06));
        c.lineTo(mx + W * .24, H * .45);
        c.closePath(); c.fill();
      }
      // 針葉樹の林(遠景=小さく薄く)
      for (let i = 0; i < 22; i++) {
        const tx = W * rng();
        const ty = H * (.45 + rng() * .04);
        c.fillStyle = 'rgba(70,100,90,0.55)';
        c.beginPath();
        c.moveTo(tx, ty); c.lineTo(tx + W * .012, ty - H * .05); c.lineTo(tx + W * .024, ty);
        c.closePath(); c.fill();
      }
      // 残雪の地面
      c.fillStyle = '#e4ecea';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .55);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.55 + Math.sin(x * 1.3) * .02));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 雪の斑点
      for (let i = 0; i < 30; i++) {
        c.fillStyle = `rgba(255,255,255,${.3 + rng() * .4})`;
        c.fillRect(W * rng(), H * (.55 + rng() * .42), W * .008, H * .004);
      }
      // 手前の針葉樹(大きく濃く)
      for (let i = 0; i < 7; i++) {
        const tx = W * (.06 + i * .14 + rng() * .05);
        const ty = H * (.62 + rng() * .25);
        const th = H * (.14 + rng() * .07);
        c.fillStyle = '#33524a';
        c.fillRect(tx + W * .006, ty - th * .3, W * .008, th * .3); // 幹
        for (let l = 0; l < 3; l++) {
          const lw = W * (.045 - l * .012);
          const ly = ty - th * (.3 + l * .28);
          c.beginPath();
          c.moveTo(tx - lw / 2 + W * .01, ly);
          c.lineTo(tx + W * .01, ly - th * .32);
          c.lineTo(tx + lw / 2 + W * .01, ly);
          c.closePath(); c.fill();
        }
        // 枝の積雪
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.beginPath();
        c.ellipse(tx + W * .01, ty - th * .75, W * .016, H * .005, 0, 0, 7);
        c.fill();
      }
    } else if (pr === 'badlands') {
      // バッドランズ: 縞模様の浸食台地+照りつける太陽+疎らな灌木
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8b070'); gr.addColorStop(.5, '#c88858'); gr.addColorStop(1, '#a06848');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 太陽
      c.fillStyle = '#fff0d0';
      c.beginPath(); c.arc(W * .78, H * .16, H * .07, 0, 7); c.fill();
      const rng = L.mulberry32(71);
      // 層状の台地(色帯の積層)
      const bands = ['#c07850', '#b06040', '#d08858', '#a85838', '#c88050'];
      for (let i = 0; i < 4; i++) {
        const ty = H * (.3 + i * .13);
        for (let m = 0; m < 3; m++) {
          const mx = W * (m * .35 + rng() * .1);
          const mw = W * (.18 + rng() * .1);
          c.fillStyle = bands[(i + m) % 5];
          c.fillRect(mx, ty, mw, H * .07);
        }
      }
      // 手前の大きな台地
      c.fillStyle = '#b06844';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .62);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.62 + Math.sin(x * .8) * .025));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 縞筋
      c.strokeStyle = 'rgba(150,80,50,0.6)'; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const sy = H * (.68 + i * .045);
        c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12;
          const py = sy + Math.sin(x * .8 + i) * H * .012;
          x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 灌木
      for (let i = 0; i < 5; i++) {
        const bx = W * (.08 + i * .2 + rng() * .08);
        const by = H * (.72 + rng() * .2);
        c.fillStyle = '#6a7a50';
        for (let b = 0; b < 4; b++) {
          c.beginPath();
          c.ellipse(bx + rng() * W * .012 - W * .006, by - rng() * H * .012, W * .008, H * .005, 0, 0, 7);
          c.fill();
        }
      }
      // 蜃気楼の揺らぎ筋
      c.strokeStyle = `rgba(255,240,210,${.15 + Math.sin(t * 2) * .08})`;
      c.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const hy = H * (.35 + i * .08);
        c.beginPath();
        for (let x = 0; x <= 8; x++) {
          const px = W * x / 8;
          const py = hy + Math.sin(x * 2 + t * 3 + i) * 2;
          x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
    } else if (pr === 'pond') {
      // 池: 睡蓮の葉+広がる波紋+泳ぐ鯉の影+蜻蛉
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#9ec8b8'); gr.addColorStop(.45, '#6a9888'); gr.addColorStop(1, '#3a6860');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(64);
      // 岸(上部の草地)
      c.fillStyle = '#7aa870';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * .12);
      for (let x = 12; x >= 0; x--) {
        c.lineTo(W * x / 12, H * (.12 + Math.sin(x * .9) * .02));
      }
      c.closePath(); c.fill();
      // 広がる波紋
      for (let i = 0; i < 4; i++) {
        const ph = (t * .4 + i * .25) % 1;
        const rx = W * (.15 + i * .23), ry = H * (.55 + (i % 2) * .15);
        c.strokeStyle = `rgba(255,255,255,${(1 - ph) * .35})`;
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(rx, ry, W * (.02 + ph * .12), H * (.008 + ph * .03), 0, 0, 7);
        c.stroke();
      }
      // 泳ぐ鯉の影(深い色の魚影)
      const kx = W * ((t * .06) % 1.4 - .2);
      const ky = H * (.72 + Math.sin(t * .9) * .03);
      c.fillStyle = 'rgba(20,40,38,0.5)';
      c.beginPath();
      c.ellipse(kx, ky, W * .05, H * .014, Math.sin(t * 1.5) * .08, 0, 7);
      c.fill();
      // 睡蓮の葉と花
      for (let i = 0; i < 5; i++) {
        const lx = W * (.08 + i * .2 + rng() * .06);
        const ly = H * (.5 + rng() * .4);
        c.fillStyle = '#3f7a55';
        c.beginPath();
        c.ellipse(lx, ly, W * .035, H * .012, rng() * .4, .3, Math.PI * 2 - .3);
        c.fill();
        if (i % 2 === 0) {
          c.fillStyle = '#f0b8c8';
          for (let p = 0; p < 5; p++) {
            const pa = p * 1.257;
            c.beginPath();
            c.ellipse(lx + Math.cos(pa) * W * .008, ly - H * .012 + Math.sin(pa) * H * .004, W * .006, H * .004, pa, 0, 7);
            c.fill();
          }
        }
      }
      // 蜻蛉
      const dx = W * (.2 + .6 * Math.abs(Math.sin(t * .5)));
      const dy = H * (.35 + Math.sin(t * 3) * .04);
      c.strokeStyle = 'rgba(60,80,90,0.8)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(dx - W * .015, dy); c.lineTo(dx + W * .015, dy); c.stroke();
      c.fillStyle = 'rgba(120,180,200,0.6)';
      c.beginPath(); c.ellipse(dx, dy - H * .008, W * .02, H * .005, 0, 0, 7); c.fill();
    } else if (pr === 'tide') {
      // 干潟: 濡れた砂面+水溜りの映り込み+遠い海+干潟の鳥
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c0d0'); gr.addColorStop(.4, '#c8d0c8'); gr.addColorStop(1, '#a89878');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠い海
      c.fillStyle = '#7a9ab0';
      c.fillRect(0, H * .38, W, H * .05);
      const rng = L.mulberry32(58);
      // 濡れた砂(緩い波紋筋)
      c.fillStyle = '#b0a088';
      c.fillRect(0, H * .43, W, H * .57);
      c.strokeStyle = 'rgba(140,125,95,0.5)'; c.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const wy = H * (.46 + i * .05);
        c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12;
          const py = wy + Math.sin(x * 1.1 + i * 2) * H * .006;
          x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 水溜り(空を映す楕円)
      for (let i = 0; i < 4; i++) {
        const px = W * (.15 + i * .22);
        const py = H * (.52 + rng() * .3);
        c.fillStyle = 'rgba(190,215,230,0.7)';
        c.beginPath();
        c.ellipse(px, py, W * (.05 + rng() * .04), H * (.012 + rng() * .01), 0, 0, 7);
        c.fill();
        // きらめき
        c.fillStyle = `rgba(255,255,255,${.3 + Math.sin(t * 2 + i) * .2})`;
        c.beginPath();
        c.ellipse(px - W * .01, py - H * .004, W * .012, H * .003, 0, 0, 7);
        c.fill();
      }
      // 干潟の鳥(くちばしを突くシギ)
      c.fillStyle = '#4a4a44';
      for (const [bx, by] of [[.3, .58], [.68, .65]]) {
        const peck = Math.max(0, Math.sin(t * 2.5 + bx * 9)) * .3;
        c.beginPath(); c.ellipse(W * bx, H * by, W * .012, H * .008, 0, 0, 7); c.fill(); // 体
        c.strokeStyle = '#4a4a44'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(W * bx, H * by + H * .008); c.lineTo(W * bx, H * by + H * .025); c.stroke(); // 脚
        c.beginPath(); c.moveTo(W * bx + W * .01, H * by - H * .004); // 首+嘴
        c.lineTo(W * (bx + .018), H * (by - .01) + peck * H * .03);
        c.stroke();
      }
    } else if (pr === 'grove') {
      // 木立ちの小径: 幹の列+枝葉の天蓋+木漏れ日の光筋
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c898'); gr.addColorStop(.45, '#88a878'); gr.addColorStop(1, '#5a7850');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(17);
      // 天蓋(枝葉の塊)
      c.fillStyle = '#3a6038';
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.ellipse(W * rng(), H * (.05 + rng() * .15), W * (.1 + rng() * .08), H * (.05 + rng() * .04), 0, 0, 7);
        c.fill();
      }
      // 幹の列(奥→手前)
      for (let row = 0; row < 2; row++) {
        const n = 5 + row * 2;
        const tw = W * (.012 + row * .01);
        for (let i = 0; i < n; i++) {
          const tx = W * (.05 + i * .9 / n) + (row % 2) * W * .06;
          const ty0 = H * (.1 - row * .05), ty1 = H * (.8 + row * .1);
          c.fillStyle = row ? '#5a4838' : '#6a5848';
          c.fillRect(tx - tw / 2, ty0, tw, ty1 - ty0);
        }
      }
      // 小径(中央へ収束する砂地)
      c.fillStyle = '#b8a888';
      c.beginPath();
      c.moveTo(W * .42, H); c.lineTo(W * .48, H * .5);
      c.lineTo(W * .52, H * .5); c.lineTo(W * .58, H);
      c.closePath(); c.fill();
      // 木漏れ日の光筋(斜めの半透明帯)
      c.fillStyle = 'rgba(255,245,200,0.22)';
      for (let i = 0; i < 4; i++) {
        const lx = W * (.2 + i * .2) + Math.sin(t * .3 + i) * W * .01;
        c.beginPath();
        c.moveTo(lx, H * .1); c.lineTo(lx + W * .05, H * .1);
        c.lineTo(lx + W * .14, H); c.lineTo(lx + W * .09, H);
        c.closePath(); c.fill();
      }
      // 舞う葉
      for (let i = 0; i < 6; i++) {
        const lx = W * ((rng() + t * .03) % 1);
        const ly = H * ((rng() + t * .05) % 1);
        c.fillStyle = '#88aa55';
        c.beginPath(); c.ellipse(lx, ly, W * .006, H * .004, rng() * 3 + t, 0, 7); c.fill();
      }
    } else if (pr === 'brook') {
      // 渓流: 流れる水+飛び石+岸の緑+水しぶき
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#90b8a8'); gr.addColorStop(.5, '#78a890'); gr.addColorStop(1, '#5a8068');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(49);
      // 岸(上下の緑)
      c.fillStyle = '#4a7048';
      c.fillRect(0, 0, W, H * .3);
      c.fillRect(0, H * .82, W, H * .18);
      // 草むら
      c.strokeStyle = '#5a8850'; ctx.lineWidth = 2;
      for (let i = 0; i < 25; i++) {
        const gx = W * rng();
        const gy = rng() > .5 ? H * (.26 + rng() * .04) : H * (.8 + rng() * .04);
        c.beginPath(); c.moveTo(gx, gy);
        c.quadraticCurveTo(gx + 2, gy - H * .02, gx + 4, gy - H * .03);
        c.stroke();
      }
      // 水流(揺れる白線の帯)
      c.fillStyle = '#6a9aa8';
      c.fillRect(0, H * .3, W, H * .52);
      c.strokeStyle = 'rgba(230,245,250,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const wy = H * (.33 + i * .06);
        c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12;
          const py = wy + Math.sin(x * 1.2 + t * 2.5 + i) * H * .008;
          x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 飛び石
      c.fillStyle = '#7a7268';
      for (let i = 0; i < 5; i++) {
        const sx = W * (.15 + i * .18);
        const sy = H * (.5 + Math.sin(i * 1.9) * .12);
        c.beginPath();
        c.ellipse(sx, sy, W * .045, H * .02, .1 * i, 0, 7);
        c.fill();
        // 石周りの白いしぶき
        c.strokeStyle = 'rgba(240,250,255,0.6)'; ctx.lineWidth = 1.5;
        c.beginPath();
        c.arc(sx, sy, W * .05, Math.PI * .2, Math.PI * .8);
        c.stroke();
      }
    } else if (pr === 'moor') {
      // ムーア: 霧の荒れ地+ヒースの紫+立石
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#98a0a8'); gr.addColorStop(.5, '#a8a898'); gr.addColorStop(1, '#6a7058');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(64);
      // うねる荒れ地(暗い起伏)
      c.fillStyle = '#5a6250';
      c.beginPath();
      c.moveTo(0, H * .62);
      for (let i = 0; i <= 8; i++)
        c.lineTo(W * i / 8, H * (.58 + Math.sin(i * 1.7) * .06));
      c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // ヒース(紫の点群)
      for (let i = 0; i < 50; i++) {
        const px = W * rng();
        const py = H * (.6 + rng() * .35);
        c.fillStyle = `hsla(${285 + rng() * 30},30%,${40 + rng() * 20}%,0.7)`;
        c.beginPath(); c.ellipse(px, py, W * .007, H * .006, 0, 0, 7); c.fill();
      }
      // 立石(先細りの岩3本)
      c.fillStyle = '#6a6a66';
      for (const [sx, sy, ss] of [[.25, .5, .05], [.55, .47, .065], [.8, .52, .04]]) {
        c.beginPath();
        c.moveTo(W * sx - W * ss * .8, H * (sy + .15));
        c.lineTo(W * sx - W * ss * .5, H * sy);
        c.quadraticCurveTo(W * sx, H * (sy - .03), W * sx + W * ss * .5, H * sy);
        c.lineTo(W * sx + W * ss * .8, H * (sy + .15));
        c.closePath(); c.fill();
      }
      // 流れる霧(半透明の帯)
      for (let i = 0; i < 3; i++) {
        const mx = W * (((t * .02 + i * .35) % 1.3) - .15);
        c.fillStyle = 'rgba(220,225,225,0.25)';
        c.beginPath();
        c.ellipse(mx, H * (.3 + i * .12), W * .3, H * .04, 0, 0, 7);
        c.fill();
      }
    } else if (pr === 'onsen') {
      // 温泉: 立ち上る湯気+岩で縁どられた湯+遠景の山
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8b8c8'); gr.addColorStop(.4, '#c8d0d8'); gr.addColorStop(1, '#98a088');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(88);
      // 遠景の山(霧の稜線)
      c.fillStyle = 'rgba(120,140,130,0.5)';
      c.beginPath();
      c.moveTo(0, H * .45);
      for (let i = 0; i <= 6; i++)
        c.lineTo(W * i / 6, H * (.32 + (i % 2) * .08 - Math.sin(i * 2.1) * .03));
      c.lineTo(W, H * .45); c.closePath(); c.fill();
      // 湯面(乳白色の青)
      c.fillStyle = '#b8d0d8';
      c.beginPath();
      c.ellipse(W * .5, H * .78, W * .42, H * .16, 0, 0, 7);
      c.fill();
      // 湯気(揺れて昇る半透明の帯)
      for (let i = 0; i < 5; i++) {
        const sx = W * (.25 + i * .13);
        const rise = (t * .1 + i * .2) % 1;
        c.fillStyle = `rgba(255,255,255,${.35 * (1 - rise)})`;
        c.beginPath();
        c.ellipse(sx + Math.sin(t * 1.2 + i) * W * .02, H * (.75 - rise * .35),
          W * (.02 + rise * .03), H * .03, 0, 0, 7);
        c.fill();
      }
      // 岩の縁取り
      c.fillStyle = '#7a7268';
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        const rx = W * .5 + Math.cos(a) * W * .44;
        const ry = H * .78 + Math.sin(a) * H * .17;
        if (ry > H * .7) {
          c.beginPath();
          c.ellipse(rx, ry, W * (.03 + rng() * .02), H * (.02 + rng() * .015), rng(), 0, 7);
          c.fill();
        }
      }
    } else if (pr === 'orchard') {
      // 果樹園: 青空+整列するリンゴの木+落ちる実
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#88c0e0'); gr.addColorStop(.55, '#c8e0d8'); gr.addColorStop(1, '#7a9a55');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(55);
      // 木の列(奥→手前2段)
      for (let row = 0; row < 2; row++) {
        const ty = H * (.45 + row * .2);
        const n = 4 + row * 2;
        const ts = W * (.05 + row * .025);
        for (let i = 0; i < n; i++) {
          const tx = W * (.08 + i * .84 / n) + (row % 2) * W * .09;
          const sway = Math.sin(t * .9 + i * 1.3 + row) * W * .003;
          // 幹
          c.fillStyle = '#6a4a30';
          c.fillRect(tx - ts * .08, ty, ts * .16, ts * 1.4);
          // 樹冠(重なる円)
          c.fillStyle = '#4a7a38';
          c.beginPath(); c.arc(tx + sway, ty - ts * .3, ts * .7, 0, 7); ctx.fill();
          c.beginPath(); c.arc(tx - ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); ctx.fill();
          c.beginPath(); c.arc(tx + ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); ctx.fill();
          // 実(赤い丸)
          c.fillStyle = '#d84038';
          for (let a = 0; a < 5; a++) {
            const ax = tx + sway + (rng() - .5) * ts * 1.1;
            const ay = ty - ts * .35 + (rng() - .5) * ts * .7;
            c.beginPath(); c.arc(ax, ay, ts * .09, 0, 7); c.fill();
          }
        }
      }
      // 地面の草と落ちた実
      c.fillStyle = '#6a8a48'; c.fillRect(0, H * .82, W, H * .18);
      c.fillStyle = '#c03830';
      for (let i = 0; i < 8; i++) {
        const ax = W * rng();
        const ay = H * (.84 + rng() * .12);
        c.beginPath(); c.arc(ax, ay, W * .006, 0, 7); c.fill();
      }
      // 落ちていく実(アニメ)
      const fall = (t * .15) % 1;
      c.fillStyle = '#d84038';
      c.beginPath();
      c.arc(W * .3, H * (.4 + fall * .45), W * .008, 0, 7);
      c.fill();
    } else if (pr === 'cosmos') {
      // コスモス畑: 秋の空+揺れるコスモス(白/ピンク)+飛ぶチョウ
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8ab8d8'); gr.addColorStop(.5, '#c8d8e0'); gr.addColorStop(1, '#789a58');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 秋の薄い雲
      const rng = L.mulberry32(33);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.ellipse(W * (i * .28 + .1), H * (.1 + (i % 2) * .08), W * .1, H * .015, .05, 0, 7);
        c.fill();
      }
      // コスモスの群生(2段)
      for (let row = 0; row < 2; row++) {
        const ry = H * (.62 + row * .18);
        const n = 7 + row * 3;
        const fs = W * (.014 + row * .01);
        for (let i = 0; i < n; i++) {
          const fx = W * (.05 + i * .9 / n) + (row % 2) * W * .05;
          const sway = Math.sin(t * 1.5 + i * .7 + row) * W * .006;
          // 細い茎と葉
          c.strokeStyle = '#5a7a42'; ctx.lineWidth = Math.max(1, fs * .1);
          ctx.beginPath(); ctx.moveTo(fx, ry + fs * 3); ctx.lineTo(fx + sway, ry); ctx.stroke();
          // 8弁の花(白・ピンク・濃紅)
          const cx = fx + sway, cy = ry;
          const col = ['#f4e8f0', '#e8a0c0', '#d06090'][Math.floor(rng() * 3)];
          c.fillStyle = col;
          for (let p = 0; p < 8; p++) {
            const a = p * .785;
            c.beginPath();
            c.ellipse(cx + Math.cos(a) * fs, cy + Math.sin(a) * fs, fs * .55, fs * .28, a, 0, 7);
            c.fill();
          }
          c.fillStyle = '#e8c040';
          c.beginPath(); c.arc(cx, cy, fs * .35, 0, 7); c.fill();
        }
      }
      // 舞うチョウ
      for (let i = 0; i < 2; i++) {
        const bx = W * ((i * .4 + t * .05) % 1.1) - W * .05;
        const by = H * (.4 + Math.sin(t * 2.2 + i * 3) * .12 + i * .15);
        const flap = .5 + Math.abs(Math.sin(t * 8 + i)) * .5;
        c.fillStyle = 'rgba(240,240,255,0.85)';
        c.beginPath(); c.ellipse(bx - W * .006, by, W * .008, H * .007 * flap, -.4, 0, 7); c.fill();
        c.beginPath(); c.ellipse(bx + W * .006, by, W * .008, H * .007 * flap, .4, 0, 7); c.fill();
      }
    } else if (pr === 'sunflowers') {
      // ひまわり畑: 青空+太陽+整列するひまわり+蜂
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#7ab8e0'); gr.addColorStop(.55, '#b8d8e8'); gr.addColorStop(1, '#88a860');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 太陽
      c.fillStyle = '#fff2c8';
      c.beginPath(); c.arc(W * .82, H * .14, W * .06, 0, 7); c.fill();
      const rng = L.mulberry32(121);
      // ひまわりの列(奥→手前3段)
      for (let row = 0; row < 3; row++) {
        const ry = H * (.55 + row * .15);
        const n = 6 + row * 2;
        const fs = W * (.02 + row * .012); // 花サイズ
        for (let i = 0; i < n; i++) {
          const fx = W * (.06 + i * .88 / n) + (row % 2) * W * .04;
          const sway = Math.sin(t * 1.2 + i + row) * W * .004;
          // 茎
          c.strokeStyle = '#4a7038'; ctx.lineWidth = Math.max(1.5, fs * .12);
          ctx.beginPath(); ctx.moveTo(fx, ry + fs * 2.2); ctx.lineTo(fx + sway, ry); ctx.stroke();
          // 花弁(円周上の楕円)
          const cx = fx + sway, cy = ry;
          c.fillStyle = '#f0b428';
          for (let p = 0; p < 10; p++) {
            const a = p * .628;
            c.beginPath();
            c.ellipse(cx + Math.cos(a) * fs, cy + Math.sin(a) * fs, fs * .45, fs * .2, a, 0, 7);
            c.fill();
          }
          // 中心
          c.fillStyle = '#6a4520';
          c.beginPath(); c.arc(cx, cy, fs * .55, 0, 7); c.fill();
        }
      }
      // 飛ぶ蜂
      for (let i = 0; i < 3; i++) {
        const bx = W * ((i * .3 + t * .04) % 1);
        const by = H * (.35 + Math.sin(t * 2 + i * 2) * .1 + i * .1);
        c.fillStyle = '#e0c040';
        c.beginPath(); c.ellipse(bx, by, W * .008, H * .006, 0, 0, 7); c.fill();
        c.fillStyle = '#38302a';
        c.beginPath(); c.ellipse(bx - W * .004, by, W * .002, H * .005, 0, 0, 7); c.fill();
      }
    } else if (pr === 'wisteria') {
      // 藤棚: 上から垂れる花房+棚の梁+淡い空
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#c8c2e0'); gr.addColorStop(.45, '#d8d4e8'); gr.addColorStop(1, '#b8c4a0');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(77);
      // 棚の梁
      c.fillStyle = '#6a5a48';
      c.fillRect(0, H * .1, W, H * .025);
      c.fillRect(0, H * .16, W, H * .02);
      for (let i = 0; i < 7; i++)
        c.fillRect(W * i / 6 - W * .008, H * .08, W * .016, H * .12);
      // 垂れる花房(小さい楕円の積み重ね)
      for (let i = 0; i < 14; i++) {
        const fx = W * (.05 + rng() * .9);
        const sway = Math.sin(t * .8 + i) * W * .008;
        const len = H * (.18 + rng() * .25);
        const petals = 5 + Math.floor(rng() * 4);
        const hue = rng() > .3 ? 265 : 290; // 紫系/ピンク系
        for (let k = 0; k < petals; k++) {
          const py = H * .14 + len * k / petals;
          const pw = W * .028 * (1 - k / petals * .55);
          c.fillStyle = `hsla(${hue + rng() * 20},45%,${72 - k * 2}%,0.85)`;
          c.beginPath();
          c.ellipse(fx + sway * k / petals, py, pw, H * .022, 0, 0, 7);
          c.fill();
        }
        // 房の先端
        c.fillStyle = `hsla(${hue},50%,65%,0.9)`;
        c.beginPath();
        c.ellipse(fx + sway, H * .14 + len, W * .008, H * .012, 0, 0, 7);
        c.fill();
      }
      // 地面の緑と散った花びら
      c.fillStyle = '#9aa888'; c.fillRect(0, H * .85, W, H * .15);
      c.fillStyle = 'rgba(190,170,220,0.5)';
      for (let i = 0; i < 20; i++) {
        const px = W * rng(), py = H * (.86 + rng() * .12);
        c.beginPath(); c.ellipse(px, py, W * .005, H * .004, rng() * 3, 0, 7); c.fill();
      }
    } else if (pr === 'zen') {
      // 枯山水: 砂紋(同心波)+石組+遠景の陰
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#d8cfb8'); gr.addColorStop(.6, '#cfc4a8'); gr.addColorStop(1, '#c0b294');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 砂紋: 石を中心に同心円の梳き目
      const rng = L.mulberry32(41);
      const rocks = [[.3, .68, .07], [.68, .55, .055], [.52, .82, .045]];
      c.strokeStyle = 'rgba(140,125,95,0.55)'; c.lineWidth = 1.5;
      for (const [rx, ry, rr] of rocks) {
        for (let k = 1; k <= 6; k++) {
          const rad = rr * (1 + k * .45);
          const wob = Math.sin(t * .4 + k) * .01; // 微かな揺らぎ
          c.beginPath();
          c.ellipse(W * rx, H * ry, W * rad, H * rad * .35, wob, 0, 7);
          c.stroke();
        }
      }
      // 直線の梳き目(上段)
      for (let i = 0; i < 8; i++) {
        const yy = H * (.22 + i * .045);
        c.beginPath();
        c.moveTo(W * .08, yy);
        c.quadraticCurveTo(W * .5, yy + Math.sin(t * .3 + i) * H * .004, W * .92, yy);
        c.stroke();
      }
      // 石(苔むした岩)
      for (const [rx, ry, rr] of rocks) {
        const g = Math.round(90 + rng() * 25);
        c.fillStyle = `rgb(${g - 15},${g + 5},${g - 30})`;
        c.beginPath();
        c.ellipse(W * rx, H * ry - H * rr * .5, W * rr * .9, H * rr * .8, 0, 0, 7);
        c.fill();
        c.fillStyle = 'rgba(80,110,60,0.5)'; // 苔
        c.beginPath();
        c.ellipse(W * rx - W * rr * .25, H * ry - H * rr * .7, W * rr * .45, H * rr * .35, 0, 0, 7);
        c.fill();
      }
      // 遠景: 砂利の縁
      c.fillStyle = 'rgba(110,95,70,0.35)';
      for (let i = 0; i < 40; i++) {
        const px = W * rng(), py = H * (.12 + rng() * .1);
        c.fillRect(px, py, W * .006, W * .004);
      }
    } else if (pr === 'storm') {
      // 嵐: 暗雲+雨筋+時折の稲妻
      const flash = Math.max(0, Math.sin(t * .9)) ** 14; // 稀に光る
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2a3038'); gr.addColorStop(.6, '#1a2028'); gr.addColorStop(1, '#10141a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(95);
      // 暗雲(大きな楕円の塊)
      c.fillStyle = '#343c46';
      for (let i = 0; i < 6; i++) {
        const cx = W * (i / 5) + Math.sin(t * .2 + i) * W * .02;
        c.beginPath();
        c.ellipse(cx, H * (.12 + (i % 2) * .06), W * .14, H * .05, 0, 0, 7);
        c.fill();
      }
      // 稲妻(フラッシュ時にジグザグ)
      if (flash > .05) {
        c.strokeStyle = `rgba(255,250,200,${flash})`;
        c.lineWidth = 3;
        const lx = W * (.3 + (Math.floor(t * .9 / Math.PI) % 3) * .2);
        c.beginPath(); c.moveTo(lx, H * .15);
        let ly = H * .15;
        const rng2 = L.mulberry32(7);
        for (let i = 0; i < 5; i++) {
          ly += H * .09;
          c.lineTo(lx + (rng2() - .5) * W * .08, ly);
        }
        c.stroke();
        // 空全体のフラッシュ
        c.fillStyle = `rgba(200,210,255,${flash * .15})`;
        c.fillRect(0, 0, W, H);
      }
      // 雨筋(斜めの線)
      c.strokeStyle = 'rgba(160,180,210,0.4)'; c.lineWidth = 1.5;
      for (let i = 0; i < 60; i++) {
        const rx = ((rng() + t * .7) % 1) * W * 1.2 - W * .1;
        const ry = ((rng() + t * .7) % 1) * H;
        c.beginPath();
        c.moveTo(rx, ry); c.lineTo(rx - W * .012, ry + H * .035);
        c.stroke();
      }
      // 海面のうねり
      c.fillStyle = '#16202a';
      c.fillRect(0, H * .85, W, H * .15);
      c.strokeStyle = 'rgba(180,200,220,0.3)'; c.lineWidth = 2;
      c.beginPath();
      for (let x = 0; x <= 10; x++) {
        const px = W * x / 10, py = H * .85 + Math.sin(x * 1.4 + t * 2) * H * .015;
        x ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    } else if (pr === 'observatory') {
      // 天文台: 天の川の夜空+白いドーム+開いたスリット
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0a0e24'); gr.addColorStop(.6, '#1a2040'); gr.addColorStop(1, '#2a2a3a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(89);
      // 星
      for (let i = 0; i < 120; i++) {
        const sx = rng() * W, sy = rng() * H * .65;
        const tw2 = .3 + .7 * Math.abs(Math.sin(t * 1.5 + i * 1.7));
        c.fillStyle = `rgba(235,240,255,${tw2})`;
        c.fillRect(sx, sy, 1.5, 1.5);
      }
      // 天の川(斜めの淡い帯)
      c.save();
      c.translate(W * .5, H * .3); c.rotate(-.4);
      const mg = c.createLinearGradient(0, -H * .08, 0, H * .08);
      mg.addColorStop(0, 'rgba(180,190,230,0)');
      mg.addColorStop(.5, 'rgba(180,190,230,0.22)');
      mg.addColorStop(1, 'rgba(180,190,230,0)');
      c.fillStyle = mg;
      c.fillRect(-W, -H * .08, W * 2, H * .16);
      c.restore();
      // 山稜
      c.fillStyle = '#141826';
      c.beginPath(); c.moveTo(0, H * .7);
      for (let i = 0; i <= 8; i++) c.lineTo(W * i / 8, H * .7 - (i % 2) * H * .06 - rng() * H * .03);
      c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 天文台ドーム
      const ox = W * .5, oy = H * .68;
      c.fillStyle = '#c8ccd4';
      c.fillRect(ox - W * .07, oy, W * .14, H * .1); // 基部
      c.beginPath();
      c.ellipse(ox, oy, W * .075, W * .055, 0, Math.PI, 0);
      c.closePath(); c.fill();
      // スリット(開いた望遠鏡口+光)
      c.fillStyle = '#2a2a3a';
      c.save(); c.translate(ox, oy); c.rotate(-.3);
      c.fillRect(-W * .012, -W * .055, W * .024, W * .05);
      c.restore();
      // スリットから差す光
      c.fillStyle = 'rgba(160,190,255,0.25)';
      c.save(); c.translate(ox, oy); c.rotate(-.3);
      c.beginPath();
      c.moveTo(-W * .012, -W * .05); c.lineTo(W * .012, -W * .05);
      c.lineTo(W * .03, -H * .3); c.lineTo(-W * .03, -H * .3);
      c.closePath(); c.fill();
      c.restore();
    } else if (pr === 'prairie') {
      // 大草原: 空+起伏する草+風車+遠くの丸い干し草
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#9ec8e0'); gr.addColorStop(.55, '#c8d8a0'); gr.addColorStop(1, '#8aa860');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(79);
      // 丘の起伏2層
      for (const [py, pc] of [[.62, '#7a9a52'], [.74, '#6a8a44']]) {
        c.fillStyle = pc;
        c.beginPath(); c.moveTo(0, H * py);
        for (let x = 0; x <= 10; x++) {
          c.lineTo(W * x / 10, H * py - Math.sin(x * .9 + py * 10) * H * .05);
        }
        c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      }
      // 風車(回転する羽根)
      const wx = W * .72, wy = H * .55;
      c.strokeStyle = '#5a4a38'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(wx - W * .015, wy + H * .18); c.lineTo(wx, wy); c.lineTo(wx + W * .015, wy + H * .18); c.stroke();
      const wa = t * 1.2;
      for (let i = 0; i < 4; i++) {
        const a = wa + i * Math.PI / 2;
        c.beginPath();
        c.moveTo(wx, wy);
        c.lineTo(wx + Math.cos(a) * W * .05, wy + Math.sin(a) * W * .05);
        c.stroke();
        // 羽根の板
        c.fillStyle = '#8a7a62';
        c.save(); c.translate(wx + Math.cos(a) * W * .04, wy + Math.sin(a) * W * .04); c.rotate(a);
        c.fillRect(0, -3, W * .02, 6); c.restore();
      }
      // 干し草ロール
      for (let i = 0; i < 4; i++) {
        const hx2 = W * (.1 + rng() * .5), hy2 = H * (.78 + (i % 2) * .08);
        c.fillStyle = '#c8a850';
        c.beginPath(); c.ellipse(hx2, hy2, W * .025, H * .03, 0, 0, 7); c.fill();
        c.strokeStyle = '#a08038'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(hx2, hy2, W * .015, H * .018, 0, 0, 7); c.stroke();
      }
      // 揺れる草穂
      c.strokeStyle = '#9ab858'; c.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const gx = rng() * W, gy = H * (.8 + rng() * .18);
        const sway = Math.sin(t * 1.5 + i) * 4;
        c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + sway, gy - H * .03); c.stroke();
      }
    } else if (pr === 'lagoon') {
      // ラグーン: 青空+浅瀬の縞+椰子の小島+飛ぶ海鳥
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8ec8e8'); gr.addColorStop(.45, '#5ab0d0'); gr.addColorStop(1, '#2a88a8');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(61);
      // 太陽
      c.fillStyle = 'rgba(255,240,190,0.9)';
      c.beginPath(); c.arc(W * .8, H * .18, H * .06, 0, 7); c.fill();
      // 浅瀬の縞(透明度の異なる水色帯)
      for (let i = 0; i < 5; i++) {
        c.fillStyle = `rgba(120,210,220,${.15 + i * .05})`;
        const wy = H * (.58 + i * .08);
        c.beginPath();
        c.moveTo(0, wy);
        for (let x = 0; x <= 10; x++) {
          c.lineTo(W * x / 10, wy + Math.sin(x * 1.2 + i * 2 + t) * H * .012);
        }
        c.lineTo(W, wy + H * .1); c.lineTo(0, wy + H * .1);
        c.closePath(); c.fill();
      }
      // 小島(砂州+椰子)
      const ix = W * .3, iy = H * .6;
      c.fillStyle = '#e8d8a0';
      c.beginPath(); c.ellipse(ix, iy, W * .09, H * .02, 0, 0, 7); c.fill();
      // 幹
      c.strokeStyle = '#7a5a38'; c.lineWidth = W * .008;
      c.beginPath(); c.moveTo(ix, iy); c.quadraticCurveTo(ix - W * .01, iy - H * .1, ix - W * .03, iy - H * .14); c.stroke();
      // 葉
      c.strokeStyle = '#3a7a40'; c.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const fa = i * 1.05 + Math.sin(t * .5) * .05;
        c.beginPath();
        c.moveTo(ix - W * .03, iy - H * .14);
        c.quadraticCurveTo(ix - W * .03 + Math.cos(fa) * W * .04, iy - H * .14 + Math.sin(fa) * W * .015,
          ix - W * .03 + Math.cos(fa) * W * .07, iy - H * .14 + Math.sin(fa) * W * .05 + H * .02);
        c.stroke();
      }
      // 海鳥
      c.strokeStyle = '#f0f4f8'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const bx = ((rng() + t * .04) % 1) * W;
        const by = H * (.15 + (i % 2) * .08) + Math.sin(t * 2 + i) * H * .02;
        c.beginPath();
        c.moveTo(bx - 8, by); c.quadraticCurveTo(bx - 3, by - 5, bx, by);
        c.quadraticCurveTo(bx + 3, by - 5, bx + 8, by);
        c.stroke();
      }
    } else if (pr === 'cliff') {
      // 断崖海岸: 空+海+切り立つ崖+飛ぶカモメ
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8e0'); gr.addColorStop(.5, '#6890b0'); gr.addColorStop(1, '#3a5a74');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(93);
      // 海(下半分)+波線
      c.fillStyle = '#2a4a62';
      c.fillRect(0, H * .6, W, H * .4);
      c.strokeStyle = 'rgba(220,235,245,0.5)'; c.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const wy = H * (.63 + i * .05);
        c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12;
          const py = wy + Math.sin(x * 1.3 + i + t * 2) * H * .008;
          x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 断崖(左側、層状の岩)
      c.fillStyle = '#6a5844';
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(W * .3, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(W * (.3 - i * .02 + (rng() - .5) * .04), H * i * .12);
      }
      c.lineTo(W * .12, H); c.lineTo(0, H);
      c.closePath(); c.fill();
      // 岩の層筋
      c.strokeStyle = 'rgba(50,40,30,0.4)'; c.lineWidth = 2;
      for (let i = 1; i < 6; i++) {
        c.beginPath();
        c.moveTo(0, H * i * .14);
        c.lineTo(W * (.28 - i * .02), H * i * .14);
        c.stroke();
      }
      // 崖上の草
      c.fillStyle = '#5a7a48';
      c.beginPath();
      c.ellipse(W * .15, H * .02, W * .16, H * .03, 0, 0, 7);
      c.fill();
      // カモメ
      c.strokeStyle = '#f0f4f8'; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const bx = ((rng() + t * .05) % 1) * W;
        const by = H * (.2 + (i % 3) * .1) + Math.sin(t * 2 + i) * H * .025;
        c.beginPath();
        c.moveTo(bx - 9, by); c.quadraticCurveTo(bx - 4, by - 6, bx, by);
        c.quadraticCurveTo(bx + 4, by - 6, bx + 9, by);
        c.stroke();
      }
    } else if (pr === 'bayou') {
      // 湿地: 昏い空+水面+糸杉+垂れ下がる苔+ホタル
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#4a5a48'); gr.addColorStop(.55, '#2a3a30'); gr.addColorStop(1, '#1a2820');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(87);
      // 水面(下半分)
      c.fillStyle = '#2a4038';
      c.fillRect(0, H * .62, W, H * .38);
      // 水面の光の揺らぎ
      c.strokeStyle = 'rgba(160,200,170,0.3)'; c.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const wy = H * (.65 + i * .04);
        const off = Math.sin(t * 1.5 + i) * W * .03;
        const wx = W * rng() + off;
        c.beginPath();
        c.moveTo(wx - W * .1, wy);
        c.lineTo(wx + W * .1, wy);
        c.stroke();
      }
      // 糸杉の幹と膝根
      for (let i = 0; i < 4; i++) {
        const tx = W * (.12 + i * .26);
        const tw = W * (.02 + rng() * .015);
        c.fillStyle = '#3a3028';
        c.beginPath();
        c.moveTo(tx - tw * 1.8, H * .7); // 広がる根元
        c.lineTo(tx - tw, H * .2);
        c.lineTo(tx + tw, H * .2);
        c.lineTo(tx + tw * 1.8, H * .7);
        c.closePath(); c.fill();
        // 水面より下の反射(簡易)
        c.fillStyle = 'rgba(58,48,40,0.35)';
        c.fillRect(tx - tw * 1.2, H * .7, tw * 2.4, H * .1);
        // 垂れ下がる苔
        c.strokeStyle = '#5a7a52'; c.lineWidth = 3;
        for (let m = 0; m < 4; m++) {
          const mx = tx - tw + m * tw * .7;
          const ml = H * (.08 + rng() * .12);
          c.beginPath();
          c.moveTo(mx, H * .25);
          c.quadraticCurveTo(mx + 4, H * .25 + ml * .6, mx + Math.sin(t + m) * 6, H * .25 + ml);
          c.stroke();
        }
      }
      // ホタル
      for (let i = 0; i < 12; i++) {
        const fx = ((rng() + Math.sin(t * .4 + i * 2) * .05) % 1 + 1) % 1 * W;
        const fy = H * (.3 + (i % 5) * .12) + Math.sin(t * 1.2 + i) * H * .05;
        const fl = .4 + .6 * Math.abs(Math.sin(t * 2 + i * 1.3));
        c.fillStyle = `rgba(220,240,140,${fl})`;
        c.beginPath(); c.arc(fx, fy, 2.5, 0, 7); c.fill();
      }
    } else if (pr === 'alps') {
      // アルプス: 雪の峰々+麓の山小屋+流れる雲
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#7ab0d8'); gr.addColorStop(.55, '#c8dce8'); gr.addColorStop(1, '#6a8a6a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(77);
      // 雲
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 4; i++) {
        const cx = ((rng() + t * .01) % 1) * W;
        const cy = H * (.1 + (i % 2) * .08);
        c.beginPath();
        c.ellipse(cx, cy, W * .07, H * .018, 0, 0, 7);
        c.ellipse(cx + W * .04, cy - 4, W * .05, H * .015, 0, 0, 7);
        c.fill();
      }
      // 峰々(2層)
      for (const [py, pc, amp] of [[.62, '#8a9aa8', .18], [.68, '#5a6a78', .14]]) {
        c.fillStyle = pc;
        c.beginPath(); c.moveTo(0, H * py);
        for (let i = 0; i <= 8; i++) {
          const px = W * i / 8;
          const peak = H * (py - amp * (i % 2 ? 1 : .3) * (0.7 + rng() * .6));
          c.lineTo(px, peak);
        }
        c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      }
      // 雪(峰の上部を白く)
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 4; i++) {
        const sx = W * (.12 + i * .22);
        c.beginPath();
        c.moveTo(sx - W * .04, H * .55); c.lineTo(sx, H * .47);
        c.lineTo(sx + W * .04, H * .55); c.closePath(); c.fill();
      }
      // 麓の草原
      c.fillStyle = '#5a8a52';
      c.fillRect(0, H * .72, W, H * .28);
      // 山小屋
      c.fillStyle = '#6a4a30';
      c.fillRect(W * .62, H * .74, W * .07, H * .05);
      c.fillStyle = '#4a3020';
      c.beginPath();
      c.moveTo(W * .6, H * .74); c.lineTo(W * .655, H * .7); c.lineTo(W * .71, H * .74);
      c.closePath(); c.fill();
      // 窓の灯り
      c.fillStyle = '#f8d878';
      c.fillRect(W * .635, H * .755, W * .012, H * .015);
      c.fillRect(W * .665, H * .755, W * .012, H * .015);
    } else if (pr === 'mesa') {
      // メサ大地: 黄昏空+平頂の台地+飛ぶ鳥
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8a868'); gr.addColorStop(.5, '#c87a50'); gr.addColorStop(1, '#7a4030');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,220,150,0.9)';
      c.beginPath(); c.arc(W * .5, H * .42, H * .07, 0, 7); c.fill();
      const rng = L.mulberry32(69);
      // 平頂の台地3基(遠近)
      const mesas = [
        [W * .18, H * .55, W * .28, '#8a5040'],
        [W * .75, H * .58, W * .22, '#9a5a46'],
        [W * .48, H * .66, W * .4, '#6a3a2c'],
      ];
      for (const [mx, my, mw, mc] of mesas) {
        c.fillStyle = mc;
        c.beginPath();
        c.moveTo(mx - mw * .5, H);
        c.lineTo(mx - mw * .5, my + H * .02);
        c.quadraticCurveTo(mx - mw * .48, my, mx - mw * .4, my);
        c.lineTo(mx + mw * .4, my);
        c.quadraticCurveTo(mx + mw * .48, my, mx + mw * .5, my + H * .02);
        c.lineTo(mx + mw * .5, H);
        c.closePath(); c.fill();
        // 横筋(地層)
        c.strokeStyle = 'rgba(255,200,150,0.25)'; c.lineWidth = 2;
        for (let g = 1; g < 4; g++) {
          c.beginPath();
          c.moveTo(mx - mw * .5, my + (H - my) * g / 4);
          c.lineTo(mx + mw * .5, my + (H - my) * g / 4);
          c.stroke();
        }
      }
      // 飛ぶ鳥
      c.strokeStyle = '#3a2620'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const bx = ((rng() + t * .04) % 1) * W;
        const by = H * (.2 + (i % 2) * .1) + Math.sin(t * 2 + i) * H * .02;
        c.beginPath();
        c.moveTo(bx - 8, by); c.quadraticCurveTo(bx - 3, by - 5, bx, by);
        c.quadraticCurveTo(bx + 3, by - 5, bx + 8, by);
        c.stroke();
      }
    } else if (pr === 'rainforest') {
      // 熱帯雨林: 霧+巨大な葉+木の幹+木漏れ日
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#7ab880'); gr.addColorStop(.5, '#3a7a50'); gr.addColorStop(1, '#1a4030');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(63);
      // 木漏れ日(斜めの光筋)
      c.save();
      c.globalAlpha = .15; c.fillStyle = '#e8f8c0';
      for (let i = 0; i < 4; i++) {
        const lx = W * (.1 + i * .25) + Math.sin(t * .3 + i) * W * .02;
        c.beginPath();
        c.moveTo(lx, 0); c.lineTo(lx + W * .06, 0);
        c.lineTo(lx + W * .18, H); c.lineTo(lx + W * .1, H);
        c.closePath(); c.fill();
      }
      c.restore();
      // 木の幹
      for (let i = 0; i < 5; i++) {
        const tx = W * (i / 4.5) + W * .04;
        const tw = W * (.03 + rng() * .03);
        c.fillStyle = '#4a3828';
        c.beginPath();
        c.moveTo(tx - tw, H);
        c.quadraticCurveTo(tx - tw * .6, H * .5, tx - tw * 1.2, 0);
        c.lineTo(tx + tw * 1.2, 0);
        c.quadraticCurveTo(tx + tw * .6, H * .5, tx + tw, H);
        c.closePath(); c.fill();
      }
      // 巨大な葉(前景と中景)
      for (let i = 0; i < 10; i++) {
        const lx = rng() * W, ly = H * (.3 + rng() * .5);
        const ls = W * (.05 + rng() * .1), la = rng() * Math.PI * 2;
        const dark = rng() > .5;
        c.fillStyle = dark ? '#2a6a40' : '#4a9a58';
        c.beginPath();
        c.ellipse(lx, ly + Math.sin(t * .8 + i) * 3, ls, ls * .35, la, 0, 7);
        c.fill();
        // 葉脈
        c.strokeStyle = 'rgba(20,50,30,0.5)'; c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(lx - Math.cos(la) * ls, ly - Math.sin(la) * ls);
        c.lineTo(lx + Math.cos(la) * ls, ly + Math.sin(la) * ls);
        c.stroke();
      }
      // 霧
      c.fillStyle = 'rgba(180,220,190,0.12)';
      c.fillRect(0, H * .55, W, H * .45);
    } else if (pr === 'lavender') {
      // ラベンダー畑: 夕空+紫の列+蜂+遠景の木
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8c8d8'); gr.addColorStop(.5, '#b890c8'); gr.addColorStop(1, '#6a4a78');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,220,180,0.85)';
      c.beginPath(); c.arc(W * .7, H * .25, H * .08, 0, 7); c.fill();
      const rng = L.mulberry32(57);
      // 遠景の木(プロヴァンス風の糸杉)
      c.fillStyle = '#4a5038';
      for (let i = 0; i < 4; i++) {
        const tx = W * (.15 + rng() * .7);
        c.beginPath();
        c.ellipse(tx, H * .5, W * .012, H * .05, 0, 0, 7);
        c.fill();
      }
      // ラベンダーの列(紫の帯+穂の点)
      for (let row = 0; row < 5; row++) {
        const ry = H * (.58 + row * .085);
        c.fillStyle = ['#8a5aa8', '#7a4a98', '#9a6ab8'][row % 3];
        c.beginPath();
        c.moveTo(0, ry + H * .03);
        for (let x = 0; x <= 16; x++) c.lineTo(W * x / 16, ry + Math.sin(x * .7 + row) * 4);
        c.lineTo(W, ry + H * .09); c.lineTo(0, ry + H * .09);
        c.closePath(); c.fill();
        // 穂
        for (let i = 0; i < 40 - row * 5; i++) {
          const hx2 = rng() * W;
          c.fillStyle = '#a878c8';
          c.fillRect(hx2, ry + rng() * H * .04 - 4, 2.5, 5 + row);
        }
      }
      // 飛ぶ蜂
      c.fillStyle = '#e8c830';
      for (let i = 0; i < 5; i++) {
        const bx = ((rng() + t * .05 * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W;
        const by = H * (.55 + (i % 3) * .12) + Math.sin(t * 3 + i * 2) * H * .03;
        c.beginPath(); c.ellipse(bx, by, W * .006, H * .004, 0, 0, 7); c.fill();
      }
    } else if (pr === 'vineyard') {
      // 葡萄畑: 秋空+ぶどう棚の列+房+遠山
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8d8b0'); gr.addColorStop(.5, '#c8b080'); gr.addColorStop(1, '#8a7048');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,225,160,0.85)';
      c.beginPath(); c.arc(W * .25, H * .28, H * .08, 0, 7); c.fill();
      // 遠山
      c.fillStyle = 'rgba(110,95,70,0.5)';
      c.beginPath(); c.moveTo(0, H * .5);
      for (let i = 0; i <= 10; i++) c.lineTo(W * i / 10, H * .5 - Math.sin(i * 1.9) * H * .04);
      c.lineTo(W, H * .6); c.lineTo(0, H * .6); c.closePath(); c.fill();
      const rng = L.mulberry32(43);
      // 地面
      c.fillStyle = '#9a8054';
      c.fillRect(0, H * .62, W, H * .38);
      // 棚の列(斜めに遠近)
      for (let row = 0; row < 4; row++) {
        const ry = H * (.64 + row * .09);
        const n = 6 - row;
        for (let i = 0; i <= n; i++) {
          const vx = W * (i / n + row * .04);
          // 支柱
          c.strokeStyle = '#5a4830'; c.lineWidth = 2 + row;
          c.beginPath(); c.moveTo(vx, ry); c.lineTo(vx, ry - H * (.06 + row * .01)); c.stroke();
          // 葉の塊
          c.fillStyle = ['#6a8a3a', '#7a9a44', '#5a7a34'][(i + row) % 3];
          c.beginPath(); c.ellipse(vx, ry - H * (.07 + row * .01), W * .025 + row * W * .008, H * .018, 0, 0, 7); c.fill();
          // ぶどう房
          if (rng() > .4) {
            c.fillStyle = '#6a3a7a';
            for (let g = 0; g < 4; g++) {
              c.beginPath();
              c.arc(vx + (rng() - .5) * W * .015, ry - H * (.05 + row * .01) + g * 4, 3 + row, 0, 7);
              c.fill();
            }
          }
        }
      }
    } else if (pr === 'coral') {
      // 珊瑚礁: 深い海+光の筋+珊瑚+魚群
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0a3a5a'); gr.addColorStop(.5, '#0a4a6a'); gr.addColorStop(1, '#063048');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 光の筋
      c.fillStyle = 'rgba(150,220,255,0.1)';
      for (let i = 0; i < 4; i++) {
        c.save(); c.translate(W * (.2 + i * .2), 0); c.rotate(.3);
        c.fillRect(-W * .015, 0, W * .03, H);
        c.restore();
      }
      const rng = L.mulberry32(91);
      // 海底
      c.fillStyle = '#c8b088';
      c.fillRect(0, H * .85, W, H * .15);
      // 珊瑚(枝状と円形)
      for (let i = 0; i < 5; i++) {
        const cx = W * (.1 + rng() * .8), cy = H * (.86 + rng() * .1);
        const cc = ['#e07070', '#e8a050', '#c860a0', '#60a8b0'][i % 4];
        c.strokeStyle = cc; c.lineWidth = W * .008;
        for (let b = 0; b < 4; b++) {
          const ba = -Math.PI / 2 + (b - 1.5) * .5;
          c.beginPath();
          c.moveTo(cx, cy);
          c.quadraticCurveTo(cx + Math.cos(ba) * W * .04, cy + Math.sin(ba) * H * .1,
            cx + Math.cos(ba) * W * .06, cy + Math.sin(ba) * H * .14);
          c.stroke();
        }
        c.fillStyle = cc;
        c.beginPath(); c.arc(cx + W * .05, cy - H * .02, W * .02, 0, 7); c.fill();
      }
      // 魚群(同じ方向へゆらぎながら泳ぐ)
      c.fillStyle = 'rgba(255,200,120,0.8)';
      for (let i = 0; i < 10; i++) {
        const fx = ((rng() + t * .04) % 1.2 - .1) * W;
        const fy = H * (.25 + (i % 3) * .15) + Math.sin(t * 2 + i) * H * .02;
        c.beginPath();
        c.ellipse(fx, fy, W * .012, H * .008, 0, 0, 7); c.fill();
        c.beginPath();
        c.moveTo(fx - W * .014, fy); c.lineTo(fx - W * .022, fy - H * .008); c.lineTo(fx - W * .022, fy + H * .008);
        c.closePath(); c.fill();
      }
    } else if (pr === 'geyser') {
      // 間欠泉: 曇り空+岩場+噴き上がる水柱+湯気
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#b8c4cc'); gr.addColorStop(.55, '#8a9aa4'); gr.addColorStop(1, '#5a6a72');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(67);
      // 地面(岩場)
      c.fillStyle = '#7a7068';
      c.fillRect(0, H * .72, W, H * .28);
      // 岩
      c.fillStyle = '#6a6058';
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.ellipse(rng() * W, H * (.74 + rng() * .2), W * (.02 + rng() * .04), H * (.015 + rng() * .02), 0, 0, 7);
        c.fill();
      }
      // 噴水の口(中央)
      const gx = W * .45, gy = H * .74;
      c.fillStyle = '#5a5048';
      c.beginPath(); c.ellipse(gx, gy, W * .09, H * .025, 0, 0, 7); c.fill();
      // 水柱(噴き上がりの周期)
      const erupt = Math.max(0, Math.sin(t * 1.2)) ** .5;
      if (erupt > .05) {
        c.fillStyle = 'rgba(220,235,245,0.85)';
        const colH = H * .5 * erupt;
        c.beginPath();
        c.moveTo(gx - W * .02, gy);
        c.quadraticCurveTo(gx - W * .04 * erupt, gy - colH * .7, gx - W * .015, gy - colH);
        c.quadraticCurveTo(gx, gy - colH * 1.1, gx + W * .015, gy - colH);
        c.quadraticCurveTo(gx + W * .04 * erupt, gy - colH * .7, gx + W * .02, gy);
        c.closePath(); c.fill();
        // 頂の飛沫
        for (let i = 0; i < 8; i++) {
          const a = rng() * Math.PI;
          c.fillStyle = 'rgba(230,242,250,0.8)';
          c.beginPath();
          c.arc(gx + Math.cos(a) * W * .05 * erupt * (rng() + .3), gy - colH - rng() * H * .06, W * .008, 0, 7);
          c.fill();
        }
      }
      // 湯気(ゆらぐ)
      c.fillStyle = 'rgba(230,235,240,0.35)';
      for (let i = 0; i < 5; i++) {
        const sx = gx + Math.sin(t * .6 + i * 2) * W * .05 + (rng() - .5) * W * .1;
        c.beginPath();
        c.ellipse(sx, gy - H * (.05 + i * .07), W * (.04 + i * .015), H * (.02 + i * .008), 0, 0, 7);
        c.fill();
      }
    } else if (pr === 'pagoda') {
      // 五重塔: 夕暮れ+5層の屋根の塔+月+遠山
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#3a3050'); gr.addColorStop(.5, '#80506a'); gr.addColorStop(1, '#c07858');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 月
      c.fillStyle = 'rgba(255,240,210,0.85)';
      c.beginPath(); c.arc(W * .2, H * .2, H * .07, 0, 7); c.fill();
      // 遠山
      c.fillStyle = 'rgba(50,40,60,0.6)';
      c.beginPath(); c.moveTo(0, H * .6);
      for (let i = 0; i <= 10; i++) c.lineTo(W * i / 10, H * .6 - Math.sin(i * 1.3 + 2) * H * .05);
      c.lineTo(W, H * .7); c.lineTo(0, H * .7); c.closePath(); c.fill();
      // 五重塔(中央右寄り)
      const px = W * .62, pbase = H * .85;
      for (let i = 0; i < 5; i++) {
        const ty = pbase - H * .115 * i;
        const tw = W * (.11 - i * .012);
        // 階の柱
        c.fillStyle = '#4a3028';
        c.fillRect(px - tw * .32, ty - H * .075, tw * .64, H * .075);
        // 窓の灯り
        c.fillStyle = '#ffd890';
        c.fillRect(px - tw * .1, ty - H * .06, tw * .2, H * .035);
        // 屋根(反った三角形)
        c.fillStyle = '#2a2030';
        c.beginPath();
        c.moveTo(px - tw * .55, ty - H * .075);
        c.quadraticCurveTo(px, ty - H * .115, px + tw * .55, ty - H * .075);
        c.lineTo(px + tw * .5, ty - H * .045);
        c.lineTo(px - tw * .5, ty - H * .045);
        c.closePath(); c.fill();
      }
      // 相輪(頂の飾り)
      c.strokeStyle = '#d8b050'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(px, pbase - H * .575); c.lineTo(px, pbase - H * .68); c.stroke();
      c.fillStyle = '#d8b050';
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.ellipse(px, pbase - H * (.6 + i * .025), W * .014, H * .006, 0, 0, 7); c.fill();
      }
    } else if (pr === 'wheatfield') {
      // 麦畑: 夕空+風に揺れる金色の麦+遠景の木
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#f0d8a0'); gr.addColorStop(.5, '#e8b870'); gr.addColorStop(1, '#b88840');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,230,160,0.9)';
      c.beginPath(); c.arc(W * .75, H * .3, H * .09, 0, 7); c.fill();
      // 遠景の木
      const rng = L.mulberry32(83);
      c.fillStyle = '#6a5838';
      for (let i = 0; i < 5; i++) {
        const tx = rng() * W;
        c.beginPath(); c.ellipse(tx, H * .58, W * .02, H * .035, 0, 0, 7); c.fill();
        c.fillRect(tx - 2, H * .58, 4, H * .03);
      }
      // 麦畑(3層: 奥→手前ほど濃い)
      for (let ly = 0; ly < 3; ly++) {
        const baseY = H * (.62 + ly * .12);
        const shade = ['#c8a050', '#b88840', '#a07030'][ly];
        c.fillStyle = shade;
        c.fillRect(0, baseY, W, H * .4);
        // 穂(風で揺れる短い線)
        c.strokeStyle = ['#e0c070', '#d0b060', '#c0a050'][ly];
        c.lineWidth = 2;
        const n = 60 - ly * 15;
        for (let i = 0; i < n; i++) {
          const hx2 = (i / n + (rng() * .01)) * W;
          const hy2 = baseY + rng() * H * .1;
          const sw = Math.sin(t * 1.5 + hx2 * .01 + ly) * W * .006;
          c.beginPath();
          c.moveTo(hx2, hy2 + H * .02);
          c.quadraticCurveTo(hx2 + sw * .5, hy2 + H * .01, hx2 + sw, hy2);
          c.stroke();
        }
      }
    } else if (pr === 'bridge') {
      // 橋: 夕暮れ+吊り橋シルエット(主塔2基+ケーブル)+川
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#f0a868'); gr.addColorStop(.5, '#c06068'); gr.addColorStop(1, '#4a4058');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 太陽
      c.fillStyle = 'rgba(255,210,140,0.9)';
      c.beginPath(); c.arc(W * .5, H * .52, H * .08, 0, 7); c.fill();
      // 川
      c.fillStyle = '#50384a';
      c.fillRect(0, H * .68, W, H * .32);
      c.strokeStyle = 'rgba(255,180,120,0.35)'; c.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const wy = H * (.72 + i * .03);
        c.beginPath(); c.moveTo(0, wy);
        for (let x = 1; x <= 8; x++) c.lineTo(W * x / 8, wy + Math.sin(x * 2 + t + i) * 2);
        c.stroke();
      }
      // 主塔2基
      c.fillStyle = '#2a2230';
      for (const tx of [W * .25, W * .75]) {
        c.fillRect(tx - W * .012, H * .3, W * .024, H * .42);
        c.fillRect(tx - W * .02, H * .34, W * .04, H * .015);
        c.fillRect(tx - W * .02, H * .5, W * .04, H * .015);
      }
      // メインケーブル(放物線)
      c.strokeStyle = '#2a2230'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, H * .55);
      c.quadraticCurveTo(W * .25, H * .28, W * .5, H * .55);
      c.quadraticCurveTo(W * .75, H * .28, W, H * .55);
      c.stroke();
      // ハンガーロープ
      c.lineWidth = 1.5;
      for (let i = 1; i < 16; i++) {
        const fx = W * i / 16;
        const cy = i < 8
          ? H * .55 - (1 - Math.abs(i - 4) / 4) * H * .24
          : H * .55 - (1 - Math.abs(i - 12) / 4) * H * .24;
        c.beginPath(); c.moveTo(fx, cy); c.lineTo(fx, H * .6); c.stroke();
      }
      // 床版
      c.fillRect(0, H * .6, W, H * .03);
      // 橋の灯り
      c.fillStyle = '#ffd890';
      for (let i = 0; i < 9; i++) {
        c.beginPath(); c.arc(W * (.05 + i * .11), H * .585, 3, 0, 7); c.fill();
      }
    } else if (pr === 'terraces') {
      // 棚田: 朝霧の空+段々の水田(緑と水面)+遠山
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#dfe8e0'); gr.addColorStop(.55, '#a8c0a8'); gr.addColorStop(1, '#5a7a58');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠山
      c.fillStyle = 'rgba(90,110,95,0.5)';
      c.beginPath(); c.moveTo(0, H * .45);
      for (let i = 0; i <= 10; i++) c.lineTo(W * i / 10, H * .45 - Math.sin(i * 1.7) * H * .06);
      c.lineTo(W, H * .5); c.lineTo(W, H * .6); c.lineTo(0, H * .6); c.closePath(); c.fill();
      const rng = L.mulberry32(59);
      // 段々の水田(緑と交互の水面帯)
      for (let i = 0; i < 7; i++) {
        const ty = H * (.5 + i * .07), th = H * .055;
        const water = i % 3 === 0;
        c.fillStyle = water ? '#9ec8d8' : ['#6a9a58', '#7aaa62', '#5a8a50'][i % 3];
        c.beginPath();
        c.moveTo(0, ty + Math.sin(i * 2) * 4);
        for (let x = 0; x <= 16; x++) c.lineTo(W * x / 16, ty + Math.sin(x * .8 + i * 1.3) * 5);
        c.lineTo(W, ty + th); c.lineTo(0, ty + th); c.closePath(); c.fill();
        // 畦の線
        c.strokeStyle = 'rgba(60,80,50,0.5)'; c.lineWidth = 2;
        c.beginPath();
        for (let x = 0; x <= 16; x++) {
          const px = W * x / 16, py = ty + th + Math.sin(x * .8 + i * 1.3) * 5;
          x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 苗の点
      c.fillStyle = 'rgba(220,240,200,0.7)';
      for (let i = 0; i < 40; i++) {
        const ty = H * (.55 + Math.floor(rng() * 6) * .07);
        c.fillRect(rng() * W, ty + rng() * H * .04, 2, 3);
      }
    } else if (pr === 'harbor') {
      // 港: 朝焼け+灯台+帆船+波立つ海
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8b890'); gr.addColorStop(.5, '#c87878'); gr.addColorStop(1, '#586878');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 太陽
      c.fillStyle = 'rgba(255,220,160,0.9)';
      c.beginPath(); c.arc(W * .3, H * .5, H * .09, 0, 7); c.fill();
      const rng = L.mulberry32(71);
      // 海
      c.fillStyle = '#4a6a84';
      c.fillRect(0, H * .62, W, H * .38);
      // 波線
      c.strokeStyle = 'rgba(255,220,180,0.4)'; c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const wy = H * (.64 + i * .028);
        c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = ((x / 12 + t * .02 * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W;
          x ? c.lineTo(px, wy + Math.sin(x + t + i) * 3) : c.moveTo(px, wy);
        }
        c.stroke();
      }
      // 灯台(縞模様+灯り)
      c.fillStyle = '#e8e0d0';
      c.fillRect(W * .78, H * .32, W * .035, H * .3);
      c.fillStyle = '#c84040';
      for (let i = 0; i < 3; i++) c.fillRect(W * .78, H * (.34 + i * .1), W * .035, H * .05);
      c.fillStyle = '#ffe8a0';
      c.beginPath(); c.arc(W * .7975, H * .3, H * .025, 0, 7); c.fill();
      // 灯りの光線(ゆっくり揺れる)
      c.fillStyle = 'rgba(255,240,180,0.25)';
      c.save(); c.translate(W * .7975, H * .3); c.rotate(Math.sin(t * .5) * .3);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(W * .25, -H * .04); c.lineTo(W * .25, H * .04);
      c.closePath(); c.fill(); c.restore();
      // 帆船
      const bx = ((rng() + t * .03) % 1.2 - .1) * W, by = H * .7;
      c.fillStyle = '#5a4434';
      c.beginPath();
      c.moveTo(bx - W * .03, by); c.lineTo(bx + W * .03, by);
      c.lineTo(bx + W * .02, by + H * .02); c.lineTo(bx - W * .02, by + H * .02);
      c.closePath(); c.fill();
      c.fillStyle = '#f0ece0';
      c.beginPath();
      c.moveTo(bx, by - H * .06); c.lineTo(bx, by); c.lineTo(bx + W * .028, by);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(bx, by - H * .06); c.lineTo(bx, by); c.lineTo(bx - W * .022, by);
      c.closePath(); c.fill();
    } else if (pr === 'moon') {
      // 月面: 暗い空+地球+クレーターの灰色地表
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0a0a12'); gr.addColorStop(.75, '#101018'); gr.addColorStop(1, '#181820');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(97);
      // 星
      c.fillStyle = '#fff';
      for (let i = 0; i < 60; i++) {
        c.fillRect(rng() * W, rng() * H * .6, 1.2, 1.2);
      }
      // 地球(青い丸+白い雲筋)
      c.fillStyle = '#3a6ac8';
      c.beginPath(); c.arc(W * .8, H * .18, H * .1, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = H * .012;
      c.beginPath(); c.arc(W * .8, H * .18, H * .1, -.6, .9); c.stroke();
      // 地表
      c.fillStyle = '#8a8a92';
      c.fillRect(0, H * .76, W, H * .24);
      // 起伏線
      c.strokeStyle = '#6a6a72'; c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i <= 20; i++) {
        const px = W * i / 20, py = H * .76 + Math.sin(i * 2.1) * H * .015;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
      // クレーター
      for (let i = 0; i < 7; i++) {
        const crx = rng() * W, cry = H * (.8 + rng() * .15), crr = W * (.015 + rng() * .03);
        c.fillStyle = '#6e6e76';
        c.beginPath(); c.ellipse(crx, cry, crr, crr * .45, 0, 0, 7); c.fill();
        c.strokeStyle = '#a8a8b0'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(crx, cry - 1, crr, crr * .45, 0, Math.PI, 0); c.stroke();
      }
    } else if (pr === 'sakura') {
      // 桜並木: 淡い空 + 桜の木(ピンクの樹冠) + 散る花びら + 地面
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e8ecf4'); gr.addColorStop(.6, '#c8d0e0'); gr.addColorStop(1, '#98a4b8');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(37);
      // 地面(芝+花びら)
      c.fillStyle = '#7a9a6a';
      c.fillRect(0, H * .8, W, H * .2);
      c.fillStyle = 'rgba(255,200,215,0.6)';
      for (let i = 0; i < 30; i++) {
        c.beginPath();
        c.ellipse(rng() * W, H * (.8 + rng() * .18), W * .006, W * .003, rng() * 3, 0, 7);
        c.fill();
      }
      // 桜の木3本(幹+ピンクの塊)
      for (const [tx, th] of [[W * .15, .45], [W * .5, .52], [W * .85, .42]]) {
        const ty = H * .82;
        c.fillStyle = '#5a4030';
        c.fillRect(tx - W * .007, ty - H * th * .55, W * .014, H * th * .55);
        for (let b = 0; b < 10; b++) {
          c.fillStyle = ['#f0b8cc', '#e8a0bc', '#f5ccd8'][Math.floor(rng() * 3)];
          c.beginPath();
          c.arc(tx + (rng() - .5) * W * .12, ty - H * th * (.5 + rng() * .45), W * (.025 + rng() * .03), 0, 7);
          c.fill();
        }
      }
      // 舞う花びら
      c.fillStyle = 'rgba(255,210,225,0.9)';
      for (let i = 0; i < 16; i++) {
        const px = ((rng() + t * .06 * (0.4 + rng() * .6)) % 1) * W;
        const py = (rng() + .1 * Math.sin(t * 1.5 + i)) * H;
        c.save(); c.translate(px, py); c.rotate(t * 1.5 + i);
        c.beginPath(); c.ellipse(0, 0, W * .004, W * .0025, 0, 0, 7); c.fill();
        c.restore();
      }
    } else if (pr === 'ruins') {
      // 遺跡: 黄昏 + 崩れた石柱 + アーチ + 蔦
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#d8a878'); gr.addColorStop(.55, '#a87858'); gr.addColorStop(1, '#584838');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,215,150,0.8)';
      c.beginPath(); c.arc(W * .5, H * .45, H * .12, 0, 7); c.fill();
      const rng = L.mulberry32(51);
      // 地面
      c.fillStyle = '#6a5a44';
      c.fillRect(0, H * .78, W, H * .22);
      // 石柱(高さの違う4本、2本は欠けている)
      const colW = W * .045;
      for (let i = 0; i < 4; i++) {
        const cx = W * (.18 + i * .2), ch = H * (.28 + rng() * .25);
        c.fillStyle = '#8a8078';
        c.fillRect(cx - colW / 2, H * .78 - ch, colW, ch);
        // 柱頭
        c.fillRect(cx - colW * .7, H * .78 - ch - H * .02, colW * 1.4, H * .02);
        // 欠けた角
        if (i % 2) {
          c.fillStyle = gr;
          c.beginPath();
          c.moveTo(cx - colW / 2, H * .78 - ch);
          c.lineTo(cx + colW / 2, H * .78 - ch + H * .04);
          c.lineTo(cx + colW / 2, H * .78 - ch);
          c.closePath(); c.fill();
        }
        // 蔦(緑の曲線)
        c.strokeStyle = 'rgba(80,120,50,0.7)'; c.lineWidth = 3;
        c.beginPath();
        c.moveTo(cx - colW / 2, H * .78);
        c.quadraticCurveTo(cx - colW, H * .78 - ch * .5, cx, H * .78 - ch);
        c.stroke();
      }
      // 倒れた柱
      c.save(); c.translate(W * .6, H * .9); c.rotate(.12);
      c.fillStyle = '#7a7068';
      c.fillRect(0, -H * .03, W * .25, H * .06);
      c.restore();
    } else if (pr === 'glacier') {
      // 氷河: 白みがかった空 + 氷山 + 氷の水面 + 光る稜線
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#c8dce8'); gr.addColorStop(.5, '#8ab4cc'); gr.addColorStop(1, '#4a7a9a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(19);
      // 遠景の氷山2つ(白い尖り)
      c.fillStyle = 'rgba(230,240,248,0.9)';
      for (const [ix, ih] of [[W * .2, .3], [W * .75, .38]]) {
        c.beginPath();
        c.moveTo(ix - W * .12, H * .72);
        c.lineTo(ix - W * .05, H * .72 - H * ih * .5);
        c.lineTo(ix, H * .72 - H * ih);
        c.lineTo(ix + W * .07, H * .72 - H * ih * .4);
        c.lineTo(ix + W * .12, H * .72);
        c.closePath(); c.fill();
      }
      // 水面(氷青色)
      c.fillStyle = '#3a6a86';
      c.fillRect(0, H * .72, W, H * .28);
      // 浮氷
      c.fillStyle = 'rgba(220,235,245,0.85)';
      for (let i = 0; i < 8; i++) {
        const fx = rng() * W, fy = H * (.74 + rng() * .2);
        c.beginPath();
        c.ellipse(fx, fy, W * (.015 + rng() * .03), H * .012, 0, 0, 7);
        c.fill();
      }
      // きらめく水面の光
      c.strokeStyle = 'rgba(220,240,255,0.4)'; c.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const wx = rng() * W, wy = H * (.74 + rng() * .24);
        const tw = .5 + .5 * Math.sin(t * 2 + i);
        c.globalAlpha = .2 + .4 * tw;
        c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + W * .02, wy); c.stroke();
      }
      c.globalAlpha = 1;
    } else if (pr === 'fjord') {
      // フィヨルド: 冷たい空 + 切り立つ山壁 + 静かな水面
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8c8d8'); gr.addColorStop(.5, '#6a94a8'); gr.addColorStop(1, '#3a5a6e');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(87);
      // 左右の山壁(切り立つギザギザ)
      for (const [x0, s] of [[0, 1], [W, -1]]) {
        c.fillStyle = s > 0 ? '#3e5a52' : '#4a6a5e';
        c.beginPath();
        c.moveTo(x0, H);
        c.lineTo(x0, H * .15);
        let vx = 0;
        while (vx < W * .32) {
          vx += W * (.05 + rng() * .07);
          c.lineTo(x0 + s * vx, H * (.15 + rng() * .3));
        }
        c.lineTo(x0 + s * W * .35, H);
        c.closePath(); c.fill();
      }
      // 雪の稜線
      c.fillStyle = 'rgba(240,245,250,0.8)';
      c.beginPath();
      c.moveTo(0, H * .15); c.lineTo(W * .1, H * .2); c.lineTo(W * .05, H * .24);
      c.lineTo(0, H * .22); c.closePath(); c.fill();
      // 水面(下3割、穏やかな横線)
      c.fillStyle = '#4a7a8e';
      c.fillRect(0, H * .7, W, H * .3);
      c.strokeStyle = 'rgba(200,230,240,0.35)'; c.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const wy = H * (.72 + rng() * .25);
        const wx = rng() * W * .7, wl = W * (.05 + rng() * .12);
        c.beginPath();
        c.moveTo(wx + Math.sin(t + i) * 5, wy); c.lineTo(wx + wl, wy);
        c.stroke();
      }
    } else if (pr === 'autumn') {
      // 紅葉: 淡い秋空 + 紅葉の木々 + 舞う紅葉 + 落ち葉の地面
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#d8e0e8'); gr.addColorStop(.5, '#c8b890'); gr.addColorStop(1, '#9a7048');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(23);
      // 地面(落ち葉のじゅうたん)
      c.fillStyle = '#8a5a30';
      c.fillRect(0, H * .78, W, H * .22);
      c.fillStyle = 'rgba(200,90,40,0.5)';
      for (let i = 0; i < 40; i++) {
        c.beginPath();
        c.ellipse(rng() * W, H * (.78 + rng() * .2), W * .008, W * .004, rng() * 3, 0, 7);
        c.fill();
      }
      // 紅葉の木3本(幹+もこもこ樹冠)
      for (const [tx, th] of [[W * .18, .42], [W * .52, .5], [W * .85, .38]]) {
        const ty = H * .8;
        c.fillStyle = '#4a3020';
        c.fillRect(tx - W * .008, ty - H * th * .6, W * .016, H * th * .6);
        const cols = ['#c8402a', '#e07020', '#d8a020'];
        for (let b = 0; b < 9; b++) {
          c.fillStyle = cols[Math.floor(rng() * 3)];
          c.beginPath();
          c.arc(tx + (rng() - .5) * W * .1, ty - H * th * (.55 + rng() * .4), W * (.02 + rng() * .025), 0, 7);
          c.fill();
        }
      }
      // 舞う紅葉
      c.fillStyle = 'rgba(210,80,40,0.8)';
      for (let i = 0; i < 14; i++) {
        const lx = ((rng() + t * .05 * (0.4 + rng() * .6)) % 1) * W;
        const ly = (rng() + .08 * Math.sin(t * 2 + i)) * H;
        c.save(); c.translate(lx, ly); c.rotate(t * 2 + i);
        c.beginPath(); c.ellipse(0, 0, W * .005, W * .003, 0, 0, 7); c.fill();
        c.restore();
      }
    } else if (pr === 'falls') {
      // 滝: 山の緑 + 絶壁 + 落ちる水流 + 水しぶき
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8ec8e8'); gr.addColorStop(.5, '#5a9e6a'); gr.addColorStop(1, '#2e5e48');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(43);
      // 左右の崖
      c.fillStyle = '#4a5a4a';
      c.beginPath();
      c.moveTo(0, H); c.lineTo(0, H * .2);
      c.lineTo(W * .3, H * .35); c.lineTo(W * .35, H);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(W, H); c.lineTo(W, H * .25);
      c.lineTo(W * .7, H * .4); c.lineTo(W * .65, H);
      c.closePath(); c.fill();
      // 水流(中央、ゆらぐ帯)
      c.fillStyle = 'rgba(220,240,255,0.85)';
      c.beginPath();
      c.moveTo(W * .38, 0);
      c.lineTo(W * .62, 0);
      c.lineTo(W * .58 + Math.sin(t * 2) * 4, H * .8);
      c.lineTo(W * .42 - Math.sin(t * 2) * 4, H * .8);
      c.closePath(); c.fill();
      // 水の縞
      c.strokeStyle = 'rgba(140,190,230,0.6)'; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const wy = ((rng() + t * .3) % 1) * H * .8;
        c.beginPath();
        c.moveTo(W * .4, wy); c.lineTo(W * .6, wy + 8);
        c.stroke();
      }
      // 水しぶき+池
      c.fillStyle = 'rgba(230,248,255,0.6)';
      for (let i = 0; i < 16; i++) {
        const mx = W * (.4 + rng() * .2), my = H * (.78 + rng() * .06);
        const mr = W * (.004 + rng() * .008) * (0.7 + .3 * Math.sin(t * 3 + i));
        c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(70,140,160,0.8)';
      c.fillRect(0, H * .82, W, H * .18);
    } else if (pr === 'oasis') {
      // オアシス: 砂漠の空 + 椰子2本 + 青い池 + 砂丘
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#9ed4e8'); gr.addColorStop(.55, '#e8d49a'); gr.addColorStop(1, '#c8a060');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,240,190,0.9)';
      c.beginPath(); c.arc(W * .8, H * .18, H * .08, 0, 7); c.fill();
      // 砂丘
      c.fillStyle = '#d8b070';
      c.beginPath(); c.ellipse(W * .2, H * .8, W * .45, H * .16, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#c89a58';
      c.fillRect(0, H * .78, W, H * .22);
      // 池
      c.fillStyle = 'rgba(60,150,190,0.9)';
      c.beginPath(); c.ellipse(W * .45, H * .82, W * .16, H * .045, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(200,240,255,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ry = H * (.8 + i * .015);
        c.beginPath(); c.moveTo(W * .38, ry); c.quadraticCurveTo(W * .45, ry + 3, W * .52, ry); c.stroke();
      }
      // 椰子の木2本(湾曲した幹+扇状の葉)
      for (const [px, flip] of [[W * .3, 1], [W * .62, -1]]) {
        const py = H * .78, ph = H * .28;
        c.strokeStyle = '#7a5a30'; c.lineWidth = W * .009; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(px, py); c.quadraticCurveTo(px + flip * W * .03, py - ph * .6, px + flip * W * .05, py - ph);
        c.stroke();
        const tx = px + flip * W * .05, ty = py - ph;
        c.strokeStyle = '#3a7a3a'; c.lineWidth = W * .006;
        for (let f = -2; f <= 2; f++) {
          c.beginPath();
          c.moveTo(tx, ty);
          c.quadraticCurveTo(tx + f * W * .03, ty - H * .05, tx + f * W * .055, ty - H * .01);
          c.stroke();
        }
      }
    } else if (pr === 'savanna') {
      // サバンナ: 茜空 + 大きな夕日 + アカシアの木 + 草むら
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#f4b04e'); gr.addColorStop(.6, '#e07a3f'); gr.addColorStop(1, '#8a4a2a');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,220,140,0.9)';
      c.beginPath(); c.arc(W * .5, H * .55, H * .16, 0, 7); c.fill();
      // 地平線の草
      c.fillStyle = '#5e3818';
      c.fillRect(0, H * .72, W, H * .28);
      const rng = L.mulberry32(67);
      // アカシアの木2本(傘状の樹冠)
      for (const tx of [W * .2, W * .78]) {
        const th = H * .3, ty = H * .72;
        c.strokeStyle = '#2e1c10'; c.lineWidth = W * .008; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(tx, ty); c.quadraticCurveTo(tx + W * .01, ty - th * .6, tx + W * .02, ty - th);
        c.stroke();
        c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.lineTo(tx - W * .03, ty - th * .95); c.stroke();
        c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.lineTo(tx + W * .07, ty - th * .95); c.stroke();
        c.fillStyle = '#3a2410';
        c.beginPath(); c.ellipse(tx + W * .02, ty - th, W * .1, H * .035, 0, 0, 7); c.fill();
      }
      // 草の穂
      c.strokeStyle = 'rgba(60,35,15,0.8)'; c.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const gx = rng() * W, gy = H * (.75 + rng() * .22), gh = H * (.03 + rng() * .04);
        c.beginPath();
        c.moveTo(gx, gy); c.quadraticCurveTo(gx + 4, gy - gh * .6, gx + (rng() - .3) * 10, gy - gh);
        c.stroke();
      }
    } else if (pr === 'bamboo') {
      // 竹林: 緑の光 + 竹の幹(節つき) + 舞う葉
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8fbf7a'); gr.addColorStop(.5, '#5e9e5a'); gr.addColorStop(1, '#2e5e40');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 木漏れ日
      const lg = c.createLinearGradient(0, 0, W * .4, H);
      lg.addColorStop(0, 'rgba(255,250,200,0.25)'); lg.addColorStop(1, 'rgba(255,250,200,0)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(91);
      // 竹の幹(奥:薄い 手前:濃い)
      for (let i = 0; i < 14; i++) {
        const bx = rng() * W, bw = W * (.008 + rng() * .012);
        const deep = rng() < .5;
        c.fillStyle = deep ? 'rgba(40,90,50,0.5)' : 'rgba(25,70,38,0.9)';
        c.fillRect(bx - bw / 2, 0, bw, H);
        // 節
        c.fillStyle = 'rgba(20,50,28,0.8)';
        for (let ny = H * .1; ny < H; ny += H * .18) {
          c.fillRect(bx - bw / 2 - 1, ny, bw + 2, 3);
        }
      }
      // 舞う葉
      c.fillStyle = 'rgba(180,230,140,0.8)';
      for (let i = 0; i < 12; i++) {
        const lx = ((rng() + t * .03 * (0.5 + rng() * .5)) % 1) * W;
        const ly = (rng() + .1 * Math.sin(t + i)) * H;
        const sz = W * .006;
        c.save(); c.translate(lx, ly); c.rotate(t + i);
        c.beginPath(); c.ellipse(0, 0, sz * 2, sz, 0, 0, 7); c.fill();
        c.restore();
      }
    } else if (pr === 'canyon') {
      // 渓谷: 夕焼け + 層状の赤岩岸壁(遠近3層)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#f0a860'); gr.addColorStop(.5, '#d4786a'); gr.addColorStop(1, '#8a4a44');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,225,170,0.85)';
      c.beginPath(); c.arc(W * .5, H * .34, H * .1, 0, 7); c.fill();
      const rng = L.mulberry32(31);
      // 3層の崖(後ろほど薄く)
      const layers = [
        ['rgba(150,70,55,0.55)', .5], ['rgba(120,55,45,0.75)', .66], ['#5e3229', .8],
      ];
      for (const [col, by] of layers) {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(0, H);
        c.lineTo(0, H * by);
        let cx = 0;
        while (cx < W) {
          const seg = W * (.08 + rng() * .12);
          const ny = H * (by - .04 + rng() * .08);
          c.lineTo(cx + seg * .5, ny);
          c.lineTo(cx + seg, H * (by - .02 + rng() * .04));
          cx += seg;
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
      // 前景の岩棚(縞模様)
      c.fillStyle = '#4a2620';
      c.fillRect(0, H * .88, W, H * .12);
      c.strokeStyle = 'rgba(200,120,80,0.4)'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const sy = H * (.9 + i * .025);
        c.beginPath(); c.moveTo(0, sy); c.lineTo(W, sy + (rng() - .5) * 6); c.stroke();
      }
    } else if (pr === 'castle') {
      // 城: 夕暮れ+塔2基+城壁+旗+窓の灯り
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#e89a5f'); gr.addColorStop(.55, '#c86a78'); gr.addColorStop(1, '#4a3050');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 太陽
      c.fillStyle = 'rgba(255,215,150,0.9)';
      c.beginPath(); c.arc(W * .72, H * .3, H * .09, 0, 7); c.fill();
      const rng = L.mulberry32(55);
      // 城壁+塔
      c.fillStyle = '#3a2b42';
      const wallY = H * .62, towerH = H * .34;
      c.fillRect(0, wallY, W, H - wallY);
      for (const tx of [W * .16, W * .84]) {
        c.fillRect(tx - W * .07, wallY - towerH, W * .14, towerH + H * .1);
        // 尖り屋根
        c.beginPath();
        c.moveTo(tx - W * .085, wallY - towerH);
        c.lineTo(tx + W * .085, wallY - towerH);
        c.lineTo(tx, wallY - towerH - H * .14);
        c.closePath(); c.fill();
        // 旗(なびく)
        c.strokeStyle = '#3a2b42'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(tx, wallY - towerH - H * .14); c.lineTo(tx, wallY - towerH - H * .2); c.stroke();
        c.fillStyle = '#c0303f';
        const fw = Math.sin(t * 3 + tx) * W * .008;
        c.beginPath();
        c.moveTo(tx, wallY - towerH - H * .2);
        c.lineTo(tx + W * .045 + fw, wallY - towerH - H * .185);
        c.lineTo(tx, wallY - towerH - H * .17);
        c.closePath(); c.fill();
        c.fillStyle = '#3a2b42';
      }
      // 窓の灯り
      c.fillStyle = 'rgba(255,210,120,0.85)';
      for (let i = 0; i < 14; i++) {
        const wx = W * (.1 + rng() * .8), wy = wallY + H * (.03 + rng() * .28);
        c.fillRect(wx, wy, W * .008, H * .018);
      }
      // 門アーチ
      c.fillStyle = 'rgba(20,12,26,0.8)';
      c.beginPath();
      c.arc(W * .5, H * .98, W * .06, Math.PI, 0);
      c.fill();
    } else if (pr === 'cave') {
      // 洞窟: 暗い岩壁 + 天井の鍾乳石 + 差し込む光 + 水面の輝き
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0c0f16'); gr.addColorStop(.7, '#1a2030'); gr.addColorStop(1, '#0a0d14');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 光の柱(斜めに差し込む)
      const lg = c.createLinearGradient(W * .3, 0, W * .55, H);
      lg.addColorStop(0, 'rgba(200,225,255,0.22)'); lg.addColorStop(1, 'rgba(200,225,255,0)');
      c.fillStyle = lg;
      c.beginPath();
      c.moveTo(W * .32, 0); c.lineTo(W * .48, 0); c.lineTo(W * .68, H); c.lineTo(W * .4, H);
      c.closePath(); c.fill();
      // 鍾乳石(天井から下がる三角)
      const rng = L.mulberry32(77);
      c.fillStyle = '#2a3242';
      for (let i = 0; i < 12; i++) {
        const sx = rng() * W, sw = W * (.015 + rng() * .025), sh = H * (.06 + rng() * .14);
        c.beginPath();
        c.moveTo(sx - sw, 0); c.lineTo(sx + sw, 0); c.lineTo(sx + (rng() - .5) * sw, sh);
        c.closePath(); c.fill();
      }
      // 石筍(床から)
      c.fillStyle = '#232a38';
      for (let i = 0; i < 8; i++) {
        const sx = rng() * W, sw = W * (.02 + rng() * .03), sh = H * (.05 + rng() * .1);
        c.beginPath();
        c.moveTo(sx - sw, H); c.lineTo(sx + sw, H); c.lineTo(sx + (rng() - .5) * sw, H - sh);
        c.closePath(); c.fill();
      }
      // 底の水面の輝き
      c.fillStyle = 'rgba(120,170,220,0.15)';
      c.beginPath(); c.ellipse(W * .5, H * .97, W * .45, H * .05, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(160,200,240,0.3)'; c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const wy = H * (.9 + rng() * .08);
        const wx = rng() * W * .8, wl = W * (.05 + rng() * .1);
        c.beginPath();
        c.moveTo(wx + Math.sin(t + i) * 6, wy); c.lineTo(wx + wl + Math.sin(t + i) * 6, wy);
        c.stroke();
      }
    } else if (pr === 'fireworks') {
      // 花火: 夜空 + 時間で打ち上がる放射状の花火 + 都市の明かり
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#06091c'); gr.addColorStop(.75, '#101a3a'); gr.addColorStop(1, '#1c1430');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 都市の灯り(地平線近くの点)
      const rng = L.mulberry32(41);
      c.fillStyle = 'rgba(255,210,140,0.5)';
      for (let i = 0; i < 40; i++) {
        c.fillRect(rng() * W, H * (.9 + rng() * .08), 2, 2);
      }
      // 花火: 3発を時間オフセットでループ(上昇→放射→減衰)
      for (let j = 0; j < 3; j++) {
        const cyc = ((t * .3 + j * .37) % 1);
        const fx = W * (.2 + .3 * j) + Math.sin(j * 7) * W * .06;
        const fyy = H * (.22 + .12 * j);
        const hue = [330, 45, 200][j];
        if (cyc < .3) {
          // 上昇中の弾
          const ry = H * .9 - cyc / .3 * (H * .9 - fyy);
          ctx.fillStyle = `hsla(${hue},90%,70%,.9)`;
          ctx.beginPath(); c.arc(fx, ry, 2.5, 0, 7); c.fill();
        } else {
          const boom = (cyc - .3) / .7; // 0→1 膨張&減衰
          const rr = boom * H * .16;
          const a = Math.max(0, (1 - boom) * .9);
          const rng2 = L.mulberry32(100 + j);
          ctx.fillStyle = `hsla(${hue},90%,${65 + boom * 15}%,${a})`;
          for (let k = 0; k < 26; k++) {
            const ang = k * .2418 + rng2() * .15;
            const d = rr * (.6 + .4 * rng2());
            ctx.beginPath();
            ctx.arc(fx + Math.cos(ang) * d, fyy + Math.sin(ang) * d + boom * boom * H * .05, 1.6 + (1 - boom) * 1.4, 0, 7);
            ctx.fill();
          }
        }
      }
    } else if (pr === 'cloudsea') {
      // 雲海: 暁の空 + 雲の海 + 突き出る峰々 + 朝日
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#ffb37a'); gr.addColorStop(.45, '#ffd0a8'); gr.addColorStop(.6, '#e8f0f8'); gr.addColorStop(1, '#c8d8e8');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,235,200,0.9)';
      c.beginPath(); c.arc(W * .68, H * .3, H * .06, 0, 7); c.fill();
      // 峰々(雲から突き出る)
      const rng = L.mulberry32(17);
      c.fillStyle = '#5a6a80';
      for (let i = 0; i < 5; i++) {
        const px2 = W * (.1 + .2 * i) + (rng() - .5) * W * .08;
        const ph2 = H * (.1 + rng() * .12);
        c.beginPath();
        c.moveTo(px2 - W * .09, H * .62); c.lineTo(px2, H * .62 - ph2); c.lineTo(px2 + W * .09, H * .62);
        c.closePath(); c.fill();
      }
      // 雲の海(横長の重なる白楕円+ゆっくり流れる)
      for (let i = 0; i < 30; i++) {
        const cx2 = ((rng() + t * .012) % 1) * W * 1.2 - W * .1;
        const cy2 = H * (.6 + rng() * .35);
        const cr = H * (.04 + rng() * .07);
        c.fillStyle = `rgba(255,255,255,${.5 + .4 * rng()})`;
        c.beginPath(); c.ellipse(cx2, cy2, cr * 1.9, cr, 0, 0, 7); c.fill();
      }
    } else if (pr === 'lake') {
      // 湖畔: 空 + 山並み + 湖面の反射 + さざ波
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a8d8f0'); gr.addColorStop(.45, '#d8ecf6'); gr.addColorStop(.5, '#7fa8c8'); gr.addColorStop(1, '#3a6080');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const hr2 = H * .5; // 水面ライン
      // 山
      for (const [base, amp, col, sd] of [[.5, .16, '#5a7a90', 33], [.5, .11, '#4a6a80', 44]]) {
        const rng = L.mulberry32(sd);
        c.fillStyle = col;
        c.beginPath(); c.moveTo(0, H * base);
        for (let i = 1; i <= 10; i++) c.lineTo(i * W / 10, H * (base - amp * rng()));
        c.lineTo(W, H * base); c.closePath(); c.fill();
        // 反射(上下反転して薄く)
        c.globalAlpha = .35;
        c.save(); c.translate(0, hr2 * 2); c.scale(1, -1);
        const rng2 = L.mulberry32(sd);
        c.beginPath(); c.moveTo(0, H * base);
        for (let i = 1; i <= 10; i++) c.lineTo(i * W / 10, H * (base - amp * rng2()));
        c.lineTo(W, H * base); c.closePath(); c.fill();
        c.restore(); c.globalAlpha = 1;
      }
      // さざ波(ゆれる水平線)
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.2;
      const rng3 = L.mulberry32(55);
      for (let i = 0; i < 12; i++) {
        const wy = hr2 + H * (.05 + rng3() * .4);
        const wx = rng3() * W * .8;
        const wl = W * (.06 + rng3() * .14);
        c.beginPath();
        c.moveTo(wx + Math.sin(t * 1.2 + i) * 8, wy);
        c.lineTo(wx + wl + Math.sin(t * 1.2 + i) * 8, wy);
        c.stroke();
      }
    } else if (pr === 'shrine') {
      // 神社: 夕暮れ空 + 大きな鳥居シルエット + 灯籠の灯り + 遠山
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#2b2150'); gr.addColorStop(.5, '#8a3a5c'); gr.addColorStop(.75, '#e0703f'); gr.addColorStop(1, '#3a2030');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 遠山
      c.fillStyle = 'rgba(40,25,45,0.7)';
      c.beginPath(); c.moveTo(0, H * .78);
      c.lineTo(W * .18, H * .58); c.lineTo(W * .4, H * .74); c.lineTo(W * .62, H * .6); c.lineTo(W * .85, H * .76); c.lineTo(W, H * .68);
      c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 鳥居(朱色シルエット)
      const tx = W * .5, ty = H * .34, tw = W * .34, th2 = H * .6, pw = W * .022;
      c.fillStyle = '#c53d2e';
      // 柱2本
      c.fillRect(tx - tw * .4, ty + H * .05, pw, th2);
      c.fillRect(tx + tw * .4 - pw, ty + H * .05, pw, th2);
      // 貫(下の横梁)
      c.fillRect(tx - tw * .38, ty + H * .16, tw * .76, H * .035);
      // 笠木+島木(上の反った横梁): 両端を持ち上げた帯
      c.beginPath();
      c.moveTo(tx - tw * .52, ty + H * .02);
      c.quadraticCurveTo(tx, ty - H * .05, tx + tw * .52, ty + H * .02);
      c.lineTo(tx + tw * .52, ty + H * .07);
      c.quadraticCurveTo(tx, ty, tx - tw * .52, ty + H * .07);
      c.closePath(); c.fill();
      c.fillRect(tx - pw / 2, ty - H * .01, pw, H * .18); // 額束(中央柱)
      // 灯籠の灯り
      const rng = L.mulberry32(99);
      c.fillStyle = 'rgba(255,190,110,0.85)';
      for (let i = 0; i < 8; i++) {
        const lx = (rng() < .5 ? -1 : 1) * (W * .18 + rng() * W * .22) + W * .5;
        const ly = H * (.72 + rng() * .18);
        c.beginPath(); c.arc(lx, ly, 3 + rng() * 3, 0, 7); c.fill();
      }
    } else if (pr === 'snowfield') {
      // 雪原: 曇り空 + 白い起伏 + 遠景の針葉樹 + 降る雪
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#aebfcb'); gr.addColorStop(.5, '#d5e0e8'); gr.addColorStop(.51, '#eef4f8'); gr.addColorStop(1, '#d8e6ee');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 雪の起伏
      c.fillStyle = '#f4f9fc';
      c.beginPath(); c.moveTo(0, H);
      c.quadraticCurveTo(W * .3, H * .55, W * .6, H * .66);
      c.quadraticCurveTo(W * .85, H * .74, W, H * .64); c.lineTo(W, H); c.closePath(); c.fill();
      // 遠景の木
      const rng = L.mulberry32(48);
      c.fillStyle = 'rgba(70,95,90,0.5)';
      for (let i = 0; i < 7; i++) {
        const tx = rng() * W, th = H * (.06 + rng() * .05), ty = H * (.52 + rng() * .04);
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.moveTo(tx - th * (.7 - k * .2), ty - k * th * .3);
          c.lineTo(tx + th * (.7 - k * .2), ty - k * th * .3);
          c.lineTo(tx, ty - k * th * .3 - th * .45);
          c.closePath(); c.fill();
        }
      }
      // 降る雪
      c.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 40; i++) {
        const sx = (rng() + t * .03 * (0.5 + rng())) % 1 * W;
        const sy = (rng() + t * .08 * (0.6 + rng() * .8)) % 1 * H;
        c.beginPath(); c.arc(sx, sy, 1 + rng() * 2, 0, 7); c.fill();
      }
    } else if (pr === 'meadow') {
      // 草原: 青空 + なだらかな緑の丘2層 + 草花 + 飛ぶ蝶
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(.55, '#cdeffa'); gr.addColorStop(.56, '#79c26a'); gr.addColorStop(1, '#4e9a44');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 丘
      c.fillStyle = 'rgba(110,180,90,0.85)';
      c.beginPath(); c.moveTo(0, H);
      c.quadraticCurveTo(W * .3, H * .5, W * .65, H * .62);
      c.quadraticCurveTo(W * .85, H * .68, W, H * .6); c.lineTo(W, H); c.closePath(); c.fill();
      c.fillStyle = 'rgba(85,160,70,0.9)';
      c.beginPath(); c.moveTo(0, H);
      c.quadraticCurveTo(W * .6, H * .55, W, H * .78); c.lineTo(W, H); c.closePath(); c.fill();
      // 花
      const rng = L.mulberry32(75);
      const fcols = ['#ff8fb3', '#fff3b0', '#ffffff', '#ffd166'];
      for (let i = 0; i < 26; i++) {
        const fx = rng() * W, fy = H * (.62 + rng() * .34);
        c.fillStyle = fcols[Math.floor(rng() * fcols.length)];
        for (let k = 0; k < 4; k++) {
          c.beginPath();
          c.arc(fx + Math.cos(k * 1.57) * 4, fy + Math.sin(k * 1.57) * 4, 3.5, 0, 7);
          c.fill();
        }
      }
      // 蝶
      const bt = t * 2;
      for (const [bx0, by0, ph] of [[.25, .35, 0], [.7, .42, 2]]) {
        const bx = W * (bx0 + .06 * Math.sin(bt + ph)), by = H * (by0 + .04 * Math.sin(bt * 1.7 + ph));
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (const s of [-1, 1]) {
          c.beginPath();
          c.ellipse(bx + s * 6, by, 5 * (0.6 + .4 * Math.abs(Math.sin(bt * 3 + ph))), 8, s * .3, 0, 7);
          c.fill();
        }
      }
    } else if (pr === 'volcano') {
      // 火山: 暗い空 + 噴火する山 + 火の粉 + 溶岩の帯
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#1a0f14'); gr.addColorStop(.6, '#3a1620'); gr.addColorStop(1, '#12080b');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const mx = W * .5, mtop = H * .32, mbot = H;
      // 山体(左右に広がる三角)
      c.fillStyle = '#241317';
      c.beginPath();
      c.moveTo(mx - W * .45, mbot); c.lineTo(mx - W * .08, mtop); c.lineTo(mx + W * .08, mtop); c.lineTo(mx + W * .45, mbot);
      c.closePath(); c.fill();
      // 火口の輝き + 溶岩筋
      c.fillStyle = 'rgba(255,90,40,0.9)';
      c.beginPath(); c.ellipse(mx, mtop + H * .02, W * .08, H * .025, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,120,50,0.75)'; c.lineWidth = H * .02; c.lineCap = 'round';
      const rng = L.mulberry32(84);
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(mx + s * W * .05, mtop + H * .03);
        c.quadraticCurveTo(mx + s * W * .14, mtop + H * .3, mx + s * W * .22, mbot);
        c.stroke();
      }
      // 火の粉
      c.fillStyle = 'rgba(255,150,70,0.8)';
      for (let i = 0; i < 22; i++) {
        const fx = mx + (rng() - .5) * W * .5;
        const fy = mtop - ((rng() + t * .15) % 1) * H * .5;
        const fr = 1 + rng() * 3;
        c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fill();
      }
      // 噴煙
      c.fillStyle = 'rgba(60,45,50,0.5)';
      for (let i = 0; i < 6; i++) {
        const sx = mx + Math.sin(t * .6 + i) * W * .05 + (i - 3) * W * .02;
        const sy = mtop - H * (.08 + i * .07);
        c.beginPath(); c.arc(sx, sy, H * (.05 + i * .015), 0, 7); c.fill();
      }
    } else if (pr === 'rainbow') {
      // 虹: 淡い空 + 同心円弧の7色虹 + 両端の雲
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#bfe3ff'); gr.addColorStop(1, '#eaf6ff');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rcx = W * .5, rcy = H * .95, rmax = H * .78;
      const cols = ['#ff5a5a', '#ff9f43', '#ffd43b', '#69db7c', '#4dabf7', '#748ffc', '#b197fc'];
      for (let i = 0; i < 7; i++) {
        c.strokeStyle = cols[i]; c.lineWidth = rmax / 7;
        c.globalAlpha = .65;
        c.beginPath();
        c.arc(rcx, rcy, rmax - i * rmax / 7 - rmax / 14, Math.PI, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 1;
      // 雲(虹の両端)
      const rng = L.mulberry32(63);
      c.fillStyle = 'rgba(255,255,255,0.9)';
      for (const cx of [rcx - rmax * .8, rcx + rmax * .8]) {
        for (let k = 0; k < 5; k++) {
          c.beginPath();
          c.arc(cx + (rng() - .5) * W * .14, rcy - rng() * H * .06, 14 + rng() * 16, 0, 7);
          c.fill();
        }
      }
    } else if (pr === 'mtn') {
      // 山並み: 朝焼けの空 + 稜線シルエット2枚 + 朝日
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#ffb37a'); gr.addColorStop(.4, '#ffd9b0'); gr.addColorStop(.7, '#aebfd0');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,235,200,0.9)';
      c.beginPath(); c.arc(W * .6, H * .38, H * .07, 0, 7); c.fill();
      // 稜線: ジグザグの稜線を遠近2層で
      for (const [base, amp, col, seed2] of [[.55, .12, '#7d8ba0', 11], [.72, .16, '#4a5a70', 22]]) {
        const rng = L.mulberry32(seed2);
        c.fillStyle = col;
        c.beginPath(); c.moveTo(0, H);
        c.lineTo(0, H * base);
        for (let i = 1; i <= 12; i++) {
          c.lineTo(i * W / 12, H * (base - amp * rng()));
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
    } else if (pr === 'space') {
      // 宇宙: 漆黒 + 星々 + リング付き惑星(土星風)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#03040c'); gr.addColorStop(1, '#0d1230');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(414);
      for (let i = 0; i < 130; i++) {
        const tw = .4 + .6 * Math.abs(Math.sin(t * .8 + i * 2.3));
        c.fillStyle = `rgba(255,255,255,${.2 + .6 * tw * rng()})`;
        c.fillRect(rng() * W, rng() * H, 1.4, 1.4);
      }
      // 惑星: 帯グラデーションの球体 + 傾いたリング
      const px2 = W * .72, py2 = H * .4, pr2 = H * .2;
      const pg = c.createLinearGradient(px2 - pr2, py2 - pr2, px2 + pr2, py2 + pr2);
      pg.addColorStop(0, '#e8c98a'); pg.addColorStop(.5, '#b98d4f'); pg.addColorStop(1, '#6e4f2a');
      c.fillStyle = pg;
      c.beginPath(); c.arc(px2, py2, pr2, 0, 7); c.fill();
      c.strokeStyle = 'rgba(230,210,170,0.55)'; c.lineWidth = H * .02;
      c.beginPath(); c.ellipse(px2, py2 + pr2 * .1, pr2 * 1.8, pr2 * .45, -.18, 0, 7); c.stroke();
    } else if (pr === 'sea') {
      // 海中: 深い青 + 差し込む光の柱 + 昇る泡(決定論的)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0a4d7a'); gr.addColorStop(.6, '#0b3a63'); gr.addColorStop(1, '#061f38');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 光の柱(斜めの柔らかい帯)
      for (let i = 0; i < 5; i++) {
        const lx = W * (.15 + i * .18);
        const g2 = c.createLinearGradient(lx, 0, lx + W * .12, H);
        g2.addColorStop(0, 'rgba(180,230,255,0.18)'); g2.addColorStop(1, 'rgba(180,230,255,0)');
        c.fillStyle = g2;
        c.beginPath();
        c.moveTo(lx, 0); c.lineTo(lx + W * .05, 0);
        c.lineTo(lx + W * .05 + W * .14, H); c.lineTo(lx + W * .14, H);
        c.closePath(); c.fill();
      }
      // 昇る泡
      const rng = L.mulberry32(202);
      for (let i = 0; i < 22; i++) {
        const bx = rng() * W, r2 = 1.5 + rng() * 4;
        const by = (1 - ((rng() + t * (.03 + .03 * rng())) % 1)) * H;
        c.strokeStyle = 'rgba(200,235,255,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.arc(bx + Math.sin(t + i) * 4, by, r2, 0, 7); c.stroke();
      }
    } else if (pr === 'desert') {
      // 砂漠: 空+大きな太陽+うねる砂丘(決定論的)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#ffd9a0'); gr.addColorStop(.45, '#ffedcf'); gr.addColorStop(.46, '#e8b968');
      gr.addColorStop(1, '#c98f3d');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,240,200,0.95)';
      c.beginPath(); c.arc(W * .5, H * .3, H * .11, 0, 7); c.fill();
      // 砂丘: 正弦カーブの砂稜を2枚重ねる
      for (const [base, amp, col] of [[.6, .07, '#d9a44f'], [.75, .09, '#b57f30']]) {
        c.fillStyle = col;
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 40) {
          c.lineTo(x, H * (base + amp * Math.sin(x / W * 4.4 + base * 9)));
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
    } else if (pr === 'aurora') {
      // オーロラ: 夜空 + ゆらめく光のカーテン + 星
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#050a18'); gr.addColorStop(1, '#101c30');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(777);
      for (let i = 0; i < 60; i++) {
        const tw = .3 + .7 * Math.abs(Math.sin(t * .7 + i * 1.9));
        c.fillStyle = `rgba(255,255,255,${.2 + .55 * tw * rng()})`;
        c.fillRect(rng() * W, rng() * H * .7, 1.3, 1.3);
      }
      // 光のカーテン: 縦波の半透明帯を色違いで重ねる
      for (const [hue, ph0, amp] of [[140, 0, .5], [190, 2.1, .34], [280, 4.2, .22]]) {
        c.fillStyle = `hsla(${hue},85%,60%,${amp * .4})`;
        c.beginPath();
        c.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 32) {
          const y = H * (.28 + .12 * Math.sin(x / W * 5 + ph0 + t * .6) + .06 * Math.sin(x / W * 11 - t * .9 + ph0));
          c.lineTo(x, y);
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
    } else if (pr === 'forest') {
      // 森: 深い緑の空 + 木漏れ日 + 針葉樹シルエット(決定論的)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#12351f'); gr.addColorStop(.6, '#1d4d2a'); gr.addColorStop(1, '#0e2413');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 木漏れ日(柔らかい光斑)
      const rng = L.mulberry32(313);
      for (let i = 0; i < 10; i++) {
        c.fillStyle = `rgba(230,255,190,${.05 + .08 * rng()})`;
        c.beginPath(); c.arc(rng() * W, rng() * H * .5, 10 + rng() * 26, 0, 7); c.fill();
      }
      // 前景の針葉樹(2段三角)
      for (let i = 0; i < 9; i++) {
        const tx = rng() * W, th = H * (.3 + rng() * .28), tw = th * .42, ty = H;
        c.fillStyle = `rgba(8,26,12,${.75 + .25 * rng()})`;
        for (const [sy, sw] of [[1, 1], [.62, .72], [.3, .45]]) {
          c.beginPath();
          c.moveTo(tx, ty - th * sy - th * .3);
          c.lineTo(tx - tw * sw, ty - th * sy + th * .34);
          c.lineTo(tx + tw * sw, ty - th * sy + th * .34);
          c.closePath(); c.fill();
        }
      }
    } else if (pr === 'beach') {
      // 海辺: 空+太陽+海面+砂浜 + 揺れる波線(決定論的)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#8ecfff'); gr.addColorStop(.5, '#c9e9ff'); gr.addColorStop(.51, '#2b7fc9');
      gr.addColorStop(.78, '#1d63a8'); gr.addColorStop(.79, '#e8d5a0'); gr.addColorStop(1, '#d9c289');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 太陽
      c.fillStyle = 'rgba(255,245,200,0.95)';
      c.beginPath(); c.arc(W * .78, H * .18, H * .09, 0, 7); c.fill();
      // 波の輝き線(ゆっくり流れる)
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.4;
      const rng = L.mulberry32(909);
      for (let i = 0; i < 14; i++) {
        const wy = H * (.54 + rng() * .22), wl = W * (.06 + rng() * .18);
        const wx = ((rng() + t * .02) % 1) * W;
        c.globalAlpha = .3 + .4 * rng();
        c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + wl, wy); c.stroke();
      }
      c.globalAlpha = 1;
    } else if (pr === 'grid') {
      // サイバー格子: シンセウェイブ風 — 暗い空 + 消失点に収束する発光格子
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#0c0820'); gr.addColorStop(.6, '#241040'); gr.addColorStop(1, '#451a55');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const horizon = H * .55;
      c.strokeStyle = 'rgba(255,110,200,0.5)'; c.lineWidth = 1.2;
      // 縦線: 地平線の点から下方へ広がる
      for (let i = -10; i <= 10; i++) {
        c.beginPath();
        c.moveTo(W / 2 + i * W * .06, horizon);
        c.lineTo(W / 2 + i * W * .3, H);
        c.stroke();
      }
      // 横線: スクロールする透視線
      for (let k = 0; k < 9; k++) {
        const f = ((k / 9 + t * .12) % 1);
        const y = horizon + f * f * (H - horizon);
        c.globalAlpha = .25 + .55 * f;
        c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      }
      c.globalAlpha = 1;
      // 地平線の輝き
      const hg = c.createLinearGradient(0, horizon - 14, 0, horizon + 14);
      hg.addColorStop(0, 'rgba(255,110,200,0)'); hg.addColorStop(.5, 'rgba(255,150,220,0.55)'); hg.addColorStop(1, 'rgba(255,110,200,0)');
      c.fillStyle = hg; c.fillRect(0, horizon - 14, W, 28);
    } else if (pr === 'city') {
      // 夜景ビル群: 薄明りの空 + ビルシルエット + 灯りのついた窓(決定論的)
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#141a30'); gr.addColorStop(1, '#3a3050');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      const rng = L.mulberry32(555);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const bw = W / n * (.7 + rng() * .5), bh = H * (.3 + rng() * .35);
        const bx = i * W / n + rng() * W * .02, by = H - bh;
        c.fillStyle = '#10131f';
        c.fillRect(bx, by, bw, bh + 2);
        for (let wy = by + H * .02; wy < H * .92; wy += H * .035) {
          for (let wx = bx + bw * .12; wx < bx + bw * .85; wx += bw * .18) {
            if (rng() < .35) {
              c.fillStyle = `rgba(255,220,140,${.3 + .5 * rng()})`;
              c.fillRect(wx, wy, 2, 3);
            }
          }
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
      if (p.anim === 'walk' || p.anim === 'run' || p.anim === 'moonwalk') {
        const spd = p.anim === 'run' ? .2 : p.anim === 'moonwalk' ? .07 : .10;
        const ph = (t * spd * (0.5 + p.animSpeed) + .125) % 1.25;
        // moonwalk は向いている方向の逆へ滑る
        cx = p.anim === 'moonwalk' ? (p.flip ? -.125 + ph : 1.125 - ph) * W : (p.flip ? 1.125 - ph : -.125 + ph) * W;
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
    cool: { eyeStyle: 'sharp', smile: .5, brow: .4, acc: 'shades' },
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
