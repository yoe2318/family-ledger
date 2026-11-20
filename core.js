// 家庭記帳：純邏輯（不碰畫面、不碰儲存）。app.js 用，tests/core.test.mjs 測。
// 資料格式見 README.md「資料」一節。金額一律是正整數（台幣），支出、收入用 type 分。

// ---------------------------------------------------------------- 預設值
export const DEFAULT_CATS = {
  out: [
    { name: "餐飲", icon: "utensils", subs: ["早餐", "午餐", "晚餐", "宵夜", "飲料", "點心"] },
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
export const ACCT_TYPES = { cash: "現金", bank: "銀行", card: "信用卡" };
const DEFAULT_ACCTS = [{ id: "cash", name: "錢包", type: "cash", open: 0 }];

export function emptyData() {
  const cats = { out: DEFAULT_CATS.out.map((c) => ({ ...c, subs: [...c.subs] })), in: DEFAULT_CATS.in.map((c) => ({ ...c, subs: [...c.subs] })) };
  return {
    v: 1, items: [], cats, pays: [...DEFAULT_PAYS], shortcuts: [],
    wheel: { cats: cats.out.slice(0, 8).map((c) => c.name), pays: [...DEFAULT_PAYS] },
    budget: { total: 0, cats: {} }, recurring: [], debts: [], goals: [],
    accounts: DEFAULT_ACCTS.map((a) => ({ ...a })), payAcct: {}, moves: [], shops: [],
    prefs: { theme: "terracotta", mode: "auto", monthStart: 1, lastPay: "現金", bg: "paper", pattern: "grid", keyH: 52, inAcct: "cash", outAcct: "cash", style: "notebook", font: "sans", radius: "m", bgImg: false, veil: 45, fabImg: false, fabPlus: true }, lastBackup: 0,
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
// 細項統計：沒填明細＝整筆算在 x.sub（多選時是「早餐＋午餐」這個組合）；明細有選細項的列，照各列金額分過去，剩下的算 x.sub
export function bySub(items, type, cat) {
  const parts = [];
  for (const x of items) {
    if (x.type !== type || x.cat !== cat) continue;
    const ls = (x.lines || []).filter((l) => l.sub && l.amt > 0);
    let rest = x.amt;
    for (const l of ls) { const a = Math.min(l.amt, rest); if (a > 0) { parts.push({ sub: l.sub, amt: a }); rest -= a; } }
    if (rest > 0) parts.push({ sub: x.sub, amt: rest });
  }
  return groupSum(parts, "sub");
}
// 細項多選：存成「早餐＋午餐」
export const subParts = (sub) => String(sub || "").split("＋").filter(Boolean);
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
  return sortItems(items.filter((x) => words.every((w) => (/^\d+$/.test(w) ? String(x.amt) === w : [x.note, x.cat, x.sub, x.pay, linesNote(x.lines || [])].some((f) => String(f || "").toLowerCase().includes(w))))));
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
    payAcct: Object.fromEntries(Object.entries(data.payAcct || {}).map(([k, v]) => [k === from ? to : k, v])),
  };
}
// 刪付款方式：以前的紀錄照舊寫著（只是選單裡沒有了）
export function removePay(data, name) {
  const { [name]: _, ...payAcct } = data.payAcct || {};
  return { ...data, pays: data.pays.filter((p) => p !== name), wheel: { ...data.wheel, pays: data.wheel.pays.filter((p) => p !== name) }, payAcct };
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
      date: x.date, note: str(x.note, 200), t: Number(x.t) || 0, ...(x.rec ? { rec: str(x.rec, 60) } : {}), ...(typeof x.acct === "string" && x.acct ? { acct: str(x.acct, 20) } : {}), ...(cleanLines(x.lines).length ? { lines: cleanLines(x.lines) } : {}) });
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
  const accounts = cleanAccounts(raw.accounts), aid = new Set(accounts.map((a) => a.id)), okA = (v) => (aid.has(v) ? v : "");
  const shortcuts = (Array.isArray(raw.shortcuts) ? raw.shortcuts : []).filter((s) => okType(s) || (s?.type === "move" && okA(s.from) && okA(s.to) && s.from !== s.to)).map((s) => (s.type === "move"
    ? { id: str(s.id || newId(), 60), label: str(s.label, 12), type: "move", from: s.from, to: s.to, amt: int(s.amt) > 0 ? int(s.amt) : 0, note: str(s.note, 200), ...(int(s.fee) > 0 ? { fee: int(s.fee) } : {}) }
    : { id: str(s.id || newId(), 60), label: str(s.label, 12), type: s.type, cat: str(s.cat, 12), sub: str(s.sub, 12), pay: str(s.pay, 12), amt: int(s.amt) > 0 ? int(s.amt) : 0, note: str(s.note, 200) }));
  const payAcct = {};
  for (const [k, v] of Object.entries(raw.payAcct || {})) if (pays.includes(k) && okA(v)) payAcct[k] = v;
  const moves = (Array.isArray(raw.moves) ? raw.moves : []).filter((m) => m && okA(m.from) && okA(m.to) && m.from !== m.to && int(m.amt) > 0 && isDate(m.date))
    .map((m) => ({ id: str(m.id || newId(), 60), from: m.from, to: m.to, amt: int(m.amt), date: m.date, note: str(m.note, 200), t: Number(m.t) || 0 }));
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
    v: 1, items, cats, pays, shortcuts, wheel: { cats: wheelCats, pays: wheelPays }, budget: { total: Math.max(0, int(raw.budget?.total)), cats: bc }, recurring, debts, goals, accounts, payAcct, moves,
    prefs: { theme: PALETTES[p.theme] ? p.theme : "terracotta", mode: ["auto", "light", "dark"].includes(p.mode) ? p.mode : "auto",
      monthStart: Math.min(28, Math.max(1, int(p.monthStart) || 1)), lastPay: pays.includes(p.lastPay) ? p.lastPay : pays[0] || "",
      bg: BACKGROUNDS[p.bg] ? p.bg : "paper", pattern: PATTERNS[p.pattern] ? p.pattern : "grid", keyH: clampKeyH(p.keyH),
      inAcct: okA(p.inAcct) || accounts[0].id, outAcct: okA(p.outAcct) || accounts[0].id,
      style: STYLES[p.style] ? p.style : "notebook", font: FONTS[p.font] ? p.font : "sans", radius: RADII[p.radius] ? p.radius : "m",
      bgImg: !!p.bgImg, veil: Math.min(90, Math.max(40, int(p.veil) || 45)), fabImg: !!p.fabImg, fabPlus: p.fabPlus !== false,
      ...(cleanCrop(p.bgCrop) ? { bgCrop: cleanCrop(p.bgCrop) } : {}), ...(cleanCrop(p.fabCrop) ? { fabCrop: cleanCrop(p.fabCrop) } : {}),
      ...(p.friend && parseLink("#link=" + encodeURIComponent(String(p.friend.url || "")) + "~" + String(p.friend.key || "")) ? { friend: { url: String(p.friend.url), key: String(p.friend.key), auto: p.friend.auto !== false } } : {}) },
    lastBackup: Number(raw.lastBackup) || 0,
    shops: cleanShops(raw.shops),
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
    recurring: byId(cur.recurring, add.recurring), debts: byId(cur.debts, add.debts), goals: byId(cur.goals, add.goals),
    accounts: byId(cur.accounts, add.accounts), moves: byId(cur.moves, add.moves), payAcct: { ...add.payAcct, ...cur.payAcct },
    shops: cleanShops([...(cur.shops || []), ...(add.shops || [])]) };
}

