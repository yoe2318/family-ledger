// 家庭記帳：畫面與操作。資料只存在這台裝置的 localStorage（KEY），邏輯在 core.js。
import * as C from "./core.js";

const KEY = "ledger-v1";
const VERSION = "1.0.3";

// ================================================================ 圖示（Lucide，ISC 授權）
const ICONS = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "arrow-up": '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  "arrow-down": '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  notebook: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  tags: '<path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  wheel: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v6"/><path d="M4.9 4.9 9.2 9.2"/><path d="m19.1 4.9-4.3 4.3"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  "piggy-bank": '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  // 分類圖示
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  bus: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  "shopping-cart": '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  "shopping-bag": '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  gamepad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  "heart-pulse": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  "book-open": '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  baby: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
  "paw-print": '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  "credit-card": '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
};
// 新增分類時可以選的圖示
const CAT_ICONS = ["utensils", "coffee", "bus", "car", "plane", "shopping-cart", "shopping-bag", "shirt", "house", "zap", "smartphone", "gamepad", "heart-pulse",
  "book-open", "graduation-cap", "gift", "baby", "paw-print", "wallet", "coins", "trending-up", "banknote", "credit-card", "piggy-bank", "ellipsis"];
const ico = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.ellipsis}</svg>`;

// ================================================================ 小工具
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const today = () => C.ymd();
const N = (v) => `<span class="num">${C.money(v)}</span>`;
const catOf = (type, name) => data.cats[type].find((c) => c.name === name);
const catIcon = (type, name) => catOf(type, name)?.icon || "ellipsis";

function toast(msg, action, ms = 3500) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ""}`;
  if (action) t.querySelector("button").onclick = () => { t.remove(); action.run(); };
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

// ================================================================ 資料
let data, storeOK = true;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { storeOK = false; }
  if (!raw) return C.emptyData();
  try {
    const d = C.cleanData(JSON.parse(raw));
    if (d) return d;
  } catch { /* 下面處理 */ }
  try { localStorage.setItem(KEY + "-broken-" + Date.now(), raw); } catch { /* 存不了就算了 */ }   // 讀不懂的資料先留一份，不直接蓋掉
  return C.emptyData();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); storeOK = true; } catch { storeOK = false; }
}
function commit(next, { quiet = false } = {}) { data = next; save(); if (!quiet) render(); }

// ================================================================ 主題
const darkMQ = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  const { theme, mode } = data.prefs, dark = mode === "dark" || (mode === "auto" && darkMQ.matches);
  const root = document.documentElement;
  if (mode === "auto") root.removeAttribute("data-theme"); else root.dataset.theme = mode;
  const p = (C.PALETTES[theme] || C.PALETTES.terracotta)[dark ? "dark" : "light"];
  for (const [k, v] of Object.entries(p)) root.style.setProperty("--" + k, v);
  const bg = (C.BACKGROUNDS[data.prefs.bg] || C.BACKGROUNDS.paper)[dark ? "dark" : "light"];
  root.style.setProperty("--bg", bg);
  for (const k of Object.keys(C.PATTERNS)) document.body.classList.toggle("pat-" + k, data.prefs.pattern === k && k !== "grid");
  $('meta[name="theme-color"]')?.setAttribute("content", bg);
}
darkMQ.addEventListener?.("change", applyTheme);

// ================================================================ 畫面狀態、上一頁
const ui = { tab: "home", period: "", search: null, statType: "out", openCat: null, calMonth: "", calDay: "", more: null, catType: "out" };
const sheets = [];
let skipPop = 0;
window.addEventListener("popstate", (e) => {
  if (skipPop) { skipPop--; return; }
  if (sheets.length) { sheets.pop().close(true); return; }
  const s = e.state || {};
  ui.tab = s.tab || "home"; ui.more = s.more || null; ui.search = null;
  render();
});
function go(tab, more = null) {
  ui.tab = tab; ui.more = more; ui.search = null; ui.openCat = null;
  history.pushState({ tab, more }, "");
  render(); window.scrollTo(0, 0);
}

// ================================================================ 面板（從下面滑上來）
function openSheet(build) {
  const back = document.createElement("div");
  back.className = "sheet-back";
  back.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"></div>';
  const el = back.firstChild;
  document.body.append(back);
  history.pushState({ ...(history.state || {}), sheet: true }, "");
  const s = {
    el,
    close(fromPop = false) {
      back.remove();
      if (!fromPop) { const i = sheets.indexOf(s); if (i >= 0) sheets.splice(i, 1); skipPop++; history.back(); }
      s.onClose?.();
    },
  };
  sheets.push(s);
  back.addEventListener("pointerdown", (e) => { if (e.target === back) s.close(); });
  build(el, s);
  return s;
}
// 問一個問題：buttons＝[[值, 文字, "primary"|"danger"]]；回傳按的值（關掉＝null）
function ask(title, text, buttons, input = null) {
  return new Promise((resolve) => {
    let done = false;
    const s = openSheet((el) => {
      el.innerHTML = `<div class="sheet-h"><h3>${esc(title)}</h3></div>${text ? `<p class="muted" style="margin:0 0 8px">${esc(text)}</p>` : ""}
        ${input !== null ? `<input data-in value="${esc(input)}" autocomplete="off">` : ""}
        <div class="row-btns">${buttons.map(([v, t, k]) => `<button class="btn grow ${k || ""}" data-v="${esc(v)}">${esc(t)}</button>`).join("")}</div>`;
      el.querySelector("[data-in]")?.focus();
      el.addEventListener("click", (e) => {
        const b = e.target.closest("[data-v]");
        if (!b) return;
        done = true;
        const inp = el.querySelector("[data-in]");
        s.close();
        resolve(inp ? (b.dataset.v === "ok" ? inp.value : null) : b.dataset.v);
      });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" && el.querySelector("[data-in]")) el.querySelector('[data-v="ok"]')?.click(); });
    });
    s.onClose = () => { if (!done) resolve(null); };
  });
}
const sure = (title, text, ok = "確定", kind = "primary") => ask(title, text, [["no", "取消"], ["yes", ok, kind]]).then((v) => v === "yes");

// ================================================================ 數字鍵盤（可以打 120+35）
const KEYS = ["7", "8", "9", "del", "4", "5", "6", "+", "1", "2", "3", "-", "00", "0", "save"];
// 鍵盤上面有一條把手：點一下＝收起／打開；按住上下拖＝調大小（記在 prefs.keyH）。收起時只剩「打開鍵盤｜存起來」
function keypadHTML(label = "存起來") {
  return `<div class="kp" style="--kh:${data.prefs.keyH}px">
    <button class="kp-grip" data-kgrip title="點一下收起鍵盤；按住上下拖可以調整大小" aria-label="收起或打開數字鍵盤（按住上下拖可以調整大小）"><i></i></button>
    <div class="keys">${KEYS.map((k) => (k === "save" ? `<button class="save" data-k="save">${esc(label)}</button>`
      : k === "del" ? `<button data-k="del" aria-label="刪一個字">⌫</button>` : `<button data-k="${k}"${/[+-]/.test(k) ? ' class="op"' : ""}>${k === "-" ? "−" : k}</button>`)).join("")}</div>
    <div class="kp-mini"><button class="btn" data-kshow>${ico("chevron-right", "ico up")}打開鍵盤</button><button class="save" data-k="save">${esc(label)}</button></div></div>`;
}
function amountHTML(expr) {
  const v = C.evalAmount(expr), hasOp = /\d[+-]/.test(expr);
  return `<div class="expr">${hasOp ? esc(expr.replace(/-/g, "−")) : ""}</div><div class="val${v ? "" : " zero"}">${v ? C.money(v) : "0"}</div>`;
}
function pressKey(expr, k) {
  if (k === "del") return expr.slice(0, -1);
  if (k === "+" || k === "-") { if (!expr) return expr; return /[+-]$/.test(expr) ? expr.slice(0, -1) + k : expr + k; }
  if (expr.length >= 16) return expr;
  if ((expr === "" || /[+-]$/.test(expr)) && (k === "0" || k === "00")) return expr;    // 不要 0 開頭
  return expr + k;
}
// 綁定鍵盤：st.expr 存目前的算式；onSave(金額)。面板重畫後再呼叫一次就好（事件只綁一次，不會按一下輸入兩次）
function bindKeypad(el, st, onSave) {
  el._kp = { st, onSave };
  const kp = () => el.querySelector(".kp");
  const upd = () => {
    const disp = el.querySelector(".amt-disp"), ex = el._kp.st.expr;
    if (disp) disp.innerHTML = amountHTML(ex);
    el.querySelectorAll('[data-k="save"]').forEach((b) => { b.disabled = !C.evalAmount(ex); });
    kp()?.classList.toggle("collapsed", !!el._kpHidden);        // 面板重畫後照舊收著／打開
  };
  upd();
  if (el._kpBound) return;
  el._kpBound = true;
  const setHidden = (h) => { el._kpHidden = h; kp()?.classList.toggle("collapsed", h); };
  // 把手：拖＝調大小，點＝收起／打開
  el.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("[data-kgrip]");
    if (!g) return;
    e.preventDefault();
    try { g.setPointerCapture(e.pointerId); } catch { /* 拿不到也沒關係 */ }
    const y0 = e.clientY, h0 = data.prefs.keyH, box = kp();
    let moved = false, h = h0;
    const move = (ev) => {
      const dy = ev.clientY - y0;
      if (Math.abs(dy) > 6) moved = true;
      if (!moved || el._kpHidden) return;
      h = C.clampKeyH(h0 - dy / 4);                             // 4 排鍵：手指移 4px，每顆鍵變 1px
      box.style.setProperty("--kh", h + "px");
    };
    const up = (ev) => {
      g.removeEventListener("pointermove", move); g.removeEventListener("pointerup", up); g.removeEventListener("pointercancel", up);
      if (!moved) return setHidden(!el._kpHidden);
      if (el._kpHidden) { if (ev.clientY < y0 - 20) setHidden(false); return; }   // 收著時往上拉＝打開
      if (ev.clientY - y0 > 60 && h === C.KEY_H.min) return setHidden(true);   // 已經最小還往下拉＝收起
      if (h !== data.prefs.keyH) commit({ ...data, prefs: { ...data.prefs, keyH: h } }, { quiet: true });
    };
    g.addEventListener("pointermove", move); g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
  });
  // 點備註、日期打字時：鍵盤先收起來（讓手機的鍵盤出來、也不會蓋住欄位），離開再打開
  el.addEventListener("focusin", (e) => {
    if (!e.target.matches("input:not([type=checkbox]), textarea, select") || el._kpHidden) return;
    el._kpAuto = true; setHidden(true);
  });
  el.addEventListener("focusout", (e) => {
    if (!el._kpAuto || !e.target.matches("input, textarea, select")) return;
    setTimeout(() => {                                          // 換到同一個面板的另一個輸入欄：繼續收著
      const a = document.activeElement, stillTyping = a && el.contains(a) && a.matches("input:not([type=checkbox]), textarea, select");
      if (el._kpAuto && !stillTyping) { el._kpAuto = false; setHidden(false); }
    }, 120);
  });
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-kshow], .amt-disp")) { el._kpAuto = false; setHidden(false); return; }
    const k = e.target.closest("[data-k]")?.dataset.k;
    if (!k) return;
    const { st: s, onSave: save } = el._kp;
    if (k === "save") { const v = C.evalAmount(s.expr); if (v) save(v); return; }
    s.expr = pressKey(s.expr, k); upd();
  });
  el.addEventListener("keydown", (e) => {                 // 電腦上直接打數字
    if (e.target.matches("input, textarea, select")) return;
    const k = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "del" : e.key === "+" || e.key === "-" ? e.key : e.key === "Enter" ? "save" : null;
    if (!k) return;
    e.preventDefault();
    el.querySelector(`[data-k="${k}"]`)?.click();
  });
  el.tabIndex = -1; el.focus({ preventScroll: true });
}

