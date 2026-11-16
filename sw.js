'use strict';
/*
 * Shiro — Service Worker（PWA）
 *
 * 役割は「アプリ本体（シェル）を端末にキャッシュしてオフラインでも起動できる」
 * ことだけ。ユーザーの画像・動画・お気に入りには一切触らない（それらは元々
 * 端末の外に出ない）。外部通信の仲介もしない（同一オリジンの GET のみ扱う）。
 *
 * キャッシュ方針（新版に固着しないための設計）:
 * - 取得はネットワーク優先。在線時は常に最新を取りに行き、成功したら
 *   キャッシュを差し替える。SW の版数を上げ忘れても表示が古くならない。
 * - オフライン時のみキャッシュから返す。ナビゲーションは index.html に
 *   フォールバックするので、共有リンク（#s=…）で開いても起動できる
 *   （フラグメントはリクエストに含まれないため復元処理は通常どおり動く）。
 * - キャッシュ名に版数を持ち、activate で旧版キャッシュを全て消す。
 *   SW_VERSION を上げれば古いシェルは残らない。
 * - インストール時にシェル一式を先読みし、skipWaiting + clients.claim で
 *   新版を速やかに有効化する。
 *
 * http(s) 配信時のみ登録される（app.js の registerServiceWorker が判定）。
 * file:// で開いた場合は従来どおり SW なしで動く。
 */
const SW_VERSION = '0.1.0+1';
const CACHE_NAME = 'shiro-shell-' + SW_VERSION;
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return; // 外部リクエストは素通し
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const res = await fetch(req);
      if (res && res.status === 200) {
        try { await cache.put(req, res.clone()); } catch { /* 容量超過などは無視して応答を優先 */ }
      }
      return res;
    } catch (netErr) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      throw netErr;
    }
  })());
});

// test.mjs から検証するためのフック（SW 環境では module は未定義で無効）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SW_VERSION, CACHE_NAME, APP_SHELL };
}
