// 家庭記帳：純邏輯（不碰畫面、不碰儲存）。app.js 用，tests/core.test.mjs 測。
// 資料格式見 README.md「資料」一節。金額一律是正整數（台幣），支出、收入用 type 分。

// ---------------------------------------------------------------- 預設值
export const DEFAULT_CATS = {
  out: [
    { name: "餐飲", icon: "utensils", subs: ["早餐", "午餐", "晚餐", "飲料", "點心"] },
    { name: "交通", icon: "bus", subs: ["捷運公車", "加油", "停車", "計程車"] },
    { name: "日用品", icon: "shopping-cart", subs: [] },
    { name: "購物", icon: "shopping-bag", subs: ["衣服", "3C", "禮物"] },
    { name: "居家", icon: "house", subs: ["房租", "水電瓦斯", "網路電話"] },
    { name: "娛樂", icon: "gamepad", subs: ["電影", "旅遊", "訂閱"] },
    { name: "醫療", icon: "heart-pulse", subs: [] },
    { name: "教育", icon: "book-open", subs: ["學費", "書籍", "補習"] },
    { name: "其他", icon: "ellipsis", subs: [] },
  ],
  in: [
    { name: "薪水", icon: "wallet", subs: [] },
    { name: "獎金", icon: "gift", subs: [] },
    { name: "零用錢", icon: "coins", subs: [] },
    { name: "投資", icon: "trending-up", subs: [] },
    { name: "其他", icon: "ellipsis", subs: [] },
  ],
};
export const DEFAULT_PAYS = ["現金", "信用卡", "行動支付"];
export const WHEEL_MAX = { cats: 8, pays: 4 };

export function emptyData() {
  const cats = { out: DEFAULT_CATS.out.map((c) => ({ ...c, subs: [...c.subs] })), in: DEFAULT_CATS.in.map((c) => ({ ...c, subs: [...c.subs] })) };
  return {
    v: 1, items: [], cats, pays: [...DEFAULT_PAYS], shortcuts: [],
    wheel: { cats: cats.out.slice(0, 8).map((c) => c.name), pays: [...DEFAULT_PAYS] },
    budget: { total: 0, cats: {} }, recurring: [], debts: [], goals: [],
    prefs: { theme: "terracotta", mode: "auto", monthStart: 1, lastPay: "現金", bg: "paper", pattern: "grid", keyH: 52 }, lastBackup: 0,
  };
}

// ---------------------------------------------------------------- 日期、期間（每月起算日）
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parts = (date) => date.split("-").map(Number);
export function addMonths(month, n) {
  const [y, m] = month.split("-").map(Number), d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
export function addDays(date, n) { const [y, m, d] = parts(date); return ymd(new Date(y, m - 1, d + n)); }
export const daysBetween = (a, b) => { const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5); };
const WD = ["日", "一", "二", "三", "四", "五", "六"];
export function dayLabel(date, today = ymd()) {
  const [y, m, d] = parts(date), wd = WD[new Date(y, m - 1, d).getDay()];
  const rel = date === today ? "今天・" : date === addDays(today, -1) ? "昨天・" : "";
  return `${rel}${m}月${d}日（${wd}）`;
}

// 期間：起算日 s（1–28）。日期在 s 號以後屬於「這個月開始」的那期，s 號以前屬於上個月開始的那期。
// 期間的代號＝開始的那個月 "YYYY-MM"
export function periodOf(date, s = 1) {
  const [y, m, d] = parts(date), key = `${y}-${pad(m)}`;
  return d >= s ? key : addMonths(key, -1);
}
export function periodRange(key, s = 1) {
  const start = `${key}-${pad(s)}`, end = addDays(`${addMonths(key, 1)}-${pad(s)}`, -1);
  return [start, end];
}
export function periodLabel(key, s = 1) {
  const [y, m] = key.split("-").map(Number);
  if (s === 1) return `${y} 年 ${m} 月`;
  const [a, b] = periodRange(key, s), [, am, ad] = parts(a), [, bm, bd] = parts(b);
  return `${am}/${ad} – ${bm}/${bd}`;
}
export const inPeriod = (date, key, s = 1) => periodOf(date, s) === key;