// ================================================================ 記一筆
function addItem(item, msg) {
  commit({ ...data, items: [...data.items, item], prefs: { ...data.prefs, lastPay: (item.type === "out" && item.pay) || data.prefs.lastPay } });
  toast(msg || `已記：${item.sub || item.cat} ${C.money(item.amt)}`, { label: "復原", run: () => commit({ ...data, items: data.items.filter((x) => x.id !== item.id) }) });
}

// 完整的表單：新增或編輯（item）
function openForm(item = null, preset = {}) {
  const f = item ? { ...item, expr: String(item.amt) } : { type: "out", cat: "", sub: "", pay: data.prefs.lastPay, date: today(), note: "", expr: "", ...preset };
  if (!f.cat) f.cat = data.cats[f.type][0]?.name || "其他";
  let makeShortcut = false;
  openSheet((el, s) => {
    const draw = () => {
      const subs = catOf(f.type, f.cat)?.subs || [];
      el.innerHTML = `
        <div class="sheet-h"><div class="seg" role="tablist"><button data-type="out" class="${f.type === "out" ? "on" : ""}">支出</button><button data-type="in" class="${f.type === "in" ? "on" : ""}">收入</button></div>
          <h3></h3>${item ? `<button class="btn text danger" data-del>${ico("trash")}刪除</button>` : ""}<button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        <div class="amt-disp"></div>
        <div class="cats">${data.cats[f.type].map((c) => `<button data-cat="${esc(c.name)}" class="${c.name === f.cat ? "on" : ""}">${ico(c.icon)}<span>${esc(c.name)}</span></button>`).join("")}</div>
        ${subs.length ? `<div class="pick-row">${subs.map((x) => `<button class="chip${x === f.sub ? " on" : ""}" data-sub="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
        ${f.type === "out" ? `<div class="field"><span class="lab">付款方式</span><div class="pick-row" style="padding:0">${data.pays.map((p) => `<button class="chip${p === f.pay ? " on" : ""}" data-pay="${esc(p)}">${esc(p)}</button>`).join("")}</div></div>` : ""}
        <div class="field"><label for="f-date">日期</label><input id="f-date" type="date" value="${esc(f.date)}" max="2100-12-31"></div>
        <div class="field"><label for="f-note">備註</label><input id="f-note" value="${esc(f.note)}" maxlength="200" placeholder="例如：全聯、和朋友聚餐"></div>
        ${item ? "" : `<label class="check"><input type="checkbox" data-sc${makeShortcut ? " checked" : ""}> 存成常用捷徑（首頁一點就能再記一次）</label>`}
        ${keypadHTML()}`;
      bindKeypad(el, f, (amt) => {
        const rec = { id: item?.id || C.newId(), type: f.type, amt, cat: f.cat, sub: f.sub, pay: f.type === "out" ? f.pay : "", date: f.date || today(), note: f.note.trim(), t: item?.t || Date.now(), ...(item?.rec ? { rec: item.rec } : {}) };
        s.close();
        if (item) { commit({ ...data, items: data.items.map((x) => (x.id === item.id ? rec : x)) }); toast("改好了"); return; }
        if (makeShortcut) data = { ...data, shortcuts: [...data.shortcuts, { id: C.newId(), label: "", type: rec.type, cat: rec.cat, sub: rec.sub, pay: rec.pay, amt, note: rec.note }] };
        addItem(rec);
      });
    };
    draw();
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button, input[type=checkbox]");
      if (!t) return;
      if (t.dataset.close !== undefined) return s.close();
      if (t.dataset.type) {          // 收入通常不是用「付款方式」：切到收入先空著，切回支出用上次的
        if (t.dataset.type !== f.type) { f.type = t.dataset.type; f.cat = data.cats[f.type][0]?.name || "其他"; f.sub = ""; f.pay = f.type === "in" ? "" : data.prefs.lastPay; draw(); }
        return;
      }
      if (t.dataset.cat) { if (f.cat !== t.dataset.cat) { f.cat = t.dataset.cat; f.sub = ""; } draw(); return; }
      if (t.dataset.sub !== undefined) { f.sub = f.sub === t.dataset.sub ? "" : t.dataset.sub; draw(); return; }
      if (t.dataset.pay !== undefined) { f.pay = f.pay === t.dataset.pay ? "" : t.dataset.pay; draw(); return; }
      if (t.dataset.sc !== undefined) { makeShortcut = t.checked; return; }
      if (t.dataset.del !== undefined) {
        if (!(await sure("刪除這一筆？", `${item.sub || item.cat} ${C.money(item.amt)}（${item.date}）`, "刪除", "danger"))) return;
        s.close();
        const old = item;
        commit({ ...data, items: data.items.filter((x) => x.id !== item.id) });
        toast("刪掉了", { label: "復原", run: () => commit({ ...data, items: [...data.items, old] }) });
      }
    });
    el.addEventListener("input", (e) => { if (e.target.id === "f-note") f.note = e.target.value; if (e.target.id === "f-date") f.date = e.target.value; });
  });
}

// 只打金額（長按一劃放手後、或捷徑沒有金額時）
function quickAmount({ type = "out", cat, sub = "", pay, note = "", title }) {
  const st = { expr: "", sub, note, date: today() };
  openSheet((el, s) => {
    const subs = catOf(type, cat)?.subs || [];
    const draw = () => {
      el.innerHTML = `<div class="sheet-h"><h3>${esc(title || `${pay ? pay + "・" : ""}${cat}`)}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        ${subs.length ? `<div class="pick-row">${subs.map((x) => `<button class="chip${x === st.sub ? " on" : ""}" data-sub="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
        <div class="amt-disp"></div>
        <div class="field"><label for="q-note">備註</label><input id="q-note" value="${esc(st.note)}" maxlength="200" placeholder="選填"></div>
        <div class="field"><label for="q-date">日期</label><input id="q-date" type="date" value="${esc(st.date)}"></div>
        ${keypadHTML()}`;
      bindKeypad(el, st, (amt) => {
        s.close();
        addItem({ id: C.newId(), type, amt, cat, sub: st.sub, pay: pay || "", date: st.date || today(), note: st.note.trim(), t: Date.now() });
      });
    };
    draw();
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) s.close();
      if (t.dataset.sub !== undefined) { st.sub = st.sub === t.dataset.sub ? "" : t.dataset.sub; draw(); }
    });
    el.addEventListener("input", (e) => { if (e.target.id === "q-note") st.note = e.target.value; if (e.target.id === "q-date") st.date = e.target.value; });
  });
}

function useShortcut(sc) {
  if (sc.amt > 0) return addItem(C.itemFromShortcut(sc, sc.amt, today()));
  quickAmount({ type: sc.type, cat: sc.cat, sub: sc.sub, pay: sc.pay, note: sc.note, title: C.shortcutLabel(sc) });
}