// 匯出成 Excel 打得開的 CSV（前面加 BOM，中文才不會變亂碼）
export function toCSV(items, moves = [], acctName = (id) => id) {
  const q = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const rows = [["日期", "收支", "分類", "細項", "付款方式", "金額", "備註"],
    ...sortItems([...items, ...moves.map((m) => ({ ...m, type: "move" }))]).reverse().map((x) => (x.type === "move" ? [x.date, "移動", `${acctName(x.from)} → ${acctName(x.to)}`, "", "", String(x.amt), x.note || ""]
      : [x.date, x.type === "in" ? "收入" : "支出", x.cat, x.sub || "", x.pay || "", String(x.amt), [x.note, linesNote(x.lines || [])].filter(Boolean).join("｜")]))];
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
  walnut: { name: "胡桃咖啡",
    light: { accent: "#7A4A24", "accent-strong": "#663C1B", "on-accent": "#FFF8EE", "accent-ink": "#6A3E1C", "accent-soft": "#EAD9BE" },
    dark: { accent: "#D9A86A", "accent-strong": "#E3B67D", "on-accent": "#2A2119", "accent-ink": "#E6BC85", "accent-soft": "#4A3726" } },
  graphite: { name: "墨黑",
    light: { accent: "#2B2B2B", "accent-strong": "#111111", "on-accent": "#FFFFFF", "accent-ink": "#2B2B2B", "accent-soft": "#ECEAE4" },
    dark: { accent: "#E8E6E0", "accent-strong": "#FFFFFF", "on-accent": "#1A1A1A", "accent-ink": "#E8E6E0", "accent-soft": "#33322F" } },
  gold: { name: "星夜金",
    light: { accent: "#2E3F7A", "accent-strong": "#24336A", "on-accent": "#FFFFFF", "accent-ink": "#2E3F7A", "accent-soft": "#E1E5F3" },
    dark: { accent: "#E8C268", "accent-strong": "#F0D186", "on-accent": "#1A1A2E", "accent-ink": "#F0D186", "accent-soft": "#2B3257" } },
  ocean: { name: "海藍綠",
    light: { accent: "#0E7680", "accent-strong": "#0B636B", "on-accent": "#FFFFFF", "accent-ink": "#0B6A73", "accent-soft": "#D2ECEF" },
    dark: { accent: "#5CC6CF", "accent-strong": "#7DD5DC", "on-accent": "#0D2228", "accent-ink": "#7DD5DC", "accent-soft": "#1B3E46" } },
  forest: { name: "森林綠",
    light: { accent: "#2F6B3A", "accent-strong": "#255A2F", "on-accent": "#FFFFFF", "accent-ink": "#2A5F33", "accent-soft": "#D6E7D2" },
    dark: { accent: "#8CC79A", "accent-strong": "#A3D4AE", "on-accent": "#142017", "accent-ink": "#A3D4AE", "accent-soft": "#23392A" } },
  ribbon: { name: "緞帶紅",
    light: { accent: "#C8233F", "accent-strong": "#A81D35", "on-accent": "#FFFFFF", "accent-ink": "#B81F3E", "accent-soft": "#FFE3EA" },
    dark: { accent: "#FF7A95", "accent-strong": "#FF95AA", "on-accent": "#2B171E", "accent-ink": "#FF95AA", "accent-soft": "#4D2633" } },
  sky: { name: "天空藍",
    light: { accent: "#0B70AA", "accent-strong": "#095E8F", "on-accent": "#FFFFFF", "accent-ink": "#0A6699", "accent-soft": "#D5ECF9" },
    dark: { accent: "#5BB8EE", "accent-strong": "#7CC8F2", "on-accent": "#0B2233", "accent-ink": "#7CC8F2", "accent-soft": "#18405C" } },
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
  kraft: { name: "牛皮紙", light: "#EBDEC5", dark: "#2A2119", muted: { light: "#523D2B", dark: "#BFA98A" } },
  receipt: { name: "收據灰", light: "#E4E2DD", dark: "#151515", muted: { light: "#555555", dark: "#A6A49E" } },
  night: { name: "夜藍", light: "#DCE3F2", dark: "#0F1A33", muted: { light: "#4A5677", dark: "#A9B4D0" } },
  ocean: { name: "海藍", light: "#E3F1F5", dark: "#0D2228", muted: { light: "#48656E", dark: "#9DBCC4" } },
  forest: { name: "森林綠", light: "#E6EFE2", dark: "#142017", muted: { light: "#4E6150", dark: "#A2B8A3" } },
  bow: { name: "蝴蝶結粉", light: "#FFF5F7", dark: "#2B171E", muted: { light: "#7D5865", dark: "#D3A9B6" } },
  pocket: { name: "天空藍", light: "#E8F4FB", dark: "#0B2233", muted: { light: "#46637A", dark: "#9FC0D6" } },
};
// 某個背景上的次要文字顏色
export const mutedOn = (bgId, mode) => C_BG(bgId).muted?.[mode] || MUTED[mode];
const C_BG = (id) => BACKGROUNDS[id] || BACKGROUNDS.paper;
export const PATTERNS = { grid: "方格", lines: "橫線", dots: "點點", plain: "素面", fiber: "牛皮紙", stars: "星點", waves: "波浪", leaves: "葉子", polka: "小圓點" };
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
    me: s(raw.me, 80), at: Number(raw.at) || 0, bot: /^@[\w.-]{1,30}$/.test(raw.bot || "") ? raw.bot : "",
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