// ---------------------------------------------------------------- 金額
export function money(n) {
  const v = Math.round(Math.abs(n));
  return (n < 0 ? "−" : "") + v.toLocaleString("en-US");
}
// 金額欄：可以打 120+35-5（記帳時常常要加總）。只收整數；結果要 > 0，不然回傳 null
export function evalAmount(s) {
  const t = String(s ?? "").replace(/[,\s，]/g, "").replace(/[＋]/g, "+").replace(/[－−]/g, "-");
  if (!/^\d+([+-]\d+)*$/.test(t)) return null;
  const v = t.match(/[+-]?\d+/g).reduce((a, x) => a + Number(x), 0);
  return v > 0 && v < 1e10 ? v : null;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------------------------------------------------------------- 清單、加總、統計
export const sortItems = (items) => [...items].sort((a, b) => (a.date === b.date ? b.t - a.t : a.date < b.date ? 1 : -1));
export const periodItems = (items, key, s = 1) => sortItems(items.filter((x) => inPeriod(x.date, key, s)));

export function totals(items) {
  let out = 0, inc = 0;
  for (const x of items) (x.type === "in" ? (inc += x.amt) : (out += x.amt));
  return { out, in: inc, net: inc - out };
}
export function byDay(items) {
  const map = new Map();
  for (const x of sortItems(items)) { if (!map.has(x.date)) map.set(x.date, []); map.get(x.date).push(x); }
  return [...map].map(([date, list]) => ({ date, items: list, ...totals(list) }));
}
// 依某個欄位加總（cat、sub、pay），大到小；share＝佔總額比例
function groupSum(list, key) {
  const sum = new Map();
  for (const x of list) { const k = x[key] || ""; sum.set(k, (sum.get(k) || 0) + x.amt); }
  const total = [...sum.values()].reduce((a, b) => a + b, 0);
  return [...sum].map(([name, amt]) => ({ name, amt, share: total ? amt / total : 0 })).sort((a, b) => b.amt - a.amt);
}
export const byCategory = (items, type) => groupSum(items.filter((x) => x.type === type), "cat");
export const bySub = (items, type, cat) => groupSum(items.filter((x) => x.type === type && x.cat === cat), "sub");
export const byPay = (items, type = "out") => groupSum(items.filter((x) => x.type === type), "pay");

// 最近 n 期（含 key）每期的支出、收入，舊到新
export function lastPeriods(items, key, s = 1, n = 6) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const k = addMonths(key, -i); out.push({ key: k, ...totals(items.filter((x) => inPeriod(x.date, k, s))) }); }
  return out;
}
// 月曆：某個自然月每天的支出、收入 { "YYYY-MM-DD": { out, in } }
export function dayTotals(items, month) {
  const m = {};
  for (const x of items) if (x.date.startsWith(month)) { const d = (m[x.date] ||= { out: 0, in: 0 }); x.type === "in" ? (d.in += x.amt) : (d.out += x.amt); }
  return m;
}

// ---------------------------------------------------------------- 預算
// 這期花了多少、還剩多少、平均每天還能花多少（today 在這期裡才算）；各分類預算用了幾 %
export function budgetStatus(data, key, today = ymd()) {
  const s = data.prefs.monthStart, list = periodItems(data.items, key, s), spent = totals(list).out;
  const total = data.budget.total || 0, [start, end] = periodRange(key, s);
  const left = total - spent, inside = today >= start && today <= end;
  const daysLeft = inside ? daysBetween(today, end) + 1 : 0;
  const cats = Object.entries(data.budget.cats || {}).filter(([, b]) => b > 0).map(([cat, b]) => {
    const used = list.filter((x) => x.type === "out" && x.cat === cat).reduce((a, x) => a + x.amt, 0);
    return { cat, budget: b, spent: used, left: b - used, ratio: used / b, over: used > b };
  });
  return { total, spent, left, over: total > 0 && spent > total, daysLeft, perDay: total > 0 && daysLeft ? Math.floor(Math.max(0, left) / daysLeft) : null, cats };
}

// ---------------------------------------------------------------- 固定收支：打開 App 時補記到期的
// 每一筆固定收支每個月 day 號記一次；id 用 rec-<固定收支id>-<YYYY-MM>，所以就算重跑也不會重複
export function applyRecurring(data, today = ymd()) {
  const have = new Set(data.items.map((x) => x.id)), add = [], thisMonth = today.slice(0, 7);
  const recurring = data.recurring.map((r) => {
    if (r.off) return r;
    let m = r.last ? addMonths(r.last, 1) : r.from, last = r.last;
    for (let guard = 0; m <= thisMonth && guard < 120; m = addMonths(m, 1), guard++) {
      const date = `${m}-${pad(Math.min(28, Math.max(1, r.day)))}`;
      if (date > today) break;
      const id = `rec-${r.id}-${m}`;
      if (!have.has(id)) add.push({ id, type: r.type, amt: r.amt, cat: r.cat, sub: r.sub || "", pay: r.pay || "", date, note: r.note || "", t: Date.now(), rec: r.id });
      last = m;
    }
    return last === r.last ? r : { ...r, last };
  });
  return { data: add.length || recurring.some((r, i) => r !== data.recurring[i]) ? { ...data, items: [...data.items, ...add], recurring } : data, added: add };
}

