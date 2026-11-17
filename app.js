// 家庭記帳：畫面與操作。資料只存在這台裝置的 localStorage（KEY），邏輯在 core.js。
import * as C from "./core.js";

const KEY = "ledger-v1";
const VERSION = "1.3.2";

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
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
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
const ui = { tab: "home", period: "", search: null, statType: "out", openCat: null, calMonth: "", calDay: "", more: null, catType: "out", fg: null };
const sheets = [];
let skipPop = 0;
window.addEventListener("popstate", (e) => {
  if (skipPop) { skipPop--; return; }
  if (sheets.length) { sheets.pop().close(true); return; }
  const s = e.state || {};
  ui.tab = s.tab || "home"; ui.more = s.more || null; ui.fg = s.fg || null; ui.search = null;
  render();
});
function go(tab, more = null) {
  ui.tab = tab; ui.more = more; ui.search = null; ui.openCat = null; ui.fg = null;
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
  if (!item.acct && !String(item.id).startsWith("fr-")) item = { ...item, acct: C.acctFor(data, item.type, item.pay) };   // 從哪個帳戶扣：照當下設定，之後改設定不影響這筆
  commit({ ...data, items: [...data.items, item], prefs: { ...data.prefs, lastPay: (item.type === "out" && item.pay) || data.prefs.lastPay } });
  toast(msg || `已記：${item.sub || item.cat} ${C.money(item.amt)}`, { label: "復原", run: () => commit({ ...data, items: data.items.filter((x) => x.id !== item.id) }) });
}