// ---------------------------------------------------------------- 帳戶（郵局、錢包、信用卡）與「移動」
// 每筆支出從哪個帳戶扣：存的時候記在 x.acct；舊紀錄沒有就照「付款方式 → 帳戶」設定。收入進 prefs.inAcct。
// 朋友帳自動補的那份（fr-）不動帳戶：是朋友先付的，等於欠款。
function cleanAccounts(raw) {
  const out = [], seen = new Set();
  const day = (v, d) => Math.min(28, Math.max(1, int(v) || d));
  for (const a of Array.isArray(raw) ? raw : []) {
    const id = str(a?.id, 20), name = str(a?.name, 12).trim();
    if (!id || !name || seen.has(id) || !ACCT_TYPES[a.type]) continue;
    seen.add(id);
    out.push({ id, name, type: a.type, open: int(a.open), ...(a.type === "card" ? { card: { close: day(a.card?.close, 5), due: day(a.card?.due, 20), from: str(a.card?.from, 20) } } : {}) });
  }
  if (!out.length) out.push(...DEFAULT_ACCTS.map((a) => ({ ...a })));
  for (const a of out) if (a.card && (!seen.has(a.card.from) || a.card.from === a.id)) a.card.from = out.find((b) => b.type === "bank")?.id || out.find((b) => b.id !== a.id)?.id || "";
  return out;
}
const hasAcct = (data, id) => !!id && data.accounts.some((a) => a.id === id);
// 現在記一筆的話，會算到哪個帳戶
export function acctFor(data, type, pay) {
  if (type === "in") return hasAcct(data, data.prefs.inAcct) ? data.prefs.inAcct : data.accounts[0].id;
  const m = (data.payAcct || {})[pay];
  return hasAcct(data, m) ? m : hasAcct(data, data.prefs.outAcct) ? data.prefs.outAcct : data.accounts[0].id;
}
export function acctOf(data, x) {
  if (String(x.id).startsWith("fr-")) return null;
  return hasAcct(data, x.acct) ? x.acct : acctFor(data, x.type, x.pay);
}
// 各帳戶餘額（until：只算到那天為止）。信用卡是負的＝欠多少
export function acctBalances(data, until = null) {
  const bal = Object.fromEntries(data.accounts.map((a) => [a.id, a.open]));
  for (const x of data.items) {
    if (until && x.date > until) continue;
    const a = acctOf(data, x);
    if (a && a in bal) bal[a] += x.type === "in" ? x.amt : -x.amt;
  }
  for (const m of data.moves || []) {
    if (until && m.date > until) continue;
    if (m.from in bal) bal[m.from] -= m.amt;
    if (m.to in bal) bal[m.to] += m.amt;
  }
  return bal;
}
// 首頁要不要顯示帳戶列：設過起始餘額、或有過移動
export const acctShown = (data) => data.accounts.some((a) => a.open) || (data.moves || []).length > 0;
// 信用卡這期要繳多少：最近一次結帳日時欠的，扣掉結帳日之後繳的
export function cardBill(data, acct, today = ymd()) {
  if (acct.type !== "card" || !acct.card) return null;
  const [y, m, d] = today.split("-").map(Number), c = acct.card.close, cur = `${y}-${pad(m)}`;
  const closeMonth = d >= c ? cur : addMonths(cur, -1);
  const closeDate = `${closeMonth}-${pad(c)}`;
  const dueDate = `${acct.card.due > c ? closeMonth : addMonths(closeMonth, 1)}-${pad(acct.card.due)}`;
  const owed = -acctBalances(data, closeDate)[acct.id];
  const paid = (data.moves || []).filter((x) => x.to === acct.id && x.date > closeDate).reduce((a, x) => a + x.amt, 0);
  return { amount: Math.max(0, owed - paid), closeDate, dueDate };
}
// 快速設定：郵局＋錢包＋信用卡（已經有的同名帳戶、起始餘額留著）
export function presetAccounts(data) {
  const old = (id) => data.accounts.find((a) => a.id === id);
  const keep = data.accounts.filter((a) => !["bank", "cash", "card"].includes(a.id));
  const accounts = [{ id: "bank", name: old("bank")?.name || "郵局", type: "bank", open: old("bank")?.open || 0 }, { id: "cash", name: old("cash")?.name || "錢包", type: "cash", open: old("cash")?.open || 0 },
    { id: "card", name: old("card")?.name || "信用卡", type: "card", open: old("card")?.open || 0, card: old("card")?.card || { close: 5, due: 20, from: "bank" } }, ...keep];
  const payAcct = {};
  for (const p of data.pays) payAcct[p] = /現金/.test(p) ? "cash" : /信用卡/.test(p) ? "card" : "bank";
  return { ...data, accounts, payAcct, prefs: { ...data.prefs, inAcct: "bank", outAcct: "cash" } };
}
// 刪帳戶：至少留一個；設定指到它的改到第一個帳戶；紀錄的 acct 拿掉（之後照設定算）；用到它的移動、捷徑一起刪
export function removeAccount(data, id) {
  const accounts = data.accounts.filter((a) => a.id !== id);
  if (!accounts.length || accounts.length === data.accounts.length) return data;
  const first = accounts[0].id, fix = (v) => (v === id ? first : v);
  return {
    ...data, accounts: accounts.map((a) => (a.card?.from === id ? { ...a, card: { ...a.card, from: accounts.find((b) => b.id !== a.id)?.id || "" } } : a)),
    payAcct: Object.fromEntries(Object.entries(data.payAcct || {}).filter(([, v]) => v !== id)),
    items: data.items.map((x) => (x.acct === id ? (({ acct, ...r }) => r)(x) : x)),
    moves: (data.moves || []).filter((m) => m.from !== id && m.to !== id),
    shortcuts: data.shortcuts.filter((s) => !(s.type === "move" && (s.from === id || s.to === id))),
    prefs: { ...data.prefs, inAcct: fix(data.prefs.inAcct), outAcct: fix(data.prefs.outAcct) },
  };
}
export const acctName = (data, id) => data.accounts.find((a) => a.id === id)?.name || "?";
export const moveLabel = (data, m) => `${acctName(data, m.from)} → ${acctName(data, m.to)}`;
// 連動碼：8 碼（K7P2-9QXA，大小寫、有沒有「-」都可以）、舊的 20 碼，或整條連動連結，都轉成 { url, key }
export const FRIEND_API = "https://script.google.com/macros/s/AKfycbyqothbLbuXl9Sl44EwpeQ9y_N_VesXPMx_dlaBluNusy4fntcW2h9DobA1KjdggV_pdg/exec";
export function parseCode(text) {
  const s = String(text || "").trim();
  if (s.includes("#link=")) return parseLink(s.slice(s.indexOf("#link=")));
  const k = s.toUpperCase().replace(/[\s-]/g, "");
  if (/^[2-9A-HJKMNP-Z]{8}$/.test(k)) return { url: FRIEND_API, key: k };
  if (/^[0-9a-f]{20}$/i.test(k)) return { url: FRIEND_API, key: k.toLowerCase() };
  return null;
}