// ================================================================ 長按一劃：扇形選單
function wheelLists() {
  const cats = data.wheel.cats.filter((c) => catOf("out", c));
  const pays = data.wheel.pays.filter((p) => data.pays.includes(p));
  return { cats: cats.length ? cats : data.cats.out.slice(0, C.WHEEL_MAX.cats).map((c) => c.name), pays };
}
const polar = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
function annulus(cx, cy, ri, ro, a0, a1) {
  const [x1, y1] = polar(cx, cy, ro, a0), [x2, y2] = polar(cx, cy, ro, a1), [x3, y3] = polar(cx, cy, ri, a1), [x4, y4] = polar(cx, cy, ri, a0);
  return `M${x1} ${y1}A${ro} ${ro} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 0 0 ${x4} ${y4}Z`;
}
function openWheel(st) {
  st.open = true;
  try { navigator.vibrate?.(12); } catch { /* 不支援震動 */ }
  const { cats, pays } = wheelLists();
  const k = Math.min(1, (innerWidth - 12) / (2 * (C.WHEEL_R.r2 + 6)), (st.cy - 70) / (C.WHEEL_R.r2 + 6));
  const R = { r0: C.WHEEL_R.r0 * k, r1: C.WHEEL_R.r1 * k, r2: C.WHEEL_R.r2 * k, slack: C.WHEEL_R.slack * k };
  Object.assign(st, { cats, pays, R, pay: null, hit: null, hotKey: "" });
  const pad = 6, W = 2 * (R.r2 + pad), H = R.r2 + pad + R.r0 + pad, cx = W / 2, cy = R.r2 + pad;
  let svg = "";
  pays.forEach((p, i) => {
    const [a0, a1] = C.wheelSeg(i, pays.length), [tx, ty] = polar(cx, cy, (R.r0 + R.r1) / 2 + 2, (a0 + a1) / 2);
    svg += `<path class="sg" data-pay="${i}" d="${annulus(cx, cy, R.r0 + 4, R.r1 - 2, a0 - 0.6, a1 + 0.6)}"/><g data-payt="${i}"><text x="${tx}" y="${ty}">${esc(p)}</text></g>`;
  });
  cats.forEach((c, i) => {
    const [a0, a1] = C.wheelSeg(i, cats.length), [tx, ty] = polar(cx, cy, (R.r1 + R.r2) / 2 + 2, (a0 + a1) / 2);
    const s = 18 * Math.max(0.8, k);
    svg += `<path class="sg" data-cat="${i}" d="${annulus(cx, cy, R.r1 + 2, R.r2, a0 - 0.4, a1 + 0.4)}"/>
      <g data-catt="${i}"><svg class="wico" x="${tx - s / 2}" y="${ty - s - 1}" width="${s}" height="${s}" viewBox="0 0 24 24">${ICONS[catIcon("out", c)] || ICONS.ellipsis}</svg><text x="${tx}" y="${ty + 10}">${esc(c)}</text></g>`;
  });
  svg += `<circle class="x" cx="${cx}" cy="${cy}" r="${R.r0 - 4}"/><svg class="wico" x="${cx - 10}" y="${cy - 10}" width="20" height="20" viewBox="0 0 24 24">${ICONS.x}</svg>`;
  const layer = document.createElement("div");
  layer.className = "wheel";
  layer.innerHTML = `<svg width="${W}" height="${H}" style="left:${st.cx - cx}px;top:${st.cy - cy}px">${svg}</svg>`;
  const tip = document.createElement("div");
  tip.className = "wheel-tip";
  Object.assign(tip.style, { left: st.cx + "px", top: Math.max(8, st.cy - R.r2 - 56) + "px" });
  document.body.append(layer, tip);
  Object.assign(st, { layer, tip });
  wheelMove(st, st.x0, st.y0);
}
function wheelMove(st, x, y) {
  const hit = C.wheelHit(x - st.cx, y - st.cy, st.pays.length, st.cats.length, st.R);
  st.hit = hit;
  if (hit?.ring === "pay") st.pay = st.pays[hit.idx];
  const hotKey = hit ? `${hit.ring}${hit.idx ?? ""}` : "";
  if (hotKey !== st.hotKey) { st.hotKey = hotKey; if (hit && hit.ring !== "cancel") try { navigator.vibrate?.(6); } catch { /* 不支援 */ } }
  const L = st.layer;
  L.querySelectorAll(".sg").forEach((p) => {
    const isPay = p.dataset.pay !== undefined, i = +(isPay ? p.dataset.pay : p.dataset.cat);
    const hot = hit && hit.ring === (isPay ? "pay" : "cat") && hit.idx === i;
    const picked = isPay && st.pays[i] === st.pay;
    p.classList.toggle("hot", !!hot); p.classList.toggle("picked", !hot && picked);
    const g = L.querySelector(isPay ? `[data-payt="${i}"]` : `[data-catt="${i}"]`);
    g.classList.toggle("hot-t", !!hot); g.classList.toggle("picked-t", !hot && picked);
  });
  L.querySelector(".x").classList.toggle("hot", hit?.ring === "cancel");
  const pay = st.pay ?? (st.pays.includes(data.prefs.lastPay) ? data.prefs.lastPay : st.pays[0] || "");
  st.tip.textContent = !hit ? "放開＝取消" : hit.ring === "cancel" ? "劃到外圈選分類（放開＝取消）" : `${pay ? pay + "・" : ""}${hit.ring === "cat" ? st.cats[hit.idx] : "選分類"}`;
}
function closeWheel(st) { st.layer?.remove(); st.tip?.remove(); }
function bindFab(btn) {
  let st = null;
  btn.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || st) return;
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch { /* 拿不到也沒關係 */ }
    const r = btn.getBoundingClientRect();
    st = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2, x0: e.clientX, y0: e.clientY, open: false };
    st.timer = setTimeout(() => st && !st.open && openWheel(st), 300);
  });
  btn.addEventListener("pointermove", (e) => {
    if (!st || e.pointerId !== st.id) return;
    if (!st.open && Math.hypot(e.clientX - st.x0, e.clientY - st.y0) > 14) { clearTimeout(st.timer); openWheel(st); }
    if (st.open) wheelMove(st, e.clientX, e.clientY);
  });
  const end = (e, cancel) => {
    if (!st || e.pointerId !== st.id) return;
    clearTimeout(st.timer);
    const s = st; st = null;
    if (!s.open) { if (!cancel) openForm(); return; }
    closeWheel(s);
    if (cancel || s.hit?.ring !== "cat") return;
    const pay = s.pay ?? (s.pays.includes(data.prefs.lastPay) ? data.prefs.lastPay : s.pays[0] || "");
    quickAmount({ type: "out", cat: s.cats[s.hit.idx], pay });
  };
  btn.addEventListener("pointerup", (e) => end(e, false));
  btn.addEventListener("pointercancel", (e) => end(e, true));
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => { if (e.detail === 0) openForm(); });   // 鍵盤按 Enter／空白鍵
}

// ================================================================ 首頁
const periodNow = () => C.periodOf(today(), data.prefs.monthStart);
function periodNav(extra = "") {
  const s = data.prefs.monthStart, cur = periodNow();
  return `<header class="top"><button class="icon-btn" data-per="-1" aria-label="上一期">${ico("chevron-left")}</button>
    <h1 class="num" style="font-family:var(--font)">${esc(C.periodLabel(ui.period, s))}</h1>
    <button class="icon-btn" data-per="1" aria-label="下一期"${ui.period >= cur ? " disabled" : ""}>${ico("chevron-right")}</button>${extra}</header>`;
}
function itemRow(x) {
  const meta = [x.sub ? x.cat : "", x.type === "out" ? x.pay : "", x.note].filter(Boolean).join("・");
  return `<button class="item" data-item="${esc(x.id)}"><span class="cat-ico">${ico(catIcon(x.type, x.cat))}</span>
    <span style="min-width:0"><div class="name">${esc(x.sub || x.cat)}</div>${meta ? `<div class="meta">${esc(meta)}</div>` : ""}</span>
    <span class="amt ${x.type}">${x.type === "in" ? "+" : "−"}${C.money(x.amt)}</span></button>`;
}
function dayList(list) {
  return C.byDay(list).map((d) => `<div class="day-h"><b>${esc(C.dayLabel(d.date, today()))}</b><span class="num">支出 ${C.money(d.out)}${d.in ? `　收入 ${C.money(d.in)}` : ""}</span></div>${d.items.map(itemRow).join("")}`).join("");
}
// 搜尋結果（只重畫這一塊，輸入框不動：注音、倉頡選字到一半才不會被打斷）
function searchResults(q) {
  if (!q.trim()) return `<div class="empty">打幾個字找以前的紀錄，例如「全聯」「早餐」「信用卡」；打數字就找一樣金額的。</div>`;
  const found = C.searchItems(data.items, q), t = C.totals(found);
  return `<p class="small muted" style="margin:12px 0 0">找到 ${found.length} 筆${found.length ? `，支出 ${C.money(t.out)}${t.in ? `、收入 ${C.money(t.in)}` : ""}` : ""}</p>${dayList(found)}`;
}
function renderHome() {
  if (ui.search !== null) {
    return `<header class="top"><button class="icon-btn" data-search-close aria-label="關閉搜尋">${ico("chevron-left")}</button>
      <input id="q" type="search" value="${esc(ui.search)}" placeholder="找備註、分類、付款方式或金額" autocomplete="off" enterkeyhint="search"></header>
      <div id="sres">${searchResults(ui.search)}</div>`;
  }
  const s = data.prefs.monthStart, list = C.periodItems(data.items, ui.period, s), t = C.totals(list), b = C.budgetStatus(data, ui.period, today());
  let hero;
  if (b.total > 0) {
    const ratio = Math.min(1, b.spent / b.total);
    hero = `<div class="lab">${b.over ? "超過預算" : "這期還能花"}（預算 ${C.money(b.total)}）</div>
      <div class="big${b.over ? " over" : ""}">${b.over ? C.money(-b.left) : C.money(b.left)}</div>
      <div class="line"><span>收入 <b class="num">${C.money(t.in)}</b></span><span>支出 <b class="num">${C.money(t.out)}</b></span><span>結餘 <b class="num">${C.money(t.net)}</b></span></div>
      ${b.perDay !== null ? `<div class="line">${b.over ? `<span style="color:var(--bad)">${ico("alert")} 已經超過 ${C.money(-b.left)}</span>` : `<span>剩 <b class="num">${b.daysLeft}</b> 天，平均每天還能花 <b class="num">${C.money(b.perDay)}</b></span>`}</div>` : ""}
      <div class="meter${b.over ? " over" : ""}"><i style="width:${(ratio * 100).toFixed(1)}%"></i></div>`;
  } else {
    hero = `<div class="lab">這期支出</div><div class="big">${C.money(t.out)}</div>
      <div class="line"><span>收入 <b class="num">${C.money(t.in)}</b></span><span>結餘 <b class="num">${C.money(t.net)}</b></span><button class="btn text small" data-goto="budget" style="padding:0">設定每月預算</button></div>`;
  }
  const overCats = b.cats.filter((c) => c.over);
  const notes = [
    !storeOK ? `<div class="note bad">${ico("alert")}<span>這個瀏覽器存不了帳（可能是無痕模式）。請改用一般模式開啟，或從主畫面的 App 開。</span></div>` : "",
    overCats.length ? `<div class="note warn">${ico("alert")}<span>${overCats.map((c) => `${esc(c.cat)}超過預算 ${C.money(c.spent - c.budget)}`).join("、")}</span></div>` : "",
    C.needBackup(data) ? `<div class="note">${ico("download")}<span>超過 30 天沒備份了。換手機或清除瀏覽器資料時帳會不見，<button data-goto="backup">現在匯出備份</button></span></div>` : "",
  ].join("");
  const chips = data.shortcuts.length
    ? `<div class="chips">${data.shortcuts.map((sc) => `<button class="chip" data-sc="${esc(sc.id)}">${esc(C.shortcutLabel(sc))}${sc.amt ? ` <span class="num">${C.money(sc.amt)}</span>` : ""}</button>`).join("")}<button class="chip add" data-goto="shortcuts">${ico("plus")}捷徑</button></div>`
    : "";
  return `${periodNav(`<button class="icon-btn" data-search aria-label="搜尋">${ico("search")}</button>`)}
    <section class="hero">${hero}</section>${notes}${chips}
    ${list.length ? dayList(list) : `<div class="empty">這期還沒有紀錄。<br>點下面的 ＋ 記一筆；按住 ＋ 往上劃，可以一次選好付款方式和分類。</div>`}`;
}