// 完整的表單：新增或編輯（item）
function openForm(item = null, preset = {}) {
  const f = item ? { ...item, expr: String(item.amt) } : { type: "out", cat: "", sub: "", pay: data.prefs.lastPay, date: today(), note: "", expr: "", ...preset };
  if (!f.cat) f.cat = data.cats[f.type][0]?.name || "其他";
  if (f.type === "in" && !f.acct) f.acct = C.acctFor(data, "in", "");
  let makeShortcut = false;
  openSheet((el, s) => {
    const draw = () => {
      const subs = catOf(f.type, f.cat)?.subs || [];
      el.innerHTML = `
        <div class="sheet-h"><div class="seg" role="tablist"><button data-type="out" class="${f.type === "out" ? "on" : ""}">支出</button><button data-type="in" class="${f.type === "in" ? "on" : ""}">收入</button>${!item && data.accounts.length > 1 ? `<button data-type="move">移動</button>` : ""}${!item && friendOn() ? `<button data-type="friend">朋友帳</button>` : ""}</div>
          <h3></h3>${item ? `<button class="btn text danger" data-del>${ico("trash")}刪除</button>` : ""}<button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        <div class="amt-disp"></div>
        <div class="cats">${data.cats[f.type].map((c) => `<button data-cat="${esc(c.name)}" class="${c.name === f.cat ? "on" : ""}">${ico(c.icon)}<span>${esc(c.name)}</span></button>`).join("")}</div>
        ${subs.length ? `<div class="pick-row">${subs.map((x) => `<button class="chip${x === f.sub ? " on" : ""}" data-sub="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
        ${f.type === "in" && data.accounts.length > 1 ? `<div class="field"><span class="lab">存入</span><div class="pick-row" style="padding:0">${data.accounts.filter((a) => a.type !== "card").map((a) => `<button class="chip${a.id === f.acct ? " on" : ""}" data-iacct="${esc(a.id)}">${esc(a.name)}</button>`).join("")}</div></div>` : ""}
        ${f.type === "out" && data.accounts.length > 1 ? `<p class="small muted acct-hint">從「${esc(aName(C.acctFor(data, "out", f.pay)))}」扣</p>` : ""}
        ${f.type === "out" ? `<div class="field"><span class="lab">付款方式</span><div class="pick-row" style="padding:0">${data.pays.map((p) => `<button class="chip${p === f.pay ? " on" : ""}" data-pay="${esc(p)}">${esc(p)}</button>`).join("")}</div></div>` : ""}
        <div class="field"><label for="f-date">日期</label><input id="f-date" type="date" value="${esc(f.date)}" max="2100-12-31"></div>
        <div class="field"><label for="f-note">備註</label><input id="f-note" value="${esc(f.note)}" maxlength="200" placeholder="例如：全聯、和朋友聚餐"></div>
        ${item ? "" : `<label class="check"><input type="checkbox" data-sc${makeShortcut ? " checked" : ""}> 存成常用捷徑（首頁一點就能再記一次）</label>`}
        ${keypadHTML()}`;
      bindKeypad(el, f, (amt) => {
        const acct = f.type === "in" ? f.acct || C.acctFor(data, "in", "") : item && item.type === "out" && item.pay === f.pay && item.acct ? item.acct : C.acctFor(data, "out", f.pay);
        const rec = { id: item?.id || C.newId(), type: f.type, amt, cat: f.cat, sub: f.sub, pay: f.type === "out" ? f.pay : "", date: f.date || today(), note: f.note.trim(), t: item?.t || Date.now(), ...(item?.rec ? { rec: item.rec } : {}), ...(String(item?.id).startsWith("fr-") ? {} : { acct }) };
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
      if (t.dataset.type === "friend") { s.close(); setTimeout(() => friendForm("exp", null), 80); return; }
      if (t.dataset.type === "move") { s.close(); setTimeout(() => moveForm(), 80); return; }
      if (t.dataset.iacct) { f.acct = t.dataset.iacct; draw(); return; }   // 等上一頁的返回處理完再開
      if (t.dataset.type) {          // 收入通常不是用「付款方式」：切到收入先空著，切回支出用上次的
        if (t.dataset.type !== f.type) { f.type = t.dataset.type; f.cat = data.cats[f.type][0]?.name || "其他"; f.sub = ""; f.pay = f.type === "in" ? "" : data.prefs.lastPay; f.acct = f.type === "in" ? C.acctFor(data, "in", "") : ""; draw(); }
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
  if (sc.type === "move") {
    if (!(data.accounts.some((a) => a.id === sc.from) && data.accounts.some((a) => a.id === sc.to))) return toast("這個捷徑的帳戶不見了");
    if (!sc.amt) return moveForm(null, { from: sc.from, to: sc.to, note: sc.note });
    const rec = { id: C.newId(), from: sc.from, to: sc.to, amt: sc.amt, date: today(), note: sc.note || "", t: Date.now() };
    commit({ ...data, moves: [...data.moves, rec] });
    return toast(`已記：${scLabel(sc)} ${C.money(sc.amt)}`, { label: "復原", run: () => commit({ ...data, moves: data.moves.filter((x) => x.id !== rec.id) }) });
  }
  if (sc.amt > 0) return addItem(C.itemFromShortcut(sc, sc.amt, today()));
  quickAmount({ type: sc.type, cat: sc.cat, sub: sc.sub, pay: sc.pay, note: sc.note, title: C.shortcutLabel(sc) });
}

// ================================================================ 長按一劃：扇形選單
const FRIEND_WHEEL_MAX = 2;
// 扇形選單內圈的朋友（「某人付」）：存在這台裝置；沒設過就用前兩位
function wheelFriends() {
  if (!friendOn()) return [];
  const people = friendPeople(), key = (m) => m.g + "|" + m.uid;
  const saved = lsGet("ledger-friend-wheel", null);
  return (Array.isArray(saved) ? people.filter((m) => saved.includes(key(m))) : people.slice(0, FRIEND_WHEEL_MAX)).slice(0, FRIEND_WHEEL_MAX);
}
function wheelLists() {
  const cats = data.wheel.cats.filter((c) => catOf("out", c));
  const pays = data.wheel.pays.filter((p) => data.pays.includes(p)), fs = wheelFriends();
  return { cats: cats.length ? cats : data.cats.out.slice(0, C.WHEEL_MAX.cats).map((c) => c.name),
    pays: [...pays, ...fs.map((m) => fname(m.uid, m.g) + "付")], pf: [...pays.map(() => null), ...fs] };
}
const polar = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
function annulus(cx, cy, ri, ro, a0, a1) {
  const [x1, y1] = polar(cx, cy, ro, a0), [x2, y2] = polar(cx, cy, ro, a1), [x3, y3] = polar(cx, cy, ri, a1), [x4, y4] = polar(cx, cy, ri, a0);
  return `M${x1} ${y1}A${ro} ${ro} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 0 0 ${x4} ${y4}Z`;
}
function openWheel(st) {
  st.open = true;
  try { navigator.vibrate?.(12); } catch { /* 不支援震動 */ }
  const { cats, pays, pf } = wheelLists();
  const k = Math.min(1, (innerWidth - 12) / (2 * (C.WHEEL_R.r2 + 6)), (st.cy - 70) / (C.WHEEL_R.r2 + 6));
  const R = { r0: C.WHEEL_R.r0 * k, r1: C.WHEEL_R.r1 * k, r2: C.WHEEL_R.r2 * k, slack: C.WHEEL_R.slack * k };
  Object.assign(st, { cats, pays, pf, R, pay: null, friend: null, hit: null, hotKey: "" });
  const pad = 6, W = 2 * (R.r2 + pad), H = R.r2 + pad + R.r0 + pad, cx = W / 2, cy = R.r2 + pad;
  let svg = "";
  pays.forEach((p, i) => {
    const [a0, a1] = C.wheelSeg(i, pays.length), [tx, ty] = polar(cx, cy, (R.r0 + R.r1) / 2 + 2, (a0 + a1) / 2);
    svg += `<path class="sg${pf[i] ? " fr" : ""}" data-pay="${i}" d="${annulus(cx, cy, R.r0 + 4, R.r1 - 2, a0 - 0.6, a1 + 0.6)}"/><g data-payt="${i}"><text x="${tx}" y="${ty}">${esc(p)}</text></g>`;
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
  if (hit?.ring === "pay") { st.pay = st.pays[hit.idx]; st.friend = st.pf[hit.idx]; }
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
    if (s.friend) return friendQuick(s.friend, s.cats[s.hit.idx]);
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
function dayList(list, moves = []) {
  const days = C.byDay(list), md = new Map();
  for (const m of moves) { if (!md.has(m.date)) md.set(m.date, []); md.get(m.date).push(m); }
  const dates = [...new Set([...days.map((d) => d.date), ...md.keys()])].sort().reverse();
  return dates.map((date) => {
    const d = days.find((x) => x.date === date) || { items: [], out: 0, in: 0 }, ms = (md.get(date) || []).sort((a, b) => b.t - a.t);
    return `<div class="day-h"><b>${esc(C.dayLabel(date, today()))}</b><span class="num">支出 ${C.money(d.out)}${d.in ? `　收入 ${C.money(d.in)}` : ""}</span></div>${d.items.map(itemRow).join("")}${ms.map(moveRow).join("")}`;
  }).join("");
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
  const pMoves = data.moves.filter((m) => C.inPeriod(m.date, ui.period, s));
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
    ? `<div class="chips">${data.shortcuts.map((sc) => `<button class="chip" data-sc="${esc(sc.id)}">${esc(scLabel(sc))}${sc.amt ? ` <span class="num">${C.money(sc.amt)}</span>` : ""}</button>`).join("")}<button class="chip add" data-goto="shortcuts">${ico("plus")}捷徑</button></div>`
    : "";
  return `${periodNav(`<button class="icon-btn" data-search aria-label="搜尋">${ico("search")}</button>`)}
    <section class="hero">${hero}</section>${acctRow()}${friendSummary()}${notes}${chips}
    ${list.length || pMoves.length ? dayList(list, pMoves) : `<div class="empty">這期還沒有紀錄。<br>點下面的 ＋ 記一筆；按住 ＋ 往上劃，可以一次選好付款方式和分類。</div>`}`;
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
  ["accts", "wallet", "帳戶", () => { const b = C.acctBalances(data); return data.accounts.map((a) => `${a.name} ${C.money(b[a.id])}`).join("・"); }],
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
const FRIENDS_ROW = ["friends", "users", "朋友分帳", () => {
  const me = fr().me, b = fr().groups.flatMap((g) => C.friendBalances(fr().entries.filter((e) => e.g === g.id)));
  const owed = b.filter((x) => x.to === me).reduce((a, x) => a + x.amt, 0), owe = b.filter((x) => x.from === me).reduce((a, x) => a + x.amt, 0);
  return fr().at ? `別人欠我 ${C.money(owed)}・我欠別人 ${C.money(owe)}` : "和 LINE 記帳群組連動";
}];
const subHead = (title, extra = "") => `<header class="top"><button class="icon-btn" data-back aria-label="回上一頁">${ico("chevron-left")}</button><h1 class="left">${esc(title)}</h1>${extra}</header>`;
function renderMore() {
  const page = { accts: pgAccts, friends: pgFriends, debts: pgDebts, goals: pgGoals, budget: pgBudget, recurring: pgRecurring, cats: pgCats, pays: pgPays, shortcuts: pgShortcuts, wheel: pgWheel, theme: pgTheme, start: pgStart, backup: pgBackup, install: pgInstall, clear: pgClear }[ui.more];
  if (page) return page();
  return `<header class="top"><h1 class="left">更多</h1></header>
    ${[...(data.prefs.friend ? [FRIENDS_ROW] : []), ...MORE.slice(0, 2)].map(menuRow).join("")}<div class="sec-h"><span>設定</span></div>${MORE.slice(2).map(menuRow).join("")}
    <button class="menu-row" data-goto="clear" style="color:var(--bad)">${ico("trash")}<span class="t">清除全部資料</span></button>
    ${data.prefs.friend ? "" : `<button class="btn text small" data-fcode style="padding:12px 0 0">${ico("users")}輸入朋友帳連動碼（LINE 記帳群組）</button>`}
    <p class="foot">帳只存在這台裝置，不會上傳到任何地方；每個人的手機是各自的帳本。記得偶爾「匯出備份」。版本 ${VERSION}</p>`;
}
function menuRow([id, icon, title, sub]) {
  return `<button class="menu-row" data-goto="${id}">${ico(icon)}<span class="t">${esc(title)}<small>${esc(sub())}</small></span><span class="chev">${ico("chevron-right")}</span></button>`;
}

// ---- 朋友分帳（和 LINE 記帳群組連動；只有拿到連動碼的人才有，家人的帳本不受影響）
const fst = { busy: false, err: "", lastTry: 0 };
const fr = () => data.friends || { me: "", at: 0, groups: [], members: [], entries: [] };
const fname = (uid, g) => (uid === fr().me ? "我" : fr().members.find((m) => m.uid === uid && (!g || m.g === g))?.name || fr().members.find((m) => m.uid === uid)?.name || "某人");
async function friendApi(body) {
  const f = data.prefs.friend, ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(f.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: f.key, ...body }), signal: ctl.signal });
    return await r.json();
  } finally { clearTimeout(tm); }
}
// 先把還沒上傳的送出去，再拿最新的帳；成功就把「我的那份」補進支出
async function syncFriends({ quiet = false } = {}) {
  if (!data.prefs.friend || fst.busy) return;
  fst.busy = true; fst.err = ""; fst.lastTry = Date.now();
  if (ui.more === "friends") render();
  let res = null;
  try {
    for (const q of [...(data.friendQ || [])]) {
      const r = await friendApi(q);
      if (!r.ok && r.err === "key") throw new Error("key");
      data = { ...data, friendQ: (data.friendQ || []).filter((x) => x !== q) };   // 伺服器拒絕的（例如不能刪別人的）也拿掉，才不會一直卡住
      save();
      if (!r.ok) toast("有一筆沒記成功：" + r.err);
      else res = r;
    }
    if (!res) res = await friendApi({ op: "sync" });
    if (!res.ok) throw new Error(res.err || "sync");
    const clean = C.cleanFriends(res);
    let next = { ...data, friends: clean };
    if (data.prefs.friend.auto) {
      const r = C.friendItems(data.items, clean, data.cats);
      next = { ...next, items: r.items };
      if ((r.added || r.removed) && !quiet) toast(`朋友帳：${r.added ? `我的那份補進支出 ${r.added} 筆` : ""}${r.added && r.removed ? "、" : ""}${r.removed ? `拿掉 ${r.removed} 筆` : ""}`);
    }
    commit(next, { quiet: true });
  } catch (e) {
    fst.err = e.message === "key" ? "連動碼失效了：請私訊 LINE 記帳機器人「連動碼」，點新的連結。" : "現在連不上，先顯示上次的資料；在這裡記的帳會等連上再送。";
  } finally { fst.busy = false; if (!(ui.tab === "home" && ui.search !== null)) render(); }
}
// 在這台記一筆朋友帳：先上畫面、排隊上傳；我有份的話，我的那份馬上算進支出（分類用 hint，之後同步只更新金額不動分類）
function queueFriend(q, entry, hint = null) {
  const f = fr();
  let items = data.items;
  if (entry && data.prefs.friend?.auto) {
    const v = C.friendShare(entry, f.me);
    if (v > 0) items = [...items, { id: "fr-" + entry.id, type: "out", amt: v, ...(hint || C.guessCat(entry.item, data.cats)), pay: "", date: C.ymd(new Date(entry.t)), note: "朋友帳・" + entry.item, t: entry.t }];
  }
  commit({ ...data, items, friendQ: [...(data.friendQ || []), q],
    friends: entry ? { ...f, entries: [...f.entries, { ...entry, pending: true }] } : { ...f, entries: f.entries.map((e) => (e.id === q.id ? { ...e, del: true, pending: true } : e)) } });
  syncFriends();
}
const friendOn = () => !!(data.prefs.friend && fr().groups.length);
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 存不了就算了 */ } };
// 別的群組成員（不含我），同一個人在不同群組各算一個
const friendPeople = () => { const me = fr().me; return fr().members.filter((m) => m.uid !== me && fr().groups.some((g) => g.id === m.g)); };
// 首頁一行：整體欠款（所有群組加起來，照人合併）
function friendSummary() {
  if (!friendOn()) return "";
  const me = fr().me, per = new Map();
  for (const g of fr().groups) for (const x of C.friendBalances(fr().entries.filter((e) => e.g === g.id))) {
    if (x.to !== me && x.from !== me) continue;
    const who = fname(x.to === me ? x.from : x.to, g.id);
    per.set(who, (per.get(who) || 0) + (x.to === me ? x.amt : -x.amt));
  }
  const parts = [...per].filter(([, v]) => v).map(([n, v]) => (v > 0 ? `<span class="pos">${esc(n)}欠我 ${N(v)}</span>` : `<span>我欠${esc(n)} ${N(-v)}</span>`));
  return `<button class="fsum" data-goto="friends">${ico("users")}<span class="t"><small>朋友帳（從以前到現在）</small>${parts.join("・") || "大家都兩清"}</span><span class="chev">${ico("chevron-right")}</span></button>`;
}
// 群組頁：我和每個人從以前到現在的總帳
function pairBlocks(gid) {
  const me = fr().me, ps = C.pairTotals(fr().entries.filter((e) => e.g === gid));
  const mine = ps.filter((p) => p.a === me || p.b === me), rest = ps.filter((p) => p.a !== me && p.b !== me);
  if (!ps.length) return `<div class="fb muted">還沒有帳</div>`;
  const block = (p) => {
    const iA = p.a === me, o = iA ? p.b : p.a, nm = esc(fname(o, gid));
    const owesMe = iA ? p.ba : p.ab, iOwe = iA ? p.ab : p.ba, iPaid = iA ? p.apay : p.bpay, paidMe = iA ? p.bpay : p.apay;
    const net = !p.net ? `<b>兩清</b>` : p.net.to === me ? `<b class="pos">${nm} 欠我 ${N(p.net.amt)}</b>` : `<b>我欠 ${nm} ${N(p.net.amt)}</b>`;
    return `<div class="pair"><div class="pair-net">${net}</div>
      <div class="pair-rows"><span>${nm} 欠我　合計 ${N(owesMe)}</span><span>我欠 ${nm}　合計 ${N(iOwe)}</span>${iPaid || paidMe ? `<span>已還：我還 ${N(iPaid)}・${nm} 還 ${N(paidMe)}</span>` : ""}</div></div>`;
  };
  const other = rest.filter((p) => p.net).map((p) => `<div class="fb small muted">${esc(fname(p.net.from, gid))} 欠 ${esc(fname(p.net.to, gid))} ${N(p.net.amt)}</div>`).join("");
  return mine.map(block).join("") + other;
}
async function linkFriend(link) {
  if (!link) return toast("連動碼不對：請私訊 LINE 記帳機器人「連動碼」，打它回的 8 個字");
  if (!(await sure("連上 LINE 朋友帳？", "連上後，這台手機看得到你有參加的 LINE 記帳群組，也能在這裡記帳；你分到的那份會自動算進支出。", "連上"))) return;
  const { friends, friendQ, ...rest } = data;
  commit({ ...rest, prefs: { ...data.prefs, friend: { ...link, auto: true } } }, { quiet: true });
  ui.fg = null;
  go("more", "friends");
  await syncFriends();
}
function balLines(gid, onlyMe = false) {
  const me = fr().me, b = C.friendBalances(fr().entries.filter((e) => e.g === gid));
  if (!b.length) return `<div class="fb muted">沒有人欠錢</div>`;
  const mine = b.filter((x) => x.from === me || x.to === me), rest = b.filter((x) => x.from !== me && x.to !== me);
  const line = (x) => (x.to === me ? `<div class="fb pos">${esc(fname(x.from, gid))} 欠我 ${N(x.amt)}</div>`
    : x.from === me ? `<div class="fb">我欠 ${esc(fname(x.to, gid))} ${N(x.amt)}</div>`
    : `<div class="fb small muted">${esc(fname(x.from, gid))} 欠 ${esc(fname(x.to, gid))} ${N(x.amt)}</div>`);
  return mine.map(line).join("") + (onlyMe ? "" : rest.map(line).join("")) || `<div class="fb muted">你沒有欠人，別人也沒欠你</div>`;
}
function describeF(e) {
  if (e.kind === "pay") return `${fname(e.payer, e.g)} 還 ${fname(e.to[0], e.g)}`;
  if (e.to.length === 1) return `${fname(e.to[0], e.g)} 欠 ${fname(e.payer, e.g)}`;
  return `${fname(e.payer, e.g)} 付，${e.to.length} 人平分`;
}
const mmdd = (t) => C.ymd(new Date(t)).slice(5).replace("-", "/");
function pgFriends() {
  const f = data.prefs.friend;
  if (!f) return `${subHead("朋友分帳")}
    <p>和 LINE 的記帳群組連在一起：在 LINE 打「午餐 120」記的帳，這裡看得到；在這裡記的，也會進同一本帳。</p>
    <ol class="steps"><li>在 LINE 私訊記帳機器人「連動碼」。</li><li>它會回一組 8 個字的連動碼，例如 K7P2-9QXA。</li><li>按下面的「輸入連動碼」，打進去就連上了。</li></ol>
    <div class="row-btns"><button class="btn primary grow" data-fcode>輸入連動碼</button></div>
    <p class="small muted">只看得到你有參加的群組；沒連動的人（例如家人）完全看不到。</p>`;
  const F = fr(), g = ui.fg && F.groups.find((x) => x.id === ui.fg), q = (data.friendQ || []).length;
  const status = `<p class="small muted fstat">${fst.busy ? "同步中…" : F.at ? `上次同步 ${mmdd(F.at)} ${new Date(F.at).toTimeString().slice(0, 5)}` : "還沒同步"}${q ? `・${q} 筆等著上傳` : ""}</p>
    ${fst.err ? `<div class="note warn">${ico("alert")}<span>${esc(fst.err)}</span></div>` : ""}`;
  const syncBtn = `<button class="icon-btn" data-fsync aria-label="同步"${fst.busy ? " disabled" : ""}>${ico("rotate-ccw")}</button>`;
  if (g) {
    const list = F.entries.filter((e) => e.g === g.id && !e.del).sort((a, b) => b.t - a.t);
    return `${subHead(g.name, syncBtn)}${status}
      <div class="fbal">${pairBlocks(g.id)}</div>
      <div class="row-btns"><button class="btn primary grow" data-fadd>${ico("plus")}記一筆</button><button class="btn grow" data-frepay>記還款</button></div>
      <div class="sec-h"><span>明細（${list.length} 筆）</span><span>${esc(F.members.filter((m) => m.g === g.id).map((m) => fname(m.uid, g.id)).join("、"))}</span></div>
      ${list.map((e) => `<button class="list-row fe" data-fe="${esc(e.id)}"><span class="t">${esc(e.item)}<small>${esc(describeF(e))}・${mmdd(e.t)}${e.src === "App" ? "・App" : ""}${e.pending ? "・未上傳" : ""}</small></span>
        <span class="num${e.kind === "pay" ? " muted" : ""}">${C.money(e.amt)}</span></button>`).join("") || `<div class="empty">這個群組還沒有帳。</div>`}`;
  }
  return `${subHead("朋友分帳", syncBtn)}${status}
    <div class="row-btns"><button class="btn grow" data-fnew>${ico("plus")}新增一群朋友</button></div>
    ${F.groups.map((x) => `<button class="menu-row" data-fg="${esc(x.id)}" style="align-items:flex-start"><span class="t"><b>${esc(x.name)}</b>${balLines(x.id, true)}</span><span class="chev">${ico("chevron-right")}</span></button>`).join("")
      || (F.at ? `<div class="empty">你還沒在任何記帳群組裡說過話。<br>到 LINE 群組打一句「查詢」，再回來同步。</div>` : "")}
    <div class="sec-h"><span>設定</span></div>
    <label class="check"><input type="checkbox" id="f-auto"${f.auto ? " checked" : ""}> 我分到的那份自動算進我的支出（備註寫「朋友帳」）</label>
    <div class="row-btns"><button class="btn danger" data-funlink>解除連動</button></div>
    <p class="small muted">LINE 群組裡打「說明」看所有指令。想和另一群朋友分帳：開一個 LINE 群組、把記帳機器人邀進去，就是一本新的分帳本。</p>`;
}
// 記一筆朋友帳（群組頁的按鈕、記一筆的「朋友帳」分頁都用這個）。記住上次的群組、人、方式，下次只要點項目、打金額。
function friendForm(kind, gid0 = ui.fg) {
  const F = fr(), me = F.me, last = lsGet("ledger-friend-last", {});
  const okG = (g) => F.groups.some((x) => x.id === g) && F.members.some((m) => m.g === g && m.uid !== me);
  const gid = [gid0, last.g, ...F.groups.map((g) => g.id)].find((g) => g && okG(g));
  if (!gid) return toast("群組裡的其他人還沒在 LINE 說過話，等他們打一句「查詢」再記");
  const st = { g: gid, mode: kind === "pay" ? "iPay" : last.mode && last.mode !== "iPay" && last.mode !== "theyPay" ? last.mode : "iOwe", who: "", payer: me, to: [], item: "", hint: null, expr: "" };
  const setGroup = (g) => {
    st.g = g;
    const mem = F.members.filter((m) => m.g === g), others = mem.filter((m) => m.uid !== me);
    st.who = others.some((m) => m.uid === last.who) ? last.who : others[0].uid;
    st.payer = me; st.to = mem.map((m) => m.uid);
  };
  setGroup(gid);
  // 常用項目：餐飲的細項＋我最近記過的朋友帳項目
  const quick = () => {
    const food = (data.cats.out.find((c) => c.name === "餐飲")?.subs || []).slice(0, 4);
    const recent = [...new Set(F.entries.filter((e) => e.by === me && e.kind === "exp").sort((a, b) => b.t - a.t).map((e) => e.item))].filter((x) => !food.includes(x)).slice(0, 4);
    return [...food, ...recent];
  };
  openSheet((el, s) => {
    const draw = () => {
      const mem = F.members.filter((m) => m.g === st.g), others = mem.filter((m) => m.uid !== me);
      const modes = kind === "pay" ? [["iPay", "我還別人"], ["theyPay", "別人還我"]] : [["iOwe", "我欠別人"], ["theyOwe", "別人欠我"], ["split", "大家平分"]];
      const chips = (list, attr, on) => `<div class="pick-row" style="padding:0">${list.map((m) => `<button class="chip${on(m.uid) ? " on" : ""}" data-${attr}="${esc(m.uid)}">${esc(fname(m.uid, st.g))}</button>`).join("")}</div>`;
      const groups = F.groups.filter((g) => okG(g.id));
      el.innerHTML = `<div class="sheet-h"><h3>${kind === "pay" ? "記還款" : "記一筆朋友帳"}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        ${groups.length > 1 ? `<div class="pick-row" style="padding:0 0 8px">${groups.map((g) => `<button class="chip${g.id === st.g ? " on" : ""}" data-fgp="${esc(g.id)}">${esc(g.name)}</button>`).join("")}</div>` : ""}
        <div class="seg" style="margin-bottom:8px">${modes.map(([v, t]) => `<button data-fm="${v}" class="${st.mode === v ? "on" : ""}">${t}</button>`).join("")}</div>
        ${st.mode === "split" ? `<div class="field"><span class="lab">誰付的</span>${chips(mem, "fpay", (u) => u === st.payer)}</div><div class="field"><span class="lab">誰要分</span>${chips(mem, "fto", (u) => st.to.includes(u))}</div>`
          : `<div class="field"><span class="lab">${{ iOwe: "欠誰", theyOwe: "誰欠我", iPay: "還給誰", theyPay: "誰還我" }[st.mode]}</span>${chips(others, "fwho", (u) => u === st.who)}</div>`}
        ${kind === "pay" ? "" : `<div class="pick-row" style="padding:0 0 4px">${quick().map((x) => `<button class="chip${x === st.item ? " on" : ""}" data-fq="${esc(x)}">${esc(x)}</button>`).join("")}</div>
          <div class="field"><label for="f-item">項目</label><input id="f-item" value="${esc(st.item)}" maxlength="40" placeholder="點上面的或自己打，例如：午餐"></div>`}
        <div class="amt-disp"></div>
        ${keypadHTML()}`;
      bindKeypad(el, st, (amt) => {
        const item = kind === "pay" ? "還款" : st.item.trim();
        if (!item) { toast("點一個項目或自己打，例如：午餐"); return; }
        const m = st.mode, payer = m === "iOwe" || m === "theyPay" ? st.who : m === "split" ? st.payer : me;
        const to = m === "split" ? st.to : m === "iOwe" || m === "theyPay" ? [me] : [st.who];
        if (m === "split" && to.length < 2) return toast("平分至少要兩個人");
        const e = { id: "A" + C.newId(), t: Date.now(), g: st.g, item, amt, payer, to, kind: kind === "pay" ? "pay" : "exp", by: me, src: "App", del: false };
        lsSet("ledger-friend-last", { g: st.g, who: st.who, mode: kind === "pay" ? last.mode : m });
        s.close();
        queueFriend({ op: "add", e }, e, st.hint);
        toast(`已記：${item} ${C.money(amt)}（${describeF(e)}）`);
      });
    };
    draw();
    el.addEventListener("input", (e) => { if (e.target.id === "f-item") { st.item = e.target.value; st.hint = null; } });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const d = t.dataset;
      if (d.close !== undefined) return s.close();
      if (d.fgp) { setGroup(d.fgp); draw(); }
      if (d.fm) { st.mode = d.fm; draw(); }
      if (d.fwho) { st.who = d.fwho; draw(); }
      if (d.fpay) { st.payer = d.fpay; draw(); }
      if (d.fto) { const u = d.fto, mem = F.members.filter((m) => m.g === st.g); st.to = mem.map((x) => x.uid).filter((x) => (x === u ? !st.to.includes(u) : st.to.includes(x))); draw(); }
      if (d.fq !== undefined) {   // 點常用項目：餐飲細項就直接用餐飲＋細項當分類
        st.item = d.fq;
        const food = data.cats.out.find((c) => c.name === "餐飲");
        st.hint = food?.subs.includes(d.fq) ? { cat: "餐飲", sub: d.fq } : null;
        draw();
      }
    });
  });
}
// 扇形選單放手在「某人付」＋分類：記成「我欠某人」，金額打完就好
function friendQuick(p, cat) {
  const st = { expr: "", sub: "", note: "" };
  openSheet((el, s) => {
    const subs = catOf("out", cat)?.subs || [];
    const draw = () => {
      el.innerHTML = `<div class="sheet-h"><h3>${esc(fname(p.uid, p.g))} 付・${esc(cat)}</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        <p class="small muted" style="margin:0 0 8px">記成：我欠 ${esc(fname(p.uid, p.g))}（${esc(fr().groups.find((g) => g.id === p.g)?.name || "")}），會同步到 LINE。</p>
        ${subs.length ? `<div class="pick-row">${subs.map((x) => `<button class="chip${x === st.sub ? " on" : ""}" data-sub="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
        <div class="amt-disp"></div>
        <div class="field"><label for="fq-note">項目</label><input id="fq-note" value="${esc(st.note)}" maxlength="40" placeholder="選填，不寫就用「${esc(cat)}」"></div>
        ${keypadHTML()}`;
      bindKeypad(el, st, (amt) => {
        const me = fr().me, item = st.note.trim() || st.sub || cat;
        const e = { id: "A" + C.newId(), t: Date.now(), g: p.g, item, amt, payer: p.uid, to: [me], kind: "exp", by: me, src: "App", del: false };
        s.close();
        queueFriend({ op: "add", e }, e, { cat, sub: st.sub });
        toast(`已記：${item} ${C.money(amt)}（我欠 ${fname(p.uid, p.g)}）`);
      });
    };
    draw();
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) s.close();
      if (t.dataset.sub !== undefined) { st.sub = st.sub === t.dataset.sub ? "" : t.dataset.sub; draw(); }
    });
    el.addEventListener("input", (e) => { if (e.target.id === "fq-note") st.note = e.target.value; });
  });
}
function newGroupHelp() {
  const bot = fr().bot;
  openSheet((el, s) => {
    el.innerHTML = `<div class="sheet-h"><h3>新增一群朋友</h3><button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
      <p style="margin:0 0 8px">一個 LINE 群組＝一本分帳本，想開幾本都可以，各算各的。</p>
      <ol class="steps"><li>在 LINE 開一個群組，把要一起記帳的朋友拉進來。</li><li>把記帳機器人也邀進群組（它要先是你的好友）。</li><li>群組裡每個人打一句「查詢」，機器人才認得大家。</li><li>回到這裡按右上角的同步，新的群組就出現了。</li></ol>
      <p class="small muted">朋友想在自己的記帳 App 裡看帳：請他私訊機器人「連動碼」，在 App 的「更多」最下面輸入。</p>
      ${bot ? `<div class="row-btns"><a class="btn primary grow" href="https://line.me/R/ti/p/${esc(bot)}" target="_blank" rel="noopener">在 LINE 加機器人好友</a></div><p class="small muted">機器人的 ID：<b>${esc(bot)}</b>（可以傳給朋友，讓他加好友）</p>` : ""}`;
    el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) s.close(); });
  });
}
async function friendEntry(id) {
  const e = fr().entries.find((x) => x.id === id);
  if (!e) return;
  const mine = e.by === fr().me;
  const v = await ask(`${e.item} ${C.money(e.amt)}`, `${describeF(e)}・${mmdd(e.t)}・${e.src === "App" ? "在 App 記的" : "在 LINE 記的"}${mine ? "" : `（${fname(e.by, e.g)} 記的，只有記的人能刪）`}`,
    mine ? [["no", "關閉"], ["del", "刪除這筆", "danger"]] : [["no", "關閉"]]);
  if (v === "del") queueFriend({ op: "del", id });
}