// ---------------------------------------------------------------- 借入借出、存錢目標（都不算進收支）
export const debtLeft = (d) => Math.max(0, d.amt - (d.pays || []).reduce((a, p) => a + p.amt, 0));
export function debtSummary(debts) {
  let owedToMe = 0, iOwe = 0;
  for (const d of debts) if (!d.done) (d.dir === "lend" ? (owedToMe += debtLeft(d)) : (iOwe += debtLeft(d)));
  return { owedToMe, iOwe };
}
export const goalSaved = (g) => (g.deps || []).reduce((a, x) => a + x.amt, 0);
export const goalProgress = (g) => (g.target > 0 ? Math.min(1, goalSaved(g) / g.target) : 0);

// ---------------------------------------------------------------- 搜尋、捷徑
// 搜尋：備註、分類、二級分類、付款方式有包含這些字；打數字就找金額一樣的
export function searchItems(items, q) {
  const words = String(q || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return sortItems(items.filter((x) => words.every((w) => (/^\d+$/.test(w) ? String(x.amt) === w : [x.note, x.cat, x.sub, x.pay].some((f) => String(f || "").toLowerCase().includes(w))))));
}
export const shortcutLabel = (sc) => sc.label || sc.sub || sc.cat;
export function itemFromShortcut(sc, amt, date = ymd()) {
  return { id: newId(), type: sc.type, amt, cat: sc.cat, sub: sc.sub || "", pay: sc.pay || "", date, note: sc.note || "", t: Date.now() };
}

// ---------------------------------------------------------------- 長按一劃的扇形選單：手指在哪一格
// (dx, dy)：手指相對按鈕中心（螢幕座標，往上 dy 是負的）。半圓在按鈕上方，從左（180°）到右（0°）。
// r0 以內＝取消（中間的 ✕）；r0～r1＝內圈付款方式；r1～r2（＋slack）＝外圈分類；其他＝不在選單上（null）
export const WHEEL_R = { r0: 44, r1: 108, r2: 188, slack: 48 };
export function wheelHit(dx, dy, nPays, nCats, R = WHEEL_R) {
  const r = Math.hypot(dx, dy);
  if (r < R.r0) return { ring: "cancel" };
  let ang = (Math.atan2(-dy, dx) * 180) / Math.PI;          // 右邊 0°、上面 90°、左邊 180°
  if (ang < -15 || ang > 195) return null;                  // 按鈕下面：不在選單上
  ang = Math.min(180, Math.max(0, ang));
  const seg = (n) => Math.min(n - 1, Math.floor(((180 - ang) / 180) * n));   // 從左邊數第幾格
  if (r < R.r1) return nPays ? { ring: "pay", idx: seg(nPays) } : null;
  if (r < R.r2 + R.slack) return nCats ? { ring: "cat", idx: seg(nCats) } : null;
  return null;
}
// 畫扇形用：第 i 格（共 n 格）從幾度到幾度（左到右，SVG 角度：0° 在右、逆時針往上）
export function wheelSeg(i, n) { const a0 = 180 - (i * 180) / n, a1 = 180 - ((i + 1) * 180) / n; return [a0, a1]; }

// ---------------------------------------------------------------- 分類、付款方式的修改（紀錄、捷徑、固定收支、扇形、預算都跟著改）
const catIdx = (data, type, name) => data.cats[type].findIndex((c) => c.name === name);
export function addCategory(data, type, name, icon = "ellipsis") {
  name = String(name).trim().slice(0, 12);
  if (!name || catIdx(data, type, name) >= 0) return data;
  const list = [...data.cats[type]], other = list.findIndex((c) => c.name === "其他");
  list.splice(other >= 0 ? other : list.length, 0, { name, icon, subs: [] });   // 放在「其他」前面
  return { ...data, cats: { ...data.cats, [type]: list } };
}
export function renameCategory(data, type, from, to) {
  to = String(to).trim().slice(0, 12);
  if (!to || to === from || catIdx(data, type, from) < 0) return data;
  const merge = catIdx(data, type, to) >= 0;
  const fix = (x) => (x.type === type && x.cat === from ? { ...x, cat: to } : x);
  let cats = data.cats[type].map((c) => (c.name === from ? { ...c, name: to } : c));
  if (merge) {                       // 新名稱已經有了：合併，二級分類也合在一起
    const a = data.cats[type].find((c) => c.name === from), b = data.cats[type].find((c) => c.name === to);
    cats = data.cats[type].filter((c) => c.name !== from).map((c) => (c.name === to ? { ...c, subs: [...new Set([...b.subs, ...a.subs])] } : c));
  }
  const budgetCats = { ...data.budget.cats };
  if (type === "out" && from in budgetCats) { budgetCats[to] = (budgetCats[to] || 0) + budgetCats[from]; delete budgetCats[from]; }
  return {
    ...data, cats: { ...data.cats, [type]: cats }, items: data.items.map(fix), shortcuts: data.shortcuts.map(fix), recurring: data.recurring.map(fix),
    wheel: type === "out" ? { ...data.wheel, cats: [...new Set(data.wheel.cats.map((c) => (c === from ? to : c)))] } : data.wheel,
    budget: { ...data.budget, cats: budgetCats },
  };
}
// 刪掉分類：用到它的紀錄、捷徑、固定收支改成「其他」（沒有「其他」就補上）
export function removeCategory(data, type, name) {
  if (name === "其他") return data;
  let cats = data.cats[type].filter((c) => c.name !== name);
  if (!cats.some((c) => c.name === "其他")) cats = [...cats, { name: "其他", icon: "ellipsis", subs: [] }];
  const fix = (x) => (x.type === type && x.cat === name ? { ...x, cat: "其他", sub: "" } : x);
  const budgetCats = { ...data.budget.cats }; if (type === "out") delete budgetCats[name];
  return {
    ...data, cats: { ...data.cats, [type]: cats }, items: data.items.map(fix), shortcuts: data.shortcuts.map(fix), recurring: data.recurring.map(fix),
    wheel: type === "out" ? { ...data.wheel, cats: data.wheel.cats.filter((c) => c !== name) } : data.wheel, budget: { ...data.budget, cats: budgetCats },
  };
}
export function moveCategory(data, type, name, dir) {
  const list = [...data.cats[type]], i = list.findIndex((c) => c.name === name), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return data;
  [list[i], list[j]] = [list[j], list[i]];
  return { ...data, cats: { ...data.cats, [type]: list } };
}
export function setSubs(data, type, cat, subs) {
  const clean = [...new Set(subs.map((s) => String(s).trim().slice(0, 12)).filter(Boolean))];
  const removed = new Set((data.cats[type].find((c) => c.name === cat)?.subs || []).filter((s) => !clean.includes(s)));
  const fix = (x) => (x.type === type && x.cat === cat && removed.has(x.sub) ? { ...x, sub: "" } : x);
  return { ...data, cats: { ...data.cats, [type]: data.cats[type].map((c) => (c.name === cat ? { ...c, subs: clean } : c)) }, items: data.items.map(fix), shortcuts: data.shortcuts.map(fix), recurring: data.recurring.map(fix) };
}
export function renamePay(data, from, to) {
  to = String(to).trim().slice(0, 12);
  if (!to || to === from) return data;
  const fix = (x) => (x.pay === from ? { ...x, pay: to } : x);
  return {
    ...data, pays: [...new Set(data.pays.map((p) => (p === from ? to : p)))], items: data.items.map(fix), shortcuts: data.shortcuts.map(fix), recurring: data.recurring.map(fix),
    wheel: { ...data.wheel, pays: [...new Set(data.wheel.pays.map((p) => (p === from ? to : p)))] }, prefs: { ...data.prefs, lastPay: data.prefs.lastPay === from ? to : data.prefs.lastPay },
  };
}
// 刪付款方式：以前的紀錄照舊寫著（只是選單裡沒有了）
export function removePay(data, name) {
  return { ...data, pays: data.pays.filter((p) => p !== name), wheel: { ...data.wheel, pays: data.wheel.pays.filter((p) => p !== name) } };
}

// ---------------------------------------------------------------- 備份：讀進來的資料檢查、修好；還原時合併
const str = (v, n) => String(v ?? "").slice(0, n);
const int = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : 0; };
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
const isMonth = (v) => /^\d{4}-\d{2}$/.test(String(v));
export function cleanData(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) return null;
  const base = emptyData();
  const items = [];
  for (const x of raw.items) {
    if (!x || (x.type !== "out" && x.type !== "in") || !(int(x.amt) > 0) || !isDate(x.date)) continue;
    items.push({ id: str(x.id || newId(), 60), type: x.type, amt: int(x.amt), cat: str(x.cat || "其他", 12), sub: str(x.sub, 12), pay: str(x.pay, 12),
      date: x.date, note: str(x.note, 200), t: Number(x.t) || 0, ...(x.rec ? { rec: str(x.rec, 60) } : {}) });
  }
  const cats = {};
  for (const k of ["out", "in"]) {
    const src = Array.isArray(raw.cats?.[k]) ? raw.cats[k] : base.cats[k];
    const list = src.map((c) => (typeof c === "string" ? { name: c, icon: base.cats[k].find((d) => d.name === c)?.icon || "ellipsis", subs: [] }   // 舊格式：只有名字
      : { name: str(c?.name, 12), icon: str(c?.icon || "ellipsis", 30), subs: Array.isArray(c?.subs) ? [...new Set(c.subs.map((s) => str(s, 12)).filter(Boolean))] : [] })).filter((c) => c.name);
    for (const x of items) if (x.type === k && !list.some((c) => c.name === x.cat)) list.push({ name: x.cat, icon: "ellipsis", subs: [] });   // 紀錄用到、清單沒有的分類補回來
    cats[k] = list.filter((c, i) => list.findIndex((d) => d.name === c.name) === i);
  }
  const pays = Array.isArray(raw.pays) ? [...new Set(raw.pays.map((p) => str(p, 12)).filter(Boolean))] : base.pays;
  const okType = (x) => x && (x.type === "out" || x.type === "in");
  const shortcuts = (Array.isArray(raw.shortcuts) ? raw.shortcuts : []).filter(okType).map((s) => ({ id: str(s.id || newId(), 60), label: str(s.label, 12), type: s.type, cat: str(s.cat, 12), sub: str(s.sub, 12), pay: str(s.pay, 12), amt: int(s.amt) > 0 ? int(s.amt) : 0, note: str(s.note, 200) }));
  const recurring = (Array.isArray(raw.recurring) ? raw.recurring : []).filter((r) => okType(r) && int(r.amt) > 0 && isMonth(r.from)).map((r) => ({ id: str(r.id || newId(), 60), type: r.type, amt: int(r.amt), cat: str(r.cat, 12), sub: str(r.sub, 12), pay: str(r.pay, 12),
    note: str(r.note, 200), day: Math.min(28, Math.max(1, int(r.day) || 1)), from: r.from, last: isMonth(r.last) ? r.last : "", off: !!r.off }));
  const flows = (list) => (Array.isArray(list) ? list : []).filter((p) => int(p?.amt) > 0 && isDate(p.date)).map((p) => ({ amt: int(p.amt), date: p.date }));
  const debts = (Array.isArray(raw.debts) ? raw.debts : []).filter((d) => d && (d.dir === "lend" || d.dir === "borrow") && int(d.amt) > 0).map((d) => ({ id: str(d.id || newId(), 60), dir: d.dir, who: str(d.who, 20), amt: int(d.amt), date: isDate(d.date) ? d.date : ymd(), note: str(d.note, 200), pays: flows(d.pays), done: !!d.done }));
  const goals = (Array.isArray(raw.goals) ? raw.goals : []).filter((g) => g && int(g.target) > 0).map((g) => ({ id: str(g.id || newId(), 60), name: str(g.name, 20), target: int(g.target), deps: flows(g.deps), done: !!g.done }));
  const outNames = cats.out.map((c) => c.name);
  const wheelCats = (Array.isArray(raw.wheel?.cats) ? raw.wheel.cats : outNames).filter((c) => outNames.includes(c)).slice(0, WHEEL_MAX.cats);
  const wheelPays = (Array.isArray(raw.wheel?.pays) ? raw.wheel.pays : pays).filter((p) => pays.includes(p)).slice(0, WHEEL_MAX.pays);
  const bc = {};
  for (const [k, v] of Object.entries(raw.budget?.cats || {})) if (outNames.includes(k) && int(v) > 0) bc[k] = int(v);
  const p = raw.prefs || {};
  return {
    v: 1, items, cats, pays, shortcuts, wheel: { cats: wheelCats, pays: wheelPays }, budget: { total: Math.max(0, int(raw.budget?.total)), cats: bc }, recurring, debts, goals,
    prefs: { theme: PALETTES[p.theme] ? p.theme : "terracotta", mode: ["auto", "light", "dark"].includes(p.mode) ? p.mode : "auto",
      monthStart: Math.min(28, Math.max(1, int(p.monthStart) || 1)), lastPay: pays.includes(p.lastPay) ? p.lastPay : pays[0] || "",
      bg: BACKGROUNDS[p.bg] ? p.bg : "paper", pattern: PATTERNS[p.pattern] ? p.pattern : "grid", keyH: clampKeyH(p.keyH),
      ...(p.friend && parseLink("#link=" + encodeURIComponent(String(p.friend.url || "")) + "~" + String(p.friend.key || "")) ? { friend: { url: String(p.friend.url), key: String(p.friend.key), auto: p.friend.auto !== false } } : {}) },
    lastBackup: Number(raw.lastBackup) || 0,
    ...(cleanFriends(raw.friends) ? { friends: cleanFriends(raw.friends) } : {}),
    ...(Array.isArray(raw.friendQ) ? { friendQ: raw.friendQ.filter((q) => q && (q.op === "add" || q.op === "del")).slice(0, 200) } : {}),
  };
}
// 還原備份時「合併」：同一個 id 以備份為準，其他都留著；分類、付款方式取聯集
export function mergeData(cur, add) {
  const byId = (a, b) => { const m = new Map(a.map((x) => [x.id, x])); for (const x of b) m.set(x.id, x); return [...m.values()]; };
  const cats = {};
  for (const k of ["out", "in"]) { const list = [...cur.cats[k]]; for (const c of add.cats[k]) { const i = list.findIndex((d) => d.name === c.name); if (i < 0) list.push(c); else list[i] = { ...list[i], subs: [...new Set([...list[i].subs, ...c.subs])] }; } cats[k] = list; }
  return { ...cur, items: byId(cur.items, add.items), cats, pays: [...new Set([...cur.pays, ...add.pays])], shortcuts: byId(cur.shortcuts, add.shortcuts),
    recurring: byId(cur.recurring, add.recurring), debts: byId(cur.debts, add.debts), goals: byId(cur.goals, add.goals) };
}