// ================================================================ 統計
function renderStats() {
  const s = data.prefs.monthStart, list = C.periodItems(data.items, ui.period, s), type = ui.statType, t = C.totals(list);
  const cats = C.byCategory(list, type), max = Math.max(1, ...cats.map((c) => c.amt));
  const bc = type === "out" ? data.budget.cats : {};
  const rows = cats.map((c) => {
    const open = ui.openCat === c.name, budget = bc[c.name] || 0, over = budget && c.amt > budget;
    const subs = open ? C.bySub(list, type, c.name) : [];
    const sm = Math.max(1, ...subs.map((x) => x.amt));
    return `<button class="stat" data-ocat="${esc(c.name)}" aria-expanded="${open}"><span class="nm">${esc(c.name)}</span>
        <span class="track${over ? " over" : ""}"><i style="width:${((c.amt / max) * 100).toFixed(1)}%"></i></span>
        <span class="v">${C.money(c.amt)}<small>${Math.round(c.share * 100)}%${budget ? `・預算 ${Math.round((c.amt / budget) * 100)}%` : ""}</small></span></button>
      ${subs.map((x) => `<div class="stat sub"><span class="nm muted">${esc(x.name || "（沒選細項）")}</span><span class="track"><i style="width:${((x.amt / sm) * 100).toFixed(1)}%"></i></span><span class="v">${C.money(x.amt)}</span></div>`).join("")}`;
  }).join("");
  const pays = type === "out" ? C.byPay(list, "out") : [], pm = Math.max(1, ...pays.map((p) => p.amt));
  const trend = C.lastPeriods(data.items, ui.period, s, 6), tm = Math.max(1, ...trend.map((x) => x[type]));
  return `${periodNav()}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 0 4px">
      <div class="seg"><button data-stype="out" class="${type === "out" ? "on" : ""}">支出</button><button data-stype="in" class="${type === "in" ? "on" : ""}">收入</button></div>
      <span>合計 <b class="num" style="font-size:20px">${C.money(t[type])}</b></span></div>
    <div class="sec-h"><span>分類（點一下看細項）</span></div>
    ${rows || `<div class="empty">這期沒有${type === "out" ? "支出" : "收入"}。</div>`}
    ${pays.length > 1 || (pays.length === 1 && pays[0].name) ? `<div class="sec-h"><span>付款方式</span></div>${pays.map((p) => `<div class="stat"><span class="nm">${esc(p.name || "沒寫")}</span><span class="track"><i style="width:${((p.amt / pm) * 100).toFixed(1)}%"></i></span><span class="v">${C.money(p.amt)}</span></div>`).join("")}` : ""}
    <div class="sec-h"><span>近 6 期${type === "out" ? "支出" : "收入"}</span></div>
    <div class="trend">${trend.map((x) => `<div class="col${x.key === ui.period ? " cur" : ""}"><span>${x[type] ? C.money(x[type]) : ""}</span><i style="height:${((x[type] / tm) * 100).toFixed(1)}%"></i></div>`).join("")}</div>
    <div class="trend-x">${trend.map((x) => `<span>${Number(x.key.slice(5))}月</span>`).join("")}</div>`;
}

// ================================================================ 月曆
function renderCal() {
  const m = ui.calMonth, [y, mo] = m.split("-").map(Number), first = new Date(y, mo - 1, 1).getDay(), days = new Date(y, mo, 0).getDate();
  const tot = C.dayTotals(data.items, m), td = today();
  let cells = "";
  for (let i = 0; i < first; i++) cells += "<span></span>";
  for (let d = 1; d <= days; d++) {
    const date = `${m}-${String(d).padStart(2, "0")}`, v = tot[date];
    cells += `<button data-day="${date}" class="${date === td ? "today " : ""}${date === ui.calDay ? "sel" : ""}"><span class="d">${d}</span>${v?.out ? `<span class="o">${C.money(v.out)}</span>` : ""}${v?.in ? `<span class="i">+${C.money(v.in)}</span>` : ""}</button>`;
  }
  const rest = (7 - ((first + days) % 7)) % 7;
  for (let i = 0; i < rest; i++) cells += "<span></span>";
  const dayItems = ui.calDay ? C.sortItems(data.items.filter((x) => x.date === ui.calDay)) : [];
  const mt = C.totals(data.items.filter((x) => x.date.startsWith(m)));
  return `<header class="top"><button class="icon-btn" data-cal="-1" aria-label="上個月">${ico("chevron-left")}</button><h1>${y} 年 ${mo} 月</h1>
      <button class="icon-btn" data-cal="1" aria-label="下個月">${ico("chevron-right")}</button></header>
    <p class="small muted" style="margin:8px 0 0">這個月支出 <b class="num">${C.money(mt.out)}</b>　收入 <b class="num">${C.money(mt.in)}</b></p>
    <div class="cal-w">${["日", "一", "二", "三", "四", "五", "六"].map((w) => `<span>${w}</span>`).join("")}</div><div class="cal">${cells}</div>
    ${ui.calDay ? `<div class="day-h"><b>${esc(C.dayLabel(ui.calDay, td))}</b><button class="btn text small" data-addday="${ui.calDay}" style="padding:0">${ico("plus")}記在這天</button></div>
      ${dayItems.map(itemRow).join("") || `<div class="empty">這天沒有紀錄。</div>`}` : `<div class="empty">點一天看那天的明細。</div>`}`;
}

// ================================================================ 更多
const MORE = [
  ["debts", "handshake", "借入借出", () => { const d = C.debtSummary(data.debts); return d.owedToMe || d.iOwe ? `別人欠我 ${C.money(d.owedToMe)}・我欠別人 ${C.money(d.iOwe)}` : "借錢給誰、跟誰借，還清就打勾"; }],
  ["goals", "piggy-bank", "存錢目標", () => { const g = data.goals.filter((x) => !x.done); return g.length ? g.map((x) => `${x.name} ${Math.round(C.goalProgress(x) * 100)}%`).join("・") : "例如旅行基金，記每次存了多少"; }],
  ["budget", "target", "每月預算", () => (data.budget.total ? `每期 ${C.money(data.budget.total)}` : "還沒設定")],
  ["recurring", "repeat", "固定收支", () => (data.recurring.length ? `${data.recurring.filter((r) => !r.off).length} 筆，每月自動記` : "房租、電話費、薪水…每月自動記")],
  ["cats", "tags", "分類", () => `支出 ${data.cats.out.length} 類・收入 ${data.cats.in.length} 類`],
  ["pays", "credit-card", "付款方式", () => data.pays.join("、")],
  ["shortcuts", "zap", "常用捷徑", () => (data.shortcuts.length ? `${data.shortcuts.length} 個` : "首頁一點就記一筆")],
  ["wheel", "wheel", "扇形選單", () => "長按 ＋ 時出現的分類和付款方式"],
  ["theme", "palette", "外觀", () => `${C.PALETTES[data.prefs.theme]?.name}・${C.BACKGROUNDS[data.prefs.bg]?.name}${C.PATTERNS[data.prefs.pattern]}・${{ auto: "跟著手機", light: "淺色", dark: "深色" }[data.prefs.mode]}`],
  ["start", "calendar", "每月起算日", () => (data.prefs.monthStart === 1 ? "每月 1 號" : `每月 ${data.prefs.monthStart} 號（例如發薪日）`)],
  ["backup", "download", "備份與還原", () => (data.lastBackup ? `上次備份 ${C.ymd(new Date(data.lastBackup))}` : "還沒備份過")],
  ["install", "smartphone", "安裝到主畫面", () => "像 App 一樣從桌面打開"],
];
const subHead = (title, extra = "") => `<header class="top"><button class="icon-btn" data-back aria-label="回上一頁">${ico("chevron-left")}</button><h1 class="left">${esc(title)}</h1>${extra}</header>`;
function renderMore() {
  const page = { debts: pgDebts, goals: pgGoals, budget: pgBudget, recurring: pgRecurring, cats: pgCats, pays: pgPays, shortcuts: pgShortcuts, wheel: pgWheel, theme: pgTheme, start: pgStart, backup: pgBackup, install: pgInstall, clear: pgClear }[ui.more];
  if (page) return page();
  return `<header class="top"><h1 class="left">更多</h1></header>
    ${MORE.slice(0, 2).map(menuRow).join("")}<div class="sec-h"><span>設定</span></div>${MORE.slice(2).map(menuRow).join("")}
    <button class="menu-row" data-goto="clear" style="color:var(--bad)">${ico("trash")}<span class="t">清除全部資料</span></button>
    <p class="foot">帳只存在這台裝置，不會上傳到任何地方；每個人的手機是各自的帳本。記得偶爾「匯出備份」。版本 ${VERSION}</p>`;
}
function menuRow([id, icon, title, sub]) {
  return `<button class="menu-row" data-goto="${id}">${ico(icon)}<span class="t">${esc(title)}<small>${esc(sub())}</small></span><span class="chev">${ico("chevron-right")}</span></button>`;
}

