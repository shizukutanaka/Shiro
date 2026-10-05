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
      a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function strSeed(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ---------- params ----------

  const ANIMS = ['idle', 'wave', 'walk', 'dance', 'jump', 'nod', 'run', 'talk', 'bow', 'spin', 'stretch', 'sleep', 'flip', 'clap', 'peek', 'cheer', 'sad', 'sit', 'point', 'shake', 'sneeze', 'kick', 'float', 'skip', 'moonwalk', 'salute', 'balance', 'guard', 'surf', 'march', 'zombie', 'robot', 'hula', 'yoga', 'punch', 'shuffle', 'lunge', 'cossack', 'hop', 'dab', 'side', 'twist', 'swim', 'bodyroll', 'charleston', 'vogue', 'stomp', 'krump', 'waltz', 'tarantella', 'capoeira', 'belly', 'flamenco', 'samba', 'tango', 'swing', 'polka', 'foxtrot', 'chacha', 'pasodoble', 'cancan', 'mazurka', 'minuet', 'bolero', 'sirtaki', 'reel', 'hora', 'gavotte', 'czardas', 'morris', 'jig', 'bourree', 'sarabande', 'pavane', 'allemande', 'courante', 'rigaudon', 'passepied', 'hambo', 'galliard', 'saltarello', 'bransle', 'farandole', 'canarie', 'volta', 'jota', 'fandango', 'zapateado', 'korobushka', 'trepak', 'legenyes', 'kalamatianos', 'kolo', 'dabke', 'sardana', 'zeybek', 'tsamiko', 'seguidilla', 'sevillanas', 'forro', 'schuhplattler', 'halay', 'polska', 'cumbia', 'landler', 'hopak', 'kalbelia', 'bhangra', 'kathak', 'bharat', 'odissi', 'garba', 'bihu', 'lavani', 'dandiya', 'ghoomar', 'khorovod', 'lezginka', 'krakowiak', 'verbunk', 'sirba', 'hasapiko', 'oberek', 'tropanka', 'tinikling', 'gumboot', 'halling', 'haka', 'marinera', 'sagayan', 'malambo', 'caporales', 'huayno', 'cueca', 'morenada', 'diablada', 'carnavalito', 'tinku', 'zamba', 'singkil', 'kecak', 'saman', 'robam', 'indlamu', 'adumu', 'eskista', 'gnawa', 'piring', 'pangalay', 'kartuli', 'lazgi', 'springar', 'ganggang', 'biyelgee', 'saidi', 'horon', 'jarabe', 'frevo', 'siva', 'gorshey', 'seannos', 'salegy', 'otea', 'meke', 'singsing', 'lakalaka', 'toka', 'vira', 'yarkhushta', 'yalli', 'ardha', 'stambeli', 'ondunda', 'lamvong', 'still'];
  const VIDQS = ['low', 'std', 'high']; const FITS = ['cover', 'contain'];
  const ACCS = ['none', 'ribbon', 'hat', 'glasses', 'shades', 'crown', 'phones', 'cape', 'beard', 'mask', 'halo', 'flower', 'scarf', 'beret', 'tie', 'monocle', 'bunny', 'cat-ear', 'bandana', 'goggles', 'horns', 'straw', 'earmuff', 'wizard', 'cap', 'chef', 'top', 'santa', 'headband', 'antler', 'bowtie', 'viking', 'fez', 'sombrero', 'ushanka', 'laurel', 'nightcap', 'jester', 'tiara', 'flowercrown', 'bowler', 'fedora', 'newsboy', 'tricorne', 'turban', 'matador', 'plume', 'veil', 'cloche', 'boater', 'deerstalker', 'bonnet', 'mobcap', 'sunvisor', 'keffiyeh', 'porkpie', 'sailor', 'tam', 'shako', 'pickelhaube', 'bicorne', 'mortar', 'beanie', 'crown2', 'kasa', 'mantilla', 'coif', 'kippah', 'topknot', 'eboshi', 'cowboy', 'mitre', 'snood', 'phrygian', 'calot', 'biretta', 'kokoshnik', 'hennin', 'chaperon', 'kettle', 'attifet', 'barbette', 'fontange', 'coonskin', 'wimple', 'busby', 'petasos', 'souwester', 'caubeen', 'tagelmust', 'kalpak', 'doppa', 'capirote', 'capotain', 'vueltiao', 'pamela', 'kepi', 'pith', 'chullo', 'cordobes', 'bandeau', 'karakul', 'tikka', 'pagri', 'mukut', 'jhoomar', 'peacock', 'tilak', 'jaapi', 'pheta', 'sarpech', 'borla', 'venok', 'papakha', 'rogatywka', 'csikos', 'clop', 'sariki', 'pakol', 'songkok', 'blangkon', 'gibus', 'toque', 'salakot', 'barretina', 'montenegrin', 'chupalla', 'spodik', 'montera', 'akubra', 'panama', 'tiroler', 'homburg', 'dhakatopi', 'gandhi', 'tengkolok', 'udeng', 'kofia', 'apsara', 'isicholo', 'maasai', 'netela', 'burnous', 'tengkuluk', 'saputangan', 'bashlyk', 'telpek', 'sjuhatt', 'gat', 'toortsog', 'nemes', 'kavuk', 'penacho', 'cangaceiro', 'tuiga', 'zhawa', 'glengarry', 'satroka', 'taupoo', 'salusalu', 'kapkap', 'tekiteki', 'pare', 'capote', 'taraz', 'kalagayi', 'agal', 'chechia', 'ekori', 'jok'];
  const PARTICLES = ['none', 'snow', 'sparkle', 'petal', 'rain', 'leaf', 'ember', 'bubble', 'confetti', 'firefly', 'bokeh', 'notes', 'hearts', 'spark', 'wind']; const WMPOS = ['br', 'bl', 'tr', 'tl'];
  const BGS = ['gradient', 'green', 'white', 'transparent', 'sunset', 'night', 'spot', 'sky', 'city', 'pastel', 'grid', 'beach', 'forest', 'aurora', 'desert', 'sea', 'space', 'mtn', 'rainbow', 'volcano', 'meadow', 'snowfield', 'shrine', 'lake', 'cloudsea', 'fireworks', 'cave', 'castle', 'canyon', 'bamboo', 'savanna', 'oasis', 'falls', 'autumn', 'fjord', 'glacier', 'ruins', 'sakura', 'moon', 'harbor', 'terraces', 'bridge', 'wheatfield', 'pagoda', 'geyser', 'coral', 'vineyard', 'lavender', 'rainforest', 'mesa', 'alps', 'bayou', 'cliff', 'lagoon', 'prairie', 'observatory', 'storm', 'zen', 'wisteria', 'sunflowers', 'cosmos', 'orchard', 'onsen', 'moor', 'brook', 'grove', 'tide', 'pond', 'badlands', 'taiga', 'mangrove', 'delta', 'highland', 'saltflat', 'wadi', 'tundra', 'quarry', 'dune', 'cirque', 'fen', 'cove', 'glen', 'steppe', 'meseta', 'hamada', 'kelp', 'cenote', 'loch', 'karst', 'polder', 'bazaar', 'seastack', 'billabong', 'glade', 'tea', 'pampas', 'canal', 'grotto', 'cloudforest', 'iceberg', 'rapids', 'meteora', 'dojo', 'stupa', 'taj', 'ghat', 'himalaya', 'thar', 'gopuram', 'kerala', 'kaziranga', 'ghats', 'rann', 'haveli', 'izba', 'caucasus', 'tatras', 'puszta', 'carpathians', 'santorini', 'cappadocia', 'redwoods', 'slotcanyon', 'angkor', 'pantanal', 'deadvlei', 'uyuni', 'bagan', 'torres', 'lauterbrunnen', 'hallstatt', 'petra', 'machupicchu', 'dolomites', 'zhangjiajie', 'halong', 'vinicunca', 'lofoten', 'borobudur', 'socotra', 'tonlesap', 'drakensberg', 'serengeti', 'simien', 'chefchaouen', 'toraja', 'chocohills', 'svaneti', 'khiva', 'preikestolen', 'jeju', 'gobi', 'nile', 'pamukkale', 'chichen', 'lencois', 'atoll', 'potala', 'moher', 'baobab', 'moorea', 'bure', 'kokoda', 'haamonga', 'yasur', 'douro', 'ararat', 'khinalug', 'hegra', 'sidi', 'brandberg', 'luang'];
  const EYES = ['dot', 'wink', 'closed', 'heart', 'sharp', 'star', 'crying', 'dizzy', 'xx', 'cat', 'wide']; const HAIRS = ['none', 'short', 'bob', 'twin', 'long', 'ahoge', 'mohawk', 'odango', 'pony', 'mush', 'curly', 'pomp', 'braid']; const SUBJFX = ['none', 'sepia', 'mono', 'invert'];
  const SUBJFX_FILTERS = { sepia: 'sepia(0.9)', mono: 'grayscale(1)', invert: 'invert(1) hue-rotate(180deg)' };
  const GRADES = ['none', 'warm', 'cool', 'noir', 'vivid']; const BLENDS = ['none', 'multiply', 'screen', 'overlay', 'soft-light', 'difference', 'hue'];
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
      const v = p ? Number(p[k]) : NaN; o[k] = clamp01(Number.isFinite(v) ? v : d[k]);
    }
    o.anim = ANIMS.includes(p && p.anim) ? p.anim : d.anim; o.bgFit = FITS.includes(p && p.bgFit) ? p.bgFit : d.bgFit; o.acc = ACCS.includes(p && p.acc) ? p.acc : d.acc; o.acc2 = ACCS.includes(p && p.acc2) ? p.acc2 : d.acc2; o.bgPreset = BGS.includes(p && p.bgPreset) ? p.bgPreset : d.bgPreset; o.watermark = String(p && p.watermark || '').slice(0, 60); o.bubble = String(p && p.bubble || '').slice(0, 24); o.title = String(p && p.title || '').slice(0, 40); o.eyeStyle = EYES.includes(p && p.eyeStyle) ? p.eyeStyle : d.eyeStyle; o.subjFx = SUBJFX.includes(p && p.subjFx) ? p.subjFx : d.subjFx;
    o.grade = GRADES.includes(p && p.grade) ? p.grade : d.grade; o.blend = BLENDS.includes(p && p.blend) ? p.blend : d.blend; o.particles = PARTICLES.includes(p && p.particles) ? p.particles : d.particles; o.wmPos = WMPOS.includes(p && p.wmPos) ? p.wmPos : d.wmPos; o.hair = HAIRS.includes(p && p.hair) ? p.hair : d.hair; o.vidQ = VIDQS.includes(p && p.vidQ) ? p.vidQ : d.vidQ; o.flip = !!(p && p.flip); const sv = p ? +p.seed : NaN; o.seed = (Number.isFinite(sv) ? Math.abs(Math.floor(sv)) : d.seed) >>> 0;
    return o;
  }

  function randomParams(rng) {
    const p = defaultParams();
    for (const k of NUM_KEYS) p[k] = rng();
    p.anim = ANIMS[Math.floor(rng() * ANIMS.length)]; p.acc = ACCS[Math.floor(rng() * ACCS.length)]; p.acc2 = rng() < .7 ? 'none' : ACCS[Math.floor(rng() * ACCS.length)]; p.eyeStyle = EYES[Math.floor(rng() * EYES.length)]; p.hair = HAIRS[Math.floor(rng() * HAIRS.length)]; p.hairHue = rng(); p.subjFx = rng() < .75 ? 'none' : SUBJFX[1 + Math.floor(rng() * 3)]; p.grade = rng() < .6 ? 'none' : GRADES[1 + Math.floor(rng() * 4)]; p.blend = rng() < .75 ? 'none' : BLENDS[1 + Math.floor(rng() * 3)]; p.flip = rng() < .35; p.bgPreset = rng() < .7 ? 'gradient' : BGS[1 + Math.floor(rng() * (BGS.length - 1))]; p.x = .3 + rng() * .4;
    p.y = .6 + rng() * .35; p.scale = .4 + rng() * .5; p.opacity = .6 + rng() * .4; p.keyThresh = rng() < .5 ? 0 : rng() * .6; p.bgDim = rng() * .5; p.bgBlur = rng() < .6 ? 0 : rng() * .6; p.castDir = rng(); p.rim = rng() * .7; p.eyeHue = rng(); p.clothHue = rng() < .4 ? 0 : rng(); p.outline = rng() < .5 ? 0 : rng() * .7; p.vignette = rng() < .6 ? 0 : rng() * .6; p.watermark = ''; p.wmOpacity = .4; p.vidSpeed = .5; p.blush = rng() * .6; p.headTilt = .35 + rng() * .3; p.bgSat = .3 + rng() * .7; p.bgContrast = .35 + rng() * .5; p.reflect = rng() < .6 ? 0 : rng() * .8; p.tOffset = .5; p.grain = rng() < .7 ? 0 : rng() * .5;
    p.trail = rng() < .7 ? 0 : rng() * .7; p.subjHue = .4 + rng() * .2; p.pixel = rng() < .75 ? 0 : rng() * .7; p.shake = rng() < .7 ? 0 : rng() * .5; p.glow = rng() < .7 ? 0 : rng() * .8; p.eyeSize = .3 + rng() * .5; p.duo = rng() < .7 ? 0 : rng() * .7; p.rot = .35 + rng() * .3; p.bgX = .5; p.bgY = .5; p.seed = Math.floor(rng() * 4294967295); // 背景オフセットはランダムにしない(構図崩壊防止)
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
    const d = 255 - Math.min(r, g, b); const T = thresh * 200, S = 1 + soft * 120;
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
      const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11); d[i] += (l - d[i]) * k; d[i + 1] += (l - d[i + 1]) * k; d[i + 2] += (l - d[i + 2]) * k;
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
    c.globalAlpha = alpha; c.translate(cx, baseY); c.transform(1, 0, -skew, .32, 0, 0); c.drawImage(silCanvas, -wPix / 2, -hPix, wPix, hPix); c.restore();
  }

  // リムライト(ライトラップ): 光源側エッジに薄い光をまとわせ被写体を背景に馴染ませる。
  // 影の向き(castDir)と逆側が光方向。モデル描画の直前に呼ぶ。
  function drawRimLight(c, silCanvas, wPix, hPix, cx, baseY, dir, strength) {
    if (strength <= 0) return;
    const dx = (dir - .5) * -wPix * .08; const g = 1.06; c.save(); // 影と逆方向
    c.filter = `blur(${Math.max(1, wPix * .05)}px)`;
    c.globalAlpha = strength * .55; c.drawImage(silCanvas, cx - wPix / 2 + dx - (wPix * g - wPix) / 2, baseY - hPix * g - hPix * .015, wPix * g, hPix * g); c.restore();
  }

  // ステッカー縁取り: 白色シルエットを全方向にずらして重ね、被写体の周りに輪郭を作る。
  // silCanvas は #ffffff 着色済みのシルエット。2重リングで隙間なく塗る。
  function drawStickerOutline(c, silCanvas, wPix, hPix, cx, baseY, strength) {
    if (strength <= 0) return;
    const r = Math.max(1, Math.round(strength * wPix * .045)); c.save(); c.globalAlpha = Math.min(1, strength * 1.5);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2; const dx = Math.cos(a) * r, dy = Math.sin(a) * r; c.drawImage(silCanvas, cx - wPix / 2 + dx, baseY - hPix + dy, wPix, hPix); c.drawImage(silCanvas, cx - wPix / 2 + dx * .55, baseY - hPix + dy * .55, wPix, hPix);
    }
    c.restore();
  }

  // ビネット: 画面端を落とすレンズ効果。最後にフレーム全体へ重ねる。
  function drawVignette(c, w, h, strength) {
    if (strength <= 0) return;
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .78); g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength * .45})`);
    c.save(); c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
  }

  // 透かし(ウォーターマーク): クリエイターが作品に入れる署名テキスト。右下・影付き白文字。
  function drawWatermark(c, text, w, h, opacity, pos = 'br') {
    if (!text || opacity <= 0) return;
    const fs = Math.max(12, Math.round(h * .032)); c.save();
    c.font = `600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`;
    c.textAlign = pos[1] === 'r' ? 'right' : 'left'; c.textBaseline = pos[0] === 't' ? 'top' : 'bottom'; c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = fs * .3; c.shadowOffsetY = 1;
    c.fillStyle = `rgba(255,255,255,${opacity})`;
    c.fillText(text, pos[1] === 'r' ? w - fs * .6 : fs * .6, pos[0] === 't' ? fs * .5 : h - fs * .5); c.restore();
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
    const S = f => Math.sin(tt * f), C = f => Math.cos(tt * f), A = f => Math.abs(S(f));
    const q = {
      bob: 0, sway: 0, lean: 0, headTilt: 0,
      lThigh: 0, rThigh: 0, lKnee: 0, rKnee: 0, lShin: 0, rShin: 0,
      lArm: .1, rArm: .1, lElb: .15, rElb: .15,
    };
    switch (p.anim) {
      case 'wave':
        Object.assign(q, {bob: .012 * S(2), lean: .04 * Math.sin(tt), rArm: 2.5, rElb: .5 * S(6) + .3, lArm: .12, headTilt: .1 * S(2)});break;
      case 'walk': {
        const w = S(3); Object.assign(q, {lThigh: .55 * w, rThigh: -.55 * w, lKnee: Math.max(0, .7 * Math.sin(tt * 3 + Math.PI / 2)), rKnee: Math.max(0, .7 * Math.sin(tt * 3 - Math.PI / 2)), lArm: .1 - .4 * w, rArm: .1 + .4 * w, bob: .02 * Math.abs(C(3)), sway: .01 * w});break;
      }
      case 'dance': {
        const w = S(4); Object.assign(q, {sway: .05 * w, bob: .03 * Math.abs(w), lArm: 1.2 + .9 * S(4), rArm: 1.2 - .9 * S(4), lElb: .5, rElb: .5, lean: .06 * w, headTilt: .15 * w, lThigh: .15 * w, rThigh: -.15 * w});break;
      }
      case 'jump': {
        const air = Math.sin((tt % 1) * Math.PI); q.bob = .13 * air; q.lThigh = q.rThigh = -.1 * air; q.lKnee = q.rKnee = .9 * air; Object.assign(q, {lArm: .1 - 1.9 * air, rArm: .1 + 1.9 * air, lElb: .3, rElb: .3, lean: .03 * S(4)});// 0→1→0 の放物線で1秒周期の跳躍 // 両腕を上げる
        break;
      }
      case 'nod': {
        // うなずき: 頭を周期的に前後に傾けるあいづち動作
        const n = S(2.4); Object.assign(q, {headTilt: .22 * n, bob: .008 * Math.abs(n), lean: .02 * n, lArm: .1, rArm: .1});break;
      }
      case 'run': {
        // 走る: 歩行の2倍弱の脚回転 + 前傾 + 肘を畳む
        const w = S(5); Object.assign(q, {lThigh: .8 * w, rThigh: -.8 * w, lKnee: Math.max(0, 1.1 * Math.sin(tt * 5 + Math.PI / 2)), rKnee: Math.max(0, 1.1 * Math.sin(tt * 5 - Math.PI / 2)), lArm: .3 - .7 * w, rArm: .3 + .7 * w, lElb: 1.1, rElb: 1.1, bob: .04 * Math.abs(C(5)), lean: .12});break;
      }
      case 'talk': {
        // おしゃべり: ゆるい待機 + 会話っぽい小さな頭の動き(口の開閉は描画側で処理)
        Object.assign(q, {bob: .008 * S(2), lean: .015 * S(1.1), headTilt: .05 * S(2.7), lArm: .08, rArm: .08});break;
      }
      case 'spin': {
        // 回転: X方向スケールは描画側の座標変換で行う。体は腕を広げた軽いバウンス
        Object.assign(q, {bob: .02 * A(2.5), lArm: .35, rArm: .35, lElb: .2, rElb: .2});break;
      }
      case 'bow': {
        // おじぎ: 頭を深く垂れて体ごと少し沈む敬礼動作(1.4s弱周期で往復)
        const b = Math.pow(Math.max(0, S(1.4)), .7); Object.assign(q, {headTilt: b * .55, bob: -b * .05, lArm: .05, rArm: .05, lElb: 0, rElb: 0});break;
      }
      case 'stretch': {
        // 背伸び: 両腕を頭上に伸ばしてゆっくり持ち上がる(顔も上向き)
        const u = .5 + .5 * Math.sin(tt * 1.6 - Math.PI / 2); Object.assign(q, {bob: .05 * u, lArm: -(.1 + 2.5 * u), rArm: .1 + 2.5 * u, lElb: .05, rElb: .05, lean: -.05 * u, headTilt: -.12 * u});q.lKnee = q.rKnee = .06 * u; // 0→1→0 ゆったり // 爪先立ちぎみ
        break;
      }
      case 'sleep': {
        // 居眠り: 3秒周期で頭がゆっくり落ちてハッと戻る
        const cyc = (tt % 3) / 3; const d = cyc < .7 ? Math.pow(cyc / .7, 2) : Math.max(0, 1 - (cyc - .7) / .3); Object.assign(q, {headTilt: d * .4, bob: -d * .02, lean: d * .06, lArm: .06, rArm: .06, lElb: .1, rElb: .1});break;
      }
      case 'flip': {
        // 宙返り: Y反転は描画側の座標変換(cos(t*2.5))で行う。体は浮き上がり+脚タック
        const u = .5 + .5 * S(2.5); q.bob = .08 * u; q.lKnee = q.rKnee = .7 * u; q.lThigh = q.rThigh = -.15 * u; Object.assign(q, {lArm: .5, rArm: .5, lElb: .4, rElb: .4});break;
      }
      case 'clap': {
        // 拍手: 両腕を胸の前で交互に合わせる(2.5Hzの往復)
        const c = S(8); Object.assign(q, {lArm: -.55 + .3 * c, rArm: .55 + .3 * c, lElb: .85, rElb: .85, bob: .015 * Math.abs(c), headTilt: .08 * S(2)});break;
      }
      case 'peek': {
        // のぞき: 4秒周期で体を左右に大きく傾けて交互に覗き込む
        const ph = (tt % 4) / 4; const d = Math.sin(ph * Math.PI * 2); const e = Math.min(1, Math.abs(d) * 2.4); Object.assign(q, {lean: .3 * Math.sign(d) * e, sway: .09 * d, headTilt: -.4 * Math.sign(d) * e, lArm: .14, rArm: .14});// -1..1 で左右往復 // 端で急ぐ滑らかさ // 首は逆に傾げてこちらを覗く
        break;
      }
      case 'cheer': {
        // バンザイ: 両手を頭上に振り上げながら小刻みに跳ねる
        const j = A(4); Object.assign(q, {bob: .09 * j, lArm: -.25 - .6 * j, rArm: .25 + .6 * j, lElb: .25, rElb: .25, lThigh: -.15 * j, rThigh: -.15 * j});q.lKnee = q.rKnee = .5 * j; q.headTilt = .12 * S(2); // 腕は跳ねに合わせて上げ下げ
        break;
      }
      case 'sad': {
        // しょんぼり: うなだれ + 時々ため息(肩が落ちて戻る)
        const sigh = Math.max(0, S(.9)) ** 3; Object.assign(q, {headTilt: .38 + .1 * sigh, lean: .12, bob: -.03 - .02 * sigh, lArm: .16, rArm: .16, lElb: .12, rElb: .12});// 長い周期で0→1
        break;
      }
      case 'sit': {
        // おすわり: 体育座り(膝を抱えてゆらゆら)
        q.lThigh = q.rThigh = -1.1; q.lKnee = q.rKnee = 1.15; Object.assign(q, {lArm: -.9, rArm: .9, lElb: .7, rElb: .7, bob: -.05 + .012 * S(1.6), lean: .08 + .02 * S(1.1), headTilt: .1 * S(.8)});break;
      }
      case 'point': {
        // 指差し: 右腕を前へ突き出してキメる(2秒ごとに左右交互)
        const alt = S(Math.PI) > 0 ? 1 : -1;
        if (alt > 0) { Object.assign(q, {rArm: .95, rElb: .05, lArm: .12});}
        else { Object.assign(q, {lArm: -.95, lElb: .05, rArm: .12});}
        Object.assign(q, {lean: .06 * alt, headTilt: .1 * alt, bob: .015 * S(3)});break;
      }
      case 'shake': {
        // 首振り: 「いやいや」と頭を左右に速く振る
        const w2 = S(7); Object.assign(q, {headTilt: .32 * w2, sway: .02 * w2, lArm: .12, rArm: .12});break;
      }
      case 'sneeze': {
        // くしゃみ: 4秒周期 — ゆっくり身構え→急激な前のめり→戻る
        const cyc = (tt % 4) / 4; const wind = cyc < .55 ? cyc / .55 : 0; const snap = cyc >= .55 && cyc < .68 ? (cyc - .55) / .13 : cyc >= .68 ? Math.max(0, 1 - (cyc - .68) / .32) : 0; Object.assign(q, {lean: -.06 * wind + .3 * snap, headTilt: -.12 * wind + .5 * snap, bob: -.01 * wind - .05 * snap, lArm: .12 + .15 * snap, rArm: .12 + .15 * snap});// 0→1 ゆっくり
        break;
      }
      case 'kick': {
        // キック: 右脚をパルスで突き出す(バランスのため後傾)
        const kk = Math.pow(A(3), 3); Object.assign(q, {rThigh: -1.3 * kk, rKnee: .3, lean: -.12 * kk, lArm: -.3 * kk, rArm: .3 * kk, headTilt: -.08 * kk});break;
      }
      case 'float': {
        // 浮遊: 大きく上下にホバー、脚はだらんと垂れる
        Object.assign(q, {bob: -.09 * S(2), sway: .03 * S(.9), lean: .05 * S(1.4), lArm: .45 + .1 * S(2), rArm: .45 - .1 * S(2), lThigh: .15, rThigh: .18, lKnee: .5, rKnee: .55});break;
      }
      case 'skip': {
        // スキップ: 交互に膝を上げて小刻みに跳ねる
        const ph2 = S(6); Object.assign(q, {bob: -.04 * A(6), lThigh: -.7 * Math.max(0, ph2), lKnee: .9 * Math.max(0, ph2), rThigh: -.7 * Math.max(0, -ph2), rKnee: .9 * Math.max(0, -ph2), lArm: -.35 * ph2, rArm: .35 * ph2});break;
      }
      case 'moonwalk': {
        // ムーンウォーク: 低い膝の交互スライド+後傾で後ろに滑る
        const w = S(4); Object.assign(q, {lThigh: .3 * w, rThigh: -.3 * w, lKnee: Math.max(0, .35 * Math.sin(tt * 4 + Math.PI / 2)), rKnee: Math.max(0, .35 * Math.sin(tt * 4 - Math.PI / 2)), lean: -.08, sway: .02 * w, lArm: .25 - .3 * w, rArm: .25 + .3 * w, lElb: .8, rElb: .8, bob: .015 * Math.abs(C(4))});break;
      }
      case 'salute': {
        // 敬礼: 右腕を額へ(4秒周期で挙げ→保持→下げ)
        const ph2 = (tt % 4) / 4; const k = ph2 < .15 ? ph2 / .15 : ph2 < .75 ? 1 : Math.max(0, 1 - (ph2 - .75) / .25); Object.assign(q, {rArm: .1 - 1.9 * k, rElb: 2.0 * k, headTilt: -.06 * k, lean: .03 * k, lArm: .12, lThigh: .05, rThigh: -.05});break;
      }
      case 'balance': {
        // 片足バランス: 右脚を横に上げ、両腕を広げてフラつく
        const wb = S(3.2); Object.assign(q, {rThigh: -1.1, rKnee: -.4, lArm: 1.35 + .12 * wb, rArm: 1.35 - .12 * wb, lElb: .1, rElb: .1, lean: .09 * wb, sway: .04 * wb, headTilt: -.08 * wb});// 右膝を外側に折る // 水平に広げる
        break;
      }
      case 'guard': {
        // 構え: ボクシングのガード(両拳を顔の前、小刻みに踏む)
        const st = A(5); Object.assign(q, {lArm: .95, rArm: .95, lElb: 1.8, rElb: 1.8, lean: .06, sway: .03 * S(5), lThigh: .15, rThigh: -.15, lKnee: .3, rKnee: .3, bob: .015 * st, headTilt: .04 * S(2.5)});break;
      }
      case 'surf': {
        // サーフィン: 膝を落として横乗り、両腕でバランス(波に揺れる)
        const wv = S(2.4); Object.assign(q, {lean: .18 + .08 * wv, sway: .05 * S(1.6), lThigh: .3, rThigh: -.2, lKnee: .55, rKnee: .5, lArm: 1.1 + .15 * wv, rArm: .6 - .15 * wv, lElb: .3, rElb: .4, headTilt: -.1 * wv, bob: .015 * Math.abs(wv)});break;
      }
      case 'march': {
        // マーチング: 膝を高く交互に上げて腕を大きく振る
        const ph2 = tt * 3.4; const lp = Math.max(0, Math.sin(ph2)), rp = Math.max(0, -Math.sin(ph2)); Object.assign(q, {lThigh: .55 * lp, rThigh: -.55 * rp, lKnee: .9 * lp, rKnee: -.9 * rp, lArm: .7 * lp, rArm: -.7 * rp, lElb: .3, rElb: -.3, bob: .02 * Math.abs(Math.sin(ph2)), lean: .06});break;
      }
      case 'zombie': {
        // ゾンビ: 両腕を前に突き出して左右に揺れながら引き摺る
        const zw = S(1.8); Object.assign(q, {lean: .1 + .05 * zw, sway: .12 * zw, headTilt: .2 * zw, lArm: .9, rArm: .9, lElb: .15, rElb: .15, lThigh: .15 * Math.max(0, zw), rThigh: -.15 * Math.max(0, -zw), lKnee: .3, rKnee: -.3, bob: .01});break;
      }
      case 'robot': {
        // ロボット: 階段状の値でカクカク動く(量子化サイン)
        const rq = (v, s) => Math.round(v * s) / s;
        const ph3 = tt * 2.2; Object.assign(q, {lArm: .5 + .5 * rq(Math.sin(ph3), 2), rArm: .5 + .5 * rq(Math.sin(ph3 + Math.PI / 2), 2), lElb: .8 * rq(Math.sin(ph3 + 1), 2), rElb: .8 * rq(Math.cos(ph3), 2), headTilt: .3 * rq(Math.sin(ph3 * .5), 2), lean: .1 * rq(Math.cos(ph3 * .7), 2), lKnee: .2 * Math.max(0, rq(Math.sin(ph3), 2)), rKnee: -.2 * Math.max(0, -rq(Math.sin(ph3), 2))});break;
      }
      case 'hula': {
        // フラダンス: 腰を円く揺らし、両腕を左右に大きく波打たせる
        const hw = tt * 2.6; Object.assign(q, {sway: .14 * Math.sin(hw), lean: .1 * Math.sin(hw + .5), lArm: .8 + .35 * Math.sin(hw), rArm: .8 - .35 * Math.sin(hw), lElb: .9, rElb: .9, headTilt: .08 * Math.sin(hw + 1), lKnee: .15, rKnee: -.15, bob: .012 * Math.abs(Math.sin(hw * 2))});break;
      }
      case 'yoga': {
        // ヨガ(木のポーズ): 片足立ち+合掌+呼吸する上下
        const br = S(1.4); Object.assign(q, {rThigh: -.9, rKnee: -.9, lArm: 1.5, rArm: 1.5, lElb: 1.4, rElb: 1.4, lean: .04 * br, sway: .05 * S(.9), bob: .02 * br, headTilt: .04 * br});break;
      }
      case 'punch': {
        // パンチ: 交互に前方へジャブ(腕が伸びて戻る)
        const ph4 = tt * 3.2; const lj = Math.max(0, Math.sin(ph4)) ** 3, rj = Math.max(0, -Math.sin(ph4)) ** 3; Object.assign(q, {lArm: .9 + .7 * lj, rArm: .9 + .7 * rj, lElb: 1.6 * (1 - lj), rElb: 1.6 * (1 - rj), lean: .08 + .06 * (lj - rj), headTilt: .05 * (rj - lj), bob: .01 * Math.abs(Math.sin(ph4))});break;
      }
      case 'shuffle': {
        // シャッフル: 高速で膝を交互に上げる走り幅跳び系ステップ
        const ph5 = tt * 9; const ls = Math.sin(ph5) > 0 ? 1 : 0, rs = 1 - ls; Object.assign(q, {lThigh: .5 * ls, rThigh: -.5 * rs, lKnee: .8 * ls, rKnee: -.8 * rs, lArm: .4 * rs, rArm: .4 * ls, lElb: .6, rElb: .6, lean: .08, bob: .025 * Math.abs(Math.sin(ph5))});break;
      }
      case 'lunge': {
        // ランジ: 交互に深く沈み込む前後の脚開き
        const ph6 = tt * 2.2; const ld = Math.max(0, Math.sin(ph6)), rd = Math.max(0, -Math.sin(ph6)); Object.assign(q, {lThigh: .8 * ld, rThigh: -.8 * rd, lKnee: 1.1 * ld, rKnee: -1.1 * rd, bob: -.06 * (ld + rd), lean: .1, lArm: .3, rArm: .3, lElb: .5, rElb: .5});break;
      }
      case 'cossack': {
        // コサック: 腕を組んで脚を交互に前へ蹴り出す
        const ph7 = tt * 4; const lc = Math.sin(ph7) > 0 ? 1 : 0, rc = 1 - lc; Object.assign(q, {lThigh: .7 * lc, rThigh: -.7 * rc, lKnee: .1, rKnee: -.1, lArm: .55, rArm: .55, lElb: 1.5, rElb: 1.5, bob: -.05 + .02 * Math.sin(ph7 * 2), lean: .06});break;
      }
      case 'hop': {
        // ぴょんぴょん: 両足で小刻みに跳ねる(膝を揃えて曲げ伸ばし)
        const hp = A(5); Object.assign(q, {bob: .05 * hp, lKnee: .5 * hp, rKnee: -.5 * hp, lThigh: .2 * hp, rThigh: -.2 * hp, lArm: .25 * hp, rArm: .25 * hp, lElb: .4, rElb: .4, lean: .04});break;
      }
      case 'dab': {
        // ダブ: 右腕を斜め上へ、頭を左肘にうずめる決めポーズ(微振動)
        const db = S(4) * .03; Object.assign(q, {rArm: 1.3 + db, rElb: .3, lArm: .9, lElb: 1.7, headTilt: .5 + db, lean: .12, bob: .015 * A(4)});break;
      }
      case 'side': {
        // サイドステップ: 左右へ交互にステップ、腰を横に揺らす
        const sd = S(3.2); Object.assign(q, {sway: .12 * sd, lean: .08 * sd, lThigh: Math.max(0, sd) * .35, rThigh: -Math.max(0, -sd) * .35, lKnee: Math.max(0, sd) * .25, rKnee: -Math.max(0, -sd) * .25, lArm: .4 + .2 * sd, rArm: .4 - .2 * sd, lElb: .5, rElb: .5});break;
      }
      case 'twist': {
        // ツイスト: 腰を交互にひねるダンス(膝を交互に)
        const tw = S(6); Object.assign(q, {sway: .05 * tw, lThigh: Math.max(0, tw) * .3, rThigh: -Math.max(0, -tw) * .3, lKnee: Math.max(0, tw) * .35, rKnee: -Math.max(0, -tw) * .35, lArm: .5 - .15 * tw, rArm: .5 + .15 * tw, lElb: .8, rElb: .8, lean: .04 * tw, bob: .02 * Math.abs(tw)});break;
      }
      case 'swim': {
        // 泳ぎ(クロール): 交互に回る腕+キックする脚+上下に波打つ体
        const sw = tt * 3; Object.assign(q, {rArm: 1.4 + .9 * Math.sin(sw), rElb: .4, lArm: 1.4 + .9 * Math.sin(sw + Math.PI), lElb: .4, lKnee: .3 * Math.abs(Math.sin(sw)), rKnee: -.3 * Math.abs(Math.sin(sw + Math.PI)), lean: .15, bob: .03 * Math.sin(sw), headTilt: .2});break;
      }
      case 'bodyroll': {
        // ボディロール: 頭→腰へ波が伝わる蛇行ダンス
        const br2 = tt * 2.6; Object.assign(q, {lean: .14 * Math.sin(br2), sway: .1 * Math.sin(br2 - .8), headTilt: .25 * Math.sin(br2 - 1.6), lArm: .45 + .1 * Math.sin(br2 - 1.2), rArm: .45 + .1 * Math.sin(br2 - 1.2), lElb: .6, rElb: .6, bob: .02 * Math.sin(br2 - .5)});break;
      }
      case 'charleston': {
        // チャールストン: 膝を内↔外交互に、腕を左右に振る
        const ch = S(5); Object.assign(q, {lKnee: .3 + .3 * ch, rKnee: -(.3 - .3 * ch), lThigh: .15 * ch, rThigh: -.15 * ch, lArm: .5 - .3 * ch, rArm: .5 + .3 * ch, lElb: .7, rElb: .7, lean: .06 * ch, bob: .02 * Math.abs(ch)});break;
      }
      case 'vogue': {
        // ヴォーグ: 角張った腕のポーズをパキッと切り替える
        const vg = Math.floor(tt * 2.4) % 4; const ease = Math.min(1, (tt * 2.4 % 1) * 6); const poses = [[1.4, .3, .3, 1.5], [.3, 1.4, 1.5, .3], [1.0, 1.0, .9, .9], [.6, .6, 1.6, 1.6]]; const [ra, la, re, le] = poses[vg]; Object.assign(q, {rArm: ra * ease, lArm: la * ease, rElb: re, lElb: le, headTilt: (vg % 2 ? .2 : -.2) * ease, lean: (vg % 2 ? .05 : -.05) * ease});// 速い遷移
        break;
      }
      case 'stomp': {
        // ストンプ: 交互に足を強く踏み下ろす(体ごと沈む)
        const st = tt * 3.4; const lSt = Math.max(0, Math.sin(st)) ** 2; const rSt = Math.max(0, Math.sin(st + Math.PI)) ** 2; Object.assign(q, {lThigh: .5 * lSt, rThigh: -.5 * rSt, lKnee: .6 * lSt, rKnee: -.6 * rSt, bob: -.03 * (lSt + rSt), lean: .06 * Math.sin(st), lArm: .6 - .3 * lSt, rArm: .6 - .3 * rSt, lElb: .8, rElb: .8});break;
      }
      case 'krump': {
        // クランプ: 胸を弾く爆発的な動き+腕を大きく振る
        const kp = S(7); const pop = Math.max(0, S(3.5)) ** 3; Object.assign(q, {bob: -.04 * pop, lean: .1 * kp, lArm: .8 + .4 * kp, rArm: .8 - .4 * kp, lElb: 1.1, rElb: 1.1, lThigh: .2 * pop, rThigh: -.2 * pop, headTilt: .15 * kp});break;
      }
      case 'waltz': {
        // ワルツ: 3拍子のゆったりした起伏+左右ステップ+優雅な腕
        const wz = tt * 2.1; const beat = Math.sin(wz * 3); Object.assign(q, {bob: .03 * beat, sway: .08 * Math.sin(wz), lean: .07 * Math.sin(wz + .5), lArm: .7 + .15 * Math.sin(wz), rArm: .7 - .15 * Math.sin(wz), lElb: .5, rElb: .5, lKnee: .2 * Math.max(0, Math.sin(wz * 3)), rKnee: -.2 * Math.max(0, Math.sin(wz * 3 + Math.PI)), headTilt: .1 * Math.sin(wz)});break;
      }
      case 'tarantella': {
        // タランテラ: 両腕を頭上で振りながら速い足捌き+回るような揺れ
        const ta = tt * 4.5; Object.assign(q, {lArm: 1.3 + .25 * Math.sin(ta), rArm: 1.3 - .25 * Math.sin(ta), lElb: .5, rElb: .5});const lp2 = Math.max(0, Math.sin(ta * 1.5)), rp2 = Math.max(0, Math.sin(ta * 1.5 + Math.PI)); Object.assign(q, {lKnee: .4 * lp2, rKnee: -.4 * rp2, sway: .09 * Math.sin(ta * .5), lean: .06 * Math.sin(ta * .5 + 1), bob: .025 * Math.abs(Math.sin(ta))});break;
      }
      case 'capoeira': {
        // カポエイラ: ジンガ(低い構えで左右に体重移動)+脚の振り
        const cp = tt * 2.8; const gd = Math.sin(cp); Object.assign(q, {sway: .16 * gd, lean: .1 * gd, bob: .05 + .02 * Math.abs(gd), lArm: .5 + .3 * Math.max(0, gd), rArm: .5 + .3 * Math.max(0, -gd), lElb: .6, rElb: .6});// 交互に脚を前へ振る
        Object.assign(q, {lThigh: .4 * Math.max(0, -gd), rThigh: -.4 * Math.max(0, gd), lKnee: .3 * Math.max(0, -gd), rKnee: -.3 * Math.max(0, gd), headTilt: -.06 * gd});break;
      }
      case 'belly': {
        // ベリーダンス: 腰の8の字+蛇行する腕
        const bd = tt * 3.4; Object.assign(q, {sway: .1 * Math.sin(bd), bob: .02 * Math.abs(Math.sin(bd * 2)), lArm: .9 + .35 * Math.sin(bd * .8), rArm: .9 - .35 * Math.sin(bd * .8), lElb: .4 + .3 * Math.sin(bd * .8 + 1), rElb: .4 - .3 * Math.sin(bd * .8 + 1), lKnee: .15 * Math.max(0, Math.sin(bd)), rKnee: -.15 * Math.max(0, -Math.sin(bd)), headTilt: .06 * Math.sin(bd * .5)});break;
      }
      case 'flamenco': {
        // フラメンコ: 片腕を頭上に掲げて誇らしげ+リズムに合わせ踏み鳴らす
        const fm = tt * 3.8; const st = Math.max(0, Math.sin(fm * 2)) ** 2; Object.assign(q, {rArm: 1.45, rElb: .3, lArm: .55, lElb: 1.1, lean: -.04, rKnee: -.4 * st, lKnee: .1, bob: -.025 * st, headTilt: -.06, sway: .03 * Math.sin(fm * .7)});break;
      }
      case 'samba': {
        // サンバ: 高速の腰バウンス+交互に前後する腕
        const sb = tt * 6; Object.assign(q, {bob: .035 * Math.abs(Math.sin(sb)), sway: .05 * Math.sin(sb * .5), lArm: .6 + .5 * Math.sin(sb * .5), rArm: .6 - .5 * Math.sin(sb * .5), lElb: .7, rElb: .7, lKnee: .25 * Math.max(0, Math.sin(sb)), rKnee: -.25 * Math.max(0, -Math.sin(sb)), headTilt: .05 * Math.sin(sb * .5)});break;
      }
      case 'tango': {
        // タンゴ: スタッカートのステップ+鋭い頭の切り替えし
        const tg = tt * 3.2; const snap = Math.floor(tg / Math.PI) % 2 ? 1 : -1; const ease = Math.min(1, (tg % Math.PI) * 4); Object.assign(q, {headTilt: .25 * snap * ease, sway: .08 * snap, lean: .05 * snap, lArm: .5 + .2 * snap, rArm: .5 - .2 * snap, lElb: .9, rElb: .9});// 半周期ごとに反転 // 始めに速く止まる
        // 断続的な脚の運び
        Object.assign(q, {lThigh: .3 * Math.max(0, snap * Math.sin(tg * 2)), rThigh: -.3 * Math.max(0, -snap * Math.sin(tg * 2)), bob: .015 * Math.abs(Math.sin(tg * 2))});break;
      }
      case 'swing': {
        // スウィング(リンディ): 弾むキックステップ+全身のバウンス
        const sw = tt * 4.2; const k = Math.sin(sw); Object.assign(q, {bob: .04 * Math.abs(Math.sin(sw * .5)), sway: .07 * k, lKnee: .35 * Math.max(0, k), rKnee: -.35 * Math.max(0, -k), lThigh: .2 * Math.max(0, k), rThigh: -.2 * Math.max(0, -k), lArm: .55 + .3 * k, rArm: .55 - .3 * k, lElb: .6, rElb: .6, lean: .04 * k});break;
      }
      case 'polka': {
        // ポルカ: 3歩+ホップの弾むリズム
        const pk = tt * 3.6; const ph = pk % (Math.PI * 2); const hop2 = ph > Math.PI * 1.5 ? Math.sin((ph - Math.PI * 1.5) * 4) : 0; q.bob = .04 * Math.abs(hop2) + .015 * Math.abs(Math.sin(pk)); const st2 = Math.sin(pk); Object.assign(q, {lKnee: .35 * Math.max(0, st2), rKnee: -.35 * Math.max(0, -st2), sway: .08 * st2, lArm: .5 + .25 * st2, rArm: .5 - .25 * st2, lElb: .5, rElb: .5, lean: .05 * st2, headTilt: .06 * st2});break;
      }
      case 'foxtrot': {
        // フォックストロット: 滑らかなスローステップ+わずかな昇降
        const fx = tt * 2.4; const rise = Math.sin(fx); Object.assign(q, {bob: .02 * rise, sway: .1 * Math.sin(fx * .5), lean: .06 * Math.sin(fx * .5 + .7), lArm: .65 + .1 * Math.sin(fx * .5), rArm: .65 - .1 * Math.sin(fx * .5), lElb: .4, rElb: .4, lThigh: .15 * Math.max(0, Math.sin(fx)), rThigh: -.15 * Math.max(0, -Math.sin(fx)), lKnee: .1 * Math.max(0, Math.sin(fx)), rKnee: -.1 * Math.max(0, -Math.sin(fx)), headTilt: .05 * Math.sin(fx * .5)});break;
      }
      case 'chacha': {
        // チャチャ: 速い横ステップ(チャチャチャ)+腰の切れ
        const cc = tt * 4.4; const step = Math.sin(cc); const trip = Math.sign(Math.sin(cc * 1.5)) * Math.min(1, Math.abs(Math.sin(cc * 1.5)) * 3); Object.assign(q, {sway: .1 * trip, bob: .02 * Math.abs(step), lKnee: .3 * Math.max(0, step), rKnee: -.3 * Math.max(0, -step), lArm: .55 + .35 * step, rArm: .55 - .35 * step, lElb: .6, rElb: .6, lean: .04 * trip});// 3連ステップ感
        break;
      }
      case 'pasodoble': {
        // パソドブレ: 両腕を頭上に構えて力強く踏み回る
        const pd = tt * 2.2; const stamp = Math.max(0, Math.sin(pd * 2)) ** .5; Object.assign(q, {lArm: -.9 + .1 * Math.sin(pd), rArm: .9 - .1 * Math.sin(pd), lElb: -.4, rElb: -.4, lKnee: .3 * stamp, rKnee: -.3 * stamp, bob: .03 * stamp, lean: .08 * Math.sin(pd), spin: .15 * Math.sin(pd * .5), headTilt: .1 * Math.sin(pd * .5 + 1)});// 腕を頭上で湾曲 // ゆるい旋回 // 誇らしげな顔上げ
        break;
      }
      case 'cancan': {
        // カンカン: 交互に高く蹴り上げる+腕を横に広げる
        const cn = tt * 5; const kick = Math.max(0, Math.sin(cn)); Object.assign(q, {lThigh: -.1 - 1.1 * Math.max(0, Math.sin(cn)), rThigh: -.1 - 1.1 * Math.max(0, -Math.sin(cn)), lKnee: .4, rKnee: .4, lArm: -1.2, rArm: 1.2, lElb: -.15, rElb: -.15, bob: .04 * kick, lean: .06 * Math.sin(cn)});// 左脚キック // 腕を横にピンと広げる
        break;
      }
      case 'mazurka': {
        // マズルカ: ホップ+かかと打ち+優雅な腕
        const mz = tt * 3; const beat = Math.sin(mz * 3); const hop = Math.max(0, Math.sin(mz)); Object.assign(q, {bob: .05 * hop, lThigh: -.15 + .25 * Math.sin(mz * 1.5), rThigh: -.15 - .25 * Math.sin(mz * 1.5), lKnee: .5 * Math.max(0, Math.sin(mz * 1.5)), rKnee: .5 * Math.max(0, -Math.sin(mz * 1.5)), lArm: -.6 - .3 * Math.sin(mz), rArm: .6 - .3 * Math.sin(mz), lElb: -.5, rElb: -.5, lean: .06 * beat, headTilt: .08 * beat});// 3拍子
        break;
      }
      case 'minuet': {
        // メヌエット: ゆったり3拍子の淑やかなステップ+カーテシー気味の膝曲げ
        const mn = tt * 1.8; const step = Math.sin(mn); const curtsey = Math.max(0, Math.sin(mn * .5 + Math.PI / 4)) ** 2; Object.assign(q, {bob: .015 * Math.abs(step) - .06 * curtsey, lThigh: -.1 - .18 * Math.max(0, step), rThigh: -.1 - .18 * Math.max(0, -step), lKnee: .25 + .4 * curtsey, rKnee: .25 + .4 * curtsey, lArm: -.35 - .2 * step, rArm: .35 - .2 * step, lElb: -.65, rElb: -.65, lean: .03 * step, headTilt: .06 * Math.sin(mn * .5)});// 周期末に深くお辞儀 // 腕を優雅に円く保持 // 淑やかな首
        break;
      }
      case 'bolero': {
        // ボレロ: ゆったりした旋回+片腕を頭上に掲げる優雅な動き
        const bo = tt * 1.4; const rise = Math.sin(bo * .5); Object.assign(q, {lArm: -.4 - .9 * Math.max(0, rise), rArm: .4 + .2 * Math.sin(bo), lElb: -.5 - .3 * Math.max(0, rise), rElb: -.4, spin: .2 * Math.sin(bo * .5), sway: .06 * Math.sin(bo), bob: .02 * Math.abs(Math.sin(bo * 1.5)), lKnee: .15, rKnee: .15, headTilt: -.08 * Math.max(0, rise), lean: .04 * Math.sin(bo * .5)});// 左腕がゆっくり上がる // ゆるい旋回 // 掲げた腕を仰ぐ
        break;
      }
      case 'sirtaki': {
        // シルタキ: ゆっくり始まり加速する横ステップ+腕を伸ばす
        const sk = tt * (1.6 + Math.min(1, tt % 8 / 6) * 2.4); const st = Math.sin(sk); Object.assign(q, {sway: .14 * st, bob: .035 * Math.abs(st), lThigh: -.12 - .22 * Math.max(0, st), rThigh: -.12 - .22 * Math.max(0, -st), lKnee: .35 * Math.max(0, st), rKnee: .35 * Math.max(0, -st), lArm: -.95, rArm: .95, lElb: -.1, rElb: -.1, lean: .05 * st});// 段々速く // 両腕を横に伸ばして肩を組む
        break;
      }
      case 'reel': {
        // リール: 速い足捌き+回り込み+腰に手(スコットランド舞踏)
        const rl = tt * 5.2; const st = Math.sin(rl); Object.assign(q, {lThigh: -.1 - .3 * Math.max(0, st), rThigh: -.1 - .3 * Math.max(0, -st), lKnee: .5 * Math.max(0, st), rKnee: .5 * Math.max(0, -st), bob: .045 * Math.abs(st), sway: .1 * Math.sin(rl * .5), spin: .3 * Math.sin(rl * .25), lArm: -.35, rArm: .35, lElb: -.9, rElb: -.9});// 輪を描いて回り込む // ゆるい旋回 // 腰に手
        break;
      }
      case 'hora': {
        // ホラ: 輪になり横ステップを繰り返す+跳ねる膝
        const hr2 = tt * 3.4; const st = Math.sin(hr2); Object.assign(q, {sway: .16 * Math.sin(hr2 * .5), lThigh: -.1 - .35 * Math.max(0, st), rThigh: -.1 - .35 * Math.max(0, -st), lKnee: .55 * Math.max(0, st), rKnee: .55 * Math.max(0, -st), bob: .05 * Math.abs(st), lArm: -.85, rArm: .85, lElb: -.2, rElb: -.2, spin: .25 * Math.sin(hr2 * .5)});// 輪を周る移動 // 隣と肩を組む腕
        break;
      }
      case 'gavotte': {
        // ガヴォット: 4拍子の跳ねる歩み+片脚を上げて回る
        const gv = tt * 3.2; const hop = Math.max(0, Math.sin(gv * 2)); Object.assign(q, {bob: .06 * hop, lThigh: -.1 - .5 * Math.max(0, Math.sin(gv * 2 - 1)), rThigh: -.1 - .3 * Math.max(0, -Math.sin(gv * 2)), lKnee: .6 * Math.max(0, Math.sin(gv * 2 - 1)), rKnee: .4, lArm: -.5 - .4 * Math.sin(gv * .5), rArm: .5 - .4 * Math.sin(gv * .5), lElb: -.6, rElb: -.6, lean: .07 * Math.sin(gv), headTilt: .08 * Math.sin(gv + 1)});// 脚を高く
        break;
      }
      case 'czardas': {
        // チャルダッシュ: 前半ラッサン(緩)→後半フリス(速)の脚捌き
        const slow = (tt % 10) < 5; const cz = tt * (slow ? 1.8 : 4.6); const st = Math.sin(cz); Object.assign(q, {lThigh: -.12 - .35 * Math.max(0, st), rThigh: -.12 - .35 * Math.max(0, -st), lKnee: .5 * Math.max(0, st), rKnee: .5 * Math.max(0, -st), bob: .04 * Math.abs(st), sway: .1 * st, lArm: slow ? -.4 : -.7, rArm: slow ? .4 : .7, lElb: slow ? -.8 : -.4, rElb: slow ? -.8 : -.4, lean: .06 * st});// 腰手→胸上げ
        break;
      }
      case 'morris': {
        // モリスダンス: ホップ+手ぬぐいを振る両腕の交互上げ
        const mr = tt * 3.6; const hop = Math.max(0, Math.sin(mr)); const arm = Math.floor(mr / Math.PI) % 2 ? 1 : -1; Object.assign(q, {bob: .05 * hop, lThigh: -.08 - .3 * Math.max(0, Math.sin(mr - .8)), rThigh: -.08 - .3 * Math.max(0, Math.sin(mr + .8)), lKnee: .5 * Math.max(0, Math.sin(mr - .8)), rKnee: .5 * Math.max(0, Math.sin(mr + .8)), lArm: -.5 - .9 * Math.max(0, arm), rArm: -.5 - .9 * Math.max(0, -arm), lElb: -.3, rElb: -.3, sway: .08 * Math.sin(mr * .5), headTilt: .07 * Math.sin(mr)});// 手ぬぐいを高く
        break;
      }
      case 'jig': {
        // ジグ: 上体は硬く直立、足だけ高速で交互に蹴る
        const jg = tt * 7; const st = Math.sin(jg); Object.assign(q, {lThigh: -.15 - .5 * Math.max(0, st), rThigh: -.15 - .5 * Math.max(0, -st), lKnee: .8 * Math.max(0, st), rKnee: .8 * Math.max(0, -st), bob: .03 * Math.abs(st), lArm: -.35, rArm: -.35, lElb: -1, rElb: -1, lean: 0, sway: 0, headTilt: .03 * Math.sin(jg * .25)});// 腰に手 // 上体固定
        break;
      }
      case 'bourree': {
        // ブーレ: つま先で刻む小さな横ステップ+腕を流れるように
        const br = tt * 4.4; const st = Math.sin(br); const drift = S(.8) * .12; Object.assign(q, {sway: .1 * st, bob: .025 * Math.abs(st), lThigh: -.15 - .2 * Math.max(0, st), rThigh: -.15 - .2 * Math.max(0, -st), lKnee: .25 + .15 * Math.max(0, st), rKnee: .25 + .15 * Math.max(0, -st), lArm: -.9 - .3 * Math.sin(br * .5), rArm: -.9 - .3 * Math.sin(br * .5 + 1.5), lElb: -.5, rElb: -.5, lean: .05 * st + drift * .3, headTilt: .06 * Math.sin(br * .5)});// 横への流れ // つま先立ち気味(膝小さめ) // 優雅な流れる腕
        break;
      }
      case 'sarabande': {
        // サラバンド: 緩やかで威厳ある3拍子、意図的な体重移動+ゆっくり回る腕
        const sb = tt * 1.6; const st = Math.sin(sb); const shift = Math.sin(sb * .5); Object.assign(q, {sway: .14 * shift, lean: .09 * shift, bob: .03 * Math.abs(st), lThigh: -.12 - .25 * Math.max(0, st), rThigh: -.12 - .25 * Math.max(0, -st), lKnee: .35 * Math.max(0, st), rKnee: .35 * Math.max(0, -st), lArm: -.7 - .5 * Math.sin(sb * .5 + .6), rArm: -.7 - .5 * Math.sin(sb * .5 + 2), lElb: -.4, rElb: -.4, headTilt: .08 * shift});// 左右に大きく重心移動 // ゆっくり回る腕
        break;
      }
      case 'pavane': {
        // パヴァーヌ: 滑るような行進歩み+緩やかな昇降+格式ある姿勢
        const pv = tt * 1.4; const st = Math.sin(pv); const rise = Math.sin(pv * .5); Object.assign(q, {bob: .035 * Math.abs(rise), sway: .06 * st, lThigh: -.1 - .18 * Math.max(0, st), rThigh: -.1 - .18 * Math.max(0, -st), lKnee: .2 * Math.max(0, st), rKnee: .2 * Math.max(0, -st), lArm: -.55 - .15 * st, rArm: -.55 - .15 * st, lElb: -.2, rElb: -.2, lean: .04 * st, headTilt: .04 * Math.sin(pv * .5)});// 2拍に1回の昇降 // 膝を控えめに(滑る歩み) // 前に伸ばした儀礼的な腕
        break;
      }
      case 'allemande': {
        // アルマンド: 優美な歩み+頭上で組んだ腕の円弧+軽い揺れ
        const al = tt * 2; const st = Math.sin(al); Object.assign(q, {lThigh: -.15 - .25 * Math.max(0, st), rThigh: -.15 - .25 * Math.max(0, -st), lKnee: .4 * Math.max(0, st), rKnee: .4 * Math.max(0, -st), bob: .03 * Math.abs(st), sway: .09 * st, lArm: -1.6 - .15 * Math.sin(al * .5), rArm: -1.6 - .15 * Math.sin(al * .5 + .8), lElb: -.9, rElb: -.9, lean: .05 * st, headTilt: .07 * Math.sin(al * .5 + .4)});// 頭上の円弧 // 肘を深く曲げて組む
        break;
      }
      case 'courante': {
        // クーラント: 軽やかな小走りの歩み+小さな跳躍(バロック舞曲)
        const cr = tt * 3.4; const st = Math.sin(cr); const jump = Math.max(0, Math.sin(cr * .5)); Object.assign(q, {bob: .07 * jump, lThigh: -.15 - .4 * Math.max(0, st), rThigh: -.15 - .4 * Math.max(0, -st), lKnee: .55 * Math.max(0, st), rKnee: .55 * Math.max(0, -st), sway: .07 * st, lArm: -.6 - .3 * st, rArm: -.6 - .3 * st, lElb: -.35, rElb: -.35, lean: .05 * st, headTilt: .06 * Math.sin(cr * .5)});// 2拍に1回の小跳躍 // 軽く振れる腕
        break;
      }
      case 'rigaudon': {
        // リゴドン: 陽気なホップ+交互に踵を突き出す
        const rg = tt * 4; const st = Math.sin(rg); const hop = Math.abs(Math.sin(rg * .5)); Object.assign(q, {bob: .06 * hop, lThigh: -.2 - .35 * Math.max(0, st), rThigh: -.2 - .35 * Math.max(0, -st), lKnee: .15 * Math.max(0, st), rKnee: .15 * Math.max(0, -st), sway: .08 * st, lArm: -.5 - .4 * Math.sin(rg * .5), rArm: -.5 - .4 * Math.sin(rg * .5 + 1), lElb: -.5, rElb: -.5, lean: .06 * st, headTilt: .08 * Math.sin(rg * .5)});// 踵を前に突き出す(膝を伸ばし気味)
        break;
      }
      case 'passepied': {
        // パスピエ: 3/8拍子の速い小ステップ+頭上に挙げた腕
        const ps = tt * 4.8; const st = Math.sin(ps); Object.assign(q, {lThigh: -.15 - .3 * Math.max(0, st), rThigh: -.15 - .3 * Math.max(0, -st), lKnee: .4 * Math.max(0, st), rKnee: .4 * Math.max(0, -st), bob: .035 * Math.abs(st), sway: .08 * st, lArm: -1.3 - .25 * Math.sin(ps * .5), rArm: -1.3 - .25 * Math.sin(ps * .5 + 1.2), lElb: -.6, rElb: -.6, lean: .05 * st, headTilt: .06 * Math.sin(ps * .33)});// 頭上に優雅に
        break;
      }
      case 'hambo': {
        // ハンボ: 3/4拍子+1拍目の深い沈み+旋回(スウェーデンの民俗ダンス)
        const hb = tt * 3.4; const beat = Math.floor(hb) % 3; const dip = beat === 0 ? .06 : .02; const st = Math.sin(hb * Math.PI * 2 / 3); Object.assign(q, {bob: dip * (0.5 + 0.5 * Math.sin(hb)), lean: .12 * Math.sin(hb * .66), spin: .35 * Math.sin(hb * .22), lArm: -.9 - .3 * Math.sin(hb * .5), rArm: -.9 - .3 * Math.sin(hb * .5 + .8), lElb: -.45, rElb: -.45, lThigh: -.1 - .2 * Math.max(0, st), rThigh: -.1 - .2 * Math.max(0, -st), sway: .07 * st, headTilt: .05 * Math.sin(hb * .4)});// 1拍目に深く沈む // ゆっくり旋回
        break;
      }
      case 'galliard': {
        // ガリアード: サンクパス(4回の交互キック+最後の跳躍)
        const gl = tt * 4.4; const step = gl % 5; const kick = Math.sin(step * Math.PI); const side = Math.floor(gl / 5) % 2 === 0 ? 1 : -1; const leap = step > 4 ? 1 : 0; Object.assign(q, {lThigh: side > 0 ? -.3 - .5 * Math.max(0, kick) : -.15, rThigh: side < 0 ? -.3 - .5 * Math.max(0, kick) : -.15, lKnee: .5 * Math.max(0, kick), rKnee: .5 * Math.max(0, kick), bob: .1 * leap * Math.sin((step - 4) * Math.PI), sway: .1 * side, lArm: -.7 - .5 * side * kick, rArm: -.7 - .5 * -side * kick, lElb: -.4, rElb: -.4, headTilt: .06 * side, spin: .1 * side * leap});// 左右交互
        break;
      }
      case 'saltarello': {
        // サルタレッロ: 連続する小跳躍+交互に後ろへ蹴り上げる脚
        const sa = tt * 5.2; const hop = Math.abs(Math.sin(sa)); const st = Math.sin(sa); Object.assign(q, {bob: .07 * hop, lKnee: .55 * Math.max(0, st), rKnee: .55 * Math.max(0, -st), lThigh: -.1 - .15 * Math.max(0, st), rThigh: -.1 - .15 * Math.max(0, -st), sway: .09 * st, lArm: -.6 - .45 * Math.sin(sa * .5), rArm: -.6 - .45 * Math.sin(sa * .5 + Math.PI), lElb: -.5, rElb: -.5, lean: .06 * st, headTilt: .05 * Math.sin(sa * .7)});// 左膝を後ろへ折る
        break;
      }
      case 'bransle': {
        // ブランル: 連なって左右に揺れる横ステップ+小さなキック
        const br = tt * 3.6; const st = Math.sin(br); Object.assign(q, {sway: .16 * st, lean: .1 * st, lThigh: -.1 - .2 * Math.max(0, st), rThigh: -.1 - .2 * Math.max(0, -st), lKnee: .3 * Math.max(0, -st), rKnee: .3 * Math.max(0, st), bob: .03 * Math.abs(st), lArm: -.4 - .25 * st, rArm: -.4 - .25 * -st, lElb: -.3, rElb: -.3, headTilt: .08 * st});// 大きく左右に揺れる // 揺れと逆側に小キック
        break;
      }
      case 'farandole': {
        // ファランドール: 手を繋いで連なり弾む走りステップ
        const fa = tt * 5.5; const st = Math.sin(fa); Object.assign(q, {bob: .06 * Math.abs(st), lThigh: -.2 - .35 * Math.max(0, st), rThigh: -.2 - .35 * Math.max(0, -st), lKnee: .45 * Math.max(0, -st), rKnee: .45 * Math.max(0, st), sway: .11 * st, lArm: -.9, rArm: -.9, lElb: -.2, rElb: -.2, lean: .08 * st, spin: .12 * Math.sin(fa * .3), headTilt: .05 * st});// 小さく弾む // 両側の手を繋ぐように伸ばす // 列が蛇行する感じ
        break;
      }
      case 'canarie': {
        // カナリー: 速い足踏み+小跳躍(カナリア諸島発の宮廷舞踊)
        const cn = tt * 6.4; const st = Math.sin(cn); Object.assign(q, {lThigh: -.25 - .4 * Math.max(0, st), rThigh: -.25 - .4 * Math.max(0, -st), lKnee: .5 * Math.max(0, st), rKnee: .5 * Math.max(0, -st), bob: .05 * Math.abs(st) + .04 * Math.max(0, Math.sin(cn * .5)), sway: .07 * st, lArm: -.5 - .5 * Math.sin(cn * .5), rArm: -.5 - .5 * Math.sin(cn * .5 + Math.PI), lElb: -.55, rElb: -.55, lean: .05 * st, headTilt: .04 * Math.sin(cn * .8)});// 踏み+跳ね
        break;
      }
      case 'volta': {
        // ヴォルタ(ラ・ヴォルタ): 回りながら跳ねるエリザベス朝の舞踊
        const vo = tt * 4.2; const st = Math.sin(vo); Object.assign(q, {spin: .9 * Math.sin(vo * .25), bob: .08 * Math.abs(st), lThigh: -.3 - .3 * Math.max(0, st), rThigh: -.3 - .3 * Math.max(0, -st), lKnee: .4 * Math.max(0, -st), rKnee: .4 * Math.max(0, st), lArm: -1.1 - .3 * st, rArm: -1.1 - .3 * -st, lElb: -.5, rElb: -.5, lean: .1 * st, headTilt: .07 * Math.sin(vo * .5)});// 大きく旋回 // 相手を抱えるように高い腕
        break;
      }
      case 'jota': {
        // ホタ: カスタネットを鳴らす頭上の腕+小さな跳躍ステップ(アラゴン)
        const jo = tt * 5.8; const st = Math.sin(jo); Object.assign(q, {bob: .055 * Math.abs(st), lThigh: -.2 - .3 * Math.max(0, st), rThigh: -.2 - .3 * Math.max(0, -st), lKnee: .4 * Math.max(0, -st), rKnee: .4 * Math.max(0, st), lArm: -2.3 + .25 * Math.sin(jo * 2), rArm: -2.3 - .25 * Math.sin(jo * 2), lElb: -.9, rElb: -.9, sway: .08 * st, spin: .2 * Math.sin(jo * .3), headTilt: .06 * Math.sin(jo * .6)});// 頭上でカスタネット
        break;
      }
      case 'fandango': {
        // ファンダンゴ: カスタネットの腕を大きく回す求愛の踊り+回転
        const fd = tt * 4.6; const st = Math.sin(fd); Object.assign(q, {spin: .5 * Math.sin(fd * .35), bob: .05 * Math.abs(st), lThigh: -.15 - .3 * Math.max(0, st), rThigh: -.15 - .3 * Math.max(0, -st), lKnee: .35 * Math.max(0, -st), rKnee: .35 * Math.max(0, st), lArm: -1.8 - .5 * Math.sin(fd), rArm: -1.8 - .5 * Math.sin(fd + Math.PI), lElb: -.7, rElb: -.7, sway: .1 * st, lean: .07 * st, headTilt: .08 * Math.sin(fd * .5)});// 近づいたり離れたり // 頭上で大きく回る
        break;
      }
      case 'zapateado': {
        // サパテアド: 打楽器的な速い足踏み+腰を据えた姿勢
        const zp = tt * 7.2; const st = Math.sin(zp); Object.assign(q, {lThigh: -.28 - .35 * Math.max(0, st), rThigh: -.28 - .35 * Math.max(0, -st), lKnee: .3 * Math.max(0, st), rKnee: .3 * Math.max(0, -st), bob: .025 * Math.abs(st), lArm: -.35 - .15 * st, rArm: -.35 - .15 * -st, lElb: -.25, rElb: -.25, sway: .05 * st, lean: .04 * st, headTilt: .03 * Math.sin(zp * .5)});// 踵を打ち鳴らす // 上体は安定 // 腰の近くで押さえる
        break;
      }
      case 'korobushka': {
        // コロブーシュカ: ロシア民謡の購けやかな足踏み+胸の前で組む手
        const kb = tt * 5.5; const st = Math.sin(kb); Object.assign(q, {lThigh: -.55 * Math.max(0, st), rThigh: -.55 * Math.max(0, -st), lKnee: .4 * Math.max(0, -st), rKnee: .4 * Math.max(0, st), lArm: -.7 - .25 * st, rArm: -.7 - .25 * -st, lElb: -.8, rElb: -.8, bob: .03 * Math.abs(st), sway: .08 * st, lean: .05 * st, spin: .15 * Math.sin(kb * .4), headTilt: .05 * Math.sin(kb * .5)});// 前腕を上げる // 胸前で組む
        break;
      }
      case 'trepak': {
        // トレパク: 組み腕+交互に脚を蹴り出すロシア踊り
        const tp = tt * 5.8; const st = Math.sin(tp); Object.assign(q, {lThigh: -.5 * Math.max(0, st) - .15, rThigh: -.5 * Math.max(0, -st) - .15, lKnee: .1, rKnee: .1, lArm: -.55, rArm: -.55, lElb: -.9, rElb: -.9, bob: .02 + .04 * Math.abs(st), sway: .07 * st, lean: .06 * st, spin: .1 * Math.sin(tp * .5), headTilt: .04 * st});// 蹴り出し脚は伸びる // 腰/胸の前で組む // キックに合わせて沈む // 徐々に回る
        break;
      }
      case 'legenyes': {
        // レゲーニェシュ: ルーマニアの男性踊り — 踵を打ち合わせ+脚を弾く
        const lg = tt * 6.0; const st = Math.sin(lg); const click = Math.max(0, Math.sin(lg * 2)); Object.assign(q, {lThigh: -.4 * Math.max(0, st) - .1, rThigh: -.4 * Math.max(0, -st) - .1, lKnee: .35 * Math.max(0, -st), rKnee: .35 * Math.max(0, st), bob: .05 * click, lArm: -.6 - .2 * st, rArm: -.6 - .2 * -st, lElb: -.55, rElb: -.55, sway: .08 * st, lean: .04 * st, spin: .12 * Math.sin(lg * .33), headTilt: .05 * st});// 踵打ちフェーズ // ジャンプして踵を合わせる // 腰に手+時々上げる
        break;
      }
      case 'kalamatianos': {
        // カラマティアノス: ギリシャの7/8輪踊り — 連なって横に流れる
        const kl = tt * 4.6; const st = Math.sin(kl); const ph = tt * 2.2; Object.assign(q, {lThigh: -.35 * Math.max(0, st) - .05, rThigh: -.35 * Math.max(0, -st) - .05, lKnee: .3 * Math.max(0, -st), rKnee: .3 * Math.max(0, st), lArm: -.9, rArm: -.9, lElb: -.25, rElb: -.25, bob: .03 * Math.abs(st), sway: .12 * st, lean: .06 * st, spin: .3 * Math.sin(ph), headTilt: .06 * Math.sin(kl * .5)});// 周回位相 // 両腕を広げて隣と繋ぐ // 連れて大きく揺れる // 輪を周る向きの変化
        break;
      }
      case 'kolo': {
        // コロ: セルビアの輪踊り — 小刻みな横ステップ+膝の弾み
        const ko = tt * 5.2; const st = Math.sin(ko); Object.assign(q, {lThigh: -.3 * Math.max(0, st), rThigh: -.3 * Math.max(0, -st), lKnee: .35 * Math.abs(st), rKnee: .35 * Math.abs(st), lArm: -.75, rArm: -.75, lElb: -.5, rElb: -.5, bob: .04 * Math.abs(Math.sin(ko * 1.5)), sway: .1 * st, lean: .05 * st, spin: .25 * S(2.0), headTilt: .05 * Math.sin(ko * .5)});// 膝の弾み // 腰に繋ぐ腕
        break;
      }
      case 'dabke': {
        // ダブケ: レバントの連踊り — 強い踏み込み+跳ね上げる脚
        const dk2 = tt * 5.0; const st = Math.sin(dk2); Object.assign(q, {lThigh: -.5 * Math.max(0, st), rThigh: -.5 * Math.max(0, -st), lKnee: .5 * Math.max(0, -st), rKnee: .5 * Math.max(0, st), bob: .045 * Math.abs(st), lArm: -.85, rArm: -.85, lElb: -.35, rElb: -.35, sway: .09 * st, lean: .07 * st, spin: .2 * S(1.8), headTilt: .05 * st});// 踏み込みの沈み // 肩を組む腕
        break;
      }
      case 'sardana': {
        // サルダナ: カタルーニャの輪踊り — 挙げた腕+軽やかな足運び
        const sd = tt * 4.0; const st = Math.sin(sd); Object.assign(q, {lThigh: -.3 * Math.max(0, st), rThigh: -.3 * Math.max(0, -st), lKnee: .3 * Math.max(0, -st), rKnee: .3 * Math.max(0, st), lArm: -1.5 - .2 * st, rArm: -1.5 - .2 * -st, lElb: -.2, rElb: -.2, bob: .025 * Math.abs(st), sway: .1 * st, lean: .04 * st, spin: .35 * S(1.6), headTilt: .04 * Math.sin(sd * .5)});// 肩より高く円を作る腕 // 輪の周回
        break;
      }
      case 'zeybek': {
        // ゼイベク: トルコの勇士踊り — 鷹のように横に張った腕+ゆっくり膝を深く
        const zb = tt * 3.6; const st = Math.sin(zb); Object.assign(q, {lArm: -1.15, rArm: -1.15, lElb: -.1, rElb: -.1, lThigh: -.45 * Math.max(0, st), rThigh: -.45 * Math.max(0, -st), lKnee: .55 * Math.abs(st), rKnee: .55 * Math.abs(st), bob: .05 * Math.abs(st), sway: .12 * st, lean: .1 * st, spin: .18 * S(1.4), headTilt: .06 * st});// 水平に張る腕 // 片膝を深く // 深く沈む // 左右に大きく寄せる
        break;
      }
      case 'tsamiko': {
        // ツァーミコ: ギリシャの男踊り — 高い跳躍+ゆっくり脚を振り上げる
        const ts = tt * 4.2; const st = Math.sin(ts); const leap = Math.max(0, Math.sin(ts * .5)); Object.assign(q, {lThigh: -.7 * Math.max(0, st), rThigh: -.7 * Math.max(0, -st), lKnee: .2 * Math.max(0, st), rKnee: .2 * Math.max(0, -st), bob: -.06 * leap, lArm: -1.3 - .3 * st, rArm: -1.3 - .3 * -st, lElb: -.15, rElb: -.15, sway: .1 * st, lean: .08 * st, spin: .4 * leap * Math.sin(ts * .25), headTilt: .05 * st});// 緩急 // 高く跳ぶ // 跳躍で旋回
        break;
      }
      case 'seguidilla': {
        // セギディーリャ: スペインのカスタネット踊り — 速い3拍子の足捌き+頭上の腕
        const sg = tt * 6; const st = Math.sin(sg); const beat = Math.sin(sg * 1.5); Object.assign(q, {lArm: -1.5 + .2 * st, rArm: -1.5 + .2 * -st, lElb: -.5, rElb: -.5, lThigh: -.2 * Math.max(0, beat), rThigh: -.2 * Math.max(0, -beat), lKnee: .15 * Math.abs(beat), rKnee: .15 * Math.abs(beat), bob: -.015 * Math.abs(st), sway: .06 * st, lean: .06 * beat, headTilt: .07 * st, spin: .25 * Math.sin(sg * .33)});// 頭上に組む腕 // ペアの回り込み
        break;
      }
      case 'sevillanas': {
        // セビジャーナス: セビーリャの祭り踊り — 腕を大きく回す+優雅な足捌き
        const sv = tt * 4.6; const st = Math.sin(sv); const arm = Math.sin(sv * .8); Object.assign(q, {lArm: -1.1 + .6 * arm, rArm: -1.1 - .6 * arm, lElb: -.3 + .2 * arm, rElb: -.3 - .2 * arm, lThigh: -.18 * Math.max(0, st), rThigh: -.18 * Math.max(0, -st), lKnee: .12 * Math.abs(st), rKnee: .12 * Math.abs(st), bob: -.012 * Math.abs(st), sway: .08 * st, lean: .07 * st, headTilt: .08 * arm, spin: .3 * Math.sin(sv * .4)});// 大きく回す腕 // 腕に合わせて頭も
        break;
      }
      case 'forro': {
        // フォホー: ブラジルの密着ペアダンス — 小刻みな左右ステップ+揺れる腰
        const fr = tt * 5; const st = Math.sin(fr); const side = Math.sin(fr * .5); Object.assign(q, {sway: .12 * side, lean: .06 * side, bob: -.015 * Math.abs(st), lThigh: -.15 * Math.max(0, side), rThigh: -.15 * Math.max(0, -side), lKnee: .2 * Math.max(0, -side), rKnee: .2 * Math.max(0, side), lArm: -.9 + .15 * st, rArm: -.9 - .15 * st, lElb: -.6, rElb: -.6, headTilt: .09 * side, spin: .15 * Math.sin(fr * .25)});// 2拍で左右 // 相手を抱くように前へ
        break;
      }
      case 'schuhplattler': {
        // シュープラットラー: バイエルンの叩き踊り — 太腿/靴を叩く動作+ホップ
        const sp = tt * 5.5; const st = Math.sin(sp); const slap = Math.max(0, Math.sin(sp * 2)); Object.assign(q, {bob: -.02 * Math.abs(st), lKnee: .5 * slap, rKnee: .15, lThigh: -.55 * slap, rThigh: -.1, lArm: -.5 - .4 * slap, rArm: -.6 + .3 * st, lElb: -.5, rElb: -.3, lean: .1 * st, sway: .06 * st, spin: .35 * Math.sin(sp * .5), headTilt: .06 * st});// 叩く瞬間 // 脚を上げて叩く // 太腿へ手を伸ばす // ゆっくり回る
        break;
      }
      case 'halay': {
        // ハライ: トルコ/クルドの連踊り — 肩を組んで小刻みに踏む+揺れる列
        const hl = tt * 5; const st = Math.sin(hl); const step = Math.sin(hl * 2); Object.assign(q, {sway: .05 * st, bob: -.012 * Math.abs(step), lThigh: -.12 * Math.max(0, step), rThigh: -.12 * Math.max(0, -step), lKnee: .18 * Math.abs(step), rKnee: .18 * Math.abs(step), lArm: -.35, rArm: -.35, lElb: -.9, rElb: -.9, lean: .05 * st, headTilt: .05 * st, spin: .12 * Math.sin(hl * .3)});// 隣の肩に手
        break;
      }
      case 'polska': {
        // ポルスカ: 北欧の旋回ペアダンス — 3拍子の深い起伏+連続旋回
        const pk = tt * 3.4; const st = Math.sin(pk); Object.assign(q, {bob: -.04 * Math.max(0, -st), spin: 1.2 * st, sway: .07 * st, lean: .09 * st, lArm: -1.0 + .15 * st, rArm: -1.0 - .15 * st, lElb: -.5, rElb: -.5, lThigh: -.15 * Math.max(0, st), rThigh: -.15 * Math.max(0, -st), lKnee: .12 * Math.abs(st), rKnee: .12 * Math.abs(st), headTilt: .06 * st});// 1拍目の沈み // 連続して回る // 組む腕
        break;
      }
      case 'cumbia': {
        // クンビア: コロンビアの輪踊り — 小さな後退ステップ+回る腰+ろうそくを抱く腕
        const cb = tt * 4.4; const st = Math.sin(cb); const hip = Math.sin(cb * 2); Object.assign(q, {sway: .1 * st, lean: .05 * hip, bob: -.012 * Math.abs(st), lThigh: -.15 * Math.max(0, -st), rThigh: -.15 * Math.max(0, st), lKnee: .15 * Math.abs(st), rKnee: .15 * Math.abs(st), lArm: -.7 - .2 * st, rArm: -.4 + .15 * hip, lElb: -.3, rElb: -.5, headTilt: .06 * st, spin: .35 * Math.sin(cb * .33)});// 片腕はろうそくを掲げる // もう片腕はスカートを持つ // 輪を周る
        break;
      }
      case 'landler': {
        // レントラー: オーストリアのゆったり円舞 — 手を打つ+ホップ+旋回
        const ld = tt * 3.6; const st = Math.sin(ld); const clap = Math.max(0, Math.sin(ld * 3)); Object.assign(q, {bob: -.03 * Math.abs(st), spin: .8 * st, sway: .06 * st, lArm: -.6 - .5 * clap, rArm: -.6 - .5 * clap, lElb: -.4, rElb: -.4, lThigh: -.2 * Math.max(0, st), rThigh: -.2 * Math.max(0, -st), lKnee: .15 * Math.abs(st), rKnee: .15 * Math.abs(st), lean: .06 * st, headTilt: .07 * st});// 手拍子 // 大きく旋回 // 手を打つために前方へ
        break;
      }
      case 'hopak': {
        // ホパーク: ウクライナの祝祭踊り — 大きな跳躍+屈伸の脚捌き+誇らしげな腕
        const hp = tt * 5; const st = Math.sin(hp); const jump = Math.max(0, Math.sin(hp * .5)); Object.assign(q, {bob: -.05 * jump, lThigh: -.6 * jump, rThigh: -.25 * Math.max(0, -st), lKnee: .7 * jump, rKnee: .3 * Math.max(0, -st), lArm: -1.5 - .2 * st, rArm: -.4 + .3 * st, lElb: -.2, rElb: -.4, sway: .07 * st, lean: .08 * st, spin: .5 * Math.sin(hp * .25), headTilt: .05 * st});// 高い跳躍 // 誇らしげに頭上へ
        break;
      }
      case 'kalbelia': {
        // カルベリア: ラジャスタンの蛇踊り — 渦巻く旋回+後ろへそる上体+腕を波立たせる
        const kb = tt * 4.4; const st = Math.sin(kb); Object.assign(q, {spin: .6 * Math.sin(kb * .5), sway: .12 * st, lean: -.15 * Math.abs(Math.sin(kb * .5)), bob: -.03 * Math.abs(st), lArm: -.9 - .5 * st, rArm: -.9 + .5 * st, lElb: -.4 - .3 * st, rElb: -.4 + .3 * st, lThigh: -.1 * st, rThigh: .1 * st, lKnee: .15, rKnee: .15, headTilt: .1 * Math.sin(kb * .5)});// 渦巻き旋回 // 後ろへそる // 蛇のようにうねる腕
        break;
      }
      case 'bhangra': {
        // バングラ: パンジャブの豊作踊り — 弾む肩+高く挙げる両腕+キック
        const bh = tt * 5.4; const st = Math.sin(bh); const beat = Math.sin(bh * 2); Object.assign(q, {bob: -.04 * Math.abs(st), lArm: -1.8 - .2 * beat, rArm: -1.8 + .2 * beat, lElb: -.5 - .3 * st, rElb: -.5 + .3 * st, lThigh: -.35 * Math.max(0, st), rThigh: -.35 * Math.max(0, -st), lKnee: .4 * Math.max(0, st), rKnee: .4 * Math.max(0, -st), sway: .1 * st, lean: .06 * st, spin: .3 * Math.sin(bh * .25), headTilt: .07 * st});// 弾む // 両腕を頭上に突き上げる // 指を鳴らすように // 肩を上下する
        break;
      }
      case 'kathak': {
        // カタック: 北インドの古典舞踊 — 速いピルエット+足を打ち鳴らす+優美な手
        const kt = tt * 4.8; const st = Math.sin(kt); Object.assign(q, {spin: .9 * Math.sin(kt * .4), bob: -.02 * Math.abs(st), lThigh: -.35 * Math.max(0, st), rThigh: -.1, lKnee: .5 * Math.max(0, st), rKnee: .15, lArm: -1.1 - .4 * st, rArm: -.7 + .5 * st, lElb: -.35, rElb: -.6, sway: .06 * st, lean: .05 * Math.sin(kt * .5), headTilt: .1 * Math.sin(kt * .5)});// ピルエット // 交互に足を打つ // 優美に広げる腕 // ムドラーの手の形
        break;
      }
      case 'bharat': {
        // バラタナティヤム: 南インドの古典舞踊 — 深いアラヤムディ(膝開き)+打つ足+斜めの首
        const bt = tt * 4.6; const st = Math.sin(bt); const stamp = Math.max(0, Math.sin(bt * 2)); Object.assign(q, {bob: .04 + .02 * stamp, lThigh: -.5, rThigh: -.5, lKnee: .6 + .2 * stamp, rKnee: .6 - .2 * stamp, lArm: -1.0 - .3 * st, rArm: -1.0 + .3 * st, lElb: -.5, rElb: -.5, sway: .08 * st, lean: .03 * st, headTilt: .12 * st, spin: .2 * Math.sin(bt * .3)});// 常に膝を開く低姿勢 // アラヤムディ(半開き膝) // 横に張った腕 // ハスタ(手の印) // 腰の揺れ // 斜めに傾ける首(特徴的)
        break;
      }
      case 'odissi': {
        // オリッシー: 東インドの古典舞踊 — トリバンガ(3S字ポーズ)+腰を突き出す
        const od = tt * 3.6; const st = Math.sin(od); Object.assign(q, {sway: .14 * st, lean: -.08 * st, headTilt: .14 * st, bob: .02 + .02 * Math.abs(st), lThigh: -.3 + .1 * st, rThigh: -.3 - .1 * st, lKnee: .4, rKnee: .4, lArm: -.8 - .3 * st, rArm: -.8 + .3 * st, lElb: -.6 + .2 * st, rElb: -.6 - .2 * st, spin: .15 * Math.sin(od * .5)});// 腰を左右へ突き出す(トリバンガ) // 上体は逆に傾ぐ // 頭も反対へ(S字) // 低い座姿勢 // 柔らかく彫像のような腕
        break;
      }
      case 'garba': {
        // ガルバ: グジャラートの円舞 — リズミカルな手拍子+周る+2歩ステップ
        const gb = tt * 4.6; const st = Math.sin(gb); const clap = Math.abs(Math.sin(gb * 2)); Object.assign(q, {lArm: -.5 - .8 * clap, rArm: -.5 - .8 * clap, lElb: -.6 - .3 * clap, rElb: -.6 - .3 * clap, spin: .5 * Math.sin(gb * .33), sway: .1 * st, bob: -.03 * Math.abs(st), lThigh: -.25 * st, rThigh: -.25 * -st, lKnee: .3 * Math.max(0, st), rKnee: .3 * Math.max(0, -st), lean: .06 * st, headTilt: .08 * st});// 胸の前+頭上で打つ手拍子 // ゆっくり周る
        break;
      }
      case 'bihu': {
        // ビーフー: アッサムの豊作祭踊り — 速い足捌き+両手を腰に高く挙げる
        const bu = tt * 5.2; const st = Math.sin(bu); Object.assign(q, {bob: -.04 * Math.abs(st), lThigh: -.4 * st, rThigh: .4 * st, lKnee: .5 * Math.max(0, st), rKnee: .5 * Math.max(0, -st), lArm: -1.3 - .4 * st, rArm: -1.3 + .4 * st, lElb: -.7 - .2 * st, rElb: -.7 + .2 * st, sway: .12 * st, lean: .07 * st, spin: .3 * Math.sin(bu * .33), headTilt: .1 * Math.sin(bu * .5)});// 交互に速く踏む // 腰に手を当て高く広げる腕 // 腰を大きく揺らす
        break;
      }
      case 'lavani': {
        // ラヴァニ: マハラシュトラの力強い民俗踊り — 激しい腰つき+手首を回す腕
        const lv = tt * 5.6; const st = Math.sin(lv); Object.assign(q, {sway: .16 * st, bob: -.03 * Math.abs(st), lThigh: -.3 * st, rThigh: .3 * st, lKnee: .35, rKnee: .35, lArm: -1.1 - .35 * Math.sin(lv * 1.5), rArm: -1.1 + .35 * Math.sin(lv * 1.5), lElb: -.5 - .4 * Math.sin(lv * 3), rElb: -.5 + .4 * Math.sin(lv * 3), lean: .08 * st, spin: .25 * Math.sin(lv * .3), headTilt: .12 * st});// 大きく振る腰 // 手首を回す腕 // 回す手首
        break;
      }
      case 'dandiya': {
        // ダンディヤ: グジャラートの棒踊り — 交互に打ち合わせる棒+回るステップ
        const dd = tt * 5; const st = Math.sin(dd); const hit = Math.abs(Math.sin(dd * 1.5)); Object.assign(q, {lArm: -.7 - 1.0 * hit, rArm: -.7 - 1.0 * (1 - hit), lElb: -.4 - .3 * hit, rElb: -.4 - .3 * (1 - hit), spin: .4 * Math.sin(dd * .3), sway: .08 * st, bob: -.03 * Math.abs(st), lThigh: -.2 * st, rThigh: -.2 * -st, lKnee: .25, rKnee: .25, lean: .05 * st, headTilt: .07 * st});// 棒を打ち下ろす+挙げる // ペアで周る
        break;
      }
      case 'ghoomar': {
        // グーマル: ラジャスタンの回転踊り — 絶え間ない旋回+頭上の優雅な腕
        const gh = tt * 3.8; const st = Math.sin(gh); Object.assign(q, {spin: 1.2 * Math.sin(gh * .2), sway: .1 * Math.sin(gh * .4), bob: -.02 * Math.abs(st), lArm: -1.4 - .2 * st, rArm: -1.4 + .2 * st, lElb: -.5 - .15 * st, rElb: -.5 + .15 * st, lThigh: -.15 * st, rThigh: .15 * st, lKnee: .2, rKnee: .2, lean: .05 * Math.sin(gh * .4), headTilt: .09 * Math.sin(gh * .4)});// 大きくゆるやかに周り続ける // 頭上で揺れる腕
        break;
      }
      case 'khorovod': {
        // ホロヴォド: スラヴの輪踊り — 歌いながら周る連動した歩み+内へ外への揺れ
        const kh = tt * 4.4; const st = Math.sin(kh); const inward = Math.sin(kh * .4); Object.assign(q, {spin: .5 * Math.sin(kh * .5), sway: .06 * st, bob: -.02 * Math.abs(st), lArm: -.9 - .3 * inward, rArm: -.9 + .3 * inward, lElb: -.3, rElb: -.3, lThigh: -.15 * st, rThigh: -.15 * -st, lKnee: .2, rKnee: .2, lean: .04 * inward, headTilt: .06 * st});// 輪が広がったり縮んだり // 繋いだ手+内外で高低 // 中心へ傾ける
        break;
      }
      case 'lezginka': {
        // レズギンカ: コーカサスの鷲踊り — 高く挙げた腕+つま先立ち+脚の踏み替え
        const lz = tt * 6.2; const st = Math.sin(lz); const hop = Math.abs(Math.sin(lz * .6)); Object.assign(q, {lArm: -1.7 - .15 * st, rArm: -1.7 + .15 * st, lElb: -.15, rElb: -.15, lThigh: -.3 * st, rThigh: -.3 * -st, lKnee: .35 + .2 * hop, rKnee: .35 + .2 * (1 - hop), lShin: -.25 * Math.max(0, -st), rShin: -.25 * Math.max(0, st), bob: -.04 * hop, sway: .05 * st, lean: .03 * st, headTilt: .05 * st});// 鷲の翼のように高く張る // 蹴り出し // つま先立ちの上昇
        break;
      }
      case 'krakowiak': {
        // クラコヴィアク: ポーランドの誇り高き馬力踊り — 陽気なギャロップ+胸を張る
        const kr = tt * 5.4; const st = Math.sin(kr); const gallop = Math.abs(Math.sin(kr)); Object.assign(q, {lean: -.06, bob: -.05 * gallop, sway: .07 * st, lArm: .4, rArm: -.5, lElb: -.8, rElb: -.4, lThigh: -.4 * st, rThigh: -.4 * -st, lKnee: .4 + .15 * gallop, rKnee: .4 + .15 * gallop, lShin: -.2 * Math.max(0, -st), rShin: -.2 * Math.max(0, st), headTilt: .05 * st});// 胸を張った誇り高い姿勢 // 弾むギャロップ // 一方は腰に一方は挙げる(誇りの構え)
        break;
      }
      case 'verbunk': {
        // ヴェルブンク: ハンガリーの新兵勧誘踊り — ゆったりした威厳+踵の打ち合わせ
        const vb = tt * 3.6; const st = Math.sin(vb); const click = Math.abs(Math.sin(vb * .8)); Object.assign(q, {lean: -.04, bob: -.03 * click, sway: .06 * st, lArm: .5 - .3 * st, rArm: -1.1 + .4 * st, lElb: -.9, rElb: -.5, lThigh: -.25 * st, rThigh: -.25 * -st});// 踵打ちの瞬間 // 反り返る誇り // 手を腰に近い構え(馬鞭を振る) // 帽子を振る腕
        // 踵を鳴らす脚の引き寄せ
        Object.assign(q, {lKnee: .3, rKnee: .3, lShin: -.3 * click, rShin: -.1 * (1 - click), headTilt: -.06 * st});// 左足が踵打ちに跳ぶ
        break;
      }
      case 'sirba': {
        // スルバ: ルーマニアの高速輪踊り — 肩を組み片足の蹴りを高速連打
        const sb = tt * 7.8; const st = Math.sin(sb); const hop = Math.abs(Math.sin(sb)); Object.assign(q, {bob: -.045 * hop, sway: .05 * st, lArm: .2, rArm: .2, lElb: -1.0, rElb: -1.0, lThigh: -.35 * st, rThigh: -.35 * -st, lKnee: .4, rKnee: .4, lShin: -.45 * Math.max(0, -st), rShin: -.45 * Math.max(0, st), lean: .05 * st, headTilt: .06 * st});// 両腕を肩に回した組み姿勢 // 交互に前へ蹴る
        break;
      }
      case 'hasapiko': {
        // ハサピコ: ギリシャの肉屋踊り — 肩に腕を乗せた連れ踊り+ゆったり横ステップ+踵の打ち
        const hs = tt * 4.2; const st = Math.sin(hs); const tap = Math.abs(Math.sin(hs * .75)); Object.assign(q, {sway: .08 * st, bob: -.025 * tap, lArm: .3, rArm: .3, lElb: -1.1, rElb: -1.1, lThigh: -.3 * st, rThigh: -.3 * -st, lKnee: .35, rKnee: .35, lShin: -.3 * Math.max(0, -st), rShin: -.3 * Math.max(0, st), lean: .04 * st, headTilt: .05 * st});// 連なって左右に移る // 両腕を隣の肩に乗せた構え
        break;
      }
      case 'oberek': {
        // オベレク: ポーランドの旋回踊り — 速い回転+軽快な足運び+挙げた腕
        const ob = tt * 5.6; const st = Math.sin(ob); const lift = Math.abs(Math.sin(ob * .5)); Object.assign(q, {bob: -.04 * lift, sway: .06 * st, lean: .12 * st, headTilt: -.1 * st, lArm: -1.2 - .15 * st, rArm: .5 + .1 * -st, lElb: -.5, rElb: -.25, lThigh: -.4 * Math.max(0, st), rThigh: -.4 * Math.max(0, -st), lKnee: .5 * Math.max(0, -st), rKnee: .5 * Math.max(0, st), lShin: -.3 * Math.max(0, -st), rShin: -.3 * Math.max(0, st)});// 小さな跳ね上がり // 旋回にともなう左右への振れ // 遠心力で大きく傾く // 首は逆向きに保つ // 片腕を頭上に円を描く // もう片腕は横に張る // 軽快に脚を踏み替える
        break;
      }
      case 'tropanka': {
        // トロパンカ: ブルガリアの連踊り — 力強い足踏み(スタンプ)+半円の揺れ
        const tr = tt * 6.4; const st = Math.sin(tr); const stamp = Math.abs(Math.sin(tr * .5)); Object.assign(q, {bob: -.02 - .05 * stamp, sway: .07 * st, lArm: .45, rArm: .45, lElb: -.8, rElb: -.8, lThigh: -.55 * Math.max(0, st), rThigh: -.55 * Math.max(0, -st), lKnee: .6 * Math.max(0, st), rKnee: .6 * Math.max(0, -st), lShin: .25 * Math.max(0, st), rShin: .25 * Math.max(0, -st), lean: .05 * -st, headTilt: .04 * st});// 踏み込みで深く沈む // 半円の列とともに横へ // 隣と手を繋いだ低い構え // 片脚を大きく上げてスタンプ // 踵を強く打ち下ろす
        break;
      }
      case 'tinikling': {
        // ティニクリング: フィリピンの竹竿踊り — 打ち合う竹を避ける小刻みホップ+優雅な腕
        const tk = tt * 8.0; const st = Math.sin(tk); const hop = Math.abs(Math.sin(tk * .5)); Object.assign(q, {bob: -.035 * hop, sway: .03 * st, lThigh: -.5 * Math.max(0, st), rThigh: -.5 * Math.max(0, -st), lKnee: .7 * Math.max(0, st), rKnee: .7 * Math.max(0, -st), lShin: .3 * Math.max(0, -st), rShin: .3 * Math.max(0, st), lArm: -1.1 - .15 * st, rArm: -1.1 - .15 * -st, lElb: -.4, rElb: -.4, lean: .06 * -st, headTilt: .06 * st});// 片脚での連続ホップ // 竹竿を避ける交互の足上げ // 優美に挙げた腕(手首を揺らす)
        break;
      }
      case 'gumboot': {
        // ガムブーツ: 南アの鉱山労働者踊り — ゴム長靴を叩く太腿の上げ+腕の打ち
        const gb = tt * 5.2; const st = Math.sin(gb); const slap = Math.max(0, Math.sin(gb)); Object.assign(q, {bob: -.03 - .04 * Math.abs(Math.sin(gb * .5)), lean: .12, lThigh: -.7 * Math.max(0, st), rThigh: -.7 * Math.max(0, -st), lKnee: .8 * Math.max(0, st), rKnee: .8 * Math.max(0, -st), lArm: .55 + .2 * slap, rArm: .55 + .2 * (1 - slap), lElb: -.6, rElb: -.6, headTilt: .08, sway: .04 * st});// 前傾で長靴へ腕を伸ばす // 交互に太腿を高く上げる // 腕で靴を叩く
        break;
      }
      case 'halling': {
        // ハリング: ノルウェーのアクロバット踊り — 深く沈み→爆発的な高キック
        const ha = tt * 4.4; const st = Math.sin(ha); const crouch = Math.max(0, -st); const kick = Math.max(0, st); Object.assign(q, {bob: -.01 - .09 * crouch + .02 * kick, lThigh: -.95 * kick, lKnee: .15 * kick + .5 * crouch, lShin: .2 * kick, rThigh: -.15 * crouch, rKnee: .55 * crouch, lArm: .5 * crouch - .3 * kick, rArm: .5 * crouch - .3 * kick, lElb: -.5, rElb: -.5, lean: .15 * crouch - .1 * kick, headTilt: .06 * st});// 前半で深く沈む // 後半で蹴り上げる // 頭の高さまで蹴り上げる // 軸脚は踏ん張る // 沈むとき腕を前へ、蹴るとき振り上げ
        break;
      }
      case 'haka': {
        // ハカ: マオリの戦踊り — 開脚で膝を深く+太腿を叩く+激しい足踏み
        const hk = tt * 5.5; const st = Math.sin(hk); const stomp = Math.abs(st); const slap = Math.max(0, Math.sin(hk * .5)); Object.assign(q, {bob: -.06 - .04 * stomp, lThigh: -.25 - .1 * stomp, rThigh: -.25 - .1 * stomp, lKnee: .5, rKnee: .5, lShin: .15 * st, rShin: -.15 * st, lArm: .6 * slap, rArm: .6 * (1 - slap), lElb: -.7, rElb: -.7, lean: .18, headTilt: .1 * Math.sin(hk * .25)});// 両足の強い足踏み // 太腿/胸を叩く // 腰を深く落とす // 開脚の膝張り // 交互に身体を叩く // 威嚇の前傾 // 顔を左右に突き出す
        break;
      }
      case 'marinera': {
        // マリネラ: ペルーの優雅な対舞 — 手ぬぐいを掲げる腕+軽いステップ
        const mr = tt * 4; const st = Math.sin(mr); const wave = Math.sin(mr * 1.5); Object.assign(q, {bob: -.015 + .02 * Math.abs(st), sway: .06 * st, lArm: -.6 - .15 * wave, lElb: -.3, rArm: .5, rElb: -.5, lThigh: -.2 * Math.max(0, st), rThigh: -.2 * Math.max(0, -st), lKnee: .25 * Math.max(0, st), rKnee: .25 * Math.max(0, -st), headTilt: .09 * wave, lean: .03 * st});// 手ぬぐいを振る // 柔らかい浮き沈み // 漂うような横揺れ // 片腕を高く掲げて揺らす // 片腕は腰に添える // 交互に脚を軽く上げる // 優雅に傾ぐ首
        break;
      }
      case 'sagayan': {
        // サガヤン: フィリピンの戦踊り — 盾と剣を持つ跳躍+激しい振り
        const sg = tt * 5.8; const st = Math.sin(sg); const lunge = Math.max(0, Math.sin(sg * .7)); Object.assign(q, {bob: -.05 - .06 * lunge, lean: .2 * lunge, lThigh: -.4 * Math.max(0, st), rThigh: -.4 * Math.max(0, -st), lKnee: .5 * Math.max(0, st), rKnee: .5 * Math.max(0, -st), lShin: .2 * Math.max(0, st), rShin: .2 * Math.max(0, -st), lArm: -.35 - .25 * lunge, lElb: -.4, rArm: .55, rElb: -.75, sway: .05 * st, headTilt: .08 * st});// 突進の跳躍 // 深い膝+跳ね // 突進する前傾 // 交互の踏み込み // 剣を振る腕(頭上) // 盾を構える腕(体の前)
        break;
      }
      case 'malambo': {
        // マランボ: アルゼンチン・ガウチョの足技踊り — サパテオの速い足踏み
        const mb = tt * 7.5; const st = Math.sin(mb); const stamp = Math.abs(st); const sweep = Math.sin(mb * .4); Object.assign(q, {bob: -.03 - .035 * stamp, lThigh: -.35 * Math.max(0, st), rThigh: -.35 * Math.max(0, -st), lKnee: .3 * Math.max(0, st), rKnee: .3 * Math.max(0, -st), lShin: .15 * Math.max(0, sweep), rShin: .15 * Math.max(0, -sweep), lArm: -.5 - .1 * Math.sin(mb), lElb: -.3, rArm: .3 + .2 * Math.sin(mb * .5), rElb: -.4, sway: .04 * st, headTilt: .05 * Math.sin(mb * .3)});// 連続する鋭いスタンプ // 脚の払い(セピジャード) // 低い腰+連続接地 // 交互の鋭い踏み // 脚の払い筋 // ボレアドーラを回す腕(頭上) // 反対腕は腰の低い回し
        break;
      }
      case 'caporales': {
        // カポラレス: ボリビアの力強い踊り — 大きな跳躍+脚の蹴り出し+腕の振り
        const cp = tt * 6.2; const st = Math.sin(cp); const jump = Math.abs(Math.sin(cp * .5)); Object.assign(q, {bob: -.02 - .08 * jump, lThigh: -.5 * Math.max(0, st), rThigh: -.5 * Math.max(0, -st), lKnee: .6 * Math.max(0, st), rKnee: .6 * Math.max(0, -st), lShin: .25 * Math.max(0, st), rShin: .25 * Math.max(0, -st), lArm: .45 * Math.max(0, st) - .15, rArm: .45 * Math.max(0, -st) - .15, lElb: -.65, rElb: -.65, lean: .1 * jump, sway: .05 * st, headTilt: .06 * Math.sin(cp * .3)});// 両足跳躍 // 高く飛ぶ // 交互の深い蹴り出し // 靴の鈴を鳴らす脚 // 肘を張った力強い振り
        break;
      }
      case 'huayno': {
        // ワイノ: アンデスの祭り踊り — 軽い小跳躍+スキップ+両腕の揺れ
        const hy = tt * 5; const st = Math.sin(hy); const hop = Math.abs(Math.sin(hy)); Object.assign(q, {bob: -.015 - .035 * hop, lThigh: -.3 * Math.max(0, st), rThigh: -.3 * Math.max(0, -st), lKnee: .4 * Math.max(0, st), rKnee: .4 * Math.max(0, -st), lArm: .35 - .25 * st, rArm: .35 + .25 * st, lElb: -.35, rElb: -.35, sway: .07 * st, headTilt: .08 * Math.sin(hy * .5), lean: .04 * st});// 連続する小跳躍 // 弾む腰 // 交互の膝上げ // 交互に上下する腕 // 左右に振る
        break;
      }
      case 'cueca': {
        // クエカ: チリの国舞 — 片腕でハンカチを頭上に掲げ、優雅に周る
        const cq = tt * 2.2; const st = Math.sin(cq); Object.assign(q, {bob: -.02 + .012 * Math.sin(cq * 2), sway: .08 * st, lThigh: -.22 * Math.max(0, st), rThigh: -.22 * Math.max(0, -st), lKnee: .28 * Math.max(0, st), rKnee: .28 * Math.max(0, -st), rArm: 1.35 + .18 * Math.sin(cq * 3), rElb: -.3 + .12 * Math.sin(cq * 3), lArm: .45, lElb: -.5, headTilt: .08 * Math.sin(cq), lean: .05 * st});// 相手を周る揺れ // 軽い交互ステップ // 頭上の腕(ハンカチを振る) // 腰に添えた反対腕
        break;
      }
      case 'morenada': {
        // モレナーダ: ボリビアの重厚な踊り — 仮面の衣装+力強いスタンプ+前傾の揺れ
        const mr = tt * 2.6; const st = Math.sin(mr); Object.assign(q, {bob: .02 + .03 * Math.abs(st), sway: .12 * st, lThigh: -.35 * Math.max(0, st), rThigh: -.35 * Math.max(0, -st), lKnee: .45 * Math.max(0, st), rKnee: .45 * Math.max(0, -st), lShin: .15 * Math.max(0, -st), rShin: .15 * Math.max(0, st), lArm: .5 + .2 * st, rArm: .5 - .2 * st, lElb: -.4, rElb: -.4, lean: .1, headTilt: .06 * st});// ずっしり沈む腰 // 大きな左右の揺れ // 重い交互の腿上げ // 打ち下ろすスタンプ // 重い衣装の腕 // 仮面の重さの前傾
        break;
      }
      case 'diablada': {
        // ディアブラーダ: ボリビアの悪魔踊り — 高い跳躍+角のように掲げる腕
        const db = tt * 3.4; const jump = Math.max(0, Math.sin(db)); const crouch = Math.max(0, -Math.sin(db)); Object.assign(q, {bob: -.06 * jump + .04 * crouch, lThigh: -.6 * crouch - .2 * jump, rThigh: -.6 * crouch - .2 * jump, lKnee: .7 * crouch, rKnee: .7 * crouch, lShin: .2 * jump, rShin: .2 * jump});// 爆発的な跳び上がり // 着地の深い沈み // 宙での蹴り
        // 角のようにV字に掲げる腕(左右を交互に強く)
        const horn = Math.sin(db * .5); Object.assign(q, {lArm: 1.1 + .3 * Math.max(0, horn) - .3 * crouch, rArm: 1.1 + .3 * Math.max(0, -horn) - .3 * crouch, lElb: -.25, rElb: -.25, lean: .15 * crouch - .05 * jump, sway: .1 * horn, headTilt: .08 * horn});break;
      }
      case 'carnavalito': {
        // カルナバリート: アンデスの祝祭輪踊り — 連続ジャンプ+頭上で紙吹雪旗を振る腕+円を描く揺れ
        const cv = tt * 4.4; const st = Math.sin(cv); const hop = Math.abs(Math.sin(cv)); Object.assign(q, {bob: -.015 - .05 * hop, lThigh: -.4 * Math.max(0, st), rThigh: -.4 * Math.max(0, -st), lKnee: .5 * Math.max(0, st), rKnee: .5 * Math.max(0, -st), rArm: 1.3 + .25 * Math.sin(cv * 2), rElb: -.35 + .15 * Math.sin(cv * 2), lArm: .4 + .15 * st, lElb: -.3, sway: .1 * st, lean: .04 * st, headTilt: .1 * Math.sin(cv * .5)});// 連続ジャンプ // 交互に跳ね上げる膝 // 頭上で旗を回す腕 // 横に張る反対腕 // 輪の流れ // 祝祭の首振り
        break;
      }
      case 'tinku': {
        // ティンク: ボリビアの儀礼格闘踊り — 身構え+交互の打ち出し+踏み込み
        const tk = tt * 3.8; const st = Math.sin(tk); const punch = Math.max(0, st); const punch2 = Math.max(0, -st); Object.assign(q, {bob: .01 - .02 * Math.abs(st), lThigh: -.4 * punch - .15, rThigh: -.4 * punch2 - .15, lKnee: .45 * punch, rKnee: .45 * punch2, lArm: .4 - .55 * punch, rArm: .4 - .55 * punch2, lElb: -.7 + .45 * punch, rElb: -.7 + .45 * punch2, lean: .08, sway: .06 * st, headTilt: .05 * st});// 左打ちの位相 // 右打ちの位相 // 踏み込み脚 // 前に突き出す腕 // 構え→伸ばす肘 // 構えの前傾
        break;
      }
      case 'zamba': {
        // サンバ(アルゼンチン): 優雅な対舞 — パニュエロを掲げる片腕+8の字を描く揺れ
        const zb = tt * 2.0; const st = Math.sin(zb); Object.assign(q, {bob: -.015 + .015 * Math.sin(zb * 2), sway: .1 * st, lThigh: -.2 * Math.max(0, st), rThigh: -.2 * Math.max(0, -st), lKnee: .25 * Math.max(0, st), rKnee: .25 * Math.max(0, -st), rArm: 1.25 + .2 * Math.sin(zb * 2.5), rElb: -.35 + .12 * Math.sin(zb * 2.5), lArm: .35 + .1 * st, lElb: -.35, headTilt: .09 * Math.sin(zb * .5), lean: .04 * st});// 相手を8の字に周る // ゆったりした横ステップ // パニュエロを振る頭上の腕 // 優しく開いた反対腕 // 流れる視線
        break;
      }
      case 'singkil': {
        // シンキル: フィリピン・マラナオの宮廷踊り — 交差する竹竿を跨ぐ高い足+扇を翳す両腕
        const sg = tt * 2.8; const st = Math.sin(sg); const step = Math.max(0, st); const step2 = Math.max(0, -st); Object.assign(q, {bob: -.02 - .02 * Math.abs(st), lThigh: -.55 * step, rThigh: -.55 * step2, lKnee: .65 * step, rKnee: .65 * step2, lShin: .2 * step2, rShin: .2 * step});// 竹竿を跨ぐ交互の高踏み // 竿を跨ぐ高い腿上げ // 着地の伸ばし
        // 扇を翳す両腕(顔の高さで交互に開閉)
        Object.assign(q, {lArm: .9 + .2 * Math.sin(sg * 1.5), rArm: .9 + .2 * Math.sin(sg * 1.5 + Math.PI), lElb: -.5, rElb: -.5, sway: .08 * st, headTilt: .1 * Math.sin(sg * .5), lean: .03});// 首の優雅な流れ
        break;
      }
      case 'kecak': {
        // ケチャ: バリの猿の詠唱踊り — 座り込み+掲げる両腕+揺れる指先の波
        const kc = tt * 4; const st = Math.sin(kc); Object.assign(q, {bob: .045, lThigh: -.8, rThigh: -.8, lKnee: 1.1, rKnee: 1.1, lShin: -.9, rShin: -.9});// 座り込む低い腰 // 胡座(両膝を横に開く)
        // チャクのリズムで交互に掲げる両腕(指先を震わせる)
        Object.assign(q, {lArm: 1.3 + .35 * Math.max(0, st), rArm: 1.3 + .35 * Math.max(0, -st), lElb: -.2 + .2 * st, rElb: -.2 - .2 * st, sway: .07 * st, lean: .06 + .05 * Math.sin(kc * .5), headTilt: .08 * st});// 唱和の揺れ
        break;
      }
      case 'saman': {
        // サマン: アチェの千手踊り — 正座+胸叩きと頭上の一斉振り
        const sm = tt * 5; const ph = Math.sin(sm); const up = Math.max(0, Math.sin(sm * .5)); Object.assign(q, {bob: .05, lThigh: -.9, rThigh: -.9, lKnee: 1.35, rKnee: 1.35, lShin: -.95, rShin: -.95});// 速い叩きのリズム // 頭上へ流す拍 // 正座の低い姿勢 // 正座(膝を立てず畳む)
        // 胸を叩く腕(交互の速い打ち)と頭上の流れの合成
        Object.assign(q, {lArm: .45 + .9 * up + .15 * Math.max(0, ph), rArm: .45 + .9 * up + .15 * Math.max(0, -ph), lElb: -.75 + .55 * up, rElb: -.75 + .55 * up, sway: .1 * ph * (1 - up), headTilt: .12 * ph, lean: .08 + .04 * ph});// 揃った体の揺れ // 首のリズム打ち
        break;
      }
      case 'robam': {
        // ロバム: クメール・アプサラ古典舞踊 — 深い膝の反り+指を反らす優美な腕
        const rb = tt * 1.4; const st = Math.sin(rb); const pose = Math.sin(rb * .5); Object.assign(q, {bob: .02 + .015 * Math.abs(st), lThigh: -.3, rThigh: -.3, lKnee: .55, rKnee: .55, lShin: -.3 * Math.max(0, pose), rShin: -.3 * Math.max(0, -pose)});// 極めてゆったり // 静止ポーズ間の緩移行 // 常に膝を折る // 開いた深い膝(プリエ) // 爪先立ちの反り足
        // 反らした指先の腕(片方は頭上、片方は胸元)
        Object.assign(q, {lArm: 1.1 + .15 * st, rArm: .55 + .1 * st, lElb: -.3, rElb: -.9, sway: .06 * pose, headTilt: .15 * pose, lean: .04 * pose});// 胸元は深く折る // アプサラの首傾げ
        break;
      }
      case 'indlamu': {
        // インドラム: ズールーの戦士踊り — 頭ほど高く蹴り上げて力強く踏み降ろす
        const id = tt * 3.2; const st = Math.sin(id); const kick = Math.max(0, Math.sin(id * .5)); const kick2 = Math.max(0, Math.sin(id * .5 + Math.PI)); Object.assign(q, {bob: -.03 * (kick + kick2) + .02 * Math.abs(st), lThigh: -1.0 * kick, rThigh: -1.0 * kick2, lKnee: .5 * kick, rKnee: .5 * kick2, lShin: .8 * kick, rShin: .8 * kick2});// 片脚ずつの高キック // 蹴り上げで伸び、踏みで沈む // 腰上まで上げる高キック // 脚を前に伸ばす
        // 力強く振る腕(蹴りと逆側が前)
        Object.assign(q, {lArm: .5 + .7 * kick2, rArm: .5 + .7 * kick, lElb: -.3, rElb: -.3, sway: .05 * st, lean: -.03 * (kick - kick2), headTilt: .04 * st});// 反り気味の戦士の体
        break;
      }
      case 'adumu': {
        // アドゥム: マサイの跳躍踊り — 真上に高く跳ぶ+真っ直ぐな体+少しの膝
        const ad = tt * 4.2; const jmp = Math.max(0, Math.sin(ad)); Object.assign(q, {bob: -.09 * jmp, lThigh: -.05 * jmp, rThigh: -.05 * jmp, lKnee: .12 * jmp, rKnee: .12 * jmp, lShin: .15 * jmp, rShin: .15 * jmp});// 反復ジャンプ // 高い垂直跳躍 // ほぼ伸ばした脚 // 空中の爪先
        // 脇に添えた腕(ほぼ動かさない戦士の姿勢)
        Object.assign(q, {lArm: .15, rArm: .15, lElb: -.1, rElb: -.1, sway: .02 * Math.sin(ad * .5), lean: .02, headTilt: .03 * Math.sin(ad * .5)});// 真っ直ぐな背筋
        break;
      }
      case 'eskista': {
        // エスキスタ: エチオピアの肩踊り — 激しい肩の弾ませ+胸の張り+最小の足
        const es = tt * 6; const st = Math.sin(es); const fast = Math.sin(es * 1.5); Object.assign(q, {bob: -.01 + .015 * Math.abs(st), lThigh: -.05, rThigh: -.05, lKnee: .08, rKnee: .08});// 弾む上半身 // ほぼ直立
        // 肩の激しい上下(腕で表現するショルダーシミー)
        Object.assign(q, {lArm: .35 + .35 * st, rArm: .35 + .35 * -st, lElb: -.6 + .25 * fast, rElb: -.6 - .25 * fast, sway: .06 * st, lean: .06 + .05 * fast, headTilt: .1 * fast});// 体幹の揺れ // 胸の張り出し // 首の流れ
        break;
      }
      case 'gnawa': {
        // グナワ: モロッコのトランス踊り — 連続の回旋+頭の揺れ+沈み込む跳躍
        const gn = tt * 4.5; const st = Math.sin(gn); const hop = Math.max(0, Math.sin(gn * 1.5)); Object.assign(q, {bob: -.04 * hop - .01, lThigh: -.3 * hop, rThigh: -.3 * Math.max(0, -Math.sin(gn * 1.5)), lKnee: .4 * hop, rKnee: .4 * Math.max(0, -Math.sin(gn * 1.5))});// 沈み込みつつ跳ねる
        // 振り回す両腕(カウリ帽の房を回す動き)
        Object.assign(q, {lArm: .7 + .4 * st, rArm: .7 - .4 * st, lElb: -.4, rElb: -.4, sway: .25 * st, lean: .12 * st, headTilt: .25 * Math.sin(gn * 1.5)});// 激しい回旋の傾き // 前後の揺れ // 頭の大きな揺れ
        break;
      }
      case 'piring': {
        // ピリン: ミナンカバウの皿踊り — 両手に皿+早い足捌き+優雅な回旋
        const pi = tt * 3.5; const st = Math.sin(pi); Object.assign(q, {bob: -.02 + .03 * Math.abs(Math.sin(pi * 2)), lThigh: -.15 + .25 * Math.max(0, st), rThigh: -.15 + .25 * Math.max(0, -st), lKnee: .2 * Math.max(0, st), rKnee: .2 * Math.max(0, -st)});// 細かい弾み // 交互の足上げ
        // 皿を持つ両腕(頭上に掲げる)
        Object.assign(q, {lArm: 1.1 + .15 * st, rArm: 1.1 - .15 * st, lElb: -.3, rElb: -.3, sway: .12 * st, lean: .04, headTilt: .08 * st});// 肘を立て皿を掲げる // 回旋の傾き
        break;
      }
      case 'pangalay': {
        // パンガライ: タウスグの指甲舞踊 — 波打つ腕+深い膝+優雅な首
        const pg = tt * 2.2; const st = Math.sin(pg); const wave = Math.sin(pg * 2); Object.assign(q, {bob: .04, lThigh: -.35, rThigh: -.35, lKnee: .5, rKnee: .5, lShin: .3, rShin: .3});// 沈んだ重心 // 深い膝
        // 波打つ両腕(指先の波を肘で表現)
        Object.assign(q, {lArm: .9 + .2 * wave, rArm: .9 - .2 * wave, lElb: -.5 + .15 * st, rElb: -.5 - .15 * st, sway: .08 * st, lean: .06, headTilt: .12 * st});// 緩やかな体幹 // 大きく傾ぐ首
        break;
      }
      case 'kartuli': {
        // カルトゥリ: ジョージアの宮廷踊り — 高く挙げた腕+滑る歩+誇り高い胸
        const kt = tt * 1.8; const st = Math.sin(kt); Object.assign(q, {bob: -.01 + .02 * Math.abs(Math.sin(kt * 2)), lThigh: -.1 + .15 * Math.max(0, st), rThigh: -.1 + .15 * Math.max(0, -st), lKnee: .1, rKnee: .1, lShin: .08, rShin: .08});// 滑らかな起伏 // 滑る歩行
        // 高く優雅に挙げる両腕
        Object.assign(q, {lArm: 1.25 + .1 * st, rArm: 1.25 - .1 * st, lElb: -.15, rElb: -.15, sway: .05 * st, lean: .1, headTilt: .04 * st});// ほぼ真っ直ぐ // 誇り高く張った胸
        break;
      }
      case 'lazgi': {
        // ラズギ: ホレズムの速い踊り — 肩の細かい弾き+速い腕+鋭い首
        const lz = tt * 5; const st = Math.sin(lz); const flick = Math.sin(lz * 3); Object.assign(q, {bob: -.02 + .02 * Math.abs(flick), lThigh: -.1 + .1 * st, rThigh: -.1 - .1 * st, lKnee: .15, rKnee: .15});// 細かい弾み
        // 速い腕の動き(交互に鋭く振る)
        Object.assign(q, {lArm: .8 + .3 * st, rArm: .8 - .3 * st, lElb: -.3 + .2 * flick, rElb: -.3 - .2 * flick, sway: .1 * st, lean: .05, headTilt: .2 * flick});// 鋭い首の振り
        break;
      }
      case 'springar': {
        // スプリンガル: ノルウェーの3拍子踊り — 転がる三連ステップ+交互の脚上げ
        const sp = tt * 3; const st = Math.sin(sp); const trip = Math.sin(sp * 1.5); Object.assign(q, {bob: -.015 + .03 * Math.abs(trip), lThigh: -.1 + .2 * Math.max(0, st), rThigh: -.1 + .2 * Math.max(0, -st), lKnee: .15 * Math.max(0, st), rKnee: .15 * Math.max(0, -st), lShin: .1 * Math.max(0, st), rShin: .1 * Math.max(0, -st)});// 3拍子の転がる起伏 // 交互の脚上げ
        // 落ち着いた両腕(腰のあたり)
        Object.assign(q, {lArm: .2 + .1 * st, rArm: .2 - .1 * st, lElb: -.25, rElb: -.25, sway: .12 * st, lean: .06, headTilt: .06 * st});// 3拍子の横揺れ
        break;
      }
      case 'ganggang': {
        // カンカンスレ: 円陣の踊り — 掲げた両腕+ゆれる輪+連続の小跳ね
        const gg = tt * 2.8; const st = Math.sin(gg); const bounce = Math.abs(Math.sin(gg * 1.5)); Object.assign(q, {bob: -.03 * bounce, lThigh: -.12 * bounce, rThigh: -.12 * (1 - bounce), lKnee: .18 * bounce, rKnee: .18 * (1 - bounce)});// 小刻みの跳ね
        // 掲げた両腕(V字に高く)
        Object.assign(q, {lArm: 1.2 + .15 * st, rArm: 1.2 - .15 * st, lElb: -.2, rElb: -.2, sway: .15 * st, lean: .05 * st, headTilt: .1 * st});// 輪のゆれる移動
        break;
      }
      case 'biyelgee': {
        // ビエルゲー: モンゴルの上半身踊り — 低い姿勢+騎馬の腕+胸の弾み
        const bi = tt * 2.5; const st = Math.sin(bi); const chest = Math.sin(bi * 2); Object.assign(q, {bob: .05, lThigh: -.45, rThigh: -.45, lKnee: .5, rKnee: .5, lShin: .35, rShin: .35});// 低い姿勢(沈み込み) // 深い膝の開脚
        // 騎馬手綱の両腕(前に構える)
        Object.assign(q, {lArm: .55 + .2 * st, rArm: .55 - .2 * st, lElb: -.5 + .15 * chest, rElb: -.5 - .15 * chest, sway: .08 * st, lean: .08 + .04 * chest, headTilt: .06 * st});// 胸の前後弾み
        break;
      }
      case 'saidi': {
        // サイディ: エジプトの杖踊り — 杖を頭上に掲げて回す構え+交互の打ち込み
        const sd = tt * 3; const st = Math.sin(sd); const strike = Math.sin(sd * 2); q.bob = -.015 + .02 * Math.abs(strike); // 構えの開脚(腰を落として)
        Object.assign(q, {lThigh: -.3, rThigh: -.3, lKnee: .35, rKnee: .35});// 杖を掲げる片腕+反対の守り腕
        Object.assign(q, {lArm: 1.1 + .25 * st, rArm: .4 - .3 * Math.max(0, strike), lElb: -.25, rElb: -.5 + .2 * strike, sway: .12 * st, lean: .1 + .05 * strike, headTilt: .07 * st});// 打ち込み時の前傾
        break;
      }
      case 'horon': {
        // ホロン: 黒海の高速連踊り — 水平に伸ばした両腕+肩の震え+速い足捌き
        const hr = tt * 5; const st = Math.sin(hr); const tremble = Math.sin(hr * 4); q.bob = -.01 + .02 * Math.abs(st); // 肩の小刻み震え
        // 速い足捌き(交互の小刻みステップ)
        Object.assign(q, {lThigh: -.15 + .2 * Math.max(0, st), rThigh: -.15 + .2 * Math.max(0, -st), lKnee: .2 + .15 * Math.abs(st), rKnee: .2 + .15 * Math.abs(st)});// 水平に張った両腕(連れ踊りの肩掛け)+震え
        Object.assign(q, {lArm: .95 + .08 * tremble, rArm: .95 - .08 * tremble, lElb: -.1, rElb: -.1, sway: .1 * st, lean: .04 * tremble, headTilt: .05 * tremble});// 肩の上下震えを体へ伝搬
        break;
      }
      case 'jarabe': {
        // ハラベ: メキシコの帽子踊り — アーチの腕+優雅な旋回+つま先の足打ち
        const jb = tt * 2.6; const st = Math.sin(jb); const tap = Math.sin(jb * 2); q.bob = -.015 + .025 * Math.abs(tap); // つま先の足打ち(交互の前出し)
        Object.assign(q, {lThigh: -.25 * Math.max(0, tap), rThigh: -.25 * Math.max(0, -tap), lKnee: .3 * Math.max(0, tap), rKnee: .3 * Math.max(0, -tap)});// 頭上のアーチ腕+腰の反対腕(帽子踊りの姿勢)
        Object.assign(q, {lArm: 1.05 + .12 * st, rArm: .35 - .1 * st, lElb: -.55, rElb: -.6, sway: .14 * st, lean: .08 * st, headTilt: .09 * st});// 優雅な旋回の移動
        break;
      }
      case 'frevo': {
        // フレヴォ: ペルナンブコの傘踊り — 傘を掲げる腕+高キック+跳躍
        const fv = tt * 4.5; const st = Math.sin(fv); const kick = Math.sin(fv * 2); const leap = Math.max(0, Math.sin(fv * 1.5)); q.bob = -.02 - .07 * leap; // 連続する跳躍
        // 高キック(交互の鋭い蹴り)
        Object.assign(q, {lThigh: -.2 - .5 * Math.max(0, kick), rThigh: -.2 - .5 * Math.max(0, -kick), lKnee: .25 + .3 * Math.max(0, -kick), rKnee: .25 + .3 * Math.max(0, kick), lShin: .35, rShin: .35});// 傘を掲げる腕+バランスの反対腕
        Object.assign(q, {lArm: 1.15 + .15 * st, rArm: .6 - .3 * st, lElb: -.2, rElb: -.35, sway: .2 * st, lean: .12 * st, headTilt: .1 * st});break;
      }
      case 'siva': {
        // シヴァ: サモアの優雅な踊り — 波打つ両腕+腰の大きな揺れ
        const sv = tt * 1.8; const st = Math.sin(sv); const wave = Math.sin(sv * 2); q.bob = -.01 + .02 * Math.abs(st); // 腰の揺れ(左右の大きな横揺れ)
        Object.assign(q, {lThigh: -.12 + .1 * st, rThigh: -.12 - .1 * st, lKnee: .15, rKnee: .15});// 波打つ両腕(交互の流れる動き)
        Object.assign(q, {lArm: .7 + .35 * wave, rArm: .7 - .35 * wave, lElb: -.4 - .2 * wave, rElb: -.4 + .2 * wave, sway: .18 * st, lean: .06 * st, headTilt: .12 * st});break;
      }
      case 'gorshey': {
        // ゴルシェ: チベットの円舞 — 長袖を振る腕+弾むステップ+輪の移動
        const gs = tt * 2.4; const st = Math.sin(gs); const flap = Math.sin(gs * 1.5); q.bob = -.02 + .03 * Math.abs(flap); // 弾むステップ(交互の軽い脚上げ)
        Object.assign(q, {lThigh: -.1 + .18 * Math.max(0, st), rThigh: -.1 + .18 * Math.max(0, -st), lKnee: .2 + .1 * Math.abs(st), rKnee: .2 + .1 * Math.abs(st)});// 長袖を振る両腕(大きく開いて横に流す)
        Object.assign(q, {lArm: .8 + .4 * flap, rArm: .8 - .4 * flap, lElb: -.3 - .15 * flap, rElb: -.3 + .15 * flap, sway: .16 * st, lean: .07 * st, headTilt: .08 * st});// 円陣の回る移動
        break;
      }
      case 'seannos': {
        // シェーン・ノース: アイルランドの古式ソロ踊り — 低い姿勢+早い打足+垂れた腕
        const sn = tt * 3.4; const st = Math.sin(sn); const batter = Math.sin(sn * 3); Object.assign(q, {bob: .05 + .03 * Math.abs(batter), lThigh: -.15 + .2 * Math.max(0, batter), rThigh: -.15 + .2 * Math.max(0, -batter), lKnee: .3, rKnee: .3, lShin: -.05 + .15 * Math.max(0, -batter), rShin: -.05 + .15 * Math.max(0, batter)});// 低く地に張る // つま先での打足
        // 腕はだらりと下げて小さく揺れる
        Object.assign(q, {lArm: .12 + .06 * st, rArm: .12 - .06 * st, lElb: -.08, rElb: -.08, sway: .14 * st, lean: .05, headTilt: .08 * batter});break;
      }
      case 'salegy': {
        // サレギ: マダガスカルの祭り踊り — 速い腰揺れ+突き出す腕+軽いホップ
        const sy = tt * 4.5; const st = Math.sin(sy); const hop = Math.sin(sy * 2); Object.assign(q, {bob: -.01 - .03 * Math.abs(hop), lThigh: -.12 + .15 * Math.max(0, st), rThigh: -.12 + .15 * Math.max(0, -st), lKnee: .18, rKnee: .18});// 腰の速い揺れ(体を左右に打つ)
        q.sway = .2 * st; q.lean = .08 * st; // 突き出す両腕(前へ交互にパンプ)
        Object.assign(q, {lArm: .45 + .3 * Math.max(0, hop), rArm: .45 + .3 * Math.max(0, -hop), lElb: -.5, rElb: -.5, headTilt: .1 * st});break;
      }
      case 'otea': {
        // オテア: タヒチの祭典踊り — 激しい腰シミー+深い膝+優美な腕
        const ot = tt * 3; const shimmy = S(9); const st = Math.sin(ot); Object.assign(q, {bob: .04 + .015 * Math.abs(shimmy), lThigh: -.3, rThigh: -.3, lKnee: .35, rKnee: .35, lShin: .05, rShin: .05});// 高速の腰シミー // 深い膝の低姿勢
        // 腰の高速シミー(体の横振り)
        q.sway = .12 * shimmy; q.lean = .03; // 優美な両腕(頭を囲む丸いフレーム+小さな揺れ)
        Object.assign(q, {lArm: .95 + .1 * st, rArm: .95 - .1 * st, lElb: -.7, rElb: -.7, headTilt: .05 * shimmy});break;
      }
      case 'meke': {
        // メケ: フィジーの戦舞踊 — 棍棒を掲げる腕+交互の突き出し+大きな踏み込み
        const mk = tt * 3.2; const st = Math.sin(mk); const thrust = Math.sin(mk * 2); Object.assign(q, {bob: -.02 - .04 * Math.abs(st), lThigh: -.25 + .2 * Math.max(0, st), rThigh: -.25 + .2 * Math.max(0, -st), lKnee: .3, rKnee: .3});// 弾む大きな動き
        // 棍棒の腕(高く掲げて突き出す)
        Object.assign(q, {lArm: 1.05 + .1 * st, lElb: -.15, rArm: .35 + .5 * Math.max(0, thrust), rElb: -.4 + .2 * Math.max(0, -thrust), sway: .15 * st, lean: .1, headTilt: .06 * st});// 交互の突き出し // 前傾の構え
        break;
      }
      case 'singsing': {
        // シンシン: PNGの祭典踊り — 飛び跳ねる両脚+槍を構える腕+揺れる胴
        const sg = tt * 4; const jump = Math.abs(Math.sin(sg)); const thrust = Math.sin(sg * 1.5); Object.assign(q, {bob: -.02 - .06 * jump, lThigh: -.3 - .15 * jump, rThigh: -.3 - .15 * jump, lKnee: .35, rKnee: .35, lShin: -.1, rShin: -.1});// 連続の跳躍
        // 槍を構える両腕(上に掲げて揺する)
        Object.assign(q, {lArm: 1.0 + .15 * thrust, rArm: 1.0 - .15 * thrust, lElb: -.25, rElb: -.25, sway: .12 * Math.sin(sg * .7), lean: .12, headTilt: .07 * thrust});// 前傾の構え
        break;
      }
      case 'lakalaka': {
        // ラカラカ: トンガの儀礼踊り — 厳かな体揺れ+正確な交互の腕振り
        const lk = tt * 2.6; const st = Math.sin(lk); const gesture = Math.sin(lk * 2); Object.assign(q, {bob: .01 + .02 * Math.abs(st), lThigh: -.08, rThigh: -.08, lKnee: .1, rKnee: .1});// 僅かな揺れ(落ち着き)
        // 正確な腕の振り(交互に上げ下げする儀礼的な動作)
        Object.assign(q, {lArm: .6 + .45 * Math.max(0, gesture), rArm: .6 + .45 * Math.max(0, -gesture), lElb: -.35 - .1 * gesture, rElb: -.35 + .1 * gesture, sway: .1 * st, lean: .04, headTilt: .06 * st});// 端正な体揺れ
        break;
      }
      case 'toka': {
        // トカ: バヌアトの祭り踊り — 深いスタンプ+左右の重い揺れ+供物の腕
        const tk = tt * 3; const stamp = Math.sin(tk * 2); const st = Math.sin(tk); Object.assign(q, {bob: .04 + .05 * Math.abs(stamp), lThigh: -.25 + .3 * Math.max(0, stamp), rThigh: -.25 + .3 * Math.max(0, -stamp), lKnee: .35, rKnee: .35, lShin: -.15 * Math.max(0, -stamp), rShin: -.15 * Math.max(0, stamp)});// 重い沈み込み // 交互の大きなスタンプ
        // 供物を捧げる両腕(前へゆっくり上げ下げ)
        Object.assign(q, {lArm: .5 + .2 * st, rArm: .5 - .2 * st, lElb: -.45, rElb: -.45, sway: .18 * st, lean: .08, headTilt: .09 * st});// 左右の重い揺れ
        break;
      }
      case 'vira': {
        // ヴィラ: ポルトガルの旋回踊り — 速い足捌き+回転の傾き+掲げる腕
        const vr = tt * 5; const st = Math.sin(vr); const step = Math.sin(vr * 3); Object.assign(q, {bob: .03 + .02 * Math.abs(st), lThigh: -.15 + .2 * Math.max(0, step), rThigh: -.15 + .2 * Math.max(0, -step), lKnee: .22, rKnee: .22, lShin: -.08 * Math.max(0, -step), rShin: -.08 * Math.max(0, step)});// 交互の速い足捌き
        // 頭上で揺れる両腕(組んで掲げる)
        Object.assign(q, {lArm: .9 + .15 * st, rArm: .9 - .15 * st, lElb: -.2, rElb: -.2, sway: .22 * st, lean: .06, headTilt: .1 * st});// 回転の大きな傾き
        break;
      }
      case 'yarkhushta': {
        // ヤルフシュタ: アルメニアの戦士踊り — 重いスタンプ+組んだ腕+左右の揺れ
        const yk = tt * 3.4; const stamp2 = Math.sin(yk * 2); const st = Math.sin(yk); Object.assign(q, {bob: .05 + .05 * Math.abs(stamp2), lThigh: -.3 + .35 * Math.max(0, stamp2), rThigh: -.3 + .35 * Math.max(0, -stamp2), lKnee: .4, rKnee: .4, lShin: -.12 * Math.max(0, -stamp2), rShin: -.12 * Math.max(0, stamp2)});// 深い沈み込み // 力強い交互スタンプ
        // 肩に組んだ腕(水平に近い連携の姿勢)
        Object.assign(q, {lArm: .28 + .08 * st, rArm: .28 - .08 * st, lElb: -.15, rElb: -.15, sway: .14 * st, lean: .1, headTilt: .05 * st});// 連携の重い揺れ
        break;
      }
      case 'yalli': {
        // ヤッル: アゼルバイジャンの連舞 — 肩を組んだ前後の波+小さな足運び
        const yl = tt * 2.8; const st = Math.sin(yl); const wave = Math.sin(yl * 1.4); Object.assign(q, {bob: .02 + .02 * Math.abs(st), lThigh: -.12 + .1 * Math.max(0, wave), rThigh: -.12 + .1 * Math.max(0, -wave), lKnee: .18, rKnee: .18});// 小さな前後の足運び
        // 肩に組んだ腕(連なった姿勢の水平腕)
        Object.assign(q, {lArm: .22 + .06 * st, rArm: .22 - .06 * st, lElb: -.12, rElb: -.12, sway: .16 * st, lean: .05 * wave, headTilt: .05 * st});// 一列の波のような揺れ // 前後への小さな傾き
        break;
      }
      case 'ardha': {
        // アルダ: サウジの剣舞踊 — 前後の揺れ+剣を掲げる腕+厳かな歩
        const ad = tt * 2.8; const st = Math.sin(ad); const raise = Math.sin(ad * 1.5); Object.assign(q, {bob: .03 + .025 * Math.abs(st), lThigh: -.1 + .08 * Math.max(0, st), rThigh: -.1 + .08 * Math.max(0, -st), lKnee: .15, rKnee: .15});// 厳かな前後の歩
        // 剣を掲げる右腕(頭上でゆっくり上下)
        Object.assign(q, {lArm: .35 + .1 * st, rArm: 1.05 + .1 * raise, lElb: -.2, rElb: -.1, sway: .1 * st, lean: .07, headTilt: .06 * st});// 列の揺れ
        break;
      }
      case 'stambeli': {
        // スタンベリ: チュニジアの儀式踊り — トランスの揺れ+首の沈み+開いた腕
        const sb = tt * 3.2; const st = Math.sin(sb); const trance = Math.sin(sb * 1.7); Object.assign(q, {bob: .035 + .03 * Math.abs(trance), lThigh: -.18, rThigh: -.18, lKnee: .28, rKnee: .28});// 揺れる沈み込み
        // 開いた腕(儀式的に横に広げて小刻みに振る)
        Object.assign(q, {lArm: .55 + .12 * trance, rArm: .55 - .12 * trance, lElb: -.3, rElb: -.3, sway: .15 * st, lean: .1, headTilt: .12 * trance});// 左右のトランス揺れ // 首の大きな揺れ
        break;
      }
      case 'ondunda': {
        // オンドゥンダ: ヒンバの輪踊り — 拍手の腕+砂を蹴る足+ゆったり揺れ
        const od = tt * 3.6; const st = Math.sin(od); const clap2 = Math.sin(od * 2); Object.assign(q, {bob: .03 + .02 * Math.abs(st), lThigh: -.12 + .18 * Math.max(0, clap2), rThigh: -.12 + .18 * Math.max(0, -clap2), lKnee: .2, rKnee: .2, lShin: -.1 * Math.max(0, -clap2), rShin: -.1 * Math.max(0, clap2)});// 砂を蹴る小さな脚上げ
        // 拍手する腕(前で合わせる交互の動き)
        Object.assign(q, {lArm: .45 + .2 * Math.max(0, clap2), rArm: .45 + .2 * Math.max(0, -clap2), lElb: -.5, rElb: -.5, sway: .1 * st, lean: .06, headTilt: .07 * st});// ゆったりした輪の揺れ
        break;
      }
      case 'lamvong': {
        // ラムヴォン: ラオスの輪踊り — 優美な指先の腕+滑る横歩+ゆるい揺れ
        const lv = tt * 2.2; const st = Math.sin(lv); const gl = Math.sin(lv * 1.3); Object.assign(q, {bob: .018 + .015 * Math.abs(st), lThigh: -.08 + .06 * Math.max(0, gl), rThigh: -.08 + .06 * Math.max(0, -gl), lKnee: .12, rKnee: .12});// 沈み気味の滑らかな揺れ // 滑る横歩
        // 優美な腕(枠を作るような曲線の構え)
        Object.assign(q, {lArm: .4 + .15 * Math.sin(lv * 1.5), rArm: .4 - .15 * Math.sin(lv * 1.5), lElb: -.35 + .1 * st, rElb: -.35 - .1 * st, sway: .12 * st, lean: .05 * st, headTilt: .08 * Math.sin(lv * 1.3 + .5)});// 指先を反らす優美な肘 // 輪を描く横揺れ // 斜めの優美な首
        break;
      }
      case 'still': break;
      default: // idle
        Object.assign(q, {bob: .012 * S(2), lean: .02 * Math.sin(tt), lArm: .1 + .05 * S(1.3), rArm: .1 - .05 * S(1.3), headTilt: .06 * S(.7)});}
    return q;
  }

  function skeleton(p, q) {
    const legFrac = .40 + .13 * p.legLen; const headR = .055 + .05 * p.headSize; const neck = .03; const torsoTop = legFrac + Math.max(.12, 1 - legFrac - 2 * headR - neck); const shY = torsoTop - .04; const shHalf = .09 + .11 * p.shoulder; const armLen = .30 + .16 * p.armLen; const hipHalf = shHalf * .55;
    const K = {}; // model-space points (y up, feet y=0)

    // legs: hip -> knee -> ankle
    const legL = legFrac / 2;
    for (const [side, hipX, thA, knA, shn] of [['l', -hipHalf, q.lThigh, q.lKnee, q.lShin || 0], ['r', hipHalf, q.rThigh, q.rKnee, q.rShin || 0]]) {
      const hx = hipX, hy = legFrac; const kx = hx + Math.sin(thA) * legL, ky = hy - Math.cos(thA) * legL; const shA = thA - knA + shn; const ax = kx + Math.sin(shA) * legL, ay = ky - Math.cos(shA) * legL; K[side + 'Hip'] = [hx, hy]; K[side + 'Knee'] = [kx, ky]; K[side + 'Ank'] = [ax, Math.max(.015, ay)];
    }
    // arms: shoulder -> elbow -> wrist (angle 0 = down)
    const up = armLen / 2;
    for (const [side, sgn, aA, eA] of [['l', -1, q.lArm, q.lElb], ['r', 1, q.rArm, q.rElb]]) {
      const sx = sgn * shHalf, sy = shY; const ex = sx + sgn * Math.sin(aA) * up, ey = sy - Math.cos(aA) * up; const fa = aA - eA * sgn; const wx = ex + sgn * Math.sin(fa) * up, wy = ey - Math.cos(fa) * up; K[side + 'Sh'] = [sx, sy]; K[side + 'Elb'] = [ex, ey]; K[side + 'Wri'] = [wx, wy];
    }
    K.neckB = [0, torsoTop - .01]; K.neckT = [0, torsoTop + neck * .6]; K.headC = [Math.sin(q.headTilt + (p.headTilt - .5) * .5) * headR, torsoTop + neck + headR]; K.pelvis = [0, legFrac + .02]; K.torsoTop = [0, torsoTop]; K.headR = headR; K.shHalf = shHalf; K.hipHalf = hipHalf;
    return K;
  }

  function capsule(ctx, x1, y1, x2, y2, w, col, line) {
    ctx.lineCap = 'round';
    if (line > 0) {
      ctx.strokeStyle = 'rgba(40,44,54,0.85)'; ctx.lineWidth = w + line; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // 接地影: キャラクターを背景に「着地」させる最重要の合成要素。
  function contactShadow(ctx, cx, baseY, rx, alpha, col) {
    if (alpha <= 0 || rx <= 0) return;
    const g = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, rx);
    g.addColorStop(0, col || `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.fillStyle = g; ctx.translate(cx, baseY); ctx.scale(1, .24); ctx.translate(-cx, -baseY); ctx.beginPath(); ctx.arc(cx, baseY, rx, 0, 7); ctx.fill(); ctx.restore();
  }

  function heartPath(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * .6); ctx.bezierCurveTo(x - s * 1.1, y - s * .3, x - s * .55, y - s * 1.05, x, y - s * .35); ctx.bezierCurveTo(x + s * .55, y - s * 1.05, x + s * 1.1, y - s * .3, x, y + s * .6); ctx.closePath();
  }

  // 発光グロー: 色付きシルエットをぼかして背後に描く(全方位リムライト)
  function drawGlow(ctx, silCanvas, wPix, hPix, cx, baseY, strength) {
    if (strength <= 0) return;
    ctx.save(); ctx.globalAlpha = strength * .55;
    ctx.filter = `blur(${Math.round(4 + strength * 14)}px)`;
    ctx.drawImage(silCanvas, cx - wPix * .56, baseY - hPix * 1.06, wPix * 1.12, hPix * 1.12); ctx.restore();
  }

  // 床の鏡面反射: 被写体を上下反転して足元の下に薄く描く。src はimg/canvas/video何でも可
  function drawReflection(ctx, src, cx, baseY, wPix, hPix, strength) {
    if (strength <= 0) return;
    ctx.save(); ctx.globalAlpha = strength * .38; ctx.translate(cx, baseY); ctx.scale(1, -1); ctx.drawImage(src, -wPix / 2, -hPix, wPix, hPix); ctx.restore();
  }

  // ctx に (cx, baseY) を足元・高さ hPix で描画。q は mannequinPose の結果。
  function drawMannequin(ctx, p, t, cx, baseY, hPix) {
    const q = mannequinPose(p, t); const K = skeleton(p, q); const g = 1 - p.tone * .55; // tone: 0=白, 1=グレー
    // clothHue 0付近は無彩色(白モデル)のまま、上げると衣装色として着色
    const hue = Math.round(p.clothHue * 360), sat = p.clothHue < .03 ? 0 : 55;
    const col = `hsl(${hue},${sat}%,${Math.round(96 * g)}%)`;
    const shade = `hsl(${hue},${sat}%,${Math.round(85 * g)}%)`;
    const lw = (0.5 + p.line * 4);
    const px = (x, y) => [cx + (x + q.sway) * hPix, baseY - (y + q.bob) * hPix];
    const limbW = hPix * (.045 + .02 * p.shoulder); const bodyW = hPix * (.10 + .06 * p.shoulder);

    contactShadow(ctx, cx, baseY, hPix * (.16 + .07 * p.shoulder), p.shadow * .5, `hsla(${Math.round((p.shadowHue == null ? .62 : p.shadowHue) * 360)},45%,12%,${p.shadow * .5})`);

    ctx.save(); ctx.globalAlpha = p.opacity;
    if (p.flip) { ctx.translate(2 * cx, 0); ctx.scale(-1, 1); }

    // ケープ: 肩から背後へなびく布(衣装色を濃くして継承)
    if (p.acc === 'cape') {
      const cs = `hsla(${hue},${Math.max(sat, 45)}%,${Math.round(38 + 12 * g)}%,0.95)`;
      const sw = (q.lean * 2 + Math.sin(t * 1.8) * .05) * hPix; const [lShx, lShy] = px(...K.lSh), [rShx, rShy] = px(...K.rSh), [pelx, pely] = px(...K.pelvis); ctx.fillStyle = cs; ctx.beginPath(); ctx.moveTo(lShx, lShy); ctx.quadraticCurveTo(lShx - bodyW + sw, pely + hPix * .06, pelx + sw * 1.5, pely + hPix * .3); ctx.quadraticCurveTo(rShx + bodyW + sw, pely + hPix * .06, rShx, rShy); ctx.closePath(); ctx.closePath(); ctx.fill();
    }

    // legs
    for (const s of ['l', 'r']) {
      const [h, k, a] = [K[s + 'Hip'], K[s + 'Knee'], K[s + 'Ank']]; capsule(ctx, ...px(...h), ...px(...k), limbW, shade, lw); capsule(ctx, ...px(...k), ...px(...a), limbW * .85, col, lw); const [ax, ay] = px(...a); capsule(ctx, ax, ay, ax + limbW * .8, ay, limbW * .5, shade, lw); // foot
    }
    // torso
    capsule(ctx, ...px(...K.pelvis), ...px(...K.torsoTop), bodyW, col, lw);
    // arms
    for (const s of ['l', 'r']) {
      const [sh, el, wr] = [K[s + 'Sh'], K[s + 'Elb'], K[s + 'Wri']]; capsule(ctx, ...px(...sh), ...px(...el), limbW * .8, col, lw); capsule(ctx, ...px(...el), ...px(...wr), limbW * .7, shade, lw); const [wx, wy] = px(...wr); ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(wx, wy, limbW * .55, 0, 7); ctx.fill(); // hand
    }
    // neck + head
    capsule(ctx, ...px(...K.neckB), ...px(...K.neckT), limbW * .7, col, lw); const [hx, hy] = px(...K.headC), hr = K.headR * hPix;
    // 髪: キャラクリの顔。hairHueで着色、hair形状は手続き描画
    const hs = p.hair || 'none';
    const hairC = `hsl(${Math.round(p.hairHue * 360)},50%,${Math.round(26 + 16 * g)}%)`;
    if (hs === 'long' || hs === 'twin' || hs === 'bob') {
      // 後ろ髪: 頭の背面へ垂れる髪を顔より先に描く
      ctx.fillStyle = hairC; ctx.beginPath(); ctx.ellipse(hx, hy + hr * .5, hr * 1.22, hr * (hs === 'long' ? 1.55 : hs === 'bob' ? .95 : .75), 0, 0, 7); ctx.fill();
      if (hs === 'twin') for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(hx + s * hr * 1.18, hy + hr * .75, hr * .3, hr * .8, s * .4, 0, 7); ctx.fill();
      }
    }
    ctx.fillStyle = col;
    if (lw > 0) { ctx.strokeStyle = 'rgba(40,44,54,0.85)'; ctx.lineWidth = lw; }
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); ctx.fill();
    if (lw > 0) ctx.stroke();
    if (hs === 'pony') {
      // ポニーテール: 頭の右後ろから流れる髪束
      ctx.fillStyle = hairC; ctx.beginPath(); ctx.moveTo(hx + hr * .55, hy - hr * .95); ctx.quadraticCurveTo(hx + hr * 1.55, hy - hr * .55, hx + hr * 1.35, hy + hr * .95); ctx.quadraticCurveTo(hx + hr * .9, hy + hr * .45, hx + hr * .75, hy - hr * .5); ctx.closePath(); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.beginPath(); ctx.arc(hx + hr * .52, hy - hr * .82, hr * .16, 0, 7); ctx.beginPath(); ctx.arc(hx + hr * .52, hy - hr * .82, hr * .16, 0, 7); ctx.fill(); // 結び目
    }
    if (hs === 'mush') {
      // マッシュルーム: 頭全体を覆う丸いキノコ頭(顔の下半分だけ残す)
      ctx.fillStyle = hairC; ctx.beginPath(); ctx.arc(hx, hy - hr * .18, hr * 1.14, Math.PI, Math.PI * 2); ctx.quadraticCurveTo(hx + hr * 1.14, hy + hr * .28, hx + hr * .9, hy + hr * .3); ctx.lineTo(hx - hr * .9, hy + hr * .3); ctx.quadraticCurveTo(hx - hr * 1.14, hy + hr * .28, hx - hr * 1.14, hy - hr * .18); ctx.closePath(); ctx.closePath(); ctx.fill();
    }
    if (hs === 'curly') {
      // パーマ: 頭全体を覆うモコモコの縮れ毛(重なる小円)
      ctx.fillStyle = hairC; const rng2 = mulberry32(31);
      for (let i = 0; i < 14; i++) {
        const a = Math.PI + (i / 13) * Math.PI; const rr = hr * (1.02 + rng2() * .18); ctx.beginPath(); ctx.arc(hx + Math.cos(a) * rr, hy - hr * .05 + Math.sin(a) * rr, hr * (.3 + rng2() * .14), 0, 7); ctx.fill(); // 上半周に配置
      }
    }
    if (hs === 'braid') {
      // 三つ編み: 側頭部から垂れる玉髪(交互ずれの連続円+先の結び目)
      ctx.fillStyle = hairC; const bx = hx + hr * .8, by = hy - hr * .1;
      for (let k = 0; k < 6; k++) {
        ctx.beginPath(); ctx.ellipse(bx + ((k % 2) ? .07 : -.07) * hr, by + k * hr * .32, hr * .19, hr * .22, 0, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(52,56,68,0.95)'; ctx.fillRect(bx - hr * .1, by + 6 * hr * .32 - hr * .06, hr * .2, hr * .1);
    }
    if (hs === 'pomp') {
      // ポンパドール: 前髪を高く盛り上げたリーゼント風
      ctx.fillStyle = hairC; ctx.beginPath(); ctx.moveTo(hx - hr * .85, hy - hr * .45); ctx.quadraticCurveTo(hx - hr * .7, hy - hr * 1.7, hx + hr * .25, hy - hr * 1.5); ctx.quadraticCurveTo(hx + hr * .95, hy - hr * 1.3, hx + hr * .9, hy - hr * .4); ctx.lineTo(hx + hr * .5, hy - hr * .55); ctx.lineTo(hx - hr * .4, hy - hr * .5); ctx.closePath(); ctx.closePath(); ctx.fill();
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
      ctx.strokeStyle = hairC; ctx.lineWidth = Math.max(1.5, hr * .09); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + hr * .08, hy - hr * 1.02); ctx.quadraticCurveTo(hx + hr * .55, hy - hr * 1.9, hx + hr * .85, hy - hr * 1.35); ctx.stroke();
    }
    if (hs === 'mohawk') {
      // モヒカン: 頭頂の縦帯(前髪キャップは描かず剥ぎ感を出す)
      ctx.fillStyle = hairC; ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.05, hr * .24, hr * .5, 0, 0, 7); ctx.fill();
    }
    if (hs !== 'none' && hs !== 'mohawk') {
      // 前髪+キャップ: 頭の上半分を覆い、ギザギザ前髪で顔を残す
      ctx.fillStyle = hairC; ctx.beginPath(); ctx.arc(hx, hy, hr * 1.1, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(hx + hr * .95, hy - hr * .18); ctx.lineTo(hx + hr * .6, hy - hr * .38); ctx.lineTo(hx + hr * .22, hy - hr * .12); ctx.lineTo(hx - hr * .18, hy - hr * .38); ctx.lineTo(hx - hr * .55, hy - hr * .12); ctx.lineTo(hx - hr * .95, hy - hr * .38); ctx.closePath(); ctx.closePath(); ctx.fill();
    }
    // eyes (素朴な2点、まばたきで縦につぶれる)
    // eyes: スタイル別(ふつう2点/ウィンク/うっとり^^/ハート)。dotのみ瞬きでつぶれる
    const eo = Math.max(.12, blinkOpen(t, p.seed));
    const eyeCol = `hsla(${Math.round(p.eyeHue * 360)},65%,42%,0.9)`;
    const es = p.eyeStyle || 'dot'; const esz = .6 + p.eyeSize * .8; // 目の大きさスケール(0.6-1.4)
    for (const s of [-1, 1]) {
      const ex = hx + s * hr * (.26 + .24 * (p.eyeGap == null ? .5 : p.eyeGap)), ey = hy - hr * .08;
      if (es === 'closed' || (es === 'wink' && s === 1)) {
        ctx.strokeStyle = 'rgba(60,64,74,0.85)'; ctx.lineWidth = Math.max(1, hr * .08 * esz); ctx.beginPath(); ctx.arc(ex, ey, hr * .13 * esz, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
      } else if (es === 'sharp') {
        // キリッ目: 外側が上がった鋭角ライン(怒り/決意の表情)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = Math.max(1, hr * .07 * esz); ctx.beginPath(); ctx.moveTo(ex + s * hr * .16 * esz, ey - hr * .05 * esz); ctx.lineTo(ex - s * hr * .16 * esz, ey + hr * .09 * esz); ctx.stroke();
      } else if (es === 'heart') {
        ctx.fillStyle = eyeCol; heartPath(ctx, ex, ey, hr * .15 * esz); ctx.fill();
      } else if (es === 'star') {
        // 星目: 5点スター(アイドル/魔法少女系の定番)
        ctx.fillStyle = eyeCol; ctx.beginPath(); const sr = hr * .17 * esz;
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? sr * .45 : sr; const mx = ex + Math.cos(a) * rr, my2 = ey + Math.sin(a) * rr; k ? ctx.lineTo(mx, my2) : ctx.moveTo(mx, my2);
        }
        ctx.closePath(); ctx.fill();
      } else if (es === 'wide') {
      // 見開き目: 大きな白目+小さい瞳(驚き・キラキラ)
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.beginPath(); ctx.arc(ex - eo, ey, esz * .62 * eo, 0, 7); ctx.beginPath(); ctx.arc(ex - eo, ey, esz * .62 * eo, 0, 7); ctx.fill(); ctx.beginPath(); ctx.beginPath(); ctx.arc(ex + eo, ey, esz * .62 * eo, 0, 7); ctx.beginPath(); ctx.arc(ex + eo, ey, esz * .62 * eo, 0, 7); ctx.fill(); ctx.fillStyle = eyeCol; ctx.beginPath(); ctx.beginPath(); ctx.arc(ex - eo, ey, esz * .3 * eo, 0, 7); ctx.beginPath(); ctx.arc(ex - eo, ey, esz * .3 * eo, 0, 7); ctx.fill(); ctx.beginPath(); ctx.beginPath(); ctx.arc(ex + eo, ey, esz * .3 * eo, 0, 7); ctx.beginPath();
      ctx.arc(ex + eo, ey, esz * .3 * eo, 0, 7); ctx.fill();
    } else if (es === 'cat') {
        // 猫目: 縦長の縦孔瞳孔(瞬きと連動)
        ctx.fillStyle = eyeCol; ctx.beginPath(); ctx.ellipse(ex, ey, Math.max(.8, hr * .045 * esz), Math.max(1, hr * .15 * esz * Math.max(.15, eo)), 0, 0, 7); ctx.fill();
      } else if (es === 'xx') {
        // バツ目: ✕✕(気絶・KO系の定番記号)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = Math.max(1.2, hr * .05 * esz); const rr = hr * .13 * esz; ctx.beginPath(); ctx.moveTo(ex - rr, ey - rr); ctx.moveTo(ex - rr, ey - rr); ctx.lineTo(ex + rr, ey + rr); ctx.moveTo(ex + rr, ey - rr); ctx.moveTo(ex + rr, ey - rr); ctx.lineTo(ex - rr, ey + rr); ctx.stroke();
      } else if (es === 'dizzy') {
        // ぐるぐる目: 渦巻き(旋回する小円弧の連鎖で近似)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = Math.max(1, hr * .06 * esz); ctx.beginPath(); const dr = hr * .16 * esz;
        for (let k = 0; k < 8; k++) {
          const a = k * 1.05, r2 = dr * (1 - k / 10); const mx = ex + Math.cos(a) * r2, my2 = ey + Math.sin(a) * r2; k ? ctx.lineTo(mx, my2) : ctx.moveTo(mx, my2);
        }
        ctx.stroke();
      } else if (es === 'crying') {
        // 泣き目: ふつうの瞳 + 目尻側に涙滴(瞬きにも連動)
        ctx.fillStyle = eyeCol; ctx.beginPath(); ctx.ellipse(ex, ey, Math.max(1, hr * .09 * esz), Math.max(.5, hr * .09 * esz * eo), 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(130,175,255,0.85)'; const tx2 = ex + s * hr * .14, ty2 = ey + hr * .16; ctx.beginPath(); ctx.moveTo(tx2, ty2 - hr * .05); ctx.quadraticCurveTo(tx2 + hr * .07, ty2 + hr * .02, tx2, ty2 + hr * .09); ctx.quadraticCurveTo(tx2 - hr * .07, ty2 + hr * .02, tx2, ty2 - hr * .05); ctx.fill();
      } else {
        ctx.fillStyle = eyeCol; ctx.beginPath();
        // gaze: 瞳を左右にずらす(目線)
        const gx = ex + ((p.gaze == null ? .5 : p.gaze) - .5) * hr * .3; ctx.ellipse(gx, ey, Math.max(1, hr * .09 * esz), Math.max(.5, hr * .09 * esz * eo), 0, 0, 7); ctx.fill();
        // 瞳のハイライト(キャッチライト): 生き生きした目にする白点
        if (eo > .4) {
          ctx.fillStyle = `rgba(255,255,255,${.85 * eo})`;
          ctx.beginPath(); ctx.arc(gx - hr * .03 * esz, ey - hr * .035 * esz * eo, Math.max(.6, hr * .028 * esz), 0, 7); ctx.fill();
        }
      }
    }
    // 眉毛: brow<.5 で垂れ眉(困り) / >.5 で内側が下がるきりっと眉
    const bt = (p.brow - .5) * hr * .3;
    if (Math.abs(bt) > hr * .02) {
      ctx.strokeStyle = 'rgba(60,64,74,0.8)'; ctx.lineWidth = Math.max(1, hr * .07);
      for (const s of [-1, 1]) {
        const by = hy - hr * .36; ctx.beginPath(); ctx.moveTo(hx + s * hr * .18, by + bt); ctx.lineTo(hx + s * hr * .56, by - bt * .3); ctx.stroke();
      }
    }
    // 頬の赤み
    if (p.blush > .02) {
      ctx.fillStyle = `rgba(255,120,140,${p.blush * .4})`;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(hx + s * hr * .55, hy + hr * .18, hr * .16, hr * .09, 0, 0, 7); ctx.fill();
      }
    }
    // mouth: smile .5=直線、>で笑顔・<でしかめ面
    const mw = hr * .32, my = hy + hr * .38, curv = (p.smile - .5) * hr * .8;
    if (Math.abs(curv) > hr * .03) {
      ctx.strokeStyle = 'rgba(60,64,74,0.7)'; ctx.lineWidth = Math.max(1, hr * .07); ctx.beginPath(); ctx.beginPath(); ctx.moveTo(hx - mw, my); ctx.quadraticCurveTo(hx, my + curv * 2, hx + mw, my); ctx.quadraticCurveTo(hx, my + curv * 2, hx + mw, my); ctx.stroke();
    }
    // おしゃべり: 口が周期的に開閉(話している表情)
    if (p.anim === 'talk') {
      const mo = Math.abs(Math.sin(t * 5.5));
      ctx.fillStyle = `rgba(120,40,45,${.55 * mo})`;
      ctx.beginPath(); ctx.ellipse(hx, my + curv * 1.1, mw * .45, Math.max(1, hr * .11 * mo), 0, 0, 7); ctx.fill();
    } else if (p.smile > .78) {
      // 大きな笑顔(smile>.78)では口を開いて赤味を見せる表情に
      const op = (p.smile - .78) / .22;
      ctx.fillStyle = `rgba(120,40,45,${.55 * op})`;
      ctx.beginPath(); ctx.ellipse(hx, my + curv * 1.1, mw * .5, Math.max(1, hr * .1 * op), 0, 0, 7); ctx.fill();
    }
    drawAccessory(ctx, p.acc, hx, hy, hr, p.accHue);
    if (p.acc2 && p.acc2 !== 'none' && p.acc2 !== p.acc) drawAccessory(ctx, p.acc2, hx, hy, hr, p.accHue);
    ctx.restore();
  }

  // ふきだし: モデルの頭の上にセリフの吹き出しを描く(丸角矩形+尾)
  function drawBubble(c, text, x, topY, W, H, hue) {
    if (!text) return;
    const fs = Math.max(13, Math.round(H * .03)); c.save();
    c.font = `600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`;
    const tw = Math.min(c.measureText(text).width, W * .6); const bw = tw + fs * 1.4, bh = fs * 2; const bx = Math.min(Math.max(x - bw / 2, 6), W - bw - 6); const by = Math.max(6, topY - bh - fs * 1.2); const r = fs * .5;
    c.fillStyle = `hsla(${Math.round((hue == null ? 0 : hue) * 360)},60%,96%,0.94)`;
    c.strokeStyle = 'rgba(40,44,54,0.8)'; c.lineWidth = Math.max(1, fs * .08); c.beginPath(); c.moveTo(bx + r, by); c.lineTo(bx + bw - r, by); c.lineTo(bx + bw - r, by); c.quadraticCurveTo(bx + bw, by, bx + bw, by + r); c.lineTo(bx + bw, by + bh - r); c.lineTo(bx + bw, by + bh - r); c.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh); c.lineTo(bx + r, by + bh); c.lineTo(bx + r, by + bh); c.quadraticCurveTo(bx, by + bh, bx, by + bh - r); c.lineTo(bx, by + r); c.lineTo(bx, by + r); c.quadraticCurveTo(bx, by, bx + r, by); c.closePath();
    // 尾(モデル方向へ三角)
    const tx = Math.min(Math.max(x, bx + fs), bx + bw - fs); c.moveTo(tx - fs * .3, by + bh - 1); c.lineTo(tx + fs * .3, by + bh - 1); c.lineTo(x, topY - fs * .2); c.closePath(); c.fill(); c.fill(); c.stroke(); c.fillStyle = '#22252e'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, bx + bw / 2, by + bh / 2, tw + fs); c.restore();
  }

  // パーティクル: シーン全体の空気感エフェクト(雪/キラキラ/花びら)。seed決定論
  // 光沢: 白い帯が被写体を左→右にテカテカとスイープ(source-atopでシルエット内のみ)
  function shined(src, sctx, cv, t, amt) {
    cv.width = Math.max(2, src.width); cv.height = Math.max(2, src.height); sctx.clearRect(0, 0, cv.width, cv.height); sctx.drawImage(src, 0, 0, cv.width, cv.height); sctx.globalCompositeOperation = 'source-atop'; const ph = ((t * .45) % 2) - .5; const gr = sctx.createLinearGradient(cv.width * (ph - .28), 0, cv.width * ph, cv.height * .65); gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.5, `rgba(255,255,255,${.6 * amt})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)'); sctx.fillStyle = gr; sctx.fillRect(0, 0, cv.width, cv.height); sctx.globalCompositeOperation = 'source-over';
    return cv;
  }

  function drawParticles(ctx, W, H, type, t, seed) {
    const S = f => Math.sin(t * f), A = f => Math.abs(S(f));
    const h = (i, k) => mulberry32((seed | 0) * 7919 + i * 131 + k)();
    const N = type === 'snow' ? 70 : type === 'petal' ? 34 : type === 'rain' ? 110 : type === 'leaf' ? 30 : type === 'ember' ? 38 : type === 'bubble' ? 28 : type === 'confetti' ? 70 : type === 'firefly' ? 26 : type === 'bokeh' ? 16 : type === 'notes' ? 18 : type === 'hearts' ? 20 : type === 'spark' ? 46 : type === 'wind' ? 14 : 42; ctx.save();
    for (let i = 0; i < N; i++) {
      if (type === 'snow') {
        const x = h(i, 0) * W + Math.sin(t * .8 + h(i, 1) * 7) * W * .02; const y = ((h(i, 1) + t * (.04 + .06 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `rgba(255,255,255,${.4 + .5 * h(i, 4)})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + 2.5 * h(i, 3), 0, 7); ctx.fill();
      } else if (type === 'sparkle') {
        const a = .25 + .75 * Math.abs(Math.sin(t * (.8 + h(i, 2) * 2.2) + h(i, 3) * 7)); const x = h(i, 0) * W, y = h(i, 1) * H, r = 2 + 4 * h(i, 4);
        ctx.strokeStyle = `rgba(255,230,140,${a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.beginPath(); ctx.moveTo(x - r, y); ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
      } else if (type === 'rain') {
        // 雨: 斜めの速いストリーク
        const x = (h(i, 0) + t * .3) % 1 * W; const y = ((h(i, 1) + t * (.5 + .3 * h(i, 2))) % 1) * H;
        ctx.strokeStyle = `rgba(160,190,235,${.3 + .35 * h(i, 4)})`;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9 + 6 * h(i, 3)); ctx.stroke();
      } else if (type === 'leaf') {
        // 落ち葉: 揺れながら回転して舞い落ちる
        const x = h(i, 0) * W + Math.sin(t * .7 + h(i, 1) * 8) * W * .06; const y = ((h(i, 1) + t * (.04 + .03 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `hsla(${30 + 40 * h(i, 3)},60%,${35 + 25 * h(i, 4)}%,.8)`;
        ctx.beginPath(); ctx.ellipse(x, y, 2.5 + 2.5 * h(i, 3), 1.2 + 1.2 * h(i, 3), Math.sin(t * 1.6 + i * 2) * 1.4, 0, 7); ctx.fill();
      } else if (type === 'ember') {
        // 火の粉: 揺らめきながら上昇
        const x = h(i, 0) * W + Math.sin(t * 1.4 + h(i, 1) * 9) * W * .04; const y = (1 - ((h(i, 1) + t * (.05 + .05 * h(i, 2))) % 1)) * H; const fl = .4 + .6 * Math.abs(Math.sin(t * 3 + i));
        ctx.fillStyle = `rgba(255,${120 + 80 * h(i, 3) | 0},60,${fl * .85})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + 1.8 * h(i, 3), 0, 7); ctx.fill();
      } else if (type === 'bubble') {
        // 泡: ゆらゆら上昇する泡(輪郭線)
        const x = h(i, 0) * W + Math.sin(t * .9 + h(i, 1) * 8) * W * .05; const y = (1 - ((h(i, 1) + t * (.04 + .04 * h(i, 2))) % 1)) * H;
        ctx.strokeStyle = `rgba(170,215,255,${.35 + .35 * h(i, 4)})`;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 2 + 4 * h(i, 3), 0, 7); ctx.stroke();
      } else if (type === 'confetti') {
        // 紙吹雪: カラフルな長方形がひらひら回転しながら舞い落ちる
        const x = h(i, 0) * W + Math.sin(t * (1 + h(i, 2)) + h(i, 1) * 9) * W * .06; const y = ((h(i, 1) + t * (.1 + .09 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `hsla(${Math.round(h(i, 3) * 360)},85%,62%,${.6 + .3 * h(i, 4)})`;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3 + i * 2.7) * 2.4); ctx.fillRect(-2.5 - 2.5 * h(i, 4), -1.4, 5 + 5 * h(i, 4), 2.8); ctx.restore();
      } else if (type === 'firefly') {
        // ホタル: ぼんやり光りながら漂う(夜空・夕焼けと相性)
        const x = h(i, 0) * W + Math.sin(t * .5 + i * 1.7) * W * .07; const y = h(i, 1) * H * .85 + Math.cos(t * .4 + i * 2.3) * H * .05; const a = Math.max(0, .15 + .8 * Math.sin(t * (1.2 + h(i, 2)) + h(i, 3) * 9));
        ctx.fillStyle = `rgba(200,255,120,${a})`;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + 1.4 * h(i, 3), 0, 7); ctx.fill();
      } else if (type === 'spark') {
        // 火花: 一点から放射状に飛ぶ短い光条(火縄・スパーク演出)
        const ox = W * (.2 + h(i, 0) * .6), oy = H * (.25 + h(i, 1) * .5); const life = (h(i, 2) + t * (1.5 + h(i, 3))) % 1; const ang = h(i, 4) * 6.283 + i * .7; const dist = life * (14 + 26 * h(i, 1)); const sx = ox + Math.cos(ang) * dist, sy = oy + Math.sin(ang) * dist + life * life * 10; // 0→1 の短い生涯
        ctx.strokeStyle = `rgba(255,${200 - Math.round(life * 120)},90,${(1 - life) * .9})`;
        ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - Math.cos(ang) * 5, sy - Math.sin(ang) * 5); ctx.stroke();
      } else if (type === 'wind') {
        // 風: 右へ流れる長い弧の流線(途切れて再出現)
        const life = (h(i, 0) + t * (.12 + .1 * h(i, 1))) % 1; const x = (life * 1.3 - .15) * W; const y = h(i, 2) * H + Math.sin(life * 6 + i) * H * .02; const len = W * (.06 + .08 * h(i, 3)); const a = Math.sin(life * Math.PI) * (.25 + .3 * h(i, 4));
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 1.2 + h(i, 3); ctx.beginPath(); ctx.moveTo(x - len, y); ctx.quadraticCurveTo(x - len * .5, y - len * .22, x, y); ctx.quadraticCurveTo(x + len * .18, y + len * .12, x + len * .3, y + len * .05); ctx.stroke();
      } else if (type === 'hearts') {
        // ハート: ♥マークがふわふわ昇る
        const x = h(i, 0) * W + Math.sin(t * .7 + i * 2.1) * W * .045; const y = (1 - ((h(i, 1) + t * (.05 + .035 * h(i, 2))) % 1)) * H;
        ctx.fillStyle = `hsla(${330 + Math.round(h(i, 3) * 30)},85%,${62 + Math.round(h(i, 4) * 12)}%,${.5 + .35 * h(i, 4)})`;
        ctx.font = `${Math.round(12 + 14 * h(i, 3))}px sans-serif`;
        ctx.textAlign = 'center'; ctx.fillText('♥', x, y);
      } else if (type === 'notes') {
        // 音符: ♪♫ がゆらゆら昇る(ダンス・おしゃべりと相性)
        const x = h(i, 0) * W + Math.sin(t * .8 + i * 1.7) * W * .04; const y = (1 - ((h(i, 1) + t * (.06 + .04 * h(i, 2))) % 1)) * H;
        ctx.fillStyle = `hsla(${Math.round(h(i, 3) * 360)},70%,68%,${.55 + .3 * h(i, 4)})`;
        ctx.font = `${Math.round(14 + 12 * h(i, 3))}px sans-serif`;
        ctx.textAlign = 'center'; ctx.fillText(h(i, 2) < .5 ? '♪' : '♫', x, y);
      } else if (type === 'bokeh') {
        // 光ボケ: 大きな柔らかい光玉がゆっくり昇る(写真のボケ表現)
        const x = h(i, 0) * W + Math.sin(t * .3 + i) * W * .03; const y = (1 - ((h(i, 1) + t * (.02 + .02 * h(i, 2))) % 1)) * H;
        ctx.fillStyle = `hsla(${Math.round(h(i, 3) * 360)},80%,75%,${.1 + .12 * h(i, 4)})`;
        ctx.beginPath(); ctx.arc(x, y, 8 + 22 * h(i, 3), 0, 7); ctx.fill();
      } else { // petal
        const x = h(i, 0) * W + Math.sin(t * .6 + h(i, 1) * 9) * W * .05; const y = ((h(i, 1) + t * (.03 + .03 * h(i, 2))) % 1) * H;
        ctx.fillStyle = `rgba(255,170,190,${.55 + .3 * h(i, 4)})`;
        ctx.beginPath(); ctx.ellipse(x, y, 3 + 3 * h(i, 3), 1.5 + 1.5 * h(i, 3), Math.sin(t * 2 + i) * 1.2, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  // アクセサリ: キャラクリ定番の頭部装飾を手続き描画。accHue でアクセント色を着色
  function drawAccessory(ctx, acc, hx, hy, hr, hue) {
    const dk = 'rgba(52,56,68,0.95)', acc2 = `hsla(${Math.round((hue == null ? .58 : hue) * 360)},80%,64%,0.92)`;
    // ペイント語彙: 塗りの最小プリミティブ(背景側と同名だがctx座標版)
      const ell = (x, y, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, 7); ctx.fill(); };
      const ells = (x, y, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, 7); ctx.stroke(); };
      const dots = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); };
      const LW = (v, m) => Math.max(m || 1, hr * v);
      const times = (n, f) => { for (let i = 0; i < n; i++) f(i); };
      const scat = (seed, n, f) => { const r = mulberry32(seed); times(n, i => f(r, i)); };
      const rect = (x, y, w, h) => ctx.fillRect(x, y, w, h);
      const FS = v => ctx.fillStyle = v;
      const SS = v => ctx.strokeStyle = v;
      const lnW = v => ctx.lineWidth = v;
      const poly = (...p) => { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const a = p[i]; if (a.length === 2) ctx.lineTo(a[0], a[1]); else if (a.length === 4) ctx.quadraticCurveTo(a[0], a[1], a[2], a[3]); else ctx.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]); } ctx.closePath(); ctx.fill(); };
      const polyS = (...p) => { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const a = p[i]; if (a.length === 2) ctx.lineTo(a[0], a[1]); else if (a.length === 4) ctx.quadraticCurveTo(a[0], a[1], a[2], a[3]); else ctx.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]); } ctx.closePath(); ctx.stroke(); };
    const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
    ctx.save();
    switch (acc) {
      case 'halo': {
        // 天使の輪: 頭上に浮く発光リング(accHueで着色、わずかに傾ける)
        SS(`hsla(${Math.round((hue == null ? .13 : hue) * 360)},85%,65%,0.95)`);
        lnW(LW(.13, 2)); ells(hx, hy - hr * 1.5, hr * .62, hr * .17, -.06);
        break;
      }
      case 'ribbon': {
        FS(acc2); const bx = hx - hr * .7, by = hy - hr * .75, s = hr * .42;
        ([-1, 1]).forEach(d => {
          poly([bx,by],[bx + d * s,by - s * .6],[bx + d * s,by + s * .6]);
        });
        FS(dk); dot(bx,by,s * .3);
        break;
      }
      case 'hat': {
        FS(dk); ell(hx,hy - hr * .62,hr * 1.25,hr * .22); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .85, hr * .72, hr * .5, 0, Math.PI, 0); ctx.fill(); FS(acc2); rect(hx - hr * .72, hy - hr * .85, hr * 1.44, hr * .12); // brim // dome // band
        break;
      }
      case 'shades': {
        FS('rgba(20,20,24,0.88)');
        ([-1, 1]).forEach(s => {
          dot(hx + s * hr * .38,hy - hr * .08,hr * .26); SS(dk); lnW(LW(.07)); ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.lineTo(hx + s * hr * .95, hy - hr * .18); ctx.stroke();
        });
        SS(dk); lnW(LW(.07)); ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .1); ctx.lineTo(hx + hr * .12, hy - hr * .1); ctx.stroke();
        break;
      }
      case 'glasses': {
        SS(dk); lnW(LW(.07));
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); ctx.beginPath(); ctx.arc(hx + s * hr * .38, hy - hr * .08, hr * .26, 0, 7); dots(hx + s * hr * .38, hy - hr * .08, hr * .26); ctx.beginPath(); ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.lineTo(hx + s * hr * .95, hy - hr * .18); ctx.beginPath(); ctx.moveTo(hx + s * hr * .64, hy - hr * .08); ctx.lineTo(hx + s * hr * .95, hy - hr * .18); ctx.stroke(); // temple
        });
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .1); ctx.lineTo(hx + hr * .12, hy - hr * .1); ctx.stroke(); // bridge
        break;
      }
      case 'crown': {
        FS(acc2); const cy = hy - hr * .62, cw = hr * .9; ctx.beginPath(); ctx.moveTo(hx - cw, cy);
        times(3, i => {
          const px = hx - cw + (i * 2 + 1) * cw / 3; ctx.lineTo(px - cw / 3, cy - hr * .5); ctx.lineTo(px + cw / 3, cy);
        });
        ctx.closePath(); ctx.fill(); FS(dk); rect(hx - cw, cy, cw * 2, hr * .14); // base band
        break;
      }
      case 'phones': {
        SS(dk); lnW(LW(.1, 1.5)); ctx.beginPath(); ctx.arc(hx, hy - hr * .35, hr * .95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); FS(acc2); // headband
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .95,hy - hr * .1,hr * .16,hr * .28); // ear cups
        });
        break;
      }
      case 'beard': {
        FS('rgba(70,60,52,0.88)'); ell(hx,hy + hr * .55,hr * .62,hr * .5); FS('rgba(255,255,255,0.5)'); ell(hx,hy + hr * .38,hr * .28,hr * .12); // 顎周り // 口元の隙間
        break;
      }
      case 'mask': {
        FS(dk); ell(hx,hy - hr * .12,hr * .92,hr * .34); FS('#fdfdfd'); // 眼帯バンド
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .4,hy - hr * .1,hr * .22,hr * .16); // 目穴
        });
        break;
      }
      case 'scarf': {
        // マフラー: 首の帯 + 風に揺れる垂れ端
        ctx.fillStyle = acc2; ell(hx,hy + hr * .75,hr * .78,hr * .22); ell(hx + hr * .42, hy + hr * 1.02, hr * .2, hr * .42, .5);
        break;
      }
      case 'beret': {
        // ベレー帽: 頭頂に斜め被せた円盤 + 茎
        ctx.fillStyle = acc2; ctx.save(); ctx.translate(hx - hr * .12, hy - hr * .92); ctx.rotate(-.22); ell(0,0,hr * .95,hr * .4); ctx.restore(); SS(acc2); lnW(LW(.06, 1.5)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * 1.28); ctx.lineTo(hx - hr * .12, hy - hr * 1.05); ctx.stroke();
        break;
      }
      case 'tie': {
        // ネクタイ: 首元の結び目 + 胸へ下がる帯(accHueで着色)
        FS(acc2); ctx.beginPath(); ctx.moveTo(hx - hr * .22, hy + hr * .82); ctx.moveTo(hx - hr * .22, hy + hr * .82); ctx.lineTo(hx + hr * .22, hy + hr * .82); ctx.lineTo(hx, hy + hr * 1.06); ctx.lineTo(hx, hy + hr * 1.06); ctx.closePath(); ctx.lineTo(hx, hy + hr * 1.06); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx - hr * .16, hy + hr * 1.06); ctx.moveTo(hx - hr * .16, hy + hr * 1.06); ctx.lineTo(hx + hr * .16, hy + hr * 1.06); ctx.lineTo(hx + hr * .1, hy + hr * 2.1); ctx.lineTo(hx + hr * .1, hy + hr * 2.1); ctx.lineTo(hx - hr * .1, hy + hr * 2.1); ctx.closePath(); ctx.closePath(); ctx.fill();
        break;
      }
      case 'monocle': {
        // モノクル: 右眼の円レンズ + 顎下へ下がるチェーン
        ctx.strokeStyle = `hsla(${Math.round((hue == null ? .12 : hue) * 360)},75%,60%,0.95)`;
        lnW(LW(.05, 1.2)); ctx.beginPath(); ctx.beginPath(); ctx.arc(hx + hr * .38, hy - hr * .12, hr * .26, 0, 7); dots(hx + hr * .38, hy - hr * .12, hr * .26); ctx.beginPath(); ctx.moveTo(hx + hr * .38, hy + hr * .14); ctx.quadraticCurveTo(hx + hr * .75, hy + hr * .6, hx + hr * .5, hy + hr * 1.05); ctx.stroke();
        break;
      }
      case 'bandana': {
        // バンダナ: 頭頂を覆う三角頭巾+結び目
        ctx.fillStyle = acc2; poly([hx - hr * 1.02,hy - hr * .55],[hx + hr * 1.02,hy - hr * .55],[hx + hr * .75,hy - hr * 1.5],[hx - hr * .75,hy - hr * 1.5]);
        // 結び目の垂れ端(右側)
        poly([hx + hr * .95,hy - hr * .6],[hx + hr * 1.25,hy - hr * .95],[hx + hr * 1.1,hy - hr * .5]); FS(dk); dot(hx + hr * .95,hy - hr * .62,hr * .09);
        break;
      }
      case 'coonskin': {
        // クーンスキン帽: 毛皮のドーム+後ろに垂れる縞尻尾
        // 尻尾(先に描く)
        FS('#8a7050'); ell(hx + hr * .75, hy + hr * .3, hr * .18, hr * .55, .3);
        // 尻尾の縞
        ctx.fillStyle = '#4a3a28';
        times(3, i => {
          ell(hx + hr * (.68 + i * .06), hy + hr * (0 + i * .28), hr * .14, hr * .09, .3);
        });
        // 毛皮ドーム
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .5, hr * .78, hr * .55, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 縁
        ctx.strokeStyle = dk; lnW(LW(.08, 1.5)); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .5, hr * .78, hr * .55, 0, Math.PI * .05, Math.PI * .95); ctx.stroke();
        break;
      }
      case 'wimple': {
        // ウィンプル: 頭・顎・首を包む中世の頭布(顔だけ開口)
        ctx.beginPath(); ctx.ellipse(hx, hy + hr * .35, hr * .82, hr * 1.05, 0, 0, 7); ctx.ellipse(hx, hy + hr * .1, hr * .55, hr * .62, 0, 0, 7); FS(acc2); ctx.fill('evenodd'); // 頭+首の覆い // 顔の開口
        // 布の縁取り
        ctx.strokeStyle = dk; lnW(LW(.06, 1.2)); ctx.beginPath(); ctx.ellipse(hx, hy + hr * .1, hr * .55, hr * .62, 0, Math.PI * .7, Math.PI * 1.3); ctx.stroke();
        // 顎下の巻き縁
        ctx.strokeStyle = dk; lnW(LW(.08, 1.5)); ctx.beginPath(); ctx.ellipse(hx, hy + hr * .5, hr * .68, hr * .35, 0, Math.PI * .15, Math.PI * .85); ctx.stroke();
        break;
      }
      case 'sariki': {
        // サリキ: クレタ島の頭巾 — 額に巻く黒い布+房+結び目
        ctx.fillStyle = acc2;
        // 額の帯(頭を一周する巻き布)
        poly([hx - hr * .55,hy - hr * .95],[hx,hy - hr * 1.15,hx + hr * .55,hy - hr * .95],[hx + hr * .5,hy - hr * .65],[hx,hy - hr * .85,hx - hr * .5,hy - hr * .65]);
        // 巻きの筋(2本の畝)
        SS(dk); lnW(LW(.045)); ctx.beginPath(); ctx.moveTo(hx - hr * .52, hy - hr * .9); ctx.quadraticCurveTo(hx, hy - hr * 1.08, hx + hr * .52, hy - hr * .9); ctx.moveTo(hx - hr * .5, hy - hr * .75); ctx.quadraticCurveTo(hx, hy - hr * .93, hx + hr * .5, hy - hr * .75); ctx.stroke();
        // 額に垂れる房(中央の短い房5本)
        SS(acc2); lnW(LW(.06, 1.5));
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .12, hy - hr * .68); ctx.lineTo(hx + i * hr * .13, hy - hr * .5); ctx.stroke();
        }
        // 片側の結び目
        ctx.fillStyle = dk; ell(hx + hr * .5, hy - hr * .8, hr * .08, hr * .12, .3);
        break;
      }
      case 'pakol': {
        // パコール: アフガンの羊毛帽 — 巻き上げた太い縁帯+柔らかいドーム
        ctx.fillStyle = acc2;
        // 柔らかいドーム(ふっくら帽体)
        poly([hx - hr * .62,hy - hr * .75],[hx - hr * .6,hy - hr * 1.25,hx,hy - hr * 1.28],[hx + hr * .6,hy - hr * 1.25,hx + hr * .62,hy - hr * .75]);
        // 巻き上げ縁(太いベーグル状の帯)
        FS(dk); ell(hx, hy - hr * .72, hr * .66, hr * .22);
        // 縁の巻き筋(明色の畝3本)
        SS(acc2); lnW(LW(.05));
        ([-.78, -.7, -.62]).forEach(oy => {
          ctx.beginPath(); ctx.ellipse(hx, hy - hr * .72 + (oy + .72) * hr, hr * .66, hr * .12, 0, 3.4, 6.1); ctx.stroke();
        });
        // ドームの折り目(羊毛の皺)
        SS(dk); lnW(LW(.035)); ctx.beginPath(); ctx.moveTo(hx - hr * .3, hy - hr * 1.0); ctx.quadraticCurveTo(hx, hy - hr * 1.12, hx + hr * .28, hy - hr * 1.02); ctx.stroke();
        break;
      }
      case 'songkok': {
        // ソンコク: マレー・インドネシアの黒ビロード帽 — 低い平天の筒+縁光沢
        ctx.fillStyle = dk;
        // 本体(上に向かいわずかに広い浅い筒)
        poly([hx - hr * .52,hy - hr * .7],[hx - hr * .58,hy - hr * 1.05],[hx,hy - hr * 1.12,hx + hr * .58,hy - hr * 1.05],[hx + hr * .52,hy - hr * .7]);
        // 平らな天辺(楕円の面)
        FS(acc2); ell(hx, hy - hr * 1.05, hr * .58, hr * .1);
        // ビロードの光沢(側面の淡い筋)
        SS(acc2); lnW(LW(.04)); ctx.beginPath(); ctx.moveTo(hx - hr * .4, hy - hr * .95); ctx.quadraticCurveTo(hx - hr * .44, hy - hr * .8, hx - hr * .4, hy - hr * .72); ctx.moveTo(hx + hr * .4, hy - hr * .95); ctx.quadraticCurveTo(hx + hr * .44, hy - hr * .8, hx + hr * .4, hy - hr * .72); ctx.stroke();
        // 下縁の折り返し
        ctx.fillStyle = acc2; ell(hx, hy - hr * .7, hr * .53, hr * .07);
        break;
      }
      case 'blangkon': {
        // ブランコン: ジャワのバティック頭巾 — 滑らかな包み+背面の尖り+文様
        ctx.fillStyle = acc2;
        // 頭を包む帽体(なめらかなドーム)
        poly([hx - hr * .6,hy - hr * .62],[hx - hr * .62,hy - hr * 1.18,hx,hy - hr * 1.22],[hx + hr * .62,hy - hr * 1.18,hx + hr * .6,hy - hr * .62],[hx + hr * .55,hy - hr * .55],[hx,hy - hr * .75,hx - hr * .55,hy - hr * .55]);
        // 背面の尖った襞(右背後の三角束)
        FS(dk); poly([hx + hr * .5,hy - hr * .72],[hx + hr * .8,hy - hr * .95],[hx + hr * .58,hy - hr * 1.0]); poly([hx + hr * .52,hy - hr * .68],[hx + hr * .85,hy - hr * .82],[hx + hr * .62,hy - hr * .88]);
        // バティックの点文様(額上のドット列)
        FS(dk);
        for (let i = -2; i <= 2; i++) {
          ell(hx + i * hr * .18, hy - hr * .78, hr * .035, hr * .035);
        }
        // 巻きの筋(水平の畝)
        SS(dk); lnW(LW(.04)); ctx.beginPath(); ctx.moveTo(hx - hr * .56, hy - hr * .9); ctx.quadraticCurveTo(hx, hy - hr * 1.05, hx + hr * .56, hy - hr * .9); ctx.stroke();
        break;
      }
      case 'gibus': {
        // ジバス: 折りたためるオペラ帽 — 細いつば+高い筒+蝶番の襞線
        ctx.fillStyle = dk;
        // 細いつば(楕円)
        ell(hx, hy - hr * .62, hr * .78, hr * .1);
        // 高い筒(わずかに台形)
        FS(acc2); poly([hx - hr * .5,hy - hr * .6],[hx - hr * .46,hy - hr * 1.5],[hx,hy - hr * 1.56,hx + hr * .46,hy - hr * 1.5],[hx + hr * .5,hy - hr * .6]);
        // 折りたたみ蝶番(冠の中段の襞線2本)
        SS(dk); lnW(LW(.04)); ctx.beginPath(); ctx.moveTo(hx - hr * .48, hy - hr * .95); ctx.lineTo(hx + hr * .48, hy - hr * .95); ctx.moveTo(hx - hr * .47, hy - hr * 1.1); ctx.lineTo(hx + hr * .47, hy - hr * 1.1); ctx.stroke();
        // 天辺
        ctx.fillStyle = dk; ell(hx, hy - hr * 1.5, hr * .46, hr * .08);
        break;
      }
      case 'toque': {
        // トーク帽: カナダの編み帽 — 折り返しリブ+ポンポン
        ctx.fillStyle = acc2;
        // ドーム(丸い編み帽)
        poly([hx - hr * .55,hy - hr * .68],[hx - hr * .55,hy - hr * 1.3,hx,hy - hr * 1.35],[hx + hr * .55,hy - hr * 1.3,hx + hr * .55,hy - hr * .68]);
        // 頂のポンポン
        ctx.fillStyle = dk; ell(hx, hy - hr * 1.38, hr * .16, hr * .14);
        // ポンポンの毛先(放射の短筋)
        SS(dk); lnW(LW(.03));
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .04, hy - hr * 1.38); ctx.lineTo(hx + i * hr * .06, hy - hr * 1.52); ctx.stroke();
        }
        // 折り返しリブ帯(額の厚い帯)
        FS(dk); poly([hx - hr * .58,hy - hr * .75],[hx - hr * .55,hy - hr * .6],[hx,hy - hr * .5,hx + hr * .55,hy - hr * .6],[hx + hr * .58,hy - hr * .75],[hx,hy - hr * .65,hx - hr * .58,hy - hr * .75]);
        // リブの縦目(編み筋)
        SS(acc2); lnW(LW(.028));
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .14, hy - hr * .73); ctx.lineTo(hx + i * hr * .15, hy - hr * .62); ctx.stroke();
        }
        break;
      }
      case 'salakot': {
        // サラコット: フィリピンの丸い瓢箪笠 — 半球ドーム+先端の尖り
        ctx.fillStyle = acc2;
        // ドーム(扁球の笠)
        poly([hx - hr * .85,hy - hr * .55],[hx - hr * .5,hy - hr * 1.15,hx,hy - hr * 1.15],[hx + hr * .5,hy - hr * 1.15,hx + hr * .85,hy - hr * .55],[hx,hy - hr * .4,hx - hr * .85,hy - hr * .55]);
        // 先端の小さな尖り
        poly([hx - hr * .06,hy - hr * 1.13],[hx,hy - hr * 1.3],[hx + hr * .06,hy - hr * 1.13]);
        // 編みの同心線(瓢箪の筋)
        SS(dk); lnW(LW(.025));
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath(); ctx.ellipse(hx, hy - hr * (1.15 - i * .14), hr * (.28 + i * .16), hr * (.05 + i * .03), 0, 0, Math.PI); ctx.stroke();
        }
        // 笠の縁
        ctx.strokeStyle = dk; lnW(LW(.035)); ctx.beginPath(); ctx.moveTo(hx - hr * .85, hy - hr * .55); ctx.quadraticCurveTo(hx, hy - hr * .4, hx + hr * .85, hy - hr * .55); ctx.stroke();
        // 顎紐
        ctx.strokeStyle = dk; lnW(LW(.03)); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .52); ctx.quadraticCurveTo(hx, hy + hr * .5, hx + hr * .55, hy - hr * .52); ctx.stroke();
        break;
      }
      case 'barretina': {
        // バレチナ: カタルーニャのだぶだぶ帽 — 額の帯+片側に垂れる袋
        ctx.fillStyle = acc2;
        // 垂れる袋(右側へ流れる)
        poly([hx - hr * .45,hy - hr * .72],[hx - hr * .5,hy - hr * 1.2,hx + hr * .1,hy - hr * 1.3],[hx + hr * .7,hy - hr * 1.35,hx + hr * .8,hy - hr * 1.05],[hx + hr * .82,hy - hr * .82,hx + hr * .55,hy - hr * .7],[hx,hy - hr * .62,hx - hr * .45,hy - hr * .72]);
        // 袋の先端(折れて垂れる)
        poly([hx + hr * .8,hy - hr * 1.05],[hx + hr * .95,hy - hr * .98,hx + hr * .88,hy - hr * .78],[hx + hr * .8,hy - hr * .8,hx + hr * .55,hy - hr * .7],[hx + hr * .8,hy - hr * .82,hx + hr * .8,hy - hr * 1.05]);
        // 袋の先の房
        ctx.fillStyle = dk; ell(hx + hr * .88, hy - hr * .78, hr * .09, hr * .08);
        // 額の帯(縁)
        FS(dk); poly([hx - hr * .48,hy - hr * .74],[hx,hy - hr * .62,hx + hr * .5,hy - hr * .72],[hx + hr * .52,hy - hr * .62],[hx,hy - hr * .52,hx - hr * .5,hy - hr * .64]);
        break;
      }
      case 'montenegrin': {
        // モンテネグロ帽: モンテネグロの低い平天帽 — 黒い筒+赤い天板+金縁
        ctx.fillStyle = dk;
        // 黒い筒(側面の帯)
        poly([hx - hr * .5,hy - hr * .62],[hx - hr * .48,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .48,hy - hr * .95],[hx + hr * .5,hy - hr * .62],[hx,hy - hr * .52,hx - hr * .5,hy - hr * .62]);
        // 赤い天板(平たい楕円)
        FS(acc2); ell(hx, hy - hr * .95, hr * .48, hr * .1);
        // 天板の金縁(内側の細円)
        SS('#c8a838'); lnW(LW(.03)); ells(hx, hy - hr * .95, hr * .4, hr * .07);
        // 金縁の波模様(小さな弧)
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.arc(hx + i * hr * .15, hy - hr * .95, hr * .04, Math.PI, 0); ctx.stroke();
        }
        break;
      }
      case 'chupalla': {
        // チュパリャ: チリ・ワソの麦わら帽 — 低い平天冠+広い平つば
        ctx.fillStyle = acc2;
        // 広いつば(水平の楕円板)
        ell(hx, hy - hr * .62, hr * .95, hr * .16);
        // 低い冠(筒)
        poly([hx - hr * .38,hy - hr * .68],[hx - hr * .36,hy - hr * 1.0],[hx,hy - hr * 1.08,hx + hr * .36,hy - hr * 1.0],[hx + hr * .38,hy - hr * .68],[hx,hy - hr * .58,hx - hr * .38,hy - hr * .68]);
        // 冠の天板
        ell(hx, hy - hr * 1.0, hr * .36, hr * .07);
        // 帯(冠の根本の暗帯)
        FS(dk); poly([hx - hr * .38,hy - hr * .72],[hx,hy - hr * .62,hx + hr * .38,hy - hr * .72],[hx + hr * .38,hy - hr * .8],[hx,hy - hr * .7,hx - hr * .38,hy - hr * .8]);
        // 麦わらの編み目(つばの放射筋)
        SS(dk); lnW(LW(.02));
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .16, hy - hr * .68); ctx.lineTo(hx + i * hr * .22, hy - hr * .58); ctx.stroke();
        }
        break;
      }
      case 'spodik': {
        // スポディク: ハシディズムの高い毛皮帽 — 幅広の高円筒
        ctx.fillStyle = acc2;
        // 高い円筒(上部がわずかに広い)
        poly([hx - hr * .52,hy - hr * .6],[hx - hr * .56,hy - hr * 1.55],[hx,hy - hr * 1.62,hx + hr * .56,hy - hr * 1.55],[hx + hr * .52,hy - hr * .6],[hx,hy - hr * .5,hx - hr * .52,hy - hr * .6]);
        // 毛皮の質感(縦の短い筋)
        SS(dk); lnW(LW(.022));
        for (let i = -5; i <= 5; i++) {
          const fx = hx + i * hr * .1; ctx.beginPath(); ctx.moveTo(fx, hy - hr * .75); ctx.lineTo(fx + Math.sin(i) * hr * .02, hy - hr * 1.45); ctx.stroke();
        }
        // 縁の起毛(下端の濃い帯)
        FS(dk); poly([hx - hr * .53,hy - hr * .62],[hx,hy - hr * .52,hx + hr * .53,hy - hr * .62],[hx + hr * .52,hy - hr * .72],[hx,hy - hr * .62,hx - hr * .52,hy - hr * .72]);
        break;
      }
      case 'montera': {
        // モンテラ: 闘牛士の黒帽 — 両端の角+低い丸みの冠
        ctx.fillStyle = dk;
        // 低い丸冠(中央のドーム)
        poly([hx - hr * .42,hy - hr * .62],[hx - hr * .42,hy - hr * .95,hx,hy - hr * .95],[hx + hr * .42,hy - hr * .95,hx + hr * .42,hy - hr * .62],[hx,hy - hr * .52,hx - hr * .42,hy - hr * .62]);
        // 左右の角(外側に突き出す三日月)
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .4,hy - hr * .7],[hx + s * hr * .8,hy - hr * .75,hx + s * hr * .78,hy - hr * .98],[hx + s * hr * .7,hy - hr * .8,hx + s * hr * .42,hy - hr * .8]);
        });
        // アストラカン(毛皮の粒点)
        FS(acc2); scat(31, 18, (rngM, i) => {
          const ax = hx + (rngM() - .5) * hr * .75; const ay = hy - hr * (.62 + rngM() * .3); ell(ax, ay, hr * .015, hr * .012);
        });
        // 顎紐
        ctx.strokeStyle = dk; lnW(LW(.03)); ctx.beginPath(); ctx.moveTo(hx - hr * .42, hy - hr * .6); ctx.quadraticCurveTo(hx, hy + hr * .45, hx + hr * .42, hy - hr * .6); ctx.stroke();
        break;
      }
      case 'akubra': {
        // アクブラ: オーストラリアのブッシュハット — 低いつまみ冠+垂れつば+革帯
        // つば(先端でやや下がる広楕円)
        FS(dk); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .68, hr * .72, hr * .15, 0, 0, 7); ctx.ellipse(hx, hy - hr * .68, hr * .72, hr * .15, 0, 0, 7); ctx.fill();
        // つばの垂れ(両端を下げる)
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .68, hy - hr * .64, hr * .1, hr * .08, s * .5);
        });
        // 冠(低いドーム)
        FS(acc2); poly([hx - hr * .42,hy - hr * .68],[hx - hr * .4,hy - hr * 1.05,hx,hy - hr * 1.05],[hx + hr * .4,hy - hr * 1.05,hx + hr * .42,hy - hr * .68],[hx,hy - hr * .58,hx - hr * .42,hy - hr * .68]);
        // つまみ(冠の前後のくぼみ線)
        SS(dk); lnW(LW(.025));
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .12, hy - hr * 1.03); ctx.quadraticCurveTo(hx + s * hr * .14, hy - hr * .95, hx + s * hr * .2, hy - hr * .9); ctx.stroke();
        });
        // 革帯
        ctx.fillStyle = '#3a2a1a'; rect(hx - hr * .41, hy - hr * .78, hr * .82, hr * .07);
        break;
      }
      case 'panama': {
        // パナマ帽: 白い麦わら — 平つば+中央の折り目+黒帯
        // つば(淡色の広楕円)
        FS('#e8dfc8'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .68, hr * .68, hr * .14, 0, 0, 7); ctx.ellipse(hx, hy - hr * .68, hr * .68, hr * .14, 0, 0, 7); ctx.fill();
        // 冠(中央折れの台形)
        poly([hx - hr * .4,hy - hr * .68],[hx - hr * .36,hy - hr * 1.0],[hx + hr * .36,hy - hr * 1.0],[hx + hr * .4,hy - hr * .68],[hx,hy - hr * .58,hx - hr * .4,hy - hr * .68]);
        // 中央の折り目(冠を縦に割る窪み)
        SS('#b8a888'); lnW(LW(.03)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.0); ctx.lineTo(hx, hy - hr * .78); ctx.stroke();
        // 黒い帯
        ctx.fillStyle = dk; rect(hx - hr * .4, hy - hr * .78, hr * .8, hr * .08);
        // 麦わらの編み目(横線)
        SS('rgba(160,140,110,0.4)'); lnW(1);
        times(3, i => {
          ctx.beginPath(); ctx.ellipse(hx, hy - hr * (.7 + i * .04), hr * (.55 + i * .04), hr * .04, 0, 0, Math.PI); ctx.stroke();
        });
        break;
      }
      case 'tiroler': {
        // チロル帽: 山岳の緑フェルト — つまみ冠+後反りつば+羽飾り
        // つば(後ろが反り上がる窄み楕円)
        FS('#3a5a3a'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .66, hr * .55, hr * .11, 0, 0, 7); ctx.ellipse(hx, hy - hr * .66, hr * .55, hr * .11, 0, 0, 7); ctx.fill();
        // つばの後反り(両端を上げる)
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .52, hy - hr * .7, hr * .09, hr * .07, s * -.4);
        });
        // 冠(中央にくぼみのある台形)
        poly([hx - hr * .38,hy - hr * .66],[hx - hr * .34,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .34,hy - hr * .95],[hx + hr * .38,hy - hr * .66],[hx,hy - hr * .56,hx - hr * .38,hy - hr * .66]);
        // つまみの窪み(冠の中央を縦に押さえる線)
        SS('#2a4228'); lnW(LW(.03)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .99); ctx.lineTo(hx, hy - hr * .8); ctx.stroke();
        // 紐帯
        ctx.fillStyle = '#6a4a28'; rect(hx - hr * .37, hy - hr * .74, hr * .74, hr * .05);
        // 羽飾り(右側に立つシャモアの房)
        FS('#c8b888'); poly([hx + hr * .4,hy - hr * .72],[hx + hr * .55,hy - hr * 1.15,hx + hr * .48,hy - hr * 1.25],[hx + hr * .52,hy - hr * 1.0,hx + hr * .46,hy - hr * .72]);
        break;
      }
      case 'homburg': {
        // ホンブルク: ドイツの正装フェルト — 中央窪みの冠+巻きつば+グログラン帯
        // つば(端が巻き上がった楕円)
        FS(dk); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .66, hr * .58, hr * .12, 0, 0, 7); ctx.ellipse(hx, hy - hr * .66, hr * .58, hr * .12, 0, 0, 7); ctx.fill();
        // 巻きつば(両端の細い弧)
        SS(dk); lnW(hr * .05);
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); ctx.arc(hx + s * hr * .5, hy - hr * .66, hr * .09, s > 0 ? Math.PI * 1.2 : Math.PI * 1.8, s > 0 ? Math.PI * 2.4 : Math.PI * 0.6); ctx.stroke();
        });
        // 冠(中央窪み = センターデント)
        FS(acc2); poly([hx - hr * .38,hy - hr * .66],[hx - hr * .36,hy - hr * 1.0,hx - hr * .08,hy - hr * .95],[hx,hy - hr * .88,hx + hr * .08,hy - hr * .95],[hx + hr * .36,hy - hr * 1.0,hx + hr * .38,hy - hr * .66],[hx,hy - hr * .56,hx - hr * .38,hy - hr * .66]);
        // グログラン帯+左の蝶結び
        ctx.fillStyle = dk; rect(hx - hr * .38, hy - hr * .74, hr * .76, hr * .07); poly([hx - hr * .38,hy - hr * .7],[hx - hr * .46,hy - hr * .74],[hx - hr * .38,hy - hr * .78]);
        break;
      }
      case 'dhakatopi': {
        // ダカ・トピ: ネパールの織り帽 — 楔形の高さ+幾何学の菱模様
        // 本体(前後が尖った楔形)
        FS(acc2); poly([hx - hr * .5,hy - hr * .6],[hx - hr * .42,hy - hr * .88],[hx,hy - hr * .8],[hx + hr * .42,hy - hr * .88],[hx + hr * .5,hy - hr * .6],[hx,hy - hr * .5,hx - hr * .5,hy - hr * .6]); // 中央の頂点
        // 菱模様(連なるダイヤ)
        SS(dk); lnW(LW(.02));
        for (let i = -2; i <= 2; i++) {
          const dx = hx + i * hr * .18; polyS([dx,hy - hr * .72],[dx + hr * .07,hy - hr * .8],[dx,hy - hr * .88],[dx - hr * .07,hy - hr * .8]);
        }
        // 縁帯
        ctx.fillStyle = dk; poly([hx - hr * .5,hy - hr * .6],[hx,hy - hr * .5,hx + hr * .5,hy - hr * .6],[hx + hr * .48,hy - hr * .66],[hx,hy - hr * .56,hx - hr * .48,hy - hr * .66]);
        break;
      }
      case 'gandhi': {
        // ガンジー帽: 白い折り畳み帽 — 斜めに傾けた舟形
        ctx.save(); ctx.translate(hx, hy - hr * .75); ctx.rotate(-.18); FS('#f0ece0'); poly([-hr * .55,0],[-hr * .45,-hr * .22,-hr * .1,-hr * .28],[hr * .5,-hr * .05],[hr * .55,0,hr * .5,0]); // 右に傾ける // 前後の尖り
        // 折り目(中央の折り線)
        SS('#b8b0a0'); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(-hr * .45, -hr * .03); ctx.quadraticCurveTo(-hr * .1, -hr * .2, hr * .45, -hr * .04); ctx.stroke();
        // 縁の影
        ctx.fillStyle = 'rgba(120,110,90,0.3)'; poly([-hr * .5,-hr * .02],[0,hr * .04,hr * .5,-hr * .02],[hr * .5,0],[0,hr * .08,-hr * .5,0]); ctx.restore();
        break;
      }
      case 'tengkolok': {
        // トゥンコロ: マレーの折り頭巾 — 前面の尖った立ち結び+巻き布
        // 巻き布(頭を包む帯状のベース)
        FS(acc2); poly([hx - hr * .5,hy - hr * .55],[hx - hr * .5,hy - hr * .8,hx,hy - hr * .85],[hx + hr * .5,hy - hr * .8,hx + hr * .5,hy - hr * .55],[hx,hy - hr * .45,hx - hr * .5,hy - hr * .55]);
        // 布の襞(巻き筋の斜線)
        SS(dk); lnW(LW(.02));
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .18, hy - hr * .84); ctx.quadraticCurveTo(hx + i * hr * .22, hy - hr * .7, hx + i * hr * .2, hy - hr * .56); ctx.stroke();
        }
        // 前面の立ち結び(デンダム・タク・スダ — 上向きの尖り)
        FS(dk); poly([hx - hr * .05,hy - hr * .82],[hx + hr * .12,hy - hr * 1.25],[hx + hr * .22,hy - hr * .78],[hx + hr * .08,hy - hr * .85,hx - hr * .05,hy - hr * .82]); // 前方に立つ鋭角
        // 結び目の房
        ell(hx + hr * .14, hy - hr * .78, hr * .04, hr * .03);
        break;
      }
      case 'udeng': {
        // ウデン: バリの男性頭巾 — 額の立ち結び+巻き布の襞
        // 巻き布(額から後頭部へ包む)
        FS(acc2); poly([hx - hr * .52,hy - hr * .5],[hx - hr * .52,hy - hr * .85,hx,hy - hr * .9],[hx + hr * .52,hy - hr * .85,hx + hr * .52,hy - hr * .5],[hx,hy - hr * .4,hx - hr * .52,hy - hr * .5]);
        // 襞(扇状に開く巻き筋)
        SS(dk); lnW(LW(.02));
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .2, hy - hr * .5); ctx.quadraticCurveTo(hx + i * hr * .15, hy - hr * .7, hx + i * hr * .12, hy - hr * .88); ctx.stroke();
        }
        // 額の結び目(中央に立つ尖り)
        FS(dk); poly([hx - hr * .08,hy - hr * .5],[hx,hy - hr * .95],[hx + hr * .08,hy - hr * .5]); // 上向きの鋭角
        // 結び目の左右の襞
        poly([hx - hr * .08,hy - hr * .52],[hx - hr * .2,hy - hr * .78],[hx - hr * .04,hy - hr * .62]); poly([hx + hr * .08,hy - hr * .52],[hx + hr * .2,hy - hr * .78],[hx + hr * .04,hy - hr * .62]);
        break;
      }
      case 'kofia': {
        // コフィア: 東アフリカの刺繍帽 — 平天の円筒+幾何学の刺繍帯
        // 円筒の胴
        ctx.fillStyle = acc2; poly([hx - hr * .45,hy - hr * .55],[hx - hr * .42,hy - hr * .95],[hx + hr * .42,hy - hr * .95],[hx + hr * .45,hy - hr * .55],[hx,hy - hr * .45,hx - hr * .45,hy - hr * .55]);
        // 平天の蓋
        ell(hx, hy - hr * .95, hr * .42, hr * .07); SS(dk); lnW(LW(.02)); ells(hx, hy - hr * .95, hr * .42, hr * .07);
        // 刺繍帯(縁の連続◆文様)
        FS(dk);
        for (let i = -3; i <= 3; i++) {
          const dx = i * hr * .13; poly([hx + dx,hy - hr * .68],[hx + dx + hr * .05,hy - hr * .62],[hx + dx,hy - hr * .56],[hx + dx - hr * .05,hy - hr * .62]);
        }
        // 胴の散り刺繍(小さな点)
        for (let i = -2; i <= 2; i++) {
          ell(hx + i * hr * .16, hy - hr * .82, hr * .02, hr * .02);
        }
        break;
      }
      case 'apsara': {
        // アプサラ冠: クメールの宝冠 — 層の尖塔+耳飾りの垂飾
        // 基座の帯(額の宝飾)
        FS(dk); rect(hx - hr * .42, hy - hr * .62, hr * .84, hr * .1); FS(acc2);
        for (let i = -3; i <= 3; i++) {
          ell(hx + i * hr * .11, hy - hr * .57, hr * .025, hr * .025);
        }
        // 層の尖塔(3層の花冠)
        for (let i = 0; i < 3; i++) {
          const lw = hr * (.4 - i * .11), ly = hy - hr * (.62 + i * .28); FS(i === 1 ? dk : acc2); ctx.beginPath(); ctx.moveTo(hx - lw, ly + hr * .1);
          for (let j = -2; j <= 2; j++) {
            const px = hx + j * lw * .4; ctx.lineTo(px, ly - hr * .06); ctx.lineTo(px + lw * .2, ly + hr * .1); // 尖った花弁列
          }
          ctx.closePath(); ctx.fill();
        }
        // 頂の尖り
        ctx.fillStyle = dk; poly([hx - hr * .06,hy - hr * 1.16],[hx,hy - hr * 1.4],[hx + hr * .06,hy - hr * 1.16]);
        // 耳飾りの垂飾(両側の花飾)
        FS(acc2);
        ([-1, 1]).forEach(sx => {
          ell(hx + sx * hr * .45, hy - hr * .4, hr * .05, hr * .07); ell(hx + sx * hr * .45, hy - hr * .28, hr * .035, hr * .04);
        });
        break;
      }
      case 'isicholo': {
        // イシチョロ: ズールーの既婚女性帽 — 頭上の赤い平たい円盤+巻き布
        // 下の巻き布(頭を包む帯)
        FS(dk); poly([hx - hr * .48,hy - hr * .5],[hx - hr * .48,hy - hr * .75,hx,hy - hr * .78],[hx + hr * .48,hy - hr * .75,hx + hr * .48,hy - hr * .5],[hx,hy - hr * .4,hx - hr * .48,hy - hr * .5]);
        // 赤い円盤(頭上に広がる平たい輪)
        FS('#a03428'); ell(hx, hy - hr * .78, hr * .68, hr * .16);
        // 円盤の裏(厚みの影)
        FS('#7a281e'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .74, hr * .68, hr * .12, 0, 0, Math.PI); ctx.fill();
        // 円盤の中央の穴(平らな輪)
        FS(dk); ell(hx, hy - hr * .79, hr * .28, hr * .06);
        // 円盤の縁(白い飾り筋)
        SS('#e8e0d0'); lnW(LW(.02)); ells(hx, hy - hr * .78, hr * .62, hr * .13);
        break;
      }
      case 'maasai': {
        // マサイ頭飾り: 額のビーズ帯+後ろに立つダチョウの羽+垂れ珠
        // ビーズ帯(額の赤い編み込み)
        FS('#a02820'); poly([hx - hr * .48,hy - hr * .55],[hx,hy - hr * .72,hx + hr * .48,hy - hr * .55],[hx,hy - hr * .58,hx - hr * .48,hy - hr * .55]);
        // 帯のビーズ(白と青の交互珠)
        FS('#f0e8d8');
        for (let i = -3; i <= 3; i++) {
          ell(hx + i * hr * .13, hy - hr * (.6 + .03 * Math.abs(i)), hr * .03, hr * .03);
        }
        FS('#2858a0');
        for (let i = -2; i <= 2; i += 2) {
          ell(hx + i * hr * .13, hy - hr * (.58 + .03 * Math.abs(i)), hr * .02, hr * .02);
        }
        // 額の垂れ珠(3本の飾り)
        FS('#f0e8d8');
        ([-.2, 0, .2]).forEach(bx => {
          ell(hx + bx * hr, hy - hr * .48, hr * .025, hr * .04);
        });
        // ダチョウの羽(後ろ上に立つ白い羽毛)
        SS('#e8e0d0'); lnW(LW(.03, 1.5)); ctx.beginPath(); ctx.moveTo(hx + hr * .15, hy - hr * .65); ctx.quadraticCurveTo(hx + hr * .28, hy - hr * 1.1, hx + hr * .35, hy - hr * 1.4); ctx.stroke();
        // 羽の房(枝分かれの羽枝)
        lnW(LW(.015, .8));
        times(5, i => {
          ctx.beginPath(); ctx.moveTo(hx + hr * (.15 + i * .04), hy - hr * (.65 + i * .14));
          ctx.quadraticCurveTo(hx + hr * (.28 + i * .02), hy - hr * (.7 + i * .14),
            hx + hr * (.32 + i * .01), hy - hr * (.68 + i * .14));
          ctx.stroke();
        });
        break;
      }
      case 'netela': {
        // ネテラ: エチオピアの白い頭被い — 肩まで垂れる布+彩りの縁(ティベブ)
        // 頭から肩へ掛ける白い布
        ctx.fillStyle = '#f0ebe0'; poly([hx - hr * .55,hy + hr * .3],[hx - hr * .6,hy - hr * .5,hx - hr * .4,hy - hr * .75],[hx,hy - hr * .95,hx + hr * .4,hy - hr * .75],[hx + hr * .6,hy - hr * .5,hx + hr * .55,hy + hr * .3],[hx + hr * .4,hy + hr * .15,hx + hr * .3,hy - hr * .2],[hx,hy - hr * .35,hx - hr * .3,hy - hr * .2],[hx - hr * .4,hy + hr * .15,hx - hr * .55,hy + hr * .3]); // 左肩の端
        // 布の襞(垂れ筋)
        SS('#c8beb0'); lnW(LW(.02));
        ([-.45, -.2, .2, .45]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy + hr * .25); ctx.quadraticCurveTo(hx + fx * hr * .9, hy - hr * .1, hx + fx * hr * .7, hy - hr * .5); ctx.stroke();
        });
        // 彩りの縁(ティベブ — 裾の二色帯)
        SS('#c04038'); lnW(LW(.04, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .52, hy + hr * .26); ctx.quadraticCurveTo(hx, hy + hr * .05, hx + hr * .52, hy + hr * .26); ctx.stroke(); SS('#d8a028'); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy + hr * .2); ctx.quadraticCurveTo(hx, hy + hr * .0, hx + hr * .5, hy + hr * .2); ctx.stroke();
        break;
      }
      case 'burnous': {
        // ブルヌース: ベルベルの尖り頭巾マント — 頭を包む垂れ布+尖ったフード
        // 尖ったフード(頭上の長いとんがり)
        FS(acc2); poly([hx - hr * .5,hy - hr * .4],[hx - hr * .45,hy - hr * .8,hx - hr * .15,hy - hr * .85],[hx + hr * .05,hy - hr * 1.05,hx + hr * .08,hy - hr * 1.35],[hx + hr * .12,hy - hr * .95,hx + hr * .35,hy - hr * .8],[hx + hr * .55,hy - hr * .7,hx + hr * .5,hy - hr * .4],[hx,hy - hr * .3,hx - hr * .5,hy - hr * .4]); // 尖り
        // フードの垂れ襞
        ctx.strokeStyle = dk; lnW(LW(.02));
        ([-.3, -.1, .15, .35]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy - hr * .38); ctx.quadraticCurveTo(hx + fx * hr * .9, hy - hr * .55, hx + fx * hr * .8, hy - hr * .75); ctx.stroke();
        });
        // 縁の飾り(フード口の白い縫い筋)
        SS('#e8e0d0'); lnW(LW(.025)); ctx.beginPath(); ctx.moveTo(hx - hr * .42, hy - hr * .45); ctx.quadraticCurveTo(hx, hy - hr * .3, hx + hr * .42, hy - hr * .45); ctx.stroke();
        // 先端の房飾り
        ctx.fillStyle = dk; ell(hx + hr * .08, hy - hr * 1.38, hr * .045, hr * .05);
        break;
      }
      case 'tengkuluk': {
        // トゥンクルク: ミナンカバウの頭巾 — 立つ二本の角(水牛角の形)
        // 中央の結び布(額を包む帯)
        FS(acc2); poly([hx - hr * .45,hy - hr * .35],[hx,hy - hr * .5,hx + hr * .45,hy - hr * .35],[hx + hr * .4,hy - hr * .15],[hx,hy - hr * .28,hx - hr * .4,hy - hr * .15]);
        // 左角(立ち上がる襞)
        poly([hx - hr * .4,hy - hr * .3],[hx - hr * .55,hy - hr * .6,hx - hr * .5,hy - hr * .85],[hx - hr * .35,hy - hr * .65,hx - hr * .2,hy - hr * .4]);
        // 右角
        poly([hx + hr * .4,hy - hr * .3],[hx + hr * .55,hy - hr * .6,hx + hr * .5,hy - hr * .85],[hx + hr * .35,hy - hr * .65,hx + hr * .2,hy - hr * .4]);
        // 布の折り筋(暗い線)
        SS(dk); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(hx - hr * .45, hy - hr * .32); ctx.quadraticCurveTo(hx, hy - hr * .45, hx + hr * .45, hy - hr * .32); ctx.stroke();
        // 帯の文様(菱形列)
        FS(dk);
        ([-.3, -.1, .1, .3]).forEach(fx => {
          poly([hx + fx * hr,hy - hr * .28],[hx + (fx + .05) * hr,hy - hr * .24],[hx + fx * hr,hy - hr * .2],[hx + (fx - .05) * hr,hy - hr * .24]);
        });
        break;
      }
      case 'saputangan': {
        // サプタンガン: タウスグの頭布 — 三角折りの包み+前面の結び+格子模様
        // 頭を包む布(三角形に折った布の包み)
        FS(acc2); poly([hx - hr * .5,hy - hr * .25],[hx - hr * .5,hy - hr * .7,hx - hr * .25,hy - hr * .8],[hx,hy - hr * .9,hx + hr * .25,hy - hr * .8],[hx + hr * .5,hy - hr * .7,hx + hr * .5,hy - hr * .25],[hx + hr * .45,hy - hr * .15],[hx,hy - hr * .3,hx - hr * .45,hy - hr * .15]);
        // 格子模様(布のチェック筋)
        SS(dk); lnW(LW(.015));
        ([-.3, -.1, .1, .3]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy - hr * .7); ctx.lineTo(hx + fx * hr, hy - hr * .22); ctx.stroke();
        });
        ([-.6, -.45, -.3]).forEach(fy => {
          ctx.beginPath(); ctx.moveTo(hx - hr * .42, hy + fy * hr); ctx.quadraticCurveTo(hx, hy + (fy - .08) * hr, hx + hr * .42, hy + fy * hr); ctx.stroke();
        });
        // 前面の結び目(額の中央の玉+垂れる端)
        FS(dk); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .55, hr * .08, hr * .06, 0, 0, 7); ctx.ellipse(hx, hy - hr * .55, hr * .08, hr * .06, 0, 0, 7); ctx.fill(); poly([hx - hr * .03,hy - hr * .52],[hx - hr * .1,hy - hr * .35],[hx - hr * .05,hy - hr * .32],[hx + hr * .01,hy - hr * .5]);
        break;
      }
      case 'bashlyk': {
        // バシュリク: カフカスの尖り頭巾 — 三角の尖り+両脇に垂れる襞
        // 頭を包む布(尖った天辺)
        FS(acc2); poly([hx - hr * .5,hy - hr * .3],[hx - hr * .5,hy - hr * .6,hx - hr * .3,hy - hr * .7],[hx - hr * .05,hy - hr * 1.0],[hx + hr * .2,hy - hr * .7],[hx + hr * .5,hy - hr * .6,hx + hr * .5,hy - hr * .3],[hx,hy - hr * .25,hx - hr * .5,hy - hr * .3]); // 尖り
        // 左右に垂れる襞(肩まで届く布端)
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .45,hy - hr * .4],[hx + s * hr * .55,hy + hr * .15],[hx + s * hr * .4,hy + hr * .12],[hx + s * hr * .35,hy - hr * .35]); // 肩のあたりまで
        });
        // 額の縁取り(布の端の線)
        SS(dk); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(hx - hr * .42, hy - hr * .35); ctx.quadraticCurveTo(hx, hy - hr * .45, hx + hr * .42, hy - hr * .35); ctx.stroke();
        // 襞の筋
        ([-.38, -.15, .15, .38]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy - hr * .3); ctx.quadraticCurveTo(hx + fx * hr * 1.1, hy - hr * .45, hx + fx * hr * .9, hy - hr * .62); ctx.stroke();
        });
        break;
      }
      case 'telpek': {
        // テルペク: トルクメンの羊毛帽 — 大きな楕円の毛皮+起毛の質感
        const tr2 = mulberry32(599);
        // 本体(大きな楕円の毛皮帽)
        FS(acc2); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .7, hr * .58, hr * .42, 0, 0, 7); ctx.ellipse(hx, hy - hr * .7, hr * .58, hr * .42, 0, 0, 7); ctx.fill();
        // 起毛の質感(短い毛の筋)
        SS(dk); lnW(LW(.012));
        for (let i = 0; i < 40; i++) {
          const fx = hx + (tr2() - .5) * hr * 1.0; const fy = hy - hr * .7 + (tr2() - .5) * hr * .7;
          if (((fx - hx) / (hr * .58)) ** 2 + ((fy - hy + hr * .7) / (hr * .42)) ** 2 > 1) continue;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + (tr2() - .5) * hr * .08, fy - hr * .05 - tr2() * hr * .05); ctx.stroke();
        }
        // 下縁の暗い帯(毛の重なり)
        SS('rgba(30,32,40,0.5)'); lnW(LW(.04, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .52, hy - hr * .5); ctx.quadraticCurveTo(hx, hy - hr * .32, hx + hr * .52, hy - hr * .5); ctx.stroke();
        break;
      }
      case 'sjuhatt': {
        // シュハット: サーミの四方帽子 — 四角い天辺+4つの尖り角+彩りの帯
        // 本体(四角い冠)
        FS(acc2); poly([hx - hr * .5,hy - hr * .4],[hx - hr * .5,hy - hr * .8],[hx,hy - hr * .9,hx + hr * .5,hy - hr * .8],[hx + hr * .5,hy - hr * .4],[hx,hy - hr * .35,hx - hr * .5,hy - hr * .4]);
        // 4つの尖り角(頂点の四方向の突起)
        FS(acc2);
        for (const [ax, ay] of [[-.5, -.85], [0, -1.0], [.5, -.85], [0, -.75]]) {
          poly([hx + ax * hr - hr * .08,hy + ay * hr + hr * .1],[hx + ax * hr,hy + ay * hr - hr * .12],[hx + ax * hr + hr * .08,hy + ay * hr + hr * .1]);
        }
        // 彩りの帯(青・赤・黄の横帯)
        const cols = ['#2848a0', '#c03028', '#e0b028'];
        times(3, i => {
          FS(cols[i]); poly([hx - hr * .48,hy - hr * (.5 + i * .06)],[hx + hr * .48,hy - hr * (.5 + i * .06)],[hx + hr * .48,hy - hr * (.55 + i * .06)],[hx - hr * .48,hy - hr * (.55 + i * .06)]);
        });
        break;
      }
      case 'gat': {
        // ガット: 韓国の馬毛帽子 — 広い平つば+高い円筒冠+顎紐
        // 広い平つば(楕円)
        FS(acc2); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .45, hr * .95, hr * .18, 0, 0, 7); ctx.ellipse(hx, hy - hr * .45, hr * .95, hr * .18, 0, 0, 7); ctx.fill();
        // つばの縁(細い線)
        SS(dk); lnW(LW(.015)); ells(hx, hy - hr * .45, hr * .95, hr * .18);
        // 高い円筒冠(馬毛の黒い筒)
        poly([hx - hr * .3,hy - hr * .45],[hx - hr * .3,hy - hr * 1.05],[hx,hy - hr * 1.15,hx + hr * .3,hy - hr * 1.05],[hx + hr * .3,hy - hr * .45]);
        // 冠の縦筋(編みの目)
        ([-.2, 0, .2]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy - hr * .45); ctx.lineTo(hx + fx * hr, hy - hr * 1.05); ctx.stroke();
        });
        // 顎紐(垂れる紐)
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .3, hy - hr * .4); ctx.quadraticCurveTo(hx + s * hr * .35, hy + hr * .1, hx + s * hr * .25, hy + hr * .3); ctx.stroke();
        });
        break;
      }
      case 'toortsog': {
        // トールツォグ: モンゴルの帽子 — 反りつば+丸い冠+頂の珠
        // 反り上がったつば(三日月状)
        FS(acc2); poly([hx - hr * .7,hy - hr * .45],[hx,hy - hr * .62,hx + hr * .7,hy - hr * .45],[hx + hr * .5,hy - hr * .35,hx + hr * .35,hy - hr * .38],[hx,hy - hr * .5,hx - hr * .35,hy - hr * .38],[hx - hr * .5,hy - hr * .35,hx - hr * .7,hy - hr * .45]);
        // 丸い冠(ドーム)
        poly([hx - hr * .35,hy - hr * .48],[hx - hr * .38,hy - hr * .85,hx - hr * .15,hy - hr * .95],[hx,hy - hr * 1.0,hx + hr * .15,hy - hr * .95],[hx + hr * .38,hy - hr * .85,hx + hr * .35,hy - hr * .48]);
        // 頂の珠(冠の飾り玉)
        FS('#c03028'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.02, hr * .07, hr * .07, 0, 0, 7); ctx.ellipse(hx, hy - hr * 1.02, hr * .07, hr * .07, 0, 0, 7); ctx.fill();
        // 冠の帯(飾り線)
        SS(dk); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(hx - hr * .32, hy - hr * .58); ctx.quadraticCurveTo(hx, hy - hr * .68, hx + hr * .32, hy - hr * .58); ctx.stroke();
        break;
      }
      case 'nemes': {
        // ネメス: ファラオの頭巾 — 平らな冠+両側の垂れ襞+額帯
        ctx.fillStyle = acc2;
        // 冠(頭を包む平らな梯形)
        poly([hx - hr * .5,hy - hr * .45],[hx - hr * .45,hy - hr * .9],[hx,hy - hr * .98,hx + hr * .45,hy - hr * .9],[hx + hr * .5,hy - hr * .45]);
        // 両側の垂れ襞(大きな側板)
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .5,hy - hr * .45],[hx + s * hr * .65,hy - hr * .2,hx + s * hr * .55,hy + hr * .15],[hx + s * hr * .35,hy + hr * .2],[hx + s * hr * .4,hy - hr * .15,hx + s * hr * .4,hy - hr * .45]);
          // 襞の縞(横線)
          SS(dk); lnW(LW(.015));
          ([-.1, .02, .12]).forEach(ly => {
            ctx.beginPath(); ctx.moveTo(hx + s * hr * .4, hy + ly * hr); ctx.lineTo(hx + s * hr * .6, hy + (ly - .05) * hr); ctx.stroke();
          });
        });
        // 額帯(ウラエウスの帯)
        FS('#c09020'); rect(hx - hr * .48, hy - hr * .52, hr * .96, hr * .07);
        // 頂の縞(縦筋)
        SS(dk);
        ([-.3, -.15, 0, .15, .3]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy - hr * .5); ctx.quadraticCurveTo(hx + fx * hr, hy - hr * .9, hx + fx * hr * .8, hy - hr * .95); ctx.stroke();
        });
        break;
      }
      case 'kavuk': {
        // カヴク: オスマンの頭巾 — 高い芯柱+渦巻く巻き布+下帯
        ctx.fillStyle = acc2;
        // 高い芯柱(中央の尖った柱)
        poly([hx - hr * .18,hy - hr * .45],[hx - hr * .15,hy - hr * 1.15],[hx,hy - hr * 1.22,hx + hr * .15,hy - hr * 1.15],[hx + hr * .18,hy - hr * .45]);
        // 巻き布(渦巻きの帯を3段)
        SS(dk); lnW(LW(.04, 1.5));
        ([-.55, -.75, -.95]).forEach(wy => {
          ctx.beginPath(); ctx.moveTo(hx - hr * (.45 - (wy + .95) * .3), hy + wy * hr); ctx.quadraticCurveTo(hx, hy + (wy + .08) * hr, hx + hr * (.45 - (wy + .95) * .3), hy + wy * hr); ctx.stroke();
        });
        // 下帯(額の帯+垂れ布)
        FS(acc2); rect(hx - hr * .48, hy - hr * .55, hr * .96, hr * .12); poly([hx + hr * .48,hy - hr * .5],[hx + hr * .6,hy - hr * .2,hx + hr * .5,hy + hr * .1],[hx + hr * .38,hy + hr * .05],[hx + hr * .45,hy - hr * .2,hx + hr * .4,hy - hr * .5]);
        // 帯の縁(細線)
        SS('#c09020'); lnW(LW(.015)); ctx.beginPath(); ctx.moveTo(hx - hr * .48, hy - hr * .52); ctx.lineTo(hx + hr * .48, hy - hr * .52); ctx.stroke();
        break;
      }
      case 'penacho': {
        // ペナチョ: アステカの羽冠 — 放射状の長羽+金の額帯
        // 長羽(放射状5本: 緑のケツァール羽)
        const fe = ['#28a058', '#30b868', '#28a058', '#38c878', '#28a058']; const fa = [-0.6, -0.3, 0, 0.3, 0.6]; SS(dk);
        times(5, i => {
          const ax = hx + fa[i] * hr * .9; const topX = hx + fa[i] * hr * 2.1; const topY = hy - hr * (1.7 - Math.abs(fa[i]) * .4); FS(fe[i]); poly([ax,hy - hr * .4],[topX + hr * .08,topY + hr * .3,topX,topY],[topX - hr * .08,topY + hr * .3,ax,hy - hr * .4]);
          // 羽軸(中央線)
          lnW(LW(.015)); ctx.beginPath(); ctx.moveTo(ax, hy - hr * .4); ctx.quadraticCurveTo((ax + topX) / 2, (hy + topY) / 2, topX, topY); ctx.stroke();
        });
        // 金の額帯(飾り板+点飾り)
        FS('#c89828'); poly([hx - hr * .55,hy - hr * .42],[hx + hr * .55,hy - hr * .42],[hx + hr * .5,hy - hr * .58],[hx - hr * .5,hy - hr * .58]); FS(dk);
        ([-.3, 0, .3]).forEach(bx => {
          ell(hx + bx * hr, hy - hr * .5, hr * .04, hr * .04);
        });
        break;
      }
      case 'cangaceiro': {
        // カンガセイロ: 革の反りつば帽 — 角の立つつば+星の飾り
        ctx.fillStyle = acc2;
        // 広い反りつば(両端の立ち角)
        poly([hx - hr * .85,hy - hr * .38],[hx - hr * .7,hy - hr * .6,hx - hr * .4,hy - hr * .5],[hx,hy - hr * .42,hx + hr * .4,hy - hr * .5],[hx + hr * .7,hy - hr * .6,hx + hr * .85,hy - hr * .38],[hx + hr * .5,hy - hr * .3,hx,hy - hr * .38],[hx - hr * .5,hy - hr * .3,hx - hr * .85,hy - hr * .38]);
        // 前面の尖った飾り(中央の角)
        poly([hx - hr * .1,hy - hr * .55],[hx,hy - hr * .9],[hx + hr * .1,hy - hr * .55]);
        // 冠(低い革のドーム)
        poly([hx - hr * .32,hy - hr * .48],[hx - hr * .3,hy - hr * .8,hx,hy - hr * .85],[hx + hr * .3,hy - hr * .8,hx + hr * .32,hy - hr * .48]);
        // 星の飾り(冠の中央)
        FS('#d8b828'); ctx.beginPath();
        times(5, i => {
          const a = -Math.PI / 2 + i * Math.PI * 2 / 5; const bx = hx + Math.cos(a) * hr * .1; const by = hy - hr * .66 + Math.sin(a) * hr * .1; i === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by); const a2 = a + Math.PI / 5; ctx.lineTo(hx + Math.cos(a2) * hr * .045, hy - hr * .66 + Math.sin(a2) * hr * .045);
        });
        ctx.closePath(); ctx.fill();
        // 革の縫い目(つばの縁線)
        SS(dk); lnW(LW(.015)); ctx.beginPath(); ctx.moveTo(hx - hr * .6, hy - hr * .42); ctx.quadraticCurveTo(hx, hy - hr * .52, hx + hr * .6, hy - hr * .42); ctx.stroke();
        break;
      }
      case 'tuiga': {
        // トゥイガ: サモアの儀礼冠 — 額帯+立つ骨組み+赤い羽房
        // 額帯(前面の飾り板)
        FS(acc2); poly([hx - hr * .5,hy - hr * .42],[hx + hr * .5,hy - hr * .42],[hx + hr * .45,hy - hr * .6],[hx - hr * .45,hy - hr * .6]);
        // 骨組み(放射状の木の柱: 扇状5本)
        SS('#8a6a48'); lnW(LW(.025, 1.5));
        ([-.7, -.35, 0, .35, .7]).forEach(ta => {
          ctx.beginPath(); ctx.moveTo(hx + ta * hr * .3, hy - hr * .55); ctx.lineTo(hx + ta * hr * .9, hy - hr * (1.4 - Math.abs(ta) * .35)); ctx.stroke();
        });
        // 骨組みの横繋ぎ(扇の骨の弧)
        lnW(LW(.018)); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .95); ctx.quadraticCurveTo(hx, hy - hr * 1.25, hx + hr * .55, hy - hr * .95); ctx.stroke();
        // 赤い羽房(頂の房飾り)
        FS('#c03028');
        ([-.5, -.25, 0, .25, .5]).forEach(tx => {
          ell(hx + tx * hr, hy - hr * (1.1 - Math.abs(tx) * .15), hr * .07, hr * .16);
        });
        // 帯の点飾り(装飾珠)
        FS(dk);
        ([-.3, 0, .3]).forEach(bx => {
          ell(hx + bx * hr, hy - hr * .51, hr * .035, hr * .035);
        });
        break;
      }
      case 'zhawa': {
        // ジャワ: チベットのフェルト帽 — 毛皮の反り縁+耳当て+平らな冠
        ctx.fillStyle = acc2;
        // 冠(平らなフェルトのドーム)
        poly([hx - hr * .4,hy - hr * .45],[hx - hr * .42,hy - hr * .85,hx - hr * .15,hy - hr * .92],[hx,hy - hr * .96,hx + hr * .15,hy - hr * .92],[hx + hr * .42,hy - hr * .85,hx + hr * .4,hy - hr * .45]);
        // 毛皮の反り縁(額の起毛帯)
        FS('#e8d8b0'); poly([hx - hr * .48,hy - hr * .48],[hx,hy - hr * .62,hx + hr * .48,hy - hr * .48],[hx + hr * .48,hy - hr * .38],[hx,hy - hr * .52,hx - hr * .48,hy - hr * .38]);
        // 起毛の点描(毛先の質感)
        SS('#c0a878'); lnW(LW(.012));
        ([-.35, -.18, 0, .18, .35]).forEach(fx => {
          ctx.beginPath(); ctx.moveTo(hx + fx * hr, hy - hr * .55); ctx.lineTo(hx + fx * hr, hy - hr * .42); ctx.stroke();
        });
        // 耳当て(両側の垂れ毛皮)
        FS('#d8c8a0');
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .4,hy - hr * .5],[hx + s * hr * .55,hy - hr * .3,hx + s * hr * .5,hy + hr * .1],[hx + s * hr * .35,hy + hr * .15],[hx + s * hr * .4,hy - hr * .2,hx + s * hr * .35,hy - hr * .5]);
        });
        // 冠の帯(飾り線)
        SS(dk); lnW(LW(.018)); ctx.beginPath(); ctx.moveTo(hx - hr * .36, hy - hr * .62); ctx.quadraticCurveTo(hx, hy - hr * .72, hx + hr * .36, hy - hr * .62); ctx.stroke();
        break;
      }
      case 'glengarry': {
        // グレンガリー: リボン付きの軍帽 — 折り目の舟形+後ろの垂れリボン
        ctx.fillStyle = acc2;
        // 本体(両端の尖った舟形: 前低く後ろ高い)
        poly([hx - hr * .45,hy - hr * .55],[hx - hr * .5,hy - hr * .85,hx - hr * .25,hy - hr * .92],[hx,hy - hr * .78,hx + hr * .25,hy - hr * .92],[hx + hr * .5,hy - hr * .85,hx + hr * .45,hy - hr * .55],[hx,hy - hr * .45,hx - hr * .45,hy - hr * .55]);
        // 中央の折り目(窪み線)
        SS(dk); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(hx - hr * .3, hy - hr * .68); ctx.quadraticCurveTo(hx, hy - hr * .62, hx + hr * .3, hy - hr * .68); ctx.stroke();
        // グログラン縁帯(本体の下縁)
        SS(dk); lnW(hr * .08); ctx.beginPath(); ctx.moveTo(hx - hr * .45, hy - hr * .55); ctx.quadraticCurveTo(hx, hy - hr * .45, hx + hr * .45, hy - hr * .55); ctx.stroke();
        // 後ろの垂れリボン(2筋)
        SS(dk); lnW(LW(.05));
        ([.18, .3]).forEach(rx => {
          ctx.beginPath(); ctx.moveTo(hx + rx * hr, hy - hr * .5); ctx.quadraticCurveTo(hx + rx * hr + hr * .08, hy - hr * .1, hx + rx * hr - hr * .03, hy + hr * .3); ctx.stroke();
        });
        // ロゼット(側面の飾り)
        FS('#c03028'); dot(hx - hr * .32, hy - hr * .5, hr * .06); SS(dk); lnW(LW(.015)); dots(hx - hr * .32, hy - hr * .5, hr * .06);
        break;
      }
      case 'satroka': {
        // サトロカ: マダガスカルのフェルト帽 — 反りつば+円錐冠+飾り帯
        ctx.fillStyle = acc2;
        // 反りつば(両端が上がる広い縁)
        poly([hx - hr * .6,hy - hr * .5],[hx - hr * .55,hy - hr * .68,hx - hr * .4,hy - hr * .62],[hx,hy - hr * .5,hx + hr * .4,hy - hr * .62],[hx + hr * .55,hy - hr * .68,hx + hr * .6,hy - hr * .5],[hx,hy - hr * .38,hx - hr * .6,hy - hr * .5]);
        // 円錐の冠(上へ細まる)
        poly([hx - hr * .32,hy - hr * .55],[hx - hr * .18,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .18,hy - hr * .95],[hx + hr * .32,hy - hr * .55]);
        // 飾り帯(冠の裾の帯)
        FS('#c03828'); poly([hx - hr * .33,hy - hr * .58],[hx + hr * .33,hy - hr * .58],[hx + hr * .3,hy - hr * .5],[hx - hr * .3,hy - hr * .5]);
        // 縫い目線(冠のパネル)
        SS(dk); lnW(LW(.015));
        ([-.12, .12]).forEach(sxx => {
          ctx.beginPath(); ctx.moveTo(hx + sxx * hr, hy - hr * .9); ctx.lineTo(hx + sxx * hr * 1.6, hy - hr * .55); ctx.stroke();
        });
        // 頂のボタン
        ctx.fillStyle = '#c03828'; ell(hx, hy - hr * .98, hr * .05, hr * .04);
        break;
      }
      case 'taupoo': {
        // タウポウ: タヒチのパレオ頭巾 — 巻き布+横結び+ハイビスカス
        ctx.fillStyle = acc2;
        // 巻き布(頭を包む帯状)
        poly([hx - hr * .42,hy - hr * .45],[hx - hr * .48,hy - hr * .8,hx - hr * .2,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .2,hy - hr * .95],[hx + hr * .48,hy - hr * .8,hx + hr * .42,hy - hr * .45],[hx,hy - hr * .35,hx - hr * .42,hy - hr * .45]);
        // 折り線(巻きの襞)
        SS(dk); lnW(LW(.015));
        ([-.6, -.75, -.9]).forEach(fy => {
          ctx.beginPath(); ctx.moveTo(hx - hr * .35, hy + fy * hr); ctx.quadraticCurveTo(hx, hy + (fy - .06) * hr, hx + hr * .35, hy + fy * hr); ctx.stroke();
        });
        // 横結び(右側の布のたまり)
        FS(acc2); poly([hx + hr * .38,hy - hr * .7],[hx + hr * .62,hy - hr * .75,hx + hr * .55,hy - hr * .45],[hx + hr * .62,hy - hr * .25,hx + hr * .42,hy - hr * .4]); SS(dk); lnW(LW(.015)); ctx.beginPath(); ctx.moveTo(hx + hr * .42, hy - hr * .55); ctx.quadraticCurveTo(hx + hr * .55, hy - hr * .6, hx + hr * .52, hy - hr * .4); ctx.stroke();
        // ハイビスカス(結び目の花)
        FS('#e85878');
        ([0, 1.26, 2.52, 3.77, 5.03]).forEach(pa => {
          const px2 = hx + hr * .48 + Math.cos(pa) * hr * .07; const py2 = hy - hr * .52 + Math.sin(pa) * hr * .07; ell(px2, py2, hr * .05, hr * .035, pa);
        });
        FS('#f8d858'); dot(hx + hr * .48, hy - hr * .52, hr * .03);
        break;
      }
      case 'salusalu': {
        // サルサル: フィジーの花冠 — プルメリアの輪+後ろのシダ葉
        // シダの葉(冠の後ろの扇状の葉)
        FS('#3a7838');
        ([-.9, -.45, 0, .45, .9]).forEach(fa => {
          ctx.save(); ctx.translate(hx, hy - hr * .5); ctx.rotate(fa * .5); ell(0, -hr * .3, hr * .09, hr * .35); ctx.restore();
        });
        // プルメリアの花の輪(頭を囲む)
        for (const [fx, fy] of [[-.4, -.55], [-.2, -.68], [0, -.72], [.2, -.68], [.4, -.55]]) {
          const cx2 = hx + fx * hr, cy2 = hy + fy * hr; FS('#f8f4e8');
          ([0, 1.26, 2.52, 3.77, 5.03]).forEach(pa => {
            ell(cx2 + Math.cos(pa) * hr * .055, cy2 + Math.sin(pa) * hr * .055, hr * .045, hr * .03, pa);
          });
          FS('#f0c030'); dot(cx2, cy2, hr * .028);
        }
        break;
      }
      case 'kapkap': {
        // カプカプ: PNGの貝飾り — 額帯+白い円盤+同心の彫り紋
        // 額帯(黒い紐帯)
        SS(dk); lnW(hr * .07); ctx.beginPath(); ctx.moveTo(hx - hr * .45, hy - hr * .5); ctx.quadraticCurveTo(hx, hy - hr * .6, hx + hr * .45, hy - hr * .5); ctx.stroke();
        // 貝の円盤(中央の大きな白貝)
        FS('#f0ead8'); dot(hx, hy - hr * .78, hr * .28); SS('#a89878'); lnW(LW(.015)); dots(hx, hy - hr * .78, hr * .28);
        // 同心の彫り紋(2輪)
        SS('#b0a080'); lnW(LW(.012));
        ([.18, .1]).forEach(rr => {
          dots(hx, hy - hr * .78, hr * rr);
        });
        // 中心の点(彫りの芯)
        FS('#a89878'); dot(hx,hy - hr * .78,hr * .03);
        // 紐の垂れ(円盤と帯をつなぐ)
        SS(dk); lnW(LW(.02)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .5); ctx.lineTo(hx, hy - hr * .52); ctx.stroke();
        break;
      }
      case 'tekiteki': {
        // テキテキ: トンガの額飾り — 帯+直立の羽房+揺れる小枝
        // 額の帯(編んだ紐)
        SS(dk); lnW(hr * .08); ctx.beginPath(); ctx.moveTo(hx - hr * .48, hy - hr * .52); ctx.quadraticCurveTo(hx, hy - hr * .62, hx + hr * .48, hy - hr * .52); ctx.stroke();
        // 帯の編み模様(小さな点)
        FS('#c8b888');
        ([-.3, -.15, 0, .15, .3]).forEach(bx => {
          dot(hx + bx * hr, hy - hr * .57, hr * .02);
        });
        // 直立の羽房(中央に立つ白い羽+赤い根元)
        FS('#e8e0d0'); poly([hx - hr * .04,hy - hr * .58],[hx - hr * .14,hy - hr * 1.0,hx,hy - hr * 1.05],[hx + hr * .14,hy - hr * 1.0,hx + hr * .04,hy - hr * .58]);
        // 羽軸(中央の筋)
        SS('#a89878'); lnW(LW(.015)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .58); ctx.lineTo(hx, hy - hr * 1.02); ctx.stroke();
        // 赤い根元(帯の上の飾り紐)
        SS('#c03028'); lnW(hr * .05); ctx.beginPath(); ctx.moveTo(hx - hr * .08, hy - hr * .55); ctx.lineTo(hx + hr * .08, hy - hr * .55); ctx.stroke();
        break;
      }
      case 'pare': {
        // パレ: リト織りの日除け帽 — 平つば+低い冠+編み筋
        ctx.fillStyle = acc2;
        // 平つば(広い楕円)
        ell(hx, hy - hr * .5, hr * .62, hr * .16);
        // つばの編み筋(同心の細線)
        SS(dk); lnW(LW(.012));
        ([.45, .32]).forEach(rr => {
          ells(hx, hy - hr * .5, hr * rr, hr * rr * .26);
        });
        // 低い冠(つばの上の浅いドーム)
        poly([hx - hr * .3,hy - hr * .5],[hx - hr * .32,hy - hr * .8,hx - hr * .12,hy - hr * .88],[hx,hy - hr * .92,hx + hr * .12,hy - hr * .88],[hx + hr * .32,hy - hr * .8,hx + hr * .3,hy - hr * .5]);
        // 冠の編み筋(3本の弧)
        ([-.6, -.7, -.8]).forEach(wy => {
          ctx.beginPath(); ctx.moveTo(hx - hr * .28, hy + wy * hr); ctx.quadraticCurveTo(hx, hy + (wy - .05) * hr, hx + hr * .28, hy + wy * hr); ctx.stroke();
        });
        // 帯(冠の裾の細帯)
        SS('#c03828'); lnW(hr * .04); ctx.beginPath(); ctx.moveTo(hx - hr * .3, hy - hr * .54); ctx.quadraticCurveTo(hx, hy - hr * .62, hx + hr * .3, hy - hr * .54); ctx.stroke();
        break;
      }
      case 'capote': {
        // カポテ: アゾレスの黒い頭巾 — 大きなフード+顔を囲む広い縁
        ctx.fillStyle = acc2;
        // 大きなフード(頭を包む丸い外輪)
        ell(hx, hy - hr * .35, hr * .72, hr * .78);
        // 内側の顔開き(暗い内輪)
        FS(dk); ell(hx, hy - hr * .32, hr * .52, hr * .58);
        // 広い縁のフリンジ(外輪の下端の折り返し)
        FS(acc2); poly([hx - hr * .72,hy - hr * .05],[hx - hr * .78,hy + hr * .15,hx - hr * .55,hy + hr * .12],[hx - hr * .5,hy + hr * .02]); poly([hx + hr * .72,hy - hr * .05],[hx + hr * .78,hy + hr * .15,hx + hr * .55,hy + hr * .12],[hx + hr * .5,hy + hr * .02]);
        // 顎下の結び目(小さな帯)
        SS(dk); lnW(hr * .05); ctx.beginPath(); ctx.moveTo(hx - hr * .08, hy + hr * .18); ctx.lineTo(hx + hr * .08, hy + hr * .18); ctx.stroke();
        break;
      }
      case 'taraz': {
        // タラズ: アルメニアの花嫁頭飾り — 銀の帯+垂れる貨幣鎖+ベール
        // 銀の額帯
        ctx.fillStyle = '#d0d8e0'; poly([hx - hr * .5,hy - hr * .62],[hx,hy - hr * .74,hx + hr * .5,hy - hr * .62],[hx + hr * .46,hy - hr * .5],[hx,hy - hr * .6,hx - hr * .46,hy - hr * .5]);
        // 帯の文様(3つの石)
        FS('#a03030');
        ([-.22, 0, .22]).forEach(sx => {
          dot(hx + sx * hr, hy - hr * .58, hr * .03);
        });
        // 垂れる貨幣鎖(両側のチェーン+金貨)
        SS('#c8a848'); lnW(LW(.015));
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .46, hy - hr * .56); ctx.quadraticCurveTo(hx + s * hr * .5, hy - hr * .3, hx + s * hr * .42, hy - hr * .1); ctx.stroke(); FS('#e0b840'); dot(hx + s * hr * .42, hy - hr * .08, hr * .05);
        });
        // ベール(後ろに垂れる薄布)
        FS('rgba(240,240,245,0.35)'); poly([hx - hr * .48,hy - hr * .5],[hx - hr * .55,hy + hr * .3,hx - hr * .4,hy + hr * .6],[hx + hr * .4,hy + hr * .6],[hx + hr * .55,hy + hr * .3,hx + hr * .48,hy - hr * .5]);
        // 頂の小さな飾り(十字形の宝飾)
        SS('#c8a848'); lnW(hr * .02); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .72); ctx.moveTo(hx, hy - hr * .72); ctx.lineTo(hx, hy - hr * .84); ctx.moveTo(hx - hr * .04, hy - hr * .78); ctx.moveTo(hx - hr * .04, hy - hr * .78); ctx.lineTo(hx + hr * .04, hy - hr * .78); ctx.stroke();
        break;
      }
      case 'kalagayi': {
        // カラガイ: アゼルバイジャンの絹頭巾 — 包む布+幾何縁+房
        ctx.fillStyle = acc2;
        // 頭を包む布(滑らかなドーム)
        poly([hx - hr * .55,hy - hr * .25],[hx - hr * .58,hy - hr * .85,hx,hy - hr * .95],[hx + hr * .58,hy - hr * .85,hx + hr * .55,hy - hr * .25],[hx,hy - hr * .1,hx - hr * .55,hy - hr * .25]);
        // 幾何学的な縁模様(帯の上のひし形)
        SS(dk); lnW(LW(.015)); ctx.beginPath(); ctx.moveTo(hx - hr * .48, hy - hr * .32); ctx.quadraticCurveTo(hx, hy - hr * .16, hx + hr * .48, hy - hr * .32); ctx.stroke();
        ([-.36, -.18, 0, .18, .36]).forEach(dx => {
          polyS([hx + dx * hr,hy - hr * .3],[hx + dx * hr + hr * .04,hy - hr * .26],[hx + dx * hr,hy - hr * .22],[hx + dx * hr - hr * .04,hy - hr * .26]);
        });
        // 後ろの垂れ襞(背中への布のたわみ)
        poly([hx + hr * .45,hy - hr * .6],[hx + hr * .62,hy - hr * .4,hx + hr * .55,hy - hr * .12],[hx + hr * .42,hy - hr * .15],[hx + hr * .5,hy - hr * .45,hx + hr * .38,hy - hr * .58]);
        // 房(垂れ襞の先の小さな結び)
        FS(dk); dot(hx + hr * .52, hy - hr * .1, hr * .04);
        break;
      }
      case 'agal': {
        // アガール: 二重の黒い頭の紐 — 二つの輪+垂れる房
        ctx.strokeStyle = dk;
        // 二重の輪(頭頂の黒い紐帯)
        ([.72, .8]).forEach(oy => {
          lnW(hr * .05); ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy - oy * hr); ctx.quadraticCurveTo(hx, hy - (oy + .1) * hr, hx + hr * .5, hy - oy * hr); ctx.stroke();
        });
        // 輪の留め結び(背面の小さな結び目)
        lnW(hr * .04); ctx.beginPath(); ctx.moveTo(hx + hr * .48, hy - hr * .7); ctx.quadraticCurveTo(hx + hr * .52, hy - hr * .6, hx + hr * .48, hy - hr * .5); ctx.stroke();
        // 垂れる房(2本の細い紐の先端)
        for (const [tx, len] of [[.46, .35], [.52, .42]]) {
          lnW(hr * .025); ctx.beginPath(); ctx.moveTo(hx + tx * hr, hy - hr * .5); ctx.quadraticCurveTo(hx + tx * hr + hr * .03, hy - hr * .3, hx + tx * hr, hy - hr * len); ctx.stroke();
          // 房の先の結び玉
          ctx.fillStyle = dk; dot(hx + tx * hr, hy - hr * len + hr * .02, hr * .03);
        }
        // 白いグトラ(頭巾の垂れ布: 紐の下の白い輪郭)
        FS('rgba(250,250,248,0.4)'); poly([hx - hr * .5,hy - hr * .55],[hx - hr * .55,hy - hr * .3,hx - hr * .48,hy - hr * .1],[hx + hr * .48,hy - hr * .1],[hx + hr * .55,hy - hr * .3,hx + hr * .5,hy - hr * .55]);
        break;
      }
      case 'chechia': {
        // シェシア: チュニジアの赤いフェルト帽 — 低い円筒+平らな天
        ctx.fillStyle = '#c03028';
        // 低い円筒の本体
        poly([hx - hr * .42,hy - hr * .45],[hx - hr * .38,hy - hr * .82],[hx,hy - hr * .9,hx + hr * .38,hy - hr * .82],[hx + hr * .42,hy - hr * .45],[hx,hy - hr * .35,hx - hr * .42,hy - hr * .45]);
        // 平らな天(上の平円)
        FS('#d03830'); ell(hx, hy - hr * .82, hr * .38, hr * .1);
        // 側面の編み筋(縦の細線)
        SS('#8a2020'); lnW(LW(.012));
        ([-.3, -.15, 0, .15, .3]).forEach(vx => {
          ctx.beginPath(); ctx.moveTo(hx + vx * hr, hy - hr * .5); ctx.lineTo(hx + vx * hr * 1.05, hy - hr * .78); ctx.stroke();
        });
        // 裾の帯(下部の暗い帯)
        SS(dk); lnW(hr * .04); ctx.beginPath(); ctx.moveTo(hx - hr * .42, hy - hr * .48); ctx.quadraticCurveTo(hx, hy - hr * .38, hx + hr * .42, hy - hr * .48); ctx.stroke();
        break;
      }
      case 'ekori': {
        // エコリ: ヒンバの革頭飾り — 後ろに反った葉+帯+金属飾り
        ctx.fillStyle = acc2;
        // 三つの革の葉(頭の後ろに立つ翼のような革)
        for (const [sx, lean2] of [[-.18, -.15], [0, 0], [.18, .15]]) {
          ctx.save(); ctx.translate(hx + sx * hr, hy - hr * .55); ctx.rotate(lean2 * .5); poly([-hr * .07,0],[-hr * .1,-hr * .45,0,-hr * .55],[hr * .1,-hr * .45,hr * .07,0]); ctx.restore();
        }
        // 前の帯(額の革帯)
        SS('#5a4030'); lnW(hr * .09); ctx.beginPath(); ctx.moveTo(hx - hr * .48, hy - hr * .55); ctx.quadraticCurveTo(hx, hy - hr * .68, hx + hr * .48, hy - hr * .55); ctx.stroke();
        // 帯の金属帯の金属飾り(銀の丸)
        FS('#c8c8c8');
        ([-.24, -.08, .08, .24]).forEach(bx => {
          dot(hx + bx * hr, hy - hr * .6, hr * .025);
        });
        // 帯の下の編み紐(垂れる2本の革紐)
        SS('#5a4030'); lnW(LW(.02));
        ([-.4, .4]).forEach(sx => {
          ctx.beginPath(); ctx.moveTo(hx + sx * hr, hy - hr * .5); ctx.lineTo(hx + sx * hr * 1.1, hy - hr * .2); ctx.stroke();
        });
        break;
      }
      case 'jok': {
        // ジョク: ラオスの円錐笠 — 広い円錐+先端の尖り+顎紐
        ctx.fillStyle = acc2;
        // 大きな円錐の本体(広い三角)
        poly([hx - hr * .75,hy - hr * .3],[hx,hy - hr * 1.05],[hx + hr * .75,hy - hr * .3]);
        // 円錐の編み筋(放射の細線)
        SS(dk); lnW(LW(.012));
        ([-.5, -.25, 0, .25, .5]).forEach(ax2 => {
          ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.02); ctx.lineTo(hx + ax2 * hr, hy - hr * .32); ctx.stroke();
        });
        // 縁の帯(下部の編み端)
        SS(dk); lnW(hr * .035); ctx.beginPath(); ctx.moveTo(hx - hr * .75, hy - hr * .3); ctx.quadraticCurveTo(hx, hy - hr * .22, hx + hr * .75, hy - hr * .3); ctx.stroke();
        // 先端の尖り(小さな飾り)
        FS('#c84838'); dot(hx, hy - hr * 1.02, hr * .035);
        // 顎紐(両側の垂れ紐)
        SS(dk); lnW(LW(.015));
        ([-.55, .55]).forEach(sx => {
          ctx.beginPath(); ctx.moveTo(hx + sx * hr, hy - hr * .28); ctx.lineTo(hx + sx * hr * .8, hy + hr * .2); ctx.stroke();
        });
        break;
      }
      case 'clop': {
        // クロップ: ルーマニアの羊飼いの毛皮帽 — 高い円筒+帯+飾り珠
        ctx.fillStyle = acc2;
        // 本体(上にゆくほど細い円筒)
        poly([hx - hr * .5,hy - hr * .4],[hx - hr * .42,hy - hr * 1.3],[hx,hy - hr * 1.42,hx + hr * .42,hy - hr * 1.3],[hx + hr * .5,hy - hr * .4]);
        // 毛皮の質感(縁の丸い毛並み)
        FS(dk);
        for (let i = -3; i <= 3; i++) {
          dot(hx + i * hr * .14, hy - hr * .4, hr * .07);
        }
        // 縁帯
        ctx.fillStyle = dk; rect(hx - hr * .52, hy - hr * .5, hr * 1.04, hr * .1);
        // 正面の飾り珠(小さな色珠の列)
        FS(acc2);
        for (let i = -1; i <= 1; i++) {
          dot(hx + i * hr * .15, hy - hr * .65, hr * .045);
        }
        break;
      }
      case 'csikos': {
        // チコーシュ帽: ハンガリーの馬番の帽 — 広い平つば+高い冠+飾り紐+羽根
        // 広い平つば
        ctx.fillStyle = acc2; ell(hx, hy - hr * .55, hr * 1.15, hr * .22);
        // 高い冠(上がわずかに広い)
        FS(dk); poly([hx - hr * .45,hy - hr * .6],[hx - hr * .5,hy - hr * 1.15],[hx,hy - hr * 1.25,hx + hr * .5,hy - hr * 1.15],[hx + hr * .45,hy - hr * .6]);
        // 冠の帯(色差し)
        FS(acc2); rect(hx - hr * .47, hy - hr * .75, hr * .94, hr * .12);
        // 飾り紐の結び目(右側)+垂れ紐
        ctx.strokeStyle = acc2; lnW(LW(.06, 1.5)); dots(hx + hr * .45, hy - hr * .68, hr * .08); ctx.beginPath(); ctx.moveTo(hx + hr * .48, hy - hr * .62); ctx.lineTo(hx + hr * .5, hy - hr * .4); ctx.stroke();
        // 片側の小さな羽根飾り
        ell(hx - hr * .4, hy - hr * .85, hr * .05, hr * .18, -.3);
        break;
      }
      case 'rogatywka': {
        // ロガティフカ: ポーランドの角帽 — 四角い天辺+革つば+帽章
        // 四角い天板(台形)
        FS(acc2); poly([hx - hr * .55,hy - hr * .95],[hx - hr * .45,hy - hr * 1.15],[hx + hr * .45,hy - hr * 1.15],[hx + hr * .55,hy - hr * .95]);
        // 側面(逆台形の胴)
        FS(dk); poly([hx - hr * .55,hy - hr * .95],[hx + hr * .55,hy - hr * .95],[hx + hr * .48,hy - hr * .55],[hx - hr * .48,hy - hr * .55]);
        // 革つば
        ctx.fillStyle = acc2; ell(hx, hy - hr * .55, hr * .55, hr * .1);
        // 正面の小さな帽章(鷲)
        FS('#e8e8e0'); dot(hx,hy - hr * .78,hr * .07);
        break;
      }
      case 'papakha': {
        // パパハ: コーカサスの羊毛帽 — 高い円筒+ふっくらした縁+光沢の段
        ctx.fillStyle = acc2;
        // 本体(上がやや広い円筒)
        poly([hx - hr * .5,hy - hr * .3],[hx - hr * .55,hy - hr * 1.35],[hx,hy - hr * 1.5,hx + hr * .55,hy - hr * 1.35],[hx + hr * .5,hy - hr * .3]);
        // 羊毛の質感(上部の不規則な房)
        FS(dk);
        for (let i = -3; i <= 3; i++) {
          dot(hx + i * hr * .16, hy - hr * (1.32 - Math.abs(i) * .03), hr * .09);
        }
        // 縁の帯(段)
        FS(dk); rect(hx - hr * .52, hy - hr * .55, hr * 1.04, hr * .12);
        // 高さの筋(毛並み)
        SS(dk); lnW(LW(.04));
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .2, hy - hr * .5); ctx.lineTo(hx + i * hr * .22, hy - hr * 1.25); ctx.stroke();
        }
        break;
      }
      case 'venok': {
        // ヴェーノク: スラヴの花冠 — 大花の輪+後ろに垂れる長いリボン
        const cols = [acc2, '#d04838', '#e8c838', '#4898d0'];
        times(7, i => {
          const a = Math.PI + Math.PI * (i / 6) - .05; const fxp = hx + Math.cos(a) * hr * .95; const fyp = hy - hr * .15 + Math.sin(a) * hr * .9; FS(cols[i % 4]);
          // 花弁(5枚)
          times(5, p2 => {
            const pa = p2 * Math.PI * 2 / 5; ctx.beginPath();
            ctx.ellipse(fxp + Math.cos(pa) * hr * .07, fyp + Math.sin(pa) * hr * .07,
              hr * .06, hr * .04, pa, 0, 7);
            ctx.fill();
          });
          FS('#e8c848'); dot(fxp,fyp,hr * .04);
        });
        // 後ろに垂れる長いリボン(左右)
        ([-1, 1]).forEach(s => {
          SS(cols[s > 0 ? 1 : 3]); lnW(LW(.1, 2)); ctx.beginPath(); ctx.moveTo(hx + s * hr * .7, hy - hr * .3);
          ctx.quadraticCurveTo(hx + s * hr * .95, hy + hr * .3,
            hx + s * hr * .85, hy + hr * 1.1);
          ctx.stroke();
        });
        break;
      }
      case 'borla': {
        // ボルラ: ラージプートの額飾り — 髪際から垂れる球形の飾り+鎖
        const tx = hx, ty = hy - hr * .5;
        // 鎖
        ctx.strokeStyle = acc2; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(tx, hy - hr * 1.05); ctx.lineTo(tx, ty - hr * .12); ctx.stroke();
        // 球形の飾り(リング付き)
        FS(acc2); dot(tx,ty,hr * .16);
        // 球の輪郭の筋(南瓜状の畝)
        SS(dk); lnW(LW(.035));
        ([-.08, 0, .08]).forEach(off => {
          ells(tx + off * hr, ty, hr * (.1 - Math.abs(off) * .5), hr * .15);
        });
        // 頂と底の環
        ctx.fillStyle = dk; dot(tx,ty - hr * .17,hr * .04); dot(tx,ty + hr * .17,hr * .04);
        break;
      }
      case 'sarpech': {
        // サルペチ: ターバンの宝飾(王侯の羽飾り留め) — 立つ宝石+揺れる珠飾り
        // 額の帯
        ctx.fillStyle = acc2; rect(hx - hr * .5, hy - hr * .85, hr, hr * .15);
        // 中央の立つ宝飾(菱形+上珠)
        poly([hx,hy - hr * 1.3],[hx - hr * .14,hy - hr * 1.05],[hx,hy - hr * .85],[hx + hr * .14,hy - hr * 1.05]); FS(dk); dot(hx,hy - hr * 1.05,hr * .06);
        // 頂の羽根飾り
        ctx.strokeStyle = acc2; lnW(LW(.07, 2)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.3); ctx.quadraticCurveTo(hx + hr * .1, hy - hr * 1.55, hx + hr * .2, hy - hr * 1.6); ctx.stroke();
        // 両脇に垂れる珠飾り(3粒×2)
        FS(acc2);
        ([-1, 1]).forEach(s => {
          times(3, i => {
            dot(hx + s * hr * .25, hy - hr * (.68 - i * .12), hr * .045);
          });
        });
        break;
      }
      case 'pheta': {
        // ペタ: マラーターのターバン — 角張った後ろ折り+前の盛り上がり(シンデー)
        FS(acc2);
        // 前の盛り上がった冠
        poly([hx - hr * .55,hy - hr * .55],[hx - hr * .5,hy - hr * 1.15,hx + hr * .3,hy - hr * 1.1],[hx + hr * .55,hy - hr * .55]);
        // 後ろの角張った折り(シンデー: 扇形に立つ尾)
        poly([hx - hr * .55,hy - hr * .6],[hx - hr * .85,hy - hr * 1.05],[hx - hr * .7,hy - hr * 1.15],[hx - hr * .45,hy - hr * .8]);
        // 巻き目の筋
        ctx.strokeStyle = dk; lnW(LW(.045));
        times(3, i => {
          ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy - hr * (.58 + i * .15)); ctx.quadraticCurveTo(hx, hy - hr * (.66 + i * .16), hx + hr * .5, hy - hr * (.56 + i * .15)); ctx.stroke();
        });
        // 巻きの先の結び目
        ctx.beginPath(); ctx.arc(hx - hr * .68, hy - hr * 1.0, hr * .07, 0, 7); FS(dk); ctx.fill();
        break;
      }
      case 'jaapi': {
        // ジャピ: アッサムの竹笠 — 広い円錐+幾何学の編み模様+先の飾り
        ctx.fillStyle = acc2;
        // 広い浅い円錐
        poly([hx - hr * 1.1,hy - hr * .55],[hx,hy - hr * 1.45],[hx + hr * 1.1,hy - hr * .55]);
        // 幾何学の編み筋(同心弧+放射)
        SS(dk); lnW(LW(.04));
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(hx - hr * (1.1 - i * .25), hy - hr * (.55 + i * .22)); ctx.quadraticCurveTo(hx, hy - hr * (.62 + i * .22), hx + hr * (1.1 - i * .25), hy - hr * (.55 + i * .22)); ctx.stroke();
        }
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.45); ctx.lineTo(hx + i * hr * .4, hy - hr * .6); ctx.stroke();
        }
        // 頂の飾り玉
        ctx.fillStyle = dk; dot(hx,hy - hr * 1.42,hr * .1);
        break;
      }
      case 'tilak': {
        // ティラカ: 額の聖印 — 眉間のU字+垂れ線+珠
        const tx = hx, ty = hy - hr * .55; SS(acc2); lnW(LW(.07, 1.5)); ctx.lineCap = 'round';
        // ウールドワ・プンドラ(U字: 外側2本)
        ctx.beginPath(); ctx.moveTo(tx - hr * .1, ty + hr * .12); ctx.quadraticCurveTo(tx - hr * .12, ty - hr * .08, tx - hr * .08, ty - hr * .18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx + hr * .1, ty + hr * .12); ctx.quadraticCurveTo(tx + hr * .12, ty - hr * .08, tx + hr * .08, ty - hr * .18); ctx.stroke();
        // 中央の垂れ線
        ctx.beginPath(); ctx.moveTo(tx, ty + hr * .14); ctx.lineTo(tx, ty - hr * .16); ctx.stroke();
        // 珠(下部の赤点)
        FS(dk); dot(tx,ty + hr * .14,hr * .07);
        break;
      }
      case 'peacock': {
        // モールムクット(孔雀羽冠): クリシュナの孔雀羽 — 扇に開く羽根+目玉紋
        // 帯
        ctx.fillStyle = acc2; rect(hx - hr * .45, hy - hr * .8, hr * .9, hr * .18);
        // 開く羽根(3本)
        const pcols = ['#286848', '#386858', '#286848'];
        for (let i = -1; i <= 1; i++) {
          const ang = i * .5; const px2 = hx + Math.sin(ang) * hr * 1.1; const py2 = hy - hr * .75 - Math.cos(ang) * hr * .9; SS('#3a5040'); lnW(LW(.06, 1.5)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .75); ctx.quadraticCurveTo(hx + Math.sin(ang) * hr * .5, hy - hr * 1.2, px2, py2); ctx.stroke();
          // 目玉紋(外→内)
          FS(pcols[i + 1]); ell(px2, py2, hr * .16, hr * .2, ang); FS('#205890'); ell(px2, py2 - hr * .03, hr * .09, hr * .12, ang); FS(dk); ell(px2, py2 - hr * .03, hr * .045, hr * .06, ang);
        }
        // 帯の中央飾り
        ctx.fillStyle = dk; dot(hx,hy - hr * .7,hr * .08);
        break;
      }
      case 'jhoomar': {
        // ジューマル: インドの側頭飾り — 三日月飾り+耳に垂れる珠の房
        const jx = hx - hr * .5, jy = hy - hr * .55;
        // 三日月
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.arc(jx, jy, hr * .22, .5, 5.3); ctx.closePath(); ctx.closePath(); ctx.fill(); FS(dk); dot(jx + hr * .08, jy - hr * .05, hr * .15);
        // 垂れる珠の房(3列)
        FS(acc2);
        times(3, i => {
          const dx = jx - hr * .18 + i * hr * .14;
          times(3 - i, j2 => {
            dot(dx, jy + hr * (.2 + j2 * .16), hr * .045);
          });
          // 房の先の涙珠
          dot(dx, jy + hr * (.2 + (3 - i) * .16), hr * .06);
        });
        // 頭頂への鎖
        ctx.strokeStyle = acc2; lnW(LW(.04)); ctx.beginPath(); ctx.moveTo(jx, jy - hr * .2); ctx.quadraticCurveTo(hx - hr * .3, hy - hr * 1.0, hx, hy - hr * 1.1); ctx.stroke();
        break;
      }
      case 'mukut': {
        // ムクット: ヒンドゥーの神冠 — 高い尖塔型の冠+宝珠+垂れる飾り
        ctx.fillStyle = acc2;
        // 冠の土台(帯)
        rect(hx - hr * .5, hy - hr * .75, hr, hr * .25);
        // 高い尖塔の冠(3段に細くなる)
        poly([hx - hr * .45,hy - hr * .75],[hx - hr * .3,hy - hr * 1.1,hx - hr * .15,hy - hr * 1.3],[hx,hy - hr * 1.65,hx + hr * .15,hy - hr * 1.3],[hx + hr * .3,hy - hr * 1.1,hx + hr * .45,hy - hr * .75]);
        // 段の筋
        ctx.strokeStyle = dk; lnW(LW(.04));
        ([.95, 1.15, 1.35]).forEach(yy => {
          const ww = hr * (.42 - (yy - .95) * .7); ctx.beginPath(); ctx.moveTo(hx - ww, hy - hr * yy); ctx.lineTo(hx + ww, hy - hr * yy); ctx.stroke();
        });
        // 頂の宝珠
        ctx.fillStyle = dk; dot(hx,hy - hr * 1.62,hr * .08);
        // 帯の中央飾り
        dot(hx,hy - hr * .62,hr * .11);
        break;
      }
      case 'pagri': {
        // パグリ: シク教のターバン — 層を重ねた巻き布+前のタカ(房)+宝冠珠
        ctx.fillStyle = acc2;
        // 大きな前盛り(ファン型の折りたたみ)
        poly([hx - hr * .6,hy - hr * .5],[hx - hr * .5,hy - hr * 1.35,hx + hr * .25,hy - hr * 1.3],[hx + hr * .75,hy - hr * 1.2,hx + hr * .62,hy - hr * .5]);
        // 巻き布の層の筋(斜めの織り目)
        SS(dk); lnW(LW(.04)); ctx.beginPath();
        times(4, i => {
          ctx.moveTo(hx - hr * .55, hy - hr * (.55 + i * .16)); ctx.quadraticCurveTo(hx, hy - hr * (.68 + i * .18), hx + hr * .58, hy - hr * (.52 + i * .16));
        });
        ctx.stroke();
        // 中央の立つ折り目(タカ)
        SS(acc2); lnW(LW(.1, 2)); ctx.beginPath(); ctx.moveTo(hx - hr * .1, hy - hr * .75); ctx.quadraticCurveTo(hx + hr * .05, hy - hr * 1.45, hx + hr * .2, hy - hr * 1.5); ctx.stroke();
        // 飾り珠
        ctx.fillStyle = dk; dot(hx + hr * .15,hy - hr * .85,hr * .09);
        break;
      }
      case 'tikka': {
        // ティッカ(マーング・ティッカ): インドの額飾り — 髪生え際への鎖+垂れる宝石+珠
        ctx.strokeStyle = acc2; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.05); ctx.lineTo(hx, hy - hr * .68); ctx.stroke(); // 髪の生え際から // 額の中央へ鎖
        // 鎖の珠(3粒)
        FS(acc2);
        times(3, i => {
          dot(hx, hy - hr * (1.0 - i * .12), hr * .045);
        });
        // 垂れる宝石(涙型)
        poly([hx,hy - hr * .72],[hx - hr * .14,hy - hr * .55,hx,hy - hr * .42],[hx + hr * .14,hy - hr * .55,hx,hy - hr * .72]);
        // 宝石の輝き
        ctx.fillStyle = dk; dot(hx - hr * .03,hy - hr * .57,hr * .04);
        // 両脇の小珠
        ctx.fillStyle = acc2; dot(hx - hr * .35,hy - hr * .78,hr * .04); dot(hx + hr * .35,hy - hr * .78,hr * .04);
        break;
      }
      case 'karakul': {
        // カラクル帽(ジンナー帽): ペルシャ羊毛の wedge 帽 — 丸みのある楔型+起毛の質感
        ctx.fillStyle = acc2; poly([hx - hr * .6,hy - hr * .5],[hx - hr * .55,hy - hr * 1.15,hx,hy - hr * 1.2],[hx + hr * .55,hy - hr * 1.15,hx + hr * .6,hy - hr * .5],[hx,hy - hr * .72,hx - hr * .6,hy - hr * .5]);
        // 起毛の縁(短い筋)
        SS(dk); lnW(LW(.035)); ctx.beginPath();
        times(10, i => {
          const fx = hx - hr * .5 + i * hr * .11; const fy = hy - hr * (.5 + .04 * Math.sin(i * 3)); ctx.moveTo(fx, fy); ctx.lineTo(fx + hr * .04, fy - hr * .07);
        });
        ctx.stroke();
        // 前の縫い目
        ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.18); ctx.quadraticCurveTo(hx + hr * .05, hy - hr * .85, hx, hy - hr * .68); ctx.stroke();
        break;
      }
      case 'bandeau': {
        // バンドゥ: 1920年代の額帯 — 額を巻く帯+羽根飾り+宝石
        ctx.strokeStyle = acc2; lnW(hr * .22); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .28, hr * .95, hr * .8, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        // 側面の結び目
        ctx.fillStyle = dk; dot(hx + hr * .82, hy - hr * .32, hr * .12);
        // 立つ羽根
        ctx.fillStyle = acc2; poly([hx + hr * .85,hy - hr * .35],[hx + hr * .75,hy - hr * 1.1,hx + hr * .95,hy - hr * 1.35],[hx + hr * .95,hy - hr * .9,hx + hr * .9,hy - hr * .35]); SS(dk); lnW(LW(.03)); ctx.beginPath(); ctx.moveTo(hx + hr * .87, hy - hr * .35); ctx.lineTo(hx + hr * .92, hy - hr * 1.3); ctx.stroke();
        // 中央の宝石
        ctx.fillStyle = '#e0c040'; poly([hx,hy - hr * .5],[hx + hr * .09,hy - hr * .32],[hx,hy - hr * .14],[hx - hr * .09,hy - hr * .32]);
        break;
      }
      case 'cordobes': {
        // コルドベス帽: スペインの平天広つば帽 — まっすぐな円筒+水平つば+帯
        ctx.fillStyle = acc2;
        // 平らな円筒クラウン
        poly([hx - hr * .5,hy - hr * .5],[hx - hr * .5,hy - hr * 1.0],[hx + hr * .5,hy - hr * 1.0],[hx + hr * .5,hy - hr * .5]);
        // 水平の広つば(楕円)
        ell(hx, hy - hr * .5, hr * .95, hr * .17);
        // 帯
        ctx.fillStyle = dk; rect(hx - hr * .5, hy - hr * .66, hr, hr * .13);
        // つばの縁
        ctx.strokeStyle = dk; lnW(LW(.04)); ells(hx, hy - hr * .5, hr * .95, hr * .17);
        break;
      }
      case 'chullo': {
        // チューロ帽: アンデスの編み帽 — 耳あて+房ひも+幾何学模様
        ctx.fillStyle = acc2;
        // 尖ったクラウン
        poly([hx - hr * .55,hy - hr * .45],[hx - hr * .4,hy - hr * 1.3,hx,hy - hr * 1.35],[hx + hr * .4,hy - hr * 1.3,hx + hr * .55,hy - hr * .45]);
        // 耳あて(両側に垂れる)
        poly([hx - hr * .55,hy - hr * .45],[hx - hr * .6,hy + hr * .3],[hx - hr * .45,hy + hr * .35],[hx - hr * .4,hy - hr * .45]); poly([hx + hr * .55,hy - hr * .45],[hx + hr * .6,hy + hr * .3],[hx + hr * .45,hy + hr * .35],[hx + hr * .4,hy - hr * .45]);
        // 幾何学の縞(ダイヤ模様)
        SS(dk); lnW(LW(.05, 1.2)); ctx.beginPath(); ctx.moveTo(hx - hr * .45, hy - hr * .7); ctx.moveTo(hx - hr * .45, hy - hr * .7); ctx.lineTo(hx + hr * .45, hy - hr * .7); ctx.moveTo(hx - hr * .35, hy - hr * .9); ctx.moveTo(hx - hr * .35, hy - hr * .9); ctx.lineTo(hx + hr * .35, hy - hr * .9); ctx.stroke(); ctx.beginPath();
        times(5, i => {
          const dx = hx - hr * .36 + i * hr * .18; ctx.moveTo(dx, hy - hr * .85); ctx.moveTo(dx, hy - hr * .85); ctx.lineTo(dx + hr * .08, hy - hr * .75); ctx.lineTo(dx + hr * .16, hy - hr * .85);
        });
        ctx.stroke();
        // 房ひも
        ctx.strokeStyle = acc2; lnW(LW(.05, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .52, hy + hr * .32); ctx.lineTo(hx - hr * .55, hy + hr * .6); ctx.moveTo(hx + hr * .52, hy + hr * .32); ctx.lineTo(hx + hr * .55, hy + hr * .6); ctx.stroke(); FS(dk); ctx.beginPath(); ctx.arc(hx - hr * .55, hy + hr * .62, hr * .07, 0, 7); ctx.arc(hx + hr * .55, hy + hr * .62, hr * .07, 0, 7); ctx.fill();
        break;
      }
      case 'pith': {
        // 探検帽(コルク帽): 半球ドーム+水平の広つば+帯
        ctx.fillStyle = acc2;
        // ドーム
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .5, hr * .55, hr * .5, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 広い平つば
        ell(hx, hy - hr * .5, hr * .95, hr * .18);
        // つばの縁(やや下がり)
        SS(dk); lnW(LW(.04)); ells(hx, hy - hr * .5, hr * .95, hr * .18);
        // 帯
        ctx.fillStyle = dk; rect(hx - hr * .55, hy - hr * .62, hr * 1.1, hr * .14);
        // ドーム頂のボタン
        dot(hx, hy - hr * 1.0, hr * .06);
        break;
      }
      case 'kepi': {
        // ケピ帽: フランス軍帽 — 平らな円筒+水平の短いつば+額の帯
        // 前傾した円筒
        ctx.fillStyle = acc2; poly([hx - hr * .55,hy - hr * .45],[hx - hr * .45,hy - hr * 1.05],[hx + hr * .55,hy - hr * 1.05],[hx + hr * .62,hy - hr * .45]);
        // 平らな天辺
        ell(hx + hr * .05, hy - hr * 1.05, hr * .5, hr * .12);
        // 水平のつば
        ctx.fillStyle = dk; ell(hx, hy - hr * .4, hr * .68, hr * .11);
        // 額の帯+側面の筋
        rect(hx - hr * .58, hy - hr * .62, hr * 1.18, hr * .14); SS(dk); lnW(LW(.04)); ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy - hr * .5); ctx.moveTo(hx - hr * .5, hy - hr * .5); ctx.lineTo(hx - hr * .44, hy - hr * .95); ctx.moveTo(hx + hr * .58, hy - hr * .5); ctx.moveTo(hx + hr * .58, hy - hr * .5); ctx.lineTo(hx + hr * .52, hy - hr * .95); ctx.stroke();
        break;
      }
      case 'pamela': {
        // パメラ: 広々とした女優帽 — 波打つ大きなつば+リボン
        // 波型の大つば
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.moveTo(hx - hr * 1.3, hy - hr * .45);
        for (let i = 0; i <= 8; i++) {
          const px = hx - hr * 1.3 + i * hr * .325;
          ctx.quadraticCurveTo(
            px - hr * .16, hy - hr * (.45 + .1 * Math.sin(i * 2.4)),
            px, hy - hr * (.45 + .1 * Math.sin((i + 1) * 2.4)));
        }
        ctx.quadraticCurveTo(hx, hy - hr * .2, hx - hr * 1.3, hy - hr * .45); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 丸いクラウン
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .6, hr * .55, hr * .45, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // リボン帯
        ctx.fillStyle = dk; rect(hx - hr * .55, hy - hr * .62, hr * 1.1, hr * .12);
        // リボンの結び目(片側)
        poly([hx + hr * .5,hy - hr * .6],[hx + hr * .72,hy - hr * .72],[hx + hr * .72,hy - hr * .48]);
        break;
      }
      case 'vueltiao': {
        // ソンブレロ・ヴェルティアオ: コロンビアの編み帽 — 黒白の帯+広つば
        // 高いドーム
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .5, hr * .5, hr * .5, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 広いつば(わずかに上反り)
        ctx.beginPath(); ctx.moveTo(hx - hr, hy - hr * .52); ctx.quadraticCurveTo(hx, hy - hr * .7, hx + hr, hy - hr * .52); ctx.quadraticCurveTo(hx, hy - hr * .45, hx - hr, hy - hr * .52); ctx.closePath(); FS(acc2); ctx.fill();
        // 黒い編み帯(つばとドームの境)
        SS(dk); lnW(hr * .1); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .52); ctx.lineTo(hx + hr * .55, hy - hr * .52); ctx.stroke();
        // ジグザグ編み模様
        ctx.strokeStyle = dk; lnW(LW(.045)); ctx.beginPath();
        times(6, i => {
          const zx = hx - hr * .42 + i * hr * .15; ctx.moveTo(zx, hy - hr * .95); ctx.lineTo(zx + hr * .08, hy - hr * .7);
        });
        ctx.stroke();
        // つばの編み文様
        ctx.beginPath();
        times(8, i => {
          const zx = hx - hr * .85 + i * hr * .24; ctx.moveTo(zx, hy - hr * .55); ctx.lineTo(zx + hr * .12, hy - hr * .6);
        });
        ctx.stroke();
        break;
      }
      case 'capotain': {
        // カポテイン: 清教徒の高い平頂帽+バックルの帯
        ctx.fillStyle = acc2;
        // 高い台形クラウン
        poly([hx - hr * .5,hy - hr * .5],[hx - hr * .4,hy - hr * 1.35],[hx + hr * .4,hy - hr * 1.35],[hx + hr * .5,hy - hr * .5]);
        // 広いつば
        ctx.fillStyle = dk; ell(hx, hy - hr * .5, hr * .9, hr * .16);
        // 帯+バックル
        ctx.fillStyle = dk; rect(hx - hr * .47, hy - hr * .75, hr * .94, hr * .16); SS('#d0a030'); lnW(LW(.05, 1.2)); ctx.strokeRect(hx - hr * .09, hy - hr * .78, hr * .18, hr * .22);
        break;
      }
      case 'capirote': {
        // カピロテ: スペインの尖り頭巾 — 顔を覆う布+高い円錐+目の孔
        ctx.fillStyle = acc2;
        // 顔/肩を覆う布
        poly([hx - hr * .7,hy + hr * 1.1],[hx - hr * .75,hy - hr * .3,hx,hy - hr * .35],[hx + hr * .75,hy - hr * .3,hx + hr * .7,hy + hr * 1.1]);
        // 高い円錐
        poly([hx - hr * .45,hy - hr * .3],[hx,hy - hr * 1.9],[hx + hr * .45,hy - hr * .3]);
        // 円錐の縁
        ctx.strokeStyle = dk; lnW(LW(.05, 1.2)); ctx.beginPath(); ctx.moveTo(hx - hr * .45, hy - hr * .3); ctx.lineTo(hx, hy - hr * 1.9); ctx.lineTo(hx + hr * .45, hy - hr * .3); ctx.stroke();
        // 目の孔
        ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(hx - hr * .22, hy - hr * .05, hr * .09, hr * .12, 0, 0, 7); ctx.ellipse(hx + hr * .22, hy - hr * .05, hr * .09, hr * .12, 0, 0, 7); ctx.fill();
        break;
      }
      case 'doppa': {
        // ドッパ: ウズベクの四角い刺繍 skullcap — 台形の冠+縁の文様
        ctx.fillStyle = acc2;
        // やや四角い冠
        poly([hx - hr * .55,hy - hr * .15],[hx - hr * .48,hy - hr * .75],[hx,hy - hr * .85,hx + hr * .48,hy - hr * .75],[hx + hr * .55,hy - hr * .15],[hx,hy - hr * .02,hx - hr * .55,hy - hr * .15]);
        // 縁帯
        ctx.fillStyle = dk; ell(hx, hy - hr * .12, hr * .58, hr * .12);
        // 頂の十字文様
        ctx.strokeStyle = dk; lnW(LW(.06, 1.2)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .7); ctx.moveTo(hx, hy - hr * .7); ctx.lineTo(hx, hy - hr * .5); ctx.moveTo(hx - hr * .12, hy - hr * .6); ctx.moveTo(hx - hr * .12, hy - hr * .6); ctx.lineTo(hx + hr * .12, hy - hr * .6); ctx.stroke();
        // 四隅の点文様
        ctx.fillStyle = dk;
        for (const [ox, oy] of [[-.3, -.62], [.3, -.62], [-.35, -.35], [.35, -.35]]) {
          dot(hx + hr * ox, hy + hr * oy, hr * .045);
        }
        break;
      }
      case 'kalpak': {
        // カルパク: 中央アジアの高いフェルト帽 — 立ち上がる円筒+翻った縁
        ctx.fillStyle = acc2;
        // 高い冠
        poly([hx - hr * .5,hy - hr * .3],[hx - hr * .42,hy - hr * 1.25],[hx,hy - hr * 1.35,hx + hr * .42,hy - hr * 1.25],[hx + hr * .5,hy - hr * .3]);
        // 翻った縁帯
        ctx.fillStyle = dk; ell(hx, hy - hr * .32, hr * .62, hr * .16);
        // 冠の装飾縫い筋
        ctx.strokeStyle = dk; lnW(LW(.05, 1.2)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .5); ctx.moveTo(hx, hy - hr * .5); ctx.lineTo(hx, hy - hr * 1.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx - hr * .2, hy - hr * .48); ctx.moveTo(hx - hr * .2, hy - hr * .48); ctx.lineTo(hx - hr * .15, hy - hr * 1.18); ctx.moveTo(hx + hr * .2, hy - hr * .48); ctx.moveTo(hx + hr * .2, hy - hr * .48); ctx.lineTo(hx + hr * .15, hy - hr * 1.18); ctx.stroke();
        break;
      }
      case 'tagelmust': {
        // タゲルムスト: トゥアレグの藍色覆い — 頭を巻く布+顔の下半分を隠す
        ctx.fillStyle = acc2;
        // 頭の巻き布
        ell(hx, hy - hr * .35, hr * .72, hr * .62);
        // 目の横スリット(暗い帯の中に肌色の隙間)
        FS(dk); ell(hx, hy - hr * .05, hr * .6, hr * .38);
        // 目の開口
        ctx.fillStyle = '#e8c8a8'; ell(hx, hy - hr * .12, hr * .5, hr * .1);
        // 巻き筋
        ctx.strokeStyle = dk; lnW(LW(.05, 1.2)); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .4, hr * .72, hr * .5, 0, Math.PI * .9, Math.PI * 1.5); ctx.stroke();
        break;
      }
      case 'caubeen': {
        // コービーン: アイルランドの帽 — 片側に傾く緑のベレー+羽根飾り
        ctx.save(); ctx.translate(hx, hy - hr * .55); ctx.rotate(-.18); FS(acc2); ctx.beginPath(); ctx.ellipse(0, 0, hr * .72, hr * .42, 0, Math.PI, Math.PI * 2); ctx.lineTo(hr * .72, 0); ctx.quadraticCurveTo(0, hr * .18, -hr * .72, 0); ctx.closePath(); ctx.closePath(); ctx.fill(); // 左に傾ける
        // 中央の茎
        ctx.strokeStyle = dk; lnW(LW(.07, 1.5)); ctx.beginPath(); ctx.moveTo(0, -hr * .4); ctx.moveTo(0, -hr * .4); ctx.lineTo(0, -hr * .58); ctx.stroke(); ctx.restore();
        // 左側の羽根飾り
        ctx.fillStyle = dk; ell(hx - hr * .55, hy - hr * .75, hr * .09, hr * .38, .35);
        break;
      }
      case 'souwester': {
        // サウウェスター: 漁師の防水帽 — 冠+後ろに長く垂れるつば
        ctx.fillStyle = acc2;
        // 冠(わずかに傾いた円筒)
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .55, hr * .6, hr * .5, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 前のつば
        ell(hx + hr * .25, hy - hr * .25, hr * .85, hr * .18, -.08);
        // 後ろの長い垂れ(首を覆う)
        poly([hx - hr * .6,hy - hr * .3],[hx - hr * .95,hy + hr * .3,hx - hr * .5,hy + hr * .8],[hx - hr * .15,hy + hr * .7],[hx - hr * .5,hy + hr * .25,hx - hr * .25,hy - hr * .28]);
        // 縁
        ctx.strokeStyle = dk; lnW(LW(.06, 1.2)); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .55, hr * .6, hr * .5, 0, Math.PI * .05, Math.PI * .95); ctx.stroke();
        break;
      }
      case 'petasos': {
        // ペタソス: 古代ギリシャの旅人帽 — 広いつば+低い円錐冠+顎紐
        ctx.fillStyle = acc2;
        // 広つば
        ell(hx, hy - hr * .3, hr * 1.15, hr * .25);
        // 低い円錐冠
        poly([hx - hr * .5,hy - hr * .32],[hx,hy - hr * 1.1],[hx + hr * .5,hy - hr * .32]);
        // 縁
        ctx.strokeStyle = dk; lnW(LW(.08, 1.5)); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .3, hr * 1.15, hr * .25, 0, Math.PI * .05, Math.PI * .95); ctx.stroke();
        // 顎紐
        ctx.strokeStyle = dk; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy - hr * .3); ctx.quadraticCurveTo(hx, hy + hr * 1.0, hx + hr * .5, hy - hr * .3); ctx.stroke();
        break;
      }
      case 'busby': {
        // バスビー帽: 高い毛皮の円柱帽(近衛兵)+側面の羽根飾り
        // 本体: 頭より高い円柱
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .7, hr * .55, hr * .95, 0, Math.PI, Math.PI * 2); ctx.lineTo(hx + hr * .55, hy - hr * .2); ctx.quadraticCurveTo(hx, hy, hx - hr * .55, hy - hr * .2); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 裾の縁
        ctx.strokeStyle = dk; lnW(LW(.08, 1.5)); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .2, hr * .55, hr * .1, 0, Math.PI * .05, Math.PI * .95); ctx.stroke();
        // 右側の羽根飾り
        ctx.fillStyle = dk; ell(hx + hr * .62, hy - hr * .6, hr * .12, hr * .4, -.15);
        break;
      }
      case 'fontange': {
        // フォンタンジュ: 針金で立たせた高いレースの頭飾り(17世紀末フランス)
        // 後ろの立ちレース2段
        ctx.fillStyle = 'rgba(245,240,230,0.85)';
        for (const [ox, oy, s] of [[0, -1.6, 1], [0, -1.3, .8]]) {
          ctx.beginPath(); ctx.ellipse(hx + ox, hy + hr * oy, hr * .55 * s, hr * .4 * s, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.closePath(); ctx.fill();
        }
        // 前立てのドーム
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .6, hr * .7, hr * .45, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.closePath(); ctx.fill();
        // レースの縁飾り(点線)
        SS(dk); lnW(LW(.035));
        ([1, .8]).forEach(s => {
          ctx.beginPath(); ctx.ellipse(hx, hy - hr * (s === 1 ? 1.6 : 1.3), hr * .55 * s, hr * .4 * s, 0, Math.PI, Math.PI * 2); ctx.stroke();
        });
        // 前面のリボン
        ctx.fillStyle = acc2; poly([hx,hy - hr * 1.15],[hx - hr * .15,hy - hr * 1.0],[hx,hy - hr * .85],[hx + hr * .15,hy - hr * 1.0]);
        break;
      }
      case 'barbette': {
        // バルベット: 顎を包む白い帯+頭頂の輪(中世の婦人装身具)
        // 顎の帯
        ctx.fillStyle = '#f0ece0'; poly([hx - hr * .62,hy - hr * .3],[hx - hr * .65,hy + hr * .6,hx,hy + hr * .75],[hx + hr * .65,hy + hr * .6,hx + hr * .62,hy - hr * .3],[hx + hr * .5,hy - hr * .28],[hx + hr * .52,hy + hr * .5,hx,hy + hr * .62],[hx - hr * .52,hy + hr * .5,hx - hr * .5,hy - hr * .28]);
        // 頭頂の輪(フィレット)
        SS(acc2); lnW(LW(.14, 2)); ells(hx, hy - hr * .62, hr * .7, hr * .25);
        // 輪の飾り石
        ctx.fillStyle = dk; dot(hx,hy - hr * .85,hr * .06);
        break;
      }
      case 'attifet': {
        // アティフェ: ハート型にへこむ前立ての頭飾り(未亡人帽)
        FS(acc2); poly([hx - hr * .6,hy - hr * .3],[hx - hr * .7,hy - hr * 1.3,hx - hr * .3,hy - hr * 1.45],[hx,hy - hr * 1.0,hx + hr * .3,hy - hr * 1.45],[hx + hr * .7,hy - hr * 1.3,hx + hr * .6,hy - hr * .3],[hx,hy - hr * .55,hx - hr * .6,hy - hr * .3]); // 左の峰 // 中央の谷(ハート型) // 右の峰
        // 縁の飾り筋
        ctx.strokeStyle = dk; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .38); ctx.quadraticCurveTo(hx, hy - hr * .62, hx + hr * .55, hy - hr * .38); ctx.stroke();
        // 谷の頂に小さな宝玉
        ctx.fillStyle = '#e8d8a0'; dot(hx,hy - hr * 1.05,hr * .06);
        break;
      }
      case 'kettle': {
        // ケトル帽(シャペル・ド・フェ): 広い平つば+低い鉄のドーム
        // つば
        ctx.fillStyle = dk; ell(hx, hy - hr * .5, hr * 1.15, hr * .28);
        // ドーム
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .55, hr * .68, hr * .6, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.closePath(); ctx.fill();
        // ドームの頂の小突起
        ctx.fillStyle = dk; rect(hx - hr * .03, hy - hr * 1.18, hr * .06, hr * .1);
        // つばの縁
        ctx.strokeStyle = dk; lnW(LW(.05, 1.2)); ells(hx, hy - hr * .5, hr * 1.15, hr * .28);
        break;
      }
      case 'chaperon': {
        // シャプロン: 頭を覆うフード+長いリリパイプ(垂れ紐)
        // 顔の開口は evenodd で抜く
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .4, hr * .85, hr * .95, 0, Math.PI, Math.PI * 2); ctx.quadraticCurveTo(hx + hr * .7, hy + hr * .3, hx + hr * .4, hy + hr * .5); ctx.quadraticCurveTo(hx, hy + hr * .35, hx - hr * .4, hy + hr * .5); ctx.quadraticCurveTo(hx - hr * .7, hy + hr * .3, hx - hr * .85, hy - hr * .4); ctx.closePath(); ctx.ellipse(hx, hy + hr * .1, hr * .58, hr * .5, 0, 0, 7); ctx.fill('evenodd');
        // リリパイプ(肩に垂れる長い紐)
        SS(acc2); lnW(LW(.12, 2)); ctx.beginPath(); ctx.moveTo(hx + hr * .55, hy - hr * .1); ctx.quadraticCurveTo(hx + hr * .85, hy + hr * .6, hx + hr * .6, hy + hr * 1.3); ctx.stroke();
        break;
      }
      case 'hennin': {
        // エナン: 高い円錐の尖塔帽+後ろに垂れるベール(中世貴婦人)
        // ベール(先に描いて後ろに見せる)
        FS('rgba(240,240,255,0.45)'); poly([hx,hy - hr * 1.7],[hx + hr * 1.1,hy - hr * .8,hx + hr * .9,hy + hr * .9],[hx + hr * .3,hy + hr * .5,hx,hy - hr * 1.7]);
        // 円錐
        ctx.fillStyle = acc2; poly([hx - hr * .5,hy - hr * .55],[hx,hy - hr * 1.95],[hx + hr * .5,hy - hr * .55]);
        // 縁の帯
        ctx.strokeStyle = dk; lnW(LW(.09, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .51, hy - hr * .56); ctx.lineTo(hx + hr * .51, hy - hr * .56); ctx.stroke();
        // 先端の飾り
        ctx.fillStyle = '#e8d8a0'; dot(hx,hy - hr * 1.95,hr * .06);
        break;
      }
      case 'kokoshnik': {
        // ココーシニク: 扇形に広がる高い頭飾り(ロシア)
        FS(acc2); poly([hx - hr * .75,hy - hr * .5],[hx - hr * .9,hy - hr * 1.9,hx,hy - hr * 2.0],[hx + hr * .9,hy - hr * 1.9,hx + hr * .75,hy - hr * .5],[hx,hy - hr * .95,hx - hr * .75,hy - hr * .5]);
        // 縁の装飾線
        ctx.strokeStyle = dk; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx - hr * .68, hy - hr * .62); ctx.quadraticCurveTo(hx, hy - hr * .98, hx + hr * .68, hy - hr * .62); ctx.stroke();
        // 珠の列
        ctx.fillStyle = '#e8d8a0';
        for (let i = -3; i <= 3; i++) {
          const bx = hx + i * hr * .2; const by = hy - hr * (1.55 - Math.abs(i) * .18); dot(bx,by,hr * .045);
        }
        break;
      }
      case 'biretta': {
        // ビレッタ帽: 四角い天辺+3つの稜線+頂の房(聖職者帽)
        FS(acc2); poly([hx - hr * .55,hy - hr * .55],[hx - hr * .45,hy - hr * 1.05],[hx + hr * .45,hy - hr * 1.05],[hx + hr * .55,hy - hr * .55]); // 縁 // 左上 // 右上
        // 3つの稜線(立体的な峰)
        SS(dk); lnW(LW(.045));
        for (let i = -1; i <= 1; i++) {
          const rx = hx + i * hr * .35; ctx.beginPath(); ctx.moveTo(rx, hy - hr * 1.05); ctx.lineTo(rx + i * hr * .08, hy - hr * 1.3); ctx.stroke();
        }
        // 頂の房
        ctx.fillStyle = dk; dot(hx,hy - hr * 1.34,hr * .07);
        // 縁の帯
        ctx.strokeStyle = acc2; lnW(LW(.1, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .56, hy - hr * .58); ctx.lineTo(hx + hr * .56, hy - hr * .58); ctx.stroke();
        break;
      }
      case 'calot': {
        // カロット帽(船形帽): 片側に傾けた兵隊の室内帽
        ctx.save(); ctx.translate(hx, hy - hr * .85); ctx.rotate(-.28); FS(acc2); ell(0, 0, hr * .78, hr * .32); // 右に傾ける
        // 折り返しの縁
        ctx.strokeStyle = dk; lnW(LW(.07, 1.2)); ctx.beginPath(); ctx.ellipse(0, 0, hr * .78, hr * .32, 0, Math.PI * .05, Math.PI * .95); ctx.stroke(); ctx.restore();
        break;
      }
      case 'phrygian': {
        // フリジア帽: 前方に垂れる柔らかい円錐+帯(自由の帽)
        FS(acc2); poly([hx - hr * .7,hy - hr * .55],[hx - hr * .55,hy - hr * 1.6,hx + hr * .2,hy - hr * 1.7],[hx + hr * .9,hy - hr * 1.75,hx + hr * .95,hy - hr * 1.15],[hx + hr * .7,hy - hr * 1.35,hx + hr * .4,hy - hr * 1.15],[hx + hr * .75,hy - hr * .95,hx + hr * .7,hy - hr * .55]); // 先端が前に垂れる
        // 帯
        ctx.strokeStyle = dk; lnW(LW(.09, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .71, hy - hr * .6); ctx.lineTo(hx + hr * .71, hy - hr * .6); ctx.stroke();
        // 帽章(小さな円)
        FS('#e8c860'); dot(hx + hr * .3,hy - hr * .85,hr * .08);
        break;
      }
      case 'snood': {
        // スヌード: 後頭部を包む網袋+頭の帯
        // 網袋(後頭部の膨らみ)
        FS(acc2); ell(hx + hr * .5, hy - hr * .35, hr * .5, hr * .55, -.5);
        // 網目(十字筋)
        SS('rgba(255,255,255,0.4)'); lnW(1);
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx + hr * .5 + i * hr * .2, hy - hr * .9); ctx.lineTo(hx + hr * .5 + i * hr * .2, hy + hr * .1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .35 + i * hr * .18); ctx.lineTo(hx + hr, hy - hr * .35 + i * hr * .18); ctx.stroke();
        }
        // 頭の帯
        ctx.strokeStyle = acc2; lnW(LW(.1, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .9, hy - hr * .45); ctx.quadraticCurveTo(hx, hy - hr * 1.15, hx + hr * .9, hy - hr * .45); ctx.stroke();
        break;
      }
      case 'mitre': {
        // 司教冠: 高い双頭の冠+帯+垂れるリボン(ラペット)
        FS(acc2); poly([hx - hr * .55,hy - hr * .55],[hx - hr * .55,hy - hr * 1.1],[hx - hr * .5,hy - hr * 1.75,hx,hy - hr * 1.85],[hx + hr * .5,hy - hr * 1.75,hx + hr * .55,hy - hr * 1.1],[hx + hr * .55,hy - hr * .55]);
        // 冠の割れ目
        ctx.strokeStyle = dk; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.82); ctx.lineTo(hx, hy - hr * 1.1); ctx.stroke();
        // 帯
        ctx.strokeStyle = dk; lnW(LW(.1, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .62); ctx.lineTo(hx + hr * .55, hy - hr * .62); ctx.stroke();
        // 帯の宝石
        ctx.fillStyle = '#e8c860'; dot(hx,hy - hr * .62,hr * .07);
        // ラペット(後ろに垂れる2本)
        SS(acc2); lnW(LW(.09, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .2, hy - hr * 1.6); ctx.quadraticCurveTo(hx - hr * .35, hy - hr * .4, hx - hr * .3, hy + hr * .2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx + hr * .2, hy - hr * 1.6); ctx.quadraticCurveTo(hx + hr * .35, hy - hr * .4, hx + hr * .3, hy + hr * .2); ctx.stroke();
        break;
      }
      case 'cowboy': {
        // カウボーイハット: 中央をへこませた冠+両端が跳ね上がる広つば+帯
        // つば(両端カール)
        FS(acc2); poly([hx - hr * 1.45,hy - hr * .55],[hx - hr * .7,hy - hr * .95,hx,hy - hr * .9],[hx + hr * .7,hy - hr * .95,hx + hr * 1.45,hy - hr * .55],[hx + hr * .9,hy - hr * .65,hx,hy - hr * .6],[hx - hr * .9,hy - hr * .65,hx - hr * 1.45,hy - hr * .55]);
        // 冠(中央のへこみ)
        poly([hx - hr * .55,hy - hr * .75],[hx - hr * .45,hy - hr * 1.5,hx,hy - hr * 1.5],[hx + hr * .45,hy - hr * 1.5,hx + hr * .55,hy - hr * .75]); SS(dk); lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx - hr * .15, hy - hr * 1.5); ctx.quadraticCurveTo(hx, hy - hr * 1.6, hx + hr * .15, hy - hr * 1.5); ctx.stroke(); // へこみ筋
        // 帯
        ctx.strokeStyle = dk; lnW(LW(.09, 1.5)); ctx.beginPath(); ctx.moveTo(hx - hr * .56, hy - hr * .82); ctx.lineTo(hx + hr * .56, hy - hr * .82); ctx.stroke();
        break;
      }
      case 'eboshi': {
        // 烏帽子: 高い冠+後ろに突き出た尾+結び紐
        ctx.fillStyle = '#181a20';
        // 冠本体(前高く後ろ低い)
        poly([hx - hr * .55,hy - hr * .6],[hx - hr * .4,hy - hr * 1.85,hx + hr * .15,hy - hr * 1.8],[hx + hr * .55,hy - hr * 1.6,hx + hr * .6,hy - hr * .9]);
        // 尾(後ろへ水平に突き出す)
        poly([hx + hr * .5,hy - hr * 1.6],[hx + hr * 1.5,hy - hr * 1.55,hx + hr * 1.7,hy - hr * 1.2],[hx + hr * 1.2,hy - hr * 1.25,hx + hr * .58,hy - hr * 1.05]);
        // 顎紐
        ctx.strokeStyle = '#181a20'; lnW(LW(.04)); ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy - hr * .55); ctx.quadraticCurveTo(hx, hy + hr * .9, hx + hr * .5, hy - hr * .55); ctx.stroke();
        break;
      }
      case 'topknot': {
        // ちょんまげ: 黒い髪+頭頂の髷+剃り跡の青味
        // 髪(側頭部)
        FS('#22252a'); poly([hx - hr * .9,hy - hr * .3],[hx - hr * .95,hy - hr * 1.4,hx,hy - hr * 1.45],[hx + hr * .95,hy - hr * 1.4,hx + hr * .9,hy - hr * .3],[hx + hr * .75,hy - hr * .3],[hx + hr * .8,hy - hr * 1.15,hx,hy - hr * 1.2],[hx - hr * .8,hy - hr * 1.15,hx - hr * .75,hy - hr * .3]);
        // 月代(剃り跡の青い部分)
        FS('rgba(120,140,160,0.35)'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.05, hr * .5, hr * .28, 0, Math.PI, Math.PI * 2); ctx.fill();
        // 髷(前方に折れた結び)
        FS('#22252a'); ell(hx, hy - hr * 1.55, hr * .34, hr * .13, -.35); ell(hx + hr * .1, hy - hr * 1.62, hr * .2, hr * .08, -.5);
        break;
      }
      case 'kippah': {
        // キッパ: 頭頂に乗る小さな半円帽+縁取り
        ctx.fillStyle = acc2; poly([hx - hr * .55,hy - hr * .72],[hx,hy - hr * 1.45,hx + hr * .55,hy - hr * .72]); SS(dk); lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .72); ctx.quadraticCurveTo(hx, hy - hr * 1.45, hx + hr * .55, hy - hr * .72); ctx.stroke();
        // 縁の帯
        ctx.strokeStyle = dk; lnW(LW(.07)); ctx.beginPath(); ctx.moveTo(hx - hr * .56, hy - hr * .73); ctx.lineTo(hx + hr * .56, hy - hr * .73); ctx.stroke();
        break;
      }
      case 'coif': {
        // コイフ: 頭をすっぽり覆う頭巾+顎下の結び紐
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.moveTo(hx - hr * .95, hy - hr * .2); ctx.quadraticCurveTo(hx - hr, hy - hr * 1.5, hx, hy - hr * 1.5); ctx.quadraticCurveTo(hx + hr, hy - hr * 1.5, hx + hr * .95, hy - hr * .2); ctx.lineTo(hx + hr * .9, hy + hr * .9); ctx.quadraticCurveTo(hx + hr * .45, hy + hr * .55, hx, hy + hr * .6); ctx.quadraticCurveTo(hx - hr * .45, hy + hr * .55, hx - hr * .9, hy + hr * .9); ctx.closePath(); // 側面を垂らす
        // 顔の開口部(偶奇規則で抜く)
        ctx.ellipse(hx, hy + hr * .15, hr * .62, hr * .68, 0, 0, 7); ctx.fill('evenodd');
        // 顎下の結び紐
        ctx.strokeStyle = acc2; lnW(LW(.06)); ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy + hr * .8); ctx.quadraticCurveTo(hx, hy + hr * 1.05, hx + hr * .55, hy + hr * .8); ctx.stroke();
        break;
      }
      case 'mantilla': {
        // マンティリャ: 高い櫛+レースのベール(額の毛飾り)
        FS(acc2);
        // 櫛(扇形の骨組み)
        ctx.beginPath();
        for (let i = -3; i <= 3; i++) {
          ctx.moveTo(hx + i * hr * .16, hy - hr * .9); ctx.lineTo(hx + i * hr * .28, hy - hr * 1.55);
        }
        SS(acc2); lnW(LW(.05)); ctx.stroke();
        // 櫛の上縁アーチ
        ctx.beginPath(); ctx.moveTo(hx - hr * .9, hy - hr * 1.5); ctx.quadraticCurveTo(hx, hy - hr * 2, hx + hr * .9, hy - hr * 1.5); ctx.stroke();
        // レースのベール(顔の後ろに垂れる)
        FS('rgba(255,255,255,0.28)'); poly([hx - hr * .85,hy - hr * 1.45],[hx - hr * 1.5,hy + hr * .9,hx - hr * .8,hy + hr * 1.7],[hx + hr * .8,hy + hr * 1.7],[hx + hr * 1.5,hy + hr * .9,hx + hr * .85,hy - hr * 1.45]);
        // 額の花飾り
        ctx.fillStyle = acc2; dot(hx,hy - hr * .85,hr * .12);
        break;
      }
      case 'kasa': {
        // 菅笠: 円錐の編み笠+顎紐
        ctx.fillStyle = acc2; poly([hx - hr * 1.15,hy - hr * .55],[hx,hy - hr * 1.6],[hx + hr * 1.15,hy - hr * .55]);
        // 放射状の編み筋
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; lnW(LW(.035));
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.6); ctx.lineTo(hx + i * hr * .28, hy - hr * .55); ctx.stroke();
        }
        // 同心の輪筋
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath(); ctx.ellipse(hx, hy - hr * (1.6 - i * .3), hr * .95 * i / 3.5, hr * .08, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        }
        // 顎紐
        ctx.strokeStyle = dk; lnW(LW(.05)); ctx.beginPath(); ctx.moveTo(hx - hr * .6, hy - hr * .5); ctx.quadraticCurveTo(hx, hy + hr * 1.1, hx + hr * .6, hy - hr * .5); ctx.stroke();
        break;
      }
      case 'crown2': {
        // 後冠(王妃冠): 帯+後ろへ聳えるアーチの輪+宝石
        ctx.fillStyle = acc2;
        // 帯(額に沿う)
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .78, hr * .68, hr * .16, 0, Math.PI, 0); ctx.ellipse(hx, hy - hr * .78, hr * .68, hr * .16, 0, Math.PI, 0); ctx.fill();
        // 2本のアーチ(頭の後ろで交差)
        SS(acc2); lnW(LW(.09, 2)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - hr * .55, hy - hr * .75); ctx.quadraticCurveTo(hx - hr * .3, hy - hr * 1.8, hx, hy - hr * 1.85); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx + hr * .55, hy - hr * .75); ctx.quadraticCurveTo(hx + hr * .3, hy - hr * 1.8, hx, hy - hr * 1.85); ctx.stroke();
        // 頂の玉+帯の宝石
        ctx.fillStyle = '#d8c050'; dot(hx,hy - hr * 1.85,hr * .1); FS('#c04060'); dot(hx,hy - hr * .78,hr * .09);
        break;
      }
      case 'beanie': {
        // ビーニー: 頭にフィットするニット帽+折り返し+房
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .75, hr * .72, hr * .55, 0, Math.PI, 0); ctx.ellipse(hx, hy - hr * .75, hr * .72, hr * .55, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .75, hr * .72, hr * .12, 0, 0, 7); ctx.ellipse(hx, hy - hr * .75, hr * .72, hr * .12, 0, 0, 7); ctx.fill(); // ドーム // 底辺ふくらみ
        // 折り返し(帯)
        FS('rgba(0,0,0,0.2)'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .74, hr * .16, 0, 0, 7); ctx.ellipse(hx, hy - hr * .62, hr * .74, hr * .16, 0, 0, 7); ctx.fill();
        // 編み目の縦筋
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; lnW(LW(.03));
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .18, hy - hr * 1.25); ctx.quadraticCurveTo(hx + i * hr * .2, hy - hr * .95, hx + i * hr * .2, hy - hr * .68); ctx.stroke();
        }
        // 頂の房
        ctx.fillStyle = dk; dot(hx,hy - hr * 1.32,hr * .13);
        break;
      }
      case 'mortar': {
        // 角帽(卒業帽): 頭の冠+平らな四角い板+垂れる房
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .7, hr * .6, hr * .35, 0, 0, 7); ctx.ellipse(hx, hy - hr * .7, hr * .6, hr * .35, 0, 0, 7); ctx.fill(); // 頭の冠
        // 四角い板(斜めに置いた正方形)
        poly([hx,hy - hr * 1.55],[hx + hr * 1.05,hy - hr * 1.05],[hx,hy - hr * .55],[hx - hr * 1.05,hy - hr * 1.05]);
        // 房(右上から垂れる)
        SS('#d8b040'); lnW(LW(.06, 1.5)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + hr * .5, hy - hr * 1.05); ctx.quadraticCurveTo(hx + hr * .85, hy - hr * .5, hx + hr * .8, hy - hr * .1); ctx.stroke(); FS('#d8b040'); dot(hx + hr * .8,hy - hr * .05,hr * .1);
        break;
      }
      case 'bicorne': {
        // 二角帽: 左右に広がる角+中央の結び房(ナポレオン帽)
        FS(acc2); ctx.save(); ctx.translate(hx, hy - hr * .9);
        // 左右の角(湾曲した大きな2峰)
        poly([-hr * 1.15,-hr * .1],[-hr * .9,-hr * .75,0,-hr * .45],[hr * .9,-hr * .75,hr * 1.15,-hr * .1],[hr * .6,hr * .2,0,hr * .1],[-hr * .6,hr * .2,-hr * 1.15,-hr * .1]);
        // 中央の帽章リボン
        ctx.fillStyle = '#d85040'; dot(0,-hr * .15,hr * .12); ctx.restore();
        break;
      }
      case 'pickelhaube': {
        // ピッケルハウベ: 革の兜+頭頂の槍スパイク+前板
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .75, hr * .78, hr * .5, 0, Math.PI, 0); ctx.ellipse(hx, hy - hr * .75, hr * .78, hr * .5, 0, Math.PI, 0); ctx.fill(); // ドーム
        // 前後のつば(下向き三角形)
        poly([hx - hr * .78,hy - hr * .68],[hx - hr * .1,hy - hr * .55],[hx - hr * .78,hy - hr * .4]); poly([hx + hr * .78,hy - hr * .68],[hx + hr * .1,hy - hr * .55],[hx + hr * .78,hy - hr * .4]);
        // スパイクの台座+尖り
        ctx.fillStyle = '#c8a840'; ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.22, hr * .14, hr * .06, 0, 0, 7); ctx.ellipse(hx, hy - hr * 1.22, hr * .14, hr * .06, 0, 0, 7); ctx.fill(); poly([hx - hr * .09,hy - hr * 1.22],[hx,hy - hr * 1.72],[hx + hr * .09,hy - hr * 1.22]);
        break;
      }
      case 'shako': {
        // シャコー帽: 高い円筒+前つば+帽章
        ctx.fillStyle = acc2;
        // 円筒(前へ少し広がる)
        poly([hx - hr * .6,hy - hr * .5],[hx - hr * .72,hy - hr * 1.75],[hx + hr * .72,hy - hr * 1.75],[hx + hr * .6,hy - hr * .5]);
        // 前つば(下へ反った半楕円)
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .5, hr * .62, hr * .18, 0, 0, Math.PI); ctx.ellipse(hx, hy - hr * .5, hr * .62, hr * .18, 0, 0, Math.PI); ctx.fill();
        // 帯
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; rect(hx - hr * .66, hy - hr * .72, hr * 1.32, hr * .14);
        // 帽章(前面中央の円)
        FS('#d8c060'); dot(hx,hy - hr * 1.15,hr * .16); FS('rgba(0,0,0,0.25)'); dot(hx,hy - hr * 1.15,hr * .07);
        break;
      }
      case 'tam': {
        // タム帽(タム・オー・シャンター): ぺったり丸い帽+房
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .85, hr * .95, hr * .38, .06, 0, 7); ctx.ellipse(hx, hy - hr * .85, hr * .95, hr * .38, .06, 0, 7); ctx.fill(); // ぺったり円盤
        // 縁の帯
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .7, hr * .9, hr * .12, .06, 0, Math.PI); ctx.ellipse(hx, hy - hr * .7, hr * .9, hr * .12, .06, 0, Math.PI); ctx.fill();
        // 中央の房
        ctx.fillStyle = dk; dot(hx,hy - hr * 1.25,hr * .12); SS(dk); lnW(LW(.04)); ctx.lineCap = 'round';
        times(5, i => {
          const a = i * 1.256; ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.25); ctx.lineTo(hx + Math.cos(a) * hr * .18, hy - hr * 1.25 + Math.sin(a) * hr * .18); ctx.stroke();
        });
        break;
      }
      case 'sailor': {
        // 水兵帽: 白い浅い冠+黒い帯+短いリボン
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .9, hr * .72, hr * .42, 0, 0, 7); ctx.ellipse(hx, hy - hr * .9, hr * .72, hr * .42, 0, 0, 7); ctx.fill(); FS('rgba(30,40,60,0.85)'); rect(hx - hr * .72, hy - hr * .95, hr * 1.44, hr * .18); // 白い冠 // 黒帯
        // 短いリボン(後ろへ)
        poly([hx - hr * .2,hy - hr * .82],[hx - hr * .05,hy - hr * .5],[hx + hr * .08,hy - hr * .8]);
        break;
      }
      case 'porkpie': {
        // ポークパイ: 平天の低いクラウン+狭いつば+帯
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .52, hr * .95, hr * .14, 0, 0, 7); ctx.ellipse(hx, hy - hr * .52, hr * .95, hr * .14, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .88, hr * .58, hr * .5, 0, 0, 7); ctx.ellipse(hx, hy - hr * .88, hr * .58, hr * .5, 0, 0, 7); ctx.fill(); FS('rgba(0,0,0,0.28)'); rect(hx - hr * .58, hy - hr * .78, hr * 1.16, hr * .14); FS(acc2); ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.36, hr * .56, hr * .1, 0, 0, 7); ctx.ellipse(hx, hy - hr * 1.36, hr * .56, hr * .1, 0, 0, 7); ctx.fill(); // 狭つば // 低いクラウン // 帯 // 平天
        break;
      }
      case 'keffiyeh': {
        // クーフィーヤ: 頭を覆う布+黒いアガール(輪)
        FS('#f0ece0'); poly([hx - hr * .85,hy - hr * .4],[hx,hy - hr * 1.5,hx + hr * .85,hy - hr * .4],[hx + hr * .9,hy + hr * .5],[hx + hr * .6,hy + hr * .45],[hx + hr * .7,hy - hr * .3,hx,hy - hr * .25],[hx - hr * .7,hy - hr * .3,hx - hr * .6,hy + hr * .45],[hx - hr * .9,hy + hr * .5]); // 右裾が垂れる
        // 格子筋(薄いチェック)
        SS('rgba(160,60,60,0.5)'); lnW(1.5);
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(hx + i * hr * .3, hy - hr * 1.1); ctx.lineTo(hx + i * hr * .3, hy - hr * .3); ctx.stroke();
        }
        // アガール(2重の黒い輪)
        SS('#2a2a2e'); lnW(LW(.07, 2)); ctx.beginPath(); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .72, hr * .68, hr * .22, 0, Math.PI, 0); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .72, hr * .68, hr * .22, 0, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .7, hr * .22, 0, Math.PI, 0); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .7, hr * .22, 0, Math.PI, 0); ctx.stroke();
        break;
      }
      case 'sunvisor': {
        // サンバイザー: 頭の帯+前の透明つば
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .6, hr * .72, hr * .3, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(hx + hr * .6, hy - hr * .55); ctx.lineTo(hx - hr * .6, hy - hr * .55); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 透明つば(前に張り出し、半透明)
        FS(acc2.replace(/,[\d.]+\)$/, ',0.4)'));
        poly([hx - hr * .75,hy - hr * .6],[hx,hy - hr * .95,hx + hr * .95,hy - hr * .55],[hx + hr * .8,hy - hr * .4,hx,hy - hr * .5],[hx - hr * .6,hy - hr * .45,hx - hr * .75,hy - hr * .6]);
        break;
      }
      case 'mobcap': {
        // フリル帽: 頭頂のフリル縁+ふっくら冠+リボン
        ctx.fillStyle = '#f0ece2';
        // ふっくら冠
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .68, hr * .62, hr * .4, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // フリル縁(連なる半円)
        times(9, i => {
          const fa = Math.PI + (i / 8) * Math.PI; const fx = hx + Math.cos(fa) * hr * .68; const fy = hy - hr * .68 + Math.sin(fa) * hr * .42; dot(fx,fy,hr * .11);
        });
        // 後ろのリボン
        ctx.strokeStyle = acc2; lnW(LW(.06, 2)); ctx.beginPath(); ctx.moveTo(hx - hr * .5, hy - hr * .5); ctx.quadraticCurveTo(hx - hr * .8, hy - hr * .2, hx - hr * .7, hy + hr * .2); ctx.stroke();
        break;
      }
      case 'bonnet': {
        // ボンネット: 深い日除けつば+頭頂の膨らみ+顎下リボン
        ctx.fillStyle = acc2;
        // 頭頂の膨らみ
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .7, hr * .6, hr * .42, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 深い日除けつば(前に大きく張り出す)
        ctx.beginPath(); ctx.ellipse(hx + hr * .15, hy - hr * .55, hr * 1.05, hr * .4, -.15, Math.PI * .95, Math.PI * 1.95); ctx.lineTo(hx - hr * .55, hy - hr * .45); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 顎下のリボン
        ctx.strokeStyle = acc2; lnW(LW(.06, 2)); ctx.beginPath(); ctx.moveTo(hx - hr * .6, hy - hr * .4); ctx.quadraticCurveTo(hx, hy + hr * .6, hx + hr * .6, hy - hr * .4); ctx.stroke();
        // リボン結び目
        ctx.fillStyle = dk; dot(hx,hy + hr * .55,hr * .09);
        break;
      }
      case 'deerstalker': {
        // 鹿撃ち帽(シャーロック帽): 前後のつば+頭頂の結び目
        ctx.fillStyle = '#8a7a5a';
        // ドーム
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .65, hr * .72, hr * .42, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 前後のつば
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .55, hy - hr * .52, hr * .35, hr * .12, s * .3);
        });
        // 頭頂の結び目
        ctx.fillStyle = '#6a5a42'; ell(hx, hy - hr * 1.02, hr * .16, hr * .09); dot(hx,hy - hr * .98,hr * .06);
        // 側面の耳当て筋
        ctx.strokeStyle = '#6a5a42'; lnW(2); ctx.beginPath(); ctx.beginPath(); ctx.moveTo(hx - hr * .7, hy - hr * .55); ctx.beginPath(); ctx.moveTo(hx - hr * .7, hy - hr * .55); ctx.lineTo(hx - hr * .55, hy - hr * .75); ctx.beginPath(); ctx.moveTo(hx - hr * .7, hy - hr * .55); ctx.lineTo(hx - hr * .55, hy - hr * .75); ctx.stroke(); ctx.beginPath(); ctx.beginPath(); ctx.moveTo(hx + hr * .7, hy - hr * .55); ctx.beginPath(); ctx.moveTo(hx + hr * .7, hy - hr * .55); ctx.lineTo(hx + hr * .55, hy - hr * .75); ctx.beginPath(); ctx.moveTo(hx + hr * .7, hy - hr * .55); ctx.lineTo(hx + hr * .55, hy - hr * .75); ctx.stroke();
        break;
      }
      case 'boater': {
        // カンカン帽: 平らな天辺+平らなつば+リボン帯
        ctx.fillStyle = '#d8bc78';
        // つば(平らな楕円)
        ell(hx, hy - hr * .62, hr * 1.15, hr * .18);
        // 冠(円筒+平らな頂)
        rect(hx - hr * .6, hy - hr * .95, hr * 1.2, hr * .35); ell(hx, hy - hr * .95, hr * .6, hr * .1);
        // リボン帯
        ctx.fillStyle = acc2; rect(hx - hr * .6, hy - hr * .72, hr * 1.2, hr * .12);
        break;
      }
      case 'cloche': {
        // クロッシェ帽: 深く被る鐘形+リボン帯+小さな飾り
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .55, hr * .78, hr * .55, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // すその折り返し
        ctx.fillStyle = acc2; ell(hx, hy - hr * .5, hr * .82, hr * .12);
        // リボン帯
        ctx.fillStyle = dk; rect(hx - hr * .8, hy - hr * .62, hr * 1.6, hr * .1);
        // 側面の飾り(小さな花)
        FS('#e8d058'); dot(hx + hr * .55,hy - hr * .55,hr * .07);
        break;
      }
      case 'veil': {
        // ベール: 頭頂の小さな冠+両側に垂れる透ける布
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .88, hr * .4, hr * .18, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 布(半透明、左右に垂れる)
        FS(acc2.replace(/,[\d.]+\)$/, ',0.35)'));
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .1,hy - hr * .8],[hx + s * hr * .95,hy - hr * .3,hx + s * hr * .75,hy + hr * 1.2],[hx + s * hr * .45,hy + hr * 1.2],[hx + s * hr * .55,hy - hr * .3,hx,hy - hr * .7]);
        });
        break;
      }
      case 'plume': {
        // 羽飾り: 帯+立つ羽根2本(羽軸と羽枝)
        FS(dk); rect(hx - hr * .8, hy - hr * .8, hr * 1.6, hr * .16);
        ([-1, 1]).forEach(s => {
          const fbx = hx + s * hr * .15, fby = hy - hr * .8;
          // 羽軸
          ctx.strokeStyle = acc2; lnW(LW(.05, 2)); ctx.beginPath(); ctx.moveTo(fbx, fby); ctx.quadraticCurveTo(fbx + s * hr * .3, fby - hr * .8, fbx + s * hr * .5, fby - hr * 1.05); ctx.stroke();
          // 羽枝(楕円の塊)
          FS(acc2); ell(fbx + s * hr * .35, fby - hr * .7, hr * .14, hr * .42, s * .4);
          // 先端の色違い
          ctx.fillStyle = '#e8d058'; ell(fbx + s * hr * .48, fby - hr * 1.0, hr * .09, hr * .14, s * .4);
        });
        break;
      }
      case 'matador': {
        // 闘牛士帽(モンテラ): 黒い帽子+両サイドの膨らみ
        ctx.fillStyle = '#241f26';
        // 両サイドの耳状の膨らみ
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .75, hy - hr * .75, hr * .32, hr * .38, s * .25);
        });
        // 中央の冠部
        ctx.beginPath(); ctx.ellipse(hx, hy - hr * .85, hr * .5, hr * .28, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 縁取り(銀の筋)
        SS('#b8b8c8'); lnW(2); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .88, hr * .5, hr * .26, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        break;
      }
      case 'turban': {
        // ターバン: 巻いた布(重なる帯)+前の宝石
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .68, hr * .82, hr * .5, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 巻き筋(斜めの帯)
        SS('rgba(0,0,0,0.25)'); lnW(LW(.07, 2));
        times(3, i => {
          ctx.beginPath(); ctx.moveTo(hx - hr * .75, hy - hr * (.55 + i * .18)); ctx.quadraticCurveTo(hx, hy - hr * (.8 + i * .18), hx + hr * .75, hy - hr * (.6 + i * .18)); ctx.stroke();
        });
        // 前の宝石(縦長+枠)
        FS('#e8d058'); ctx.beginPath(); ctx.moveTo(hx, hy - hr * .95); ctx.moveTo(hx, hy - hr * .95); ctx.lineTo(hx + hr * .1, hy - hr * .75); ctx.lineTo(hx, hy - hr * .6); ctx.lineTo(hx, hy - hr * .6); ctx.lineTo(hx - hr * .1, hy - hr * .75); ctx.closePath(); ctx.closePath(); ctx.fill(); FS('#d04060'); dot(hx,hy - hr * .78,hr * .06);
        break;
      }
      case 'tricorne': {
        // 三角帽: 3方向に折れたつば(海賊帽)
        FS(dk);
        // 中央の帽体
        ctx.beginPath(); ctx.arc(hx, hy - hr * .55, hr * .55, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 3つの折れたつば
        for (const [dx, rot] of [[-.7, -.35], [0, 0], [.7, .35]]) {
          ctx.save(); ctx.translate(hx + dx * hr, hy - hr * .65); ctx.rotate(rot); ell(0, 0, hr * .45, hr * .22); ctx.restore();
        }
        // 前立ての縁
        ctx.strokeStyle = '#c8a848'; lnW(3); ctx.beginPath(); ctx.arc(hx, hy - hr * .55, hr * .55, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        break;
      }
      case 'newsboy': {
        // キャスケット: ふっくら丸い帽+前つば+頂ボタン
        ctx.fillStyle = '#6a5a48'; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .8, hr * .48, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // パネル線
        ctx.strokeStyle = '#554838'; lnW(2);
        ([-.4, 0, .4]).forEach(dx => {
          ctx.beginPath(); ctx.moveTo(hx + dx * hr, hy - hr * .95); ctx.quadraticCurveTo(hx + dx * hr * 1.3, hy - hr * .75, hx + dx * hr * 1.6, hy - hr * .62); ctx.stroke();
        });
        // つば
        ctx.fillStyle = '#554838'; ell(hx + hr * .15, hy - hr * .58, hr * .7, hr * .14, .08);
        // 頂ボタン
        ctx.fillStyle = '#554838'; dot(hx,hy - hr * 1.08,hr * .09);
        break;
      }
      case 'fedora': {
        // フェドラ: くぼみのあるクラウン+中つば+帯
        ctx.fillStyle = '#5a4a3a'; ell(hx, hy - hr * .55, hr * .95, hr * .2);
        // クラウン(くぼみつき)
        poly([hx - hr * .65,hy - hr * .55],[hx - hr * .7,hy - hr * 1.35,hx - hr * .25,hy - hr * 1.35],[hx + hr * .25,hy - hr * 1.35],[hx + hr * .7,hy - hr * 1.35,hx + hr * .65,hy - hr * .55]);
        // 中央のくぼみ
        ctx.fillStyle = '#4a3c30'; ell(hx, hy - hr * 1.32, hr * .28, hr * .1);
        // 帯
        ctx.fillStyle = '#2a241e'; rect(hx - hr * .64, hy - hr * .78, hr * 1.28, hr * .18);
        break;
      }
      case 'bowler': {
        // 山高帽: 丸いドーム+小さなつば+帯
        ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(hx, hy - hr * .55, hr * .7, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // つば
        ell(hx, hy - hr * .55, hr * .95, hr * .16);
        // 帯
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .72, hr * .12, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        break;
      }
      case 'flowercrown': {
        // 花冠: 頭を取り巻く小さな花の輪+緑の葉
        times(9, i => {
          const a = Math.PI * (1.08 + i * .105); const fx = hx + Math.cos(a) * hr * .82; const fy = hy - hr * .5 + Math.sin(a) * hr * .42;
          // 葉
          ctx.fillStyle = '#5a8a4a'; ell(fx + hr * .06, fy + hr * .05, hr * .07, hr * .03, .5);
          // 花(5弁+中心)
          FS(['#f090a8', '#f5c8d5', '#e8e0a0'][i % 3]);
          times(5, p => {
            const pa = p / 5 * Math.PI * 2; ell(fx + Math.cos(pa) * hr * .05, fy + Math.sin(pa) * hr * .05, hr * .045, hr * .028, pa);
          });
          FS('#e8c840'); dot(fx,fy,hr * .03);
        });
        break;
      }
      case 'tiara': {
        // ティアラ: 額の細い帯+3つの尖り+中央の宝石
        ctx.strokeStyle = '#e8d058'; lnW(LW(.06, 2)); ctx.beginPath(); ctx.arc(hx, hy - hr * .5, hr * .75, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        for (const [dx, s] of [[-hr * .45, .7], [0, 1], [hr * .45, .7]]) {
          FS('#e8d058'); poly([hx + dx - hr * .09,hy - hr * .62],[hx + dx,hy - hr * (.62 + .3 * s)],[hx + dx + hr * .09,hy - hr * .62]);
        }
        // 中央の宝石
        ctx.fillStyle = '#e05070'; ctx.beginPath(); ctx.moveTo(hx, hy - hr * .95); ctx.moveTo(hx, hy - hr * .95); ctx.lineTo(hx + hr * .08, hy - hr * .82); ctx.lineTo(hx, hy - hr * .72); ctx.lineTo(hx, hy - hr * .72); ctx.lineTo(hx - hr * .08, hy - hr * .82); ctx.closePath(); ctx.closePath(); ctx.fill();
        break;
      }
      case 'jester': {
        // 道化師帽: 3本の垂れた尖り+先端の鈴
        ctx.fillStyle = acc2;
        // 帽子本体(前半円)
        ctx.beginPath(); ctx.arc(hx, hy - hr * .55, hr * .8, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 3本の尖り
        ([-hr * .75, 0, hr * .75]).forEach(dx => {
          const tipX = hx + dx * 1.6, tipY = hy - hr * (dx === 0 ? 1.5 : 1.1); poly([hx + dx * .9,hy - hr * .6],[hx + dx * 1.2,hy - hr * 1.1,tipX,tipY],[hx + dx * .7,hy - hr * 1.0,hx + dx * .5,hy - hr * .55]);
          // 鈴
          ctx.fillStyle = '#e8d058'; dot(tipX,tipY,hr * .09); FS(acc2);
        });
        // 帯
        ctx.fillStyle = dk; rect(hx - hr * .8, hy - hr * .65, hr * 1.6, hr * .16);
        break;
      }
      case 'nightcap': {
        // ナイトキャップ: 垂れる三角帽+房(眠そうな帽子)
        FS(`hsla(${hue},50%,60%,1)`);
        poly([hx - hr * .8,hy - hr * .6],[hx - hr * .2,hy - hr * 1.7,hx + hr * 1.1,hy - hr * 1.5],[hx + hr * .5,hy - hr * 1.1,hx + hr * .7,hy - hr * .55]);
        // 房
        ctx.fillStyle = '#f0f0f0'; dot(hx + hr * 1.08,hy - hr * 1.5,hr * .14);
        // 帯
        ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.ellipse(hx, hy - hr * .62, hr * .82, hr * .18, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        break;
      }
      case 'laurel': {
        // 月桂冠: 左右から頭を囲む葉の輪
        ctx.fillStyle = '#4a7a3a';
        ([-1, 1]).forEach(s => {
          times(6, i => {
            const a = Math.PI * (1.15 + i * .14); const lx = hx + Math.cos(a) * hr * .95 * s; const ly = hy - Math.abs(Math.sin(a)) * hr * 1.05 + hr * .1; ctx.save(); ctx.translate(lx, ly); ctx.rotate(s * (.5 - i * .15)); ell(0,0,hr * .14,hr * .05); ctx.restore();
          });
        });
        break;
      }
      case 'ushanka': {
        // 耳当て帽: 毛皮のドーム+耳の垂れ+前立て
        ctx.fillStyle = '#8a7a68'; ctx.beginPath(); ctx.arc(hx, hy - hr * .65, hr * .85, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 前立て(折り上げた毛皮)
        FS('#a8988a'); ctx.beginPath(); ctx.ellipse(hx, hy - hr * .68, hr * .9, hr * .28, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 耳の垂れ(両サイド)
        FS('#8a7a68');
        ([-1, 1]).forEach(s => {
          ell(hx + s * hr * .82, hy - hr * .1, hr * .22, hr * .5);
        });
        break;
      }
      case 'sombrero': {
        // ソンブレロ: 巨大なつば+丸い頂+縁の帯
        ctx.fillStyle = acc2; ell(hx, hy - hr * .62, hr * 1.6, hr * .32); ctx.beginPath(); ctx.arc(hx, hy - hr * .85, hr * .6, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 縁の帯(三角模様風の刻み)
        SS(dk); lnW(hr * .05); ells(hx, hy - hr * .62, hr * 1.6, hr * .32); SS('rgba(255,255,255,0.5)'); lnW(hr * .08); ctx.beginPath(); ctx.arc(hx, hy - hr * .85, hr * .62, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        break;
      }
      case 'fez': {
        // フェズ帽: 赤い円台+黒い房
        ctx.fillStyle = '#b02830'; poly([hx - hr * .55,hy - hr * .65],[hx + hr * .55,hy - hr * .65],[hx + hr * .4,hy - hr * 1.5],[hx - hr * .4,hy - hr * 1.5]); SS(dk); lnW(hr * .05); ctx.stroke();
        // 房(頭頂から垂れる黒い紐)
        SS('#2a2a32'); lnW(hr * .06); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy - hr * 1.5); ctx.quadraticCurveTo(hx + hr * .3, hy - hr * 1.4, hx + hr * .45, hy - hr * .8); ctx.stroke(); FS('#2a2a32'); dot(hx + hr * .45,hy - hr * .75,hr * .1);
        break;
      }
      case 'viking': {
        // ヴァイキング兜: ドーム+中央の帯+左右の湾曲角
        ctx.fillStyle = '#6a7080'; ctx.beginPath(); ctx.arc(hx, hy - hr * .6, hr * .85, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill(); FS('#8a92a2'); rect(hx - hr * .12, hy - hr * 1.45, hr * .24, hr * .9);
        // 角(外へ湾曲)
        FS('rgba(235,225,200,0.95)');
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .8,hy - hr * .75],[hx + s * hr * 1.6,hy - hr * 1.1,hx + s * hr * 1.45,hy - hr * 1.8],[hx + s * hr * 1.15,hy - hr * 1.15,hx + s * hr * .65,hy - hr * .95]);
        });
        break;
      }
      case 'bowtie': {
        // 蝶ネクタイ: あご下の左右三角+中央結び目
        const by = hy + hr * 1.15; FS(acc2);
        ([-1, 1]).forEach(s => {
          poly([hx,by],[hx + s * hr * .55,by - hr * .28],[hx + s * hr * .55,by + hr * .28]);
        });
        FS(dk); dot(hx,by,hr * .12);
        break;
      }
      case 'antler': {
        // トナカイの角: 左右に分岐する枝角
        ctx.strokeStyle = '#8a6a48'; lnW(hr * .12); ctx.lineCap = 'round';
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); ctx.moveTo(hx + s * hr * .4, hy - hr * .7); ctx.quadraticCurveTo(hx + s * hr * .7, hy - hr * 1.3, hx + s * hr * 1.1, hy - hr * 1.7); ctx.stroke(); lnW(hr * .08); ctx.beginPath(); ctx.moveTo(hx + s * hr * .62, hy - hr * 1.15); ctx.lineTo(hx + s * hr * .5, hy - hr * 1.55); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx + s * hr * .9, hy - hr * 1.45); ctx.lineTo(hx + s * hr * 1.05, hy - hr * 1.9); ctx.stroke(); lnW(hr * .12);
        });
        break;
      }
      case 'headband': {
        // ヘアバンド: 頭を取り巻く帯+側面の結び目
        ctx.strokeStyle = acc2; lnW(hr * .22); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(hx, hy, hr * .95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); FS(acc2); ell(hx + hr * .88, hy - hr * .3, hr * .16, hr * .1, .5);
        break;
      }
      case 'santa': {
        // サンタ帽: 赤い三角帽+白い房+白い縁
        ctx.fillStyle = acc2; poly([hx - hr * .85,hy - hr * .7],[hx - hr * .1,hy - hr * 2.3,hx + hr * .75,hy - hr * 1.5],[hx + hr * .5,hy - hr * .9,hx + hr * .85,hy - hr * .7]);
        // 白い縁
        ctx.fillStyle = 'rgba(245,248,252,0.97)'; ell(hx, hy - hr * .72, hr * .9, hr * .18);
        // 房(垂れた先端の玉)
        dot(hx + hr * .78, hy - hr * 1.52, hr * .18);
        break;
      }
      case 'top': {
        // シルクハット: 高い筒+広つば+帯
        ctx.fillStyle = dk; ell(hx, hy - hr * .7, hr * 1.15, hr * .16); rect(hx - hr * .72, hy - hr * 2.1, hr * 1.44, hr * 1.45); ell(hx, hy - hr * 2.1, hr * .72, hr * .12); FS(acc2); rect(hx - hr * .72, hy - hr * .85, hr * 1.44, hr * .22);
        break;
      }
      case 'chef': {
        // コック帽: ふくらんだ白い頭頂+帯
        ctx.fillStyle = 'rgba(240,242,246,0.97)'; ctx.beginPath(); ctx.ellipse(hx, hy - hr * 1.25, hr * .78, hr * .55, 0, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill();
        // 頭頂の3つの膨らみ
        ([-.45, 0, .45]).forEach(dx => {
          dot(hx + hr * dx, hy - hr * 1.55, hr * .3);
        });
        FS('rgba(215,220,228,0.95)'); rect(hx - hr * .78, hy - hr * .92, hr * 1.56, hr * .2); SS(dk); lnW(hr * .05); ctx.strokeRect(hx - hr * .78, hy - hr * .92, hr * 1.56, hr * .2);
        break;
      }
      case 'cap': {
        // 野球帽: ドーム+前方の平つば+ボタン
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.arc(hx, hy - hr * .75, hr * .92, Math.PI, 0); ctx.closePath(); ctx.closePath(); ctx.fill(); rect(hx - hr * .92, hy - hr * .78, hr * 1.84, hr * .12);
        // つば(右前方)
        ell(hx + hr * 1.05, hy - hr * .62, hr * .55, hr * .16, .12); FS('rgba(255,255,255,0.4)'); dot(hx,hy - hr * 1.68,hr * .09);
        break;
      }
      case 'wizard': {
        // とんがり帽: 長い円錐+広いつば+先端の折れ
        ctx.fillStyle = acc2; poly([hx - hr * .7,hy - hr * .85],[hx - hr * .35,hy - hr * 1.9,hx + hr * .35,hy - hr * 2.35],[hx + hr * .5,hy - hr * 2.15,hx + hr * .62,hy - hr * 2.25],[hx + hr * .4,hy - hr * 1.75,hx + hr * .7,hy - hr * .85]); ell(hx,hy - hr * .82,hr * 1.25,hr * .3);
        break;
      }
      case 'earmuff': {
        // イヤーマフ: 頭頂の帯+両耳の丸いカップ
        ctx.strokeStyle = acc2; lnW(hr * .14); ctx.beginPath(); ctx.arc(hx, hy - hr * .15, hr * 1.08, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); FS(acc2);
        ([-1, 1]).forEach(s => {
          dot(hx + s * hr * 1.05,hy - hr * .05,hr * .38); FS('rgba(255,255,255,0.35)'); dot(hx + s * hr * 1.05,hy - hr * .05,hr * .22); FS(acc2);
        });
        break;
      }
      case 'straw': {
        // 麦わら帽子: 広い楕円つば+丸い天辺+リボン帯
        ctx.fillStyle = 'hsl(45,60%,72%)'; ell(hx,hy - hr * .85,hr * 1.5,hr * .38); ell(hx,hy - hr * 1.1,hr * .78,hr * .55); FS(acc2); rect(hx - hr * .78, hy - hr * 1.02, hr * 1.56, hr * .18);
        break;
      }
      case 'horns': {
        // ツノ: 頭頂両端から外へ湾曲する小さな角
        ctx.fillStyle = acc2;
        ([-1, 1]).forEach(s => {
          poly([hx + s * hr * .45,hy - hr * .85],[hx + s * hr * 1.05,hy - hr * 1.05,hx + s * hr * .95,hy - hr * 1.55],[hx + s * hr * .8,hy - hr * 1.15,hx + s * hr * .62,hy - hr * .82]);
        });
        break;
      }
      case 'goggles': {
        // ゴーグル: 額の帯+2つのレンズ
        ctx.strokeStyle = dk; lnW(hr * .1); ctx.beginPath(); ctx.moveTo(hx - hr * 1.02, hy - hr * .62); ctx.lineTo(hx + hr * 1.02, hy - hr * .62); ctx.stroke(); lnW(hr * .07); SS(acc2); FS('rgba(160,220,255,0.55)');
        ([-1, 1]).forEach(s => {
          ctx.beginPath(); dot(hx + s * hr * .42, hy - hr * .62, hr * .3); ctx.fill(); ctx.stroke();
        });
        ctx.beginPath(); ctx.moveTo(hx - hr * .12, hy - hr * .62); ctx.lineTo(hx + hr * .12, hy - hr * .62); ctx.stroke();
        break;
      }
      case 'cat-ear': {
        // 猫耳: 頭頂両端の三角形(内側は淡ピンク)
        ([-1, 1]).forEach(s => {
          FS(acc2); poly([hx + s * hr * .3,hy - hr * .95],[hx + s * hr * .78,hy - hr * .85],[hx + s * hr * .6,hy - hr * 1.45]); FS('rgba(255,190,205,0.85)'); poly([hx + s * hr * .42,hy - hr * .95],[hx + s * hr * .68,hy - hr * .9],[hx + s * hr * .58,hy - hr * 1.28]);
        });
        break;
      }
      case 'bunny': {
        // うさ耳: 頭頂から2本の長い耳(内側は淡色)
        ([-1, 1]).forEach(s => {
          FS(acc2); ell(hx + s * hr * .42, hy - hr * 1.62, hr * .2, hr * .75, s * .12); FS('rgba(255,190,205,0.85)'); ell(hx + s * hr * .42, hy - hr * 1.6, hr * .1, hr * .5, s * .12);
        });
        break;
      }
      case 'flower': {
        // 花飾り: 頭の側面に5弁の花(accHueで花弁着色)
        const fx2 = hx + hr * .62, fy2 = hy - hr * .55, pr3 = hr * .16; FS(acc2);
        times(5, k => {
          const a2 = k * Math.PI * 2 / 5; ell(fx2 + Math.cos(a2) * pr3 * 1.15, fy2 + Math.sin(a2) * pr3 * 1.15, pr3, pr3 * .58, a2);
        });
        FS('hsla(50,90%,60%,0.95)'); dot(fx2,fy2,pr3 * .45); // しべ
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
  const stage = $('stage'), ctx = stage.getContext('2d'); let W = stage.width, H = stage.height;
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
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a3550'); g.addColorStop(.6, '#3b4a6b'); g.addColorStop(1, '#1d2230'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function drawCover(c, img, fit, blurPx, sat, con, offX, offY, zoom = 0) {
    const iw = img.naturalWidth || img.videoWidth, ih = img.naturalHeight || img.videoHeight;
    if (!iw || !ih) return;
    const s = (fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih)) * (1 + zoom); const dw = iw * s, dh = ih * s;
    const f = `blur(${blurPx}px) saturate(${sat}) contrast(${con})`;
    if (f !== 'blur(0px) saturate(1) contrast(1)') c.filter = f;
    // 背景位置オフセット: 被写体に合わせて構図をずらす
    c.drawImage(img, (W - dw) / 2 + (offX - .5) * W, (H - dh) / 2 + (offY - .5) * H, dw, dh); c.filter = 'none';
  }

  // 背景グレーディング: 被写体を際立たせるため背景をぼかし・減光する(合成定番)
  // 画像なし時はプリセット背景: gradient=内蔵/green=グリーンスクリーン/white=白/transparent=透過PNG用
  function drawBackdrop(c, p, t) {
    if (state.bg) {
      // 背景のゆっくりズーム(Ken Burns): 1→1+bgDrift*.15 をゆるく往復
      const z = p.bgDrift * .15 * (.5 + .5 * S(.12)); drawCover(c, state.bg, p.bgFit, p.bgBlur * 10, p.bgSat * 2, .5 + p.bgContrast, p.bgX, p.bgY, z);
      if (p.bgDim > 0) { FS(`rgba(8,10,16,${p.bgDim * .55})`); rect(0, 0, W, H); }
      return;
    }
    const pr = p.bgPreset || 'gradient';
    // ペイント語彙: 全背景で共用する最小プリミティブ(容量圧縮の中核)
    const sky = (stops) => {
      const gr = c.createLinearGradient(0, 0, 0, H);
      for (const [o, col] of stops) gr.addColorStop(o, col);
      FS(gr); rect(0, 0, W, H);
    };
      const ell = (x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(W * x, H * y, rx, ry, rot || 0, 0, 7); c.fill(); };
      const ellP = (x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fill(); };
      const ellPS = (x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.stroke(); };
      const dotPS = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); };
      const dotP = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
      const times = (n, f) => { for (let i = 0; i < n; i++) f(i); };
      const scat = (seed, n, f) => { const r = L.mulberry32(seed); times(n, i => f(r, i)); };
      const rect = (x, y, w, h) => c.fillRect(x, y, w, h);
      const FS = v => c.fillStyle = v;
      const SS = v => c.strokeStyle = v;
      const lnW = v => c.lineWidth = v;
      const poly = (...p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const a = p[i]; if (a.length === 2) c.lineTo(a[0], a[1]); else if (a.length === 4) c.quadraticCurveTo(a[0], a[1], a[2], a[3]); else c.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]); } c.closePath(); c.fill(); };
      const polyS = (...p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const a = p[i]; if (a.length === 2) c.lineTo(a[0], a[1]); else if (a.length === 4) c.quadraticCurveTo(a[0], a[1], a[2], a[3]); else c.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]); } c.closePath(); c.stroke(); };
      const S = f => Math.sin(t * f), C = f => Math.cos(t * f), A = f => Math.abs(S(f));
    const dot = (x, y, r) => { c.beginPath(); c.arc(W * x, H * y, r, 0, 7); c.fill(); };
    if (pr === 'transparent') return; // アルファを残す(ディムもかけない)
    if (p.bgBlur > 0) c.filter = `blur(${p.bgBlur * 10}px)`;
    if (pr === 'green') { FS('#00b140'); rect(0, 0, W, H); }
    else if (pr === 'white') { FS('#ffffff'); rect(0, 0, W, H); }
    else if (pr === 'sunset') {
      sky([[0,'#2b2f6e'],[.55,'#c9526a'],[1,'#ffb56b']]); FS('rgba(255,190,90,0.92)'); dot(.5,.6,H * .15); // 夕日
    } else if (pr === 'night') {
      sky([[0,'#0a0d24'],[1,'#1c2347']]); scat(999, 90, (rng, i) => {
        const sx = rng() * W, sy = rng() * H * .85, sr = rng() * 1.4 + .4; const tw = .3 + .65 * Math.abs(Math.sin(t * (.4 + rng() * 1.6) + rng() * 9));
        FS(`rgba(255,255,255,${tw})`);
        dotP(sx, sy, sr);
      });
      FS('rgba(240,240,220,0.95)'); dot(.8,.18,H * .07); // 月
    } else if (pr === 'spot') {
      FS('#0b0c10'); rect(0, 0, W, H); const g = c.createRadialGradient(W * .5, H * .86, 10, W * .5, H * .86, W * .5); g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(1, 'rgba(255,240,200,0)'); FS(g); c.beginPath(); c.moveTo(W * .44, 0); c.moveTo(W * .44, 0); c.lineTo(W * .56, 0); c.moveTo(W * .44, 0); c.lineTo(W * .56, 0); c.lineTo(W * .9, H * .95); c.moveTo(W * .44, 0); c.lineTo(W * .56, 0); c.lineTo(W * .9, H * .95); c.lineTo(W * .1, H * .95); c.closePath(); c.closePath(); c.fill(); ell(.5,.88,W * .28,H * .07); // 床の光り輪
    } else if (pr === 'sky') {
      // 青空: 晴れの空 + ゆっくり流れる雲(手続き描画)
      sky([[0,'#2e7bd6'],[1,'#a8d4f0']]); scat(77, 5, (rng, i) => {
        const bx = rng(), sp = .008 + .01 * rng(), cy = H * (.05 + rng() * .45); const cxx = ((bx + t * sp) % 1) * W; FS('rgba(255,255,255,0.85)');
        for (let k = -1; k <= 1; k++) {
          ellP(cxx + k * W * .05, cy + (k === 0 ? -H * .014 : 0), W * (.045 + .018 * rng()), H * .028);
        }
      });
    } else if (pr === 'pastel') {
      // パステル虹: ふんわりした虹色グラデーション + 白い光斑
      const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#ffd9e8'); gr.addColorStop(.35, '#ffe9c9'); gr.addColorStop(.65, '#d9f2e3'); gr.addColorStop(1, '#c9e3ff'); FS(gr); rect(0, 0, W, H); const rng = L.mulberry32(4242); FS('rgba(255,255,255,0.5)');
      times(24, i => {
        dotP(rng() * W, rng() * H, 3 + rng() * 9);
      });
    } else if (pr === 'santorini') {
      // サントリーニ: カルデラの青い海+白い家並み+青いドーム
      sky([[0,'#78b8e8'],[.5,'#a8d0f0'],[1,'#3868a8']]);
      // 対岸のカルデラの崖(遠くの暗い輪郭)
      FS('#4a6078'); poly([0,H * .45],[W * .3,H * .38,W * .6,H * .43],[W * .85,H * .46,W,H * .42],[W,H * .52],[W,H * .52],[0,H * .52]);
      // エーゲ海(深い青)
      const sg = c.createLinearGradient(0, H * .5, 0, H); sg.addColorStop(0, '#2a5a98'); sg.addColorStop(1, '#183a68'); FS(sg); rect(0, H * .5, W, H * .5);
      // 海の光の揺らぎ
      c.fillStyle = 'rgba(255,255,255,0.25)'; scat(518, 14, (rng, i) => {
        rect(rng() * W, H * (.55 + rng() * .4), W * .04, H * .004);
      });
      // 断崖の上の白い家々(箱の積み重なり)
      const houses = [
        [.05, .38, .09, .1], [.13, .35, .08, .13], [.2, .38, .1, .1],
        [.28, .33, .08, .15], [.35, .37, .09, .11], [.43, .4, .08, .08]];
      FS('#f4f2ea');
      for (const [hx2, hy2, hw, hh] of houses) {
        rect(W * hx2, H * hy2, W * hw, H * hh);
      }
      // 窓とドア(青)
      FS('#3868a8');
      for (const [hx2, hy2] of houses) {
        rect(W * (hx2 + .02), H * (hy2 + .03), W * .015, H * .025); rect(W * (hx2 + .05), H * (hy2 + .06), W * .015, H * .035);
      }
      // 青いドーム(2基)
      ([.19, .38]).forEach(dx => {
        c.beginPath(); c.arc(W * dx + W * .045, H * .36 - W * .045, W * .045, Math.PI, 0); c.fill(); FS('#f4f2ea'); rect(W * dx, H * .36 - W * .045, W * .09, H * .1); FS('#3868a8');
      });
      // 断崖(右側の茶色い斜面)
      FS('#8a6848'); poly([W * .55,H * .5],[W * .75,H * .5],[W,H],[W * .5,H]);
      // 断崖にも家(崖に食い込む)
      FS('#f4f2ea'); rect(W * .62, H * .55, W * .07, H * .08); rect(W * .7, H * .62, W * .08, H * .1);
      // 飛ぶカモメ
      c.strokeStyle = '#f0f0e8'; lnW(1.5);
      times(3, i => {
        const bx = W * (.6 + i * .12 + Math.sin(t * .5 + i) * .02); const by = H * (.15 + (i % 2) * .07); c.beginPath(); c.moveTo(bx - 6, by); c.moveTo(bx - 6, by); c.quadraticCurveTo(bx, by - 5, bx + 6, by); c.stroke();
      });
    } else if (pr === 'cappadocia') {
      // カッパドキア: 奇岩の妖精の煙突+朝焼け+気球の群れ
      sky([[0,'#e8a878'],[.45,'#f0c090'],[1,'#c89068']]);
      // 朝日(低く大きな太陽)
      FS('#f8d8a0'); dot(.78,.22,W * .07);
      // 遠くの岩山(淡い層)
      FS('#c89878'); poly([0,H * .55],[W * .25,H * .48,W * .5,H * .54],[W * .75,H * .5,W,H * .56],[W,H],[W,H],[0,H]);
      // 気球(バスケット+丸い球皮、ゆっくり浮かぶ)
      const balloons = [
        [.15, .18, .045, '#d84848'], [.32, .3, .03, '#4878c8'], [.55, .12, .038, '#e8a038'],
        [.7, .28, .025, '#68a848'], [.88, .15, .05, '#a848a8']];
      times(balloons.length, i => {
        const [bx, by, br, col] = balloons[i]; const yy = H * (by + Math.sin(t * .3 + i * 1.7) * .012); FS(col); dotP(W * bx, yy, W * br); SS('#704828'); lnW(1); c.beginPath(); c.moveTo(W * bx - W * br * .4, yy + W * br * .8); c.lineTo(W * bx - W * br * .25, yy + W * br * 1.35); c.moveTo(W * bx + W * br * .4, yy + W * br * .8); c.lineTo(W * bx + W * br * .25, yy + W * br * 1.35); c.stroke(); FS('#704828'); rect(W * bx - W * br * .3, yy + W * br * 1.35, W * br * .6, W * br * .35);
      });
      // 妖精の煙突(先細りの岩柱+濃い笠石) — 高さを変えて並べる
      const chim = [
        [.06, .6, .05, .34], [.14, .62, .04, .26], [.24, .58, .055, .38],
        [.38, .64, .045, .28], [.5, .6, .06, .36], [.66, .63, .05, .3],
        [.8, .58, .055, .4], [.93, .62, .045, .3]];
      for (const [cx, cy, cw, ch] of chim) {
        // 岩柱(下に広い円錐筒)
        FS('#b88058'); poly([W * (cx - cw * .8),H],[W * (cx - cw * .45),H * (1 - ch)],[W * cx,H * (1 - ch) - H * .015,W * (cx + cw * .45),H * (1 - ch)],[W * (cx + cw * .8),H]);
        // 笠石(濃い三角錐)
        FS('#785038'); poly([W * (cx - cw * .55),H * (1 - ch)],[W * cx,H * (1 - ch) - H * ch * .28],[W * (cx + cw * .55),H * (1 - ch)]);
        // 側面の陰影(縦筋)
        SS('rgba(80,50,30,0.35)'); lnW(1.5); scat(Math.floor(cx * 1000), 3, (rng2, k) => {
          const ox = cx - cw * .4 + rng2() * cw * .8; c.beginPath(); c.moveTo(W * ox, H * (1 - ch)); c.lineTo(W * (ox - cw * .25), H); c.stroke();
        });
      }
      // 谷間のテント村(小さな三角屋根)
      FS('#e8d8c0'); scat(777, 6, (rng3, i) => {
        const tx = W * (.1 + rng3() * .8), ty = H * (.82 + rng3() * .12); c.beginPath(); c.moveTo(tx - W * .015, ty); c.moveTo(tx - W * .015, ty); c.lineTo(tx, ty - H * .02); c.moveTo(tx - W * .015, ty); c.lineTo(tx, ty - H * .02); c.lineTo(tx + W * .015, ty); c.closePath(); c.closePath(); c.fill();
      });
    } else if (pr === 'redwoods') {
      // レッドウッド林: 巨木の幹+差し込む光柱+シダの下生え
      sky([[0,'#2a4a30'],[.5,'#4a6a40'],[1,'#6a7a48']]);
      // 奥の巨木(遠景、色を薄く)
      FS('#4a5c38'); scat(314, 7, (rng4, i) => {
        const tx = W * (.08 + rng4() * .84), tw = W * (.012 + rng4() * .018); rect(tx, H * .05, tw, H);
      });
      // 差し込む光柱(斜めの半透明ビーム)
      FS('rgba(250,240,200,0.16)');
      ([.3, .55, .8]).forEach(bx => {
        poly([W * bx,0],[W * (bx + .1),0],[W * (bx + .02),H],[W * (bx - .08),H]);
      });
      // 手前の巨木(左右の大きな幹+縦筋樹皮)
      for (const [tx, tw] of [[0, .13], [.9, .14], [.42, .07]]) {
        FS('#5a3a26'); rect(W * tx, 0, W * tw, H); SS('#3a2418'); lnW(2); scat(Math.floor(tx * 100), 4, (rng5, k) => {
          const gx = W * (tx + rng5() * tw * .9); c.beginPath(); c.moveTo(gx, H * .05); c.quadraticCurveTo(gx + W * .006, H * .5, gx - W * .004, H); c.stroke();
        });
      }
      // 枝張り(巨木から横に伸びる枝+針葉の塊)
      FS('#2f4a28'); c.beginPath(); c.ellipse(W * .1, H * .12, W * .12, H * .05, -.2, 0, 7); c.ellipse(W * .1, H * .12, W * .12, H * .05, -.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .95, H * .18, W * .11, H * .05, .2, 0, 7); c.ellipse(W * .95, H * .18, W * .11, H * .05, .2, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .46, H * .08, W * .1, H * .04, 0, 0, 7); c.ellipse(W * .46, H * .08, W * .1, H * .04, 0, 0, 7); c.fill();
      // 林床(暗い土+シダの葉)
      FS('#3a3020'); rect(0, H * .9, W, H * .1); SS('#5a7a3a'); lnW(1.5); scat(555, 16, (rng6, i) => {
        const fx = W * rng6(), fy = H * (.88 + rng6() * .1);
        for (let k = -2; k <= 2; k++) {
          c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + W * .012 * k, fy - H * .03, fx + W * .018 * k, fy - H * .05); c.stroke();
        }
      });
      // 舞う胞子(光る点)
      FS('rgba(255,240,190,0.5)');
      times(10, i => {
        const px = W * ((i * .1 + t * .004) % 1); const py = H * (.3 + .35 * Math.sin(t * .4 + i * 2.1)); rect(px, py, 2, 2);
      });
    } else if (pr === 'slotcanyon') {
      // スロットキャニオン: 波打つ赤岩の壁+頭上の隙間+差し込む光柱+砂の床
      sky([[0,'#f0c080'],[.3,'#c86838'],[1,'#803818']]);
      // 左の波打つ岩壁(縦の流れ曲線の重なり)
      FS('#a84820'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .42, 0); c.bezierCurveTo(W * .3, H * .25, W * .5, H * .4, W * .32, H * .62); c.bezierCurveTo(W * .2, H * .8, W * .3, H * .9, W * .2, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
      // 右の岩壁(逆向きに迫る)
      FS('#8a3a18'); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .6, 0); c.bezierCurveTo(W * .78, H * .2, W * .55, H * .38, W * .7, H * .58); c.bezierCurveTo(W * .82, H * .78, W * .68, H * .9, W * .78, H); c.lineTo(W, H); c.closePath(); c.closePath(); c.fill();
      // 岩の縞(波状の明縞 — 壁面に沿う流線)
      SS('rgba(240,180,120,0.4)'); lnW(3);
      ([.08, .18, .3, .44]).forEach(off => {
        c.beginPath(); c.moveTo(W * off, 0); c.bezierCurveTo(W * (off - .06), H * .3, W * (off + .12), H * .5, W * (off - .04), H); c.stroke();
      });
      SS('rgba(60,20,10,0.45)'); lnW(2);
      ([.62, .74, .86]).forEach(off => {
        c.beginPath(); c.moveTo(W * off, 0); c.bezierCurveTo(W * (off + .08), H * .3, W * (off - .1), H * .55, W * (off + .05), H); c.stroke();
      });
      // 頭上の隙間(天井の細い開口)
      FS('#f8e0a8'); c.beginPath(); c.moveTo(W * .45, 0); c.moveTo(W * .45, 0); c.lineTo(W * .56, 0); c.lineTo(W * .5, H * .07); c.lineTo(W * .5, H * .07); c.closePath(); c.lineTo(W * .5, H * .07); c.closePath(); c.fill();
      // 差し込む光柱(中央の柔らかい柱)
      const lg = c.createLinearGradient(0, 0, 0, H * .85); lg.addColorStop(0, 'rgba(255,230,170,0.55)'); lg.addColorStop(1, 'rgba(255,230,170,0)'); FS(lg); c.beginPath(); c.moveTo(W * .46, 0); c.moveTo(W * .46, 0); c.lineTo(W * .55, 0); c.lineTo(W * .62, H * .85); c.lineTo(W * .62, H * .85); c.lineTo(W * .4, H * .85); c.closePath(); c.closePath(); c.fill();
      // 光の中の塵(ゆらめく点)
      FS('rgba(255,240,200,0.6)'); scat(909, 12, (rng7, i) => {
        const px = W * (.44 + rng7() * .14) + Math.sin(t * .7 + i) * 3; const py = H * (.1 + rng7() * .6); rect(px, py, 1.5, 1.5);
      });
      // 砂の床(照らされた細砂)
      const sg = c.createLinearGradient(0, H * .82, 0, H); sg.addColorStop(0, '#d8a060'); sg.addColorStop(1, '#a06030'); FS(sg); poly([0,H],[W * .5,H * .82,W,H]);
    } else if (pr === 'angkor') {
      // アンコール: 蓮の蕾の塔群+薄明の空+池の映り込み+ジャングルの樹線
      sky([[0,'#e8a060'],[.4,'#f0c890'],[1,'#986848']]);
      // 薄明の太陽(塔の後ろに沈む)
      FS('#f8d8a0'); dot(.5,.32,W * .09);
      // ジャングルの樹線(左右の低い連なり)
      FS('#3a4a28'); c.beginPath(); c.moveTo(0, H * .55); const rng8 = L.mulberry32(2024); let jx = 0;
      while (jx < W) {
        c.quadraticCurveTo(jx + W * .04, H * (.5 + rng8() * .08), jx + W * .08, H * .55); jx += W * .08;
      }
      c.lineTo(W, H * .62); c.lineTo(W, H * .62); c.lineTo(0, H * .62); c.closePath(); c.closePath(); c.fill();
      // アンコールの塔群(中央大塔+両脇の小塔 — 蓮の蕾の輪郭)
      const towers = [[.5, .12, .3], [.32, .08, .36], [.68, .08, .36], [.14, .06, .42], [.86, .06, .42]]; FS('#5a4230');
      for (const [tx, tw, ty] of towers) {
        const bx = W * tx, bw = W * tw, top = H * ty;
        // 蕾の輪郭(段々に尖る)
        poly([bx - bw * .55,H * .62],[bx - bw * .5,top + bw * .5],[bx - bw * .3,top + bw * .15,bx,top],[bx + bw * .3,top + bw * .15,bx + bw * .5,top + bw * .5],[bx + bw * .55,H * .62]);
        // 蕾の節(横筋)
        SS('#3a2a1c'); lnW(1.5);
        ([.3, .45, .58]).forEach(ry => {
          c.beginPath(); c.moveTo(bx - bw * .4, top + bw * ry * 2); c.lineTo(bx + bw * .4, top + bw * ry * 2); c.stroke();
        });
      }
      // 基壇(塔の土台)
      FS('#4a3626'); rect(0, H * .58, W, H * .05);
      // 静かな池(映り込み — 塔を反転した淡像)
      const pg = c.createLinearGradient(0, H * .63, 0, H); pg.addColorStop(0, '#b89068'); pg.addColorStop(1, '#7a5838'); FS(pg); rect(0, H * .63, W, H * .37);
      // 映り込み(薄い塔の逆さ影)
      FS('rgba(90,66,48,0.45)');
      for (const [tx, tw] of towers) {
        const bx = W * tx, bw = W * tw; poly([bx - bw * .5,H * .64],[bx - bw * .3,H * .78],[bx + bw * .3,H * .78],[bx + bw * .5,H * .64]);
      }
      // 水面の光の揺らぎ
      c.fillStyle = 'rgba(255,220,170,0.3)';
      times(10, i => {
        const py = H * (.66 + i * .03); const pw = W * (.15 + .05 * Math.sin(t + i)); rect(W * .5 - pw / 2 + Math.sin(t * .5 + i * 2) * 8, py, pw, 1.5);
      });
      // 水面の睡蓮
      c.fillStyle = '#48704a'; scat(42, 8, (rng9, i) => {
        ell((.08 + rng9() * .84), (.7 + rng9() * .25), W * .02, H * .008);
      });
    } else if (pr === 'pantanal') {
      // パンタナル: 湿原の水面+浮草+ジャビルの群れ+緑の水辺林
      sky([[0,'#e8c878'],[.4,'#c8b068'],[1,'#5a7a50']]);
      // 夕日(低く赤い)
      FS('#f09858'); dot(.62,.3,W * .06);
      // 遠くの水辺林(樹冠の連なり)
      FS('#3d5230'); c.beginPath(); c.moveTo(0, H * .52); const rngA = L.mulberry32(88); let px2 = 0;
      while (px2 < W) {
        c.quadraticCurveTo(px2 + W * .05, H * (.46 + rngA() * .06), px2 + W * .1, H * .52); px2 += W * .1;
      }
      c.lineTo(W, H * .58); c.lineTo(W, H * .58); c.lineTo(0, H * .58); c.closePath(); c.closePath(); c.fill();
      // 湿原の水面
      const wg = c.createLinearGradient(0, H * .58, 0, H); wg.addColorStop(0, '#7a8a58'); wg.addColorStop(1, '#4a5c40'); FS(wg); rect(0, H * .58, W, H * .42);
      // 浮草のパッチ(明るい円形の葉群)
      FS('#6a8a48'); scat(471, 14, (rngB, i) => {
        ell(rngB(), (.62 + rngB() * .32), W * (.02 + rngB() * .04), H * (.006 + rngB() * .01));
      });
      // 夕日の映り込み(水面の光筋)
      FS('rgba(240,150,80,0.35)');
      times(8, i => {
        const py = H * (.62 + i * .04); const pw = W * (.1 + .03 * Math.sin(t + i * 2)); rect(W * .62 - pw / 2 + Math.sin(t * .6 + i) * 6, py, pw, 1.5);
      });
      // ジャビル(首の長いコウノトリ — 水中に佇む3羽)
      const storks = [[.18, .68, .09], [.3, .74, .07], [.82, .66, .1]];
      for (const [sx, sy, ss] of storks) {
        const bx = W * sx, by = H * sy, sc = H * ss;
        // 体+首のシルエット
        c.fillStyle = '#e8e4dc'; c.beginPath(); c.ellipse(bx, by, sc * .5, sc * .28, 0, 0, 7); c.ellipse(bx, by, sc * .5, sc * .28, 0, 0, 7); c.fill(); SS('#e8e4dc'); lnW(sc * .14); c.beginPath(); c.moveTo(bx + sc * .35, by - sc * .1); c.quadraticCurveTo(bx + sc * .6, by - sc * .7, bx + sc * .5, by - sc * .95); c.stroke();
        // 黒い頭+赤い首輪
        c.fillStyle = '#202020'; ellP(bx + sc * .5, by - sc * .95, sc * .16, sc * .14); SS('#c03828'); lnW(sc * .06); c.beginPath(); c.moveTo(bx + sc * .38, by - sc * .78); c.lineTo(bx + sc * .44, by - sc * .6); c.stroke();
        // 嘴
        c.strokeStyle = '#202020'; lnW(sc * .05); c.beginPath(); c.moveTo(bx + sc * .58, by - sc * .97); c.lineTo(bx + sc * .78, by - sc * .92); c.stroke();
      }
      // 飛ぶ鳥の群れ(小さなV字)
      SS('#4a3a28'); lnW(1.5);
      times(5, i => {
        const bx = W * ((i * .17 + t * .008) % 1); const by = H * (.12 + (i % 3) * .06); c.beginPath(); c.moveTo(bx - 5, by); c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by); c.stroke();
      });
      // カピバラの影(水際に座る)
      FS('#5a4028'); c.beginPath(); c.ellipse(W * .55, H * .6, W * .03, H * .02, 0, 0, 7); c.ellipse(W * .55, H * .6, W * .03, H * .02, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .57, H * .585, W * .012, H * .012, 0, 0, 7); c.ellipse(W * .57, H * .585, W * .012, H * .012, 0, 0, 7); c.fill();
    } else if (pr === 'deadvlei') {
      // デッドフレイ: 白い粘土盤+枯れ木の黒い骨格+赤い砂丘の壁
      // 空(深い青)
      const gr = c.createLinearGradient(0, 0, 0, H * .55); gr.addColorStop(0, '#3050a0'); gr.addColorStop(1, '#7898c8'); FS(gr); rect(0, 0, W, H * .55);
      // 灼熱の太陽
      c.fillStyle = '#f8e8c0'; dot(.75,.12,W * .045);
      // 赤い砂丘の壁(ナミブの大砂丘 — 稜線が光る)
      FS('#c05828'); poly([0,H * .55],[W * .15,H * .18,W * .45,H * .3],[W * .6,H * .36,W * .78,H * .22],[W * .9,H * .16,W,H * .28],[W,H * .58],[W,H * .58],[0,H * .58]);
      // 砂丘の陰(右斜面の暗部)
      FS('#903818'); poly([W * .45,H * .3],[W * .6,H * .36,W * .78,H * .22],[W * .9,H * .16,W,H * .28],[W,H * .58],[W,H * .58],[W * .5,H * .58],[W * .47,H * .45,W * .45,H * .3]);
      // 稜線のハイライト
      c.strokeStyle = '#e88848'; lnW(2); c.beginPath(); c.moveTo(0, H * .55); c.quadraticCurveTo(W * .15, H * .18, W * .45, H * .3); c.quadraticCurveTo(W * .6, H * .36, W * .78, H * .22); c.quadraticCurveTo(W * .9, H * .16, W, H * .28); c.stroke();
      // 白い粘土盤(明るい台地)
      const pg = c.createLinearGradient(0, H * .55, 0, H); pg.addColorStop(0, '#e8e0d0'); pg.addColorStop(1, '#c8bcA8'); FS(pg); rect(0, H * .55, W, H * .45);
      // 枯れ木の骨格(黒い枝々 — 幹から分岐する反復)
      const rngT = L.mulberry32(666); const trees = [[.15, .78, .16], [.4, .7, .2], [.62, .82, .13], [.85, .68, .18]];
      for (const [tx, ty, ts] of trees) {
        const bx = W * tx, by = H * ty, sc = H * ts;
        // 幹(太めの黒線 — 途中で分岐)
        SS('#181410'); lnW(Math.max(1.5, sc * .05)); c.beginPath(); c.moveTo(bx, by); const topX = bx + (rngT() - .5) * sc * .3; const topY = by - sc; c.lineTo(topX, topY); c.stroke();
        // 枝(3〜4本の分岐)
        const nb = 3 + Math.floor(rngT() * 2);
        times(nb, b => {
          const byf = .35 + b * .18; const sx = bx + (topX - bx) * byf; const sy = by + (topY - by) * byf; const dir = b % 2 ? 1 : -1; lnW(Math.max(1, sc * .03)); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + dir * sc * (.3 + rngT() * .25), sy - sc * (.15 + rngT() * .2)); c.stroke();
          // 小枝
          c.lineWidth = Math.max(1, sc * .015); c.beginPath(); c.moveTo(sx + dir * sc * .2, sy - sc * .12); c.lineTo(sx + dir * sc * .38, sy - sc * .05); c.stroke();
        });
        // 木の影(盤上の薄い伸び影)
        FS('rgba(120,100,80,0.3)'); ellP(bx + sc * .5, by + 2, sc * .6, sc * .04);
      }
      // 盤のひび(乾燥した土の割れ目)
      SS('rgba(150,135,115,0.5)'); lnW(1); scat(21, 10, (rngC, i) => {
        const cx0 = W * rngC(), cy0 = H * (.6 + rngC() * .35); c.beginPath(); c.moveTo(cx0, cy0); c.lineTo(cx0 + (rngC() - .5) * W * .04, cy0 + H * .02 * rngC()); c.stroke();
      });
    } else if (pr === 'uyuni') {
      // ウユニ鏡張り: 星空と天の川を完全に写す薄水の塩原
      const gr = c.createLinearGradient(0, 0, 0, H * .5); gr.addColorStop(0, '#12082e'); gr.addColorStop(1, '#3a2058'); FS(gr); rect(0, 0, W, H * .5);
      // 天の川(斜めの淡い帯+密集星)
      FS('rgba(200,180,230,0.08)'); c.save(); c.translate(W * .5, H * .22); c.rotate(-.3); rect(-W, -H * .06, W * 2, H * .12); c.restore();
      // 星(上部の密集帯+散りばめ)
      scat(777, 90, (rngU, i) => {
        const sx = W * rngU(); const sy = H * .48 * Math.pow(rngU(), 1.4);
        FS(`rgba(255,250,240,${.3 + rngU() * .7})`);
        rect(sx, sy, 1.5, 1.5);
      });
      // 大きな星(きらめき十字)
      for (const [bx, by] of [[.2, .08], [.55, .15], [.8, .3]]) {
        FS('#fff8e8'); rect(W * bx - 3, H * by, 7, 1.5); rect(W * bx, H * by - 3, 1.5, 7);
      }
      // 遠くの山影(薄いシルエット)
      FS('#241040'); poly([0,H * .5],[W * .12,H * .46],[W * .25,H * .5],[W * .7,H * .5],[W * .82,H * .47],[W * .95,H * .5]);
      // 鏡の水面(下半 — 空の反転グラデ)
      const mg = c.createLinearGradient(0, H * .5, 0, H); mg.addColorStop(0, '#3a2058'); mg.addColorStop(1, '#150a30'); FS(mg); rect(0, H * .5, W, H * .5);
      // 星の映り込み(下部)
      scat(777, 90, (rngV, i) => {
        const sx = W * rngV(); const sy = H - H * .48 * Math.pow(rngV(), 1.4);
        FS(`rgba(255,250,240,${.15 + rngV() * .35})`);
        rect(sx, sy, 1.5, 1.5);
      });
      // 天の川の映り込み
      c.fillStyle = 'rgba(200,180,230,0.05)'; c.save(); c.translate(W * .5, H * .78); c.rotate(-.3); rect(-W, -H * .06, W * 2, H * .12); c.restore();
      // 水面の横筋(薄い波紋 — ゆらめく)
      SS('rgba(200,190,220,0.18)'); lnW(1);
      for (let i = 1; i <= 6; i++) {
        const ry = H * (.5 + i * .075); c.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const yy = ry + Math.sin(x * .02 + t + i) * 1.5; x ? c.lineTo(x, yy) : c.moveTo(x, yy);
        }
        c.stroke();
      }
    } else if (pr === 'bagan') {
      // バガン: 朝霧の遺跡平野 — 連なる仏塔+漂う気球+朝焼け
      sky([[0,'#e88850'],[.4,'#c07858'],[1,'#6a4838']]);
      // 朝日(低い薄明の円)
      FS('#f8d8a0'); dot(.6,.32,W * .05);
      // 気球3機(流れ漂う)
      const rngG = L.mulberry32(90); const balloons = [[.15, .18, .05, 0], [.4, .12, .04, 2.1], [.78, .22, .06, 4.2]];
      for (const [bx, by, bs, ph] of balloons) {
        const gx = W * (bx + .02 * Math.sin(t * .1 + ph)); const gy = H * (by + .02 * Math.sin(t * .25 + ph)); const gs = H * bs; FS('#a04038'); c.beginPath(); c.beginPath(); c.arc(gx, gy, gs, Math.PI * .15, Math.PI * .85); c.beginPath(); c.arc(gx, gy, gs, Math.PI * .15, Math.PI * .85); c.fill(); poly([gx - gs * .75,gy + gs * .1],[gx,gy + gs * 1.5,gx + gs * .75,gy + gs * .1]);
        // 吊り籠
        c.fillStyle = '#4a3020'; rect(gx - gs * .12, gy + gs * 1.1, gs * .24, gs * .16);
      }
      // 遠くの塔群(薄い靄の層 — 低い連なり)
      FS('rgba(120,80,60,0.6)'); c.beginPath(); c.moveTo(0, H * .6); const rngD = L.mulberry32(55);
      for (let x = 0; x < W; x += W * .04) {
        const th = H * (.04 + rngD() * .06); c.lineTo(x, H * .6 - th); c.lineTo(x + W * .01, H * .6 - th); c.lineTo(x + W * .01, H * .6);
      }
      c.lineTo(W, H * .62); c.lineTo(W, H * .62); c.lineTo(0, H * .62); c.closePath(); c.closePath(); c.fill();
      // 主な仏塔5基(尖った屋根のシルエット)
      const stupas = [[.1, .12], [.3, .09], [.5, .14], [.7, .1], [.9, .08]];
      for (const [sx, ss] of stupas) {
        const bx = W * sx, base = H * .68, bs = H * ss;
        // 台座+円筒の身+尖塔
        c.fillStyle = '#3a2418'; rect(bx - bs * .5, base - bs * .35, bs, bs * .35); ellP(bx, base - bs * .45, bs * .38, bs * .25); poly([bx - bs * .3,base - bs * .6],[bx,base - bs * 1.15],[bx + bs * .3,base - bs * .6]); // 台座 // 円身 // 尖塔
      }
      // 地面(暗い平野)
      const gg = c.createLinearGradient(0, H * .62, 0, H); gg.addColorStop(0, '#4a3228'); gg.addColorStop(1, '#241410'); FS(gg); rect(0, H * .62, W, H * .38);
      // 霧の帯2枚(塔の間を漂う)
      FS('rgba(230,180,140,0.15)');
      times(2, i => {
        ell((.3 + i * .4 + .02 * Math.sin(t * .3 + i)), (.58 + i * .05), W * .25, H * .03);
      });
    } else if (pr === 'torres') {
      // トーレス・デル・パイネ: 花崗岩の3塔+ターコイズ湖+グアナコ
      sky([[0,'#c0d8e8'],[.45,'#8aa8c0'],[1,'#3a5c68']]);
      // レンズ雲(塔の上に静止する層雲)
      FS('rgba(240,240,235,0.7)'); c.beginPath(); c.ellipse(W * .5, H * .18, W * .2, H * .025, 0, 0, 7); c.ellipse(W * .5, H * .18, W * .2, H * .025, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .52, H * .15, W * .13, H * .018, 0, 0, 7); c.ellipse(W * .52, H * .15, W * .13, H * .018, 0, 0, 7); c.fill();
      // 3つの花崗岩塔(中央の尖峰群)
      const towers = [[.38, .58, .3], [.5, .15, .42], [.62, .56, .26]];
      for (const [tx, ty, th] of towers) {
        const bx = W * tx, by = H * ty, bh = H * th;
        // 塔身(垂直の石柱)
        FS('#585048'); poly([bx - bh * .16,H * .58],[bx - bh * .14,H * .58 - bh],[bx,H * .58 - bh * 1.15,bx + bh * .14,H * .58 - bh],[bx + bh * .16,H * .58]);
        // 塔の陰(右側の暗筋)
        FS('#38302a'); poly([bx + bh * .04,H * .58 - bh * 1.05],[bx + bh * .14,H * .58 - bh],[bx + bh * .16,H * .58],[bx + bh * .04,H * .58]);
      }
      // 麓の丘(草の緑)
      FS('#4a6a48'); poly([0,H * .58],[W * .2,H * .55,W * .5,H * .58],[W * .8,H * .61,W,H * .57],[W,H * .7],[W,H * .7],[0,H * .7]);
      // ターコイズ湖(パタゴニアの碧い水)
      const lg = c.createLinearGradient(0, H * .62, 0, H); lg.addColorStop(0, '#58b8c0'); lg.addColorStop(1, '#2a7080'); FS(lg); rect(0, H * .62, W, H * .38);
      // 湖畔の砂州(手前の浜線)
      FS('#8a7a60'); poly([0,H * .68],[W * .5,H * .66,W,H * .7],[W,H * .72],[W,H * .72],[0,H * .72]);
      // 塔の映り込み(薄い反転影)
      FS('rgba(80,70,60,0.25)');
      for (const [tx, ty, th] of towers) {
        const bx = W * tx, bh = H * th; poly([bx - bh * .14,H * .64],[bx - bh * .1,H * .64 + bh * .4],[bx + bh * .1,H * .64 + bh * .4],[bx + bh * .14,H * .64]);
      }
      // グアナコ2頭(湖畔のシルエット)
      const guanacos = [[.22, .665, .05], [.7, .655, .04]];
      for (const [gx, gy, gs] of guanacos) {
        const bx = W * gx, by = H * gy, sc = H * gs; FS('#3a2a1a'); c.beginPath(); c.ellipse(bx, by, sc * .55, sc * .3, 0, 0, 7); c.ellipse(bx, by, sc * .55, sc * .3, 0, 0, 7); c.fill(); SS('#3a2a1a'); lnW(sc * .12); c.beginPath(); c.moveTo(bx + sc * .3, by - sc * .1); c.lineTo(bx + sc * .5, by - sc * .75); c.stroke(); c.beginPath(); c.ellipse(bx + sc * .52, by - sc * .78, sc * .14, sc * .1, 0, 0, 7); c.ellipse(bx + sc * .52, by - sc * .78, sc * .14, sc * .1, 0, 0, 7); c.fill(); SS('#3a2a1a'); lnW(sc * .06); // 体 // 長い首 // 頭
        ([-.3, -.1, .15, .35]).forEach(lx => {
          c.beginPath(); c.moveTo(bx + lx * sc, by + sc * .2); c.lineTo(bx + lx * sc, by + sc * .7); c.stroke(); // 4本脚
        });
      }
    } else if (pr === 'lauterbrunnen') {
      // ラウターブルンネン: 氷河のU字谷 — 断崖の滝群+緑の谷床+教会
      sky([[0,'#a8c8dc'],[.5,'#7a9cb8'],[1,'#3a5a48']]);
      // 左の断崖壁(垂直の暗い岩)
      FS('#4a4a42'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .12, 0); c.lineTo(W * .18, H * .3); c.lineTo(W * .14, H * .62); c.lineTo(0, H * .7); c.closePath(); c.closePath(); c.fill();
      // 右の断崖壁
      c.fillStyle = '#42403a'; c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .86, 0); c.lineTo(W * .8, H * .35); c.lineTo(W * .85, H * .62); c.lineTo(W, H * .72); c.closePath(); c.closePath(); c.fill();
      // 崖の岩目(横筋)
      SS('rgba(120,115,105,0.5)'); lnW(1);
      times(6, i => {
        const ry = H * (.08 + i * .08); c.beginPath(); c.moveTo(0, ry + i * 3); c.lineTo(W * .16, ry); c.stroke(); c.beginPath(); c.moveTo(W, ry + i * 2); c.lineTo(W * .84, ry); c.stroke();
      });
      // 遠くの谷奥(明るい開口)
      FS('#c8d8d0'); poly([W * .18,H * .3],[W * .8,H * .35],[W * .75,H * .5],[W * .25,H * .5]);
      // スタウバッハの滝(細い白い帯 — 流れ落ちる)
      SS('rgba(240,245,250,0.85)'); lnW(W * .008); c.beginPath(); c.moveTo(W * .155, H * .28); c.quadraticCurveTo(W * .17 + S(2) * 2, H * .42, W * .16, H * .58); c.stroke();
      // 滝の飛沫(底部の白い霧)
      FS('rgba(240,245,250,0.4)'); ell(.16, .58, W * .03, H * .015 + S(3) * 2);
      // 第2の滝(右側の細筋)
      SS('rgba(240,245,250,0.7)'); lnW(W * .005); c.beginPath(); c.moveTo(W * .82, H * .3); c.quadraticCurveTo(W * .84, H * .45, W * .83, H * .58); c.stroke();
      // 谷床の牧草地
      const gg = c.createLinearGradient(0, H * .5, 0, H); gg.addColorStop(0, '#6a9a58'); gg.addColorStop(1, '#3a6a38'); FS(gg); poly([0,H * .7],[W * .5,H * .55,W,H * .72],[W,H],[W,H],[0,H]);
      // 谷の小川(蛇行する白い筋)
      SS('rgba(220,235,240,0.7)'); lnW(W * .006); c.beginPath(); c.moveTo(W * .5, H * .56); c.quadraticCurveTo(W * .42, H * .7, W * .55, H * .82); c.quadraticCurveTo(W * .6, H * .9, W * .5, H); c.stroke();
      // 教会(尖塔の小さな村)
      const cx0 = W * .55, cy0 = H * .7; FS('#e8e0d0'); rect(cx0 - W * .02, cy0, W * .04, H * .05); poly([cx0 - W * .025,cy0],[cx0,cy0 - H * .05],[cx0 + W * .025,cy0]); // 塔の身 // 尖塔
      // 周辺の家々(小さな屋根)
      FS('#7a5a40');
      ([.48, .63, .7]).forEach(hx2 => {
        poly([W * hx2,cy0 + H * .02],[W * (hx2 + .015),cy0 + H * .005],[W * (hx2 + .03),cy0 + H * .02],[W * (hx2 + .03),cy0 + H * .045],[W * hx2,cy0 + H * .045]);
      });
    } else if (pr === 'hallstatt') {
      // ハルシュタット: 湖畔の山村 — 彩色の家々+教会の尖塔+山影+白鳥
      sky([[0,'#b8d4e0'],[.5,'#8aaabb'],[1,'#4a6878']]);
      // 背景の山(霧の重畳)
      FS('#6a8898'); poly([0,H * .5],[W * .25,H * .15,W * .5,H * .3],[W * .75,H * .18,W,H * .42],[W,H * .55],[W,H * .55],[0,H * .55]);
      // 山の霧
      c.fillStyle = 'rgba(230,235,238,0.35)'; c.beginPath(); c.ellipse(W * .5, H * .4, W * .3, H * .03, 0, 0, 7); c.ellipse(W * .5, H * .4, W * .3, H * .03, 0, 0, 7); c.fill();
      // 湖畔の村(彩色の家々 — 連なる屋根)
      const houses = [[.1, '#c07858', .08], [.18, '#d8a868', .06], [.26, '#a86050', .07], [.34, '#c89070', .05]];
      for (const [hx2, col, hs] of houses) {
        const bx = W * hx2, by = H * .5, hs2 = H * hs;
        // 家の身(台形)
        FS(col); poly([bx - hs2 * .5,by],[bx - hs2 * .45,by - hs2 * .7],[bx + hs2 * .45,by - hs2 * .7],[bx + hs2 * .5,by]);
        // 切妻の屋根
        c.fillStyle = '#4a3828'; poly([bx - hs2 * .55,by - hs2 * .68],[bx,by - hs2 * 1.1],[bx + hs2 * .55,by - hs2 * .68]);
        // 窓(小さな四角)
        FS('#f0e8d8'); rect(bx - hs2 * .12, by - hs2 * .5, hs2 * .08, hs2 * .1);
      }
      // 教会の尖塔(村の奥に高く立つ)
      const chx = W * .45, chy = H * .5; FS('#e8e4da'); poly([chx - W * .018,chy],[chx - W * .015,chy - H * .12],[chx + W * .015,chy - H * .12],[chx + W * .018,chy]); FS('#4a3828'); poly([chx - W * .022,chy - H * .12],[chx,chy - H * .18],[chx + W * .022,chy - H * .12]);
      // 湖(鏡の水面)
      const lg = c.createLinearGradient(0, H * .52, 0, H); lg.addColorStop(0, '#7aa0b0'); lg.addColorStop(1, '#3a5c6a'); FS(lg); rect(0, H * .52, W, H * .48);
      // 家と山の映り込み(薄い反転)
      FS('rgba(120,140,150,0.2)');
      for (const [hx2, col, hs] of houses) {
        const bx = W * hx2, hs2 = H * hs; rect(bx - hs2 * .45, H * .52, hs2 * .9, hs2 * .6);
      }
      FS('rgba(220,220,210,0.25)'); rect(chx - W * .015, H * .52, W * .03, H * .1);
      // 白鳥2羽(湖面の白い影)
      const swans = [[.3, .62, .04], [.55, .68, .035]];
      for (const [sx, sy, ss] of swans) {
        const bx = W * sx, by = H * sy, sc = H * ss;
        // 体(水面の楕円)
        FS('#f0f0ea'); c.beginPath(); c.ellipse(bx, by, sc * .5, sc * .18, 0, 0, 7); c.ellipse(bx, by, sc * .5, sc * .18, 0, 0, 7); c.fill();
        // 首(S字の曲線)
        SS('#f0f0ea'); lnW(sc * .1); c.beginPath(); c.moveTo(bx + sc * .3, by - sc * .05); c.quadraticCurveTo(bx + sc * .55, by - sc * .4, bx + sc * .4, by - sc * .6); c.stroke();
        // 頭
        c.beginPath(); c.ellipse(bx + sc * .4, by - sc * .6, sc * .1, sc * .08, 0, 0, 7); c.ellipse(bx + sc * .4, by - sc * .6, sc * .1, sc * .08, 0, 0, 7); c.fill();
        // 波紋(白鳥の周りの淡い円弧)
        SS('rgba(200,220,230,0.3)'); lnW(1); c.beginPath(); c.ellipse(bx, by + sc * .1, sc * .9, sc * .15, 0, 0, Math.PI); c.stroke();
      }
    } else if (pr === 'petra') {
      // ペトラ: 薔薇色の岩壁の間に立つエル・ハズネの彫刻ファサード
      sky([[0,'#e8b890'],[.5,'#c08868'],[1,'#8a5a44']]);
      // シーク(両側の切り立つ岩壁)
      for (const s of [-1, 1]) {
        FS(s < 0 ? '#9a6a50' : '#8a5a44'); c.beginPath(); const edge = s < 0 ? 0 : W; const inner = s < 0 ? .28 : .72; c.moveTo(edge, 0); c.quadraticCurveTo(W * inner - s * W * .02, H * .3, W * inner, H); c.lineTo(edge, H); c.closePath(); c.closePath(); c.fill();
        // 岩の縞(地層の曲線)
        SS('rgba(120,70,50,0.5)'); lnW(H * .008);
        for (let i = 1; i <= 4; i++) {
          c.beginPath(); c.moveTo(edge, H * i * .18); c.quadraticCurveTo(W * inner * .6, H * (i * .18 + .04), W * inner, H * i * .16); c.stroke();
        }
      }
      // エル・ハズネのファサード(中央の彫刻神殿)
      const tx = W * .5, ty = H * .12, tw = W * .2, th = H * .7;
      // 本体(岩と同化する砂岩)
      FS('#d8a078'); rect(tx - tw * .5, ty + th * .25, tw, th * .75);
      // 上部のペディメント(半円+翼)
      FS('#c89070'); poly([tx - tw * .5,ty + th * .25],[tx - tw * .42,ty + th * .12],[tx,ty + th * .08],[tx + tw * .42,ty + th * .12],[tx + tw * .5,ty + th * .25]);
      // 中央の丸堂(Tholos)
      c.beginPath(); c.arc(tx, ty + th * .1, tw * .08, 0, 7); c.arc(tx, ty + th * .1, tw * .08, 0, 7); c.fill();
      // 柱6本(正面の列柱)
      FS('#e8b088');
      times(6, i => {
        const px = tx - tw * .4 + i * tw * .16; rect(px, ty + th * .3, tw * .05, th * .6);
        // 柱頭(小さな横帯)
        rect(px - tw * .01, ty + th * .28, tw * .07, th * .03);
      });
      // 入口(中央の黒い開口)
      FS('#3a2418'); rect(tx - tw * .06, ty + th * .72, tw * .12, th * .28);
      // 岩の緑(シークの隙間の草)
      FS('#5a7848'); c.beginPath(); c.ellipse(W * .32, H * .95, W * .04, H * .015, -.2, 0, 7); c.ellipse(W * .32, H * .95, W * .04, H * .015, -.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .68, H * .96, W * .035, H * .012, .15, 0, 7); c.ellipse(W * .68, H * .96, W * .035, H * .012, .15, 0, 7); c.fill();
    } else if (pr === 'machupicchu') {
      // マチュピチュ: 尾根の石の街+ワイナピチュの尖峰+段々畑+流れる雲
      sky([[0,'#a8c8d8'],[.45,'#7898a8'],[1,'#3a5c48']]);
      // ワイナピチュ(背景の鋭い峰)
      FS('#4a7860'); poly([W * .55,H * .55],[W * .68,H * .1],[W * .82,H * .55]);
      // 峰の陰(右側を暗く)
      FS('#3a6850'); poly([W * .68,H * .1],[W * .82,H * .55],[W * .7,H * .55]);
      // 連なる遠山(霧の層)
      FS('#6a9880'); poly([0,H * .55],[W * .18,H * .38],[W * .18,H * .38],[W * .32,H * .5],[W * .45,H * .42],[W * .45,H * .42],[W * .55,H * .55]);
      // 都市の尾根(手前の鞍部 — 石の街が載る)
      FS('#5a8858'); poly([0,H * .62],[W * .3,H * .5,W * .55,H * .56],[W * .7,H * .6,W,H * .58],[W,H],[W,H],[0,H]);
      // 段々畑(等高線の緑の段)
      FS('#7aa860');
      times(5, i => {
        const ty = H * (.64 + i * .05); poly([0,ty],[W * .35,ty - H * .02,W * .6,ty + H * .01],[W * .6,ty + H * .02],[W * .35,ty,0,ty + H * .025]);
      });
      // 石の街(尾根の灰色の塊+方形の壁)
      FS('#8a8878'); const blocks = [[.3, .52, .06], [.4, .5, .05], [.48, .53, .055], [.56, .51, .045]];
      for (const [bx, by, bs] of blocks) {
        const px = W * bx, py = H * by, sc = H * bs; rect(px - sc * .5, py - sc * .5, sc, sc);
        // 窓(小さな黒点)
        FS('#3a3830'); rect(px - sc * .1, py - sc * .1, sc * .08, sc * .12); FS('#8a8878');
      }
      // 流れる雲(峰を巻く白い帯)
      const cl = (t * .03) % 1; FS('rgba(235,240,240,0.5)');
      times(3, i => {
        const cx = W * ((.6 + i * .15 + cl) % 1.2 - .1); ellP(cx, H * (.3 + i * .08), W * (.06 + i * .015), H * .012);
      });
    } else if (pr === 'dolomites') {
      // ドロミテ: 灰白色の鋸歯岩峰+緑の高山草地+針葉樹+山小屋
      sky([[0,'#a8c8e0'],[.5,'#c8d8e0'],[1,'#5a8858']]);
      // 岩峰群(灰白の鋸歯 — 3本の塔)
      FS('#b8b0a0'); const peaks = [[.2, .42, .12], [.45, .36, .18], [.7, .44, .14]];
      for (const [px, py, pw] of peaks) {
        const bx = W * px, bw = W * pw, by = H * py; poly([bx - bw,H * .62],[bx - bw * .3,by],[bx,by - H * .04],[bx + bw * .25,by + H * .02],[bx + bw,H * .62]);
        // 岩の縦溝(陰の筋)
        SS('rgba(90,80,70,0.5)'); lnW(H * .006);
        for (let i = -1; i <= 1; i++) {
          c.beginPath(); c.moveTo(bx + i * bw * .3, by + H * .02); c.lineTo(bx + i * bw * .4, H * .62); c.stroke();
        }
      }
      // 峰の夕照(左端の薄いオレンジ)
      FS('rgba(230,180,140,0.3)'); poly([W * .2 - W * .12,H * .62],[W * .2 - W * .036,H * .42],[W * .2,H * .38],[W * .2 + W * .12,H * .62]);
      // 高山草地(緑の大地)
      const mg = c.createLinearGradient(0, H * .62, 0, H); mg.addColorStop(0, '#6a9860'); mg.addColorStop(1, '#3a5c38'); FS(mg); rect(0, H * .62, W, H * .38);
      // 針葉樹(山小屋の背後の黒い三角列)
      FS('#2a4a30');
      times(6, i => {
        const tx = W * (.62 + i * .06), ty = H * (.68 + (i % 2) * .02), ts = H * .05; poly([tx,ty - ts],[tx - ts * .4,ty],[tx + ts * .4,ty]);
      });
      // 山小屋(茶の三角屋根+白い身)
      const hx3 = W * .3, hy3 = H * .72, hs3 = H * .09; FS('#e8e0d0'); rect(hx3 - hs3 * .4, hy3 - hs3 * .35, hs3 * .8, hs3 * .35); FS('#5a4030'); poly([hx3 - hs3 * .5,hy3 - hs3 * .33],[hx3,hy3 - hs3 * .8],[hx3 + hs3 * .5,hy3 - hs3 * .33]);
      // 窓
      c.fillStyle = '#4a3828'; rect(hx3 - hs3 * .12, hy3 - hs3 * .25, hs3 * .1, hs3 * .12);
      // 草の花(点々)
      FS('#e8e8d0'); scat(21, 20, (rngD2, i) => {
        const fx = W * rngD2(), fy = H * (.68 + rngD2() * .28); c.beginPath(); c.ellipse(fx, fy, H * .003, H * .003, 0, 0, 7); c.ellipse(fx, fy, H * .003, H * .003, 0, 0, 7); c.fill();
      });
    } else if (pr === 'zhangjiajie') {
      // 張家界: 石英砂岩の柱林+柱頭の松+流れる雲霧
      sky([[0,'#b8d0d8'],[.45,'#8aaba8'],[1,'#3a5848']]);
      // 遠景の柱群(薄い層)
      FS('rgba(120,140,130,0.45)'); const farPillars = [[.08, .5, .05, .35], [.22, .45, .04, .3], [.55, .48, .05, .32], [.88, .5, .045, .3]];
      for (const [px, py, pw, ph] of farPillars) {
        const bx = W * px, bw = W * pw, bh = H * ph; rect(bx - bw / 2, H * py - 0, bw, bh);
      }
      // 手前の巨大な柱(3本、先端に松)
      const pillars = [[.15, .18, .08, .62], [.5, .12, .1, .68], [.85, .2, .075, .6]];
      for (const [px, py, pw, ph] of pillars) {
        const bx = W * px, bw = W * pw, top = H * py;
        // 柱本体(下端まで伸びる縦長台形、下部ほぼ垂直)
        FS('#7a8878'); poly([bx - bw * .45,top],[bx - bw * .5,top + H * .3,bx - bw * .38,top + H * ph],[bx + bw * .38,top + H * ph],[bx + bw * .5,top + H * .3,bx + bw * .45,top]);
        // 岩面の横縞(層理)
        SS('rgba(60,70,60,0.4)'); lnW(H * .004);
        for (let i = 1; i <= 5; i++) {
          c.beginPath(); c.moveTo(bx - bw * .46, top + i * ph * .12); c.quadraticCurveTo(bx, top + i * ph * .12 + H * .01, bx + bw * .46, top + i * ph * .12); c.stroke();
        }
        // 柱頭の緑(松のキャップ)
        FS('#3a6848'); c.beginPath(); c.ellipse(bx, top, bw * .5, H * .02, 0, 0, 7); c.ellipse(bx, top, bw * .5, H * .02, 0, 0, 7); c.fill();
      }
      // 雲霧(柱の間を流れる白い層、2層)
      FS('rgba(230,238,240,0.55)');
      times(2, i => {
        const cy = H * (.48 + i * .18); const drift = ((t * .02 + i * .4) % 1.4 - .2) * W; c.beginPath(); c.ellipse(drift, cy, W * .35, H * .05, 0, 0, 7); c.ellipse(drift, cy, W * .35, H * .05, 0, 0, 7); c.fill();
      });
      // 谷底の霧
      c.fillStyle = 'rgba(220,230,232,0.5)'; c.beginPath(); c.ellipse(W * .5, H * .95, W * .7, H * .1, 0, 0, 7); c.ellipse(W * .5, H * .95, W * .7, H * .1, 0, 0, 7); c.fill();
    } else if (pr === 'halong') {
      // ハロン湾: 緑の海+石灰岩の奇岩群+帆船ジャンク+海鳥
      sky([[0,'#a8ccd8'],[.45,'#7aa8a8'],[1,'#3a6858']]);
      // 遠景の奇岩(薄い層)
      FS('rgba(100,130,110,0.5)'); const far = [[.1, .52, .08, .12], [.3, .5, .06, .1], [.6, .52, .09, .13], [.9, .5, .07, .11]];
      for (const [px, py, pw, ph] of far) {
        const bx = W * px; poly([bx - W * pw * .5,H * py + H * .02],[bx - W * pw * .3,H * (py - ph),bx,H * (py - ph - .03)],[bx + W * pw * .3,H * (py - ph),bx + W * pw * .5,H * py + H * .02]);
      }
      // 手前の大岩峰(左と右)
      FS('#5a7868'); const near = [[.18, .3, .12, .35], [.78, .34, .1, .3]];
      for (const [px, py, pw, ph] of near) {
        const bx = W * px; poly([bx - W * pw * .5,H * .62],[bx - W * pw * .4,H * py,bx,H * (py - .04)],[bx + W * pw * .4,H * py,bx + W * pw * .5,H * .62]);
        // 岩頂の緑
        c.fillStyle = '#3a5848'; c.beginPath(); c.ellipse(bx, H * (py - .04), W * pw * .12, H * .015, 0, 0, 7); c.ellipse(bx, H * (py - .04), W * pw * .12, H * .015, 0, 0, 7); c.fill(); FS('#5a7868');
      }
      // 海(翡翠の水面)
      const sg = c.createLinearGradient(0, H * .55, 0, H); sg.addColorStop(0, '#6a9888'); sg.addColorStop(1, '#2a4a44'); FS(sg); rect(0, H * .55, W, H * .45);
      // 岩の映り込み
      c.fillStyle = 'rgba(90,120,104,0.25)';
      for (const [px, py, pw] of near) {
        rect(W * px - W * pw * .4, H * .62, W * pw * .8, H * .1);
      }
      // ジャンク帆船2隻(帆を張った平底船)
      const junks = [[.42, .7, .07, .05], [.65, .75, .05, .04]];
      for (const [jx, jy, js, sjs] of junks) {
        const bx = W * jx, by = H * jy, sc = H * js, ss = H * sjs;
        // 船体(反り上がった両端)
        FS('#4a3428'); poly([bx - sc * .6,by],[bx - sc * .7,by - sc * .15,bx - sc * .5,by - sc * .18],[bx + sc * .5,by - sc * .18],[bx + sc * .7,by - sc * .15,bx + sc * .6,by],[bx,by + sc * .12,bx - sc * .6,by]);
        // 帆(扇形のバテン帆)
        FS('#c89058'); poly([bx,by - sc * .2],[bx + ss * .7,by - sc * 1.4],[bx + ss * .85,by - sc * .3]);
        // 帆の骨(バテンの横線)
        SS('#8a6038'); lnW(Math.max(1, H * .004));
        for (let i = 1; i <= 3; i++) {
          c.beginPath(); c.moveTo(bx + ss * .12 * i, by - sc * (.2 + .3 * i)); c.lineTo(bx + ss * (.7 + .04 * i), by - sc * (.3 + .35 * i)); c.stroke();
        }
        // 水面の影
        c.fillStyle = 'rgba(40,60,55,0.3)'; c.beginPath(); c.ellipse(bx, by + sc * .08, sc * .5, sc * .06, 0, 0, 7); c.ellipse(bx, by + sc * .08, sc * .5, sc * .06, 0, 0, 7); c.fill();
      }
      // 海鳥(空の小さな弧)
      SS('rgba(240,245,245,0.7)'); lnW(Math.max(1, H * .005)); const birds = [[.5, .2], [.57, .17], [.45, .24]];
      for (const [bx2, by2] of birds) {
        c.beginPath(); c.moveTo(W * bx2 - W * .015, H * by2); c.quadraticCurveTo(W * bx2, H * (by2 - .02), W * bx2 + W * .015, H * by2); c.stroke();
      }
    } else if (pr === 'vinicunca') {
      // ビニクンカ: 虹の山 — 斜めの縞模様(赤/金/緑/紫)+谷間の登山道
      sky([[0,'#a8c8d8'],[.4,'#88a8b0'],[1,'#4a6a50']]);
      // 主な峰(斜めに走る山体)
      FS('#c08858'); poly([0,H * .75],[W * .3,H * .35,W * .65,H * .3],[W * .85,H * .32,W,H * .55],[W,H],[0,H]);
      // 虹の縞(山稜に沿う斜めバンド、赤→金→ターコイズ→栗)
      const bands = ['#b05040', '#d8a050', '#78a088', '#885858', '#c89858'];
      times(bands.length, i => {
        FS(bands[i]); const off = i * .045; poly([0,H * (.75 - off)],[W * .3,H * (.35 - off),W * .65,H * (.3 - off * .5)],[W * .85,H * (.32 - off * .4),W,H * (.55 - off)],[W,H * (.55 - off + .04)],[W * .85,H * (.32 - off * .4 + .04),W * .65,H * (.3 - off * .5 + .04)],[W * .3,H * (.35 - off + .04),0,H * (.75 - off + .04)]);
      });
      // 山体を再描いて縞を上端だけ残す(下半分は埋め戻す)
      FS('#c08858'); poly([0,H * .62],[W * .35,H * .5,W * .7,H * .55],[W,H * .68],[W,H],[0,H]);
      // 谷(右手前の深い渓)
      FS('#4a6848'); poly([W * .62,H],[W * .72,H * .68,W * .88,H * .58],[W,H * .55],[W,H * .55],[W,H]);
      // 登山道(ジグザグの細道)
      SS('#e8e0c8'); lnW(Math.max(1.5, H * .006)); c.beginPath(); c.moveTo(W * .3, H * .95); c.lineTo(W * .38, H * .8); c.lineTo(W * .38, H * .8); c.lineTo(W * .32, H * .68); c.lineTo(W * .42, H * .58); c.lineTo(W * .42, H * .58); c.lineTo(W * .5, H * .5); c.stroke();
      // 空の雲(薄い帯)
      FS('rgba(235,240,242,0.5)'); c.beginPath(); c.ellipse(W * .7, H * .18, W * .2, H * .02, 0, 0, 7); c.ellipse(W * .7, H * .18, W * .2, H * .02, 0, 0, 7); c.fill();
    } else if (pr === 'lofoten') {
      // ロフォーテン: 鋸歯の連峰+ターコイズのフィヨルド+赤いロルブー小屋+漁船
      sky([[0,'#98bcd8'],[.45,'#7aa0b8'],[1,'#3a5868']]);
      // 遠景の連峰(鋸歯のシルエット)
      FS('#4a6878'); c.beginPath(); c.moveTo(0, H * .55); const ridge = [[.08, .32], [.18, .45], [.28, .28], [.38, .48], [.5, .35], [.62, .5], [.72, .3], [.82, .44], [.92, .34]];
      for (const [rx, ry] of ridge) c.lineTo(W * rx, H * ry);
      c.lineTo(W, H * .55); c.lineTo(W, H * .55); c.lineTo(W, H * .65); c.lineTo(W, H * .55); c.lineTo(W, H * .65); c.lineTo(0, H * .65); c.closePath(); c.closePath(); c.fill();
      // 峰の雪(頂の白い点)
      FS('#e8eef0');
      for (let i = 0; i < ridge.length; i += 2) {
        const [rx, ry] = ridge[i]; poly([W * rx - W * .02,H * (ry + .06)],[W * rx,H * ry],[W * rx + W * .02,H * (ry + .06)]);
      }
      // フィヨルド(ターコイズの水面)
      const fg = c.createLinearGradient(0, H * .55, 0, H); fg.addColorStop(0, '#5a9890'); fg.addColorStop(1, '#2a4a50'); FS(fg); rect(0, H * .55, W, H * .45);
      // 岸辺(手前の草地)
      FS('#4a7048'); poly([0,H * .82],[W * .4,H * .78,W,H * .84],[W,H],[W,H],[0,H]);
      // 赤いロルブー小屋2棟(杭の上の白壁の家)
      const cabins = [[.15, .78], [.28, .8]];
      for (const [cx, cy] of cabins) {
        const bx = W * cx, by = H * cy, cs = H * .09;
        // 杭(水に立つ柱)
        SS('#3a2a20'); lnW(Math.max(1.5, H * .006));
        ([-.3, 0, .3]).forEach(dx => {
          c.beginPath(); c.moveTo(bx + cs * dx, by); c.lineTo(bx + cs * dx, by + cs * .2); c.stroke();
        });
        // 赤い家身
        c.fillStyle = '#a03828'; rect(bx - cs * .45, by - cs * .5, cs * .9, cs * .5);
        // 白い窓枠
        c.fillStyle = '#f0e8dc'; rect(bx - cs * .15, by - cs * .38, cs * .12, cs * .15);
        // 黒い切妻屋根
        c.fillStyle = '#2a2420'; poly([bx - cs * .55,by - cs * .48],[bx,by - cs * .85],[bx + cs * .55,by - cs * .48]);
      }
      // 漁船(水の上の小さな船)
      FS('#e8e4da'); const bx2 = W * .55, by2 = H * .72, bs = H * .04; poly([bx2 - bs,by2],[bx2,by2 + bs * .3,bx2 + bs,by2],[bx2 + bs * .7,by2 - bs * .3],[bx2 - bs * .7,by2 - bs * .3]);
      // 帆
      c.fillStyle = '#c8b890'; poly([bx2,by2 - bs * .3],[bx2 + bs * .8,by2 - bs * 1.4],[bx2 + bs * .9,by2 - bs * .35]);
      // 水面の映り込み(山の薄い逆さ影)
      FS('rgba(74,104,120,0.2)');
      for (let i = 0; i < ridge.length; i += 2) {
        const [rx, ry] = ridge[i]; rect(W * rx - W * .02, H * .55, W * .04, H * .08);
      }
    } else if (pr === 'borobudur') {
      // ボロブドゥール: 段の石壇+鐘型仏塔の列+ムラピ山+朝霧
      sky([[0,'#d8b890'],[.4,'#a88878'],[1,'#4a5840']]);
      // 背景のムラピ山(円錐+噴煙)
      FS('#6a6858'); poly([W * .55,H * .6],[W * .7,H * .28],[W * .88,H * .6]); FS('rgba(230,230,225,0.5)'); c.beginPath(); c.ellipse(W * .72, H * .22, W * .06, H * .02, .2, 0, 7); c.ellipse(W * .72, H * .22, W * .06, H * .02, .2, 0, 7); c.fill();
      // 段々の基壇(4段、下に広がる石積み)
      FS('#7a7060');
      times(4, i => {
        const ty = H * (.62 + i * .06), tw2 = W * (.5 - i * .08); rect(W * .5 - tw2 / 2, ty, tw2, H * .05);
      });
      // 鐘型仏塔の列(上壇に立つ格子の鐘)
      FS('#8a8070'); const stupas = [.3, .42, .58, .7];
      for (const sx of stupas) {
        const bx = W * sx, by = H * .6, bs = H * .05;
        // 鐘(逆さカップ)
        poly([bx - bs * .5,by],[bx - bs * .5,by - bs * .7,bx,by - bs * .75],[bx + bs * .5,by - bs * .7,bx + bs * .5,by]);
        // 尖塔(鐘の上の小さな傘)
        poly([bx - bs * .08,by - bs * .72],[bx,by - bs * 1.05],[bx + bs * .08,by - bs * .72]);
        // 格子孔(鐘の菱窓)
        FS('#3a3428');
        for (let i = -1; i <= 1; i++) {
          ellP(bx + i * bs * .22, by - bs * .35, bs * .06, bs * .08);
        }
        FS('#8a8070');
      }
      // 中央の大仏塔
      const mx = W * .5, my = H * .58, ms = H * .07; FS('#8a8070'); poly([mx - ms * .6,my],[mx - ms * .6,my - ms * .8,mx,my - ms * .85],[mx + ms * .6,my - ms * .8,mx + ms * .6,my]); poly([mx - ms * .1,my - ms * .85],[mx,my - ms * 1.25],[mx + ms * .1,my - ms * .85]);
      // 朝霧(壇の周りの薄い層)
      FS('rgba(230,225,210,0.4)'); c.beginPath(); c.ellipse(W * .5, H * .65, W * .55, H * .03, 0, 0, 7); c.ellipse(W * .5, H * .65, W * .55, H * .03, 0, 0, 7); c.fill();
      // 前景の緑(下の芝生)
      FS('#4a6840'); rect(0, H * .82, W, H * .18);
      // 椰子2本(遺跡の両脇)
      SS('#3a4a30'); lnW(Math.max(2, H * .008));
      ([.12, .88]).forEach(px => {
        const bx = W * px; c.beginPath(); c.moveTo(bx, H * .82); c.moveTo(bx, H * .82); c.lineTo(bx + W * .01, H * .68); c.moveTo(bx, H * .82); c.lineTo(bx + W * .01, H * .68); c.stroke(); FS('#3a5c38');
        ([-1.9, -1.3, -.8]).forEach(a => {
          poly([bx + W * .01,H * .68],[bx + W * .01 + Math.cos(a) * W * .05,H * .68 + Math.sin(a) * H * .06,bx + W * .01 + Math.cos(a) * W * .09,H * .68 + Math.sin(a) * H * .08 + H * .01],[bx + W * .01 + Math.cos(a) * W * .05,H * .68 + Math.sin(a) * H * .05,bx + W * .01,H * .68]);
        });
      });
    } else if (pr === 'socotra') {
      // ソコトラ: 竜血樹の傘冠+石灰岩の台地+白い砂浜+ターコイズの海
      sky([[0,'#88c8e0'],[.5,'#b8d8c8'],[1,'#e8dcB0']]);
      // 遠景の石灰岩台地(平らな断崖)
      FS('#b0a088'); poly([0,H * .5],[W * .2,H * .38],[W * .2,H * .38],[W * .55,H * .36],[W * .58,H * .42],[W * .58,H * .42],[W * .85,H * .44],[W,H * .5],[W,H * .5],[W,H * .6],[W,H * .5],[W,H * .6],[0,H * .6]);
      // 海(台地の手前)
      const sg = c.createLinearGradient(0, H * .55, 0, H * .78); sg.addColorStop(0, '#50b8b0'); sg.addColorStop(1, '#2a8880'); FS(sg); rect(0, H * .55, W, H * .23);
      // 白い砂浜(手前)
      FS('#f0e8d0'); poly([0,H * .78],[W * .5,H * .74,W,H * .8],[W,H],[W,H],[0,H]);
      // 竜血樹3本(傘状の緑冠+枝分かれの幹)
      const trees = [[.15, .8, .13], [.38, .82, .1], [.75, .79, .15]];
      for (const [tx, ty, ts] of trees) {
        const bx = W * tx, by = H * ty, tsz = H * ts;
        // 幹(下からY字に分かれる)
        SS('#7a6a55'); lnW(Math.max(1.5, tsz * .06)); c.beginPath(); c.moveTo(bx, by); c.moveTo(bx, by); c.lineTo(bx, by - tsz * .5); c.moveTo(bx, by); c.lineTo(bx, by - tsz * .5); c.stroke();
        ([-2.1, -1.6, -1.05]).forEach(a => {
          c.beginPath(); c.moveTo(bx, by - tsz * .5); c.lineTo(bx + Math.cos(a) * tsz * .3, by - tsz * .5 + Math.sin(a) * tsz * .3); c.stroke();
        });
        // 傘冠(平天のドーム)
        FS('#4a7c40'); c.beginPath(); c.ellipse(bx, by - tsz * .75, tsz * .45, tsz * .18, 0, Math.PI, 0); c.quadraticCurveTo(bx, by - tsz * .6, bx - tsz * .45, by - tsz * .75); c.closePath(); c.closePath(); c.fill();
        // 冠の網目(枝の影)
        SS('#3a6030'); lnW(Math.max(.8, tsz * .02));
        for (let i = -3; i <= 3; i++) {
          c.beginPath(); c.moveTo(bx + i * tsz * .12, by - tsz * .9); c.lineTo(bx + i * tsz * .14, by - tsz * .62); c.stroke();
        }
      }
      // ヤドリギの鳥(数羽の点)
      SS('#3a4a50'); lnW(Math.max(1, H * .004));
      for (const [fx, fy] of [[.3, .25], [.45, .2], [.62, .28], [.8, .18]]) {
        c.beginPath(); c.moveTo(W * fx - W * .008, H * fy); c.quadraticCurveTo(W * fx, H * fy - H * .01, W * fx + W * .008, H * fy); c.stroke();
      }
    } else if (pr === 'tonlesap') {
      // トンレサップ: 高床の水上集落+小舟+浸水林+広い湖面
      sky([[0,'#c8d8e0'],[.45,'#98b8c0'],[1,'#5a7860']]);
      // 遠景の浸水林(水面から出る樹冠の帯)
      FS('#4a6858'); c.beginPath(); c.moveTo(0, H * .52);
      for (let i = 0; i <= 10; i++) {
        c.quadraticCurveTo(W * (i + .5) / 10, H * (.5 - .02 * Math.sin(i * 2)), W * (i + 1) / 10, H * .52);
      }
      c.lineTo(W, H * .58); c.lineTo(W, H * .58); c.lineTo(0, H * .58); c.closePath(); c.closePath(); c.fill();
      // 湖面(広い水)
      const wg = c.createLinearGradient(0, H * .55, 0, H); wg.addColorStop(0, '#6a9a90'); wg.addColorStop(1, '#3a5850'); FS(wg); rect(0, H * .55, W, H * .45);
      // 高床家屋2棟(高い杭の上の小屋)
      const stilts = [[.2, .68], [.48, .65]];
      for (const [sx, sy] of stilts) {
        const bx = W * sx, by = H * sy, ss = H * .1;
        // 杭(4本の長い足)
        SS('#4a3828'); lnW(Math.max(1.5, H * .006));
        ([-.35, -.12, .12, .35]).forEach(dx => {
          c.beginPath(); c.moveTo(bx + ss * dx, by); c.lineTo(bx + ss * dx, by + ss * .5); c.stroke();
        });
        // 壁(パーム葺きの家身)
        FS('#8a6a48'); rect(bx - ss * .4, by - ss * .45, ss * .8, ss * .45);
        // 茅葺き屋根(高い切妻)
        FS('#6a5035'); poly([bx - ss * .5,by - ss * .42],[bx,by - ss * .9],[bx + ss * .5,by - ss * .42]);
        // 窓
        c.fillStyle = '#3a2c20'; rect(bx - ss * .1, by - ss * .32, ss * .12, ss * .12);
      }
      // 小舟(湖面の細長い舟)
      FS('#5a4430'); const bx = W * .72, by = H * .72; poly([bx - H * .06,by],[bx,by + H * .015,bx + H * .06,by],[bx + H * .05,by - H * .012],[bx - H * .05,by - H * .012]);
      // 漕ぎ手(点の人影)
      FS('#2a2018'); c.beginPath(); c.ellipse(bx + H * .01, by - H * .025, H * .008, H * .015, 0, 0, 7); c.ellipse(bx + H * .01, by - H * .025, H * .008, H * .015, 0, 0, 7); c.fill();
      // 櫂
      c.strokeStyle = '#4a3828'; lnW(Math.max(1, H * .004)); c.beginPath(); c.moveTo(bx + H * .01, by - H * .03); c.moveTo(bx + H * .01, by - H * .03); c.lineTo(bx + H * .035, by - H * .09); c.moveTo(bx + H * .01, by - H * .03); c.lineTo(bx + H * .035, by - H * .09); c.stroke();
      // 空の鳥(一行)
      SS('#4a5860'); lnW(Math.max(1, H * .004));
      times(4, i => {
        const fx = .6 + i * .06, fy = .18 - i * .01; c.beginPath(); c.moveTo(W * fx - W * .008, H * fy); c.quadraticCurveTo(W * fx, H * fy - H * .01, W * fx + W * .008, H * fy); c.stroke();
      });
    } else if (pr === 'drakensberg') {
      // ドラケンスバーグ: アンフィシアターの玄武岩断崖+トゥゲラ滝+緑の山麓+雲
      sky([[0,'#88b8d8'],[.45,'#a8c8d0'],[1,'#5a7858']]);
      // 断崖の壁(幅広い玄武岩のアリーナ)
      FS('#8a7a68'); poly([W * .1,H * .62],[W * .15,H * .3],[W * .3,H * .22],[W * .5,H * .18],[W * .7,H * .22],[W * .85,H * .3],[W * .9,H * .62]); // 左上の稜線 // 中央の鞍部
      // 断崖の縦筋(柱状節理)
      SS('#6a5a48'); lnW(Math.max(1, H * .004));
      times(9, i => {
        const rx = .18 + i * .08; c.beginPath(); c.moveTo(W * rx, H * .25); c.lineTo(W * (rx + .01), H * .6); c.stroke();
      });
      // トゥゲラ滝(中央から流れ落ちる白い筋)
      FS('rgba(240,245,245,0.8)'); poly([W * .49,H * .2],[W * .505,H * .62],[W * .515,H * .62],[W * .51,H * .2]);
      // 滝壺の飛沫
      c.fillStyle = 'rgba(230,240,240,0.5)'; c.beginPath(); c.ellipse(W * .5, H * .62, W * .04, H * .015, 0, 0, 7); c.ellipse(W * .5, H * .62, W * .04, H * .015, 0, 0, 7); c.fill();
      // 山麓の緑(断崖の下)
      FS('#4a7840'); poly([0,H * .62],[W * .5,H * .58,W,H * .64],[W,H],[W,H],[0,H]);
      // 草地の陰影(斜めの筋)
      SS('#3a6030'); lnW(Math.max(1, H * .005));
      times(6, i => {
        c.beginPath(); c.moveTo(W * i * .18, H * (.66 + i * .02)); c.lineTo(W * (i * .18 + .12), H * (.64 + i * .02)); c.stroke();
      });
      // 頂の雲(断崖の上にかかる帯)
      FS('rgba(235,240,242,0.7)'); c.beginPath(); c.ellipse(W * .4, H * .16, W * .25, H * .025, 0, 0, 7); c.ellipse(W * .4, H * .16, W * .25, H * .025, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .7, H * .24, W * .18, H * .02, 0, 0, 7); c.ellipse(W * .7, H * .24, W * .18, H * .02, 0, 0, 7); c.fill();
    } else if (pr === 'serengeti') {
      // セレンゲティ: 平らな傘のアカシア+ヌーの群れ+大きな夕日+サバンナ
      sky([[0,'#e8a858'],[.5,'#c88858'],[1,'#7a6838']]);
      // 大きな夕日(地平線にかかる円)
      FS('#f0c868'); dot(.62,.42,H * .18);
      // 夕日の暈
      c.fillStyle = 'rgba(240,200,104,0.3)'; dot(.62,.42,H * .24);
      // 遠景のコピエ(岩の小丘)
      FS('#7a5c40'); c.beginPath(); c.ellipse(W * .15, H * .6, W * .1, H * .04, 0, Math.PI, 0); c.ellipse(W * .15, H * .6, W * .1, H * .04, 0, Math.PI, 0); c.fill();
      // サバンナ(地平線から手前)
      const sg = c.createLinearGradient(0, H * .6, 0, H); sg.addColorStop(0, '#c8a858'); sg.addColorStop(1, '#8a7040'); FS(sg); poly([0,H * .62],[W * .5,H * .58,W,H * .62],[W,H],[W,H],[0,H]);
      // 平らな傘のアカシア2本(幹+平たい樹冠)
      const acacia = [[.18, .7, .14], [.78, .66, .18]];
      for (const [ax, ay, as_] of acacia) {
        const bx = W * ax, by = H * ay, ts = H * as_;
        // 幹(細くY字に分かれる)
        SS('#4a3828'); lnW(Math.max(1.5, ts * .04)); c.beginPath(); c.moveTo(bx, by); c.moveTo(bx, by); c.lineTo(bx, by - ts * .55); c.moveTo(bx, by); c.lineTo(bx, by - ts * .55); c.stroke(); c.beginPath(); c.moveTo(bx, by - ts * .4); c.moveTo(bx, by - ts * .4); c.lineTo(bx - ts * .2, by - ts * .62); c.moveTo(bx, by - ts * .4); c.lineTo(bx - ts * .2, by - ts * .62); c.stroke(); c.beginPath(); c.moveTo(bx, by - ts * .4); c.moveTo(bx, by - ts * .4); c.lineTo(bx + ts * .18, by - ts * .6); c.moveTo(bx, by - ts * .4); c.lineTo(bx + ts * .18, by - ts * .6); c.stroke();
        // 平たい傘(扁円の樹冠)
        FS('#3a5828'); c.beginPath(); c.ellipse(bx, by - ts * .68, ts * .42, ts * .1, 0, Math.PI, 0); c.quadraticCurveTo(bx, by - ts * .55, bx - ts * .42, by - ts * .68); c.closePath(); c.closePath(); c.fill();
      }
      // ヌーの群れ(遠景の小さなシルエット)
      FS('#3a3028');
      times(7, i => {
        const wx = .35 + i * .07, wy = .63 + .01 * Math.sin(i * 2), ws = H * .012; c.beginPath(); c.ellipse(W * wx, H * wy, ws * 1.6, ws, 0, 0, 7); c.ellipse(W * wx, H * wy, ws * 1.6, ws, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * wx + ws * 1.8, H * wy - ws * .8, ws * .5, ws * .5, 0, 0, 7); c.ellipse(W * wx + ws * 1.8, H * wy - ws * .8, ws * .5, ws * .5, 0, 0, 7); c.fill(); // 体 // 頭
      });
      // 空の鳥(2羽の影)
      SS('#4a3828'); lnW(Math.max(1, H * .004));
      for (const [fx, fy] of [[.4, .25], [.55, .18]]) {
        c.beginPath(); c.moveTo(W * fx - W * .01, H * fy); c.quadraticCurveTo(W * fx, H * fy - H * .015, W * fx + W * .01, H * fy); c.stroke();
      }
    } else if (pr === 'simien') {
      // シミエン: 鋸歯の絶壁+深い谷+巨大ロベリア+霞む連峰
      sky([[0,'#b8c8d8'],[.5,'#98a8b0'],[1,'#5a6850']]);
      // 遠景の霞む連峰(薄いシルエット2層)
      FS('rgba(120,140,150,0.5)'); c.beginPath(); c.moveTo(0, H * .5);
      for (let i = 0; i <= 6; i++) {
        c.lineTo(W * (i + .5) / 6, H * (.4 - .05 * Math.sin(i * 2.3))); c.lineTo(W * (i + 1) / 6, H * .5);
      }
      c.lineTo(W, H * .6); c.lineTo(W, H * .6); c.lineTo(0, H * .6); c.closePath(); c.closePath(); c.fill();
      // 主景の鋸歯断崖(大きな尖った岩壁)
      FS('#7a6a58'); poly([W * .1,H * .7],[W * .18,H * .35],[W * .24,H * .5],[W * .3,H * .3],[W * .36,H * .52],[W * .44,H * .38],[W * .52,H * .6],[W * .6,H * .7]); // 高い尖塔
      // 断崖の陰(岩の亀裂筋)
      SS('#5a4c3c'); lnW(Math.max(1, H * .004));
      ([.2, .28, .4, .5]).forEach(cx => {
        c.beginPath(); c.moveTo(W * cx, H * .4); c.lineTo(W * (cx + .02), H * .68); c.stroke();
      });
      // 深い谷(断崖の下の暗い窪地)
      FS('#4a5a48'); poly([W * .5,H * .7],[W * .75,H * .6,W,H * .75],[W,H],[W,H],[W * .5,H]);
      // 手前の高台草地(断崖の麓)
      FS('#6a8858'); poly([0,H * .7],[W * .3,H * .65,W * .6,H * .75],[W * .6,H],[W * .6,H],[0,H]);
      // 巨大ロベリア2本(キャベツ状の葉+高い花茎)
      for (const [lx, ly, ls] of [[.12, .8, .1], [.28, .85, .08]]) {
        const bx = W * lx, by = H * ly, ss = H * ls;
        // 花茎(立つ穂)
        SS('#8a7848'); lnW(Math.max(1.5, ss * .05)); c.beginPath(); c.moveTo(bx, by - ss * .1); c.moveTo(bx, by - ss * .1); c.lineTo(bx, by - ss * .9); c.moveTo(bx, by - ss * .1); c.lineTo(bx, by - ss * .9); c.stroke();
        // 花穂(頂の円錐)
        FS('#a09050'); poly([bx - ss * .05,by - ss * .55],[bx,by - ss * .95],[bx + ss * .05,by - ss * .55]);
        // キャベツ状の葉(基部の丸い塊)
        FS('#4a7038'); c.beginPath(); c.ellipse(bx, by - ss * .08, ss * .3, ss * .18, 0, 0, 7); c.ellipse(bx, by - ss * .08, ss * .3, ss * .18, 0, 0, 7); c.fill();
      }
      // 頂の雲
      c.fillStyle = 'rgba(235,240,242,0.6)'; c.beginPath(); c.ellipse(W * .35, H * .2, W * .2, H * .02, 0, 0, 7); c.ellipse(W * .35, H * .2, W * .2, H * .02, 0, 0, 7); c.fill();
    } else if (pr === 'chefchaouen') {
      // シャウエン: 青のメディナ — 青色の建物+白い階段路地+アーチ+鉢植え
      sky([[0,'#7aa8d0'],[.45,'#a0c0dc'],[1,'#c8dae8']]);
      // 遠景の山(リーフ山脈の薄い影)
      FS('rgba(100,140,170,0.5)'); poly([0,H * .45],[W * .3,H * .3],[W * .3,H * .3],[W * .5,H * .4],[W * .7,H * .32],[W * .7,H * .32],[W,H * .45],[W,H * .55],[W,H * .55],[0,H * .55]);
      // 青い建物の群れ(色違いの青の立方体群)
      const houses = [
        [.05, .5, .16, .35, '#6898c8'], [.22, .48, .14, .4, '#5890c0'],
        [.38, .52, .15, .35, '#78a8d0'], [.55, .45, .14, .42, '#4a80b8'],
        [.7, .5, .16, .38, '#68a0cc'], [.86, .48, .12, .4, '#5888b8'],
      ];
      for (const [hx2, hy2, hw, hh, col] of houses) {
        const bx = W * hx2, by = H * hy2, bs = W * hw; FS(col); rect(bx, by, bs, H * hh);
        // 屋根(白い平屋根+小さなパラペット)
        FS('#e8f0f0'); rect(bx - bs * .02, by - H * .015, bs * 1.04, H * .02);
        // 窓(白い小窓2つ)
        FS('#f0f4f0'); rect(bx + bs * .15, by + H * .08, bs * .15, H * .05); rect(bx + bs * .6, by + H * .12, bs * .15, H * .05);
        // 扉(アーチの青戸)
        FS('#3a6898'); poly([bx + bs * .38,by + H * hh - H * .01],[bx + bs * .38,by + H * hh - H * .1],[bx + bs * .5,by + H * hh - H * .14,bx + bs * .62,by + H * hh - H * .1],[bx + bs * .62,by + H * hh - H * .01]);
      }
      // 中央のアーチ路地(白い階段が上る)
      FS('#e8f0f0'); poly([W * .42,H],[W * .42,H * .72],[W * .5,H * .66,W * .58,H * .72],[W * .58,H]);
      // 階段の段(路地の白い段差)
      SS('#b0c8d8'); lnW(Math.max(1.5, H * .006));
      times(6, i => {
        const sy = H * (.76 + i * .04); c.beginPath(); c.moveTo(W * (.43 + i * .01), sy); c.lineTo(W * (.57 - i * .01), sy); c.stroke();
      });
      // 鉢植え(路地の脇の花)
      for (const [px, py, pc] of [[.4, .85, '#c04848'], [.6, .88, '#d8a038'], [.38, .93, '#c04848']]) {
        FS('#8a5a38'); rect(W * px - W * .012, H * py, W * .024, H * .02); FS(pc); dot(px,py - H * .015,W * .012);
      }
    } else if (pr === 'toraja') {
      // トラジャ: トンコナンの舟形屋根の集落+水田+椰子+山並み
      sky([[0,'#a8c8e0'],[.5,'#c8d8c0'],[1,'#7a9858']]);
      // 遠景の山(薄い連峰)
      FS('rgba(110,140,150,0.5)'); poly([0,H * .5],[W * .25,H * .35],[W * .25,H * .35],[W * .45,H * .5],[W * .65,H * .38],[W * .65,H * .38],[W,H * .5],[W,H * .6],[W,H * .6],[0,H * .6]);
      // トンコナン(舟形の反り上がった屋根の家3棟)
      for (const [tx, ty, ts] of [[.15, .62, .18], [.4, .58, .22], [.68, .63, .17]]) {
        const bx = W * tx, by = H * ty, bs = W * ts;
        // 高床の柱
        c.fillStyle = '#5a4632';
        ([.15, .5, .85]).forEach(px => {
          rect(bx + bs * px - bs * .02, by, bs * .04, H * .1);
        });
        // 家の本体(横長の壁)
        FS('#7a5a38'); rect(bx, by - bs * .35, bs, bs * .35);
        // 壁面の彫刻文様(白い横線)
        SS('#e8d8a8'); lnW(Math.max(1, bs * .015)); c.beginPath(); c.moveTo(bx + bs * .05, by - bs * .2); c.lineTo(bx + bs * .95, by - bs * .2); c.stroke();
        // 舟形屋根(両端が反り上がる黒い大屋根)
        FS('#3a3028'); poly([bx - bs * .15,by - bs * .3],[bx + bs * .5,by - bs * .85,bx + bs * 1.15,by - bs * .3],[bx + bs * 1.05,by - bs * .15,bx + bs * .5,by - bs * .28],[bx - bs * .05,by - bs * .15,bx - bs * .15,by - bs * .3]); // 左端の反り // 右端の反り
      }
      // 水田(段々の水面+稲の緑)
      FS('#88b0d0'); rect(0, H * .78, W, H * .22); SS('#6a9048'); lnW(Math.max(1.5, H * .008));
      ([.8, .85, .9]).forEach(ty2 => {
        c.beginPath(); c.moveTo(0, H * ty2); c.quadraticCurveTo(W * .4, H * (ty2 - .02), W, H * ty2); c.stroke();
      });
      // 椰子の木1本
      const px2 = W * .88, py2 = H * .78; SS('#6a5038'); lnW(Math.max(2, W * .006)); c.beginPath(); c.moveTo(px2, py2); c.moveTo(px2, py2); c.lineTo(px2 + W * .01, py2 - H * .15); c.moveTo(px2, py2); c.lineTo(px2 + W * .01, py2 - H * .15); c.stroke(); SS('#4a7838'); lnW(Math.max(1.5, W * .004));
      times(5, i => {
        const ang = -2.2 + i * .5; c.beginPath(); c.moveTo(px2 + W * .01, py2 - H * .15);
        c.quadraticCurveTo(px2 + W * .01 + Math.cos(ang) * W * .05, py2 - H * .15 + Math.sin(ang) * H * .03 - H * .02,
          px2 + W * .01 + Math.cos(ang) * W * .08, py2 - H * .15 + Math.sin(ang) * H * .05);
        c.stroke();
      });
    } else if (pr === 'chocohills') {
      // チョコレートヒルズ: 円錐状の丘が連なる+椰子+青空
      sky([[0,'#88b8e0'],[.55,'#b0d0e0'],[1,'#8aa868']]);
      // 大地の緑(丘の麓)
      FS('#7a9858'); rect(0, H * .6, W, H * .4);
      // 遠景の小丘(薄い連なり)
      FS('rgba(140,120,90,0.5)');
      for (const [hx2, hw] of [[.08, .08], [.2, .1], [.34, .07], [.5, .09], [.65, .08], [.8, .1], [.92, .07]]) {
        poly([W * (hx2 - hw),H * .6],[W * hx2,H * (.6 - hw * .8),W * (hx2 + hw),H * .6]);
      }
      // 主景の円錐丘5つ(チョコ色の円錐+草むらの影)
      const hills = [[.15, .68, .1], [.32, .72, .13], [.5, .66, .09], [.68, .72, .12], [.85, .68, .1]];
      for (const [hx2, hy2, hw] of hills) {
        const bx = W * hx2, by = H * hy2, bs = W * hw;
        // 円錐(乾期のチョコ色)
        FS('#8a6a48'); poly([bx - bs,by],[bx,by - bs * 1.4,bx + bs,by]);
        // 頂の草むら(先端の緑)
        FS('#6a8a48'); poly([bx - bs * .35,by - bs * .9],[bx,by - bs * 1.45,bx + bs * .35,by - bs * .9]);
        // 斜面の影(右側の暗部)
        FS('rgba(80,60,40,0.35)'); poly([bx,by - bs * 1.4],[bx + bs * .5,by - bs * .6,bx + bs,by],[bx + bs * .6,by],[bx + bs * .2,by - bs * .5,bx,by - bs * 1.4]);
      }
      // 椰子の木2本(丘の間)
      for (const [px, py, ps] of [[.24, .78, .14], [.6, .8, .12]]) {
        const tx2 = W * px, ty2 = H * py, ts2 = H * ps; SS('#7a5a40'); lnW(Math.max(1.5, ts2 * .06)); c.beginPath(); c.moveTo(tx2, ty2); c.moveTo(tx2, ty2); c.lineTo(tx2 + ts2 * .08, ty2 - ts2 * .8); c.moveTo(tx2, ty2); c.lineTo(tx2 + ts2 * .08, ty2 - ts2 * .8); c.stroke(); SS('#4a7838'); lnW(Math.max(1, ts2 * .04));
        times(5, i => {
          const ang = -2.4 + i * .55; c.beginPath(); c.moveTo(tx2 + ts2 * .08, ty2 - ts2 * .8);
          c.quadraticCurveTo(tx2 + ts2 * .08 + Math.cos(ang) * ts2 * .45, ty2 - ts2 * .8 + Math.sin(ang) * ts2 * .25,
            tx2 + ts2 * .08 + Math.cos(ang) * ts2 * .7, ty2 - ts2 * .8 + Math.sin(ang) * ts2 * .45);
          c.stroke();
        });
      }
    } else if (pr === 'svaneti') {
      // スヴァネティ: 石造りの防衛塔+雪山の連峰+山村
      sky([[0,'#90b0d0'],[.5,'#b8c8c0'],[1,'#6a8858']]);
      // 大コーカサスの雪山(鋭い連峰+雪頂)
      FS('#8898a8'); poly([0,H * .55],[W * .15,H * .32],[W * .15,H * .32],[W * .3,H * .5],[W * .45,H * .28],[W * .45,H * .28],[W * .6,H * .52],[W * .75,H * .34],[W * .75,H * .34],[W,H * .55],[W,H * .65],[W,H * .65],[0,H * .65]);
      // 雪頂(白いキャップ)
      FS('#f0f4f8');
      for (const [px, pw] of [[.15, .1], [.45, .09], [.75, .1]]) {
        poly([W * (px - pw),H * .5],[W * px,H * (.5 - pw * .8)],[W * (px + pw),H * .5]);
      }
      // 山麓の森(暗い緑)
      FS('#4a6838'); rect(0, H * .6, W, H * .12);
      // スヴァン塔3基(石造りの四角い塔+小さな窓)
      for (const [tx, ty, ts] of [[.12, .7, .09], [.26, .72, .11], [.42, .68, .08]]) {
        const bx = W * tx, by = H * ty, bs = W * ts; FS('#8a7a68'); rect(bx - bs / 2, by - bs * 1.8, bs, bs * 1.8);
        // 塔の窓(小さな黒い開口)
        FS('rgba(52,56,68,0.9)'); rect(bx - bs * .15, by - bs * 1.5, bs * .3, bs * .2); rect(bx - bs * .15, by - bs * .9, bs * .3, bs * .2);
        // 塔頂(小さな屋根)
        FS('#6a5a48'); poly([bx - bs / 2 - bs * .1,by - bs * 1.8],[bx,by - bs * 2.1],[bx + bs / 2 + bs * .1,by - bs * 1.8]);
      }
      // 村の小屋2棟(石壁+切妻屋根)
      for (const [hx2, hy2, hw] of [[.6, .78, .12], [.78, .8, .1]]) {
        const bx = W * hx2, by = H * hy2, bs = W * hw; FS('#7a6a58'); rect(bx, by - bs * .4, bs, bs * .4); FS('#5a4a38'); poly([bx - bs * .05,by - bs * .4],[bx + bs / 2,by - bs * .65],[bx + bs * 1.05,by - bs * .4]);
      }
      // 草地(手前の高原牧場)
      FS('#7a9860'); rect(0, H * .85, W, H * .15);
    } else if (pr === 'khiva') {
      // ヒヴァ: イチャン・カラ — カルタ・ミナールの青い塔+粘土の城壁+アーチ
      sky([[0,'#d8b890'],[.55,'#c8a878'],[1,'#a08858']]);
      // 粘土の城壁(連なる城塞壁+鋸壁)
      FS('#b89468'); rect(0, H * .5, W, H * .2); FS('#a88458');
      times(14, i => {
        rect(W * i / 14 + W * .015, H * .47, W * .04, H * .04);
      });
      // 城壁の鼓塔(半円の突出)
      ([.1, .35, .62, .85]).forEach(tx => {
        c.beginPath(); c.arc(W * tx, H * .5, W * .035, Math.PI, 0); c.fill();
      });
      // カルタ・ミナール(太くて短い青の塔)
      const mx = W * .5, mw = W * .07;
      // 台座
      c.fillStyle = '#98806a'; rect(mx - mw * .7, H * .62, mw * 1.4, H * .08);
      // 塔身(太い円筒+青緑のタイル帯)
      FS('#b89468'); rect(mx - mw / 2, H * .28, mw, H * .34);
      // タイル帯(ターコイズの横帯)
      FS('#4a98a8');
      ([.32, .42, .52]).forEach(ty => {
        rect(mx - mw / 2, H * ty, mw, H * .05);
      });
      // 帯の文様(白い縦筋)
      SS('#e8f0e8'); lnW(Math.max(1, W * .002));
      times(6, i => {
        const fx = mx - mw / 2 + mw * (i + .5) / 6; c.beginPath(); c.moveTo(fx, H * .32); c.moveTo(fx, H * .32); c.lineTo(fx, H * .57); c.stroke();
      });
      // 頂の張り出し(木の梁+小尖塔)
      FS('#6a5848'); rect(mx - mw * .62, H * .26, mw * 1.24, H * .02); FS('#98806a'); rect(mx - mw * .55, H * .22, mw * 1.1, H * .04);
      // 入口アーチ(大きなアイワン)
      FS('#8a6a4a'); poly([W * .32,H * .7],[W * .32,H * .58],[W * .5,H * .48,W * .68,H * .58],[W * .68,H * .7]);
      // アーチの内側(暗い開口)
      FS('rgba(50,40,30,0.8)'); poly([W * .38,H * .7],[W * .38,H * .6],[W * .5,H * .54,W * .62,H * .6],[W * .62,H * .7]);
      // 前景の砂地
      c.fillStyle = '#c8a870'; rect(0, H * .7, W, H * .3);
    } else if (pr === 'preikestolen') {
      // プレーケストレン: リーセフィヨルドの垂直絶壁+平らな頂+深い谷の水
      sky([[0,'#98b8d8'],[.5,'#a8c0c8'],[1,'#4870a0']]);
      // 遠景の山並み(薄い連峰)
      FS('rgba(110,140,160,0.5)'); poly([0,H * .5],[W * .2,H * .38],[W * .2,H * .38],[W * .4,H * .5],[W * .6,H * .4],[W * .6,H * .4],[W,H * .5],[W,H * .6],[W,H * .6],[0,H * .6]);
      // フィヨルドの水(深い青の水面)
      FS('#3a6898'); rect(0, H * .68, W, H * .32);
      // 波筋(水面の細い線)
      SS('rgba(220,235,240,0.4)'); lnW(Math.max(1, H * .003));
      ([.72, .78, .85, .92]).forEach(wy => {
        c.beginPath(); c.moveTo(0, H * wy); c.quadraticCurveTo(W * .4, H * (wy - .01), W, H * wy); c.stroke();
      });
      // プレーケストレン(右側の垂直断崖+平らな頂)
      const cx = W * .68; FS('#7a6a58'); poly([cx,H * .3],[cx + W * .32,H * .3],[cx + W * .32,H * .42],[cx + W * .28,H],[cx,H]); // 頂の左端 // 頂の右端(平ら) // 壁の上端 // 壁の下端(斜めに切れる)
      // 壁面の岩筋(垂直の亀裂)
      SS('#5a4c3c'); lnW(Math.max(1.5, H * .006));
      ([.05, .12, .2, .27]).forEach(fx => {
        c.beginPath(); c.moveTo(cx + W * fx, H * .42); c.lineTo(cx + W * (fx - .01), H); c.stroke();
      });
      // 頂上の緑(草地の台座)
      FS('#6a8850'); poly([cx - W * .02,H * .3],[cx + W * .33,H * .3],[cx + W * .33,H * .26],[cx - W * .02,H * .26]);
      // 頂の人影2人(小さな点)
      FS('rgba(40,40,40,0.8)');
      ([.72, .88]).forEach(px => {
        rect(W * px, H * .24, W * .006, H * .02);
      });
    } else if (pr === 'jeju') {
      // 済州: 漢拏山の火山丘+石垣+菜の花畑+海
      sky([[0,'#90b8e0'],[.5,'#a8ccd0'],[1,'#689858']]);
      // 海(遠景の水平線)
      FS('#5a8ab8'); rect(0, H * .5, W, H * .15);
      // 漢拏山(中央の大きな火山丘+頂のカルデラ)
      FS('#5a7848'); poly([W * .2,H * .5],[W * .45,H * .28,W * .7,H * .5],[W * .7,H * .55],[W * .7,H * .55],[W * .2,H * .55]);
      // 頂のカルデラ(凹み)
      FS('#4a6838'); poly([W * .38,H * .38],[W * .45,H * .33,W * .52,H * .38],[W * .52,H * .4],[W * .52,H * .4],[W * .38,H * .4]);
      // オルム2つ(小さな火山丘)
      for (const [ox, ow] of [[.15, .12], [.8, .1]]) {
        FS('#5a7848'); poly([W * (ox - ow),H * .55],[W * ox,H * .42,W * (ox + ow),H * .55]);
      }
      // 石垣(玄武岩の黒い石積み)
      FS('#3a3838');
      ([.68, .72]).forEach(ry => {
        times(12, i => {
          rect(W * (i + (ry === .72 ? .5 : 0)) / 12, H * ry, W * .07, H * .035);
        });
      });
      // 菜の花畑(黄色い点々)
      const tr3 = L.mulberry32(555); FS('#e0c838');
      times(60, i => {
        rect(tr3() * W, H * (.78 + tr3() * .18), W * .008, W * .008);
      });
      // 緑の大地
      c.fillStyle = 'rgba(100,150,80,0.5)'; rect(0, H * .78, W, H * .22);
    } else if (pr === 'gobi') {
      // ゴビ: 広大な草原+白いゲル+ラクダ+晴れた大空
      sky([[0,'#88b8e0'],[.55,'#b8d0d8'],[1,'#a89858']]);
      // 大地(広いステップ草原)
      FS('#a89858'); rect(0, H * .55, W, H * .45);
      // 草原の草むら(薄い横筋)
      SS('rgba(120,140,70,0.5)'); lnW(Math.max(1, H * .005));
      ([.6, .66, .72]).forEach(gy => {
        c.beginPath(); c.moveTo(0, H * gy); c.quadraticCurveTo(W * .5, H * (gy - .02), W, H * gy); c.stroke();
      });
      // 白いゲル(丸い幕屋+赤い頂+煙突の煙)
      const gx = W * .3, gy = H * .62, gs = W * .12;
      // 本体(白い円筒+丸屋根)
      FS('#f0e8d8'); rect(gx - gs / 2, gy - gs * .5, gs, gs * .5); poly([gx - gs / 2,gy - gs * .5],[gx,gy - gs * .85,gx + gs / 2,gy - gs * .5]);
      // 赤い帯(屋根の縁)
      SS('#c04830'); lnW(Math.max(1.5, gs * .03)); c.beginPath(); c.moveTo(gx - gs / 2, gy - gs * .45); c.lineTo(gx + gs / 2, gy - gs * .45); c.stroke();
      // 扉(茶色い入り口)
      FS('#7a5a38'); rect(gx - gs * .08, gy - gs * .35, gs * .16, gs * .35);
      // 煙突の煙(細い曲線)
      SS('rgba(180,190,200,0.6)'); lnW(Math.max(1, gs * .02)); c.beginPath(); c.moveTo(gx + gs * .1, gy - gs * .75); c.quadraticCurveTo(gx + gs * .15, gy - gs * .9, gx + gs * .25, gy - gs * 1.05); c.stroke();
      // ラクダ2頭(コブのシルエット)
      for (const [cx2, cw] of [[.62, .07], [.8, .06]]) {
        const bx = W * cx2, bw = W * cw; FS('#8a6a48'); c.beginPath();
        // 胴体+二つコブ
        c.ellipse(bx, H * .68, bw, bw * .45, 0, 0, 7); c.ellipse(bx, H * .68, bw, bw * .45, 0, 0, 7); c.fill(); c.ellipse(bx - bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); c.ellipse(bx - bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); c.fill(); c.ellipse(bx + bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); c.ellipse(bx + bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); c.fill();
        // 首+頭
        c.strokeStyle = '#8a6a48'; lnW(Math.max(1.5, bw * .15)); c.beginPath(); c.moveTo(bx + bw * .8, H * .68); c.quadraticCurveTo(bx + bw * 1.2, H * .62, bx + bw * 1.15, H * .58); c.stroke();
        // 脚
        c.lineWidth = Math.max(1.5, bw * .1);
        ([-.5, -.2, .3, .6]).forEach(lx => {
          c.beginPath(); c.moveTo(bx + lx * bw, H * .7); c.lineTo(bx + lx * bw, H * .76); c.stroke();
        });
      }
      // 白い雲2つ
      c.fillStyle = 'rgba(240,245,250,0.7)'; ell(.2,.2,W * .12,H * .015); ell(.75,.15,W * .15,H * .02);
    } else if (pr === 'nile') {
      // ナイル: 大ピラミッド+フェルッカ帆船+椰子+川面
      sky([[0,'#e8b870'],[.45,'#d8c098'],[1,'#4878a0']]);
      // 砂漠の地平(遠景の砂地)
      FS('#c8a870'); rect(0, H * .5, W, H * .15);
      // ピラミッド2つ(大+小)
      FS('#a88858'); c.beginPath(); c.moveTo(W * .55, H * .5); c.moveTo(W * .55, H * .5); c.lineTo(W * .72, H * .22); c.moveTo(W * .55, H * .5); c.lineTo(W * .72, H * .22); c.lineTo(W * .89, H * .5); c.closePath(); c.closePath(); c.fill();
      // 大ピラミッドの頂(白い化粧石)
      FS('#d8c8a8'); c.beginPath(); c.moveTo(W * .69, H * .3); c.moveTo(W * .69, H * .3); c.lineTo(W * .72, H * .22); c.moveTo(W * .69, H * .3); c.lineTo(W * .72, H * .22); c.lineTo(W * .75, H * .3); c.closePath(); c.closePath(); c.fill(); FS('#b89868'); c.beginPath(); c.moveTo(W * .82, H * .5); c.moveTo(W * .82, H * .5); c.lineTo(W * .92, H * .32); c.moveTo(W * .82, H * .5); c.lineTo(W * .92, H * .32); c.lineTo(W * 1.02, H * .5); c.closePath(); c.closePath(); c.fill();
      // 川(ナイル水面)
      FS('#4878a0'); rect(0, H * .65, W, H * .35);
      // 川の波(横筋)
      SS('rgba(140,190,220,0.5)'); lnW(Math.max(1, H * .005));
      ([.7, .76, .82, .9]).forEach(wy => {
        c.beginPath(); c.moveTo(0, H * wy); c.quadraticCurveTo(W * .5, H * (wy - .015), W, H * wy); c.stroke();
      });
      // フェルッカ(白い三角帆の帆船)
      const fx = W * .35, fy = H * .62; FS('#e8e0d0'); c.beginPath(); c.moveTo(fx, fy - H * .18); c.moveTo(fx, fy - H * .18); c.lineTo(fx + W * .1, fy); c.moveTo(fx, fy - H * .18); c.lineTo(fx + W * .1, fy); c.lineTo(fx, fy); c.closePath(); c.closePath(); c.fill();
      // 船体
      c.fillStyle = '#5a4838'; c.beginPath(); c.moveTo(fx - W * .02, fy); c.moveTo(fx - W * .02, fy); c.quadraticCurveTo(fx + W * .05, fy + H * .04, fx + W * .12, fy); c.closePath(); c.closePath(); c.fill();
      // 水面の映り込み
      c.fillStyle = 'rgba(230,220,200,0.3)'; rect(fx, fy + H * .05, W * .1, H * .01);
      // 椰子2本(岸辺)
      SS('#3a6848'); lnW(Math.max(2, W * .008));
      ([.12, .22]).forEach(px => {
        const pxx = W * px; c.beginPath(); c.moveTo(pxx, H * .65); c.quadraticCurveTo(pxx + W * .01, H * .55, pxx + W * .02, H * .5); c.stroke();
        // 葉(放射状)
        lnW(Math.max(1.5, W * .005));
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          c.beginPath(); c.moveTo(pxx + W * .02, H * .5); c.quadraticCurveTo(pxx + W * .02 + W * a * .12, H * .47, pxx + W * .02 + W * a * .16, H * .5); c.stroke();
        });
        lnW(Math.max(2, W * .008));
      });
    } else if (pr === 'pamukkale') {
      // パムッカレ: 白い石灰棚+ターコイズの湯池+遠景の山
      sky([[0,'#a8c8e0'],[.5,'#e8e0d8'],[1,'#d0c8b8']]);
      // 遠景の山稜(薄い連山)
      FS('#98a8b8'); poly([0,H * .42],[W * .2,H * .32],[W * .2,H * .32],[W * .4,H * .4],[W * .6,H * .33],[W * .6,H * .33],[W * .8,H * .4],[W,H * .34],[W,H * .34],[W,H * .45],[W,H * .34],[W,H * .45],[0,H * .45]);
      // 白い石灰棚(段々の斜面)
      FS('#f0ece0'); c.beginPath(); c.moveTo(0, H * .5);
      for (let i = 0; i <= 8; i++) {
        const sx = W * i / 8, sy = H * (.5 + i * .05); c.lineTo(sx, sy); c.lineTo(sx + W * .1, sy); c.lineTo(sx + W * .1, sy + H * .02);
      }
      c.lineTo(W, H); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
      // 棚の縁(影線)
      SS('rgba(180,170,150,0.6)'); lnW(Math.max(1, H * .005));
      times(8, i => {
        const sy = H * (.5 + i * .05); c.beginPath(); c.moveTo(W * i / 8, sy); c.lineTo(W * (i / 8 + .1), sy); c.stroke();
      });
      // ターコイズの湯池(棚の上の池)
      for (const [py, px0, px1] of [[.52, .02, .18], [.58, .1, .3], [.65, .18, .38], [.73, .26, .45]]) {
        FS('#58b8c8'); ell((px0 + px1) / 2, py, W * (px1 - px0) / 2, H * .012);
        // 池の輝き(白い反射筋)
        FS('rgba(220,240,245,0.5)'); rect(W * (px0 + px1) / 2 - W * .02, H * py - H * .003, W * .04, H * .004);
      }
      // 湯気(薄い柱2本)
      SS('rgba(200,210,220,0.4)'); lnW(Math.max(1.5, W * .004)); c.beginPath(); c.moveTo(W * .3, H * .5); c.moveTo(W * .3, H * .5); c.quadraticCurveTo(W * .32, H * .42, W * .34, H * .36); c.moveTo(W * .3, H * .5); c.quadraticCurveTo(W * .32, H * .42, W * .34, H * .36); c.stroke(); c.beginPath(); c.moveTo(W * .65, H * .55); c.moveTo(W * .65, H * .55); c.quadraticCurveTo(W * .66, H * .48, W * .68, H * .42); c.moveTo(W * .65, H * .55); c.quadraticCurveTo(W * .66, H * .48, W * .68, H * .42); c.stroke();
    } else if (pr === 'chichen') {
      // チチェン: エル・カスティーリョの階段ピラミッド+密林+青空
      sky([[0,'#80b8e0'],[.55,'#a8ccd8'],[1,'#48884a']]);
      // 密林の樹線(後ろの連なる冠)
      FS('#3a7838');
      times(10, i => {
        const tx = W * i / 9.5; ellP(tx, H * .52, W * .05, H * .04 + (i % 3) * H * .008);
      });
      rect(0, H * .52, W, H * .08);
      // エル・カスティーリョ(9段の階段ピラミッド)
      FS('#b8a078'); const px = W * .5, pw = W * .38;
      times(5, i => {
        const bw = pw * (1 - i * .16), by = H * (.68 - i * .055); rect(px - bw / 2, by, bw, H * .055);
      });
      // 中央の階段(正面の縦帯)
      FS('#988058'); rect(px - W * .035, H * .42, W * .07, H * .26);
      // 階段の段線(横筋)
      SS('rgba(120,100,70,0.6)'); lnW(Math.max(1, H * .004));
      ([.46, .5, .54, .58, .62, .66]).forEach(sy => {
        c.beginPath(); c.moveTo(px - W * .035, H * sy); c.lineTo(px + W * .035, H * sy); c.stroke();
      });
      // 頂上の神殿(小さな方形+扉)
      FS('#a89068'); rect(px - W * .06, H * .36, W * .12, H * .06); FS('#584838'); rect(px - W * .015, H * .38, W * .03, H * .04);
      // 草地(前景)
      FS('#5a9848'); rect(0, H * .68, W, H * .32);
      // 草むらの陰(横筋)
      SS('rgba(70,120,55,0.5)');
      ([.74, .82, .9]).forEach(gy => {
        c.beginPath(); c.moveTo(0, H * gy); c.quadraticCurveTo(W * .5, H * (gy - .02), W, H * gy); c.stroke();
      });
      // 雲2つ
      c.fillStyle = 'rgba(245,250,255,0.7)'; ell(.2,.16,W * .13,H * .018); ell(.8,.22,W * .1,H * .014);
    } else if (pr === 'lencois') {
      // レンソイス: 白い大砂丘+青い潟+ゆるやかな丘稜
      sky([[0,'#90c0e0'],[.5,'#c8dde8'],[1,'#e8e2d0']]);
      // 大砂丘(重なる白い丘: 3層)
      for (const [dy, col, shade] of [[.5, '#f0ebe0', '#d8d0c0'], [.62, '#e8e2d0', '#d0c8b8'], [.76, '#e0d8c8', '#c8c0b0']]) {
        FS(col); poly([0,H * (dy + .12)],[W * .15,H * dy,W * .3,H * (dy + .08)],[W * .45,H * (dy - .03),W * .6,H * (dy + .07)],[W * .75,H * (dy - .02),W,H * (dy + .1)],[W,H],[W,H],[0,H]);
        // 丘の陰(稜線の薄い影)
        SS(shade); lnW(Math.max(1, H * .006)); c.beginPath(); c.moveTo(0, H * (dy + .12)); c.quadraticCurveTo(W * .15, H * dy, W * .3, H * (dy + .08)); c.stroke();
      }
      // 青い潟(丘の間の水溜り: 3つ)
      for (const [lx, ly, lw] of [[.3, .58, .1], [.6, .72, .12], [.18, .86, .09]]) {
        FS('#48a8d0'); ell(lx, ly, W * lw, H * .02);
        // 水の輝き(白い反射)
        FS('rgba(220,240,250,0.6)'); rect(W * lx - W * .02, H * ly - H * .004, W * .04, H * .004);
      }
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.8)'; ell(.25,.14,W * .12,H * .016); ell(.7,.2,W * .15,H * .02);
    } else if (pr === 'atoll') {
      // 環礁: ターコイズの礁湖+白砂のモツ+椰子+外洋の深い青
      sky([[0,'#70a8d8'],[.4,'#98c8e0'],[1,'#48a8c8']]);
      // 外洋(深い青の海面)
      FS('#2868a0'); rect(0, H * .45, W, H * .55);
      // 環礁の礁湖(中央のターコイズ水域)
      FS('#58c0d8'); ell(.5, .68, W * .32, H * .12);
      // 礁湖の白い波筋
      c.strokeStyle = 'rgba(200,240,250,0.5)'; lnW(Math.max(1, H * .004)); ellPS(W * .5, H * .68, W * .26, H * .09);
      // 白砂のモツ(環礁の砂州: 左右)
      FS('#f0e8d0'); ellP(W * .18, H * .6, W * .14, H * .035, .15); ellP(W * .82, H * .62, W * .12, H * .03, -.1);
      // 砕波(礁縁の白い泡)
      SS('rgba(240,250,255,0.8)'); lnW(Math.max(1.5, H * .008)); ellPS(W * .5, H * .68, W * .34, H * .13);
      // 椰子2本(左のモツ)
      SS('#6a5a40'); lnW(Math.max(1.5, W * .005));
      ([.15, .22]).forEach(px => {
        const pxx = W * px; c.beginPath(); c.moveTo(pxx, H * .58); c.quadraticCurveTo(pxx + W * .01, H * .5, pxx + W * .015, H * .46); c.stroke();
        // 葉(放射状)
        SS('#3a7848'); lnW(Math.max(1.2, W * .004));
        ([-.7, -.3, .1, .5]).forEach(a => {
          c.beginPath(); c.moveTo(pxx + W * .015, H * .46); c.quadraticCurveTo(pxx + W * .015 + W * a * .1, H * .44, pxx + W * .015 + W * a * .14, H * .47); c.stroke();
        });
        SS('#6a5a40'); lnW(Math.max(1.5, W * .005));
      });
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.8)'; ell(.2,.15,W * .12,H * .016); ell(.75,.2,W * .14,H * .018);
    } else if (pr === 'potala') {
      // ポタラ: マルポ・リの丘+白い宮殿+赤い中央殿+金の屋根
      sky([[0,'#80b8e0'],[.5,'#b8d0e0'],[1,'#688858']]);
      // ヒマラヤの連峰(遠景)
      FS('#98a8b8'); poly([0,H * .5],[W * .15,H * .38],[W * .15,H * .38],[W * .3,H * .48],[W * .5,H * .36],[W * .5,H * .36],[W * .7,H * .46],[W * .9,H * .4],[W * .9,H * .4],[W,H * .48],[W,H * .55],[W,H * .55],[0,H * .55]);
      // マルポ・リ(宮殿の丘)
      FS('#587048'); poly([W * .15,H * .75],[W * .5,H * .52,W * .85,H * .75],[W * .85,H],[W * .85,H],[W * .15,H]);
      // 白い宮殿(段々の壁: 4層)
      const px = W * .5, pw = W * .3; FS('#f0ebe0');
      times(4, i => {
        const bw = pw * (1 - i * .12), by = H * (.62 - i * .07); rect(px - bw / 2, by, bw, H * .07);
        // 壁の窓(小さな点列)
        FS('rgba(80,60,50,0.7)');
        ([-.35, -.18, 0, .18, .35]).forEach(wx => {
          rect(px + wx * bw / 2 - W * .003, by + H * .025, W * .006, H * .02);
        });
        FS('#f0ebe0');
      });
      // 赤い中央殿(頂の大きな殿舎)
      FS('#a03828'); rect(px - pw * .22, H * .35, pw * .44, H * .1);
      // 金の屋根(中央殿の屋根+小さな塔)
      FS('#d8a828'); poly([px - pw * .22,H * .35],[px,H * .28],[px,H * .28],[px + pw * .22,H * .35]);
      ([-.15, 0, .15]).forEach(tx => {
        rect(px + tx * pw, H * .3 - H * .01, W * .008, H * .02);
      });
      // 大地(前景の草原)
      FS('#5a8848'); rect(0, H * .75, W, H * .25);
      // 草むら(横筋)
      SS('rgba(70,110,60,0.5)'); lnW(Math.max(1, H * .005));
      ([.82, .9]).forEach(gy => {
        c.beginPath(); c.moveTo(0, H * gy); c.quadraticCurveTo(W * .5, H * (gy - .02), W, H * gy); c.stroke();
      });
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.8)'; ell(.2,.16,W * .12,H * .016); ell(.8,.22,W * .1,H * .014);
    } else if (pr === 'moher') {
      // モハー: 積層岩の断崖+大西洋の白波+緑の崖頂
      sky([[0,'#80a8c8'],[.55,'#98b8d0'],[1,'#38586a']]);
      // 大西洋(崖の左の海)
      FS('#3a6a80'); rect(0, H * .55, W, H * .45);
      // 白い波筋(3列)
      SS('rgba(240,248,250,0.6)'); lnW(Math.max(1, H * .004));
      ([.62, .7, .82]).forEach(wy => {
        c.beginPath(); c.moveTo(0, H * wy); c.quadraticCurveTo(W * .2, H * (wy - .015), W * .45, H * wy); c.stroke();
      });
      // 断崖(右側の積層岩壁)
      const cx = W * .55; FS('#6a5848'); poly([cx,H * .5],[W * .62,H * .48],[W * .62,H * .48],[W,H * .5],[W,H],[W,H],[cx,H]);
      // 積層線(水平の岩層)
      SS('rgba(90,75,60,0.8)'); lnW(Math.max(1, H * .003));
      ([.55, .62, .7, .78, .86, .93]).forEach(ly => {
        c.beginPath(); c.moveTo(cx + W * .02, H * ly); c.lineTo(W, H * (ly - .01)); c.stroke();
      });
      // 崖の縁(左端のジグザグ)
      SS('#4a3c30'); lnW(Math.max(1, H * .006)); c.beginPath(); c.moveTo(cx, H * .5); c.lineTo(cx + W * .015, H * .58); c.lineTo(cx + W * .015, H * .58); c.lineTo(cx - W * .005, H * .66); c.lineTo(cx + W * .012, H * .74); c.lineTo(cx + W * .012, H * .74); c.lineTo(cx - W * .008, H * .82); c.lineTo(cx + W * .008, H * .9); c.lineTo(cx + W * .008, H * .9); c.lineTo(cx, H); c.stroke();
      // 緑の崖頂(上の芝生)
      FS('#48884a'); poly([cx,H * .5],[W * .62,H * .48],[W * .62,H * .48],[W,H * .5],[W,H * .45],[W,H * .45],[W * .62,H * .43],[W,H * .45],[W * .62,H * .43],[cx,H * .46]);
      // カモメ2羽
      c.strokeStyle = '#384048'; lnW(Math.max(1, H * .004));
      for (const [bx, by] of [[.25, .28], [.4, .22]]) {
        c.beginPath(); c.moveTo(W * bx - W * .015, H * by); c.quadraticCurveTo(W * bx, H * by - H * .012, W * bx + W * .015, H * by); c.stroke();
      }
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.75)'; ell(.2,.12,W * .12,H * .016); ell(.55,.08,W * .09,H * .013);
    } else if (pr === 'baobab') {
      // バオバブ街道: 巨大な幹の並木+夕焼け+土の道
      sky([[0,'#e8a858'],[.45,'#d88858'],[1,'#7a5a48']]);
      // 低い太陽(街道の奥)
      FS('#f8d8a0'); dot(.5,.52,W * .05);
      // 大地(赤土)
      FS('#98603a'); rect(0, H * .55, W, H * .45);
      // 土の道(中央へ奥行き)
      FS('#b87848'); poly([W * .42,H * .55],[W * .58,H * .55],[W * .72,H],[W * .72,H],[W * .28,H]);
      // バオバブの木(太い幹+小さな冠) 遠近で3本
      const bb = [
        [.18, .55, .09],   // 左奥
        [.82, .55, .09],   // 右奥
        [.1, .55, .14],    // 左前(大きい)
      ];
      for (const [bx, by, bw] of bb) {
        const tw = W * bw, th = H * .3;
        // 幹(上へ細まる樽形)
        FS('#7a5a40'); poly([W * bx - tw / 2,H],[W * bx - tw * .32,H * by - th * .4],[W * bx + tw * .32,H * by - th * .4],[W * bx + tw / 2,H]);
        // 枝(上の短い広がり)
        SS('#7a5a40'); lnW(Math.max(2, tw * .08));
        ([-.7, -.35, 0, .35, .7]).forEach(a => {
          c.beginPath(); c.moveTo(W * bx, H * (by - th * .4)); c.lineTo(W * bx + Math.sin(a) * tw * .8, H * (by - th * .4) - Math.cos(a) * th * .35); c.stroke();
        });
        // 小さな冠(枝先の葉)
        FS('#5a7848'); ell(bx, (by - th * .4) - th * .3, tw * .85, th * .18);
      }
      // 影(夕日の長い影)
      FS('rgba(60,40,30,0.4)');
      for (const [bx, , bw] of bb) {
        const tw = W * bw; poly([W * bx - tw / 2,H],[W * bx - tw / 2 - tw * 1.2,H],[W * bx - tw * .32,H * .85]);
      }
      // 鳥2羽
      c.strokeStyle = '#503828'; lnW(Math.max(1, H * .004));
      for (const [bx, by] of [[.3, .2], [.68, .15]]) {
        c.beginPath(); c.moveTo(W * bx - W * .015, H * by); c.quadraticCurveTo(W * bx, H * by - H * .012, W * bx + W * .015, H * by); c.stroke();
      }
    } else if (pr === 'moorea') {
      // モーレア: 火山の鋸峰+ターコイズ礁湖+白い礁湖線+椰子
      sky([[0,'#78b8e0'],[.5,'#98d0e0'],[1,'#48b0c8']]);
      // 遠くのサンゴ礁線(白い砕波の筋)
      FS('#e8f0f0'); rect(0, H * .55, W, H * .015);
      // 島の火山峰(左の鋸歯山)
      FS('#3a6a48'); poly([W * .15,H * .55],[W * .3,H * .3],[W * .3,H * .3],[W * .38,H * .42],[W * .45,H * .28],[W * .45,H * .28],[W * .55,H * .45],[W * .6,H * .55]);
      // 山の陰(左斜面の暗がり)
      FS('#2c5638'); c.beginPath(); c.moveTo(W * .3, H * .3); c.moveTo(W * .3, H * .3); c.lineTo(W * .38, H * .42); c.lineTo(W * .33, H * .5); c.lineTo(W * .33, H * .5); c.lineTo(W * .28, H * .42); c.closePath(); c.closePath(); c.fill();
      // 礁湖(海の明るい帯)
      FS('#58c8d8'); rect(0, H * .57, W, H * .2);
      // 礁湖の波筋
      c.strokeStyle = 'rgba(240,250,250,0.5)'; lnW(Math.max(1, H * .003));
      ([.62, .68, .74]).forEach(wy => {
        c.beginPath(); c.moveTo(0, H * wy); c.quadraticCurveTo(W * .5, H * (wy - .01), W, H * wy); c.stroke();
      });
      // 白砂の前浜(下の帯)
      FS('#f0e8d0'); rect(0, H * .78, W, H * .22);
      // 砂の陰(波打ち線)
      SS('rgba(200,180,140,0.6)'); lnW(Math.max(1, H * .004)); c.beginPath(); c.moveTo(0, H * .82); c.quadraticCurveTo(W * .5, H * .8, W, H * .83); c.stroke();
      // 椰子2本(右の浜)
      ([.78, .9]).forEach(px => {
        SS('#6a4a30'); lnW(Math.max(1, W * .006)); c.beginPath(); c.moveTo(W * px, H); c.quadraticCurveTo(W * (px + .02), H * .88, W * (px + .01), H * .8); c.stroke(); SS('#3a7848'); lnW(Math.max(1, W * .007)); const tipX = W * (px + .01), tipY = H * .8;
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          c.beginPath(); c.moveTo(tipX, tipY); c.lineTo(tipX + Math.sin(a) * W * .035, tipY - Math.cos(a) * W * .02); c.stroke();
        });
      });
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.8)'; ell(.25,.15,W * .12,H * .016); ell(.7,.1,W * .09,H * .013);
    } else if (pr === 'bure') {
      // ブレ: フィジーの藁葺小屋+白浜+青い海+椰子
      sky([[0,'#78b8e0'],[.5,'#a0d0e0'],[1,'#58b8c8']]);
      // 海(水平の帯)
      FS('#48a8c0'); rect(0, H * .6, W, H * .15);
      // 白い波線
      c.strokeStyle = 'rgba(240,250,250,0.6)'; lnW(Math.max(1, H * .004)); c.beginPath(); c.moveTo(0, H * .68); c.quadraticCurveTo(W * .5, H * .66, W, H * .68); c.stroke();
      // 白浜(下の帯)
      FS('#f0e8d0'); rect(0, H * .75, W, H * .25);
      // ブレ小屋(左の藁葺小屋)
      const bx = W * .3, by = H * .78, bs = W * .2;
      // 壁(編み壁)
      FS('#a08050'); rect(bx - bs * .4, by - bs * .35, bs * .8, bs * .35);
      // 壁の編み模様(縦線)
      SS('rgba(80,60,40,0.6)'); lnW(Math.max(1, W * .002));
      for (let wx = 0; wx <= 8; wx++) {
        c.beginPath(); c.moveTo(bx - bs * .4 + wx * bs * .1, by - bs * .35); c.lineTo(bx - bs * .4 + wx * bs * .1, by); c.stroke();
      }
      // 藁葺屋根(大きな三角形)
      FS('#8a6a40'); poly([bx - bs * .5,by - bs * .32],[bx,by - bs * .75],[bx + bs * .5,by - bs * .32]);
      // 屋根の藁線(垂れ筋)
      SS('rgba(60,45,25,0.5)'); lnW(Math.max(1, W * .0015));
      ([-.35, -.2, 0, .2, .35]).forEach(rx => {
        c.beginPath(); c.moveTo(bx + rx * bs, by - bs * .38); c.lineTo(bx + rx * bs * .7, by - bs * .65); c.stroke();
      });
      // ドア(暗い開口)
      FS('#3a2c1c'); rect(bx - bs * .08, by - bs * .25, bs * .16, bs * .25);
      // 椰子2本(右の浜)
      ([.72, .88]).forEach(px => {
        SS('#6a4a30'); lnW(Math.max(1, W * .006)); c.beginPath(); c.moveTo(W * px, H * .95); c.quadraticCurveTo(W * (px + .015), H * .85, W * px, H * .78); c.stroke(); SS('#3a7848'); lnW(Math.max(1, W * .007));
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          c.beginPath(); c.moveTo(W * px, H * .78); c.lineTo(W * px + Math.sin(a) * W * .035, H * .78 - Math.cos(a) * W * .022); c.stroke();
        });
      });
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.8)'; ell(.2,.15,W * .12,H * .016); ell(.75,.2,W * .1,H * .014);
    } else if (pr === 'kokoda') {
      // ココダ: 霧の密林稜線+細い山道+高い林冠
      sky([[0,'#8aa8b8'],[.4,'#6a8858'],[1,'#3a5838']]);
      // 霧(横の白い帯)
      FS('rgba(230,238,240,0.45)'); rect(0, H * .3, W, H * .1); rect(0, H * .48, W, H * .06);
      // 密林の稜線(重なる緑の山)
      FS('#2c5030'); poly([0,H * .6],[W * .2,H * .42],[W * .2,H * .42],[W * .45,H * .55],[W * .7,H * .4],[W * .7,H * .4],[W,H * .52],[W,H],[W,H],[0,H]); FS('#1f3a24'); poly([0,H * .72],[W * .3,H * .55],[W * .3,H * .55],[W * .6,H * .68],[W,H * .58],[W,H * .58],[W,H],[W,H * .58],[W,H],[0,H]);
      // 細い山道(稜線を這う明るい筋)
      SS('#b09870'); lnW(Math.max(1, H * .008)); c.beginPath(); c.moveTo(W * .05, H * .95); c.quadraticCurveTo(W * .3, H * .78, W * .5, H * .72); c.quadraticCurveTo(W * .7, H * .65, W * .85, H * .6); c.stroke();
      // 林冠の丸い塊(点在する大木)
      FS('#3a6838');
      for (const [cx2, cy2, cr] of [[.15, .5, .07], [.4, .44, .06], [.62, .5, .08], [.85, .46, .06]]) {
        dot(cx2, cy2, W * cr);
      }
      // 木の幹(短い柱)
      SS('#4a3828'); lnW(Math.max(1, W * .004));
      for (const [cx2, cy2] of [[.15, .5], [.4, .44], [.62, .5], [.85, .46]]) {
        c.beginPath(); c.moveTo(W * cx2, H * cy2 + H * .02); c.lineTo(W * cx2, H * (cy2 + .1)); c.stroke();
      }
      // 露光の粒(霧の中の光)
      const rng7 = L.mulberry32(777); FS('rgba(255,250,230,0.5)');
      times(8, i => {
        const lx = rng7() * W, ly = H * (.35 + rng7() * .3); dotP(lx, ly, W * .004);
      });
    } else if (pr === 'haamonga') {
      // ハアモンガ: 巨石の三石門+草原+海の遠景
      sky([[0,'#80b8d8'],[.5,'#a0c8d8'],[1,'#5a8858']]);
      // 遠くの海(水平の帯)
      FS('#4a90b0'); rect(0, H * .48, W, H * .08);
      // 草原(大地)
      FS('#6a9848'); rect(0, H * .56, W, H * .44);
      // 草の揺れ筋(2筋)
      SS('rgba(80,120,60,0.5)'); lnW(Math.max(1, H * .005));
      ([.68, .82]).forEach(gy => {
        c.beginPath(); c.moveTo(0, H * gy); c.quadraticCurveTo(W * .5, H * (gy - .015), W, H * gy); c.stroke();
      });
      // 三石門(中央の巨石トンガ門)
      const gx = W * .5, gw = W * .18, gh = H * .3;
      // 左柱
      c.fillStyle = '#7a6a58'; poly([gx - gw * .45,H * .78],[gx - gw * .48,H * .78 - gh],[gx - gw * .3,H * .78 - gh],[gx - gw * .32,H * .78]);
      // 右柱
      poly([gx + gw * .32,H * .78],[gx + gw * .3,H * .78 - gh],[gx + gw * .48,H * .78 - gh],[gx + gw * .45,H * .78]);
      // 楣石(上の横石)
      FS('#8a7a68'); rect(gx - gw * .52, H * .78 - gh - H * .025, gw * 1.04, H * .05);
      // 石の凹凸(小さな亀裂線)
      SS('rgba(60,50,40,0.5)'); lnW(Math.max(1, W * .002));
      for (const [cx2, cy2] of [[-.4, -.6], [.38, -.5], [-.35, -.3], [.42, -.25]]) {
        c.beginPath(); c.moveTo(gx + cx2 * gw, H * (.78 + cy2 * gh / gh * .2)); c.lineTo(gx + cx2 * gw + W * .01, H * (.78 + cy2 * gh / gh * .25)); c.stroke();
      }
      // 椰子2本(門の両脇)
      ([.15, .85]).forEach(px => {
        SS('#6a4a30'); lnW(Math.max(1, W * .005)); c.beginPath(); c.moveTo(W * px, H * .8); c.quadraticCurveTo(W * (px + .015), H * .7, W * px, H * .62); c.stroke(); SS('#3a7848'); lnW(Math.max(1, W * .006));
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          c.beginPath(); c.moveTo(W * px, H * .62); c.lineTo(W * px + Math.sin(a) * W * .03, H * .62 - Math.cos(a) * W * .018); c.stroke();
        });
      });
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.75)'; ell(.2,.14,W * .12,H * .016); ell(.7,.1,W * .1,H * .014);
    } else if (pr === 'yasur') {
      // ヤスール: 活火山の灰原+赤い噴火口+飛ぶ溶岩弾+煙
      sky([[0,'#584048'],[.4,'#6a4a48'],[1,'#3a2c28']]);
      // 火山の灰原(暗い大地)
      FS('#3a3030'); rect(0, H * .6, W, H * .4);
      // 火山の円錐(中央の大きな山)
      const vx = W * .5, vy = H * .62, vw = W * .55; FS('#4a3838'); poly([vx - vw / 2,H * .85],[vx - vw * .18,vy],[vx + vw * .18,vy],[vx + vw / 2,H * .85]);
      // 噴火口の赤い輝き(山頂の丸い光)
      const glow = c.createRadialGradient(vx, vy, 0, vx, vy, W * .12); glow.addColorStop(0, 'rgba(255,120,40,0.9)'); glow.addColorStop(.5, 'rgba(220,60,30,0.5)'); glow.addColorStop(1, 'rgba(220,60,30,0)'); FS(glow); dotP(vx, vy, W * .12);
      // 噴火口(暗い切れ込み)
      FS('#2a2020'); ellP(vx, vy, W * .09, H * .018);
      // 溶岩弾(放物線の火玉)
      FS('#ff8830');
      for (const [bx, by2, br] of [[-.15, -.18, .008], [-.05, -.28, .01], [.08, -.22, .007], [.18, -.14, .009]]) {
        dotP(vx + bx * W, vy + by2 * H, W * br);
      }
      // 溶岩弾の尾(光の筋)
      SS('rgba(255,140,60,0.5)'); lnW(Math.max(1, W * .002));
      for (const [bx, by2] of [[-.15, -.18], [-.05, -.28], [.08, -.22], [.18, -.14]]) {
        c.beginPath(); c.moveTo(vx + bx * W * .6, vy + by2 * H * .4); c.lineTo(vx + bx * W, vy + by2 * H); c.stroke();
      }
      // 煙(火口の上の濃い雲)
      FS('rgba(60,45,45,0.7)');
      for (const [sx2, sy2, sr] of [[-.02, -.12, .06], [-.04, -.22, .08], [0, -.32, .1]]) {
        ellP(vx + sx2 * W, vy + sy2 * H, W * sr, H * sr * .4);
      }
      // 灰の粒(舞う火山灰)
      const rng8 = L.mulberry32(888); FS('rgba(180,160,150,0.4)');
      times(12, i => {
        const ax = rng8() * W, ay = H * (.3 + rng8() * .5); dotP(ax, ay, W * .003);
      });
    } else if (pr === 'douro') {
      // ドウロ: 渓谷の段々畑+蛇行する川+山裾の村+船
      sky([[0,'#88b8d8'],[.45,'#a8c8d8'],[1,'#4a7a58']]);
      // 遠山(2層の稜線)
      FS('#6a8a70'); poly([0,H * .42],[W * .3,H * .3],[W * .3,H * .3],[W * .6,H * .4],[W * .3,H * .3],[W * .6,H * .4],[W,H * .32],[W,H * .6],[W,H * .6],[0,H * .6]);
      // 段々畑(重なる横帯のテラス)
      times(6, i => {
        const ty = .45 + i * .05; FS(i % 2 ? '#5a8a58' : '#6a9a60'); poly([0,H * ty],[W * .3,H * (ty - .02),W * .55,H * ty],[W * .8,H * (ty + .02),W,H * ty],[W,H * (ty + .05)],[W * .8,H * (ty + .07),W * .55,H * (ty + .05)],[W * .3,H * (ty + .03),0,H * (ty + .05)]);
        // テラスの縁線(石垣の暗い筋)
        SS('rgba(60,80,50,0.5)'); lnW(Math.max(1, H * .004)); c.beginPath(); c.moveTo(0, H * ty); c.quadraticCurveTo(W * .3, H * (ty - .02), W * .55, H * ty); c.quadraticCurveTo(W * .8, H * (ty + .02), W, H * ty); c.stroke();
      });
      // 蛇行する川(中央の青い帯)
      FS('#4a88a8'); poly([W * .3,H * .75],[W * .5,H * .7,W * .65,H * .78],[W * .8,H * .85,W * .75,H],[W * .55,H],[W * .6,H * .88,W * .45,H * .82],[W * .3,H * .76,W * .1,H * .78],[0,H * .82],[0,H * .82],[0,H * .78]);
      // 川の光(白い反射筋)
      SS('rgba(220,240,250,0.5)'); lnW(Math.max(1, W * .003)); c.beginPath(); c.moveTo(W * .35, H * .78); c.quadraticCurveTo(W * .55, H * .75, W * .7, H * .82); c.stroke();
      // ワインボート(川の小舟)
      FS('#3a2c20'); poly([W * .58,H * .78],[W * .62,H * .78],[W * .61,H * .775],[W * .59,H * .775]);
      // 山裾の村(白い家+オレンジ屋根)
      FS('#f0e8e0'); rect(W * .15, H * .5, W * .04, H * .02); FS('#c06838'); c.beginPath(); c.moveTo(W * .15, H * .5); c.moveTo(W * .15, H * .5); c.lineTo(W * .17, H * .485); c.moveTo(W * .15, H * .5); c.lineTo(W * .17, H * .485); c.lineTo(W * .19, H * .5); c.closePath(); c.closePath(); c.fill(); FS('#f0e8e0'); rect(W * .21, H * .52, W * .035, H * .018); FS('#c06838'); c.beginPath(); c.moveTo(W * .21, H * .52); c.moveTo(W * .21, H * .52); c.lineTo(W * .2275, H * .505); c.moveTo(W * .21, H * .52); c.lineTo(W * .2275, H * .505); c.lineTo(W * .245, H * .52); c.closePath();
      c.closePath(); c.fill();
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.75)'; ell(.3,.12,W * .12,H * .016); ell(.75,.08,W * .1,H * .014);
    } else if (pr === 'ararat') {
      // アララト: 雪頂の双高峰+ホルヴィラップ修道院+アプリコット畑
      sky([[0,'#8a90b8'],[.45,'#b8c0d0'],[1,'#7a8a60']]);
      // アララトの双峰(大きな雪山)
      const ax = W * .55; FS('#9aa0b0'); poly([ax - W * .35,H * .62],[ax - W * .12,H * .22],[ax - W * .02,H * .18],[ax + W * .12,H * .28],[ax + W * .3,H * .62]);
      // 雪頂(白い頂)
      FS('#f0f4f8'); poly([ax - W * .16,H * .3],[ax - W * .12,H * .22],[ax - W * .02,H * .18],[ax + W * .08,H * .25],[ax + W * .12,H * .32],[ax,H * .28]);
      // 平原(緑の大地)
      FS('#7a8a58'); rect(0, H * .62, W, H * .38);
      // アプリコット畑(橙色の帯)
      FS('#c08848'); rect(0, H * .72, W * .4, H * .08); FS('#a06838'); rect(0, H * .76, W * .4, H * .04);
      // 木々(畑の間の緑の丸)
      FS('#4a7048');
      ([.08, .2, .32]).forEach(tx => {
        dot(tx,.7,W * .015);
      });
      // ホルヴィラップ修道院(左の小さな教会)
      const mx = W * .18; FS('#6a5a50'); poly([mx - W * .05,H * .78],[mx - W * .05,H * .7],[mx,H * .66],[mx + W * .05,H * .7],[mx + W * .05,H * .78]);
      // 尖塔(釣鐘のような上の構造)
      FS('#5a4a40'); poly([mx - W * .015,H * .7],[mx - W * .02,H * .64],[mx,H * .6],[mx + W * .02,H * .64],[mx + W * .015,H * .7]);
      // 十字(頂上の小さな印)
      SS('#d0c0a0'); lnW(Math.max(1, W * .002)); c.beginPath(); c.moveTo(mx, H * .58); c.moveTo(mx, H * .58); c.lineTo(mx, H * .56); c.moveTo(mx - W * .004, H * .575); c.moveTo(mx - W * .004, H * .575); c.lineTo(mx + W * .004, H * .575); c.stroke();
      // 鳥2羽(遠くの飛翔)
      SS('#4a4a55'); lnW(Math.max(1, W * .002));
      ([.35, .45]).forEach(bx => {
        c.beginPath(); c.arc(W * bx, H * .18 + bx * H * .05, W * .008, 3.6, 5.8); c.stroke();
      });
    } else if (pr === 'khinalug') {
      // ヒナルグ: 山頂の石造り村+連なる階段状の家+遠い連峰
      sky([[0,'#7a88a8'],[.5,'#a8b0c0'],[1,'#5a6a58']]);
      // 遠い連峰(鋸歯の稜線)
      FS('#8a90a0'); poly([0,H * .45],[W * .15,H * .3],[W * .15,H * .3],[W * .3,H * .42],[W * .15,H * .3],[W * .3,H * .42],[W * .48,H * .28],[W * .65,H * .4],[W * .65,H * .4],[W * .82,H * .32],[W * .65,H * .4],[W * .82,H * .32],[W,H * .42],[W,H * .6],[W,H * .6],[0,H * .6]);
      // 雪の残る頂(稜線の白い点)
      FS('#e8ecf0');
      for (const [px, py] of [[.3, .42], [.48, .28], [.82, .32]]) {
        poly([W * px - W * .015,H * py + H * .02],[W * px,H * py],[W * px + W * .015,H * py + H * .02]);
      }
      // 村の丘(段々の斜面)
      FS('#6a7858'); poly([0,H],[W * .3,H * .55,W * .6,H * .58],[W * .85,H * .62,W,H * .72],[W,H]);
      // 階段状の石家(丘の斜面に連なる箱+屋根)
      const houses = [[.12, .72], [.22, .68], [.32, .64], [.42, .61], [.52, .59], [.62, .6], [.72, .63], [.82, .67]];
      for (const [hx2, hy2] of houses) {
        const hw = W * .06, hh = H * .035; FS('#8a7a68'); rect(W * hx2 - hw / 2, H * hy2 - hh, hw, hh); FS('#6a5a50'); poly([W * hx2 - hw / 2,H * hy2 - hh],[W * hx2,H * hy2 - hh - H * .012],[W * hx2 + hw / 2,H * hy2 - hh]);
        // 窓(小さな暗い点)
        FS('#3a3230'); rect(W * hx2 - hw * .15, H * hy2 - hh * .6, hw * .3, hh * .3);
      }
      // モスクの尖塔(村の中央の細い塔)
      FS('#9a8a78'); rect(W * .47, H * .5, W * .012, H * .12); FS('#6a5a50'); c.beginPath(); c.moveTo(W * .45, H * .5); c.moveTo(W * .45, H * .5); c.lineTo(W * .476, H * .47); c.moveTo(W * .45, H * .5); c.lineTo(W * .476, H * .47); c.lineTo(W * .502, H * .5); c.closePath(); c.closePath(); c.fill();
      // 羊の点(斜面の白い点)
      FS('#e8e4dc');
      for (const [sx2, sy2] of [[.15, .8], [.35, .84], [.55, .82], [.75, .86]]) {
        dot(sx2,sy2,W * .004);
      }
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.6)'; ell(.25,.1,W * .14,H * .016); ell(.7,.14,W * .12,H * .014);
    } else if (pr === 'hegra') {
      // ヘグラ: 砂岩の墓のファサード+砂漠の床+遠い岩山
      sky([[0,'#d8a868'],[.5,'#c89058'],[1,'#a06838']]);
      // 砂漠の床(砂の帯)
      FS('#c09858'); rect(0, H * .72, W, H * .28);
      // 遠い岩山(2つの砂岩の突起)
      FS('#a87848'); poly([0,H * .55],[W * .18,H * .35],[W * .18,H * .35],[W * .3,H * .5],[W * .18,H * .35],[W * .3,H * .5],[W * .45,H * .4],[W * .6,H * .55],[W * .6,H * .55],[W,H * .5],[W * .6,H * .55],[W,H * .5],[W,H * .72],[W * .6,H * .55],[W,H * .5],[W,H * .72],[0,H * .72]);
      // 中央の大きな岩塊(墓のある崖)
      const hx2 = W * .5; FS('#b08858'); poly([hx2 - W * .2,H * .72],[hx2 - W * .18,H * .38],[hx2 - W * .08,H * .3],[hx2 + W * .12,H * .34],[hx2 + W * .2,H * .45],[hx2 + W * .2,H * .72]);
      // 岩の水平層理(3本の筋)
      SS('rgba(140,100,60,0.6)'); lnW(Math.max(1, H * .004));
      ([.45, .55, .65]).forEach(ly => {
        c.beginPath(); c.moveTo(hx2 - W * .19, H * ly); c.lineTo(hx2 + W * .19, H * (ly + .01)); c.stroke();
      });
      // 墓のファサード(岩に刻まれた神殿の正面)
      const fx = hx2, fw = W * .14, fy = H * .7, fh = H * .22;
      // 階段状の玄関帯(上部の2段の縁)
      FS('#8a6840'); rect(fx - fw / 2, fy - fh, fw, H * .015); rect(fx - fw / 2 + W * .008, fy - fh + H * .015, fw - W * .016, H * .012);
      // 門(暗い入口)
      FS('#3a2c20'); poly([fx - fw * .25,fy],[fx - fw * .25,fy - fh * .55],[fx - fw * .2,fy - fh * .62],[fx + fw * .2,fy - fh * .62],[fx + fw * .25,fy - fh * .55],[fx + fw * .25,fy]);
      // 門の内側の明るい壁
      c.fillStyle = '#6a5030'; rect(fx - fw * .2, fy - fh * .5, fw * .4, fh * .5);
      // 柱4本(ファサードの柱列)
      FS('#8a6840');
      ([-.3, -.1, .1, .3]).forEach(px2 => {
        rect(fx + px2 * fw, fy - fh * .52, fw * .06, fh * .52);
      });
      // 三角の破風(上の三角縁)
      FS('#8a6840'); poly([fx - fw * .3,fy - fh],[fx,fy - fh - H * .03],[fx + fw * .3,fy - fh]);
      // ラクダ2頭(遠くのシルエット)
      FS('#6a5030');
      ([.12, .2]).forEach(cx3 => {
        c.beginPath(); c.ellipse(W * cx3, H * .78, W * .015, H * .012, 0, 0, 7); c.ellipse(W * cx3, H * .78, W * .015, H * .012, 0, 0, 7); c.fill(); SS('#6a5030'); lnW(Math.max(1, W * .003)); c.beginPath(); c.moveTo(W * cx3 + W * .012, H * .77); c.lineTo(W * cx3 + W * .018, H * .74); c.stroke();
      });
      // 陽の光(斜めの筋)
      SS('rgba(255,220,160,0.25)'); lnW(W * .02); c.beginPath(); c.moveTo(W * .1, 0); c.lineTo(W * .5, H); c.stroke();
    } else if (pr === 'sidi') {
      // シディブサイド: 白い家々+青いドーム+丘+深い海
      sky([[0,'#88b8e0'],[.5,'#a8d0e8'],[1,'#5a88a8']]);
      // 深い海(下部の青い帯)
      FS('#2868a0'); rect(0, H * .72, W, H * .28);
      // 海の白波(2本の筋)
      SS('rgba(220,240,255,0.5)'); lnW(Math.max(1, H * .003));
      ([.78, .86]).forEach(wy => {
        c.beginPath(); c.moveTo(0, H * wy); c.quadraticCurveTo(W * .5, H * (wy - .01), W, H * wy); c.stroke();
      });
      // 丘(白い村の土台)
      FS('#e8e0d0'); poly([0,H * .72],[W * .4,H * .5,W * .75,H * .55],[W * .9,H * .58,W,H * .65],[W,H * .72]);
      // 白い家の連なり(丘の上の箱)
      const wh = [[.1, .6], [.22, .56], [.34, .53], [.46, .55], [.58, .57], [.68, .6]];
      for (const [hx3, hy3] of wh) {
        const hw = W * .08, hh = H * .06; FS('#f0f0e8'); rect(W * hx3 - hw / 2, H * hy3 - hh, hw, hh);
        // 青い扉/窓(小さな青い点)
        FS('#2878c8'); rect(W * hx3 - hw * .15, H * hy3 - hh * .5, hw * .3, hh * .4);
      }
      // 青いドーム(村の上の丸い尖塔)
      const dx2 = W * .3; FS('#2878c8'); c.beginPath(); c.arc(dx2, H * .5, W * .03, Math.PI, 0); c.fill(); FS('#f0f0e8'); rect(dx2 - W * .03, H * .5, W * .06, H * .04);
      // 白い尖塔(上の細い塔)
      FS('#f0f0e8'); rect(dx2 + W * .05, H * .44, W * .012, H * .1); FS('#2878c8'); poly([dx2 + W * .045,H * .44],[dx2 + W * .056,H * .41],[dx2 + W * .067,H * .44]);
      // 花の点(ブーゲンビリアの赤い点)
      FS('#d84858');
      for (const [fx3, fy3] of [[.15, .68], [.4, .64], [.65, .7]]) {
        times(5, i => {
          dot((fx3 + i * .02), (fy3 + (i % 2) * .015), W * .004);
        });
      }
      // 雲2つ
      c.fillStyle = 'rgba(250,252,255,0.7)'; ell(.2,.1,W * .14,H * .018); ell(.75,.08,W * .12,H * .015);
    } else if (pr === 'brandberg') {
      // ブランドベリク: 巨大な花崗岩ドーム+礫原+矢筒の木
      sky([[0,'#c88858'],[.5,'#d8a068'],[1,'#a07038']]);
      // 礫原(下部の砂礫の大地)
      FS('#b08858'); rect(0, H * .68, W, H * .32);
      // 礫の点(小さな石の粒)
      const rng9 = L.mulberry32(999); FS('rgba(80,60,40,0.4)');
      times(40, i => {
        const gx2 = rng9() * W, gy2 = H * (.7 + rng9() * .25); dotP(gx2, gy2, W * (.002 + rng9() * .003));
      });
      // 巨大なドーム(中央の花崗岩の山)
      const bx4 = W * .5; FS('#987858'); poly([bx4 - W * .35,H * .68],[bx4 - W * .3,H * .35,bx4,H * .3],[bx4 + W * .3,H * .35,bx4 + W * .35,H * .68]);
      // 岩の層理(ドームの水平筋)
      SS('rgba(120,90,60,0.5)'); lnW(Math.max(1, H * .004));
      ([.4, .5, .6]).forEach(ly => {
        c.beginPath(); c.moveTo(bx4 - W * .32, H * ly); c.quadraticCurveTo(bx4, H * (ly - .03), bx4 + W * .32, H * ly); c.stroke();
      });
      // 頂の岩肌の陰(斜めの筋)
      SS('rgba(140,110,80,0.4)');
      ([-.12, .08]).forEach(sx3 => {
        c.beginPath(); c.moveTo(bx4 + sx3 * W, H * .32); c.quadraticCurveTo(bx4 + sx3 * W * 1.2, H * .5, bx4 + sx3 * W * 1.05, H * .66); c.stroke();
      });
      // 矢筒の木3本(フォーク形の枯れ木)
      SS('#4a3828'); lnW(Math.max(1, W * .004));
      for (const [qx, qs] of [[.15, 1], [.3, .8], [.82, .9]]) {
        const qy = H * .8, qh = H * .12 * qs; c.beginPath(); c.moveTo(W * qx, qy); c.lineTo(W * qx, qy - qh * .6); c.stroke();
        // 枝(上の分岐)
        ([-.5, -.2, .2, .5]).forEach(ba => {
          c.beginPath(); c.moveTo(W * qx, qy - qh * .6); c.lineTo(W * qx + Math.sin(ba) * W * .02, qy - qh); c.stroke();
        });
        // 葉の先の丸(小さな円)
        FS('#3a5a38'); c.beginPath(); c.arc(W * qx, qy - qh, W * .006, 0, 7); c.arc(W * qx, qy - qh, W * .006, 0, 7); c.fill();
      }
      // 太陽(巨大な白い円)
      FS('rgba(255,240,200,0.8)'); dot(.8,.18,W * .05);
      // 岩絵の点(壁画のような小さな赤い印)
      FS('#c84838');
      for (const [rx3, ry3] of [[.48, .55], [.5, .52], [.52, .57], [.47, .58]]) {
        dot(rx3,ry3,W * .003);
      }
    } else if (pr === 'luang') {
      // ルアンパバーン: 重層の寺院屋根+メコン川+山並み+椰子
      sky([[0,'#78a8c8'],[.5,'#a8c8d8'],[1,'#5a8858']]);
      // 遠い山並み(うねる稜線)
      FS('#6a9858'); poly([0,H * .6],[W * .25,H * .5,W * .5,H * .57],[W * .75,H * .48,W,H * .58],[W,H * .68],[W,H * .68],[0,H * .68]);
      // メコン川(下部の青緑の帯)
      FS('#5a8898'); rect(0, H * .7, W, H * .3);
      // 川の波(3本の筋)
      SS('rgba(220,240,240,0.4)'); lnW(Math.max(1, H * .003));
      ([.75, .82, .9]).forEach(wy => {
        c.beginPath(); c.moveTo(0, H * wy); c.quadraticCurveTo(W * .5, H * (wy - .012), W, H * wy); c.stroke();
      });
      // 岸辺の緑帯(川との境)
      FS('#4a7848'); rect(0, H * .68, W, H * .04);
      // 寺院(重層の反り屋根)
      const tx = W * .4;
      // 屋根3層(重なった反り返りの屋根)
      const roofs = [[.35, .3, .05], [.45, .42, .03], [.55, .55, .02]];
      for (const [ry, rw, hh] of roofs) {
        FS('#8a5030'); poly([tx - W * rw / 2,H * (ry + hh)],[tx,H * ry,tx + W * rw / 2,H * (ry + hh)]);
        // 屋根の反り(上向きの端)
        SS('#8a5030'); lnW(Math.max(1, W * .004)); c.beginPath(); c.moveTo(tx - W * rw / 2, H * (ry + hh)); c.lineTo(tx - W * rw / 2 - W * .015, H * (ry + hh - .015)); c.stroke(); c.beginPath(); c.moveTo(tx + W * rw / 2, H * (ry + hh)); c.lineTo(tx + W * rw / 2 + W * .015, H * (ry + hh - .015)); c.stroke();
      }
      // 寺院の壁(白い壁)
      FS('#e8e0d0'); rect(tx - W * .08, H * .52, W * .16, H * .16);
      // 金色の尖塔(中央のチョーファー)
      FS('#d8a838'); poly([tx - W * .008,H * .3],[tx,H * .22],[tx + W * .008,H * .3]);
      // 金色の門(壁の中の扉)
      FS('#d8a838'); rect(tx - W * .01, H * .58, W * .02, H * .1);
      // 椰子の木2本(岸辺)
      SS('#6a5030'); lnW(Math.max(1, W * .005));
      ([.62, .85]).forEach(px => {
        c.beginPath(); c.moveTo(W * px, H * .68); c.quadraticCurveTo(W * px + W * .01, H * .55, W * px + W * .015, H * .5); c.stroke();
        // 椰子の葉(放射の葉脈)
        SS('#4a8838');
        ([-.9, -.5, 0, .5, .9]).forEach(pa => {
          c.beginPath(); c.moveTo(W * px + W * .015, H * .5); c.quadraticCurveTo(W * px + W * .015 + Math.sin(pa) * W * .05, H * (.5 - Math.cos(pa) * .06), W * px + W * .015 + Math.sin(pa) * W * .07, H * (.52 - Math.cos(pa) * .04)); c.stroke();
        });
        SS('#6a5030');
      });
      // 川の小舟(1隻)
      FS('#5a4030'); poly([W * .6,H * .82],[W * .65,H * .86,W * .7,H * .82],[W * .68,H * .83],[W * .62,H * .83]);
      // 雲2つ
      c.fillStyle = 'rgba(240,248,250,0.7)'; ell(.2,.12,W * .13,H * .018); ell(.7,.15,W * .1,H * .014);
    } else if (pr === 'carpathians') {
      // カルパチア: 深い針葉樹の連山+古城(ブラン城)+山霧+熊の影
      sky([[0,'#6a88a8'],[.45,'#98b0c0'],[1,'#4a6a58']]);
      // 針葉樹の深い山稜(3層)
      const layers = [
        ['#4a6878', .38, .1], ['#3a5a48', .5, .18], ['#2a4a38', .62, .26]];
      for (const [col, ly, jag] of layers) {
        FS(col); c.beginPath(); c.moveTo(0, H * ly);
        for (let i = 0; i <= 10; i++) {
          const px = i * W / 10; c.lineTo(px, H * (ly - jag * (i % 2 ? .5 + .5 * Math.sin(i * 2.3) : .3)));
        }
        c.lineTo(W, H); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
      }
      // 頂の古城(ブラン城の塔群)
      FS('#d8d0c0'); rect(W * .62, H * .3, W * .1, H * .12); FS('#a84838');
      times(3, i => {
        const tx2 = W * (.63 + i * .04); poly([tx2 - W * .012,H * .3],[tx2,H * .25],[tx2 + W * .012,H * .3]); FS('#d8d0c0'); rect(tx2 - W * .008, H * .3, W * .016, H * .04); FS('#a84838');
      });
      // 霧の帯(谷の霧)
      FS('rgba(220,230,235,0.35)');
      times(3, i => {
        c.beginPath();
        c.ellipse(W * (.2 + i * .3) + Math.sin(t * .3 + i) * W * .03,
          H * (.55 + i * .08), W * .2, H * .03, 0, 0, 7);
        c.fill();
      });
      // 前面の針葉樹(左と右に高大木)
      ([.08, .9]).forEach(tx2 => {
        FS('#1a3a2a'); poly([W * tx2,H * .35],[W * (tx2 - .05),H * .7],[W * (tx2 + .05),H * .7]); poly([W * tx2,H * .45],[W * (tx2 - .04),H * .75],[W * (tx2 + .04),H * .75]); FS('#3a2a1a'); rect(W * (tx2 - .008), H * .75, W * .016, H * .05);
      });
      // 森の地面
      c.fillStyle = '#2a4a38'; rect(0, H * .78, W, H * .22);
      // 熊の影(小さな)
      FS('#2a1f15'); ell(.35,.82,W * .03,H * .018); ell(.375,.805,W * .012,H * .012);
    } else if (pr === 'puszta') {
      // プスタ(ハンガリー平原): 地平線までの草原+揚げ井戸(ギコ)+馬+遠くの蜃気楼
      sky([[0,'#e8d8a8'],[.5,'#d8c890'],[1,'#b0a068']]);
      // 熱で揺れる大きな太陽
      c.fillStyle = '#f0e0b0'; dot(.75,.18,H * .11); FS('#e8d098'); dot(.75,.18,H * .08);
      // 地平線(わずかにうねる)
      FS('#b8a868'); rect(0, H * .52, W, H * .48); FS('#c8b878'); poly([0,H * .52],[W * .3,H * .5,W * .55,H * .52],[W * .8,H * .54,W,H * .52],[W,H * .56],[W,H * .56],[0,H * .56]);
      // 揚げ井戸(ギコ: 長い竿+吊り桶) — プスタの象徴
      const wx = W * .7, wy = H * .52; SS('#6a4c34'); lnW(4);
      // 支柱(A字)
      c.beginPath(); c.moveTo(wx - W * .03, wy + H * .15); c.moveTo(wx - W * .03, wy + H * .15); c.lineTo(wx, wy - H * .05); c.lineTo(wx + W * .03, wy + H * .15); c.stroke();
      // 長い竿(先端に錘)
      lnW(3); c.beginPath(); c.moveTo(wx, wy - H * .05); c.moveTo(wx, wy - H * .05); c.lineTo(wx - W * .12, wy + H * .01); c.moveTo(wx, wy - H * .05); c.moveTo(wx, wy - H * .05); c.lineTo(wx + W * .09, wy - H * .1); c.stroke();
      // 錘+吊り紐+桶
      c.fillStyle = '#8a6848'; dotP(wx + W * .09, wy - H * .1, H * .015); lnW(1.5); c.beginPath(); c.moveTo(wx - W * .12, wy + H * .01); c.lineTo(wx - W * .12, wy + H * .07); c.stroke(); FS('#5a4838'); rect(wx - W * .135, wy + H * .07, W * .03, H * .04);
      // 羊の群れ(点々)
      FS('#e8e0c8'); const rng = L.mulberry32(1337);
      times(8, i => {
        const sx = rng() * W, sy = H * (.58 + rng() * .12); ellP(sx, sy, W * .015, H * .012);
      });
      // 遠くの馬(小さな影)
      FS('#584838'); const hx2 = W * .3 + S(.5) * W * .01; c.beginPath(); c.beginPath(); c.ellipse(hx2, H * .6, W * .03, H * .015, 0, 0, 7); ellP(hx2, H * .6, W * .03, H * .015); c.beginPath(); c.beginPath(); c.ellipse(hx2 + W * .03, H * .585, W * .012, H * .01, -.4, 0, 7); ellP(hx2 + W * .03, H * .585, W * .012, H * .01, -.4);
      // 草の穂(風に揺れる)
      SS('#989058'); lnW(1.2);
      times(15, i => {
        const gx = rng() * W, gy = H * (.8 + rng() * .18); const sw = Math.sin(t * 1.5 + i) * W * .008; c.beginPath(); c.moveTo(gx, gy); c.moveTo(gx, gy); c.quadraticCurveTo(gx + sw, gy - H * .04, gx + sw * 1.5, gy - H * .07); c.stroke();
      });
    } else if (pr === 'tatras') {
      // タトラ山脈: 鋸歯の岩峰+青い氷河湖+山小屋+高山の花
      sky([[0,'#b0d0e8'],[.5,'#d8e8f0'],[1,'#7a9878']]);
      // 鋸歯状の岩峰群
      c.fillStyle = '#8898a8'; poly([0,H * .5],[W * .1,H * .3],[W * .1,H * .3],[W * .16,H * .42],[W * .1,H * .3],[W * .16,H * .42],[W * .24,H * .22],[W * .33,H * .45],[W * .33,H * .45],[W * .44,H * .2],[W * .33,H * .45],[W * .44,H * .2],[W * .55,H * .44],[W * .66,H * .26],[W * .66,H * .26],[W * .76,H * .46],[W * .66,H * .26],[W * .76,H * .46],[W * .85,H * .32],[W,H * .48],[W,H * .62],[W,H * .62],[0,H * .62]);
      // 岩の筋(明暗)
      SS('rgba(90,105,125,0.6)'); lnW(2);
      times(5, i => {
        c.beginPath(); c.moveTo(W * (.12 + i * .15), H * .32); c.lineTo(W * (.1 + i * .15), H * .55); c.stroke();
      });
      // 雪の残り(峰の谷筋)
      FS('#f0f4f8');
      ([.24, .44, .66]).forEach(px => {
        c.beginPath(); c.moveTo(W * (px - .02), H * .3); c.moveTo(W * (px - .02), H * .3); c.lineTo(W * px, H * .22); c.lineTo(W * (px + .02), H * .3); c.lineTo(W * (px + .02), H * .3); c.lineTo(W * px, H * .35); c.closePath(); c.closePath(); c.fill();
      });
      // 青い氷河湖(目のような湖)
      FS('#58a8c8'); ell(.5, .68, W * .22, H * .05); FS('rgba(240,250,255,0.5)'); ellP(W * .45, H * .67, W * .08, H * .015, -.2);
      // 湖畔の山小屋(木造+石の煙突)
      FS('#8a6848'); rect(W * .72, H * .66, W * .1, H * .07); FS('#5a4030'); c.beginPath(); c.moveTo(W * .71, H * .66); c.moveTo(W * .71, H * .66); c.lineTo(W * .77, H * .61); c.moveTo(W * .71, H * .66); c.lineTo(W * .77, H * .61); c.lineTo(W * .83, H * .66); c.closePath(); c.closePath(); c.fill(); FS('#6a5a50'); rect(W * .79, H * .62, W * .012, H * .04);
      // 煙
      c.fillStyle = 'rgba(230,230,230,0.5)'; ell(.795 + S(2) * W * .01, .59, W * .012, H * .015);
      // 前面の高山草地+エーデルワイス風の小花
      c.fillStyle = '#6a9858'; rect(0, H * .73, W, H * .27); scat(934, 12, (rng, i) => {
        const fx = rng() * W, fy = H * (.78 + rng() * .18); FS('#f0f0d8');
        times(5, p2 => {
          const pa = p2 * Math.PI * 2 / 5; c.beginPath();
          c.ellipse(fx + Math.cos(pa) * H * .008, fy + Math.sin(pa) * H * .008,
            H * .006, H * .003, pa, 0, 7);
          c.fill();
        });
        FS('#e8c848'); dotP(fx, fy, H * .003);
      });
    } else if (pr === 'caucasus') {
      // コーカサス: 巨大な雪山脈+山腹の修道院+旋回する鷲
      sky([[0,'#c8d8f0'],[.5,'#e8ecf4'],[1,'#8a9a80']]);
      // 巨大な連峰(左右に高い峰)
      FS('#9ab0d0'); poly([0,H * .55],[W * .18,H * .18],[W * .3,H * .5],[W * .45,H * .22],[W * .6,H * .52],[W * .75,H * .28],[W * .9,H * .55],[W,H * .45],[W,H * .7],[W,H * .7],[0,H * .7]);
      // 雪面(峰の上部分を白く)
      FS('#f0f4fa'); c.beginPath(); c.moveTo(W * .12, H * .34); c.moveTo(W * .12, H * .34); c.lineTo(W * .18, H * .18); c.moveTo(W * .12, H * .34); c.lineTo(W * .18, H * .18); c.lineTo(W * .24, H * .36); c.lineTo(W * .18, H * .42); c.lineTo(W * .18, H * .42); c.closePath(); c.lineTo(W * .18, H * .42); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W * .38, H * .38); c.moveTo(W * .38, H * .38); c.lineTo(W * .45, H * .22); c.moveTo(W * .38, H * .38); c.lineTo(W * .45, H * .22); c.lineTo(W * .52, H * .4); c.lineTo(W * .45, H * .46); c.lineTo(W * .45, H * .46); c.closePath(); c.lineTo(W * .45, H * .46); c.closePath();
      c.fill(); c.beginPath(); c.moveTo(W * .7, H * .42); c.moveTo(W * .7, H * .42); c.lineTo(W * .75, H * .28); c.moveTo(W * .7, H * .42); c.lineTo(W * .75, H * .28); c.lineTo(W * .8, H * .44); c.lineTo(W * .75, H * .5); c.lineTo(W * .75, H * .5); c.closePath(); c.lineTo(W * .75, H * .5); c.closePath(); c.fill();
      // 山腹の修道院(ゲルゲティ・トリニティを思わせる小さな教会)
      FS('#8a6848'); rect(W * .34, H * .52, W * .05, H * .1); c.beginPath(); c.moveTo(W * .335, H * .52); c.moveTo(W * .335, H * .52); c.lineTo(W * .365, H * .46); c.moveTo(W * .335, H * .52); c.lineTo(W * .365, H * .46); c.lineTo(W * .395, H * .52); c.closePath(); c.closePath(); c.fill();
      // 鐘楼(円錐)
      rect(W * .4, H * .5, W * .015, H * .12); c.beginPath(); c.moveTo(W * .397, H * .5); c.moveTo(W * .397, H * .5); c.lineTo(W * .4075, H * .44); c.moveTo(W * .397, H * .5); c.lineTo(W * .4075, H * .44); c.lineTo(W * .418, H * .5); c.closePath(); c.closePath(); c.fill();
      // 山麓の緑の丘
      c.fillStyle = '#78a068'; poly([0,H * .68],[W * .25,H * .62,W * .5,H * .68],[W * .75,H * .72,W,H * .66],[W,H],[W,H],[0,H]);
      // 谷の小川(蛇行)
      SS('#98c8e8'); lnW(H * .018); c.beginPath(); c.moveTo(W * .5, H * .7); c.quadraticCurveTo(W * .42, H * .8, W * .55, H * .88); c.quadraticCurveTo(W * .6, H * .94, W * .48, H); c.stroke();
      // 旋回する鷲
      c.strokeStyle = 'rgba(60,50,40,0.8)'; lnW(2); const eagleA = t * .5; const ex = W * (.6 + Math.cos(eagleA) * .12); const ey = H * (.3 + Math.sin(eagleA) * .06); c.beginPath(); c.moveTo(ex - 8, ey); c.moveTo(ex - 8, ey); c.quadraticCurveTo(ex - 3, ey - 5, ex, ey); c.quadraticCurveTo(ex + 3, ey - 5, ex + 8, ey); c.stroke();
    } else if (pr === 'izba') {
      // イズバ(ロシアの村): 丸太小屋+タマネギ堂+白樺+煙
      sky([[0,'#a8c8e8'],[.5,'#d8e8f0'],[1,'#b0c8a0']]);
      // 遠くの小さな玉葱堂(金色の頭)
      FS('#6888a8'); rect(W * .7, H * .35, W * .08, H * .25); FS('#e8b838'); ell(.74,.33,W * .035,H * .045); ell(.68,.4,W * .02,H * .028); ell(.8,.4,W * .02,H * .028);
      // 白樺の列(幹+黒い横筋+揺れる葉)
      times(4, i => {
        const bx = W * (.08 + i * .22); FS('#e8e8e0'); rect(bx - W * .008, H * .15, W * .016, H * .5); SS('#383830'); lnW(1.2);
        times(5, k => {
          c.beginPath(); c.moveTo(bx - W * .008, H * (.2 + k * .08)); c.lineTo(bx + W * .006, H * (.2 + k * .08)); c.stroke();
        });
        FS('rgba(140,170,90,0.7)'); ellP(bx + Math.sin(t * 1.5 + i) * W * .005, H * .16, W * .05, H * .06);
      });
      // イズバ(丸太小屋): 丸太の筋+切妻屋根+窓+煙突の煙
      const ix = W * .28, iy = H * .55; FS('#8a6848'); rect(ix, iy, W * .22, H * .2);
      // 丸太の横筋
      c.strokeStyle = '#6a4c34'; lnW(2);
      times(6, k => {
        c.beginPath(); c.moveTo(ix, iy + H * .033 * (k + 1)); c.lineTo(ix + W * .22, iy + H * .033 * (k + 1)); c.stroke();
      });
      // 切妻屋根(苔むし感)
      FS('#5a4030'); poly([ix - W * .02,iy],[ix + W * .11,iy - H * .1],[ix + W * .24,iy]);
      // 窓(細工枠)
      FS('#f0e8c8'); rect(ix + W * .07, iy + H * .06, W * .08, H * .08); SS('#d8b888'); lnW(2); c.strokeRect(ix + W * .07, iy + H * .06, W * .08, H * .08); c.beginPath(); c.moveTo(ix + W * .11, iy + H * .06); c.moveTo(ix + W * .11, iy + H * .06); c.lineTo(ix + W * .11, iy + H * .14); c.moveTo(ix + W * .07, iy + H * .1); c.moveTo(ix + W * .07, iy + H * .1); c.lineTo(ix + W * .15, iy + H * .1); c.stroke();
      // 煙突+ゆれる煙
      c.fillStyle = '#4a3830'; rect(ix + W * .17, iy - H * .08, W * .02, H * .08); FS('rgba(230,230,230,0.5)');
      times(3, k => {
        c.beginPath();
        c.ellipse(ix + W * .18 + Math.sin(t * 2 + k) * W * .015,
          iy - H * (.1 + k * .05), W * (.018 + k * .008), H * (.02 + k * .01), 0, 0, 7);
        c.fill();
      });
      // 地面の草と小花
      c.fillStyle = '#6a9858'; rect(0, H * .72, W, H * .28); scat(832, 10, (rng, i) => {
        FS(['#d84838', '#e8c838', '#f0f0e8'][i % 3]); dotP(rng() * W, H * (.78 + rng() * .18), H * .008);
      });
    } else if (pr === 'haveli') {
      // ハヴェリ(ジャイサルメール): 砂岩の彫刻邸宅+ジャローカ窓+中庭+洗濯物
      sky([[0,'#f0d0a8'],[.5,'#d0a068'],[1,'#705038']]);
      // 邸宅の正面(砂岩色)
      FS('#c89858'); rect(W * .15, H * .25, W * .7, H * .5);
      // 彫刻の帯(連続アーチ)
      FS('#a87840');
      times(8, i => {
        c.beginPath(); c.arc(W * (.19 + i * .09), H * .3, W * .03, Math.PI, 0); c.fill();
      });
      rect(W * .15, H * .3, W * .7, H * .015);
      // ジャローカ窓(3つの張り出し窓)
      times(3, i => {
        const jx = W * (.28 + i * .22), jy = H * .48; FS('#b88848'); rect(jx - W * .05, jy - H * .12, W * .1, H * .12);
        // 格子
        c.strokeStyle = '#785030'; lnW(1.5);
        times(4, g => {
          c.beginPath(); c.moveTo(jx - W * .04 + g * W * .025, jy - H * .1); c.lineTo(jx - W * .04 + g * W * .025, jy - H * .02); c.stroke();
        });
        c.beginPath(); c.moveTo(jx - W * .05, jy - H * .07); c.moveTo(jx - W * .05, jy - H * .07); c.lineTo(jx + W * .05, jy - H * .07); c.moveTo(jx - W * .05, jy - H * .04); c.moveTo(jx - W * .05, jy - H * .04); c.lineTo(jx + W * .05, jy - H * .04); c.stroke();
        // 窓の庇(カッジャ)
        FS('#986838'); poly([jx - W * .06,jy - H * .12],[jx,jy - H * .16],[jx + W * .06,jy - H * .12]);
      });
      // 下の入口と中庭
      c.fillStyle = '#483020'; poly([W * .44,H * .75],[W * .44,H * .6],[W * .5,H * .55,W * .56,H * .6],[W * .56,H * .75]);
      // 中庭の地面+水盤
      c.fillStyle = '#8a6840'; rect(0, H * .75, W, H * .25); FS('#4a6a70'); ell(.5,.85,W * .1,H * .03);
      // 洗濯物(両脇の紐)
      SS('rgba(80,60,40,0.6)'); lnW(1); c.beginPath(); c.moveTo(W * .05, H * .4); c.moveTo(W * .05, H * .4); c.quadraticCurveTo(W * .12, H * .43, W * .15, H * .38); c.moveTo(W * .85, H * .38); c.moveTo(W * .85, H * .38); c.quadraticCurveTo(W * .9, H * .42, W * .95, H * .39); c.stroke(); const clothCols = ['#d04838', '#e8c838', '#3868a8', '#48a868'];
      times(4, i => {
        FS(clothCols[i]); rect(W * (.06 + i * .024), H * .395 + Math.sin(t + i) * H * .003, W * .02, H * .045);
      });
      // 飛ぶ鳥
      c.strokeStyle = 'rgba(70,50,35,0.7)'; lnW(1.3);
      times(3, i => {
        const bx = W * (.3 + i * .25 + Math.sin(t * .4 + i) * .02); const by = H * (.12 + (i % 2) * .06); c.beginPath(); c.moveTo(bx - 5, by); c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by); c.stroke();
      });
    } else if (pr === 'rann') {
      // ラン塩原(カッチ): 月に輝く白い塩の大地+亀裂+遠くの丘+流れ星
      sky([[0,'#182038'],[.5,'#3a4560'],[1,'#8890a8']]);
      // 大きな月
      c.fillStyle = '#e8e8f0'; dot(.7,.22,H * .09); FS('#c8ccd8'); dot(.67,.2,H * .02); dot(.73,.25,H * .015);
      // 星
      c.fillStyle = '#e8e8f0'; scat(731, 30, (rng, i) => {
        c.globalAlpha = .4 + .6 * rng(); rect(rng() * W, rng() * H * .4, 1.5, 1.5);
      });
      c.globalAlpha = 1;
      // 遠くの小さな丘
      c.fillStyle = '#2a3048'; poly([0,H * .48],[W * .15,H * .42,W * .3,H * .48],[W * .5,H * .44,W * .65,H * .48],[W,H * .48],[W,H * .48],[W,H * .6],[W,H * .48],[W,H * .6],[0,H * .6]);
      // 白い塩の大地(月の光を反射)
      const sg = c.createLinearGradient(0, H * .5, 0, H); sg.addColorStop(0, '#d0d4e0'); sg.addColorStop(1, '#9098b0'); FS(sg); rect(0, H * .5, W, H * .5);
      // 月の光の道
      c.fillStyle = 'rgba(240,240,250,0.35)'; poly([W * .62,H],[W * .67,H * .5],[W * .73,H * .5],[W * .78,H]);
      // 塩の亀裂模様(不規則な網目)
      SS('rgba(90,100,130,0.5)'); lnW(1);
      times(12, i => {
        const sx = rng() * W, sy = H * (.55 + rng() * .4); c.beginPath(); c.moveTo(sx, sy);
        times(3, j2 => {
          c.lineTo(sx + (rng() - .3) * W * .06, sy + rng() * H * .05);
        });
        c.stroke();
      });
      // 流れ星
      const mx = (t * .3 % 2) * W; SS('rgba(240,240,250,0.8)'); lnW(1.5); c.beginPath(); c.moveTo(mx, H * .15); c.lineTo(mx - W * .06, H * .19); c.stroke();
    } else if (pr === 'ghats') {
      // 西ガーツ山脈: 霧の立つ緑の重畳+白い滝筋+森林の海
      sky([[0,'#c8d8c0'],[.5,'#789868'],[1,'#2a4535']]);
      // 重なる尾根(遠→近、色濃く)
      const ridgeCols = ['#9ab890', '#7aa070', '#5a8050', '#3a6040']; scat(611, 4, (rng, r) => {
        FS(ridgeCols[r]); c.beginPath(); c.moveTo(0, H * (.38 + r * .14));
        for (let i = 0; i <= 8; i++) {
          c.lineTo(W * i / 8, H * (.38 + r * .14) - H * (.05 + rng() * .1) * (r + 1) * .3);
        }
        c.lineTo(W, H); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
        // 尾根の霧帯
        c.fillStyle = 'rgba(220,230,215,0.3)'; ell((.3 + r * .15) + Math.sin(t * .2 + r) * W * .03, (.4 + r * .14), W * .3, H * .03);
      });
      // 滝筋(複数)
      ([.3, .55, .8]).forEach(wx => {
        const wy = H * .45; SS('rgba(230,240,235,0.7)'); lnW(3); c.beginPath(); c.moveTo(W * wx, wy); c.quadraticCurveTo(W * wx - W * .01, wy + H * .15, W * wx + W * .005, wy + H * .3); c.stroke();
        // 落ち口の飛沫
        c.fillStyle = 'rgba(235,245,240,0.5)'; ellP(W * wx + W * .005, wy + H * .32, W * .02, H * .012);
      });
      // 前景の密林の影
      c.fillStyle = '#1e3528'; c.beginPath(); c.moveTo(0, H * .82);
      for (let i = 0; i <= 10; i++) {
        c.lineTo(W * i / 10, H * .82 - H * .03 * Math.abs(Math.sin(i * 2.7)));
      }
      c.lineTo(W, H); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
      // 飛ぶ鳥
      c.strokeStyle = 'rgba(40,50,45,0.7)'; lnW(1.3);
      times(4, i => {
        const bx = W * (.2 + i * .18 + Math.sin(t * .35 + i) * .02); const by = H * (.15 + (i % 2) * .07); c.beginPath(); c.moveTo(bx - 5, by); c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by); c.stroke();
      });
    } else if (pr === 'kaziranga') {
      // カジランガ: アッサムの湿地保護区 — イッサイ+一角サイ+沼地+飛ぶガン
      sky([[0,'#d8d0a8'],[.5,'#a0a868'],[1,'#3a5040']]);
      // 朝日(霞む)
      FS('#e8d8a8'); dot(.75,.22,H * .06);
      // 高い象草(イッサイ)の原っぱ
      scat(507, 26, (rng, i) => {
        const gx = rng() * W; const gh = H * (.12 + rng() * .18); const lean = (rng() - .5) * W * .02; SS(i % 3 ? '#5a7038' : '#6a8040'); lnW(2); c.beginPath(); c.moveTo(gx, H * .72); c.quadraticCurveTo(gx + lean, H * .72 - gh * .6, gx + lean * 2, H * .72 - gh); c.stroke();
      });
      // 一角サイ(灰色の巨体+単角)
      const rx = W * .35, ry = H * .66; FS('#6a6a60'); ellP(rx, ry, W * .09, H * .055);
      // 頭+角
      ellP(rx - W * .09, ry - H * .01, W * .035, H * .03, -.2); poly([rx - W * .115,ry - H * .035],[rx - W * .125,ry - H * .07],[rx - W * .1,ry - H * .04]);
      // 耳と脚
      rect(rx - W * .08, ry - H * .045, W * .012, H * .015); rect(rx - W * .06, ry + H * .03, W * .015, H * .035); rect(rx + W * .05, ry + H * .03, W * .015, H * .035);
      // 沼地(水溜まりの輪)
      FS('#3a5850');
      times(4, i => {
        const wx = W * (.15 + rng() * .7); const wy = H * (.78 + rng() * .15); ellP(wx, wy, W * (.04 + rng() * .05), H * .015);
      });
      // 前景の草むら
      c.fillStyle = '#2a4030'; rect(0, H * .85, W, H * .15);
      // 飛ぶガン(編隊)
      SS('rgba(50,55,45,0.8)'); lnW(1.4);
      times(5, i => {
        const bx = W * (.55 + i * .07 + S(.3) * .02); const by = H * (.28 + Math.abs(i - 2) * .04); c.beginPath(); c.moveTo(bx - 6, by); c.moveTo(bx - 6, by); c.quadraticCurveTo(bx, by - 5, bx + 6, by); c.stroke();
      });
    } else if (pr === 'kerala') {
      // ケーララのバックウォーター: 椰子並木の水路+ハウスボート+蓮+白鷺
      sky([[0,'#e0d8b0'],[.45,'#a8b878'],[1,'#305848']]);
      // 奥の椰子並木(左右)
      scat(441, 7, (rng, i) => {
        for (const s of [-1, 1]) {
          const px = W * .5 + s * W * (.12 + i * .06); const py = H * .6 - i * H * .015; const ps = 1 - i * .09; SS('#4a3a28'); lnW(3 * ps); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + s * W * .015, py - H * .1 * ps, px + s * W * .025, py - H * .16 * ps); c.stroke();
          // 葉
          c.strokeStyle = '#2a5838'; lnW(2 * ps);
          for (let f = -2; f <= 2; f++) {
            c.beginPath(); c.moveTo(px + s * W * .025, py - H * .16 * ps); c.quadraticCurveTo(px + s * W * (.025 + f * .02 * ps), py - H * (.16 + .04 * ps), px + s * W * (.025 + f * .04 * ps), py - H * (.12 * ps)); c.stroke();
          }
        }
      });
      // 水路
      c.fillStyle = '#3a5850'; poly([W * .3,H],[W * .44,H * .6],[W * .56,H * .6],[W * .7,H]);
      // 水光
      c.fillStyle = 'rgba(224,216,176,0.25)'; ell(.5, .85, W * .12, H * .05);
      // ハウスボート
      const bx = W * .5 + S(.4) * W * .015; const by = H * .78; FS('#5a4028'); poly([bx - W * .09,by],[bx,by + H * .05,bx + W * .09,by]);
      // 竹の屋根(アーチ)
      FS('#8a6840'); poly([bx - W * .07,by],[bx,by - H * .1,bx + W * .07,by],[bx + W * .05,by],[bx,by - H * .07,bx - W * .05,by]);
      // 蓮の葉と花
      c.fillStyle = '#3a6848';
      times(4, i => {
        const lx = W * (.18 + rng() * .6); const ly = H * (.72 + rng() * .2); ellP(lx, ly, W * .02, H * .008);
        if (i % 2 === 0) {
          FS('#e8a0b0'); dotP(lx, ly - H * .015, 3); FS('#3a6848');
        }
      });
      // 白鷺
      c.strokeStyle = '#e8e8e0'; lnW(1.5); const ex = W * .72, ey = H * .55 + S(.6) * H * .01; c.beginPath(); c.moveTo(ex - 7, ey); c.moveTo(ex - 7, ey); c.quadraticCurveTo(ex, ey - 5, ex + 7, ey); c.stroke();
    } else if (pr === 'gopuram') {
      // ゴープラム(南インド寺院): 層塔の門+聖なる水溜まり+灯籠+椰子
      sky([[0,'#f0c8b8'],[.5,'#d89878'],[1,'#605050']]);
      // 夕日
      c.fillStyle = '#f8d8b0'; dot(.8,.22,H * .055);
      // 層塔(上に窄む6段)
      const gx = W * .5; const tcols = ['#b06040', '#a85840', '#985038', '#884834', '#784030', '#683828'];
      times(6, i => {
        const w = W * (.34 - i * .04); const y2 = H * .72 - i * H * .09; FS(tcols[i]); rect(gx - w / 2, y2 - H * .09, w, H * .09);
        // 各層の彫刻(小さな突起の列)
        FS('#684030');
        times(7 - i, j2 => {
          const dx = gx - w / 2 + w * (j2 + .5) / (7 - i); rect(dx - W * .006, y2 - H * .075, W * .012, H * .04);
        });
      });
      // 頂の桶屋根
      c.fillStyle = '#d0a048'; c.beginPath(); c.ellipse(gx, H * .18, W * .07, H * .045, 0, Math.PI, 0); c.fill(); rect(gx - W * .07, H * .18, W * .14, H * .02);
      // 門の入口アーチ
      c.fillStyle = '#38282a'; poly([gx - W * .05,H * .72],[gx - W * .05,H * .62],[gx,H * .56,gx + W * .05,H * .62],[gx + W * .05,H * .72]);
      // 聖水溜りと映り込み
      c.fillStyle = '#305060'; rect(0, H * .78, W, H * .22); FS('rgba(176,96,64,0.35)'); ellP(gx, H * .86, W * .16, H * .07);
      // 両脇の椰子
      for (const s of [-1, 1]) {
        const px = gx + s * W * .35; SS('#4a3a28'); lnW(5); c.beginPath(); c.moveTo(px, H * .78); c.quadraticCurveTo(px + s * W * .02, H * .6, px + s * W * .04, H * .48); c.stroke(); SS('#2a5030'); lnW(3);
        for (let f = -2; f <= 2; f++) {
          c.beginPath(); c.moveTo(px + s * W * .04, H * .48); c.quadraticCurveTo(px + s * W * (.04 + f * .02), H * .42, px + s * W * (.04 + f * .045), H * .46); c.stroke();
        }
      }
      // 灯籠の点々
      c.fillStyle = '#f0c040';
      times(5, i => {
        dot((.15 + i * .18), .75 + Math.sin(t * 2 + i) * H * .003, 2);
      });
    } else if (pr === 'thar') {
      // タール砂漠(ラジャスタン): 金色の砂丘+キャラバン+遠くの城塞+照る太陽
      sky([[0,'#f0d0a0'],[.55,'#e0a860'],[1,'#c08840']]);
      // 大きな太陽
      c.fillStyle = '#f8e0b0'; dot(.75,.2,H * .07);
      // 遠くの城塞(丘の上の砦)
      FS('#a06840'); rect(W * .08, H * .38, W * .14, H * .1);
      times(3, i => {
        rect(W * (.09 + i * .045), H * .34, W * .02, H * .05); // 塔
      });
      FS('#885830'); poly([W * .05,H * .48],[W * .25,H * .48],[W * .28,H * .55],[W * .02,H * .55]);
      // 砂丘の稜線
      c.fillStyle = '#d09858'; poly([0,H * .6],[W * .3,H * .52,W * .6,H * .6],[W * .8,H * .66,W,H * .58],[W,H],[W,H],[0,H]); FS('#c88848'); poly([0,H * .75],[W * .5,H * .65,W,H * .78],[W,H],[W,H],[0,H]);
      // 風紋
      c.strokeStyle = 'rgba(180,130,70,0.5)'; lnW(1);
      times(5, i => {
        c.beginPath(); c.moveTo(W * (i * .2), H * (.82 + (i % 2) * .06)); c.quadraticCurveTo(W * (i * .2 + .1), H * (.8 + (i % 2) * .06), W * (i * .2 + .2), H * (.83 + (i % 2) * .06)); c.stroke();
      });
      // キャラバン(連なるラクダ)
      FS('#5a3a20');
      times(3, i => {
        const cx = W * (.35 + i * .09 + S(.4) * .005); const cy = H * .63 - i * H * .008;
        // 胴とこぶ
        ellP(cx, cy, W * .022, H * .018); c.beginPath(); c.beginPath(); c.arc(cx, cy - H * .02, H * .012, 0, 7); dotP(cx, cy - H * .02, H * .012);
        // 首と頭
        rect(cx + W * .018, cy - H * .04, 3, H * .035);
        // 脚
        rect(cx - W * .015, cy + H * .01, 2, H * .025); rect(cx + W * .01, cy + H * .01, 2, H * .025);
        // 乗り手
        dotP(cx - W * .005, cy - H * .028, H * .008);
      });
    } else if (pr === 'himalaya') {
      // ヒマラヤ: 連なる大雪山峰+山腹の僧院+翻る祈祷旗
      sky([[0,'#c8d8f0'],[.5,'#8098b8'],[1,'#40505e']]);
      // 高峰の列(雪を頂く鋭い山)
      scat(331, 5, (rng, i) => {
        const px = W * (i * .22 + .05); const ph = H * (.35 + rng() * .3); const pw = W * (.2 + rng() * .1); FS(i % 2 ? '#5a6a78' : '#4a5a68'); poly([px - pw / 2,H * .75],[px,H * .75 - ph],[px + pw / 2,H * .75]);
        // 頂の雪
        c.fillStyle = '#e8f0f8'; poly([px - pw * .12,H * .75 - ph * .78],[px,H * .75 - ph],[px + pw * .12,H * .75 - ph * .78],[px + pw * .06,H * .75 - ph * .72],[px - pw * .04,H * .75 - ph * .74]);
      });
      // 山腹の僧院(白い建物+金の屋根)
      const mx = W * .62, my = H * .68; FS('#e0dcd0'); rect(mx - W * .05, my - H * .05, W * .1, H * .05); FS('#c89030'); poly([mx - W * .06,my - H * .05],[mx,my - H * .09],[mx + W * .06,my - H * .05]);
      // 前景の斜面
      c.fillStyle = '#384850'; poly([0,H * .78],[W * .4,H * .7,W,H * .8],[W,H],[W,H],[0,H]);
      // 祈祷旗の列(紐に連なる色旗)
      const flagCols = ['#2858b0', '#e8e8e8', '#c03030', '#287030', '#e8c020'];
      times(2, s => {
        const y0 = H * (.58 + s * .08); SS('rgba(60,60,60,0.5)'); lnW(1); c.beginPath(); c.moveTo(W * .05, y0 - H * .04); c.quadraticCurveTo(W * .3, y0 + H * .02, W * (.5 + s * .1), y0); c.stroke();
        times(6, i => {
          const fp = i / 6; const fx = W * (.05 + fp * (.45 + s * .1)); const fy = (1 - fp) * (1 - fp) * (y0 - H * .04) + 2 * (1 - fp) * fp * (y0 + H * .02) + fp * fp * y0; FS(flagCols[(i + s) % 5]); rect(fx, fy, W * .018, H * .022);
        });
      });
      // 飛ぶ大鷲
      c.strokeStyle = 'rgba(40,45,55,0.8)'; lnW(1.6); const ex = W * .3 + S(.3) * W * .04, ey = H * .3 + C(.4) * H * .02; c.beginPath(); c.moveTo(ex - 9, ey); c.moveTo(ex - 9, ey); c.quadraticCurveTo(ex, ey - 6, ex + 9, ey); c.stroke();
    } else if (pr === 'ghat') {
      // ガート(ヴァラナシ): 川へ下る石段+寺院群+浮かぶ小舟+朝靄
      sky([[0,'#f0c8a0'],[.5,'#d89878'],[1,'#48606a']]);
      // 朝日と光筋
      c.fillStyle = '#f8d8a0'; dot(.2,.22,H * .06);
      // 寺院群(上部: ドームと尖塔の連なり)
      scat(209, 8, (rng, i) => {
        const tx = W * .05 + i * W * .13; const th = H * (.08 + rng() * .14); const tw = W * (.05 + rng() * .03); FS(i % 2 ? '#a05840' : '#b06850'); rect(tx, H * .45 - th, tw, th);
        if (i % 3 === 0) { // シカラ尖塔
          c.fillStyle = '#8a4830'; poly([tx - tw * .1,H * .45 - th],[tx + tw * .5,H * .45 - th - H * .06],[tx + tw * 1.1,H * .45 - th]);
        } else if (i % 3 === 1) { // ドーム
          c.beginPath(); c.arc(tx + tw * .5, H * .45 - th, tw * .5, Math.PI, 0); c.fill();
        }
      });
      // 石段(ガート: 幅の広がる階段)
      times(6, s => {
        FS(s % 2 ? '#c09070' : '#b08060'); const w = W * (.75 + s * .04); rect(W * .5 - w / 2, H * (.45 + s * .055), w, H * .055);
      });
      // 川面
      c.fillStyle = '#3a5560'; rect(0, H * .8, W, H * .2);
      // 光の反射
      c.fillStyle = 'rgba(248,200,140,0.35)'; rect(W * .05, H * .8, W * .3, H * .2);
      // 小舟
      times(3, i => {
        const bx = W * (.2 + i * .3) + Math.sin(t * .5 + i * 2) * W * .01; const by = H * (.85 + (i % 2) * .07); FS('#4a3028'); poly([bx - W * .05,by],[bx,by + H * .035,bx + W * .05,by]);
        // 漕ぎ手の影
        dotP(bx, by - H * .02, H * .015);
      });
      // 朝靄の帯
      c.fillStyle = 'rgba(240,210,180,0.28)'; ell(.5 + S(.2) * W * .04, .47, W * .5, H * .06);
    } else if (pr === 'taj') {
      // タージマハル: 白亜の霊廟 — 玉ねぎドーム+ミナレット4本+映る水鏡
      sky([[0,'#f0e0d0'],[.45,'#d8b0a0'],[1,'#305060']]);
      // 朝日
      c.fillStyle = '#f8d8b0'; dot(.8,.2,H * .05);
      // 中央の建物本体
      const bx = W * .5, by = H * .55; FS('#f0ece4'); rect(bx - W * .12, by - H * .16, W * .24, H * .16);
      // 玉ねぎドーム
      poly([bx - W * .07,by - H * .16],[bx - W * .08,by - H * .3,bx,by - H * .33],[bx + W * .08,by - H * .3,bx + W * .07,by - H * .16]);
      // 尖塔
      rect(bx - 2, by - H * .38, 4, H * .06);
      // 脇の小ドーム
      ([-1, 1]).forEach(s => {
        c.beginPath(); c.arc(bx + s * W * .09, by - H * .17, W * .028, Math.PI, 0); c.fill(); rect(bx + s * W * .09 - 1, by - H * .22, 2, H * .05);
      });
      // 中央アーチ入口
      c.fillStyle = '#3a3038'; poly([bx - W * .035,by],[bx - W * .035,by - H * .1],[bx,by - H * .15,bx + W * .035,by - H * .1],[bx + W * .035,by]);
      // ミナレット4本
      c.fillStyle = '#e0dcd2';
      ([-1.6, -1.25, 1.25, 1.6]).forEach(s => {
        const mx = bx + s * W * .12; rect(mx - W * .008, by - H * .26, W * .016, H * .26); c.beginPath(); c.arc(mx, by - H * .27, W * .012, Math.PI, 0); c.fill();
      });
      // 水面の映り込み
      c.fillStyle = 'rgba(240,236,228,0.4)'; poly([bx - W * .1,H],[bx - W * .05,by + H * .05],[bx + W * .05,by + H * .05],[bx + W * .1,H]);
      // 両脇の木々
      c.fillStyle = '#3a5040';
      times(4, i => {
        ([-1, 1]).forEach(s => {
          const tx = bx + s * W * (.2 + i * .08); rect(tx - 2, by + H * .02 - H * .06, 4, H * .06); dotP(tx, by + H * .02 - H * .07, W * .02);
        });
      });
    } else if (pr === 'stupa') {
      // 仏塔(ボロブドゥール): 段々の基壇+鐘形の仏塔+朝霧+ジャングル
      sky([[0,'#e8c890'],[.5,'#c8a878'],[1,'#4a5a48']]);
      // 朝日
      c.fillStyle = '#f0d8a0'; dot(.7,.25,H * .06);
      // 遠くのジャングルの影
      c.fillStyle = '#4a5a45'; c.beginPath(); c.moveTo(0, H * .5);
      for (let i = 0; i <= 10; i++) {
        c.lineTo(W * i / 10, H * .5 - H * .04 * Math.abs(Math.sin(i * 2.3)));
      }
      c.lineTo(W, H); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
      // 段々の基壇(3段)
      FS('#8a7058'); rect(W * .1, H * .62, W * .8, H * .38); FS('#7a6048'); rect(W * .15, H * .54, W * .7, H * .08); FS('#6a5040'); rect(W * .2, H * .48, W * .6, H * .06);
      // 鐘形の仏塔の列(透かし格子)
      scat(187, 2, (rng, row) => {
        const n = 6 - row * 2;
        times(n, i => {
          const sx = W * (.24 + i * .1 + row * .05); const sy = H * (.5 - row * .07); const sr = W * .028; FS('#5a4438'); poly([sx - sr,sy],[sx - sr,sy - sr * 1.4,sx,sy - sr * 1.5],[sx + sr,sy - sr * 1.4,sx + sr,sy]);
          // 尖塔
          rect(sx - 1.5, sy - sr * 1.8, 3, sr * .4);
        });
      });
      // 中央の大仏塔
      c.fillStyle = '#4a382e'; poly([W * .44,H * .5],[W * .44,H * .32,W * .5,H * .3],[W * .56,H * .32,W * .56,H * .5]); rect(W * .492, H * .22, W * .016, H * .1);
      // 朝霧の帯
      c.fillStyle = 'rgba(240,230,210,0.3)'; ell(.5 + S(.25) * W * .05, .52, W * .45, H * .05);
      // 飛ぶ鳥
      c.strokeStyle = 'rgba(60,50,40,0.7)'; lnW(1.3);
      times(4, i => {
        const bx = W * (.15 + i * .2 + Math.sin(t * .4 + i) * .03); const by = H * (.15 + (i % 2) * .08); c.beginPath(); c.moveTo(bx - 5, by); c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by); c.stroke();
      });
    } else if (pr === 'dojo') {
      // 道場: 板張りの床+障子の窓+掛け軸+木刀
      sky([[0,'#8a7458'],[.55,'#b8956a'],[1,'#7a5f42']]);
      // 壁と床の境
      c.fillStyle = '#9a7a54'; rect(0, H * .55, W, H * .45);
      // 床の板目(遠近感)
      SS('rgba(90,65,40,0.5)'); lnW(1.5);
      times(10, i => {
        const fx = W * i / 9; c.beginPath(); c.moveTo(W * .5 + (fx - W * .5) * .4, H * .55); c.lineTo(fx, H); c.stroke();
      });
      times(4, i => {
        const fy = H * (.6 + i * .1); c.beginPath(); c.moveTo(0, fy); c.moveTo(0, fy); c.lineTo(W, fy); c.stroke();
      });
      // 障子窓(両側に光)
      for (let s = 0; s < 2; s++) {
        const wx = s === 0 ? W * .05 : W * .78; FS('#f0e8d0'); rect(wx, H * .12, W * .17, H * .38); SS('#6a5238'); lnW(2); c.strokeRect(wx, H * .12, W * .17, H * .38);
        // 格子
        c.beginPath();
        for (let i = 1; i < 4; i++) {
          c.moveTo(wx + W * .17 * i / 4, H * .12); c.lineTo(wx + W * .17 * i / 4, H * .5);
        }
        for (let i = 1; i < 3; i++) {
          c.moveTo(wx, H * .12 + H * .38 * i / 3); c.lineTo(wx + W * .17, H * .12 + H * .38 * i / 3);
        }
        c.stroke();
      }
      // 掛け軸(中央の書)
      FS('#f5efe0'); rect(W * .45, H * .08, W * .1, H * .3); FS('#4a3a28'); rect(W * .43, H * .08, W * .14, H * .02); rect(W * .43, H * .36, W * .14, H * .02);
      // 大きな一文字
      c.strokeStyle = '#1a1a1a'; lnW(5); c.beginPath(); c.moveTo(W * .47, H * .15); c.moveTo(W * .47, H * .15); c.lineTo(W * .53, H * .15); c.moveTo(W * .5, H * .13); c.moveTo(W * .5, H * .13); c.lineTo(W * .5, H * .28); c.moveTo(W * .475, H * .22); c.moveTo(W * .475, H * .22); c.quadraticCurveTo(W * .5, H * .26, W * .525, H * .22); c.stroke();
      // 木刀(壁に立てかけ)
      SS('#5a4228'); lnW(4); c.beginPath(); c.moveTo(W * .32, H * .52); c.lineTo(W * .35, H * .3); c.stroke(); SS('#3a2a18'); lnW(5); c.beginPath(); c.moveTo(W * .335, H * .42); c.moveTo(W * .335, H * .42); c.lineTo(W * .365, H * .415); c.stroke();
    } else if (pr === 'meteora') {
      // メテオラ: 天空の岩柱+頂の僧院+夕空+鳶
      sky([[0,'#e8a870'],[.5,'#c87860'],[1,'#5a4a50']]);
      // 夕日
      c.fillStyle = '#f0d090'; dot(.25,.35,H * .06);
      // 遠くの岩柱(薄い)
      FS('rgba(110,80,80,0.5)'); scat(257, 4, (rng, i) => {
        const px = W * (.08 + i * .24); const ph = H * (.3 + rng() * .2); poly([px,H],[px + W * .015,H - ph],[px + W * .05,H - ph - H * .02],[px + W * .065,H]);
      });
      // 手前の大岩柱
      c.fillStyle = '#6a5048'; poly([W * .55,H],[W * .58,H * .42],[W * .62,H * .36,W * .68,H * .38],[W * .74,H * .42],[W * .77,H]);
      // 岩の縞
      c.strokeStyle = 'rgba(60,45,42,0.5)'; lnW(2);
      times(4, i => {
        const sy = H * (.5 + i * .12); c.beginPath(); c.moveTo(W * (.57 + i * .005), sy); c.quadraticCurveTo(W * .66, sy + H * .015, W * .76, sy); c.stroke();
      });
      // 頂の僧院(赤い屋根)
      FS('#e8dcc8'); rect(W * .62, H * .34, W * .09, H * .06); FS('#a04030'); poly([W * .6,H * .345],[W * .665,H * .31],[W * .73,H * .345]); FS('#3a4a55');
      times(3, i => {
        rect(W * .63 + i * W * .026, H * .355, W * .012, H * .025);
      });
      // 小さな岩柱+僧院(左)
      FS('#5a463e'); poly([W * .15,H],[W * .17,H * .6],[W * .21,H * .58],[W * .23,H]); FS('#e8dcc8'); rect(W * .175, H * .555, W * .035, H * .03); FS('#a04030'); c.beginPath(); c.moveTo(W * .172, H * .558); c.moveTo(W * .172, H * .558); c.lineTo(W * .192, H * .54); c.moveTo(W * .172, H * .558); c.lineTo(W * .192, H * .54); c.lineTo(W * .212, H * .558); c.closePath(); c.closePath(); c.fill();
      // 鳶(8の字に回る)
      SS('rgba(50,40,35,0.8)'); lnW(1.5); const bx = W * (.4 + .15 * S(.5)); const by = H * (.25 + .08 * Math.sin(t)); c.beginPath(); c.moveTo(bx - 8, by); c.quadraticCurveTo(bx - 3, by - 5 - 2 * S(6), bx, by); c.quadraticCurveTo(bx + 3, by - 5 - 2 * S(6), bx + 8, by); c.stroke();
    } else if (pr === 'rapids') {
      // 急流: 白く弾ける水+転がる岩+両岸の断崖
      sky([[0,'#7a9a90'],[.45,'#4a6a60'],[1,'#2a4a5a']]);
      // 両岸の断崖
      c.fillStyle = '#3a4a42'; c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .3, 0); c.quadraticCurveTo(W * .35, H * .3, W * .28, H * .55); c.lineTo(W * .18, H); c.lineTo(W * .18, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .72, 0); c.quadraticCurveTo(W * .66, H * .3, W * .74, H * .55); c.lineTo(W * .84, H); c.lineTo(W * .84, H); c.lineTo(W, H); c.closePath(); c.closePath(); c.fill();
      // 崖の緑
      c.fillStyle = '#4a6a52'; c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .3, 0); c.moveTo(0, 0); c.lineTo(W * .3, 0); c.lineTo(W * .28, H * .1); c.moveTo(0, 0); c.lineTo(W * .3, 0); c.lineTo(W * .28, H * .1); c.lineTo(0, H * .15); c.closePath(); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .72, 0); c.moveTo(W, 0); c.lineTo(W * .72, 0); c.lineTo(W * .74, H * .1); c.moveTo(W, 0); c.lineTo(W * .72, 0); c.lineTo(W * .74, H * .1); c.lineTo(W, H * .15); c.closePath(); c.closePath(); c.fill();
      // 川の水(深い緑青)
      const wat = c.createLinearGradient(0, H * .4, 0, H); wat.addColorStop(0, '#3a7a80'); wat.addColorStop(1, '#1a4a58'); FS(wat); c.beginPath(); c.moveTo(W * .28, H * .55); c.moveTo(W * .28, H * .55); c.lineTo(W * .18, H); c.lineTo(W * .84, H); c.lineTo(W * .84, H); c.lineTo(W * .74, H * .55); c.closePath(); c.closePath(); c.fill();
      // 転がる岩+白い水しぶき
      const rng = L.mulberry32(941);
      times(7, i => {
        const rx = W * (.28 + rng() * .45); const ry = H * (.58 + rng() * .35); const rr = W * (.02 + rng() * .03);
        // 岩
        c.fillStyle = '#5a5a55'; ellP(rx, ry, rr, rr * .7);
        // 水しぶき(ゆらぐ)
        SS('rgba(230,245,250,0.75)'); lnW(1.5); const fl = Math.sin(t * 5 + i * 2); c.beginPath(); c.moveTo(rx - rr * 1.4, ry); c.quadraticCurveTo(rx - rr * .5, ry - rr * (0.8 + fl * .3), rx, ry - rr * .2); c.moveTo(rx + rr * .3, ry - rr * .15); c.quadraticCurveTo(rx + rr, ry - rr * (0.6 - fl * .3), rx + rr * 1.5, ry + 2); c.stroke();
      });
      // 流れの筋(速い)
      SS('rgba(200,235,240,0.5)'); lnW(1.5);
      times(8, i => {
        const sy = H * (.58 + i * .05); const off = (t * .3 + i * .13) % 1; c.beginPath(); c.moveTo(W * (.22 + off * .1), sy); c.lineTo(W * (.5 + off * .1), sy + H * .04); c.stroke();
      });
      // 飛沫の点
      c.fillStyle = 'rgba(240,250,255,0.6)';
      times(15, i => {
        const px = W * (.3 + rng() * .4); const py = H * (.6 + rng() * .3); const tw = .5 + .5 * Math.sin(t * 4 + i); dotP(px, py, 1.5 * tw);
      });
    } else if (pr === 'iceberg') {
      // 氷山: 輝く巨大な氷山+冷たい海+流氷+アザラシ
      sky([[0,'#4a6a8a'],[.5,'#7a9ab5'],[1,'#3a5a75']]);
      // 低い太陽
      c.fillStyle = 'rgba(240,230,200,0.8)'; dot(.2,.22,H * .05);
      // 氷山本体(水上)
      FS('#dceef5'); poly([W * .3,H * .58],[W * .38,H * .3],[W * .46,H * .42],[W * .55,H * .22],[W * .63,H * .4],[W * .72,H * .58]);
      // 氷山の影面
      c.fillStyle = '#a8c8dc'; poly([W * .55,H * .22],[W * .63,H * .4],[W * .72,H * .58],[W * .55,H * .58]); FS('#c0dcea'); poly([W * .46,H * .42],[W * .55,H * .22],[W * .55,H * .58],[W * .4,H * .58]);
      // 海
      const sea = c.createLinearGradient(0, H * .58, 0, H); sea.addColorStop(0, '#2a4a62'); sea.addColorStop(1, '#16283a'); FS(sea); rect(0, H * .58, W, H * .42);
      // 氷山の映り込み
      c.fillStyle = 'rgba(190,220,235,0.25)'; poly([W * .35,H * .58],[W * .5,H * .72],[W * .68,H * .58]);
      // 流氷の欠片
      c.fillStyle = 'rgba(220,235,245,0.8)'; scat(761, 10, (rng, i) => {
        const fx = rng() * W; const fy = H * (.62 + rng() * .32); const fw = W * (.02 + rng() * .05); const dy = Math.sin(t * .8 + i) * 2; poly([fx,fy + dy],[fx + fw * .4,fy - H * .012 + dy],[fx + fw,fy + dy],[fx + fw * .8,fy + H * .008 + dy],[fx + fw * .15,fy + H * .01 + dy]);
      });
      // アザラシ(丸い頭だけ出す)
      const sx = W * (.15 + .1 * S(.2)); const sy = H * (.78 + .01 * S(1.5)); FS('#4a5a64'); ellP(sx, sy, W * .018, H * .018); FS('#222'); c.beginPath(); c.arc(sx - W * .005, sy - 2, 1.5, 0, 7); c.arc(sx + W * .005, sy - 2, 1.5, 0, 7); c.fill();
      // 波の筋
      c.strokeStyle = 'rgba(160,200,220,0.3)'; lnW(1.2);
      for (let i = 0; i < 6; i++) {
        const wy = H * (.6 + i * .07); c.beginPath(); c.moveTo(0, wy);
        for (let x = 0; x <= 8; x++) {
          c.lineTo(W * x / 8, wy + Math.sin(x * 1.8 + i * 2.5 + t * .9) * H * .008);
        }
        c.stroke();
      }
    } else if (pr === 'cloudforest') {
      // 雲霧林: 霧に沈む巨大な樹+垂れ下がる苔+羽ばたく鳥
      sky([[0,'#8aa098'],[.5,'#5a7a68'],[1,'#2a4438']]);
      // 奥の樹(霧で薄い)
      FS('rgba(60,90,75,0.5)');
      times(5, i => {
        const tx = W * (.1 + i * .2); rect(tx, H * .15, W * .015, H * .7); ellP(tx + W * .008, H * .15, W * .06, H * .1);
      });
      // 流れる霧の帯(2層)
      times(2, i => {
        const my = H * (.3 + i * .25); const mx = Math.sin(t * .3 + i * 2) * W * .08;
        FS(`rgba(200,220,210,${.25 - i * .08})`);
        ellP(W * .5 + mx, my, W * .55, H * .07);
      });
      // 手前の巨木
      c.fillStyle = '#1e3228'; rect(W * .08, 0, W * .05, H); rect(W * .85, 0, W * .06, H);
      // 枝
      c.beginPath(); c.moveTo(W * .13, H * .2); c.moveTo(W * .13, H * .2); c.lineTo(W * .35, H * .12); c.lineTo(W * .35, H * .16); c.lineTo(W * .35, H * .16); c.lineTo(W * .13, H * .27); c.closePath(); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W * .85, H * .28); c.moveTo(W * .85, H * .28); c.lineTo(W * .65, H * .2); c.lineTo(W * .65, H * .24); c.lineTo(W * .65, H * .24); c.lineTo(W * .85, H * .35); c.closePath(); c.closePath(); c.fill();
      // 垂れ下がる苔(ゆれる)
      SS('rgba(120,160,110,0.8)'); lnW(2); const rng = L.mulberry32(433);
      times(14, i => {
        const bx = W * (.14 + rng() * .2); const by = H * (.13 + rng() * .08); const bl = H * (.06 + rng() * .12); const sw = Math.sin(t + i) * 3; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw, by + bl * .6, bx + sw * .6, by + bl); c.stroke();
      });
      times(10, i => {
        const bx = W * (.66 + rng() * .18); const by = H * (.21 + rng() * .08); const bl = H * (.05 + rng() * .1); const sw = Math.sin(t * 1.2 + i) * 3; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw, by + bl * .6, bx + sw * .6, by + bl); c.stroke();
      });
      // 下草
      c.fillStyle = '#24392e'; rect(0, H * .82, W, H * .18); SS('#3a5a48'); lnW(2);
      times(20, i => {
        const gx = rng() * W; c.beginPath(); c.moveTo(gx, H); c.quadraticCurveTo(gx + 4, H * .9, gx + Math.sin(t + i) * 5, H * .84); c.stroke();
      });
      // 鳥(ケツァール風: 緑の影)
      FS('rgba(60,140,100,0.85)'); const bx2 = W * (.3 + .2 * S(.4)); const by2 = H * (.45 + .06 * S(1.3)); const flap = S(8); c.beginPath(); c.beginPath(); c.ellipse(bx2, by2, 8, 5, 0, 0, 7); ellP(bx2, by2, 8, 5); c.beginPath(); c.moveTo(bx2 - 4, by2); c.quadraticCurveTo(bx2 - 14, by2 - 8 * flap, bx2 - 18, by2 - 2); c.stroke();
    } else if (pr === 'grotto') {
      // 青の洞窟: 輝く青い水+鍾乳石+水面の反射+入口の光
      sky([[0,'#0a1520'],[.55,'#10283a'],[1,'#0a3a50']]);
      // 入口の白光(奥)
      const glow = c.createRadialGradient(W * .5, H * .38, 0, W * .5, H * .38, W * .25); glow.addColorStop(0, 'rgba(180,220,255,0.7)'); glow.addColorStop(1, 'rgba(180,220,255,0)'); FS(glow); rect(0, 0, W, H * .7);
      // 鍾乳石
      c.fillStyle = '#1a2a35'; scat(887, 12, (rng, i) => {
        const sx = rng() * W; const sh = H * (.08 + rng() * .22); const sw = W * (.01 + rng() * .03); poly([sx - sw,0],[sx,sh],[sx + sw,0]);
      });
      // 側壁の岩
      c.fillStyle = '#16242e'; c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .12, 0); c.quadraticCurveTo(W * .16, H * .4, W * .1, H * .6); c.lineTo(0, H * .75); c.lineTo(0, H * .75); c.closePath(); c.lineTo(0, H * .75); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .88, 0); c.quadraticCurveTo(W * .84, H * .4, W * .9, H * .6); c.lineTo(W, H * .75); c.lineTo(W, H * .75); c.closePath(); c.lineTo(W, H * .75); c.closePath(); c.fill();
      // 輝く青い水面
      const water = c.createLinearGradient(0, H * .62, 0, H); water.addColorStop(0, '#1a6a8a'); water.addColorStop(1, '#0a4a6a'); FS(water); rect(0, H * .62, W, H * .38);
      // 水面の光の反射(ゆらぐ)
      FS('rgba(150,220,255,0.3)');
      times(10, i => {
        const rx = W * (.3 + i * .045); const ry = H * (.64 + i * .03); const rw = W * (.02 + .012 * Math.sin(t * 1.5 + i)); rect(rx - rw / 2, ry, rw, 2);
      });
      // 光の筋(入口から水へ)
      FS('rgba(170,210,255,0.1)'); c.beginPath(); c.moveTo(W * .44, H * .35); c.moveTo(W * .44, H * .35); c.lineTo(W * .36, H); c.lineTo(W * .52, H); c.lineTo(W * .52, H); c.lineTo(W * .52, H * .35); c.closePath(); c.closePath(); c.fill();
      // 水滴のきらめき
      c.fillStyle = 'rgba(200,240,255,0.7)';
      times(8, i => {
        const sx = rng() * W; const sy = H * (.3 + rng() * .3); const tw = .5 + .5 * Math.sin(t * 3 + i * 2); dotP(sx, sy, 1.5 * tw);
      });
    } else if (pr === 'canal') {
      // 運河の街: 両岸の彩色建物+アーチ橋+水面に揺れるゴンドラ
      sky([[0,'#a0c0d8'],[.6,'#c8b8a0'],[1,'#6a8090']]);
      // 両岸の建物(左)
      const rng = L.mulberry32(613); const hues = ['#c07050', '#d0a060', '#a08060', '#b06050', '#c09070'];
      times(4, i => {
        const bx = W * i * .13; const bh = H * (.2 + rng() * .15); FS(hues[i % hues.length]); rect(bx, H * .45 - bh, W * .12, bh);
        // 窓
        c.fillStyle = '#4a5a6a';
        times(3, w => {
          rect(bx + W * .02 + w * W * .035, H * .45 - bh * .7, W * .018, bh * .25);
        });
      });
      // 右側
      times(4, i => {
        const bx = W * (.6 + i * .11); const bh = H * (.18 + rng() * .16); FS(hues[(i + 2) % hues.length]); rect(bx, H * .45 - bh, W * .1, bh); FS('#4a5a6a');
        times(2, w => {
          rect(bx + W * .015 + w * W * .04, H * .45 - bh * .65, W * .02, bh * .3);
        });
      });
      // 遠くのアーチ橋
      c.fillStyle = '#8a7058'; poly([W * .32,H * .52],[W * .5,H * .38,W * .68,H * .52],[W * .68,H * .56],[W * .68,H * .56],[W * .32,H * .56]);
      // 運河の水面
      c.fillStyle = '#4a6a7a'; rect(0, H * .56, W, H * .44);
      // 水の揺らめき
      c.strokeStyle = 'rgba(200,220,230,0.35)'; lnW(1.5);
      for (let i = 0; i < 9; i++) {
        const wy = H * (.6 + i * .045); c.beginPath(); c.moveTo(0, wy);
        for (let x = 0; x <= 8; x++) {
          c.lineTo(W * x / 8, wy + Math.sin(x * 2 + i * 3 + t * .8) * H * .006);
        }
        c.stroke();
      }
      // ゴンドラ(ゆっくり横切る)
      const gx = W * (.75 - ((t * .04) % 1) * .5); FS('#20242a'); poly([gx - W * .06,H * .7],[gx,H * .75,gx + W * .06,H * .7],[gx + W * .07,H * .66,gx + W * .06,H * .69],[gx - W * .06,H * .69],[gx - W * .07,H * .66,gx - W * .06,H * .7]);
      // 船頭
      rect(gx + W * .02, H * .64, W * .008, H * .05); dotP(gx + W * .024, H * .63, H * .008);
      // 橋の欄干
      c.strokeStyle = '#6a5038'; lnW(2); c.beginPath(); c.moveTo(W * .32, H * .5); c.quadraticCurveTo(W * .5, H * .36, W * .68, H * .5); c.stroke();
    } else if (pr === 'pampas') {
      // パンパス: 銀色の穂の草原+大空+遠くのガウチョの影
      sky([[0,'#8ab8e0'],[.55,'#c8d8c0'],[1,'#9aa86a']]);
      // 大きな太陽
      c.fillStyle = '#f0e0a0'; dot(.78,.18,H * .07);
      // 遠くの地平の丘
      c.fillStyle = '#a8b87a'; poly([0,H * .58],[W * .3,H * .52,W * .65,H * .56],[W * .85,H * .6,W,H * .55],[W,H],[W,H],[0,H]);
      // パンパスグラスの穂(白銀の揺れる房)
      scat(509, 40, (rng, i) => {
        const px = rng() * W; const py = H * (.6 + rng() * .38); const ph = H * (.08 + rng() * .1); const sw = Math.sin(t * 1.2 + px * .05) * ph * .12;
        // 茎
        c.strokeStyle = 'rgba(120,130,80,0.7)'; lnW(1.2); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + sw * .5, py - ph * .6, px + sw, py - ph); c.stroke();
        // 銀色の穂
        c.fillStyle = 'rgba(225,222,205,0.85)'; ellP(px + sw, py - ph, 2.5, ph * .28, sw * .02);
      });
      // ガウチョの影(小さな騎馬のシルエット)
      const gx = W * (.1 + .05 * S(.1)); FS('rgba(40,35,30,0.8)'); rect(gx, H * .55, W * .025, H * .015); rect(gx + W * .003, H * .535, W * .008, H * .018); // 馬の体 // 人
      // 鳥の群れ
      c.strokeStyle = 'rgba(60,60,60,0.7)'; lnW(1.3);
      times(5, i => {
        const bx = W * (.15 + i * .13 + Math.sin(t * .3 + i) * .02); const by = H * (.12 + (i % 3) * .05); c.beginPath(); c.moveTo(bx - 5, by); c.moveTo(bx - 5, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by); c.stroke();
      });
    } else if (pr === 'tea') {
      // 茶畑: 等高線に沿って曲がる茶の列+霧の山+摘み手の笠
      sky([[0,'#a8c8d8'],[.45,'#c8d8b8'],[1,'#5a8a50']]);
      // 霧の立つ山
      c.fillStyle = '#8a9a90'; poly([0,H * .45],[W * .3,H * .28,W * .6,H * .4],[W * .8,H * .48,W,H * .42],[W,H * .55],[W,H * .55],[0,H * .55]);
      // 山の霧
      c.fillStyle = 'rgba(230,235,230,0.35)'; ell(.5 + S(.2) * W * .03, .42, W * .35, H * .04);
      // 等高線に沿う茶の列(うねる暗緑の帯)
      for (let i = 0; i < 6; i++) {
        const ry = H * (.56 + i * .07); const amp = .015 + i * .008; // 下ほど波が大きい
        c.strokeStyle = `rgba(45,${90 + i * 8},50,${.85 - i * .06})`;
        lnW(H * .028); c.beginPath(); c.moveTo(0, ry);
        for (let x = 0; x <= 8; x++) {
          c.lineTo(W * x / 8, ry + Math.sin(x * 1.5 + i * 2 + t * .15) * H * amp);
        }
        c.stroke();
      }
      // 列間の畦道
      c.strokeStyle = 'rgba(160,150,110,0.5)'; lnW(2);
      times(4, i => {
        const px = W * (.15 + i * .22); c.beginPath(); c.moveTo(px, H * .55); c.lineTo(px + W * .05, H); c.stroke();
      });
      // 摘み手の菅笠(点々)
      scat(359, 4, (rng, i) => {
        const px = W * (.2 + rng() * .6); const py = H * (.68 + rng() * .2); FS('#c8b060'); c.beginPath(); c.moveTo(px - W * .012, py); c.moveTo(px - W * .012, py); c.lineTo(px, py - H * .018); c.moveTo(px - W * .012, py); c.lineTo(px, py - H * .018); c.lineTo(px + W * .012, py); c.closePath(); c.closePath(); c.fill();
      });
    } else if (pr === 'glade') {
      // 林間の広場: 周囲を囲む高木+木漏れ日の光柱+花の咲く草地+舞う蝶
      sky([[0,'#4a7a5a'],[.5,'#6a9a68'],[1,'#4a7a48']]); const rng = L.mulberry32(347);
      // 周囲の高木(左右に縁取る)
      ([0, 1]).forEach(side => {
        times(4, i => {
          const tx = W * (side ? .72 + i * .08 : .02 + i * .08); const th = H * (.5 + rng() * .15); FS('#4a3a28'); rect(tx, H * .55 - th * .3, W * .012, th * .3 + H * .1); FS('#3a6a40'); ellP(tx + W * .006, H * .55 - th * .35, W * .07, H * .14);
        });
      });
      // 中央の草地
      c.fillStyle = '#5a8a48'; rect(0, H * .55, W, H * .45);
      // 木漏れ日の光柱
      times(3, i => {
        const gx = W * (.35 + i * .12) + Math.sin(t * .3 + i) * W * .01; FS('rgba(255,240,180,0.12)'); c.beginPath(); c.moveTo(gx, H * .1); c.moveTo(gx, H * .1); c.lineTo(gx + W * .05, H * .1); c.lineTo(gx + W * .09, H * .7); c.lineTo(gx + W * .09, H * .7); c.lineTo(gx + W * .04, H * .7); c.closePath(); c.closePath(); c.fill();
      });
      // 草の筋
      c.strokeStyle = 'rgba(40,80,35,0.5)'; lnW(1.5);
      times(10, i => {
        const px = W * (.28 + rng() * .44); const py = H * (.62 + rng() * .3); c.beginPath(); c.moveTo(px, py); c.moveTo(px, py); c.lineTo(px + W * .004, py - H * .025); c.stroke();
      });
      // 咲く花
      times(12, i => {
        const px = W * (.26 + rng() * .48); const py = H * (.6 + rng() * .32); FS(['#e8e0f0', '#f0d8e8', '#f8e8a8', '#e8f0d8'][Math.floor(rng() * 4)]); dotP(px, py, W * .005);
      });
      // 舞う蝶
      times(3, i => {
        const bx = W * .5 + Math.sin(t * .5 + i * 2.2) * W * (.1 + i * .06); const by = H * .55 + Math.sin(t * .9 + i * 1.3) * H * .08; const flap = Math.sin(t * 12 + i) * .6; FS(['#f0c8e0', '#f0e0b0', '#c8e0f0'][i]); c.beginPath(); c.ellipse(bx - W * .006, by, W * .007, H * .004 * Math.abs(flap) + H * .002, -.3, 0, 7); c.ellipse(bx + W * .006, by, W * .007, H * .004 * Math.abs(flap) + H * .002, .3, 0, 7); c.fill();
      });
      // 浮かぶ花粉
      c.fillStyle = 'rgba(255,250,210,0.5)';
      times(6, i => {
        const px = W * (.3 + rng() * .4) + Math.sin(t * .6 + i) * W * .015; const py = H * (.3 + rng() * .3) + Math.cos(t * .5 + i) * H * .015; dotP(px, py, 1.5);
      });
    } else if (pr === 'billabong') {
      // ビラボン: 乾いた大地の静かな水溜り+ガムの木+映り込み+水鳥
      sky([[0,'#e8c88a'],[.5,'#d8a860'],[1,'#a87848']]);
      // 低い太陽
      c.fillStyle = '#f0e0b0'; dot(.8, .2, H * .09);
      // 乾いた大地(遠景)
      FS('#b08a58'); rect(0, H * .5, W, H * .5);
      // 地平の低い丘
      c.fillStyle = '#9a7850'; poly([0,H * .5],[W * .3,H * .44,W * .6,H * .5],[W * .8,H * .54,W,H * .5],[W,H * .55],[W,H * .55],[0,H * .55]);
      // ガムの木(白っぽい幹+頭の雲状の葉)
      scat(337, 3, (rng, i) => {
        const tx = W * (.12 + i * .15 + rng() * .04); const th = H * (.22 + rng() * .08); FS('#c8b8a0'); rect(tx, H * .55 - th, W * .008, th); FS('#6a8a58'); // 白い幹
        times(4, j => {
          ellP(tx + W * (rng() - .4) * .05, H * .55 - th - H * (rng() * .06), W * .035, H * .022);
        });
      });
      // 水溜り(三日月状の水域)
      const wg = c.createLinearGradient(0, H * .62, 0, H * .85); wg.addColorStop(0, '#5a8a9a'); wg.addColorStop(1, '#3a6a7a'); FS(wg); ell(.55, .72, W * .32, H * .11);
      // 木の映り込み
      c.fillStyle = 'rgba(90,120,90,0.3)';
      times(3, i => {
        const tx = W * (.12 + i * .15); ellP(tx, H * .68, W * .03, H * .02);
      });
      // 水面の輝き+さざ波
      c.strokeStyle = 'rgba(200,235,245,0.4)'; lnW(1.5);
      times(5, i => {
        const py = H * (.66 + i * .03); c.beginPath(); c.moveTo(W * .35 + Math.sin(t * .7 + i) * W * .02, py); c.lineTo(W * .7 + Math.sin(t * .7 + i) * W * .02, py); c.stroke();
      });
      // 水鳥(佇むシギ)
      SS('#3a3028'); lnW(1.5); const bx = W * .32, by = H * .66; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + H * .025); c.stroke(); FS('#3a3028'); c.beginPath(); c.beginPath(); c.ellipse(bx + W * .004, by - H * .004, W * .008, H * .006, 0, 0, 7); ellP(bx + W * .004, by - H * .004, W * .008, H * .006); c.beginPath(); c.beginPath(); c.arc(bx + W * .012, by - H * .012, W * .004, 0, 7); dotP(bx + W * .012, by - H * .012, W * .004); // 脚 // 頭
      // 岸の草叢
      c.strokeStyle = '#7a8a50'; lnW(1.5);
      times(7, i => {
        const px = W * (.25 + rng() * .5); const py = H * (.8 + rng() * .1); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + W * .006, py - H * .03, px + W * .002, py - H * .045); c.stroke();
      });
    } else if (pr === 'seastack') {
      // 海食柱: 切り立つ岩柱+砕ける波+飛ぶ海鳥+曇り空
      sky([[0,'#8a9aa8'],[.5,'#4a6a80'],[1,'#2a4a60']]);
      // 曇り空の雲
      c.fillStyle = 'rgba(220,225,230,0.3)';
      times(3, i => {
        const px = ((W * (.1 + i * .4) + t * W * .01) % (W * 1.2)) - W * .1; ellP(px, H * (.1 + i * .06), W * .12, H * .025);
      });
      // 海食柱(海面から立つ岩塔)
      const rng = L.mulberry32(313); const stacks = [[.2, .35, .05], [.38, .28, .04], [.68, .4, .06], [.88, .3, .035]];
      for (const [sx, sh, sw] of stacks) {
        FS('#3a4a52'); poly([W * (sx - sw),H * .7],[W * (sx - sw * .7),H * (.7 - sh)],[W * sx,H * (.7 - sh) - H * .02,W * (sx + sw * .7),H * (.7 - sh)],[W * (sx + sw),H * .7]);
        // 頂の草
        c.fillStyle = '#4a6a4a'; ell(sx, (.7 - sh) - H * .008, W * sw * .8, H * .012); FS('#3a4a52');
      }
      // 海面
      const wg = c.createLinearGradient(0, H * .7, 0, H); wg.addColorStop(0, '#3a6a85'); wg.addColorStop(1, '#1e4a60'); FS(wg); rect(0, H * .7, W, H * .3);
      // 岩柱の根元に砕ける白波
      c.fillStyle = 'rgba(240,250,255,0.6)';
      for (const [sx] of stacks) {
        const wob = Math.sin(t * 2 + sx * 10) * W * .008; ell(sx + wob, .705, W * .035, H * .008);
      }
      // 波の輝き
      c.fillStyle = 'rgba(200,230,245,0.35)';
      times(8, i => {
        const px = W * rng(), py = H * (.73 + rng() * .22); ellP(px + Math.sin(t + i) * W * .006, py, W * .012, H * .002);
      });
      // 海鳥
      c.strokeStyle = '#202830'; lnW(1.5);
      times(3, i => {
        const bx = W * (.15 + i * .3) + Math.sin(t * .5 + i) * W * .03; const by = H * (.25 + i * .08) + Math.sin(t * .9 + i * 2) * H * .02; c.beginPath(); c.arc(bx - W * .005, by, W * .005, Math.PI * 1.1, Math.PI * 1.9); c.arc(bx + W * .005, by, W * .005, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      });
    } else if (pr === 'bazaar') {
      // バザール: 市場の屋台+色とりどりの天幕+吊るす提灯+石畳
      sky([[0,'#e8a860'],[.55,'#c88858'],[1,'#8a5a40']]);
      // 遠景の建物シルエット(ドーム+ミナレット)
      FS('#a06a48'); rect(0, H * .35, W, H * .18); c.beginPath(); c.arc(W * .2, H * .35, W * .05, Math.PI, Math.PI * 2); c.arc(W * .2, H * .35, W * .05, Math.PI, Math.PI * 2); c.fill(); c.beginPath(); c.arc(W * .62, H * .35, W * .07, Math.PI, Math.PI * 2); c.arc(W * .62, H * .35, W * .07, Math.PI, Math.PI * 2); c.fill(); rect(W * .85, H * .22, W * .015, H * .3); c.beginPath(); c.arc(W * .857, H * .22, W * .012, Math.PI, Math.PI * 2); c.arc(W * .857, H * .22, W * .012, Math.PI, Math.PI * 2); c.fill(); // ミナレット
      // 市場の天幕(縞のタープ)
      scat(293, 3, (rng, i) => {
        const ax = W * (.08 + i * .32); const aw = W * .26;
        times(6, s => {
          FS(s % 2 ? '#c84838' : '#e8d8b8'); poly([ax + aw * s / 6,H * .5],[ax + aw * (s + 1) / 6,H * .5],[ax + aw * (s + .5) / 6,H * .56]);
        });
      });
      // 屋台(箱+商品の塊)
      times(3, i => {
        const sx = W * (.1 + i * .32); FS('#7a5a3a'); rect(sx, H * .62, W * .2, H * .12); FS(['#c84a3a', '#3a7a5a', '#c8a83a'][i]);
        times(5, j => {
          dotP(sx + W * .02 + j * W * .035, H * .6, W * .012);
        });
      });
      // 吊るす提灯
      times(5, i => {
        const lx = W * (.12 + i * .19); const ly = H * .18 + Math.sin(t * .8 + i) * H * .008; SS('rgba(60,40,30,0.6)'); lnW(1); c.beginPath(); c.moveTo(lx, H * .08); c.lineTo(lx, ly); c.stroke(); FS('rgba(255,190,90,0.9)'); ellP(lx, ly + H * .015, W * .011, H * .018);
      });
      // 石畳
      c.fillStyle = '#6a5040'; rect(0, H * .86, W, H * .14); SS('rgba(40,30,22,0.4)'); lnW(1);
      times(10, i => {
        const px = W * rng(); c.beginPath(); c.moveTo(px, H * .88); c.lineTo(px + W * .03, H * .98); c.stroke();
      });
    } else if (pr === 'polder') {
      // ポルダー: 干拓地の水平線+運河+風車+低い雲+放牧地
      sky([[0,'#a8c8e0'],[.5,'#c8d8c0'],[1,'#7aa868']]);
      // 低い流れ雲
      c.fillStyle = 'rgba(255,255,255,0.5)';
      times(3, i => {
        const px = ((W * (.15 + i * .35) + t * W * .015) % (W * 1.2)) - W * .1; ellP(px, H * (.12 + i * .07), W * .09, H * .02);
      });
      // 地平の風車
      const wx = W * .75, wy = H * .42; FS('#6a5a4a'); c.beginPath(); c.moveTo(wx - W * .012, wy + H * .12); c.moveTo(wx - W * .012, wy + H * .12); c.lineTo(wx + W * .012, wy + H * .12); c.lineTo(wx + W * .008, wy); c.lineTo(wx + W * .008, wy); c.lineTo(wx - W * .008, wy); c.closePath(); c.closePath(); c.fill();
      // 回る翼
      c.strokeStyle = '#5a4a3a'; lnW(2);
      times(4, i => {
        const a = t * .8 + i * Math.PI / 2; c.beginPath(); c.moveTo(wx, wy + H * .01); c.lineTo(wx + Math.cos(a) * W * .045, wy + H * .01 + Math.sin(a) * W * .045); c.stroke();
      });
      // 運河(地平に向かって収束)
      FS('#4a7a95'); c.beginPath(); c.moveTo(W * .42, H); c.moveTo(W * .42, H); c.lineTo(W * .47, H * .5); c.lineTo(W * .53, H * .5); c.lineTo(W * .53, H * .5); c.lineTo(W * .62, H); c.closePath(); c.closePath(); c.fill();
      // 運河の輝き
      c.fillStyle = 'rgba(180,220,235,0.3)'; c.beginPath(); c.moveTo(W * .48, H); c.moveTo(W * .48, H); c.lineTo(W * .5, H * .55); c.moveTo(W * .48, H); c.lineTo(W * .5, H * .55); c.lineTo(W * .51, H * .55); c.moveTo(W * .48, H); c.lineTo(W * .5, H * .55); c.lineTo(W * .51, H * .55); c.lineTo(W * .5, H); c.closePath(); c.closePath(); c.fill();
      // 牧草地の区割り線(畝/畦)
      SS('rgba(60,90,50,0.35)'); lnW(1.5);
      times(5, i => {
        c.beginPath(); c.moveTo(W * (i * .08), H * .58); c.lineTo(W * (i * .16 - .02), H); c.stroke();
      });
      // 牛の点
      const rng = L.mulberry32(277); FS('#3a3a32');
      times(4, i => {
        const px = W * (.08 + rng() * .3); const py = H * (.7 + rng() * .2); ellP(px, py, W * .009, H * .008); dotP(px + W * .01, py - H * .004, W * .004);
      });
    } else if (pr === 'karst') {
      // カルスト: 石灰岩の割れ目大地+鍾乳石の森+青い空+低い丘
      sky([[0,'#a8c8e8'],[.55,'#c8bfa0'],[1,'#9a8a6a']]);
      // 遠景の低い丘
      c.fillStyle = '#8a9a80'; poly([0,H * .45],[W * .25,H * .34,W * .5,H * .42],[W * .75,H * .5,W,H * .44],[W,H * .55],[W,H * .55],[0,H * .55]); const rng = L.mulberry32(263);
      // 石灰岩の柱林(鍾乳石の塔)
      times(9, i => {
        const px = W * (.05 + i * .11) + rng() * W * .03; const ph = H * (.18 + rng() * .25); const pw = W * (.02 + rng() * .018); FS(['#b8ac8e', '#a89a7c', '#c4b89e'][Math.floor(rng() * 3)]); poly([px - pw,H * .85],[px - pw * .7,H * .85 - ph],[px,H * .85 - ph - H * .02,px + pw * .7,H * .85 - ph],[px + pw,H * .85]);
        // 縦筋
        c.strokeStyle = 'rgba(90,80,60,0.4)'; lnW(1); c.beginPath(); c.moveTo(px - pw * .3, H * .82); c.lineTo(px - pw * .3, H * .85 - ph * .8); c.stroke();
      });
      // 前景: ひび割れた石灰岩の地表
      c.fillStyle = '#8a7a5c'; rect(0, H * .82, W, H * .18); SS('rgba(60,50,35,0.5)'); lnW(1.5);
      times(7, i => {
        const px = W * rng(), py = H * (.84 + rng() * .13); c.beginPath(); c.moveTo(px, py); c.lineTo(px + W * (rng() - .5) * .06, py + H * .04); c.lineTo(px + W * (rng() - .5) * .08, py + H * .08); c.stroke();
      });
      // 隙間の草
      c.strokeStyle = '#6a8a50'; lnW(1.5);
      times(6, i => {
        const px = W * rng(); c.beginPath(); c.moveTo(px, H * .85); c.quadraticCurveTo(px + W * .008, H * .82, px + W * .004, H * .8); c.stroke();
      });
    } else if (pr === 'loch') {
      // ロッホ: 霧の立つ深い湖+両岸の丘+陰が差す水面+遠くの城跡
      sky([[0,'#7a8a95'],[.5,'#4a5a68'],[1,'#2a3a48']]);
      // 遠くの丘
      c.fillStyle = '#3a4a52'; poly([0,H * .45],[W * .3,H * .25,W * .55,H * .42],[W * .8,H * .52,W,H * .44],[W,H * .6],[W,H * .6],[0,H * .6]);
      // 丘の上の小さな城跡
      c.fillStyle = '#2a3a40'; const cx = W * .52, cy = H * .34; rect(cx, cy, W * .015, H * .06); rect(cx + W * .02, cy - H * .01, W * .012, H * .07);
      // 湖面
      const wg = c.createLinearGradient(0, H * .58, 0, H); wg.addColorStop(0, '#1a3a50'); wg.addColorStop(1, '#0e2a3a'); FS(wg); rect(0, H * .58, W, H * .42);
      // 反射の丘影
      c.fillStyle = 'rgba(50,70,80,0.35)'; poly([W * .3,H * .58],[W * .45,H * .7,W * .55,H * .58]);
      // 漂う霧の帯
      times(3, i => {
        const my = H * (.5 + i * .07) + Math.sin(t * .3 + i) * H * .01;
        FS(`rgba(200,215,220,${.1 + i * .05})`);
        ellP(W * .5 + Math.sin(t * .15 + i) * W * .05, my, W * (.3 + i * .1), H * .02);
      });
      // 水面の輝き
      c.fillStyle = 'rgba(160,200,220,0.3)'; scat(251, 10, (rng, i) => {
        const px = W * rng(), py = H * (.62 + rng() * .32); ellP(px + Math.sin(t + i) * W * .008, py, W * .015, H * .002);
      });
      // 飛び交う水鳥
      c.strokeStyle = '#202830'; lnW(1.5);
      times(2, i => {
        const bx = W * (.3 + i * .35) + Math.sin(t * .4 + i) * W * .04; const by = H * .3 + Math.sin(t * .8 + i * 2) * H * .02; c.beginPath(); c.arc(bx - W * .006, by, W * .006, Math.PI * 1.1, Math.PI * 1.9); c.arc(bx + W * .006, by, W * .006, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      });
    } else if (pr === 'cenote') {
      // セノーテ: 石灰岩の窪み+差し込む光柱+青い湧水+垂れ下がる根
      sky([[0,'#2a3a30'],[.45,'#1a4a55'],[1,'#0d3540']]);
      // 天井の開口(光が差す)
      FS('#bfe8f0'); ellP(W * .5, 0, W * .18, H * .05);
      // 光柱
      c.fillStyle = 'rgba(160,230,240,0.12)'; c.beginPath(); c.moveTo(W * .42, H * .02); c.moveTo(W * .42, H * .02); c.lineTo(W * .58, H * .02); c.lineTo(W * .65, H * .75); c.lineTo(W * .65, H * .75); c.lineTo(W * .35, H * .75); c.closePath(); c.closePath(); c.fill();
      // 周囲の岩壁
      c.fillStyle = '#3d4a3a'; c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .22, 0); c.quadraticCurveTo(W * .18, H * .3, W * .2, H * .55); c.lineTo(W * .18, H); c.lineTo(W * .18, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .78, 0); c.quadraticCurveTo(W * .82, H * .3, W * .8, H * .55); c.lineTo(W * .82, H); c.lineTo(W * .82, H); c.lineTo(W, H); c.closePath(); c.closePath(); c.fill();
      // 垂れる根
      const rng = L.mulberry32(237); SS('#4a5a40'); lnW(1.5);
      times(8, i => {
        const px = W * (.3 + rng() * .4); const len = H * (.08 + rng() * .15); c.beginPath(); c.moveTo(px, H * .04); c.quadraticCurveTo(px + Math.sin(i) * W * .01, H * .04 + len * .5, px + Math.sin(i * 1.7) * W * .015, H * .04 + len); c.stroke();
      });
      // 湧水面
      c.fillStyle = '#2a8a9a'; rect(0, H * .72, W, H * .28); FS('rgba(180,240,250,0.25)');
      times(4, i => {
        const wx = (W * (.1 + i * .25) + Math.sin(t * .6 + i) * W * .04); ellP(wx, H * .74, W * .05, H * .006);
      });
      // 揺れる小魚
      c.fillStyle = 'rgba(200,230,220,0.6)';
      times(3, i => {
        const fx = W * .5 + Math.sin(t * .5 + i * 2.1) * W * (.08 + i * .04); const fy = H * (.8 + i * .05) + Math.cos(t * .8 + i) * H * .015; ellP(fx, fy, W * .011, H * .0045);
      });
    } else if (pr === 'kelp') {
      // 昆布の森: 水中の光筋+ゆらめく昆布の列+魚群+岩礁の底
      sky([[0,'#2a5a70'],[.5,'#1a4a58'],[1,'#0e3540']]);
      // 差し込む光筋
      times(4, i => {
        const gx = W * (.15 + i * .22) + Math.sin(t * .2 + i) * W * .02; FS('rgba(150,220,230,0.07)'); c.beginPath(); c.moveTo(gx, 0); c.moveTo(gx, 0); c.lineTo(gx + W * .1, 0); c.lineTo(gx + W * .16, H); c.lineTo(gx + W * .16, H); c.lineTo(gx + W * .06, H); c.closePath(); c.closePath(); c.fill();
      });
      const rng = L.mulberry32(223);
      // 揺れる昆布(根元から伸びる縦の葉体)
      times(14, i => {
        const px = W * (.04 + rng() * .92); const kh = H * (.3 + rng() * .45); const sway = Math.sin(t * .8 + i) * W * .012; SS(['#2a6a3a', '#3a7a45', '#1f5a35'][Math.floor(rng() * 3)]); lnW(2 + rng() * 3); c.beginPath(); c.moveTo(px, H); c.quadraticCurveTo(px + sway * .4, H - kh * .6, px + sway, H - kh); c.stroke(); // 高さ
        // 先端の葉
        c.fillStyle = '#3a8a50'; ellP(px + sway, H - kh, W * .008, H * .02, sway * 2);
      });
      // 魚群
      c.fillStyle = 'rgba(180,220,230,0.7)';
      times(8, i => {
        const fx = (W * (.1 + i * .11) + t * W * .03) % (W * 1.1); const fy = H * (.2 + (i % 3) * .12) + Math.sin(t * 1.5 + i) * H * .02; ellP(fx, fy, W * .012, H * .005); c.beginPath(); c.moveTo(fx - W * .012, fy); c.moveTo(fx - W * .012, fy); c.lineTo(fx - W * .018, fy - H * .006); c.moveTo(fx - W * .012, fy); c.lineTo(fx - W * .018, fy - H * .006); c.lineTo(fx - W * .018, fy + H * .006); c.closePath(); c.closePath(); c.fill();
      });
      // 底の岩礁
      c.fillStyle = '#153038';
      times(6, i => {
        const px = W * (i / 6) + rng() * W * .08; ellP(px, H * .98, W * (.04 + rng() * .04), H * (.02 + rng() * .015));
      });
    } else if (pr === 'hamada') {
      // ハマダ: 岩盤むき出しの平坦な砂漠+疎らな礫+砂塵+遠い低山
      sky([[0,'#d8a878'],[.4,'#c08858'],[1,'#98704a']]);
      // 眩しい太陽
      c.fillStyle = '#f8e0a8'; dot(.3,.16,H * .08); const rng = L.mulberry32(211);
      // 遠い低い山並み
      c.fillStyle = '#a07850'; c.beginPath(); c.moveTo(0, H * .42);
      for (let x = 0; x <= 10; x++) {
        c.lineTo(W * x / 10, H * (.42 - (x % 3 === 0 ? .04 : .01) - Math.sin(x * 1.3) * .015));
      }
      c.lineTo(W, H * .42); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 岩盤の平坦な地表+ひび筋
      c.fillStyle = '#a88058'; rect(0, H * .42, W, H * .58); SS('rgba(90,60,40,0.35)'); lnW(1);
      times(18, i => {
        const px = W * rng(), py = H * (.5 + rng() * .48); c.beginPath(); c.moveTo(px, py); c.lineTo(px + (rng() - .5) * W * .08, py + rng() * H * .03); c.stroke();
      });
      // 疎らな礫
      times(30, i => {
        const px = W * rng(), py = H * (.45 + rng() * .52); const s = rng(); FS(['#7a5a3a', '#8a6a48', '#6a4a30'][Math.floor(rng() * 3)]); ellP(px, py, W * (.004 + s * .01), H * (.002 + s * .005), rng() * .5);
      });
      // 漂う砂塵
      c.fillStyle = 'rgba(230,200,160,0.2)';
      times(4, i => {
        const y = H * (.55 + i * .12) + Math.sin(t * .5 + i * 2) * H * .01; ellP(W * .5, y, W * .45, H * .025);
      });
      // 蜃気楼の揺らぎ筋
      c.strokeStyle = 'rgba(255,240,210,0.3)'; lnW(1.5);
      times(3, i => {
        const y = H * (.44 + i * .015); c.beginPath(); c.moveTo(W * .2, y); c.quadraticCurveTo(W * .5, y + Math.sin(t * .8 + i) * H * .006, W * .8, y); c.stroke();
      });
    } else if (pr === 'meseta') {
      // メセタ高原: 乾いた黄土の高原+孤立した樫の木+回る猛禽+遠い丘陵
      sky([[0,'#d8c090'],[.45,'#c8a870'],[1,'#a88558']]);
      // 照りつける太陽
      c.fillStyle = '#f8e8b0'; dot(.75,.14,H * .07); const rng = L.mulberry32(199);
      // 遠い丘陵(平たい連なり)
      FS('#b08a5f'); c.beginPath(); c.moveTo(0, H * .42);
      for (let x = 0; x <= 8; x++) {
        c.lineTo(W * x / 8, H * (.42 - Math.sin(x * .9) * .025));
      }
      c.lineTo(W, H * .42); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 乾いた草の点描
      times(80, i => {
        const px = W * rng(), py = H * (.45 + rng() * .52); FS(['#8a7040', '#9a8050', '#7a6038'][Math.floor(rng() * 3)]); c.globalAlpha = .4 + rng() * .4; ellP(px, py, W * .006, H * .003, rng() * .6);
      });
      c.globalAlpha = 1;
      // 孤立した樫の木(丸い樹冠)
      FS('#4a3a28'); rect(W * .24, H * .5, W * .008, H * .09); FS('#4a5a2e'); ell(.244,.48,W * .035,H * .028); ell(.228,.5,W * .02,H * .02); // 幹
      // 空を回る猛禽
      c.strokeStyle = '#4a4038'; lnW(1.5);
      times(2, i => {
        const ang = t * .4 + i * Math.PI; const bx = W * (.55 + Math.cos(ang) * .12); const by = H * (.2 + Math.sin(ang) * .04); c.beginPath(); c.moveTo(bx - W * .015, by); c.quadraticCurveTo(bx, by - H * .012, bx + W * .015, by); c.stroke();
      });
      // 石の散在
      times(12, i => {
        const px = W * rng(), py = H * (.85 + rng() * .13); FS('#8a7a60'); ellP(px, py, W * (.008 + rng() * .01), H * (.004 + rng() * .005), rng() * .4);
      });
    } else if (pr === 'steppe') {
      // ステップ草原: 果てしない平坦な地平+羽毛草の波+巨大な積雲
      sky([[0,'#90b0d0'],[.4,'#c8c8a0'],[1,'#a0986a']]); const rng = L.mulberry32(191);
      // 巨大な積雲2つ
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [cx, cy, s] of [[.25, .18, 1], [.68, .12, .7]]) {
        c.beginPath(); c.ellipse(W * cx, H * cy, W * .12 * s, H * .05 * s, 0, 0, 7); c.ellipse(W * cx, H * cy, W * .12 * s, H * .05 * s, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * (cx + .05 * s), H * (cy - .03 * s), W * .08 * s, H * .045 * s, 0, 0, 7); c.ellipse(W * (cx + .05 * s), H * (cy - .03 * s), W * .08 * s, H * .045 * s, 0, 0, 7); c.fill();
      }
      // 平坦な地平線
      c.fillStyle = '#98905f'; rect(0, H * .42, W, H * .58);
      // 羽毛草(スティパ)の穂の波 — 風で揺れる
      times(70, i => {
        const px = W * rng(), py = H * (.45 + rng() * .52); const dep = (py / H - .45) / .55; const sway = Math.sin(t * 1.2 + px * .01) * W * .004 * (0.5 + dep); SS(['#b8a870', '#c8b880', '#a89860'][Math.floor(rng() * 3)]); lnW(1); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + sway * .5, py - H * .03, px + sway, py - H * (.035 + dep * .02)); c.stroke(); // 遠近: 小さいほど遠く
      });
      // 遠くの騎馬シルエット
      c.fillStyle = '#5a5040';
      times(3, i => {
        const hx2 = W * (.3 + i * .18 + rng() * .06); const hy2 = H * .43; ellP(hx2, hy2, W * .012, H * .005); rect(hx2 - W * .002, hy2 - H * .018, W * .004, H * .014); // 馬体 // 騎手
      });
      // 孤立した一樹
      c.fillStyle = '#4a5a38'; rect(W * .82, H * .38, W * .005, H * .045); ell(.822,.37,W * .02,H * .02);
    } else if (pr === 'glen') {
      // グレン: 狭い谷+急な緑の斜面+霧+谷底の渓流+岩
      sky([[0,'#98a8b8'],[.4,'#889888'],[1,'#586848']]); const rng = L.mulberry32(181);
      // 左右の急な緑の斜面
      c.fillStyle = '#4a6038'; c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .3, 0); c.quadraticCurveTo(W * .38, H * .35, W * .28, H); c.lineTo(0, H); c.lineTo(0, H); c.closePath(); c.lineTo(0, H); c.closePath(); c.fill(); FS('#42562e'); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .7, 0); c.quadraticCurveTo(W * .62, H * .35, W * .72, H); c.lineTo(W, H); c.lineTo(W, H); c.closePath(); c.lineTo(W, H); c.closePath(); c.fill();
      // 斜面の木々(小さな点々)
      FS('#3a5028');
      times(26, i => {
        const side = rng() < .5 ? 0 : 1; const px = side ? W * (.72 + rng() * .26) : W * (rng() * .28); const py = H * (.15 + rng() * .7); ellP(px, py, W * .008, H * .01);
      });
      // 霧の帯
      c.fillStyle = 'rgba(220,228,235,0.25)';
      times(3, i => {
        const y = H * (.3 + i * .18) + Math.sin(t * .3 + i) * H * .01; ellP(W * .5, y, W * .35, H * .04);
      });
      // 谷底の渓流
      c.strokeStyle = '#a8c8d8'; lnW(5); c.beginPath(); c.moveTo(W * .48, H); c.quadraticCurveTo(W * (.52 + S(.4) * .01), H * .75, W * .5, H * .55); c.quadraticCurveTo(W * .48, H * .4, W * .5, H * .3); c.stroke(); SS('rgba(230,245,255,0.6)'); lnW(1.5); c.beginPath(); c.moveTo(W * .48, H); c.quadraticCurveTo(W * (.52 + S(.4) * .01), H * .75, W * .5, H * .55); c.stroke();
      // 渓流の岩
      times(8, i => {
        const px = W * (.42 + rng() * .16), py = H * (.6 + rng() * .38); FS('#6a6a60'); ellP(px, py, W * .012, H * .006, rng() * .5);
      });
    } else if (pr === 'cove') {
      // 入り江: 両側の断崖+穏やかな湾内の水+小さなボート+砂浜
      sky([[0,'#a8c8e0'],[.4,'#b8d0e0'],[1,'#d8c8a0']]); const rng = L.mulberry32(173);
      // 左右の断崖(岬)
      FS('#7a7058'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .18, 0); c.quadraticCurveTo(W * .3, H * .3, W * .22, H * .55); c.lineTo(0, H * .7); c.lineTo(0, H * .7); c.closePath(); c.lineTo(0, H * .7); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .82, 0); c.quadraticCurveTo(W * .72, H * .35, W * .78, H * .6); c.lineTo(W, H * .75); c.lineTo(W, H * .75); c.closePath(); c.lineTo(W, H * .75); c.closePath(); c.fill();
      // 崖の緑(樹冠)
      FS('#5a7048'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .18, 0); c.moveTo(0, 0); c.lineTo(W * .18, 0); c.lineTo(W * .22, H * .08); c.moveTo(0, 0); c.lineTo(W * .18, 0); c.lineTo(W * .22, H * .08); c.lineTo(0, H * .1); c.moveTo(0, 0); c.lineTo(W * .18, 0); c.lineTo(W * .22, H * .08); c.lineTo(0, H * .1); c.closePath(); c.moveTo(0, 0); c.lineTo(W * .18, 0); c.lineTo(W * .22, H * .08); c.lineTo(0, H * .1); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .82, 0); c.moveTo(W, 0); c.lineTo(W * .82, 0); c.lineTo(W * .78, H * .09); c.moveTo(W, 0); c.lineTo(W * .82, 0);
      c.lineTo(W * .78, H * .09); c.lineTo(W, H * .12); c.moveTo(W, 0); c.lineTo(W * .82, 0); c.lineTo(W * .78, H * .09); c.lineTo(W, H * .12); c.closePath(); c.moveTo(W, 0); c.lineTo(W * .82, 0); c.lineTo(W * .78, H * .09); c.lineTo(W, H * .12); c.closePath(); c.fill();
      // 湾内の水
      c.fillStyle = '#5a8aa8'; poly([0,H * .7],[W * .5,H * .5,W,H * .75],[W,H],[W,H],[0,H],[W,H],[0,H],[W,H],[0,H]);
      // 波の光
      c.strokeStyle = 'rgba(230,245,255,0.5)'; lnW(1);
      times(10, i => {
        const y = H * (.62 + i * .035); c.beginPath(); c.moveTo(W * (.25 + rng() * .2), y); c.lineTo(W * (.45 + rng() * .25), y); c.stroke();
      });
      // 小さなボート
      const bx = W * (.45 + S(.2) * .03), by = H * .62; FS('#8a5a38'); poly([bx - W * .03,by],[bx,by + H * .02,bx + W * .03,by],[bx + W * .025,by - H * .008],[bx - W * .025,by - H * .008]); SS('#6a4a30'); lnW(1.5); c.beginPath(); c.moveTo(bx, by - H * .008); c.lineTo(bx, by - H * .055); c.stroke(); // マスト
      // 砂浜
      c.fillStyle = '#d8c098'; c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .92); c.quadraticCurveTo(W * .3, H * .85, W * .6, H * .95); c.lineTo(W, H * .98); c.lineTo(W, H * .98); c.lineTo(W, H); c.lineTo(W, H * .98); c.lineTo(W, H); c.closePath(); c.lineTo(W, H * .98); c.lineTo(W, H); c.closePath(); c.fill();
      // 砂の貝殻点
      times(14, i => {
        FS(['#b09070', '#c8a880', '#a88868'][Math.floor(rng() * 3)]); dot(rng(), (.9 + rng() * .09), W * .003);
      });
    } else if (pr === 'fen') {
      // フェン: 平坦な水湿地+葦の茂み+開いた水路+低い空
      sky([[0,'#b8c8d8'],[.45,'#a8b898'],[1,'#788868']]); const rng = L.mulberry32(163);
      // 開いた水面(蛇行する水路)
      FS('#8aa0b0'); poly([W * .35,H],[W * .3,H * .8,W * .42,H * .62],[W * .55,H * .45,W * .48,H * .3],[W * .56,H * .3],[W * .62,H * .5,W * .5,H * .65],[W * .38,H * .82,W * .45,H]);
      // 水面の光の筋
      c.strokeStyle = 'rgba(220,235,245,0.4)'; lnW(1);
      times(8, i => {
        const y = H * (.55 + i * .05); c.beginPath(); c.moveTo(W * (.3 + rng() * .15), y); c.lineTo(W * (.42 + rng() * .12), y); c.stroke();
      });
      // 葦の茂み(縦の細い穂)
      for (let i = 0; i < 40; i++) {
        const px = W * rng();
        if (px > W * .33 && px < W * .58) continue; // 水路の上は避ける
        const py = H * (.42 + rng() * .55); const hgt = H * (.04 + rng() * .06); SS(['#5a7048', '#6a8058', '#7a8858'][Math.floor(rng() * 3)]); lnW(1.2); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + W * .002, py - hgt * .6, px + (rng() - .5) * W * .008, py - hgt); c.stroke();
        // 穂先
        c.fillStyle = '#8a7a50'; ellP(px + (rng() - .5) * W * .008, py - hgt, W * .003, H * .012);
      }
      // 遠くの地平の樹列
      c.fillStyle = '#5a6a58';
      times(9, i => {
        const px = W * (i / 9) + rng() * W * .03; rect(px, H * .36 - H * (.01 + rng() * .015), W * .008, H * .04);
      });
      // 飛ぶ鳥
      c.strokeStyle = '#4a5560'; lnW(1.2);
      times(4, i => {
        const bx = W * (.15 + i * .2 + rng() * .1), by = H * (.12 + rng() * .1); c.beginPath(); c.moveTo(bx - W * .012, by); c.quadraticCurveTo(bx, by - H * .01, bx + W * .012, by); c.stroke();
      });
    } else if (pr === 'cirque') {
      // 圏谷: すり鉢状の岩壁+吊るされた滝+小さな湖(氷河湖)
      sky([[0,'#a8b8d0'],[.4,'#9098a8'],[1,'#687078']]); const rng = L.mulberry32(151);
      // 左右にせり出す岩壁(すり鉢)
      FS('#7a7f88'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .22, 0); c.quadraticCurveTo(W * .32, H * .4, W * .2, H); c.lineTo(0, H); c.lineTo(0, H); c.closePath(); c.lineTo(0, H); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.moveTo(W, 0); c.lineTo(W * .78, 0); c.quadraticCurveTo(W * .68, H * .4, W * .8, H); c.lineTo(W, H); c.lineTo(W, H); c.closePath(); c.lineTo(W, H); c.closePath(); c.fill();
      // 岩壁の筋
      c.strokeStyle = 'rgba(50,55,65,0.4)'; lnW(1.2);
      times(10, i => {
        const y = H * (.1 + i * .09); c.beginPath(); c.moveTo(W * (.1 + rng() * .12), y); c.quadraticCurveTo(W * .25, y + H * .02, W * (.18 + rng() * .1), y + H * .06); c.stroke(); c.beginPath(); c.moveTo(W * (.78 + rng() * .1), y); c.quadraticCurveTo(W * .75, y + H * .02, W * (.72 + rng() * .1), y + H * .06); c.stroke();
      });
      // 中央奥の氷河雪渓
      c.fillStyle = '#e0e8f0'; poly([W * .38,H * .1],[W * .5,H * .05,W * .62,H * .1],[W * .58,H * .22,W * .5,H * .26],[W * .42,H * .22,W * .38,H * .1]);
      // 吊るされた滝
      c.strokeStyle = 'rgba(230,240,255,0.85)'; lnW(3); c.beginPath(); c.moveTo(W * .5, H * .26); c.quadraticCurveTo(W * (.5 + S(.6) * .008), H * .5, W * .5, H * .74); c.stroke();
      // 小さな湖(ターン)
      FS('#5a7a9a'); c.beginPath(); c.ellipse(W * .5, H * .78, W * .18, H * .05, 0, 0, 7); c.ellipse(W * .5, H * .78, W * .18, H * .05, 0, 0, 7); c.fill(); FS('rgba(220,235,255,0.5)'); c.beginPath(); c.ellipse(W * .5, H * .76, W * .1, H * .015, 0, 0, 7); c.ellipse(W * .5, H * .76, W * .1, H * .015, 0, 0, 7); c.fill(); // 滝の映り込み
      // 下部の氷堆石
      times(12, i => {
        const px = W * (.2 + rng() * .6), py = H * (.82 + rng() * .16); FS('#6a7078'); ellP(px, py, W * (.008 + rng() * .012), H * (.004 + rng() * .006), rng() * .5);
      });
    } else if (pr === 'dune') {
      // 砂丘: 風紋の砂の曲線+丘稜+遠くの海+マレーグラス
      sky([[0,'#c8d8e8'],[.35,'#e8d8b0'],[1,'#c8a878']]);
      // 遠くの海
      c.fillStyle = '#7a9ab8'; rect(0, H * .38, W, H * .07);
      // 大きな砂丘3つ
      c.fillStyle = '#d8b888'; c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .55); c.quadraticCurveTo(W * .25, H * .42, W * .5, H * .58); c.quadraticCurveTo(W * .75, H * .7, W, H * .55); c.lineTo(W, H); c.lineTo(W, H); c.closePath(); c.lineTo(W, H); c.closePath(); c.fill(); FS('#c8a070'); c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .72); c.quadraticCurveTo(W * .3, H * .6, W * .65, H * .78); c.quadraticCurveTo(W * .85, H * .9, W, H * .82); c.lineTo(W, H); c.lineTo(W, H); c.closePath(); c.lineTo(W, H); c.closePath(); c.fill();
      // 風紋の筋
      c.strokeStyle = 'rgba(160,120,70,0.4)'; lnW(1.2);
      times(22, i => {
        const y = H * (.55 + i * .02); c.beginPath(); c.moveTo(W * .05, y); c.quadraticCurveTo(W * (.3 + Math.sin(i * .8) * .1), y - H * .01, W * .7, y); c.stroke();
      });
      // 丘稜のハイライト
      c.strokeStyle = 'rgba(255,230,180,0.6)'; lnW(2); c.beginPath(); c.moveTo(0, H * .55); c.quadraticCurveTo(W * .25, H * .42, W * .5, H * .58); c.stroke();
      // マレーグラスの穂
      scat(139, 18, (rng, i) => {
        const px = W * (.05 + rng() * .9), py = H * (.6 + rng() * .38); SS('#8a7a50'); lnW(1);
        times(4, j => {
          c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + (j - 1.5) * W * .004, py - H * .025, px + (j - 1.5) * W * .006, py - H * .04); c.stroke();
        });
      });
    } else if (pr === 'quarry') {
      // 採石場: 切り出した岩壁+階段状の段+岩石クレーン
      sky([[0,'#b8a890'],[.4,'#a09070'],[1,'#806f55']]); const rng = L.mulberry32(131);
      // 岩壁の段（上から下へ3段）
      const bench = [0.52, 0.68, 0.84];
      times(bench.length, s => {
        const y = H * bench[s]; FS(['#8a7a60', '#7a6a50', '#6a5a44'][s]); rect(0, y, W, H * .16);
        // 段の垂直面の陰影筋
        c.strokeStyle = 'rgba(60,50,35,0.35)'; lnW(1);
        times(20, x => {
          const sx = W * (x / 20) + rng() * W * .03; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx - rng() * W * .01, y + H * .14); c.stroke();
        });
      });
      // 石のクレーン(鉄柱+アーム)
      SS('#4a4038'); lnW(3); c.beginPath(); c.beginPath(); c.moveTo(W * .15, H * .52); c.beginPath(); c.moveTo(W * .15, H * .52); c.lineTo(W * .15, H * .15); c.beginPath(); c.moveTo(W * .15, H * .52); c.lineTo(W * .15, H * .15); c.stroke(); c.beginPath(); c.beginPath(); c.moveTo(W * .15, H * .15); c.beginPath(); c.moveTo(W * .15, H * .15); c.lineTo(W * .45, H * .12); c.beginPath(); c.moveTo(W * .15, H * .15); c.lineTo(W * .45, H * .12); c.stroke(); lnW(1.5); c.beginPath(); c.moveTo(W * .45, H * .12); c.lineTo(W * .45, H * .28); c.stroke(); FS('#5a5048');
      rect(W * .43, H * .28, W * .04, H * .05); // 吊り下げケーブル // 吊り岩
      // 散在する岩石
      times(14, i => {
        const px = W * rng(), py = H * (.86 + rng() * .12); FS('#6a5a48'); ellP(px, py, W * (.01 + rng() * .015), H * (.005 + rng() * .008), rng() * .4);
      });
    } else if (pr === 'tundra') {
      // ツンドラ: 平坦な地衣の大地+低い太陽+遠くのカリブー+疎らな岩
      sky([[0,'#c8b8a0'],[.45,'#a89878'],[1,'#8a8068']]);
      // 低い太陽(地平線近く)
      FS('rgba(255,220,170,0.9)'); dot(.7,.38,H * .05); const rng = L.mulberry32(118);
      // 平坦な大地(微妙な起伏)
      FS('#94866a'); c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .48);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.48 + Math.sin(x * .7) * .015));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 地衣・苔の斑点
      times(60, i => {
        const px = W * rng(), py = H * (.5 + rng() * .47); const cols = ['#7a8a58', '#8a7a50', '#a08858', '#6a7a50']; FS(cols[Math.floor(rng() * 4)]); c.globalAlpha = .3 + rng() * .4; ellP(px, py, W * .015 * (1 + rng()), H * .006 * (1 + rng()));
      });
      c.globalAlpha = 1;
      // 疎らな岩
      times(5, i => {
        const px = W * (.1 + rng() * .8), py = H * (.55 + rng() * .35); FS('#7a7468'); ellP(px, py, W * (.015 + rng() * .02), H * (.008 + rng() * .006), rng() * .5);
      });
      // 遠くのカリブーの群れ(シルエット)
      FS('#4a4038'); SS('#4a4038'); lnW(1.2);
      times(6, i => {
        const cx = W * (.12 + i * .14 + rng() * .05); const cy = H * (.5 + rng() * .04); c.beginPath(); c.beginPath(); c.ellipse(cx, cy, W * .008, H * .004, 0, 0, 7); ellP(cx, cy, W * .008, H * .004); c.beginPath(); c.beginPath(); c.moveTo(cx + W * .006, cy - H * .003); c.beginPath(); c.moveTo(cx + W * .006, cy - H * .003); c.lineTo(cx + W * .01, cy - H * .01); c.beginPath(); c.moveTo(cx + W * .006, cy - H * .003); c.lineTo(cx + W * .01, cy - H * .01); c.lineTo(cx + W * .013, cy - H * .006); c.beginPath(); c.moveTo(cx + W * .006, cy - H * .003); c.lineTo(cx + W * .01, cy - H * .01);
        c.lineTo(cx + W * .013, cy - H * .006); c.stroke(); // 体 // 角/首
      });
    } else if (pr === 'wadi') {
      // 涸れ川: 丸石の河床+両岸の崖+遠い砂漠+流木
      sky([[0,'#e0b880'],[.5,'#c89868'],[1,'#a88058']]); const rng = L.mulberry32(111);
      // 遠い台地の影
      c.fillStyle = '#b08858'; c.beginPath(); c.moveTo(0, H * .38);
      for (let x = 0; x <= 10; x++) {
        c.lineTo(W * x / 10, H * (.38 - Math.sin(x * 1.2) * .05));
      }
      c.lineTo(W, H * .38); c.lineTo(W, H * .38); c.lineTo(W, H * .44); c.lineTo(W, H * .38); c.lineTo(W, H * .44); c.lineTo(0, H * .44); c.closePath(); c.closePath(); c.fill();
      // 両岸の崖(左右からせり出す)
      FS('#986c44'); c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .5); // 左岸
      for (let x = 0; x <= 4; x++) {
        c.lineTo(W * x * .06, H * (.5 + x * .02) + Math.sin(x * 2) * H * .02);
      }
      c.lineTo(0, H); c.lineTo(0, H); c.closePath(); c.lineTo(0, H); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, H); c.moveTo(W, H); c.lineTo(W, H * .45); // 右岸
      for (let x = 0; x <= 4; x++) {
        c.lineTo(W - W * x * .07, H * (.45 + x * .03) + Math.sin(x * 1.8) * H * .02);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 河床(中央の窪み)
      FS('#c0a070'); poly([0,H],[W * .1,H * .55],[W * .5,H * .5,W * .9,H * .58],[W,H]);
      // 丸石(大小の楕円)
      times(26, i => {
        const px = W * (.1 + rng() * .8); const py = H * (.58 + rng() * .38); const s = (.5 + rng()) * (py - H * .5) / (H * .5) + .3;
        FS(`rgba(${140 + Math.floor(rng() * 60)},${110 + Math.floor(rng() * 40)},${80 + Math.floor(rng() * 30)},0.85)`);
        ellP(px, py, W * .02 * s, H * .01 * s, rng());
      });
      // 流木
      c.strokeStyle = '#6a4a30'; lnW(4); c.beginPath(); c.moveTo(W * .55, H * .82); c.quadraticCurveTo(W * .65, H * .78, W * .78, H * .84); c.stroke(); c.beginPath(); c.moveTo(W * .66, H * .8); c.lineTo(W * .7, H * .75); c.stroke(); // 枝
    } else if (pr === 'saltflat') {
      // 塩原: 亀裂の白い大地+浅い水鏡+遠い山脈+白い空
      sky([[0,'#e8ecf0'],[.5,'#d8dde0'],[1,'#f0ece4']]); const rng = L.mulberry32(104);
      // 遠い山脈
      c.fillStyle = '#b8c0c8'; c.beginPath(); c.moveTo(0, H * .42);
      for (let x = 0; x <= 10; x++) {
        c.lineTo(W * x / 10, H * (.42 - Math.sin(x * 1.4 + 1) * .08));
      }
      c.lineTo(W, H * .42); c.lineTo(W, H * .42); c.lineTo(W, H * .45); c.lineTo(W, H * .42); c.lineTo(W, H * .45); c.lineTo(0, H * .45); c.closePath(); c.closePath(); c.fill();
      // 白い大地
      c.fillStyle = '#f4f2ea'; rect(0, H * .45, W, H * .55);
      // 六角の亀裂パターン
      c.strokeStyle = 'rgba(160,155,140,0.5)'; lnW(1);
      times(5, row => {
        times(6, col => {
          const cx = W * (col / 6 + (row % 2 ? .08 : 0)) + W * .02; const cy = H * (.5 + row * .1); const s = W * .045 * (1 - row * .08); c.beginPath();
          times(6, v => {
            const va = v * Math.PI / 3 + .5; const px = cx + Math.cos(va) * s, py = cy + Math.sin(va) * s * .4; v ? c.lineTo(px, py) : c.moveTo(px, py);
          });
          c.closePath(); c.stroke();
        });
      });
      // 浅い水鏡(空を映す帯)
      times(3, i => {
        const py = H * (.5 + i * .12); FS('rgba(180,205,220,0.5)'); ellP(W * (.25 + i * .3), py, W * .12, H * .015);
        // 山の映り込み
        c.fillStyle = 'rgba(160,170,180,0.35)'; ellP(W * (.25 + i * .3), py + H * .005, W * .06, H * .005);
      });
      // 眩しさの光斑
      c.fillStyle = `rgba(255,255,255,${.3 + S(1.5) * .15})`;
      ell(.6, .52, W * .15, H * .03);
    } else if (pr === 'highland') {
      // 高地牧場: うねる緑の丘+石積みの垣根+点々の羊+大きな空
      sky([[0,'#a8c8dc'],[.55,'#c8d8b8'],[1,'#7aa05a']]); const rng = L.mulberry32(97);
      // 丘3層
      const hills = ['#88a868', '#6f9450', '#5c8044'];
      for (let h = 0; h < 3; h++) {
        FS(hills[h]); c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * (.48 + h * .12));
        for (let x = 0; x <= 12; x++) {
          c.lineTo(W * x / 12, H * (.48 + h * .12) + Math.sin(x * .9 + h * 2.1) * H * .05);
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
      // 石積みの垣根(丘を越えて蛇行)
      SS('#8a8a80'); lnW(4); c.beginPath(); c.moveTo(0, H * .6);
      for (let x = 0; x <= 14; x++) {
        c.lineTo(W * x / 14, H * (.6 + x * .012) + Math.sin(x * .7) * H * .02);
      }
      c.stroke();
      // 石の継ぎ目
      c.strokeStyle = 'rgba(60,60,55,0.4)'; lnW(1);
      for (let x = 0; x <= 14; x++) {
        const sx = W * x / 14; const sy = H * (.6 + x * .012) + Math.sin(x * .7) * H * .02; c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx, sy + 4); c.stroke();
      }
      // 羊(白い点と頭)
      times(8, i => {
        const sx = W * (.08 + rng() * .85); const sy = H * (.55 + rng() * .35); FS('#f0f0e8'); ellP(sx, sy, W * .008, H * .005); FS('#3a3a34'); ellP(sx + W * .008, sy - H * .002, W * .0025, H * .002);
      });
      // 流れる雲
      times(3, i => {
        const cx2 = ((t * .02 + i * .35) % 1.3 - .15) * W; FS('rgba(255,255,255,0.5)'); ellP(cx2, H * (.1 + i * .08), W * .07, H * .018);
      });
    } else if (pr === 'delta') {
      // 三角州: 三つ編み状の水路+緑の砂州+飛ぶ鳥+遠い海
      sky([[0,'#a8d0e0'],[.5,'#88b8b0'],[1,'#c8d0a8']]); const rng = L.mulberry32(91);
      // 緑の大地
      c.fillStyle = '#8aa868'; rect(0, H * .4, W, H * .6);
      // 遠い海
      c.fillStyle = '#6a9ab0'; rect(0, H * .36, W, H * .05);
      // 三つ編み状の水路(複数の蛇行する流れ)
      SS('#5a8a98');
      times(4, ch => {
        const lw = 6 + ch * 4; lnW(lw); c.beginPath(); let cx = W * (.15 + ch * .22); c.moveTo(cx, H * .4);
        times(6, seg => {
          const ny = H * (.4 + (seg + 1) * .1); cx += (rng() - .5) * W * .06 + (seg > 2 ? (ch - 1.5) * W * .02 : 0); c.lineTo(cx, Math.min(ny, H * .98));
        });
        c.stroke();
      });
      // 砂州のハイライト
      c.strokeStyle = 'rgba(220,220,180,0.4)'; lnW(2);
      times(3, ch => {
        c.beginPath(); let cx = W * (.2 + ch * .25); c.moveTo(cx, H * .5);
        times(5, seg => {
          cx += (rng() - .5) * W * .05; c.lineTo(cx, H * (.5 + (seg + 1) * .1));
        });
        c.stroke();
      });
      // 葦の集まり
      times(20, i => {
        const rx = W * rng(), ry = H * (.55 + rng() * .4); SS('#4a6a3a'); lnW(1); c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 1, ry - H * (.02 + rng() * .015)); c.stroke();
      });
      // 飛ぶ鳥
      c.strokeStyle = '#3a4a44'; lnW(1.5);
      times(3, b => {
        const bx = W * (.15 + b * .3 + Math.sin(t * .3 + b) * .05); const by = H * (.15 + b * .07); c.beginPath(); c.moveTo(bx - W * .012, by); c.quadraticCurveTo(bx, by - H * .008 - Math.sin(t * 6 + b) * 3, bx + W * .012, by); c.stroke();
      });
    } else if (pr === 'mangrove') {
      // マングローブ: 高根(支柱根)+濁った水+葉の天蓋+水鳥
      sky([[0,'#b8d0a8'],[.45,'#7a9a78'],[1,'#4a6a58']]); const rng = L.mulberry32(84);
      // 天蓋(上部の葉影)
      times(8, i => {
        FS(`rgba(50,90,60,${.5 + rng() * .3})`);
        ell(rng(), rng() * .18, W * (.08 + rng() * .06), H * (.05 + rng() * .03));
      });
      // 濁った水面
      c.fillStyle = '#5a7a68'; c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .62);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.62 + Math.sin(x * 1.1 + t * .5) * .008));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 水面の反射筋
      c.strokeStyle = 'rgba(200,230,200,0.25)'; lnW(1);
      times(8, i => {
        const wy = H * (.65 + i * .04); c.beginPath(); c.moveTo(W * rng() * .3, wy); c.lineTo(W * (.5 + rng() * .5), wy); c.stroke();
      });
      // 支柱根(放射状に水に降りる根)
      SS('#4a3a2a'); lnW(3);
      for (let tr = 0; tr < 4; tr++) {
        const tx = W * (.12 + tr * .25 + rng() * .06); const ty = H * (.35 + rng() * .1);
        // 幹
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - H * .15); c.stroke();
        for (let r = -3; r <= 3; r++) {
          c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + r * W * .02, H * .75); c.stroke();
        }
        // 根元の葉
        c.fillStyle = '#3a6a44';
        times(4, lf => {
          ellP(tx + rng() * W * .04 - W * .02, ty - H * (.14 + rng() * .1), W * .02, H * .012, rng() * 3);
        });
      }
      // 水鳥(立っている)
      FS('#e8e8e0'); const bx = W * .75, by = H * .68; ellP(bx, by, W * .012, H * .008); SS('#e8e8e0'); lnW(2); c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + H * .02); c.stroke(); SS('#e8e8e0'); c.beginPath(); c.moveTo(bx + W * .008, by - H * .006); c.lineTo(bx + W * .015, by - H * .014); c.stroke(); // 首
    } else if (pr === 'taiga') {
      // タイガ: 遠くの雪峰+針葉樹の林2層+低い太陽+残雪の地面
      sky([[0,'#d8e4f0'],[.5,'#a8bcd4'],[1,'#d0dcd8']]);
      // 低い太陽
      c.fillStyle = 'rgba(255,235,190,0.9)'; dot(.2,.3,H * .055); const rng = L.mulberry32(77);
      // 遠くの雪峰
      c.fillStyle = '#e8ecf0';
      times(3, m => {
        const mx = W * (m * .35 + .05); poly([mx,H * .45],[mx + W * .12,H * (.22 + rng() * .06)],[mx + W * .24,H * .45]);
      });
      // 針葉樹の林(遠景=小さく薄く)
      times(22, i => {
        const tx = W * rng(); const ty = H * (.45 + rng() * .04); FS('rgba(70,100,90,0.55)'); c.beginPath(); c.moveTo(tx, ty); c.moveTo(tx, ty); c.lineTo(tx + W * .012, ty - H * .05); c.moveTo(tx, ty); c.lineTo(tx + W * .012, ty - H * .05); c.lineTo(tx + W * .024, ty); c.closePath(); c.closePath(); c.fill();
      });
      // 残雪の地面
      c.fillStyle = '#e4ecea'; c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .55);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.55 + Math.sin(x * 1.3) * .02));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 雪の斑点
      times(30, i => {
        FS(`rgba(255,255,255,${.3 + rng() * .4})`);
        rect(W * rng(), H * (.55 + rng() * .42), W * .008, H * .004);
      });
      // 手前の針葉樹(大きく濃く)
      times(7, i => {
        const tx = W * (.06 + i * .14 + rng() * .05); const ty = H * (.62 + rng() * .25); const th = H * (.14 + rng() * .07); FS('#33524a'); rect(tx + W * .006, ty - th * .3, W * .008, th * .3); // 幹
        times(3, l => {
          const lw = W * (.045 - l * .012); const ly = ty - th * (.3 + l * .28); poly([tx - lw / 2 + W * .01,ly],[tx + W * .01,ly - th * .32],[tx + lw / 2 + W * .01,ly]);
        });
        // 枝の積雪
        c.fillStyle = 'rgba(255,255,255,0.55)'; ellP(tx + W * .01, ty - th * .75, W * .016, H * .005);
      });
    } else if (pr === 'badlands') {
      // バッドランズ: 縞模様の浸食台地+照りつける太陽+疎らな灌木
      sky([[0,'#e8b070'],[.5,'#c88858'],[1,'#a06848']]);
      // 太陽
      c.fillStyle = '#fff0d0'; dot(.78,.16,H * .07); const rng = L.mulberry32(71);
      // 層状の台地(色帯の積層)
      const bands = ['#c07850', '#b06040', '#d08858', '#a85838', '#c88050'];
      times(4, i => {
        const ty = H * (.3 + i * .13);
        times(3, m => {
          const mx = W * (m * .35 + rng() * .1); const mw = W * (.18 + rng() * .1); FS(bands[(i + m) % 5]); rect(mx, ty, mw, H * .07);
        });
      });
      // 手前の大きな台地
      c.fillStyle = '#b06844'; c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .62);
      for (let x = 0; x <= 12; x++) {
        c.lineTo(W * x / 12, H * (.62 + Math.sin(x * .8) * .025));
      }
      c.lineTo(W, H); c.closePath(); c.fill();
      // 縞筋
      c.strokeStyle = 'rgba(150,80,50,0.6)'; lnW(2);
      for (let i = 0; i < 6; i++) {
        const sy = H * (.68 + i * .045); c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = sy + Math.sin(x * .8 + i) * H * .012; x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 灌木
      times(5, i => {
        const bx = W * (.08 + i * .2 + rng() * .08); const by = H * (.72 + rng() * .2); FS('#6a7a50');
        times(4, b => {
          ellP(bx + rng() * W * .012 - W * .006, by - rng() * H * .012, W * .008, H * .005);
        });
      });
      // 蜃気楼の揺らぎ筋
      c.strokeStyle = `rgba(255,240,210,${.15 + S(2) * .08})`;
      lnW(1);
      for (let i = 0; i < 3; i++) {
        const hy = H * (.35 + i * .08); c.beginPath();
        for (let x = 0; x <= 8; x++) {
          const px = W * x / 8; const py = hy + Math.sin(x * 2 + t * 3 + i) * 2; x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
    } else if (pr === 'pond') {
      // 池: 睡蓮の葉+広がる波紋+泳ぐ鯉の影+蜻蛉
      sky([[0,'#9ec8b8'],[.45,'#6a9888'],[1,'#3a6860']]); const rng = L.mulberry32(64);
      // 岸(上部の草地)
      FS('#7aa870'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W, 0); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * .12);
      for (let x = 12; x >= 0; x--) {
        c.lineTo(W * x / 12, H * (.12 + Math.sin(x * .9) * .02));
      }
      c.closePath(); c.fill();
      // 広がる波紋
      times(4, i => {
        const ph = (t * .4 + i * .25) % 1; const rx = W * (.15 + i * .23), ry = H * (.55 + (i % 2) * .15);
        SS(`rgba(255,255,255,${(1 - ph) * .35})`);
        lnW(1.5); ellPS(rx, ry, W * (.02 + ph * .12), H * (.008 + ph * .03));
      });
      // 泳ぐ鯉の影(深い色の魚影)
      const kx = W * ((t * .06) % 1.4 - .2); const ky = H * (.72 + S(.9) * .03); FS('rgba(20,40,38,0.5)'); ellP(kx, ky, W * .05, H * .014, S(1.5) * .08);
      // 睡蓮の葉と花
      times(5, i => {
        const lx = W * (.08 + i * .2 + rng() * .06); const ly = H * (.5 + rng() * .4); FS('#3f7a55'); c.beginPath(); c.ellipse(lx, ly, W * .035, H * .012, rng() * .4, .3, Math.PI * 2 - .3); c.fill();
        if (i % 2 === 0) {
          FS('#f0b8c8');
          times(5, p => {
            const pa = p * 1.257; ellP(lx + Math.cos(pa) * W * .008, ly - H * .012 + Math.sin(pa) * H * .004, W * .006, H * .004, pa);
          });
        }
      });
      // 蜻蛉
      const dx = W * (.2 + .6 * A(.5)); const dy = H * (.35 + S(3) * .04); SS('rgba(60,80,90,0.8)'); lnW(1); c.beginPath(); c.moveTo(dx - W * .015, dy); c.lineTo(dx + W * .015, dy); c.stroke(); FS('rgba(120,180,200,0.6)'); ellP(dx, dy - H * .008, W * .02, H * .005);
    } else if (pr === 'tide') {
      // 干潟: 濡れた砂面+水溜りの映り込み+遠い海+干潟の鳥
      sky([[0,'#a8c0d0'],[.4,'#c8d0c8'],[1,'#a89878']]);
      // 遠い海
      c.fillStyle = '#7a9ab0'; rect(0, H * .38, W, H * .05); const rng = L.mulberry32(58);
      // 濡れた砂(緩い波紋筋)
      FS('#b0a088'); rect(0, H * .43, W, H * .57); SS('rgba(140,125,95,0.5)'); lnW(2);
      for (let i = 0; i < 10; i++) {
        const wy = H * (.46 + i * .05); c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = wy + Math.sin(x * 1.1 + i * 2) * H * .006; x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 水溜り(空を映す楕円)
      times(4, i => {
        const px = W * (.15 + i * .22); const py = H * (.52 + rng() * .3); FS('rgba(190,215,230,0.7)'); ellP(px, py, W * (.05 + rng() * .04), H * (.012 + rng() * .01));
        // きらめき
        c.fillStyle = `rgba(255,255,255,${.3 + Math.sin(t * 2 + i) * .2})`;
        ellP(px - W * .01, py - H * .004, W * .012, H * .003);
      });
      // 干潟の鳥(くちばしを突くシギ)
      FS('#4a4a44');
      for (const [bx, by] of [[.3, .58], [.68, .65]]) {
        const peck = Math.max(0, Math.sin(t * 2.5 + bx * 9)) * .3; ell(bx,by,W * .012,H * .008); SS('#4a4a44'); lnW(1.5); c.beginPath(); c.beginPath(); c.moveTo(W * bx, H * by + H * .008); c.beginPath(); c.moveTo(W * bx, H * by + H * .008); c.lineTo(W * bx, H * by + H * .025); c.beginPath(); c.moveTo(W * bx, H * by + H * .008); c.lineTo(W * bx, H * by + H * .025); c.stroke(); c.beginPath(); c.beginPath(); c.moveTo(W * bx + W * .01, H * by - H * .004); c.lineTo(W * (bx + .018), H * (by - .01) + peck * H * .03); c.stroke(); // 体 // 脚 // 首+嘴
      }
    } else if (pr === 'grove') {
      // 木立ちの小径: 幹の列+枝葉の天蓋+木漏れ日の光筋
      sky([[0,'#a8c898'],[.45,'#88a878'],[1,'#5a7850']]); const rng = L.mulberry32(17);
      // 天蓋(枝葉の塊)
      FS('#3a6038');
      times(8, i => {
        ell(rng(), (.05 + rng() * .15), W * (.1 + rng() * .08), H * (.05 + rng() * .04));
      });
      // 幹の列(奥→手前)
      times(2, row => {
        const n = 5 + row * 2; const tw = W * (.012 + row * .01);
        times(n, i => {
          const tx = W * (.05 + i * .9 / n) + (row % 2) * W * .06; const ty0 = H * (.1 - row * .05), ty1 = H * (.8 + row * .1); FS(row ? '#5a4838' : '#6a5848'); rect(tx - tw / 2, ty0, tw, ty1 - ty0);
        });
      });
      // 小径(中央へ収束する砂地)
      FS('#b8a888'); c.beginPath(); c.moveTo(W * .42, H); c.moveTo(W * .42, H); c.lineTo(W * .48, H * .5); c.lineTo(W * .52, H * .5); c.lineTo(W * .52, H * .5); c.lineTo(W * .58, H); c.closePath(); c.closePath(); c.fill();
      // 木漏れ日の光筋(斜めの半透明帯)
      FS('rgba(255,245,200,0.22)');
      times(4, i => {
        const lx = W * (.2 + i * .2) + Math.sin(t * .3 + i) * W * .01; c.beginPath(); c.moveTo(lx, H * .1); c.moveTo(lx, H * .1); c.lineTo(lx + W * .05, H * .1); c.lineTo(lx + W * .14, H); c.lineTo(lx + W * .14, H); c.lineTo(lx + W * .09, H); c.closePath(); c.closePath(); c.fill();
      });
      // 舞う葉
      times(6, i => {
        const lx = W * ((rng() + t * .03) % 1); const ly = H * ((rng() + t * .05) % 1); FS('#88aa55'); ellP(lx, ly, W * .006, H * .004, rng() * 3 + t);
      });
    } else if (pr === 'brook') {
      // 渓流: 流れる水+飛び石+岸の緑+水しぶき
      sky([[0,'#90b8a8'],[.5,'#78a890'],[1,'#5a8068']]); const rng = L.mulberry32(49);
      // 岸(上下の緑)
      FS('#4a7048'); rect(0, 0, W, H * .3); rect(0, H * .82, W, H * .18);
      // 草むら
      c.strokeStyle = '#5a8850'; lnW(2);
      times(25, i => {
        const gx = W * rng(); const gy = rng() > .5 ? H * (.26 + rng() * .04) : H * (.8 + rng() * .04); c.beginPath(); c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + 2, gy - H * .02, gx + 4, gy - H * .03); c.stroke();
      });
      // 水流(揺れる白線の帯)
      FS('#6a9aa8'); rect(0, H * .3, W, H * .52); SS('rgba(230,245,250,0.5)'); lnW(2);
      for (let i = 0; i < 8; i++) {
        const wy = H * (.33 + i * .06); c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = wy + Math.sin(x * 1.2 + t * 2.5 + i) * H * .008; x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 飛び石
      c.fillStyle = '#7a7268';
      times(5, i => {
        const sx = W * (.15 + i * .18); const sy = H * (.5 + Math.sin(i * 1.9) * .12); ellP(sx, sy, W * .045, H * .02, .1 * i);
        // 石周りの白いしぶき
        c.strokeStyle = 'rgba(240,250,255,0.6)'; lnW(1.5); c.beginPath(); c.arc(sx, sy, W * .05, Math.PI * .2, Math.PI * .8); c.stroke();
      });
    } else if (pr === 'moor') {
      // ムーア: 霧の荒れ地+ヒースの紫+立石
      sky([[0,'#98a0a8'],[.5,'#a8a898'],[1,'#6a7058']]); const rng = L.mulberry32(64);
      // うねる荒れ地(暗い起伏)
      FS('#5a6250'); c.beginPath(); c.moveTo(0, H * .62);
      for (let i = 0; i <= 8; i++)
        c.lineTo(W * i / 8, H * (.58 + Math.sin(i * 1.7) * .06));
      c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // ヒース(紫の点群)
      times(50, i => {
        const px = W * rng(); const py = H * (.6 + rng() * .35);
        FS(`hsla(${285 + rng() * 30},30%,${40 + rng() * 20}%,0.7)`);
        ellP(px, py, W * .007, H * .006);
      });
      // 立石(先細りの岩3本)
      FS('#6a6a66');
      for (const [sx, sy, ss] of [[.25, .5, .05], [.55, .47, .065], [.8, .52, .04]]) {
        poly([W * sx - W * ss * .8,H * (sy + .15)],[W * sx - W * ss * .5,H * sy],[W * sx,H * (sy - .03),W * sx + W * ss * .5,H * sy],[W * sx + W * ss * .8,H * (sy + .15)]);
      }
      // 流れる霧(半透明の帯)
      times(3, i => {
        const mx = W * (((t * .02 + i * .35) % 1.3) - .15); FS('rgba(220,225,225,0.25)'); ellP(mx, H * (.3 + i * .12), W * .3, H * .04);
      });
    } else if (pr === 'onsen') {
      // 温泉: 立ち上る湯気+岩で縁どられた湯+遠景の山
      sky([[0,'#a8b8c8'],[.4,'#c8d0d8'],[1,'#98a088']]); const rng = L.mulberry32(88);
      // 遠景の山(霧の稜線)
      FS('rgba(120,140,130,0.5)'); c.beginPath(); c.moveTo(0, H * .45);
      for (let i = 0; i <= 6; i++)
        c.lineTo(W * i / 6, H * (.32 + (i % 2) * .08 - Math.sin(i * 2.1) * .03));
      c.lineTo(W, H * .45); c.closePath(); c.fill();
      // 湯面(乳白色の青)
      FS('#b8d0d8'); ell(.5, .78, W * .42, H * .16);
      // 湯気(揺れて昇る半透明の帯)
      times(5, i => {
        const sx = W * (.25 + i * .13); const rise = (t * .1 + i * .2) % 1;
        FS(`rgba(255,255,255,${.35 * (1 - rise)})`);
        c.beginPath();
        c.ellipse(sx + Math.sin(t * 1.2 + i) * W * .02, H * (.75 - rise * .35),
          W * (.02 + rise * .03), H * .03, 0, 0, 7);
        c.fill();
      });
      // 岩の縁取り
      c.fillStyle = '#7a7268';
      times(12, i => {
        const a = i / 12 * Math.PI * 2; const rx = W * .5 + Math.cos(a) * W * .44; const ry = H * .78 + Math.sin(a) * H * .17;
        if (ry > H * .7) {
          ellP(rx, ry, W * (.03 + rng() * .02), H * (.02 + rng() * .015), rng());
        }
      });
    } else if (pr === 'orchard') {
      // 果樹園: 青空+整列するリンゴの木+落ちる実
      sky([[0,'#88c0e0'],[.55,'#c8e0d8'],[1,'#7a9a55']]); const rng = L.mulberry32(55);
      // 木の列(奥→手前2段)
      times(2, row => {
        const ty = H * (.45 + row * .2); const n = 4 + row * 2; const ts = W * (.05 + row * .025);
        times(n, i => {
          const tx = W * (.08 + i * .84 / n) + (row % 2) * W * .09; const sway = Math.sin(t * .9 + i * 1.3 + row) * W * .003;
          // 幹
          c.fillStyle = '#6a4a30'; rect(tx - ts * .08, ty, ts * .16, ts * 1.4);
          // 樹冠(重なる円)
          FS('#4a7a38'); c.beginPath(); c.beginPath(); c.arc(tx + sway, ty - ts * .3, ts * .7, 0, 7); c.beginPath(); c.arc(tx + sway, ty - ts * .3, ts * .7, 0, 7); c.fill(); c.beginPath(); c.beginPath(); c.arc(tx - ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); c.beginPath(); c.arc(tx - ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); c.fill(); c.beginPath(); c.beginPath(); c.arc(tx + ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); c.beginPath(); c.arc(tx + ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); c.fill();
          // 実(赤い丸)
          FS('#d84038');
          times(5, a => {
            const ax = tx + sway + (rng() - .5) * ts * 1.1; const ay = ty - ts * .35 + (rng() - .5) * ts * .7; dotP(ax, ay, ts * .09);
          });
        });
      });
      // 地面の草と落ちた実
      c.fillStyle = '#6a8a48'; rect(0, H * .82, W, H * .18); FS('#c03830');
      times(8, i => {
        const ax = W * rng(); const ay = H * (.84 + rng() * .12); dotP(ax, ay, W * .006);
      });
      // 落ちていく実(アニメ)
      const fall = (t * .15) % 1; FS('#d84038'); dot(.3, (.4 + fall * .45), W * .008);
    } else if (pr === 'cosmos') {
      // コスモス畑: 秋の空+揺れるコスモス(白/ピンク)+飛ぶチョウ
      sky([[0,'#8ab8d8'],[.5,'#c8d8e0'],[1,'#789a58']]);
      // 秋の薄い雲
      const rng = L.mulberry32(33); FS('rgba(255,255,255,0.4)');
      times(4, i => {
        ellP(W * (i * .28 + .1), H * (.1 + (i % 2) * .08), W * .1, H * .015, .05);
      });
      // コスモスの群生(2段)
      times(2, row => {
        const ry = H * (.62 + row * .18); const n = 7 + row * 3; const fs = W * (.014 + row * .01);
        times(n, i => {
          const fx = W * (.05 + i * .9 / n) + (row % 2) * W * .05; const sway = Math.sin(t * 1.5 + i * .7 + row) * W * .006;
          // 細い茎と葉
          c.strokeStyle = '#5a7a42'; lnW(Math.max(1, fs * .1)); c.beginPath(); c.moveTo(fx, ry + fs * 3); c.lineTo(fx + sway, ry); c.stroke();
          // 8弁の花(白・ピンク・濃紅)
          const cx = fx + sway, cy = ry; const col = ['#f4e8f0', '#e8a0c0', '#d06090'][Math.floor(rng() * 3)]; FS(col);
          times(8, p => {
            const a = p * .785; ellP(cx + Math.cos(a) * fs, cy + Math.sin(a) * fs, fs * .55, fs * .28, a);
          });
          FS('#e8c040'); dotP(cx, cy, fs * .35);
        });
      });
      // 舞うチョウ
      times(2, i => {
        const bx = W * ((i * .4 + t * .05) % 1.1) - W * .05; const by = H * (.4 + Math.sin(t * 2.2 + i * 3) * .12 + i * .15); const flap = .5 + Math.abs(Math.sin(t * 8 + i)) * .5; FS('rgba(240,240,255,0.85)'); c.beginPath(); c.beginPath(); c.ellipse(bx - W * .006, by, W * .008, H * .007 * flap, -.4, 0, 7); ellP(bx - W * .006, by, W * .008, H * .007 * flap, -.4); c.beginPath(); c.beginPath(); c.ellipse(bx + W * .006, by, W * .008, H * .007 * flap, .4, 0, 7); ellP(bx + W * .006, by, W * .008, H * .007 * flap, .4);
      });
    } else if (pr === 'sunflowers') {
      // ひまわり畑: 青空+太陽+整列するひまわり+蜂
      sky([[0,'#7ab8e0'],[.55,'#b8d8e8'],[1,'#88a860']]);
      // 太陽
      c.fillStyle = '#fff2c8'; dot(.82,.14,W * .06); const rng = L.mulberry32(121);
      // ひまわりの列(奥→手前3段)
      times(3, row => {
        const ry = H * (.55 + row * .15); const n = 6 + row * 2; const fs = W * (.02 + row * .012); // 花サイズ
        times(n, i => {
          const fx = W * (.06 + i * .88 / n) + (row % 2) * W * .04; const sway = Math.sin(t * 1.2 + i + row) * W * .004;
          // 茎
          c.strokeStyle = '#4a7038'; lnW(Math.max(1.5, fs * .12)); c.beginPath(); c.moveTo(fx, ry + fs * 2.2); c.lineTo(fx + sway, ry); c.stroke();
          // 花弁(円周上の楕円)
          const cx = fx + sway, cy = ry; FS('#f0b428');
          times(10, p => {
            const a = p * .628; ellP(cx + Math.cos(a) * fs, cy + Math.sin(a) * fs, fs * .45, fs * .2, a);
          });
          // 中心
          c.fillStyle = '#6a4520'; dotP(cx, cy, fs * .55);
        });
      });
      // 飛ぶ蜂
      times(3, i => {
        const bx = W * ((i * .3 + t * .04) % 1); const by = H * (.35 + Math.sin(t * 2 + i * 2) * .1 + i * .1); FS('#e0c040'); ellP(bx, by, W * .008, H * .006); FS('#38302a'); ellP(bx - W * .004, by, W * .002, H * .005);
      });
    } else if (pr === 'wisteria') {
      // 藤棚: 上から垂れる花房+棚の梁+淡い空
      sky([[0,'#c8c2e0'],[.45,'#d8d4e8'],[1,'#b8c4a0']]); const rng = L.mulberry32(77);
      // 棚の梁
      c.fillStyle = '#6a5a48'; rect(0, H * .1, W, H * .025); rect(0, H * .16, W, H * .02);
      for (let i = 0; i < 7; i++)
        rect(W * i / 6 - W * .008, H * .08, W * .016, H * .12);
      // 垂れる花房(小さい楕円の積み重ね)
      times(14, i => {
        const fx = W * (.05 + rng() * .9); const sway = Math.sin(t * .8 + i) * W * .008; const len = H * (.18 + rng() * .25); const petals = 5 + Math.floor(rng() * 4); const hue = rng() > .3 ? 265 : 290; // 紫系/ピンク系
        times(petals, k => {
          const py = H * .14 + len * k / petals; const pw = W * .028 * (1 - k / petals * .55);
          FS(`hsla(${hue + rng() * 20},45%,${72 - k * 2}%,0.85)`);
          ellP(fx + sway * k / petals, py, pw, H * .022);
        });
        // 房の先端
        c.fillStyle = `hsla(${hue},50%,65%,0.9)`;
        ellP(fx + sway, H * .14 + len, W * .008, H * .012);
      });
      // 地面の緑と散った花びら
      c.fillStyle = '#9aa888'; rect(0, H * .85, W, H * .15); FS('rgba(190,170,220,0.5)');
      times(20, i => {
        const px = W * rng(), py = H * (.86 + rng() * .12); ellP(px, py, W * .005, H * .004, rng() * 3);
      });
    } else if (pr === 'zen') {
      // 枯山水: 砂紋(同心波)+石組+遠景の陰
      sky([[0,'#d8cfb8'],[.6,'#cfc4a8'],[1,'#c0b294']]);
      // 砂紋: 石を中心に同心円の梳き目
      const rng = L.mulberry32(41); const rocks = [[.3, .68, .07], [.68, .55, .055], [.52, .82, .045]]; SS('rgba(140,125,95,0.55)'); lnW(1.5);
      for (const [rx, ry, rr] of rocks) {
        for (let k = 1; k <= 6; k++) {
          const rad = rr * (1 + k * .45); const wob = Math.sin(t * .4 + k) * .01; ellPS(W * rx, H * ry, W * rad, H * rad * .35, wob); // 微かな揺らぎ
        }
      }
      // 直線の梳き目(上段)
      times(8, i => {
        const yy = H * (.22 + i * .045); c.beginPath(); c.moveTo(W * .08, yy); c.quadraticCurveTo(W * .5, yy + Math.sin(t * .3 + i) * H * .004, W * .92, yy); c.stroke();
      });
      // 石(苔むした岩)
      for (const [rx, ry, rr] of rocks) {
        const g = Math.round(90 + rng() * 25);
        FS(`rgb(${g - 15},${g + 5},${g - 30})`);
        ell(rx, ry - H * rr * .5, W * rr * .9, H * rr * .8); FS('rgba(80,110,60,0.5)'); ell(rx - W * rr * .25, ry - H * rr * .7, W * rr * .45, H * rr * .35); // 苔
      }
      // 遠景: 砂利の縁
      c.fillStyle = 'rgba(110,95,70,0.35)';
      times(40, i => {
        const px = W * rng(), py = H * (.12 + rng() * .1); rect(px, py, W * .006, W * .004);
      });
    } else if (pr === 'storm') {
      // 嵐: 暗雲+雨筋+時折の稲妻
      const flash = Math.max(0, S(.9)) ** 14; sky([[0,'#2a3038'],[.6,'#1a2028'],[1,'#10141a']]); const rng = L.mulberry32(95); // 稀に光る
      // 暗雲(大きな楕円の塊)
      FS('#343c46');
      times(6, i => {
        const cx = W * (i / 5) + Math.sin(t * .2 + i) * W * .02; ellP(cx, H * (.12 + (i % 2) * .06), W * .14, H * .05);
      });
      // 稲妻(フラッシュ時にジグザグ)
      if (flash > .05) {
        SS(`rgba(255,250,200,${flash})`);
        lnW(3); const lx = W * (.3 + (Math.floor(t * .9 / Math.PI) % 3) * .2); c.beginPath(); c.moveTo(lx, H * .15); let ly = H * .15; scat(7, 5, (rng2, i) => {
          ly += H * .09; c.lineTo(lx + (rng2() - .5) * W * .08, ly);
        });
        c.stroke();
        // 空全体のフラッシュ
        c.fillStyle = `rgba(200,210,255,${flash * .15})`;
        rect(0, 0, W, H);
      }
      // 雨筋(斜めの線)
      SS('rgba(160,180,210,0.4)'); lnW(1.5);
      times(60, i => {
        const rx = ((rng() + t * .7) % 1) * W * 1.2 - W * .1; const ry = ((rng() + t * .7) % 1) * H; c.beginPath(); c.moveTo(rx, ry); c.moveTo(rx, ry); c.lineTo(rx - W * .012, ry + H * .035); c.stroke();
      });
      // 海面のうねり
      c.fillStyle = '#16202a'; rect(0, H * .85, W, H * .15); SS('rgba(180,200,220,0.3)'); lnW(2); c.beginPath();
      for (let x = 0; x <= 10; x++) {
        const px = W * x / 10, py = H * .85 + Math.sin(x * 1.4 + t * 2) * H * .015; x ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    } else if (pr === 'observatory') {
      // 天文台: 天の川の夜空+白いドーム+開いたスリット
      sky([[0,'#0a0e24'],[.6,'#1a2040'],[1,'#2a2a3a']]); const rng = L.mulberry32(89);
      // 星
      times(120, i => {
        const sx = rng() * W, sy = rng() * H * .65; const tw2 = .3 + .7 * Math.abs(Math.sin(t * 1.5 + i * 1.7));
        FS(`rgba(235,240,255,${tw2})`);
        rect(sx, sy, 1.5, 1.5);
      });
      // 天の川(斜めの淡い帯)
      c.save(); c.translate(W * .5, H * .3); c.rotate(-.4); const mg = c.createLinearGradient(0, -H * .08, 0, H * .08); mg.addColorStop(0, 'rgba(180,190,230,0)'); mg.addColorStop(.5, 'rgba(180,190,230,0.22)'); mg.addColorStop(1, 'rgba(180,190,230,0)'); FS(mg); rect(-W, -H * .08, W * 2, H * .16); c.restore();
      // 山稜
      c.fillStyle = '#141826'; c.beginPath(); c.moveTo(0, H * .7);
      for (let i = 0; i <= 8; i++) c.lineTo(W * i / 8, H * .7 - (i % 2) * H * .06 - rng() * H * .03);
      c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      // 天文台ドーム
      const ox = W * .5, oy = H * .68; FS('#c8ccd4'); rect(ox - W * .07, oy, W * .14, H * .1); c.beginPath(); c.ellipse(ox, oy, W * .075, W * .055, 0, Math.PI, 0); c.closePath(); c.closePath(); c.fill(); // 基部
      // スリット(開いた望遠鏡口+光)
      FS('#2a2a3a'); c.save(); c.translate(ox, oy); c.rotate(-.3); rect(-W * .012, -W * .055, W * .024, W * .05); c.restore();
      // スリットから差す光
      c.fillStyle = 'rgba(160,190,255,0.25)'; c.save(); c.translate(ox, oy); c.rotate(-.3); c.beginPath(); c.moveTo(-W * .012, -W * .05); c.moveTo(-W * .012, -W * .05); c.lineTo(W * .012, -W * .05); c.lineTo(W * .03, -H * .3); c.lineTo(W * .03, -H * .3); c.lineTo(-W * .03, -H * .3); c.closePath(); c.closePath(); c.fill(); c.restore();
    } else if (pr === 'prairie') {
      // 大草原: 空+起伏する草+風車+遠くの丸い干し草
      sky([[0,'#9ec8e0'],[.55,'#c8d8a0'],[1,'#8aa860']]); const rng = L.mulberry32(79);
      // 丘の起伏2層
      for (const [py, pc] of [[.62, '#7a9a52'], [.74, '#6a8a44']]) {
        FS(pc); c.beginPath(); c.moveTo(0, H * py);
        for (let x = 0; x <= 10; x++) {
          c.lineTo(W * x / 10, H * py - Math.sin(x * .9 + py * 10) * H * .05);
        }
        c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      }
      // 風車(回転する羽根)
      const wx = W * .72, wy = H * .55; SS('#5a4a38'); lnW(3); c.beginPath(); c.moveTo(wx - W * .015, wy + H * .18); c.lineTo(wx, wy); c.lineTo(wx + W * .015, wy + H * .18); c.stroke(); const wa = t * 1.2;
      times(4, i => {
        const a = wa + i * Math.PI / 2; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * W * .05, wy + Math.sin(a) * W * .05); c.stroke();
        // 羽根の板
        c.fillStyle = '#8a7a62'; c.save(); c.translate(wx + Math.cos(a) * W * .04, wy + Math.sin(a) * W * .04); c.rotate(a); rect(0, -3, W * .02, 6); c.restore();
      });
      // 干し草ロール
      times(4, i => {
        const hx2 = W * (.1 + rng() * .5), hy2 = H * (.78 + (i % 2) * .08); FS('#c8a850'); ellP(hx2, hy2, W * .025, H * .03); SS('#a08038'); lnW(2); ellPS(hx2, hy2, W * .015, H * .018);
      });
      // 揺れる草穂
      c.strokeStyle = '#9ab858'; lnW(2);
      times(30, i => {
        const gx = rng() * W, gy = H * (.8 + rng() * .18); const sway = Math.sin(t * 1.5 + i) * 4; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + sway, gy - H * .03); c.stroke();
      });
    } else if (pr === 'lagoon') {
      // ラグーン: 青空+浅瀬の縞+椰子の小島+飛ぶ海鳥
      sky([[0,'#8ec8e8'],[.45,'#5ab0d0'],[1,'#2a88a8']]); const rng = L.mulberry32(61);
      // 太陽
      c.fillStyle = 'rgba(255,240,190,0.9)'; dot(.8,.18,H * .06);
      // 浅瀬の縞(透明度の異なる水色帯)
      for (let i = 0; i < 5; i++) {
        FS(`rgba(120,210,220,${.15 + i * .05})`);
        const wy = H * (.58 + i * .08); c.beginPath(); c.moveTo(0, wy);
        for (let x = 0; x <= 10; x++) {
          c.lineTo(W * x / 10, wy + Math.sin(x * 1.2 + i * 2 + t) * H * .012);
        }
        c.lineTo(W, wy + H * .1); c.lineTo(W, wy + H * .1); c.lineTo(0, wy + H * .1); c.closePath(); c.closePath(); c.fill();
      }
      // 小島(砂州+椰子)
      const ix = W * .3, iy = H * .6; FS('#e8d8a0'); ellP(ix, iy, W * .09, H * .02);
      // 幹
      c.strokeStyle = '#7a5a38'; lnW(W * .008); c.beginPath(); c.moveTo(ix, iy); c.quadraticCurveTo(ix - W * .01, iy - H * .1, ix - W * .03, iy - H * .14); c.stroke();
      // 葉
      c.strokeStyle = '#3a7a40'; lnW(3);
      times(6, i => {
        const fa = i * 1.05 + S(.5) * .05; c.beginPath(); c.moveTo(ix - W * .03, iy - H * .14);
        c.quadraticCurveTo(ix - W * .03 + Math.cos(fa) * W * .04, iy - H * .14 + Math.sin(fa) * W * .015,
          ix - W * .03 + Math.cos(fa) * W * .07, iy - H * .14 + Math.sin(fa) * W * .05 + H * .02);
        c.stroke();
      });
      // 海鳥
      c.strokeStyle = '#f0f4f8'; lnW(2);
      times(3, i => {
        const bx = ((rng() + t * .04) % 1) * W; const by = H * (.15 + (i % 2) * .08) + Math.sin(t * 2 + i) * H * .02; c.beginPath(); c.moveTo(bx - 8, by); c.moveTo(bx - 8, by); c.quadraticCurveTo(bx - 3, by - 5, bx, by); c.quadraticCurveTo(bx + 3, by - 5, bx + 8, by); c.stroke();
      });
    } else if (pr === 'cliff') {
      // 断崖海岸: 空+海+切り立つ崖+飛ぶカモメ
      sky([[0,'#a8c8e0'],[.5,'#6890b0'],[1,'#3a5a74']]); const rng = L.mulberry32(93);
      // 海(下半分)+波線
      c.fillStyle = '#2a4a62'; rect(0, H * .6, W, H * .4); SS('rgba(220,235,245,0.5)'); lnW(2);
      for (let i = 0; i < 7; i++) {
        const wy = H * (.63 + i * .05); c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = wy + Math.sin(x * 1.3 + i + t * 2) * H * .008; x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 断崖(左側、層状の岩)
      FS('#6a5844'); c.beginPath(); c.moveTo(0, 0); c.moveTo(0, 0); c.lineTo(W * .3, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(W * (.3 - i * .02 + (rng() - .5) * .04), H * i * .12);
      }
      c.lineTo(W * .12, H); c.lineTo(W * .12, H); c.lineTo(0, H); c.closePath(); c.closePath(); c.fill();
      // 岩の層筋
      c.strokeStyle = 'rgba(50,40,30,0.4)'; lnW(2);
      for (let i = 1; i < 6; i++) {
        c.beginPath(); c.moveTo(0, H * i * .14); c.lineTo(W * (.28 - i * .02), H * i * .14); c.stroke();
      }
      // 崖上の草
      c.fillStyle = '#5a7a48'; ell(.15, .02, W * .16, H * .03);
      // カモメ
      c.strokeStyle = '#f0f4f8'; lnW(2);
      times(5, i => {
        const bx = ((rng() + t * .05) % 1) * W; const by = H * (.2 + (i % 3) * .1) + Math.sin(t * 2 + i) * H * .025; c.beginPath(); c.moveTo(bx - 9, by); c.moveTo(bx - 9, by); c.quadraticCurveTo(bx - 4, by - 6, bx, by); c.quadraticCurveTo(bx + 4, by - 6, bx + 9, by); c.stroke();
      });
    } else if (pr === 'bayou') {
      // 湿地: 昏い空+水面+糸杉+垂れ下がる苔+ホタル
      sky([[0,'#4a5a48'],[.55,'#2a3a30'],[1,'#1a2820']]); const rng = L.mulberry32(87);
      // 水面(下半分)
      FS('#2a4038'); rect(0, H * .62, W, H * .38);
      // 水面の光の揺らぎ
      c.strokeStyle = 'rgba(160,200,170,0.3)'; lnW(2);
      times(8, i => {
        const wy = H * (.65 + i * .04); const off = Math.sin(t * 1.5 + i) * W * .03; const wx = W * rng() + off; c.beginPath(); c.moveTo(wx - W * .1, wy); c.lineTo(wx + W * .1, wy); c.stroke();
      });
      // 糸杉の幹と膝根
      times(4, i => {
        const tx = W * (.12 + i * .26); const tw = W * (.02 + rng() * .015); FS('#3a3028'); poly([tx - tw * 1.8,H * .7],[tx - tw,H * .2],[tx + tw,H * .2],[tx + tw * 1.8,H * .7]); // 広がる根元
        // 水面より下の反射(簡易)
        FS('rgba(58,48,40,0.35)'); rect(tx - tw * 1.2, H * .7, tw * 2.4, H * .1);
        // 垂れ下がる苔
        c.strokeStyle = '#5a7a52'; lnW(3);
        times(4, m => {
          const mx = tx - tw + m * tw * .7; const ml = H * (.08 + rng() * .12); c.beginPath(); c.moveTo(mx, H * .25); c.quadraticCurveTo(mx + 4, H * .25 + ml * .6, mx + Math.sin(t + m) * 6, H * .25 + ml); c.stroke();
        });
      });
      // ホタル
      times(12, i => {
        const fx = ((rng() + Math.sin(t * .4 + i * 2) * .05) % 1 + 1) % 1 * W; const fy = H * (.3 + (i % 5) * .12) + Math.sin(t * 1.2 + i) * H * .05; const fl = .4 + .6 * Math.abs(Math.sin(t * 2 + i * 1.3));
        FS(`rgba(220,240,140,${fl})`);
        dotP(fx, fy, 2.5);
      });
    } else if (pr === 'alps') {
      // アルプス: 雪の峰々+麓の山小屋+流れる雲
      sky([[0,'#7ab0d8'],[.55,'#c8dce8'],[1,'#6a8a6a']]); const rng = L.mulberry32(77);
      // 雲
      c.fillStyle = 'rgba(255,255,255,0.85)';
      times(4, i => {
        const cx = ((rng() + t * .01) % 1) * W; const cy = H * (.1 + (i % 2) * .08); c.beginPath(); c.ellipse(cx, cy, W * .07, H * .018, 0, 0, 7); c.ellipse(cx + W * .04, cy - 4, W * .05, H * .015, 0, 0, 7); c.fill();
      });
      // 峰々(2層)
      for (const [py, pc, amp] of [[.62, '#8a9aa8', .18], [.68, '#5a6a78', .14]]) {
        FS(pc); c.beginPath(); c.moveTo(0, H * py);
        for (let i = 0; i <= 8; i++) {
          const px = W * i / 8; const peak = H * (py - amp * (i % 2 ? 1 : .3) * (0.7 + rng() * .6)); c.lineTo(px, peak);
        }
        c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      }
      // 雪(峰の上部を白く)
      FS('rgba(255,255,255,0.8)');
      times(4, i => {
        const sx = W * (.12 + i * .22); c.beginPath(); c.moveTo(sx - W * .04, H * .55); c.moveTo(sx - W * .04, H * .55); c.lineTo(sx, H * .47); c.lineTo(sx + W * .04, H * .55); c.lineTo(sx + W * .04, H * .55); c.closePath(); c.lineTo(sx + W * .04, H * .55); c.closePath(); c.fill();
      });
      // 麓の草原
      c.fillStyle = '#5a8a52'; rect(0, H * .72, W, H * .28);
      // 山小屋
      c.fillStyle = '#6a4a30'; rect(W * .62, H * .74, W * .07, H * .05); FS('#4a3020'); c.beginPath(); c.moveTo(W * .6, H * .74); c.moveTo(W * .6, H * .74); c.lineTo(W * .655, H * .7); c.moveTo(W * .6, H * .74); c.lineTo(W * .655, H * .7); c.lineTo(W * .71, H * .74); c.closePath(); c.closePath(); c.fill();
      // 窓の灯り
      c.fillStyle = '#f8d878'; rect(W * .635, H * .755, W * .012, H * .015); rect(W * .665, H * .755, W * .012, H * .015);
    } else if (pr === 'mesa') {
      // メサ大地: 黄昏空+平頂の台地+飛ぶ鳥
      sky([[0,'#e8a868'],[.5,'#c87a50'],[1,'#7a4030']]); FS('rgba(255,220,150,0.9)'); dot(.5,.42,H * .07); const rng = L.mulberry32(69);
      // 平頂の台地3基(遠近)
      const mesas = [
        [W * .18, H * .55, W * .28, '#8a5040'],
        [W * .75, H * .58, W * .22, '#9a5a46'],
        [W * .48, H * .66, W * .4, '#6a3a2c'],
      ];
      for (const [mx, my, mw, mc] of mesas) {
        FS(mc); poly([mx - mw * .5,H],[mx - mw * .5,my + H * .02],[mx - mw * .48,my,mx - mw * .4,my],[mx + mw * .4,my],[mx + mw * .48,my,mx + mw * .5,my + H * .02],[mx + mw * .5,H]);
        // 横筋(地層)
        SS('rgba(255,200,150,0.25)'); lnW(2);
        for (let g = 1; g < 4; g++) {
          c.beginPath(); c.moveTo(mx - mw * .5, my + (H - my) * g / 4); c.lineTo(mx + mw * .5, my + (H - my) * g / 4); c.stroke();
        }
      }
      // 飛ぶ鳥
      c.strokeStyle = '#3a2620'; lnW(2);
      times(4, i => {
        const bx = ((rng() + t * .04) % 1) * W; const by = H * (.2 + (i % 2) * .1) + Math.sin(t * 2 + i) * H * .02; c.beginPath(); c.moveTo(bx - 8, by); c.moveTo(bx - 8, by); c.quadraticCurveTo(bx - 3, by - 5, bx, by); c.quadraticCurveTo(bx + 3, by - 5, bx + 8, by); c.stroke();
      });
    } else if (pr === 'rainforest') {
      // 熱帯雨林: 霧+巨大な葉+木の幹+木漏れ日
      sky([[0,'#7ab880'],[.5,'#3a7a50'],[1,'#1a4030']]); const rng = L.mulberry32(63);
      // 木漏れ日(斜めの光筋)
      c.save(); c.globalAlpha = .15; FS('#e8f8c0');
      times(4, i => {
        const lx = W * (.1 + i * .25) + Math.sin(t * .3 + i) * W * .02; c.beginPath(); c.moveTo(lx, 0); c.moveTo(lx, 0); c.lineTo(lx + W * .06, 0); c.lineTo(lx + W * .18, H); c.lineTo(lx + W * .18, H); c.lineTo(lx + W * .1, H); c.closePath(); c.closePath(); c.fill();
      });
      c.restore();
      // 木の幹
      times(5, i => {
        const tx = W * (i / 4.5) + W * .04; const tw = W * (.03 + rng() * .03); FS('#4a3828'); poly([tx - tw,H],[tx - tw * .6,H * .5,tx - tw * 1.2,0],[tx + tw * 1.2,0],[tx + tw * .6,H * .5,tx + tw,H]);
      });
      // 巨大な葉(前景と中景)
      times(10, i => {
        const lx = rng() * W, ly = H * (.3 + rng() * .5); const ls = W * (.05 + rng() * .1), la = rng() * Math.PI * 2; const dark = rng() > .5; FS(dark ? '#2a6a40' : '#4a9a58'); ellP(lx, ly + Math.sin(t * .8 + i) * 3, ls, ls * .35, la);
        // 葉脈
        c.strokeStyle = 'rgba(20,50,30,0.5)'; lnW(1.5); c.beginPath(); c.moveTo(lx - Math.cos(la) * ls, ly - Math.sin(la) * ls); c.lineTo(lx + Math.cos(la) * ls, ly + Math.sin(la) * ls); c.stroke();
      });
      // 霧
      c.fillStyle = 'rgba(180,220,190,0.12)'; rect(0, H * .55, W, H * .45);
    } else if (pr === 'lavender') {
      // ラベンダー畑: 夕空+紫の列+蜂+遠景の木
      sky([[0,'#e8c8d8'],[.5,'#b890c8'],[1,'#6a4a78']]); FS('rgba(255,220,180,0.85)'); dot(.7,.25,H * .08); const rng = L.mulberry32(57);
      // 遠景の木(プロヴァンス風の糸杉)
      FS('#4a5038');
      times(4, i => {
        const tx = W * (.15 + rng() * .7); ellP(tx, H * .5, W * .012, H * .05);
      });
      // ラベンダーの列(紫の帯+穂の点)
      for (let row = 0; row < 5; row++) {
        const ry = H * (.58 + row * .085); FS(['#8a5aa8', '#7a4a98', '#9a6ab8'][row % 3]); c.beginPath(); c.moveTo(0, ry + H * .03);
        for (let x = 0; x <= 16; x++) c.lineTo(W * x / 16, ry + Math.sin(x * .7 + row) * 4);
        c.lineTo(W, ry + H * .09); c.lineTo(W, ry + H * .09); c.lineTo(0, ry + H * .09); c.closePath(); c.closePath(); c.fill();
        // 穂
        times(40 - row * 5, i => {
          const hx2 = rng() * W; FS('#a878c8'); rect(hx2, ry + rng() * H * .04 - 4, 2.5, 5 + row);
        });
      }
      // 飛ぶ蜂
      c.fillStyle = '#e8c830';
      times(5, i => {
        const bx = ((rng() + t * .05 * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W; const by = H * (.55 + (i % 3) * .12) + Math.sin(t * 3 + i * 2) * H * .03; ellP(bx, by, W * .006, H * .004);
      });
    } else if (pr === 'vineyard') {
      // 葡萄畑: 秋空+ぶどう棚の列+房+遠山
      sky([[0,'#e8d8b0'],[.5,'#c8b080'],[1,'#8a7048']]); FS('rgba(255,225,160,0.85)'); dot(.25,.28,H * .08);
      // 遠山
      c.fillStyle = 'rgba(110,95,70,0.5)'; c.beginPath(); c.moveTo(0, H * .5);
      for (let i = 0; i <= 10; i++) c.lineTo(W * i / 10, H * .5 - Math.sin(i * 1.9) * H * .04);
      c.lineTo(W, H * .6); c.lineTo(0, H * .6); c.closePath(); c.fill(); const rng = L.mulberry32(43);
      // 地面
      c.fillStyle = '#9a8054'; rect(0, H * .62, W, H * .38);
      // 棚の列(斜めに遠近)
      for (let row = 0; row < 4; row++) {
        const ry = H * (.64 + row * .09); const n = 6 - row;
        for (let i = 0; i <= n; i++) {
          const vx = W * (i / n + row * .04);
          // 支柱
          c.strokeStyle = '#5a4830'; lnW(2 + row); c.beginPath(); c.moveTo(vx, ry); c.lineTo(vx, ry - H * (.06 + row * .01)); c.stroke();
          // 葉の塊
          c.fillStyle = ['#6a8a3a', '#7a9a44', '#5a7a34'][(i + row) % 3]; ellP(vx, ry - H * (.07 + row * .01), W * .025 + row * W * .008, H * .018);
          // ぶどう房
          if (rng() > .4) {
            FS('#6a3a7a');
            times(4, g => {
              dotP(vx + (rng() - .5) * W * .015, ry - H * (.05 + row * .01) + g * 4, 3 + row);
            });
          }
        }
      }
    } else if (pr === 'coral') {
      // 珊瑚礁: 深い海+光の筋+珊瑚+魚群
      sky([[0,'#0a3a5a'],[.5,'#0a4a6a'],[1,'#063048']]);
      // 光の筋
      c.fillStyle = 'rgba(150,220,255,0.1)';
      times(4, i => {
        c.save(); c.translate(W * (.2 + i * .2), 0); c.rotate(.3); rect(-W * .015, 0, W * .03, H); c.restore();
      });
      const rng = L.mulberry32(91);
      // 海底
      c.fillStyle = '#c8b088'; rect(0, H * .85, W, H * .15);
      // 珊瑚(枝状と円形)
      times(5, i => {
        const cx = W * (.1 + rng() * .8), cy = H * (.86 + rng() * .1); const cc = ['#e07070', '#e8a050', '#c860a0', '#60a8b0'][i % 4]; SS(cc); lnW(W * .008);
        times(4, b => {
          const ba = -Math.PI / 2 + (b - 1.5) * .5; c.beginPath(); c.moveTo(cx, cy);
          c.quadraticCurveTo(cx + Math.cos(ba) * W * .04, cy + Math.sin(ba) * H * .1,
            cx + Math.cos(ba) * W * .06, cy + Math.sin(ba) * H * .14);
          c.stroke();
        });
        FS(cc); dotP(cx + W * .05, cy - H * .02, W * .02);
      });
      // 魚群(同じ方向へゆらぎながら泳ぐ)
      FS('rgba(255,200,120,0.8)');
      times(10, i => {
        const fx = ((rng() + t * .04) % 1.2 - .1) * W; const fy = H * (.25 + (i % 3) * .15) + Math.sin(t * 2 + i) * H * .02; c.beginPath(); c.ellipse(fx, fy, W * .012, H * .008, 0, 0, 7); c.ellipse(fx, fy, W * .012, H * .008, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(fx - W * .014, fy); c.moveTo(fx - W * .014, fy); c.lineTo(fx - W * .022, fy - H * .008); c.moveTo(fx - W * .014, fy); c.lineTo(fx - W * .022, fy - H * .008); c.lineTo(fx - W * .022, fy + H * .008); c.closePath(); c.closePath(); c.fill();
      });
    } else if (pr === 'geyser') {
      // 間欠泉: 曇り空+岩場+噴き上がる水柱+湯気
      sky([[0,'#b8c4cc'],[.55,'#8a9aa4'],[1,'#5a6a72']]); const rng = L.mulberry32(67);
      // 地面(岩場)
      FS('#7a7068'); rect(0, H * .72, W, H * .28);
      // 岩
      c.fillStyle = '#6a6058';
      times(6, i => {
        ellP(rng() * W, H * (.74 + rng() * .2), W * (.02 + rng() * .04), H * (.015 + rng() * .02));
      });
      // 噴水の口(中央)
      const gx = W * .45, gy = H * .74; FS('#5a5048'); ellP(gx, gy, W * .09, H * .025);
      // 水柱(噴き上がりの周期)
      const erupt = Math.max(0, S(1.2)) ** .5;
      if (erupt > .05) {
        FS('rgba(220,235,245,0.85)'); const colH = H * .5 * erupt; poly([gx - W * .02,gy],[gx - W * .04 * erupt,gy - colH * .7,gx - W * .015,gy - colH],[gx,gy - colH * 1.1,gx + W * .015,gy - colH],[gx + W * .04 * erupt,gy - colH * .7,gx + W * .02,gy]);
        // 頂の飛沫
        times(8, i => {
          const a = rng() * Math.PI; FS('rgba(230,242,250,0.8)'); dotP(gx + Math.cos(a) * W * .05 * erupt * (rng() + .3), gy - colH - rng() * H * .06, W * .008);
        });
      }
      // 湯気(ゆらぐ)
      FS('rgba(230,235,240,0.35)');
      times(5, i => {
        const sx = gx + Math.sin(t * .6 + i * 2) * W * .05 + (rng() - .5) * W * .1; ellP(sx, gy - H * (.05 + i * .07), W * (.04 + i * .015), H * (.02 + i * .008));
      });
    } else if (pr === 'pagoda') {
      // 五重塔: 夕暮れ+5層の屋根の塔+月+遠山
      sky([[0,'#3a3050'],[.5,'#80506a'],[1,'#c07858']]);
      // 月
      c.fillStyle = 'rgba(255,240,210,0.85)'; dot(.2,.2,H * .07);
      // 遠山
      c.fillStyle = 'rgba(50,40,60,0.6)'; c.beginPath(); c.moveTo(0, H * .6);
      for (let i = 0; i <= 10; i++) c.lineTo(W * i / 10, H * .6 - Math.sin(i * 1.3 + 2) * H * .05);
      c.lineTo(W, H * .7); c.lineTo(0, H * .7); c.closePath(); c.fill();
      // 五重塔(中央右寄り)
      const px = W * .62, pbase = H * .85;
      times(5, i => {
        const ty = pbase - H * .115 * i; const tw = W * (.11 - i * .012);
        // 階の柱
        c.fillStyle = '#4a3028'; rect(px - tw * .32, ty - H * .075, tw * .64, H * .075);
        // 窓の灯り
        c.fillStyle = '#ffd890'; rect(px - tw * .1, ty - H * .06, tw * .2, H * .035);
        // 屋根(反った三角形)
        FS('#2a2030'); poly([px - tw * .55,ty - H * .075],[px,ty - H * .115,px + tw * .55,ty - H * .075],[px + tw * .5,ty - H * .045],[px - tw * .5,ty - H * .045]);
      });
      // 相輪(頂の飾り)
      SS('#d8b050'); lnW(3); c.beginPath(); c.moveTo(px, pbase - H * .575); c.lineTo(px, pbase - H * .68); c.stroke(); FS('#d8b050');
      times(4, i => {
        ellP(px, pbase - H * (.6 + i * .025), W * .014, H * .006);
      });
    } else if (pr === 'wheatfield') {
      // 麦畑: 夕空+風に揺れる金色の麦+遠景の木
      sky([[0,'#f0d8a0'],[.5,'#e8b870'],[1,'#b88840']]); FS('rgba(255,230,160,0.9)'); dot(.75,.3,H * .09);
      // 遠景の木
      const rng = L.mulberry32(83); FS('#6a5838');
      times(5, i => {
        const tx = rng() * W; ellP(tx, H * .58, W * .02, H * .035); rect(tx - 2, H * .58, 4, H * .03);
      });
      // 麦畑(3層: 奥→手前ほど濃い)
      times(3, ly => {
        const baseY = H * (.62 + ly * .12); const shade = ['#c8a050', '#b88840', '#a07030'][ly]; FS(shade); rect(0, baseY, W, H * .4);
        // 穂(風で揺れる短い線)
        SS(['#e0c070', '#d0b060', '#c0a050'][ly]); lnW(2); const n = 60 - ly * 15;
        times(n, i => {
          const hx2 = (i / n + (rng() * .01)) * W; const hy2 = baseY + rng() * H * .1; const sw = Math.sin(t * 1.5 + hx2 * .01 + ly) * W * .006; c.beginPath(); c.moveTo(hx2, hy2 + H * .02); c.quadraticCurveTo(hx2 + sw * .5, hy2 + H * .01, hx2 + sw, hy2); c.stroke();
        });
      });
    } else if (pr === 'bridge') {
      // 橋: 夕暮れ+吊り橋シルエット(主塔2基+ケーブル)+川
      sky([[0,'#f0a868'],[.5,'#c06068'],[1,'#4a4058']]);
      // 太陽
      c.fillStyle = 'rgba(255,210,140,0.9)'; dot(.5,.52,H * .08);
      // 川
      c.fillStyle = '#50384a'; rect(0, H * .68, W, H * .32); SS('rgba(255,180,120,0.35)'); lnW(2);
      for (let i = 0; i < 8; i++) {
        const wy = H * (.72 + i * .03); c.beginPath(); c.moveTo(0, wy);
        for (let x = 1; x <= 8; x++) c.lineTo(W * x / 8, wy + Math.sin(x * 2 + t + i) * 2);
        c.stroke();
      }
      // 主塔2基
      c.fillStyle = '#2a2230';
      ([W * .25, W * .75]).forEach(tx => {
        rect(tx - W * .012, H * .3, W * .024, H * .42); rect(tx - W * .02, H * .34, W * .04, H * .015); rect(tx - W * .02, H * .5, W * .04, H * .015);
      });
      // メインケーブル(放物線)
      SS('#2a2230'); lnW(3); c.beginPath(); c.beginPath(); c.moveTo(0, H * .55); c.quadraticCurveTo(W * .25, H * .28, W * .5, H * .55); c.quadraticCurveTo(W * .75, H * .28, W, H * .55); c.stroke();
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
      rect(0, H * .6, W, H * .03);
      // 橋の灯り
      c.fillStyle = '#ffd890';
      times(9, i => {
        dot((.05 + i * .11),.585,3);
      });
    } else if (pr === 'terraces') {
      // 棚田: 朝霧の空+段々の水田(緑と水面)+遠山
      sky([[0,'#dfe8e0'],[.55,'#a8c0a8'],[1,'#5a7a58']]);
      // 遠山
      c.fillStyle = 'rgba(90,110,95,0.5)'; c.beginPath(); c.moveTo(0, H * .45);
      for (let i = 0; i <= 10; i++) c.lineTo(W * i / 10, H * .45 - Math.sin(i * 1.7) * H * .06);
      c.lineTo(W, H * .5); c.lineTo(W, H * .6); c.lineTo(0, H * .6); c.closePath(); c.fill(); const rng = L.mulberry32(59);
      // 段々の水田(緑と交互の水面帯)
      for (let i = 0; i < 7; i++) {
        const ty = H * (.5 + i * .07), th = H * .055; const water = i % 3 === 0; FS(water ? '#9ec8d8' : ['#6a9a58', '#7aaa62', '#5a8a50'][i % 3]); c.beginPath(); c.moveTo(0, ty + Math.sin(i * 2) * 4);
        for (let x = 0; x <= 16; x++) c.lineTo(W * x / 16, ty + Math.sin(x * .8 + i * 1.3) * 5);
        c.lineTo(W, ty + th); c.lineTo(0, ty + th); c.closePath(); c.fill();
        // 畦の線
        c.strokeStyle = 'rgba(60,80,50,0.5)'; lnW(2); c.beginPath();
        for (let x = 0; x <= 16; x++) {
          const px = W * x / 16, py = ty + th + Math.sin(x * .8 + i * 1.3) * 5; x ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
      // 苗の点
      c.fillStyle = 'rgba(220,240,200,0.7)';
      times(40, i => {
        const ty = H * (.55 + Math.floor(rng() * 6) * .07); rect(rng() * W, ty + rng() * H * .04, 2, 3);
      });
    } else if (pr === 'harbor') {
      // 港: 朝焼け+灯台+帆船+波立つ海
      sky([[0,'#e8b890'],[.5,'#c87878'],[1,'#586878']]);
      // 太陽
      c.fillStyle = 'rgba(255,220,160,0.9)'; dot(.3,.5,H * .09); const rng = L.mulberry32(71);
      // 海
      c.fillStyle = '#4a6a84'; rect(0, H * .62, W, H * .38);
      // 波線
      c.strokeStyle = 'rgba(255,220,180,0.4)'; lnW(2);
      for (let i = 0; i < 12; i++) {
        const wy = H * (.64 + i * .028); c.beginPath();
        for (let x = 0; x <= 12; x++) {
          const px = ((x / 12 + t * .02 * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W; x ? c.lineTo(px, wy + Math.sin(x + t + i) * 3) : c.moveTo(px, wy);
        }
        c.stroke();
      }
      // 灯台(縞模様+灯り)
      FS('#e8e0d0'); rect(W * .78, H * .32, W * .035, H * .3); FS('#c84040');
      for (let i = 0; i < 3; i++) rect(W * .78, H * (.34 + i * .1), W * .035, H * .05);
      FS('#ffe8a0'); dot(.7975,.3,H * .025);
      // 灯りの光線(ゆっくり揺れる)
      FS('rgba(255,240,180,0.25)'); c.save(); c.translate(W * .7975, H * .3); c.rotate(S(.5) * .3); poly([0,0],[W * .25,-H * .04],[W * .25,H * .04]); c.restore();
      // 帆船
      const bx = ((rng() + t * .03) % 1.2 - .1) * W, by = H * .7; FS('#5a4434'); c.beginPath(); c.moveTo(bx - W * .03, by); c.moveTo(bx - W * .03, by); c.lineTo(bx + W * .03, by); c.lineTo(bx + W * .02, by + H * .02); c.lineTo(bx + W * .02, by + H * .02); c.lineTo(bx - W * .02, by + H * .02); c.closePath(); c.closePath(); c.fill(); FS('#f0ece0'); c.beginPath(); c.moveTo(bx, by - H * .06); c.moveTo(bx, by - H * .06); c.lineTo(bx, by); c.moveTo(bx, by - H * .06); c.lineTo(bx, by); c.lineTo(bx + W * .028, by); c.closePath(); c.closePath(); c.fill(); c.beginPath(); c.moveTo(bx, by - H * .06);
      c.moveTo(bx, by - H * .06); c.lineTo(bx, by); c.moveTo(bx, by - H * .06); c.lineTo(bx, by); c.lineTo(bx - W * .022, by); c.closePath(); c.closePath(); c.fill();
    } else if (pr === 'moon') {
      // 月面: 暗い空+地球+クレーターの灰色地表
      sky([[0,'#0a0a12'],[.75,'#101018'],[1,'#181820']]); const rng = L.mulberry32(97);
      // 星
      c.fillStyle = '#fff';
      times(60, i => {
        rect(rng() * W, rng() * H * .6, 1.2, 1.2);
      });
      // 地球(青い丸+白い雲筋)
      FS('#3a6ac8'); dot(.8,.18,H * .1); SS('rgba(255,255,255,0.55)'); lnW(H * .012); c.beginPath(); c.arc(W * .8, H * .18, H * .1, -.6, .9); c.stroke();
      // 地表
      c.fillStyle = '#8a8a92'; rect(0, H * .76, W, H * .24);
      // 起伏線
      c.strokeStyle = '#6a6a72'; lnW(3); c.beginPath();
      for (let i = 0; i <= 20; i++) {
        const px = W * i / 20, py = H * .76 + Math.sin(i * 2.1) * H * .015; i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
      // クレーター
      times(7, i => {
        const crx = rng() * W, cry = H * (.8 + rng() * .15), crr = W * (.015 + rng() * .03); FS('#6e6e76'); ellP(crx, cry, crr, crr * .45); SS('#a8a8b0'); lnW(2); c.beginPath(); c.ellipse(crx, cry - 1, crr, crr * .45, 0, Math.PI, 0); c.stroke();
      });
    } else if (pr === 'sakura') {
      // 桜並木: 淡い空 + 桜の木(ピンクの樹冠) + 散る花びら + 地面
      sky([[0,'#e8ecf4'],[.6,'#c8d0e0'],[1,'#98a4b8']]); const rng = L.mulberry32(37);
      // 地面(芝+花びら)
      FS('#7a9a6a'); rect(0, H * .8, W, H * .2); FS('rgba(255,200,215,0.6)');
      times(30, i => {
        ellP(rng() * W, H * (.8 + rng() * .18), W * .006, W * .003, rng() * 3);
      });
      // 桜の木3本(幹+ピンクの塊)
      for (const [tx, th] of [[W * .15, .45], [W * .5, .52], [W * .85, .42]]) {
        const ty = H * .82; FS('#5a4030'); rect(tx - W * .007, ty - H * th * .55, W * .014, H * th * .55);
        times(10, b => {
          FS(['#f0b8cc', '#e8a0bc', '#f5ccd8'][Math.floor(rng() * 3)]); dotP(tx + (rng() - .5) * W * .12, ty - H * th * (.5 + rng() * .45), W * (.025 + rng() * .03));
        });
      }
      // 舞う花びら
      c.fillStyle = 'rgba(255,210,225,0.9)';
      times(16, i => {
        const px = ((rng() + t * .06 * (0.4 + rng() * .6)) % 1) * W; const py = (rng() + .1 * Math.sin(t * 1.5 + i)) * H; c.save(); c.translate(px, py); c.rotate(t * 1.5 + i); ellP(0, 0, W * .004, W * .0025); c.restore();
      });
    } else if (pr === 'ruins') {
      // 遺跡: 黄昏 + 崩れた石柱 + アーチ + 蔦
      sky([[0,'#d8a878'],[.55,'#a87858'],[1,'#584838']]); FS('rgba(255,215,150,0.8)'); dot(.5,.45,H * .12); const rng = L.mulberry32(51);
      // 地面
      c.fillStyle = '#6a5a44'; rect(0, H * .78, W, H * .22);
      // 石柱(高さの違う4本、2本は欠けている)
      const colW = W * .045;
      times(4, i => {
        const cx = W * (.18 + i * .2), ch = H * (.28 + rng() * .25); FS('#8a8078'); rect(cx - colW / 2, H * .78 - ch, colW, ch);
        // 柱頭
        rect(cx - colW * .7, H * .78 - ch - H * .02, colW * 1.4, H * .02);
        // 欠けた角
        if (i % 2) {
          FS(gr); poly([cx - colW / 2,H * .78 - ch],[cx + colW / 2,H * .78 - ch + H * .04],[cx + colW / 2,H * .78 - ch]);
        }
        // 蔦(緑の曲線)
        SS('rgba(80,120,50,0.7)'); lnW(3); c.beginPath(); c.moveTo(cx - colW / 2, H * .78); c.quadraticCurveTo(cx - colW, H * .78 - ch * .5, cx, H * .78 - ch); c.stroke();
      });
      // 倒れた柱
      c.save(); c.translate(W * .6, H * .9); c.rotate(.12); FS('#7a7068'); rect(0, -H * .03, W * .25, H * .06); c.restore();
    } else if (pr === 'glacier') {
      // 氷河: 白みがかった空 + 氷山 + 氷の水面 + 光る稜線
      sky([[0,'#c8dce8'],[.5,'#8ab4cc'],[1,'#4a7a9a']]); const rng = L.mulberry32(19);
      // 遠景の氷山2つ(白い尖り)
      FS('rgba(230,240,248,0.9)');
      for (const [ix, ih] of [[W * .2, .3], [W * .75, .38]]) {
        poly([ix - W * .12,H * .72],[ix - W * .05,H * .72 - H * ih * .5],[ix,H * .72 - H * ih],[ix + W * .07,H * .72 - H * ih * .4],[ix + W * .12,H * .72]);
      }
      // 水面(氷青色)
      FS('#3a6a86'); rect(0, H * .72, W, H * .28);
      // 浮氷
      c.fillStyle = 'rgba(220,235,245,0.85)';
      times(8, i => {
        const fx = rng() * W, fy = H * (.74 + rng() * .2); ellP(fx, fy, W * (.015 + rng() * .03), H * .012);
      });
      // きらめく水面の光
      c.strokeStyle = 'rgba(220,240,255,0.4)'; lnW(1.5);
      times(12, i => {
        const wx = rng() * W, wy = H * (.74 + rng() * .24); const tw = .5 + .5 * Math.sin(t * 2 + i); c.globalAlpha = .2 + .4 * tw; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + W * .02, wy); c.stroke();
      });
      c.globalAlpha = 1;
    } else if (pr === 'fjord') {
      // フィヨルド: 冷たい空 + 切り立つ山壁 + 静かな水面
      sky([[0,'#a8c8d8'],[.5,'#6a94a8'],[1,'#3a5a6e']]); const rng = L.mulberry32(87);
      // 左右の山壁(切り立つギザギザ)
      for (const [x0, s] of [[0, 1], [W, -1]]) {
        FS(s > 0 ? '#3e5a52' : '#4a6a5e'); c.beginPath(); c.moveTo(x0, H); c.lineTo(x0, H * .15); let vx = 0;
        while (vx < W * .32) {
          vx += W * (.05 + rng() * .07); c.lineTo(x0 + s * vx, H * (.15 + rng() * .3));
        }
        c.lineTo(x0 + s * W * .35, H); c.closePath(); c.closePath(); c.fill();
      }
      // 雪の稜線
      c.fillStyle = 'rgba(240,245,250,0.8)'; c.beginPath(); c.moveTo(0, H * .15); c.moveTo(0, H * .15); c.lineTo(W * .1, H * .2); c.moveTo(0, H * .15); c.lineTo(W * .1, H * .2); c.lineTo(W * .05, H * .24); c.lineTo(0, H * .22); c.lineTo(0, H * .22); c.closePath(); c.lineTo(0, H * .22); c.closePath(); c.fill();
      // 水面(下3割、穏やかな横線)
      FS('#4a7a8e'); rect(0, H * .7, W, H * .3); SS('rgba(200,230,240,0.35)'); lnW(1.5);
      times(10, i => {
        const wy = H * (.72 + rng() * .25); const wx = rng() * W * .7, wl = W * (.05 + rng() * .12); c.beginPath(); c.moveTo(wx + Math.sin(t + i) * 5, wy); c.moveTo(wx + Math.sin(t + i) * 5, wy); c.lineTo(wx + wl, wy); c.stroke();
      });
    } else if (pr === 'autumn') {
      // 紅葉: 淡い秋空 + 紅葉の木々 + 舞う紅葉 + 落ち葉の地面
      sky([[0,'#d8e0e8'],[.5,'#c8b890'],[1,'#9a7048']]); const rng = L.mulberry32(23);
      // 地面(落ち葉のじゅうたん)
      FS('#8a5a30'); rect(0, H * .78, W, H * .22); FS('rgba(200,90,40,0.5)');
      times(40, i => {
        ellP(rng() * W, H * (.78 + rng() * .2), W * .008, W * .004, rng() * 3);
      });
      // 紅葉の木3本(幹+もこもこ樹冠)
      for (const [tx, th] of [[W * .18, .42], [W * .52, .5], [W * .85, .38]]) {
        const ty = H * .8; FS('#4a3020'); rect(tx - W * .008, ty - H * th * .6, W * .016, H * th * .6); const cols = ['#c8402a', '#e07020', '#d8a020'];
        times(9, b => {
          FS(cols[Math.floor(rng() * 3)]); dotP(tx + (rng() - .5) * W * .1, ty - H * th * (.55 + rng() * .4), W * (.02 + rng() * .025));
        });
      }
      // 舞う紅葉
      c.fillStyle = 'rgba(210,80,40,0.8)';
      times(14, i => {
        const lx = ((rng() + t * .05 * (0.4 + rng() * .6)) % 1) * W; const ly = (rng() + .08 * Math.sin(t * 2 + i)) * H; c.save(); c.translate(lx, ly); c.rotate(t * 2 + i); ellP(0, 0, W * .005, W * .003); c.restore();
      });
    } else if (pr === 'falls') {
      // 滝: 山の緑 + 絶壁 + 落ちる水流 + 水しぶき
      sky([[0,'#8ec8e8'],[.5,'#5a9e6a'],[1,'#2e5e48']]); const rng = L.mulberry32(43);
      // 左右の崖
      c.fillStyle = '#4a5a4a'; c.beginPath(); c.moveTo(0, H); c.moveTo(0, H); c.lineTo(0, H * .2); c.lineTo(W * .3, H * .35); c.lineTo(W * .3, H * .35); c.lineTo(W * .35, H); c.closePath(); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, H); c.moveTo(W, H); c.lineTo(W, H * .25); c.lineTo(W * .7, H * .4); c.lineTo(W * .7, H * .4); c.lineTo(W * .65, H); c.closePath(); c.closePath(); c.fill();
      // 水流(中央、ゆらぐ帯)
      FS('rgba(220,240,255,0.85)'); poly([W * .38,0],[W * .62,0],[W * .58 + S(2) * 4,H * .8],[W * .42 - S(2) * 4,H * .8]);
      // 水の縞
      c.strokeStyle = 'rgba(140,190,230,0.6)'; lnW(2);
      times(6, i => {
        const wy = ((rng() + t * .3) % 1) * H * .8; c.beginPath(); c.moveTo(W * .4, wy); c.moveTo(W * .4, wy); c.lineTo(W * .6, wy + 8); c.stroke();
      });
      // 水しぶき+池
      c.fillStyle = 'rgba(230,248,255,0.6)';
      times(16, i => {
        const mx = W * (.4 + rng() * .2), my = H * (.78 + rng() * .06); const mr = W * (.004 + rng() * .008) * (0.7 + .3 * Math.sin(t * 3 + i)); dotP(mx, my, mr);
      });
      FS('rgba(70,140,160,0.8)'); rect(0, H * .82, W, H * .18);
    } else if (pr === 'oasis') {
      // オアシス: 砂漠の空 + 椰子2本 + 青い池 + 砂丘
      sky([[0,'#9ed4e8'],[.55,'#e8d49a'],[1,'#c8a060']]); FS('rgba(255,240,190,0.9)'); dot(.8,.18,H * .08);
      // 砂丘
      c.fillStyle = '#d8b070'; c.beginPath(); c.ellipse(W * .2, H * .8, W * .45, H * .16, 0, Math.PI, 0); c.fill(); FS('#c89a58'); rect(0, H * .78, W, H * .22);
      // 池
      c.fillStyle = 'rgba(60,150,190,0.9)'; ell(.45,.82,W * .16,H * .045); SS('rgba(200,240,255,0.5)'); lnW(1.5);
      times(3, i => {
        const ry = H * (.8 + i * .015); c.beginPath(); c.moveTo(W * .38, ry); c.quadraticCurveTo(W * .45, ry + 3, W * .52, ry); c.stroke();
      });
      // 椰子の木2本(湾曲した幹+扇状の葉)
      for (const [px, flip] of [[W * .3, 1], [W * .62, -1]]) {
        const py = H * .78, ph = H * .28; SS('#7a5a30'); lnW(W * .009); c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py); c.moveTo(px, py); c.quadraticCurveTo(px + flip * W * .03, py - ph * .6, px + flip * W * .05, py - ph); c.stroke(); const tx = px + flip * W * .05, ty = py - ph; SS('#3a7a3a'); lnW(W * .006);
        for (let f = -2; f <= 2; f++) {
          c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + f * W * .03, ty - H * .05, tx + f * W * .055, ty - H * .01); c.stroke();
        }
      }
    } else if (pr === 'savanna') {
      // サバンナ: 茜空 + 大きな夕日 + アカシアの木 + 草むら
      sky([[0,'#f4b04e'],[.6,'#e07a3f'],[1,'#8a4a2a']]); FS('rgba(255,220,140,0.9)'); dot(.5,.55,H * .16);
      // 地平線の草
      c.fillStyle = '#5e3818'; rect(0, H * .72, W, H * .28); const rng = L.mulberry32(67);
      // アカシアの木2本(傘状の樹冠)
      ([W * .2, W * .78]).forEach(tx => {
        const th = H * .3, ty = H * .72; SS('#2e1c10'); lnW(W * .008); c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.moveTo(tx, ty); c.quadraticCurveTo(tx + W * .01, ty - th * .6, tx + W * .02, ty - th); c.stroke(); c.beginPath(); c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.lineTo(tx - W * .03, ty - th * .95); c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.lineTo(tx - W * .03, ty - th * .95); c.stroke(); c.beginPath(); c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7);
        c.lineTo(tx + W * .07, ty - th * .95); c.beginPath(); c.moveTo(tx + W * .02, ty - th * .7); c.lineTo(tx + W * .07, ty - th * .95); c.stroke(); FS('#3a2410'); ellP(tx + W * .02, ty - th, W * .1, H * .035);
      });
      // 草の穂
      c.strokeStyle = 'rgba(60,35,15,0.8)'; lnW(2);
      times(30, i => {
        const gx = rng() * W, gy = H * (.75 + rng() * .22), gh = H * (.03 + rng() * .04); c.beginPath(); c.moveTo(gx, gy); c.moveTo(gx, gy); c.quadraticCurveTo(gx + 4, gy - gh * .6, gx + (rng() - .3) * 10, gy - gh); c.stroke();
      });
    } else if (pr === 'bamboo') {
      // 竹林: 緑の光 + 竹の幹(節つき) + 舞う葉
      sky([[0,'#8fbf7a'],[.5,'#5e9e5a'],[1,'#2e5e40']]);
      // 木漏れ日
      const lg = c.createLinearGradient(0, 0, W * .4, H); lg.addColorStop(0, 'rgba(255,250,200,0.25)'); lg.addColorStop(1, 'rgba(255,250,200,0)'); FS(lg); rect(0, 0, W, H); const rng = L.mulberry32(91);
      // 竹の幹(奥:薄い 手前:濃い)
      for (let i = 0; i < 14; i++) {
        const bx = rng() * W, bw = W * (.008 + rng() * .012); const deep = rng() < .5; FS(deep ? 'rgba(40,90,50,0.5)' : 'rgba(25,70,38,0.9)'); rect(bx - bw / 2, 0, bw, H);
        // 節
        c.fillStyle = 'rgba(20,50,28,0.8)';
        for (let ny = H * .1; ny < H; ny += H * .18) {
          rect(bx - bw / 2 - 1, ny, bw + 2, 3);
        }
      }
      // 舞う葉
      c.fillStyle = 'rgba(180,230,140,0.8)';
      times(12, i => {
        const lx = ((rng() + t * .03 * (0.5 + rng() * .5)) % 1) * W; const ly = (rng() + .1 * Math.sin(t + i)) * H; const sz = W * .006; c.save(); c.translate(lx, ly); c.rotate(t + i); ellP(0, 0, sz * 2, sz); c.restore();
      });
    } else if (pr === 'canyon') {
      // 渓谷: 夕焼け + 層状の赤岩岸壁(遠近3層)
      sky([[0,'#f0a860'],[.5,'#d4786a'],[1,'#8a4a44']]); FS('rgba(255,225,170,0.85)'); dot(.5,.34,H * .1); const rng = L.mulberry32(31);
      // 3層の崖(後ろほど薄く)
      const layers = [
        ['rgba(150,70,55,0.55)', .5], ['rgba(120,55,45,0.75)', .66], ['#5e3229', .8],
      ];
      for (const [col, by] of layers) {
        FS(col); c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * by); let cx = 0;
        while (cx < W) {
          const seg = W * (.08 + rng() * .12); const ny = H * (by - .04 + rng() * .08); c.lineTo(cx + seg * .5, ny); c.lineTo(cx + seg, H * (by - .02 + rng() * .04)); cx += seg;
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
      // 前景の岩棚(縞模様)
      FS('#4a2620'); rect(0, H * .88, W, H * .12); SS('rgba(200,120,80,0.4)'); lnW(2);
      times(4, i => {
        const sy = H * (.9 + i * .025); c.beginPath(); c.moveTo(0, sy); c.lineTo(W, sy + (rng() - .5) * 6); c.stroke();
      });
    } else if (pr === 'castle') {
      // 城: 夕暮れ+塔2基+城壁+旗+窓の灯り
      sky([[0,'#e89a5f'],[.55,'#c86a78'],[1,'#4a3050']]);
      // 太陽
      c.fillStyle = 'rgba(255,215,150,0.9)'; dot(.72,.3,H * .09); const rng = L.mulberry32(55);
      // 城壁+塔
      c.fillStyle = '#3a2b42'; const wallY = H * .62, towerH = H * .34; rect(0, wallY, W, H - wallY);
      ([W * .16, W * .84]).forEach(tx => {
        rect(tx - W * .07, wallY - towerH, W * .14, towerH + H * .1);
        // 尖り屋根
        poly([tx - W * .085,wallY - towerH],[tx + W * .085,wallY - towerH],[tx,wallY - towerH - H * .14]);
        // 旗(なびく)
        SS('#3a2b42'); lnW(2); c.beginPath(); c.moveTo(tx, wallY - towerH - H * .14); c.lineTo(tx, wallY - towerH - H * .2); c.stroke(); FS('#c0303f'); const fw = Math.sin(t * 3 + tx) * W * .008; poly([tx,wallY - towerH - H * .2],[tx + W * .045 + fw,wallY - towerH - H * .185],[tx,wallY - towerH - H * .17]); FS('#3a2b42');
      });
      // 窓の灯り
      c.fillStyle = 'rgba(255,210,120,0.85)';
      times(14, i => {
        const wx = W * (.1 + rng() * .8), wy = wallY + H * (.03 + rng() * .28); rect(wx, wy, W * .008, H * .018);
      });
      // 門アーチ
      c.fillStyle = 'rgba(20,12,26,0.8)'; c.beginPath(); c.arc(W * .5, H * .98, W * .06, Math.PI, 0); c.fill();
    } else if (pr === 'cave') {
      // 洞窟: 暗い岩壁 + 天井の鍾乳石 + 差し込む光 + 水面の輝き
      sky([[0,'#0c0f16'],[.7,'#1a2030'],[1,'#0a0d14']]);
      // 光の柱(斜めに差し込む)
      const lg = c.createLinearGradient(W * .3, 0, W * .55, H); lg.addColorStop(0, 'rgba(200,225,255,0.22)'); lg.addColorStop(1, 'rgba(200,225,255,0)'); FS(lg); c.beginPath(); c.moveTo(W * .32, 0); c.moveTo(W * .32, 0); c.lineTo(W * .48, 0); c.moveTo(W * .32, 0); c.lineTo(W * .48, 0); c.lineTo(W * .68, H); c.moveTo(W * .32, 0); c.lineTo(W * .48, 0); c.lineTo(W * .68, H); c.lineTo(W * .4, H); c.closePath(); c.closePath(); c.fill();
      // 鍾乳石(天井から下がる三角)
      const rng = L.mulberry32(77); FS('#2a3242');
      times(12, i => {
        const sx = rng() * W, sw = W * (.015 + rng() * .025), sh = H * (.06 + rng() * .14); c.beginPath(); c.moveTo(sx - sw, 0); c.moveTo(sx - sw, 0); c.lineTo(sx + sw, 0); c.moveTo(sx - sw, 0); c.lineTo(sx + sw, 0); c.lineTo(sx + (rng() - .5) * sw, sh); c.closePath(); c.closePath(); c.fill();
      });
      // 石筍(床から)
      FS('#232a38');
      times(8, i => {
        const sx = rng() * W, sw = W * (.02 + rng() * .03), sh = H * (.05 + rng() * .1); c.beginPath(); c.moveTo(sx - sw, H); c.moveTo(sx - sw, H); c.lineTo(sx + sw, H); c.moveTo(sx - sw, H); c.lineTo(sx + sw, H); c.lineTo(sx + (rng() - .5) * sw, H - sh); c.closePath(); c.closePath(); c.fill();
      });
      // 底の水面の輝き
      c.fillStyle = 'rgba(120,170,220,0.15)'; ell(.5,.97,W * .45,H * .05); SS('rgba(160,200,240,0.3)'); lnW(1);
      times(8, i => {
        const wy = H * (.9 + rng() * .08); const wx = rng() * W * .8, wl = W * (.05 + rng() * .1); c.beginPath(); c.moveTo(wx + Math.sin(t + i) * 6, wy); c.moveTo(wx + Math.sin(t + i) * 6, wy); c.lineTo(wx + wl + Math.sin(t + i) * 6, wy); c.stroke();
      });
    } else if (pr === 'fireworks') {
      // 花火: 夜空 + 時間で打ち上がる放射状の花火 + 都市の明かり
      sky([[0,'#06091c'],[.75,'#101a3a'],[1,'#1c1430']]);
      // 都市の灯り(地平線近くの点)
      const rng = L.mulberry32(41); FS('rgba(255,210,140,0.5)');
      times(40, i => {
        rect(rng() * W, H * (.9 + rng() * .08), 2, 2);
      });
      // 花火: 3発を時間オフセットでループ(上昇→放射→減衰)
      times(3, j => {
        const cyc = ((t * .3 + j * .37) % 1); const fx = W * (.2 + .3 * j) + Math.sin(j * 7) * W * .06; const fyy = H * (.22 + .12 * j); const hue = [330, 45, 200][j];
        if (cyc < .3) {
          // 上昇中の弾
          const ry = H * .9 - cyc / .3 * (H * .9 - fyy);
          FS(`hsla(${hue},90%,70%,.9)`);
          c.beginPath(); c.arc(fx, ry, 2.5, 0, 7); c.fill();
        } else {
          const boom = (cyc - .3) / .7; const rr = boom * H * .16; const a = Math.max(0, (1 - boom) * .9); const rng2 = L.mulberry32(100 + j); // 0→1 膨張&減衰
          c.fillStyle = `hsla(${hue},90%,${65 + boom * 15}%,${a})`;
          times(26, k => {
            const ang = k * .2418 + rng2() * .15; const d = rr * (.6 + .4 * rng2()); dotP(fx + Math.cos(ang) * d, fyy + Math.sin(ang) * d + boom * boom * H * .05, 1.6 + (1 - boom) * 1.4);
          });
        }
      });
    } else if (pr === 'cloudsea') {
      // 雲海: 暁の空 + 雲の海 + 突き出る峰々 + 朝日
      sky([[0,'#ffb37a'],[.45,'#ffd0a8'],[.6,'#e8f0f8'],[1,'#c8d8e8']]); FS('rgba(255,235,200,0.9)'); dot(.68,.3,H * .06);
      // 峰々(雲から突き出る)
      const rng = L.mulberry32(17); FS('#5a6a80');
      times(5, i => {
        const px2 = W * (.1 + .2 * i) + (rng() - .5) * W * .08; const ph2 = H * (.1 + rng() * .12); c.beginPath(); c.moveTo(px2 - W * .09, H * .62); c.moveTo(px2 - W * .09, H * .62); c.lineTo(px2, H * .62 - ph2); c.moveTo(px2 - W * .09, H * .62); c.lineTo(px2, H * .62 - ph2); c.lineTo(px2 + W * .09, H * .62); c.closePath(); c.closePath(); c.fill();
      });
      // 雲の海(横長の重なる白楕円+ゆっくり流れる)
      times(30, i => {
        const cx2 = ((rng() + t * .012) % 1) * W * 1.2 - W * .1; const cy2 = H * (.6 + rng() * .35); const cr = H * (.04 + rng() * .07);
        FS(`rgba(255,255,255,${.5 + .4 * rng()})`);
        ellP(cx2, cy2, cr * 1.9, cr);
      });
    } else if (pr === 'lake') {
      // 湖畔: 空 + 山並み + 湖面の反射 + さざ波
      sky([[0,'#a8d8f0'],[.45,'#d8ecf6'],[.5,'#7fa8c8'],[1,'#3a6080']]); const hr2 = H * .5; // 水面ライン
      // 山
      for (const [base, amp, col, sd] of [[.5, .16, '#5a7a90', 33], [.5, .11, '#4a6a80', 44]]) {
        const rng = L.mulberry32(sd); FS(col); c.beginPath(); c.moveTo(0, H * base);
        for (let i = 1; i <= 10; i++) c.lineTo(i * W / 10, H * (base - amp * rng()));
        c.lineTo(W, H * base); c.closePath(); c.fill();
        // 反射(上下反転して薄く)
        c.globalAlpha = .35; c.save(); c.translate(0, hr2 * 2); c.scale(1, -1); const rng2 = L.mulberry32(sd); c.beginPath(); c.moveTo(0, H * base);
        for (let i = 1; i <= 10; i++) c.lineTo(i * W / 10, H * (base - amp * rng2()));
        c.lineTo(W, H * base); c.closePath(); c.fill(); c.restore(); c.globalAlpha = 1;
      }
      // さざ波(ゆれる水平線)
      SS('rgba(255,255,255,0.35)'); lnW(1.2); scat(55, 12, (rng3, i) => {
        const wy = hr2 + H * (.05 + rng3() * .4); const wx = rng3() * W * .8; const wl = W * (.06 + rng3() * .14); c.beginPath(); c.moveTo(wx + Math.sin(t * 1.2 + i) * 8, wy); c.lineTo(wx + wl + Math.sin(t * 1.2 + i) * 8, wy); c.stroke();
      });
    } else if (pr === 'shrine') {
      // 神社: 夕暮れ空 + 大きな鳥居シルエット + 灯籠の灯り + 遠山
      sky([[0,'#2b2150'],[.5,'#8a3a5c'],[.75,'#e0703f'],[1,'#3a2030']]);
      // 遠山
      c.fillStyle = 'rgba(40,25,45,0.7)'; c.beginPath(); poly([0,H * .78],[W * .18,H * .58],[W * .18,H * .58],[W * .4,H * .74],[W * .18,H * .58],[W * .4,H * .74],[W * .62,H * .6],[W * .18,H * .58],[W * .4,H * .74],[W * .62,H * .6],[W * .85,H * .76],[W * .18,H * .58],[W * .4,H * .74],[W * .62,H * .6],[W * .85,H * .76],[W,H * .68],[W,H],[W,H],[0,H],[W,H],[0,H],[W,H],[0,H]);
      // 鳥居(朱色シルエット)
      const tx = W * .5, ty = H * .34, tw = W * .34, th2 = H * .6, pw = W * .022; FS('#c53d2e');
      // 柱2本
      rect(tx - tw * .4, ty + H * .05, pw, th2); rect(tx + tw * .4 - pw, ty + H * .05, pw, th2);
      // 貫(下の横梁)
      rect(tx - tw * .38, ty + H * .16, tw * .76, H * .035);
      // 笠木+島木(上の反った横梁): 両端を持ち上げた帯
      poly([tx - tw * .52,ty + H * .02],[tx,ty - H * .05,tx + tw * .52,ty + H * .02],[tx + tw * .52,ty + H * .07],[tx,ty,tx - tw * .52,ty + H * .07]); rect(tx - pw / 2, ty - H * .01, pw, H * .18); // 額束(中央柱)
      // 灯籠の灯り
      const rng = L.mulberry32(99); FS('rgba(255,190,110,0.85)');
      times(8, i => {
        const lx = (rng() < .5 ? -1 : 1) * (W * .18 + rng() * W * .22) + W * .5; const ly = H * (.72 + rng() * .18); dotP(lx, ly, 3 + rng() * 3);
      });
    } else if (pr === 'snowfield') {
      // 雪原: 曇り空 + 白い起伏 + 遠景の針葉樹 + 降る雪
      sky([[0,'#aebfcb'],[.5,'#d5e0e8'],[.51,'#eef4f8'],[1,'#d8e6ee']]);
      // 雪の起伏
      c.fillStyle = '#f4f9fc'; c.beginPath(); poly([0,H],[W * .3,H * .55,W * .6,H * .66],[W * .85,H * .74,W,H * .64],[W * .85,H * .74,W,H * .64],[W,H],[W * .85,H * .74,W,H * .64],[W,H],[W * .85,H * .74,W,H * .64],[W,H]);
      // 遠景の木
      const rng = L.mulberry32(48); FS('rgba(70,95,90,0.5)');
      times(7, i => {
        const tx = rng() * W, th = H * (.06 + rng() * .05), ty = H * (.52 + rng() * .04);
        times(3, k => {
          poly([tx - th * (.7 - k * .2),ty - k * th * .3],[tx + th * (.7 - k * .2),ty - k * th * .3],[tx,ty - k * th * .3 - th * .45]);
        });
      });
      // 降る雪
      c.fillStyle = 'rgba(255,255,255,0.9)';
      times(40, i => {
        const sx = (rng() + t * .03 * (0.5 + rng())) % 1 * W; const sy = (rng() + t * .08 * (0.6 + rng() * .8)) % 1 * H; dotP(sx, sy, 1 + rng() * 2);
      });
    } else if (pr === 'meadow') {
      // 草原: 青空 + なだらかな緑の丘2層 + 草花 + 飛ぶ蝶
      sky([[0,'#8fd0ff'],[.55,'#cdeffa'],[.56,'#79c26a'],[1,'#4e9a44']]);
      // 丘
      c.fillStyle = 'rgba(110,180,90,0.85)'; c.beginPath(); poly([0,H],[W * .3,H * .5,W * .65,H * .62],[W * .85,H * .68,W,H * .6],[W * .85,H * .68,W,H * .6],[W,H],[W * .85,H * .68,W,H * .6],[W,H],[W * .85,H * .68,W,H * .6],[W,H]); FS('rgba(85,160,70,0.9)'); c.beginPath(); poly([0,H],[W * .6,H * .55,W,H * .78],[W * .6,H * .55,W,H * .78],[W,H],[W * .6,H * .55,W,H * .78],[W,H],[W * .6,H * .55,W,H * .78],[W,H]);
      // 花
      const rng = L.mulberry32(75); const fcols = ['#ff8fb3', '#fff3b0', '#ffffff', '#ffd166'];
      times(26, i => {
        const fx = rng() * W, fy = H * (.62 + rng() * .34); FS(fcols[Math.floor(rng() * fcols.length)]);
        times(4, k => {
          dotP(fx + Math.cos(k * 1.57) * 4, fy + Math.sin(k * 1.57) * 4, 3.5);
        });
      });
      // 蝶
      const bt = t * 2;
      for (const [bx0, by0, ph] of [[.25, .35, 0], [.7, .42, 2]]) {
        const bx = W * (bx0 + .06 * Math.sin(bt + ph)), by = H * (by0 + .04 * Math.sin(bt * 1.7 + ph)); FS('rgba(255,255,255,0.85)');
        ([-1, 1]).forEach(s => {
          ellP(bx + s * 6, by, 5 * (0.6 + .4 * Math.abs(Math.sin(bt * 3 + ph))), 8, s * .3);
        });
      }
    } else if (pr === 'volcano') {
      // 火山: 暗い空 + 噴火する山 + 火の粉 + 溶岩の帯
      sky([[0,'#1a0f14'],[.6,'#3a1620'],[1,'#12080b']]); const mx = W * .5, mtop = H * .32, mbot = H;
      // 山体(左右に広がる三角)
      FS('#241317'); c.beginPath(); c.moveTo(mx - W * .45, mbot); c.moveTo(mx - W * .45, mbot); c.lineTo(mx - W * .08, mtop); c.moveTo(mx - W * .45, mbot); c.lineTo(mx - W * .08, mtop); c.lineTo(mx + W * .08, mtop); c.moveTo(mx - W * .45, mbot); c.lineTo(mx - W * .08, mtop); c.lineTo(mx + W * .08, mtop); c.lineTo(mx + W * .45, mbot); c.closePath(); c.closePath(); c.fill();
      // 火口の輝き + 溶岩筋
      c.fillStyle = 'rgba(255,90,40,0.9)'; ellP(mx, mtop + H * .02, W * .08, H * .025); SS('rgba(255,120,50,0.75)'); lnW(H * .02); c.lineCap = 'round'; const rng = L.mulberry32(84);
      ([-1, 1]).forEach(s => {
        c.beginPath(); c.beginPath(); c.moveTo(mx + s * W * .05, mtop + H * .03); c.quadraticCurveTo(mx + s * W * .14, mtop + H * .3, mx + s * W * .22, mbot); c.stroke();
      });
      // 火の粉
      c.fillStyle = 'rgba(255,150,70,0.8)';
      times(22, i => {
        const fx = mx + (rng() - .5) * W * .5; const fy = mtop - ((rng() + t * .15) % 1) * H * .5; const fr = 1 + rng() * 3; dotP(fx, fy, fr);
      });
      // 噴煙
      c.fillStyle = 'rgba(60,45,50,0.5)';
      times(6, i => {
        const sx = mx + Math.sin(t * .6 + i) * W * .05 + (i - 3) * W * .02; const sy = mtop - H * (.08 + i * .07); dotP(sx, sy, H * (.05 + i * .015));
      });
    } else if (pr === 'rainbow') {
      // 虹: 淡い空 + 同心円弧の7色虹 + 両端の雲
      sky([[0,'#bfe3ff'],[1,'#eaf6ff']]); const rcx = W * .5, rcy = H * .95, rmax = H * .78; const cols = ['#ff5a5a', '#ff9f43', '#ffd43b', '#69db7c', '#4dabf7', '#748ffc', '#b197fc'];
      times(7, i => {
        SS(cols[i]); lnW(rmax / 7); c.globalAlpha = .65; c.beginPath(); c.arc(rcx, rcy, rmax - i * rmax / 7 - rmax / 14, Math.PI, Math.PI * 2); c.stroke();
      });
      c.globalAlpha = 1;
      // 雲(虹の両端)
      const rng = L.mulberry32(63); FS('rgba(255,255,255,0.9)');
      ([rcx - rmax * .8, rcx + rmax * .8]).forEach(cx => {
        times(5, k => {
          dotP(cx + (rng() - .5) * W * .14, rcy - rng() * H * .06, 14 + rng() * 16);
        });
      });
    } else if (pr === 'mtn') {
      // 山並み: 朝焼けの空 + 稜線シルエット2枚 + 朝日
      sky([[0,'#ffb37a'],[.4,'#ffd9b0'],[.7,'#aebfd0']]); FS('rgba(255,235,200,0.9)'); dot(.6,.38,H * .07);
      // 稜線: ジグザグの稜線を遠近2層で
      for (const [base, amp, col, seed2] of [[.55, .12, '#7d8ba0', 11], [.72, .16, '#4a5a70', 22]]) {
        const rng = L.mulberry32(seed2); FS(col); c.beginPath(); c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * base);
        for (let i = 1; i <= 12; i++) {
          c.lineTo(i * W / 12, H * (base - amp * rng()));
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
    } else if (pr === 'space') {
      // 宇宙: 漆黒 + 星々 + リング付き惑星(土星風)
      sky([[0,'#03040c'],[1,'#0d1230']]); scat(414, 130, (rng, i) => {
        const tw = .4 + .6 * Math.abs(Math.sin(t * .8 + i * 2.3));
        FS(`rgba(255,255,255,${.2 + .6 * tw * rng()})`);
        rect(rng() * W, rng() * H, 1.4, 1.4);
      });
      // 惑星: 帯グラデーションの球体 + 傾いたリング
      const px2 = W * .72, py2 = H * .4, pr2 = H * .2; const pg = c.createLinearGradient(px2 - pr2, py2 - pr2, px2 + pr2, py2 + pr2); pg.addColorStop(0, '#e8c98a'); pg.addColorStop(.5, '#b98d4f'); pg.addColorStop(1, '#6e4f2a'); FS(pg); dotP(px2, py2, pr2); SS('rgba(230,210,170,0.55)'); lnW(H * .02); ellPS(px2, py2 + pr2 * .1, pr2 * 1.8, pr2 * .45, -.18);
    } else if (pr === 'sea') {
      // 海中: 深い青 + 差し込む光の柱 + 昇る泡(決定論的)
      sky([[0,'#0a4d7a'],[.6,'#0b3a63'],[1,'#061f38']]);
      // 光の柱(斜めの柔らかい帯)
      times(5, i => {
        const lx = W * (.15 + i * .18); const g2 = c.createLinearGradient(lx, 0, lx + W * .12, H); g2.addColorStop(0, 'rgba(180,230,255,0.18)'); g2.addColorStop(1, 'rgba(180,230,255,0)'); FS(g2); c.beginPath(); c.moveTo(lx, 0); c.moveTo(lx, 0); c.lineTo(lx + W * .05, 0); c.lineTo(lx + W * .05 + W * .14, H); c.lineTo(lx + W * .05 + W * .14, H); c.lineTo(lx + W * .14, H); c.closePath(); c.closePath(); c.fill();
      });
      // 昇る泡
      scat(202, 22, (rng, i) => {
        const bx = rng() * W, r2 = 1.5 + rng() * 4; const by = (1 - ((rng() + t * (.03 + .03 * rng())) % 1)) * H; SS('rgba(200,235,255,0.5)'); lnW(1); dotPS(bx + Math.sin(t + i) * 4, by, r2);
      });
    } else if (pr === 'desert') {
      // 砂漠: 空+大きな太陽+うねる砂丘(決定論的)
      sky([[0,'#ffd9a0'],[.45,'#ffedcf'],[.46,'#e8b968'],[1,'#c98f3d']]); FS('rgba(255,240,200,0.95)'); dot(.5,.3,H * .11);
      // 砂丘: 正弦カーブの砂稜を2枚重ねる
      for (const [base, amp, col] of [[.6, .07, '#d9a44f'], [.75, .09, '#b57f30']]) {
        FS(col); c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 40) {
          c.lineTo(x, H * (base + amp * Math.sin(x / W * 4.4 + base * 9)));
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
    } else if (pr === 'aurora') {
      // オーロラ: 夜空 + ゆらめく光のカーテン + 星
      sky([[0,'#050a18'],[1,'#101c30']]); scat(777, 60, (rng, i) => {
        const tw = .3 + .7 * Math.abs(Math.sin(t * .7 + i * 1.9));
        FS(`rgba(255,255,255,${.2 + .55 * tw * rng()})`);
        rect(rng() * W, rng() * H * .7, 1.3, 1.3);
      });
      // 光のカーテン: 縦波の半透明帯を色違いで重ねる
      for (const [hue, ph0, amp] of [[140, 0, .5], [190, 2.1, .34], [280, 4.2, .22]]) {
        FS(`hsla(${hue},85%,60%,${amp * .4})`);
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 32) {
          const y = H * (.28 + .12 * Math.sin(x / W * 5 + ph0 + t * .6) + .06 * Math.sin(x / W * 11 - t * .9 + ph0)); c.lineTo(x, y);
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      }
    } else if (pr === 'forest') {
      // 森: 深い緑の空 + 木漏れ日 + 針葉樹シルエット(決定論的)
      sky([[0,'#12351f'],[.6,'#1d4d2a'],[1,'#0e2413']]);
      // 木漏れ日(柔らかい光斑)
      const rng = L.mulberry32(313);
      times(10, i => {
        FS(`rgba(230,255,190,${.05 + .08 * rng()})`);
        dotP(rng() * W, rng() * H * .5, 10 + rng() * 26);
      });
      // 前景の針葉樹(2段三角)
      for (let i = 0; i < 9; i++) {
        const tx = rng() * W, th = H * (.3 + rng() * .28), tw = th * .42, ty = H;
        FS(`rgba(8,26,12,${.75 + .25 * rng()})`);
        for (const [sy, sw] of [[1, 1], [.62, .72], [.3, .45]]) {
          poly([tx,ty - th * sy - th * .3],[tx - tw * sw,ty - th * sy + th * .34],[tx + tw * sw,ty - th * sy + th * .34]);
        }
      }
    } else if (pr === 'beach') {
      // 海辺: 空+太陽+海面+砂浜 + 揺れる波線(決定論的)
      sky([[0,'#8ecfff'],[.5,'#c9e9ff'],[.51,'#2b7fc9'],[.78,'#1d63a8'],[.79,'#e8d5a0'],[1,'#d9c289']]);
      // 太陽
      c.fillStyle = 'rgba(255,245,200,0.95)'; dot(.78,.18,H * .09);
      // 波の輝き線(ゆっくり流れる)
      SS('rgba(255,255,255,0.45)'); lnW(1.4); scat(909, 14, (rng, i) => {
        const wy = H * (.54 + rng() * .22), wl = W * (.06 + rng() * .18); const wx = ((rng() + t * .02) % 1) * W; c.globalAlpha = .3 + .4 * rng(); c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + wl, wy); c.stroke();
      });
      c.globalAlpha = 1;
    } else if (pr === 'grid') {
      // サイバー格子: シンセウェイブ風 — 暗い空 + 消失点に収束する発光格子
      sky([[0,'#0c0820'],[.6,'#241040'],[1,'#451a55']]); const horizon = H * .55; SS('rgba(255,110,200,0.5)'); lnW(1.2);
      // 縦線: 地平線の点から下方へ広がる
      for (let i = -10; i <= 10; i++) {
        c.beginPath(); c.moveTo(W / 2 + i * W * .06, horizon); c.lineTo(W / 2 + i * W * .3, H); c.stroke();
      }
      // 横線: スクロールする透視線
      times(9, k => {
        const f = ((k / 9 + t * .12) % 1); const y = horizon + f * f * (H - horizon); c.globalAlpha = .25 + .55 * f; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      });
      c.globalAlpha = 1;
      // 地平線の輝き
      const hg = c.createLinearGradient(0, horizon - 14, 0, horizon + 14); hg.addColorStop(0, 'rgba(255,110,200,0)'); hg.addColorStop(.5, 'rgba(255,150,220,0.55)'); hg.addColorStop(1, 'rgba(255,110,200,0)'); FS(hg); rect(0, horizon - 14, W, 28);
    } else if (pr === 'city') {
      // 夜景ビル群: 薄明りの空 + ビルシルエット + 灯りのついた窓(決定論的)
      sky([[0,'#141a30'],[1,'#3a3050']]); const rng = L.mulberry32(555); const n = 8;
      for (let i = 0; i < n; i++) {
        const bw = W / n * (.7 + rng() * .5), bh = H * (.3 + rng() * .35); const bx = i * W / n + rng() * W * .02, by = H - bh; FS('#10131f'); rect(bx, by, bw, bh + 2);
        for (let wy = by + H * .02; wy < H * .92; wy += H * .035) {
          for (let wx = bx + bw * .12; wx < bx + bw * .85; wx += bw * .18) {
            if (rng() < .35) {
              FS(`rgba(255,220,140,${.3 + .5 * rng()})`);
              rect(wx, wy, 2, 3);
            }
          }
        }
      }
    } else defaultBackdrop(c);
    c.filter = 'none';
    if (p.bgDim > 0) { c.fillStyle = `rgba(8,10,16,${p.bgDim * .55})`; c.fillRect(0, 0, W, H); }
  }

  // ---------- silhouettes for cast shadows ----------
  const shCv = document.createElement('canvas'), shCtx = shCv.getContext('2d'); const modCv = document.createElement('canvas'), mctx = modCv.getContext('2d'); const rimCv = document.createElement('canvas'), rimCtx = rimCv.getContext('2d'); const outCv = document.createElement('canvas'), outCtx = outCv.getContext('2d'); const pixCv = document.createElement('canvas'), pctx = pixCv.getContext('2d'); const glowCv = document.createElement('canvas'), glowCtx = glowCv.getContext('2d');
  // cacheable=true で (src,サイズ,色) 不変なら再描画をスキップ — 静止画の3回シルエット生成を1回に
  function silhouetteOf(src, w, h, color, cv, cctx, cacheable) {
    cv = cv || shCv; cctx = cctx || shCtx; const col = color || '#0a0a0e';
    if (cacheable && cv._src === src && cv._srcv === (src._v || null) && cv._col === col && cv.width === w && cv.height === h) return cv;
    cv._src = cacheable ? src : null; cv._srcv = cacheable ? (src._v || null) : null; cv._col = cacheable ? col : null;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cctx.clearRect(0, 0, w, h); cctx.globalCompositeOperation = 'source-over'; cctx.drawImage(src, 0, 0, w, h);
    cctx.globalCompositeOperation = 'source-in';
    cctx.fillStyle = color || '#0a0a0e'; cctx.fillRect(0, 0, w, h); cctx.globalCompositeOperation = 'source-over';
    return cv;
  }

  // ---------- chroma-keyed media ----------
  const keyCv = document.createElement('canvas'), kctx = keyCv.getContext('2d', { willReadFrequently: true });
  function keyedMediaCanvas() {
    const el = state.media.el; const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih || el.readyState < 2) return null;
    const cacheKey = `${iw}x${ih}|${state.params.keyThresh}|${state.params.keySoft}|${state.params.despill}`;
    if (state.media.kind === 'image' && state.keyParams === cacheKey) return keyCv;
    const scale = Math.min(1, 960 / iw); const kw = Math.round(iw * scale), kh = Math.round(ih * scale);
    if (keyCv.width !== kw || keyCv.height !== kh) { keyCv.width = kw; keyCv.height = kh; }
    kctx.drawImage(el, 0, 0, kw, kh);
    if (state.params.keyThresh > 0) {
      const im = kctx.getImageData(0, 0, kw, kh), d = im.data;
      for (let i = 0; i < d.length; i += 4)
        d[i + 3] = Math.min(d[i + 3], L.keyAlpha(d[i], d[i + 1], d[i + 2], state.params.keyThresh, state.params.keySoft));
      L.erodeAlpha(d, kw, kh); L.despill(d, state.params.despill); kctx.putImageData(im, 0, 0); // 白フリンジ残りを1px削る // エッジの白混じり彩度を落とす
    }
    keyCv._v = cacheKey; // silhouetteOfキャッシュの内容版
    if (state.media.kind === 'image') state.keyParams = cacheKey;
    return keyCv;
  }
  const shnCv = document.createElement('canvas'), snc = shnCv.getContext('2d');
  function drawMedia(c, t) {
    const el = state.media.el; const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih) return;
    const src = state.params.keyThresh > 0 ? keyedMediaCanvas() : el;
    if (!src) return;
    const sw = src.width || iw, sh = src.height || ih; const hPix = H * (0.25 + 0.7 * state.params.scale); const wPix = hPix * (sw / sh); const cx = state.params.x * W, baseY = state.params.y * H;
    L.contactShadow(c, cx, baseY, wPix * .55, state.params.shadow * .5, `hsla(${Math.round(state.params.shadowHue * 360)},45%,12%,${state.params.shadow * .5})`);
    const silCache = state.media.kind === 'image';
    const glowCol = `hsla(${Math.round(state.params.glowHue * 360)},90%,70%,1)`;
    L.drawGlow(c, silhouetteOf(src, sw, sh, glowCol, glowCv, glowCtx, silCache), wPix, hPix, cx, baseY, state.params.glow);
    L.drawCastShadow(c, silhouetteOf(src, sw, sh, `hsla(${Math.round(state.params.shadowHue * 360)},45%,12%,1)`, null, null, silCache), wPix, hPix, cx, baseY, state.params.castDir, state.params.shadow * .4, state.params.shadowSoft);
    L.drawRimLight(c, silhouetteOf(src, sw, sh, `hsla(${Math.round(state.params.rimHue * 360)},75%,72%,1)`, rimCv, rimCtx, silCache), wPix, hPix, cx, baseY, state.params.castDir, state.params.rim);
    L.drawStickerOutline(c, silhouetteOf(src, sw, sh, `hsla(${Math.round(state.params.outlineHue * 360)},70%,80%,1)`, outCv, outCtx, silCache), wPix, hPix, cx, baseY, state.params.outline);
    L.drawReflection(c, src, cx, baseY, wPix, hPix, state.params.reflect);
    if (state.media.kind === 'video') el.playbackRate = .25 + state.params.vidSpeed * 1.5;
    c.save(); c.globalAlpha = state.params.opacity; const fParts = [];
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
      const cell = 1 + state.params.pixel * 24; const pw = Math.max(2, Math.round(wPix / cell)), ph2 = Math.max(2, Math.round(hPix / cell)); pixCv.width = pw; pixCv.height = ph2; pctx.imageSmoothingEnabled = true; pctx.clearRect(0, 0, pw, ph2); pctx.drawImage(src, 0, 0, pw, ph2); c.imageSmoothingEnabled = false; drawSrc = pixCv;
    }
    c.drawImage(state.params.shine > .02 ? L.shined(drawSrc, snc, shnCv, t, state.params.shine) : drawSrc, cx - wPix / 2, baseY - hPix, wPix, hPix); c.restore();
  }

  // ---------- film grain ----------
  let _grainCv = null;
  function grainCv() {
    if (_grainCv) return _grainCv;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), im = x.createImageData(128, 128), d = im.data; const rng = L.mulberry32(12345);
    for (let i = 0; i < d.length; i += 4) {
      const v = 110 + rng() * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return _grainCv = cv;
  }

  // ---------- render loop ----------
  const t0 = performance.now();
  function frame() {
    const liveT = (performance.now() - t0) / 1000; const p = state.params;
    // ポーズ固定中は tOffset で前後4秒のフレームをスクラブできる
    const t = state.frozenT !== null ? state.frozenT + (p.tOffset - .5) * 4 : liveT; ctx.clearRect(0, 0, W, H);
    // 手持ちカメラ: シーン全体を微小ランダム平行移動(少し拡大して端の空白を隠す)
    const shaking = p.shake > 0 || p.camZoom > .02;
    if (shaking) {
      // シーンズーム: ゆっくり呼吸するような拡縮(動画映え演出)
      const os = 1 + p.shake * .04 + Math.sin(t * .6) * p.camZoom * .22; ctx.save(); ctx.translate(W / 2 + (Math.random() - .5) * p.shake * 16, H / 2 + (Math.random() - .5) * p.shake * 16); ctx.scale(os, os); ctx.translate(-W / 2, -H / 2);
    }
    drawBackdrop(ctx, p, t);
    // モデルの傾き + 回転(spin) + つぶし・伸び(squash): 被写体を足元支点に変形(影等も一体)
    const rotA = (p.rot - .5) * .6; const spinX = p.anim === 'spin' ? Math.cos(t * 2.5) : 1; const flipY = p.anim === 'flip' ? Math.cos(t * 2.5) : 1; const sq = p.squash > .02 ? Math.sin(t * 3) * p.squash : 0; const sxx = (1 + sq * .18) * spinX, syy = (1 - sq * .22) * flipY; const xformed = Math.abs(rotA) > .001 || Math.abs(sxx - 1) > .001 || Math.abs(syy - 1) > .001; // 宙返り: 負になると上下反転=バク転
    if (state.media && xformed) {
      ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(rotA); ctx.scale(sxx, syy); ctx.translate(-p.x * W, -p.y * H);
    }
    if (state.media) drawMedia(ctx, t);
    else {
      const hPix = H * (0.25 + 0.7 * p.scale), wPix = hPix * .55;
      // 歩行アニメはステージを横断してループ(反転で歩行方向を変える)
      let cx = p.x * W;
      if (p.anim === 'walk' || p.anim === 'run' || p.anim === 'moonwalk') {
        const spd = p.anim === 'run' ? .2 : p.anim === 'moonwalk' ? .07 : .10; const ph = (t * spd * (0.5 + p.animSpeed) + .125) % 1.25;
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
        ctx.save(); L.drawMannequin(ctx, p2, t * .9 + 2.3, cx + wPix * .55 * (p.flip ? -1 : 1), baseY, hPix * (.55 + p.duo * .35)); ctx.restore();
      }
      // マネキンをオフスクリーンに描き、シルエット化して影/リムに利用
      if ((Math.abs(p.castDir - .5) >= .03 && p.shadow > 0) || p.rim > 0 || p.outline > 0 || p.reflect > 0 || p.glow > 0 || p.shine > .02) {
        modCv.width = Math.ceil(wPix); modCv.height = Math.ceil(hPix); mctx.clearRect(0, 0, modCv.width, modCv.height); L.drawMannequin(mctx, p, t, modCv.width / 2, modCv.height, modCv.height);
        L.drawGlow(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.glowHue * 360)},90%,70%,1)`, glowCv, glowCtx), wPix, hPix, cx, baseY, p.glow);
        L.drawCastShadow(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.shadowHue * 360)},45%,12%,1)`), wPix, hPix, cx, baseY, p.castDir, p.shadow * .4, p.shadowSoft);
        L.drawRimLight(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.rimHue * 360)},75%,72%,1)`, rimCv, rimCtx), wPix, hPix, cx, baseY, p.castDir, p.rim);
        L.drawStickerOutline(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${Math.round(p.outlineHue * 360)},70%,80%,1)`, outCv, outCtx), wPix, hPix, cx, baseY, p.outline);
        L.drawReflection(ctx, modCv, cx, baseY, wPix, hPix, p.reflect);
      }
      if (p.pixel > .05) {
        // ピクセル化: 手続きモデルを小さく描いてスムージングなしで拡大
        const cell = 1 + p.pixel * 24; const pw = Math.max(2, Math.round(wPix / cell)), ph2 = Math.max(2, Math.round(hPix / cell)); pixCv.width = pw; pixCv.height = ph2; pctx.clearRect(0, 0, pw, ph2); L.drawMannequin(pctx, p, t, pw / 2, ph2, ph2); ctx.save(); ctx.globalAlpha = p.opacity; ctx.imageSmoothingEnabled = false; ctx.drawImage(pixCv, cx - wPix / 2, baseY - hPix, wPix, hPix); ctx.restore();
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
            ctx.globalAlpha = p.trail * .45 * (3 - i) / 3; L.drawMannequin(ctx, p, t - i * .09, cx, baseY, hPix);
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
      ctx.globalCompositeOperation = gs[0]; ctx.fillStyle = gs[1]; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
    if (shaking) ctx.restore();
    if (p.grain > 0) {
      ctx.save(); ctx.globalAlpha = p.grain * .15;
      // オフセットをフレーム毎にずらして動くグレインに
      ctx.drawImage(grainCv(), -Math.random() * 64, -Math.random() * 64, W + 128, H + 128); ctx.restore();
    }
    if (p.title) { // サムネイル向け大見出し(上部中央・白抜き太字)
      const fs = 18 + p.titleSize * 66; ctx.save();
      ctx.font = `700 ${Math.round(fs)}px 'Hiragino Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = Math.max(2, fs * .14); ctx.strokeStyle = 'rgba(0,0,0,.78)'; ctx.lineJoin = 'round'; ctx.strokeText(p.title, W / 2, H * .12);
      ctx.fillStyle = `hsl(${Math.round(p.titleHue * 360)},75%,85%)`;
      ctx.fillText(p.title, W / 2, H * .12); ctx.restore();
    }
    L.drawVignette(ctx, W, H, p.vignette);
    if (p.frame > .02) { // 額縁: ポラロイド/ポストカード風の枠線を最前面に
      const b = 4 + p.frame * 44;
      ctx.fillStyle = `hsla(${Math.round(p.frameHue * 360)},45%,${p.frameHue < .08 ? 14 : 90}%,0.96)`;
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(0, 0, W, H); ctx.rect(b, b, W - 2 * b, H - 2 * b); ctx.fill('evenodd');
    }
    L.drawWatermark(ctx, p.watermark, W, H, p.wmOpacity, p.wmPos); requestAnimationFrame(frame);
  }

  // ---------- controls ----------
  const sDiv = $('sliders');
  for (const [key, label] of L.SLIDERS) {
    const lab = document.createElement('label'); lab.className = 'ctl'; lab.htmlFor = 'sl-' + key;
    lab.innerHTML = `${label}<output id="out-${key}"></output>`;
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = .01; inp.id = 'sl-' + key;
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
      $('sel-anim').value = state.params.anim; $('sel-acc').value = state.params.acc; $('sel-eyes').value = state.params.eyeStyle; $('sel-fx').value = state.params.subjFx; $('sel-grade').value = state.params.grade; $('sel-blend').value = state.params.blend; $('sel-bgfit').value = state.params.bgFit; $('sel-bgpreset').value = state.params.bgPreset; $('sel-particles').value = state.params.particles; $('sel-wmpos').value = state.params.wmPos; $('sel-hair').value = state.params.hair; $('sel-vidq').value = state.params.vidQ; $('sel-acc2').value = state.params.acc2; $('chk-flip').checked = state.params.flip;
      $('inp-watermark').value = state.params.watermark; $('inp-bubble').value = state.params.bubble; $('inp-title').value = state.params.title;
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
    state.frozenT = e.target.checked ? (performance.now() - t0) / 1000 : null; const v = state.media && state.media.kind === 'video' ? state.media.el : null;
    if (v) e.target.checked ? v.pause() : v.play().catch(() => {});
    const bv = state.bg && state.bg.tagName === 'VIDEO' ? state.bg : null;
    if (bv) e.target.checked ? bv.pause() : bv.play().catch(() => {});
  });

  $('btn-random').addEventListener('click', () => {
    state.params = L.randomParams(L.mulberry32((Math.random() * 4294967296) >>> 0)); syncUI();
  });
  $('btn-reset').addEventListener('click', () => { state.params = L.defaultParams(); syncUI(); });

  // ---------- file inputs ----------
  function readURL(file) { return URL.createObjectURL(file); }
  $('bg-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('video/')) {
      const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.src = readURL(f);
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
      const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.src = readURL(f);
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
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
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
      state.recorder = null; clearTimeout(state.recTimer);
      download(new Blob(chunks, { type: pick.mime }), 'shiro.' + pick.ext);
      $('btn-rec').textContent = '動画 録画開始';
    };
    state.recorder = rec; rec.start(); $('btn-rec').textContent = '録画中… クリックで停止';
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
      const d = document.createElement('div'); d.className = 'fav'; d.title = f.name; d.draggable = true;
      d.innerHTML = `<img alt=""><span></span><button class="del" title="削除">×</button>`;
      d.querySelector('img').src = f.thumb || ''; d.querySelector('span').textContent = f.name;
      d.addEventListener('click', () => { state.params = L.clampParams(f.params); syncUI(); });
      // ドラッグで並べ替え
      d.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', f.id); ev.dataTransfer.effectAllowed = 'move'; });
      d.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
      d.addEventListener('drop', ev => {
        ev.preventDefault(); const id = ev.dataTransfer.getData('text/plain');
        if (!id || id === f.id) return;
        const from = state.favs.findIndex(x => x.id === id), to = state.favs.findIndex(x => x.id === f.id);
        if (from < 0 || to < 0) return;
        const [mv] = state.favs.splice(from, 1); state.favs.splice(to, 0, mv); saveFavs(); renderFavs();
      });
      d.querySelector('span').addEventListener('dblclick', ev => {
        ev.stopPropagation(); const n = prompt('新しい名前', f.name);
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
    const c = document.createElement('canvas'); c.width = 110; c.height = 62; c.getContext('2d').drawImage(stage, 0, 0, 110, 62);
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
      state.favs = state.favs.concat(list); saveFavs(); renderFavs(); err('');
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
    dragging = true; stage.setPointerCapture(e.pointerId); const [nx, ny] = stageXY(e); state.params.x = L.clamp01(nx); state.params.y = L.clamp01(ny); syncUI();
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const [nx, ny] = stageXY(e); state.params.x = L.clamp01(nx); state.params.y = L.clamp01(ny); syncUI();
  });
  stage.addEventListener('pointerup', () => dragging = false);
  stage.addEventListener('wheel', e => {
    e.preventDefault(); state.params.scale = L.clamp01(state.params.scale - e.deltaY * .0008); syncUI();
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
    const [w, h] = ASPECTS[v] || ASPECTS['16:9']; stage.width = w; stage.height = h; W = w; H = h;
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
    suppressHist = true; state.params = L.clampParams(JSON.parse(s)); syncUI(); suppressHist = false; lastSnap = s; lastT = 0;
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(state.params)); applySnap(undoStack.pop());
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(state.params)); applySnap(redoStack.pop());
  }

  const SES_KEY = 'shiro.session.v1'; let dirty = false;
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
      e.preventDefault(); state.params[nud[0]] = L.clamp01(state.params[nud[0]] + nud[1] * .01 * (e.shiftKey ? 10 : 1)); syncUI(false);
    }
  });

  // ---------- init ----------
  const restored = restoreSession();
  // 過度なモーションを避ける設定ではアニメを静止化(アクセシビリティ)。復元セッションがある場合は尊重する
  if (!restored && matchMedia('(prefers-reduced-motion: reduce)').matches) state.params.anim = 'still';
  syncUI(); renderFavs(); requestAnimationFrame(frame);
})();