// ---------------------------------------------------------------- 備註明細（店家｜吃了什麼｜金額）
// 每列 { shop, what, amt }；三格都空的列丟掉；金額只收正整數（沒寫＝0）
export function cleanLines(raw) {
  if (!Array.isArray(raw)) return [];
  const q = (v) => Math.min(99, Math.max(1, Math.round(Number(v) || 1)));
  return raw.map((l) => ({ shop: String(l?.shop ?? "").trim().slice(0, 20), what: String(l?.what ?? "").trim().slice(0, 30), amt: Math.max(0, Math.round(Number(l?.amt) || 0)), ...(q(l?.qty) > 1 ? { qty: q(l.qty) } : {}), ...(String(l?.sub ?? "").trim() ? { sub: String(l.sub).trim().slice(0, 12) } : {}) }))
    .filter((l) => l.shop || l.what || l.amt).slice(0, 10);
}
export const linesTotal = (lines) => cleanLines(lines).reduce((a, l) => a + l.amt, 0);
// 「麥味登 蛋餅奶茶 75 ＋ 7-11 咖啡 45」
export const linesNote = (lines) => cleanLines(lines).map((l) => [l.shop, l.what && l.qty ? `${l.what}×${l.qty}` : l.what, l.amt ? String(l.amt) : ""].filter(Boolean).join(" ")).join(" ＋ ");
// 一份的價錢（金額是這一列的總額，有數量就除回去）
export const unitPrice = (l) => (l.amt ? Math.round(l.amt / (l.qty || 1)) : 0);
// 最近用過的店家（新的在前、不重複），給輸入框的建議清單
export function recentShops(items, n = 20) {
  const out = [];
  for (const x of [...items].sort((a, b) => (b.t || 0) - (a.t || 0))) for (const l of x.lines || []) if (l.shop && !out.includes(l.shop)) { out.push(l.shop); if (out.length >= n) return out; }
  return out;
}
// 清單裡把 name 往前（dir=-1）或往後（+1）移一格
export function moveIn(list, name, dir) {
  const a = [...list], i = a.indexOf(name), j = i + dir;
  if (i < 0 || j < 0 || j >= a.length) return a;
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}
// 清單裡兩個交換位置（扇形編輯：拖一格到另一格）
export function swapIn(list, a, b) {
  const x = [...list], i = x.indexOf(a), j = x.indexOf(b);
  if (i < 0 || j < 0) return x;
  [x[i], x[j]] = [x[j], x[i]];
  return x;
}