// ---- 借入借出
function pgDebts() {
  const sum = C.debtSummary(data.debts), open = data.debts.filter((d) => !d.done), done = data.debts.filter((d) => d.done);
  const row = (d) => `<button class="menu-row" data-debt="${esc(d.id)}"><span class="t">${esc(d.who || "（沒寫名字）")}<small>${d.dir === "lend" ? "借給他" : "跟他借"}・${esc(d.date)}${d.note ? "・" + esc(d.note) : ""}</small></span>
    <span class="num">${d.done ? "已還清" : `${C.money(C.debtLeft(d))}${C.debtLeft(d) !== d.amt ? ` / ${C.money(d.amt)}` : ""}`}</span></button>`;
  return `${subHead("借入借出")}<div class="sum2"><div><div class="small muted">別人欠我</div><div class="big">${C.money(sum.owedToMe)}</div></div><div><div class="small muted">我欠別人</div><div class="big">${C.money(sum.iOwe)}</div></div></div>
    <div class="row-btns"><button class="btn primary grow" data-newdebt>${ico("plus")}記一筆借貸</button></div>
    <p class="small muted">借貸不算進收支：錢只是暫時在別人那裡。</p>
    ${open.map(row).join("") || `<div class="empty">沒有還沒還清的借貸。</div>`}
    ${done.length ? `<details style="margin-top:16px"><summary class="small muted">已還清（${done.length}）</summary>${done.map(row).join("")}</details>` : ""}`;
}
function debtForm(d = null) {
  const f = d ? { ...d } : { dir: "lend", who: "", amt: "", date: today(), note: "" };
  openSheet((el, s) => {
    const draw = () => {
      const left = d ? C.debtLeft(d) : 0;
      el.innerHTML = `<div class="sheet-h"><h3>${d ? esc(d.who || "借貸") : "記一筆借貸"}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        ${d ? `<p style="margin:0 0 8px">${d.dir === "lend" ? "借給他" : "跟他借"} <b class="num">${C.money(d.amt)}</b>（${esc(d.date)}），還剩 <b class="num">${C.money(left)}</b></p>
          ${(d.pays || []).map((p) => `<div class="list-row"><span class="t">還了 <span class="num">${C.money(p.amt)}</span><small>${esc(p.date)}</small></span></div>`).join("")}
          ${d.done ? "" : `<div class="field"><label for="d-pay">這次還了</label><input id="d-pay" inputmode="numeric" placeholder="金額"></div>
          <div class="row-btns"><button class="btn grow" data-repay>記一筆還款</button><button class="btn grow" data-alldone>${ico("check")}全部還清</button></div>`}
          <div class="row-btns"><button class="btn danger" data-deldebt>${ico("trash")}刪除</button></div>`
        : `<div class="seg" style="margin-bottom:8px"><button data-dir="lend" class="${f.dir === "lend" ? "on" : ""}">我借給別人</button><button data-dir="borrow" class="${f.dir === "borrow" ? "on" : ""}">我跟別人借</button></div>
          <div class="field"><label for="d-who">${f.dir === "lend" ? "借給誰" : "跟誰借"}</label><input id="d-who" value="${esc(f.who)}" maxlength="20"></div>
          <div class="field"><label for="d-amt">金額</label><input id="d-amt" inputmode="numeric" value="${esc(f.amt)}"></div>
          <div class="field"><label for="d-date">日期</label><input id="d-date" type="date" value="${esc(f.date)}"></div>
          <div class="field"><label for="d-note">備註</label><input id="d-note" value="${esc(f.note)}" maxlength="200"></div>
          <div class="row-btns"><button class="btn primary grow" data-savedebt>存起來</button></div>`}`;
    };
    draw();
    el.addEventListener("input", (e) => { const id = e.target.id; if (id === "d-who") f.who = e.target.value; if (id === "d-amt") f.amt = e.target.value; if (id === "d-date") f.date = e.target.value; if (id === "d-note") f.note = e.target.value; });
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) return s.close();
      if (t.dataset.dir) { f.dir = t.dataset.dir; draw(); return; }
      if (t.dataset.savedebt !== undefined) {
        const amt = C.evalAmount(f.amt);
        if (!amt) return toast("請輸入金額（整數）");
        s.close();
        commit({ ...data, debts: [...data.debts, { id: C.newId(), dir: f.dir, who: f.who.trim(), amt, date: f.date || today(), note: f.note.trim(), pays: [], done: false }] });
      }
      const upd = (fn) => { const next = data.debts.map((x) => (x.id === d.id ? fn(x) : x)); commit({ ...data, debts: next }); d = next.find((x) => x.id === d.id); };
      if (t.dataset.repay !== undefined) {
        const amt = C.evalAmount(el.querySelector("#d-pay").value);
        if (!amt) return toast("請輸入還了多少（整數）");
        upd((x) => { const y = { ...x, pays: [...x.pays, { amt, date: today() }] }; return C.debtLeft(y) === 0 ? { ...y, done: true } : y; });
        if (d.done) { s.close(); toast(`${d.who} 還清了`); } else draw();
      }
      if (t.dataset.alldone !== undefined) { upd((x) => ({ ...x, done: true })); s.close(); toast("標成還清了"); }
      if (t.dataset.deldebt !== undefined && (await sure("刪除這筆借貸？", "", "刪除", "danger"))) { s.close(); commit({ ...data, debts: data.debts.filter((x) => x.id !== d.id) }); }
    });
  });
}

// ---- 存錢目標
function pgGoals() {
  const row = (g) => { const p = C.goalProgress(g), saved = C.goalSaved(g); return `<button class="menu-row" data-goal="${esc(g.id)}" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(g.name)}</b><span class="num">${C.money(saved)} / ${C.money(g.target)}</span></div>
    <div class="goal-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div><small class="muted">${g.done || saved >= g.target ? "達成了" : `還差 ${C.money(g.target - saved)}`}</small></button>`; };
  const open = data.goals.filter((g) => !g.done), done = data.goals.filter((g) => g.done);
  return `${subHead("存錢目標")}<div class="row-btns"><button class="btn primary grow" data-newgoal>${ico("plus")}新增存錢目標</button></div>
    <p class="small muted">存進目標的錢不算支出，只是記錄進度。</p>
    ${open.map(row).join("") || `<div class="empty">還沒有存錢目標。</div>`}
    ${done.length ? `<details style="margin-top:16px"><summary class="small muted">完成的（${done.length}）</summary>${done.map(row).join("")}</details>` : ""}`;
}
function goalForm(g = null) {
  openSheet((el, s) => {
    const draw = () => {
      el.innerHTML = g ? `<div class="sheet-h"><h3>${esc(g.name)}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
          <p style="margin:0 0 8px">已經存了 <b class="num">${C.money(C.goalSaved(g))}</b> / <span class="num">${C.money(g.target)}</span></p>
          <div class="goal-bar"><i style="width:${(C.goalProgress(g) * 100).toFixed(1)}%"></i></div>
          ${g.done ? "" : `<div class="field"><label for="g-dep">這次存</label><input id="g-dep" inputmode="numeric" placeholder="金額"></div><div class="row-btns"><button class="btn primary grow" data-dep>存進去</button></div>`}
          ${(g.deps || []).slice().reverse().map((x) => `<div class="list-row"><span class="t">存了 <span class="num">${C.money(x.amt)}</span><small>${esc(x.date)}</small></span></div>`).join("")}
          <div class="row-btns"><button class="btn grow" data-gdone>${g.done ? "改回進行中" : `${ico("check")}標成完成`}</button><button class="btn danger" data-gdel>${ico("trash")}刪除</button></div>`
        : `<div class="sheet-h"><h3>新增存錢目標</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
          <div class="field"><label for="g-name">名稱</label><input id="g-name" maxlength="20" placeholder="例如：旅行基金"></div>
          <div class="field"><label for="g-target">目標金額</label><input id="g-target" inputmode="numeric"></div>
          <div class="row-btns"><button class="btn primary grow" data-gsave>存起來</button></div>`;
    };
    draw();
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) return s.close();
      if (t.dataset.gsave !== undefined) {
        const name = el.querySelector("#g-name").value.trim(), target = C.evalAmount(el.querySelector("#g-target").value);
        if (!name || !target) return toast("請寫名稱和目標金額");
        s.close(); commit({ ...data, goals: [...data.goals, { id: C.newId(), name, target, deps: [], done: false }] });
      }
      const upd = (fn) => { const next = data.goals.map((x) => (x.id === g.id ? fn(x) : x)); commit({ ...data, goals: next }); g = next.find((x) => x.id === g.id); };
      if (t.dataset.dep !== undefined) {
        const amt = C.evalAmount(el.querySelector("#g-dep").value);
        if (!amt) return toast("請輸入金額（整數）");
        upd((x) => ({ ...x, deps: [...x.deps, { amt, date: today() }] })); draw();
        if (C.goalSaved(g) >= g.target) toast(`${g.name} 達成目標了`);
      }
      if (t.dataset.gdone !== undefined) { upd((x) => ({ ...x, done: !x.done })); draw(); }
      if (t.dataset.gdel !== undefined && (await sure("刪除這個存錢目標？", "", "刪除", "danger"))) { s.close(); commit({ ...data, goals: data.goals.filter((x) => x.id !== g.id) }); }
    });
  });
}

