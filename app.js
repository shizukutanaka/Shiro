'use strict';

const ShiroLib = (() => {
  const PI = Math.PI, MX = Math.max, MN = Math.min, SI = Math.sin, CO = Math.cos, AB = Math.abs, RD = Math.round, FL = Math.floor;

  const clamp01 = v => MN(1, MX(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }
  function strSeed(s) {
      const span = (a, b, f) => { for (let i = a; i <= b; i++) f(i) }, spt = (a, b, f) => { for (let i = a; i < b; i++) f(i) };
    let h = 2166136261;
    spt(0, s.length, i => { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) })
    return h >>> 0
  }

  const ANIMS = ['idle', 'wave', 'walk', 'dance', 'jump', 'nod', 'run', 'talk', 'bow', 'spin', 'stretch', 'sleep', 'flip', 'clap', 'peek', 'cheer', 'sad', 'sit', 'point', 'shake', 'sneeze', 'kick', 'float', 'skip', 'moonwalk', 'salute', 'balance', 'guard', 'surf', 'march', 'zombie', 'robot', 'hula', 'yoga', 'punch', 'shuffle', 'lunge', 'cossack', 'hop', 'dab', 'side', 'twist', 'swim', 'bodyroll', 'charleston', 'vogue', 'stomp', 'krump', 'waltz', 'tarantella', 'capoeira', 'belly', 'flamenco', 'samba', 'tango', 'swing', 'polka', 'foxtrot', 'chacha', 'pasodoble', 'cancan', 'mazurka', 'minuet', 'bolero', 'sirtaki', 'reel', 'hora', 'gavotte', 'czardas', 'morris', 'jig', 'bourree', 'sarabande', 'pavane', 'allemande', 'courante', 'rigaudon', 'passepied', 'hambo', 'galliard', 'saltarello', 'bransle', 'farandole', 'canarie', 'volta', 'jota', 'fandango', 'zapateado', 'korobushka', 'trepak', 'legenyes', 'kalamatianos', 'kolo', 'dabke', 'sardana', 'zeybek', 'tsamiko', 'seguidilla', 'sevillanas', 'forro', 'schuhplattler', 'halay', 'polska', 'cumbia', 'landler', 'hopak', 'kalbelia', 'bhangra', 'kathak', 'bharat', 'odissi', 'garba', 'bihu', 'lavani', 'dandiya', 'ghoomar', 'khorovod', 'lezginka', 'krakowiak', 'verbunk', 'sirba', 'hasapiko', 'oberek', 'tropanka', 'tinikling', 'gumboot', 'halling', 'haka', 'marinera', 'sagayan', 'malambo', 'caporales', 'huayno', 'cueca', 'morenada', 'diablada', 'carnavalito', 'tinku', 'zamba', 'singkil', 'kecak', 'saman', 'robam', 'indlamu', 'adumu', 'eskista', 'gnawa', 'piring', 'pangalay', 'kartuli', 'lazgi', 'springar', 'ganggang', 'biyelgee', 'saidi', 'horon', 'jarabe', 'frevo', 'siva', 'gorshey', 'seannos', 'salegy', 'otea', 'meke', 'singsing', 'lakalaka', 'toka', 'vira', 'yarkhushta', 'yalli', 'ardha', 'stambeli', 'ondunda', 'lamvong', 'still'];
  const VIDQS = ['low', 'std', 'high']; const FITS = ['cover', 'contain'];
  const ACCS = ['none', 'ribbon', 'hat', 'glasses', 'shades', 'crown', 'phones', 'cape', 'beard', 'mask', 'halo', 'flower', 'scarf', 'beret', 'tie', 'monocle', 'bunny', 'cat-ear', 'bandana', 'goggles', 'horns', 'straw', 'earmuff', 'wizard', 'cap', 'chef', 'top', 'santa', 'headband', 'antler', 'bowtie', 'viking', 'fez', 'sombrero', 'ushanka', 'laurel', 'nightcap', 'jester', 'tiara', 'flowercrown', 'bowler', 'fedora', 'newsboy', 'tricorne', 'turban', 'matador', 'plume', 'veil', 'cloche', 'boater', 'deerstalker', 'bonnet', 'mobcap', 'sunvisor', 'keffiyeh', 'porkpie', 'sailor', 'tam', 'shako', 'pickelhaube', 'bicorne', 'mortar', 'beanie', 'crown2', 'kasa', 'mantilla', 'coif', 'kippah', 'topknot', 'eboshi', 'cowboy', 'mitre', 'snood', 'phrygian', 'calot', 'biretta', 'kokoshnik', 'hennin', 'chaperon', 'kettle', 'attifet', 'barbette', 'fontange', 'coonskin', 'wimple', 'busby', 'petasos', 'souwester', 'caubeen', 'tagelmust', 'kalpak', 'doppa', 'capirote', 'capotain', 'vueltiao', 'pamela', 'kepi', 'pith', 'chullo', 'cordobes', 'bandeau', 'karakul', 'tikka', 'pagri', 'mukut', 'jhoomar', 'peacock', 'tilak', 'jaapi', 'pheta', 'sarpech', 'borla', 'venok', 'papakha', 'rogatywka', 'csikos', 'clop', 'sariki', 'pakol', 'songkok', 'blangkon', 'gibus', 'toque', 'salakot', 'barretina', 'montenegrin', 'chupalla', 'spodik', 'montera', 'akubra', 'panama', 'tiroler', 'homburg', 'dhakatopi', 'gandhi', 'tengkolok', 'udeng', 'kofia', 'apsara', 'isicholo', 'maasai', 'netela', 'burnous', 'tengkuluk', 'saputangan', 'bashlyk', 'telpek', 'sjuhatt', 'gat', 'toortsog', 'nemes', 'kavuk', 'penacho', 'cangaceiro', 'tuiga', 'zhawa', 'glengarry', 'satroka', 'taupoo', 'salusalu', 'kapkap', 'tekiteki', 'pare', 'capote', 'taraz', 'kalagayi', 'agal', 'chechia', 'ekori', 'jok'];
  const PARTICLES = ['none', 'snow', 'sparkle', 'petal', 'rain', 'leaf', 'ember', 'bubble', 'confetti', 'firefly', 'bokeh', 'notes', 'hearts', 'spark', 'wind']; const WMPOS = ['br', 'bl', 'tr', 'tl'];
  const BGS = ['gradient', 'green', 'white', 'transparent', 'sunset', 'night', 'spot', 'sky', 'city', 'pastel', 'grid', 'beach', 'forest', 'aurora', 'desert', 'sea', 'space', 'mtn', 'rainbow', 'volcano', 'meadow', 'snowfield', 'shrine', 'lake', 'cloudsea', 'fireworks', 'cave', 'castle', 'canyon', 'bamboo', 'savanna', 'oasis', 'falls', 'autumn', 'fjord', 'glacier', 'ruins', 'sakura', 'moon', 'harbor', 'terraces', 'bridge', 'wheatfield', 'pagoda', 'geyser', 'coral', 'vineyard', 'lavender', 'rainforest', 'mesa', 'alps', 'bayou', 'cliff', 'lagoon', 'prairie', 'observatory', 'storm', 'zen', 'wisteria', 'sunflowers', 'cosmos', 'orchard', 'onsen', 'moor', 'brook', 'grove', 'tide', 'pond', 'badlands', 'taiga', 'mangrove', 'delta', 'highland', 'saltflat', 'wadi', 'tundra', 'quarry', 'dune', 'cirque', 'fen', 'cove', 'glen', 'steppe', 'meseta', 'hamada', 'kelp', 'cenote', 'loch', 'karst', 'polder', 'bazaar', 'seastack', 'billabong', 'glade', 'tea', 'pampas', 'canal', 'grotto', 'cloudforest', 'iceberg', 'rapids', 'meteora', 'dojo', 'stupa', 'taj', 'ghat', 'himalaya', 'thar', 'gopuram', 'kerala', 'kaziranga', 'ghats', 'rann', 'haveli', 'izba', 'caucasus', 'tatras', 'puszta', 'carpathians', 'santorini', 'cappadocia', 'redwoods', 'slotcanyon', 'angkor', 'pantanal', 'deadvlei', 'uyuni', 'bagan', 'torres', 'lauterbrunnen', 'hallstatt', 'petra', 'machupicchu', 'dolomites', 'zhangjiajie', 'halong', 'vinicunca', 'lofoten', 'borobudur', 'socotra', 'tonlesap', 'drakensberg', 'serengeti', 'simien', 'chefchaouen', 'toraja', 'chocohills', 'svaneti', 'khiva', 'preikestolen', 'jeju', 'gobi', 'nile', 'pamukkale', 'chichen', 'lencois', 'atoll', 'potala', 'moher', 'baobab', 'moorea', 'bure', 'kokoda', 'haamonga', 'yasur', 'douro', 'ararat', 'khinalug', 'hegra', 'sidi', 'brandberg', 'luang'];
  const EYES = ['dot', 'wink', 'closed', 'heart', 'sharp', 'star', 'crying', 'dizzy', 'xx', 'cat', 'wide']; const HAIRS = ['none', 'short', 'bob', 'twin', 'long', 'ahoge', 'mohawk', 'odango', 'pony', 'mush', 'curly', 'pomp', 'braid']; const SUBJFX = ['none', 'sepia', 'mono', 'invert'];
  const SUBJFX_FILTERS = { sepia: 'sepia(.9)', mono: 'grayscale(1)', invert: 'invert(1) hue-rotate(180deg)' };
  const GRADES = ['none', 'warm', 'cool', 'noir', 'vivid']; const BLENDS = ['none', 'multiply', 'screen', 'overlay', 'soft-light', 'difference', 'hue'];
  const GRADE_STYLES = {
    warm: ['overlay', 'rgba(255,150,50,.16)'],
    cool: ['overlay', 'rgba(70,130,255,.16)'],
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
    }
  }

  function clampParams(p) {
    const d = defaultParams(), o = {};
    for (const k of NUM_KEYS) {
      const v = p ? Number(p[k]) : NaN; o[k] = clamp01(Number.isFinite(v) ? v : d[k])
    }
    o.anim = ANIMS.includes(p && p.anim) ? p.anim : d.anim; o.bgFit = FITS.includes(p && p.bgFit) ? p.bgFit : d.bgFit; o.acc = ACCS.includes(p && p.acc) ? p.acc : d.acc; o.acc2 = ACCS.includes(p && p.acc2) ? p.acc2 : d.acc2; o.bgPreset = BGS.includes(p && p.bgPreset) ? p.bgPreset : d.bgPreset; o.watermark = String(p && p.watermark || '').slice(0, 60); o.bubble = String(p && p.bubble || '').slice(0, 24); o.title = String(p && p.title || '').slice(0, 40); o.eyeStyle = EYES.includes(p && p.eyeStyle) ? p.eyeStyle : d.eyeStyle; o.subjFx = SUBJFX.includes(p && p.subjFx) ? p.subjFx : d.subjFx;
    o.grade = GRADES.includes(p && p.grade) ? p.grade : d.grade; o.blend = BLENDS.includes(p && p.blend) ? p.blend : d.blend; o.particles = PARTICLES.includes(p && p.particles) ? p.particles : d.particles; o.wmPos = WMPOS.includes(p && p.wmPos) ? p.wmPos : d.wmPos; o.hair = HAIRS.includes(p && p.hair) ? p.hair : d.hair; o.vidQ = VIDQS.includes(p && p.vidQ) ? p.vidQ : d.vidQ; o.flip = !!(p && p.flip); const sv = p ? +p.seed : NaN; o.seed = (Number.isFinite(sv) ? AB(FL(sv)) : d.seed) >>> 0;
    return o
  }

  function randomParams(rng) {
    const p = defaultParams();
    for (const k of NUM_KEYS) p[k] = rng();
    p.anim = ANIMS[FL(rng() * ANIMS.length)]; p.acc = ACCS[FL(rng() * ACCS.length)]; p.acc2 = rng() < .7 ? 'none' : ACCS[FL(rng() * ACCS.length)]; p.eyeStyle = EYES[FL(rng() * EYES.length)]; p.hair = HAIRS[FL(rng() * HAIRS.length)]; p.hairHue = rng(); p.subjFx = rng() < .75 ? 'none' : SUBJFX[1 + FL(rng() * 3)]; p.grade = rng() < .6 ? 'none' : GRADES[1 + FL(rng() * 4)]; p.blend = rng() < .75 ? 'none' : BLENDS[1 + FL(rng() * 3)]; p.flip = rng() < .35; p.bgPreset = rng() < .7 ? 'gradient' : BGS[1 + FL(rng() * (BGS.length - 1))]; p.x = .3 + rng() * .4;
    p.y = .6 + rng() * .35; p.scale = .4 + rng() * .5; p.opacity = .6 + rng() * .4; p.keyThresh = rng() < .5 ? 0 : rng() * .6; p.bgDim = rng() * .5; p.bgBlur = rng() < .6 ? 0 : rng() * .6; p.castDir = rng(); p.rim = rng() * .7; p.eyeHue = rng(); p.clothHue = rng() < .4 ? 0 : rng(); p.outline = rng() < .5 ? 0 : rng() * .7; p.vignette = rng() < .6 ? 0 : rng() * .6; p.watermark = ''; p.wmOpacity = .4; p.vidSpeed = .5; p.blush = rng() * .6; p.headTilt = .35 + rng() * .3; p.bgSat = .3 + rng() * .7; p.bgContrast = .35 + rng() * .5; p.reflect = rng() < .6 ? 0 : rng() * .8; p.tOffset = .5; p.grain = rng() < .7 ? 0 : rng() * .5;
    p.trail = rng() < .7 ? 0 : rng() * .7; p.subjHue = .4 + rng() * .2; p.pixel = rng() < .75 ? 0 : rng() * .7; p.shake = rng() < .7 ? 0 : rng() * .5; p.glow = rng() < .7 ? 0 : rng() * .8; p.eyeSize = .3 + rng() * .5; p.duo = rng() < .7 ? 0 : rng() * .7; p.rot = .35 + rng() * .3; p.bgX = .5; p.bgY = .5; p.seed = FL(rng() * 4294967295);
    return clampParams(p)
  }

  function serializePreset(name, params) {
    return JSON.stringify({ v: 1, name: String(name || '').slice(0, 60), params: clampParams(params) })
  }
  function parsePreset(json) {
    const o = JSON.parse(json);
    if (!o || o.v !== 1 || typeof o.name !== 'string' || typeof o.params !== 'object' || !o.params)
      throw new Error('invalid preset');
    return { name: o.name.slice(0, 60), params: clampParams(o.params) }
  }
  function parseFavList(json) {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) throw new Error('invalid favorite list');
    return arr.filter(o => o && typeof o.name === 'string' && o.params)
      .map(o => ({ id: String(o.id || ''), name: o.name.slice(0, 60), params: clampParams(o.params) }))
  }

  function keyAlpha(r, g, b, thresh, soft) {
    if (thresh <= 0) return 255;
    const d = 255 - MN(r, g, b); const T = thresh * 200, S = 1 + soft * 120;
    return RD(MX(0, MN(255, (d - T) / S * 255)))
  }

  function despill(d, strength) {
    if (strength <= 0) return;
    const k = MN(1, strength * 1.4);
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      if (a === 0 || a === 255) continue;
      const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11); d[i] += (l - d[i]) * k; d[i + 1] += (l - d[i + 1]) * k; d[i + 2] += (l - d[i + 2]) * k
    }
  }

  function erodeAlpha(d, w, h) {
    const a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!a[i]) continue;
      const m = MN(
        x > 0 ? a[i - 1] : 0, x < w - 1 ? a[i + 1] : 0,
        y > 0 ? a[i - w] : 0, y < h - 1 ? a[i + w] : 0);
      d[i * 4 + 3] = MN(d[i * 4 + 3], m)
    }
  }

  function blinkOpen(t, seed) {
    const ph = t % (3.2 + ((seed || 0) % 97) / 97 * 1.4);
    if (ph >= .18) return 1;
    const s = AB(ph - .09) / .09;
    return MN(1, s * 1.4)
  }

  function drawCastShadow(c, silCanvas, wPix, hPix, cx, baseY, dir, alpha, soft) {
      const gA=v=>c.globalAlpha = v, flT=v=>c.filter = v;
    const skew = (dir - .5) * 1.6;
    if (AB(skew) < .05 || alpha <= 0) return;
    c.save();
    flT(`blur(${MX(1, wPix * (.02 + (soft == null ? .4 : soft) * .08))}px)`);
    gA(alpha); c.translate(cx, baseY); c.transform(1, 0, -skew, .32, 0, 0); c.drawImage(silCanvas, -wPix / 2, -hPix, wPix, hPix); c.restore()
  }

  function drawRimLight(c, silCanvas, wPix, hPix, cx, baseY, dir, strength) {
      const gA=v=>c.globalAlpha = v, flT=v=>c.filter = v;
    if (strength <= 0) return;
    const dx = (dir - .5) * -wPix * .08; const g = 1.06; c.save();
    flT(`blur(${MX(1, wPix * .05)}px)`);
    gA(strength * .55); c.drawImage(silCanvas, cx - wPix / 2 + dx - (wPix * g - wPix) / 2, baseY - hPix * g - hPix * .015, wPix * g, hPix * g); c.restore()
  }

  function drawStickerOutline(c, silCanvas, wPix, hPix, cx, baseY, strength) {
      const gA=v=>c.globalAlpha = v;
      const span = (a, b, f) => { for (let i = a; i <= b; i++) f(i) }, spt = (a, b, f) => { for (let i = a; i < b; i++) f(i) };
    if (strength <= 0) return;
    const r = MX(1, RD(strength * wPix * .045)); c.save(); gA(MN(1, strength * 1.5));
    spt(0, 16, i => {
      const a = i / 16 * PI * 2; const dx = CO(a) * r, dy = SI(a) * r; c.drawImage(silCanvas, cx - wPix / 2 + dx, baseY - hPix + dy, wPix, hPix); c.drawImage(silCanvas, cx - wPix / 2 + dx * .55, baseY - hPix + dy * .55, wPix, hPix)
    })
    c.restore()
  }

  function drawVignette(c, w, h, strength) {
      const FS=v=>c.fillStyle = v;
    if (strength <= 0) return;
    const g = c.createRadialGradient(w / 2, h / 2, MN(w, h) * .35, w / 2, h / 2, MX(w, h) * .78); g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength * .45})`);
    c.save(); FS(g); c.fillRect(0, 0, w, h); c.restore()
  }

  function drawWatermark(c, text, w, h, opacity, pos = 'br') {
      const fT=v=>c.font = v, tA=v=>c.textAlign = v, FS=v=>c.fillStyle = v;
    if (!text || opacity <= 0) return;
    const fs = MX(12, RD(h * .032)); c.save();
    fT(`600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`);
    tA(pos[1] === 'r' ? 'right' : 'left'); c.textBaseline = pos[0] === 't' ? 'top' : 'bottom'; c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = fs * .3; c.shadowOffsetY = 1;
    FS(`rgba(255,255,255,${opacity})`);
    c.fillText(text, pos[1] === 'r' ? w - fs * .6 : fs * .6, pos[0] === 't' ? fs * .5 : h - fs * .5); c.restore()
  }

  const MIME_CANDIDATES = [
    ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm', 'webm'],
  ];
  function pickMime(supports) {
    for (const [mime, ext] of MIME_CANDIDATES) if (supports(mime)) return { mime, ext };
    return null
  }

  function mannequinPose(p, t) {
    const s = .4 + p.animSpeed * 2.2, tt = t * s;
    const S = f => SI(tt * f), C = f => CO(tt * f), A = f => AB(S(f));
    const q = {
      bob: 0, sway: 0, lean: 0, headTilt: 0,
      lThigh: 0, rThigh: 0, lKnee: 0, rKnee: 0, lShin: 0, rShin: 0,
      lArm: .1, rArm: .1, lElb: .15, rElb: .15,
    };
    switch (p.anim) {
      case 'wave':
        Object.assign(q, {bob: .012 * S(2), lean: .04 * SI(tt), rArm: 2.5, rElb: .5 * S(6) + .3, lArm: .12, headTilt: .1 * S(2)});break;
      case 'walk': {
        const w = S(3); Object.assign(q, {lThigh: .55 * w, rThigh: -.55 * w, lKnee: MX(0, .7 * SI(tt * 3 + PI / 2)), rKnee: MX(0, .7 * SI(tt * 3 - PI / 2)), lArm: .1 - .4 * w, rArm: .1 + .4 * w, bob: .02 * AB(C(3)), sway: .01 * w});break
      }
      case 'dance': {
        const w = S(4); Object.assign(q, {sway: .05 * w, bob: .03 * AB(w), lArm: 1.2 + .9 * S(4), rArm: 1.2 - .9 * S(4), lElb: .5, rElb: .5, lean: .06 * w, headTilt: .15 * w, lThigh: .15 * w, rThigh: -.15 * w});break
      }
      case 'jump': {
        const air = SI((tt % 1) * PI); q.bob = .13 * air; q.lThigh = q.rThigh = -.1 * air; q.lKnee = q.rKnee = .9 * air; Object.assign(q, {lArm: .1 - 1.9 * air, rArm: .1 + 1.9 * air, lElb: .3, rElb: .3, lean: .03 * S(4)});
        break
      }
      case 'nod': {

        const n = S(2.4); Object.assign(q, {headTilt: .22 * n, bob: .008 * AB(n), lean: .02 * n, lArm: .1, rArm: .1});break
      }
      case 'run': {

        const w = S(5); Object.assign(q, {lThigh: .8 * w, rThigh: -.8 * w, lKnee: MX(0, 1.1 * SI(tt * 5 + PI / 2)), rKnee: MX(0, 1.1 * SI(tt * 5 - PI / 2)), lArm: .3 - .7 * w, rArm: .3 + .7 * w, lElb: 1.1, rElb: 1.1, bob: .04 * AB(C(5)), lean: .12});break
      }
      case 'talk': {

        Object.assign(q, {bob: .008 * S(2), lean: .015 * S(1.1), headTilt: .05 * S(2.7), lArm: .08, rArm: .08});break
      }
      case 'spin': {

        Object.assign(q, {bob: .02 * A(2.5), lArm: .35, rArm: .35, lElb: .2, rElb: .2});break
      }
      case 'bow': {

        const b = Math.pow(MX(0, S(1.4)), .7); Object.assign(q, {headTilt: b * .55, bob: -b * .05, lArm: .05, rArm: .05, lElb: 0, rElb: 0});break
      }
      case 'stretch': {

        const u = .5 + .5 * SI(tt * 1.6 - PI / 2); Object.assign(q, {bob: .05 * u, lArm: -(.1 + 2.5 * u), rArm: .1 + 2.5 * u, lElb: .05, rElb: .05, lean: -.05 * u, headTilt: -.12 * u});q.lKnee = q.rKnee = .06 * u;
        break
      }
      case 'sleep': {

        const cyc = (tt % 3) / 3; const d = cyc < .7 ? Math.pow(cyc / .7, 2) : MX(0, 1 - (cyc - .7) / .3); Object.assign(q, {headTilt: d * .4, bob: -d * .02, lean: d * .06, lArm: .06, rArm: .06, lElb: .1, rElb: .1});break
      }
      case 'flip': {

        const u = .5 + .5 * S(2.5); q.bob = .08 * u; q.lKnee = q.rKnee = .7 * u; q.lThigh = q.rThigh = -.15 * u; Object.assign(q, {lArm: .5, rArm: .5, lElb: .4, rElb: .4});break
      }
      case 'clap': {

        const c = S(8); Object.assign(q, {lArm: -.55 + .3 * c, rArm: .55 + .3 * c, lElb: .85, rElb: .85, bob: .015 * AB(c), headTilt: .08 * S(2)});break
      }
      case 'peek': {

        const ph = (tt % 4) / 4; const d = SI(ph * PI * 2); const e = MN(1, AB(d) * 2.4); Object.assign(q, {lean: .3 * Math.sign(d) * e, sway: .09 * d, headTilt: -.4 * Math.sign(d) * e, lArm: .14, rArm: .14});
        break
      }
      case 'cheer': {

        const j = A(4); Object.assign(q, {bob: .09 * j, lArm: -.25 - .6 * j, rArm: .25 + .6 * j, lElb: .25, rElb: .25, lThigh: -.15 * j, rThigh: -.15 * j});q.lKnee = q.rKnee = .5 * j; q.headTilt = .12 * S(2);
        break
      }
      case 'sad': {

        const sigh = MX(0, S(.9)) ** 3; Object.assign(q, {headTilt: .38 + .1 * sigh, lean: .12, bob: -.03 - .02 * sigh, lArm: .16, rArm: .16, lElb: .12, rElb: .12});
        break
      }
      case 'sit': {

        q.lThigh = q.rThigh = -1.1; q.lKnee = q.rKnee = 1.15; Object.assign(q, {lArm: -.9, rArm: .9, lElb: .7, rElb: .7, bob: -.05 + .012 * S(1.6), lean: .08 + .02 * S(1.1), headTilt: .1 * S(.8)});break
      }
      case 'point': {

        const alt = S(PI) > 0 ? 1 : -1;
        if (alt > 0) { Object.assign(q, {rArm: .95, rElb: .05, lArm: .12})}
        else { Object.assign(q, {lArm: -.95, lElb: .05, rArm: .12})}
        Object.assign(q, {lean: .06 * alt, headTilt: .1 * alt, bob: .015 * S(3)});break
      }
      case 'shake': {

        const w2 = S(7); Object.assign(q, {headTilt: .32 * w2, sway: .02 * w2, lArm: .12, rArm: .12});break
      }
      case 'sneeze': {

        const cyc = (tt % 4) / 4; const wind = cyc < .55 ? cyc / .55 : 0; const snap = cyc >= .55 && cyc < .68 ? (cyc - .55) / .13 : cyc >= .68 ? MX(0, 1 - (cyc - .68) / .32) : 0; Object.assign(q, {lean: -.06 * wind + .3 * snap, headTilt: -.12 * wind + .5 * snap, bob: -.01 * wind - .05 * snap, lArm: .12 + .15 * snap, rArm: .12 + .15 * snap});
        break
      }
      case 'kick': {

        const kk = Math.pow(A(3), 3); Object.assign(q, {rThigh: -1.3 * kk, rKnee: .3, lean: -.12 * kk, lArm: -.3 * kk, rArm: .3 * kk, headTilt: -.08 * kk});break
      }
      case 'float': {

        Object.assign(q, {bob: -.09 * S(2), sway: .03 * S(.9), lean: .05 * S(1.4), lArm: .45 + .1 * S(2), rArm: .45 - .1 * S(2), lThigh: .15, rThigh: .18, lKnee: .5, rKnee: .55});break
      }
      case 'skip': {

        const ph2 = S(6); Object.assign(q, {bob: -.04 * A(6), lThigh: -.7 * MX(0, ph2), lKnee: .9 * MX(0, ph2), rThigh: -.7 * MX(0, -ph2), rKnee: .9 * MX(0, -ph2), lArm: -.35 * ph2, rArm: .35 * ph2});break
      }
      case 'moonwalk': {

        const w = S(4); Object.assign(q, {lThigh: .3 * w, rThigh: -.3 * w, lKnee: MX(0, .35 * SI(tt * 4 + PI / 2)), rKnee: MX(0, .35 * SI(tt * 4 - PI / 2)), lean: -.08, sway: .02 * w, lArm: .25 - .3 * w, rArm: .25 + .3 * w, lElb: .8, rElb: .8, bob: .015 * AB(C(4))});break
      }
      case 'salute': {

        const ph2 = (tt % 4) / 4; const k = ph2 < .15 ? ph2 / .15 : ph2 < .75 ? 1 : MX(0, 1 - (ph2 - .75) / .25); Object.assign(q, {rArm: .1 - 1.9 * k, rElb: 2.0 * k, headTilt: -.06 * k, lean: .03 * k, lArm: .12, lThigh: .05, rThigh: -.05});break
      }
      case 'balance': {

        const wb = S(3.2); Object.assign(q, {rThigh: -1.1, rKnee: -.4, lArm: 1.35 + .12 * wb, rArm: 1.35 - .12 * wb, lElb: .1, rElb: .1, lean: .09 * wb, sway: .04 * wb, headTilt: -.08 * wb});
        break
      }
      case 'guard': {

        const st = A(5); Object.assign(q, {lArm: .95, rArm: .95, lElb: 1.8, rElb: 1.8, lean: .06, sway: .03 * S(5), lThigh: .15, rThigh: -.15, lKnee: .3, rKnee: .3, bob: .015 * st, headTilt: .04 * S(2.5)});break
      }
      case 'surf': {

        const wv = S(2.4); Object.assign(q, {lean: .18 + .08 * wv, sway: .05 * S(1.6), lThigh: .3, rThigh: -.2, lKnee: .55, rKnee: .5, lArm: 1.1 + .15 * wv, rArm: .6 - .15 * wv, lElb: .3, rElb: .4, headTilt: -.1 * wv, bob: .015 * AB(wv)});break
      }
      case 'march': {

        const ph2 = tt * 3.4; const lp = MX(0, SI(ph2)), rp = MX(0, -SI(ph2)); Object.assign(q, {lThigh: .55 * lp, rThigh: -.55 * rp, lKnee: .9 * lp, rKnee: -.9 * rp, lArm: .7 * lp, rArm: -.7 * rp, lElb: .3, rElb: -.3, bob: .02 * AB(SI(ph2)), lean: .06});break
      }
      case 'zombie': {

        const zw = S(1.8); Object.assign(q, {lean: .1 + .05 * zw, sway: .12 * zw, headTilt: .2 * zw, lArm: .9, rArm: .9, lElb: .15, rElb: .15, lThigh: .15 * MX(0, zw), rThigh: -.15 * MX(0, -zw), lKnee: .3, rKnee: -.3, bob: .01});break
      }
      case 'robot': {

        const rq = (v, s) => RD(v * s) / s;
        const ph3 = tt * 2.2; Object.assign(q, {lArm: .5 + .5 * rq(SI(ph3), 2), rArm: .5 + .5 * rq(SI(ph3 + PI / 2), 2), lElb: .8 * rq(SI(ph3 + 1), 2), rElb: .8 * rq(CO(ph3), 2), headTilt: .3 * rq(SI(ph3 * .5), 2), lean: .1 * rq(CO(ph3 * .7), 2), lKnee: .2 * MX(0, rq(SI(ph3), 2)), rKnee: -.2 * MX(0, -rq(SI(ph3), 2))});break
      }
      case 'hula': {

        const hw = tt * 2.6; Object.assign(q, {sway: .14 * SI(hw), lean: .1 * SI(hw + .5), lArm: .8 + .35 * SI(hw), rArm: .8 - .35 * SI(hw), lElb: .9, rElb: .9, headTilt: .08 * SI(hw + 1), lKnee: .15, rKnee: -.15, bob: .012 * AB(SI(hw * 2))});break
      }
      case 'yoga': {

        const br = S(1.4); Object.assign(q, {rThigh: -.9, rKnee: -.9, lArm: 1.5, rArm: 1.5, lElb: 1.4, rElb: 1.4, lean: .04 * br, sway: .05 * S(.9), bob: .02 * br, headTilt: .04 * br});break
      }
      case 'punch': {

        const ph4 = tt * 3.2; const lj = MX(0, SI(ph4)) ** 3, rj = MX(0, -SI(ph4)) ** 3; Object.assign(q, {lArm: .9 + .7 * lj, rArm: .9 + .7 * rj, lElb: 1.6 * (1 - lj), rElb: 1.6 * (1 - rj), lean: .08 + .06 * (lj - rj), headTilt: .05 * (rj - lj), bob: .01 * AB(SI(ph4))});break
      }
      case 'shuffle': {

        const ph5 = tt * 9; const ls = SI(ph5) > 0 ? 1 : 0, rs = 1 - ls; Object.assign(q, {lThigh: .5 * ls, rThigh: -.5 * rs, lKnee: .8 * ls, rKnee: -.8 * rs, lArm: .4 * rs, rArm: .4 * ls, lElb: .6, rElb: .6, lean: .08, bob: .025 * AB(SI(ph5))});break
      }
      case 'lunge': {

        const ph6 = tt * 2.2; const ld = MX(0, SI(ph6)), rd = MX(0, -SI(ph6)); Object.assign(q, {lThigh: .8 * ld, rThigh: -.8 * rd, lKnee: 1.1 * ld, rKnee: -1.1 * rd, bob: -.06 * (ld + rd), lean: .1, lArm: .3, rArm: .3, lElb: .5, rElb: .5});break
      }
      case 'cossack': {

        const ph7 = tt * 4; const lc = SI(ph7) > 0 ? 1 : 0, rc = 1 - lc; Object.assign(q, {lThigh: .7 * lc, rThigh: -.7 * rc, lKnee: .1, rKnee: -.1, lArm: .55, rArm: .55, lElb: 1.5, rElb: 1.5, bob: -.05 + .02 * SI(ph7 * 2), lean: .06});break
      }
      case 'hop': {

        const hp = A(5); Object.assign(q, {bob: .05 * hp, lKnee: .5 * hp, rKnee: -.5 * hp, lThigh: .2 * hp, rThigh: -.2 * hp, lArm: .25 * hp, rArm: .25 * hp, lElb: .4, rElb: .4, lean: .04});break
      }
      case 'dab': {

        const db = S(4) * .03; Object.assign(q, {rArm: 1.3 + db, rElb: .3, lArm: .9, lElb: 1.7, headTilt: .5 + db, lean: .12, bob: .015 * A(4)});break
      }
      case 'side': {

        const sd = S(3.2); Object.assign(q, {sway: .12 * sd, lean: .08 * sd, lThigh: MX(0, sd) * .35, rThigh: -MX(0, -sd) * .35, lKnee: MX(0, sd) * .25, rKnee: -MX(0, -sd) * .25, lArm: .4 + .2 * sd, rArm: .4 - .2 * sd, lElb: .5, rElb: .5});break
      }
      case 'twist': {

        const tw = S(6); Object.assign(q, {sway: .05 * tw, lThigh: MX(0, tw) * .3, rThigh: -MX(0, -tw) * .3, lKnee: MX(0, tw) * .35, rKnee: -MX(0, -tw) * .35, lArm: .5 - .15 * tw, rArm: .5 + .15 * tw, lElb: .8, rElb: .8, lean: .04 * tw, bob: .02 * AB(tw)});break
      }
      case 'swim': {

        const sw = tt * 3; Object.assign(q, {rArm: 1.4 + .9 * SI(sw), rElb: .4, lArm: 1.4 + .9 * SI(sw + PI), lElb: .4, lKnee: .3 * AB(SI(sw)), rKnee: -.3 * AB(SI(sw + PI)), lean: .15, bob: .03 * SI(sw), headTilt: .2});break
      }
      case 'bodyroll': {

        const br2 = tt * 2.6; Object.assign(q, {lean: .14 * SI(br2), sway: .1 * SI(br2 - .8), headTilt: .25 * SI(br2 - 1.6), lArm: .45 + .1 * SI(br2 - 1.2), rArm: .45 + .1 * SI(br2 - 1.2), lElb: .6, rElb: .6, bob: .02 * SI(br2 - .5)});break
      }
      case 'charleston': {

        const ch = S(5); Object.assign(q, {lKnee: .3 + .3 * ch, rKnee: -(.3 - .3 * ch), lThigh: .15 * ch, rThigh: -.15 * ch, lArm: .5 - .3 * ch, rArm: .5 + .3 * ch, lElb: .7, rElb: .7, lean: .06 * ch, bob: .02 * AB(ch)});break
      }
      case 'vogue': {

        const vg = FL(tt * 2.4) % 4; const ease = MN(1, (tt * 2.4 % 1) * 6); const poses = [[1.4, .3, .3, 1.5], [.3, 1.4, 1.5, .3], [1.0, 1.0, .9, .9], [.6, .6, 1.6, 1.6]]; const [ra, la, re, le] = poses[vg]; Object.assign(q, {rArm: ra * ease, lArm: la * ease, rElb: re, lElb: le, headTilt: (vg % 2 ? .2 : -.2) * ease, lean: (vg % 2 ? .05 : -.05) * ease});
        break
      }
      case 'stomp': {

        const st = tt * 3.4; const lSt = MX(0, SI(st)) ** 2; const rSt = MX(0, SI(st + PI)) ** 2; Object.assign(q, {lThigh: .5 * lSt, rThigh: -.5 * rSt, lKnee: .6 * lSt, rKnee: -.6 * rSt, bob: -.03 * (lSt + rSt), lean: .06 * SI(st), lArm: .6 - .3 * lSt, rArm: .6 - .3 * rSt, lElb: .8, rElb: .8});break
      }
      case 'krump': {

        const kp = S(7); const pop = MX(0, S(3.5)) ** 3; Object.assign(q, {bob: -.04 * pop, lean: .1 * kp, lArm: .8 + .4 * kp, rArm: .8 - .4 * kp, lElb: 1.1, rElb: 1.1, lThigh: .2 * pop, rThigh: -.2 * pop, headTilt: .15 * kp});break
      }
      case 'waltz': {

        const wz = tt * 2.1; const beat = SI(wz * 3); Object.assign(q, {bob: .03 * beat, sway: .08 * SI(wz), lean: .07 * SI(wz + .5), lArm: .7 + .15 * SI(wz), rArm: .7 - .15 * SI(wz), lElb: .5, rElb: .5, lKnee: .2 * MX(0, SI(wz * 3)), rKnee: -.2 * MX(0, SI(wz * 3 + PI)), headTilt: .1 * SI(wz)});break
      }
      case 'tarantella': {

        const ta = tt * 4.5; Object.assign(q, {lArm: 1.3 + .25 * SI(ta), rArm: 1.3 - .25 * SI(ta), lElb: .5, rElb: .5});const lp2 = MX(0, SI(ta * 1.5)), rp2 = MX(0, SI(ta * 1.5 + PI)); Object.assign(q, {lKnee: .4 * lp2, rKnee: -.4 * rp2, sway: .09 * SI(ta * .5), lean: .06 * SI(ta * .5 + 1), bob: .025 * AB(SI(ta))});break
      }
      case 'capoeira': {

        const cp = tt * 2.8; const gd = SI(cp); Object.assign(q, {sway: .16 * gd, lean: .1 * gd, bob: .05 + .02 * AB(gd), lArm: .5 + .3 * MX(0, gd), rArm: .5 + .3 * MX(0, -gd), lElb: .6, rElb: .6});
        Object.assign(q, {lThigh: .4 * MX(0, -gd), rThigh: -.4 * MX(0, gd), lKnee: .3 * MX(0, -gd), rKnee: -.3 * MX(0, gd), headTilt: -.06 * gd});break
      }
      case 'belly': {

        const bd = tt * 3.4; Object.assign(q, {sway: .1 * SI(bd), bob: .02 * AB(SI(bd * 2)), lArm: .9 + .35 * SI(bd * .8), rArm: .9 - .35 * SI(bd * .8), lElb: .4 + .3 * SI(bd * .8 + 1), rElb: .4 - .3 * SI(bd * .8 + 1), lKnee: .15 * MX(0, SI(bd)), rKnee: -.15 * MX(0, -SI(bd)), headTilt: .06 * SI(bd * .5)});break
      }
      case 'flamenco': {

        const fm = tt * 3.8; const st = MX(0, SI(fm * 2)) ** 2; Object.assign(q, {rArm: 1.45, rElb: .3, lArm: .55, lElb: 1.1, lean: -.04, rKnee: -.4 * st, lKnee: .1, bob: -.025 * st, headTilt: -.06, sway: .03 * SI(fm * .7)});break
      }
      case 'samba': {

        const sb = tt * 6; Object.assign(q, {bob: .035 * AB(SI(sb)), sway: .05 * SI(sb * .5), lArm: .6 + .5 * SI(sb * .5), rArm: .6 - .5 * SI(sb * .5), lElb: .7, rElb: .7, lKnee: .25 * MX(0, SI(sb)), rKnee: -.25 * MX(0, -SI(sb)), headTilt: .05 * SI(sb * .5)});break
      }
      case 'tango': {

        const tg = tt * 3.2; const snap = FL(tg / PI) % 2 ? 1 : -1; const ease = MN(1, (tg % PI) * 4); Object.assign(q, {headTilt: .25 * snap * ease, sway: .08 * snap, lean: .05 * snap, lArm: .5 + .2 * snap, rArm: .5 - .2 * snap, lElb: .9, rElb: .9});

        Object.assign(q, {lThigh: .3 * MX(0, snap * SI(tg * 2)), rThigh: -.3 * MX(0, -snap * SI(tg * 2)), bob: .015 * AB(SI(tg * 2))});break
      }
      case 'swing': {

        const sw = tt * 4.2; const k = SI(sw); Object.assign(q, {bob: .04 * AB(SI(sw * .5)), sway: .07 * k, lKnee: .35 * MX(0, k), rKnee: -.35 * MX(0, -k), lThigh: .2 * MX(0, k), rThigh: -.2 * MX(0, -k), lArm: .55 + .3 * k, rArm: .55 - .3 * k, lElb: .6, rElb: .6, lean: .04 * k});break
      }
      case 'polka': {

        const pk = tt * 3.6; const ph = pk % (PI * 2); const hop2 = ph > PI * 1.5 ? SI((ph - PI * 1.5) * 4) : 0; q.bob = .04 * AB(hop2) + .015 * AB(SI(pk)); const st2 = SI(pk); Object.assign(q, {lKnee: .35 * MX(0, st2), rKnee: -.35 * MX(0, -st2), sway: .08 * st2, lArm: .5 + .25 * st2, rArm: .5 - .25 * st2, lElb: .5, rElb: .5, lean: .05 * st2, headTilt: .06 * st2});break
      }
      case 'foxtrot': {

        const fx = tt * 2.4; const rise = SI(fx); Object.assign(q, {bob: .02 * rise, sway: .1 * SI(fx * .5), lean: .06 * SI(fx * .5 + .7), lArm: .65 + .1 * SI(fx * .5), rArm: .65 - .1 * SI(fx * .5), lElb: .4, rElb: .4, lThigh: .15 * MX(0, SI(fx)), rThigh: -.15 * MX(0, -SI(fx)), lKnee: .1 * MX(0, SI(fx)), rKnee: -.1 * MX(0, -SI(fx)), headTilt: .05 * SI(fx * .5)});break
      }
      case 'chacha': {

        const cc = tt * 4.4; const step = SI(cc); const trip = Math.sign(SI(cc * 1.5)) * MN(1, AB(SI(cc * 1.5)) * 3); Object.assign(q, {sway: .1 * trip, bob: .02 * AB(step), lKnee: .3 * MX(0, step), rKnee: -.3 * MX(0, -step), lArm: .55 + .35 * step, rArm: .55 - .35 * step, lElb: .6, rElb: .6, lean: .04 * trip});
        break
      }
      case 'pasodoble': {

        const pd = tt * 2.2; const stamp = MX(0, SI(pd * 2)) ** .5; Object.assign(q, {lArm: -.9 + .1 * SI(pd), rArm: .9 - .1 * SI(pd), lElb: -.4, rElb: -.4, lKnee: .3 * stamp, rKnee: -.3 * stamp, bob: .03 * stamp, lean: .08 * SI(pd), spin: .15 * SI(pd * .5), headTilt: .1 * SI(pd * .5 + 1)});
        break
      }
      case 'cancan': {

        const cn = tt * 5; const kick = MX(0, SI(cn)); Object.assign(q, {lThigh: -.1 - 1.1 * MX(0, SI(cn)), rThigh: -.1 - 1.1 * MX(0, -SI(cn)), lKnee: .4, rKnee: .4, lArm: -1.2, rArm: 1.2, lElb: -.15, rElb: -.15, bob: .04 * kick, lean: .06 * SI(cn)});
        break
      }
      case 'mazurka': {

        const mz = tt * 3; const beat = SI(mz * 3); const hop = MX(0, SI(mz)); Object.assign(q, {bob: .05 * hop, lThigh: -.15 + .25 * SI(mz * 1.5), rThigh: -.15 - .25 * SI(mz * 1.5), lKnee: .5 * MX(0, SI(mz * 1.5)), rKnee: .5 * MX(0, -SI(mz * 1.5)), lArm: -.6 - .3 * SI(mz), rArm: .6 - .3 * SI(mz), lElb: -.5, rElb: -.5, lean: .06 * beat, headTilt: .08 * beat});
        break
      }
      case 'minuet': {

        const mn = tt * 1.8; const step = SI(mn); const curtsey = MX(0, SI(mn * .5 + PI / 4)) ** 2; Object.assign(q, {bob: .015 * AB(step) - .06 * curtsey, lThigh: -.1 - .18 * MX(0, step), rThigh: -.1 - .18 * MX(0, -step), lKnee: .25 + .4 * curtsey, rKnee: .25 + .4 * curtsey, lArm: -.35 - .2 * step, rArm: .35 - .2 * step, lElb: -.65, rElb: -.65, lean: .03 * step, headTilt: .06 * SI(mn * .5)});
        break
      }
      case 'bolero': {

        const bo = tt * 1.4; const rise = SI(bo * .5); Object.assign(q, {lArm: -.4 - .9 * MX(0, rise), rArm: .4 + .2 * SI(bo), lElb: -.5 - .3 * MX(0, rise), rElb: -.4, spin: .2 * SI(bo * .5), sway: .06 * SI(bo), bob: .02 * AB(SI(bo * 1.5)), lKnee: .15, rKnee: .15, headTilt: -.08 * MX(0, rise), lean: .04 * SI(bo * .5)});
        break
      }
      case 'sirtaki': {

        const sk = tt * (1.6 + MN(1, tt % 8 / 6) * 2.4); const st = SI(sk); Object.assign(q, {sway: .14 * st, bob: .035 * AB(st), lThigh: -.12 - .22 * MX(0, st), rThigh: -.12 - .22 * MX(0, -st), lKnee: .35 * MX(0, st), rKnee: .35 * MX(0, -st), lArm: -.95, rArm: .95, lElb: -.1, rElb: -.1, lean: .05 * st});
        break
      }
      case 'reel': {

        const rl = tt * 5.2; const st = SI(rl); Object.assign(q, {lThigh: -.1 - .3 * MX(0, st), rThigh: -.1 - .3 * MX(0, -st), lKnee: .5 * MX(0, st), rKnee: .5 * MX(0, -st), bob: .045 * AB(st), sway: .1 * SI(rl * .5), spin: .3 * SI(rl * .25), lArm: -.35, rArm: .35, lElb: -.9, rElb: -.9});
        break
      }
      case 'hora': {

        const hr2 = tt * 3.4; const st = SI(hr2); Object.assign(q, {sway: .16 * SI(hr2 * .5), lThigh: -.1 - .35 * MX(0, st), rThigh: -.1 - .35 * MX(0, -st), lKnee: .55 * MX(0, st), rKnee: .55 * MX(0, -st), bob: .05 * AB(st), lArm: -.85, rArm: .85, lElb: -.2, rElb: -.2, spin: .25 * SI(hr2 * .5)});
        break
      }
      case 'gavotte': {

        const gv = tt * 3.2; const hop = MX(0, SI(gv * 2)); Object.assign(q, {bob: .06 * hop, lThigh: -.1 - .5 * MX(0, SI(gv * 2 - 1)), rThigh: -.1 - .3 * MX(0, -SI(gv * 2)), lKnee: .6 * MX(0, SI(gv * 2 - 1)), rKnee: .4, lArm: -.5 - .4 * SI(gv * .5), rArm: .5 - .4 * SI(gv * .5), lElb: -.6, rElb: -.6, lean: .07 * SI(gv), headTilt: .08 * SI(gv + 1)});
        break
      }
      case 'czardas': {

        const slow = (tt % 10) < 5; const cz = tt * (slow ? 1.8 : 4.6); const st = SI(cz); Object.assign(q, {lThigh: -.12 - .35 * MX(0, st), rThigh: -.12 - .35 * MX(0, -st), lKnee: .5 * MX(0, st), rKnee: .5 * MX(0, -st), bob: .04 * AB(st), sway: .1 * st, lArm: slow ? -.4 : -.7, rArm: slow ? .4 : .7, lElb: slow ? -.8 : -.4, rElb: slow ? -.8 : -.4, lean: .06 * st});
        break
      }
      case 'morris': {

        const mr = tt * 3.6; const hop = MX(0, SI(mr)); const arm = FL(mr / PI) % 2 ? 1 : -1; Object.assign(q, {bob: .05 * hop, lThigh: -.08 - .3 * MX(0, SI(mr - .8)), rThigh: -.08 - .3 * MX(0, SI(mr + .8)), lKnee: .5 * MX(0, SI(mr - .8)), rKnee: .5 * MX(0, SI(mr + .8)), lArm: -.5 - .9 * MX(0, arm), rArm: -.5 - .9 * MX(0, -arm), lElb: -.3, rElb: -.3, sway: .08 * SI(mr * .5), headTilt: .07 * SI(mr)});
        break
      }
      case 'jig': {

        const jg = tt * 7; const st = SI(jg); Object.assign(q, {lThigh: -.15 - .5 * MX(0, st), rThigh: -.15 - .5 * MX(0, -st), lKnee: .8 * MX(0, st), rKnee: .8 * MX(0, -st), bob: .03 * AB(st), lArm: -.35, rArm: -.35, lElb: -1, rElb: -1, lean: 0, sway: 0, headTilt: .03 * SI(jg * .25)});
        break
      }
      case 'bourree': {

        const br = tt * 4.4; const st = SI(br); const drift = S(.8) * .12; Object.assign(q, {sway: .1 * st, bob: .025 * AB(st), lThigh: -.15 - .2 * MX(0, st), rThigh: -.15 - .2 * MX(0, -st), lKnee: .25 + .15 * MX(0, st), rKnee: .25 + .15 * MX(0, -st), lArm: -.9 - .3 * SI(br * .5), rArm: -.9 - .3 * SI(br * .5 + 1.5), lElb: -.5, rElb: -.5, lean: .05 * st + drift * .3, headTilt: .06 * SI(br * .5)});
        break
      }
      case 'sarabande': {

        const sb = tt * 1.6; const st = SI(sb); const shift = SI(sb * .5); Object.assign(q, {sway: .14 * shift, lean: .09 * shift, bob: .03 * AB(st), lThigh: -.12 - .25 * MX(0, st), rThigh: -.12 - .25 * MX(0, -st), lKnee: .35 * MX(0, st), rKnee: .35 * MX(0, -st), lArm: -.7 - .5 * SI(sb * .5 + .6), rArm: -.7 - .5 * SI(sb * .5 + 2), lElb: -.4, rElb: -.4, headTilt: .08 * shift});
        break
      }
      case 'pavane': {

        const pv = tt * 1.4; const st = SI(pv); const rise = SI(pv * .5); Object.assign(q, {bob: .035 * AB(rise), sway: .06 * st, lThigh: -.1 - .18 * MX(0, st), rThigh: -.1 - .18 * MX(0, -st), lKnee: .2 * MX(0, st), rKnee: .2 * MX(0, -st), lArm: -.55 - .15 * st, rArm: -.55 - .15 * st, lElb: -.2, rElb: -.2, lean: .04 * st, headTilt: .04 * SI(pv * .5)});
        break
      }
      case 'allemande': {

        const al = tt * 2; const st = SI(al); Object.assign(q, {lThigh: -.15 - .25 * MX(0, st), rThigh: -.15 - .25 * MX(0, -st), lKnee: .4 * MX(0, st), rKnee: .4 * MX(0, -st), bob: .03 * AB(st), sway: .09 * st, lArm: -1.6 - .15 * SI(al * .5), rArm: -1.6 - .15 * SI(al * .5 + .8), lElb: -.9, rElb: -.9, lean: .05 * st, headTilt: .07 * SI(al * .5 + .4)});
        break
      }
      case 'courante': {

        const cr = tt * 3.4; const st = SI(cr); const jump = MX(0, SI(cr * .5)); Object.assign(q, {bob: .07 * jump, lThigh: -.15 - .4 * MX(0, st), rThigh: -.15 - .4 * MX(0, -st), lKnee: .55 * MX(0, st), rKnee: .55 * MX(0, -st), sway: .07 * st, lArm: -.6 - .3 * st, rArm: -.6 - .3 * st, lElb: -.35, rElb: -.35, lean: .05 * st, headTilt: .06 * SI(cr * .5)});
        break
      }
      case 'rigaudon': {

        const rg = tt * 4; const st = SI(rg); const hop = AB(SI(rg * .5)); Object.assign(q, {bob: .06 * hop, lThigh: -.2 - .35 * MX(0, st), rThigh: -.2 - .35 * MX(0, -st), lKnee: .15 * MX(0, st), rKnee: .15 * MX(0, -st), sway: .08 * st, lArm: -.5 - .4 * SI(rg * .5), rArm: -.5 - .4 * SI(rg * .5 + 1), lElb: -.5, rElb: -.5, lean: .06 * st, headTilt: .08 * SI(rg * .5)});
        break
      }
      case 'passepied': {

        const ps = tt * 4.8; const st = SI(ps); Object.assign(q, {lThigh: -.15 - .3 * MX(0, st), rThigh: -.15 - .3 * MX(0, -st), lKnee: .4 * MX(0, st), rKnee: .4 * MX(0, -st), bob: .035 * AB(st), sway: .08 * st, lArm: -1.3 - .25 * SI(ps * .5), rArm: -1.3 - .25 * SI(ps * .5 + 1.2), lElb: -.6, rElb: -.6, lean: .05 * st, headTilt: .06 * SI(ps * .33)});
        break
      }
      case 'hambo': {

        const hb = tt * 3.4; const beat = FL(hb) % 3; const dip = beat === 0 ? .06 : .02; const st = SI(hb * PI * 2 / 3); Object.assign(q, {bob: dip * (.5 + .5 * SI(hb)), lean: .12 * SI(hb * .66), spin: .35 * SI(hb * .22), lArm: -.9 - .3 * SI(hb * .5), rArm: -.9 - .3 * SI(hb * .5 + .8), lElb: -.45, rElb: -.45, lThigh: -.1 - .2 * MX(0, st), rThigh: -.1 - .2 * MX(0, -st), sway: .07 * st, headTilt: .05 * SI(hb * .4)});
        break
      }
      case 'galliard': {

        const gl = tt * 4.4; const step = gl % 5; const kick = SI(step * PI); const side = FL(gl / 5) % 2 === 0 ? 1 : -1; const leap = step > 4 ? 1 : 0; Object.assign(q, {lThigh: side > 0 ? -.3 - .5 * MX(0, kick) : -.15, rThigh: side < 0 ? -.3 - .5 * MX(0, kick) : -.15, lKnee: .5 * MX(0, kick), rKnee: .5 * MX(0, kick), bob: .1 * leap * SI((step - 4) * PI), sway: .1 * side, lArm: -.7 - .5 * side * kick, rArm: -.7 - .5 * -side * kick, lElb: -.4, rElb: -.4, headTilt: .06 * side, spin: .1 * side * leap});
        break
      }
      case 'saltarello': {

        const sa = tt * 5.2; const hop = AB(SI(sa)); const st = SI(sa); Object.assign(q, {bob: .07 * hop, lKnee: .55 * MX(0, st), rKnee: .55 * MX(0, -st), lThigh: -.1 - .15 * MX(0, st), rThigh: -.1 - .15 * MX(0, -st), sway: .09 * st, lArm: -.6 - .45 * SI(sa * .5), rArm: -.6 - .45 * SI(sa * .5 + PI), lElb: -.5, rElb: -.5, lean: .06 * st, headTilt: .05 * SI(sa * .7)});
        break
      }
      case 'bransle': {

        const br = tt * 3.6; const st = SI(br); Object.assign(q, {sway: .16 * st, lean: .1 * st, lThigh: -.1 - .2 * MX(0, st), rThigh: -.1 - .2 * MX(0, -st), lKnee: .3 * MX(0, -st), rKnee: .3 * MX(0, st), bob: .03 * AB(st), lArm: -.4 - .25 * st, rArm: -.4 - .25 * -st, lElb: -.3, rElb: -.3, headTilt: .08 * st});
        break
      }
      case 'farandole': {

        const fa = tt * 5.5; const st = SI(fa); Object.assign(q, {bob: .06 * AB(st), lThigh: -.2 - .35 * MX(0, st), rThigh: -.2 - .35 * MX(0, -st), lKnee: .45 * MX(0, -st), rKnee: .45 * MX(0, st), sway: .11 * st, lArm: -.9, rArm: -.9, lElb: -.2, rElb: -.2, lean: .08 * st, spin: .12 * SI(fa * .3), headTilt: .05 * st});
        break
      }
      case 'canarie': {

        const cn = tt * 6.4; const st = SI(cn); Object.assign(q, {lThigh: -.25 - .4 * MX(0, st), rThigh: -.25 - .4 * MX(0, -st), lKnee: .5 * MX(0, st), rKnee: .5 * MX(0, -st), bob: .05 * AB(st) + .04 * MX(0, SI(cn * .5)), sway: .07 * st, lArm: -.5 - .5 * SI(cn * .5), rArm: -.5 - .5 * SI(cn * .5 + PI), lElb: -.55, rElb: -.55, lean: .05 * st, headTilt: .04 * SI(cn * .8)});
        break
      }
      case 'volta': {

        const vo = tt * 4.2; const st = SI(vo); Object.assign(q, {spin: .9 * SI(vo * .25), bob: .08 * AB(st), lThigh: -.3 - .3 * MX(0, st), rThigh: -.3 - .3 * MX(0, -st), lKnee: .4 * MX(0, -st), rKnee: .4 * MX(0, st), lArm: -1.1 - .3 * st, rArm: -1.1 - .3 * -st, lElb: -.5, rElb: -.5, lean: .1 * st, headTilt: .07 * SI(vo * .5)});
        break
      }
      case 'jota': {

        const jo = tt * 5.8; const st = SI(jo); Object.assign(q, {bob: .055 * AB(st), lThigh: -.2 - .3 * MX(0, st), rThigh: -.2 - .3 * MX(0, -st), lKnee: .4 * MX(0, -st), rKnee: .4 * MX(0, st), lArm: -2.3 + .25 * SI(jo * 2), rArm: -2.3 - .25 * SI(jo * 2), lElb: -.9, rElb: -.9, sway: .08 * st, spin: .2 * SI(jo * .3), headTilt: .06 * SI(jo * .6)});
        break
      }
      case 'fandango': {

        const fd = tt * 4.6; const st = SI(fd); Object.assign(q, {spin: .5 * SI(fd * .35), bob: .05 * AB(st), lThigh: -.15 - .3 * MX(0, st), rThigh: -.15 - .3 * MX(0, -st), lKnee: .35 * MX(0, -st), rKnee: .35 * MX(0, st), lArm: -1.8 - .5 * SI(fd), rArm: -1.8 - .5 * SI(fd + PI), lElb: -.7, rElb: -.7, sway: .1 * st, lean: .07 * st, headTilt: .08 * SI(fd * .5)});
        break
      }
      case 'zapateado': {

        const zp = tt * 7.2; const st = SI(zp); Object.assign(q, {lThigh: -.28 - .35 * MX(0, st), rThigh: -.28 - .35 * MX(0, -st), lKnee: .3 * MX(0, st), rKnee: .3 * MX(0, -st), bob: .025 * AB(st), lArm: -.35 - .15 * st, rArm: -.35 - .15 * -st, lElb: -.25, rElb: -.25, sway: .05 * st, lean: .04 * st, headTilt: .03 * SI(zp * .5)});
        break
      }
      case 'korobushka': {

        const kb = tt * 5.5; const st = SI(kb); Object.assign(q, {lThigh: -.55 * MX(0, st), rThigh: -.55 * MX(0, -st), lKnee: .4 * MX(0, -st), rKnee: .4 * MX(0, st), lArm: -.7 - .25 * st, rArm: -.7 - .25 * -st, lElb: -.8, rElb: -.8, bob: .03 * AB(st), sway: .08 * st, lean: .05 * st, spin: .15 * SI(kb * .4), headTilt: .05 * SI(kb * .5)});
        break
      }
      case 'trepak': {

        const tp = tt * 5.8; const st = SI(tp); Object.assign(q, {lThigh: -.5 * MX(0, st) - .15, rThigh: -.5 * MX(0, -st) - .15, lKnee: .1, rKnee: .1, lArm: -.55, rArm: -.55, lElb: -.9, rElb: -.9, bob: .02 + .04 * AB(st), sway: .07 * st, lean: .06 * st, spin: .1 * SI(tp * .5), headTilt: .04 * st});
        break
      }
      case 'legenyes': {

        const lg = tt * 6.0; const st = SI(lg); const click = MX(0, SI(lg * 2)); Object.assign(q, {lThigh: -.4 * MX(0, st) - .1, rThigh: -.4 * MX(0, -st) - .1, lKnee: .35 * MX(0, -st), rKnee: .35 * MX(0, st), bob: .05 * click, lArm: -.6 - .2 * st, rArm: -.6 - .2 * -st, lElb: -.55, rElb: -.55, sway: .08 * st, lean: .04 * st, spin: .12 * SI(lg * .33), headTilt: .05 * st});
        break
      }
      case 'kalamatianos': {

        const kl = tt * 4.6; const st = SI(kl); const ph = tt * 2.2; Object.assign(q, {lThigh: -.35 * MX(0, st) - .05, rThigh: -.35 * MX(0, -st) - .05, lKnee: .3 * MX(0, -st), rKnee: .3 * MX(0, st), lArm: -.9, rArm: -.9, lElb: -.25, rElb: -.25, bob: .03 * AB(st), sway: .12 * st, lean: .06 * st, spin: .3 * SI(ph), headTilt: .06 * SI(kl * .5)});
        break
      }
      case 'kolo': {

        const ko = tt * 5.2; const st = SI(ko); Object.assign(q, {lThigh: -.3 * MX(0, st), rThigh: -.3 * MX(0, -st), lKnee: .35 * AB(st), rKnee: .35 * AB(st), lArm: -.75, rArm: -.75, lElb: -.5, rElb: -.5, bob: .04 * AB(SI(ko * 1.5)), sway: .1 * st, lean: .05 * st, spin: .25 * S(2.0), headTilt: .05 * SI(ko * .5)});
        break
      }
      case 'dabke': {

        const dk2 = tt * 5.0; const st = SI(dk2); Object.assign(q, {lThigh: -.5 * MX(0, st), rThigh: -.5 * MX(0, -st), lKnee: .5 * MX(0, -st), rKnee: .5 * MX(0, st), bob: .045 * AB(st), lArm: -.85, rArm: -.85, lElb: -.35, rElb: -.35, sway: .09 * st, lean: .07 * st, spin: .2 * S(1.8), headTilt: .05 * st});
        break
      }
      case 'sardana': {

        const sd = tt * 4.0; const st = SI(sd); Object.assign(q, {lThigh: -.3 * MX(0, st), rThigh: -.3 * MX(0, -st), lKnee: .3 * MX(0, -st), rKnee: .3 * MX(0, st), lArm: -1.5 - .2 * st, rArm: -1.5 - .2 * -st, lElb: -.2, rElb: -.2, bob: .025 * AB(st), sway: .1 * st, lean: .04 * st, spin: .35 * S(1.6), headTilt: .04 * SI(sd * .5)});
        break
      }
      case 'zeybek': {

        const zb = tt * 3.6; const st = SI(zb); Object.assign(q, {lArm: -1.15, rArm: -1.15, lElb: -.1, rElb: -.1, lThigh: -.45 * MX(0, st), rThigh: -.45 * MX(0, -st), lKnee: .55 * AB(st), rKnee: .55 * AB(st), bob: .05 * AB(st), sway: .12 * st, lean: .1 * st, spin: .18 * S(1.4), headTilt: .06 * st});
        break
      }
      case 'tsamiko': {

        const ts = tt * 4.2; const st = SI(ts); const leap = MX(0, SI(ts * .5)); Object.assign(q, {lThigh: -.7 * MX(0, st), rThigh: -.7 * MX(0, -st), lKnee: .2 * MX(0, st), rKnee: .2 * MX(0, -st), bob: -.06 * leap, lArm: -1.3 - .3 * st, rArm: -1.3 - .3 * -st, lElb: -.15, rElb: -.15, sway: .1 * st, lean: .08 * st, spin: .4 * leap * SI(ts * .25), headTilt: .05 * st});
        break
      }
      case 'seguidilla': {

        const sg = tt * 6; const st = SI(sg); const beat = SI(sg * 1.5); Object.assign(q, {lArm: -1.5 + .2 * st, rArm: -1.5 + .2 * -st, lElb: -.5, rElb: -.5, lThigh: -.2 * MX(0, beat), rThigh: -.2 * MX(0, -beat), lKnee: .15 * AB(beat), rKnee: .15 * AB(beat), bob: -.015 * AB(st), sway: .06 * st, lean: .06 * beat, headTilt: .07 * st, spin: .25 * SI(sg * .33)});
        break
      }
      case 'sevillanas': {

        const sv = tt * 4.6; const st = SI(sv); const arm = SI(sv * .8); Object.assign(q, {lArm: -1.1 + .6 * arm, rArm: -1.1 - .6 * arm, lElb: -.3 + .2 * arm, rElb: -.3 - .2 * arm, lThigh: -.18 * MX(0, st), rThigh: -.18 * MX(0, -st), lKnee: .12 * AB(st), rKnee: .12 * AB(st), bob: -.012 * AB(st), sway: .08 * st, lean: .07 * st, headTilt: .08 * arm, spin: .3 * SI(sv * .4)});
        break
      }
      case 'forro': {

        const fr = tt * 5; const st = SI(fr); const side = SI(fr * .5); Object.assign(q, {sway: .12 * side, lean: .06 * side, bob: -.015 * AB(st), lThigh: -.15 * MX(0, side), rThigh: -.15 * MX(0, -side), lKnee: .2 * MX(0, -side), rKnee: .2 * MX(0, side), lArm: -.9 + .15 * st, rArm: -.9 - .15 * st, lElb: -.6, rElb: -.6, headTilt: .09 * side, spin: .15 * SI(fr * .25)});
        break
      }
      case 'schuhplattler': {

        const sp = tt * 5.5; const st = SI(sp); const slap = MX(0, SI(sp * 2)); Object.assign(q, {bob: -.02 * AB(st), lKnee: .5 * slap, rKnee: .15, lThigh: -.55 * slap, rThigh: -.1, lArm: -.5 - .4 * slap, rArm: -.6 + .3 * st, lElb: -.5, rElb: -.3, lean: .1 * st, sway: .06 * st, spin: .35 * SI(sp * .5), headTilt: .06 * st});
        break
      }
      case 'halay': {

        const hl = tt * 5; const st = SI(hl); const step = SI(hl * 2); Object.assign(q, {sway: .05 * st, bob: -.012 * AB(step), lThigh: -.12 * MX(0, step), rThigh: -.12 * MX(0, -step), lKnee: .18 * AB(step), rKnee: .18 * AB(step), lArm: -.35, rArm: -.35, lElb: -.9, rElb: -.9, lean: .05 * st, headTilt: .05 * st, spin: .12 * SI(hl * .3)});
        break
      }
      case 'polska': {

        const pk = tt * 3.4; const st = SI(pk); Object.assign(q, {bob: -.04 * MX(0, -st), spin: 1.2 * st, sway: .07 * st, lean: .09 * st, lArm: -1.0 + .15 * st, rArm: -1.0 - .15 * st, lElb: -.5, rElb: -.5, lThigh: -.15 * MX(0, st), rThigh: -.15 * MX(0, -st), lKnee: .12 * AB(st), rKnee: .12 * AB(st), headTilt: .06 * st});
        break
      }
      case 'cumbia': {

        const cb = tt * 4.4; const st = SI(cb); const hip = SI(cb * 2); Object.assign(q, {sway: .1 * st, lean: .05 * hip, bob: -.012 * AB(st), lThigh: -.15 * MX(0, -st), rThigh: -.15 * MX(0, st), lKnee: .15 * AB(st), rKnee: .15 * AB(st), lArm: -.7 - .2 * st, rArm: -.4 + .15 * hip, lElb: -.3, rElb: -.5, headTilt: .06 * st, spin: .35 * SI(cb * .33)});
        break
      }
      case 'landler': {

        const ld = tt * 3.6; const st = SI(ld); const clap = MX(0, SI(ld * 3)); Object.assign(q, {bob: -.03 * AB(st), spin: .8 * st, sway: .06 * st, lArm: -.6 - .5 * clap, rArm: -.6 - .5 * clap, lElb: -.4, rElb: -.4, lThigh: -.2 * MX(0, st), rThigh: -.2 * MX(0, -st), lKnee: .15 * AB(st), rKnee: .15 * AB(st), lean: .06 * st, headTilt: .07 * st});
        break
      }
      case 'hopak': {

        const hp = tt * 5; const st = SI(hp); const jump = MX(0, SI(hp * .5)); Object.assign(q, {bob: -.05 * jump, lThigh: -.6 * jump, rThigh: -.25 * MX(0, -st), lKnee: .7 * jump, rKnee: .3 * MX(0, -st), lArm: -1.5 - .2 * st, rArm: -.4 + .3 * st, lElb: -.2, rElb: -.4, sway: .07 * st, lean: .08 * st, spin: .5 * SI(hp * .25), headTilt: .05 * st});
        break
      }
      case 'kalbelia': {

        const kb = tt * 4.4; const st = SI(kb); Object.assign(q, {spin: .6 * SI(kb * .5), sway: .12 * st, lean: -.15 * AB(SI(kb * .5)), bob: -.03 * AB(st), lArm: -.9 - .5 * st, rArm: -.9 + .5 * st, lElb: -.4 - .3 * st, rElb: -.4 + .3 * st, lThigh: -.1 * st, rThigh: .1 * st, lKnee: .15, rKnee: .15, headTilt: .1 * SI(kb * .5)});
        break
      }
      case 'bhangra': {

        const bh = tt * 5.4; const st = SI(bh); const beat = SI(bh * 2); Object.assign(q, {bob: -.04 * AB(st), lArm: -1.8 - .2 * beat, rArm: -1.8 + .2 * beat, lElb: -.5 - .3 * st, rElb: -.5 + .3 * st, lThigh: -.35 * MX(0, st), rThigh: -.35 * MX(0, -st), lKnee: .4 * MX(0, st), rKnee: .4 * MX(0, -st), sway: .1 * st, lean: .06 * st, spin: .3 * SI(bh * .25), headTilt: .07 * st});
        break
      }
      case 'kathak': {

        const kt = tt * 4.8; const st = SI(kt); Object.assign(q, {spin: .9 * SI(kt * .4), bob: -.02 * AB(st), lThigh: -.35 * MX(0, st), rThigh: -.1, lKnee: .5 * MX(0, st), rKnee: .15, lArm: -1.1 - .4 * st, rArm: -.7 + .5 * st, lElb: -.35, rElb: -.6, sway: .06 * st, lean: .05 * SI(kt * .5), headTilt: .1 * SI(kt * .5)});
        break
      }
      case 'bharat': {

        const bt = tt * 4.6; const st = SI(bt); const stamp = MX(0, SI(bt * 2)); Object.assign(q, {bob: .04 + .02 * stamp, lThigh: -.5, rThigh: -.5, lKnee: .6 + .2 * stamp, rKnee: .6 - .2 * stamp, lArm: -1.0 - .3 * st, rArm: -1.0 + .3 * st, lElb: -.5, rElb: -.5, sway: .08 * st, lean: .03 * st, headTilt: .12 * st, spin: .2 * SI(bt * .3)});
        break
      }
      case 'odissi': {

        const od = tt * 3.6; const st = SI(od); Object.assign(q, {sway: .14 * st, lean: -.08 * st, headTilt: .14 * st, bob: .02 + .02 * AB(st), lThigh: -.3 + .1 * st, rThigh: -.3 - .1 * st, lKnee: .4, rKnee: .4, lArm: -.8 - .3 * st, rArm: -.8 + .3 * st, lElb: -.6 + .2 * st, rElb: -.6 - .2 * st, spin: .15 * SI(od * .5)});
        break
      }
      case 'garba': {

        const gb = tt * 4.6; const st = SI(gb); const clap = AB(SI(gb * 2)); Object.assign(q, {lArm: -.5 - .8 * clap, rArm: -.5 - .8 * clap, lElb: -.6 - .3 * clap, rElb: -.6 - .3 * clap, spin: .5 * SI(gb * .33), sway: .1 * st, bob: -.03 * AB(st), lThigh: -.25 * st, rThigh: -.25 * -st, lKnee: .3 * MX(0, st), rKnee: .3 * MX(0, -st), lean: .06 * st, headTilt: .08 * st});
        break
      }
      case 'bihu': {

        const bu = tt * 5.2; const st = SI(bu); Object.assign(q, {bob: -.04 * AB(st), lThigh: -.4 * st, rThigh: .4 * st, lKnee: .5 * MX(0, st), rKnee: .5 * MX(0, -st), lArm: -1.3 - .4 * st, rArm: -1.3 + .4 * st, lElb: -.7 - .2 * st, rElb: -.7 + .2 * st, sway: .12 * st, lean: .07 * st, spin: .3 * SI(bu * .33), headTilt: .1 * SI(bu * .5)});
        break
      }
      case 'lavani': {

        const lv = tt * 5.6; const st = SI(lv); Object.assign(q, {sway: .16 * st, bob: -.03 * AB(st), lThigh: -.3 * st, rThigh: .3 * st, lKnee: .35, rKnee: .35, lArm: -1.1 - .35 * SI(lv * 1.5), rArm: -1.1 + .35 * SI(lv * 1.5), lElb: -.5 - .4 * SI(lv * 3), rElb: -.5 + .4 * SI(lv * 3), lean: .08 * st, spin: .25 * SI(lv * .3), headTilt: .12 * st});
        break
      }
      case 'dandiya': {

        const dd = tt * 5; const st = SI(dd); const hit = AB(SI(dd * 1.5)); Object.assign(q, {lArm: -.7 - 1.0 * hit, rArm: -.7 - 1.0 * (1 - hit), lElb: -.4 - .3 * hit, rElb: -.4 - .3 * (1 - hit), spin: .4 * SI(dd * .3), sway: .08 * st, bob: -.03 * AB(st), lThigh: -.2 * st, rThigh: -.2 * -st, lKnee: .25, rKnee: .25, lean: .05 * st, headTilt: .07 * st});
        break
      }
      case 'ghoomar': {

        const gh = tt * 3.8; const st = SI(gh); Object.assign(q, {spin: 1.2 * SI(gh * .2), sway: .1 * SI(gh * .4), bob: -.02 * AB(st), lArm: -1.4 - .2 * st, rArm: -1.4 + .2 * st, lElb: -.5 - .15 * st, rElb: -.5 + .15 * st, lThigh: -.15 * st, rThigh: .15 * st, lKnee: .2, rKnee: .2, lean: .05 * SI(gh * .4), headTilt: .09 * SI(gh * .4)});
        break
      }
      case 'khorovod': {

        const kh = tt * 4.4; const st = SI(kh); const inward = SI(kh * .4); Object.assign(q, {spin: .5 * SI(kh * .5), sway: .06 * st, bob: -.02 * AB(st), lArm: -.9 - .3 * inward, rArm: -.9 + .3 * inward, lElb: -.3, rElb: -.3, lThigh: -.15 * st, rThigh: -.15 * -st, lKnee: .2, rKnee: .2, lean: .04 * inward, headTilt: .06 * st});
        break
      }
      case 'lezginka': {

        const lz = tt * 6.2; const st = SI(lz); const hop = AB(SI(lz * .6)); Object.assign(q, {lArm: -1.7 - .15 * st, rArm: -1.7 + .15 * st, lElb: -.15, rElb: -.15, lThigh: -.3 * st, rThigh: -.3 * -st, lKnee: .35 + .2 * hop, rKnee: .35 + .2 * (1 - hop), lShin: -.25 * MX(0, -st), rShin: -.25 * MX(0, st), bob: -.04 * hop, sway: .05 * st, lean: .03 * st, headTilt: .05 * st});
        break
      }
      case 'krakowiak': {

        const kr = tt * 5.4; const st = SI(kr); const gallop = AB(SI(kr)); Object.assign(q, {lean: -.06, bob: -.05 * gallop, sway: .07 * st, lArm: .4, rArm: -.5, lElb: -.8, rElb: -.4, lThigh: -.4 * st, rThigh: -.4 * -st, lKnee: .4 + .15 * gallop, rKnee: .4 + .15 * gallop, lShin: -.2 * MX(0, -st), rShin: -.2 * MX(0, st), headTilt: .05 * st});
        break
      }
      case 'verbunk': {

        const vb = tt * 3.6; const st = SI(vb); const click = AB(SI(vb * .8)); Object.assign(q, {lean: -.04, bob: -.03 * click, sway: .06 * st, lArm: .5 - .3 * st, rArm: -1.1 + .4 * st, lElb: -.9, rElb: -.5, lThigh: -.25 * st, rThigh: -.25 * -st});

        Object.assign(q, {lKnee: .3, rKnee: .3, lShin: -.3 * click, rShin: -.1 * (1 - click), headTilt: -.06 * st});
        break
      }
      case 'sirba': {

        const sb = tt * 7.8; const st = SI(sb); const hop = AB(SI(sb)); Object.assign(q, {bob: -.045 * hop, sway: .05 * st, lArm: .2, rArm: .2, lElb: -1.0, rElb: -1.0, lThigh: -.35 * st, rThigh: -.35 * -st, lKnee: .4, rKnee: .4, lShin: -.45 * MX(0, -st), rShin: -.45 * MX(0, st), lean: .05 * st, headTilt: .06 * st});
        break
      }
      case 'hasapiko': {

        const hs = tt * 4.2; const st = SI(hs); const tap = AB(SI(hs * .75)); Object.assign(q, {sway: .08 * st, bob: -.025 * tap, lArm: .3, rArm: .3, lElb: -1.1, rElb: -1.1, lThigh: -.3 * st, rThigh: -.3 * -st, lKnee: .35, rKnee: .35, lShin: -.3 * MX(0, -st), rShin: -.3 * MX(0, st), lean: .04 * st, headTilt: .05 * st});
        break
      }
      case 'oberek': {

        const ob = tt * 5.6; const st = SI(ob); const lift = AB(SI(ob * .5)); Object.assign(q, {bob: -.04 * lift, sway: .06 * st, lean: .12 * st, headTilt: -.1 * st, lArm: -1.2 - .15 * st, rArm: .5 + .1 * -st, lElb: -.5, rElb: -.25, lThigh: -.4 * MX(0, st), rThigh: -.4 * MX(0, -st), lKnee: .5 * MX(0, -st), rKnee: .5 * MX(0, st), lShin: -.3 * MX(0, -st), rShin: -.3 * MX(0, st)});
        break
      }
      case 'tropanka': {

        const tr = tt * 6.4; const st = SI(tr); const stamp = AB(SI(tr * .5)); Object.assign(q, {bob: -.02 - .05 * stamp, sway: .07 * st, lArm: .45, rArm: .45, lElb: -.8, rElb: -.8, lThigh: -.55 * MX(0, st), rThigh: -.55 * MX(0, -st), lKnee: .6 * MX(0, st), rKnee: .6 * MX(0, -st), lShin: .25 * MX(0, st), rShin: .25 * MX(0, -st), lean: .05 * -st, headTilt: .04 * st});
        break
      }
      case 'tinikling': {

        const tk = tt * 8.0; const st = SI(tk); const hop = AB(SI(tk * .5)); Object.assign(q, {bob: -.035 * hop, sway: .03 * st, lThigh: -.5 * MX(0, st), rThigh: -.5 * MX(0, -st), lKnee: .7 * MX(0, st), rKnee: .7 * MX(0, -st), lShin: .3 * MX(0, -st), rShin: .3 * MX(0, st), lArm: -1.1 - .15 * st, rArm: -1.1 - .15 * -st, lElb: -.4, rElb: -.4, lean: .06 * -st, headTilt: .06 * st});
        break
      }
      case 'gumboot': {

        const gb = tt * 5.2; const st = SI(gb); const slap = MX(0, SI(gb)); Object.assign(q, {bob: -.03 - .04 * AB(SI(gb * .5)), lean: .12, lThigh: -.7 * MX(0, st), rThigh: -.7 * MX(0, -st), lKnee: .8 * MX(0, st), rKnee: .8 * MX(0, -st), lArm: .55 + .2 * slap, rArm: .55 + .2 * (1 - slap), lElb: -.6, rElb: -.6, headTilt: .08, sway: .04 * st});
        break
      }
      case 'halling': {

        const ha = tt * 4.4; const st = SI(ha); const crouch = MX(0, -st); const kick = MX(0, st); Object.assign(q, {bob: -.01 - .09 * crouch + .02 * kick, lThigh: -.95 * kick, lKnee: .15 * kick + .5 * crouch, lShin: .2 * kick, rThigh: -.15 * crouch, rKnee: .55 * crouch, lArm: .5 * crouch - .3 * kick, rArm: .5 * crouch - .3 * kick, lElb: -.5, rElb: -.5, lean: .15 * crouch - .1 * kick, headTilt: .06 * st});
        break
      }
      case 'haka': {

        const hk = tt * 5.5; const st = SI(hk); const stomp = AB(st); const slap = MX(0, SI(hk * .5)); Object.assign(q, {bob: -.06 - .04 * stomp, lThigh: -.25 - .1 * stomp, rThigh: -.25 - .1 * stomp, lKnee: .5, rKnee: .5, lShin: .15 * st, rShin: -.15 * st, lArm: .6 * slap, rArm: .6 * (1 - slap), lElb: -.7, rElb: -.7, lean: .18, headTilt: .1 * SI(hk * .25)});
        break
      }
      case 'marinera': {

        const mr = tt * 4; const st = SI(mr); const wave = SI(mr * 1.5); Object.assign(q, {bob: -.015 + .02 * AB(st), sway: .06 * st, lArm: -.6 - .15 * wave, lElb: -.3, rArm: .5, rElb: -.5, lThigh: -.2 * MX(0, st), rThigh: -.2 * MX(0, -st), lKnee: .25 * MX(0, st), rKnee: .25 * MX(0, -st), headTilt: .09 * wave, lean: .03 * st});
        break
      }
      case 'sagayan': {

        const sg = tt * 5.8; const st = SI(sg); const lunge = MX(0, SI(sg * .7)); Object.assign(q, {bob: -.05 - .06 * lunge, lean: .2 * lunge, lThigh: -.4 * MX(0, st), rThigh: -.4 * MX(0, -st), lKnee: .5 * MX(0, st), rKnee: .5 * MX(0, -st), lShin: .2 * MX(0, st), rShin: .2 * MX(0, -st), lArm: -.35 - .25 * lunge, lElb: -.4, rArm: .55, rElb: -.75, sway: .05 * st, headTilt: .08 * st});
        break
      }
      case 'malambo': {

        const mb = tt * 7.5; const st = SI(mb); const stamp = AB(st); const sweep = SI(mb * .4); Object.assign(q, {bob: -.03 - .035 * stamp, lThigh: -.35 * MX(0, st), rThigh: -.35 * MX(0, -st), lKnee: .3 * MX(0, st), rKnee: .3 * MX(0, -st), lShin: .15 * MX(0, sweep), rShin: .15 * MX(0, -sweep), lArm: -.5 - .1 * SI(mb), lElb: -.3, rArm: .3 + .2 * SI(mb * .5), rElb: -.4, sway: .04 * st, headTilt: .05 * SI(mb * .3)});
        break
      }
      case 'caporales': {

        const cp = tt * 6.2; const st = SI(cp); const jump = AB(SI(cp * .5)); Object.assign(q, {bob: -.02 - .08 * jump, lThigh: -.5 * MX(0, st), rThigh: -.5 * MX(0, -st), lKnee: .6 * MX(0, st), rKnee: .6 * MX(0, -st), lShin: .25 * MX(0, st), rShin: .25 * MX(0, -st), lArm: .45 * MX(0, st) - .15, rArm: .45 * MX(0, -st) - .15, lElb: -.65, rElb: -.65, lean: .1 * jump, sway: .05 * st, headTilt: .06 * SI(cp * .3)});
        break
      }
      case 'huayno': {

        const hy = tt * 5; const st = SI(hy); const hop = AB(SI(hy)); Object.assign(q, {bob: -.015 - .035 * hop, lThigh: -.3 * MX(0, st), rThigh: -.3 * MX(0, -st), lKnee: .4 * MX(0, st), rKnee: .4 * MX(0, -st), lArm: .35 - .25 * st, rArm: .35 + .25 * st, lElb: -.35, rElb: -.35, sway: .07 * st, headTilt: .08 * SI(hy * .5), lean: .04 * st});
        break
      }
      case 'cueca': {

        const cq = tt * 2.2; const st = SI(cq); Object.assign(q, {bob: -.02 + .012 * SI(cq * 2), sway: .08 * st, lThigh: -.22 * MX(0, st), rThigh: -.22 * MX(0, -st), lKnee: .28 * MX(0, st), rKnee: .28 * MX(0, -st), rArm: 1.35 + .18 * SI(cq * 3), rElb: -.3 + .12 * SI(cq * 3), lArm: .45, lElb: -.5, headTilt: .08 * SI(cq), lean: .05 * st});
        break
      }
      case 'morenada': {

        const mr = tt * 2.6; const st = SI(mr); Object.assign(q, {bob: .02 + .03 * AB(st), sway: .12 * st, lThigh: -.35 * MX(0, st), rThigh: -.35 * MX(0, -st), lKnee: .45 * MX(0, st), rKnee: .45 * MX(0, -st), lShin: .15 * MX(0, -st), rShin: .15 * MX(0, st), lArm: .5 + .2 * st, rArm: .5 - .2 * st, lElb: -.4, rElb: -.4, lean: .1, headTilt: .06 * st});
        break
      }
      case 'diablada': {

        const db = tt * 3.4; const jump = MX(0, SI(db)); const crouch = MX(0, -SI(db)); Object.assign(q, {bob: -.06 * jump + .04 * crouch, lThigh: -.6 * crouch - .2 * jump, rThigh: -.6 * crouch - .2 * jump, lKnee: .7 * crouch, rKnee: .7 * crouch, lShin: .2 * jump, rShin: .2 * jump});

        const horn = SI(db * .5); Object.assign(q, {lArm: 1.1 + .3 * MX(0, horn) - .3 * crouch, rArm: 1.1 + .3 * MX(0, -horn) - .3 * crouch, lElb: -.25, rElb: -.25, lean: .15 * crouch - .05 * jump, sway: .1 * horn, headTilt: .08 * horn});break
      }
      case 'carnavalito': {

        const cv = tt * 4.4; const st = SI(cv); const hop = AB(SI(cv)); Object.assign(q, {bob: -.015 - .05 * hop, lThigh: -.4 * MX(0, st), rThigh: -.4 * MX(0, -st), lKnee: .5 * MX(0, st), rKnee: .5 * MX(0, -st), rArm: 1.3 + .25 * SI(cv * 2), rElb: -.35 + .15 * SI(cv * 2), lArm: .4 + .15 * st, lElb: -.3, sway: .1 * st, lean: .04 * st, headTilt: .1 * SI(cv * .5)});
        break
      }
      case 'tinku': {

        const tk = tt * 3.8; const st = SI(tk); const punch = MX(0, st); const punch2 = MX(0, -st); Object.assign(q, {bob: .01 - .02 * AB(st), lThigh: -.4 * punch - .15, rThigh: -.4 * punch2 - .15, lKnee: .45 * punch, rKnee: .45 * punch2, lArm: .4 - .55 * punch, rArm: .4 - .55 * punch2, lElb: -.7 + .45 * punch, rElb: -.7 + .45 * punch2, lean: .08, sway: .06 * st, headTilt: .05 * st});
        break
      }
      case 'zamba': {

        const zb = tt * 2.0; const st = SI(zb); Object.assign(q, {bob: -.015 + .015 * SI(zb * 2), sway: .1 * st, lThigh: -.2 * MX(0, st), rThigh: -.2 * MX(0, -st), lKnee: .25 * MX(0, st), rKnee: .25 * MX(0, -st), rArm: 1.25 + .2 * SI(zb * 2.5), rElb: -.35 + .12 * SI(zb * 2.5), lArm: .35 + .1 * st, lElb: -.35, headTilt: .09 * SI(zb * .5), lean: .04 * st});
        break
      }
      case 'singkil': {

        const sg = tt * 2.8; const st = SI(sg); const step = MX(0, st); const step2 = MX(0, -st); Object.assign(q, {bob: -.02 - .02 * AB(st), lThigh: -.55 * step, rThigh: -.55 * step2, lKnee: .65 * step, rKnee: .65 * step2, lShin: .2 * step2, rShin: .2 * step});

        Object.assign(q, {lArm: .9 + .2 * SI(sg * 1.5), rArm: .9 + .2 * SI(sg * 1.5 + PI), lElb: -.5, rElb: -.5, sway: .08 * st, headTilt: .1 * SI(sg * .5), lean: .03});
        break
      }
      case 'kecak': {

        const kc = tt * 4; const st = SI(kc); Object.assign(q, {bob: .045, lThigh: -.8, rThigh: -.8, lKnee: 1.1, rKnee: 1.1, lShin: -.9, rShin: -.9});

        Object.assign(q, {lArm: 1.3 + .35 * MX(0, st), rArm: 1.3 + .35 * MX(0, -st), lElb: -.2 + .2 * st, rElb: -.2 - .2 * st, sway: .07 * st, lean: .06 + .05 * SI(kc * .5), headTilt: .08 * st});
        break
      }
      case 'saman': {

        const sm = tt * 5; const ph = SI(sm); const up = MX(0, SI(sm * .5)); Object.assign(q, {bob: .05, lThigh: -.9, rThigh: -.9, lKnee: 1.35, rKnee: 1.35, lShin: -.95, rShin: -.95});

        Object.assign(q, {lArm: .45 + .9 * up + .15 * MX(0, ph), rArm: .45 + .9 * up + .15 * MX(0, -ph), lElb: -.75 + .55 * up, rElb: -.75 + .55 * up, sway: .1 * ph * (1 - up), headTilt: .12 * ph, lean: .08 + .04 * ph});
        break
      }
      case 'robam': {

        const rb = tt * 1.4; const st = SI(rb); const pose = SI(rb * .5); Object.assign(q, {bob: .02 + .015 * AB(st), lThigh: -.3, rThigh: -.3, lKnee: .55, rKnee: .55, lShin: -.3 * MX(0, pose), rShin: -.3 * MX(0, -pose)});

        Object.assign(q, {lArm: 1.1 + .15 * st, rArm: .55 + .1 * st, lElb: -.3, rElb: -.9, sway: .06 * pose, headTilt: .15 * pose, lean: .04 * pose});
        break
      }
      case 'indlamu': {

        const id = tt * 3.2; const st = SI(id); const kick = MX(0, SI(id * .5)); const kick2 = MX(0, SI(id * .5 + PI)); Object.assign(q, {bob: -.03 * (kick + kick2) + .02 * AB(st), lThigh: -1.0 * kick, rThigh: -1.0 * kick2, lKnee: .5 * kick, rKnee: .5 * kick2, lShin: .8 * kick, rShin: .8 * kick2});

        Object.assign(q, {lArm: .5 + .7 * kick2, rArm: .5 + .7 * kick, lElb: -.3, rElb: -.3, sway: .05 * st, lean: -.03 * (kick - kick2), headTilt: .04 * st});
        break
      }
      case 'adumu': {

        const ad = tt * 4.2; const jmp = MX(0, SI(ad)); Object.assign(q, {bob: -.09 * jmp, lThigh: -.05 * jmp, rThigh: -.05 * jmp, lKnee: .12 * jmp, rKnee: .12 * jmp, lShin: .15 * jmp, rShin: .15 * jmp});

        Object.assign(q, {lArm: .15, rArm: .15, lElb: -.1, rElb: -.1, sway: .02 * SI(ad * .5), lean: .02, headTilt: .03 * SI(ad * .5)});
        break
      }
      case 'eskista': {

        const es = tt * 6; const st = SI(es); const fast = SI(es * 1.5); Object.assign(q, {bob: -.01 + .015 * AB(st), lThigh: -.05, rThigh: -.05, lKnee: .08, rKnee: .08});

        Object.assign(q, {lArm: .35 + .35 * st, rArm: .35 + .35 * -st, lElb: -.6 + .25 * fast, rElb: -.6 - .25 * fast, sway: .06 * st, lean: .06 + .05 * fast, headTilt: .1 * fast});
        break
      }
      case 'gnawa': {

        const gn = tt * 4.5; const st = SI(gn); const hop = MX(0, SI(gn * 1.5)); Object.assign(q, {bob: -.04 * hop - .01, lThigh: -.3 * hop, rThigh: -.3 * MX(0, -SI(gn * 1.5)), lKnee: .4 * hop, rKnee: .4 * MX(0, -SI(gn * 1.5))});

        Object.assign(q, {lArm: .7 + .4 * st, rArm: .7 - .4 * st, lElb: -.4, rElb: -.4, sway: .25 * st, lean: .12 * st, headTilt: .25 * SI(gn * 1.5)});
        break
      }
      case 'piring': {

        const pi = tt * 3.5; const st = SI(pi); Object.assign(q, {bob: -.02 + .03 * AB(SI(pi * 2)), lThigh: -.15 + .25 * MX(0, st), rThigh: -.15 + .25 * MX(0, -st), lKnee: .2 * MX(0, st), rKnee: .2 * MX(0, -st)});

        Object.assign(q, {lArm: 1.1 + .15 * st, rArm: 1.1 - .15 * st, lElb: -.3, rElb: -.3, sway: .12 * st, lean: .04, headTilt: .08 * st});
        break
      }
      case 'pangalay': {

        const pg = tt * 2.2; const st = SI(pg); const wave = SI(pg * 2); Object.assign(q, {bob: .04, lThigh: -.35, rThigh: -.35, lKnee: .5, rKnee: .5, lShin: .3, rShin: .3});

        Object.assign(q, {lArm: .9 + .2 * wave, rArm: .9 - .2 * wave, lElb: -.5 + .15 * st, rElb: -.5 - .15 * st, sway: .08 * st, lean: .06, headTilt: .12 * st});
        break
      }
      case 'kartuli': {

        const kt = tt * 1.8; const st = SI(kt); Object.assign(q, {bob: -.01 + .02 * AB(SI(kt * 2)), lThigh: -.1 + .15 * MX(0, st), rThigh: -.1 + .15 * MX(0, -st), lKnee: .1, rKnee: .1, lShin: .08, rShin: .08});

        Object.assign(q, {lArm: 1.25 + .1 * st, rArm: 1.25 - .1 * st, lElb: -.15, rElb: -.15, sway: .05 * st, lean: .1, headTilt: .04 * st});
        break
      }
      case 'lazgi': {

        const lz = tt * 5; const st = SI(lz); const flick = SI(lz * 3); Object.assign(q, {bob: -.02 + .02 * AB(flick), lThigh: -.1 + .1 * st, rThigh: -.1 - .1 * st, lKnee: .15, rKnee: .15});

        Object.assign(q, {lArm: .8 + .3 * st, rArm: .8 - .3 * st, lElb: -.3 + .2 * flick, rElb: -.3 - .2 * flick, sway: .1 * st, lean: .05, headTilt: .2 * flick});
        break
      }
      case 'springar': {

        const sp = tt * 3; const st = SI(sp); const trip = SI(sp * 1.5); Object.assign(q, {bob: -.015 + .03 * AB(trip), lThigh: -.1 + .2 * MX(0, st), rThigh: -.1 + .2 * MX(0, -st), lKnee: .15 * MX(0, st), rKnee: .15 * MX(0, -st), lShin: .1 * MX(0, st), rShin: .1 * MX(0, -st)});

        Object.assign(q, {lArm: .2 + .1 * st, rArm: .2 - .1 * st, lElb: -.25, rElb: -.25, sway: .12 * st, lean: .06, headTilt: .06 * st});
        break
      }
      case 'ganggang': {

        const gg = tt * 2.8; const st = SI(gg); const bounce = AB(SI(gg * 1.5)); Object.assign(q, {bob: -.03 * bounce, lThigh: -.12 * bounce, rThigh: -.12 * (1 - bounce), lKnee: .18 * bounce, rKnee: .18 * (1 - bounce)});

        Object.assign(q, {lArm: 1.2 + .15 * st, rArm: 1.2 - .15 * st, lElb: -.2, rElb: -.2, sway: .15 * st, lean: .05 * st, headTilt: .1 * st});
        break
      }
      case 'biyelgee': {

        const bi = tt * 2.5; const st = SI(bi); const chest = SI(bi * 2); Object.assign(q, {bob: .05, lThigh: -.45, rThigh: -.45, lKnee: .5, rKnee: .5, lShin: .35, rShin: .35});

        Object.assign(q, {lArm: .55 + .2 * st, rArm: .55 - .2 * st, lElb: -.5 + .15 * chest, rElb: -.5 - .15 * chest, sway: .08 * st, lean: .08 + .04 * chest, headTilt: .06 * st});
        break
      }
      case 'saidi': {

        const sd = tt * 3; const st = SI(sd); const strike = SI(sd * 2); q.bob = -.015 + .02 * AB(strike);
        Object.assign(q, {lThigh: -.3, rThigh: -.3, lKnee: .35, rKnee: .35});
        Object.assign(q, {lArm: 1.1 + .25 * st, rArm: .4 - .3 * MX(0, strike), lElb: -.25, rElb: -.5 + .2 * strike, sway: .12 * st, lean: .1 + .05 * strike, headTilt: .07 * st});
        break
      }
      case 'horon': {

        const hr = tt * 5; const st = SI(hr); const tremble = SI(hr * 4); q.bob = -.01 + .02 * AB(st);

        Object.assign(q, {lThigh: -.15 + .2 * MX(0, st), rThigh: -.15 + .2 * MX(0, -st), lKnee: .2 + .15 * AB(st), rKnee: .2 + .15 * AB(st)});
        Object.assign(q, {lArm: .95 + .08 * tremble, rArm: .95 - .08 * tremble, lElb: -.1, rElb: -.1, sway: .1 * st, lean: .04 * tremble, headTilt: .05 * tremble});
        break
      }
      case 'jarabe': {

        const jb = tt * 2.6; const st = SI(jb); const tap = SI(jb * 2); q.bob = -.015 + .025 * AB(tap);
        Object.assign(q, {lThigh: -.25 * MX(0, tap), rThigh: -.25 * MX(0, -tap), lKnee: .3 * MX(0, tap), rKnee: .3 * MX(0, -tap)});
        Object.assign(q, {lArm: 1.05 + .12 * st, rArm: .35 - .1 * st, lElb: -.55, rElb: -.6, sway: .14 * st, lean: .08 * st, headTilt: .09 * st});
        break
      }
      case 'frevo': {

        const fv = tt * 4.5; const st = SI(fv); const kick = SI(fv * 2); const leap = MX(0, SI(fv * 1.5)); q.bob = -.02 - .07 * leap;

        Object.assign(q, {lThigh: -.2 - .5 * MX(0, kick), rThigh: -.2 - .5 * MX(0, -kick), lKnee: .25 + .3 * MX(0, -kick), rKnee: .25 + .3 * MX(0, kick), lShin: .35, rShin: .35});
        Object.assign(q, {lArm: 1.15 + .15 * st, rArm: .6 - .3 * st, lElb: -.2, rElb: -.35, sway: .2 * st, lean: .12 * st, headTilt: .1 * st});break
      }
      case 'siva': {

        const sv = tt * 1.8; const st = SI(sv); const wave = SI(sv * 2); q.bob = -.01 + .02 * AB(st);
        Object.assign(q, {lThigh: -.12 + .1 * st, rThigh: -.12 - .1 * st, lKnee: .15, rKnee: .15});
        Object.assign(q, {lArm: .7 + .35 * wave, rArm: .7 - .35 * wave, lElb: -.4 - .2 * wave, rElb: -.4 + .2 * wave, sway: .18 * st, lean: .06 * st, headTilt: .12 * st});break
      }
      case 'gorshey': {

        const gs = tt * 2.4; const st = SI(gs); const flap = SI(gs * 1.5); q.bob = -.02 + .03 * AB(flap);
        Object.assign(q, {lThigh: -.1 + .18 * MX(0, st), rThigh: -.1 + .18 * MX(0, -st), lKnee: .2 + .1 * AB(st), rKnee: .2 + .1 * AB(st)});
        Object.assign(q, {lArm: .8 + .4 * flap, rArm: .8 - .4 * flap, lElb: -.3 - .15 * flap, rElb: -.3 + .15 * flap, sway: .16 * st, lean: .07 * st, headTilt: .08 * st});
        break
      }
      case 'seannos': {

        const sn = tt * 3.4; const st = SI(sn); const batter = SI(sn * 3); Object.assign(q, {bob: .05 + .03 * AB(batter), lThigh: -.15 + .2 * MX(0, batter), rThigh: -.15 + .2 * MX(0, -batter), lKnee: .3, rKnee: .3, lShin: -.05 + .15 * MX(0, -batter), rShin: -.05 + .15 * MX(0, batter)});

        Object.assign(q, {lArm: .12 + .06 * st, rArm: .12 - .06 * st, lElb: -.08, rElb: -.08, sway: .14 * st, lean: .05, headTilt: .08 * batter});break
      }
      case 'salegy': {

        const sy = tt * 4.5; const st = SI(sy); const hop = SI(sy * 2); Object.assign(q, {bob: -.01 - .03 * AB(hop), lThigh: -.12 + .15 * MX(0, st), rThigh: -.12 + .15 * MX(0, -st), lKnee: .18, rKnee: .18});
        q.sway = .2 * st; q.lean = .08 * st;
        Object.assign(q, {lArm: .45 + .3 * MX(0, hop), rArm: .45 + .3 * MX(0, -hop), lElb: -.5, rElb: -.5, headTilt: .1 * st});break
      }
      case 'otea': {

        const ot = tt * 3; const shimmy = S(9); const st = SI(ot); Object.assign(q, {bob: .04 + .015 * AB(shimmy), lThigh: -.3, rThigh: -.3, lKnee: .35, rKnee: .35, lShin: .05, rShin: .05});

        q.sway = .12 * shimmy; q.lean = .03;
        Object.assign(q, {lArm: .95 + .1 * st, rArm: .95 - .1 * st, lElb: -.7, rElb: -.7, headTilt: .05 * shimmy});break
      }
      case 'meke': {

        const mk = tt * 3.2; const st = SI(mk); const thrust = SI(mk * 2); Object.assign(q, {bob: -.02 - .04 * AB(st), lThigh: -.25 + .2 * MX(0, st), rThigh: -.25 + .2 * MX(0, -st), lKnee: .3, rKnee: .3});

        Object.assign(q, {lArm: 1.05 + .1 * st, lElb: -.15, rArm: .35 + .5 * MX(0, thrust), rElb: -.4 + .2 * MX(0, -thrust), sway: .15 * st, lean: .1, headTilt: .06 * st});
        break
      }
      case 'singsing': {

        const sg = tt * 4; const jump = AB(SI(sg)); const thrust = SI(sg * 1.5); Object.assign(q, {bob: -.02 - .06 * jump, lThigh: -.3 - .15 * jump, rThigh: -.3 - .15 * jump, lKnee: .35, rKnee: .35, lShin: -.1, rShin: -.1});

        Object.assign(q, {lArm: 1.0 + .15 * thrust, rArm: 1.0 - .15 * thrust, lElb: -.25, rElb: -.25, sway: .12 * SI(sg * .7), lean: .12, headTilt: .07 * thrust});
        break
      }
      case 'lakalaka': {

        const lk = tt * 2.6; const st = SI(lk); const gesture = SI(lk * 2); Object.assign(q, {bob: .01 + .02 * AB(st), lThigh: -.08, rThigh: -.08, lKnee: .1, rKnee: .1});

        Object.assign(q, {lArm: .6 + .45 * MX(0, gesture), rArm: .6 + .45 * MX(0, -gesture), lElb: -.35 - .1 * gesture, rElb: -.35 + .1 * gesture, sway: .1 * st, lean: .04, headTilt: .06 * st});
        break
      }
      case 'toka': {

        const tk = tt * 3; const stamp = SI(tk * 2); const st = SI(tk); Object.assign(q, {bob: .04 + .05 * AB(stamp), lThigh: -.25 + .3 * MX(0, stamp), rThigh: -.25 + .3 * MX(0, -stamp), lKnee: .35, rKnee: .35, lShin: -.15 * MX(0, -stamp), rShin: -.15 * MX(0, stamp)});

        Object.assign(q, {lArm: .5 + .2 * st, rArm: .5 - .2 * st, lElb: -.45, rElb: -.45, sway: .18 * st, lean: .08, headTilt: .09 * st});
        break
      }
      case 'vira': {

        const vr = tt * 5; const st = SI(vr); const step = SI(vr * 3); Object.assign(q, {bob: .03 + .02 * AB(st), lThigh: -.15 + .2 * MX(0, step), rThigh: -.15 + .2 * MX(0, -step), lKnee: .22, rKnee: .22, lShin: -.08 * MX(0, -step), rShin: -.08 * MX(0, step)});

        Object.assign(q, {lArm: .9 + .15 * st, rArm: .9 - .15 * st, lElb: -.2, rElb: -.2, sway: .22 * st, lean: .06, headTilt: .1 * st});
        break
      }
      case 'yarkhushta': {

        const yk = tt * 3.4; const stamp2 = SI(yk * 2); const st = SI(yk); Object.assign(q, {bob: .05 + .05 * AB(stamp2), lThigh: -.3 + .35 * MX(0, stamp2), rThigh: -.3 + .35 * MX(0, -stamp2), lKnee: .4, rKnee: .4, lShin: -.12 * MX(0, -stamp2), rShin: -.12 * MX(0, stamp2)});

        Object.assign(q, {lArm: .28 + .08 * st, rArm: .28 - .08 * st, lElb: -.15, rElb: -.15, sway: .14 * st, lean: .1, headTilt: .05 * st});
        break
      }
      case 'yalli': {

        const yl = tt * 2.8; const st = SI(yl); const wave = SI(yl * 1.4); Object.assign(q, {bob: .02 + .02 * AB(st), lThigh: -.12 + .1 * MX(0, wave), rThigh: -.12 + .1 * MX(0, -wave), lKnee: .18, rKnee: .18});

        Object.assign(q, {lArm: .22 + .06 * st, rArm: .22 - .06 * st, lElb: -.12, rElb: -.12, sway: .16 * st, lean: .05 * wave, headTilt: .05 * st});
        break
      }
      case 'ardha': {

        const ad = tt * 2.8; const st = SI(ad); const raise = SI(ad * 1.5); Object.assign(q, {bob: .03 + .025 * AB(st), lThigh: -.1 + .08 * MX(0, st), rThigh: -.1 + .08 * MX(0, -st), lKnee: .15, rKnee: .15});

        Object.assign(q, {lArm: .35 + .1 * st, rArm: 1.05 + .1 * raise, lElb: -.2, rElb: -.1, sway: .1 * st, lean: .07, headTilt: .06 * st});
        break
      }
      case 'stambeli': {

        const sb = tt * 3.2; const st = SI(sb); const trance = SI(sb * 1.7); Object.assign(q, {bob: .035 + .03 * AB(trance), lThigh: -.18, rThigh: -.18, lKnee: .28, rKnee: .28});

        Object.assign(q, {lArm: .55 + .12 * trance, rArm: .55 - .12 * trance, lElb: -.3, rElb: -.3, sway: .15 * st, lean: .1, headTilt: .12 * trance});
        break
      }
      case 'ondunda': {

        const od = tt * 3.6; const st = SI(od); const clap2 = SI(od * 2); Object.assign(q, {bob: .03 + .02 * AB(st), lThigh: -.12 + .18 * MX(0, clap2), rThigh: -.12 + .18 * MX(0, -clap2), lKnee: .2, rKnee: .2, lShin: -.1 * MX(0, -clap2), rShin: -.1 * MX(0, clap2)});

        Object.assign(q, {lArm: .45 + .2 * MX(0, clap2), rArm: .45 + .2 * MX(0, -clap2), lElb: -.5, rElb: -.5, sway: .1 * st, lean: .06, headTilt: .07 * st});
        break
      }
      case 'lamvong': {

        const lv = tt * 2.2; const st = SI(lv); const gl = SI(lv * 1.3); Object.assign(q, {bob: .018 + .015 * AB(st), lThigh: -.08 + .06 * MX(0, gl), rThigh: -.08 + .06 * MX(0, -gl), lKnee: .12, rKnee: .12});

        Object.assign(q, {lArm: .4 + .15 * SI(lv * 1.5), rArm: .4 - .15 * SI(lv * 1.5), lElb: -.35 + .1 * st, rElb: -.35 - .1 * st, sway: .12 * st, lean: .05 * st, headTilt: .08 * SI(lv * 1.3 + .5)});
        break
      }
      case 'still': break;
      default:
        Object.assign(q, {bob: .012 * S(2), lean: .02 * SI(tt), lArm: .1 + .05 * S(1.3), rArm: .1 - .05 * S(1.3), headTilt: .06 * S(.7)})}
    return q
  }

  function skeleton(p, q) {
    const legFrac = .40 + .13 * p.legLen; const headR = .055 + .05 * p.headSize; const neck = .03; const torsoTop = legFrac + MX(.12, 1 - legFrac - 2 * headR - neck); const shY = torsoTop - .04; const shHalf = .09 + .11 * p.shoulder; const armLen = .30 + .16 * p.armLen; const hipHalf = shHalf * .55;
    const K = {};

    const legL = legFrac / 2;
    for (const [side, hipX, thA, knA, shn] of [['l', -hipHalf, q.lThigh, q.lKnee, q.lShin || 0], ['r', hipHalf, q.rThigh, q.rKnee, q.rShin || 0]]) {
      const hx = hipX, hy = legFrac; const kx = hx + SI(thA) * legL, ky = hy - CO(thA) * legL; const shA = thA - knA + shn; const ax = kx + SI(shA) * legL, ay = ky - CO(shA) * legL; K[side + 'Hip'] = [hx, hy]; K[side + 'Knee'] = [kx, ky]; K[side + 'Ank'] = [ax, MX(.015, ay)]
    }

    const up = armLen / 2;
    for (const [side, sgn, aA, eA] of [['l', -1, q.lArm, q.lElb], ['r', 1, q.rArm, q.rElb]]) {
      const sx = sgn * shHalf, sy = shY; const ex = sx + sgn * SI(aA) * up, ey = sy - CO(aA) * up; const fa = aA - eA * sgn; const wx = ex + sgn * SI(fa) * up, wy = ey - CO(fa) * up; K[side + 'Sh'] = [sx, sy]; K[side + 'Elb'] = [ex, ey]; K[side + 'Wri'] = [wx, wy]
    }
    K.neckB = [0, torsoTop - .01]; K.neckT = [0, torsoTop + neck * .6]; K.headC = [SI(q.headTilt + (p.headTilt - .5) * .5) * headR, torsoTop + neck + headR]; K.pelvis = [0, legFrac + .02]; K.torsoTop = [0, torsoTop]; K.headR = headR; K.shHalf = shHalf; K.hipHalf = hipHalf;
    return K
  }

  function capsule(ctx, x1, y1, x2, y2, w, col, line) {
      const lC=v=>ctx.lineCap = v, SS=v=>ctx.strokeStyle = v, lnW=v=>ctx.lineWidth = v;
    lC('round');
    if (line > 0) {
      SS('rgba(40,44,54,.85)'); lnW(w + line); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    }
    SS(col); lnW(w); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  }

  function contactShadow(ctx, cx, baseY, rx, alpha, col) {
      const FS=v=>ctx.fillStyle = v;
    if (alpha <= 0 || rx <= 0) return;
    const g = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, rx);
    g.addColorStop(0, col || `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); FS(g); ctx.translate(cx, baseY); ctx.scale(1, .24); ctx.translate(-cx, -baseY); ctx.beginPath(); ctx.arc(cx, baseY, rx, 0, 7); ctx.fill(); ctx.restore()
  }

  function heartPath(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * .6); ctx.bezierCurveTo(x - s * 1.1, y - s * .3, x - s * .55, y - s * 1.05, x, y - s * .35); ctx.bezierCurveTo(x + s * .55, y - s * 1.05, x + s * 1.1, y - s * .3, x, y + s * .6); ctx.closePath()
  }

  function drawGlow(ctx, silCanvas, wPix, hPix, cx, baseY, strength) {
      const gA=v=>ctx.globalAlpha = v, flT=v=>ctx.filter = v;
    if (strength <= 0) return;
    ctx.save(); gA(strength * .55);
    flT(`blur(${RD(4 + strength * 14)}px)`);
    ctx.drawImage(silCanvas, cx - wPix * .56, baseY - hPix * 1.06, wPix * 1.12, hPix * 1.12); ctx.restore()
  }

  function drawReflection(ctx, src, cx, baseY, wPix, hPix, strength) {
      const gA=v=>ctx.globalAlpha = v;
    if (strength <= 0) return;
    ctx.save(); gA(strength * .38); ctx.translate(cx, baseY); ctx.scale(1, -1); ctx.drawImage(src, -wPix / 2, -hPix, wPix, hPix); ctx.restore()
  }

  function drawMannequin(ctx, p, t, cx, baseY, hPix) {
      const mir=f=>[-1,1].forEach(f);
      const span = (a, b, f) => { for (let i = a; i <= b; i++) f(i) }, spt = (a, b, f) => { for (let i = a; i < b; i++) f(i) };
      const plF=(...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }); fL() }, plS=(...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }); sK() };
      const lC=v=>ctx.lineCap = v, FS=v=>ctx.fillStyle = v, SS=v=>ctx.strokeStyle = v, lnW=v=>ctx.lineWidth = v;
      const bP=()=>ctx.beginPath(), cP=()=>ctx.closePath(), mT=(x,y)=>ctx.moveTo(x,y), lT=(x,y)=>ctx.lineTo(x,y), qT=(a,b,c,d)=>ctx.quadraticCurveTo(a,b,c,d), aR=(x,y,r,s,e)=>ctx.arc(x,y,r,s,e), eC=(x,y,rx,ry,o,s,e)=>ctx.ellipse(x,y,rx,ry,o,s,e), fR=(x,y,w,h)=>ctx.fillRect(x,y,w,h), fL=()=>ctx.fill(), sK=()=>ctx.stroke(), sV=()=>ctx.save(), rS=()=>ctx.restore(), tR=(x,y)=>ctx.translate(x,y), sC=(x,y)=>ctx.scale(x,y), gA=v=>ctx.globalAlpha = v;
      const dot = (x, y, r) => { bP(); aR(x, y, r, 0, 7); fL() };
      const dots = (x, y, r) => { bP(); aR(x, y, r, 0, 7); sK() };
      const ell = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); fL() };
      const ells = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); sK() };
    const q = mannequinPose(p, t); const K = skeleton(p, q); const g = 1 - p.tone * .55;

    const hue = RD(p.clothHue * 360), sat = p.clothHue < .03 ? 0 : 55;
    const col = `hsl(${hue},${sat}%,${RD(96 * g)}%)`;
    const shade = `hsl(${hue},${sat}%,${RD(85 * g)}%)`;
    const lw = (.5 + p.line * 4);
    const px = (x, y) => [cx + (x + q.sway) * hPix, baseY - (y + q.bob) * hPix];
    const limbW = hPix * (.045 + .02 * p.shoulder); const bodyW = hPix * (.10 + .06 * p.shoulder);

    contactShadow(ctx, cx, baseY, hPix * (.16 + .07 * p.shoulder), p.shadow * .5, `hsla(${RD((p.shadowHue == null ? .62 : p.shadowHue) * 360)},45%,12%,${p.shadow * .5})`);

    sV(); gA(p.opacity);
    if (p.flip) { tR(2 * cx, 0); sC(-1, 1) }

    if (p.acc === 'cape') {
      const cs = `hsla(${hue},${MX(sat, 45)}%,${RD(38 + 12 * g)}%,.95)`;
      const sw = (q.lean * 2 + SI(t * 1.8) * .05) * hPix; const [lShx, lShy] = px(...K.lSh), [rShx, rShy] = px(...K.rSh), [pelx, pely] = px(...K.pelvis); FS(cs); bP(); mT(lShx, lShy); qT(lShx - bodyW + sw, pely + hPix * .06, pelx + sw * 1.5, pely + hPix * .3); qT(rShx + bodyW + sw, pely + hPix * .06, rShx, rShy); cP(); cP(); fL()
    }

    for (const s of ['l', 'r']) {
      const [h, k, a] = [K[s + 'Hip'], K[s + 'Knee'], K[s + 'Ank']]; capsule(ctx, ...px(...h), ...px(...k), limbW, shade, lw); capsule(ctx, ...px(...k), ...px(...a), limbW * .85, col, lw); const [ax, ay] = px(...a); capsule(ctx, ax, ay, ax + limbW * .8, ay, limbW * .5, shade, lw)
    }

    capsule(ctx, ...px(...K.pelvis), ...px(...K.torsoTop), bodyW, col, lw);

    for (const s of ['l', 'r']) {
      const [sh, el, wr] = [K[s + 'Sh'], K[s + 'Elb'], K[s + 'Wri']]; capsule(ctx, ...px(...sh), ...px(...el), limbW * .8, col, lw); capsule(ctx, ...px(...el), ...px(...wr), limbW * .7, shade, lw); const [wx, wy] = px(...wr); FS(shade); dot(wx,wy,limbW * .55)
    }

    capsule(ctx, ...px(...K.neckB), ...px(...K.neckT), limbW * .7, col, lw); const [hx, hy] = px(...K.headC), hr = K.headR * hPix;

    const hs = p.hair || 'none';
    const hairC = `hsl(${RD(p.hairHue * 360)},50%,${RD(26 + 16 * g)}%)`;
    if (hs === 'long' || hs === 'twin' || hs === 'bob') {

      FS(hairC); ell(hx,hy + hr * .5,hr * 1.22,hr * (hs === 'long' ? 1.55 : hs === 'bob' ? .95 : .75),0);
      if (hs === 'twin') mir(s => {
        ell(hx + s * hr * 1.18,hy + hr * .75,hr * .3,hr * .8,s * .4)
      })
    }
    FS(col);
    if (lw > 0) { SS('rgba(40,44,54,.85)'); lnW(lw) }
    dot(hx,hy,hr);
    if (lw > 0) sK();
    if (hs === 'pony') {

      FS(hairC); bP(); mT(hx + hr * .55, hy - hr * .95); qT(hx + hr * 1.55, hy - hr * .55, hx + hr * 1.35, hy + hr * .95); qT(hx + hr * .9, hy + hr * .45, hx + hr * .75, hy - hr * .5); cP(); cP(); fL(); bP(); bP(); aR(hx + hr * .52, hy - hr * .82, hr * .16, 0, 7); dot(hx + hr * .52,hy - hr * .82,hr * .16)
    }
    if (hs === 'mush') {

      FS(hairC); bP(); aR(hx, hy - hr * .18, hr * 1.14, PI, PI * 2); qT(hx + hr * 1.14, hy + hr * .28, hx + hr * .9, hy + hr * .3); lT(hx - hr * .9, hy + hr * .3); qT(hx - hr * 1.14, hy + hr * .28, hx - hr * 1.14, hy - hr * .18); cP(); cP(); fL()
    }
    if (hs === 'curly') {

      FS(hairC); const rng2 = mulberry32(31);
      spt(0, 14, i => {
        const a = PI + (i / 13) * PI; const rr = hr * (1.02 + rng2() * .18); dot(hx + CO(a) * rr,hy - hr * .05 + SI(a) * rr,hr * (.3 + rng2() * .14))
      })
    }
    if (hs === 'braid') {

      FS(hairC); const bx = hx + hr * .8, by = hy - hr * .1;
      spt(0, 6, k => {
        ell(bx + ((k % 2) ? .07 : -.07) * hr,by + k * hr * .32,hr * .19,hr * .22,0)
      })
      FS('rgba(52,56,68,.95)'); fR(bx - hr * .1, by + 6 * hr * .32 - hr * .06, hr * .2, hr * .1)
    }
    if (hs === 'pomp') {

      FS(hairC); bP(); mT(hx - hr * .85, hy - hr * .45); qT(hx - hr * .7, hy - hr * 1.7, hx + hr * .25, hy - hr * 1.5); qT(hx + hr * .95, hy - hr * 1.3, hx + hr * .9, hy - hr * .4); lT(hx + hr * .5, hy - hr * .55); lT(hx - hr * .4, hy - hr * .5); cP(); cP(); fL()
    }
    if (hs === 'odango') {

      FS(hairC);
      mir(s => {
        dot(hx + s * hr * .8,hy - hr * .85,hr * .34)
      })
    }
    if (hs === 'ahoge') {

      SS(hairC); lnW(MX(1.5, hr * .09)); lC('round'); plS([hx + hr * .08, hy - hr * 1.02],[hx + hr * .55, hy - hr * 1.9, hx + hr * .85, hy - hr * 1.35])
    }
    if (hs === 'mohawk') {

      FS(hairC); ell(hx,hy - hr * 1.05,hr * .24,hr * .5,0)
    }
    if (hs !== 'none' && hs !== 'mohawk') {

      FS(hairC); bP(); aR(hx, hy, hr * 1.1, PI * 1.02, PI * 1.98); lT(hx + hr * .95, hy - hr * .18); lT(hx + hr * .6, hy - hr * .38); lT(hx + hr * .22, hy - hr * .12); lT(hx - hr * .18, hy - hr * .38); lT(hx - hr * .55, hy - hr * .12); lT(hx - hr * .95, hy - hr * .38); cP(); cP(); fL()
    }

    const eo = MX(.12, blinkOpen(t, p.seed));
    const eyeCol = `hsla(${RD(p.eyeHue * 360)},65%,42%,.9)`;
    const es = p.eyeStyle || 'dot'; const esz = .6 + p.eyeSize * .8;
    mir(s => {
      const ex = hx + s * hr * (.26 + .24 * (p.eyeGap == null ? .5 : p.eyeGap)), ey = hy - hr * .08;
      if (es === 'closed' || (es === 'wink' && s === 1)) {
        SS('rgba(60,64,74,.85)'); lnW(MX(1, hr * .08 * esz)); bP(); aR(ex, ey, hr * .13 * esz, .15 * PI, .85 * PI); sK()
      } else if (es === 'sharp') {

        SS(eyeCol); lnW(MX(1, hr * .07 * esz)); plS([ex + s * hr * .16 * esz, ey - hr * .05 * esz],[ex - s * hr * .16 * esz, ey + hr * .09 * esz])
      } else if (es === 'heart') {
        FS(eyeCol); heartPath(ctx, ex, ey, hr * .15 * esz); fL()
      } else if (es === 'star') {

        FS(eyeCol); bP(); const sr = hr * .17 * esz;
        spt(0, 10, k => {
          const a = -PI / 2 + k * PI / 5, rr = k % 2 ? sr * .45 : sr; const mx = ex + CO(a) * rr, my2 = ey + SI(a) * rr; k ? lT(mx, my2) : mT(mx, my2)
        })
        cP(); fL()
      } else if (es === 'wide') {

      FS('rgba(255,255,255,.95)'); bP(); bP(); aR(ex - eo, ey, esz * .62 * eo, 0, 7); dot(ex - eo,ey,esz * .62 * eo); bP(); bP(); aR(ex + eo, ey, esz * .62 * eo, 0, 7); dot(ex + eo,ey,esz * .62 * eo); FS(eyeCol); bP(); bP(); aR(ex - eo, ey, esz * .3 * eo, 0, 7); dot(ex - eo,ey,esz * .3 * eo); bP(); bP(); aR(ex + eo, ey, esz * .3 * eo, 0, 7); dot(ex + eo,ey,esz * .3 * eo)
    } else if (es === 'cat') {

        FS(eyeCol); ell(ex,ey,MX(.8, hr * .045 * esz),MX(1, hr * .15 * esz * MX(.15, eo)),0)
      } else if (es === 'xx') {

        SS(eyeCol); lnW(MX(1.2, hr * .05 * esz)); const rr = hr * .13 * esz; bP(); mT(ex - rr, ey - rr); mT(ex - rr, ey - rr); lT(ex + rr, ey + rr); mT(ex + rr, ey - rr); mT(ex + rr, ey - rr); lT(ex - rr, ey + rr); sK()
      } else if (es === 'dizzy') {

        SS(eyeCol); lnW(MX(1, hr * .06 * esz)); bP(); const dr = hr * .16 * esz;
        spt(0, 8, k => {
          const a = k * 1.05, r2 = dr * (1 - k / 10); const mx = ex + CO(a) * r2, my2 = ey + SI(a) * r2; k ? lT(mx, my2) : mT(mx, my2)
        })
        sK()
      } else if (es === 'crying') {

        FS(eyeCol); ell(ex,ey,MX(1, hr * .09 * esz),MX(.5, hr * .09 * esz * eo),0); FS('rgba(130,175,255,.85)'); const tx2 = ex + s * hr * .14, ty2 = ey + hr * .16; plF([tx2, ty2 - hr * .05],[tx2 + hr * .07, ty2 + hr * .02, tx2, ty2 + hr * .09],[tx2 - hr * .07, ty2 + hr * .02, tx2, ty2 - hr * .05])
      } else {
        FS(eyeCol); bP();

        const gx = ex + ((p.gaze == null ? .5 : p.gaze) - .5) * hr * .3; eC(gx, ey, MX(1, hr * .09 * esz), MX(.5, hr * .09 * esz * eo), 0, 0, 7); fL();

        if (eo > .4) {
          FS(`rgba(255,255,255,${.85 * eo})`);
          dot(gx - hr * .03 * esz,ey - hr * .035 * esz * eo,MX(.6, hr * .028 * esz))
        }
      }
    })

    const bt = (p.brow - .5) * hr * .3;
    if (AB(bt) > hr * .02) {
      SS('rgba(60,64,74,.8)'); lnW(MX(1, hr * .07));
      mir(s => {
        const by = hy - hr * .36; plS([hx + s * hr * .18, by + bt],[hx + s * hr * .56, by - bt * .3])
      })
    }

    if (p.blush > .02) {
      FS(`rgba(255,120,140,${p.blush * .4})`);
      mir(s => {
        ell(hx + s * hr * .55,hy + hr * .18,hr * .16,hr * .09,0)
      })
    }

    const mw = hr * .32, my = hy + hr * .38, curv = (p.smile - .5) * hr * .8;
    if (AB(curv) > hr * .03) {
      SS('rgba(60,64,74,.7)'); lnW(MX(1, hr * .07)); bP(); plS([hx - mw, my],[hx, my + curv * 2, hx + mw, my],[hx, my + curv * 2, hx + mw, my])
    }

    if (p.anim === 'talk') {
      const mo = AB(SI(t * 5.5));
      FS(`rgba(120,40,45,${.55 * mo})`);
      ell(hx,my + curv * 1.1,mw * .45,MX(1, hr * .11 * mo),0)
    } else if (p.smile > .78) {

      const op = (p.smile - .78) / .22;
      FS(`rgba(120,40,45,${.55 * op})`);
      ell(hx,my + curv * 1.1,mw * .5,MX(1, hr * .1 * op),0)
    }
    drawAccessory(ctx, p.acc, hx, hy, hr, p.accHue);
    if (p.acc2 && p.acc2 !== 'none' && p.acc2 !== p.acc) drawAccessory(ctx, p.acc2, hx, hy, hr, p.accHue);
    rS()
  }

  function drawBubble(c, text, x, topY, W, H, hue) {
      const lnW=v=>c.lineWidth = v, fT=v=>c.font = v, tA=v=>c.textAlign = v, FS=v=>c.fillStyle = v, SS=v=>c.strokeStyle = v;
    if (!text) return;
    const fs = MX(13, RD(H * .03)); c.save();
    fT(`600 ${fs}px "Hiragino Sans","Segoe UI",sans-serif`);
    const tw = MN(c.measureText(text).width, W * .6); const bw = tw + fs * 1.4, bh = fs * 2; const bx = MN(MX(x - bw / 2, 6), W - bw - 6); const by = MX(6, topY - bh - fs * 1.2); const r = fs * .5;
    FS(`hsla(${RD((hue == null ? 0 : hue) * 360)},60%,96%,.94)`);
    SS('rgba(40,44,54,.8)'); lnW(MX(1, fs * .08)); c.beginPath(); c.moveTo(bx + r, by); c.lineTo(bx + bw - r, by); c.lineTo(bx + bw - r, by); c.quadraticCurveTo(bx + bw, by, bx + bw, by + r); c.lineTo(bx + bw, by + bh - r); c.lineTo(bx + bw, by + bh - r); c.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh); c.lineTo(bx + r, by + bh); c.lineTo(bx + r, by + bh); c.quadraticCurveTo(bx, by + bh, bx, by + bh - r); c.lineTo(bx, by + r); c.lineTo(bx, by + r); c.quadraticCurveTo(bx, by, bx + r, by); c.closePath();

    const tx = MN(MX(x, bx + fs), bx + bw - fs); c.moveTo(tx - fs * .3, by + bh - 1); c.lineTo(tx + fs * .3, by + bh - 1); c.lineTo(x, topY - fs * .2); c.closePath(); c.fill(); c.fill(); c.stroke(); FS('#22252e'); tA('center'); c.textBaseline = 'middle'; c.fillText(text, bx + bw / 2, by + bh / 2, tw + fs); c.restore()
  }

  function shined(src, sctx, cv, t, amt) {
    cv.width = MX(2, src.width); cv.height = MX(2, src.height); sctx.clearRect(0, 0, cv.width, cv.height); sctx.drawImage(src, 0, 0, cv.width, cv.height); sctx.globalCompositeOperation = 'source-atop'; const ph = ((t * .45) % 2) - .5; const gr = sctx.createLinearGradient(cv.width * (ph - .28), 0, cv.width * ph, cv.height * .65); gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.5, `rgba(255,255,255,${.6 * amt})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)'); sctx.fillStyle = gr; sfR(0, 0, cv.width, cv.height); sctx.globalCompositeOperation = 'source-over';
    return cv
  }

  function drawParticles(ctx, W, H, type, t, seed) {
      const span = (a, b, f) => { for (let i = a; i <= b; i++) f(i) }, spt = (a, b, f) => { for (let i = a; i < b; i++) f(i) };
      const plS=(...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }); sK() };
      const FS=v=>ctx.fillStyle = v, tA=v=>ctx.textAlign = v, lnW=v=>ctx.lineWidth = v, SS=v=>ctx.strokeStyle = v, fT=v=>ctx.font = v;
      const bP=()=>ctx.beginPath(), mT=(x,y)=>ctx.moveTo(x,y), lT=(x,y)=>ctx.lineTo(x,y), qT=(a,b,c,d)=>ctx.quadraticCurveTo(a,b,c,d), aR=(x,y,r,s,e)=>ctx.arc(x,y,r,s,e), eC=(x,y,rx,ry,o,s,e)=>ctx.ellipse(x,y,rx,ry,o,s,e), fR=(x,y,w,h)=>ctx.fillRect(x,y,w,h), fL=()=>ctx.fill(), sK=()=>ctx.stroke(), sV=()=>ctx.save(), rS=()=>ctx.restore(), tR=(x,y)=>ctx.translate(x,y), rO=a=>ctx.rotate(a);
      const dot = (x, y, r) => { bP(); aR(x, y, r, 0, 7); fL() };
      const dots = (x, y, r) => { bP(); aR(x, y, r, 0, 7); sK() };
      const ell = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); fL() };
      const ells = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); sK() };
    const S = f => SI(t * f), A = f => AB(S(f));
    const h = (i, k) => mulberry32((seed | 0) * 7919 + i * 131 + k)();
    const N = type === 'snow' ? 70 : type === 'petal' ? 34 : type === 'rain' ? 110 : type === 'leaf' ? 30 : type === 'ember' ? 38 : type === 'bubble' ? 28 : type === 'confetti' ? 70 : type === 'firefly' ? 26 : type === 'bokeh' ? 16 : type === 'notes' ? 18 : type === 'hearts' ? 20 : type === 'spark' ? 46 : type === 'wind' ? 14 : 42; sV();
    spt(0, N, i => {
      if (type === 'snow') {
        const x = h(i, 0) * W + SI(t * .8 + h(i, 1) * 7) * W * .02; const y = ((h(i, 1) + t * (.04 + .06 * h(i, 2))) % 1) * H;
        FS(`rgba(255,255,255,${.4 + .5 * h(i, 4)})`);
        dot(x,y,1 + 2.5 * h(i, 3))
      } else if (type === 'sparkle') {
        const a = .25 + .75 * AB(SI(t * (.8 + h(i, 2) * 2.2) + h(i, 3) * 7)); const x = h(i, 0) * W, y = h(i, 1) * H, r = 2 + 4 * h(i, 4);
        SS(`rgba(255,230,140,${a})`); lnW(1);
        bP(); bP(); mT(x - r, y); bP(); mT(x - r, y); lT(x + r, y); mT(x, y - r); mT(x, y - r); lT(x, y + r); mT(x, y - r); lT(x, y + r); sK()
      } else if (type === 'rain') {

        const x = (h(i, 0) + t * .3) % 1 * W; const y = ((h(i, 1) + t * (.5 + .3 * h(i, 2))) % 1) * H;
        SS(`rgba(160,190,235,${.3 + .35 * h(i, 4)})`);
        lnW(1); bP(); mT(x, y); lT(x - 3, y + 9 + 6 * h(i, 3)); sK()
      } else if (type === 'leaf') {

        const x = h(i, 0) * W + SI(t * .7 + h(i, 1) * 8) * W * .06; const y = ((h(i, 1) + t * (.04 + .03 * h(i, 2))) % 1) * H;
        FS(`hsla(${30 + 40 * h(i, 3)},60%,${35 + 25 * h(i, 4)}%,.8)`);
        ell(x,y,2.5 + 2.5 * h(i, 3),1.2 + 1.2 * h(i, 3),SI(t * 1.6 + i * 2) * 1.4)
      } else if (type === 'ember') {

        const x = h(i, 0) * W + SI(t * 1.4 + h(i, 1) * 9) * W * .04; const y = (1 - ((h(i, 1) + t * (.05 + .05 * h(i, 2))) % 1)) * H; const fl = .4 + .6 * AB(SI(t * 3 + i));
        FS(`rgba(255,${120 + 80 * h(i, 3) | 0},60,${fl * .85})`);
        dot(x,y,1 + 1.8 * h(i, 3))
      } else if (type === 'bubble') {

        const x = h(i, 0) * W + SI(t * .9 + h(i, 1) * 8) * W * .05; const y = (1 - ((h(i, 1) + t * (.04 + .04 * h(i, 2))) % 1)) * H;
        SS(`rgba(170,215,255,${.35 + .35 * h(i, 4)})`);
        lnW(1); dots(x,y,2 + 4 * h(i, 3))
      } else if (type === 'confetti') {

        const x = h(i, 0) * W + SI(t * (1 + h(i, 2)) + h(i, 1) * 9) * W * .06; const y = ((h(i, 1) + t * (.1 + .09 * h(i, 2))) % 1) * H;
        FS(`hsla(${RD(h(i, 3) * 360)},85%,62%,${.6 + .3 * h(i, 4)})`);
        sV(); tR(x, y); rO(SI(t * 3 + i * 2.7) * 2.4); fR(-2.5 - 2.5 * h(i, 4), -1.4, 5 + 5 * h(i, 4), 2.8); rS()
      } else if (type === 'firefly') {

        const x = h(i, 0) * W + SI(t * .5 + i * 1.7) * W * .07; const y = h(i, 1) * H * .85 + CO(t * .4 + i * 2.3) * H * .05; const a = MX(0, .15 + .8 * SI(t * (1.2 + h(i, 2)) + h(i, 3) * 9));
        FS(`rgba(200,255,120,${a})`);
        dot(x,y,1.2 + 1.4 * h(i, 3))
      } else if (type === 'spark') {

        const ox = W * (.2 + h(i, 0) * .6), oy = H * (.25 + h(i, 1) * .5); const life = (h(i, 2) + t * (1.5 + h(i, 3))) % 1; const ang = h(i, 4) * 6.283 + i * .7; const dist = life * (14 + 26 * h(i, 1)); const sx = ox + CO(ang) * dist, sy = oy + SI(ang) * dist + life * life * 10;
        SS(`rgba(255,${200 - RD(life * 120)},90,${(1 - life) * .9})`);
        lnW(1.4); plS([sx, sy],[sx - CO(ang) * 5, sy - SI(ang) * 5])
      } else if (type === 'wind') {

        const life = (h(i, 0) + t * (.12 + .1 * h(i, 1))) % 1; const x = (life * 1.3 - .15) * W; const y = h(i, 2) * H + SI(life * 6 + i) * H * .02; const len = W * (.06 + .08 * h(i, 3)); const a = SI(life * PI) * (.25 + .3 * h(i, 4));
        SS(`rgba(255,255,255,${a})`);
        lnW(1.2 + h(i, 3)); plS([x - len, y],[x - len * .5, y - len * .22, x, y],[x + len * .18, y + len * .12, x + len * .3, y + len * .05])
      } else if (type === 'hearts') {

        const x = h(i, 0) * W + SI(t * .7 + i * 2.1) * W * .045; const y = (1 - ((h(i, 1) + t * (.05 + .035 * h(i, 2))) % 1)) * H;
        FS(`hsla(${330 + RD(h(i, 3) * 30)},85%,${62 + RD(h(i, 4) * 12)}%,${.5 + .35 * h(i, 4)})`);
        fT(`${RD(12 + 14 * h(i, 3))}px sans-serif`);
        tA('center'); ctx.fillText('♥', x, y)
      } else if (type === 'notes') {

        const x = h(i, 0) * W + SI(t * .8 + i * 1.7) * W * .04; const y = (1 - ((h(i, 1) + t * (.06 + .04 * h(i, 2))) % 1)) * H;
        FS(`hsla(${RD(h(i, 3) * 360)},70%,68%,${.55 + .3 * h(i, 4)})`);
        fT(`${RD(14 + 12 * h(i, 3))}px sans-serif`);
        tA('center'); ctx.fillText(h(i, 2) < .5 ? '♪' : '♫', x, y)
      } else if (type === 'bokeh') {

        const x = h(i, 0) * W + SI(t * .3 + i) * W * .03; const y = (1 - ((h(i, 1) + t * (.02 + .02 * h(i, 2))) % 1)) * H;
        FS(`hsla(${RD(h(i, 3) * 360)},80%,75%,${.1 + .12 * h(i, 4)})`);
        dot(x,y,8 + 22 * h(i, 3))
      } else {
        const x = h(i, 0) * W + SI(t * .6 + h(i, 1) * 9) * W * .05; const y = ((h(i, 1) + t * (.03 + .03 * h(i, 2))) % 1) * H;
        FS(`rgba(255,170,190,${.55 + .3 * h(i, 4)})`);
        ell(x,y,3 + 3 * h(i, 3),1.5 + 1.5 * h(i, 3),SI(t * 2 + i) * 1.2)
      }
    })
    rS()
  }

  function drawAccessory(ctx, acc, hx, hy, hr, hue) {
      const span = (a, b, f) => { for (let i = a; i <= b; i++) f(i) }, spt = (a, b, f) => { for (let i = a; i < b; i++) f(i) };
      const plS=(...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }); sK() };
      const mir=f=>[-1,1].forEach(f);
      const bP=()=>ctx.beginPath(), cP=()=>ctx.closePath(), mT=(x,y)=>ctx.moveTo(x,y), lT=(x,y)=>ctx.lineTo(x,y), qT=(a,b,c,d)=>ctx.quadraticCurveTo(a,b,c,d), bZ=(a,b,c,d,e,f)=>ctx.bezierCurveTo(a,b,c,d,e,f), aR=(x,y,r,s,e)=>ctx.arc(x,y,r,s,e), eC=(x,y,rx,ry,o,s,e)=>ctx.ellipse(x,y,rx,ry,o,s,e), fR=(x,y,w,h)=>ctx.fillRect(x,y,w,h), sR=(x,y,w,h)=>ctx.strokeRect(x,y,w,h), fL=()=>ctx.fill(), sK=()=>ctx.stroke(), sV=()=>ctx.save(), rS=()=>ctx.restore(), tR=(x,y)=>ctx.translate(x,y), rO=a=>ctx.rotate(a);
    const dk = 'rgba(52,56,68,.95)', acc2 = `hsla(${RD((hue == null ? .58 : hue) * 360)},80%,64%,.92)`;

      const ell = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); fL() };
      const ells = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); sK() };
      const dots = (x, y, r) => { bP(); aR(x, y, r, 0, 7); sK() };
      const LW = (v, m) => MX(m || 1, hr * v);
      const times = (n, f) => { for (let i = 0; i < n; i++) f(i) };
      const scat = (seed, n, f) => { const r = mulberry32(seed); times(n, i => f(r, i)) };
      const rect = (x, y, w, h) => fR(x, y, w, h);
      const mv = (x, y) => { bP(); mT(x, y) };
      const FS=v=>ctx.fillStyle = v;
      const lC=v=>ctx.lineCap = v, tA=v=>ctx.textAlign = v, fT=v=>ctx.font = v;
      const SS=v=>ctx.strokeStyle = v;
      const lnW=v=>ctx.lineWidth = v;
      const poly = (...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }) ;cP(); fL() };
      const polyS = (...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }) ;cP(); sK() };
    const dot = (x, y, r) => { bP(); aR(x, y, r, 0, 7); fL() };
    sV();
    switch (acc) {
      case 'halo': {

        SS(`hsla(${RD((hue == null ? .13 : hue) * 360)},85%,65%,.95)`);
        lnW(LW(.13, 2)); ells(hx, hy - hr * 1.5, hr * .62, hr * .17, -.06);
        break
      }
      case 'ribbon': {
        FS(acc2); const bx = hx - hr * .7, by = hy - hr * .75, s = hr * .42;
        mir(d => {
          poly([bx,by],[bx + d * s,by - s * .6],[bx + d * s,by + s * .6])
        });
        FS(dk); dot(bx,by,s * .3);
        break
      }
      case 'hat': {
        FS(dk); ell(hx,hy - hr * .62,hr * 1.25,hr * .22); bP(); eC(hx, hy - hr * .85, hr * .72, hr * .5, 0, PI, 0); fL(); FS(acc2); rect(hx - hr * .72, hy - hr * .85, hr * 1.44, hr * .12);
        break
      }
      case 'shades': {
        FS('rgba(20,20,24,.88)');
        mir(s => {
          dot(hx + s * hr * .38,hy - hr * .08,hr * .26); SS(dk); lnW(LW(.07)); plS([hx + s * hr * .64, hy - hr * .08],[hx + s * hr * .95, hy - hr * .18])
        });
        SS(dk); lnW(LW(.07)); plS([hx - hr * .12, hy - hr * .1],[hx + hr * .12, hy - hr * .1]);
        break
      }
      case 'glasses': {
        SS(dk); lnW(LW(.07));
        mir(s => {
          bP(); bP(); aR(hx + s * hr * .38, hy - hr * .08, hr * .26, 0, 7); dots(hx + s * hr * .38, hy - hr * .08, hr * .26); bP(); mv(hx + s * hr * .64, hy - hr * .08); mv(hx + s * hr * .64, hy - hr * .08); lT(hx + s * hr * .95, hy - hr * .18); plS([hx + s * hr * .64, hy - hr * .08],[hx + s * hr * .95, hy - hr * .18])
        });
        plS([hx - hr * .12, hy - hr * .1],[hx + hr * .12, hy - hr * .1]);
        break
      }
      case 'crown': {
        FS(acc2); const cy = hy - hr * .62, cw = hr * .9; mv(hx - cw, cy);
        times(3, i => {
          const px = hx - cw + (i * 2 + 1) * cw / 3; lT(px - cw / 3, cy - hr * .5); lT(px + cw / 3, cy)
        });
        cP(); fL(); FS(dk); rect(hx - cw, cy, cw * 2, hr * .14);
        break
      }
      case 'phones': {
        SS(dk); lnW(LW(.1, 1.5)); bP(); aR(hx, hy - hr * .35, hr * .95, PI * 1.15, PI * 1.85); sK(); FS(acc2);
        mir(s => {
          ell(hx + s * hr * .95,hy - hr * .1,hr * .16,hr * .28)
        });
        break
      }
      case 'beard': {
        FS('rgba(70,60,52,.88)'); ell(hx,hy + hr * .55,hr * .62,hr * .5); FS('rgba(255,255,255,.5)'); ell(hx,hy + hr * .38,hr * .28,hr * .12);
        break
      }
      case 'mask': {
        FS(dk); ell(hx,hy - hr * .12,hr * .92,hr * .34); FS('#fdfdfd');
        mir(s => {
          ell(hx + s * hr * .4,hy - hr * .1,hr * .22,hr * .16)
        });
        break
      }
      case 'scarf': {

        FS(acc2); ell(hx,hy + hr * .75,hr * .78,hr * .22); ell(hx + hr * .42, hy + hr * 1.02, hr * .2, hr * .42, .5);
        break
      }
      case 'beret': {

        FS(acc2); sV(); tR(hx - hr * .12, hy - hr * .92); rO(-.22); ell(0,0,hr * .95,hr * .4); rS(); SS(acc2); lnW(LW(.06, 1.5)); lC('round'); plS([hx - hr * .12, hy - hr * 1.28],[hx - hr * .12, hy - hr * 1.05]);
        break
      }
      case 'tie': {

        FS(acc2); mv(hx - hr * .22, hy + hr * .82); mT(hx - hr * .22, hy + hr * .82); lT(hx + hr * .22, hy + hr * .82); lT(hx, hy + hr * 1.06); lT(hx, hy + hr * 1.06); cP(); lT(hx, hy + hr * 1.06); cP(); fL(); mv(hx - hr * .16, hy + hr * 1.06); mT(hx - hr * .16, hy + hr * 1.06); lT(hx + hr * .16, hy + hr * 1.06); lT(hx + hr * .1, hy + hr * 2.1); lT(hx + hr * .1, hy + hr * 2.1); lT(hx - hr * .1, hy + hr * 2.1); cP(); cP(); fL();
        break
      }
      case 'monocle': {

        SS(`hsla(${RD((hue == null ? .12 : hue) * 360)},75%,60%,.95)`);
        lnW(LW(.05, 1.2)); bP(); bP(); aR(hx + hr * .38, hy - hr * .12, hr * .26, 0, 7); dots(hx + hr * .38, hy - hr * .12, hr * .26); plS([hx + hr * .38, hy + hr * .14],[hx + hr * .75, hy + hr * .6, hx + hr * .5, hy + hr * 1.05]);
        break
      }
      case 'bandana': {

        FS(acc2); poly([hx - hr * 1.02,hy - hr * .55],[hx + hr * 1.02,hy - hr * .55],[hx + hr * .75,hy - hr * 1.5],[hx - hr * .75,hy - hr * 1.5]);

        poly([hx + hr * .95,hy - hr * .6],[hx + hr * 1.25,hy - hr * .95],[hx + hr * 1.1,hy - hr * .5]); FS(dk); dot(hx + hr * .95,hy - hr * .62,hr * .09);
        break
      }
      case 'coonskin': {

        FS('#8a7050'); ell(hx + hr * .75, hy + hr * .3, hr * .18, hr * .55, .3);

        FS('#4a3a28');
        times(3, i => {
          ell(hx + hr * (.68 + i * .06), hy + hr * (0 + i * .28), hr * .14, hr * .09, .3)
        });

        FS(acc2); bP(); eC(hx, hy - hr * .5, hr * .78, hr * .55, 0, PI, PI * 2); cP(); cP(); fL();

        SS(dk); lnW(LW(.08, 1.5)); bP(); eC(hx, hy - hr * .5, hr * .78, hr * .55, 0, PI * .05, PI * .95); sK();
        break
      }
      case 'wimple': {

        bP(); eC(hx, hy + hr * .35, hr * .82, hr * 1.05, 0, 0, 7); eC(hx, hy + hr * .1, hr * .55, hr * .62, 0, 0, 7); FS(acc2); fL('evenodd');

        SS(dk); lnW(LW(.06, 1.2)); bP(); eC(hx, hy + hr * .1, hr * .55, hr * .62, 0, PI * .7, PI * 1.3); sK();

        SS(dk); lnW(LW(.08, 1.5)); bP(); eC(hx, hy + hr * .5, hr * .68, hr * .35, 0, PI * .15, PI * .85); sK();
        break
      }
      case 'sariki': {

        FS(acc2);

        poly([hx - hr * .55,hy - hr * .95],[hx,hy - hr * 1.15,hx + hr * .55,hy - hr * .95],[hx + hr * .5,hy - hr * .65],[hx,hy - hr * .85,hx - hr * .5,hy - hr * .65]);

        SS(dk); lnW(LW(.045)); mv(hx - hr * .52, hy - hr * .9); qT(hx, hy - hr * 1.08, hx + hr * .52, hy - hr * .9); mT(hx - hr * .5, hy - hr * .75); qT(hx, hy - hr * .93, hx + hr * .5, hy - hr * .75); sK();

        SS(acc2); lnW(LW(.06, 1.5));
        span(-2, 2, i => {
          plS([hx + i * hr * .12, hy - hr * .68],[hx + i * hr * .13, hy - hr * .5])
        })

        FS(dk); ell(hx + hr * .5, hy - hr * .8, hr * .08, hr * .12, .3);
        break
      }
      case 'pakol': {

        FS(acc2);

        poly([hx - hr * .62,hy - hr * .75],[hx - hr * .6,hy - hr * 1.25,hx,hy - hr * 1.28],[hx + hr * .6,hy - hr * 1.25,hx + hr * .62,hy - hr * .75]);

        FS(dk); ell(hx, hy - hr * .72, hr * .66, hr * .22);

        SS(acc2); lnW(LW(.05));
        ([-.78, -.7, -.62]).forEach(oy => {
          bP(); eC(hx, hy - hr * .72 + (oy + .72) * hr, hr * .66, hr * .12, 0, 3.4, 6.1); sK()
        });

        SS(dk); lnW(LW(.035)); plS([hx - hr * .3, hy - hr * 1.0],[hx, hy - hr * 1.12, hx + hr * .28, hy - hr * 1.02]);
        break
      }
      case 'songkok': {

        FS(dk);

        poly([hx - hr * .52,hy - hr * .7],[hx - hr * .58,hy - hr * 1.05],[hx,hy - hr * 1.12,hx + hr * .58,hy - hr * 1.05],[hx + hr * .52,hy - hr * .7]);

        FS(acc2); ell(hx, hy - hr * 1.05, hr * .58, hr * .1);

        SS(acc2); lnW(LW(.04)); mv(hx - hr * .4, hy - hr * .95); qT(hx - hr * .44, hy - hr * .8, hx - hr * .4, hy - hr * .72); mT(hx + hr * .4, hy - hr * .95); qT(hx + hr * .44, hy - hr * .8, hx + hr * .4, hy - hr * .72); sK();

        FS(acc2); ell(hx, hy - hr * .7, hr * .53, hr * .07);
        break
      }
      case 'blangkon': {

        FS(acc2);

        poly([hx - hr * .6,hy - hr * .62],[hx - hr * .62,hy - hr * 1.18,hx,hy - hr * 1.22],[hx + hr * .62,hy - hr * 1.18,hx + hr * .6,hy - hr * .62],[hx + hr * .55,hy - hr * .55],[hx,hy - hr * .75,hx - hr * .55,hy - hr * .55]);

        FS(dk); poly([hx + hr * .5,hy - hr * .72],[hx + hr * .8,hy - hr * .95],[hx + hr * .58,hy - hr * 1.0]); poly([hx + hr * .52,hy - hr * .68],[hx + hr * .85,hy - hr * .82],[hx + hr * .62,hy - hr * .88]);

        FS(dk);
        span(-2, 2, i => {
          ell(hx + i * hr * .18, hy - hr * .78, hr * .035, hr * .035)
        })

        SS(dk); lnW(LW(.04)); plS([hx - hr * .56, hy - hr * .9],[hx, hy - hr * 1.05, hx + hr * .56, hy - hr * .9]);
        break
      }
      case 'gibus': {

        FS(dk);

        ell(hx, hy - hr * .62, hr * .78, hr * .1);

        FS(acc2); poly([hx - hr * .5,hy - hr * .6],[hx - hr * .46,hy - hr * 1.5],[hx,hy - hr * 1.56,hx + hr * .46,hy - hr * 1.5],[hx + hr * .5,hy - hr * .6]);

        SS(dk); lnW(LW(.04)); mv(hx - hr * .48, hy - hr * .95); lT(hx + hr * .48, hy - hr * .95); mT(hx - hr * .47, hy - hr * 1.1); lT(hx + hr * .47, hy - hr * 1.1); sK();

        FS(dk); ell(hx, hy - hr * 1.5, hr * .46, hr * .08);
        break
      }
      case 'toque': {

        FS(acc2);

        poly([hx - hr * .55,hy - hr * .68],[hx - hr * .55,hy - hr * 1.3,hx,hy - hr * 1.35],[hx + hr * .55,hy - hr * 1.3,hx + hr * .55,hy - hr * .68]);

        FS(dk); ell(hx, hy - hr * 1.38, hr * .16, hr * .14);

        SS(dk); lnW(LW(.03));
        span(-3, 3, i => {
          plS([hx + i * hr * .04, hy - hr * 1.38],[hx + i * hr * .06, hy - hr * 1.52])
        })

        FS(dk); poly([hx - hr * .58,hy - hr * .75],[hx - hr * .55,hy - hr * .6],[hx,hy - hr * .5,hx + hr * .55,hy - hr * .6],[hx + hr * .58,hy - hr * .75],[hx,hy - hr * .65,hx - hr * .58,hy - hr * .75]);

        SS(acc2); lnW(LW(.028));
        span(-3, 3, i => {
          plS([hx + i * hr * .14, hy - hr * .73],[hx + i * hr * .15, hy - hr * .62])
        })
        break
      }
      case 'salakot': {

        FS(acc2);

        poly([hx - hr * .85,hy - hr * .55],[hx - hr * .5,hy - hr * 1.15,hx,hy - hr * 1.15],[hx + hr * .5,hy - hr * 1.15,hx + hr * .85,hy - hr * .55],[hx,hy - hr * .4,hx - hr * .85,hy - hr * .55]);

        poly([hx - hr * .06,hy - hr * 1.13],[hx,hy - hr * 1.3],[hx + hr * .06,hy - hr * 1.13]);

        SS(dk); lnW(LW(.025));
        span(1, 3, i => {
          bP(); eC(hx, hy - hr * (1.15 - i * .14), hr * (.28 + i * .16), hr * (.05 + i * .03), 0, 0, PI); sK()
        })

        SS(dk); lnW(LW(.035)); plS([hx - hr * .85, hy - hr * .55],[hx, hy - hr * .4, hx + hr * .85, hy - hr * .55]);

        SS(dk); lnW(LW(.03)); plS([hx - hr * .55, hy - hr * .52],[hx, hy + hr * .5, hx + hr * .55, hy - hr * .52]);
        break
      }
      case 'barretina': {

        FS(acc2);

        poly([hx - hr * .45,hy - hr * .72],[hx - hr * .5,hy - hr * 1.2,hx + hr * .1,hy - hr * 1.3],[hx + hr * .7,hy - hr * 1.35,hx + hr * .8,hy - hr * 1.05],[hx + hr * .82,hy - hr * .82,hx + hr * .55,hy - hr * .7],[hx,hy - hr * .62,hx - hr * .45,hy - hr * .72]);

        poly([hx + hr * .8,hy - hr * 1.05],[hx + hr * .95,hy - hr * .98,hx + hr * .88,hy - hr * .78],[hx + hr * .8,hy - hr * .8,hx + hr * .55,hy - hr * .7],[hx + hr * .8,hy - hr * .82,hx + hr * .8,hy - hr * 1.05]);

        FS(dk); ell(hx + hr * .88, hy - hr * .78, hr * .09, hr * .08);

        FS(dk); poly([hx - hr * .48,hy - hr * .74],[hx,hy - hr * .62,hx + hr * .5,hy - hr * .72],[hx + hr * .52,hy - hr * .62],[hx,hy - hr * .52,hx - hr * .5,hy - hr * .64]);
        break
      }
      case 'montenegrin': {

        FS(dk);

        poly([hx - hr * .5,hy - hr * .62],[hx - hr * .48,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .48,hy - hr * .95],[hx + hr * .5,hy - hr * .62],[hx,hy - hr * .52,hx - hr * .5,hy - hr * .62]);

        FS(acc2); ell(hx, hy - hr * .95, hr * .48, hr * .1);

        SS('#c8a838'); lnW(LW(.03)); ells(hx, hy - hr * .95, hr * .4, hr * .07);

        span(-2, 2, i => {
          bP(); aR(hx + i * hr * .15, hy - hr * .95, hr * .04, PI, 0); sK()
        })
        break
      }
      case 'chupalla': {

        FS(acc2);

        ell(hx, hy - hr * .62, hr * .95, hr * .16);

        poly([hx - hr * .38,hy - hr * .68],[hx - hr * .36,hy - hr * 1.0],[hx,hy - hr * 1.08,hx + hr * .36,hy - hr * 1.0],[hx + hr * .38,hy - hr * .68],[hx,hy - hr * .58,hx - hr * .38,hy - hr * .68]);

        ell(hx, hy - hr * 1.0, hr * .36, hr * .07);

        FS(dk); poly([hx - hr * .38,hy - hr * .72],[hx,hy - hr * .62,hx + hr * .38,hy - hr * .72],[hx + hr * .38,hy - hr * .8],[hx,hy - hr * .7,hx - hr * .38,hy - hr * .8]);

        SS(dk); lnW(LW(.02));
        span(-4, 4, i => {
          plS([hx + i * hr * .16, hy - hr * .68],[hx + i * hr * .22, hy - hr * .58])
        })
        break
      }
      case 'spodik': {

        FS(acc2);

        poly([hx - hr * .52,hy - hr * .6],[hx - hr * .56,hy - hr * 1.55],[hx,hy - hr * 1.62,hx + hr * .56,hy - hr * 1.55],[hx + hr * .52,hy - hr * .6],[hx,hy - hr * .5,hx - hr * .52,hy - hr * .6]);

        SS(dk); lnW(LW(.022));
        span(-5, 5, i => {
          const fx = hx + i * hr * .1; plS([fx, hy - hr * .75],[fx + SI(i) * hr * .02, hy - hr * 1.45])
        })

        FS(dk); poly([hx - hr * .53,hy - hr * .62],[hx,hy - hr * .52,hx + hr * .53,hy - hr * .62],[hx + hr * .52,hy - hr * .72],[hx,hy - hr * .62,hx - hr * .52,hy - hr * .72]);
        break
      }
      case 'montera': {

        FS(dk);

        poly([hx - hr * .42,hy - hr * .62],[hx - hr * .42,hy - hr * .95,hx,hy - hr * .95],[hx + hr * .42,hy - hr * .95,hx + hr * .42,hy - hr * .62],[hx,hy - hr * .52,hx - hr * .42,hy - hr * .62]);

        mir(s => {
          poly([hx + s * hr * .4,hy - hr * .7],[hx + s * hr * .8,hy - hr * .75,hx + s * hr * .78,hy - hr * .98],[hx + s * hr * .7,hy - hr * .8,hx + s * hr * .42,hy - hr * .8])
        });

        FS(acc2); scat(31, 18, (rngM, i) => {
          const ax = hx + (rngM() - .5) * hr * .75; const ay = hy - hr * (.62 + rngM() * .3); ell(ax, ay, hr * .015, hr * .012)
        });

        SS(dk); lnW(LW(.03)); plS([hx - hr * .42, hy - hr * .6],[hx, hy + hr * .45, hx + hr * .42, hy - hr * .6]);
        break
      }
      case 'akubra': {

        FS(dk); bP(); eC(hx, hy - hr * .68, hr * .72, hr * .15, 0, 0, 7); eC(hx, hy - hr * .68, hr * .72, hr * .15, 0, 0, 7); fL();

        mir(s => {
          ell(hx + s * hr * .68, hy - hr * .64, hr * .1, hr * .08, s * .5)
        });

        FS(acc2); poly([hx - hr * .42,hy - hr * .68],[hx - hr * .4,hy - hr * 1.05,hx,hy - hr * 1.05],[hx + hr * .4,hy - hr * 1.05,hx + hr * .42,hy - hr * .68],[hx,hy - hr * .58,hx - hr * .42,hy - hr * .68]);

        SS(dk); lnW(LW(.025));
        mir(s => {
          plS([hx + s * hr * .12, hy - hr * 1.03],[hx + s * hr * .14, hy - hr * .95, hx + s * hr * .2, hy - hr * .9])
        });

        FS('#3a2a1a'); rect(hx - hr * .41, hy - hr * .78, hr * .82, hr * .07);
        break
      }
      case 'panama': {

        FS('#e8dfc8'); bP(); eC(hx, hy - hr * .68, hr * .68, hr * .14, 0, 0, 7); eC(hx, hy - hr * .68, hr * .68, hr * .14, 0, 0, 7); fL();

        poly([hx - hr * .4,hy - hr * .68],[hx - hr * .36,hy - hr * 1.0],[hx + hr * .36,hy - hr * 1.0],[hx + hr * .4,hy - hr * .68],[hx,hy - hr * .58,hx - hr * .4,hy - hr * .68]);

        SS('#b8a888'); lnW(LW(.03)); plS([hx, hy - hr * 1.0],[hx, hy - hr * .78]);

        FS(dk); rect(hx - hr * .4, hy - hr * .78, hr * .8, hr * .08);

        SS('rgba(160,140,110,.4)'); lnW(1);
        times(3, i => {
          bP(); eC(hx, hy - hr * (.7 + i * .04), hr * (.55 + i * .04), hr * .04, 0, 0, PI); sK()
        });
        break
      }
      case 'tiroler': {

        FS('#3a5a3a'); bP(); eC(hx, hy - hr * .66, hr * .55, hr * .11, 0, 0, 7); eC(hx, hy - hr * .66, hr * .55, hr * .11, 0, 0, 7); fL();

        mir(s => {
          ell(hx + s * hr * .52, hy - hr * .7, hr * .09, hr * .07, s * -.4)
        });

        poly([hx - hr * .38,hy - hr * .66],[hx - hr * .34,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .34,hy - hr * .95],[hx + hr * .38,hy - hr * .66],[hx,hy - hr * .56,hx - hr * .38,hy - hr * .66]);

        SS('#2a4228'); lnW(LW(.03)); plS([hx, hy - hr * .99],[hx, hy - hr * .8]);

        FS('#6a4a28'); rect(hx - hr * .37, hy - hr * .74, hr * .74, hr * .05);

        FS('#c8b888'); poly([hx + hr * .4,hy - hr * .72],[hx + hr * .55,hy - hr * 1.15,hx + hr * .48,hy - hr * 1.25],[hx + hr * .52,hy - hr * 1.0,hx + hr * .46,hy - hr * .72]);
        break
      }
      case 'homburg': {

        FS(dk); bP(); eC(hx, hy - hr * .66, hr * .58, hr * .12, 0, 0, 7); eC(hx, hy - hr * .66, hr * .58, hr * .12, 0, 0, 7); fL();

        SS(dk); lnW(hr * .05);
        mir(s => {
          bP(); aR(hx + s * hr * .5, hy - hr * .66, hr * .09, s > 0 ? PI * 1.2 : PI * 1.8, s > 0 ? PI * 2.4 : PI * .6); sK()
        });

        FS(acc2); poly([hx - hr * .38,hy - hr * .66],[hx - hr * .36,hy - hr * 1.0,hx - hr * .08,hy - hr * .95],[hx,hy - hr * .88,hx + hr * .08,hy - hr * .95],[hx + hr * .36,hy - hr * 1.0,hx + hr * .38,hy - hr * .66],[hx,hy - hr * .56,hx - hr * .38,hy - hr * .66]);

        FS(dk); rect(hx - hr * .38, hy - hr * .74, hr * .76, hr * .07); poly([hx - hr * .38,hy - hr * .7],[hx - hr * .46,hy - hr * .74],[hx - hr * .38,hy - hr * .78]);
        break
      }
      case 'dhakatopi': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .6],[hx - hr * .42,hy - hr * .88],[hx,hy - hr * .8],[hx + hr * .42,hy - hr * .88],[hx + hr * .5,hy - hr * .6],[hx,hy - hr * .5,hx - hr * .5,hy - hr * .6]);

        SS(dk); lnW(LW(.02));
        span(-2, 2, i => {
          const dx = hx + i * hr * .18; polyS([dx,hy - hr * .72],[dx + hr * .07,hy - hr * .8],[dx,hy - hr * .88],[dx - hr * .07,hy - hr * .8])
        })

        FS(dk); poly([hx - hr * .5,hy - hr * .6],[hx,hy - hr * .5,hx + hr * .5,hy - hr * .6],[hx + hr * .48,hy - hr * .66],[hx,hy - hr * .56,hx - hr * .48,hy - hr * .66]);
        break
      }
      case 'gandhi': {

        sV(); tR(hx, hy - hr * .75); rO(-.18); FS('#f0ece0'); poly([-hr * .55,0],[-hr * .45,-hr * .22,-hr * .1,-hr * .28],[hr * .5,-hr * .05],[hr * .55,0,hr * .5,0]);

        SS('#b8b0a0'); lnW(LW(.02)); plS([-hr * .45, -hr * .03],[-hr * .1, -hr * .2, hr * .45, -hr * .04]);

        FS('rgba(120,110,90,.3)'); poly([-hr * .5,-hr * .02],[0,hr * .04,hr * .5,-hr * .02],[hr * .5,0],[0,hr * .08,-hr * .5,0]); rS();
        break
      }
      case 'tengkolok': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .55],[hx - hr * .5,hy - hr * .8,hx,hy - hr * .85],[hx + hr * .5,hy - hr * .8,hx + hr * .5,hy - hr * .55],[hx,hy - hr * .45,hx - hr * .5,hy - hr * .55]);

        SS(dk); lnW(LW(.02));
        span(-2, 2, i => {
          plS([hx + i * hr * .18, hy - hr * .84],[hx + i * hr * .22, hy - hr * .7, hx + i * hr * .2, hy - hr * .56])
        })

        FS(dk); poly([hx - hr * .05,hy - hr * .82],[hx + hr * .12,hy - hr * 1.25],[hx + hr * .22,hy - hr * .78],[hx + hr * .08,hy - hr * .85,hx - hr * .05,hy - hr * .82]);

        ell(hx + hr * .14, hy - hr * .78, hr * .04, hr * .03);
        break
      }
      case 'udeng': {

        FS(acc2); poly([hx - hr * .52,hy - hr * .5],[hx - hr * .52,hy - hr * .85,hx,hy - hr * .9],[hx + hr * .52,hy - hr * .85,hx + hr * .52,hy - hr * .5],[hx,hy - hr * .4,hx - hr * .52,hy - hr * .5]);

        SS(dk); lnW(LW(.02));
        span(-2, 2, i => {
          plS([hx + i * hr * .2, hy - hr * .5],[hx + i * hr * .15, hy - hr * .7, hx + i * hr * .12, hy - hr * .88])
        })

        FS(dk); poly([hx - hr * .08,hy - hr * .5],[hx,hy - hr * .95],[hx + hr * .08,hy - hr * .5]);

        poly([hx - hr * .08,hy - hr * .52],[hx - hr * .2,hy - hr * .78],[hx - hr * .04,hy - hr * .62]); poly([hx + hr * .08,hy - hr * .52],[hx + hr * .2,hy - hr * .78],[hx + hr * .04,hy - hr * .62]);
        break
      }
      case 'kofia': {

        FS(acc2); poly([hx - hr * .45,hy - hr * .55],[hx - hr * .42,hy - hr * .95],[hx + hr * .42,hy - hr * .95],[hx + hr * .45,hy - hr * .55],[hx,hy - hr * .45,hx - hr * .45,hy - hr * .55]);

        ell(hx, hy - hr * .95, hr * .42, hr * .07); SS(dk); lnW(LW(.02)); ells(hx, hy - hr * .95, hr * .42, hr * .07);

        FS(dk);
        span(-3, 3, i => {
          const dx = i * hr * .13; poly([hx + dx,hy - hr * .68],[hx + dx + hr * .05,hy - hr * .62],[hx + dx,hy - hr * .56],[hx + dx - hr * .05,hy - hr * .62])
        })

        span(-2, 2, i => {
          ell(hx + i * hr * .16, hy - hr * .82, hr * .02, hr * .02)
        })
        break
      }
      case 'apsara': {

        FS(dk); rect(hx - hr * .42, hy - hr * .62, hr * .84, hr * .1); FS(acc2);
        span(-3, 3, i => {
          ell(hx + i * hr * .11, hy - hr * .57, hr * .025, hr * .025)
        })

        spt(0, 3, i => {
          const lw = hr * (.4 - i * .11), ly = hy - hr * (.62 + i * .28); FS(i === 1 ? dk : acc2); mv(hx - lw, ly + hr * .1);
          for (let j = -2; j <= 2; j++) {
            const px = hx + j * lw * .4; lT(px, ly - hr * .06); lT(px + lw * .2, ly + hr * .1)
          }
          cP(); fL()
        })

        FS(dk); poly([hx - hr * .06,hy - hr * 1.16],[hx,hy - hr * 1.4],[hx + hr * .06,hy - hr * 1.16]);

        FS(acc2);
        mir(sx => {
          ell(hx + sx * hr * .45, hy - hr * .4, hr * .05, hr * .07); ell(hx + sx * hr * .45, hy - hr * .28, hr * .035, hr * .04)
        });
        break
      }
      case 'isicholo': {

        FS(dk); poly([hx - hr * .48,hy - hr * .5],[hx - hr * .48,hy - hr * .75,hx,hy - hr * .78],[hx + hr * .48,hy - hr * .75,hx + hr * .48,hy - hr * .5],[hx,hy - hr * .4,hx - hr * .48,hy - hr * .5]);

        FS('#a03428'); ell(hx, hy - hr * .78, hr * .68, hr * .16);

        FS('#7a281e'); bP(); eC(hx, hy - hr * .74, hr * .68, hr * .12, 0, 0, PI); fL();

        FS(dk); ell(hx, hy - hr * .79, hr * .28, hr * .06);

        SS('#e8e0d0'); lnW(LW(.02)); ells(hx, hy - hr * .78, hr * .62, hr * .13);
        break
      }
      case 'maasai': {

        FS('#a02820'); poly([hx - hr * .48,hy - hr * .55],[hx,hy - hr * .72,hx + hr * .48,hy - hr * .55],[hx,hy - hr * .58,hx - hr * .48,hy - hr * .55]);

        FS('#f0e8d8');
        span(-3, 3, i => {
          ell(hx + i * hr * .13, hy - hr * (.6 + .03 * AB(i)), hr * .03, hr * .03)
        })
        FS('#2858a0');
        for (let i = -2; i <= 2; i += 2) {
          ell(hx + i * hr * .13, hy - hr * (.58 + .03 * AB(i)), hr * .02, hr * .02)
        }

        FS('#f0e8d8');
        ([-.2, 0, .2]).forEach(bx => {
          ell(hx + bx * hr, hy - hr * .48, hr * .025, hr * .04)
        });

        SS('#e8e0d0'); lnW(LW(.03, 1.5)); plS([hx + hr * .15, hy - hr * .65],[hx + hr * .28, hy - hr * 1.1, hx + hr * .35, hy - hr * 1.4]);

        lnW(LW(.015, .8));
        times(5, i => {
          plS([hx + hr * (.15 + i * .04), hy - hr * (.65 + i * .14)],[hx + hr * (.28 + i * .02), hy - hr * (.7 + i * .14),
            hx + hr * (.32 + i * .01), hy - hr * (.68 + i * .14)])
        });
        break
      }
      case 'netela': {

        FS('#f0ebe0'); poly([hx - hr * .55,hy + hr * .3],[hx - hr * .6,hy - hr * .5,hx - hr * .4,hy - hr * .75],[hx,hy - hr * .95,hx + hr * .4,hy - hr * .75],[hx + hr * .6,hy - hr * .5,hx + hr * .55,hy + hr * .3],[hx + hr * .4,hy + hr * .15,hx + hr * .3,hy - hr * .2],[hx,hy - hr * .35,hx - hr * .3,hy - hr * .2],[hx - hr * .4,hy + hr * .15,hx - hr * .55,hy + hr * .3]);

        SS('#c8beb0'); lnW(LW(.02));
        ([-.45, -.2, .2, .45]).forEach(fx => {
          plS([hx + fx * hr, hy + hr * .25],[hx + fx * hr * .9, hy - hr * .1, hx + fx * hr * .7, hy - hr * .5])
        });

        SS('#c04038'); lnW(LW(.04, 1.5)); plS([hx - hr * .52, hy + hr * .26],[hx, hy + hr * .05, hx + hr * .52, hy + hr * .26]); SS('#d8a028'); lnW(LW(.02)); plS([hx - hr * .5, hy + hr * .2],[hx, hy + hr * .0, hx + hr * .5, hy + hr * .2]);
        break
      }
      case 'burnous': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .4],[hx - hr * .45,hy - hr * .8,hx - hr * .15,hy - hr * .85],[hx + hr * .05,hy - hr * 1.05,hx + hr * .08,hy - hr * 1.35],[hx + hr * .12,hy - hr * .95,hx + hr * .35,hy - hr * .8],[hx + hr * .55,hy - hr * .7,hx + hr * .5,hy - hr * .4],[hx,hy - hr * .3,hx - hr * .5,hy - hr * .4]);

        SS(dk); lnW(LW(.02));
        ([-.3, -.1, .15, .35]).forEach(fx => {
          plS([hx + fx * hr, hy - hr * .38],[hx + fx * hr * .9, hy - hr * .55, hx + fx * hr * .8, hy - hr * .75])
        });

        SS('#e8e0d0'); lnW(LW(.025)); plS([hx - hr * .42, hy - hr * .45],[hx, hy - hr * .3, hx + hr * .42, hy - hr * .45]);

        FS(dk); ell(hx + hr * .08, hy - hr * 1.38, hr * .045, hr * .05);
        break
      }
      case 'tengkuluk': {

        FS(acc2); poly([hx - hr * .45,hy - hr * .35],[hx,hy - hr * .5,hx + hr * .45,hy - hr * .35],[hx + hr * .4,hy - hr * .15],[hx,hy - hr * .28,hx - hr * .4,hy - hr * .15]);

        poly([hx - hr * .4,hy - hr * .3],[hx - hr * .55,hy - hr * .6,hx - hr * .5,hy - hr * .85],[hx - hr * .35,hy - hr * .65,hx - hr * .2,hy - hr * .4]);

        poly([hx + hr * .4,hy - hr * .3],[hx + hr * .55,hy - hr * .6,hx + hr * .5,hy - hr * .85],[hx + hr * .35,hy - hr * .65,hx + hr * .2,hy - hr * .4]);

        SS(dk); lnW(LW(.02)); plS([hx - hr * .45, hy - hr * .32],[hx, hy - hr * .45, hx + hr * .45, hy - hr * .32]);

        FS(dk);
        ([-.3, -.1, .1, .3]).forEach(fx => {
          poly([hx + fx * hr,hy - hr * .28],[hx + (fx + .05) * hr,hy - hr * .24],[hx + fx * hr,hy - hr * .2],[hx + (fx - .05) * hr,hy - hr * .24])
        });
        break
      }
      case 'saputangan': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .25],[hx - hr * .5,hy - hr * .7,hx - hr * .25,hy - hr * .8],[hx,hy - hr * .9,hx + hr * .25,hy - hr * .8],[hx + hr * .5,hy - hr * .7,hx + hr * .5,hy - hr * .25],[hx + hr * .45,hy - hr * .15],[hx,hy - hr * .3,hx - hr * .45,hy - hr * .15]);

        SS(dk); lnW(LW(.015));
        ([-.3, -.1, .1, .3]).forEach(fx => {
          plS([hx + fx * hr, hy - hr * .7],[hx + fx * hr, hy - hr * .22])
        });
        ([-.6, -.45, -.3]).forEach(fy => {
          plS([hx - hr * .42, hy + fy * hr],[hx, hy + (fy - .08) * hr, hx + hr * .42, hy + fy * hr])
        });

        FS(dk); bP(); eC(hx, hy - hr * .55, hr * .08, hr * .06, 0, 0, 7); eC(hx, hy - hr * .55, hr * .08, hr * .06, 0, 0, 7); fL(); poly([hx - hr * .03,hy - hr * .52],[hx - hr * .1,hy - hr * .35],[hx - hr * .05,hy - hr * .32],[hx + hr * .01,hy - hr * .5]);
        break
      }
      case 'bashlyk': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .3],[hx - hr * .5,hy - hr * .6,hx - hr * .3,hy - hr * .7],[hx - hr * .05,hy - hr * 1.0],[hx + hr * .2,hy - hr * .7],[hx + hr * .5,hy - hr * .6,hx + hr * .5,hy - hr * .3],[hx,hy - hr * .25,hx - hr * .5,hy - hr * .3]);

        mir(s => {
          poly([hx + s * hr * .45,hy - hr * .4],[hx + s * hr * .55,hy + hr * .15],[hx + s * hr * .4,hy + hr * .12],[hx + s * hr * .35,hy - hr * .35])
        });

        SS(dk); lnW(LW(.02)); plS([hx - hr * .42, hy - hr * .35],[hx, hy - hr * .45, hx + hr * .42, hy - hr * .35]);

        ([-.38, -.15, .15, .38]).forEach(fx => {
          plS([hx + fx * hr, hy - hr * .3],[hx + fx * hr * 1.1, hy - hr * .45, hx + fx * hr * .9, hy - hr * .62])
        });
        break
      }
      case 'telpek': {

        const tr2 = mulberry32(599);

        FS(acc2); bP(); eC(hx, hy - hr * .7, hr * .58, hr * .42, 0, 0, 7); eC(hx, hy - hr * .7, hr * .58, hr * .42, 0, 0, 7); fL();

        SS(dk); lnW(LW(.012));
        for (let i = 0; i < 40; i++) {
          const fx = hx + (tr2() - .5) * hr * 1.0; const fy = hy - hr * .7 + (tr2() - .5) * hr * .7;
          if (((fx - hx) / (hr * .58)) ** 2 + ((fy - hy + hr * .7) / (hr * .42)) ** 2 > 1) continue;
          plS([fx, fy],[fx + (tr2() - .5) * hr * .08, fy - hr * .05 - tr2() * hr * .05])
        }

        SS('rgba(30,32,40,.5)'); lnW(LW(.04, 1.5)); plS([hx - hr * .52, hy - hr * .5],[hx, hy - hr * .32, hx + hr * .52, hy - hr * .5]);
        break
      }
      case 'sjuhatt': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .4],[hx - hr * .5,hy - hr * .8],[hx,hy - hr * .9,hx + hr * .5,hy - hr * .8],[hx + hr * .5,hy - hr * .4],[hx,hy - hr * .35,hx - hr * .5,hy - hr * .4]);

        FS(acc2);
        for (const [ax, ay] of [[-.5, -.85], [0, -1.0], [.5, -.85], [0, -.75]]) {
          poly([hx + ax * hr - hr * .08,hy + ay * hr + hr * .1],[hx + ax * hr,hy + ay * hr - hr * .12],[hx + ax * hr + hr * .08,hy + ay * hr + hr * .1])
        }

        const cols = ['#2848a0', '#c03028', '#e0b028'];
        times(3, i => {
          FS(cols[i]); poly([hx - hr * .48,hy - hr * (.5 + i * .06)],[hx + hr * .48,hy - hr * (.5 + i * .06)],[hx + hr * .48,hy - hr * (.55 + i * .06)],[hx - hr * .48,hy - hr * (.55 + i * .06)])
        });
        break
      }
      case 'gat': {

        FS(acc2); bP(); eC(hx, hy - hr * .45, hr * .95, hr * .18, 0, 0, 7); eC(hx, hy - hr * .45, hr * .95, hr * .18, 0, 0, 7); fL();

        SS(dk); lnW(LW(.015)); ells(hx, hy - hr * .45, hr * .95, hr * .18);

        poly([hx - hr * .3,hy - hr * .45],[hx - hr * .3,hy - hr * 1.05],[hx,hy - hr * 1.15,hx + hr * .3,hy - hr * 1.05],[hx + hr * .3,hy - hr * .45]);

        ([-.2, 0, .2]).forEach(fx => {
          plS([hx + fx * hr, hy - hr * .45],[hx + fx * hr, hy - hr * 1.05])
        });

        mir(s => {
          plS([hx + s * hr * .3, hy - hr * .4],[hx + s * hr * .35, hy + hr * .1, hx + s * hr * .25, hy + hr * .3])
        });
        break
      }
      case 'toortsog': {

        FS(acc2); poly([hx - hr * .7,hy - hr * .45],[hx,hy - hr * .62,hx + hr * .7,hy - hr * .45],[hx + hr * .5,hy - hr * .35,hx + hr * .35,hy - hr * .38],[hx,hy - hr * .5,hx - hr * .35,hy - hr * .38],[hx - hr * .5,hy - hr * .35,hx - hr * .7,hy - hr * .45]);

        poly([hx - hr * .35,hy - hr * .48],[hx - hr * .38,hy - hr * .85,hx - hr * .15,hy - hr * .95],[hx,hy - hr * 1.0,hx + hr * .15,hy - hr * .95],[hx + hr * .38,hy - hr * .85,hx + hr * .35,hy - hr * .48]);

        FS('#c03028'); bP(); eC(hx, hy - hr * 1.02, hr * .07, hr * .07, 0, 0, 7); eC(hx, hy - hr * 1.02, hr * .07, hr * .07, 0, 0, 7); fL();

        SS(dk); lnW(LW(.02)); plS([hx - hr * .32, hy - hr * .58],[hx, hy - hr * .68, hx + hr * .32, hy - hr * .58]);
        break
      }
      case 'nemes': {

        FS(acc2);

        poly([hx - hr * .5,hy - hr * .45],[hx - hr * .45,hy - hr * .9],[hx,hy - hr * .98,hx + hr * .45,hy - hr * .9],[hx + hr * .5,hy - hr * .45]);

        mir(s => {
          poly([hx + s * hr * .5,hy - hr * .45],[hx + s * hr * .65,hy - hr * .2,hx + s * hr * .55,hy + hr * .15],[hx + s * hr * .35,hy + hr * .2],[hx + s * hr * .4,hy - hr * .15,hx + s * hr * .4,hy - hr * .45]);

          SS(dk); lnW(LW(.015));
          ([-.1, .02, .12]).forEach(ly => {
            plS([hx + s * hr * .4, hy + ly * hr],[hx + s * hr * .6, hy + (ly - .05) * hr])
          })
        });

        FS('#c09020'); rect(hx - hr * .48, hy - hr * .52, hr * .96, hr * .07);

        SS(dk);
        ([-.3, -.15, 0, .15, .3]).forEach(fx => {
          plS([hx + fx * hr, hy - hr * .5],[hx + fx * hr, hy - hr * .9, hx + fx * hr * .8, hy - hr * .95])
        });
        break
      }
      case 'kavuk': {

        FS(acc2);

        poly([hx - hr * .18,hy - hr * .45],[hx - hr * .15,hy - hr * 1.15],[hx,hy - hr * 1.22,hx + hr * .15,hy - hr * 1.15],[hx + hr * .18,hy - hr * .45]);

        SS(dk); lnW(LW(.04, 1.5));
        ([-.55, -.75, -.95]).forEach(wy => {
          plS([hx - hr * (.45 - (wy + .95) * .3), hy + wy * hr],[hx, hy + (wy + .08) * hr, hx + hr * (.45 - (wy + .95) * .3), hy + wy * hr])
        });

        FS(acc2); rect(hx - hr * .48, hy - hr * .55, hr * .96, hr * .12); poly([hx + hr * .48,hy - hr * .5],[hx + hr * .6,hy - hr * .2,hx + hr * .5,hy + hr * .1],[hx + hr * .38,hy + hr * .05],[hx + hr * .45,hy - hr * .2,hx + hr * .4,hy - hr * .5]);

        SS('#c09020'); lnW(LW(.015)); plS([hx - hr * .48, hy - hr * .52],[hx + hr * .48, hy - hr * .52]);
        break
      }
      case 'penacho': {

        const fe = ['#28a058', '#30b868', '#28a058', '#38c878', '#28a058']; const fa = [-.6, -.3, 0, .3, .6]; SS(dk);
        times(5, i => {
          const ax = hx + fa[i] * hr * .9; const topX = hx + fa[i] * hr * 2.1; const topY = hy - hr * (1.7 - AB(fa[i]) * .4); FS(fe[i]); poly([ax,hy - hr * .4],[topX + hr * .08,topY + hr * .3,topX,topY],[topX - hr * .08,topY + hr * .3,ax,hy - hr * .4]);

          lnW(LW(.015)); plS([ax, hy - hr * .4],[(ax + topX) / 2, (hy + topY) / 2, topX, topY])
        });

        FS('#c89828'); poly([hx - hr * .55,hy - hr * .42],[hx + hr * .55,hy - hr * .42],[hx + hr * .5,hy - hr * .58],[hx - hr * .5,hy - hr * .58]); FS(dk);
        ([-.3, 0, .3]).forEach(bx => {
          ell(hx + bx * hr, hy - hr * .5, hr * .04, hr * .04)
        });
        break
      }
      case 'cangaceiro': {

        FS(acc2);

        poly([hx - hr * .85,hy - hr * .38],[hx - hr * .7,hy - hr * .6,hx - hr * .4,hy - hr * .5],[hx,hy - hr * .42,hx + hr * .4,hy - hr * .5],[hx + hr * .7,hy - hr * .6,hx + hr * .85,hy - hr * .38],[hx + hr * .5,hy - hr * .3,hx,hy - hr * .38],[hx - hr * .5,hy - hr * .3,hx - hr * .85,hy - hr * .38]);

        poly([hx - hr * .1,hy - hr * .55],[hx,hy - hr * .9],[hx + hr * .1,hy - hr * .55]);

        poly([hx - hr * .32,hy - hr * .48],[hx - hr * .3,hy - hr * .8,hx,hy - hr * .85],[hx + hr * .3,hy - hr * .8,hx + hr * .32,hy - hr * .48]);

        FS('#d8b828'); bP();
        times(5, i => {
          const a = -PI / 2 + i * PI * 2 / 5; const bx = hx + CO(a) * hr * .1; const by = hy - hr * .66 + SI(a) * hr * .1; i === 0 ? mT(bx, by) : lT(bx, by); const a2 = a + PI / 5; lT(hx + CO(a2) * hr * .045, hy - hr * .66 + SI(a2) * hr * .045)
        });
        cP(); fL();

        SS(dk); lnW(LW(.015)); plS([hx - hr * .6, hy - hr * .42],[hx, hy - hr * .52, hx + hr * .6, hy - hr * .42]);
        break
      }
      case 'tuiga': {

        FS(acc2); poly([hx - hr * .5,hy - hr * .42],[hx + hr * .5,hy - hr * .42],[hx + hr * .45,hy - hr * .6],[hx - hr * .45,hy - hr * .6]);

        SS('#8a6a48'); lnW(LW(.025, 1.5));
        ([-.7, -.35, 0, .35, .7]).forEach(ta => {
          plS([hx + ta * hr * .3, hy - hr * .55],[hx + ta * hr * .9, hy - hr * (1.4 - AB(ta) * .35)])
        });

        lnW(LW(.018)); plS([hx - hr * .55, hy - hr * .95],[hx, hy - hr * 1.25, hx + hr * .55, hy - hr * .95]);

        FS('#c03028');
        ([-.5, -.25, 0, .25, .5]).forEach(tx => {
          ell(hx + tx * hr, hy - hr * (1.1 - AB(tx) * .15), hr * .07, hr * .16)
        });

        FS(dk);
        ([-.3, 0, .3]).forEach(bx => {
          ell(hx + bx * hr, hy - hr * .51, hr * .035, hr * .035)
        });
        break
      }
      case 'zhawa': {

        FS(acc2);

        poly([hx - hr * .4,hy - hr * .45],[hx - hr * .42,hy - hr * .85,hx - hr * .15,hy - hr * .92],[hx,hy - hr * .96,hx + hr * .15,hy - hr * .92],[hx + hr * .42,hy - hr * .85,hx + hr * .4,hy - hr * .45]);

        FS('#e8d8b0'); poly([hx - hr * .48,hy - hr * .48],[hx,hy - hr * .62,hx + hr * .48,hy - hr * .48],[hx + hr * .48,hy - hr * .38],[hx,hy - hr * .52,hx - hr * .48,hy - hr * .38]);

        SS('#c0a878'); lnW(LW(.012));
        ([-.35, -.18, 0, .18, .35]).forEach(fx => {
          plS([hx + fx * hr, hy - hr * .55],[hx + fx * hr, hy - hr * .42])
        });

        FS('#d8c8a0');
        mir(s => {
          poly([hx + s * hr * .4,hy - hr * .5],[hx + s * hr * .55,hy - hr * .3,hx + s * hr * .5,hy + hr * .1],[hx + s * hr * .35,hy + hr * .15],[hx + s * hr * .4,hy - hr * .2,hx + s * hr * .35,hy - hr * .5])
        });

        SS(dk); lnW(LW(.018)); plS([hx - hr * .36, hy - hr * .62],[hx, hy - hr * .72, hx + hr * .36, hy - hr * .62]);
        break
      }
      case 'glengarry': {

        FS(acc2);

        poly([hx - hr * .45,hy - hr * .55],[hx - hr * .5,hy - hr * .85,hx - hr * .25,hy - hr * .92],[hx,hy - hr * .78,hx + hr * .25,hy - hr * .92],[hx + hr * .5,hy - hr * .85,hx + hr * .45,hy - hr * .55],[hx,hy - hr * .45,hx - hr * .45,hy - hr * .55]);

        SS(dk); lnW(LW(.02)); plS([hx - hr * .3, hy - hr * .68],[hx, hy - hr * .62, hx + hr * .3, hy - hr * .68]);

        SS(dk); lnW(hr * .08); plS([hx - hr * .45, hy - hr * .55],[hx, hy - hr * .45, hx + hr * .45, hy - hr * .55]);

        SS(dk); lnW(LW(.05));
        ([.18, .3]).forEach(rx => {
          plS([hx + rx * hr, hy - hr * .5],[hx + rx * hr + hr * .08, hy - hr * .1, hx + rx * hr - hr * .03, hy + hr * .3])
        });

        FS('#c03028'); dot(hx - hr * .32, hy - hr * .5, hr * .06); SS(dk); lnW(LW(.015)); dots(hx - hr * .32, hy - hr * .5, hr * .06);
        break
      }
      case 'satroka': {

        FS(acc2);

        poly([hx - hr * .6,hy - hr * .5],[hx - hr * .55,hy - hr * .68,hx - hr * .4,hy - hr * .62],[hx,hy - hr * .5,hx + hr * .4,hy - hr * .62],[hx + hr * .55,hy - hr * .68,hx + hr * .6,hy - hr * .5],[hx,hy - hr * .38,hx - hr * .6,hy - hr * .5]);

        poly([hx - hr * .32,hy - hr * .55],[hx - hr * .18,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .18,hy - hr * .95],[hx + hr * .32,hy - hr * .55]);

        FS('#c03828'); poly([hx - hr * .33,hy - hr * .58],[hx + hr * .33,hy - hr * .58],[hx + hr * .3,hy - hr * .5],[hx - hr * .3,hy - hr * .5]);

        SS(dk); lnW(LW(.015));
        ([-.12, .12]).forEach(sxx => {
          plS([hx + sxx * hr, hy - hr * .9],[hx + sxx * hr * 1.6, hy - hr * .55])
        });

        FS('#c03828'); ell(hx, hy - hr * .98, hr * .05, hr * .04);
        break
      }
      case 'taupoo': {

        FS(acc2);

        poly([hx - hr * .42,hy - hr * .45],[hx - hr * .48,hy - hr * .8,hx - hr * .2,hy - hr * .95],[hx,hy - hr * 1.02,hx + hr * .2,hy - hr * .95],[hx + hr * .48,hy - hr * .8,hx + hr * .42,hy - hr * .45],[hx,hy - hr * .35,hx - hr * .42,hy - hr * .45]);

        SS(dk); lnW(LW(.015));
        ([-.6, -.75, -.9]).forEach(fy => {
          plS([hx - hr * .35, hy + fy * hr],[hx, hy + (fy - .06) * hr, hx + hr * .35, hy + fy * hr])
        });

        FS(acc2); poly([hx + hr * .38,hy - hr * .7],[hx + hr * .62,hy - hr * .75,hx + hr * .55,hy - hr * .45],[hx + hr * .62,hy - hr * .25,hx + hr * .42,hy - hr * .4]); SS(dk); lnW(LW(.015)); plS([hx + hr * .42, hy - hr * .55],[hx + hr * .55, hy - hr * .6, hx + hr * .52, hy - hr * .4]);

        FS('#e85878');
        ([0, 1.26, 2.52, 3.77, 5.03]).forEach(pa => {
          const px2 = hx + hr * .48 + CO(pa) * hr * .07; const py2 = hy - hr * .52 + SI(pa) * hr * .07; ell(px2, py2, hr * .05, hr * .035, pa)
        });
        FS('#f8d858'); dot(hx + hr * .48, hy - hr * .52, hr * .03);
        break
      }
      case 'salusalu': {

        FS('#3a7838');
        ([-.9, -.45, 0, .45, .9]).forEach(fa => {
          sV(); tR(hx, hy - hr * .5); rO(fa * .5); ell(0, -hr * .3, hr * .09, hr * .35); rS()
        });

        for (const [fx, fy] of [[-.4, -.55], [-.2, -.68], [0, -.72], [.2, -.68], [.4, -.55]]) {
          const cx2 = hx + fx * hr, cy2 = hy + fy * hr; FS('#f8f4e8');
          ([0, 1.26, 2.52, 3.77, 5.03]).forEach(pa => {
            ell(cx2 + CO(pa) * hr * .055, cy2 + SI(pa) * hr * .055, hr * .045, hr * .03, pa)
          });
          FS('#f0c030'); dot(cx2, cy2, hr * .028)
        }
        break
      }
      case 'kapkap': {

        SS(dk); lnW(hr * .07); plS([hx - hr * .45, hy - hr * .5],[hx, hy - hr * .6, hx + hr * .45, hy - hr * .5]);

        FS('#f0ead8'); dot(hx, hy - hr * .78, hr * .28); SS('#a89878'); lnW(LW(.015)); dots(hx, hy - hr * .78, hr * .28);

        SS('#b0a080'); lnW(LW(.012));
        ([.18, .1]).forEach(rr => {
          dots(hx, hy - hr * .78, hr * rr)
        });

        FS('#a89878'); dot(hx,hy - hr * .78,hr * .03);

        SS(dk); lnW(LW(.02)); plS([hx, hy - hr * .5],[hx, hy - hr * .52]);
        break
      }
      case 'tekiteki': {

        SS(dk); lnW(hr * .08); plS([hx - hr * .48, hy - hr * .52],[hx, hy - hr * .62, hx + hr * .48, hy - hr * .52]);

        FS('#c8b888');
        ([-.3, -.15, 0, .15, .3]).forEach(bx => {
          dot(hx + bx * hr, hy - hr * .57, hr * .02)
        });

        FS('#e8e0d0'); poly([hx - hr * .04,hy - hr * .58],[hx - hr * .14,hy - hr * 1.0,hx,hy - hr * 1.05],[hx + hr * .14,hy - hr * 1.0,hx + hr * .04,hy - hr * .58]);

        SS('#a89878'); lnW(LW(.015)); plS([hx, hy - hr * .58],[hx, hy - hr * 1.02]);

        SS('#c03028'); lnW(hr * .05); plS([hx - hr * .08, hy - hr * .55],[hx + hr * .08, hy - hr * .55]);
        break
      }
      case 'pare': {

        FS(acc2);

        ell(hx, hy - hr * .5, hr * .62, hr * .16);

        SS(dk); lnW(LW(.012));
        ([.45, .32]).forEach(rr => {
          ells(hx, hy - hr * .5, hr * rr, hr * rr * .26)
        });

        poly([hx - hr * .3,hy - hr * .5],[hx - hr * .32,hy - hr * .8,hx - hr * .12,hy - hr * .88],[hx,hy - hr * .92,hx + hr * .12,hy - hr * .88],[hx + hr * .32,hy - hr * .8,hx + hr * .3,hy - hr * .5]);

        ([-.6, -.7, -.8]).forEach(wy => {
          plS([hx - hr * .28, hy + wy * hr],[hx, hy + (wy - .05) * hr, hx + hr * .28, hy + wy * hr])
        });

        SS('#c03828'); lnW(hr * .04); plS([hx - hr * .3, hy - hr * .54],[hx, hy - hr * .62, hx + hr * .3, hy - hr * .54]);
        break
      }
      case 'capote': {

        FS(acc2);

        ell(hx, hy - hr * .35, hr * .72, hr * .78);

        FS(dk); ell(hx, hy - hr * .32, hr * .52, hr * .58);

        FS(acc2); poly([hx - hr * .72,hy - hr * .05],[hx - hr * .78,hy + hr * .15,hx - hr * .55,hy + hr * .12],[hx - hr * .5,hy + hr * .02]); poly([hx + hr * .72,hy - hr * .05],[hx + hr * .78,hy + hr * .15,hx + hr * .55,hy + hr * .12],[hx + hr * .5,hy + hr * .02]);

        SS(dk); lnW(hr * .05); plS([hx - hr * .08, hy + hr * .18],[hx + hr * .08, hy + hr * .18]);
        break
      }
      case 'taraz': {

        FS('#d0d8e0'); poly([hx - hr * .5,hy - hr * .62],[hx,hy - hr * .74,hx + hr * .5,hy - hr * .62],[hx + hr * .46,hy - hr * .5],[hx,hy - hr * .6,hx - hr * .46,hy - hr * .5]);

        FS('#a03030');
        ([-.22, 0, .22]).forEach(sx => {
          dot(hx + sx * hr, hy - hr * .58, hr * .03)
        });

        SS('#c8a848'); lnW(LW(.015));
        mir(s => {
          plS([hx + s * hr * .46, hy - hr * .56],[hx + s * hr * .5, hy - hr * .3, hx + s * hr * .42, hy - hr * .1]); FS('#e0b840'); dot(hx + s * hr * .42, hy - hr * .08, hr * .05)
        });

        FS('rgba(240,240,245,.35)'); poly([hx - hr * .48,hy - hr * .5],[hx - hr * .55,hy + hr * .3,hx - hr * .4,hy + hr * .6],[hx + hr * .4,hy + hr * .6],[hx + hr * .55,hy + hr * .3,hx + hr * .48,hy - hr * .5]);

        SS('#c8a848'); lnW(hr * .02); mv(hx, hy - hr * .72); mT(hx, hy - hr * .72); lT(hx, hy - hr * .84); mT(hx - hr * .04, hy - hr * .78); mT(hx - hr * .04, hy - hr * .78); lT(hx + hr * .04, hy - hr * .78); sK();
        break
      }
      case 'kalagayi': {

        FS(acc2);

        poly([hx - hr * .55,hy - hr * .25],[hx - hr * .58,hy - hr * .85,hx,hy - hr * .95],[hx + hr * .58,hy - hr * .85,hx + hr * .55,hy - hr * .25],[hx,hy - hr * .1,hx - hr * .55,hy - hr * .25]);

        SS(dk); lnW(LW(.015)); plS([hx - hr * .48, hy - hr * .32],[hx, hy - hr * .16, hx + hr * .48, hy - hr * .32]);
        ([-.36, -.18, 0, .18, .36]).forEach(dx => {
          polyS([hx + dx * hr,hy - hr * .3],[hx + dx * hr + hr * .04,hy - hr * .26],[hx + dx * hr,hy - hr * .22],[hx + dx * hr - hr * .04,hy - hr * .26])
        });

        poly([hx + hr * .45,hy - hr * .6],[hx + hr * .62,hy - hr * .4,hx + hr * .55,hy - hr * .12],[hx + hr * .42,hy - hr * .15],[hx + hr * .5,hy - hr * .45,hx + hr * .38,hy - hr * .58]);

        FS(dk); dot(hx + hr * .52, hy - hr * .1, hr * .04);
        break
      }
      case 'agal': {

        SS(dk);

        ([.72, .8]).forEach(oy => {
          lnW(hr * .05); plS([hx - hr * .5, hy - oy * hr],[hx, hy - (oy + .1) * hr, hx + hr * .5, hy - oy * hr])
        });

        lnW(hr * .04); plS([hx + hr * .48, hy - hr * .7],[hx + hr * .52, hy - hr * .6, hx + hr * .48, hy - hr * .5]);

        for (const [tx, len] of [[.46, .35], [.52, .42]]) {
          lnW(hr * .025); plS([hx + tx * hr, hy - hr * .5],[hx + tx * hr + hr * .03, hy - hr * .3, hx + tx * hr, hy - hr * len]);

          FS(dk); dot(hx + tx * hr, hy - hr * len + hr * .02, hr * .03)
        }

        FS('rgba(250,250,248,.4)'); poly([hx - hr * .5,hy - hr * .55],[hx - hr * .55,hy - hr * .3,hx - hr * .48,hy - hr * .1],[hx + hr * .48,hy - hr * .1],[hx + hr * .55,hy - hr * .3,hx + hr * .5,hy - hr * .55]);
        break
      }
      case 'chechia': {

        FS('#c03028');

        poly([hx - hr * .42,hy - hr * .45],[hx - hr * .38,hy - hr * .82],[hx,hy - hr * .9,hx + hr * .38,hy - hr * .82],[hx + hr * .42,hy - hr * .45],[hx,hy - hr * .35,hx - hr * .42,hy - hr * .45]);

        FS('#d03830'); ell(hx, hy - hr * .82, hr * .38, hr * .1);

        SS('#8a2020'); lnW(LW(.012));
        ([-.3, -.15, 0, .15, .3]).forEach(vx => {
          plS([hx + vx * hr, hy - hr * .5],[hx + vx * hr * 1.05, hy - hr * .78])
        });

        SS(dk); lnW(hr * .04); plS([hx - hr * .42, hy - hr * .48],[hx, hy - hr * .38, hx + hr * .42, hy - hr * .48]);
        break
      }
      case 'ekori': {

        FS(acc2);

        for (const [sx, lean2] of [[-.18, -.15], [0, 0], [.18, .15]]) {
          sV(); tR(hx + sx * hr, hy - hr * .55); rO(lean2 * .5); poly([-hr * .07,0],[-hr * .1,-hr * .45,0,-hr * .55],[hr * .1,-hr * .45,hr * .07,0]); rS()
        }

        SS('#5a4030'); lnW(hr * .09); plS([hx - hr * .48, hy - hr * .55],[hx, hy - hr * .68, hx + hr * .48, hy - hr * .55]);

        FS('#c8c8c8');
        ([-.24, -.08, .08, .24]).forEach(bx => {
          dot(hx + bx * hr, hy - hr * .6, hr * .025)
        });

        SS('#5a4030'); lnW(LW(.02));
        ([-.4, .4]).forEach(sx => {
          plS([hx + sx * hr, hy - hr * .5],[hx + sx * hr * 1.1, hy - hr * .2])
        });
        break
      }
      case 'jok': {

        FS(acc2);

        poly([hx - hr * .75,hy - hr * .3],[hx,hy - hr * 1.05],[hx + hr * .75,hy - hr * .3]);

        SS(dk); lnW(LW(.012));
        ([-.5, -.25, 0, .25, .5]).forEach(ax2 => {
          plS([hx, hy - hr * 1.02],[hx + ax2 * hr, hy - hr * .32])
        });

        SS(dk); lnW(hr * .035); plS([hx - hr * .75, hy - hr * .3],[hx, hy - hr * .22, hx + hr * .75, hy - hr * .3]);

        FS('#c84838'); dot(hx, hy - hr * 1.02, hr * .035);

        SS(dk); lnW(LW(.015));
        ([-.55, .55]).forEach(sx => {
          plS([hx + sx * hr, hy - hr * .28],[hx + sx * hr * .8, hy + hr * .2])
        });
        break
      }
      case 'clop': {

        FS(acc2);

        poly([hx - hr * .5,hy - hr * .4],[hx - hr * .42,hy - hr * 1.3],[hx,hy - hr * 1.42,hx + hr * .42,hy - hr * 1.3],[hx + hr * .5,hy - hr * .4]);

        FS(dk);
        span(-3, 3, i => {
          dot(hx + i * hr * .14, hy - hr * .4, hr * .07)
        })

        FS(dk); rect(hx - hr * .52, hy - hr * .5, hr * 1.04, hr * .1);

        FS(acc2);
        span(-1, 1, i => {
          dot(hx + i * hr * .15, hy - hr * .65, hr * .045)
        })
        break
      }
      case 'csikos': {

        FS(acc2); ell(hx, hy - hr * .55, hr * 1.15, hr * .22);

        FS(dk); poly([hx - hr * .45,hy - hr * .6],[hx - hr * .5,hy - hr * 1.15],[hx,hy - hr * 1.25,hx + hr * .5,hy - hr * 1.15],[hx + hr * .45,hy - hr * .6]);

        FS(acc2); rect(hx - hr * .47, hy - hr * .75, hr * .94, hr * .12);

        SS(acc2); lnW(LW(.06, 1.5)); dots(hx + hr * .45, hy - hr * .68, hr * .08); plS([hx + hr * .48, hy - hr * .62],[hx + hr * .5, hy - hr * .4]);

        ell(hx - hr * .4, hy - hr * .85, hr * .05, hr * .18, -.3);
        break
      }
      case 'rogatywka': {

        FS(acc2); poly([hx - hr * .55,hy - hr * .95],[hx - hr * .45,hy - hr * 1.15],[hx + hr * .45,hy - hr * 1.15],[hx + hr * .55,hy - hr * .95]);

        FS(dk); poly([hx - hr * .55,hy - hr * .95],[hx + hr * .55,hy - hr * .95],[hx + hr * .48,hy - hr * .55],[hx - hr * .48,hy - hr * .55]);

        FS(acc2); ell(hx, hy - hr * .55, hr * .55, hr * .1);

        FS('#e8e8e0'); dot(hx,hy - hr * .78,hr * .07);
        break
      }
      case 'papakha': {

        FS(acc2);

        poly([hx - hr * .5,hy - hr * .3],[hx - hr * .55,hy - hr * 1.35],[hx,hy - hr * 1.5,hx + hr * .55,hy - hr * 1.35],[hx + hr * .5,hy - hr * .3]);

        FS(dk);
        span(-3, 3, i => {
          dot(hx + i * hr * .16, hy - hr * (1.32 - AB(i) * .03), hr * .09)
        })

        FS(dk); rect(hx - hr * .52, hy - hr * .55, hr * 1.04, hr * .12);

        SS(dk); lnW(LW(.04));
        span(-2, 2, i => {
          plS([hx + i * hr * .2, hy - hr * .5],[hx + i * hr * .22, hy - hr * 1.25])
        })
        break
      }
      case 'venok': {

        const cols = [acc2, '#d04838', '#e8c838', '#4898d0'];
        times(7, i => {
          const a = PI + PI * (i / 6) - .05; const fxp = hx + CO(a) * hr * .95; const fyp = hy - hr * .15 + SI(a) * hr * .9; FS(cols[i % 4]);

          times(5, p2 => {
            const pa = p2 * PI * 2 / 5; ell(fxp + CO(pa) * hr * .07,fyp + SI(pa) * hr * .07,hr * .06,hr * .04,pa)
          });
          FS('#e8c848'); dot(fxp,fyp,hr * .04)
        });

        mir(s => {
          SS(cols[s > 0 ? 1 : 3]); lnW(LW(.1, 2)); plS([hx + s * hr * .7, hy - hr * .3],[hx + s * hr * .95, hy + hr * .3,
            hx + s * hr * .85, hy + hr * 1.1])
        });
        break
      }
      case 'borla': {

        const tx = hx, ty = hy - hr * .5;

        SS(acc2); lnW(LW(.05)); plS([tx, hy - hr * 1.05],[tx, ty - hr * .12]);

        FS(acc2); dot(tx,ty,hr * .16);

        SS(dk); lnW(LW(.035));
        ([-.08, 0, .08]).forEach(off => {
          ells(tx + off * hr, ty, hr * (.1 - AB(off) * .5), hr * .15)
        });

        FS(dk); dot(tx,ty - hr * .17,hr * .04); dot(tx,ty + hr * .17,hr * .04);
        break
      }
      case 'sarpech': {

        FS(acc2); rect(hx - hr * .5, hy - hr * .85, hr, hr * .15);

        poly([hx,hy - hr * 1.3],[hx - hr * .14,hy - hr * 1.05],[hx,hy - hr * .85],[hx + hr * .14,hy - hr * 1.05]); FS(dk); dot(hx,hy - hr * 1.05,hr * .06);

        SS(acc2); lnW(LW(.07, 2)); plS([hx, hy - hr * 1.3],[hx + hr * .1, hy - hr * 1.55, hx + hr * .2, hy - hr * 1.6]);

        FS(acc2);
        mir(s => {
          times(3, i => {
            dot(hx + s * hr * .25, hy - hr * (.68 - i * .12), hr * .045)
          })
        });
        break
      }
      case 'pheta': {

        FS(acc2);

        poly([hx - hr * .55,hy - hr * .55],[hx - hr * .5,hy - hr * 1.15,hx + hr * .3,hy - hr * 1.1],[hx + hr * .55,hy - hr * .55]);

        poly([hx - hr * .55,hy - hr * .6],[hx - hr * .85,hy - hr * 1.05],[hx - hr * .7,hy - hr * 1.15],[hx - hr * .45,hy - hr * .8]);

        SS(dk); lnW(LW(.045));
        times(3, i => {
          plS([hx - hr * .5, hy - hr * (.58 + i * .15)],[hx, hy - hr * (.66 + i * .16), hx + hr * .5, hy - hr * (.56 + i * .15)])
        });

        bP(); aR(hx - hr * .68, hy - hr * 1.0, hr * .07, 0, 7); FS(dk); fL();
        break
      }
      case 'jaapi': {

        FS(acc2);

        poly([hx - hr * 1.1,hy - hr * .55],[hx,hy - hr * 1.45],[hx + hr * 1.1,hy - hr * .55]);

        SS(dk); lnW(LW(.04));
        span(1, 3, i => {
          plS([hx - hr * (1.1 - i * .25), hy - hr * (.55 + i * .22)],[hx, hy - hr * (.62 + i * .22), hx + hr * (1.1 - i * .25), hy - hr * (.55 + i * .22)])
        })
        span(-2, 2, i => {
          plS([hx, hy - hr * 1.45],[hx + i * hr * .4, hy - hr * .6])
        })

        FS(dk); dot(hx,hy - hr * 1.42,hr * .1);
        break
      }
      case 'tilak': {

        const tx = hx, ty = hy - hr * .55; SS(acc2); lnW(LW(.07, 1.5)); lC('round');

        plS([tx - hr * .1, ty + hr * .12],[tx - hr * .12, ty - hr * .08, tx - hr * .08, ty - hr * .18]); plS([tx + hr * .1, ty + hr * .12],[tx + hr * .12, ty - hr * .08, tx + hr * .08, ty - hr * .18]);

        plS([tx, ty + hr * .14],[tx, ty - hr * .16]);

        FS(dk); dot(tx,ty + hr * .14,hr * .07);
        break
      }
      case 'peacock': {

        FS(acc2); rect(hx - hr * .45, hy - hr * .8, hr * .9, hr * .18);

        const pcols = ['#286848', '#386858', '#286848'];
        span(-1, 1, i => {
          const ang = i * .5; const px2 = hx + SI(ang) * hr * 1.1; const py2 = hy - hr * .75 - CO(ang) * hr * .9; SS('#3a5040'); lnW(LW(.06, 1.5)); plS([hx, hy - hr * .75],[hx + SI(ang) * hr * .5, hy - hr * 1.2, px2, py2]);

          FS(pcols[i + 1]); ell(px2, py2, hr * .16, hr * .2, ang); FS('#205890'); ell(px2, py2 - hr * .03, hr * .09, hr * .12, ang); FS(dk); ell(px2, py2 - hr * .03, hr * .045, hr * .06, ang)
        })

        FS(dk); dot(hx,hy - hr * .7,hr * .08);
        break
      }
      case 'jhoomar': {

        const jx = hx - hr * .5, jy = hy - hr * .55;

        FS(acc2); bP(); aR(jx, jy, hr * .22, .5, 5.3); cP(); cP(); fL(); FS(dk); dot(jx + hr * .08, jy - hr * .05, hr * .15);

        FS(acc2);
        times(3, i => {
          const dx = jx - hr * .18 + i * hr * .14;
          times(3 - i, j2 => {
            dot(dx, jy + hr * (.2 + j2 * .16), hr * .045)
          });

          dot(dx, jy + hr * (.2 + (3 - i) * .16), hr * .06)
        });

        SS(acc2); lnW(LW(.04)); plS([jx, jy - hr * .2],[hx - hr * .3, hy - hr * 1.0, hx, hy - hr * 1.1]);
        break
      }
      case 'mukut': {

        FS(acc2);

        rect(hx - hr * .5, hy - hr * .75, hr, hr * .25);

        poly([hx - hr * .45,hy - hr * .75],[hx - hr * .3,hy - hr * 1.1,hx - hr * .15,hy - hr * 1.3],[hx,hy - hr * 1.65,hx + hr * .15,hy - hr * 1.3],[hx + hr * .3,hy - hr * 1.1,hx + hr * .45,hy - hr * .75]);

        SS(dk); lnW(LW(.04));
        ([.95, 1.15, 1.35]).forEach(yy => {
          const ww = hr * (.42 - (yy - .95) * .7); plS([hx - ww, hy - hr * yy],[hx + ww, hy - hr * yy])
        });

        FS(dk); dot(hx,hy - hr * 1.62,hr * .08);

        dot(hx,hy - hr * .62,hr * .11);
        break
      }
      case 'pagri': {

        FS(acc2);

        poly([hx - hr * .6,hy - hr * .5],[hx - hr * .5,hy - hr * 1.35,hx + hr * .25,hy - hr * 1.3],[hx + hr * .75,hy - hr * 1.2,hx + hr * .62,hy - hr * .5]);

        SS(dk); lnW(LW(.04)); bP();
        times(4, i => {
          mT(hx - hr * .55, hy - hr * (.55 + i * .16)); qT(hx, hy - hr * (.68 + i * .18), hx + hr * .58, hy - hr * (.52 + i * .16))
        });
        sK();

        SS(acc2); lnW(LW(.1, 2)); plS([hx - hr * .1, hy - hr * .75],[hx + hr * .05, hy - hr * 1.45, hx + hr * .2, hy - hr * 1.5]);

        FS(dk); dot(hx + hr * .15,hy - hr * .85,hr * .09);
        break
      }
      case 'tikka': {

        SS(acc2); lnW(LW(.05)); plS([hx, hy - hr * 1.05],[hx, hy - hr * .68]);

        FS(acc2);
        times(3, i => {
          dot(hx, hy - hr * (1.0 - i * .12), hr * .045)
        });

        poly([hx,hy - hr * .72],[hx - hr * .14,hy - hr * .55,hx,hy - hr * .42],[hx + hr * .14,hy - hr * .55,hx,hy - hr * .72]);

        FS(dk); dot(hx - hr * .03,hy - hr * .57,hr * .04);

        FS(acc2); dot(hx - hr * .35,hy - hr * .78,hr * .04); dot(hx + hr * .35,hy - hr * .78,hr * .04);
        break
      }
      case 'karakul': {

        FS(acc2); poly([hx - hr * .6,hy - hr * .5],[hx - hr * .55,hy - hr * 1.15,hx,hy - hr * 1.2],[hx + hr * .55,hy - hr * 1.15,hx + hr * .6,hy - hr * .5],[hx,hy - hr * .72,hx - hr * .6,hy - hr * .5]);

        SS(dk); lnW(LW(.035)); bP();
        times(10, i => {
          const fx = hx - hr * .5 + i * hr * .11; const fy = hy - hr * (.5 + .04 * SI(i * 3)); mT(fx, fy); lT(fx + hr * .04, fy - hr * .07)
        });
        sK();

        plS([hx, hy - hr * 1.18],[hx + hr * .05, hy - hr * .85, hx, hy - hr * .68]);
        break
      }
      case 'bandeau': {

        SS(acc2); lnW(hr * .22); bP(); eC(hx, hy - hr * .28, hr * .95, hr * .8, 0, PI * 1.05, PI * 1.95); sK();

        FS(dk); dot(hx + hr * .82, hy - hr * .32, hr * .12);

        FS(acc2); poly([hx + hr * .85,hy - hr * .35],[hx + hr * .75,hy - hr * 1.1,hx + hr * .95,hy - hr * 1.35],[hx + hr * .95,hy - hr * .9,hx + hr * .9,hy - hr * .35]); SS(dk); lnW(LW(.03)); plS([hx + hr * .87, hy - hr * .35],[hx + hr * .92, hy - hr * 1.3]);

        FS('#e0c040'); poly([hx,hy - hr * .5],[hx + hr * .09,hy - hr * .32],[hx,hy - hr * .14],[hx - hr * .09,hy - hr * .32]);
        break
      }
      case 'cordobes': {

        FS(acc2);

        poly([hx - hr * .5,hy - hr * .5],[hx - hr * .5,hy - hr * 1.0],[hx + hr * .5,hy - hr * 1.0],[hx + hr * .5,hy - hr * .5]);

        ell(hx, hy - hr * .5, hr * .95, hr * .17);

        FS(dk); rect(hx - hr * .5, hy - hr * .66, hr, hr * .13);

        SS(dk); lnW(LW(.04)); ells(hx, hy - hr * .5, hr * .95, hr * .17);
        break
      }
      case 'chullo': {

        FS(acc2);

        poly([hx - hr * .55,hy - hr * .45],[hx - hr * .4,hy - hr * 1.3,hx,hy - hr * 1.35],[hx + hr * .4,hy - hr * 1.3,hx + hr * .55,hy - hr * .45]);

        poly([hx - hr * .55,hy - hr * .45],[hx - hr * .6,hy + hr * .3],[hx - hr * .45,hy + hr * .35],[hx - hr * .4,hy - hr * .45]); poly([hx + hr * .55,hy - hr * .45],[hx + hr * .6,hy + hr * .3],[hx + hr * .45,hy + hr * .35],[hx + hr * .4,hy - hr * .45]);

        SS(dk); lnW(LW(.05, 1.2)); mv(hx - hr * .45, hy - hr * .7); mT(hx - hr * .45, hy - hr * .7); lT(hx + hr * .45, hy - hr * .7); mT(hx - hr * .35, hy - hr * .9); mT(hx - hr * .35, hy - hr * .9); lT(hx + hr * .35, hy - hr * .9); sK(); bP();
        times(5, i => {
          const dx = hx - hr * .36 + i * hr * .18; mT(dx, hy - hr * .85); mT(dx, hy - hr * .85); lT(dx + hr * .08, hy - hr * .75); lT(dx + hr * .16, hy - hr * .85)
        });
        sK();

        SS(acc2); lnW(LW(.05, 1.5)); mv(hx - hr * .52, hy + hr * .32); lT(hx - hr * .55, hy + hr * .6); mT(hx + hr * .52, hy + hr * .32); lT(hx + hr * .55, hy + hr * .6); sK(); FS(dk); bP(); aR(hx - hr * .55, hy + hr * .62, hr * .07, 0, 7); aR(hx + hr * .55, hy + hr * .62, hr * .07, 0, 7); fL();
        break
      }
      case 'pith': {

        FS(acc2);

        bP(); eC(hx, hy - hr * .5, hr * .55, hr * .5, 0, PI, 0); cP(); cP(); fL();

        ell(hx, hy - hr * .5, hr * .95, hr * .18);

        SS(dk); lnW(LW(.04)); ells(hx, hy - hr * .5, hr * .95, hr * .18);

        FS(dk); rect(hx - hr * .55, hy - hr * .62, hr * 1.1, hr * .14);

        dot(hx, hy - hr * 1.0, hr * .06);
        break
      }
      case 'kepi': {

        FS(acc2); poly([hx - hr * .55,hy - hr * .45],[hx - hr * .45,hy - hr * 1.05],[hx + hr * .55,hy - hr * 1.05],[hx + hr * .62,hy - hr * .45]);

        ell(hx + hr * .05, hy - hr * 1.05, hr * .5, hr * .12);

        FS(dk); ell(hx, hy - hr * .4, hr * .68, hr * .11);

        rect(hx - hr * .58, hy - hr * .62, hr * 1.18, hr * .14); SS(dk); lnW(LW(.04)); mv(hx - hr * .5, hy - hr * .5); mT(hx - hr * .5, hy - hr * .5); lT(hx - hr * .44, hy - hr * .95); mT(hx + hr * .58, hy - hr * .5); mT(hx + hr * .58, hy - hr * .5); lT(hx + hr * .52, hy - hr * .95); sK();
        break
      }
      case 'pamela': {

        FS(acc2); mv(hx - hr * 1.3, hy - hr * .45);
        span(0, 8, i => {
          const px = hx - hr * 1.3 + i * hr * .325;
          qT(
            px - hr * .16, hy - hr * (.45 + .1 * SI(i * 2.4)),
            px, hy - hr * (.45 + .1 * SI((i + 1) * 2.4)))
        })
        qT(hx, hy - hr * .2, hx - hr * 1.3, hy - hr * .45); cP(); cP(); fL();

        bP(); eC(hx, hy - hr * .6, hr * .55, hr * .45, 0, PI, 0); cP(); cP(); fL();

        FS(dk); rect(hx - hr * .55, hy - hr * .62, hr * 1.1, hr * .12);

        poly([hx + hr * .5,hy - hr * .6],[hx + hr * .72,hy - hr * .72],[hx + hr * .72,hy - hr * .48]);
        break
      }
      case 'vueltiao': {

        FS(acc2); bP(); eC(hx, hy - hr * .5, hr * .5, hr * .5, 0, PI, 0); cP(); cP(); fL();

        mv(hx - hr, hy - hr * .52); qT(hx, hy - hr * .7, hx + hr, hy - hr * .52); qT(hx, hy - hr * .45, hx - hr, hy - hr * .52); cP(); FS(acc2); fL();

        SS(dk); lnW(hr * .1); plS([hx - hr * .55, hy - hr * .52],[hx + hr * .55, hy - hr * .52]);

        SS(dk); lnW(LW(.045)); bP();
        times(6, i => {
          const zx = hx - hr * .42 + i * hr * .15; mT(zx, hy - hr * .95); lT(zx + hr * .08, hy - hr * .7)
        });
        sK();

        bP();
        times(8, i => {
          const zx = hx - hr * .85 + i * hr * .24; mT(zx, hy - hr * .55); lT(zx + hr * .12, hy - hr * .6)
        });
        sK();
        break
      }
      case 'capotain': {

        FS(acc2);

        poly([hx - hr * .5,hy - hr * .5],[hx - hr * .4,hy - hr * 1.35],[hx + hr * .4,hy - hr * 1.35],[hx + hr * .5,hy - hr * .5]);

        FS(dk); ell(hx, hy - hr * .5, hr * .9, hr * .16);

        FS(dk); rect(hx - hr * .47, hy - hr * .75, hr * .94, hr * .16); SS('#d0a030'); lnW(LW(.05, 1.2)); sR(hx - hr * .09, hy - hr * .78, hr * .18, hr * .22);
        break
      }
      case 'capirote': {

        FS(acc2);

        poly([hx - hr * .7,hy + hr * 1.1],[hx - hr * .75,hy - hr * .3,hx,hy - hr * .35],[hx + hr * .75,hy - hr * .3,hx + hr * .7,hy + hr * 1.1]);

        poly([hx - hr * .45,hy - hr * .3],[hx,hy - hr * 1.9],[hx + hr * .45,hy - hr * .3]);

        SS(dk); lnW(LW(.05, 1.2)); plS([hx - hr * .45, hy - hr * .3],[hx, hy - hr * 1.9],[hx + hr * .45, hy - hr * .3]);

        FS('#1a1a1a'); bP(); eC(hx - hr * .22, hy - hr * .05, hr * .09, hr * .12, 0, 0, 7); eC(hx + hr * .22, hy - hr * .05, hr * .09, hr * .12, 0, 0, 7); fL();
        break
      }
      case 'doppa': {

        FS(acc2);

        poly([hx - hr * .55,hy - hr * .15],[hx - hr * .48,hy - hr * .75],[hx,hy - hr * .85,hx + hr * .48,hy - hr * .75],[hx + hr * .55,hy - hr * .15],[hx,hy - hr * .02,hx - hr * .55,hy - hr * .15]);

        FS(dk); ell(hx, hy - hr * .12, hr * .58, hr * .12);

        SS(dk); lnW(LW(.06, 1.2)); mv(hx, hy - hr * .7); mT(hx, hy - hr * .7); lT(hx, hy - hr * .5); mT(hx - hr * .12, hy - hr * .6); mT(hx - hr * .12, hy - hr * .6); lT(hx + hr * .12, hy - hr * .6); sK();

        FS(dk);
        for (const [ox, oy] of [[-.3, -.62], [.3, -.62], [-.35, -.35], [.35, -.35]]) {
          dot(hx + hr * ox, hy + hr * oy, hr * .045)
        }
        break
      }
      case 'kalpak': {

        FS(acc2);

        poly([hx - hr * .5,hy - hr * .3],[hx - hr * .42,hy - hr * 1.25],[hx,hy - hr * 1.35,hx + hr * .42,hy - hr * 1.25],[hx + hr * .5,hy - hr * .3]);

        FS(dk); ell(hx, hy - hr * .32, hr * .62, hr * .16);

        SS(dk); lnW(LW(.05, 1.2)); mv(hx, hy - hr * .5); mT(hx, hy - hr * .5); lT(hx, hy - hr * 1.2); sK(); mv(hx - hr * .2, hy - hr * .48); mT(hx - hr * .2, hy - hr * .48); lT(hx - hr * .15, hy - hr * 1.18); mT(hx + hr * .2, hy - hr * .48); mT(hx + hr * .2, hy - hr * .48); lT(hx + hr * .15, hy - hr * 1.18); sK();
        break
      }
      case 'tagelmust': {

        FS(acc2);

        ell(hx, hy - hr * .35, hr * .72, hr * .62);

        FS(dk); ell(hx, hy - hr * .05, hr * .6, hr * .38);

        FS('#e8c8a8'); ell(hx, hy - hr * .12, hr * .5, hr * .1);

        SS(dk); lnW(LW(.05, 1.2)); bP(); eC(hx, hy - hr * .4, hr * .72, hr * .5, 0, PI * .9, PI * 1.5); sK();
        break
      }
      case 'caubeen': {

        sV(); tR(hx, hy - hr * .55); rO(-.18); FS(acc2); bP(); eC(0, 0, hr * .72, hr * .42, 0, PI, PI * 2); lT(hr * .72, 0); qT(0, hr * .18, -hr * .72, 0); cP(); cP(); fL();

        SS(dk); lnW(LW(.07, 1.5)); mv(0, -hr * .4); mT(0, -hr * .4); lT(0, -hr * .58); sK(); rS();

        FS(dk); ell(hx - hr * .55, hy - hr * .75, hr * .09, hr * .38, .35);
        break
      }
      case 'souwester': {

        FS(acc2);

        bP(); eC(hx, hy - hr * .55, hr * .6, hr * .5, 0, PI, PI * 2); cP(); cP(); fL();

        ell(hx + hr * .25, hy - hr * .25, hr * .85, hr * .18, -.08);

        poly([hx - hr * .6,hy - hr * .3],[hx - hr * .95,hy + hr * .3,hx - hr * .5,hy + hr * .8],[hx - hr * .15,hy + hr * .7],[hx - hr * .5,hy + hr * .25,hx - hr * .25,hy - hr * .28]);

        SS(dk); lnW(LW(.06, 1.2)); bP(); eC(hx, hy - hr * .55, hr * .6, hr * .5, 0, PI * .05, PI * .95); sK();
        break
      }
      case 'petasos': {

        FS(acc2);

        ell(hx, hy - hr * .3, hr * 1.15, hr * .25);

        poly([hx - hr * .5,hy - hr * .32],[hx,hy - hr * 1.1],[hx + hr * .5,hy - hr * .32]);

        SS(dk); lnW(LW(.08, 1.5)); bP(); eC(hx, hy - hr * .3, hr * 1.15, hr * .25, 0, PI * .05, PI * .95); sK();

        SS(dk); lnW(LW(.05)); plS([hx - hr * .5, hy - hr * .3],[hx, hy + hr * 1.0, hx + hr * .5, hy - hr * .3]);
        break
      }
      case 'busby': {

        FS(acc2); bP(); eC(hx, hy - hr * .7, hr * .55, hr * .95, 0, PI, PI * 2); lT(hx + hr * .55, hy - hr * .2); qT(hx, hy, hx - hr * .55, hy - hr * .2); cP(); cP(); fL();

        SS(dk); lnW(LW(.08, 1.5)); bP(); eC(hx, hy - hr * .2, hr * .55, hr * .1, 0, PI * .05, PI * .95); sK();

        FS(dk); ell(hx + hr * .62, hy - hr * .6, hr * .12, hr * .4, -.15);
        break
      }
      case 'fontange': {

        FS('rgba(245,240,230,.85)');
        for (const [ox, oy, s] of [[0, -1.6, 1], [0, -1.3, .8]]) {
          bP(); eC(hx + ox, hy + hr * oy, hr * .55 * s, hr * .4 * s, 0, PI, PI * 2); cP(); cP(); fL()
        }

        FS(acc2); bP(); eC(hx, hy - hr * .6, hr * .7, hr * .45, 0, PI, PI * 2); cP(); cP(); fL();

        SS(dk); lnW(LW(.035));
        ([1, .8]).forEach(s => {
          bP(); eC(hx, hy - hr * (s === 1 ? 1.6 : 1.3), hr * .55 * s, hr * .4 * s, 0, PI, PI * 2); sK()
        });

        FS(acc2); poly([hx,hy - hr * 1.15],[hx - hr * .15,hy - hr * 1.0],[hx,hy - hr * .85],[hx + hr * .15,hy - hr * 1.0]);
        break
      }
      case 'barbette': {

        FS('#f0ece0'); poly([hx - hr * .62,hy - hr * .3],[hx - hr * .65,hy + hr * .6,hx,hy + hr * .75],[hx + hr * .65,hy + hr * .6,hx + hr * .62,hy - hr * .3],[hx + hr * .5,hy - hr * .28],[hx + hr * .52,hy + hr * .5,hx,hy + hr * .62],[hx - hr * .52,hy + hr * .5,hx - hr * .5,hy - hr * .28]);

        SS(acc2); lnW(LW(.14, 2)); ells(hx, hy - hr * .62, hr * .7, hr * .25);

        FS(dk); dot(hx,hy - hr * .85,hr * .06);
        break
      }
      case 'attifet': {

        FS(acc2); poly([hx - hr * .6,hy - hr * .3],[hx - hr * .7,hy - hr * 1.3,hx - hr * .3,hy - hr * 1.45],[hx,hy - hr * 1.0,hx + hr * .3,hy - hr * 1.45],[hx + hr * .7,hy - hr * 1.3,hx + hr * .6,hy - hr * .3],[hx,hy - hr * .55,hx - hr * .6,hy - hr * .3]);

        SS(dk); lnW(LW(.05)); plS([hx - hr * .55, hy - hr * .38],[hx, hy - hr * .62, hx + hr * .55, hy - hr * .38]);

        FS('#e8d8a0'); dot(hx,hy - hr * 1.05,hr * .06);
        break
      }
      case 'kettle': {

        FS(dk); ell(hx, hy - hr * .5, hr * 1.15, hr * .28);

        FS(acc2); bP(); eC(hx, hy - hr * .55, hr * .68, hr * .6, 0, PI, PI * 2); cP(); cP(); fL();

        FS(dk); rect(hx - hr * .03, hy - hr * 1.18, hr * .06, hr * .1);

        SS(dk); lnW(LW(.05, 1.2)); ells(hx, hy - hr * .5, hr * 1.15, hr * .28);
        break
      }
      case 'chaperon': {

        FS(acc2); bP(); eC(hx, hy - hr * .4, hr * .85, hr * .95, 0, PI, PI * 2); qT(hx + hr * .7, hy + hr * .3, hx + hr * .4, hy + hr * .5); qT(hx, hy + hr * .35, hx - hr * .4, hy + hr * .5); qT(hx - hr * .7, hy + hr * .3, hx - hr * .85, hy - hr * .4); cP(); eC(hx, hy + hr * .1, hr * .58, hr * .5, 0, 0, 7); fL('evenodd');

        SS(acc2); lnW(LW(.12, 2)); plS([hx + hr * .55, hy - hr * .1],[hx + hr * .85, hy + hr * .6, hx + hr * .6, hy + hr * 1.3]);
        break
      }
      case 'hennin': {

        FS('rgba(240,240,255,.45)'); poly([hx,hy - hr * 1.7],[hx + hr * 1.1,hy - hr * .8,hx + hr * .9,hy + hr * .9],[hx + hr * .3,hy + hr * .5,hx,hy - hr * 1.7]);

        FS(acc2); poly([hx - hr * .5,hy - hr * .55],[hx,hy - hr * 1.95],[hx + hr * .5,hy - hr * .55]);

        SS(dk); lnW(LW(.09, 1.5)); plS([hx - hr * .51, hy - hr * .56],[hx + hr * .51, hy - hr * .56]);

        FS('#e8d8a0'); dot(hx,hy - hr * 1.95,hr * .06);
        break
      }
      case 'kokoshnik': {

        FS(acc2); poly([hx - hr * .75,hy - hr * .5],[hx - hr * .9,hy - hr * 1.9,hx,hy - hr * 2.0],[hx + hr * .9,hy - hr * 1.9,hx + hr * .75,hy - hr * .5],[hx,hy - hr * .95,hx - hr * .75,hy - hr * .5]);

        SS(dk); lnW(LW(.05)); plS([hx - hr * .68, hy - hr * .62],[hx, hy - hr * .98, hx + hr * .68, hy - hr * .62]);

        FS('#e8d8a0');
        span(-3, 3, i => {
          const bx = hx + i * hr * .2; const by = hy - hr * (1.55 - AB(i) * .18); dot(bx,by,hr * .045)
        })
        break
      }
      case 'biretta': {

        FS(acc2); poly([hx - hr * .55,hy - hr * .55],[hx - hr * .45,hy - hr * 1.05],[hx + hr * .45,hy - hr * 1.05],[hx + hr * .55,hy - hr * .55]);

        SS(dk); lnW(LW(.045));
        span(-1, 1, i => {
          const rx = hx + i * hr * .35; plS([rx, hy - hr * 1.05],[rx + i * hr * .08, hy - hr * 1.3])
        })

        FS(dk); dot(hx,hy - hr * 1.34,hr * .07);

        SS(acc2); lnW(LW(.1, 1.5)); plS([hx - hr * .56, hy - hr * .58],[hx + hr * .56, hy - hr * .58]);
        break
      }
      case 'calot': {

        sV(); tR(hx, hy - hr * .85); rO(-.28); FS(acc2); ell(0, 0, hr * .78, hr * .32);

        SS(dk); lnW(LW(.07, 1.2)); bP(); eC(0, 0, hr * .78, hr * .32, 0, PI * .05, PI * .95); sK(); rS();
        break
      }
      case 'phrygian': {

        FS(acc2); poly([hx - hr * .7,hy - hr * .55],[hx - hr * .55,hy - hr * 1.6,hx + hr * .2,hy - hr * 1.7],[hx + hr * .9,hy - hr * 1.75,hx + hr * .95,hy - hr * 1.15],[hx + hr * .7,hy - hr * 1.35,hx + hr * .4,hy - hr * 1.15],[hx + hr * .75,hy - hr * .95,hx + hr * .7,hy - hr * .55]);

        SS(dk); lnW(LW(.09, 1.5)); plS([hx - hr * .71, hy - hr * .6],[hx + hr * .71, hy - hr * .6]);

        FS('#e8c860'); dot(hx + hr * .3,hy - hr * .85,hr * .08);
        break
      }
      case 'snood': {

        FS(acc2); ell(hx + hr * .5, hy - hr * .35, hr * .5, hr * .55, -.5);

        SS('rgba(255,255,255,.4)'); lnW(1);
        span(-2, 2, i => {
          plS([hx + hr * .5 + i * hr * .2, hy - hr * .9],[hx + hr * .5 + i * hr * .2, hy + hr * .1]); plS([hx, hy - hr * .35 + i * hr * .18],[hx + hr, hy - hr * .35 + i * hr * .18])
        })

        SS(acc2); lnW(LW(.1, 1.5)); plS([hx - hr * .9, hy - hr * .45],[hx, hy - hr * 1.15, hx + hr * .9, hy - hr * .45]);
        break
      }
      case 'mitre': {

        FS(acc2); poly([hx - hr * .55,hy - hr * .55],[hx - hr * .55,hy - hr * 1.1],[hx - hr * .5,hy - hr * 1.75,hx,hy - hr * 1.85],[hx + hr * .5,hy - hr * 1.75,hx + hr * .55,hy - hr * 1.1],[hx + hr * .55,hy - hr * .55]);

        SS(dk); lnW(LW(.05)); plS([hx, hy - hr * 1.82],[hx, hy - hr * 1.1]);

        SS(dk); lnW(LW(.1, 1.5)); plS([hx - hr * .55, hy - hr * .62],[hx + hr * .55, hy - hr * .62]);

        FS('#e8c860'); dot(hx,hy - hr * .62,hr * .07);

        SS(acc2); lnW(LW(.09, 1.5)); plS([hx - hr * .2, hy - hr * 1.6],[hx - hr * .35, hy - hr * .4, hx - hr * .3, hy + hr * .2]); plS([hx + hr * .2, hy - hr * 1.6],[hx + hr * .35, hy - hr * .4, hx + hr * .3, hy + hr * .2]);
        break
      }
      case 'cowboy': {

        FS(acc2); poly([hx - hr * 1.45,hy - hr * .55],[hx - hr * .7,hy - hr * .95,hx,hy - hr * .9],[hx + hr * .7,hy - hr * .95,hx + hr * 1.45,hy - hr * .55],[hx + hr * .9,hy - hr * .65,hx,hy - hr * .6],[hx - hr * .9,hy - hr * .65,hx - hr * 1.45,hy - hr * .55]);

        poly([hx - hr * .55,hy - hr * .75],[hx - hr * .45,hy - hr * 1.5,hx,hy - hr * 1.5],[hx + hr * .45,hy - hr * 1.5,hx + hr * .55,hy - hr * .75]); SS(dk); lnW(LW(.05)); plS([hx - hr * .15, hy - hr * 1.5],[hx, hy - hr * 1.6, hx + hr * .15, hy - hr * 1.5]);

        SS(dk); lnW(LW(.09, 1.5)); plS([hx - hr * .56, hy - hr * .82],[hx + hr * .56, hy - hr * .82]);
        break
      }
      case 'eboshi': {

        FS('#181a20');

        poly([hx - hr * .55,hy - hr * .6],[hx - hr * .4,hy - hr * 1.85,hx + hr * .15,hy - hr * 1.8],[hx + hr * .55,hy - hr * 1.6,hx + hr * .6,hy - hr * .9]);

        poly([hx + hr * .5,hy - hr * 1.6],[hx + hr * 1.5,hy - hr * 1.55,hx + hr * 1.7,hy - hr * 1.2],[hx + hr * 1.2,hy - hr * 1.25,hx + hr * .58,hy - hr * 1.05]);

        SS('#181a20'); lnW(LW(.04)); plS([hx - hr * .5, hy - hr * .55],[hx, hy + hr * .9, hx + hr * .5, hy - hr * .55]);
        break
      }
      case 'topknot': {

        FS('#22252a'); poly([hx - hr * .9,hy - hr * .3],[hx - hr * .95,hy - hr * 1.4,hx,hy - hr * 1.45],[hx + hr * .95,hy - hr * 1.4,hx + hr * .9,hy - hr * .3],[hx + hr * .75,hy - hr * .3],[hx + hr * .8,hy - hr * 1.15,hx,hy - hr * 1.2],[hx - hr * .8,hy - hr * 1.15,hx - hr * .75,hy - hr * .3]);

        FS('rgba(120,140,160,.35)'); bP(); eC(hx, hy - hr * 1.05, hr * .5, hr * .28, 0, PI, PI * 2); fL();

        FS('#22252a'); ell(hx, hy - hr * 1.55, hr * .34, hr * .13, -.35); ell(hx + hr * .1, hy - hr * 1.62, hr * .2, hr * .08, -.5);
        break
      }
      case 'kippah': {

        FS(acc2); poly([hx - hr * .55,hy - hr * .72],[hx,hy - hr * 1.45,hx + hr * .55,hy - hr * .72]); SS(dk); lnW(LW(.05)); plS([hx - hr * .55, hy - hr * .72],[hx, hy - hr * 1.45, hx + hr * .55, hy - hr * .72]);

        SS(dk); lnW(LW(.07)); plS([hx - hr * .56, hy - hr * .73],[hx + hr * .56, hy - hr * .73]);
        break
      }
      case 'coif': {

        FS(acc2); mv(hx - hr * .95, hy - hr * .2); qT(hx - hr, hy - hr * 1.5, hx, hy - hr * 1.5); qT(hx + hr, hy - hr * 1.5, hx + hr * .95, hy - hr * .2); lT(hx + hr * .9, hy + hr * .9); qT(hx + hr * .45, hy + hr * .55, hx, hy + hr * .6); qT(hx - hr * .45, hy + hr * .55, hx - hr * .9, hy + hr * .9); cP();

        eC(hx, hy + hr * .15, hr * .62, hr * .68, 0, 0, 7); fL('evenodd');

        SS(acc2); lnW(LW(.06)); plS([hx - hr * .55, hy + hr * .8],[hx, hy + hr * 1.05, hx + hr * .55, hy + hr * .8]);
        break
      }
      case 'mantilla': {

        FS(acc2);

        bP();
        span(-3, 3, i => {
          mT(hx + i * hr * .16, hy - hr * .9); lT(hx + i * hr * .28, hy - hr * 1.55)
        })
        SS(acc2); lnW(LW(.05)); sK();

        plS([hx - hr * .9, hy - hr * 1.5],[hx, hy - hr * 2, hx + hr * .9, hy - hr * 1.5]);

        FS('rgba(255,255,255,.28)'); poly([hx - hr * .85,hy - hr * 1.45],[hx - hr * 1.5,hy + hr * .9,hx - hr * .8,hy + hr * 1.7],[hx + hr * .8,hy + hr * 1.7],[hx + hr * 1.5,hy + hr * .9,hx + hr * .85,hy - hr * 1.45]);

        FS(acc2); dot(hx,hy - hr * .85,hr * .12);
        break
      }
      case 'kasa': {

        FS(acc2); poly([hx - hr * 1.15,hy - hr * .55],[hx,hy - hr * 1.6],[hx + hr * 1.15,hy - hr * .55]);

        SS('rgba(0,0,0,.18)'); lnW(LW(.035));
        span(-4, 4, i => {
          plS([hx, hy - hr * 1.6],[hx + i * hr * .28, hy - hr * .55])
        })

        span(1, 3, i => {
          bP(); eC(hx, hy - hr * (1.6 - i * .3), hr * .95 * i / 3.5, hr * .08, 0, PI * 1.05, PI * 1.95); sK()
        })

        SS(dk); lnW(LW(.05)); plS([hx - hr * .6, hy - hr * .5],[hx, hy + hr * 1.1, hx + hr * .6, hy - hr * .5]);
        break
      }
      case 'crown2': {

        FS(acc2);

        bP(); eC(hx, hy - hr * .78, hr * .68, hr * .16, 0, PI, 0); eC(hx, hy - hr * .78, hr * .68, hr * .16, 0, PI, 0); fL();

        SS(acc2); lnW(LW(.09, 2)); lC('round'); plS([hx - hr * .55, hy - hr * .75],[hx - hr * .3, hy - hr * 1.8, hx, hy - hr * 1.85]); plS([hx + hr * .55, hy - hr * .75],[hx + hr * .3, hy - hr * 1.8, hx, hy - hr * 1.85]);

        FS('#d8c050'); dot(hx,hy - hr * 1.85,hr * .1); FS('#c04060'); dot(hx,hy - hr * .78,hr * .09);
        break
      }
      case 'beanie': {

        FS(acc2); bP(); eC(hx, hy - hr * .75, hr * .72, hr * .55, 0, PI, 0); eC(hx, hy - hr * .75, hr * .72, hr * .55, 0, PI, 0); fL(); bP(); eC(hx, hy - hr * .75, hr * .72, hr * .12, 0, 0, 7); eC(hx, hy - hr * .75, hr * .72, hr * .12, 0, 0, 7); fL();

        FS('rgba(0,0,0,.2)'); bP(); eC(hx, hy - hr * .62, hr * .74, hr * .16, 0, 0, 7); eC(hx, hy - hr * .62, hr * .74, hr * .16, 0, 0, 7); fL();

        SS('rgba(255,255,255,.25)'); lnW(LW(.03));
        span(-3, 3, i => {
          plS([hx + i * hr * .18, hy - hr * 1.25],[hx + i * hr * .2, hy - hr * .95, hx + i * hr * .2, hy - hr * .68])
        })

        FS(dk); dot(hx,hy - hr * 1.32,hr * .13);
        break
      }
      case 'mortar': {

        FS(acc2); bP(); eC(hx, hy - hr * .7, hr * .6, hr * .35, 0, 0, 7); eC(hx, hy - hr * .7, hr * .6, hr * .35, 0, 0, 7); fL();

        poly([hx,hy - hr * 1.55],[hx + hr * 1.05,hy - hr * 1.05],[hx,hy - hr * .55],[hx - hr * 1.05,hy - hr * 1.05]);

        SS('#d8b040'); lnW(LW(.06, 1.5)); lC('round'); plS([hx + hr * .5, hy - hr * 1.05],[hx + hr * .85, hy - hr * .5, hx + hr * .8, hy - hr * .1]); FS('#d8b040'); dot(hx + hr * .8,hy - hr * .05,hr * .1);
        break
      }
      case 'bicorne': {

        FS(acc2); sV(); tR(hx, hy - hr * .9);

        poly([-hr * 1.15,-hr * .1],[-hr * .9,-hr * .75,0,-hr * .45],[hr * .9,-hr * .75,hr * 1.15,-hr * .1],[hr * .6,hr * .2,0,hr * .1],[-hr * .6,hr * .2,-hr * 1.15,-hr * .1]);

        FS('#d85040'); dot(0,-hr * .15,hr * .12); rS();
        break
      }
      case 'pickelhaube': {

        FS(acc2); bP(); eC(hx, hy - hr * .75, hr * .78, hr * .5, 0, PI, 0); eC(hx, hy - hr * .75, hr * .78, hr * .5, 0, PI, 0); fL();

        poly([hx - hr * .78,hy - hr * .68],[hx - hr * .1,hy - hr * .55],[hx - hr * .78,hy - hr * .4]); poly([hx + hr * .78,hy - hr * .68],[hx + hr * .1,hy - hr * .55],[hx + hr * .78,hy - hr * .4]);

        FS('#c8a840'); bP(); eC(hx, hy - hr * 1.22, hr * .14, hr * .06, 0, 0, 7); eC(hx, hy - hr * 1.22, hr * .14, hr * .06, 0, 0, 7); fL(); poly([hx - hr * .09,hy - hr * 1.22],[hx,hy - hr * 1.72],[hx + hr * .09,hy - hr * 1.22]);
        break
      }
      case 'shako': {

        FS(acc2);

        poly([hx - hr * .6,hy - hr * .5],[hx - hr * .72,hy - hr * 1.75],[hx + hr * .72,hy - hr * 1.75],[hx + hr * .6,hy - hr * .5]);

        bP(); eC(hx, hy - hr * .5, hr * .62, hr * .18, 0, 0, PI); eC(hx, hy - hr * .5, hr * .62, hr * .18, 0, 0, PI); fL();

        FS('rgba(0,0,0,.3)'); rect(hx - hr * .66, hy - hr * .72, hr * 1.32, hr * .14);

        FS('#d8c060'); dot(hx,hy - hr * 1.15,hr * .16); FS('rgba(0,0,0,.25)'); dot(hx,hy - hr * 1.15,hr * .07);
        break
      }
      case 'tam': {

        FS(acc2); bP(); eC(hx, hy - hr * .85, hr * .95, hr * .38, .06, 0, 7); eC(hx, hy - hr * .85, hr * .95, hr * .38, .06, 0, 7); fL();

        FS('rgba(0,0,0,.25)'); bP(); eC(hx, hy - hr * .7, hr * .9, hr * .12, .06, 0, PI); eC(hx, hy - hr * .7, hr * .9, hr * .12, .06, 0, PI); fL();

        FS(dk); dot(hx,hy - hr * 1.25,hr * .12); SS(dk); lnW(LW(.04)); lC('round');
        times(5, i => {
          const a = i * 1.256; plS([hx, hy - hr * 1.25],[hx + CO(a) * hr * .18, hy - hr * 1.25 + SI(a) * hr * .18])
        });
        break
      }
      case 'sailor': {

        FS(acc2); bP(); eC(hx, hy - hr * .9, hr * .72, hr * .42, 0, 0, 7); eC(hx, hy - hr * .9, hr * .72, hr * .42, 0, 0, 7); fL(); FS('rgba(30,40,60,.85)'); rect(hx - hr * .72, hy - hr * .95, hr * 1.44, hr * .18);

        poly([hx - hr * .2,hy - hr * .82],[hx - hr * .05,hy - hr * .5],[hx + hr * .08,hy - hr * .8]);
        break
      }
      case 'porkpie': {

        FS(acc2); bP(); eC(hx, hy - hr * .52, hr * .95, hr * .14, 0, 0, 7); eC(hx, hy - hr * .52, hr * .95, hr * .14, 0, 0, 7); fL(); bP(); eC(hx, hy - hr * .88, hr * .58, hr * .5, 0, 0, 7); eC(hx, hy - hr * .88, hr * .58, hr * .5, 0, 0, 7); fL(); FS('rgba(0,0,0,.28)'); rect(hx - hr * .58, hy - hr * .78, hr * 1.16, hr * .14); FS(acc2); bP(); eC(hx, hy - hr * 1.36, hr * .56, hr * .1, 0, 0, 7); eC(hx, hy - hr * 1.36, hr * .56, hr * .1, 0, 0, 7); fL();
        break
      }
      case 'keffiyeh': {

        FS('#f0ece0'); poly([hx - hr * .85,hy - hr * .4],[hx,hy - hr * 1.5,hx + hr * .85,hy - hr * .4],[hx + hr * .9,hy + hr * .5],[hx + hr * .6,hy + hr * .45],[hx + hr * .7,hy - hr * .3,hx,hy - hr * .25],[hx - hr * .7,hy - hr * .3,hx - hr * .6,hy + hr * .45],[hx - hr * .9,hy + hr * .5]);

        SS('rgba(160,60,60,.5)'); lnW(1.5);
        span(-2, 2, i => {
          plS([hx + i * hr * .3, hy - hr * 1.1],[hx + i * hr * .3, hy - hr * .3])
        })

        SS('#2a2a2e'); lnW(LW(.07, 2)); bP(); bP(); eC(hx, hy - hr * .72, hr * .68, hr * .22, 0, PI, 0); bP(); eC(hx, hy - hr * .72, hr * .68, hr * .22, 0, PI, 0); sK(); bP(); bP(); eC(hx, hy - hr * .62, hr * .7, hr * .22, 0, PI, 0); bP(); eC(hx, hy - hr * .62, hr * .7, hr * .22, 0, PI, 0); sK();
        break
      }
      case 'sunvisor': {

        FS(acc2); bP(); eC(hx, hy - hr * .6, hr * .72, hr * .3, 0, PI * 1.05, PI * 1.95); lT(hx + hr * .6, hy - hr * .55); lT(hx - hr * .6, hy - hr * .55); cP(); cP(); fL();

        FS(acc2.replace(/,[\d.]+\)$/, ',.4)'));
        poly([hx - hr * .75,hy - hr * .6],[hx,hy - hr * .95,hx + hr * .95,hy - hr * .55],[hx + hr * .8,hy - hr * .4,hx,hy - hr * .5],[hx - hr * .6,hy - hr * .45,hx - hr * .75,hy - hr * .6]);
        break
      }
      case 'mobcap': {

        FS('#f0ece2');

        bP(); eC(hx, hy - hr * .68, hr * .62, hr * .4, 0, PI, 0); cP(); cP(); fL();

        times(9, i => {
          const fa = PI + (i / 8) * PI; const fx = hx + CO(fa) * hr * .68; const fy = hy - hr * .68 + SI(fa) * hr * .42; dot(fx,fy,hr * .11)
        });

        SS(acc2); lnW(LW(.06, 2)); plS([hx - hr * .5, hy - hr * .5],[hx - hr * .8, hy - hr * .2, hx - hr * .7, hy + hr * .2]);
        break
      }
      case 'bonnet': {

        FS(acc2);

        bP(); eC(hx, hy - hr * .7, hr * .6, hr * .42, 0, PI, 0); cP(); cP(); fL();

        bP(); eC(hx + hr * .15, hy - hr * .55, hr * 1.05, hr * .4, -.15, PI * .95, PI * 1.95); lT(hx - hr * .55, hy - hr * .45); cP(); cP(); fL();

        SS(acc2); lnW(LW(.06, 2)); plS([hx - hr * .6, hy - hr * .4],[hx, hy + hr * .6, hx + hr * .6, hy - hr * .4]);

        FS(dk); dot(hx,hy + hr * .55,hr * .09);
        break
      }
      case 'deerstalker': {

        FS('#8a7a5a');

        bP(); eC(hx, hy - hr * .65, hr * .72, hr * .42, 0, PI, 0); cP(); cP(); fL();

        mir(s => {
          ell(hx + s * hr * .55, hy - hr * .52, hr * .35, hr * .12, s * .3)
        });

        FS('#6a5a42'); ell(hx, hy - hr * 1.02, hr * .16, hr * .09); dot(hx,hy - hr * .98,hr * .06);

        SS('#6a5a42'); lnW(2); bP(); mv(hx - hr * .7, hy - hr * .55); mv(hx - hr * .7, hy - hr * .55); lT(hx - hr * .55, hy - hr * .75); plS([hx - hr * .7, hy - hr * .55],[hx - hr * .55, hy - hr * .75]); bP(); mv(hx + hr * .7, hy - hr * .55); mv(hx + hr * .7, hy - hr * .55); lT(hx + hr * .55, hy - hr * .75); plS([hx + hr * .7, hy - hr * .55],[hx + hr * .55, hy - hr * .75]);
        break
      }
      case 'boater': {

        FS('#d8bc78');

        ell(hx, hy - hr * .62, hr * 1.15, hr * .18);

        rect(hx - hr * .6, hy - hr * .95, hr * 1.2, hr * .35); ell(hx, hy - hr * .95, hr * .6, hr * .1);

        FS(acc2); rect(hx - hr * .6, hy - hr * .72, hr * 1.2, hr * .12);
        break
      }
      case 'cloche': {

        FS(acc2); bP(); eC(hx, hy - hr * .55, hr * .78, hr * .55, 0, PI, 0); cP(); cP(); fL();

        FS(acc2); ell(hx, hy - hr * .5, hr * .82, hr * .12);

        FS(dk); rect(hx - hr * .8, hy - hr * .62, hr * 1.6, hr * .1);

        FS('#e8d058'); dot(hx + hr * .55,hy - hr * .55,hr * .07);
        break
      }
      case 'veil': {

        FS(acc2); bP(); eC(hx, hy - hr * .88, hr * .4, hr * .18, 0, PI, 0); cP(); cP(); fL();

        FS(acc2.replace(/,[\d.]+\)$/, ',.35)'));
        mir(s => {
          poly([hx + s * hr * .1,hy - hr * .8],[hx + s * hr * .95,hy - hr * .3,hx + s * hr * .75,hy + hr * 1.2],[hx + s * hr * .45,hy + hr * 1.2],[hx + s * hr * .55,hy - hr * .3,hx,hy - hr * .7])
        });
        break
      }
      case 'plume': {

        FS(dk); rect(hx - hr * .8, hy - hr * .8, hr * 1.6, hr * .16);
        mir(s => {
          const fbx = hx + s * hr * .15, fby = hy - hr * .8;

          SS(acc2); lnW(LW(.05, 2)); plS([fbx, fby],[fbx + s * hr * .3, fby - hr * .8, fbx + s * hr * .5, fby - hr * 1.05]);

          FS(acc2); ell(fbx + s * hr * .35, fby - hr * .7, hr * .14, hr * .42, s * .4);

          FS('#e8d058'); ell(fbx + s * hr * .48, fby - hr * 1.0, hr * .09, hr * .14, s * .4)
        });
        break
      }
      case 'matador': {

        FS('#241f26');

        mir(s => {
          ell(hx + s * hr * .75, hy - hr * .75, hr * .32, hr * .38, s * .25)
        });

        bP(); eC(hx, hy - hr * .85, hr * .5, hr * .28, 0, PI, 0); cP(); cP(); fL();

        SS('#b8b8c8'); lnW(2); bP(); eC(hx, hy - hr * .88, hr * .5, hr * .26, 0, PI * 1.1, PI * 1.9); sK();
        break
      }
      case 'turban': {

        FS(acc2); bP(); eC(hx, hy - hr * .68, hr * .82, hr * .5, 0, PI, 0); cP(); cP(); fL();

        SS('rgba(0,0,0,.25)'); lnW(LW(.07, 2));
        times(3, i => {
          plS([hx - hr * .75, hy - hr * (.55 + i * .18)],[hx, hy - hr * (.8 + i * .18), hx + hr * .75, hy - hr * (.6 + i * .18)])
        });

        FS('#e8d058'); mv(hx, hy - hr * .95); mT(hx, hy - hr * .95); lT(hx + hr * .1, hy - hr * .75); lT(hx, hy - hr * .6); lT(hx, hy - hr * .6); lT(hx - hr * .1, hy - hr * .75); cP(); cP(); fL(); FS('#d04060'); dot(hx,hy - hr * .78,hr * .06);
        break
      }
      case 'tricorne': {

        FS(dk);

        bP(); aR(hx, hy - hr * .55, hr * .55, PI, 0); cP(); cP(); fL();

        for (const [dx, rot] of [[-.7, -.35], [0, 0], [.7, .35]]) {
          sV(); tR(hx + dx * hr, hy - hr * .65); rO(rot); ell(0, 0, hr * .45, hr * .22); rS()
        }

        SS('#c8a848'); lnW(3); bP(); aR(hx, hy - hr * .55, hr * .55, PI * 1.1, PI * 1.9); sK();
        break
      }
      case 'newsboy': {

        FS('#6a5a48'); bP(); eC(hx, hy - hr * .62, hr * .8, hr * .48, 0, PI, 0); cP(); cP(); fL();

        SS('#554838'); lnW(2);
        ([-.4, 0, .4]).forEach(dx => {
          plS([hx + dx * hr, hy - hr * .95],[hx + dx * hr * 1.3, hy - hr * .75, hx + dx * hr * 1.6, hy - hr * .62])
        });

        FS('#554838'); ell(hx + hr * .15, hy - hr * .58, hr * .7, hr * .14, .08);

        FS('#554838'); dot(hx,hy - hr * 1.08,hr * .09);
        break
      }
      case 'fedora': {

        FS('#5a4a3a'); ell(hx, hy - hr * .55, hr * .95, hr * .2);

        poly([hx - hr * .65,hy - hr * .55],[hx - hr * .7,hy - hr * 1.35,hx - hr * .25,hy - hr * 1.35],[hx + hr * .25,hy - hr * 1.35],[hx + hr * .7,hy - hr * 1.35,hx + hr * .65,hy - hr * .55]);

        FS('#4a3c30'); ell(hx, hy - hr * 1.32, hr * .28, hr * .1);

        FS('#2a241e'); rect(hx - hr * .64, hy - hr * .78, hr * 1.28, hr * .18);
        break
      }
      case 'bowler': {

        FS(dk); bP(); aR(hx, hy - hr * .55, hr * .7, PI, 0); cP(); cP(); fL();

        ell(hx, hy - hr * .55, hr * .95, hr * .16);

        FS(acc2); bP(); eC(hx, hy - hr * .62, hr * .72, hr * .12, 0, PI, 0); cP(); cP(); fL();
        break
      }
      case 'flowercrown': {

        times(9, i => {
          const a = PI * (1.08 + i * .105); const fx = hx + CO(a) * hr * .82; const fy = hy - hr * .5 + SI(a) * hr * .42;

          FS('#5a8a4a'); ell(fx + hr * .06, fy + hr * .05, hr * .07, hr * .03, .5);

          FS(['#f090a8', '#f5c8d5', '#e8e0a0'][i % 3]);
          times(5, p => {
            const pa = p / 5 * PI * 2; ell(fx + CO(pa) * hr * .05, fy + SI(pa) * hr * .05, hr * .045, hr * .028, pa)
          });
          FS('#e8c840'); dot(fx,fy,hr * .03)
        });
        break
      }
      case 'tiara': {

        SS('#e8d058'); lnW(LW(.06, 2)); bP(); aR(hx, hy - hr * .5, hr * .75, PI * 1.15, PI * 1.85); sK();
        for (const [dx, s] of [[-hr * .45, .7], [0, 1], [hr * .45, .7]]) {
          FS('#e8d058'); poly([hx + dx - hr * .09,hy - hr * .62],[hx + dx,hy - hr * (.62 + .3 * s)],[hx + dx + hr * .09,hy - hr * .62])
        }

        FS('#e05070'); mv(hx, hy - hr * .95); mT(hx, hy - hr * .95); lT(hx + hr * .08, hy - hr * .82); lT(hx, hy - hr * .72); lT(hx, hy - hr * .72); lT(hx - hr * .08, hy - hr * .82); cP(); cP(); fL();
        break
      }
      case 'jester': {

        FS(acc2);

        bP(); aR(hx, hy - hr * .55, hr * .8, PI, 0); cP(); cP(); fL();

        ([-hr * .75, 0, hr * .75]).forEach(dx => {
          const tipX = hx + dx * 1.6, tipY = hy - hr * (dx === 0 ? 1.5 : 1.1); poly([hx + dx * .9,hy - hr * .6],[hx + dx * 1.2,hy - hr * 1.1,tipX,tipY],[hx + dx * .7,hy - hr * 1.0,hx + dx * .5,hy - hr * .55]);

          FS('#e8d058'); dot(tipX,tipY,hr * .09); FS(acc2)
        });

        FS(dk); rect(hx - hr * .8, hy - hr * .65, hr * 1.6, hr * .16);
        break
      }
      case 'nightcap': {

        FS(`hsla(${hue},50%,60%,1)`);
        poly([hx - hr * .8,hy - hr * .6],[hx - hr * .2,hy - hr * 1.7,hx + hr * 1.1,hy - hr * 1.5],[hx + hr * .5,hy - hr * 1.1,hx + hr * .7,hy - hr * .55]);

        FS('#f0f0f0'); dot(hx + hr * 1.08,hy - hr * 1.5,hr * .14);

        FS('#f0f0f0'); bP(); eC(hx, hy - hr * .62, hr * .82, hr * .18, 0, PI, 0); cP(); cP(); fL();
        break
      }
      case 'laurel': {

        FS('#4a7a3a');
        mir(s => {
          times(6, i => {
            const a = PI * (1.15 + i * .14); const lx = hx + CO(a) * hr * .95 * s; const ly = hy - AB(SI(a)) * hr * 1.05 + hr * .1; sV(); tR(lx, ly); rO(s * (.5 - i * .15)); ell(0,0,hr * .14,hr * .05); rS()
          })
        });
        break
      }
      case 'ushanka': {

        FS('#8a7a68'); bP(); aR(hx, hy - hr * .65, hr * .85, PI, 0); cP(); cP(); fL();

        FS('#a8988a'); bP(); eC(hx, hy - hr * .68, hr * .9, hr * .28, 0, PI, 0); cP(); cP(); fL();

        FS('#8a7a68');
        mir(s => {
          ell(hx + s * hr * .82, hy - hr * .1, hr * .22, hr * .5)
        });
        break
      }
      case 'sombrero': {

        FS(acc2); ell(hx, hy - hr * .62, hr * 1.6, hr * .32); bP(); aR(hx, hy - hr * .85, hr * .6, PI, 0); cP(); cP(); fL();

        SS(dk); lnW(hr * .05); ells(hx, hy - hr * .62, hr * 1.6, hr * .32); SS('rgba(255,255,255,.5)'); lnW(hr * .08); bP(); aR(hx, hy - hr * .85, hr * .62, PI * 1.1, PI * 1.9); sK();
        break
      }
      case 'fez': {

        FS('#b02830'); poly([hx - hr * .55,hy - hr * .65],[hx + hr * .55,hy - hr * .65],[hx + hr * .4,hy - hr * 1.5],[hx - hr * .4,hy - hr * 1.5]); SS(dk); lnW(hr * .05); sK();

        SS('#2a2a32'); lnW(hr * .06); lC('round'); plS([hx, hy - hr * 1.5],[hx + hr * .3, hy - hr * 1.4, hx + hr * .45, hy - hr * .8]); FS('#2a2a32'); dot(hx + hr * .45,hy - hr * .75,hr * .1);
        break
      }
      case 'viking': {

        FS('#6a7080'); bP(); aR(hx, hy - hr * .6, hr * .85, PI, 0); cP(); cP(); fL(); FS('#8a92a2'); rect(hx - hr * .12, hy - hr * 1.45, hr * .24, hr * .9);

        FS('rgba(235,225,200,.95)');
        mir(s => {
          poly([hx + s * hr * .8,hy - hr * .75],[hx + s * hr * 1.6,hy - hr * 1.1,hx + s * hr * 1.45,hy - hr * 1.8],[hx + s * hr * 1.15,hy - hr * 1.15,hx + s * hr * .65,hy - hr * .95])
        });
        break
      }
      case 'bowtie': {

        const by = hy + hr * 1.15; FS(acc2);
        mir(s => {
          poly([hx,by],[hx + s * hr * .55,by - hr * .28],[hx + s * hr * .55,by + hr * .28])
        });
        FS(dk); dot(hx,by,hr * .12);
        break
      }
      case 'antler': {

        SS('#8a6a48'); lnW(hr * .12); lC('round');
        mir(s => {
          plS([hx + s * hr * .4, hy - hr * .7],[hx + s * hr * .7, hy - hr * 1.3, hx + s * hr * 1.1, hy - hr * 1.7]); lnW(hr * .08); plS([hx + s * hr * .62, hy - hr * 1.15],[hx + s * hr * .5, hy - hr * 1.55]); plS([hx + s * hr * .9, hy - hr * 1.45],[hx + s * hr * 1.05, hy - hr * 1.9]); lnW(hr * .12)
        });
        break
      }
      case 'headband': {

        SS(acc2); lnW(hr * .22); lC('round'); bP(); aR(hx, hy, hr * .95, PI * 1.15, PI * 1.85); sK(); FS(acc2); ell(hx + hr * .88, hy - hr * .3, hr * .16, hr * .1, .5);
        break
      }
      case 'santa': {

        FS(acc2); poly([hx - hr * .85,hy - hr * .7],[hx - hr * .1,hy - hr * 2.3,hx + hr * .75,hy - hr * 1.5],[hx + hr * .5,hy - hr * .9,hx + hr * .85,hy - hr * .7]);

        FS('rgba(245,248,252,.97)'); ell(hx, hy - hr * .72, hr * .9, hr * .18);

        dot(hx + hr * .78, hy - hr * 1.52, hr * .18);
        break
      }
      case 'top': {

        FS(dk); ell(hx, hy - hr * .7, hr * 1.15, hr * .16); rect(hx - hr * .72, hy - hr * 2.1, hr * 1.44, hr * 1.45); ell(hx, hy - hr * 2.1, hr * .72, hr * .12); FS(acc2); rect(hx - hr * .72, hy - hr * .85, hr * 1.44, hr * .22);
        break
      }
      case 'chef': {

        FS('rgba(240,242,246,.97)'); bP(); eC(hx, hy - hr * 1.25, hr * .78, hr * .55, 0, PI, 0); cP(); cP(); fL();

        ([-.45, 0, .45]).forEach(dx => {
          dot(hx + hr * dx, hy - hr * 1.55, hr * .3)
        });
        FS('rgba(215,220,228,.95)'); rect(hx - hr * .78, hy - hr * .92, hr * 1.56, hr * .2); SS(dk); lnW(hr * .05); sR(hx - hr * .78, hy - hr * .92, hr * 1.56, hr * .2);
        break
      }
      case 'cap': {

        FS(acc2); bP(); aR(hx, hy - hr * .75, hr * .92, PI, 0); cP(); cP(); fL(); rect(hx - hr * .92, hy - hr * .78, hr * 1.84, hr * .12);

        ell(hx + hr * 1.05, hy - hr * .62, hr * .55, hr * .16, .12); FS('rgba(255,255,255,.4)'); dot(hx,hy - hr * 1.68,hr * .09);
        break
      }
      case 'wizard': {

        FS(acc2); poly([hx - hr * .7,hy - hr * .85],[hx - hr * .35,hy - hr * 1.9,hx + hr * .35,hy - hr * 2.35],[hx + hr * .5,hy - hr * 2.15,hx + hr * .62,hy - hr * 2.25],[hx + hr * .4,hy - hr * 1.75,hx + hr * .7,hy - hr * .85]); ell(hx,hy - hr * .82,hr * 1.25,hr * .3);
        break
      }
      case 'earmuff': {

        SS(acc2); lnW(hr * .14); bP(); aR(hx, hy - hr * .15, hr * 1.08, PI * 1.15, PI * 1.85); sK(); FS(acc2);
        mir(s => {
          dot(hx + s * hr * 1.05,hy - hr * .05,hr * .38); FS('rgba(255,255,255,.35)'); dot(hx + s * hr * 1.05,hy - hr * .05,hr * .22); FS(acc2)
        });
        break
      }
      case 'straw': {

        FS('hsl(45,60%,72%)'); ell(hx,hy - hr * .85,hr * 1.5,hr * .38); ell(hx,hy - hr * 1.1,hr * .78,hr * .55); FS(acc2); rect(hx - hr * .78, hy - hr * 1.02, hr * 1.56, hr * .18);
        break
      }
      case 'horns': {

        FS(acc2);
        mir(s => {
          poly([hx + s * hr * .45,hy - hr * .85],[hx + s * hr * 1.05,hy - hr * 1.05,hx + s * hr * .95,hy - hr * 1.55],[hx + s * hr * .8,hy - hr * 1.15,hx + s * hr * .62,hy - hr * .82])
        });
        break
      }
      case 'goggles': {

        SS(dk); lnW(hr * .1); plS([hx - hr * 1.02, hy - hr * .62],[hx + hr * 1.02, hy - hr * .62]); lnW(hr * .07); SS(acc2); FS('rgba(160,220,255,.55)');
        mir(s => {
          bP(); dot(hx + s * hr * .42, hy - hr * .62, hr * .3); fL(); sK()
        });
        plS([hx - hr * .12, hy - hr * .62],[hx + hr * .12, hy - hr * .62]);
        break
      }
      case 'cat-ear': {

        mir(s => {
          FS(acc2); poly([hx + s * hr * .3,hy - hr * .95],[hx + s * hr * .78,hy - hr * .85],[hx + s * hr * .6,hy - hr * 1.45]); FS('rgba(255,190,205,.85)'); poly([hx + s * hr * .42,hy - hr * .95],[hx + s * hr * .68,hy - hr * .9],[hx + s * hr * .58,hy - hr * 1.28])
        });
        break
      }
      case 'bunny': {

        mir(s => {
          FS(acc2); ell(hx + s * hr * .42, hy - hr * 1.62, hr * .2, hr * .75, s * .12); FS('rgba(255,190,205,.85)'); ell(hx + s * hr * .42, hy - hr * 1.6, hr * .1, hr * .5, s * .12)
        });
        break
      }
      case 'flower': {

        const fx2 = hx + hr * .62, fy2 = hy - hr * .55, pr3 = hr * .16; FS(acc2);
        times(5, k => {
          const a2 = k * PI * 2 / 5; ell(fx2 + CO(a2) * pr3 * 1.15, fy2 + SI(a2) * pr3 * 1.15, pr3, pr3 * .58, a2)
        });
        FS('hsla(50,90%,60%,.95)'); dot(fx2,fy2,pr3 * .45);
        break
      }
    }
    rS()
  }

  function defaultBackdrop(c, W, H) {
      const FS=v=>c.fillStyle = v;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a3550'); g.addColorStop(.6, '#3b4a6b'); g.addColorStop(1, '#1d2230'); FS(g); c.fillRect(0, 0, W, H)
  }

  function drawCover(c, img, fit, blurPx, sat, con, offX, offY, zoom = 0, W, H) {
      const flT=v=>c.filter = v;
    const iw = img.naturalWidth || img.videoWidth, ih = img.naturalHeight || img.videoHeight;
    if (!iw || !ih) return;
    const s = (fit === 'contain' ? MN(W / iw, H / ih) : MX(W / iw, H / ih)) * (1 + zoom); const dw = iw * s, dh = ih * s;
    const f = `blur(${blurPx}px) saturate(${sat}) contrast(${con})`;
    if (f !== 'blur(0px) saturate(1) contrast(1)') flT(f);

    c.drawImage(img, (W - dw) / 2 + (offX - .5) * W, (H - dh) / 2 + (offY - .5) * H, dw, dh); flT('none')
  }
  function drawBackdrop(c, p, t, bg, W, H) {
      const K0='#4a3828', K1='rgba(250,252,255,.8)';
      const mir=f=>[-1,1].forEach(f);
      const flT=v=>c.filter = v, lC=v=>c.lineCap = v;
      const span = (a, b, f) => { for (let i = a; i <= b; i++) f(i) }, spt = (a, b, f) => { for (let i = a; i < b; i++) f(i) };
      const plS=(...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }); sK() };
      const bP=()=>c.beginPath(), cP=()=>c.closePath(), mT=(x,y)=>c.moveTo(x,y), lT=(x,y)=>c.lineTo(x,y), qT=(a,b,q,d)=>c.quadraticCurveTo(a,b,q,d), bZ=(a,b,q,d,e,f)=>c.bezierCurveTo(a,b,q,d,e,f), aR=(x,y,r,s,e)=>c.arc(x,y,r,s,e), eC=(x,y,rx,ry,o,s,e)=>c.ellipse(x,y,rx,ry,o,s,e), fR=(x,y,w,h)=>c.fillRect(x,y,w,h), sR=(x,y,w,h)=>c.strokeRect(x,y,w,h), fL=()=>c.fill(), sK=()=>c.stroke(), sV=()=>c.save(), rS=()=>c.restore(), tR=(x,y)=>c.translate(x,y), rO=a=>c.rotate(a), sC=(x,y)=>c.scale(x,y), gA=v=>c.globalAlpha = v;
    if (bg) {

      const z = p.bgDrift * .15 * (.5 + .5 * S(.12)); drawCover(c, bg, p.bgFit, p.bgBlur * 10, p.bgSat * 2, .5 + p.bgContrast, p.bgX, p.bgY, z, W, H);
      if (p.bgDim > 0) { FS(`rgba(8,10,16,${p.bgDim * .55})`); rect(0, 0, W, H) }
      return
    }
    const pr = p.bgPreset || 'gradient';

    const sky = (stops) => {
      const gr = c.createLinearGradient(0, 0, 0, H);
      for (const [o, col] of stops) gr.addColorStop(o, col);
      FS(gr); rect(0, 0, W, H)
    };
      const ell = (x, y, rx, ry, rot) => { ellP(W * x,H * y,rx,ry,rot || 0) };
      const lg = (a, b, cc, d, s) => { const g = c.createLinearGradient(a, b, cc, d); for (let k = 0; k < s.length; k += 2) g.addColorStop(s[k], s[k + 1]); return g };
      const rg = (a, b, r0, cc, d, r1, s) => { const g = c.createRadialGradient(a, b, r0, cc, d, r1); for (let k = 0; k < s.length; k += 2) g.addColorStop(s[k], s[k + 1]); return g };
      const ellP = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); fL() };
      const ellPS = (x, y, rx, ry, rot) => { bP(); eC(x, y, rx, ry, rot || 0, 0, 7); sK() };
      const dotPS = (x, y, r) => { bP(); aR(x, y, r, 0, 7); sK() };
      const dotP = (x, y, r) => { bP(); aR(x, y, r, 0, 7); fL() };
      const times = (n, f) => { for (let i = 0; i < n; i++) f(i) };
      const scat = (seed, n, f) => { const r = mulberry32(seed); times(n, i => f(r, i)) };
      const bnd = y => rect(0, H * y, W, H * (1 - y));
      const rect = (x, y, w, h) => fR(x, y, w, h);
      const mv = (x, y) => { bP(); mT(x, y) };
      const FS=v=>c.fillStyle = v;
      const SS=v=>c.strokeStyle = v;
      const lw = (m, f, w) => lnW(MX(m, (w || H) * f));
      const lnW=v=>c.lineWidth = v;
      const poly = (...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }) ;cP(); fL() };
      const polyS = (...p) => { bP(); mT(p[0][0], p[0][1]); spt(1, p.length, i => { const a = p[i]; if (a.length === 2) lT(a[0], a[1]); else if (a.length === 4) qT(a[0], a[1], a[2], a[3]); else bZ(a[0], a[1], a[2], a[3], a[4], a[5]) }) ;cP(); sK() };
      const S = f => SI(t * f), C = f => CO(t * f), A = f => AB(S(f));
    const dot = (x, y, r) => { dotP(W * x,H * y,r) };
    if (pr === 'transparent') return;
    if (p.bgBlur > 0) flT(`blur(${p.bgBlur * 10}px)`);
    if (pr === 'green') { FS('#00b140'); rect(0, 0, W, H) }
    else if (pr === 'white') { FS('#ffffff'); rect(0, 0, W, H) }
    else if (pr === 'sunset') {
      sky([[0,'#2b2f6e'],[.55,'#c9526a'],[1,'#ffb56b']]); FS('rgba(255,190,90,.92)'); dot(.5,.6,H * .15)
    } else if (pr === 'night') {
      const rng = mulberry32(999);
      sky([[0,'#0a0d24'],[1,'#1c2347']]); scat(999, 90, (rng, i) => {
        const sx = rng() * W, sy = rng() * H * .85, sr = rng() * 1.4 + .4; const tw = .3 + .65 * AB(SI(t * (.4 + rng() * 1.6) + rng() * 9));
        FS(`rgba(255,255,255,${tw})`);
        dotP(sx, sy, sr)
      });
      FS('rgba(240,240,220,.95)'); dot(.8,.18,H * .07)
    } else if (pr === 'spot') {
      FS('#0b0c10'); rect(0, 0, W, H); FS(rg(W * .5, H * .86, 10, W * .5, H * .86, W * .5,[0, 'rgba(255,240,200,.55)',1, 'rgba(255,240,200,0)'])); mv(W * .44, 0); mT(W * .44, 0); lT(W * .56, 0); mT(W * .44, 0); lT(W * .56, 0); lT(W * .9, H * .95); mT(W * .44, 0); lT(W * .56, 0); lT(W * .9, H * .95); lT(W * .1, H * .95); cP(); cP(); fL(); ell(.5,.88,W * .28,H * .07)
    } else if (pr === 'sky') {
      const rng = mulberry32(77);

      sky([[0,'#2e7bd6'],[1,'#a8d4f0']]); scat(77, 5, (rng, i) => {
        const bx = rng(), sp = .008 + .01 * rng(), cy = H * (.05 + rng() * .45); const cxx = ((bx + t * sp) % 1) * W; FS('rgba(255,255,255,.85)');
        span(-1, 1, k => {
          ellP(cxx + k * W * .05, cy + (k === 0 ? -H * .014 : 0), W * (.045 + .018 * rng()), H * .028)
        })
      })
    } else if (pr === 'pastel') {

      FS(lg(0, 0, W, H,[0, '#ffd9e8',.35, '#ffe9c9',.65, '#d9f2e3',1, '#c9e3ff'])); rect(0, 0, W, H); const rng = mulberry32(4242); FS('rgba(255,255,255,.5)');
      times(24, i => {
        dotP(rng() * W, rng() * H, 3 + rng() * 9)
      })
    } else if (pr === 'santorini') {
      const rng = mulberry32(518);

      sky([[0,'#78b8e8'],[.5,'#a8d0f0'],[1,'#3868a8']]);

      FS('#4a6078'); poly([0,H * .45],[W * .3,H * .38,W * .6,H * .43],[W * .85,H * .46,W,H * .42],[W,H * .52],[W,H * .52],[0,H * .52]);

      FS(lg(0, H * .5, 0, H,[0, '#2a5a98',1, '#183a68'])); bnd(.5);

      FS('rgba(255,255,255,.25)'); scat(518, 14, (rng, i) => {
        rect(rng() * W, H * (.55 + rng() * .4), W * .04, H * .004)
      });

      const houses = [
        [.05, .38, .09, .1], [.13, .35, .08, .13], [.2, .38, .1, .1],
        [.28, .33, .08, .15], [.35, .37, .09, .11], [.43, .4, .08, .08]];
      FS('#f4f2ea');
      for (const [hx2, hy2, hw, hh] of houses) {
        rect(W * hx2, H * hy2, W * hw, H * hh)
      }

      FS('#3868a8');
      for (const [hx2, hy2] of houses) {
        rect(W * (hx2 + .02), H * (hy2 + .03), W * .015, H * .025); rect(W * (hx2 + .05), H * (hy2 + .06), W * .015, H * .035)
      }

      ([.19, .38]).forEach(dx => {
        bP(); aR(W * dx + W * .045, H * .36 - W * .045, W * .045, PI, 0); fL(); FS('#f4f2ea'); rect(W * dx, H * .36 - W * .045, W * .09, H * .1); FS('#3868a8')
      });

      FS('#8a6848'); poly([W * .55,H * .5],[W * .75,H * .5],[W,H],[W * .5,H]);

      FS('#f4f2ea'); rect(W * .62, H * .55, W * .07, H * .08); rect(W * .7, H * .62, W * .08, H * .1);

      SS('#f0f0e8'); lnW(1.5);
      times(3, i => {
        const bx = W * (.6 + i * .12 + SI(t * .5 + i) * .02); const by = H * (.15 + (i % 2) * .07); mv(bx - 6, by); mT(bx - 6, by); qT(bx, by - 5, bx + 6, by); sK()
      })
    } else if (pr === 'cappadocia') {

      sky([[0,'#e8a878'],[.45,'#f0c090'],[1,'#c89068']]);

      FS('#f8d8a0'); dot(.78,.22,W * .07);

      FS('#c89878'); poly([0,H * .55],[W * .25,H * .48,W * .5,H * .54],[W * .75,H * .5,W,H * .56],[W,H],[W,H],[0,H]);

      const balloons = [
        [.15, .18, .045, '#d84848'], [.32, .3, .03, '#4878c8'], [.55, .12, .038, '#e8a038'],
        [.7, .28, .025, '#68a848'], [.88, .15, .05, '#a848a8']];
      times(balloons.length, i => {
        const [bx, by, br, col] = balloons[i]; const yy = H * (by + SI(t * .3 + i * 1.7) * .012); FS(col); dotP(W * bx, yy, W * br); SS('#704828'); lnW(1); mv(W * bx - W * br * .4, yy + W * br * .8); lT(W * bx - W * br * .25, yy + W * br * 1.35); mT(W * bx + W * br * .4, yy + W * br * .8); lT(W * bx + W * br * .25, yy + W * br * 1.35); sK(); FS('#704828'); rect(W * bx - W * br * .3, yy + W * br * 1.35, W * br * .6, W * br * .35)
      });

      const chim = [
        [.06, .6, .05, .34], [.14, .62, .04, .26], [.24, .58, .055, .38],
        [.38, .64, .045, .28], [.5, .6, .06, .36], [.66, .63, .05, .3],
        [.8, .58, .055, .4], [.93, .62, .045, .3]];
      for (const [cx, cy, cw, ch] of chim) {

        FS('#b88058'); poly([W * (cx - cw * .8),H],[W * (cx - cw * .45),H * (1 - ch)],[W * cx,H * (1 - ch) - H * .015,W * (cx + cw * .45),H * (1 - ch)],[W * (cx + cw * .8),H]);

        FS('#785038'); poly([W * (cx - cw * .55),H * (1 - ch)],[W * cx,H * (1 - ch) - H * ch * .28],[W * (cx + cw * .55),H * (1 - ch)]);

        SS('rgba(80,50,30,.35)'); lnW(1.5); scat(FL(cx * 1000), 3, (rng2, k) => {
          const ox = cx - cw * .4 + rng2() * cw * .8; plS([W * ox, H * (1 - ch)],[W * (ox - cw * .25), H])
        })
      }

      FS('#e8d8c0'); scat(777, 6, (rng3, i) => {
        const tx = W * (.1 + rng3() * .8), ty = H * (.82 + rng3() * .12); mv(tx - W * .015, ty); mT(tx - W * .015, ty); lT(tx, ty - H * .02); mT(tx - W * .015, ty); lT(tx, ty - H * .02); lT(tx + W * .015, ty); cP(); cP(); fL()
      })
    } else if (pr === 'redwoods') {

      sky([[0,'#2a4a30'],[.5,'#4a6a40'],[1,'#6a7a48']]);

      FS('#4a5c38'); scat(314, 7, (rng4, i) => {
        const tx = W * (.08 + rng4() * .84), tw = W * (.012 + rng4() * .018); rect(tx, H * .05, tw, H)
      });

      FS('rgba(250,240,200,.16)');
      ([.3, .55, .8]).forEach(bx => {
        poly([W * bx,0],[W * (bx + .1),0],[W * (bx + .02),H],[W * (bx - .08),H])
      });

      for (const [tx, tw] of [[0, .13], [.9, .14], [.42, .07]]) {
        FS('#5a3a26'); rect(W * tx, 0, W * tw, H); SS('#3a2418'); lnW(2); scat(FL(tx * 100), 4, (rng5, k) => {
          const gx = W * (tx + rng5() * tw * .9); plS([gx, H * .05],[gx + W * .006, H * .5, gx - W * .004, H])
        })
      }

      FS('#2f4a28'); bP(); eC(W * .1, H * .12, W * .12, H * .05, -.2, 0, 7); eC(W * .1, H * .12, W * .12, H * .05, -.2, 0, 7); fL(); bP(); eC(W * .95, H * .18, W * .11, H * .05, .2, 0, 7); eC(W * .95, H * .18, W * .11, H * .05, .2, 0, 7); fL(); bP(); eC(W * .46, H * .08, W * .1, H * .04, 0, 0, 7); eC(W * .46, H * .08, W * .1, H * .04, 0, 0, 7); fL();

      FS('#3a3020'); bnd(.9); SS('#5a7a3a'); lnW(1.5); scat(555, 16, (rng6, i) => {
        const fx = W * rng6(), fy = H * (.88 + rng6() * .1);
        span(-2, 2, k => {
          plS([fx, fy],[fx + W * .012 * k, fy - H * .03, fx + W * .018 * k, fy - H * .05])
        })
      });

      FS('rgba(255,240,190,.5)');
      times(10, i => {
        const px = W * ((i * .1 + t * .004) % 1); const py = H * (.3 + .35 * SI(t * .4 + i * 2.1)); rect(px, py, 2, 2)
      })
    } else if (pr === 'slotcanyon') {

      sky([[0,'#f0c080'],[.3,'#c86838'],[1,'#803818']]);

      FS('#a84820'); mv(0, 0); mT(0, 0); lT(W * .42, 0); bZ(W * .3, H * .25, W * .5, H * .4, W * .32, H * .62); bZ(W * .2, H * .8, W * .3, H * .9, W * .2, H); lT(0, H); cP(); cP(); fL();

      FS('#8a3a18'); mv(W, 0); mT(W, 0); lT(W * .6, 0); bZ(W * .78, H * .2, W * .55, H * .38, W * .7, H * .58); bZ(W * .82, H * .78, W * .68, H * .9, W * .78, H); lT(W, H); cP(); cP(); fL();

      SS('rgba(240,180,120,.4)'); lnW(3);
      ([.08, .18, .3, .44]).forEach(off => {
        plS([W * off, 0],[W * (off - .06), H * .3, W * (off + .12), H * .5, W * (off - .04), H])
      });
      SS('rgba(60,20,10,.45)'); lnW(2);
      ([.62, .74, .86]).forEach(off => {
        plS([W * off, 0],[W * (off + .08), H * .3, W * (off - .1), H * .55, W * (off + .05), H])
      });

      FS('#f8e0a8'); mv(W * .45, 0); mT(W * .45, 0); lT(W * .56, 0); lT(W * .5, H * .07); lT(W * .5, H * .07); cP(); lT(W * .5, H * .07); cP(); fL();

      FS(lg(0, 0, 0, H * .85,[0, 'rgba(255,230,170,.55)',1, 'rgba(255,230,170,0)'])); mv(W * .46, 0); mT(W * .46, 0); lT(W * .55, 0); lT(W * .62, H * .85); lT(W * .62, H * .85); lT(W * .4, H * .85); cP(); cP(); fL();

      FS('rgba(255,240,200,.6)'); scat(909, 12, (rng7, i) => {
        const px = W * (.44 + rng7() * .14) + SI(t * .7 + i) * 3; const py = H * (.1 + rng7() * .6); rect(px, py, 1.5, 1.5)
      });

      FS(lg(0, H * .82, 0, H,[0, '#d8a060',1, '#a06030'])); poly([0,H],[W * .5,H * .82,W,H])
    } else if (pr === 'angkor') {

      sky([[0,'#e8a060'],[.4,'#f0c890'],[1,'#986848']]);

      FS('#f8d8a0'); dot(.5,.32,W * .09);

      FS('#3a4a28'); mv(0, H * .55); const rng8 = mulberry32(2024); let jx = 0;
      while (jx < W) {
        qT(jx + W * .04, H * (.5 + rng8() * .08), jx + W * .08, H * .55); jx += W * .08
      }
      lT(W, H * .62); lT(W, H * .62); lT(0, H * .62); cP(); cP(); fL();

      const towers = [[.5, .12, .3], [.32, .08, .36], [.68, .08, .36], [.14, .06, .42], [.86, .06, .42]]; FS('#5a4230');
      for (const [tx, tw, ty] of towers) {
        const bx = W * tx, bw = W * tw, top = H * ty;

        poly([bx - bw * .55,H * .62],[bx - bw * .5,top + bw * .5],[bx - bw * .3,top + bw * .15,bx,top],[bx + bw * .3,top + bw * .15,bx + bw * .5,top + bw * .5],[bx + bw * .55,H * .62]);

        SS('#3a2a1c'); lnW(1.5);
        ([.3, .45, .58]).forEach(ry => {
          plS([bx - bw * .4, top + bw * ry * 2],[bx + bw * .4, top + bw * ry * 2])
        })
      }

      FS('#4a3626'); rect(0, H * .58, W, H * .05);

      FS(lg(0, H * .63, 0, H,[0, '#b89068',1, '#7a5838'])); bnd(.63);

      FS('rgba(90,66,48,.45)');
      for (const [tx, tw] of towers) {
        const bx = W * tx, bw = W * tw; poly([bx - bw * .5,H * .64],[bx - bw * .3,H * .78],[bx + bw * .3,H * .78],[bx + bw * .5,H * .64])
      }

      FS('rgba(255,220,170,.3)');
      times(10, i => {
        const py = H * (.66 + i * .03); const pw = W * (.15 + .05 * SI(t + i)); rect(W * .5 - pw / 2 + SI(t * .5 + i * 2) * 8, py, pw, 1.5)
      });

      FS('#48704a'); scat(42, 8, (rng9, i) => {
        ell((.08 + rng9() * .84), (.7 + rng9() * .25), W * .02, H * .008)
      })
    } else if (pr === 'pantanal') {

      sky([[0,'#e8c878'],[.4,'#c8b068'],[1,'#5a7a50']]);

      FS('#f09858'); dot(.62,.3,W * .06);

      FS('#3d5230'); mv(0, H * .52); const rngA = mulberry32(88); let px2 = 0;
      while (px2 < W) {
        qT(px2 + W * .05, H * (.46 + rngA() * .06), px2 + W * .1, H * .52); px2 += W * .1
      }
      lT(W, H * .58); lT(W, H * .58); lT(0, H * .58); cP(); cP(); fL();

      FS(lg(0, H * .58, 0, H,[0, '#7a8a58',1, '#4a5c40'])); bnd(.58);

      FS('#6a8a48'); scat(471, 14, (rngB, i) => {
        ell(rngB(), (.62 + rngB() * .32), W * (.02 + rngB() * .04), H * (.006 + rngB() * .01))
      });

      FS('rgba(240,150,80,.35)');
      times(8, i => {
        const py = H * (.62 + i * .04); const pw = W * (.1 + .03 * SI(t + i * 2)); rect(W * .62 - pw / 2 + SI(t * .6 + i) * 6, py, pw, 1.5)
      });

      const storks = [[.18, .68, .09], [.3, .74, .07], [.82, .66, .1]];
      for (const [sx, sy, ss] of storks) {
        const bx = W * sx, by = H * sy, sc = H * ss;

        FS('#e8e4dc'); bP(); eC(bx, by, sc * .5, sc * .28, 0, 0, 7); eC(bx, by, sc * .5, sc * .28, 0, 0, 7); fL(); SS('#e8e4dc'); lnW(sc * .14); plS([bx + sc * .35, by - sc * .1],[bx + sc * .6, by - sc * .7, bx + sc * .5, by - sc * .95]);

        FS('#202020'); ellP(bx + sc * .5, by - sc * .95, sc * .16, sc * .14); SS('#c03828'); lnW(sc * .06); plS([bx + sc * .38, by - sc * .78],[bx + sc * .44, by - sc * .6]);

        SS('#202020'); lnW(sc * .05); plS([bx + sc * .58, by - sc * .97],[bx + sc * .78, by - sc * .92])
      }

      SS('#4a3a28'); lnW(1.5);
      times(5, i => {
        const bx = W * ((i * .17 + t * .008) % 1); const by = H * (.12 + (i % 3) * .06); mv(bx - 5, by); mT(bx - 5, by); qT(bx, by - 4, bx + 5, by); sK()
      });

      FS('#5a4028'); bP(); eC(W * .55, H * .6, W * .03, H * .02, 0, 0, 7); eC(W * .55, H * .6, W * .03, H * .02, 0, 0, 7); fL(); bP(); eC(W * .57, H * .585, W * .012, H * .012, 0, 0, 7); eC(W * .57, H * .585, W * .012, H * .012, 0, 0, 7); fL()
    } else if (pr === 'deadvlei') {

      FS(lg(0, 0, 0, H * .55,[0, '#3050a0',1, '#7898c8'])); rect(0, 0, W, H * .55);

      FS('#f8e8c0'); dot(.75,.12,W * .045);

      FS('#c05828'); poly([0,H * .55],[W * .15,H * .18,W * .45,H * .3],[W * .6,H * .36,W * .78,H * .22],[W * .9,H * .16,W,H * .28],[W,H * .58],[W,H * .58],[0,H * .58]);

      FS('#903818'); poly([W * .45,H * .3],[W * .6,H * .36,W * .78,H * .22],[W * .9,H * .16,W,H * .28],[W,H * .58],[W,H * .58],[W * .5,H * .58],[W * .47,H * .45,W * .45,H * .3]);

      SS('#e88848'); lnW(2); plS([0, H * .55],[W * .15, H * .18, W * .45, H * .3],[W * .6, H * .36, W * .78, H * .22],[W * .9, H * .16, W, H * .28]);

      FS(lg(0, H * .55, 0, H,[0, '#e8e0d0',1, '#c8bcA8'])); bnd(.55);

      const rngT = mulberry32(666); const trees = [[.15, .78, .16], [.4, .7, .2], [.62, .82, .13], [.85, .68, .18]];
      for (const [tx, ty, ts] of trees) {
        const bx = W * tx, by = H * ty, sc = H * ts;

        SS('#181410'); lnW(MX(1.5, sc * .05)); mv(bx, by); const topX = bx + (rngT() - .5) * sc * .3; const topY = by - sc; lT(topX, topY); sK();

        const nb = 3 + FL(rngT() * 2);
        times(nb, b => {
          const byf = .35 + b * .18; const sx = bx + (topX - bx) * byf; const sy = by + (topY - by) * byf; const dir = b % 2 ? 1 : -1; lnW(MX(1, sc * .03)); plS([sx, sy],[sx + dir * sc * (.3 + rngT() * .25), sy - sc * (.15 + rngT() * .2)]);

          lnW(MX(1, sc * .015)); plS([sx + dir * sc * .2, sy - sc * .12],[sx + dir * sc * .38, sy - sc * .05])
        });

        FS('rgba(120,100,80,.3)'); ellP(bx + sc * .5, by + 2, sc * .6, sc * .04)
      }

      SS('rgba(150,135,115,.5)'); lnW(1); scat(21, 10, (rngC, i) => {
        const cx0 = W * rngC(), cy0 = H * (.6 + rngC() * .35); plS([cx0, cy0],[cx0 + (rngC() - .5) * W * .04, cy0 + H * .02 * rngC()])
      })
    } else if (pr === 'uyuni') {

      FS(lg(0, 0, 0, H * .5,[0, '#12082e',1, '#3a2058'])); rect(0, 0, W, H * .5);

      FS('rgba(200,180,230,.08)'); sV(); tR(W * .5, H * .22); rO(-.3); rect(-W, -H * .06, W * 2, H * .12); rS();

      scat(777, 90, (rngU, i) => {
        const sx = W * rngU(); const sy = H * .48 * Math.pow(rngU(), 1.4);
        FS(`rgba(255,250,240,${.3 + rngU() * .7})`);
        rect(sx, sy, 1.5, 1.5)
      });

      for (const [bx, by] of [[.2, .08], [.55, .15], [.8, .3]]) {
        FS('#fff8e8'); rect(W * bx - 3, H * by, 7, 1.5); rect(W * bx, H * by - 3, 1.5, 7)
      }

      FS('#241040'); poly([0,H * .5],[W * .12,H * .46],[W * .25,H * .5],[W * .7,H * .5],[W * .82,H * .47],[W * .95,H * .5]);

      FS(lg(0, H * .5, 0, H,[0, '#3a2058',1, '#150a30'])); bnd(.5);

      scat(777, 90, (rngV, i) => {
        const sx = W * rngV(); const sy = H - H * .48 * Math.pow(rngV(), 1.4);
        FS(`rgba(255,250,240,${.15 + rngV() * .35})`);
        rect(sx, sy, 1.5, 1.5)
      });

      FS('rgba(200,180,230,.05)'); sV(); tR(W * .5, H * .78); rO(-.3); rect(-W, -H * .06, W * 2, H * .12); rS();

      SS('rgba(200,190,220,.18)'); lnW(1);
      span(1, 6, i => {
        const ry = H * (.5 + i * .075); bP();
        for (let x = 0; x <= W; x += 12) {
          const yy = ry + SI(x * .02 + t + i) * 1.5; x ? lT(x, yy) : mT(x, yy)
        }
        sK()
      })
    } else if (pr === 'bagan') {

      sky([[0,'#e88850'],[.4,'#c07858'],[1,'#6a4838']]);

      FS('#f8d8a0'); dot(.6,.32,W * .05);

      const rngG = mulberry32(90); const balloons = [[.15, .18, .05, 0], [.4, .12, .04, 2.1], [.78, .22, .06, 4.2]];
      for (const [bx, by, bs, ph] of balloons) {
        const gx = W * (bx + .02 * SI(t * .1 + ph)); const gy = H * (by + .02 * SI(t * .25 + ph)); const gs = H * bs; FS('#a04038'); bP(); bP(); aR(gx, gy, gs, PI * .15, PI * .85); bP(); aR(gx, gy, gs, PI * .15, PI * .85); fL(); poly([gx - gs * .75,gy + gs * .1],[gx,gy + gs * 1.5,gx + gs * .75,gy + gs * .1]);

        FS('#4a3020'); rect(gx - gs * .12, gy + gs * 1.1, gs * .24, gs * .16)
      }

      FS('rgba(120,80,60,.6)'); mv(0, H * .6); const rngD = mulberry32(55);
      for (let x = 0; x < W; x += W * .04) {
        const th = H * (.04 + rngD() * .06); lT(x, H * .6 - th); lT(x + W * .01, H * .6 - th); lT(x + W * .01, H * .6)
      }
      lT(W, H * .62); lT(W, H * .62); lT(0, H * .62); cP(); cP(); fL();

      const stupas = [[.1, .12], [.3, .09], [.5, .14], [.7, .1], [.9, .08]];
      for (const [sx, ss] of stupas) {
        const bx = W * sx, base = H * .68, bs = H * ss;

        FS('#3a2418'); rect(bx - bs * .5, base - bs * .35, bs, bs * .35); ellP(bx, base - bs * .45, bs * .38, bs * .25); poly([bx - bs * .3,base - bs * .6],[bx,base - bs * 1.15],[bx + bs * .3,base - bs * .6])
      }

      FS(lg(0, H * .62, 0, H,[0, '#4a3228',1, '#241410'])); bnd(.62);

      FS('rgba(230,180,140,.15)');
      times(2, i => {
        ell((.3 + i * .4 + .02 * SI(t * .3 + i)), (.58 + i * .05), W * .25, H * .03)
      })
    } else if (pr === 'torres') {

      sky([[0,'#c0d8e8'],[.45,'#8aa8c0'],[1,'#3a5c68']]);

      FS('rgba(240,240,235,.7)'); bP(); eC(W * .5, H * .18, W * .2, H * .025, 0, 0, 7); eC(W * .5, H * .18, W * .2, H * .025, 0, 0, 7); fL(); bP(); eC(W * .52, H * .15, W * .13, H * .018, 0, 0, 7); eC(W * .52, H * .15, W * .13, H * .018, 0, 0, 7); fL();

      const towers = [[.38, .58, .3], [.5, .15, .42], [.62, .56, .26]];
      for (const [tx, ty, th] of towers) {
        const bx = W * tx, by = H * ty, bh = H * th;

        FS('#585048'); poly([bx - bh * .16,H * .58],[bx - bh * .14,H * .58 - bh],[bx,H * .58 - bh * 1.15,bx + bh * .14,H * .58 - bh],[bx + bh * .16,H * .58]);

        FS('#38302a'); poly([bx + bh * .04,H * .58 - bh * 1.05],[bx + bh * .14,H * .58 - bh],[bx + bh * .16,H * .58],[bx + bh * .04,H * .58])
      }

      FS('#4a6a48'); poly([0,H * .58],[W * .2,H * .55,W * .5,H * .58],[W * .8,H * .61,W,H * .57],[W,H * .7],[W,H * .7],[0,H * .7]);

      FS(lg(0, H * .62, 0, H,[0, '#58b8c0',1, '#2a7080'])); bnd(.62);

      FS('#8a7a60'); poly([0,H * .68],[W * .5,H * .66,W,H * .7],[W,H * .72],[W,H * .72],[0,H * .72]);

      FS('rgba(80,70,60,.25)');
      for (const [tx, ty, th] of towers) {
        const bx = W * tx, bh = H * th; poly([bx - bh * .14,H * .64],[bx - bh * .1,H * .64 + bh * .4],[bx + bh * .1,H * .64 + bh * .4],[bx + bh * .14,H * .64])
      }

      const guanacos = [[.22, .665, .05], [.7, .655, .04]];
      for (const [gx, gy, gs] of guanacos) {
        const bx = W * gx, by = H * gy, sc = H * gs; FS('#3a2a1a'); bP(); eC(bx, by, sc * .55, sc * .3, 0, 0, 7); eC(bx, by, sc * .55, sc * .3, 0, 0, 7); fL(); SS('#3a2a1a'); lnW(sc * .12); plS([bx + sc * .3, by - sc * .1],[bx + sc * .5, by - sc * .75]); bP(); eC(bx + sc * .52, by - sc * .78, sc * .14, sc * .1, 0, 0, 7); eC(bx + sc * .52, by - sc * .78, sc * .14, sc * .1, 0, 0, 7); fL(); SS('#3a2a1a'); lnW(sc * .06);
        ([-.3, -.1, .15, .35]).forEach(lx => {
          plS([bx + lx * sc, by + sc * .2],[bx + lx * sc, by + sc * .7])
        })
      }
    } else if (pr === 'lauterbrunnen') {

      sky([[0,'#a8c8dc'],[.5,'#7a9cb8'],[1,'#3a5a48']]);

      FS('#4a4a42'); mv(0, 0); mT(0, 0); lT(W * .12, 0); lT(W * .18, H * .3); lT(W * .14, H * .62); lT(0, H * .7); cP(); cP(); fL();

      FS('#42403a'); mv(W, 0); mT(W, 0); lT(W * .86, 0); lT(W * .8, H * .35); lT(W * .85, H * .62); lT(W, H * .72); cP(); cP(); fL();

      SS('rgba(120,115,105,.5)'); lnW(1);
      times(6, i => {
        const ry = H * (.08 + i * .08); plS([0, ry + i * 3],[W * .16, ry]); plS([W, ry + i * 2],[W * .84, ry])
      });

      FS('#c8d8d0'); poly([W * .18,H * .3],[W * .8,H * .35],[W * .75,H * .5],[W * .25,H * .5]);

      SS('rgba(240,245,250,.85)'); lnW(W * .008); plS([W * .155, H * .28],[W * .17 + S(2) * 2, H * .42, W * .16, H * .58]);

      FS('rgba(240,245,250,.4)'); ell(.16, .58, W * .03, H * .015 + S(3) * 2);

      SS('rgba(240,245,250,.7)'); lnW(W * .005); plS([W * .82, H * .3],[W * .84, H * .45, W * .83, H * .58]);

      FS(lg(0, H * .5, 0, H,[0, '#6a9a58',1, '#3a6a38'])); poly([0,H * .7],[W * .5,H * .55,W,H * .72],[W,H],[W,H],[0,H]);

      SS('rgba(220,235,240,.7)'); lnW(W * .006); plS([W * .5, H * .56],[W * .42, H * .7, W * .55, H * .82],[W * .6, H * .9, W * .5, H]);

      const cx0 = W * .55, cy0 = H * .7; FS('#e8e0d0'); rect(cx0 - W * .02, cy0, W * .04, H * .05); poly([cx0 - W * .025,cy0],[cx0,cy0 - H * .05],[cx0 + W * .025,cy0]);

      FS('#7a5a40');
      ([.48, .63, .7]).forEach(hx2 => {
        poly([W * hx2,cy0 + H * .02],[W * (hx2 + .015),cy0 + H * .005],[W * (hx2 + .03),cy0 + H * .02],[W * (hx2 + .03),cy0 + H * .045],[W * hx2,cy0 + H * .045])
      })
    } else if (pr === 'hallstatt') {

      sky([[0,'#b8d4e0'],[.5,'#8aaabb'],[1,'#4a6878']]);

      FS('#6a8898'); poly([0,H * .5],[W * .25,H * .15,W * .5,H * .3],[W * .75,H * .18,W,H * .42],[W,H * .55],[W,H * .55],[0,H * .55]);

      FS('rgba(230,235,238,.35)'); bP(); eC(W * .5, H * .4, W * .3, H * .03, 0, 0, 7); eC(W * .5, H * .4, W * .3, H * .03, 0, 0, 7); fL();

      const houses = [[.1, '#c07858', .08], [.18, '#d8a868', .06], [.26, '#a86050', .07], [.34, '#c89070', .05]];
      for (const [hx2, col, hs] of houses) {
        const bx = W * hx2, by = H * .5, hs2 = H * hs;

        FS(col); poly([bx - hs2 * .5,by],[bx - hs2 * .45,by - hs2 * .7],[bx + hs2 * .45,by - hs2 * .7],[bx + hs2 * .5,by]);

        FS(K0); poly([bx - hs2 * .55,by - hs2 * .68],[bx,by - hs2 * 1.1],[bx + hs2 * .55,by - hs2 * .68]);

        FS('#f0e8d8'); rect(bx - hs2 * .12, by - hs2 * .5, hs2 * .08, hs2 * .1)
      }

      const chx = W * .45, chy = H * .5; FS('#e8e4da'); poly([chx - W * .018,chy],[chx - W * .015,chy - H * .12],[chx + W * .015,chy - H * .12],[chx + W * .018,chy]); FS(K0); poly([chx - W * .022,chy - H * .12],[chx,chy - H * .18],[chx + W * .022,chy - H * .12]);

      FS(lg(0, H * .52, 0, H,[0, '#7aa0b0',1, '#3a5c6a'])); bnd(.52);

      FS('rgba(120,140,150,.2)');
      for (const [hx2, col, hs] of houses) {
        const bx = W * hx2, hs2 = H * hs; rect(bx - hs2 * .45, H * .52, hs2 * .9, hs2 * .6)
      }
      FS('rgba(220,220,210,.25)'); rect(chx - W * .015, H * .52, W * .03, H * .1);

      const swans = [[.3, .62, .04], [.55, .68, .035]];
      for (const [sx, sy, ss] of swans) {
        const bx = W * sx, by = H * sy, sc = H * ss;

        FS('#f0f0ea'); bP(); eC(bx, by, sc * .5, sc * .18, 0, 0, 7); eC(bx, by, sc * .5, sc * .18, 0, 0, 7); fL();

        SS('#f0f0ea'); lnW(sc * .1); plS([bx + sc * .3, by - sc * .05],[bx + sc * .55, by - sc * .4, bx + sc * .4, by - sc * .6]);

        bP(); eC(bx + sc * .4, by - sc * .6, sc * .1, sc * .08, 0, 0, 7); eC(bx + sc * .4, by - sc * .6, sc * .1, sc * .08, 0, 0, 7); fL();

        SS('rgba(200,220,230,.3)'); lnW(1); bP(); eC(bx, by + sc * .1, sc * .9, sc * .15, 0, 0, PI); sK()
      }
    } else if (pr === 'petra') {

      sky([[0,'#e8b890'],[.5,'#c08868'],[1,'#8a5a44']]);

      mir(s => {
        FS(s < 0 ? '#9a6a50' : '#8a5a44'); bP(); const edge = s < 0 ? 0 : W; const inner = s < 0 ? .28 : .72; mT(edge, 0); qT(W * inner - s * W * .02, H * .3, W * inner, H); lT(edge, H); cP(); cP(); fL();

        SS('rgba(120,70,50,.5)'); lnW(H * .008);
        span(1, 4, i => {
          plS([edge, H * i * .18],[W * inner * .6, H * (i * .18 + .04), W * inner, H * i * .16])
        })
      })

      const tx = W * .5, ty = H * .12, tw = W * .2, th = H * .7;

      FS('#d8a078'); rect(tx - tw * .5, ty + th * .25, tw, th * .75);

      FS('#c89070'); poly([tx - tw * .5,ty + th * .25],[tx - tw * .42,ty + th * .12],[tx,ty + th * .08],[tx + tw * .42,ty + th * .12],[tx + tw * .5,ty + th * .25]);

      bP(); aR(tx, ty + th * .1, tw * .08, 0, 7); aR(tx, ty + th * .1, tw * .08, 0, 7); fL();

      FS('#e8b088');
      times(6, i => {
        const px = tx - tw * .4 + i * tw * .16; rect(px, ty + th * .3, tw * .05, th * .6);

        rect(px - tw * .01, ty + th * .28, tw * .07, th * .03)
      });

      FS('#3a2418'); rect(tx - tw * .06, ty + th * .72, tw * .12, th * .28);

      FS('#5a7848'); bP(); eC(W * .32, H * .95, W * .04, H * .015, -.2, 0, 7); eC(W * .32, H * .95, W * .04, H * .015, -.2, 0, 7); fL(); bP(); eC(W * .68, H * .96, W * .035, H * .012, .15, 0, 7); eC(W * .68, H * .96, W * .035, H * .012, .15, 0, 7); fL()
    } else if (pr === 'machupicchu') {

      sky([[0,'#a8c8d8'],[.45,'#7898a8'],[1,'#3a5c48']]);

      FS('#4a7860'); poly([W * .55,H * .55],[W * .68,H * .1],[W * .82,H * .55]);

      FS('#3a6850'); poly([W * .68,H * .1],[W * .82,H * .55],[W * .7,H * .55]);

      FS('#6a9880'); poly([0,H * .55],[W * .18,H * .38],[W * .18,H * .38],[W * .32,H * .5],[W * .45,H * .42],[W * .45,H * .42],[W * .55,H * .55]);

      FS('#5a8858'); poly([0,H * .62],[W * .3,H * .5,W * .55,H * .56],[W * .7,H * .6,W,H * .58],[W,H],[W,H],[0,H]);

      FS('#7aa860');
      times(5, i => {
        const ty = H * (.64 + i * .05); poly([0,ty],[W * .35,ty - H * .02,W * .6,ty + H * .01],[W * .6,ty + H * .02],[W * .35,ty,0,ty + H * .025])
      });

      FS('#8a8878'); const blocks = [[.3, .52, .06], [.4, .5, .05], [.48, .53, .055], [.56, .51, .045]];
      for (const [bx, by, bs] of blocks) {
        const px = W * bx, py = H * by, sc = H * bs; rect(px - sc * .5, py - sc * .5, sc, sc);

        FS('#3a3830'); rect(px - sc * .1, py - sc * .1, sc * .08, sc * .12); FS('#8a8878')
      }

      const cl = (t * .03) % 1; FS('rgba(235,240,240,.5)');
      times(3, i => {
        const cx = W * ((.6 + i * .15 + cl) % 1.2 - .1); ellP(cx, H * (.3 + i * .08), W * (.06 + i * .015), H * .012)
      })
    } else if (pr === 'dolomites') {

      sky([[0,'#a8c8e0'],[.5,'#c8d8e0'],[1,'#5a8858']]);

      FS('#b8b0a0'); const peaks = [[.2, .42, .12], [.45, .36, .18], [.7, .44, .14]];
      for (const [px, py, pw] of peaks) {
        const bx = W * px, bw = W * pw, by = H * py; poly([bx - bw,H * .62],[bx - bw * .3,by],[bx,by - H * .04],[bx + bw * .25,by + H * .02],[bx + bw,H * .62]);

        SS('rgba(90,80,70,.5)'); lnW(H * .006);
        span(-1, 1, i => {
          plS([bx + i * bw * .3, by + H * .02],[bx + i * bw * .4, H * .62])
        })
      }

      FS('rgba(230,180,140,.3)'); poly([W * .2 - W * .12,H * .62],[W * .2 - W * .036,H * .42],[W * .2,H * .38],[W * .2 + W * .12,H * .62]);

      FS(lg(0, H * .62, 0, H,[0, '#6a9860',1, '#3a5c38'])); bnd(.62);

      FS('#2a4a30');
      times(6, i => {
        const tx = W * (.62 + i * .06), ty = H * (.68 + (i % 2) * .02), ts = H * .05; poly([tx,ty - ts],[tx - ts * .4,ty],[tx + ts * .4,ty])
      });

      const hx3 = W * .3, hy3 = H * .72, hs3 = H * .09; FS('#e8e0d0'); rect(hx3 - hs3 * .4, hy3 - hs3 * .35, hs3 * .8, hs3 * .35); FS('#5a4030'); poly([hx3 - hs3 * .5,hy3 - hs3 * .33],[hx3,hy3 - hs3 * .8],[hx3 + hs3 * .5,hy3 - hs3 * .33]);

      FS(K0); rect(hx3 - hs3 * .12, hy3 - hs3 * .25, hs3 * .1, hs3 * .12);

      FS('#e8e8d0'); scat(21, 20, (rngD2, i) => {
        const fx = W * rngD2(), fy = H * (.68 + rngD2() * .28); bP(); eC(fx, fy, H * .003, H * .003, 0, 0, 7); eC(fx, fy, H * .003, H * .003, 0, 0, 7); fL()
      })
    } else if (pr === 'zhangjiajie') {

      sky([[0,'#b8d0d8'],[.45,'#8aaba8'],[1,'#3a5848']]);

      FS('rgba(120,140,130,.45)'); const farPillars = [[.08, .5, .05, .35], [.22, .45, .04, .3], [.55, .48, .05, .32], [.88, .5, .045, .3]];
      for (const [px, py, pw, ph] of farPillars) {
        const bx = W * px, bw = W * pw, bh = H * ph; rect(bx - bw / 2, H * py - 0, bw, bh)
      }

      const pillars = [[.15, .18, .08, .62], [.5, .12, .1, .68], [.85, .2, .075, .6]];
      for (const [px, py, pw, ph] of pillars) {
        const bx = W * px, bw = W * pw, top = H * py;

        FS('#7a8878'); poly([bx - bw * .45,top],[bx - bw * .5,top + H * .3,bx - bw * .38,top + H * ph],[bx + bw * .38,top + H * ph],[bx + bw * .5,top + H * .3,bx + bw * .45,top]);

        SS('rgba(60,70,60,.4)'); lnW(H * .004);
        span(1, 5, i => {
          plS([bx - bw * .46, top + i * ph * .12],[bx, top + i * ph * .12 + H * .01, bx + bw * .46, top + i * ph * .12])
        })

        FS('#3a6848'); bP(); eC(bx, top, bw * .5, H * .02, 0, 0, 7); eC(bx, top, bw * .5, H * .02, 0, 0, 7); fL()
      }

      FS('rgba(230,238,240,.55)');
      times(2, i => {
        const cy = H * (.48 + i * .18); const drift = ((t * .02 + i * .4) % 1.4 - .2) * W; bP(); eC(drift, cy, W * .35, H * .05, 0, 0, 7); eC(drift, cy, W * .35, H * .05, 0, 0, 7); fL()
      });

      FS('rgba(220,230,232,.5)'); bP(); eC(W * .5, H * .95, W * .7, H * .1, 0, 0, 7); eC(W * .5, H * .95, W * .7, H * .1, 0, 0, 7); fL()
    } else if (pr === 'halong') {

      sky([[0,'#a8ccd8'],[.45,'#7aa8a8'],[1,'#3a6858']]);

      FS('rgba(100,130,110,.5)'); const far = [[.1, .52, .08, .12], [.3, .5, .06, .1], [.6, .52, .09, .13], [.9, .5, .07, .11]];
      for (const [px, py, pw, ph] of far) {
        const bx = W * px; poly([bx - W * pw * .5,H * py + H * .02],[bx - W * pw * .3,H * (py - ph),bx,H * (py - ph - .03)],[bx + W * pw * .3,H * (py - ph),bx + W * pw * .5,H * py + H * .02])
      }

      FS('#5a7868'); const near = [[.18, .3, .12, .35], [.78, .34, .1, .3]];
      for (const [px, py, pw, ph] of near) {
        const bx = W * px; poly([bx - W * pw * .5,H * .62],[bx - W * pw * .4,H * py,bx,H * (py - .04)],[bx + W * pw * .4,H * py,bx + W * pw * .5,H * .62]);

        FS('#3a5848'); bP(); eC(bx, H * (py - .04), W * pw * .12, H * .015, 0, 0, 7); eC(bx, H * (py - .04), W * pw * .12, H * .015, 0, 0, 7); fL(); FS('#5a7868')
      }

      FS(lg(0, H * .55, 0, H,[0, '#6a9888',1, '#2a4a44'])); bnd(.55);

      FS('rgba(90,120,104,.25)');
      for (const [px, py, pw] of near) {
        rect(W * px - W * pw * .4, H * .62, W * pw * .8, H * .1)
      }

      const junks = [[.42, .7, .07, .05], [.65, .75, .05, .04]];
      for (const [jx, jy, js, sjs] of junks) {
        const bx = W * jx, by = H * jy, sc = H * js, ss = H * sjs;

        FS('#4a3428'); poly([bx - sc * .6,by],[bx - sc * .7,by - sc * .15,bx - sc * .5,by - sc * .18],[bx + sc * .5,by - sc * .18],[bx + sc * .7,by - sc * .15,bx + sc * .6,by],[bx,by + sc * .12,bx - sc * .6,by]);

        FS('#c89058'); poly([bx,by - sc * .2],[bx + ss * .7,by - sc * 1.4],[bx + ss * .85,by - sc * .3]);

        SS('#8a6038'); lw(1, .004);
        span(1, 3, i => {
          plS([bx + ss * .12 * i, by - sc * (.2 + .3 * i)],[bx + ss * (.7 + .04 * i), by - sc * (.3 + .35 * i)])
        })

        FS('rgba(40,60,55,.3)'); bP(); eC(bx, by + sc * .08, sc * .5, sc * .06, 0, 0, 7); eC(bx, by + sc * .08, sc * .5, sc * .06, 0, 0, 7); fL()
      }

      SS('rgba(240,245,245,.7)'); lw(1, .005); const birds = [[.5, .2], [.57, .17], [.45, .24]];
      for (const [bx2, by2] of birds) {
        plS([W * bx2 - W * .015, H * by2],[W * bx2, H * (by2 - .02), W * bx2 + W * .015, H * by2])
      }
    } else if (pr === 'vinicunca') {

      sky([[0,'#a8c8d8'],[.4,'#88a8b0'],[1,'#4a6a50']]);

      FS('#c08858'); poly([0,H * .75],[W * .3,H * .35,W * .65,H * .3],[W * .85,H * .32,W,H * .55],[W,H],[0,H]);

      const bands = ['#b05040', '#d8a050', '#78a088', '#885858', '#c89858'];
      times(bands.length, i => {
        FS(bands[i]); const off = i * .045; poly([0,H * (.75 - off)],[W * .3,H * (.35 - off),W * .65,H * (.3 - off * .5)],[W * .85,H * (.32 - off * .4),W,H * (.55 - off)],[W,H * (.55 - off + .04)],[W * .85,H * (.32 - off * .4 + .04),W * .65,H * (.3 - off * .5 + .04)],[W * .3,H * (.35 - off + .04),0,H * (.75 - off + .04)])
      });

      FS('#c08858'); poly([0,H * .62],[W * .35,H * .5,W * .7,H * .55],[W,H * .68],[W,H],[0,H]);

      FS('#4a6848'); poly([W * .62,H],[W * .72,H * .68,W * .88,H * .58],[W,H * .55],[W,H * .55],[W,H]);

      SS('#e8e0c8'); lw(1.5, .006); plS([W * .3, H * .95],[W * .38, H * .8],[W * .38, H * .8],[W * .32, H * .68],[W * .42, H * .58],[W * .42, H * .58],[W * .5, H * .5]);

      FS('rgba(235,240,242,.5)'); bP(); eC(W * .7, H * .18, W * .2, H * .02, 0, 0, 7); eC(W * .7, H * .18, W * .2, H * .02, 0, 0, 7); fL()
    } else if (pr === 'lofoten') {

      sky([[0,'#98bcd8'],[.45,'#7aa0b8'],[1,'#3a5868']]);

      FS('#4a6878'); mv(0, H * .55); const ridge = [[.08, .32], [.18, .45], [.28, .28], [.38, .48], [.5, .35], [.62, .5], [.72, .3], [.82, .44], [.92, .34]];
      for (const [rx, ry] of ridge) lT(W * rx, H * ry);
      lT(W, H * .55); lT(W, H * .55); lT(W, H * .65); lT(W, H * .55); lT(W, H * .65); lT(0, H * .65); cP(); cP(); fL();

      FS('#e8eef0');
      for (let i = 0; i < ridge.length; i += 2) {
        const [rx, ry] = ridge[i]; poly([W * rx - W * .02,H * (ry + .06)],[W * rx,H * ry],[W * rx + W * .02,H * (ry + .06)])
      }

      FS(lg(0, H * .55, 0, H,[0, '#5a9890',1, '#2a4a50'])); bnd(.55);

      FS('#4a7048'); poly([0,H * .82],[W * .4,H * .78,W,H * .84],[W,H],[W,H],[0,H]);

      const cabins = [[.15, .78], [.28, .8]];
      for (const [cx, cy] of cabins) {
        const bx = W * cx, by = H * cy, cs = H * .09;

        SS('#3a2a20'); lw(1.5, .006);
        ([-.3, 0, .3]).forEach(dx => {
          plS([bx + cs * dx, by],[bx + cs * dx, by + cs * .2])
        });

        FS('#a03828'); rect(bx - cs * .45, by - cs * .5, cs * .9, cs * .5);

        FS('#f0e8dc'); rect(bx - cs * .15, by - cs * .38, cs * .12, cs * .15);

        FS('#2a2420'); poly([bx - cs * .55,by - cs * .48],[bx,by - cs * .85],[bx + cs * .55,by - cs * .48])
      }

      FS('#e8e4da'); const bx2 = W * .55, by2 = H * .72, bs = H * .04; poly([bx2 - bs,by2],[bx2,by2 + bs * .3,bx2 + bs,by2],[bx2 + bs * .7,by2 - bs * .3],[bx2 - bs * .7,by2 - bs * .3]);

      FS('#c8b890'); poly([bx2,by2 - bs * .3],[bx2 + bs * .8,by2 - bs * 1.4],[bx2 + bs * .9,by2 - bs * .35]);

      FS('rgba(74,104,120,.2)');
      for (let i = 0; i < ridge.length; i += 2) {
        const [rx, ry] = ridge[i]; rect(W * rx - W * .02, H * .55, W * .04, H * .08)
      }
    } else if (pr === 'borobudur') {

      sky([[0,'#d8b890'],[.4,'#a88878'],[1,'#4a5840']]);

      FS('#6a6858'); poly([W * .55,H * .6],[W * .7,H * .28],[W * .88,H * .6]); FS('rgba(230,230,225,.5)'); bP(); eC(W * .72, H * .22, W * .06, H * .02, .2, 0, 7); eC(W * .72, H * .22, W * .06, H * .02, .2, 0, 7); fL();

      FS('#7a7060');
      times(4, i => {
        const ty = H * (.62 + i * .06), tw2 = W * (.5 - i * .08); rect(W * .5 - tw2 / 2, ty, tw2, H * .05)
      });

      FS('#8a8070'); const stupas = [.3, .42, .58, .7];
      for (const sx of stupas) {
        const bx = W * sx, by = H * .6, bs = H * .05;

        poly([bx - bs * .5,by],[bx - bs * .5,by - bs * .7,bx,by - bs * .75],[bx + bs * .5,by - bs * .7,bx + bs * .5,by]);

        poly([bx - bs * .08,by - bs * .72],[bx,by - bs * 1.05],[bx + bs * .08,by - bs * .72]);

        FS('#3a3428');
        span(-1, 1, i => {
          ellP(bx + i * bs * .22, by - bs * .35, bs * .06, bs * .08)
        })
        FS('#8a8070')
      }

      const mx = W * .5, my = H * .58, ms = H * .07; FS('#8a8070'); poly([mx - ms * .6,my],[mx - ms * .6,my - ms * .8,mx,my - ms * .85],[mx + ms * .6,my - ms * .8,mx + ms * .6,my]); poly([mx - ms * .1,my - ms * .85],[mx,my - ms * 1.25],[mx + ms * .1,my - ms * .85]);

      FS('rgba(230,225,210,.4)'); bP(); eC(W * .5, H * .65, W * .55, H * .03, 0, 0, 7); eC(W * .5, H * .65, W * .55, H * .03, 0, 0, 7); fL();

      FS('#4a6840'); bnd(.82);

      SS('#3a4a30'); lw(2, .008);
      ([.12, .88]).forEach(px => {
        const bx = W * px; mv(bx, H * .82); mT(bx, H * .82); lT(bx + W * .01, H * .68); mT(bx, H * .82); lT(bx + W * .01, H * .68); sK(); FS('#3a5c38');
        ([-1.9, -1.3, -.8]).forEach(a => {
          poly([bx + W * .01,H * .68],[bx + W * .01 + CO(a) * W * .05,H * .68 + SI(a) * H * .06,bx + W * .01 + CO(a) * W * .09,H * .68 + SI(a) * H * .08 + H * .01],[bx + W * .01 + CO(a) * W * .05,H * .68 + SI(a) * H * .05,bx + W * .01,H * .68])
        })
      })
    } else if (pr === 'socotra') {

      sky([[0,'#88c8e0'],[.5,'#b8d8c8'],[1,'#e8dcB0']]);

      FS('#b0a088'); poly([0,H * .5],[W * .2,H * .38],[W * .2,H * .38],[W * .55,H * .36],[W * .58,H * .42],[W * .58,H * .42],[W * .85,H * .44],[W,H * .5],[W,H * .5],[W,H * .6],[W,H * .5],[W,H * .6],[0,H * .6]);

      FS(lg(0, H * .55, 0, H * .78,[0, '#50b8b0',1, '#2a8880'])); rect(0, H * .55, W, H * .23);

      FS('#f0e8d0'); poly([0,H * .78],[W * .5,H * .74,W,H * .8],[W,H],[W,H],[0,H]);

      const trees = [[.15, .8, .13], [.38, .82, .1], [.75, .79, .15]];
      for (const [tx, ty, ts] of trees) {
        const bx = W * tx, by = H * ty, tsz = H * ts;

        SS('#7a6a55'); lnW(MX(1.5, tsz * .06)); mv(bx, by); mT(bx, by); lT(bx, by - tsz * .5); mT(bx, by); lT(bx, by - tsz * .5); sK();
        ([-2.1, -1.6, -1.05]).forEach(a => {
          plS([bx, by - tsz * .5],[bx + CO(a) * tsz * .3, by - tsz * .5 + SI(a) * tsz * .3])
        });

        FS('#4a7c40'); bP(); eC(bx, by - tsz * .75, tsz * .45, tsz * .18, 0, PI, 0); qT(bx, by - tsz * .6, bx - tsz * .45, by - tsz * .75); cP(); cP(); fL();

        SS('#3a6030'); lnW(MX(.8, tsz * .02));
        span(-3, 3, i => {
          plS([bx + i * tsz * .12, by - tsz * .9],[bx + i * tsz * .14, by - tsz * .62])
        })
      }

      SS('#3a4a50'); lw(1, .004);
      for (const [fx, fy] of [[.3, .25], [.45, .2], [.62, .28], [.8, .18]]) {
        plS([W * fx - W * .008, H * fy],[W * fx, H * fy - H * .01, W * fx + W * .008, H * fy])
      }
    } else if (pr === 'tonlesap') {

      sky([[0,'#c8d8e0'],[.45,'#98b8c0'],[1,'#5a7860']]);

      FS('#4a6858'); mv(0, H * .52);
      span(0, 10, i => {
        qT(W * (i + .5) / 10, H * (.5 - .02 * SI(i * 2)), W * (i + 1) / 10, H * .52)
      })
      lT(W, H * .58); lT(W, H * .58); lT(0, H * .58); cP(); cP(); fL();

      FS(lg(0, H * .55, 0, H,[0, '#6a9a90',1, '#3a5850'])); bnd(.55);

      const stilts = [[.2, .68], [.48, .65]];
      for (const [sx, sy] of stilts) {
        const bx = W * sx, by = H * sy, ss = H * .1;

        SS(K0); lw(1.5, .006);
        ([-.35, -.12, .12, .35]).forEach(dx => {
          plS([bx + ss * dx, by],[bx + ss * dx, by + ss * .5])
        });

        FS('#8a6a48'); rect(bx - ss * .4, by - ss * .45, ss * .8, ss * .45);

        FS('#6a5035'); poly([bx - ss * .5,by - ss * .42],[bx,by - ss * .9],[bx + ss * .5,by - ss * .42]);

        FS('#3a2c20'); rect(bx - ss * .1, by - ss * .32, ss * .12, ss * .12)
      }

      FS('#5a4430'); const bx = W * .72, by = H * .72; poly([bx - H * .06,by],[bx,by + H * .015,bx + H * .06,by],[bx + H * .05,by - H * .012],[bx - H * .05,by - H * .012]);

      FS('#2a2018'); bP(); eC(bx + H * .01, by - H * .025, H * .008, H * .015, 0, 0, 7); eC(bx + H * .01, by - H * .025, H * .008, H * .015, 0, 0, 7); fL();

      SS(K0); lw(1, .004); mv(bx + H * .01, by - H * .03); mT(bx + H * .01, by - H * .03); lT(bx + H * .035, by - H * .09); mT(bx + H * .01, by - H * .03); lT(bx + H * .035, by - H * .09); sK();

      SS('#4a5860'); lw(1, .004);
      times(4, i => {
        const fx = .6 + i * .06, fy = .18 - i * .01; plS([W * fx - W * .008, H * fy],[W * fx, H * fy - H * .01, W * fx + W * .008, H * fy])
      })
    } else if (pr === 'drakensberg') {

      sky([[0,'#88b8d8'],[.45,'#a8c8d0'],[1,'#5a7858']]);

      FS('#8a7a68'); poly([W * .1,H * .62],[W * .15,H * .3],[W * .3,H * .22],[W * .5,H * .18],[W * .7,H * .22],[W * .85,H * .3],[W * .9,H * .62]);

      SS('#6a5a48'); lw(1, .004);
      times(9, i => {
        const rx = .18 + i * .08; plS([W * rx, H * .25],[W * (rx + .01), H * .6])
      });

      FS('rgba(240,245,245,.8)'); poly([W * .49,H * .2],[W * .505,H * .62],[W * .515,H * .62],[W * .51,H * .2]);

      FS('rgba(230,240,240,.5)'); bP(); eC(W * .5, H * .62, W * .04, H * .015, 0, 0, 7); eC(W * .5, H * .62, W * .04, H * .015, 0, 0, 7); fL();

      FS('#4a7840'); poly([0,H * .62],[W * .5,H * .58,W,H * .64],[W,H],[W,H],[0,H]);

      SS('#3a6030'); lw(1, .005);
      times(6, i => {
        plS([W * i * .18, H * (.66 + i * .02)],[W * (i * .18 + .12), H * (.64 + i * .02)])
      });

      FS('rgba(235,240,242,.7)'); bP(); eC(W * .4, H * .16, W * .25, H * .025, 0, 0, 7); eC(W * .4, H * .16, W * .25, H * .025, 0, 0, 7); fL(); bP(); eC(W * .7, H * .24, W * .18, H * .02, 0, 0, 7); eC(W * .7, H * .24, W * .18, H * .02, 0, 0, 7); fL()
    } else if (pr === 'serengeti') {

      sky([[0,'#e8a858'],[.5,'#c88858'],[1,'#7a6838']]);

      FS('#f0c868'); dot(.62,.42,H * .18);

      FS('rgba(240,200,104,.3)'); dot(.62,.42,H * .24);

      FS('#7a5c40'); bP(); eC(W * .15, H * .6, W * .1, H * .04, 0, PI, 0); eC(W * .15, H * .6, W * .1, H * .04, 0, PI, 0); fL();

      FS(lg(0, H * .6, 0, H,[0, '#c8a858',1, '#8a7040'])); poly([0,H * .62],[W * .5,H * .58,W,H * .62],[W,H],[W,H],[0,H]);

      const acacia = [[.18, .7, .14], [.78, .66, .18]];
      for (const [ax, ay, as_] of acacia) {
        const bx = W * ax, by = H * ay, ts = H * as_;

        SS(K0); lnW(MX(1.5, ts * .04)); mv(bx, by); mT(bx, by); lT(bx, by - ts * .55); mT(bx, by); lT(bx, by - ts * .55); sK(); mv(bx, by - ts * .4); mT(bx, by - ts * .4); lT(bx - ts * .2, by - ts * .62); mT(bx, by - ts * .4); lT(bx - ts * .2, by - ts * .62); sK(); mv(bx, by - ts * .4); mT(bx, by - ts * .4); lT(bx + ts * .18, by - ts * .6); mT(bx, by - ts * .4); lT(bx + ts * .18, by - ts * .6); sK();

        FS('#3a5828'); bP(); eC(bx, by - ts * .68, ts * .42, ts * .1, 0, PI, 0); qT(bx, by - ts * .55, bx - ts * .42, by - ts * .68); cP(); cP(); fL()
      }

      FS('#3a3028');
      times(7, i => {
        const wx = .35 + i * .07, wy = .63 + .01 * SI(i * 2), ws = H * .012; bP(); eC(W * wx, H * wy, ws * 1.6, ws, 0, 0, 7); eC(W * wx, H * wy, ws * 1.6, ws, 0, 0, 7); fL(); bP(); eC(W * wx + ws * 1.8, H * wy - ws * .8, ws * .5, ws * .5, 0, 0, 7); eC(W * wx + ws * 1.8, H * wy - ws * .8, ws * .5, ws * .5, 0, 0, 7); fL()
      });

      SS(K0); lw(1, .004);
      for (const [fx, fy] of [[.4, .25], [.55, .18]]) {
        plS([W * fx - W * .01, H * fy],[W * fx, H * fy - H * .015, W * fx + W * .01, H * fy])
      }
    } else if (pr === 'simien') {

      sky([[0,'#b8c8d8'],[.5,'#98a8b0'],[1,'#5a6850']]);

      FS('rgba(120,140,150,.5)'); mv(0, H * .5);
      span(0, 6, i => {
        lT(W * (i + .5) / 6, H * (.4 - .05 * SI(i * 2.3))); lT(W * (i + 1) / 6, H * .5)
      })
      lT(W, H * .6); lT(W, H * .6); lT(0, H * .6); cP(); cP(); fL();

      FS('#7a6a58'); poly([W * .1,H * .7],[W * .18,H * .35],[W * .24,H * .5],[W * .3,H * .3],[W * .36,H * .52],[W * .44,H * .38],[W * .52,H * .6],[W * .6,H * .7]);

      SS('#5a4c3c'); lw(1, .004);
      ([.2, .28, .4, .5]).forEach(cx => {
        plS([W * cx, H * .4],[W * (cx + .02), H * .68])
      });

      FS('#4a5a48'); poly([W * .5,H * .7],[W * .75,H * .6,W,H * .75],[W,H],[W,H],[W * .5,H]);

      FS('#6a8858'); poly([0,H * .7],[W * .3,H * .65,W * .6,H * .75],[W * .6,H],[W * .6,H],[0,H]);

      for (const [lx, ly, ls] of [[.12, .8, .1], [.28, .85, .08]]) {
        const bx = W * lx, by = H * ly, ss = H * ls;

        SS('#8a7848'); lnW(MX(1.5, ss * .05)); mv(bx, by - ss * .1); mT(bx, by - ss * .1); lT(bx, by - ss * .9); mT(bx, by - ss * .1); lT(bx, by - ss * .9); sK();

        FS('#a09050'); poly([bx - ss * .05,by - ss * .55],[bx,by - ss * .95],[bx + ss * .05,by - ss * .55]);

        FS('#4a7038'); bP(); eC(bx, by - ss * .08, ss * .3, ss * .18, 0, 0, 7); eC(bx, by - ss * .08, ss * .3, ss * .18, 0, 0, 7); fL()
      }

      FS('rgba(235,240,242,.6)'); bP(); eC(W * .35, H * .2, W * .2, H * .02, 0, 0, 7); eC(W * .35, H * .2, W * .2, H * .02, 0, 0, 7); fL()
    } else if (pr === 'chefchaouen') {

      sky([[0,'#7aa8d0'],[.45,'#a0c0dc'],[1,'#c8dae8']]);

      FS('rgba(100,140,170,.5)'); poly([0,H * .45],[W * .3,H * .3],[W * .3,H * .3],[W * .5,H * .4],[W * .7,H * .32],[W * .7,H * .32],[W,H * .45],[W,H * .55],[W,H * .55],[0,H * .55]);

      const houses = [
        [.05, .5, .16, .35, '#6898c8'], [.22, .48, .14, .4, '#5890c0'],
        [.38, .52, .15, .35, '#78a8d0'], [.55, .45, .14, .42, '#4a80b8'],
        [.7, .5, .16, .38, '#68a0cc'], [.86, .48, .12, .4, '#5888b8'],
      ];
      for (const [hx2, hy2, hw, hh, col] of houses) {
        const bx = W * hx2, by = H * hy2, bs = W * hw; FS(col); rect(bx, by, bs, H * hh);

        FS('#e8f0f0'); rect(bx - bs * .02, by - H * .015, bs * 1.04, H * .02);

        FS('#f0f4f0'); rect(bx + bs * .15, by + H * .08, bs * .15, H * .05); rect(bx + bs * .6, by + H * .12, bs * .15, H * .05);

        FS('#3a6898'); poly([bx + bs * .38,by + H * hh - H * .01],[bx + bs * .38,by + H * hh - H * .1],[bx + bs * .5,by + H * hh - H * .14,bx + bs * .62,by + H * hh - H * .1],[bx + bs * .62,by + H * hh - H * .01])
      }

      FS('#e8f0f0'); poly([W * .42,H],[W * .42,H * .72],[W * .5,H * .66,W * .58,H * .72],[W * .58,H]);

      SS('#b0c8d8'); lw(1.5, .006);
      times(6, i => {
        const sy = H * (.76 + i * .04); plS([W * (.43 + i * .01), sy],[W * (.57 - i * .01), sy])
      });

      for (const [px, py, pc] of [[.4, .85, '#c04848'], [.6, .88, '#d8a038'], [.38, .93, '#c04848']]) {
        FS('#8a5a38'); rect(W * px - W * .012, H * py, W * .024, H * .02); FS(pc); dot(px,py - H * .015,W * .012)
      }
    } else if (pr === 'toraja') {

      sky([[0,'#a8c8e0'],[.5,'#c8d8c0'],[1,'#7a9858']]);

      FS('rgba(110,140,150,.5)'); poly([0,H * .5],[W * .25,H * .35],[W * .25,H * .35],[W * .45,H * .5],[W * .65,H * .38],[W * .65,H * .38],[W,H * .5],[W,H * .6],[W,H * .6],[0,H * .6]);

      for (const [tx, ty, ts] of [[.15, .62, .18], [.4, .58, .22], [.68, .63, .17]]) {
        const bx = W * tx, by = H * ty, bs = W * ts;

        FS('#5a4632');
        ([.15, .5, .85]).forEach(px => {
          rect(bx + bs * px - bs * .02, by, bs * .04, H * .1)
        });

        FS('#7a5a38'); rect(bx, by - bs * .35, bs, bs * .35);

        SS('#e8d8a8'); lnW(MX(1, bs * .015)); plS([bx + bs * .05, by - bs * .2],[bx + bs * .95, by - bs * .2]);

        FS('#3a3028'); poly([bx - bs * .15,by - bs * .3],[bx + bs * .5,by - bs * .85,bx + bs * 1.15,by - bs * .3],[bx + bs * 1.05,by - bs * .15,bx + bs * .5,by - bs * .28],[bx - bs * .05,by - bs * .15,bx - bs * .15,by - bs * .3])
      }

      FS('#88b0d0'); bnd(.78); SS('#6a9048'); lw(1.5, .008);
      ([.8, .85, .9]).forEach(ty2 => {
        plS([0, H * ty2],[W * .4, H * (ty2 - .02), W, H * ty2])
      });

      const px2 = W * .88, py2 = H * .78; SS('#6a5038'); lw(2, .006, W); mv(px2, py2); mT(px2, py2); lT(px2 + W * .01, py2 - H * .15); mT(px2, py2); lT(px2 + W * .01, py2 - H * .15); sK(); SS('#4a7838'); lw(1.5, .004, W);
      times(5, i => {
        const ang = -2.2 + i * .5; plS([px2 + W * .01, py2 - H * .15],[px2 + W * .01 + CO(ang) * W * .05, py2 - H * .15 + SI(ang) * H * .03 - H * .02,
          px2 + W * .01 + CO(ang) * W * .08, py2 - H * .15 + SI(ang) * H * .05])
      })
    } else if (pr === 'chocohills') {

      sky([[0,'#88b8e0'],[.55,'#b0d0e0'],[1,'#8aa868']]);

      FS('#7a9858'); bnd(.6);

      FS('rgba(140,120,90,.5)');
      for (const [hx2, hw] of [[.08, .08], [.2, .1], [.34, .07], [.5, .09], [.65, .08], [.8, .1], [.92, .07]]) {
        poly([W * (hx2 - hw),H * .6],[W * hx2,H * (.6 - hw * .8),W * (hx2 + hw),H * .6])
      }

      const hills = [[.15, .68, .1], [.32, .72, .13], [.5, .66, .09], [.68, .72, .12], [.85, .68, .1]];
      for (const [hx2, hy2, hw] of hills) {
        const bx = W * hx2, by = H * hy2, bs = W * hw;

        FS('#8a6a48'); poly([bx - bs,by],[bx,by - bs * 1.4,bx + bs,by]);

        FS('#6a8a48'); poly([bx - bs * .35,by - bs * .9],[bx,by - bs * 1.45,bx + bs * .35,by - bs * .9]);

        FS('rgba(80,60,40,.35)'); poly([bx,by - bs * 1.4],[bx + bs * .5,by - bs * .6,bx + bs,by],[bx + bs * .6,by],[bx + bs * .2,by - bs * .5,bx,by - bs * 1.4])
      }

      for (const [px, py, ps] of [[.24, .78, .14], [.6, .8, .12]]) {
        const tx2 = W * px, ty2 = H * py, ts2 = H * ps; SS('#7a5a40'); lnW(MX(1.5, ts2 * .06)); mv(tx2, ty2); mT(tx2, ty2); lT(tx2 + ts2 * .08, ty2 - ts2 * .8); mT(tx2, ty2); lT(tx2 + ts2 * .08, ty2 - ts2 * .8); sK(); SS('#4a7838'); lnW(MX(1, ts2 * .04));
        times(5, i => {
          const ang = -2.4 + i * .55; plS([tx2 + ts2 * .08, ty2 - ts2 * .8],[tx2 + ts2 * .08 + CO(ang) * ts2 * .45, ty2 - ts2 * .8 + SI(ang) * ts2 * .25,
            tx2 + ts2 * .08 + CO(ang) * ts2 * .7, ty2 - ts2 * .8 + SI(ang) * ts2 * .45])
        })
      }
    } else if (pr === 'svaneti') {

      sky([[0,'#90b0d0'],[.5,'#b8c8c0'],[1,'#6a8858']]);

      FS('#8898a8'); poly([0,H * .55],[W * .15,H * .32],[W * .15,H * .32],[W * .3,H * .5],[W * .45,H * .28],[W * .45,H * .28],[W * .6,H * .52],[W * .75,H * .34],[W * .75,H * .34],[W,H * .55],[W,H * .65],[W,H * .65],[0,H * .65]);

      FS('#f0f4f8');
      for (const [px, pw] of [[.15, .1], [.45, .09], [.75, .1]]) {
        poly([W * (px - pw),H * .5],[W * px,H * (.5 - pw * .8)],[W * (px + pw),H * .5])
      }

      FS('#4a6838'); rect(0, H * .6, W, H * .12);

      for (const [tx, ty, ts] of [[.12, .7, .09], [.26, .72, .11], [.42, .68, .08]]) {
        const bx = W * tx, by = H * ty, bs = W * ts; FS('#8a7a68'); rect(bx - bs / 2, by - bs * 1.8, bs, bs * 1.8);

        FS('rgba(52,56,68,.9)'); rect(bx - bs * .15, by - bs * 1.5, bs * .3, bs * .2); rect(bx - bs * .15, by - bs * .9, bs * .3, bs * .2);

        FS('#6a5a48'); poly([bx - bs / 2 - bs * .1,by - bs * 1.8],[bx,by - bs * 2.1],[bx + bs / 2 + bs * .1,by - bs * 1.8])
      }

      for (const [hx2, hy2, hw] of [[.6, .78, .12], [.78, .8, .1]]) {
        const bx = W * hx2, by = H * hy2, bs = W * hw; FS('#7a6a58'); rect(bx, by - bs * .4, bs, bs * .4); FS('#5a4a38'); poly([bx - bs * .05,by - bs * .4],[bx + bs / 2,by - bs * .65],[bx + bs * 1.05,by - bs * .4])
      }

      FS('#7a9860'); bnd(.85)
    } else if (pr === 'khiva') {

      sky([[0,'#d8b890'],[.55,'#c8a878'],[1,'#a08858']]);

      FS('#b89468'); rect(0, H * .5, W, H * .2); FS('#a88458');
      times(14, i => {
        rect(W * i / 14 + W * .015, H * .47, W * .04, H * .04)
      });

      ([.1, .35, .62, .85]).forEach(tx => {
        bP(); aR(W * tx, H * .5, W * .035, PI, 0); fL()
      });

      const mx = W * .5, mw = W * .07;

      FS('#98806a'); rect(mx - mw * .7, H * .62, mw * 1.4, H * .08);

      FS('#b89468'); rect(mx - mw / 2, H * .28, mw, H * .34);

      FS('#4a98a8');
      ([.32, .42, .52]).forEach(ty => {
        rect(mx - mw / 2, H * ty, mw, H * .05)
      });

      SS('#e8f0e8'); lw(1, .002, W);
      times(6, i => {
        const fx = mx - mw / 2 + mw * (i + .5) / 6; mv(fx, H * .32); mT(fx, H * .32); lT(fx, H * .57); sK()
      });

      FS('#6a5848'); rect(mx - mw * .62, H * .26, mw * 1.24, H * .02); FS('#98806a'); rect(mx - mw * .55, H * .22, mw * 1.1, H * .04);

      FS('#8a6a4a'); poly([W * .32,H * .7],[W * .32,H * .58],[W * .5,H * .48,W * .68,H * .58],[W * .68,H * .7]);

      FS('rgba(50,40,30,.8)'); poly([W * .38,H * .7],[W * .38,H * .6],[W * .5,H * .54,W * .62,H * .6],[W * .62,H * .7]);

      FS('#c8a870'); bnd(.7)
    } else if (pr === 'preikestolen') {

      sky([[0,'#98b8d8'],[.5,'#a8c0c8'],[1,'#4870a0']]);

      FS('rgba(110,140,160,.5)'); poly([0,H * .5],[W * .2,H * .38],[W * .2,H * .38],[W * .4,H * .5],[W * .6,H * .4],[W * .6,H * .4],[W,H * .5],[W,H * .6],[W,H * .6],[0,H * .6]);

      FS('#3a6898'); bnd(.68);

      SS('rgba(220,235,240,.4)'); lw(1, .003);
      ([.72, .78, .85, .92]).forEach(wy => {
        plS([0, H * wy],[W * .4, H * (wy - .01), W, H * wy])
      });

      const cx = W * .68; FS('#7a6a58'); poly([cx,H * .3],[cx + W * .32,H * .3],[cx + W * .32,H * .42],[cx + W * .28,H],[cx,H]);

      SS('#5a4c3c'); lw(1.5, .006);
      ([.05, .12, .2, .27]).forEach(fx => {
        plS([cx + W * fx, H * .42],[cx + W * (fx - .01), H])
      });

      FS('#6a8850'); poly([cx - W * .02,H * .3],[cx + W * .33,H * .3],[cx + W * .33,H * .26],[cx - W * .02,H * .26]);

      FS('rgba(40,40,40,.8)');
      ([.72, .88]).forEach(px => {
        rect(W * px, H * .24, W * .006, H * .02)
      })
    } else if (pr === 'jeju') {

      sky([[0,'#90b8e0'],[.5,'#a8ccd0'],[1,'#689858']]);

      FS('#5a8ab8'); rect(0, H * .5, W, H * .15);

      FS('#5a7848'); poly([W * .2,H * .5],[W * .45,H * .28,W * .7,H * .5],[W * .7,H * .55],[W * .7,H * .55],[W * .2,H * .55]);

      FS('#4a6838'); poly([W * .38,H * .38],[W * .45,H * .33,W * .52,H * .38],[W * .52,H * .4],[W * .52,H * .4],[W * .38,H * .4]);

      for (const [ox, ow] of [[.15, .12], [.8, .1]]) {
        FS('#5a7848'); poly([W * (ox - ow),H * .55],[W * ox,H * .42,W * (ox + ow),H * .55])
      }

      FS('#3a3838');
      ([.68, .72]).forEach(ry => {
        times(12, i => {
          rect(W * (i + (ry === .72 ? .5 : 0)) / 12, H * ry, W * .07, H * .035)
        })
      });

      const tr3 = mulberry32(555); FS('#e0c838');
      times(60, i => {
        rect(tr3() * W, H * (.78 + tr3() * .18), W * .008, W * .008)
      });

      FS('rgba(100,150,80,.5)'); bnd(.78)
    } else if (pr === 'gobi') {

      sky([[0,'#88b8e0'],[.55,'#b8d0d8'],[1,'#a89858']]);

      FS('#a89858'); bnd(.55);

      SS('rgba(120,140,70,.5)'); lw(1, .005);
      ([.6, .66, .72]).forEach(gy => {
        plS([0, H * gy],[W * .5, H * (gy - .02), W, H * gy])
      });

      const gx = W * .3, gy = H * .62, gs = W * .12;

      FS('#f0e8d8'); rect(gx - gs / 2, gy - gs * .5, gs, gs * .5); poly([gx - gs / 2,gy - gs * .5],[gx,gy - gs * .85,gx + gs / 2,gy - gs * .5]);

      SS('#c04830'); lnW(MX(1.5, gs * .03)); plS([gx - gs / 2, gy - gs * .45],[gx + gs / 2, gy - gs * .45]);

      FS('#7a5a38'); rect(gx - gs * .08, gy - gs * .35, gs * .16, gs * .35);

      SS('rgba(180,190,200,.6)'); lnW(MX(1, gs * .02)); plS([gx + gs * .1, gy - gs * .75],[gx + gs * .15, gy - gs * .9, gx + gs * .25, gy - gs * 1.05]);

      for (const [cx2, cw] of [[.62, .07], [.8, .06]]) {
        const bx = W * cx2, bw = W * cw; FS('#8a6a48'); bP();

        eC(bx, H * .68, bw, bw * .45, 0, 0, 7); eC(bx, H * .68, bw, bw * .45, 0, 0, 7); fL(); eC(bx - bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); eC(bx - bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); fL(); eC(bx + bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); eC(bx + bw * .4, H * .68 - bw * .3, bw * .3, bw * .35, 0, 0, 7); fL();

        SS('#8a6a48'); lnW(MX(1.5, bw * .15)); plS([bx + bw * .8, H * .68],[bx + bw * 1.2, H * .62, bx + bw * 1.15, H * .58]);

        lnW(MX(1.5, bw * .1));
        ([-.5, -.2, .3, .6]).forEach(lx => {
          plS([bx + lx * bw, H * .7],[bx + lx * bw, H * .76])
        })
      }

      FS('rgba(240,245,250,.7)'); ell(.2,.2,W * .12,H * .015); ell(.75,.15,W * .15,H * .02)
    } else if (pr === 'nile') {

      sky([[0,'#e8b870'],[.45,'#d8c098'],[1,'#4878a0']]);

      FS('#c8a870'); rect(0, H * .5, W, H * .15);

      FS('#a88858'); mv(W * .55, H * .5); mT(W * .55, H * .5); lT(W * .72, H * .22); mT(W * .55, H * .5); lT(W * .72, H * .22); lT(W * .89, H * .5); cP(); cP(); fL();

      FS('#d8c8a8'); mv(W * .69, H * .3); mT(W * .69, H * .3); lT(W * .72, H * .22); mT(W * .69, H * .3); lT(W * .72, H * .22); lT(W * .75, H * .3); cP(); cP(); fL(); FS('#b89868'); mv(W * .82, H * .5); mT(W * .82, H * .5); lT(W * .92, H * .32); mT(W * .82, H * .5); lT(W * .92, H * .32); lT(W * 1.02, H * .5); cP(); cP(); fL();

      FS('#4878a0'); bnd(.65);

      SS('rgba(140,190,220,.5)'); lw(1, .005);
      ([.7, .76, .82, .9]).forEach(wy => {
        plS([0, H * wy],[W * .5, H * (wy - .015), W, H * wy])
      });

      const fx = W * .35, fy = H * .62; FS('#e8e0d0'); mv(fx, fy - H * .18); mT(fx, fy - H * .18); lT(fx + W * .1, fy); mT(fx, fy - H * .18); lT(fx + W * .1, fy); lT(fx, fy); cP(); cP(); fL();

      FS('#5a4838'); mv(fx - W * .02, fy); mT(fx - W * .02, fy); qT(fx + W * .05, fy + H * .04, fx + W * .12, fy); cP(); cP(); fL();

      FS('rgba(230,220,200,.3)'); rect(fx, fy + H * .05, W * .1, H * .01);

      SS('#3a6848'); lw(2, .008, W);
      ([.12, .22]).forEach(px => {
        const pxx = W * px; plS([pxx, H * .65],[pxx + W * .01, H * .55, pxx + W * .02, H * .5]);

        lw(1.5, .005, W);
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          plS([pxx + W * .02, H * .5],[pxx + W * .02 + W * a * .12, H * .47, pxx + W * .02 + W * a * .16, H * .5])
        });
        lw(2, .008, W)
      })
    } else if (pr === 'pamukkale') {

      sky([[0,'#a8c8e0'],[.5,'#e8e0d8'],[1,'#d0c8b8']]);

      FS('#98a8b8'); poly([0,H * .42],[W * .2,H * .32],[W * .2,H * .32],[W * .4,H * .4],[W * .6,H * .33],[W * .6,H * .33],[W * .8,H * .4],[W,H * .34],[W,H * .34],[W,H * .45],[W,H * .34],[W,H * .45],[0,H * .45]);

      FS('#f0ece0'); mv(0, H * .5);
      span(0, 8, i => {
        const sx = W * i / 8, sy = H * (.5 + i * .05); lT(sx, sy); lT(sx + W * .1, sy); lT(sx + W * .1, sy + H * .02)
      })
      lT(W, H); lT(W, H); lT(0, H); cP(); cP(); fL();

      SS('rgba(180,170,150,.6)'); lw(1, .005);
      times(8, i => {
        const sy = H * (.5 + i * .05); plS([W * i / 8, sy],[W * (i / 8 + .1), sy])
      });

      for (const [py, px0, px1] of [[.52, .02, .18], [.58, .1, .3], [.65, .18, .38], [.73, .26, .45]]) {
        FS('#58b8c8'); ell((px0 + px1) / 2, py, W * (px1 - px0) / 2, H * .012);

        FS('rgba(220,240,245,.5)'); rect(W * (px0 + px1) / 2 - W * .02, H * py - H * .003, W * .04, H * .004)
      }

      SS('rgba(200,210,220,.4)'); lw(1.5, .004, W); mv(W * .3, H * .5); mT(W * .3, H * .5); qT(W * .32, H * .42, W * .34, H * .36); mT(W * .3, H * .5); qT(W * .32, H * .42, W * .34, H * .36); sK(); mv(W * .65, H * .55); mT(W * .65, H * .55); qT(W * .66, H * .48, W * .68, H * .42); mT(W * .65, H * .55); qT(W * .66, H * .48, W * .68, H * .42); sK()
    } else if (pr === 'chichen') {

      sky([[0,'#80b8e0'],[.55,'#a8ccd8'],[1,'#48884a']]);

      FS('#3a7838');
      times(10, i => {
        const tx = W * i / 9.5; ellP(tx, H * .52, W * .05, H * .04 + (i % 3) * H * .008)
      });
      rect(0, H * .52, W, H * .08);

      FS('#b8a078'); const px = W * .5, pw = W * .38;
      times(5, i => {
        const bw = pw * (1 - i * .16), by = H * (.68 - i * .055); rect(px - bw / 2, by, bw, H * .055)
      });

      FS('#988058'); rect(px - W * .035, H * .42, W * .07, H * .26);

      SS('rgba(120,100,70,.6)'); lw(1, .004);
      ([.46, .5, .54, .58, .62, .66]).forEach(sy => {
        plS([px - W * .035, H * sy],[px + W * .035, H * sy])
      });

      FS('#a89068'); rect(px - W * .06, H * .36, W * .12, H * .06); FS('#584838'); rect(px - W * .015, H * .38, W * .03, H * .04);

      FS('#5a9848'); bnd(.68);

      SS('rgba(70,120,55,.5)');
      ([.74, .82, .9]).forEach(gy => {
        plS([0, H * gy],[W * .5, H * (gy - .02), W, H * gy])
      });

      FS('rgba(245,250,255,.7)'); ell(.2,.16,W * .13,H * .018); ell(.8,.22,W * .1,H * .014)
    } else if (pr === 'lencois') {

      sky([[0,'#90c0e0'],[.5,'#c8dde8'],[1,'#e8e2d0']]);

      for (const [dy, col, shade] of [[.5, '#f0ebe0', '#d8d0c0'], [.62, '#e8e2d0', '#d0c8b8'], [.76, '#e0d8c8', '#c8c0b0']]) {
        FS(col); poly([0,H * (dy + .12)],[W * .15,H * dy,W * .3,H * (dy + .08)],[W * .45,H * (dy - .03),W * .6,H * (dy + .07)],[W * .75,H * (dy - .02),W,H * (dy + .1)],[W,H],[W,H],[0,H]);

        SS(shade); lw(1, .006); plS([0, H * (dy + .12)],[W * .15, H * dy, W * .3, H * (dy + .08)])
      }

      for (const [lx, ly, lw] of [[.3, .58, .1], [.6, .72, .12], [.18, .86, .09]]) {
        FS('#48a8d0'); ell(lx, ly, W * lw, H * .02);

        FS('rgba(220,240,250,.6)'); rect(W * lx - W * .02, H * ly - H * .004, W * .04, H * .004)
      }

      FS(K1); ell(.25,.14,W * .12,H * .016); ell(.7,.2,W * .15,H * .02)
    } else if (pr === 'atoll') {

      sky([[0,'#70a8d8'],[.4,'#98c8e0'],[1,'#48a8c8']]);

      FS('#2868a0'); bnd(.45);

      FS('#58c0d8'); ell(.5, .68, W * .32, H * .12);

      SS('rgba(200,240,250,.5)'); lw(1, .004); ellPS(W * .5, H * .68, W * .26, H * .09);

      FS('#f0e8d0'); ellP(W * .18, H * .6, W * .14, H * .035, .15); ellP(W * .82, H * .62, W * .12, H * .03, -.1);

      SS('rgba(240,250,255,.8)'); lw(1.5, .008); ellPS(W * .5, H * .68, W * .34, H * .13);

      SS('#6a5a40'); lw(1.5, .005, W);
      ([.15, .22]).forEach(px => {
        const pxx = W * px; plS([pxx, H * .58],[pxx + W * .01, H * .5, pxx + W * .015, H * .46]);

        SS('#3a7848'); lw(1.2, .004, W);
        ([-.7, -.3, .1, .5]).forEach(a => {
          plS([pxx + W * .015, H * .46],[pxx + W * .015 + W * a * .1, H * .44, pxx + W * .015 + W * a * .14, H * .47])
        });
        SS('#6a5a40'); lw(1.5, .005, W)
      });

      FS(K1); ell(.2,.15,W * .12,H * .016); ell(.75,.2,W * .14,H * .018)
    } else if (pr === 'potala') {

      sky([[0,'#80b8e0'],[.5,'#b8d0e0'],[1,'#688858']]);

      FS('#98a8b8'); poly([0,H * .5],[W * .15,H * .38],[W * .15,H * .38],[W * .3,H * .48],[W * .5,H * .36],[W * .5,H * .36],[W * .7,H * .46],[W * .9,H * .4],[W * .9,H * .4],[W,H * .48],[W,H * .55],[W,H * .55],[0,H * .55]);

      FS('#587048'); poly([W * .15,H * .75],[W * .5,H * .52,W * .85,H * .75],[W * .85,H],[W * .85,H],[W * .15,H]);

      const px = W * .5, pw = W * .3; FS('#f0ebe0');
      times(4, i => {
        const bw = pw * (1 - i * .12), by = H * (.62 - i * .07); rect(px - bw / 2, by, bw, H * .07);

        FS('rgba(80,60,50,.7)');
        ([-.35, -.18, 0, .18, .35]).forEach(wx => {
          rect(px + wx * bw / 2 - W * .003, by + H * .025, W * .006, H * .02)
        });
        FS('#f0ebe0')
      });

      FS('#a03828'); rect(px - pw * .22, H * .35, pw * .44, H * .1);

      FS('#d8a828'); poly([px - pw * .22,H * .35],[px,H * .28],[px,H * .28],[px + pw * .22,H * .35]);
      ([-.15, 0, .15]).forEach(tx => {
        rect(px + tx * pw, H * .3 - H * .01, W * .008, H * .02)
      });

      FS('#5a8848'); bnd(.75);

      SS('rgba(70,110,60,.5)'); lw(1, .005);
      ([.82, .9]).forEach(gy => {
        plS([0, H * gy],[W * .5, H * (gy - .02), W, H * gy])
      });

      FS(K1); ell(.2,.16,W * .12,H * .016); ell(.8,.22,W * .1,H * .014)
    } else if (pr === 'moher') {

      sky([[0,'#80a8c8'],[.55,'#98b8d0'],[1,'#38586a']]);

      FS('#3a6a80'); bnd(.55);

      SS('rgba(240,248,250,.6)'); lw(1, .004);
      ([.62, .7, .82]).forEach(wy => {
        plS([0, H * wy],[W * .2, H * (wy - .015), W * .45, H * wy])
      });

      const cx = W * .55; FS('#6a5848'); poly([cx,H * .5],[W * .62,H * .48],[W * .62,H * .48],[W,H * .5],[W,H],[W,H],[cx,H]);

      SS('rgba(90,75,60,.8)'); lw(1, .003);
      ([.55, .62, .7, .78, .86, .93]).forEach(ly => {
        plS([cx + W * .02, H * ly],[W, H * (ly - .01)])
      });

      SS('#4a3c30'); lw(1, .006); plS([cx, H * .5],[cx + W * .015, H * .58],[cx + W * .015, H * .58],[cx - W * .005, H * .66],[cx + W * .012, H * .74],[cx + W * .012, H * .74],[cx - W * .008, H * .82],[cx + W * .008, H * .9],[cx + W * .008, H * .9],[cx, H]);

      FS('#48884a'); poly([cx,H * .5],[W * .62,H * .48],[W * .62,H * .48],[W,H * .5],[W,H * .45],[W,H * .45],[W * .62,H * .43],[W,H * .45],[W * .62,H * .43],[cx,H * .46]);

      SS('#384048'); lw(1, .004);
      for (const [bx, by] of [[.25, .28], [.4, .22]]) {
        plS([W * bx - W * .015, H * by],[W * bx, H * by - H * .012, W * bx + W * .015, H * by])
      }

      FS('rgba(250,252,255,.75)'); ell(.2,.12,W * .12,H * .016); ell(.55,.08,W * .09,H * .013)
    } else if (pr === 'baobab') {

      sky([[0,'#e8a858'],[.45,'#d88858'],[1,'#7a5a48']]);

      FS('#f8d8a0'); dot(.5,.52,W * .05);

      FS('#98603a'); bnd(.55);

      FS('#b87848'); poly([W * .42,H * .55],[W * .58,H * .55],[W * .72,H],[W * .72,H],[W * .28,H]);

      const bb = [
        [.18, .55, .09],
        [.82, .55, .09],
        [.1, .55, .14],
      ];
      for (const [bx, by, bw] of bb) {
        const tw = W * bw, th = H * .3;

        FS('#7a5a40'); poly([W * bx - tw / 2,H],[W * bx - tw * .32,H * by - th * .4],[W * bx + tw * .32,H * by - th * .4],[W * bx + tw / 2,H]);

        SS('#7a5a40'); lnW(MX(2, tw * .08));
        ([-.7, -.35, 0, .35, .7]).forEach(a => {
          plS([W * bx, H * (by - th * .4)],[W * bx + SI(a) * tw * .8, H * (by - th * .4) - CO(a) * th * .35])
        });

        FS('#5a7848'); ell(bx, (by - th * .4) - th * .3, tw * .85, th * .18)
      }

      FS('rgba(60,40,30,.4)');
      for (const [bx, , bw] of bb) {
        const tw = W * bw; poly([W * bx - tw / 2,H],[W * bx - tw / 2 - tw * 1.2,H],[W * bx - tw * .32,H * .85])
      }

      SS('#503828'); lw(1, .004);
      for (const [bx, by] of [[.3, .2], [.68, .15]]) {
        plS([W * bx - W * .015, H * by],[W * bx, H * by - H * .012, W * bx + W * .015, H * by])
      }
    } else if (pr === 'moorea') {

      sky([[0,'#78b8e0'],[.5,'#98d0e0'],[1,'#48b0c8']]);

      FS('#e8f0f0'); rect(0, H * .55, W, H * .015);

      FS('#3a6a48'); poly([W * .15,H * .55],[W * .3,H * .3],[W * .3,H * .3],[W * .38,H * .42],[W * .45,H * .28],[W * .45,H * .28],[W * .55,H * .45],[W * .6,H * .55]);

      FS('#2c5638'); mv(W * .3, H * .3); mT(W * .3, H * .3); lT(W * .38, H * .42); lT(W * .33, H * .5); lT(W * .33, H * .5); lT(W * .28, H * .42); cP(); cP(); fL();

      FS('#58c8d8'); rect(0, H * .57, W, H * .2);

      SS('rgba(240,250,250,.5)'); lw(1, .003);
      ([.62, .68, .74]).forEach(wy => {
        plS([0, H * wy],[W * .5, H * (wy - .01), W, H * wy])
      });

      FS('#f0e8d0'); bnd(.78);

      SS('rgba(200,180,140,.6)'); lw(1, .004); plS([0, H * .82],[W * .5, H * .8, W, H * .83]);

      ([.78, .9]).forEach(px => {
        SS('#6a4a30'); lw(1, .006, W); plS([W * px, H],[W * (px + .02), H * .88, W * (px + .01), H * .8]); SS('#3a7848'); lw(1, .007, W); const tipX = W * (px + .01), tipY = H * .8;
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          plS([tipX, tipY],[tipX + SI(a) * W * .035, tipY - CO(a) * W * .02])
        })
      });

      FS(K1); ell(.25,.15,W * .12,H * .016); ell(.7,.1,W * .09,H * .013)
    } else if (pr === 'bure') {

      sky([[0,'#78b8e0'],[.5,'#a0d0e0'],[1,'#58b8c8']]);

      FS('#48a8c0'); rect(0, H * .6, W, H * .15);

      SS('rgba(240,250,250,.6)'); lw(1, .004); plS([0, H * .68],[W * .5, H * .66, W, H * .68]);

      FS('#f0e8d0'); bnd(.75);

      const bx = W * .3, by = H * .78, bs = W * .2;

      FS('#a08050'); rect(bx - bs * .4, by - bs * .35, bs * .8, bs * .35);

      SS('rgba(80,60,40,.6)'); lw(1, .002, W);
      span(0, 8, wx => {
        plS([bx - bs * .4 + wx * bs * .1, by - bs * .35],[bx - bs * .4 + wx * bs * .1, by])
      })

      FS('#8a6a40'); poly([bx - bs * .5,by - bs * .32],[bx,by - bs * .75],[bx + bs * .5,by - bs * .32]);

      SS('rgba(60,45,25,.5)'); lw(1, .0015, W);
      ([-.35, -.2, 0, .2, .35]).forEach(rx => {
        plS([bx + rx * bs, by - bs * .38],[bx + rx * bs * .7, by - bs * .65])
      });

      FS('#3a2c1c'); rect(bx - bs * .08, by - bs * .25, bs * .16, bs * .25);

      ([.72, .88]).forEach(px => {
        SS('#6a4a30'); lw(1, .006, W); plS([W * px, H * .95],[W * (px + .015), H * .85, W * px, H * .78]); SS('#3a7848'); lw(1, .007, W);
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          plS([W * px, H * .78],[W * px + SI(a) * W * .035, H * .78 - CO(a) * W * .022])
        })
      });

      FS(K1); ell(.2,.15,W * .12,H * .016); ell(.75,.2,W * .1,H * .014)
    } else if (pr === 'kokoda') {

      sky([[0,'#8aa8b8'],[.4,'#6a8858'],[1,'#3a5838']]);

      FS('rgba(230,238,240,.45)'); rect(0, H * .3, W, H * .1); rect(0, H * .48, W, H * .06);

      FS('#2c5030'); poly([0,H * .6],[W * .2,H * .42],[W * .2,H * .42],[W * .45,H * .55],[W * .7,H * .4],[W * .7,H * .4],[W,H * .52],[W,H],[W,H],[0,H]); FS('#1f3a24'); poly([0,H * .72],[W * .3,H * .55],[W * .3,H * .55],[W * .6,H * .68],[W,H * .58],[W,H * .58],[W,H],[W,H * .58],[W,H],[0,H]);

      SS('#b09870'); lw(1, .008); plS([W * .05, H * .95],[W * .3, H * .78, W * .5, H * .72],[W * .7, H * .65, W * .85, H * .6]);

      FS('#3a6838');
      for (const [cx2, cy2, cr] of [[.15, .5, .07], [.4, .44, .06], [.62, .5, .08], [.85, .46, .06]]) {
        dot(cx2, cy2, W * cr)
      }

      SS(K0); lw(1, .004, W);
      for (const [cx2, cy2] of [[.15, .5], [.4, .44], [.62, .5], [.85, .46]]) {
        plS([W * cx2, H * cy2 + H * .02],[W * cx2, H * (cy2 + .1)])
      }

      const rng7 = mulberry32(777); FS('rgba(255,250,230,.5)');
      times(8, i => {
        const lx = rng7() * W, ly = H * (.35 + rng7() * .3); dotP(lx, ly, W * .004)
      })
    } else if (pr === 'haamonga') {

      sky([[0,'#80b8d8'],[.5,'#a0c8d8'],[1,'#5a8858']]);

      FS('#4a90b0'); rect(0, H * .48, W, H * .08);

      FS('#6a9848'); bnd(.56);

      SS('rgba(80,120,60,.5)'); lw(1, .005);
      ([.68, .82]).forEach(gy => {
        plS([0, H * gy],[W * .5, H * (gy - .015), W, H * gy])
      });

      const gx = W * .5, gw = W * .18, gh = H * .3;

      FS('#7a6a58'); poly([gx - gw * .45,H * .78],[gx - gw * .48,H * .78 - gh],[gx - gw * .3,H * .78 - gh],[gx - gw * .32,H * .78]);

      poly([gx + gw * .32,H * .78],[gx + gw * .3,H * .78 - gh],[gx + gw * .48,H * .78 - gh],[gx + gw * .45,H * .78]);

      FS('#8a7a68'); rect(gx - gw * .52, H * .78 - gh - H * .025, gw * 1.04, H * .05);

      SS('rgba(60,50,40,.5)'); lw(1, .002, W);
      for (const [cx2, cy2] of [[-.4, -.6], [.38, -.5], [-.35, -.3], [.42, -.25]]) {
        plS([gx + cx2 * gw, H * (.78 + cy2 * gh / gh * .2)],[gx + cx2 * gw + W * .01, H * (.78 + cy2 * gh / gh * .25)])
      }

      ([.15, .85]).forEach(px => {
        SS('#6a4a30'); lw(1, .005, W); plS([W * px, H * .8],[W * (px + .015), H * .7, W * px, H * .62]); SS('#3a7848'); lw(1, .006, W);
        ([-.8, -.4, 0, .4, .8]).forEach(a => {
          plS([W * px, H * .62],[W * px + SI(a) * W * .03, H * .62 - CO(a) * W * .018])
        })
      });

      FS('rgba(250,252,255,.75)'); ell(.2,.14,W * .12,H * .016); ell(.7,.1,W * .1,H * .014)
    } else if (pr === 'yasur') {

      sky([[0,'#584048'],[.4,'#6a4a48'],[1,'#3a2c28']]);

      FS('#3a3030'); bnd(.6);

      const vx = W * .5, vy = H * .62, vw = W * .55; FS('#4a3838'); poly([vx - vw / 2,H * .85],[vx - vw * .18,vy],[vx + vw * .18,vy],[vx + vw / 2,H * .85]);

      FS(rg(vx, vy, 0, vx, vy, W * .12,[0, 'rgba(255,120,40,.9)',.5, 'rgba(220,60,30,.5)',1, 'rgba(220,60,30,0)'])); dotP(vx, vy, W * .12);

      FS('#2a2020'); ellP(vx, vy, W * .09, H * .018);

      FS('#ff8830');
      for (const [bx, by2, br] of [[-.15, -.18, .008], [-.05, -.28, .01], [.08, -.22, .007], [.18, -.14, .009]]) {
        dotP(vx + bx * W, vy + by2 * H, W * br)
      }

      SS('rgba(255,140,60,.5)'); lw(1, .002, W);
      for (const [bx, by2] of [[-.15, -.18], [-.05, -.28], [.08, -.22], [.18, -.14]]) {
        plS([vx + bx * W * .6, vy + by2 * H * .4],[vx + bx * W, vy + by2 * H])
      }

      FS('rgba(60,45,45,.7)');
      for (const [sx2, sy2, sr] of [[-.02, -.12, .06], [-.04, -.22, .08], [0, -.32, .1]]) {
        ellP(vx + sx2 * W, vy + sy2 * H, W * sr, H * sr * .4)
      }

      const rng8 = mulberry32(888); FS('rgba(180,160,150,.4)');
      times(12, i => {
        const ax = rng8() * W, ay = H * (.3 + rng8() * .5); dotP(ax, ay, W * .003)
      })
    } else if (pr === 'douro') {

      sky([[0,'#88b8d8'],[.45,'#a8c8d8'],[1,'#4a7a58']]);

      FS('#6a8a70'); poly([0,H * .42],[W * .3,H * .3],[W * .3,H * .3],[W * .6,H * .4],[W * .3,H * .3],[W * .6,H * .4],[W,H * .32],[W,H * .6],[W,H * .6],[0,H * .6]);

      times(6, i => {
        const ty = .45 + i * .05; FS(i % 2 ? '#5a8a58' : '#6a9a60'); poly([0,H * ty],[W * .3,H * (ty - .02),W * .55,H * ty],[W * .8,H * (ty + .02),W,H * ty],[W,H * (ty + .05)],[W * .8,H * (ty + .07),W * .55,H * (ty + .05)],[W * .3,H * (ty + .03),0,H * (ty + .05)]);

        SS('rgba(60,80,50,.5)'); lw(1, .004); plS([0, H * ty],[W * .3, H * (ty - .02), W * .55, H * ty],[W * .8, H * (ty + .02), W, H * ty])
      });

      FS('#4a88a8'); poly([W * .3,H * .75],[W * .5,H * .7,W * .65,H * .78],[W * .8,H * .85,W * .75,H],[W * .55,H],[W * .6,H * .88,W * .45,H * .82],[W * .3,H * .76,W * .1,H * .78],[0,H * .82],[0,H * .82],[0,H * .78]);

      SS('rgba(220,240,250,.5)'); lw(1, .003, W); plS([W * .35, H * .78],[W * .55, H * .75, W * .7, H * .82]);

      FS('#3a2c20'); poly([W * .58,H * .78],[W * .62,H * .78],[W * .61,H * .775],[W * .59,H * .775]);

      FS('#f0e8e0'); rect(W * .15, H * .5, W * .04, H * .02); FS('#c06838'); mv(W * .15, H * .5); mT(W * .15, H * .5); lT(W * .17, H * .485); mT(W * .15, H * .5); lT(W * .17, H * .485); lT(W * .19, H * .5); cP(); cP(); fL(); FS('#f0e8e0'); rect(W * .21, H * .52, W * .035, H * .018); FS('#c06838'); mv(W * .21, H * .52); mT(W * .21, H * .52); lT(W * .2275, H * .505); mT(W * .21, H * .52); lT(W * .2275, H * .505); lT(W * .245, H * .52); cP();
      cP(); fL();

      FS('rgba(250,252,255,.75)'); ell(.3,.12,W * .12,H * .016); ell(.75,.08,W * .1,H * .014)
    } else if (pr === 'ararat') {

      sky([[0,'#8a90b8'],[.45,'#b8c0d0'],[1,'#7a8a60']]);

      const ax = W * .55; FS('#9aa0b0'); poly([ax - W * .35,H * .62],[ax - W * .12,H * .22],[ax - W * .02,H * .18],[ax + W * .12,H * .28],[ax + W * .3,H * .62]);

      FS('#f0f4f8'); poly([ax - W * .16,H * .3],[ax - W * .12,H * .22],[ax - W * .02,H * .18],[ax + W * .08,H * .25],[ax + W * .12,H * .32],[ax,H * .28]);

      FS('#7a8a58'); bnd(.62);

      FS('#c08848'); rect(0, H * .72, W * .4, H * .08); FS('#a06838'); rect(0, H * .76, W * .4, H * .04);

      FS('#4a7048');
      ([.08, .2, .32]).forEach(tx => {
        dot(tx,.7,W * .015)
      });

      const mx = W * .18; FS('#6a5a50'); poly([mx - W * .05,H * .78],[mx - W * .05,H * .7],[mx,H * .66],[mx + W * .05,H * .7],[mx + W * .05,H * .78]);

      FS('#5a4a40'); poly([mx - W * .015,H * .7],[mx - W * .02,H * .64],[mx,H * .6],[mx + W * .02,H * .64],[mx + W * .015,H * .7]);

      SS('#d0c0a0'); lw(1, .002, W); mv(mx, H * .58); mT(mx, H * .58); lT(mx, H * .56); mT(mx - W * .004, H * .575); mT(mx - W * .004, H * .575); lT(mx + W * .004, H * .575); sK();

      SS('#4a4a55'); lw(1, .002, W);
      ([.35, .45]).forEach(bx => {
        bP(); aR(W * bx, H * .18 + bx * H * .05, W * .008, 3.6, 5.8); sK()
      })
    } else if (pr === 'khinalug') {

      sky([[0,'#7a88a8'],[.5,'#a8b0c0'],[1,'#5a6a58']]);

      FS('#8a90a0'); poly([0,H * .45],[W * .15,H * .3],[W * .15,H * .3],[W * .3,H * .42],[W * .15,H * .3],[W * .3,H * .42],[W * .48,H * .28],[W * .65,H * .4],[W * .65,H * .4],[W * .82,H * .32],[W * .65,H * .4],[W * .82,H * .32],[W,H * .42],[W,H * .6],[W,H * .6],[0,H * .6]);

      FS('#e8ecf0');
      for (const [px, py] of [[.3, .42], [.48, .28], [.82, .32]]) {
        poly([W * px - W * .015,H * py + H * .02],[W * px,H * py],[W * px + W * .015,H * py + H * .02])
      }

      FS('#6a7858'); poly([0,H],[W * .3,H * .55,W * .6,H * .58],[W * .85,H * .62,W,H * .72],[W,H]);

      const houses = [[.12, .72], [.22, .68], [.32, .64], [.42, .61], [.52, .59], [.62, .6], [.72, .63], [.82, .67]];
      for (const [hx2, hy2] of houses) {
        const hw = W * .06, hh = H * .035; FS('#8a7a68'); rect(W * hx2 - hw / 2, H * hy2 - hh, hw, hh); FS('#6a5a50'); poly([W * hx2 - hw / 2,H * hy2 - hh],[W * hx2,H * hy2 - hh - H * .012],[W * hx2 + hw / 2,H * hy2 - hh]);

        FS('#3a3230'); rect(W * hx2 - hw * .15, H * hy2 - hh * .6, hw * .3, hh * .3)
      }

      FS('#9a8a78'); rect(W * .47, H * .5, W * .012, H * .12); FS('#6a5a50'); mv(W * .45, H * .5); mT(W * .45, H * .5); lT(W * .476, H * .47); mT(W * .45, H * .5); lT(W * .476, H * .47); lT(W * .502, H * .5); cP(); cP(); fL();

      FS('#e8e4dc');
      for (const [sx2, sy2] of [[.15, .8], [.35, .84], [.55, .82], [.75, .86]]) {
        dot(sx2,sy2,W * .004)
      }

      FS('rgba(250,252,255,.6)'); ell(.25,.1,W * .14,H * .016); ell(.7,.14,W * .12,H * .014)
    } else if (pr === 'hegra') {

      sky([[0,'#d8a868'],[.5,'#c89058'],[1,'#a06838']]);

      FS('#c09858'); bnd(.72);

      FS('#a87848'); poly([0,H * .55],[W * .18,H * .35],[W * .18,H * .35],[W * .3,H * .5],[W * .18,H * .35],[W * .3,H * .5],[W * .45,H * .4],[W * .6,H * .55],[W * .6,H * .55],[W,H * .5],[W * .6,H * .55],[W,H * .5],[W,H * .72],[W * .6,H * .55],[W,H * .5],[W,H * .72],[0,H * .72]);

      const hx2 = W * .5; FS('#b08858'); poly([hx2 - W * .2,H * .72],[hx2 - W * .18,H * .38],[hx2 - W * .08,H * .3],[hx2 + W * .12,H * .34],[hx2 + W * .2,H * .45],[hx2 + W * .2,H * .72]);

      SS('rgba(140,100,60,.6)'); lw(1, .004);
      ([.45, .55, .65]).forEach(ly => {
        plS([hx2 - W * .19, H * ly],[hx2 + W * .19, H * (ly + .01)])
      });

      const fx = hx2, fw = W * .14, fy = H * .7, fh = H * .22;

      FS('#8a6840'); rect(fx - fw / 2, fy - fh, fw, H * .015); rect(fx - fw / 2 + W * .008, fy - fh + H * .015, fw - W * .016, H * .012);

      FS('#3a2c20'); poly([fx - fw * .25,fy],[fx - fw * .25,fy - fh * .55],[fx - fw * .2,fy - fh * .62],[fx + fw * .2,fy - fh * .62],[fx + fw * .25,fy - fh * .55],[fx + fw * .25,fy]);

      FS('#6a5030'); rect(fx - fw * .2, fy - fh * .5, fw * .4, fh * .5);

      FS('#8a6840');
      ([-.3, -.1, .1, .3]).forEach(px2 => {
        rect(fx + px2 * fw, fy - fh * .52, fw * .06, fh * .52)
      });

      FS('#8a6840'); poly([fx - fw * .3,fy - fh],[fx,fy - fh - H * .03],[fx + fw * .3,fy - fh]);

      FS('#6a5030');
      ([.12, .2]).forEach(cx3 => {
        bP(); eC(W * cx3, H * .78, W * .015, H * .012, 0, 0, 7); eC(W * cx3, H * .78, W * .015, H * .012, 0, 0, 7); fL(); SS('#6a5030'); lw(1, .003, W); plS([W * cx3 + W * .012, H * .77],[W * cx3 + W * .018, H * .74])
      });

      SS('rgba(255,220,160,.25)'); lnW(W * .02); plS([W * .1, 0],[W * .5, H])
    } else if (pr === 'sidi') {

      sky([[0,'#88b8e0'],[.5,'#a8d0e8'],[1,'#5a88a8']]);

      FS('#2868a0'); bnd(.72);

      SS('rgba(220,240,255,.5)'); lw(1, .003);
      ([.78, .86]).forEach(wy => {
        plS([0, H * wy],[W * .5, H * (wy - .01), W, H * wy])
      });

      FS('#e8e0d0'); poly([0,H * .72],[W * .4,H * .5,W * .75,H * .55],[W * .9,H * .58,W,H * .65],[W,H * .72]);

      const wh = [[.1, .6], [.22, .56], [.34, .53], [.46, .55], [.58, .57], [.68, .6]];
      for (const [hx3, hy3] of wh) {
        const hw = W * .08, hh = H * .06; FS('#f0f0e8'); rect(W * hx3 - hw / 2, H * hy3 - hh, hw, hh);

        FS('#2878c8'); rect(W * hx3 - hw * .15, H * hy3 - hh * .5, hw * .3, hh * .4)
      }

      const dx2 = W * .3; FS('#2878c8'); bP(); aR(dx2, H * .5, W * .03, PI, 0); fL(); FS('#f0f0e8'); rect(dx2 - W * .03, H * .5, W * .06, H * .04);

      FS('#f0f0e8'); rect(dx2 + W * .05, H * .44, W * .012, H * .1); FS('#2878c8'); poly([dx2 + W * .045,H * .44],[dx2 + W * .056,H * .41],[dx2 + W * .067,H * .44]);

      FS('#d84858');
      for (const [fx3, fy3] of [[.15, .68], [.4, .64], [.65, .7]]) {
        times(5, i => {
          dot((fx3 + i * .02), (fy3 + (i % 2) * .015), W * .004)
        })
      }

      FS('rgba(250,252,255,.7)'); ell(.2,.1,W * .14,H * .018); ell(.75,.08,W * .12,H * .015)
    } else if (pr === 'brandberg') {

      sky([[0,'#c88858'],[.5,'#d8a068'],[1,'#a07038']]);

      FS('#b08858'); bnd(.68);

      const rng9 = mulberry32(999); FS('rgba(80,60,40,.4)');
      times(40, i => {
        const gx2 = rng9() * W, gy2 = H * (.7 + rng9() * .25); dotP(gx2, gy2, W * (.002 + rng9() * .003))
      });

      const bx4 = W * .5; FS('#987858'); poly([bx4 - W * .35,H * .68],[bx4 - W * .3,H * .35,bx4,H * .3],[bx4 + W * .3,H * .35,bx4 + W * .35,H * .68]);

      SS('rgba(120,90,60,.5)'); lw(1, .004);
      ([.4, .5, .6]).forEach(ly => {
        plS([bx4 - W * .32, H * ly],[bx4, H * (ly - .03), bx4 + W * .32, H * ly])
      });

      SS('rgba(140,110,80,.4)');
      ([-.12, .08]).forEach(sx3 => {
        plS([bx4 + sx3 * W, H * .32],[bx4 + sx3 * W * 1.2, H * .5, bx4 + sx3 * W * 1.05, H * .66])
      });

      SS(K0); lw(1, .004, W);
      for (const [qx, qs] of [[.15, 1], [.3, .8], [.82, .9]]) {
        const qy = H * .8, qh = H * .12 * qs; plS([W * qx, qy],[W * qx, qy - qh * .6]);

        ([-.5, -.2, .2, .5]).forEach(ba => {
          plS([W * qx, qy - qh * .6],[W * qx + SI(ba) * W * .02, qy - qh])
        });

        FS('#3a5a38'); bP(); aR(W * qx, qy - qh, W * .006, 0, 7); aR(W * qx, qy - qh, W * .006, 0, 7); fL()
      }

      FS('rgba(255,240,200,.8)'); dot(.8,.18,W * .05);

      FS('#c84838');
      for (const [rx3, ry3] of [[.48, .55], [.5, .52], [.52, .57], [.47, .58]]) {
        dot(rx3,ry3,W * .003)
      }
    } else if (pr === 'luang') {

      sky([[0,'#78a8c8'],[.5,'#a8c8d8'],[1,'#5a8858']]);

      FS('#6a9858'); poly([0,H * .6],[W * .25,H * .5,W * .5,H * .57],[W * .75,H * .48,W,H * .58],[W,H * .68],[W,H * .68],[0,H * .68]);

      FS('#5a8898'); bnd(.7);

      SS('rgba(220,240,240,.4)'); lw(1, .003);
      ([.75, .82, .9]).forEach(wy => {
        plS([0, H * wy],[W * .5, H * (wy - .012), W, H * wy])
      });

      FS('#4a7848'); rect(0, H * .68, W, H * .04);

      const tx = W * .4;

      const roofs = [[.35, .3, .05], [.45, .42, .03], [.55, .55, .02]];
      for (const [ry, rw, hh] of roofs) {
        FS('#8a5030'); poly([tx - W * rw / 2,H * (ry + hh)],[tx,H * ry,tx + W * rw / 2,H * (ry + hh)]);

        SS('#8a5030'); lw(1, .004, W); plS([tx - W * rw / 2, H * (ry + hh)],[tx - W * rw / 2 - W * .015, H * (ry + hh - .015)]); plS([tx + W * rw / 2, H * (ry + hh)],[tx + W * rw / 2 + W * .015, H * (ry + hh - .015)])
      }

      FS('#e8e0d0'); rect(tx - W * .08, H * .52, W * .16, H * .16);

      FS('#d8a838'); poly([tx - W * .008,H * .3],[tx,H * .22],[tx + W * .008,H * .3]);

      FS('#d8a838'); rect(tx - W * .01, H * .58, W * .02, H * .1);

      SS('#6a5030'); lw(1, .005, W);
      ([.62, .85]).forEach(px => {
        plS([W * px, H * .68],[W * px + W * .01, H * .55, W * px + W * .015, H * .5]);

        SS('#4a8838');
        ([-.9, -.5, 0, .5, .9]).forEach(pa => {
          plS([W * px + W * .015, H * .5],[W * px + W * .015 + SI(pa) * W * .05, H * (.5 - CO(pa) * .06), W * px + W * .015 + SI(pa) * W * .07, H * (.52 - CO(pa) * .04)])
        });
        SS('#6a5030')
      });

      FS('#5a4030'); poly([W * .6,H * .82],[W * .65,H * .86,W * .7,H * .82],[W * .68,H * .83],[W * .62,H * .83]);

      FS('rgba(240,248,250,.7)'); ell(.2,.12,W * .13,H * .018); ell(.7,.15,W * .1,H * .014)
    } else if (pr === 'carpathians') {

      sky([[0,'#6a88a8'],[.45,'#98b0c0'],[1,'#4a6a58']]);

      const layers = [
        ['#4a6878', .38, .1], ['#3a5a48', .5, .18], ['#2a4a38', .62, .26]];
      for (const [col, ly, jag] of layers) {
        FS(col); mv(0, H * ly);
        span(0, 10, i => {
          const px = i * W / 10; lT(px, H * (ly - jag * (i % 2 ? .5 + .5 * SI(i * 2.3) : .3)))
        })
        lT(W, H); lT(W, H); lT(0, H); cP(); cP(); fL()
      }

      FS('#d8d0c0'); rect(W * .62, H * .3, W * .1, H * .12); FS('#a84838');
      times(3, i => {
        const tx2 = W * (.63 + i * .04); poly([tx2 - W * .012,H * .3],[tx2,H * .25],[tx2 + W * .012,H * .3]); FS('#d8d0c0'); rect(tx2 - W * .008, H * .3, W * .016, H * .04); FS('#a84838')
      });

      FS('rgba(220,230,235,.35)');
      times(3, i => {
        ellP(W * (.2 + i * .3) + SI(t * .3 + i) * W * .03,H * (.55 + i * .08),W * .2,H * .03,0)
      });

      ([.08, .9]).forEach(tx2 => {
        FS('#1a3a2a'); poly([W * tx2,H * .35],[W * (tx2 - .05),H * .7],[W * (tx2 + .05),H * .7]); poly([W * tx2,H * .45],[W * (tx2 - .04),H * .75],[W * (tx2 + .04),H * .75]); FS('#3a2a1a'); rect(W * (tx2 - .008), H * .75, W * .016, H * .05)
      });

      FS('#2a4a38'); bnd(.78);

      FS('#2a1f15'); ell(.35,.82,W * .03,H * .018); ell(.375,.805,W * .012,H * .012)
    } else if (pr === 'puszta') {

      sky([[0,'#e8d8a8'],[.5,'#d8c890'],[1,'#b0a068']]);

      FS('#f0e0b0'); dot(.75,.18,H * .11); FS('#e8d098'); dot(.75,.18,H * .08);

      FS('#b8a868'); bnd(.52); FS('#c8b878'); poly([0,H * .52],[W * .3,H * .5,W * .55,H * .52],[W * .8,H * .54,W,H * .52],[W,H * .56],[W,H * .56],[0,H * .56]);

      const wx = W * .7, wy = H * .52; SS('#6a4c34'); lnW(4);

      mv(wx - W * .03, wy + H * .15); mT(wx - W * .03, wy + H * .15); lT(wx, wy - H * .05); lT(wx + W * .03, wy + H * .15); sK();

      lnW(3); mv(wx, wy - H * .05); mT(wx, wy - H * .05); lT(wx - W * .12, wy + H * .01); mT(wx, wy - H * .05); mT(wx, wy - H * .05); lT(wx + W * .09, wy - H * .1); sK();

      FS('#8a6848'); dotP(wx + W * .09, wy - H * .1, H * .015); lnW(1.5); plS([wx - W * .12, wy + H * .01],[wx - W * .12, wy + H * .07]); FS('#5a4838'); rect(wx - W * .135, wy + H * .07, W * .03, H * .04);

      FS('#e8e0c8'); const rng = mulberry32(1337);
      times(8, i => {
        const sx = rng() * W, sy = H * (.58 + rng() * .12); ellP(sx, sy, W * .015, H * .012)
      });

      FS('#584838'); const hx2 = W * .3 + S(.5) * W * .01; bP(); bP(); eC(hx2, H * .6, W * .03, H * .015, 0, 0, 7); ellP(hx2, H * .6, W * .03, H * .015); bP(); bP(); eC(hx2 + W * .03, H * .585, W * .012, H * .01, -.4, 0, 7); ellP(hx2 + W * .03, H * .585, W * .012, H * .01, -.4);

      SS('#989058'); lnW(1.2);
      times(15, i => {
        const gx = rng() * W, gy = H * (.8 + rng() * .18); const sw = SI(t * 1.5 + i) * W * .008; mv(gx, gy); mT(gx, gy); qT(gx + sw, gy - H * .04, gx + sw * 1.5, gy - H * .07); sK()
      })
    } else if (pr === 'tatras') {
      const rng = mulberry32(934);

      sky([[0,'#b0d0e8'],[.5,'#d8e8f0'],[1,'#7a9878']]);

      FS('#8898a8'); poly([0,H * .5],[W * .1,H * .3],[W * .1,H * .3],[W * .16,H * .42],[W * .1,H * .3],[W * .16,H * .42],[W * .24,H * .22],[W * .33,H * .45],[W * .33,H * .45],[W * .44,H * .2],[W * .33,H * .45],[W * .44,H * .2],[W * .55,H * .44],[W * .66,H * .26],[W * .66,H * .26],[W * .76,H * .46],[W * .66,H * .26],[W * .76,H * .46],[W * .85,H * .32],[W,H * .48],[W,H * .62],[W,H * .62],[0,H * .62]);

      SS('rgba(90,105,125,.6)'); lnW(2);
      times(5, i => {
        plS([W * (.12 + i * .15), H * .32],[W * (.1 + i * .15), H * .55])
      });

      FS('#f0f4f8');
      ([.24, .44, .66]).forEach(px => {
        mv(W * (px - .02), H * .3); mT(W * (px - .02), H * .3); lT(W * px, H * .22); lT(W * (px + .02), H * .3); lT(W * (px + .02), H * .3); lT(W * px, H * .35); cP(); cP(); fL()
      });

      FS('#58a8c8'); ell(.5, .68, W * .22, H * .05); FS('rgba(240,250,255,.5)'); ellP(W * .45, H * .67, W * .08, H * .015, -.2);

      FS('#8a6848'); rect(W * .72, H * .66, W * .1, H * .07); FS('#5a4030'); mv(W * .71, H * .66); mT(W * .71, H * .66); lT(W * .77, H * .61); mT(W * .71, H * .66); lT(W * .77, H * .61); lT(W * .83, H * .66); cP(); cP(); fL(); FS('#6a5a50'); rect(W * .79, H * .62, W * .012, H * .04);

      FS('rgba(230,230,230,.5)'); ell(.795 + S(2) * W * .01, .59, W * .012, H * .015);

      FS('#6a9858'); bnd(.73); scat(934, 12, (rng, i) => {
        const fx = rng() * W, fy = H * (.78 + rng() * .18); FS('#f0f0d8');
        times(5, p2 => {
          const pa = p2 * PI * 2 / 5; ellP(fx + CO(pa) * H * .008,fy + SI(pa) * H * .008,H * .006,H * .003,pa)
        });
        FS('#e8c848'); dotP(fx, fy, H * .003)
      })
    } else if (pr === 'caucasus') {

      sky([[0,'#c8d8f0'],[.5,'#e8ecf4'],[1,'#8a9a80']]);

      FS('#9ab0d0'); poly([0,H * .55],[W * .18,H * .18],[W * .3,H * .5],[W * .45,H * .22],[W * .6,H * .52],[W * .75,H * .28],[W * .9,H * .55],[W,H * .45],[W,H * .7],[W,H * .7],[0,H * .7]);

      FS('#f0f4fa'); mv(W * .12, H * .34); mT(W * .12, H * .34); lT(W * .18, H * .18); mT(W * .12, H * .34); lT(W * .18, H * .18); lT(W * .24, H * .36); lT(W * .18, H * .42); lT(W * .18, H * .42); cP(); lT(W * .18, H * .42); cP(); fL(); mv(W * .38, H * .38); mT(W * .38, H * .38); lT(W * .45, H * .22); mT(W * .38, H * .38); lT(W * .45, H * .22); lT(W * .52, H * .4); lT(W * .45, H * .46); lT(W * .45, H * .46); cP(); lT(W * .45, H * .46); cP();
      fL(); mv(W * .7, H * .42); mT(W * .7, H * .42); lT(W * .75, H * .28); mT(W * .7, H * .42); lT(W * .75, H * .28); lT(W * .8, H * .44); lT(W * .75, H * .5); lT(W * .75, H * .5); cP(); lT(W * .75, H * .5); cP(); fL();

      FS('#8a6848'); rect(W * .34, H * .52, W * .05, H * .1); mv(W * .335, H * .52); mT(W * .335, H * .52); lT(W * .365, H * .46); mT(W * .335, H * .52); lT(W * .365, H * .46); lT(W * .395, H * .52); cP(); cP(); fL();

      rect(W * .4, H * .5, W * .015, H * .12); mv(W * .397, H * .5); mT(W * .397, H * .5); lT(W * .4075, H * .44); mT(W * .397, H * .5); lT(W * .4075, H * .44); lT(W * .418, H * .5); cP(); cP(); fL();

      FS('#78a068'); poly([0,H * .68],[W * .25,H * .62,W * .5,H * .68],[W * .75,H * .72,W,H * .66],[W,H],[W,H],[0,H]);

      SS('#98c8e8'); lnW(H * .018); plS([W * .5, H * .7],[W * .42, H * .8, W * .55, H * .88],[W * .6, H * .94, W * .48, H]);

      SS('rgba(60,50,40,.8)'); lnW(2); const eagleA = t * .5; const ex = W * (.6 + CO(eagleA) * .12); const ey = H * (.3 + SI(eagleA) * .06); mv(ex - 8, ey); mT(ex - 8, ey); qT(ex - 3, ey - 5, ex, ey); qT(ex + 3, ey - 5, ex + 8, ey); sK()
    } else if (pr === 'izba') {
      const rng = mulberry32(832);

      sky([[0,'#a8c8e8'],[.5,'#d8e8f0'],[1,'#b0c8a0']]);

      FS('#6888a8'); rect(W * .7, H * .35, W * .08, H * .25); FS('#e8b838'); ell(.74,.33,W * .035,H * .045); ell(.68,.4,W * .02,H * .028); ell(.8,.4,W * .02,H * .028);

      times(4, i => {
        const bx = W * (.08 + i * .22); FS('#e8e8e0'); rect(bx - W * .008, H * .15, W * .016, H * .5); SS('#383830'); lnW(1.2);
        times(5, k => {
          plS([bx - W * .008, H * (.2 + k * .08)],[bx + W * .006, H * (.2 + k * .08)])
        });
        FS('rgba(140,170,90,.7)'); ellP(bx + SI(t * 1.5 + i) * W * .005, H * .16, W * .05, H * .06)
      });

      const ix = W * .28, iy = H * .55; FS('#8a6848'); rect(ix, iy, W * .22, H * .2);

      SS('#6a4c34'); lnW(2);
      times(6, k => {
        plS([ix, iy + H * .033 * (k + 1)],[ix + W * .22, iy + H * .033 * (k + 1)])
      });

      FS('#5a4030'); poly([ix - W * .02,iy],[ix + W * .11,iy - H * .1],[ix + W * .24,iy]);

      FS('#f0e8c8'); rect(ix + W * .07, iy + H * .06, W * .08, H * .08); SS('#d8b888'); lnW(2); sR(ix + W * .07, iy + H * .06, W * .08, H * .08); mv(ix + W * .11, iy + H * .06); mT(ix + W * .11, iy + H * .06); lT(ix + W * .11, iy + H * .14); mT(ix + W * .07, iy + H * .1); mT(ix + W * .07, iy + H * .1); lT(ix + W * .15, iy + H * .1); sK();

      FS('#4a3830'); rect(ix + W * .17, iy - H * .08, W * .02, H * .08); FS('rgba(230,230,230,.5)');
      times(3, k => {
        ellP(ix + W * .18 + SI(t * 2 + k) * W * .015,iy - H * (.1 + k * .05),W * (.018 + k * .008),H * (.02 + k * .01),0)
      });

      FS('#6a9858'); bnd(.72); scat(832, 10, (rng, i) => {
        FS(['#d84838', '#e8c838', '#f0f0e8'][i % 3]); dotP(rng() * W, H * (.78 + rng() * .18), H * .008)
      })
    } else if (pr === 'haveli') {

      sky([[0,'#f0d0a8'],[.5,'#d0a068'],[1,'#705038']]);

      FS('#c89858'); rect(W * .15, H * .25, W * .7, H * .5);

      FS('#a87840');
      times(8, i => {
        bP(); aR(W * (.19 + i * .09), H * .3, W * .03, PI, 0); fL()
      });
      rect(W * .15, H * .3, W * .7, H * .015);

      times(3, i => {
        const jx = W * (.28 + i * .22), jy = H * .48; FS('#b88848'); rect(jx - W * .05, jy - H * .12, W * .1, H * .12);

        SS('#785030'); lnW(1.5);
        times(4, g => {
          plS([jx - W * .04 + g * W * .025, jy - H * .1],[jx - W * .04 + g * W * .025, jy - H * .02])
        });
        mv(jx - W * .05, jy - H * .07); mT(jx - W * .05, jy - H * .07); lT(jx + W * .05, jy - H * .07); mT(jx - W * .05, jy - H * .04); mT(jx - W * .05, jy - H * .04); lT(jx + W * .05, jy - H * .04); sK();

        FS('#986838'); poly([jx - W * .06,jy - H * .12],[jx,jy - H * .16],[jx + W * .06,jy - H * .12])
      });

      FS('#483020'); poly([W * .44,H * .75],[W * .44,H * .6],[W * .5,H * .55,W * .56,H * .6],[W * .56,H * .75]);

      FS('#8a6840'); bnd(.75); FS('#4a6a70'); ell(.5,.85,W * .1,H * .03);

      SS('rgba(80,60,40,.6)'); lnW(1); mv(W * .05, H * .4); mT(W * .05, H * .4); qT(W * .12, H * .43, W * .15, H * .38); mT(W * .85, H * .38); mT(W * .85, H * .38); qT(W * .9, H * .42, W * .95, H * .39); sK(); const clothCols = ['#d04838', '#e8c838', '#3868a8', '#48a868'];
      times(4, i => {
        FS(clothCols[i]); rect(W * (.06 + i * .024), H * .395 + SI(t + i) * H * .003, W * .02, H * .045)
      });

      SS('rgba(70,50,35,.7)'); lnW(1.3);
      times(3, i => {
        const bx = W * (.3 + i * .25 + SI(t * .4 + i) * .02); const by = H * (.12 + (i % 2) * .06); mv(bx - 5, by); mT(bx - 5, by); qT(bx, by - 4, bx + 5, by); sK()
      })
    } else if (pr === 'rann') {
      const rng = mulberry32(731);

      sky([[0,'#182038'],[.5,'#3a4560'],[1,'#8890a8']]);

      FS('#e8e8f0'); dot(.7,.22,H * .09); FS('#c8ccd8'); dot(.67,.2,H * .02); dot(.73,.25,H * .015);

      FS('#e8e8f0'); scat(731, 30, (rng, i) => {
        gA(.4 + .6 * rng()); rect(rng() * W, rng() * H * .4, 1.5, 1.5)
      });
      gA(1);

      FS('#2a3048'); poly([0,H * .48],[W * .15,H * .42,W * .3,H * .48],[W * .5,H * .44,W * .65,H * .48],[W,H * .48],[W,H * .48],[W,H * .6],[W,H * .48],[W,H * .6],[0,H * .6]);

      FS(lg(0, H * .5, 0, H,[0, '#d0d4e0',1, '#9098b0'])); bnd(.5);

      FS('rgba(240,240,250,.35)'); poly([W * .62,H],[W * .67,H * .5],[W * .73,H * .5],[W * .78,H]);

      SS('rgba(90,100,130,.5)'); lnW(1);
      times(12, i => {
        const sx = rng() * W, sy = H * (.55 + rng() * .4); mv(sx, sy);
        times(3, j2 => {
          lT(sx + (rng() - .3) * W * .06, sy + rng() * H * .05)
        });
        sK()
      });

      const mx = (t * .3 % 2) * W; SS('rgba(240,240,250,.8)'); lnW(1.5); plS([mx, H * .15],[mx - W * .06, H * .19])
    } else if (pr === 'ghats') {
      const rng = mulberry32(611);

      sky([[0,'#c8d8c0'],[.5,'#789868'],[1,'#2a4535']]);

      const ridgeCols = ['#9ab890', '#7aa070', '#5a8050', '#3a6040']; scat(611, 4, (rng, r) => {
        FS(ridgeCols[r]); mv(0, H * (.38 + r * .14));
        span(0, 8, i => {
          lT(W * i / 8, H * (.38 + r * .14) - H * (.05 + rng() * .1) * (r + 1) * .3)
        })
        lT(W, H); lT(W, H); lT(0, H); cP(); cP(); fL();

        FS('rgba(220,230,215,.3)'); ell((.3 + r * .15) + SI(t * .2 + r) * W * .03, (.4 + r * .14), W * .3, H * .03)
      });

      ([.3, .55, .8]).forEach(wx => {
        const wy = H * .45; SS('rgba(230,240,235,.7)'); lnW(3); plS([W * wx, wy],[W * wx - W * .01, wy + H * .15, W * wx + W * .005, wy + H * .3]);

        FS('rgba(235,245,240,.5)'); ellP(W * wx + W * .005, wy + H * .32, W * .02, H * .012)
      });

      FS('#1e3528'); mv(0, H * .82);
      span(0, 10, i => {
        lT(W * i / 10, H * .82 - H * .03 * AB(SI(i * 2.7)))
      })
      lT(W, H); lT(W, H); lT(0, H); cP(); cP(); fL();

      SS('rgba(40,50,45,.7)'); lnW(1.3);
      times(4, i => {
        const bx = W * (.2 + i * .18 + SI(t * .35 + i) * .02); const by = H * (.15 + (i % 2) * .07); mv(bx - 5, by); mT(bx - 5, by); qT(bx, by - 4, bx + 5, by); sK()
      })
    } else if (pr === 'kaziranga') {
      const rng = mulberry32(507);

      sky([[0,'#d8d0a8'],[.5,'#a0a868'],[1,'#3a5040']]);

      FS('#e8d8a8'); dot(.75,.22,H * .06);

      scat(507, 26, (rng, i) => {
        const gx = rng() * W; const gh = H * (.12 + rng() * .18); const lean = (rng() - .5) * W * .02; SS(i % 3 ? '#5a7038' : '#6a8040'); lnW(2); plS([gx, H * .72],[gx + lean, H * .72 - gh * .6, gx + lean * 2, H * .72 - gh])
      });

      const rx = W * .35, ry = H * .66; FS('#6a6a60'); ellP(rx, ry, W * .09, H * .055);

      ellP(rx - W * .09, ry - H * .01, W * .035, H * .03, -.2); poly([rx - W * .115,ry - H * .035],[rx - W * .125,ry - H * .07],[rx - W * .1,ry - H * .04]);

      rect(rx - W * .08, ry - H * .045, W * .012, H * .015); rect(rx - W * .06, ry + H * .03, W * .015, H * .035); rect(rx + W * .05, ry + H * .03, W * .015, H * .035);

      FS('#3a5850');
      times(4, i => {
        const wx = W * (.15 + rng() * .7); const wy = H * (.78 + rng() * .15); ellP(wx, wy, W * (.04 + rng() * .05), H * .015)
      });

      FS('#2a4030'); bnd(.85);

      SS('rgba(50,55,45,.8)'); lnW(1.4);
      times(5, i => {
        const bx = W * (.55 + i * .07 + S(.3) * .02); const by = H * (.28 + AB(i - 2) * .04); mv(bx - 6, by); mT(bx - 6, by); qT(bx, by - 5, bx + 6, by); sK()
      })
    } else if (pr === 'kerala') {
      const rng = mulberry32(441);

      sky([[0,'#e0d8b0'],[.45,'#a8b878'],[1,'#305848']]);

      scat(441, 7, (rng, i) => {
        mir(s => {
          const px = W * .5 + s * W * (.12 + i * .06); const py = H * .6 - i * H * .015; const ps = 1 - i * .09; SS('#4a3a28'); lnW(3 * ps); plS([px, py],[px + s * W * .015, py - H * .1 * ps, px + s * W * .025, py - H * .16 * ps]);

          SS('#2a5838'); lnW(2 * ps);
          span(-2, 2, f => {
            plS([px + s * W * .025, py - H * .16 * ps],[px + s * W * (.025 + f * .02 * ps), py - H * (.16 + .04 * ps), px + s * W * (.025 + f * .04 * ps), py - H * (.12 * ps)])
          })
        })
      });

      FS('#3a5850'); poly([W * .3,H],[W * .44,H * .6],[W * .56,H * .6],[W * .7,H]);

      FS('rgba(224,216,176,.25)'); ell(.5, .85, W * .12, H * .05);

      const bx = W * .5 + S(.4) * W * .015; const by = H * .78; FS('#5a4028'); poly([bx - W * .09,by],[bx,by + H * .05,bx + W * .09,by]);

      FS('#8a6840'); poly([bx - W * .07,by],[bx,by - H * .1,bx + W * .07,by],[bx + W * .05,by],[bx,by - H * .07,bx - W * .05,by]);

      FS('#3a6848');
      times(4, i => {
        const lx = W * (.18 + rng() * .6); const ly = H * (.72 + rng() * .2); ellP(lx, ly, W * .02, H * .008);
        if (i % 2 === 0) {
          FS('#e8a0b0'); dotP(lx, ly - H * .015, 3); FS('#3a6848')
        }
      });

      SS('#e8e8e0'); lnW(1.5); const ex = W * .72, ey = H * .55 + S(.6) * H * .01; mv(ex - 7, ey); mT(ex - 7, ey); qT(ex, ey - 5, ex + 7, ey); sK()
    } else if (pr === 'gopuram') {

      sky([[0,'#f0c8b8'],[.5,'#d89878'],[1,'#605050']]);

      FS('#f8d8b0'); dot(.8,.22,H * .055);

      const gx = W * .5; const tcols = ['#b06040', '#a85840', '#985038', '#884834', '#784030', '#683828'];
      times(6, i => {
        const w = W * (.34 - i * .04); const y2 = H * .72 - i * H * .09; FS(tcols[i]); rect(gx - w / 2, y2 - H * .09, w, H * .09);

        FS('#684030');
        times(7 - i, j2 => {
          const dx = gx - w / 2 + w * (j2 + .5) / (7 - i); rect(dx - W * .006, y2 - H * .075, W * .012, H * .04)
        })
      });

      FS('#d0a048'); bP(); eC(gx, H * .18, W * .07, H * .045, 0, PI, 0); fL(); rect(gx - W * .07, H * .18, W * .14, H * .02);

      FS('#38282a'); poly([gx - W * .05,H * .72],[gx - W * .05,H * .62],[gx,H * .56,gx + W * .05,H * .62],[gx + W * .05,H * .72]);

      FS('#305060'); bnd(.78); FS('rgba(176,96,64,.35)'); ellP(gx, H * .86, W * .16, H * .07);

      mir(s => {
        const px = gx + s * W * .35; SS('#4a3a28'); lnW(5); plS([px, H * .78],[px + s * W * .02, H * .6, px + s * W * .04, H * .48]); SS('#2a5030'); lnW(3);
        span(-2, 2, f => {
          plS([px + s * W * .04, H * .48],[px + s * W * (.04 + f * .02), H * .42, px + s * W * (.04 + f * .045), H * .46])
        })
      })

      FS('#f0c040');
      times(5, i => {
        dot((.15 + i * .18), .75 + SI(t * 2 + i) * H * .003, 2)
      })
    } else if (pr === 'thar') {

      sky([[0,'#f0d0a0'],[.55,'#e0a860'],[1,'#c08840']]);

      FS('#f8e0b0'); dot(.75,.2,H * .07);

      FS('#a06840'); rect(W * .08, H * .38, W * .14, H * .1);
      times(3, i => {
        rect(W * (.09 + i * .045), H * .34, W * .02, H * .05)
      });
      FS('#885830'); poly([W * .05,H * .48],[W * .25,H * .48],[W * .28,H * .55],[W * .02,H * .55]);

      FS('#d09858'); poly([0,H * .6],[W * .3,H * .52,W * .6,H * .6],[W * .8,H * .66,W,H * .58],[W,H],[W,H],[0,H]); FS('#c88848'); poly([0,H * .75],[W * .5,H * .65,W,H * .78],[W,H],[W,H],[0,H]);

      SS('rgba(180,130,70,.5)'); lnW(1);
      times(5, i => {
        plS([W * (i * .2), H * (.82 + (i % 2) * .06)],[W * (i * .2 + .1), H * (.8 + (i % 2) * .06), W * (i * .2 + .2), H * (.83 + (i % 2) * .06)])
      });

      FS('#5a3a20');
      times(3, i => {
        const cx = W * (.35 + i * .09 + S(.4) * .005); const cy = H * .63 - i * H * .008;

        ellP(cx, cy, W * .022, H * .018); bP(); bP(); aR(cx, cy - H * .02, H * .012, 0, 7); dotP(cx, cy - H * .02, H * .012);

        rect(cx + W * .018, cy - H * .04, 3, H * .035);

        rect(cx - W * .015, cy + H * .01, 2, H * .025); rect(cx + W * .01, cy + H * .01, 2, H * .025);

        dotP(cx - W * .005, cy - H * .028, H * .008)
      })
    } else if (pr === 'himalaya') {
      const rng = mulberry32(331);

      sky([[0,'#c8d8f0'],[.5,'#8098b8'],[1,'#40505e']]);

      scat(331, 5, (rng, i) => {
        const px = W * (i * .22 + .05); const ph = H * (.35 + rng() * .3); const pw = W * (.2 + rng() * .1); FS(i % 2 ? '#5a6a78' : '#4a5a68'); poly([px - pw / 2,H * .75],[px,H * .75 - ph],[px + pw / 2,H * .75]);

        FS('#e8f0f8'); poly([px - pw * .12,H * .75 - ph * .78],[px,H * .75 - ph],[px + pw * .12,H * .75 - ph * .78],[px + pw * .06,H * .75 - ph * .72],[px - pw * .04,H * .75 - ph * .74])
      });

      const mx = W * .62, my = H * .68; FS('#e0dcd0'); rect(mx - W * .05, my - H * .05, W * .1, H * .05); FS('#c89030'); poly([mx - W * .06,my - H * .05],[mx,my - H * .09],[mx + W * .06,my - H * .05]);

      FS('#384850'); poly([0,H * .78],[W * .4,H * .7,W,H * .8],[W,H],[W,H],[0,H]);

      const flagCols = ['#2858b0', '#e8e8e8', '#c03030', '#287030', '#e8c020'];
      times(2, s => {
        const y0 = H * (.58 + s * .08); SS('rgba(60,60,60,.5)'); lnW(1); plS([W * .05, y0 - H * .04],[W * .3, y0 + H * .02, W * (.5 + s * .1), y0]);
        times(6, i => {
          const fp = i / 6; const fx = W * (.05 + fp * (.45 + s * .1)); const fy = (1 - fp) * (1 - fp) * (y0 - H * .04) + 2 * (1 - fp) * fp * (y0 + H * .02) + fp * fp * y0; FS(flagCols[(i + s) % 5]); rect(fx, fy, W * .018, H * .022)
        })
      });

      SS('rgba(40,45,55,.8)'); lnW(1.6); const ex = W * .3 + S(.3) * W * .04, ey = H * .3 + C(.4) * H * .02; mv(ex - 9, ey); mT(ex - 9, ey); qT(ex, ey - 6, ex + 9, ey); sK()
    } else if (pr === 'ghat') {
      const rng = mulberry32(209);

      sky([[0,'#f0c8a0'],[.5,'#d89878'],[1,'#48606a']]);

      FS('#f8d8a0'); dot(.2,.22,H * .06);

      scat(209, 8, (rng, i) => {
        const tx = W * .05 + i * W * .13; const th = H * (.08 + rng() * .14); const tw = W * (.05 + rng() * .03); FS(i % 2 ? '#a05840' : '#b06850'); rect(tx, H * .45 - th, tw, th);
        if (i % 3 === 0) {
          FS('#8a4830'); poly([tx - tw * .1,H * .45 - th],[tx + tw * .5,H * .45 - th - H * .06],[tx + tw * 1.1,H * .45 - th])
        } else if (i % 3 === 1) {
          bP(); aR(tx + tw * .5, H * .45 - th, tw * .5, PI, 0); fL()
        }
      });

      times(6, s => {
        FS(s % 2 ? '#c09070' : '#b08060'); const w = W * (.75 + s * .04); rect(W * .5 - w / 2, H * (.45 + s * .055), w, H * .055)
      });

      FS('#3a5560'); bnd(.8);

      FS('rgba(248,200,140,.35)'); rect(W * .05, H * .8, W * .3, H * .2);

      times(3, i => {
        const bx = W * (.2 + i * .3) + SI(t * .5 + i * 2) * W * .01; const by = H * (.85 + (i % 2) * .07); FS('#4a3028'); poly([bx - W * .05,by],[bx,by + H * .035,bx + W * .05,by]);

        dotP(bx, by - H * .02, H * .015)
      });

      FS('rgba(240,210,180,.28)'); ell(.5 + S(.2) * W * .04, .47, W * .5, H * .06)
    } else if (pr === 'taj') {

      sky([[0,'#f0e0d0'],[.45,'#d8b0a0'],[1,'#305060']]);

      FS('#f8d8b0'); dot(.8,.2,H * .05);

      const bx = W * .5, by = H * .55; FS('#f0ece4'); rect(bx - W * .12, by - H * .16, W * .24, H * .16);

      poly([bx - W * .07,by - H * .16],[bx - W * .08,by - H * .3,bx,by - H * .33],[bx + W * .08,by - H * .3,bx + W * .07,by - H * .16]);

      rect(bx - 2, by - H * .38, 4, H * .06);

      ([-1, 1]).forEach(s => {
        bP(); aR(bx + s * W * .09, by - H * .17, W * .028, PI, 0); fL(); rect(bx + s * W * .09 - 1, by - H * .22, 2, H * .05)
      });

      FS('#3a3038'); poly([bx - W * .035,by],[bx - W * .035,by - H * .1],[bx,by - H * .15,bx + W * .035,by - H * .1],[bx + W * .035,by]);

      FS('#e0dcd2');
      ([-1.6, -1.25, 1.25, 1.6]).forEach(s => {
        const mx = bx + s * W * .12; rect(mx - W * .008, by - H * .26, W * .016, H * .26); bP(); aR(mx, by - H * .27, W * .012, PI, 0); fL()
      });

      FS('rgba(240,236,228,.4)'); poly([bx - W * .1,H],[bx - W * .05,by + H * .05],[bx + W * .05,by + H * .05],[bx + W * .1,H]);

      FS('#3a5040');
      times(4, i => {
        ([-1, 1]).forEach(s => {
          const tx = bx + s * W * (.2 + i * .08); rect(tx - 2, by + H * .02 - H * .06, 4, H * .06); dotP(tx, by + H * .02 - H * .07, W * .02)
        })
      })
    } else if (pr === 'stupa') {

      sky([[0,'#e8c890'],[.5,'#c8a878'],[1,'#4a5a48']]);

      FS('#f0d8a0'); dot(.7,.25,H * .06);

      FS('#4a5a45'); mv(0, H * .5);
      span(0, 10, i => {
        lT(W * i / 10, H * .5 - H * .04 * AB(SI(i * 2.3)))
      })
      lT(W, H); lT(W, H); lT(0, H); cP(); cP(); fL();

      FS('#8a7058'); rect(W * .1, H * .62, W * .8, H * .38); FS('#7a6048'); rect(W * .15, H * .54, W * .7, H * .08); FS('#6a5040'); rect(W * .2, H * .48, W * .6, H * .06);

      scat(187, 2, (rng, row) => {
        const n = 6 - row * 2;
        times(n, i => {
          const sx = W * (.24 + i * .1 + row * .05); const sy = H * (.5 - row * .07); const sr = W * .028; FS('#5a4438'); poly([sx - sr,sy],[sx - sr,sy - sr * 1.4,sx,sy - sr * 1.5],[sx + sr,sy - sr * 1.4,sx + sr,sy]);

          rect(sx - 1.5, sy - sr * 1.8, 3, sr * .4)
        })
      });

      FS('#4a382e'); poly([W * .44,H * .5],[W * .44,H * .32,W * .5,H * .3],[W * .56,H * .32,W * .56,H * .5]); rect(W * .492, H * .22, W * .016, H * .1);

      FS('rgba(240,230,210,.3)'); ell(.5 + S(.25) * W * .05, .52, W * .45, H * .05);

      SS('rgba(60,50,40,.7)'); lnW(1.3);
      times(4, i => {
        const bx = W * (.15 + i * .2 + SI(t * .4 + i) * .03); const by = H * (.15 + (i % 2) * .08); mv(bx - 5, by); mT(bx - 5, by); qT(bx, by - 4, bx + 5, by); sK()
      })
    } else if (pr === 'dojo') {

      sky([[0,'#8a7458'],[.55,'#b8956a'],[1,'#7a5f42']]);

      FS('#9a7a54'); bnd(.55);

      SS('rgba(90,65,40,.5)'); lnW(1.5);
      times(10, i => {
        const fx = W * i / 9; plS([W * .5 + (fx - W * .5) * .4, H * .55],[fx, H])
      });
      times(4, i => {
        const fy = H * (.6 + i * .1); mv(0, fy); mT(0, fy); lT(W, fy); sK()
      });

      spt(0, 2, s => {
        const wx = s === 0 ? W * .05 : W * .78; FS('#f0e8d0'); rect(wx, H * .12, W * .17, H * .38); SS('#6a5238'); lnW(2); sR(wx, H * .12, W * .17, H * .38);

        bP();
        for (let i = 1; i < 4; i++) {
          mT(wx + W * .17 * i / 4, H * .12); lT(wx + W * .17 * i / 4, H * .5)
        }
        for (let i = 1; i < 3; i++) {
          mT(wx, H * .12 + H * .38 * i / 3); lT(wx + W * .17, H * .12 + H * .38 * i / 3)
        }
        sK()
      })

      FS('#f5efe0'); rect(W * .45, H * .08, W * .1, H * .3); FS('#4a3a28'); rect(W * .43, H * .08, W * .14, H * .02); rect(W * .43, H * .36, W * .14, H * .02);

      SS('#1a1a1a'); lnW(5); mv(W * .47, H * .15); mT(W * .47, H * .15); lT(W * .53, H * .15); mT(W * .5, H * .13); mT(W * .5, H * .13); lT(W * .5, H * .28); mT(W * .475, H * .22); mT(W * .475, H * .22); qT(W * .5, H * .26, W * .525, H * .22); sK();

      SS('#5a4228'); lnW(4); plS([W * .32, H * .52],[W * .35, H * .3]); SS('#3a2a18'); lnW(5); mv(W * .335, H * .42); mT(W * .335, H * .42); lT(W * .365, H * .415); sK()
    } else if (pr === 'meteora') {
      const rng = mulberry32(257);

      sky([[0,'#e8a870'],[.5,'#c87860'],[1,'#5a4a50']]);

      FS('#f0d090'); dot(.25,.35,H * .06);

      FS('rgba(110,80,80,.5)'); scat(257, 4, (rng, i) => {
        const px = W * (.08 + i * .24); const ph = H * (.3 + rng() * .2); poly([px,H],[px + W * .015,H - ph],[px + W * .05,H - ph - H * .02],[px + W * .065,H])
      });

      FS('#6a5048'); poly([W * .55,H],[W * .58,H * .42],[W * .62,H * .36,W * .68,H * .38],[W * .74,H * .42],[W * .77,H]);

      SS('rgba(60,45,42,.5)'); lnW(2);
      times(4, i => {
        const sy = H * (.5 + i * .12); plS([W * (.57 + i * .005), sy],[W * .66, sy + H * .015, W * .76, sy])
      });

      FS('#e8dcc8'); rect(W * .62, H * .34, W * .09, H * .06); FS('#a04030'); poly([W * .6,H * .345],[W * .665,H * .31],[W * .73,H * .345]); FS('#3a4a55');
      times(3, i => {
        rect(W * .63 + i * W * .026, H * .355, W * .012, H * .025)
      });

      FS('#5a463e'); poly([W * .15,H],[W * .17,H * .6],[W * .21,H * .58],[W * .23,H]); FS('#e8dcc8'); rect(W * .175, H * .555, W * .035, H * .03); FS('#a04030'); mv(W * .172, H * .558); mT(W * .172, H * .558); lT(W * .192, H * .54); mT(W * .172, H * .558); lT(W * .192, H * .54); lT(W * .212, H * .558); cP(); cP(); fL();

      SS('rgba(50,40,35,.8)'); lnW(1.5); const bx = W * (.4 + .15 * S(.5)); const by = H * (.25 + .08 * SI(t)); plS([bx - 8, by],[bx - 3, by - 5 - 2 * S(6), bx, by],[bx + 3, by - 5 - 2 * S(6), bx + 8, by])
    } else if (pr === 'rapids') {

      sky([[0,'#7a9a90'],[.45,'#4a6a60'],[1,'#2a4a5a']]);

      FS('#3a4a42'); mv(0, 0); mT(0, 0); lT(W * .3, 0); qT(W * .35, H * .3, W * .28, H * .55); lT(W * .18, H); lT(W * .18, H); lT(0, H); cP(); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .72, 0); qT(W * .66, H * .3, W * .74, H * .55); lT(W * .84, H); lT(W * .84, H); lT(W, H); cP(); cP(); fL();

      FS('#4a6a52'); mv(0, 0); mT(0, 0); lT(W * .3, 0); mT(0, 0); lT(W * .3, 0); lT(W * .28, H * .1); mT(0, 0); lT(W * .3, 0); lT(W * .28, H * .1); lT(0, H * .15); cP(); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .72, 0); mT(W, 0); lT(W * .72, 0); lT(W * .74, H * .1); mT(W, 0); lT(W * .72, 0); lT(W * .74, H * .1); lT(W, H * .15); cP(); cP(); fL();

      FS(lg(0, H * .4, 0, H,[0, '#3a7a80',1, '#1a4a58'])); mv(W * .28, H * .55); mT(W * .28, H * .55); lT(W * .18, H); lT(W * .84, H); lT(W * .84, H); lT(W * .74, H * .55); cP(); cP(); fL();

      const rng = mulberry32(941);
      times(7, i => {
        const rx = W * (.28 + rng() * .45); const ry = H * (.58 + rng() * .35); const rr = W * (.02 + rng() * .03);

        FS('#5a5a55'); ellP(rx, ry, rr, rr * .7);

        SS('rgba(230,245,250,.75)'); lnW(1.5); const fl = SI(t * 5 + i * 2); mv(rx - rr * 1.4, ry); qT(rx - rr * .5, ry - rr * (.8 + fl * .3), rx, ry - rr * .2); mT(rx + rr * .3, ry - rr * .15); qT(rx + rr, ry - rr * (.6 - fl * .3), rx + rr * 1.5, ry + 2); sK()
      });

      SS('rgba(200,235,240,.5)'); lnW(1.5);
      times(8, i => {
        const sy = H * (.58 + i * .05); const off = (t * .3 + i * .13) % 1; plS([W * (.22 + off * .1), sy],[W * (.5 + off * .1), sy + H * .04])
      });

      FS('rgba(240,250,255,.6)');
      times(15, i => {
        const px = W * (.3 + rng() * .4); const py = H * (.6 + rng() * .3); const tw = .5 + .5 * SI(t * 4 + i); dotP(px, py, 1.5 * tw)
      })
    } else if (pr === 'iceberg') {
      const rng = mulberry32(761);

      sky([[0,'#4a6a8a'],[.5,'#7a9ab5'],[1,'#3a5a75']]);

      FS('rgba(240,230,200,.8)'); dot(.2,.22,H * .05);

      FS('#dceef5'); poly([W * .3,H * .58],[W * .38,H * .3],[W * .46,H * .42],[W * .55,H * .22],[W * .63,H * .4],[W * .72,H * .58]);

      FS('#a8c8dc'); poly([W * .55,H * .22],[W * .63,H * .4],[W * .72,H * .58],[W * .55,H * .58]); FS('#c0dcea'); poly([W * .46,H * .42],[W * .55,H * .22],[W * .55,H * .58],[W * .4,H * .58]);

      FS(lg(0, H * .58, 0, H,[0, '#2a4a62',1, '#16283a'])); bnd(.58);

      FS('rgba(190,220,235,.25)'); poly([W * .35,H * .58],[W * .5,H * .72],[W * .68,H * .58]);

      FS('rgba(220,235,245,.8)'); scat(761, 10, (rng, i) => {
        const fx = rng() * W; const fy = H * (.62 + rng() * .32); const fw = W * (.02 + rng() * .05); const dy = SI(t * .8 + i) * 2; poly([fx,fy + dy],[fx + fw * .4,fy - H * .012 + dy],[fx + fw,fy + dy],[fx + fw * .8,fy + H * .008 + dy],[fx + fw * .15,fy + H * .01 + dy])
      });

      const sx = W * (.15 + .1 * S(.2)); const sy = H * (.78 + .01 * S(1.5)); FS('#4a5a64'); ellP(sx, sy, W * .018, H * .018); FS('#222'); bP(); aR(sx - W * .005, sy - 2, 1.5, 0, 7); aR(sx + W * .005, sy - 2, 1.5, 0, 7); fL();

      SS('rgba(160,200,220,.3)'); lnW(1.2);
      spt(0, 6, i => {
        const wy = H * (.6 + i * .07); mv(0, wy);
        for (let x = 0; x <= 8; x++) {
          lT(W * x / 8, wy + SI(x * 1.8 + i * 2.5 + t * .9) * H * .008)
        }
        sK()
      })
    } else if (pr === 'cloudforest') {

      sky([[0,'#8aa098'],[.5,'#5a7a68'],[1,'#2a4438']]);

      FS('rgba(60,90,75,.5)');
      times(5, i => {
        const tx = W * (.1 + i * .2); rect(tx, H * .15, W * .015, H * .7); ellP(tx + W * .008, H * .15, W * .06, H * .1)
      });

      times(2, i => {
        const my = H * (.3 + i * .25); const mx = SI(t * .3 + i * 2) * W * .08;
        FS(`rgba(200,220,210,${.25 - i * .08})`);
        ellP(W * .5 + mx, my, W * .55, H * .07)
      });

      FS('#1e3228'); rect(W * .08, 0, W * .05, H); rect(W * .85, 0, W * .06, H);

      mv(W * .13, H * .2); mT(W * .13, H * .2); lT(W * .35, H * .12); lT(W * .35, H * .16); lT(W * .35, H * .16); lT(W * .13, H * .27); cP(); cP(); fL(); mv(W * .85, H * .28); mT(W * .85, H * .28); lT(W * .65, H * .2); lT(W * .65, H * .24); lT(W * .65, H * .24); lT(W * .85, H * .35); cP(); cP(); fL();

      SS('rgba(120,160,110,.8)'); lnW(2); const rng = mulberry32(433);
      times(14, i => {
        const bx = W * (.14 + rng() * .2); const by = H * (.13 + rng() * .08); const bl = H * (.06 + rng() * .12); const sw = SI(t + i) * 3; plS([bx, by],[bx + sw, by + bl * .6, bx + sw * .6, by + bl])
      });
      times(10, i => {
        const bx = W * (.66 + rng() * .18); const by = H * (.21 + rng() * .08); const bl = H * (.05 + rng() * .1); const sw = SI(t * 1.2 + i) * 3; plS([bx, by],[bx + sw, by + bl * .6, bx + sw * .6, by + bl])
      });

      FS('#24392e'); bnd(.82); SS('#3a5a48'); lnW(2);
      times(20, i => {
        const gx = rng() * W; plS([gx, H],[gx + 4, H * .9, gx + SI(t + i) * 5, H * .84])
      });

      FS('rgba(60,140,100,.85)'); const bx2 = W * (.3 + .2 * S(.4)); const by2 = H * (.45 + .06 * S(1.3)); const flap = S(8); bP(); bP(); eC(bx2, by2, 8, 5, 0, 0, 7); ellP(bx2, by2, 8, 5); plS([bx2 - 4, by2],[bx2 - 14, by2 - 8 * flap, bx2 - 18, by2 - 2])
    } else if (pr === 'grotto') {
      const rng = mulberry32(887);

      sky([[0,'#0a1520'],[.55,'#10283a'],[1,'#0a3a50']]);

      FS(rg(W * .5, H * .38, 0, W * .5, H * .38, W * .25,[0, 'rgba(180,220,255,.7)',1, 'rgba(180,220,255,0)'])); rect(0, 0, W, H * .7);

      FS('#1a2a35'); scat(887, 12, (rng, i) => {
        const sx = rng() * W; const sh = H * (.08 + rng() * .22); const sw = W * (.01 + rng() * .03); poly([sx - sw,0],[sx,sh],[sx + sw,0])
      });

      FS('#16242e'); mv(0, 0); mT(0, 0); lT(W * .12, 0); qT(W * .16, H * .4, W * .1, H * .6); lT(0, H * .75); lT(0, H * .75); cP(); lT(0, H * .75); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .88, 0); qT(W * .84, H * .4, W * .9, H * .6); lT(W, H * .75); lT(W, H * .75); cP(); lT(W, H * .75); cP(); fL();

      FS(lg(0, H * .62, 0, H,[0, '#1a6a8a',1, '#0a4a6a'])); bnd(.62);

      FS('rgba(150,220,255,.3)');
      times(10, i => {
        const rx = W * (.3 + i * .045); const ry = H * (.64 + i * .03); const rw = W * (.02 + .012 * SI(t * 1.5 + i)); rect(rx - rw / 2, ry, rw, 2)
      });

      FS('rgba(170,210,255,.1)'); mv(W * .44, H * .35); mT(W * .44, H * .35); lT(W * .36, H); lT(W * .52, H); lT(W * .52, H); lT(W * .52, H * .35); cP(); cP(); fL();

      FS('rgba(200,240,255,.7)');
      times(8, i => {
        const sx = rng() * W; const sy = H * (.3 + rng() * .3); const tw = .5 + .5 * SI(t * 3 + i * 2); dotP(sx, sy, 1.5 * tw)
      })
    } else if (pr === 'canal') {

      sky([[0,'#a0c0d8'],[.6,'#c8b8a0'],[1,'#6a8090']]);

      const rng = mulberry32(613); const hues = ['#c07050', '#d0a060', '#a08060', '#b06050', '#c09070'];
      times(4, i => {
        const bx = W * i * .13; const bh = H * (.2 + rng() * .15); FS(hues[i % hues.length]); rect(bx, H * .45 - bh, W * .12, bh);

        FS('#4a5a6a');
        times(3, w => {
          rect(bx + W * .02 + w * W * .035, H * .45 - bh * .7, W * .018, bh * .25)
        })
      });

      times(4, i => {
        const bx = W * (.6 + i * .11); const bh = H * (.18 + rng() * .16); FS(hues[(i + 2) % hues.length]); rect(bx, H * .45 - bh, W * .1, bh); FS('#4a5a6a');
        times(2, w => {
          rect(bx + W * .015 + w * W * .04, H * .45 - bh * .65, W * .02, bh * .3)
        })
      });

      FS('#8a7058'); poly([W * .32,H * .52],[W * .5,H * .38,W * .68,H * .52],[W * .68,H * .56],[W * .68,H * .56],[W * .32,H * .56]);

      FS('#4a6a7a'); bnd(.56);

      SS('rgba(200,220,230,.35)'); lnW(1.5);
      spt(0, 9, i => {
        const wy = H * (.6 + i * .045); mv(0, wy);
        for (let x = 0; x <= 8; x++) {
          lT(W * x / 8, wy + SI(x * 2 + i * 3 + t * .8) * H * .006)
        }
        sK()
      })

      const gx = W * (.75 - ((t * .04) % 1) * .5); FS('#20242a'); poly([gx - W * .06,H * .7],[gx,H * .75,gx + W * .06,H * .7],[gx + W * .07,H * .66,gx + W * .06,H * .69],[gx - W * .06,H * .69],[gx - W * .07,H * .66,gx - W * .06,H * .7]);

      rect(gx + W * .02, H * .64, W * .008, H * .05); dotP(gx + W * .024, H * .63, H * .008);

      SS('#6a5038'); lnW(2); plS([W * .32, H * .5],[W * .5, H * .36, W * .68, H * .5])
    } else if (pr === 'pampas') {
      const rng = mulberry32(509);

      sky([[0,'#8ab8e0'],[.55,'#c8d8c0'],[1,'#9aa86a']]);

      FS('#f0e0a0'); dot(.78,.18,H * .07);

      FS('#a8b87a'); poly([0,H * .58],[W * .3,H * .52,W * .65,H * .56],[W * .85,H * .6,W,H * .55],[W,H],[W,H],[0,H]);

      scat(509, 40, (rng, i) => {
        const px = rng() * W; const py = H * (.6 + rng() * .38); const ph = H * (.08 + rng() * .1); const sw = SI(t * 1.2 + px * .05) * ph * .12;

        SS('rgba(120,130,80,.7)'); lnW(1.2); plS([px, py],[px + sw * .5, py - ph * .6, px + sw, py - ph]);

        FS('rgba(225,222,205,.85)'); ellP(px + sw, py - ph, 2.5, ph * .28, sw * .02)
      });

      const gx = W * (.1 + .05 * S(.1)); FS('rgba(40,35,30,.8)'); rect(gx, H * .55, W * .025, H * .015); rect(gx + W * .003, H * .535, W * .008, H * .018);

      SS('rgba(60,60,60,.7)'); lnW(1.3);
      times(5, i => {
        const bx = W * (.15 + i * .13 + SI(t * .3 + i) * .02); const by = H * (.12 + (i % 3) * .05); mv(bx - 5, by); mT(bx - 5, by); qT(bx, by - 4, bx + 5, by); sK()
      })
    } else if (pr === 'tea') {
      const rng = mulberry32(359);

      sky([[0,'#a8c8d8'],[.45,'#c8d8b8'],[1,'#5a8a50']]);

      FS('#8a9a90'); poly([0,H * .45],[W * .3,H * .28,W * .6,H * .4],[W * .8,H * .48,W,H * .42],[W,H * .55],[W,H * .55],[0,H * .55]);

      FS('rgba(230,235,230,.35)'); ell(.5 + S(.2) * W * .03, .42, W * .35, H * .04);

      spt(0, 6, i => {
        const ry = H * (.56 + i * .07); const amp = .015 + i * .008;
        SS(`rgba(45,${90 + i * 8},50,${.85 - i * .06})`);
        lnW(H * .028); mv(0, ry);
        for (let x = 0; x <= 8; x++) {
          lT(W * x / 8, ry + SI(x * 1.5 + i * 2 + t * .15) * H * amp)
        }
        sK()
      })

      SS('rgba(160,150,110,.5)'); lnW(2);
      times(4, i => {
        const px = W * (.15 + i * .22); plS([px, H * .55],[px + W * .05, H])
      });

      scat(359, 4, (rng, i) => {
        const px = W * (.2 + rng() * .6); const py = H * (.68 + rng() * .2); FS('#c8b060'); mv(px - W * .012, py); mT(px - W * .012, py); lT(px, py - H * .018); mT(px - W * .012, py); lT(px, py - H * .018); lT(px + W * .012, py); cP(); cP(); fL()
      })
    } else if (pr === 'glade') {

      sky([[0,'#4a7a5a'],[.5,'#6a9a68'],[1,'#4a7a48']]); const rng = mulberry32(347);

      ([0, 1]).forEach(side => {
        times(4, i => {
          const tx = W * (side ? .72 + i * .08 : .02 + i * .08); const th = H * (.5 + rng() * .15); FS('#4a3a28'); rect(tx, H * .55 - th * .3, W * .012, th * .3 + H * .1); FS('#3a6a40'); ellP(tx + W * .006, H * .55 - th * .35, W * .07, H * .14)
        })
      });

      FS('#5a8a48'); bnd(.55);

      times(3, i => {
        const gx = W * (.35 + i * .12) + SI(t * .3 + i) * W * .01; FS('rgba(255,240,180,.12)'); mv(gx, H * .1); mT(gx, H * .1); lT(gx + W * .05, H * .1); lT(gx + W * .09, H * .7); lT(gx + W * .09, H * .7); lT(gx + W * .04, H * .7); cP(); cP(); fL()
      });

      SS('rgba(40,80,35,.5)'); lnW(1.5);
      times(10, i => {
        const px = W * (.28 + rng() * .44); const py = H * (.62 + rng() * .3); mv(px, py); mT(px, py); lT(px + W * .004, py - H * .025); sK()
      });

      times(12, i => {
        const px = W * (.26 + rng() * .48); const py = H * (.6 + rng() * .32); FS(['#e8e0f0', '#f0d8e8', '#f8e8a8', '#e8f0d8'][FL(rng() * 4)]); dotP(px, py, W * .005)
      });

      times(3, i => {
        const bx = W * .5 + SI(t * .5 + i * 2.2) * W * (.1 + i * .06); const by = H * .55 + SI(t * .9 + i * 1.3) * H * .08; const flap = SI(t * 12 + i) * .6; FS(['#f0c8e0', '#f0e0b0', '#c8e0f0'][i]); bP(); eC(bx - W * .006, by, W * .007, H * .004 * AB(flap) + H * .002, -.3, 0, 7); eC(bx + W * .006, by, W * .007, H * .004 * AB(flap) + H * .002, .3, 0, 7); fL()
      });

      FS('rgba(255,250,210,.5)');
      times(6, i => {
        const px = W * (.3 + rng() * .4) + SI(t * .6 + i) * W * .015; const py = H * (.3 + rng() * .3) + CO(t * .5 + i) * H * .015; dotP(px, py, 1.5)
      })
    } else if (pr === 'billabong') {

      sky([[0,'#e8c88a'],[.5,'#d8a860'],[1,'#a87848']]);
      const rng = mulberry32(337);

      FS('#f0e0b0'); dot(.8, .2, H * .09);

      FS('#b08a58'); bnd(.5);

      FS('#9a7850'); poly([0,H * .5],[W * .3,H * .44,W * .6,H * .5],[W * .8,H * .54,W,H * .5],[W,H * .55],[W,H * .55],[0,H * .55]);

      scat(337, 3, (rng, i) => {
        const tx = W * (.12 + i * .15 + rng() * .04); const th = H * (.22 + rng() * .08); FS('#c8b8a0'); rect(tx, H * .55 - th, W * .008, th); FS('#6a8a58');
        times(4, j => {
          ellP(tx + W * (rng() - .4) * .05, H * .55 - th - H * (rng() * .06), W * .035, H * .022)
        })
      });

      FS(lg(0, H * .62, 0, H * .85,[0, '#5a8a9a',1, '#3a6a7a'])); ell(.55, .72, W * .32, H * .11);

      FS('rgba(90,120,90,.3)');
      times(3, i => {
        const tx = W * (.12 + i * .15); ellP(tx, H * .68, W * .03, H * .02)
      });

      SS('rgba(200,235,245,.4)'); lnW(1.5);
      times(5, i => {
        const py = H * (.66 + i * .03); plS([W * .35 + SI(t * .7 + i) * W * .02, py],[W * .7 + SI(t * .7 + i) * W * .02, py])
      });

      SS('#3a3028'); lnW(1.5); const bx = W * .32, by = H * .66; plS([bx, by],[bx, by + H * .025]); FS('#3a3028'); bP(); bP(); eC(bx + W * .004, by - H * .004, W * .008, H * .006, 0, 0, 7); ellP(bx + W * .004, by - H * .004, W * .008, H * .006); bP(); bP(); aR(bx + W * .012, by - H * .012, W * .004, 0, 7); dotP(bx + W * .012, by - H * .012, W * .004);

      SS('#7a8a50'); lnW(1.5);
      times(7, i => {
        const px = W * (.25 + rng() * .5); const py = H * (.8 + rng() * .1); plS([px, py],[px + W * .006, py - H * .03, px + W * .002, py - H * .045])
      })
    } else if (pr === 'seastack') {

      sky([[0,'#8a9aa8'],[.5,'#4a6a80'],[1,'#2a4a60']]);

      FS('rgba(220,225,230,.3)');
      times(3, i => {
        const px = ((W * (.1 + i * .4) + t * W * .01) % (W * 1.2)) - W * .1; ellP(px, H * (.1 + i * .06), W * .12, H * .025)
      });

      const rng = mulberry32(313); const stacks = [[.2, .35, .05], [.38, .28, .04], [.68, .4, .06], [.88, .3, .035]];
      for (const [sx, sh, sw] of stacks) {
        FS('#3a4a52'); poly([W * (sx - sw),H * .7],[W * (sx - sw * .7),H * (.7 - sh)],[W * sx,H * (.7 - sh) - H * .02,W * (sx + sw * .7),H * (.7 - sh)],[W * (sx + sw),H * .7]);

        FS('#4a6a4a'); ell(sx, (.7 - sh) - H * .008, W * sw * .8, H * .012); FS('#3a4a52')
      }

      FS(lg(0, H * .7, 0, H,[0, '#3a6a85',1, '#1e4a60'])); bnd(.7);

      FS('rgba(240,250,255,.6)');
      for (const [sx] of stacks) {
        const wob = SI(t * 2 + sx * 10) * W * .008; ell(sx + wob, .705, W * .035, H * .008)
      }

      FS('rgba(200,230,245,.35)');
      times(8, i => {
        const px = W * rng(), py = H * (.73 + rng() * .22); ellP(px + SI(t + i) * W * .006, py, W * .012, H * .002)
      });

      SS('#202830'); lnW(1.5);
      times(3, i => {
        const bx = W * (.15 + i * .3) + SI(t * .5 + i) * W * .03; const by = H * (.25 + i * .08) + SI(t * .9 + i * 2) * H * .02; bP(); aR(bx - W * .005, by, W * .005, PI * 1.1, PI * 1.9); aR(bx + W * .005, by, W * .005, PI * 1.1, PI * 1.9); sK()
      })
    } else if (pr === 'bazaar') {

      sky([[0,'#e8a860'],[.55,'#c88858'],[1,'#8a5a40']]);
      const rng = mulberry32(293);

      FS('#a06a48'); rect(0, H * .35, W, H * .18); bP(); aR(W * .2, H * .35, W * .05, PI, PI * 2); aR(W * .2, H * .35, W * .05, PI, PI * 2); fL(); bP(); aR(W * .62, H * .35, W * .07, PI, PI * 2); aR(W * .62, H * .35, W * .07, PI, PI * 2); fL(); rect(W * .85, H * .22, W * .015, H * .3); bP(); aR(W * .857, H * .22, W * .012, PI, PI * 2); aR(W * .857, H * .22, W * .012, PI, PI * 2); fL();

      scat(293, 3, (rng, i) => {
        const ax = W * (.08 + i * .32); const aw = W * .26;
        times(6, s => {
          FS(s % 2 ? '#c84838' : '#e8d8b8'); poly([ax + aw * s / 6,H * .5],[ax + aw * (s + 1) / 6,H * .5],[ax + aw * (s + .5) / 6,H * .56])
        })
      });

      times(3, i => {
        const sx = W * (.1 + i * .32); FS('#7a5a3a'); rect(sx, H * .62, W * .2, H * .12); FS(['#c84a3a', '#3a7a5a', '#c8a83a'][i]);
        times(5, j => {
          dotP(sx + W * .02 + j * W * .035, H * .6, W * .012)
        })
      });

      times(5, i => {
        const lx = W * (.12 + i * .19); const ly = H * .18 + SI(t * .8 + i) * H * .008; SS('rgba(60,40,30,.6)'); lnW(1); plS([lx, H * .08],[lx, ly]); FS('rgba(255,190,90,.9)'); ellP(lx, ly + H * .015, W * .011, H * .018)
      });

      FS('#6a5040'); bnd(.86); SS('rgba(40,30,22,.4)'); lnW(1);
      times(10, i => {
        const px = W * rng(); plS([px, H * .88],[px + W * .03, H * .98])
      })
    } else if (pr === 'polder') {

      sky([[0,'#a8c8e0'],[.5,'#c8d8c0'],[1,'#7aa868']]);

      FS('rgba(255,255,255,.5)');
      times(3, i => {
        const px = ((W * (.15 + i * .35) + t * W * .015) % (W * 1.2)) - W * .1; ellP(px, H * (.12 + i * .07), W * .09, H * .02)
      });

      const wx = W * .75, wy = H * .42; FS('#6a5a4a'); mv(wx - W * .012, wy + H * .12); mT(wx - W * .012, wy + H * .12); lT(wx + W * .012, wy + H * .12); lT(wx + W * .008, wy); lT(wx + W * .008, wy); lT(wx - W * .008, wy); cP(); cP(); fL();

      SS('#5a4a3a'); lnW(2);
      times(4, i => {
        const a = t * .8 + i * PI / 2; plS([wx, wy + H * .01],[wx + CO(a) * W * .045, wy + H * .01 + SI(a) * W * .045])
      });

      FS('#4a7a95'); mv(W * .42, H); mT(W * .42, H); lT(W * .47, H * .5); lT(W * .53, H * .5); lT(W * .53, H * .5); lT(W * .62, H); cP(); cP(); fL();

      FS('rgba(180,220,235,.3)'); mv(W * .48, H); mT(W * .48, H); lT(W * .5, H * .55); mT(W * .48, H); lT(W * .5, H * .55); lT(W * .51, H * .55); mT(W * .48, H); lT(W * .5, H * .55); lT(W * .51, H * .55); lT(W * .5, H); cP(); cP(); fL();

      SS('rgba(60,90,50,.35)'); lnW(1.5);
      times(5, i => {
        plS([W * (i * .08), H * .58],[W * (i * .16 - .02), H])
      });

      const rng = mulberry32(277); FS('#3a3a32');
      times(4, i => {
        const px = W * (.08 + rng() * .3); const py = H * (.7 + rng() * .2); ellP(px, py, W * .009, H * .008); dotP(px + W * .01, py - H * .004, W * .004)
      })
    } else if (pr === 'karst') {

      sky([[0,'#a8c8e8'],[.55,'#c8bfa0'],[1,'#9a8a6a']]);

      FS('#8a9a80'); poly([0,H * .45],[W * .25,H * .34,W * .5,H * .42],[W * .75,H * .5,W,H * .44],[W,H * .55],[W,H * .55],[0,H * .55]); const rng = mulberry32(263);

      times(9, i => {
        const px = W * (.05 + i * .11) + rng() * W * .03; const ph = H * (.18 + rng() * .25); const pw = W * (.02 + rng() * .018); FS(['#b8ac8e', '#a89a7c', '#c4b89e'][FL(rng() * 3)]); poly([px - pw,H * .85],[px - pw * .7,H * .85 - ph],[px,H * .85 - ph - H * .02,px + pw * .7,H * .85 - ph],[px + pw,H * .85]);

        SS('rgba(90,80,60,.4)'); lnW(1); plS([px - pw * .3, H * .82],[px - pw * .3, H * .85 - ph * .8])
      });

      FS('#8a7a5c'); bnd(.82); SS('rgba(60,50,35,.5)'); lnW(1.5);
      times(7, i => {
        const px = W * rng(), py = H * (.84 + rng() * .13); plS([px, py],[px + W * (rng() - .5) * .06, py + H * .04],[px + W * (rng() - .5) * .08, py + H * .08])
      });

      SS('#6a8a50'); lnW(1.5);
      times(6, i => {
        const px = W * rng(); plS([px, H * .85],[px + W * .008, H * .82, px + W * .004, H * .8])
      })
    } else if (pr === 'loch') {
      const rng = mulberry32(251);

      sky([[0,'#7a8a95'],[.5,'#4a5a68'],[1,'#2a3a48']]);

      FS('#3a4a52'); poly([0,H * .45],[W * .3,H * .25,W * .55,H * .42],[W * .8,H * .52,W,H * .44],[W,H * .6],[W,H * .6],[0,H * .6]);

      FS('#2a3a40'); const cx = W * .52, cy = H * .34; rect(cx, cy, W * .015, H * .06); rect(cx + W * .02, cy - H * .01, W * .012, H * .07);

      FS(lg(0, H * .58, 0, H,[0, '#1a3a50',1, '#0e2a3a'])); bnd(.58);

      FS('rgba(50,70,80,.35)'); poly([W * .3,H * .58],[W * .45,H * .7,W * .55,H * .58]);

      times(3, i => {
        const my = H * (.5 + i * .07) + SI(t * .3 + i) * H * .01;
        FS(`rgba(200,215,220,${.1 + i * .05})`);
        ellP(W * .5 + SI(t * .15 + i) * W * .05, my, W * (.3 + i * .1), H * .02)
      });

      FS('rgba(160,200,220,.3)'); scat(251, 10, (rng, i) => {
        const px = W * rng(), py = H * (.62 + rng() * .32); ellP(px + SI(t + i) * W * .008, py, W * .015, H * .002)
      });

      SS('#202830'); lnW(1.5);
      times(2, i => {
        const bx = W * (.3 + i * .35) + SI(t * .4 + i) * W * .04; const by = H * .3 + SI(t * .8 + i * 2) * H * .02; bP(); aR(bx - W * .006, by, W * .006, PI * 1.1, PI * 1.9); aR(bx + W * .006, by, W * .006, PI * 1.1, PI * 1.9); sK()
      })
    } else if (pr === 'cenote') {

      sky([[0,'#2a3a30'],[.45,'#1a4a55'],[1,'#0d3540']]);

      FS('#bfe8f0'); ellP(W * .5, 0, W * .18, H * .05);

      FS('rgba(160,230,240,.12)'); mv(W * .42, H * .02); mT(W * .42, H * .02); lT(W * .58, H * .02); lT(W * .65, H * .75); lT(W * .65, H * .75); lT(W * .35, H * .75); cP(); cP(); fL();

      FS('#3d4a3a'); mv(0, 0); mT(0, 0); lT(W * .22, 0); qT(W * .18, H * .3, W * .2, H * .55); lT(W * .18, H); lT(W * .18, H); lT(0, H); cP(); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .78, 0); qT(W * .82, H * .3, W * .8, H * .55); lT(W * .82, H); lT(W * .82, H); lT(W, H); cP(); cP(); fL();

      const rng = mulberry32(237); SS('#4a5a40'); lnW(1.5);
      times(8, i => {
        const px = W * (.3 + rng() * .4); const len = H * (.08 + rng() * .15); plS([px, H * .04],[px + SI(i) * W * .01, H * .04 + len * .5, px + SI(i * 1.7) * W * .015, H * .04 + len])
      });

      FS('#2a8a9a'); bnd(.72); FS('rgba(180,240,250,.25)');
      times(4, i => {
        const wx = (W * (.1 + i * .25) + SI(t * .6 + i) * W * .04); ellP(wx, H * .74, W * .05, H * .006)
      });

      FS('rgba(200,230,220,.6)');
      times(3, i => {
        const fx = W * .5 + SI(t * .5 + i * 2.1) * W * (.08 + i * .04); const fy = H * (.8 + i * .05) + CO(t * .8 + i) * H * .015; ellP(fx, fy, W * .011, H * .0045)
      })
    } else if (pr === 'kelp') {

      sky([[0,'#2a5a70'],[.5,'#1a4a58'],[1,'#0e3540']]);

      times(4, i => {
        const gx = W * (.15 + i * .22) + SI(t * .2 + i) * W * .02; FS('rgba(150,220,230,.07)'); mv(gx, 0); mT(gx, 0); lT(gx + W * .1, 0); lT(gx + W * .16, H); lT(gx + W * .16, H); lT(gx + W * .06, H); cP(); cP(); fL()
      });
      const rng = mulberry32(223);

      times(14, i => {
        const px = W * (.04 + rng() * .92); const kh = H * (.3 + rng() * .45); const sway = SI(t * .8 + i) * W * .012; SS(['#2a6a3a', '#3a7a45', '#1f5a35'][FL(rng() * 3)]); lnW(2 + rng() * 3); plS([px, H],[px + sway * .4, H - kh * .6, px + sway, H - kh]);

        FS('#3a8a50'); ellP(px + sway, H - kh, W * .008, H * .02, sway * 2)
      });

      FS('rgba(180,220,230,.7)');
      times(8, i => {
        const fx = (W * (.1 + i * .11) + t * W * .03) % (W * 1.1); const fy = H * (.2 + (i % 3) * .12) + SI(t * 1.5 + i) * H * .02; ellP(fx, fy, W * .012, H * .005); mv(fx - W * .012, fy); mT(fx - W * .012, fy); lT(fx - W * .018, fy - H * .006); mT(fx - W * .012, fy); lT(fx - W * .018, fy - H * .006); lT(fx - W * .018, fy + H * .006); cP(); cP(); fL()
      });

      FS('#153038');
      times(6, i => {
        const px = W * (i / 6) + rng() * W * .08; ellP(px, H * .98, W * (.04 + rng() * .04), H * (.02 + rng() * .015))
      })
    } else if (pr === 'hamada') {

      sky([[0,'#d8a878'],[.4,'#c08858'],[1,'#98704a']]);

      FS('#f8e0a8'); dot(.3,.16,H * .08); const rng = mulberry32(211);

      FS('#a07850'); mv(0, H * .42);
      span(0, 10, x => {
        lT(W * x / 10, H * (.42 - (x % 3 === 0 ? .04 : .01) - SI(x * 1.3) * .015))
      })
      lT(W, H * .42); lT(W, H); lT(0, H); cP(); fL();

      FS('#a88058'); bnd(.42); SS('rgba(90,60,40,.35)'); lnW(1);
      times(18, i => {
        const px = W * rng(), py = H * (.5 + rng() * .48); plS([px, py],[px + (rng() - .5) * W * .08, py + rng() * H * .03])
      });

      times(30, i => {
        const px = W * rng(), py = H * (.45 + rng() * .52); const s = rng(); FS(['#7a5a3a', '#8a6a48', '#6a4a30'][FL(rng() * 3)]); ellP(px, py, W * (.004 + s * .01), H * (.002 + s * .005), rng() * .5)
      });

      FS('rgba(230,200,160,.2)');
      times(4, i => {
        const y = H * (.55 + i * .12) + SI(t * .5 + i * 2) * H * .01; ellP(W * .5, y, W * .45, H * .025)
      });

      SS('rgba(255,240,210,.3)'); lnW(1.5);
      times(3, i => {
        const y = H * (.44 + i * .015); plS([W * .2, y],[W * .5, y + SI(t * .8 + i) * H * .006, W * .8, y])
      })
    } else if (pr === 'meseta') {

      sky([[0,'#d8c090'],[.45,'#c8a870'],[1,'#a88558']]);

      FS('#f8e8b0'); dot(.75,.14,H * .07); const rng = mulberry32(199);

      FS('#b08a5f'); mv(0, H * .42);
      span(0, 8, x => {
        lT(W * x / 8, H * (.42 - SI(x * .9) * .025))
      })
      lT(W, H * .42); lT(W, H); lT(0, H); cP(); fL();

      times(80, i => {
        const px = W * rng(), py = H * (.45 + rng() * .52); FS(['#8a7040', '#9a8050', '#7a6038'][FL(rng() * 3)]); gA(.4 + rng() * .4); ellP(px, py, W * .006, H * .003, rng() * .6)
      });
      gA(1);

      FS('#4a3a28'); rect(W * .24, H * .5, W * .008, H * .09); FS('#4a5a2e'); ell(.244,.48,W * .035,H * .028); ell(.228,.5,W * .02,H * .02);

      SS('#4a4038'); lnW(1.5);
      times(2, i => {
        const ang = t * .4 + i * PI; const bx = W * (.55 + CO(ang) * .12); const by = H * (.2 + SI(ang) * .04); plS([bx - W * .015, by],[bx, by - H * .012, bx + W * .015, by])
      });

      times(12, i => {
        const px = W * rng(), py = H * (.85 + rng() * .13); FS('#8a7a60'); ellP(px, py, W * (.008 + rng() * .01), H * (.004 + rng() * .005), rng() * .4)
      })
    } else if (pr === 'steppe') {

      sky([[0,'#90b0d0'],[.4,'#c8c8a0'],[1,'#a0986a']]); const rng = mulberry32(191);

      FS('rgba(255,255,255,.75)');
      for (const [cx, cy, s] of [[.25, .18, 1], [.68, .12, .7]]) {
        bP(); eC(W * cx, H * cy, W * .12 * s, H * .05 * s, 0, 0, 7); eC(W * cx, H * cy, W * .12 * s, H * .05 * s, 0, 0, 7); fL(); bP(); eC(W * (cx + .05 * s), H * (cy - .03 * s), W * .08 * s, H * .045 * s, 0, 0, 7); eC(W * (cx + .05 * s), H * (cy - .03 * s), W * .08 * s, H * .045 * s, 0, 0, 7); fL()
      }

      FS('#98905f'); bnd(.42);

      times(70, i => {
        const px = W * rng(), py = H * (.45 + rng() * .52); const dep = (py / H - .45) / .55; const sway = SI(t * 1.2 + px * .01) * W * .004 * (.5 + dep); SS(['#b8a870', '#c8b880', '#a89860'][FL(rng() * 3)]); lnW(1); plS([px, py],[px + sway * .5, py - H * .03, px + sway, py - H * (.035 + dep * .02)])
      });

      FS('#5a5040');
      times(3, i => {
        const hx2 = W * (.3 + i * .18 + rng() * .06); const hy2 = H * .43; ellP(hx2, hy2, W * .012, H * .005); rect(hx2 - W * .002, hy2 - H * .018, W * .004, H * .014)
      });

      FS('#4a5a38'); rect(W * .82, H * .38, W * .005, H * .045); ell(.822,.37,W * .02,H * .02)
    } else if (pr === 'glen') {

      sky([[0,'#98a8b8'],[.4,'#889888'],[1,'#586848']]); const rng = mulberry32(181);

      FS('#4a6038'); mv(0, 0); mT(0, 0); lT(W * .3, 0); qT(W * .38, H * .35, W * .28, H); lT(0, H); lT(0, H); cP(); lT(0, H); cP(); fL(); FS('#42562e'); mv(W, 0); mT(W, 0); lT(W * .7, 0); qT(W * .62, H * .35, W * .72, H); lT(W, H); lT(W, H); cP(); lT(W, H); cP(); fL();

      FS('#3a5028');
      times(26, i => {
        const side = rng() < .5 ? 0 : 1; const px = side ? W * (.72 + rng() * .26) : W * (rng() * .28); const py = H * (.15 + rng() * .7); ellP(px, py, W * .008, H * .01)
      });

      FS('rgba(220,228,235,.25)');
      times(3, i => {
        const y = H * (.3 + i * .18) + SI(t * .3 + i) * H * .01; ellP(W * .5, y, W * .35, H * .04)
      });

      SS('#a8c8d8'); lnW(5); plS([W * .48, H],[W * (.52 + S(.4) * .01), H * .75, W * .5, H * .55],[W * .48, H * .4, W * .5, H * .3]); SS('rgba(230,245,255,.6)'); lnW(1.5); plS([W * .48, H],[W * (.52 + S(.4) * .01), H * .75, W * .5, H * .55]);

      times(8, i => {
        const px = W * (.42 + rng() * .16), py = H * (.6 + rng() * .38); FS('#6a6a60'); ellP(px, py, W * .012, H * .006, rng() * .5)
      })
    } else if (pr === 'cove') {

      sky([[0,'#a8c8e0'],[.4,'#b8d0e0'],[1,'#d8c8a0']]); const rng = mulberry32(173);

      FS('#7a7058'); mv(0, 0); mT(0, 0); lT(W * .18, 0); qT(W * .3, H * .3, W * .22, H * .55); lT(0, H * .7); lT(0, H * .7); cP(); lT(0, H * .7); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .82, 0); qT(W * .72, H * .35, W * .78, H * .6); lT(W, H * .75); lT(W, H * .75); cP(); lT(W, H * .75); cP(); fL();

      FS('#5a7048'); mv(0, 0); mT(0, 0); lT(W * .18, 0); mT(0, 0); lT(W * .18, 0); lT(W * .22, H * .08); mT(0, 0); lT(W * .18, 0); lT(W * .22, H * .08); lT(0, H * .1); mT(0, 0); lT(W * .18, 0); lT(W * .22, H * .08); lT(0, H * .1); cP(); mT(0, 0); lT(W * .18, 0); lT(W * .22, H * .08); lT(0, H * .1); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .82, 0); mT(W, 0); lT(W * .82, 0); lT(W * .78, H * .09); mT(W, 0); lT(W * .82, 0);
      lT(W * .78, H * .09); lT(W, H * .12); mT(W, 0); lT(W * .82, 0); lT(W * .78, H * .09); lT(W, H * .12); cP(); mT(W, 0); lT(W * .82, 0); lT(W * .78, H * .09); lT(W, H * .12); cP(); fL();

      FS('#5a8aa8'); poly([0,H * .7],[W * .5,H * .5,W,H * .75],[W,H],[W,H],[0,H],[W,H],[0,H],[W,H],[0,H]);

      SS('rgba(230,245,255,.5)'); lnW(1);
      times(10, i => {
        const y = H * (.62 + i * .035); plS([W * (.25 + rng() * .2), y],[W * (.45 + rng() * .25), y])
      });

      const bx = W * (.45 + S(.2) * .03), by = H * .62; FS('#8a5a38'); poly([bx - W * .03,by],[bx,by + H * .02,bx + W * .03,by],[bx + W * .025,by - H * .008],[bx - W * .025,by - H * .008]); SS('#6a4a30'); lnW(1.5); plS([bx, by - H * .008],[bx, by - H * .055]);

      FS('#d8c098'); mv(0, H); mT(0, H); lT(0, H * .92); qT(W * .3, H * .85, W * .6, H * .95); lT(W, H * .98); lT(W, H * .98); lT(W, H); lT(W, H * .98); lT(W, H); cP(); lT(W, H * .98); lT(W, H); cP(); fL();

      times(14, i => {
        FS(['#b09070', '#c8a880', '#a88868'][FL(rng() * 3)]); dot(rng(), (.9 + rng() * .09), W * .003)
      })
    } else if (pr === 'fen') {

      sky([[0,'#b8c8d8'],[.45,'#a8b898'],[1,'#788868']]); const rng = mulberry32(163);

      FS('#8aa0b0'); poly([W * .35,H],[W * .3,H * .8,W * .42,H * .62],[W * .55,H * .45,W * .48,H * .3],[W * .56,H * .3],[W * .62,H * .5,W * .5,H * .65],[W * .38,H * .82,W * .45,H]);

      SS('rgba(220,235,245,.4)'); lnW(1);
      times(8, i => {
        const y = H * (.55 + i * .05); plS([W * (.3 + rng() * .15), y],[W * (.42 + rng() * .12), y])
      });

      for (let i = 0; i < 40; i++) {
        const px = W * rng();
        if (px > W * .33 && px < W * .58) continue;
        const py = H * (.42 + rng() * .55); const hgt = H * (.04 + rng() * .06); SS(['#5a7048', '#6a8058', '#7a8858'][FL(rng() * 3)]); lnW(1.2); plS([px, py],[px + W * .002, py - hgt * .6, px + (rng() - .5) * W * .008, py - hgt]);

        FS('#8a7a50'); ellP(px + (rng() - .5) * W * .008, py - hgt, W * .003, H * .012)
      }

      FS('#5a6a58');
      times(9, i => {
        const px = W * (i / 9) + rng() * W * .03; rect(px, H * .36 - H * (.01 + rng() * .015), W * .008, H * .04)
      });

      SS('#4a5560'); lnW(1.2);
      times(4, i => {
        const bx = W * (.15 + i * .2 + rng() * .1), by = H * (.12 + rng() * .1); plS([bx - W * .012, by],[bx, by - H * .01, bx + W * .012, by])
      })
    } else if (pr === 'cirque') {

      sky([[0,'#a8b8d0'],[.4,'#9098a8'],[1,'#687078']]); const rng = mulberry32(151);

      FS('#7a7f88'); mv(0, 0); mT(0, 0); lT(W * .22, 0); qT(W * .32, H * .4, W * .2, H); lT(0, H); lT(0, H); cP(); lT(0, H); cP(); fL(); mv(W, 0); mT(W, 0); lT(W * .78, 0); qT(W * .68, H * .4, W * .8, H); lT(W, H); lT(W, H); cP(); lT(W, H); cP(); fL();

      SS('rgba(50,55,65,.4)'); lnW(1.2);
      times(10, i => {
        const y = H * (.1 + i * .09); plS([W * (.1 + rng() * .12), y],[W * .25, y + H * .02, W * (.18 + rng() * .1), y + H * .06]); plS([W * (.78 + rng() * .1), y],[W * .75, y + H * .02, W * (.72 + rng() * .1), y + H * .06])
      });

      FS('#e0e8f0'); poly([W * .38,H * .1],[W * .5,H * .05,W * .62,H * .1],[W * .58,H * .22,W * .5,H * .26],[W * .42,H * .22,W * .38,H * .1]);

      SS('rgba(230,240,255,.85)'); lnW(3); plS([W * .5, H * .26],[W * (.5 + S(.6) * .008), H * .5, W * .5, H * .74]);

      FS('#5a7a9a'); bP(); eC(W * .5, H * .78, W * .18, H * .05, 0, 0, 7); eC(W * .5, H * .78, W * .18, H * .05, 0, 0, 7); fL(); FS('rgba(220,235,255,.5)'); bP(); eC(W * .5, H * .76, W * .1, H * .015, 0, 0, 7); eC(W * .5, H * .76, W * .1, H * .015, 0, 0, 7); fL();

      times(12, i => {
        const px = W * (.2 + rng() * .6), py = H * (.82 + rng() * .16); FS('#6a7078'); ellP(px, py, W * (.008 + rng() * .012), H * (.004 + rng() * .006), rng() * .5)
      })
    } else if (pr === 'dune') {
      const rng = mulberry32(139);

      sky([[0,'#c8d8e8'],[.35,'#e8d8b0'],[1,'#c8a878']]);

      FS('#7a9ab8'); rect(0, H * .38, W, H * .07);

      FS('#d8b888'); mv(0, H); mT(0, H); lT(0, H * .55); qT(W * .25, H * .42, W * .5, H * .58); qT(W * .75, H * .7, W, H * .55); lT(W, H); lT(W, H); cP(); lT(W, H); cP(); fL(); FS('#c8a070'); mv(0, H); mT(0, H); lT(0, H * .72); qT(W * .3, H * .6, W * .65, H * .78); qT(W * .85, H * .9, W, H * .82); lT(W, H); lT(W, H); cP(); lT(W, H); cP(); fL();

      SS('rgba(160,120,70,.4)'); lnW(1.2);
      times(22, i => {
        const y = H * (.55 + i * .02); plS([W * .05, y],[W * (.3 + SI(i * .8) * .1), y - H * .01, W * .7, y])
      });

      SS('rgba(255,230,180,.6)'); lnW(2); plS([0, H * .55],[W * .25, H * .42, W * .5, H * .58]);

      scat(139, 18, (rng, i) => {
        const px = W * (.05 + rng() * .9), py = H * (.6 + rng() * .38); SS('#8a7a50'); lnW(1);
        times(4, j => {
          plS([px, py],[px + (j - 1.5) * W * .004, py - H * .025, px + (j - 1.5) * W * .006, py - H * .04])
        })
      })
    } else if (pr === 'quarry') {

      sky([[0,'#b8a890'],[.4,'#a09070'],[1,'#806f55']]); const rng = mulberry32(131);

      const bench = [.52, .68, .84];
      times(bench.length, s => {
        const y = H * bench[s]; FS(['#8a7a60', '#7a6a50', '#6a5a44'][s]); rect(0, y, W, H * .16);

        SS('rgba(60,50,35,.35)'); lnW(1);
        times(20, x => {
          const sx = W * (x / 20) + rng() * W * .03; plS([sx, y],[sx - rng() * W * .01, y + H * .14])
        })
      });

      SS('#4a4038'); lnW(3); bP(); mv(W * .15, H * .52); mv(W * .15, H * .52); lT(W * .15, H * .15); plS([W * .15, H * .52],[W * .15, H * .15]); bP(); mv(W * .15, H * .15); mv(W * .15, H * .15); lT(W * .45, H * .12); plS([W * .15, H * .15],[W * .45, H * .12]); lnW(1.5); plS([W * .45, H * .12],[W * .45, H * .28]); FS('#5a5048');
      rect(W * .43, H * .28, W * .04, H * .05);

      times(14, i => {
        const px = W * rng(), py = H * (.86 + rng() * .12); FS('#6a5a48'); ellP(px, py, W * (.01 + rng() * .015), H * (.005 + rng() * .008), rng() * .4)
      })
    } else if (pr === 'tundra') {

      sky([[0,'#c8b8a0'],[.45,'#a89878'],[1,'#8a8068']]);

      FS('rgba(255,220,170,.9)'); dot(.7,.38,H * .05); const rng = mulberry32(118);

      FS('#94866a'); mv(0, H); mT(0, H); lT(0, H * .48);
      span(0, 12, x => {
        lT(W * x / 12, H * (.48 + SI(x * .7) * .015))
      })
      lT(W, H); cP(); fL();

      times(60, i => {
        const px = W * rng(), py = H * (.5 + rng() * .47); const cols = ['#7a8a58', '#8a7a50', '#a08858', '#6a7a50']; FS(cols[FL(rng() * 4)]); gA(.3 + rng() * .4); ellP(px, py, W * .015 * (1 + rng()), H * .006 * (1 + rng()))
      });
      gA(1);

      times(5, i => {
        const px = W * (.1 + rng() * .8), py = H * (.55 + rng() * .35); FS('#7a7468'); ellP(px, py, W * (.015 + rng() * .02), H * (.008 + rng() * .006), rng() * .5)
      });

      FS('#4a4038'); SS('#4a4038'); lnW(1.2);
      times(6, i => {
        const cx = W * (.12 + i * .14 + rng() * .05); const cy = H * (.5 + rng() * .04); bP(); bP(); eC(cx, cy, W * .008, H * .004, 0, 0, 7); ellP(cx, cy, W * .008, H * .004); bP(); mv(cx + W * .006, cy - H * .003); mv(cx + W * .006, cy - H * .003); lT(cx + W * .01, cy - H * .01); mv(cx + W * .006, cy - H * .003); lT(cx + W * .01, cy - H * .01); lT(cx + W * .013, cy - H * .006); plS([cx + W * .006, cy - H * .003],[cx + W * .01, cy - H * .01],[cx + W * .013, cy - H * .006])
      })
    } else if (pr === 'wadi') {

      sky([[0,'#e0b880'],[.5,'#c89868'],[1,'#a88058']]); const rng = mulberry32(111);

      FS('#b08858'); mv(0, H * .38);
      span(0, 10, x => {
        lT(W * x / 10, H * (.38 - SI(x * 1.2) * .05))
      })
      lT(W, H * .38); lT(W, H * .38); lT(W, H * .44); lT(W, H * .38); lT(W, H * .44); lT(0, H * .44); cP(); cP(); fL();

      FS('#986c44'); mv(0, H); mT(0, H); lT(0, H * .5);
      span(0, 4, x => {
        lT(W * x * .06, H * (.5 + x * .02) + SI(x * 2) * H * .02)
      })
      lT(0, H); lT(0, H); cP(); lT(0, H); cP(); fL(); mv(W, H); mT(W, H); lT(W, H * .45);
      span(0, 4, x => {
        lT(W - W * x * .07, H * (.45 + x * .03) + SI(x * 1.8) * H * .02)
      })
      lT(W, H); cP(); fL();

      FS('#c0a070'); poly([0,H],[W * .1,H * .55],[W * .5,H * .5,W * .9,H * .58],[W,H]);

      times(26, i => {
        const px = W * (.1 + rng() * .8); const py = H * (.58 + rng() * .38); const s = (.5 + rng()) * (py - H * .5) / (H * .5) + .3;
        FS(`rgba(${140 + FL(rng() * 60)},${110 + FL(rng() * 40)},${80 + FL(rng() * 30)},.85)`);
        ellP(px, py, W * .02 * s, H * .01 * s, rng())
      });

      SS('#6a4a30'); lnW(4); plS([W * .55, H * .82],[W * .65, H * .78, W * .78, H * .84]); plS([W * .66, H * .8],[W * .7, H * .75])
    } else if (pr === 'saltflat') {

      sky([[0,'#e8ecf0'],[.5,'#d8dde0'],[1,'#f0ece4']]); const rng = mulberry32(104);

      FS('#b8c0c8'); mv(0, H * .42);
      span(0, 10, x => {
        lT(W * x / 10, H * (.42 - SI(x * 1.4 + 1) * .08))
      })
      lT(W, H * .42); lT(W, H * .42); lT(W, H * .45); lT(W, H * .42); lT(W, H * .45); lT(0, H * .45); cP(); cP(); fL();

      FS('#f4f2ea'); bnd(.45);

      SS('rgba(160,155,140,.5)'); lnW(1);
      times(5, row => {
        times(6, col => {
          const cx = W * (col / 6 + (row % 2 ? .08 : 0)) + W * .02; const cy = H * (.5 + row * .1); const s = W * .045 * (1 - row * .08); bP();
          times(6, v => {
            const va = v * PI / 3 + .5; const px = cx + CO(va) * s, py = cy + SI(va) * s * .4; v ? lT(px, py) : mT(px, py)
          });
          cP(); sK()
        })
      });

      times(3, i => {
        const py = H * (.5 + i * .12); FS('rgba(180,205,220,.5)'); ellP(W * (.25 + i * .3), py, W * .12, H * .015);

        FS('rgba(160,170,180,.35)'); ellP(W * (.25 + i * .3), py + H * .005, W * .06, H * .005)
      });

      FS(`rgba(255,255,255,${.3 + S(1.5) * .15})`);
      ell(.6, .52, W * .15, H * .03)
    } else if (pr === 'highland') {

      sky([[0,'#a8c8dc'],[.55,'#c8d8b8'],[1,'#7aa05a']]); const rng = mulberry32(97);

      const hills = ['#88a868', '#6f9450', '#5c8044'];
      spt(0, 3, h => {
        FS(hills[h]); mv(0, H); lT(0, H * (.48 + h * .12));
        for (let x = 0; x <= 12; x++) {
          lT(W * x / 12, H * (.48 + h * .12) + SI(x * .9 + h * 2.1) * H * .05)
        }
        lT(W, H); cP(); fL()
      })

      SS('#8a8a80'); lnW(4); mv(0, H * .6);
      span(0, 14, x => {
        lT(W * x / 14, H * (.6 + x * .012) + SI(x * .7) * H * .02)
      })
      sK();

      SS('rgba(60,60,55,.4)'); lnW(1);
      span(0, 14, x => {
        const sx = W * x / 14; const sy = H * (.6 + x * .012) + SI(x * .7) * H * .02; plS([sx, sy - 4],[sx, sy + 4])
      })

      times(8, i => {
        const sx = W * (.08 + rng() * .85); const sy = H * (.55 + rng() * .35); FS('#f0f0e8'); ellP(sx, sy, W * .008, H * .005); FS('#3a3a34'); ellP(sx + W * .008, sy - H * .002, W * .0025, H * .002)
      });

      times(3, i => {
        const cx2 = ((t * .02 + i * .35) % 1.3 - .15) * W; FS('rgba(255,255,255,.5)'); ellP(cx2, H * (.1 + i * .08), W * .07, H * .018)
      })
    } else if (pr === 'delta') {

      sky([[0,'#a8d0e0'],[.5,'#88b8b0'],[1,'#c8d0a8']]); const rng = mulberry32(91);

      FS('#8aa868'); bnd(.4);

      FS('#6a9ab0'); rect(0, H * .36, W, H * .05);

      SS('#5a8a98');
      times(4, ch => {
        const lw = 6 + ch * 4; lnW(lw); bP(); let cx = W * (.15 + ch * .22); mT(cx, H * .4);
        times(6, seg => {
          const ny = H * (.4 + (seg + 1) * .1); cx += (rng() - .5) * W * .06 + (seg > 2 ? (ch - 1.5) * W * .02 : 0); lT(cx, MN(ny, H * .98))
        });
        sK()
      });

      SS('rgba(220,220,180,.4)'); lnW(2);
      times(3, ch => {
        bP(); let cx = W * (.2 + ch * .25); mT(cx, H * .5);
        times(5, seg => {
          cx += (rng() - .5) * W * .05; lT(cx, H * (.5 + (seg + 1) * .1))
        });
        sK()
      });

      times(20, i => {
        const rx = W * rng(), ry = H * (.55 + rng() * .4); SS('#4a6a3a'); lnW(1); plS([rx, ry],[rx + 1, ry - H * (.02 + rng() * .015)])
      });

      SS('#3a4a44'); lnW(1.5);
      times(3, b => {
        const bx = W * (.15 + b * .3 + SI(t * .3 + b) * .05); const by = H * (.15 + b * .07); plS([bx - W * .012, by],[bx, by - H * .008 - SI(t * 6 + b) * 3, bx + W * .012, by])
      })
    } else if (pr === 'mangrove') {

      sky([[0,'#b8d0a8'],[.45,'#7a9a78'],[1,'#4a6a58']]); const rng = mulberry32(84);

      times(8, i => {
        FS(`rgba(50,90,60,${.5 + rng() * .3})`);
        ell(rng(), rng() * .18, W * (.08 + rng() * .06), H * (.05 + rng() * .03))
      });

      FS('#5a7a68'); mv(0, H); mT(0, H); lT(0, H * .62);
      span(0, 12, x => {
        lT(W * x / 12, H * (.62 + SI(x * 1.1 + t * .5) * .008))
      })
      lT(W, H); cP(); fL();

      SS('rgba(200,230,200,.25)'); lnW(1);
      times(8, i => {
        const wy = H * (.65 + i * .04); plS([W * rng() * .3, wy],[W * (.5 + rng() * .5), wy])
      });

      SS('#4a3a2a'); lnW(3);
      spt(0, 4, tr => {
        const tx = W * (.12 + tr * .25 + rng() * .06); const ty = H * (.35 + rng() * .1);

        plS([tx, ty],[tx, ty - H * .15]);
        for (let r = -3; r <= 3; r++) {
          plS([tx, ty],[tx + r * W * .02, H * .75])
        }

        FS('#3a6a44');
        times(4, lf => {
          ellP(tx + rng() * W * .04 - W * .02, ty - H * (.14 + rng() * .1), W * .02, H * .012, rng() * 3)
        })
      })

      FS('#e8e8e0'); const bx = W * .75, by = H * .68; ellP(bx, by, W * .012, H * .008); SS('#e8e8e0'); lnW(2); plS([bx, by],[bx, by + H * .02]); SS('#e8e8e0'); plS([bx + W * .008, by - H * .006],[bx + W * .015, by - H * .014])
    } else if (pr === 'taiga') {

      sky([[0,'#d8e4f0'],[.5,'#a8bcd4'],[1,'#d0dcd8']]);

      FS('rgba(255,235,190,.9)'); dot(.2,.3,H * .055); const rng = mulberry32(77);

      FS('#e8ecf0');
      times(3, m => {
        const mx = W * (m * .35 + .05); poly([mx,H * .45],[mx + W * .12,H * (.22 + rng() * .06)],[mx + W * .24,H * .45])
      });

      times(22, i => {
        const tx = W * rng(); const ty = H * (.45 + rng() * .04); FS('rgba(70,100,90,.55)'); mv(tx, ty); mT(tx, ty); lT(tx + W * .012, ty - H * .05); mT(tx, ty); lT(tx + W * .012, ty - H * .05); lT(tx + W * .024, ty); cP(); cP(); fL()
      });

      FS('#e4ecea'); mv(0, H); mT(0, H); lT(0, H * .55);
      span(0, 12, x => {
        lT(W * x / 12, H * (.55 + SI(x * 1.3) * .02))
      })
      lT(W, H); cP(); fL();

      times(30, i => {
        FS(`rgba(255,255,255,${.3 + rng() * .4})`);
        rect(W * rng(), H * (.55 + rng() * .42), W * .008, H * .004)
      });

      times(7, i => {
        const tx = W * (.06 + i * .14 + rng() * .05); const ty = H * (.62 + rng() * .25); const th = H * (.14 + rng() * .07); FS('#33524a'); rect(tx + W * .006, ty - th * .3, W * .008, th * .3);
        times(3, l => {
          const lw = W * (.045 - l * .012); const ly = ty - th * (.3 + l * .28); poly([tx - lw / 2 + W * .01,ly],[tx + W * .01,ly - th * .32],[tx + lw / 2 + W * .01,ly])
        });

        FS('rgba(255,255,255,.55)'); ellP(tx + W * .01, ty - th * .75, W * .016, H * .005)
      })
    } else if (pr === 'badlands') {

      sky([[0,'#e8b070'],[.5,'#c88858'],[1,'#a06848']]);

      FS('#fff0d0'); dot(.78,.16,H * .07); const rng = mulberry32(71);

      const bands = ['#c07850', '#b06040', '#d08858', '#a85838', '#c88050'];
      times(4, i => {
        const ty = H * (.3 + i * .13);
        times(3, m => {
          const mx = W * (m * .35 + rng() * .1); const mw = W * (.18 + rng() * .1); FS(bands[(i + m) % 5]); rect(mx, ty, mw, H * .07)
        })
      });

      FS('#b06844'); mv(0, H); mT(0, H); lT(0, H * .62);
      span(0, 12, x => {
        lT(W * x / 12, H * (.62 + SI(x * .8) * .025))
      })
      lT(W, H); cP(); fL();

      SS('rgba(150,80,50,.6)'); lnW(2);
      spt(0, 6, i => {
        const sy = H * (.68 + i * .045); bP();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = sy + SI(x * .8 + i) * H * .012; x ? lT(px, py) : mT(px, py)
        }
        sK()
      })

      times(5, i => {
        const bx = W * (.08 + i * .2 + rng() * .08); const by = H * (.72 + rng() * .2); FS('#6a7a50');
        times(4, b => {
          ellP(bx + rng() * W * .012 - W * .006, by - rng() * H * .012, W * .008, H * .005)
        })
      });

      SS(`rgba(255,240,210,${.15 + S(2) * .08})`);
      lnW(1);
      spt(0, 3, i => {
        const hy = H * (.35 + i * .08); bP();
        for (let x = 0; x <= 8; x++) {
          const px = W * x / 8; const py = hy + SI(x * 2 + t * 3 + i) * 2; x ? lT(px, py) : mT(px, py)
        }
        sK()
      })
    } else if (pr === 'pond') {

      sky([[0,'#9ec8b8'],[.45,'#6a9888'],[1,'#3a6860']]); const rng = mulberry32(64);

      FS('#7aa870'); mv(0, 0); mT(0, 0); lT(W, 0); mT(0, 0); lT(W, 0); lT(W, H * .12);
      for (let x = 12; x >= 0; x--) {
        lT(W * x / 12, H * (.12 + SI(x * .9) * .02))
      }
      cP(); fL();

      times(4, i => {
        const ph = (t * .4 + i * .25) % 1; const rx = W * (.15 + i * .23), ry = H * (.55 + (i % 2) * .15);
        SS(`rgba(255,255,255,${(1 - ph) * .35})`);
        lnW(1.5); ellPS(rx, ry, W * (.02 + ph * .12), H * (.008 + ph * .03))
      });

      const kx = W * ((t * .06) % 1.4 - .2); const ky = H * (.72 + S(.9) * .03); FS('rgba(20,40,38,.5)'); ellP(kx, ky, W * .05, H * .014, S(1.5) * .08);

      times(5, i => {
        const lx = W * (.08 + i * .2 + rng() * .06); const ly = H * (.5 + rng() * .4); FS('#3f7a55'); bP(); eC(lx, ly, W * .035, H * .012, rng() * .4, .3, PI * 2 - .3); fL();
        if (i % 2 === 0) {
          FS('#f0b8c8');
          times(5, p => {
            const pa = p * 1.257; ellP(lx + CO(pa) * W * .008, ly - H * .012 + SI(pa) * H * .004, W * .006, H * .004, pa)
          })
        }
      });

      const dx = W * (.2 + .6 * A(.5)); const dy = H * (.35 + S(3) * .04); SS('rgba(60,80,90,.8)'); lnW(1); plS([dx - W * .015, dy],[dx + W * .015, dy]); FS('rgba(120,180,200,.6)'); ellP(dx, dy - H * .008, W * .02, H * .005)
    } else if (pr === 'tide') {

      sky([[0,'#a8c0d0'],[.4,'#c8d0c8'],[1,'#a89878']]);

      FS('#7a9ab0'); rect(0, H * .38, W, H * .05); const rng = mulberry32(58);

      FS('#b0a088'); bnd(.43); SS('rgba(140,125,95,.5)'); lnW(2);
      spt(0, 10, i => {
        const wy = H * (.46 + i * .05); bP();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = wy + SI(x * 1.1 + i * 2) * H * .006; x ? lT(px, py) : mT(px, py)
        }
        sK()
      })

      times(4, i => {
        const px = W * (.15 + i * .22); const py = H * (.52 + rng() * .3); FS('rgba(190,215,230,.7)'); ellP(px, py, W * (.05 + rng() * .04), H * (.012 + rng() * .01));

        FS(`rgba(255,255,255,${.3 + SI(t * 2 + i) * .2})`);
        ellP(px - W * .01, py - H * .004, W * .012, H * .003)
      });

      FS('#4a4a44');
      for (const [bx, by] of [[.3, .58], [.68, .65]]) {
        const peck = MX(0, SI(t * 2.5 + bx * 9)) * .3; ell(bx,by,W * .012,H * .008); SS('#4a4a44'); lnW(1.5); bP(); mv(W * bx, H * by + H * .008); mv(W * bx, H * by + H * .008); lT(W * bx, H * by + H * .025); plS([W * bx, H * by + H * .008],[W * bx, H * by + H * .025]); bP(); plS([W * bx + W * .01, H * by - H * .004],[W * (bx + .018), H * (by - .01) + peck * H * .03])
      }
    } else if (pr === 'grove') {

      sky([[0,'#a8c898'],[.45,'#88a878'],[1,'#5a7850']]); const rng = mulberry32(17);

      FS('#3a6038');
      times(8, i => {
        ell(rng(), (.05 + rng() * .15), W * (.1 + rng() * .08), H * (.05 + rng() * .04))
      });

      times(2, row => {
        const n = 5 + row * 2; const tw = W * (.012 + row * .01);
        times(n, i => {
          const tx = W * (.05 + i * .9 / n) + (row % 2) * W * .06; const ty0 = H * (.1 - row * .05), ty1 = H * (.8 + row * .1); FS(row ? '#5a4838' : '#6a5848'); rect(tx - tw / 2, ty0, tw, ty1 - ty0)
        })
      });

      FS('#b8a888'); mv(W * .42, H); mT(W * .42, H); lT(W * .48, H * .5); lT(W * .52, H * .5); lT(W * .52, H * .5); lT(W * .58, H); cP(); cP(); fL();

      FS('rgba(255,245,200,.22)');
      times(4, i => {
        const lx = W * (.2 + i * .2) + SI(t * .3 + i) * W * .01; mv(lx, H * .1); mT(lx, H * .1); lT(lx + W * .05, H * .1); lT(lx + W * .14, H); lT(lx + W * .14, H); lT(lx + W * .09, H); cP(); cP(); fL()
      });

      times(6, i => {
        const lx = W * ((rng() + t * .03) % 1); const ly = H * ((rng() + t * .05) % 1); FS('#88aa55'); ellP(lx, ly, W * .006, H * .004, rng() * 3 + t)
      })
    } else if (pr === 'brook') {

      sky([[0,'#90b8a8'],[.5,'#78a890'],[1,'#5a8068']]); const rng = mulberry32(49);

      FS('#4a7048'); rect(0, 0, W, H * .3); bnd(.82);

      SS('#5a8850'); lnW(2);
      times(25, i => {
        const gx = W * rng(); const gy = rng() > .5 ? H * (.26 + rng() * .04) : H * (.8 + rng() * .04); bP(); plS([gx, gy],[gx + 2, gy - H * .02, gx + 4, gy - H * .03])
      });

      FS('#6a9aa8'); rect(0, H * .3, W, H * .52); SS('rgba(230,245,250,.5)'); lnW(2);
      spt(0, 8, i => {
        const wy = H * (.33 + i * .06); bP();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = wy + SI(x * 1.2 + t * 2.5 + i) * H * .008; x ? lT(px, py) : mT(px, py)
        }
        sK()
      })

      FS('#7a7268');
      times(5, i => {
        const sx = W * (.15 + i * .18); const sy = H * (.5 + SI(i * 1.9) * .12); ellP(sx, sy, W * .045, H * .02, .1 * i);

        SS('rgba(240,250,255,.6)'); lnW(1.5); bP(); aR(sx, sy, W * .05, PI * .2, PI * .8); sK()
      })
    } else if (pr === 'moor') {

      sky([[0,'#98a0a8'],[.5,'#a8a898'],[1,'#6a7058']]); const rng = mulberry32(64);

      FS('#5a6250'); mv(0, H * .62);
      for (let i = 0; i <= 8; i++)
        lT(W * i / 8, H * (.58 + SI(i * 1.7) * .06));
      lT(W, H); lT(0, H); cP(); fL();

      times(50, i => {
        const px = W * rng(); const py = H * (.6 + rng() * .35);
        FS(`hsla(${285 + rng() * 30},30%,${40 + rng() * 20}%,.7)`);
        ellP(px, py, W * .007, H * .006)
      });

      FS('#6a6a66');
      for (const [sx, sy, ss] of [[.25, .5, .05], [.55, .47, .065], [.8, .52, .04]]) {
        poly([W * sx - W * ss * .8,H * (sy + .15)],[W * sx - W * ss * .5,H * sy],[W * sx,H * (sy - .03),W * sx + W * ss * .5,H * sy],[W * sx + W * ss * .8,H * (sy + .15)])
      }

      times(3, i => {
        const mx = W * (((t * .02 + i * .35) % 1.3) - .15); FS('rgba(220,225,225,.25)'); ellP(mx, H * (.3 + i * .12), W * .3, H * .04)
      })
    } else if (pr === 'onsen') {

      sky([[0,'#a8b8c8'],[.4,'#c8d0d8'],[1,'#98a088']]); const rng = mulberry32(88);

      FS('rgba(120,140,130,.5)'); mv(0, H * .45);
      for (let i = 0; i <= 6; i++)
        lT(W * i / 6, H * (.32 + (i % 2) * .08 - SI(i * 2.1) * .03));
      lT(W, H * .45); cP(); fL();

      FS('#b8d0d8'); ell(.5, .78, W * .42, H * .16);

      times(5, i => {
        const sx = W * (.25 + i * .13); const rise = (t * .1 + i * .2) % 1;
        FS(`rgba(255,255,255,${.35 * (1 - rise)})`);
        ellP(sx + SI(t * 1.2 + i) * W * .02,H * (.75 - rise * .35),W * (.02 + rise * .03),H * .03,0)
      });

      FS('#7a7268');
      times(12, i => {
        const a = i / 12 * PI * 2; const rx = W * .5 + CO(a) * W * .44; const ry = H * .78 + SI(a) * H * .17;
        if (ry > H * .7) {
          ellP(rx, ry, W * (.03 + rng() * .02), H * (.02 + rng() * .015), rng())
        }
      })
    } else if (pr === 'orchard') {

      sky([[0,'#88c0e0'],[.55,'#c8e0d8'],[1,'#7a9a55']]); const rng = mulberry32(55);

      times(2, row => {
        const ty = H * (.45 + row * .2); const n = 4 + row * 2; const ts = W * (.05 + row * .025);
        times(n, i => {
          const tx = W * (.08 + i * .84 / n) + (row % 2) * W * .09; const sway = SI(t * .9 + i * 1.3 + row) * W * .003;

          FS('#6a4a30'); rect(tx - ts * .08, ty, ts * .16, ts * 1.4);

          FS('#4a7a38'); bP(); bP(); aR(tx + sway, ty - ts * .3, ts * .7, 0, 7); dotP(tx + sway,ty - ts * .3,ts * .7); bP(); bP(); aR(tx - ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); dotP(tx - ts * .45 + sway,ty - ts * .05,ts * .45); bP(); bP(); aR(tx + ts * .45 + sway, ty - ts * .05, ts * .45, 0, 7); dotP(tx + ts * .45 + sway,ty - ts * .05,ts * .45);

          FS('#d84038');
          times(5, a => {
            const ax = tx + sway + (rng() - .5) * ts * 1.1; const ay = ty - ts * .35 + (rng() - .5) * ts * .7; dotP(ax, ay, ts * .09)
          })
        })
      });

      FS('#6a8a48'); bnd(.82); FS('#c03830');
      times(8, i => {
        const ax = W * rng(); const ay = H * (.84 + rng() * .12); dotP(ax, ay, W * .006)
      });

      const fall = (t * .15) % 1; FS('#d84038'); dot(.3, (.4 + fall * .45), W * .008)
    } else if (pr === 'cosmos') {

      sky([[0,'#8ab8d8'],[.5,'#c8d8e0'],[1,'#789a58']]);

      const rng = mulberry32(33); FS('rgba(255,255,255,.4)');
      times(4, i => {
        ellP(W * (i * .28 + .1), H * (.1 + (i % 2) * .08), W * .1, H * .015, .05)
      });

      times(2, row => {
        const ry = H * (.62 + row * .18); const n = 7 + row * 3; const fs = W * (.014 + row * .01);
        times(n, i => {
          const fx = W * (.05 + i * .9 / n) + (row % 2) * W * .05; const sway = SI(t * 1.5 + i * .7 + row) * W * .006;

          SS('#5a7a42'); lnW(MX(1, fs * .1)); plS([fx, ry + fs * 3],[fx + sway, ry]);

          const cx = fx + sway, cy = ry; const col = ['#f4e8f0', '#e8a0c0', '#d06090'][FL(rng() * 3)]; FS(col);
          times(8, p => {
            const a = p * .785; ellP(cx + CO(a) * fs, cy + SI(a) * fs, fs * .55, fs * .28, a)
          });
          FS('#e8c040'); dotP(cx, cy, fs * .35)
        })
      });

      times(2, i => {
        const bx = W * ((i * .4 + t * .05) % 1.1) - W * .05; const by = H * (.4 + SI(t * 2.2 + i * 3) * .12 + i * .15); const flap = .5 + AB(SI(t * 8 + i)) * .5; FS('rgba(240,240,255,.85)'); bP(); bP(); eC(bx - W * .006, by, W * .008, H * .007 * flap, -.4, 0, 7); ellP(bx - W * .006, by, W * .008, H * .007 * flap, -.4); bP(); bP(); eC(bx + W * .006, by, W * .008, H * .007 * flap, .4, 0, 7); ellP(bx + W * .006, by, W * .008, H * .007 * flap, .4)
      })
    } else if (pr === 'sunflowers') {

      sky([[0,'#7ab8e0'],[.55,'#b8d8e8'],[1,'#88a860']]);

      FS('#fff2c8'); dot(.82,.14,W * .06); const rng = mulberry32(121);

      times(3, row => {
        const ry = H * (.55 + row * .15); const n = 6 + row * 2; const fs = W * (.02 + row * .012);
        times(n, i => {
          const fx = W * (.06 + i * .88 / n) + (row % 2) * W * .04; const sway = SI(t * 1.2 + i + row) * W * .004;

          SS('#4a7038'); lnW(MX(1.5, fs * .12)); plS([fx, ry + fs * 2.2],[fx + sway, ry]);

          const cx = fx + sway, cy = ry; FS('#f0b428');
          times(10, p => {
            const a = p * .628; ellP(cx + CO(a) * fs, cy + SI(a) * fs, fs * .45, fs * .2, a)
          });

          FS('#6a4520'); dotP(cx, cy, fs * .55)
        })
      });

      times(3, i => {
        const bx = W * ((i * .3 + t * .04) % 1); const by = H * (.35 + SI(t * 2 + i * 2) * .1 + i * .1); FS('#e0c040'); ellP(bx, by, W * .008, H * .006); FS('#38302a'); ellP(bx - W * .004, by, W * .002, H * .005)
      })
    } else if (pr === 'wisteria') {

      sky([[0,'#c8c2e0'],[.45,'#d8d4e8'],[1,'#b8c4a0']]); const rng = mulberry32(77);

      FS('#6a5a48'); rect(0, H * .1, W, H * .025); rect(0, H * .16, W, H * .02);
      for (let i = 0; i < 7; i++)
        rect(W * i / 6 - W * .008, H * .08, W * .016, H * .12);

      times(14, i => {
        const fx = W * (.05 + rng() * .9); const sway = SI(t * .8 + i) * W * .008; const len = H * (.18 + rng() * .25); const petals = 5 + FL(rng() * 4); const hue = rng() > .3 ? 265 : 290;
        times(petals, k => {
          const py = H * .14 + len * k / petals; const pw = W * .028 * (1 - k / petals * .55);
          FS(`hsla(${hue + rng() * 20},45%,${72 - k * 2}%,.85)`);
          ellP(fx + sway * k / petals, py, pw, H * .022)
        });

        FS(`hsla(${hue},50%,65%,.9)`);
        ellP(fx + sway, H * .14 + len, W * .008, H * .012)
      });

      FS('#9aa888'); bnd(.85); FS('rgba(190,170,220,.5)');
      times(20, i => {
        const px = W * rng(), py = H * (.86 + rng() * .12); ellP(px, py, W * .005, H * .004, rng() * 3)
      })
    } else if (pr === 'zen') {

      sky([[0,'#d8cfb8'],[.6,'#cfc4a8'],[1,'#c0b294']]);

      const rng = mulberry32(41); const rocks = [[.3, .68, .07], [.68, .55, .055], [.52, .82, .045]]; SS('rgba(140,125,95,.55)'); lnW(1.5);
      for (const [rx, ry, rr] of rocks) {
        span(1, 6, k => {
          const rad = rr * (1 + k * .45); const wob = SI(t * .4 + k) * .01; ellPS(W * rx, H * ry, W * rad, H * rad * .35, wob)
        })
      }

      times(8, i => {
        const yy = H * (.22 + i * .045); plS([W * .08, yy],[W * .5, yy + SI(t * .3 + i) * H * .004, W * .92, yy])
      });

      for (const [rx, ry, rr] of rocks) {
        const g = RD(90 + rng() * 25);
        FS(`rgb(${g - 15},${g + 5},${g - 30})`);
        ell(rx, ry - H * rr * .5, W * rr * .9, H * rr * .8); FS('rgba(80,110,60,.5)'); ell(rx - W * rr * .25, ry - H * rr * .7, W * rr * .45, H * rr * .35)
      }

      FS('rgba(110,95,70,.35)');
      times(40, i => {
        const px = W * rng(), py = H * (.12 + rng() * .1); rect(px, py, W * .006, W * .004)
      })
    } else if (pr === 'storm') {

      const flash = MX(0, S(.9)) ** 14; sky([[0,'#2a3038'],[.6,'#1a2028'],[1,'#10141a']]); const rng = mulberry32(95);

      FS('#343c46');
      times(6, i => {
        const cx = W * (i / 5) + SI(t * .2 + i) * W * .02; ellP(cx, H * (.12 + (i % 2) * .06), W * .14, H * .05)
      });

      if (flash > .05) {
        SS(`rgba(255,250,200,${flash})`);
        lnW(3); const lx = W * (.3 + (FL(t * .9 / PI) % 3) * .2); mv(lx, H * .15); let ly = H * .15; scat(7, 5, (rng2, i) => {
          ly += H * .09; lT(lx + (rng2() - .5) * W * .08, ly)
        });
        sK();

        FS(`rgba(200,210,255,${flash * .15})`);
        rect(0, 0, W, H)
      }

      SS('rgba(160,180,210,.4)'); lnW(1.5);
      times(60, i => {
        const rx = ((rng() + t * .7) % 1) * W * 1.2 - W * .1; const ry = ((rng() + t * .7) % 1) * H; mv(rx, ry); mT(rx, ry); lT(rx - W * .012, ry + H * .035); sK()
      });

      FS('#16202a'); bnd(.85); SS('rgba(180,200,220,.3)'); lnW(2); bP();
      span(0, 10, x => {
        const px = W * x / 10, py = H * .85 + SI(x * 1.4 + t * 2) * H * .015; x ? lT(px, py) : mT(px, py)
      })
      sK()
    } else if (pr === 'observatory') {

      sky([[0,'#0a0e24'],[.6,'#1a2040'],[1,'#2a2a3a']]); const rng = mulberry32(89);

      times(120, i => {
        const sx = rng() * W, sy = rng() * H * .65; const tw2 = .3 + .7 * AB(SI(t * 1.5 + i * 1.7));
        FS(`rgba(235,240,255,${tw2})`);
        rect(sx, sy, 1.5, 1.5)
      });

      sV(); tR(W * .5, H * .3); rO(-.4); FS(lg(0, -H * .08, 0, H * .08,[0, 'rgba(180,190,230,0)',.5, 'rgba(180,190,230,.22)',1, 'rgba(180,190,230,0)'])); rect(-W, -H * .08, W * 2, H * .16); rS();

      FS('#141826'); mv(0, H * .7);
      for (let i = 0; i <= 8; i++) lT(W * i / 8, H * .7 - (i % 2) * H * .06 - rng() * H * .03);
      lT(W, H); lT(0, H); cP(); fL();

      const ox = W * .5, oy = H * .68; FS('#c8ccd4'); rect(ox - W * .07, oy, W * .14, H * .1); bP(); eC(ox, oy, W * .075, W * .055, 0, PI, 0); cP(); cP(); fL();

      FS('#2a2a3a'); sV(); tR(ox, oy); rO(-.3); rect(-W * .012, -W * .055, W * .024, W * .05); rS();

      FS('rgba(160,190,255,.25)'); sV(); tR(ox, oy); rO(-.3); mv(-W * .012, -W * .05); mT(-W * .012, -W * .05); lT(W * .012, -W * .05); lT(W * .03, -H * .3); lT(W * .03, -H * .3); lT(-W * .03, -H * .3); cP(); cP(); fL(); rS()
    } else if (pr === 'prairie') {

      sky([[0,'#9ec8e0'],[.55,'#c8d8a0'],[1,'#8aa860']]); const rng = mulberry32(79);

      for (const [py, pc] of [[.62, '#7a9a52'], [.74, '#6a8a44']]) {
        FS(pc); mv(0, H * py);
        span(0, 10, x => {
          lT(W * x / 10, H * py - SI(x * .9 + py * 10) * H * .05)
        })
        lT(W, H); lT(0, H); cP(); fL()
      }

      const wx = W * .72, wy = H * .55; SS('#5a4a38'); lnW(3); plS([wx - W * .015, wy + H * .18],[wx, wy],[wx + W * .015, wy + H * .18]); const wa = t * 1.2;
      times(4, i => {
        const a = wa + i * PI / 2; plS([wx, wy],[wx + CO(a) * W * .05, wy + SI(a) * W * .05]);

        FS('#8a7a62'); sV(); tR(wx + CO(a) * W * .04, wy + SI(a) * W * .04); rO(a); rect(0, -3, W * .02, 6); rS()
      });

      times(4, i => {
        const hx2 = W * (.1 + rng() * .5), hy2 = H * (.78 + (i % 2) * .08); FS('#c8a850'); ellP(hx2, hy2, W * .025, H * .03); SS('#a08038'); lnW(2); ellPS(hx2, hy2, W * .015, H * .018)
      });

      SS('#9ab858'); lnW(2);
      times(30, i => {
        const gx = rng() * W, gy = H * (.8 + rng() * .18); const sway = SI(t * 1.5 + i) * 4; plS([gx, gy],[gx + sway, gy - H * .03])
      })
    } else if (pr === 'lagoon') {

      sky([[0,'#8ec8e8'],[.45,'#5ab0d0'],[1,'#2a88a8']]); const rng = mulberry32(61);

      FS('rgba(255,240,190,.9)'); dot(.8,.18,H * .06);

      spt(0, 5, i => {
        FS(`rgba(120,210,220,${.15 + i * .05})`);
        const wy = H * (.58 + i * .08); mv(0, wy);
        for (let x = 0; x <= 10; x++) {
          lT(W * x / 10, wy + SI(x * 1.2 + i * 2 + t) * H * .012)
        }
        lT(W, wy + H * .1); lT(W, wy + H * .1); lT(0, wy + H * .1); cP(); cP(); fL()
      })

      const ix = W * .3, iy = H * .6; FS('#e8d8a0'); ellP(ix, iy, W * .09, H * .02);

      SS('#7a5a38'); lnW(W * .008); plS([ix, iy],[ix - W * .01, iy - H * .1, ix - W * .03, iy - H * .14]);

      SS('#3a7a40'); lnW(3);
      times(6, i => {
        const fa = i * 1.05 + S(.5) * .05; plS([ix - W * .03, iy - H * .14],[ix - W * .03 + CO(fa) * W * .04, iy - H * .14 + SI(fa) * W * .015,
          ix - W * .03 + CO(fa) * W * .07, iy - H * .14 + SI(fa) * W * .05 + H * .02])
      });

      SS('#f0f4f8'); lnW(2);
      times(3, i => {
        const bx = ((rng() + t * .04) % 1) * W; const by = H * (.15 + (i % 2) * .08) + SI(t * 2 + i) * H * .02; mv(bx - 8, by); mT(bx - 8, by); qT(bx - 3, by - 5, bx, by); qT(bx + 3, by - 5, bx + 8, by); sK()
      })
    } else if (pr === 'cliff') {

      sky([[0,'#a8c8e0'],[.5,'#6890b0'],[1,'#3a5a74']]); const rng = mulberry32(93);

      FS('#2a4a62'); bnd(.6); SS('rgba(220,235,245,.5)'); lnW(2);
      spt(0, 7, i => {
        const wy = H * (.63 + i * .05); bP();
        for (let x = 0; x <= 12; x++) {
          const px = W * x / 12; const py = wy + SI(x * 1.3 + i + t * 2) * H * .008; x ? lT(px, py) : mT(px, py)
        }
        sK()
      })

      FS('#6a5844'); mv(0, 0); mT(0, 0); lT(W * .3, 0);
      span(1, 6, i => {
        lT(W * (.3 - i * .02 + (rng() - .5) * .04), H * i * .12)
      })
      lT(W * .12, H); lT(W * .12, H); lT(0, H); cP(); cP(); fL();

      SS('rgba(50,40,30,.4)'); lnW(2);
      spt(1, 6, i => {
        plS([0, H * i * .14],[W * (.28 - i * .02), H * i * .14])
      })

      FS('#5a7a48'); ell(.15, .02, W * .16, H * .03);

      SS('#f0f4f8'); lnW(2);
      times(5, i => {
        const bx = ((rng() + t * .05) % 1) * W; const by = H * (.2 + (i % 3) * .1) + SI(t * 2 + i) * H * .025; mv(bx - 9, by); mT(bx - 9, by); qT(bx - 4, by - 6, bx, by); qT(bx + 4, by - 6, bx + 9, by); sK()
      })
    } else if (pr === 'bayou') {

      sky([[0,'#4a5a48'],[.55,'#2a3a30'],[1,'#1a2820']]); const rng = mulberry32(87);

      FS('#2a4038'); bnd(.62);

      SS('rgba(160,200,170,.3)'); lnW(2);
      times(8, i => {
        const wy = H * (.65 + i * .04); const off = SI(t * 1.5 + i) * W * .03; const wx = W * rng() + off; plS([wx - W * .1, wy],[wx + W * .1, wy])
      });

      times(4, i => {
        const tx = W * (.12 + i * .26); const tw = W * (.02 + rng() * .015); FS('#3a3028'); poly([tx - tw * 1.8,H * .7],[tx - tw,H * .2],[tx + tw,H * .2],[tx + tw * 1.8,H * .7]);

        FS('rgba(58,48,40,.35)'); rect(tx - tw * 1.2, H * .7, tw * 2.4, H * .1);

        SS('#5a7a52'); lnW(3);
        times(4, m => {
          const mx = tx - tw + m * tw * .7; const ml = H * (.08 + rng() * .12); plS([mx, H * .25],[mx + 4, H * .25 + ml * .6, mx + SI(t + m) * 6, H * .25 + ml])
        })
      });

      times(12, i => {
        const fx = ((rng() + SI(t * .4 + i * 2) * .05) % 1 + 1) % 1 * W; const fy = H * (.3 + (i % 5) * .12) + SI(t * 1.2 + i) * H * .05; const fl = .4 + .6 * AB(SI(t * 2 + i * 1.3));
        FS(`rgba(220,240,140,${fl})`);
        dotP(fx, fy, 2.5)
      })
    } else if (pr === 'alps') {

      sky([[0,'#7ab0d8'],[.55,'#c8dce8'],[1,'#6a8a6a']]); const rng = mulberry32(77);

      FS('rgba(255,255,255,.85)');
      times(4, i => {
        const cx = ((rng() + t * .01) % 1) * W; const cy = H * (.1 + (i % 2) * .08); bP(); eC(cx, cy, W * .07, H * .018, 0, 0, 7); eC(cx + W * .04, cy - 4, W * .05, H * .015, 0, 0, 7); fL()
      });

      for (const [py, pc, amp] of [[.62, '#8a9aa8', .18], [.68, '#5a6a78', .14]]) {
        FS(pc); mv(0, H * py);
        span(0, 8, i => {
          const px = W * i / 8; const peak = H * (py - amp * (i % 2 ? 1 : .3) * (.7 + rng() * .6)); lT(px, peak)
        })
        lT(W, H); lT(0, H); cP(); fL()
      }

      FS('rgba(255,255,255,.8)');
      times(4, i => {
        const sx = W * (.12 + i * .22); mv(sx - W * .04, H * .55); mT(sx - W * .04, H * .55); lT(sx, H * .47); lT(sx + W * .04, H * .55); lT(sx + W * .04, H * .55); cP(); lT(sx + W * .04, H * .55); cP(); fL()
      });

      FS('#5a8a52'); bnd(.72);

      FS('#6a4a30'); rect(W * .62, H * .74, W * .07, H * .05); FS('#4a3020'); mv(W * .6, H * .74); mT(W * .6, H * .74); lT(W * .655, H * .7); mT(W * .6, H * .74); lT(W * .655, H * .7); lT(W * .71, H * .74); cP(); cP(); fL();

      FS('#f8d878'); rect(W * .635, H * .755, W * .012, H * .015); rect(W * .665, H * .755, W * .012, H * .015)
    } else if (pr === 'mesa') {

      sky([[0,'#e8a868'],[.5,'#c87a50'],[1,'#7a4030']]); FS('rgba(255,220,150,.9)'); dot(.5,.42,H * .07); const rng = mulberry32(69);

      const mesas = [
        [W * .18, H * .55, W * .28, '#8a5040'],
        [W * .75, H * .58, W * .22, '#9a5a46'],
        [W * .48, H * .66, W * .4, '#6a3a2c'],
      ];
      for (const [mx, my, mw, mc] of mesas) {
        FS(mc); poly([mx - mw * .5,H],[mx - mw * .5,my + H * .02],[mx - mw * .48,my,mx - mw * .4,my],[mx + mw * .4,my],[mx + mw * .48,my,mx + mw * .5,my + H * .02],[mx + mw * .5,H]);

        SS('rgba(255,200,150,.25)'); lnW(2);
        spt(1, 4, g => {
          plS([mx - mw * .5, my + (H - my) * g / 4],[mx + mw * .5, my + (H - my) * g / 4])
        })
      }

      SS('#3a2620'); lnW(2);
      times(4, i => {
        const bx = ((rng() + t * .04) % 1) * W; const by = H * (.2 + (i % 2) * .1) + SI(t * 2 + i) * H * .02; mv(bx - 8, by); mT(bx - 8, by); qT(bx - 3, by - 5, bx, by); qT(bx + 3, by - 5, bx + 8, by); sK()
      })
    } else if (pr === 'rainforest') {

      sky([[0,'#7ab880'],[.5,'#3a7a50'],[1,'#1a4030']]); const rng = mulberry32(63);

      sV(); gA(.15); FS('#e8f8c0');
      times(4, i => {
        const lx = W * (.1 + i * .25) + SI(t * .3 + i) * W * .02; mv(lx, 0); mT(lx, 0); lT(lx + W * .06, 0); lT(lx + W * .18, H); lT(lx + W * .18, H); lT(lx + W * .1, H); cP(); cP(); fL()
      });
      rS();

      times(5, i => {
        const tx = W * (i / 4.5) + W * .04; const tw = W * (.03 + rng() * .03); FS(K0); poly([tx - tw,H],[tx - tw * .6,H * .5,tx - tw * 1.2,0],[tx + tw * 1.2,0],[tx + tw * .6,H * .5,tx + tw,H])
      });

      times(10, i => {
        const lx = rng() * W, ly = H * (.3 + rng() * .5); const ls = W * (.05 + rng() * .1), la = rng() * PI * 2; const dark = rng() > .5; FS(dark ? '#2a6a40' : '#4a9a58'); ellP(lx, ly + SI(t * .8 + i) * 3, ls, ls * .35, la);

        SS('rgba(20,50,30,.5)'); lnW(1.5); plS([lx - CO(la) * ls, ly - SI(la) * ls],[lx + CO(la) * ls, ly + SI(la) * ls])
      });

      FS('rgba(180,220,190,.12)'); bnd(.55)
    } else if (pr === 'lavender') {

      sky([[0,'#e8c8d8'],[.5,'#b890c8'],[1,'#6a4a78']]); FS('rgba(255,220,180,.85)'); dot(.7,.25,H * .08); const rng = mulberry32(57);

      FS('#4a5038');
      times(4, i => {
        const tx = W * (.15 + rng() * .7); ellP(tx, H * .5, W * .012, H * .05)
      });

      spt(0, 5, row => {
        const ry = H * (.58 + row * .085); FS(['#8a5aa8', '#7a4a98', '#9a6ab8'][row % 3]); mv(0, ry + H * .03);
        for (let x = 0; x <= 16; x++) lT(W * x / 16, ry + SI(x * .7 + row) * 4);
        lT(W, ry + H * .09); lT(W, ry + H * .09); lT(0, ry + H * .09); cP(); cP(); fL();

        times(40 - row * 5, i => {
          const hx2 = rng() * W; FS('#a878c8'); rect(hx2, ry + rng() * H * .04 - 4, 2.5, 5 + row)
        })
      })

      FS('#e8c830');
      times(5, i => {
        const bx = ((rng() + t * .05 * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W; const by = H * (.55 + (i % 3) * .12) + SI(t * 3 + i * 2) * H * .03; ellP(bx, by, W * .006, H * .004)
      })
    } else if (pr === 'vineyard') {

      sky([[0,'#e8d8b0'],[.5,'#c8b080'],[1,'#8a7048']]); FS('rgba(255,225,160,.85)'); dot(.25,.28,H * .08);

      FS('rgba(110,95,70,.5)'); mv(0, H * .5);
      for (let i = 0; i <= 10; i++) lT(W * i / 10, H * .5 - SI(i * 1.9) * H * .04);
      lT(W, H * .6); lT(0, H * .6); cP(); fL(); const rng = mulberry32(43);

      FS('#9a8054'); bnd(.62);

      spt(0, 4, row => {
        const ry = H * (.64 + row * .09); const n = 6 - row;
        for (let i = 0; i <= n; i++) {
          const vx = W * (i / n + row * .04);

          SS('#5a4830'); lnW(2 + row); plS([vx, ry],[vx, ry - H * (.06 + row * .01)]);

          FS(['#6a8a3a', '#7a9a44', '#5a7a34'][(i + row) % 3]); ellP(vx, ry - H * (.07 + row * .01), W * .025 + row * W * .008, H * .018);

          if (rng() > .4) {
            FS('#6a3a7a');
            times(4, g => {
              dotP(vx + (rng() - .5) * W * .015, ry - H * (.05 + row * .01) + g * 4, 3 + row)
            })
          }
        }
      })
    } else if (pr === 'coral') {

      sky([[0,'#0a3a5a'],[.5,'#0a4a6a'],[1,'#063048']]);

      FS('rgba(150,220,255,.1)');
      times(4, i => {
        sV(); tR(W * (.2 + i * .2), 0); rO(.3); rect(-W * .015, 0, W * .03, H); rS()
      });
      const rng = mulberry32(91);

      FS('#c8b088'); bnd(.85);

      times(5, i => {
        const cx = W * (.1 + rng() * .8), cy = H * (.86 + rng() * .1); const cc = ['#e07070', '#e8a050', '#c860a0', '#60a8b0'][i % 4]; SS(cc); lnW(W * .008);
        times(4, b => {
          const ba = -PI / 2 + (b - 1.5) * .5; plS([cx, cy],[cx + CO(ba) * W * .04, cy + SI(ba) * H * .1,
            cx + CO(ba) * W * .06, cy + SI(ba) * H * .14])
        });
        FS(cc); dotP(cx + W * .05, cy - H * .02, W * .02)
      });

      FS('rgba(255,200,120,.8)');
      times(10, i => {
        const fx = ((rng() + t * .04) % 1.2 - .1) * W; const fy = H * (.25 + (i % 3) * .15) + SI(t * 2 + i) * H * .02; bP(); eC(fx, fy, W * .012, H * .008, 0, 0, 7); eC(fx, fy, W * .012, H * .008, 0, 0, 7); fL(); mv(fx - W * .014, fy); mT(fx - W * .014, fy); lT(fx - W * .022, fy - H * .008); mT(fx - W * .014, fy); lT(fx - W * .022, fy - H * .008); lT(fx - W * .022, fy + H * .008); cP(); cP(); fL()
      })
    } else if (pr === 'geyser') {

      sky([[0,'#b8c4cc'],[.55,'#8a9aa4'],[1,'#5a6a72']]); const rng = mulberry32(67);

      FS('#7a7068'); bnd(.72);

      FS('#6a6058');
      times(6, i => {
        ellP(rng() * W, H * (.74 + rng() * .2), W * (.02 + rng() * .04), H * (.015 + rng() * .02))
      });

      const gx = W * .45, gy = H * .74; FS('#5a5048'); ellP(gx, gy, W * .09, H * .025);

      const erupt = MX(0, S(1.2)) ** .5;
      if (erupt > .05) {
        FS('rgba(220,235,245,.85)'); const colH = H * .5 * erupt; poly([gx - W * .02,gy],[gx - W * .04 * erupt,gy - colH * .7,gx - W * .015,gy - colH],[gx,gy - colH * 1.1,gx + W * .015,gy - colH],[gx + W * .04 * erupt,gy - colH * .7,gx + W * .02,gy]);

        times(8, i => {
          const a = rng() * PI; FS('rgba(230,242,250,.8)'); dotP(gx + CO(a) * W * .05 * erupt * (rng() + .3), gy - colH - rng() * H * .06, W * .008)
        })
      }

      FS('rgba(230,235,240,.35)');
      times(5, i => {
        const sx = gx + SI(t * .6 + i * 2) * W * .05 + (rng() - .5) * W * .1; ellP(sx, gy - H * (.05 + i * .07), W * (.04 + i * .015), H * (.02 + i * .008))
      })
    } else if (pr === 'pagoda') {

      sky([[0,'#3a3050'],[.5,'#80506a'],[1,'#c07858']]);

      FS('rgba(255,240,210,.85)'); dot(.2,.2,H * .07);

      FS('rgba(50,40,60,.6)'); mv(0, H * .6);
      for (let i = 0; i <= 10; i++) lT(W * i / 10, H * .6 - SI(i * 1.3 + 2) * H * .05);
      lT(W, H * .7); lT(0, H * .7); cP(); fL();

      const px = W * .62, pbase = H * .85;
      times(5, i => {
        const ty = pbase - H * .115 * i; const tw = W * (.11 - i * .012);

        FS('#4a3028'); rect(px - tw * .32, ty - H * .075, tw * .64, H * .075);

        FS('#ffd890'); rect(px - tw * .1, ty - H * .06, tw * .2, H * .035);

        FS('#2a2030'); poly([px - tw * .55,ty - H * .075],[px,ty - H * .115,px + tw * .55,ty - H * .075],[px + tw * .5,ty - H * .045],[px - tw * .5,ty - H * .045])
      });

      SS('#d8b050'); lnW(3); plS([px, pbase - H * .575],[px, pbase - H * .68]); FS('#d8b050');
      times(4, i => {
        ellP(px, pbase - H * (.6 + i * .025), W * .014, H * .006)
      })
    } else if (pr === 'wheatfield') {

      sky([[0,'#f0d8a0'],[.5,'#e8b870'],[1,'#b88840']]); FS('rgba(255,230,160,.9)'); dot(.75,.3,H * .09);

      const rng = mulberry32(83); FS('#6a5838');
      times(5, i => {
        const tx = rng() * W; ellP(tx, H * .58, W * .02, H * .035); rect(tx - 2, H * .58, 4, H * .03)
      });

      times(3, ly => {
        const baseY = H * (.62 + ly * .12); const shade = ['#c8a050', '#b88840', '#a07030'][ly]; FS(shade); rect(0, baseY, W, H * .4);

        SS(['#e0c070', '#d0b060', '#c0a050'][ly]); lnW(2); const n = 60 - ly * 15;
        times(n, i => {
          const hx2 = (i / n + (rng() * .01)) * W; const hy2 = baseY + rng() * H * .1; const sw = SI(t * 1.5 + hx2 * .01 + ly) * W * .006; plS([hx2, hy2 + H * .02],[hx2 + sw * .5, hy2 + H * .01, hx2 + sw, hy2])
        })
      })
    } else if (pr === 'bridge') {

      sky([[0,'#f0a868'],[.5,'#c06068'],[1,'#4a4058']]);

      FS('rgba(255,210,140,.9)'); dot(.5,.52,H * .08);

      FS('#50384a'); bnd(.68); SS('rgba(255,180,120,.35)'); lnW(2);
      spt(0, 8, i => {
        const wy = H * (.72 + i * .03); mv(0, wy);
        for (let x = 1; x <= 8; x++) lT(W * x / 8, wy + SI(x * 2 + t + i) * 2);
        sK()
      })

      FS('#2a2230');
      ([W * .25, W * .75]).forEach(tx => {
        rect(tx - W * .012, H * .3, W * .024, H * .42); rect(tx - W * .02, H * .34, W * .04, H * .015); rect(tx - W * .02, H * .5, W * .04, H * .015)
      });

      SS('#2a2230'); lnW(3); bP(); plS([0, H * .55],[W * .25, H * .28, W * .5, H * .55],[W * .75, H * .28, W, H * .55]);

      lnW(1.5);
      spt(1, 16, i => {
        const fx = W * i / 16;
        const cy = i < 8
          ? H * .55 - (1 - AB(i - 4) / 4) * H * .24
          : H * .55 - (1 - AB(i - 12) / 4) * H * .24;
        plS([fx, cy],[fx, H * .6])
      })

      rect(0, H * .6, W, H * .03);

      FS('#ffd890');
      times(9, i => {
        dot((.05 + i * .11),.585,3)
      })
    } else if (pr === 'terraces') {

      sky([[0,'#dfe8e0'],[.55,'#a8c0a8'],[1,'#5a7a58']]);

      FS('rgba(90,110,95,.5)'); mv(0, H * .45);
      for (let i = 0; i <= 10; i++) lT(W * i / 10, H * .45 - SI(i * 1.7) * H * .06);
      lT(W, H * .5); lT(W, H * .6); lT(0, H * .6); cP(); fL(); const rng = mulberry32(59);

      spt(0, 7, i => {
        const ty = H * (.5 + i * .07), th = H * .055; const water = i % 3 === 0; FS(water ? '#9ec8d8' : ['#6a9a58', '#7aaa62', '#5a8a50'][i % 3]); mv(0, ty + SI(i * 2) * 4);
        for (let x = 0; x <= 16; x++) lT(W * x / 16, ty + SI(x * .8 + i * 1.3) * 5);
        lT(W, ty + th); lT(0, ty + th); cP(); fL();

        SS('rgba(60,80,50,.5)'); lnW(2); bP();
        for (let x = 0; x <= 16; x++) {
          const px = W * x / 16, py = ty + th + SI(x * .8 + i * 1.3) * 5; x ? lT(px, py) : mT(px, py)
        }
        sK()
      })

      FS('rgba(220,240,200,.7)');
      times(40, i => {
        const ty = H * (.55 + FL(rng() * 6) * .07); rect(rng() * W, ty + rng() * H * .04, 2, 3)
      })
    } else if (pr === 'harbor') {

      sky([[0,'#e8b890'],[.5,'#c87878'],[1,'#586878']]);

      FS('rgba(255,220,160,.9)'); dot(.3,.5,H * .09); const rng = mulberry32(71);

      FS('#4a6a84'); bnd(.62);

      SS('rgba(255,220,180,.4)'); lnW(2);
      spt(0, 12, i => {
        const wy = H * (.64 + i * .028); bP();
        for (let x = 0; x <= 12; x++) {
          const px = ((x / 12 + t * .02 * (i % 2 ? 1 : -1)) % 1 + 1) % 1 * W; x ? lT(px, wy + SI(x + t + i) * 3) : mT(px, wy)
        }
        sK()
      })

      FS('#e8e0d0'); rect(W * .78, H * .32, W * .035, H * .3); FS('#c84040');
      for (let i = 0; i < 3; i++) rect(W * .78, H * (.34 + i * .1), W * .035, H * .05);
      FS('#ffe8a0'); dot(.7975,.3,H * .025);

      FS('rgba(255,240,180,.25)'); sV(); tR(W * .7975, H * .3); rO(S(.5) * .3); poly([0,0],[W * .25,-H * .04],[W * .25,H * .04]); rS();

      const bx = ((rng() + t * .03) % 1.2 - .1) * W, by = H * .7; FS('#5a4434'); mv(bx - W * .03, by); mT(bx - W * .03, by); lT(bx + W * .03, by); lT(bx + W * .02, by + H * .02); lT(bx + W * .02, by + H * .02); lT(bx - W * .02, by + H * .02); cP(); cP(); fL(); FS('#f0ece0'); mv(bx, by - H * .06); mT(bx, by - H * .06); lT(bx, by); mT(bx, by - H * .06); lT(bx, by); lT(bx + W * .028, by); cP(); cP(); fL(); mv(bx, by - H * .06);
      mT(bx, by - H * .06); lT(bx, by); mT(bx, by - H * .06); lT(bx, by); lT(bx - W * .022, by); cP(); cP(); fL()
    } else if (pr === 'moon') {

      sky([[0,'#0a0a12'],[.75,'#101018'],[1,'#181820']]); const rng = mulberry32(97);

      FS('#fff');
      times(60, i => {
        rect(rng() * W, rng() * H * .6, 1.2, 1.2)
      });

      FS('#3a6ac8'); dot(.8,.18,H * .1); SS('rgba(255,255,255,.55)'); lnW(H * .012); bP(); aR(W * .8, H * .18, H * .1, -.6, .9); sK();

      FS('#8a8a92'); bnd(.76);

      SS('#6a6a72'); lnW(3); bP();
      span(0, 20, i => {
        const px = W * i / 20, py = H * .76 + SI(i * 2.1) * H * .015; i ? lT(px, py) : mT(px, py)
      })
      sK();

      times(7, i => {
        const crx = rng() * W, cry = H * (.8 + rng() * .15), crr = W * (.015 + rng() * .03); FS('#6e6e76'); ellP(crx, cry, crr, crr * .45); SS('#a8a8b0'); lnW(2); bP(); eC(crx, cry - 1, crr, crr * .45, 0, PI, 0); sK()
      })
    } else if (pr === 'sakura') {

      sky([[0,'#e8ecf4'],[.6,'#c8d0e0'],[1,'#98a4b8']]); const rng = mulberry32(37);

      FS('#7a9a6a'); bnd(.8); FS('rgba(255,200,215,.6)');
      times(30, i => {
        ellP(rng() * W, H * (.8 + rng() * .18), W * .006, W * .003, rng() * 3)
      });

      for (const [tx, th] of [[W * .15, .45], [W * .5, .52], [W * .85, .42]]) {
        const ty = H * .82; FS('#5a4030'); rect(tx - W * .007, ty - H * th * .55, W * .014, H * th * .55);
        times(10, b => {
          FS(['#f0b8cc', '#e8a0bc', '#f5ccd8'][FL(rng() * 3)]); dotP(tx + (rng() - .5) * W * .12, ty - H * th * (.5 + rng() * .45), W * (.025 + rng() * .03))
        })
      }

      FS('rgba(255,210,225,.9)');
      times(16, i => {
        const px = ((rng() + t * .06 * (.4 + rng() * .6)) % 1) * W; const py = (rng() + .1 * SI(t * 1.5 + i)) * H; sV(); tR(px, py); rO(t * 1.5 + i); ellP(0, 0, W * .004, W * .0025); rS()
      })
    } else if (pr === 'ruins') {

      sky([[0,'#d8a878'],[.55,'#a87858'],[1,'#584838']]); FS('rgba(255,215,150,.8)'); dot(.5,.45,H * .12); const rng = mulberry32(51);

      FS('#6a5a44'); bnd(.78);

      const colW = W * .045;
      times(4, i => {
        const cx = W * (.18 + i * .2), ch = H * (.28 + rng() * .25); FS('#8a8078'); rect(cx - colW / 2, H * .78 - ch, colW, ch);

        rect(cx - colW * .7, H * .78 - ch - H * .02, colW * 1.4, H * .02);

        if (i % 2) {
          FS('#a87858'); poly([cx - colW / 2,H * .78 - ch],[cx + colW / 2,H * .78 - ch + H * .04],[cx + colW / 2,H * .78 - ch])
        }

        SS('rgba(80,120,50,.7)'); lnW(3); plS([cx - colW / 2, H * .78],[cx - colW, H * .78 - ch * .5, cx, H * .78 - ch])
      });

      sV(); tR(W * .6, H * .9); rO(.12); FS('#7a7068'); rect(0, -H * .03, W * .25, H * .06); rS()
    } else if (pr === 'glacier') {

      sky([[0,'#c8dce8'],[.5,'#8ab4cc'],[1,'#4a7a9a']]); const rng = mulberry32(19);

      FS('rgba(230,240,248,.9)');
      for (const [ix, ih] of [[W * .2, .3], [W * .75, .38]]) {
        poly([ix - W * .12,H * .72],[ix - W * .05,H * .72 - H * ih * .5],[ix,H * .72 - H * ih],[ix + W * .07,H * .72 - H * ih * .4],[ix + W * .12,H * .72])
      }

      FS('#3a6a86'); bnd(.72);

      FS('rgba(220,235,245,.85)');
      times(8, i => {
        const fx = rng() * W, fy = H * (.74 + rng() * .2); ellP(fx, fy, W * (.015 + rng() * .03), H * .012)
      });

      SS('rgba(220,240,255,.4)'); lnW(1.5);
      times(12, i => {
        const wx = rng() * W, wy = H * (.74 + rng() * .24); const tw = .5 + .5 * SI(t * 2 + i); gA(.2 + .4 * tw); plS([wx, wy],[wx + W * .02, wy])
      });
      gA(1)
    } else if (pr === 'fjord') {

      sky([[0,'#a8c8d8'],[.5,'#6a94a8'],[1,'#3a5a6e']]); const rng = mulberry32(87);

      for (const [x0, s] of [[0, 1], [W, -1]]) {
        FS(s > 0 ? '#3e5a52' : '#4a6a5e'); mv(x0, H); lT(x0, H * .15); let vx = 0;
        while (vx < W * .32) {
          vx += W * (.05 + rng() * .07); lT(x0 + s * vx, H * (.15 + rng() * .3))
        }
        lT(x0 + s * W * .35, H); cP(); cP(); fL()
      }

      FS('rgba(240,245,250,.8)'); mv(0, H * .15); mT(0, H * .15); lT(W * .1, H * .2); mT(0, H * .15); lT(W * .1, H * .2); lT(W * .05, H * .24); lT(0, H * .22); lT(0, H * .22); cP(); lT(0, H * .22); cP(); fL();

      FS('#4a7a8e'); bnd(.7); SS('rgba(200,230,240,.35)'); lnW(1.5);
      times(10, i => {
        const wy = H * (.72 + rng() * .25); const wx = rng() * W * .7, wl = W * (.05 + rng() * .12); mv(wx + SI(t + i) * 5, wy); mT(wx + SI(t + i) * 5, wy); lT(wx + wl, wy); sK()
      })
    } else if (pr === 'autumn') {

      sky([[0,'#d8e0e8'],[.5,'#c8b890'],[1,'#9a7048']]); const rng = mulberry32(23);

      FS('#8a5a30'); bnd(.78); FS('rgba(200,90,40,.5)');
      times(40, i => {
        ellP(rng() * W, H * (.78 + rng() * .2), W * .008, W * .004, rng() * 3)
      });

      for (const [tx, th] of [[W * .18, .42], [W * .52, .5], [W * .85, .38]]) {
        const ty = H * .8; FS('#4a3020'); rect(tx - W * .008, ty - H * th * .6, W * .016, H * th * .6); const cols = ['#c8402a', '#e07020', '#d8a020'];
        times(9, b => {
          FS(cols[FL(rng() * 3)]); dotP(tx + (rng() - .5) * W * .1, ty - H * th * (.55 + rng() * .4), W * (.02 + rng() * .025))
        })
      }

      FS('rgba(210,80,40,.8)');
      times(14, i => {
        const lx = ((rng() + t * .05 * (.4 + rng() * .6)) % 1) * W; const ly = (rng() + .08 * SI(t * 2 + i)) * H; sV(); tR(lx, ly); rO(t * 2 + i); ellP(0, 0, W * .005, W * .003); rS()
      })
    } else if (pr === 'falls') {

      sky([[0,'#8ec8e8'],[.5,'#5a9e6a'],[1,'#2e5e48']]); const rng = mulberry32(43);

      FS('#4a5a4a'); mv(0, H); mT(0, H); lT(0, H * .2); lT(W * .3, H * .35); lT(W * .3, H * .35); lT(W * .35, H); cP(); cP(); fL(); mv(W, H); mT(W, H); lT(W, H * .25); lT(W * .7, H * .4); lT(W * .7, H * .4); lT(W * .65, H); cP(); cP(); fL();

      FS('rgba(220,240,255,.85)'); poly([W * .38,0],[W * .62,0],[W * .58 + S(2) * 4,H * .8],[W * .42 - S(2) * 4,H * .8]);

      SS('rgba(140,190,230,.6)'); lnW(2);
      times(6, i => {
        const wy = ((rng() + t * .3) % 1) * H * .8; mv(W * .4, wy); mT(W * .4, wy); lT(W * .6, wy + 8); sK()
      });

      FS('rgba(230,248,255,.6)');
      times(16, i => {
        const mx = W * (.4 + rng() * .2), my = H * (.78 + rng() * .06); const mr = W * (.004 + rng() * .008) * (.7 + .3 * SI(t * 3 + i)); dotP(mx, my, mr)
      });
      FS('rgba(70,140,160,.8)'); bnd(.82)
    } else if (pr === 'oasis') {

      sky([[0,'#9ed4e8'],[.55,'#e8d49a'],[1,'#c8a060']]); FS('rgba(255,240,190,.9)'); dot(.8,.18,H * .08);

      FS('#d8b070'); bP(); eC(W * .2, H * .8, W * .45, H * .16, 0, PI, 0); fL(); FS('#c89a58'); bnd(.78);

      FS('rgba(60,150,190,.9)'); ell(.45,.82,W * .16,H * .045); SS('rgba(200,240,255,.5)'); lnW(1.5);
      times(3, i => {
        const ry = H * (.8 + i * .015); plS([W * .38, ry],[W * .45, ry + 3, W * .52, ry])
      });

      for (const [px, flip] of [[W * .3, 1], [W * .62, -1]]) {
        const py = H * .78, ph = H * .28; SS('#7a5a30'); lnW(W * .009); lC('round'); mv(px, py); mT(px, py); qT(px + flip * W * .03, py - ph * .6, px + flip * W * .05, py - ph); sK(); const tx = px + flip * W * .05, ty = py - ph; SS('#3a7a3a'); lnW(W * .006);
        span(-2, 2, f => {
          plS([tx, ty],[tx + f * W * .03, ty - H * .05, tx + f * W * .055, ty - H * .01])
        })
      }
    } else if (pr === 'savanna') {

      sky([[0,'#f4b04e'],[.6,'#e07a3f'],[1,'#8a4a2a']]); FS('rgba(255,220,140,.9)'); dot(.5,.55,H * .16);

      FS('#5e3818'); bnd(.72); const rng = mulberry32(67);

      ([W * .2, W * .78]).forEach(tx => {
        const th = H * .3, ty = H * .72; SS('#2e1c10'); lnW(W * .008); lC('round'); mv(tx, ty); mT(tx, ty); qT(tx + W * .01, ty - th * .6, tx + W * .02, ty - th); sK(); bP(); mv(tx + W * .02, ty - th * .7); mv(tx + W * .02, ty - th * .7); lT(tx - W * .03, ty - th * .95); plS([tx + W * .02, ty - th * .7],[tx - W * .03, ty - th * .95]); bP(); mv(tx + W * .02, ty - th * .7); mv(tx + W * .02, ty - th * .7);
        lT(tx + W * .07, ty - th * .95); plS([tx + W * .02, ty - th * .7],[tx + W * .07, ty - th * .95]); FS('#3a2410'); ellP(tx + W * .02, ty - th, W * .1, H * .035)
      });

      SS('rgba(60,35,15,.8)'); lnW(2);
      times(30, i => {
        const gx = rng() * W, gy = H * (.75 + rng() * .22), gh = H * (.03 + rng() * .04); mv(gx, gy); mT(gx, gy); qT(gx + 4, gy - gh * .6, gx + (rng() - .3) * 10, gy - gh); sK()
      })
    } else if (pr === 'bamboo') {

      sky([[0,'#8fbf7a'],[.5,'#5e9e5a'],[1,'#2e5e40']]);

      FS(lg(0, 0, W * .4, H,[0, 'rgba(255,250,200,.25)',1, 'rgba(255,250,200,0)'])); rect(0, 0, W, H); const rng = mulberry32(91);

      spt(0, 14, i => {
        const bx = rng() * W, bw = W * (.008 + rng() * .012); const deep = rng() < .5; FS(deep ? 'rgba(40,90,50,.5)' : 'rgba(25,70,38,.9)'); rect(bx - bw / 2, 0, bw, H);

        FS('rgba(20,50,28,.8)');
        for (let ny = H * .1; ny < H; ny += H * .18) {
          rect(bx - bw / 2 - 1, ny, bw + 2, 3)
        }
      })

      FS('rgba(180,230,140,.8)');
      times(12, i => {
        const lx = ((rng() + t * .03 * (.5 + rng() * .5)) % 1) * W; const ly = (rng() + .1 * SI(t + i)) * H; const sz = W * .006; sV(); tR(lx, ly); rO(t + i); ellP(0, 0, sz * 2, sz); rS()
      })
    } else if (pr === 'canyon') {

      sky([[0,'#f0a860'],[.5,'#d4786a'],[1,'#8a4a44']]); FS('rgba(255,225,170,.85)'); dot(.5,.34,H * .1); const rng = mulberry32(31);

      const layers = [
        ['rgba(150,70,55,.55)', .5], ['rgba(120,55,45,.75)', .66], ['#5e3229', .8],
      ];
      for (const [col, by] of layers) {
        FS(col); mv(0, H); lT(0, H * by); let cx = 0;
        while (cx < W) {
          const seg = W * (.08 + rng() * .12); const ny = H * (by - .04 + rng() * .08); lT(cx + seg * .5, ny); lT(cx + seg, H * (by - .02 + rng() * .04)); cx += seg
        }
        lT(W, H); cP(); fL()
      }

      FS('#4a2620'); bnd(.88); SS('rgba(200,120,80,.4)'); lnW(2);
      times(4, i => {
        const sy = H * (.9 + i * .025); plS([0, sy],[W, sy + (rng() - .5) * 6])
      })
    } else if (pr === 'castle') {

      sky([[0,'#e89a5f'],[.55,'#c86a78'],[1,'#4a3050']]);

      FS('rgba(255,215,150,.9)'); dot(.72,.3,H * .09); const rng = mulberry32(55);

      FS('#3a2b42'); const wallY = H * .62, towerH = H * .34; rect(0, wallY, W, H - wallY);
      ([W * .16, W * .84]).forEach(tx => {
        rect(tx - W * .07, wallY - towerH, W * .14, towerH + H * .1);

        poly([tx - W * .085,wallY - towerH],[tx + W * .085,wallY - towerH],[tx,wallY - towerH - H * .14]);

        SS('#3a2b42'); lnW(2); plS([tx, wallY - towerH - H * .14],[tx, wallY - towerH - H * .2]); FS('#c0303f'); const fw = SI(t * 3 + tx) * W * .008; poly([tx,wallY - towerH - H * .2],[tx + W * .045 + fw,wallY - towerH - H * .185],[tx,wallY - towerH - H * .17]); FS('#3a2b42')
      });

      FS('rgba(255,210,120,.85)');
      times(14, i => {
        const wx = W * (.1 + rng() * .8), wy = wallY + H * (.03 + rng() * .28); rect(wx, wy, W * .008, H * .018)
      });

      FS('rgba(20,12,26,.8)'); bP(); aR(W * .5, H * .98, W * .06, PI, 0); fL()
    } else if (pr === 'cave') {

      sky([[0,'#0c0f16'],[.7,'#1a2030'],[1,'#0a0d14']]);

      FS(lg(W * .3, 0, W * .55, H,[0, 'rgba(200,225,255,.22)',1, 'rgba(200,225,255,0)'])); mv(W * .32, 0); mT(W * .32, 0); lT(W * .48, 0); mT(W * .32, 0); lT(W * .48, 0); lT(W * .68, H); mT(W * .32, 0); lT(W * .48, 0); lT(W * .68, H); lT(W * .4, H); cP(); cP(); fL();

      const rng = mulberry32(77); FS('#2a3242');
      times(12, i => {
        const sx = rng() * W, sw = W * (.015 + rng() * .025), sh = H * (.06 + rng() * .14); mv(sx - sw, 0); mT(sx - sw, 0); lT(sx + sw, 0); mT(sx - sw, 0); lT(sx + sw, 0); lT(sx + (rng() - .5) * sw, sh); cP(); cP(); fL()
      });

      FS('#232a38');
      times(8, i => {
        const sx = rng() * W, sw = W * (.02 + rng() * .03), sh = H * (.05 + rng() * .1); mv(sx - sw, H); mT(sx - sw, H); lT(sx + sw, H); mT(sx - sw, H); lT(sx + sw, H); lT(sx + (rng() - .5) * sw, H - sh); cP(); cP(); fL()
      });

      FS('rgba(120,170,220,.15)'); ell(.5,.97,W * .45,H * .05); SS('rgba(160,200,240,.3)'); lnW(1);
      times(8, i => {
        const wy = H * (.9 + rng() * .08); const wx = rng() * W * .8, wl = W * (.05 + rng() * .1); mv(wx + SI(t + i) * 6, wy); mT(wx + SI(t + i) * 6, wy); lT(wx + wl + SI(t + i) * 6, wy); sK()
      })
    } else if (pr === 'fireworks') {

      sky([[0,'#06091c'],[.75,'#101a3a'],[1,'#1c1430']]);

      const rng = mulberry32(41); FS('rgba(255,210,140,.5)');
      times(40, i => {
        rect(rng() * W, H * (.9 + rng() * .08), 2, 2)
      });

      times(3, j => {
        const cyc = ((t * .3 + j * .37) % 1); const fx = W * (.2 + .3 * j) + SI(j * 7) * W * .06; const fyy = H * (.22 + .12 * j); const hue = [330, 45, 200][j];
        if (cyc < .3) {

          const ry = H * .9 - cyc / .3 * (H * .9 - fyy);
          FS(`hsla(${hue},90%,70%,.9)`);
          dotP(fx,ry,2.5)
        } else {
          const boom = (cyc - .3) / .7; const rr = boom * H * .16; const a = MX(0, (1 - boom) * .9); const rng2 = mulberry32(100 + j);
          FS(`hsla(${hue},90%,${65 + boom * 15}%,${a})`);
          times(26, k => {
            const ang = k * .2418 + rng2() * .15; const d = rr * (.6 + .4 * rng2()); dotP(fx + CO(ang) * d, fyy + SI(ang) * d + boom * boom * H * .05, 1.6 + (1 - boom) * 1.4)
          })
        }
      })
    } else if (pr === 'cloudsea') {

      sky([[0,'#ffb37a'],[.45,'#ffd0a8'],[.6,'#e8f0f8'],[1,'#c8d8e8']]); FS('rgba(255,235,200,.9)'); dot(.68,.3,H * .06);

      const rng = mulberry32(17); FS('#5a6a80');
      times(5, i => {
        const px2 = W * (.1 + .2 * i) + (rng() - .5) * W * .08; const ph2 = H * (.1 + rng() * .12); mv(px2 - W * .09, H * .62); mT(px2 - W * .09, H * .62); lT(px2, H * .62 - ph2); mT(px2 - W * .09, H * .62); lT(px2, H * .62 - ph2); lT(px2 + W * .09, H * .62); cP(); cP(); fL()
      });

      times(30, i => {
        const cx2 = ((rng() + t * .012) % 1) * W * 1.2 - W * .1; const cy2 = H * (.6 + rng() * .35); const cr = H * (.04 + rng() * .07);
        FS(`rgba(255,255,255,${.5 + .4 * rng()})`);
        ellP(cx2, cy2, cr * 1.9, cr)
      })
    } else if (pr === 'lake') {

      sky([[0,'#a8d8f0'],[.45,'#d8ecf6'],[.5,'#7fa8c8'],[1,'#3a6080']]); const hr2 = H * .5;

      for (const [base, amp, col, sd] of [[.5, .16, '#5a7a90', 33], [.5, .11, '#4a6a80', 44]]) {
        const rng = mulberry32(sd); FS(col); mv(0, H * base);
        for (let i = 1; i <= 10; i++) lT(i * W / 10, H * (base - amp * rng()));
        lT(W, H * base); cP(); fL();

        gA(.35); sV(); tR(0, hr2 * 2); sC(1, -1); const rng2 = mulberry32(sd); mv(0, H * base);
        for (let i = 1; i <= 10; i++) lT(i * W / 10, H * (base - amp * rng2()));
        lT(W, H * base); cP(); fL(); rS(); gA(1)
      }

      SS('rgba(255,255,255,.35)'); lnW(1.2); scat(55, 12, (rng3, i) => {
        const wy = hr2 + H * (.05 + rng3() * .4); const wx = rng3() * W * .8; const wl = W * (.06 + rng3() * .14); plS([wx + SI(t * 1.2 + i) * 8, wy],[wx + wl + SI(t * 1.2 + i) * 8, wy])
      })
    } else if (pr === 'shrine') {

      sky([[0,'#2b2150'],[.5,'#8a3a5c'],[.75,'#e0703f'],[1,'#3a2030']]);

      FS('rgba(40,25,45,.7)'); bP(); poly([0,H * .78],[W * .18,H * .58],[W * .18,H * .58],[W * .4,H * .74],[W * .18,H * .58],[W * .4,H * .74],[W * .62,H * .6],[W * .18,H * .58],[W * .4,H * .74],[W * .62,H * .6],[W * .85,H * .76],[W * .18,H * .58],[W * .4,H * .74],[W * .62,H * .6],[W * .85,H * .76],[W,H * .68],[W,H],[W,H],[0,H],[W,H],[0,H],[W,H],[0,H]);

      const tx = W * .5, ty = H * .34, tw = W * .34, th2 = H * .6, pw = W * .022; FS('#c53d2e');

      rect(tx - tw * .4, ty + H * .05, pw, th2); rect(tx + tw * .4 - pw, ty + H * .05, pw, th2);

      rect(tx - tw * .38, ty + H * .16, tw * .76, H * .035);

      poly([tx - tw * .52,ty + H * .02],[tx,ty - H * .05,tx + tw * .52,ty + H * .02],[tx + tw * .52,ty + H * .07],[tx,ty,tx - tw * .52,ty + H * .07]); rect(tx - pw / 2, ty - H * .01, pw, H * .18);

      const rng = mulberry32(99); FS('rgba(255,190,110,.85)');
      times(8, i => {
        const lx = (rng() < .5 ? -1 : 1) * (W * .18 + rng() * W * .22) + W * .5; const ly = H * (.72 + rng() * .18); dotP(lx, ly, 3 + rng() * 3)
      })
    } else if (pr === 'snowfield') {

      sky([[0,'#aebfcb'],[.5,'#d5e0e8'],[.51,'#eef4f8'],[1,'#d8e6ee']]);

      FS('#f4f9fc'); bP(); poly([0,H],[W * .3,H * .55,W * .6,H * .66],[W * .85,H * .74,W,H * .64],[W * .85,H * .74,W,H * .64],[W,H],[W * .85,H * .74,W,H * .64],[W,H],[W * .85,H * .74,W,H * .64],[W,H]);

      const rng = mulberry32(48); FS('rgba(70,95,90,.5)');
      times(7, i => {
        const tx = rng() * W, th = H * (.06 + rng() * .05), ty = H * (.52 + rng() * .04);
        times(3, k => {
          poly([tx - th * (.7 - k * .2),ty - k * th * .3],[tx + th * (.7 - k * .2),ty - k * th * .3],[tx,ty - k * th * .3 - th * .45])
        })
      });

      FS('rgba(255,255,255,.9)');
      times(40, i => {
        const sx = (rng() + t * .03 * (.5 + rng())) % 1 * W; const sy = (rng() + t * .08 * (.6 + rng() * .8)) % 1 * H; dotP(sx, sy, 1 + rng() * 2)
      })
    } else if (pr === 'meadow') {

      sky([[0,'#8fd0ff'],[.55,'#cdeffa'],[.56,'#79c26a'],[1,'#4e9a44']]);

      FS('rgba(110,180,90,.85)'); bP(); poly([0,H],[W * .3,H * .5,W * .65,H * .62],[W * .85,H * .68,W,H * .6],[W * .85,H * .68,W,H * .6],[W,H],[W * .85,H * .68,W,H * .6],[W,H],[W * .85,H * .68,W,H * .6],[W,H]); FS('rgba(85,160,70,.9)'); bP(); poly([0,H],[W * .6,H * .55,W,H * .78],[W * .6,H * .55,W,H * .78],[W,H],[W * .6,H * .55,W,H * .78],[W,H],[W * .6,H * .55,W,H * .78],[W,H]);

      const rng = mulberry32(75); const fcols = ['#ff8fb3', '#fff3b0', '#ffffff', '#ffd166'];
      times(26, i => {
        const fx = rng() * W, fy = H * (.62 + rng() * .34); FS(fcols[FL(rng() * fcols.length)]);
        times(4, k => {
          dotP(fx + CO(k * 1.57) * 4, fy + SI(k * 1.57) * 4, 3.5)
        })
      });

      const bt = t * 2;
      for (const [bx0, by0, ph] of [[.25, .35, 0], [.7, .42, 2]]) {
        const bx = W * (bx0 + .06 * SI(bt + ph)), by = H * (by0 + .04 * SI(bt * 1.7 + ph)); FS('rgba(255,255,255,.85)');
        ([-1, 1]).forEach(s => {
          ellP(bx + s * 6, by, 5 * (.6 + .4 * AB(SI(bt * 3 + ph))), 8, s * .3)
        })
      }
    } else if (pr === 'volcano') {

      sky([[0,'#1a0f14'],[.6,'#3a1620'],[1,'#12080b']]); const mx = W * .5, mtop = H * .32, mbot = H;

      FS('#241317'); mv(mx - W * .45, mbot); mT(mx - W * .45, mbot); lT(mx - W * .08, mtop); mT(mx - W * .45, mbot); lT(mx - W * .08, mtop); lT(mx + W * .08, mtop); mT(mx - W * .45, mbot); lT(mx - W * .08, mtop); lT(mx + W * .08, mtop); lT(mx + W * .45, mbot); cP(); cP(); fL();

      FS('rgba(255,90,40,.9)'); ellP(mx, mtop + H * .02, W * .08, H * .025); SS('rgba(255,120,50,.75)'); lnW(H * .02); lC('round'); const rng = mulberry32(84);
      ([-1, 1]).forEach(s => {
        bP(); plS([mx + s * W * .05, mtop + H * .03],[mx + s * W * .14, mtop + H * .3, mx + s * W * .22, mbot])
      });

      FS('rgba(255,150,70,.8)');
      times(22, i => {
        const fx = mx + (rng() - .5) * W * .5; const fy = mtop - ((rng() + t * .15) % 1) * H * .5; const fr = 1 + rng() * 3; dotP(fx, fy, fr)
      });

      FS('rgba(60,45,50,.5)');
      times(6, i => {
        const sx = mx + SI(t * .6 + i) * W * .05 + (i - 3) * W * .02; const sy = mtop - H * (.08 + i * .07); dotP(sx, sy, H * (.05 + i * .015))
      })
    } else if (pr === 'rainbow') {

      sky([[0,'#bfe3ff'],[1,'#eaf6ff']]); const rcx = W * .5, rcy = H * .95, rmax = H * .78; const cols = ['#ff5a5a', '#ff9f43', '#ffd43b', '#69db7c', '#4dabf7', '#748ffc', '#b197fc'];
      times(7, i => {
        SS(cols[i]); lnW(rmax / 7); gA(.65); bP(); aR(rcx, rcy, rmax - i * rmax / 7 - rmax / 14, PI, PI * 2); sK()
      });
      gA(1);

      const rng = mulberry32(63); FS('rgba(255,255,255,.9)');
      ([rcx - rmax * .8, rcx + rmax * .8]).forEach(cx => {
        times(5, k => {
          dotP(cx + (rng() - .5) * W * .14, rcy - rng() * H * .06, 14 + rng() * 16)
        })
      })
    } else if (pr === 'mtn') {

      sky([[0,'#ffb37a'],[.4,'#ffd9b0'],[.7,'#aebfd0']]); FS('rgba(255,235,200,.9)'); dot(.6,.38,H * .07);

      for (const [base, amp, col, seed2] of [[.55, .12, '#7d8ba0', 11], [.72, .16, '#4a5a70', 22]]) {
        const rng = mulberry32(seed2); FS(col); bP(); mv(0, H); lT(0, H * base);
        span(1, 12, i => {
          lT(i * W / 12, H * (base - amp * rng()))
        })
        lT(W, H); cP(); fL()
      }
    } else if (pr === 'space') {
      const rng = mulberry32(414);

      sky([[0,'#03040c'],[1,'#0d1230']]); scat(414, 130, (rng, i) => {
        const tw = .4 + .6 * AB(SI(t * .8 + i * 2.3));
        FS(`rgba(255,255,255,${.2 + .6 * tw * rng()})`);
        rect(rng() * W, rng() * H, 1.4, 1.4)
      });

      const px2 = W * .72, py2 = H * .4, pr2 = H * .2; FS(lg(px2 - pr2, py2 - pr2, px2 + pr2, py2 + pr2,[0, '#e8c98a',.5, '#b98d4f',1, '#6e4f2a'])); dotP(px2, py2, pr2); SS('rgba(230,210,170,.55)'); lnW(H * .02); ellPS(px2, py2 + pr2 * .1, pr2 * 1.8, pr2 * .45, -.18)
    } else if (pr === 'sea') {
      const rng = mulberry32(202);

      sky([[0,'#0a4d7a'],[.6,'#0b3a63'],[1,'#061f38']]);

      times(5, i => {
        const lx = W * (.15 + i * .18); FS(lg(lx, 0, lx + W * .12, H,[0, 'rgba(180,230,255,.18)',1, 'rgba(180,230,255,0)'])); mv(lx, 0); mT(lx, 0); lT(lx + W * .05, 0); lT(lx + W * .05 + W * .14, H); lT(lx + W * .05 + W * .14, H); lT(lx + W * .14, H); cP(); cP(); fL()
      });

      scat(202, 22, (rng, i) => {
        const bx = rng() * W, r2 = 1.5 + rng() * 4; const by = (1 - ((rng() + t * (.03 + .03 * rng())) % 1)) * H; SS('rgba(200,235,255,.5)'); lnW(1); dotPS(bx + SI(t + i) * 4, by, r2)
      })
    } else if (pr === 'desert') {

      sky([[0,'#ffd9a0'],[.45,'#ffedcf'],[.46,'#e8b968'],[1,'#c98f3d']]); FS('rgba(255,240,200,.95)'); dot(.5,.3,H * .11);

      for (const [base, amp, col] of [[.6, .07, '#d9a44f'], [.75, .09, '#b57f30']]) {
        FS(col); mv(0, H);
        for (let x = 0; x <= W; x += W / 40) {
          lT(x, H * (base + amp * SI(x / W * 4.4 + base * 9)))
        }
        lT(W, H); cP(); fL()
      }
    } else if (pr === 'aurora') {
      const rng = mulberry32(777);

      sky([[0,'#050a18'],[1,'#101c30']]); scat(777, 60, (rng, i) => {
        const tw = .3 + .7 * AB(SI(t * .7 + i * 1.9));
        FS(`rgba(255,255,255,${.2 + .55 * tw * rng()})`);
        rect(rng() * W, rng() * H * .7, 1.3, 1.3)
      });

      for (const [hue, ph0, amp] of [[140, 0, .5], [190, 2.1, .34], [280, 4.2, .22]]) {
        FS(`hsla(${hue},85%,60%,${amp * .4})`);
        mv(0, H);
        for (let x = 0; x <= W; x += W / 32) {
          const y = H * (.28 + .12 * SI(x / W * 5 + ph0 + t * .6) + .06 * SI(x / W * 11 - t * .9 + ph0)); lT(x, y)
        }
        lT(W, H); cP(); fL()
      }
    } else if (pr === 'forest') {

      sky([[0,'#12351f'],[.6,'#1d4d2a'],[1,'#0e2413']]);

      const rng = mulberry32(313);
      times(10, i => {
        FS(`rgba(230,255,190,${.05 + .08 * rng()})`);
        dotP(rng() * W, rng() * H * .5, 10 + rng() * 26)
      });

      spt(0, 9, i => {
        const tx = rng() * W, th = H * (.3 + rng() * .28), tw = th * .42, ty = H;
        FS(`rgba(8,26,12,${.75 + .25 * rng()})`);
        for (const [sy, sw] of [[1, 1], [.62, .72], [.3, .45]]) {
          poly([tx,ty - th * sy - th * .3],[tx - tw * sw,ty - th * sy + th * .34],[tx + tw * sw,ty - th * sy + th * .34])
        }
      })
    } else if (pr === 'beach') {
      const rng = mulberry32(909);

      sky([[0,'#8ecfff'],[.5,'#c9e9ff'],[.51,'#2b7fc9'],[.78,'#1d63a8'],[.79,'#e8d5a0'],[1,'#d9c289']]);

      FS('rgba(255,245,200,.95)'); dot(.78,.18,H * .09);

      SS('rgba(255,255,255,.45)'); lnW(1.4); scat(909, 14, (rng, i) => {
        const wy = H * (.54 + rng() * .22), wl = W * (.06 + rng() * .18); const wx = ((rng() + t * .02) % 1) * W; gA(.3 + .4 * rng()); plS([wx, wy],[wx + wl, wy])
      });
      gA(1)
    } else if (pr === 'grid') {

      sky([[0,'#0c0820'],[.6,'#241040'],[1,'#451a55']]); const horizon = H * .55; SS('rgba(255,110,200,.5)'); lnW(1.2);

      span(-10, 10, i => {
        plS([W / 2 + i * W * .06, horizon],[W / 2 + i * W * .3, H])
      })

      times(9, k => {
        const f = ((k / 9 + t * .12) % 1); const y = horizon + f * f * (H - horizon); gA(.25 + .55 * f); plS([0, y],[W, y])
      });
      gA(1);

      FS(lg(0, horizon - 14, 0, horizon + 14,[0, 'rgba(255,110,200,0)',.5, 'rgba(255,150,220,.55)',1, 'rgba(255,110,200,0)'])); rect(0, horizon - 14, W, 28)
    } else if (pr === 'city') {

      sky([[0,'#141a30'],[1,'#3a3050']]); const rng = mulberry32(555); const n = 8;
      spt(0, n, i => {
        const bw = W / n * (.7 + rng() * .5), bh = H * (.3 + rng() * .35); const bx = i * W / n + rng() * W * .02, by = H - bh; FS('#10131f'); rect(bx, by, bw, bh + 2);
        for (let wy = by + H * .02; wy < H * .92; wy += H * .035) {
          for (let wx = bx + bw * .12; wx < bx + bw * .85; wx += bw * .18) {
            if (rng() < .35) {
              FS(`rgba(255,220,140,${.3 + .5 * rng()})`);
              rect(wx, wy, 2, 3)
            }
          }
        }
      })
    } else defaultBackdrop(c, W, H);
    flT('none');
    if (p.bgDim > 0) { FS(`rgba(8,10,16,${p.bgDim * .55})`); fR(0, 0, W, H) }
  }
  return {
    clamp01, lerp, mulberry32, strSeed, ANIMS, FITS, ACCS, BGS, EYES, NUM_KEYS, SLIDERS, PARTICLES, HAIRS, GRADE_STYLES,
    defaultParams, clampParams, randomParams, drawBubble,
    serializePreset, parsePreset, parseFavList,
    keyAlpha, erodeAlpha, despill, blinkOpen, drawParticles, contactShadow, drawCastShadow, drawRimLight, drawStickerOutline, drawVignette, drawWatermark, drawReflection, drawGlow, mannequinPose, skeleton, drawMannequin, drawAccessory, drawBackdrop, shined,
    MIME_CANDIDATES, pickMime,
  }
})();
if (typeof globalThis !== 'undefined') globalThis.ShiroLib = ShiroLib;

if (typeof document !== 'undefined') (() => {
    const PI = Math.PI, MX = Math.max, MN = Math.min, SI = Math.sin, CO = Math.cos, AB = Math.abs, RD = Math.round, FL = Math.floor;
const K0='#4a3828', K1='rgba(250,252,255,.8)';
  const L = ShiroLib;
  const $ = id => document.getElementById(id);
  const on = (id, ev, k, n) => $(id).addEventListener(ev, e => { let v = n ? e.target.value.slice(0, n) : k === 'flip' ? e.target.checked : e.target.value; state.params[k] = v; touch() });
  const mk = t => document.createElement(t);
  const stage = $('stage'), ctx = stage.getContext('2d'); let W = stage.width, H = stage.height;
  const err = m => { $('err').textContent = m || '' };

  const state = {
    params: L.defaultParams(),
    bg: null,
    media: null,
    favs: loadFavs(),
    keySrc: null, keyParams: '',
    recorder: null, recTimer: 0,
    frozenT: null,
  };






  const shCv = mk('canvas'), shCtx = shCv.getContext('2d'); const modCv = mk('canvas'), mctx = modCv.getContext('2d'); const rimCv = mk('canvas'), rimCtx = rimCv.getContext('2d'); const outCv = mk('canvas'), outCtx = outCv.getContext('2d'); const pixCv = mk('canvas'), pctx = pixCv.getContext('2d'); const glowCv = mk('canvas'), glowCtx = glowCv.getContext('2d');

  function silhouetteOf(src, w, h, color, cv, cctx, cacheable) {
    cv = cv || shCv; cctx = cctx || shCtx; const col = color || '#0a0a0e';
    if (cacheable && cv._src === src && cv._srcv === (src._v || null) && cv._col === col && cv.width === w && cv.height === h) return cv;
    cv._src = cacheable ? src : null; cv._srcv = cacheable ? (src._v || null) : null; cv._col = cacheable ? col : null;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
    cctx.clearRect(0, 0, w, h); cctx.globalCompositeOperation = 'source-over'; cctx.drawImage(src, 0, 0, w, h);
    cctx.globalCompositeOperation = 'source-in';
    cctx.fillStyle = color || '#0a0a0e'; cctx.fillRect(0, 0, w, h); cctx.globalCompositeOperation = 'source-over';
    return cv
  }

  const keyCv = mk('canvas'), kctx = keyCv.getContext('2d', { willReadFrequently: true });
  function keyedMediaCanvas() {
    const el = state.media.el; const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih || el.readyState < 2) return null;
    const cacheKey = `${iw}x${ih}|${state.params.keyThresh}|${state.params.keySoft}|${state.params.despill}`;
    if (state.media.kind === 'image' && state.keyParams === cacheKey) return keyCv;
    const scale = MN(1, 960 / iw); const kw = RD(iw * scale), kh = RD(ih * scale);
    if (keyCv.width !== kw || keyCv.height !== kh) { keyCv.width = kw; keyCv.height = kh }
    kctx.drawImage(el, 0, 0, kw, kh);
    if (state.params.keyThresh > 0) {
      const im = kctx.getImageData(0, 0, kw, kh), d = im.data;
      for (let i = 0; i < d.length; i += 4)
        d[i + 3] = MN(d[i + 3], L.keyAlpha(d[i], d[i + 1], d[i + 2], state.params.keyThresh, state.params.keySoft));
      L.erodeAlpha(d, kw, kh); L.despill(d, state.params.despill); kctx.putImageData(im, 0, 0)
    }
    keyCv._v = cacheKey;
    if (state.media.kind === 'image') state.keyParams = cacheKey;
    return keyCv
  }
  const shnCv = mk('canvas'), snc = shnCv.getContext('2d');
  function drawMedia(c, t) {
      const gA=v=>c.globalAlpha = v, flT=v=>c.filter = v;
    const el = state.media.el; const iw = el.naturalWidth || el.videoWidth, ih = el.naturalHeight || el.videoHeight;
    if (!iw || !ih) return;
    const src = state.params.keyThresh > 0 ? keyedMediaCanvas() : el;
    if (!src) return;
    const sw = src.width || iw, sh = src.height || ih; const hPix = H * (.25 + .7 * state.params.scale); const wPix = hPix * (sw / sh); const cx = state.params.x * W, baseY = state.params.y * H;
    L.contactShadow(c, cx, baseY, wPix * .55, state.params.shadow * .5, `hsla(${RD(state.params.shadowHue * 360)},45%,12%,${state.params.shadow * .5})`);
    const silCache = state.media.kind === 'image';
    const glowCol = `hsla(${RD(state.params.glowHue * 360)},90%,70%,1)`;
    L.drawGlow(c, silhouetteOf(src, sw, sh, glowCol, glowCv, glowCtx, silCache), wPix, hPix, cx, baseY, state.params.glow);
    L.drawCastShadow(c, silhouetteOf(src, sw, sh, `hsla(${RD(state.params.shadowHue * 360)},45%,12%,1)`, null, null, silCache), wPix, hPix, cx, baseY, state.params.castDir, state.params.shadow * .4, state.params.shadowSoft);
    L.drawRimLight(c, silhouetteOf(src, sw, sh, `hsla(${RD(state.params.rimHue * 360)},75%,72%,1)`, rimCv, rimCtx, silCache), wPix, hPix, cx, baseY, state.params.castDir, state.params.rim);
    L.drawStickerOutline(c, silhouetteOf(src, sw, sh, `hsla(${RD(state.params.outlineHue * 360)},70%,80%,1)`, outCv, outCtx, silCache), wPix, hPix, cx, baseY, state.params.outline);
    L.drawReflection(c, src, cx, baseY, wPix, hPix, state.params.reflect);
    if (state.media.kind === 'video') el.playbackRate = .25 + state.params.vidSpeed * 1.5;
    c.save(); gA(state.params.opacity); const fParts = [];
    if (state.params.subjHue !== .5) fParts.push(`hue-rotate(${RD((state.params.subjHue - .5) * 360)}deg)`);
    if (state.params.subjSat !== .5) fParts.push(`saturate(${(state.params.subjSat * 2).toFixed(2)})`);
    if (state.params.subjBright !== .5) fParts.push(`brightness(${(.7 + state.params.subjBright * .6).toFixed(2)})`);
    if (state.params.temp !== .5) fParts.push(`sepia(${AB(state.params.temp - .5) * .8}) hue-rotate(${(state.params.temp - .5) * -40}deg)`);
    if (state.params.subjFx !== 'none') fParts.push(SUBJFX_FILTERS[state.params.subjFx]);
    if (fParts.length) flT(fParts.join(' '));
    if (state.params.blend !== 'none') c.globalCompositeOperation = state.params.blend;
    if (state.params.flip) { c.translate(2 * cx, 0); c.scale(-1, 1) }

    let drawSrc = src;
    if (state.params.pixel > .05) {
      const cell = 1 + state.params.pixel * 24; const pw = MX(2, RD(wPix / cell)), ph2 = MX(2, RD(hPix / cell)); pixCv.width = pw; pixCv.height = ph2; pctx.imageSmoothingEnabled = true; pctx.clearRect(0, 0, pw, ph2); pctx.drawImage(src, 0, 0, pw, ph2); c.imageSmoothingEnabled = false; drawSrc = pixCv
    }
    c.drawImage(state.params.shine > .02 ? L.shined(drawSrc, snc, shnCv, t, state.params.shine) : drawSrc, cx - wPix / 2, baseY - hPix, wPix, hPix); c.restore()
  }

  let _grainCv = null;
  function grainCv() {
    if (_grainCv) return _grainCv;
    const cv = mk('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), im = x.createImageData(128, 128), d = im.data; const rng = L.mulberry32(12345);
    for (let i = 0; i < d.length; i += 4) {
      const v = 110 + rng() * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255
    }
    x.putImageData(im, 0, 0);
    return _grainCv = cv
  }

  const t0 = performance.now();
  function frame() {
      const gA=v=>ctx.globalAlpha = v, lnW=v=>ctx.lineWidth = v, fT=v=>ctx.font = v, tA=v=>ctx.textAlign = v, flT=v=>ctx.filter = v, FS=v=>ctx.fillStyle = v, SS=v=>ctx.strokeStyle = v;
    const liveT = (performance.now() - t0) / 1000; const p = state.params;

    const t = state.frozenT !== null ? state.frozenT + (p.tOffset - .5) * 4 : liveT; ctx.clearRect(0, 0, W, H);

    const shaking = p.shake > 0 || p.camZoom > .02;
    if (shaking) {

      const os = 1 + p.shake * .04 + SI(t * .6) * p.camZoom * .22; ctx.save(); ctx.translate(W / 2 + (Math.random() - .5) * p.shake * 16, H / 2 + (Math.random() - .5) * p.shake * 16); ctx.scale(os, os); ctx.translate(-W / 2, -H / 2)
    }
    L.drawBackdrop(ctx, p, t, state.bg, W, H);

    const rotA = (p.rot - .5) * .6; const spinX = p.anim === 'spin' ? CO(t * 2.5) : 1; const flipY = p.anim === 'flip' ? CO(t * 2.5) : 1; const sq = p.squash > .02 ? SI(t * 3) * p.squash : 0; const sxx = (1 + sq * .18) * spinX, syy = (1 - sq * .22) * flipY; const xformed = AB(rotA) > .001 || AB(sxx - 1) > .001 || AB(syy - 1) > .001;
    if (state.media && xformed) {
      ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(rotA); ctx.scale(sxx, syy); ctx.translate(-p.x * W, -p.y * H)
    }
    if (state.media) drawMedia(ctx, t);
    else {
      const hPix = H * (.25 + .7 * p.scale), wPix = hPix * .55;

      let cx = p.x * W;
      if (p.anim === 'walk' || p.anim === 'run' || p.anim === 'moonwalk') {
        const spd = p.anim === 'run' ? .2 : p.anim === 'moonwalk' ? .07 : .10; const ph = (t * spd * (.5 + p.animSpeed) + .125) % 1.25;

        cx = p.anim === 'moonwalk' ? (p.flip ? -.125 + ph : 1.125 - ph) * W : (p.flip ? 1.125 - ph : -.125 + ph) * W
      }
      const baseY = p.y * H;
      if (xformed) {
        ctx.save(); ctx.translate(cx, baseY); ctx.rotate(rotA); ctx.scale(sxx, syy); ctx.translate(-cx, -baseY)
      }

      if (p.duo > .05) {
        const p2 = { ...p, opacity: p.opacity * .7, flip: !p.flip };
        ctx.save(); L.drawMannequin(ctx, p2, t * .9 + 2.3, cx + wPix * .55 * (p.flip ? -1 : 1), baseY, hPix * (.55 + p.duo * .35)); ctx.restore()
      }

      if ((AB(p.castDir - .5) >= .03 && p.shadow > 0) || p.rim > 0 || p.outline > 0 || p.reflect > 0 || p.glow > 0 || p.shine > .02) {
        modCv.width = Math.ceil(wPix); modCv.height = Math.ceil(hPix); mctx.clearRect(0, 0, modCv.width, modCv.height); L.drawMannequin(mctx, p, t, modCv.width / 2, modCv.height, modCv.height);
        L.drawGlow(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${RD(p.glowHue * 360)},90%,70%,1)`, glowCv, glowCtx), wPix, hPix, cx, baseY, p.glow);
        L.drawCastShadow(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${RD(p.shadowHue * 360)},45%,12%,1)`), wPix, hPix, cx, baseY, p.castDir, p.shadow * .4, p.shadowSoft);
        L.drawRimLight(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${RD(p.rimHue * 360)},75%,72%,1)`, rimCv, rimCtx), wPix, hPix, cx, baseY, p.castDir, p.rim);
        L.drawStickerOutline(ctx, silhouetteOf(modCv, modCv.width, modCv.height, `hsla(${RD(p.outlineHue * 360)},70%,80%,1)`, outCv, outCtx), wPix, hPix, cx, baseY, p.outline);
        L.drawReflection(ctx, modCv, cx, baseY, wPix, hPix, p.reflect)
      }
      if (p.pixel > .05) {

        const cell = 1 + p.pixel * 24; const pw = MX(2, RD(wPix / cell)), ph2 = MX(2, RD(hPix / cell)); pixCv.width = pw; pixCv.height = ph2; pctx.clearRect(0, 0, pw, ph2); L.drawMannequin(pctx, p, t, pw / 2, ph2, ph2); ctx.save(); gA(p.opacity); ctx.imageSmoothingEnabled = false; ctx.drawImage(pixCv, cx - wPix / 2, baseY - hPix, wPix, hPix); ctx.restore()
      } else {

        const fxParts = [];
        if (p.subjSat !== .5) fxParts.push(`saturate(${(p.subjSat * 2).toFixed(2)})`);
        if (p.subjBright !== .5) fxParts.push(`brightness(${(.7 + p.subjBright * .6).toFixed(2)})`);
        if (p.temp !== .5) fxParts.push(`sepia(${AB(p.temp - .5) * .8}) hue-rotate(${(p.temp - .5) * -40}deg)`);
        if (p.subjFx !== 'none') fxParts.push(SUBJFX_FILTERS[p.subjFx]);
        const fx = fxParts.join(' ');
        if (fx) flT(fx);
        if (p.blend !== 'none') ctx.globalCompositeOperation = p.blend;
        if (p.trail > 0) {
          for (let i = 2; i >= 1; i--) {
            gA(p.trail * .45 * (3 - i) / 3); L.drawMannequin(ctx, p, t - i * .09, cx, baseY, hPix)
          }
          gA(1)
        }
        gA(p.opacity);
        if (p.shine > .02) {
          ctx.drawImage(L.shined(modCv, snc, shnCv, t, p.shine), cx - wPix / 2, baseY - hPix, wPix, hPix)
        } else {
          L.drawMannequin(ctx, p, t, cx, baseY, hPix)
        }
        gA(1);
        if (p.blend !== 'none') ctx.globalCompositeOperation = 'source-over';
        if (fx) flT('none')
      }

      if (p.bubble) L.drawBubble(ctx, p.bubble, cx, baseY - hPix * 1.02, W, H, p.bubbleHue);
      if (xformed) ctx.restore()
    }
    if (state.media && xformed) ctx.restore();
    if (p.particles !== 'none') L.drawParticles(ctx, W, H, p.particles, t, p.seed);

    const gs = L.GRADE_STYLES[p.grade];
    if (gs) {
      ctx.globalCompositeOperation = gs[0]; FS(gs[1]); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'
    }
    if (shaking) ctx.restore();
    if (p.grain > 0) {
      ctx.save(); gA(p.grain * .15);

      ctx.drawImage(grainCv(), -Math.random() * 64, -Math.random() * 64, W + 128, H + 128); ctx.restore()
    }
    if (p.title) {
      const fs = 18 + p.titleSize * 66; ctx.save();
      fT(`700 ${RD(fs)}px 'Hiragino Sans', system-ui, sans-serif`);
      tA('center'); ctx.textBaseline = 'middle'; lnW(MX(2, fs * .14)); SS('rgba(0,0,0,.78)'); ctx.lineJoin = 'round'; ctx.strokeText(p.title, W / 2, H * .12);
      FS(`hsl(${RD(p.titleHue * 360)},75%,85%)`);
      ctx.fillText(p.title, W / 2, H * .12); ctx.restore()
    }
    L.drawVignette(ctx, W, H, p.vignette);
    if (p.frame > .02) {
      const b = 4 + p.frame * 44;
      FS(`hsla(${RD(p.frameHue * 360)},45%,${p.frameHue < .08 ? 14 : 90}%,.96)`);
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(0, 0, W, H); ctx.rect(b, b, W - 2 * b, H - 2 * b); ctx.fill('evenodd')
    }
    L.drawWatermark(ctx, p.watermark, W, H, p.wmOpacity, p.wmPos); requestAnimationFrame(frame)
  }

  const sDiv = $('sliders');
  for (const [key, label] of L.SLIDERS) {
    const lab = mk('label'); lab.className = 'ctl'; lab.htmlFor = 'sl-' + key;
    lab.innerHTML = `${label}<output id="out-${key}"></output>`;
    const inp = mk('input'); inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = .01; inp.id = 'sl-' + key;
    inp.addEventListener('input', () => { state.params[key] = +inp.value; syncUI(false) });

    inp.addEventListener('dblclick', () => { state.params[key] = L.defaultParams()[key]; syncUI(false) });
    sDiv.appendChild(lab); sDiv.appendChild(inp)
  }
  $('sel-acc2').innerHTML = $('sel-acc').innerHTML;
  function syncUI(fromParams = true) {
    touch();
    for (const [key] of L.SLIDERS) {
      if (fromParams) $('sl-' + key).value = state.params[key];
      $('out-' + key).textContent = (+state.params[key]).toFixed(2)
    }
    if (fromParams) {
      $('sel-anim').value = state.params.anim; $('sel-acc').value = state.params.acc; $('sel-eyes').value = state.params.eyeStyle; $('sel-fx').value = state.params.subjFx; $('sel-grade').value = state.params.grade; $('sel-blend').value = state.params.blend; $('sel-bgfit').value = state.params.bgFit; $('sel-bgpreset').value = state.params.bgPreset; $('sel-particles').value = state.params.particles; $('sel-wmpos').value = state.params.wmPos; $('sel-hair').value = state.params.hair; $('sel-vidq').value = state.params.vidQ; $('sel-acc2').value = state.params.acc2; $('chk-flip').checked = state.params.flip;
      $('inp-watermark').value = state.params.watermark; $('inp-bubble').value = state.params.bubble; $('inp-title').value = state.params.title
    }
  }
  on('sel-anim', 'change', 'anim');
  on('sel-acc', 'change', 'acc');
  on('sel-acc2', 'change', 'acc2');
  on('sel-eyes', 'change', 'eyeStyle');
  on('sel-fx', 'change', 'subjFx');
  on('sel-grade', 'change', 'grade');
  on('sel-blend', 'change', 'blend');
  on('sel-bgfit', 'change', 'bgFit');
  on('sel-bgpreset', 'change', 'bgPreset');
  on('sel-particles', 'change', 'particles');
  on('sel-wmpos', 'change', 'wmPos');
  on('sel-hair', 'change', 'hair');
  on('sel-vidq', 'change', 'vidQ');
  on('chk-flip', 'change', 'flip');
  $('chk-guides').addEventListener('change', e => $('guides').classList.toggle('on', e.target.checked));
  on('inp-watermark', 'input', 'watermark', 60);
  on('inp-bubble', 'input', 'bubble', 24);
  on('inp-title', 'input', 'title', 40);

  const PLACES = {
    tl: [.2, .62], tc: [.5, .62], tr: [.8, .62],
    ml: [.2, .84], center: [.5, .84], mr: [.8, .84],
    bl: [.2, .97], bc: [.5, .97], br: [.8, .97],
  };
  $('sel-place').addEventListener('change', e => {
    const pt = PLACES[e.target.value]; e.target.value = '';
    if (!pt) return;
    state.params.x = pt[0]; state.params.y = pt[1]; syncUI()
  });

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
    Object.assign(state.params, f); syncUI()
  });
  $('chk-freeze').addEventListener('change', e => {

    state.frozenT = e.target.checked ? (performance.now() - t0) / 1000 : null; const v = state.media && state.media.kind === 'video' ? state.media.el : null;
    if (v) e.target.checked ? v.pause() : v.play().catch(() => {});
    const bv = state.bg && state.bg.tagName === 'VIDEO' ? state.bg : null;
    if (bv) e.target.checked ? bv.pause() : bv.play().catch(() => {})
  });

  $('btn-random').addEventListener('click', () => {
    state.params = L.randomParams(L.mulberry32((Math.random() * 4294967296) >>> 0)); syncUI()
  });
  $('btn-reset').addEventListener('click', () => { state.params = L.defaultParams(); syncUI() });

  function readURL(file) { return URL.createObjectURL(file) }
  $('bg-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('video/')) {
      const v = mk('video'); v.muted = true; v.loop = true; v.playsInline = true; v.src = readURL(f);
      v.onloadeddata = () => { v.play().catch(() => {}); state.bg = v; err('') };
      v.onerror = () => err('背景動画を読み込めませんでした(mp4/webm/mov 等を確認)')
    } else {
      const img = new Image();
      img.onload = () => { state.bg = img; err('') };
      img.onerror = () => err('背景画像を読み込めませんでした');
      img.src = readURL(f)
    }
    e.target.value = ''
  });
  $('model-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.type.startsWith('video/')) {
      const v = mk('video'); v.muted = true; v.loop = true; v.playsInline = true; v.src = readURL(f);
      v.onloadeddata = () => { v.play().catch(() => {}); state.media = { kind: 'video', el: v }; state.keyParams = ''; err('') };
      v.onerror = () => err('動画を読み込めませんでした(mp4/webm/mov 等を確認)')
    } else if (f.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => { state.media = { kind: 'image', el: img }; state.keyParams = ''; err('') };
      img.onerror = () => err('画像を読み込めませんでした');
      img.src = readURL(f)
    } else err('対応形式: 画像 / 動画ファイル');
    e.target.value = ''
  });
  $('btn-model-reset').addEventListener('click', () => { state.media = null });
  $('btn-bg-reset').addEventListener('click', () => { state.bg = null });

  function download(blob, name) {
    const a = mk('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }
  $('btn-png').addEventListener('click', () =>
    stage.toBlob(b => b ? download(b, `shiro-s${state.params.seed}.png`) : err('PNG生成に失敗'), 'image/png'));
  $('btn-png-copy').addEventListener('click', () => {
    if (!navigator.clipboard || !window.ClipboardItem) return err('このブラウザはコピーに未対応です');
    stage.toBlob(async b => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
        const t = $('btn-png-copy'); t.textContent = 'コピーしました'; setTimeout(() => t.textContent = 'PNGをコピー', 1500)
      } catch (e) { err('コピーに失敗しました(ブラウザ権限を確認)') }
    }, 'image/png')
  });

  $('btn-rec').addEventListener('click', () => {
    if (state.recorder) { state.recorder.stop(); return }
    const pick = L.pickMime(m => MediaRecorder.isTypeSupported(m));
    if (!pick) return err('このブラウザは動画録画に未対応です');
    const bits = { low: 1500000, std: 4000000, high: 8000000 }[state.params.vidQ] || 4000000;
    const rec = new MediaRecorder(stage.captureStream(30), { mimeType: pick.mime, videoBitsPerSecond: bits });
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      state.recorder = null; clearTimeout(state.recTimer);
      download(new Blob(chunks, { type: pick.mime }), 'shiro.' + pick.ext);
      $('btn-rec').textContent = '動画 録画開始'
    };
    state.recorder = rec; rec.start(); $('btn-rec').textContent = '録画中… クリックで停止';
    state.recTimer = setTimeout(() => state.recorder && state.recorder.stop(), 15000)
  });
  $('btn-share').addEventListener('click', async () => {
    try {
      const blob = await new Promise(r => stage.toBlob(r, 'image/png'));
      const file = new File([blob], 'shiro.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }))
        await navigator.share({ files: [file], title: 'Shiro' });
      else download(blob, 'shiro.png')
    } catch (e) { if (e.name !== 'AbortError') err('共有に失敗: ' + e.message) }
  });

  const FKEY = 'shiro.favs.v1';
  function loadFavs() {
    try { return L.parseFavList(localStorage.getItem(FKEY) || '[]') }
    catch { return [] }
  }
  function saveFavs() { localStorage.setItem(FKEY, JSON.stringify(state.favs)) }
  function renderFavs() {
    const bar = $('fav-bar'); bar.innerHTML = '';
    for (const f of state.favs) {
      const d = mk('div'); d.className = 'fav'; d.title = f.name; d.draggable = true;
      d.innerHTML = `<img alt=""><span></span><button class="del" title="削除">×</button>`;
      d.querySelector('img').src = f.thumb || ''; d.querySelector('span').textContent = f.name;
      d.addEventListener('click', () => { state.params = L.clampParams(f.params); syncUI() });

      d.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', f.id); ev.dataTransfer.effectAllowed = 'move' });
      d.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move' });
      d.addEventListener('drop', ev => {
        ev.preventDefault(); const id = ev.dataTransfer.getData('text/plain');
        if (!id || id === f.id) return;
        const from = state.favs.findIndex(x => x.id === id), to = state.favs.findIndex(x => x.id === f.id);
        if (from < 0 || to < 0) return;
        const [mv] = state.favs.splice(from, 1); state.favs.splice(to, 0, mv); saveFavs(); renderFavs()
      });
      d.querySelector('span').addEventListener('dblclick', ev => {
        ev.stopPropagation(); const n = prompt('新しい名前', f.name);
        if (n !== null) { f.name = n || f.name; saveFavs(); renderFavs() }
      });
      d.querySelector('.del').addEventListener('click', ev => {
        ev.stopPropagation();
        state.favs = state.favs.filter(x => x.id !== f.id);
        saveFavs(); renderFavs()
      });
      bar.appendChild(d)
    }
  }
  function thumb() {
    const c = mk('canvas'); c.width = 110; c.height = 62; c.getContext('2d').drawImage(stage, 0, 0, 110, 62);
    return c.toDataURL('image/jpeg', .7)
  }
  $('btn-fav').addEventListener('click', () => {
    const name = prompt('お気に入りの名前', 'モデル ' + (state.favs.length + 1));
    if (name === null) return;
    state.favs.push({ id: 'f' + Date.now().toString(36), name: name || '無題', params: state.params, thumb: thumb() });
    saveFavs(); renderFavs()
  });
  $('btn-fav-exp').addEventListener('click', () =>
    download(new Blob([JSON.stringify(state.favs, null, 1)], { type: 'application/json' }), 'shiro-favs.json'));
  $('fav-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => {
      const list = L.parseFavList(txt);
      for (const it of list) it.id = it.id || 'f' + Math.random().toString(36).slice(2);
      state.favs = state.favs.concat(list); saveFavs(); renderFavs(); err('')
    }).catch(() => err('お気に入りファイルを読み込めませんでした'));
    e.target.value = ''
  });

  let dragging = false;
  const stageXY = e => {
    const r = stage.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
  };
  stage.addEventListener('pointerdown', e => {
    dragging = true; stage.setPointerCapture(e.pointerId); const [nx, ny] = stageXY(e); state.params.x = L.clamp01(nx); state.params.y = L.clamp01(ny); syncUI()
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const [nx, ny] = stageXY(e); state.params.x = L.clamp01(nx); state.params.y = L.clamp01(ny); syncUI()
  });
  stage.addEventListener('pointerup', () => dragging = false);
  stage.addEventListener('wheel', e => {
    e.preventDefault(); state.params.scale = L.clamp01(state.params.scale - e.deltaY * .0008); syncUI()
  }, { passive: false });

  $('btn-code-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(L.serializePreset('shared', state.params)); err('') }
    catch { err('コピーに失敗しました(ブラウザのクリップボード権限を確認)') }
  });
  $('btn-code-load').addEventListener('click', () => {
    const txt = prompt('パラメータコードを貼り付け');
    if (txt === null) return;
    try { state.params = L.parsePreset(txt).params; syncUI(); err('') }
    catch { err('コードを読み込めませんでした') }
  });

  const ASPECTS = { '16:9': [1280, 720], '1:1': [960, 960], '9:16': [720, 1280] };
  function applyAspect(v) {
    const [w, h] = ASPECTS[v] || ASPECTS['16:9']; stage.width = w; stage.height = h; W = w; H = h
  }
  $('sel-aspect').addEventListener('change', e => { applyAspect(e.target.value); touch() });

  let undoStack = [], redoStack = [], lastSnap = '', lastT = 0, suppressHist = false;
  function histTouch() {
    if (lastSnap === '') lastSnap = JSON.stringify(state.params);
    const now = performance.now();
    if (now - lastT > 700) {
      const cur = JSON.stringify(state.params);
      if (cur !== lastSnap) { undoStack.push(lastSnap); if (undoStack.length > 60) undoStack.shift() }
      redoStack = []
    }
    lastT = now; lastSnap = JSON.stringify(state.params)
  }
  function applySnap(s) {
    suppressHist = true; state.params = L.clampParams(JSON.parse(s)); syncUI(); suppressHist = false; lastSnap = s; lastT = 0
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(state.params)); applySnap(undoStack.pop())
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(state.params)); applySnap(redoStack.pop())
  }

  const SES_KEY = 'shiro.session.v1'; let dirty = false;
  function touch() { dirty = true; if (!suppressHist) histTouch() }
  setInterval(() => {
    if (!dirty) return; dirty = false;
    try {
      localStorage.setItem(SES_KEY, JSON.stringify({ v: 1, params: state.params, aspect: $('sel-aspect').value }))
    } catch (e) {}
  }, 1200);
  function restoreSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SES_KEY) || 'null');
      if (!s || s.v !== 1 || !s.params) return false;
      state.params = L.clampParams(s.params);
      if (s.aspect) { $('sel-aspect').value = s.aspect; applyAspect(s.aspect) }
      return true
    } catch (e) { return false }
  }

  document.addEventListener('keydown', e => {
    if (/^(input|select|textarea)$/i.test(e.target.tagName)) return;
    if (e.key === 'r' || e.key === 'R') $('btn-random').click();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return }
    if (/^[1-9]$/.test(e.key) && state.favs[+e.key - 1]) {
      state.params = L.clampParams(state.favs[+e.key - 1].params); syncUI()
    }

    const nud = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1] }[e.key];
    if (nud) {
      e.preventDefault(); state.params[nud[0]] = L.clamp01(state.params[nud[0]] + nud[1] * .01 * (e.shiftKey ? 10 : 1)); syncUI(false)
    }
  });

  const restored = restoreSession();

  if (!restored && matchMedia('(prefers-reduced-motion: reduce)').matches) state.params.anim = 'still';
  syncUI(); renderFavs(); requestAnimationFrame(frame)
})();
