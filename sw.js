// 讓記帳本沒網路也能打開：第一次打開時把所有檔案存在手機裡。
// 之後打開：有網路就跟網站拿最新的（順便更新存著的那份），3 秒沒回應或沒網路才用存著的。
// 所以改版後家人重開 App 就是新版；改了要上線時把 VERSION 也改一下，舊的存檔才會清掉。
const VERSION = "ledger-1.7.4";
const FILES = ["./", "index.html", "app.js", "core.js", "style.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"];
const FONTS = ["https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "no-cache" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (FONTS.some((f) => req.url.startsWith(f))) {           // 字體：存過就一直用
    e.respondWith(caches.open(VERSION).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const key = req.mode === "navigate" ? "./" : req;
    const fresh = fetch(req, { cache: "no-cache" }).then((r) => { if (r.ok) c.put(key, r.clone()); return r; });   // no-cache：每次問伺服器有沒有新版（GitHub Pages 會叫瀏覽器快取 10 分鐘）
    const late = new Promise((ok) => setTimeout(() => ok(null), 3000));
    const r = await Promise.race([fresh.catch(() => null), late]);
    if (r && r.ok) return r;
    const hit = await c.match(key, { ignoreSearch: true });
    if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  })());
});