// ---- 預算
function pgBudget() {
  return `${subHead("每月預算")}<p class="small muted">每一期（照「每月起算日」算）最多想花多少。首頁會顯示還能花多少、平均每天還能花多少；超過會提醒。填 0 或空白＝不設。</p>
    <div class="field"><label for="b-total">總預算</label><input id="b-total" inputmode="numeric" value="${data.budget.total || ""}" placeholder="例如 15000"></div>
    <div class="sec-h"><span>各分類預算（選填）</span></div>
    ${data.cats.out.map((c) => `<div class="field"><label>${esc(c.name)}</label><input data-bcat="${esc(c.name)}" inputmode="numeric" value="${data.budget.cats[c.name] || ""}"></div>`).join("")}
    <div class="row-btns"><button class="btn primary grow" data-savebudget>存起來</button></div>`;
}

// ---- 固定收支
function pgRecurring() {
  return `${subHead("固定收支")}<p class="small muted">每個月固定的支出或收入（房租、電話費、保險、薪水…）。每月到了那天，打開 App 時會自動幫你記一筆。</p>
    <div class="row-btns"><button class="btn primary grow" data-newrec>${ico("plus")}新增固定收支</button></div>
    ${data.recurring.map((r) => `<div class="list-row${r.off ? " off" : ""}"><span class="cat-ico">${ico(catIcon(r.type, r.cat))}</span><span class="t">${esc(r.note || r.sub || r.cat)}<small>每月 ${r.day} 號・${r.type === "in" ? "收入" : "支出"} ${C.money(r.amt)}・${esc([r.cat, r.sub, r.pay].filter(Boolean).join("・"))}${r.off ? "・已停用" : ""}</small></span>
      <button class="icon-btn" data-editrec="${esc(r.id)}" aria-label="修改">${ico("pencil")}</button></div>`).join("") || `<div class="empty">還沒有固定收支。</div>`}
    ${data.recurring.length ? `<p class="small muted">這期固定支出合計 <b class="num">${C.money(data.recurring.filter((r) => !r.off && r.type === "out").reduce((a, r) => a + r.amt, 0))}</b></p>` : ""}`;
}
function selectHTML(id, list, cur, blank = null) {
  return `<select id="${id}">${blank !== null ? `<option value="">${esc(blank)}</option>` : ""}${list.map((x) => `<option${x === cur ? " selected" : ""}>${esc(x)}</option>`).join("")}</select>`;
}
// 固定收支、常用捷徑共用的表單（kind = "rec" | "sc"）
function ruleForm(kind, r = null) {
  const isRec = kind === "rec", now = today();
  const f = r ? { ...r, amt: r.amt ? String(r.amt) : "" } : { type: "out", cat: data.cats.out[0]?.name || "其他", sub: "", pay: data.prefs.lastPay, amt: "", note: "", label: "", day: Number(now.slice(8)) > 28 ? 28 : Number(now.slice(8)), from: now.slice(0, 7) };
  openSheet((el, s) => {
    const draw = () => {
      const subs = catOf(f.type, f.cat)?.subs || [];
      el.innerHTML = `<div class="sheet-h"><h3>${r ? "修改" : "新增"}${isRec ? "固定收支" : "常用捷徑"}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        <div class="seg" style="margin-bottom:8px"><button data-type="out" class="${f.type === "out" ? "on" : ""}">支出</button><button data-type="in" class="${f.type === "in" ? "on" : ""}">收入</button></div>
        ${isRec ? "" : `<div class="field"><label for="r-label">名稱</label><input id="r-label" value="${esc(f.label)}" maxlength="12" placeholder="選填，例如：早餐"></div>`}
        <div class="field"><label for="r-amt">金額</label><input id="r-amt" inputmode="numeric" value="${esc(f.amt)}" placeholder="${isRec ? "" : "選填：空白＝每次再打"}"></div>
        <div class="field"><label for="r-cat">分類</label>${selectHTML("r-cat", data.cats[f.type].map((c) => c.name), f.cat)}</div>
        ${subs.length ? `<div class="field"><label for="r-sub">細項</label>${selectHTML("r-sub", subs, f.sub, "（不選）")}</div>` : ""}
        ${f.type === "out" ? `<div class="field"><label for="r-pay">付款方式</label>${selectHTML("r-pay", data.pays, f.pay, "（不寫）")}</div>` : ""}
        ${isRec ? `<div class="field"><label for="r-day">每月幾號</label>${selectHTML("r-day", Array.from({ length: 28 }, (_, i) => String(i + 1)), String(f.day))}</div>
          <div class="field"><label for="r-from">從哪個月</label><input id="r-from" type="month" value="${esc(f.from)}"></div>` : ""}
        <div class="field"><label for="r-note">備註</label><input id="r-note" value="${esc(f.note)}" maxlength="200" placeholder="${isRec ? "例如：中華電信" : ""}"></div>
        ${isRec && r ? `<label class="check"><input type="checkbox" id="r-off"${f.off ? " checked" : ""}> 停用（不再自動記）</label>` : ""}
        <div class="row-btns"><button class="btn primary grow" data-rsave>存起來</button>${r ? `<button class="btn danger" data-rdel>${ico("trash")}刪除</button>` : ""}</div>`;
    };
    draw();
    el.addEventListener("change", (e) => {
      const id = e.target.id, v = e.target.value;
      if (id === "r-cat") { f.cat = v; f.sub = ""; draw(); }
      if (id === "r-sub") f.sub = v; if (id === "r-pay") f.pay = v; if (id === "r-day") f.day = Number(v); if (id === "r-from") f.from = v; if (id === "r-off") f.off = e.target.checked;
    });
    el.addEventListener("input", (e) => { const id = e.target.id; if (id === "r-amt") f.amt = e.target.value; if (id === "r-note") f.note = e.target.value; if (id === "r-label") f.label = e.target.value; });
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) return s.close();
      if (t.dataset.type) { if (t.dataset.type !== f.type) { f.type = t.dataset.type; f.cat = data.cats[f.type][0]?.name || "其他"; f.sub = ""; if (f.type === "in") f.pay = ""; draw(); } return; }
      const list = isRec ? "recurring" : "shortcuts";
      if (t.dataset.rdel !== undefined) {
        if (!(await sure(isRec ? "刪除這筆固定收支？" : "刪除這個捷徑？", isRec ? "以前自動記的紀錄會留著。" : "", "刪除", "danger"))) return;
        s.close(); return commit({ ...data, [list]: data[list].filter((x) => x.id !== r.id) });
      }
      if (t.dataset.rsave !== undefined) {
        const amt = f.amt.trim() ? C.evalAmount(f.amt) : 0;
        if (f.amt.trim() && !amt) return toast("金額請打整數");
        if (isRec && !amt) return toast("固定收支要寫金額");
        const base = { type: f.type, cat: f.cat, sub: f.sub || "", pay: f.pay || "", amt, note: f.note.trim() };
        const rec = isRec ? { id: r?.id || C.newId(), ...base, day: f.day, from: f.from || now.slice(0, 7), last: r && r.from === f.from ? r.last : "", off: !!f.off }
          : { id: r?.id || C.newId(), label: f.label.trim(), ...base };
        s.close();
        let next = { ...data, [list]: r ? data[list].map((x) => (x.id === r.id ? rec : x)) : [...data[list], rec] };
        if (isRec) { const res = C.applyRecurring(next, today()); next = res.data; if (res.added.length) toast(`已自動記了 ${res.added.length} 筆（到今天為止到期的）`); }
        commit(next);
      }
    });
  });
}

// ---- 分類
function pgCats() {
  const type = ui.catType;
  return `${subHead("分類")}<div class="seg" style="margin:12px 0 4px"><button data-ctype="out" class="${type === "out" ? "on" : ""}">支出</button><button data-ctype="in" class="${type === "in" ? "on" : ""}">收入</button></div>
    ${data.cats[type].map((c, i) => `<div class="list-row"><span class="cat-ico">${ico(c.icon)}</span><span class="t">${esc(c.name)}<small>${c.subs.length ? esc(c.subs.join("、")) : "沒有細項"}</small></span>
      <button class="icon-btn" data-cmove="-1" data-c="${esc(c.name)}" aria-label="往上"${i === 0 ? " disabled" : ""}>${ico("arrow-up")}</button>
      <button class="icon-btn" data-cmove="1" data-c="${esc(c.name)}" aria-label="往下"${i === data.cats[type].length - 1 ? " disabled" : ""}>${ico("arrow-down")}</button>
      <button class="icon-btn" data-cedit="${esc(c.name)}" aria-label="修改">${ico("pencil")}</button></div>`).join("")}
    <div class="row-btns"><button class="btn grow" data-cadd>${ico("plus")}新增分類</button></div>`;
}
function catForm(type, c = null) {
  const f = { name: c?.name || "", icon: c?.icon || "ellipsis", subs: (c?.subs || []).join("\n") };
  openSheet((el, s) => {
    el.innerHTML = `<div class="sheet-h"><h3>${c ? "修改分類" : "新增分類"}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
      <div class="field"><label for="c-name">名稱</label><input id="c-name" value="${esc(f.name)}" maxlength="12"></div>
      <div class="field top-a"><span class="lab">圖示</span><div class="icons">${CAT_ICONS.map((n) => `<button data-icon="${n}" class="${n === f.icon ? "on" : ""}" aria-label="${n}">${ico(n)}</button>`).join("")}</div></div>
      <div class="field top-a"><label for="c-subs">細項</label><textarea id="c-subs" rows="4" placeholder="一行一個，例如：&#10;早餐&#10;午餐">${esc(f.subs)}</textarea></div>
      <div class="row-btns"><button class="btn primary grow" data-csave>存起來</button>${c && c.name !== "其他" ? `<button class="btn danger" data-cdel>${ico("trash")}刪除</button>` : ""}</div>`;
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) return s.close();
      if (t.dataset.icon) { f.icon = t.dataset.icon; el.querySelectorAll("[data-icon]").forEach((b) => b.classList.toggle("on", b === t)); return; }
      if (t.dataset.cdel !== undefined) {
        const n = data.items.filter((x) => x.type === type && x.cat === c.name).length;
        if (!(await sure(`刪除「${c.name}」？`, n ? `用到它的 ${n} 筆紀錄會改成「其他」。` : "", "刪除", "danger"))) return;
        s.close(); return commit(C.removeCategory(data, type, c.name));
      }
      if (t.dataset.csave !== undefined) {
        const name = el.querySelector("#c-name").value.trim(), subs = el.querySelector("#c-subs").value.split(/[\n,，、]/);
        if (!name) return toast("請寫分類名稱");
        let next = data;
        if (c) { next = C.renameCategory(next, type, c.name, name); }
        else { if (catOf(type, name)) return toast("已經有這個分類了"); next = C.addCategory(next, type, name, f.icon); }
        next = { ...next, cats: { ...next.cats, [type]: next.cats[type].map((x) => (x.name === name ? { ...x, icon: f.icon } : x)) } };
        next = C.setSubs(next, type, name, subs);
        if (!c && type === "out" && next.wheel.cats.length < C.WHEEL_MAX.cats) next = { ...next, wheel: { ...next.wheel, cats: [...next.wheel.cats, name] } };
        s.close(); commit(next);
      }
    });
  });
}