// ---- 帳戶（郵局、錢包、信用卡）與移動
const aName = (id) => C.acctName(data, id);
const scLabel = (sc) => (sc.type === "move" ? sc.label || C.moveLabel(data, sc) : C.shortcutLabel(sc));
// 首頁：各帳戶餘額＋移動按鈕；有卡費要繳就提醒
function acctRow() {
  if (!C.acctShown(data)) return "";
  const bal = C.acctBalances(data);
  const bills = data.accounts.map((a) => ({ a, b: C.cardBill(data, a, today()) })).filter((x) => x.b?.amount > 0);
  return `<div class="accts">${data.accounts.map((a) => `<button class="acct" data-recon="${esc(a.id)}" title="點一下對帳"><small>${esc(a.name)}</small><b class="num${bal[a.id] < 0 ? " neg" : ""}">${C.money(bal[a.id])}</b></button>`).join("")}
</div>
    <div class="acct-total"><span>總共 <b class="num">${C.money(Object.values(bal).reduce((x, y) => x + y, 0))}</b><small>（所有帳戶加起來，信用卡欠的已經扣掉）</small></span>
      ${data.accounts.length > 1 ? `<button class="btn acct-mv" data-move>${ico("repeat")}移動</button>` : ""}</div>
    ${bills.map(({ a, b }) => `<div class="note">${ico("credit-card")}<span>${esc(a.name)} 這期 <b class="num">${C.money(b.amount)}</b>，${Number(b.dueDate.slice(5, 7))}/${Number(b.dueDate.slice(8))} 要繳 <button data-paycard="${esc(a.id)}">已繳</button></span></div>`).join("")}`;
}
function moveRow(m) {
  return `<button class="item mv" data-move-id="${esc(m.id)}"><span class="cat-ico">${ico("repeat")}</span>
    <span style="min-width:0"><div class="name">${esc(C.moveLabel(data, m))}</div>${m.note ? `<div class="meta">${esc(m.note)}</div>` : ""}</span>
    <span class="amt mv">${C.money(m.amt)}</span></button>`;
}
// 移動：從一個帳戶到另一個（提款、存錢、繳卡費）。不算支出、不算收入
function moveForm(m = null, preset = {}) {
  if (data.accounts.length < 2) { toast("先到「更多 → 帳戶」新增第二個帳戶（例如郵局）"); return go("more", "accts"); }
  const last = lsGet("ledger-move-last", {}), has = (id) => data.accounts.some((a) => a.id === id);
  const from = [preset.from, last.from, "bank", data.accounts[0].id].find(has);
  const to = [preset.to, last.to, "cash", ...data.accounts.map((a) => a.id)].find((id) => has(id) && id !== from);
  const st = m ? { ...m, expr: String(m.amt) } : { from, to, expr: preset.amt ? String(preset.amt) : "", date: today(), note: preset.note || "", sc: false };
  openSheet((el, s) => {
    const draw = () => {
      const chips = (attr, cur, skip) => `<div class="pick-row" style="padding:0">${data.accounts.filter((a) => a.id !== skip).map((a) => `<button class="chip${a.id === cur ? " on" : ""}" data-${attr}="${esc(a.id)}">${esc(a.name)}</button>`).join("")}</div>`;
      el.innerHTML = `<div class="sheet-h"><h3>${m ? "修改移動" : "移動"}</h3>${m ? `<button class="btn text danger" data-mdel>${ico("trash")}刪除</button>` : ""}<button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        <p class="small muted" style="margin:0 0 8px">錢從一個帳戶換到另一個（提款、存錢、繳卡費），不算支出。</p>
        <div class="field"><span class="lab">從</span>${chips("mfrom", st.from)}</div>
        <div class="field"><span class="lab">到</span>${chips("mto", st.to, st.from)}</div>
        <div class="amt-disp"></div>
        <div class="field"><label for="m-date">日期</label><input id="m-date" type="date" value="${esc(st.date)}"></div>
        <div class="field"><label for="m-note">備註</label><input id="m-note" value="${esc(st.note)}" maxlength="200" placeholder="例如：提款、繳卡費"></div>
        ${m ? "" : `<label class="check"><input type="checkbox" data-msc${st.sc ? " checked" : ""}> 存成常用捷徑（首頁一點就記）</label>`}
        ${keypadHTML()}`;
      bindKeypad(el, st, (amt) => {
        if (st.from === st.to) return toast("「從」和「到」要不一樣");
        const rec = { id: m?.id || C.newId(), from: st.from, to: st.to, amt, date: st.date || today(), note: st.note.trim(), t: m?.t || Date.now() };
        s.close();
        lsSet("ledger-move-last", { from: rec.from, to: rec.to });
        let next = { ...data, moves: m ? data.moves.map((x) => (x.id === m.id ? rec : x)) : [...data.moves, rec] };
        if (st.sc) next = { ...next, shortcuts: [...next.shortcuts, { id: C.newId(), label: rec.note.slice(0, 12), type: "move", from: rec.from, to: rec.to, amt, note: rec.note }] };
        commit(next);
        if (!m) toast(`已記：${C.moveLabel(data, rec)} ${C.money(amt)}`, { label: "復原", run: () => commit({ ...data, moves: data.moves.filter((x) => x.id !== rec.id) }) });
        else toast("改好了");
      });
    };
    draw();
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button, input[type=checkbox]");
      if (!t) return;
      const d = t.dataset;
      if (d.close !== undefined) return s.close();
      if (d.mfrom) { st.from = d.mfrom; if (st.to === st.from) st.to = data.accounts.find((a) => a.id !== st.from).id; draw(); }
      if (d.mto) { st.to = d.mto; draw(); }
      if (d.msc !== undefined) st.sc = t.checked;
      if (d.mdel !== undefined && (await sure("刪除這筆移動？", `${C.moveLabel(data, m)} ${C.money(m.amt)}`, "刪除", "danger"))) { s.close(); commit({ ...data, moves: data.moves.filter((x) => x.id !== m.id) }); }
    });
    el.addEventListener("input", (e) => { if (e.target.id === "m-note") st.note = e.target.value; if (e.target.id === "m-date") st.date = e.target.value; });
  });
}
// 對帳：輸入現在實際有多少（信用卡是實際欠多少），差額可以記成支出／收入，或只改金額
async function reconcile(a) {
  const card = a.type === "card", cur = C.acctBalances(data)[a.id], shown = card ? -cur : cur;
  const v = await ask(`${a.name}對帳`, `App 算的是 ${card ? "欠 " : ""}${C.money(shown)}。${card ? "現在實際欠多少？" : "數一下現在實際有多少？"}`, [["no", "取消"], ["ok", "下一步", "primary"]], "");
  if (v === null || !v.trim()) return;
  const n = Math.round(Number(v.replace(/[,\s]/g, "")));
  if (!Number.isFinite(n)) return toast("金額請打整數");
  const diff = (card ? -n : n) - cur;            // 正：實際比 App 多；負：實際比較少
  if (!diff) return toast("剛好對上，不用調整");
  const other = data.cats.out.some((c) => c.name === "其他") ? "其他" : data.cats.out.at(-1).name;
  const otherIn = data.cats.in.some((c) => c.name === "其他") ? "其他" : data.cats.in.at(-1).name;
  const less = diff < 0, amt = Math.abs(diff);
  const how = await ask(`差了 ${C.money(amt)}`, less ? `實際比 App 算的少 ${C.money(amt)}，可能有花費沒記到。` : `實際比 App 算的多 ${C.money(amt)}，可能有收入沒記到。`,
    [[less ? "out" : "in", less ? "記成一筆支出（沒記到的花費）" : "記成一筆收入", "primary"], ["fix", "只把金額改對（不算收支）"], ["no", "取消"]]);
  if (how === "fix") {
    commit({ ...data, accounts: data.accounts.map((x) => (x.id === a.id ? { ...x, open: x.open + diff } : x)) });
    return toast(`${a.name}改成 ${C.money(card ? -(cur + diff) : cur + diff)}`);
  }
  if (how === "out" || how === "in") {
    addItem({ id: C.newId(), type: how, amt, cat: how === "out" ? other : otherIn, sub: "", pay: "", acct: a.id, date: today(), note: "對帳：" + (how === "out" ? "沒記到的花費" : "沒記到的收入"), t: Date.now() },
      `已記：對帳 ${C.money(amt)}（${a.name}）`);
  }
}
function pgAccts() {
  const bal = C.acctBalances(data), sel = (attr, cur) => `<select ${attr}>${data.accounts.map((a) => `<option value="${esc(a.id)}"${a.id === cur ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</select>`;
  return `${subHead("帳戶")}<p class="small muted">錢放在哪裡；點帳戶可以改設定或「對帳」（輸入實際有多少，自動補差額）。下面設定好「付款方式從哪裡扣」，記帳時就會自動從對的帳戶扣，不用每次選。帳戶之間搬錢（提款、繳卡費）用「移動」，不算支出。</p>
    ${data.accounts.map((a) => `<button class="menu-row" data-acct="${esc(a.id)}"><span class="t">${esc(a.name)}<small>${C.ACCT_TYPES[a.type]}${a.card ? `・每月 ${a.card.close} 號結帳、${a.card.due} 號繳` : ""}</small></span><span class="num${bal[a.id] < 0 ? " neg" : ""}">${C.money(bal[a.id])}</span><span class="chev">${ico("chevron-right")}</span></button>`).join("")}
    <div class="row-btns"><button class="btn grow" data-newacct>${ico("plus")}新增帳戶</button><button class="btn grow" data-preset>快速設定：郵局＋錢包＋信用卡</button></div>
    ${data.accounts.length > 1 ? `<div class="sec-h"><span>付款方式從哪裡扣</span></div>
      ${data.pays.map((p) => `<div class="field row"><label>${esc(p)}</label>${sel(`data-payacct="${esc(p)}"`, C.acctFor(data, "out", p))}</div>`).join("")}
      <p class="small muted">要加 LINE Pay、悠遊卡這類付款方式，到「更多 → 付款方式」新增，再回來選從哪裡扣。</p>
      <div class="sec-h"><span>其他</span></div>
      <div class="field row"><label>收入預設存入</label>${sel('id="in-acct"', C.acctFor(data, "in", ""))}</div>
      <div class="field row"><label>沒選付款方式時從</label>${sel('id="out-acct"', data.prefs.outAcct)}</div>
      <p class="small muted">改設定只影響之後記的帳，以前記的照舊。朋友帳自動補的那份不扣帳戶（是朋友先付的）。</p>` : ""}`;
}
function acctForm(a = null) {
  const f = a ? { ...a, openS: String(a.type === "card" ? -a.open : a.open), card: a.card ? { ...a.card } : { close: 5, due: 20, from: "" } } : { id: "", name: "", type: "bank", openS: "", card: { close: 5, due: 20, from: "" } };
  openSheet((el, s) => {
    const days = (id, v) => `<select id="${id}">${Array.from({ length: 28 }, (_, i) => `<option${i + 1 === v ? " selected" : ""}>${i + 1}</option>`).join("")}</select>`;
    const draw = () => {
      const others = data.accounts.filter((x) => x.id !== f.id && x.type !== "card");
      el.innerHTML = `<div class="sheet-h"><h3>${a ? "修改帳戶" : "新增帳戶"}</h3>${a && data.accounts.length > 1 ? `<button class="btn text danger" data-adel>${ico("trash")}刪除</button>` : ""}<button class="icon-btn" data-close aria-label="關閉">${ico("x")}</button></div>
        <div class="seg" style="margin-bottom:8px">${Object.entries(C.ACCT_TYPES).map(([k, v]) => `<button data-atype="${k}" class="${f.type === k ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="field"><label for="a-name">名稱</label><input id="a-name" value="${esc(f.name)}" maxlength="12" placeholder="${{ bank: "例如：郵局", cash: "例如：錢包", card: "例如：國泰卡" }[f.type]}"></div>
        <div class="field"><label for="a-open">${f.type === "card" ? "現在已經欠多少" : "現在有多少錢"}</label><input id="a-open" inputmode="numeric" value="${esc(f.openS)}" placeholder="0"></div>
        <p class="small muted" style="margin:0">${f.type === "card" ? "還沒繳的卡費總額；之後刷卡會自動加上去。" : "打開 App 這天帳戶裡的錢，之後的收支會自動加減。"}</p>
        ${f.type === "card" ? `<div class="field row"><label for="a-close">每月幾號結帳</label>${days("a-close", f.card.close)}</div>
          <div class="field row"><label for="a-due">每月幾號繳</label>${days("a-due", f.card.due)}</div>
          <div class="field row"><label for="a-from">卡費從哪裡繳</label><select id="a-from">${others.map((x) => `<option value="${esc(x.id)}"${x.id === f.card.from ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>` : ""}
        <div class="row-btns"><button class="btn primary grow" data-asave>存起來</button>${a ? `<button class="btn grow" data-arecon>對帳</button>` : ""}</div>
        ${a ? `<p class="small muted" style="margin:0">對帳：輸入現在實際有多少，App 幫你補上差額。</p>` : ""}`;
    };
    draw();
    el.addEventListener("input", (e) => { const id = e.target.id; if (id === "a-name") f.name = e.target.value; if (id === "a-open") f.openS = e.target.value; });
    el.addEventListener("change", (e) => { const id = e.target.id, v = e.target.value; if (id === "a-close") f.card.close = +v; if (id === "a-due") f.card.due = +v; if (id === "a-from") f.card.from = v; });
    el.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const d = t.dataset;
      if (d.close !== undefined) return s.close();
      if (d.atype) { f.type = d.atype; draw(); }
      if (d.arecon !== undefined) { s.close(); return setTimeout(() => reconcile(data.accounts.find((x) => x.id === a.id)), 80); }
      if (d.adel !== undefined) {
        if (!(await sure(`刪除「${a.name}」？`, "用它記的帳會改算到其他帳戶；和它有關的移動、捷徑會一起刪掉。", "刪除", "danger"))) return;
        s.close(); return commit(C.removeAccount(data, a.id));
      }
      if (d.asave !== undefined) {
        const name = f.name.trim().slice(0, 12);
        if (!name) return toast("寫一下名稱");
        const n = f.openS.trim() ? Math.round(Number(f.openS.replace(/,/g, ""))) : 0;
        if (!Number.isFinite(n)) return toast("金額請打整數");
        const others = data.accounts.filter((x) => x.id !== f.id && x.type !== "card");
        const rec = { id: f.id || "a" + C.newId().slice(-6), name, type: f.type, open: f.type === "card" ? -Math.abs(n) : n,
          ...(f.type === "card" ? { card: { close: f.card.close, due: f.card.due, from: others.some((x) => x.id === f.card.from) ? f.card.from : others[0]?.id || "" } } : {}) };
        s.close();
        commit({ ...data, accounts: a ? data.accounts.map((x) => (x.id === a.id ? rec : x)) : [...data.accounts, rec] });
        toast(a ? "改好了" : `新增了「${name}」`);
      }
    });
  });
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
    ${done.length ? `<details style="margin-top:16px"><summary class="small muted">已還清（${done.length}）</summary>${done.map(row).join("")}</details>` : ""}
    ${data.prefs.friend ? "" : `<p class="small muted" style="margin-top:24px">和朋友用 LINE 群組記帳？<button class="btn text small" data-goto="friends" style="padding:0">和 LINE 記帳群組連動</button></p>`}`;
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
  return `${subHead("常用捷徑")}<p class="small muted">常記的東西（早餐 60、捷運…）存成捷徑，首頁一點就記好；沒寫金額的會跳出鍵盤只打金額。記一筆、記移動（例如提款 1000）時也可以勾「存成常用捷徑」。</p>
    <div class="row-btns"><button class="btn primary grow" data-newsc>${ico("plus")}新增捷徑</button></div>
    ${data.shortcuts.map((sc) => sc.type === "move" ? `<div class="list-row"><span class="cat-ico">${ico("repeat")}</span><span class="t">${esc(scLabel(sc))}<small>移動・${esc(C.moveLabel(data, sc))}${sc.amt ? `・${C.money(sc.amt)}` : "・每次打金額"}</small></span>
      <button class="icon-btn" data-delsc="${esc(sc.id)}" aria-label="刪除">${ico("trash")}</button></div>` : `<div class="list-row"><span class="cat-ico">${ico(catIcon(sc.type, sc.cat))}</span><span class="t">${esc(C.shortcutLabel(sc))}<small>${esc([sc.cat, sc.sub, sc.pay].filter(Boolean).join("・"))}${sc.amt ? `・${C.money(sc.amt)}` : "・每次打金額"}</small></span>
      <button class="icon-btn" data-editsc="${esc(sc.id)}" aria-label="修改">${ico("pencil")}</button></div>`).join("") || `<div class="empty">還沒有捷徑。</div>`}`;
}

// ---- 扇形選單
function pgWheel() {
  const box = (kind, name, on, i) => `<label class="check"><input type="checkbox" data-w${kind}="${esc(name)}"${on ? " checked" : ""}> ${esc(name)}${on ? ` <span class="small muted">（第 ${i + 1} 格）</span>` : ""}</label>`;
  return `${subHead("扇形選單")}<p class="small muted">按住下面的 ＋ 往上劃：先經過內圈選付款方式（不劃過就用上次的），停在外圈的分類放手，再打金額就記好了。順序照「分類」頁的排序。</p>
    <div class="sec-h"><span>內圈：付款方式（最多 ${C.WHEEL_MAX.pays} 個）</span></div>${data.pays.map((p) => box("pay", p, data.wheel.pays.includes(p), data.wheel.pays.indexOf(p))).join("")}
    ${friendOn() ? `<div class="sec-h"><span>內圈：朋友（最多 ${FRIEND_WHEEL_MAX} 個）</span></div><p class="small muted" style="margin:0">劃過「某人付」再停在分類放手，就記成「我欠那個人」，會同步到 LINE 群組。</p>
      ${friendPeople().map((m) => { const k = m.g + "|" + m.uid, on = wheelFriends().some((x) => x.g + "|" + x.uid === k); return `<label class="check"><input type="checkbox" data-wfr="${esc(k)}"${on ? " checked" : ""}> ${esc(fname(m.uid, m.g))}付 <span class="small muted">（${esc(fr().groups.find((g) => g.id === m.g)?.name || "")}）</span></label>`; }).join("")}` : ""}
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
  if (d.moveId) { const m = data.moves.find((x) => x.id === d.moveId); if (m) moveForm(m); return; }
  if (d.move !== undefined) return moveForm();
  if (d.paycard) { const a = data.accounts.find((x) => x.id === d.paycard), b = a && C.cardBill(data, a, today()); if (b) moveForm(null, { from: a.card.from, to: a.id, amt: b.amount, note: "繳卡費" }); return; }
  if (d.recon) { const a = data.accounts.find((x) => x.id === d.recon); if (a) reconcile(a); return; }
  if (d.acct) return acctForm(data.accounts.find((x) => x.id === d.acct));
  if (d.newacct !== undefined) return acctForm();
  if (d.preset !== undefined) { if (await sure("快速設定帳戶？", "建立「郵局、錢包、信用卡」三個帳戶：現金從錢包扣、信用卡記在卡上、其他付款方式從郵局扣，收入存進郵局。名稱和金額之後都可以改。", "設定")) { commit(C.presetAccounts(data)); toast("設好了，點帳戶填現在有多少錢"); } return; }
  if (d.delsc) { if (await sure("刪除這個捷徑？", "", "刪除", "danger")) commit({ ...data, shortcuts: data.shortcuts.filter((x) => x.id !== d.delsc) }); return; }
  if (d.sc) { const sc = data.shortcuts.find((x) => x.id === d.sc); if (sc) useShortcut(sc); return; }
  if (d.goto) return go("more", d.goto);
  if (d.back !== undefined) return history.back();
  if (d.stype) { ui.statType = d.stype; ui.openCat = null; return render(); }
  if (d.ocat !== undefined) { ui.openCat = ui.openCat === d.ocat ? null : d.ocat; return render(); }
  if (d.cal) { ui.calMonth = C.addMonths(ui.calMonth, +d.cal); ui.calDay = ""; return render(); }
  if (d.day) { ui.calDay = ui.calDay === d.day ? "" : d.day; return render(); }
  if (d.addday) return openForm(null, { date: d.addday });
  // 朋友分帳
  if (d.fsync !== undefined) return syncFriends();
  if (d.fg) { ui.fg = d.fg; history.pushState({ tab: "more", more: "friends", fg: d.fg }, ""); render(); return window.scrollTo(0, 0); }
  if (d.fadd !== undefined) return friendForm("exp");
  if (d.frepay !== undefined) return friendForm("pay");
  if (d.fe) return friendEntry(d.fe);
  if (d.fcode !== undefined) { const v = await ask("輸入連動碼", "私訊 LINE 記帳機器人「連動碼」，把它回的 8 個字打在這裡（例如 K7P2-9QXA），大小寫都可以。", [["no", "取消"], ["ok", "連上", "primary"]], ""); if (v) linkFriend(C.parseCode(v)); return; }
  if (d.fnew !== undefined) return newGroupHelp();
  if (d.fpaste !== undefined) { const v = await ask("貼上連動連結", "私訊 LINE 記帳機器人「連動碼」，把它回的連結整段貼在這裡。", [["no", "取消"], ["ok", "連上", "primary"]], ""); if (v) linkFriend(C.parseLink(v)); return; }
  if (d.funlink !== undefined) {
    if (!(await sure("解除連動？", "這台手機就不會再看到朋友帳。已經算進支出的那幾筆會留著（可以自己刪）。LINE 群組裡的帳不受影響。", "解除", "danger"))) return;
    const { friends, friendQ, ...rest } = data;
    commit({ ...rest, prefs: (({ friend, ...p }) => p)(data.prefs) }); toast("解除連動了"); return go("more");
  }
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
  if (d.csv !== undefined) { const ok = await download(`記帳-${today().replace(/-/g, "")}.csv`, C.toCSV(data.items, data.moves, aName), "text/csv"); if (ok) toast("CSV 匯出了，可以用 Excel 或 Google 試算表打開"); return; }
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
  if (t.dataset.wfr !== undefined) {
    let cur = wheelFriends().map((m) => m.g + "|" + m.uid).filter((k) => k !== t.dataset.wfr);
    if (t.checked) { if (cur.length >= FRIEND_WHEEL_MAX) { t.checked = false; return toast(`最多 ${FRIEND_WHEEL_MAX} 個，先取消一個`); } cur.push(t.dataset.wfr); }
    lsSet("ledger-friend-wheel", cur); return render();
  }
  if (t.dataset.payacct !== undefined) return commit({ ...data, payAcct: { ...data.payAcct, [t.dataset.payacct]: t.value } });
  if (t.id === "in-acct") return commit({ ...data, prefs: { ...data.prefs, inAcct: t.value } });
  if (t.id === "out-acct") return commit({ ...data, prefs: { ...data.prefs, outAcct: t.value } });
  if (t.id === "f-auto") { commit({ ...data, prefs: { ...data.prefs, friend: { ...data.prefs.friend, auto: t.checked } } }); if (t.checked) syncFriends(); return; }
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
  const link = /#link=/.test(location.hash) ? C.parseLink(location.hash) : undefined;     // 從 LINE 機器人的連動連結打開
  if (link !== undefined) { history.replaceState({ tab: "home" }, "", location.pathname + location.search); linkFriend(link); }
  else if (data.prefs.friend) syncFriends({ quiet: true });
  try { navigator.storage?.persist?.(); } catch { /* 不支援 */ }
  addEventListener("ledger:installable", () => { if (ui.more === "install") render(); });
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    // 有新版：新的 sw 接手時自動重新整理一次（沒有在記帳的話），重開 App 一次就是新版
    const hadSW = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadSW || reloaded || sheets.length) return;
      reloaded = true; location.reload();
    });
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((r) => r.update()).catch(() => {});
  }
  // 隔天打開沒有重新整理：回到 App 時換成今天這一期、補記固定收支
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (data.prefs.friend && Date.now() - fst.lastTry > 60000) syncFriends({ quiet: true });
    const r = C.applyRecurring(data, today());
    if (r.added.length) { commit(r.data); toast(`自動記了 ${r.added.length} 筆固定收支`); }
  });
}
start();