// 匯出成 Excel 打得開的 CSV（前面加 BOM，中文才不會變亂碼）
export function toCSV(items) {
  const q = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const rows = [["日期", "收支", "分類", "細項", "付款方式", "金額", "備註"],
    ...sortItems(items).reverse().map((x) => [x.date, x.type === "in" ? "收入" : "支出", x.cat, x.sub || "", x.pay || "", String(x.amt), x.note || ""])];
  return "﻿" + rows.map((r) => r.map((c) => q(String(c))).join(",")).join("\r\n");
}
// 提醒備份：有 10 筆以上、而且超過 30 天沒匯出（從來沒有也算）
export const needBackup = (data, now = Date.now()) => data.items.length >= 10 && now - (data.lastBackup || 0) > 30 * 864e5;

// ---------------------------------------------------------------- 主題顏色（只換主色那幾個變數；其他照設計規範）
// light／dark 各一組；tests 檢查：主色上的字、主色文字對紙色與淺底的對比都 ≥ 4.5
export const PALETTES = {
  terracotta: { name: "陶土橘",
    light: { accent: "#B3552A", "accent-strong": "#9C4622", "on-accent": "#FFFFFF", "accent-ink": "#97431E", "accent-soft": "#F5E1D5" },
    dark: { accent: "#E58A55", "accent-strong": "#EC9C6C", "on-accent": "#1F1B17", "accent-ink": "#F0A577", "accent-soft": "#3A2519" } },
  honey: { name: "蜂蜜黃",
    light: { accent: "#E2A43C", "accent-strong": "#CF9128", "on-accent": "#1F1B17", "accent-ink": "#7A4F08", "accent-soft": "#F7E8C6" },
    dark: { accent: "#E6B05A", "accent-strong": "#EDBD6F", "on-accent": "#1F1B17", "accent-ink": "#F0C27A", "accent-soft": "#3A2F1A" } },
  teal: { name: "湖水綠",
    light: { accent: "#1F7A6E", "accent-strong": "#18655B", "on-accent": "#FFFFFF", "accent-ink": "#175F56", "accent-soft": "#D6ECE7" },
    dark: { accent: "#5FC1B1", "accent-strong": "#79CDBF", "on-accent": "#12201D", "accent-ink": "#7FD3C5", "accent-soft": "#17302B" } },
  indigo: { name: "靛藍",
    light: { accent: "#3F5BA9", "accent-strong": "#344C8F", "on-accent": "#FFFFFF", "accent-ink": "#34498A", "accent-soft": "#DFE5F4" },
    dark: { accent: "#8EA6E8", "accent-strong": "#A3B6ED", "on-accent": "#141A2B", "accent-ink": "#A9BBEF", "accent-soft": "#1E2640" } },
  berry: { name: "莓果紅",
    light: { accent: "#A23B5C", "accent-strong": "#8A314E", "on-accent": "#FFFFFF", "accent-ink": "#88304D", "accent-soft": "#F4DDE4" },
    dark: { accent: "#E58AA7", "accent-strong": "#EC9FB7", "on-accent": "#2A141B", "accent-ink": "#F0A3BB", "accent-soft": "#3A1D27" } },
};
// 相對亮度與對比（WCAG）
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const SURFACE = { light: "#FCFCFA", dark: "#1F1D1A" };
export const MUTED = { light: "#5E5850", dark: "#A8A196" };          // 次要文字（tokens 的 --muted），背景上要看得清楚