// ---- 付款方式
function pgPays() {
  return `${subHead("付款方式")}<p class="small muted">例如現金、某張信用卡、行動支付。統計頁可以看每種付了多少。</p>
    ${data.pays.map((p) => `<div class="list-row"><span class="t">${esc(p)}</span><button class="icon-btn" data-prename="${esc(p)}" aria-label="改名">${ico("pencil")}</button><button class="icon-btn" data-pdel="${esc(p)}" aria-label="刪除">${ico("trash")}</button></div>`).join("")}
    <div class="row-btns"><button class="btn grow" data-padd>${ico("plus")}新增付款方式</button></div>`;
}

// ---- 常用捷徑
function pgShortcuts() {
  return `${subHead("常用捷徑")}<p class="small muted">常記的東西（早餐 60、捷運…）存成捷徑，首頁一點就記好；沒寫金額的會跳出鍵盤只打金額。記一筆時也可以勾「存成常用捷徑」。</p>
    <div class="row-btns"><button class="btn primary grow" data-newsc>${ico("plus")}新增捷徑</button></div>
    ${data.shortcuts.map((sc) => `<div class="list-row"><span class="cat-ico">${ico(catIcon(sc.type, sc.cat))}</span><span class="t">${esc(C.shortcutLabel(sc))}<small>${esc([sc.cat, sc.sub, sc.pay].filter(Boolean).join("・"))}${sc.amt ? `・${C.money(sc.amt)}` : "・每次打金額"}</small></span>
      <button class="icon-btn" data-editsc="${esc(sc.id)}" aria-label="修改">${ico("pencil")}</button></div>`).join("") || `<div class="empty">還沒有捷徑。</div>`}`;
}

// ---- 扇形選單
function pgWheel() {
  const box = (kind, name, on, i) => `<label class="check"><input type="checkbox" data-w${kind}="${esc(name)}"${on ? " checked" : ""}> ${esc(name)}${on ? ` <span class="small muted">（第 ${i + 1} 格）</span>` : ""}</label>`;
  return `${subHead("扇形選單")}<p class="small muted">按住下面的 ＋ 往上劃：先經過內圈選付款方式（不劃過就用上次的），停在外圈的分類放手，再打金額就記好了。順序照「分類」頁的排序。</p>
    <div class="sec-h"><span>內圈：付款方式（最多 ${C.WHEEL_MAX.pays} 個）</span></div>${data.pays.map((p) => box("pay", p, data.wheel.pays.includes(p), data.wheel.pays.indexOf(p))).join("")}
    <div class="sec-h"><span>外圈：支出分類（最多 ${C.WHEEL_MAX.cats} 個）</span></div>${data.cats.out.map((c) => box("cat", c.name, data.wheel.cats.includes(c.name), data.wheel.cats.indexOf(c.name))).join("")}`;
}

// ---- 主題
function pgTheme() {
  const dark = data.prefs.mode === "dark" || (data.prefs.mode === "auto" && darkMQ.matches), m = dark ? "dark" : "light";
  const curBg = (C.BACKGROUNDS[data.prefs.bg] || C.BACKGROUNDS.paper)[m];
  return `${subHead("外觀")}<p class="small muted">每個人可以選自己喜歡的樣子，只會改這台裝置。</p>
    <div class="sec-h"><span>主色（按鈕、重點數字）</span></div>
    <div class="swatches">${Object.entries(C.PALETTES).map(([id, p]) => `<button data-theme="${id}" class="${id === data.prefs.theme ? "on" : ""}"><i style="background:${p[m].accent}"></i>${esc(p.name)}</button>`).join("")}</div>
    <div class="sec-h"><span>背景顏色</span></div>
    <div class="bg-tiles">${Object.entries(C.BACKGROUNDS).map(([id, b]) => `<button data-bg="${id}" class="${id === data.prefs.bg ? "on" : ""}"><i style="background:${b[m]}"></i>${esc(b.name)}</button>`).join("")}</div>
    <div class="sec-h"><span>背景款式</span></div>
    <div class="bg-tiles">${Object.entries(C.PATTERNS).map(([id, name]) => `<button data-pattern="${id}" class="${id === data.prefs.pattern ? "on" : ""}"><i class="pv-${id}" style="background-color:${curBg}"></i>${esc(name)}</button>`).join("")}</div>
    <div class="sec-h"><span>深淺色</span></div>
    <div class="seg">${[["auto", "跟著手機"], ["light", "淺色"], ["dark", "深色"]].map(([v, t]) => `<button data-mode="${v}" class="${v === data.prefs.mode ? "on" : ""}">${t}</button>`).join("")}</div>
    <div class="sec-h"><span>數字鍵盤大小</span></div>
    <p class="small muted" style="margin:0">記帳時按住鍵盤上面的小把手上下拖就能調大小，點一下把手可以收起鍵盤。現在每顆鍵 <b class="num">${data.prefs.keyH}</b> px。</p>
    <div class="row-btns"><button class="btn" data-keyh="-6">小一點</button><button class="btn" data-keyh="6">大一點</button><button class="btn text" data-keyh="0">恢復預設</button></div>`;
}

// ---- 每月起算日
function pgStart() {
  return `${subHead("每月起算日")}<p class="small muted">一個月從幾號開始算。例如每月 5 號發薪水，設 5 號：11/5～12/4 算同一期，預算和統計都照這個算。</p>
    <div class="field"><label for="m-start">每月</label>${selectHTML("m-start", Array.from({ length: 28 }, (_, i) => String(i + 1)), String(data.prefs.monthStart))}</div>
    <p class="small muted">現在這一期：<b class="num">${esc(C.periodLabel(periodNow(), data.prefs.monthStart))}</b></p>`;
}

// ---- 備份
function pgBackup() {
  return `${subHead("備份與還原")}<p class="small muted">帳只存在這台裝置。換手機、刪掉 App 或清除瀏覽器資料時帳會不見，所以偶爾匯出一份備份檔，存到雲端硬碟或傳給自己。</p>
    <p>上次備份：<b class="num">${data.lastBackup ? esc(new Date(data.lastBackup).toLocaleString("zh-TW", { hour12: false })) : "還沒有"}</b>（共 ${data.items.length} 筆紀錄）</p>
    <div class="row-btns" style="flex-direction:column">
      <button class="btn primary block" data-export>${ico("download")}匯出備份檔</button>
      <button class="btn block" data-import>${ico("upload")}從備份檔還原</button>
      <button class="btn block" data-csv>${ico("download")}匯出成 Excel（CSV）</button></div>
    <input type="file" id="imp" accept=".json,application/json" hidden>`;
}

// ---- 安裝
function pgInstall() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const asApp = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  return `${subHead("安裝到主畫面")}
    ${asApp ? `<div class="note">${ico("check")}<span>你現在就是從主畫面的 App 打開的。</span></div>` : ""}
    ${window.ledgerInstall ? `<div class="row-btns"><button class="btn primary grow" data-install>${ico("download")}安裝這個 App</button></div>` : ""}
    <h3>${isIOS ? "iPhone／iPad（Safari）" : "iPhone／iPad"}</h3><ol><li>用 Safari 打開這個網址。</li><li>點下面的「分享」按鈕（方框加向上箭頭）。</li><li>往下找「加入主畫面」，按「新增」。</li></ol>
    <h3>Android（Chrome、Samsung 瀏覽器）</h3><ol><li>打開這個網址。</li><li>按右上角選單（⋮ 或 ≡），選「安裝應用程式」或「加到主畫面」。</li></ol>
    <p class="small muted">裝好之後從桌面打開，就是全螢幕、沒網路也能記。每個人手機上的帳是分開的，互相看不到。</p>`;
}

// ---- 清除
function pgClear() {
  return `${subHead("清除全部資料")}<div class="note bad">${ico("alert")}<span>會刪掉這台裝置上全部的紀錄、分類、預算、固定收支、借貸和存錢目標，刪了就救不回來。建議先「匯出備份檔」。</span></div>
    <div class="row-btns"><button class="btn grow" data-goto="backup">先去備份</button><button class="btn danger grow" data-clearall>${ico("trash")}清除全部資料</button></div>`;
}

