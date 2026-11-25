/* عامل الخدمة (خطة العمل: الفتح التالي من الجهاز في أقل من ثانية، والعمل دون اتصال، وتحديث منضبط).
   يولد مع كل بناء بإصداره وقائمة ملفات الشاشة الأولى (vite.config.ts). قواعده:
   - الصفحة (index.html وv.html): من الشبكة أولا دائما، فالإصدار الجديد يظهر عند أول فتح بعد نشره؛ وإن تأخرت الشبكة
     أو انقطعت فمن الجهاز. لا تحديث على مرتين ولا نسخة نصفها قديم: الصفحة وملفاتها من الإصدار نفسه.
   - الملفات ذات البصمة (assets): من الجهاز أولا، فاسمها يتغير إذا تغير محتواها.
   - البيانات (data.json) والخادم (/api/) لا يمسها: نسخة البيانات على الجهاز في IndexedDB، والطلب بالبصمة. */
const VERSION = "2026-11-25T11:59:29.313Z";
const PRECACHE = ["./","./assets/el-messiri-arabic-400-normal-DpRZdUUn.woff2","./assets/el-messiri-arabic-700-normal-D9aO7CWn.woff2","./assets/el-messiri-latin-400-normal-DnjVM4dS.woff2","./assets/el-messiri-latin-700-normal-2VyxPaO_.woff2","./assets/logo-CaLBbQvd.js","./assets/logo-DUK4i2Le.webp","./assets/main-CttWaPzI.css","./assets/main-CxTF2GI5.js"];
const CACHE = "jr2-" + VERSION;
const NAV_TIMEOUT = 4000;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("jr2-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function fromNetwork(req) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout")), NAV_TIMEOUT);
    fetch(req).then((r) => { clearTimeout(t); res(r); }, (err) => { clearTimeout(t); rej(err); });
  });
}
async function page(req) {
  const c = await caches.open(CACHE), url = new URL(req.url), key = /\/v\.html$/.test(url.pathname) ? "./v.html" : "./";
  try {
    const r = await fromNetwork(req);
    if (r.ok) await c.put(key, r.clone());
    return r;
  } catch {
    const hit = await c.match(key);
    if (hit) return hit;
    throw new Error("offline");
  }
}
async function asset(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) await c.put(req, r.clone());
  return r;
}
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope).pathname, rel = url.pathname.slice(scope.length);
  if (req.mode === "navigate" && (rel === "" || rel === "index.html" || rel === "v.html")) { e.respondWith(page(req)); return; }
  if (rel.startsWith("assets/")) e.respondWith(asset(req));
});