// 背景顏色（淺／深各一）與款式；tests 檢查次要文字、主色文字在背景上對比 ≥ 4.5
export const BACKGROUNDS = {
  paper: { name: "米白", light: "#F5F4F0", dark: "#171614" },
  white: { name: "白", light: "#FBFBFA", dark: "#121212" },
  sky: { name: "淡藍", light: "#EDF1F5", dark: "#141920" },
  mint: { name: "淡綠", light: "#EDF3EC", dark: "#141A15" },
  cream: { name: "奶油黃", light: "#F7F2E3", dark: "#1B1812" },
  blush: { name: "淡粉", light: "#F7EEEC", dark: "#1D1616" },
};
export const PATTERNS = { grid: "方格", lines: "橫線", dots: "點點", plain: "素面" };
// 數字鍵盤每顆鍵的高度（px）：拖把手調整，範圍 36～76
export const KEY_H = { min: 36, max: 76, def: 52 };
export function clampKeyH(v) { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 ? Math.min(KEY_H.max, Math.max(KEY_H.min, n)) : KEY_H.def; }

// ---------------------------------------------------------------- 朋友分帳（LINE 記帳群組連動；算法和 gas/logic.js 一樣）
// 一筆朋友帳 entry：{ id, t, g, item, amt, payer, to:[uid], kind:"exp"|"pay", by, src, del }
//   exp：payer 先付，to 裡的人平分（零頭給 payer，payer 不在 to 就給第一個）；pay：payer 還 to[0] 錢。
export function parseLink(hash) {
  const m = /#link=([^~&]+)~([A-Za-z0-9]{8,64})/.exec(hash || "");
  if (!m) return null;
  let url; try { url = decodeURIComponent(m[1]); } catch { return null; }
  return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url) ? { url, key: m[2] } : null;
}
export function splitShares(amt, to, payer) {
  const out = {}, n = to.length;
  if (!n) return out;
  const base = Math.floor(amt / n);
  for (const u of to) out[u] = (out[u] || 0) + base;
  out[to.includes(payer) ? payer : to[0]] += amt - base * n;
  return out;
}
// 兩兩淨額 [{ from, to, amt }]（from 欠 to）
export function friendBalances(entries) {
  const net = {};
  for (const e of entries) {
    if (e.del) continue;
    for (const [u, v] of Object.entries(splitShares(e.amt, e.to, e.payer))) {
      if (u === e.payer || !v) continue;
      const [a, b] = u < e.payer ? [u, e.payer] : [e.payer, u];
      net[a + "|" + b] = (net[a + "|" + b] || 0) + (u === a ? v : -v);
    }
  }
  return Object.keys(net).sort().flatMap((k) => { const [a, b] = k.split("|"), v = net[k]; return v > 0 ? [{ from: a, to: b, amt: v }] : v < 0 ? [{ from: b, to: a, amt: -v }] : []; });
}
// 我在這筆帳裡自己花掉的錢（算進我的支出）；還款不算
export const friendShare = (e, uid) => (e.del || e.kind !== "exp" || !e.to.includes(uid) ? 0 : splitShares(e.amt, e.to, e.payer)[uid] || 0);