// ---------------------------------------------------------------- 主題風格：一鍵套整套（基本色、主色、背景、紋路、圓角、字體、裝飾）
// 套用後主色、背景、紋路、圓角、字體都還能自己再改；style 只決定「紙」的顏色（表面、字、線）和裝飾
// base：surface 卡片、s2 次要表面（鍵盤）、ink 字、line 線、line2 淡線、ok 正數、grid 方格線（rgba）、pc 紋路顏色（hex，畫 SVG 紋路用）
export const STYLES = {
  notebook: { name: "手帳", sub: "米白方格紙、陶土橘", palette: "terracotta", bg: "paper", pattern: "grid", radius: "m", font: "sans", deco: "",
    light: { surface: "#FCFCFA", s2: "#ECEAE4", ink: "#1F1B17", line: "#DCD8CF", line2: "#E7E4DD", ok: "#3F6B3A", grid: "rgb(62 95 130 / .075)", pc: "#C9D2DC" },
    dark: { surface: "#1F1D1A", s2: "#292622", ink: "#EEEAE3", line: "#38342E", line2: "#2C2925", ok: "#9CC08A", grid: "rgb(147 178 211 / .06)", pc: "#2F3640" } },
  kraft: { name: "牛皮紙", sub: "牛皮紙、深咖啡、紙膠帶", palette: "walnut", bg: "kraft", pattern: "fiber", radius: "s", font: "sans", deco: "tape",
    light: { surface: "#F3E9D7", s2: "#E6D7BC", ink: "#2C1F15", line: "#C6AC88", line2: "#D9C7A8", ok: "#3A5A2B", grid: "rgb(90 60 30 / .10)", pc: "#C9B28C", deco: "#C46B4E" },
    dark: { surface: "#352A20", s2: "#3E3126", ink: "#EFE3CF", line: "#4E3F31", line2: "#43362A", ok: "#A9C48C", grid: "rgb(239 227 207 / .05)", pc: "#3A2E23", deco: "#B5654A" } },
  receipt: { name: "收據", sub: "灰白紙、等寬字、鋸齒邊", palette: "graphite", bg: "receipt", pattern: "plain", radius: "s", font: "mono", deco: "receipt",
    light: { surface: "#FBFBF8", s2: "#EFEDE8", ink: "#1C1C1C", line: "#CFCCC4", line2: "#E2DFD8", ok: "#2F5E3A", grid: "rgb(0 0 0 / .06)", pc: "#C9C6BE" },
    dark: { surface: "#262624", s2: "#2E2E2B", ink: "#EDEDEA", line: "#3A3936", line2: "#31302E", ok: "#9BC79F", grid: "rgb(255 255 255 / .05)", pc: "#2C2C2A" } },
  night: { name: "夜空", sub: "深藍、星點、金色", palette: "gold", bg: "night", pattern: "stars", radius: "m", font: "sans", deco: "",
    light: { surface: "#F4F6FC", s2: "#E6EAF5", ink: "#14203D", line: "#C3CCE2", line2: "#D7DDEC", ok: "#2E6B45", grid: "rgb(46 63 122 / .08)", pc: "#9AA8CC" },
    dark: { surface: "#17244A", s2: "#1E2C57", ink: "#EEF1FA", line: "#2A3966", line2: "#233260", ok: "#9DD6A8", grid: "rgb(232 227 200 / .06)", pc: "#6F6E66" } },
  ocean: { name: "海洋", sub: "淺藍、波浪紋、湖水綠", palette: "ocean", bg: "ocean", pattern: "waves", radius: "l", font: "sans", deco: "",
    light: { surface: "#F7FCFD", s2: "#E6F3F6", ink: "#10303A", line: "#C4DDE4", line2: "#D5E8ED", ok: "#2E6B45", grid: "rgb(14 118 128 / .08)", pc: "#A9D2DC" },
    dark: { surface: "#133038", s2: "#183A43", ink: "#E3F3F6", line: "#24474F", line2: "#1D3D45", ok: "#9DD6A8", grid: "rgb(92 198 207 / .06)", pc: "#2A5560" } },
  forest: { name: "森林", sub: "淺綠、葉子紋、深綠", palette: "forest", bg: "forest", pattern: "leaves", radius: "m", font: "sans", deco: "",
    light: { surface: "#F7FAF5", s2: "#E8F0E5", ink: "#1B2A1C", line: "#C9D8C4", line2: "#DAE6D6", ok: "#2F6B3A", grid: "rgb(47 107 58 / .08)", pc: "#BCD2B5" },
    dark: { surface: "#1B2B1F", s2: "#213326", ink: "#E6F0E4", line: "#2D4331", line2: "#263A2A", ok: "#9DD6A8", grid: "rgb(140 199 154 / .06)", pc: "#2C4632" } },
  minimal: { name: "極簡", sub: "純白、沒有紋路、黑色", palette: "graphite", bg: "white", pattern: "plain", radius: "s", font: "sans", deco: "",
    light: { surface: "#FFFFFF", s2: "#F2F2F2", ink: "#111111", line: "#E4E4E4", line2: "#EEEEEE", ok: "#2F6B3A", grid: "rgb(0 0 0 / .05)", pc: "#E0E0E0" },
    dark: { surface: "#161616", s2: "#1D1D1D", ink: "#F2F2F2", line: "#2A2A2A", line2: "#222222", ok: "#9DD6A8", grid: "rgb(255 255 255 / .05)", pc: "#262626" } },
  bow: { name: "蝴蝶結", sub: "白底粉紅、紅色、蝴蝶結", palette: "ribbon", bg: "bow", pattern: "polka", radius: "l", font: "round", deco: "bow",
    light: { surface: "#FFFFFF", s2: "#FFF0F3", ink: "#3B1F2A", line: "#F5D5DE", line2: "#FAE3E9", ok: "#3F6B3A", grid: "rgb(200 35 63 / .07)", pc: "#F9D0DB", deco: "#E0294B" },
    dark: { surface: "#3A1F29", s2: "#45232F", ink: "#FBE9EE", line: "#55303D", line2: "#4A2834", ok: "#9CC08A", grid: "rgb(255 122 149 / .06)", pc: "#43252F", deco: "#FF7A95" } },
  pocket: { name: "口袋藍", sub: "天空藍＋白、紅色、黃色鈴鐺", palette: "sky", bg: "pocket", pattern: "plain", radius: "l", font: "round", deco: "bell",
    light: { surface: "#FFFFFF", s2: "#EEF7FC", ink: "#0E2A40", line: "#C7E2F2", line2: "#DCEEF8", ok: "#2E6B45", grid: "rgb(11 112 170 / .07)", pc: "#C4E1F2", deco: "#F4C02F", deco2: "#D93330" },
    dark: { surface: "#12314A", s2: "#163A55", ink: "#E6F3FC", line: "#1F4663", line2: "#1A3E58", ok: "#9DD6A8", grid: "rgb(91 184 238 / .06)", pc: "#1C4260", deco: "#F4C02F", deco2: "#E0504D" } },
};
export const FONTS = { sans: "一般", round: "圓體", mono: "等寬" };
export const RADII = { s: { name: "小", v: [2, 3, 6] }, m: { name: "中", v: [4, 6, 10] }, l: { name: "大", v: [10, 14, 20] } };
// 套用主題：一次設定主色、背景、紋路、圓角、字體（之後可以各自再改）
export const applyStyle = (prefs, id) => {
  const st = STYLES[id];
  return st ? { ...prefs, style: id, theme: st.palette, bg: st.bg, pattern: st.pattern, radius: st.radius, font: st.font } : prefs;
};
// 紋路的 CSS（背景圖＋大小）。grid 用 rgba 線、其他用 pc（SVG 紋路沒辦法吃 CSS 變數）
const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
export function patternCSS(kind, grid, pc) {
  if (kind === "grid") return [`linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`, "24px 24px"];
  if (kind === "lines") return [`linear-gradient(${grid} 1px, transparent 1px)`, "100% 28px"];
  if (kind === "dots") return [`radial-gradient(circle, ${pc} 1.1px, transparent 1.6px)`, "18px 18px"];
  if (kind === "fiber") return [`repeating-linear-gradient(115deg, ${grid} 0 1px, transparent 1px 7px), repeating-linear-gradient(25deg, ${grid} 0 1px, transparent 1px 11px)`, "auto"];
  if (kind === "stars") return [svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><g fill='${pc}'><circle cx='12' cy='18' r='1.2'/><circle cx='58' cy='9' r='.8'/><circle cx='74' cy='52' r='1.4'/><circle cx='33' cy='66' r='.9'/><circle cx='84' cy='83' r='.7'/><path d='M46 38l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z'/></g></svg>`), "90px 90px"];
  if (kind === "waves") return [svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='24'><path d='M0 12c10-8 20-8 30 0s20 8 30 0' fill='none' stroke='${pc}' stroke-width='1.4'/></svg>`), "60px 24px"];
  if (kind === "leaves") return [svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><g fill='none' stroke='${pc}' stroke-width='1.3'><path d='M14 30c8-14 22-16 28-12-4 8-16 18-28 12z'/><path d='M14 30l24-10'/><path d='M50 70c6-12 18-14 24-10-4 7-14 15-24 10z'/><path d='M50 70l20-9'/></g></svg>`), "80px 80px"];
  if (kind === "polka") return [`radial-gradient(${pc} 18%, transparent 20%)`, "28px 28px"];
  return ["none", "auto"];
}
// 裝飾用的小圖（自己畫的）：蝴蝶結、鈴鐺
export function decoSVG(kind, c) {
  if (kind === "bow") return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='26' height='18' viewBox='0 0 26 18'><path d='M13 9C9 3 3 1 2 4s1 10 4 11 5-3 7-6zM13 9c4-6 10-8 11-5s-1 10-4 11-5-3-7-6z' fill='${c}'/><circle cx='13' cy='9' r='2.6' fill='${c}' stroke='white' stroke-width='1'/></svg>`);
  if (kind === "bell") return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'><circle cx='9' cy='9' r='7.5' fill='${c}' stroke='%238A6A10' stroke-width='1'/><path d='M2.5 7.5h13' stroke='%238A6A10' stroke-width='1.2'/><circle cx='9' cy='11.5' r='1.6' fill='%236B520C'/></svg>`.replace(/%23/g, "#"));
  return "none";
}