// ================================================================ 匯出、匯入
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const file = new File([blob], name, { type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {   // 手機：用分享（存到雲端硬碟、傳給自己）
    return navigator.share({ files: [file], title: name }).then(() => true, (e) => (e?.name === "AbortError" ? false : fallback()));
  }
  return Promise.resolve(fallback());
  function fallback() {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  }
}
async function exportBackup() {
  const stamp = today().replace(/-/g, "");
  const ok = await download(`記帳備份-${stamp}.json`, JSON.stringify({ ...data, lastBackup: Date.now(), app: "family-ledger" }, null, 1), "application/json");
  if (ok) { commit({ ...data, lastBackup: Date.now() }); toast("備份檔匯出了，記得存到雲端硬碟或傳給自己"); }
}
async function importBackup(file) {
  let next = null;
  try { next = C.cleanData(JSON.parse(await file.text())); } catch { /* 下面說 */ }
  if (!next) return toast("這不是記帳的備份檔，請選「記帳備份-日期.json」");
  const how = await ask("要怎麼還原？", `備份檔有 ${next.items.length} 筆紀錄；這台裝置現在有 ${data.items.length} 筆。`,
    [["merge", "合併（兩邊都留）", "primary"], ["replace", "換成備份的", "danger"], ["no", "取消"]]);
  if (how === "merge") { commit(C.mergeData(data, next)); toast("合併好了"); }
  if (how === "replace") { data = next; ui.period = periodNow(); commit(next); applyTheme(); toast("換成備份的資料了"); }
}

// ================================================================ 畫面
const TABS = [["home", "notebook", "記帳"], ["stats", "chart", "統計"], ["fab"], ["cal", "calendar", "月曆"], ["more", "menu", "更多"]];
let main, nav;
function render() {
  const html = ui.tab === "stats" ? renderStats() : ui.tab === "cal" ? renderCal() : ui.tab === "more" ? renderMore() : renderHome();
  main.innerHTML = html;
  nav.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === ui.tab));
  if (ui.search !== null) { const q = $("#q"); if (q && document.activeElement !== q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
}
function buildShell() {
  document.body.innerHTML = `<main class="app" id="main"></main>
    <nav class="bottom" aria-label="主要功能"><div class="in">${TABS.map(([id, icon, t]) => (id === "fab"
      ? `<div class="fab-wrap"><button class="fab" id="fab" aria-label="記一筆（按住往上劃可以快速選分類）">${ico("plus")}</button></div>`
      : `<button class="tab" data-tab="${id}">${ico(icon)}<span>${t}</span></button>`)).join("")}</div></nav>`;
  main = $("#main"); nav = $(".bottom");
  bindFab($("#fab"));
  nav.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]")?.dataset.tab; if (t && t !== ui.tab) go(t); else if (t === "more" && ui.more) go("more"); });
  main.addEventListener("click", onClick);
  main.addEventListener("input", onInput);
  main.addEventListener("compositionend", (e) => onInput({ target: e.target, isComposing: false }));
  main.addEventListener("change", onChange);
}

async function onClick(e) {
  const t = e.target.closest("button");
  if (!t) return;
  const d = t.dataset;
  if (d.per) { ui.period = C.addMonths(ui.period, +d.per); ui.openCat = null; return render(); }
  if (d.search !== undefined) { ui.search = ""; return render(); }
  if (d.searchClose !== undefined) { ui.search = null; return render(); }
  if (d.item) { const it = data.items.find((x) => x.id === d.item); if (it) openForm(it); return; }
  if (d.sc) { const sc = data.shortcuts.find((x) => x.id === d.sc); if (sc) useShortcut(sc); return; }
  if (d.goto) return go("more", d.goto);
  if (d.back !== undefined) return history.back();
  if (d.stype) { ui.statType = d.stype; ui.openCat = null; return render(); }
  if (d.ocat !== undefined) { ui.openCat = ui.openCat === d.ocat ? null : d.ocat; return render(); }
  if (d.cal) { ui.calMonth = C.addMonths(ui.calMonth, +d.cal); ui.calDay = ""; return render(); }
  if (d.day) { ui.calDay = ui.calDay === d.day ? "" : d.day; return render(); }
  if (d.addday) return openForm(null, { date: d.addday });
  // 更多
  if (d.newdebt !== undefined) return debtForm();
  if (d.debt) return debtForm(data.debts.find((x) => x.id === d.debt));
  if (d.newgoal !== undefined) return goalForm();
  if (d.goal) return goalForm(data.goals.find((x) => x.id === d.goal));
  if (d.savebudget !== undefined) {
    const total = C.evalAmount($("#b-total").value) || 0, cats = {};
    main.querySelectorAll("[data-bcat]").forEach((i) => { const v = C.evalAmount(i.value); if (v) cats[i.dataset.bcat] = v; });
    commit({ ...data, budget: { total, cats } }, { quiet: true }); toast("預算存好了"); return history.back();
  }
  if (d.newrec !== undefined) return ruleForm("rec");
  if (d.editrec) return ruleForm("rec", data.recurring.find((x) => x.id === d.editrec));
  if (d.newsc !== undefined) return ruleForm("sc");
  if (d.editsc) return ruleForm("sc", data.shortcuts.find((x) => x.id === d.editsc));
  if (d.ctype) { ui.catType = d.ctype; return render(); }
  if (d.cmove) return commit(C.moveCategory(data, ui.catType, d.c, +d.cmove));
  if (d.cedit) return catForm(ui.catType, catOf(ui.catType, d.cedit));
  if (d.cadd !== undefined) return catForm(ui.catType);
  if (d.padd !== undefined) {
    const v = (await ask("新增付款方式", "例如：國泰信用卡、LINE Pay、悠遊卡", [["no", "取消"], ["ok", "新增", "primary"]], ""))?.trim().slice(0, 12);
    if (v && !data.pays.includes(v)) commit({ ...data, pays: [...data.pays, v], wheel: data.wheel.pays.length < C.WHEEL_MAX.pays ? { ...data.wheel, pays: [...data.wheel.pays, v] } : data.wheel });
    return;
  }
  if (d.prename) { const v = await ask("改名", "", [["no", "取消"], ["ok", "存起來", "primary"]], d.prename); if (v) commit(C.renamePay(data, d.prename, v)); return; }
  if (d.pdel) { if (await sure(`刪除「${d.pdel}」？`, "以前用它記的紀錄會照舊寫著。", "刪除", "danger")) commit(C.removePay(data, d.pdel)); return; }
  if (d.theme) { commit({ ...data, prefs: { ...data.prefs, theme: d.theme } }); return applyTheme(); }
  if (d.mode) { commit({ ...data, prefs: { ...data.prefs, mode: d.mode } }); applyTheme(); return render(); }
  if (d.bg) { commit({ ...data, prefs: { ...data.prefs, bg: d.bg } }); return applyTheme(); }
  if (d.pattern) { commit({ ...data, prefs: { ...data.prefs, pattern: d.pattern } }); return applyTheme(); }
  if (d.keyh !== undefined) { const v = +d.keyh ? C.clampKeyH(data.prefs.keyH + +d.keyh) : C.KEY_H.def; return commit({ ...data, prefs: { ...data.prefs, keyH: v } }); }
  if (d.export !== undefined) return exportBackup();
  if (d.import !== undefined) return $("#imp").click();
  if (d.csv !== undefined) { const ok = await download(`記帳-${today().replace(/-/g, "")}.csv`, C.toCSV(data.items), "text/csv"); if (ok) toast("CSV 匯出了，可以用 Excel 或 Google 試算表打開"); return; }
  if (d.install !== undefined) { const ev = window.ledgerInstall; if (ev) { ev.prompt(); const r = await ev.userChoice.catch(() => ({})); if (r.outcome === "accepted") window.ledgerInstall = null; render(); } return; }
  if (d.clearall !== undefined) {
    const v = await ask("真的要清除全部資料？", "請輸入「清除」兩個字確認。", [["no", "取消"], ["ok", "清除全部", "danger"]], "");
    if (v?.trim() !== "清除") { if (v !== null) toast("沒有清除（要輸入「清除」）"); return; }
    commit(C.emptyData(), { quiet: true }); applyTheme(); ui.period = periodNow(); toast("全部清除了"); return go("home");
  }
}
function onInput(e) {
  if (e.target.id !== "q" || e.isComposing) return;          // 注音選字中：等選好（compositionend）再找
  ui.search = e.target.value;
  const box = $("#sres"); if (box) box.innerHTML = searchResults(ui.search);
}
function onChange(e) {
  const t = e.target;
  if (t.id === "imp" && t.files?.[0]) { importBackup(t.files[0]); t.value = ""; return; }
  if (t.id === "m-start") { commit({ ...data, prefs: { ...data.prefs, monthStart: Number(t.value) } }); ui.period = periodNow(); return render(); }
  if (t.dataset.wpay !== undefined || t.dataset.wcat !== undefined) {
    const isPay = t.dataset.wpay !== undefined, name = isPay ? t.dataset.wpay : t.dataset.wcat, key = isPay ? "pays" : "cats", max = C.WHEEL_MAX[key];
    let list = data.wheel[key].filter((x) => x !== name);
    if (t.checked) {
      if (list.length >= max) { t.checked = false; return toast(`最多 ${max} 個，先取消一個`); }
      const order = isPay ? data.pays : data.cats.out.map((c) => c.name);
      list = order.filter((x) => list.includes(x) || x === name);
    }
    return commit({ ...data, wheel: { ...data.wheel, [key]: list } });
  }
}

// ================================================================ 開始
function start() {
  data = load();
  applyTheme();
  ui.period = periodNow(); ui.calMonth = today().slice(0, 7);
  const res = C.applyRecurring(data, today());           // 固定收支：到期的補記
  if (res.added.length) { data = res.data; save(); }
  buildShell();
  history.replaceState({ tab: "home" }, "");
  render();
  if (res.added.length) toast(`自動記了 ${res.added.length} 筆固定收支`);
  try { navigator.storage?.persist?.(); } catch { /* 不支援 */ }
  addEventListener("ledger:installable", () => { if (ui.more === "install") render(); });
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
  // 隔天打開沒有重新整理：回到 App 時換成今天這一期、補記固定收支
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const r = C.applyRecurring(data, today());
    if (r.added.length) { commit(r.data); toast(`自動記了 ${r.added.length} 筆固定收支`); }
  });
}
start();