// 照項目名稱猜分類：只用帳本裡有的分類，猜不到就「其他」
const GUESS = [
  [/早餐|早午餐/, "餐飲", "早餐"], [/午餐|中餐|便當/, "餐飲", "午餐"], [/晚餐|宵夜|晚飯/, "餐飲", "晚餐"],
  [/飲料|咖啡|奶茶|鮮奶|紅茶|綠茶|果汁|手搖/, "餐飲", "飲料"], [/車票|車錢|捷運|公車|高鐵|火車|計程車|uber|油錢|停車/i, "交通", ""], 
  [/餐|吃|飯|麵|火鍋|滷味|小籠包|麥味登|點心|零食|雞排|壽司|披薩|漢堡/, "餐飲", ""], [/藥|看病|診所|醫/, "醫療", ""],
  [/電影|娃娃|遊戲|唱歌|ktv/i, "娛樂", ""], [/口紅|衣|鞋|保護殼|包包|禮物/, "購物", ""], [/顏料|書|文具|講義/, "教育", ""],
];
export function guessCat(item, cats) {
  const has = (n) => cats.out.some((c) => c.name === n);
  for (const [re, cat, sub] of GUESS) {
    if (!re.test(item) || !has(cat)) continue;
    const subs = cats.out.find((c) => c.name === cat).subs;
    return { cat, sub: sub && subs.includes(sub) ? sub : "" };
  }
  return { cat: has("其他") ? "其他" : cats.out[0]?.name || "其他", sub: "" };
}
// 同步後：把「我的那份」變成支出紀錄（id = "fr-" + entry.id）。已經有的只更新金額、日期，分類保留（可能被我改過）；
// 帳被刪掉、或不再有我的份 → 拿掉對應紀錄。
export function friendItems(items, sync, cats) {
  const me = sync.me, want = new Map();
  for (const e of sync.entries || []) { const v = friendShare(e, me); if (v > 0) want.set("fr-" + e.id, { e, v }); }
  const out = [], seen = new Set();
  for (const x of items) {
    if (!x.id.startsWith("fr-")) { out.push(x); continue; }
    const w = want.get(x.id);
    if (!w) continue;
    seen.add(x.id);
    out.push({ ...x, amt: w.v, date: ymd(new Date(w.e.t)) });
  }
  const added = [...want].filter(([id]) => !seen.has(id)).map(([id, { e, v }]) => ({ id, type: "out", amt: v, ...guessCat(e.item, cats), pay: "", date: ymd(new Date(e.t)), note: "朋友帳・" + e.item, t: e.t }));
  return { items: [...out, ...added], added: added.length, removed: items.length - out.length };
}
export function cleanFriends(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.me !== "string") return null;
  const s = (v, n) => String(v ?? "").slice(0, n);
  return {
    me: s(raw.me, 80), at: Number(raw.at) || 0,
    groups: (Array.isArray(raw.groups) ? raw.groups : []).map((g) => ({ id: s(g?.id, 80), name: s(g?.name, 40) })).filter((g) => g.id),
    members: (Array.isArray(raw.members) ? raw.members : []).map((m) => ({ uid: s(m?.uid, 80), g: s(m?.g, 80), name: s(m?.name, 40) })).filter((m) => m.uid && m.g),
    entries: (Array.isArray(raw.entries) ? raw.entries : []).filter((e) => e && Number(e.amt) > 0 && Array.isArray(e.to) && (e.kind === "exp" || e.kind === "pay"))
      .map((e) => ({ id: s(e.id, 60), t: Number(e.t) || 0, g: s(e.g, 80), item: s(e.item, 40), amt: Math.round(Number(e.amt)), payer: s(e.payer, 80), to: e.to.map((u) => s(u, 80)), kind: e.kind, by: s(e.by, 80), src: s(e.src, 8), del: !!e.del, ...(e.pending ? { pending: true } : {}) })),
  };
}
// 兩人之間從以前到現在的總帳：[{ a, b, ab(a 欠 b 合計), ba, apay(a 還 b 合計), bpay, net:{from,to,amt}|null }]，a<b
export function pairTotals(entries) {
  const m = {};
  const get = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], k = a + "|" + b; return (m[k] ||= { a, b, ab: 0, ba: 0, apay: 0, bpay: 0 }); };
  for (const e of entries) {
    if (e.del) continue;
    if (e.kind === "pay") { const p = get(e.payer, e.to[0]); if (e.payer === p.a) p.apay += e.amt; else p.bpay += e.amt; continue; }
    for (const [u, v] of Object.entries(splitShares(e.amt, e.to, e.payer))) {
      if (u === e.payer || !v) continue;
      const p = get(u, e.payer); if (u === p.a) p.ab += v; else p.ba += v;
    }
  }
  return Object.keys(m).sort().map((k) => {
    const p = m[k], v = p.ab - p.apay - (p.ba - p.bpay);
    return { ...p, net: v > 0 ? { from: p.a, to: p.b, amt: v } : v < 0 ? { from: p.b, to: p.a, amt: -v } : null };
  });
}