// 圖片裁切的位置：框中心對到圖片的哪裡（0～1）、放大倍率（1～4）
export function cleanCrop(c) {
  if (!c || typeof c !== "object") return null;
  const x = Number(c.x), y = Number(c.y), z = Number(c.z);
  if (![x, y, z].every(Number.isFinite)) return null;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)), z: Math.min(4, Math.max(1, z)) };
}

// ---------------------------------------------------------------- 店家與菜單（明細學到的＋自己整理的）
// data.shops：使用者自己整理的部分 [{ name, cat?, sub?, menu: [{ what, amt, t }], hide: [品項], photos: [照片id], branches: [{ name, addr, url }] }]
// 照片存在 IndexedDB（app 的 photoKey），這裡只記 id；舊資料的 photo: true ＝ photos: ["0"]
// 學到的（去過幾次、點過什麼、多少錢）不存，每次從紀錄的 lines 算
export function cleanShops(raw) {
  if (!Array.isArray(raw)) return [];
  const m = new Map();
  for (const s of raw) {
    const name = String(s?.name ?? "").trim().slice(0, 20);
    if (!name) continue;
    const cur = m.get(name) || { name, menu: [], hide: [], photos: [], branches: [] };
    if (s.cat && !cur.cat) { cur.cat = String(s.cat).slice(0, 12); cur.sub = String(s.sub ?? "").slice(0, 30); }
    for (const x of Array.isArray(s.menu) ? s.menu : []) {
      const what = String(x?.what ?? "").trim().slice(0, 30);
      if (!what || cur.menu.some((y) => y.what === what)) continue;
      cur.menu.push({ what, amt: Math.max(0, Math.round(Number(x.amt) || 0)), t: Number(x.t) || 0 });
    }
    for (const h of Array.isArray(s.hide) ? s.hide : []) { const w = String(h ?? "").trim().slice(0, 30); if (w && !cur.hide.includes(w)) cur.hide.push(w); }
    const ids = [...(s.photo ? ["0"] : []), ...(Array.isArray(s.photos) ? s.photos : [])].map((x) => String(x ?? "")).filter((x) => /^[\w-]{1,24}$/.test(x));
    for (const id of ids) if (!cur.photos.includes(id)) cur.photos.push(id);
    for (const b of Array.isArray(s.branches) ? s.branches : []) {
      const url = String(b?.url ?? "").trim(), x = { name: String(b?.name ?? "").trim().slice(0, 20), addr: String(b?.addr ?? "").trim().slice(0, 120), url: /^https?:\/\//i.test(url) ? url.slice(0, 500) : "" };
      if ((x.name || x.addr || x.url) && !cur.branches.some((y) => y.name === x.name && y.addr === x.addr && y.url === x.url)) cur.branches.push(x);
    }
    cur.menu = cur.menu.slice(0, 60); cur.hide = cur.hide.slice(0, 100); cur.photos = cur.photos.slice(0, 12); cur.branches = cur.branches.slice(0, 20);
    const tag = String(s.tag ?? "").trim().slice(0, 12);
    if (tag && !cur.tag) cur.tag = tag;
    if (s.hidden) { cur.hidden = true; cur.hiddenAt = Math.max(cur.hiddenAt || 0, Number(s.hiddenAt) || 0); }
    m.set(name, cur);
  }
  return [...m.values()].slice(0, 300);
}
// 每家店：{ name, count, lastT, cat, sub, menu: [{ what, amt, sub, count, lastT, mine }], lastOrder: [lines], photo, photos, branches, own }
export function shopIndex(items, shops = []) {
  const m = new Map();
  const get = (name) => m.get(name) || (m.set(name, { name, count: 0, lastT: 0, cat: "", sub: "", menu: new Map(), lastOrder: [], photo: false, photos: [], branches: [], own: null }), m.get(name));
  for (const x of items) {
    if (x.type !== "out") continue;
    const ls = cleanLines(x.lines || []), t = x.t || Date.parse(x.date) || 0, seen = new Set();
    for (const l of ls) {
      if (!l.shop) continue;
      const s = get(l.shop);
      if (!seen.has(l.shop)) {
        seen.add(l.shop); s.count++;
        if (t >= s.lastT) { s.lastT = t; s.cat = x.cat; s.sub = x.sub || ""; s.lastOrder = ls.filter((y) => y.shop === l.shop); }
      }
      if (!l.what) continue;
      const it = s.menu.get(l.what) || { what: l.what, amt: 0, sub: "", count: 0, lastT: -1, mine: false };
      it.count++;
      if (t >= it.lastT) { it.lastT = t; if (l.amt) it.amt = unitPrice(l); it.sub = l.sub || ""; }
      s.menu.set(l.what, it);
    }
  }
  for (const own of shops) {
    const s = get(own.name);
    s.own = own; s.photos = own.photos || []; s.branches = own.branches || []; s.photo = s.photos.length > 0; s.tag = own.tag || "";
    if (own.cat) { s.cat = own.cat; s.sub = own.sub || ""; }
    for (const x of own.menu) {
      const it = s.menu.get(x.what);
      if (!it) s.menu.set(x.what, { what: x.what, amt: x.amt, sub: "", count: 0, lastT: x.t, mine: true });
      else { it.mine = true; if (x.t >= it.lastT && x.amt) { it.amt = x.amt; it.lastT = x.t; } }
    }
    for (const h of own.hide) { const it = s.menu.get(h); if (it && !own.menu.some((y) => y.what === h)) s.menu.delete(h); }
  }
  // 刪掉的店家藏起來；刪掉之後又記到這家（比刪掉的時間新）就再出現
  return [...m.values()].filter((s) => !(s.own?.hidden && !(s.lastT > (s.own.hiddenAt || 0))))
    .map((s) => ({ ...s, tag: s.tag || "", menu: [...s.menu.values()].sort((a, b) => b.count - a.count || b.lastT - a.lastT) }));
}
// 店家類別：預設幾個＋已經用過的
export const SHOP_TAGS = ["早餐店", "飲料店", "餐廳", "小吃", "超商", "超市"];
export const shopTags = (shops = []) => [...new Set([...SHOP_TAGS, ...shops.map((s) => s.tag).filter(Boolean)])];
// 刪掉店家：自己整理的全部清掉；從明細學到的店（以前記過）留一筆「藏起來」，免得馬上又從紀錄冒出來
export function removeShop(data, name, now = Date.now()) {
  const learned = (data.items || []).some((x) => (x.lines || []).some((l) => l.shop === name));
  const rest = (data.shops || []).filter((s) => s.name !== name);
  return { ...data, shops: learned ? cleanShops([...rest, { name, hidden: true, hiddenAt: now }]) : rest };
}
export const findShop = (index, name) => index.find((s) => s.name === String(name ?? "").trim()) || null;
// 常去的：次數多的在前，一樣多比最近一次
export const topShops = (index, n = 5) => index.filter((s) => s.count > 0).sort((a, b) => b.count - a.count || b.lastT - a.lastT).slice(0, n);
// 改店名（改成已經有的名字＝合併）：紀錄的明細一起改；自己整理的菜單合併
export function renameShop(data, from, to) {
  to = String(to ?? "").trim().slice(0, 20);
  if (!to || from === to) return data;
  const items = data.items.map((x) => (x.lines?.some((l) => l.shop === from) ? { ...x, lines: x.lines.map((l) => (l.shop === from ? { ...l, shop: to } : l)) } : x));
  const shops = data.shops || [], a = shops.find((s) => s.name === from), b = shops.find((s) => s.name === to);
  let next = shops.filter((s) => s.name !== from && s.name !== to);
  if (a || b) {
    const base = b || { name: to, menu: [], hide: [], photos: [], branches: [] };
    const add = a || { menu: [], hide: [], photos: [], branches: [] };
    next = [...next, { ...base, name: to, ...(base.cat ? {} : add.cat ? { cat: add.cat, sub: add.sub || "" } : {}),
      menu: [...base.menu, ...add.menu.filter((x) => !base.menu.some((y) => y.what === x.what))],
      hide: [...new Set([...(base.hide || []), ...(add.hide || [])])], photos: [...new Set([...(base.photos || []), ...(add.photos || [])])], tag: base.tag || add.tag || "",
      branches: [...(base.branches || []), ...(add.branches || [])] }];
  }
  return { ...data, items, shops: cleanShops(next) };
}
// 改自己整理的部分（沒有就新增）
export function setShop(data, name, patch) {
  const shops = data.shops || [], cur = shops.find((s) => s.name === name) || { name, menu: [], hide: [], photos: [], branches: [] };
  const next = { ...cur, ...patch };
  if (patch.cat === "") { delete next.cat; delete next.sub; }
  delete next.hidden; delete next.hiddenAt;          // 自己新增、改這家店＝要它：之前刪掉（藏起來）的就再出現
  return { ...data, shops: cleanShops([...shops.filter((s) => s.name !== name), next]) };
}
export const delShop = (data, name) => ({ ...data, shops: (data.shops || []).filter((s) => s.name !== name) });

// ---------------------------------------------------------------- 統計：點進去看是哪幾筆、付款方式拆朋友帳、店家排行、每天
// 一筆在各細項的分法（跟 bySub 一樣）：明細有選細項的先分過去，剩下算 x.sub
function subSplit(x) {
  const out = [];
  let rest = x.amt;
  for (const l of (x.lines || []).filter((l) => l.sub && l.amt > 0)) { const a = Math.min(l.amt, rest); if (a > 0) { out.push({ sub: l.sub, amt: a }); rest -= a; } }
  if (rest > 0) out.push({ sub: x.sub || "", amt: rest });
  return out;
}
const isFrNoPay = (x) => String(x.id).startsWith("fr-") && !x.pay;
// 一筆在各店家花了多少：明細合計比這筆大（例如朋友帳只分到一部分）就照比例縮成這筆的金額
function shopAmounts(x) {
  const ls = cleanLines(x.lines || []).filter((l) => l.shop), tot = ls.reduce((a, l) => a + l.amt, 0), k = tot > x.amt ? x.amt / tot : 1, m = new Map();
  for (const l of ls) m.set(l.shop, (m.get(l.shop) || 0) + l.amt * k);
  for (const [s, v] of m) m.set(s, Math.round(v));
  return m;
}
// 統計某一列是哪幾筆：f＝{ cat } | { cat, sub } | { pay }（"@fr"＝朋友帳那份，""＝沒寫）| { shop } | { day }；回傳 [{ item, amt }]，amt＝算在這一列的部分，新的在前
export function statItems(items, type, f) {
  const out = [];
  for (const x of sortItems(items)) {
    if (x.type !== type) continue;
    let amt = 0;
    if ("sub" in f) amt = x.cat === f.cat ? subSplit(x).filter((p) => p.sub === f.sub).reduce((a, p) => a + p.amt, 0) : 0;
    else if ("cat" in f) amt = x.cat === f.cat ? x.amt : 0;
    else if ("pay" in f) amt = (f.pay === "@fr" ? isFrNoPay(x) : f.pay === "" ? !x.pay && !isFrNoPay(x) : x.pay === f.pay) ? x.amt : 0;
    else if ("shop" in f) amt = shopAmounts(x).get(f.shop) || 0;
    else if ("day" in f) amt = x.date === f.day ? x.amt : 0;
    if (amt > 0) out.push({ item: x, amt });
  }
  return out;
}
// 付款方式加總，朋友帳那份（朋友先付、沒寫付款方式）另外一列 "@fr"
export function payBreakdown(items, type = "out") {
  return groupSum(items.filter((x) => x.type === type).map((x) => ({ amt: x.amt, k: isFrNoPay(x) ? "@fr" : x.pay || "" })), "k").map(({ name, amt, share }) => ({ key: name, amt, share }));
}
// 店家排行（從明細）：[{ name, amt, count }]，金額大的在前
export function byShop(items) {
  const m = new Map();
  for (const x of items) {
    if (x.type !== "out") continue;
    for (const [name, amt] of shopAmounts(x)) {
      const s = m.get(name) || { name, amt: 0, count: 0 };
      s.amt += amt; s.count++;
      m.set(name, s);
    }
  }
  return [...m.values()].filter((s) => s.amt > 0).sort((a, b) => b.amt - a.amt || b.count - a.count);
}
// 這一期每一天的金額：[{ date, amt }]（沒花錢的日子是 0）
export function dailyTotals(items, key, s = 1, type = "out") {
  const [a, b] = periodRange(key, s), sum = {};
  for (const x of items) if (x.type === type && x.date >= a && x.date <= b) sum[x.date] = (sum[x.date] || 0) + x.amt;
  const out = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push({ date: d, amt: sum[d] || 0 });
  return out;
}

// ---------------------------------------------------------------- 依時間猜是哪一餐（分類裡有這個細項才用）
// 05:00–11:59 早餐、12:00–14:29 午餐、14:30–16:59 點心、17:00–22:59 晚餐、23:00 以後宵夜（沒有「宵夜」細項就不猜）
export const MEAL_TIMES = [[300, "早餐"], [720, "午餐"], [870, "點心"], [1020, "晚餐"], [1380, "宵夜"]];
export function mealByTime(subs, when = new Date()) {
  const m = when.getHours() * 60 + when.getMinutes();
  if (!Array.isArray(subs) || !subs.some((s) => MEAL_TIMES.some(([, n]) => n === s))) return "";
  if (m < 300) return subs.includes("宵夜") ? "宵夜" : "";
  let name = "";
  for (const [t, n] of MEAL_TIMES) if (m >= t) name = n;
  return subs.includes(name) ? name : "";
}

// ---------------------------------------------------------------- Google 地圖查到的地址、分店名整理
// 地址：拿掉郵遞區號後面的「台灣／臺灣」
export const cleanAddr = (a) => String(a || "").trim().replace(/^(\d{3,6})?\s*(台灣|臺灣)\s*/, "$1");
const looksAddr = (s) => /[縣市區鄉鎮].*[路街道巷弄段號]|\d+\s*號/.test(s);
// 分店名：Google 給的名稱常是「地址＋店名」（621005嘉義縣…181號麥味登 民雄中正店）→ 先切掉前面的地址；
// 名稱裡有這家店的店名才把剩下的當分店名（民雄中正店），判斷不出來就回空字串，不硬填
// Google 給的名稱前面常黏著地址，切掉
export function stripAddr(place) {
  const s = String(place || "").trim(), m = /^(\d{3,6})?\s*(台灣|臺灣)?\s*\S*?[縣市]\S*?(號|樓)(之\d+)?(\d+\s*樓)?\s*/.exec(s);
  return (m ? s.slice(m[0].length) : s).trim();
}
// 像分店名的才算（結尾是 店／館／門市，例如 民雄中正店、101 館）；「義式料理」這種是店名的一部分，不算
const isBranch = (s) => !!s && !looksAddr(s) && /(店|館|門市)$/.test(s) && s.length <= 20;
const trimSep = (s) => s.replace(/^[\s\-－–|｜/（(・·]+|[\s)）]+$/g, "").trim();
export function branchFromPlace(place, shop) {
  const s = stripAddr(place);
  shop = String(shop || "").trim();
  if (!s || !shop || !s.includes(shop)) return "";
  const rest = trimSep(s.replace(shop, ""));
  return isBranch(rest) ? rest : "";
}
// 新增店家時貼地圖網址：拆成店名＋分店名（「麥味登 民雄中正店」→ 麥味登／民雄中正店；「八方雲集(中山店)」→ 八方雲集／中山店）；拆不出分店就整個當店名
export function placeParts(place) {
  const s = stripAddr(place);
  if (!s) return { shop: "", branch: "" };
  const m = /^(.+?)[\s\-－–|｜/・·]*[（(]([^）)]+)[）)]$/.exec(s) || /^(.+?)[\s\-－–|｜/・·]+(\S+)$/.exec(s);
  if (m && isBranch(m[2].trim()) && m[1].trim()) return { shop: m[1].trim().slice(0, 20), branch: m[2].trim() };
  return { shop: s.slice(0, 20), branch: "" };
}
